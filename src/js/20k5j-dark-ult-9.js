/* ---------- Dark, reworked: Thriller ----------
   Undead Cocopets rise from the ground round the caster and fight beside it for exactly 30 seconds: every normal attack
   the caster makes (one trigger per normal-attack ACTION, through the dungeon's onNormal hook in 20b's tryFire) makes
   each active zombie perform its own Dark attack worth 100% of that action's total damage before defences (never divided
   by the count: ten zombies are ten more full-strength blows). The blow goes through hitMon (el dark, src 'summon'),
   attributed to the pet; zombie blows never re-trigger the hook (they are not normal attacks, and a guard refuses any
   re-entry). Then the rush: the cracks brighten in a rolling sequence, the gait turns into a sprint at the nearest
   monster and each zombie detonates ONCE on arrival (2 x base x K x evoK Dark AoE), all within 2 s of the phase's end;
   one that reaches nobody detonates where it stands if monsters remain, or dissolves harmlessly if none do.
   Counts by level 3, 4, 5, 6, 7, 8, 10. Cost 100, cooldown 30 (its row is in 20k1; it replaces Thousand-Raven Funeral).
   The zombies are real actors: a position, a radius, walking through the game's moveEnt (walls stop them), a target
   (the nearest valid monster near the pet, spread so they do not all pile on one, retargeting when it dies), a queue of
   echoed attacks that they execute when in reach (an echo that cannot reach anyone within 2.5 s lapses), a leash to the
   pet (far behind: they sink and resurface beside it). Monsters never target summons in this game (Animas and the
   Ult clones are untargetable too), so the zombies have no health: they are untargetable and say so in the tuning data.
   Cleanup: the listener is removed and every zombie and effect ends when the army is spent, when the pet goes down
   (they dissolve, no explosions) and with the floor (the game and its effects are made anew per floor).
   The model: ONE fixed undead Cocopet design for every caster and level, a cel-shaded rigged figure built on Anima3D
   (oriented ellipsoids, capsule limbs, ragged blob ears, surface marks for the sunken eyes, the stitched grin, cracks and
   the stitched belly), posed per state: rise (clawing up out of the ground, head bowed), idle (lolling sway), an uneven
   limping walk (one leg drags, the body lurches), attack (both claws raised, then raked down with a lunge), sprint
   (hunched low, arms flung back) and explode (swelling, arms out, every crack ablaze). Each pose is rendered once per
   animation frame into a cached sprite (twelve walk frames, eight of the rest; both facings; a bright-crack variant for
   the rush), so ten zombies cost ten blits; the living parts (violet eye glow, the slow pulse in the torso, mist at the
   feet, the rising mask) are drawn per frame from cached sprites. Adept: bandages, a stitched scalp, more bruising and
   emissive seams, richer emergence, dark trails on attacks. Celestial: richer surface shading (violet rim, gloss),
   brighter seams and a pulse travelling through the cracks, the rolling crack-sequence before the rush.
   Layering: zombies behind the pet are drawn in the under layer (the pet covers them); those in front dim smoothly where
   they overlap it. Floor marks are light (violet cracks, glow rings) or translucent shadow that fades fully. */
(() => {
  const U = ELEM_IMPL.dark.ult; delete U.ravenfuneral;
  const TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  /* the tuning data (spec: expose what it leaves unspecified) */
  const TUNE = {
    counts: [3, 4, 5, 6, 7, 8, 10],   // zombies by level 1..7
    form: 1.25,          // s: the formation (rising) before the group is active
    combat: 30,          // s: the normal combat phase, exactly, at every level
    rushMax: 2,          // s: the bounded final approach after the combat phase
    echoK: 2,            // each zombie's coefficient on the caster's normal-attack damage (200%: doubled per the user)
    autoT: [0.85, 1.25], // a fighting zombie also claws on its own this often (s) whenever someone is in reach
    autoK: 0.9,          // its own blow before the caster has attacked: autoK x base x K x evoK (then x echoK)
    boomK: 4,            // each explosion: boomK x base x K x evoK (doubled per the user)
    boomR: 1.7,          // explosion radius (x K)
    reach: 0.95,         // how far a claw reaches beyond the target's radius
    walk: 2.5, sprint: 6.8, leash: 8, regroup: 13,   // speeds (tiles/s), the target leash round the pet, the resurfacing distance
    echoLapse: 2.5,      // s: an echoed attack that finds no one in reach lapses
    hp: null,            // untargetable: monsters in this game never target summons (Animas, Ult clones), so no health
  };
  const ZH = 1.12;   // a zombie's height in tiles (head top)
  let H;
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;

  /* ================= the model (Anima3D) ================= */
  const GREY = '#57526A', GSH = '#302B3E', GHI = '#857E9A', BRU = '#5D3E78', BEL = '#867A94', BELSH = '#584D6A', BELHI = '#A89DB6';
  const CLAW = '#D2C8DC', CLAWSH = '#8C809C', SOCK = '#0D0614', ZINK = '#130B1B', BAND = '#A49AAE', BANDSH = '#6E6478';
  const ZU = 62;   // model units from the feet to the head top
  Anima3D.MODELS.cocozombie = (k, t, o) => {
    const A = Anima3D.H, { ell, tube, blob, mark, frame, add, sub, mul, mix3, P } = A, R = A.R, u0 = R.u;
    const sti = o.st || 'idle', u = o.u || 0, cr = o.crack || 0, out = o.out || {}, T2 = k >= 2, T3 = k >= 3;
    const rim = { glowCol: ENERGY, glowA: T3 ? 0.34 : T2 ? 0.26 : 0.2 };
    const skin = Object.assign({ col: GREY, shade: GSH, hi: GHI, line: ZINK }, rim);
    // ---- the pose ----
    let hunch = 0.42, bob = 0, roll = 0, ff = 0, nod = 0.18, tilt = 0.22, hyaw = 0, swell = 1, legs = [[0, 0], [0, 0]], hands = [[13, 0, -2], [13, 0, -3]];
    const ph = u * TAU, sn = Math.sin(ph), cs = Math.cos(ph);
    if (sti === 'idle') { bob = sn * 0.7; roll = sn * 0.05; tilt = 0.24 + Math.sin(ph + 0.8) * 0.08; nod = 0.2 + Math.sin(ph + 1.6) * 0.05; hyaw = Math.sin(ph) * 0.12;
      hands = [[10 + sn * 0.8, 1.5, -8 + cs * 0.8], [11 - sn * 0.8, -1, -9 - cs * 0.6]]; }
    else if (sti === 'walk') {
      // an uneven, limping gait: the near leg strides, the far one drags; the body lurches over the good leg
      legs = [[sn * 0.62, Math.max(0, cs) * 5.5], [-sn * 0.3, Math.max(0, -cs) * 1.4]];
      bob = Math.max(0, cs) * 2.4 + Math.max(0, -cs) * 0.5; roll = sn * 0.13; hunch = 0.48 + Math.max(0, -cs) * 0.06;
      tilt = 0.22 + Math.sin(ph - 0.6) * 0.12; nod = 0.16 + Math.sin(ph * 2 - 0.5) * 0.06; hyaw = Math.sin(ph - 0.4) * 0.1;
      hands = [[15 + sn * 2.4, 2, 1.5 + Math.sin(ph + 0.5) * 1.4], [14 - sn * 2, -2, 0.5 + Math.sin(ph + 2) * 1.2]];
    } else if (sti === 'sprint') {
      legs = [[sn * 0.88, Math.max(0, cs) * 7], [-sn * 0.88, Math.max(0, -cs) * 7]];
      bob = Math.abs(Math.sin(ph)) * 2.2; roll = sn * 0.08; hunch = 0.82; nod = -0.05; tilt = 0.08 + sn * 0.05; ff = 3;
      hands = [[-7 + sn * 2.5, 4, 3 + cs * 2], [-6 - sn * 2.5, 4, 2 - cs * 2]];
    } else if (sti === 'atk') {
      // both claws raised back, then raked down and forward with a lunge, then a slow recovery
      const w = u < 0.34 ? A.lerp(0, 1, Math.sin(u / 0.34 * Math.PI / 2)) : u < 0.46 ? 1 - (u - 0.34) / 0.12 : 0;
      const h = u < 0.34 ? 0 : u < 0.5 ? (u - 0.34) / 0.16 : Math.max(0, 1 - (u - 0.5) / 0.5);
      hunch = 0.42 - w * 0.32 + h * 0.3; ff = -w * 2 + h * 6; nod = 0.18 - w * 0.25 + h * 0.2; tilt = 0.2 - w * 0.1;
      hands = [0, 1].map(i => { const d = i * 0.08; const w2 = cl(w - d), h2 = cl(h - d); return [lerp(lerp(12, 2, w2), 20, h2), lerp(1.5, 7, w2) * (1 - h2 * 0.4), lerp(lerp(-4, 17, w2), -9, h2)]; });
      legs = [[h * 0.35 - w * 0.15, 0], [-h * 0.25, 0]];
    } else if (sti === 'rise') {
      // clawing up out of the ground: arms high, head bowed, then settling into the stance
      const e = sstep(0.35, 1, u); hunch = lerp(0.62, 0.42, e); nod = lerp(0.55, 0.18, e); tilt = lerp(0.05, 0.22, e);
      hands = [0, 1].map(i => { const rr = Math.sin(u * 9 + i * 1.7) * (1 - e); return [lerp(5, 11, e) + rr, lerp(5.5, 1.5, e), lerp(19 + rr * 1.5, -7, e)]; });
      legs = [[0.25 * (1 - e), 0], [-0.2 * (1 - e), 0]];
    } else if (sti === 'boom') {
      swell = 1 + 0.26 * u; hunch = lerp(0.42, 0.05, u); nod = lerp(0.18, -0.35, u); tilt = 0.05; bob = u * 2;
      hands = [[4, 9 + u * 6, 6 + u * 6], [4, 9 + u * 6, 6 + u * 6]];
      const j = Math.sin(u * 60) * 0.6 * u; ff = j;
    }
    // ---- the body ----
    const B = [ff * 0.5 - hunch * 2, 0, 20.5 + bob], BA = [11.5 * swell, 13 * swell, 12.5 * swell], TB = A.basis(0, -hunch * 0.7, roll);
    const at = (f, s, h) => add(B, add(add(mul(TB[0], f), mul(TB[1], s)), mul(TB[2], h)));
    // legs: short and stout, the knees bent forward; flat clawed feet
    [1, -1].forEach((q, i) => {
      const hip = [B[0] - 1.5, q * 6.4, 11.5], L = legs[i], foot = A.leg(hip, 11.5, L[0], L[1], 1, 4.4, 3.6, skin);
      ell([foot[0] + 2, foot[1], foot[2] + 1.9], [4.8, 3.7, 2.4], Object.assign({}, skin, { col: '#3E3A4C', shade: '#24202E', hi: GREY }));
      [-1, 1].forEach(tq => { const tb = [foot[0] + 5.6, foot[1] + tq * 1.6, foot[2] + 1.2]; tube([tb, [tb[0] + 2.4, tb[1] + tq * 0.4, tb[2] - 0.8]], v => lerp(1.1, 0.3, v), { col: CLAW, shade: CLAWSH, hi: '#F2ECF6', line: ZINK }); });
    });
    // a short ragged tail
    const tw = Math.sin(ph * (sti === 'walk' ? 1 : 1) + 1) * 2;
    tube([at(-10, 0, -5), at(-15, tw * 0.5, -3), at(-17.5, tw, 1.5)], v => lerp(3, 1.1, v), Object.assign({}, skin, { z: 4 }));
    // the torso: hunched, grey with bruised patches and a stitched belly where the purple pulse shows through
    ell(B, BA, Object.assign({ B: TB, spec: T3 ? 0.22 : false, specR: 0.12 }, skin, {
      inner: c => {
        // bruises and cracks painted onto the torso surface
        const pb = P(at(2, 8, 6)); c.fillStyle = rgba(BRU, 0.55); c.beginPath(); c.ellipse(pb[0], pb[1], 4.5 * u0, 3 * u0, 0.4, 0, TAU); c.fill();
        if (T2) { const pb2 = P(at(-3, -9, -2)); c.fillStyle = rgba(BRU, 0.45); c.beginPath(); c.ellipse(pb2[0], pb2[1], 3.6 * u0, 2.6 * u0, -0.3, 0, TAU); c.fill(); }
        const cp = [at(3, 10, 9), at(5, 8.5, 5), at(4, 9.5, 2), at(6, 7.5, -2)].map(P);
        c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = SOCK; c.lineWidth = 1.6 * u0; c.beginPath(); cp.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
        c.strokeStyle = cr ? ACC : rgba(EDGE, T3 ? 0.75 : 0.5); c.lineWidth = (cr ? 1 : 0.7) * u0; c.stroke();
      } }));
    // the belly: a paler patch sewn on with a seam of cross stitches
    const BC = at(9.6 * swell, 0, -2.5);
    ell(BC, [3.8 * swell, 8.5 * swell, 8.6 * swell], { B: TB, col: BEL, shade: BELSH, hi: BELHI, line: ZINK, glowCol: ENERGY, glowA: 0.18, z: -1 });
    mark(add(BC, mul(TB[0], 3.7 * swell)), TB[0], 8 * swell, (c, r) => {
      c.lineCap = 'round'; c.strokeStyle = ZINK; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(r * 0.05, -r * 0.82); c.quadraticCurveTo(-r * 0.12, 0, r * 0.06, r * 0.8); c.stroke();
      if (T2 || cr) { c.strokeStyle = cr ? ACC : rgba(EDGE, 0.75); c.lineWidth = r * 0.05; c.stroke(); }
      c.strokeStyle = '#C9BED2'; c.lineWidth = r * 0.07; for (let i = 0; i < 5; i++) { const y = -r * 0.62 + i * r * 0.31, x = -0.03 * r + Math.sin(i) * r * 0.03; c.beginPath(); c.moveTo(x - r * 0.24, y - r * 0.08); c.lineTo(x + r * 0.24, y + r * 0.08); c.stroke(); }
    }, -1.2);
    out.belly = P(add(BC, mul(TB[0], 3.2 * swell)));
    // arms: short, reaching, three pale claws on each hand; a bandage round the far forearm (Adept)
    const SH = [1, -1].map(q => at(3.5, q * 11.5 * swell, 5.5));
    [1, -1].forEach((q, i) => {
      const s0 = SH[i], hd = add(s0, [hands[i][0], q * hands[i][1], hands[i][2]]), el = add(mix3(s0, hd, 0.5), [-1.5, q * 2.2, -2.2]);
      tube([s0, el, hd], v => lerp(4, 3, v), Object.assign({}, skin, { d2: 0.36 }));
      if (T2 && q < 0) tube([mix3(el, hd, 0.15), mix3(el, hd, 0.75)], () => 3.35, { col: BAND, shade: BANDSH, hi: '#CFC6D6', line: ZINK, inner: c => { const a = P(mix3(el, hd, 0.25)), b = P(mix3(el, hd, 0.65)); c.strokeStyle = rgba(BANDSH, 0.9); c.lineWidth = 0.9 * u0; for (let j = 0; j < 3; j++) { const m = [lerp(a[0], b[0], j / 2), lerp(a[1], b[1], j / 2)]; c.beginPath(); c.moveTo(m[0] - 2.5 * u0, m[1] - 3 * u0); c.lineTo(m[0] + 2.5 * u0, m[1] + 3 * u0); c.stroke(); } } });
      ell(hd, [3.6, 3.3, 3], Object.assign({}, skin));
      const dir = A.norm(sub(hd, el)); [-1, 0, 1].forEach(j => { const side = [-dir[1], dir[0], 0], b = add(hd, add(mul(dir, 2.4), mul(side, j * 1.6))), tp = add(b, add(mul(dir, 4.2), [0, 0, -1.6 - Math.abs(j) * 0.5])); tube([b, mix3(b, tp, 0.5), tp], v => lerp(1.35, 0.25, v), { col: CLAW, shade: CLAWSH, hi: '#F2ECF6', line: ZINK }); });
      if (i === 0) out.hand = P(hd); else out.hand2 = P(hd);
    });
    // ---- the head: big and round (a Cocopet's), lolling, with ragged ears ----
    const hr = 14.6 * swell, HC = add(at(4 + hunch * 4, 0, 14), [ff * 0.3 + hunch * 4, 0, 6.5 - hunch * 3]), F = frame(HC, hyaw, nod, tilt), ah = F.at;
    // ears: the near one upright and torn, the other drooping with a bite out of it
    [1, -1].forEach(q => {
      const up = q > 0, b1 = ah(-hr * 0.02, q * hr * 0.2, hr * 0.88), b2 = ah(-hr * 0.12, q * hr * 0.9, hr * 0.36);
      const tip = up ? ah(-hr * 0.12, q * hr * 0.92, hr * 1.42) : ah(hr * 0.22, q * hr * 1.42, hr * 0.12);
      const e = (a, b, v, o2) => add(mix3(a, b, v), F.dir(0, q * o2 * hr, o2 * hr * 0.4));
      const pts = up ? [b1, e(b1, tip, 0.35, 0.06), e(b1, tip, 0.5, -0.05), e(b1, tip, 0.62, 0.05), tip, e(tip, b2, 0.3, 0.02), e(tip, b2, 0.45, -0.08), e(tip, b2, 0.58, 0.02), b2]
        : [b1, e(b1, tip, 0.45, 0.05), e(b1, tip, 0.75, 0.02), tip, e(tip, b2, 0.22, -0.02), e(tip, b2, 0.32, -0.14), e(tip, b2, 0.46, -0.02), b2];
      blob(pts, Object.assign({}, skin, { sharp: true, z: 2.5 }));
      const ib = mix3(b1, b2, 0.5), it = mix3(ib, tip, 0.7), ic = mix3(ib, tip, 0.35); blob([mix3(b1, ic, 0.45), mix3(mix3(b1, tip, 0.5), ic, 0.45), it, mix3(mix3(b2, tip, 0.5), ic, 0.45), mix3(b2, ic, 0.45)], { col: BRU, shade: '#3D2552', hi: false, line: false, sharp: true, z: 2.2 });
      if (T2 && !up) tube([e(b1, tip, 0.25, 0), e(b2, tip, 0.25, 0)], () => 2, { col: BAND, shade: BANDSH, hi: '#CFC6D6', line: ZINK, z: 2 });
    });
    ell(HC, [hr * 0.96, hr * 1.04, hr * 0.9], Object.assign({ B: F.B, spec: T3 ? 0.35 : 0.12, specR: 0.12 }, skin, {
      inner: c => {
        // bruising, a crack across the crown, a stitched scalp (Adept)
        const pb = P(ah(hr * 0.35, -hr * 0.62, hr * 0.18)); c.fillStyle = rgba(BRU, 0.5); c.beginPath(); c.ellipse(pb[0], pb[1], 5.5 * u0, 3.8 * u0, -0.5, 0, TAU); c.fill();
        if (T2) { const pb2 = P(ah(-hr * 0.1, hr * 0.6, hr * 0.5)); c.fillStyle = rgba(BRU, 0.42); c.beginPath(); c.ellipse(pb2[0], pb2[1], 4 * u0, 3 * u0, 0.6, 0, TAU); c.fill(); }
        const cp = [ah(hr * 0.1, hr * 0.25, hr * 0.92), ah(hr * 0.35, hr * 0.38, hr * 0.78), ah(hr * 0.42, hr * 0.62, hr * 0.55), ah(hr * 0.62, hr * 0.6, hr * 0.32), ah(hr * 0.66, hr * 0.74, hr * 0.12)].map(P);
        c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = SOCK; c.lineWidth = 1.7 * u0; c.beginPath(); cp.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
        c.strokeStyle = cr ? ACC : rgba(EDGE, T3 ? 0.8 : 0.55); c.lineWidth = (cr ? 1.1 : 0.75) * u0; c.stroke();
        if (T3 || cr) { const br = [ah(hr * 0.42, hr * 0.62, hr * 0.55), ah(hr * 0.3, hr * 0.8, hr * 0.38)].map(P); c.beginPath(); c.moveTo(br[0][0], br[0][1]); c.lineTo(br[1][0], br[1][1]); c.stroke(); }
        if (T2) { const sp = [ah(-hr * 0.55, -hr * 0.2, hr * 0.78), ah(-hr * 0.1, -hr * 0.3, hr * 0.92), ah(hr * 0.35, -hr * 0.28, hr * 0.85)].map(P); c.strokeStyle = ZINK; c.lineWidth = 1.2 * u0; c.beginPath(); sp.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
          c.strokeStyle = '#C9BED2'; c.lineWidth = 0.8 * u0; for (let j = 0; j < 4; j++) { const v = j / 3, p = j < 2 ? [lerp(sp[0][0], sp[1][0], v * 2), lerp(sp[0][1], sp[1][1], v * 2)] : [lerp(sp[1][0], sp[2][0], v * 2 - 1), lerp(sp[1][1], sp[2][1], v * 2 - 1)]; c.beginPath(); c.moveTo(p[0] - 1.6 * u0, p[1] - 1.8 * u0); c.lineTo(p[0] + 1.6 * u0, p[1] + 1.8 * u0); c.stroke(); } }
      } }));
    // the face: sunken sockets with dim violet eyes (one drooping), a stitched grin with one tooth
    out.eyes = [];
    [1, -1].forEach(q => {
      const ep = ah(hr * 0.8, q * hr * 0.37, hr * 0.06), big = q > 0;
      const m = mark(ep, F.dir(0.82, q * 0.5, 0.12), 4.8, (c, r) => {
        c.fillStyle = SOCK; c.beginPath(); c.ellipse(0, 0, r * (big ? 1.05 : 0.92), r * (big ? 0.95 : 0.8), big ? 0.1 : -0.2, 0, TAU); c.fill();
        c.fillStyle = rgba(PLUM, 0.9); c.beginPath(); c.ellipse(0, r * 0.12, r * 0.62, r * 0.55, 0, 0, TAU); c.fill();
        c.fillStyle = '#8F62D8'; c.beginPath(); c.arc(r * 0.05, r * 0.12, r * 0.3, 0, TAU); c.fill();
        c.fillStyle = '#E4D6FF'; c.beginPath(); c.arc(r * 0.12, r * 0.02, r * 0.11, 0, TAU); c.fill();
        if (!big) { c.fillStyle = GSH; c.beginPath(); c.moveTo(-r * 1.1, -r * 0.95); c.lineTo(r * 1.1, -r * 0.95); c.lineTo(r * 1.0, -r * 0.05); c.quadraticCurveTo(0, r * 0.15, -r * 1.0, -r * 0.35); c.closePath(); c.fill(); c.strokeStyle = ZINK; c.lineWidth = r * 0.16; c.beginPath(); c.moveTo(r * 1.0, -r * 0.05); c.quadraticCurveTo(0, r * 0.15, -r * 1.0, -r * 0.35); c.stroke(); }
        c.strokeStyle = ZINK; c.lineWidth = r * 0.14; c.beginPath(); c.ellipse(0, 0, r * (big ? 1.05 : 0.92), r * (big ? 0.95 : 0.8), big ? 0.1 : -0.2, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      });
      if (m) { const pe = P(ep); out.eyes.push([pe[0], pe[1], big ? 1 : 0.7]); }
    });
    mark(ah(hr * 0.88, -hr * 0.02, -hr * 0.4), F.dir(0.85, 0, -0.45), 6.4, (c, r) => {
      c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = SOCK; c.lineWidth = r * 0.16; c.beginPath(); c.moveTo(-r * 0.95, -r * 0.1); c.lineTo(-r * 0.5, r * 0.12); c.lineTo(-r * 0.15, -r * 0.02); c.lineTo(r * 0.2, r * 0.16); c.lineTo(r * 0.55, 0); c.lineTo(r * 0.9, r * 0.12); c.stroke();
      c.fillStyle = '#E8E0EE'; c.beginPath(); c.moveTo(r * 0.12, r * 0.12); c.lineTo(r * 0.36, r * 0.06); c.lineTo(r * 0.24, r * 0.48); c.closePath(); c.fill(); c.strokeStyle = ZINK; c.lineWidth = r * 0.06; c.stroke();
      c.strokeStyle = '#C9BED2'; c.lineWidth = r * 0.07; [-0.7, -0.32, 0.38, 0.72].forEach(x => { c.beginPath(); c.moveTo(r * x, -r * 0.24); c.lineTo(r * x + r * 0.04, r * 0.3); c.stroke(); });
    });
    out.head = P(HC); out.hr = hr * u0;
  };
  Anima3D.MODELS.cocozombie.yaw = 0.42;

  /* ---- the frame cache: every pose rendered once per animation frame, per facing, per crack brightness ---- */
  const NF = { idle: 8, walk: 12, sprint: 8, atk: 8, rise: 8, boom: 5 }, LOOP = { idle: 1, walk: 1, sprint: 1 };
  const FRM = new Map();
  function zFrame(tier, sti, i, fk, crack, hpx) {
    const key = `${tier}|${sti}|${i}|${fk}|${crack}|${hpx}`; let f = FRM.get(key); if (f) return f;
    const W = Math.ceil(hpx * 1.9), Hh = Math.ceil(hpx * 1.6), cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    const g = cv.getContext('2d'), ox = W / 2, oy = Math.round(Hh * 0.84), out = {}, u = LOOP[sti] ? i / NF[sti] : i / (NF[sti] - 1);
    Anima3D.draw(g, 'cocozombie', tier, ox, oy, hpx * 110 / ZU, 0, { fk, st: sti, u, crack, out });
    f = { cv, ox, oy, hpx, out }; if (FRM.size > 1200) FRM.clear(); FRM.set(key, f); return f;
  }
  const frameIdx = (sti, u) => LOOP[sti] ? ((Math.floor(u * NF[sti]) % NF[sti]) + NF[sti]) % NF[sti] : Math.min(NF[sti] - 1, Math.max(0, Math.round(cl(u) * (NF[sti] - 1))));

  /* ---- cached soft sprites ---- */
  const SPR = new Map();
  function spr(key, w, h, paint) { let cv = SPR.get(key); if (cv) return cv; cv = document.createElement('canvas'); cv.width = w; cv.height = h; paint(cv.getContext('2d'), w, h); SPR.set(key, cv); return cv; }
  const radial = (key, stops) => spr(key, 128, 128, (x, w) => { const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(s => gr.addColorStop(s[0], s[1])); x.fillStyle = gr; x.fillRect(0, 0, w, w); });
  const holeSpr = () => radial('hole', [[0, rgba(VOID, 0.85)], [0.45, rgba(BODY, 0.7)], [0.75, rgba(PLUM, 0.3)], [1, rgba(PLUM, 0)]]);
  const shadowSpr = () => radial('shad', [[0, 'rgba(6,3,12,0.55)'], [0.6, 'rgba(6,3,12,0.3)'], [1, 'rgba(6,3,12,0)']]);
  const mistSpr = () => radial('mist', [[0, rgba(SMOKE, 0.55)], [0.5, rgba(PLUM, 0.32)], [1, rgba(PLUM, 0)]]);
  const smokeSpr = () => radial('smk', [[0, rgba(BODY, 0.8)], [0.55, rgba(PLUM, 0.5)], [1, rgba(SMOKE, 0)]]);
  const ringSpr = () => radial('ring', [[0, rgba(PLUM, 0)], [0.62, rgba(PLUM, 0)], [0.8, rgba(BODY, 0.55)], [0.9, rgba(PLUM, 0.35)], [1, rgba(PLUM, 0)]]);
  const ringLitSpr = () => radial('ringl', [[0, rgba(EDGE, 0)], [0.74, rgba(EDGE, 0)], [0.88, rgba(EDGE, 0.7)], [0.94, rgba(ACC, 0.5)], [1, rgba(EDGE, 0)]]);
  // the rising mask: a soft band that erases what is below the ground line
  const fadeSpr = () => spr('fade', 4, 64, (x) => { const gr = x.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); x.fillStyle = gr; x.fillRect(0, 0, 4, 64); });
  let scratch = null;
  function glow(c, x, y, r, col, a) { if (r < 0.5 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function blit(c, cv, x, y, w, h, a) { if (!(a > 0.01) || w < 0.5) return; c.globalAlpha = Math.min(1, a); c.drawImage(cv, x - w / 2, y - h / 2, w, h); c.globalAlpha = 1; }

  /* ================= Thriller ================= */
  U.thriller = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, N = TUNE.counts[ev - 1], K = C.K || 1, evoK = 1 + 0.08 * (ev - 1);
    const ACT0 = TUNE.form, ACT1 = ACT0 + TUNE.combat, RUSHEND = ACT1 + TUNE.rushMax, BOOM = TUNE.boomK * C.base * K * evoK, BR = TUNE.boomR * K;
    const casterST = H.X.ST ? H.X.ST() : null;
    H.X.banner('THRILLER', '', '#B98CFF', 1.4); H.X.sfx.hum(); H.X.shake(4, 0.3);
    // the summon spots: a loose ring round the caster on walkable floor, apart from one another
    const Z = [], spots = [];
    for (let i = 0; i < N; i++) {
      let best = null;
      for (let k = 0; k < 14 && !best; k++) {
        const a = (i / N) * TAU + (R1(i * 7.3 + k) - 0.5) * 0.7 + k * 0.45, r = 1.35 + R1(i * 3.1 + k * 1.7) * 1.1 + (k > 6 ? 0.6 : 0);
        const p = H.walk(me.x + Math.cos(a) * r, me.y + Math.sin(a) * r * 0.82);
        if (spots.every(s => Math.hypot(s.x - p.x, s.y - p.y) > 0.55) && Math.hypot(p.x - me.x, p.y - me.y) > 0.6) best = p;
      }
      if (!best) best = H.walk(me.x + (R1(i) - 0.5) * 2, me.y + (R1(i + 9) - 0.5) * 2);
      spots.push(best);
      Z.push({ i, x: best.x, y: best.y, r: 0.2, mv: 0, st: 'wait', u: 0, riseAt: 0.12 + (i / Math.max(1, N - 1)) * 0.22 + R1(i * 5.7) * 0.06, ph: R1(i * 2.2), phSp: 1 / (0.86 + R1(i * 4.4) * 0.22),
        fk: Math.cos((i / N) * TAU) >= 0 ? 1 : -1, tgt: null, retT: 0, q: [], atk: null, cool: 0, auto: 0.4 + R1(i * 5.7) * 0.6, crack: 0, alpha: 1, eyes: 0, boomed: false, slotA: (i / N) * TAU, slotR: 1.5 + (i % 3) * 0.45,
        pulse: R1(i * 9.1) * TAU, lastX: best.x, lastY: best.y, prog: 0, progT: 0, detour: 0, lunge: 0, trail: [], brT: 0, idleU: R1(i * 1.3), mist: R1(i * 6.6) * TAU });
    }
    const fxv = [];   // short-lived visuals: holes, slashes, trails, explosion rings
    for (const z of Z) fxv.push({ kind: 'hole', x: z.x, y: z.y, t0: z.riseAt - 0.3, life: 1.9, seed: z.i, cracks: Array.from({ length: 5 + tier * 2 }, (_, j) => ({ a: j / (5 + tier * 2) * TAU + R1(z.i * 3 + j) * 0.6, l: 0.45 + R1(z.i + j * 1.9) * 0.4 + tier * 0.05 })) });
    let busy = false, lastN = 0, unsub = null, ended = false, rushed = false, closed = false;
    const F = H.add({ thriller: true, life: RUSHEND + 3, x: me.x, y: me.y, Z, fxv, echoes: 0, swings: 0, hits: 0, booms: 0, N, ACT0, ACT1, RUSHEND, tier, update, draw, drawUnder, onEnd });
    F.unsub = () => { if (unsub) { unsub(); unsub = null; } };
    const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj && !(m.boss && (m.act === 'enter' || m.act === 'sleep'));
    const living = () => H.living().filter(valid);
    /* the hook: once per normal-attack action of the caster, each fighting zombie queues one echo of that action */
    function onNormal(evn) {
      if (busy) return;   // (never re-entered: zombie blows are not normal attacks, but refuse any loop all the same)
      if (ended || !H.fx.includes(F)) { F.unsub(); return; }
      busy = true;
      try {
        if (casterST && H.X.ST && H.X.ST() !== casterST) return;   // the caster switched out: its army echoes only it
        if (F.t < ACT0 || F.t >= ACT1 || !(evn && evn.dmg > 0)) return;
        F.echoes++; lastN = evn.dmg;
        const aimT = evn.A && evn.A.t;
        for (const z of Z) if (z.st === 'fight') { z.q.push({ dmg: evn.dmg * TUNE.echoK, at: F.t + 0.015 * (z.i % 4) + R1(F.echoes * 3.3 + z.i) * 0.07, exp: F.t + TUNE.echoLapse, aim: aimT }); if (z.q.length > 10) z.q.shift(); }
      } finally { busy = false; }
    }
    unsub = H.X.onNormal ? H.X.onNormal(onNormal) : null;
    function onEnd() { ended = true; F.unsub(); }
    /* ---- the AI ---- */
    function pickTarget(z, hint) {
      let best = null, bs = 1e9;
      for (const m of living()) {
        const dp = Math.hypot(m.x - me.x, m.y - me.y); if (dp > TUNE.leash + m.r) continue;
        let load = 0; for (const o of Z) if (o !== z && o.tgt === m && o.st === 'fight') load++;
        const s = Math.hypot(m.x - z.x, m.y - z.y) + load * 0.7 - (m === hint ? 0.8 : 0) + (m.boss ? -0.4 : 0);
        if (s < bs) { bs = s; best = m; }
      }
      return best;
    }
    function step(z, gx, gy, spd, dt) {
      const dx = gx - z.x, dy = gy - z.y, d = Math.hypot(dx, dy); if (d < 0.08) return 0;
      const s = Math.min(d, spd * dt); H.X.moveEnt(z, dx / d * s, dy / d * s, 0); if (Math.abs(dx) > 0.06) z.fk = dx > 0 ? 1 : -1; return s;
    }
    function separate(z) { for (const o of Z) { if (o === z || o.st === 'gone' || o.st === 'wait') continue; const dx = z.x - o.x, dy = z.y - o.y, d = Math.hypot(dx, dy); if (d < 0.46 && d > 1e-3) H.X.moveEnt(z, dx / d * (0.46 - d) * 0.5, dy / d * (0.46 - d) * 0.5, 0); } }
    function strike(z, m) {
      // the blow: 100% of the echoed normal attack, Dark, through the combat system, once
      const it = z.q.shift(); z.atk = { u: 0, m, dmg: it.dmg, hit: false }; z.cool = 0.09; z.fk = m.x >= z.x ? 1 : -1; F.swings++;
    }
    function landHit(z) {
      const A = z.atk; let m = A.m;
      if (!valid(m) || Math.hypot(m.x - z.x, m.y - z.y) > m.r + TUNE.reach + 0.35) { m = null; for (const o of living()) if (Math.hypot(o.x - z.x, o.y - z.y) <= o.r + TUNE.reach + 0.2) { m = o; break; } }
      if (!m) { z.q.unshift({ dmg: A.dmg, at: F.t, exp: F.t + 1, aim: null }); return; }   // (the target died mid-swing and no one else is in reach: the echo waits)
      H.X.hitMon(m, A.dmg, C.dmgO({ src: 'summon' })); F.hits++;
      const a = Math.atan2(m.y - z.y, m.x - z.x);
      fxv.push({ kind: 'slash', x: m.x, y: m.y, a: (z.fk > 0 ? -0.7 : 0.7) + (R1(F.hits) - 0.5) * 0.5, t0: F.t, life: 0.28, s: 0.55 + m.r * 0.6, fk: z.fk });
      if (tier >= 2) fxv.push({ kind: 'trail', x: z.x, y: z.y, x2: m.x, y2: m.y, t0: F.t, life: 0.32, bend: (R1(F.hits * 1.7) - 0.5) * 0.8 });
      H.burst(m.x, m.y - 0.35, 'spark', 4 + tier, { v: 4, life: 0.35, size: 2.4, color: [EDGE, ACC, ENERGY] });
      if (!lowFx()) H.P({ kind: 'smoke', x: m.x + Math.cos(a) * 0.2, y: m.y - 0.3, vx: Math.cos(a) * 0.8, vy: -0.6, life: 0.45, max: 0.45, size: 0.22, color: 'rgba(43,11,69,' });
      if (F.hits % 3 === 0) H.X.sfx.whoosh();
    }
    function detonate(z) {
      if (z.boomed) return; z.boomed = true; F.booms++; z.st = 'gone';
      H.hitArea(z.x, z.y, BR, BOOM, C.dmgO({ kb: 3 }));
      fxv.push({ kind: 'boom', x: z.x, y: z.y, t0: F.t, life: 1.1, seed: z.i });
      H.burst(z.x, z.y - 0.4, 'shard', 10 + tier * 3, { v: 6, life: 0.7, size: 5, g: 6, up: 2.5, color: [PLUM, SMOKE, BODY, '#4F4A5E'] });
      H.burst(z.x, z.y - 0.4, 'spark', 12 + tier * 4, { v: 7, life: 0.5, size: 2.6, color: [EDGE, ACC, ENERGY] });
      for (let i = 0; i < H.n(6 + tier * 2); i++) { const a = i / 8 * TAU + R1(z.i + i) , v = 1.2 + R1(i * 3 + z.i) * 1.5; H.P({ kind: 'smoke', x: z.x + Math.cos(a) * 0.3, y: z.y - 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 0.8, life: 0.9, max: 0.9, size: 0.45 + R1(i) * 0.3, color: 'rgba(24,11,46,' }); }
      H.X.shake(5 + tier, 0.18); H.X.light && H.X.light(z.x, z.y, 3.2, 0.35); (F.booms % 2 ? H.X.sfx.crash : H.X.sfx.thud)();
    }
    function dissolve(z) { if (z.st === 'gone' || z.st === 'fade') return; z.st = 'fade'; z.fadeT = 0; z.q.length = 0; z.atk = null; }
    function endAll() { if (closed) return; closed = true; F.unsub(); for (const z of Z) { if (z.st === 'wait') z.st = 'gone'; else dissolve(z); } }
    function resurface(z) {
      const a = z.slotA + F.t * 0.2, p = H.walk(me.x + Math.cos(a) * 1.4, me.y + Math.sin(a) * 1.1);
      z.x = p.x; z.y = p.y; z.st = 'rise'; z.u = 0.35; z.tgt = null; z.q.length = 0;
      fxv.push({ kind: 'hole', x: z.x, y: z.y, t0: F.t - 0.25, life: 1.3, seed: z.i + 50, cracks: Array.from({ length: 5 }, (_, j) => ({ a: j / 5 * TAU + R1(z.i * 3 + j + F.t) * 0.6, l: 0.5 })) });
    }
    function update(dt, f) {
      const ft = f.t;
      if (me.dead && !closed) endAll();
      // the expiry: at exactly the end of the combat phase the army stops attacking and the cracks brighten in a rolling sequence
      if (!rushed && ft >= ACT1 && !closed) {
        rushed = true; F.unsub();
        const order = Z.filter(z => z.st === 'fight' || z.st === 'rise').sort((a, b) => Math.atan2(a.y - me.y, a.x - me.x) - Math.atan2(b.y - me.y, b.x - me.x));
        order.forEach((z, j) => { z.st = 'brighten'; z.brT = j * Math.min(0.06, 0.45 / Math.max(1, order.length)); z.q.length = 0; z.atk = null; z.tgt = null; });
        H.X.sfx.hum();
      }
      if (rushed && ft >= RUSHEND && !closed) {
        // the bounded approach ends: whoever has not arrived detonates where it stands (if any monster remains) or dissolves
        const any = living().length > 0;
        for (const z of Z) if (z.st === 'brighten' || z.st === 'rush') { if (any) { z.st = 'boom'; z.u = 0; } else dissolve(z); }
        closed = true;
      }
      for (const z of Z) {
        z.cool -= dt; z.lunge = Math.max(0, z.lunge - dt * 4);
        if (z.st === 'wait') { if (ft >= z.riseAt) { z.st = 'rise'; z.u = 0; H.burst(z.x, z.y, 'shard', 3 + tier * 2, { v: 2.2, up: 3.5, g: 9, life: 0.6, size: 3.5, color: ['#3A3448', SMOKE, PLUM] }); if (z.i % 3 === 0) H.X.sfx.thud(); } continue; }
        if (z.st === 'rise') { z.u += dt / 0.85; z.eyes = sstep(0.72, 1, z.u); if (z.u >= 1) { z.u = 0; z.st = 'fight'; z.eyes = 1; z.retT = 0; } continue; }
        if (z.st === 'fade') { z.fadeT += dt; z.alpha = 1 - z.fadeT / 0.7; if (z.fadeT < dt * 1.5) H.burst(z.x, z.y - 0.4, 'smoke', 5, { v: 1.2, up: 0.8, life: 0.8, size: 0.4, color: 'rgba(43,11,69,' }); if (z.alpha <= 0) z.st = 'gone'; continue; }
        if (z.st === 'gone') continue;
        if (z.st === 'fight') {
          const dp = Math.hypot(me.x - z.x, me.y - z.y);
          if (dp > TUNE.regroup) { resurface(z); continue; }
          z.retT -= dt; if (!valid(z.tgt) || z.retT <= 0 || Math.hypot(z.tgt.x - me.x, z.tgt.y - me.y) > TUNE.leash + 2) { z.tgt = pickTarget(z, z.q.length ? z.q[0].aim : null); z.retT = 0.5; }
          // drop echoes that could not find anyone in time
          while (z.q.length && z.q[0].exp < ft) z.q.shift();
          const m = z.tgt; let gx, gy, moving = 0, spd = TUNE.walk;
          if (z.detour > 0) z.detour -= dt;
          if (m && z.detour <= 0 && ft >= ACT0) { const a = Math.atan2(z.y - m.y, z.x - m.x), rr = m.r + TUNE.reach * 0.55; gx = m.x + Math.cos(a) * rr; gy = m.y + Math.sin(a) * rr; }
          else { const a = z.slotA + Math.sin(ft * 0.3 + z.i) * 0.3; gx = me.x + Math.cos(a) * z.slotR + (me.vx || 0) * 0.3; gy = me.y + Math.sin(a) * z.slotR * 0.8 + (me.vy || 0) * 0.3; }
          if (dp > 6) spd *= 1.7;
          const gait = 0.55 + 0.6 * Math.max(0, Math.cos(z.ph * TAU));   // the limp: fast on the good leg, slow on the dragging one
          if (!z.atk || z.atk.u > 0.6) { const d0 = Math.hypot(gx - z.x, gy - z.y); if (d0 > 0.12) { const s = step(z, gx, gy, spd * gait, dt); moving = 1; z.prog += s; } }
          z.progT += dt; if (z.progT > 0.7) { if (moving && z.prog < 0.12 * spd * z.progT && m) z.detour = 1.1; z.prog = 0; z.progT = 0; }
          separate(z);
          z.ph += dt * z.phSp * (moving ? 1 : 0); z.idleU += dt * 0.6;
          z.anim = moving ? 'walk' : 'idle';
          // they also attack on their own: every ~1 s a zombie with someone in reach queues a blow of its own
          z.auto -= dt;
          if (z.auto <= 0 && ft >= ACT0 && ft < ACT1 && !z.q.length) {
            const tm0 = valid(m) && Math.hypot(m.x - z.x, m.y - z.y) <= m.r + TUNE.reach + 0.35 ? m : null;
            if (tm0) { z.q.push({ dmg: (lastN || C.base * K * evoK * TUNE.autoK) * TUNE.echoK, at: ft, exp: ft + 0.8, aim: null }); z.auto = TUNE.autoT[0] + R1(ft * 7.1 + z.i) * (TUNE.autoT[1] - TUNE.autoT[0]); }
            else z.auto = 0.15;
          }
          // the attacks: one blow per queued echo, as soon as someone is in reach
          if (z.q.length && z.q[0].at <= ft && z.cool <= 0 && (!z.atk || z.atk.hit)) {
            let tm = valid(m) && Math.hypot(m.x - z.x, m.y - z.y) <= m.r + TUNE.reach ? m : null;
            if (!tm) for (const o of living()) if (Math.hypot(o.x - z.x, o.y - z.y) <= o.r + TUNE.reach) { tm = o; break; }
            if (tm) strike(z, tm);
          }
          if (z.atk) { z.atk.u += dt / 0.4; if (!z.atk.hit && z.atk.u >= 0.4) { z.atk.hit = true; z.lunge = 1; landHit(z); } if (z.atk.u >= 1) z.atk = null; }
          continue;
        }
        if (z.st === 'brighten') { z.brT -= dt; z.crack = sstep(0, 0.3, -z.brT); z.anim = 'idle'; z.idleU += dt * 1.6; if (z.brT < -0.32) { z.st = 'rush'; z.tgt = null; z.ph = 0; } continue; }
        if (z.st === 'rush') {
          z.crack = 1; if (!valid(z.tgt)) { let best = null, bd = 16; for (const o of living()) { const d = Math.hypot(o.x - z.x, o.y - z.y); if (d < bd) { bd = d; best = o; } } z.tgt = best; }
          if (!z.tgt) { dissolve(z); continue; }
          const m = z.tgt, d = Math.hypot(m.x - z.x, m.y - z.y);
          if (d <= m.r + 0.45) { z.st = 'boom'; z.u = 0; continue; }
          step(z, m.x, m.y, TUNE.sprint, dt); z.ph += dt * 2.6; z.anim = 'sprint';
          z.trail.unshift([z.x, z.y]); if (z.trail.length > 9) z.trail.length = 9;
          if (!lowFx() && Math.random() < 0.5) H.P({ kind: 'smoke', x: z.x, y: z.y - 0.1, vx: 0, vy: -0.4, life: 0.5, max: 0.5, size: 0.24, color: 'rgba(43,11,69,' });
          continue;
        }
        if (z.st === 'boom') { z.u += dt / 0.2; z.crack = 1; if (z.u >= 1) detonate(z); continue; }
      }
      for (let i = fxv.length - 1; i >= 0; i--) if (ft - fxv[i].t0 > fxv[i].life) fxv.splice(i, 1);
      // the army is spent: a short tail for the last visuals, then the effect ends
      if (Z.every(z => z.st === 'gone') && (rushed || closed)) { F.unsub(); f.life = Math.min(f.life, fxv.length ? 1.2 : 0.05); }
    }
    /* ---- drawing ---- */
    let hpx = 0;
    function petDim(X, Y, T) { const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45, d = Math.hypot(X - PX, Y - T * 0.45 - PY); return 0.3 + 0.7 * sstep(T * 0.3, T * 0.85, d); }
    function drawZombie(c, z, T, t, front) {
      if (z.st === 'wait' || z.st === 'gone') return;
      const X = H.sx(z.x), Y = H.sy(z.y), k = ZH * T / hpx;
      let sti = z.anim || 'idle', u = sti === 'walk' ? z.ph : sti === 'sprint' ? z.ph : z.idleU;
      if (z.st === 'rise') { sti = 'rise'; u = z.u; } else if (z.st === 'boom') { sti = 'boom'; u = z.u; } else if (z.atk) { sti = 'atk'; u = z.atk.u; }
      const cr = z.crack > 0.5 ? 1 : 0, fr = zFrame(tier, sti, frameIdx(sti, u), z.fk, 0, hpx), frB = z.crack > 0.02 ? zFrame(tier, sti, frameIdx(sti, u), z.fk, 1, hpx) : null;
      let a = z.alpha * (front ? petDim(X, Y, T) : 1);
      const lx = z.lunge * T * 0.16 * z.fk, x0 = X + lx;
      // mist at the feet (sparse), behind
      for (let j = 0; j < 2; j++) { const mp = z.mist + t * (0.5 + j * 0.3), mx = x0 + Math.sin(mp + j * 2) * T * 0.28, my = Y - T * 0.04 + Math.cos(mp * 0.7 + j) * T * 0.03, ms = T * (0.42 + 0.08 * Math.sin(mp * 1.3 + j)); blit(c, mistSpr(), mx, my, ms * 1.6, ms * 0.7, a * 0.6 * (z.st === 'rise' ? z.u : 1)); }
      const dw = fr.cv.width * k, dh = fr.cv.height * k, dx = x0 - fr.ox * k, dy = Y - fr.oy * k;
      if (z.st === 'rise') {
        // rising through the shadow: the figure drawn into a scratch canvas, everything below the ground line erased softly
        const e = 1 - Math.pow(1 - cl(z.u * 1.15), 2.2), sink = (1 - e) * ZH * T * 1.02;
        if (!scratch) scratch = document.createElement('canvas'); if (scratch.width !== fr.cv.width || scratch.height !== fr.cv.height) { scratch.width = fr.cv.width; scratch.height = fr.cv.height; }
        const g = scratch.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, scratch.width, scratch.height);
        const sk = sink / k; g.drawImage(fr.cv, 0, sk);
        g.globalCompositeOperation = 'destination-out'; const band = Math.max(3, fr.hpx * 0.07); g.drawImage(fadeSpr(), 0, fr.oy - band * 1.4, scratch.width, band * 2); g.fillRect(0, fr.oy + band * 0.6 - 1, scratch.width, scratch.height);
        g.globalCompositeOperation = 'source-over';
        c.globalAlpha = a; c.drawImage(scratch, dx, dy, dw, dh); c.globalAlpha = 1;
        // the eyes light last
        if (z.eyes > 0.01 && fr.out.eyes) for (const e of fr.out.eyes) { const exx = x0 + (e[0] - fr.ox) * k, eyy = Y + (e[1] - fr.oy) * k + sink; if (eyy < Y - T * 0.1) { glow(c, exx, eyy, T * 0.16 * e[2], EDGE, a * z.eyes * 0.9); glow(c, exx, eyy, T * 0.06 * e[2], ACC, a * z.eyes); } }
        return;
      }
      c.globalAlpha = a; c.drawImage(fr.cv, dx, dy, dw, dh);
      if (frB) { c.globalAlpha = a * cl(z.crack); c.drawImage(frB.cv, dx, dy, dw, dh); }
      c.globalAlpha = 1;
      // the living lights: the eyes, the slow pulse in the torso (the rush gathers it), the Celestial pulse in the cracks
      const O = fr.out, ex = p => x0 + (p[0] - fr.ox) * k, ey = p => Y + (p[1] - fr.oy) * k;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.6 + z.pulse), gather = z.st === 'brighten' || z.st === 'rush' || z.st === 'boom' ? 1 : 0;
      if (O.belly) glow(c, ex(O.belly), ey(O.belly), T * (0.32 + 0.1 * pulse + gather * (0.25 + (z.st === 'boom' ? z.u * 0.5 : 0))), gather ? EDGE : ENERGY, a * (0.22 + 0.22 * pulse + gather * 0.45) * (tier >= 3 ? 1.1 : 1));
      if (gather) glow(c, ex(O.belly), ey(O.belly), T * (0.12 + (z.st === 'boom' ? z.u * 0.35 : 0)), ACC, a * (0.5 + 0.3 * pulse));
      if (O.eyes) for (const e of O.eyes) { glow(c, ex(e), ey(e), T * 0.13 * e[2], EDGE, a * z.eyes * (0.55 + 0.25 * pulse + gather * 0.3)); glow(c, ex(e), ey(e), T * 0.05 * e[2], ACC, a * z.eyes * 0.7); }
      if (tier >= 3 && O.head && z.st === 'fight') { const v = (t * 0.7 + z.pulse) % 1; glow(c, ex(O.head) + T * 0.1 * z.fk + v * T * 0.08 * z.fk, ey(O.head) - O.hr * k * (0.75 - v * 0.9), T * 0.07, EDGE, a * 0.5 * Math.sin(v * Math.PI)); }
    }
    function drawFloor(c, T, t) {
      const ft = F.t;
      for (const v of fxv) {
        const lt = ft - v.t0; if (lt < 0) continue; const X = H.sx(v.x), Y = H.sy(v.y);
        if (v.kind === 'hole') {
          // a shallow shadow circle with violet cracks radiating, opening before the rise and closing after it
          const o = sstep(0, 0.3, lt) * (1 - sstep(v.life - 0.6, v.life, lt)), r = T * 0.62 * (0.5 + 0.5 * sstep(0, 0.35, lt));
          blit(c, holeSpr(), X, Y, r * 2, r * 2 * H.GY, o * 0.9);
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          for (const k of v.cracks) { const L = T * k.l * (0.4 + 0.6 * sstep(0.05, 0.4, lt)) * 0.8, a2 = k.a, x1 = X + Math.cos(a2) * r * 0.5, y1 = Y + Math.sin(a2) * r * 0.5 * H.GY, x2 = X + Math.cos(a2 + 0.25) * (r * 0.5 + L * 0.5), y2 = Y + Math.sin(a2 + 0.25) * (r * 0.5 + L * 0.5) * H.GY, x3 = X + Math.cos(a2 - 0.1) * (r * 0.5 + L), y3 = Y + Math.sin(a2 - 0.1) * (r * 0.5 + L) * H.GY;
            // (feathered: the outer half of each crack fades and thins toward its tip)
            c.strokeStyle = rgba(ENERGY, 0.4 * o); c.lineWidth = 2; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.lineWidth = 1.2; c.strokeStyle = rgba(ENERGY, 0.16 * o); c.beginPath(); c.moveTo(x2, y2); c.lineTo(x3, y3); c.stroke();
            c.strokeStyle = rgba(EDGE, 0.5 * o); c.lineWidth = 0.9; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = rgba(EDGE, 0.18 * o); c.lineWidth = 0.6; c.beginPath(); c.moveTo(x2, y2); c.lineTo(x3, y3); c.stroke(); }
          c.restore();
          glow(c, X, Y - T * 0.05, T * 0.55, ENERGY, 0.35 * o);
        } else if (v.kind === 'boom') {
          const u = lt / v.life, r = BR * T * (0.25 + 0.85 * (1 - Math.pow(1 - cl(u / 0.55), 3)));
          blit(c, ringSpr(), X, Y, r * 2.1, r * 2.1 * H.GY, 0.8 * (1 - sstep(0.3, 1, u)));
          c.save(); c.globalCompositeOperation = 'lighter'; blit(c, ringLitSpr(), X, Y, r * 2, r * 2 * H.GY, 0.75 * (1 - sstep(0.15, 0.85, u))); c.restore();
          glow(c, X, Y, BR * T * 0.7, ENERGY, 0.4 * (1 - sstep(0, 0.6, u)));
        }
      }
      // contact shadows
      for (const z of Z) { if (z.st === 'wait' || z.st === 'gone' || z.st === 'rise') continue; blit(c, shadowSpr(), H.sx(z.x), H.sy(z.y), T * 0.75, T * 0.75 * H.GY, z.alpha * 0.9); }
    }
    function warm(c, T) {
      const tr = c.getTransform(), sc = Math.max(0.5, Math.hypot(tr.a, tr.b));
      if (!hpx) hpx = Math.max(40, Math.min(168, Math.round(ZH * T * sc * 1.15 / 8) * 8));
    }
    function drawUnder(c, f, X0, Y0, T, t) {
      warm(c, T); drawFloor(c, T, t);
      const list = Z.filter(z => z.y < me.y - 0.02).sort((a, b) => a.y - b.y);
      for (const z of list) drawZombie(c, z, T, t, false);
    }
    function draw(c, f, X0, Y0, T, t) {
      warm(c, T);
      const list = Z.filter(z => z.y >= me.y - 0.02).sort((a, b) => a.y - b.y);
      for (const z of list) drawZombie(c, z, T, t, true);
      // the rush: a dark streak behind each sprinter along its real path
      for (const z of Z) if (z.st === 'rush' && z.trail.length > 2) {
        c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
        for (let i = 1; i < z.trail.length; i++) { const v = 1 - i / z.trail.length, p0 = z.trail[i - 1], p1 = z.trail[i]; c.strokeStyle = rgba(BODY, 0.45 * v); c.lineWidth = T * 0.3 * v; c.beginPath(); c.moveTo(H.sx(p0[0]), H.sy(p0[1]) - T * 0.35); c.lineTo(H.sx(p1[0]), H.sy(p1[1]) - T * 0.35); c.stroke(); }
        c.globalCompositeOperation = 'lighter'; for (let i = 1; i < z.trail.length; i++) { const v = 1 - i / z.trail.length, p0 = z.trail[i - 1], p1 = z.trail[i]; c.strokeStyle = rgba(EDGE, 0.4 * v); c.lineWidth = T * 0.05 * v; c.beginPath(); c.moveTo(H.sx(p0[0]), H.sy(p0[1]) - T * 0.4); c.lineTo(H.sx(p1[0]), H.sy(p1[1]) - T * 0.4); c.stroke(); }
        c.restore();
      }
      // claws, trails and the explosions' bodies
      const ft = F.t;
      for (const v of fxv) {
        const lt = ft - v.t0; if (lt < 0) continue; const u = lt / v.life, X = H.sx(v.x), Y = H.sy(v.y) - T * 0.4;
        if (v.kind === 'slash') {
          // three raking claw crescents: dark bodies with violet edges, tapering to points
          const s = v.s * T, o = 1 - sstep(0.35, 1, u), wipe = sstep(0, 0.3, u);
          c.save(); c.translate(X, Y); c.rotate(v.a); c.scale(v.fk, 1);
          for (let j = 0; j < 3; j++) { const oy = (j - 1) * s * 0.34, x0 = -s, x1 = -s + 2 * s * wipe;
            c.beginPath(); c.moveTo(x0, oy); c.quadraticCurveTo((x0 + x1) / 2, oy - s * 0.42 * wipe, x1, oy); c.quadraticCurveTo((x0 + x1) / 2, oy - s * 0.16 * wipe, x0, oy); c.closePath(); c.fillStyle = rgba(PLUM, 0.85 * o); c.fill();
            c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(EDGE, 0.75 * o); c.lineWidth = Math.max(1, T * 0.03); c.lineCap = 'round'; c.beginPath(); c.moveTo(x0 + s * 0.1, oy - s * 0.02); c.quadraticCurveTo((x0 + x1) / 2, oy - s * 0.4 * wipe, x1, oy); c.stroke(); c.globalCompositeOperation = 'source-over'; }
          c.restore(); glow(c, X, Y, T * 0.5, EDGE, 0.35 * o);
        } else if (v.kind === 'trail') {
          // (Adept) a dark wisp from the zombie's claw to the blow
          const o = 1 - u, sx = H.sx(v.x), sy = H.sy(v.y) - T * 0.45, mx = (sx + X) / 2 + (Y - sy) * v.bend * 0.3, my = (sy + Y) / 2 - T * 0.25 + (sx - X) * v.bend * 0.1;
          c.save(); c.lineCap = 'round'; for (let j = 0; j < 6; j++) { const a0 = j / 6, a1 = (j + 1) / 6, q = (p0, p1, p2, s) => (1 - s) * (1 - s) * p0 + 2 * (1 - s) * s * p1 + s * s * p2, w = Math.sin(a1 * Math.PI) * T * 0.12;
            c.strokeStyle = rgba(BODY, 0.45 * o); c.lineWidth = w; c.beginPath(); c.moveTo(q(sx, mx, X, a0), q(sy, my, Y, a0)); c.lineTo(q(sx, mx, X, a1), q(sy, my, Y, a1)); c.stroke(); }
          c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(EDGE, 0.35 * o); c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(mx, my, X, Y); c.stroke(); c.restore();
        } else if (v.kind === 'boom') {
          // the burst: a violet-white core, a dark smoke ball breaking up, a low ring of shadow (on the floor, under)
          const R0 = BR * T;
          c.save(); c.globalCompositeOperation = 'source-over';
          for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + v.seed, d = R0 * 0.45 * sstep(0, 0.7, u), s = R0 * (0.55 + 0.25 * (j % 2)) * (0.6 + 0.6 * sstep(0, 0.5, u)); blit(c, smokeSpr(), X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.6 - R0 * 0.2 * u, s, s * 0.85, 0.75 * (1 - sstep(0.25, 1, u))); }
          c.restore();
          glow(c, X, Y, R0 * (0.5 + 0.6 * u), EDGE, 0.75 * (1 - sstep(0, 0.45, u)));
          glow(c, X, Y, R0 * 0.32 * (1 - u * 0.5), ACC, 0.95 * (1 - sstep(0, 0.25, u)));
        }
      }
    }
    return F;
  };
  U.thriller.tune = TUNE;
  /* (harness) the model alone: Anima3D.draw of one pose, feet at (x, y), hpx px tall; and the frame cache's size */
  U.thriller.drawModel = (c, tier, x, y, hpx, o) => Anima3D.draw(c, 'cocozombie', tier, x, y, hpx * 110 / ZU, 0, o);
  U.thriller.cacheN = () => FRM.size;
})();
