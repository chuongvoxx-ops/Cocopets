/* ---------- GHARAAL THE BURIED WITNESS ----------
   The Basilica of the Veiled Eye's last boss, in the Sanctuary of the Veiled Eye: a 38 m square of black basalt whose
   northern wall is one great sealed eye, four pale screens on short east–west rails, rigid stone banners and calcified
   plants along the walls. Gharaal crouches below the wall-eye: a living basalt altar, a ten-metre faceted mound on eight
   low thick limbs, five calcite horns rising unevenly along its back like ruined columns, its face one enormous red eye
   sealed behind four wedge-shaped stone lids, two small paddle arms beneath it that drag the screens. Cracks across its
   body glow dull red before the eye opens. It never walks: it heaves its whole mass.
   I   SLABFALL (above 70%): it rears; three rectangles are marked on the floor and stone slabs fall into them. As the last
       lands it slams down and one limb is left stretched out on the floor, EXPOSED (x2) for a counterattack.
   II  THE UNVEILING (70–35%): the cracks glow, the four lids open one by one (~3 s), then the great gaze sweeps to the pet
       and holds. Put the pet in a screen's shadow (BAS.inShadow, the eye the source) before the cast completes, or it is
       struck and calcified to stage three (rooted). Then a paddle arm drags that screen one rail stop: reposition.
   III WITNESSES WITHIN (below 35%): two smaller eyes open on its back, the second two seconds after the first, each a
       gaze cone. Their screen shadows meet in one shared safe zone: slide the marked screen to its other stop, stand where
       the shadows overlap, and break the CALCITE EYE NODE there to force the main eye shut; it staggers (back eyes x2).
   Between acts it heaves: a short lurch toward the pet that shakes the floor. Every damaging cone and mark is drawn with
   its countdown; nothing depends on where the camera faces. Its fall: the lids slam, the horns topple, it sinks; the eye
   in the wall closes for good, the petrified plants take back their colour, the stone banners crumble into harmless dust,
   and the rift's sealing (the Veil Sigil) follows. */
RiftFiend.define({ id: 'gharaal', hpK: 1.3, dmgK: 1.3, name: 'Gharaal', title: 'The Buried Witness', color: '#242428', glow: '#E08A7E', accent: '#FFD9C2', biome: 'sanctuary', r: 4.6, els: ['earth', 'dark'], phases: 3, cuts: [1, 0.7, 0.35] }, (() => {
  const { TAU, TN } = RiftFiend, K = DunFiend.KIT;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u, smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const sf = (FX, k) => { const s = FX.H && FX.H.sfx; if (s && s[k]) s[k](); };
  /* the palette: volcanic basalt (a 3-tone ramp, a deep and a hot edge), calcite horns, ochre dust, the red eye */
  const INK = '#0B0B0E', BODY = '#2C2C32', BODY_HI = '#4A4A55', BODY_SH = '#1B1B20', BODY_D = '#111114', BODY_EDGE = '#74747F';
  const LIMB = '#313138', LIMB_HI = '#4F4F5A', LIMB_SH = '#1A1A1F';
  const CAL = '#D8D1BB', CAL_HI = '#F0EBDB', CAL_SH = '#B3AB95', CAL_D = '#8F8775';
  const OCH = '#A18E65', OCH_HI = '#C4B38C', OCH_D = '#6E6046';
  const RED = '#BF675D', RED_HI = '#E08A7E', RED_D = '#8A4640', RED_DD = '#4A1E1C', HOT = '#FFD9C2';
  const WARN = (typeof BAS !== 'undefined' && BAS.WARN) || '#FF4D6D', GOLD = '#FFE37A';
  /* the body (metres, body frame: u forward = south toward the viewer, v left = west, h up) */
  const A = 3.3, B = 5.0, HH = 2.9, BASE = 0.35, EYE_U = 3.06, EYE_H = BASE + HH * 0.36;
  const RINGS = [0, 0.32, 0.6, 0.82, 0.93], RR = [1, 0.95, 0.8, 0.58, 0.4], NLON = 14;
  const rOfE = e => { for (let i = 1; i < RINGS.length; i++) if (e <= RINGS[i]) return lerp(RR[i - 1], RR[i], (e - RINGS[i - 1]) / (RINGS[i] - RINGS[i - 1])); return RR[RR.length - 1]; };
  const eOfR = r => { if (r >= 1) return 0; for (let i = 1; i < RR.length; i++) if (r >= RR[i]) return lerp(RINGS[i - 1], RINGS[i], (RR[i - 1] - r) / (RR[i - 1] - RR[i])); return RINGS[RINGS.length - 1]; };
  const surfH = (u, v) => BASE + HH * eOfR(Math.hypot(u / A, v / B));
  // the faceted mesh: rings of jittered vertices (fixed for the creature)
  const MESH = (() => { const R = mulberry32(9071); return RINGS.map((e, i) => { const out = []; for (let j = 0; j < NLON; j++) out.push({ ph: (j + (R() - 0.5) * 0.36) / NLON * TAU, rk: i === 0 ? 1 : 1 + (R() - 0.5) * 0.1, hk: i === 0 ? 1 : 1 + (R() - 0.5) * 0.08 }); return out; }); })();
  const SPECKS = (() => { const R = mulberry32(331); const s = []; for (let i = 0; i < 46; i++) s.push([(R() - 0.5) * 3.6, R() * 0.75, 0.6 + R() * 0.8]); return s; })();
  // the cracks over its body ([longitude, latitude-fraction]; longitude 0 is its face, positive toward its left = west)
  const CRACKS = [[[0.32, 0.18], [0.45, 0.3], [0.62, 0.34], [0.78, 0.5], [0.95, 0.55], [1.12, 0.7]], [[-0.31, 0.22], [-0.45, 0.4], [-0.66, 0.42], [-0.82, 0.6], [-1.05, 0.66]],
    [[0.18, 0.66], [0.34, 0.74], [0.3, 0.84], [0.5, 0.9]], [[-0.22, 0.62], [-0.16, 0.74], [-0.4, 0.84]], [[1.25, 0.14], [1.36, 0.34], [1.56, 0.42], [1.7, 0.62]], [[-1.3, 0.2], [-1.46, 0.38], [-1.6, 0.5], [-1.76, 0.7]],
    [[0.62, 0.34], [0.72, 0.18], [0.9, 0.12]], [[-0.66, 0.42], [-0.78, 0.26], [-0.98, 0.2]]];
  // the eight low thick limbs (longitudes) and the five calcite horns along the back: u, v, height, lean, look
  const LIMBS = [0.72, -0.72, 1.32, -1.32, 1.95, -1.95, 2.55, -2.55];
  const HORNS = [{ u: -1.05, v: 3.35, H: 1.7, lv: 0.36, lu: -0.05, cap: false, s: 1 }, { u: -1.4, v: 1.85, H: 3.7, lv: 0.14, lu: -0.22, cap: true, s: 2 }, { u: -1.6, v: 0.15, H: 2.6, lv: -0.04, lu: -0.16, cap: false, s: 3 },
    { u: -1.42, v: -1.6, H: 3.25, lv: -0.13, lu: -0.2, cap: true, s: 4 }, { u: -1.1, v: -3.25, H: 2.0, lv: -0.38, lu: -0.1, cap: false, s: 5 }];
  const BACK_EYES = [{ u: -0.3, v: 2.45 }, { u: -0.3, v: -2.45 }];
  const LIGHT = (() => { const l = [-0.5, 0.35, 0.8], n = Math.hypot(...l); return l.map(x => x / n); })(), VIEW = [0, 0.7071, 0.7071];
  /* the act cycles */
  const CYC1 = ['slab', 'heave', 'slab', 'heave'], CYC2 = ['unveil', 'heave', 'slab', 'heave', 'unveil', 'slab', 'heave'], CYC3 = ['witness', 'heave', 'unveil', 'heave', 'slab', 'witness', 'heave', 'slab'];
  /* the arena dressing: rigid stone banners and calcified plants by the walls (relative to the centre) */
  const BANNERS = [[-14, -17.4], [-9.6, -17.4], [9.6, -17.4], [14, -17.4], [-17.6, -3.5], [17.6, -3.5]], PLANTS = [[-17.2, -10.5], [17.2, -10.5], [-17.3, 3.5], [17.3, 3.5], [-16.2, 15.8], [16.2, 15.8], [-6.5, 17.6], [6.5, 17.6]];
  const RXC = new WeakMap();
  const mixC = (a, b, k) => K.mixC(a, b, clamp(k, 0, 1));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], norm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const ARENA = (typeof BAS !== 'undefined' && BAS.arena && BAS.arena.gharaal) || { R: 19, carve() {}, start(C) { return { x: C.x + 0.5, y: C.y + C.R - 3.5 }; } };
  return {
    arenaR: ARENA.R, firstAct: 'idle', artY: 0.66,
    artPoses: [{ name: 'crouched below the wall-eye', mem: {} }, { name: 'slabfall: rearing (wind-up)', mem: { rear: 1, crack: 0.25 } }, { name: 'the counter: a limb exposed', mem: { slam: 0.4, limbOut: [1, 0, 0, 0, 0, 0, 0, 0], exposedI: 0 } },
      { name: 'the unveiling: cracks glow, lids opening', mem: { crack: 1, hunch: 1, lid: [1, 1, 0.45, 0] } }, { name: 'the great eye open: the gaze', mem: { crack: 0.85, lid: [1, 1, 1, 1], gazeK: 1 } },
      { name: 'dragging a screen', mem: { lid: [1, 1, 1, 1], crack: 0.5, arm: [{ ext: 0 }, { ext: 1, dx: -6.5, dy: 5.4 }] } }, { name: 'witnesses within: back eyes open', mem: { crack: 0.6, lid: [1, 1, 1, 1], blid: [1, 1], gazeK: 0.4 } },
      { name: 'staggered: the eye forced shut', mem: { slump: 1, blid: [1, 1], stunK: 1 } }, { name: 'heaving toward you', mem: { lift: 1, hunch: 0.6 } }, { name: 'fallen: sinking, horns toppling', mem: { dead: 1, sink: 0.35, hornFall: 0.7 } }],
    phaseNames: ['Slabfall', 'The Unveiling', 'Witnesses Within'],
    start(C) { return ARENA.start(C); },
    carve(set, C) { ARENA.carve(set, C); for (const [px, py] of BANNERS.concat(PLANTS)) set(Math.floor(C.x + px), Math.floor(C.y + py), T_SOLID); },
    props(C) { return BANNERS.map(([x, y], i) => ({ kind: 'banner', i, x: C.x + x, y: C.y + y + 0.4 })).concat(PLANTS.map(([x, y], i) => ({ kind: 'plant', i, x: C.x + x, y: C.y + y + 0.3 }))); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'banner') drawBanner(c, FX, p, X, Y, T, t); else if (p.kind === 'plant') drawPlant(c, FX, p, X, Y, T, t); else if (p.kind === 'remains' && FX.m) { c.save(); paint(c, FX, FX.m, FX.sx(FX.m.x), FX.sy(FX.m.y), T, t); c.restore(); } },
    paintGround(c, A2) { paintFloor(c, A2); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    camFocus(FX, m) { const C = FX.C, M = FX.mem; if (!M.P) return null;
      if (m.dead) return M.deadT != null && M.deadT < 6.5 ? { x: C.x, y: C.y - 12.5, k: 0.8, zoom: 0.46 } : null;
      if (m.act === 'enter') return { x: m.x, y: m.y - 2, k: 0.8, zoom: 0.48 };
      if (M.W || M.G) return { x: m.x, y: m.y + 6.5, k: 0.4, zoom: 0.44 };
      return { x: m.x, y: m.y + 5, k: 0.35, zoom: 0.47 }; },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.noTouch = true; m.touchK = 0; m.x = C.x; m.y = C.y - 10.5;
      Object.assign(M, { bt: 0, q: [], seen: {}, picks: 0, nextAct: null, recoil: 0, rear: 0, crouch: 0, lift: 0, slump: 0, hunch: 0, slam: 0, crack: 0, crackW: 0, lid: [0, 0, 0, 0], lidW: [0, 0, 0, 0], lidK: 3, blid: [0, 0], blidW: [0, 0], limbOut: [0, 0, 0, 0, 0, 0, 0, 0],
        arm: [{ ext: 0, dx: 0, dy: 0 }, { ext: 0, dx: 0, dy: 0 }], yaw: 0, rise: 0, sink: 0, hornFall: 0, gazeK: 0, stunK: 0, bloom: 0, crumble: 0, wallOpen: 0.12, A: null, G: null, W: null, exposed: null, drag: null, eyeWeakT: 0, roared: false, wasStun: false,
        stat: { slabs: 0, slabHit: 0, exposed: 0, heaves: 0, heaveHit: 0, gazes: 0, gazeHit: 0, gazeBlocked: 0, drags: 0, witness: 0, nodes: 0, shut: 0, liveAt: [], dragged: [] } });
      M.P = { ok: 1 }; },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; resetAll(FX, m); M.recoil = 1; M.slam = 1; FX.H.shake(12, 0.6); FX.H.flash(0.22, RED_HI); sf(FX, 'crash');
      if (lv === 2) { M.nextAct = 'unveil'; M.picks = 0; FX.H.banner('THE UNVEILING', 'Its cracks glow before the great eye opens: hide the pet in a screen\'s shadow before the gaze completes', RED_HI, 3, true); }
      if (lv >= 3) { M.nextAct = 'witness'; M.picks = 0; FX.H.banner('WITNESSES WITHIN', 'Eyes open on its back: where both their shadows meet you are safe. Break the calcite eye node there', RED_HI, 3, true); } },
    ai(FX, m, dt) { const M = FX.mem, lv = FX.S.lv; m.actT += dt; m.noTouch = true;
      switch (m.act) {
        case 'idle': if (m.actT > (lv >= 3 ? 0.9 : lv >= 2 ? 1.05 : 1.25) / FX.S.fast) choose(FX, m); break;
        case 'heave': if (heaveTick(FX, m, dt)) endAct(FX, m); break;
        case 'slab': if (slabTick(FX, m, dt)) endAct(FX, m); break;
        case 'unveil': if (unveilTick(FX, m, dt)) endAct(FX, m); break;
        case 'witness': if (witnessTick(FX, m, dt)) endAct(FX, m); break;
        default: endAct(FX, m);
      }
      FX.parts(partsList(FX, m)); },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true;
      BACK_EYES.forEach((E, i) => { const p = backEyeScreenPt(FX, m, i); FX.weak('beye' + i, p[0], p[1], 0.9, 2, m.stunT > 0.05); });
      M.shT = (M.shT || 0) - dt; if (M.shT <= 0) { M.shT = 0.3; FX.H.part({ kind: 'smoke', x: m.x + FX.rnd(-4, 4), y: m.y + FX.rnd(-1, 2), vx: FX.rnd(-0.5, 0.5), vy: -0.6, life: 0.9, max: 0.9, size: 0.7, color: 'rgba(161,142,101,' }); }
      FX.parts(partsList(FX, m)); },
    update(FX, dt) { const M = FX.mem, m = FX.m, me = FX.me, lv = FX.S.lv; if (!m || !M.P) return; M.bt += dt;
      const RX = rxOf(FX), mod = RX && RX.rift && RX.rift.self ? RX.rift.self.mod : null;
      if (m.dead) { deadTick(FX, m, dt, mod); easePose(FX, m, dt); return; }
      M.recoil = decay(M.recoil, dt, 2.4); M.slam = decay(M.slam, dt, 1.8);
      // the entrance: it heaves up out of the floor under the wall-eye, then shakes itself loose
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.rise = smooth((e - 0.15) / 2.1); if (Math.random() < dt * 30 * (1 - M.rise)) dust(FX, m.x + FX.rnd(-B, B), m.y + FX.rnd(-1, A + 0.8), 1.2);
        if (e > 2.0 && !M.roared) { M.roared = true; M.recoil = 1; M.slam = 1; FX.H.shake(16, 0.9); FX.H.flash(0.25, RED_HI); sf(FX, 'crash'); FX.H.ring(m.x, m.y + 1, 2, 12, 0.8, OCH_HI, 0.35); for (let i = 0; i < 18; i++) dust(FX, m.x + FX.rnd(-B - 1, B + 1), m.y + FX.rnd(-1, A + 1.5), 1.6); } }
      else M.rise = 1;
      // stunned: slumped, the eye shut, its back eyes bare; then it rouses
      const stun = m.stunT > 0; M.stunK = toward(M.stunK, stun ? 1 : 0, dt, 4);
      if (!stun) { for (let i = 0; i < 2; i++) if (FX.S.weak['beye' + i]) FX.weak('beye' + i, 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.blidW = [0, 0]; M.recoil = 1; FX.H.text(m.x, m.y - 4, 'It heaves itself upright', RED_HI, 13); sf(FX, 'hum'); } } else M.wasStun = true;
      M.slump = toward(M.slump, stun ? 1 : 0, dt, stun ? 4 : 2);
      // the yaw: the altar's face turns a little after the pet
      M.yaw = toward(M.yaw, clamp(Math.atan2(me.x - m.x, me.y - m.y) * -0.25, -0.16, 0.16), dt, 1.2);
      // the cracks glow dull red when the eye is about to open; a little in the later stages even at rest
      M.crack = toward(M.crack, Math.max(M.crackW || 0, lv >= 2 ? 0.16 : 0.06), dt, M.crackW > M.crack ? 2.2 : 1.1);
      // the exposed limb: the counter window
      if (M.exposed) { const E = M.exposed; E.t += dt; const f = limbGeom(FX, m, E.i, 1).foot; FX.weak('limb', f[0], f[1] - 0.2, 1.35, 2, E.t < E.T); if (E.t >= E.T) { FX.weak('limb', 0, 0, 0, 0, false); M.exposed = null; FX.H.text(f[0], f[1] - 1.5, 'It draws the limb back', RED_HI, 12); } }
      for (let i = 0; i < 8; i++) M.limbOut[i] = toward(M.limbOut[i], M.exposed && M.exposed.i === i ? 1 : 0, dt, M.exposed && M.exposed.i === i ? 7 : 2.5);
      // the great eye open is a weak point
      M.eyeWeakT = Math.max(0, M.eyeWeakT - dt); const lidOpen = Math.min(...M.lid), eyeOn = !stun && lidOpen > 0.8 && (M.eyeWeakT > 0 || M.W || (M.G && M.G.state === 'hold'));
      { const e = eyeScreenPt(FX, m); FX.weak('eye', e[0], e[1], 1.6, 1.75, eyeOn); }
      // the drag of a screen by a paddle arm
      if (M.drag) dragTick(FX, m, dt);
      // the back-eye gazes' sources follow (they are fixed while it does not move; set while live)
      if (M.W) for (const E of M.W.eyes) { const p = backEyeGround(FX, m, E.i); E.src.x = p[0]; E.src.y = p[1]; }
      // the wall-eye stirs with it: a little more open in each stage, wider while it gazes
      if (mod && mod.wallEye) { const want = 0.1 + 0.12 * (lv - 1) + (M.G ? 0.28 * smooth(M.gazeK) : 0) + (M.W ? 0.18 : 0); mod.wallEye.open = toward(mod.wallEye.open || 0, want, dt, 1.2); }
      // the pet is eased out of its mass (it is stone: it is walked round, not through)
      if (!me.dead && M.rise > 0.9) { const dx = (me.x - m.x) / (B + 0.35), dy = (me.y - m.y) / (A + 0.45), d = Math.hypot(dx, dy); if (d < 1 && d > 1e-4) { const k = (1 - d) / d; FX.push(dx * k * (B + 0.35) * 0.6, dy * k * (A + 0.45) * 0.6); } }
      // never still: dust trickles from the horns, a pebble from the cracks
      if (Math.random() < dt * 2.2) { const H = HORNS[Math.floor(Math.random() * HORNS.length)], W = bodyW(FX, m), p = W(H.u + H.lu * H.H, H.v + H.lv * H.H, surfH(H.u, H.v) + H.H); FX.H.part({ kind: 'spark', x: p[0], y: p[1] - p[2], vx: FX.rnd(-0.3, 0.3), vy: 0.4, g: 3, life: 1.1, max: 1.1, size: 1.6, color: Math.random() < 0.5 ? OCH_HI : CAL }); }
      easePose(FX, m, dt);
      // the main gaze's source follows the eye
      if (M.G) { const p = eyeGround(FX, m); M.G.src.x = p[0]; M.G.src.y = p[1]; } },
    dmgK(FX, m) { const M = FX.mem; M.recoil = Math.max(M.recoil || 0, 0.45); return 0.85; },
    onWeakHit(FX) { FX.mem.recoil = 1; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { Y += (m.z || 0) * T * 4; paint(c, FX, m, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'node') drawNode(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function rxOf(FX) { if (!FX || !FX.g || !(FX.S && FX.S.started) || typeof BAS === 'undefined') return null; if (RXC.has(FX)) return RXC.get(FX);
    let X = null; try { const C = BAS.ctx({ g: FX.g }); X = C && C.X && C.X.rift ? C.X : null; } catch (e) { X = null; } if (X) RXC.set(FX, X); return X; }
  function screensOf(FX) { const RX = rxOf(FX), mod = RX && RX.rift && RX.rift.self ? RX.rift.self.mod : null; return mod && mod.screens ? mod.screens : []; }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col || RED_HI, first ? 2.4 : 1.3, true); }
  function endAct(FX, m) { const M = FX.mem; m.act = 'idle'; m.actT = 0; M.A = null; M.rearW = 0; M.crouchW = 0; M.liftW = 0; M.hunchW = 0; M.crackW = 0; if (!M.G && !M.W) M.lidW = [0, 0, 0, 0]; }
  function choose(FX, m) { const M = FX.mem, lv = FX.S.lv; m.actT = 0; let a = M.nextAct; M.nextAct = null;
    if (!a) { const cyc = lv >= 3 ? CYC3 : lv >= 2 ? CYC2 : CYC1; a = cyc[M.picks++ % cyc.length]; }
    if ((a === 'unveil' && lv < 2) || (a === 'witness' && lv < 3)) a = 'slab';
    m.act = a; M.A = { t: 0 }; M.lidK = 3;
    if (a === 'heave') startHeave(FX, m); else if (a === 'slab') startSlab(FX, m); else if (a === 'unveil') startUnveil(FX, m); else if (a === 'witness') startWitness(FX, m); }
  function resetAll(FX, m) { const M = FX.mem; FX.S.tele.length = 0; cancelGaze(FX); endWitness(FX, m, false); if (M.exposed) { M.exposed = null; FX.weak('limb', 0, 0, 0, 0, false); } M.eyeWeakT = 0; M.lidW = [0, 0, 0, 0]; m.act = 'idle'; m.actT = 0; M.A = null; M.crackW = 0; M.rearW = 0; M.crouchW = 0; M.liftW = 0; M.hunchW = 0; }
  function inSquare(C, x, y, pad) { const R = C.R - (pad || 0); return Math.abs(x - C.x) < R && Math.abs(y - C.y) < R; }
  function dust(FX, x, y, s) { FX.H.part({ kind: 'smoke', x, y, vx: FX.rnd(-0.8, 0.8), vy: FX.rnd(-1.2, -0.3), life: 0.9 + Math.random() * 0.6, max: 1.4, size: (s || 1) * (0.6 + Math.random() * 0.6), color: 'rgba(161,142,101,' }); }
  /* the frames: posed (breathing, rearing, heaving, slumped, sinking) and the ground frame (the feet) */
  function poseOf(FX, m) { const M = FX.mem || {}, bt = M.bt || 0, br = Math.sin(bt * 1.35);
    const pitch = 0.11 * (M.rear || 0) - 0.07 * (M.hunch || 0) - 0.09 * (M.slump || 0) + 0.05 * (M.recoil || 0) + 0.012 * br - 0.05 * (M.slam || 0) - 0.06 * (M.lift || 0) + 0.04 * (M.crouch || 0);
    const z = -0.28 * (M.crouch || 0) + 0.5 * (M.lift || 0) - 0.42 * (M.slump || 0) - 2.7 * smooth(M.sink || 0) - (1 - (M.rise == null ? 1 : M.rise)) * 3.6 + 0.035 * br - 0.12 * (M.slam || 0);
    const roll = 0.05 * (M.slump || 0) * Math.sin(bt * 2.2) + 0.03 * Math.sin(bt * 0.45) * (M.lift || 0) + 0.06 * smooth(M.sink || 0);
    return { th: Math.PI / 2 + (M.yaw || 0), pitch, z, roll, br: 1 + 0.028 * br }; }
  function bodyW(FX, m, P) { P = P || poseOf(FX, m); return RiftFiend.frame(m, P.th, { pitch: P.pitch, roll: P.roll, z: P.z }); }
  function groundW(FX, m, P) { P = P || poseOf(FX, m); return RiftFiend.frame(m, P.th, { z: Math.min(0, P.z + 0.3) * 0.3 }); }
  function eyeGround(FX, m) { const p = bodyW(FX, m)(EYE_U + 0.2, 0, 0); return [p[0], p[1]]; }
  function eyeScreenPt(FX, m) { const p = bodyW(FX, m)(EYE_U, 0, EYE_H); return [p[0], p[1] - p[2]]; }
  function backEyePos(FX, m, i) { const E = BACK_EYES[i]; return bodyW(FX, m)(E.u, E.v, surfH(E.u, E.v) + 0.04); }
  function backEyeGround(FX, m, i) { const p = backEyePos(FX, m, i); return [p[0], p[1]]; }
  function backEyeScreenPt(FX, m, i) { const p = backEyePos(FX, m, i); return [p[0], p[1] - p[2]]; }
  // a limb's hip, knee and foot in world (out: how far it is stretched out as the counter's opening)
  function limbGeom(FX, m, i, out) { const M = FX.mem || {}, P = poseOf(FX, m), W = bodyW(FX, m, P), Wg = groundW(FX, m, P), ph = LIMBS[i], cp = Math.cos(ph), sp = Math.sin(ph), o = out == null ? (M.limbOut ? M.limbOut[i] : 0) : out, bt = M.bt || 0;
    const hip = W(A * 0.8 * cp, B * 0.82 * sp, BASE + 0.55), sl = Math.sin(bt * 1.1 + i * 1.7) * 0.06 * (1 - o) + (M.lift || 0) * 0.25 * Math.sin(bt * 9 + i);
    const foot = Wg(cp * (A + 0.45 + o * 3.0) + sl, sp * (B + 0.4 + o * 2.6), 0), o2 = Wg(cp, sp, 0), n = [o2[0] - m.x, o2[1] - m.y];
    return { hip, foot: [foot[0], foot[1], 0], n, o }; }
  function partsList(FX, m) { const M = FX.mem; if (!(M.rise > 0.5)) return []; return [{ key: 'body', dx: 0, dy: -1.2, r: 4.0 }, { key: 'front', dx: 0, dy: 2.4, r: 2.4 }, { key: 'flankL', dx: -4.2, dy: 0.4, r: 2.1 }, { key: 'flankR', dx: 4.2, dy: 0.4, r: 2.1 }]; }
  function easePose(FX, m, dt) { const M = FX.mem;
    M.rear = toward(M.rear, M.rearW || 0, dt, M.rearW ? 3.2 : 7); M.crouch = toward(M.crouch, M.crouchW || 0, dt, 6); M.lift = toward(M.lift, M.liftW || 0, dt, 9); M.hunch = toward(M.hunch, M.hunchW || 0, dt, 2.6);
    for (let k = 0; k < 4; k++) M.lid[k] = toward(M.lid[k], M.lidW[k], dt, M.lidW[k] > M.lid[k] ? 3.2 : M.lidK || 3);
    for (let k = 0; k < 2; k++) M.blid[k] = toward(M.blid[k], M.blidW[k], dt, 4);
    M.gazeK = toward(M.gazeK, M.G && M.G.state === 'hold' ? 1 : M.G ? 0.35 : 0, dt, 3);
    for (const a of M.arm) a.ext = toward(a.ext, a.want || 0, dt, 5); }

  /* ---- heave: a crouch, a lurch of the whole mass toward the pet, a shock where it lands ---- */
  function heaveTarget(FX, m) { const C = FX.C, me = FX.me, dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy) || 1, s = Math.min(2.6, d); return { x: clamp(m.x + dx / d * s, C.x - 6, C.x + 6), y: clamp(m.y + dy / d * s, C.y - 12, C.y - 9.5) }; }
  function startHeave(FX, m) { const M = FX.mem, f = FX.S.fast, A2 = M.A, P = heaveTarget(FX, m); A2.x0 = m.x; A2.y0 = m.y; A2.x1 = P.x; A2.y1 = P.y; M.crouchW = 1; M.stat.heaves++;
    const cx = P.x, cy = P.y + A + 1.3, r = 3.1; A2.tele = FX.tele({ shape: 'fn', kind: 'shock', test: (px, py, rr) => Math.hypot(px - cx, py - cy) < r + (rr || 0), x: cx, y: cy, r, t: 1.0 / f, dmg: m.dmg * 0.9, col: WARN, ink: 'shock', fn: s => { if (FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) M.stat.heaveHit++; } });
    sf(FX, 'hum'); }
  function heaveTick(FX, m, dt) { const M = FX.mem, A2 = M.A, f = FX.S.fast; A2.t += dt * f; const t = A2.t;
    if (t > 0.55 && t < 1.0) { M.crouchW = 0; M.liftW = 1; M.hunchW = 0.6; const u = smooth((t - 0.55) / 0.45); m.x = lerp(A2.x0, A2.x1, u); m.y = lerp(A2.y0, A2.y1, u); }
    if (t >= 1.0 && !A2.landed) { A2.landed = true; m.x = A2.x1; m.y = A2.y1; M.liftW = 0; M.hunchW = 0; M.slam = 1; FX.H.shake(13, 0.45); sf(FX, 'thud'); FX.H.ring(m.x, m.y + A, 1.5, 7.5, 0.5, OCH_HI, 0.35); for (let i = 0; i < 14; i++) dust(FX, m.x + FX.rnd(-B - 1, B + 1), m.y + FX.rnd(0, A + 1.6), 1.3); }
    return t >= 1.7; }

  /* ---- Slabfall: it rears; three rectangles marked; slabs fall into them; a limb is left exposed ---- */
  function startSlab(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, f = FX.S.fast, A2 = M.A, rects = [];
    for (let k = 0; k < 3; k++) { let p = null; for (let tr = 0; tr < 30 && !p; tr++) { const a = Math.random() * TAU, d = k === 0 ? 0.3 : 3.6 + Math.random() * 2.2, x = me.x + (k === 0 ? (me.vx || 0) * 0.35 : 0) + Math.cos(a) * d, y = me.y + (k === 0 ? (me.vy || 0) * 0.35 : 0) + Math.sin(a) * d, ang = Math.random() < 0.5 ? 0 : Math.PI / 2;
        if (inSquare(C, x, y, 2) && y > m.y + A + 1.6 && rects.every(q => Math.hypot(q.x - x, q.y - y) > 3.4)) p = { x, y, a: ang }; } if (p) rects.push(p); }
    A2.n = rects.length; A2.landed = 0; M.rearW = 1; M.crackW = 0.3;
    rects.forEach((p, k) => { const w = 3.8, h = 2.5, ca = Math.cos(p.a), sa = Math.sin(p.a);
      FX.tele({ shape: 'fn', kind: 'slab', x: p.x, y: p.y, a: p.a, w, h, t: (2.0 + k * 0.28) / f, dmg: m.dmg * 1.4, col: WARN, ink: 'slab', seed: Math.random() * 100,
        test: (px, py, rr) => { const dx = px - p.x, dy = py - p.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca; return Math.abs(lx) < w / 2 + (rr || 0) && Math.abs(ly) < h / 2 + (rr || 0); },
        fn: s => { M.stat.slabs++; if (FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) M.stat.slabHit++; FX.H.shake(10, 0.3); sf(FX, 'crash'); for (let i = 0; i < 10; i++) dust(FX, s.x + FX.rnd(-w / 2, w / 2), s.y + FX.rnd(-h / 2, h / 2), 1.2); for (let i = 0; i < 8; i++) FX.H.part({ kind: 'spark', x: s.x + FX.rnd(-1.5, 1.5), y: s.y, vx: FX.rnd(-4, 4), vy: FX.rnd(-6, -2), g: 14, life: 0.6, max: 0.6, size: 2.5, color: i % 2 ? CAL_SH : BODY_HI });
          FX.hz({ x: s.x, y: s.y, a: s.a, w, h, r: 1.5, shape: 'circle', life: 3.6, ink: 'rubble', seed: s.seed, draw: drawRubble });
          A2.landed++; if (A2.landed >= A2.n) exposeLimb(FX, m); } }); });
    say(FX, 'slab', 'SLABFALL', 'Three slabs fall on the marked rectangles: step out of them, then strike the limb it leaves exposed', RED_HI); sf(FX, 'hum'); }
  function exposeLimb(FX, m) { const M = FX.mem, me = FX.me; M.rearW = 0; M.slam = 1; M.crackW = 0; FX.H.shake(14, 0.5); sf(FX, 'thud');
    let best = 0, bd = 1e9; for (let i = 0; i < 8; i++) { if (Math.cos(LIMBS[i]) < -0.25) continue; const g = limbGeom(FX, m, i, 1).foot, d = Math.hypot(g[0] - me.x, g[1] - me.y); if (d < bd) { bd = d; best = i; } }
    M.exposed = { i: best, t: 0, T: 6.0 / FX.S.fast }; M.stat.exposed++; M.A.exT = M.A.t;
    const f = limbGeom(FX, m, best, 1).foot; FX.H.ring(f[0], f[1], 0.3, 2.6, 0.5, RED_HI, 0.4);
    say(FX, 'limb', 'A LIMB EXPOSED', 'It slammed a limb out across the floor: strike it now (double damage)', GOLD); }
  function slabTick(FX, m, dt) { const M = FX.mem, A2 = M.A; A2.t += dt * FX.S.fast; if (A2.n === 0 && A2.t > 1) return true; return A2.landed >= A2.n && !M.exposed && A2.t > 2; }

  /* ---- the great gaze: lids open one by one, the cone sweeps to the pet and holds, the cast; shared by both later acts ---- */
  function makeGaze(FX, m, o) { const M = FX.mem, me = FX.me, p = eyeGround(FX, m), f = FX.S.fast;
    M.G = Object.assign({ src: { x: p[0], y: p[1], a: Math.atan2(me.y - p[1], me.x - p[0]) + (Math.random() < 0.5 ? -0.9 : 0.9), len: 30, spread: 0.6, open: false, gharaal: true }, t: 0, state: 'crack', crackAt: 0, lidAt: 1.2 / f, lidStep: 0.75 / f, holdAt: 4.2 / f, castAt: 7.6 / f, resolved: false }, o || {}); M.stat.gazes++; return M.G; }
  function cancelGaze(FX) { const M = FX.mem; M.G = null; }
  function gazeTick(FX, m, dt) { const M = FX.mem, G = M.G, me = FX.me; if (!G) return null; G.t += dt; const t = G.t;
    if (t >= G.crackAt) M.crackW = 1;
    if (t >= G.lidAt) { G.state = t >= G.holdAt ? 'hold' : 'lids'; M.hunchW = 0.7; for (let k = 0; k < 4; k++) if (t >= G.lidAt + k * G.lidStep) { if (!M.lidW[k]) { M.lidW[k] = 1; sf(FX, 'thud'); FX.H.shake(4, 0.15); } } }
    // it aims: quickly while it opens (a dashed preview), slowly once the gaze holds
    const want = Math.atan2(me.y - G.src.y, me.x - G.src.x), rate = G.state === 'hold' ? 0.75 : 1.5; G.src.a += clamp(K.angTo(G.src.a, want), -rate * dt, rate * dt);
    if (t >= G.castAt && !G.resolved) { G.resolved = true; return resolveGaze(FX, m, G); }
    return null; }
  function resolveGaze(FX, m, G) { const M = FX.mem, me = FX.me, RX = rxOf(FX), src = G.src;
    const inC = typeof BAS !== 'undefined' ? BAS.inCone(me.x, me.y, src) : true, hid = typeof BAS !== 'undefined' ? BAS.inShadow(me.x, me.y, src) : false, seen = !me.dead && inC && !hid;
    G.seen = seen; G.hid = hid; M.flashG = 1; FX.H.flash(0.25, RED_HI); FX.H.shake(10, 0.4); sf(FX, 'crash');
    if (seen) { M.stat.gazeHit++; FX.hurt(m.dmg * 1.3); if (RX && BAS.calcify) BAS.calcify.add(3, RX); FX.H.banner('SEEN', 'The great eye found you: calcified where you stood. Hide in a screen\'s shadow', RED_HI, 1.8, true); }
    else { M.stat.gazeBlocked++; FX.H.text(me.x, me.y - 2, hid ? 'Hidden in the shadow' : 'Out of its sight', CAL_HI, 14); }
    let scr = null; const S = screensOf(FX); if (S.length) { scr = S.find(s => { const P = BAS.shadowOf(s, src); return P && BAS.inPoly(me.x, me.y, P); }) || S.slice().sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0]; }
    return { seen, scr }; }
  function startUnveil(FX, m) { const M = FX.mem; makeGaze(FX, m); M.eyeWeakT = 0;
    say(FX, 'unveil', 'THE UNVEILING', 'The lids open one by one: get the pet into a screen\'s shadow before the gaze completes', RED_HI); sf(FX, 'hum'); }
  function unveilTick(FX, m, dt) { const M = FX.mem, A2 = M.A; A2.t += dt;
    if (M.G) { const r = gazeTick(FX, m, dt); if (r) { M.eyeWeakT = 3.6; A2.dragAt = A2.t + 0.4; A2.scr = r.scr; A2.endAt = A2.t + 3.6; } }
    if (M.G && M.G.resolved && A2.t > (A2.endAt - 3.0)) { M.G = null; M.crackW = 0.35; M.hunchW = 0; }
    if (A2.dragAt != null && A2.t >= A2.dragAt && !A2.dragged) { A2.dragged = true; if (A2.scr) startDrag(FX, m, A2.scr); }
    if (A2.endAt != null && A2.t >= A2.endAt && !M.drag) { M.lidW = [0, 0, 0, 0]; M.lidK = 2.5; M.crackW = 0; return true; }
    return false; }
  /* a paddle arm reaches out and drags the screen one rail stop */
  function startDrag(FX, m, scr) { const M = FX.mem, side = scr.x < m.x ? 0 : 1; M.drag = { scr, side, t: 0, moved: false, from: scr.i }; M.arm[side].want = 1; aimArm(FX, m, side, scr); sf(FX, 'whoosh'); }
  function aimArm(FX, m, side, scr) { const M = FX.mem, e = scr.ends(), near = Math.hypot(e[0][0] - m.x, e[0][1] - m.y) < Math.hypot(e[1][0] - m.x, e[1][1] - m.y) ? e[0] : e[1]; M.arm[side].dx = near[0] - m.x; M.arm[side].dy = near[1] - m.y + 0.15; }
  function dragTick(FX, m, dt) { const M = FX.mem, D = M.drag, s = D.scr; D.t += dt; aimArm(FX, m, D.side, s);
    if (!D.moved && D.t > 0.55) { D.moved = true; const to = s.stops.length > 1 ? (s.i === 0 ? 1 : s.i - 1) : s.i; s.goTo(to); M.stat.drags++; M.stat.dragged.push({ from: D.from, to }); FX.H.shake(6, 0.6); sf(FX, 'thud'); say(FX, 'drag', 'IT DRAGS THE SCREEN', 'A paddle arm hauls the screen one stop along its rail: reposition before the next gaze', CAL_HI); }
    if (D.moved && !s.moving && !D.done) { D.done = true; D.end = D.t; M.arm[D.side].want = 0; }
    if (D.done && D.t > D.end + 0.5) M.drag = null;
    if (D.moved && s.moving && Math.random() < dt * 20) dust(FX, s.x + FX.rnd(-1.6, 1.6), s.y + 0.2, 0.8); }

  /* ---- Witnesses Within: two back eyes, two cones, one shared shadow, the calcite eye node ---- */
  function fakeScreen(s, j) { const p = s.stops[j], hx = Math.cos(s.a) * s.len / 2, hy = Math.sin(s.a) * s.len / 2; return { ends: () => [[p[0] - hx, p[1] - hy], [p[0] + hx, p[1] + hy]] }; }
  function bothShade(scrLike, srcs, x, y) { return srcs.every(src => { const P = BAS.shadowOf(scrLike, src); return P && BAS.inPoly(x, y, P); }); }
  function startWitness(FX, m) { const M = FX.mem, me = FX.me, RX = rxOf(FX), C = FX.C, f = FX.S.fast; M.stat.witness++;
    const eyes = [0, 1].map(i => { const p = backEyeGround(FX, m, i); return { i, src: { x: p[0], y: p[1], a: Math.PI / 2, len: 30, spread: 0.4, open: false, preview: null, gharaal: true }, openAt: (i ? 2.0 : 0) / f, liveAt: (i ? 3.5 : 1.5) / f, live: false }; });
    // the screen nearest the pet, slid to its other stop, shades one place from both eyes: the node rises there
    const S = screensOf(FX); let pick = null;
    if (S.length && typeof BAS !== 'undefined') { const order = S.filter(s => s.stops.length > 1).sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
      const srcs = eyes.map(E => E.src), mx = (srcs[0].x + srcs[1].x) / 2, my = (srcs[0].y + srcs[1].y) / 2;
      for (const s of order) { const j = s.i === 0 ? 1 : 0, st = s.stops[j], ux = st[0] - mx, uy = st[1] - my, ul = Math.hypot(ux, uy) || 1, fk = fakeScreen(s, j), now = fakeScreen(s, s.i);
        for (const dd of [1.3, 1.7, 1.0, 2.2, 2.8]) { const x = st[0] + ux / ul * dd, y = st[1] + uy / ul * dd; if (!inSquare(C, x, y, 1.2)) continue; if (bothShade(fk, srcs, x, y) && !bothShade(now, srcs, x, y)) { pick = { scr: s, j, x, y }; break; } }
        if (pick) break; } }
    if (!pick) pick = { scr: null, j: 0, x: clamp(me.x, C.x - 14, C.x + 14), y: clamp(me.y, m.y + A + 3, C.y + 15) };
    eyes.forEach(E => { E.src.a = Math.atan2(pick.y - E.src.y, pick.x - E.src.x); });
    let node = null; node = FX.obj({ kind: 'node', x: pick.x, y: pick.y, r: 0.8, hp: Math.max(1, FX.S.barHP * 0.3), still: true, onKill: o => shutEye(FX, m, o) });
    node.born = 0; M.stat.nodes++; const mod = RX && RX.rift && RX.rift.self ? RX.rift.self.mod : null; if (mod && mod.nodes) mod.nodes.push(node);
    M.W = { t: 0, eyes, node, pick, done: false }; if (RX) eyes.forEach(E => BAS.source(RX, E.src));
    makeGaze(FX, m, { lidAt: 0.5 / f, holdAt: 12.6 / f, castAt: 16 / f, lidStep: 0.8 / f });
    FX.H.ring(pick.x, pick.y, 0.3, 2.2, 0.5, CAL_HI, 0.4);
    say(FX, 'witness', 'WITNESSES WITHIN', 'Two eyes open on its back. Slide the marked screen, stand where both shadows meet, and break the calcite eye node', RED_HI); sf(FX, 'hum'); }
  function witnessTick(FX, m, dt) { const M = FX.mem, W = M.W, f = FX.S.fast; if (!W) return true; W.t += dt; const t = W.t;
    for (const E of W.eyes) { if (t >= E.openAt) M.blidW[E.i] = 1; if (t >= E.openAt && t < E.liveAt) E.src.preview = E.src.a; if (t >= E.liveAt && !E.live) { E.live = true; E.src.preview = null; E.src.open = true; M.stat.liveAt.push(+FX.g.t.toFixed(3)); FX.H.text(E.src.x, E.src.y - 3.4, E.i ? 'THE SECOND WITNESS' : 'THE FIRST WITNESS', RED_HI, 13); sf(FX, 'hum'); } }
    if (W.node && !W.node.dead) W.node.born = Math.min(1, (W.node.born || 0) + dt * 2);
    if (M.G) { const r = gazeTick(FX, m, dt); if (r) { W.castT = t; } }
    if (W.castT != null && t > W.castT + 1.5) { endWitness(FX, m, true); return true; }
    return false; }
  function endWitness(FX, m, closeLids) { const M = FX.mem, W = M.W; if (!W) return; const RX = rxOf(FX);
    for (const E of W.eyes) { E.src.open = false; E.src.preview = null; if (RX) BAS.unsource(RX, E.src); }
    if (W.node && !W.node.dead) { W.node.dead = true; } const mod = RX && RX.rift && RX.rift.self ? RX.rift.self.mod : null; if (mod && mod.nodes) { const i = mod.nodes.indexOf(W.node); if (i >= 0) mod.nodes.splice(i, 1); }
    M.W = null; if (closeLids) { M.blidW = [0, 0]; M.lidW = [0, 0, 0, 0]; M.G = null; M.crackW = 0; } }
  // the node broken: the main eye is forced shut, it staggers, its back eyes bare
  function shutEye(FX, m, node) { const M = FX.mem; if (m.dead) return; M.stat.shut++; M.G = null; M.lidW = [0, 0, 0, 0]; M.lidK = 14; M.crackW = 0; M.eyeWeakT = 0;
    FX.H.boom(node.x, node.y, 1.8, CAL_HI, RED_HI, { n: 26, shake: 10, smoke: 4 }); FX.H.flash(0.3, '#FFFFFF');
    endWitness(FX, m, false); M.blidW = [1, 1]; m.act = 'idle'; m.actT = 0; M.A = null; m.stunT = 6.5 / FX.S.fast; M.recoil = 1; FX.H.shake(16, 0.7); sf(FX, 'crash');
    FX.H.banner('THE EYE IS FORCED SHUT', 'It staggers: strike its back eyes while they are bare (double damage)', GOLD, 2.6, true, true); }

  /* ---- fallen: the lids slam, the horns topple, it sinks; the wall-eye closes, the plants bloom, the banners crumble ---- */
  function deadTick(FX, m, dt, mod) { const M = FX.mem;
    if (M.deadT == null) { M.deadT = 0; FX.S.tele.length = 0; M.G = null; endWitness(FX, m, false); M.exposed = null; M.drag = null; for (const k of ['eye', 'limb', 'beye0', 'beye1']) FX.weak(k, 0, 0, 0, 0, false); M.lidW = [0, 0, 0, 0]; M.lidK = 12; M.blidW = [0, 0]; M.crackW = 0; M.arm.forEach(a => a.want = 0);
      FX.S.props.push(M.rem = { kind: 'remains', x: m.x, y: m.y + 0.3 }); M.wall0 = mod && mod.wallEye ? mod.wallEye.open || 0 : 0.3; }
    M.deadT += dt; const T = M.deadT;
    M.crack = T < 0.7 ? toward(M.crack, 1, dt, 6) : decay(M.crack, dt, 0.6); M.slump = toward(M.slump, 1, dt, 2);
    M.hornFall = clamp((T - 0.5) / 2.2, 0, 1); M.sink = clamp((T - 1.0) / 3.6, 0, 1) * 0.8;
    if (M.sink < 0.5 && Math.random() < dt * 26) dust(FX, m.x + FX.rnd(-B, B), m.y + FX.rnd(-1, A + 1.2), 1.4);
    // the wall-eye: closing for good
    if (mod && mod.wallEye) { const u = smooth((T - 1.2) / 1.6); mod.wallEye.open = M.wall0 * (1 - u); if (T > 2.9 && !mod.wallEye.sealed) { mod.wallEye.open = 0; mod.wallEye.sealed = true; FX.H.shake(10, 0.5); sf(FX, 'thud'); const we = mod.wallEye; FX.H.text(we.x, we.y + 2, 'The eye in the wall closes for good', CAL_HI, 14); for (let i = 0; i < 16; i++) dust(FX, we.x + FX.rnd(-4.5, 4.5), we.y + FX.rnd(0, 1.5), 1.2); } }
    M.wallShut = smooth((T - 1.2) / 1.6);
    M.bloom = smooth((T - 2.4) / 2.6); M.crumble = smooth((T - 3.0) / 2.4);
    if (M.crumble > 0.02 && M.crumble < 0.98) for (const p of FX.S.props) if (p.kind === 'banner' && Math.random() < dt * 9) { FX.H.part({ kind: 'spark', x: p.x + FX.rnd(-0.6, 0.6), y: p.y - 3.5 + FX.rnd(0, 2.2), vx: FX.rnd(-0.5, 0.5), vy: FX.rnd(0, 1), g: 6, life: 0.9, max: 0.9, size: 2.2, color: Math.random() < 0.5 ? CAL : CAL_SH }); dust(FX, p.x + FX.rnd(-0.6, 0.6), p.y - FX.rnd(0, 2), 0.8); }
    if (M.bloom > 0.02 && M.bloom < 0.98) for (const p of FX.S.props) if (p.kind === 'plant' && Math.random() < dt * 3) FX.H.part({ kind: 'spark', x: p.x + FX.rnd(-0.8, 0.8), y: p.y - 1.4 + FX.rnd(-0.6, 0.6), vx: 0, vy: -0.8, g: -0.5, life: 1, max: 1, size: 2, color: Math.random() < 0.5 ? '#9BD47E' : '#FFB3A0' }); }

  /* ---------- the painting ---------- */
  function demoMem(FX, m) { const M = FX.mem || (FX.mem = {}); if (!M.P) { Object.assign(M, Object.assign({ bt: 2.2, lid: [0, 0, 0, 0], blid: [0, 0], limbOut: [0, 0, 0, 0, 0, 0, 0, 0], arm: [{ ext: 0 }, { ext: 0 }], rise: 1, crack: 0.12, yaw: 0.04 }, M)); M.P = { demo: 1 }; } return M; }
  function paint(c, FX, m, X, Y, T, t) { const M = (FX.S && FX.S.started) ? FX.mem : demoMem(FX, m), me = FX.me || { x: m.x, y: m.y + 8 };
    if (m.dead && !M.rem && FX.S && FX.S.started) return;
    const P = poseOf(FX, m), W = bodyW(FX, m, P), P3 = TN.cam(X, Y, T, m), L = (u, v, h) => { const p = W(u, v, h); return P3(p[0], p[1], p[2]); }, lw = Math.max(1.3, T * 0.065), br = P.br, bt = M.bt || t || 0;
    const sunk = (M.rise == null ? 1 : M.rise) < 0.999 || (M.sink || 0) > 0.001;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // its shadow and a pool of dull red light under it
    K.shade(c, X, Y + T * 0.5, (B + 1.8) * T, (A + 1.2) * T * 0.62, 0.6 * (M.rise == null ? 1 : M.rise));
    if (sunk) { // the floor broken open where it rises (or sinks): a dark pit edge and rubble
      c.fillStyle = 'rgba(6,6,8,.7)'; c.beginPath(); c.ellipse(X, Y + T * 0.4, (B + 0.6) * T, (A + 0.5) * T * 0.75, 0, 0, TAU); c.fill(); }
    if (sunk) { c.save(); c.beginPath(); c.rect(X - T * 40, Y - T * 40, T * 80, T * 40 + (A + 1.15) * T); c.clip(); }
    // the limbs on its far side, then the mound, then the near limbs
    const lims = LIMBS.map((ph, i) => ({ i, ph, g: limbGeom(FX, m, i) })), far = lims.filter(l => Math.abs(l.ph) > 1.7), near = lims.filter(l => Math.abs(l.ph) <= 1.7).sort((a, b) => a.g.foot[1] - b.g.foot[1]);
    far.forEach(l => drawLimb(c, FX, m, M, P3, T, lw, l, bt));
    drawMound(c, FX, m, M, W, P3, L, T, lw, br, bt);
    // its back: the two witness eyes and the five horns, back to front
    const top = [];
    BACK_EYES.forEach((E, i) => top.push({ u: E.u, draw: () => drawBackEye(c, FX, m, M, L, T, lw, i, bt) }));
    HORNS.forEach((H, i) => top.push({ u: H.u - 0.01, draw: () => drawHorn(c, FX, m, M, W, P3, T, lw, H, i, bt) }));
    top.sort((a, b) => a.u - b.u).forEach(p => p.draw());
    near.forEach(l => drawLimb(c, FX, m, M, P3, T, lw, l, bt));
    drawFace(c, FX, m, M, L, T, lw, me, bt);
    [0, 1].forEach(s => drawArm(c, FX, m, M, W, P3, T, lw, s, bt));
    if (sunk) c.restore();
    if ((M.stunK || 0) > 0.05) { const e = L(EYE_U, 0, EYE_H + 1.9); for (let i = 0; i < 4; i++) { const a = bt * 2.6 + i * TAU / 4; TN.twinkle(c, e[0] + Math.cos(a) * T * 1.9, e[1] + Math.sin(a) * T * 0.45, T * 0.22, '#FFFFFF', 0.9 * M.stunK); } }
    c.restore(); }
  /* the faceted mound: jittered rings of plates, each lit by its own facing (a lit, a mid, a shade and a deep tone), the
     lowest dusted with ochre, a hot edge on the lit plates, the silhouette in ink; the cracks over it, glowing */
  function drawMound(c, FX, m, M, W, P3, L, T, lw, br, bt) {
    const V = MESH.map((ring, i) => ring.map(q => { const r = RR[i] * q.rk * (1 + (br - 1) * 0.3), u = A * r * Math.cos(q.ph), v = B * r * Math.sin(q.ph), h = BASE + HH * RINGS[i] * q.hk * br; const w = W(u, v, h); return { w, s: P3(w[0], w[1], w[2]) }; }));
    const cen = W(0, 0, BASE + HH * 0.35), faces = [];
    const face = (pts, ri) => { const n0 = norm3(cross(sub3(pts[1].w, pts[0].w), sub3(pts[2].w, pts[0].w))), mid = [0, 1, 2].map(k => pts.reduce((a, p) => a + p.w[k], 0) / pts.length), out = dot3(n0, sub3(mid, cen)) < 0 ? n0.map(x => -x) : n0;
      if (dot3(out, VIEW) <= 0.02) return; faces.push({ pts, n: out, d: dot3(out, LIGHT), ri }); };
    for (let i = 0; i < RINGS.length - 1; i++) for (let j = 0; j < NLON; j++) { const j2 = (j + 1) % NLON, a = V[i][j], b = V[i][j2], cc = V[i + 1][j2], d = V[i + 1][j];
      if ((i + j) % 2) { face([a, b, cc], i); face([a, cc, d], i); } else { face([a, b, d], i); face([b, cc, d], i); } }
    face(V[RINGS.length - 1].slice(), 9);
    // the silhouette, filled deep first (no hairline gaps between plates)
    const all = []; faces.forEach(f => f.pts.forEach(p => all.push(p.s))); const hull = hull2(all);
    c.beginPath(); hull.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = BODY_D; c.fill();
    const R = mulberry32(77);
    faces.forEach(f => { const d = f.d, nz = R() * 0.08 - 0.04; let col = d > 0.66 ? BODY_HI : d > 0.34 ? BODY : d > 0.05 ? BODY_SH : BODY_D;
      col = mixC(col, d > 0.34 ? '#5A5A66' : '#000000', Math.abs(nz) * 2);
      if (f.ri === 0) col = mixC(col, OCH_D, 0.34); else if (f.ri === 1) col = mixC(col, OCH_D, 0.14); else if (f.ri === 9) col = mixC(BODY_HI, OCH_D, 0.12);
      if ((M.sink || 0) > 0) col = mixC(col, '#3A3A40', (M.sink || 0) * 0.4);
      c.beginPath(); f.pts.forEach((p, k) => k ? c.lineTo(p.s[0], p.s[1]) : c.moveTo(p.s[0], p.s[1])); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(8,8,12,.6)'; c.lineWidth = Math.max(0.8, lw * 0.45); c.stroke();
      if (d > 0.66 && f.ri !== 9) { let k0 = 0; f.pts.forEach((p, k) => { if (p.s[1] < f.pts[k0].s[1]) k0 = k; }); const a = f.pts[k0].s, b = f.pts[(k0 + 1) % f.pts.length].s, e = f.pts[(k0 + f.pts.length - 1) % f.pts.length].s, b2 = a[1] + b[1] < a[1] + e[1] ? b : e; c.strokeStyle = BODY_EDGE; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(lerp(a[0], b2[0], 0.08), lerp(a[1], b2[1], 0.08)); c.lineTo(lerp(a[0], b2[0], 0.85), lerp(a[1], b2[1], 0.85)); c.stroke(); } });
    // the altar's flat top: an ochre-stained rim and a carved groove
    { const ring = V[RINGS.length - 1]; c.strokeStyle = 'rgba(161,142,101,.55)'; c.lineWidth = Math.max(1.2, lw * 0.8); c.beginPath(); ring.forEach((p, k) => k ? c.lineTo(p.s[0], p.s[1]) : c.moveTo(p.s[0], p.s[1])); c.closePath(); c.stroke();
      const ctr = L(0, 0, BASE + HH * RINGS[RINGS.length - 1] * br); c.strokeStyle = 'rgba(10,10,14,.45)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.ellipse(ctr[0], ctr[1], T * 1.3, T * 0.42, 0, 0, TAU); c.stroke(); }
    // ochre dust specks low on its flanks
    c.fillStyle = 'rgba(196,179,140,.5)'; SPECKS.forEach(([ph, e, s]) => { if (Math.cos(ph) < -0.2) return; const r = rOfE(e), p = L(A * r * Math.cos(ph) * 1.005, B * r * Math.sin(ph) * 1.005, BASE + HH * e * br); c.beginPath(); c.arc(p[0], p[1], Math.max(0.8, T * 0.035 * s), 0, TAU); c.fill(); });
    // the silhouette in ink
    c.beginPath(); hull.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.strokeStyle = INK; c.lineWidth = lw * 1.5; c.stroke();
    if (K.Q.flash > 0) { c.fillStyle = 'rgba(255,244,236,.16)'; c.fill(); }
    // the cracks: dark seams with a dull red glow in them, bright before the eye opens
    const ck = M.crack || 0, pu = 0.85 + 0.15 * Math.sin(bt * 5);
    CRACKS.forEach((cr, ci) => { const pts = cr.map(([ph, e]) => { const r = rOfE(e); return L(A * r * Math.cos(ph) * 1.01, B * r * Math.sin(ph) * 1.01, BASE + HH * e * br); });
      const line = (col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); };
      c.save(); c.lineJoin = 'miter'; c.miterLimit = 3; line(INK, Math.max(2, T * 0.13)); c.globalCompositeOperation = 'lighter'; line(TN.rgba(RED_D, 0.35 + 0.65 * ck), Math.max(1.4, T * 0.075)); if (ck > 0.05) { line(TN.rgba(RED_HI, ck * pu), Math.max(1, T * 0.035)); if (ck > 0.4) pts.forEach((p, k) => { if (k % 2) K.glow(c, p[0], p[1], T * 0.9, RED_HI, 0.25 * ck * pu); }); } c.restore(); }); }
  function hull2(pts) { const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1)); }
  /* a limb: a thick low leg of basalt shaded as a tube, a faceted hoof with three calcite claws; stretched out as the
     counter's opening, its red seams glowing */
  function drawLimb(c, FX, m, M, P3, T, lw, l, bt) { const g = l.g, o = g.o, n = g.n, nl = Math.hypot(n[0], n[1]) || 1, nx = n[0] / nl, ny = n[1] / nl;
    const knee = RiftFiend.limb(c, P3, g.hip, g.foot, 0.3 - o * 0.12, [nx * 0.6, ny * 0.6], T * 1.4, T * 1.05, { col: LIMB, shade: LIMB_SH, hi: LIMB_HI, line: INK, lw, force: true }, 0.4 - o * 0.15);
    // the hoof: a squat faceted block on the floor (top lit, the faces toward the viewer by their facing)
    const f = g.foot, tx = -ny, ty = nx, hw = 0.72, hd = 0.56, hz = 0.5 - o * 0.12, cn = (a, b, z) => P3(f[0] + nx * a + tx * b, f[1] + ny * a + ty * b, z);
    const corners = [[hd, hw], [hd, -hw], [-hd, -hw], [-hd, hw]], topP = corners.map(([a, b]) => cn(a * 0.82, b * 0.82, hz)), botP = corners.map(([a, b]) => cn(a, b, 0));
    for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4, [a1, b1] = corners[k], [a2, b2] = corners[k2], fnx = nx * (a1 + a2) / 2 + tx * (b1 + b2) / 2, fny = ny * (a1 + a2) / 2 + ty * (b1 + b2) / 2; if (fny <= 0.02) continue;
      const lit = (fnx * LIGHT[0] + fny * LIGHT[1]) / (Math.hypot(fnx, fny) || 1); TN.shape(c, TN.poly([botP[k], botP[k2], topP[k2], topP[k]]), { col: lit > 0.1 ? LIMB : LIMB_SH, shade: LIMB_SH, hi: false, line: INK, lw: lw * 0.8, r: T * 0.5, force: true, spec: false }); }
    TN.shape(c, TN.poly(topP), { col: LIMB_HI, shade: LIMB, hi: '#666672', line: INK, lw: lw * 0.8, r: T * 0.6, force: true, spec: false });
    // three calcite claws at the outer edge
    for (const b of [-0.4, 0, 0.4]) { const p0 = cn(hd * 0.9, b, 0.12), p1 = cn(hd + 0.42, b * 1.15, 0.02), p2 = cn(hd * 0.9, b + 0.16, 0.16); TN.shape(c, TN.poly([p0, p1, p2]), { col: CAL, shade: CAL_SH, hi: CAL_HI, line: INK, lw: lw * 0.6, r: T * 0.2, force: true, spec: false }); }
    // exposed: the seams along it split open, red and pulsing
    if (o > 0.05) { const hp = P3(g.hip[0], g.hip[1], g.hip[2]), kq = P3(knee[0], knee[1], knee[2]), fq = P3(f[0], f[1], 0.35), pu = 0.6 + 0.4 * Math.sin(bt * 8);
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = TN.rgba(RED_HI, o * pu); c.lineWidth = Math.max(1.5, T * 0.09); c.beginPath(); c.moveTo(lerp(hp[0], kq[0], 0.3), lerp(hp[1], kq[1], 0.3)); c.lineTo(kq[0] + T * 0.12, kq[1] - T * 0.05); c.lineTo(lerp(kq[0], fq[0], 0.5) - T * 0.1, lerp(kq[1], fq[1], 0.5)); c.lineTo(fq[0], fq[1]); c.stroke(); K.glow(c, kq[0], kq[1], T * 1.6, RED_HI, 0.35 * o * pu); K.glow(c, fq[0], fq[1], T * 1.4, HOT, 0.3 * o * pu); c.restore(); } }
  /* a calcite horn: a ruined column grown from its back, three faces (lit, mid, shade), ring grooves, an ochre band, a
     broken jagged top; two keep a fragment of a capital. Fallen, they topple and break */
  function drawHorn(c, FX, m, M, W, P3, T, lw, H, i, bt) { const fall = smooth(M.hornFall || 0), fd = H.v >= 0 ? 1 : -1, hb = surfH(H.u, H.v), Hh = H.H * (1 - fall * 0.35);
    const lv = H.lv + fall * fd * (1.0 + i * 0.12), lu = H.lu - fall * 0.3, b = W(H.u, H.v, hb - 0.25), tp = W(H.u + lu * Hh, H.v + lv * Hh, hb + Hh * (1 - fall * 0.5));
    const B2 = P3(b[0], b[1], b[2]), T2 = P3(tp[0], tp[1], tp[2]), dx = T2[0] - B2[0], dy = T2[1] - B2[1], dl = Math.hypot(dx, dy) || 1, ax = dx / dl, ay = dy / dl, px = -ay, py = ax, wb = T * 0.6, wt = T * 0.4, R = mulberry32(310 + H.s * 17);
    const at = (u, s) => { const w = lerp(wb, wt, u); return [B2[0] + dx * u + px * w * s * (px > 0 ? 1 : -1), B2[1] + dy * u + py * w * s * (px > 0 ? 1 : -1)]; };
    c.save(); c.globalAlpha *= 1 - smooth((M.hornFall || 0) - 0.75) * 0.0;
    // the collar of calcite rubble at its root
    // the three faces
    const strip = (s0, s1, col) => { c.beginPath(); const a = at(0, s0), b2 = at(0, s1), cc = at(1, s1), d = at(1, s0); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fillStyle = col; c.fill(); };
    strip(-1, -0.3, CAL_HI); strip(-0.3, 0.38, CAL); strip(0.38, 1, CAL_SH);
    // a capital fragment
    if (H.cap) { const u0 = 0.62, u1 = 0.72, ext = 1.32; c.beginPath(); const p = (u, s) => { const q = at(u, s * ext); return q; }; const a = p(u0, -1), b2 = p(u0, 1), cc = p(u1, 1), d = p(u1, -1); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); const g = c.createLinearGradient(a[0], a[1], b2[0], b2[1]); g.addColorStop(0, CAL_HI); g.addColorStop(0.45, CAL); g.addColorStop(1, CAL_D); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.stroke(); }
    // grooves (the column's drums), the ochre band, flutes
    const n = Math.max(3, Math.round(Hh / 0.55)); for (let k = 1; k < n; k++) { const u = k / n; if (H.cap && u > 0.6 && u < 0.74) continue; const a = at(u, -1), b2 = at(u, 1); c.strokeStyle = 'rgba(110,96,70,.55)'; c.lineWidth = Math.max(1, lw * 0.55); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b2[0]) / 2 + ax * T * 0.06, (a[1] + b2[1]) / 2 + ay * T * 0.06 + T * 0.05, b2[0], b2[1]); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(0.8, lw * 0.35); c.beginPath(); c.moveTo(a[0] + ax * T * 0.05, a[1] + ay * T * 0.05 - 1); c.quadraticCurveTo((a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2 + T * 0.03, b2[0] + ax * T * 0.05, b2[1] + ay * T * 0.05 - 1); c.stroke(); }
    { const a = at(0.14, -1), b2 = at(0.14, 1), cc = at(0.2, 1), d = at(0.2, -1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fillStyle = TN.rgba(OCH, 0.85); c.fill(); }
    for (const s of [-0.62, 0.05, 0.7]) { const a = at(0.22, s), b2 = at(0.94, s); c.strokeStyle = 'rgba(80,70,52,.28)'; c.lineWidth = Math.max(0.8, lw * 0.4); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
    // the outline, then the broken top: a jagged edge, its exposed stone lighter, a dark pit in it
    const jag = []; for (let k = 0; k <= 6; k++) { const s = -1 + k / 3, up = (R() - 0.35) * 0.28 + (k === 2 ? 0.18 : 0); jag.push(at(1 + up * (T * 0.9 / dl) * 3, s)); }
    c.beginPath(); const s0 = at(0, -1); c.moveTo(s0[0], s0[1]); jag.forEach(p => c.lineTo(p[0], p[1])); const s1 = at(0, 1); c.lineTo(s1[0], s1[1]); c.closePath(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    { const tc = at(1, 0), r = (wt * 0.95); c.beginPath(); jag.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let k = 6; k >= 0; k--) { const q = jag[k]; c.lineTo(lerp(q[0], tc[0], 0.5) + ax * r * 0.5, lerp(q[1], tc[1], 0.5) + r * 0.45); } c.closePath(); c.fillStyle = CAL_HI; c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.stroke();
      c.fillStyle = CAL_D; c.beginPath(); c.ellipse(tc[0] + ax * r * 0.2, tc[1] + r * 0.12, r * 0.38, r * 0.16, Math.atan2(py, px), 0, TAU); c.fill(); }
    // a crack down the shade face, and (two of them) a small eye-stone sealed in the drum
    { const a = at(0.85, 0.6), b2 = at(0.55, 0.75), d = at(0.35, 0.55); c.strokeStyle = 'rgba(60,52,40,.6)'; c.lineWidth = Math.max(1, lw * 0.55); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.lineTo(d[0], d[1]); c.stroke(); }
    if (i === 1 || i === 3) { const e = at(0.42, -0.05); if (typeof BAS !== 'undefined') BAS.eyeStone(c, e[0], e[1], T * 0.42, 0, lw * 0.7, { col: CAL_SH }); }
    // its root: a collar of calcite rubble on the basalt
    for (let k = 0; k < 4; k++) { const s = -1.1 + k * 0.72, q = at(0.02, s), r = T * (0.2 + R() * 0.12); TN.shape(c, TN.ell(q[0], q[1] + T * 0.06, r * 1.25, r * 0.8), { col: k % 2 ? CAL_SH : CAL, shade: CAL_D, hi: CAL_HI, line: INK, lw: lw * 0.6, r, force: true, spec: false }); }
    c.restore(); }
  /* a back eye (Witnesses Within): a small socket on the flat top, two stone lids that part, a red eye beneath */
  function drawBackEye(c, FX, m, M, L, T, lw, i, bt) { const E = BACK_EYES[i], p = L(E.u, E.v, surfH(E.u, E.v) + 0.04), open = clamp((M.blid || [0, 0])[i], 0, 1), rx = T * 0.62, ry = T * 0.34;
    TN.shape(c, TN.ell(p[0], p[1], rx * 1.3, ry * 1.35), { col: BODY_HI, shade: BODY, hi: '#626270', line: INK, lw: lw * 0.8, r: rx, force: true, spec: false });
    c.save(); c.beginPath(); c.ellipse(p[0], p[1], rx, ry, 0, 0, TAU); c.clip(); c.fillStyle = RED_DD; c.fillRect(p[0] - rx, p[1] - ry, rx * 2, ry * 2);
    if (open > 0.02) { const ir = ry * 0.85, me = FX.me || { x: m.x, y: m.y + 8 }, lx = clamp((me.x - m.x) / 14, -1, 1) * rx * 0.3; TN.shape(c, TN.ell(p[0] + lx, p[1], ir * 1.2, ir), { col: RED, shade: RED_D, hi: RED_HI, line: false, r: ir, force: true, spec: 0.8, specAt: [p[0] + lx - ir * 0.4, p[1] - ir * 0.4] }); c.fillStyle = INK; c.beginPath(); c.ellipse(p[0] + lx, p[1], ir * 0.16, ir * 0.78, 0, 0, TAU); c.fill(); }
    // the lids: an upper and a lower wedge sliding back into the rim
    for (const s of [-1, 1]) { const off = s * open * ry * 1.05; c.beginPath(); c.moveTo(p[0] - rx * 1.05, p[1] + off); c.quadraticCurveTo(p[0], p[1] + off + s * ry * 0.3, p[0] + rx * 1.05, p[1] + off); c.lineTo(p[0] + rx * 1.05, p[1] + off + s * ry * 1.2); c.lineTo(p[0] - rx * 1.05, p[1] + off + s * ry * 1.2); c.closePath(); c.fillStyle = s < 0 ? LIMB_HI : BODY_SH; c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.6; c.stroke(); }
    c.restore(); c.strokeStyle = INK; c.lineWidth = lw * 0.9; c.beginPath(); c.ellipse(p[0], p[1], rx, ry, 0, 0, TAU); c.stroke();
    if (open > 0.3) K.glow(c, p[0], p[1], rx * 2.2, RED_HI, 0.35 * open); }
  /* the face: the enormous red eye behind four wedge lids in a brow of basalt (the focal point) */
  function drawFace(c, FX, m, M, L, T, lw, me, bt) { const e = L(EYE_U, 0, EYE_H), x = e[0], y = e[1], rx = T * 1.78, ry = T * 1.46, lids = M.lid || [0, 0, 0, 0], open = Math.min(...lids), any = Math.max(...lids), gz = M.gazeK || 0, ck = M.crack || 0;
    // the brow: a thick ring of basalt plates round the socket, four slots in it where the lids withdraw
    TN.shape(c, TN.ell(x, y + T * 0.04, rx * 1.2, ry * 1.22), { col: BODY_HI, shade: BODY_SH, hi: '#666674', line: INK, lw: lw * 1.2, r: rx * 1.2, d1: 0.08, d2: 0.14, force: true, spec: false });
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + TAU / 16, a2 = a + TAU / 8; c.strokeStyle = 'rgba(8,8,12,.6)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(x + Math.cos(a) * rx * 1.02, y + Math.sin(a) * ry * 1.02); c.lineTo(x + Math.cos(a) * rx * 1.2, y + Math.sin(a) * ry * 1.22); c.stroke(); if (k % 2 === 0) { c.strokeStyle = 'rgba(160,160,172,.35)'; c.beginPath(); c.ellipse(x, y + T * 0.04, rx * 1.12, ry * 1.13, 0, a + 0.05, a2 - 0.05); c.stroke(); } }
    // the socket and the eye in it
    c.save(); c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.clip();
    c.fillStyle = '#1A0C0C'; c.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    if (any > 0.02) { const g = c.createRadialGradient(x, y, ry * 0.2, x, y, rx); g.addColorStop(0, '#7A2E2A'); g.addColorStop(0.7, '#4A1E1C'); g.addColorStop(1, '#240E0E'); c.fillStyle = g; c.fillRect(x - rx, y - ry, rx * 2, ry * 2);
      const lk = me ? [clamp((me.x - m.x) / 12, -1, 1), clamp((me.y - m.y - 6) / 12, -1, 1)] : [0, 0], ir = ry * 0.72, ix = x + lk[0] * rx * 0.28, iy = y + lk[1] * ry * 0.2;
      // veins in the white of it, the iris (three tones of the red, a hot highlight), the slit pupil that finds the pet
      c.strokeStyle = 'rgba(40,10,10,.5)'; c.lineWidth = Math.max(1, T * 0.03); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + 0.3; c.beginPath(); c.moveTo(x + Math.cos(a) * rx * 0.95, y + Math.sin(a) * ry * 0.95); c.quadraticCurveTo(x + Math.cos(a + 0.2) * rx * 0.75, y + Math.sin(a + 0.2) * ry * 0.75, ix + Math.cos(a) * ir * 1.05, iy + Math.sin(a) * ir * 1.05); c.stroke(); }
      TN.shape(c, TN.ell(ix, iy, ir, ir), { col: RED, shade: RED_D, shade2: RED_DD, hi: RED_HI, line: INK, lw: lw * 0.8, r: ir, d1: 0.1, d2: 0.18, force: true, spec: false });
      c.strokeStyle = TN.rgba(RED_DD, 0.6); c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.arc(ix, iy, ir * 0.7, 0, TAU); c.stroke(); for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; c.beginPath(); c.moveTo(ix + Math.cos(a) * ir * 0.3, iy + Math.sin(a) * ir * 0.3); c.lineTo(ix + Math.cos(a) * ir * 0.68, iy + Math.sin(a) * ir * 0.68); c.stroke(); }
      const pw = ir * (0.2 - gz * 0.1), ph = ir * (0.85 + gz * 0.08); c.fillStyle = INK; c.beginPath(); c.moveTo(ix, iy - ph); c.quadraticCurveTo(ix + pw * 1.6, iy, ix, iy + ph); c.quadraticCurveTo(ix - pw * 1.6, iy, ix, iy - ph); c.fill();
      TN.spec(c, ix - ir * 0.42, iy - ir * 0.45, ir * 0.22, -0.7, 0.9); c.fillStyle = TN.rgba(HOT, 0.85); c.beginPath(); c.ellipse(ix + ir * 0.35, iy + ir * 0.4, ir * 0.09, ir * 0.05, -0.5, 0, TAU); c.fill();
      if (gz > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = gz * (0.35 + 0.15 * Math.sin(bt * 12)); c.fillStyle = HOT; c.beginPath(); c.arc(ix, iy, ir * 0.55, 0, TAU); c.fill(); c.restore(); } }
    // the four wedge lids (top, right, bottom, left), each sliding back into the brow; a raised ridge splits each into a lit
    // and a shaded plate
    const rim = (a, k) => [x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k];
    [-Math.PI / 2, 0, Math.PI / 2, Math.PI].forEach((th, k) => { const o = smooth(lids[k] || 0), sx = Math.cos(th) * rx * 1.18 * o, sy = Math.sin(th) * ry * 1.18 * o, jit = (M.P && !M.P.demo && o < 0.05) ? Math.sin(bt * 7 + k) * T * 0.012 : 0, q = p => [p[0] + sx + Math.cos(th) * jit, p[1] + sy + Math.sin(th) * jit];
      const c0 = q([x, y]), a = q(rim(th - Math.PI / 4, 1.22)), mid = q(rim(th, 1.3)), b2 = q(rim(th + Math.PI / 4, 1.22));
      const half = (p1, p2) => { const cx = (c0[0] + p1[0] + p2[0]) / 3 - x - sx, cy = (c0[1] + p1[1] + p2[1]) / 3 - y - sy, lit = (cx * -0.6 + cy * -0.8) > 0; TN.shape(c, TN.poly([c0, p1, p2]), { col: lit ? '#45454F' : '#26262C', shade: lit ? '#383840' : '#1A1A1F', hi: lit ? '#5E5E6A' : '#33333A', line: INK, lw: lw * 0.8, r: rx * 0.5, d1: 0.06, d2: 0.1, force: true, spec: false }); };
      half(a, mid); half(mid, b2);
      c.strokeStyle = TN.rgba(CAL_SH, 0.85); c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(lerp(c0[0], mid[0], 0.08), lerp(c0[1], mid[1], 0.08)); c.lineTo(lerp(c0[0], mid[0], 0.8), lerp(c0[1], mid[1], 0.8)); c.stroke(); });
    // light leaking through the seams between the closed lids as the cracks glow
    if (ck > 0.05 && open < 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = TN.rgba(RED_HI, ck * (1 - open * 3) * (0.7 + 0.3 * Math.sin(bt * 9))); c.lineWidth = Math.max(1.2, T * 0.05); for (let k = 0; k < 4; k++) { const a = -Math.PI / 4 + k * Math.PI / 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * rx, y + Math.sin(a) * ry); c.stroke(); } c.restore(); }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = lw * 1.3; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.stroke();
    if (any > 0.1) K.glow(c, x, y, rx * (1.8 + gz * 1.2), RED_HI, (0.18 + 0.4 * gz) * any);
    if (ck > 0.1 && open < 0.5) K.glow(c, x, y, rx * 1.3, RED_D, 0.25 * ck); }
  /* a paddle arm: shoulder under the eye, a short tube arm, a flat stone paddle; idle it scrapes the floor, dragging it
     reaches out to the screen */
  function drawArm(c, FX, m, M, W, P3, T, lw, s, bt) { const sd = s === 0 ? 1 : -1, a = (M.arm || [])[s] || { ext: 0 }, ext = smooth(a.ext || 0), Wg = groundW(FX, m);
    const sh = W(A * 0.86, sd * 2.0, BASE + 0.2), idle = Wg(A + 1.0 + Math.sin(bt * 0.85 + s * 2.1) * 0.22, sd * 2.35, 0.08), vo = Wg(0, sd, 0), vx0 = vo[0] - m.x, vy0 = vo[1] - m.y, tgt = a.dx != null && ext > 0.001 ? [m.x + a.dx, m.y + a.dy, 0.25] : idle, hand = [lerp(idle[0], tgt[0], ext), lerp(idle[1], tgt[1], ext), lerp(idle[2], tgt[2], ext)];
    const el = [(sh[0] + hand[0]) / 2 + vx0 * 0.55 * (1 - ext * 0.6), (sh[1] + hand[1]) / 2 + vy0 * 0.55 * (1 - ext * 0.6), (sh[2] + hand[2]) / 2 + 0.3], pts = [sh, el, hand].map(p => P3(p[0], p[1], p[2]));
    const len = Math.hypot(hand[0] - sh[0], hand[1] - sh[1]), pp = len > 4 ? [pts[0], pts[1], [lerp(pts[1][0], pts[2][0], 0.5), lerp(pts[1][1], pts[2][1], 0.5) - T * 0.15], pts[2]] : pts;
    TN.tubeLite(c, pp, u => T * (0.5 - u * 0.2), { col: LIMB, shade: LIMB_SH, hi: LIMB_HI, line: INK, lw: lw * 0.85, force: true });
    if (len > 4) for (let k = 1; k < 4; k++) { const q = [lerp(pp[1][0], pp[3][0], k / 4), lerp(pp[1][1], pp[3][1], k / 4)]; c.strokeStyle = TN.rgba(CAL_SH, 0.7); c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.arc(q[0], q[1], T * 0.2, 0, TAU); c.stroke(); }
    // the paddle: a flat slab along the forearm, top lit, edge dark, a calcite rim
    const dx = hand[0] - el[0], dy = hand[1] - el[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, vx = -uy, vy = ux, H2 = hand[2], cn = (a1, b1, z) => P3(hand[0] + ux * a1 + vx * b1, hand[1] + uy * a1 + vy * b1, z);
    const top = [cn(-0.2, -0.42, H2 + 0.13), cn(0.75, -0.48, H2 + 0.08), cn(0.75, 0.48, H2 + 0.08), cn(-0.2, 0.42, H2 + 0.13)], bot = top.map(p => [p[0], p[1] + T * 0.13]);
    TN.shape(c, TN.poly([bot[0], bot[1], bot[2], bot[3]]), { col: LIMB_SH, line: INK, lw: lw * 0.8, hi: false, spec: false, r: T * 0.4, force: true });
    TN.shape(c, TN.poly(top), { col: LIMB_HI, shade: LIMB, hi: '#6A6A76', line: INK, lw: lw * 0.85, r: T * 0.5, d1: 0.1, d2: 0.2, force: true, spec: false });
    c.strokeStyle = TN.rgba(CAL, 0.8); c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(top[1][0], top[1][1]); c.lineTo(top[2][0], top[2][1]); c.stroke(); }

  /* ---------- the arena's things: banners, plants, the node, rubble ---------- */
  function drawBanner(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, cr = clamp(M.crumble || 0, 0, 1), lw = Math.max(1.2, T * 0.06);
    c.save(); c.fillStyle = 'rgba(10,10,14,.35)'; c.beginPath(); c.ellipse(X, Y, T * 0.55, T * 0.2, 0, 0, TAU); c.fill();
    c.fillStyle = BODY; c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.fillRect(X - T * 0.35, Y - T * 0.25, T * 0.7, T * 0.25); c.strokeRect(X - T * 0.35, Y - T * 0.25, T * 0.7, T * 0.25);
    const g = c.createLinearGradient(X - T * 0.08, 0, X + T * 0.08, 0); g.addColorStop(0, BODY_HI); g.addColorStop(1, BODY_D); c.fillStyle = g; c.fillRect(X - T * 0.08, Y - T * 4.2, T * 0.16, T * 4.0); c.strokeRect(X - T * 0.08, Y - T * 4.2, T * 0.16, T * 4.0);
    if (cr < 0.995 && typeof BAS !== 'undefined') { const hTop = Y - T * 3.8, hh = T * 2.9; c.save(); c.globalAlpha *= 1 - smooth((cr - 0.6) / 0.4); c.beginPath(); c.rect(X - T * 2, hTop - T * 0.3, T * 4, T * 0.3 + hh * (1 - cr) + T * 0.05); c.clip(); c.translate(0, hh * cr * 0.15); BAS.banner(c, X, hTop, T * 1.25, hh, lw, p.i); c.restore();
      if (cr > 0.02) { const R = mulberry32(50 + p.i); for (let k = 0; k < 6; k++) { const fx = X + (R() - 0.5) * T * 1.2, fy = hTop + hh * (1 - cr) + cr * T * (0.8 + R() * 2.5), s = T * (0.1 + R() * 0.12); c.globalAlpha = 1 - cr; c.fillStyle = k % 2 ? CAL : CAL_SH; c.beginPath(); c.moveTo(fx - s, fy); c.lineTo(fx, fy - s * 1.2); c.lineTo(fx + s, fy + s * 0.3); c.closePath(); c.fill(); } c.globalAlpha = 1; } }
    // the dust it left, settled at its foot
    if (cr > 0.3) { c.fillStyle = `rgba(216,209,187,${0.35 * smooth((cr - 0.3) / 0.7)})`; c.beginPath(); c.ellipse(X, Y - T * 0.05, T * 0.8, T * 0.22, 0, 0, TAU); c.fill(); }
    c.fillStyle = OCH; c.beginPath(); c.moveTo(X - T * 0.14, Y - T * 4.2); c.lineTo(X, Y - T * 4.45); c.lineTo(X + T * 0.14, Y - T * 4.2); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.stroke(); c.restore(); }
  function drawPlant(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, bl = clamp(M.bloom || 0, 0, 1), lw = Math.max(1.2, T * 0.06), R = mulberry32(23 + p.i * 11), sway = bl * Math.sin(t * 1.4 + p.i) * 0.06;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.fillStyle = 'rgba(10,10,14,.35)'; c.beginPath(); c.ellipse(X, Y, T * 0.75, T * 0.24, 0, 0, TAU); c.fill();
    TN.shape(c, TN.poly([[X - T * 0.45, Y], [X - T * 0.38, Y - T * 0.38], [X + T * 0.38, Y - T * 0.38], [X + T * 0.45, Y]]), { col: OCH, shade: OCH_D, hi: OCH_HI, line: INK, lw, r: T * 0.4, force: true, spec: false });
    const leaf = mixC(CAL_SH, '#6FAF5A', bl), leafHi = mixC(CAL_HI, '#A8DC86', bl), leafSh = mixC(CAL_D, '#3E7A3A', bl), stem = mixC(CAL_D, '#4E6A34', bl);
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.27 + (R() - 0.5) * 0.12 + sway, Ln = T * (1.0 + R() * 0.9), x0 = X, y0 = Y - T * 0.36, x1 = x0 + Math.cos(a) * Ln, y1 = y0 + Math.sin(a) * Ln;
      c.strokeStyle = INK; c.lineWidth = T * 0.08 + lw * 1.2; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + Math.cos(a) * Ln * 0.5 - T * 0.08, y0 + Math.sin(a) * Ln * 0.5, x1, y1); c.stroke(); c.strokeStyle = stem; c.lineWidth = T * 0.08; c.stroke();
      c.save(); c.translate(x1, y1); c.rotate(a + (bl ? Math.sin(t * 2 + i) * 0.08 * bl : 0)); TN.shape(c, g => { g.moveTo(0, 0); g.quadraticCurveTo(T * 0.32, -T * 0.24, T * 0.6, 0); g.quadraticCurveTo(T * 0.32, T * 0.24, 0, 0); g.closePath(); }, { col: leaf, shade: leafSh, hi: leafHi, line: INK, lw: lw * 0.7, r: T * 0.3, force: true, spec: false });
      if (bl < 0.6) { c.strokeStyle = `rgba(90,84,70,${0.5 * (1 - bl)})`; c.lineWidth = Math.max(0.8, lw * 0.4); c.beginPath(); c.moveTo(T * 0.1, 0); c.lineTo(T * 0.5, 0); c.stroke(); } c.restore();
      if (bl > 0.45 && i % 3 === 1) { const k = smooth((bl - 0.45) / 0.55), fx = x1 + Math.cos(a) * T * 0.2, fy = y1 + Math.sin(a) * T * 0.2; for (let pt = 0; pt < 5; pt++) { const pa = pt / 5 * TAU + t * 0.3; c.fillStyle = i % 2 ? '#FFB3A0' : '#F4D27A'; c.beginPath(); c.ellipse(fx + Math.cos(pa) * T * 0.12 * k, fy + Math.sin(pa) * T * 0.12 * k, T * 0.1 * k, T * 0.06 * k, pa, 0, TAU); c.fill(); } c.fillStyle = '#FFF2C8'; c.beginPath(); c.arc(fx, fy, T * 0.06 * k, 0, TAU); c.fill(); } }
    if (bl > 0.1) K.glow(c, X, Y - T * 1.2, T * 1.6, '#C8F0A0', 0.18 * bl * (1 - bl * 0.5));
    c.restore(); }
  /* the calcite eye node: a cluster of faceted calcite prisms round a red eye stone, rising from the floor */
  function drawNode(c, FX, o, X, Y, T, t) { const k = smooth(o.born == null ? 1 : o.born), lw = Math.max(1.2, T * 0.06), pu = 0.6 + 0.4 * Math.sin(t * 6);
    c.save(); c.fillStyle = 'rgba(10,10,14,.4)'; c.beginPath(); c.ellipse(X, Y, T * 1.0, T * 0.34, 0, 0, TAU); c.fill(); K.glow(c, X, Y - T * 0.8, T * 2.4, RED_HI, 0.3 * k * pu);
    const prism = (dx, h, w, lean, sh) => { const bx = X + dx * T, by = Y + T * 0.05, tx = bx + lean * T, ty = by - h * T * k, hw = w * T; TN.shape(c, TN.poly([[bx - hw, by], [bx, by + hw * 0.3], [tx, ty + hw * 0.2], [tx - hw * 0.6, ty + hw * 0.5]]), { col: sh ? CAL_SH : CAL_HI, shade: CAL_D, hi: '#FFFFFF', line: INK, lw: lw * 0.8, r: hw, force: true, spec: false });
      TN.shape(c, TN.poly([[bx, by + hw * 0.3], [bx + hw, by], [tx + hw * 0.5, ty + hw * 0.5], [tx, ty + hw * 0.2]]), { col: sh ? CAL_D : CAL, shade: CAL_D, hi: CAL_HI, line: INK, lw: lw * 0.8, r: hw, force: true, spec: false });
      TN.shape(c, TN.poly([[tx - hw * 0.6, ty + hw * 0.5], [tx, ty + hw * 0.2], [tx + hw * 0.5, ty + hw * 0.5], [tx, ty - hw * 0.5]]), { col: CAL_HI, line: INK, lw: lw * 0.6, hi: false, r: hw, force: true, spec: false }); };
    prism(-0.55, 1.3, 0.28, -0.25, true); prism(0.6, 1.1, 0.26, 0.3, true); prism(-0.15, 1.9, 0.34, -0.08, false); prism(0.3, 1.55, 0.3, 0.12, false);
    if (typeof BAS !== 'undefined') BAS.eyeStone(c, X, Y - T * 0.7 * k, T * 0.95, 1, lw, { glow: true, col: CAL });
    c.restore(); }
  function drawRubble(c, z, FX, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y), fade = Math.min(1, z.age / 0.15, (z.life - z.age) / 0.8); if (fade <= 0) return;
    c.save(); c.globalAlpha = fade; c.translate(X, Y); slabArt(c, z.w * T * 0.92, z.h * T * 0.92, T * 0.3, z.a, Math.max(1.2, T * 0.06), z.seed || 1); c.restore(); }
  // a basalt slab (a rotated box seen from above and the south): top lit, the near faces shaded, cracks
  function slabArt(c, w, h, th, a, lw, seed) { const ca = Math.cos(a), sa = Math.sin(a), P = (x, y) => [x * ca - y * sa, x * sa + y * ca], cn = [P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2)], top = cn.map(p => [p[0], p[1] - th]);
    for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4, mx = (cn[k][0] + cn[k2][0]) / 2, my = (cn[k][1] + cn[k2][1]) / 2; if (my <= 0.5) continue; TN.shape(c, TN.poly([cn[k], cn[k2], top[k2], top[k]]), { col: mx < 0 ? BODY : BODY_SH, line: INK, lw: lw * 0.8, hi: false, spec: false, r: th, force: true }); }
    TN.shape(c, TN.poly(top), { col: BODY_HI, shade: BODY, hi: '#626270', line: INK, lw, r: Math.min(w, h) * 0.5, d1: 0.06, d2: 0.1, force: true, spec: false });
    const R = mulberry32(Math.floor(seed * 1000)); c.strokeStyle = 'rgba(8,8,12,.6)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); let x = (R() - 0.5) * w * 0.6, y = -th + (R() - 0.5) * h * 0.4; const q0 = P(x, y + th); c.moveTo(q0[0], q0[1] - th); for (let k = 0; k < 4; k++) { x += (R() - 0.3) * w * 0.25; y += (R() - 0.5) * h * 0.3; const q = P(x, y + th); c.lineTo(q[0], q[1] - th); } c.stroke();
    c.fillStyle = 'rgba(161,142,101,.35)'; c.beginPath(); c.ellipse(0, -th, w * 0.25, h * 0.15, a, 0, TAU); c.fill(); }

  /* ---------- the ground's living layer: marks, cones and their countdowns, glowing floor cracks ---------- */
  function cdLabel(c, s, x, y, T, col, sz) { c.save(); c.font = `900 ${Math.max(11, Math.round(sz || T * 0.5))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(10,6,8,.85)'; c.strokeText(s, x, y); c.fillStyle = col || '#FFFFFF'; c.fillText(s, x, y); c.restore(); }
  function drawOverlay(c, FX, t, T) { const M = FX.mem, m = FX.m, C = FX.C; if (!M || !M.P || !m) return; const RX = rxOf(FX);
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    // the floor's cracks about it, glowing with its own
    { const X0 = FX.sx(m.x), Y0 = FX.sy(m.y), k = Math.min(1, (M.crack || 0) + (M.slam || 0) * 0.6) * (m.dead ? 1 - smooth(M.sink * 2) : 1), R = mulberry32(911);
      for (let i = 0; i < 11; i++) { const a = Math.PI * (0.05 + 0.9 * (i / 10)) + (R() - 0.5) * 0.2, r0 = 1.0, x0 = X0 + Math.cos(a) * (B + 0.4) * T, y0 = Y0 + Math.sin(a) * (A + 0.4) * T; let x = x0, y = y0; const pts = [[x, y]]; for (let j = 0; j < 4; j++) { x += Math.cos(a + (R() - 0.5) * 0.8) * T * (0.8 + R() * 0.8); y += Math.sin(a + (R() - 0.5) * 0.8) * T * (0.6 + R() * 0.6); pts.push([x, y]); }
        const ln = (col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }; ln('rgba(8,8,10,.6)', Math.max(1.5, T * 0.09)); if (k > 0.03) { c.save(); c.globalCompositeOperation = 'lighter'; ln(TN.rgba(RED_D, 0.6 * k), Math.max(1.2, T * 0.06)); ln(TN.rgba(RED_HI, 0.5 * k), Math.max(0.8, T * 0.025)); c.restore(); } void r0; } }
    // the marks: slabfall rectangles, the heave's shock
    for (const s of FX.S.tele) { if (s.done || !s.ink) continue; const u = clamp(s.age / s.t, 0, 1), hot = u > 0.7, left = Math.max(0, s.t - s.age), X = FX.sx(s.x), Y = FX.sy(s.y), edge = hot && Math.sin(t * 20) > 0 ? '#FFFFFF' : WARN;
      c.save(); c.translate(X, Y);
      if (s.kind === 'slab') { c.rotate(s.a); const w = s.w * T, h = s.h * T; c.fillStyle = `rgba(10,6,8,${0.18 + u * 0.36})`; c.fillRect(-w / 2, -h / 2, w, h); c.fillStyle = TN.rgba(WARN, 0.08 + u * 0.18); c.fillRect(-w / 2 * u, -h / 2 * u, w * u, h * u);
        c.strokeStyle = 'rgba(8,4,6,.85)'; c.lineWidth = Math.max(2, T * 0.15); c.strokeRect(-w / 2, -h / 2, w, h); c.strokeStyle = edge; c.lineWidth = Math.max(1.5, T * 0.08); c.strokeRect(-w / 2, -h / 2, w, h);
        c.lineWidth = Math.max(2, T * 0.12); for (const [sx2, sy2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.beginPath(); c.moveTo(sx2 * w / 2, sy2 * (h / 2 - T * 0.5)); c.lineTo(sx2 * w / 2, sy2 * h / 2); c.lineTo(sx2 * (w / 2 - T * 0.5), sy2 * h / 2); c.stroke(); }
        // the slab's shadow growing as it falls
        if (u > 0.55) { const k = smooth((u - 0.55) / 0.45); c.fillStyle = `rgba(0,0,0,${0.3 * k})`; c.fillRect(-w / 2 * k, -h / 2 * k, w * k, h * k); }
        c.rotate(-s.a); cdLabel(c, String(Math.ceil(left)), 0, 0, T, '#FFFFFF', T * 0.7); }
      else if (s.kind === 'shock') { const r = s.r * T; c.fillStyle = `rgba(10,6,8,${0.15 + u * 0.3})`; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.fillStyle = TN.rgba(WARN, 0.06 + u * 0.16); c.beginPath(); c.arc(0, 0, r * u, 0, TAU); c.fill(); c.strokeStyle = 'rgba(8,4,6,.85)'; c.lineWidth = Math.max(2, T * 0.14); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.strokeStyle = edge; c.lineWidth = Math.max(1.5, T * 0.08); c.stroke(); cdLabel(c, String(Math.ceil(left)), 0, 0, T, '#FFFFFF', T * 0.55); }
      c.restore(); }
    // the great gaze: a dashed preview while the lids open, then the cone (the screens' shadows cut in) with its countdown
    if (M.G && RX && typeof BAS !== 'undefined') { const G = M.G, src = G.src, left = Math.max(0, G.castAt - G.t);
      if (G.state === 'lids' || G.state === 'crack') BAS.drawPreview(c, RX, src, src.a);
      else if (G.state === 'hold' && !G.resolved) { BAS.drawCone(c, RX, src, 1); const u = clamp((G.t - G.holdAt) / (G.castAt - G.holdAt), 0, 1), Xs = FX.sx(src.x), Ys = FX.sy(src.y);
        c.save(); c.strokeStyle = TN.rgba(WARN, 0.9); c.lineWidth = Math.max(3, T * 0.22); c.beginPath(); c.arc(Xs, Ys, T * 5.2, src.a - src.spread, src.a - src.spread + src.spread * 2 * u); c.stroke(); c.restore(); }
      if (!G.resolved && !(M.W && G.state !== 'hold')) { const d = G.state === 'hold' ? 7 : 6, lx = FX.sx(src.x + Math.cos(src.a) * d), ly = FX.sy(src.y + Math.sin(src.a) * d); cdLabel(c, G.state === 'hold' ? `THE GAZE · ${Math.ceil(left)}` : `LIDS OPENING · ${Math.ceil(left)}`, lx, ly, T, G.state === 'hold' ? '#FFFFFF' : RED_HI, T * 0.45); } }
    // witnesses: the cones' countdowns, the target stop, the shared shadow outlined
    if (M.W) { const W = M.W; for (const E of W.eyes) if (!E.live && W.t >= E.openAt - 0.01) { const lx = FX.sx(E.src.x + Math.cos(E.src.a) * 6), ly = FX.sy(E.src.y + Math.sin(E.src.a) * 6); cdLabel(c, `WITNESS ${E.i + 1} · ${Math.ceil(Math.max(0, E.liveAt - W.t))}`, lx, ly, T, RED_HI, T * 0.42); }
      const P = W.pick; if (P && P.scr && P.scr.i !== P.j && !P.scr.moving) { const st = P.scr.stops[P.j], X1 = FX.sx(st[0]), Y1 = FX.sy(st[1]), bob = Math.abs(Math.sin(t * 4)) * T * 0.2; c.save(); c.strokeStyle = GOLD; c.lineWidth = Math.max(2, T * 0.1); c.setLineDash([T * 0.25, T * 0.18]); c.beginPath(); c.ellipse(X1, Y1, T * 1.9, T * 0.6, 0, 0, TAU); c.stroke(); c.setLineDash([]); c.fillStyle = GOLD; c.beginPath(); c.moveTo(X1, Y1 - T * 0.5 - bob); c.lineTo(X1 - T * 0.3, Y1 - T * 0.95 - bob); c.lineTo(X1 + T * 0.3, Y1 - T * 0.95 - bob); c.closePath(); c.fill(); c.restore(); cdLabel(c, 'SLIDE THE SCREEN HERE', X1, Y1 + T * 1.0, T, GOLD, T * 0.38); } }
    c.restore(); }

  /* ---------- over everything: falling slabs, the weak points' labels, the node's call ---------- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M.P) return; c.save();
    for (const s of FX.S.tele) if (s.ink === 'slab' && !s.done) { const u = s.age / s.t; if (u < 0.55) continue; const k = (u - 0.55) / 0.45, h = Math.pow(1 - k, 2) * 13, X = FX.sx(s.x), Y = FX.sy(s.y) - h * T; c.save(); c.translate(X, Y); slabArt(c, s.w * T * 0.9, s.h * T * 0.9, T * 0.35, s.a, Math.max(1.2, T * 0.06), s.seed || 1); c.restore(); }
    const wk = FX.S.weak; const lab = (w, s) => { if (!w || w.dead) return; const X = FX.sx(w.x), Y = FX.sy(w.y), pu = 0.5 + 0.5 * Math.sin(t * 7); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GOLD; c.globalAlpha = 0.5 + 0.4 * pu; c.lineWidth = Math.max(2, T * 0.13); c.beginPath(); c.arc(X, Y, T * (w.r + 0.2 + pu * 0.15), 0, TAU); c.stroke(); c.restore(); cdLabel(c, s, X, Y - T * (w.r + 0.9), T, GOLD, T * 0.42); };
    lab(wk.limb, 'EXPOSED LIMB ×2 · STRIKE IT'); lab(wk.eye, 'OPEN EYE · STRIKE IT'); lab(wk.beye0, 'BACK EYE ×2'); lab(wk.beye1, 'BACK EYE ×2');
    if (M.W && M.W.node && !M.W.node.dead) { const n = M.W.node, X = FX.sx(n.x), Y = FX.sy(n.y); cdLabel(c, 'CALCITE EYE NODE · BREAK IT', X, Y - T * 2.6, T, CAL_HI, T * 0.4); if (M.G && !M.G.resolved) cdLabel(c, `the great gaze in ${Math.ceil(Math.max(0, M.G.castAt - M.G.t))}`, X, Y + T * 0.9, T, RED_HI, T * 0.34); }
    c.restore(); }

  /* ---------- the ground: the Sanctuary of the Veiled Eye, a 38 m square of basalt under the sealed wall-eye ---------- */
  function paintFloor(c, A2) { const rnd = A2.rnd, E = A2.R + 1.5, S = 19;
    c.fillStyle = '#060608'; c.fillRect(-E, -E, E * 2, E * 2);
    // the curb round the square
    c.fillStyle = '#18181C'; c.fillRect(-S - 0.8, -S - 0.8, (S + 0.8) * 2, (S + 0.8) * 2); c.fillStyle = '#0E0E11'; c.fillRect(-S - 0.8, S + 0.25, (S + 0.8) * 2, 0.55);
    // basalt flagstones, 2 m, each its own tone with a lit upper edge and a dark lower one; ochre dust settled in places
    const FL = ['#33333A', '#2E2E35', '#38383F', '#2B2B31', '#313137'];
    for (let y = -S; y < S - 0.01; y += 2) for (let x = -S; x < S - 0.01; x += 2) { const split = rnd() < 0.14; const tile = (tx, ty, s) => { c.fillStyle = FL[Math.floor(rnd() * FL.length)]; c.fillRect(tx + 0.05, ty + 0.05, s - 0.1, s - 0.1); c.fillStyle = 'rgba(200,200,215,.05)'; c.fillRect(tx + 0.05, ty + 0.05, s - 0.1, 0.1); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(tx + 0.05, ty + s - 0.15, s - 0.1, 0.1); };
      if (split) { tile(x, y, 1); tile(x + 1, y, 1); tile(x, y + 1, 1); tile(x + 1, y + 1, 1); } else tile(x, y, 2);
      if (rnd() < 0.18) { let px = x + 0.3 + rnd() * 1.4, py = y + 0.3 + rnd() * 1.4; c.strokeStyle = 'rgba(6,6,8,.6)'; c.lineWidth = 0.045; c.beginPath(); c.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (rnd() - 0.5) * 0.7; py += (rnd() - 0.5) * 0.7; c.lineTo(px, py); } c.stroke(); } }
    c.fillStyle = '#0C0C0F'; for (let k = -S; k <= S; k += 2) { c.fillRect(k - 0.03, -S, 0.06, S * 2); c.fillRect(-S, k - 0.03, S * 2, 0.06); }
    for (let i = 0; i < 26; i++) { const x = (rnd() * 2 - 1) * S * 0.9, y = (rnd() * 2 - 1) * S * 0.9, r = 1 + rnd() * 3, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(161,142,101,.13)'); g.addColorStop(1, 'rgba(161,142,101,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 700; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(196,179,140,.1)'; c.fillRect((rnd() * 2 - 1) * S, (rnd() * 2 - 1) * S, 0.06, 0.06); }
    // a processional band inlaid in ochre round the square, and a carved closed eye at its heart
    c.strokeStyle = '#3E3424'; c.lineWidth = 0.32; c.strokeRect(-S + 0.6, -S + 0.6, (S - 0.6) * 2, (S - 0.6) * 2); c.strokeStyle = OCH; c.lineWidth = 0.12; c.strokeRect(-S + 0.6, -S + 0.6, (S - 0.6) * 2, (S - 0.6) * 2);
    c.strokeStyle = 'rgba(196,179,140,.4)'; c.lineWidth = 0.05; c.strokeRect(-S + 0.9, -S + 0.9, (S - 0.9) * 2, (S - 0.9) * 2);
    { const cy = 4.5, w = 11; c.strokeStyle = 'rgba(216,209,187,.16)'; c.lineWidth = 0.22; c.beginPath(); c.moveTo(-w / 2, cy); c.quadraticCurveTo(0, cy - 3.6, w / 2, cy); c.quadraticCurveTo(0, cy + 3.6, -w / 2, cy); c.stroke(); c.lineWidth = 0.14; c.beginPath(); c.moveTo(-w * 0.42, cy + 0.15); c.quadraticCurveTo(0, cy + 2.2, w * 0.42, cy + 0.15); c.stroke(); for (const u of [-0.3, 0, 0.3]) { c.beginPath(); c.moveTo(u * w, cy + 1.6 - Math.abs(u) * 0.8); c.lineTo(u * w * 1.2, cy + 2.8 - Math.abs(u) * 1.0); c.stroke(); }
      c.strokeStyle = 'rgba(161,142,101,.2)'; c.lineWidth = 0.1; c.beginPath(); c.arc(0, cy, 7.2, 0, TAU); c.stroke(); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 6.8, cy + Math.sin(a) * 6.8); c.lineTo(Math.cos(a) * 7.6, cy + Math.sin(a) * 7.6); c.stroke(); } }
    // dull red seams in the stone near the north wall (where its light leaks)
    for (let i = 0; i < 7; i++) { let x = (rnd() * 2 - 1) * 12, y = -S + 1.5 + rnd() * 6; c.strokeStyle = 'rgba(138,70,64,.45)'; c.lineWidth = 0.07; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (rnd() - 0.5) * 1.6; y += rnd() * 0.9; c.lineTo(x, y); } c.stroke(); }
    // the north wall: a dark plinth of great blocks, an ochre band (the wall-eye is set into it by the stage)
    c.fillStyle = '#1A1A1E'; c.fillRect(-E, -E, E * 2, E - S + 0.85); c.fillStyle = '#121215'; for (let x = -E; x < E; x += 2.4) c.fillRect(x, -E, 0.08, E - S + 0.85); c.fillStyle = 'rgba(161,142,101,.6)'; c.fillRect(-E, -S + 0.55, E * 2, 0.12); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(-E, -S + 0.67, E * 2, 0.3);
    c.strokeStyle = 'rgba(5,5,7,.9)'; c.lineWidth = 0.16; c.strokeRect(-S, -S, S * 2, S * 2); }
})());
