/* ---------- ESHRA THE MANY-LIDDED ----------
   The Basilica of the Veiled Eye's first boss, in the Ossuary: a 28-metre chamber of calcite flagstones and ochre dust,
   three permanent square pillars standing in a wide triangle (the stage builds them: X.rift.self.mod.pillars).
   Eshra is a four-metre calcite scorpion: a low rectangular body of faceted dorsal plates over a core of volcanic black,
   six short jointed legs, two broad SHIELD CLAWS with black inner faces, and no stinger: its tail ends in a large red EYE
   framed by three stone lids. The tail surveys the arena on its own, apart from the body, and stops decisively before
   it fires.
   Witness Ray: the tail rears, swings to the pet and STOPS; a red tether joins eye and pet and a beam lane (warning red)
   follows it for three seconds, then fires down the lane. Put a PILLAR between the pet and the eye and the tether
   breaks: the ray scorches the pillar's face instead, and the eye reels for 1.5 s (struck harder). While the lids are
   open the eye is a weak point (x1.6; reeling x2); shut, it is armoured stone like the rest.
   Claw Crush: the shield claws rise, their black faces turned out, over a close red wedge in front of it; then both
   slam down. Flank it: the wedge is frontal only, though the eye keeps tracking the pet on its own.
   Between acts it paces round the ossuary's heart, and scuttles quickly to new ground.
   At half health the eye MARKS a pillar: the next ray CRACKS it; it stands one more cycle (so the change can be read),
   then falls (a shown circle). Another is marked once it is down; the last pillar is never marked.
   It is never still: its plates breathe in a ripple, its legs shuffle, its claws twitch, the lids blink one by one, the
   tail sways as it watches; it rocks back when struck. It dies by closing its lids one at a time and settling into
   calcite. */
RiftFiend.define({ id: 'eshra', hpK: 1.25, dmgK: 1.25, name: 'Eshra', title: 'The Many-Lidded', color: '#D8D1BB', glow: '#E08A7E', accent: '#FFD2B8', biome: 'cloister', r: 2.6, els: ['earth', 'dark'], phases: 2 }, (() => {
  const { TAU, TN, sorted, hit } = RiftFiend, tubeLite = TN.tubeLite, K = DunFiend.KIT;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const lerp3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const add3 = (a, b, k) => [a[0] + b[0] * (k == null ? 1 : k), a[1] + b[1] * (k == null ? 1 : k), a[2] + b[2] * (k == null ? 1 : k)], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const len3 = a => Math.hypot(a[0], a[1], a[2]), norm3 = a => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const turnTo = (a, b, dt, w) => a + clamp(angTo(a, b), -w * dt, w * dt);
  const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const mix = (a, b, u) => K.mixC(a, b, clamp(u, 0, 1)), rgba = TN.rgba;
  const { BLACK, OCHRE, OCHRE_HI, OCHRE_D, CALCITE, CALCITE_HI, CALCITE_D, RED, RED_HI, RED_D, WARN, INK } = BAS;
  // the painter's palette: calcite (three tones and a deep), volcanic black joints, the red eye and its hot light, ochre dust
  const CALR = { hi: CALCITE_HI, col: CALCITE, sh: CALCITE_D, sh2: '#8C846F' }, BLKR = { hi: '#4A4A54', col: '#303036', sh: BLACK, sh2: '#141416' };
  const HOT = '#FFD2B8', EYE_D = '#5A2622', AO = '#5E574A';
  const tubeS = R => ({ col: R.col, shade: R.sh, shade2: R.sh2, hi: R.hi, line: INK });
  // the camera looks along (0, -1, -1); the key light from the upper left, a little toward the camera
  const VIEW = [0, Math.SQRT1_2, Math.SQRT1_2], LIGHT = norm3([-0.5, 0.32, 0.82]), LSCR = [-0.566, -0.824];
  const A = BAS.arena.eshra;
  const CYC1 = ['ray', 'scuttle', 'crush', 'ray', 'crush', 'scuttle'], CYC3 = ['ray', 'crush', 'scuttle', 'ray', 'scuttle', 'crush'];
  // the body: five dorsal plates behind a head plate (u from front to back), half-widths
  const PLATES = [[0.78, 1.55, 0.86], [0.3, 0.74, 1.12], [-0.18, 0.26, 1.18], [-0.66, -0.22, 1.14], [-1.1, -0.7, 1.02], [-1.45, -1.14, 0.82]];
  // a claw jaw's outline in its own plane (along the claw, up it), the bevel facet above its ridge
  const JAW_U = [[0, 0], [0.04, 0.44], [0.5, 0.7], [1.05, 0.58], [1.44, 0.24], [1.58, 0.0]], JAW_UF = [[0.06, 0.12], [0.04, 0.44], [0.5, 0.7], [1.05, 0.58], [1.44, 0.24], [1.32, 0.12]];
  const JAW_L = [[0, 0], [1.34, -0.02], [1.12, -0.22], [0.62, -0.38], [0.1, -0.32]], JAW_LF = [[0.08, -0.1], [1.1, -0.1], [0.98, -0.22], [0.6, -0.34], [0.12, -0.28]];
  return {
    arenaR: A.R, carve: A.carve, start: A.start, firstAct: 'prowl', artY: 0.74, ambient: 'motes',
    artPoses: [{ name: 'surveying: the tail watches on its own', mem: { hd: 0.55, tailA: 2.4, lidAll: 0.55 } },
      { name: 'witness ray wind-up: the tail rears', mem: { hd: 2.5, tailA: 1.9, rear: 1, lidAll: 0.85 } },
      { name: 'witness ray: locked, firing', mem: { hd: 0.7, tailA: 1.5, reach: 1, lidAll: 1, glare: 1, fire: 1 } },
      { name: 'claw crush: shields raised', mem: { hd: 1.2, tailA: 2.3, raise: 1, lean: 1, lidAll: 0.65 } },
      { name: 'claw crush: the slam', mem: { hd: 2.0, tailA: 1.2, slam: 1, lidAll: 0.6 } },
      { name: 'scuttling', mem: { hd: 0.35, tailA: 1.6, spdK: 1, gait: 1.3, lidAll: 0.45 } },
      { name: 'reeling: the eye dazed', mem: { hd: 0.4, tailA: 1.6, reel: 1, lidAll: 0.5 }, m: { stunT: 1 } },
      { name: 'dead: lids shut, settled into calcite', mem: { hd: 2.6, tailA: 1.8, lidAll: 0, settle: 1, calc: 1, tailDrop: 0.55 } }],
    phaseNames: ['The Ossuary', 'The Ossuary', 'The Marked Pillar', 'The Marked Pillar'],
    props(C) { const out = [], R = mulberry32(9091), kinds = ['beaststatue', 'narrowpillar', 'stonebanner', 'narrowpillar', 'calcitecairn', 'narrowpillar', 'beaststatue', 'stonebanner'];
      for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + (R() - 0.5) * 0.12, far = Math.sin(a) < 0.1, s = far ? 1.0 + R() * 0.3 : 0.75 + R() * 0.2; out.push({ kind: kinds[i % kinds.length], i, v: Math.floor(R() * 12), s, x: C.x + Math.cos(a) * (C.R + 0.9), y: C.y + Math.sin(a) * (C.R + 0.7) }); } return out; },
    propKeep: { every: 30, box: p => [-2.2 * p.s, -5.2 * p.s, 2.2 * p.s, 0.8 * p.s] },
    drawProp(c, FX, p, X, Y, T) { c.translate(X, Y); const f = DunWorld.PROPS[p.kind]; if (f) f(c, T * p.s, p.v); },
    paintGround(c, A2) { paintOssuary(c, A2); },
    sky(c, W, H, t, cam, T) { paintVault(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m; m.noTouch = true; m.act = 'enter';
      Object.assign(M, { mod: stageMod(FX), bt: 0, hd: Math.PI / 2, hdTo: Math.PI / 2, rise: 0, settle: 0, calc: 0, tailDrop: 1, tailA: Math.PI / 2, tailV: 0, tailTo: Math.PI / 2, tailK: 5, tailC: 3.5, rear: 0, rearTo: 0, reach: 0, reachTo: 0,
        raise: 0, raiseTo: 0, slam: 0, slamTo: 0, lean: 0, leanTo: 0, crouch: 0, recoil: 0, reel: 0, glare: 0, glareTo: 0, fire: 0, lidK: [0, 0, 0], lidTo: 0.55, blinkT: 3, blinkU: -1, flinch: 0, eyeHit: 0, twitch: 0, twitchT: 2,
        gait: 0, spdK: 0, px: m.x, py: m.y, orb: null, odir: 1, picks: 0, nextAct: null, ry: null, cr: null, sc: null, mkA: null, mk: null, fall: null, scorch: [], marks: [], seen: {}, taught: false, flared: false, wasStun: false, stunKind: null, end: null, plEyes: 0, E: null,
        stat: { rays: 0, tethers: 0, broken: 0, rayHit: 0, rayMiss: 0, scorched: 0, reels: 0, crushes: 0, crushHit: 0, crushMiss: 0, scuttles: 0, marks: 0, cracks: 0, destroyed: 0 } }); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; clearActs(FX, m, M); m.stunT = 0; M.recoil = 0.8; M.flinch = 1;
      if (lv >= 3) { M.plEyes = 0.01; M.nextAct = 'mark'; } },
    ai(FX, m, dt) {
      const M = FX.mem, F = FX.S.fast; m.actT += dt; m.noTouch = true;
      switch (m.act) {
        case 'prowl': prowl(FX, m, M, dt, F); if (m.actT > (FX.S.lv >= 3 ? 1.1 : 1.6) / F && !M.fall) { m.actT = 0; choose(FX, m); } break;
        case 'ray': rayStep(FX, m, M, dt); break;
        case 'crush': crushStep(FX, m, M, dt, F); break;
        case 'scuttle': scuttleStep(FX, m, M, dt); break;
        case 'mark': markStep(FX, m, M, dt); break;
        default: toProwl(FX, m, M);
      }
      keepOut(FX, m);
      // the weak point: the eye, while its lids are open for the ray
      const R = M.ry, open = m.act === 'ray' && R && (R.st === 'tether' || R.st === 'fire'), E = M.E;
      if (open && E) FX.weak('eye', E[0], E[1] - E[2], 1.0, 1.6, true); else if (FX.S.weak.eye) FX.weak('eye', 0, 0, 0, 0, false);
      FX.parts(bodyParts(m, M, !open)); if (open) dropPart(FX, 'ey');
    },
    stunned(FX, m, dt) { const M = FX.mem, E = M.E; m.noTouch = true;
      if (E) FX.weak('eye', E[0], E[1] - E[2], 1.1, 2.0, m.stunT > 0.05);
      FX.parts(bodyParts(m, M, false)); dropPart(FX, 'ey');
      if (Math.random() < dt * 5 && E) { const a = Math.random() * TAU; FX.H.part({ kind: 'spark', x: E[0] + Math.cos(a) * 0.7, y: E[1] - E[2] + Math.sin(a) * 0.5, vx: Math.cos(a) * 1.2, vy: -1.2, drag: 0.6, life: 0.6, max: 0.6, size: 3, color: Math.random() < 0.5 ? RED_HI : HOT }); } },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.stat) return; M.bt += dt; const stun = m.stunT > 0 && !m.dead, me = FX.me, bt = M.bt;
      if (!stun && M.wasStun) { M.wasStun = false; M.recoil = 0.5; M.stunKind = null; FX.H.text(m.x, m.y - 5.5, 'Its lids steady', CALCITE_HI, 13); FX.H.sfx.thud(); }
      if (stun) M.wasStun = true;
      M.recoil = decay(M.recoil, dt, 2.4); M.flinch = decay(M.flinch, dt, 2.6); M.eyeHit = decay(M.eyeHit, dt, 3);
      // the entrance: it rises out of its crouch, the tail uncurls, then the lids open one by one and the eye flares
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.rise = smooth((e - 0.3) / 1.4); M.tailDrop = 1 - smooth((e - 0.9) / 1.2);
        for (let i = 0; i < 3; i++) M.lidK[i] = smooth((e - 2.0 - i * 0.32) / 0.22);
        if (e > 0.3 && e < 1.8 && Math.random() < dt * 18) dust(FX, m.x + FX.rnd(-2.5, 2.5), m.y + FX.rnd(-1, 1.5), 1.1, 2, 0);
        if (e > 2.9 && !M.flared) { M.flared = true; FX.H.sfx.hum(); FX.H.sfx.crash(); M.glare = 1; if (M.E) { FX.H.ring(M.E[0], M.E[1] - M.E[2], 0.3, 3.5, 0.6, RED_HI, 0.3); FX.H.sparks(M.E[0], M.E[1] - M.E[2], HOT, 14, 6); } } }
      else { M.rise = toward(M.rise, 1, dt, 4); M.tailDrop = toward(M.tailDrop, M.end ? 0.55 : 0, dt, M.end ? 1.2 : 3); }
      // the death: lids close one at a time, the body settles, calcite creeps over it
      if (M.end) { const E2 = M.end; E2.t += dt; M.settle = smooth((E2.t - 1.5) / 1.4); M.calc = smooth((E2.t - 1.6) / 1.8);
        if (Math.random() < dt * 10 * (1 - M.calc * 0.6)) dust(FX, m.x + FX.rnd(-2.2, 2.2), m.y + FX.rnd(-1, 1.2), 0.8, 1, 0); }
      if (!M.taught && m.act === 'prowl') { M.taught = true; m.actT = -2.2; FX.H.banner('THE MANY-LIDDED', 'Its tail-eye watches on its own. When it tethers you, put a PILLAR between you and the eye; flank its claws', '#FFFFFF', 3.0, true); }
      // the pose's moving parts, set by the acts each frame and eased here
      M.rear = toward(M.rear, M.rearTo, dt, 7); M.rearTo = 0; M.reach = toward(M.reach, M.reachTo, dt, 6); M.reachTo = 0;
      if (!M.cHold) { M.raise = toward(M.raise, M.raiseTo, dt, 7); M.slam = toward(M.slam, M.slamTo, dt, 9); } M.cHold = false; M.raiseTo = 0; M.slamTo = 0;
      M.lean = toward(M.lean, M.leanTo, dt, 6); M.leanTo = 0; M.glare = toward(M.glare, M.glareTo, dt, 4); M.glareTo = 0; M.fire = decay(M.fire, dt, 2.2);
      M.reel = toward(M.reel, stun ? 1 : 0, dt, stun ? 6 : 2.5); M.plEyes = M.plEyes > 0 ? toward(M.plEyes, 1, dt, 0.8) : 0;
      // the lids: each its own, a blink closing them one by one, a flinch when struck, a flutter when it reels
      M.blinkT -= dt; if (M.blinkT <= 0 && !stun && m.act !== 'ray') { M.blinkT = 2.6 + Math.random() * 3.5; M.blinkU = 0; } if (M.blinkU >= 0) { M.blinkU += dt / 0.55; if (M.blinkU > 1.6) M.blinkU = -1; }
      if (m.act !== 'enter') for (let i = 0; i < 3; i++) { let want = M.end ? 1 - smooth((M.end.t - 0.35 - i * 0.45) / 0.3) : M.lidTo;
        if (!M.end && M.blinkU >= 0) { const u = M.blinkU - i * 0.22; if (u > 0 && u < 0.6) want *= 1 - Math.sin(u / 0.6 * Math.PI); }
        if (!M.end) want *= 1 - M.flinch * 0.75; if (stun) want = 0.4 + 0.3 * Math.sin(bt * 13 + i * 2.1);
        M.lidK[i] = toward(M.lidK[i], clamp(want, 0, 1), dt, 14); }
      M.lidTo = 0.55;
      // the tail: a spring toward where it looks (slow and swaying as it surveys, stiff and still when it locks)
      if (!stun && !M.end && m.act !== 'enter') { if (M.tailFree !== false) { M.tailTo = FX.angPet(m.x, m.y) + Math.sin(bt * 0.5) * 1.25 + Math.sin(bt * 0.19 + 1) * 0.55; M.tailK = 5; M.tailC = 3.5; } }
      else { M.tailTo = M.tailA + (stun ? Math.sin(bt * 3.1) * 0.6 : 0); M.tailK = stun ? 8 : 3; M.tailC = 4; }
      M.tailFree = true;
      M.tailV += (M.tailK * angTo(M.tailA, M.tailTo) - M.tailC * M.tailV) * dt; M.tailA += M.tailV * dt;
      // the body's heading, its gait from how fast it moves, and the claws' idle twitch
      if (!stun && !M.end && m.act !== 'enter') M.hd = turnTo(M.hd, M.hdTo == null ? M.hd : M.hdTo, dt, M.sc ? 5 : m.act === 'crush' ? 3.5 : 1.3);
      if (dt > 1e-4) { const sp = Math.hypot(m.x - M.px, m.y - M.py) / dt; M.px = m.x; M.py = m.y; M.spdK = toward(M.spdK, clamp(sp / 6, 0, 1), dt, 6); }
      M.gait += dt * (1.3 + M.spdK * 13);
      M.twitchT -= dt; if (M.twitchT <= 0) { M.twitchT = 1.5 + Math.random() * 2.5; M.twitch = 1; } M.twitch = decay(M.twitch, dt, 3);
      // where the eye is, for the acts and the painting of the air
      M.E = tailPose(pose(m, M), M, me).E;
      if (M.fall && !FX.S.tele.includes(M.fall.tele)) finishFall(FX, m, M);
      // dust trickling from its joints as it moves
      if (!M.end && M.spdK > 0.3 && Math.random() < dt * 10) dust(FX, m.x + FX.rnd(-2, 2), m.y + FX.rnd(-0.8, 1.2), 0.6, 1, 0);
      M.scorch.forEach(s => s.t += dt); M.scorch = M.scorch.filter(s => s.t < 14); M.marks.forEach(k => k.t += dt); M.marks = M.marks.filter(k => k.t < k.life); },
    dmgK(FX, m) { const M = FX.mem; if (!M || !M.stat) return 1; M.recoil = Math.max(M.recoil || 0, 0.42); if (!(m.act === 'ray' && M.ry && M.ry.st !== 'turn')) M.flinch = Math.max(M.flinch, 0.5); return m.stunT > 0 ? 1.25 : 1; },
    onWeakHit(FX, key) { const M = FX.mem; if (!M) return; if (key === 'eye') { M.eyeHit = 1; M.recoil = Math.max(M.recoil || 0, 0.35); } },
    ending(FX, m) { const M = FX.mem; clearActs(FX, m, M); if (FX.S.weak.eye) FX.weak('eye', 0, 0, 0, 0, false); M.end = { t: 0 }; FX.H.sfx.hum();
      return { title: 'THE LIDS CLOSE', sub: 'Eshra the Many-Lidded settles into calcite', col: CALCITE_HI, delay: 4.2, bannerAt: 1.6 }; },
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.stat || m.act === 'enter') return null; const x = m.x, y = m.y - 1.8, d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(0.35, 3.4 / d) }; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { drawEshra(c, FX, m, X, Y, T, t); },
    drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (m && m.dead && M && M.end) drawEshra(c, FX, m, FX.sx(m.x), FX.sy(m.y), T, t); drawAir(c, FX, T, t); },
  };

  /* ---------- the stage's pillars ---------- */
  // (the ossuary's module is the stage's; the fiend reaches it through the Basilica's running context for this game)
  function stageMod(FX) { try { if (!FX.F || !FX.F.rift || !FX.H || !FX.H.g) return null; const C = BAS.ctx({ g: FX.H.g }), R = C && C.X && C.X.rift; return R && R.self && R.self.mod && R.self.mod.pillars ? R.self.mod : null; } catch (e) { return null; } }
  function pillars(FX) { const M = FX.mem; if (M.mod && M.mod.pillars) return M.mod.pillars;
    if (!M.fakeP) M.fakeP = A.pillars(FX.C).map(p => { const P = { x: p.x + 1, y: p.y + 1, cracked: 0, gone: false }; P.crack = k => { P.cracked = clamp(k, 0, 1); }; P.destroy = () => { P.gone = true; }; return P; }); return M.fakeP; }
  function standing(FX) { return pillars(FX).map((P, i) => P.gone ? -1 : i).filter(i => i >= 0); }
  // where a segment first enters a square (centre cx, cy, half-size h): its fraction along, or null
  function segBox(x0, y0, x1, y1, cx, cy, h) { let t0 = 0, t1 = 1; const dx = x1 - x0, dy = y1 - y0;
    for (const [p, d, lo, hi] of [[x0, dx, cx - h, cx + h], [y0, dy, cy - h, cy + h]]) { if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return null; continue; } let a = (lo - p) / d, b = (hi - p) / d; if (a > b) { const s = a; a = b; b = s; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return null; } return t0; }
  // the first standing pillar a segment runs into
  function blocker(FX, x0, y0, x1, y1, pad) { let best = -1, bt = 2; pillars(FX).forEach((P, i) => { if (P.gone) return; const t = segBox(x0, y0, x1, y1, P.x, P.y, 1 + (pad || 0)); if (t != null && t < bt) { bt = t; best = i; } }); return best < 0 ? null : { i: best, t: bt }; }
  function keepOut(FX, m) { for (const P of pillars(FX)) { if (P.gone) continue; const dx = m.x - P.x, dy = m.y - P.y, d = Math.hypot(dx, dy), R = 1.4 + m.r * 0.75; if (d < R && d > 1e-3) { m.x = P.x + dx / d * R; m.y = P.y + dy / d * R; } } const q = FX.clampArena(m, 3.0); m.x = q.x; m.y = q.y; }
  function rimDist(FX, x, y, d) { const C = FX.C, px = x - C.x, py = y - C.y, b = px * d[0] + py * d[1], cc = px * px + py * py - C.R * C.R; return -b + Math.sqrt(Math.max(0, b * b - cc)); }
  function segDist(px, py, x0, y0, x1, y1) { const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy || 1, u = clamp(((px - x0) * dx + (py - y0) * dy) / L, 0, 1); return Math.hypot(px - x0 - dx * u, py - y0 - dy * u); }

  /* ---------- the fight's pieces ---------- */
  function dust(FX, x, y, r, n, shake) {
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = r * (0.3 + Math.random() * 0.7), life = 0.7 + Math.random() * 0.6; FX.H.part({ kind: 'smoke', x: x + Math.cos(a) * d * 0.6, y: y + Math.sin(a) * d * 0.45, vx: Math.cos(a) * (1 + r * 0.9), vy: Math.sin(a) * (0.6 + r * 0.5) - 0.7, drag: 1.1, life, max: life, size: 0.5 + r * 0.2, color: Math.random() < 0.55 ? OCHRE_HI : CALCITE }); }
    for (let i = 0; i < Math.ceil(n / 2); i++) FX.H.part({ kind: 'shard', x: x + FX.rnd(-r, r) * 0.6, y: y + FX.rnd(-r, r) * 0.4, vx: FX.rnd(-4, 4), vy: FX.rnd(-6, -2), g: 12, life: 0.7, max: 0.7, size: 3, rot: Math.random() * 3, vr: 8, color: Math.random() < 0.5 ? CALCITE_D : OCHRE });
    if (shake) FX.H.shake(shake, 0.3); }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.4 : 1.1, true); }
  function cancelTele(FX) { FX.S.tele.forEach(s => { if (s.keep) return; s.dmg = 0; s.fn = null; s.done = true; s.linger = 0; }); }
  function clearActs(FX, m, M) { cancelTele(FX); M.ry = null; M.cr = null; M.sc = null; M.mkA = null; M.raise = M.slam = 0; M.cHold = false; m.act = 'prowl'; m.actT = 0; }
  function dropPart(FX, key) { const P = FX.S.partsMap; if (P && P[key]) { P[key].dead = true; P[key] = null; } }
  function toProwl(FX, m, M) { m.act = 'prowl'; m.actT = 0; M.ry = null; M.cr = null; M.sc = null; M.mkA = null; if (M.mk && M.mk.st === 'doomed' && !M.fall) startFall(FX, m, M); }
  function choose(FX, m) { const M = FX.mem; let k = M.nextAct; M.nextAct = null;
    if (!k) { const cyc = FX.S.lv >= 3 ? CYC3 : CYC1; k = cyc[M.picks % cyc.length]; M.picks++; }
    ({ ray: startRay, crush: startCrush, scuttle: startScuttle, mark: startMark })[k](FX, m); }
  function moveToward(m, x, y, v, dt) { const dx = x - m.x, dy = y - m.y, d = Math.hypot(dx, dy); if (d < 1e-3) return 0; const s = Math.min(d, v * dt); m.x += dx / d * s; m.y += dy / d * s; return d; }
  /* ---- at rest: it paces round the ossuary's heart, turned to the pet, the tail surveying on its own ---- */
  function prowl(FX, m, M, dt, F) { const C = FX.C; if (M.orb == null) M.orb = Math.atan2(m.y - C.y, m.x - C.x); M.orb += dt * 0.16 * M.odir * F;
    moveToward(m, C.x + Math.cos(M.orb) * 3.6, C.y + Math.sin(M.orb) * 3.6, 1.2 * F, dt); M.hdTo = FX.angPet(m.x, m.y); M.lidTo = 0.62; }

  /* ---- Witness Ray: the tail rears, swings to the pet and stops; a tether and a lane for three seconds; then the ray.
     A pillar between pet and eye breaks the tether: the ray scorches the pillar, and the eye reels ---- */
  function startRay(FX, m) { const M = FX.mem, F = FX.S.fast; m.act = 'ray'; m.actT = 0;
    M.ry = { st: 'turn', age: 0, turn: 0.75 / F, tether: 3.0, lockAt: 2.55, fire: 0.55, broken: false, bi: -1, locked: false, dir: FX.angPet(m.x, m.y), ox: m.x, oy: m.y, len: 8, cut: 8, cutI: -1 }; M.stat.rays++; FX.H.sfx.hum();
    say(FX, 'ray', 'WITNESS RAY', 'A red tether marks you: in three seconds the eye fires down it. Put a PILLAR between you and the eye', RED_HI); }
  function rayLane(FX, R) { const d = [Math.cos(R.dir), Math.sin(R.dir)], len = Math.max(2, rimDist(FX, R.ox, R.oy, d) - 0.2), b = blocker(FX, R.ox, R.oy, R.ox + d[0] * len, R.oy + d[1] * len, 0); R.len = len; R.cut = b ? Math.max(0.5, b.t * len) : len; R.cutI = b ? b.i : -1; }
  function rayStep(FX, m, M, dt) { const R = M.ry, me = FX.me; if (!R) { toProwl(FX, m, M); return; } R.age += dt; const E = M.E || [m.x, m.y, 3];
    R.ox = E[0]; R.oy = E[1]; M.hdTo = FX.angPet(m.x, m.y); M.tailFree = false;
    if (R.st === 'turn') { const u = clamp(R.age / R.turn, 0, 1); M.rearTo = smooth(u / 0.7) * (1 - smooth((u - 0.75) / 0.25)); M.lidTo = 0.6 + 0.3 * u; M.glareTo = 0.2;
      M.tailTo = Math.atan2(me.y - m.y, me.x - m.x); M.tailK = 30; M.tailC = 6;
      if (R.age >= R.turn) { R.st = 'tether'; R.t1 = R.age; M.stat.tethers++; FX.H.sfx.crack(); FX.H.shake(4, 0.15); M.tailK = 140; M.tailC = 24; M.tailV *= 0.2; if (M.E) FX.H.ring(E[0], E[1] - E[2], 0.2, 1.6, 0.3, RED_HI, 0.25); }
      return; }
    if (R.st === 'tether') { const ta = R.age - R.t1, P = pillars(FX);
      if (!R.broken && !R.locked) { R.dir = Math.atan2(me.y - R.oy, me.x - R.ox); const b = blocker(FX, R.ox, R.oy, me.x, me.y, 0);
        if (b && ta > 0.12) { R.broken = true; R.bi = b.i; const Q = P[b.i]; R.dir = Math.atan2(Q.y - R.oy, Q.x - R.ox); M.stat.broken++; FX.H.text(me.x, me.y - 1.7, 'TETHER BROKEN!', '#9CFFD8', 15); FX.H.sfx.crack(); FX.H.sparks(me.x, me.y - 0.8, RED_HI, 8, 4); } }
      if (!R.locked && ta >= R.lockAt) { R.locked = true; FX.H.sfx.whoosh(); }
      M.tailTo = R.dir; M.tailK = 140; M.tailC = 24; M.lidTo = 1; M.glareTo = clamp(ta / R.tether, 0, 1); M.reachTo = 1;
      rayLane(FX, R); if (ta >= R.tether) fireRay(FX, m, M, R); return; }
    if (R.st === 'fire') { M.tailTo = R.dir; M.tailK = 140; M.tailC = 24; M.lidTo = 1; M.glareTo = 1; M.reachTo = 1; M.fire = 1;
      if (Math.random() < dt * 30) { const d = [Math.cos(R.dir), Math.sin(R.dir)]; FX.H.sparks(R.ox + d[0] * R.cut, R.oy + d[1] * R.cut - 0.5, Math.random() < 0.5 ? HOT : RED_HI, 2, 5); }
      if (R.age - R.t2 >= R.fire) { if (R.broken) { reelNow(FX, m, M); return; } R.st = 'close'; R.t3 = R.age; } return; }
    M.lidTo = 0.6; if (R.age - R.t3 >= 0.35) toProwl(FX, m, M); }
  function fireRay(FX, m, M, R) { const me = FX.me; R.st = 'fire'; R.t2 = R.age; rayLane(FX, R);
    const ca = Math.cos(R.dir), sa = Math.sin(R.dir), rx = me.x - R.ox, ry = me.y - R.oy, al = rx * ca + ry * sa, of = Math.abs(-rx * sa + ry * ca);
    const inside = al > -0.4 && al < R.cut + me.r * 0.3 && of < 0.8 + me.r * 0.4;
    if (inside && !(me.dodge || me.leap)) { M.stat.rayHit++; FX.hurt(m.dmg * 1.8); FX.H.text(me.x, me.y - 1.7, 'Witnessed!', WARN, 15); } else M.stat.rayMiss++;
    if (R.cutI >= 0) { const P = pillars(FX)[R.cutI]; M.stat.scorched++; M.scorch.push({ i: R.cutI, x: R.ox + ca * R.cut, y: R.oy + sa * R.cut, a: R.dir, t: 0 }); FX.H.boom(R.ox + ca * R.cut, R.oy + sa * R.cut, 1.0, RED_HI, HOT, { n: 14, shake: 6 }); if (P && !P.gone) FX.H.text(P.x, P.y - 5.2, R.broken ? 'The ray scorches the pillar' : 'The pillar takes the ray', CALCITE_HI, 13); }
    FX.H.sfx.crash(); FX.H.shake(9, 0.3); FX.H.flash(0.06, RED_HI); M.recoil = Math.max(M.recoil, 0.3); M.fire = 1;
    rayFired(FX, m, M); }
  function reelNow(FX, m, M) { M.ry = null; m.act = 'prowl'; m.actT = 0; m.stunT = Math.max(m.stunT || 0, 1.5); M.stunKind = 'reel'; M.stat.reels++; M.recoil = 1;
    FX.H.sfx.thud(); FX.H.shake(6, 0.25); const first = !M.seen.reel; M.seen.reel = true; FX.H.banner('THE EYE REELS', first ? 'Its ray broke on stone: strike the EYE while it reels!' : 'Strike the eye!', HOT, first ? 2.0 : 1.0, true); }
  // the marked pillar: the next ray cracks it; it stands one more cycle; then it falls
  function rayFired(FX, m, M) { const K2 = M.mk; if (!K2) return; const P = pillars(FX)[K2.i]; if (!P || P.gone) { M.mk = null; return; }
    if (K2.st === 'marked') { P.crack(0.55); K2.st = 'cracked'; M.stat.cracks++; FX.H.after(0.6, () => FX.H.banner('THE PILLAR CRACKS', 'It holds one more cycle. Choose ANOTHER pillar for the next ray', CALCITE_HI, 2.2, true)); FX.H.sfx.crack(); dust(FX, P.x, P.y, 1.4, 10, 4); }
    else if (K2.st === 'cracked') { P.crack(0.9); K2.st = 'doomed'; FX.H.text(P.x, P.y - 5.2, 'The cracked pillar groans', CALCITE_HI, 13); dust(FX, P.x, P.y, 1.2, 6, 2); } }
  function startFall(FX, m, M) { const i = M.mk.i, P = pillars(FX)[i]; if (!P || P.gone) { M.mk = null; return; } M.mk.st = 'falling'; FX.H.text(P.x, P.y - 5.2, 'The cracked pillar gives way!', WARN, 14); FX.H.sfx.crack();
    M.fall = { i, tele: FX.tele({ shape: 'circle', x: P.x, y: P.y, r: 2.7, t: 1.5, dmg: m.dmg * 0.9, col: WARN, keep: true, fn: () => finishFall(FX, FX.m, M) }) }; }
  function finishFall(FX, m, M) { const F2 = M.fall; if (!F2) return; M.fall = null; const P = pillars(FX)[F2.i]; if (P && !P.gone) { P.destroy(); M.stat.destroyed++; dust(FX, P.x, P.y, 2.4, 22, 12); FX.H.sfx.crash(); }
    M.mk = null; if (m && !m.dead && standing(FX).length >= 2) M.nextAct = 'mark'; }
  /* ---- the mark (half health, and after each pillar falls while two still stand) ---- */
  function startMark(FX, m) { const M = FX.mem, st = standing(FX), me = FX.me; if (st.length < 2 || M.mk) { toProwl(FX, m, M); return; }
    const P = pillars(FX); let i = st[0]; st.forEach(j => { if (Math.hypot(P[j].x - me.x, P[j].y - me.y) < Math.hypot(P[i].x - me.x, P[i].y - me.y)) i = j; });
    m.act = 'mark'; m.actT = 0; M.mkA = { age: 0, i, done: false }; FX.H.sfx.hum(); }
  function markStep(FX, m, M, dt) { const K2 = M.mkA; if (!K2) { toProwl(FX, m, M); return; } K2.age += dt; const P = pillars(FX)[K2.i], E = M.E || [m.x, m.y, 3];
    M.tailFree = false; M.tailTo = Math.atan2(P.y - E[1], P.x - E[0]); M.tailK = 60; M.tailC = 14; M.lidTo = 1; M.glareTo = 0.7; M.reachTo = 0.6; M.hdTo = FX.angPet(m.x, m.y); M.look = [P.x, P.y, 2.5];
    if (K2.age > 0.55 && !K2.done) { K2.done = true; M.mk = { i: K2.i, st: 'marked' }; M.stat.marks++; FX.H.ring(P.x, P.y, 0.4, 3.0, 0.6, RED_HI, 0.3); FX.H.sparks(P.x, P.y - 4.4, RED_HI, 14, 5); FX.H.sfx.crash();
      FX.H.banner('THE MARKED PILLAR', 'Its eye marks a pillar: the next ray CRACKS it, and it falls a cycle later. Hide behind ANOTHER', RED_HI, 2.6, true); }
    if (K2.age > 1.4) { M.look = null; toProwl(FX, m, M); } }

  /* ---- Claw Crush: it closes in, raises its shields over a red wedge in front of it, and slams both down ---- */
  function startCrush(FX, m) { const M = FX.mem, F = FX.S.fast, P2 = FX.S.lv >= 3; m.act = 'crush'; m.actT = 0;
    M.cr = { st: 'close', age: 0, wind: (P2 ? 0.8 : 0.95) / F, spread: P2 ? 0.78 : 0.66, len: 5.6, a: FX.angPet(m.x, m.y) }; M.stat.crushes++; FX.H.sfx.hum();
    say(FX, 'crush', 'CLAW CRUSH', 'Its shield claws rise over the red wedge in front of it: get round its FLANK', WARN); }
  function crushStep(FX, m, M, dt, F) { const Cr = M.cr, me = FX.me; if (!Cr) { toProwl(FX, m, M); return; } Cr.age += dt; M.lidTo = 0.65;
    // the eye keeps watching the pet on its own, whatever the claws do
    M.tailFree = false; M.tailTo = Math.atan2(me.y - m.y, me.x - m.x); M.tailK = 12; M.tailC = 5;
    if (Cr.st === 'close') { const d = FX.dist(m.x, m.y); M.hdTo = FX.angPet(m.x, m.y);
      if (d > 3.9 && Cr.age < 1.6) { const a = FX.angPet(m.x, m.y); moveToward(m, me.x - Math.cos(a) * 3.4, me.y - Math.sin(a) * 3.4, 5.2 * F, dt); return; }
      Cr.st = 'wind'; Cr.t0 = Cr.age; Cr.a = FX.angPet(m.x, m.y); FX.H.sfx.whoosh();
      Cr.tele = FX.tele({ shape: 'cone', x: m.x, y: m.y, a: Cr.a, len: Cr.len, spread: Cr.spread, t: Cr.wind, dmg: 0, col: WARN, fn: s => crushDown(FX, FX.m, M, s) }); return; }
    M.hdTo = Cr.a;
    if (Cr.st === 'wind') { const u = clamp((Cr.age - Cr.t0) / Cr.wind, 0, 1); M.raiseTo = smooth(u / 0.8); M.leanTo = smooth(u); return; }
    if (Cr.st === 'slam') { const u = clamp((Cr.age - Cr.t1) / 0.12, 0, 1); M.cHold = true; M.slam = u; M.raise = 1 - u; M.leanTo = -0.6; if (u >= 1) { Cr.st = 'stuck'; Cr.t2 = Cr.age; } return; }
    if (Cr.st === 'stuck') { M.cHold = true; M.slam = 1; M.raise = 0; M.leanTo = -0.4; if (Cr.age - Cr.t2 > 0.55) { Cr.st = 'back'; Cr.t3 = Cr.age; } return; }
    const u = clamp((Cr.age - Cr.t3) / 0.35, 0, 1); M.cHold = true; M.slam = 1 - smooth(u); M.raise = 0; if (u >= 1) toProwl(FX, m, M); }
  function crushDown(FX, m, M, s) { const Cr = M.cr, me = FX.me; if (!m || !Cr) return; Cr.st = 'slam'; Cr.t1 = Cr.age;
    const inside = FX.inShape(s, me.x, me.y, me.r * 0.6);
    if (inside && !(me.dodge || me.leap)) { M.stat.crushHit++; FX.hurt(m.dmg * 1.6); FX.H.text(me.x, me.y - 1.6, 'Crushed!', WARN, 15); const a = Math.atan2(me.y - m.y, me.x - m.x); me.push = { vx: Math.cos(a) * 11, vy: Math.sin(a) * 11, t: 0.24 }; }
    else M.stat.crushMiss++;
    FX.H.sfx.crash(); FX.H.sfx.thud(); FX.H.shake(12, 0.35);
    for (const sd of [-1, 1]) { const a = Cr.a + sd * 0.42, x = m.x + Math.cos(a) * 3.1, y = m.y + Math.sin(a) * 3.1; dust(FX, x, y, 1.6, 12, 0); M.marks.push({ x, y, a: Cr.a, t: 0, life: 6 }); } }

  /* ---- Scuttle: a quick run to new ground, clear of the pillars ---- */
  function startScuttle(FX, m) { const M = FX.mem, C = FX.C, F = FX.S.fast, P = pillars(FX); let to = null;
    for (let k = 0; k < 40 && !to; k++) { const a = Math.random() * TAU, d = 1.5 + Math.random() * C.R * 0.42, x = C.x + Math.cos(a) * d, y = C.y + Math.sin(a) * d;
      if (Math.hypot(x - m.x, y - m.y) < 3.5) continue; if (P.some(Q => !Q.gone && (Math.hypot(Q.x - x, Q.y - y) < 3.6 || segDist(Q.x, Q.y, m.x, m.y, x, y) < 2.7))) continue; to = { x, y }; }
    if (!to) to = { x: C.x + (C.x - m.x) * 0.3, y: C.y + (C.y - m.y) * 0.3 };
    const d = Math.hypot(to.x - m.x, to.y - m.y); m.act = 'scuttle'; m.actT = 0; M.sc = { t: 0, dur: (0.5 + d / (FX.S.lv >= 3 ? 7.5 : 6.5)) / F, x0: m.x, y0: m.y, x1: to.x, y1: to.y, a: Math.atan2(to.y - m.y, to.x - m.x) }; M.stat.scuttles++; FX.H.sfx.whoosh(); }
  function scuttleStep(FX, m, M, dt) { const S = M.sc; if (!S) { toProwl(FX, m, M); return; } S.t += dt; const k = smooth(S.t / S.dur); m.x = lerp(S.x0, S.x1, k); m.y = lerp(S.y0, S.y1, k); M.hdTo = S.a; M.lidTo = 0.45;
    if (S.t >= S.dur) { M.sc = null; M.orb = null; M.odir = Math.random() < 0.5 ? 1 : -1; toProwl(FX, m, M); } }

  /* ---------- the body: where everything is ---------- */
  function pose(m, M) {
    const hd = M.hd == null ? Math.PI / 2 : M.hd, bt = M.bt || 0, rc = M.recoil || 0, rise = M.rise == null ? 1 : M.rise, st = M.settle || 0, ln = M.lean || 0, rl = M.reel || 0;
    const cf = Math.cos(hd), sf = Math.sin(hd), br = Math.sin(bt * 1.6) * 0.025, sp = M.spdK || 0;
    const B = { x: m.x - cf * rc * 0.35, y: m.y - sf * rc * 0.35 };
    const W0 = RiftFiend.frame(B, hd, { z: -(1 - rise) * 0.42 - st * 0.3 + br * 0.4 - Math.max(0, ln) * 0.08 + (M.slam || 0) * -0.1, pitch: rc * 0.07 + ln * 0.1 - (M.slam || 0) * 0.08 + rl * 0.05 * Math.sin(bt * 5), roll: Math.sin(bt * 0.8) * 0.012 + sp * Math.sin((M.gait || 0) * 2) * 0.025 });
    const O = W0(0, 0, 0), dirW = (u, v, h) => sub3(W0(u, v, h), O);
    return { hd, cf, sf, B, W0, dirW, br, rise, st, bt, fw: [cf, sf] };
  }
  /* the tail: from the body's rear up and over to the eye, which hangs where its own aim (M.tailA) puts it; rearing
     back to wind up, reaching out when it fires, sagging when it reels or dies */
  function tailPose(P, M, me) { const W0 = P.W0, ta = M.tailA == null ? P.hd : M.tailA, rear = M.rear || 0, reach = M.reach || 0, drop = M.tailDrop || 0, rl = M.reel || 0, bt = P.bt;
    const sway = [Math.sin(bt * 0.9) * 0.12 + rl * Math.sin(bt * 4.3) * 0.3, Math.cos(bt * 0.7) * 0.1, Math.sin(bt * 1.3) * 0.08];
    const E0 = W0(-0.85 - rear * 0.75, 0, 3.4 + rear * 0.5 - drop * 2.6 - rl * 0.55 + P.br * 2), out = 0.75 + reach * 0.85 - rear * 0.55 - drop * 0.5;
    const E = add3([E0[0] + Math.cos(ta) * out, E0[1] + Math.sin(ta) * out, E0[2]], sway);
    const T0 = W0(-1.38, 0, 0.82), C1 = W0(-2.55 - rear * 0.3, 0, 1.45 - drop * 0.6), C2w = W0(-2.25 - rear * 0.45, 0, 0), C2 = [(C2w[0] + E[0]) / 2, (C2w[1] + E[1]) / 2, E[2] + 0.8 - drop * 0.4];
    const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6, a = 1 - t; pts.push([0, 1, 2].map(k => a * a * a * T0[k] + 3 * a * a * t * C1[k] + 3 * a * t * t * C2[k] + t * t * t * E[k])); }
    // where it looks: a point set by the act, the pet when it is tethered, else the floor ahead along its aim
    let L; if (M.look) L = norm3(sub3(M.look, E)); else { const R = M.ry; if (R && (R.st === 'tether' || R.st === 'fire')) { const d = R.broken || R.locked ? Math.min(R.cut, 7) : (me ? Math.hypot(me.x - E[0], me.y - E[1]) : 6); L = norm3([Math.cos(R.dir) * d, Math.sin(R.dir) * d, 0.6 - E[2]]); } else L = norm3([Math.cos(ta) * 6, Math.sin(ta) * 6, 0.4 - E[2]]); }
    return { pts, E, L, W: [0.78, 0.72, 0.66, 0.6, 0.55, 0.5, 0.46] }; }
  // the legs: three a side, hip under the plates, knee up and out, a black-tipped foot on the floor
  function legPose(P, M, sd, k) { const sp = M.spdK || 0, st = P.st, rise = P.rise, ph = (M.gait || 0) + ((k % 2 === 0) !== (sd > 0) ? Math.PI : 0) + k * 0.3, lift = Math.max(0, Math.sin(ph)) * (0.38 * sp + 0.05) + (k === 1 ? Math.max(0, Math.sin(P.bt * 0.9 + sd)) * 0.04 : 0), gu = Math.cos(ph) * (0.36 * sp + 0.04), fold = (1 - rise) * 0.8 + st * 0.5;
    const hip = P.W0(0.55 - k * 0.6, sd * 1.0, 0.5), knee = P.W0(0.72 - k * 0.72 + gu * 0.5, sd * (1.5 + st * 0.25), 0.98 + lift * 0.5 - fold * 0.55), foot = P.W0(0.98 - k * 0.98 + gu * 1.4, sd * (2.0 - fold * 0.5 + st * 0.35), lift - P.W0(0, 0, 0)[2]);
    return { hip, knee, foot }; }
  /* the claws: an arm from the front corner to a broad shield claw. At rest held low before it, inner (black) faces turned
     in; winding up, raised and spread with the black faces turned out at the pet; slammed flat onto the floor */
  function clawPose(P, M, sd) { const W0 = P.W0, dirW = P.dirW, rs = M.raise || 0, sl = M.slam || 0, bt = P.bt, tw = (M.twitch || 0) * Math.sin(bt * 30) * 0.05;
    const sh = W0(1.32, sd * 0.58, 0.62), el = W0(1.9 + sl * 0.15, sd * (1.3 + rs * 0.35), 0.95 + rs * 0.95 - sl * 0.4), pc = W0(2.45 - rs * 0.3 + sl * 0.3, sd * (0.92 + rs * 0.5 - sl * 0.1), 0.78 + rs * 1.75 - sl * 0.58 + Math.sin(bt * 1.4 + sd) * 0.03);
    const Fw = norm3(dirW(1, 0, 0)), Up = [0, 0, 1], Vin = norm3(dirW(0, -sd, 0));
    const nin = norm3(add3(add3(add3(mul3(Vin, 0.5 * (1 - rs)), Up, -0.85 * (1 - rs) - sl * 0.5), Fw, rs * 0.9), Up, rs * 0.5));
    let d = norm3(add3(add3(Fw, Vin, 0.2 * (1 - rs) - sd * 0 ), mul3(dirW(0, sd, 0), 1), rs * 0.9)); d = norm3(sub3(d, mul3(nin, dot3(d, nin))));
    const up = norm3(cross3(nin, d)), upU = up[2] < 0 ? mul3(up, -1) : up;
    const open = clamp(0.12 + rs * 0.75 + tw + Math.sin(bt * 1.9 + sd) * 0.04 - sl * 0.1, 0, 1);
    return { sh, el, pc, d, up: upU, nin, open, s: 1.0 }; }
  function bodyParts(m, M, eyeShut) { const P = pose(m, M), out = [hit('bd', P.W0(0, 0, 0.8), 2.0, m)]; for (const sd of [-1, 1]) out.push(hit(sd < 0 ? 'cl' : 'cr', clawPose(P, M, sd).pc, 0.8, m));
    const Tl = tailPose(P, M, null); out.push(hit('tl', Tl.pts[3], 0.7, m)); if (eyeShut) out.push(hit('ey', Tl.E, 0.8, m)); return out; }

  /* ---------- painting Eshra ---------- */
  // a material's tones, washed toward pale stone as it calcifies in death
  function ramp(R, calc) { if (!(calc > 0.01)) return R; const k = calc * 0.55; return { hi: mix(R.hi, '#FBF8EE', k), col: mix(R.col, CALCITE_HI, k), sh: mix(R.sh, CALCITE, k), sh2: mix(R.sh2, CALCITE_D, k) }; }
  function toneOf(R, lit) { return lit > 0.62 ? R.hi : lit > 0.22 ? R.col : lit > -0.12 ? R.sh : R.sh2; }
  /* one flat face of a solid: filled by how the light lands on it, a hot edge along its lit rim, inked */
  function face(c, S, n, R, lw, o) { o = o || {}; const lit = dot3(n, LIGHT), col = o.fill || toneOf(R, lit);
    c.beginPath(); S.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = col; c.fill();
    if (K.Q.flash > 0) { c.fillStyle = 'rgba(255,244,236,.18)'; c.fill(); }
    if (o.inner) { c.save(); c.clip(); o.inner(c, S); c.restore(); c.beginPath(); S.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); }
    c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke();
    if (lit > 0.3 && o.rim !== false) { const ce = S.reduce((q, p) => [q[0] + p[0] / S.length, q[1] + p[1] / S.length], [0, 0]); c.strokeStyle = rgba('#FFFFFF', 0.55); c.lineWidth = Math.max(1, lw * 0.6); c.beginPath();
      for (let i = 0; i < S.length; i++) { const a = S[i], b = S[(i + 1) % S.length], mx = (a[0] + b[0]) / 2 - ce[0], my = (a[1] + b[1]) / 2 - ce[1], ml = Math.hypot(mx, my) || 1; if ((mx * LSCR[0] + my * LSCR[1]) / ml < 0.45) continue; const ia = [lerp(a[0], ce[0], 0.1), lerp(a[1], ce[1], 0.1)], ib = [lerp(b[0], ce[0], 0.1), lerp(b[1], ce[1], 0.1)]; c.moveTo(ia[0], ia[1]); c.lineTo(ib[0], ib[1]); } c.stroke(); } }
  /* a frustum (a bevelled box): its bottom rectangle and a smaller top one, the visible faces drawn; returns the top's corners */
  function frustum(c, pr, W, u0, u1, w, h0, h1, bu, bw, R, lw, o) { o = o || {};
    const B = [W(u1, w, h0), W(u1, -w, h0), W(u0, -w, h0), W(u0, w, h0)], Tp = [W(u1 - bu, w - bw, h1), W(u1 - bu, -(w - bw), h1), W(u0 + bu, -(w - bw), h1), W(u0 + bu, w - bw, h1)];
    const cen = lerp3(lerp3(B[0], B[2], 0.5), lerp3(Tp[0], Tp[2], 0.5), 0.5), faces = [{ pts: Tp, top: true }];
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; faces.push({ pts: [B[i], B[j], Tp[j], Tp[i]] }); }
    faces.forEach(f => { let n = norm3(cross3(sub3(f.pts[1], f.pts[0]), sub3(f.pts[2], f.pts[0]))); const ce = lerp3(f.pts[0], f.pts[2], 0.5); if (dot3(n, sub3(ce, cen)) < 0) n = mul3(n, -1); f.n = n; });
    faces.filter(f => dot3(f.n, VIEW) > 0.01).forEach(f => face(c, f.pts.map(pr), f.n, R, lw, f.top ? { inner: o.topInner && (g => o.topInner(g, Tp)) } : {}));
    return Tp; }
  function drawEshra(c, FX, m, X, Y, T, t) {
    const M = FX.mem || {}, P = pose(m, M), P3 = TN.cam(X, Y, T, m), pr = w => P3(w[0], w[1], w[2]), lw = Math.max(1.3, T * 0.055), parts = [], calc = M.calc || 0;
    const CR = ramp(CALR, calc), KR = ramp(BLKR, calc * 0.7), fw = P.fw, at = (p, du) => [p[0] + fw[0] * (du || 0), p[1] + fw[1] * (du || 0), p[2]];
    // its shadow on the flagstones
    { const g0 = P3(P.B.x - fw[0] * 0.4, P.B.y - fw[1] * 0.4, 0); K.shade(c, g0[0] + T * 0.2, g0[1] + T * 0.3, T * 3.6, T * 2.1, 0.5, '#1A1814'); }
    const Tl = tailPose(P, M, FX.me);
    // the black core under the plates, then the plates themselves, front to back
    frustum(c, pr, P.W0, -1.45, 1.35, 0.9, 0.18, 0.6, 0.06, 0.08, KR, lw);
    PLATES.forEach(([u0, u1, w], k) => { const rip = Math.sin(P.bt * 1.6 - k * 0.7) * 0.03, h1 = (k ? 1.02 : 0.9) + rip;
      parts.push({ at: P.W0((u0 + u1) / 2, 0, 0.75), draw: () => frustum(c, pr, P.W0, u0, u1, w, 0.48, h1, 0.1, 0.2, CR, lw, { topInner: (g, Tp) => plateDetail(g, pr, Tp, k, M, T, lw) }) }); });
    for (const sd of [-1, 1]) {
      for (let k = 0; k < 3; k++) { const L = legPose(P, M, sd, k); parts.push({ at: at([L.knee[0], L.knee[1], 0.6], -0.2), draw: () => drawLeg(c, pr, T, lw, L, CR, KR) }); }
      const Q = clawPose(P, M, sd); parts.push({ at: at(Q.pc, 0.2), draw: () => drawClaw(c, pr, T, lw, Q, CR, KR) });
    }
    for (let i = 0; i < 6; i++) parts.push({ at: lerp3(Tl.pts[i], Tl.pts[i + 1], 0.5), draw: () => drawTailSeg(c, pr, T, lw, Tl, i, CR, KR) });
    parts.push({ at: add3(Tl.E, [0, 0.4, 0.2]), draw: () => drawEye(c, P3, T, lw, M, Tl, CR, m, t) });
    sorted(parts).forEach(p => p.draw());
    // reeling: little red-hot stars round the eye
    if ((M.reel || 0) > 0.4 && m.stunT > 0) { const q = P3(Tl.E[0], Tl.E[1], Tl.E[2] + 1.0), bt = M.bt || t; for (let i = 0; i < 5; i++) { const a = bt * 3.4 + i * TAU / 5; TN.twinkle(c, q[0] + Math.cos(a) * T * 1.2, q[1] + Math.sin(a) * T * 0.3, T * (i % 2 ? 0.22 : 0.16), i % 2 ? '#FFFFFF' : HOT, 0.95); } } }
  /* a dorsal plate's top: a carved closed eye across it (the many lids; at half health they crack open, red), ochre dust in
     its seams and calcite crust nodules */
  function plateDetail(g, pr, Tp, k, M, T, lw) { const at = (s, q) => { const b = lerp3(Tp[3], Tp[2], q), f = lerp3(Tp[0], Tp[1], q); return pr(lerp3(b, f, s)); };
    const R = mulberry32(400 + k * 17), oe = M.plEyes || 0, open = oe * (0.5 + 0.5 * Math.sin((M.bt || 0) * 2.2 + k * 1.3));
    // ochre dust settled along the back edge, nodules of crust
    g.fillStyle = rgba(OCHRE, 0.32); for (let i = 0; i < 14; i++) { const p = at(R() * 0.25, R()); g.beginPath(); g.arc(p[0], p[1], T * (0.03 + R() * 0.05), 0, TAU); g.fill(); }
    for (let i = 0; i < 4; i++) { const p = at(0.2 + R() * 0.6, 0.1 + R() * 0.8), s = T * (0.04 + R() * 0.04); g.fillStyle = rgba(CALCITE_D, 0.8); g.beginPath(); g.arc(p[0], p[1] + s * 0.3, s, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(p[0] - s * 0.3, p[1] - s * 0.3, s * 0.45, 0, TAU); g.fill(); }
    if (k === 0) return;
    const up = [], lo = []; for (let i = 0; i <= 8; i++) { const q = 0.24 + i / 8 * 0.52, b = Math.sin(i / 8 * Math.PI); up.push(at(0.5 + 0.2 * b, q)); lo.push(at(0.5 - (0.06 + open * 0.16) * b, q)); }
    if (open > 0.05) { g.beginPath(); up.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = lo.length - 1; i >= 0; i--) g.lineTo(lo[i][0], lo[i][1]); g.closePath(); g.fillStyle = EYE_D; g.fill(); g.save(); g.clip(); const m2 = at(0.5, 0.5); g.fillStyle = rgba(RED, 0.5 + open * 0.5); g.beginPath(); g.arc(m2[0], m2[1], T * 0.1, 0, TAU); g.fill(); g.restore(); }
    g.lineCap = 'round'; g.strokeStyle = rgba('#3A342A', 0.75); g.lineWidth = Math.max(1, lw * 0.75); g.beginPath(); up.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
    g.strokeStyle = rgba('#FFFFFF', 0.5); g.lineWidth = Math.max(1, lw * 0.4); g.beginPath(); up.forEach((p, i) => { const q = [p[0], p[1] + T * 0.03]; i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke();
    g.strokeStyle = rgba('#3A342A', 0.55); g.lineWidth = Math.max(1, lw * 0.5); for (const q of [0.36, 0.5, 0.64]) { const a = at(0.5 + 0.17, q), b = at(0.78, q + (q - 0.5) * 0.3); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
  // a leg: two calcite segments, black joint knobs, a black pointed foot
  function drawLeg(c, pr, T, lw, L, CR, KR) { const h = pr(L.hip), k = pr(L.knee), f = pr(L.foot), an = lerp3(L.knee, L.foot, 0.72), a2 = pr(an);
    tubeLite(c, [h, pr(lerp3(L.hip, L.knee, 0.5)), k], u => T * (0.34 - u * 0.06), Object.assign({ lw, force: true }, tubeS(CR)));
    tubeLite(c, [k, pr(lerp3(L.knee, an, 0.5)), a2], u => T * (0.27 - u * 0.07), Object.assign({ lw, force: true }, tubeS(CR)));
    tubeLite(c, [a2, pr(lerp3(an, L.foot, 0.5)), f], u => T * (0.18 * (1 - u) + 0.04), Object.assign({ lw, force: true }, tubeS(KR)));
    for (const [p, r] of [[k, 0.17], [a2, 0.12]]) TN.shape(c, TN.ell(p[0], p[1], T * r, T * r * 0.9), Object.assign({ lw, r: T * r, d1: 0.12, d2: 0.24, spec: 0.5, specAt: [p[0] - T * r * 0.35, p[1] - T * r * 0.4], specR: 0.25, force: true }, tubeS(KR))); }
  /* a shield claw: the arm, and two jaws (each a slab of calcite with a black inner face), the upper hinged open */
  function drawClaw(c, pr, T, lw, Q, CR, KR) {
    tubeLite(c, [pr(Q.sh), pr(lerp3(Q.sh, Q.el, 0.5)), pr(Q.el)], u => T * (0.36 - u * 0.04), Object.assign({ lw, force: true }, tubeS(CR)));
    tubeLite(c, [pr(Q.el), pr(lerp3(Q.el, Q.pc, 0.5)), pr(Q.pc)], u => T * (0.32 + u * 0.06), Object.assign({ lw, force: true }, tubeS(CR)));
    const el = pr(Q.el); TN.shape(c, TN.ell(el[0], el[1], T * 0.2, T * 0.18), Object.assign({ lw, r: T * 0.2, spec: 0.5, specAt: [el[0] - T * 0.07, el[1] - T * 0.08], specR: 0.25, force: true }, tubeS(KR)));
    const th = 0.12, jaw = (pts, fac, rot, sc) => { const cr = Math.cos(rot), sr = Math.sin(rot), w = (a, e, k) => { const a2 = (a * cr - e * sr) * sc, e2 = (a * sr + e * cr) * sc; return add3(add3(add3(Q.pc, Q.d, a2), Q.up, e2), Q.nin, k * th); };
      const O = pts.map(([a, e]) => w(a, e, -1)), I = pts.map(([a, e]) => w(a, e, 1)), outN = mul3(Q.nin, -1), outV = dot3(outN, VIEW) > 0;
      const front = outV ? O : I, back = outV ? I : O, fN = outV ? outN : Q.nin;
      // the far face (only its edge shows), the rim, then the near face: calcite outside, black inside
      const rims = []; for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length, q = [O[i], O[j], I[j], I[i]]; let n = norm3(cross3(sub3(q[1], q[0]), sub3(q[3], q[0]))); const mid = lerp3(O[i], O[j], 0.5), cen = lerp3(O[0], O[2], 0.5); if (dot3(n, sub3(mid, cen)) < 0) n = mul3(n, -1); if (dot3(n, VIEW) > 0) rims.push({ q, n }); }
      rims.forEach(r => face(c, r.q.map(pr), r.n, CR, lw * 0.8, { rim: false }));
      if (outV) { face(c, front.map(pr), fN, CR, lw, {}); const F2 = fac.map(([a, e]) => w(a, e, -1.05)); face(c, F2.map(pr), norm3(add3(fN, Q.up, 0.7)), CR, Math.max(1, lw * 0.6), {}); }
      else { const S = front.map(pr); face(c, S, fN, KR, lw, { rim: false, fill: dot3(fN, LIGHT) > 0.3 ? '#3A3A42' : BLACK, inner: g => { const F2 = fac.map(([a, e]) => pr(w(a, e, 1.05))); g.beginPath(); F2.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = '#141416'; g.fill(); g.strokeStyle = rgba(CALCITE, 0.45); g.lineWidth = Math.max(1, lw * 0.7); g.beginPath(); S.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke(); } }); } };
    jaw(JAW_L, JAW_LF, -Q.open * 0.28, 1.3); jaw(JAW_U, JAW_UF, Q.open * 0.85, 1.4);
    const pc = pr(Q.pc); TN.shape(c, TN.ell(pc[0], pc[1], T * 0.22, T * 0.2), Object.assign({ lw, r: T * 0.22, spec: 0.5, specAt: [pc[0] - T * 0.08, pc[1] - T * 0.08], specR: 0.25, force: true }, tubeS(KR))); }
  // a tail segment: a calcite ring tapering to the next, a dorsal keel catching the light, a black joint before it
  function drawTailSeg(c, pr, T, lw, Tl, i, CR, KR) { const a = Tl.pts[i], b = Tl.pts[i + 1], w0 = Tl.W[i], w1 = Tl.W[i + 1], s0 = lerp3(a, b, 0.1), s1 = lerp3(a, b, 0.92);
    if (i > 0) { const j = pr(a); TN.shape(c, TN.ell(j[0], j[1], T * w0 * 0.42, T * w0 * 0.38), Object.assign({ lw, r: T * w0 * 0.42, d1: 0.12, d2: 0.24, spec: false, force: true }, tubeS(KR))); }
    const S = [pr(s0), pr(lerp3(s0, s1, 0.5)), pr(s1)]; tubeLite(c, S, u => T * (w0 * (1 - u) + w1 * 0.9 * u), Object.assign({ lw, force: true }, tubeS(CR)));
    // the keel: a lit ridge along its top, and a seam ring round its far end
    const k0 = pr(add3(s0, [0, 0, w0 * 0.3])), k1 = pr(add3(s1, [0, 0, w1 * 0.28])); c.strokeStyle = rgba('#FFFFFF', 0.6); c.lineWidth = Math.max(1, T * 0.05); c.lineCap = 'round'; c.beginPath(); c.moveTo(k0[0], k0[1]); c.lineTo(k1[0], k1[1]); c.stroke();
    const e = S[2], dx = S[2][0] - S[1][0], dy = S[2][1] - S[1][1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, hw = T * w1 * 0.45; c.strokeStyle = rgba('#3A342A', 0.6); c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(e[0] + nx * hw - dx / dl * T * 0.06, e[1] + ny * hw - dy / dl * T * 0.06); c.quadraticCurveTo(e[0] - dx / dl * T * 0.16, e[1] - dy / dl * T * 0.16, e[0] - nx * hw - dx / dl * T * 0.06, e[1] - ny * hw - dy / dl * T * 0.06); c.stroke(); }
  /* the eye: a calcite bulb, a deep socket, the red eye in it (a hot highlight, a black slit that narrows as it locks on)
     and three faceted stone lids round it like an aperture, each opening on its own; foreshortened as it turns away */
  function drawEye(c, P3, T, lw, M, Tl, CR, m, t) { const E = Tl.E, L = Tl.L, pr = w => P3(w[0], w[1], w[2]), bt = M.bt || t, calc = M.calc || 0, gl = M.glare || 0, fire = M.fire || 0;
    const lids = M.lidK || [M.lidAll == null ? 0.55 : M.lidAll, M.lidAll == null ? 0.55 : M.lidAll, M.lidAll == null ? 0.55 : M.lidAll], openAvg = (lids[0] + lids[1] + lids[2]) / 3;
    // the bulb at the tail's end
    TN.ellipsoid(c, P3, M.hd || 0, add3(E, L, -0.12), [0.62, 0.56, 0.42], Object.assign({ T, lw: lw * 1.1, d1: 0.1, d2: 0.22, spec: 0.35, specR: 0.18, force: true }, tubeS(CR)));
    const S = pr(add3(E, L, 0.32)), r = T * 0.68, lp = pr(add3(E, L, 1)), e0 = pr(E), lx = (lp[0] - e0[0]) / T, ly = (lp[1] - e0[1]) / T, ll = Math.hypot(lx, ly) || 1, phi = Math.atan2(ly, lx);
    const fk = clamp((dot3(L, VIEW) + 0.75) / 1.1, 0.5, 1), red = calc > 0.01 ? mix(RED, '#9A948A', calc) : RED;
    // the red light it casts, strongest as it charges and fires
    if (openAvg > 0.05 && calc < 0.9) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, (0.16 + gl * 0.45 + fire * 0.4) * openAvg) * (1 - calc); blitSized(c, glowSprite(RED_HI), S[0] - r * 3.2, S[1] - r * 3.2, r * 6.4, r * 6.4); c.restore(); }
    c.save(); c.translate(S[0], S[1]); c.rotate(phi); c.scale(fk, 1); c.rotate(-phi);
    // the socket's dark, and the eye
    c.beginPath(); c.arc(0, 0, r * 1.12, 0, TAU); c.fillStyle = '#120C0C'; c.fill();
    const ix = lx / ll * Math.min(1, ll) * r * 0.3 + Math.sin(bt * 0.7) * r * 0.03, iy = ly / ll * Math.min(1, ll) * r * 0.3, hot = gl * 0.6 + fire * 0.4 + (M.eyeHit || 0) * 0.3;
    const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r); g.addColorStop(0, mix(red, HOT, 0.35 + hot * 0.5)); g.addColorStop(0.45, mix(red, RED_HI, hot * 0.5)); g.addColorStop(0.85, mix(red, EYE_D, 0.45)); g.addColorStop(1, EYE_D);
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = g; c.fill();
    // veins of darker red toward the rim
    c.strokeStyle = rgba(EYE_D, 0.55); c.lineWidth = Math.max(1, r * 0.04); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); c.quadraticCurveTo(Math.cos(a + 0.2) * r * 0.75, Math.sin(a + 0.2) * r * 0.75, Math.cos(a + 0.05) * r * 0.6, Math.sin(a + 0.05) * r * 0.6); c.stroke(); }
    // the iris ring and the slit pupil
    c.strokeStyle = rgba(RED_D, 0.9); c.lineWidth = Math.max(1, r * 0.07); c.beginPath(); c.arc(ix, iy, r * 0.5, 0, TAU); c.stroke();
    if (M.reel > 0.4 && m && m.stunT > 0) { c.strokeStyle = '#1A0A0A'; c.lineWidth = Math.max(1.2, r * 0.1); c.beginPath(); for (let i = 0; i <= 30; i++) { const a = i / 30 * TAU * 2.2 + bt * 7, rr = r * (0.05 + i / 30 * 0.42); i ? c.lineTo(ix + Math.cos(a) * rr, iy + Math.sin(a) * rr) : c.moveTo(ix + Math.cos(a) * rr, iy + Math.sin(a) * rr); } c.stroke(); }
    else { const pw = r * (0.2 - gl * 0.13 + (M.eyeHit || 0) * 0.1); c.fillStyle = '#100606'; c.beginPath(); c.ellipse(ix, iy, Math.max(1, pw), r * 0.62, 0, 0, TAU); c.fill(); if (gl > 0.3) { c.fillStyle = rgba(HOT, gl * 0.8); c.beginPath(); c.ellipse(ix, iy, Math.max(0.6, pw * 0.3), r * 0.5, 0, 0, TAU); c.fill(); } }
    // the hot highlight
    c.fillStyle = rgba('#FFFFFF', 0.9 - calc * 0.6); c.beginPath(); c.ellipse(-r * 0.38, -r * 0.42, r * 0.2, r * 0.12, -0.6, 0, TAU); c.fill(); c.beginPath(); c.arc(r * 0.3, r * 0.32, r * 0.06, 0, TAU); c.fill();
    if (fire > 0.05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = fire; blitSized(c, glowSprite(HOT), -r * 1.1, -r * 1.1, r * 2.2, r * 2.2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    // the three lids: wedges of stone that meet at the centre when shut and draw back to a frame when open
    const R0 = r * 1.2, rot = Math.sin(bt * 0.35) * 0.08;
    for (let i = 0; i < 3; i++) { const lk = clamp(lids[i], 0, 1), th = rot + i * TAU / 3 - Math.PI / 2 + lk * 0.3, hw = Math.PI / 3 + 0.02, Ro = R0 * (1 + 0.1 * lk), ad = r * 0.86 * lk;
      const ax = Math.cos(th) * ad, ay = Math.sin(th) * ad, arc = a0 => { const pts = []; for (let k = 0; k <= 6; k++) { const a = a0[0] + (a0[1] - a0[0]) * k / 6; pts.push([Math.cos(a) * Ro, Math.sin(a) * Ro]); } return pts; };
      const lft = arc([th - hw, th]), rgt = arc([th, th + hw]), mid = [Math.cos(th) * Ro, Math.sin(th) * Ro];
      const facet = (pts, dirA) => { const lit = Math.cos(dirA) * LSCR[0] + Math.sin(dirA) * LSCR[1], col = toneOf(CR, lit * 0.9 + 0.15); c.beginPath(); c.moveTo(ax, ay); pts.forEach(p => c.lineTo(p[0], p[1])); c.closePath(); c.fillStyle = col; c.fill(); if (K.Q.flash > 0) { c.fillStyle = 'rgba(255,244,236,.18)'; c.fill(); } return lit; };
      // the lid's shadow on the eye, then its two facets either side of its ridge
      if (lk > 0.1) { c.beginPath(); c.moveTo(ax * 0.9, ay * 0.9); lft.concat(rgt.slice(1)).forEach(p => c.lineTo(p[0] * 0.93, p[1] * 0.93)); c.closePath(); c.fillStyle = 'rgba(20,8,8,.35)'; c.fill(); }
      const l1 = facet(lft, th - hw / 2), l2 = facet(rgt, th + hw / 2);
      c.beginPath(); c.moveTo(ax, ay); lft.concat(rgt.slice(1)).forEach(p => c.lineTo(p[0], p[1])); c.closePath(); c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke();
      c.strokeStyle = rgba('#3A342A', 0.6); c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(ax, ay); c.lineTo(mid[0], mid[1]); c.stroke();
      // a hot edge along the lit facet's outer rim
      const lit = l1 > l2 ? lft : rgt; if (Math.max(l1, l2) > 0.3) { c.strokeStyle = rgba('#FFFFFF', 0.6); c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); lit.forEach((p, k) => k ? c.lineTo(p[0] * 0.94, p[1] * 0.94) : c.moveTo(p[0] * 0.94, p[1] * 0.94)); c.stroke(); } }
    c.strokeStyle = INK; c.lineWidth = lw * 1.2; c.beginPath(); c.arc(0, 0, R0 * 1.02, 0, TAU); c.stroke();
    c.restore(); }

  /* ---------- the Ossuary: the floor and the vault ---------- */
  function paintOssuary(c, A2) { const R = A2.R, rnd = A2.rnd, C = (A2.FX && A2.FX.C) || { x: 28, y: 28, R };
    let g = c.createRadialGradient(0, 0, R - 0.5, 0, 0, R + 1.5); g.addColorStop(0, '#2A2824'); g.addColorStop(1, 'rgba(20,18,16,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.clip();
    c.fillStyle = '#8E8670'; c.fillRect(-R, -R, R * 2, R * 2);
    // the flagstones: 2 m squares of calcite, a few split, each its own shade, a lit upper edge and a dark lower one
    const FL = ['#C9C1AA', '#BFB7A0', '#D2CAB3', '#B8B09A', '#C4BCA4'];
    for (let y = -R; y < R; y += 2) for (let x = -R; x < R; x += 2) { const tile = (tx, ty, s) => { c.fillStyle = FL[Math.floor(rnd() * FL.length)]; c.fillRect(tx + 0.06, ty + 0.06, s - 0.12, s - 0.12); c.fillStyle = 'rgba(255,252,240,.16)'; c.fillRect(tx + 0.06, ty + 0.06, s - 0.12, 0.1); c.fillStyle = 'rgba(60,50,30,.2)'; c.fillRect(tx + 0.06, ty + s - 0.16, s - 0.12, 0.1); };
      if (rnd() < 0.15) { tile(x, y, 1); tile(x + 1, y, 1); tile(x, y + 1, 1); tile(x + 1, y + 1, 1); } else tile(x, y, 2);
      if (rnd() < 0.18) { let px = x + 0.3 + rnd() * 1.4, py = y + 0.3 + rnd() * 1.4; c.strokeStyle = 'rgba(70,60,40,.4)'; c.lineWidth = 0.035; c.beginPath(); c.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (rnd() - 0.5) * 0.7; py += (rnd() - 0.5) * 0.7; c.lineTo(px, py); } c.stroke(); } }
    // ochre dust drifted over it
    for (let i = 0; i < 40; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.6 + rnd() * 1.8; g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(OCHRE, 0.22)); g.addColorStop(1, rgba(OCHRE, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 1800; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R; c.fillStyle = rnd() < 0.5 ? `rgba(250,246,232,${0.08 + rnd() * 0.12})` : `rgba(110,96,70,${0.08 + rnd() * 0.14})`; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 0.04 + rnd() * 0.05, 0.04 + rnd() * 0.05); }
    // the heart of the ossuary: a black basalt ring inlaid with calcite, a great closed eye carved in the middle
    c.strokeStyle = rgba(BLACK, 0.45); c.lineWidth = 0.22; c.beginPath(); c.arc(0, 0, 3.4, 0, TAU); c.stroke(); c.strokeStyle = rgba(OCHRE, 0.8); c.lineWidth = 0.06; c.beginPath(); c.arc(0, 0, 3.05, 0, TAU); c.stroke();
    for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; c.strokeStyle = rgba(CALCITE_HI, 0.75); c.lineWidth = k % 3 ? 0.04 : 0.09; c.beginPath(); c.moveTo(Math.cos(a) * 3.25, Math.sin(a) * 3.25); c.lineTo(Math.cos(a) * 3.55, Math.sin(a) * 3.55); c.stroke(); }
    c.fillStyle = 'rgba(36,36,40,.16)'; c.beginPath(); c.ellipse(0, 0, 2.3, 1.0, 0, 0, TAU); c.fill(); BAS.closedEye(c, 0, -0.2, 2.6, rgba(BLACK, 0.4), 0.07);
    // the pillars' footprints: plinth shadows, ochre dust heaped round them
    for (const p of A.pillars(C)) { const x = p.x + 1 - C.x, y = p.y + 1 - C.y; c.fillStyle = 'rgba(30,26,20,.35)'; c.fillRect(x - 1.35, y - 1.2, 2.9, 2.75); g = c.createRadialGradient(x, y, 1.2, x, y, 2.6); g.addColorStop(0, rgba(OCHRE, 0.35)); g.addColorStop(1, rgba(OCHRE, 0)); c.fillStyle = g; c.fillRect(x - 2.6, y - 2.6, 5.2, 5.2); }
    // old claw tracks round the heart
    for (let i = 0; i < 30; i++) { const a = rnd() * TAU, r0 = 3.9 + rnd() * 1.6, x = Math.cos(a) * r0, y = Math.sin(a) * r0; c.fillStyle = 'rgba(70,60,40,.22)'; c.beginPath(); c.ellipse(x, y, 0.09, 0.05, a, 0, TAU); c.fill(); }
    // the light: brighter to the upper left, a shade to the lower right
    g = c.createRadialGradient(1.5, 1.5, R - 4, 1.5, 1.5, R + 1); g.addColorStop(0, 'rgba(30,24,16,0)'); g.addColorStop(1, 'rgba(30,24,16,.38)'); c.fillStyle = g; c.fillRect(-R, -R, R * 2, R * 2);
    c.restore();
    // the rim: a black curb, an ochre line inside it
    c.strokeStyle = BLACK; c.lineWidth = 0.6; c.beginPath(); c.arc(0, 0, R - 0.1, 0, TAU); c.stroke(); c.strokeStyle = rgba(OCHRE_HI, 0.7); c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0, R - 0.55, 0, TAU); c.stroke(); }
  /* the vault beyond: leaning black walls, tall narrow pillars, red light falling from slits, beasts curled round eye stones */
  function paintVault(c, W, H, T) { const R = mulberry32(919);
    let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0C0B0D'); g.addColorStop(0.45, '#17161A'); g.addColorStop(1, '#242428'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // the walls lean inward over it
    c.fillStyle = '#1C1B20'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, 0); c.lineTo(W * 0.2, 0); c.lineTo(W * 0.12, H); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W, H); c.lineTo(W, 0); c.lineTo(W * 0.8, 0); c.lineTo(W * 0.88, H); c.closePath(); c.fill();
    // red light from the narrow ceiling slits, falling in soft unoutlined shafts
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const x = W * (0.12 + i * 0.15 + (R() - 0.5) * 0.04), w = W * 0.025; g = c.createLinearGradient(0, 0, 0, H * 0.7); g.addColorStop(0, rgba(RED, 0.28)); g.addColorStop(1, rgba(RED, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(x - w * 0.3, 0); c.lineTo(x + w * 0.3, 0); c.lineTo(x + w * 2, H * 0.7); c.lineTo(x - w * 1.4, H * 0.7); c.closePath(); c.fill(); c.fillStyle = rgba(RED_HI, 0.5); c.fillRect(x - w * 0.3, 0, w * 0.6, 3); } c.restore();
    // the colonnade: tall narrow square pillars, calcite catching the light on their left faces
    for (let i = 0; i < 11; i++) { const x = W * (i + 0.5) / 11 + (R() - 0.5) * 8, w = 10 + R() * 6, top = H * (0.05 + R() * 0.05); c.fillStyle = '#2C2B30'; c.fillRect(x - w / 2, top, w, H - top); c.fillStyle = rgba(CALCITE_D, 0.22); c.fillRect(x - w / 2, top, 2.5, H - top); c.fillStyle = rgba(OCHRE, 0.25); c.fillRect(x - w / 2 - 2, H * 0.32, w + 4, 3); }
    // stone beasts curled round eye stones on the plinths along the wall, dim
    c.save(); c.globalAlpha = 0.55; for (let i = 0; i < 4; i++) BAS.beast(c, W * (0.18 + i * 0.22), H * 0.5, Math.max(12, T * 0.8), 1.2, i); c.restore();
    c.fillStyle = OCHRE_HI; for (let i = 0; i < 50; i++) { c.globalAlpha = 0.08 + R() * 0.25; c.beginPath(); c.arc(R() * W, R() * H, 0.5 + R() * 1.1, 0, TAU); c.fill(); } c.globalAlpha = 1; }

  /* ---------- on the floor: the ray's lane, the marks, scorches and claw dents ---------- */
  function softLine(c, x0, y0, x1, y1, w, col, a) { c.save(); c.lineCap = 'round'; [[1.5, 0.05], [1.18, 0.08], [0.88, 0.12], [0.56, 0.16]].forEach(([k, al]) => { c.strokeStyle = rgba(col, Math.min(1, al * a)); c.lineWidth = Math.max(1, w * k); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }); c.restore(); }
  function softRing(c, X, Y, r, w, col, a) { if (r <= 0) return; c.save(); [[1.9, 0.06], [1.3, 0.1], [0.85, 0.16], [0.45, 0.24], [0.18, 0.4]].forEach(([k, al]) => { c.strokeStyle = rgba(col, Math.min(1, al * a)); c.lineWidth = Math.max(1, w * k); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke(); }); c.restore(); }
  function lab(c, X, Y, s, col, T, k) { c.save(); c.font = `900 ${Math.round(T * (k || 0.36))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(8,8,12,.82)'; c.lineJoin = 'round'; c.strokeText(s, X, Y); c.fillStyle = col || '#FFFFFF'; c.fillText(s, X, Y); c.restore(); }
  function drawOverlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !M.stat || !m) return; const sx = FX.sx, sy = FX.sy, pu = 0.5 + 0.5 * Math.sin(t * 9), P = pillars(FX);
    // claw dents and the scorched faces of pillars
    M.marks.forEach(k => { const a = clamp((k.life - k.t) / 2, 0, 1); c.save(); c.globalAlpha = a; K.shade(c, sx(k.x), sy(k.y), T * 1.0, T * 0.6, 0.4, '#2A2418'); c.restore(); });
    M.scorch.forEach(s => { const a = clamp((14 - s.t) / 4, 0, 1); c.save(); c.globalAlpha = a; K.shade(c, sx(s.x), sy(s.y), T * 1.1, T * 0.7, 0.55, '#1A0E0C'); if (s.t < 2) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - s.t / 2) * 0.6; blitSized(c, glowSprite(RED_HI), sx(s.x) - T, sy(s.y) - T, T * 2, T * 2); } c.restore(); });
    // the marked pillar: a red ring round its foot
    if (M.mk) { const Q = P[M.mk.i]; if (Q && !Q.gone) { const col = M.mk.st === 'marked' ? RED_HI : WARN; softRing(c, sx(Q.x), sy(Q.y + 0.2), T * 1.9, T * 0.35, col, 0.8 + 0.5 * pu); } }
    // the Witness Ray's lane: following the pet while the tether holds, frozen at the end, blazing as it fires
    const R = M.ry; if (R && (R.st === 'tether' || R.st === 'fire')) { const ca = Math.cos(R.dir), sa = Math.sin(R.dir), X0 = sx(R.ox), Y0 = sy(R.oy), X1 = sx(R.ox + ca * R.cut), Y1 = sy(R.oy + sa * R.cut), u = R.st === 'fire' ? 1 : clamp((R.age - R.t1) / R.tether, 0, 1);
      if (R.st === 'tether') { softLine(c, X0, Y0, X1, Y1, T * 1.6, WARN, (0.9 + 1.6 * u) * (R.locked ? 1.4 + 0.6 * pu : 1)); if (!R.broken) { c.save(); c.setLineDash([T * 0.4, T * 0.3]); c.lineDashOffset = -t * T * 3; c.strokeStyle = rgba('#FFFFFF', 0.25 + 0.4 * u); c.lineWidth = Math.max(1.5, T * 0.08); c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X1, Y1); c.stroke(); c.restore(); } }
      else { softLine(c, X0, Y0, X1, Y1, T * 2.0, WARN, 3.2); softLine(c, X0, Y0, X1, Y1, T * 0.6, '#FFE8DC', 2.4); }
      if (R.cutI >= 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 + 0.4 * u; blitSized(c, glowSprite(RED_HI), X1 - T * 1.2, Y1 - T * 1.2, T * 2.4, T * 2.4); c.restore(); } } }
  /* ---------- in the air: the tether, the ray, the mark over the pillar, labels ---------- */
  function drawAir(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M || !M.stat || !M.E) return; const sx = FX.sx, sy = FX.sy, me = FX.me, E = M.E, EX = sx(E[0]), EY = sy(E[1]) - E[2] * T, P = pillars(FX), pu = 0.5 + 0.5 * Math.sin(t * 10);
    const R = M.ry; if (R && !m.dead && (R.st === 'tether' || R.st === 'fire')) { const ca = Math.cos(R.dir), sa = Math.sin(R.dir), u = R.st === 'fire' ? 1 : clamp((R.age - R.t1) / R.tether, 0, 1), PX = sx(me.x), PY = sy(me.y) - T * 0.6;
      if (R.st === 'tether') {
        if (!R.broken) { // the tether: a red thread from eye to pet, beads running down it, a countdown over the pet
          c.save(); c.globalCompositeOperation = 'lighter'; softLine(c, EX, EY, PX, PY, T * 0.22, RED_HI, 2.2 + u * 2); c.restore(); c.strokeStyle = rgba(WARN, 0.85); c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); c.moveTo(EX, EY); c.lineTo(PX, PY); c.stroke();
          for (let k = 0; k < 5; k++) { const f = ((t * 1.4 + k / 5) % 1); TN.twinkle(c, lerp(EX, PX, f), lerp(EY, PY, f), T * 0.12, HOT, 0.9); }
          const left = Math.max(1, Math.ceil(R.tether - (R.age - R.t1) - 1e-6)); lab(c, PX, PY - T * 1.5, R.locked ? 'LOCKED' : String(left), R.locked ? WARN : '#FFFFFF', T, R.locked ? 0.42 : 0.7);
          if (!R.locked) lab(c, PX, PY - T * 2.2, 'HIDE BEHIND A PILLAR', '#FFE0D6', T, 0.28); }
        else { const X1 = sx(R.ox + ca * R.cut), Y1 = sy(R.oy + sa * R.cut) - T * 1.2; c.save(); c.globalAlpha = 0.6; c.setLineDash([T * 0.2, T * 0.25]); c.strokeStyle = WARN; c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); c.moveTo(EX, EY); c.lineTo(X1, Y1); c.stroke(); c.restore(); lab(c, X1, Y1 - T * 1.2, 'TETHER BROKEN', '#9CFFD8', T, 0.32); } }
      else { const k = clamp(1 - (R.age - R.t2) / R.fire, 0, 1), X1 = sx(R.ox + ca * R.cut), Y1 = sy(R.oy + sa * R.cut) - T * 0.6; // the ray itself
        c.save(); c.globalCompositeOperation = 'lighter'; softLine(c, EX, EY, X1, Y1, T * 1.5, WARN, 2.6 * k + 0.5); softLine(c, EX, EY, X1, Y1, T * 0.5, HOT, 2.4 * k); blitSized(c, glowSprite(HOT), X1 - T * 1.4, Y1 - T * 1.4, T * 2.8, T * 2.8); c.restore(); } }
    // the mark over the pillar: a red eye opening above it, and what is to come
    if (M.mk) { const Q = P[M.mk.i]; if (Q && !Q.gone) { const X = sx(Q.x), Y = sy(Q.y) - T * 5.6 - Math.sin(t * 2) * T * 0.15; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.3 * pu; blitSized(c, glowSprite(RED_HI), X - T * 1.3, Y - T * 1.3, T * 2.6, T * 2.6); c.restore();
      BAS.eyeStone(c, X, Y, T * 1.0, 0.7 + 0.3 * pu, Math.max(1.3, T * 0.05), { glow: true }); lab(c, X, Y - T * 0.85, M.mk.st === 'marked' ? 'MARKED' : M.mk.st === 'cracked' ? 'CRACKED · one more cycle' : 'FALLING', M.mk.st === 'marked' ? RED_HI : WARN, T, 0.3);
      if (M.mk.st !== 'marked' && Math.random() < 0.3) FX.H.part({ kind: 'shard', x: Q.x + FX.rnd(-0.8, 0.8), y: Q.y - FX.rnd(1, 4), vx: FX.rnd(-0.5, 0.5), vy: 0, g: 10, life: 0.5, max: 0.5, size: 2, rot: 0, vr: 4, color: CALCITE_D }); } }
    if (m.dead) return;
    const Cr = M.cr; if (Cr && Cr.st === 'wind') lab(c, sx(m.x + Math.cos(Cr.a) * 3.5), sy(m.y + Math.sin(Cr.a) * 3.5) + T * 0.2, 'CLAW CRUSH · flank it', WARN, T, 0.34);
    if (m.stunT > 0 && M.stunKind === 'reel') { lab(c, EX, EY - T * 1.6, `REELING ${m.stunT.toFixed(1)}s`, HOT, T, 0.38); const w = FX.S.weak.eye; if (w && !w.dead) lab(c, EX, EY + T * 1.1, 'EYE · strike it', '#FFFFFF', T, 0.3); } }
})());
/* (the Ossuary's make() in 20zt2 retiles as it blanks the pillars' tiles, which on a fiend arena runs before the dungeon
   has made its tile cache (a ReferenceError that stops the stage loading). There is nothing cached yet to clear, so the
   early retile is let fail quietly; the pillars' later destroy() retiles as usual) */
(() => { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.basilica; if (!Rf) return;
  for (const S of Rf.stages) if (S.kind === 'boss' && S.boss === 'eshra' && S.make && !S.make.safeRetile) { const make = S.make;
    S.make = (X, self, H) => { const rt = X.retile; if (rt) X.retile = () => { try { rt(); } catch (e) { if (!(e instanceof ReferenceError)) throw e; } }; return make(X, self, H); }; S.make.safeRetile = true; } })();
