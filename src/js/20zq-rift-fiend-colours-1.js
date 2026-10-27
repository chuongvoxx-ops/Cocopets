/* ---------- GRISAILLE, THE THIEF OF HUES ----------
   The Sea of Fallen Colours' first boss, in the Bleached Cove: a round beach of grey sand some thirty metres across at
   the edge of the pale, still, grey sea; bleached coral, driftwood and grey stones along its rim, and here and there a
   last shard of colour still glowing in the sand.
   Grisaille is a colossal hermit crab drained grey, and for its shell it carries every colour it has stolen: a huge
   cracked PRISM-SHELL of faceted crystal whorls, red, orange, yellow, green, blue and violet, light swirling inside it,
   the only colour in the cove. Two great grey pincers (one far larger than the other), long eye-stalks with pale greedy
   eyes that follow the pet, many jointed legs, whip antennae, a little cloak of grey barnacles over its back, and a
   wide toothy smirk. Cel-shaded and three-dimensional; greedy and comic: it hugs its shell, pats it, clacks its claws.
   Drain: its eye-stalks lock on and a grey ring spreads from it over the sand (shown): inside it the pet's colour drains
   away (a slow hurt) and it slows, for a few seconds. Step out.
   Pincer Crush: the big claw rises and slams a shown circle; then the small claw SNIPS along a short shown line (in its
   second phase, twice). The big claw stays stuck in the sand a moment: strike it there (a weak spot).
   Prism Beams: the shell flares and fires beams of single colours along shown lines from its facets (three lines, five
   in its second phase), three volleys, the lines turning slowly between them: stand in the gaps.
   Hue Theft (its stagger): it hugs its shell and drinks the cove's last colours: the shell's six colour facets light one
   by one. Strike the SHELL (a weak point: a meter shows how many blows) and it CRACKS: its stolen colours burst out, it
   reels, and the shell's HEART is bared (a weak point, two and a half times the blow). Too slow, and the sixth facet
   lights: the shell flares over a shown circle round it.
   The Brood (at half health): it hides in its shell (out of reach, its great claw shut over the opening) and thirty
   greylings burst up out of the sand round it, six at most at once; a counter shows how many are left. Clear them all
   and it is EXPOSED: tumbled half out, dizzy, its heart bare, for a long damage window. From then on a greyling or two
   crawl out of the sand now and then.
   Between acts it scuttles back (sideways, as crabs do) to its hollow near the cove's heart. It is never still: it
   breathes, its eye-stalks swivel and blink, its antennae sway, its claws clack, its legs shuffle, it pats its shell,
   and it rocks back when struck. */
RiftFiend.define({ id: 'grisaille', hpK: 1.25, dmgK: 1.25, name: 'Grisaille', title: 'The Thief of Hues', color: '#A8A8B2', glow: '#E2E2EA', accent: '#FFD36B', biome: 'greyshore', r: 3.0, els: ['light', 'water'], phases: 2 }, (() => {
  const { TAU, TN, sorted, hit } = RiftFiend, tubeLite = TN.tubeLite, K = DunFiend.KIT;
  const { INK, HUE } = COL;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const lerp3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const add3 = (a, b, k) => [a[0] + b[0] * (k == null ? 1 : k), a[1] + b[1] * (k == null ? 1 : k), a[2] + b[2] * (k == null ? 1 : k)], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const len3 = a => Math.hypot(a[0], a[1], a[2]), norm3 = a => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const turnTo = (a, b, dt, w) => a + clamp(angTo(a, b), -w * dt, w * dt);
  const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const mix = (a, b, u) => K.mixC(a, b, clamp(u, 0, 1)), rgba = TN.rgba;
  // the painter's palette: a crab drained of every colour, its shell the colours it stole
  const CRAB = '#BAB9C2', CRAB_SH = '#8F8E9C', CRAB_SH2 = '#7A7987', CRAB_HI = '#E8E7EE', CRAB_AO = '#4E4D5E', TIP = '#4A4954', TIP_SH = '#302F39', TIP_HI = '#7C7B88';
  const BARN = '#D6D5DB', BARN_SH = '#A4A3AE', BARN_D = '#4A4958';
  const EYE_W = '#F7F7FB', EYE_SH = '#D2D2DE', IRIS = '#CBC7DA', IRIS_D = '#8E89A6', PUPIL = '#201E2A';
  const SHELL_IN = '#2E2846', HOLE = '#140F22', SAND = '#C2C1C8', SAND_D = '#9C9BA4';
  const DRAINC = '#E4E4EE', DRAIN_F = '#2C2C42', CRUSHC = '#FF8A5C', SNIPC = '#FFD36B', DANGER = '#FF6A7A', OKC = '#9CFFD8';
  const CRABS = { col: CRAB, shade: CRAB_SH, shade2: CRAB_SH2, hi: CRAB_HI, line: INK };
  const TIPS = { col: TIP, shade: TIP_SH, shade2: TIP_SH, hi: TIP_HI, line: INK };
  // the Bleached Cove: the beach the pet walks, and the crab's hollow near its heart
  const AR = 15, HOME = [0, -2.2], REACH = 4.4, LUNGE = 2.6;
  /* the body (metres; u forward, v to its left, h up): a carapace jutting from the shell's mouth; the prism-shell behind
     and above it, three faceted whorls and a point; the big claw on its right (v-), the small one on its left */
  const CARA = { u: 0.55, h: 1.3, a: 1.3, b: 1.45, c: 0.84 };
  /* the prism-shell: a faceted crystal conch, its rings (six facets round, turning a little each ring) strung along a
     curve that runs back and up from its mouth (where the body comes out) and coils a little as it narrows to its point.
     Worked out once in the body's frame (u forward, v left, h up) */
  const SHELL = (() => { const ax = norm3([-0.74, 0.12, 0.66]), base = [-0.3, 0, 1.25], L = 4.7, e1 = norm3(cross3(ax, [0, 1, 0])), e2 = cross3(ax, e1), TS = [0, 0.09, 0.19, 0.3, 0.42, 0.54, 0.66, 0.77, 0.87];
    const cen = t => { const cr = 1.1 * t * (1 - t), ph = t * TAU * 1.15; return add3(add3(base, ax, L * Math.pow(t, 0.92)), add3(mul3(e1, Math.cos(ph) * cr), mul3(e2, Math.sin(ph) * cr))); };
    const rad = t => 2.55 * (0.72 + 0.28 * smooth(t / 0.2)) * (1 - 0.9 * t);
    const rings = TS.map((t, s) => { const c = cen(t), tg = norm3(sub3(cen(Math.min(1, t + 0.02)), cen(Math.max(0, t - 0.02)))), f1 = norm3(cross3(tg, [0, 1, 0])), f2 = cross3(tg, f1), r = rad(t), tw = s * 0.36;
      return { t, c, r, pts: Array.from({ length: 6 }, (_, j) => { const a = j / 6 * TAU + tw; return add3(c, add3(mul3(f1, Math.cos(a) * r), mul3(f2, Math.sin(a) * r))); }) }; });
    return { rings, apex: cen(1), heart: cen(0.2) }; })();
  const SHC = SHELL.heart, BIG = -1, SMALL = 1;
  // the camera looks along (0, -1, -1); the key light comes from the upper left, a little toward the camera
  const VIEW = [0, Math.SQRT1_2, Math.SQRT1_2], LIGHT = norm3([-0.5, 0.32, 0.82]);
  // the attack rotations (the second phase's from half health)
  const CYC1 = ['crush', 'drain', 'beams', 'theft', 'crush', 'beams', 'drain', 'theft'], CYC3 = ['beams', 'crush', 'theft', 'drain', 'crush', 'beams', 'theft', 'drain'];
  const BROOD_N = 30, BROOD_CAP = 6;
  // the last shards of colour lying in the sand (relative to the cove's heart): x, y, hue, size, tilt
  const SHARDS = (() => { const R = mulberry32(2207), out = []; for (let i = 0; i < 60 && out.length < 12; i++) { const a = R() * TAU, d = 4.4 + R() * 8.8, x = Math.cos(a) * d, y = Math.sin(a) * d; if (Math.hypot(x - HOME[0], y - HOME[1]) < 4.8 || out.some(q => Math.hypot(q[0] - x, q[1] - y) < 2.8)) continue; out.push([x, y, out.length % 6, 0.8 + R() * 0.5, (R() - 0.5) * 0.9]); } return out; })();
  // the barnacle cloak over its back: (yaw, elevation, size) on the carapace
  const BARNS = (() => { const R = mulberry32(919), out = []; for (let i = 0; i < 60 && out.length < 12; i++) { const al = (R() * 2 - 1) * 2.9, el = 0.5 + R() * 0.9, s = 0.08 + R() * 0.08; if (Math.abs(al) < 1.0 && el < 1.0) continue; if (out.some(q => Math.hypot(angTo(q[0], al) * Math.cos(el), q[1] - el) < 0.3)) continue; out.push([al, el, s]); } return out; })();
  // the shell's cracks, in each facet's own coordinates: a few always, many more when it is broken open
  const CRACKS = (() => { const out = {}; for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) for (let k = 0; k < 1; k++) { const R = mulberry32(31 + i * 97 + j * 13 + k * 7), mk = () => { let a = R() < 0.5 ? 0.05 : 0.95, b = R() * 0.6 + 0.2; const p = [[a, b]]; for (let s = 0; s < 4; s++) { a += (a < 0.5 ? 1 : -1) * (0.15 + R() * 0.12); b = clamp(b + (R() - 0.5) * 0.45, 0.04, 0.96); p.push([a, b]); } return p; }; out[i + '|' + j] = { base: R() < 0.28, p: mk(), q: mk() }; } return out; })();
  /* ---- the brood: greylings burst up out of the sand round it ---- */
  return {
    arenaR: AR, firstAct: 'sit', artY: 0.7, ambient: 'motes',
    artPoses: [{ name: 'eyeing you', mem: {} }, { name: 'hue theft: hugging its shell', mem: { hug: 1, thK: 1, litN: 3, greed: 1, glow: 0.8 } }, { name: 'pincer raised', mem: { raise: 1, evil: 1 } }, { name: 'the brood: hidden in its shell', mem: { hide: 1 } }, { name: 'cracked: the heart bared', mem: { stagK: 1, dizzy: 1, crack: 1, heart: 1 } }],
    phaseNames: ['The Bleached Cove', 'The Bleached Cove', 'The Brood', 'The Brood'],
    props(C) { const out = [], R = mulberry32(6620), kinds = ['bleachcoral', 'driftwood', 'greyrock', 'bleachcoral', 'prismshard', 'driftwood', 'greyrock', 'bleachcoral', 'driftwood', 'prismshard', 'greyrock'];
      for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + (R() - 0.5) * 0.16, far = Math.sin(a) < 0.1, s = far ? 1.05 + R() * 0.45 : 0.75 + R() * 0.3; out.push({ kind: kinds[i % kinds.length], i, v: Math.floor(R() * 12), s, x: C.x + Math.cos(a) * (AR + 0.7 + s * 0.3), y: C.y + Math.sin(a) * (AR + 0.55 + s * 0.2) }); } return out; },
    propKeep: { every: 30, box: p => [-1.7 * p.s, -3.0 * p.s, 1.7 * p.s, 0.5 * p.s] },
    drawProp(c, FX, p, X, Y, T) { c.translate(X, Y); const f = DunWorld.PROPS[p.kind]; if (f) f(c, T * p.s, p.v); },
    paintGround(c, A) { paintCove(c, A); },
    sky(c, W, H, t, cam, T) { paintSea(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, h = homeP(FX); m.noTouch = true; m.x = h.x; m.y = h.y; m.act = 'enter';
      Object.assign(M, { home: h, bt: 0, hd: Math.PI / 2, hdTo: Math.PI / 2, alt: -2.6, rose: false, roared: false, recoil: 0, hitK: 0, ouch: 0, ouchCd: 0, stagK: 0, dizzy: 0, evil: 0, evilTo: 0, greed: 0, greedTo: 0, lock: 0, lockTo: 0,
        hide: 0, hideTo: 0, hug: 0, hugTo: 0, raise: 0, raiseTo: 0, slamK: 0, slamTo: 0, slamP: null, cHold: false, snip: 0, snipP: null, snipOpen: 0, sHold: false, pat: 0, patT: 7, pat0: -9, lean: 0, leanTo: 0,
        clack: 0, clackT: 3, blink: 0, blinkT: 2.5, blinkA: 0, look: 0, aim: Math.PI / 2, eyeW: [0, 0], eyeT: 1.4, glow: 0.25, glowTo: 0.25, thK: 0, litN: 0, crack: 0, heart: 0, heartHit: 0, clawHit: 0, shellHit: 0,
        gait: 0, spdK: 0, sc: null, scCd: 2.5, dr: null, cr: null, bm: null, th: null, br: null, bumps: [], marks: [], picks: 0, nextAct: null, last: null, seen: {}, taught: false, wasStun: false, wasEnter: true, stunKind: null, stunWas: null, trickleT: 9,
        stat: { drains: 0, drainTicks: 0, crushes: 0, crushHit: 0, crushMiss: 0, crushDodged: 0, clawStuck: 0, snips: 0, snipHit: 0, snipMiss: 0, beams: 0, volleys: 0, beamHit: 0, beamMiss: 0, thefts: 0, cracks: 0, flares: 0, flareHit: 0, flareMiss: 0, brood: 0, poured: 0, killed: 0, exposed: 0, homeRuns: 0, trickled: 0 } }); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; clearActs(FX, m, M); m.stunT = 0; M.recoil = 0.8; M.hitK = 1;
      if (lv >= 3) { startBrood(FX, m); FX.H.after(0.9, () => FX.H.banner('THE BROOD', `It hides in its shell and its brood bursts up out of the sand: clear all ${BROOD_N} and it is EXPOSED`, '#E2E2EA', 3.0, true)); } },
    ai(FX, m, dt) {
      const M = FX.mem, F = FX.S.fast; m.actT += dt; m.noTouch = true;
      switch (m.act) {
        case 'sit': sit(FX, m, M, dt, F); if (m.actT > (FX.S.lv >= 3 ? 1.2 : 1.55) / F && !M.sc) { m.actT = 0; choose(FX, m); } break;
        case 'drain': drainStep(FX, m, M, dt, F); break;
        case 'crush': crushStep(FX, m, M, dt, F); break;
        case 'beams': beamStep(FX, m, M, dt, F); break;
        case 'theft': theftStep(FX, m, M, dt, F); break;
        case 'brood': broodStep(FX, m, M, dt); break;
        default: endAct(m, M);
      }
      // the weak points: the big claw stuck in the sand, the shell while it drinks (the heart only when it reels)
      const P = pose(m, M), C = M.cr, stuck = m.act === 'crush' && C && C.state === 'stuck', Th = M.th, drink = m.act === 'theft' && Th && Th.state === 'drink' && !Th.done;
      if (stuck) { const q = clawPose(P, M, BIG).pc; FX.weak('claw', q[0], q[1] - q[2], 1.25, 1.8, true); } else if (FX.S.weak.claw) FX.weak('claw', 0, 0, 0, 0, false);
      if (drink) { const s = shellC(P); FX.weak('shell', s[0], s[1] - s[2], 2.0, 2.0, true); } else if (FX.S.weak.shell) FX.weak('shell', 0, 0, 0, 0, false);
      if (FX.S.weak.heart) FX.weak('heart', 0, 0, 0, 0, false);
      if (!m.under) { FX.parts(bodyParts(m, M, P, { noShell: drink, noClaw: stuck })); if (drink) dropPart(FX, 'sh'); if (stuck) dropPart(FX, 'bc'); }
    },
    stunned(FX, m, dt) { const M = FX.mem, P = pose(m, M), s = shellC(P), ex = M.stunKind === 'exposed'; m.noTouch = true;
      FX.weak('heart', s[0], s[1] - s[2], ex ? 1.5 : 1.3, ex ? 3.0 : 2.5, m.stunT > 0.05);
      if (FX.S.weak.shell) FX.weak('shell', 0, 0, 0, 0, false); if (FX.S.weak.claw) FX.weak('claw', 0, 0, 0, 0, false);
      M.twT2 = (M.twT2 || 0) - dt; if (M.twT2 <= 0) { M.twT2 = 0.2 + Math.random() * 0.2; const a = Math.random() * TAU; FX.H.part({ kind: 'spark', x: s[0] + Math.cos(a) * 0.6, y: s[1] - s[2] + Math.sin(a) * 0.5, vx: Math.cos(a) * 1.2, vy: -1.4, drag: 0.6, life: 0.7, max: 0.7, size: 3, color: HUE[Math.floor(Math.random() * 6)] }); }
      if (!m.under) { FX.parts(bodyParts(m, M, P, { noShell: true })); dropPart(FX, 'sh'); } },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.stat) return; M.bt += dt; const stun = m.stunT > 0, me = FX.me;
      if (!stun) { if (M.wasStun) { M.wasStun = false; M.recoil = 0.7; M.hitK = 0.5; FX.H.text(m.x, m.y - 6.6, M.stunWas === 'exposed' ? 'It scrambles back into its shell, clutching it' : 'Its shell knits itself shut', '#E2E2EA', 13); FX.H.sfx.thud(); FX.H.shake(5, 0.2); M.stunKind = null; } }
      else M.wasStun = true;
      M.recoil = decay(M.recoil, dt, 2.6); M.hitK = decay(M.hitK, dt, 4); M.ouch = decay(M.ouch, dt, 3.2); M.ouchCd = decay(M.ouchCd, dt, 1); M.heartHit = decay(M.heartHit, dt, 3); M.clawHit = decay(M.clawHit, dt, 4); M.shellHit = decay(M.shellHit, dt, 4);
      // the entrance: it bursts up out of the sand at its hollow, clacks its claws, and its shell flares
      if (m.act === 'enter') { const e = FX.S.enterT || 0, u = clamp(e / 1.25, 0, 1); M.alt = -2.6 * (1 - smooth(u));
        if (e > 0.1 && e < 1.2 && Math.random() < dt * 22) dust(FX, m.x + FX.rnd(-3, 3), m.y + FX.rnd(-1, 2), 1.4, 2, 0);
        if (u >= 1 && !M.rose) { M.rose = true; M.alt = 0; FX.H.sfx.crash(); FX.H.sfx.thud(); dust(FX, m.x, m.y + 0.5, 4.2, 30, 15); M.marks.push({ x: m.x, y: m.y + 0.3, r: 3.6, t: 0, life: 4.5, seed: 41 }); M.recoil = 0.6; }
        if (e > 1.5 && e < 2.3) { M.raiseTo = 0.7 * Math.sin(clamp((e - 1.5) / 0.8, 0, 1) * Math.PI); M.clack = Math.max(M.clack, (e % 0.3) < 0.12 ? 1 : 0); }
        if (e > 1.9 && !M.roared) { M.roared = true; FX.H.sfx.hum(); FX.H.sfx.chime && FX.H.sfx.chime(); M.glow = 1.2; const s = shellC(pose(m, M)); for (let i = 0; i < 6; i++) FX.H.ring(s[0], s[1] - s[2], 0.3, 3 + i * 0.5, 0.6, HUE[i], 0.25); }
        if (M.roared) { M.evilTo = 1; M.greedTo = 1; } }
      else if (M.wasEnter) { M.wasEnter = false; M.alt = 0; }
      // the first lesson, once it is sitting
      if (!M.taught && m.act === 'sit') { M.taught = true; m.actT = -2.4; FX.H.banner('THE THIEF OF HUES', 'It stole the cove\'s colours and wears them as its shell. When it steals again, CRACK THE SHELL and strike its bared HEART', '#FFFFFF', 3.0, true); }
      // the pose: the claws' raise and slam, the snip, the hug, hiding, the lean, the stagger's slump
      if (!M.cHold) { M.raise = toward(M.raise, M.raiseTo, dt, 7); M.slamK = toward(M.slamK, M.slamTo, dt, 8); } M.raiseTo = 0; M.slamTo = 0; M.cHold = false;
      if (!M.sHold) { M.snip = toward(M.snip, 0, dt, 6); M.snipOpen = toward(M.snipOpen, 0, dt, 5); } M.sHold = false;
      M.hug = toward(M.hug, M.hugTo, dt, M.hugTo > M.hug ? 6 : 3.5); M.hugTo = 0;
      M.hide = toward(M.hide, M.hideTo, dt, M.hideTo > M.hide ? 3.2 : 2.2); M.hideTo = 0;
      M.lean = toward(M.lean, M.leanTo, dt, 7); M.leanTo = 0;
      M.lock = toward(M.lock, M.lockTo, dt, 6); M.lockTo = 0;
      M.evil = toward(M.evil, Math.max(M.evilTo, stun ? 0 : 0.2), dt, 5); M.evilTo = 0; M.greed = toward(M.greed, stun ? 0 : Math.max(M.greedTo, 0.25), dt, 4); M.greedTo = 0;
      M.glow = toward(M.glow, Math.max(M.glowTo, 0.25 + (M.thK || 0) * 0.35), dt, 3); M.glowTo = 0.25;
      M.thK = toward(M.thK, m.act === 'theft' ? 1 : 0, dt, 4); if (m.act !== 'theft' && M.thK < 0.05) M.litN = 0;
      M.stagK = toward(M.stagK, stun ? 1 : 0, dt, stun ? 6 : 2.5); M.dizzy = toward(M.dizzy, stun ? 1 : 0, dt, 6);
      M.heart = toward(M.heart, stun && (M.stunKind === 'cracked' || M.stunKind === 'exposed') ? 1 : 0, dt, stun ? 5 : 2.5);
      M.crack = stun && (M.stunKind === 'cracked' || M.stunKind === 'exposed') ? Math.max(M.crack, 0.9) : decay(M.crack, dt, 0.5);
      if (m.act !== 'enter') M.alt = toward(M.alt, 0, dt, 6);
      // turning: quick to swing a claw or run, slow at rest, not at all when it reels
      if (!stun && m.act !== 'enter') M.hd = turnTo(M.hd, M.hdTo == null ? M.hd : M.hdTo, dt, M.sc ? 4.5 : m.act === 'crush' ? 4.5 : m.act === 'brood' ? 0.8 : 1.8);
      // its eyes follow the pet, each stalk swivelling a little on its own; blinks; a clack of the claws now and then
      M.aim = turnTo(M.aim == null ? M.hd : M.aim, Math.atan2(me.y - m.y, me.x - m.x), dt, 5);
      M.look = toward(M.look, stun ? 0 : clamp(angTo(M.hd, M.aim), -0.9, 0.9), dt, 4);
      M.eyeT -= dt; if (M.eyeT <= 0) { M.eyeT = 0.6 + Math.random() * 1.8; M.eyeW[Math.random() < 0.5 ? 0 : 1] = (Math.random() - 0.5) * 1.1; } M.eyeW[0] = toward(M.eyeW[0], 0, dt, 1.4); M.eyeW[1] = toward(M.eyeW[1], 0, dt, 1.4);
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = Math.random() < 0.25 ? 0.3 : 2.2 + Math.random() * 3; M.blinkA = 0.16; } M.blinkA = decay(M.blinkA, dt, 1); M.blink = M.blinkA > 0 ? 1 - Math.abs(M.blinkA / 0.08 - 1) : 0;
      M.clackT -= dt; if (M.clackT <= 0 && m.act === 'sit') { M.clackT = 2.5 + Math.random() * 3.5; M.clack = 1; FX.H.sfx.blip && Math.random() < 0.3 && FX.H.sfx.blip(); } M.clack = decay(M.clack, dt, 4);
      // its comic streak: at rest, now and then it pats its shell lovingly with the small claw
      M.patT -= dt; if (M.patT <= 0 && m.act === 'sit' && !M.sc && !stun) { M.patT = 7 + Math.random() * 4; M.pat0 = M.bt; } { const u = (M.bt - M.pat0) / 1.5; M.pat = u >= 0 && u <= 1 && m.act === 'sit' && !stun ? Math.sin(u * Math.PI) : toward(M.pat, 0, dt, 6); if (u >= 0 && u <= 1 && m.act === 'sit') M.greedTo = Math.max(M.greedTo, 0.7); }
      // the legs: a fast sideways patter when it runs, a lazy shuffle at rest
      M.spdK = toward(M.spdK, M.sc ? 1 : 0, dt, 6); M.gait += dt * (1.2 + M.spdK * 15);
      updBumps(FX, m, M, dt);
      M.marks.forEach(k => k.t += dt); M.marks = M.marks.filter(k => k.t < k.life);
      // hidden in its shell: glints crawling over the prism
      if (M.hide > 0.5 && Math.random() < dt * 6) { const s = shellC(pose(m, M)), a = Math.random() * TAU; FX.H.sparks(s[0] + Math.cos(a) * 1.8, s[1] - s[2] + Math.sin(a) * 1.4, HUE[Math.floor(Math.random() * 6)], 2, 2); } },
    dmgK(FX, m) { const M = FX.mem; if (!M) return 1; M.recoil = Math.max(M.recoil || 0, 0.32); M.hitK = 1; if (!(M.ouchCd > 0) && !(m.stunT > 0)) { M.ouch = 0.35; M.ouchCd = 2.6; } return 1; },
    onWeakHit(FX, key) { const M = FX.mem, m = FX.m; if (!M) return;
      if (key === 'heart') { M.heartHit = 1; M.recoil = Math.max(M.recoil || 0, 0.5); return; }
      if (key === 'claw') { M.clawHit = 1; M.recoil = Math.max(M.recoil || 0, 0.25); return; }
      if (key !== 'shell') return; M.shellHit = 1; M.recoil = Math.max(M.recoil || 0, 0.3); const T = M.th; if (m && m.act === 'theft' && T && !T.done) { T.hits++; if (T.hits >= T.need) crackShell(FX, m, M); } },
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.stat || m.dead || m.act === 'enter') return null;
      const x = m.x, y = m.y - 2.4, d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(0.4, 3.6 / d) }; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { Y += (m.z || 0) * T * 4; drawCrab(c, FX, m, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawAir(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function homeP(FX) { return { x: FX.C.x + HOME[0], y: FX.C.y + HOME[1] }; }
  // grey sand flung up where something heavy lands (billows and grit, no glow)
  function dust(FX, x, y, r, n, shake) {
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = r * (0.3 + Math.random() * 0.7), life = 0.7 + Math.random() * 0.6; FX.H.part({ kind: 'smoke', x: x + Math.cos(a) * d * 0.6, y: y + Math.sin(a) * d * 0.45, vx: Math.cos(a) * (1 + r * 0.9), vy: Math.sin(a) * (0.6 + r * 0.5) - 0.7, drag: 1.1, life, max: life, size: 0.5 + r * 0.2, color: Math.random() < 0.5 ? '#A4A3AC' : '#C4C3CA' }); }
    for (let i = 0; i < Math.ceil(n / 2); i++) FX.H.part({ kind: 'shard', x: x + FX.rnd(-r, r) * 0.6, y: y + FX.rnd(-r, r) * 0.4, vx: FX.rnd(-4, 4), vy: FX.rnd(-6, -2), g: 12, life: 0.7, max: 0.7, size: 3, rot: Math.random() * 3, vr: 8, color: Math.random() < 0.5 ? SAND : SAND_D });
    if (shake) FX.H.shake(shake, 0.3); }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.4 : 1.1, true); }
  function endAct(m, M) { m.act = 'sit'; m.actT = 0; M.dr = null; M.cr = null; M.bm = null; M.th = null; }
  // (telegraphs are disarmed, not spliced out: one may be landing in the very loop that called this)
  function cancelTele(FX) { FX.S.tele.forEach(s => { s.dmg = 0; s.fn = null; s.done = true; s.linger = 0; }); }
  function clearActs(FX, m, M) { cancelTele(FX);
    if (M.cr && M.cr.x0 != null) { m.x = M.cr.x0; m.y = M.cr.y0; }
    M.sc = null; M.slamK = M.raise = M.snip = 0; M.litN = 0; endAct(m, M); }
  function dropPart(FX, key) { const P = FX.S.partsMap; if (P && P[key]) { P[key].dead = true; P[key] = null; } }
  function choose(FX, m) { const M = FX.mem, P = FX.S.lv; let k = M.nextAct; M.nextAct = null;
    if (!k) { const cyc = P >= 3 ? CYC3 : CYC1; k = cyc[M.picks % cyc.length]; M.picks++; }
    M.sc = null; M.last = k; ({ drain: startDrain, crush: startCrush, beams: startBeams, theft: startTheft })[k](FX, m); }
  // the distance from a point along a direction to the cove's rim
  function rimDist(FX, x, y, d) { const C = FX.C, px = x - C.x, py = y - C.y, b = px * d[0] + py * d[1], cc = px * px + py * py - C.R * C.R; return -b + Math.sqrt(Math.max(0, b * b - cc)); }
  /* ---- at rest: it sits facing the pet; away from its hollow (or pinned out toward the rim) it scuttles back ---- */
  function sit(FX, m, M, dt, F) { M.hdTo = FX.angPet(m.x, m.y);
    if (M.sc) { scuttleStep(FX, m, M, dt); return; }
    M.scCd -= dt; const h = homeP(FX), dh = Math.hypot(m.x - h.x, m.y - h.y), rc = Math.hypot(m.x - FX.C.x, m.y - FX.C.y);
    if ((M.scCd <= 0 && dh > 1.0) || dh > 2.5 || rc > FX.C.R * 0.55) startScuttle(FX, m, M, F, h);
    // the second phase: a greyling or two crawl out of the sand now and then
    if (FX.S.lv >= 3 && (M.trickleT -= dt) <= 0) { M.trickleT = 15; const n = FX.H.mons.filter(q => !q.dead && !q.horde && q.type === 'greyling').length;
      if (n < 2) { bump(FX, m, M, false); bump(FX, m, M, false); M.greedTo = 1; FX.H.text(m.x, m.y - 6.6, 'Greylings stir in the sand', '#E2E2EA', 13); } } }
  // a sideways run to a spot (home by default)
  function startScuttle(FX, m, M, F, to) { const p = to || homeP(FX), d = Math.hypot(p.x - m.x, p.y - m.y);
    if (d < 0.5) { M.scCd = 1.5; return false; }
    M.sc = { t: 0, dur: (0.4 + d / 7) / F, x0: m.x, y0: m.y, x1: p.x, y1: p.y, d, a: Math.atan2(p.y - m.y, p.x - m.x), puff: 0 }; M.scCd = 2.2 + Math.random(); M.stat.homeRuns++; FX.H.sfx.whoosh(); return true; }
  function scuttleStep(FX, m, M, dt) { const S = M.sc; S.t += dt; const u = clamp(S.t / S.dur, 0, 1), k = smooth(u); m.x = lerp(S.x0, S.x1, k); m.y = lerp(S.y0, S.y1, k);
    // crabs run sideways: it turns side-on to the way it goes, the flank nearer the pet
    const pa = FX.angPet(m.x, m.y), s0 = S.a + Math.PI / 2, s1 = S.a - Math.PI / 2; M.hdTo = Math.abs(angTo(s0, pa)) < Math.abs(angTo(s1, pa)) ? s0 : s1;
    if ((S.puff -= dt) <= 0) { S.puff = 0.09; dust(FX, m.x + FX.rnd(-1.8, 1.8), m.y + FX.rnd(0, 1.2), 0.7, 2, 0); }
    if (u >= 1) { M.sc = null; const me = FX.me, dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy) || 1; if (d < 2.6) me.push = { vx: dx / d * 11, vy: dy / d * 11, t: 0.24 }; } }

  /* ---- Drain: its eyes lock on and a grey ring spreads from it; inside, the pet's colour drains away and it slows ---- */
  function startDrain(FX, m) { const M = FX.mem, F = FX.S.fast, P = FX.S.lv; m.act = 'drain'; m.actT = 0;
    M.dr = { age: 0, state: 'lock', lock: 0.75 / F, spread: 0.95 / F, dur: P >= 3 ? 3.4 : 3.0, fade: 0.45, r: P >= 3 ? 7.0 : 6.2, cur: 0, x: m.x, y: m.y, tk: 0.12, inside: false }; M.stat.drains++; FX.H.sfx.hum();
    say(FX, 'drain', 'DRAIN', 'Its eyes lock on and a grey ring spreads from it: inside, your colour drains away and you slow. Step OUT of the ring', DRAINC); }
  function drainStep(FX, m, M, dt) { const D = M.dr, me = FX.me; if (!D) { endAct(m, M); return; } D.age += dt; M.hdTo = FX.angPet(m.x, m.y);
    if (D.state === 'lock') { M.lockTo = 1; M.evilTo = 0.8; if (D.age >= D.lock) { D.state = 'spread'; D.t0 = D.age; FX.H.sfx.whoosh(); FX.H.shake(4, 0.2); } return; }
    if (D.state === 'spread') { M.lockTo = 1; M.greedTo = 0.7; const u = clamp((D.age - D.t0) / D.spread, 0, 1); D.cur = D.r * (0.12 + 0.88 * smooth(u)); if (u >= 1) { D.state = 'drain'; D.t1 = D.age; } return; }
    if (D.state === 'drain') { M.lockTo = 1; M.greedTo = 1; M.glowTo = 0.8; D.cur = D.r;
      const inside = Math.hypot(me.x - D.x, me.y - D.y) < D.r + me.r * 0.3 && !me.dead; D.inside = inside;
      if (inside) { me.chill = Math.max(me.chill || 0, 0.4); D.tk -= dt;
        if (D.tk <= 0) { D.tk = 0.4; M.stat.drainTicks++; FX.hurt(m.dmg * 0.2, { dot: true }); if (!D.told) { D.told = true; FX.H.text(me.x, me.y - 1.6, 'Your colour drains away!', '#D2D2DC', 13); } }
        // its colour, lifting off the pet in motes and drifting to the crab's eyes
        if (Math.random() < dt * 14) { const P = pose(m, M), e = eyePose(P, M, Math.random() < 0.5 ? 1 : -1).tip, T = 0.75; FX.H.part({ kind: 'spark', x: me.x + FX.rnd(-0.3, 0.3), y: me.y - 0.5, vx: (e[0] - me.x) / T, vy: (e[1] - e[2] - me.y + 0.5) / T, drag: 0, life: T, max: T, size: 2.6, color: HUE[Math.floor(Math.random() * 6)] }); } }
      if (D.age - D.t1 >= D.dur) { D.state = 'fade'; D.t2 = D.age; } return; }
    if (D.age - D.t2 >= D.fade) { M.dr = null; endAct(m, M); } }

  /* ---- Pincer Crush: the big claw slams a shown circle, then the small one snips a shown line; the big claw is stuck in
     the sand a moment (a weak spot) ---- */
  function startCrush(FX, m) { const M = FX.mem, F = FX.S.fast, P = FX.S.lv; m.act = 'crush'; m.actT = 0;
    M.cr = { age: 0, state: 'aim', turn: 0.3 / F, wait: (P >= 3 ? 0.9 : 1.05) / F, r: P >= 3 ? 2.9 : 2.6, nSnip: P >= 3 ? 2 : 1, hold: (P >= 3 ? 1.55 : 1.9) / F, sn: null, k: 0 }; M.stat.crushes++; FX.H.sfx.hum();
    say(FX, 'crush', 'PINCER CRUSH', 'Its great claw slams the orange circle, then the small one SNIPS along the yellow line. Stuck in the sand, the CLAW is a weak spot', CRUSHC); }
  function crushStep(FX, m, M, dt, F) { const C = M.cr, me = FX.me; if (!C) { endAct(m, M); return; } C.age += dt;
    if (C.state === 'aim') { M.hdTo = FX.angPet(m.x, m.y) + 0.35; M.raiseTo = smooth(C.age / C.turn) * 0.45; M.evilTo = 0.8;
      if (C.age >= C.turn) { const a = FX.angPet(m.x, m.y), d = [Math.cos(a), Math.sin(a)], reach = clamp(FX.dist(m.x, m.y), 2.6, REACH + LUNGE), p = FX.clampArena({ x: m.x + d[0] * reach, y: m.y + d[1] * reach }, 2.0);
        Object.assign(C, { state: 'shown', t0: C.age, a, d, tx: p.x, ty: p.y, x0: m.x, y0: m.y, lunge: clamp(Math.hypot(p.x - m.x, p.y - m.y) - REACH, 0, LUNGE) }); M.slamP = [p.x, p.y]; }
      return; }
    M.hdTo = C.a + 0.35; M.slamP = [C.tx, C.ty];
    if (C.state === 'shown') { const u = clamp((C.age - C.t0) / (C.wait * 0.85), 0, 1); M.raiseTo = 0.45 + 0.55 * smooth(u); M.leanTo = -0.3 * u; M.evilTo = 1; M.greedTo = 0.8;
      if (C.age - C.t0 >= C.wait) { C.state = 'slam'; C.t1 = C.age; FX.H.sfx.whoosh(); } return; }
    if (C.state === 'slam') { const u = clamp((C.age - C.t1) / 0.16, 0, 1); M.cHold = true; M.slamK = u * u; M.raise = 1 - u; M.leanTo = 0.55 * u; M.lean = Math.max(M.lean, 0.5 * u); M.evilTo = 1;
      const k = smooth(u); m.x = C.x0 + C.d[0] * C.lunge * k; m.y = C.y0 + C.d[1] * C.lunge * k;
      if (u >= 1) crushDown(FX, m, M, C); return; }
    if (C.state === 'stuck') { M.cHold = true; M.slamK = 1; M.raise = 0; M.leanTo = 0.35 + Math.sin(M.bt * 15) * 0.08; M.evilTo = 0.5;
      if (Math.random() < dt * 6) FX.H.part({ kind: 'smoke', x: C.tx + FX.rnd(-0.8, 0.8), y: C.ty + FX.rnd(-0.3, 0.3), vx: FX.rnd(-0.6, 0.6), vy: -0.5, drag: 0.8, life: 0.6, max: 0.6, size: 0.6, color: '#B0AFB8' });
      if (C.sn) snipStep(FX, m, M, C, dt, F);
      if (!C.sn && C.age - C.t2 >= C.hold) { C.state = 'pull'; C.t3 = C.age; C.xL = m.x; C.yL = m.y; FX.H.sfx.whoosh(); dust(FX, C.tx, C.ty, 1.3, 9, 3); } return; }
    if (C.state === 'pull') { const u = clamp((C.age - C.t3) / 0.4, 0, 1); M.cHold = true; M.slamK = 1 - smooth(u); M.raise = 0.3 * Math.sin(u * Math.PI); M.leanTo = -0.2 * Math.sin(u * Math.PI); m.x = lerp(C.xL, C.x0, smooth(u)); m.y = lerp(C.yL, C.y0, smooth(u));
      if (u >= 1) { M.cr = null; endAct(m, M); } } }
  function crushDown(FX, m, M, C) { const me = FX.me; C.state = 'stuck'; C.t2 = C.age; M.stat.clawStuck++;
    const inside = Math.hypot(me.x - C.tx, me.y - C.ty) < C.r + me.r * 0.4;
    if (inside && (me.dodge || me.leap)) { M.stat.crushDodged++; M.stat.crushMiss++; FX.H.text(me.x, me.y - 1.6, 'Rolled clear!', OKC, 13); }
    else if (inside) { M.stat.crushHit++; FX.hurt(m.dmg * 1.6); FX.H.text(me.x, me.y - 1.6, 'Crushed!', DANGER, 15); const dx = me.x - C.tx, dy = me.y - C.ty, d = Math.hypot(dx, dy) || 1; me.push = { vx: dx / d * 11, vy: dy / d * 11, t: 0.24 }; }
    else M.stat.crushMiss++;
    FX.H.sfx.crash(); FX.H.sfx.thud(); FX.H.shake(13, 0.35); dust(FX, C.tx, C.ty, 2.2, 20, 0);
    M.marks.push({ x: C.tx, y: C.ty, r: 1.7, t: 0, life: 6, seed: Math.floor(Math.random() * 1e4) });
    startSnip(FX, m, M, C); }
  // the small claw's snip: a short line from its side at the pet, shown, then snapped along
  function startSnip(FX, m, M, C) { const me = FX.me, P = pose(m, M), o = P.W0(1.5, SMALL * 1.35, 0), a = Math.atan2(me.y - o[1], me.x - o[0]), d = [Math.cos(a), Math.sin(a)], P2 = FX.S.lv >= 3;
    let len = P2 ? 5.6 : 5.0; len = Math.max(2.5, Math.min(len, rimDist(FX, o[0], o[1], d) - 0.6));
    C.sn = { state: 'shown', t0: C.age, wait: (C.k ? 0.6 : 0.7) / FX.S.fast, ox: o[0], oy: o[1], a, d, len, w: 1.5 }; M.snipP = [o[0] + d[0] * len * 0.7, o[1] + d[1] * len * 0.7]; }
  function snipStep(FX, m, M, C, dt, F) { const S = C.sn, me = FX.me; M.snipP = [S.ox + S.d[0] * S.len * 0.72, S.oy + S.d[1] * S.len * 0.72];
    if (S.state === 'shown') { const u = clamp((C.age - S.t0) / S.wait, 0, 1); M.sHold = true; M.snip = 0.12 * u; M.snipOpen = smooth(u); if (C.age - S.t0 >= S.wait) { S.state = 'snip'; S.t1 = C.age; FX.H.sfx.whoosh(); } return; }
    if (S.state === 'snip') { const u = clamp((C.age - S.t1) / 0.14, 0, 1); M.sHold = true; M.snip = 0.12 + 0.88 * smooth(u); M.snipOpen = 1 - u;
      if (u >= 1) { S.state = 'back'; S.t2 = C.age; M.stat.snips++; const rx = me.x - S.ox, ry = me.y - S.oy, al = rx * S.d[0] + ry * S.d[1], of = Math.abs(-rx * S.d[1] + ry * S.d[0]), inside = al > -me.r * 0.5 && al < S.len + me.r * 0.5 && of < S.w / 2 + me.r * 0.4;
        if (inside && !(me.dodge || me.leap)) { M.stat.snipHit++; FX.hurt(m.dmg * 1.0); FX.H.text(me.x, me.y - 1.6, 'Snipped!', DANGER, 14); me.push = { vx: S.d[0] * 8, vy: S.d[1] * 8, t: 0.2 }; } else M.stat.snipMiss++;
        FX.H.sfx.crack(); FX.H.shake(5, 0.15); const e = [S.ox + S.d[0] * S.len, S.oy + S.d[1] * S.len]; dust(FX, e[0], e[1], 0.9, 6, 0); } return; }
    if (S.state === 'back') { M.sHold = true; const u = clamp((C.age - S.t2) / 0.25, 0, 1); M.snip = 1 - smooth(u); M.snipOpen = 0;
      if (u >= 1) { C.k++; C.sn = null; if (C.k < C.nSnip && !me.dead) startSnip(FX, m, M, C); else C.hold = Math.max(C.hold, C.age - C.t2 + 0.5); } } }

  /* ---- Prism Beams: its shell flares and fires beams of single colours along shown lines, turning between volleys ---- */
  function startBeams(FX, m) { const M = FX.mem, F = FX.S.fast, P = FX.S.lv; m.act = 'beams'; m.actT = 0;
    M.bm = { age: 0, state: 'charge', charge: 0.65 / F, show: (P >= 3 ? 0.8 : 0.95) / F, fire: 0.38, turn: 0.45 / F, n: P >= 3 ? 5 : 3, vol: 3, v: 0, a0: FX.angPet(m.x, m.y), rot: (Math.random() < 0.5 ? 1 : -1) * (P >= 3 ? 0.32 : 0.42), w: 1.3, s0: 2.0, x: m.x, y: m.y, angs: [] }; M.stat.beams++; FX.H.sfx.hum();
    say(FX, 'beams', 'PRISM BEAMS', 'Its shell flares and fires beams of colour along the shown lines, turning a little between volleys: stand in the gaps', '#FFFFFF'); }
  function beamLines(FX, B) { const out = []; for (let i = 0; i < B.n; i++) { const a = B.a0 + i * TAU / B.n, d = [Math.cos(a), Math.sin(a)], len = Math.max(B.s0 + 1, rimDist(FX, B.x, B.y, d) - 0.3); out.push({ a, d, len, hue: Math.round(i * 6 / B.n) % 6, x0: B.x + d[0] * B.s0, y0: B.y + d[1] * B.s0, ex: B.x + d[0] * len, ey: B.y + d[1] * len }); } return out; }
  function beamStep(FX, m, M, dt) { const B = M.bm, me = FX.me; if (!B) { endAct(m, M); return; } B.age += dt; M.hdTo = FX.angPet(m.x, m.y); M.glowTo = 1; M.evilTo = 0.9; M.greedTo = 0.6;
    if (B.state === 'charge') { if (Math.random() < dt * 14) { const P = pose(m, M), s = shellC(P), a = Math.random() * TAU; FX.H.part({ kind: 'spark', x: s[0] + Math.cos(a) * 3, y: s[1] - s[2] + Math.sin(a) * 2.4, vx: -Math.cos(a) * 4, vy: -Math.sin(a) * 3.2, drag: 0.4, life: 0.6, max: 0.6, size: 2.6, color: HUE[Math.floor(Math.random() * 6)] }); }
      if (B.age >= B.charge) { B.state = 'shown'; B.t0 = B.age; } return; }
    if (B.state === 'shown') { if (B.age - B.t0 >= B.show) { B.state = 'fire'; B.t1 = B.age; fireVolley(FX, m, M, B); } return; }
    if (B.state === 'fire') { if (B.age - B.t1 >= B.fire) { B.v++; if (B.v >= B.vol) { B.state = 'end'; B.t3 = B.age; } else { B.state = 'turn'; B.t2 = B.age; B.aS = B.a0; } } return; }
    if (B.state === 'turn') { const u = clamp((B.age - B.t2) / B.turn, 0, 1); B.a0 = B.aS + B.rot * smooth(u); if (u >= 1) { B.state = 'shown'; B.t0 = B.age; } return; }
    if (B.age - B.t3 >= 0.3) { M.bm = null; endAct(m, M); } }
  function fireVolley(FX, m, M, B) { const me = FX.me, L = beamLines(FX, B); M.stat.volleys++; B.angs.push(B.a0);
    const on = L.some(l => { const rx = me.x - B.x, ry = me.y - B.y, al = rx * l.d[0] + ry * l.d[1], of = Math.abs(-rx * l.d[1] + ry * l.d[0]); return al > B.s0 - me.r && al < l.len + me.r && of < B.w / 2 + me.r * 0.4; });
    if (on && !(me.dodge || me.leap)) { M.stat.beamHit++; FX.hurt(m.dmg * 1.1); FX.H.text(me.x, me.y - 1.6, 'Scorched by colour!', DANGER, 13); } else M.stat.beamMiss++;
    FX.H.sfx.crack(); FX.H.shake(6, 0.2); M.recoil = Math.max(M.recoil, 0.25);
    L.forEach(l => { FX.H.ring(l.ex, l.ey, 0.2, 1.1, 0.3, HUE[l.hue], 0.35); FX.H.sparks(l.ex, l.ey, HUE[l.hue], 4, 3); }); }

  /* ---- Hue Theft: it hugs its shell and its six facets light one by one; crack it with blows first, or it flares ---- */
  function startTheft(FX, m) { const M = FX.mem, F = FX.S.fast, P = FX.S.lv; m.act = 'theft'; m.actT = 0;
    M.th = { age: 0, state: 'hug', hug: 0.55 / F, per: (P >= 3 ? 0.72 : 0.82) / F, lit: 0, need: P >= 3 ? 9 : 8, hits: 0, done: false, fr: P >= 3 ? 6.8 : 6.2, x: m.x, y: m.y, shown: false }; M.stat.thefts++; FX.H.sfx.hum();
    say(FX, 'theft', 'HUE THEFT', 'It hugs its shell and drinks the cove\'s last colours: six facets light one by one. STRIKE THE SHELL to crack it before the sixth, or get clear of its flare', '#FFFFFF'); }
  function theftStep(FX, m, M, dt) { const T = M.th, me = FX.me; if (!T) { endAct(m, M); return; } T.age += dt; M.hugTo = 1; M.greedTo = 1; M.hdTo = FX.angPet(m.x, m.y);
    if (T.state === 'hug') { if (T.age >= T.hug) { T.state = 'drink'; T.t0 = T.age; T.lit = 1; M.litN = 1; FX.H.sfx.chime && FX.H.sfx.chime(); } return; }
    const k = Math.min(6, Math.floor((T.age - T.t0) / T.per) + 1);
    if (k > T.lit) { T.lit = k; M.litN = k; FX.H.sfx.blip ? FX.H.sfx.blip() : FX.H.sfx.pop(); const s = shellC(pose(m, M)); FX.H.sparks(s[0], s[1] - s[2], HUE[k - 1], 8, 4); }
    if (T.lit >= 5 && !T.shown) { T.shown = true; T.t5 = T.age; FX.H.sfx.hum(); }
    // the cove's last colours streaming out of the shards in the sand and into the shell
    if (Math.random() < dt * 12) { const q = SHARDS[Math.floor(Math.random() * SHARDS.length)], P = pose(m, M), s = shellC(P), x = FX.C.x + q[0], y = FX.C.y + q[1], tt = 0.9; FX.H.part({ kind: 'spark', x, y: y - 0.2, vx: (s[0] - x) / tt, vy: (s[1] - s[2] - y) / tt, drag: 0, life: tt, max: tt, size: 2.8, color: HUE[Math.max(0, T.lit - 1)] }); }
    if (T.age - T.t0 >= T.per * 6) flare(FX, m, M, T); }
  function flare(FX, m, M, T) { const me = FX.me; T.done = true; M.stat.flares++;
    const inside = Math.hypot(me.x - T.x, me.y - T.y) < T.fr + me.r * 0.3;
    if (inside && !(me.dodge || me.leap)) { M.stat.flareHit++; FX.hurt(m.dmg * 1.4); FX.H.text(me.x, me.y - 1.6, 'Blinded by stolen colour!', DANGER, 14); const dx = me.x - T.x, dy = me.y - T.y, d = Math.hypot(dx, dy) || 1; me.push = { vx: dx / d * 12, vy: dy / d * 12, t: 0.25 }; } else M.stat.flareMiss++;
    const s = shellC(pose(m, M)); for (let i = 0; i < 6; i++) FX.H.ring(T.x, T.y, 0.5 + i * 0.2, T.fr - i * 0.3, 0.55, HUE[i], 0.3); FX.H.flash(0.12, '#FFFFFF'); FX.H.shake(12, 0.4); FX.H.sfx.crash(); FX.H.sparks(s[0], s[1] - s[2], '#FFFFFF', 20, 7);
    M.glow = 1.3; M.th = null; M.litN = 0; endAct(m, M); m.actT = -0.4; FX.H.text(m.x, m.y - 6.6, 'It gloats over its stolen colours', '#E2E2EA', 13); }
  function crackShell(FX, m, M) { const T = M.th; if (!T || T.done) return; T.done = true; M.th = null; M.stat.cracks++; const first = !M.seen.crack; M.seen.crack = true;
    endAct(m, M); m.stunT = Math.max(m.stunT || 0, FX.S.lv >= 3 ? 4.0 : 4.5); M.stunKind = 'cracked'; M.stunWas = 'cracked'; M.crack = 1; M.recoil = 1; M.litN = 0;
    if (FX.S.weak.shell) FX.weak('shell', 0, 0, 0, 0, false);
    const s = shellC(pose(m, M)); for (let i = 0; i < 6; i++) { FX.H.sparks(s[0], s[1] - s[2], HUE[i], 5, 6); } FX.H.ring(s[0], s[1] - s[2], 0.3, 3.2, 0.45, '#FFFFFF', 0.3); FX.H.shake(10, 0.3); FX.H.sfx.crash(); FX.H.sfx.crack();
    FX.H.hitMon(m, FX.S.barHP * 0.02, { flat: true, pierce: true });
    FX.H.banner('CRACKED!', first ? 'Its stolen colours burst out of the broken shell and it reels: strike the bared HEART of its shell!' : 'The shell cracked: strike the heart!', '#FFFFFF', first ? 2.4 : 1.4, true); }

  /* ---- The Brood (half health): hidden in its shell, out of reach, it calls thirty greylings up out of the sand; clear
     them and it is EXPOSED ---- */
  function startBrood(FX, m) { const M = FX.mem, h = homeP(FX); m.act = 'brood'; m.actT = 0; FX.untarget(true);
    M.br = { t: 0, total: BROOD_N, spawned: 0, killed: 0, list: [], acc: 0.3, T: 75, maxLive: 0, state: 'pour' }; M.stat.brood++;
    if (Math.hypot(m.x - h.x, m.y - h.y) > 1.0 && startScuttle(FX, m, M, 1, h)) M.br.state = 'home';
    FX.H.sfx.crash(); FX.H.shake(12, 0.6); FX.H.ring(m.x, m.y, 1, 6, 0.6, '#E2E2EA', 0.35); }
  function broodStep(FX, m, M, dt) { const B = M.br; if (!B) { endAct(m, M); return; } m.under = true; m.noTouch = true; B.t += dt; M.hdTo = FX.angPet(m.x, m.y);
    if (B.state === 'home') { if (M.sc) { scuttleStep(FX, m, M, dt); return; } B.state = 'pour'; }
    M.hideTo = 1;
    B.list = B.list.filter(q => { if (q.dead) { B.killed++; M.stat.killed++; return false; } return true; });
    let pend = M.bumps.filter(b => b.horde).length;
    B.acc = Math.min(1.2, B.acc + dt);
    while (B.acc >= 0.45 && B.spawned < B.total && B.list.length + pend < BROOD_CAP) { B.acc -= 0.45; bump(FX, m, M, true); B.spawned++; pend++; }
    B.maxLive = Math.max(B.maxLive, B.list.length);
    if ((B.spawned >= B.total && !B.list.length && !pend) || B.t > B.T) expose(FX, m, M); }
  function expose(FX, m, M) { const B = M.br, all = B && B.killed >= B.total; M.br = null; FX.untarget(false); endAct(m, M); M.stat.exposed++; M.sc = null; M.alt = 0;
    m.stunT = Math.max(m.stunT || 0, all ? 7 : 4); M.stunKind = 'exposed'; M.stunWas = 'exposed'; M.recoil = 1; M.crack = 1;
    FX.H.sfx.crash(); FX.H.shake(12, 0.5); const s = shellC(pose(m, M)); for (let i = 0; i < 6; i++) FX.H.sparks(s[0], s[1] - s[2], HUE[i], 5, 7); FX.H.ring(m.x, m.y, 1, 6, 0.6, '#FFFFFF', 0.35);
    FX.H.banner('EXPOSED!', all ? 'Its brood is gone and it tumbles half out of its shell, dizzy: strike the HEART of its shell, hard!' : 'It tumbles out: strike the heart!', '#FFFFFF', 2.6, true); }
  // a bulge in the sand where a greyling will burst out (shown a moment first)
  function bump(FX, m, M, horde) { const me = FX.me; let p = null;
    for (let k = 0; k < 24 && !p; k++) { const a = FX.angPet(m.x, m.y) + FX.rnd(-1.9, 1.9), d = FX.rnd(3.6, 8.2), q = { x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d }; if (FX.inArena(q.x, q.y, 1.6) && Math.hypot(q.x - me.x, q.y - me.y) > 2.6 && Math.hypot(q.x - m.x, q.y - m.y) > 3.4 && !M.bumps.some(b => Math.hypot(b.x - q.x, b.y - q.y) < 1.4)) p = q; }
    if (!p) p = FX.clampArena({ x: m.x + FX.rnd(-5, 5), y: m.y + 4.5 }, 1.6);
    M.bumps.push({ x: p.x, y: p.y, t: 0, dur: 0.55, horde, seed: Math.floor(Math.random() * 1e4) }); }
  function updBumps(FX, m, M, dt) {
    for (const b of M.bumps) { b.t += dt; if (Math.random() < dt * 10) FX.H.part({ kind: 'shard', x: b.x + FX.rnd(-0.4, 0.4), y: b.y, vx: FX.rnd(-1.5, 1.5), vy: FX.rnd(-3, -1), g: 10, life: 0.4, max: 0.4, size: 2, rot: 0, vr: 6, color: SAND_D });
      if (b.t >= b.dur) { b.done = true; dust(FX, b.x, b.y, 1.0, 8, 0); FX.H.sfx.pop && FX.H.sfx.pop(); const q = FX.minion('greyling', b.x, b.y, {});
        if (b.horde) { const B = M.br; if (!q) { if (B) { B.killed++; M.stat.killed++; } } else { q.horde = true; q.hp = q.maxhp = Math.max(60, Math.round(q.maxhp * 0.5)); q.xp = Math.max(1, Math.round((q.xp || 6) * 0.4)); q.cd = 0.9; if (B) B.list.push(q); M.stat.poured++; } }
        else if (q) { q.cd = 0.9; M.stat.trickled++; } } }
    M.bumps = M.bumps.filter(b => !b.done); }

  /* ---------- the body: where everything is ---------- */
  function pose(m, M) {
    const hd = M.hd == null ? Math.PI / 2 : M.hd, rc = M.recoil || 0, bt = M.bt || 0, sk = M.stagK || 0, ln = M.lean || 0, hide = M.hide || 0, hg = M.hug || 0, alt = M.alt || 0, cf = Math.cos(hd), sf = Math.sin(hd);
    const br = Math.sin(bt * 1.8) * 0.025;
    const B = { x: m.x - cf * rc * 0.4, y: m.y - sf * rc * 0.4 };
    const W0 = RiftFiend.frame(B, hd, { z: alt, pitch: -ln * 0.16 + rc * 0.06 + sk * 0.05, roll: Math.sin(bt * 0.8) * 0.012 });
    // the shell rocks on its own: a slow sway, a shudder when it is hugged, a wobble when the crab reels
    const Ws = RiftFiend.frame(B, hd, { z: alt - hide * 0.3 - sk * 0.1, pitch: -ln * 0.1 + rc * 0.09 + Math.sin(bt * 0.9) * 0.015 + sk * 0.06, roll: Math.sin(bt * 0.7) * 0.02 + hg * Math.sin(bt * 8) * 0.025 + sk * 0.08 * Math.sin(bt * 2.2) });
    const O = W0(0, 0, 0), dirW = (u, v, h) => sub3(W0(u, v, h), O);
    return { hd, cf, sf, B, W0, Ws, dirW, br, alt, hide, sk, fw: [cf, sf] };
  }
  function shellC(P) { return P.Ws(SHC[0], SHC[1], SHC[2]); }
  function caraG(P, M) { const hide = P.hide, k = 1 - hide * 0.35; return { g: P.W0(CARA.u - hide * 1.25, 0, CARA.h * (1 + P.br) - P.sk * 0.15), A: [CARA.a * k, CARA.b * (1 + P.br * 0.3) * k, CARA.c * (1 + P.br) * k] }; }
  // a point on the carapace at (yaw, elevation), its outward normal, and a frame for painting on it (x to its right, y down)
  function surfC(P, M, al, el, lift) { const { g, A } = caraG(P, M), s = [Math.cos(el) * Math.cos(al), Math.cos(el) * Math.sin(al), Math.sin(el)], k = 1 + (lift || 0);
    const p = add3(g, P.dirW(s[0] * A[0] * k, s[1] * A[1] * k, s[2] * A[2] * k)), n = norm3(P.dirW(s[0] / A[0], s[1] / A[1], s[2] / A[2]));
    const vh = norm3(P.dirW(0, 1, 0)), mv = [-vh[0], -vh[1], -vh[2]], t = dot3(n, mv), e1 = norm3([mv[0] - n[0] * t, mv[1] - n[1] * t, mv[2] - n[2] * t]), e2 = cross3(n, e1); return { p, n, e1, e2, vis: dot3(n, VIEW) }; }
  /* the eye-stalks: from the carapace's brow up to the pale eyes, each turned toward the pet with its own swivel; locked
     on (the Drain) they stretch and lean in; reeling, they droop; hidden, they fold away */
  function eyePose(P, M, sd) { const hide = P.hide, dz = M.dizzy || 0, lk = M.lock || 0, bt = M.bt || 0;
    const base = P.W0(CARA.u + 0.95 - hide * 1.3, sd * 0.42, CARA.h + 0.5 - hide * 0.3);
    const look = (M.look || 0) * 0.8 + ((M.eyeW && M.eyeW[sd > 0 ? 0 : 1]) || 0) * (1 - lk), L = 2.05 * (1 + lk * 0.12) * (1 - hide * 0.85) * (1 - dz * 0.25);
    let u = 0.3 + lk * 0.4 + dz * 0.25, v = sd * (0.3 + dz * 0.55 - lk * 0.12), h = 1 - dz * 0.6; const cl = Math.cos(look), sl = Math.sin(look), u2 = u * cl - v * sl, v2 = u * sl + v * cl;
    const dir = norm3(P.dirW(u2, v2, h)), wob = Math.sin(bt * 1.7 + sd * 1.3) * 0.08 * (1 - lk), tip = add3(add3(base, dir, L), P.dirW(0, wob, 0)), mid = add3(lerp3(base, tip, 0.5), P.dirW(-0.06, sd * 0.06 + wob * 0.6, 0));
    return { base, mid, tip, r: 0.48 * (1 - hide * 0.5) }; }
  /* the claws: where the palm sits and which way it points, blended through its moves: at rest held out before it; the
     big one raised overhead and slammed onto its target; the small one snipping; patting the shell; hugging it; shut
     over the shell's mouth when it hides */
  function clawPose(P, M, sd) {
    const s = sd === BIG ? 1 : 0.6, W = P.W0, Ws = P.Ws, dirW = P.dirW, bt = M.bt || 0, hide = P.hide, sk = P.sk;
    const sh = W(1.05 - hide * 0.8, sd * 1.15, 1.2);
    let pc = sd === BIG ? W(2.55, -1.6, 0.95 + Math.sin(bt * 1.3) * 0.05 - sk * 0.4) : W(2.15, 1.38, 1.35 + Math.sin(bt * 1.6 + 1) * 0.06 - sk * 0.5);
    let d = norm3(dirW(1, sd === BIG ? 0.2 : -0.24, -0.08 - sk * 0.5)), open = 0.2 + 0.1 * Math.sin(bt * 2.1 + sd) + (M.clack || 0) * (sd === BIG ? 0.6 : 0.45) + (M.evil || 0) * 0.1;
    if (sd === BIG) {
      const rs = M.raise || 0; if (rs > 0.001) { pc = lerp3(pc, W(1.7, -1.4, 4.4), rs); d = norm3(lerp3(d, dirW(0.45, 0.12, 1), rs)); open = lerp(open, 0.95, rs); }
      const sl = M.slamK || 0; if (sl > 0.001 && M.slamP) { const tg = [M.slamP[0], M.slamP[1], 0.5], hz = norm3([tg[0] - sh[0], tg[1] - sh[1], 0]); pc = lerp3(pc, tg, sl); d = norm3(lerp3(d, [hz[0] * 0.75, hz[1] * 0.75, -0.66], sl)); open = lerp(open, 0.1, sl); }
    } else {
      const sn = M.snip || 0; if (sn > 0.001 && M.snipP) { const tg = [M.snipP[0], M.snipP[1], 0.85], hz = norm3([tg[0] - sh[0], tg[1] - sh[1], 0]); pc = lerp3(pc, tg, sn); d = norm3(lerp3(d, [hz[0], hz[1], 0.04], Math.min(1, sn * 2))); }
      if ((M.snipOpen || 0) > 0.001 || sn > 0.001) open = lerp(open, (M.snipOpen || 0) * 1.0, Math.min(1, sn * 4 + (M.snipOpen || 0)));
      const pt = M.pat || 0; if (pt > 0.001) { pc = lerp3(pc, Ws(-0.45, 2.3, 2.35 + Math.sin(bt * 13) * 0.14 * pt), pt); d = norm3(lerp3(d, dirW(-0.55, -0.35, 0.55), pt)); open = lerp(open, 0.05, pt); }
    }
    const hg = M.hug || 0; if (hg > 0.001) { pc = lerp3(pc, Ws(-0.7, sd * 2.32, 1.85 + (sd === BIG ? -0.1 : 0.2) + Math.sin(bt * 3 + sd) * 0.05), hg); d = norm3(lerp3(d, dirW(-0.8, -sd * 0.25, 0.35), hg)); open = lerp(open, 0.04, hg); }
    if (hide > 0.001) { const tg = sd === BIG ? W(0.35, -0.08, 1.05) : W(0.15, 0.6, 0.6); pc = lerp3(pc, tg, hide); d = norm3(lerp3(d, sd === BIG ? dirW(0.05, 1, 0.12) : dirW(1, 0, 0), hide)); open = lerp(open, 0, hide); }
    const a = 1.15 * s, b = 0.86 * s, cz = 0.76 * s, L = 1.05 * s;
    let side = cross3(d, [0, 0, 1]); side = len3(side) > 0.2 ? norm3(side) : norm3(dirW(0, 1, 0)); const up = norm3(cross3(side, d));
    const wrist = add3(pc, d, -a * 0.88), el = add3(add3(lerp3(sh, wrist, 0.5), norm3(dirW(0, sd, 0)), 0.75 * s), [0, 0, 0.55 * s]);
    return { s, sh, el, wrist, pc, d, side, up, a, b, c: cz, L, open: clamp(open, 0, 1) };
  }
  /* the legs: three a side, each from under the carapace's rim out to a pointed tip on the sand */
  function legPose(P, M, sd, k) { const hide = P.hide, sk = P.sk, sp = M.spdK || 0, ph = (M.gait || 0) + k * 2.1 + (sd > 0 ? Math.PI : 0), lift = Math.max(0, Math.sin(ph)) * (0.5 * sp + 0.08) + (k === 1 ? Math.max(0, Math.sin((M.bt || 0) * 0.9 + sd)) * 0.05 : 0), gu = Math.cos(ph) * (0.32 * sp + 0.05), gv = Math.cos(ph) * 0.35 * sp;
    const hip = P.W0(0.95 - k * 0.62 - hide * 0.9, sd * 1.05, 0.75);
    const knee = P.W0(1.25 - k * 0.95 - hide * 1.0 + gu * 0.4, sd * (1.95 + sk * 0.3 - hide * 1.0), 1.28 - hide * 0.6 - sk * 0.3 + lift * 0.3);
    const ank = P.W0(1.55 - k * 1.2 + gu * 0.8 - hide * 1.05, sd * (2.6 + gv * 0.8 + sk * 0.35 - hide * 1.45), 0.62 + lift * 0.7 - hide * 0.25);
    const tip = P.W0(1.75 - k * 1.32 + gu - hide * 1.1, sd * (2.78 - k * 0.05 + gv + sk * 0.35 - hide * 1.6), lift);
    return { hip, knee, ank, tip }; }
  // the hit proxies: the carapace, the shell, the two claws
  function bodyParts(m, M, P, o) { P = P || pose(m, M); o = o || {}; const out = [hit('cp', caraG(P, M).g, 1.6, m)]; if (!o.noShell) out.push(hit('sh', shellC(P), 2.1, m));
    if (!o.noClaw) out.push(hit('bc', clawPose(P, M, BIG).pc, 1.0, m)); out.push(hit('scl', clawPose(P, M, SMALL).pc, 0.7, m)); return out; }

  /* ---------- painting Grisaille ---------- */
  function hull(P) { const pts = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1)); }
  // paint in a surface's own plane (units of metres, x along e1, y along e2), so a feature turns and foreshortens with it
  function onPlane(c, P3, F, fn) { const o = P3(F.p[0], F.p[1], F.p[2]), a = P3(F.p[0] + F.e1[0], F.p[1] + F.e1[1], F.p[2] + F.e1[2]), b = P3(F.p[0] + F.e2[0], F.p[1] + F.e2[1], F.p[2] + F.e2[2]);
    const det = (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); if (Math.abs(det) < 1e-3) return;
    c.save(); if (F.vis != null) c.globalAlpha *= clamp((F.vis - 0.04) * 7, 0, 1); c.transform(a[0] - o[0], a[1] - o[1], b[0] - o[0], b[1] - o[1], o[0], o[1]); fn(c); c.restore(); }
  // the screen ellipse of an ellipsoid with three semi-axes given as world vectors (a point (x, y, z) is drawn at (x, y - z))
  function ellScreen(P3, T, g, axes) { let sxx = 0, sxy = 0, syy = 0; for (const a of axes) { const px = a[0], py = a[1] - a[2]; sxx += px * px; sxy += px * py; syy += py * py; }
    const tr = sxx + syy, det = sxx * syy - sxy * sxy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det)), ex = Math.sqrt(tr / 2 + disc), ey = Math.sqrt(Math.max(1e-6, tr / 2 - disc)), rot = 0.5 * Math.atan2(2 * sxy, sxx - syy), p = P3(g[0], g[1], g[2]);
    return { x: p[0], y: p[1], ex: ex * T, ey: ey * T, rot }; }
  function drawCrab(c, FX, m, X, Y, T, t) {
    const M = FX.mem || {}, P = pose(m, M), P3 = TN.cam(X, Y, T, m), lw = Math.max(1.3, T * 0.06), bt = M.bt || t, parts = [], hide = P.hide, fw = P.fw;
    const at = (p, du) => [p[0] + fw[0] * (du || 0), p[1] + fw[1] * (du || 0), p[2]];
    // rising out of the sand: only what is above the beach shows
    const clip = (M.alt || 0) < -0.03; if (clip) { const gy = P3(m.x, m.y + 2.6, 0)[1]; c.save(); c.beginPath(); c.rect(X - T * 40, Y - T * 60, T * 80, gy - (Y - T * 60)); c.clip(); }
    // its shadow on the sand
    { const g0 = P3(P.B.x - fw[0] * 0.5, P.B.y - fw[1] * 0.5, 0); K.shade(c, g0[0] + T * 0.25, g0[1] + T * 0.35, T * 4.3, T * 2.6, 0.5, '#24242F'); }
    parts.push({ at: shellC(P), draw: () => drawShell(c, FX, P, P3, T, lw, M, bt) });
    if (hide < 0.92) { const g = caraG(P, M).g; parts.push({ at: at(g, 0.35), draw: () => drawCarapace(c, FX, P, P3, T, lw, M, bt) }); }
    for (const sd of [-1, 1]) {
      if (hide < 0.8) { const E = eyePose(P, M, sd); parts.push({ at: at(E.tip, 0.3), draw: () => drawEyeStalk(c, FX, m, P, P3, T, lw, M, sd, E, bt) });
        const ab = P.W0(CARA.u + 1.1 - hide, sd * 0.16, CARA.h + 0.15); parts.push({ at: at(ab, 0.9), draw: () => drawAntenna(c, P, P3, T, lw, M, sd, bt) }); }
      if (sd === BIG || hide < 0.85) { const Q = clawPose(P, M, sd); parts.push({ at: at(Q.pc, 0.35), draw: () => drawClaw(c, P, P3, T, lw, M, sd, Q, bt) }); }
      // (a leg sorts by its hip, so the carapace's rim covers where it joins and the shell's side is behind it)
      if (hide < 0.9) for (let k = 0; k < 3; k++) { const L = legPose(P, M, sd, k); parts.push({ at: at([L.hip[0], L.hip[1], 1.2], -0.35), draw: () => drawLeg(c, P3, T, lw, L, M) }); }
    }
    sorted(parts).forEach(p => p.draw());
    // reeling: little stars and colour sparks circling over its eyes
    if ((M.dizzy || 0) > 0.4 && m.stunT > 0) { const e = lerp3(eyePose(P, M, -1).tip, eyePose(P, M, 1).tip, 0.5), q = P3(e[0], e[1], e[2] + 0.9); for (let i = 0; i < 5; i++) { const a = bt * 3.2 + i * TAU / 5, x = q[0] + Math.cos(a) * T * 1.4, y = q[1] + Math.sin(a) * T * 0.35; TN.twinkle(c, x, y, T * (i % 2 ? 0.24 : 0.18), i % 2 ? '#FFFFFF' : HUE[(i + Math.floor(bt)) % 6], 0.95); } }
    if (clip) c.restore(); }

  /* the prism-shell, painted: its facets back to front, each cel-lit in its hue with a brighter table at its heart and a
     glint on the lit ones, light running up the coil inside it, its edges inked (heavy where it meets the sky), cracks;
     its mouth dark; when it reels, a facet broken open over its heart */
  function shellFaces(P) { const W = P.Ws, N = SHELL.rings.length, RW = SHELL.rings.map(r => r.pts.map(q => W(q[0], q[1], q[2]))), CW = SHELL.rings.map(r => W(r.c[0], r.c[1], r.c[2])), AP = W(SHELL.apex[0], SHELL.apex[1], SHELL.apex[2]), faces = {}, list = [];
    const mk = (key, s, j, pts, cc, hue) => { const ce = pts.reduce((q, p) => add3(q, p, 1 / pts.length), [0, 0, 0]); let n = norm3(cross3(sub3(pts[1], pts[0]), sub3(pts[2], pts[0]))); if (dot3(n, sub3(ce, cc)) < 0) n = mul3(n, -1); const f = { key, s, j, pts, ce, n, hue, vis: dot3(n, VIEW), lit: dot3(n, LIGHT), depth: dot3(ce, VIEW) }; faces[key] = f; list.push(f); return f; };
    for (let s = 0; s < N - 1; s++) for (let j = 0; j < 6; j++) { const j1 = (j + 1) % 6; mk('q' + s + '|' + j, s, j, [RW[s][j], RW[s][j1], RW[s + 1][j1], RW[s + 1][j]], lerp3(CW[s], CW[s + 1], 0.5), (j + s) % 6); }
    for (let j = 0; j < 6; j++) mk('a' + j, N - 1, j, [RW[N - 1][j], RW[N - 1][(j + 1) % 6], AP], CW[N - 1], (j + N - 1) % 6).tri = true;
    const n0 = norm3(sub3(CW[0], CW[1])), mouth = { key: 'm', mouth: true, pts: RW[0], ce: CW[0], vis: dot3(n0, VIEW), depth: dot3(CW[0], VIEW) };
    return { faces, list, mouth, N, RW, AP }; }
  // a facet's colours: its hue, lit or shaded in cel steps, brightened where the light inside runs past; while it steals,
  // the hues it has drunk blaze and the rest grow dim
  function facetTone(f, M, bt, N) {
    const thK = M.thK || 0, litN = M.litN || 0, gl = M.glow || 0; let col = HUE[f.hue], glow = 0;
    if (thK > 0.01) { if (f.hue < litN) { const cur = f.hue === litN - 1; glow = (cur ? 0.5 + 0.25 * Math.sin(bt * 12) : 0.28) * thK; } else col = mix(col, '#7C7A88', 0.82 * thK); }
    const fill0 = f.lit > 0.6 ? mix(col, '#FFFFFF', 0.3) : f.lit > 0.15 ? col : mix(col, '#2E2450', 0.34);
    let b = 0; const al = f.s / (N - 1); for (let k = 0; k < 2; k++) { const pos = ((bt * 0.26 + k * 0.55) % 1.25) - 0.12, d = al - pos; b += Math.exp(-d * d / 0.012) * (0.55 + 0.45 * Math.cos(f.j / 6 * TAU - bt * 2.4 - al * 5)); }
    const fill = mix(fill0, '#FFFFFF', Math.min(0.45, b * (0.22 + gl * 0.2)));
    return { fill, inset: mix(fill, '#FFFFFF', f.lit > 0.6 ? 0.3 : 0.16), glow, col };
  }
  function drawShell(c, FX, P, P3, T, lw, M, bt) {
    const G = shellFaces(P), pr = q => P3(q[0], q[1], q[2]), gl = M.glow || 0, crack = M.crack || 0, sc = pr(shellC(P)), N = G.N;
    const show = G.list.filter(f => f.vis > 0); if (G.mouth.vis > 0) show.push(G.mouth); show.sort((a, b) => a.depth - b.depth);
    // a soft glow of stolen colour round it, its hue drifting from one to the next
    { const u = bt * 0.3, i0 = Math.floor(u) % 6, fr = u - Math.floor(u); c.save(); c.globalCompositeOperation = 'lighter'; const a = 0.1 + gl * 0.22;
      c.globalAlpha = a * (1 - fr); blitSized(c, glowSprite(HUE[i0]), sc[0] - T * 4.8, sc[1] - T * 4.8, T * 9.6, T * 9.6); c.globalAlpha = a * fr; blitSized(c, glowSprite(HUE[(i0 + 1) % 6]), sc[0] - T * 4.8, sc[1] - T * 4.8, T * 9.6, T * 9.6); c.restore(); }
    const visK = k => { const f = G.faces[k]; return !!(f && f.vis > 0); };
    c.lineJoin = 'round'; c.lineCap = 'round';
    show.forEach(f => { const S = f.pts.map(pr), path = () => { c.beginPath(); c.moveTo(S[0][0], S[0][1]); for (let i = 1; i < S.length; i++) c.lineTo(S[i][0], S[i][1]); c.closePath(); };
      if (f.mouth) { path(); c.fillStyle = HOLE; c.fill(); c.strokeStyle = rgba('#FFFFFF', 0.55); c.lineWidth = Math.max(2, lw * 1.7); c.stroke(); c.strokeStyle = INK; c.lineWidth = lw * 1.1; c.stroke(); return; }
      const tone = facetTone(f, M, bt, N);
      path(); c.fillStyle = tone.fill; c.fill();
      { const ce = S.reduce((q, p) => [q[0] + p[0] / S.length, q[1] + p[1] / S.length], [0, 0]); c.beginPath(); S.forEach((p, i) => { const x = ce[0] + (p[0] - ce[0]) * 0.55, y = ce[1] + (p[1] - ce[1]) * 0.55; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.fillStyle = tone.inset; c.fill();
        // a white glint along the lit facets' upper edge
        if (f.lit > 0.6 && !f.tri) { const k = 0.2, a0 = lerp(S[3][0], S[2][0], 0.2), b0 = lerp(S[3][1], S[2][1], 0.2), a1 = lerp(S[3][0], S[2][0], 0.6), b1 = lerp(S[3][1], S[2][1], 0.6); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(1, lw * 0.55); c.beginPath(); c.moveTo(lerp(a0, ce[0], k), lerp(b0, ce[1], k)); c.lineTo(lerp(a1, ce[0], k), lerp(b1, ce[1], k)); c.stroke(); } }
      if (tone.glow > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, tone.glow); path(); c.fillStyle = tone.col; c.fill(); c.restore(); }
      // the cracks across it: dark seams with light leaking out of them (many more when it has been broken open)
      if (!f.tri) { const C = CRACKS[f.s + '|' + f.j]; if (C && (C.base || crack > 0.05)) { const at = (a, b) => [lerp(lerp(S[0][0], S[1][0], a), lerp(S[3][0], S[2][0], a), b), lerp(lerp(S[0][1], S[1][1], a), lerp(S[3][1], S[2][1], a), b)];
        const one = (pts, al) => { const Q = pts.map(([a, b]) => at(a, b)); c.beginPath(); Q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = rgba('#FFFFFF', 0.55 * al); c.lineWidth = Math.max(2, lw * 1.4); c.stroke(); c.strokeStyle = rgba(INK, 0.9 * al); c.lineWidth = Math.max(1, lw * 0.55); c.stroke(); };
        if (C.base) one(C.p, 1); if (crack > 0.05) one(C.q, crack); } }
      // its edges: fine between facets, heavy where the next facet is turned away (the shell's own outline)
      path(); c.strokeStyle = rgba(INK, 0.8); c.lineWidth = Math.max(1, lw * 0.55); c.stroke();
      const s = f.s, j = f.j, j1 = (j + 1) % 6, jm = (j + 5) % 6, nb = f.tri ? ['q' + (N - 2) + '|' + j, 'a' + j1, 'a' + jm] : [s ? 'q' + (s - 1) + '|' + j : null, 'q' + s + '|' + j1, s + 1 < N - 1 ? 'q' + (s + 1) + '|' + j : 'a' + j, 'q' + s + '|' + jm];
      c.strokeStyle = INK; c.lineWidth = lw * 1.3; c.beginPath(); for (let e = 0; e < S.length; e++) { if (nb[e] && visK(nb[e])) continue; const p0 = S[e], p1 = S[(e + 1) % S.length]; c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); } c.stroke(); });
    // its heart, bared through a broken facet: a white-hot gem, its rim running through the hues
    const hk = M.heart || 0; if (hk > 0.02) drawHeart(c, sc[0], sc[1], T, lw, hk, M, bt);
    // a hit flash
    if (K.Q.flash > 0) { c.beginPath(); show.forEach(f => { const S = f.pts.map(pr); c.moveTo(S[0][0], S[0][1]); for (let i = 1; i < S.length; i++) c.lineTo(S[i][0], S[i][1]); c.closePath(); }); c.fillStyle = 'rgba(255,244,236,.16)'; c.fill(); }
  }
  function drawHeart(c, x, y, T, lw, hk, M, bt) { const r = T * 1.0 * hk, R = mulberry32(77), pul = 1 + 0.07 * Math.sin(bt * 6) + (M.heartHit || 0) * 0.18;
    // the jagged hole broken in the shell
    c.beginPath(); for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, k = i % 2 ? 0.78 + R() * 0.15 : 1.02 + R() * 0.2; i ? c.lineTo(x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.92) : c.moveTo(x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.92); } c.closePath(); c.fillStyle = HOLE; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.25 * Math.sin(bt * 5); blitSized(c, glowSprite('#FFFFFF'), x - r * 1.9, y - r * 1.9, r * 3.8, r * 3.8); c.globalAlpha = 0.45; blitSized(c, glowSprite(HUE[Math.floor(bt * 2) % 6]), x - r * 1.5, y - r * 1.5, r * 3, r * 3); c.restore();
    // the gem: a tall faceted diamond, two-toned, its edges in the hues
    const h = r * 0.78 * pul, w = r * 0.5 * pul, pts = [[x, y - h], [x + w, y - h * 0.1], [x, y + h], [x - w, y - h * 0.1]];
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = '#F4F2FF'; c.fill();
    c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + w, y - h * 0.1); c.lineTo(x, y + h); c.closePath(); c.fillStyle = '#D6D0F2'; c.fill();
    c.beginPath(); c.moveTo(x - w, y - h * 0.1); c.lineTo(x + w, y - h * 0.1); c.strokeStyle = 'rgba(160,150,210,.7)'; c.lineWidth = Math.max(1, lw * 0.5); c.stroke();
    for (let i = 0; i < 4; i++) { const p = pts[i], q = pts[(i + 1) % 4]; c.strokeStyle = HUE[(i + Math.floor(bt * 3)) % 6]; c.lineWidth = Math.max(2, lw * 1.5); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.strokeStyle = INK; c.lineWidth = Math.max(1, lw * 0.7); c.stroke();
    TN.twinkle(c, x - w * 0.35, y - h * 0.45, r * 0.22, '#FFFFFF', 0.9); }
  /* the carapace: a broad grey dome jutting from the shell's mouth, a groove across it, knobbly; the face on its front (a
     wide toothy smirk, little mouthparts working below it); its cloak of barnacles over the top */
  function drawCarapace(c, FX, P, P3, T, lw, M, bt) { const { g, A } = caraG(P, M), hide = P.hide;
    c.save(); if (hide > 0.6) c.globalAlpha *= clamp((0.92 - hide) / 0.32, 0, 1);
    TN.ellipsoid(c, P3, P.hd, g, A, Object.assign({ T, lw: lw * 1.2, d1: 0.08, d2: 0.18, spec: 0.3, specR: 0.18, force: true, inner: gc => {
      // the groove across its back and the soft shadow under its brow
      const F0 = surfC(P, M, 0, 0.55), q0 = P3(...F0.p), a = surfC(P, M, 1.2, 0.5).p, b = surfC(P, M, -1.2, 0.5).p, A2 = P3(...a), B2 = P3(...b); gc.strokeStyle = rgba(CRAB_AO, 0.5); gc.lineWidth = Math.max(1.2, lw * 0.8); gc.beginPath(); gc.moveTo(A2[0], A2[1]); gc.quadraticCurveTo(q0[0], q0[1] - T * 0.15, B2[0], B2[1]); gc.stroke();
      const lo = P3(...P.W0(CARA.u + 0.4 - hide, 0, 0.55)); K.shade(gc, lo[0], lo[1], T * 1.8, T * 0.6, 0.35, CRAB_AO);
      // knobs and pits in the shell of it
      const R = mulberry32(404); for (let i = 0; i < 16; i++) { const F = surfC(P, M, (R() * 2 - 1) * 2.4, R() * 1.1 - 0.1); if (F.vis < 0.15) continue; const q = P3(...F.p), s = T * (0.05 + R() * 0.06); gc.fillStyle = rgba(CRAB_SH2, 0.6); gc.beginPath(); gc.arc(q[0], q[1], s, 0, TAU); gc.fill(); gc.fillStyle = rgba('#FFFFFF', 0.4); gc.beginPath(); gc.arc(q[0] - s * 0.3, q[1] - s * 0.35, s * 0.45, 0, TAU); gc.fill(); } } }, CRABS));
    // the face: the mouth, then the little mouthparts under it
    const Mo = surfC(P, M, 0, -0.12, 0.02); if (Mo.vis > 0.02) onPlane(c, P3, Mo, gg => { gg.scale(1.35, 1.35); mouth(gg, M, FX.m && FX.m.stunT > 0, bt); });
    // the barnacle cloak
    for (const [al, el, s] of BARNS) { const F = surfC(P, M, al, el, 0.02); if (F.vis < 0.12) continue; onPlane(c, P3, F, gg => barnacle(gg, s)); }
    c.restore(); }
  // a barnacle: a little cone of grey plates, a dark slit at its top, catching the light on its upper left
  function barnacle(g, s) { g.lineJoin = 'round';
    g.beginPath(); g.ellipse(0, 0, s, s * 0.92, 0, 0, TAU); g.fillStyle = BARN_SH; g.fill(); g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 0.028; g.stroke();
    g.beginPath(); g.ellipse(-s * 0.12, -s * 0.12, s * 0.72, s * 0.66, 0, 0, TAU); g.fillStyle = BARN; g.fill();
    g.strokeStyle = rgba(BARN_D, 0.5); g.lineWidth = 0.02; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3; g.beginPath(); g.moveTo(-s * 0.1 + Math.cos(a) * s * 0.32, -s * 0.1 + Math.sin(a) * s * 0.3); g.lineTo(Math.cos(a) * s * 0.92, Math.sin(a) * s * 0.85); g.stroke(); }
    g.beginPath(); g.ellipse(-s * 0.1, -s * 0.1, s * 0.3, s * 0.2, 0.4, 0, TAU); g.fillStyle = BARN_D; g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(-s * 0.48, -s * 0.42, s * 0.18, s * 0.1, -0.6, 0, TAU); g.fill(); }
  // the mouth in its own plane (x to its right, y down): a wide smirk, a row of little teeth when it is greedy, a gape when
  // it is hurt, a wobble when it reels; two mouthparts working under it
  function mouth(g, M, stunned, bt) { const gr = M.greed || 0, op = clamp((gr - 0.3) / 0.7, 0, 1), ouch = (M.ouch || 0) > 0.05; g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
    // the mouthparts: two little segmented flaps, fluttering
    for (const sd of [-1, 1]) { const w = Math.sin(bt * 9 + sd) * 0.06; g.save(); g.translate(sd * 0.2, 0.16); g.rotate(sd * 0.25 + w); g.beginPath(); g.ellipse(0, 0.14, 0.1, 0.18, 0, 0, TAU); g.fillStyle = CRAB_SH; g.fill(); g.lineWidth = 0.035; g.stroke(); g.beginPath(); g.moveTo(-0.07, 0.12); g.lineTo(0.07, 0.12); g.moveTo(-0.06, 0.22); g.lineTo(0.06, 0.22); g.strokeStyle = rgba(INK, 0.5); g.lineWidth = 0.025; g.stroke(); g.restore(); }
    g.strokeStyle = INK;
    if (stunned) { g.lineWidth = 0.05; g.beginPath(); g.moveTo(-0.42, 0); for (let i = 0; i <= 10; i++) g.lineTo(-0.42 + i * 0.084, (i % 2 ? 0.05 : -0.02)); g.stroke(); return; }
    if (ouch) { g.beginPath(); g.ellipse(0, 0.02, 0.22, 0.13, 0, 0, TAU); g.fillStyle = '#3A1830'; g.fill(); g.lineWidth = 0.045; g.stroke(); return; }
    if (op > 0.02) { g.beginPath(); g.moveTo(-0.5, -0.1); g.quadraticCurveTo(0, 0.06 + op * 0.24, 0.5, -0.1); g.quadraticCurveTo(0, 0.0, -0.5, -0.1); g.closePath(); g.fillStyle = '#2E1A34'; g.fill();
      g.fillStyle = '#FFFFFF'; for (let i = 0; i < 7; i++) { const x = -0.36 + i * 0.12, y0 = -0.07 + Math.abs(x) * 0.08 - 0.03 * (1 - Math.abs(x) * 2); g.beginPath(); g.moveTo(x - 0.045, y0); g.lineTo(x + 0.045, y0); g.lineTo(x, y0 + 0.07 + op * 0.03); g.closePath(); g.fill(); }
      g.lineWidth = 0.045; g.beginPath(); g.moveTo(-0.5, -0.1); g.quadraticCurveTo(0, 0.06 + op * 0.24, 0.5, -0.1); g.stroke(); }
    g.lineWidth = 0.055; g.beginPath(); g.moveTo(-0.56, -0.16); g.quadraticCurveTo(-0.3, -0.06, 0, -0.06); g.quadraticCurveTo(0.3, -0.06, 0.56, -0.18); g.stroke();
    g.lineWidth = 0.04; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 0.56, -0.16 - (sd > 0 ? 0.02 : 0)); g.lineTo(sd * 0.64, -0.24); g.stroke(); } }
  /* an eye-stalk and its eye: a jointed grey stalk, a socket, the pale eye (a pale iris ringed with the hues it covets, a
     pupil that follows the pet, heavy greedy lids) */
  function drawEyeStalk(c, FX, m, P, P3, T, lw, M, sd, E, bt) { const pr = w => P3(w[0], w[1], w[2]), hide = P.hide;
    c.save(); if (hide > 0.5) c.globalAlpha *= clamp((0.8 - hide) / 0.3, 0, 1);
    const so = lerp3(E.base, E.tip, 0.8); tubeLite(c, [E.base, E.mid, so].map(pr), u => T * (0.26 - u * 0.08), Object.assign({ lw, force: true }, CRABS));
    TN.ellipsoid(c, P3, P.hd, so, [0.2, 0.2, 0.12], Object.assign({ T, lw: lw * 0.8, d1: 0.1, d2: 0.2, spec: false, force: true }, CRABS));
    const q = pr(E.tip), r = E.r * T, lk = M.lock || 0, stun = FX.m && FX.m.stunT > 0, dz = (M.dizzy || 0) > 0.5 && stun, ouch = (M.ouch || 0) > 0.05;
    // locked on, a pale soft glow round the eye
    if (lk > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = lk * 0.55; blitSized(c, glowSprite('#E8E8FF'), q[0] - r * 2.6, q[1] - r * 2.6, r * 5.2, r * 5.2); c.restore(); }
    TN.shape(c, TN.ell(q[0], q[1], r, r), { col: EYE_W, shade: EYE_SH, shade2: '#C2C2D0', hi: '#FFFFFF', line: INK, lw, r, d1: 0.08, d2: 0.16, spec: false, force: true });
    c.save(); c.beginPath(); c.arc(q[0], q[1], r * 0.98, 0, TAU); c.clip();
    if (dz) { c.strokeStyle = IRIS_D; c.lineWidth = Math.max(1.2, r * 0.13); c.beginPath(); for (let i = 0; i <= 36; i++) { const a = i / 36 * TAU * 2.3 + bt * 6 * sd, rr = r * (0.06 + i / 36 * 0.7); i ? c.lineTo(q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr) : c.moveTo(q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr); } c.stroke(); c.restore(); c.restore(); return; }
    if (ouch) { c.restore(); c.strokeStyle = INK; c.lineWidth = Math.max(1.5, r * 0.2); c.lineCap = 'round'; c.beginPath(); c.moveTo(q[0] - r * 0.5, q[1] - r * 0.35); c.lineTo(q[0] + r * 0.35, q[1]); c.lineTo(q[0] - r * 0.5, q[1] + r * 0.35); c.stroke(); c.restore(); return; }
    // where it looks: toward the pet
    const me = FX.me, pp = me ? P3(me.x, me.y, 0.5) : [q[0], q[1] + T * 5], dx = pp[0] - q[0], dy = pp[1] - q[1], dl = Math.hypot(dx, dy) || 1, lx = q[0] + dx / dl * r * 0.3, ly = q[1] + dy / dl * r * 0.3, ir = r * 0.56;
    c.fillStyle = IRIS; c.beginPath(); c.arc(lx, ly, ir, 0, TAU); c.fill();
    // the iris ringed with the colours it covets
    for (let i = 0; i < 6; i++) { c.strokeStyle = rgba(HUE[i], 0.85); c.lineWidth = Math.max(1, ir * 0.2); c.beginPath(); c.arc(lx, ly, ir * 0.86, i / 6 * TAU + bt * 0.6, (i + 1) / 6 * TAU + bt * 0.6); c.stroke(); }
    c.fillStyle = IRIS_D; c.beginPath(); c.arc(lx, ly, ir, 0, TAU); c.lineWidth = Math.max(1, ir * 0.1); c.strokeStyle = IRIS_D; c.stroke();
    const pu = ir * (lk > 0.3 ? 0.22 : 0.42 + (M.greed || 0) * 0.08); c.fillStyle = PUPIL; c.beginPath(); c.arc(lx, ly, pu, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(lx - ir * 0.38, ly - ir * 0.4, ir * 0.24, ir * 0.17, -0.5, 0, TAU); c.fill(); c.beginPath(); c.arc(lx + ir * 0.32, ly + ir * 0.3, ir * 0.1, 0, TAU); c.fill();
    // the lids: a heavy greedy upper lid slanting down toward the middle (open wide when it locks on), a smug lower one
    const o = sd > 0 ? 1 : -1, ex = (q[0] < P3(...P.W0(CARA.u, 0, CARA.h))[0]) ? 1 : -1, bl = clamp(M.blink || 0, 0, 1), heavy = (0.42 + (M.greed || 0) * 0.25) * (1 - lk * 0.85), yo = lerp(-r * (1 - heavy * 1.25) - r * 0.05, r * 1.05, bl), yi = lerp(-r * (1 - heavy * 1.25) + r * 0.32 * (1 - lk), r * 1.05, bl);
    const lid = (y0, y1) => { c.beginPath(); c.moveTo(q[0] - ex * r * 1.2, q[1] + y0); c.quadraticCurveTo(q[0], q[1] + (y0 + y1) / 2 - r * 0.08, q[0] + ex * r * 1.2, q[1] + y1); c.lineTo(q[0] + ex * r * 1.2, q[1] - r * 1.4); c.lineTo(q[0] - ex * r * 1.2, q[1] - r * 1.4); c.closePath(); };
    c.fillStyle = 'rgba(60,50,80,.25)'; lid(yo + r * 0.12, yi + r * 0.12); c.fill(); c.fillStyle = CRAB; lid(yo, yi); c.fill();
    c.strokeStyle = INK; c.lineWidth = Math.max(1.2, lw * 0.9); c.beginPath(); c.moveTo(q[0] - ex * r * 1.2, q[1] + yo); c.quadraticCurveTo(q[0], q[1] + (yo + yi) / 2 - r * 0.08, q[0] + ex * r * 1.2, q[1] + yi); c.stroke();
    const lo = r * (0.82 - (M.greed || 0) * 0.12); c.fillStyle = CRAB; c.beginPath(); c.moveTo(q[0] - r * 1.2, q[1] + lo + r * 0.12); c.quadraticCurveTo(q[0], q[1] + lo - r * 0.12, q[0] + r * 1.2, q[1] + lo + r * 0.12); c.lineTo(q[0] + r * 1.2, q[1] + r * 1.3); c.lineTo(q[0] - r * 1.2, q[1] + r * 1.3); c.closePath(); c.fill();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = lw; c.beginPath(); c.arc(q[0], q[1], r, 0, TAU); c.stroke();
    void o; c.restore(); }
  // an antenna: a long whip from under the eyes, sweeping forward and out, swaying
  function drawAntenna(c, P, P3, T, lw, M, sd, bt) { const hide = P.hide, b = P.W0(CARA.u + 1.1 - hide, sd * 0.16, CARA.h + 0.15), pts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8, sw = Math.sin(bt * 2.3 + t * 4 + sd) * 0.18 * t; pts.push(P3(...add3(b, P.dirW(t * 1.9 * (1 - hide * 0.7), sd * (t * 1.1 + t * t * 1.5 + sw), Math.sin(t * 2.4) * 1.25 - t * t * 0.3)))); }
    c.save(); if (hide > 0.4) c.globalAlpha *= clamp((0.7 - hide) / 0.3, 0, 1); c.lineCap = 'round'; c.lineJoin = 'round'; const path = () => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); };
    path(); c.strokeStyle = INK; c.lineWidth = Math.max(2.2, T * 0.11); c.stroke(); path(); c.strokeStyle = CRAB_SH; c.lineWidth = Math.max(1, T * 0.055); c.stroke(); c.restore(); }
  /* a claw: a jointed arm, a knobbly palm, a fixed finger below and a hinged one above that opens and snaps, both
     dark-tipped */
  function drawClaw(c, P, P3, T, lw, M, sd, Q, bt) { const pr = w => P3(w[0], w[1], w[2]), s = Q.s, big = sd === BIG, hk = big ? (M.clawHit || 0) : 0;
    tubeLite(c, [Q.sh, lerp3(Q.sh, Q.el, 0.5), Q.el].map(pr), u => T * s * (0.54 - u * 0.06), Object.assign({ lw, force: true }, CRABS));
    TN.ellipsoid(c, P3, P.hd, Q.el, [0.34 * s, 0.34 * s, 0.32 * s], Object.assign({ T, lw, d1: 0.1, d2: 0.2, spec: 0.25, force: true }, CRABS));
    tubeLite(c, [Q.el, lerp3(Q.el, Q.wrist, 0.5), Q.wrist].map(pr), u => T * s * (0.46 + u * 0.14), Object.assign({ lw, force: true }, CRABS));
    const th = 0.08 + Q.open * 0.85, dd = norm3(add3(mul3(Q.d, Math.cos(th)), Q.up, Math.sin(th))), ud = norm3(sub3(mul3(Q.up, Math.cos(th)), mul3(Q.d, Math.sin(th))));
    const finger = (b0, dir, bend, L, w0) => { const pts = []; for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push(add3(add3(b0, dir, L * t), bend, t * t * L)); } const sp = pts.map(pr), wf = u => T * s * (w0 * (1 - u) + 0.05);
      tubeLite(c, sp, wf, Object.assign({ lw, force: true }, CRABS)); const k0 = 3, tipPts = sp.slice(k0); tubeLite(c, tipPts, u => wf(0.6 + u * 0.4), Object.assign({ lw, force: true }, TIPS)); };
    const fingers = () => { finger(add3(add3(Q.pc, Q.d, Q.a * 0.6), Q.up, -Q.c * 0.34), Q.d, mul3(Q.up, 0.3), Q.L * 0.92, 0.66);
      finger(add3(add3(Q.pc, Q.d, Q.a * 0.5), Q.up, Q.c * 0.42), dd, mul3(ud, -0.36), Q.L, 0.58); };
    const palm = () => { const E = ellScreen(P3, T, Q.pc, [mul3(Q.d, Q.a), mul3(Q.side, Q.b), mul3(Q.up, Q.c)]);
      TN.shape(c, TN.ell(E.x, E.y, E.ex, E.ey, E.rot), Object.assign({}, CRABS, { col: mix(CRAB, '#FFFFFF', hk * 0.35), lw: lw * 1.1, r: Math.max(E.ex, E.ey), d1: 0.09, d2: 0.18, spec: 0.35, specAt: [E.x - E.ex * 0.3, E.y - E.ey * 0.45], specR: 0.15, force: true, inner: g => {
        // its knobbly hide: little tubercles over the palm
        const R = mulberry32(big ? 71 : 72), co = Math.cos(E.rot), si = Math.sin(E.rot); for (let i = 0; i < (big ? 12 : 6); i++) { const a = R() * TAU, rr = Math.sqrt(R()) * 0.75, lx = Math.cos(a) * rr * E.ex, ly = Math.sin(a) * rr * E.ey, x = E.x + lx * co - ly * si, y = E.y + lx * si + ly * co, z = T * s * (0.06 + R() * 0.06); g.fillStyle = rgba(CRAB_SH2, 0.7); g.beginPath(); g.arc(x, y + z * 0.3, z, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x - z * 0.25, y - z * 0.2, z * 0.5, 0, TAU); g.fill(); } } })); };
    if (dot3(Q.d, VIEW) > 0) { palm(); fingers(); } else { fingers(); palm(); }
    // dug into the sand: a little heap of it over the fingers
    if (big && (M.slamK || 0) > 0.8) { const g = P3(Q.pc[0] + Q.d[0] * 0.9, Q.pc[1] + Q.d[1] * 0.9, 0); c.beginPath(); c.ellipse(g[0], g[1], T * 1.0, T * 0.42, 0, Math.PI, TAU); c.quadraticCurveTo(g[0] + T * 0.4, g[1] + T * 0.35, g[0] - T * 1.0, g[1]); c.closePath(); c.fillStyle = SAND; c.fill(); c.strokeStyle = rgba(INK, 0.7); c.lineWidth = lw * 0.8; c.stroke(); } }
  // a walking leg: hip, knee, ankle and a dark pointed tip on the sand
  function drawLeg(c, P3, T, lw, L, M) { const pr = w => P3(w[0], w[1], w[2]), hide = M.hide || 0; c.save(); if (hide > 0.6) c.globalAlpha *= clamp((0.9 - hide) / 0.3, 0, 1);
    tubeLite(c, [L.hip, lerp3(L.hip, L.knee, 0.5), L.knee].map(pr), u => T * (0.46 - u * 0.06), Object.assign({ lw, force: true }, CRABS));
    tubeLite(c, [L.knee, lerp3(L.knee, L.ank, 0.5), L.ank].map(pr), u => T * (0.4 - u * 0.08), Object.assign({ lw, force: true }, CRABS));
    TN.ellipsoid(c, P3, 0, L.knee, [0.24, 0.24, 0.22], Object.assign({ T, lw, d1: 0.1, d2: 0.2, spec: false, force: true }, CRABS));
    tubeLite(c, [L.ank, lerp3(L.ank, L.tip, 0.5), L.tip].map(pr), u => T * (0.3 * (1 - u) + 0.04), Object.assign({ lw, force: true }, TIPS));
    c.restore(); }

  /* ---------- the Bleached Cove: the beach and the sea ---------- */
  function paintCove(c, A) { const R = A.R, rnd = A.rnd;
    // the shallows round the beach, fading into the still grey sea
    let g = c.createRadialGradient(0, 0, R - 0.4, 0, 0, R + 1.5); g.addColorStop(0, '#8E8D97'); g.addColorStop(0.3, 'rgba(150,150,160,.75)'); g.addColorStop(1, 'rgba(142,142,152,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    // the beach: grey sand, paler at its heart
    g = c.createRadialGradient(0, -1, 1, 0, 0, R + 0.1); g.addColorStop(0, '#C8C7CD'); g.addColorStop(0.6, '#BCBBC2'); g.addColorStop(0.9, '#AAA9B1'); g.addColorStop(1, '#9B9AA3'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.1, 0, TAU); c.fill();
    // grain
    for (let i = 0; i < 2600; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, lt = rnd() < 0.5; c.fillStyle = lt ? `rgba(244,244,250,${0.1 + rnd() * 0.18})` : `rgba(80,80,94,${0.07 + rnd() * 0.14})`; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 0.04 + rnd() * 0.05, 0.04 + rnd() * 0.05); }
    // ripples the wind left in the sand
    c.lineCap = 'round'; for (let i = 0; i < 64; i++) { const a = rnd() * TAU, d = 1.5 + Math.sqrt(rnd()) * (R - 3), x = Math.cos(a) * d, y = Math.sin(a) * d, L = 0.9 + rnd() * 1.8, b = 0.15 + (rnd() - 0.5) * 0.3, cx = Math.cos(b), sy = Math.sin(b);
      c.strokeStyle = 'rgba(96,96,110,.16)'; c.lineWidth = 0.08; c.beginPath(); c.moveTo(x - cx * L, y - sy * L); c.bezierCurveTo(x - cx * L * 0.3, y - sy * L * 0.3 + 0.16, x + cx * L * 0.3, y + sy * L * 0.3 - 0.16, x + cx * L, y + sy * L); c.stroke();
      c.strokeStyle = 'rgba(246,246,252,.2)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(x - cx * L, y - sy * L - 0.08); c.bezierCurveTo(x - cx * L * 0.3, y - sy * L * 0.3 + 0.08, x + cx * L * 0.3, y + sy * L * 0.3 - 0.24, x + cx * L, y + sy * L - 0.08); c.stroke(); }
    // the wet sand toward the water's edge, and the foam lines where the still sea laps
    g = c.createRadialGradient(0, 0, R - 2.4, 0, 0, R + 0.1); g.addColorStop(0, 'rgba(104,104,118,0)'); g.addColorStop(1, 'rgba(104,104,118,.34)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.1, 0, TAU); c.fill();
    for (const [rr, a, w] of [[R - 0.2, 0.5, 0.13], [R - 0.85, 0.22, 0.08], [R - 1.5, 0.1, 0.06]]) { c.strokeStyle = `rgba(246,246,252,${a})`; c.lineWidth = w; c.beginPath(); for (let i = 0; i <= 160; i++) { const t = i / 160 * TAU, r = rr + Math.sin(t * 11 + rr) * 0.12 + Math.sin(t * 27) * 0.05; i ? c.lineTo(Math.cos(t) * r, Math.sin(t) * r) : c.moveTo(Math.cos(t) * r, Math.sin(t) * r); } c.stroke(); }
    // bleached shells, pebbles, a few strands of grey weed washed up near the edge
    for (let i = 0; i < 28; i++) { const a = rnd() * TAU, d = 2 + rnd() * (R - 3), x = Math.cos(a) * d, y = Math.sin(a) * d, s = 0.12 + rnd() * 0.14, rot = rnd() * TAU; c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = 'rgba(236,236,242,.85)'; c.beginPath(); c.moveTo(-s, s * 0.3); c.quadraticCurveTo(0, -s * 1.15, s, s * 0.3); c.closePath(); c.fill(); c.strokeStyle = 'rgba(110,110,124,.55)'; c.lineWidth = 0.025; c.stroke(); for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * s * 0.18, s * 0.3); c.lineTo(k * s * 0.08, -s * 0.5); c.stroke(); } c.restore(); }
    for (let i = 0; i < 46; i++) { const a = rnd() * TAU, d = 1 + rnd() * (R - 1.5), x = Math.cos(a) * d, y = Math.sin(a) * d, s = 0.05 + rnd() * 0.09; c.fillStyle = rnd() < 0.5 ? 'rgba(130,130,142,.7)' : 'rgba(214,214,222,.8)'; c.beginPath(); c.ellipse(x, y, s * 1.3, s, rnd() * 3, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(x - s * 0.3, y - s * 0.3, s * 0.35, 0, TAU); c.fill(); }
    for (let i = 0; i < 16; i++) { const a = rnd() * TAU, d = R - 0.6 - rnd() * 1.6, x = Math.cos(a) * d, y = Math.sin(a) * d, b = a + Math.PI / 2 + (rnd() - 0.5) * 0.6, L = 0.5 + rnd() * 0.7; c.strokeStyle = 'rgba(84,86,96,.5)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + Math.cos(b) * L * 0.3 + 0.12, y + Math.sin(b) * L * 0.3 - 0.1, x + Math.cos(b) * L * 0.7 - 0.12, y + Math.sin(b) * L * 0.7 + 0.1, x + Math.cos(b) * L, y + Math.sin(b) * L); c.stroke(); }
    // the last shards of colour lying in the sand, the grains round each tinted
    for (const [x, y, h, s, tl] of SHARDS) { const col = HUE[h]; g = c.createRadialGradient(x, y, 0, x, y, s * 1.4); g.addColorStop(0, rgba(col, 0.3)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, s * 1.4, 0, TAU); c.fill();
      c.fillStyle = 'rgba(30,30,44,.25)'; c.beginPath(); c.ellipse(x + 0.08, y + 0.04, s * 0.42, s * 0.14, 0, 0, TAU); c.fill(); sandCrystal(c, x - s * 0.12, y, s * 0.12, s * 0.55, col, tl - 0.3); sandCrystal(c, x + s * 0.1, y + 0.02, s * 0.16, s * 0.85, col, tl); }
    for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = 2 + rnd() * (R - 2.5), x = Math.cos(a) * d, y = Math.sin(a) * d, s = 0.05 + rnd() * 0.06; c.fillStyle = rgba(HUE[i % 6], 0.7); c.beginPath(); c.moveTo(x, y - s * 1.5); c.lineTo(x + s, y); c.lineTo(x, y + s * 0.8); c.lineTo(x - s, y); c.closePath(); c.fill(); }
    // the hollow it has dug for itself near the heart, and the drag of its claws round it
    g = c.createRadialGradient(HOME[0], HOME[1], 2.2, HOME[0], HOME[1], 5.0); g.addColorStop(0, 'rgba(80,80,98,0)'); g.addColorStop(0.65, 'rgba(80,80,98,.08)'); g.addColorStop(0.85, 'rgba(246,246,252,.07)'); g.addColorStop(1, 'rgba(246,246,252,0)'); c.fillStyle = g; c.beginPath(); c.arc(HOME[0], HOME[1], 5.0, 0, TAU); c.fill();
    for (let i = 0; i < 14; i++) { const a = rnd() * TAU, r0 = 3.2 + rnd() * 1.2, L = 0.8 + rnd() * 1.2, x = HOME[0] + Math.cos(a) * r0, y = HOME[1] + Math.sin(a) * r0; c.strokeStyle = 'rgba(80,80,96,.22)'; c.lineWidth = 0.07; for (const o of [-0.09, 0.09]) { c.beginPath(); c.moveTo(x - Math.sin(a) * o, y + Math.cos(a) * o); c.lineTo(x + Math.cos(a) * L - Math.sin(a) * o, y + Math.sin(a) * L + Math.cos(a) * o); c.stroke(); } }
    // the light: brighter to the upper left, a shade to the lower right
    g = c.createRadialGradient(1.2, 1.2, R - 3.4, 1.2, 1.2, R + 1.2); g.addColorStop(0, 'rgba(40,40,58,0)'); g.addColorStop(1, 'rgba(40,40,58,.32)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.1, 0, TAU); c.fill();
    g = c.createRadialGradient(-1.2, -1.2, R - 1.6, -1.2, -1.2, R + 0.8); g.addColorStop(0, 'rgba(250,250,255,0)'); g.addColorStop(1, 'rgba(250,250,255,.22)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.1, 0, TAU); c.fill(); }
  // a shard of colour standing in the sand, in the ground's own units (metres): a lit face, a shaded face, a fine outline
  function sandCrystal(c, x, y, w, h, col, tilt) { c.save(); c.translate(x, y); c.rotate(tilt || 0); c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w, -h * 0.72); c.lineTo(0, -h); c.lineTo(0, 0); c.closePath(); c.fillStyle = shadeC(col, 0.35); c.fill();
    c.beginPath(); c.moveTo(w, 0); c.lineTo(w, -h * 0.72); c.lineTo(0, -h); c.lineTo(0, 0); c.closePath(); c.fillStyle = shadeC(col, -0.12); c.fill();
    c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w, -h * 0.72); c.lineTo(0, -h); c.lineTo(w, -h * 0.72); c.lineTo(w, 0); c.closePath(); c.strokeStyle = INK; c.lineWidth = 0.035; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 0.025; c.beginPath(); c.moveTo(-w * 0.55, -h * 0.1); c.lineTo(-w * 0.55, -h * 0.62); c.stroke(); c.restore(); }
  /* the still grey sea all round, a dim sky of pale stars at its far edge, and the colours sinking away under the water */
  function paintSea(c, W, H) { const R = mulberry32(5511);
    let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#46445A'); g.addColorStop(0.06, '#787788'); g.addColorStop(0.095, '#A9A9B4'); g.addColorStop(0.11, '#9E9EA8'); g.addColorStop(0.5, '#8E8E98'); g.addColorStop(1, '#7A7A85'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { const x = R() * W, y = R() * H * 0.075; c.globalAlpha = 0.3 + R() * 0.5; c.fillStyle = R() < 0.2 ? HUE[Math.floor(R() * 6)] : '#F4F0FF'; c.beginPath(); c.arc(x, y, 0.4 + R() * 0.9, 0, TAU); c.fill(); } c.globalAlpha = 1;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28; blitSized(c, glowSprite('#E8E8F2'), -W * 0.3, H * 0.055, W * 1.6, H * 0.09); c.restore();
    // the colours sinking away under the still water, soft
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 10; i++) { const x = R() * W, y = H * (0.18 + R() * 0.78), w = W * (0.12 + R() * 0.14); c.globalAlpha = 0.07 + R() * 0.06; blitSized(c, glowSprite(HUE[i % 6]), x - w / 2, y - w * 0.9, w, w * 1.8); } c.restore();
    // long low ripples on the still sea
    c.lineCap = 'round'; for (let i = 0; i < 46; i++) { const u = (i + R()) / 46, y = H * (0.12 + Math.pow(u, 1.5) * 0.88), L = W * (0.06 + u * 0.22) * (0.5 + R()), x = R() * W, amp = 1 + u * 3; c.strokeStyle = `rgba(232,232,240,${0.1 + R() * 0.16})`; c.lineWidth = 0.8 + u * 1.6; c.beginPath(); c.moveTo(x - L, y); c.quadraticCurveTo(x, y - amp, x + L, y); c.stroke(); c.strokeStyle = `rgba(70,70,84,${0.06 + R() * 0.08})`; c.lineWidth = 0.6 + u * 1.2; c.beginPath(); c.moveTo(x - L * 0.8, y + amp + 1.5); c.quadraticCurveTo(x, y + 1.5, x + L * 0.8, y + amp + 1.5); c.stroke(); } }

  /* ---------- on the sand: the shards' glints, claw dents, bulges where greylings rise, and the telegraphs (the drain's
     ring, the crush's circle and the snip's line, the beams' lines, the flare's circle); every band and ring feathered ---------- */
  function softLine(c, x0, y0, x1, y1, w, col, a) { c.save(); c.lineCap = 'round'; [[1.5, 0.05], [1.18, 0.08], [0.88, 0.12], [0.56, 0.16]].forEach(([k, al]) => { c.strokeStyle = rgba(col, al * a); c.lineWidth = Math.max(1, w * k); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }); c.restore(); }
  function softRing(c, X, Y, r, w, col, a) { if (r <= 0) return; c.save(); [[1.9, 0.06], [1.3, 0.1], [0.85, 0.16], [0.45, 0.24], [0.18, 0.4]].forEach(([k, al]) => { c.strokeStyle = rgba(col, al * a); c.lineWidth = Math.max(1, w * k); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke(); }); c.restore(); }
  function softDisc(c, X, Y, r, col, a) { if (!(r > 1)) return; const g = c.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.78, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill(); }
  function chevron(c, X, Y, a, s, col, alpha) { const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(X - ux * s + nx * s, Y - uy * s + ny * s); c.lineTo(X, Y); c.lineTo(X - ux * s - nx * s, Y - uy * s - ny * s); c.strokeStyle = `rgba(20,16,30,${0.4 * alpha})`; c.lineWidth = Math.max(3, s * 0.55); c.stroke(); c.strokeStyle = rgba(col, alpha); c.lineWidth = Math.max(1.6, s * 0.3); c.stroke(); c.restore(); }
  function lab(c, X, Y, s, col, T, k) { c.save(); c.font = `900 ${Math.round(T * (k || 0.36))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(8,8,20,.82)'; c.lineJoin = 'round'; c.strokeText(s, X, Y); c.fillStyle = col || '#FFFFFF'; c.fillText(s, X, Y); c.restore(); }
  function arenaClip(c, FX, T) { c.beginPath(); c.arc(FX.sx(FX.C.x), FX.sy(FX.C.y), (FX.C.R + 0.25) * T, 0, TAU); c.clip(); }
  function drawOverlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !M.stat || !m) return; const sx = FX.sx, sy = FX.sy, pu = 0.5 + 0.5 * Math.sin(t * 8), C0 = FX.C;
    // the shards of colour glinting in the sand (dim while it drinks their colour)
    { const dim = 1 - (M.thK || 0) * 0.7; c.save(); SHARDS.forEach(([x, y, h, s], i) => { const X = sx(C0.x + x), Y = sy(C0.y + y) - T * s * 0.3, r = T * s * 0.95; c.globalAlpha = (0.3 + 0.12 * Math.sin(t * 1.7 + i * 1.9)) * dim; blitSized(c, glowSprite(HUE[h]), X - r, Y - r, r * 2, r * 2); }); c.restore();
      SHARDS.forEach(([x, y, h, s], i) => { const k = (t * 0.45 + i * 0.37) % 1; if (k < 0.12) TN.twinkle(c, sx(C0.x + x) + T * s * 0.1, sy(C0.y + y) - T * s * 0.7, T * 0.22 * Math.sin(k / 0.12 * Math.PI), '#FFFFFF', 0.9 * dim); }); }
    // the dents its claws and its rising left in the sand
    M.marks.forEach(k => { const a = clamp((k.life - k.t) / 2.5, 0, 1) * clamp(k.t / 0.1, 0, 1); if (a <= 0.01) return; const X = sx(k.x), Y = sy(k.y), r = k.r * T; c.save(); c.globalAlpha = a; K.shade(c, X, Y, r * 1.05, r * 0.85, 0.36, '#3A3A4C'); softRing(c, X, Y, r * 0.95, T * 0.45, '#F4F4FA', 0.7); c.restore(); });
    // bulges in the sand where greylings are about to burst out
    M.bumps.forEach(b => { const u = clamp(b.t / b.dur, 0, 1), X = sx(b.x), Y = sy(b.y), R = mulberry32(b.seed); K.shade(c, X, Y + T * 0.1, T * (0.55 + 0.45 * u), T * (0.3 + 0.2 * u), 0.4, '#30303E'); c.beginPath(); c.ellipse(X, Y, T * (0.3 + 0.4 * u), T * (0.16 + 0.22 * u), 0, Math.PI, TAU); c.closePath(); c.fillStyle = SAND; c.fill(); c.strokeStyle = rgba(INK, 0.55); c.lineWidth = 1.2; c.stroke();
      c.strokeStyle = rgba(INK, 0.6); c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const a = Math.PI + 0.4 + R() * 2.3; c.beginPath(); c.moveTo(X, Y - T * 0.12 * u); c.lineTo(X + Math.cos(a) * T * 0.38 * u, Y + Math.sin(a) * T * 0.22 * u); c.stroke(); } softRing(c, X, Y, T * (0.9 - 0.3 * u), T * 0.18, '#FFFFFF', 0.5 + 0.4 * pu); });
    // Drain: the ring's full reach shown faintly, the grey spreading over the sand to it, then streaks drawn in to the crab
    const D = M.dr; if (D && D.state !== 'lock') { const X = sx(D.x), Y = sy(D.y), fk = D.state === 'fade' ? clamp(1 - (D.age - D.t2) / D.fade, 0, 1) : 1, rr = D.cur * T;
      c.save(); arenaClip(c, FX, T); softRing(c, X, Y, D.r * T, T * 0.35, DRAINC, 0.6 * fk); softDisc(c, X, Y, rr, DRAIN_F, 0.3 * fk); softRing(c, X, Y, rr * 0.985, T * 0.5, '#F4F4FA', (0.95 + 0.35 * pu) * fk);
      if (D.state === 'drain' || D.state === 'fade') { c.lineCap = 'round'; for (let i = 0; i < 9; i++) { const k = (t * 0.6 + i * 0.37) % 1, a = i / 9 * TAU + t * 0.5 + k * 1.2, r = D.r * T * (1 - k) * 0.95 + T * 1.2; c.strokeStyle = rgba('#F4F4FA', 0.4 * Math.sin(k * Math.PI) * fk); c.lineWidth = Math.max(1.5, T * 0.12); c.beginPath(); c.arc(X, Y, r, a, a + 0.45); c.stroke(); } }
      c.restore(); if (D.state !== 'fade') lab(c, X, Y + D.r * T * 0.74, 'DRAIN · step out', DRAINC, T, 0.4); }
    // Pincer Crush: the circle the great claw comes down on, its shadow swelling in it; then the small claw's line
    const Cr = M.cr; if (Cr && Cr.tx != null && (Cr.state === 'shown' || Cr.state === 'slam')) { const X = sx(Cr.tx), Y = sy(Cr.ty), k = Cr.state === 'shown' ? clamp((Cr.age - Cr.t0) / 0.25, 0, 1) : 1, u = Cr.state === 'shown' ? clamp((Cr.age - Cr.t0) / Cr.wait, 0, 1) : 1;
      c.save(); arenaClip(c, FX, T); softDisc(c, X, Y, Cr.r * T, CRUSHC, 0.18 * k); softRing(c, X, Y, Cr.r * T, T * 0.4, CRUSHC, k * (1.1 + 0.4 * pu)); softRing(c, X, Y, Cr.r * T * (1 - u * 0.8) + T * 0.25, T * 0.22, '#FFFFFF', 0.7 * k); K.shade(c, X, Y, T * Cr.r * (0.3 + 0.5 * u), T * Cr.r * (0.22 + 0.36 * u), 0.2 + 0.4 * u, '#1C1C2A'); c.restore();
      if (Cr.state === 'shown') lab(c, X, Y + Cr.r * T * 0.62, 'PINCER', CRUSHC, T, 0.4); }
    const S = Cr && Cr.sn; if (S && (S.state === 'shown' || S.state === 'snip')) { const k = S.state === 'shown' ? clamp((Cr.age - S.t0) / 0.2, 0, 1) : 1, X0 = sx(S.ox), Y0 = sy(S.oy), X1 = sx(S.ox + S.d[0] * S.len), Y1 = sy(S.oy + S.d[1] * S.len);
      c.save(); arenaClip(c, FX, T); softLine(c, X0, Y0, X1, Y1, S.w * T * 1.15, '#2A2236', k * 1.6); softLine(c, X0, Y0, X1, Y1, S.w * T * 1.05, SNIPC, k * (3.0 + 0.8 * pu)); softLine(c, X0, Y0, X1, Y1, S.w * T * 0.32, '#FFF6D8', k * 2.2); c.restore(); }
    // Prism Beams: each line it will fire along, in its own colour (dim while the lines turn), brightest as it fires
    const B = M.bm; if (B && (B.state === 'shown' || B.state === 'fire' || B.state === 'turn')) { const k = B.state === 'shown' ? clamp((B.age - B.t0) / 0.2, 0, 1) * (0.95 + 0.45 * pu) : B.state === 'turn' ? 0.5 : 1.7, u = B.state === 'shown' ? clamp((B.age - B.t0) / B.show, 0, 1) : 1;
      c.save(); arenaClip(c, FX, T); beamLines(FX, B).forEach(L => { const X0 = sx(L.x0), Y0 = sy(L.y0), X1 = sx(L.ex), Y1 = sy(L.ey); softLine(c, X0, Y0, X1, Y1, B.w * T * (B.state === 'fire' ? 1.2 : 0.8), HUE[L.hue], k); if (B.state === 'shown') softLine(c, X0, Y0, lerp(X0, X1, u), lerp(Y0, Y1, u), B.w * T * 0.3, '#FFFFFF', 0.7); }); c.restore(); }
    // Hue Theft's flare: the circle the shell will flare over if the sixth facet lights
    const Th = M.th; if (Th && Th.shown && !Th.done) { const X = sx(Th.x), Y = sy(Th.y), u = clamp((Th.age - Th.t5) / Math.max(0.3, Th.t0 + Th.per * 6 - Th.t5), 0, 1), k = clamp((Th.age - Th.t5) / 0.25, 0, 1);
      c.save(); arenaClip(c, FX, T); softDisc(c, X, Y, Th.fr * T, '#FFFFFF', 0.12 * k); softRing(c, X, Y, Th.fr * T, T * 0.42, HUE[Math.floor(t * 6) % 6], k * (1.0 + 0.4 * pu)); softRing(c, X, Y, Th.fr * T, T * 0.2, '#FFFFFF', k * 0.9); softRing(c, X, Y, Th.fr * T * (1 - u * 0.75) + T * 0.4, T * 0.22, '#FFFFFF', 0.6 * k); c.restore();
      lab(c, X, Y + Th.fr * T * 0.78, 'GET CLEAR · or crack it', '#FFFFFF', T, 0.38); } }
  /* ---------- in the air: the beams as they fire, the labels and meters ---------- */
  function drawAir(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M || !M.stat) return; const sx = FX.sx, sy = FX.sy, P = pose(m, M), s3 = shellC(P), SX = sx(s3[0]), SY = sy(s3[1]) - s3[2] * T, ap = P.Ws(SHELL.apex[0], SHELL.apex[1], SHELL.apex[2]), TOP = Math.min(sy(ap[1]) - ap[2] * T, SY - T * 3) - T * 0.7, TX = (SX + sx(ap[0])) / 2;
    // the beams: soft rays of single colours from the shell's facets down and out over the sand
    const B = M.bm; if (B && B.state === 'fire') { const u = clamp((B.age - B.t1) / B.fire, 0, 1), al = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
      beamLines(FX, B).forEach(L => { const col = HUE[L.hue], ox = s3[0] + L.d[0] * 1.5, oy = s3[1] + L.d[1] * 1.5, X0 = sx(ox), Y0 = sy(oy) - (s3[2] - 0.3) * T, X1 = sx(L.ex), Y1 = sy(L.ey) - 0.3 * T;
        softRay(c, sx(L.x0), sy(L.y0), X1, sy(L.ey), T * 1.3, col, al * 0.55); softRay(c, X0, Y0, X1, Y1, T * 1.6, col, al * 0.9, 0.32); }); }
    // the theft: the six facets' lights as pips (the timer), the blows wanted as a meter
    const Th = M.th; if (Th && Th.state === 'drink' && !Th.done && m.act === 'theft') { const yy = TOP - T * 1.25, w = T * 0.5, x0 = TX - 2.5 * w;
      for (let i = 0; i < 6; i++) { const on = i < Th.lit, x = x0 + i * w, r = Math.max(4, T * 0.17) * (i === Th.lit - 1 ? 1.25 : 1); c.beginPath(); c.moveTo(x, yy - r * 1.3); c.lineTo(x + r, yy); c.lineTo(x, yy + r * 1.3); c.lineTo(x - r, yy); c.closePath(); c.fillStyle = on ? HUE[i] : 'rgba(20,24,44,.7)'; c.fill(); c.lineWidth = 2; c.strokeStyle = on ? '#FFFFFF' : rgba(HUE[i], 0.8); c.stroke(); }
      lab(c, TX, yy + T * 0.62, 'STRIKE THE SHELL', '#FFFFFF', T, 0.36);
      const n = Th.need, pw = T * 0.38, px = TX - (n - 1) * pw / 2, py = yy + T * 1.15; for (let i = 0; i < n; i++) { const on = i < Th.hits; c.beginPath(); c.arc(px + i * pw, py, Math.max(3, T * 0.12), 0, TAU); c.fillStyle = on ? '#FFFFFF' : 'rgba(20,24,44,.7)'; c.fill(); c.lineWidth = 2; c.strokeStyle = on ? HUE[i % 6] : 'rgba(226,238,255,.8)'; c.stroke(); } }
    const Cs = M.cr, Sn = Cs && Cs.sn; if (Sn && (Sn.state === 'shown' || Sn.state === 'snip') && m.act === 'crush') { const k = Sn.state === 'shown' ? clamp((Cs.age - Sn.t0) / 0.2, 0, 1) : 1;
      for (let s = 0.8; s < Sn.len - 0.3; s += 1.1) { const mv = (t * 2.4) % 1.1; chevron(c, sx(Sn.ox + Sn.d[0] * (s + mv - 0.5)), sy(Sn.oy + Sn.d[1] * (s + mv - 0.5)), Sn.a, T * 0.3, '#FFF3C8', k * 0.75); }
      if (Sn.state === 'shown') { const ex = Sn.ox + Sn.d[0] * (Sn.len + 0.7), ey = Sn.oy + Sn.d[1] * (Sn.len + 0.7); lab(c, sx(ex), sy(ey) + T * 0.15, 'SNIP', SNIPC, T, 0.4); } }
    const Cr = M.cr; if (Cr && Cr.state === 'stuck' && m.act === 'crush') { const q = clawPose(P, M, BIG).pc; lab(c, sx(q[0]), sy(q[1]) - q[2] * T - T * 1.2, 'STUCK · strike the claw', CRUSHC, T, 0.32); }
    if (m.stunT > 0) { const w = FX.S.weak.heart; if (w && !w.dead) lab(c, SX, SY + T * 1.45, 'HEART · strike it', '#FFFFFF', T, 0.36);
      const nm = M.stunKind === 'cracked' ? 'CRACKED' : M.stunKind === 'exposed' ? 'EXPOSED' : ''; if (nm) lab(c, TX, TOP, `${nm} ${Math.ceil(m.stunT)}s`, '#FFFFFF', T, 0.42); }
    const Br = M.br; if (Br) { const left = Math.max(0, Br.total - Br.killed); lab(c, TX, TOP - T * 0.55, `THE BROOD · ${left} left`, '#FFFFFF', T, 0.6); lab(c, TX, TOP + T * 0.05, 'HIDDEN · clear the brood', '#E2E2EA', T, 0.32); } }
})());
