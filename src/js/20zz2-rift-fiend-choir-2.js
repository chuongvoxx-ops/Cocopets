/* ---------- VEYRA, THE THROAT OF NIGHT ----------
   The Choir's second boss, on the Pipe Bridge: a 32×28-metre platform of riveted maroon plates over the dark, three great
   horn mouths on its far (north) edge, three shelter wedges near its centre and a low bone arch (the stage's make() in
   20zy2 builds them: X.rift.self.mod.horns, wedges, arch, platform; CHO.arena.veyra carves the floor).
   Veyra is a bat-like predator: a narrow BONE CHEST (a cage of bone ribs and a keel over dark flesh), two enormous maroon
   WINGS whose translucent membranes let the light through, each held open by only three long finger bones (a clear fan),
   a long coral THROAT SAC under its neck, and a smooth black wedge of a HEAD with no eyes, a hot rim of light along its
   edges and two tall antenna-like EARS. Before every song the sac inflates into a glowing sphere.
   It clings upside down to the low arch, its head hanging within reach, and sings through the horns:
   ANTIPHON: the sac swells and the horn mouths light in an order, numbered on the horns and on the floor; each fires a
   broad LANE down the platform on its beat (the next counts down). Take cover behind THAT horn's wedge, or step into a
   lane that has already sung (the last discharged lane is always safe: no horn sings twice in a phrase).
   STOLEN NOTE (every other phrase): the throat coughs out one HUSH MOTH, which flies to the horn that sings first and,
   the moment it has sung, steals the note of the third: that horn's plaque takes the stolen symbol, the third horn falls
   silent (a closed mouth), and the third lane's preview jumps to the new horn, at least four seconds before it fires.
   Between phrases it lets go and DROPS to the floor below the arch (a landing: ×1.75 while it lies sprawled), then
   flaps back up to its perch.
   At half health it DROPS INTO THE ARENA for good (a long landing window, ×1.75): on the floor it stalks on its wrists,
   sings its phrases reared up, and between horn attacks sweeps a WING CONE (the wings rise, then slam forward); it
   leaps to new ground and every landing opens it again.
   Weak point: the inflated throat sac while it glows (×1.5).
   It is never still: it sways on its grip, the membranes ripple, the ears twitch and flare, the sac breathes, the head
   turns to follow the pet; it jolts when struck. It unfolds from the arch at its entrance, and dies by clawing back to
   its arch, losing its hold, falling, and folding its wings over itself like night closing. */
RiftFiend.define({ id: 'veyra', hpK: 1.25, dmgK: 1.25, name: 'Veyra', title: 'The Throat of Night', color: '#341C2F', glow: '#DA8F86', accent: '#F6BDB2', biome: 'breathworks', r: 2.2, els: ['wind', 'dark'], phases: 2, cuts: [1, 0.5] }, (() => {
  const { TAU, TN } = RiftFiend, K = DunFiend.KIT, rgba = TN.rgba;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const lerpA = (a, b, u) => a + angTo(a, b) * u;
  const mix = (a, b, u) => K.mixC(a, b, clamp(u, 0, 1));
  const add3 = (a, b, k) => [a[0] + b[0] * (k == null ? 1 : k), a[1] + b[1] * (k == null ? 1 : k), a[2] + b[2] * (k == null ? 1 : k)], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const sfx = (FX, k, ...a) => { const f = FX.H && FX.H.sfx && FX.H.sfx[k]; if (f) f(...a); };
  const { MAROON, MAROON_HI, MAROON_D, BONE, BONE_HI, BONE_D, GOLD, GOLD_HI, GOLD_D, CORAL, CORAL_HI, CORAL_D, WARN, INK } = CHO;
  /* the painter's palette: four tones a material (hot edge, lit, shade, deep) */
  const WG = { hi: '#5E2F52', col: '#40193A', sh: '#341C2F', sh2: '#1A0A17' };      // the membrane, the side the light falls on
  const WB = { hi: '#B8607A', col: '#7E3756', sh: '#55233F', sh2: '#2E1226' };      // the membrane with the light coming through it
  const FUR = { hi: '#6A3E5E', col: '#432540', sh: '#2C1529', sh2: '#170A15' };     // the dark flesh and short fur of the body
  const BNR = { hi: BONE_HI, col: BONE, sh: '#B3A37F', sh2: '#7E6E52' };            // the bone chest, the finger bones
  const COR = { hi: CORAL_HI, col: CORAL, sh: '#B46B64', sh2: '#7E4440' };          // the throat sac
  const HEADR = ['#060407', '#130D14', '#231A25', '#3E2F3C'];                      // the black head, deep to lit
  const DEADC = '#4A4048', HOT = '#FFE4D8', RIM = '#FF9A80', SAFE = '#BFF2D8';
  const tubeS = R => ({ col: R.col, shade: R.sh, shade2: R.sh2, hi: R.hi, line: INK });
  const VIEW = [0, Math.SQRT1_2, Math.SQRT1_2], LIGHT = norm3([-0.5, 0.32, 0.82]);
  const dk = p => p[1] + p[2] * 0.62;
  /* the body (tiles): the hips' height when it hangs and when it crouches, its crouch pitch, the shoulder */
  const SC = 1.25, HZ = 3.62 - 0.56 * SC, GZ = 0.74 * SC, PG = 0.25, SH = [0.98, 0.3, 0.1], HSC = 1.18 * SC;   // (SC: the whole body's scale)
  /* the wings, in the body's frame (u along the spine to the head, out to the side, w to the back): the elbow, the wrist,
     the three finger tips and where the membrane meets the flank, for each way it holds them */
  const WL = {
    HF: [[0.5, 0.62, 0.0], [-0.24, 0.56, -0.06], [1.7, 0.66, -0.12], [1.82, 0.52, -0.22], [1.74, 0.4, -0.3], [0.02, 0.28, -0.05]],      // hanging, furled
    HC: [[0.4, 0.72, -0.15], [-0.3, 0.64, -0.16], [1.75, 0.68, -0.5], [2.05, 0.32, -0.66], [1.95, -0.06, -0.6], [0.05, 0.3, -0.12]],  // hanging, wrapped in them
    HS: [[0.5, 1.12, 0.22], [-0.22, 2.08, 0.32], [0.18, 4.35, 0.26], [1.3, 4.0, 0.1], [2.25, 2.6, -0.06], [0.0, 0.28, 0.04]],          // hanging, fanned open
    GF: [[0.82, 0.88, 0.98], [1.04, 0.8, -0.97], [0.43, 0.84, 0.87], [0.19, 0.76, 0.73], [-0.07, 0.66, 0.53], [-0.4, 0.3, -0.05]],    // on the floor, on its wrists
    GS: [[0.85, 1.02, 0.55], [0.8, 1.9, 1.2], [0.7, 3.45, 2.6], [0.55, 4.2, 1.35], [0.2, 3.1, 0.1], [-0.4, 0.3, 0.0]],              // on the floor, mantled open
    GP: [[0.75, 1.15, -0.1], [0.6, 2.15, -0.3], [1.1, 4.0, -0.36], [-0.2, 3.9, -0.36], [-1.1, 2.6, -0.34], [-0.45, 0.3, -0.25]],      // sprawled flat
    GD: [[0.5, 1.1, 0.0], [0.6, 0.85, 0.38], [1.6, 0.1, 0.58], [0.4, -0.38, 0.64], [-0.75, 0.0, 0.52], [-0.5, 0.3, 0.0]] };     // folded over itself
  const RAISE = [[-0.15, 0, 0.25], [-0.35, -0.1, 0.45], [-0.7, -0.3, 0.5], [-0.8, -0.4, 0.75], [-0.6, -0.3, 0.7], [0, 0, 0]];
  const SWEEP = [[0.3, -0.1, -0.35], [0.8, -0.3, -0.9], [1.6, -1.2, -2.2], [1.5, -1.4, -1.6], [1.0, -1.0, -0.8], [0, 0, 0]];
  const FLAP = [0.15, 0.45, 1.0, 0.95, 0.7, 0.05];
  const LEGS = { H: [[-0.25, 0.38, -0.12], [-0.56, 0.22, 0.02]], G: [[-0.46, 0.62, 0.01], [-0.86, 0.45, -0.52]], P: [[-0.55, 0.62, -0.1], [-1.0, 0.52, -0.3]] };
  const mixL = (A, B, u) => u <= 0 ? A : u >= 1 ? B : A.map((p, i) => [lerp(p[0], B[i][0], u), lerp(p[1], B[i][1], u), lerp(p[2], B[i][2], u)]);
  /* the fight's rhythm: the phrases' leads and gaps (a stolen phrase spaces its beats so the stolen preview shows > 4 s) */
  const CYC1 = ['antiphon', 'stolen', 'drop'], CYC2 = ['cone', 'antiphon', 'leap', 'cone', 'stolen', 'leap'];
  const A = CHO.arena.veyra;
  // (how fast each moving part of the pose eases to what the acts ask)
  const RATES = { g: 3.2, gz: 3.2, s: 4.2, wrap: 2.6, raise: 6, sweep: 14, flapK: 5, inf: 3.2, jaw: 7, ear: 4, sprawl: 5, shroud: 1.6, rear: 4, sing: 4 };
  // (the rift's own X, for the beat previews: the Choir's context for this game)
  const rx = FX => { try { if (!FX.H || !FX.H.g || !FX.F || !FX.F.rift) return null; const C = CHO.ctx({ g: FX.H.g }); return C && C.X && C.X.me ? C.X : null; } catch (e) { return null; } };

  return {
    arenaR: A.R, carve: A.carve, start: A.start, firstAct: 'hang', artY: 0.8, ambient: 'motes',
    artPoses: [
      { name: 'clinging to the arch, wings furled', mem: { g: 0, s: 0.12 } },
      { name: 'entrance: wrapped in its wings, unfolding', mem: { g: 0, s: 0.06, wrap: 0.85, ear: 0 } },
      { name: 'Antiphon: wings fanned, the throat a glowing sphere', mem: { g: 0, s: 1, inf: 1, jaw: 0.7, ear: 1, sing: 1 } },
      { name: 'dropping: it lets go and turns', mem: { g: 0.5, gz: 0.4, s: 0.85, flapK: 0.4, hd: 1.2 } },
      { name: 'landed: sprawled (the damage window)', mem: { g: 1, sprawl: 1, s: 0.8, hd: Math.PI / 2, ear: 0 } },
      { name: 'on the floor, stalking on its wrists', mem: { g: 1, s: 0, hd: 0.7, gait: 1.2, spdK: 1, ear: 0.4 } },
      { name: 'wing cone: the wings rise', mem: { g: 1, s: 1, raise: 1, hd: Math.PI / 2, ear: 1, jaw: 0.35 } },
      { name: 'wing cone: the slam', mem: { g: 1, s: 1, sweep: 1, hd: Math.PI / 2, jaw: 0.5 } },
      { name: 'phase two: singing reared up', mem: { g: 1, rear: 1, s: 0.75, inf: 1, jaw: 0.7, ear: 1, hd: Math.PI / 2, sing: 1 } },
      { name: 'dead: fallen, its wings folded over it', mem: { g: 1, sprawl: 1, shroud: 1, dead: 1, s: 0.6, hd: 0.5, ear: 0 } },
      { name: 'facing away (north)', mem: { g: 1, s: 0.45, hd: -Math.PI / 2 + 0.4, ear: 0.6 } },
      { name: 'reeling: hit while it hangs', mem: { g: 0, s: 0.55, recoil: 1, swK: 0.12, ear: 0.3 } }],
    phaseNames: ['The Pipe Bridge', 'The Throat Descends'],
    props(C) { const out = [], R = mulberry32(5151), kinds = ['pipecolumn', 'pipespiral', 'pipecolumn', 'pipearch'];
      for (let i = 0; i < 8; i++) { const sd = i % 2 ? 1 : -1, y = C.y - 10.5 + Math.floor(i / 2) * 6.8; out.push({ kind: kinds[Math.floor(i / 2) % 4], v: (i * 3 + (sd > 0 ? 1 : 0)) % 8, s: 0.9 + R() * 0.2, x: C.x + 0.5 + sd * 17.8, y }); }
      return out; },
    propKeep: { every: 30, box: p => [-3.4 * p.s, -9.4 * p.s, 3.4 * p.s, 1.0 * p.s] },
    drawProp(c, FX, p, X, Y, T) { const f = DunWorld.PROPS[p.kind]; if (!f) return; c.translate(X, Y); f(c, T * p.s, p.v); },
    paintGround(c, A2) { paintBridge(c, A2); },
    sky(c, W, H, t, cam, T) { paintCavern(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m; m.noTouch = true; const mod = stage(FX), H = hangAt(mod); m.x = H.x; m.y = H.y; m.act = 'enter';
      Object.assign(M, { mod, hang: H, bt: 0, g: 0, gz: 0, jz: 0, s: 0.04, wrap: 1, raise: 0, sweep: 0, flapK: 0, flapP: 0, inf: 0, jaw: 0, ear: 0, pulse: 0, sprawl: 0, shroud: 0, dead: 0, rear: 0, sing: 0, look: 0, hd: Math.PI / 2, recoil: 0, swK: 0, gait: 0, spdK: 0, earT: [0, 0], earK: [0, 0],
        tg: { g: 0, gz: 0, s: 0.12, wrap: 0, raise: 0, sweep: 0, flapK: 0, inf: 0, jaw: 0, ear: 0.35, sprawl: 0, shroud: 0, rear: 0, sing: 0 },
        picks: 0, nextAct: null, wait: 1.0, P: null, Dr: null, Cn: null, Lp: null, moth: null, seen: {}, taught: false, screamed: false, wasStun: false, stunKind: null, end: null, waves: [], marks: [], px: m.x, py: m.y, lastLane: -1,
        stat: { phrases: 0, stolenPhrases: 0, lanes: 0, order: [], steps: [], laneHit: 0, laneMiss: 0, laneShelter: 0, laneSafeLast: 0, steals: [], kept: 0, moths: 0, drops: 0, lands: 0, bigLands: 0, cones: 0, coneHit: 0, coneMiss: 0, leaps: 0, climbs: 0, swoops: 0 } });
      M.J = pose(m, M); },
    phase(FX, p) { const M = FX.mem, m = FX.m; endAll(FX, m, M); m.stunT = 0; M.recoil = 1;
      if (p >= 2) { M.nextAct = 'swoop'; FX.H.after(0.9, () => FX.H.banner('THE THROAT DESCENDS', 'It drops into the arena: WING CONES between its phrases · strike as it LANDS (×1.75)', CORAL_HI, 3.0, true)); } },
    ai(FX, m, dt) { const M = FX.mem; m.actT += dt; m.noTouch = true; stepAct(FX, m, M, dt); weakPts(FX, m, M); FX.parts(bodyParts(m, M)); },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true; const T = M.tg; T.sprawl = 1; T.g = 1; T.gz = 1; T.s = 0.85; T.inf = 0; T.jaw = 0.15; T.ear = 0; T.raise = 0; T.sweep = 0; T.flapK = 0; T.rear = 0; T.sing = 0;
      weakPts(FX, m, M); FX.parts(bodyParts(m, M));
      if (Math.random() < dt * 4) { const h = M.J && M.J.hb; if (h) FX.H.part({ kind: 'spark', x: h[0] + FX.rnd(-0.5, 0.5), y: h[1] - h[2] - 0.4, vx: FX.rnd(-1.2, 1.2), vy: -1.4, drag: 0.6, life: 0.55, max: 0.55, size: 2.4, color: Math.random() < 0.5 ? CORAL_HI : BONE_HI }); } },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.stat) return; M.bt += dt; const stun = m.stunT > 0 && !m.dead, me = FX.me;
      if (M.end) { stepEnd(FX, m, M, dt); ease(M, dt); M.J = pose(m, M); return; }
      if (!stun && M.wasStun) { M.wasStun = false; M.recoil = 0.5; M.stunKind = null; FX.H.text(m.x, m.y - 2.6, 'It gathers itself', CORAL_HI, 13); sfx(FX, 'whoosh'); } else if (stun) M.wasStun = true;
      // the entrance: wrapped in its wings on the arch, it unfolds them wide, the ears rise, the throat swells and it screams
      if (m.act === 'enter') { const e = FX.S.enterT || 0, u = smooth((e - 0.5) / 1.7), T = M.tg; T.wrap = 1 - u; T.s = 0.04 + u * 0.96; T.ear = u; T.g = 0; T.gz = 0; T.inf = smooth((e - 1.9) / 0.6); T.jaw = T.inf * 0.8; T.sing = T.inf;
        if (e > 2.5 && !M.screamed) { M.screamed = true; M.recoil = 0.6; sfx(FX, 'hum'); sfx(FX, 'crash'); FX.H.shake(8, 0.5); const s = M.J && M.J.sac; if (s) { FX.H.ring(s.c[0], s.c[1] - s.c[2], 0.4, 6, 0.8, CORAL_HI, 0.4); M.waves.push({ x: s.c[0], y: s.c[1], z: s.c[2], t: 0, big: 1 }); } } }
      if (!M.taught && m.act === 'hang') { M.taught = true; m.actT = -2.4; M.tg.inf = 0; M.tg.jaw = 0; M.tg.sing = 0; FX.H.banner('VEYRA', 'Numbered horn lanes fire in order: hide behind THAT horn\'s WEDGE · strike the glowing THROAT', CORAL_HI, 3.4, true); }
      // (while the phase turns the fight holds its acts: one in the air finishes its flight)
      if (FX.S.roarT > 0 && !stun && ['drop', 'climb', 'swoop', 'leap'].includes(m.act)) stepAct(FX, m, M, dt);
      mothStep(FX, M, dt);
      // the horns' light: lit while a step waits on them, the red rim rising as it comes due, a glow fading after
      hornsStep(FX, M, dt);
      // where it looks, how fast it goes, the ears' own twitches
      if (dt > 1e-4) { const sp = Math.hypot(m.x - M.px, m.y - M.py) / dt; M.px = m.x; M.py = m.y; M.spdK = toward(M.spdK, clamp(sp / 4, 0, 1), dt, 6); M.gait += dt * (1.2 + M.spdK * 9); }
      const lookT = (M.g || 0) < 0.5 ? clamp((me.x - m.x) * 0.1, -0.55, 0.55) : 0; M.look = toward(M.look, stun ? 0 : lookT, dt, 2.5);
      for (let i = 0; i < 2; i++) { M.earT[i] -= dt; if (M.earT[i] <= 0) { M.earT[i] = 1.2 + Math.random() * 2.8; M.earK[i] = 1; } M.earK[i] = decay(M.earK[i], dt, 3.5); }
      M.recoil = decay(M.recoil, dt, 2.4); M.pulse = decay(M.pulse, dt, 3.2); M.swK = toward(M.swK, 0, dt, 2.5);
      if ((m.hitSq || 0) > 0.5) M.recoil = Math.max(M.recoil, 0.3);
      ease(M, dt);
      M.waves = M.waves.filter(w => (w.t += dt) < (w.big ? 1.2 : 0.8)); M.marks = M.marks.filter(k => (k.t += dt) < k.life);
      M.J = pose(m, M); },
    dmgK(FX, m) { const M = FX.mem; if (!M || !M.stat) return 1; M.recoil = Math.max(M.recoil || 0, 0.3); M.swK = (M.swK || 0) + (Math.random() < 0.5 ? -0.05 : 0.05); if (M.end) return 0; return m.stunT > 0 && M.stunKind === 'land' ? 1.75 : 1; },
    onWeakHit(FX, key) { const M = FX.mem; if (!M) return; M.recoil = Math.max(M.recoil || 0, 0.5); if (key === 'throat') M.sacHit = 1; },
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.stat) return null; if (M.end) return { x: m.x, y: m.y - 1.6, k: 0.85 }; if (m.dead) return null; if (m.act === 'enter') return { x: m.x, y: m.y - 2.2, k: 0.55 };
      if (M.P && M.mod) { const y = M.mod.platform.y0 + 6; return { x: me.x, y, k: Math.min(0.32, 3.2 / (Math.abs(me.y - y) + 1)) }; }
      const x = m.x, y = m.y - ((M.g || 0) < 0.5 ? 2.2 : 0.8), d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(0.38, 3.6 / d) }; },
    ending(FX, m) { const M = FX.mem; endAll(FX, null, M); FX.noParts(); for (const k in FX.S.weak) FX.weak(k, 0, 0, 0, 0, false);
      const hanging = (M.g || 0) < 0.35; M.end = { t: 0, st: hanging ? 'shudder' : 'return', t0: 0, x0: m.x, y0: m.y, z0: M.jz || 0 }; M.tg.inf = 0; M.tg.jaw = 0.9; M.tg.sing = 0; M.recoil = 1; sfx(FX, 'hum');
      const d = hanging ? 4.4 : 5.6;
      return { title: 'THE THROAT FALLS SILENT', sub: 'Veyra loses its hold on the arch, and its wings fold over it like the night closing', col: CORAL_HI, delay: d, bannerAt: d - 2.6, fanfareAt: d - 1.0, quiet: true, slow: 0.6 }; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { drawVeyra(c, FX, m, X, Y + (m.z || 0) * T * 4, T, t); },
    drawObj() {},
    drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (m && m.dead && M && M.end) drawVeyra(c, FX, m, FX.sx(m.x), FX.sy(m.y), T, t); drawAir(c, FX, T, t); },
  };

  /* ---------- the stage's pieces (the module the stage made, or the same geometry when there is none) ---------- */
  function stage(FX) { const X = rx(FX), mod = X && X.rift && X.rift.self && X.rift.self.mod; if (mod && mod.horns && mod.arch) return mod;
    const C = FX.C, VW = A.W, VH = A.H, x0 = C.x - VW / 2 + 0.5, y0 = C.y - VH / 2 + 0.5, x1 = x0 + VW - 1, y1 = y0 + VH - 1;
    const horns = [-10.6, 0, 10.6].map((dx, i) => ({ i, x: C.x + 0.5 + dx, y: y0 - 0.4, a: Math.PI / 2, lane: { x0: C.x + 0.5 + dx - 5.3, x1: C.x + 0.5 + dx + 5.3 }, sym: [0, 3, 4][i], lit: 0, warn: 0 }));
    const wedges = A.wedges(C).map((w, i) => ({ i, x: w.x + 0.5, y: w.y + 1, w: 3, shelter: (px, py) => Math.abs(px - (w.x + 0.5)) < 1.45 && py > w.y + 2 && py < w.y + 9 }));
    const ar = A.arch(C);
    return { C, horns, wedges, inLane: (x, y, i) => { const h = horns[i]; return x >= h.lane.x0 && x < h.lane.x1 && y >= y0 - 0.5 && y <= y1 + 0.5; }, sheltered: (x, y, i) => wedges[i] ? wedges[i].shelter(x, y) : false,
      arch: { x: ar.x + 0.5, y: ar.y + 0.5, w: ar.w, h: 3.4, hang: { x: ar.x + 0.5, y: ar.y + 0.6 } }, platform: { x0: x0 - 0.5, y0: y0 - 0.5, x1: x1 + 0.5, y1: y1 + 0.5 }, fake: true }; }
  // where it hangs: under the arch's crown (a hair south of the arch, so it is painted over it and its feet grip the bone)
  function hangAt(mod) { return { x: mod.arch.hang.x, y: mod.arch.y + 0.62 }; }
  function plat(M) { return M.mod.platform; }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.6 : 1.2, true); }
  function dust(FX, x, y, r, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = r * (0.3 + Math.random() * 0.7), life = 0.7 + Math.random() * 0.5; FX.H.part({ kind: 'smoke', x: x + Math.cos(a) * d * 0.7, y: y + Math.sin(a) * d * 0.45, vx: Math.cos(a) * (1 + r), vy: Math.sin(a) * 0.6 - 0.6, drag: 1.1, life, max: life, size: 6 + Math.random() * 6, color: col || (Math.random() < 0.5 ? MAROON_HI : '#6A4A5E') }); } }
  /* a beat preview: the Choir's numbered shapes (the rift's context), or a plain telegraph when there is none */
  function beat(FX, o) { const X = rx(FX); if (X) return CHO.beat(X, o);
    const s = FX.tele({ shape: o.shape === 'lane' ? 'line' : o.shape, x: o.x, y: o.y, a: o.a, len: o.len, w: o.w, spread: o.spread, t: o.t, dmg: 0, col: WARN, fn: () => { if (s.f2) s.f2(s, false); } }); s.f2 = o.fn; s.cancel = () => { s.done = true; s.f2 = null; }; return s; }
  /* the pose's moving parts ease toward what the acts ask */
  function ease(M, dt) { const T = M.tg; for (const k in RATES) if (T[k] != null && !(M.hold && M.hold[k])) M[k] = toward(M[k], T[k], dt, RATES[k]); M.hold = null; M.flapP = (M.flapP || 0) + dt * (5 + (M.flapK || 0) * 9); M.sacHit = decay(M.sacHit, dt, 4); }
  function endAll(FX, m, M) { const P = M.P; if (P) { P.steps.forEach(s => { if (s.p && !s.done) s.p.cancel(); }); restoreHorns(M); M.P = null; }
    if (M.Cn && M.Cn.p) M.Cn.p.cancel(); M.Cn = null; releaseMoth(M); const T = M.tg; T.inf = 0; T.jaw = 0; T.sing = 0; T.raise = 0; T.sweep = 0; T.rear = 0;
    if (m) { m.act = (M.g || 0) < 0.5 && !M.Dr && !M.Lp ? 'hang' : 'stalk'; m.actT = 0; M.Dr = null; M.Lp = null; M.wait = 0.8; M.jz = 0; } }
  function choose(FX, m) { const M = FX.mem, p2 = FX.S.phase >= 2; let k = M.nextAct; M.nextAct = null;
    if (!k) { const cyc = p2 ? CYC2 : CYC1; k = cyc[M.picks % cyc.length]; M.picks++; }
    if (!p2 && (k === 'cone' || k === 'leap')) k = 'antiphon';
    if (k === 'antiphon' || k === 'stolen') startAntiphon(FX, m, M, k === 'stolen');
    else if (k === 'drop') { if ((M.g || 0) < 0.5) startDrop(FX, m, M); else startLeap(FX, m, M, false); }
    else if (k === 'cone') startCone(FX, m, M);
    else if (k === 'leap') startLeap(FX, m, M, false);
    else if (k === 'swoop') startLeap(FX, m, M, true);
    else if (k === 'climb') startClimb(FX, m, M);
    else startAntiphon(FX, m, M, false); }
  function stepAct(FX, m, M, dt) { const T = M.tg, p2 = FX.S.phase >= 2;
    switch (m.act) {
      case 'hang': T.g = 0; T.gz = 0; T.s = 0.12; T.wrap = 0; T.ear = 0.4; T.inf = 0; T.jaw = 0; T.sing = 0; T.raise = 0; T.sweep = 0; T.flapK = 0; T.sprawl = 0; T.rear = 0; M.jz = toward(M.jz, 0, dt, 6);
        { const H = M.hang; m.x = toward(m.x, H.x, dt, 6); m.y = toward(m.y, H.y, dt, 6); }
        if (p2 && !M.nextAct) M.nextAct = 'swoop';
        if (m.actT > M.wait) { m.actT = 0; choose(FX, m); } break;
      case 'stalk': stalkStep(FX, m, M, dt); break;
      case 'antiphon': phraseStep(FX, m, M, dt); break;
      case 'drop': dropStep(FX, m, M, dt); break;
      case 'land': // (its landing window has passed)
        if (!p2 && (M.g || 0) > 0.5) startClimb(FX, m, M); else { m.act = 'stalk'; m.actT = 0; M.wait = 0.7; } break;
      case 'climb': climbStep(FX, m, M, dt); break;
      case 'cone': coneStep(FX, m, M, dt); break;
      case 'leap': leapStep(FX, m, M, dt); break;
      default: m.act = (M.g || 0) < 0.5 ? 'hang' : 'stalk'; m.actT = 0; } }

  /* ---- ANTIPHON: the horns light in an order and each fires a broad lane on its beat ---- */
  function startAntiphon(FX, m, M, steal) { const p2 = FX.S.phase >= 2, F = FX.S.fast || 1, mod = M.mod, PL = plat(M), order = [0, 1, 2].sort(() => Math.random() - 0.5);
    const lead = (steal ? 3.4 : p2 ? 2.7 : 3.0) / F, gap = (steal ? 2.3 : p2 ? 1.75 : 2.0) / F;
    const P = { t: 0, steal, lead, gap, order, steps: [], orig: mod.horns.map(h => h.sym), A: order[2], B: order[0], stolen: false, stealAt: null, mothAt: 0.8, hushed: -1, endT: 0 };
    P.steps = order.map((i, k) => { const s = { k, n: k + 1, i, sym: mod.horns[i].sym, at: lead + k * gap, done: false, res: null };
      s.p = beat(FX, { shape: 'lane', x: mod.horns[i].x, y: PL.y0, a: Math.PI / 2, len: PL.y1 - PL.y0, w: mod.horns[i].lane.x1 - mod.horns[i].lane.x0, n: s.n, t: s.at, dmg: 0, src: m, fn: () => fireStep(FX, FX.m, M, P, s) }); return s; });
    M.P = P; m.act = 'antiphon'; m.actT = 0; M.stat.phrases++; if (steal) M.stat.stolenPhrases++; sfx(FX, 'hum');
    if (steal) say(FX, 'stolen', 'STOLEN NOTE', 'A HUSH MOTH steals a note: lane 3 JUMPS to the horn it perches on — watch the numbers', CORAL_HI);
    else say(FX, 'antiphon', 'ANTIPHON', 'Each lit horn fires its lane in turn: its WEDGE shelters you, or step into a lane that has sung', CORAL_HI); }
  function phraseStep(FX, m, M, dt) { const P = M.P, T = M.tg, p2 = FX.S.phase >= 2; if (!P) { m.act = p2 ? 'stalk' : 'hang'; m.actT = 0; return; } P.t += dt;
    // the sac swells into its glowing sphere as the horns light; it throbs on every beat
    T.inf = P.t > 0.3 ? 1 : 0.4; T.sing = 1; T.jaw = 0.25 + 0.45 * (M.pulse || 0) + (P.t < 1.1 ? 0.4 : 0); T.ear = 1; T.s = p2 ? 0.7 : 1; T.wrap = 0; T.raise = 0; T.sweep = 0; T.flapK = 0; T.sprawl = 0; T.rear = p2 ? 1 : 0; T.g = p2 ? 1 : 0; T.gz = T.g;
    if (p2) { M.hd = lerpA(M.hd, FX.angPet(m.x, m.y), Math.min(1, dt * 2)); } else { const H = M.hang; m.x = toward(m.x, H.x, dt, 6); m.y = toward(m.y, H.y, dt, 6); }
    // the stolen note: the moth comes from the throat, perches on the first horn, and once that horn has sung it takes the third note
    if (P.steal && !P.stolen && !P.kept) { if (!P.mothGo && P.t >= P.mothAt) { P.mothGo = true; launchMoth(FX, m, M, P); }
      const mo = M.moth, s1 = P.steps[0], s3 = P.steps[2];
      if (P.mothGo && (!mo || mo.dead)) { P.kept = true; M.stat.kept++; FX.H.text(m.x, m.y - 3, 'The note is kept', SAFE, 14); }
      else if (mo && mo.veyCtl && mo.veyCtl.st === 'perch' && s1.done) { const lead = s3.at - P.t; if (lead >= 4.0) stealNote(FX, m, M, P, lead); else { P.kept = true; M.stat.kept++; } } }
    if (P.steps.every(s => s.done)) { P.endT += dt; if (P.endT > 0.7) { restoreHorns(M); M.P = null; releaseMoth(M); T.inf = 0; T.sing = 0; T.jaw = 0; T.rear = 0; m.act = p2 ? 'stalk' : 'hang'; m.actT = 0; M.wait = p2 ? 0.6 : 1.1; } } }
  function fireStep(FX, m, M, P, s) { if (M.P !== P || s.done) return; s.done = true; const me = FX.me, mod = M.mod, i = s.i, h = mod.horns[i];
    const inL = mod.inLane(me.x, me.y, i), shel = inL && mod.sheltered(me.x, me.y, i), dodge = me.dodge || me.leap;
    let res; if (!inL) res = 'clear'; else if (shel) res = 'shelter'; else if (dodge || me.dead) res = 'dodge'; else res = 'hit';
    if (res === 'hit') { M.stat.laneHit++; FX.hurt(m.dmg * 1.25); FX.H.text(me.x, me.y - 1.6, 'The horn sings through you!', WARN, 13); me.push = { vx: 0, vy: 6, t: 0.18 }; }
    else { M.stat.laneMiss++; if (res === 'shelter') { M.stat.laneShelter++; FX.H.text(me.x, me.y - 1.6, 'The wedge takes it', SAFE, 12); } else if (res === 'clear' && P.steps.some(q => q.done && q !== s && mod.inLane(me.x, me.y, q.i))) M.stat.laneSafeLast++; }
    s.res = res; M.stat.lanes++; M.stat.order.push(i); M.stat.steps.push({ n: s.n, i, res, t: FX.g.t, stolen: !!s.stolen }); M.lastLane = i;
    if (s.stolen) { const st = M.stat.steals[M.stat.steals.length - 1]; if (st) st.fireT = FX.g.t; }
    h.flashT = 1; M.pulse = 1; M.recoil = Math.max(M.recoil, 0.2); M.waves.push({ horn: i, t: 0 }); sfx(FX, 'crack'); sfx(FX, 'chime', 330 + i * 110, 0.5); FX.H.shake(4, 0.15);
    const PL = plat(M); for (let k = 0; k < 10; k++) FX.H.part({ kind: 'spark', x: FX.rnd(h.lane.x0 + 0.5, h.lane.x1 - 0.5), y: FX.rnd(PL.y0 + 1, PL.y1 - 1), vx: 0, vy: -1.2, drag: 0.6, life: 0.5, max: 0.5, size: 2.4, color: Math.random() < 0.5 ? CORAL_HI : HOT }); }
  function stealNote(FX, m, M, P, lead) { const mod = M.mod, s3 = P.steps[2], A2 = P.A, B2 = P.B; P.stolen = true; P.stealAt = P.t; P.hushed = A2;
    mod.horns[B2].sym = P.orig[A2]; s3.i = B2; s3.stolen = true; if (s3.p) s3.p.x = mod.horns[B2].x;
    M.stat.steals.push({ step: 3, from: A2, to: B2, t: FX.g.t, lead, fireT: null, sym: P.orig[A2] });
    sfx(FX, 'hiss', 0.6, 0.14, 900); FX.H.ring(mod.horns[B2].x, mod.horns[B2].y + 1, 0.3, 3, 0.6, CORAL_HI, 0.4);
    FX.H.banner('THE NOTE IS STOLEN', `The ${['WEST', 'MIDDLE', 'EAST'][B2]} horn now sings 3 · the ${['west', 'middle', 'east'][A2]} horn is hushed`, CORAL_HI, 2.2, true); }
  function restoreHorns(M) { const P = M.P; if (!P) return; M.mod.horns.forEach((h, i) => { h.sym = P.orig[i]; }); }
  function hornsStep(FX, M, dt) { const P = M.P, mod = M.mod; if (!mod) return;
    mod.horns.forEach((h, i) => { let lit = 0, warn = 0; if (P) for (const s of P.steps) if (!s.done && s.i === i) { lit = 1; warn = Math.max(warn, clamp(1 - (s.at - P.t) / 1.2, 0, 1)); }
      h.flashT = decay(h.flashT, dt, 1.8); h.lit = Math.max(lit, h.flashT || 0) * (P && P.hushed === i ? 0.2 : 1); h.warn = warn; }); }

  /* ---- the hush moth: coughed from the throat, it flies to the first horn and perches there; let go when the phrase ends ---- */
  function launchMoth(FX, m, M, P) { const s = M.J && M.J.sac, x = s ? s.c[0] : m.x, y = s ? s.c[1] + 0.3 : m.y + 0.5; let mo = M.moth && !M.moth.dead ? M.moth : null;
    if (!mo) { mo = FX.minion('hushmoth', x, y); M.stat.moths++; mo.x = x; mo.y = y; FX.H.ring(x, y - (s ? s.c[2] : 1), 0.2, 1.6, 0.4, CORAL_HI, 0.35); sfx(FX, 'pop'); FX.H.text(x, y - 2.4, 'A hush moth!', CORAL_HI, 13); }
    const h = M.mod.horns[P.B]; mo.veyCtl = { st: 'fly', tx: h.x + 1.0, ty: h.y + 0.9, v: Math.max(3, Math.hypot(h.x + 1 - mo.x, h.y + 0.9 - mo.y) / 1.7) }; mo.still = true; mo.cd = 99; mo.aggro = true; M.moth = mo; }
  function mothStep(FX, M, dt) { const mo = M.moth; if (!mo) return; if (mo.dead) { M.moth = null; return; } const k = mo.veyCtl; if (!k) return;
    const dx = k.tx - mo.x, dy = k.ty - mo.y, d = Math.hypot(dx, dy);
    if (k.st === 'fly') { const v = Math.min(d, k.v * dt); if (d > 1e-3) { mo.x += dx / d * v; mo.y += dy / d * v; mo.face = dx >= 0 ? 1 : -1; } mo.mode = null; if (d < 0.12) { k.st = 'perch'; FX.H.text(mo.x, mo.y - 1.4, 'It perches on the horn', CORAL_HI, 12); } }
    else { mo.x = k.tx + Math.sin((M.bt || 0) * 2.1) * 0.08; mo.y = k.ty; mo.mode = 'hush'; mo.face = -1; }
    mo.cd = 99; mo.kbx = mo.kby = 0; }
  function releaseMoth(M) { const mo = M.moth; if (mo && !mo.dead && mo.veyCtl) { mo.veyCtl = null; mo.still = false; mo.cd = 1.5; mo.mode = null; } }

  /* ---- between phrases (phase one): it lets go, drops to the floor below the arch and lies there a moment, then climbs back ---- */
  function startDrop(FX, m, M) { const H = M.hang; M.Dr = { t: 0, st: 'let', x0: m.x, y0: m.y, x1: H.x + FX.rnd(-0.6, 0.6), y1: H.y + 1.5 }; m.act = 'drop'; m.actT = 0; M.stat.drops++; sfx(FX, 'whoosh');
    say(FX, 'drop', 'IT DROPS', 'Between its phrases it lets go of the arch: strike it while it lies on the floor (×1.75)', CORAL_HI); }
  function dropStep(FX, m, M, dt) { const D = M.Dr, T = M.tg; if (!D) { m.act = 'hang'; return; } D.t += dt;
    if (D.st === 'let') { T.s = 0.15; T.ear = 0.9; T.inf = 0; T.g = 0; T.gz = 0; M.swK = Math.sin(D.t * 30) * 0.03; if (D.t > 0.4) { D.st = 'fall'; D.t = 0; } return; }
    const u = clamp(D.t / 0.55, 0, 1); M.hold = { g: 1, gz: 1 }; M.g = smooth(u); M.gz = u * u; T.g = 1; T.gz = 1; T.s = 0.85; T.flapK = 0.3; m.x = lerp(D.x0, D.x1, u); m.y = lerp(D.y0, D.y1, u); M.hd = Math.PI / 2;
    if (u >= 1) { M.Dr = null; land(FX, m, M, 2.2, false); } }
  /* every landing: a thump, dust, and it lies sprawled for a moment: the damage window */
  function land(FX, m, M, dur, big) { m.act = 'land'; m.actT = 0; m.stunT = Math.max(m.stunT || 0, dur); M.stunKind = 'land'; M.stat.lands++; if (big) M.stat.bigLands++; M.landDur = dur; M.jz = 0; M.g = 1; M.gz = 1; M.tg.g = 1; M.tg.gz = 1;
    M.sprawl = Math.max(M.sprawl, 0.5); M.recoil = 1; dust(FX, m.x, m.y, 2.2, big ? 18 : 10); FX.H.shake(big ? 12 : 7, 0.35); sfx(FX, 'crash'); sfx(FX, 'thud'); M.marks.push({ x: m.x, y: m.y, t: 0, life: 5, big });
    FX.H.ring(m.x, m.y, 0.4, big ? 4.2 : 2.8, 0.45, CORAL_HI, 0.3);
    const first = !M.seen['land' + (big ? 2 : 1)]; M.seen['land' + (big ? 2 : 1)] = true;
    FX.H.banner(big ? 'IT CRASHES DOWN' : 'IT LANDS', first ? `Sprawled on the floor: strike now, it takes ×1.75 for ${dur.toFixed(1)} s` : 'Strike it now! ×1.75', HOT, first ? 2.0 : 1.0, true); }
  function startClimb(FX, m, M) { const H = M.hang; M.Dr = { t: 0, x0: m.x, y0: m.y, x1: H.x, y1: H.y }; m.act = 'climb'; m.actT = 0; M.stat.climbs++; sfx(FX, 'whoosh'); }
  function climbStep(FX, m, M, dt) { const D = M.Dr, T = M.tg; if (!D) { m.act = 'hang'; return; } D.t += dt; const u = clamp(D.t / 1.15, 0, 1);
    T.s = 1; T.flapK = 1 - smooth((u - 0.75) / 0.25); T.sprawl = 0; T.ear = 0.6; M.hold = { g: 1, gz: 1 }; M.g = 1 - smooth(u); M.gz = 1 - smooth(u); T.g = M.g; T.gz = M.gz; M.jz = Math.sin(u * Math.PI) * 0.6;
    m.x = lerp(D.x0, D.x1, smooth(u)); m.y = lerp(D.y0, D.y1, smooth(u));
    if (Math.random() < dt * 6) dust(FX, D.x0 + FX.rnd(-1.5, 1.5), D.y0, 0.8, 1);
    if (u >= 1) { M.Dr = null; M.jz = 0; m.act = 'hang'; m.actT = 0; M.wait = 1.0; sfx(FX, 'thud'); } }

  /* ---- phase two: on the floor it stalks on its wrists toward the pet ---- */
  function stalkStep(FX, m, M, dt) { const T = M.tg, me = FX.me, F = FX.S.fast || 1; T.g = 1; T.gz = 1; T.s = 0; T.wrap = 0; T.inf = 0; T.jaw = 0; T.sing = 0; T.raise = 0; T.sweep = 0; T.flapK = 0; T.sprawl = 0; T.rear = 0; T.ear = 0.55; M.jz = toward(M.jz, 0, dt, 6);
    if ((M.g || 0) < 0.5 && FX.S.phase < 2) { m.act = 'hang'; m.actT = 0; return; }
    const a = FX.angPet(m.x, m.y), d = FX.dist(m.x, m.y); M.hd = lerpA(M.hd, a, Math.min(1, dt * 3));
    if (d > 3.6) moveOn(FX, M, m, Math.cos(a) * 1.7 * F * dt, Math.sin(a) * 1.7 * F * dt);
    if (m.actT > (M.wait || 0.8)) { m.actT = 0; choose(FX, m); } }
  // a step on the floor, kept on the platform, off the wedges and the arch's feet
  function moveOn(FX, M, m, dx, dy) { const P = plat(M); let x = clamp(m.x + dx, P.x0 + 2, P.x1 - 2), y = clamp(m.y + dy, P.y0 + 2.5, P.y1 - 2);
    for (const w of M.mod.wedges) { const ex = x - w.x, ey = y - (w.y + 0.2), d = Math.hypot(ex, ey); if (d < 2.4 && d > 1e-3) { x = w.x + ex / d * 2.4; y = w.y + 0.2 + ey / d * 2.4; } }
    m.x = x; m.y = y; }
  function spotNear(FX, M, big) { const me = FX.me, P = plat(M), H = M.hang;
    for (let k = 0; k < 60; k++) { const a = Math.random() * TAU, d = (big ? 3.4 : 3.8) + Math.random() * 2.4, x = me.x + Math.cos(a) * d, y = me.y + Math.sin(a) * d;
      if (x < P.x0 + 2.4 || x > P.x1 - 2.4 || y < P.y0 + 3 || y > P.y1 - 2.4) continue; if (M.mod.wedges.some(w => Math.hypot(x - w.x, y - (w.y + 0.3)) < 2.8)) continue;
      if (Math.abs(y - (H.y - 0.6)) < 1.6 && (Math.abs(x - (H.x - 4.5)) < 1.6 || Math.abs(x - (H.x + 4.5)) < 1.6)) continue; return { x, y }; }
    return { x: clamp(me.x, P.x0 + 3, P.x1 - 3), y: clamp(me.y - 4, P.y0 + 3, P.y1 - 3) }; }
  /* ---- a leap (phase two) to new ground, or THE drop into the arena at half health: every landing opens it ---- */
  function startLeap(FX, m, M, big) { const to = spotNear(FX, M, big), F = FX.S.fast || 1; M.Lp = { t: 0, st: 'crouch', big, x0: m.x, y0: m.y, x1: to.x, y1: to.y, g0: M.g || 0, z0: M.jz || 0, crouch: (big ? 0.5 : 0.35) / F, fly: (big ? 1.0 : 0.8) / F }; m.act = 'leap'; m.actT = 0;
    if (big) { M.stat.swoops++; sfx(FX, 'hum'); } else M.stat.leaps++; sfx(FX, 'whoosh'); }
  function leapStep(FX, m, M, dt) { const L = M.Lp, T = M.tg; if (!L) { m.act = 'stalk'; return; } L.t += dt;
    if (L.st === 'crouch') { T.s = 0.9; T.ear = 1; T.flapK = 0.2; T.inf = 0; T.sing = 0; T.rear = 0; T.raise = 0.35; if (L.g0 < 0.5) { T.g = 0; T.gz = 0; M.swK = Math.sin(L.t * 26) * 0.03; } else M.hd = lerpA(M.hd, Math.atan2(L.y1 - m.y, L.x1 - m.x), Math.min(1, dt * 6)); if (L.t > L.crouch) { L.st = 'fly'; L.t = 0; sfx(FX, 'whoosh'); } return; }
    const u = clamp(L.t / L.fly, 0, 1); T.raise = 0; T.s = 1; T.flapK = 1 - smooth((u - 0.7) / 0.3); M.hold = { g: 1, gz: 1 };
    M.g = lerp(L.g0, 1, smooth(Math.min(1, u * 1.4))); M.gz = L.g0 < 0.5 ? u * u : 1; T.g = 1; T.gz = 1; M.jz = L.g0 < 0.5 ? Math.sin(u * Math.PI) * 0.8 : Math.sin(u * Math.PI) * (L.big ? 2.6 : 1.9);
    m.x = lerp(L.x0, L.x1, smooth(u)); m.y = lerp(L.y0, L.y1, smooth(u)); M.hd = lerpA(M.hd, Math.atan2(L.y1 - L.y0, L.x1 - L.x0) * (u < 0.7 ? 1 : 1), Math.min(1, dt * 4));
    if (u >= 1) { M.Lp = null; M.jz = 0; M.hd = FX.angPet(m.x, m.y); land(FX, m, M, L.big ? 3.5 : 1.6, L.big); } }

  /* ---- WING CONE (phase two): the wings rise high over a red cone in front of it, then slam forward ---- */
  function startCone(FX, m, M) { const F = FX.S.fast || 1, a = FX.angPet(m.x, m.y), wind = 1.25 / F; M.hd = a;
    M.Cn = { t: 0, st: 'wind', a, wind, p: beat(FX, { shape: 'cone', x: m.x, y: m.y, a, len: 6.8, spread: 0.62, n: null, t: wind, dmg: 0, src: m, label: 'WING CONE', fn: () => coneStrike(FX, FX.m, M) }) };
    m.act = 'cone'; m.actT = 0; M.stat.cones++; sfx(FX, 'whoosh');
    say(FX, 'cone', 'WING CONE', 'Its wings rise over the cone in front of it: get out to its side or behind it', WARN); }
  function coneStep(FX, m, M, dt) { const Cn = M.Cn, T = M.tg; if (!Cn) { m.act = 'stalk'; return; } Cn.t += dt; M.hd = Cn.a; T.g = 1; T.gz = 1; T.rear = 0.3; T.inf = 0; T.sing = 0; T.flapK = 0; T.sprawl = 0;
    if (Cn.st === 'wind') { const u = clamp(Cn.t / Cn.wind, 0, 1); T.s = 1; T.raise = smooth(u / 0.7); T.sweep = 0; T.ear = 1; T.jaw = 0.3 * u; if (Cn.t > Cn.wind + 0.4) coneStrike(FX, m, M); return; }
    T.raise = 0; T.sweep = Cn.t - Cn.t1 < 0.45 ? 1 : 0; T.jaw = 0.5; if (Cn.t - Cn.t1 > 0.75) { M.Cn = null; T.sweep = 0; m.act = 'stalk'; m.actT = 0; M.wait = 0.5; } }
  function coneStrike(FX, m, M) { const Cn = M.Cn; if (!Cn || Cn.st !== 'wind') return; Cn.st = 'strike'; Cn.t1 = Cn.t; const me = FX.me, p = Cn.p;
    const inC = CHO.inBeat ? CHO.inBeat(me.x, me.y, { shape: 'cone', x: p.x, y: p.y, a: Cn.a, len: 6.8, spread: 0.62 }, me.r * 0.6) : FX.inShape({ shape: 'cone', x: p.x, y: p.y, a: Cn.a, len: 6.8, spread: 0.62 }, me.x, me.y, me.r * 0.6);
    if (inC && !(me.dodge || me.leap) && !me.dead) { M.stat.coneHit++; FX.hurt(m.dmg * 1.4); FX.H.text(me.x, me.y - 1.6, 'Swept by its wings!', WARN, 14); me.push = { vx: Math.cos(Cn.a) * 10, vy: Math.sin(Cn.a) * 10, t: 0.24 }; } else M.stat.coneMiss++;
    M.sweep = 0.2; M.tg.sweep = 1; FX.H.shake(8, 0.25); sfx(FX, 'crash');
    for (let i = 0; i < 16; i++) { const a = Cn.a + FX.rnd(-0.62, 0.62), d = FX.rnd(1, 6.5); FX.H.part({ kind: 'smoke', x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5 - 0.4, drag: 1.4, life: 0.6, max: 0.6, size: 7, color: Math.random() < 0.5 ? MAROON_HI : CORAL_D }); } }

  /* ---- the weak point and the body's hit proxies ---- */
  function weakPts(FX, m, M) { const J = M.J; if (!J || M.end) { if (FX.S.weak.throat) FX.weak('throat', 0, 0, 0, 0, false); return; }
    if ((M.inf || 0) > 0.6) { const s = J.sac; FX.weak('throat', s.c[0], s.c[1] - s.c[2], 0.55 + 0.35 * M.inf, 1.5, true); } else if (FX.S.weak.throat) FX.weak('throat', 0, 0, 0, 0, false); }
  function bodyParts(m, M) { const J = M.J; if (!J) return []; const h = (k, p, r) => ({ key: k, dx: p[0] - m.x, dy: p[1] - p[2] - m.y, r });
    return [h('ch', J.chestC, 0.85), h('ab', J.abdC, 0.7), h('hd', J.headC, 0.7), h('nk', J.nk1, 0.5), h('wl', J.wings[0].Wr, 0.6), h('wr', J.wings[1].Wr, 0.6), h('fl', lerp3(J.wings[0].Wr, J.wings[0].F[1], 0.5), 0.8), h('fr', lerp3(J.wings[1].Wr, J.wings[1].F[1], 0.5), 0.8)]; }

  /* ---- its death: back to the arch, a shudder, the grip fails, it falls, the wings fold over it ---- */
  function stepEnd(FX, m, M, dt) { const E = M.end, T = M.tg, H = M.hang; E.t += dt; E.t0 += dt; T.inf = 0; T.sing = 0; T.raise = 0; T.sweep = 0; T.rear = 0;
    if (E.st === 'return') { const u = clamp(E.t0 / 1.1, 0, 1); T.s = 1; T.flapK = 1 - smooth((u - 0.8) / 0.2); T.sprawl = 0; M.hold = { g: 1, gz: 1 }; M.g = 1 - smooth(u); M.gz = 1 - smooth(u); M.jz = Math.sin(u * Math.PI) * 0.8; m.x = lerp(E.x0, H.x, smooth(u)); m.y = lerp(E.y0, H.y, smooth(u)); T.ear = 0.5;
      if (u >= 1) { E.st = 'shudder'; E.t0 = 0; M.jz = 0; } return; }
    if (E.st === 'shudder') { T.g = 0; T.gz = 0; T.s = 0.7; T.flapK = 0; T.jaw = 0.9; T.ear = 1; M.swK = Math.sin(E.t0 * 34) * 0.05 * (1 - E.t0 / 0.8); m.x = H.x; m.y = H.y; if (E.t0 > 0.7) { E.st = 'fall'; E.t0 = 0; E.x1 = H.x + 0.4; E.y1 = H.y + 1.6; sfx(FX, 'whoosh'); FX.H.text(H.x, H.y - 4.2, 'Its grip fails', CORAL_HI, 14); } return; }
    if (E.st === 'fall') { const u = clamp(E.t0 / 0.55, 0, 1); M.hold = { g: 1, gz: 1 }; M.g = smooth(u); M.gz = u * u; T.g = 1; T.gz = 1; T.s = 0.9; T.sprawl = u; T.ear = 0.2; T.jaw = 0.4; m.x = lerp(H.x, E.x1, u); m.y = lerp(H.y, E.y1, u); M.hd = lerp(Math.PI / 2, 2.1, u);
      if (u >= 1) { E.st = 'fold'; E.t0 = 0; dust(FX, m.x, m.y, 2.6, 22); FX.H.shake(12, 0.4); sfx(FX, 'crash'); sfx(FX, 'thud'); M.marks.push({ x: m.x, y: m.y, t: 0, life: 30, big: true }); } return; }
    T.g = 1; T.gz = 1; T.sprawl = 1; T.s = 0.6; T.jaw = 0; T.ear = 0; T.shroud = E.t0 > 0.35 ? 1 : 0; M.dead = toward(M.dead, 1, dt, 0.9); M.hold = null; }

  /* ---------- the body: where everything is ---------- */
  function pose(m, M) {
    const bt = M.bt || 0, g = clamp(M.g || 0, 0, 1), gl = smooth(g), sp = clamp(M.sprawl || 0, 0, 1), sd = clamp(M.shroud || 0, 0, 1), rc = M.recoil || 0, s = clamp(M.s == null ? 0.3 : M.s, 0, 1), wrap = clamp(M.wrap || 0, 0, 1);
    const hd = M.hd == null ? Math.PI / 2 : M.hd, sing = M.sing || 0, br = Math.sin(bt * 1.7) * 0.03, inf = clamp(M.inf || 0, 0, 1), pulse = M.pulse || 0, dead = M.dead || 0;
    const psi = lerpA(-Math.PI / 2, hd, smooth(Math.min(1, g * 1.5)));
    const phi = lerp(-Math.PI / 2, PG + (M.rear || 0) * 0.95 - sp * 0.35 + br * 0.5 - rc * 0.08, gl);
    const rho = (M.roll || 0) + gl * (M.spdK || 0) * Math.sin((M.gait || 0) * 2) * 0.05;
    const z0 = lerp(HZ, GZ - sp * 0.38 * SC, M.gz == null ? gl : clamp(M.gz, 0, 1)) + (M.jz || 0) + (1 - gl) * br * 0.5;
    const O = [m.x, m.y, z0];
    const cps = Math.cos(psi), sps = Math.sin(psi), cph = Math.cos(phi), sph = Math.sin(phi), cr = Math.cos(rho), sr = Math.sin(rho);
    const A0 = [cps * cph, sps * cph, sph], D0 = [-cps * sph, -sps * sph, cph], L0 = [-sps, cps, 0];
    const D = add3(mul3(D0, cr), L0, sr), Lv = add3(mul3(L0, cr), D0, -sr), Ax = A0;
    // (hanging, it swings a little on its grip, a pendulum about its feet: a shear across, below the pivot)
    const sway = (1 - gl) * (Math.sin(bt * 0.85) * 0.05 + Math.sin(bt * 2.3) * 0.012 + (M.swK || 0) + rc * 0.04 * Math.sin(bt * 9)), piv = z0 + 0.56 * SC;
    const W = (u, v, w) => { u *= SC; v *= SC; w *= SC; const p = [O[0] + Ax[0] * u + Lv[0] * v + D[0] * w, O[1] + Ax[1] * u + Lv[1] * v + D[1] * w, O[2] + Ax[2] * u + Lv[2] * v + D[2] * w]; if (sway) p[0] += (piv - p[2]) * sway; return p; };
    // the wings
    const fk = M.flapK || 0, fp = M.flapP || 0, rs = M.raise || 0, sw = M.sweep || 0;
    const hangL = mixL(mixL(WL.HF, WL.HC, wrap), WL.HS, s), grL = mixL(mixL(mixL(WL.GF, WL.GS, s), WL.GP, sp), WL.GD, sd), Lw = mixL(hangL, grL, gl);
    const wings = [1, -1].map(side => { const pts = Lw.map(([u, o, w], k) => { let uu = u, oo = o * (1 + pulse * 0.03 * k / 5), ww = w;
        uu += RAISE[k][0] * rs + SWEEP[k][0] * sw; oo += RAISE[k][1] * rs + SWEEP[k][1] * sw; ww += RAISE[k][2] * rs + SWEEP[k][2] * sw;
        if (fk) { const f = Math.sin(fp + (side > 0 ? 0 : 0.2)); ww += f * fk * FLAP[k] * 0.9; oo *= 1 - Math.max(0, f) * fk * 0.12 * (k >= 2 ? 1 : 0.4); }
        if (k >= 2) { ww += Math.sin(bt * 2.2 + k * 1.3 + side) * 0.035 * (1 - sd); uu += Math.sin(bt * 1.6 + k) * 0.02; }
        if (k === 1 && gl > 0.5 && s < 0.4) { const ph = (M.gait || 0) + (side > 0 ? 0 : Math.PI); ww += Math.max(0, Math.sin(ph)) * 0.22 * (M.spdK || 0) * (1 - s); uu += Math.cos(ph) * 0.18 * (M.spdK || 0) * (1 - s); }
        return W(uu, side * oo, ww); });
      return { side, S: W(SH[0], side * SH[1], SH[2]), E: pts[0], Wr: pts[1], F: [pts[2], pts[3], pts[4]], Tr: pts[5], flank: W(0.5, side * 0.24, -0.02) }; });
    // the legs: hanging, the feet grip the arch overhead; on the floor they push off behind
    const Lg = mixL(mixL(LEGS.H, LEGS.G, gl), LEGS.P, sp * gl);
    const legs = [1, -1].map(side => ({ side, hip: W(0.02, side * 0.2, 0.0), knee: W(Lg[0][0], side * Lg[0][1], Lg[0][2]), foot: W(Lg[1][0], side * Lg[1][1], Lg[1][2]) }));
    // the neck and head: the head hangs face down when it clings, turns its face out to the pet, lifts as it sings
    const nk0 = W(1.0, 0, 0.05), nk1 = W(1.28, 0, 0.1 - sing * 0.04), hb = W(1.52, 0, 0.05);
    const nod = lerp(-0.32 - sing * 0.3 + rc * 0.25, -0.55 - sp * 0.5 + sing * 0.25 + rc * 0.2, gl) + Math.sin(bt * 1.1) * 0.04 + dead * 0.3, yaw = (M.look || 0) + (1 - gl) * Math.sin(bt * 0.6) * 0.06;
    let hA = norm3(add3(mul3(Ax, Math.cos(nod)), D, Math.sin(nod))); hA = norm3(add3(mul3(hA, Math.cos(yaw)), Lv, Math.sin(yaw)));
    const hu = norm3(sub3(D, mul3(hA, dot3(D, hA)))), hl = cross3(hu, hA);
    const P = (a, b, c) => { a *= HSC; b *= HSC; c *= HSC; return [hb[0] + hA[0] * a + hl[0] * b + hu[0] * c, hb[1] + hA[1] * a + hl[1] * b + hu[1] * c, hb[2] + hA[2] * a + hl[2] * b + hu[2] * c]; };
    const headC = P(0.32, 0, 0.0);
    // the throat sac along the neck's underside: a long pouch, swelling into a sphere that glows
    const ik = inf * (1 + pulse * 0.07) + (M.sacHit || 0) * 0.06 * Math.sin(bt * 40);
    const sac = { c: W(lerp(1.3, 1.42, gl), 0, -0.3 - 0.24 * ik), ax: [mul3(Ax, 0.4 + 0.08 * ik), mul3(Lv, 0.19 + 0.38 * ik), mul3(D, 0.17 + 0.3 * ik)], k: ik };
    // the ears: tall antennae splayed from the back of the skull, flaring as it sings
    const ef = M.ear == null ? 0.4 : M.ear, ears = [1, -1].map((side, i) => { const tw = (M.earK ? M.earK[i] : 0) * Math.sin(bt * 22 + i) * 0.12 + Math.sin(bt * 1.3 + i * 2) * 0.05 - dead * 0.4;
      const dir = norm3(add3(add3(mul3(hA, lerp(0.85, 0.12, gl) - ef * 0.12 + dead * 0.5), hl, side * (lerp(0.5, 0.42, gl) + ef * 0.24 + tw)), hu, lerp(0.05, 0.95, gl) + ef * 0.12 - dead * 0.8)), L = (1.4 + ef * 0.15) * SC;
      const root = P(-0.02, side * 0.15, 0.15), mid = add3(add3(root, dir, L * 0.5), add3(mul3(hu, 0.1 * SC), hA, -0.06 * SC)), tip = add3(add3(root, dir, L), add3(mul3(hu, 0.04 * SC), hA, (-0.12 + tw * 0.4) * SC));
      return { side, root, mid, tip }; });
    return { O, A: Ax, D, Lv, W, wings, legs, nk0, nk1, hb, hA, hl, hu, P, headC, sac, ears, gl, chestC: W(0.68, 0, 0), abdC: W(0.3, 0, -0.02), pelC: W(0.02, 0, 0), s, wrap, sp, dead }; }

  /* ---------- painting it ---------- */
  // a 3D ellipsoid (centre g, three half-axis vectors) as the toon shader's shape: the screen ellipse it projects to
  function ellS(c, P3, T, g, ax, o) { const p = P3(g[0], g[1], g[2]); let a = 0, b = 0, d = 0; for (const v of ax) { const x = v[0] * T, y = (v[1] - v[2]) * T; a += x * x; b += x * y; d += y * y; }
    const tr = (a + d) / 2, df = Math.sqrt(((a - d) / 2) * ((a - d) / 2) + b * b), rx = Math.sqrt(tr + df), ry = Math.sqrt(Math.max(1e-4, tr - df)), th = 0.5 * Math.atan2(2 * b, a - d);
    TN.shape(c, TN.ell(p[0], p[1], rx, ry, th), Object.assign({ r: Math.max(rx, ry), force: true, specAt: [p[0] - rx * 0.32, p[1] - ry * 0.4] }, o)); return { p, rx, ry, th }; }
  // a material's tones, dulled toward ash as it dies
  function rampD(R, k) { if (!(k > 0.01)) return R; return { hi: mix(R.hi, DEADC, k * 0.6), col: mix(R.col, DEADC, k * 0.55), sh: mix(R.sh, '#2E262C', k * 0.5), sh2: mix(R.sh2, '#1A1418', k * 0.4) }; }
  // a faceted solid: its faces lit by how they meet the light, those turned away left out; a bold hull outline. Returns the hull
  function solid(c, P3, faces, cen, lw, ramp, o) { o = o || {}; const vis = [], all = [];
    for (const f of faces) { let n = norm3(cross3(sub3(f[1], f[0]), sub3(f[f.length - 1], f[0]))); const fc = f.reduce((a, p) => add3(a, p), [0, 0, 0]).map(v => v / f.length); if (dot3(n, sub3(fc, cen)) < 0) n = mul3(n, -1);
      if (dot3(n, VIEW) <= 0.015) continue; const k = dot3(n, LIGHT), col = k > 0.72 ? ramp[3] : k > 0.4 ? ramp[2] : k > 0.06 ? ramp[1] : ramp[0], pts = f.map(p => P3(p[0], p[1], p[2])); pts.forEach(p => all.push(p)); vis.push({ pts, col, k, n }); }
    if (!vis.length) return []; c.lineJoin = 'round';
    for (const F of vis) { c.beginPath(); F.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = F.col; c.fill(); c.lineWidth = 1; c.strokeStyle = F.col; c.stroke(); }
    if (o.inner) o.inner(c, vis);
    c.beginPath(); for (const F of vis) { F.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); } c.lineWidth = Math.max(0.8, lw * 0.35); c.strokeStyle = 'rgba(120,90,110,.28)'; c.stroke();
    const hull = hull2(all); if (K.Q.flash > 0 || o.flash) { c.beginPath(); hull.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = `rgba(255,236,230,${o.flash ? 0.3 * o.flash : 0.14})`; c.fill(); }
    if (o.rim) o.rim(c, hull);
    c.beginPath(); hull.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
    return hull; }
  function hull2(pts) { pts = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1)); }
  function drawVeyra(c, FX, m, X, Y, T0, t) { const T = T0 * SC, M = FX.mem || {}, J = M.J && M.J.O[0] === m.x && !M.end ? M.J : pose(m, M), P3 = TN.cam(X, Y, T0, m), pr = p => P3(p[0], p[1], p[2]), lw = Math.max(1.3, T * 0.05), dead = M.dead || 0;
    // its shadow on the plates: under it on the floor, broad as its wings
    { const gz = J.O[2], sp = 0.6 + J.s * 1.9, a = 0.34 / (1 + gz * 0.25); c.save(); c.fillStyle = `rgba(14,6,12,${a})`; c.beginPath(); c.ellipse(X, Y + T * 0.15, T * sp, T * (0.55 + J.s * 0.25), 0, 0, TAU); c.fill(); c.fillStyle = `rgba(14,6,12,${a * 0.8})`; c.beginPath(); c.ellipse(X, Y + T * 0.1, T * 0.9, T * 0.4, 0, 0, TAU); c.fill(); c.restore(); }
    const parts = [], bias = J.wrap * 1.9 + J.dead * 0;
    J.wings.forEach(w => { const cen = lerp3(lerp3(w.Wr, w.F[1], 0.5), w.E, 0.3); parts.push({ k: dk(cen) - 0.9 + bias + (J.sp * J.gl) * -0.3 + (M.shroud || 0) * 1.6, draw: () => drawWing(c, P3, T, lw, J, w, M, t) }); });
    // (hanging, the parts stack up and down: the belly and legs above go behind the chest, whatever their height)
    const hang = J.gl < 0.5, kc = dk(J.chestC);
    J.legs.forEach(L => parts.push({ k: hang ? kc - 0.3 : dk(L.knee) - 0.25, draw: () => drawLeg(c, P3, T, lw, J, L, M) }));
    parts.push({ k: hang ? kc - 0.12 : dk(J.abdC) - 0.05, draw: () => drawBelly(c, P3, T, lw, J, M) });
    parts.push({ k: dk(J.chestC), draw: () => drawChest(c, P3, T, lw, J, M) });
    parts.push({ k: dk(lerp3(J.nk0, J.hb, 0.5)) - 0.06, draw: () => drawNeck(c, P3, T, lw, J, M) });
    parts.push({ k: dk(J.sac.c) + 0.12 * (dot3(mul3(J.D, -1), VIEW) > 0 ? 1 : -1), draw: () => drawSac(c, P3, T, lw, J, M, t) });
    const hk = J.gl < 0.5 ? Math.max(dk(J.headC) + 0.04, dk(J.sac.c) + 0.5) : dk(J.headC) + 0.04;
    J.ears.forEach(E => parts.push({ k: J.gl < 0.5 ? hk - 0.02 : dk(E.mid) - 0.08, draw: () => drawEar(c, P3, T, lw, J, E, M, t) }));
    parts.push({ k: hk, draw: () => drawHead(c, P3, T, lw, J, M, t) });
    parts.sort((a, b) => a.k - b.k).forEach(p => { c.save(); p.draw(); c.restore(); });
    // dazed by a landing: little coral stars over the head
    if (m.stunT > 0 && M.stunKind === 'land' && !M.end) { const q = pr(add3(J.headC, [0, 0, 0.8])), bt = M.bt || t; for (let i = 0; i < 4; i++) { const a = bt * 3.4 + i * TAU / 4; TN.twinkle(c, q[0] + Math.cos(a) * T * 0.75, q[1] + Math.sin(a) * T * 0.24, T * (i % 2 ? 0.2 : 0.14), i % 2 ? '#FFFFFF' : CORAL_HI, 0.95); } } }

  /* a wing: three panels of membrane between the arm and the three finger bones, each lit or backlit on its own; then the bones */
  function drawWing(c, P3, T, lw, J, w, M, t) { const pr = p => P3(p[0], p[1], p[2]), dead = M.dead || 0, bt = M.bt || t, glow = clamp((M.inf || 0) - 0.4, 0, 1) * 1.6, fw = 0.6 + 0.4 * clamp(Math.hypot(...sub3(w.F[0], w.F[2])) / 2.2, 0, 1), furl = clamp((1 - fw) / 0.4, 0, 1);
    const scal = (p, q, k) => lerp3(lerp3(p, q, 0.5), w.Wr, k);
    const panels = [
      { tri: [w.Wr, w.F[0], w.F[1]], path: [[w.Wr], [w.F[0]], [scal(w.F[0], w.F[1], 0.26), w.F[1]]] },
      { tri: [w.Wr, w.F[1], w.F[2]], path: [[w.Wr], [w.F[1]], [scal(w.F[1], w.F[2], 0.24), w.F[2]]] },
      { tri: [w.Wr, w.F[2], w.Tr], path: [[w.S], [w.E], [w.Wr], [w.F[2]], [lerp3(lerp3(w.F[2], w.Tr, 0.5), w.flank, 0.38), w.Tr], [w.flank]] }];
    const tracePath = Pp => { c.beginPath(); Pp.forEach((seg, i) => { const q = pr(seg[seg.length - 1]); if (!i) c.moveTo(q[0], q[1]); else if (seg.length === 2) { const k = pr(seg[0]); c.quadraticCurveTo(k[0], k[1], q[0], q[1]); } else c.lineTo(q[0], q[1]); }); c.closePath(); };
    for (const pn of panels) { let n = norm3(cross3(sub3(pn.tri[1], pn.tri[0]), sub3(pn.tri[2], pn.tri[0]))); if (dot3(n, VIEW) < 0) n = mul3(n, -1);
      const lit = dot3(n, LIGHT), back = lit < -0.05, R = rampD(back ? WB : WG, dead), tone = back ? (lit < -0.45 ? R.col : R.sh) : (lit > 0.62 ? R.hi : lit > 0.25 ? R.col : R.sh);
      const wr = pr(w.Wr), far = pr(lerp3(pn.tri[1], pn.tri[2], 0.5)), rr = Math.max(4, Math.hypot(far[0] - wr[0], far[1] - wr[1]) * 1.1);
      c.save(); tracePath(pn.path); c.globalAlpha = 0.88 + 0.12 * furl; c.fillStyle = furl > 0.01 ? mix(tone, R.sh, furl * 0.4) : tone; c.fill(); c.globalAlpha = 1; c.clip();
      // darker at the bones, thinner and lighter toward the trailing edge, where the light comes through
      let gr = c.createRadialGradient(wr[0], wr[1], rr * 0.05, wr[0], wr[1], rr); gr.addColorStop(0, rgba(R.sh2, 0.55)); gr.addColorStop(0.55, rgba(R.sh2, 0.12)); gr.addColorStop(1, rgba(R.hi, 0.16)); c.fillStyle = gr; c.fillRect(wr[0] - rr, wr[1] - rr, rr * 2, rr * 2);
      const th = (back ? 0.5 : 0.22) * (1 - dead * 0.8) + glow * 0.35; if (th > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = th; const e = pr(lerp3(pn.tri[1], pn.tri[2], 0.45)); blitSized(c, glowSprite(back ? '#E07A86' : CORAL_D), e[0] - rr * 0.55, e[1] - rr * 0.55, rr * 1.1, rr * 1.1); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      // the veins: fine branching lines from the bones out to the edge, dark, with a thread of light along each
      const vein = (a, b, bow, k) => { const p = pr(a), q = pr(b), mx = (p[0] + q[0]) / 2 + (q[1] - p[1]) * bow, my = (p[1] + q[1]) / 2 - (q[0] - p[0]) * bow; c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(mx, my, q[0], q[1]); c.strokeStyle = rgba(R.sh2, 0.55 * k); c.lineWidth = Math.max(0.8, T * 0.03); c.stroke(); c.strokeStyle = rgba(back ? '#F2A0A8' : '#9A5A80', 0.3 * k); c.lineWidth = Math.max(0.6, T * 0.012); c.stroke(); };
      const [p0, p1, p2] = pn.tri; for (const u of [0.32, 0.58, 0.8]) { const a = lerp3(p0, p1, u), b = lerp3(lerp3(p1, p2, 0.5), p0, 0.18 + u * 0.1); vein(a, lerp3(a, b, 0.55 + u * 0.2), 0.12, 1 - u * 0.3); const a2 = lerp3(p0, p2, u); vein(a2, lerp3(a2, b, 0.4 + u * 0.2), -0.1, 0.8 - u * 0.3); }
      if (K.Q.flash > 0) { c.fillStyle = 'rgba(255,236,230,.14)'; c.fillRect(wr[0] - rr, wr[1] - rr, rr * 2, rr * 2); }
      c.restore();
      // the trailing edge's hot rim where the light comes through, and the ink
      tracePath(pn.path); c.strokeStyle = INK; c.lineWidth = lw * 0.85; c.lineJoin = 'round'; c.stroke();
      if (pn.path[2] && pn.path[2].length === 2 && pn.path.length === 3) { const a = pr(pn.path[1][0]), k = pr(pn.path[2][0]), b = pr(pn.path[2][1]); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(k[0], k[1], b[0], b[1]); c.strokeStyle = rgba(back ? '#FFA8A8' : '#C07090', back ? 0.65 : 0.5); c.lineWidth = Math.max(1.2, T * 0.045); c.stroke(); } }
    // the arm: a furred upper arm, a bone forearm, the wrist knuckle and its thumb claw
    const BR0 = rampD(BNR, dead * 0.7), BR = furl > 0.01 ? { hi: mix(BR0.hi, '#8E6E84', furl * 0.55), col: mix(BR0.col, '#6E4E64', furl * 0.6), sh: mix(BR0.sh, '#4A2E42', furl * 0.6), sh2: BR0.sh2 } : BR0, FR = rampD(FUR, dead), S = pr(w.S), E = pr(w.E), Wr = pr(w.Wr);
    TN.tubeLite(c, [S, pr(lerp3(w.S, w.E, 0.5)), E], u => T * (0.32 - u * 0.1), Object.assign({ lw, force: true }, tubeS(FR)));
    TN.tubeLite(c, [E, pr(lerp3(w.E, w.Wr, 0.5)), Wr], u => T * (0.21 - u * 0.06), Object.assign({ lw, force: true }, tubeS(FR)));
    { const a = pr(add3(lerp3(w.E, w.Wr, 0.12), J.D, 0.03)), b = pr(add3(lerp3(w.E, w.Wr, 0.88), J.D, 0.03)); c.strokeStyle = rgba(BR0.col, 0.85); c.lineCap = 'round'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = rgba(BR0.hi, 0.7); c.lineWidth = Math.max(0.6, T * 0.018); c.stroke(); }
    // the three finger bones: long, jointed once, tapering to a point
    w.F.forEach((f, i) => { const kn = add3(lerp3(w.Wr, f, 0.44), sub3(w.F[Math.min(2, i + 1)], f), 0.035), pts = [Wr, pr(lerp3(w.Wr, kn, 0.5)), pr(kn), pr(lerp3(kn, f, 0.5)), pr(f)];
      TN.tubeLite(c, pts, u => T * (0.12 - u * 0.08) * fw, Object.assign({ lw: lw * (0.6 + 0.3 * fw), force: true }, tubeS(BR)));
      const k = pr(kn); TN.shape(c, TN.ell(k[0], k[1], T * 0.075, T * 0.065), Object.assign({ lw: lw * 0.8, r: T * 0.075, force: true, hi: BR.hi }, tubeS(BR))); });
    TN.shape(c, TN.ell(E[0], E[1], T * 0.12, T * 0.11), Object.assign({ lw, r: T * 0.12, force: true, spec: 0.5, specAt: [E[0] - T * 0.04, E[1] - T * 0.05], specR: 0.3 }, tubeS(BR)));
    TN.shape(c, TN.ell(Wr[0], Wr[1], T * 0.15, T * 0.13), Object.assign({ lw, r: T * 0.15, force: true, spec: 0.5, specAt: [Wr[0] - T * 0.05, Wr[1] - T * 0.05], specR: 0.3 }, tubeS(BR)));
    const td = norm3(sub3(w.Wr, w.E)), th1 = add3(add3(w.Wr, td, 0.2), J.D, 0.06), th2 = add3(add3(th1, td, 0.12), J.D, -0.1), a1 = pr(th1), a2 = pr(th2);
    c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = Math.max(1.6, T * 0.09); c.beginPath(); c.moveTo(Wr[0], Wr[1]); c.lineTo(a1[0], a1[1]); c.stroke(); c.strokeStyle = BR.col; c.lineWidth = Math.max(1, T * 0.05); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.moveTo(a1[0] - T * 0.04, a1[1]); c.quadraticCurveTo(a2[0], a2[1] - T * 0.05, a2[0], a2[1]); c.lineTo(a1[0] + T * 0.04, a1[1] + T * 0.02); c.closePath(); c.fill(); }
  // a hind leg: a furred thigh, a bone shin, a foot of black hooked claws (gripping the arch while it hangs)
  function drawLeg(c, P3, T, lw, J, L, M) { const pr = p => P3(p[0], p[1], p[2]), BR = rampD(BNR, (M.dead || 0) * 0.7), FR = rampD(FUR, M.dead || 0), h = pr(L.hip), k = pr(L.knee), f = pr(L.foot);
    TN.tubeLite(c, [h, pr(lerp3(L.hip, L.knee, 0.5)), k], u => T * (0.2 - u * 0.05), Object.assign({ lw, force: true }, tubeS(FR)));
    TN.tubeLite(c, [k, pr(lerp3(L.knee, L.foot, 0.5)), f], u => T * (0.11 - u * 0.03), Object.assign({ lw, force: true }, tubeS(BR)));
    TN.shape(c, TN.ell(k[0], k[1], T * 0.09, T * 0.08), Object.assign({ lw: lw * 0.8, r: T * 0.09, force: true }, tubeS(BR)));
    const hang = J.gl < 0.5, up = hang ? -1 : 1; c.strokeStyle = INK; c.lineCap = 'round';
    for (let i = -1; i <= 1; i++) { const x0 = f[0] + i * T * 0.07 * L.side, y0 = f[1], ex = x0 + i * T * 0.06, ey = y0 + up * T * 0.16; c.lineWidth = Math.max(1.5, T * 0.065); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(ex + T * 0.05 * L.side, ey, ex + T * 0.02, ey + up * T * 0.12 * (hang ? -0.8 : 1)); c.stroke(); }
    c.fillStyle = FR.sh; c.beginPath(); c.arc(f[0], f[1], T * 0.08, 0, TAU); c.fill(); c.lineWidth = lw * 0.7; c.stroke(); }
  // the furred belly and haunches behind the chest
  function drawBelly(c, P3, T, lw, J, M) { const FR = rampD(FUR, M.dead || 0), br = 1 + Math.sin((M.bt || 0) * 1.7) * 0.03;
    ellS(c, P3, T, J.pelC, [mul3(J.A, 0.28), mul3(J.Lv, 0.27), mul3(J.D, 0.25)], Object.assign({ lw, d1: 0.12, d2: 0.24, spec: false }, tubeS(FR)));
    ellS(c, P3, T, J.abdC, [mul3(J.A, 0.36), mul3(J.Lv, 0.29 * br), mul3(J.D, 0.28 * br)], Object.assign({ lw, d1: 0.12, d2: 0.24, spec: 0.25, specR: 0.12, inner: g => { // the fur's short strokes
      const R = mulberry32(41); g.strokeStyle = rgba(FR.hi, 0.35); g.lineWidth = Math.max(0.8, T * 0.02); for (let i = 0; i < 14; i++) { const p = P3(...add3(add3(J.abdC, J.A, (R() - 0.5) * 0.5), J.Lv, (R() - 0.5) * 0.4)); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + T * 0.03, p[1] + T * 0.07); g.stroke(); } } }, tubeS(FR)));
    // the hip bones
    const BR = rampD(BNR, (M.dead || 0) * 0.7); for (const sd of [-1, 1]) { const p = J.W(0.04, sd * 0.2, 0.06); if (dot3(add3(mul3(J.Lv, sd), J.D, 0.4), VIEW) < -0.2) continue; ellS(c, P3, T, p, [mul3(J.A, 0.13), mul3(J.Lv, 0.07), mul3(J.D, 0.08)], Object.assign({ lw: lw * 0.8, d1: 0.1, d2: 0.22, spec: false }, tubeS(BR))); } }
  /* the narrow bone chest: dark flesh in a cage of bone: ribs round it (where they face the camera), a keel down the front, the collarbones */
  function drawChest(c, P3, T, lw, J, M) { const dead = M.dead || 0, FR = rampD(FUR, dead), BR = rampD(BNR, dead * 0.7), br = 1 + Math.sin((M.bt || 0) * 1.7) * 0.035;
    ellS(c, P3, T, J.chestC, [mul3(J.A, 0.46), mul3(J.Lv, 0.34 * br), mul3(J.D, 0.38 * br)], Object.assign({ lw, d1: 0.1, d2: 0.22, spec: false }, tubeS(FR)));
    const ring = (u, k) => { const e = Math.max(0, 1 - Math.pow((u - 0.68) / 0.44, 2)), rl = 0.34 * Math.sqrt(e) * 1.07 * br * k, rw = 0.38 * Math.sqrt(e) * 1.07 * br * k, out = [];
      for (let i = 0; i <= 24; i++) { const th = i / 24 * TAU, n = norm3(add3(mul3(J.Lv, Math.sin(th) / Math.max(0.05, rl)), J.D, Math.cos(th) / Math.max(0.05, rw))), vis = dot3(n, VIEW) > 0.04; out.push({ p: J.W(u - 0.07 * (1 + Math.cos(th)) * 0.5, rl * Math.sin(th), rw * Math.cos(th)), vis }); }
      return out; };
    const runs = pts => { const R = []; let cur = []; for (const q of pts) { if (q.vis) cur.push(q.p); else { if (cur.length > 1) R.push(cur); cur = []; } } if (cur.length > 1) R.push(cur); return R; };
    [[0.4, 0.9], [0.54, 1.0], [0.68, 1.03], [0.82, 1.0], [0.95, 0.88]].forEach(([u, k], i) => { for (const run of runs(ring(u, k))) { const pts = run.map(p => P3(p[0], p[1], p[2])); TN.tubeLite(c, pts, () => T * (0.115 - i * 0.006), Object.assign({ lw: lw * 0.55, force: true, d1: 0.16, d2: 0.28 }, tubeS(BR))); } });
    // the keel (sternum) down the belly, and the collarbones out to the shoulders
    if (dot3(mul3(J.D, -1), VIEW) > -0.1) { const k0 = J.W(0.34, 0, -0.38), k1 = J.W(1.06, 0, -0.34), km = J.W(0.7, 0, -0.44); TN.tubeLite(c, [P3(...k0), P3(...km), P3(...k1)], u => T * (0.14 + Math.sin(u * Math.PI) * 0.05), Object.assign({ lw: lw * 0.75, force: true }, tubeS(BR)));
      for (const sd of [-1, 1]) { const a = J.W(1.04, sd * 0.06, -0.26), b = J.W(SH[0] + 0.02, sd * SH[1], SH[2] - 0.04); TN.tubeLite(c, [P3(...a), P3(...lerp3(a, b, 0.5)), P3(...b)], () => T * 0.07, Object.assign({ lw: lw * 0.75, force: true }, tubeS(BR))); } } }
  // the neck: a furred tube, a ridge of small vertebrae along its back
  function drawNeck(c, P3, T, lw, J, M) { const FR = rampD(FUR, M.dead || 0), BR = rampD(BNR, (M.dead || 0) * 0.7), pts = [J.nk0, J.nk1, J.hb].map(p => P3(p[0], p[1], p[2]));
    TN.tubeLite(c, pts, u => T * (0.38 - u * 0.08), Object.assign({ lw, force: true }, tubeS(FR)));
    if (dot3(J.D, VIEW) > -0.2) for (let i = 0; i < 4; i++) { const p = add3(lerp3(J.nk0, J.hb, 0.12 + i * 0.25), J.D, 0.13), q = P3(p[0], p[1], p[2]); TN.shape(c, TN.ell(q[0], q[1], T * 0.055, T * 0.045), Object.assign({ lw: lw * 0.6, r: T * 0.06, force: true }, tubeS(BR))); } }
  /* the throat sac: a long wrinkled coral pouch that swells into a glowing sphere before it sings */
  function drawSac(c, P3, T, lw, J, M, t) { const S = J.sac, k = clamp(S.k, 0, 1.1), dead = M.dead || 0, R = rampD(COR, dead * 0.8), glow = clamp((k - 0.45) / 0.45, 0, 1) * (1 - dead), bt = M.bt || t, hit = M.sacHit || 0;
    const e = ellS(c, P3, T, S.c, S.ax, Object.assign({ lw, d1: 0.12, d2: 0.22 + 0.05 * (1 - k), spec: 0.8, specR: 0.14, glowCol: glow > 0.05 ? CORAL_HI : null, glowA: 0.3 * glow, inner: g => {
      // deflated: soft folds across it; swollen: a coral heart of light and the skin stretched thin
      if (k < 0.7) { g.strokeStyle = rgba(R.sh2, 0.5 * (1 - k / 0.7)); g.lineWidth = Math.max(0.8, T * 0.03); for (let i = 1; i < 5; i++) { const a = lerp3(add3(S.c, S.ax[0], -0.8 * SC), add3(S.c, S.ax[0], 0.8 * SC), i / 5), p = P3(...add3(a, S.ax[1], -0.9 * SC)), q = P3(...add3(a, S.ax[1], 0.9 * SC)), m2 = P3(...add3(a, S.ax[2], -0.6 * SC)); g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(m2[0], m2[1] + T * 0.04, q[0], q[1]); g.stroke(); } }
      if (glow > 0.02) { const p = P3(S.c[0], S.c[1], S.c[2]), rr = T * (0.3 + 0.5 * k); const gr = g.createRadialGradient(p[0] + rr * 0.1, p[1] + rr * 0.15, 0, p[0], p[1], rr * 1.25); gr.addColorStop(0, rgba('#FFEDE4', 0.75 * glow)); gr.addColorStop(0.4, rgba(CORAL_HI, 0.5 * glow)); gr.addColorStop(1, rgba(CORAL, 0)); g.fillStyle = gr; g.fillRect(p[0] - rr * 1.5, p[1] - rr * 1.5, rr * 3, rr * 3);
        g.strokeStyle = rgba('#FFFFFF', 0.25 * glow); g.lineWidth = Math.max(0.8, T * 0.02); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + bt * 0.3; g.beginPath(); g.ellipse(p[0], p[1], rr * 0.9, rr * 0.9 * (0.3 + 0.15 * Math.sin(a)), a, 0.4, 2.2); g.stroke(); } } } }, tubeS(R)));
    if (glow > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.34 + 0.12 * Math.sin(bt * 6) + (M.pulse || 0) * 0.25 + hit * 0.3) * glow; const r = Math.max(e.rx, e.ry) * 2.3; blitSized(c, glowSprite(CORAL_HI), e.p[0] - r, e.p[1] - r, r * 2, r * 2); c.globalAlpha *= 0.6; blitSized(c, glowSprite(HOT), e.p[0] - r * 0.3, e.p[1] - r * 0.3, r * 0.6, r * 0.6); c.restore(); } }
  // an ear: a tall tapering antenna of black horn, ringed, a coral bead at its tip
  function drawEar(c, P3, T, lw, J, E, M, t) { const pts = [E.root, lerp3(E.root, E.mid, 0.5), E.mid, lerp3(E.mid, E.tip, 0.5), E.tip].map(p => P3(p[0], p[1], p[2])), dead = M.dead || 0;
    TN.tubeLite(c, pts, u => T * (0.32 - u * 0.25), { col: HEADR[2], shade: HEADR[1], shade2: HEADR[0], hi: HEADR[3], line: INK, lw: lw * 0.85, r: T * 0.15, force: true });
    c.strokeStyle = rgba(RIM, 0.5 * (1 - dead)); c.lineWidth = Math.max(0.8, T * 0.022); c.lineCap = 'round'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0] - T * 0.035, p[1] - T * 0.02) : c.moveTo(p[0] - T * 0.035, p[1] - T * 0.02)); c.stroke();
    for (const u of [0.25, 0.42, 0.58, 0.72, 0.84]) { const j = Math.min(3, Math.floor(u * 4)), f = u * 4 - j, p = [lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f)], q = pts[j + 1], a = Math.atan2(q[1] - pts[j][1], q[0] - pts[j][0]) + Math.PI / 2, w = T * (0.32 - u * 0.25) * 0.5;
      c.strokeStyle = 'rgba(120,96,118,.55)'; c.lineWidth = Math.max(0.7, T * 0.018); c.beginPath(); c.moveTo(p[0] - Math.cos(a) * w, p[1] - Math.sin(a) * w); c.lineTo(p[0] + Math.cos(a) * w, p[1] + Math.sin(a) * w); c.stroke(); }
    const tp = pts[4], k = (M.ear || 0) * (1 - dead); TN.shape(c, TN.ell(tp[0], tp[1], T * 0.06, T * 0.06), { col: mix(CORAL_D, CORAL, k), shade: CORAL_D, hi: CORAL_HI, line: INK, lw: lw * 0.6, r: T * 0.06, force: true });
    if (k > 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * k * (0.7 + 0.3 * Math.sin((M.bt || t) * 9 + E.side)); blitSized(c, glowSprite(CORAL_HI), tp[0] - T * 0.35, tp[1] - T * 0.35, T * 0.7, T * 0.7); c.restore(); } }
  /* the head: a smooth black wedge with no eyes, its edges rimmed with hot light; the lower jaw hinges open on a coral mouth and pale fangs */
  function drawHead(c, P3, T, lw, J, M, t) { const P = J.P, dead = M.dead || 0, jaw = clamp(M.jaw || 0, 0, 1), bt = M.bt || t, ramp = dead > 0.01 ? HEADR.map(h => mix(h, '#2A2428', dead * 0.4)) : HEADR;
    const tip = P(0.8, 0, -0.02), c1 = P(0.32, 0, 0.25), c2 = P(-0.04, 0, 0.28), kl = P(0.3, 0.27, 0.03), kr = P(0.3, -0.27, 0.03), bl = P(-0.08, 0.22, 0.07), br = P(-0.08, -0.22, 0.07), nape = P(-0.16, 0, 0.1);
    const ll = P(0.32, 0.21, -0.12), lr = P(0.32, -0.21, -0.12), bbl = P(-0.08, 0.17, -0.1), bbr = P(-0.08, -0.17, -0.1), ut = P(0.74, 0, -0.08);
    // the jaw, hinged at the back of the head, dropping open
    const ja = jaw * 0.55, hy = -0.08, jr = (a, b, cc) => { const y = cc - hy, x = a + 0.06; return P(x * Math.cos(ja) + y * Math.sin(ja) - 0.06, b, -x * Math.sin(ja) + y * Math.cos(ja) + hy); };
    const jt = jr(0.72, 0, -0.13), jl = jr(0.3, 0.19, -0.14), jrr = jr(0.3, -0.19, -0.14), jbl = jr(-0.06, 0.15, -0.12), jbr = jr(-0.06, -0.15, -0.12), jc = jr(0.42, 0, -0.3), jb = jr(-0.05, 0, -0.27);
    const upper = [[tip, c1, kl], [tip, kr, c1], [c1, c2, bl, kl], [c1, kr, br, c2], [c2, nape, bl], [c2, br, nape], [tip, kl, ll, ut], [tip, ut, lr, kr], [kl, bl, bbl, ll], [kr, lr, bbr, br], [ut, ll, bbl, bbr, lr], [nape, bbl, bl], [nape, br, bbr]];
    const lower = [[jt, jl, jc], [jt, jc, jrr], [jl, jbl, jb, jc], [jrr, jc, jb, jbr], [jt, jrr, jbr, jbl, jl]];
    const cU = P(0.25, 0, 0.08), cL = P(0.3, 0, -0.18), uFirst = dot3(sub3(cU, cL), VIEW) > 0;
    const rimDir = (() => { const h = P3(...J.headC), s = P3(...J.sac.c), dx = s[0] - h[0], dy = s[1] - h[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; })(), rk = (0.45 + 0.55 * clamp(J.sac.k, 0, 1)) * (1 - dead * 0.9);
    const rim = (g, hull) => { if (hull.length < 3 || rk < 0.02) return; const cx = hull.reduce((a, p) => a + p[0], 0) / hull.length, cy = hull.reduce((a, p) => a + p[1], 0) / hull.length;
      g.save(); g.lineCap = 'round'; for (let i = 0; i < hull.length; i++) { const a = hull[i], b = hull[(i + 1) % hull.length], mx = (a[0] + b[0]) / 2 - cx, my = (a[1] + b[1]) / 2 - cy, ml = Math.hypot(mx, my) || 1, f = (mx * rimDir[0] + my * rimDir[1]) / ml, al = rk * (0.3 + 0.7 * Math.max(0, f));
        const ia = [lerp(a[0], cx, 0.07), lerp(a[1], cy, 0.07)], ib = [lerp(b[0], cx, 0.07), lerp(b[1], cy, 0.07)]; g.strokeStyle = rgba(RIM, al); g.lineWidth = Math.max(1.2, T * 0.06); g.beginPath(); g.moveTo(ia[0], ia[1]); g.lineTo(ib[0], ib[1]); g.stroke(); g.strokeStyle = rgba(HOT, al * 0.8); g.lineWidth = Math.max(0.6, T * 0.02); g.stroke(); } g.restore(); };
    const drawLower = () => solid(c, P3, lower, P(0.3, 0, -0.2), lw, ramp, { rim: (g, h) => rim(g, h) });
    const drawMouth = () => { if (jaw < 0.04) return; const pts = [ut, ll, bbl, jbl, jl, jt, jrr, jbr, bbr, lr].map(p => P3(p[0], p[1], p[2])); const m0 = P3(...lerp3(ut, jt, 0.5)), m1 = P3(...lerp3(bbl, jbr, 0.5));
      c.beginPath(); [P3(...ut), P3(...ll), P3(...jl), P3(...jt), P3(...jrr), P3(...lr)].forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); const gr = c.createLinearGradient(m0[0], m0[1], m1[0], m1[1]); gr.addColorStop(0, CORAL); gr.addColorStop(1, '#3A1020'); c.fillStyle = gr; c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.stroke();
      // fangs: two long at the front, small ones along the jaws
      c.fillStyle = BONE_HI; c.strokeStyle = INK; c.lineWidth = Math.max(0.8, lw * 0.5); for (const [a, b, L] of [[0.62, 0.07, 0.17], [0.62, -0.07, 0.17], [0.45, 0.14, 0.08], [0.45, -0.14, 0.08], [0.3, 0.18, 0.07], [0.3, -0.18, 0.07]]) { const r0 = P3(...P(a, b, -0.09)), r1 = P3(...P(a + 0.04, b, -0.09)), tp = P3(...add3(P(a, b, -0.09), J.hu, -L * (0.4 + jaw))); c.beginPath(); c.moveTo(r0[0], r0[1]); c.lineTo(tp[0], tp[1]); c.lineTo(r1[0], r1[1]); c.closePath(); c.fill(); c.stroke(); } };
    if (uFirst) { drawLower(); drawMouth(); }
    solid(c, P3, upper, cU, lw * 1.05, ramp, { flash: 0, rim: (g, hull) => rim(g, hull), inner: (g, vis) => {
      // a faint sheen down its ridge (the only feature on its face) and a seam along the crown
      const a = P3(...P(0.72, 0, 0.0)), b = P3(...P(0.0, 0, 0.27)); g.strokeStyle = rgba('#8A7A92', 0.45 * (1 - dead)); g.lineWidth = Math.max(1, T * 0.035); g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      const s1 = P3(...P(0.42, 0.04, 0.2)); g.fillStyle = rgba('#FFFFFF', 0.45 * (1 - dead)); g.beginPath(); g.ellipse(s1[0], s1[1], T * 0.08, T * 0.03, -0.5, 0, TAU); g.fill(); } });
    if (!uFirst) { drawMouth(); drawLower(); }
    // a soft hot bloom where the rim light gathers at the snout as the throat glows
    if (rk > 0.3 && J.sac.k > 0.5) { const p = P3(...lerp3(tip, ut, 0.5)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 * rk; blitSized(c, glowSprite(RIM), p[0] - T * 0.5, p[1] - T * 0.5, T, T); c.restore(); } }

  /* ---------- on the floor: shelter and safe lanes, the numbers along the lanes, landing scars, the throat's light ---------- */
  function lab(c, X, Y, s, col, T, k) { c.save(); c.font = `900 ${Math.round(T * (k || 0.36))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(14,6,12,.85)'; c.lineJoin = 'round'; c.strokeText(s, X, Y); c.fillStyle = col || '#FFFFFF'; c.fillText(s, X, Y); c.restore(); }
  function drawOverlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !M.stat || !m || !M.mod) return; const sx = FX.sx, sy = FX.sy, me = FX.me, mod = M.mod, PL = mod.platform, pu = 0.5 + 0.5 * Math.sin(t * 8);
    // landing scars: a dark splash of dust and scuffed plates
    M.marks.forEach(k => { const a = clamp((k.life - k.t) / 1.5, 0, 1) * 0.55; c.save(); c.globalAlpha = a; K.shade(c, sx(k.x), sy(k.y) + T * 0.1, T * (k.big ? 3.2 : 2.2), T * (k.big ? 1.4 : 1.0), 0.5, '#12060E'); c.restore(); });
    // the throat's light pooled on the plates under it
    const J = M.J; if (J && (M.inf || 0) > 0.4 && !M.end) { const s = J.sac.c, X = sx(s[0]), Y = sy(s[1]) + T * 0.2, r = T * (1.6 + J.sac.k * 1.6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22 * (M.inf || 0); blitSized(c, glowSprite(CORAL), X - r, Y - r * 0.5, r * 2, r); c.restore(); }
    const P = M.P; if (!P) return;
    const next = P.steps.find(s => !s.done);
    // a lane that has sung is safe for the rest of the phrase: a soft pale wash and SAFE along it
    P.steps.filter(s => s.done).forEach(s => { const h = mod.horns[s.i], L = sx(h.lane.x0), R = sx(h.lane.x1), Tp = sy(PL.y0), B = sy(PL.y1); c.save(); c.fillStyle = rgba(SAFE, 0.07 + (s === P.steps.filter(q => q.done).pop() ? 0.05 : 0)); c.fillRect(L + 3, Tp + 3, R - L - 6, B - Tp - 6);
      for (let y = PL.y0 + 6; y < PL.y1 - 1; y += 7) lab(c, sx((h.lane.x0 + h.lane.x1) / 2), sy(y), 'SAFE', SAFE, T, 0.34); c.restore(); });
    // the next lane: its wedge's shelter, glowing behind it; the number repeated down the lane; its countdown beside the pet
    if (next) { const h = mod.horns[next.i], w = mod.wedges[next.i], left = Math.max(0, next.at - P.t);
      if (w) { const X0 = sx(w.x - 1.45), Y0 = sy(w.y + 1.0), Wd = 2.9 * T, Hh = 7 * T; c.save(); const gr = c.createLinearGradient(0, Y0, 0, Y0 + Hh); gr.addColorStop(0, rgba(SAFE, 0.3 + 0.12 * pu)); gr.addColorStop(1, rgba(SAFE, 0.02)); c.fillStyle = gr; c.fillRect(X0, Y0, Wd, Hh); c.setLineDash([T * 0.25, T * 0.2]); c.strokeStyle = rgba(SAFE, 0.75); c.lineWidth = 2; c.strokeRect(X0, Y0, Wd, Hh); c.setLineDash([]); lab(c, sx(w.x), sy(w.y + 2.6), 'SHELTER', SAFE, T, 0.3); c.restore(); }
      for (let y = PL.y0 + 9.5; y < PL.y1 - 1; y += 7) lab(c, sx((h.lane.x0 + h.lane.x1) / 2), sy(y), String(next.n), '#FFFFFF', T, 0.62);
      if (mod.inLane(me.x, me.y, next.i)) lab(c, sx(me.x), sy(me.y) + T * 0.9, left.toFixed(1), mod.sheltered(me.x, me.y, next.i) ? SAFE : '#FFFFFF', T, 0.46); }
    // the other lanes still to come: their numbers, fainter
    P.steps.forEach(s => { if (s.done || s === next) return; const h = mod.horns[s.i]; for (let y = PL.y0 + 13; y < PL.y1 - 1; y += 7) lab(c, sx((h.lane.x0 + h.lane.x1) / 2 + 2.6), sy(y), String(s.n), rgba('#FFC8C0', 0.85), T, 0.4); }); }

  /* ---------- in the air: the horns' numbers and the score, the sung waves, labels; the fallen body at the end ---------- */
  function drawAir(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M || !M.stat || !M.mod) return; const sx = FX.sx, sy = FX.sy, mod = M.mod, PL = mod.platform;
    // the waves of song: rings rolling down a lane from its horn as it fires; rings from the throat
    M.waves.forEach(w => { const u = w.t / (w.big ? 1.2 : 0.8); c.save(); c.globalCompositeOperation = 'lighter';
      if (w.horn != null) { const h = mod.horns[w.horn], X = sx(h.x), y = PL.y0 + u * (PL.y1 - PL.y0), Y = sy(y), hw = (h.lane.x1 - h.lane.x0) / 2 * T; for (let k = 0; k < 3; k++) { const yy = Y - k * T * 1.2; c.globalAlpha = (1 - u) * (0.55 - k * 0.15); c.strokeStyle = k ? CORAL_HI : HOT; c.lineWidth = Math.max(2, T * (0.18 - k * 0.04)); c.beginPath(); c.ellipse(X, yy, hw * 0.95, T * 0.9, 0, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); } }
      else { const X = sx(w.x), Y = sy(w.y) - w.z * T; for (let k = 0; k < 3; k++) { const r = T * (0.6 + u * 5 - k * 0.8); if (r <= 0) continue; c.globalAlpha = (1 - u) * 0.5; c.strokeStyle = CORAL_HI; c.lineWidth = Math.max(1.5, T * 0.08); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke(); } }
      c.restore(); });
    if (m.dead && M.end) drawVeyra(c, FX, m, sx(m.x), sy(m.y), T, t);
    const P = M.P;
    // each horn: the number(s) it will sing, over its mouth, with the countdown of the next; a hushed horn's closed mouth
    if (P && !m.dead) { const next = P.steps.find(s => !s.done);
      mod.horns.forEach((h, i) => { const X = sx(h.x), Y = sy(h.y + 0.2) - T * 3.6 * 0.62 - T * 1.15, mine = P.steps.filter(s => s.i === i && !s.done);
        if (P.hushed === i) { CHO.badge(c, X, Y, T * 1.0, '', null, BONE_HI); CHO.hushIcon(c, X, Y, T * 0.62, BONE_HI, Math.max(2, T * 0.07)); lab(c, X, Y - T * 0.85, 'HUSHED', BONE_HI, T, 0.28); return; }
        mine.forEach((s, k) => { const isN = s === next, sz = T * (isN ? 1.05 : 0.82), xx = X + (k - (mine.length - 1) / 2) * T * 1.1; CHO.badge(c, xx, Y, sz, s.n, clamp((s.at - P.t) / s.at, 0, 1), isN ? WARN : rgba(WARN, 0.7)); if (s.stolen) lab(c, xx, Y - sz * 0.85, 'STOLEN', CORAL_HI, T, 0.26); }); });
      // the score: the phrase's notes in order, over the arch, the next one bright
      const X0 = sx(mod.arch.x), Y0 = sy(mod.arch.y) - T * 5.4, cw = T * 1.25; c.save(); c.fillStyle = 'rgba(20,8,16,.72)'; c.strokeStyle = rgba(GOLD_HI, 0.75); c.lineWidth = 2; const bw = cw * P.steps.length + T * 0.4; c.beginPath(); c.roundRect ? c.roundRect(X0 - bw / 2, Y0 - T * 0.65, bw, T * 1.3, T * 0.3) : c.rect(X0 - bw / 2, Y0 - T * 0.65, bw, T * 1.3); c.fill(); c.stroke();
      P.steps.forEach((s, k) => { const x = X0 - bw / 2 + T * 0.2 + cw * (k + 0.5), isN = s === next, col = s.done ? 'rgba(200,190,180,.45)' : isN ? '#FFF2D6' : GOLD_HI; CHO.symbol(c, x + T * 0.12, Y0, T * 0.62, s.sym, col, Math.max(1.5, T * 0.06)); lab(c, x - T * 0.36, Y0 - T * 0.3, String(s.n), s.done ? 'rgba(200,190,180,.6)' : isN ? '#FFFFFF' : '#FFD6CC', T, 0.3); }); c.restore(); }
    // the moth's flight to its horn: a dashed coral thread
    const mo = M.moth; if (mo && !mo.dead && mo.veyCtl && mo.veyCtl.st === 'fly') { c.save(); c.setLineDash([T * 0.2, T * 0.18]); c.lineDashOffset = -t * T * 2; c.strokeStyle = rgba(CORAL_HI, 0.75); c.lineWidth = 2; c.beginPath(); c.moveTo(sx(mo.x), sy(mo.y) - T * 0.8); c.lineTo(sx(mo.veyCtl.tx), sy(mo.veyCtl.ty) - T * 0.8); c.stroke(); c.restore(); }
    if (m.dead || !M.J) return;
    const top = sy(m.y) - (M.J.O[2] + ((M.g || 0) < 0.5 ? 1.2 : 2.6)) * T, X0 = sx(m.x);
    if (P) { const next = P.steps.find(s => !s.done); lab(c, X0, sy(m.y) + T * 1.0, next ? `ANTIPHON · ${next.n} of 3` : 'ANTIPHON', CORAL_HI, T, 0.4); if ((M.inf || 0) > 0.6) lab(c, X0, sy(m.y) + T * 1.5, 'THROAT ×1.5', HOT, T, 0.3); }
    if (m.stunT > 0 && M.stunKind === 'land') { lab(c, X0, top, `DOWN ${m.stunT.toFixed(1)}s`, '#FFFFFF', T, 0.46); lab(c, X0, top + T * 0.55, 'STRIKE ×1.75', HOT, T, 0.32); }
    if (M.Cn && M.Cn.st === 'wind') lab(c, sx(m.x + Math.cos(M.Cn.a) * 4), sy(m.y + Math.sin(M.Cn.a) * 4), 'WING CONE · get to its side', WARN, T, 0.34); }

  /* ---------- the Pipe Bridge: the platform of riveted maroon plates over the dark, its bone conduits and gold trim ---------- */
  function paintBridge(c, A2) { const rnd = A2.rnd, HW = 16, HH = 14;
    // the dark below, and the great pipes running under the platform into it
    c.fillStyle = '#0B0509'; c.fillRect(-18, -18, 36, 36);
    for (const [x, w, col] of [[-12.5, 2.2, '#2A1626'], [-4, 1.6, '#3A2A2A'], [5.5, 2.4, '#2A1626'], [13, 1.8, '#3A2A2A']]) { const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, shadeC(col, -0.3)); g.addColorStop(0.35, shadeC(col, 0.3)); g.addColorStop(1, shadeC(col, -0.5)); c.fillStyle = g; c.fillRect(x - w / 2, -18, w, 36); for (let y = -17; y < 18; y += 3.2) { c.fillStyle = rgba(GOLD_D, 0.5); c.fillRect(x - w / 2 - 0.08, y, w + 0.16, 0.22); } }
    const fog = c.createLinearGradient(0, -18, 0, 18); fog.addColorStop(0, 'rgba(11,5,9,.55)'); fog.addColorStop(0.5, 'rgba(11,5,9,.2)'); fog.addColorStop(1, 'rgba(11,5,9,.6)'); c.fillStyle = fog; c.fillRect(-18, -18, 36, 36);
    // the platform's shadow on the dark, and its side (a thick bone-banded edge)
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(-HW + 0.4, -HH + 0.6, HW * 2, HH * 2 + 0.4); c.fillStyle = '#1D0E1A'; c.fillRect(-HW, HH, HW * 2, 0.7); c.fillStyle = rgba(GOLD_D, 0.7); c.fillRect(-HW, HH + 0.12, HW * 2, 0.08);
    // the plates: 2 m squares of maroon, each its own tone, a lit upper-left edge, a dark lower-right, gold rivets at the corners
    const PLT = ['#6A5260', '#634B59', '#705866', '#5F4855', '#6C5462', '#5A4450'];   // (dusty mauve plates, pale enough that the maroon wings stand off them)
    for (let y = -HH; y < HH; y += 2) for (let x = -HW; x < HW; x += 2) { c.fillStyle = PLT[Math.floor(rnd() * PLT.length)]; c.fillRect(x + 0.05, y + 0.05, 1.9, 1.9);
      c.fillStyle = 'rgba(255,220,235,.07)'; c.fillRect(x + 0.05, y + 0.05, 1.9, 0.09); c.fillRect(x + 0.05, y + 0.05, 0.09, 1.9); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + 0.05, y + 1.86, 1.9, 0.09); c.fillRect(x + 1.86, y + 0.05, 0.09, 1.9);
      for (const [rx2, ry2] of [[0.28, 0.28], [1.72, 0.28], [0.28, 1.72], [1.72, 1.72]]) { c.fillStyle = GOLD_D; c.beginPath(); c.arc(x + rx2, y + ry2, 0.09, 0, TAU); c.fill(); c.fillStyle = rgba(GOLD_HI, 0.8); c.beginPath(); c.arc(x + rx2 - 0.025, y + ry2 - 0.025, 0.04, 0, TAU); c.fill(); }
      if (rnd() < 0.22) { let px = x + 0.3 + rnd() * 1.4, py = y + 0.3 + rnd() * 1.4; c.strokeStyle = 'rgba(14,6,12,.35)'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(px, py); for (let j = 0; j < 3; j++) { px += (rnd() - 0.5) * 0.6; py += (rnd() - 0.5) * 0.6; c.lineTo(px, py); } c.stroke(); } }
    // the three lanes' breath channels, sunk in the plates under each horn: a dark slot ribbed with bone, a thread of coral down it
    for (const lx of [-10.1, 0.5, 11.1]) { c.fillStyle = 'rgba(12,4,10,.55)'; c.fillRect(lx - 0.34, -HH + 1.9, 0.68, HH * 2 - 2.2); c.fillStyle = 'rgba(218,143,134,.16)'; c.fillRect(lx - 0.06, -HH + 1.9, 0.12, HH * 2 - 2.2);
      c.fillStyle = 'rgba(255,220,235,.08)'; c.fillRect(lx - 0.34, -HH + 1.9, 0.68, 0.06);
      for (let y = -HH + 2.6; y < HH - 0.4; y += 1.0) { c.fillStyle = rgba(BONE_D, 0.55); c.fillRect(lx - 0.36, y, 0.72, 0.12); c.fillStyle = rgba(BONE_HI, 0.25); c.fillRect(lx - 0.36, y, 0.72, 0.035); } }
    // grilles over the dark at the horns' feet along the north edge
    for (const lx of [-10.1, 0.5, 11.1]) { c.fillStyle = '#140A12'; c.fillRect(lx - 2.6, -HH + 0.3, 5.2, 1.6); c.strokeStyle = GOLD_D; c.lineWidth = 0.08; for (let x = lx - 2.4; x <= lx + 2.4; x += 0.4) { c.beginPath(); c.moveTo(x, -HH + 0.35); c.lineTo(x, -HH + 1.85); c.stroke(); } c.strokeStyle = GOLD; c.lineWidth = 0.12; c.strokeRect(lx - 2.6, -HH + 0.3, 5.2, 1.6); }
    // under the arch: plates scuffed by its claws, a worn ring where it drops
    { const ay = -7.4 + 1.5; c.fillStyle = 'rgba(12,4,10,.3)'; c.beginPath(); c.ellipse(0.5, ay, 3.0, 1.6, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(217,201,165,.12)'; c.lineWidth = 0.05; for (let i = 0; i < 26; i++) { const a = rnd() * TAU, r0 = 0.6 + rnd() * 2.2, x = 0.5 + Math.cos(a) * r0, y = ay + Math.sin(a) * r0 * 0.55; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 0.35, y + Math.sin(a) * 0.2); c.stroke(); } }
    // the gold trim round the edge, bone curbs on it
    c.strokeStyle = '#1D0E1A'; c.lineWidth = 0.5; c.strokeRect(-HW + 0.15, -HH + 0.15, HW * 2 - 0.3, HH * 2 - 0.3); c.strokeStyle = GOLD; c.lineWidth = 0.18; c.strokeRect(-HW + 0.25, -HH + 0.25, HW * 2 - 0.5, HH * 2 - 0.5); c.strokeStyle = rgba(GOLD_HI, 0.6); c.lineWidth = 0.05; c.strokeRect(-HW + 0.2, -HH + 0.2, HW * 2 - 0.4, HH * 2 - 0.4);
    for (let x = -HW + 1; x < HW; x += 4) for (const y of [-HH + 0.25, HH - 0.25]) { c.fillStyle = BONE_D; c.fillRect(x, y - 0.18, 1.2, 0.36); c.fillStyle = rgba(BONE_HI, 0.7); c.fillRect(x, y - 0.18, 1.2, 0.08); }
    // the short bridge in from the Breathworks, at the south edge
    c.fillStyle = '#2A1626'; c.fillRect(-1.6, HH, 3.2, 4); for (let y = HH + 0.2; y < HH + 4; y += 0.6) { c.fillStyle = y % 1.2 < 0.6 ? '#4A2A40' : '#3C2134'; c.fillRect(-1.5, y, 3.0, 0.5); } c.fillStyle = GOLD_D; c.fillRect(-1.7, HH, 0.12, 4); c.fillRect(1.58, HH, 0.12, 4);
    // grime and dust
    for (let i = 0; i < 1600; i++) { const x = (rnd() - 0.5) * HW * 2, y = (rnd() - 0.5) * HH * 2; c.fillStyle = rnd() < 0.5 ? `rgba(255,220,235,${0.04 + rnd() * 0.06})` : `rgba(10,4,8,${0.08 + rnd() * 0.12})`; c.fillRect(x, y, 0.04 + rnd() * 0.05, 0.04 + rnd() * 0.05); }
    // the light: warmer to the north where the horns breathe, darker to the south
    const lg = c.createLinearGradient(0, -HH, 0, HH); lg.addColorStop(0, 'rgba(218,143,134,.08)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(10,4,8,.25)'); c.fillStyle = lg; c.fillRect(-HW, -HH, HW * 2, HH * 2); }
  // the cavern beyond: a maroon dark, giant hollow pipes (columns, arches, spirals) vanishing upward, their mouths breathing coral
  function paintCavern(c, W, H, T) { const R = mulberry32(7311); let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#08040A'); g.addColorStop(0.5, '#1A0C17'); g.addColorStop(1, '#0B0509'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); for (let i = 0; i < 9; i++) { const x = W * (i + 0.5) / 9 + (R() - 0.5) * 20, w = 18 + R() * 22, top = -10, bot = H * (0.55 + R() * 0.4); g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#140A12'); g.addColorStop(0.3, i % 3 ? '#3A2234' : '#4A4034'); g.addColorStop(1, '#0E070C'); c.globalAlpha = 0.55 + R() * 0.3; c.fillStyle = g; c.fillRect(x - w / 2, top, w, bot - top);
      for (let k = 0; k < 4; k++) { c.fillStyle = 'rgba(165,138,78,.35)'; c.fillRect(x - w / 2 - 1, top + (bot - top) * (0.2 + k * 0.2), w + 2, 3); }
      c.globalAlpha = 0.5; c.globalCompositeOperation = 'lighter'; blitSized(c, glowSprite(CORAL), x - w, bot - w * 0.6, w * 2, w * 1.2); c.globalCompositeOperation = 'source-over'; }
    c.globalAlpha = 0.35; c.strokeStyle = '#3A2234'; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const x = W * (0.2 + i * 0.3), y = H * (0.18 + R() * 0.1), r = 40 + R() * 40; c.lineWidth = 12 + R() * 8; c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.stroke(); }
    for (let i = 0; i < 2; i++) { const x = W * (0.12 + i * 0.76), y = H * 0.32; c.lineWidth = 9; c.beginPath(); for (let k = 0; k <= 60; k++) { const u = k / 60, a = u * TAU * 2.2, r = 50 * (1 - u * 0.8); k ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.stroke(); }
    c.globalAlpha = 1; for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(246,189,178,${0.06 + R() * 0.18})`; c.beginPath(); c.arc(R() * W, R() * H, 0.6 + R() * 1.1, 0, TAU); c.fill(); } c.restore(); }
})());
/* the hush moth Veyra sends to steal a note is flown by the boss while it carries the note (veyCtl): its own wandering waits */
(() => { const base = DunAI.mon.hushmoth; if (!base || base.veyra) return; const f = function (m, A, X) { if (m.veyCtl) return; return base.apply(this, arguments); }; f.veyra = true; DunAI.mon.hushmoth = f; })();
