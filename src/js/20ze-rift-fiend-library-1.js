/* ---------- SYLLAX THE BOOKWYRM ----------
   The Library of Unwritten Lives' first boss, in the Reading Circle: a round reading-room floor some twenty-eight metres
   across adrift in the ink-dark void, its parchment-marble tiles laid in rings round a great eight-point compass inlaid
   in gold and burgundy, a band of burgundy carpet at its rim, giant bookcases standing round its far edge and low stacks
   of books and candelabras along its near one; beyond, the void, the black moon and shelves drifting in the dark.
   Syllax is a six-metre serpent of books: five thick volumes for a body, laid end to end and bound by a leather cord,
   their parchment page-edges facing outward and their burgundy covers, tooled in gold, forming its upper plates. Its
   head is an open book: the two covers are its jaws, a row of page-teeth along each, and between them floats one small
   gold eye. Its tail ends in a long ribbon bookmark. It crawls in wide S-curves round the floor, a hump rippling down its
   volumes, and it always opens its cover-jaws before it strikes.
   Sentence Break: it writes a line of page wedges across the whole floor (shown first, the arrows its way) and sends it
   sweeping over the floor. Missing Word: one wide gap in the line, its lane marked bright across the floor: stand in
   the lane and the line passes round you. From half health two lines sweep, one after the other (one dot and two dots
   on their lanes give the order): stand in the first lane, then step across into the second.
   Cover Snap: the jaws gape, a cone is shown, and it lunges and snaps. Dodge it and it bites the floor and sticks there:
   STUCK, its gold eye bared (the weak point) for a few seconds.
   Errata: it writes a copy of its head out of a pool of ink. The genuine head casts a solid gold shadow; the copy is a
   hollow, dashed violet thing with a dashed violet shadow, and its cone is only a dashed outline. Only the genuine head
   bites (and sticks in the floor when it misses); one hit pops the copy.
   Ribbon Lash: its bookmark ribbon coils back and whips across a shown arc behind it.
   The Unbinding (at half health): its covers fly open and its pages tear loose: a swarm of loose pages (and a few margin
   worms) pours over the floor for a few seconds while it lies open, out of reach. Every page torn away is one it loses:
   when it re-binds it is MISBOUND, reeling, its eye bared, for longer the more were torn. Those left fly back in and
   mend it a little. In the second phase loose pages flutter out now and then.
   It is never still: the hump rolls down its volumes as it crawls, the covers breathe open and shut, the eye follows
   the pet, the ribbon trails and sways; struck, its head jerks back and its volumes jolt. */
RiftFiend.define({ id: 'syllax', hpK: 1.25, dmgK: 1.25, name: 'Syllax', title: 'The Bookwyrm', color: '#6B324F', glow: '#F2DC9A', accent: '#FFE9A8', biome: 'catalogue', r: 1.5, els: ['light', 'dark'], phases: 2 }, (() => {
  const { TAU, TN, sorted, hit } = RiftFiend, tubeLite = TN.tubeLite;
  const { INK, PARCH, PARCH_D, PARCH_HI, BURG, BURG_HI, GOLD, GOLD_HI, VIOLET, VIOLET_HI, LEATHER, WOOD, WOOD_D } = LIB;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const turnTo = (a, b, dt, w) => a + clamp(angTo(a, b), -w * dt, w * dt);
  const easeOut = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3), smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const mix = (a, b, u) => DunFiend.KIT.mixC(a, b, clamp(u, 0, 1)), rgba = TN.rgba;
  const hsh = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  // the painter's palette
  const COVERS = [BURG, '#5C2844', '#74365A', '#5A2440', '#6A2E4E'], COV_SH = '#3C1A2E', ENDP = '#3A2552', PG = PARCH, PG_SH = '#BFA272', SPINE = LEATHER;
  const RIB = '#C2324F', RIB_SH = '#801A33', RIB_HI = '#F2708C';
  const SAFE = '#9CFFD8', SAFE2 = '#8EC8FF', DANGER = '#FF5A78', LASHC = '#FF9A5A', GHOST = '#B49CFF';
  // the Reading Circle: the floor the pet walks (the painted floor runs a little past it, under the shelves)
  const AR = 13.6, RF = AR + 0.6;
  /* the body (metres; u forward, v left, h up): the head is a book hinged at its back (u0) at the height of its lower
     half (hz); the five volumes behind it, each its length, half width and height; their centres' distances back
     along the path the head has crawled; the ribbon bookmark */
  const HEAD = { u0: -0.88, u1: 0.92, w: 0.98, hz: 0.46, H: 0.92 };
  const SEGS = [{ L: 1.24, W: 0.88, H: 0.94 }, { L: 1.18, W: 0.82, H: 0.88 }, { L: 1.1, W: 0.74, H: 0.8 }, { L: 1.0, W: 0.64, H: 0.7 }, { L: 0.9, W: 0.54, H: 0.6 }];
  const S_OFF = SEGS.map((_, i) => 1.42 + i * 1.07), RIB_S = S_OFF[4] + 0.42, RIB_LEN = 2.9, TRAIL_MAX = 12.5;
  // the light (from the upper left, a little toward the camera), and a box's faces as corner indices (bit 0 u, 1 v, 2 h)
  const LV = (() => { const l = [-0.55, 0.26, 0.8], n = Math.hypot(l[0], l[1], l[2]); return l.map(x => x / n); })();
  const FACES = [['top', [4, 5, 7, 6]], ['bot', [0, 1, 3, 2]], ['front', [1, 3, 7, 5]], ['back', [0, 2, 6, 4]], ['left', [2, 3, 7, 6]], ['right', [0, 1, 5, 4]]];
  const skin = (col, sh, deco) => ({ col, sh, mid: mix(col, sh, 0.5), deco });
  const SK = { page: skin(PG, PG_SH, 'pages'), text: skin(PARCH_HI, PG_SH, 'text'), spine: skin(SPINE, '#24101C', 'spine'), endp: skin(ENDP, '#221436', 'endp') };
  const COVSK = COVERS.map(col => ({ tool: skin(col, COV_SH, 'tool'), plain: skin(col, COV_SH), hi: skin(mix(col, BURG_HI, 0.35), COV_SH) }));
  const HEADSK = { tool: skin('#76365A', COV_SH, 'face'), plain: skin('#76365A', COV_SH), endp: SK.endp };
  // the copy: the same book, washed violet and pale
  const COPYSK = { tool: skin('#5A4A9A', '#33285E', 'face'), plain: skin('#5A4A9A', '#33285E'), endp: skin('#2A2050', '#1A1236'), page: skin('#D8CCF4', '#9A8CC8', 'pages'), text: skin('#E8E0FF', '#9A8CC8', 'text') };
  // the attack rotations (the second phase's from half health)
  const CYC1 = ['sentence', 'bite', 'lash', 'errata', 'bite', 'lash'], CYC3 = ['sentence', 'errata', 'bite', 'lash', 'sentence', 'bite', 'errata', 'lash'];
  /* ---- the loose pages: torn out of Syllax, they flutter in, fold into paper darts and dart along a shown line ---- */
  Object.assign(MON, { loosepage: { name: 'Loose page', from: 999, hp: 180, spd: 2.3, r: 0.36, dmg: 13, xp: 8, coin: 0.4, color: PARCH_HI, bio: [], fly: true, tip: 'A page torn loose from Syllax. It folds into a paper dart and darts along a shown line: step off it.', kit: [] } });
  Object.assign(DunAI.mon, { loosepage(m, A, X) {
    if (m.launch) { const L = m.launch; L.t += A.dt; const u = clamp(L.t / L.dur, 0, 1); m.x = lerp(L.x0, L.x1, u); m.y = lerp(L.y0, L.y1, u); m.z = lerp(L.z0, 0, u) + Math.sin(u * Math.PI) * L.h; if (u >= 1) { m.launch = null; m.z = 0; m.under = false; } return; }
    if (m.dashT > 0) { m.dashT -= A.dt; m.mode = 'dash'; X.moveEnt(m, Math.cos(m.da) * 12.5 * A.dt, Math.sin(m.da) * 12.5 * A.dt); if (!m.dhit && A.d < m.r + X.me.r + 0.25) { m.dhit = true; X.hurtPet(m.dmg * 1.2, m); } if (m.dashT <= 0) { m.mode = null; m.cd = 1.8 + Math.random() * 1.2; } return; }
    if (m.foldT > 0) { m.foldT -= A.dt; m.mode = 'block'; if (m.foldT <= 0) { m.dashT = 0.4; m.dhit = false; } return; }
    m.mode = null; DunAI.keepRange(m, A, X, 2.0, 4.0); const w = Math.sin(m.t * 7 + (m.wob || (m.wob = Math.random() * 6))) * 1.5; X.moveEnt(m, -A.uy * w * A.dt, A.ux * w * A.dt);
    if (m.cd <= 0 && A.d < 5.2 && A.los()) { m.foldT = 0.55; m.da = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 5.4, w: 0.7, life: 0.55, max: 0.55, src: m, color: PARCH_HI }); } } });
  { const { shade: dShade, stroke, lwOf, MP, EXT, NF } = DunArt;
    /* a loose page: a sheet folded down its middle like a moth, its two halves flapping, inked lines on them, one ink
       eye at the fold; folded for its dart it is a paper dart */
    MP.loosepage = (c, r, ph, o) => { const lw = lwOf(r), dart = o.mode === 'block' || o.mode === 'dash', fl = Math.sin(ph * TAU * 2), bob = Math.sin(ph * TAU) * r * 0.14;
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, r * 0.95, r * 0.75, r * 0.2, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, -r * 0.45 + bob);
      if (dart) { c.beginPath(); c.moveTo(r * 1.2, 0); c.lineTo(-r * 0.85, -r * 0.62); c.lineTo(-r * 0.5, 0); c.lineTo(-r * 0.85, r * 0.5); c.closePath(); c.fillStyle = dShade(c, PARCH_HI, r, -r * 0.2, -r * 0.3, 0.25); c.fill(); stroke(c, lw);
        c.strokeStyle = 'rgba(29,26,40,.45)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(r * 1.1, 0); c.lineTo(-r * 0.5, 0); c.stroke();
        c.fillStyle = INK; c.beginPath(); c.arc(r * 0.45, -r * 0.12, r * 0.13, 0, TAU); c.fill(); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(r * 0.48, -r * 0.15, r * 0.05, 0, TAU); c.fill(); c.restore(); return; }
      for (const sd of [-1, 1]) { const tipY = -r * (0.5 + fl * 0.38), lowY = r * (0.22 - fl * 0.2);
        c.beginPath(); c.moveTo(0, -r * 0.3); c.lineTo(sd * r * 1.08, tipY); c.lineTo(sd * r * 0.98, lowY); c.lineTo(0, r * 0.32); c.closePath(); c.fillStyle = sd < 0 ? PARCH_HI : PARCH; c.fill(); stroke(c, lw);
        c.strokeStyle = 'rgba(29,26,40,.35)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 3; i++) { const u = 0.3 + i * 0.2; c.moveTo(sd * r * 0.15, lerp(-r * 0.2, r * 0.25, u)); c.lineTo(sd * r * 0.85, lerp(tipY, lowY, u) * 0.9); } c.stroke();
        if (sd > 0) { c.fillStyle = 'rgba(207,173,98,.7)'; c.beginPath(); c.moveTo(sd * r * 1.08, tipY); c.lineTo(sd * r * 0.82, tipY + r * 0.05); c.lineTo(sd * r * 1.0, tipY + r * 0.24); c.closePath(); c.fill(); } }
      c.fillStyle = BURG; c.fillRect(-r * 0.07, -r * 0.34, r * 0.14, r * 0.68); c.fillStyle = INK; c.beginPath(); c.ellipse(0, -r * 0.42, r * 0.17, r * 0.15, 0, 0, TAU); c.fill(); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(r * 0.04, -r * 0.45, r * 0.06, 0, TAU); c.fill();
      c.restore(); };
    Object.assign(EXT, { loosepage: 3.0 }); Object.assign(NF, { loosepage: 6 }); }
  const HEAD_SKINS = headSkins(false), COPY_SKINS = headSkins(true);
  return {
    arenaR: AR, firstAct: 'crawl', artY: 0.62, ambient: 'motes',
    artPoses: [{ name: 'crawling', mem: {} }, { name: 'jaws open', mem: { jaw: 1.1, rear: 0.8 } }, { name: 'stuck: the eye bared', mem: { stuckK: 1, jaw: 0.35 } }, { name: 'unbound', mem: { openK: 1, jaw: 1 } }],
    phaseNames: ['The Reading Circle', 'The Reading Circle', 'The Unbinding', 'The Unbinding'],
    props(C) { const out = []; for (let i = 0; i < 15; i++) { const a = Math.PI + (i + 0.5) / 15 * Math.PI; out.push({ kind: 'case', i, x: C.x + Math.cos(a) * (AR + 0.35), y: C.y + Math.sin(a) * (AR + 0.35) }); }
      for (let i = 0; i < 7; i++) { const a = (i + 0.5) / 7 * Math.PI; out.push({ kind: i === 1 || i === 5 ? 'candle' : 'stack', i, x: C.x + Math.cos(a) * (AR + 0.3), y: C.y + Math.sin(a) * (AR + 0.3) }); }
      return out; },
    propKeep: { every: 30, box: p => p.kind === 'case' ? [-1.5, -4.9, 1.5, 0.6] : [-1.6, -3.7, 1.6, 0.6] },
    drawProp(c, FX, p, X, Y, T) { const PR = DunWorld.PROPS; c.translate(X, Y); if (p.kind === 'case') LIB.bookcase(c, T, p.i % 4); else if (p.kind === 'candle') PR.candelabra(c, T, p.i); else PR.bookstack(c, T, p.i); },
    paintGround(c, A) { paintFloor(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.noTouch = true; m.x = C.x; m.y = C.y - 3.4; m.act = 'enter';
      Object.assign(M, { bt: 0, hd: Math.PI / 2, hdTo: Math.PI / 2, mv: Math.PI / 2, v: 0, vTo: 0, spdK: 0, wave: 0, orb: 0, odir: 1, jaw: 0.2, jawTo: 0.22, rear: 0, rearTo: 0, stuckK: 0, openK: 0, openTo: 0, eyeK: 0, recoil: 0, jolt: 0, look: [0, 0.4],
        lashK: 0, lashKTo: 0, ribA: null, ribATo: 0, ribBend: 0, ribBendTo: 0, ribZ: 0, ribZTo: 0, lashWait: 0, picks: 0, nextAct: null, last: null, seen: {}, stuckCd: 0, broodT: 6, stunKind: null, stunWas: null, wasStun: false, taught: false,
        lines: null, sn: null, bite: null, ls: null, er: null, ub: null, cracks: [], pools: [], dropZ: null, landed: null,
        stat: { lines: 0, lineHit: 0, linePass: 0, gapSafe: 0, bites: 0, biteHit: 0, stuck: 0, errata: 0, copyPopped: 0, fakeSnaps: 0, fakeIn: 0, lashes: 0, unbind: 0, poured: 0, torn: 0, rebound: 0, misbound: 0 } });
      initTrail(m, M); M.orb = Math.atan2(m.y - FX.me.y, m.x - FX.me.x); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; clearActs(FX, m, M); m.stunT = 0; M.recoil = 0.8; M.jolt = 1;
      if (lv >= 3) { startUnbind(FX, m); FX.H.after(0.9, () => FX.H.banner('UNBOUND!', 'Its pages tear loose and swarm: shred them before it re-binds. Each one lost weakens it', GOLD_HI, 3.0, true)); } },
    ai(FX, m, dt) {
      const M = FX.mem, F = fk(FX); m.actT += dt; m.noTouch = true; M.vTo = 0;
      switch (m.act) {
        case 'crawl': crawl(FX, m, M, dt, F); brood(FX, m, M, dt);
          if (M.lashWait > 0) { M.lashWait -= dt; if (tailNear(FX, m, M)) { M.lashWait = 0; startLash(FX, m); } else if (M.lashWait <= 0) { M.lashWait = 0; startBite(FX, m); } }
          else if (m.actT > (FX.S.lv >= 3 ? 1.15 : 1.45) / F) { m.actT = 0; choose(FX, m); } break;
        case 'sentence': sentenceStep(FX, m, M, dt); break;
        case 'bite': if (M.bite) biteStep(FX, m, M, dt, F); else endAct(m, M); break;
        case 'errata': errataStep(FX, m, M, dt, F); break;
        case 'lash': lashStep(FX, m, M, dt); break;
        case 'unbind': ubTick(FX, m, M, dt); break;
        default: endAct(m, M);
      }
      move(FX, m, M, dt);
      if (!m.under) FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem, P = pose(m, M), e = eyeAt(P); m.noTouch = true; M.vTo = 0; M.v = 0;
      FX.weak('eye', e[0], e[1] - e[2], 0.95, 2.5, m.stunT > 0.05);
      M.twT = (M.twT || 0) - dt; if (M.twT <= 0) { M.twT = 0.22 + Math.random() * 0.15; FX.H.sparks(e[0] + FX.rnd(-0.4, 0.4), e[1] - e[2] - 0.2, Math.random() < 0.5 ? GOLD_HI : '#FFFFFF', 3, 3); if (M.stunKind === 'stuck' && Math.random() < 0.4) FX.H.part({ kind: 'shard', x: m.x + FX.rnd(-0.6, 0.6), y: m.y, vx: FX.rnd(-2, 2), vy: FX.rnd(-4, -1), g: 10, life: 0.5, max: 0.5, size: 3, rot: Math.random() * 3, vr: 6, color: Math.random() < 0.5 ? PARCH_HI : PG_SH }); }
      if (!m.under) FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.trail) return; M.bt += dt; const stun = m.stunT > 0, me = FX.me;
      if (!stun) { if (FX.S.weak.eye) FX.weak('eye', 0, 0, 0, 0, false);
        if (M.wasStun) { M.wasStun = false; M.recoil = 0.7; M.jolt = 0.6; FX.H.text(m.x, m.y - 2.6, M.stunWas === 'misbound' ? 'It shakes its pages straight' : 'It wrenches its jaws free', GOLD_HI, 13); FX.H.sfx.thud(); FX.H.shake(4, 0.2); M.stunKind = null; } }
      else M.wasStun = true;
      M.recoil = decay(M.recoil, dt, 2.6); M.jolt = decay(M.jolt, dt, 3); M.stuckCd -= dt; M.hitK = decay(M.hitK, dt, 4);
      if (m.act === 'enter') enterAnim(FX, m, M); else if (M.dropZ) M.dropZ = null;
      // the first lesson, once it is moving
      if (!M.taught && m.act === 'crawl') { M.taught = true; m.actT = -2.4; FX.H.banner('THE BOOKWYRM', 'Its cover-jaws open before every strike. Make it miss a bite: it sticks fast, its GOLD EYE bare', GOLD_HI, 3.0, true); }
      // the jaws, the rearing, sticking in the floor, the covers opening (the unbinding)
      const jawW = stun ? (M.stunKind === 'stuck' ? 0.34 : 0.62) : m.act === 'unbind' ? 1.05 : M.jawTo + Math.sin(M.bt * 2.3) * 0.05;
      M.jaw = toward(M.jaw, jawW, dt, jawW < M.jaw ? 14 : 6); M.jawTo = 0.22;
      M.rear = toward(M.rear, stun || m.act === 'unbind' ? 0 : M.rearTo, dt, 5); M.rearTo = 0;
      M.stuckK = toward(M.stuckK, stun && M.stunKind === 'stuck' ? 1 : 0, dt, stun ? 12 : 4); M.eyeK = toward(M.eyeK, stun ? 1 : 0, dt, 5);
      M.openK = toward(M.openK, M.openTo, dt, M.openTo > M.openK ? 2.2 : 3.2);
      if (!stun && m.act !== 'enter') M.hd = turnTo(M.hd, M.hdTo == null ? M.hd : M.hdTo, dt, 6);
      // the eye follows the pet
      const lx = clamp((me.x - m.x) / 5, -1, 1), ly = clamp((me.y - m.y) / 5, -1, 1); M.look[0] = toward(M.look[0], lx, dt, 8); M.look[1] = toward(M.look[1], ly, dt, 8);
      // the ribbon: trailing, or coiled back and whipped across in a lash
      M.lashK = toward(M.lashK, M.lashKTo, dt, M.lashKTo > M.lashK ? 7 : 3); if (m.act !== 'lash') M.lashKTo = 0;
      if (M.ribA == null || M.lashK < 0.02) { const q = trailAt(M, RIB_S); M.ribA = q[2] + Math.PI; M.ribBend = 0; M.ribZ = 0; }
      else { const fast = M.ls && M.ls.struck; M.ribA = M.ribA + clamp(angTo(M.ribA, M.ribATo), -dt * (fast ? 16 : 4), dt * (fast ? 16 : 4)); M.ribBend = toward(M.ribBend, M.ribBendTo, dt, fast ? 14 : 4); M.ribZ = toward(M.ribZ, M.ribZTo, dt, fast ? 10 : 4); }
      updTrail(m, M); M.wave += dt * (1.5 + (M.v || 0) * 1.8); M.spdK = toward(M.spdK, clamp((M.v || 0) / 3, 0, 1), dt, 4);
      updLines(FX, m, M, dt); updCopy(FX, m, M, dt);
      M.cracks.forEach(k => k.t += dt); M.cracks = M.cracks.filter(k => k.t < 4); M.pools.forEach(k => k.t += dt); M.pools = M.pools.filter(k => k.t < k.life);
      // the unbinding: pages fluttering out of its open volumes
      if (M.openK > 0.3 && Math.random() < dt * 14) { const P = pose(m, M), s = P.segs[Math.floor(Math.random() * 5)]; FX.H.part({ kind: 'shard', x: s.x + FX.rnd(-0.5, 0.5), y: s.y - 0.9, vx: FX.rnd(-2.5, 2.5), vy: FX.rnd(-5, -2), g: 4, life: 0.9, max: 0.9, size: 4, rot: Math.random() * 3, vr: 7, color: Math.random() < 0.6 ? PARCH_HI : PARCH }); } },
    dmgK(FX, m) { const M = FX.mem; if (!M) return 1; M.recoil = Math.max(M.recoil || 0, 0.35); M.jolt = Math.max(M.jolt || 0, 0.5); M.hitK = 1; return 1; },
    onWeakHit(FX) { FX.mem.recoil = 0.6; FX.mem.jolt = 0.8; },
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.trail || m.dead || m.act === 'enter') return null; const q = trailAt(M, 2.2), x = (m.x + q[0]) / 2, y = (m.y + q[1]) / 2 - 1.0, d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(0.36, 3.0 / d) }; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { Y += (m.z || 0) * T * 4; drawSyllax(c, FX, m, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'copy') drawCopy(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawAir(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function fk(FX) { return FX.S.fast; }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.3 : 1.1, true); }
  function endAct(m, M) { m.act = 'crawl'; m.actT = 0; M.rearTo = 0; M.jawTo = 0.22; }
  // (telegraphs are disarmed, not spliced out: one may be landing in the very loop that called this)
  function cancelTele(FX) { FX.S.tele.forEach(s => { s.dmg = 0; s.fn = null; s.done = true; s.linger = 0; }); }
  function clearActs(FX, m, M) { cancelTele(FX); M.lines = null; M.sn = null; M.bite = null; M.ls = null; M.lashKTo = 0; M.lashWait = 0;
    if (M.er) { const o = M.er.copy; if (o && !o.dead) { o.dead = true; FX.H.sparks(o.x, o.y - 0.6, VIOLET_HI, 10, 4); } M.er = null; } endAct(m, M); }
  function choose(FX, m) { const M = FX.mem, P = FX.S.lv; let k = M.nextAct; M.nextAct = null; const forced = !!k;
    // (nothing of an earlier act may still be pending when a new one starts)
    if (M.bite || M.ls || M.lines) { cancelTele(FX); M.bite = null; M.ls = null; M.lines = null; M.sn = null; }
    if (!k) { const cyc = P >= 3 ? CYC3 : CYC1; k = cyc[M.picks % cyc.length]; M.picks++; }
    // the lash wants the pet by its tail: it crawls tighter round the pet for a moment first (or bites instead)
    if (!forced && k === 'lash' && !tailNear(FX, m, M)) { M.lashWait = 2.4; return; }
    M.last = k; ({ sentence: startSentence, bite: startBite, lash: startLash, errata: startErrata })[k](FX, m); }
  function tailNear(FX, m, M) { const q = trailAt(M, RIB_S), me = FX.me, d = Math.hypot(me.x - q[0], me.y - q[1]); return d < 5.0 && d < Math.hypot(me.x - m.x, me.y - m.y) + 1.5; }
  /* ---- the crawl: wide S-curves round the pet, always moving forward like a serpent ---- */
  function crawl(FX, m, M, dt, F) { const me = FX.me, C = FX.C, tight = M.lashWait > 0;
    M.orb += dt * (tight ? 0.6 : 0.3) * M.odir * F; if (Math.random() < dt * 0.06) M.odir = -M.odir;
    const R = tight ? 3.0 : 5.4 + Math.sin(M.bt * 0.45) * 0.9, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 2.6);
    let want = Math.atan2(p.y - m.y, p.x - m.x) + Math.sin(M.bt * 1.5) * 0.6;
    const dc = Math.hypot(m.x - C.x, m.y - C.y); if (dc > C.R - 3.4) { const inw = Math.atan2(C.y - m.y, C.x - m.x); want = want + angTo(want, inw) * clamp((dc - (C.R - 3.4)) / 1.6, 0, 1); }
    M.mv = turnTo(M.mv, want, dt, 2.5 * F); M.vTo = (tight ? 3.6 : 3.0) * F; M.hdTo = M.mv; M.jawTo = 0.22 + 0.1 * Math.max(0, Math.sin(M.bt * 1.1)); }
  function move(FX, m, M, dt) { M.v = toward(M.v, M.vTo, dt, M.vTo > M.v ? 3 : 7); if (M.v > 0.01) { m.x += Math.cos(M.mv) * M.v * dt; m.y += Math.sin(M.mv) * M.v * dt; const q = FX.clampArena(m, 1.4); m.x = q.x; m.y = q.y; } }
  // the head may turn on its neck, but not round onto its own back
  function neckDir(M) { const q = trailAt(M, 0.9); return q[2]; }
  function clampNeck(M, a) { const n = neckDir(M); return n + clamp(angTo(n, a), -1.5, 1.5); }
  function brood(FX, m, M, dt) { if (FX.S.lv < 3 || (M.broodT -= dt) > 0) return; M.broodT = 15; const n = FX.H.mons.filter(q => !q.dead && q.fminion && !q.horde).length; if (n >= 3) return;
    pourPage(FX, m, M, false); pourPage(FX, m, M, false); if (n < 2) callWorm(FX, m, M, false); FX.H.text(m.x, m.y - 2.8, 'Pages flutter loose', PARCH_HI, 13); }

  /* ---- Sentence Break: a line of page wedges written across the floor and sent over it; one Missing Word in it ---- */
  function startSentence(FX, m) { const M = FX.mem, C = FX.C, me = FX.me, P = FX.S.lv, F = fk(FX), R = C.R; m.act = 'sentence'; m.actT = 0;
    const a = Math.atan2(me.y - m.y, me.x - m.x), d = [Math.cos(a), Math.sin(a)], e = [-Math.sin(a), Math.cos(a)], pe = (me.x - C.x) * e[0] + (me.y - C.y) * e[1], lim = R - 3.4;
    const pick = (from, lo, hi) => { for (let k = 0; k < 10; k++) { const g = from + (Math.random() < 0.5 ? -1 : 1) * FX.rnd(lo, hi); if (Math.abs(g) <= lim) return g; } return clamp(from > 0 ? from - lo : from + lo, -lim, lim); };
    const show = (P >= 3 ? 1.45 : 1.6) / F, v = (P >= 3 ? 8.0 : 7.2) * F, gw = P >= 3 ? 2.3 : 2.6, g1 = pick(pe, 2.4, 4.4);
    const line = (order, gapC, delay) => ({ order, a, d, e, s: -R - 0.6, v, gapC, gapW: gw, delay, t: 0, run: false, done: false, hit: false, passed: false, inGap: false });
    M.lines = [line(1, g1, show)]; if (P >= 3) M.lines.push(line(2, pick(g1, 3.4, 5.6), show + 1.8 / F));
    M.stat.lines += M.lines.length; M.sn = { age: 0 }; FX.H.sfx.hum();
    if (P >= 3) say(FX, 'sentence2', 'TWO SENTENCES', 'Two lines sweep in turn: stand in the green lane (ONE dot), then step into the blue lane (TWO dots)', GOLD_HI);
    else say(FX, 'sentence', 'SENTENCE BREAK', 'A line of page wedges sweeps the floor. Stand in the bright lane of the MISSING WORD and it passes round you', GOLD_HI); }
  function sentenceStep(FX, m, M, dt) { const S = M.sn; if (!S) { endAct(m, M); return; } S.age += dt; M.hdTo = M.lines ? M.lines[0].a : M.hd; M.mv = turnTo(M.mv, M.hdTo, dt, 3); M.vTo = 0;
    // it rears and writes: jaws wide while the lines are shown, a roar as each goes
    M.rearTo = 0.85; M.jawTo = 0.95 + 0.15 * Math.sin(M.bt * 9);
    if (!M.lines && S.age > 0.3) { M.sn = null; endAct(m, M); } }
  function updLines(FX, m, M, dt) { const L0 = M.lines; if (!L0) return; const me = FX.me, C = FX.C, R = C.R;
    for (const L of L0) { if (L.done) continue; L.t += dt;
      if (!L.run) { if (L.t >= L.delay) { L.run = true; FX.H.sfx.whoosh(); FX.H.sfx.crack(); FX.H.shake(5, 0.2); M.jaw = 1.2; } continue; }
      L.s += L.v * dt;
      if (Math.abs(L.s) < R && Math.random() < dt * 26) { const hc = Math.sqrt(R * R - L.s * L.s), o = FX.rnd(-hc, hc); if (Math.abs(o - L.gapC) > L.gapW / 2) FX.H.part({ kind: 'shard', x: C.x + L.d[0] * L.s + L.e[0] * o, y: C.y + L.d[1] * L.s + L.e[1] * o - 0.6, vx: L.d[0] * 3 + FX.rnd(-1.5, 1.5), vy: L.d[1] * 3 - 3, g: 8, life: 0.55, max: 0.55, size: 3.5, rot: Math.random() * 3, vr: 8, color: Math.random() < 0.6 ? PARCH_HI : PARCH }); }
      if (!L.hit && !L.passed && !me.dead) { const ps = (me.x - C.x) * L.d[0] + (me.y - C.y) * L.d[1], pe = (me.x - C.x) * L.e[0] + (me.y - C.y) * L.e[1];
        if (Math.abs(ps - L.s) < 0.45 + me.r * 0.5) { const inGap = Math.abs(pe - L.gapC) < L.gapW / 2 - me.r * 0.2;
          if (inGap) L.inGap = true; else if (!me.dodge) { L.hit = true; M.stat.lineHit++; FX.hurt(m.dmg * 1.3); FX.H.text(me.x, me.y - 1.6, 'Struck by the sentence!', DANGER, 13); FX.H.sparks(me.x, me.y, PARCH_HI, 10, 5); } }
        else if (L.s - 0.45 > ps + me.r) { L.passed = true; M.stat.linePass++; if (L.inGap) { M.stat.gapSafe++; FX.H.text(me.x, me.y - 1.6, 'The Missing Word!', SAFE, 13); } } }
      if (L.s > R + 1) L.done = true; }
    if (L0.every(L => L.done)) M.lines = null; }

  /* ---- Cover Snap: the jaws gape, it turns to the pet, a cone is shown, it lunges and snaps; missed, it sticks ---- */
  function startBite(FX, m, o) { const M = FX.mem, F = fk(FX), er = !!(o && o.errata), P = FX.S.lv; if (!er) { m.act = 'bite'; m.actT = 0; }
    M.bite = { age: 0, turn: er ? 0 : 0.36 / F, wait: (er ? (P >= 3 ? 0.95 : 1.05) : (P >= 3 ? 0.8 : 0.92)) / F, a: null, locked: false, lunge: 0, snapped: false, rec: 0, errata: er }; FX.H.sfx.hum();
    if (!er) say(FX, 'bite', 'COVER SNAP', 'Its cover-jaws gape: leave the shown cone. Make it miss and it sticks fast, its gold eye bare', DANGER); }
  function biteStep(FX, m, M, dt, F) { const B = M.bite; B.age += dt;
    if (!B.locked) { M.mv = turnTo(M.mv, FX.angPet(m.x, m.y), dt, 5); M.vTo = 1.2; M.hdTo = M.mv; M.jawTo = 0.95; M.rearTo = 0.55;
      if (B.age >= B.turn) { B.locked = true; B.t0 = B.age; B.a = clampNeck(M, FX.angPet(m.x, m.y)); B.lunge = clamp(FX.dist(m.x, m.y) - 0.7, 1.2, 3.4); M.v = 0; M.vTo = 0; M.hdTo = B.a; M.mv = B.a;
        FX.tele({ shape: 'cone', x: m.x, y: m.y, a: B.a, len: 6.4, spread: 0.52, t: B.wait, dmg: m.dmg * 1.5, col: B.errata ? GOLD_HI : DANGER, real: true, fn: s => snap(FX, m, M, s) }); }
      return; }
    const u = B.age - B.t0; M.hdTo = B.a; M.vTo = 0;
    if (!B.snapped) { M.jawTo = 1.25; M.rearTo = 0.9;
      // the lunge in the last moment: the whole wyrm is pulled after its head
      if (u > B.wait - 0.17 && (B.ld || 0) < B.lunge) { M.rearTo = 0.1; M.jawTo = 1.0; const st = Math.min(B.lunge - (B.ld || 0), B.lunge * dt / 0.17); B.ld = (B.ld || 0) + st; m.x += Math.cos(B.a) * st; m.y += Math.sin(B.a) * st; const q = FX.clampArena(m, 1.3); m.x = q.x; m.y = q.y; }
      return; }
    B.rec += dt; M.jawTo = 0.05; if (B.rec > 0.55) { M.bite = null; endAct(m, M); } }
  function snap(FX, m, M, s) { const B = M.bite; if (!B) return; B.snapped = true; B.rec = 0; const me = FX.me, inC = FX.inShape(s, me.x, me.y, me.r) && !me.dodge; M.stat.bites++; M.jaw = 0.02; M.jolt = 1;
    const mx = m.x + Math.cos(B.a) * 0.9, my = m.y + Math.sin(B.a) * 0.9; FX.H.sfx.crash(); FX.H.shake(9, 0.25); FX.H.boom(mx, my, 1.4, PARCH_HI, '#FFFFFF', { n: 14, shake: 0, smoke: 4 });
    for (let i = 0; i < 6; i++) FX.H.part({ kind: 'shard', x: mx + FX.rnd(-0.6, 0.6), y: my - 0.4, vx: FX.rnd(-3, 3), vy: FX.rnd(-5, -1.5), g: 10, life: 0.6, max: 0.6, size: 4, rot: Math.random() * 3, vr: 8, color: Math.random() < 0.5 ? PARCH_HI : PG_SH });
    if (B.errata) fakeSnap(FX, M);
    if (inC) M.stat.biteHit++; else if (M.stuckCd <= 0 && !m.under) stuck(FX, m, M, mx, my); }
  function stuck(FX, m, M, x, y) { const first = !M.seen.stuck; M.seen.stuck = true; M.stat.stuck++; cancelTele(FX); M.bite = null; M.ls = null; M.lashWait = 0; if (M.er) M.er.done = true; endAct(m, M);
    m.stunT = Math.max(m.stunT || 0, FX.S.lv >= 3 ? 3.4 : 3.8); M.stunKind = 'stuck'; M.stunWas = 'stuck'; M.stuckCd = 6; M.cracks.push({ x, y, a: M.hd, t: 0, seed: Math.floor(Math.random() * 1e4) });
    FX.H.banner('STUCK!', first ? 'It bit the floor and its jaws are stuck fast: its GOLD EYE is bared. Strike it!' : 'Its jaws are stuck: strike the gold eye!', GOLD_HI, first ? 2.6 : 1.5, true); FX.H.shake(10, 0.35); FX.H.flash(0.15, GOLD_HI); }

  /* ---- Errata: a copy of its head written out of the ink; only the genuine head (the solid gold shadow) bites ---- */
  function startErrata(FX, m) { const M = FX.mem, F = fk(FX), me = FX.me; m.act = 'errata'; m.actT = 0;
    const aH = Math.atan2(m.y - me.y, m.x - me.x); let q = null;
    for (const da of [1.7, -1.7, 2.3, -2.3, 1.15, -1.15, Math.PI]) { const a = aH + da, x = me.x + Math.cos(a) * 4.3, y = me.y + Math.sin(a) * 4.3; if (FX.inArena(x, y, 2.4) && Math.hypot(x - m.x, y - m.y) > 3.6) { q = { x, y }; break; } }
    if (!q) q = FX.clampArena({ x: me.x + Math.cos(aH + 1.7) * 4.3, y: me.y + Math.sin(aH + 1.7) * 4.3 }, 2.4);
    const o = FX.obj({ kind: 'copy', x: q.x, y: q.y, r: 1.05, hp: 1, hd: Math.atan2(me.y - q.y, me.x - q.x), jaw: 0.1, rise: 0, rear: 0, onKill: o2 => popCopy(FX, o2) });
    M.er = { age: 0, copy: o, rise: 0.8 / F, aimed: false, fake: null, done: false }; M.stat.errata++; M.pools.push({ x: q.x, y: q.y, t: 0, life: 6 });
    FX.H.boom(q.x, q.y, 1.3, VIOLET, '#FFFFFF', { n: 14, shake: 3, smoke: 5 }); FX.H.sfx.whoosh(); FX.H.ring(q.x, q.y, 0.2, 2.0, 0.5, VIOLET_HI, 0.4);
    say(FX, 'errata', 'ERRATA', 'Only the head with the SOLID GOLD shadow bites. The dashed violet copy is fake: pop it', GOLD_HI); }
  function errataStep(FX, m, M, dt, F) { const E = M.er; if (!E || E.done) { if (M.bite) { biteStep(FX, m, M, dt, F); return; } M.er = E && E.copy && !E.copy.dead ? E : null; endAct(m, M); return; } E.age += dt;
    if (!E.aimed) { M.mv = turnTo(M.mv, FX.angPet(m.x, m.y), dt, 4); M.vTo = 0.9; M.hdTo = M.mv; M.jawTo = 0.8; M.rearTo = 0.7;
      if (E.age >= E.rise) { E.aimed = true; startBite(FX, m, { errata: true }); const o = E.copy; if (o && !o.dead) { const a = Math.atan2(FX.me.y - o.y, FX.me.x - o.x); o.hd = a; E.fake = { x: o.x, y: o.y, a, len: 6.4, spread: 0.52, t: M.bite.wait, age: 0, lunge: clamp(Math.hypot(FX.me.x - o.x, FX.me.y - o.y) - 0.7, 1.2, 3.0) }; }
        biteStep(FX, m, M, 0, F); }
      return; }
    if (M.bite) { biteStep(FX, m, M, dt, F); return; }
    E.done = true; endAct(m, M); }
  // the copy: it rises out of its pool, gapes as the real head does, lunges with it (harmlessly) and dissolves
  function updCopy(FX, m, M, dt) { const E = M.er; if (!E) return; const o = E.copy;
    if (!o || o.dead) { if (!(m.act === 'errata' && !E.done)) M.er = null; return; }
    o.rise = Math.min(1, o.rise + dt / 0.6); o.jaw = toward(o.jaw, E.fake ? (E.fake.age > E.fake.t - 0.17 ? 0.6 : 1.2) : 0.75, dt, 8); o.rear = toward(o.rear, E.fake ? 0.8 : 0.6, dt, 5);
    if (!E.fake) { o.hd = turnTo(o.hd, Math.atan2(FX.me.y - o.y, FX.me.x - o.x), dt, 4); if (E.done || m.act !== 'errata') { o.t2 = (o.t2 || 0) + dt; if (o.t2 > 0.6) dissolve(FX, o, M); } return; }
    const Fk = E.fake; Fk.age += dt; if (Fk.age > Fk.t - 0.17 && !Fk.snapped && (Fk.ld || 0) < Fk.lunge) { const st = Math.min(Fk.lunge - (Fk.ld || 0), Fk.lunge * dt / 0.17); Fk.ld = (Fk.ld || 0) + st; o.x += Math.cos(Fk.a) * st; o.y += Math.sin(Fk.a) * st; o.rear = 0.1; }
    if (Fk.age >= Fk.t && !Fk.snapped) fakeSnap(FX, M); }
  function fakeSnap(FX, M) { const E = M.er; if (!E || !E.fake || E.fake.snapped) return; const F2 = E.fake, o = E.copy, me = FX.me; F2.snapped = true; M.stat.fakeSnaps++;
    const inF = FX.inShape({ shape: 'cone', x: F2.x, y: F2.y, a: F2.a, len: F2.len, spread: F2.spread }, me.x, me.y, me.r); if (inF) { M.stat.fakeIn++; FX.H.text(me.x, me.y - 1.6, 'Only a misprint!', GHOST, 13); }
    if (o && !o.dead) { FX.H.sfx.pop && FX.H.sfx.pop(); dissolve(FX, o, M); } E.fake = null; }
  function dissolve(FX, o, M) { o.dead = true; for (let i = 0; i < 12; i++) FX.H.part({ kind: 'smoke', x: o.x + FX.rnd(-0.7, 0.7), y: o.y - FX.rnd(0, 1), vx: FX.rnd(-1, 1), vy: FX.rnd(-2, -0.5), drag: 0.6, life: 0.8, max: 0.8, size: 1.2, color: '#4A3A7A' }); FX.H.sparks(o.x, o.y - 0.6, VIOLET_HI, 8, 3); if (M.er && M.er.copy === o) M.er.copy = null; }
  function popCopy(FX, o) { const M = FX.mem; M.stat.copyPopped++; FX.H.boom(o.x, o.y - 0.6, 1.6, VIOLET_HI, '#FFFFFF', { n: 18, shake: 5, smoke: 4 }); FX.H.sfx.crack(); FX.H.text(o.x, o.y - 2.2, 'Erratum struck out!', VIOLET_HI, 14); FX.H.drop(Math.random() < 0.5 ? 'mp' : 'hp', o.x, o.y);
    if (M.er && M.er.copy === o) { M.er.copy = null; M.er.fake = null; } }

  /* ---- Ribbon Lash: the bookmark ribbon coils back to one side, then whips across the shown arc ---- */
  function startLash(FX, m) { const M = FX.mem, F = fk(FX), q = trailAt(M, RIB_S), me = FX.me, a = Math.atan2(me.y - q[1], me.x - q[0]), wait = (FX.S.lv >= 3 ? 0.74 : 0.86) / F, dir = Math.random() < 0.5 ? 1 : -1;
    m.act = 'lash'; m.actT = 0; M.ls = { age: 0, wait, a, dir, struck: false, st: 0, x: q[0], y: q[1] }; M.stat.lashes++; M.lashWait = 0; FX.H.sfx.whoosh();
    FX.tele({ shape: 'cone', x: q[0], y: q[1], a, len: 5.6, spread: 1.05, t: wait, dmg: m.dmg * 1.3, col: LASHC, fn: s => { if (M.ls) M.ls.struck = true; FX.H.sfx.whoosh(); FX.H.shake(7, 0.25); for (let i = -3; i <= 3; i++) FX.H.part({ kind: 'slash', x: s.x + Math.cos(s.a + i * 0.3) * 3.6, y: s.y + Math.sin(s.a + i * 0.3) * 3.6, a: s.a + i * 0.3 + Math.PI / 2, r: 1.8, life: 0.28, max: 0.28, color: RIB_HI }); } });
    say(FX, 'lash', 'RIBBON LASH', 'Its bookmark ribbon coils back and whips across the shown arc: step out of it', LASHC); }
  function lashStep(FX, m, M, dt) { const L = M.ls; if (!L) { endAct(m, M); return; } L.age += dt; M.vTo = 0; M.lashKTo = 1; M.jawTo = 0.5;
    if (!L.struck) { M.ribATo = L.a - 1.45 * L.dir; M.ribBendTo = 0.55 * L.dir; M.ribZTo = 1.2; } else { L.st += dt; M.ribATo = L.a + 1.5 * L.dir; M.ribBendTo = -0.5 * L.dir; M.ribZTo = 0.15; }
    if (L.age > L.wait + 0.6) { M.ls = null; endAct(m, M); } }

  /* ---- The Unbinding (half health): it lies open and its pages swarm; it re-binds after, MISBOUND by those lost ---- */
  function startUnbind(FX, m) { const M = FX.mem; m.act = 'unbind'; m.actT = 0; FX.untarget(true); M.openTo = 1; M.ub = { t: 0, T: 13, left: 22, list: [], torn: 0, acc: 0, n: 0 }; M.stat.unbind++; M.recoil = 1; FX.H.sfx.crash(); FX.H.shake(12, 0.6); FX.H.flash(0.25, GOLD_HI); }
  function ubTick(FX, m, M, dt) { const U = M.ub; if (!U) { endAct(m, M); return; } m.under = true; m.noTouch = true; U.t += dt; M.jawTo = 1.05;
    U.list = U.list.filter(q => { if (q.dead) { if (!q.rebound) U.torn++; return false; } return true; });
    U.acc = Math.min(3, U.acc + dt * (U.n < 8 ? 4 : 2.4));
    while (U.acc >= 1 && U.left > 0 && U.list.length < 9) { U.acc -= 1; U.left--; U.n++; const q = U.n % 5 === 0 ? callWorm(FX, m, M, true) : pourPage(FX, m, M, true); if (q) U.list.push(q); }
    if (U.t >= U.T || (U.left === 0 && !U.list.length)) rebind(FX, m, M); }
  function rebind(FX, m, M) { const U = M.ub; M.ub = null; let back = 0; const bar = FX.S.barHP;
    U.list.forEach(q => { if (!q.dead) { q.dead = true; q.rebound = true; back++; FX.H.sparks(q.x, q.y - 0.4, PARCH_HI, 6, 4); } });
    if (back) { m.hp = Math.min(m.maxhp, m.hp + bar * 0.02 * back); FX.H.text(m.x, m.y - 3.2, `${back} page${back === 1 ? '' : 's'} bound back in`, PARCH_HI, 13); }
    FX.untarget(false); M.openTo = 0; endAct(m, M); M.stat.torn += U.torn; M.stat.rebound += back; M.stat.misbound++;
    const torn = U.torn; m.stunT = 3.2 + Math.min(2.8, torn * 0.14); M.stunKind = 'misbound'; M.stunWas = 'misbound'; M.recoil = 1; M.jolt = 1;
    if (torn) FX.H.hitMon(m, bar * 0.012 * torn, { flat: true, pierce: true });
    FX.H.banner('MISBOUND!', torn ? `${torn} page${torn === 1 ? '' : 's'} torn away: it re-binds crooked and reels. Strike its gold eye!` : 'It re-binds and reels: strike its gold eye!', GOLD_HI, 2.6, true); FX.H.shake(10, 0.4); FX.H.flash(0.2, GOLD_HI); FX.H.sfx.crash(); }
  // a page torn out of one of its volumes and flung over the floor (it lands and flutters at the pet)
  function landSpot(FX, x0, y0) { const me = FX.me; let p = null; for (let k = 0; k < 12; k++) { const a = Math.random() * TAU, d = FX.rnd(2.5, 7), q = { x: x0 + Math.cos(a) * d, y: y0 + Math.sin(a) * d }; if (FX.inArena(q.x, q.y, 1.6) && Math.hypot(q.x - me.x, q.y - me.y) > 2.6) { p = q; break; } } return p || FX.clampArena({ x: x0 + FX.rnd(-3, 3), y: y0 + FX.rnd(-3, 3) }, 1.6); }
  function pourPage(FX, m, M, horde) { const P = pose(m, M), s = P.segs[Math.floor(Math.random() * 5)], p = landSpot(FX, s.x, s.y), q = FX.minion('loosepage', p.x, p.y); if (!q) return null;
    q.launch = { t: 0, dur: 0.6 + Math.random() * 0.3, x0: s.x, y0: s.y, z0: 1.0, x1: q.x, y1: q.y, h: 1.4 + Math.random() * 1.4 }; q.x = s.x; q.y = s.y; q.z = 1; q.under = true; q.cd = 1.2 + Math.random();
    if (horde) { q.horde = true; q.hp = q.maxhp = Math.max(40, Math.round(q.maxhp * 0.45)); q.xp = Math.max(1, Math.round((q.xp || 4) * 0.4)); }
    M.stat.poured++; FX.H.sparks(s.x, s.y - 0.8, PARCH_HI, 4, 3); return q; }
  function callWorm(FX, m, M, horde) { const P = pose(m, M), s = P.segs[Math.floor(Math.random() * 5)], p = landSpot(FX, s.x, s.y), q = FX.minion('marginworm', p.x, p.y); if (!q) return null;
    FX.H.ring(q.x, q.y, 0.2, 1.3, 0.4, PARCH_HI, 0.35); FX.H.sparks(q.x, q.y, PARCH_HI, 8, 4); q.cd = 1.5; if (horde) { q.horde = true; q.hp = q.maxhp = Math.max(60, Math.round(q.maxhp * 0.55)); } M.stat.poured++; return q; }

  /* ---------- the body: the path it has crawled, the volumes along it ---------- */
  function initTrail(m, M) { M.trail = []; for (let s = 0; s <= TRAIL_MAX + 0.5; s += 0.12) M.trail.push([m.x + Math.sin(s * 0.42) * 1.5, m.y - s * 0.97]); trailAcc(M); }
  function trailAcc(M) { const P = M.trail, A = [0]; for (let i = 1; i < P.length; i++) A.push(A[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); M.tacc = A; }
  function updTrail(m, M) { const P = M.trail; P[0] = [m.x, m.y]; if (P.length < 2 || Math.hypot(m.x - P[1][0], m.y - P[1][1]) > 0.12) P.splice(1, 0, [m.x, m.y]);
    trailAcc(M); while (P.length > 3 && M.tacc[M.tacc.length - 2] > TRAIL_MAX + 0.5) { P.pop(); M.tacc.pop(); } }
  function posAt(M, s) { const P = M.trail, A = M.tacc, n = A.length - 1; if (s <= 0) return P[0];
    if (s >= A[n]) { const a = P[n], b = P[Math.max(0, n - 1)], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, ex = s - A[n]; return [a[0] + (a[0] - b[0]) / d * ex, a[1] + (a[1] - b[1]) / d * ex]; }
    let lo = 1, hi = n; while (lo < hi) { const mid = (lo + hi) >> 1; if (A[mid] < s) lo = mid + 1; else hi = mid; }
    const u = (s - A[lo - 1]) / Math.max(1e-6, A[lo] - A[lo - 1]), p = P[lo - 1], q = P[lo]; return [lerp(p[0], q[0], u), lerp(p[1], q[1], u)]; }
  // a point on the path s metres back from the head, and the heading there (toward the head)
  function trailAt(M, s) { if (!M.trail) return [0, 0, M.hd || 0]; const p = posAt(M, s), a = posAt(M, Math.max(0, s - 0.4)), b = posAt(M, s + 0.4); return [p[0], p[1], Math.atan2(a[1] - b[1], a[0] - b[0])]; }
  // the entrance: the volumes rain down out of the dark one after another, tail first, and the head lands last
  function enterAnim(FX, m, M) { const e = FX.S.enterT || 0; if (!M.dropZ) { M.dropZ = [8, 8, 8, 8, 8, 8]; M.landed = [0, 0, 0, 0, 0, 0]; }
    for (let k = 0; k < 6; k++) { const t0 = (5 - k) * 0.17, u = clamp((e - t0) / 0.5, 0, 1); M.dropZ[k] = 8 * (1 - u * u);
      if (u >= 1 && !M.landed[k]) { M.landed[k] = 1; const p = k ? trailAt(M, S_OFF[k - 1]) : [m.x, m.y]; FX.H.shake(k ? 4 : 12, 0.2); FX.H.sfx.thud(); FX.H.boom(p[0], p[1], k ? 1.1 : 2.2, GOLD_HI, '#FFFFFF', { n: 10, shake: 0, smoke: 5 });
        if (!k) { M.jaw = 1.2; M.recoil = 0.8; FX.H.sfx.crash(); FX.H.ring(m.x, m.y, 0.3, 6, 0.9, GOLD_HI, 0.4); } } } }
  /* where everything is: the head (its own frame state), the five volumes along the path, the ribbon's points */
  function pose(m, M) {
    if (!M.trail) initTrail(m, M);
    const rc = M.recoil || 0, bt = M.bt || 0, hd = M.hd == null ? Math.PI / 2 : M.hd, rear = M.rear || 0, stk = M.stuckK || 0, open = M.openK || 0, dz = M.dropZ, jo = M.jolt || 0;
    const head = { x: m.x - Math.cos(hd) * rc * 0.45, y: m.y - Math.sin(hd) * rc * 0.45, hd, z: 0.03 + rear * 0.8 - stk * 0.2 + (dz ? dz[0] : 0), pitch: rear * 0.3 - stk * 0.42 + rc * 0.18 - open * 0.06, roll: Math.sin(bt * 1.3) * 0.03 + jo * Math.sin(bt * 30) * 0.05, jaw: M.jaw == null ? 0.2 : M.jaw, eyeK: M.eyeK || 0, look: M.look || [0, 0.4], blink: open > 0.5 ? 0.8 : (bt % 3.7 < 0.12 ? 1 : 0) };
    const segs = SEGS.map((S, i) => { const q = trailAt(M, S_OFF[i]), hump = (M.spdK || 0) * 0.2 * Math.max(0, Math.sin((M.wave || 0) - i * 1.15)), lift = (i === 0 ? rear * 0.3 : i === 1 ? rear * 0.08 : 0) + jo * 0.14 * Math.max(0, Math.sin(bt * 26 + i * 1.7)) + (dz ? dz[i + 1] : 0);
      return { x: q[0], y: q[1], th: q[2], z: 0.02 + hump + lift, open: open * clamp(1.75 + Math.sin(bt * 2 + i) * 0.1, 0, 1.9), i }; });
    segs.forEach((s, i) => { const prev = i ? segs[i - 1] : { z: head.z * 0.5, th: hd }, next = segs[i + 1] || { z: 0.02 }; s.pitch = clamp((prev.z - next.z) * 0.32, -0.3, 0.3); s.roll = clamp(angTo(s.th, prev.th) * 1.1, -0.3, 0.3); });
    // the ribbon: along the path behind the tail, swaying; or (in a lash) swung out round its root
    const base = trailAt(M, RIB_S), lk = M.lashK || 0, phi = M.ribA == null ? base[2] + Math.PI : M.ribA, rib = [];
    for (let k = 0; k <= 10; k++) { const u = k / 10, s = u * RIB_LEN, q = trailAt(M, RIB_S + s), sway = Math.sin(bt * 2.6 - u * 4.5) * 0.3 * u, tx = q[0] - Math.sin(q[2]) * sway, ty = q[1] + Math.cos(q[2]) * sway;
      const a = phi + (M.ribBend || 0) * u, lx = base[0] + Math.cos(a) * s, ly = base[1] + Math.sin(a) * s;
      rib.push([lerp(tx, lx, lk), lerp(ty, ly, lk), 0.07 + Math.sin(bt * 3.1 - u * 5) * 0.035 * u + (M.ribZ || 0) * Math.sin(u * Math.PI * 0.85) + (dz ? dz[5] : 0)]); }
    return { head, segs, rib, base };
  }
  function headFrame(Hd) { return RiftFiend.frame(Hd, Hd.hd, { z: Hd.z, pitch: Hd.pitch, roll: Hd.roll }); }
  // the gold eye: it floats between the covers, in the frame half way open
  function eyeLocal(Hd) { const j = Hd.jaw * 0.5, du = 1.18, dh = 0.1 + Hd.eyeK * 0.22; return [HEAD.u0 + du * Math.cos(j) - dh * Math.sin(j), 0, HEAD.hz + du * Math.sin(j) + dh * Math.cos(j)]; }
  function eyeAt(P) { const W = headFrame(P.head), e = eyeLocal(P.head); return W(e[0], e[1], e[2]); }
  // the hit proxies: the head and the five volumes
  function bodyParts(m, M) { const P = pose(m, M), out = [hit('hd', [P.head.x, P.head.y, P.head.z + 0.45], 1.1, m)]; P.segs.forEach((s, i) => out.push(hit('s' + i, [s.x, s.y, s.z + SEGS[i].H * 0.5], SEGS[i].W + 0.15, m))); return out; }

  /* ---------- painting Syllax ---------- */
  /* a box in a local frame f(u, v, h) -> world, B = [u0, u1, v0, v1, h0, h1]: the faces turned to the camera, each a flat
     cel tone by how it meets the light (lit, mid, shade), its painted detail, and one ink outline over all of them */
  function box(c, P3, f, B, sk, lw, T) {
    const Wp = [], Sp = []; let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < 8; i++) { const p = f(i & 1 ? B[1] : B[0], i & 2 ? B[3] : B[2], i & 4 ? B[5] : B[4]); Wp.push(p); Sp.push(P3(p[0], p[1], p[2])); cx += p[0]; cy += p[1]; cz += p[2]; }
    cx /= 8; cy /= 8; cz /= 8; const vis = [];
    for (const [key, ix] of FACES) { const s = sk[key] || sk.side; if (!s) continue; const a = Wp[ix[0]], b = Wp[ix[1]], d = Wp[ix[3]], o = Wp[ix[2]];
      const e1x = b[0] - a[0], e1y = b[1] - a[1], e1z = b[2] - a[2], e2x = d[0] - a[0], e2y = d[1] - a[1], e2z = d[2] - a[2]; let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      if (nx * ((a[0] + o[0]) / 2 - cx) + ny * ((a[1] + o[1]) / 2 - cy) + nz * ((a[2] + o[2]) / 2 - cz) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const ln = Math.hypot(nx, ny, nz) || 1; if ((ny + nz) / ln < 0.03) continue;
      const tone = (nx * LV[0] + ny * LV[1] + nz * LV[2]) / ln, pts = ix.map(i => Sp[i]);
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.lineTo(pts[3][0], pts[3][1]); c.closePath();
      c.fillStyle = tone > 0.45 ? s.col : tone > 0.02 ? s.mid : s.sh; c.fill();
      if (s.deco) deco(c, s.deco, pts, key, T, lw, tone); vis.push(pts); }
    c.beginPath(); vis.forEach(p => { c.moveTo(p[0][0], p[0][1]); c.lineTo(p[1][0], p[1][1]); c.lineTo(p[2][0], p[2][1]); c.lineTo(p[3][0], p[3][1]); c.closePath(); }); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
    return Sp;
  }
  // a point on a face by its two fractions (a along its first edge, b along its last)
  function bil(p, a, b) { return [p[0][0] * (1 - a) * (1 - b) + p[1][0] * a * (1 - b) + p[2][0] * a * b + p[3][0] * (1 - a) * b, p[0][1] * (1 - a) * (1 - b) + p[1][1] * a * (1 - b) + p[2][1] * a * b + p[3][1] * (1 - a) * b]; }
  function deco(c, kind, p, key, T, lw, tone) {
    const side = key !== 'top' && key !== 'bot';
    if (kind === 'pages') { if (!side) return; const h = Math.hypot(p[3][0] - p[0][0], p[3][1] - p[0][1]), n = clamp(Math.round(h / Math.max(2.2, T * 0.075)), 2, 10);
      c.beginPath(); for (let i = 1; i < n; i++) { const u = i / n, a = [lerp(p[0][0], p[3][0], u), lerp(p[0][1], p[3][1], u)], b = [lerp(p[1][0], p[2][0], u), lerp(p[1][1], p[2][1], u)]; c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
      c.strokeStyle = 'rgba(110,80,46,.5)'; c.lineWidth = Math.max(0.7, T * 0.016); c.stroke();
      // the gilt along the page edges' top
      c.beginPath(); c.moveTo(lerp(p[3][0], p[0][0], 0.1), lerp(p[3][1], p[0][1], 0.1)); c.lineTo(lerp(p[2][0], p[1][0], 0.1), lerp(p[2][1], p[1][1], 0.1)); c.strokeStyle = rgba(GOLD, 0.55); c.lineWidth = Math.max(1, T * 0.03); c.stroke(); return; }
    if (kind === 'tool' || kind === 'face') { if (key !== 'top') return; const ln = (pts, w, col) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.lineWidth = w; c.strokeStyle = col; c.stroke(); };
      const gw = Math.max(1, T * 0.035); ln([bil(p, 0.1, 0.1), bil(p, 0.9, 0.1), bil(p, 0.9, 0.9), bil(p, 0.1, 0.9)], gw, GOLD); ln([bil(p, 0.16, 0.16), bil(p, 0.84, 0.16), bil(p, 0.84, 0.84), bil(p, 0.16, 0.84)], Math.max(0.7, gw * 0.5), rgba(GOLD_HI, 0.6));
      if (kind === 'tool') { ln([bil(p, 0.5, 0.26), bil(p, 0.74, 0.5), bil(p, 0.5, 0.74), bil(p, 0.26, 0.5)], gw, GOLD_HI); const q = bil(p, 0.5, 0.5); c.fillStyle = GOLD; c.beginPath(); c.arc(q[0], q[1], Math.max(1.2, T * 0.06), 0, TAU); c.fill();
        c.fillStyle = GOLD_HI; [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]].forEach(([a, b]) => { const r = bil(p, a, b); c.beginPath(); c.arc(r[0], r[1], Math.max(1, T * 0.04), 0, TAU); c.fill(); }); return; }
      // the head's lid: an eye sigil, and gold corner guards at its front (they read as its horns)
      const a0 = bil(p, 0.28, 0.5), a1 = bil(p, 0.82, 0.5), up = bil(p, 0.55, 0.22), dn = bil(p, 0.55, 0.78); c.beginPath(); c.moveTo(a0[0], a0[1]); c.quadraticCurveTo(up[0], up[1], a1[0], a1[1]); c.quadraticCurveTo(dn[0], dn[1], a0[0], a0[1]); c.closePath(); c.lineWidth = gw; c.strokeStyle = GOLD_HI; c.stroke();
      const pc = bil(p, 0.56, 0.5); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(pc[0], pc[1], Math.max(1.4, T * 0.08), 0, TAU); c.fill();
      c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = lw * 0.7; [[1, 0], [1, 1]].forEach(([a, b]) => { const k0 = bil(p, a, b), k1 = bil(p, a - 0.22, b), k2 = bil(p, a, b ? 0.78 : 0.22); c.beginPath(); c.moveTo(k0[0], k0[1]); c.lineTo(k1[0], k1[1]); c.lineTo(k2[0], k2[1]); c.closePath(); c.fill(); c.stroke(); }); return; }
    if (kind === 'text') { if (key !== 'top' && key !== 'bot') return; c.beginPath(); for (let r = 0; r < 6; r++) { const b = 0.18 + r * 0.13; for (let w = 0; w < 3; w++) { const a0 = 0.12 + w * 0.27 + hsh(r * 7 + w) * 0.05, a1 = a0 + 0.12 + hsh(r * 3 + w * 5) * 0.1, q0 = bil(p, a0, b), q1 = bil(p, Math.min(0.9, a1), b); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); } }
      c.strokeStyle = 'rgba(29,26,40,.4)'; c.lineWidth = Math.max(0.8, T * 0.025); c.stroke(); return; }
    if (kind === 'endp') { if (side) return; c.beginPath(); const q = [bil(p, 0.12, 0.12), bil(p, 0.88, 0.12), bil(p, 0.88, 0.88), bil(p, 0.12, 0.88)]; q.forEach((r, i) => i ? c.lineTo(r[0], r[1]) : c.moveTo(r[0], r[1])); c.closePath(); c.strokeStyle = rgba(GOLD, 0.6); c.lineWidth = Math.max(1, T * 0.03); c.stroke();
      c.strokeStyle = 'rgba(205,180,255,.25)'; c.beginPath(); for (let i = 0; i < 4; i++) { const r0 = bil(p, 0.2 + i * 0.18, 0.3), r1 = bil(p, 0.3 + i * 0.18, 0.7); c.moveTo(r0[0], r0[1]); c.quadraticCurveTo(r1[0] + T * 0.1, r0[1], r1[0], r1[1]); } c.stroke(); return; }
    if (kind === 'spine') { if (!side) return; c.beginPath(); for (const u of [0.28, 0.72]) { const a = [lerp(p[0][0], p[3][0], u), lerp(p[0][1], p[3][1], u)], b = [lerp(p[1][0], p[2][0], u), lerp(p[1][1], p[2][1], u)]; c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.strokeStyle = GOLD; c.lineWidth = Math.max(1, T * 0.04); c.stroke(); }
  }
  /* a book in a local frame W: the lower board, the pages below the hinge, and above it (lifted by `open` about the
     hinge line at its back, u0) the upper pages and the lid; o.inner(Wu) is painted between the halves */
  function drawBook(c, P3, W, o, T, lw) {
    const { u0, u1, w, H, hz, ct } = o, j = o.open || 0, cj = Math.cos(j), sj = Math.sin(j), g = 0.05;
    const Wu = j ? (u, v, h) => { const du = u - u0, dh = h - hz; return W(u0 + du * cj - dh * sj, v, hz + du * sj + dh * cj); } : W;
    box(c, P3, W, [u0 - g, u1 + g, -w - g, w + g, 0, ct], o.board, lw, T);
    if (hz > ct + 0.01) box(c, P3, W, [u0 + 0.02, u1 - 0.03, -w + 0.04, w - 0.04, ct, hz], o.lowPg, lw * 0.75, T);
    const upper = () => { if (H - ct > hz + 0.01) box(c, P3, Wu, [u0 + 0.02, u1 - 0.03, -w + 0.04, w - 0.04, hz, H - ct], o.upPg, lw * 0.75, T); box(c, P3, Wu, [u0 - g, u1 + g, -w - g, w + g, H - ct, H], o.lid, lw, T); };
    if (o.faceCam) { upper(); if (o.inner) o.inner(Wu); } else { if (o.inner) o.inner(Wu); upper(); }
  }
  function headSkins(copy) { const S = copy ? COPYSK : null;
    return { board: { top: S ? S.plain : HEADSK.plain, side: S ? S.plain : HEADSK.plain }, lowPg: { top: S ? S.text : SK.text, side: S ? S.page : SK.page, back: SK.spine }, upPg: { bot: S ? S.text : SK.text, side: S ? S.page : SK.page, back: SK.spine }, lid: { top: S ? S.tool : HEADSK.tool, bot: S ? S.endp : HEADSK.endp, side: S ? S.plain : HEADSK.plain } }; }
  // the head: an open book, page-teeth along its covers' front edges, the gold eye floating between them
  function drawHead(c, P3, Hd, T, t, lw, copy) {
    const W = headFrame(Hd), faceCam = Math.sin(Hd.hd) > 0.15, S = copy ? COPY_SKINS : HEAD_SKINS;
    drawBook(c, P3, W, { u0: HEAD.u0, u1: HEAD.u1, w: HEAD.w, H: HEAD.H, hz: HEAD.hz, ct: 0.1, open: Hd.jaw, board: S.board, lowPg: S.lowPg, upPg: S.upPg, lid: S.lid, faceCam, inner: Wu => headInner(c, P3, W, Wu, Hd, T, t, lw, copy) }, T, lw); }
  function headInner(c, P3, W, Wu, Hd, T, t, lw, copy) {
    const j = Hd.jaw, tk = clamp((j - 0.1) / 0.55, 0, 1);
    if (tk > 0) { // the light inside its open pages
      const mq = P3(...W(0.2, 0, HEAD.hz + Math.sin(j) * 0.5)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.35 * tk; blitSized(c, glowSprite(copy ? VIOLET : GOLD), mq[0] - T * 1.1, mq[1] - T * 0.8, T * 2.2, T * 1.6); c.restore();
      // the page-teeth: a row along each cover's front edge
      const row = (f, dir) => { c.beginPath(); for (let i = 0; i < 6; i++) { const v = -0.8 + (i + 0.5) / 6 * 1.6, a = P3(...f(HEAD.u1 - 0.04, v - 0.12, HEAD.hz)), b = P3(...f(HEAD.u1 - 0.04, v + 0.12, HEAD.hz)), q = P3(...f(HEAD.u1 - 0.16, v, HEAD.hz + dir * (0.08 + 0.17 * tk))); c.moveTo(a[0], a[1]); c.lineTo(q[0], q[1]); c.lineTo(b[0], b[1]); c.closePath(); }
        c.fillStyle = copy ? '#E8E0FF' : PARCH_HI; c.fill(); c.lineWidth = lw * 0.65; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); };
      row(W, 1); row(Wu, -1); }
    // the eye
    const e = eyeLocal(Hd), q = P3(...W(e[0], e[1], e[2])), r = T * (0.17 + 0.07 * Math.min(1, j / 0.5) + Hd.eyeK * 0.13), lk = Hd.look || [0, 0];
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 + 0.25 * Math.sin(t * 3) + Hd.eyeK * 0.3; blitSized(c, glowSprite(copy ? VIOLET_HI : GOLD_HI), q[0] - r * 3, q[1] - r * 3, r * 6, r * 6); c.restore();
    TN.eye(c, q[0], q[1], r, { iris: copy ? VIOLET : GOLD, white: copy ? '#E8E0FF' : GOLD_HI, pupil: INK, slit: true, look: lk, blink: Hd.blink || 0, lid: copy ? '#5A4A9A' : '#76365A', line: INK, irisR: 0.8, squash: 0.92 }); }
  // a volume of the body: boards, page block and lid, the lid hinged at its back (it flies open in the unbinding)
  function drawSeg(c, P3, sg, T, lw) { const S = SEGS[sg.i], W = RiftFiend.frame(sg, sg.th, { z: sg.z, pitch: sg.pitch, roll: sg.roll }), cs = COVSK[sg.i % COVSK.length];
    drawBook(c, P3, W, { u0: -S.L / 2, u1: S.L / 2, w: S.W, H: S.H, hz: S.H - 0.2, ct: 0.09, open: sg.open, board: { side: cs.plain, top: cs.plain }, lowPg: { top: SK.text, side: SK.page, back: SK.spine }, upPg: { bot: SK.text, side: SK.page, back: SK.spine }, lid: { top: cs.tool, bot: SK.endp, side: cs.hi }, faceCam: Math.sin(sg.th) > 0.15 }, T, lw); }
  // the ribbon bookmark: crimson silk with gold edges, cut in a swallowtail
  function drawRibbon(c, P3, rib, T, lw) { const pts = rib.map(p => P3(p[0], p[1], p[2])), wf = u => T * (0.34 - u * 0.04);
    tubeLite(c, pts, wf, { col: RIB, shade: RIB_SH, hi: RIB_HI, line: INK, lw: lw * 0.8, force: true });
    const { L, R } = TN.ribbonPts(pts, wf); c.strokeStyle = rgba(GOLD_HI, 0.85); c.lineWidth = Math.max(1, T * 0.035); c.lineCap = 'round'; for (const E of [L, R]) { c.beginPath(); E.forEach((q, i) => { const p = pts[i], x = lerp(q[0], p[0], 0.28), y = lerp(q[1], p[1], 0.28); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); }
    const n = pts.length - 1, a = pts[n], b = pts[n - 1], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, ux = (a[0] - b[0]) / d, uy = (a[1] - b[1]) / d, l = L[n], r = R[n], k = T * 0.4;
    c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[0] + ux * k, l[1] + uy * k); c.lineTo(a[0] + ux * k * 0.15, a[1] + uy * k * 0.15); c.lineTo(r[0] + ux * k, r[1] + uy * k); c.lineTo(r[0], r[1]); c.closePath(); c.fillStyle = RIB; c.fill(); c.lineWidth = lw * 0.8; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); }
  function drawSyllax(c, FX, m, X, Y, T, t) {
    const M = FX.mem; if (!M.trail) initTrail(m, M); const P = pose(m, M), P3 = TN.cam(X, Y, T, m), lw = Math.max(1.3, T * 0.06), H = P.head;
    // shadows on the floor
    P.segs.forEach((s, i) => { const g = P3(s.x, s.y, 0); TN.groundShadow(c, g[0], g[1] + T * 0.12, T * (SEGS[i].W + 0.45), T * (SEGS[i].W * 0.6 + 0.12), s.z * 2, 0.36); });
    { const g = P3(H.x + Math.cos(H.hd) * 0.1, H.y + Math.sin(H.hd) * 0.1, 0); TN.groundShadow(c, g[0], g[1] + T * 0.12, T * 1.45, T * 0.8, H.z * 2, 0.4); }
    // the leather cord that binds the volumes, rising to the head as a neck
    const Wh = headFrame(H), cord = [Wh(HEAD.u0 + 0.1, 0, 0.32)].concat(P.segs.map(s => [s.x, s.y, s.z + 0.34]), [[P.base[0], P.base[1], 0.24]]);
    tubeLite(c, cord.map(p => P3(p[0], p[1], p[2])), u => T * (0.66 - u * 0.32), { col: SPINE, shade: '#2A0E1C', hi: '#7A3A56', line: INK, lw, force: true });
    const parts = P.segs.map(s => ({ at: [s.x, s.y, 0.4 + s.z], draw: () => drawSeg(c, P3, s, T, lw) }));
    parts.push({ at: [H.x, H.y, 0.5 + H.z], draw: () => drawHead(c, P3, H, T, t, lw, false) });
    const rm = P.rib[5]; parts.push({ at: [rm[0], rm[1], rm[2] * 0.5], draw: () => drawRibbon(c, P3, P.rib, T, lw) });
    sorted(parts).forEach(p => p.draw());
    // staggered: twinkles over the head
    if ((M.eyeK || 0) > 0.5 && m.stunT > 0) { const e = eyeAt(P), q = P3(e[0], e[1], e[2] + 0.9); for (let i = 0; i < 3; i++) { const a = (M.bt || t) * 3 + i * TAU / 3; TN.twinkle(c, q[0] + Math.cos(a) * T * 0.9, q[1] + Math.sin(a) * T * 0.25, T * 0.18, '#FFFFFF', 0.9); } } }
  // the copy of its head: the same book washed violet and pale, see-through, outlined in a dashed violet line
  function drawCopy(c, FX, o, X, Y, T, t) { const k = easeOut(o.rise || 0); if (k <= 0.01) return; const P3 = TN.cam(X, Y, T, o), lw = Math.max(1.3, T * 0.06);
    const Hd = { x: o.x, y: o.y, hd: o.hd || 0, z: -0.9 * (1 - k) + (o.rear || 0) * 0.7, pitch: (o.rear || 0) * 0.3, roll: Math.sin(t * 2) * 0.04, jaw: o.jaw || 0, eyeK: 0, look: [0, 0], blink: 0 };
    c.save(); c.globalAlpha *= 0.62 * k; drawHead(c, P3, Hd, T, t, lw, true); c.restore();
    // the dashed hollow outline round it
    const W = headFrame(Hd), cj = Math.cos(Hd.jaw), sj = Math.sin(Hd.jaw), pts = [];
    for (const u of [HEAD.u0 - 0.05, HEAD.u1 + 0.05]) for (const v of [-HEAD.w - 0.05, HEAD.w + 0.05]) { pts.push(P3(...W(u, v, 0))); const du = u - HEAD.u0, dh = HEAD.H - HEAD.hz; pts.push(P3(...W(HEAD.u0 + du * cj - dh * sj, v, HEAD.hz + du * sj + dh * cj))); }
    const hl = hull(pts), cx = hl.reduce((a, p) => a + p[0], 0) / hl.length, cy = hl.reduce((a, p) => a + p[1], 0) / hl.length, grow = T * 0.22;
    c.save(); c.globalAlpha *= k; c.beginPath(); hl.forEach((p, i) => { const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1, x = p[0] + dx / d * grow, y = p[1] + dy / d * grow; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath();
    c.setLineDash([T * 0.32, T * 0.2]); c.lineDashOffset = -t * T * 1.4; c.lineJoin = 'round'; c.lineWidth = Math.max(3, T * 0.13); c.strokeStyle = 'rgba(20,10,40,.55)'; c.stroke(); c.lineWidth = Math.max(2, T * 0.07); c.strokeStyle = VIOLET_HI; c.stroke(); c.restore(); }
  function hull(P) { const pts = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1)); }

  /* ---------- the Reading Circle: the floor, the void, the sky ---------- */
  function paintFloor(c, A) { const R = A.R, rnd = A.rnd, E = RF;
    // the ink void round the island, gold motes adrift in it
    c.fillStyle = '#0D0A16'; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    let g = c.createRadialGradient(0, 0, E - 0.4, 0, 0, R + 1.5); g.addColorStop(0, 'rgba(138,91,208,.32)'); g.addColorStop(1, 'rgba(60,30,100,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    for (let i = 0; i < 70; i++) { const a = rnd() * TAU, r = E + rnd() * 1.4; c.fillStyle = `rgba(242,220,154,${0.2 + rnd() * 0.5})`; c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r, 0.03 + rnd() * 0.04, 0, TAU); c.fill(); }
    // the island's near edge: a giant book's page block, then its board
    const TH = 0.85; c.beginPath(); for (let i = 0; i <= 40; i++) { const a = 0.02 + i / 40 * (Math.PI - 0.04); c.lineTo(Math.cos(a) * E, Math.sin(a) * E + TH); } for (let i = 40; i >= 0; i--) { const a = 0.02 + i / 40 * (Math.PI - 0.04); c.lineTo(Math.cos(a) * E, Math.sin(a) * E); } c.closePath(); c.fillStyle = PARCH_D; c.fill();
    c.strokeStyle = 'rgba(110,80,46,.45)'; c.lineWidth = 0.025; for (let k = 1; k < 7; k++) { c.beginPath(); for (let i = 0; i <= 40; i++) { const a = 0.05 + i / 40 * (Math.PI - 0.1); c.lineTo(Math.cos(a) * E, Math.sin(a) * E + k * 0.085); } c.stroke(); }
    c.beginPath(); for (let i = 0; i <= 40; i++) { const a = 0.02 + i / 40 * (Math.PI - 0.04); c.lineTo(Math.cos(a) * E, Math.sin(a) * E + TH - 0.2); } for (let i = 40; i >= 0; i--) { const a = 0.02 + i / 40 * (Math.PI - 0.04); c.lineTo(Math.cos(a) * E, Math.sin(a) * E + TH); } c.closePath(); c.fillStyle = '#4A1C34'; c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 0.05; c.beginPath(); for (let i = 0; i <= 40; i++) { const a = 0.02 + i / 40 * (Math.PI - 0.04); c.lineTo(Math.cos(a) * E, Math.sin(a) * E + TH - 0.22); } c.stroke();
    // the floor: warm parchment marble, lighter under the lamps at its heart
    g = c.createRadialGradient(0, -1, 1, 0, 0, E); g.addColorStop(0, '#EFE0BE'); g.addColorStop(0.6, '#E2CEA4'); g.addColorStop(1, '#C9AE80'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, E, 0, TAU); c.fill();
    // the tiles in rings, each a shade apart, their seams
    const rings = [1.7, 3.5, 5.3, 7.1, 8.9, 10.7]; for (let k = 0; k < rings.length - 1; k++) { const r0 = rings[k], r1 = rings[k + 1], n = 8 * (k + 1), off = k % 2 ? Math.PI / n : 0;
      for (let i = 0; i < n; i++) { const a0 = off + i / n * TAU, a1 = off + (i + 1) / n * TAU; c.beginPath(); c.arc(0, 0, r1, a0, a1); c.arc(0, 0, r0, a1, a0, true); c.closePath(); const sh = rnd(); c.fillStyle = sh < 0.5 ? `rgba(255,248,230,${0.06 + rnd() * 0.08})` : `rgba(120,86,40,${0.04 + rnd() * 0.07})`; c.fill(); c.strokeStyle = 'rgba(120,88,48,.28)'; c.lineWidth = 0.035; c.stroke(); } }
    // the marble's veins
    c.lineCap = 'round'; for (let i = 0; i < 26; i++) { let a = rnd() * TAU, r = 1.8 + rnd() * 8.6, x = Math.cos(a) * r, y = Math.sin(a) * r; const b = rnd() * TAU; c.strokeStyle = `rgba(150,118,72,${0.1 + rnd() * 0.12})`; c.lineWidth = 0.02 + rnd() * 0.03; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += Math.cos(b + (rnd() - 0.5) * 1.6) * 0.5; y += Math.sin(b + (rnd() - 0.5) * 1.6) * 0.5; c.lineTo(x, y); } c.stroke(); }
    // the eight-point compass: the short diagonal points, then the long cardinal ones, each faceted light and dark
    const pt = (a, tip, side, w, light, dark) => { const sx = Math.cos(a), sy = Math.sin(a), px = -sy, py = sx, T0 = [sx * tip, sy * tip], A0 = [sx * side + px * w, sy * side + py * w], B0 = [sx * side - px * w, sy * side - py * w];
      c.beginPath(); c.moveTo(0, 0); c.lineTo(A0[0], A0[1]); c.lineTo(T0[0], T0[1]); c.closePath(); c.fillStyle = light; c.fill(); c.beginPath(); c.moveTo(0, 0); c.lineTo(B0[0], B0[1]); c.lineTo(T0[0], T0[1]); c.closePath(); c.fillStyle = dark; c.fill();
      c.beginPath(); c.moveTo(0, 0); c.lineTo(A0[0], A0[1]); c.lineTo(T0[0], T0[1]); c.lineTo(B0[0], B0[1]); c.closePath(); c.strokeStyle = 'rgba(29,26,40,.65)'; c.lineWidth = 0.06; c.lineJoin = 'round'; c.stroke(); c.beginPath(); c.moveTo(0, 0); c.lineTo(T0[0], T0[1]); c.strokeStyle = 'rgba(29,26,40,.35)'; c.lineWidth = 0.03; c.stroke(); };
    c.fillStyle = 'rgba(60,30,40,.12)'; c.beginPath(); c.arc(0, 0, 7.6, 0, TAU); c.fill();
    for (let i = 0; i < 4; i++) pt(Math.PI / 4 + i * Math.PI / 2, 7.2, 2.0, 0.85, BURG_HI, BURG);
    for (let i = 0; i < 4; i++) pt(-Math.PI / 2 + i * Math.PI / 2, 10.5, 2.3, 1.15, GOLD_HI, '#A8843E');
    // the gold rings round it, and a band of unwritten script between them
    c.strokeStyle = GOLD; c.lineWidth = 0.09; for (const r of [11.0, 12.3]) { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); } c.strokeStyle = rgba(GOLD_HI, 0.7); c.lineWidth = 0.04; for (const r of [11.18, 12.12]) { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }
    c.strokeStyle = 'rgba(29,26,40,.45)'; c.lineWidth = 0.035; for (let i = 0; i < 150; i++) { const a = i / 150 * TAU, r = 11.65, ca = Math.cos(a), sa = Math.sin(a), tx = -sa, ty = ca, k = Math.floor(rnd() * 4); c.beginPath();
      const at = (u, w) => [ca * (r + w) + tx * u, sa * (r + w) + ty * u]; const p0 = at(-0.12, -0.2), p1 = at(0.12, 0.2), p2 = at(0, 0.2), p3 = at(0.12, -0.2);
      if (k === 0) { c.moveTo(...p0); c.lineTo(...at(0, 0.2)); c.lineTo(...p3); } else if (k === 1) { c.moveTo(...at(-0.1, -0.2)); c.lineTo(...at(-0.1, 0.2)); c.moveTo(...at(-0.1, 0)); c.lineTo(...at(0.1, 0)); } else if (k === 2) { const q = at(0, 0); c.arc(q[0], q[1], 0.15, 0, TAU); } else { c.moveTo(...p0); c.lineTo(...p1); c.moveTo(...p2); c.lineTo(...p3); } c.stroke(); }
    // the burgundy carpet at the rim, a gold border with lozenges
    c.beginPath(); c.arc(0, 0, E - 0.3, 0, TAU); c.arc(0, 0, 12.55, 0, TAU, true); c.fillStyle = '#5A2240'; c.fill('evenodd');
    c.strokeStyle = GOLD; c.lineWidth = 0.07; for (const r of [12.7, E - 0.45]) { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }
    c.fillStyle = rgba(GOLD, 0.75); for (let i = 0; i < 72; i++) { const a = i / 72 * TAU, r = (12.7 + E - 0.45) / 2, ca = Math.cos(a), sa = Math.sin(a), tx = -sa, ty = ca; c.beginPath(); c.moveTo(ca * (r - 0.28), sa * (r - 0.28)); c.lineTo(ca * r + tx * 0.2, sa * r + ty * 0.2); c.lineTo(ca * (r + 0.28), sa * (r + 0.28)); c.lineTo(ca * r - tx * 0.2, sa * r - ty * 0.2); c.closePath(); c.fill(); }
    // the wooden lip at its edge
    c.beginPath(); c.arc(0, 0, E, 0, TAU); c.arc(0, 0, E - 0.3, 0, TAU, true); c.fillStyle = WOOD; c.fill('evenodd'); c.strokeStyle = INK; c.lineWidth = 0.06; c.beginPath(); c.arc(0, 0, E, 0, TAU); c.stroke(); c.strokeStyle = rgba(GOLD_HI, 0.5); c.lineWidth = 0.04; c.beginPath(); c.arc(0, 0, E - 0.08, 0, TAU); c.stroke();
    // the medallion at its heart: an open book with a gold eye on its pages
    c.beginPath(); c.arc(0, 0, 1.6, 0, TAU); c.fillStyle = INK; c.fill(); c.strokeStyle = GOLD; c.lineWidth = 0.12; c.stroke(); c.strokeStyle = rgba(GOLD_HI, 0.6); c.lineWidth = 0.04; c.beginPath(); c.arc(0, 0, 1.36, 0, TAU); c.stroke();
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0, -0.42); c.quadraticCurveTo(sd * 0.45, -0.62, sd * 0.95, -0.5); c.lineTo(sd * 0.95, 0.45); c.quadraticCurveTo(sd * 0.45, 0.32, 0, 0.5); c.closePath(); c.fillStyle = sd < 0 ? PARCH_HI : PARCH; c.fill(); c.strokeStyle = GOLD; c.lineWidth = 0.05; c.stroke(); }
    c.strokeStyle = GOLD; c.lineWidth = 0.06; c.beginPath(); c.moveTo(-0.62, 0); c.quadraticCurveTo(-0.32, -0.26, 0, -0.26); c.quadraticCurveTo(0.32, -0.26, 0.62, 0); c.quadraticCurveTo(0.32, 0.26, 0, 0.26); c.quadraticCurveTo(-0.32, 0.26, -0.62, 0); c.stroke(); c.fillStyle = GOLD; c.beginPath(); c.arc(0, 0, 0.13, 0, TAU); c.fill();
    // a few loose pages and ink blots left on it
    for (let i = 0; i < 7; i++) { const a = rnd() * TAU, d = 3 + rnd() * 7.5, x = Math.cos(a) * d, y = Math.sin(a) * d; c.save(); c.translate(x, y); c.rotate(rnd() * TAU); c.fillStyle = 'rgba(40,20,20,.15)'; c.fillRect(-0.32 + 0.05, -0.42 + 0.05, 0.64, 0.84); c.fillStyle = '#F6EDD6'; c.fillRect(-0.32, -0.42, 0.64, 0.84); c.strokeStyle = 'rgba(29,26,40,.3)'; c.lineWidth = 0.025; c.beginPath(); for (let k = 0; k < 5; k++) { c.moveTo(-0.22, -0.28 + k * 0.13); c.lineTo(0.05 + rnd() * 0.16, -0.28 + k * 0.13); } c.stroke(); c.restore(); }
    for (let i = 0; i < 5; i++) { const a = rnd() * TAU, d = 2 + rnd() * 9, x = Math.cos(a) * d, y = Math.sin(a) * d, s = 0.25 + rnd() * 0.3; c.fillStyle = 'rgba(29,26,40,.4)'; c.beginPath(); for (let k = 0; k <= 14; k++) { const b = k / 14 * TAU, rr = s * (1.3 + 0.4 * Math.sin(b * 3 + i) + 0.2 * Math.sin(b * 7)); k ? c.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr * 0.7) : c.moveTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr * 0.7); } c.closePath(); c.fill(); }
    // the lamp light pooled at its heart, and the dark creeping in from its rim
    g = c.createRadialGradient(0, -1, 0.5, 0, 0, E); g.addColorStop(0, 'rgba(255,240,200,.16)'); g.addColorStop(0.55, 'rgba(255,240,200,0)'); g.addColorStop(0.85, 'rgba(40,20,40,0)'); g.addColorStop(1, 'rgba(40,20,40,.3)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, E, 0, TAU); c.fill(); }
  function paintSky(c, W, H, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0A0814'); g.addColorStop(0.5, '#181428'); g.addColorStop(1, '#0B0916'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(707); c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { c.globalAlpha = 0.14 + R() * 0.1; blitSized(c, glowSprite(i % 3 ? VIOLET : '#6A3A8A'), R() * W - W * 0.3, R() * H * 0.8, W * 0.7, H * 0.4); } c.restore();
    // the black moon, gold-rimmed
    const mx = W * 0.76, my = H * 0.12, mr = Math.min(W, H) * 0.085; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; blitSized(c, glowSprite(GOLD), mx - mr * 2.6, my - mr * 2.6, mr * 5.2, mr * 5.2); c.restore();
    c.fillStyle = '#04030A'; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill(); c.strokeStyle = 'rgba(242,220,154,.85)'; c.lineWidth = 2; c.stroke(); c.strokeStyle = 'rgba(242,220,154,.25)'; c.lineWidth = 6; c.beginPath(); c.arc(mx, my, mr + 4, 0, TAU); c.stroke();
    // bookcases adrift in the dark, far off, tilted
    for (let i = 0; i < 9; i++) { const x = R() * W, y = H * (0.08 + R() * 0.8), s = 18 + R() * 30, rot = (R() - 0.5) * 0.8; c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = 0.5 + R() * 0.3; c.fillStyle = '#16122A'; c.fillRect(-s * 0.5, -s * 1.6, s, s * 1.6); c.fillStyle = '#211A38'; for (let k = 0; k < 4; k++) c.fillRect(-s * 0.42, -s * 1.5 + k * s * 0.38, s * 0.84, s * 0.26); c.strokeStyle = 'rgba(207,173,98,.35)'; c.lineWidth = 1.2; c.strokeRect(-s * 0.5, -s * 1.6, s, s * 1.6); c.restore(); }
    // loose pages and gold motes
    for (let i = 0; i < 14; i++) { const x = R() * W, y = R() * H, s = 4 + R() * 6; c.save(); c.translate(x, y); c.rotate(R() * TAU); c.globalAlpha = 0.3 + R() * 0.3; c.fillStyle = PARCH_HI; c.fillRect(-s * 0.7, -s, s * 1.4, s * 2); c.restore(); }
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(242,220,154,${0.3 + R() * 0.5})`; c.beginPath(); c.arc(R() * W, R() * H, 0.5 + R() * 1.2, 0, TAU); c.fill(); } c.restore(); }

  /* ---------- on the floor: the sentences' lanes and lines, the errata's shadows, the bite's cracks ---------- */
  function lab(c, X, Y, s, col, T, k) { c.save(); c.font = `900 ${Math.round(T * (k || 0.36))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(10,6,20,.8)'; c.lineJoin = 'round'; c.strokeText(s, X, Y); c.fillStyle = col || '#FFFFFF'; c.fillText(s, X, Y); c.restore(); }
  function dots(c, X, Y, n, T, col) { const r = Math.max(3.5, T * 0.2), sp = r * 2.6; for (let i = 0; i < n; i++) { const x = X + (i - (n - 1) / 2) * sp; c.beginPath(); c.arc(x, Y, r, 0, TAU); c.fillStyle = col || '#FFFFFF'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); } }
  function drawOverlay(c, FX, t, T) { const M = FX.mem, m = FX.m, C = FX.C; if (!M || !M.trail || !m) return; const sx = FX.sx, sy = FX.sy;
    // where it bit the floor: torn parchment, cracks
    M.cracks.forEach(k => { const X = sx(k.x), Y = sy(k.y), a = clamp((4 - k.t) / 1.2, 0, 1), Rr = mulberry32(k.seed); c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.fillStyle = 'rgba(29,26,40,.35)'; c.beginPath(); c.ellipse(X, Y, T * 1.3, T * 0.6, 0, 0, TAU); c.fill();
      for (let i = 0; i < 9; i++) { let x = X, y = Y; const b = i / 9 * TAU + Rr() * 0.5; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += Math.cos(b + (Rr() - 0.5) * 0.8) * T * 0.5; y += Math.sin(b + (Rr() - 0.5) * 0.8) * T * 0.3; c.lineTo(x, y); } c.strokeStyle = 'rgba(29,26,40,.8)'; c.lineWidth = Math.max(1.5, T * 0.09); c.stroke(); } c.restore(); });
    // the ink pools the copies rise from
    M.pools.forEach(p => { const X = sx(p.x), Y = sy(p.y), a = clamp(p.t / 0.3, 0, 1) * clamp((p.life - p.t) / 1, 0, 1); c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(30,18,52,.75)'; c.beginPath(); for (let k = 0; k <= 16; k++) { const b = k / 16 * TAU, rr = T * 1.35 * (1 + 0.12 * Math.sin(b * 5 + p.t * 2)); k ? c.lineTo(X + Math.cos(b) * rr, Y + Math.sin(b) * rr * 0.5) : c.moveTo(X + Math.cos(b) * rr, Y + Math.sin(b) * rr * 0.5); } c.closePath(); c.fill(); c.restore(); });
    // the sentences: the bright lane of each missing word, the line written at its start, its way across
    if (M.lines) { const many = M.lines.length > 1; M.lines.forEach(L => drawLane(c, FX, L, T, t, many)); }
    // errata: the genuine head's solid gold shadow, the copy's hollow dashed violet one and its dashed cone
    const E = M.er; if (E) { const P = pose(m, M), H = P.head, X = sx(H.x), Y = sy(H.y), pu = 0.5 + 0.5 * Math.sin(t * 6);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite(GOLD_HI), X - T * 2.4, Y - T * 1.3, T * 4.8, T * 2.6); c.restore();
      c.save(); c.fillStyle = rgba(GOLD, 0.92); c.strokeStyle = '#6A4A10'; c.lineWidth = Math.max(2, T * 0.08); c.beginPath(); c.ellipse(X, Y + T * 0.15, T * 1.55, T * 0.78, 0, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = rgba(GOLD_HI, 0.8 + 0.2 * pu); c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); c.ellipse(X, Y + T * 0.15, T * 1.25, T * 0.6, 0, 0, TAU); c.stroke(); c.restore();
      const o = E.copy; if (o && !o.dead) { const k = easeOut(o.rise || 0), Xo = sx(o.x), Yo = sy(o.y); c.save(); c.globalAlpha = k; c.setLineDash([T * 0.3, T * 0.22]); c.lineDashOffset = t * T * 1.2; c.lineWidth = Math.max(2.5, T * 0.09); c.strokeStyle = VIOLET_HI; c.beginPath(); c.ellipse(Xo, Yo + T * 0.15, T * 1.55, T * 0.78, 0, 0, TAU); c.stroke(); c.restore(); }
      const Fk = E.fake; if (Fk && !Fk.snapped && o && !o.dead) { const Xf = sx(Fk.x), Yf = sy(Fk.y); c.save(); c.setLineDash([T * 0.35, T * 0.25]); c.lineDashOffset = -t * T * 1.5; c.lineWidth = Math.max(2, T * 0.07); c.strokeStyle = rgba(VIOLET_HI, 0.9); c.lineJoin = 'round';
        c.beginPath(); c.moveTo(Xf, Yf); c.arc(Xf, Yf, Fk.len * T, Fk.a - Fk.spread, Fk.a + Fk.spread); c.closePath(); c.stroke(); c.restore();
        lab(c, Xf + Math.cos(Fk.a) * Fk.len * T * 0.6, Yf + Math.sin(Fk.a) * Fk.len * T * 0.6, 'FAKE', GHOST, T, 0.42); }
      // the real cone: its edge drawn solid and bright, and named
      const rt = FX.S.tele.find(s => s.real && !s.done); if (rt && M.bite && M.bite.errata) { const Xr = sx(rt.x), Yr = sy(rt.y); c.save(); c.lineWidth = Math.max(2.5, T * 0.1); c.strokeStyle = GOLD_HI; c.lineJoin = 'round'; c.beginPath(); c.moveTo(Xr, Yr); c.arc(Xr, Yr, rt.len * T, rt.a - rt.spread, rt.a + rt.spread); c.closePath(); c.stroke(); c.restore();
        lab(c, Xr + Math.cos(rt.a) * rt.len * T * 0.6, Yr + Math.sin(rt.a) * rt.len * T * 0.6, 'REAL', GOLD_HI, T, 0.42); } } }
  function drawLane(c, FX, L, T, t, many) { if (L.done) return; const C = FX.C, R = C.R, sx = FX.sx, sy = FX.sy, d = L.d, e = L.e, P = (s, o) => [sx(C.x + d[0] * s + e[0] * o), sy(C.y + d[1] * s + e[1] * o)];
    const k = L.run ? 1 : clamp(L.t / 0.35, 0, 1), pu = 0.5 + 0.5 * Math.sin(t * 7), SC = L.order === 2 ? SAFE2 : SAFE, s0 = L.run ? Math.max(-R, L.s) : -R, g0 = L.gapC - L.gapW / 2, g1 = L.gapC + L.gapW / 2, lc = L.order === 2 ? GHOST : GOLD_HI;
    c.save(); c.beginPath(); c.arc(sx(C.x), sy(C.y), R * T, 0, TAU); c.clip(); c.globalAlpha = k;
    // the lane: bright, its edges dashed and running the line's way
    const q = [P(s0, g0), P(R + 1, g0), P(R + 1, g1), P(s0, g1)]; c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = rgba(SC, 0.16 + 0.08 * pu); c.fill();
    c.setLineDash([T * 0.5, T * 0.3]); c.lineDashOffset = -t * T * 2.5; c.lineWidth = Math.max(2, T * 0.08); c.strokeStyle = rgba(SC, 0.9); c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.moveTo(q[3][0], q[3][1]); c.lineTo(q[2][0], q[2][1]); c.stroke(); c.setLineDash([]);
    if (many) for (let s = s0 + 1.6; s < R - 0.5; s += 3.4) { const p = P(s, L.gapC); dots(c, p[0], p[1], L.order, T, L.order === 2 ? SAFE2 : '#FFFFFF'); }
    if (!L.run) { // the line at its start, the arrows of its way
      const sL = -R + 0.5 + (L.order === 2 ? 1.0 : 0), ink = L.order === 2 ? '#8A5BD0' : DANGER; c.lineCap = 'round';
      const seg = (o0, o1) => { const a = P(sL, o0), b = P(sL, o1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = 'rgba(29,26,40,.7)'; c.lineWidth = Math.max(4, T * 0.3); c.stroke(); c.strokeStyle = rgba(ink, 0.65 + 0.3 * pu); c.lineWidth = Math.max(2, T * 0.14); c.stroke(); };
      seg(-R - 1, g0); seg(g1, R + 1);
      // the gap's brackets
      for (const [o, sd] of [[g0, -1], [g1, 1]]) { const a = P(sL - 0.45, o), b = P(sL + 0.45, o), a2 = P(sL - 0.45, o - sd * 0.35), b2 = P(sL + 0.45, o - sd * 0.35); c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b2[0], b2[1]); c.strokeStyle = SC; c.lineWidth = Math.max(2.5, T * 0.1); c.stroke(); }
      c.globalAlpha = k * (0.35 + 0.35 * pu); c.strokeStyle = rgba(ink, 0.8); c.lineWidth = Math.max(2, T * 0.08);
      for (let s = sL + 2.6; s < R; s += 4.2) for (let o = -R; o <= R; o += 3.4) { if (Math.abs(o - L.gapC) < L.gapW / 2 + 0.5) continue; const a = P(s - 0.55, o - 0.6), b = P(s, o), b2 = P(s - 0.55, o + 0.6); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
      c.globalAlpha = k; if (many) { const p = P(sL, L.gapC); dots(c, p[0], p[1], L.order, T, L.order === 2 ? SAFE2 : '#FFFFFF'); }
    } else if (Math.abs(L.s) < R) { // the line itself on the floor: an ink stroke under its wedges
      const hc = Math.sqrt(R * R - L.s * L.s), seg = (o0, o1) => { const a = P(L.s, o0), b = P(L.s, o1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = 'rgba(29,26,40,.75)'; c.lineWidth = Math.max(4, T * 0.5); c.lineCap = 'round'; c.stroke(); c.strokeStyle = rgba(L.order === 2 ? '#8A5BD0' : DANGER, 0.7); c.lineWidth = Math.max(2, T * 0.2); c.stroke(); };
      if (g0 > -hc) seg(-hc, g0); if (g1 < hc) seg(g1, hc); }
    c.restore();
    if (!L.run && (!many || L.order === 1)) { const p = P(-R + 3.4, L.gapC); lab(c, p[0], p[1] - T * 0.2, 'MISSING WORD', SAFE, T, 0.38); } }
  /* in the air: the page wedges of each running line, the labels */
  function drawAir(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M || !M.trail) return; const sx = FX.sx, sy = FX.sy, C = FX.C, R = C.R;
    if (M.lines) M.lines.forEach(L => { if (!L.run || L.done || Math.abs(L.s) >= R) return; const hc = Math.sqrt(R * R - L.s * L.s), list = [];
      for (let o = -hc + 0.25; o < hc - 0.2; o += 0.46) { if (Math.abs(o - L.gapC) < L.gapW / 2) continue; list.push([sx(C.x + L.d[0] * L.s + L.e[0] * o), sy(C.y + L.d[1] * L.s + L.e[1] * o), o]); }
      list.sort((a, b) => a[1] - b[1]); const lw = Math.max(1.2, T * 0.05), w = T * 0.25, tint = L.order === 2 ? '#E8DEFF' : PARCH_HI;
      c.save(); c.lineJoin = 'round';
      list.forEach(([X, Y, o]) => { const H = T * (0.95 + 0.35 * hsh(Math.round(o * 10) + L.order * 31)) * (0.92 + 0.08 * Math.sin(t * 14 + o * 3)), lean = T * 0.12 * Math.sin(o * 1.7);
        c.beginPath(); c.moveTo(X - w, Y); c.quadraticCurveTo(X - w * 0.6 + lean, Y - H * 0.6, X + lean * 1.4 - w * 0.1, Y - H); c.lineTo(X + w * 0.45 + lean, Y - H * 0.78); c.quadraticCurveTo(X + w * 0.8, Y - H * 0.35, X + w, Y); c.closePath(); c.fillStyle = tint; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
        c.beginPath(); for (let k = 0; k < 3; k++) { const yy = Y - H * (0.25 + k * 0.17); c.moveTo(X - w * 0.45, yy); c.lineTo(X + w * 0.4, yy - T * 0.02); } c.strokeStyle = 'rgba(29,26,40,.5)'; c.lineWidth = Math.max(0.8, T * 0.025); c.stroke();
        c.fillStyle = rgba(L.order === 2 ? '#8A5BD0' : DANGER, 0.55); c.fillRect(X - w * 0.9, Y - T * 0.12, w * 1.8, T * 0.1); });
      // the gap's two brackets standing
      for (const sd of [-1, 1]) { const o = L.gapC + sd * L.gapW / 2, X = sx(C.x + L.d[0] * L.s + L.e[0] * o), Y = sy(C.y + L.d[1] * L.s + L.e[1] * o); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7; blitSized(c, glowSprite(L.order === 2 ? SAFE2 : SAFE), X - T * 0.6, Y - T * 1.3, T * 1.2, T * 1.4); c.restore(); c.fillStyle = L.order === 2 ? SAFE2 : SAFE; c.strokeStyle = INK; c.lineWidth = lw; c.beginPath(); c.rect(X - T * 0.07, Y - T * 1.2, T * 0.14, T * 1.2); c.fill(); c.stroke(); }
      c.restore();
      const gp = [sx(C.x + L.d[0] * L.s + L.e[0] * L.gapC), sy(C.y + L.d[1] * L.s + L.e[1] * L.gapC)]; if (M.lines.length > 1) dots(c, gp[0], gp[1] - T * 1.5, L.order, T, L.order === 2 ? SAFE2 : '#FFFFFF'); });
    // labels: the bared eye, the copy, the unbinding's count
    if (m.stunT > 0) { const w = FX.S.weak.eye; if (w && !w.dead) lab(c, sx(w.x), sy(w.y) - T * 1.4, 'GOLD EYE · strike it', GOLD_HI, T); }
    const E = M.er; if (E && E.copy && !E.copy.dead && (E.copy.rise || 0) > 0.5) { const o = E.copy; lab(c, sx(o.x), sy(o.y) - T * 2.6, 'COPY · pop it', GHOST, T); }
    const U = M.ub; if (U) { const live = U.list.filter(q => !q.dead).length; lab(c, sx(m.x), sy(m.y) - T * 3.0, `RE-BINDING ${Math.max(0, Math.ceil(U.T - U.t))}s · TORN ${U.torn + U.list.filter(q => q.dead && !q.rebound).length}`, GOLD_HI, T, 0.4); void live; } }
})());
