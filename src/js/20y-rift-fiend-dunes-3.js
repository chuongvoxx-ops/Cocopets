/* ---------- THUL-AMMON THE SAND KRAKEN ----------
   The rift's last boss: a vast kraken under the Pit's sand, of which only the great head shows: a dome of wrinkled
   dark violet-grey hide crusted with bone barnacles, risen at the arena's centre, with a single huge amber eye with a
   horizontal pupil that follows the pet. Six tentacles (eight in the second phase) erupt from the sand at points round
   the Pit, tubes of the same hide lined with suckers and tipped with bone, and sweep, slam and grab. Tentacle Sweep
   marks lines across the Pit and lays the arms along them; Tentacle Slam marks rings and the tips come down in them;
   Ink of Sand spits a spreading dark zone to be left; Grasp marks a grab that drags the pet to the head unless it
   dodges; Sandfall marks rings and bone shards fall from the jaw above into them. Every tentacle out of the sand has
   an exposed Anchor at its root: break three in one phase and the head sinks, stunned for six seconds with the eye
   bared at the sand. In the second phase the tentacles are eight and quicker, grubs rise, and the Sandfall is denser.
   It is never still: the head breathes and rolls a little on the sand, the eye tracks the pet, narrows before a blow
   and blinks under a heavy lid, the tentacles sway and curl and feel at the air, suckers flexing; before a sweep an arm
   rears back, before a slam it curls high over its mark and comes down with overshoot, a grasp reaches with a spread
   tip; struck, the head is squashed; sunk, the eye bulges wide and rolls; it rises from the sand with a roar on entering. */
RiftFiend.define({ id: 'thulammon', name: 'Thul-Ammon', title: 'The Sand Kraken', color: '#4A3A5C', glow: '#E8A33A', accent: '#FFE9A8', biome: 'dunes', r: 3.0, els: ['earth', 'dark', 'water'] }, (() => {
  const { TAU, TN, ell, sorted, hit } = RiftFiend, G = DuneFiend, tube3 = RiftFiend.tubeLite;
  const { OCHRE, OCHRE_SH, OCHRE_HI, BASALT, BASALT_SH, BASALT_HI, BONE, BONE_SH, BONE_HI, CYAN, CYAN_HI, AMBER, AMBER_SH, INK, VIOLET, VIOLET_SH, VIOLET_HI, decay, toward, lerp, snap } = G;
  const NT = 8, TR = 8.4, SLEEP = [2, 6];   // eight sockets round the Pit; two sleep until the second phase
  const sockAt = (C, k) => { const a = k / NT * TAU + 0.2; return [C.x + Math.cos(a) * TR, C.y + Math.sin(a) * TR, a]; };
  const DOME = [3.9, 2.5, 1.8];   // half-axes: across (x), deep (y), high (z)
  return {
    arenaR: 15, firstAct: 'idle',
    artPoses: [{ name: 'risen, the arms waving', mem: { demo: 1, rise: 1 } }, { name: 'an arm reared to sweep', mem: { demo: 1, rise: 1, menace: 1, demoWind: 1 } }, { name: 'the arms curled to slam', mem: { demo: 1, rise: 1, menace: 1, demoReach: 1 } }, { name: 'sunk: the eye bared', mem: { demo: 1, rise: 1, sink: 1 } }],
    phaseNames: ['The Pit Beneath the Jaw', 'The Eighth Arm', 'The Swallowing', 'The Last Arm'],
    paintGround(c, A) { G.floor(c, A, { mid: '#CFA460', edge: '#B4874A', extra: (c2, A2) => { const R = A2.R;
      // the Pit: a sunken bowl at the centre, the sand sloping in, cracked basalt where the head has broken through; the
      // sockets round it where the arms come up, rings of displaced sand
      const g = c2.createRadialGradient(0, 0, 1, 0, 0, 6.5); g.addColorStop(0, 'rgba(90,60,30,.45)'); g.addColorStop(0.6, 'rgba(110,75,35,.2)'); g.addColorStop(1, 'rgba(110,75,35,0)'); c2.fillStyle = g; c2.beginPath(); c2.arc(0, 0, 6.5, 0, TAU); c2.fill();
      c2.strokeStyle = 'rgba(90,60,30,.35)'; c2.lineWidth = 0.07; c2.lineCap = 'round'; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.3; c2.beginPath(); c2.moveTo(Math.cos(a) * 3.2, Math.sin(a) * 2.6); c2.lineTo(Math.cos(a + 0.15) * 4.3, Math.sin(a + 0.15) * 3.5); c2.lineTo(Math.cos(a - 0.08) * 5.2, Math.sin(a - 0.08) * 4.3); c2.stroke(); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.8, x = Math.cos(a) * 4.6, y = Math.sin(a) * 3.8; c2.fillStyle = BASALT; c2.strokeStyle = BASALT_SH; c2.lineWidth = 0.06; c2.beginPath(); c2.moveTo(x - 0.5, y + 0.2); c2.lineTo(x - 0.1, y - 0.35); c2.lineTo(x + 0.45, y - 0.15); c2.lineTo(x + 0.3, y + 0.25); c2.closePath(); c2.fill(); c2.stroke(); }
      for (let k = 0; k < NT; k++) { const a = k / NT * TAU + 0.2, x = Math.cos(a) * TR, y = Math.sin(a) * TR; c2.strokeStyle = 'rgba(110,70,25,.35)'; c2.lineWidth = 0.3; c2.beginPath(); c2.ellipse(x, y + 0.2, 1.7, 0.9, 0, 0, TAU); c2.stroke(); c2.fillStyle = 'rgba(42,31,54,.35)'; c2.beginPath(); c2.ellipse(x, y + 0.2, 1.1, 0.55, 0, 0, TAU); c2.fill(); } } }); },
    sky(c, W, H, t, cam, T) { G.sky(c, W, H, t, cam, T, { top: '#1C0A18', mid: '#4A1630', bot: '#7A3A34' }); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.x = C.x; m.y = C.y; m.act = 'enter'; m.touchK = 0.75;
      Object.assign(M, { rise: 0, sink: 0, menace: 0, roar: 0, recoil: 0, blink: 0, blinkT: 2, bt: 0, broken: 0, grab: null, lobs: [], broodT: 12, wasEnter: true, roared: false, wasStun: false, seen: {}, look: [0, 0], dil: 1, shards: [],
        tents: Array.from({ length: NT }, (_, k) => { const s = sockAt(C, k); return { k, x: s[0], y: s[1], a: s[2], up: 0, state: 'down', downT: 0, ph: k * 1.3, wind: 0, lay: null, reach: null, grab: 0, anchor: null, asleep: SLEEP.includes(k), eruptT: 1.0 + k * 0.22, lean: Math.atan2(C.y - s[1], C.x - s[0]) }; }) }); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; M.roar = 1; M.menace = 1; M.broodT = 4; M.broken = 0; FX.H.shake(10, 0.5); FX.H.flash(0.2, AMBER); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - 3, AMBER, 20, 8);
      M.tents.forEach(Tk => { if (Tk.asleep) { Tk.asleep = false; Tk.state = 'down'; Tk.downT = 0.4; } });
      for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; const g = FX.minion('grub', m.x + Math.cos(a) * 5, m.y + Math.sin(a) * 5); if (g) { g.mode = 'rise'; g.riseT = 0.3; } }
      if (lv >= 2) FX.H.banner('THE EIGHTH ARM', 'Eight arms, quicker; grubs rise; the jaw sheds more teeth', AMBER, 2.6, true); if (lv >= 4) FX.H.banner('The Last Arm', 'The Pit swallows', '#FF6A5A', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, fast = (1 + (P - 1) * 0.1) * FX.S.fast, d = FX.dist(m.x, m.y); m.actT += dt; m.noTouch = false;
      if (P >= 2 && (M.broodT -= dt) <= 0 && m.act === 'idle') { M.broodT = P >= 4 ? 9 : 13; for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, p = FX.clampArena({ x: me.x + Math.cos(a) * 3, y: me.y + Math.sin(a) * 3 }, 1.5); FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.2, t: 1.0, dmg: m.dmg * 0.6, col: OCHRE_HI, fn: s => { G.sand(FX, s.x, s.y, 8, 1); FX.H.sfx.pop(); if (FX.m && !FX.m.dead) { const g = FX.minion('grub', s.x, s.y); if (g) { g.mode = 'rise'; g.riseT = 0.2; } } } }); } FX.H.text(me.x, me.y - 2, 'Grubs rise from the Pit', OCHRE_HI, 13); }
      let menace = 0;
      switch (m.act) {
        case 'idle': { if (m.actT > (P >= 3 ? 1.3 : 1.7) / FX.S.fast) { m.actT = 0; const ups = M.tents.filter(Tk => Tk.state === 'up' && Tk.up > 0.8); const r = Math.random(); if (ups.length && r < 0.24) startSweep(FX, m, ups); else if (ups.length && r < 0.46) startSlam(FX, m, ups); else if (r < 0.62) startInk(FX, m); else if (ups.length && r < 0.8) startGrasp(FX, m, ups); else startSandfall(FX, m); } break; }
        case 'sweep': { menace = m.actT < M.aw ? 0.8 : 0.3; if (m.actT > M.aw + 0.9) { m.act = 'idle'; m.actT = 0; } break; }
        case 'slam': { menace = m.actT < M.aw ? 0.8 : 0.3; if (m.actT > M.aw + 0.8) { m.act = 'idle'; m.actT = 0; } break; }
        case 'ink': { menace = m.actT < 0.8 ? 1 : 0.3; if (m.actT > 1.6) { m.act = 'idle'; m.actT = 0; } break; }
        case 'grasp': { const Gb = M.grab; menace = Gb ? 0.6 : (m.actT < M.aw ? 1 : 0.3);
          if (Gb) { Gb.t += dt; const dx = m.x - me.x, dy = m.y - me.y, dd = Math.hypot(dx, dy) || 1; FX.push(dx / dd * 7 * fast * dt, dy / dd * 7 * fast * dt); me.vx = dx / dd * 7; me.vy = dy / dd * 7; const Tk = Gb.T; Tk.reach = { x: me.x, y: me.y, z: 0.5, k: 1 };
            if (dd < 3.4 || Gb.t > 1.6) { M.grab = null; Tk.reach = null; Tk.wind = 0; FX.hurt(m.dmg * 1.4); me.push = { vx: -dx / dd * 11, vy: -dy / dd * 11, t: 0.25 }; FX.H.boom(me.x, me.y, 1.4, AMBER, '#FFFFFF', { n: 14, shake: 9 }); FX.H.sfx.crash(); M.recoil = 0.8; FX.H.text(m.x, m.y - 4.5, 'It bites!', AMBER, 14); m.act = 'idle'; m.actT = 0; } }
          else if (m.actT > M.aw + 0.8) { m.act = 'idle'; m.actT = 0; } break; }
        case 'sandfall': { menace = 0.5; if (m.actT > M.aw) { m.act = 'idle'; m.actT = 0; } break; }
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3); M.sink = decay(M.sink, dt, 1.5);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.sink = Math.min(1, M.sink + dt * 1.8); M.menace = decay(M.menace, dt, 4); m.noTouch = true; M.grab = null;
      const p = eyeAt(M, m); FX.weak('eye', p[0], p[1], 1.5, 2.4, m.stunT > 0.05);
      // sunk: the sand shivers round it
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.35; const a = Math.random() * TAU; G.sand(FX, m.x + Math.cos(a) * 3.6, m.y + Math.sin(a) * 2.4 + 0.5, 3, 0.8); FX.H.shake(1.5, 0.08); }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return; M.bt += dt; tentacles(FX, m, dt);
      if (!(m.stunT > 0)) { if (FX.S.weak.eye) FX.weak('eye', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.broken = 0; M.recoil = 0.8; M.roar = 0.6; M.tents.forEach((Tk, i) => { if (!Tk.asleep && Tk.state === 'down') Tk.downT = Math.min(Tk.downT, 0.3 + i * 0.25); }); FX.H.text(m.x, m.y - 4.5, 'It heaves back up', AMBER, 13); G.sand(FX, m.x, m.y + 2, 14, 1.6); } } else M.wasStun = true;
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.2);
      // the eye: it follows the pet, narrows before a blow, blinks under its lid
      const me = FX.me, dx = me.x - m.x, dy = me.y - m.y + 2, dl = Math.hypot(dx, dy) || 1; M.look[0] = toward(M.look[0], dx / dl * Math.min(1, dl / 3), dt, 5); M.look[1] = toward(M.look[1], dy / dl * Math.min(1, dl / 3), dt, 5);
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 3 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.16; M.blink = Math.sin(Math.min(1, M.blinkU) * Math.PI); if (M.blinkU >= 1) { M.blinkU = null; M.blink = 0; } }
      for (let i = M.lobs.length - 1; i >= 0; i--) { const L = M.lobs[i]; L.t += dt; if (L.t >= L.dur) M.lobs.splice(i, 1); }
      for (let i = M.shards.length - 1; i >= 0; i--) { const S2 = M.shards[i]; S2.t += dt; if (S2.t > 2.4) M.shards.splice(i, 1); }
      // the entrance: the head heaves up out of the Pit's sand with a roar, the eye opening; the arms erupt one by one
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.rise = clamp((e - 0.3) / 1.6, 0, 1); if (e > 0.4 && Math.random() < dt * 10) G.sand(FX, m.x + FX.rnd(-3, 3), m.y + 1.5 + FX.rnd(-0.5, 1), 3, 1.2); if (e > 1.4) { M.menace = toward(M.menace, 1, dt, 4); if (!M.roared) { M.roared = true; M.roar = 1; FX.H.sfx.crash(); FX.H.shake(10, 0.5); G.sand(FX, m.x, m.y + 2, 20, 2); } } }
      else { M.rise = toward(M.rise, 1, dt, 3); if (M.wasEnter) { M.wasEnter = false; M.recoil = 1; FX.H.sfx.thud(); } } },
    dmgK() { return 1; },
    keep: { steps: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t, step) { drawKraken(c, FX, m, X, Y + (m.z || 0) * T * 4, T, t, step); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'anchor') drawAnchor(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m) return;
      // the ink lobbed from the head: a dark blob arcing to its mark
      for (const L of M.lobs) { const u = Math.min(1, L.t / L.dur), x = lerp(L.x0, L.x1, u), y = lerp(L.y0, L.y1, u), h = 4 * u * (1 - u) * 4 + (1 - u) * L.z0, X = FX.sx(x), Y = FX.sy(y); c.save(); c.fillStyle = 'rgba(10,6,4,.3)'; c.beginPath(); c.ellipse(X, Y, T * 0.5, T * 0.22, 0, 0, TAU); c.fill(); TN.shape(c, TN.ell(X, Y - h * T, T * 0.55 * (1 + u * 0.3), T * 0.45, L.t * 2), { col: VIOLET_SH, shade: '#140C1C', hi: VIOLET, line: INK, r: T * 0.5, lw: Math.max(1.2, T * 0.06), spec: 0.6, force: true }); c.restore(); }
      // the shards stuck in the sand where the Sandfall landed, sinking away
      for (const S2 of M.shards) { const X = FX.sx(S2.x), Y = FX.sy(S2.y), k = Math.min(1, (2.4 - S2.t) / 0.6), h = T * 0.9 * k; c.save(); c.globalAlpha = Math.min(1, k * 1.5); c.translate(X, Y); c.rotate(S2.a); TN.shape(c, TN.blob([[-T * 0.16, 0], [-T * 0.2, -h * 0.5], [0, -h], [T * 0.2, -h * 0.5], [T * 0.16, 0]]), { col: BONE, shade: BONE_SH, hi: BONE_HI, line: INK, r: T * 0.4, lw: Math.max(1, T * 0.05), spec: false, force: true }); c.restore(); }
      // the bone shards of the Sandfall: high over their rings, falling faster toward the end, dust behind them
      for (const s of FX.S.tele) { if (s.done || !s.shard) continue; const u = clamp(s.age / s.t, 0, 1), X = FX.sx(s.x), Y = FX.sy(s.y), h = (1 - u * u) * T * 11, y = Y - h; if (y < -40) continue; c.save(); c.globalAlpha = 0.5; c.strokeStyle = OCHRE_HI; c.lineWidth = T * 0.25; c.lineCap = 'round'; c.beginPath(); c.moveTo(X + T * 0.1, y - T * 2.2 * (1 - u * 0.5)); c.lineTo(X, y - T * 0.4); c.stroke(); c.globalAlpha = 1; c.translate(X, y); c.rotate(0.3 + u * 0.4); TN.shape(c, TN.blob([[-T * 0.22, -T * 0.6], [T * 0.2, -T * 0.55], [T * 0.1, T * 0.5], [0, T * 0.75], [-T * 0.12, T * 0.5]]), { col: BONE, shade: BONE_SH, hi: BONE_HI, line: INK, r: T * 0.5, lw: Math.max(1.2, T * 0.06), spec: false, force: true }); c.restore(); } },
  };
  /* ---- the arms: each rises from its socket, waves, winds up, lays along a line, reaches to a mark or a grab; an
     anchor shows at its root while it is up, and breaking it drives the arm back under ---- */
  function tentacles(FX, m, dt) { const M = FX.mem, P = FX.S.lv, e = FX.S.enterT || 0;
    for (const Tk of M.tents) { Tk.ph += dt * (1.4 + (M.menace || 0) * 0.8 + Tk.wind * 2);
      if (m.act === 'enter') { if (!Tk.asleep && e > Tk.eruptT && Tk.state === 'down') erupt(FX, Tk); }
      else if (m.stunT > 0) { if (Tk.state === 'up') { Tk.state = 'down'; Tk.downT = 99; killAnchor(Tk); } }
      else if (Tk.state === 'down' && !Tk.asleep) { Tk.downT -= dt; if (Tk.downT <= 0) erupt(FX, Tk); }
      const want = Tk.state === 'up' ? 1 : 0; const was = Tk.up; Tk.up = toward(Tk.up, want, dt, want ? 2.2 : 4);
      if (was < 0.5 && Tk.up >= 0.5 && Tk.state === 'up') G.sand(FX, Tk.x, Tk.y, 6, 1.1);
      if (Tk.state === 'up' && Tk.up > 0.85 && !Tk.anchor) spawnAnchor(FX, Tk);
      if (Tk.lay) { Tk.lay.t += dt; if (Tk.lay.t > 1.1) Tk.lay = null; }
      if (Tk.reach) { const R = Tk.reach; if (!R.done) R.k = toward(R.k, 1, dt, 4); else { R.t = (R.t || 0) + dt; if (R.t > 0.9) R.k = decay(R.k, dt, 1.6); if (R.k <= 0) Tk.reach = null; } }
      Tk.wind = decay(Tk.wind, dt, 2.5); } }
  function erupt(FX, Tk) { Tk.state = 'up'; Tk.downT = 0; Tk.wind = 0; Tk.lay = null; Tk.reach = null; G.sand(FX, Tk.x, Tk.y, 10, 1.5); FX.H.shake(4, 0.2); FX.H.sfx.thud(); }
  function killAnchor(Tk) { if (Tk.anchor) { Tk.anchor.dead = true; Tk.anchor = null; } }
  function spawnAnchor(FX, Tk) { const C = FX.C, ax = Tk.x + Math.cos(Tk.lean) * 1.1, ay = Tk.y + Math.sin(Tk.lean) * 1.1; Tk.anchor = FX.obj({ kind: 'anchor', x: ax, y: ay, r: 0.8, hp: FX.S.barHP * 0.03, idx: Tk.k, tent: Tk, onKill: o => { const m = FX.m, M = FX.mem; if (!m || m.dead) return; o.tent.anchor = null; o.tent.state = 'down'; o.tent.downT = 11; o.tent.reach = null; o.tent.lay = null; if (M.grab && M.grab.T === o.tent) { M.grab = null; m.act = 'idle'; m.actT = 0; }
    FX.H.boom(o.x, o.y, 1.3, AMBER, '#FFFFFF', { n: 16, shake: 7 }); FX.H.sfx.crack(); G.sand(FX, o.tent.x, o.tent.y, 10, 1.4); M.broken = (M.broken || 0) + 1; M.recoil = Math.max(M.recoil, 0.6);
    if (M.broken >= 3) sink(FX, m); else FX.H.text(o.x, o.y - 1.8, `An anchor breaks · ${M.broken} of 3`, AMBER, 13); } }); }
  function sink(FX, m) { const M = FX.mem; m.stunT = 6; m.act = 'idle'; m.actT = 0; M.sink = 0; M.grab = null; FX.S.tele.length = 0; M.lobs.length = 0; M.roar = 0.7; FX.H.banner('THE HEAD SINKS', 'Its arms gone, it sinks to the eye: strike it!', AMBER, 2.2, true); FX.H.shake(12, 0.5); FX.H.sfx.crash(); G.sand(FX, m.x, m.y + 2, 20, 2); FX.H.flash(0.2, AMBER); }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 1.9 : 1.1, true); }
  function nearest(ups, x, y, n) { return ups.slice().sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y)).slice(0, n); }
  /* ---- the acts ---- */
  function startSweep(FX, m, ups) { const M = FX.mem, me = FX.me, P = FX.S.lv, wait = 1.3 / FX.S.fast, arms = nearest(ups, me.x, me.y, P >= 2 ? 3 : 2); m.act = 'sweep'; m.actT = 0; M.aw = wait + arms.length * 0.2; FX.H.sfx.hum();
    arms.forEach((Tk, k) => { const a = Math.atan2(me.y - Tk.y, me.x - Tk.x) + (k === 2 ? 0.4 : 0); Tk.wind = 1; Tk.windA = a; FX.tele({ shape: 'line', x: Tk.x, y: Tk.y, a, len: 13, w: 2.4, t: wait + k * 0.2, dmg: m.dmg * 1.4, col: VIOLET_HI, fn: s => { Tk.lay = { a: s.a, t: 0 }; Tk.wind = 0; M.recoil = Math.max(M.recoil, 0.4); FX.H.part({ kind: 'slash', x: s.x + Math.cos(s.a) * 5, y: s.y + Math.sin(s.a) * 5, a: s.a, r: 4, life: 0.3, max: 0.3, color: VIOLET_HI }); for (let i = 1; i < 6; i++) G.sand(FX, s.x + Math.cos(s.a) * i * 2.2, s.y + Math.sin(s.a) * i * 2.2, 3, 1.1); FX.H.shake(7, 0.3); FX.H.sfx.whoosh(); } }); });
    say(FX, 'sweep', 'TENTACLE SWEEP', 'Off the lines', VIOLET_HI); }
  function startSlam(FX, m, ups) { const M = FX.mem, me = FX.me, P = FX.S.lv, wait = 1.2 / FX.S.fast, n = Math.min(ups.length, P >= 2 ? 4 : 3); m.act = 'slam'; m.actT = 0; M.aw = wait + n * 0.15; FX.H.sfx.hum(); const used = new Set();
    for (let k = 0; k < n; k++) { const a = Math.random() * TAU, dd = k === 0 ? 0 : 1.6 + Math.random() * 3, p = FX.clampArena({ x: me.x + Math.cos(a) * dd, y: me.y + Math.sin(a) * dd }, 1.2), Tk = nearest(ups.filter(q => !used.has(q)), p.x, p.y, 1)[0] || ups[k % ups.length]; used.add(Tk); Tk.reach = { x: p.x, y: p.y, z: 3.6, k: 0, done: false, t: 0 }; Tk.wind = 1;
      FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 2.0, t: wait + k * 0.15, dmg: m.dmg * 1.5, col: AMBER, fn: s => { if (Tk.reach) { Tk.reach.z = 0; Tk.reach.done = true; Tk.reach.k = 1; Tk.reach.t = 0; } Tk.wind = 0; FX.H.boom(s.x, s.y, 1.8, OCHRE_HI, '#FFFFFF', { n: 16, shake: 9, smoke: 5 }); G.sand(FX, s.x, s.y, 12, 1.6); FX.H.sfx.crash(); } }); }
    say(FX, 'slam', 'TENTACLE SLAM', 'Off the rings', AMBER); }
  function startInk(FX, m) { const M = FX.mem, me = FX.me, P = FX.S.lv, p = FX.clampArena({ x: me.x + (me.vx || 0) * 0.3, y: me.y + (me.vy || 0) * 0.3 }, 2), dur = 1.2 / FX.S.fast; m.act = 'ink'; m.actT = 0; FX.H.sfx.hum(); M.lobs.push({ x0: m.x, y0: m.y + 1.8, z0: 3.2, x1: p.x, y1: p.y, t: 0, dur });
    FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.6, t: dur, dmg: m.dmg * 0.8, col: VIOLET_HI, fn: s => { FX.H.boom(s.x, s.y, 1.4, VIOLET, '#B8A0D0', { n: 14, shake: 5, smoke: 8 }); FX.H.sfx.splash && FX.H.sfx.splash(); FX.hz({ kind: 'ink', x: s.x, y: s.y, r: 1.2, life: P >= 2 ? 8 : 6.5, dps: m.dmg * 0.45, tick: 0.35, arm: 0.2, slow: true, col: VIOLET, update: (dt, z) => { z.r = Math.min(5.2, z.r + dt * 2.2); }, draw: (c, z, FX2, T, t) => { const X = FX.sx(z.x), Y = FX.sy(z.y), fade = Math.min(1, z.age / 0.3, (z.life - z.age) / 0.8), rr = z.r * T; c.save(); c.globalAlpha = fade; c.translate(X, Y); c.scale(1, 0.72); const gr = c.createRadialGradient(0, 0, rr * 0.1, 0, 0, rr); gr.addColorStop(0, 'rgba(20,12,28,.92)'); gr.addColorStop(0.7, 'rgba(42,31,54,.8)'); gr.addColorStop(1, 'rgba(74,58,92,0)'); c.fillStyle = gr; c.beginPath(); for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, r = rr * (1 + 0.07 * Math.sin(a * 5 + t * 1.5) + 0.04 * Math.sin(a * 9 - t * 2)); i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.fillStyle = 'rgba(122,103,142,.35)'; for (let i = 0; i < 7; i++) { const a = i * 0.9 + t * 0.3, d2 = rr * (0.3 + 0.1 * Math.sin(t + i)); c.beginPath(); c.arc(Math.cos(a) * d2 * 1.6, Math.sin(a) * d2 * 0.9, rr * 0.08, 0, TAU); c.fill(); } c.restore(); } }); } });
    say(FX, 'ink', 'INK OF SAND', 'Leave the dark: it spreads and slows', VIOLET_HI); }
  function startGrasp(FX, m, ups) { const M = FX.mem, me = FX.me, wait = 1.25 / FX.S.fast, p = FX.clampArena({ x: me.x + (me.vx || 0) * 0.25, y: me.y + (me.vy || 0) * 0.25 }, 1.2), Tk = nearest(ups, p.x, p.y, 1)[0]; m.act = 'grasp'; m.actT = 0; M.aw = wait; M.grab = null; FX.H.sfx.hum(); Tk.wind = 1; Tk.reach = { x: p.x, y: p.y, z: 3.2, k: 0, done: false, t: 0, spread: 1 };
    FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.7, t: wait, dmg: 0, col: AMBER, fn: s => { Tk.wind = 0; G.sand(FX, s.x, s.y, 8, 1.2); FX.H.sfx.whoosh(); if (FX.inShape(s, FX.me.x, FX.me.y, FX.me.r) && FX.hurt(m.dmg * 0.6)) { M.grab = { t: 0, T: Tk }; Tk.reach = { x: FX.me.x, y: FX.me.y, z: 0.5, k: 1 }; FX.H.banner('GRASPED', 'It drags you to the head', AMBER, 1.2, true); FX.H.shake(6, 0.3); } else { if (Tk.reach) { Tk.reach.z = 0; Tk.reach.done = true; Tk.reach.k = 1; } FX.H.text(s.x, s.y - 1.5, 'It grasps sand', OCHRE_HI, 12); } } });
    say(FX, 'grasp', 'GRASP', 'Dodge the hand, or be dragged to the head', AMBER); }
  function startSandfall(FX, m) { const M = FX.mem, me = FX.me, P = FX.S.lv, n = P >= 2 ? 9 : 5, wait = 1.2 / FX.S.fast, gap = P >= 2 ? 0.16 : 0.24; m.act = 'sandfall'; m.actT = 0; M.aw = wait + n * gap + 0.4; FX.H.sfx.hum();
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, dd = i === 0 ? 0 : 1.3 + Math.random() * 4.5, p = FX.clampArena({ x: me.x + Math.cos(a) * dd, y: me.y + Math.sin(a) * dd }, 1); FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.3, t: wait + i * gap, dmg: m.dmg * 1.3, col: BONE_HI, shard: true, fn: s => { FX.H.boom(s.x, s.y, 1.2, BONE_HI, '#FFFFFF', { n: 12, shake: 5 }); G.sand(FX, s.x, s.y, 8, 1.3); FX.H.sfx.crack(); M.shards.push({ x: s.x, y: s.y, t: 0, a: Math.random() * 0.8 - 0.4 }); if (M.shards.length > 14) M.shards.shift(); } }); }
    say(FX, 'sandfall', 'SANDFALL', 'Off the rings: the jaw above sheds its teeth', BONE_HI); }
  /* ---- the head's place and parts ---- */
  function domeZ(M) { return 1.1 * (M.rise == null ? 1 : M.rise) - (M.sink || 0) * 1.0 + Math.sin((M.bt || 0) * 1.3) * 0.05; }
  function eyeAt(M, m) { const z = domeZ(M); return [m.x, m.y - z + 0.25 - (M.sink || 0) * 0.55]; }
  function bodyParts(m, M) { const z = domeZ(M); return [hit('head', [m.x, m.y, z + 1.2], 3.0, m)]; }
  /* the points of an arm in the world: from its socket, rising and curling in toward the head, waving; wound up it rears
     back and high; laid, it lies flat along its line; reaching, its tip goes to the mark */
  function armPts(Tk, M, t) { const up = Tk.up, lean = Tk.lean, cl = Math.cos(lean), sl = Math.sin(lean), nl = -sl, nn = cl, ph = Tk.ph, w = Math.sin(ph) * 0.45 + Math.sin(ph * 1.7 + 1) * 0.15, wind = Tk.wind, curl = 1 + Math.sin(ph * 0.5) * 0.15;
    const at = (u, v, z) => [Tk.x + cl * u + nl * v, Tk.y + sl * u + nn * v, z * up];
    let P = [at(0, 0, 0), at(0.2 - wind * 0.5, w * 0.2, 1.5 + wind * 0.3), at(0.9 - wind * 1.3, w * 0.6, 3.0 + wind * 0.9), at(2.0 * curl - wind * 1.6, w * 1.0, 3.9 + wind * 1.3), at(3.2 * curl - wind * 1.4, w * 1.3 + Math.sin(ph * 2.3) * 0.2, 3.3 + wind * 1.6 + Math.sin(ph * 1.3) * 0.2)];
    if (Tk.lay) { const k = Math.min(1, Tk.lay.t / 0.25) * (Tk.lay.t > 0.8 ? 1 - (Tk.lay.t - 0.8) / 0.3 : 1), sn = snap(Math.min(1, Tk.lay.t / 0.6)), ca = Math.cos(Tk.lay.a), sa = Math.sin(Tk.lay.a); P = P.map((p, i) => { const s = i / 4, L = 6.5 * s; return [lerp(p[0], Tk.x + ca * L, k), lerp(p[1], Tk.y + sa * L, k), lerp(p[2], (0.3 + (1 - sn) * 0.6 * s) * up, k)]; }); }
    if (Tk.reach) { const R = Tk.reach, k = Math.max(0, Math.min(1, R.k)), sn = R.done ? snap(Math.min(1, (R.t || 0) / 0.7)) : 0, tz = R.z + (R.done ? (1 - sn) * 0.4 : Math.sin(t * 3) * 0.2), mx = (Tk.x + R.x) / 2, my = (Tk.y + R.y) / 2, mz = Math.max(tz, 2.6) + 1.6 + wind * 0.8 - sn * 0.6; P[3] = [lerp(P[3][0], mx, k), lerp(P[3][1], my, k), lerp(P[3][2], mz * up, k)]; P[4] = [lerp(P[4][0], R.x, k), lerp(P[4][1], R.y, k), lerp(P[4][2], tz * up, k)]; P[2] = [lerp(P[2][0], (Tk.x + mx) / 2, k * 0.6), lerp(P[2][1], (Tk.y + my) / 2, k * 0.6), lerp(P[2][2], (mz * 0.75) * up, k * 0.6)]; }
    return P; }
  /* ---- the anchor at an arm's root: a knot of violet flesh with three ivory discs driven into the sand ---- */
  function drawAnchor(c, FX, o, X, Y, T, t) { const cracked = 1 - o.hp / o.maxhp, lw = Math.max(1.2, T * 0.07), pulse = 0.5 + 0.5 * Math.sin(t * 4 + o.idx); c.save();
    c.fillStyle = 'rgba(60,40,20,.3)'; c.beginPath(); c.ellipse(X, Y + T * 0.15, T * 1.0, T * 0.4, 0, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.2 * pulse; blitSized(c, glowSprite(AMBER), X - T * 1.4, Y - T * 1.6, T * 2.8, T * 2.8); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    TN.shape(c, TN.blob([[X - T * 1.0, Y + T * 0.1], [X - T * 0.7, Y - T * 0.6], [X, Y - T * 0.85 - pulse * T * 0.05], [X + T * 0.75, Y - T * 0.55], [X + T * 1.0, Y + T * 0.15], [X, Y + T * 0.45]]), { col: VIOLET, shade: VIOLET_SH, hi: VIOLET_HI, line: INK, r: T * 0.9, lw, d1: 0.12, d2: 0.24, spec: 0.4, specAt: [X - T * 0.35, Y - T * 0.5], force: true, inner: g => { g.save(); g.strokeStyle = 'rgba(42,31,54,.6)'; g.lineWidth = Math.max(1, T * 0.05); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(X - T * 0.8 + i * T * 0.2, Y + T * 0.3); g.quadraticCurveTo(X + i * T * 0.2, Y - T * 0.3, X + T * 0.6 + i * T * 0.1, Y - T * 0.4 + i * T * 0.2); g.stroke(); } g.restore(); } });
    [[-0.45, -0.25, 0.26], [0.25, -0.45, 0.22], [0.5, 0.15, 0.24]].forEach(([dx, dy, r]) => G.barnacle(c, X + dx * T, Y + dy * T, T * r, dx * 0.4));
    if (cracked > 0.3) { c.strokeStyle = INK; c.lineWidth = Math.max(1.2, T * 0.08); c.beginPath(); c.moveTo(X - T * 0.5, Y - T * 0.5); c.lineTo(X - T * 0.1, Y - T * 0.1); c.lineTo(X - T * 0.3, Y + T * 0.3); c.stroke(); }
    c.font = `800 ${Math.round(T * 0.24)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText('ANCHOR', X, Y - T * 1.15); c.fillText('ANCHOR', X, Y - T * 1.15);
    c.restore(); }
  /* ---- painting: the arms far to near about the head, the head a dome of hide with its one eye ---- */
  function drawKraken(c, FX, m, X, Y, T, t, step) {
    const go = i => step == null || step === i, K = FX.K, M = FX.mem, P3 = TN.cam(X, Y, T, m), bt = M.bt || t, hs = m.hitSq || 0, roar = M.roar || 0, menace = M.menace || 0, recoil = M.recoil || 0, sink = M.sink || 0, rise = M.rise == null ? 1 : M.rise, lw = Math.max(1.4, T * 0.08), br = Math.sin(bt * 1.3), me = FX.me || { x: m.x, y: m.y + 6 }, C = FX.C || { x: m.x, y: m.y };
    if (M.demo && !M.tents) { M.tents = Array.from({ length: NT }, (_, k) => { const s = sockAt(C, k); return { k, x: s[0], y: s[1], a: s[2], up: SLEEP.includes(k) ? 0 : 1, state: 'up', ph: k * 1.3, wind: M.demoWind && k % 3 === 0 ? 1 : 0, lay: null, reach: M.demoReach && k % 2 === 0 ? { x: C.x + Math.cos(s[2]) * 3, y: C.y + Math.sin(s[2]) * 3, z: 3.2, k: 1, done: false } : null, lean: Math.atan2(C.y - s[1], C.x - s[0]) }; }); M.look = [0, 0.3]; M.bt = 0; }
    const z0 = domeZ(M), head = [m.x, m.y, z0], hq = P3(head[0], head[1], head[2]), hd = Math.PI / 2;
    const parts = [];
    // the arms: tubes of hide from their sockets, suckers down the inner side, a bone tip; a mound of sand at each root
    for (const Tk of M.tents) { if (Tk.up <= 0.02) continue; const P = armPts(Tk, M, t), sp = P.map(p => P3(p[0], p[1], p[2])), wf = u => T * (0.95 - u * 0.62) * (1 + hs * 0.05) * Math.min(1, 0.4 + Tk.up), base = P3(Tk.x, Tk.y, 0), mid = P[2];
      parts.push({ at: [mid[0], mid[1] + 0.5, mid[2]], draw: () => {
        // its shadow, then the mound it breaks through, then the arm
        c.save(); c.fillStyle = 'rgba(60,40,20,.3)'; const s3 = P3(P[3][0], P[3][1], 0), s4 = P3(P[4][0], P[4][1], 0); c.beginPath(); c.ellipse(s3[0], s3[1], T * 0.8, T * 0.35, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(s4[0], s4[1], T * 0.6, T * 0.25, 0, 0, TAU); c.fill(); c.restore();
        G.mound(c, base[0], base[1] + T * 0.1, T * 1.7, T * 0.75, Math.min(1, Tk.up * 1.2));
        tube3(c, P3, P, wf, { col: VIOLET, shade: VIOLET_SH, hi: VIOLET_HI, line: INK, r: T * 0.7, lw, d1: 0.12, d2: 0.26, force: true });
        if (K.qq() >= 1) TN.suckers(c, sp, wf, { n: 6, cup: '#9C86B4', ring: VIOLET_SH, u0: 0.15, u1: 0.9 });
        // barnacles on the hide, and the bone tip: a cone, split a little when it reaches to grasp
        G.barnacle(c, sp[1][0] - T * 0.2, sp[1][1], T * 0.16, -0.3); G.barnacle(c, sp[2][0] + T * 0.15, sp[2][1] - T * 0.1, T * 0.13, 0.4);
        const tp = sp[4], tq = sp[3], ta = Math.atan2(tp[1] - tq[1], tp[0] - tq[0]), spread = Tk.reach && Tk.reach.spread && !Tk.reach.done ? 0.5 : 0; for (const sd of (spread ? [-1, 1] : [0])) { const a2 = ta + sd * spread; TN.tubeLite(c, [[tp[0] - Math.cos(ta) * T * 0.2, tp[1] - Math.sin(ta) * T * 0.2], [tp[0] + Math.cos(a2) * T * 0.4, tp[1] + Math.sin(a2) * T * 0.4], [tp[0] + Math.cos(a2) * T * 0.85, tp[1] + Math.sin(a2) * T * 0.85]], u => T * (0.3 - u * 0.24), { col: BONE, shade: BONE_SH, hi: BONE_HI, line: INK, lw: lw * 0.8, force: true }); }
        if (Tk.wind > 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Tk.wind * (0.3 + 0.2 * Math.sin(t * 12)); blitSized(c, glowSprite(AMBER), tp[0] - T, tp[1] - T, T * 2, T * 2); c.restore(); } } }); }
    // the head: a dome of wrinkled hide half out of the sand, breathing, squashed by a blow, sunk to the eye when
    // stunned; the sand heaped round it; barnacles on the crown; the eye on its front
    const sw = 1 + br * 0.015 + roar * 0.06 + hs * 0.06, sq = 1 - hs * 0.12 - sink * 0.05;
    parts.push({ at: [m.x, m.y + DOME[1] * 0.2, z0 + 1], head: true, draw: () => {
      // (only what is above the sand shows: the dome is cut where it meets the ground, the front of that cut a curve)
      const gc = P3(m.x, m.y, 0), fk = Math.sqrt(clamp(1 - (z0 / (DOME[2] * sq)) ** 2, 0, 1)), frx = DOME[0] * sw * fk * T, fry = DOME[1] * sw * fk * T, WW = T * 30;
      c.save(); c.beginPath(); c.moveTo(gc[0] - WW, gc[1] - WW); c.lineTo(gc[0] + WW, gc[1] - WW); c.lineTo(gc[0] + WW, gc[1]); c.lineTo(gc[0] + frx, gc[1]); if (frx > 0.5) c.ellipse(gc[0], gc[1], frx, fry, 0, 0, Math.PI, false); c.lineTo(gc[0] - WW, gc[1]); c.closePath(); c.clip();
      ell(c, P3, 0, head, [DOME[0] * sw, DOME[1] * sw, DOME[2] * sq], { T, col: VIOLET, shade: VIOLET_SH, hi: VIOLET_HI, line: INK, r: T * DOME[0], lw, d1: 0.1, d2: 0.22, spec: 0.3, specAt: [hq[0] - T * 1.2, hq[1] - T * 2.2], force: true, inner: g => { g.save(); g.strokeStyle = 'rgba(42,31,54,.6)'; g.lineWidth = Math.max(1.2, T * 0.08); g.lineCap = 'round';
        // wrinkles: long folds over the crown, creases down the sides
        for (let i = 0; i < 5; i++) { const yy = hq[1] - T * (2.1 - i * 0.55), w = T * (1.6 + i * 0.45); g.beginPath(); g.moveTo(hq[0] - w, yy + T * 0.3); g.quadraticCurveTo(hq[0] - w * 0.3, yy - T * 0.25 + Math.sin(i) * T * 0.1, hq[0] + w * 0.4, yy + T * 0.05); g.stroke(); }
        for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(hq[0] + sd * T * (2.0 + i * 0.4), hq[1] - T * (1.2 - i * 0.3)); g.quadraticCurveTo(hq[0] + sd * T * (2.4 + i * 0.4), hq[1] + T * 0.2, hq[0] + sd * T * (2.1 + i * 0.5), hq[1] + T * 1.2); g.stroke(); }
        if (roar > 0 || menace > 0.5) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.max(roar, (menace - 0.5) * 0.6) * 0.3; blitSized(g, glowSprite(AMBER), hq[0] - T * 2.5, hq[1] - T * 1.5, T * 5, T * 4); } g.restore(); } });
      // barnacles over the crown
      [[-1.6, -1.9, 0.26], [0.9, -2.3, 0.22], [1.9, -1.2, 0.3], [-2.4, -0.6, 0.2], [0.2, -2.8, 0.18], [2.6, 0.1, 0.22], [-0.8, -2.6, 0.16]].forEach(([dx, dy, r]) => G.barnacle(c, hq[0] + dx * T * sw, hq[1] + dy * T * sq, T * r, dx * 0.15));
      // the eye: amber, a horizontal pupil, under a heavy lid; it narrows before a blow, bulges wide and rolls when sunk
      const ex = hq[0], ey = hq[1] + T * (0.25 - sink * 0.55), bulge = 1 + sink * 0.15, er = T * 1.45 * bulge * sw, ery = T * 1.0 * bulge * sq, dizzy = m.stunT > 0 || sink > 0.5, lk = M.look || [0, 0], px = dizzy ? Math.cos(bt * 5) * 0.5 : lk[0] * 0.45, py = dizzy ? Math.sin(bt * 5) * 0.35 : lk[1] * 0.35, dil = clamp(1 - menace * 0.55 - roar * 0.7 + sink * 0.5, 0.2, 1.4), lidK = clamp(0.3 + menace * 0.1 - roar * 0.3 - sink * 0.35 + Math.max(M.blink || 0, hs * 0.6) * 1.2, 0, 1);
      c.save(); if (menace > 0.05 || sink > 0.1) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(menace * 0.5, sink * 0.6) * (0.7 + 0.3 * Math.sin(t * 9)); blitSized(c, glowSprite(AMBER), ex - er * 1.8, ey - er * 1.8, er * 3.6, er * 3.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      c.beginPath(); c.ellipse(ex, ey, er, ery, 0, 0, TAU); c.fillStyle = '#F6E6C8'; c.fill(); c.save(); c.clip();
      const ir = er * 0.62, ix = ex + px * er * 0.45, iy = ey + py * ery * 0.45, gr = c.createRadialGradient(ix, iy, ir * 0.2, ix, iy, ir); gr.addColorStop(0, '#FFD27A'); gr.addColorStop(0.6, AMBER); gr.addColorStop(1, AMBER_SH); c.fillStyle = gr; c.beginPath(); c.ellipse(ix, iy, ir, ir * 0.92, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(120,70,20,.45)'; c.lineWidth = Math.max(0.8, T * 0.03); c.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; c.moveTo(ix + Math.cos(a) * ir * 0.4, iy + Math.sin(a) * ir * 0.38); c.lineTo(ix + Math.cos(a + 0.05) * ir, iy + Math.sin(a + 0.05) * ir * 0.92); } c.stroke(); c.strokeStyle = AMBER_SH; c.lineWidth = Math.max(1.2, T * 0.06); c.beginPath(); c.ellipse(ix, iy, ir * 0.97, ir * 0.9, 0, 0, TAU); c.stroke();
      // the pupil: a horizontal bar with rounded ends
      const pw = ir * 0.82, ph2 = Math.max(T * 0.04, ir * 0.3 * dil); c.fillStyle = '#120806'; c.beginPath(); c.ellipse(ix, iy, pw, ph2, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(ix - ir * 0.45, iy - ir * 0.45, ir * 0.22, ir * 0.14, -0.4, 0, TAU); c.fill(); c.beginPath(); c.arc(ix + ir * 0.4, iy + ir * 0.35, ir * 0.08, 0, TAU); c.fill();
      // veins at the rim, red-violet, and the lid, heavy hide closing from above
      c.strokeStyle = 'rgba(140,50,60,.4)'; c.lineWidth = Math.max(0.8, T * 0.03); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.4; c.beginPath(); c.moveTo(ex + Math.cos(a) * er, ey + Math.sin(a) * ery); c.quadraticCurveTo(ex + Math.cos(a + 0.2) * er * 0.8, ey + Math.sin(a + 0.2) * ery * 0.8, ex + Math.cos(a) * er * 0.68, ey + Math.sin(a) * ery * 0.68); c.stroke(); }
      if (lidK > 0.02) { const yT = ey - ery + lidK * ery * 1.9, sagK = ery * 0.3 * (1 - lidK); c.fillStyle = VIOLET; c.beginPath(); c.moveTo(ex - er * 1.3, ey - ery * 1.5); c.lineTo(ex + er * 1.3, ey - ery * 1.5); c.lineTo(ex + er * 1.3, yT - sagK); c.quadraticCurveTo(ex, yT + sagK * 1.3, ex - er * 1.3, yT - sagK); c.closePath(); c.fill(); c.strokeStyle = VIOLET_SH; c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); c.moveTo(ex - er * 1.3, yT - sagK); c.quadraticCurveTo(ex, yT + sagK * 1.3, ex + er * 1.3, yT - sagK); c.stroke(); }
      c.restore(); c.lineWidth = lw * 1.1; c.strokeStyle = INK; c.beginPath(); c.ellipse(ex, ey, er, ery, 0, 0, TAU); c.stroke();
      // a brow ridge of hide over the eye
      c.strokeStyle = VIOLET_SH; c.lineWidth = Math.max(2, T * 0.16); c.lineCap = 'round'; c.beginPath(); c.moveTo(ex - er * 1.15, ey - ery * (1.0 + menace * 0.1)); c.quadraticCurveTo(ex, ey - ery * (1.55 - menace * 0.3), ex + er * 1.15, ey - ery * (1.0 + menace * 0.1)); c.stroke(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); c.restore();
      c.restore();
      // the sand heaped round the head, hiding where it goes into the Pit
      const sy = P3(m.x, m.y + DOME[1] * 0.45, 0); G.mound(c, sy[0], sy[1] + T * 0.4, T * DOME[0] * 1.2, T * 0.95, 0.7, { line: 'rgba(60,45,30,.45)' }); for (const sd of [-1, 1]) G.mound(c, sy[0] + sd * T * 3.3, sy[1] - T * 0.5, T * 1.4, T * 0.6, 0.7, { line: 'rgba(60,45,30,.45)' });
      if (roar > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = roar * 0.35; blitSized(c, glowSprite(AMBER), hq[0] - T * 5, hq[1] - T * 4.5, T * 10, T * 9); c.restore(); }
      if (dizzy) for (let i = 0; i < 3; i++) { const a = bt * 3 + i * TAU / 3; TN.twinkle(c, hq[0] + Math.cos(a) * T * 2.2, hq[1] - T * 3.2 + Math.sin(a) * T * 0.4, T * 0.22, '#FFFFFF', 0.9); } } });
    const list = sorted(parts), hi = list.findIndex(p => p.head);
    if (go(0)) { TN.groundShadow(c, hq[0], P3(m.x, m.y + DOME[1] * 0.3, 0)[1], T * DOME[0] * 1.1, T * 1.4, 0, 0.4); list.slice(0, hi + 1).forEach(p => p.draw()); }
    if (go(1)) list.slice(hi + 1).forEach(p => p.draw());
  }
})());
