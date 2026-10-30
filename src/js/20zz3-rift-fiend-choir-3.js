/* ---------- THE HEART THAT HEARS ----------
   The Choir Before Creation's last boss, in the Resonating Bowl: a 36 m circular floor in four broad quadrants (0 NE,
   1 SE, 2 SW, 3 NW), each with its own embossed symbol; four great curved horns stand outside the edge pointing in, and
   a drum pad sits in each quadrant (the stage builds all of it: X.rift.self.mod). The heart floats at chest height over
   the bowl's dais: a roughly spherical seed six metres across of three thick glossy dark-maroon lobes. Four bone tubes
   grow from its top and curve outward like a crown of horns (one over each quadrant); a tarnished gold ring is set round
   its middle, broken in two places, and on every beat those gaps show the soft coral inside. Four short tendrils tie it
   to the floor at the quadrants' seams, holding its lower surface (a taut membrane, the thing that hears) within reach.
   No face, no veins: an alien musical seed.
   I   PULSE MEASURE (above 70%): three quadrant arcs of its ring light, numbered; the quadrants strike in that order (each
       previewed on the floor with its badge and countdown). One quadrant is never struck; a struck one is safe again.
   II  DISSONANCE (70–35%): one struck quadrant echoes off the beat (a smaller second outline): wait for the echo before
       stepping into a freshly struck quadrant. Two hush moths fly to one of the great horns and hush it (the resonator
       goes dark), but the main preview (ring, floor, numbers) is never touched; hit a moth to interrupt it.
   III THE UNFINISHED CHORD (below 35%): a four-step sequence. One drum pad lights: charge it (4.5 s; leaving pauses) during
       the first three steps (the second strikes the pad's own quadrant: step off and come back). After step three its
       shelter dome rises; step four is a sustained whole-arena pulse that spares only those inside it. Then the ring
       breaks open: a long vulnerability window, the lower surface x2.
   Weak point: the lower surface between the tendrils (x1.5, shown under the quadrant the pet is in); x2 while the ring is
   open. Its body is thick (x0.6). It never moves: it bobs, breathes with the cavern's heartbeat (CHO.heart: the gaps glow,
   the crown mouths breathe; steady under "Fewer effects"), swells to wind up, shivers on the off-beat, rises for the
   chord, sags open when its ring breaks. Its fall: every pipe falls silent for two seconds (CHO.SEALING), then one gentle
   chord, and the heart closes into a motionless dark seed round the Rhythm Sigil; the sealing follows (the bell is the
   rift's reward). */
RiftFiend.define({ id: 'heart', hpK: 1.3, dmgK: 1.3, name: 'The Heart That Hears', title: 'The Unfinished Chord', color: '#341C2F', glow: '#DA8F86', accent: '#F6BDB2', biome: 'resonance', r: 3.0, els: ['wind', 'dark'], phases: 3, cuts: [1, 0.7, 0.35] }, (() => {
  const { TAU, TN } = RiftFiend, K = DunFiend.KIT;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u, smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const sf = (FX, k, ...a) => { const s = FX.H && FX.H.sfx; if (s && s[k]) try { s[k](...a); } catch (e) {} };
  const rgba = TN.rgba, mix = (a, b, u) => K.mixC(a, b, clamp(u, 0, 1));
  const CH = typeof CHO !== 'undefined' ? CHO : null, lowFx = () => !!(CH ? CH.lowFx() : (typeof st !== 'undefined' && st && st.lowFx));
  /* the palette: glossy maroon lobes (four tones, a hot edge, a coral bounce), bone crown tubes, tarnished gold ring,
     coral interior, the listening membrane */
  const INK = '#12060D', LOBE_HI = '#73404F', LOBE = '#4B2437', LOBE_SH = '#341C2F', LOBE_D = '#170910', LOBE_HOT = '#DE9AA4';
  const BONE_HI = '#F4EBD3', BONE = '#D9C9A5', BONE_SH = '#A6957A', BONE_D = '#76674F';
  const GOLD_HOT = '#F2E1A6', GOLD_HI = '#D4B978', GOLD = '#A58A4E', GOLD_SH = '#6B5530', GOLD_D = '#3E3019', TARN = '#5F6243';
  const CORAL_HOT = '#FFE6DC', CORAL_HI = '#F6BDB2', CORAL = '#DA8F86', CORAL_D = '#9C5A55', CORAL_DD = '#4A2026';
  const MEM_HI = '#A8687F', MEM = '#7A4060', MEM_SH = '#4E2440', MEM_D = '#2A1022';
  const SEED = '#120A10', SEED_HI = '#2E1D29', WARN = (CH && CH.WARN) || '#FF4D6D', GOLDL = '#FFE37A';
  /* the body (tiles): centre height, screen radius; lobes and ring in units of that radius (screen, y down) */
  const ZC = 3.45, RS = 3.0;
  const LOBES = [{ x: 0, y: -0.5, rx: 0.76, ry: 0.62, rot: 0 }, { x: -0.44, y: 0.12, rx: 0.6, ry: 0.76, rot: 0.27 }, { x: 0.44, y: 0.12, rx: 0.6, ry: 0.76, rot: -0.27 }];
  const RING = { y: 0.1, rx: 1.06, ry: 0.32, h: 0.28 }, GAPS = [0.3, 2.12], GW = 0.17, THL = 2.35, APEX = [0, -0.97];
  const QAM = [0, 1, 2, 3].map(i => -Math.PI / 4 + i * Math.PI / 2), QA0 = i => -Math.PI / 2 + i * Math.PI / 2, QSYM = [0, 1, 2, 4];
  const TEND = QAM, TROOT = [[0.5, 0.36], [0.55, 0.62], [-0.55, 0.62], [-0.5, 0.36]], TANCH = 4.1;
  const CYC1 = ['measure', 'rest', 'measure', 'swell'], CYC2 = ['dissonance', 'swell', 'dissonance', 'measure'], CYC3 = ['chord', 'dissonance', 'swell', 'chord', 'dissonance', 'measure'];
  const ARENA = (CH && CH.arena && CH.arena.heart) || { R: 18, carve() {}, start(C) { return { x: C.x + 0.5, y: C.y + C.R - 3 }; } };
  const RXC = new WeakMap(), LX = -0.566, LY = -0.824;
  /* the hush moths it calls fly to a great horn and hush it (the stock moth hunts pads and the pet) */
  if (typeof DunAI !== 'undefined' && DunAI.mon && DunAI.mon.hushmoth && !DunAI.mon.hushmoth.heartWrap) {
    const base = DunAI.mon.hushmoth; DunAI.mon.hushmoth = function (m, A, X) { return m.hornTo ? hornMoth(m, A, X) : base.call(this, m, A, X); }; DunAI.mon.hushmoth.heartWrap = true; DunAI.mon.hushmoth.base = base; }
  function hornMoth(m, A, X) { const h = m.hornTo, base = DunAI.mon.hushmoth.base;
    if (m.hornCd > 0) { m.hornCd -= A.dt; m.settled = false; return base(m, A, X); }
    const tx = m.hx, ty = m.hy, dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); m.cd = Math.max(m.cd, 1);
    if (d > 0.3 && !m.settled) { const s = Math.min(d, A.sp * 1.6 * A.dt); m.x += dx / d * s; m.y += dy / d * s; m.face = dx >= 0 ? 1 : -1; m.mode = null; return; }
    m.x = tx + Math.sin(m.t * 3 + m.hk) * 0.08; m.y = ty; m.mode = 'hush';
    if (!m.settled) { m.settled = true; m.hp0 = m.hp; m.hushes = (m.hushes || 0) + 1; X.text(m.x, m.y - 1.4, 'HUSH', CORAL_HI, 15); if (X.sfx && X.sfx.hiss) X.sfx.hiss(0.5, 0.12, 900); }
    if (m.hp < m.hp0 - 0.5 || m.stun > 0) { m.settled = false; m.mode = null; m.hornCd = 6; m.interrupts = (m.interrupts || 0) + 1; X.text(m.x, m.y - 1.3, 'Interrupted!', CORAL_HI, 14); m.kbx = (m.x - X.me.x) * 2; m.kby = (m.y - X.me.y) * 2; } void h; }
  return {
    arenaR: ARENA.R, carve: ARENA.carve, firstAct: 'idle', artY: 0.7,
    artPoses: [{ name: 'idle: floating, listening', mem: {} },
      { name: 'entrance: rising, the tendrils reaching', mem: { rise: 0.72, anc: [0, 0.5, 0, 0.15] } },
      { name: 'pulse measure: three arcs lit, numbered', mem: { inhale: 1, arcs: [{ n: 1, f: 0.35, warn: 1 }, { n: 2, f: 0.7 }, null, { n: 3, f: 0.9 }] } },
      { name: 'the beat lands: the gaps flare', mem: { strike: 1, hbK: 1, arcs: [null, { n: 2, f: 0.5, warn: 1 }, null, { n: 3, f: 0.8 }] } },
      { name: 'dissonance: the off-beat echo', mem: { shiver: 1, hbK: 0.6, arcs: [{ n: 1, f: 0.3, warn: 1, en: "1'", ef: 0.6 }, null, { n: 2, f: 0.6 }, { n: 3, f: 0.85 }] } },
      { name: 'the unfinished chord: it rises, all four lit', mem: { chord: 1, inhale: 0.7, all: 1, hbK: 0.8 } },
      { name: 'the sustained pulse', mem: { chord: 1, pulse: 1, all: 1, hbK: 1 } },
      { name: 'the ring breaks open (staggered)', mem: { open: 1, stunK: 1, hbK: 0.8 } },
      { name: 'hurt: recoiling', mem: { recoil: 1, recoilS: -1, hbK: 0.3 } },
      { name: 'falling silent: closing into a seed', mem: { dead: 1, seed: 0.5, silent: 1, sink: 0.5 } },
      { name: 'fallen: a dark seed round the Rhythm Sigil', mem: { dead: 1, seed: 1, sigil: 0.75, sink: 1, silent: 1 } }],
    phaseNames: ['Pulse Measure', 'Dissonance', 'The Unfinished Chord'],
    start(C) { return ARENA.start(C); },
    props() { return []; },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'remains' && FX.m) { c.save(); paint(c, FX, FX.m, FX.sx(FX.m.x), FX.sy(FX.m.y), T, t); c.restore(); } },
    paintGround(c, A2) { paintBowl(c, A2); },
    sky(c, W, H, t, cam, T) { paintCavern(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    camFocus(FX, m) { const M = FX.mem; if (!M.P) return null;
      if (m.dead) return M.deadT != null && M.deadT < 6 ? { x: m.x, y: m.y - 2, k: 0.75, zoom: 0.5 } : null;
      if (m.act === 'enter') return { x: m.x, y: m.y - 2.5, k: 0.85, zoom: 0.5 };
      if (M.A && M.A.kind === 'chord') return { x: (m.x + M.A.pad.x) / 2, y: (m.y + M.A.pad.y) / 2, k: 0.3, zoom: 0.44 };
      return { x: m.x, y: m.y - 1.5, k: 0.38, zoom: 0.46 }; },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.noTouch = true; m.touchK = 0; m.x = C.x; m.y = C.y;
      Object.assign(M, { bt: 0, picks: 0, nextAct: null, seen: {}, A: null, rise: 0, anc: [0, 0, 0, 0], inhale: 0, inhaleW: 0, strike: 0, shiver: 0, chord: 0, chordW: 0, pulse: 0, pulseW: 0, open: 0, recoil: 0, recoilS: 1, rest: 0, restW: 0, stunK: 0, all: 0, allW: 0,
        arcs: [null, null, null, null], arcLit: [0, 0, 0, 0], seed: 0, sink: 0, silent: 0, sigil: 0, moths: [], mothCd: 0, wasStun: false, mq: -1, hornWas: [false, false, false, false], qStruck: [-9, -9, -9, -9], log: [], chordRings: [],
        stat: { measures: 0, strikes: 0, strikeHit: 0, echoes: 0, echoHit: 0, swells: 0, swellHit: 0, moths: 0, obscured: 0, chords: 0, chordHit: 0, chordSafe: 0, opens: 0, openSheltered: 0 } });
      M.P = { ok: 1 }; },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; resetAll(FX, m); M.recoil = 1; M.strike = 1; FX.H.flash(0.2, CORAL_HI);
      if (lv === 2) { M.nextAct = 'dissonance'; M.picks = 0; FX.H.banner('DISSONANCE', 'A struck quadrant echoes off the beat (a smaller second outline): wait for the echo before you step in', CORAL_HI, 3, true); }
      if (lv >= 3) { M.nextAct = 'chord'; M.picks = 0; dismissMoths(FX); FX.H.banner('THE UNFINISHED CHORD', 'Charge the lit drum pad during the first three steps; stand in its shelter for the fourth', CORAL_HI, 3, true); } },
    ai(FX, m, dt) { const M = FX.mem, lv = FX.S.lv; m.actT += dt; m.noTouch = true;
      switch (m.act) {
        case 'idle': if (m.actT > (lv >= 3 ? 1.0 : lv >= 2 ? 1.15 : 1.3) / FX.S.fast) choose(FX, m); break;
        case 'measure': case 'dissonance': if (measureTick(FX, m, dt)) endAct(FX, m); break;
        case 'swell': if (swellTick(FX, m, dt)) endAct(FX, m); break;
        case 'rest': if (restTick(FX, m, dt)) endAct(FX, m); break;
        case 'chord': if (chordTick(FX, m, dt)) endAct(FX, m); break;
        default: endAct(FX, m);
      }
      FX.parts(partsList(FX, m)); },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true; M.shT = (M.shT || 0) - dt;
      if (M.shT <= 0 && !lowFx()) { M.shT = 0.25; const a = Math.random() * TAU; FX.H.part({ kind: 'spark', x: m.x + Math.cos(a) * 1.6, y: m.y + Math.sin(a) * 1.2, vx: Math.cos(a) * 0.6, vy: -1.2, g: -0.4, life: 1.1, max: 1.1, size: 2, color: Math.random() < 0.5 ? CORAL_HI : GOLD_HI }); }
      FX.parts(partsList(FX, m)); },
    update(FX, dt) { const M = FX.mem, m = FX.m, me = FX.me; if (!m || !M.P) return; M.bt += dt; const RX = rxOf(FX), mod = modOf(FX);
      if (m.dead) { deadTick(FX, m, dt, mod); easePose(FX, m, dt); return; }
      M.recoil = decay(M.recoil, dt, 2.6); M.strike = decay(M.strike, dt, 2.2); M.shiver = decay(M.shiver, dt, 1.6);
      // the entrance: it rises out of the dais, then the tendrils reach down and anchor one by one
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.rise = smooth((e - 0.1) / 2.0);
        for (let i = 0; i < 4; i++) { const was = M.anc[i]; M.anc[i] = smooth((e - 2.05 - [1, 0, 3, 2][i] * 0.22) / 0.3); if (was < 0.95 && M.anc[i] >= 0.95) { const a = TEND[i]; FX.H.ring(m.x + Math.cos(a) * TANCH, m.y + Math.sin(a) * TANCH, 0.2, 1.6, 0.4, CORAL_HI, 0.35); sf(FX, 'thud'); for (let k = 0; k < 5; k++) mote(FX, m.x + Math.cos(a) * TANCH, m.y + Math.sin(a) * TANCH, GOLD_HI); } }
        if (Math.random() < dt * 12 * (1 - M.rise)) mote(FX, m.x + FX.rnd(-2.5, 2.5), m.y + FX.rnd(-2.5, 2.5), CORAL_HI); }
      else { M.rise = 1; M.anc = [1, 1, 1, 1]; }
      // the ring open (staggered): it sags, the lobes part; when it closes it rights itself
      const stun = m.stunT > 0; M.stunK = toward(M.stunK, stun ? 1 : 0, dt, 3);
      if (!stun && M.wasStun) { M.wasStun = false; M.recoil = 0.8; FX.H.text(m.x, m.y - 5, 'The ring closes', CORAL_HI, 13); sf(FX, 'hum'); } else if (stun) M.wasStun = true;
      // the arcs of the ring and the floor's quadrants follow the live previews
      syncArcs(FX, m, mod, dt);
      // the weak point: the lower surface between the tendrils, under the quadrant the pet is in
      if (M.rise > 0.95 && !m.under) { const q = ((Math.round(Math.atan2(me.y - m.y, me.x - m.x) / (Math.PI / 2)) % 4) + 4) % 4, am = q * Math.PI / 2, k = stun ? 2 : 1.5; FX.weak('under', m.x + Math.cos(am) * 2.2, m.y + Math.sin(am) * 2.2, stun ? 1.6 : 1.25, k, true); M.wq = q; }
      // the pet is eased out from under its dais (it is walked round, not through)
      if (!me.dead && M.rise > 0.9) { const dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy), r0 = 1.5; if (d < r0 && d > 1e-4) FX.push(dx / d * (r0 - d), dy / d * (r0 - d)); }
      // the hush moths on the great horns: a resonator goes dark while one is settled on it
      mothTick(FX, m, dt, mod);
      // never still: coral motes rise from the crown mouths, slow and few
      if (!lowFx() && M.rise > 0.9 && Math.random() < dt * 1.6) { const i = Math.floor(Math.random() * 4), a = QAM[i]; FX.H.part({ kind: 'spark', x: m.x + Math.cos(a) * 3.0, y: m.y + Math.sin(a) * 1.2 - 0.2, vx: Math.cos(a) * 0.3, vy: -0.9, g: -0.6, life: 1.6, max: 1.6, size: 1.6, color: Math.random() < 0.6 ? CORAL_HI : BONE_HI }); }
      easePose(FX, m, dt); },
    dmgK(FX, m) { const M = FX.mem, me = FX.me; M.recoil = Math.max(M.recoil || 0, 0.5); M.recoilS = me.x < m.x ? 1 : -1; return m.stunT > 0 ? 1 : 0.6; },
    onWeakHit(FX) { const M = FX.mem; M.recoil = 1; M.recoilS = FX.me.x < FX.m.x ? 1 : -1; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { Y += (m.z || 0) * T * 4; paint(c, FX, m, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function rxOf(FX) { if (!FX || !FX.g || !(FX.S && FX.S.started) || !CH) return null; if (RXC.has(FX)) return RXC.get(FX);
    let X = null; try { const C = CH.ctx({ g: FX.g }); X = C && C.X && C.X.rift ? C.X : null; } catch (e) { X = null; } if (X) RXC.set(FX, X); return X; }
  function modOf(FX) { const RX = rxOf(FX); return RX && RX.rift && RX.rift.self ? RX.rift.self.mod : null; }
  function quadOf(FX, x, y) { const mod = modOf(FX); if (mod && mod.quadOf) return mod.quadOf(x, y); const C = FX.C; let a = Math.atan2(y - C.y, x - C.x) + Math.PI / 2; while (a < 0) a += TAU; while (a >= TAU) a -= TAU; return Math.min(3, Math.floor(a / (Math.PI / 2))); }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col || CORAL_HI, first ? 2.4 : 1.2, true); }
  function mote(FX, x, y, col) { FX.H.part({ kind: 'spark', x, y, vx: FX.rnd(-1, 1), vy: FX.rnd(-2.2, -0.6), g: 2, life: 0.8, max: 0.8, size: 2, color: col }); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function endAct(FX, m) { const M = FX.mem; m.act = 'idle'; m.actT = 0; M.A = null; M.inhaleW = 0; M.chordW = 0; M.pulseW = 0; M.restW = 0; M.allW = 0; }
  function choose(FX, m) { const M = FX.mem, lv = FX.S.lv; m.actT = 0; let a = M.nextAct; M.nextAct = null;
    if (!a) { const cyc = lv >= 3 ? CYC3 : lv >= 2 ? CYC2 : CYC1; a = cyc[M.picks++ % cyc.length]; }
    if ((a === 'dissonance' && lv < 2) || (a === 'chord' && lv < 3)) a = 'measure';
    m.act = a; if (a === 'measure' || a === 'dissonance') startMeasure(FX, m, a === 'dissonance'); else if (a === 'swell') startSwell(FX, m); else if (a === 'rest') startRest(FX, m); else if (a === 'chord') startChord(FX, m); }
  function cancelBeats(FX) { const M = FX.mem; if (M.A && M.A.beats) for (const b of M.A.beats) b.p.cancel(); }
  function resetPads(FX) { const mod = modOf(FX); if (mod && mod.pads) for (const p of mod.pads) { p.active = false; p.light(false); p.reset(); p.shelterOn = false; p.label = ''; } }
  function resetAll(FX, m) { const M = FX.mem; cancelBeats(FX); resetPads(FX); FX.S.tele.length = 0; m.act = 'idle'; m.actT = 0; M.A = null; M.inhaleW = 0; M.chordW = 0; M.pulseW = 0; M.restW = 0; M.allW = 0; m.stunT = 0; }
  function partsList(FX, m) { const M = FX.mem; if (!(M.rise > 0.6)) return []; return [{ key: 'body', dx: 0, dy: -ZC + 0.4, r: 2.8 }, { key: 'low', dx: 0, dy: -1.2, r: 1.6 }]; }
  function easePose(FX, m, dt) { const M = FX.mem;
    M.inhale = toward(M.inhale, M.inhaleW || 0, dt, M.inhaleW ? 2.2 : 5); M.chord = toward(M.chord, M.chordW || 0, dt, M.chordW ? 1.6 : 2.4); M.pulse = toward(M.pulse, M.pulseW || 0, dt, M.pulseW ? 6 : 2);
    M.rest = toward(M.rest, M.restW || 0, dt, 2); M.all = toward(M.all, M.allW || 0, dt, 3); M.open = toward(M.open, m.stunT > 0 && !m.dead ? 1 : 0, dt, m.stunT > 0 ? 2.4 : 1.6); }
  /* a quadrant's strike as a CHO beat (an annular wedge from the dais to the rim) */
  function sector(FX, m, q, o) { const C = FX.C, R = ARENA.R; return Object.assign({ shape: 'sector', x: C.x, y: C.y, r0: 0, r1: R - 0.3, a0: QA0(q), a1: QA0(q) + Math.PI / 2, dmg: m.dmg * 1.15, src: m }, o || {}); }
  function onStrike(FX, m, b, hit) { const M = FX.mem, mod = modOf(FX), C = FX.C; if (m.dead) return; const q = b.q; M.strike = 1; M.qStruck[q] = FX.g.t; if (b.echo) { M.stat.echoes++; if (hit) M.stat.echoHit++; M.shiver = 1; } else { M.stat.strikes++; if (hit) M.stat.strikeHit++; }
    M.log.push({ q, n: b.n, echo: !!b.echo, hit, t: +FX.g.t.toFixed(2) }); if (M.log.length > 40) M.log.shift();
    if (mod && mod.quads) mod.quads[q].struck = 1; const am = QAM[q]; FX.H.ring(C.x + Math.cos(am) * 9, C.y + Math.sin(am) * 9, 0.5, 7, 0.45, b.echo ? CORAL : CORAL_HI, 0.3); FX.H.shake(3, 0.12); }
  /* ---- Pulse Measure / Dissonance: three numbered quadrants strike in order; Dissonance adds an off-beat echo ---- */
  function startMeasure(FX, m, echo) { const M = FX.mem, RX = rxOf(FX), f = FX.S.fast, lv = FX.S.lv; M.stat.measures++;
    const order = shuffle([0, 1, 2, 3]).slice(0, 3), lead = (echo ? 3.0 : 3.3) / f, gap = (echo ? 1.8 : 1.5) / f, beats = [];
    M.inhaleW = 1; M.A = { kind: 'measure', t: 0, order, beats, lead, gap, end: lead + gap * 2 + 1.1 / f };
    if (RX) { const ps = CH.phrase(RX, order.map((q, i) => sector(FX, m, q, { fn: (p, hit) => onStrike(FX, m, beats[i], hit) })), { lead, gap }); ps.forEach((p, i) => beats.push({ p, q: order[i], n: i + 1, echo: false }));
      if (echo) { const k = Math.random() < 0.5 ? 0 : 1, q = order[k], t = lead + k * gap + gap * 0.5, b = { q, n: `${k + 1}'`, echo: true }; b.p = CH.beat(RX, sector(FX, m, q, { n: b.n, t, lead: t, echo: true, dmg: m.dmg, fn: (p, hit) => onStrike(FX, m, b, hit) })); beats.push(b); M.A.echo = b; } }
    if (echo) { say(FX, 'dis', 'DISSONANCE', 'One quadrant echoes off the beat (the smaller second outline): wait for it before stepping in', CORAL_HI); if (lv === 2) maybeMoths(FX, m); }
    else say(FX, 'measure', 'PULSE MEASURE', 'Three quadrants light on its ring, numbered: they strike in that order. One is never struck; a struck one is safe', CORAL_HI);
    sf(FX, 'hum'); }
  function measureTick(FX, m, dt) { const M = FX.mem, A = M.A; if (!A) return true; A.t += dt; if (A.t > A.lead - 0.35) M.inhaleW = 0; return A.t >= A.end && A.beats.every(b => b.p.fired || b.p.done); }
  /* ---- the swell: it draws in, then a ring of sound breaks round it (step back from the dais) ---- */
  function startSwell(FX, m) { const M = FX.mem, RX = rxOf(FX), C = FX.C, t = 2.1 / FX.S.fast; M.stat.swells++; M.inhaleW = 1; M.A = { kind: 'swell', t: 0, end: t + 0.9, beats: [] };
    if (RX) { const b = { q: -1, n: 1 }; b.p = CH.beat(RX, { shape: 'disc', x: C.x, y: C.y, r1: 6.2, n: 1, t, lead: t, dmg: m.dmg, src: m, label: 'IT SWELLS', fn: (p, hit) => { M.inhaleW = 0; M.strike = 1; if (hit) M.stat.swellHit++; FX.H.ring(C.x, C.y, 1.5, 6.6, 0.45, CORAL_HI, 0.4); FX.H.shake(4, 0.15); } }); M.A.beats.push(b); }
    say(FX, 'swell', 'IT SWELLS', 'A ring of sound breaks round the heart: step back off the dais', CORAL_HI); }
  function swellTick(FX, m, dt) { const M = FX.mem, A = M.A; if (!A) return true; A.t += dt; return A.t >= A.end; }
  /* ---- a rest: an empty bar; it settles low and listens (a moment to strike) ---- */
  function startRest(FX, m) { const M = FX.mem; M.restW = 1; M.A = { kind: 'rest', t: 0, end: 2.4 / FX.S.fast, beats: [] }; FX.H.text(m.x, m.y - 6.5, 'a rest', BONE_HI, 13); }
  function restTick(FX, m, dt) { const M = FX.mem, A = M.A; if (!A) return true; A.t += dt; if (A.t > A.end - 0.5) M.restW = 0; return A.t >= A.end; }
  /* ---- The Unfinished Chord: three steps, a lit pad to charge, its shelter, a sustained pulse, the ring opens ---- */
  function startChord(FX, m) { const M = FX.mem, RX = rxOf(FX), mod = modOf(FX), me = FX.me, f = FX.S.fast, C = FX.C; M.stat.chords++;
    if (!RX || !mod || !mod.pads || !mod.pads.length) { startMeasure(FX, m, true); m.act = 'dissonance'; return; }
    const pads = mod.pads.slice().sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y)), pad = pads[0], qp = pad.quad != null ? pad.quad : quadOf(FX, pad.x, pad.y);
    const others = shuffle([0, 1, 2, 3].filter(q => q !== qp)), steps = [others[0], qp, others[1]], lead = 3.6 / f, gap = 2.6 / f, T4 = lead + gap * 2 + 3.4 / f;
    for (const p of mod.pads) { p.active = p === pad; p.light(p === pad); p.reset(); p.shelterOn = false; p.label = p === pad ? 'CHARGE THE DRUM' : ''; }
    const beats = [], A = M.A = { kind: 'chord', t: 0, pad, qp, steps, lead, gap, step3T: lead + gap * 2, T4, sus: null, beats, free: others[2] };
    CH.phrase(RX, steps.map((q, i) => sector(FX, m, q, { fn: (p, hit) => onStrike(FX, m, beats[i], hit) })), { lead, gap }).forEach((p, i) => beats.push({ p, q: steps[i], n: i + 1 }));
    const b4 = { q: -1, n: 4, whole: true }; b4.p = CH.beat(RX, { shape: 'disc', x: C.x, y: C.y, r1: ARENA.R + 0.4, n: 4, t: T4, lead: T4, dmg: 0, src: m, label: 'SHELTER', fn: () => { A.sus = { t: 0, ticks: 0 }; M.pulseW = 1; sf(FX, 'crash'); } }); beats.push(b4);
    M.chordW = 1; M.allW = 1; FX.H.ring(pad.x, pad.y, 0.4, 3.2, 0.6, CORAL_HI, 0.45);
    say(FX, 'chord', 'THE UNFINISHED CHORD', 'Charge the lit drum pad during steps 1–3 (step 2 strikes its quadrant: step off and back). Stand in its shelter for step 4', CORAL_HI); sf(FX, 'hum'); }
  function chordTick(FX, m, dt) { const M = FX.mem, A = M.A, RX = rxOf(FX), me = FX.me, f = FX.S.fast; if (!A) return true; A.t += dt; const pad = A.pad;
    // the dome rises once the third step has struck (a full pad's shelter is no cover from the steps themselves)
    const domeUp = A.t >= A.step3T + 0.05; if (domeUp && !pad.shelterOn && pad.full) { pad.shelterOn = true; FX.H.text(pad.x, pad.y - 2.2, 'THE SHELTER RISES', BONE_HI, 14); sf(FX, 'chime', 660, 0.5); }
    if (!domeUp) pad.shelterOn = false;
    if (A.sus) { const S = A.sus, at = [0, 0.9, 1.8]; S.t += dt;
      while (S.ticks < at.length && S.t >= at[S.ticks]) { S.ticks++; const sh = RX && CH.sheltered(RX, me.x, me.y);
        if (!me.dead && !sh && !me.dodge) { M.stat.chordHit++; A.hitAny = true; FX.hurt(m.dmg * 0.85); } else if (sh) { M.stat.chordSafe++; A.safeAny = true; }
        FX.H.ring(m.x, m.y, 2, ARENA.R + 0.5, 0.7, CORAL_HI, 0.35); if (!lowFx()) FX.H.shake(3, 0.2); }
      if (S.t >= 2.1) { openRing(FX, m, !A.hitAny); return true; } }
    return false; }
  function openRing(FX, m, sheltered) { const M = FX.mem, f = FX.S.fast; resetPads(FX); M.pulseW = 0; M.chordW = 0; M.allW = 0; M.stat.opens++; if (sheltered) M.stat.openSheltered++;
    m.stunT = (sheltered ? 9 : 7) / f; M.recoil = 1; M.strike = 1; FX.H.flash(0.25, CORAL_HI); sf(FX, 'crash');
    FX.H.banner('THE RING BREAKS OPEN', 'Its lower surface is bare: strike under it (double damage)', GOLDL, 2.6, true, true); }
  /* ---- the hush moths: two fly to one great horn and hush it (the preview itself is never hidden) ---- */
  function maybeMoths(FX, m) { const M = FX.mem, mod = modOf(FX), C = FX.C, R = ARENA.R; if (!mod || !mod.horns) return; M.moths = M.moths.filter(x => !x.dead); if (M.moths.length || M.mothCd > 0) return;
    const h = mod.horns[Math.floor(Math.random() * 4)], am = QAM[h.i]; M.mothCd = 24; M.stat.moths += 2;
    for (let k = 0; k < 2; k++) { const tg = am + (k ? 0.06 : -0.06), mm = FX.minion('hushmoth', C.x + Math.cos(am + (k ? 0.35 : -0.35)) * (R - 4), C.y + Math.sin(am + (k ? 0.35 : -0.35)) * (R - 4), { hornTo: h, hx: C.x + Math.cos(tg) * (R - 0.7), hy: C.y + Math.sin(tg) * (R - 0.7), hk: k * 2, heartMoth: true }); M.moths.push(mm); }
    FX.H.text(C.x + Math.cos(am) * (R - 3), C.y + Math.sin(am) * (R - 3) - 1.5, 'Hush moths: they would quiet a horn', CORAL_HI, 13); }
  function mothTick(FX, m, dt, mod) { const M = FX.mem; M.mothCd = Math.max(0, M.mothCd - dt); if (!mod || !mod.horns) return; M.moths = M.moths.filter(x => !x.dead);
    for (const h of mod.horns) { const on = M.moths.some(x => x.hornTo === h && x.settled); if (on && !M.hornWas[h.i]) { M.stat.obscured++; FX.H.text(h.x - Math.cos(QAM[h.i]) * 3, h.y - Math.sin(QAM[h.i]) * 3 - 1.5, 'A horn is hushed', CORAL_HI, 13); } M.hornWas[h.i] = on; h.obscured = on; if (mod.quads) mod.quads[h.i].obscured = on; } }
  function dismissMoths(FX) { const M = FX.mem; for (const x of M.moths) if (!x.dead) { FX.H.sparks && FX.H.sparks(x.x, x.y, CORAL_HI, 8, 3); FX.H.hitMon(x, 1e9, { flat: true }); } M.moths = []; const mod = modOf(FX); if (mod && mod.horns) for (const h of mod.horns) { h.obscured = false; if (mod.quads) mod.quads[h.i].obscured = false; } }
  /* the ring's arcs (and the floor's quadrants, and the horns) follow the live previews */
  function syncArcs(FX, m, mod, dt) { const M = FX.mem, A = M.A, arcs = [null, null, null, null]; let soon = Infinity, soonQ = -1;
    if (A && A.beats) for (const b of A.beats) { const p = b.p; if (!p || p.done || p.fired || b.q < 0) continue; const f = clamp(p.t / p.lead, 0, 1), a = arcs[b.q] || (arcs[b.q] = {});
      if (b.echo) { a.en = b.n; a.ef = f; } else if (a.n == null) { a.n = b.n; a.f = f; if (p.t < soon) { soon = p.t; soonQ = b.q; } } }
    if (soonQ >= 0) arcs[soonQ].warn = 1; M.arcs = arcs;
    for (let i = 0; i < 4; i++) { M.arcLit[i] = toward(M.arcLit[i], arcs[i] ? 1 : 0, dt, 6); if (mod && mod.quads) { const q = mod.quads[i]; q.lit = 0.55 * M.arcLit[i]; q.warn = arcs[i] && arcs[i].warn ? 1 : 0; } if (mod && mod.horns) mod.horns[i].k = mod.horns[i].obscured ? 0 : 0.4 + 1.6 * M.arcLit[i] + M.all; } }
  /* ---- the fall: silence; it closes and sinks into a seed; one gentle chord lights the Rhythm Sigil ---- */
  function deadTick(FX, m, dt, mod) { const M = FX.mem;
    if (M.deadT == null) { M.deadT = 0; cancelBeats(FX); resetPads(FX); M.A = null; FX.weak('under', 0, 0, 0, 0, false); dismissMoths(FX); M.inhaleW = M.chordW = M.pulseW = M.restW = M.allW = 0; M.arcs = [null, null, null, null]; FX.S.props.push(M.rem = { kind: 'remains', x: m.x, y: m.y + 0.2 }); M.recoil = 1; }
    M.deadT += dt; const T = M.deadT;
    M.silent = smooth(T / 0.5); M.seed = smooth((T - 0.3) / 2.4); M.sink = smooth((T - 0.5) / 2.6);
    for (let i = 0; i < 4; i++) M.arcLit[i] = decay(M.arcLit[i], dt, 3);
    if (T >= 2.0 && !M.chorded) { M.chorded = true; M.chordRings = [0, -0.35, -0.7]; FX.H.text(m.x, m.y - 4.5, 'one gentle chord', GOLD_HI, 15); }
    if (M.chorded) { M.chordRings = M.chordRings.map(v => v + dt); M.sigil = T < 3.4 ? smooth((T - 2.0) / 0.6) : lerp(1, 0.62, smooth((T - 3.4) / 1.6)); } }

  /* ---------- the painting ---------- */
  function hbOf(FX, M) { if (M.hbK != null) return M.hbK; if (M.silent > 0.5) return 0; const RX = rxOf(FX); if (RX) return CH.heart(RX).k; if (lowFx()) return 0.35; return CH ? CH.heartK(M.bt || 0).k : 0.4; }
  function demoMem(FX, m) { const M = FX.mem || (FX.mem = {}); if (!M.P) { Object.assign(M, Object.assign({ bt: 2.4, rise: 1, anc: [1, 1, 1, 1], arcs: [null, null, null, null], seed: 0, sink: 0, silent: 0, sigil: 0 }, M)); if (!M.arcLit) M.arcLit = M.arcs.map(a => a ? 1 : 0); M.P = { demo: 1 }; } return M; }
  function poseOf(M, hb) { const bt = M.bt || 0, lf = lowFx(), still = 1 - (M.seed || 0), rise = M.rise == null ? 1 : M.rise;
    const bob = (lf ? 0.03 : 0.13) * Math.sin(bt * 1.05) * still, sink = M.sink || 0;
    let z = ZC + bob + 0.75 * (M.chord || 0) - 0.9 * (M.open || 0) - 0.3 * (M.rest || 0) + 0.12 * (M.inhale || 0) - (1 - rise) * (ZC + 3.6);
    z = lerp(z, RS * 0.6 + 0.05, sink);
    const sc = (1 + 0.025 * hb * still + 0.05 * (M.inhale || 0) + 0.04 * (M.pulse || 0)) * (1 - 0.4 * (M.seed || 0));
    const sq = 0.05 * (M.strike || 0) - 0.03 * (M.inhale || 0) + 0.04 * (M.recoil || 0);
    const tilt = 0.13 * (M.recoil || 0) * (M.recoilS || 1) + 0.09 * (M.open || 0) * Math.sin(bt * 0.7) + 0.06 * (M.open || 0) + 0.02 * Math.sin(bt * 0.6) * still;
    const jx = (M.shiver || 0) * 0.12 * Math.sin(bt * 47);
    return { z, sc, sx: 1 + sq, sy: 1 - sq, tilt, jx, part: 0.13 * (M.open || 0) + 0.025 * (M.strike || 0) + 0.03 * (M.pulse || 0) - 0.03 * (M.seed || 0), seed: M.seed || 0, open: M.open || 0 }; }
  function paint(c, FX, m, X, Y, T, t) { const started = FX.S && FX.S.started, M = started ? FX.mem : demoMem(FX, m);
    if (m.dead && !M.rem && started) return;
    const hb = hbOf(FX, M), P = poseOf(M, hb), lw = Math.max(1.3, T * 0.065), hx = X + P.jx * T, hy = Y - P.z * T, S = RS * T * P.sc, rise = M.rise == null ? 1 : M.rise;
    const L = (px, py) => { const x = px * S * P.sx, y = py * S * P.sy, cs = Math.cos(P.tilt), sn = Math.sin(P.tilt); return [hx + x * cs - y * sn, hy + x * sn + y * cs]; };
    const inH = f => { c.save(); c.translate(hx, hy); c.rotate(P.tilt); c.scale(P.sx * S, P.sy * S); f(); c.restore(); };
    const lwU = lw / S;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    if (!started) groundLayer(c, FX, M, X, Y, T, hb, P);
    const sunk = rise < 0.999; if (sunk) { c.save(); c.fillStyle = 'rgba(6,2,5,.85)'; c.beginPath(); c.arc(X, Y, 3.3 * T, 0, TAU); c.fill(); c.strokeStyle = rgba(GOLD, 0.7); c.lineWidth = Math.max(1.5, T * 0.12); c.stroke(); c.restore(); c.save(); c.beginPath(); c.rect(X - T * 60, Y - T * 60, T * 120, T * 60); c.arc(X, Y, 3.25 * T, 0, TAU); c.clip(); }
    // behind: the aura, the far tendril, the far crown tubes, the ring's far half, the far lobe, the core, the membrane
    inH(() => { const a = (0.16 + 0.22 * hb) * (1 - P.seed * 0.85) * (1 - (M.silent || 0) * 0.7); K.glow(c, 0, 0.05, 1.9, CORAL_D, a); });
    tendril(c, M, P, L, X, Y, T, lw, 0, hb); tendril(c, M, P, L, X, Y, T, lw, 3, hb);
    inH(() => { ringHalf(c, M, P, hb, lwU, false); lobe(c, M, P, 0, hb, lwU); core(c, M, P, hb); membrane(c, M, P, hb, lwU); });
    tendril(c, M, P, L, X, Y, T, lw, 1, hb); tendril(c, M, P, L, X, Y, T, lw, 2, hb);
    inH(() => { lobe(c, M, P, 1, hb, lwU); lobe(c, M, P, 2, hb, lwU); strings(c, M, P, hb, lwU); ringHalf(c, M, P, hb, lwU, true); });
    ringSymbols(c, M, P, L, S);
    inH(() => { crown(c, M, P, hb, lwU, [0, 3], t); collar(c, M, P, hb, lwU); crown(c, M, P, hb, lwU, [1, 2], t); arcMarks(c, M, P, hb, lwU, t); if (P.seed > 0.02) sigil(c, M, P, lwU); });
    arcBadges(c, M, P, L, S);
    if (sunk) c.restore();
    if ((M.stunK || 0) > 0.05) { const e = L(0, -1.25); for (let i = 0; i < 4; i++) { const a = (M.bt || 0) * 2.4 + i * TAU / 4; TN.twinkle(c, e[0] + Math.cos(a) * S * 0.7, e[1] + Math.sin(a) * S * 0.16, T * 0.22, i % 2 ? GOLD_HOT : CORAL_HI, 0.9 * M.stunK); } }
    c.restore(); }
  /* the ground under it: its shadow, a coral pool of its light, the four tendril sockets (on the floor layer in the fight) */
  function groundLayer(c, FX, M, X, Y, T, hb, P) { const rise = M.rise == null ? 1 : M.rise, seed = P.seed;
    K.shade(c, X, Y + T * 0.2, T * (3.4 - seed * 1.2), T * (2.9 - seed * 1.0), (0.55 + 0.15 * seed) * rise);
    const k = (0.12 + 0.2 * hb + 0.35 * (M.pulse || 0) + 0.3 * P.open) * (1 - seed * 0.9) * rise; if (k > 0.01) K.glow(c, X, Y, T * 4.6, CORAL, k);
    for (let i = 0; i < 4; i++) { const a = TEND[i], x = X + Math.cos(a) * TANCH * T, y = Y + Math.sin(a) * TANCH * T; c.save(); c.beginPath(); c.ellipse(x, y, T * 0.62, T * 0.46, 0, 0, TAU); c.fillStyle = 'rgba(8,3,6,.7)'; c.fill(); c.strokeStyle = rgba(GOLD_SH, 0.9); c.lineWidth = Math.max(1.5, T * 0.1); c.stroke(); c.strokeStyle = rgba(GOLD_HI, 0.5); c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.ellipse(x - T * 0.02, y - T * 0.03, T * 0.6, T * 0.44, 0, Math.PI * 1.05, Math.PI * 1.9); c.stroke(); c.restore(); } }
  /* an evenodd band inside a clip: the shape less itself shifted by (dx, dy) */
  function band(c, path, dx, dy, col) { c.beginPath(); path(c); c.save(); c.translate(dx, dy); path(c); c.restore(); c.fillStyle = col; c.fill('evenodd'); }
  /* a lobe: a bulb of glossy maroon in four tones (lit, body, shade, deep), a hot rim toward the light, a coral bounce
     along the bottom, seed ridges running crown to base, a crisp gloss streak */
  function lobeOf(M, P, i) { const L0 = LOBES[i], pt = P.part, dx = i === 1 ? -pt : i === 2 ? pt : 0, dy = i === 0 ? -pt * 0.8 : pt * 0.25, sw = 1 + 0.015 * Math.sin((M.bt || 0) * 1.6 + i * 2.1) * (1 - P.seed);
    return { x: L0.x * (1 - 0.15 * P.seed) + dx, y: L0.y * (1 - 0.15 * P.seed) + dy, rx: L0.rx * sw, ry: L0.ry * sw, rot: L0.rot + (i === 1 ? -1 : i === 2 ? 1 : 0) * 0.1 * P.open }; }
  function lobePts(o) { const pts = [], cs = Math.cos(o.rot), sn = Math.sin(o.rot); for (let k = 0; k < 28; k++) { const a = k / 28 * TAU, s = Math.sin(a), x = Math.cos(a) * o.rx * (1 - 0.1 * Math.max(0, s) * Math.max(0, s)), y = s * o.ry * (1 + 0.1 * Math.max(0, s)) - 0.04 * o.ry * Math.cos(2 * a); pts.push([o.x + x * cs - y * sn, o.y + x * sn + y * cs]); } return pts; }
  function lobe(c, M, P, i, hb, lw) { const o = lobeOf(M, P, i), path = TN.blob(lobePts(o)), seed = P.seed, sil = M.silent || 0;
    const col = mix(LOBE, SEED_HI, seed), hi = mix(LOBE_HI, '#3A2733', seed), sh = mix(LOBE_SH, SEED, seed), dd = mix(LOBE_D, '#070406', seed), r = Math.max(o.rx, o.ry);
    c.save(); c.beginPath(); path(c); c.fillStyle = col; c.fill(); c.save(); c.beginPath(); path(c); c.clip();
    // the form: a soft core of light high on the lit side, falling off into the body tone
    const g = c.createRadialGradient(o.x - o.rx * 0.36, o.y - o.ry * 0.4, r * 0.04, o.x - o.rx * 0.1, o.y - o.ry * 0.1, r * 1.05); g.addColorStop(0, rgba(hi, 0.95)); g.addColorStop(0.38, rgba(hi, 0.25)); g.addColorStop(0.62, rgba(col, 0)); g.addColorStop(1, rgba(sh, 0.6)); c.fillStyle = g; c.fillRect(o.x - r * 1.3, o.y - r * 1.3, r * 2.6, r * 2.6);
    // the seed ridges: deep grooves from crown to base, each with a lit lip (drawn before the shade so the shade lies over them)
    const cs = Math.cos(o.rot), sn = Math.sin(o.rot), ridge = u => { const pts = []; for (let j = 0; j <= 16; j++) { const v = -0.94 + j / 16 * 1.88, w = Math.sqrt(Math.max(0, 1 - v * v)), x = Math.sin(u) * o.rx * w, y = v * o.ry; pts.push([o.x + x * cs - y * sn, o.y + x * sn + y * cs]); } return pts; };
    const line = (pts, dx, dy, col2, w) => { c.beginPath(); pts.forEach((p, j) => j ? c.lineTo(p[0] + dx, p[1] + dy) : c.moveTo(p[0] + dx, p[1] + dy)); c.strokeStyle = col2; c.lineWidth = w; c.stroke(); };
    for (const u of i === 0 ? [-0.6, 0, 0.6] : [-0.85, -0.15, 0.6]) { const pts = ridge(u), lit = 0.5 - 0.5 * Math.sin(u + (i === 1 ? -0.3 : i === 2 ? 0.3 : 0)); line(pts, 0.012, 0.004, rgba(dd, 0.6), lw * 1.8); line(pts, -0.012, -0.006, rgba(mix(hi, LOBE_HOT, lit * 0.4), (0.25 + 0.4 * lit) * (1 - seed * 0.7)), lw * 0.9); }
    // the shade: a hard terminator band and a deep band at the far edge (four tones in all with the light and the body)
    band(c, path, LX * r * 0.34, LY * r * 0.34, rgba(sh, 0.92)); band(c, path, LX * r * 0.13, LY * r * 0.13, dd);
    // a coral bounce from the floor's glow, along the bottom edge
    const bk = (0.25 + 0.3 * hb + 0.4 * (M.pulse || 0) + 0.25 * P.open) * (1 - seed) * (1 - sil * 0.8); if (bk > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, bk); band(c, path, 0.04 * r, -0.12 * r, CORAL_D); c.globalAlpha = Math.min(1, bk) * 0.7; band(c, path, 0.02 * r, -0.04 * r, CORAL); c.restore(); }
    // pores of gold along the ring line (sparse, like a seed's eyes)
    if (seed < 0.6) { for (let k = 0; k < 6; k++) { const a = (k / 5 - 0.5) * 2.0, x = o.x + Math.sin(a) * o.rx * 0.7, y = o.y + o.ry * (0.5 + 0.05 * Math.cos(a * 3)); c.fillStyle = rgba(GOLD_D, 0.8 * (1 - seed)); c.beginPath(); c.arc(x, y, 0.016, 0, TAU); c.fill(); c.fillStyle = rgba(GOLD_HI, 0.8 * (1 - seed)); c.beginPath(); c.arc(x - 0.004, y - 0.005, 0.008, 0, TAU); c.fill(); } }
    // the hot rim toward the light
    band(c, path, -LX * r * 0.09, -LY * r * 0.09, rgba(hi, 0.9)); band(c, path, -LX * r * 0.028, -LY * r * 0.028, rgba(mix(LOBE_HOT, '#5A4A54', seed), 0.95));
    // ambient occlusion where nearer lobes overlap this one
    for (const j of i === 0 ? [1, 2] : i === 1 ? [2] : []) { const p2 = TN.blob(lobePts(lobeOf(M, P, j))); c.beginPath(); p2(c); c.strokeStyle = 'rgba(6,1,5,.55)'; c.lineWidth = 0.16; c.stroke(); c.strokeStyle = 'rgba(6,1,5,.35)'; c.lineWidth = 0.3; c.stroke(); }
    c.restore();
    c.beginPath(); path(c); c.lineWidth = lw * 1.4; c.strokeStyle = INK; c.stroke();
    if (K.Q.flash > 0) { c.beginPath(); path(c); c.fillStyle = 'rgba(255,240,245,.14)'; c.fill(); }
    // the gloss: a long soft sheen, a crisp streak and a dot
    const ga = (0.6 + 0.25 * (1 - seed)) * (1 - seed * 0.55); c.save(); c.translate(o.x - o.rx * 0.4, o.y - o.ry * 0.42); c.rotate(-0.85 + o.rot);
    c.fillStyle = `rgba(255,236,246,${ga * 0.25})`; c.beginPath(); c.ellipse(0, r * 0.02, r * 0.34, r * 0.13, 0, 0, TAU); c.fill();
    c.fillStyle = `rgba(255,240,248,${ga})`; c.beginPath(); c.ellipse(0, 0, r * 0.21, r * 0.055, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(r * 0.31, r * 0.07, r * 0.028, 0, TAU); c.fill(); c.restore();
    c.restore(); }
  /* the coral inside: seen through the parted lobes and the ring's gaps */
  function core(c, M, P, hb) { const k = (0.3 + 0.7 * hb) * (1 - (M.silent || 0)) + P.open + (M.pulse || 0); if (P.seed > 0.95) return;
    const g = c.createRadialGradient(0, 0.05, 0.02, 0, 0.05, 0.75); g.addColorStop(0, mix(CORAL_HOT, CORAL_DD, 1 - Math.min(1, k))); g.addColorStop(0.4, mix(CORAL, CORAL_DD, 1 - Math.min(1, k * 0.8))); g.addColorStop(1, CORAL_DD); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0.05, 0.72, 0.78, 0, 0, TAU); c.fill(); }
  /* the lower surface: a taut listening membrane between the tendrils (the weak point), rings of it trembling on the beat */
  function membrane(c, M, P, hb, lw) { const seed = P.seed; if (seed > 0.9) return; const cy = 0.84 + P.part * 0.4 + 0.05 * P.open, rx = 0.52 * (1 - seed), ry = 0.27 * (1 - seed) + 0.06 * P.open, open = P.open, bt = M.bt || 0;
    const path = TN.ell(0, cy, rx, ry), r = rx; TN.shape(c, path, { col: mix(MEM, CORAL_D, open * 0.5), shade: MEM_SH, shade2: MEM_D, hi: mix(MEM_HI, CORAL_HI, open * 0.6), line: INK, lw: lw * 1.1, r, d1: 0.12, d2: 0.2, force: true, spec: 0.5, specAt: [-rx * 0.35, cy - ry * 0.35], specR: 0.14,
      inner: g => { for (let k = 1; k <= 5; k++) { const v = 1 + 0.035 * hb * Math.sin(bt * 9 - k) * (1 - seed), s = k / 5.6 * v; g.beginPath(); g.ellipse(0, cy + ry * 0.12 * (1 - s), rx * s, ry * s, 0, 0, TAU); g.strokeStyle = k % 2 ? rgba(MEM_D, 0.5) : rgba(MEM_HI, 0.35); g.lineWidth = lw * 0.7; g.stroke(); }
        g.fillStyle = rgba(BONE_HI, 0.55); g.beginPath(); g.ellipse(0, cy + ry * 0.12, rx * 0.08, ry * 0.12, 0, 0, TAU); g.fill();
        const gk = 0.2 * hb + 0.9 * open + 0.4 * (M.pulse || 0); if (gk > 0.02) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, gk); const gr = g.createRadialGradient(0, cy, 0, 0, cy, rx); gr.addColorStop(0, rgba(CORAL_HOT, 0.7)); gr.addColorStop(1, rgba(CORAL, 0)); g.fillStyle = gr; g.fillRect(-rx, cy - ry, rx * 2, ry * 2); g.restore(); } } }); }
  /* a tendril: from under the heart to its socket on the floor: a tapered maroon tube with bone rings and a gold-capped root
     claw; anchoring, it reaches down from a loose dangle; dying, it draws back up */
  function tendril(c, M, P, L, X, Y, T, lw, i, hb) { const anc = (M.anc || [1, 1, 1, 1])[i], seed = P.seed, bt = M.bt || 0, rt = TROOT[i], sx = rt[0] < 0 ? -1 : 1, r0 = L(rt[0] * (1 + P.part * 0.4), rt[1] + P.part * 0.3);
    const a = TEND[i], fx = X + Math.cos(a) * TANCH * T, fy = Y + Math.sin(a) * TANCH * T, loose = [r0[0] + sx * T * 0.9 + Math.sin(bt * 2 + i) * T * 0.35, r0[1] + T * 1.7], k = smooth(anc) * (1 - smooth(seed * 1.15));
    if (seed > 0.98) return;
    const end = [lerp(loose[0], fx, k), lerp(loose[1], fy, k)], tight = (M.chord || 0) * 0.6, sway = Math.sin(bt * 1.2 + i * 1.9) * T * 0.12 * (1 - seed);
    // a leg-like curve: out from under the lobe, a knee bowed outward and up, down to its root claw
    const front = rt[1] > 0.55, c1 = [r0[0] + sx * T * (front ? 1.6 : 1.4) * (1 - tight * 0.5) + sway, r0[1] + T * (front ? 0.2 : -0.1)], c2 = [end[0] + sx * T * (0.7 + 0.5 * P.open) * (1 - tight) + sway, end[1] - T * (front ? 1.7 : 1.2) * (1 - tight * 0.4)];
    const pts = []; for (let j = 0; j <= 12; j++) { const u = j / 12, v = 1 - u, b0 = v * v * v, b1 = 3 * v * v * u, b2 = 3 * v * u * u, b3 = u * u * u; pts.push([b0 * r0[0] + b1 * c1[0] + b2 * c2[0] + b3 * end[0], b0 * r0[1] + b1 * c1[1] + b2 * c2[1] + b3 * end[1]]); }
    const w0 = T * 0.82 * (1 - seed * 0.5), w1 = T * 0.36 * (1 - seed * 0.5), wf = u => lerp(w0, w1, Math.pow(u, 0.8)) * (1 + 0.12 * Math.sin(u * Math.PI));
    TN.tubeLite(c, pts, wf, { col: mix(LOBE, SEED_HI, seed), shade: LOBE_SH, shade2: LOBE_D, hi: mix(LOBE_HI, SEED_HI, seed), line: INK, lw: lw * 1.1, force: true, glowCol: CORAL_D, glowA: 0.35 * (1 - seed) });
    // a gloss streak down its lit side
    c.save(); c.strokeStyle = rgba(LOBE_HOT, 0.45 * (1 - seed)); c.lineWidth = Math.max(1, T * 0.06); c.beginPath(); for (let j = 1; j <= 6; j++) { const p = pts[j], q = pts[j + 1], dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy) || 1, w = wf(j / 12) * 0.28, nx = dy / dl * w * -sx, ny = -dx / dl * w * -sx; j === 1 ? c.moveTo(p[0] + nx - T * 0.05, p[1] + ny - T * 0.06) : c.lineTo(p[0] + nx - T * 0.05, p[1] + ny - T * 0.06); } c.stroke(); c.restore();
    // bone rings round it, each a raised band with a lit lip
    for (const u of [0.28, 0.5, 0.7]) { const j = u * 12, j0 = Math.floor(j), e = j - j0, p = [lerp(pts[j0][0], pts[j0 + 1][0], e), lerp(pts[j0][1], pts[j0 + 1][1], e)], q = pts[j0 + 1], tx = q[0] - pts[j0][0], ty = q[1] - pts[j0][1], tl = Math.hypot(tx, ty) || 1, w = wf(u) * 0.55, px = -ty / tl * w, py = tx / tl * w;
      const arc = () => { c.beginPath(); c.moveTo(p[0] - px, p[1] - py); c.quadraticCurveTo(p[0] + tx / tl * w * 0.45, p[1] + ty / tl * w * 0.45, p[0] + px, p[1] + py); };
      arc(); c.strokeStyle = INK; c.lineWidth = T * 0.2 + lw * 1.2; c.stroke(); arc(); c.strokeStyle = mix(BONE_SH, '#3A3029', seed); c.lineWidth = T * 0.2; c.stroke(); c.save(); c.translate(-tx / tl * T * 0.03, -ty / tl * T * 0.03 - T * 0.02); arc(); c.strokeStyle = mix(BONE_HI, '#4A4036', seed); c.lineWidth = T * 0.08; c.stroke(); c.restore(); }
    // the root claw on its socket: three short splayed bone toes under a gold cap
    if (k > 0.6) { const ex = end[0], ey = end[1]; for (const s of [-1, 0, 1]) { const aa = Math.PI / 2 + s * 1.05 + sx * 0.2, tx = ex + Math.cos(aa) * T * 0.72, ty = ey + Math.sin(aa) * T * 0.34 + T * 0.06, nx = -Math.sin(aa) * T * 0.15, ny = Math.cos(aa) * T * 0.08;
        TN.shape(c, TN.poly([[ex - nx, ey - ny], [tx, ty], [ex + nx, ey + ny]]), { col: BONE, shade: BONE_SH, shade2: BONE_D, hi: BONE_HI, line: INK, lw: lw * 0.75, r: T * 0.25, force: true, spec: false }); }
      TN.shape(c, TN.ell(ex, ey - T * 0.08, T * 0.4, T * 0.26), { col: GOLD, shade: GOLD_SH, shade2: GOLD_D, hi: GOLD_HI, line: INK, lw: lw * 0.85, r: T * 0.4, force: true, spec: 0.75, specAt: [ex - T * 0.14, ey - T * 0.18], specR: 0.25 });
      if (hb > 0.5 && !(M.silent > 0.5)) K.glow(c, ex, ey, T * 1.0, CORAL_HI, 0.3 * (hb - 0.5)); } }
  /* the crown's collar: a gold socket where the three lobes meet, four bone tubes rising out of it */
  function collar(c, M, P, hb, lw) { const seed = P.seed, x = APEX[0], y = APEX[1] + seed * 0.1, g = s => mix(s, '#2A2016', seed * 0.85);
    TN.shape(c, TN.ell(x, y + 0.035, 0.27, 0.115), { col: g(GOLD_SH), shade: g(GOLD_D), hi: false, line: INK, lw, r: 0.2, force: true, spec: false });
    TN.shape(c, TN.ell(x, y, 0.25, 0.095), { col: g(GOLD), shade: g(GOLD_SH), shade2: g(GOLD_D), hi: g(GOLD_HOT), line: INK, lw, r: 0.25, d1: 0.1, d2: 0.18, force: true, spec: seed < 0.5 ? 0.6 : false, specAt: [x - 0.12, y - 0.04], specR: 0.18 });
    c.fillStyle = '#1A0812'; c.beginPath(); c.ellipse(x, y - 0.005, 0.17, 0.055, 0, 0, TAU); c.fill(); if (hb > 0.05 && seed < 0.5) K.glow(c, x, y, 0.3, CORAL_HI, 0.25 * hb * (1 - (M.silent || 0)));
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.2, px = x + Math.cos(a) * 0.215, py = y + Math.sin(a) * 0.08; if (Math.sin(a) < -0.2) continue; c.fillStyle = g(GOLD_D); c.beginPath(); c.arc(px, py, 0.016, 0, TAU); c.fill(); c.fillStyle = g(GOLD_HOT); c.beginPath(); c.arc(px - 0.004, py - 0.005, 0.007, 0, TAU); c.fill(); } }
  /* three gold strings down the seam between the front lobes, from the collar to the membrane, like a lyre's: they
     tremble on every beat (the heart's own instrument) */
  function strings(c, M, P, hb, lw) { const seed = P.seed; if (seed > 0.8) return; const bt = M.bt || 0, y0 = APEX[1] + 0.12, y1 = 0.62 + P.part * 0.4, a = (1 - seed) * (1 - (M.silent || 0) * 0.7);
    for (const k of [-1, 0, 1]) { const x0 = k * 0.05, x1 = k * 0.1, amp = (0.008 + 0.022 * hb + 0.03 * (M.strike || 0)) * (1 - seed); c.beginPath(); for (let j = 0; j <= 14; j++) { const u = j / 14, x = lerp(x0, x1, u) + Math.sin(u * Math.PI) * amp * Math.sin(bt * 40 + k * 2), y = lerp(y0, y1, u) + Math.sin(u * Math.PI) * 0.04; j ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.strokeStyle = rgba(INK, 0.8 * a); c.lineWidth = lw * 1.6; c.stroke(); c.strokeStyle = rgba(GOLD_HI, 0.9 * a); c.lineWidth = lw * 0.75; c.stroke(); }
    for (const [x, y] of [[0, y0], [0, y1]]) { TN.shape(c, TN.ell(x, y, 0.13, 0.05), { col: BONE, shade: BONE_SH, shade2: BONE_D, hi: BONE_HI, line: INK, lw, r: 0.12, force: true, spec: false, alpha: a }); for (const k of [-1, 0, 1]) { c.fillStyle = rgba(GOLD_HI, a); c.beginPath(); c.arc(x + k * (y === y0 ? 0.05 : 0.1), y, 0.014, 0, TAU); c.fill(); } } }
  /* the crown: four bone tubes from its top, one over each quadrant, curving out like horns, gold banded, each ending in a
     flared mouth that breathes coral with the beat (and blazes with its quadrant's preview) */
  function crownPts(M, P, i, t) { const a = QAM[i], ca = Math.cos(a), sa = Math.sin(a), seed = P.seed, sp = (1 + 0.22 * (M.inhale || 0) + 0.45 * (M.chord || 0) + 0.2 * P.open) * (1 - 0.55 * seed), lift = 0.18 * (M.inhale || 0) + 0.3 * (M.chord || 0) - 0.15 * P.open;
    const sw = Math.sin((M.bt || 0) * 0.9 + i * 1.7) * 0.025 * (1 - seed), bx = APEX[0] + ca * 0.17, by = APEX[1] + sa * 0.06 + seed * 0.1;
    const back = sa < 0, up = back ? 1.3 : 0.62, wd = back ? 0.82 : 1.22, K0 = [[bx, by], [bx + ca * 0.1, by - 0.3 * up - lift * 0.5], [bx + ca * 0.42 * sp * wd, by - 0.62 * up - lift + sa * 0.08], [bx + ca * 0.8 * sp * wd + sw, by - 0.58 * up - lift * 0.8 + sa * 0.2], [bx + ca * 1.04 * sp * wd + sw, by - 0.3 * up - lift * 0.4 + sa * 0.34 + seed * 0.4]];
    if (seed > 0) { const tip = [ca * 0.12, -0.92]; K0[3] = [lerp(K0[3][0], tip[0] + ca * 0.25, seed), lerp(K0[3][1], -1.0, seed)]; K0[4] = [lerp(K0[4][0], tip[0], seed), lerp(K0[4][1], tip[1], seed)]; }
    const out = []; for (let s = 0; s < K0.length - 1; s++) { const p0 = K0[Math.max(0, s - 1)], p1 = K0[s], p2 = K0[s + 1], p3 = K0[Math.min(K0.length - 1, s + 2)]; for (let j = 0; j < 4; j++) { const u = j / 4, u2 = u * u, u3 = u2 * u; out.push([0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3))); } }
    out.push(K0[K0.length - 1]); return out; }
  function crown(c, M, P, hb, lw, list, t) { const seed = P.seed;
    for (const i of list) { const pts = crownPts(M, P, i, t), N = pts.length - 1, wf = u => (0.22 - 0.12 * Math.sqrt(u) + 0.05 * Math.pow(u, 8)) * (1 - seed * 0.25), lit = (M.arcLit || [])[i] || 0, sil = M.silent || 0;
      const bone = { col: mix(BONE, '#3A3029', seed), shade: mix(BONE_SH, '#2A221E', seed), shade2: mix(BONE_D, '#1E1814', seed), hi: mix(BONE_HI, '#4E4438', seed), line: INK, lw, force: true };
      TN.tubeLite(c, pts, wf, bone);
      // growth rings across it, and two gold bands
      for (let j = 2; j < N - 1; j += 2) { const p = pts[j], q = pts[j + 1], dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy) || 1, w = wf(j / N) * 0.47, px = -dy / dl * w, py = dx / dl * w; c.beginPath(); c.moveTo(p[0] - px, p[1] - py); c.quadraticCurveTo(p[0] + dx / dl * w * 0.3, p[1] + dy / dl * w * 0.3, p[0] + px, p[1] + py); c.strokeStyle = rgba('#5A4A36', 0.45); c.lineWidth = lw * 0.6; c.stroke(); }
      for (const j of [3, 10]) { const p = pts[j], q = pts[j + 1], dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy) || 1, w = wf(j / N) * 0.56, px = -dy / dl * w, py = dx / dl * w; c.beginPath(); c.moveTo(p[0] - px, p[1] - py); c.lineTo(p[0] + px, p[1] + py); c.strokeStyle = INK; c.lineWidth = 0.075 + lw * 1.4; c.stroke(); c.strokeStyle = mix(GOLD, GOLD_D, seed); c.lineWidth = 0.075; c.stroke(); c.strokeStyle = rgba(GOLD_HOT, 0.8 * (1 - seed)); c.lineWidth = 0.018; c.beginPath(); c.moveTo(p[0] - px * 0.8 - 0.01, p[1] - py * 0.8 - 0.012); c.lineTo(p[0] + px * 0.1 - 0.01, p[1] + py * 0.1 - 0.012); c.stroke(); }
      // the mouth: a flared bell facing along its end, coral breathing in it
      const e = pts[N], f = pts[N - 2], ma = Math.atan2(e[1] - f[1], e[0] - f[0]), mr = 0.21 * (1 - seed * 0.5), k = clamp((0.15 + 0.45 * hb + 0.6 * lit + 0.5 * (M.all || 0) + 0.6 * (M.pulse || 0)) * (1 - sil), 0, 1);
      if (CH) CH.mouth(c, e[0], e[1], mr * 0.45, mr, ma, k, { lw: lw * 0.9, lip: mix(BONE, '#3A3029', seed) });
      if (k > 0.05) K.glow(c, e[0] + Math.cos(ma) * 0.05, e[1] + Math.sin(ma) * 0.05, 0.45 + 0.3 * lit, CORAL_HI, 0.18 + 0.4 * k * (0.4 + lit)); } }
  /* the ring: tarnished gold set round its middle, a band of bevelled plates (each lit by which way it faces), rivets,
     a medallion with its quadrant's symbol over each quadrant, broken in two places where the coral shows */
  function ringPt(th, dy, P, M, k) { const op = P.open, inFront = th > GAPS[0] + GW && th < GAPS[1] - GW; const rx = RING.rx * (1 + 0.04 * (M.inhale || 0)) * (k || 1), ry = RING.ry * (k ? k * 0.9 : 1);
    let x = Math.cos(th) * rx, y = RING.y + Math.sin(th) * ry + dy; if (inFront && op > 0) { const u = (th - GAPS[0]) / (GAPS[1] - GAPS[0]); x *= 1 + 0.07 * op; y += op * (0.16 + 0.06 * Math.sin(u * Math.PI)); } return [x, y]; }
  function ringHalf(c, M, P, hb, lw, front) { const seed = P.seed, h = RING.h, th0 = front ? 0 : Math.PI, th1 = front ? Math.PI : TAU, N = 14, gk = clamp((0.4 + 0.6 * hb) * (1 - (M.silent || 0)) + 0.8 * P.open + (M.pulse || 0), 0, 1.6);
    const gold = s => mix(s, seed > 0 ? '#2A2016' : s, seed * 0.85), inGap = th => { for (const g of GAPS) { let d = Math.abs(((th - g) % TAU + TAU + Math.PI) % TAU - Math.PI); if (d < GW) return true; } return false; };
    // the plates
    for (let k = 0; k < N; k++) { const a0 = th0 + (th1 - th0) * k / N, a1 = th0 + (th1 - th0) * (k + 1) / N, am = (a0 + a1) / 2; if (inGap(am)) continue;
      let b0 = a0, b1 = a1; for (const g of GAPS) { const lo = g - GW, hi = g + GW; if (b1 <= lo || b0 >= hi) continue; if (b0 < lo) b1 = Math.min(b1, lo); else b0 = Math.max(b0, hi); }
      const top = [], bot = []; for (let j = 0; j <= 3; j++) { const th = lerp(b0, b1, j / 3); top.push(ringPt(th, -h / 2, P, M)); bot.push(ringPt(th, h / 2, P, M)); }
      const f = Math.cos(am - THL) * (front ? 1 : 0.5) - (front ? 0 : 0.35), tone = f > 0.55 ? GOLD_HI : f > 0.1 ? GOLD : f > -0.4 ? GOLD_SH : GOLD_D;
      // its top face (the ring's thickness, seen from above): lit from overhead
      if (front) { const inn = []; for (let j = 0; j <= 3; j++) inn.push(ringPt(lerp(b0, b1, j / 3), -h / 2, P, M, 0.93)); c.beginPath(); top.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let j = 3; j >= 0; j--) c.lineTo(inn[j][0], inn[j][1]); c.closePath(); c.fillStyle = gold(f > -0.2 ? GOLD_HOT : GOLD_HI); c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.stroke(); }
      c.beginPath(); top.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let j = 3; j >= 0; j--) c.lineTo(bot[j][0], bot[j][1]); c.closePath(); c.fillStyle = gold(tone); c.fill();
      // the bevels: a lit lip along the top, a dark one along the bottom; tarnish in the hollows
      c.save(); c.clip(); c.beginPath(); top.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = gold(f > 0.1 ? GOLD_HOT : GOLD_HI); c.lineWidth = h * 0.42; c.stroke();
      c.beginPath(); bot.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = gold(f > 0.1 ? GOLD_SH : GOLD_D); c.lineWidth = h * 0.5; c.stroke();
      const R = mulberry32(31 + k * 7 + (front ? 0 : 99)); for (let s = 0; s < 2; s++) { const u = R(), v = R(), p = [lerp(top[1][0], top[2][0], u), lerp(top[1][1], bot[1][1], 0.35 + v * 0.4)]; c.fillStyle = rgba(TARN, 0.35 + R() * 0.25); c.beginPath(); c.ellipse(p[0], p[1], 0.03 + R() * 0.03, 0.018 + R() * 0.015, R() * 3, 0, TAU); c.fill(); }
      c.restore();
      // seams and rivets
      c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(top[0][0], top[0][1]); c.lineTo(bot[0][0], bot[0][1]); c.stroke();
      if (front || Math.abs(Math.cos(am)) > 0.75) for (const dy of [-0.3, 0.3]) { const p = ringPt(b0 + 0.06, dy * h, P, M); c.fillStyle = gold(GOLD_D); c.beginPath(); c.arc(p[0], p[1], 0.016, 0, TAU); c.fill(); c.fillStyle = gold(GOLD_HOT); c.beginPath(); c.arc(p[0] - 0.005, p[1] - 0.006, 0.007, 0, TAU); c.fill(); } }
    // its edges in ink, and the occlusion where the lobes overhang it
    const edge = (dy, s0, s1) => { c.beginPath(); for (let j = 0; j <= 30; j++) { const th = lerp(s0, s1, j / 30); const p = ringPt(th, dy, P, M); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } };
    const spans = []; let s = th0; for (const g of GAPS.slice().sort((a, b) => a - b)) { if (g > th0 && g < th1) { spans.push([s, g - GW]); s = g + GW; } } spans.push([s, th1]);
    for (const [a, b2] of spans) { if (front) { edge(h / 2 + 0.03, a, b2); c.strokeStyle = 'rgba(8,2,6,.4)'; c.lineWidth = 0.06; c.stroke(); } edge(-h / 2, a, b2); c.strokeStyle = INK; c.lineWidth = lw * 1.1; c.stroke(); edge(h / 2, a, b2); c.stroke(); if (front) { edge(-h / 2 - 0.02, a, b2); c.strokeStyle = rgba(LOBE_HOT, 0.35 * (1 - seed)); c.lineWidth = lw * 0.8; c.stroke(); } }
    // the medallions with the quadrants' symbols (only those that face us are painted on the near half)
    if (front) for (let q = 0; q < 4; q++) { const am = QAM[q]; if (Math.sin(am) < 0.2) continue; const p = ringPt(am, 0, P, M), r = h * 0.72;
      TN.shape(c, TN.ell(p[0], p[1], r, r * 0.92), { col: gold(GOLD), shade: gold(GOLD_SH), shade2: gold(GOLD_D), hi: gold(GOLD_HOT), line: INK, lw, r, d1: 0.14, d2: 0.22, force: true, spec: seed < 0.5 ? 0.7 : false, specAt: [p[0] - r * 0.4, p[1] - r * 0.45], specR: 0.25 }); }
    // the gaps: broken ends, the coral inside glowing on the beat
    for (const g of GAPS) { const inside = Math.sin(g) > 0; if (inside !== front) continue; const w = GW * (1 + 0.5 * P.open), a = ringPt(g - w, -h / 2, P, M), b2 = ringPt(g + w, -h / 2, P, M), cc = ringPt(g + w, h / 2, P, M), d = ringPt(g - w, h / 2, P, M), m0 = ringPt(g, 0, P, M);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(lerp(a[0], b2[0], 0.3), a[1] + h * 0.18); c.lineTo(lerp(a[0], b2[0], 0.55), a[1] - h * 0.05); c.lineTo(b2[0], b2[1]); c.lineTo(lerp(b2[0], cc[0], 0.5) + 0.01, lerp(b2[1], cc[1], 0.5)); c.lineTo(cc[0], cc[1]); c.lineTo(lerp(cc[0], d[0], 0.4), cc[1] - h * 0.14); c.lineTo(d[0], d[1]); c.lineTo(lerp(d[0], a[0], 0.5) - 0.01, lerp(d[1], a[1], 0.5)); c.closePath();
      const gg = c.createRadialGradient(m0[0], m0[1], 0, m0[0], m0[1], h * 1.1); gg.addColorStop(0, mix(CORAL_DD, CORAL_HOT, Math.min(1, gk))); gg.addColorStop(0.5, mix(CORAL_DD, CORAL, Math.min(1, gk))); gg.addColorStop(1, '#1A0710'); c.fillStyle = seed > 0.5 ? '#0A0408' : gg; c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 1.1; c.stroke();
      // the bevelled cross-section of each broken end
      for (const [p, q, sg] of [[a, d, -1], [b2, cc, 1]]) { c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + sg * 0.025, p[1] + 0.02); c.lineTo(q[0] + sg * 0.025, q[1] - 0.02); c.lineTo(q[0], q[1]); c.closePath(); c.fillStyle = gold(sg < 0 ? GOLD_SH : GOLD_HI); c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.6; c.stroke(); }
      if (gk > 0.05 && seed < 0.6) { K.glow(c, m0[0], m0[1], 0.4 + 0.3 * gk, CORAL_HI, 0.35 + 0.4 * Math.min(1, gk)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * Math.min(1, gk); c.fillStyle = CORAL_HOT; c.beginPath(); c.ellipse(m0[0], m0[1], w * 0.55, h * 0.22, 0, 0, TAU); c.fill(); c.restore(); } } }
  /* the previews on the ring: each lit quadrant's arc glows (warning red when it is next), numbered outside the ring; an
     echo adds a smaller second outline and its own badge; the chord lights the whole ring gold */
  function arcPath(c, q, P, M, inset) { const a0 = QA0(q) + 0.04, a1 = QA0(q) + Math.PI / 2 - 0.04, h = RING.h * (1 - inset * 2), front = []; for (let j = 0; j <= 16; j++) { const th = lerp(a0, a1, j / 16); front.push(ringPt(th, -h / 2, P, M)); } for (let j = 16; j >= 0; j--) { const th = lerp(a0, a1, j / 16); front.push(ringPt(th, h / 2, P, M)); } c.beginPath(); front.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); }
  function arcMarks(c, M, P, hb, lw, t) { const arcs = M.arcs || [], lit = M.arcLit || [0, 0, 0, 0], all = M.all || 0;
    for (let q = 0; q < 4; q++) { const A = arcs[q], k = Math.max(lit[q], all * 0.8); if (k < 0.02) continue; const front = Math.sin(QAM[q]) > 0, col = A && A.warn ? WARN : all > 0.5 && !A ? GOLD_HOT : CORAL_HI;
      // the arc itself lies over the near half's plates; a far arc's light spills out round the silhouette at its side
      if (front) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * k; arcPath(c, q, P, M, 0); c.fillStyle = col; c.fill(); c.restore(); arcPath(c, q, P, M, 0); c.strokeStyle = rgba(col, 0.9 * k); c.lineWidth = lw * (A && A.warn ? 2.2 : 1.4); c.stroke();
        if (A && A.en != null) { arcPath(c, q, P, M, 0.22); c.setLineDash([0.04, 0.035]); c.strokeStyle = rgba(CORAL_HOT, 0.95 * k); c.lineWidth = lw * 1.1; c.stroke(); c.setLineDash([]); } }
      else { const sx = Math.cos(QAM[q]) > 0 ? 1 : -1; for (const u of [0.25, 0.5, 0.75]) { const th = QA0(q) + Math.PI / 2 * u, p = ringPt(th, 0, P, M); K.glow(c, sx * Math.max(Math.abs(p[0]), 0.95), p[1] - 0.06, 0.32, col, 0.5 * k * (sx * Math.cos(th) > 0.4 ? 1 : 0.5)); } } } }
  /* the badges (in screen space): a big number outside the ring at each lit quadrant, raised over the shoulders for the
     far ones; an echo's smaller badge with its second outline beside it; the chord's fourth step over the crown */
  function arcBadges(c, M, P, L, S) { const arcs = M.arcs || [], all = M.all || 0; if (!CH) return;
    for (let q = 0; q < 4; q++) { const A = arcs[q]; if (!A) continue; const am = QAM[q], far = Math.sin(am) < 0, b = L(Math.cos(am) * (RING.rx + 0.3), RING.y + Math.sin(am) * (RING.ry + 0.32) - (far ? 0.5 : -0.05)), s = S * (A.warn ? 0.34 : 0.28);
      if (A.n != null) CH.badge(c, b[0], b[1], s, A.n, A.f, A.warn ? WARN : rgba(WARN, 0.75));
      if (A.en != null) { const e = [b[0] + Math.cos(am) * S * 0.3, b[1] + (far ? -0.22 : 0.24) * S]; CH.badge(c, e[0], e[1], s * 0.68, A.en, A.ef, CORAL_HI); c.save(); c.strokeStyle = rgba(CORAL_HOT, 0.9); c.lineWidth = 1.5; c.beginPath(); c.arc(e[0], e[1], s * 0.44, 0, TAU); c.stroke(); c.restore(); } }
    if (all > 0.3 && !arcs.some(a => a)) { const b = L(0, -1.6); CH.badge(c, b[0], b[1], S * 0.36, 4, null, GOLD_HI); } }
  /* the quadrants' symbols on the near medallions (in screen space: embossed, a dark cut and a lit ridge) */
  function ringSymbols(c, M, P, L, S) { if (!CH) return; const seed = P.seed, r = RING.h * 0.72 * S;
    for (let q = 0; q < 4; q++) { const am = QAM[q]; if (Math.sin(am) < 0.2) continue; const p0 = ringPt(am, 0, P, M), p = L(p0[0], p0[1]);
      CH.symbol(c, p[0] + r * 0.06, p[1] + r * 0.07, r * 1.25, QSYM[q], rgba(GOLD_D, 0.9), Math.max(1, r * 0.13)); CH.symbol(c, p[0] - r * 0.03, p[1] - r * 0.03, r * 1.25, QSYM[q], rgba(GOLD_HOT, 0.75 * (1 - seed)), Math.max(0.8, r * 0.08)); } }
  /* the Rhythm Sigil on the seed: a gold ring round a beating line and four beat-dots, lit by the last chord */
  function sigil(c, M, P, lw) { const k = (M.sigil || 0) * smooth(P.seed), r = 0.42; if (k < 0.01) return; c.save(); c.translate(0, 0.08);
    const line = (col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(-r * 0.86, 0); c.lineTo(-r * 0.38, 0); c.lineTo(-r * 0.22, -r * 0.42); c.lineTo(-r * 0.02, r * 0.5); c.lineTo(r * 0.16, -r * 0.62); c.lineTo(r * 0.32, 0); c.lineTo(r * 0.86, 0); c.stroke(); for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + i * Math.PI / 2; c.beginPath(); c.arc(Math.cos(a) * r * 1.22, Math.sin(a) * r * 1.22, w * 0.9, 0, TAU); c.fillStyle = col; c.fill(); } };
    line(rgba(GOLD_D, 0.8 * k), 0.07); c.save(); c.globalCompositeOperation = 'lighter'; line(rgba(GOLD_HI, 0.85 * k), 0.035); c.restore(); K.glow(c, 0, 0, 0.9, GOLD_HI, 0.35 * k * k); c.restore(); }

  /* ---------- the ground layer (under everything that stands): its shadow and light, sockets ---------- */
  function drawOverlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !M.P || !m) return; const hb = hbOf(FX, M), P = poseOf(M, hb); c.save(); groundLayer(c, FX, M, FX.sx(m.x), FX.sy(m.y), T, hb, P); c.restore(); }
  /* ---------- over everything: the weak point's call, the chord's countdown and its pad, the pulse, horn numbers ---------- */
  function cdLabel(c, s, x, y, T, col, sz) { c.save(); c.font = `900 ${Math.max(11, Math.round(sz || T * 0.5))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(10,4,8,.85)'; c.strokeText(s, x, y); c.fillStyle = col || '#FFFFFF'; c.fillText(s, x, y); c.restore(); }
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M.P) return; const mod = modOf(FX), C = FX.C; c.save();
    // the weak point
    const w = FX.S.weak.under; if (w && !w.dead && !m.dead) { const X = FX.sx(w.x), Y = FX.sy(w.y), pu = 0.5 + 0.5 * Math.sin(t * 6), open = m.stunT > 0; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = open ? GOLDL : CORAL_HI; c.globalAlpha = (open ? 0.6 : 0.3) + 0.3 * pu; c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.arc(X, Y, T * (w.r + 0.15 + pu * 0.12), 0, TAU); c.stroke(); c.restore();
      if (open) cdLabel(c, `RING OPEN · LOWER SURFACE ×2 · ${Math.ceil(m.stunT)}`, X, Y + T * (w.r + 0.8), T, GOLDL, T * 0.42); else if (!M.seen.weakTold || M.bt % 12 < 3) { M.seen.weakTold = true; cdLabel(c, 'LOWER SURFACE ×1.5', X, Y + T * (w.r + 0.7), T, CORAL_HI, T * 0.34); } }
    // the horns: each lit quadrant's number on its resonator (unless a moth has hushed it)
    if (mod && mod.horns) for (const h of mod.horns) { const A = (M.arcs || [])[h.i]; if (!A || A.n == null || h.obscured) continue; const am = QAM[h.i], X = FX.sx(h.x - Math.cos(am) * 1.6), Y = FX.sy(h.y - Math.sin(am) * 1.6) - T * 2.4; if (CH) CH.badge(c, X, Y, T * 0.62, A.n, A.f, A.warn ? WARN : rgba(WARN, 0.7)); }
    // the chord: the lit pad called out with the step it must be charged by; the sustained pulse breaking over the bowl
    const A = M.A; if (A && A.kind === 'chord') { const pad = A.pad, X = FX.sx(pad.x), Y = FX.sy(pad.y), bob = Math.abs(Math.sin(t * 4)) * T * 0.25, left = Math.max(0, A.T4 - A.t);
      if (!A.sus) { c.save(); c.fillStyle = pad.full ? BONE_HI : CORAL_HI; c.strokeStyle = 'rgba(10,4,8,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(X, Y - T * 1.9 - bob); c.lineTo(X - T * 0.36, Y - T * 2.45 - bob); c.lineTo(X + T * 0.36, Y - T * 2.45 - bob); c.closePath(); c.fill(); c.stroke(); c.restore();
        cdLabel(c, pad.full ? (pad.shelterOn ? `IN THE SHELTER · ${Math.ceil(left)}` : 'CHARGED · its dome rises after step 3') : `CHARGE THE DRUM · ${Math.round(pad.charge / pad.need * 100)}%`, X, Y - T * 2.85 - bob, T, pad.full ? BONE_HI : CORAL_HI, T * 0.4);
        if (A.t > A.step3T) cdLabel(c, `THE WHOLE BOWL SOUNDS IN ${Math.ceil(left)}`, FX.sx(m.x), FX.sy(m.y) + T * 4.9, T, WARN, T * 0.5); }
      else { const u = A.sus.t / 2.1; c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const r = ((u * 2.2 + k / 3) % 1) * (ARENA.R + 1) * T; c.strokeStyle = rgba(k % 2 ? CORAL_HI : WARN, 0.55 * (1 - r / ((ARENA.R + 1) * T))); c.lineWidth = Math.max(3, T * 0.35); c.beginPath(); c.arc(FX.sx(m.x), FX.sy(m.y), r, 0, TAU); c.stroke(); } c.restore();
        if (pad.full && pad.shelterOn) { const R2 = (pad.shelterR || 2.9) * T; c.save(); c.strokeStyle = rgba(BONE_HI, 0.85); c.lineWidth = Math.max(2.5, T * 0.12); c.beginPath(); c.arc(X, Y, R2, 0, TAU); c.stroke(); c.restore(); }
        cdLabel(c, 'THE UNFINISHED CHORD', FX.sx(m.x), FX.sy(m.y) + T * 4.9, T, CORAL_HOT, T * 0.55); } }
    // the fall's gentle chord: three gold rings opening slowly from the seed
    if (M.chordRings && M.chordRings.length) { const X = FX.sx(m.x), Y = FX.sy(m.y) - T * 1.6; c.save(); c.globalCompositeOperation = 'lighter'; for (const v of M.chordRings) { if (v <= 0 || v > 2.6) continue; const u = v / 2.6, r = T * (0.8 + u * 9); c.strokeStyle = rgba(GOLD_HI, 0.6 * (1 - u)); c.lineWidth = Math.max(1.5, T * 0.12 * (1 - u * 0.6)); c.beginPath(); c.ellipse(X, Y, r, r * 0.8, 0, 0, TAU); c.stroke(); } c.restore(); }
    c.restore(); }

  /* ---------- the bowl: near-black maroon stone in courses round a dark dais, a bone-and-gold lip, darkness beyond ---------- */
  function paintBowl(c, A2) { const rnd = A2.rnd, R = A2.R, E = R + 1.5;
    c.fillStyle = '#0B0509'; c.fillRect(-E - 1, -E - 1, E * 2 + 2, E * 2 + 2);
    let g = c.createRadialGradient(0, 0, R, 0, 0, E + 1); g.addColorStop(0, 'rgba(156,90,85,.18)'); g.addColorStop(1, 'rgba(11,5,9,0)'); c.fillStyle = g; c.fillRect(-E - 1, -E - 1, E * 2 + 2, E * 2 + 2);
    c.fillStyle = '#251320'; c.beginPath(); c.arc(0, 0, R + 0.3, 0, TAU); c.fill();
    const TONES = ['#33202F', '#2C1A28', '#38232F', '#2A1724', '#311D2C', '#2E1B2A'], courses = [[3.5, 4.5], [4.5, 9], [9, 13.5], [13.5, 17.6]];
    for (const [r0, r1] of courses) { const rows = r1 - r0 > 2 ? 2 : 1; for (let row = 0; row < rows; row++) { const a0r = r0 + (r1 - r0) * row / rows, a1r = r0 + (r1 - r0) * (row + 1) / rows, rm = (a0r + a1r) / 2, n = Math.max(8, Math.round(TAU * rm / 2.4)), off = rnd() * TAU;
        for (let k = 0; k < n; k++) { const b0 = off + k / n * TAU, b1 = off + (k + 1) / n * TAU, j = 0.035; c.beginPath(); c.arc(0, 0, a1r - j, b0 + j / a1r, b1 - j / a1r); c.arc(0, 0, a0r + j, b1 - j / a0r, b0 + j / a0r, true); c.closePath(); c.fillStyle = TONES[Math.floor(rnd() * TONES.length)]; c.fill();
          // a bevel: the edge toward the light (north-west) lit, the far edge dark
          const mid = (b0 + b1) / 2, lit = Math.cos(mid - 3.9); c.strokeStyle = lit > 0 ? 'rgba(246,189,178,.07)' : 'rgba(0,0,0,.22)'; c.lineWidth = 0.09; c.beginPath(); c.arc(0, 0, a1r - 0.09, b0 + 0.05, b1 - 0.05); c.stroke(); c.strokeStyle = lit > 0 ? 'rgba(0,0,0,.2)' : 'rgba(246,189,178,.06)'; c.beginPath(); c.arc(0, 0, a0r + 0.09, b0 + 0.05, b1 - 0.05); c.stroke();
          if (rnd() < 0.16) { let a = mid + (rnd() - 0.5) * 0.08, r = lerp(a0r, a1r, 0.2 + rnd() * 0.6); c.strokeStyle = 'rgba(8,3,6,.55)'; c.lineWidth = 0.04; c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r); for (let s = 0; s < 3; s++) { a += (rnd() - 0.5) * 0.12; r += (rnd() - 0.5) * 0.6; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); } } } }
    // joints between courses
    c.strokeStyle = '#12070F'; c.lineWidth = 0.12; for (const r of [3.5, 6.75, 11.25, 15.55]) { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }
    // coral dust settled in drifts, gold flecks
    for (let i = 0; i < 22; i++) { const a = rnd() * TAU, d = 4.5 + rnd() * 12.5, x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.8 + rnd() * 2.2, gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, 'rgba(218,143,134,.09)'); gg.addColorStop(1, 'rgba(218,143,134,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 500; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R; c.fillStyle = rnd() < 0.6 ? 'rgba(0,0,0,.22)' : rnd() < 0.5 ? 'rgba(212,185,120,.12)' : 'rgba(246,189,178,.07)'; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 0.06, 0.06); }
    // the dais: polished dark stone, two gold inlays, grooves running out like a drum's tension cords
    g = c.createRadialGradient(-1, -1.2, 0.2, 0, 0, 3.5); g.addColorStop(0, '#3A2235'); g.addColorStop(0.7, '#21101C'); g.addColorStop(1, '#170A13'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 3.45, 0, TAU); c.fill();
    c.strokeStyle = '#0E050B'; c.lineWidth = 0.3; c.beginPath(); c.arc(0, 0, 3.45, 0, TAU); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, 3.25, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(212,185,120,.6)'; c.lineWidth = 0.05; c.beginPath(); c.arc(0, 0, 1.9, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(8,3,6,.55)'; c.lineWidth = 0.06; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + 0.1; c.beginPath(); c.moveTo(Math.cos(a) * 1.95, Math.sin(a) * 1.95); c.lineTo(Math.cos(a) * 3.15, Math.sin(a) * 3.15); c.stroke(); }
    for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; c.fillStyle = k % 2 ? GOLD_SH : GOLD_HI; c.beginPath(); c.arc(Math.cos(a) * 3.25, Math.sin(a) * 3.25, 0.07, 0, TAU); c.fill(); }
    // the lip of the bowl: a bone band with gold studs, its outer edge falling into darkness
    c.strokeStyle = '#0A0408'; c.lineWidth = 0.9; c.beginPath(); c.arc(0, 0, R + 0.35, 0, TAU); c.stroke();
    c.strokeStyle = BONE_D; c.lineWidth = 0.55; c.beginPath(); c.arc(0, 0, R + 0.1, 0, TAU); c.stroke(); c.strokeStyle = BONE_SH; c.lineWidth = 0.3; c.beginPath(); c.arc(0, 0, R + 0.02, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(244,235,211,.5)'; c.lineWidth = 0.06; c.beginPath(); c.arc(0, 0, R - 0.12, Math.PI * 0.9, Math.PI * 1.85); c.stroke();
    for (let k = 0; k < 72; k++) { const a = k / 72 * TAU; c.fillStyle = k % 3 ? GOLD : GOLD_HI; c.beginPath(); c.arc(Math.cos(a) * (R + 0.1), Math.sin(a) * (R + 0.1), 0.09, 0, TAU); c.fill(); } }
  /* the cavern over the bowl: the inside of the instrument, pipes rising into the dark, their mouths faintly lit */
  function paintCavern(c, W, H, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#080307'); g.addColorStop(0.5, '#140810'); g.addColorStop(1, '#0B0509'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(1111); for (let i = 0; i < 9; i++) { const x = (i + 0.5) / 9 * W + (R() - 0.5) * W * 0.06, w = W * (0.025 + R() * 0.03), top = H * (0.05 + R() * 0.25);
      const gg = c.createLinearGradient(x - w, 0, x + w, 0); gg.addColorStop(0, '#1A0B15'); gg.addColorStop(0.35, '#2E1828'); gg.addColorStop(1, '#0E050B'); c.fillStyle = gg; c.fillRect(x - w, top, w * 2, H - top);
      c.fillStyle = 'rgba(166,149,122,.18)'; for (let y = top + 30; y < H; y += 60 + R() * 40) c.fillRect(x - w, y, w * 2, 3);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + R() * 0.2; blitSized(c, glowSprite(CORAL), x - w * 3, top - w * 2, w * 6, w * 4); c.restore(); }
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(246,189,178,${0.05 + R() * 0.1})`; c.beginPath(); c.arc(R() * W, R() * H, 0.8 + R() * 1.2, 0, TAU); c.fill(); } }
})());
