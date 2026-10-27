/* ---------- ULVORA THE SUNKEN CHOIR ----------
   A colossal bell-jellyfish that hangs over the bell platform: a translucent slate-green dome lit from within, three
   drowned bells hanging inside it, a crown of frilled oral arms beneath, and twelve long tendrils trailing to the
   floor. The sea rises when it rings: Drowning Bell lights one of three refuge valves; strike it to raise its island
   and shelter there with your pet while the platform floods. Undertow pulls everything to it, then bursts. The Choir
   sweeps its tendrils across one half of the platform at a time. Hymn throws rings of sparks. After every Drowning
   Bell the dome lifts and its heart-bell is bared for six seconds. Phase two: reef lanterns rise to heal it, and the
   tendrils sweep the refuge islands too, all but the raised one. The third boss: when it falls, the rift is sealed.
   It swims as a jellyfish swims: the bell contracts and relaxes, each pulse lifting it and shedding bubbles, a wave
   runs down the tendrils and they trail behind it as it drifts; it watches the pet and blinks, and the mouth under
   the dome gapes with every hymn. Before Undertow the dome swells and draws the tendrils in, then bursts them out;
   before the Choir the tendrils of that side rise, then whip down; the bells inside swing when it tolls; struck, it
   flinches; with the dome lifted it hangs limp and dizzy. */
RiftFiend.define({ id: 'ulvora', name: 'Ulvora', title: 'The Sunken Choir', color: '#4C6B5A', glow: '#61D9D2', accent: '#DFFFF8', biome: 'belfry', r: 2.6, els: ['water', 'dark'] }, (() => {
  const { TAU, TN, frame, tubeLite, ell, wetFloor, seaSky } = RiftFiend;
  const SLATE = '#4C6B5A', SLATE_SH = '#2A4236', SLATE_HI = '#8FB8A0', LINE = '#122820', CYAN = '#61D9D2', BRONZE = '#9A7A3A', BRONZE_HI = '#E0C478', PINK = '#E8A8C0', PINK_SH = '#B07890';
  const VA = [Math.PI / 2 + 0.4, Math.PI / 2 + 0.4 + TAU / 3, Math.PI / 2 + 0.4 - TAU / 3];
  const valveAt = (C, i) => [C.x + Math.cos(VA[i]) * (C.R - 3.2), C.y + Math.sin(VA[i]) * (C.R - 3.2)];
  const onIsland = (FX, i) => { const p = valveAt(FX.C, i); return Math.hypot(FX.me.x - p[0], FX.me.y - p[1]) < 2.4; };
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k);
  // the swimming pulse: a quick contraction, a slow relaxing (0..1 of contraction over the clock)
  const PULSE = 0.45, pulse = bt => { const ph = ((bt * PULSE) % 1 + 1) % 1; return ph < 0.18 ? Math.sin(ph / 0.18 * Math.PI / 2) : ph < 0.55 ? 0.5 + 0.5 * Math.cos((ph - 0.18) / 0.37 * Math.PI) : 0; };
  const snap = u => u < 0.25 ? 1.2 * Math.sin(u / 0.25 * Math.PI / 2) : 1.2 * Math.cos((u - 0.25) / 0.75 * Math.PI / 2);
  return {
    arenaR: 16, firstAct: 'circle',
    artPoses: [{ name: 'hanging over the platform', mem: { hd: 1.57 } }, { name: 'the dome lifted, heart bared', mem: { hd: 1.57, open: 1 } }, { name: 'tolling', mem: { hd: 1.57, toll: 1 } }, { name: 'drawing the undertow', mem: { hd: 1.57, swell: 1, menace: 1 } }],
    phaseNames: ['The Platform', 'The Lantern Choir', 'The Rising Sea', 'The Last Hymn'],
    paintGround(c, A) { wetFloor(c, A, { mid: '#1A3A3A', edge: '#0E2A2A', extra: (c2, A2) => { const R = A2.R;
      VA.forEach(a => { const x = Math.cos(a) * (R - 3.2), y = Math.sin(a) * (R - 3.2); c2.fillStyle = '#8E9A93'; c2.beginPath(); c2.ellipse(x, y, 2.4, 1.7, 0, 0, TAU); c2.fill(); c2.strokeStyle = 'rgba(0,0,0,.5)'; c2.lineWidth = 0.1; c2.stroke(); c2.fillStyle = '#C8CCBC'; c2.beginPath(); c2.ellipse(x, y - 0.1, 2.0, 1.3, 0, 0, TAU); c2.fill(); });
      c2.strokeStyle = '#957943'; c2.lineWidth = 0.2; c2.beginPath(); c2.arc(0, 0, 3.2, 0, TAU); c2.stroke(); c2.strokeStyle = 'rgba(0,0,0,.5)'; c2.lineWidth = 0.08; c2.beginPath(); c2.arc(0, 0, 3.4, 0, TAU); c2.stroke(); } }); },
    sky(c, W, H, t, cam, T) { seaSky(c, W, H, t, cam, T, { top: '#041010', mid: '#0A2A2A', bot: '#041010', moon: '#9FE8D8' }); },
    init(FX) { const M = FX.mem; M.hd = Math.PI / 2; M.open = 0; M.toll = 0; M.flood = 0; M.lit = -1; M.raised = -1; M.sigT = 14; M.healT = 16; M.valves = VA.map(() => ({ obj: null })); FX.m.act = 'enter'; FX.m.touchK = 0.5;
      Object.assign(M, { bt: 0, px: FX.m.x, py: FX.m.y, vx: 0, vy: 0, blink: 0, blinkT: 2.5, menace: 0, swell: 0, burst: 0, burstT: 0, choir: 0, choirSide: 0, sweep: 0, sweepT: 0, hymnK: 0, roar: 0, surge: 0, lunge: 0, kick: 0, lastK: 0, gape: 0, gapeT: 2, bubT: 0, wasEnter: true, roared: false });
      VA.forEach((a, i) => spawnValve(FX, i)); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; M.sigT = 4; M.healT = 4; M.roar = 1; M.menace = 1; M.kick = 1; FX.H.shake(10, 0.5); FX.H.flash(0.2, CYAN); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - 3, CYAN, 18, 7); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; bubble(FX, m.x + Math.cos(a) * 2.8, m.y + Math.sin(a) * 1.6 - 2, 1); }
      if (lv >= 2) FX.H.banner('The Lantern Choir', 'Reef lanterns rise to heal it: kill them. The tendrils sweep the islands too', CYAN, 2.4); if (lv >= 4) FX.H.banner('The Last Hymn', 'The sea never settles', '#FF6A5A', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, C = FX.C, me = FX.me, P = FX.S.lv, fast = (1 + (P - 1) * 0.1) * FX.S.fast, aPet = FX.angPet(m.x, m.y);
      M.sigT -= dt; M.healT -= dt;
      if (P >= 2 && M.healT <= 0) { M.healT = 15; for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; FX.minion('reeflantern', m.x + Math.cos(a) * 4, m.y + Math.sin(a) * 4); } FX.H.banner('THE LANTERN CHOIR', 'Reef lanterns rise: they will heal it', '#FFF4C0', 1.8, true); }
      for (const q of FX.H.mons) if (!q.dead && q.type === 'reeflantern' && q.fminion) { q.healT = (q.healT || 0) + dt; if (q.healT > 6) { q.healT = 0; m.hp = Math.min(m.maxhp, m.hp + FX.S.barHP * 0.12); FX.H.text(m.x, m.y - 3, 'It is healed', '#FFF4C0', 13); FX.H.sparks(m.x, m.y - 2, '#8FE0A6', 12, 5); M.kick = Math.max(M.kick, 0.6); } }
      // the flood
      if (M.flood > 0) { M.flood -= dt; M.floodTick = (M.floodTick || 0) - dt; if (M.floodTick <= 0) { M.floodTick = 0.45; if (!(M.raised >= 0 && onIsland(FX, M.raised))) FX.hurt(m.dmg * 0.55, { dot: true }); } if (M.flood <= 0) { M.flood = 0; M.raised = -1; M.open = 1; M.openT = 6; FX.H.banner('THE WATER FALLS', 'The dome lifts: strike the heart-bell!', CYAN, 2, true); FX.H.sfx.splash && FX.H.sfx.splash(); } }
      if (M.openT > 0) { M.openT -= dt; FX.weak('heart', m.x, m.y + 0.2, 1.4, 2.4, true); if (M.openT <= 0) { M.open = 0; FX.weak('heart', 0, 0, 0, 0, false); M.kick = 1; } }
      m.actT += dt; let menace = 0, swell = 0, choir = 0;
      switch (m.act) {
        case 'circle': { M.dA = (M.dA == null ? 0 : M.dA) + dt * 0.25; FX.moveTo(m, C.x + Math.cos(M.dA) * 4, C.y + Math.sin(M.dA) * 3, 2.4 * fast, dt, { noFace: true });
          if (m.actT > (P >= 3 ? 1.6 : 2.2)) { m.actT = 0; if (M.sigT <= 0 && M.flood <= 0) { startBell(FX, m); break; } const r = Math.random(); if (r < 0.35) startUndertow(FX, m); else if (r < 0.7) startChoir(FX, m); else startHymn(FX, m); }
          break; }
        case 'undertow': { const drawn = m.actT < 1.8; menace = drawn ? 1 : 0.3; swell = drawn ? Math.min(1, m.actT / 1.4) : 0; if (m.actT > 0.2 && m.actT < 1.8) { const a = Math.atan2(m.y - me.y, m.x - me.x); FX.push(Math.cos(a) * 1.6 * dt, Math.sin(a) * 1.6 * dt); } if (m.actT > 2.4) { m.act = 'circle'; m.actT = 0; } break; }
        case 'choir': { menace = m.actT < 1.9 ? 0.8 : 0.2; choir = m.actT < 1.9 ? Math.min(1, m.actT / 1.2) : 0; if (m.actT > 2.2) { m.act = 'circle'; m.actT = 0; } break; }
        case 'hymn': { M.hymT = (M.hymT || 0) - dt; menace = 0.6; if (M.hymT <= 0 && m.actT < 1.6) { M.hymT = 0.5; M.hymnK = 1; FX.burst(m.x, m.y, P >= 3 ? 12 : 9, 5.5 * fast, { dmg: m.dmg * 0.5, color: CYAN, core: '#FFFFFF', r: 0.24 }, m.actT * 2); FX.H.sfx.hum(); } if (m.actT > 2) { m.act = 'circle'; m.actT = 0; } break; }
        case 'bell': { M.toll = Math.min(1, M.toll + dt * 3); menace = 0.8; if (m.actT > 1.2) { M.toll = 0; m.act = 'circle'; m.actT = 0; } break; }
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3); M.swell = toward(M.swell, swell, dt, swell > M.swell ? 3 : 9); M.choir = toward(M.choir, choir, dt, choir > M.choir ? 3 : 9);
      M.hd = FX.K.lerpA(M.hd, aPet, Math.min(1, dt * 1.5));
      FX.parts(bodyParts(M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.menace = decay(M.menace, dt, 4); FX.parts(bodyParts(FX.mem)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return; M.bt = (M.bt || 0) + dt;
      // how it drifts: the tendrils trail behind
      if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt; M.px = m.x; M.py = m.y; M.vx = toward(M.vx, vx, dt, 5); M.vy = toward(M.vy, vy, dt, 5); }
      // each pulse of the bell sheds bubbles from the rim
      const k = pulse(M.bt); if (k > 0.95 && M.lastK <= 0.95) { for (let i = 0; i < 5; i++) { const a = Math.random() * TAU; bubble(FX, m.x + Math.cos(a) * 2.4, m.y + Math.sin(a) * 1.4 - hover(M) + 0.3, 0.7); } } M.lastK = k;
      M.burst = M.burst > 0 ? (M.burstT += dt) > 0.8 ? 0 : 1 : 0; M.sweep = M.sweep > 0 ? (M.sweepT += dt) > 0.8 ? 0 : 1 : 0;
      M.hymnK = decay(M.hymnK, dt, 3); M.roar = decay(M.roar, dt, 0.8); M.surge = decay(M.surge, dt, 1.2); M.kick = decay(M.kick, dt, 1.4);
      // the eyes blink; the mouth works now and then
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 3 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.12; M.blink = Math.sin(Math.min(1, M.blinkU) * Math.PI); if (M.blinkU >= 1) { M.blinkU = null; M.blink = 0; } }
      M.gapeT -= dt; if (M.gapeT <= 0) { M.gapeT = 2.5 + Math.random() * 3; M.gapeU = 0; } if (M.gapeU != null) { M.gapeU += dt / 0.6; M.gape = Math.sin(Math.min(1, M.gapeU) * Math.PI) * 0.5; if (M.gapeU >= 1) { M.gapeU = null; M.gape = 0; } }
      // the sea about it: a bubble now and then
      M.bubT -= dt; if (M.bubT <= 0) { M.bubT = 0.35; const a = Math.random() * TAU; bubble(FX, m.x + Math.cos(a) * 3.2, m.y + Math.sin(a) * 2 - 1, 0.4); }
      // the entrance: it sinks out of the dark, leaning over the pet, then a great pulse of the bell as it settles
      if (m.act === 'enter') { const e = FX.S.enterT || 0; if (e > 1.4) { M.lunge = toward(M.lunge, 1, dt, 4); M.menace = toward(M.menace, 1, dt, 4); if (!M.roared) { M.roared = true; FX.H.sfx.crash(); FX.H.shake(6, 0.3); } } }
      else if (M.wasEnter) { M.wasEnter = false; M.kick = 1; M.surge = 1; FX.H.sfx.splash && FX.H.sfx.splash(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; bubble(FX, m.x + Math.cos(a) * 3.2, m.y + Math.sin(a) * 1.8, 0.9); } }
      if (m.act !== 'enter') M.lunge = decay(M.lunge, dt, 2); },
    dmgK(FX, m) { return 1; },
    keep: { steps: 2, pad: 2.5 },
    draw(c, FX, m, X, Y, T, t, step) { drawJelly(c, FX, m, X, Y, T, t, step); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'valve') drawValve(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { const M = FX.mem; if (M.flood > 0) { c.save(); c.globalAlpha = 0.35 * Math.min(1, M.flood); c.fillStyle = '#2F80B7'; c.fillRect(0, 0, FX.H.W(), FX.H.H()); c.restore(); }
      if (M.raised >= 0) { const p = valveAt(FX.C, M.raised), X = FX.sx(p[0]), Y = FX.sy(p[1]); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.2 * Math.sin(t * 5); blitSized(c, glowSprite('#8FE0A6'), X - T * 3, Y - T * 2, T * 6, T * 4); c.restore(); }
      if (M.lit >= 0) { const p = valveAt(FX.C, M.lit), X = FX.sx(p[0]), Y = FX.sy(p[1]); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.4 * Math.sin(t * 8); blitSized(c, glowSprite('#FFE37A'), X - T * 2, Y - T * 2.4, T * 4, T * 4); c.restore(); } },
  };
  function spawnValve(FX, i) { const p = valveAt(FX.C, i), h = FX.mem.valves[i]; h.obj = FX.obj({ kind: 'valve', x: p[0], y: p[1], r: 0.8, hp: 1e12, idx: i, onHit: o => { const M = FX.mem; if (M.lit !== i) return; if (FX.H.mons.some(q => !q.dead && q.type === 'leech' && Math.hypot(q.x - o.x, q.y - o.y) < 2.5)) { FX.H.text(o.x, o.y - 1.5, 'A leech holds it', '#B6A2F0', 12); return; } M.lit = -1; M.raised = i; FX.H.banner('THE REFUGE RISES', 'Shelter on the island with your pet', '#8FE0A6', 2, true); FX.H.sfx.fanfare(); FX.H.ring(o.x, o.y, 0.3, 3, 0.6, '#9FE8FF', 0.3); } }); }
  function startBell(FX, m) { const M = FX.mem, P = FX.S.lv; m.act = 'bell'; m.actT = 0; M.sigT = P >= 3 ? 12 : 16; M.lit = Math.floor(Math.random() * 3); M.raised = -1; FX.H.banner('DROWNING BELL', `Valve ${M.lit + 1} lights: strike it to raise its refuge, 5 seconds`, '#7FD3F2', 2.4, true); FX.H.sfx.hum();
    if (P >= 3) { const o = M.valves[M.lit].obj; if (o) FX.minion('leech', o.x + 0.8, o.y - 0.8); }
    FX.tele({ shape: 'fn', test: () => false, x: m.x, y: m.y, r: 0, t: 5, dmg: 0, fn: () => { if (m.dead) return; M.flood = 6; M.lit = -1; M.surge = 1; M.kick = 1; FX.H.banner('THE WATER RISES', M.raised >= 0 ? 'Keep to the refuge' : 'No refuge was raised!', '#2F80B7', 2, true); FX.H.shake(8, 0.5); FX.H.sfx.crash(); } }); }
  function startUndertow(FX, m) { const M = FX.mem; m.act = 'undertow'; m.actT = 0; FX.H.sfx.hum(); FX.tele({ shape: 'circle', x: m.x, y: m.y, r: 4.2, t: 1.8, dmg: m.dmg * 2, col: '#7FD3F2', fn: s => { M.burst = 1; M.burstT = 0; M.kick = 1; FX.H.boom(s.x, s.y, 3.5, '#7FD3F2', '#FFFFFF', { n: 30, shake: 12 }); FX.H.sfx.crash(); } }); FX.H.banner('UNDERTOW', 'Run outward: the pull is weak', '#7FD3F2', 1.4, true); }
  function startChoir(FX, m) { const M = FX.mem, C = FX.C, P = FX.S.lv, side = Math.random() < 0.5 ? 1 : -1; m.act = 'choir'; m.actT = 0; M.choirSide = side; FX.H.sfx.hum();
    FX.tele({ shape: 'fn', test: (x, y) => (x - C.x) * side > 0 && !(M.raised >= 0 && onIsland(FX, M.raised)) && !(P < 2 && VA.some((a, i) => onIsland(FX, i))), x: C.x, y: C.y, t: 1.9, dmg: m.dmg * 1.6, col: PINK, fn: () => { M.sweep = 1; M.sweepT = 0; FX.H.shake(10, 0.4); FX.H.sfx.crash(); FX.H.splash && FX.H.splash(C.x + side * C.R * 0.5, C.y, 6); for (let i = 0; i < 10; i++) bubble(FX, C.x + side * (2 + Math.random() * 10), C.y + (Math.random() - 0.5) * 14, 1); } });
    FX.tele({ shape: 'line', x: side > 0 ? C.x : C.x - C.R, y: C.y - C.R, a: 0, len: C.R, w: C.R * 2, t: 1.9, dmg: 0, col: PINK, label: 'THE CHOIR' });
    FX.H.banner('THE CHOIR', P >= 2 ? 'The tendrils sweep that half, islands too, all but the raised one' : 'The tendrils sweep that half: the islands are safe', PINK, 1.6, true); }
  function startHymn(FX, m) { m.act = 'hymn'; m.actT = 0; FX.mem.hymT = 0; }
  function bubble(FX, x, y, k) { for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, v = (0.8 + Math.random() * 1.5) * k; FX.H.part({ kind: 'bubble', x, y, vx: Math.cos(a) * v * 0.3, vy: -v - 0.8, life: 0.7 + Math.random() * 0.4, max: 1.1, size: 2 + Math.random() * 3 * k, color: '#BFF5E4' }); } }
  function bodyParts(M) { const z = hover(M); return [{ key: 'dome', dx: 0, dy: -z, r: 2.6 }, { key: 'arms', dx: 0, dy: -z + 1.6, r: 1.6 }]; }
  // where it hangs: a slow rise and fall, and every pulse of the bell lifts it a little (the lift follows the contraction)
  function hover(M) { const bt = M.bt || 0; return 2.6 + Math.sin(bt * 1.1) * 0.25 - (M.open || 0) * 0.4 + pulse(bt - 0.3) * 0.25 + (M.kick || 0) * 0.3 - (M.lunge || 0) * 0.5; }
  function drawValve(c, FX, o, X, Y, T, t) { const M = FX.mem, lit = M.lit === o.idx, r = T * 0.4; c.save(); c.translate(X, Y - T * 0.3); c.fillStyle = '#3A4466'; c.strokeStyle = LINE; c.lineWidth = 1.5; GFX.rr(c, -T * 0.5, -T * 0.1, T * 1.0, T * 0.36, 4); c.fill(); c.stroke(); c.rotate(M.raised === o.idx ? o.t * 2 : 0); c.strokeStyle = LINE; c.lineWidth = r * 0.3; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.strokeStyle = lit ? '#FFE37A' : BRONZE; c.lineWidth = r * 0.18; c.stroke(); for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(i * Math.PI / 2) * r, Math.sin(i * Math.PI / 2) * r); c.strokeStyle = LINE; c.lineWidth = r * 0.22; c.stroke(); c.strokeStyle = lit ? '#FFE37A' : BRONZE; c.lineWidth = r * 0.1; c.stroke(); } c.restore(); }
  function drawJelly(c, FX, m, X, Y, T, t, step) {
    const go = i => step == null || step === i, M = FX.mem, P3 = TN.cam(X, Y, T, m), bt = M.bt || t, z = hover(M), open = M.open || 0, toll = M.toll || 0, lw = Math.max(1.4, T * 0.07), me = FX.me || { x: m.x, y: m.y + 5 }, C = FX.C || { x: m.x, y: m.y };
    const k = Math.max(pulse(bt), M.kick || 0), hs = m.hitSq || 0, menace = M.menace || 0, swell = M.swell || 0, roar = M.roar || 0, surge = M.surge || 0, lunge = M.lunge || 0, choir = M.choir || 0, side = M.choirSide || 0, daze = Math.max(open, m.stunT > 0 ? 1 : 0), hymn = M.hymnK || 0;
    const bu = M.burst > 0 ? snap(Math.min(1, M.burstT / 0.8)) : 0, sw = M.sweep > 0 ? snap(Math.min(1, M.sweepT / 0.8)) : 0, gape = Math.max(M.gape || 0, hymn, swell * 0.5, roar, lunge * 0.8);
    // the frame: it faces the pet, leans over it on the way in, and wobbles when it is dazed; struck, it flinches up
    const hd = M.hd == null ? Math.PI / 2 : M.hd, W = frame(m, hd, { z, pitch: -lunge * 0.28 - hs * 0.06, roll: daze * Math.sin(bt * 2.5) * 0.08 + Math.sin(bt * 0.9) * 0.02 });
    const dome = r => ({ col: SLATE, shade: SLATE_SH, hi: SLATE_HI, line: LINE, r, lw, d1: 0.1, d2: 0.22, spec: 0.7, specR: 0.16, force: true, alpha: 0.92 - daze * 0.12 });
    const sx = (1 - k * 0.1 + swell * 0.1 + roar * 0.12 + hs * 0.08 - bu * 0.08) * (1 - daze * 0.03), sz = (1 + k * 0.16 + swell * 0.14 + roar * 0.12 - hs * 0.16 - bu * 0.12) * (1 - daze * 0.18);
    // (a bell's silhouette: widest at the lip, its bottom edge bulging toward the camera, a rounded crown)
    const dc = W(0, 0, 0.15 + open * 0.5 + k * 0.1), q = P3(dc[0], dc[1], dc[2]), rx = 2.75 * sx * T, top = q[1] - 3.6 * sz * T, rimY = q[1] + 0.35 * T, bul = rx * 0.4, D = { p: q, rx, ry: (rimY - top) / 2, top, rimY, bul };
    const bellPath = g => { g.moveTo(q[0] - rx, rimY); g.bezierCurveTo(q[0] - rx * 1.03, rimY - (rimY - top) * 0.6, q[0] - rx * 0.78, top, q[0], top); g.bezierCurveTo(q[0] + rx * 0.78, top, q[0] + rx * 1.03, rimY - (rimY - top) * 0.6, q[0] + rx, rimY); g.quadraticCurveTo(q[0], rimY + bul * 2, q[0] - rx, rimY); g.closePath(); };
    // (nothing hanging beneath it may ever show over or through the dome: the tendrils and oral arms are drawn first and
    // clipped to everything outside the bell's silhouette, so they only ever emerge from under its rim)
    const underRim = (g, fn) => { g.save(); g.beginPath(); g.rect(q[0] - T * 60, q[1] - T * 60, T * 120, T * 120); bellPath(g); g.clip('evenodd'); fn(); g.restore(); };
    // the tendrils: twelve, from the dome's rim down to the floor, a wave running down each and all of them trailing
    // behind the drift; drawn in by a contraction or the undertow's swell, flung out by its burst; the side the Choir
    // is about to sweep rises, then whips down
    const lagx = -(M.vx || 0) * 0.14, lagy = -(M.vy || 0) * 0.14, amp = (1 + hs * 1.5) * (1 - daze * 0.5) * (1 + roar * 0.5), inK = 1 - k * 0.14 - swell * 0.35 + bu * 0.55 + roar * 0.3 + surge * 0.25;
    const tend = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + bt * 0.15, ca = Math.cos(a), sa = Math.sin(a), top = W(ca * 2.2 * (1 - k * 0.1), sa * 2.2 * (1 - k * 0.1), -0.2), onSide = side && (top[0] - C.x) * side > 0, rise = onSide ? choir : 0, whip = onSide ? sw : 0, pts = [top];
      for (let j = 1; j <= 4; j++) { const u = j / 4, r = (2.2 + u * 1.6) * inK * (1 + rise * 0.5 + whip * 0.9), wv = Math.sin(bt * 3 - j * 1.1 + i * 0.9) * 0.3 * u * amp, wv2 = Math.cos(bt * 2.2 - j * 0.9 + i * 1.7) * 0.3 * u * amp, zz = -0.2 - (z - 0.1 + 0.2) * u * (1 - swell * 0.25 * u) + rise * 2.2 * u * u - whip * 0.3 * u + Math.sin(bt * 2.6 - j + i) * 0.08 * amp, zc = Math.min(zz, -0.3);
        const p = W(ca * r + wv - sa * wv2 * 0.5, sa * r + wv2 + ca * wv * 0.5, 0); pts.push([p[0] + lagx * u * u * 1.5 + (onSide ? whip * side * 1.2 * u : 0), p[1] + lagy * u * u * 1.5, Math.max(0.05, zc + z)]); }
      tend.push({ a, pts, far: Math.sin(a) < 0, onSide }); }
    const tendDraw = td => tubeLite(c, P3, td.pts, u => T * (0.26 - u * 0.18), { col: td.onSide && (choir > 0.2 || sw > 0) ? '#F2BCD2' : PINK, shade: PINK_SH, hi: '#FFFFFF', line: LINE, lw: lw * 0.8, d2: 0.3, spec: false, force: true, alpha: 0.9 });
    if (go(0)) { TN.groundShadow(c, X, Y + T * 0.2, T * 3.4 * (1 - k * 0.08), T * 1.9 * (1 - k * 0.08), z, 0.4); underRim(c, () => { tend.filter(td => td.far).forEach(tendDraw);
      // the oral arms under the dome: a frilled crown of pink, curling up with each contraction, spread wide when the
      // mouth gapes and when the heart is bared
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, r = (1.3 + open * 0.6 + gape * 0.4) * (1 - k * 0.15), p0 = W(Math.cos(a) * 0.6, Math.sin(a) * 0.6, -0.1), p1 = W(Math.cos(a) * r, Math.sin(a) * r, -0.9 - open * 0.3 + k * 0.25 + Math.sin(bt * 2 + i) * 0.1); tubeLite(c, P3, [p0, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2 - 0.2], p1], u => T * (0.34 - u * 0.2), { col: PINK, shade: PINK_SH, hi: '#FFFFFF', line: LINE, lw: lw * 0.8, spec: false, force: true }); } });
      // the mouth among them: a dark opening that gapes with every hymn
      const mo = W(0, 0.9, -0.9), mq = P3(mo[0], mo[1], mo[2]); c.save(); c.fillStyle = '#0B1A18'; c.beginPath(); c.ellipse(mq[0], mq[1], T * (0.3 + gape * 0.25), T * (0.08 + gape * 0.3), 0, 0, TAU); c.fill(); c.strokeStyle = PINK_SH; c.lineWidth = lw; c.stroke(); if (gape > 0.3) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = (gape - 0.3) * 0.9; blitSized(c, glowSprite(CYAN), mq[0] - T * 0.8, mq[1] - T * 0.6, T * 1.6, T * 1.2); } c.restore();
      // the heart-bell, bared when the dome lifts
      const hb = W(0, 0, -0.3 + open * 0.2), hp = P3(hb[0], hb[1], hb[2]); if (open > 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * open * (0.8 + 0.2 * Math.sin(t * 6)); blitSized(c, glowSprite(BRONZE_HI), hp[0] - T * 1.6, hp[1] - T * 1.6, T * 3.2, T * 3.2); c.restore(); }
      TN.shape(c, TN.blob([[hp[0] - T * 0.5, hp[1] - T * 0.7], [hp[0] + T * 0.5, hp[1] - T * 0.7], [hp[0] + T * 0.75, hp[1] + T * 0.35], [hp[0], hp[1] + T * 0.55], [hp[0] - T * 0.75, hp[1] + T * 0.35]]), { col: BRONZE, shade: '#5C4620', hi: BRONZE_HI, line: LINE, r: T * 0.7, lw, spec: 0.6, specAt: [hp[0] - T * 0.2, hp[1] - T * 0.3], force: true }); }
    if (!go(1)) return;
    // the near tendrils too go in before the dome, hidden under its lip
    underRim(c, () => tend.filter(td => !td.far).forEach(tendDraw));
    // the dome: a translucent bell of slate green, three drowned bells seen through it, a lit interior, its rim frilled;
    // it contracts (taller, narrower) and relaxes (wide, flat) with every pulse, swells before the undertow and before
    // a roar, is squashed by a blow, and sags when the heart is bared
    TN.shape(c, bellPath, Object.assign(dome(rx), { specAt: [q[0] - rx * 0.38, top + (rimY - top) * 0.22], inner: g => { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.3 + 0.15 * Math.sin(bt * 2) + toll * 0.4 + hymn * 0.35 + menace * 0.15 + swell * 0.2 + roar * 0.3; blitSized(g, glowSprite(CYAN), q[0] - T * 2.2, q[1] - T * 3.2, T * 4.4, T * 4); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.55;
      // (the drowned bells swing when it tolls, and sway with the pulse)
      const swing = toll * Math.sin(bt * 14) * 0.35 + Math.sin(bt * 1.5) * 0.05 + surge * Math.sin(bt * 9) * 0.2;
      [[-1.1, 0.5], [0, 0.2], [1.1, 0.5]].forEach(([dx, dy], i) => { const bx = q[0] + dx * T + Math.sin(swing + i) * T * 0.3 * (toll + surge), by = q[1] + (dy - 1.0) * T + Math.sin(bt * 1.5 + i) * T * 0.05; g.save(); g.translate(bx, by - T * 1.3); g.rotate(swing * (1 + i * 0.3)); g.strokeStyle = LINE; g.lineWidth = Math.max(1, T * 0.05); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, T * 0.6); g.stroke(); g.translate(0, T * 1.3); g.fillStyle = toll > 0 ? '#C9A24E' : BRONZE; g.beginPath(); g.moveTo(-T * 0.35, 0); g.quadraticCurveTo(-T * 0.35, -T * 0.7, 0, -T * 0.75); g.quadraticCurveTo(T * 0.35, -T * 0.7, T * 0.35, 0); g.closePath(); g.fill(); g.strokeStyle = LINE; g.lineWidth = Math.max(1, T * 0.04); g.stroke(); g.fillStyle = LINE; g.beginPath(); g.arc(Math.sin(swing * 2) * T * 0.15, T * 0.02, T * 0.07, 0, TAU); g.fill(); g.restore(); });
      g.globalAlpha = 0.35; g.strokeStyle = '#FFFFFF'; g.lineWidth = Math.max(1, T * 0.05); for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(q[0], q[1] - T * (0.3 + i * 0.55) * sz, T * (2.4 - i * 0.32) * sx, T * (0.5 - i * 0.06), 0, 0.2, Math.PI - 0.2); g.stroke(); }
      // motes of light drifting up inside
      g.globalCompositeOperation = 'lighter'; g.fillStyle = CYAN; for (let i = 0; i < 6; i++) { const ph = (bt * 0.25 + i * 0.17) % 1; g.globalAlpha = 0.5 * Math.sin(ph * Math.PI); g.beginPath(); g.arc(q[0] + Math.sin(i * 2.1 + bt * 0.6) * T * 1.6, q[1] - ph * T * 3.2, T * 0.06, 0, TAU); g.fill(); } g.restore(); } }));
    // the frilled rim, rippling faster as it contracts
    c.save(); c.strokeStyle = SLATE_HI; c.lineWidth = Math.max(1.5, T * 0.12); c.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, x = D.p[0] - D.rx + u * 2 * D.rx, y = D.rimY + 4 * u * (1 - u) * D.bul + Math.sin(i * 1.5 + bt * 3) * T * (0.08 + k * 0.08 + hymn * 0.1); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore();
    // the eyes on the dome, watching the pet (rolling when dazed), blinking, blazing before a blow
    const dx = me.x - m.x, dy = me.y - m.y, dl = Math.hypot(dx, dy) || 1;
    [-1, 1].forEach(sd => { const ex = D.p[0] + sd * D.rx * 0.36, ey = D.rimY - (D.rimY - D.top) * 0.36; if (menace > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = menace * (0.5 + 0.25 * Math.sin(t * 14)); const r = T * (0.6 + menace * 0.5); blitSized(c, glowSprite(CYAN), ex - r, ey - r, r * 2, r * 2); c.restore(); }
      const look = daze > 0.4 ? [Math.cos(bt * 6 + sd) * 0.8, Math.sin(bt * 6 + sd) * 0.6] : [dx / dl * 0.7, Math.max(-0.4, dy / dl) * 0.6];
      TN.eye(c, ex, ey, T * 0.34, { iris: CYAN, white: menace > 0.5 ? '#EFFFFC' : '#DFFFF8', line: LINE, look, blink: Math.max(M.blink || 0, daze * 0.4, hs * 0.5), lid: SLATE, brow: -0.2 + menace * 0.9, pupilR: 0.5 - menace * 0.25 + daze * 0.15, squash: 0.7 }); });
    if (toll > 0 || hymn > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * Math.max(toll, hymn * 0.8) * (0.8 + 0.2 * Math.sin(t * 30)); blitSized(c, glowSprite(toll > 0 ? '#FFE37A' : CYAN), D.p[0] - T * 4, D.p[1] - T * 3, T * 8, T * 6); c.restore(); }
    // the undertow's burst: rings rolling off the dome
    if (bu > 0 || roar > 0 || surge > 0) { const kk = Math.max(bu, roar, surge), ph = M.burst > 0 ? M.burstT : 1 - kk; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#7FD3F2'; c.lineWidth = Math.max(1, T * 0.1); for (let i = 0; i < 3; i++) { const u = ((ph * 1.5 + i / 3) % 1); c.globalAlpha = kk * (1 - u) * 0.6; c.beginPath(); c.ellipse(D.p[0], D.rimY, D.rx * (1 + u * 1.1), D.bul * 1.2 * (1 + u * 1.1), 0, 0, TAU); c.stroke(); } c.restore(); }
    // dazed: stars circling the dome's crown
    if (daze > 0.4) for (let i = 0; i < 3; i++) { const a = bt * 3 + i * TAU / 3; TN.twinkle(c, D.p[0] + Math.cos(a) * T * 1.5, D.top - T * 0.5 + Math.sin(a) * T * 0.35, T * 0.2, '#FFFFFF', 0.9); }
  }
})());
