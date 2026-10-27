/* ---------- AHUUL THE WHITE HORIZON ----------
   The Pale Aurora's last boss, over the Broad Summit: a 36-metre oval of wind-packed snow on the glacier's crown, three
   sturdy ice buttresses standing on it (horseshoe hoods of ice, each sheltering a little hearth), a stone pedestal at
   its heart holding the room's star ember, and a broken brass telescope still aimed at the place in the northern sky
   where the whale arrives. Two icebergs float far off in the night; below the summit lies the cloud sea.
   Ahuul is a celestial humpback some twenty metres long, hanging in the sky off the summit's northern rim with its
   head and its two enormous pectoral fins over the snow: a broad, blunt, rounded skull; fins that taper into three
   squared tips; a deep navy back, a white belly and throat; five green vents glowing down each flank; a low ridge of
   faceted ice plates along its spine; in place of eyes two vertical bands of small green lights curving behind its
   jaw; six thin sensory tendrils hanging from its chin.
   Horizon Sweep (all fight): it lifts one fin high over one half of the summit (the lifted fin shows the side), then
   brings it down and across that half in one broad stroke. Cross to the other half. After each pass its head comes low
   over the snow: strike it.
   Breath of Winter (below 70%): it draws in the cold and breathes it over the whole open summit (frost that bites and
   slows). One buttress is lit: carry the star ember from the pedestal into that shelter and it opens a warm bubble.
   The Sky Descends (below 35%): it rises overhead, its body's shadow laid across the summit, and a wind pushes toward
   one edge; ride the wind into the lit shelter outside the shadow before the sky's weight falls. Its chin is left
   frozen to the snow by an ice anchor: break it and the chain hauls its head down onto the summit, nose up, its
   luminous throat bared (the weak point) for a few seconds.
   The three are sequenced, never stacked: a sweep, a bow, a breath or a descent, each with its own window to move.
   Also: Starfall (frost motes from its vents into rings round the pet) and, in the second act, a few rime scuttlers
   and frost lanterns.
   It is never still: it breathes in slow swells, its vents pulsing in a wave down each side, its tendrils drifting,
   its fins sculling in broad strokes, its tail stock rolling the far fluke up and down, light running along the ice
   ridge; struck, its head jerks up and its fins flinch; it rises out of the cloud sea on entering. */
RiftFiend.define({ id: 'ahuul', name: 'Ahuul', title: 'The White Horizon', color: '#172C4D', glow: '#78D7B2', accent: '#E4EDF0', biome: 'whiteout', r: 3.0, els: ['ice', 'wind', 'light'], phases: 3, cuts: [1, 0.7, 0.35] }, (() => {
  const { TAU, TN } = RiftFiend, { INK, SNOW, NAVY, ICE, ICE_HI, GREEN, GREEN_HI } = AUR, K = DunFiend.KIT;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u, smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, mix3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const EMBER = '#FFC46B', EMBER_HI = '#FFF1C8', INK2 = '#0B1426';
  /* the summit: an oval 36 m across; three buttresses (their hearths, and the way into each); the pedestal; the telescope */
  const RX = 18, RY = 13, PED = [0, 1.2], SCOPE = [7.6, -7.4], NOOK = 1.8;
  const SH = [{ x: -11.4, y: 1.6, oa: 0 }, { x: 11.4, y: 1.6, oa: Math.PI }, { x: 0, y: 9.2, oa: -Math.PI / 2 }];
  const inPlat = (C, x, y, pad) => ((x - C.x) / (RX - (pad || 0))) ** 2 + ((y - C.y) / (RY - (pad || 0))) ** 2 < 1;
  const nookAt = (C, k) => [C.x + SH[k].x, C.y + SH[k].y];
  const inNook = (C, x, y, k) => { for (let i = 0; i < 3; i++) if ((k == null || k === i) && Math.hypot(x - C.x - SH[i].x, y - C.y - SH[i].y) < NOOK) return i; return -1; };
  /* the whale: twenty metres from snout to fluke; rings of eighteen round a spine laid out from the snout tailward */
  const L = 20, NS = 18, LF = 9.6, CF = 2.1, SF = 0.2;
  const SG = [0, 0.012, 0.03, 0.055, 0.085, 0.12, 0.16, 0.21, 0.27, 0.33, 0.4, 0.47, 0.54, 0.61, 0.68, 0.75, 0.82, 0.88, 0.93, 0.97, 1];
  const WT = [[0, 0], [0.012, 0.95], [0.03, 1.4], [0.055, 1.72], [0.1, 1.98], [0.18, 2.22], [0.3, 2.5], [0.42, 2.4], [0.55, 2.0], [0.68, 1.45], [0.8, 0.9], [0.9, 0.55], [0.97, 0.4], [1, 0.32]];
  const HUT = [[0, 0], [0.012, 0.5], [0.03, 0.74], [0.055, 0.92], [0.1, 1.1], [0.18, 1.4], [0.3, 1.7], [0.42, 1.65], [0.55, 1.4], [0.68, 1.0], [0.8, 0.65], [0.9, 0.42], [1, 0.3]];
  const HLT = [[0, 0], [0.012, 0.62], [0.03, 1.02], [0.055, 1.36], [0.1, 1.66], [0.18, 1.9], [0.3, 1.95], [0.42, 1.8], [0.55, 1.4], [0.68, 0.95], [0.8, 0.6], [0.9, 0.4], [1, 0.28]];
  const lin = (tab, s) => { if (s <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (s <= tab[i][0]) { const a = tab[i - 1], b = tab[i]; return lerp(a[1], b[1], (s - a[0]) / (b[0] - a[0])); } return tab[tab.length - 1][1]; };
  // the fin: [along it 0..1, across it in chords (- the leading edge)], tapering into three squared tips
  const FINP = [[0, -0.55], [0.1, -0.66], [0.3, -0.6], [0.55, -0.5], [0.78, -0.42], [0.9, -0.4], [0.995, -0.4], [0.995, -0.17], [0.92, -0.13], [1.045, -0.11], [1.045, 0.11], [0.93, 0.14], [0.975, 0.17], [0.975, 0.4], [0.86, 0.44], [0.62, 0.56], [0.36, 0.74], [0.14, 0.92], [0, 0.78]];
  const FLUKE = [[0, -0.15], [0.7, 0.15], [1.7, 0.42], [2.7, 0.85], [3.25, 1.3], [2.75, 1.45], [1.7, 1.32], [0.75, 1.2], [0, 0.88]];
  const VIEW = norm([0, 1, 1]), LIGHT = norm([-0.42, 0.3, 0.86]);
  const NAVY_B = { hi: '#335C8E', base: '#1C365E', shade: '#122541', deep: '#0B172C', rim: '#2D7F7A' }, BELLY_B = { hi: '#FFFFFF', base: '#E4EDF0', shade: '#B6CCDA', deep: '#8DAAC0', rim: '#C6F6E2' };
  const FIN_B = { hi: '#E6F1F7', base: '#A9C8DC', shade: '#7C9FBA', deep: '#5B809E' };
  const ICE_B = { hi: '#EEF9FD', base: '#B4DAEB', shade: '#78A9C6', deep: '#507FA0' };
  let offCv = null;
  const HORDE = 400, HORDE_CAP = 70, HORDE_MIX = [['rimescuttler', 44], ['yeti', 22], ['veilray', 16], ['icegolem', 7], ['frostlantern', 4]];
  return {
    arenaR: 18.5, firstAct: 'glide', ambient: 'snow',
    artPoses: [{ name: 'over the summit', mem: { demo: 1 } }, { name: 'a fin lifted', mem: { demo: 1, demoSweep: 1 } }, { name: 'drawing in the cold', mem: { demo: 1, demoInhale: 1 } }, { name: 'the throat bared', mem: { demo: 1, demoStun: 1 } }],
    phaseNames: ['Horizon Sweep', 'Breath of Winter', 'The Sky Descends'],
    start(C) { return { x: C.x + 0.5, y: C.y + 5.2 }; },
    // the walkable ground is the oval; the buttresses are walls round their hearths; the telescope's plinth stands
    carve(set, C) { const RR = Math.ceil(C.R) + 2; for (let y = -RR; y <= RR; y++) for (let x = -RR; x <= RR; x++) { const wx = Math.floor(C.x) + x, wy = Math.floor(C.y) + y, cx = wx + 0.5, cy = wy + 0.5;
        // (a little prow of snow juts from the northern rim toward the whale: where the pet stands to seal the rift)
        const prow = Math.abs(cx - C.x) < 1.6 && cy - C.y > -13.9 && cy - C.y < -12;
        if (!inPlat(C, cx, cy, 0.2) && !prow) { set(wx, wy, T_SOLID); continue; }
        for (const S of SH) { const dx = cx - C.x - S.x, dy = cy - C.y - S.y, d = Math.hypot(dx, dy); if (d > 1.85 && d < 3.4 && Math.abs(K.angTo(S.oa, Math.atan2(dy, dx))) > 0.92) set(wx, wy, T_SOLID); }
        if (Math.abs(cx - C.x - SCOPE[0]) < 0.6 && Math.abs(cy - C.y - SCOPE[1]) < 0.6) set(wx, wy, T_SOLID); } },
    props(C) { const out = []; SH.forEach((S, k) => { out.push({ kind: 'shelter', part: 'back', k, nx: C.x + S.x, ny: C.y + S.y, oa: S.oa, x: C.x + S.x, y: C.y + S.y - 2.3 }); out.push({ kind: 'shelter', part: 'front', k, nx: C.x + S.x, ny: C.y + S.y, oa: S.oa, x: C.x + S.x, y: C.y + S.y + 2.6 }); }); out.push({ kind: 'scope', x: C.x + SCOPE[0], y: C.y + SCOPE[1] + 0.3, C }); return out; },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'shelter') drawShelter(c, FX, p, X, Y, T, t); else if (p.kind === 'scope') drawScope(c, FX, p, X, Y, T, t); },
    paintGround(c, A) { paintSummit(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    camFocus(FX, m) { const M = FX.mem, P = M.P, C = FX.C; if (!P || m.dead) return null; if (m.act === 'enter') return { x: C.x, y: C.y - 14, k: 0.5, zoom: 0.56 };
      if (P.over > 0.5 || m.act === 'rise' || m.act === 'tether') return { x: C.x, y: C.y - 3.5, k: 0.5, zoom: 0.5 };
      const h = M.headC || [m.x, m.y, 3]; return { x: h[0], y: h[1] - h[2] - (m.stunT > 0 ? 0 : 2.5), k: m.stunT > 0 ? 0.42 : 0.45, zoom: m.stunT > 0 ? 0.56 : 0.56 }; },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.noTouch = true; m.touchK = 0;
      Object.assign(M, { bt: 0, q: [], qt: 0, seen: {}, picks: 0, nextSig: null, recoil: 0, roar: 0, ventK: 0, eyeK: 1, finGlow: { '-1': 0, '1': 0 }, sw: null, wave: null, br: null, rs: null, wind: null, teth: null, bubble: null, frost: null, stunPt: null, wasStun: false, wasEnter: true, roared: false, mistT: 0, hdx: 0,
        stat: { sweeps: 0, sweepHit: 0, sweepSafe: 0, breaths: 0, warm: 0, frost: 0, falls: 0, shadowHit: 0, hail: 0, safe: 0, yanks: 0 },
        ember: { x: C.x + PED[0], y: C.y + PED[1], st: 'rest', t: 0, k: -1 },
        flakes: Array.from({ length: 46 }, (_, i) => { const R = mulberry32(900 + i); return [(R() * 2 - 1) * RX * 0.95, (R() * 2 - 1) * RY * 0.95, 0.25 + R() * 0.4, R() * 6]; }) });
      M.P = pose(FX, 'enter'); M.tg = Object.assign({}, M.P); m.x = C.x; m.y = C.y - 10; },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; resetAll(FX, m); M.roar = 1; M.recoil = 0.8; FX.H.shake(10, 0.5); FX.H.flash(0.2, GREEN_HI); FX.H.sfx.hum();
      if (lv === 2) { M.nextSig = 'breath'; M.picks = 0; minions(FX, ['rimescuttler', 'rimescuttler']); FX.H.banner('BREATH OF WINTER', 'It breathes frost over the open summit: carry the star ember into the lit shelter', EMBER, 2.8, true); }
      if (lv >= 3) { M.nextSig = 'rise'; M.picks = 0; FX.H.banner('THE SKY DESCENDS', 'It rises overhead: ride the wind to the shelter outside its shadow', GREEN_HI, 2.8, true); } },
    ai(FX, m, dt) {
      const M = FX.mem, P = FX.S.lv, fast = FX.S.fast; m.actT += dt; m.noTouch = true;
      M.qt += dt; while (M.q.length && M.q[0].at <= M.qt) M.q.shift().fn();
      // the horde: once, half way down, four hundred of the summit's creatures pour out of it
      if (!M.hordeDone && !M.hd && P === 2 && m.act === 'glide' && m.hp <= m.maxhp * 0.52) startHorde(FX, m);
      switch (m.act) {
        case 'horde': M.tgName = 'perch'; M.ventK = 1; hordeTick(FX, m, dt); break;
        case 'glide': M.tgName = 'perch'; if (m.actT > (P >= 3 ? 1.7 : P >= 2 ? 1.9 : 2.1) / fast) choose(FX, m); break;
        case 'bow': M.tgName = 'bow'; if (m.actT > (P >= 2 ? 2.9 : 3.3)) { m.act = 'glide'; m.actT = 0; } break;
        case 'starfall': M.tgName = 'perch'; M.ventK = Math.max(M.ventK, m.actT < 1.4 ? 1 : 0); if (m.actT > 2.4) { m.act = 'glide'; m.actT = 0; } break;
        case 'sweep': M.tgName = 'sweep'; if (!M.q.length && m.actT > 8) { m.act = 'glide'; m.actT = 0; M.sw = null; } break;
        case 'breath': M.tgName = M.br && M.br.st === 'inhale' ? 'inhale' : 'exhale'; if (!M.q.length && m.actT > 20) { m.act = 'glide'; m.actT = 0; } break;
        case 'rise': case 'tether': M.tgName = 'over'; if (m.act === 'tether' && M.teth) { M.teth.t += dt; if (M.teth.t > M.teth.max) anchorGives(FX, m); } if (!M.q.length && !M.teth && m.actT > 20) { m.act = 'glide'; m.actT = 0; FX.untarget(false); } break;
      }
      if (!m.under) FX.parts(headParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.tgName = 'stun'; m.noTouch = true; const p = throatAt(M); if (p) FX.weak('throat', p[0], p[1] - p[2], 1.7, 2.4, m.stunT > 0.05);
      M.shT = (M.shT || 0) - dt; if (M.shT <= 0) { M.shT = 0.4; FX.H.shake(1.5, 0.1); if (p) FX.H.sparks(p[0] + FX.rnd(-1, 1), p[1] - p[2] + FX.rnd(-0.5, 0.5), GREEN_HI, 4, 3); } },
    update(FX, dt) { const M = FX.mem, m = FX.m, C = FX.C, me = FX.me; if (!m || !M.P) return; M.bt += dt;
      // fallen: the white horizon dissolves, rising and coming apart into green stars (the wind and the frost let go)
      if (m.dead) { if (!M.deadT) { M.deadT = 0; M.wind = null; endFrost(FX); M.bubble = null; M.sw = null; M.wave = null; M.q.length = 0; if (M.teth && M.teth.o) M.teth.o.dead = true; M.teth = null; }
        M.deadT += dt; const Pz = M.P; Pz.alpha = Math.max(0, 1 - M.deadT / 2.8); Pz.hz += dt * 1.2; Pz.lW = toward(Pz.lW, 0.6, dt, 1); Pz.lE = toward(Pz.lE, 0.6, dt, 1); M.G = build(Pz, M.bt, M);
        if (Pz.alpha > 0.05 && Math.random() < dt * 40) { const F = M.G.frs[Math.floor(Math.random() * M.G.frs.length)], ph = Math.random() * TAU, p = add(F.c, add(mul(F.v, Math.cos(ph) * F.w), mul(F.u, Math.sin(ph) * F.hU))); FX.H.part({ kind: 'star', x: p[0], y: p[1] - p[2], vx: FX.rnd(-0.6, 0.6), vy: -1.5 - Math.random(), life: 1.4, max: 1.4, size: 3, color: Math.random() < 0.6 ? GREEN_HI : '#FFFFFF' }); }
        return; }
      if (!(m.stunT > 0)) { if (FX.S.weak.throat) FX.weak('throat', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.recoil = 1; M.roar = 0.6; M.stunPt = null; FX.H.text(m.x, m.y - 3, 'It tears free and rises', GREEN_HI, 13); FX.H.sfx.whoosh(); } } else M.wasStun = true;
      M.recoil = decay(M.recoil, dt, 1.6); M.roar = decay(M.roar, dt, 0.6); M.ventK = decay(M.ventK, dt, 0.8); for (const s of ['-1', '1']) M.finGlow[s] = decay(M.finGlow[s], dt, 1.5);
      // the entrance: it rises out of the cloud sea beyond the rim with a long call
      if (m.act === 'enter') { M.tgName = 'perch'; const e = FX.S.enterT || 0; if (e > 1.5 && !M.roared) { M.roared = true; M.roar = 1; FX.H.sfx.hum(); FX.H.shake(8, 0.6); } }
      else if (M.wasEnter) { M.wasEnter = false; M.recoil = 0.5; }
      // its head turns slowly to the pet (never quite head-on: it hangs three-quarters to the summit)
      { const dxp = me.x - C.x; if (Math.abs(dxp) > 2.5 || !M.yoS) M.yoS = dxp > 0 ? -1 : 1; const yoT = m.act === 'sweep' && M.sw ? M.sw.side : M.yoS; M.yo = toward(M.yo == null ? yoT : M.yo, yoT, dt, m.act === 'sweep' ? 2.2 : 0.55); }
      // the pose glides to what the act wants
      const tg = pose(FX, M.tgName || 'perch'), Pz = M.P, rate = m.act === 'enter' ? 0.9 : M.tgName === 'over' ? 1.1 : M.tgName === 'stun' ? 2.6 : M.tgName === 'sweep' && M.sw && M.sw.k > 0 ? 5 : 1.8;
      for (const k in tg) Pz[k] = toward(Pz[k], tg[k], dt, k === 'alpha' ? 1.2 : k[0] === 'l' || k[0] === 's' ? Math.max(rate, 2.2) : rate);
      if (M.sw && !(M.sw.k > 0)) M.finGlow[String(M.sw.side)] = 1;
      if (M.sw && M.sw.k > 0) { const S2 = M.sw, u = clamp(S2.k, 0, 1), e = u < 1 ? 1 - Math.pow(1 - u, 2.2) : 1, sd = S2.side, key = sd < 0 ? 'W' : 'E'; Pz['l' + key] = lerp(1.35, -0.7, e); Pz['s' + key] = lerp(-0.45, 1.05, e); Pz.flex = Math.sin(u * Math.PI) * -0.9; S2.k += dt / 0.6; }
      else Pz.flex = toward(Pz.flex, 0, dt, 3);
      M.G = build(Pz, M.bt, M);
      const hc = M.G.frs[5].c; M.headC = hc; m.x = hc[0]; m.y = hc[1];
      ember(FX, m, dt);
      // the wind: everything outside a shelter's hood is pushed toward the edge
      if (M.wind && M.wind.t > 0) { M.wind.t -= dt; if (!me.dead && inNook(C, me.x, me.y) < 0 && !me.dodge) FX.push(Math.cos(M.wind.a) * 3.3 * dt, Math.sin(M.wind.a) * 3.3 * dt); if (M.wind.t <= 0) M.wind = null; }
      if (M.frost) { const Fz = M.frost; if (Fz.age > 0.4) { if (inFrost(FX, me.x, me.y)) M.stat.frost += dt; else if (M.bubble && Math.hypot(me.x - M.bubble.x, me.y - M.bubble.y) < M.bubble.r) M.stat.warm += dt; } }
      if (M.wave) { M.wave.t += dt; if (M.wave.t > 0.9) M.wave = null; }
      // the breath's mist, rolling out of its mouth over the summit
      if (M.br && M.br.st === 'exhale' && M.frost) { M.mistT -= dt; if (M.mistT <= 0) { M.mistT = 0.05; const sn = M.G.snout; FX.H.part({ kind: 'smoke', x: sn[0] + FX.rnd(-1.5, 1.5), y: sn[1] - sn[2] + 1, vx: FX.rnd(-3, 3), vy: FX.rnd(4, 8), drag: 0.6, life: 1.6, max: 1.6, size: 2.2, color: '#EAF4F8' }); } }
      if (M.br && M.br.st === 'inhale' && Math.random() < dt * 14) { const a = Math.random() * TAU; FX.H.part({ kind: 'snow', x: C.x + Math.cos(a) * RX * 0.8 * Math.random(), y: C.y + Math.sin(a) * RY * 0.8 * Math.random(), vx: (M.G.snout[0] - C.x) * 0.25, vy: (M.G.snout[1] - M.G.snout[2] - C.y) * 0.25, life: 1.3, max: 1.3, size: 2 + Math.random() * 1.5, color: '#FFFFFF' }); } },
    dmgK(FX, m) { const M = FX.mem; M.recoil = Math.max(M.recoil || 0, 0.35); return m.act === 'bow' ? 1.5 : 0.8; },
    onWeakHit(FX) { FX.mem.recoil = 1; },
    // (it is painted over everything that stands on the summit: it is above them all)
    draw(c, FX, m, X, Y, T, t) { if (!(FX.S && FX.S.started)) demoPaint(c, FX, m, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'anchor') drawAnchor(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.1 : 1.1, true); }
  function at(M, dt, fn) { M.q.push({ at: M.qt + dt, fn }); M.q.sort((a, b) => a.at - b.at); }
  function minions(FX, types) { const C = FX.C, me = FX.me, alive = FX.H.mons.filter(q => !q.dead && q.fminion).length; types.slice(0, Math.max(0, 3 - alive)).forEach((ty, i) => { const a = Math.atan2(me.y - C.y, me.x - C.x) + Math.PI + (i - 0.5) * 1.2, x = C.x + Math.cos(a) * 8, y = C.y + Math.sin(a) * 6; FX.H.ring(x, y, 0.2, 1.6, 0.4, ICE_HI, 0.4); FX.H.sparks(x, y, ICE_HI, 10, 5); const q = FX.minion(ty, x, y); if (q) q.cd = 1.5; }); }
  function resetAll(FX, m) { const M = FX.mem; M.q.length = 0; M.sw = null; M.wave = null; M.rs = null; M.wind = null; M.bubble = null; endFrost(FX); M.br = null; if (M.teth && M.teth.o && !M.teth.o.dead) M.teth.o.dead = true; M.teth = null; FX.untarget(false); m.act = 'glide'; m.actT = 0; if (M.ember.st === 'placed' || M.ember.st === 'carry') emberHome(M, FX); }
  function endFrost(FX) { const M = FX.mem; if (M.frost) { M.frost.life = Math.min(M.frost.life, M.frost.age + 0.8); M.frost = null; } }
  function choose(FX, m) { const M = FX.mem, P = FX.S.lv; m.actT = 0;
    let a = M.nextSig; M.nextSig = null;
    if (!a) { const cyc = P >= 3 ? ['rise', 'sweep', 'starfall', 'sweep'] : P >= 2 ? ['breath', 'sweep', 'starfall', 'sweep'] : ['sweep', 'sweep', 'starfall']; a = cyc[M.picks++ % cyc.length]; }
    if (a === 'sweep') return startSweep(FX, m); if (a === 'starfall') return startStarfall(FX, m); if (a === 'breath') return startBreath(FX, m); if (a === 'rise') return startRise(FX, m); }
  /* ---- The Horde: its vents and jaw open and four hundred of the summit's creatures pour onto the platform (no more
     than seventy at once). While they live it cannot be struck; it rains frost on rings round the pet and now and then
     drops a great nova. When the last falls it sinks, spent, its head low over the snow. ---- */
  function startHorde(FX, m) { const M = FX.mem; resetAll(FX, m); m.act = 'horde'; m.actT = 0; FX.untarget(true); M.roar = 1; M.ventK = 1; FX.H.shake(12, 0.8); FX.H.flash(0.3, GREEN_HI); FX.H.sfx.hum();
    M.hd = { left: HORDE, killed: 0, list: [], acc: 0, atkT: 3.2, n: 0, done: false };
    FX.H.banner('THE HORDE OF THE HORIZON', 'Four hundred creatures pour out of it: clear them all, and stay off its frost', GREEN_HI, 3, true, true); }
  function hordeType(FX) { const tot = HORDE_MIX.reduce((a, t) => a + t[1], 0); let u = Math.random() * tot; for (const [t, w] of HORDE_MIX) { if ((u -= w) < 0) return t; } return 'rimescuttler'; }
  function hordeTick(FX, m, dt) { const M = FX.mem, H2 = M.hd, C = FX.C, me = FX.me; if (!H2) return; m.noTouch = true;
    H2.list = H2.list.filter(q => { if (q.dead) { H2.killed++; return false; } return true; });
    // pouring out: a steady stream, faster at first
    H2.acc += dt * (H2.n < 60 ? 40 : 22);
    while (H2.acc >= 1 && H2.left > 0 && H2.list.length < HORDE_CAP) { H2.acc -= 1; let x = 0, y = 0; for (let k = 0; k < 8; k++) { x = C.x + FX.rnd(-RX * 0.75, RX * 0.75); y = C.y + FX.rnd(-RY * 0.7, -RY * 0.1); if (inPlat(C, x, y, 1.2) && Math.hypot(x - me.x, y - me.y) > 3.5) break; }
      const ty = hordeType(FX), q = FX.minion(ty, x, y); if (!q) continue; q.horde = true; q.hp = q.maxhp = Math.max(40, Math.round(q.maxhp * (ty === 'icegolem' ? 0.45 : 0.35))); q.xp = Math.max(1, Math.round((q.xp || 4) * 0.3)); q.cd = 1 + Math.random() * 1.5; q.atkCd = 1 + Math.random();
      H2.list.push(q); H2.left--; H2.n++;
      const sn = M.G && M.G.snout; if (sn) for (let k = 0; k < 2; k++) FX.H.part({ kind: 'spark', x: lerp(sn[0], x, 0.3 + k * 0.3), y: lerp(sn[1] - sn[2], y, 0.3 + k * 0.3), vx: (x - sn[0]) * 0.6, vy: (y - sn[1] + sn[2]) * 0.6, life: 0.5, max: 0.5, size: 3, color: GREEN_HI }); FX.H.ring(x, y, 0.2, 1.1, 0.3, ICE_HI, 0.3); }
    // its frost while they fight: rings round the pet, now and then a great nova
    H2.atkT -= dt; if (H2.atkT <= 0) { H2.atkT = 3.4 / FX.S.fast; H2.k = (H2.k || 0) + 1;
      if (H2.k % 3 === 0) { FX.tele({ shape: 'circle', x: me.x, y: me.y, r: 3.4, t: 1.7 / FX.S.fast, dmg: m.dmg * 1.3, col: GREEN_HI, fn: s => { FX.H.boom(s.x, s.y, 3, GREEN_HI, '#FFFFFF', { n: 30, shake: 9 }); FX.H.sfx.crash(); } }); FX.H.text(me.x, me.y - 2.2, 'FROST NOVA: get out!', GREEN_HI, 14); }
      else { const n = 5; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, dd = i === 0 ? 0 : 1.6 + Math.random() * 2.8, p = { x: me.x + (me.vx || 0) * 0.25 + Math.cos(a) * dd, y: me.y + (me.vy || 0) * 0.25 + Math.sin(a) * dd }; if (!inPlat(C, p.x, p.y, 1)) continue; FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.3, t: (1.2 + i * 0.15) / FX.S.fast, dmg: m.dmg * 0.9, col: ICE_HI, mote: true, fn: s => { FX.H.boom(s.x, s.y, 1.1, ICE_HI, '#FFFFFF', { n: 10, shake: 3 }); FX.H.sfx.crack(); } }); } }
      M.ventK = 1; }
    if (H2.left === 0 && H2.list.length === 0 && !H2.done) { H2.done = true; M.hd = null; M.hordeDone = true; FX.untarget(false); FX.H.flash(0.4, '#FFFFFF'); FX.H.shake(10, 0.6); FX.H.sfx.fanfare && FX.H.sfx.fanfare();
      FX.H.banner('THE HORDE IS BROKEN', 'It sinks, spent: its head hangs low, strike it', GREEN_HI, 2.8, true, true); startBow(FX, m); m.actT = -3.5; } }
  /* ---- Horizon Sweep: one fin lifted over one half of the summit, then brought down across it ---- */
  function startSweep(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, side = me.x < C.x ? -1 : 1, W = (P >= 3 ? 1.35 : P >= 2 ? 1.5 : 1.75) / FX.S.fast; m.act = 'sweep'; m.actT = 0; M.q.length = 0; M.qt = 0; M.stat.sweeps++;
    M.sw = { side, t: 0, W, k: 0 }; FX.H.sfx.hum();
    say(FX, 'sweep', 'HORIZON SWEEP', `It lifts its ${side < 0 ? 'western' : 'eastern'} fin: cross to the other half of the summit`, ICE_HI);
    const test = (x, y, rr) => inPlat(C, x, y) && (x - C.x) * side + (rr || 0) > -0.5;
    FX.tele({ shape: 'fn', test, x: C.x, y: C.y, t: W, dmg: m.dmg * 1.7, col: ICE_HI, fn: () => { const hit = test(me.x, me.y, me.r); M.stat[hit ? 'sweepHit' : 'sweepSafe']++; M.sw.k = 0.0001; M.wave = { side, t: 0 }; M.recoil = 0;
      FX.H.shake(13, 0.45); FX.H.sfx.whoosh(); FX.H.sfx.crash(); for (let i = 0; i < 6; i++) { const y = C.y - RY * 0.8 + i * RY * 0.32, x = C.x + side * (4 + Math.random() * 10); FX.H.part({ kind: 'smoke', x, y, vx: side * 2, vy: 3, drag: 0.5, life: 1.2, max: 1.2, size: 3, color: '#F2F8FB' }); } } });
    at(M, W + 1.05, () => startBow(FX, m)); }
  function startBow(FX, m) { const M = FX.mem; m.act = 'bow'; m.actT = 0; M.sw = null; FX.H.sfx.thud();
    say(FX, 'bow', 'THE HEAD COMES LOW', 'Its head rests over the snow: strike it now', GREEN_HI); }
  /* ---- Starfall: its vents puff frost motes that fall into rings round the pet ---- */
  function startStarfall(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, n = FX.S.lv >= 2 ? 6 : 5, w = 1.15 / FX.S.fast; m.act = 'starfall'; m.actT = 0; M.ventK = 1; FX.H.sfx.hum();
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, dd = i === 0 ? 0 : 1.8 + Math.random() * 2.6, p = { x: me.x + (me.vx || 0) * 0.2 + Math.cos(a) * dd, y: me.y + (me.vy || 0) * 0.2 + Math.sin(a) * dd }; if (!inPlat(C, p.x, p.y, 1)) continue;
      FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.35, t: w + i * 0.17, dmg: m.dmg * 1.0, col: ICE_HI, mote: true, fn: s => { FX.H.boom(s.x, s.y, 1.1, ICE_HI, '#FFFFFF', { n: 10, shake: 4 }); FX.H.sfx.crack(); for (let k = 0; k < 4; k++) FX.H.part({ kind: 'shard', x: s.x, y: s.y - 0.3, vx: FX.rnd(-3, 3), vy: FX.rnd(-4, -1), g: 9, life: 0.6, max: 0.6, size: 4, rot: Math.random() * 3, vr: 6, color: ICE_HI }); } }); }
    say(FX, 'starfall', 'STARFALL', 'Its vents shed frost motes: off the rings', ICE_HI); }
  /* ---- Breath of Winter: one shelter lit, the ember to carry there, then frost over the open summit ---- */
  function startBreath(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv; m.act = 'breath'; m.actT = 0; M.q.length = 0; M.qt = 0; M.stat.breaths++;
    let k = [0, 1, 2].filter(i => i !== M.lastNook).sort((a, b) => { const A = nookAt(C, a), B = nookAt(C, b); return Math.hypot(me.x - B[0], me.y - B[1]) - Math.hypot(me.x - A[0], me.y - A[1]); })[0]; if (k == null) k = 0; M.lastNook = k;
    const INH = 7.6 / FX.S.fast, FR = 4.6; M.br = { st: 'inhale', k, t0: FX.S.t, INH, FR }; M.bubble = null; if (M.ember.st !== 'carry') emberHome(M, FX, true);
    FX.H.sfx.hum(); say(FX, 'breath', 'BREATH OF WINTER', 'It draws in the cold: carry the star ember into the lit shelter', EMBER);
    at(M, INH, () => { if (m.act !== 'breath') return; M.br.st = 'exhale'; M.br.t1 = FX.S.t; FX.H.sfx.whoosh(); FX.H.shake(8, FR * 0.6); FX.H.flash(0.15, '#FFFFFF');
      M.frost = FX.hz({ kind: 'frost', shape: 'fn', test: (x, y) => inFrost(FX, x, y), x: C.x, y: C.y, life: FR, dps: m.dmg * 0.6, tick: 0.4, arm: 0.35, slow: true, col: ICE_HI, draw: (c, z, FX2, T, t) => drawFrost(c, FX, z, T, t) });
      FX.H.text(C.x, C.y - 3, M.bubble ? 'The ember holds the cold off' : 'The frost bites: get to the warmth!', M.bubble ? EMBER : ICE_HI, 14); });
    at(M, INH + FR, () => { endFrost(FX); M.bubble = null; emberHome(M, FX); if (M.br) M.br.st = 'done'; if (m.act === 'breath') startBow(FX, m); if (FX.S.lv === 2) minions(FX, ['frostlantern']); }); }
  function inFrost(FX, x, y) { const M = FX.mem, C = FX.C, Z = M.frost; if (!Z) return false; const front = C.y - RY + Math.min(1, Z.age / 0.7) * RY * 2.2; if (y > front || !inPlat(C, x, y)) return false; return !(M.bubble && Math.hypot(x - M.bubble.x, y - M.bubble.y) < M.bubble.r); }
  /* the star ember: it rests on the pedestal; walked into, it is carried; carried into the lit shelter while the whale
     draws its breath, it is set down there and opens a warm bubble */
  function ember(FX, m, dt) { const M = FX.mem, E = M.ember, me = FX.me, C = FX.C; E.t += dt;
    if (E.st === 'rest') { if (!me.dead && M.br && (M.br.st === 'inhale' || M.br.st === 'exhale') && Math.hypot(me.x - E.x, me.y - E.y) < 1.3) { E.st = 'carry'; FX.H.sfx.pop(); FX.H.text(me.x, me.y - 1.6, 'You carry the star ember', EMBER, 13); } }
    else if (E.st === 'carry') { E.x = me.x; E.y = me.y; const B = M.br; if (B && (B.st === 'inhale' || B.st === 'exhale') && inNook(C, me.x, me.y, B.k) >= 0) { const N = nookAt(C, B.k); E.st = 'placed'; E.x = N[0]; E.y = N[1]; E.k = B.k; M.bubble = { x: N[0], y: N[1] + 0.2, r: 2.6, t: 0 }; FX.H.ring(N[0], N[1], 0.3, 2.6, 0.5, EMBER, 0.5); FX.H.sfx.fanfare ? FX.H.sfx.fanfare() : FX.H.sfx.pop(); FX.H.banner('A WARM BUBBLE', 'Stay inside it while the breath of winter passes', EMBER, 1.8, true); } }
    else if (E.st === 'return') { E.u = Math.min(1, (E.u || 0) + dt / 0.9); E.x = lerp(E.fx, C.x + PED[0], E.u); E.y = lerp(E.fy, C.y + PED[1], E.u); if (E.u >= 1) E.st = 'rest'; }
    if (M.bubble) M.bubble.t += dt; }
  function emberHome(M, FX, quick) { const E = M.ember, C = FX.C; if (E.st === 'rest') return; if (quick) { E.st = 'rest'; E.x = C.x + PED[0]; E.y = C.y + PED[1]; return; } E.st = 'return'; E.u = 0; E.fx = E.x; E.fy = E.y; }
  /* ---- The Sky Descends: overhead, its shadow over the summit, a wind toward the edge, then the sky's weight ---- */
  function startRise(FX, m) { const M = FX.mem, me = FX.me, C = FX.C; m.act = 'rise'; m.actT = 0; M.q.length = 0; M.qt = 0; M.stat.falls++;
    const safe = Math.random() < 0.5 ? -1 : 1; M.rs = { safe, t0: FX.S.t, k: safe < 0 ? 0 : 1, strikeAt: 6.6 }; FX.untarget(true); FX.H.sfx.whoosh();
    say(FX, 'rise', 'THE SKY DESCENDS', 'Its shadow will fall: ride the wind into the lit shelter outside it', GREEN_HI);
    at(M, 1.3, () => { if (m.act !== 'rise') return; const a = safe > 0 ? 0 : Math.PI; M.wind = { a, t: 5.3 }; for (const dy of [-7.5, -3.5, 0.5, 4.5, 8.5]) FX.H.zone({ kind: 'windlane', x: C.x - safe * RX, y: C.y + dy, a, len: RX * 2, w: 2.6, life: 5.3, max: 5.3, own: 'none' }); FX.H.text(me.x, me.y - 2, safe > 0 ? 'The wind turns east' : 'The wind turns west', '#E8FFF6', 14); });
    at(M, 6.6, () => { if (m.act !== 'rise') return; skyFalls(FX, m); });
    at(M, 7.4, () => { if (m.act !== 'rise') return; startTether(FX, m); }); }
  function inShadow(FX, x, y) { const S = FX.mem.G && FX.mem.G.shadow; if (!S) return false; return S.some(poly => inPoly(poly, x, y)); }
  function inPoly(P, x, y) { let inside = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside; } return inside; }
  function skyFalls(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, safeK = M.rs.k, inS = inShadow(FX, me.x, me.y), nk = inNook(C, me.x, me.y);
    if (inS) { M.stat.shadowHit++; FX.hurt(m.dmg * 2.3); FX.H.text(me.x, me.y - 1.8, 'The sky\'s weight falls on you!', '#FFFFFF', 14); }
    else if (nk < 0) { M.stat.hail++; FX.hurt(m.dmg * 0.55); FX.H.text(me.x, me.y - 1.8, 'Hail on the open snow', ICE_HI, 13); }
    else { M.stat.safe++; FX.H.text(me.x, me.y - 1.8, 'Sheltered', GREEN_HI, 14); }
    M.wind = null; M.dip = 1; FX.H.shake(16, 0.7); FX.H.flash(0.35, '#FFFFFF'); FX.H.sfx.crash();
    const G = M.G; for (let k = 4; k < G.frs.length - 2; k += 3) { const p = G.frs[k].c; if (inPlat(C, p[0], p[1])) FX.H.boom(p[0], p[1], 2.2, ICE_HI, '#FFFFFF', { n: 14, shake: 6, smoke: 4 }); }
    for (const sd of [-1, 1]) { const tp = G.fins[sd].tip; if (inPlat(C, tp[0], tp[1])) FX.H.boom(tp[0], tp[1], 1.8, ICE_HI, '#FFFFFF', { n: 10, shake: 5 }); } }
  /* ---- the ice anchor: its chin frozen to the snow; broken, the chain hauls its head down, throat bared ---- */
  function startTether(FX, m) { const M = FX.mem, C = FX.C, G = M.G; m.act = 'tether'; m.actT = 0; const ch = G.chin; let x = ch[0], y = ch[1];
    const dx = x - C.x, dy = y - C.y, e = Math.hypot(dx / (RX - 3), dy / (RY - 3)); if (e > 1) { x = C.x + dx / e; y = C.y + dy / e; }
    if (inNook(C, x, y) >= 0 || Math.hypot(x - C.x - PED[0], y - C.y - PED[1]) < 1.5) y -= 2.2;
    const o = FX.obj({ kind: 'anchor', x, y, r: 0.95, hp: FX.S.barHP * 0.05, onKill: o2 => yank(FX, o2) }); M.teth = { o, t: 0, max: 9.5 };
    FX.H.boom(x, y, 1.6, ICE_HI, '#FFFFFF', { n: 16, shake: 8 }); FX.H.sfx.crack();
    say(FX, 'anchor', 'THE ICE ANCHOR', 'Its chin is frozen to the snow: break the anchor to haul its head down', GREEN_HI); }
  function yank(FX, o) { const M = FX.mem, m = FX.m; if (!m || m.dead || !M.teth) return; M.teth = null; M.stat.yanks++; M.stunPt = { x: o.x, y: o.y }; m.act = 'glide'; m.actT = 0; m.stunT = 6.5; FX.untarget(false); M.recoil = 0; M.roar = 0.8;
    FX.H.boom(o.x, o.y, 1.8, GREEN_HI, '#FFFFFF', { n: 22, shake: 12 }); FX.H.sfx.crash(); FX.H.flash(0.2, GREEN_HI); FX.H.banner('THE THROAT IS BARED', 'The chain hauls its head down: strike the glowing throat!', GREEN_HI, 2.2, true); }
  function anchorGives(FX, m) { const M = FX.mem, o = M.teth && M.teth.o; M.teth = null; if (o && !o.dead) { o.dead = true; FX.H.boom(o.x, o.y, 1.4, ICE_HI, '#FFFFFF', { n: 12, shake: 5 }); FX.H.text(o.x, o.y - 2, 'The anchor gives way', ICE_HI, 13); } m.act = 'glide'; m.actT = 0; FX.untarget(false); FX.H.sfx.whoosh(); }

  /* ---------- the whale's poses: where its snout is, how its spine runs, what its fins do ---------- */
  function pose(FX, name) { const M = FX.mem, C = FX.C, t = M.bt || 0, rec = M.recoil || 0, sc = Math.sin(t * 0.62), sc2 = Math.sin(t * 0.62 + 1.1), yo = M.yo == null ? 0.45 : M.yo;
    // (it hangs three-quarters on, its head turned to the pet, its body rising away across the sky behind)
    const P = { hx: C.x - yo * 5.0 + Math.sin(t * 0.19) * 0.8, hy: C.y - 8.2, hz: 3.0 + Math.sin(t * 0.5) * 0.25 + rec * 0.7, yaw0: -Math.PI / 2 + yo * 1.02, yawK: -yo * 0.8 + Math.sin(t * 0.11) * 0.1, p0: -0.32 - rec * 0.25, p1: 0.2, pK: 0.4, roll: Math.sin(t * 0.29) * 0.06 + yo * 0.6,
      lW: -0.32 + sc * 0.17 + rec * 0.35, sW: 0.22 + sc2 * 0.16, lE: -0.32 + sc * 0.17 + rec * 0.35, sE: 0.22 + sc2 * 0.16, inhale: 0, throat: 0, over: 0, alpha: 1, faceK: 0.55, flex: 0 };
    if (name === 'enter') Object.assign(P, { hy: C.y - 16, hz: -7, alpha: 0, p0: 0.5, p1: 0.5 });
    else if (name === 'bow') Object.assign(P, { hy: C.y - 6.3, hz: 1.6 + Math.sin(t * 0.5) * 0.12 + rec * 0.6, p0: 0.05 - rec * 0.2, p1: 0.45, lW: -0.2 + sc * 0.06, sW: 0.35, lE: -0.2 + sc * 0.06, sE: 0.35 });
    else if (name === 'sweep' && M.sw) { const sd = M.sw.side, key = sd < 0 ? 'W' : 'E', ok = sd < 0 ? 'E' : 'W'; Object.assign(P, { hx: C.x - sd * (4.6 - (M.sw.k > 0 ? 1.5 : 0)), hy: C.y - 8.6 + (M.sw.k > 0 ? 1.4 : 0), hz: 3.4, roll: sd * 0.3, ['l' + key]: 1.35, ['s' + key]: -0.45, ['l' + ok]: -0.55, ['s' + ok]: 0.1, faceK: 0.75 }); }
    else if (name === 'inhale') Object.assign(P, { hy: C.y - 9.0, hz: 4.6 + Math.sin(t * 0.5) * 0.15, p0: -0.4, p1: 0.32, inhale: 1, lW: 0.1 + sc * 0.08, lE: 0.1 + sc * 0.08, sW: 0.05, sE: 0.05 });
    else if (name === 'exhale') Object.assign(P, { hy: C.y - 8.4, hz: 3.9, p0: -0.05, p1: 0.38, inhale: 0, lW: -0.1, lE: -0.1, sW: -0.3, sE: -0.3 });
    else if (name === 'over' && M.rs) { const sd = M.rs.safe; Object.assign(P, { hx: C.x - sd * 4.2, hy: C.y + 8.4, hz: 10.5 - (M.dip || 0) * 2.2 + Math.sin(t * 0.5) * 0.3, yaw0: -Math.PI / 2 + sd * 0.06, yawK: -sd * 0.1, p0: 0.02, p1: 0.07, pK: 0.6, roll: 0, lW: 0.05 + sc * 0.1, sW: -0.12, lE: 0.05 + sc * 0.1, sE: -0.12, over: 1, faceK: 0.35 }); }
    else if (name === 'stun' && M.stunPt) { const S2 = M.stunPt; Object.assign(P, { hx: S2.x - yo * 1.5, hy: S2.y + 1.3, hz: 4.6 + Math.sin(t * 2.2) * 0.15, yaw0: -Math.PI / 2 + yo * 0.8 + Math.sin(t * 1.7) * 0.08, yawK: 0.3 * Math.sign(yo || 1), p0: -1.0, p1: 0.62, pK: 0.38, roll: Math.sin(t * 2.6) * 0.1, throat: 1, lW: 0.55 + Math.sin(t * 3.1) * 0.35, sW: 0.35, lE: 0.55 + Math.sin(t * 3.1 + 1.4) * 0.35, sE: 0.35, faceK: 0.7 }); }
    if (M.dip) M.dip = Math.max(0, M.dip - 0.02);
    return P; }
  /* ---------- the whale in three dimensions ---------- */
  function dirAt(P, s, bt) { const yaw = P.yaw0 + P.yawK * s * s + 0.06 * Math.sin(bt * 0.55 - s * 3) * s, pt = P.p0 + (P.p1 - P.p0) * smooth(s / Math.max(0.05, P.pK)) + 0.16 * Math.sin(bt * 0.72 - s * 4.2) * s * s; return [Math.cos(yaw) * Math.cos(pt), Math.sin(yaw) * Math.cos(pt), Math.sin(pt)]; }
  function build(P, bt, M) {
    const frs = [], rings = []; let pos = [P.hx, P.hy, P.hz]; const swell = Math.sin(bt * 0.8) * 0.03;
    for (let k = 0; k < SG.length; k++) { const s = SG[k];
      if (k > 0) { const s0 = SG[k - 1], d = dirAt(P, (s + s0) / 2, bt); pos = add(pos, mul(d, (s - s0) * L)); }
      const d = dirAt(P, s, bt), v0 = norm([-d[1], d[0], 0]), u0 = cross(d, v0), rl = P.roll * (1 - s * 0.7), cr = Math.cos(rl), sr = Math.sin(rl), v = add(mul(v0, cr), mul(u0, sr)), u = sub(mul(u0, cr), mul(v0, sr));
      const sw = 1 + (s > 0.12 && s < 0.6 ? swell : 0), bump = Math.exp(-(((s - 0.15) / 0.12) ** 2)), w = lin(WT, s) * sw * (1 + P.inhale * 0.12 * bump), hU = lin(HUT, s) * sw, hL = lin(HLT, s) * sw * (1 + P.inhale * 0.42 * bump);
      const ring = []; for (let j = 0; j < NS; j++) { const ph = j / NS * TAU, cs = Math.cos(ph), sn = Math.sin(ph); ring.push(add(pos, add(mul(v, cs * w), mul(u, sn * (sn > 0 ? hU : hL))))); }
      rings.push(ring); frs.push({ c: pos, d, v, u, w, hU, hL, s }); }
    const G = { frs, rings, P };
    G.snout = frs[0].c; G.chin = surf(G, 0.07, -Math.PI / 2, 0).p;
    G.fins = { '-1': fin(G, -1, P.lW, P.sW, P.flex || 0, P.faceK), '1': fin(G, 1, P.lE, P.sE, P.flex || 0, P.faceK) };
    // the fluke: two broad lobes beating up and down at the end of the tail stock
    { const F = frs[frs.length - 1], beat = 0.4 * Math.sin(bt * 0.72 - 4.6), dd = norm(add(mul(F.d, Math.cos(beat)), mul(F.u, Math.sin(beat)))), side = F.v, sc = 1.0;
      const pts = FLUKE.map(([x, y]) => add(F.c, add(mul(side, x * sc), mul(dd, y * sc)))).concat(FLUKE.slice().reverse().map(([x, y]) => add(F.c, add(mul(side, -x * sc), mul(dd, y * sc)))));
      let n = norm(cross(side, dd)); if (dot(n, F.u) < 0) n = mul(n, -1); G.fluke = { pts, n }; }
    // its shadow, straight down on the snow: the body, the fins, the fluke
    { const Lp = [], Rp = []; frs.forEach(F => { const vh = norm([F.v[0], F.v[1], 0]); Lp.push([F.c[0] + vh[0] * F.w, F.c[1] + vh[1] * F.w]); Rp.push([F.c[0] - vh[0] * F.w, F.c[1] - vh[1] * F.w]); });
      G.shadow = [Lp.concat(Rp.reverse()), G.fins['-1'].pts.map(p => [p[0], p[1]]), G.fins['1'].pts.map(p => [p[0], p[1]]), G.fluke.pts.map(p => [p[0], p[1]])]; }
    return G; }
  // a frame along the spine at s, interpolated between rings
  function frameAt(G, s) { const F = G.frs; let k = 0; while (k < F.length - 2 && F[k + 1].s < s) k++; const A = F[k], B = F[k + 1], u = clamp((s - A.s) / (B.s - A.s), 0, 1); return { c: mix3(A.c, B.c, u), d: norm(mix3(A.d, B.d, u)), v: norm(mix3(A.v, B.v, u)), u: norm(mix3(A.u, B.u, u)), w: lerp(A.w, B.w, u), hU: lerp(A.hU, B.hU, u), hL: lerp(A.hL, B.hL, u) }; }
  // a point on the hide at s and angle ph round the spine (0 its right side, pi/2 its back), and the hide's normal there
  function surf(G, s, ph, out) { const F = frameAt(G, s), cs = Math.cos(ph), sn = Math.sin(ph), h = sn > 0 ? F.hU : F.hL, n = norm(add(mul(F.v, cs / Math.max(0.2, F.w)), mul(F.u, sn / Math.max(0.2, h)))); return { p: add(add(F.c, add(mul(F.v, cs * F.w), mul(F.u, sn * h))), mul(n, out || 0)), n }; }
  function fin(G, sd, lift, sweep, flex, faceK) { const F = frameAt(G, SF), ph = sd > 0 ? -0.42 : Math.PI + 0.42, root = add(F.c, add(mul(F.v, Math.cos(ph) * F.w * 0.9), mul(F.u, Math.sin(ph) * F.hL * 0.9)));
    const a0 = norm(add(mul(F.v, sd * Math.cos(lift)), mul(F.u, Math.sin(lift)))), top0 = norm(add(mul(F.v, -sd * Math.sin(lift)), mul(F.u, Math.cos(lift))));
    const a = norm(sub(mul(a0, Math.cos(sweep)), mul(F.d, Math.sin(sweep)))), c0 = norm(sub(F.d, mul(a, dot(F.d, a))));
    // (turned a little toward the camera, so the broad blade reads rather than its edge)
    const nd = norm(sub(VIEW, mul(a, dot(VIEW, a)))); let cd = norm(cross(nd, a)); if (dot(cd, c0) < 0) cd = mul(cd, -1);
    let ch = norm(add(mul(c0, 1 - faceK), mul(cd, faceK))); ch = norm(sub(ch, mul(a, dot(ch, a))));
    let nf = norm(cross(a, ch)); if (dot(nf, top0) < 0) nf = mul(nf, -1);
    const pts = FINP.map(([t, q]) => add(root, add(mul(a, t * LF), add(mul(ch, q * CF * (1 - t * 0.12)), mul(nf, flex * t * t * 2.2)))));
    return { pts, root, a, ch, nf, tip: add(root, mul(a, LF)), lead: pts.slice(0, 7) }; }
  function throatAt(M) { const G = M.G; if (!G) return null; return surf(G, 0.11, -Math.PI / 2, 0.1).p; }
  function headParts(m, M) { const G = M.G; if (!G) return []; const h = G.frs[5].c, f = G.frs[3].c; return [RiftFiend.hit('head', h, 2.6, m), RiftFiend.hit('snout', f, 1.8, m)]; }

  /* the shading: cel bands from the light above, a green rim where the hide turns from the camera */
  function band(n, B, rimOK) { const l = dot(n, LIGHT), vv = dot(n, VIEW); if (rimOK && vv < 0.2 && l < 0.35) return B.rim; return l > 0.74 ? B.hi : l > 0.2 ? B.base : l > -0.3 ? B.shade : B.deep; }
  function paintWhale(c, FX, m, P3, T, t) {
    const M = FX.mem, G = M.G; if (!G) return; const P = G.P, bt = M.bt || t, rings = G.rings, NR = rings.length, lw = Math.max(1.2, T * 0.075), items = [], vis = [], thr = P.throat || 0, pul = 0.6 + 0.4 * Math.sin(bt * 5);
    const Q = p => P3(p[0], p[1], p[2]), dep = p => p[1] + p[2];
    // the body's faces
    for (let k = 0; k < NR - 1; k++) { vis.push([]); const A = rings[k], B = rings[k + 1], ax = mix3(G.frs[k].c, G.frs[k + 1].c, 0.5);
      for (let j = 0; j < NS; j++) { const j2 = (j + 1) % NS, pts = [A[j], A[j2], B[j2], B[j]]; let n = norm(cross(sub(B[j2], A[j]), sub(B[j], A[j2]))); const cen = mul(add(add(pts[0], pts[1]), add(pts[2], pts[3])), 0.25); if (dot(n, sub(cen, ax)) < 0) n = mul(n, -1);
        const v = dot(n, VIEW) > 0.01; vis[k].push(v); if (!v) continue;
        const ph = (j + 0.5) / NS * TAU, sk = G.frs[k].s, belly = Math.sin(ph) < (sk < 0.24 ? -0.12 : -0.3) && k > 0; let col = band(n, belly ? BELLY_B : NAVY_B, true);
        if (belly && thr > 0.02 && G.frs[k].s < 0.34) col = K.mixC(col, GREEN, thr * (0.35 + 0.25 * pul));
        items.push({ d: dep(cen), f: () => { c.beginPath(); pts.forEach((p, i) => { const q = Q(p); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = col; c.lineWidth = 1.1; c.stroke(); } }); } }
    let dMax = -1e9; items.forEach(it => { if (it.d > dMax) dMax = it.d; });
    // the outline: where a face turned to the camera meets one turned away, and the end of the tail stock
    items.push({ d: dMax + 0.01, f: () => { c.beginPath(); for (let k = 0; k < NR - 1; k++) for (let j = 0; j < NS; j++) { const j2 = (j + 1) % NS; if (vis[k][j] !== vis[k][j2]) { const a = Q(rings[k][j2]), b = Q(rings[k + 1][j2]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } } const k = NR - 2; for (let j = 0; j < NS; j++) if (vis[k][j]) { const a = Q(rings[k + 1][j]), b = Q(rings[k + 1][(j + 1) % NS]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.strokeStyle = INK2; c.lineWidth = lw * 1.3; c.lineCap = 'round'; c.stroke(); } });
    // the mouth: a long curving line from the blunt snout back under the bands of lights
    items.push({ d: dMax + 0.02, f: () => { c.strokeStyle = INK2; c.lineWidth = lw; c.lineCap = 'round'; for (const sd of [1, -1]) { c.beginPath(); let on = false; for (let i = 0; i <= 12; i++) { const s = 0.008 + i / 12 * 0.19, ph0 = -0.34 - (s > 0.15 ? (s - 0.15) * 9 : 0), ph = sd > 0 ? ph0 : Math.PI - ph0, S2 = surf(G, s, ph, 0.02); if (dot(S2.n, VIEW) < 0.02) { on = false; continue; } const q = Q(S2.p); on ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); on = true; } c.stroke(); } } });
    // the throat: pleats down the white of it, glowing green when it is bared
    items.push({ d: dMax + 0.03, f: () => { c.save(); c.lineCap = 'round'; for (let i = -3; i <= 3; i++) { const ph = -Math.PI / 2 + i * 0.24; c.beginPath(); let on = false; for (let s = 0.03; s <= 0.33; s += 0.03) { const S2 = surf(G, s, ph, 0.02); if (dot(S2.n, VIEW) < 0.05) { on = false; continue; } const q = Q(S2.p); on ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); on = true; } c.strokeStyle = thr > 0.05 ? '#2E8F74' : 'rgba(120,150,175,.7)'; c.lineWidth = lw * 0.7; c.stroke(); if (thr > 0.05) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = GREEN_HI; c.globalAlpha = thr * pul; c.lineWidth = lw * 0.9; c.stroke(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; } }
      if (thr > 0.05) { const S2 = surf(G, 0.14, -Math.PI / 2, 0.1); if (dot(S2.n, VIEW) > 0) { const q = Q(S2.p); K.glow(c, q[0], q[1], T * 3.4, GREEN, thr * 0.55 * pul); } } c.restore(); } });
    // the bands of green lights behind its jaw, in place of eyes
    items.push({ d: dMax + 0.04, f: () => { const ek = M.eyeK == null ? 1 : M.eyeK; for (const sd of [1, -1]) for (let i = 0; i < 7; i++) { const s = 0.128 + i * 0.005 + i * i * 0.0014, ph0 = 0.36 - i * 0.16, S2 = surf(G, s, sd > 0 ? ph0 : Math.PI - ph0, 0.05); if (dot(S2.n, VIEW) < 0.03) continue; const q = Q(S2.p), f = 0.7 + 0.3 * Math.sin(bt * 3 + i * 0.9 + sd); K.glow(c, q[0], q[1], T * 0.55, GREEN, 0.7 * f * ek); c.fillStyle = GREEN_HI; c.beginPath(); c.arc(q[0], q[1], Math.max(1.4, T * 0.12), 0, TAU); c.fill(); }
      // a glossy catch of light on the broad skull
      { const S2 = surf(G, 0.075, Math.PI / 2 + 0.25, 0.02); if (dot(S2.n, VIEW) > 0.1) { const q = Q(S2.p); TN.spec(c, q[0], q[1], T * 0.55, -0.4, 0.5); } } } });
    // the vents: five down each flank, pulsing in a wave from head to tail (all flaring when it exhales)
    items.push({ d: dMax + 0.05, f: () => { c.save(); c.lineCap = 'round'; const vk = M.ventK || 0; for (const sd of [1, -1]) for (let i = 0; i < 5; i++) { const s = 0.3 + i * 0.065, ph0 = 0.62, ph = sd > 0 ? ph0 : Math.PI - ph0, A = surf(G, s - 0.017, ph, 0.04), B = surf(G, s + 0.017, ph, 0.04); if (dot(A.n, VIEW) < 0.04) continue; const a = Q(A.p), b = Q(B.p), k = clamp(0.35 + 0.65 * Math.max(0, Math.sin(bt * 1.5 - i * 0.85)) + vk * 0.6 + (P.inhale || 0) * 0.3, 0, 1.4);
        c.strokeStyle = '#0E3A3A'; c.lineWidth = Math.max(3, T * 0.32); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GREEN_HI; c.globalAlpha = Math.min(1, 0.45 + k * 0.5); c.lineWidth = Math.max(1.8, T * 0.17); c.stroke(); c.globalAlpha = 1; K.glow(c, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, T * (0.8 + k * 0.6), GREEN, 0.45 * k); c.globalCompositeOperation = 'source-over'; } c.restore(); } });
    // the ridge: faceted ice plates down the spine, light running along them
    for (let i = 0; i < 9; i++) { const s0 = 0.25 + i * 0.05, s1 = s0 + 0.038, sm = (s0 + s1) / 2, A = surf(G, s0, Math.PI / 2, -0.05).p, B = surf(G, s1, Math.PI / 2, -0.05).p, Mf = frameAt(G, sm), top = surf(G, sm - 0.006, Math.PI / 2, 0).p, hgt = 0.55 + 0.25 * Math.sin(i * 1.7) + (i > 2 && i < 6 ? 0.15 : 0), ap = add(top, mul(Mf.u, hgt)), Lp = add(top, mul(Mf.v, 0.42)), Rp = add(top, mul(Mf.v, -0.42));
      const tris = [[A, Lp, ap], [Lp, B, ap], [A, ap, Rp], [ap, B, Rp]], glint = Math.max(0, Math.sin(bt * 1.2 - i * 0.55)) ** 12;
      items.push({ d: dep(ap) + 0.2, f: () => { for (const tr of tris) { let n = norm(cross(sub(tr[1], tr[0]), sub(tr[2], tr[0]))); const cen = mul(add(add(tr[0], tr[1]), tr[2]), 1 / 3); if (dot(n, sub(cen, Mf.c)) < 0) n = mul(n, -1); if (dot(n, VIEW) < 0) continue; c.beginPath(); tr.forEach((p, j) => { const q = Q(p); j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); c.fillStyle = band(n, ICE_B, false); c.fill(); c.strokeStyle = '#2E5578'; c.lineWidth = lw * 0.6; c.stroke(); }
        if (glint > 0.05) { const q = Q(ap); TN.twinkle(c, q[0], q[1], T * 0.45 * glint, '#FFFFFF', glint); K.glow(c, q[0], q[1], T * 0.9, ICE_HI, glint * 0.6); } } }); }
    // the fins: broad blades tapering into three squared tips; navy above, white beneath
    for (const sd of [-1, 1]) { const Fn = G.fins[sd], cen = Fn.pts.reduce((a, p) => add(a, mul(p, 1 / Fn.pts.length)), [0, 0, 0]), up = dot(Fn.nf, VIEW) > 0, n = up ? Fn.nf : mul(Fn.nf, -1), B = up ? FIN_B : BELLY_B, glow = M.finGlow ? M.finGlow[String(sd)] || 0 : 0;
      items.push({ d: dep(cen), f: () => { const sp = Fn.pts.map(Q), r0 = Q(Fn.root), r1 = Q(Fn.tip), base = band(n, B, false); let col = base; if (up) { col = c.createLinearGradient(r0[0], r0[1], r1[0], r1[1]); col.addColorStop(0, NAVY_B.base); col.addColorStop(0.06, NAVY_B.base); col.addColorStop(0.24, base); col.addColorStop(1, base); }
        TN.shape(c, TN.poly(sp), { col, shade: up ? FIN_B.deep : BELLY_B.shade, hi: '#FFFFFF', line: INK2, lw, r: T * 1.5, d1: 0.1, d2: 0.18, force: true });
        const lead = Fn.lead.map(Q); c.save(); c.lineCap = 'round'; c.strokeStyle = up ? 'rgba(207,232,244,.65)' : 'rgba(255,255,255,.9)'; c.lineWidth = lw * 0.9; c.beginPath(); lead.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke();
          if (glow > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = glow * (0.6 + 0.4 * Math.sin(t * 12)); c.strokeStyle = GREEN_HI; c.lineWidth = lw * 2.6; c.stroke(); lead.forEach((q, i) => { if (i % 2) return; K.glow(c, q[0], q[1], T * 1.2, GREEN, glow * 0.5); }); } c.restore(); } }); }
    // the fluke, far behind
    { const Fl = G.fluke, cen = Fl.pts.reduce((a, p) => add(a, mul(p, 1 / Fl.pts.length)), [0, 0, 0]), up = dot(Fl.n, VIEW) > 0, n = up ? Fl.n : mul(Fl.n, -1);
      items.push({ d: dep(cen), f: () => TN.shape(c, TN.blob(Fl.pts.map(Q)), { col: band(n, up ? NAVY_B : BELLY_B, false), shade: up ? NAVY_B.deep : BELLY_B.shade, hi: up ? NAVY_B.hi : '#FFFFFF', line: INK2, lw, r: T * 1.2, d1: 0.1, d2: 0.18, force: true }) }); }
    // the six tendrils under its chin, drifting
    for (let i = 0; i < 6; i++) { const ph = -Math.PI / 2 + (i - 2.5) * 0.3, S2 = surf(G, 0.055 + Math.abs(i - 2.5) * 0.008, ph, -0.05), root = S2.p, n = 5, pts = [root];
      for (let k = 1; k <= n; k++) { const pr = pts[k - 1], sw = Math.sin(bt * 0.8 + i * 1.3 + k * 0.5) * 0.12 * k, sw2 = Math.cos(bt * 0.6 + i * 0.7 + k * 0.4) * 0.08 * k; pts.push([pr[0] + sw * 0.45 + (i - 2.5) * 0.03, pr[1] + 0.06 + sw2 * 0.6 + (thr ? 0.2 : 0), pr[2] - 0.34 * (1 - thr * 0.4)]); }
      items.push({ d: dep(root) - 0.4, f: () => { const sp = pts.map(Q); TN.tubeLite(c, sp, u => Math.max(1, T * (0.1 - u * 0.065)), { col: '#D6F2E6', shade: '#93C7B8', hi: '#FFFFFF', line: '#2E5578', lw: lw * 0.5, r: T * 0.1, force: true }); const tp = sp[sp.length - 1]; K.glow(c, tp[0], tp[1], T * 0.5, GREEN, 0.6 + 0.3 * Math.sin(bt * 2 + i)); c.fillStyle = GREEN_HI; c.beginPath(); c.arc(tp[0], tp[1], Math.max(1.1, T * 0.065), 0, TAU); c.fill(); } }); }
    items.sort((a, b) => a.d - b.d); c.save(); c.lineJoin = 'round'; for (const it of items) it.f(); c.restore();
    // struck: a white flash over the whole of it
  }
  // the whale is painted whole off screen and laid down at once (faded high overhead, so the summit reads through it)
  function drawWhale(c, FX, m, T, t) { const M = FX.mem, P = M.G && M.G.P; if (!P || P.alpha < 0.02) return; const a = clamp(P.alpha, 0, 1) * (1 - 0.4 * clamp(P.over, 0, 1)), fl = m.flash > 0, P3 = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T];
    if (a > 0.97 && !fl) { paintWhale(c, FX, m, P3, T, t); return; }
    const cv = c.canvas, tr = c.getTransform(); if (!offCv) offCv = document.createElement('canvas'); if (offCv.width !== cv.width || offCv.height !== cv.height) { offCv.width = cv.width; offCv.height = cv.height; }
    const g = offCv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, offCv.width, offCv.height); g.setTransform(tr); paintWhale(g, FX, m, P3, T, t);
    if (fl) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,248,240,.32)'; g.fillRect(0, 0, offCv.width, offCv.height); g.globalCompositeOperation = 'source-over'; }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha *= a; c.drawImage(offCv, 0, 0); c.restore(); }
  // previews and the art sheet: a fight-less pose about the given anchor
  function demoPaint(c, FX, m, X, Y, T, t) { const C = FX.C || { x: m.x, y: m.y + 8 }, M = FX.mem || {}; const F2 = { C, mem: M, me: { x: C.x, y: C.y + 4 } }; if (!M.P) { M.bt = M.bt || 0; M.recoil = 0; if (M.demoSweep) M.sw = { side: -1, k: 0 }; if (M.demoStun) M.stunPt = { x: C.x, y: C.y - 5 }; M.P = pose(F2, M.demoStun ? 'stun' : M.demoInhale ? 'inhale' : M.demoSweep ? 'sweep' : 'perch'); M.P.flex = 0; M.P.alpha = 1; M.eyeK = 1; M.finGlow = { '-1': M.demoSweep ? 1 : 0, '1': 0 }; }
    M.G = build(M.P, M.bt || 0, M); const P3 = TN.cam(X, Y, T, m); paintWhale(c, F2, m, P3, T, t); }

  /* ---------- the effects over the summit: the whale, the chain, the ember, the motes, the targets ---------- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m, C = FX.C; if (!m || !M.G) return; c.save();
    // the starfall: motes high over their rings, falling faster toward the end
    for (const s of FX.S.tele) { if (s.done || !s.mote) continue; const u = clamp(s.age / s.t, 0, 1), X = FX.sx(s.x), Y = FX.sy(s.y) - (1 - u * u) * T * 12; TN.twinkle(c, X, Y, T * 0.35, '#FFFFFF', 0.95); K.glow(c, X, Y, T * 0.9, ICE_HI, 0.6); c.strokeStyle = 'rgba(207,232,244,.5)'; c.lineWidth = T * 0.12; c.beginPath(); c.moveTo(X, Y - T * 1.6); c.lineTo(X, Y - T * 0.3); c.stroke(); }
    drawWhale(c, FX, m, T, t);
    // the breath: a stream of pale frost rolling out of its mouth over the summit
    if (M.br && M.br.st === 'exhale' && M.frost) { const sn = M.G.snout, X0 = FX.sx(sn[0]), Y0 = FX.sy(sn[1]) - sn[2] * T, tx = FX.sx(C.x), ty = FX.sy(C.y + 3), Z = M.frost, fade = clamp(Z.age / 0.3, 0, 1) * clamp((Z.life - Z.age) / 0.8, 0, 1);
      c.save(); c.globalAlpha = fade; for (let k = 0; k < 21; k++) { const u = (t * 0.8 + k / 21) % 1, sp = ((k % 3) - 1) * u * T * 6, x = lerp(X0, tx, u) + sp, y = lerp(Y0, ty, u) + Math.sin(k * 2.1 + t * 3) * T * 0.5, r = T * (0.5 + u * 2.3); c.fillStyle = `rgba(150,195,225,${0.3 * (1 - u * 0.7)})`; c.beginPath(); c.arc(x, y + r * 0.15, r, 0, TAU); c.fill(); c.fillStyle = `rgba(236,246,252,${0.6 * (1 - u * 0.7)})`; c.beginPath(); c.arc(x - r * 0.12, y - r * 0.1, r * 0.82, 0, TAU); c.fill(); if (k % 4 === 0) TN.twinkle(c, x + r * 0.3, y - r * 0.2, T * 0.25, '#FFFFFF', 0.8 * (1 - u)); } c.restore(); }
    // the lit shelter: a column of light over its hearth, named, and an arrow at the screen's edge while it is off it
    { const lit = M.br && M.br.st === 'inhale' ? [M.br.k, EMBER] : M.rs && m.act === 'rise' ? [M.rs.k, GREEN_HI] : null;
      if (lit) { const N = nookAt(C, lit[0]), X = FX.sx(N[0]), Y = FX.sy(N[1]), pu = 0.5 + 0.5 * Math.sin(t * 4), g = c.createLinearGradient(0, Y - T * 7, 0, Y); g.addColorStop(0, K.rgba(lit[1], 0)); g.addColorStop(1, K.rgba(lit[1], 0.32 + 0.12 * pu)); c.save(); c.fillStyle = g; c.fillRect(X - T * 1.1, Y - T * 7, T * 2.2, T * 7); c.restore(); label(c, 'SHELTER', X, Y - T * 4.2, T, lit[1]);
        const V = K.viewBox(c, 0), x0 = V[0] + 30, x1 = V[2] - 30, y0 = V[1] + 150, y1 = V[3] - 170; if (X < x0 || X > x1 || Y < y0 || Y > y1) { const ex = clamp(X, x0, x1), ey = clamp(Y, y0, y1), a = Math.atan2(Y - ey, X - ex); c.save(); c.translate(ex, ey); c.fillStyle = lit[1]; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill(); c.stroke(); c.rotate(a); c.fillStyle = INK; c.beginPath(); c.moveTo(9, 0); c.lineTo(-4, -7); c.lineTo(-4, 7); c.closePath(); c.fill(); c.restore(); label(c, 'SHELTER', ex, ey + 28, 26, '#FFFFFF'); } } }
    // the chain from its chin down to the anchor
    const Tt = M.teth; if (Tt && Tt.o && !Tt.o.dead) { const a = [FX.sx(Tt.o.x), FX.sy(Tt.o.y) - T * 2.2], ch = M.G.chin, b = [FX.sx(ch[0]), FX.sy(ch[1]) - ch[2] * T]; c.save(); c.lineCap = 'round'; c.globalAlpha = 0.9; for (let i = 0; i <= 14; i++) { const u = i / 14, x = lerp(a[0], b[0], u) + Math.sin(u * Math.PI) * T * 0.8 * Math.sin(t * 2), y = lerp(a[1], b[1], u) + Math.sin(u * Math.PI) * T * 1.2; c.strokeStyle = INK2; c.lineWidth = Math.max(2.5, T * 0.16); c.beginPath(); c.ellipse(x, y, T * 0.22, T * 0.14, i % 2 ? 0.6 : -0.6, 0, TAU); c.stroke(); c.strokeStyle = i % 2 ? ICE_HI : '#E8F6FC'; c.lineWidth = Math.max(1.2, T * 0.07); c.stroke(); } c.globalCompositeOperation = 'lighter'; K.glow(c, b[0], b[1], T * 1.6, GREEN, 0.5); c.restore(); }
    // the star ember: on its pedestal, carried over the pet's head, or set down in a hearth
    { const E = M.ember, X = FX.sx(E.x), Y = FX.sy(E.y) - T * (E.st === 'carry' ? 2.0 : 1.0) - Math.sin(t * 3) * T * 0.12, need = M.br && M.br.st === 'inhale' && E.st !== 'placed';
      K.glow(c, X, Y, T * (1.6 + (need ? 0.6 * Math.sin(t * 6) : 0)), EMBER, 0.75); drawStar(c, X, Y, T * 0.42, t); if (need && E.st === 'rest') { label(c, 'STAR EMBER', X, Y - T * 0.8, T, EMBER_HI); } }
    // the warm bubble: a dome of amber light over the hearth
    if (M.bubble) { const B = M.bubble, X = FX.sx(B.x), Y = FX.sy(B.y), r = B.r * T * Math.min(1, B.t / 0.4); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 + 0.05 * Math.sin(t * 3); c.fillStyle = EMBER; c.beginPath(); c.ellipse(X, Y - r * 0.15, r, r * 0.95, 0, Math.PI, TAU); c.ellipse(X, Y, r, r * 0.45, 0, 0, Math.PI); c.fill(); c.globalAlpha = 0.6; c.strokeStyle = EMBER_HI; c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.ellipse(X, Y - r * 0.15, r, r * 0.95, 0, Math.PI, TAU); c.stroke(); c.restore(); }
    // targets: the bared throat; the head while it rests low
    if (m.stunT > 0 && FX.S.weak.throat && !FX.S.weak.throat.dead) { const w = FX.S.weak.throat, X = FX.sx(w.x), Y = FX.sy(w.y), pu = 0.5 + 0.5 * Math.sin(t * 7); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GREEN_HI; c.globalAlpha = 0.6 + 0.4 * pu; c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); c.arc(X, Y, T * (1.5 + pu * 0.3), 0, TAU); c.stroke(); c.restore(); label(c, 'THROAT', X, Y - T * 2.0, T, GREEN_HI); }
    else if (m.act === 'bow' && M.headC) { const h = M.headC, X = FX.sx(h[0]), Y = FX.sy(h[1]) - h[2] * T, pu = 0.5 + 0.5 * Math.sin(t * 5); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GREEN_HI; c.globalAlpha = 0.35 + 0.3 * pu; c.lineWidth = Math.max(2, T * 0.1); c.setLineDash([T * 0.4, T * 0.3]); c.lineDashOffset = -t * T; c.beginPath(); c.ellipse(X, Y, T * 3.0, T * 2.2, 0, 0, TAU); c.stroke(); c.restore(); }
    c.restore(); }
  function label(c, s, X, Y, T, col) { c.save(); c.font = `900 ${Math.max(10, Math.round(T * 0.42))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(s, X, Y); c.fillStyle = col; c.fillText(s, X, Y); c.restore(); }
  function drawStar(c, X, Y, r, t) { c.save(); c.translate(X, Y); c.rotate(Math.sin(t * 1.3) * 0.2); c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fillStyle = EMBER; c.fill(); c.strokeStyle = '#7A4A1A'; c.lineWidth = Math.max(1.2, r * 0.12); c.stroke(); c.fillStyle = EMBER_HI; c.beginPath(); c.arc(-r * 0.1, -r * 0.12, r * 0.28, 0, TAU); c.fill(); c.restore(); }

  /* ---------- the ground's living layer: the sweep's half, the shelters lit, the whale's shadow, the pedestal ---------- */
  function drawOverlay(c, FX, t, T) { const M = FX.mem, C = FX.C, m = FX.m; if (!M || !M.G) return; const X0 = FX.sx(C.x), Y0 = FX.sy(C.y);
    if (M.hd) { const left = M.hd.left + M.hd.list.length, Xs = FX.sx(FX.me.x), Ys = FX.sy(FX.me.y) - T * 2.1; c.save(); c.font = `800 ${Math.round(T * 0.44)}px ${arcFont}`; c.textAlign = "center"; c.lineWidth = 4; c.strokeStyle = "rgba(0,0,0,.65)"; c.fillStyle = GREEN_HI; const s2 = `THE HORDE · ${left} left`; c.strokeText(s2, Xs, Ys); c.fillText(s2, Xs, Ys); c.restore(); }
    const plat = () => { c.beginPath(); c.ellipse(X0, Y0, RX * T, RY * T, 0, 0, TAU); };
    // the whale's shadow on the snow: faint while it hangs off the rim, deep and edged when it is overhead
    { const S = M.G.shadow, ov = clamp(M.G.P.over || 0, 0, 1), rs = m && m.act === 'rise' && M.rs, warn = rs ? clamp((FX.S.t - M.rs.t0) / 6.6, 0, 1) : 0; c.save(); plat(); c.clip(); c.fillStyle = `rgba(10,26,51,${0.13 + ov * 0.33})`; c.beginPath(); for (const poly of S) { poly.forEach(([x, y], i) => { const X = FX.sx(x), Y = FX.sy(y); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); } c.fill('nonzero');
      if (warn > 0) { c.strokeStyle = `rgba(207,232,244,${0.35 + 0.45 * Math.abs(Math.sin(t * (4 + warn * 10)))})`; c.lineWidth = Math.max(2, T * 0.12); c.stroke(); } c.restore(); }
    // the sweep: the threatened half frosted over, chevrons running the way the fin will come
    if (M.sw && !(M.sw.k > 0)) { const S2 = M.sw, u = clamp((FX.S.t - (S2.t0 || (S2.t0 = FX.S.t))) / S2.W, 0, 1), sd = S2.side; c.save(); plat(); c.clip(); c.beginPath(); c.rect(sd < 0 ? X0 - RX * T - 4 : X0 + 0.5 * T, Y0 - RY * T - 4, RX * T - 0.5 * T + 4, RY * T * 2 + 8); c.clip();
      c.fillStyle = `rgba(60,120,175,${0.1 + u * 0.18})`; c.fillRect(X0 - RX * T - 4, Y0 - RY * T - 4, RX * T * 2 + 8, RY * T * 2 + 8);
      c.strokeStyle = `rgba(40,95,150,${0.35 + 0.4 * u})`; c.lineWidth = Math.max(2, T * 0.12); const off = (t * 2.4) % 2.4; for (let yy = -RY - 2 + off; yy < RY; yy += 2.4) for (let xx = 2; xx < RX; xx += 3.6) { const X = X0 + sd * xx * T, Y = Y0 + yy * T; c.beginPath(); c.moveTo(X - T * 0.6, Y - T * 0.3); c.lineTo(X, Y + T * 0.3); c.lineTo(X + T * 0.6, Y - T * 0.3); c.stroke(); } c.restore();
      c.save(); c.strokeStyle = `rgba(30,80,130,${0.5 + 0.4 * Math.sin(t * 10) * u})`; c.lineWidth = Math.max(2, T * 0.1); c.setLineDash([T * 0.5, T * 0.3]); c.beginPath(); c.moveTo(X0 + sd * 0.5 * T, Y0 - RY * T * 0.98); c.lineTo(X0 + sd * 0.5 * T, Y0 + RY * T * 0.98); c.stroke(); c.restore(); }
    // the wave of snow the stroke drives across the half
    if (M.wave) { const W2 = M.wave, u = clamp(W2.t / 0.6, 0, 1), sd = W2.side, yy = Y0 + (-RY + u * RY * 2.1) * T; c.save(); plat(); c.clip(); c.beginPath(); c.rect(sd < 0 ? X0 - RX * T - 4 : X0, Y0 - RY * T - 4, RX * T + 4, RY * T * 2 + 8); c.clip(); c.globalAlpha = 1 - clamp((W2.t - 0.6) / 0.3, 0, 1); const g = c.createLinearGradient(0, yy - T * 3, 0, yy + T * 0.5); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.8, 'rgba(240,248,252,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(X0 - RX * T, yy - T * 3, RX * T * 2, T * 3.5); c.restore(); }
    // the pedestal's glow under the ember
    { const px = FX.sx(C.x + PED[0]), py = FX.sy(C.y + PED[1]); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = M.ember.st === 'rest' ? 0.45 + 0.15 * Math.sin(t * 2) : 0.12; blitSized(c, glowSprite(EMBER), px - T * 1.6, py - T * 0.9, T * 3.2, T * 1.8); c.restore(); }
    // a lit shelter: the one the breath spares for the ember, or the one outside the shadow
    const lit = M.br && (M.br.st === 'inhale' || M.br.st === 'exhale') ? { k: M.br.k, col: EMBER, u: M.br.st === 'inhale' ? clamp((FX.S.t - M.br.t0) / M.br.INH, 0, 1) : 1 } : M.rs && m && m.act === 'rise' ? { k: M.rs.k, col: GREEN_HI, u: clamp((FX.S.t - M.rs.t0) / 6.6, 0, 1) } : null;
    if (lit) { const N = nookAt(C, lit.k), X = FX.sx(N[0]), Y = FX.sy(N[1]), pu = 0.5 + 0.5 * Math.sin(t * 5); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.25 * pu; blitSized(c, glowSprite(lit.col), X - T * 2.6, Y - T * 1.8, T * 5.2, T * 3.6); c.globalAlpha = 0.9; c.strokeStyle = lit.col; c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); c.ellipse(X, Y, T * NOOK, T * NOOK * 0.7, 0, 0, TAU); c.stroke(); c.lineWidth = Math.max(2.5, T * 0.16); c.beginPath(); c.ellipse(X, Y, T * (NOOK + 0.5), T * (NOOK + 0.5) * 0.7, 0, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - lit.u)); c.stroke(); c.restore(); } }
  /* the breath's frost over the open summit: a pale crust that advances from the north rim, crystals glinting in it */
  function drawFrost(c, FX, z, T, t) { const M = FX.mem, C = FX.C, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), fade = Math.min(1, z.age / 0.3, Math.max(0, z.life - z.age) / 0.8), front = Y0 + (-RY + Math.min(1, z.age / 0.7) * RY * 2.2) * T;
    c.save(); c.globalAlpha = fade; c.beginPath(); c.ellipse(X0, Y0, RX * T, RY * T, 0, 0, TAU); c.clip(); c.beginPath(); c.rect(X0 - RX * T - 2, Y0 - RY * T - 2, RX * T * 2 + 4, front - (Y0 - RY * T) + 2); if (M.bubble) { const B = M.bubble; c.moveTo(FX.sx(B.x) + B.r * T, FX.sy(B.y)); c.ellipse(FX.sx(B.x), FX.sy(B.y), B.r * T, B.r * T * 0.8, 0, 0, TAU, true); } c.clip('evenodd');
    c.fillStyle = 'rgba(110,170,210,.32)'; c.fillRect(X0 - RX * T, Y0 - RY * T, RX * T * 2, RY * T * 2);
    c.strokeStyle = 'rgba(40,100,150,.55)'; c.lineWidth = Math.max(1.2, T * 0.06); for (const [fx, fy, s, ph] of M.flakes) { const X = X0 + fx * T, Y = Y0 + fy * T, r = s * T * (0.8 + 0.2 * Math.sin(t * 2 + ph)); c.beginPath(); for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3 + ph; c.moveTo(X - Math.cos(a) * r, Y - Math.sin(a) * r * 0.6); c.lineTo(X + Math.cos(a) * r, Y + Math.sin(a) * r * 0.6); } c.stroke(); }
    const g = c.createLinearGradient(0, front - T * 1.5, 0, front); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(60,120,175,.5)'); c.fillStyle = g; c.fillRect(X0 - RX * T, front - T * 1.5, RX * T * 2, T * 1.5); c.restore(); }
  /* the ice anchor: a spike of blue ice frozen into the snow, a green knot of the whale's light in it */
  function drawAnchor(c, FX, o, X, Y, T, t) { const cr = 1 - o.hp / o.maxhp, lw = Math.max(1.2, T * 0.07), pu = 0.5 + 0.5 * Math.sin(t * 4); c.save(); c.fillStyle = 'rgba(30,50,80,.25)'; c.beginPath(); c.ellipse(X, Y + T * 0.1, T * 1.1, T * 0.4, 0, 0, TAU); c.fill();
    TN.shape(c, TN.poly([[X - T * 0.75, Y], [X - T * 0.5, Y - T * 1.4], [X - T * 0.1, Y - T * 2.6], [X + T * 0.35, Y - T * 1.6], [X + T * 0.8, Y]]), { col: ICE_B.base, shade: ICE_B.shade, hi: ICE_B.hi, line: INK2, lw, r: T * 0.9, force: true });
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(X - T * 0.1, Y - T * 2.5); c.lineTo(X - T * 0.05, Y - T * 0.2); c.stroke();
    K.glow(c, X, Y - T * 1.1, T * (1.1 + pu * 0.3), GREEN, 0.6); c.fillStyle = GREEN_HI; c.beginPath(); c.arc(X, Y - T * 1.1, T * 0.18, 0, TAU); c.fill();
    if (cr > 0.25) { c.strokeStyle = INK2; c.lineWidth = lw; c.beginPath(); c.moveTo(X - T * 0.45, Y - T * 1.3); c.lineTo(X - T * 0.05, Y - T * 0.9); c.lineTo(X - T * 0.25, Y - T * 0.4); if (cr > 0.6) { c.moveTo(X + T * 0.3, Y - T * 1.5); c.lineTo(X + T * 0.05, Y - T * 1.0); } c.stroke(); }
    c.restore(); label(c, 'ICE ANCHOR', X, Y - T * 3.0, T * 0.75, '#FFFFFF'); }

  /* ---------- the summit's standing pieces: the buttresses and the telescope ---------- */
  // a buttress: a horseshoe hood of ice blocks round a hearth, tall behind and low in front, two pillars at its mouth
  function drawShelter(c, FX, p, X, Y, T, t) { const nx = p.nx, ny = p.ny, Q = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T], ri = 1.95, ro = 3.15, a0 = p.oa + 0.95, a1 = p.oa + TAU - 0.95, n = 16, lw = Math.max(1.3, T * 0.07), back = p.part === 'back';
    const hAt = a => 0.75 + 1.25 * Math.pow(Math.max(0, -Math.sin(a)), 0.8), segs = [];
    for (let i = 0; i < n; i++) { const b0 = lerp(a0, a1, i / n), b1 = lerp(a0, a1, (i + 1) / n), am = (b0 + b1) / 2; if ((Math.sin(am) < 0) !== back) continue; segs.push([b0, b1, am]); }
    segs.sort((A, B) => Math.sin(A[2]) - Math.sin(B[2]));
    const P = (r, a, z) => Q(nx + Math.cos(a) * r, ny + Math.sin(a) * r, z), fill = (pts, col, seam) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = seam ? col : INK2; c.lineWidth = seam ? 1.2 : lw; c.stroke(); };
    c.save(); c.lineJoin = 'round';
    for (const [b0, b1, am] of segs) { const h0 = hAt(b0), h1 = hAt(b1), lit = Math.cos(am) < 0 ? ICE_B.hi : ICE_B.base, dim = Math.cos(am) < 0 ? ICE_B.base : ICE_B.shade;
      const face = Math.sin(am) > 0 ? [P(ro, b0, 0), P(ro, b1, 0), P(ro, b1, h1), P(ro, b0, h0)] : [P(ri, b0, 0), P(ri, b1, 0), P(ri, b1, h1), P(ri, b0, h0)];
      fill(face, Math.sin(am) > 0 ? dim : Math.cos(am) > 0 ? ICE_B.hi : ICE_B.base, true);
      // (a few big blocks: a darker seam every third segment, a sheen near the top)
      if (segs.indexOf(segs.find(S3 => S3[0] === b0)) % 3 === 0) { c.strokeStyle = 'rgba(46,85,120,.45)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(face[0][0], face[0][1]); c.lineTo(face[3][0], face[3][1]); c.stroke(); }
      fill([P(ri, b0, h0), P(ri, b1, h1), P(ro, b1, h1), P(ro, b0, h0)], '#F6FAFC', true); void lit; }
    // one outline round the hood: its top edges and its foot
    const ord = segs.slice().sort((A, B) => A[0] - B[0]);
    c.strokeStyle = INK2; c.lineWidth = lw; c.beginPath(); for (const r of back ? [ri, ro] : [ro, ri]) { ord.forEach(([b0, b1], i) => { const q0 = P(r, b0, hAt(b0)), q1 = P(r, b1, hAt(b1)); if (i === 0) c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); }); } ord.forEach(([b0, b1], i) => { const r = back ? ri : ro, q0 = P(r, b0, 0), q1 = P(r, b1, 0); if (i === 0) c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); }); c.stroke();
    // the pillars at its mouth: faceted ice, the one toward the north tall
    for (const a of [a0, a1]) { if ((Math.sin(a) < 0.2) !== back) continue; const r = (ri + ro) / 2, cx = nx + Math.cos(a) * r, cy = ny + Math.sin(a) * r, h = Math.sin(a) < 0.2 ? 3.4 : 1.7, s = 0.62, apx = Q(cx - 0.1, cy, h), b = [Q(cx - s, cy + s * 0.6, 0), Q(cx + s, cy + s * 0.6, 0), Q(cx + s * 0.8, cy - s * 0.5, 0), Q(cx - s * 0.8, cy - s * 0.5, 0)], mid = Q(cx, cy + s * 0.75, h * 0.62);
      fill([b[3], b[0], mid, apx], ICE_B.hi); fill([b[0], b[1], mid], ICE_B.base); fill([b[1], b[2], apx, mid], ICE_B.shade); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(mid[0], mid[1]); c.lineTo(apx[0], apx[1]); c.stroke();
      const cap = [Q(cx - s * 0.5, cy, h * 0.82), apx, Q(cx + s * 0.4, cy, h * 0.8)]; c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(cap[0][0], cap[0][1]); c.lineTo(cap[1][0], cap[1][1]); c.lineTo(cap[2][0], cap[2][1]); c.closePath(); c.fill(); }
    c.restore(); }
  // the broken telescope: a brass tube on a stone plinth, its front half snapped and hanging, still aimed at the sky
  function drawScope(c, FX, p, X, Y, T, t) { const C = p.C, bx = C.x + SCOPE[0], by = C.y + SCOPE[1], Q = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T], lw = Math.max(1.3, T * 0.07);
    c.save(); c.lineJoin = 'round'; TN.groundShadow(c, Q(bx, by + 0.2, 0)[0], Q(bx, by + 0.2, 0)[1], T * 1.2, T * 0.4, 0, 0.3);
    const box = (x0, y0, x1, y1, z1, top, side, front) => { const f = [Q(x0, y1, 0), Q(x1, y1, 0), Q(x1, y1, z1), Q(x0, y1, z1)], tp = [Q(x0, y0, z1), Q(x1, y0, z1), Q(x1, y1, z1), Q(x0, y1, z1)]; [[f, front], [tp, top]].forEach(([pts, col]) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }); void side; };
    box(bx - 0.6, by - 0.5, bx + 0.6, by + 0.5, 0.75, '#6A7890', '#3A4458', '#4A5468'); box(bx - 0.35, by - 0.3, bx + 0.35, by + 0.3, 1.15, '#F4F9FB', '#3A4458', '#56647C');
    // aimed at where the whale comes up: north and a little west, rising
    const d = norm([C.x - bx, C.y - 15 - by, 6]), base = [bx, by, 1.25], mid = add(base, mul(d, 1.7)), tube = (a, b, w0, w1, col) => TN.tubeLite(c, [Q(...a), Q(...mix3(a, b, 0.5)), Q(...b)], u => T * lerp(w0, w1, u), { col, shade: '#7A5E2A', hi: '#F2D79A', line: INK, lw, r: T * 0.3, force: true });
    tube(add(base, mul(d, -0.7)), mid, 0.34, 0.4, '#B89A5E');
    // the snapped front: hanging from a bent strap, its cracked lens glinting
    const sw = Math.sin(t * 1.1) * 0.05, f0 = add(mid, [0.15, 0.2, -0.15]), f1 = add(f0, [0.9 + sw, 0.7, -0.75]); tube(f0, f1, 0.42, 0.48, '#A88A50'); c.strokeStyle = INK; c.lineWidth = lw; const m0 = Q(...mid), m1 = Q(...f0); c.beginPath(); c.moveTo(m0[0], m0[1]); c.lineTo(m1[0], m1[1]); c.stroke();
    const ln = Q(...f1); c.fillStyle = '#9FD8EE'; c.strokeStyle = INK; c.beginPath(); c.ellipse(ln[0], ln[1], T * 0.24, T * 0.18, 0.6, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(ln[0] - T * 0.12, ln[1] - T * 0.08); c.lineTo(ln[0] + T * 0.05, ln[1] + T * 0.1); c.stroke();
    const tip = Q(...add(mid, mul(d, 0.15))); c.fillStyle = '#8A7040'; c.beginPath(); c.ellipse(tip[0], tip[1], T * 0.36, T * 0.24, -0.4, 0, TAU); c.fill(); c.stroke();
    const gl = Math.max(0, Math.sin(t * 0.9)) ** 16; if (gl > 0.05) TN.twinkle(c, ln[0] - T * 0.05, ln[1] - T * 0.05, T * 0.5 * gl, '#FFFFFF', gl);
    // a snow cap on the plinth and on the tube
    c.fillStyle = '#FFFFFF'; const s0 = Q(bx - 0.5, by - 0.45, 0.77), s1 = Q(bx + 0.55, by - 0.4, 0.77); c.beginPath(); c.ellipse((s0[0] + s1[0]) / 2, s0[1] - T * 0.04, T * 0.5, T * 0.12, 0, 0, TAU); c.fill(); c.restore(); }

  /* ---------- the summit painted on the ground ---------- */
  function paintSummit(c, A) { const rnd = A.rnd;
    // the glacier falls away under the southern rim: bevelled cliffs of ice going down into the white
    c.save(); const g0 = c.createLinearGradient(0, 2, 0, RY + 4); g0.addColorStop(0, '#5A8AAA'); g0.addColorStop(0.6, '#86B7D0'); g0.addColorStop(1, 'rgba(200,216,230,0)'); c.fillStyle = g0; c.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI, x = Math.cos(a) * RX, y = Math.sin(a) * RY; i ? c.lineTo(x, y) : c.moveTo(x, y); } for (let i = 40; i >= 0; i--) { const a = i / 40 * Math.PI; c.lineTo(Math.cos(a) * RX * 0.92, Math.sin(a) * RY + 3.6 + Math.sin(i * 1.7) * 0.4); } c.closePath(); c.fill();
    c.strokeStyle = 'rgba(46,85,120,.55)'; c.lineWidth = 0.08; for (let i = 1; i < 40; i += 2) { const a = i / 40 * Math.PI, x = Math.cos(a) * RX, y = Math.sin(a) * RY; c.beginPath(); c.moveTo(x, y); c.lineTo(x * 0.95 + (rnd() - 0.5) * 0.6, y + 2.2 + rnd() * 1.2); c.stroke(); } c.restore();
    // the snowfield: wind-packed white, blue in its hollows
    const g = c.createRadialGradient(-2, -1, 2, 0, 0, RX); g.addColorStop(0, '#FAFCFD'); g.addColorStop(0.6, '#EAF2F6'); g.addColorStop(1, '#CFE0EA'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, RX, RY, 0, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.ellipse(0, 0, RX, RY, 0, 0, TAU); c.clip();
    // patches of bare blue glacier ice, cracked
    for (let i = 0; i < 7; i++) { const x = (rnd() * 2 - 1) * RX * 0.75, y = (rnd() * 2 - 1) * RY * 0.7; if (Math.hypot(x - PED[0], y - PED[1]) < 3 || SH.some(S => Math.hypot(x - S.x, y - S.y) < 4)) continue; const r = 1.2 + rnd() * 1.8; c.fillStyle = 'rgba(134,183,208,.38)'; c.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, rr = r * (0.7 + rnd() * 0.4); k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7); } c.closePath(); c.fill(); c.strokeStyle = 'rgba(70,120,160,.4)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(x - r * 0.6, y); c.lineTo(x, y - r * 0.2); c.lineTo(x + r * 0.5, y + r * 0.25); c.stroke(); }
    // sastrugi: long ripples the wind has carved, all lying the same way
    c.lineCap = 'round'; for (let i = 0; i < 70; i++) { const x = (rnd() * 2 - 1) * RX, y = (rnd() * 2 - 1) * RY, L2 = 1.2 + rnd() * 2.6; c.strokeStyle = rnd() < 0.5 ? 'rgba(134,183,208,.28)' : 'rgba(255,255,255,.8)'; c.lineWidth = 0.07 + rnd() * 0.06; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + L2 * 0.5, y - 0.25, x + L2, y + 0.05); c.stroke(); }
    // the hearths in the buttresses: worn dark stone, warm
    for (const S of SH) { c.fillStyle = '#5A5866'; c.beginPath(); c.ellipse(S.x, S.y, NOOK + 0.1, NOOK * 0.85, 0, 0, TAU); c.fill(); c.fillStyle = '#6E6A78'; for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, x = S.x + Math.cos(a) * 1.0, y = S.y + Math.sin(a) * 0.8; c.beginPath(); c.ellipse(x, y, 0.42, 0.3, a, 0, TAU); c.fill(); } c.strokeStyle = 'rgba(255,196,107,.35)'; c.lineWidth = 0.08; c.beginPath(); c.arc(S.x, S.y, 0.55, 0, TAU); c.stroke(); }
    // the pedestal: a round dais of dark stone, a star inlaid in brass where the ember rests
    { const [px, py] = PED; c.fillStyle = '#3A4458'; c.beginPath(); c.ellipse(px, py, 1.7, 1.3, 0, 0, TAU); c.fill(); c.fillStyle = '#56647C'; c.beginPath(); c.ellipse(px, py - 0.08, 1.45, 1.08, 0, 0, TAU); c.fill(); c.strokeStyle = '#B89A5E'; c.lineWidth = 0.09; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.42 : 1.0; i ? c.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.75) : c.moveTo(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.75); } c.closePath(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.06; c.beginPath(); c.ellipse(px, py - 0.08, 1.45, 1.08, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    // brass fragments and lens glass round the telescope
    for (let i = 0; i < 8; i++) { const x = SCOPE[0] + (rnd() - 0.5) * 3, y = SCOPE[1] + 0.8 + rnd() * 1.6; c.fillStyle = rnd() < 0.5 ? '#B89A5E' : 'rgba(159,216,238,.8)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 0.25, y - 0.1); c.lineTo(x + 0.15, y + 0.12); c.closePath(); c.fill(); }
    c.restore();
    // the cornice: a lip of overhanging snow round the rim, blue in its shadow
    c.fillStyle = '#EEF4F7'; c.beginPath(); c.ellipse(0, -RY + 0.2, 2.1, 1.2, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(134,183,208,.7)'; c.lineWidth = 0.12; c.beginPath(); c.ellipse(0, -RY + 0.2, 2.1, 1.2, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.strokeStyle = 'rgba(134,183,208,.6)'; c.lineWidth = 0.5; c.beginPath(); c.ellipse(0, 0, RX - 0.3, RY - 0.3, 0, 0, TAU); c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 0.32; c.beginPath(); c.ellipse(0, 0, RX - 0.05, RY - 0.05, 0, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(46,85,120,.5)'; c.lineWidth = 0.06; c.beginPath(); c.ellipse(0, 0, RX + 0.12, RY + 0.12, 0, 0, TAU); c.stroke(); }
  /* the sky: night over a pale horizon, the aurora's curtains, two icebergs floating off at different depths, the cloud sea */
  function paintSky(c, W, H, T) { const R = mulberry32(73), g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0A1630'); g.addColorStop(0.2, '#172C4D'); g.addColorStop(0.4, '#3D6286'); g.addColorStop(0.52, '#A9C6D8'); g.addColorStop(0.62, '#DCE8EF'); g.addColorStop(1, '#EEF4F7'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { const x = R() * W, y = R() * H * 0.36, s = 0.6 + R() * R() * 2; c.globalAlpha = 0.4 + R() * 0.6; c.fillStyle = '#FFFFFF'; c.fillRect(x, y, s, s); } c.globalAlpha = 1;
    // the aurora: curtains of green, brightest at their lower hems, streaked upward
    c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const y0 = H * (0.1 + k * 0.07), amp = H * 0.03, ph = R() * 6; for (let x = -20; x < W + 20; x += 5) { const y = y0 + Math.sin(x * 0.012 + ph) * amp + Math.sin(x * 0.031 + ph * 2) * amp * 0.4, h = H * (0.05 + 0.04 * Math.sin(x * 0.02 + k)), gg = c.createLinearGradient(0, y - h, 0, y); gg.addColorStop(0, 'rgba(120,215,178,0)'); gg.addColorStop(1, `rgba(120,215,178,${0.16 - k * 0.03})`); c.fillStyle = gg; c.fillRect(x, y - h, 5.5, h); } } c.restore();
    // the icebergs: a far one, small and hazed, and a nearer one, large and clear
    const berg = (x, y, s, haze) => { c.save(); c.globalAlpha = 1 - haze * 0.55; c.beginPath(); c.moveTo(x - s * 1.6, y); c.lineTo(x - s * 1.1, y - s * 0.35); c.lineTo(x - s * 0.3, y - s * 0.5); c.lineTo(x + s * 0.5, y - s * 0.42); c.lineTo(x + s * 1.5, y - s * 0.1); c.lineTo(x + s * 1.7, y); c.lineTo(x + s * 0.9, y + s * 0.9); c.lineTo(x + s * 0.3, y + s * 2.1); c.lineTo(x - s * 0.15, y + s * 1.3); c.lineTo(x - s * 0.7, y + s * 1.0); c.closePath(); const gb = c.createLinearGradient(0, y - s * 0.5, 0, y + s * 2.1); gb.addColorStop(0, '#F4F9FB'); gb.addColorStop(0.25, '#9CC3D8'); gb.addColorStop(1, haze > 0.5 ? 'rgba(170,200,220,.2)' : '#2E5578'); c.fillStyle = gb; c.fill(); c.strokeStyle = haze > 0.5 ? 'rgba(46,85,120,.35)' : 'rgba(43,36,51,.7)'; c.lineWidth = Math.max(1, s * 0.04); c.stroke();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(x - s * 1.6, y); c.lineTo(x - s * 1.1, y - s * 0.35); c.lineTo(x - s * 0.3, y - s * 0.5); c.lineTo(x + s * 0.5, y - s * 0.42); c.lineTo(x + s * 1.5, y - s * 0.1); c.lineTo(x + s * 1.7, y); c.quadraticCurveTo(x, y + s * 0.2, x - s * 1.6, y); c.fill(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(x + s * 0.2, y + s * 0.2); c.lineTo(x + s * 0.35, y + s * 1.6); c.stroke(); c.restore(); };
    berg(W * 0.82, H * 0.255, T * 1.3, 0.8); berg(W * 0.16, H * 0.27, T * 2.8, 0.15);
    // the cloud sea below the summit, its billows lit from above
    c.save(); for (let i = 0; i < 16; i++) { const x = R() * W, y = H * (0.46 + R() * 0.12), r = T * (2.5 + R() * 4); c.globalAlpha = 0.5; c.fillStyle = '#F4F8FA'; c.beginPath(); c.ellipse(x, y, r * 1.8, r * 0.6, 0, 0, TAU); c.fill(); c.globalAlpha = 0.35; c.fillStyle = '#A9C6D8'; c.beginPath(); c.ellipse(x, y + r * 0.3, r * 1.6, r * 0.3, 0, 0, TAU); c.fill(); } c.restore(); }
})());
