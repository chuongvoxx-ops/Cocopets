/* ---------- VAUL THE MOURNING REFLECTION ----------
   The Sepulchre's second boss, fought in the Raised Gallery of the Hall in Two Ages: a sunlit ring of ivory marble
   thirty metres across, walled with square recesses, the Memory Loom standing at its southern edge. Vaul is a giant
   head and nothing else: a hollow diamond of polished silver banded in gold, a slab as tall as a house hung in the air,
   and inside its hollow a violet eye that floats and follows the pet. Eight great faceted spikes of silver and violet
   steel wheel round it on a tilted orbit, each turning on its own length; from beneath it hang three tentacles of
   light, violet and gold, that curl and swirl. A translucent violet echo of the head drifts a moment behind it (an
   image, not a second enemy).
   Recorded Blasts: it records where the pet stands three times over six seconds (a ghost of the pet and a numbered
   mark each time), then the marks burst in the order they were taken: lead them out along the edge, then come in. In
   the second phase the tentacles sweep an arc during the replay, resolving between the first burst and the second.
   Mirror Pursuit: it raises a slow mirror of the pet that walks the pet's own recorded route; while it walks, Vaul is
   shielded by it (blows land at a sixth). Lead the mirror over one of the three silver snare plates and it is caught
   for a few seconds; stand at the Memory Loom then (a short weave) and the loom's gold threads hold it there: the
   shield breaks and Vaul is exposed: the head crashes to the marble, the diamond sprung open and the eye bared, the
   spikes fallen round it. The mirror hurts if it reaches the pet.
   Mirror Rush: the head itself runs a shown line, its spikes streaming behind it, and its echo runs it again. Spike
   Volley: the spikes turn their points on the pet, each along a shown line, and fly out and back. Light Lash: the three
   tentacles rear and lash out along three shown lanes (two waves in the second phase). In the second phase mourning
   discs and a second-eater gather.
   It is never still: the head bobs and tilts, the eye follows the pet and blinks, the spikes wheel and spin, flaring
   wide before a blow and drawing in tight round the shield, the tentacles swirl; struck, it jolts and the spikes kick
   out; it falls out of the sky on entering with its spikes gathering in from far out. */
RiftFiend.define({ id: 'vaul', name: 'Vaul', title: 'The Mourning Reflection', color: '#C6D0DE', glow: '#C9B0FF', accent: '#F2EAFF', biome: 'twoages', r: 3.0, els: ['dark', 'light'] }, (() => {
  const { TAU, TN, hit } = RiftFiend;
  const { INK, SILVER, SILVER_HI, GOLD, GOLD_HI, VIOLET, VIOLET_HI } = SEP;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }; let scratch = null;
  const LINE = '#232838', MARBLE = '#ECE6D8', MARBLE_SH = '#C9BFA8', MARBLE_HI = '#FFFFFF';
  const HS = 2.5, ALT = 3.9, NS = 8;   // the head's size, the height it floats at, the spikes
  const LIT = nrm([-0.35, -0.5, 0.8]), VIEW = [0, 0.7071, 0.7071];
  const PL_A = [Math.PI / 2 - 1.2, Math.PI / 2 + 1.2, -Math.PI / 2], PL_D = 7.4, PL_R = 1.4, LOOM_R = 1.6, WEAVE = 0.75;
  const plateAt = (C, i) => [C.x + Math.cos(PL_A[i]) * PL_D, C.y + Math.sin(PL_A[i]) * PL_D];
  const loomAt = C => [C.x, C.y + C.R - 1.8];   // where the pet stands to weave (the Loom itself stands just behind it)
  const loomFrame = C => [C.x, C.y + C.R - 3.9];
  const PAL = { front: '#B4BFD1', hi: '#F4F7FC', sh: '#5F6B84', back: '#3E4862', line: LINE, gold: GOLD_HI, goldSh: GOLD };
  const GPAL = { front: '#B7A4F2', hi: '#EEE6FF', sh: '#7C66C9', back: '#4C3C8E', line: '#4C3C8E', gold: '#E6DAFF', goldSh: '#A893E8' };
  const SPK = [{ col: '#B9C4D6', hi: '#F6F9FF', sh: '#56617C', dk: '#2E3550' }, { col: '#A898D8', hi: '#EDE4FF', sh: '#5A4A98', dk: '#2E2458' }];
  return {
    arenaR: 15, firstAct: 'stalk', artY: 0.8,
    artPoses: [{ name: 'hanging, the spikes wheeling', mem: { hd: 1.4 } }, { name: 'flared to strike', mem: { hd: 1.2, menace: 1, flare: 1, spR: 4.6 } }, { name: 'turned to the pet', mem: { hd: 0.5, spR: 3.2 } }, { name: 'woven: fallen, the eye bared', mem: { hd: 1.4, slump: 1 } }],
    phaseNames: ['The Raised Gallery', 'The Second Age', 'The Mourning', 'The Last Reflection'],
    props: C => { const p = loomFrame(C); return [{ kind: 'loom', x: p[0], y: p[1] }]; },
    paintGround(c, A) { paintGallery(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, t, cam, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.x = C.x; m.y = C.y - 3; m.noTouch = true;
      Object.assign(M, { hd: Math.PI / 2, px: m.x, py: m.y, spd: 0, turn: 0, bt: 0, alt: 14, menace: 0, rear: 0, roar: 0, recoil: 0, slump: 0, unfold: 0, flare: 0, sweepK: 0, sweepA: 0, look: Math.PI / 2, spA: 0, spin: 0, spR: 9, rushK: 0, hist: [],
        lashA: [0, 0, 0], lashK: [0, 0, 0], lashW: [0, 0, 0], vol: [], ptrail: [], copy: null, mirrorCd: 5, chan: 0, shieldK: 0, broodT: 10, wasEnter: true, roared: false, wasStun: false, seen: {}, last: null, rec: null, gl: null, blinkT: 2, blink: 0, plateLit: [0, 0, 0] }); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; M.roar = 1; M.flare = 1; M.recoil = 1; M.broodT = 2.5; FX.H.shake(10, 0.5); FX.H.flash(0.22, VIOLET_HI); FX.H.sfx.crash(); FX.H.ring(m.x, m.y, 0.5, 9, 1, VIOLET_HI, 0.4); shardBurst(FX, m.x, m.y - 3, 16);
      for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; const q = FX.clampArena({ x: m.x + Math.cos(a) * 4, y: m.y + Math.sin(a) * 4 }, 2); FX.minion('mourndisc', q.x, q.y); }
      if (lv >= 2) FX.H.banner('THE SECOND AGE', 'Its light sweeps between the replays; the lashes come twice; mourning discs gather', VIOLET_HI, 2.6, true); if (lv >= 4) FX.H.banner('The Last Reflection', 'Every hour it borrowed, it returns', '#FF6A8A', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, fast = (1 + (P - 1) * 0.08) * FX.S.fast; m.actT += dt; m.noTouch = true;
      // the second age: mourning discs (and now and then a second-eater) gather round the pet
      if (P >= 2 && m.act === 'stalk' && (M.broodT -= dt) <= 0) { M.broodT = P >= 4 ? 10 : 14; const n = FX.H.mons.filter(q => !q.dead && (q.type === 'mourndisc' || q.type === 'seceater')).length;
        if (n < 3) for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, p = FX.clampArena({ x: me.x + Math.cos(a) * 3.5, y: me.y + Math.sin(a) * 3.5 }, 1.5), type = i === 1 && Math.random() < 0.5 ? 'seceater' : 'mourndisc';
          FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.1, t: 1.0, dmg: m.dmg * 0.6, col: GOLD_HI, fn: s => { FX.H.sfx.pop(); FX.H.ring(s.x, s.y, 0.2, 1.4, 0.4, GOLD_HI, 0.3); shardBurst(FX, s.x, s.y - 0.5, 6); if (FX.m && !FX.m.dead) FX.minion(type, s.x, s.y); } }); }
        if (n < 3) FX.H.text(me.x, me.y - 2, 'The mourners gather', GOLD_HI, 13); }
      let menace = 0, rear = 0, spR = M.copy && !M.copy.held ? 2.7 : 3.4, altW = ALT + Math.sin(M.bt * 0.9) * 0.25;
      switch (m.act) {
        case 'stalk': {   // it drifts round the pet, its echo a moment behind; then chooses
          M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.4 * fast * (M.dir || 1); const R = (M.copy ? 7.5 : 6.5) + Math.sin(m.t * 0.6) * 1.0, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 3);
          drift(FX, m, M, p.x, p.y, 3.2 * fast, dt);
          if (m.actT > (P >= 2 ? 1.45 : 1.9) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; choose(FX, m); } break; }
        case 'record': { const R = M.rec; menace = 0.55; rear = 1; spR = 4.4; altW = ALT + 0.6; drift(FX, m, M, m.x, m.y, 0.5, dt);
          // three takes, two seconds apart: a ghost of the pet and a numbered mark, each to burst in turn after the last is taken
          const takes = [0.5, 2.5, 4.5], bursts = [6.0, 6.8, 7.6].map(x => x / FX.S.fast);
          while (R.k < 3 && m.actT >= takes[R.k] / FX.S.fast) { const k = R.k++, px = me.x, py = me.y, life = bursts[k] - m.actT; M.flare = 1;
            FX.H.zone({ kind: 'ghost', x: px, y: py, life: life + 0.15, max: life + 0.15, own: 'none', face: me.face });
            FX.tele({ shape: 'circle', x: px, y: py, r: 2.0, t: life, dmg: m.dmg * 1.5, col: VIOLET_HI, label: String(k + 1), fn: s => { FX.H.boom(s.x, s.y, 1.8, VIOLET_HI, '#FFFFFF', { n: 16, shake: 7, smoke: 2 }); FX.H.ring(s.x, s.y, 0.3, 2.2, 0.35, SILVER_HI, 0.35); shardBurst(FX, s.x, s.y - 0.4, 10); FX.H.sfx.crack(); M.recoil = Math.max(M.recoil, 0.25); } });
            FX.H.ring(px, py, 0.2, 1.2, 0.35, VIOLET_HI, 0.3); FX.H.sfx.chime(); FX.H.text(px, py - 1.8, `${k + 1}`, VIOLET_HI, 15); }
          // the second age: its three lashes sweep an arc during the replay, resolving between the first burst and the second
          if (P >= 2 && !R.sweep && m.actT >= bursts[0] - 1.4 / FX.S.fast) { R.sweep = true; const a = FX.angPet(m.x, m.y), t = (bursts[0] + bursts[1]) / 2 - m.actT; R.sa = a; M.sweepA = a;
            FX.tele({ shape: 'cone', x: m.x, y: m.y, a, len: 10, spread: 0.55, t, dmg: m.dmg * 1.4, col: GOLD_HI, fn: s => { M.sweepK = 1; M.sweepA = s.a; FX.H.sfx.whoosh(); FX.H.shake(8, 0.3); for (let i = 0; i < 9; i++) { const aa = s.a + (i / 8 - 0.5) * s.spread * 2, d = 2 + Math.random() * 7; FX.H.sparks(s.x + Math.cos(aa) * d, s.y + Math.sin(aa) * d, GOLD_HI, 3, 5); } } });
            say(FX, 'sweep', 'THE SWEEP', 'Between the first burst and the second: step out of its arc', GOLD_HI); }
          if (R.sweep && R.sa != null && !(M.sweepK > 0)) { for (let i = 0; i < 3; i++) { M.lashA[i] = R.sa + (i - 1) * 0.45; M.lashW[i] = 1; } menace = 1; }
          if (m.actT > bursts[2] + 0.6) { m.act = 'stalk'; m.actT = 0; M.rec = null; M.recoil = 0.4; } break; }
        case 'mirror': { menace = 1; rear = 0.8; spR = 2.5; drift(FX, m, M, m.x, m.y, 0.5, dt); if (m.actT > 1.7) { m.act = 'stalk'; m.actT = 0; } break; }
        case 'rush': { const L = M.gl;
          if (!L.go) { menace = 0.8; rear = 0.3; spR = 2.6; altW = ALT - 0.6; drift(FX, m, M, m.x, m.y, 0.3, dt); M.hd = FX.K.lerpA(M.hd, L.a, Math.min(1, dt * 6)); if (m.actT > L.wait + 1.5) { m.act = 'stalk'; m.actT = 0; } break; }
          const sp = 13 * fast; m.x += Math.cos(L.a) * sp * dt; m.y += Math.sin(L.a) * sp * dt; M.hd = L.a; L.prog += sp * dt; M.rushK = 1; altW = ALT - 1.3; menace = 0.6;
          if (!L.hit && FX.dist(m.x, m.y) < 1.8 + me.r) { if (FX.hurt(m.dmg * 1.4)) { L.hit = true; me.push = { vx: Math.cos(L.a + Math.PI / 2) * 9, vy: Math.sin(L.a + Math.PI / 2) * 9, t: 0.2 }; } }
          if (L.prog >= L.len || !FX.inArena(m.x + Math.cos(L.a) * 1.5, m.y + Math.sin(L.a) * 1.5, 1.5)) { const q = FX.clampArena(m, 2.5); m.x = q.x; m.y = q.y; M.recoil = 0.7; FX.H.sfx.thud(); FX.H.shake(6, 0.25);
            // its echo runs the same line half a breath after
            FX.tele({ shape: 'line', x: L.x0, y: L.y0, a: L.a, len: L.len, w: 2.0, t: 0.65 / FX.S.fast, dmg: m.dmg * 1.0, col: VIOLET_HI, fn: s => { FX.H.sfx.whoosh(); for (let i = 0; i < 8; i++) { const d = i / 7 * s.len; FX.H.sparks(s.x + Math.cos(s.a) * d, s.y + Math.sin(s.a) * d, VIOLET_HI, 2, 4); } } });
            m.act = 'stalk'; m.actT = 0; }
          break; }
        case 'volley': { const V = M.vg; menace = m.actT < V.wait ? 1 : 0.5; rear = 0.4; drift(FX, m, M, m.x, m.y, 0.3, dt); M.hd = FX.K.lerpA(M.hd, FX.angPet(m.x, m.y), Math.min(1, dt * 3));
          if (m.actT > V.end) { m.act = 'stalk'; m.actT = 0; } break; }
        case 'lash': { menace = 1; rear = 0.6; spR = 4.0; drift(FX, m, M, m.x, m.y, 0.3, dt); if (m.actT > M.lw) { m.act = 'stalk'; m.actT = 0; } break; }
        default: m.act = 'stalk'; m.actT = 0;
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3); M.rear = toward(M.rear, rear, dt, rear > M.rear ? 4 : 2.5); M.slump = decay(M.slump, dt, 1.6);
      M.spR = toward(M.spR, spR, dt, 3); M.alt = toward(M.alt, altW, dt, m.act === 'rush' ? 6 : 2.5);
      FX.parts(bodyParts(FX, m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.slump = Math.min(1, M.slump + dt * 2.2); M.menace = decay(M.menace, dt, 4); M.rear = decay(M.rear, dt, 4); m.noTouch = true; M.alt = toward(M.alt, 1.3, dt, 5); M.vol = [];
      const e = eyeAt(FX, M, m); FX.weak('eye', e[0], e[1] - e[2], 1.6, 2.4, m.stunT > 0.05);
      // held by the loom's threads, it twitches against them
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.4; FX.H.sparks(e[0] + FX.rnd(-1.5, 1.5), e[1] - e[2] + FX.rnd(-0.8, 0.8), VIOLET_HI, 3, 3); FX.H.shake(1.5, 0.08); }
      FX.parts(bodyParts(FX, m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m, me = FX.me, C = FX.C, P = FX.S.lv; if (!m) return; M.bt += dt;
      // how it moves: the spikes wheel faster with its pace and spin with its menace; it banks into its turns
      if (dt > 1e-4) { const d = Math.hypot(m.x - M.px, m.y - M.py), sp = d / dt, vx = (m.x - M.px) / dt; M.px = m.x; M.py = m.y; M.spd = toward(M.spd, sp, dt, 6); M.turn = toward(M.turn, clamp(vx * 0.05, -0.4, 0.4), dt, 3); }
      const slump = M.slump || 0; M.spA += dt * (0.55 + (M.menace || 0) * 0.9 + (M.copy && !M.copy.held ? 0.8 : 0)) * (1 - slump); M.spin += dt * (1.6 + (M.menace || 0) * 5 + (M.flare || 0) * 4) * (1 - slump * 0.9);
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.2); M.flare = decay(M.flare, dt, 1.6); M.sweepK = decay(M.sweepK, dt, 1.6); M.rushK = decay(M.rushK, dt, 2.5);
      for (let i = 0; i < 3; i++) { M.lashK[i] = decay(M.lashK[i], dt, 1.4); M.lashW[i] = decay(M.lashW[i], dt, 1.2); }
      M.vol = M.vol.filter(v => { v.t += dt; return v.t < v.end; });
      M.hist.push({ x: m.x, y: m.y, z: M.alt, t: M.bt }); while (M.hist.length > 2 && M.bt - M.hist[0].t > 0.8) M.hist.shift();
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 2.4 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.22; M.blink = Math.sin(Math.min(1, M.blinkU) * Math.PI); if (M.blinkU >= 1) { M.blinkU = null; M.blink = 0; } }
      M.look = FX.K.lerpA(M.look == null ? Math.PI / 2 : M.look, Math.atan2(me.y - m.y, me.x - m.x), Math.min(1, dt * 5)); if (m.act === 'stalk' || m.act === 'mirror' || m.act === 'record') M.hd = FX.K.lerpA(M.hd, M.look, Math.min(1, dt * 2));
      // the pet's route, kept for the mirror to walk
      const pt = M.ptrail, lp = pt[pt.length - 1]; if (!lp || Math.hypot(me.x - lp.x, me.y - lp.y) > 0.15) { const q = { x: me.x, y: me.y, t: M.bt }; pt.push(q); if (M.copy && !M.copy.held) M.copy.q.push(q); } while (pt.length > 2 && M.bt - pt[0].t > 8) pt.shift();
      updCopy(FX, m, M, dt);
      M.shieldK = toward(M.shieldK, M.copy && !M.copy.held ? 1 : 0, dt, 4);
      if (!M.copy && m.act !== 'enter') M.mirrorCd -= dt;
      for (let i = 0; i < 3; i++) M.plateLit[i] = decay(M.plateLit[i], dt, 1.5);
      if (!(m.stunT > 0)) { if (FX.S.weak.eye) FX.weak('eye', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.recoil = 1; M.roar = 0.6; M.flare = 1; if (M.copy) { const k = M.copy; shardBurst(FX, k.x, k.y - 0.5, 14); FX.H.ring(k.x, k.y, 0.3, 2.4, 0.5, VIOLET_HI, 0.35); if (k.zone) k.zone.life = Math.min(k.zone.life, 0.25); M.copy = null; } M.mirrorCd = 12; FX.H.text(m.x, m.y - 4, 'It rises, and reflects again', VIOLET_HI, 13); FX.H.sfx.whoosh(); } } else M.wasStun = true;
      // the entrance: it falls out of the sky, the spikes gathering in from far out; the eye opens and flares
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.unfold = clamp((e - 0.2) / 1.8, 0, 1); M.alt = lerp(14, ALT, 1 - Math.pow(1 - M.unfold, 3)); M.spR = lerp(10, 3.4, M.unfold * M.unfold * (3 - 2 * M.unfold)); M.hd = FX.K.lerpA(M.hd, M.look, Math.min(1, dt * 2)); if (e > 1.8 && !M.roared) { M.roared = true; M.roar = 1; M.flare = 1; M.rear = 1; FX.H.sfx.hum(); FX.H.sfx.crash(); FX.H.shake(9, 0.4); FX.H.ring(m.x, m.y, 0.3, 8, 1, VIOLET_HI, 0.4); } }
      else { M.unfold = toward(M.unfold, 1, dt, 3); if (M.wasEnter) { M.wasEnter = false; M.recoil = 1; FX.H.sfx.whoosh(); } } },
    dmgK(FX) { const M = FX.mem; return M.copy && !M.copy.held ? 0.16 : 1; },
    keep: { steps: 2, pad: 4 },
    draw(c, FX, m, X, Y, T, t, step) { drawVaul(c, FX, m, X, Y, T, t, step); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'loom') drawLoom(c, FX, p, X, Y, T, t); },
    overlay(c, FX, t, T) { drawPlates(c, FX, t, T); },
    drawFx(c, FX, T, t) { drawTentacles(c, FX, T, t); drawMirrorFx(c, FX, T, t); },
  };

  /* ---- choosing ---- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 1.9 : 1.1, true); }
  function choose(FX, m) { const M = FX.mem; let a;
    if (!M.copy && M.mirrorCd <= 0) a = 'mirror';
    else { // (a shuffled round of its four blows, so none is long missing; never the same twice running)
      if (!M.bag || !M.bag.length) { M.bag = ['record', 'rush', 'volley', 'lash'].sort(() => Math.random() - 0.5); if (M.bag[M.bag.length - 1] === M.last) M.bag.unshift(M.bag.pop()); } a = M.bag.pop(); }
    M.last = a; ({ mirror: startMirror, record: startRecord, rush: startRush, volley: startVolley, lash: startLash })[a](FX, m); }
  function startRecord(FX, m) { const M = FX.mem; m.act = 'record'; m.actT = 0; M.rec = { k: 0, sweep: false, sa: null }; FX.H.sfx.hum();
    say(FX, 'record', 'RECORDED BLASTS', 'It marks where you stand, three times: lead the marks out to the edge, then come in', VIOLET_HI); }
  function startMirror(FX, m) { const M = FX.mem, me = FX.me, pt = M.ptrail; m.act = 'mirror'; m.actT = 0; M.flare = 1; M.roar = 0.4; FX.H.sfx.hum();
    // the mirror steps out where the pet stood two and a half seconds ago, and walks the route from there
    let i0 = 0; for (let i = pt.length - 1; i >= 0; i--) if (M.bt - pt[i].t >= 2.5) { i0 = i; break; }
    const s = pt[i0] || { x: me.x, y: me.y }, p = FX.clampArena({ x: s.x, y: s.y }, 1.5);
    FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.2, t: 1.0, dmg: 0, col: VIOLET_HI, fn: () => { if (!FX.m || FX.m.dead) return;
      const q = pt.slice(i0 + 1), zone = { kind: 'ghost', x: p.x, y: p.y, life: 5, max: 10, own: 'none', face: me.face }; FX.H.zone(zone);
      M.copy = { x: p.x, y: p.y, q, zone, age: 0, snare: 0, plate: -1, held: false, hitCd: 0.8, immune: 0, face: me.face, step: 0 };
      FX.H.ring(p.x, p.y, 0.2, 2, 0.5, VIOLET_HI, 0.4); shardBurst(FX, p.x, p.y - 0.5, 10); FX.H.sfx.chime(); } });
    say(FX, 'mirror', 'MIRROR PURSUIT', 'Your reflection walks your path and shields it: lead it over a silver plate, then weave it at the Loom', VIOLET_HI); }
  function startRush(FX, m) { const M = FX.mem, me = FX.me, a = FX.angPet(m.x, m.y), wait = 1.05 / FX.S.fast;
    let len = 2; while (len < 28 && FX.inArena(m.x + Math.cos(a) * len, m.y + Math.sin(a) * len, 2)) len += 0.5; len = Math.min(len, Math.hypot(me.x - m.x, me.y - m.y) + 6);
    M.gl = { a, x0: m.x, y0: m.y, len, wait, go: false, prog: 0, hit: false }; m.act = 'rush'; m.actT = 0; FX.H.sfx.hum(); M.flare = 0.6;
    FX.tele({ shape: 'line', x: m.x, y: m.y, a, len, w: 2.8, t: wait, dmg: m.dmg * 1.3, col: SILVER_HI, fn: () => { if (M.gl) M.gl.go = true; FX.H.sfx.whoosh(); } });
    say(FX, 'rush', 'MIRROR RUSH', 'Off the line: the head runs it, and its echo runs it again', SILVER_HI); }
  function startVolley(FX, m) { const M = FX.mem, P = FX.S.lv, n = P >= 2 ? 6 : 4, a0 = FX.angPet(m.x, m.y), w0 = 0.9 / FX.S.fast, gap = 0.16 / FX.S.fast; m.act = 'volley'; m.actT = 0; M.flare = 1; FX.H.sfx.hum();
    // each spike in turn levels its point at the pet along a shown line, then flies out along it and back
    const picks = []; for (let j = 0; j < n; j++) picks.push(Math.round(j * NS / n) % NS);
    picks.forEach((i, j) => { const a = a0 + (j - (n - 1) / 2) * 0.3, wait = w0 + j * gap, len = 12;
      M.vol = M.vol.filter(v => v.i !== i); M.vol.push({ i, a, t: 0, wait, fly: 0.3, back: 0.7, end: wait + 1.0, len, x: m.x, y: m.y });
      FX.tele({ shape: 'line', x: m.x, y: m.y, a, len, w: 1.0, t: wait, dmg: m.dmg * 1.1, col: VIOLET_HI, tick: (dt, s) => { if (!s.done) { s.x = m.x; s.y = m.y; } }, fn: s => { const v = M.vol.find(q => q.i === i); if (v) { v.x = s.x; v.y = s.y; } FX.H.sfx.whoosh(); FX.H.sparks(s.x + Math.cos(a) * 3, s.y + Math.sin(a) * 3, SILVER_HI, 4, 6); } }); });
    M.vg = { wait: w0, end: w0 + (n - 1) * gap + 1.1 };
    say(FX, 'volley', 'SPIKE VOLLEY', 'Each spike levels on you along a line, then flies: step off the lines', VIOLET_HI); }
  function startLash(FX, m) { const M = FX.mem, P = FX.S.lv, a0 = FX.angPet(m.x, m.y), wait = 1.15 / FX.S.fast; m.act = 'lash'; m.actT = 0; M.flare = 0.6; FX.H.sfx.hum();
    const wave = (off, w) => { for (let k = 0; k < 3; k++) { const a = a0 + off + k * TAU / 3; FX.tele({ shape: 'line', x: m.x, y: m.y, a, len: 10.5, w: 1.8, t: w, dmg: m.dmg * 1.3, col: k === 1 ? GOLD_HI : VIOLET_HI, tick: (dt, s) => { if (!s.done) { M.lashA[k] = s.a; M.lashW[k] = 1; } }, fn: s => { M.lashA[k] = s.a; M.lashK[k] = 1; M.lashW[k] = 0; FX.H.sfx.whoosh(); FX.H.shake(4, 0.15); for (let i = 1; i < 6; i++) FX.H.sparks(s.x + Math.cos(s.a) * i * 2, s.y + Math.sin(s.a) * i * 2, k === 1 ? GOLD_HI : VIOLET_HI, 2, 4); } }); } };
    wave(0, wait); M.lw = wait + 0.9; if (P >= 2) { wave(Math.PI / 3, wait + 0.9 / FX.S.fast); M.lw = wait + 1.9; }
    say(FX, 'lash', 'LIGHT LASH', P >= 2 ? 'Its three tentacles lash out along the lanes, twice: stand between them' : 'Its three tentacles lash out along the lanes: stand between them', GOLD_HI); }

  /* ---- the mirror, the plates and the Loom ---- */
  function updCopy(FX, m, M, dt) { const k = M.copy, me = FX.me, C = FX.C, P = FX.S.lv; if (!k) { M.chan = decay(M.chan, dt, 3); return; }
    k.age += dt; k.hitCd -= dt; k.immune = decay(k.immune, dt, 1); if (k.zone) { k.zone.x = k.x; k.zone.y = k.y; if (k.zone.life > 0.3 && !k.fading) k.zone.life = 5; k.zone.face = k.face; }
    if (k.fading) { k.fadeT -= dt; if (k.fadeT <= 0) M.copy = null; return; }
    if (k.held) return;
    if (k.snare > 0) { k.snare -= dt; const pl = plateAt(C, k.plate); k.x = lerp(k.x, pl[0], Math.min(1, dt * 6)); k.y = lerp(k.y, pl[1], Math.min(1, dt * 6)); M.plateLit[k.plate] = 1;
      // the weave: the pet at the Loom while the mirror is caught
      const L = loomAt(C), LF = loomFrame(C); if (Math.hypot(me.x - L[0], me.y - L[1]) < LOOM_R + me.r) { M.chan += dt; if (Math.random() < dt * 10) FX.H.sparks(LF[0] + FX.rnd(-1.2, 1.2), LF[1] - FX.rnd(0.5, 2.8), GOLD_HI, 1, 2); if (M.chan >= WEAVE) weave(FX, m, M); } else M.chan = decay(M.chan, dt, 2);
      if (k.snare <= 0 && !k.held) { k.immune = 1.8; M.chan = 0; FX.H.text(k.x, k.y - 1.8, 'It tears free', VIOLET_HI, 13); FX.H.sfx.crack(); shardBurst(FX, k.x, k.y - 0.4, 6); }
      return; }
    M.chan = decay(M.chan, dt, 3);
    // it walks the pet's recorded route, slowly; caught up, it goes straight for the pet
    const v = (P >= 2 ? 3.5 : 3.0) * FX.S.fast; let step = v * dt;
    while (step > 0) { const tg = k.q.length ? k.q[0] : me, dx = tg.x - k.x, dy = tg.y - k.y, d = Math.hypot(dx, dy); if (d <= step) { if (!k.q.length) { k.x = tg.x; k.y = tg.y; break; } k.x = tg.x; k.y = tg.y; k.q.shift(); step -= d; } else { k.x += dx / d * step; k.y += dy / d * step; if (Math.abs(dx) > 0.05) k.face = dx >= 0 ? 1 : -1; step = 0; } }
    k.step += v * dt;
    if (k.hitCd <= 0 && Math.hypot(me.x - k.x, me.y - k.y) < 0.9 + me.r) { if (FX.hurt(m.dmg * 1.1)) { const a = Math.atan2(me.y - k.y, me.x - k.x); me.push = { vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, t: 0.22 }; FX.H.sparks(me.x, me.y - 0.5, VIOLET_HI, 8, 5); FX.H.text(k.x, k.y - 1.8, 'It catches you', VIOLET_HI, 13); } k.hitCd = 1.3; }
    // a plate under it catches it
    if (!k.immune) for (let i = 0; i < 3; i++) { const p = plateAt(C, i); if (Math.hypot(k.x - p[0], k.y - p[1]) < PL_R * 0.85) { k.snare = P >= 2 ? 5 : 6; k.plate = i; M.chan = 0; FX.H.ring(p[0], p[1], 0.3, PL_R + 0.8, 0.5, SILVER_HI, 0.4); FX.H.sfx.chime(); FX.H.shake(4, 0.2); FX.H.banner('SNARED', 'Run to the Memory Loom and stand at it to weave the reflection', GOLD_HI, 1.8, true); break; } }
    // a reflection left too long dims away of itself (and the shield with it), with nothing gained
    if (k.age > 26) { k.fading = true; k.fadeT = 0.4; if (k.zone) k.zone.life = 0.35; FX.H.text(k.x, k.y - 1.8, 'The reflection dims', VIOLET_HI, 13); M.mirrorCd = 12; } }
  function weave(FX, m, M) { const k = M.copy; k.held = true; k.snare = 0; M.chan = 0; FX.S.tele.length = 0; m.act = 'stalk'; m.actT = 0; M.rec = null; M.gl = null; m.stunT = 6.5; M.slump = 0; M.roar = 0.5; M.recoil = 1;
    FX.H.banner('WOVEN', 'The Loom holds the reflection: the shield breaks — strike the eye!', GOLD_HI, 2.4, true); FX.H.shake(12, 0.5); FX.H.flash(0.25, GOLD_HI); FX.H.sfx.crash(); FX.H.sfx.chime();
    const L = loomAt(FX.C); FX.H.ring(L[0], L[1], 0.3, 3, 0.6, GOLD_HI, 0.35); FX.H.ring(k.x, k.y, 0.3, 3, 0.6, GOLD_HI, 0.35); shardBurst(FX, m.x, m.y - 2, 18); }
  /* a spray of silver glass: little turning shards and a few sparks */
  function shardBurst(FX, x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 4; FX.H.part({ kind: 'shard', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 2.5, g: 8, life: 0.6 + Math.random() * 0.4, max: 1, size: 3 + Math.random() * 3, rot: Math.random() * 3, vr: 8, color: i % 3 ? SILVER_HI : VIOLET_HI }); } }

  /* ---- movement and the head's frame ---- */
  function drift(FX, m, M, tx, ty, spd, dt) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d > 0.05) { const v = Math.min(spd, d * 2.5); m.x += dx / d * v * dt; m.y += dy / d * v * dt; } const q = FX.clampArena(m, 2.5); m.x = q.x; m.y = q.y; }
  // the head's frame: F along its gaze (yaw toward the pet, pitched down a little), U up its face, rolled about F so the
  // hollow always faces the camera; cen its middle in the world; s its size (it swells with a roar, jolts when struck)
  function headFrame(FX, m, M, at, ghost) { const bt = (M.bt || 0) - (ghost ? 0.5 : 0), slump = M.slump || 0, hs = m.hitSq || 0;
    const yaw = (M.hd == null ? Math.PI / 2 : M.hd) + (ghost ? -0.25 : 0) + Math.sin(bt * 0.7) * 0.12, pitch = -0.12 + (M.rear || 0) * 0.25 - (M.recoil || 0) * 0.2 - slump * 0.35 + Math.sin(bt * 1.3) * 0.06;
    // (its face turned mostly to the camera and partly to its gaze, so the hollow and the eye in it always show)
    const F = [Math.cos(yaw) * Math.cos(pitch), Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch)], N = nrm([F[0] * 0.75, F[1] * 0.75 + VIEW[1], F[2] * 0.75 + VIEW[2]]), up = [0, 0, 1], k0 = dot(up, N), U0 = nrm([up[0] - N[0] * k0, up[1] - N[1] * k0, up[2] - N[2] * k0]), S0 = cross(U0, N);
    const roll = Math.sin(bt * 1.1 + 0.5) * 0.12 + (M.turn || 0) * 0.6 + slump * 0.5 + hs * 0.15 + Math.cos(yaw) * 0.18, cr = Math.cos(roll), sr = Math.sin(roll), U = [U0[0] * cr + S0[0] * sr, U0[1] * cr + S0[1] * sr, U0[2] * cr + S0[2] * sr], Sd = cross(U, N);
    const s = HS * (1 + (M.roar || 0) * 0.07 + hs * 0.05 + Math.sin(bt * 1.6) * 0.015) * lerp(0.6, 1, M.unfold == null ? 1 : M.unfold) * (ghost ? 0.92 : 1), bob = Math.sin(bt * 1.4) * 0.22 * (1 - slump);
    const cen = [at.x - F[0] * hs * 0.3, at.y - F[1] * hs * 0.3, at.z + bob]; return { F, U, Sd, N, cen, s, yaw }; }
  function headPos(m, M) { return { x: m.x, y: m.y, z: M.alt == null ? ALT : M.alt }; }
  function eyeAt(FX, M, m) { return headFrame(FX, m, M, headPos(m, M)).cen; }
  function bodyParts(FX, m, M) { const H = headFrame(FX, m, M, headPos(m, M)), c = H.cen; return [hit('head', c, 2.6, m), hit('core', [c[0], c[1], c[2] - 2.0], 1.8, m)]; }
  /* the eight spikes: where each is and which way it points. They wheel on a tilted orbit round the head, each turning on
     its length; they flare out before a blow and draw in round the shield; in a rush they stream behind it; in a volley
     those called level their points at the pet and fly out along their lines and back; when it falls they fall round it */
  function spikes(FX, m, M, H) { const bt = M.bt || 0, c = H.cen, slump = M.slump || 0, hs = m.hitSq || 0, R0 = (M.spR == null ? 3.4 : M.spR) + hs * 0.8 + (M.recoil || 0) * 0.3, tilt = 0.42 + Math.sin(bt * 0.5) * 0.14, rush = M.rushK || 0, out = [];
    const bx = -Math.cos(H.yaw), by = -Math.sin(H.yaw);
    for (let i = 0; i < NS; i++) { const a = (M.spA == null ? bt * 0.6 : M.spA) + i * TAU / NS, r = R0 + Math.sin(bt * 1.7 + i * 1.3) * 0.2, ct = Math.cos(tilt), st = Math.sin(tilt);
      let p = [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * ct, c[2] + Math.sin(a) * r * st * -1 + Math.sin(bt * 2 + i) * 0.18 - 0.3], ax = nrm([p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
      if (rush > 0) { const k = rush, back = 2.2 + (i % 4) * 1.0, side = ((i % 2) * 2 - 1) * (0.9 + Math.floor(i / 2) % 2 * 0.8); const q = [c[0] + bx * back - by * side, c[1] + by * back + bx * side, c[2] + Math.sin(i * 2.3) * 0.9]; p = [lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(p[2], q[2], k)]; ax = nrm([lerp(ax[0], bx, k), lerp(ax[1], by, k), lerp(ax[2], 0, k)]); }
      const v = M.vol && M.vol.find(q => q.i === i); if (v) { const d = [Math.cos(v.a), Math.sin(v.a), -0.12], ready = clamp(v.t / Math.max(0.2, v.wait * 0.8), 0, 1), e = ready * ready * (3 - 2 * ready), rp = [c[0] + d[0] * (HS * 1.4 + (i % 3) * 0.3), c[1] + d[1] * (HS * 1.4 + (i % 3) * 0.3), c[2] - 0.8];
        let q = [lerp(p[0], rp[0], e), lerp(p[1], rp[1], e), lerp(p[2], rp[2], e)]; const ft = v.t - v.wait; if (ft > 0) { const u = ft < v.fly ? Math.sin(ft / v.fly * Math.PI / 2) : Math.max(0, 1 - (ft - v.fly) / v.back), dist = u * v.len; q = [rp[0] + d[0] * dist, rp[1] + d[1] * dist, lerp(rp[2], 0.9, u)]; }
        p = q; ax = nrm([lerp(ax[0], d[0], e), lerp(ax[1], d[1], e), lerp(ax[2], d[2], e)]); }
      if (slump > 0) { const g = [m.x + Math.cos(a) * 4.4, m.y + Math.sin(a) * 3.8, 0.45], tg = nrm([-Math.sin(a), Math.cos(a), -0.25]); p = [lerp(p[0], g[0], slump), lerp(p[1], g[1], slump), lerp(p[2], g[2], slump)]; ax = nrm([lerp(ax[0], tg[0], slump), lerp(ax[1], tg[1], slump), lerp(ax[2], tg[2], slump)]); }
      const unf = M.unfold == null ? 1 : M.unfold; out.push({ i, p, ax, spin: (M.spin == null ? bt * 2 : M.spin) * (i % 2 ? 1 : -1) + i * 0.7, L: 3.0 * (1 + (M.flare || 0) * 0.12) * lerp(0.5, 1, unf), w: 0.62 * lerp(0.5, 1, unf), pal: SPK[i % 2], v: !!v }); }
    return out; }

  /* ---- painting the head ---- */
  function drawVaul(c, FX, m, X, Y, T, t, step) {
    const go = i => step == null || step === i, M = FX.mem, P3 = TN.cam(X, Y, T, m), lw = Math.max(1.4, T * 0.07);
    const H = headFrame(FX, m, M, headPos(m, M)), S = spikes(FX, m, M, H), dc = RiftFiend.depth(H.cen), back = S.filter(s => RiftFiend.depth(s.p) < dc).sort((a, b) => RiftFiend.depth(a.p) - RiftFiend.depth(b.p)), front = S.filter(s => RiftFiend.depth(s.p) >= dc).sort((a, b) => RiftFiend.depth(a.p) - RiftFiend.depth(b.p));
    if (go(0)) {
      // its shadow on the marble (larger and fainter the higher it hangs), and the spikes' small ones
      const g0 = P3(m.x, m.y, 0), z = H.cen[2], k = 1 / (1 + z * 0.12); FX.K.shade(c, g0[0], g0[1], T * 4.2 * k, T * 1.9 * k, 0.42, '#2A2440'); S.forEach(s => { const q = P3(s.p[0], s.p[1], 0); FX.K.shade(c, q[0], q[1], T * 0.9, T * 0.4, 0.18 / (1 + s.p[2] * 0.2), '#2A2440'); });
      // the echo: a translucent violet head a moment behind it, painted whole and then laid down translucent
      const hst = M.hist && M.hist.length ? M.hist[0] : null, ga = (M.unfold == null ? 1 : M.unfold) * (1 - (M.slump || 0)) * (m.act === 'enter' ? 0.5 : 1);
      if (ga > 0.03) { const at = hst ? { x: hst.x, y: hst.y, z: hst.z } : headPos(m, M), GH = headFrame(FX, m, M, at, true); GH.cen[0] -= Math.cos(GH.yaw) * 1.1; GH.cen[1] -= Math.sin(GH.yaw) * 1.1; GH.cen[2] += 0.5; translucent(c, T, GH, P3, 0.34 * ga, g => paintHead(g, FX, m, M, GH, P3, T, t, lw, GPAL, true)); }
      back.forEach(s => paintSpike(c, s, P3, T, lw, M));
    }
    if (go(1)) { paintHead(c, FX, m, M, H, P3, T, t, lw, PAL, false); front.forEach(s => paintSpike(c, s, P3, T, lw, M)); }
  }
  // paint into a scratch canvas over just the box the echo covers, then lay it down at alpha a
  function translucent(c, T, H, P3, a, paint) { const tr = c.getTransform ? c.getTransform() : null; if (!tr || tr.b || tr.c) { c.save(); c.globalAlpha *= a; paint(c); c.restore(); return; }
    const q = P3(...H.cen), R = H.s * T * 1.6, x0 = q[0] - R, x1 = q[0] + R, y0 = q[1] - R, y1 = q[1] + R;
    const X0 = Math.floor(tr.a * x0 + tr.e), Y0 = Math.floor(tr.d * y0 + tr.f), W = Math.ceil((x1 - x0) * tr.a) + 2, Hh = Math.ceil((y1 - y0) * tr.d) + 2; if (!(W > 0 && Hh > 0) || W > 4096 || Hh > 4096) return;
    if (!scratch) scratch = document.createElement('canvas'); if (scratch.width < W || scratch.height < Hh) { scratch.width = Math.max(scratch.width, W); scratch.height = Math.max(scratch.height, Hh); }
    const g = scratch.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, Hh); g.setTransform(tr.a, 0, 0, tr.d, tr.e - X0, tr.f - Y0); g.lineJoin = 'round'; g.lineCap = 'round';
    paint(g);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = a; c.drawImage(scratch, 0, 0, W, Hh, X0, Y0, W, Hh); c.restore(); }
  /* the head: a hollow diamond slab of silver with a gold inlay, its thickness showing behind its face, and the violet
     eye floating in the hollow */
  function paintHead(c, FX, m, M, H, P3, T, t, lw, pal, ghost) {
    const { Sd, U, N, cen, s } = H, bt = (M.bt || t) - (ghost ? 0.5 : 0), slump = M.slump || 0, open = slump * 0.5 + (M.flare || 0) * 0.08, th = 0.42 * s / HS;
    const V = (f, u, n) => [cen[0] + Sd[0] * f + U[0] * u + N[0] * n, cen[1] + Sd[1] * f + U[1] * u + N[1] * n, cen[2] + Sd[2] * f + U[2] * u + N[2] * n];
    const OUT = [[0.9, 0], [0, 1.05], [-0.9, 0], [0, -1.3]].map(([f, u], j) => [f * s + (j === 0 ? open : j === 2 ? -open : 0), u * s + (j === 1 ? open : j === 3 ? -open : 0)]), INN = OUT.map(([f, u]) => [f * 0.6, u * 0.6 + 0.04 * s]);
    // which side of the slab faces the camera: that face is painted over the other, the rim joining them
    const nf = (N[1] + N[2]) >= 0 ? 1 : -1, near = OUT.map(([f, u]) => P3(...V(f, u, th * nf))), far = OUT.map(([f, u]) => P3(...V(f, u, -th * nf))), nearI = INN.map(([f, u]) => P3(...V(f, u, th * nf))), farI = INN.map(([f, u]) => P3(...V(f, u, -th * nf))), C0 = P3(...cen);
    const ring = (g, O, I) => { g.moveTo(O[0][0], O[0][1]); for (let j = 1; j < 4; j++) g.lineTo(O[j][0], O[j][1]); g.closePath(); g.moveTo(I[0][0], I[0][1]); for (let j = 3; j >= 1; j--) g.lineTo(I[j][0], I[j][1]); g.closePath(); };
    // the glow of the eye, behind everything
    const er = T * 0.34 * s * (1 + slump * 0.35 + (M.flare || 0) * 0.08), glow = 0.4 + (M.menace || 0) * 0.35 + (M.flare || 0) * 0.5 + slump * 0.5, eb = Math.sin(bt * 2.2) * T * 0.08;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, glow) * (ghost ? 0.6 : 0.9); blitSized(c, glowSprite(VIOLET), C0[0] - er * 4.5, C0[1] - er * 4.5 + eb, er * 9, er * 9); c.restore();
    // the far face and the rim (the slab's edges), in shadow
    TN.shape(c, g => ring(g, far, farI), { col: pal.back, shade: pal.back, hi: false, line: pal.line, r: T * s * 0.5, lw, spec: false, force: true });
    const quad = (a, b, cc, d, col) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = pal.line; c.lineWidth = lw * 0.8; c.stroke(); };
    for (let j = 0; j < 4; j++) { const k = (j + 1) % 4; const mid = [(OUT[j][0] + OUT[k][0]) / 2, (OUT[j][1] + OUT[k][1]) / 2], ow = V(mid[0] * 1.2, mid[1] * 1.2, 0), lit = dot(nrm([ow[0] - cen[0], ow[1] - cen[1], ow[2] - cen[2]]), LIT);
      quad(near[j], near[k], far[k], far[j], FX.K.mixC(pal.sh, pal.front, clamp(lit * 0.9 + 0.35, 0, 1))); quad(nearI[j], nearI[k], farI[k], farI[j], pal.back); }
    // the face: polished silver, a gold inlay running round it, creases at the corners
    TN.shape(c, g => ring(g, near, nearI), { col: pal.front, shade: pal.sh, hi: pal.hi, line: pal.line, r: T * s * 0.55, lw: lw * 1.2, d1: 0.1, d2: 0.2, spec: ghost ? false : 0.7, specAt: [lerp(near[1][0], near[2][0], 0.4), lerp(near[1][1], near[2][1], 0.4)], specR: 0.12, force: true, inner: g => {
      g.strokeStyle = pal.gold; g.lineWidth = Math.max(1.5, T * 0.09); g.beginPath(); for (let j = 0; j < 4; j++) { const a = near[j], b = nearI[j], x = lerp(a[0], b[0], 0.5), y = lerp(a[1], b[1], 0.5); j ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke();
      g.strokeStyle = pal.goldSh; g.lineWidth = Math.max(1, T * 0.04); g.beginPath(); for (let j = 0; j < 4; j++) { const a = near[j], b = nearI[j], x = lerp(a[0], b[0], 0.2), y = lerp(a[1], b[1], 0.2); j ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke();
      g.strokeStyle = pal.line; g.lineWidth = Math.max(1, T * 0.05); g.globalAlpha = 0.45; g.beginPath(); for (let j = 0; j < 4; j++) { g.moveTo(near[j][0], near[j][1]); g.lineTo(nearI[j][0], nearI[j][1]); } g.stroke(); g.globalAlpha = 1;
      // a few runes of the hours engraved along the face, glowing with its menace
      if (!ghost) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 + (M.menace || 0) * 0.5 + (M.flare || 0) * 0.3; g.strokeStyle = VIOLET_HI; g.lineWidth = Math.max(1, T * 0.05); for (let j = 0; j < 4; j++) { const a = near[j], b = near[(j + 1) % 4], ia = nearI[j], ib = nearI[(j + 1) % 4]; for (let q = 1; q < 4; q++) { const u = q / 4, x0 = lerp(lerp(a[0], b[0], u), lerp(ia[0], ib[0], u), 0.3), y0 = lerp(lerp(a[1], b[1], u), lerp(ia[1], ib[1], u), 0.3), x1 = lerp(lerp(a[0], b[0], u), lerp(ia[0], ib[0], u), 0.7), y1 = lerp(lerp(a[1], b[1], u), lerp(ia[1], ib[1], u), 0.7); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); } } g.restore(); } } });
    // the eye: violet, slit, following the pet (the echo's a moment behind); flaring before a blow, wide and rolling when bared
    const me = FX.me || { x: m.x, y: m.y + 5 }, la = ghost ? (M.look || 0) - 0.5 : Math.atan2(me.y - cen[1], me.x - cen[0]), dz = slump > 0.5 ? [Math.cos(bt * 5) * 0.7, Math.sin(bt * 5) * 0.5] : [Math.cos(la) * 0.75, Math.sin(la) * 0.55 + 0.15];
    TN.eye(c, C0[0], C0[1] + eb, er, { iris: VIOLET, white: ghost ? '#E8E0FF' : '#F1ECFF', pupil: '#120A24', line: pal.line, look: dz, blink: ghost ? 0 : Math.max(M.blink || 0, (m.hitSq || 0) * 0.6), lid: pal.sh, irisR: 0.7, pupilR: 0.42 - (M.menace || 0) * 0.15 + slump * 0.2, slit: slump < 0.5, squash: 0.95 });
    if (!ghost && (M.flare || 0) > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = M.flare * 0.8; blitSized(c, glowSprite(VIOLET_HI), C0[0] - er * 2, C0[1] - er * 2, er * 4, er * 4); c.restore(); }
    if (!ghost && slump > 0.4) for (let j = 0; j < 3; j++) { const a = bt * 3 + j * TAU / 3; TN.twinkle(c, C0[0] + Math.cos(a) * T * 2.2, C0[1] - T * 2.6 + Math.sin(a) * T * 0.5, T * 0.22, '#FFFFFF', 0.9); }
  }
  /* a spike: a long faceted bipyramid (a point, a short heel, a waist of four edges, two broad and two narrow, so it
     reads as a blade), turning on its length; each facet lit by how it is turned, the far facets culled */
  function paintSpike(c, S, P3, T, lw, M) { const { p, ax, spin, L, w, pal } = S; let u = cross(ax, [0, 0, 1]); if (Math.hypot(...u) < 1e-3) u = [1, 0, 0]; u = nrm(u); const v = cross(ax, u);
    const tip = [p[0] + ax[0] * L * 0.68, p[1] + ax[1] * L * 0.68, p[2] + ax[2] * L * 0.68], heel = [p[0] - ax[0] * L * 0.32, p[1] - ax[1] * L * 0.32, p[2] - ax[2] * L * 0.32], W = [];
    for (let k = 0; k < 4; k++) { const a = spin + k * Math.PI / 2, ww = k % 2 ? w * 0.45 : w, d = [u[0] * Math.cos(a) + v[0] * Math.sin(a), u[1] * Math.cos(a) + v[1] * Math.sin(a), u[2] * Math.cos(a) + v[2] * Math.sin(a)]; W.push([p[0] + ax[0] * L * 0.05 + d[0] * ww, p[1] + ax[1] * L * 0.05 + d[1] * ww, p[2] + ax[2] * L * 0.05 + d[2] * ww]); }
    const faces = []; for (let k = 0; k < 4; k++) { const a = W[k], b = W[(k + 1) % 4]; faces.push([tip, a, b], [heel, b, a]); }
    const sc = P3(...p), menace = (M.menace || 0) + (M.flare || 0) * 0.5 + (S.v ? 1 : 0);
    if (menace > 0.1) { const q = P3(...tip); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(0.8, menace * 0.45); blitSized(c, glowSprite(VIOLET_HI), q[0] - T * 0.9, q[1] - T * 0.9, T * 1.8, T * 1.8); c.restore(); }
    for (const f of faces) { let n = nrm(cross([f[1][0] - f[0][0], f[1][1] - f[0][1], f[1][2] - f[0][2]], [f[2][0] - f[0][0], f[2][1] - f[0][1], f[2][2] - f[0][2]])); const fc = [(f[0][0] + f[1][0] + f[2][0]) / 3, (f[0][1] + f[1][1] + f[2][1]) / 3, (f[0][2] + f[1][2] + f[2][2]) / 3]; if (dot(n, [fc[0] - p[0], fc[1] - p[1], fc[2] - p[2]]) < 0) n = n.map(x => -x);
      if (dot(n, VIEW) <= 0) continue; const lit = dot(n, LIT), col = lit > 0.7 ? DunFiend.KIT.mixC(pal.col, pal.hi, (lit - 0.7) / 0.3) : lit > 0 ? DunFiend.KIT.mixC(pal.sh, pal.col, lit / 0.7) : DunFiend.KIT.mixC(pal.dk, pal.sh, lit + 1);
      const q = f.map(x => P3(...x)); c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.lineTo(q[2][0], q[2][1]); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(35,40,56,.55)'; c.lineWidth = Math.max(1, lw * 0.5); c.stroke(); }
    // the silhouette inked, and a hot edge of violet light down the blade
    const sil = [tip, W[0], W[1], W[2], W[3], heel].map(x => P3(...x)); c.save(); c.strokeStyle = LINE; c.lineWidth = lw; c.lineJoin = 'round'; c.beginPath(); const T0 = sil[0], Hh = sil[5];
    // (the outline: the convex hull of the projected points)
    const pts = sil.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const q of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); } for (let k = pts.length - 1; k >= 0; k--) { const q = pts[k]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
    const hull = lo.slice(0, -1).concat(hi.slice(0, -1)); c.beginPath(); hull.forEach((q, k) => k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + Math.min(0.6, menace * 0.4); c.strokeStyle = S.i % 2 ? GOLD_HI : VIOLET_HI; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(T0[0], T0[1]); c.lineTo(sc[0], sc[1]); c.stroke(); c.restore(); }

  /* ---- the three tentacles of light: ribbons of violet and gold light that curl and swirl beneath the head, rear before
     a lash and strike out along their lanes; painted live over the scene, added as light ---- */
  function drawTentacles(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || m.dead) return; const H = headFrame(FX, m, M, headPos(m, M)), slump = M.slump || 0, bt = M.bt || t, unf = M.unfold == null ? 1 : M.unfold;
    const root = [H.cen[0] - H.U[0] * H.s * 1.15, H.cen[1] - H.U[1] * H.s * 1.15, H.cen[2] - H.U[2] * H.s * 1.15], NP = 18, sx = q => FX.sx(q[0]), sy = q => FX.sy(q[1]) - q[2] * T;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < 3; i++) { const K = M.lashK ? M.lashK[i] : 0, Wd = M.lashW ? M.lashW[i] : 0, A = M.lashA ? M.lashA[i] : 0, sw = M.sweepK || 0, col = i === 1 ? GOLD_HI : VIOLET_HI, core = i === 1 ? '#FFF6DA' : '#F4EEFF', pts = [];
      const swA = (M.sweepA || 0) + (i - 1) * 0.45 + (1 - sw) * 0.9 - 0.45, lashA = sw > 0.02 ? swA : A, ext = Math.max(K, sw);
      for (let j = 0; j <= NP; j++) { const u = j / NP;
        // idle: a lazy spiral down and out, each its own phase
        const th = i * TAU / 3 + Math.sin(bt * 0.3 + i) * 0.35 + u * (0.35 + Math.sin(bt * 0.6 + i) * 0.15) + Math.sin(bt * 1.6 - u * 3.2 + i * 2) * 0.22 * u, r = u * (5.2 + Math.sin(bt * 0.9 + i) * 0.5) * unf;
        let q = [root[0] + Math.cos(th) * r, root[1] + Math.sin(th) * r * 0.9, root[2] * (1 - Math.pow(u, 1.1) * 0.75) + Math.sin(bt * 1.8 - u * 4 + i) * 0.45 * u];
        // rearing before a lash: drawn up and back over the head, quivering
        if (Wd > 0) { const ca = Math.cos(A), sa = Math.sin(A), qq = [root[0] - ca * u * 1.6 + Math.sin(u * 9 + bt * 14) * 0.15 * u, root[1] - sa * u * 1.6, root[2] + u * 2.6 + Math.sin(u * 4 + bt * 6) * 0.3]; q = q.map((x, k) => lerp(x, qq[k], Wd)); }
        // lashing: flung straight out along its lane to the marble, the wave running out along it
        if (ext > 0) { const ca = Math.cos(lashA), sa = Math.sin(lashA), d = u * 10.5, wv = Math.sin(u * 10 - bt * 16) * 0.3 * (1 - u * 0.5), qq = [m.x + ca * d - sa * wv, m.y + sa * d + ca * wv, lerp(root[2], 0.35, Math.sqrt(u))]; q = q.map((x, k) => lerp(x, qq[k], Math.min(1, ext * 1.4))); }
        // fallen, they lie limp on the marble
        if (slump > 0) { const qq = [root[0] + Math.cos(th) * u * 3.6, root[1] + Math.sin(th) * u * 3, lerp(root[2], 0.1, Math.min(1, u * 3))]; q = q.map((x, k) => lerp(x, qq[k], slump)); }
        pts.push(q); }
      const S = pts.map(q => [sx(q), sy(q)]), dim = (1 - slump * 0.6) * unf, bright = 1 + Wd * 0.4 + ext * 0.6;
      // three passes: a wide soft glow, the ribbon of colour, a white-hot core; each tapering to the tip
      for (const [wk, a, cl, op] of [[1.05, 0.16, i === 1 ? GOLD : VIOLET, 'source-over'], [0.5, 0.75, col, 'source-over'], [0.9, 0.14, col, 'lighter'], [0.16, 0.95, core, 'lighter']]) { c.strokeStyle = cl; c.globalCompositeOperation = op; for (let j = 0; j < NP; j++) { const u = j / NP; c.globalAlpha = Math.min(1, a * dim * bright * (1 - u * 0.55)); c.lineWidth = Math.max(1, T * wk * (1.15 - u * 0.85)); c.beginPath(); c.moveTo(S[j][0], S[j][1]); c.lineTo(S[j + 1][0], S[j + 1][1]); c.stroke(); } }
      // motes of light running down it, and a bloom at its tip
      for (let k = 0; k < 4; k++) { const u = (bt * 0.5 + k / 4 + i * 0.13) % 1, j = Math.min(NP - 1, Math.floor(u * NP)), e = u * NP - j, x = lerp(S[j][0], S[j + 1][0], e), y = lerp(S[j][1], S[j + 1][1], e); TN.twinkle(c, x, y, T * (0.16 + 0.06 * Math.sin(bt * 5 + k)), core, 0.8 * dim); }
      const tp = S[NP]; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * dim * bright; blitSized(c, glowSprite(col), tp[0] - T * 0.9, tp[1] - T * 0.9, T * 1.8, T * 1.8); }
    c.restore(); }

  /* ---- the plates, the mirror and the shield ---- */
  function drawPlates(c, FX, t, T) { const M = FX.mem, C = FX.C, k = M.copy; c.save();
    for (let i = 0; i < 3; i++) { const p = plateAt(C, i), X = FX.sx(p[0]), Y = FX.sy(p[1]), r = PL_R * T, lit = Math.max(M.plateLit ? M.plateLit[i] : 0, k && !k.held && !k.snare ? 0.25 + 0.15 * Math.sin(t * 3 + i) : 0);
      if (lit > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = lit * 0.6; blitSized(c, glowSprite(GOLD_HI), X - r * 1.6, Y - r * 1.6, r * 3.2, r * 3.2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      if (k && !k.held && !k.snare) { c.strokeStyle = `rgba(232,207,142,${0.4 + 0.3 * Math.sin(t * 4 + i)})`; c.lineWidth = Math.max(1.5, T * 0.08); c.setLineDash([T * 0.3, T * 0.25]); c.lineDashOffset = -t * T; c.beginPath(); c.arc(X, Y, r + T * 0.25, 0, TAU); c.stroke(); c.setLineDash([]); } }
    // the Loom's ring: where to stand to weave, lit while the mirror is caught, with how far the weave has gone
    const L = loomAt(C), LX = FX.sx(L[0]), LY = FX.sy(L[1]), on = k && k.snare > 0 && !k.held;
    c.strokeStyle = on ? `rgba(232,207,142,${0.6 + 0.3 * Math.sin(t * 6)})` : 'rgba(178,150,93,.35)'; c.lineWidth = Math.max(1.5, T * (on ? 0.1 : 0.06)); c.beginPath(); c.ellipse(LX, LY, LOOM_R * T, LOOM_R * T * 0.92, 0, 0, TAU); c.stroke();
    if (on) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; c.fillStyle = GOLD_HI; c.beginPath(); c.ellipse(LX, LY, LOOM_R * T, LOOM_R * T * 0.92, 0, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    // the mirror's road: the route it has yet to walk, a dotted violet line on the marble
    if (k && !k.held && !k.snare && k.q.length > 1) { c.strokeStyle = 'rgba(142,107,208,.45)'; c.lineWidth = Math.max(1.5, T * 0.09); c.setLineDash([T * 0.18, T * 0.3]); c.lineDashOffset = t * T * 1.5; c.beginPath(); c.moveTo(FX.sx(k.x), FX.sy(k.y)); for (let j = 0; j < k.q.length; j += 2) c.lineTo(FX.sx(k.q[j].x), FX.sy(k.q[j].y)); c.stroke(); c.setLineDash([]); }
    if (k && !k.fading) { const X = FX.sx(k.x), Y = FX.sy(k.y); c.fillStyle = 'rgba(80,60,140,.25)'; c.beginPath(); c.ellipse(X, Y + T * 0.15, T * 0.8, T * 0.3, 0, 0, TAU); c.fill(); c.strokeStyle = `rgba(201,176,255,${0.55 + 0.25 * Math.sin(t * 7)})`; c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.ellipse(X, Y + T * 0.15, T * 0.95, T * 0.38, 0, 0, TAU); c.stroke(); }
    c.restore(); }
  function drawMirrorFx(c, FX, T, t) { const M = FX.mem, m = FX.m, k = M.copy, C = FX.C; if (!m) return; c.save();
    // the shield while the mirror walks: a shell of silver glass round the head, a thread of violet back to the mirror
    const sk = M.shieldK || 0; if (sk > 0.02 && !m.dead) { const hc = eyeAt(FX, M, m), X = FX.sx(hc[0]), Y = FX.sy(hc[1]) - hc[2] * T, rx = T * 4.6, ry = T * 4.1;
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = sk * 0.06; c.fillStyle = '#9E8AD8'; c.beginPath(); c.ellipse(X, Y, rx, ry, 0, 0, TAU); c.fill(); c.globalAlpha = sk * (0.55 + 0.2 * Math.sin(t * 5)); c.strokeStyle = SILVER_HI; c.lineWidth = Math.max(1.5, T * 0.08); c.beginPath(); c.ellipse(X, Y, rx, ry, 0, 0, TAU); c.stroke();
      // facets glinting round its rim
      for (let j = 0; j < 7; j++) { const a = t * 0.6 + j * TAU / 7; TN.twinkle(c, X + Math.cos(a) * rx, Y + Math.sin(a) * ry, T * (0.16 + 0.08 * Math.sin(t * 4 + j)), '#FFFFFF', sk * 0.8); }
      if (k && !k.fading) { const kx = FX.sx(k.x), ky = FX.sy(k.y) - T * 0.7; c.globalAlpha = sk * 0.5; c.strokeStyle = VIOLET_HI; c.lineWidth = Math.max(1, T * 0.05); c.setLineDash([T * 0.4, T * 0.3]); c.lineDashOffset = -t * T * 2; c.beginPath(); c.moveTo(X, Y); c.quadraticCurveTo((X + kx) / 2, Math.min(Y, ky) - T * 3, kx, ky); c.stroke(); c.setLineDash([]); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    if (k && !k.fading) { const X = FX.sx(k.x), Y = FX.sy(k.y);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 + 0.15 * Math.sin(t * 6); blitSized(c, glowSprite(VIOLET), X - T * 1.3, Y - T * 2, T * 2.6, T * 2.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      // caught on a plate, gold threads bind it; held by the Loom, threads run all the way from the Loom to it
      if (k.snare > 0 || k.held) { const n = 6; c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(1, T * 0.05); for (let j = 0; j < n; j++) { const a = j / n * TAU + t * 0.8, r0 = T * (k.held ? 0.7 : 1.1 + 0.15 * Math.sin(t * 9 + j)); c.globalAlpha = 0.8; c.beginPath(); c.moveTo(X + Math.cos(a) * r0, Y - T * 0.2 + Math.sin(a) * r0 * 0.4); c.quadraticCurveTo(X + Math.cos(a) * r0 * 0.4, Y - T * 1.6, X + Math.cos(a + 1) * T * 0.3, Y - T * 1.0 + Math.sin(a) * T * 0.3); c.stroke(); } c.globalAlpha = 1;
        if (!k.held) { const u = clamp(k.snare / (FX.S.lv >= 2 ? 5 : 6), 0, 1); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = Math.max(3, T * 0.16); c.beginPath(); c.arc(X, Y - T * 2.4, T * 0.4, -Math.PI / 2, -Math.PI / 2 + TAU); c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.arc(X, Y - T * 2.4, T * 0.4, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); }
        if (k.held) { const L = loomFrame(C), LX = FX.sx(L[0]), LY = FX.sy(L[1]) - T * 1.8; c.globalCompositeOperation = 'lighter'; for (let j = 0; j < 3; j++) { c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 5 + j); c.strokeStyle = j % 2 ? GOLD_HI : '#FFF4D0'; c.lineWidth = Math.max(1, T * (0.07 - j * 0.015)); c.beginPath(); c.moveTo(LX + (j - 1) * T * 0.5, LY); c.quadraticCurveTo((LX + X) / 2 + (j - 1) * T, Math.min(LY, Y) - T * 2.5, X, Y - T * 0.9); c.stroke(); } c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; } } }
    // the weave's progress over the pet as it stands at the Loom
    if ((M.chan || 0) > 0.02 && k && k.snare > 0) { const me = FX.me, X = FX.sx(me.x), Y = FX.sy(me.y) - T * 2.2, u = clamp(M.chan / WEAVE, 0, 1); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = Math.max(4, T * 0.2); c.beginPath(); c.arc(X, Y, T * 0.55, 0, TAU); c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(3, T * 0.14); c.beginPath(); c.arc(X, Y, T * 0.55, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke();
      c.font = `900 ${Math.round(T * 0.32)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText('WEAVING', X, Y - T * 0.95); c.fillText('WEAVING', X, Y - T * 0.95); }
    c.restore(); }

  /* ---- the Memory Loom: a silver frame on a marble plinth, gold warp threads, a cloth half woven with diamonds ---- */
  function drawLoom(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, k = M.copy, on = !!(k && k.snare > 0 && !k.held), held = !!(k && k.held), ch = clamp((M.chan || 0) / WEAVE, 0, 1), lw = Math.max(1.2, T * 0.06), glow = on ? 0.6 + 0.3 * Math.sin(t * 6) : held ? 0.8 : 0.15;
    c.save(); c.fillStyle = 'rgba(60,50,40,.25)'; c.beginPath(); c.ellipse(X, Y + T * 0.15, T * 2.0, T * 0.5, 0, 0, TAU); c.fill();
    if (glow > 0.2) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = glow * 0.45; blitSized(c, glowSprite(GOLD_HI), X - T * 2.6, Y - T * 4.4, T * 5.2, T * 5.2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    const box = (x, y, w, h, col, sh, hi) => TN.shape(c, TN.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]), { col, shade: sh, hi, line: LINE, r: Math.min(w, h) * 1.2, lw, d1: 0.12, d2: 0.22, spec: false, force: true });
    // the plinth
    box(X - T * 1.8, Y - T * 0.45, T * 3.6, T * 0.45, MARBLE, MARBLE_SH, MARBLE_HI); c.fillStyle = GOLD; c.fillRect(X - T * 1.8, Y - T * 0.32, T * 3.6, T * 0.06);
    const top = Y - T * 3.3, bot = Y - T * 0.85, x0 = X - T * 1.3, x1 = X + T * 1.3;
    // the warp: gold threads between the beams, trembling as the weave runs
    c.lineCap = 'butt'; for (let j = 0; j <= 12; j++) { const x = lerp(x0 + T * 0.2, x1 - T * 0.2, j / 12), wv = (on || held ? Math.sin(t * 22 + j * 1.7) * T * 0.03 * (0.4 + ch) : 0); c.strokeStyle = j % 2 ? GOLD_HI : GOLD; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(x, top + T * 0.2); c.quadraticCurveTo(x + wv, (top + bot) / 2, x, bot); c.stroke(); }
    // the cloth woven so far: violet with silver diamonds, rising up the warp from the breast beam
    const cloth = T * (0.7 + 0.25 * Math.sin(t * 0.3) * 0 + (held ? 0.5 : 0) + ch * 0.4), cy = bot - cloth; c.fillStyle = '#4A3A7C'; c.fillRect(x0 + T * 0.2, cy, x1 - x0 - T * 0.4, cloth); c.strokeStyle = SILVER_HI; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); for (let j = 0; j < 6; j++) { const dx = lerp(x0 + T * 0.4, x1 - T * 0.4, j / 5), dy = cy + cloth / 2, s = T * 0.16; c.moveTo(dx, dy - s); c.lineTo(dx + s * 0.7, dy); c.lineTo(dx, dy + s); c.lineTo(dx - s * 0.7, dy); c.closePath(); } c.stroke(); c.strokeStyle = GOLD; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(x0 + T * 0.2, cy); c.lineTo(x1 - T * 0.2, cy); c.stroke();
    // the shuttle: a little gold boat thrown across the warp (idly now and then; fast while it weaves)
    const sp = on && ch > 0 ? t * 9 : t * 0.9, sx = X + Math.sin(sp) * T * 1.0, sy = cy - T * 0.12; c.fillStyle = GOLD_HI; c.strokeStyle = LINE; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.moveTo(sx - T * 0.35, sy); c.quadraticCurveTo(sx, sy - T * 0.16, sx + T * 0.35, sy); c.quadraticCurveTo(sx, sy + T * 0.12, sx - T * 0.35, sy); c.fill(); c.stroke();
    // the posts and the beams: polished silver, gold caps, a violet stone at the crown that wakes when the mirror is caught
    const post = x => { const g = c.createLinearGradient(x - T * 0.14, 0, x + T * 0.14, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, SILVER_HI); g.addColorStop(1, '#7D879A'); c.fillStyle = g; c.beginPath(); c.rect(x - T * 0.14, top - T * 0.2, T * 0.28, Y - T * 0.45 - top + T * 0.2); c.fill(); c.strokeStyle = LINE; c.lineWidth = lw; c.stroke(); };
    post(x0); post(x1);
    box(x0 - T * 0.3, top - T * 0.28, x1 - x0 + T * 0.6, T * 0.3, SILVER_HI, '#8792A4', '#FFFFFF'); box(x0 - T * 0.1, bot, x1 - x0 + T * 0.2, T * 0.22, SILVER, '#7D879A', SILVER_HI);
    [x0, x1].forEach(x => { c.fillStyle = GOLD_HI; c.strokeStyle = LINE; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(x, top - T * 0.75); c.lineTo(x + T * 0.2, top - T * 0.45); c.lineTo(x, top - T * 0.25); c.lineTo(x - T * 0.2, top - T * 0.45); c.closePath(); c.fill(); c.stroke(); });
    c.fillStyle = on || held ? VIOLET_HI : VIOLET; c.beginPath(); c.moveTo(X, top - T * 0.6); c.lineTo(X + T * 0.24, top - T * 0.13); c.lineTo(X, top + T * 0.06); c.lineTo(X - T * 0.24, top - T * 0.13); c.closePath(); c.fill(); c.strokeStyle = LINE; c.stroke();
    if (on || held) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7; blitSized(c, glowSprite(VIOLET_HI), X - T * 0.8, top - T * 1.0, T * 1.6, T * 1.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    if (on) { c.font = `800 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; const s = 'WEAVE · stand here'; c.strokeText(s, X, top - T * 1.2); c.fillText(s, X, top - T * 1.2); }
    c.restore(); }

  /* ---- the Raised Gallery: ivory marble in two ages, gold inlay, the snare plates, the wall of square recesses ---- */
  function paintGallery(c, A) { const R = A.R, rnd = A.rnd;
    let g = c.createRadialGradient(-R * 0.25, -R * 0.3, R * 0.1, 0, 0, R + 1.5); g.addColorStop(0, '#F6F2E8'); g.addColorStop(0.7, '#E6DFCF'); g.addColorStop(1, '#CFC5AE'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.2, 0, TAU); c.fill();
    // square flags, a little of each one's own tone, faint grey veins; the western half lies in the Past: warmer, worn, cracked
    c.save(); c.beginPath(); c.arc(0, 0, R + 0.1, 0, TAU); c.clip();
    for (let y = -R; y < R; y += 1.5) for (let x = -R; x < R; x += 1.5) { const past = x + 0.75 < -0.4, v = rnd(); c.fillStyle = past ? `rgba(${200 + v * 20},${170 + v * 20},${120 + v * 20},${0.12 + v * 0.08})` : `rgba(${255},${255},${255},${0.12 + v * 0.14})`; c.fillRect(x + 0.04, y + 0.04, 1.42, 1.42); }
    c.strokeStyle = 'rgba(160,148,120,.35)'; c.lineWidth = 0.05; for (let v = -R; v <= R; v += 1.5) { c.beginPath(); c.moveTo(v, -R); c.lineTo(v, R); c.moveTo(-R, v); c.lineTo(R, v); c.stroke(); }
    c.strokeStyle = 'rgba(140,140,160,.22)'; c.lineWidth = 0.04; for (let i = 0; i < 26; i++) { let x = (rnd() - 0.5) * 2 * R, y = (rnd() - 0.5) * 2 * R; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (rnd() - 0.3) * 1.6; y += (rnd() - 0.5) * 1.2; c.lineTo(x, y); } c.stroke(); }
    // the Past: a warm wash, dust, and cracks across the flags
    const pg = c.createLinearGradient(-R, 0, 1, 0); pg.addColorStop(0, 'rgba(190,150,90,.2)'); pg.addColorStop(1, 'rgba(190,150,90,0)'); c.fillStyle = pg; c.fillRect(-R, -R, R + 1, R * 2);
    c.strokeStyle = 'rgba(90,70,50,.35)'; c.lineWidth = 0.06; for (let i = 0; i < 12; i++) { let x = -R * 0.2 - rnd() * R * 0.8, y = (rnd() - 0.5) * 2 * R * 0.8; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (rnd() - 0.5) * 1.4; y += (rnd() - 0.5) * 1.4; c.lineTo(x, y); } c.stroke(); }
    c.restore();
    // the dividing line of the two ages: a seam of silver down the middle, with a gold hour-mark at each end
    c.strokeStyle = 'rgba(169,181,197,.7)'; c.lineWidth = 0.1; c.beginPath(); c.moveTo(-0.4, -R); c.lineTo(-0.4, R); c.stroke();
    // gold inlay: two rings and twelve hour-marks round the middle, a diamond at its heart
    c.strokeStyle = 'rgba(178,150,93,.75)'; c.lineWidth = 0.14; [4.2, 10.4].forEach(r => { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }); c.lineWidth = 0.06; c.beginPath(); c.arc(0, 0, 4.5, 0, TAU); c.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, ca = Math.cos(a), sa = Math.sin(a); c.lineWidth = i % 3 ? 0.08 : 0.16; c.beginPath(); c.moveTo(ca * 9.6, sa * 9.6); c.lineTo(ca * (i % 3 ? 10.2 : 10.9), sa * (i % 3 ? 10.2 : 10.9)); c.stroke(); }
    c.fillStyle = 'rgba(178,150,93,.35)'; c.strokeStyle = 'rgba(178,150,93,.8)'; c.lineWidth = 0.1; c.beginPath(); c.moveTo(0, -1.6); c.lineTo(1.0, 0); c.lineTo(0, 1.6); c.lineTo(-1.0, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(142,107,208,.35)'; c.beginPath(); c.arc(0, 0, 0.35, 0, TAU); c.fill();
    // the snare plates: silver discs engraved with rings, four gold clasps round each
    PL_A.forEach(a => { const x = Math.cos(a) * PL_D, y = Math.sin(a) * PL_D; c.fillStyle = 'rgba(60,60,80,.25)'; c.beginPath(); c.ellipse(x, y + 0.12, PL_R + 0.1, PL_R * 0.95, 0, 0, TAU); c.fill();
      const pg2 = c.createRadialGradient(x - 0.4, y - 0.5, 0.1, x, y, PL_R); pg2.addColorStop(0, '#FFFFFF'); pg2.addColorStop(0.5, '#C9D2DE'); pg2.addColorStop(1, '#7F8AA0'); c.fillStyle = pg2; c.beginPath(); c.arc(x, y, PL_R, 0, TAU); c.fill(); c.strokeStyle = LINE; c.lineWidth = 0.08; c.stroke();
      c.strokeStyle = 'rgba(60,70,90,.45)'; c.lineWidth = 0.05; [0.45, 0.8, 1.1].forEach(r => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); });
      for (let j = 0; j < 4; j++) { const b = j / 4 * TAU + Math.PI / 4, cx = x + Math.cos(b) * PL_R, cy = y + Math.sin(b) * PL_R; c.fillStyle = GOLD; c.strokeStyle = LINE; c.lineWidth = 0.05; c.beginPath(); c.moveTo(cx + Math.cos(b) * 0.3, cy + Math.sin(b) * 0.3); c.lineTo(cx + Math.cos(b + 1.6) * 0.2, cy + Math.sin(b + 1.6) * 0.2); c.lineTo(cx - Math.cos(b) * 0.25, cy - Math.sin(b) * 0.25); c.lineTo(cx + Math.cos(b - 1.6) * 0.2, cy + Math.sin(b - 1.6) * 0.2); c.closePath(); c.fill(); c.stroke(); } });
    // the Loom's dais at the southern edge: a half ring of gold-banded marble
    const L = [0, R - 2.9]; c.fillStyle = 'rgba(178,150,93,.25)'; c.beginPath(); c.ellipse(L[0], L[1], 2.8, 2.2, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(178,150,93,.7)'; c.lineWidth = 0.1; c.stroke();
    // the wall: a band of pale stone with square recesses all round, a silver frame to each, a few holding a faint violet
    c.fillStyle = '#B8B0A0'; c.beginPath(); c.arc(0, 0, R + 1.45, 0, TAU); c.arc(0, 0, R + 0.05, 0, TAU, true); c.fill('evenodd'); c.strokeStyle = 'rgba(60,55,50,.6)'; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, R + 0.05, 0, TAU); c.stroke();
    const n = 36; for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU, r = R + 0.75, x = Math.cos(a) * r, y = Math.sin(a) * r; c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.fillStyle = '#4A5468'; c.fillRect(-0.55, -0.5, 1.1, 0.9); c.fillStyle = '#2E3546'; c.fillRect(-0.4, -0.38, 0.8, 0.66); c.strokeStyle = SILVER_HI; c.lineWidth = 0.07; c.strokeRect(-0.55, -0.5, 1.1, 0.9); if (i % 5 === 2) { c.fillStyle = 'rgba(142,107,208,.55)'; c.fillRect(-0.3, -0.28, 0.6, 0.46); } c.restore(); }
    c.strokeStyle = 'rgba(178,150,93,.8)'; c.lineWidth = 0.12; c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.stroke(); }
  /* the sky over the Raised Gallery: open pale blue, a high white sun, slow clouds, and the colonnade of the far hall */
  function paintSky(c, W, H, t, cam, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7FA8D8'); g.addColorStop(0.45, '#B4CDEA'); g.addColorStop(0.8, '#DCE7F3'); g.addColorStop(1, '#F1EEE6'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const sx = W * 0.25 - (cam.x - 28) * T * 0.05, sy = H * 0.1; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite('#FFF6DC'), sx - T * 7, sy - T * 7, T * 14, T * 14); c.globalAlpha = 0.9; blitSized(c, glowSprite('#FFFFFF'), sx - T * 1.6, sy - T * 1.6, T * 3.2, T * 3.2); c.restore();
    const R = mulberry32(71); c.save(); c.fillStyle = '#FFFFFF'; for (let i = 0; i < 9; i++) { const x = R() * W, y = H * (0.08 + R() * 0.35), w = 40 + R() * 90; c.globalAlpha = 0.35 + R() * 0.3; for (let j = 0; j < 4; j++) { c.beginPath(); c.ellipse(x + (j - 1.5) * w * 0.3, y + Math.sin(j * 2) * 4, w * 0.3, w * 0.12, 0, 0, TAU); c.fill(); } } c.restore();
    // the far colonnade: silver pillars with gold capitals under a long lintel, standing on a ledge of the hall
    c.save(); const base = H * 0.5, ph = H * 0.2; c.fillStyle = 'rgba(200,196,186,.85)'; c.fillRect(0, base, W, H - base); c.fillStyle = 'rgba(169,181,197,.9)'; c.fillRect(0, base - ph - 10, W, 10); c.fillStyle = 'rgba(178,150,93,.9)'; c.fillRect(0, base - ph - 2, W, 3);
    for (let x = 12; x < W; x += 46) { const gr = c.createLinearGradient(x - 7, 0, x + 7, 0); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.5, '#C9D2DE'); gr.addColorStop(1, '#8792A4'); c.fillStyle = gr; c.fillRect(x - 7, base - ph, 14, ph); c.fillStyle = '#C8AD72'; c.fillRect(x - 10, base - ph, 20, 5); c.fillRect(x - 10, base - 4, 20, 4); }
    c.restore(); }
})());
