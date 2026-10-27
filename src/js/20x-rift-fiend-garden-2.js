/* ---------- AMBREL THE VOID MOTH ----------
   A giant eye of night hanging over the Lantern Bower: its body one great round eyeball, a yellow sclera shaded as a
   ball with a slit of black pupil in an orange iris, dark veins creeping in from its rim and a black-violet smoke
   churning inside and about it; a ring of long fur-like lashes sticks out all round the ball, and five or more violet
   motes orbit it on tilted paths. From its sides spread two pairs of fairy-butterfly wings: translucent pearl membranes
   that shift between lilac and mint, laced with dark veins, scalloped at the edge, the hind pair drawn out into forked
   swallow-tails, dusted with star-glitter in constellations of its own. Four rose lanterns (its own lights) hang on
   short chains beneath the ball. It never lands while it can help it: it hovers, banks into its turns, flutters harder
   when it climbs and sheds glitter as it goes. Dust Veil marks lanes across the bower and pollen falls down them;
   Lantern Dive climbs, then swoops along a line through the pet; Moonbeam hangs a beam of moonlight from its body to
   the floor and sweeps it round like a clock hand (two beams in the second phase); Scale Storm sheds rings of scales.
   Four Lure Lanterns drift about the bower: snuff all four and its own lights go out with them and it falls from the
   air, grounded for seven seconds with the eye bared (weak point 'thorax'). In the second phase star pollen moths come
   to its light.
   It breathes (the ball swells), the wings never stop (a slow idle flutter, a hard beat when it climbs or turns, a
   tremble when it is grounded), the lanterns swing under it with every change of course, the lashes ripple and the
   pupil follows the pet, blinks under a fleshy lid and narrows to a slit before a blow; the smoke churns faster before
   a strike and the motes hurry in the second phase; before a dive it climbs with its wings folded back and drops
   pupil-first; before the storm the wings flare wide; struck, it is squashed; grounded, it flops with its lid half
   shut, the pupil rolling and the motes scattered, its wings spread flat and shivering; it roars on entering (the
   pupil shrinks to a pinpoint, the smoke bursts, the lashes flare). */
RiftFiend.define({ id: 'ambrel', name: 'Ambrel', title: 'The Void Moth', color: '#2A1838', glow: '#D98FB5', accent: '#FFE9F4', biome: 'garden', r: 2.2, els: ['dark', 'wind'] }, (() => {
  const { TAU, TN, frame, tubeLite, ell, hit } = RiftFiend, G = GardenFiend;
  const { PLUM, PLUM_SH, PLUM_HI, ROSE, ROSE_SH, ROSE_HI, JADE, JADE_SH, JADE_HI, CREAM, CREAM_SH, GOLD, INK, decay, toward } = G;
  const VELVET = '#1E1230', VELVET_SH = '#110A1C', VELVET_HI = '#3C2658', MOON = '#F4EEFF', LAN_A = [0.8, 0.8 + Math.PI / 2, 0.8 + Math.PI, 0.8 + Math.PI * 1.5];
  const lanHome = (C, i) => [C.x + Math.cos(LAN_A[i]) * (C.R - 4.5), C.y + Math.sin(LAN_A[i]) * (C.R - 4.5)];
  // the constellations on its wings: fixed stars in wing-local coordinates (along, across) and the lines between them
  const STARS = [[0.2, 1.2], [0.55, 1.9], [0.15, 2.6], [-0.35, 2.2], [-0.6, 1.4], [0.75, 2.9], [-0.1, 3.2], [0.4, 0.7], [-0.7, 2.9]], LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6]], HSTARS = [[-1.0, 0.9], [-1.4, 1.5], [-1.8, 0.8], [-1.2, 1.9]];
  const lerp = (a, b, u) => a + (b - a) * u, flicker = t => 0.75 + 0.15 * Math.sin(t * 21) + 0.1 * Math.sin(t * 6.3 + 1);
  /* the eye and its wings: the ball's radius (body units), the palette, the wings' outlines */
  const RB = 1.5, VOFF = 0.7;   // (the wings' local v is pushed out by VOFF so their roots sit at the ball's sides)
  const SCLERA = '#F2CE38', SCLERA_SH = '#B98C1C', SCLERA_SH2 = '#7E5A0E', SCLERA_HI = '#FFF3A6', IRIS = '#F0901E', IRIS_HI = '#FFC63A', IRIS_SH = '#8E3A0E', LID = '#7A4E8E', LID_SH = '#4A2C5E', LASH = '#1E1230', LASH_HI = '#6A4A8C', SMOKE = 'rgba(16,4,28,.6)', SMOKE2 = 'rgba(126,50,186,.4)';
  const PEARL = '#ECE2F8', LILAC = '#B99BE0', RIM = '#3A2060', MOTE_A = '#C86BFF', MOTE_B = '#FF86E8';
  // the wings' outlines in wing-local coordinates (along the body, out from it): the outer edge scalloped by a dent
  // between each pair of its points; the hind wing drawn out into two swallow-tails
  const scallop = (pts, i0, i1, root, d) => { const out = []; pts.forEach((p, i) => { out.push(p); if (i >= i0 && i < i1) { const q = pts[i + 1], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = root[0] - mx, dy = root[1] - my, L = Math.hypot(dx, dy) || 1; out.push([mx + dx / L * d, my + dy / L * d]); } }); return out; };
  const FROOT = [0.0, 0.55], HROOT = [-0.7, 0.45];
  const FORE = scallop([[0.35, 0.3], [1.15, 1.5], [1.2, 2.8], [0.6, 4.1], [-0.35, 4.3], [-1.05, 3.4], [-1.15, 1.8], [-0.5, 0.4]], 1, 6, FROOT, 0.16);
  const HIND = scallop([[-0.55, 0.35], [-1.0, 1.3], [-1.6, 2.4], [-2.3, 2.65], [-2.7, 2.2], [-3.7, 2.55], [-2.8, 1.7], [-3.9, 1.15], [-2.6, 0.9], [-2.15, 0.45]], 1, 3, HROOT, 0.14);
  const FVEINS = [[1.1, 1.6], [1.15, 2.8], [0.55, 4.0], [-0.3, 4.2], [-0.95, 3.3], [-1.1, 1.9]], HVEINS = [[-1.5, 2.3], [-2.3, 2.55], [-3.55, 2.45], [-3.75, 1.2], [-2.5, 0.85]];
  // the motes that orbit the ball: each on its own tilted ellipse (screen-space, in ball radii), at its own pace
  const MOTES = [0, 1, 2, 3, 4, 5, 6].map(j => ({ ph: j * 0.9, w: 0.8 + (j % 4) * 0.12, tilt: 0.3 + (j % 3) * 0.22, rot: j * 0.47, ra: 1.5 + (j % 2) * 0.3, col: j % 2 ? MOTE_A : MOTE_B }));
  return {
    arenaR: 15, firstAct: 'circle', artY: 0.5, ambient: 'motes',
    artPoses: [{ name: 'hovering', mem: { hd: 1.57, alt: 2.4 } }, { name: 'banking into a turn', mem: { hd: 0.8, alt: 2.6, turn: 2.5, beat: 0.8 } }, { name: 'wings flared for the storm', mem: { hd: 1.57, alt: 2.4, flare: 1, menace: 1 } }, { name: 'grounded, the eye bared', mem: { hd: 1.57, alt: 0.15, ground: 1 } }],
    phaseNames: ['The Lantern Bower', 'The Second Moon', 'The Pollen Night', 'The Last Lantern'],
    paintGround(c, A) { G.floor(c, A, { mid: '#33203F', edge: '#241330', extra: (c2, A2) => { const R = A2.R;
      // the bower: a ring of lantern posts' footings, and a pale moon-dial at the centre
      LAN_A.forEach(a => { const x = Math.cos(a) * (R - 4.5), y = Math.sin(a) * (R - 4.5); c2.fillStyle = '#3A2449'; c2.beginPath(); c2.ellipse(x, y + 0.2, 1.3, 0.75, 0, 0, TAU); c2.fill(); c2.strokeStyle = 'rgba(217,143,181,.4)'; c2.lineWidth = 0.12; c2.stroke(); });
      c2.strokeStyle = 'rgba(244,238,255,.22)'; c2.lineWidth = 0.25; c2.beginPath(); c2.arc(0, 0, 4.2, 0, TAU); c2.stroke(); c2.lineWidth = 0.1; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c2.beginPath(); c2.moveTo(Math.cos(a) * 3.6, Math.sin(a) * 3.6); c2.lineTo(Math.cos(a) * 4.2, Math.sin(a) * 4.2); c2.stroke(); } c2.fillStyle = 'rgba(244,238,255,.1)'; c2.beginPath(); c2.arc(0, 0, 4.2, 0, TAU); c2.fill(); } }); },
    sky(c, W, H, t, cam, T) { G.sky(c, W, H, t, cam, T, { top: '#0C0618', mid: '#241236', bot: '#0A0612' }); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m; m.noTouch = true; m.x = FX.C.x; m.y = FX.C.y - 5; FX.m.act = 'enter';
      Object.assign(M, { hd: Math.PI / 2, alt: 2.4, wph: 0, beat: 0, fold: 0, flare: 0, ground: 0, menace: 0, roar: 0, recoil: 0, blink: 0, blinkT: 2.5, bt: 0, px: m.x, py: m.y, vx: 0, vy: 0, spd: 0, lastHd: Math.PI / 2, turn: 0, lanA: 0, lanW: 0, antT: 1.5, ant: 0, glitT: 0, lit: 4, lanterns: LAN_A.map(() => ({ obj: null })), relightT: 0, broodT: 13, beams: [], wasEnter: true, roared: false, wasStun: false, dir: 1 });
      LAN_A.forEach((a, i) => spawnLantern(FX, i)); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; M.roar = 1; M.flare = 1; M.beat = 1; M.menace = 1; M.broodT = 4; FX.H.shake(10, 0.5); FX.H.flash(0.2, ROSE_HI); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - M.alt, ROSE_HI, 20, 8);
      for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; FX.minion('pollenmoth', m.x + Math.cos(a) * 3, m.y + Math.sin(a) * 3); }
      if (lv >= 2) FX.H.banner('THE SECOND MOON', 'Two moonbeams sweep; star pollen moths come to its light', MOON, 2.6, true); if (lv >= 4) FX.H.banner('The Last Lantern', 'Every scale falls', '#FF6A5A', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, fast = (1 + (P - 1) * 0.08) * FX.S.fast, d = FX.dist(m.x, m.y); m.actT += dt; m.noTouch = true;
      if (M.relightT > 0) { M.relightT -= dt; if (M.relightT <= 0) { M.relightT = 0; M.lanterns.forEach((h, i) => { if (!h.obj || h.obj.dead) spawnLantern(FX, i); }); M.lit = 4; FX.H.banner('THE LANTERNS RELIGHT', 'Four lures drift about the bower again', ROSE_HI, 1.6, true); } }
      if (P >= 2 && (M.broodT -= dt) <= 0 && m.act === 'circle') { M.broodT = P >= 4 ? 9 : 13; for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; FX.minion('pollenmoth', m.x + Math.cos(a) * 3, m.y + Math.sin(a) * 3); } FX.H.text(m.x, m.y - M.alt - 2, 'Moths come to its light', GOLD, 13); }
      let menace = 0, fold = 0, flare = 0, altW = 2.4;
      switch (m.act) {
        case 'circle': { M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.55 * fast * (M.dir || 1); const R = 6.5 + Math.sin(m.t * 0.6) * 1.2, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 2); fly(FX, m, M, p.x, p.y, 6 * fast, dt, 2.4); altW = 2.4 + Math.sin(m.t * 1.1) * 0.3;
          if (m.actT > (P >= 3 ? 1.5 : 1.9) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; pick(FX, m, d, P); } break; }
        case 'veil': { fly(FX, m, M, C.x, C.y - 2, 5 * fast, dt, 3); altW = 3.6; menace = 1; M.beat = Math.max(M.beat, 0.8); if (m.actT > M.vw + 0.8) { m.act = 'circle'; m.actT = 0; } break; }
        case 'dive': { const L = M.dv; if (m.actT < L.wait) { fly(FX, m, M, L.x0, L.y0, 9 * fast, dt, 4); altW = 3.4; menace = 1; fold = 0.6; L.dove = false; break; }
          if (!L.dove) { L.dove = true; M.beat = 1; FX.H.sfx.whoosh(); }
          const u = clamp((m.actT - L.wait) / L.dur, 0, 1); m.x = lerp(L.x0, L.x1, u); m.y = lerp(L.y0, L.y1, u); M.hd = L.a; altW = 0.7; fold = 1; menace = 0.6;
          if (!L.hit && FX.dist(m.x, m.y) < 1.5 + me.r) { if (FX.hurt(m.dmg * 1.6)) L.hit = true; }
          if (u >= 1) { m.act = 'circle'; m.actT = 0; M.recoil = 1; M.beat = 1; } break; }
        case 'beam': { fly(FX, m, M, C.x, C.y, 4 * fast, dt, 3); altW = 2.9; menace = m.actT < M.bw ? 1 : 0.5; if (m.actT > M.bw + 4.4 / FX.S.fast) { m.act = 'circle'; m.actT = 0; M.beams.length = 0; } break; }
        case 'storm': { menace = 0.8; flare = 1; M.stT = (M.stT || 0) - dt; fly(FX, m, M, m.x, m.y, 1, dt, 1); if (M.stT <= 0 && M.stN > 0) { M.stT = 0.45; M.stN--; M.beat = 1; FX.burst(m.x, m.y, P >= 2 ? 14 : 10, 5.5 * fast, { dmg: m.dmg * 0.5, color: ROSE_HI, core: '#FFFFFF', r: 0.24 }, M.stN * 0.3); FX.H.sfx.hum(); for (let i = 0; i < 6; i++) glitter(FX, m, M, 1.2); } if (m.actT > 2.2) { m.act = 'circle'; m.actT = 0; } break; }
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3); M.fold = toward(M.fold, fold, dt, fold > M.fold ? 5 : 3); M.flare = toward(M.flare, flare, dt, flare > M.flare ? 4 : 2.5); M.alt = toward(M.alt, altW, dt, 2.5); M.ground = decay(M.ground, dt, 2);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.ground = Math.min(1, M.ground + dt * 2.5); M.alt = toward(M.alt, 0.15, dt, 4); M.menace = decay(M.menace, dt, 4); M.fold = decay(M.fold, dt, 3); M.flare = decay(M.flare, dt, 3); M.beams.length = 0; m.noTouch = true;
      const W = mothFrame(m, M), p = W(0, 0, 0); FX.weak('thorax', p[0], p[1] - p[2], 1.3, 2.4, m.stunT > 0.05);   // (the eye itself; the key keeps its old name)
      // grounded: it shivers and kicks up dust
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.4; glitter(FX, m, M, 0.7); FX.H.shake(1.5, 0.08); }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return; M.bt += dt;
      if (!(m.stunT > 0)) { if (FX.S.weak.thorax) FX.weak('thorax', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.relightT = 3; M.beat = 1; M.recoil = 0.8; FX.H.text(m.x, m.y - 2, 'It takes to the air', MOON, 13); } } else M.wasStun = true;
      // how it moves: speed drives the flutter, turning banks it, the lanterns swing with its accelerations
      if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt, ax = (vx - M.vx) / dt; M.px = m.x; M.py = m.y; M.vx = toward(M.vx, vx, dt, 10); M.vy = toward(M.vy, vy, dt, 10); M.spd = toward(M.spd, Math.hypot(vx, vy), dt, 6);
        let dh = M.hd - M.lastHd; while (dh > Math.PI) dh -= TAU; while (dh < -Math.PI) dh += TAU; M.lastHd = M.hd; M.turn = toward(M.turn, clamp(dh / dt, -4, 4), dt, 5);
        const acc = clamp(ax, -40, 40) * 0.06; M.lanW += (-14 * Math.sin(M.lanA) - acc * Math.cos(M.lanA)) * dt - M.lanW * 1.6 * dt; M.lanA += M.lanW * dt; M.lanA = clamp(M.lanA, -1.2, 1.2); }
      // the wings: a slow idle flutter, a hard fast beat when it climbs, turns or is told to; a tremble on the ground
      const climb = Math.max(0, M.alt - 2.4), rate = M.ground > 0.5 ? 26 : 5.5 + M.spd * 0.9 + Math.abs(M.turn) * 2 + (M.beat || 0) * 14 + climb * 4; M.wph += dt * rate; M.beat = decay(M.beat, dt, 1.4);
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.2);
      // glitter shed from the wings, more the harder they beat
      M.glitT -= dt; if (M.glitT <= 0) { M.glitT = 0.16 - (M.beat || 0) * 0.1; glitter(FX, m, M, 0.5 + (M.beat || 0)); }
      // the eyes blink; the antennae twitch
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 3 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.12; M.blink = Math.sin(Math.min(1, M.blinkU) * Math.PI); if (M.blinkU >= 1) { M.blinkU = null; M.blink = 0; } }
      M.antT -= dt; if (M.antT <= 0) { M.antT = 1.5 + Math.random() * 2.5; M.antU = 0; } if (M.antU != null) { M.antU += dt / 0.5; M.ant = Math.sin(Math.min(1, M.antU) * Math.PI); if (M.antU >= 1) { M.antU = null; M.ant = 0; } }
      // the beams that have gone out of the fight's list
      if (M.beams.length) M.beams = M.beams.filter(s => FX.S.tele.includes(s));
      // the entrance: it drops out of the branches, swoops at the pet with a cry and climbs away as it begins
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.alt = 2.4 + Math.max(0, 1.5 - e) * 2; if (e > 1.4) { if (e < 2.7 && FX.dist(m.x, m.y) > 3.5) fly(FX, m, M, FX.me.x, FX.me.y, 6, dt, 4); M.menace = toward(M.menace, 1, dt, 5); M.fold = toward(M.fold, 0.5, dt, 4); M.alt = toward(M.alt, 1.2, dt, 3); if (!M.roared) { M.roared = true; FX.H.sfx.crash(); FX.H.shake(6, 0.3); } } }
      else if (M.wasEnter) { M.wasEnter = false; M.recoil = 1; M.beat = 1; M.flare = 1; M.roar = 0.6; FX.H.sfx.whoosh(); for (let i = 0; i < 12; i++) glitter(FX, m, M, 1.5); } },
    dmgK() { return 1; },
    keep: { every: 2 },
    draw(c, FX, m, X, Y, T, t) { drawMoth(c, FX, m, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'lantern') drawLantern(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m) return;
      for (const s of M.beams) { const x0 = FX.sx(s.x), y0 = FX.sy(s.y), yb = y0 - (M.alt || 0) * T, x1 = FX.sx(s.x + Math.cos(s.a) * s.len), y1 = FX.sy(s.y + Math.sin(s.a) * s.len); c.save();
        if (!s.done) { const u = s.age / s.t; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + 0.4 * u; c.strokeStyle = MOON; c.lineWidth = Math.max(1.5, T * 0.12); c.setLineDash([T * 0.5, T * 0.35]); c.lineDashOffset = -t * T * 3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]); c.globalAlpha = 0.15 + 0.2 * u; c.lineWidth = s.w * T; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
        else { const fl = flicker(t); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * fl; c.strokeStyle = MOON; c.lineCap = 'round'; c.lineWidth = s.w * T; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.globalAlpha = 0.9; c.lineWidth = s.w * T * 0.3; c.strokeStyle = '#FFFFFF'; c.stroke(); c.globalAlpha = 1; softRay(c, x0, yb, x1, y1, s.w * T * 0.45, MOON, 0.8 * fl, 0.5); blitSized(c, glowSprite(MOON), x1 - T * 1.5, y1 - T * 1.5, T * 3, T * 3); }
        c.restore(); } },
  };
  /* ---- the lure lanterns: four, drifting about the bower on their own slow paths ---- */
  function spawnLantern(FX, i) { const h0 = lanHome(FX.C, i), h = FX.mem.lanterns[i]; h.obj = FX.obj({ kind: 'lantern', x: h0[0], y: h0[1], r: 0.85, hp: FX.S.barHP * 0.025, idx: i, hx: h0[0], hy: h0[1], ph: i * 1.7, tick: (o, dt) => { const p = FX.clampArena({ x: o.hx + Math.cos(o.t * 0.45 + o.ph) * 1.8, y: o.hy + Math.sin(o.t * 0.31 + o.ph) * 1.3 }, 1.2); o.x = p.x; o.y = p.y; },
    onKill: o => { const m = FX.m, M = FX.mem; if (!m || m.dead) return; FX.H.boom(o.x, o.y, 1.2, ROSE_HI, '#FFFFFF', { n: 14, shake: 5 }); FX.H.sfx.pop(); M.lit = M.lanterns.filter(h2 => h2.obj && !h2.obj.dead).length; M.recoil = Math.max(M.recoil, 0.5); M.beat = 1;
      if (M.lit <= 0) { m.stunT = 7; m.act = 'circle'; m.actT = 0; M.ground = 0; FX.S.tele.length = 0; M.beams.length = 0; FX.H.banner('THE LANTERNS GO OUT', 'It falls from the air: strike the eye!', MOON, 2.2, true); FX.H.shake(12, 0.5); FX.H.sfx.crash(); for (let k = 0; k < 20; k++) glitter(FX, m, M, 1.5); }
      else FX.H.text(o.x, o.y - 1.6, `A lure is snuffed · ${M.lit} left`, ROSE_HI, 13); } }); }
  function drawLantern(c, FX, o, X, Y, T, t) { const cracked = 1 - o.hp / o.maxhp, fl = flicker(t + o.idx), sw = Math.sin(t * 1.8 + o.idx) * 0.1, bob = Math.sin(t * 2.3 + o.idx * 1.3) * T * 0.1; c.save();
    c.fillStyle = 'rgba(10,6,4,.3)'; c.beginPath(); c.ellipse(X, Y + T * 0.1, T * 0.45, T * 0.18, 0, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * fl + 0.2 * Math.sin(t * 5 + o.idx); blitSized(c, glowSprite(ROSE_HI), X - T * 1.6, Y - T * 2.6 + bob, T * 3.2, T * 3.2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // a paper lantern on a floating seed: a plum frame, rose paper, lit from within
    c.translate(X, Y - T * 1.1 + bob); c.rotate(sw); c.strokeStyle = INK; c.lineWidth = Math.max(1.2, T * 0.06); c.beginPath(); c.moveTo(0, -T * 0.95); c.lineTo(0, -T * 0.6); c.stroke(); c.fillStyle = JADE; c.beginPath(); c.ellipse(0, -T * 1.0, T * 0.22, T * 0.1, 0, 0, TAU); c.fill(); c.stroke();
    TN.shape(c, TN.ell(0, 0, T * 0.42, T * 0.55), { col: cracked > 0.5 ? '#C97A9F' : ROSE, shade: ROSE_SH, hi: ROSE_HI, line: INK, r: T * 0.5, lw: Math.max(1.2, T * 0.06), spec: 0.4, specAt: [-T * 0.15, -T * 0.3], force: true, inner: g => { g.save(); g.strokeStyle = 'rgba(26,13,32,.45)'; g.lineWidth = Math.max(1, T * 0.04); for (let i = -1; i <= 1; i++) { g.beginPath(); g.ellipse(0, i * T * 0.22, T * 0.42, T * 0.08, 0, 0, TAU); g.stroke(); } g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 * fl; blitSized(g, glowSprite('#FFF0F6'), -T * 0.4, -T * 0.4, T * 0.8, T * 0.8); g.restore(); } });
    if (cracked > 0.3) { c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-T * 0.1, -T * 0.45); c.lineTo(T * 0.08, -T * 0.1); c.lineTo(-T * 0.06, T * 0.25); c.stroke(); }
    c.fillStyle = INK; c.fillRect(-T * 0.2, T * 0.5, T * 0.4, T * 0.07); c.restore(); }
  // glitter shed from a wing: a star of cream or gold, drifting down
  function glitter(FX, m, M, k) { const s = Math.random() < 0.5 ? -1 : 1, W = mothFrame(m, M), p = W(FX.rnd(-1.5, 0.8), s * FX.rnd(1 + VOFF, 3.2 + VOFF), 0); FX.H.part({ kind: 'star', x: p[0], y: p[1] - M.alt, vx: FX.rnd(-0.6, 0.6), vy: 0.6 + Math.random() * 0.8, g: 0.8, life: 0.9 + Math.random() * 0.5, max: 1.3, size: (2 + Math.random() * 2) * k, color: Math.random() < 0.4 ? GOLD : CREAM }); }
  function fly(FX, m, M, tx, ty, spd, dt, turn) { const want = Math.atan2(ty - m.y, tx - m.x), d = Math.hypot(tx - m.x, ty - m.y); if (d > 0.3) M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * (turn || 2.2))); const v = Math.min(spd, d * 3); m.x += Math.cos(M.hd) * v * dt; m.y += Math.sin(M.hd) * v * dt; const q = FX.clampArena(m, 1.5); m.x = q.x; m.y = q.y; }
  function bodyParts(m, M) { const W = mothFrame(m, M), b = W(0, 0, 0), l = W(0, 2.3, 0.4), r = W(0, -2.3, 0.4); return [hit('body', b, 1.7, m), hit('wingL', l, 1.4, m), hit('wingR', r, 1.4, m)]; }
  /* ---- choosing ---- */
  function pick(FX, m, d, P) { const r = Math.random(); if (r < 0.28) startVeil(FX, m); else if (r < 0.52) startDive(FX, m); else if (r < 0.78) startBeam(FX, m); else startStorm(FX, m); }
  function startVeil(FX, m) { const M = FX.mem, C = FX.C, P = FX.S.lv, wait = 1.7 / FX.S.fast, a = Math.random() * TAU, nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2), offs = P >= 2 ? [-6, -2, 2, 6] : [-4.5, 0, 4.5]; m.act = 'veil'; m.actT = 0; M.vw = wait; FX.H.sfx.hum();
    offs.forEach((off, k) => { const cx = C.x + nx * off, cy = C.y + ny * off, x0 = cx - Math.cos(a) * C.R, y0 = cy - Math.sin(a) * C.R; FX.tele({ shape: 'line', x: x0, y: y0, a, len: C.R * 2, w: 2.3, t: wait + k * 0.15, dmg: m.dmg * 0.9, col: GOLD, fn: s => { M.recoil = Math.max(M.recoil, 0.4); M.beat = 1; FX.H.sfx.whoosh(); FX.hz({ shape: 'line', kind: 'dust', x: s.x, y: s.y, a: s.a, len: s.len, w: s.w, life: 2.8 / FX.S.fast, dps: m.dmg * 0.5, tick: 0.3, arm: 0.1, col: GOLD, draw: (c, z, FX2, T, t) => { const X = FX.sx(z.x), Y = FX.sy(z.y), fade = Math.min(1, z.age / 0.3, (z.life - z.age) / 0.5); c.save(); c.translate(X, Y); c.rotate(z.a); c.globalAlpha = fade * 0.22; c.fillStyle = GOLD; c.fillRect(0, -z.w / 2 * T, z.len * T, z.w * T); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade * 0.75; c.fillStyle = '#FFF0C8'; for (let i = 0; i < z.len * 1.6; i++) { const ph = (t * 1.6 + i * 0.37) % 1, lx = i / 1.6 * T + Math.sin(i * 7.1) * T * 0.3; c.beginPath(); c.arc(lx, -T * 2.6 + ph * T * 2.6 + Math.sin(i * 3.3) * T * 0.5, T * 0.06 * (0.5 + ph), 0, TAU); c.fill(); } c.restore(); } }); } }); });
    FX.H.banner('DUST VEIL', 'Pollen falls in lanes: stand between them', GOLD, 1.8, true); }
  function startDive(FX, m) { const M = FX.mem, me = FX.me, k = 1 / FX.S.fast, a = Math.atan2(me.y - m.y, me.x - m.x), p0 = FX.clampArena({ x: me.x - Math.cos(a) * 8, y: me.y - Math.sin(a) * 8 }, 1.5), p1 = FX.clampArena({ x: me.x + Math.cos(a) * 8, y: me.y + Math.sin(a) * 8 }, 1.5), wait = 1.1 * k;
    M.dv = { x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, a: Math.atan2(p1.y - p0.y, p1.x - p0.x), wait, dur: 0.7 * k, hit: false }; m.act = 'dive'; m.actT = 0; FX.H.sfx.hum();
    FX.tele({ shape: 'line', x: p0.x, y: p0.y, a: M.dv.a, len: Math.hypot(p1.x - p0.x, p1.y - p0.y), w: 2.4, t: wait + 0.35 * k, dmg: m.dmg * 1.4, col: ROSE_HI }); FX.H.banner('LANTERN DIVE', 'Off the line', ROSE_HI, 1.2, true); }
  function startBeam(FX, m) { const M = FX.mem, P = FX.S.lv, wait = 1.3 / FX.S.fast, a0 = FX.angPet(m.x, m.y), dir = Math.random() < 0.5 ? 1 : -1; m.act = 'beam'; m.actT = 0; M.bw = wait; M.beams.length = 0; FX.H.sfx.hum();
    const mk = a => { let s; s = FX.tele({ shape: 'fn', x: m.x, y: m.y, a, len: 10, w: 1.7, t: wait, linger: 4.2 / FX.S.fast, dmg: m.dmg * 1.3, col: MOON, test: (x, y, rr) => { const rx = x - s.x, ry = y - s.y, al = rx * Math.cos(s.a) + ry * Math.sin(s.a), of = Math.abs(-rx * Math.sin(s.a) + ry * Math.cos(s.a)); return al > -rr && al < s.len + rr && of < s.w / 2 + rr; },
      tick: (dt, s2) => { s2.x = m.x; s2.y = m.y; if (!s2.done) return; s2.a += dt * 0.85 * dir * FX.S.fast; s2.hitT = (s2.hitT || 0) - dt; if (s2.hitT <= 0 && FX.inShape(s2, FX.me.x, FX.me.y, FX.me.r)) { s2.hitT = 0.9; FX.hurt(s2.dmg); } }, fn: () => { M.recoil = 0.5; M.flare = 1; FX.H.sfx.hum(); FX.H.shake(5, 0.3); } }); M.beams.push(s); };
    mk(a0); if (P >= 2) mk(a0 + Math.PI);
    FX.H.banner('MOONBEAM', P >= 2 ? 'Two beams sweep round like clock hands: keep ahead of them' : 'It sweeps round like a clock hand: keep ahead of it', MOON, 2, true); }
  function startStorm(FX, m) { const M = FX.mem, P = FX.S.lv; m.act = 'storm'; m.actT = 0; M.stT = 0.8; M.stN = P >= 2 ? 4 : 3; FX.H.sfx.hum(); FX.H.banner('SCALE STORM', 'Rings of scales: slip between them', ROSE_HI, 1.3, true); }
  /* ---- the moth in three dimensions ---- */
  function mothFrame(m, M) { const alt = M.alt == null ? 2.4 : M.alt, hs = m.hitSq || 0, g = M.ground || 0, bt = M.bt || 0, bob = Math.sin(bt * 1.7) * 0.12 * (1 - g), hover = Math.sin((M.wph || 0) * 0.5) * 0.04 * (1 - g);
    const pitch = -(M.fold || 0) * 0.5 * (1 - g) + (M.recoil || 0) * 0.3 + hs * 0.1 + g * 0.15 + (M.roar || 0) * 0.2, roll = clamp((M.turn || 0) * 0.28, -0.45, 0.45) * (1 - g) + g * Math.sin(bt * 2.2) * 0.06;
    return frame(m, M.hd == null ? Math.PI / 2 : M.hd, { z: alt + bob + hover + hs * 0.15, pitch, roll, scale: 1 + (M.roar || 0) * 0.08 + hs * 0.05 }); }
  function drawMoth(c, FX, m, X, Y, T, t) {
    const K = FX.K, M = FX.mem, P3 = TN.cam(X, Y, T, m), W = mothFrame(m, M), bt = M.bt || t, alt = M.alt == null ? 2.4 : M.alt, wph = M.wph == null ? t * 5 : M.wph, g = M.ground || 0, hs = m.hitSq || 0, menace = M.menace || 0, roar = M.roar || 0, fold = (M.fold || 0) * (1 - g), flare = Math.max(M.flare || 0, roar), lit = M.lit == null ? 4 : M.lit, me = FX.me || { x: m.x, y: m.y + 5 }, P = FX.S.lv || 1;
    const lw = Math.max(1.3, T * 0.07), br = Math.sin(bt * 1.7), fl = g > 0.5 ? Math.sin(wph) * 0.08 : Math.sin(wph), lift = g > 0.5 ? -0.25 : 0, churn = 1 + menace * 1.6 + roar * 2.5, lagx = -(M.vx || 0) * 0.05, lagy = -(M.vy || 0) * 0.05;
    TN.groundShadow(c, X, Y + T * 0.2, T * 3.4, T * 1.5, alt, 0.45);
    /* the ball: its centre on screen, its radii (it breathes, swells in a roar, is squashed by a blow, flops when grounded) */
    const bc = W(0, 0, 0.1 - g * 0.1), bq = P3(bc[0], bc[1], bc[2]), bx = bq[0], by = bq[1];
    const Rb = RB * T * (1 + br * 0.025 + roar * 0.06), Rx = Rb * (1 + hs * 0.12 + g * 0.06), Ry = Rb * (1 - hs * 0.16 - g * 0.08);
    /* a wing: its outline in wing-local coordinates (along the body, out from it), pushed out to the ball's side, flapped
       (the outer points rise and fall and draw in as it beats), folded back for a dive, flared for the storm; the far
       wing is drawn before the ball, the near one after */
    const wingPts = (s, pts) => pts.map(([u, v]) => { const k = v / 3.6, vv = v * (1 - Math.abs(fl) * 0.3 * k) * (1 - fold * 0.5) * (1 + flare * 0.15), uu = u - fold * 1.1 * k + (v > 1.5 ? Math.sin(bt * 3 + s) * 0.03 : 0); return W(uu, s * (VOFF + vv), (fl * 1.4 + lift) * k * (1 - fold * 0.4) + k * k * 0.15); });
    const wing = (s, near) => { const F = wingPts(s, FORE), Hd = wingPts(s, HIND), sp = F.map(p => P3(p[0], p[1], p[2])), sh = Hd.map(p => P3(p[0], p[1], p[2])), mp = ([u, v]) => { const q = wingPts(s, [[u, v]])[0]; return P3(q[0], q[1], q[2]); }, shimmer = Math.sin(bt * 0.7 + s) * 0.5 + 0.5;
      // the membrane: a pearl fill shaded lilac, translucent, with an iridescent wash that drifts between mint and lilac
      // along it, dark veins branching from the root, curves dividing the cells, and a paler dusting along the edge
      const membrane = (pts, root, veins, rr, inner) => { const rq = mp(root), tip = pts[Math.floor(pts.length * 0.4)], gr = c.createLinearGradient(rq[0], rq[1], tip[0], tip[1]);
        gr.addColorStop(0, `rgba(150,236,206,${0.45 + 0.2 * shimmer})`); gr.addColorStop(0.5, 'rgba(255,250,245,.1)'); gr.addColorStop(1, `rgba(205,150,255,${0.6 - 0.2 * shimmer})`);
        TN.shape(c, TN.blob(pts), { col: PEARL, shade: LILAC, shade2: '#9A78CC', hi: '#FFFFFF', line: RIM, r: rr, lw, d1: 0.08, d2: 0.16, spec: false, force: true, alpha: near ? 0.84 : 0.74, inner: gq => { gq.save();
          gq.fillStyle = gr; gq.fillRect(Math.min(rq[0], tip[0]) - rr * 3, Math.min(rq[1], tip[1]) - rr * 3, Math.abs(rq[0] - tip[0]) + rr * 6, Math.abs(rq[1] - tip[1]) + rr * 6);
          // the veins: from the root to the edge, with the cells between them divided twice over
          const ve = veins.map(mp); gq.strokeStyle = 'rgba(52,28,88,.62)'; gq.lineWidth = Math.max(1, T * 0.045); gq.lineCap = 'round'; gq.beginPath(); ve.forEach(q => { gq.moveTo(rq[0], rq[1]); gq.quadraticCurveTo((rq[0] + q[0]) / 2 + (q[1] - rq[1]) * 0.08, (rq[1] + q[1]) / 2 - (q[0] - rq[0]) * 0.08, q[0], q[1]); }); gq.stroke();
          gq.lineWidth = Math.max(0.8, T * 0.03); gq.beginPath(); for (const f of [0.5, 0.78]) for (let i = 0; i + 1 < veins.length; i++) { const a = veins[i], b = veins[i + 1], p0 = mp([lerp(root[0], a[0], f), lerp(root[1], a[1], f)]), p1 = mp([lerp(root[0], b[0], f), lerp(root[1], b[1], f)]), cm = mp([lerp(root[0], (a[0] + b[0]) / 2, f + 0.08), lerp(root[1], (a[1] + b[1]) / 2, f + 0.08)]); gq.moveTo(p0[0], p0[1]); gq.quadraticCurveTo(cm[0], cm[1], p1[0], p1[1]); } gq.stroke();
          // the edge, dusted violet, and the outer rim darker
          gq.strokeStyle = 'rgba(190,140,255,.45)'; gq.lineWidth = Math.max(2, T * 0.16); gq.beginPath(); pts.forEach((q, i) => i ? gq.lineTo(q[0], q[1]) : gq.moveTo(q[0], q[1])); gq.closePath(); gq.stroke();
          if (inner) inner(gq); gq.restore(); } }); };
      membrane(sh, HROOT, HVEINS, T * 1.2, gq => { gq.fillStyle = CREAM; HSTARS.forEach(([u, v]) => { const q = mp([u, v]); gq.globalAlpha = 0.7 + 0.3 * Math.sin(t * 3 + u * 5); gq.beginPath(); gq.arc(q[0], q[1], T * 0.045, 0, TAU); gq.fill(); }); });
      membrane(sp, FROOT, FVEINS, T * 1.6, gq => {
        // the constellation: dusted stars joined by faint lines, a brighter one at each node
        const st = STARS.map(mp); gq.strokeStyle = 'rgba(242,216,161,.4)'; gq.lineWidth = Math.max(1, T * 0.03); gq.beginPath(); LINKS.forEach(([a, b]) => { gq.moveTo(st[a][0], st[a][1]); gq.lineTo(st[b][0], st[b][1]); }); gq.stroke();
        gq.fillStyle = 'rgba(255,245,220,.6)'; for (let i = 0; i < 14; i++) { const q = mp([-0.8 + Math.sin(i * 2.7) * 0.9, 0.8 + (i / 14) * 2.6]); gq.beginPath(); gq.arc(q[0], q[1], T * 0.028, 0, TAU); gq.fill(); }
        st.forEach((q, i) => { TN.twinkle(gq, q[0], q[1], T * (0.06 + 0.025 * Math.sin(t * 4 + i)), i % 3 ? '#FFFFFF' : GOLD, 0.95); });
        if (flare > 0.1 || roar > 0) { gq.globalCompositeOperation = 'lighter'; gq.globalAlpha = Math.max(flare, roar) * 0.35; const q = mp([0, 2.2]); blitSized(gq, glowSprite(MOTE_A), q[0] - T * 1.5, q[1] - T * 1.5, T * 3, T * 3); } });
      // glitter twinkling along the scalloped edges, and more on the beating edge
      const edge = sp.slice(1, 10), ne = edge.length - 1; for (let i = 0; i < 6; i++) { const u = ((bt * 0.33 + i * 0.167) % 1) * ne, j = Math.min(ne - 1, Math.floor(u)), e = u - j, pulse = 0.5 + 0.5 * Math.sin(bt * 7 + i * 1.3); TN.twinkle(c, lerp(edge[j][0], edge[j + 1][0], e), lerp(edge[j][1], edge[j + 1][1], e), T * (0.06 + 0.07 * pulse), i % 2 ? '#FFFFFF' : '#E8C8FF', 0.5 + 0.5 * pulse); }
      for (let i = 0; i < 3; i++) { const q = sh[4 + i * 2]; TN.twinkle(c, q[0], q[1], T * (0.05 + 0.05 * Math.sin(bt * 6 + i * 2)), '#FFFFFF', 0.8); }
      if ((M.beat || 0) > 0.3 && near) for (let i = 0; i < 3; i++) { const q = sp[4 + i * 2]; TN.twinkle(c, q[0] + Math.sin(bt * 9 + i) * T * 0.2, q[1] - T * 0.1, T * 0.1, '#FFFFFF', (M.beat || 0) * 0.8); } };
    /* the smoke about it: dark blobs drifting round the ball (churning faster before a strike, bursting in a roar), half
       behind it and half in front; and the motes on their tilted orbits, behind when on the far side, in front when near */
    const smoke = front => { c.save(); for (let i = front ? 1 : 0; i < 9; i += 2) { const th = bt * (0.22 + 0.07 * (i % 3)) * churn + i * 0.7, dist = Rx * (0.8 + 0.3 * Math.sin(bt * 0.6 * churn + i * 1.7) + roar * 0.7 + g * 0.25), sz = Rx * (0.48 + 0.16 * Math.sin(bt * 0.9 + i * 2.1)) * (1 + roar * 0.8), x = bx + Math.cos(th) * dist * 1.1, y = by + Math.sin(th) * dist * 0.85;
        c.globalAlpha = Math.min(1, (front ? 0.5 : 0.95) * (1 + roar * 0.4)); c.fillStyle = SMOKE2; c.beginPath(); c.ellipse(x, y, sz * 1.25, sz * 0.8, th + bt * 0.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + sz * 0.55, y - sz * 0.3, sz * 0.65, sz * 0.5, th * 0.7, 0, TAU); c.fill();
        c.fillStyle = SMOKE; c.beginPath(); c.ellipse(x, y, sz * 0.85, sz * 0.52, th + bt * 0.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + sz * 0.5, y - sz * 0.25, sz * 0.42, sz * 0.32, th * 0.7, 0, TAU); c.fill(); } c.restore(); };
    const motes = front => { const spd = (1 + (P >= 2 ? 0.7 : 0) + menace * 0.5 + roar) * (1 - g * 0.6); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const o of MOTES) { const ph = bt * o.w * spd + o.ph, dep = Math.sin(ph); if ((dep >= 0) !== front) continue; const ra = Rx * o.ra * (1 + g * 0.9) + Math.sin(bt * 7 + o.ph) * Rx * 0.15 * g, at = q => { const x0 = Math.cos(q), y0 = Math.sin(q) * o.tilt; return [bx + (Math.cos(o.rot) * x0 - Math.sin(o.rot) * y0) * ra, by + (Math.sin(o.rot) * x0 + Math.cos(o.rot) * y0) * ra * 0.9]; };
        const p = at(ph), rr = T * (0.1 + 0.04 * dep); c.strokeStyle = o.col; for (let k = 1; k <= 8; k++) { const q0 = at(ph - (k - 1) * 0.11), q1 = at(ph - k * 0.11); c.globalAlpha = 0.6 * (1 - k / 9); c.lineWidth = rr * 1.5 * (1 - k / 10); c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.stroke(); }
        c.globalAlpha = 0.75; blitSized(c, glowSprite(o.col), p[0] - rr * 6, p[1] - rr * 6, rr * 12, rr * 12); c.globalAlpha = 1; c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(p[0], p[1], rr * 0.55, 0, TAU); c.fill(); TN.twinkle(c, p[0], p[1], rr * 1.6, o.col, 0.9); } c.restore(); };
    // a dark halo behind it all
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22 + menace * 0.15 + roar * 0.4; blitSized(c, glowSprite(MOTE_A), bx - Rx * 2.6, by - Rx * 2.6, Rx * 5.2, Rx * 5.2); c.restore();
    c.save(); const halo = c.createRadialGradient(bx, by, Rx * 0.7, bx, by, Rx * 2.0); halo.addColorStop(0, `rgba(14,2,24,${0.7 + roar * 0.3})`); halo.addColorStop(0.55, 'rgba(14,2,24,.3)'); halo.addColorStop(1, 'rgba(14,2,24,0)'); c.fillStyle = halo; c.fillRect(bx - Rx * 2.1, by - Rx * 2.1, Rx * 4.2, Rx * 4.2); c.restore();
    motes(false); smoke(false);
    const sL = Math.sin(W.th + Math.PI / 2) < 0, farS = sL ? 1 : -1;   // (the left wing is the far one when its side faces away from the camera)
    wing(farS, false);
    // the four lanterns: hung on short chains beneath the ball, in a row along its course, swinging with every change of it
    for (let k = 0; k < 4; k++) { const la = k * Math.PI / 2 + Math.PI / 4, on = k < lit, th = (M.lanA || 0) * (1 + k * 0.15) + Math.sin(bt * 2 + k) * 0.05, root = W(Math.cos(la) * 0.5, Math.sin(la) * 0.5, -RB * 0.7 - g * 0.1), L = 1.0 + k * 0.08, tip = [root[0] + Math.sin(th) * L * W.cf, root[1] + Math.sin(th) * L * W.sf, root[2] - Math.cos(th) * L], q0 = P3(root[0], root[1], root[2]), q1 = P3(tip[0], tip[1], tip[2]), fk = flicker(t + k);
      c.save(); c.strokeStyle = INK; c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.stroke(); c.fillStyle = PLUM_HI; for (let j = 1; j <= 3; j++) { const e = j / 4; c.beginPath(); c.arc(lerp(q0[0], q1[0], e), lerp(q0[1], q1[1], e), T * 0.04, 0, TAU); c.fill(); }
      if (on) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * fk; blitSized(c, glowSprite(ROSE_HI), q1[0] - T * 0.9, q1[1] - T * 0.9, T * 1.8, T * 1.8); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      TN.shape(c, TN.ell(q1[0], q1[1], T * 0.2, T * 0.26), { col: on ? ROSE_HI : '#4A2F42', shade: on ? ROSE : '#2A1A28', hi: on ? '#FFE9F4' : '#5A3E52', line: INK, r: T * 0.26, lw: lw * 0.7, spec: on ? 0.8 : false, specAt: [q1[0] - T * 0.07, q1[1] - T * 0.12], force: true }); c.restore(); }
    /* the ball itself: a yellow sclera shaded as a sphere, dark veins creeping in from its rim, smoke churning inside it,
       the iris on its surface where it looks (foreshortened toward the edge), the slit pupil, a fleshy lid */
    if (g > 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 * g * (0.8 + 0.2 * Math.sin(t * 6)); blitSized(c, glowSprite(GOLD), bx - T * 1.8, by - T * 1.8, T * 3.6, T * 3.6); c.restore(); }
    // where it looks: at the pet (in screen space, the ball floats above it), rolling about when it is grounded
    const dx = me.x - m.x, dy = me.y - m.y + alt, dl = Math.hypot(dx, dy) || 1; let gx = dx / dl * 0.58 * Math.min(1, dl / 1.5), gy = dy / dl * 0.58 * Math.min(1, dl / 1.5);
    if (g > 0.05) { gx = lerp(gx, Math.cos(bt * 5) * 0.55, g); gy = lerp(gy, Math.sin(bt * 5) * 0.4, g); }
    const gl = Math.hypot(gx, gy), fore = Math.sqrt(Math.max(0.2, 1 - gl * gl * 1.1)), ga = Math.atan2(gy, gx), ix = bx + gx * Rx, iy = by + gy * Ry, ir = Rx * 0.44, dil = clamp(1 - menace * 0.72 - roar * 0.95 + g * 0.35 + 0.08 * Math.sin(bt * 2.3), 0.07, 1.3);
    const lidK = clamp(Math.max(M.blink || 0, hs * 0.6, g * 0.42, 0.1 + menace * 0.14 - roar * 0.2), 0, 1);
    TN.shape(c, TN.ell(bx, by, Rx, Ry), { col: SCLERA, shade: SCLERA_SH, shade2: SCLERA_SH2, hi: SCLERA_HI, line: INK, r: Rx, lw: lw * 1.15, d1: 0.12, d2: 0.2, spec: 0.75, specAt: [bx - Rx * 0.38, by - Ry * 0.46], specR: 0.14, force: true, inner: gq => { gq.save();
      // the dark in it: smoke clipped to the ball, drifting round its lower half, and veins branching in from the rim
      for (let i = 0; i < 5; i++) { const th = bt * 0.3 * churn + i * 1.26, dist = Rx * (0.55 + 0.25 * Math.sin(bt * 0.5 + i)), sz = Rx * (0.5 + 0.15 * Math.sin(bt * 0.8 + i * 1.9)); gq.fillStyle = i % 2 ? 'rgba(40,10,60,.22)' : 'rgba(90,30,120,.16)'; gq.beginPath(); gq.ellipse(bx + Math.cos(th) * dist, by + Math.abs(Math.sin(th)) * dist * 0.7 + Ry * 0.15, sz, sz * 0.55, th, 0, TAU); gq.fill(); }
      gq.strokeStyle = 'rgba(96,22,70,.6)'; gq.lineWidth = Math.max(1, T * 0.04); gq.lineCap = 'round'; gq.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, ca = Math.cos(a), sa = Math.sin(a), r0 = 1.02, r1 = 0.62 + 0.08 * Math.sin(i * 3.1), wob = Math.sin(i * 2.3) * 0.12; gq.moveTo(bx + ca * Rx * r0, by + sa * Ry * r0); gq.quadraticCurveTo(bx + (ca * 0.85 - sa * wob) * Rx, by + (sa * 0.85 + ca * wob) * Ry, bx + ca * Rx * r1, by + sa * Ry * r1); gq.moveTo(bx + ca * Rx * 0.86, by + sa * Ry * 0.86); gq.quadraticCurveTo(bx + (ca * 0.8 + sa * 0.1) * Rx, by + (sa * 0.8 - ca * 0.1) * Ry, bx + (ca * 0.7 + sa * 0.18) * Rx, by + (sa * 0.7 - ca * 0.18) * Ry); } gq.stroke();
      // the iris: orange, rayed, foreshortened where it sits on the curve of the ball; a glow before a blow
      if (menace > 0.05) { gq.save(); gq.globalCompositeOperation = 'lighter'; gq.globalAlpha = menace * (0.45 + 0.25 * Math.sin(t * 14)); const r = ir * (1.6 + menace * 0.6); blitSized(gq, glowSprite('#FFB040'), ix - r, iy - r, r * 2, r * 2); gq.restore(); }
      gq.save(); gq.translate(ix, iy); gq.rotate(ga); gq.scale(fore, 1); gq.beginPath(); gq.arc(0, 0, ir, 0, TAU); gq.clip();
      const gr = gq.createRadialGradient(0, 0, ir * 0.3, 0, 0, ir); gr.addColorStop(0, IRIS_HI); gr.addColorStop(0.55, IRIS); gr.addColorStop(1, IRIS_SH); gq.fillStyle = gr; gq.fillRect(-ir, -ir, ir * 2, ir * 2);
      gq.strokeStyle = 'rgba(110,38,10,.5)'; gq.lineWidth = Math.max(0.8, T * 0.03); gq.beginPath(); for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + bt * 0.05, w = 0.42 + 0.14 * Math.sin(i * 1.7); gq.moveTo(Math.cos(a) * ir * w, Math.sin(a) * ir * w); gq.lineTo(Math.cos(a + 0.03) * ir, Math.sin(a + 0.03) * ir); } gq.stroke();
      gq.strokeStyle = 'rgba(255,220,120,.4)'; gq.beginPath(); for (let i = 0; i < 11; i++) { const a = (i + 0.5) / 11 * TAU - bt * 0.04; gq.moveTo(Math.cos(a) * ir * 0.5, Math.sin(a) * ir * 0.5); gq.lineTo(Math.cos(a) * ir * 0.85, Math.sin(a) * ir * 0.85); } gq.stroke();
      gq.lineWidth = Math.max(1.2, T * 0.06); gq.strokeStyle = IRIS_SH; gq.beginPath(); gq.arc(0, 0, ir * 0.97, 0, TAU); gq.stroke();
      // the pupil: a slit, upright on the screen, that widens when it is at ease and shrinks to a pin before a blow
      gq.scale(1 / fore, 1); gq.rotate(-ga); const pr = ir * 0.52; gq.fillStyle = '#060208'; gq.beginPath(); gq.ellipse(0, 0, Math.max(T * 0.03, pr * (0.18 + 0.82 * dil) * fore), pr * Math.min(1.15, 0.9 + dil * 0.2), 0, 0, TAU); gq.fill();
      gq.fillStyle = 'rgba(255,255,255,.9)'; gq.beginPath(); gq.ellipse(-pr * 0.5 * fore, -pr * 0.55, pr * 0.3 * fore, pr * 0.2, -0.5, 0, TAU); gq.fill(); gq.beginPath(); gq.arc(pr * 0.42 * fore, pr * 0.42, pr * 0.1, 0, TAU); gq.fill(); gq.restore();
      // the lid: fleshy violet, closing from the top (and a little from below) in a blink, drooping half shut when grounded
      if (lidK > 0.02) { const yT = by - Ry + lidK * Ry * 1.06, yB = by + Ry - lidK * Ry * 0.9, sag = Ry * 0.3 * (1 - lidK);
        gq.fillStyle = LID; gq.beginPath(); gq.moveTo(bx - Rx * 1.3, by - Ry * 1.4); gq.lineTo(bx + Rx * 1.3, by - Ry * 1.4); gq.lineTo(bx + Rx * 1.3, yT - sag); gq.quadraticCurveTo(bx, yT + sag * 1.2, bx - Rx * 1.3, yT - sag); gq.closePath(); gq.fill();
        gq.strokeStyle = LID_SH; gq.lineWidth = Math.max(2, T * 0.12); gq.beginPath(); gq.moveTo(bx - Rx * 1.3, yT - sag); gq.quadraticCurveTo(bx, yT + sag * 1.2, bx + Rx * 1.3, yT - sag); gq.stroke(); gq.strokeStyle = INK; gq.lineWidth = lw * 0.9; gq.stroke();
        if (lidK > 0.3) { gq.fillStyle = LID; gq.beginPath(); gq.moveTo(bx - Rx * 1.3, by + Ry * 1.4); gq.lineTo(bx + Rx * 1.3, by + Ry * 1.4); gq.lineTo(bx + Rx * 1.3, yB + sag * 0.5); gq.quadraticCurveTo(bx, yB - sag * 0.6, bx - Rx * 1.3, yB + sag * 0.5); gq.closePath(); gq.fill(); gq.strokeStyle = INK; gq.lineWidth = lw * 0.9; gq.beginPath(); gq.moveTo(bx - Rx * 1.3, yB + sag * 0.5); gq.quadraticCurveTo(bx, yB - sag * 0.6, bx + Rx * 1.3, yB + sag * 0.5); gq.stroke(); } }
      gq.restore(); } });
    /* the lashes: long fur-like strokes all round the rim, longest over the top, dark at the root and paler toward the tip,
       swaying with its motion and rippling; they flare out in a roar and before a blow, and droop when it is grounded */
    { const N = 46, flareK = Math.max(roar, menace * 0.6, flare * 0.4), rollK = clamp((M.turn || 0) * 0.15, -0.3, 0.3) * (1 - g); c.save(); c.lineJoin = 'round';
      for (const layer of [0, 1]) { c.fillStyle = layer ? LASH_HI : LASH; c.beginPath();
        for (let i = 0; i < N; i++) { const a = i / N * TAU + 0.07, ca = Math.cos(a), sa = Math.sin(a), top = Math.max(0, -sa), sway = Math.sin(bt * 3.2 + i * 0.85) * 0.09 + rollK * ca + (lagx * ca + lagy * sa) * 0.6 * (1 - g) + Math.sin(bt * 11 + i) * 0.03 * g * 0.5;
          const L = Rx * (0.3 + 0.42 * top + 0.04 * Math.sin(i * 2.9)) * (1 + flareK * 0.45) * (1 - g * 0.18 * (1 - top)), w = Rx * (0.05 + 0.02 * top) * (layer ? 0.45 : 1), bend = sway * 2 + flareK * 0.1 * Math.sin(i * 1.3) + (top * 0.15 * (ca > 0 ? -1 : 1)) * (1 + g);
          const r0 = layer ? 0.98 + 0.3 * (L / Rx) : 0.96, x0 = bx + ca * Rx * r0, y0 = by + sa * Ry * r0, L1 = layer ? L * 0.68 : L, aT = a + bend, xt = x0 + Math.cos(aT) * L1, yt = y0 + Math.sin(aT) * L1, xc = x0 + Math.cos(a + bend * 0.4) * L1 * 0.55, yc = y0 + Math.sin(a + bend * 0.4) * L1 * 0.55, px = -sa * w, py = ca * w;
          c.moveTo(x0 - px, y0 - py); c.quadraticCurveTo(xc - px * 0.45, yc - py * 0.45, xt, yt); c.quadraticCurveTo(xc + px * 0.45, yc + py * 0.45, x0 + px, y0 + py); c.closePath(); }
        c.fill(); } c.restore(); }
    wing(-farS, true);
    smoke(true); motes(true);
    // a roar, or the cry of its entrance: a flare of violet about it
    if (roar > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = roar * 0.35; blitSized(c, glowSprite(MOTE_A), bx - T * 4, by - T * 3, T * 8, T * 6); c.restore(); }
    if (g > 0.4) for (let i = 0; i < 3; i++) { const a = bt * 3 + i * TAU / 3; TN.twinkle(c, bx + Math.cos(a) * T * 1.6, by - T * 1.6 + Math.sin(a) * T * 0.35, T * 0.18, '#FFFFFF', 0.9); }
  }
})());
