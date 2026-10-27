/* ---------- The Drowned Belfry's three bosses: Super Fiend-class, cel-shaded and three-dimensional ----------
   THALASSOR THE BELL-CARRIER: a colossal hermit crab that wears the cathedral's great bronze bell as its shell: a
   blue-grey chitin body on eight angular legs, a left claw twice the right, two eyes on stalks, barnacles. It scuttles
   round the flooded baptism font. Claw Sweep marks a cone and swings; Toll rings the bell on its back and sends rings
   of water out with gaps to slip through; Scuttle marks a lane and charges down it; every so often it draws into the
   bell (Bell Shelter: nothing gets through the bronze) and spits brine from under the rim: strike one of the three
   clapper chains hanging round the font to ring the bell and it staggers out, flipped, its soft belly bared. Phase two
   brings the brood up from the font and doubles the toll.
   It is never still: it breathes, rocks on its legs as it scuttles (each step a splash and a thud), leans into its
   charges, works its mouthparts, watches the pet and blinks; before every blow it crouches and its eyes blaze, the
   claw draws back and snaps through with follow-through, the bell rocks after a toll; struck, it flinches; rung out,
   it kicks on its back, dizzy. */
RiftFiend.define({ id: 'thalassor', name: 'Thalassor', title: 'The Bell-Carrier', color: '#4F6F8A', glow: '#61D9D2', accent: '#DFFFF8', biome: 'belfry', r: 2.6, els: ['water', 'dark'] }, (() => {
  const { TAU, TN, frame, tube, tubeLite, limb, ell, sorted, hit, wetFloor, seaSky } = RiftFiend;
  const CHIT = '#4F6F8A', CHIT_SH = '#2E4358', CHIT_HI = '#8FB0C8', LINE = '#16243A', BRONZE = '#9A7A3A', BRONZE_SH = '#5C4620', BRONZE_HI = '#E0C478', CREAM = '#F2E8D2', CREAM_SH = '#C9B892', CYAN = '#61D9D2', IVORY = '#E7D9B1', IVORY_SH = '#B9A98A';
  const BS = 0.9, CH_A = [Math.PI / 2 + 0.5, Math.PI / 2 + 0.5 + TAU / 3, Math.PI / 2 + 0.5 - TAU / 3];
  const chainAt = (C, i) => [C.x + Math.cos(CH_A[i]) * (C.R - 2.2), C.y + Math.sin(CH_A[i]) * (C.R - 2.2)];
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k);
  // a strike's follow-through: 0..1 of its time, overshooting to 1.2 in the first quarter and settling back
  const snap = u => u < 0.25 ? 1.2 * Math.sin(u / 0.25 * Math.PI / 2) : 1.2 * Math.cos((u - 0.25) / 0.75 * Math.PI / 2);
  return {
    arenaR: 15, firstAct: 'circle',
    artPoses: [{ name: 'scuttling, side on', mem: { hd: 0.1, gait: 1, spdK: 1 } }, { name: 'claw raised for a sweep', mem: { hd: 1.57, raise: 1, menace: 1, crouch: 0.6 } }, { name: 'tolling', mem: { hd: 1.2, toll: 1, ring: 0.8 } }, { name: 'drawn into the bell', mem: { hd: 1.57, hide: 1 } }, { name: 'rung out: flipped, belly bared', mem: { hd: 1.57, flip: 1 } }],
    phaseNames: ['The Baptism', 'The Brood Rises', 'The Drowning Toll', 'The Last Toll'],
    paintGround(c, A) { wetFloor(c, A, { mid: '#1C3A42', edge: '#102A32', extra: (c2, A2) => {
      // the font's rim: a ring of pale stone with a channel of deeper water inside it; the three chain plinths
      const R = A2.R; c2.strokeStyle = 'rgba(200,204,188,.35)'; c2.lineWidth = 1.1; c2.beginPath(); c2.arc(0, 0, R - 0.9, 0, TAU); c2.stroke(); c2.strokeStyle = 'rgba(20,60,80,.5)'; c2.lineWidth = 0.6; c2.beginPath(); c2.arc(0, 0, R - 1.7, 0, TAU); c2.stroke();
      CH_A.forEach(a => { const x = Math.cos(a) * (R - 2.2), y = Math.sin(a) * (R - 2.2); c2.fillStyle = '#3E4F58'; c2.beginPath(); c2.ellipse(x, y + 0.3, 1.1, 0.5, 0, 0, TAU); c2.fill(); c2.strokeStyle = 'rgba(0,0,0,.5)'; c2.lineWidth = 0.08; c2.stroke(); });
      // the baptism pool at the centre: a deeper dark circle with a brass drain
      const g = c2.createRadialGradient(0, 0, 0.2, 0, 0, 2.6); g.addColorStop(0, '#06141C'); g.addColorStop(0.7, '#0E2A34'); g.addColorStop(1, 'rgba(14,42,52,0)'); c2.fillStyle = g; c2.beginPath(); c2.arc(0, 0, 2.6, 0, TAU); c2.fill(); c2.strokeStyle = '#957943'; c2.lineWidth = 0.14; c2.beginPath(); c2.arc(0, 0, 0.6, 0, TAU); c2.stroke(); } }); },
    sky(c, W, H, t, cam, T) { seaSky(c, W, H, t, cam, T, { silhouette: (c2, W2, H2) => { c2.save(); c2.globalAlpha = 0.25; c2.fillStyle = '#1F4552'; const bx = W2 * 0.22 - (cam.x - 28) * T * 0.05, by = H2 * 0.3; c2.beginPath(); c2.moveTo(bx - 40, by + 120); c2.lineTo(bx - 28, by - 60); c2.lineTo(bx + 28, by - 60); c2.lineTo(bx + 40, by + 120); c2.closePath(); c2.fill(); c2.beginPath(); c2.moveTo(bx - 30, by - 60); c2.lineTo(bx, by - 110); c2.lineTo(bx + 30, by - 60); c2.fill(); c2.restore(); } }); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem; M.gait = 0; M.spdK = 0; M.raise = 0; M.toll = 0; M.hide = 0; M.flip = 0; M.sigT = 16; M.broodT = 14; M.chains = CH_A.map(() => ({ obj: null, respawnT: 0 })); M.hd = Math.PI / 2; FX.m.act = 'enter';
      Object.assign(M, { vx: 0, vy: 0, px: FX.m.x, py: FX.m.y, lean: 0, roll: 0, menace: 0, crouch: 0, swing: 0, swingT: 0, ring: 0, ringT: 0, roar: 0, lunge: 0, slam: 0, recoil: 0, blink: 0, blinkT: 2, clack: 0, clackT: 1.5, splT: 0, bubT: 0, wasEnter: true, roared: false, bt: 0 });
      CH_A.forEach((a, i) => spawnChain(FX, i)); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; M.sigT = 5; M.broodT = 3; M.roar = 1; M.menace = 1; M.raise = 1; FX.H.shake(10, 0.5); FX.H.flash(0.2, CYAN); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - 2.5, CYAN, 18, 7); for (let i = 0; i < 10; i++) bubble(FX, m.x + FX.rnd(-2.5, 2.5), m.y + FX.rnd(-1, 1.5), 1);
      if (lv >= 2) FX.H.banner('The brood rises', 'Crawlers climb from the font; the toll comes twice', CYAN, 2.2); if (lv >= 4) FX.H.banner('The Last Toll', 'It never stops tolling', '#FF6A5A', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, C = FX.C, me = FX.me, P = FX.S.lv, fast = (1 + (P - 1) * 0.1) * FX.S.fast, d = FX.dist(m.x, m.y), aPet = FX.angPet(m.x, m.y);
      M.sigT -= dt; M.broodT -= dt;
      M.chains.forEach((h, i) => { if ((!h.obj || h.obj.dead) && !h.respawnT) h.respawnT = 9; if (h.respawnT) { h.respawnT -= dt; if (h.respawnT <= 0) { h.respawnT = 0; spawnChain(FX, i); } } });
      if (P >= 2 && M.broodT <= 0 && m.act !== 'hide') { M.broodT = P >= 4 ? 9 : 13; for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; FX.minion('crawler', C.x + Math.cos(a) * 2, C.y + Math.sin(a) * 2); } FX.H.text(C.x, C.y - 1.5, 'The brood climbs from the font', CYAN, 13); }
      m.actT += dt; let vx = 0, vy = 0, menace = 0, crouch = 0;
      switch (m.act) {
        case 'circle': {   // scuttles round the pet sideways, then chooses
          const dd = FX.circlePet(m, dt, 6.5, 4.2 * fast); M.raise = Math.max(0, M.raise - dt * 2);
          if (m.actT > (P >= 3 ? 1.3 : 1.9)) { m.actT = 0; M.cDir = Math.random() < 0.5 ? 1 : -1;
            if (M.sigT <= 0) { startHide(FX, m); break; }
            const r = Math.random(); if (d < 6.5 && r < 0.45) startSweep(FX, m); else if (r < 0.7) startToll(FX, m); else startScuttle(FX, m); }
          break; }
        case 'sweep': { M.raise = Math.min(1, M.raise + dt * 3); m.face = Math.cos(M.sa) >= 0 ? 1 : -1; menace = M.swing > 0 ? 0 : 1; crouch = M.swing > 0 ? 0 : 0.7; if (m.actT > 1.6 / fast) { m.act = 'circle'; m.actT = 0; } break; }
        case 'toll': { M.toll = Math.min(1, M.toll + dt * 4); menace = 0.6; crouch = M.ring > 0 ? 0 : 0.5; if (m.actT > 1.3) { M.toll = 0; m.act = 'circle'; m.actT = 0; } break; }
        case 'aim': { m.face = Math.cos(M.chA) >= 0 ? 1 : -1; menace = 1; crouch = 1; if (m.actT >= 0.9) { m.act = 'charge'; m.actT = 0; M.recoil = 0; M.lunge = 1; FX.H.sfx.whoosh && FX.H.sfx.whoosh(); FX.H.sfx.crash(); } break; }
        case 'charge': { const sp = 15 * fast; vx = Math.cos(M.chA) * sp; vy = Math.sin(M.chA) * sp; M.chLeft -= sp * dt; M.gait += dt * 14; menace = 0.8;
          if (Math.hypot(me.x - m.x, me.y - m.y) < m.r + me.r + 0.3 && !M.chHit) { if (FX.hurt(m.dmg * 1.8)) { M.chHit = true; me.push = { vx: Math.cos(M.chA + Math.PI / 2) * 12, vy: Math.sin(M.chA + Math.PI / 2) * 12, t: 0.25 }; } }
          if (M.chLeft <= 0 || !FX.inArena(m.x + Math.cos(M.chA) * (m.r + 0.6), m.y + Math.sin(M.chA) * (m.r + 0.6))) { FX.H.shake(8, 0.3); FX.H.boom(m.x, m.y, 2, CYAN, '#FFFFFF', { n: 14, shake: 6, smoke: 3 }); M.recoil = 1; m.act = 'circle'; m.actT = 0; }
          break; }
        case 'hide': {   // drawn into the bell: armoured; brine spat from under the rim; a chain rung brings it out
          M.hide = Math.min(1, M.hide + dt * 2.5); M.spitT = (M.spitT || 0) - dt; menace = 0.4; if (M.spitT <= 0) { M.spitT = P >= 3 ? 0.55 : 0.8; FX.fan(m.x, m.y, aPet + (Math.random() - 0.5) * 0.6, 3, 0.5, 6.5 * fast, { dmg: m.dmg * 0.5, color: '#9FE8FF', core: '#FFFFFF', r: 0.26 }); for (let i = 0; i < 3; i++) bubble(FX, m.x + Math.cos(aPet) * 1.8 + FX.rnd(-0.6, 0.6), m.y + Math.sin(aPet) * 1.8, 0.6); }
          if (m.actT > 12) { endHide(FX, m, false); }
          break; }
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3); M.crouch = toward(M.crouch, crouch, dt, crouch > M.crouch ? 4 : 7);
      if (m.act !== 'charge' && m.act !== 'hide') { if (m.act !== 'circle') M.spdK *= Math.pow(0.02, dt); }
      if (m.act === 'charge') { const b = [m.x, m.y]; FX.H.moveEnt(m, vx * dt, vy * dt, 1); const sp = Math.hypot(m.x - b[0], m.y - b[1]) / Math.max(dt, 1e-4); M.spdK = Math.min(1, sp / 8); }
      // heading: where it moves, or at the pet
      const want = m.act === 'charge' || m.act === 'aim' ? M.chA : m.act === 'sweep' || m.act === 'toll' || m.act === 'hide' ? (m.act === 'sweep' ? M.sa : aPet) : aPet + (M.cDir || 1) * Math.PI / 2;   // (it scuttles side-on, and squares up to strike) M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * (m.act === 'charge' ? 8 : 3)));
      // its steps leave brine
      M.stepT = (M.stepT || 0) - dt; if (M.spdK > 0.3 && M.stepT <= 0 && m.act !== 'hide') { M.stepT = 0.5; brine(FX, m.x + FX.rnd(-1.2, 1.2), m.y + FX.rnd(-0.4, 0.8), 0.8, 5); }
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.flip = Math.min(1, M.flip + dt * 3); M.hide = Math.max(0, M.hide - dt * 4); M.menace = decay(M.menace, dt, 4); M.crouch = decay(M.crouch, dt, 4); const p = bellyAt(m, M); FX.weak('belly', p[0], p[1], 1.5, 2.4, true); if (m.stunT <= 0.05) FX.weak('belly', 0, 0, 0, 0, false);
      // kicking on its back: a splash and a spark now and then
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.45; bubble(FX, m.x + FX.rnd(-2.6, 2.6), m.y + FX.rnd(-0.5, 1.2), 0.7); FX.H.shake(1.5, 0.08); }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return; if (!(m.stunT > 0)) { M.flip = Math.max(0, M.flip - dt * 2); if (FX.S.weak.belly) FX.weak('belly', 0, 0, 0, 0, false); } M.bt = (M.bt || 0) + dt;
      // where it is going: the body leans into it and rocks with its stride
      if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt; M.px = m.x; M.py = m.y; M.vx = toward(M.vx, vx, dt, 8); M.vy = toward(M.vy, vy, dt, 8); }
      const hd = M.hd == null ? Math.PI / 2 : M.hd, fwd = M.vx * Math.cos(hd) + M.vy * Math.sin(hd), side = -M.vx * Math.sin(hd) + M.vy * Math.cos(hd);
      M.lean = toward(M.lean, -fwd * 0.018, dt, 6); M.roll = toward(M.roll, side * 0.02, dt, 6);
      // the gait: each foot that lands splashes, and a heavy step shakes the ground a little
      const g0 = M.gait || 0; M.gait = g0 + dt * (0.8 + (M.spdK || 0) * 6); M.splT = (M.splT || 0) - dt;
      if (M.spdK > 0.3 && !(M.hide > 0.3) && !(M.flip > 0.3) && M.splT <= 0) { const W = crabFrame(m, M);
        for (let i = 0; i < 4 && M.splT <= 0; i++) for (const sd of [-1, 1]) { const ph0 = ((g0 + i * 1.6 + (sd > 0 ? Math.PI : 0)) % TAU + TAU) % TAU, ph1 = ((M.gait + i * 1.6 + (sd > 0 ? Math.PI : 0)) % TAU + TAU) % TAU; if (ph0 < Math.PI && ph1 >= Math.PI) { const ft = W((1.4 - i * 0.95) * 1.3, sd * 3.3, 0); for (let k = 0; k < 2; k++) bubble(FX, ft[0] + FX.rnd(-0.2, 0.2), ft[1] + FX.rnd(-0.1, 0.1), 0.35 + M.spdK * 0.3); if (M.spdK > 0.6) { FX.H.shake(1 + M.spdK * 1.4, 0.07); if (Math.random() < 0.3) FX.H.sfx.thud && FX.H.sfx.thud(); } M.splT = 0.07; break; } } }
      // the follow-through of a blow, the bell rocking after a toll, the roar, the recoil of a charge brought up short
      if (M.swing > 0) { M.swingT += dt; M.swing = M.swingT > 0.7 ? 0 : 1; } if (M.ring > 0) { M.ringT += dt; M.ring = Math.max(0, 1 - M.ringT / 1.6); }
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.5); M.slam = decay(M.slam, dt, 2.2); if (m.act !== 'enter' && m.act !== 'aim' && m.act !== 'charge') M.lunge = decay(M.lunge, dt, 3); if (m.act === 'charge') M.lunge = decay(M.lunge, dt, 1.5);
      // the eyes blink; the mouthparts work, and clack when it is hungry
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 3 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.12; M.blink = Math.sin(Math.min(1, M.blinkU) * Math.PI); if (M.blinkU >= 1) { M.blinkU = null; M.blink = 0; } }
      M.clackT -= dt; if (M.clackT <= 0) { M.clackT = 1.2 + Math.random() * 2.4; M.clackU = 0; } if (M.clackU != null) { M.clackU += dt / 0.35; M.clack = Math.pow(Math.sin(Math.min(1, M.clackU) * Math.PI), 0.6); if (M.clackU >= 1) { M.clackU = null; M.clack = 0; } }
      // hidden in the bell, it bubbles
      if (M.hide > 0.5) { M.bubT -= dt; if (M.bubT <= 0) { M.bubT = 0.3; const a = Math.random() * TAU; bubble(FX, m.x + Math.cos(a) * 1.9, m.y + Math.sin(a) * 1.0 + 0.4, 0.5); } }
      // the entrance: it drops in, rears up with a roar as it lands and slams down on all eight legs
      if (m.act === 'enter') { const e = FX.S.enterT || 0; if (e > 1.4) { M.lunge = toward(M.lunge, 1, dt, 5); M.menace = toward(M.menace, 1, dt, 5); M.raise = toward(M.raise, 1, dt, 5); if (!M.roared) { M.roared = true; FX.H.sfx.crash(); FX.H.shake(6, 0.3); } } }
      else if (M.wasEnter) { M.wasEnter = false; M.slam = 1; M.raise = 0; FX.H.sfx.splash && FX.H.sfx.splash(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; bubble(FX, m.x + Math.cos(a) * 3, m.y + Math.sin(a) * 1.8 + 0.4, 0.8); } } },
    dmgK(FX, m) { return m.act === 'hide' ? 0.05 : 1; },
    keep: { steps: 2 },
    draw(c, FX, m, X, Y, T, t, step) { drawCrab(c, FX, m, X, Y, T, t, step); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'chain') drawChain(c, FX, o, X, Y, T, t); },
  };
  /* ---- pieces of the fight ---- */
  function spawnChain(FX, i) { const p = chainAt(FX.C, i), h = FX.mem.chains[i]; h.obj = FX.obj({ kind: 'chain', x: p[0], y: p[1], r: 0.8, hp: FX.S.barHP * 0.03, idx: i, onKill: o => { const m = FX.m; FX.H.boom(o.x, o.y, 1.2, BRONZE_HI, '#FFFFFF', { n: 14, shake: 6 }); if (m && m.act === 'hide') { endHide(FX, m, true); } else FX.H.text(o.x, o.y - 1.5, 'The bell rings', BRONZE_HI, 13); FX.H.sfx.hum(); } }); }
  function startSweep(FX, m) { const M = FX.mem, a = FX.angPet(m.x, m.y); M.sa = a; m.act = 'sweep'; m.actT = 0; M.swing = 0; FX.H.sfx.hum(); FX.tele({ shape: 'cone', x: m.x, y: m.y, a, len: 6.5, spread: 0.75, t: 1.1 / FX.S.fast, dmg: m.dmg * 1.7, fn: s => { M.swing = 1; M.swingT = 0; FX.H.slash && FX.H.slash(m.x + Math.cos(a) * 3, m.y + Math.sin(a) * 3, a, 3.2, '#DFFFF8'); FX.H.shake(8, 0.3); FX.H.sfx.crash(); FX.H.sparks(m.x + Math.cos(a) * 3.5, m.y + Math.sin(a) * 3.5, '#DFFFF8', 14, 7); for (let i = 0; i < 6; i++) bubble(FX, m.x + Math.cos(a + (i - 2.5) * 0.25) * 4, m.y + Math.sin(a + (i - 2.5) * 0.25) * 4, 0.7); } }); }
  function startToll(FX, m) { const M = FX.mem, P = FX.S.lv; m.act = 'toll'; m.actT = 0; M.ring = 0; FX.H.sfx.hum(); const n = P >= 2 ? 2 : 1;
    for (let k = 0; k < n; k++) { const gaps = [[Math.random() * TAU, 0.42], [Math.random() * TAU, 0.38]]; const z = FX.tele({ shape: 'ring', x: m.x, y: m.y, r0: 0.5, r1: 1.6, gaps, t: 0.9 + k * 0.9, dmg: m.dmg * 1.4, col: BRONZE_HI, linger: 2.4, tick: (dt, s) => { if (!s.done) return; const sp = 5.5 * FX.S.fast; s.r0 += sp * dt; s.r1 += sp * dt; if (!s.hitT) s.hitT = 0; s.hitT -= dt; if (s.hitT <= 0 && FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) { s.hitT = 1; FX.hurt(s.dmg); } }, fn: () => { M.ring = 1; M.ringT = 0; FX.H.shake(6, 0.3); FX.H.sfx.crash(); } }); }
    FX.H.banner(n > 1 ? 'TOLL · TOLL' : 'TOLL', 'Slip through the gaps in the rings', BRONZE_HI, 1.4, true); }
  function startScuttle(FX, m) { const M = FX.mem, me = FX.me, a = FX.angPet(m.x, m.y), len = Math.min(24, Math.hypot(me.x - m.x, me.y - m.y) + 6); M.chA = a; M.chLeft = len; M.chHit = false; m.act = 'aim'; m.actT = 0; FX.H.sfx.hum(); FX.tele({ shape: 'line', x: m.x, y: m.y, a, len, w: m.r * 1.6, t: 0.9, dmg: 0, col: '#FF6A5A' }); }
  function startHide(FX, m) { const M = FX.mem; m.act = 'hide'; m.actT = 0; M.sigT = FX.S.lv >= 3 ? 14 : 18; FX.H.banner('BELL SHELTER', 'Strike a clapper chain to ring it out', BRONZE_HI, 2.2, true); M.chains.forEach(h => { if (h.obj && !h.obj.dead) h.obj.hint = 4; }); }
  function endHide(FX, m, rung) { const M = FX.mem; m.act = 'circle'; m.actT = 0; M.hide = 0; if (rung) { m.stunT = 4.5; M.ring = 1; M.ringT = 0; FX.H.banner('RUNG OUT', 'It flips: strike the bared belly!', CYAN, 1.8); FX.H.shake(12, 0.5); FX.H.sfx.crash(); for (let i = 0; i < 12; i++) bubble(FX, m.x + FX.rnd(-3, 3), m.y + FX.rnd(-1, 1.5), 0.9); } else FX.H.text(m.x, m.y - 3, 'It creeps back out', '#FFFFFF', 12); }
  function brine(FX, x, y, r, life) { if (!FX.inArena(x, y, 0.5)) return; FX.hz({ kind: 'brine', x, y, r, life, dps: FX.m.dmg * 0.4, tick: 0.35, arm: 0.3, col: CYAN, draw: (c, z, FX2, T, t) => { const X = FX.sx(z.x), Y = FX.sy(z.y), a = Math.min(1, z.age / 0.3, (z.life - z.age) / 0.8), rr = z.r * T; c.globalAlpha = a; const g = c.createRadialGradient(X, Y, rr * 0.1, X, Y, rr); g.addColorStop(0, 'rgba(20,70,70,.85)'); g.addColorStop(0.7, 'rgba(30,110,100,.55)'); g.addColorStop(1, 'rgba(97,217,210,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(X, Y, rr, rr * 0.72, 0, 0, TAU); c.fill(); } }); }
  // a splash: a few rings of brine thrown up and falling back
  function bubble(FX, x, y, k) { const n = 2; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = (1.5 + Math.random() * 3) * k; FX.H.part({ kind: 'bubble', x, y, vx: Math.cos(a) * v * 0.5, vy: -v - 1, g: 9, life: 0.45 + Math.random() * 0.25, max: 0.7, size: 2 + Math.random() * 3 * k, color: '#BFF5E4' }); } }
  /* ---- the crab in three dimensions ---- */
  function crabFrame(m, M) { const hide = M.hide || 0, flip = M.flip || 0, hs = m.hitSq || 0, lunge = M.lunge || 0, slam = M.slam || 0, roar = M.roar || 0, bt = M.bt || 0;
    // breathing lifts it a little; a crouch and a landing press it down; a charge leans it forward, a lunge rears it up; struck, it flinches back
    const z = 0.2 - hide * 0.15 - (M.crouch || 0) * 0.28 - slam * 0.3 + Math.sin(bt * 1.7) * 0.03 + lunge * (m.act === 'enter' ? 0.5 : 0.15) - hs * 0.12 + flip * Math.abs(Math.sin(bt * 3)) * 0.08;
    const pitch = -flip * 0.9 + (M.lean || 0) + (m.act === 'enter' ? lunge * 0.55 : m.act === 'charge' ? -lunge * 0.22 : 0) + (M.recoil || 0) * 0.25 + hs * 0.1 + roar * 0.2 - slam * 0.1 + (M.crouch || 0) * -0.08;
    const roll = (M.roll || 0) + Math.sin((M.gait || 0)) * 0.05 * (M.spdK || 0) + flip * Math.sin(bt * 2.6) * 0.14 + (M.ring || 0) * Math.sin((M.ringT || 0) * 16) * 0.04;
    const scale = BS * (1 + Math.sin(bt * 1.7) * 0.02 + roar * 0.1 + hs * 0.07 - (M.crouch || 0) * 0.03);
    return frame(m, M.hd == null ? Math.PI / 2 : M.hd, { z, pitch, roll, scale }); }
  function bellyAt(m, M) { const W = crabFrame(m, M), p = W(0.3, 0, 1.2); return [p[0], p[1] - p[2]]; }
  function bodyParts(m, M) { const W = crabFrame(m, M), c = W(0, 0, 1.2), b = W(-0.6, 0, 2.6), l = W(1.2, 2.4, 0.6), r = W(1.2, -2.0, 0.6); return [hit('body', c, 2.2, m), hit('bell', b, 2.0, m), hit('clawL', l, 1.3, m), hit('clawR', r, 1.0, m)]; }
  function drawChain(c, FX, o, X, Y, T, t) { const K = DunFiend.KIT, cracked = 1 - o.hp / o.maxhp, hint = o.hint > 0 ? 1 : 0; if (o.hint > 0) o.hint -= 1 / 60; const h = T * 3.2, sw = Math.sin(t * 2 + o.idx) * T * 0.12;
    c.save(); c.strokeStyle = '#2B2433'; c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); c.moveTo(X, Y - h); c.quadraticCurveTo(X + sw, Y - h * 0.5, X + sw * 0.5, Y - T * 0.6); c.stroke(); c.strokeStyle = BRONZE; c.lineWidth = Math.max(1, T * 0.06); c.stroke();
    TN.shape(c, TN.ell(X + sw * 0.5, Y - T * 0.5, T * 0.34, T * 0.4), { col: BRONZE, shade: BRONZE_SH, hi: BRONZE_HI, line: LINE, r: T * 0.4, spec: 0.6, specAt: [X + sw * 0.5 - T * 0.1, Y - T * 0.65] });
    if (cracked > 0.3) { c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(X + sw * 0.5 - T * 0.1, Y - T * 0.8); c.lineTo(X + sw * 0.5 + T * 0.05, Y - T * 0.5); c.lineTo(X + sw * 0.5 - T * 0.08, Y - T * 0.3); c.stroke(); }
    if (hint) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.4 * Math.sin(t * 6); blitSized(c, glowSprite(BRONZE_HI), X - T * 1.3, Y - T * 1.8, T * 2.6, T * 2.6); }
    c.restore(); }
  function drawCrab(c, FX, m, X, Y, T0, t, step) {
    const go = i => step == null || step === i, T = T0 * BS, K = FX.K, M = FX.mem, P3 = TN.cam(X, Y, T0, m), W = crabFrame(m, M), bt = M.bt || t, gait = M.gait || 0, raise = M.raise || 0, toll = M.toll || 0, hide = M.hide || 0, flip = M.flip || 0, spd = M.spdK || 0;
    const menace = M.menace || 0, crouch = M.crouch || 0, roar = M.roar || 0, hs = m.hitSq || 0, lunge = m.act === 'enter' ? (M.lunge || 0) : 0, br = Math.sin(bt * 1.7), clack = Math.max(M.clack || 0, menace * 0.5, roar, lunge), sw = M.swing > 0 ? snap(Math.min(1, M.swingT / 0.7)) : 0, ring = M.ring || 0, ringT = M.ringT || 0;
    const lw = Math.max(1.4, T * 0.08), me = FX.me || { x: m.x, y: m.y + 5 };
    if (go(0)) TN.groundShadow(c, X, Y + T * 0.3, T * 3.6 * (1 + roar * 0.1), T * 2.0, 0, 0.5);
    const chit = r => ({ col: CHIT, shade: CHIT_SH, hi: CHIT_HI, line: LINE, r, lw, d1: 0.1, d2: 0.22, spec: 0.5, force: true });
    const ivory = r => ({ col: IVORY, shade: IVORY_SH, hi: '#FFFFFF', line: LINE, r, lw: lw * 0.8, d1: 0.1, d2: 0.24, spec: false, force: true });
    // the legs: four a side, from the body's flanks to feet on the ground, lifting in turn as it walks (and kicking at
    // the air when it lies rung out); a crouch draws them in under it, a lunge spreads them wide
    const legs = []; for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const u = 1.4 - i * 0.95, ph = gait + i * 1.6 + (sd > 0 ? Math.PI : 0), kick = flip * Math.max(0, Math.sin(bt * 9 + i * 2.1 + sd)) * 0.5, lift = Math.max(0, Math.sin(ph)) * (0.35 + spd * 0.3) * (1 - hide) * (1 - flip) + kick, spread = 1 - crouch * 0.12 + lunge * 0.15 + roar * 0.1, sh = W(u, sd * 1.4, 1.0 - hide * 0.5), kn = W(u * 1.15, sd * (2.6 - hide * 1.0) * spread, 2.0 - hide * 1.2 + flip * 0.6 - crouch * 0.4 + lift * 0.3), ft = W(u * 1.3 + Math.cos(ph) * 0.3 * spd, sd * (3.3 - hide * 1.4) * spread, lift - flip * 0.6 + hide * 0.6); legs.push({ at: ft, sh, kn, ft, sd, i }); }
    const legDraw = L => { const mid = L.kn; tubeLite(c, P3, [L.sh, [(L.sh[0] + mid[0]) / 2, (L.sh[1] + mid[1]) / 2, (L.sh[2] + mid[2]) / 2 + 0.15], mid, [(mid[0] + L.ft[0]) / 2, (mid[1] + L.ft[1]) / 2, (mid[2] + L.ft[2]) / 2], L.ft], u => T * (0.34 - u * 0.2), ivory(T * 0.34));
      const tip = P3(L.ft[0], L.ft[1], L.ft[2]); c.fillStyle = LINE; c.beginPath(); c.arc(tip[0], tip[1], Math.max(1, T * 0.07), 0, TAU); c.fill(); };
    const body = W(0, 0, 1.2 - hide * 0.6), bodyDepth = body[1];
    const far = legs.filter(L => L.ft[1] < bodyDepth), near = legs.filter(L => L.ft[1] >= bodyDepth);
    const drawBody = () => { if (flip > 0.3) { const bp = W(0.3, 0, 1.2); ell(c, P3, W.th, bp, [1.6 * BS, 1.5 * BS, 0.7 * BS], Object.assign({ T: T0 }, { col: CREAM, shade: CREAM_SH, hi: '#FFFFFF', line: LINE, r: T * 1.5, lw, spec: 0.4, force: true, inner: g => { c.save(); c.strokeStyle = 'rgba(120,90,60,.4)'; c.lineWidth = Math.max(1, T * 0.05); const q = P3(bp[0], bp[1], bp[2]); for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(q[0], q[1] + i * T * 0.3, T * (1.3 - Math.abs(i) * 0.2), T * 0.12, 0, 0, TAU); c.stroke(); } c.restore(); } })); }
      // the body breathes: a little wider as it fills, a little lower as it empties; struck, it is squashed flat for a moment
      ell(c, P3, W.th, body, [2.0 * BS * (1 + br * 0.02 + hs * 0.08), 1.7 * BS * (1 + br * 0.025 + hs * 0.08), 0.75 * BS * (1 - br * 0.04 - hs * 0.15 + roar * 0.1)], Object.assign({ T: T0 }, chit(T * 1.8), { inner: g => { const q = P3(body[0], body[1], body[2] + 0.5); c.save(); c.strokeStyle = 'rgba(20,36,58,.45)'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(q[0] - T * 1.3, q[1] - T * 0.1); c.quadraticCurveTo(q[0], q[1] - T * 0.6, q[0] + T * 1.3, q[1] - T * 0.1); c.stroke(); c.beginPath(); c.moveTo(q[0] - T * 1.5, q[1] + T * 0.35); c.quadraticCurveTo(q[0], q[1] - T * 0.1, q[0] + T * 1.5, q[1] + T * 0.35); c.stroke();
        [[-1.1, 0.2], [0.7, -0.3], [1.2, 0.3], [-0.4, 0.45]].forEach(([dx, dy]) => { c.fillStyle = '#C9C1B0'; c.beginPath(); c.arc(q[0] + dx * T, q[1] + dy * T, T * 0.1, 0, TAU); c.fill(); c.fillStyle = LINE; c.beginPath(); c.arc(q[0] + dx * T, q[1] + dy * T, T * 0.035, 0, TAU); c.fill(); }); c.restore(); } })); };
    // the bell on its back: a bronze dome, its rim a wide ellipse, three bands, a chipped lip, the crown on top; it rocks
    // after a toll (and shivers while the toll builds), and rides the breathing of the body under it
    const bob = br * 0.04, bellC = W(-0.5, 0, 2.7 - hide * 1.6 + bob), rimC = W(-0.5, 0, 1.9 - hide * 1.3 + bob), crown = W(-0.5, 0, 3.7 - hide * 1.6 + bob), tilt = Math.sin(bt * 1.2) * 0.03 + toll * Math.sin(t * 40) * 0.015 * (1 - ring) + ring * Math.sin(ringT * 16) * 0.14;
    const bronze = r => ({ col: BRONZE, shade: BRONZE_SH, hi: BRONZE_HI, line: LINE, r, lw, d1: 0.1, d2: 0.26, spec: 0.8, specR: 0.14, force: true });
    const drawBell = () => {
      const rim = ell(c, P3, W.th + tilt, rimC, [2.0 * BS, 2.0 * BS, 0.35 * BS], Object.assign({ T: T0 }, bronze(T * 2.0), { spec: false }));
      ell(c, P3, W.th + tilt, bellC, [1.7 * BS, 1.7 * BS, 1.1 * BS], Object.assign({ T: T0 }, bronze(T * 1.8), { inner: g => { const q = P3(bellC[0], bellC[1], bellC[2]); c.save(); for (let i = 0; i < 3; i++) { const yy = q[1] + T * (0.9 - i * 0.55), w = T * (1.65 - i * 0.22); c.strokeStyle = 'rgba(60,40,15,.55)'; c.lineWidth = Math.max(1.2, T * 0.07); c.beginPath(); c.ellipse(q[0], yy, w, w * 0.32, 0, 0, Math.PI); c.stroke(); c.strokeStyle = 'rgba(255,230,160,.35)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.ellipse(q[0], yy - T * 0.05, w * 0.9, w * 0.28, 0, 0.3, Math.PI - 0.3); c.stroke(); }
        // the chip in the lip, and verdigris
        c.fillStyle = CHIT_SH; c.beginPath(); c.moveTo(q[0] + T * 1.2, q[1] + T * 1.3); c.lineTo(q[0] + T * 1.45, q[1] + T * 0.9); c.lineTo(q[0] + T * 1.6, q[1] + T * 1.35); c.closePath(); c.fill(); c.fillStyle = 'rgba(97,217,210,.25)'; c.beginPath(); c.ellipse(q[0] - T * 0.9, q[1] + T * 0.6, T * 0.5, T * 0.3, -0.4, 0, TAU); c.fill(); c.restore(); } }));
      const cr = ell(c, P3, W.th, crown, [0.5 * BS, 0.5 * BS, 0.35 * BS], Object.assign({ T: T0 }, bronze(T * 0.5), { spec: false }));
      c.save(); c.strokeStyle = LINE; c.lineWidth = Math.max(2, T * 0.14); c.lineCap = 'round'; c.beginPath(); c.arc(cr.p[0], cr.p[1] - T * 0.2, T * 0.3, Math.PI, TAU); c.stroke(); c.strokeStyle = BRONZE_HI; c.lineWidth = Math.max(1, T * 0.07); c.stroke(); c.restore();
      // drips from the rim
      c.save(); c.fillStyle = 'rgba(159,232,255,.7)'; for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.4, dx = Math.cos(a) * rim.rx * 0.85, ph = (bt * 0.5 + i * 0.37) % 1, dy = rim.p[1] + rim.ry * 0.6 + ph * T * 1.6; if (ph < 0.7) { c.beginPath(); c.ellipse(rim.p[0] + dx, dy, T * 0.05, T * 0.09, 0, 0, TAU); c.fill(); } } c.restore();
      if (toll > 0 || ring > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * Math.max(toll, ring) * (0.75 + 0.25 * Math.sin(t * 30)); blitSized(c, glowSprite(BRONZE_HI), rim.p[0] - T * 3, rim.p[1] - T * 2.4, T * 6, T * 4.8); c.restore(); }
      // the sound of it: rings of light rolling off the bell after a toll
      if (ring > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = BRONZE_HI; c.lineWidth = Math.max(1, T * 0.08); for (let i = 0; i < 3; i++) { const u = ((ringT * 1.4 + i / 3) % 1); c.globalAlpha = ring * (1 - u) * 0.6; c.beginPath(); c.ellipse(rim.p[0], rim.p[1], rim.rx * (1 + u * 1.2), rim.ry * (1 + u * 1.2), 0, 0, TAU); c.stroke(); } c.restore(); } };
    // the claws: arms out from the front corners, the left twice the right; raised and drawn back for a sweep (the
    // wind-up), then snapped through the arc with overshoot (the follow-through); spread wide in a roar
    const claw = (sd, k, up, back, fwd) => { const wide = roar * 0.5 + lunge * 0.6, sh = W(1.3, sd * 1.2, 1.1 - hide * 0.5), el = W(2.0 + k * 0.4 - back * 0.6 + fwd * 0.5, sd * (2.0 + k * 0.5 + wide), 0.9 + up * 1.4 - hide * 0.4 + back * 0.3);
      const hu = 2.6 + k * 0.9 - back * 1.1 * k + fwd * 1.2 * k, hv = sd * (2.1 + k * 0.6 + wide * 1.5) - sd * fwd * 1.4 * k, hz = 0.7 + up * 1.9 - hide * 0.3 + flip * 0.5 + back * 0.5 - fwd * 0.3 + Math.sin(bt * 2.3 + sd) * 0.05, hd = W(hu, hv, hz);
      tubeLite(c, P3, [sh, [(sh[0] + el[0]) / 2, (sh[1] + el[1]) / 2, (sh[2] + el[2]) / 2 + 0.2], el, [(el[0] + hd[0]) / 2, (el[1] + hd[1]) / 2, (el[2] + hd[2]) / 2 + 0.1], hd], u => T * (0.5 + k * 0.25) * (1 - u * 0.25), ivory(T * 0.5));
      // the pincer: two fingers in three dimensions off the end of the hand (so it reads from any heading), the upper
      // one hinged: it gapes in the wind-up and clacks shut as it strikes
      const fa = sd * 0.4 - sd * fwd * 0.7, ca = Math.cos(fa), sa = Math.sin(fa), op = Math.max(0.1, 0.25 + Math.max(raise, back) * 0.6 + clack * 0.45 * k - fwd * 0.6), L = (1.3 + k * 0.9) * BS, w0 = T * (0.26 + k * 0.3);
      const parts = [];   // (the two fingers, far one first)
      for (const f of [-1, 1]) { const o = f > 0 ? op : -0.12, rt = [hu + ca * L * 0.25, hv + sa * L * 0.25, hz + f * 0.05], tp = [hu + ca * L * Math.cos(o) - sa * L * Math.sin(o) * sd, hv + sa * L * Math.cos(o) + ca * L * Math.sin(o) * sd, hz + f * 0.08 + (f > 0 ? op * 0.5 : 0)], mid = [(rt[0] + tp[0]) / 2 + ca * 0.05, (rt[1] + tp[1]) / 2 + sa * 0.05, (rt[2] + tp[2]) / 2 + f * 0.12 + 0.08]; parts.push({ f, pts: [W(rt[0], rt[1], rt[2]), W(mid[0], mid[1], mid[2]), W(tp[0], tp[1], tp[2])] }); }
      parts.sort((a, b) => a.pts[2][1] - b.pts[2][1]);
      const pin = ell(c, P3, W.th + fa, hd, [0.9 * k * BS + 0.3, 0.7 * k * BS + 0.25, 0.45 * k * BS + 0.2], Object.assign({ T: T0 }, ivory(T * (0.7 + k * 0.5)), { spec: 0.5 }));
      parts.forEach(q => { tubeLite(c, P3, q.pts, u => w0 * (q.f > 0 ? 0.85 : 1) * (1 - u * 0.75), ivory(w0)); const e = P3(q.pts[2][0], q.pts[2][1], q.pts[2][2]); c.fillStyle = LINE; c.beginPath(); c.arc(e[0], e[1], Math.max(1, T * 0.05), 0, TAU); c.fill(); });
      // the blade of the strike: a streak of foam behind the claw as it sweeps
      if (fwd > 0.3) { const tip = P3(hd[0] + W.cf * L, hd[1] + W.sf * L, hd[2]); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, fwd) * 0.6; c.strokeStyle = '#DFFFF8'; c.lineWidth = Math.max(2, T * 0.25); c.beginPath(); c.moveTo(tip[0], tip[1]); c.quadraticCurveTo(tip[0] - sd * W.cf * T * 1.2 + W.sf * T, tip[1] + T * 0.6, pin.p[0] + sd * T * 1.5 * W.sf, pin.p[1] + T * 1.2); c.stroke(); c.restore(); } };
    // the mouthparts: two mandibles under the eyes that work and clack, and the dark mouth between them, foaming
    const mouth = () => { const gape = clack * (1 - hide), base = W(1.9, 0, 0.75 - hide * 0.4), q = P3(base[0], base[1], base[2]); c.save(); c.fillStyle = '#0B1620'; c.beginPath(); c.ellipse(q[0], q[1], T * (0.22 + gape * 0.12), T * (0.08 + gape * 0.22), 0, 0, TAU); c.fill(); c.restore();
      [-1, 1].forEach(sd => { const a = W(1.85, sd * 0.3, 0.9 - hide * 0.4), b = W(2.45, sd * (0.22 + gape * 0.5), 0.55 - hide * 0.3 + gape * 0.1); tubeLite(c, P3, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 - 0.05], b], u => T * (0.14 - u * 0.06), ivory(T * 0.14)); });
      if (gape > 0.6 || menace > 0.7) { c.save(); c.fillStyle = 'rgba(223,255,248,.8)'; for (let i = 0; i < 3; i++) { const ph = (bt * 1.3 + i * 0.33) % 1; c.beginPath(); c.arc(q[0] + (i - 1) * T * 0.18, q[1] + T * 0.1 + ph * T * 0.5, T * 0.05 * (1 - ph), 0, TAU); c.fill(); } c.restore(); } };
    // the eyes on their stalks, looking at the pet (spinning when it is rung out), blinking; they blaze before a blow
    const eyes = () => { const dx = me.x - m.x, dy = me.y - m.y, dl = Math.hypot(dx, dy) || 1, dizzy = flip > 0.4; [-1, 1].forEach(sd => { const droop = flip * 0.5, base = W(1.7, sd * 0.5, 1.5 - hide * 0.9), top = W(2.1 + hide * 0.2 + droop * 0.3, sd * (0.75 + droop * 0.4), 2.5 - hide * 1.7 - droop * 0.9 + Math.sin(bt * 2 + sd) * 0.05 - crouch * 0.3 + lunge * 0.2); tubeLite(c, P3, [base, [(base[0] + top[0]) / 2, (base[1] + top[1]) / 2, (base[2] + top[2]) / 2 + 0.1], top], u => T * 0.2, chit(T * 0.2)); const ep = P3(top[0], top[1], top[2] + 0.2);
      if (menace > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = menace * (0.55 + 0.25 * Math.sin(t * 14)); const r = T * (0.6 + menace * 0.5); blitSized(c, glowSprite(CYAN), ep[0] - r, ep[1] - r, r * 2, r * 2); c.restore(); }
      const look = dizzy ? [Math.cos(bt * 7 + sd) * 0.8, Math.sin(bt * 7 + sd) * 0.6] : [dx / dl * 0.8, Math.max(-0.4, dy / dl) * 0.6];
      TN.eye(c, ep[0], ep[1], T * 0.34, { iris: CYAN, white: menace > 0.5 ? '#EFFFFC' : '#DFFFF8', line: LINE, look, blink: Math.max(M.blink || 0, flip * 0.35), lid: CHIT, brow: 0.6 + menace * 0.7, pupilR: 0.55 - menace * 0.28 + (dizzy ? 0.15 : 0) }); }); };
    // far to near: the bell sits on the back, behind the body when it faces the camera
    const bellBehind = W.sf >= -0.2, back = m.act === 'sweep' && !(M.swing > 0) ? raise : 0, fwd = sw;
    if (go(0)) { far.forEach(legDraw); if (bellBehind) drawBell(); drawBody(); }
    if (go(1)) { if (!bellBehind) drawBell();
      near.forEach(legDraw); claw(1, 1.0, raise, back, fwd); claw(-1, 0.55, raise * 0.5, back * 0.5, fwd * 0.4); mouth(); eyes();
      if (hide > 0.5) { c.save(); c.globalAlpha = hide - 0.5; const q = P3(rimC[0], rimC[1], rimC[2] - 0.4); c.fillStyle = 'rgba(159,232,255,.35)'; c.beginPath(); c.ellipse(q[0], q[1] + T * 0.6, T * 2.1, T * 0.5, 0, 0, TAU); c.fill(); c.restore(); }
      // a roar, or a lunge on landing: a flare of its glow about it
      if (roar > 0 || lunge > 0) { const k = Math.max(roar, lunge), q = P3(body[0], body[1], body[2] + 1); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * 0.35; blitSized(c, glowSprite(CYAN), q[0] - T * 4, q[1] - T * 3, T * 8, T * 6); c.restore(); }
      if (flip > 0.4) for (let i = 0; i < 3; i++) { const a = bt * 3 + i * TAU / 3, p = P3(m.x, m.y, 0); TN.twinkle(c, p[0] + Math.cos(a) * T * 1.6, p[1] - T * 3.2 + Math.sin(a) * T * 0.4, T * 0.2, '#FFFFFF', 0.9); } }
  }
})());
