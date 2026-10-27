/* ---------- KH'AAL THE HULL-EATER ----------
   The Yuggoth Engine's first boss, in the Breach: a 26 m section of hull torn open on the plain, gunmetal deck plates
   riveted edge to edge and jagged where they tore, the violet void crackling beyond the rim. Four charge cells stand
   about the deck in their sockets (each is replaced a while after it bursts).
   Kh'aal is a colossal fungal crustacean scavenger, six metres across: a broad carapace of torn hull plates fused and
   riveted into its shell, violet current glowing in the seams and a frill of pink fungus along its edge; six jointed
   legs of black chitin it sidles on in a crab's gait; two great claws that do not match, a heavy crushing hammer-claw
   and a long scissor shear-claw; a ridged, pulsing brain-lobe for a head whose glow shifts teal, violet and amber; and
   ragged pink fungal wings folded on its back.
   Plate Shield: it tears a plate up out of the deck and holds it before it in the shear-claw; blows from the front
   glance off (an arc on the deck shows the guarded side): get round behind it, it turns slowly while it holds it.
   Hammer Slam (a shown circle, twice in phase two), Shear Sweep (a shown cone), Slag Spit (lanes of molten slag that
   leave burning pools for a few seconds).
   THE CHARGE CELLS: break one while Kh'aal stands inside its blast ring (drawn round every cell, lit when it is in
   range) and the discharge jolts it: STAGGERED, its plate dropped, its brain-lobe bare (a weak point) for five seconds.
   Its own blows break the cells too: lure a slam, a sweep or a dive onto one.
   Phase two: the fungal wings unfold. Wing Dive: it hops high and dive-bombs a shown circle. Devour: it walks to a
   charge cell and starts to eat it (a meter fills); pop the cell first (it is right beside it: the jolt staggers it),
   or it OVERCHARGES: glowing with stolen current, faster in everything, until the charge runs out or a jolt burns it
   out. Spark mites and hull wings drift in (and the cells' lightning chains through them).
   It is never still: legs stepping in tripods, claws flexing and clacking, the brain-lobe pulsing, sparks crawling over
   the plates; it recoils when struck. */
RiftFiend.define({ id: 'khaal', name: 'Kh\'aal', title: 'The Hull-Eater', color: '#2A2F3E', glow: '#E8B8FF', accent: '#B8FFF2', biome: 'wreckfield', r: 2.8, els: ['spark', 'dark'], phases: 2 }, (() => {
  const { TAU, TN, sorted, hit } = RiftFiend, tubeLite = TN.tubeLite;
  const { INK, HULL, HULL_HI, VIOLET, VIOLET_HI, TEAL, TEAL_HI, AMBER, FLESH, FUNGUS } = YUG;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const lerp3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const easeOut = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3), smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const mix = (a, b, u) => DunFiend.KIT.mixC(a, b, clamp(u, 0, 1));
  // the painter's palette
  const CH = '#2E2540', CH_SH = '#150F1E', CH_HI = '#6A5A8A', PLATE = ['#68718E', '#747E9C', '#5E6684', '#6E6890', '#7E88A8'], PL_SH = '#3C4258', PL_HI = '#AEB8D6';
  const SLAG = '#FF7A2E', SLAG_HI = '#FFD27A', BRAIN = '#F0A8D0', BRAIN_SH = '#B0608E', BRAIN_HI = '#FFE2F2', WING = '#E88AC0', WING_SH = '#A9578A', WING_HI = '#FFC8E4';
  /* the Breach: 26 m across; the four charge-cell sockets; the blast ring of a cell, and how near its centre Kh'aal must
     stand to be jolted (the ring reaching its body) */
  const AR = 13, BLAST = 4.5, JOLT_D = BLAST + 1.2, CHAIN = 6.5, SLOTS = [[-6.5, -1.4], [6.5, -1.4], [-4.7, 5.1], [4.7, 5.1]];
  /* the body (u forward, v left, h up; metres): the carapace's dome over its rim, the six legs' shoulders and resting
     feet (front, middle, back on each side; the hammer on its right, -v, the shear on its left, +v), the guarded arc */
  const RIM = 1.3, DA = 1.7, DB = 2.5, DZ = 0.9, LEG_U = [0.95, 0.05, -0.9], FOOT_U = [2.1, 0.35, -1.6], FOOT_V = [3.35, 3.85, 3.45], SHIELD_ARC = 1.25;
  // the hull-shard spines jutting flat from the rim (angle from the front, length past the rim, half width)
  const SPINES = [[0.5, 0.26, 0.11], [1.15, 0.36, 0.13], [1.72, 0.32, 0.12], [2.3, 0.24, 0.12]];
  // the plates of the shell: rings of panels over the dome (radius bands, sectors), each with its own tint
  const PANELS = (() => { const R = mulberry32(611), out = [{ r0: 0, r1: 0.32, a0: 0, a1: TAU, n: 1 }], rings = [[0.32, 0.66, 6], [0.66, 1.0, 11]];
    out[0].col = PLATE[0]; rings.forEach(([r0, r1, n], k) => { const off = R() * 0.6; for (let i = 0; i < n; i++) out.push({ r0, r1, a0: off + i / n * TAU, a1: off + (i + 1) / n * TAU, col: PLATE[Math.floor(R() * PLATE.length)], torn: k === 1 && i === 2, fungus: (k === 1 && i === 5) || (k === 0 && i === 1) || (k === 1 && i === 9), jit: R() }); });
    return out; })();
  // a ragged membrane wing in its own plane: (s along the span, q back along the chord)
  const WG = [[0, 0], [0.25, -0.05], [0.5, -0.07], [0.75, -0.04], [0.95, 0.04], [1.0, 0.17], [0.88, 0.34], [0.85, 0.54], [0.74, 0.38], [0.66, 0.74], [0.57, 0.54], [0.47, 0.94], [0.38, 0.7], [0.28, 1.04], [0.18, 0.8], [0.08, 0.98], [0, 0.62]];
  // the folds of the brain-lobe: meandering ridges in its unit disc
  const GYRI = (() => { const R = mulberry32(431), out = []; for (let k = 0; k < 15; k++) { const a = R() * TAU, r = Math.sqrt(R()) * 0.7; let x = Math.cos(a) * r, y = Math.sin(a) * r, d = R() * TAU; const L = [[x, y]]; for (let j = 0; j < 8; j++) { d += (R() < 0.5 ? 1 : -1) * (0.9 + R() * 1.1); x += Math.cos(d) * 0.13; y += Math.sin(d) * 0.12; if (x * x + y * y > 0.78) { d += Math.PI * 0.8; x *= 0.9; y *= 0.9; } L.push([x, y]); } out.push(L); } return out; })();
  const HOLES = [[0.62, 0.3, 0.06], [0.36, 0.52, 0.07], [0.8, 0.2, 0.045], [0.2, 0.62, 0.05]];
  return {
    arenaR: AR, firstAct: 'stalk', artY: 0.62, ambient: 'embers',
    artPoses: [{ name: 'stalking the deck', mem: {} }, { name: 'the plate shield raised', mem: { shieldK: 1, plateRise: 1 } }, { name: 'staggered: the brain-lobe bare', mem: { stagK: 1, alt: -0.55 } }, { name: 'wings unfolded', mem: { wingK: 1, flapAmp: 0.4 } }, { name: 'overcharged', mem: { wingK: 1, overT: 5, glowK: 1 } }],
    phaseNames: ['The Breach', 'The Breach', 'The Hull-Eater Takes Wing', 'The Hull-Eater Takes Wing'],
    paintGround(c, A) { paintFloor(c, A); },
    sky(c, W, H, t, cam, T, FX) { paintSky(c, W, H, t, cam, T, FX); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.noTouch = true; m.x = C.x; m.y = C.y - 3.6; m.act = 'enter';
      Object.assign(M, { bt: 0, hd: Math.PI / 2, hdTo: Math.PI / 2, alt: 4.5, altTo: 0, rear: 0, rearTo: 0, menace: 0, recoil: 0, roar: 0, hitK: 0, pulse: 0, shx: 0, shy: 0, vx: 0, vy: 0, px: m.x, py: m.y, spd: 0, odir: 1,
        feet: null, step: null, stepT: 0, fidT: 1.5, stepBob: 0, hamK: 0, hamS: 0, hamT: null, hamOpen: 0.2, shPsi: 0.3, shPsiTo: 0.3, shOpen: 0.3, shOpenTo: 0.3, dig: 0, grab: 0, grabAt: null, mouth: 0,
        shield: null, shieldK: 0, plateRise: 0, shieldCd: 4, blockT: 0, clang: 0, wingK: 0, wingTo: 0, wingBeat: 0, flapAmp: 0, overT: 0, glowK: 0, stagK: 0,
        slots: SLOTS.map(([dx, dy], i) => ({ i, x: C.x + dx, y: C.y + dy, cell: null, t: 0, rise: 1 })), drops: [], holes: [], craters: [], zaps: [], globs: [],
        sl: null, sw: null, sp: null, hop: null, dv: null, pl: null, seen: {}, last: null, nextAct: null, hopCd: 0, devCd: 0, broodT: 8, wasStun: false, wasEnter: true, roared: false, landed: false, taught: false, stunKind: null, farT: 0 });
      M.slots.forEach(s => spawnCell(FX, s, true)); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; clearActs(FX, m, M); m.stunT = 0; M.roar = 1; M.menace = 1; M.recoil = 0.6; M.wingTo = 1; M.hopCd = 1.2; M.devCd = 5; M.broodT = 3;
      if (M.shield) dropShield(FX, m, M, 'toss'); M.shieldCd = 9;
      FX.H.shake(12, 0.6); FX.H.flash(0.22, FUNGUS); FX.H.sfx.crash(); FX.H.sfx.whoosh(); FX.H.ring(m.x, m.y, 0.5, 8, 0.9, FUNGUS, 0.4);
      FX.H.after(0.9, () => FX.H.banner('THE WINGS UNFOLD', 'Kh\'aal takes to the air and dive-bombs shown circles, and it tries to EAT the charge cells: pop them first', FUNGUS, 3.0, true)); },
    ai(FX, m, dt) {
      const M = FX.mem, F = fk(FX, M); m.actT += dt; m.noTouch = true;
      let menace = 0; M.hdTo = FX.angPet(m.x, m.y);
      switch (m.act) {
        case 'stalk': { stalk(FX, m, M, dt, F); menace = 0.2; M.altTo = 0;
          if (FX.S.lv >= 3 && (M.broodT -= dt) <= 0) { M.broodT = 14; const n = FX.H.mons.filter(q => !q.dead && !q.boss && !q.fobj && (q.type === 'sparkmite' || q.type === 'hullwing' || q.type === 'coilsentry')).length; if (n < 3) { callMinion(FX, m, 'sparkmite'); if (n < 2) callMinion(FX, m, 'hullwing'); FX.H.text(FX.me.x, FX.me.y - 2, 'The brood drifts in', FUNGUS, 13); } }
          if (m.actT > 1.1 / F) { m.actT = 0; if (Math.random() < 0.3) M.odir = -M.odir; choose(FX, m); } break; }
        case 'plate': menace = plateStep(FX, m, M, dt, F); break;
        case 'slam': menace = slamStep(FX, m, M, dt, F); break;
        case 'sweep': menace = sweepStep(FX, m, M, dt, F); break;
        case 'spit': menace = spitStep(FX, m, M, dt, F); break;
        case 'hop': menace = hopStep(FX, m, M, dt, F); break;
        case 'devour': menace = devourStep(FX, m, M, dt, F); break;
        default: toIdle(m, M);
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.menace = decay(M.menace, dt, 4); m.noTouch = true; const P = pose(m, M);
      FX.weak('brain', P.head[0], P.head[1] - P.head[2], 1.25, 2.3, m.stunT > 0.05);
      // the current still crawling through it: arcs over the shell, the legs kicking, the claws twitching
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.14 + Math.random() * 0.1; const a = Math.random() * TAU, q = P.W(Math.cos(a) * DA * 0.8, Math.sin(a) * DB * 0.8, RIM + 0.6); FX.H.sparks(q[0], q[1] - q[2], Math.random() < 0.5 ? VIOLET_HI : '#FFFFFF', 4, 4); if (Math.random() < 0.25) FX.H.shake(1.5, 0.08); M.hamOpen = Math.random(); M.shOpen = Math.random() * 0.8; }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.slots) return; M.bt += dt; const stun = m.stunT > 0;
      if (!stun) { if (FX.S.weak.brain) FX.weak('brain', 0, 0, 0, 0, false);
        if (M.wasStun) { M.wasStun = false; M.recoil = 0.8; M.roar = 0.7; M.stunKind = null; M.shieldCd = Math.max(M.shieldCd, 4); FX.H.text(m.x, m.y - 4.2, 'It shakes off the jolt', VIOLET_HI, 13); FX.H.sfx.thud(); FX.H.shake(5, 0.2); } }
      else M.wasStun = true;
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.6); M.hitK = decay(M.hitK, dt, 4); M.pulse = decay(M.pulse, dt, 1.6); M.clang = decay(M.clang, dt, 3); M.blockT -= dt;
      M.shieldCd -= dt; M.hopCd -= dt; M.devCd -= dt;
      // the entrance: it drops out of the dark onto the deck, the plates buckle, the claws flare and the brain-lobe lights
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.alt = Math.max(0, 4.5 * (1 - easeOut(e / 1.45))); if (e > 1.45 && !M.landed) { M.landed = true; M.alt = 0; FX.H.shake(14, 0.5); FX.H.sfx.crash(); FX.H.sfx.thud(); FX.H.boom(m.x, m.y, 3, VIOLET, '#FFFFFF', { n: 30, shake: 12, smoke: 10 }); M.craters.push(crater(m.x, m.y + 0.4)); M.recoil = 0.7; }
        if (e > 1.9 && !M.roared) { M.roared = true; M.roar = 1; M.pulse = 1; FX.H.sfx.hum(); FX.H.ring(m.x, m.y, 0.3, 7, 1, VIOLET_HI, 0.4); } }
      else if (M.wasEnter) { M.wasEnter = false; M.alt = 0; FX.H.sfx.whoosh(); }
      // the first lesson: the cells and their blast rings
      if (!M.taught && m.act !== 'enter' && FX.S.t > 9) { M.taught = true; FX.H.banner('CHARGE CELLS', 'Break a cell while Kh\'aal stands in its blast ring: the jolt STAGGERS it and bares its brain-lobe', TEAL_HI, 3.2, true); }
      // the shield: held for a while, then flung aside
      if (M.shield) { M.shield.age += dt; if (M.shield.age > M.shield.life && m.act === 'stalk' && !stun) dropShield(FX, m, M, 'toss'); }
      M.shieldK = toward(M.shieldK, M.shield ? 1 : 0, dt, M.shield ? 8 : 6); if (M.shield) M.plateRise = 1; else if (m.act !== 'plate') M.plateRise = decay(M.plateRise, dt, 3);
      // the overcharge: stolen current, running out
      if (M.overT > 0) { M.overT -= dt; if (M.overT <= 0) { M.overT = 0; FX.H.text(m.x, m.y - 4.2, 'Its stolen charge gutters out', VIOLET_HI, 13); FX.H.sparks(m.x, m.y - 2, VIOLET_HI, 16, 6); } else if (Math.random() < dt * 18) { const a = Math.random() * TAU; FX.H.part({ kind: 'spark', x: m.x + Math.cos(a) * 2.2, y: m.y + Math.sin(a) * 1.2 - 2, vx: Math.cos(a) * 2, vy: -2, life: 0.4, max: 0.4, size: 2.5, color: Math.random() < 0.5 ? VIOLET_HI : '#FFFFFF' }); } }
      M.glowK = toward(M.glowK, M.overT > 0 ? 1 : 0, dt, 3);
      updCells(FX, m, M, dt); updBody(FX, m, M, dt, stun);
      // the deck's marks fading
      M.drops.forEach(d => d.t += dt); M.drops = M.drops.filter(d => d.t < 10); M.holes.forEach(d => d.t += dt); M.holes = M.holes.filter(d => d.t < 14); M.craters.forEach(d => d.t += dt); M.craters = M.craters.filter(d => d.t < 3);
      M.zaps.forEach(z => z.t += dt); M.zaps = M.zaps.filter(z => z.t < z.life); M.globs.forEach(g => g.t += dt); M.globs = M.globs.filter(g => g.t < g.d); },
    dmgK(FX, m) { const M = FX.mem; if (!M) return 1; M.recoil = Math.max(M.recoil || 0, 0.35); M.hitK = 1;
      // the plate: from the front, blows glance off it
      if (M.shield && M.shieldK > 0.6 && !(m.stunT > 0)) { const me = FX.me, a = Math.atan2(me.y - m.y, me.x - m.x); if (Math.abs(angTo(M.hd, a)) < SHIELD_ARC) { M.clang = 1;
        if (M.blockT <= 0) { M.blockT = 1.1; const p = pose(m, M).plateC; FX.H.sparks(p[0], p[1] - p[2], '#FFFFFF', 6, 5); FX.H.text(p[0], p[1] - p[2] - 1.2, 'Shielded! Get behind it', '#E8ECF8', 12); FX.H.sfx.crack(); }
        return 0.15; } }
      return 1; },
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.slots || m.dead || m.act === 'enter') return null; const x = m.x, y = m.y - 1.6 - Math.min(5, Math.max(0, M.alt || 0)) * 0.5, d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(0.38, 3.2 / d) }; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { Y += (m.z || 0) * T * 4; drawKhaal(c, FX, m, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'cell') drawCell(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawAir(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function fk(FX, M) { return FX.S.fast * (M && M.overT > 0 ? 1.4 : 1); }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.2 : 1.1, true); }
  function toIdle(m, M) { m.act = 'stalk'; m.actT = 0; M.sl = null; M.sw = null; M.sp = null; M.hop = null; M.dv = null; M.pl = null; M.rearTo = 0; M.altTo = 0; M.grab = 0; M.dig = 0; M.shPsiTo = 0.3; M.shOpenTo = 0.3; }
  // (telegraphs are disarmed, not spliced out: one may be landing in the very loop that called this)
  function cancelTele(FX) { FX.S.tele.forEach(s => { s.dmg = 0; s.fn = null; s.done = true; s.linger = 0; }); }
  function clearActs(FX, m, M) { cancelTele(FX); M.hamK = 0; M.hamS = 0; M.flapAmp = 0; if (M.dv && M.dv.cell) M.dv.cell.grabbed = false; toIdle(m, M); }
  function choose(FX, m) { const M = FX.mem, P = FX.S.lv, d = FX.dist(m.x, m.y); let k = M.nextAct; M.nextAct = null; M.altTo = 0; M.rearTo = 0; M.hop = null;
    if (!k && !M.shield && M.shieldCd <= 0) k = 'plate';
    if (!k && P >= 3) { if (M.devCd <= 0 && M.overT <= 0 && liveCells(M).length) k = 'devour'; else if (M.hopCd <= 0 && M.last !== 'hop') k = 'hop'; }
    if (!k && !M.shield && d < 6.2 && M.last !== 'sweep' && Math.random() < 0.6) k = 'sweep';
    if (!k) k = M.last === 'slam' ? 'spit' : M.last === 'spit' ? 'slam' : (Math.random() < 0.55 ? 'slam' : 'spit');
    M.last = k; ({ plate: startPlate, slam: startSlam, sweep: startSweep, spit: startSpit, hop: startHop, devour: startDevour })[k](FX, m); }
  /* ---- the crab's walk: it sidles round the pet, facing it (it turns slowly while it holds a plate) ---- */
  function stalk(FX, m, M, dt, F) { const me = FX.me, a = Math.atan2(m.y - me.y, m.x - me.x) + 0.42 * M.odir, R = 4.4 + Math.sin(m.t * 0.6) * 0.6, p = FX.clampArena({ x: me.x + Math.cos(a) * R, y: me.y + Math.sin(a) * R }, 3.2); walk(FX, m, M, p.x, p.y, 2.3 * F, dt); }
  function walk(FX, m, M, tx, ty, spd, dt) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), v = Math.min(spd, d * 1.8), wx = d > 0.01 ? dx / d * v : 0, wy = d > 0.01 ? dy / d * v : 0;
    M.vx = toward(M.vx, wx, dt, 3); M.vy = toward(M.vy, wy, dt, 3); m.x += M.vx * dt; m.y += M.vy * dt; keepClear(FX, m, M); }
  function keepClear(FX, m, M) { const q = FX.clampArena(m, 3.0); m.x = q.x; m.y = q.y; M.slots.forEach(s => { const o = s.cell; if (!o || o.dead || (M.dv && M.dv.cell === o)) return; const dx = m.x - o.x, dy = m.y - o.y, d = Math.hypot(dx, dy) || 1; if (d < 2.3) { m.x = o.x + dx / d * 2.3; m.y = o.y + dy / d * 2.3; } }); }
  /* ---- Plate Shield: the claws dig into the deck and tear a plate up out of it; it holds it before itself ---- */
  function startPlate(FX, m) { const M = FX.mem, F = fk(FX, M), P = pose(m, M), at = P.Wg(2.8, 0, 0); m.act = 'plate'; m.actT = 0; M.pl = { age: 0, dur: 1.45 / F, up: false, x: at[0], y: at[1] }; M.plateRise = 0; FX.H.sfx.crack();
    say(FX, 'plate', 'PLATE SHIELD', 'It tears up a hull plate and holds it before it: blows from the front glance off. Get round behind it', VIOLET_HI); }
  function plateStep(FX, m, M, dt, F) { const L = M.pl; if (!L) { toIdle(m, M); return 0; } L.age += dt; const u = clamp(L.age / L.dur, 0, 1);
    M.dig = u < 0.75 ? smooth(u / 0.4) : 1 - (u - 0.75) / 0.25; M.plateRise = smooth((u - 0.2) / 0.65);
    if (Math.random() < dt * 30 && u < 0.8) { FX.H.sparks(L.x + FX.rnd(-1.4, 1.4), L.y, Math.random() < 0.5 ? AMBER : VIOLET_HI, 2, 4); FX.H.part({ kind: 'shard', x: L.x + FX.rnd(-1.2, 1.2), y: L.y, vx: FX.rnd(-3, 3), vy: FX.rnd(-5, -1), g: 10, life: 0.6, max: 0.6, size: 3, rot: Math.random() * 3, vr: 8, color: Math.random() < 0.5 ? HULL_HI : '#2A2F3E' }); }
    if (u > 0.55 && !L.up) { L.up = true; M.shield = { age: 0, life: (FX.S.lv >= 3 ? 9 : 13) }; M.holes.push({ x: L.x, y: L.y + 0.3, a: M.hd, t: 0 }); FX.H.shake(8, 0.35); FX.H.sfx.crash(); FX.H.boom(L.x, L.y, 1.6, HULL_HI, '#FFFFFF', { n: 14, shake: 6, smoke: 6 }); }
    if (L.age > L.dur + 0.3) { M.pl = null; M.dig = 0; toIdle(m, M); } return 0.8; }
  function dropShield(FX, m, M, how) { if (!M.shield && !(m.act === 'plate' && M.plateRise > 0.3)) return; const P = pose(m, M), p = P.plateC; M.shield = null; M.shieldK = 0; M.plateRise = 0;
    const side = how === 'toss' ? -1 : 0, q = FX.clampArena({ x: p[0] + Math.cos(M.hd + Math.PI / 2 * side) * 1.6, y: p[1] + Math.sin(M.hd + Math.PI / 2 * side) * 1.6 }, 1.2);
    M.drops.push({ x: q.x, y: q.y, rot: M.hd + FX.rnd(-0.6, 0.6), t: 0 }); M.shieldCd = how === 'toss' ? (FX.S.lv >= 3 ? 9 : 7) : 6;
    FX.H.sfx.crash(); FX.H.shake(6, 0.25); FX.H.sparks(q.x, q.y, '#FFFFFF', 10, 5); FX.H.text(q.x, q.y - 1.2, how === 'jolt' ? 'The plate falls' : 'Clang!', '#E8ECF8', 12); }
  /* ---- Hammer Slam: the crushing claw rises over the marked circle and drives down (twice, in phase two) ---- */
  function startSlam(FX, m) { const M = FX.mem; m.act = 'slam'; m.actT = 0; M.sl = { age: 0, n: FX.S.lv >= 3 ? 2 : 1, done: 0, hit: false, rec: 0 }; aimSlam(FX, m, M);
    say(FX, 'slam', 'HAMMER SLAM', 'The crushing claw rises over the marked circle: step out from under it', AMBER); }
  function aimSlam(FX, m, M) { const S = M.sl, F = fk(FX, M), a = FX.angPet(m.x, m.y), d = clamp(FX.dist(m.x, m.y), 2.8, 4.4), p = FX.clampArena({ x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d }, 1.4);
    Object.assign(S, { age: 0, hit: false, rec: 0, tx: p.x, ty: p.y, wait: (FX.S.lv >= 3 ? 0.82 : 0.95) / F * (S.done ? 0.85 : 1) }); M.hamT = [p.x, p.y]; FX.H.sfx.hum();
    FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 2.4, t: S.wait, dmg: m.dmg * 1.4, col: AMBER, fn: s => { S.hit = true; S.rec = 0; M.hamS = 1; FX.H.boom(s.x, s.y, 2.0, AMBER, '#FFFFFF', { n: 20, shake: 11, smoke: 8 }); FX.H.ring(s.x, s.y, 0.4, 3.4, 0.35, AMBER, 0.35); FX.H.sfx.crash(); FX.H.sfx.thud(); M.craters.push(crater(s.x, s.y)); M.alt = -0.25; M.recoil = 0.4; breakCells(FX, q => Math.hypot(q.x - s.x, q.y - s.y) < s.r + 0.6); } }); }
  function slamStep(FX, m, M, dt, F) { const S = M.sl; if (!S) { toIdle(m, M); return 0; } S.age += dt; M.hdTo = Math.atan2(S.ty - m.y, S.tx - m.x); walk(FX, m, M, m.x, m.y, 1, dt);
    if (!S.hit) { const u = clamp(S.age / S.wait, 0, 1); M.hamK = easeOut(u / 0.7); M.hamS = u > 0.86 ? (u - 0.86) / 0.14 : 0; M.hamOpen = toward(M.hamOpen, 0.9, dt, 6); return 1; }
    S.rec += dt; if (S.rec > 0.22) { M.hamK = toward(M.hamK, 0, dt, 5); M.hamS = toward(M.hamS, 0, dt, 5); } M.hamOpen = toward(M.hamOpen, 0.1, dt, 10);
    if (S.rec > 0.42 && S.done + 1 < S.n) { S.done++; aimSlam(FX, m, M); return 1; }
    if (S.rec > 0.75) { M.sl = null; M.hamK = 0; M.hamS = 0; toIdle(m, M); } return 0.5; }
  /* ---- Shear Sweep: the scissor-claw cocks back to its left and scythes across the marked arc ---- */
  function startSweep(FX, m) { const M = FX.mem, F = fk(FX, M), a = FX.angPet(m.x, m.y), wait = (FX.S.lv >= 3 ? 0.78 : 0.88) / F; if (M.shield) dropShield(FX, m, M, 'toss');
    M.sw = { age: 0, wait, a, struck: false }; m.act = 'sweep'; m.actT = 0; FX.H.sfx.hum();
    FX.tele({ shape: 'cone', x: m.x, y: m.y, a, len: 6.6, spread: 1.0, t: wait, dmg: m.dmg * 1.3, col: VIOLET_HI, fn: s => { M.sw && (M.sw.struck = true); FX.H.sfx.whoosh(); FX.H.shake(8, 0.3); for (let i = -3; i <= 3; i++) FX.H.part({ kind: 'slash', x: s.x + Math.cos(s.a + i * 0.3) * 4.6, y: s.y + Math.sin(s.a + i * 0.3) * 4.6, a: s.a + i * 0.3 + Math.PI / 2, r: 2.2, life: 0.3, max: 0.3, color: VIOLET_HI });
      breakCells(FX, q => { const d = Math.hypot(q.x - s.x, q.y - s.y); return d < s.len + 0.4 && Math.abs(angTo(s.a, Math.atan2(q.y - s.y, q.x - s.x))) < s.spread + 0.2; }); } });
    say(FX, 'sweep', 'SHEAR SWEEP', 'The long scissor-claw scythes the marked arc: back right off, or get behind it', VIOLET_HI); }
  function sweepStep(FX, m, M, dt) { const S = M.sw; if (!S) { toIdle(m, M); return 0; } S.age += dt; M.hdTo = S.a; walk(FX, m, M, m.x, m.y, 1, dt);
    if (!S.struck) { M.shPsiTo = 1.45; M.shOpenTo = 0.85; } else { M.shPsiTo = -1.2; M.shOpenTo = 0.04; }
    if (S.age > S.wait + 0.65) { M.sw = null; toIdle(m, M); } return S.struck ? 0.5 : 1; }
  /* ---- Slag Spit: it rears, its mouth glows, and it spits lanes of molten slag that burn where they land ---- */
  function startSpit(FX, m) { const M = FX.mem, F = fk(FX, M), P = FX.S.lv, a0 = FX.angPet(m.x, m.y), n = P >= 3 ? 5 : 3, spread = P >= 3 ? 0.32 : 0.4, wait = (P >= 3 ? 0.95 : 1.1) / F;
    const mx = m.x + Math.cos(a0) * 2.4, my = m.y + Math.sin(a0) * 2.4, lanes = [];
    for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * spread; let len = 1; while (len < 9 && FX.inArena(mx + Math.cos(a) * len, my + Math.sin(a) * len, 0.6)) len += 0.25; lanes.push({ a, len });
      FX.tele({ shape: 'line', x: mx, y: my, a, len, w: 1.25, t: wait, dmg: m.dmg * 1.15, col: SLAG, fn: s => { FX.hz({ shape: 'line', x: s.x, y: s.y, a: s.a, len: s.len, w: 1.3, life: 4.2, dps: m.dmg * 0.5, tick: 0.3, col: SLAG, seed: Math.floor(Math.random() * 1e4), draw: drawSlag }); FX.H.sparks(s.x + Math.cos(s.a) * s.len * 0.6, s.y + Math.sin(s.a) * s.len * 0.6, SLAG_HI, 8, 5);
        breakCells(FX, q => { const rx = q.x - s.x, ry = q.y - s.y, al = rx * Math.cos(s.a) + ry * Math.sin(s.a), of = Math.abs(-rx * Math.sin(s.a) + ry * Math.cos(s.a)); return al > -0.3 && al < s.len + 0.3 && of < 1.2; }); } }); }
    M.sp = { age: 0, wait, a0, lanes, mx, my, fired: false }; m.act = 'spit'; m.actT = 0; FX.H.sfx.hum();
    say(FX, 'spit', 'SLAG SPIT', 'It spits lanes of molten slag: they burn for a few seconds where they land. Keep off them', SLAG_HI); }
  function spitStep(FX, m, M, dt) { const S = M.sp; if (!S) { toIdle(m, M); return 0; } S.age += dt; M.hdTo = S.a0; walk(FX, m, M, m.x, m.y, 1, dt);
    M.rearTo = S.age < S.wait + 0.15 ? 1 : 0; M.mouth = Math.max(M.mouth, S.age < S.wait ? 0.4 + 0.6 * S.age / S.wait : 0);
    // the globs in the air in the last moment before they land
    if (!S.fired && S.age > S.wait - 0.42) { S.fired = true; FX.H.sfx.whoosh(); S.lanes.forEach(L => { for (let k = 0; k < 3; k++) M.globs.push({ x0: S.mx, y0: S.my, a: L.a, len: L.len * (0.45 + k * 0.27), t: -k * 0.04, d: 0.42 - k * 0.02 }); }); }
    if (S.age > S.wait + 0.6) { M.sp = null; toIdle(m, M); } return 1; }
  /* ---- Wing Dive (phase two): it crouches, its wings beat, it leaps high, finds the pet and dive-bombs a circle ---- */
  function startHop(FX, m) { const M = FX.mem, F = fk(FX, M); if (M.shield) dropShield(FX, m, M, 'toss'); M.hop = { age: 0, crouch: 0.45 / F, rise: 0.55, track: 0.85, wait: 0.9 / F, marked: false, hit: false, rec: 0, tx: m.x, ty: m.y }; m.act = 'hop'; m.actT = 0; FX.H.sfx.whoosh(); M.hopCd = 8;
    say(FX, 'hop', 'WING DIVE', 'Its fungal wings lift it high: it dive-bombs the marked circle. Get out from under it', TEAL_HI); }
  function hopStep(FX, m, M, dt) { const H = M.hop, me = FX.me; if (!H) { toIdle(m, M); return 0; } H.age += dt; M.flapAmp = 1;
    const t1 = H.crouch, t2 = t1 + H.rise, t3 = t2 + H.track;
    if (H.age < t1) { M.altTo = -0.5; return 0.8; }
    if (H.age < t3) { if (!H.leapt) { H.leapt = true; FX.H.sfx.whoosh(); FX.H.boom(m.x, m.y, 1.6, FUNGUS, '#FFFFFF', { n: 12, shake: 6, smoke: 6 }); }
      M.altTo = 7.5; const v = H.age > t2 ? 8 : 2.5, dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy) || 1; if (d > 0.2) { m.x += dx / d * Math.min(d, v * dt); m.y += dy / d * Math.min(d, v * dt); } const q = FX.clampArena(m, 2.6); m.x = q.x; m.y = q.y; return 0.7; }
    if (!H.marked) { H.marked = true; const p = FX.clampArena({ x: me.x, y: me.y }, 2.6); H.tx = p.x; H.ty = p.y;
      FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 3.0, t: H.wait, dmg: m.dmg * 1.45, col: TEAL_HI, fn: s => { H.hit = true; m.x = s.x; m.y = s.y; M.alt = 0; M.altTo = 0; M.flapAmp = 0.3; FX.H.boom(s.x, s.y, 2.8, TEAL_HI, '#FFFFFF', { n: 30, shake: 15, smoke: 10 }); FX.H.ring(s.x, s.y, 0.4, 4.2, 0.45, TEAL_HI, 0.4); FX.H.sfx.crash(); FX.H.sfx.thud(); M.craters.push(crater(s.x, s.y)); M.recoil = 0.8; landFeet(m, M);
        breakCells(FX, q => Math.hypot(q.x - s.x, q.y - s.y) < s.r + 0.6); } }); }
    if (!H.hit) { m.x = toward(m.x, H.tx, dt, 6); m.y = toward(m.y, H.ty, dt, 6); if (H.age > t3 + H.wait * 0.55) { M.altTo = 0; M.alt = toward(M.alt, 0, dt, 9); } return 1; }
    H.rec += dt; M.altTo = 0; if (H.rec > 0.75) { M.hop = null; toIdle(m, M); } return 0.4; }
  /* ---- Devour (phase two): it walks to a charge cell and starts to eat it; pop the cell first, or it overcharges ---- */
  function startDevour(FX, m) { const M = FX.mem, F = fk(FX, M), list = liveCells(M).sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y)); M.devCd = 15;
    if (!list.length) { M.last = 'slam'; startSlam(FX, m); return; }
    const cell = list[0]; M.dv = { age: 0, cell, eat: 0, dur: 3.4 / F, eating: false }; cell.grabbed = true; m.act = 'devour'; m.actT = 0; FX.H.sfx.hum();
    say(FX, 'devour', 'IT FEEDS', 'Kh\'aal goes to eat a charge cell: pop the cell before the meter fills (the jolt staggers it), or it OVERCHARGES', VIOLET_HI); }
  function devourStep(FX, m, M, dt, F) { const V = M.dv; if (!V) { toIdle(m, M); return 0; } const o = V.cell; V.age += dt;
    if (!o || o.dead) { M.dv = null; toIdle(m, M); return 0; }
    M.hdTo = Math.atan2(o.y - m.y, o.x - m.x);
    if (!V.eating) { const dx = m.x - o.x, dy = m.y - o.y, d = Math.hypot(dx, dy) || 1, px = o.x + dx / d * 2.5, py = o.y + dy / d * 2.5; walk(FX, m, M, px, py, 3.2 * F, dt);
      if (Math.hypot(m.x - px, m.y - py) < 0.4 || V.age > 4) { if (d < 3.6) { V.eating = true; V.e0 = V.age; FX.H.sfx.crack(); FX.H.text(o.x, o.y - 1.6, 'It seizes the cell!', VIOLET_HI, 13); } else { o.grabbed = false; M.dv = null; toIdle(m, M); } } return 0.6; }
    walk(FX, m, M, m.x, m.y, 1, dt); V.eat = Math.min(1, V.eat + dt / V.dur); M.grab = toward(M.grab, 1, dt, 6); M.grabAt = [o.x, o.y]; M.mouth = 0.5 + 0.5 * Math.abs(Math.sin(M.bt * 9));
    if (Math.random() < dt * 14) { const P = pose(m, M); M.zaps.push(zap(o.x, o.y, 1.0, P.mouth[0], P.mouth[1], P.mouth[2], 0.18, 0.25)); }
    if (V.eat >= 1) { o.eaten = true; o.dead = true; const s = M.slots[o.slot]; if (s) { s.cell = null; s.t = 7; } M.dv = null; M.grab = 0; overcharge(FX, m, M); toIdle(m, M); } return 1; }
  function overcharge(FX, m, M) { M.overT = 12; M.pulse = 1; M.roar = 1; FX.H.banner('OVERCHARGED!', 'Kh\'aal glows with stolen current and strikes faster: a jolt from another cell burns it out', VIOLET_HI, 2.6, true);
    FX.H.flash(0.3, VIOLET); FX.H.shake(10, 0.5); FX.H.sfx.crash(); FX.H.sfx.hum(); FX.H.ring(m.x, m.y, 0.5, 7, 0.8, VIOLET_HI, 0.45); FX.H.boom(m.x, m.y - 1.5, 2.4, VIOLET, '#FFFFFF', { n: 30, shake: 10 }); }
  function callMinion(FX, m, type) { const me = FX.me, a = Math.random() * TAU, d = 3.5 + Math.random() * 2.5, p = FX.clampArena({ x: me.x + Math.cos(a) * d, y: me.y + Math.sin(a) * d }, 2);
    FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.0, t: 1.0, dmg: m.dmg * 0.4, col: FUNGUS, fn: s => { FX.H.ring(s.x, s.y, 0.2, 1.3, 0.4, FUNGUS, 0.3); FX.H.sfx.pop && FX.H.sfx.pop(); if (FX.m && !FX.m.dead) FX.minion(type, s.x, s.y); } }); }

  /* ---------- the charge cells ---------- */
  function liveCells(M) { return M.slots.map(s => s.cell).filter(o => o && !o.dead && !o.invuln); }
  function spawnCell(FX, s, now) { const M = FX.mem; s.rise = now ? 1 : 0; s.t = 0;
    const o = FX.obj({ kind: 'cell', x: s.x, y: s.y, r: 0.7, hp: Math.max(1, FX.S.barHP * 0.012), slot: s.i, invuln: !now, onHit: o2 => { FX.H.sparks(o2.x, o2.y - 0.6, VIOLET_HI, 3, 3); }, onKill: o2 => cellBurst(FX, o2) }); s.cell = o; return o; }
  function breakCells(FX, test) { const M = FX.mem; liveCells(M).forEach(o => { if (test(o)) FX.H.hitMon(o, 1e12, { flat: true }); }); }
  function updCells(FX, m, M, dt) { const me = FX.me;
    M.slots.forEach(s => { const o = s.cell;
      if (o && !o.dead) { if (s.rise < 1) { s.rise = Math.min(1, s.rise + dt / 1.0); if (s.rise >= 1) { o.invuln = false; FX.H.sparks(s.x, s.y - 0.6, VIOLET_HI, 8, 4); FX.H.sfx.pop && FX.H.sfx.pop(); } } return; }
      if (o && o.dead) s.cell = null;
      s.t -= dt; if (s.t > 0) return;
      // a new cell rises from the socket (not under Kh'aal or the pet)
      if (Math.hypot(m.x - s.x, m.y - s.y) > 3 && Math.hypot(me.x - s.x, me.y - s.y) > 1.4) { spawnCell(FX, s, false); FX.H.ring(s.x, s.y, 0.2, 1.2, 0.5, VIOLET_HI, 0.35); FX.H.sfx.hum(); } }); }
  /* a cell bursts: lightning chains through the brood near it, sets off the cells near it, and jolts Kh'aal if it
     stands in the blast */
  function cellBurst(FX, o) { const M = FX.mem, m = FX.m, me = FX.me, s = M.slots[o.slot]; if (s && s.cell === o) { s.cell = null; s.t = FX.S.lv >= 3 ? 6.5 : 8; } if (o.eaten) return;
    const x = o.x, y = o.y; FX.H.boom(x, y - 0.4, 2.2, VIOLET, '#FFFFFF', { n: 26, shake: 7 }); FX.H.ring(x, y, 0.3, BLAST, 0.45, VIOLET_HI, 0.4); FX.H.flash(0.08, VIOLET_HI); FX.H.sfx.crash(); FX.H.sfx.crack();
    if (Math.hypot(me.x - x, me.y - y) < 1.7 && !me.dodge) { FX.hurt(m ? m.dmg * 0.7 : 20); FX.H.text(me.x, me.y - 1.4, 'Too close!', VIOLET_HI, 13); }
    let n = 0; for (const q of FX.H.mons) { if (q.dead || q === o || q.boss) continue; const d = Math.hypot(q.x - x, q.y - y);
      if (q.fobj) { if (q.kind === 'cell' && !q.invuln && !q.chained && d < CHAIN) { q.chained = true; M.zaps.push(zap(x, y, 0.8, q.x, q.y, 0.8, 0.5, 0.3)); FX.H.after(0.22, () => { if (!q.dead) FX.H.hitMon(q, 1e12, { flat: true }); }); } continue; }
      if (d < BLAST) { n++; M.zaps.push(zap(x, y, 0.8, q.x, q.y, 0.5, 0.35, 0.3)); FX.H.hitMon(q, q.maxhp * 0.7, { flat: true }); q.freeze = Math.max(q.freeze || 0, 1.2); } }
    if (n >= 2) FX.H.text(x, y - 1.8, `Chain ×${n}!`, VIOLET_HI, 15);
    if (!m || m.dead || m.act === 'enter') return;
    const d = Math.hypot(m.x - x, m.y - y);
    if (d < JOLT_D && (M.alt || 0) < 2.5) { const P = pose(m, M); for (let k = 0; k < 3; k++) M.zaps.push(zap(x, y, 0.8, P.head[0] + FX.rnd(-1, 1), P.head[1] + FX.rnd(-0.8, 0.8), P.head[2] + FX.rnd(-0.3, 0.6), 0.7, 0.45)); jolt(FX, m, M, o); }
    else if (!M.seen.far && d < JOLT_D + 4) { M.seen.far = true; FX.H.text(x, y - 2, 'Too far: Kh\'aal must stand in the blast ring', TEAL_HI, 13); } }
  function jolt(FX, m, M, o) { const first = !M.seen.jolt, denied = m.act === 'devour' && M.dv && M.dv.cell === o; M.seen.jolt = true;
    if (M.shield || (m.act === 'plate' && M.plateRise > 0.3)) dropShield(FX, m, M, 'jolt');
    clearActs(FX, m, M); m.stunT = Math.max(m.stunT || 0, 5.0); M.stunKind = 'jolt'; m.act = 'stalk'; m.actT = 0; M.roar = 0.6; M.pulse = 1;
    if (M.overT > 0) { M.overT = 0; FX.H.text(m.x, m.y - 4.6, 'The jolt burns out its stolen charge', VIOLET_HI, 13); }
    FX.H.hitMon(m, FX.S.barHP * 0.03, { flat: true, pierce: true });
    if (denied) FX.H.banner('DENIED!', 'The cell burst in its claws: Kh\'aal is staggered. Strike the brain-lobe!', TEAL_HI, 2.4, true);
    else if (first) FX.H.banner('STAGGERED!', 'The discharge jolted Kh\'aal: its plate is down and its brain-lobe bare. Strike it!', TEAL_HI, 2.8, true);
    else FX.H.banner('STAGGERED!', 'Strike the bare brain-lobe!', TEAL_HI, 1.5, true);
    FX.H.shake(12, 0.5); FX.H.flash(0.2, TEAL_HI); FX.H.sfx.crash(); }
  // a jagged bolt between two points in the world, kept a moment for the painter
  function zap(ax, ay, az, bx, by, bz, j, life) { const pts = [], n = 8; for (let i = 0; i <= n; i++) { const u = i / n, e = i && i < n ? 1 : 0; pts.push([ax + (bx - ax) * u + (Math.random() - 0.5) * j * e, ay + (by - ay) * u + (Math.random() - 0.5) * j * e, az + (bz - az) * u + (Math.random() - 0.5) * j * e]); } return { pts, t: 0, life }; }
  function crater(x, y) { return { x, y, t: 0, seed: Math.floor(Math.random() * 1e4) }; }

  /* ---------- the body: tripod steps, claws, the plate, wings, the brain-lobe ---------- */
  function restFoot(m, M, i) { const j = i % 3, sd = i < 3 ? 1 : -1, hd = M.hd == null ? Math.PI / 2 : M.hd, cf = Math.cos(hd), sf = Math.sin(hd), spread = 1 + (M.stagK || 0) * 0.12 - Math.min(0, M.alt || 0) * 0.15, u = FOOT_U[j], v = sd * FOOT_V[j] * spread;
    return [m.x + cf * u - sf * v, m.y + sf * u + cf * v]; }
  function landFeet(m, M) { M.feet = [0, 1, 2, 3, 4, 5].map(i => { const p = restFoot(m, M, i); return [p[0], p[1], 0]; }); M.step = null; }
  function updBody(FX, m, M, dt, stun) { const act = m.act, F = fk(FX, M);
    if (!M.feet) landFeet(m, M);
    // turning: a capped rate (slow while the plate is up, so the pet can get round it)
    if (!stun && act !== 'enter') { const w = (M.shield ? 0.85 : act === 'stalk' ? 2.0 : 3.2) * (M.overT > 0 ? 1.3 : 1), d = angTo(M.hd, M.hdTo == null ? M.hd : M.hdTo); M.hd += clamp(d, -w * dt, w * dt); }
    if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt; M.px = m.x; M.py = m.y; M.spd = toward(M.spd, Math.min(12, Math.hypot(vx, vy)), dt, 5); }
    // its height: crouched when stunned or about to leap, high in a dive, a little dip at each slam
    if (act !== 'enter') { const want = stun ? -0.55 : (M.altTo || 0); M.alt = toward(M.alt, want, dt, want > M.alt + 1 ? 2.6 : 6); }
    M.stagK = toward(M.stagK, stun ? 1 : 0, dt, stun ? 6 : 2.5); M.rear = toward(M.rear, M.rearTo || 0, dt, 5); M.mouth = decay(M.mouth, dt, 1.5);
    // the wings: folded, then unfolded for good in phase two; beating hard in a dive, slowly at rest
    M.wingK = toward(M.wingK, M.wingTo || 0, dt, 1.6); M.flapAmp = toward(M.flapAmp, act === 'hop' && !(M.hop && M.hop.hit) ? 1 : M.wingK > 0.5 ? 0.22 : 0, dt, 4); M.wingBeat += dt * TAU * (act === 'hop' ? 3.2 : 0.9) * (M.overT > 0 ? 1.3 : 1);
    // the claws at rest: the hammer's finger working, the shear's blades scissoring
    if (act !== 'slam') { M.hamK = decay(M.hamK, dt, 4); M.hamS = decay(M.hamS, dt, 4); M.hamOpen = toward(M.hamOpen, 0.25 + 0.25 * Math.sin(M.bt * 2.1) + (M.menace || 0) * 0.3, dt, 4); }
    M.clackT = (M.clackT || 2) - dt; if (M.clackT <= 0 && !stun) { M.clackT = 1.6 + Math.random() * 2.2; M.snip = 1; if (Math.random() < 0.5) FX.H.sfx.pop && FX.H.sfx.pop(); }
    M.snip = decay(M.snip, dt, 5);
    if (act !== 'sweep') { M.shPsiTo = 0.3 + Math.sin(M.bt * 0.7) * 0.12; M.shOpenTo = 0.28 + 0.18 * Math.sin(M.bt * 1.6) - (M.snip || 0) * 0.3; }
    M.shPsi = toward(M.shPsi, M.shPsiTo, dt, act === 'sweep' && M.sw && M.sw.struck ? 16 : 5); M.shOpen = toward(M.shOpen, clamp(M.shOpenTo, 0.02, 1), dt, act === 'sweep' && M.sw && M.sw.struck ? 22 : 8);
    if (act !== 'devour') M.grab = decay(M.grab, dt, 3);
    // the legs: tripods (front and back on one side with the middle on the other) step together to where they would rest
    const air = (M.alt || 0) > 0.6;
    if (air) { M.step = null; for (let i = 0; i < 6; i++) { const r = restFoot(m, M, i), f = M.feet[i]; f[0] = lerp(r[0], m.x, 0.25); f[1] = lerp(r[1], m.y, 0.25); f[2] = Math.max(0, M.alt - 1.0); } }
    else if (act !== 'enter' || M.landed) {
      if (M.feet.some(f => f[2] > 0.01) && !M.step) M.feet.forEach(f => f[2] = 0);
      if (M.step) { const S = M.step; S.u += dt / S.dur; const u = Math.min(1, S.u); S.legs.forEach((i, k) => { const f = M.feet[i]; f[0] = lerp(S.from[k][0], S.to[k][0], u); f[1] = lerp(S.from[k][1], S.to[k][1], u); f[2] = Math.sin(u * Math.PI) * S.lift; });
        M.stepBob = -Math.sin(u * Math.PI) * 0.06; M.shx += (-(M.vx || 0) * 0.02 - M.shx) * Math.min(1, dt * 3);
        if (S.u >= 1) { S.legs.forEach(i => { M.feet[i][2] = 0; if (M.spd > 0.4) FX.H.sparks(M.feet[i][0], M.feet[i][1], Math.random() < 0.3 ? VIOLET_HI : '#9AA3BA', 2, 2); }); M.step = null; M.stepT = 0.04; if (M.spd > 0.8 && Math.random() < 0.45) { FX.H.shake(1.2, 0.06); FX.H.sfx.thud && FX.H.sfx.thud(); } } }
      else { M.stepT -= dt; M.fidT -= dt; let worst = -1, we = 0; const err = g => Math.max(...[0, 1, 2].map(j => { const i = j + (((j + g) % 2) ? 3 : 0), r = restFoot(m, M, i); return Math.hypot(M.feet[i][0] - r[0], M.feet[i][1] - r[1]); }));
        for (let g = 0; g < 2; g++) { const e = err(g); if (e > we) { we = e; worst = g; } }
        const need = stun ? 9 : 0.5;
        if ((we > need || (M.fidT <= 0 && !stun)) && M.stepT <= 0) { if (we <= need) { M.fidT = 1.8 + Math.random() * 2; worst = Math.random() < 0.5 ? 0 : 1; }
          const legs = [0, 1, 2].map(j => j + (((j + worst) % 2) ? 3 : 0)), lead = 0.3;
          M.step = { legs, from: legs.map(i => M.feet[i].slice(0, 2)), to: legs.map(i => { const r = restFoot(m, M, i); return [r[0] + (M.vx || 0) * lead + FX.rnd(-0.12, 0.12), r[1] + (M.vy || 0) * lead + FX.rnd(-0.12, 0.12)]; }), u: 0, dur: clamp(0.34 - M.spd * 0.04, 0.2, 0.34) / Math.sqrt(F), lift: 0.5 + M.spd * 0.06 }; } } }
    M.shx = toward(M.shx, 0, dt, 2); M.shy = toward(M.shy, 0, dt, 2);
    // the shell's seams flicker with current, sparks crawl over the plates
    if (Math.random() < dt * (3 + M.glowK * 10 + M.stagK * 6)) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 0.9, P = pose(m, M), q = DunFiend.KIT.surf3((x, y, z) => [x, y, z], P.dome[0], P.dome[1], P.dome[2], DA, DB, DZ, P.hd, Math.cos(a) * r, Math.sin(a) * r); FX.H.part({ kind: 'spark', x: q[0], y: q[1] - q[2], vx: FX.rnd(-1, 1), vy: FX.rnd(-1.5, 0), life: 0.35, max: 0.35, size: 2, color: Math.random() < 0.6 ? VIOLET_HI : '#FFFFFF' }); } }
  /* where everything is: a body frame at its height, the head, the two claws, the plate, the wings */
  function pose(m, M) {
    const hd = M.hd == null ? Math.PI / 2 : M.hd, rc = M.recoil || 0, alt = M.alt || 0, bt = M.bt || 0, sk = M.stagK || 0, cf = Math.cos(hd), sf = Math.sin(hd);
    const bob = Math.sin(bt * 1.7) * 0.05 + (M.stepBob || 0), B = { x: m.x + (M.shx || 0) - cf * rc * 0.3, y: m.y + (M.shy || 0) - sf * rc * 0.3 };
    const W = RiftFiend.frame(B, hd, { z: alt + bob, roll: sk * Math.sin(bt * 11) * 0.04 }), Wg = RiftFiend.frame(B, hd, {});
    const rear = M.rear || 0, pk = 1 + (M.pulse || 0) * 0.06 + Math.sin(bt * 2.4) * 0.03;
    const head = W(1.95 - rc * 0.25, 0, 1.72 + rear * 0.75 - sk * 0.3), mouth = W(2.5 - rc * 0.2, 0, 1.18 + rear * 0.6 - sk * 0.2);
    const dome = W(-rc * 0.1, 0, RIM);
    // the plate held before it (risen out of the deck as it is torn up)
    const rise = M.plateRise || 0, sh = Math.max(M.shieldK || 0, M.plateRise || 0), up = 1 - smooth(rise), UP = 2.75 + Math.sin(bt * 1.3) * 0.04, h0 = 0.25 + 0.15 * (M.shieldK || 0) - up * 2.8;
    const plateC = W(UP + 0.15, 0.05, Math.max(0.2, h0 + 1.25));
    // the hammer: at rest before its right side, raised over the mark, driven down onto it; it digs and grabs as told
    const hamRest = W(3.0 - rc * 0.4, -1.9, 1.05 + Math.sin(bt * 1.3) * 0.08 + rear * 0.3);
    let ham = hamRest; if ((M.hamK || 0) > 0.001 && M.hamT) { const raised = [lerp(hamRest[0], M.hamT[0], 0.7), lerp(hamRest[1], M.hamT[1], 0.7), 4.7 + alt]; ham = lerp3(hamRest, raised, M.hamK); if (M.hamS > 0) ham = lerp3(ham, [M.hamT[0], M.hamT[1], 0.7], M.hamS); }
    if ((M.dig || 0) > 0) ham = lerp3(ham, Wg(2.7, -1.25, 0.45), M.dig);
    if ((M.grab || 0) > 0 && M.grabAt) ham = lerp3(ham, [M.grabAt[0] - sf * -0.9 * 1, M.grabAt[1] + cf * -0.9, 1.2], M.grab * 0.75);
    ham = lerp3(ham, Wg(2.3, -2.7, 0.45), sk * 0.8);
    const hamSh = W(1.3, -1.35, 1.25), hamOut = [sf * 1, -cf * 1], hmid = lerp3(hamSh, ham, 0.48), hamEl = [hmid[0] + hamOut[0] * 0.95, hmid[1] + hamOut[1] * 0.95, Math.max(hamSh[2], ham[2]) + 0.75 + (M.hamK || 0) * 0.5];
    const hamDir = Math.atan2(ham[1] - hamEl[1], ham[0] - hamEl[0]);
    // the shear: its wrist swung about the shoulder by psi (left, +, to right, -); it holds the plate's edge
    const psi = lerp(M.shPsi == null ? 0.3 : M.shPsi, -1.35, sh), shSh = W(1.3, 1.35, 1.25), pa = (M.shPsi == null ? 0.3 : M.shPsi) * 0.75 + 0.35;
    let wr = W(1.3 + Math.cos(pa) * 1.85, 1.35 + Math.sin(pa) * 1.85, 1.3 + rear * 0.3); wr = lerp3(wr, W(UP - 0.35, 1.55, Math.max(0.3, h0 + 1.35)), sh);
    if ((M.dig || 0) > 0) wr = lerp3(wr, Wg(2.5, 1.3, 0.5), M.dig * (1 - sh));
    if ((M.grab || 0) > 0 && M.grabAt) wr = lerp3(wr, [M.grabAt[0] - sf * 1.1 - cf * 0.6, M.grabAt[1] + cf * 1.1 - sf * 0.6, 1.0], M.grab * 0.7);
    wr = lerp3(wr, Wg(2.0, 2.6, 0.45), sk * 0.8);
    const sa = hd + (M.grab > 0.3 && M.grabAt ? lerp(psi, -0.9, M.grab) : psi), so = M.shOpen == null ? 0.3 : M.shOpen, smid = lerp3(shSh, wr, 0.5), shEl = [smid[0] - sf * 0.85, smid[1] + cf * 0.85, Math.max(shSh[2], wr[2]) + 0.7];
    const tip = [wr[0] + Math.cos(sa) * 2.25, wr[1] + Math.sin(sa) * 2.25, Math.max(0.15, wr[2] - 0.35)];
    return { hd, cf, sf, W, Wg, B, alt, head, mouth, dome, pk, plateC, UP, h0, sh, ham, hamSh, hamEl, hamDir, shSh, shEl, wr, sa, so, tip };
  }
  // the hit proxies: the shell (two), the head, the hammer, the shear
  function bodyParts(m, M) { const P = pose(m, M), W = P.W; return [hit('cb', W(0.2, 0, RIM + 0.5), 2.0, m), hit('cr', W(-1.3, 0, RIM + 0.3), 1.4, m), hit('hd', P.head, 0.95, m), hit('hm', P.ham, 0.95, m), hit('sh', lerp3(P.wr, P.tip, 0.4), 0.85, m)]; }

  /* ---------- painting Kh'aal ---------- */
  // plates shaded as TN.plates shades them, but as hard-cornered polygons (torn hull, not pebbles)
  function platesPoly(c, list, o) { if (!list.length) return; const by = new Map(), ll = Math.hypot(0.55, 0.8), lx = -0.55 / ll, ly = -0.8 / ll; list.forEach(s => { if (!by.has(s.col)) by.set(s.col, []); by.get(s.col).push(s); });
    by.forEach((L, col) => { c.beginPath(); L.forEach(s => TN.poly(s.pts)(c)); c.fillStyle = col; c.fill(); });
    const band = (k, col) => { c.beginPath(); list.forEach(s => { const mv = s.pts.map(p => [p[0] + lx * s.r * k, p[1] + ly * s.r * k]), keep = TN.clipTo(s.pts, mv); TN.poly(s.pts)(c); if (keep.length > 2) TN.poly(keep)(c); }); c.fillStyle = col; c.fill('evenodd'); };
    band(o.d2, o.shade); band(-o.d1, o.hi);
    c.beginPath(); list.forEach(s => TN.poly(s.pts)(c)); c.lineWidth = o.lw; c.strokeStyle = o.line; c.lineJoin = 'round'; c.stroke(); }
  function drawKhaal(c, FX, m, X, Y, T, t) {
    const M = FX.mem; if (!M.feet) landFeet(m, M);
    const P = pose(m, M), P3 = TN.cam(X, Y, T, m), lw = Math.max(1.3, T * 0.065), W = P.W, parts = [], bt = M.bt || t, alt = P.alt;
    const g0 = P3(P.B.x, P.B.y, 0); TN.groundShadow(c, g0[0], g0[1] + T * 0.15, T * 3.6, T * 1.6, Math.max(0, alt), 0.5);
    // its seams' violet light pooled on the deck under it
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.12 + 0.08 * Math.sin(bt * 2) + (M.glowK || 0) * 0.3) / (1 + Math.max(0, alt) * 0.3); blitSized(c, glowSprite(VIOLET), g0[0] - T * 4, g0[1] - T * 1.7, T * 8, T * 3.4); c.restore();
    // the legs: a high knee, an ankle, a spike on the deck
    for (let i = 0; i < 6; i++) { const j = i % 3, sd = i < 3 ? 1 : -1, S = W(LEG_U[j], sd * 2.0, 1.15), Fo = M.feet[i], dx = Fo[0] - S[0], dy = Fo[1] - S[1], d = Math.hypot(dx, dy) || 1, crouch = Math.min(0, alt), sk = M.stagK || 0;
      const K = [S[0] + dx * 0.38, S[1] + dy * 0.38, Math.max(S[2], Fo[2]) + 0.95 + sk * 0.25 - crouch * 0.5], A = [S[0] + dx * 0.78, S[1] + dy * 0.78, Fo[2] + 0.95 + sk * 0.1 - crouch * 0.2];
      parts.push({ at: [K[0], K[1], 0.9], draw: () => drawLeg(c, P3, S, K, A, Fo, T, lw, i) }); }
    parts.push({ at: [P.dome[0], P.dome[1], 1.2], draw: () => drawShell(c, FX, m, M, P, P3, T, t, lw) });
    parts.push({ at: [P.head[0], P.head[1], P.head[2] - 0.4], draw: () => drawHead(c, M, P, P3, T, t, lw, m) });
    parts.push({ at: [P.ham[0], P.ham[1], Math.min(1.6, P.ham[2])], draw: () => drawHammer(c, M, P, P3, T, lw, t) });
    parts.push({ at: [P.wr[0], P.wr[1], 1.0], draw: () => drawShear(c, M, P, P3, T, lw, t) });
    if (P.sh > 0.02) parts.push({ at: [P.plateC[0], P.plateC[1], 1.4], draw: () => drawPlate(c, M, P, P3, T, lw, t) });
    // the wings: folded flat on the back (over the shell), or spread and placed in depth
    const wk = M.wingK || 0; if (wk > 0.35) [-1, 1].forEach(sd => { const a = W(-0.9, sd * 2.2, RIM + 1.6); parts.push({ at: [a[0], a[1], a[2] * 0.6], draw: () => drawWing(c, M, P, P3, T, lw, sd, t) }); });
    sorted(parts).forEach(p => p.draw());
    // overcharged: a corona of stolen current
    if ((M.glowK || 0) > 0.02) { const q = P3(P.dome[0], P.dome[1], P.dome[2] + 0.8), k = M.glowK; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * (0.55 + 0.2 * Math.sin(t * 13)); blitSized(c, glowSprite(VIOLET), q[0] - T * 4.6, q[1] - T * 3.4, T * 9.2, T * 6.8); c.globalAlpha = k * (0.35 + 0.15 * Math.sin(t * 9)); blitSized(c, glowSprite(VIOLET_HI), q[0] - T * 2.6, q[1] - T * 1.8, T * 5.2, T * 3.6); c.restore();
      const R = mulberry32(Math.floor(t * 12)); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; for (let k2 = 0; k2 < 6; k2++) { const a = R() * TAU; let x = q[0] + Math.cos(a) * T * 2.6, y = q[1] + Math.sin(a) * T * 1.5; c.beginPath(); c.moveTo(x, y); for (let s = 0; s < 5; s++) { x += (R() - 0.5) * T * 1.1; y += (R() - 0.6) * T * 0.8; c.lineTo(x, y); } c.strokeStyle = TN.rgba(VIOLET_HI, 0.85 * k); c.lineWidth = Math.max(1.5, T * 0.08); c.stroke(); c.strokeStyle = TN.rgba('#FFFFFF', 0.9 * k); c.lineWidth = Math.max(0.8, T * 0.03); c.stroke(); } c.restore(); }
    // staggered: current crawling over the slumped shell, and twinkles
    if ((M.stagK || 0) > 0.3) { const k = M.stagK, R = mulberry32(Math.floor(t * 14) + 3), q = P3(P.dome[0], P.dome[1], P.dome[2] + 0.5); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let k2 = 0; k2 < 3; k2++) { let x = q[0] + (R() - 0.5) * T * 4, y = q[1] + (R() - 0.5) * T * 1.6; c.beginPath(); c.moveTo(x, y); for (let s = 0; s < 4; s++) { x += (R() - 0.5) * T * 0.9; y += (R() - 0.5) * T * 0.6; c.lineTo(x, y); } c.strokeStyle = TN.rgba(TEAL_HI, 0.8 * k); c.lineWidth = Math.max(1.5, T * 0.07); c.stroke(); } c.restore();
      if (k > 0.6) for (let i = 0; i < 3; i++) { const a = bt * 3 + i * TAU / 3, q2 = P3(P.dome[0], P.dome[1], P.dome[2] + 2.0); TN.twinkle(c, q2[0] + Math.cos(a) * T * 1.6, q2[1] - T * 0.8 + Math.sin(a) * T * 0.35, T * 0.2, '#FFFFFF', 0.9); } } }
  // a leg: a thick femur rising to a high knee, a shin down to the ankle, a spiked tip planted on the deck; a hull cuff
  function drawLeg(c, P3, S, K, A, F, T, lw, i) { const s = P3(...S), k = P3(...K), a = P3(...A), f = P3(...F), col = { col: CH, shade: CH_SH, hi: CH_HI, line: INK, lw, force: true };
    tubeLite(c, [s, [(s[0] + k[0]) / 2, (s[1] + k[1]) / 2 - T * 0.05], k], u => T * (0.56 - u * 0.12), col);
    tubeLite(c, [k, [(k[0] + a[0]) / 2, (k[1] + a[1]) / 2], a], u => T * (0.44 - u * 0.1), col);
    tubeLite(c, [a, [(a[0] + f[0]) / 2 + (f[0] - a[0]) * 0.1, (a[1] + f[1]) / 2], f], u => T * (0.34 - u * 0.3), col);
    // the cuff of hull metal fused round the femur, riveted
    const c0 = [lerp(s[0], k[0], 0.3), lerp(s[1], k[1], 0.3)], c1 = [lerp(s[0], k[0], 0.66), lerp(s[1], k[1], 0.66)]; tubeLite(c, [c0, [(c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2], c1], () => T * 0.6, { col: PLATE[i % PLATE.length], shade: PL_SH, hi: PL_HI, line: INK, lw: lw * 0.8, force: true });
    c.fillStyle = '#161A26'; [0.4, 0.56].forEach(u => { c.beginPath(); c.arc(lerp(s[0], k[0], u), lerp(s[1], k[1], u) - T * 0.1, Math.max(1, T * 0.045), 0, TAU); c.fill(); });
    // knuckles, a spur off the knee and the ankle
    [[k, 0.3], [a, 0.23]].forEach(([p, r]) => TN.shape(c, TN.ell(p[0], p[1], T * r, T * r * 0.86), { col: CH, shade: CH_SH, hi: CH_HI, line: INK, lw, r: T * r, force: true }));
    [[k, a, 0.36], [a, f, 0.26]].forEach(([p, q, L0]) => { const dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1, nx = dy / d, ny = -dx / d, up = ny < 0 ? 1 : -1, L = T * L0; c.fillStyle = CH; c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(p[0] - dx / d * T * 0.06 + nx * up * T * 0.15, p[1] - dy / d * T * 0.06 + ny * up * T * 0.15); c.lineTo(p[0] + nx * up * L - dx / d * T * 0.2, p[1] + ny * up * L - dy / d * T * 0.2); c.lineTo(p[0] + dx / d * T * 0.16 + nx * up * T * 0.1, p[1] + dy / d * T * 0.16 + ny * up * T * 0.1); c.closePath(); c.fill(); c.stroke(); });
    // a pale glint along the shin's top
    c.strokeStyle = 'rgba(190,170,230,.35)'; c.lineWidth = Math.max(1, T * 0.05); c.lineCap = 'round'; c.beginPath(); c.moveTo(lerp(k[0], a[0], 0.2), lerp(k[1], a[1], 0.2) - T * 0.12); c.lineTo(lerp(k[0], a[0], 0.75), lerp(k[1], a[1], 0.75) - T * 0.1); c.stroke(); }
  /* the shell: the dark underside, hull-shard spines jutting from its rim, the dome of riveted hull plates with violet
     current in the seams, a ruffled skirt of fungus along its edge, and (folded) the wings on its back */
  function drawShell(c, FX, m, M, P, P3, T, t, lw) { const K = DunFiend.KIT, W = P.W, hd = P.hd, g = P.dome, bt = M.bt || t, glowK = M.glowK || 0, sk = M.stagK || 0;
    const surf = (u, v, lift) => K.surf3(P3, g[0], g[1], g[2], DA, DB, DZ, hd, u, v, lift), nrm = (u, v) => { const w = Math.sqrt(Math.max(0, 1 - u * u - v * v)), nx = Math.cos(hd) * u / DA - Math.sin(hd) * v / DB, ny = Math.sin(hd) * u / DA + Math.cos(hd) * v / DB, nz = w / DZ; return (ny + nz) / Math.hypot(nx, ny, nz); };
    // the belly under the rim
    TN.ellipsoid(c, P3, hd, W(0.1, 0, RIM - 0.3), [1.55, 2.2, 0.48], { T, col: '#241D2E', shade: '#120E18', hi: '#3A3048', line: INK, lw, d1: 0.1, d2: 0.24, spec: false, force: true });
    // the spines: torn hull shards fused into the rim, jutting out flat
    SPINES.forEach(([ph, len, w]) => [-1, 1].forEach(sd => { const a = ph * sd, a0 = a - w * sd, a1 = a + w * sd, at = (aa, r) => P3(...W(Math.cos(aa) * DA * r, Math.sin(aa) * DB * r, RIM + 0.04 - (r - 1) * 0.35)), pts = [at(a0, 0.92), at(a + w * 0.15 * sd, 1 + len * 0.55), at(a + w * 0.6 * sd, 1 + len), at(a1, 0.92)];
      TN.shape(c, TN.poly(pts), { col: PLATE[(Math.round(ph * 10)) % PLATE.length], shade: PL_SH, hi: PL_HI, line: INK, lw, r: T * 0.5, d1: 0.1, d2: 0.22, force: true }); }));
    const dm = K.dome(c, P3, g[0], g[1], g[2], DA, DB, DZ, hd), puls = 0.5 + 0.5 * Math.sin(bt * 3.1), seamA = 0.5 + 0.25 * puls + glowK * 0.4 + sk * 0.3 * Math.abs(Math.sin(bt * 17));
    TN.shape(c, dm.path, { col: '#20142E', shade: '#140A20', hi: false, line: INK, lw: lw * 1.3, r: T * 2.2, force: true, inner: gc => {
      // the current in the seams
      gc.save(); gc.globalCompositeOperation = 'lighter'; gc.globalAlpha = Math.min(1, seamA); gc.fillStyle = mix(VIOLET, VIOLET_HI, glowK * 0.6 + sk * 0.4); dm.path(); gc.fill(); gc.restore();
      // the hull plates (those turned toward the camera)
      const list = [], rivets = [], fung = [], torn = [];
      PANELS.forEach(pn => { const gap = 0.024, r0 = pn.r0 ? pn.r0 + gap : 0, r1 = pn.r1 - (pn.r1 >= 1 ? 0 : gap), pts = [];
        if (pn.n === 1) { for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3; pts.push(surf(Math.cos(a) * r1, Math.sin(a) * r1)); } }
        else { const da = gap / Math.max(0.3, (r0 + r1) / 2), a0 = pn.a0 + da, a1 = pn.a1 - da, n = 4; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), rr = r1 * (i === 2 ? 1 - pn.jit * 0.04 : 1); pts.push(surf(Math.cos(a) * rr, Math.sin(a) * rr)); } for (let i = n; i >= 0; i -= 2) { const a = lerp(a0, a1, i / n), rr = r0 * (1 + (pn.jit - 0.5) * 0.08); pts.push(surf(Math.cos(a) * rr, Math.sin(a) * rr)); } }
        const am = (pn.a0 + pn.a1) / 2, rm = (r0 + r1) / 2, vis = pn.n === 1 ? 1 : nrm(Math.cos(am) * Math.min(0.95, rm), Math.sin(am) * Math.min(0.95, rm)); if (vis < -0.1) return;
        if (pn.torn) { torn.push(pts); return; }
        list.push({ pts, col: pn.col, r: T * Math.max(0.35, (pn.r1 - pn.r0) * 1.5) });
        const cx = pts.reduce((a2, p) => a2 + p[0], 0) / pts.length, cy = pts.reduce((a2, p) => a2 + p[1], 0) / pts.length; for (let i = 0; i < pts.length; i += 2) rivets.push([lerp(pts[i][0], cx, 0.2), lerp(pts[i][1], cy, 0.2)]);
        if (pn.fungus) fung.push(surf(Math.cos(am) * rm, Math.sin(am) * rm)); });
      // a torn-out panel: the violet light inside, cables across it
      torn.forEach(pts => { gc.save(); gc.globalCompositeOperation = 'lighter'; gc.beginPath(); TN.poly(pts)(gc); gc.fillStyle = TN.rgba(VIOLET_HI, 0.3 + 0.35 * puls); gc.fill(); gc.restore(); gc.strokeStyle = '#120818'; gc.lineWidth = Math.max(1.5, T * 0.08); for (let i = 1; i < 3; i++) { const a = pts[i], b = pts[pts.length - i]; gc.beginPath(); gc.moveTo(a[0], a[1]); gc.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + T * 0.2, b[0], b[1]); gc.stroke(); } });
      platesPoly(gc, list, { shade: PL_SH, hi: PL_HI, line: INK, lw: lw * 0.8, d1: 0.1, d2: 0.26 });
      gc.fillStyle = '#161A26'; rivets.forEach(([x, y]) => { gc.beginPath(); gc.arc(x, y, Math.max(1, T * 0.05), 0, TAU); gc.fill(); }); gc.fillStyle = 'rgba(255,255,255,.4)'; rivets.forEach(([x, y]) => { gc.beginPath(); gc.arc(x - T * 0.016, y - T * 0.016, Math.max(0.5, T * 0.02), 0, TAU); gc.fill(); });
      // fungus taking root on the plates: pink cushions and little teal caps
      fung.forEach(q => { const lobes = [[-0.25, 0.05, 0.22], [0.05, -0.08, 0.26], [0.3, 0.06, 0.2], [0.05, 0.16, 0.18]]; gc.beginPath(); lobes.forEach(([dx, dy, r]) => { gc.moveTo(q[0] + dx * T + r * T, q[1] + dy * T); gc.ellipse(q[0] + dx * T, q[1] + dy * T, r * T, r * T * 0.7, 0, 0, TAU); }); gc.fillStyle = WING; gc.fill(); gc.strokeStyle = INK; gc.lineWidth = lw * 0.6; gc.stroke();
        gc.fillStyle = WING_HI; lobes.forEach(([dx, dy, r]) => { gc.beginPath(); gc.arc(q[0] + dx * T - r * T * 0.3, q[1] + dy * T - r * T * 0.3, r * T * 0.25, 0, TAU); gc.fill(); });
        for (let j = 0; j < 2; j++) { const x = q[0] + (j ? 0.2 : -0.12) * T, y = q[1] - T * 0.1; gc.strokeStyle = '#E8C0D8'; gc.lineWidth = Math.max(1, T * 0.05); gc.beginPath(); gc.moveTo(x, y); gc.lineTo(x + T * 0.04, y - T * 0.32); gc.stroke(); gc.fillStyle = TEAL; gc.beginPath(); gc.ellipse(x + T * 0.04, y - T * 0.34, T * 0.12, T * 0.06, 0, Math.PI, TAU); gc.fill(); } });
      // current crawling along the seams (a few bright runners)
      const R = mulberry32(Math.floor(bt * 8)); gc.save(); gc.globalCompositeOperation = 'lighter'; gc.lineCap = 'round'; for (let k = 0; k < 2 + Math.round(glowK * 3 + sk * 3); k++) { const pn = PANELS[1 + Math.floor(R() * (PANELS.length - 1))], a = lerp(pn.a0, pn.a1, R()), r = pn.r0 + 0.01; const p0 = surf(Math.cos(a) * r, Math.sin(a) * r), p1 = surf(Math.cos(a + 0.4) * r, Math.sin(a + 0.4) * r); gc.strokeStyle = TN.rgba('#FFFFFF', 0.9); gc.lineWidth = Math.max(1, T * 0.04); gc.beginPath(); gc.moveTo(p0[0], p0[1]); gc.lineTo((p0[0] + p1[0]) / 2 + (R() - 0.5) * T * 0.2, (p0[1] + p1[1]) / 2 + (R() - 0.5) * T * 0.2); gc.lineTo(p1[0], p1[1]); gc.stroke(); } gc.restore();
      // the dome's own light and shade over its plates
      const b0 = dm.pts.reduce((a, p) => [Math.min(a[0], p[0]), Math.min(a[1], p[1]), Math.max(a[2], p[0]), Math.max(a[3], p[1])], [1e9, 1e9, -1e9, -1e9]), gr = gc.createLinearGradient(b0[0], b0[1], b0[2], b0[3]);
      gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(6,3,12,.4)'); gc.fillStyle = gr; dm.path(); gc.fill(); } });
    // the fungal skirt: a ruffle hanging from the rim's near half, two layers, gills
    const top = [], N = 30; for (let i = 0; i <= N; i++) { const b = -0.32 + i / N * (Math.PI + 0.64), ph = b - hd; top.push(surf(Math.cos(ph) * 1.0, Math.sin(ph) * 1.0)); }
    const ruffle = (drop, out, col, line) => { const bot = top.map((p, i) => { const wv = Math.sin(i * 2.1 + 0.7) * 0.25 + Math.sin(i * 0.9) * 0.15, b = -0.32 + i / N * (Math.PI + 0.64); return [p[0] + Math.cos(b) * T * out, p[1] + Math.sin(b) * T * out * 0.4 + T * drop * (1 + wv)]; });
      c.beginPath(); c.moveTo(top[0][0], top[0][1]); top.forEach(p => c.lineTo(p[0], p[1])); for (let i = N; i > 0; i--) { const p = bot[i], q = bot[i - 1]; c.quadraticCurveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + T * drop * 0.55, q[0], q[1]); } c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = line; c.lineWidth = lw * 0.8; c.lineJoin = 'round'; c.stroke(); return bot; };
    ruffle(0.42, 0.2, '#9A4A80', INK); const bot = ruffle(0.28, 0.1, WING, INK);
    c.strokeStyle = 'rgba(122,40,96,.55)'; c.lineWidth = Math.max(1, T * 0.035); c.lineCap = 'round'; for (let i = 1; i < N; i += 2) { c.beginPath(); c.moveTo(top[i][0], top[i][1] + T * 0.04); c.lineTo(lerp(top[i][0], bot[i][0], 0.85), lerp(top[i][1], bot[i][1], 0.85)); c.stroke(); }
    c.strokeStyle = 'rgba(255,220,240,.55)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); top.forEach((p, i) => i ? c.lineTo(p[0], p[1] + T * 0.05) : c.moveTo(p[0], p[1] + T * 0.05)); c.stroke();
    // the wings folded on the back
    if ((M.wingK || 0) <= 0.35) [-1, 1].forEach(sd => drawWing(c, M, P, P3, T, lw, sd, t)); }
  /* the brain-lobe head: folded, pulsing, lit from within in a colour that shifts teal, violet, amber; two eyes on
     stalks, a cluster of small eyes, the mandibles and palps under it */
  function hueOf(M, t) { const bt = M.bt || t, k = (bt / 2.4) % 3, i = Math.floor(k), cols = [TEAL, VIOLET, AMBER]; let h = mix(cols[i], cols[(i + 1) % 3], smooth(k - i)); if ((M.glowK || 0) > 0) h = mix(h, VIOLET_HI, M.glowK); if ((M.stagK || 0) > 0.3) h = mix(h, Math.sin(bt * 20) > 0 ? '#FFFFFF' : TEAL_HI, M.stagK); return h; }
  function drawHead(c, M, P, P3, T, t, lw, m) { const W = P.W, hd = P.hd, bt = M.bt || t, hue = hueOf(M, t), pk = P.pk, h = P.head, q = P3(...h), sk = M.stagK || 0, rr = M.rear || 0;
    // the mandibles and palps under it, working
    const mo = M.mouth || 0, jaw = 0.18 + 0.12 * Math.sin(bt * 3.3) + mo * 0.35;
    [-1, 1].forEach(s => { const a = P3(...W(2.1, s * 0.34, 1.2 + rr * 0.6)), b = P3(...W(2.6, s * (0.24 + jaw * 0.5), 0.92 + rr * 0.55)), e = P3(...W(2.72, s * (0.06 + jaw * 0.2), 0.72 + rr * 0.5)); tubeLite(c, [a, b, e], u => T * (0.24 - u * 0.18), { col: CH, shade: CH_SH, hi: CH_HI, line: INK, lw: lw * 0.8, force: true });
      const p0 = P3(...W(2.15, s * 0.66, 1.3)), p1 = P3(...W(2.6, s * 0.92, 0.95 + Math.sin(bt * 4 + s) * 0.12)); tubeLite(c, [p0, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - T * 0.08], p1], u => T * (0.12 - u * 0.06), { col: '#5A2048', shade: '#3A1030', hi: '#8A4070', line: INK, lw: lw * 0.6, force: true }); });
    if (mo > 0.05) { const mq = P3(...P.mouth); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, mo); blitSized(c, glowSprite(SLAG), mq[0] - T * 0.9, mq[1] - T * 0.7, T * 1.8, T * 1.4); c.restore(); c.fillStyle = mix(SLAG, SLAG_HI, mo); c.beginPath(); c.ellipse(mq[0], mq[1], T * 0.24, T * 0.1 * (0.5 + mo), 0, 0, TAU); c.fill(); }
    // the eye-stalks, swivelling
    const stalk = s => { const lk = Math.sin(bt * 0.9 + s * 1.3) * 0.15, b0 = P3(...W(2.0, s * 0.7, 1.6 + rr * 0.7 - sk * 0.3)), b1 = P3(...W(2.2 + lk, s * (1.22 + lk * 0.4), 2.5 + rr * 0.8 - sk * 0.7)); tubeLite(c, [b0, [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2], b1], u => T * (0.16 - u * 0.05), { col: CH, shade: CH_SH, hi: CH_HI, line: INK, lw: lw * 0.7, force: true });
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; blitSized(c, glowSprite(TEAL), b1[0] - T * 0.55, b1[1] - T * 0.55, T * 1.1, T * 1.1); c.restore();
      TN.shape(c, TN.ell(b1[0], b1[1], T * 0.2, T * 0.17), { col: sk > 0.5 ? '#FFFFFF' : TEAL_HI, shade: TEAL, hi: '#FFFFFF', line: INK, lw: lw * 0.8, r: T * 0.2, force: true }); c.fillStyle = INK; c.beginPath(); c.ellipse(b1[0] + Math.cos(hd) * T * 0.05, b1[1] + Math.sin(hd) * T * 0.04 + T * 0.02, T * 0.05, T * 0.1, 0, 0, TAU); c.fill(); };
    // (the far stalk behind the lobe, the near one in front of it)
    const farS = Math.cos(hd) > 0 ? 1 : -1; stalk(farS);
    // the inner light, then the lobe itself
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, 0.45 + 0.25 * Math.sin(bt * 2.4) + (M.pulse || 0) * 0.4 + sk * 0.4); blitSized(c, glowSprite(hue), q[0] - T * 1.9, q[1] - T * 1.7, T * 3.8, T * 3.4); c.restore();
    TN.ellipsoid(c, P3, hd, h, [0.78 * pk, 1.0 * pk, 0.72 * pk], { T, col: mix(BRAIN, hue, 0.2 + sk * 0.3), shade: mix(BRAIN_SH, hue, 0.15), hi: BRAIN_HI, line: INK, lw: lw * 1.1, d1: 0.1, d2: 0.22, spec: 0.55, force: true, glowCol: hue, glowA: 0.5 + sk * 0.3,
      inner: g => { const [ex, ey, rot] = DunFiend.KIT.ell3(0.78 * pk, 1.0 * pk, 0.72 * pk, hd), rx = ex * T, ry = ey * T, cr = Math.cos(rot), sr = Math.sin(rot), at = (x, y) => [q[0] + (x * cr - y * sr) * rx, q[1] + (x * sr + y * cr) * ry];
        // the folds: meandering ridges over the lobe, a fissure down its middle
        g.lineCap = 'round'; g.lineJoin = 'round'; const wob = Math.sin(bt * 2.4) * 0.02;
        GYRI.forEach(L => { g.beginPath(); L.forEach(([x, y], i) => { const p = at(x * (1 + wob), y * (1 + wob)); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.strokeStyle = 'rgba(112,30,82,.7)'; g.lineWidth = Math.max(1.4, T * 0.1); g.stroke(); g.save(); g.translate(-T * 0.04, -T * 0.05); g.strokeStyle = 'rgba(255,236,248,.3)'; g.lineWidth = Math.max(0.8, T * 0.04); g.stroke(); g.restore(); });
        const fa = P3(h[0] - P.cf * 0.7, h[1] - P.sf * 0.7, h[2] + 0.5), fb = P3(h[0] + P.cf * 0.7, h[1] + P.sf * 0.7, h[2] + 0.28); g.strokeStyle = 'rgba(80,16,56,.75)'; g.lineWidth = Math.max(1.4, T * 0.09); g.beginPath(); g.moveTo(fa[0], fa[1]); g.quadraticCurveTo((fa[0] + fb[0]) / 2 + T * 0.06, (fa[1] + fb[1]) / 2, fb[0], fb[1]); g.stroke();
        // veins of the inner light
        g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = TN.rgba(hue, 0.55 + 0.3 * Math.sin(bt * 5)); g.lineWidth = Math.max(1, T * 0.045); GYRI.forEach((L, k) => { if (k % 2) return; g.beginPath(); L.slice(0, 4).forEach(([x, y], i) => { const p = at(x, y); i ? g.lineTo(p[0], p[1] + T * 0.04) : g.moveTo(p[0], p[1] + T * 0.04); }); g.stroke(); }); g.restore(); } });
    stalk(-farS);
    // the small eyes: a row of glowing beads at its front
    [[2.5, 0.2, 1.3], [2.45, 0.42, 1.38]].forEach(([u, v, hh]) => [-1, 1].forEach(s => { const p = P3(...W(u, s * v, hh + rr * 0.65 - sk * 0.25)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7; blitSized(c, glowSprite(TEAL), p[0] - T * 0.3, p[1] - T * 0.3, T * 0.6, T * 0.6); c.restore(); c.fillStyle = INK; c.beginPath(); c.arc(p[0], p[1], Math.max(1.6, T * 0.095), 0, TAU); c.fill(); c.fillStyle = sk > 0.5 ? '#FFFFFF' : TEAL_HI; c.beginPath(); c.arc(p[0], p[1], Math.max(1, T * 0.06), 0, TAU); c.fill(); })); }
  /* the hammer-claw: a heavy arm, and a crushing claw: a massive palm clad in riveted hull plate, a short blunt fixed
     finger and a thick hooked finger over it, knobbed with crushing teeth */
  function drawHammer(c, M, P, P3, T, lw, t) { const col = { col: CH, shade: CH_SH, hi: CH_HI, line: INK, lw, force: true }, s = P3(...P.hamSh), e = P3(...P.hamEl), h = P.ham, th = P.hamDir, ax = Math.cos(th), ay = Math.sin(th);
    const wr = [h[0] - ax * 0.95, h[1] - ay * 0.95, h[2] + 0.1], w = P3(...wr), at = (k, z) => [h[0] + ax * k, h[1] + ay * k, h[2] + z];
    tubeLite(c, [s, [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2 - T * 0.1], e], u => T * (0.62 - u * 0.1), col); tubeLite(c, [e, [(e[0] + w[0]) / 2, (e[1] + w[1]) / 2], w], u => T * (0.52 + u * 0.06), col);
    TN.shape(c, TN.ell(e[0], e[1], T * 0.36, T * 0.31), Object.assign({ r: T * 0.36 }, col));
    const op = clamp(M.hamOpen == null ? 0.25 : M.hamOpen, 0, 1), toCam = ay > -0.2;
    const palm = () => TN.ellipsoid(c, P3, th, h, [1.08, 0.86, 0.8], { T, col: PLATE[1], shade: PL_SH, hi: PL_HI, line: INK, lw: lw * 1.15, d1: 0.1, d2: 0.24, spec: 0.55, force: true, inner: g => {
      // the plates over it: two seams with current in them, a row of rivets
      for (const k of [-0.4, 0.3]) { const a = P3(h[0] + ax * k + ay * 0.9, h[1] + ay * k - ax * 0.9, h[2] + 0.15), b = P3(h[0] + ax * k - ay * 0.9, h[1] + ay * k + ax * 0.9, h[2] + 0.15), mid = P3(h[0] + ax * k, h[1] + ay * k, h[2] + 0.85); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(mid[0] * 2 - (a[0] + b[0]) / 2, mid[1] * 2 - (a[1] + b[1]) / 2, b[0], b[1]); g.strokeStyle = 'rgba(14,10,22,.75)'; g.lineWidth = Math.max(1.5, T * 0.09); g.stroke(); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = TN.rgba(VIOLET_HI, 0.55 + 0.3 * Math.sin(t * 5 + k * 4)); g.lineWidth = Math.max(0.8, T * 0.035); g.stroke(); g.restore(); }
      g.fillStyle = '#161A26'; for (let k = 0; k < 6; k++) { const a = -1.0 + k * 0.4, p = P3(h[0] - ax * 0.05 + ay * Math.sin(a) * -0.65, h[1] - ay * 0.05 + ax * Math.sin(a) * 0.65, h[2] + 0.55 + Math.cos(a) * 0.18); g.beginPath(); g.arc(p[0], p[1], Math.max(1, T * 0.055), 0, TAU); g.fill(); } } });
    const fingers = () => {
      // the fixed finger: short, blunt, thick, knobbed along its top
      const f0 = P3(...at(0.8, -0.3)), f1 = P3(...at(1.35, -0.32)), f2 = P3(...at(1.72, -0.1)); tubeLite(c, [f0, f1, f2], u => T * (0.66 - u * 0.24), { col: '#2C2538', shade: CH_SH, hi: '#6A5C82', line: INK, lw, force: true });
      // the hooked finger above it, opening and slamming shut
      const d0 = P3(...at(0.55, 0.5)), d1 = P3(...at(1.2, 0.62 + op * 0.4)), d2 = P3(...at(1.78, 0.18 + op * 0.65)); tubeLite(c, [d0, d1, d2], u => T * (0.6 - u * 0.26), { col: '#2C2538', shade: CH_SH, hi: '#6A5C82', line: INK, lw, force: true });
      // crushing teeth: pale knobs on the inner edges
      c.fillStyle = '#E4DCF0'; c.strokeStyle = INK; c.lineWidth = lw * 0.6; [[0.95, -0.08], [1.25, -0.06], [1.5, 0.02]].forEach(([k, z]) => { const p = P3(...at(k, z)); c.beginPath(); c.ellipse(p[0], p[1], T * 0.1, T * 0.075, 0, 0, TAU); c.fill(); c.stroke(); });
      [[1.0, 0.3 + op * 0.3], [1.4, 0.18 + op * 0.45]].forEach(([k, z]) => { const p = P3(...at(k, z)); c.beginPath(); c.ellipse(p[0], p[1], T * 0.09, T * 0.07, 0, 0, TAU); c.fill(); c.stroke(); });
      // the blunt tips, scuffed bright
      [f2, d2].forEach(p => { c.fillStyle = 'rgba(200,190,230,.5)'; c.beginPath(); c.arc(p[0] - T * 0.05, p[1] - T * 0.06, T * 0.09, 0, TAU); c.fill(); }); };
    if (toCam) { palm(); fingers(); } else { fingers(); palm(); } }
  /* the shear-claw: a long arm and a long scissor of two blades with bright steel edges, scissoring; it holds the
     plate's edge */
  function drawShear(c, M, P, P3, T, lw, t) { const col = { col: CH, shade: CH_SH, hi: CH_HI, line: INK, lw, force: true }, s = P3(...P.shSh), e = P3(...P.shEl), w = P3(...P.wr), sa = P.sa, so = P.so, wr = P.wr;
    tubeLite(c, [s, [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2 - T * 0.08], e], u => T * (0.46 - u * 0.08), col); tubeLite(c, [e, [(e[0] + w[0]) / 2, (e[1] + w[1]) / 2], w], u => T * (0.38 - u * 0.02), col);
    TN.shape(c, TN.ell(e[0], e[1], T * 0.28, T * 0.24), Object.assign({ r: T * 0.28 }, col));
    // the two blades: a fixed lower one along the palm, a moving upper one opening from it
    const blade = (da, dz, len, up) => { const a = sa + da, base = [wr[0] + Math.cos(a) * 0.4, wr[1] + Math.sin(a) * 0.4, wr[2]], tipW = [wr[0] + Math.cos(a) * len, wr[1] + Math.sin(a) * len, Math.max(0.1, wr[2] - 0.35 + dz)], mid = [lerp(base[0], tipW[0], 0.5), lerp(base[1], tipW[1], 0.5), lerp(base[2], tipW[2], 0.5) + 0.15];
      const b = P3(...base), m2 = P3(...mid), tp = P3(...tipW), dx = tp[0] - b[0], dy = tp[1] - b[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * up, ny = dx / d * up, wb = T * 0.44;
      const pts = [[b[0] + nx * wb, b[1] + ny * wb], [m2[0] + nx * wb * 0.95, m2[1] + ny * wb * 0.95], [tp[0], tp[1]], [m2[0] - nx * wb * 0.3, m2[1] - ny * wb * 0.3], [b[0] - nx * wb * 0.45, b[1] - ny * wb * 0.45]];
      TN.shape(c, TN.poly(pts), { col: '#6C7290', shade: '#454A62', shade2: '#3A3E54', hi: '#B8C0DC', line: INK, lw, r: wb * 0.7, d1: 0.2, d2: 0.22, force: true });
      // the steel edge, and current along it
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[4][0], pts[4][1]); c.lineTo(pts[3][0], pts[3][1]); c.lineTo(pts[2][0], pts[2][1]); c.strokeStyle = '#C8CEE4'; c.lineWidth = Math.max(1.5, T * 0.09); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = TN.rgba(VIOLET_HI, 0.55 + 0.3 * Math.sin(t * 6)); c.lineWidth = Math.max(1, T * 0.05); c.stroke(); c.restore(); };
    blade(-so * 0.35, -0.05, 2.45, -1); blade(so * 0.55, 0.15 + so * 0.4, 2.3, 1);
    // the palm and the hinge
    TN.ellipsoid(c, P3, sa, [wr[0] + Math.cos(sa) * 0.15, wr[1] + Math.sin(sa) * 0.15, wr[2]], [0.72, 0.42, 0.4], { T, col: PLATE[3], shade: PL_SH, hi: PL_HI, line: INK, lw, d1: 0.1, d2: 0.24, spec: 0.5, force: true });
    const hq = P3(wr[0] + Math.cos(sa) * 0.45, wr[1] + Math.sin(sa) * 0.45, wr[2] + 0.2); c.save(); c.globalCompositeOperation = 'lighter'; blitSized(c, glowSprite(VIOLET), hq[0] - T * 0.4, hq[1] - T * 0.4, T * 0.8, T * 0.8); c.restore(); c.fillStyle = VIOLET_HI; c.beginPath(); c.arc(hq[0], hq[1], Math.max(1.2, T * 0.08), 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.6; c.stroke(); }
  /* the plate: a torn piece of hull held upright before it, riveted, a violet-scorched seam, the torn top edge */
  function drawPlate(c, M, P, P3, T, lw, t) { const W = P.W, UP = P.UP, h0 = P.h0, k = P.sh, R = mulberry32(17);
    const top = [], bot = []; for (let i = 0; i <= 7; i++) { const v = -1.5 + i / 7 * 3.05, bow = 0.22 * (1 - (v / 1.55) * (v / 1.55)), hh = h0 + 2.45 + (i % 2 ? -0.22 : 0.12) * (i > 0 && i < 7 ? 1 : 0) + (R() - 0.5) * 0.18; top.push(W(UP + bow - 0.25, v, Math.max(0, hh))); bot.push(W(UP + bow, v, Math.max(0, h0))); }
    if (top.every((p, i) => p[2] - bot[i][2] < 0.05)) return;
    const pts = top.concat(bot.reverse()).map(p => P3(...p)), front = Math.sin(P.hd) > -0.15, cl = M.clang || 0;
    TN.shape(c, TN.poly(pts), { col: front ? mix('#626C8A', '#FFFFFF', cl * 0.4) : '#30364A', shade: front ? '#3A4056' : '#20242F', hi: front ? '#A2ACCA' : '#4A5268', line: INK, lw: lw * 1.2, r: T * 1.4, d1: 0.08, d2: 0.16, force: true, alpha: Math.min(1, k * 1.5), inner: g => {
      // rivet rows, a scorched seam with current in it, a dent
      g.fillStyle = '#161A26'; for (const hh of [0.45, 1.95]) for (let i = 0; i < 8; i++) { const v = -1.3 + i / 7 * 2.65, bow = 0.22 * (1 - (v / 1.55) * (v / 1.55)), p = P3(...W(UP + bow - 0.05 - hh * 0.1, v, Math.max(0, h0 + hh))); g.beginPath(); g.arc(p[0], p[1], Math.max(1, T * 0.05), 0, TAU); g.fill(); }
      const a = P3(...W(UP + 0.1, -0.5, Math.max(0, h0 + 0.8))), b = P3(...W(UP + 0.15, 0.2, Math.max(0, h0 + 1.4))), d = P3(...W(UP + 0.1, 0.8, Math.max(0, h0 + 1.2)));
      g.lineCap = 'round'; g.strokeStyle = 'rgba(10,6,16,.7)'; g.lineWidth = T * 0.12; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.stroke();
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = TN.rgba(VIOLET_HI, 0.7 + 0.3 * Math.sin(t * 9)); g.lineWidth = T * 0.05; g.stroke(); g.restore();
      const sc = P3(...W(UP + 0.1, -0.9, Math.max(0, h0 + 1.6))), gr = g.createRadialGradient(sc[0], sc[1], 0, sc[0], sc[1], T * 0.7); gr.addColorStop(0, 'rgba(20,10,20,.55)'); gr.addColorStop(1, 'rgba(20,10,20,0)'); g.fillStyle = gr; g.fillRect(sc[0] - T, sc[1] - T, T * 2, T * 2);
      if (cl > 0.05) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = cl * 0.5; g.fillStyle = '#FFFFFF'; g.fillRect(-1e4, -1e4, 2e4, 2e4); g.restore(); } } });
    // the torn top edge catching the light
    c.save(); c.globalAlpha = Math.min(1, k * 1.5); c.strokeStyle = 'rgba(220,228,255,.75)'; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); top.forEach((p, i) => { const q = P3(...p); i ? c.lineTo(q[0], q[1] + T * 0.06) : c.moveTo(q[0], q[1] + T * 0.06); }); c.stroke(); c.restore(); }
  /* a wing: a ragged fungal membrane in its own plane, folded flat on the back or spread wide and beating */
  function drawWing(c, M, P, P3, T, lw, sd, t) { const W = P.W, wk = easeOut(M.wingK || 0), beat = M.wingBeat || 0, fa = M.flapAmp || 0;
    const root = W(-0.15, sd * 0.4, RIM + DZ * 0.95), tipF = W(-1.55, sd * 1.05, RIM + DZ * 0.5), tipO = W(-0.85, sd * 4.2, RIM + 2.5 + Math.sin(beat) * 1.3 * fa), tip = lerp3(tipF, tipO, wk);
    const o0 = W(0, 0, 0), cF = W(0.25, sd * 1.15, -0.05), cO = W(-1.6, 0, -0.35 + Math.sin(beat - 0.6) * 0.3 * fa), chord = lerp3([cF[0] - o0[0], cF[1] - o0[1], cF[2] - o0[2]], [cO[0] - o0[0], cO[1] - o0[1], cO[2] - o0[2]], wk);
    const span = [tip[0] - root[0], tip[1] - root[1], tip[2] - root[2]], at = (s, q) => { const tp = 1 - 0.35 * s; return P3(root[0] + span[0] * s + chord[0] * q * tp, root[1] + span[1] * s + chord[1] * q * tp, root[2] + span[2] * s + chord[2] * q * tp); };
    const pts = WG.map(([s, q]) => at(s, q)), L = Math.hypot(span[0], span[1], span[2]);
    if (wk > 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.12 + wk * 0.12; const cq = at(0.5, 0.4); blitSized(c, glowSprite(FUNGUS), cq[0] - T * L * 0.6, cq[1] - T * L * 0.45, T * L * 1.2, T * L * 0.9); c.restore(); }
    TN.shape(c, TN.poly(pts), { col: WING, shade: WING_SH, hi: WING_HI, line: INK, lw, r: T * Math.max(0.6, L * 0.35), d1: 0.08, d2: 0.2, force: true, alpha: 0.94, inner: g => {
      // darker flesh toward the root, veins out to every point of the ragged edge
      const r0 = at(0, 0.15), gr = g.createRadialGradient(r0[0], r0[1], 0, r0[0], r0[1], T * L * 0.7); gr.addColorStop(0, 'rgba(122,58,110,.55)'); gr.addColorStop(1, 'rgba(122,58,110,0)'); g.fillStyle = gr; g.fillRect(r0[0] - T * L, r0[1] - T * L, T * L * 2, T * L * 2);
      g.strokeStyle = 'rgba(110,40,92,.8)'; g.lineWidth = Math.max(1, T * 0.055); g.lineCap = 'round'; WG.forEach(([s, q], i) => { if (i < 4 || i % 2) return; const p = at(s, q), mid = at(s * 0.55, q * 0.4); g.beginPath(); g.moveTo(r0[0], r0[1]); g.quadraticCurveTo(mid[0], mid[1], p[0], p[1]); g.stroke(); });
      // tears in the membrane: ragged slits showing the dark through
      g.fillStyle = '#1E0A24'; HOLES.forEach(([s, q, r], k) => { const a = at(s - r, q - r * 0.3), b = at(s + r * 0.2, q - r * 1.2), cc = at(s + r, q + r * 0.4), d = at(s - r * 0.1, q + r * 0.9); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(cc[0], cc[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill(); });
      // spore-spots glowing in the membrane
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = TN.rgba(TEAL_HI, 0.45 + 0.2 * Math.sin(t * 3 + sd)); [[0.45, 0.3], [0.7, 0.45], [0.3, 0.7]].forEach(([s, q]) => { const p = at(s, q); g.beginPath(); g.arc(p[0], p[1], Math.max(1, T * 0.07), 0, TAU); g.fill(); }); g.restore(); } });
    // the leading spar
    const sp = [0, 0.3, 0.6, 0.95].map(s => at(s, -0.03)); tubeLite(c, sp, u => T * (0.18 - u * 0.12), { col: '#5A2048', shade: '#3A1030', hi: '#9A5080', line: INK, lw: lw * 0.8, force: true }); }

  /* ---------- the charge cells on the deck ---------- */
  function drawCell(c, FX, o, X, Y, T, t) { const M = FX.mem, s = M.slots ? M.slots[o.slot] : null, rise = s ? easeOut(s.rise) : 1, r = o.r * T * 1.1, sh = o.grabbed && M.dv && M.dv.eating ? Math.sin(t * 40) * T * 0.06 * (0.4 + M.dv.eat) : 0;
    c.save(); c.translate(X + sh, Y - r * 0.7 + (1 - rise) * r * 2.2); if (rise < 1) { c.beginPath(); c.rect(-r * 3, -r * 5, r * 6, r * 5 + r * 0.85 - (1 - rise) * r * 2.2); c.clip(); }
    DunArt.MP.chargecell(c, r, (t * 0.7 + o.slot * 0.23) % 1, {}); c.restore();
    if (o.grabbed && M.dv && M.dv.eating) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 + 0.4 * M.dv.eat; blitSized(c, glowSprite(VIOLET_HI), X - T * 1.2, Y - T * 1.9, T * 2.4, T * 2.4); c.restore(); } }

  /* ---------- the Breach: the deck, the void, the sky ---------- */
  function paintFloor(c, A) { const R = A.R, rnd = A.rnd;
    // the void beyond the rim, crackling violet
    c.fillStyle = '#07020F'; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    let g = c.createRadialGradient(0, 0, R - 0.6, 0, 0, R + 1.5); g.addColorStop(0, 'rgba(196,82,255,.5)'); g.addColorStop(0.45, 'rgba(120,40,200,.22)'); g.addColorStop(1, 'rgba(40,10,80,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    c.lineCap = 'round'; for (let i = 0; i < 46; i++) { const a = rnd() * TAU; let r = R + 0.3 + rnd() * 1.0, x = Math.cos(a) * r, y = Math.sin(a) * r; c.strokeStyle = `rgba(232,184,255,${0.15 + rnd() * 0.35})`; c.lineWidth = 0.03 + rnd() * 0.05; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { const aa = a + (rnd() - 0.5) * 0.4; r += (rnd() - 0.3) * 0.4; x = Math.cos(aa) * r + (rnd() - 0.5) * 0.3; y = Math.sin(aa) * r + (rnd() - 0.5) * 0.3; c.lineTo(x, y); } c.stroke(); }
    // the deck: its torn outline, jagged where the plates broke
    const edge = []; for (let i = 0; i < 96; i++) { const a = i / 96 * TAU, r = R + 0.15 + (rnd() - 0.35) * 0.45 + (i % 9 === 0 ? 0.55 : 0) - (i % 13 === 5 ? 0.3 : 0); edge.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const edgeP = () => { c.beginPath(); edge.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); };
    c.save(); c.globalCompositeOperation = 'lighter'; edgeP(); c.strokeStyle = 'rgba(196,82,255,.35)'; c.lineWidth = 0.7; c.stroke(); c.strokeStyle = 'rgba(232,184,255,.4)'; c.lineWidth = 0.22; c.stroke(); c.restore();
    g = c.createRadialGradient(0, -R * 0.2, R * 0.1, 0, 0, R + 0.5); g.addColorStop(0, '#30364A'); g.addColorStop(0.7, '#282D3C'); g.addColorStop(1, '#1F2330'); edgeP(); c.fillStyle = g; c.fill();
    c.save(); edgeP(); c.clip();
    // the plates: staggered rows, each a shade apart, bevelled, riveted along their edges
    const PW = 2.4, PH = 1.7; for (let row = -9; row <= 9; row++) { const y0 = row * PH, off = (row % 2 ? PW / 2 : 0) + (rnd() - 0.5) * 0.2; for (let col = -7; col <= 7; col++) { const x0 = col * PW + off; if (Math.hypot(x0 + PW / 2, y0 + PH / 2) > R + 1.5) continue; const sh = rnd(), x = x0 + 0.04, y = y0 + 0.04, w = PW - 0.08, h = PH - 0.08;
      c.fillStyle = sh < 0.25 ? '#2B3140' : sh < 0.5 ? '#313747' : sh < 0.75 ? '#282D3B' : '#2E3343'; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(160,170,200,.12)'; c.fillRect(x, y, w, 0.06); c.fillRect(x, y, 0.06, h); c.fillStyle = 'rgba(8,6,16,.4)'; c.fillRect(x, y + h - 0.07, w, 0.07); c.fillRect(x + w - 0.07, y, 0.07, h);
      c.fillStyle = 'rgba(14,12,22,.55)'; for (let k = 0; k < 6; k++) { const rx = x + 0.2 + k * (w - 0.4) / 5; c.beginPath(); c.arc(rx, y + 0.16, 0.045, 0, TAU); c.arc(rx, y + h - 0.16, 0.045, 0, TAU); c.fill(); }
      if (rnd() < 0.18) { c.strokeStyle = 'rgba(10,8,18,.35)'; c.lineWidth = 0.04; c.beginPath(); c.moveTo(x + w * 0.2, y + h * 0.3); c.lineTo(x + w * 0.8, y + h * 0.3); c.moveTo(x + w * 0.2, y + h * 0.7); c.lineTo(x + w * 0.8, y + h * 0.7); c.stroke(); }
      if (rnd() < 0.035) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); for (let k = -3; k < 8; k++) { c.fillStyle = k % 2 ? 'rgba(255,178,63,.12)' : 'rgba(20,16,20,.15)'; c.beginPath(); c.moveTo(x + k * 0.35, y + h); c.lineTo(x + k * 0.35 + 0.35, y + h); c.lineTo(x + k * 0.35 + 0.35 + h * 0.6, y); c.lineTo(x + k * 0.35 + h * 0.6, y); c.closePath(); c.fill(); } c.restore(); } } }
    // scorch where things burned, oily stains of slag
    for (let i = 0; i < 9; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 2), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 1 + rnd() * 1.8; const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, 'rgba(10,6,14,.5)'); gg.addColorStop(1, 'rgba(10,6,14,0)'); c.fillStyle = gg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    // the tears in the deck: violet light from the void beneath
    for (let i = 0; i < 3; i++) { const a = rnd() * TAU, d = 4 + rnd() * (R - 6); let x = Math.cos(a) * d, y = Math.sin(a) * d; const pts = [[x, y]], b = rnd() * TAU; for (let j = 0; j < 5; j++) { x += Math.cos(b + (rnd() - 0.5) * 1.0) * 0.5; y += Math.sin(b + (rnd() - 0.5) * 1.0) * 0.5; pts.push([x, y]); }
      c.lineCap = 'round'; c.lineJoin = 'round'; const path = () => { c.beginPath(); pts.forEach(([px, py], k) => k ? c.lineTo(px, py) : c.moveTo(px, py)); }; path(); c.strokeStyle = 'rgba(150,160,190,.25)'; c.lineWidth = 0.46; c.stroke(); path(); c.strokeStyle = '#0A0414'; c.lineWidth = 0.36; c.stroke(); c.save(); c.globalCompositeOperation = 'lighter'; path(); c.strokeStyle = 'rgba(196,82,255,.28)'; c.lineWidth = 0.16; c.stroke(); c.restore(); }
    // fungus creeping in from the rim: pink cushions, teal caps
    for (let i = 0; i < 16; i++) { const a = rnd() * TAU, d = R - 0.8 - rnd() * 2.2, x = Math.cos(a) * d, y = Math.sin(a) * d; for (let k = 0; k < 5; k++) { const ox = x + (rnd() - 0.5) * 0.9, oy = y + (rnd() - 0.5) * 0.6, r = 0.12 + rnd() * 0.2; c.fillStyle = rnd() < 0.7 ? (rnd() < 0.5 ? '#C86AA0' : '#E88AC0') : '#3FE0C8'; c.beginPath(); c.ellipse(ox, oy, r, r * 0.7, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,230,245,.35)'; c.beginPath(); c.arc(ox - r * 0.3, oy - r * 0.3, r * 0.3, 0, TAU); c.fill(); } }
    // the sockets the charge cells stand in: hatches ringed in warning stripes
    SLOTS.forEach(([x, y]) => { c.fillStyle = '#14121C'; c.beginPath(); c.arc(x, y, 1.0, 0, TAU); c.fill(); for (let k = 0; k < 16; k++) { const a0 = k / 16 * TAU, a1 = (k + 1) / 16 * TAU; c.fillStyle = k % 2 ? '#1A1A1A' : 'rgba(255,178,63,.75)'; c.beginPath(); c.arc(x, y, 1.0, a0, a1); c.arc(x, y, 0.82, a1, a0, true); c.closePath(); c.fill(); } c.strokeStyle = 'rgba(232,184,255,.5)'; c.lineWidth = 0.05; c.beginPath(); c.arc(x, y, 0.7, 0, TAU); c.stroke(); });
    c.restore();
    // the torn rim: plates bent up at the edge, their lit faces toward the deck
    for (let i = 0; i < 34; i++) { const a = i / 34 * TAU + rnd() * 0.08, r0 = R - 0.25, r1 = R + 0.55 + rnd() * 0.6, w = 0.08 + rnd() * 0.06, lit = Math.sin(a + 0.8) < 0;
      const p = [[Math.cos(a - w) * r0, Math.sin(a - w) * r0], [Math.cos(a + w) * r0, Math.sin(a + w) * r0], [Math.cos(a + w * 0.4) * r1, Math.sin(a + w * 0.4) * r1], [Math.cos(a - w * 0.7) * (r1 - 0.25), Math.sin(a - w * 0.7) * (r1 - 0.25)]];
      c.fillStyle = lit ? '#5A6278' : '#2E3342'; c.beginPath(); p.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); c.strokeStyle = 'rgba(10,8,16,.8)'; c.lineWidth = 0.05; c.stroke(); c.strokeStyle = 'rgba(200,210,240,.35)'; c.lineWidth = 0.04; c.beginPath(); c.moveTo(p[0][0], p[0][1]); c.lineTo(p[3][0], p[3][1]); c.stroke(); }
    edgeP(); c.strokeStyle = 'rgba(10,8,16,.85)'; c.lineWidth = 0.1; c.stroke(); c.strokeStyle = 'rgba(160,170,200,.35)'; c.lineWidth = 0.04; c.stroke(); }
  function paintSky(c, W, H, t, cam, T, FX) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05020C'); g.addColorStop(0.45, '#140726'); g.addColorStop(1, '#0A0414'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(97); c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { c.globalAlpha = 0.16 + R() * 0.12; blitSized(c, glowSprite(i % 3 ? VIOLET : i % 2 ? TEAL : FUNGUS), R() * W - W * 0.3, R() * H * 0.5 - H * 0.1, W * 0.6, H * 0.35); }
    c.globalAlpha = 1; c.fillStyle = '#FFFFFF'; for (let i = 0; i < 70; i++) { c.globalAlpha = 0.25 + R() * 0.6; c.beginPath(); c.arc(R() * W, R() * H * 0.45, 0.4 + R() * 0.9, 0, TAU); c.fill(); } c.restore();
    // the wreck on the horizon: great ribs arching out of the plain, broken spars, seams glowing violet
    const base = H * 0.5; c.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const x = W * (i + 0.5) / 7 + (R() - 0.5) * 30, h = H * (0.18 + R() * 0.16), lean = (R() - 0.5) * 60; c.strokeStyle = '#120A1E'; c.lineWidth = 10 + R() * 8; c.beginPath(); c.moveTo(x - 20, base); c.bezierCurveTo(x - 24, base - h * 0.7, x + lean, base - h * 1.1, x + lean + 40, base - h * 0.85); c.stroke(); c.strokeStyle = 'rgba(196,82,255,.35)'; c.lineWidth = 2; c.stroke(); }
    c.fillStyle = '#0C0616'; c.beginPath(); c.moveTo(0, base); for (let x = 0; x <= W; x += 24) c.lineTo(x, base - 12 - R() * 26 - (Math.abs(x - W * 0.5) < W * 0.15 ? 30 : 0)); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { c.fillStyle = TN.rgba(i % 3 ? VIOLET_HI : i % 2 ? TEAL : FUNGUS, 0.5 + R() * 0.4); c.beginPath(); c.arc(R() * W, base - R() * 40, 1 + R() * 1.6, 0, TAU); c.fill(); }
    // the engine's heart glowing far off, and forks of its lightning
    c.globalAlpha = 0.5; blitSized(c, glowSprite(VIOLET), W * 0.35, base - H * 0.2, W * 0.3, H * 0.28); c.globalAlpha = 1;
    for (let k = 0; k < 4; k++) { let x = R() * W, y = 0; c.strokeStyle = TN.rgba(VIOLET_HI, 0.35 + R() * 0.3); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 7; j++) { x += (R() - 0.5) * 40; y += base * 0.12; c.lineTo(x, y); } c.stroke(); } c.restore(); }
  /* on the deck (under everything that stands): torn-up holes, dropped plates, slam craters, the cells' blast rings, the
     plate's guarded arc */
  function drawOverlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !M.slots) return; const sx = FX.sx, sy = FX.sy;
    // the rim crackling: a few arcs of current over the void's edge
    const R = mulberry32(Math.floor(t * 5)); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let k = 0; k < 3; k++) { const a = R() * TAU; let r = AR + 0.3; c.beginPath(); c.moveTo(sx(FX.C.x + Math.cos(a) * r), sy(FX.C.y + Math.sin(a) * r)); for (let j = 0; j < 5; j++) { const aa = a + (j + 1) * 0.06 * (R() < 0.5 ? 1 : -1); r = AR + 0.2 + R() * 1.0; c.lineTo(sx(FX.C.x + Math.cos(aa) * r), sy(FX.C.y + Math.sin(aa) * r)); } c.strokeStyle = TN.rgba(VIOLET_HI, 0.5 + 0.4 * R()); c.lineWidth = Math.max(1.2, T * 0.05); c.stroke(); } c.restore();
    // where plates were torn up: dark holes, violet below
    M.holes.forEach(hh => { const X = sx(hh.x), Y = sy(hh.y), a = clamp((14 - hh.t) / 3, 0, 1); c.save(); c.globalAlpha = a; c.translate(X, Y); c.scale(1, 0.55); c.rotate(hh.a); c.beginPath(); for (let i = 0; i < 10; i++) { const u = i / 10 * TAU, rr = T * (i % 2 ? 1.25 : 1.5); c.lineTo(Math.cos(u) * rr * 1.1, Math.sin(u) * rr * 0.55); } c.closePath(); c.fillStyle = '#0A0414'; c.fill(); c.strokeStyle = 'rgba(150,160,190,.4)'; c.lineWidth = Math.max(1.5, T * 0.06); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = TN.rgba(VIOLET, 0.4); c.lineWidth = Math.max(1, T * 0.1); c.scale(0.8, 0.8); c.stroke(); c.restore(); });
    // the plates it dropped, lying on the deck
    M.drops.forEach(d => { const X = sx(d.x), Y = sy(d.y), a = clamp((10 - d.t) / 2, 0, 1) * clamp(d.t / 0.15, 0, 1); c.save(); c.globalAlpha = a; c.translate(X, Y); c.scale(1, 0.6); c.rotate(d.rot); const w = T * 1.5, h = T * 1.15; c.beginPath(); c.moveTo(-w, h); c.lineTo(w, h); c.lineTo(w * 0.95, -h * 0.7); c.lineTo(w * 0.55, -h); c.lineTo(w * 0.2, -h * 0.75); c.lineTo(-w * 0.3, -h * 1.05); c.lineTo(-w * 0.75, -h * 0.8); c.lineTo(-w, -h * 0.95); c.closePath(); c.fillStyle = '#4A5268'; c.fill(); c.strokeStyle = INK; c.lineWidth = Math.max(1.5, T * 0.07); c.stroke(); c.fillStyle = '#161A26'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-w * 0.8 + i * w * 0.32, h * 0.7, T * 0.06, 0, TAU); c.fill(); } c.restore(); });
    // slam craters: cracks of amber heat in the plates
    M.craters.forEach(k => { const X = sx(k.x), Y = sy(k.y), a = clamp((3 - k.t) / 1.5, 0, 1), Rr = mulberry32(k.seed); c.save(); c.globalAlpha = a; c.lineCap = 'round'; for (let i = 0; i < 8; i++) { let x = X, y = Y; const b = i / 8 * TAU + Rr() * 0.5; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += Math.cos(b + (Rr() - 0.5) * 0.8) * T * 0.55; y += Math.sin(b + (Rr() - 0.5) * 0.8) * T * 0.35; c.lineTo(x, y); } c.strokeStyle = 'rgba(8,4,12,.8)'; c.lineWidth = T * 0.12; c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = TN.rgba(AMBER, 0.7 * a); c.lineWidth = T * 0.05; c.stroke(); c.globalCompositeOperation = 'source-over'; } c.restore(); });
    // a rising cell's socket opening
    M.slots.forEach(s => { if (!s.cell || s.rise >= 1) return; const X = sx(s.x), Y = sy(s.y); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * (1 - s.rise * 0.5); blitSized(c, glowSprite(VIOLET_HI), X - T * 1.3, Y - T * 0.8, T * 2.6, T * 1.6); c.restore(); });
    // the blast rings: faint round every cell; lit (and marked) when Kh'aal stands in one
    if (m && !m.dead) { const cells = liveCells(M); cells.forEach(o => { const X = sx(o.x), Y = sy(o.y), d = Math.hypot(m.x - o.x, m.y - o.y), inR = d < JOLT_D && (M.alt || 0) < 2.5, eat = o.grabbed && M.dv && M.dv.eating, k = inR ? 0.75 + 0.25 * Math.sin(t * 10) : 0.17;
      c.save(); c.strokeStyle = TN.rgba(inR ? TEAL_HI : VIOLET_HI, k); c.lineWidth = Math.max(1.2, T * (inR ? 0.09 : 0.04)); c.setLineDash([T * 0.35, T * 0.25]); c.lineDashOffset = -t * T * 1.5; c.beginPath(); c.arc(X, Y, BLAST * T, 0, TAU); c.stroke(); c.setLineDash([]);
      if (inR) { c.fillStyle = TN.rgba(TEAL, 0.06 + 0.03 * Math.sin(t * 10) + (eat ? 0.05 : 0)); c.fill(); }
      c.restore(); }); }
    // the plate's guarded side: an arc on the deck before it, and the open back
    if (m && !m.dead && (M.shieldK || 0) > 0.3 && !(m.stunT > 0) && (M.alt || 0) < 1) { const X = sx(m.x), Y = sy(m.y), r0 = (m.r + 0.5) * T, r1 = (m.r + 1.3) * T, a = M.hd, k = M.shieldK; c.save(); c.globalAlpha = k;
      c.beginPath(); c.arc(X, Y, r1, a - SHIELD_ARC, a + SHIELD_ARC); c.arc(X, Y, r0, a + SHIELD_ARC, a - SHIELD_ARC, true); c.closePath(); c.fillStyle = TN.rgba(VIOLET_HI, 0.16 + 0.1 * (M.clang || 0)); c.fill(); c.strokeStyle = TN.rgba('#F2E6FF', 0.75); c.lineWidth = Math.max(2, T * 0.08); c.stroke();
      const lx = X + Math.cos(a) * (r0 + r1) / 2, ly = Y + Math.sin(a) * (r0 + r1) / 2; c.font = `900 ${Math.round(T * 0.34)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(20,6,30,.75)'; c.strokeText('SHIELD', lx, ly); c.fillStyle = '#F6EEFF'; c.fillText('SHIELD', lx, ly);
      // the open back: teal chevrons
      c.strokeStyle = TN.rgba(TEAL_HI, 0.7 + 0.3 * Math.sin(t * 6)); c.lineWidth = Math.max(2, T * 0.08); for (let i = -1; i <= 1; i++) { const b = a + Math.PI + i * 0.38, px = X + Math.cos(b) * r1, py = Y + Math.sin(b) * r1, ox = Math.cos(b), oy = Math.sin(b), nx = -oy, ny = ox, s = T * 0.3; c.beginPath(); c.moveTo(px + ox * s + nx * s, py + oy * s + ny * s); c.lineTo(px, py); c.lineTo(px + ox * s - nx * s, py + oy * s - ny * s); c.stroke(); }
      if (Math.abs(angTo(a, Math.atan2(FX.me.y - m.y, FX.me.x - m.x))) < SHIELD_ARC) { const bx = X + Math.cos(a + Math.PI) * (r1 + T * 0.6), by = Y + Math.sin(a + Math.PI) * (r1 + T * 0.6); c.strokeStyle = 'rgba(4,20,16,.75)'; c.lineWidth = 3; c.strokeText('OPEN', bx, by); c.fillStyle = '#E8FFF8'; c.fillText('OPEN', bx, by); } c.restore(); } }
  // a lane of molten slag: glowing blobs crusting over as it cools
  function drawSlag(c, z, FX, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y), fade = Math.min(1, z.age / 0.15, (z.life - z.age) / 0.8), cool = clamp(z.age / z.life, 0, 1), R = mulberry32(z.seed || 7);
    c.save(); c.globalAlpha = Math.max(0, fade); c.translate(X, Y); c.rotate(z.a);
    c.fillStyle = 'rgba(30,8,4,.55)'; c.beginPath(); c.ellipse(z.len * T / 2, 0, z.len * T / 2 + T * 0.2, z.w * T * 0.55, 0, 0, TAU); c.fill();
    const n = Math.max(4, Math.round(z.len * 1.25)), blobs = []; for (let i = 0; i < n; i++) blobs.push([(i + 0.5) / n * z.len * T + (R() - 0.5) * T * 0.4, (R() - 0.5) * z.w * T * 0.45, T * (0.27 + R() * 0.18)]);
    c.fillStyle = mix('#7A2A10', '#2A1410', cool); blobs.forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x, y, r * 1.15, r * 0.8, 0, 0, TAU); c.fill(); });
    c.globalCompositeOperation = 'lighter'; blobs.forEach(([x, y, r], i) => { const fl = 0.6 + 0.4 * Math.sin(t * 7 + i * 1.7); c.fillStyle = TN.rgba(SLAG, (0.7 - cool * 0.35) * fl); c.beginPath(); c.ellipse(x, y, r * 0.85, r * 0.58, 0, 0, TAU); c.fill(); c.fillStyle = TN.rgba(SLAG_HI, (0.6 - cool * 0.4) * fl); c.beginPath(); c.ellipse(x - r * 0.15, y - r * 0.1, r * 0.4, r * 0.26, 0, 0, TAU); c.fill(); });
    c.restore(); }
  /* in the air: slag globs in flight, the bolts of the cells' lightning, the devouring meter, the labels */
  function drawAir(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M.slots) return; const sx = FX.sx, sy = FX.sy;
    // the globs arcing down their lanes
    M.globs.forEach(gb => { if (gb.t < 0) return; const u = clamp(gb.t / gb.d, 0, 1), d = gb.len * u, x = gb.x0 + Math.cos(gb.a) * d, y = gb.y0 + Math.sin(gb.a) * d, z = 1.4 + Math.sin(u * Math.PI) * 2.2 - u * 1.4, X = sx(x), Y = sy(y) - z * T; c.save(); c.globalCompositeOperation = 'lighter'; blitSized(c, glowSprite(SLAG), X - T * 0.6, Y - T * 0.6, T * 1.2, T * 1.2); c.restore(); c.fillStyle = SLAG_HI; c.strokeStyle = '#3A1408'; c.lineWidth = 1.5; c.beginPath(); c.arc(X, Y, Math.max(2, T * 0.17), 0, TAU); c.fill(); c.stroke(); });
    // the lightning
    if (M.zaps.length) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; M.zaps.forEach(z => { const a = 1 - z.t / z.life, path = () => { c.beginPath(); z.pts.forEach((p, i) => { const X = sx(p[0]), Y = sy(p[1]) - p[2] * T; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); };
      path(); c.strokeStyle = TN.rgba(VIOLET, 0.45 * a); c.lineWidth = Math.max(3, T * 0.22); c.stroke(); path(); c.strokeStyle = TN.rgba(VIOLET_HI, 0.85 * a); c.lineWidth = Math.max(1.5, T * 0.08); c.stroke(); path(); c.strokeStyle = TN.rgba('#FFFFFF', a); c.lineWidth = Math.max(0.8, T * 0.03); c.stroke(); }); c.restore(); }
    const lab = (X, Y, s, col) => { c.save(); c.font = `800 ${Math.round(T * 0.32)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, X, Y); c.fillText(s, X, Y); c.restore(); };
    // the devouring meter over the seized cell
    const V = M.dv; if (V && V.eating && V.cell && !V.cell.dead) { const o = V.cell, X = sx(o.x), Y = sy(o.y) - T * 2.3, r = T * 0.55; c.save(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = Math.max(4, T * 0.16); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke(); c.strokeStyle = V.eat > 0.7 ? '#FF6A8A' : VIOLET_HI; c.lineWidth = Math.max(3, T * 0.11); c.beginPath(); c.arc(X, Y, r, -Math.PI / 2, -Math.PI / 2 + TAU * V.eat); c.stroke(); c.fillStyle = '#FFFFFF'; c.font = `900 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(Math.round(V.eat * 100) + '%', X, Y); c.restore(); lab(X, Y - r - T * 0.35, 'DEVOURING · pop the cell!', '#FFD8F0'); }
    if (m.stunT > 0) { const w = FX.S.weak.brain; if (w && !w.dead) lab(sx(w.x), sy(w.y) - T * 1.6, 'BRAIN-LOBE · strike it', TEAL_HI); }
    else if ((M.alt || 0) < 2.5 && !(V && V.eating)) liveCells(M).forEach(o => { if (Math.hypot(m.x - o.x, m.y - o.y) < JOLT_D) lab(sx(o.x), sy(o.y) - T * 2.0, 'IN RANGE · break it!', '#E8FFF8'); }); }
})());
