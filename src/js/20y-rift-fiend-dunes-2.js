/* ---------- ONEIRA THE LISTENING SHELL ----------
   A huge spiral shell of banded bone and basalt, an ammonite's coil the height of a house, hanging over the Whorl's
   sand and turning slowly as it drifts; from its opening peers a soft mollusc body, pale and wet, with five eyes on
   glowing cyan stalks that watch the pet; echo rings pulse from the shell, and it turns its opening toward whatever
   it listens to. Echo Call sends expanding rings out over the sand that the pet must step between; Listening Beam
   points the opening at the pet and holds a beam on it that tracks slowly; Grub Chorus marks circles and calls grubs
   (and mantas) up through them; Shell Slam tips the whole shell and brings it down in a ring with gaps. Four Echo
   Stones stand round the Whorl: a ring that passes over one lights it for a while; crack a lit stone, and when all
   four are cracked the shell is deafened: the body slumps out of it onto the sand for seven seconds with its mantle
   bared. In the second phase the rings come faster and the beam is two.
   It is never still: it bobs on the air and rolls a little as it turns, the body breathes in the opening, the eye
   stalks sway and track the pet and blink one after another, echo rings pulse from it; before a beam it turns its
   opening square to the pet and the eyes gather; before a slam it rises and tips; struck, it is squashed and the
   eyes flinch in; deafened, it lies on its side and the body lolls out; it flares and cries on entering. */
RiftFiend.define({ id: 'oneira', name: 'Oneira', title: 'The Listening Shell', color: '#28252F', glow: '#62BFC9', accent: '#DFFFF8', biome: 'dunes', r: 2.5, els: ['earth', 'wind'] }, (() => {
  const { TAU, TN, hit } = RiftFiend, G = DuneFiend, tubeLite = TN.tubeLite;
  const { OCHRE, OCHRE_SH, OCHRE_HI, BASALT, BASALT_SH, BASALT_HI, BONE, BONE_SH, BONE_HI, CYAN, CYAN_HI, AMBER, INK, decay, toward, lerp, snap } = G;
  const FLESH = '#E3C2B0', FLESH_SH = '#B88E80', FLESH_HI = '#F7E3D8', ST_A = [Math.PI / 4, Math.PI / 4 + Math.PI / 2, Math.PI / 4 + Math.PI, Math.PI / 4 + Math.PI * 1.5];
  const stoneAt = (C, i) => [C.x + Math.cos(ST_A[i]) * (C.R - 3.6), C.y + Math.sin(ST_A[i]) * (C.R - 3.6)];
  /* the coil: a logarithmic spiral in units of the shell's radius, its centreline and the whorl's width at each step */
  const RS = 2.6, B = 0.17, TH = 2.6 * TAU, SPIRAL = []; for (let th = 0; th <= TH + 1e-6; th += 0.16) { const r = Math.exp(B * (th - TH)); SPIRAL.push({ th, rc: r * 0.672, w: r * 0.656 * 1.1 }); }
  const APER = TH + Math.PI / 2;   // the aperture's tangent, before the shell is turned
  const flicker = t => 0.8 + 0.12 * Math.sin(t * 17) + 0.08 * Math.sin(t * 5.1 + 1);
  return {
    arenaR: 15, firstAct: 'circle', artY: 0.5,
    artPoses: [{ name: 'drifting, listening', mem: { ap: 2.2, alt: 2.4 } }, { name: 'the opening turned to beam', mem: { ap: 1.57, alt: 2.6, menace: 1, aim: 1 } }, { name: 'tipped for a slam', mem: { ap: 2.6, alt: 3.4, tip: 1, menace: 1 } }, { name: 'deafened: the mantle bared', mem: { ap: 1.57, alt: 0.2, slump: 1 } }],
    phaseNames: ['The Whorl', 'The Second Voice', 'The Deafening', 'The Last Echo'],
    paintGround(c, A) { G.floor(c, A, { mid: '#D4AB68', edge: '#B98C4C', extra: (c2, A2) => { const R = A2.R;
      // the Whorl: a great spiral groove in the sand, and the stones' footings
      c2.strokeStyle = 'rgba(110,70,25,.3)'; c2.lineWidth = 0.45; c2.beginPath(); for (let th = 0; th < 5 * TAU; th += 0.1) { const r = 0.3 + th * 0.36, x = Math.cos(th) * r, y = Math.sin(th) * r * 0.85; th ? c2.lineTo(x, y) : c2.moveTo(x, y); } c2.stroke(); c2.strokeStyle = 'rgba(255,240,200,.25)'; c2.lineWidth = 0.14; c2.stroke();
      ST_A.forEach(a => { const x = Math.cos(a) * (R - 3.6), y = Math.sin(a) * (R - 3.6); c2.fillStyle = BASALT; c2.beginPath(); c2.ellipse(x, y + 0.2, 1.4, 0.7, 0, 0, TAU); c2.fill(); c2.strokeStyle = BASALT_SH; c2.lineWidth = 0.12; c2.stroke(); c2.fillStyle = 'rgba(98,191,201,.15)'; c2.beginPath(); c2.ellipse(x, y + 0.15, 1.1, 0.5, 0, 0, TAU); c2.fill(); }); } }); },
    sky(c, W, H, t, cam, T) { G.sky(c, W, H, t, cam, T, { top: '#230C1E', mid: '#4E1A36' }); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m; m.noTouch = true; m.x = FX.C.x; m.y = FX.C.y - 4; m.act = 'enter';
      Object.assign(M, { ap: Math.PI / 2, alt: 2.4, roll: 0, tip: 0, slump: 0, aim: 0, menace: 0, roar: 0, recoil: 0, bt: 0, px: m.x, py: m.y, vx: 0, vy: 0, spd: 0, hd: Math.PI / 2, lastHd: Math.PI / 2, turn: 0, blinks: [0, 0, 0, 0, 0], blinkT: 1.5, stones: ST_A.map(() => ({ obj: null })), cracked: 0, relightT: 0, beams: [], echoes: [], broodT: 13, wasEnter: true, roared: false, wasStun: false, dir: 1, seen: {}, pulseT: 0, slamK: 0, slamT: 9 });
      ST_A.forEach((a, i) => spawnStone(FX, i)); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; M.roar = 1; M.menace = 1; M.broodT = 4; FX.H.shake(10, 0.5); FX.H.flash(0.2, CYAN); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - M.alt, CYAN, 20, 8); FX.H.ring(m.x, m.y, 0.5, 8, 0.9, CYAN, 0.4);
      for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; const g = FX.minion('grub', m.x + Math.cos(a) * 3, m.y + Math.sin(a) * 3); if (g) { g.mode = 'rise'; g.riseT = 0.3; } }
      if (lv >= 2) FX.H.banner('THE SECOND VOICE', 'Two beams; the rings come faster; grubs answer its call', CYAN, 2.6, true); if (lv >= 4) FX.H.banner('The Last Echo', 'Every stone rings at once', '#FF6A5A', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, fast = (1 + (P - 1) * 0.08) * FX.S.fast, d = FX.dist(m.x, m.y); m.actT += dt; m.noTouch = true;
      if (M.relightT > 0) { M.relightT -= dt; if (M.relightT <= 0) { M.relightT = 0; M.cracked = 0; M.stones.forEach((h, i) => { if (!h.obj || h.obj.dead) spawnStone(FX, i); }); FX.H.banner('THE STONES STAND AGAIN', 'Four echo stones round the Whorl', CYAN, 1.6, true); } }
      if (P >= 2 && (M.broodT -= dt) <= 0 && m.act === 'circle') { M.broodT = P >= 4 ? 9 : 13; callAt(FX, m, me.x + FX.rnd(-3, 3), me.y + FX.rnd(-3, 3), 1.2, 'grub'); callAt(FX, m, me.x + FX.rnd(-3, 3), me.y + FX.rnd(-3, 3), 1.4, 'manta'); FX.H.text(m.x, m.y - M.alt - 2, 'Its call is answered', CYAN, 13); }
      let menace = 0, aim = 0, tip = 0, altW = 2.4, apW = null;
      switch (m.act) {
        case 'circle': { M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.45 * fast * (M.dir || 1); const R = 6.5 + Math.sin(m.t * 0.5) * 1.2, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 2.5); fly(FX, m, M, p.x, p.y, 4 * fast, dt, 1.8); altW = 2.4 + Math.sin(m.t * 0.9) * 0.3;
          if (m.actT > (P >= 3 ? 1.6 : 2.0) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; pick(FX, m, d, P); } break; }
        case 'echo': { fly(FX, m, M, m.x, m.y, 1, dt, 1); menace = 0.7; altW = 2.8; if (m.actT > M.ew + 0.6) { m.act = 'circle'; m.actT = 0; } break; }
        case 'beam': { fly(FX, m, M, m.x, m.y, 1, dt, 1); menace = m.actT < M.bw ? 1 : 0.6; aim = 1; altW = 2.6; apW = M.beams.length ? M.beams[0].a : FX.angPet(m.x, m.y); if (m.actT > M.bw + 3.6 / FX.S.fast) { m.act = 'circle'; m.actT = 0; M.beams.length = 0; M.recoil = 0.5; } break; }
        case 'chorus': { fly(FX, m, M, m.x, m.y, 1, dt, 1); menace = 0.6; altW = 3.0; apW = FX.angPet(m.x, m.y); if (m.actT > 2.0) { m.act = 'circle'; m.actT = 0; } break; }
        case 'slam': { const up = m.actT < M.sw; fly(FX, m, M, m.x, m.y, 1, dt, 1); menace = up ? 1 : 0.2; tip = up ? Math.min(1, m.actT / (M.sw * 0.6)) : 0; altW = up ? 3.6 : (M.slamT < 0.4 ? 0.25 : 2.4); if (m.actT > M.sw + 1.0) { m.act = 'circle'; m.actT = 0; } break; }
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3); M.aim = toward(M.aim, aim, dt, 4); M.tip = toward(M.tip, tip, dt, tip > M.tip ? 2.5 : 8); M.alt = toward(M.alt, altW, dt, altW < M.alt && m.act === 'slam' ? 14 : 2.5); M.slump = decay(M.slump, dt, 2);
      // where the opening points: at the pet when it listens or strikes, else drifting round slowly as it turns
      if (apW != null) M.ap = FX.K.lerpA(M.ap, apW, Math.min(1, dt * (aim ? 4 : 2.5))); else M.ap = FX.K.lerpA(M.ap, FX.angPet(m.x, m.y) + Math.sin(m.t * 0.35) * 0.9, Math.min(1, dt * 0.8));
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.slump = Math.min(1, M.slump + dt * 2); M.alt = toward(M.alt, 0.2, dt, 3.5); M.menace = decay(M.menace, dt, 4); M.aim = decay(M.aim, dt, 3); M.tip = decay(M.tip, dt, 3); M.beams.length = 0; m.noTouch = true; M.ap = FX.K.lerpA(M.ap, Math.PI / 2 + 0.3, Math.min(1, dt * 3));
      const p = mantleAt(m, M); FX.weak('mantle', p[0], p[1], 1.3, 2.4, m.stunT > 0.05);
      // deafened: it twitches and spills sand
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.45; G.sand(FX, p[0] + FX.rnd(-1, 1), p[1] + FX.rnd(-0.5, 0.5), 3, 0.7); FX.H.shake(1.5, 0.08); }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return; M.bt += dt;
      if (!(m.stunT > 0)) { if (FX.S.weak.mantle) FX.weak('mantle', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.relightT = 3; M.recoil = 0.8; M.roar = 0.5; FX.H.text(m.x, m.y - 2, 'It draws back into the shell', CYAN_HI, 13); } } else M.wasStun = true;
      // how it moves: it banks into its turns, the roll follows its course
      if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt; M.px = m.x; M.py = m.y; M.vx = toward(M.vx, vx, dt, 8); M.vy = toward(M.vy, vy, dt, 8); M.spd = toward(M.spd, Math.hypot(vx, vy), dt, 6); let dh = M.hd - M.lastHd; while (dh > Math.PI) dh -= TAU; while (dh < -Math.PI) dh += TAU; M.lastHd = M.hd; M.turn = toward(M.turn, clamp(dh / dt, -3, 3), dt, 4); }
      M.roll = toward(M.roll, clamp(M.turn * 0.12, -0.25, 0.25) + M.vx * 0.02, dt, 4);
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.2); M.slamT += dt;
      // the eyes blink, one after another
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 2.5 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.5; for (let i = 0; i < 5; i++) { const u = clamp((M.blinkU - i * 0.08) / 0.3, 0, 1); M.blinks[i] = Math.sin(u * Math.PI); } if (M.blinkU >= 1) { M.blinkU = null; M.blinks.fill(0); } }
      // the echo rings pulsing from it, and the beams that have left the fight's list
      M.pulseT -= dt; if (M.pulseT <= 0) { M.pulseT = (m.stunT > 0 ? 2.2 : 1.1) - (M.menace || 0) * 0.4; M.echoes.push({ t: 0 }); if (M.echoes.length > 4) M.echoes.shift(); } for (const e of M.echoes) e.t += dt;
      if (M.beams.length) M.beams = M.beams.filter(s => FX.S.tele.includes(s));
      // the entrance: it sinks down out of the dusk, its eyes flare and it cries, the first echo ring rolls from it
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.alt = 2.4 + Math.max(0, 1.6 - e) * 2.5; if (e > 1.4) { M.menace = toward(M.menace, 1, dt, 5); M.aim = toward(M.aim, 1, dt, 3); if (!M.roared) { M.roared = true; M.roar = 1; FX.H.sfx.hum(); FX.H.sfx.crash(); FX.H.shake(6, 0.3); FX.H.ring(m.x, m.y, 0.3, 7, 1, CYAN, 0.4); } } }
      else if (M.wasEnter) { M.wasEnter = false; M.recoil = 1; M.roar = 0.5; FX.H.sfx.whoosh(); } },
    dmgK() { return 1; },
    keep: { every: 2 },
    draw(c, FX, m, X, Y, T, t) { drawShell(c, FX, m, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'stone') drawStone(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m) return;
      // the beams: a dotted aim line while they wait, then a bar of cyan light from the opening to the sand, tracking
      for (const s of M.beams) { const x0 = FX.sx(s.x), y0 = FX.sy(s.y), ya = y0 - (M.alt || 0) * T, x1 = FX.sx(s.x + Math.cos(s.a) * s.len), y1 = FX.sy(s.y + Math.sin(s.a) * s.len); c.save();
        if (!s.done) { const u = s.age / s.t; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + 0.4 * u; c.strokeStyle = CYAN_HI; c.lineWidth = Math.max(1.5, T * 0.12); c.setLineDash([T * 0.5, T * 0.35]); c.lineDashOffset = -t * T * 3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]); c.globalAlpha = 0.12 + 0.2 * u; c.lineWidth = s.w * T; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
        else { const fl = flicker(t); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * fl; c.strokeStyle = CYAN; c.lineCap = 'round'; c.lineWidth = s.w * T; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.globalAlpha = 0.9; c.lineWidth = s.w * T * 0.3; c.strokeStyle = '#FFFFFF'; c.stroke(); c.globalAlpha = 1; softRay(c, x0, ya, x1, y1, s.w * T * 0.45, CYAN, 0.8 * fl, 0.5); blitSized(c, glowSprite(CYAN), x1 - T * 1.5, y1 - T * 1.5, T * 3, T * 3);
          // sound rings down the beam
          c.strokeStyle = CYAN_HI; c.lineWidth = Math.max(1, T * 0.06); for (let i = 0; i < 4; i++) { const u = (t * 1.6 + i / 4) % 1, px = lerp(x0, x1, u), py = lerp(ya, y1, u); c.globalAlpha = (1 - u) * 0.6; c.beginPath(); c.ellipse(px, py, T * (0.2 + u * 0.7), T * (0.1 + u * 0.35), Math.atan2(y1 - ya, x1 - x0) + Math.PI / 2, 0, TAU); c.stroke(); } }
        c.restore(); }
      // the echo rings pulsing from it over the sand
      const X = FX.sx(m.x), Y = FX.sy(m.y); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = CYAN; for (const e of M.echoes) { const u = e.t / 2.2; if (u >= 1) continue; c.globalAlpha = (1 - u) * 0.35; c.lineWidth = Math.max(1, T * (0.12 - u * 0.08)); c.beginPath(); c.ellipse(X, Y, T * (0.6 + u * 7), T * (0.25 + u * 2.8), 0, 0, TAU); c.stroke(); } c.restore(); },
  };
  /* ---- the echo stones: four, round the Whorl; a ring that passes one lights it; crack all four to deafen it ---- */
  function spawnStone(FX, i) { const p = stoneAt(FX.C, i), h = FX.mem.stones[i]; h.obj = FX.obj({ kind: 'stone', x: p[0], y: p[1], r: 0.9, hp: FX.S.barHP * 0.03, idx: i, invuln: true, lit: 0, tick: (o, dt) => { if (o.lit > 0) { o.lit -= dt; if (o.lit <= 0) { o.lit = 0; o.invuln = true; } } },
    onKill: o => { const m = FX.m, M = FX.mem; if (!m || m.dead) return; M.cracked = Math.min(4, (M.cracked || 0) + 1); FX.H.boom(o.x, o.y, 1.3, CYAN, '#FFFFFF', { n: 16, shake: 7 }); FX.H.sfx.crack(); for (let k = 0; k < 8; k++) FX.H.part({ kind: 'shard', x: o.x, y: o.y - 1, vx: FX.rnd(-3, 3), vy: FX.rnd(-5, -1), g: 8, life: 0.8, max: 0.8, size: 5, rot: Math.random() * 3, vr: 6, color: BASALT_HI }); M.recoil = Math.max(M.recoil, 0.5);
      if (M.cracked >= 4) deafen(FX, m); else FX.H.text(o.x, o.y - 1.8, `A stone cracks · ${M.cracked} of 4`, CYAN_HI, 13); } }); }
  function lightStone(FX, o) { if (o.dead) return; const was = o.lit > 0; o.lit = 6; o.invuln = false; if (!was) { FX.H.ring(o.x, o.y, 0.3, 2.4, 0.5, CYAN, 0.35); FX.H.sfx.chime(); FX.H.text(o.x, o.y - 1.8, 'LIT', CYAN_HI, 12); } }
  function deafen(FX, m) { const M = FX.mem; m.stunT = 7; m.act = 'circle'; m.actT = 0; M.slump = 0; FX.S.tele.length = 0; M.beams.length = 0; M.roar = 0.6; FX.H.banner('DEAFENED', 'The body slumps from the shell: strike the mantle!', CYAN, 2.2, true); FX.H.shake(12, 0.5); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - M.alt, CYAN, 18, 7); FX.H.flash(0.2, CYAN_HI); }
  function drawStone(c, FX, o, X, Y, T, t) { const lit = o.lit > 0, k = lit ? 0.7 + 0.3 * Math.sin(t * 5 + o.idx) : 0.2 + 0.1 * Math.sin(t * 1.5 + o.idx), cracked = 1 - o.hp / o.maxhp, lw = Math.max(1.2, T * 0.07); c.save();
    c.fillStyle = 'rgba(60,40,20,.3)'; c.beginPath(); c.ellipse(X, Y + T * 0.1, T * 1.0, T * 0.36, 0, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = (lit ? 0.6 : 0.15) * k; blitSized(c, glowSprite(CYAN), X - T * 2, Y - T * 3, T * 4, T * 4); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // a standing slab of basalt with an ammonite fossil set in its face, which glows when the stone is lit
    TN.shape(c, TN.blob([[X - T * 0.9, Y + T * 0.05], [X - T * 0.8, Y - T * 1.4], [X - T * 0.3, Y - T * 2.2], [X + T * 0.5, Y - T * 2.1], [X + T * 0.9, Y - T * 1.1], [X + T * 0.85, Y + T * 0.1]]), { col: BASALT, shade: BASALT_SH, hi: BASALT_HI, line: INK, r: T * 1.1, lw, d1: 0.1, d2: 0.2, spec: 0.25, specAt: [X - T * 0.3, Y - T * 1.8], force: true, inner: g => { g.save(); g.lineCap = 'round'; g.strokeStyle = lit ? CYAN_HI : BONE_SH; g.lineWidth = Math.max(1.2, T * 0.09); g.beginPath(); for (let th = 0; th < 3.2 * TAU; th += 0.15) { const r = T * 0.05 + th * T * 0.028, x = X - T * 0.05 + Math.cos(th) * r, y = Y - T * 1.05 + Math.sin(th) * r; th ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); if (lit) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 * k; blitSized(g, glowSprite(CYAN), X - T * 0.9, Y - T * 1.9, T * 1.8, T * 1.8); } g.restore(); } });
    if (cracked > 0.3) { c.strokeStyle = INK; c.lineWidth = Math.max(1.2, T * 0.08); c.beginPath(); c.moveTo(X - T * 0.4, Y - T * 2.0); c.lineTo(X - T * 0.1, Y - T * 1.5); c.lineTo(X - T * 0.35, Y - T * 1.0); c.lineTo(X + T * 0.1, Y - T * 0.4); c.stroke(); }
    if (lit) { c.strokeStyle = CYAN_HI; c.lineWidth = Math.max(1, T * 0.05); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const u = (t * 0.8 + i / 3) % 1; c.globalAlpha = (1 - u) * 0.7; c.beginPath(); c.ellipse(X, Y - T * 1.1, T * (0.9 + u * 1.3), T * (0.5 + u * 0.8), 0, 0, TAU); c.stroke(); } c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.font = `800 ${Math.round(T * 0.26)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText('LIT · crack it', X, Y - T * 2.7); c.fillText('LIT · crack it', X, Y - T * 2.7); }
    c.restore(); }
  function fly(FX, m, M, tx, ty, spd, dt, turn) { const want = Math.atan2(ty - m.y, tx - m.x), d = Math.hypot(tx - m.x, ty - m.y); if (d > 0.3) M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * (turn || 2.2))); const v = Math.min(spd, d * 3); m.x += Math.cos(M.hd) * v * dt; m.y += Math.sin(M.hd) * v * dt; const q = FX.clampArena(m, 2.2); m.x = q.x; m.y = q.y; }
  // the opening's place and the way out of it, in world units about the shell's centre on the ground
  function aperture(M) { const rot = (M.ap == null ? Math.PI / 2 : M.ap) - APER, last = SPIRAL[SPIRAL.length - 1], a = last.th + rot, dx = Math.cos(M.ap == null ? Math.PI / 2 : M.ap), dy = Math.sin(M.ap == null ? Math.PI / 2 : M.ap); return { x: Math.cos(a) * last.rc * RS, y: Math.sin(a) * last.rc * RS, dx, dy, w: last.w * RS }; }
  function mantleAt(m, M) { const A = aperture(M), ext = 0.9 + (M.slump || 0) * 2.4; return [m.x + A.x + A.dx * ext, m.y + A.y + A.dy * ext + (M.alt || 0) * 0]; }
  function bodyParts(m, M) { const A = aperture(M), alt = M.alt || 0; return [hit('shell', [m.x, m.y, alt], 2.6, m), hit('mouth', [m.x + A.x + A.dx * 0.8, m.y + A.y + A.dy * 0.8, alt], 1.3, m)]; }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 1.9 : 1.1, true); }
  /* ---- choosing ---- */
  function pick(FX, m, d, P) { const r = Math.random(); if (r < 0.3) startEcho(FX, m); else if (r < 0.55) startBeam(FX, m); else if (r < 0.77) startChorus(FX, m); else startSlam(FX, m); }
  function startEcho(FX, m) { const M = FX.mem, P = FX.S.lv, n = P >= 2 ? 4 : 3, sp = (P >= 2 ? 5.6 : 4.5) * FX.S.fast, wait = 0.9 / FX.S.fast, gapT = (P >= 2 ? 0.55 : 0.75) / FX.S.fast; m.act = 'echo'; m.actT = 0; M.ew = wait + n * gapT; FX.H.sfx.hum();
    for (let k = 0; k < n; k++) FX.tele({ shape: 'ring', x: m.x, y: m.y, r0: 0.6, r1: 1.7, t: wait + k * gapT, dmg: m.dmg * 1.2, col: CYAN, linger: (FX.C.R + 3) / sp, tick: (dt, s) => { if (!s.done) { s.x = m.x; s.y = m.y; return; } s.r0 += sp * dt; s.r1 += sp * dt; s.hitT = (s.hitT || 0) - dt; if (s.hitT <= 0 && FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) { s.hitT = 1; FX.hurt(s.dmg); }
      // the ring lights any stone it passes over
      for (const h of M.stones) { const o = h.obj; if (!o || o.dead) continue; const dd = Math.hypot(o.x - s.x, o.y - s.y); if (dd > s.r0 - 0.5 && dd < s.r1 + 0.5) lightStone(FX, o); } }, fn: () => { M.recoil = Math.max(M.recoil, 0.4); M.echoes.push({ t: 0 }); FX.H.sfx.hum(); FX.H.shake(4, 0.2); } });
    say(FX, 'echo', 'ECHO CALL', 'Rings roll out: step between them (they light the stones they pass)', CYAN); }
  function startBeam(FX, m) { const M = FX.mem, P = FX.S.lv, wait = 1.3 / FX.S.fast, a0 = FX.angPet(m.x, m.y), dir = Math.random() < 0.5 ? 1 : -1; m.act = 'beam'; m.actT = 0; M.bw = wait; M.beams.length = 0; FX.H.sfx.hum();
    const mk = (a, k) => { let s; s = FX.tele({ shape: 'fn', x: m.x, y: m.y, a, len: 11, w: 1.6, t: wait, linger: 3.4 / FX.S.fast, dmg: m.dmg * 1.3, col: CYAN, test: (x, y, rr) => { const rx = x - s.x, ry = y - s.y, al = rx * Math.cos(s.a) + ry * Math.sin(s.a), of = Math.abs(-rx * Math.sin(s.a) + ry * Math.cos(s.a)); return al > -rr && al < s.len + rr && of < s.w / 2 + rr; },
      tick: (dt, s2) => { s2.x = m.x; s2.y = m.y; if (!s2.done) { if (k === 0) s2.a = FX.K.lerpA(s2.a, FX.angPet(m.x, m.y), Math.min(1, dt * 3)); else s2.a = M.beams[0] ? M.beams[0].a + 0.5 * dir : s2.a; return; } const want = FX.angPet(m.x, m.y) + (k ? 0.5 * dir : 0), rate = (P >= 2 ? 0.8 : 0.65) * FX.S.fast; s2.a = FX.K.lerpA(s2.a, want, Math.min(1, dt * rate)); s2.hitT = (s2.hitT || 0) - dt; if (s2.hitT <= 0 && FX.inShape(s2, FX.me.x, FX.me.y, FX.me.r)) { s2.hitT = 0.9; FX.hurt(s2.dmg); } }, fn: () => { M.recoil = 0.5; FX.H.sfx.hum(); FX.H.shake(5, 0.3); } }); M.beams.push(s); };
    mk(a0, 0); if (P >= 2) mk(a0 + 0.5 * dir, 1);
    say(FX, 'beam', 'LISTENING BEAM', P >= 2 ? 'Two beams track you slowly: keep moving round it' : 'It holds a beam on you that tracks slowly: keep moving round it', CYAN_HI); }
  function startChorus(FX, m) { const M = FX.mem, P = FX.S.lv, me = FX.me, n = P >= 2 ? 4 : 3; m.act = 'chorus'; m.actT = 0; FX.H.sfx.hum();
    for (let k = 0; k < n; k++) { const a = Math.random() * TAU, dd = k === 0 ? 0.8 : 1.8 + Math.random() * 3; callAt(FX, m, me.x + Math.cos(a) * dd, me.y + Math.sin(a) * dd, 1.4 + k * 0.15, P >= 2 && k === n - 1 ? 'manta' : 'grub'); }
    say(FX, 'chorus', 'GRUB CHORUS', 'Off the marked circles: the brood answers through them', OCHRE_HI); }
  function callAt(FX, m, x, y, wait, type) { const p = FX.clampArena({ x, y }, 1.5); FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.3, t: wait, dmg: m.dmg * 0.8, col: type === 'manta' ? CYAN : OCHRE_HI, fn: s => { G.sand(FX, s.x, s.y, 10, 1.3); FX.H.sfx.pop(); FX.H.ring(s.x, s.y, 0.2, 1.6, 0.4, CYAN, 0.3); if (FX.m && !FX.m.dead) { const g = FX.minion(type, s.x, s.y); if (g && type === 'grub') { g.mode = 'rise'; g.riseT = 0.2; } } } }); }
  function startSlam(FX, m) { const M = FX.mem, wait = 1.3 / FX.S.fast; M.sw = wait; m.act = 'slam'; m.actT = 0; FX.H.sfx.hum(); const gaps = [[Math.random() * TAU, 0.42], [Math.random() * TAU, 0.4]];
    FX.tele({ shape: 'ring', x: m.x, y: m.y, r0: 1.0, r1: 5.8, gaps, t: wait, dmg: m.dmg * 1.7, col: BONE_HI, tick: (dt, s) => { if (!s.done) { s.x = m.x; s.y = m.y; } }, fn: s => { M.slamT = 0; M.slamK = 1; FX.H.shake(12, 0.5); FX.H.sfx.crash(); FX.H.boom(s.x, s.y, 2.6, OCHRE_HI, '#FFFFFF', { n: 22, shake: 10, smoke: 6 }); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; G.sand(FX, s.x + Math.cos(a) * 3, s.y + Math.sin(a) * 2, 3, 1.2); } M.echoes.push({ t: 0 }); } });
    say(FX, 'slam', 'SHELL SLAM', 'Through a gap in the ring, or in close', BONE_HI); }
  /* ---- painting: the coil, its bands, the opening and the body in it, the eyes on their stalks ---- */
  function drawShell(c, FX, m, X, Y, T, t) {
    const K = FX.K, M = FX.mem, bt = M.bt || t, alt = M.alt == null ? 2.4 : M.alt, hs = m.hitSq || 0, roar = M.roar || 0, menace = M.menace || 0, recoil = M.recoil || 0, slump = M.slump || 0, tip = M.tip || 0, aim = M.aim || 0, roll = M.roll || 0, me = FX.me || { x: m.x, y: m.y + 5 }, lw = Math.max(1.4, T * 0.08), br = Math.sin(bt * 1.4), stunned = m.stunT > 0 || slump > 0.5;
    const ap = M.ap == null ? Math.PI / 2 : M.ap, rot = ap - APER, bob = Math.sin(bt * 1.7) * 0.1 * (1 - slump), S = T * (1 + br * 0.015 + roar * 0.06 + hs * 0.06), sqx = 1 + hs * 0.1 + slump * 0.05, sqy = (1 - hs * 0.14 - tip * 0.12) * (1 - slump * 0.12);
    const cx = X, cy = Y - (alt + bob) * T, slam = M.slamK > 0 ? snap(Math.min(1, (M.slamT || 0) / 0.6)) : 0; if (M.slamT > 0.6) M.slamK = 0;
    TN.groundShadow(c, X, Y + T * 0.2, T * 2.6, T * 1.1, alt, 0.45);
    // the coil's points on screen: turned to point the opening, rolled a little with its course, squashed by a blow
    const pt = (th, rr) => { const a = th + rot + roll * 0.3, r = rr * RS * S; return [cx + Math.cos(a) * r * sqx, cy + Math.sin(a) * r * sqy - tip * T * 0.3 * Math.cos(a)]; };
    const pts = SPIRAL.map(s => pt(s.th, s.rc)), wf = u => SPIRAL[Math.round(u * (SPIRAL.length - 1))].w * RS * S * Math.min(sqx, sqy);
    const A = pts[pts.length - 1], dx = Math.cos(ap), dy = Math.sin(ap), nx = -dy, ny = dx, aw = wf(1);
    // the body in the opening (behind the shell's lip): a soft wet mantle that breathes, lolling out when deafened
    const ext = T * (0.9 + slump * 2.4 + br * 0.05 + menace * 0.15 - recoil * 0.3), bw = aw * (0.92 + br * 0.03 - hs * 0.1), bx = A[0] + dx * aw * 0.1, by = A[1] + dy * aw * 0.1, tipx = bx + dx * ext, tipy = by + dy * ext, sag = slump * T * 0.6;
    const body = TN.blob([[bx - nx * bw * 0.5, by - ny * bw * 0.5], [bx + dx * ext * 0.45 - nx * bw * 0.6, by + dy * ext * 0.45 - ny * bw * 0.6 + sag * 0.3], [tipx - nx * bw * 0.35, tipy - ny * bw * 0.35 + sag], [tipx + dx * bw * 0.25, tipy + dy * bw * 0.25 + sag], [tipx + nx * bw * 0.35, tipy + ny * bw * 0.35 + sag], [bx + dx * ext * 0.45 + nx * bw * 0.6, by + dy * ext * 0.45 + ny * bw * 0.6 + sag * 0.3], [bx + nx * bw * 0.5, by + ny * bw * 0.5]]);
    TN.shape(c, body, { col: FLESH, shade: FLESH_SH, hi: FLESH_HI, line: INK, r: bw, lw, d1: 0.12, d2: 0.24, spec: 0.5, specAt: [bx + dx * ext * 0.5 - bw * 0.2, by + dy * ext * 0.5 - bw * 0.3], force: true, inner: g => { g.save(); g.strokeStyle = 'rgba(184,142,128,.5)'; g.lineWidth = Math.max(1, T * 0.05); for (let i = 1; i <= 3; i++) { const u = i / 4, px = bx + dx * ext * u, py = by + dy * ext * u + sag * u; g.beginPath(); g.ellipse(px, py, bw * 0.5 * (1 - u * 0.3), bw * 0.2, Math.atan2(dy, dx), 0, TAU); g.stroke(); } if (menace > 0.1 || slump > 0.1) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.max(menace * 0.3, slump * 0.4) * (0.8 + 0.2 * Math.sin(t * 6)); blitSized(g, glowSprite(CYAN), tipx - bw, tipy - bw, bw * 2, bw * 2); } g.restore(); } });
    // the eyes on their stalks: five, fanned from the body's front, swaying, tracking the pet; they gather forward
    // when it aims, splay in a roar, flinch in when struck and droop when it is deafened
    const dl = Math.hypot(me.x - m.x, me.y - m.y + alt) || 1, lx = (me.x - m.x) / dl, ly = (me.y - m.y + alt) / dl;
    for (let i = 0; i < 5; i++) { const f = (i - 2) / 2, spread = f * (0.9 - aim * 0.45 + roar * 0.4) * (1 - slump * 0.3), L = T * (0.95 + 0.25 * Math.abs(f) + menace * 0.3 + roar * 0.3 - hs * 0.35) * (1 - slump * 0.2), sway = Math.sin(bt * 2.1 + i * 1.3) * 0.12 + Math.sin(bt * 5.3 + i) * 0.03, droop = slump * (0.6 + 0.2 * Math.abs(f)), ang = Math.atan2(dy, dx) + spread + sway, rx = tipx - dx * ext * 0.25 + nx * f * bw * 0.4, ry = tipy - dy * ext * 0.25 + ny * f * bw * 0.4 + sag, ex = rx + Math.cos(ang) * L, ey = ry + Math.sin(ang) * L + droop * T * 0.5, mx = (rx + ex) / 2 + Math.cos(ang + Math.PI / 2) * sway * T * 0.6, my = (ry + ey) / 2 + Math.sin(ang + Math.PI / 2) * sway * T * 0.6 - T * 0.15 * (1 - slump);
      tubeLite(c, [[rx, ry], [mx, my], [ex, ey]], u => T * (0.3 - u * 0.12), { col: FLESH, shade: FLESH_SH, hi: FLESH_HI, line: INK, lw: lw * 0.7, force: true });
      const er = T * (0.3 + (i === 2 ? 0.07 : 0)); if (menace > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = menace * (0.5 + 0.25 * Math.sin(t * 13 + i)); blitSized(c, glowSprite(CYAN), ex - er * 2.4, ey - er * 2.4, er * 4.8, er * 4.8); c.restore(); } else { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; blitSized(c, glowSprite(CYAN), ex - er * 1.8, ey - er * 1.8, er * 3.6, er * 3.6); c.restore(); }
      const dizzy = stunned; TN.eye(c, ex, ey, er, { iris: CYAN, white: '#F2FFFF', pupil: '#0B1A20', line: INK, look: dizzy ? [Math.cos(bt * 6 + i) * 0.7, Math.sin(bt * 6 + i) * 0.5] : [lx * 0.7, ly * 0.6], blink: Math.max(M.blinks ? M.blinks[i] : 0, hs * 0.7, slump * 0.4), lid: FLESH_SH, pupilR: 0.5 - menace * 0.2 + (dizzy ? 0.15 : 0), squash: 0.9 }); }
    // the shell: the coil as one ribbon of bone, dark basalt bands radiating across its whorls, the seam between the
    // whorls grooved, a lit lip at the opening; it hums cyan along the seam before a call
    TN.tube(c, pts, wf, { col: BONE, shade: BONE_SH, hi: BONE_HI, line: INK, r: RS * S * 0.5, lw, d1: 0.1, d2: 0.22, lx: -0.5, ly: -0.7, spec: 0.5, specAt: [cx - RS * S * 0.35, cy - RS * S * 0.5], force: true, inner: g => { g.save(); g.lineCap = 'butt';
      // the bands: radial, from the coil's heart out through every whorl, alternating width
      g.strokeStyle = BASALT; for (let k = 0; k < 18; k++) { const a = k / 18 * TAU + rot * 0.5 + 0.1, w = T * (0.11 + 0.1 * (k % 3 === 0 ? 1 : 0)); g.lineWidth = w; g.beginPath(); g.moveTo(cx + Math.cos(a) * T * 0.1, cy + Math.sin(a) * T * 0.1); g.lineTo(cx + Math.cos(a) * RS * S * 1.3 * sqx, cy + Math.sin(a) * RS * S * 1.3 * sqy); g.stroke(); }
      g.strokeStyle = 'rgba(74,69,86,.55)'; g.lineWidth = Math.max(1, T * 0.05); for (let k = 0; k < 18; k++) { const a = k / 18 * TAU + rot * 0.5 + 0.1 + 0.1; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * RS * S * 1.3 * sqx, cy + Math.sin(a) * RS * S * 1.3 * sqy); g.stroke(); }
      // the seam between whorls: the ribbon's inner edge, grooved dark with a light edge beside it
      const { L, R } = TN.ribbonPts(pts, wf), inner = (L[5][0] - cx) ** 2 + (L[5][1] - cy) ** 2 < (R[5][0] - cx) ** 2 + (R[5][1] - cy) ** 2 ? L : R; g.lineCap = 'round'; g.strokeStyle = 'rgba(60,45,30,.7)'; g.lineWidth = Math.max(1.5, T * 0.1); g.beginPath(); inner.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); g.strokeStyle = 'rgba(255,250,235,.5)'; g.lineWidth = Math.max(1, T * 0.04); g.beginPath(); inner.forEach((q, i) => { const o = i ? [q[0] + (q[0] - cx) * 0.04, q[1] + (q[1] - cy) * 0.04] : q; i ? g.lineTo(o[0], o[1]) : g.moveTo(o[0], o[1]); }); g.stroke();
      if (menace > 0.05 || roar > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.max(menace, roar) * (0.35 + 0.25 * Math.sin(t * 8)); g.strokeStyle = CYAN; g.lineWidth = Math.max(2, T * 0.14); g.beginPath(); inner.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); }
      g.restore(); } });
    // the lip of the opening: a thicker rim of bone round the aperture, and the dark inside beyond the body
    c.save(); c.strokeStyle = BONE_HI; c.lineWidth = Math.max(2, T * 0.16); c.lineCap = 'round'; c.beginPath(); c.moveTo(A[0] - nx * aw * 0.5, A[1] - ny * aw * 0.5); c.quadraticCurveTo(A[0] + dx * aw * 0.12, A[1] + dy * aw * 0.12, A[0] + nx * aw * 0.5, A[1] + ny * aw * 0.5); c.stroke(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + menace * 0.35 + roar * 0.4; blitSized(c, glowSprite(CYAN), A[0] - aw * 0.9, A[1] - aw * 0.9, aw * 1.8, aw * 1.8); c.restore();
    // the heart of the coil glows faintly; a roar or the cry of its entrance flares it
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.2 + roar * 0.5 + menace * 0.1; blitSized(c, glowSprite(CYAN), cx - T * 0.8, cy - T * 0.8, T * 1.6, T * 1.6); if (roar > 0) { c.globalAlpha = roar * 0.35; blitSized(c, glowSprite(CYAN), cx - T * 4, cy - T * 3.5, T * 8, T * 7); } c.restore();
    if (stunned) for (let i = 0; i < 3; i++) { const a = bt * 3 + i * TAU / 3; TN.twinkle(c, cx + Math.cos(a) * T * 1.8, cy - T * 2.6 + Math.sin(a) * T * 0.4, T * 0.2, '#FFFFFF', 0.9); }
  }
})());
