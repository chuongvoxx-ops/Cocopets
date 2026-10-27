/* ---------- AION, the Unremembered ----------
   A vast sphere hanging over a garden that is outside the world: liquid pearl and coloured smoke, one hemisphere white,
   gold and rose, the other violet, midnight and black, turning against each other, their boundary folding into itself.
   Three swirls of aura orbit it at different angles, ribbons of luminous mist that pass in front of it and behind it:
   the Radiant Swirl (white and gold, almost upright), the Umbral Swirl (black and violet, flat) and the Prismatic Swirl
   (inclined, flowing through fire, thunder, water, ice, wind and earth). Before a spell the matching swirl tightens and
   draws its energy into an aura knot within reach: damage the knot to weaken the spell, break it to cut the cast and
   lay the sphere open. Three Lightwards stand on the rim of the marble platform: they cleanse its curse and shelter from
   its ultimate. Stage one (100 to 70%) teaches its three spells one at a time, then the orbits loosen for a breather.
   Stage two (70 to 35%) pairs them, adds the Curse of the Unremembered (Entropy, cleansed in a Lightward) and Meteor,
   and darkens one Lightward each cycle. Stage three announces three-part sequences and casts Doomsday: shelter in the
   shining Lightward, or break the Umbral knot first and turn the blast back on Aion. */
FIEND_DEFS.aion = (() => {
  const TAU = Math.PI * 2, TN = FiendToon, R0 = 2.45, HOVER = 3.1, WARD_R = 2.2;
  const GOLD = '#FFE9A8', GOLD2 = '#F2B84A', ROSE = '#F4A8C0', VIOLET = '#9A6AE8', VIOLET2 = '#5A3AA8', MIDNIGHT = '#1A1440', INK = '#140A2C', WARD = '#FFF4D0';
  const PRISM = ['#FF7A3D', '#FFE34A', '#5FB8FF', '#BFEFFF', '#8FE8B0', '#C89A5A'];   // fire, thunder, water, ice, wind, earth
  /* the art style: 'hybrid' (chosen) paints the sphere as realistic light and smoke and its aura ribbons and knots in
     inked cel bands with a soft glow; 'real' and 'toon' paint everything one way (kept for comparison) */
  const AION_STYLE = 'hybrid';
  function sphereStyleOf(st) { return st === 'toon' ? 'toon' : 'real'; }
  function ribStyleOf(st) { return st === 'real' ? 'real' : 'toon'; }
  // the three swirls: the normal of each orbit's plane (in view space: x right, y up, z toward the camera), size and speed
  const SW = [
    { key: 'radiant', name: 'RADIANT', n: [0.82, 0.12, 0.56], rho: 3.75, w: 0.62, om: 0.85, span: 4.7, col: GOLD, deep: GOLD2 },
    { key: 'umbral', name: 'UMBRAL', n: [0.05, 1, 0.42], rho: 4.15, w: 0.68, om: -0.7, span: 5.0, col: VIOLET, deep: VIOLET2 },
    { key: 'prism', name: 'PRISMATIC', n: [-0.62, 0.62, 0.5], rho: 3.45, w: 0.56, om: 1.05, span: 4.4, col: '#BFEFFF', deep: '#5FB8FF' },
  ];
  const NAMES = { lance: 'RADIANT LANCE', eventide: 'EVENTIDE', wheel: 'WORLDWHEEL', curse: 'CURSE', meteor: 'METEOR' };
  const SW_OF = { lance: 0, eventide: 1, wheel: 2, curse: 1, meteor: 2 };
  function lerp(a, b, u) { return a + (b - a) * u; }
  function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function rgba(h, a) { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; }
  function wardAt(C, i) { const a = -Math.PI / 2 + Math.PI / 3 + i * TAU / 3; return { x: C.x + Math.cos(a) * 10.4, y: C.y + Math.sin(a) * 10.4, i }; }
  function angD(a, b) { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; }
  return {
    arenaR: 15, firstAct: 'float', artY: 0.84, ambient: 'wisps',
    artPoses: [
      { name: 'idle: the sleeping contradiction', mem: {} }, { name: 'Radiant Lance: the gold swirl tightens, its knot', mem: { demo: 'lance' } }, { name: 'Eventide: the umbral swirl tightens', mem: { demo: 'eventide' } },
      { name: 'Worldwheel: the prismatic swirl', mem: { demo: 'wheel' } }, { name: 'stage three: the great spiral', mem: { demo: 'spiral' }, lv: 3 }, { name: 'Doomsday: the gathering, the Umbral knot', mem: { demo: 'doom' }, lv: 3 }],
    phaseNames: ['The Sleeping Contradiction', 'The Orbits Disagree', 'The Unremembering'],
    carve(set, C) { },
    props(C) { return [0, 1, 2].map(i => Object.assign({ kind: 'ward' }, wardAt(C, i))); },
    /* ---- the garden outside the world: a marble disc, grass and small white flowers between its stones ---- */
    paintGround(c, A) {
      const R = A.R, rnd = A.rnd;
      let g = c.createRadialGradient(-2, -3, R * 0.1, 0, 0, R + 0.8); g.addColorStop(0, '#F7F5F1'); g.addColorStop(0.6, '#E8E4DC'); g.addColorStop(0.92, '#D4CEC2'); g.addColorStop(1, '#B8B0A2'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.6, 0, TAU); c.fill();
      // marble veining
      c.lineCap = 'round'; for (let i = 0; i < 40; i++) { let x = (rnd() - 0.5) * R * 1.8, y = (rnd() - 0.5) * R * 1.8; if (Math.hypot(x, y) > R) continue; c.strokeStyle = `rgba(150,140,160,${0.12 + rnd() * 0.18})`; c.lineWidth = 0.03 + rnd() * 0.05; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 1.6; y += (rnd() - 0.3) * 1.2; c.lineTo(x, y); } c.stroke(); }
      // paving: concentric courses with joints, the outer walkway darker
      c.fillStyle = 'rgba(120,112,100,.12)'; c.beginPath(); c.arc(0, 0, R + 0.3, 0, TAU); c.arc(0, 0, R - 2.4, 0, TAU, true); c.fill();
      [3.2, 6.2, 9.0, R - 2.4].forEach((r, ri) => { c.strokeStyle = 'rgba(110,100,90,.35)'; c.lineWidth = 0.07; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); const n = Math.round(r * 2.2); for (let k = 0; k < n; k++) { const a = (k + ri * 0.5) / n * TAU, r2 = [6.2, 9.0, R - 2.4, R + 0.3][ri]; c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); c.stroke(); } });
      // a rosette of gold inlaid at the centre
      c.strokeStyle = 'rgba(200,160,70,.55)'; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, 1.6, 0, TAU); c.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 0.5, Math.sin(a) * 0.5); c.quadraticCurveTo(Math.cos(a + 0.26) * 1.4, Math.sin(a + 0.26) * 1.4, Math.cos(a) * 3.0, Math.sin(a) * 3.0); c.stroke(); }
      // grass along the joints, and the tiny white flowers
      for (let i = 0; i < 260; i++) { const a = rnd() * TAU, ring = [3.2, 6.2, 9.0, R - 2.4][Math.floor(rnd() * 4)], r = ring + (rnd() - 0.5) * 0.25, x = Math.cos(a) * r, y = Math.sin(a) * r; c.strokeStyle = `rgba(${80 + rnd() * 40},${140 + rnd() * 40},${70 + rnd() * 30},.8)`; c.lineWidth = 0.05; for (let k = 0; k < 3; k++) { const b = -Math.PI / 2 + (rnd() - 0.5) * 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(b) * 0.28, y + Math.sin(b) * 0.28); c.stroke(); } if (rnd() < 0.35) { c.fillStyle = '#FFFFFF'; for (let k = 0; k < 5; k++) { const b = k / 5 * TAU; c.beginPath(); c.arc(x + Math.cos(b) * 0.08, y - 0.2 + Math.sin(b) * 0.08, 0.06, 0, TAU); c.fill(); } c.fillStyle = '#FFD86A'; c.beginPath(); c.arc(x, y - 0.2, 0.04, 0, TAU); c.fill(); } }
      // the lip of the platform, and the pale nothing past it
      c.strokeStyle = 'rgba(90,80,70,.5)'; c.lineWidth = 0.35; c.beginPath(); c.arc(0, 0, R + 0.45, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0, R + 0.2, 0, TAU); c.stroke();
    },
    /* ---- an empty pale sky, and fragments of ruined gardens hanging motionless in it ---- */
    sky(c, W, H, t, cam, T) {
      const px = (cam.x - 28) * T;
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#E4E8F0'); g.addColorStop(0.55, '#F2F2F4'); g.addColorStop(1, '#FBF8F2'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const isle = (x, y, s, k) => { c.save(); c.translate(x, y); c.fillStyle = `rgba(150,146,170,${0.22 + k * 0.12})`; c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(-s * 0.6, s * 0.9, 0, s * 1.3); c.quadraticCurveTo(s * 0.5, s * 0.8, s, 0); c.closePath(); c.fill(); c.fillStyle = `rgba(170,180,170,${0.3 + k * 0.12})`; c.fillRect(-s, -s * 0.12, s * 2, s * 0.14); c.fillStyle = `rgba(150,160,150,${0.3 + k * 0.12})`; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-s * 0.7 + i * s * 0.45, -s * 0.2, s * 0.16, 0, TAU); c.fill(); } c.strokeStyle = `rgba(160,156,176,${0.4 + k * 0.1})`; c.lineWidth = Math.max(1, s * 0.06); c.beginPath(); c.moveTo(s * 0.3, -s * 0.1); c.lineTo(s * 0.3, -s * 0.6); c.arc(s * 0.5, -s * 0.6, s * 0.2, Math.PI, 0); c.lineTo(s * 0.7, -s * 0.1); c.stroke(); c.restore(); };
      [[0.15, 0.3, 30, 0], [0.72, 0.22, 44, 1], [0.45, 0.12, 22, 0], [0.9, 0.48, 26, 0], [0.05, 0.58, 36, 1]].forEach(([x, y, s, k]) => isle(((x * W - px * (0.03 + k * 0.02)) % (W + 100) + W + 100) % (W + 100) - 50, y * H, s, k));
      c.save(); c.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 24; i++) { const x = (i * 97 + t * 6) % W, y = (i * 53 + t * 9 + Math.sin(t + i) * 8) % H; c.beginPath(); c.ellipse(x, y, 2, 1.2, i, 0, TAU); c.fill(); } c.restore();
    },
    overlay(c, FX, t, T) {
      const M = FX.mem; if (!M || !M.doom) return;
      // Doomsday: the world dims toward the sphere
      const k = clamp(M.doom.t / M.doom.gather, 0, 1); c.save(); c.globalAlpha = 0.25 * k; c.fillStyle = '#100820'; c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore();
    },
    /* ---- the fight ---- */
    init(FX) {
      const M = FX.mem, m = FX.m; m.noTouch = true; m.touchK = 0.5; ensure(M);
      Object.assign(M, { casts: [], cycle: null, cycleDone: false, castT: 3, recT: 0, exposeT: 0, wards: [1, 1, 1], shine: -1, doomT: 8, doom: null, entropy: 0, drift: 0, revT: 9, seq: null });
    },
    phase(FX, p, lv) {
      const M = FX.mem, H = FX.H; M.cycle = null; M.cycleDone = false; M.castT = 2.2;
      if (lv === 2) H.banner('THE ORBITS DISAGREE', 'Its spells come in pairs. A curse that only a Lightward cleanses, and meteors that fall in order', VIOLET, 3, true);
      if (lv >= 3) { M.doomT = 7; H.banner('THE UNREMEMBERING', 'It names three spells before it casts them. Watch the symbols, choose which knot to break', GOLD, 3, true); }
    },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, lv = FX.S.lv, k = 1 / FX.S.fast, C = FX.C, H = FX.H; ensure(M);
      m.actT += dt;
      // it drifts, effortlessly, around the centre of the platform
      M.drift += dt * 0.11; m.x = lerp(m.x, C.x + Math.cos(M.drift) * 2.6, dt * 0.5); m.y = lerp(m.y, C.y - 0.8 + Math.sin(M.drift * 1.3) * 1.8, dt * 0.5);
      animate(M, dt, lv, FX.S.t);
      // stage two: now and then a swirl pauses, then turns the other way
      if (lv >= 2) { M.revT -= dt; if (M.revT <= 0) { M.revT = 8 + Math.random() * 5; const s = M.sw[Math.floor(Math.random() * 3)]; s.pause = 0.7; s.flip = true; } }
      // casts in flight: their knots and timers
      M.casts = M.casts.filter(cs => { cs.t += dt; if (cs.knot && !cs.knot.dead) { cs.knot.hp = 1e12; } if (cs.done || cs.t >= cs.wait + 0.25) { if (cs.knot && !cs.knot.dead) cs.knot.dead = true; return false; } return true; });
      if (M.post && (M.post.t += dt) > M.post.life) { if (M.post.knot && !M.post.knot.dead) M.post.knot.dead = true; M.post = null; }
      M.recT -= dt; M.exposeT -= dt;
      // what it does next
      if (M.doom) runDoom(FX, m, dt);
      else if (lv >= 3 && (M.doomT -= dt) <= 0 && !M.casts.length) startDoom(FX, m);
      else if (M.recT <= 0 && !M.casts.length) { M.castT -= dt; if (M.castT <= 0) nextCast(FX, m, lv); }
      if (M.seq) { M.seq.t += dt; if (M.seq.t > M.seq.life) M.seq = null; }
      FX.parts([{ key: 'sphere', dx: 0, dy: -HOVER, r: R0 * 1.05 }]);
    },
    stunned(FX, m, dt) { const M = FX.mem; ensure(M); animate(M, dt * 0.35, FX.S.lv, FX.S.t); FX.parts([{ key: 'sphere', dx: 0, dy: -HOVER, r: R0 * 1.05 }]); },
    update(FX, dt) {
      // Entropy: a dark countdown on the pet, cleansed by an active Lightward (it runs even while Aion is stunned)
      const M = FX.mem, me = FX.me, H = FX.H, m = FX.m; if (!m || !(M.entropy > 0)) return;
      if (inWard(FX, me.x, me.y)) { M.entropy = 0; H.text(me.x, me.y - 1.4, 'Cleansed!', WARD, 15); H.sfx.sparkle(); H.ring(me.x, me.y, 0.3, 2, 0.4, GOLD, 0.3); }
      else { M.entropy -= dt; if (M.entropy <= 0) { M.entropy = 0; FX.hurt(m.dmg * 2.2); H.boom(me.x, me.y, 1.8, VIOLET, '#FFFFFF', { n: 18, shake: 10, smoke: 6 }); H.text(me.x, me.y - 1.5, 'ENTROPY!', VIOLET, 16); } }
    },
    dmgK(FX, m, o) { const M = FX.mem; return M.exposeT > 0 ? 1.5 : M.recT > 0 ? 1.25 : 1; },
    draw(c, FX, m, X, Y, T, t) { drawAion(c, FX, m, X, Y, T, t); },
    // the wards are kept as pictures, repainted a few times a second in turn (and at once when one lights or goes out)
    propKeep: { every: 4, box: p => [-WARD_R - 0.7, -9.6, WARD_R + 0.7, WARD_R + 0.5], sig: (FX, p) => { const M = FX.mem; return `${!M.wards || M.wards[p.i] ? 1 : 0}${M.shine === p.i ? 1 : 0}${M.style || ''}`; } },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'ward') drawWard(c, FX, p, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'knot') drawKnot(c, ribStyleOf(FX.mem.style || AION_STYLE), o.sw, X, Y, T, t, o.cs ? clamp(o.cs.khp / o.cs.kmax, 0, 1) : 1, o.big); },
    drawFx(c, FX, T, t) {
      const M = FX.mem, m = FX.m, me = FX.me; if (!m || m.dead) return;
      // the Entropy countdown over the pet
      if (M.entropy > 0) { const X = FX.sx(me.x), Y = FX.sy(me.y) - T * 1.9, r = T * 0.45, u = M.entropy / 5.5; c.save(); c.fillStyle = 'rgba(20,10,40,.8)'; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill(); c.strokeStyle = VIOLET; c.lineWidth = 3; c.beginPath(); c.arc(X, Y, r, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.fillStyle = '#FFFFFF'; c.font = `900 ${Math.round(T * 0.5)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(Math.ceil(M.entropy), X, Y + 1); c.restore(); }
      // stage three: the symbols of the coming sequence, over the sphere
      if (M.seq) { const X = FX.sx(m.x), Y = FX.sy(m.y) - (HOVER + R0 + 1.6) * T, n = M.seq.list.length, cur = M.seq.cur || 0; c.save(); for (let i = 0; i < n; i++) { const x = X + (i - (n - 1) / 2) * T * 1.4, on = i >= cur; c.globalAlpha = on ? 1 : 0.35; symbol(c, x, Y, T * 0.45, M.seq.list[i], i === cur); } c.restore(); }
    },
  };
  /* ---- state ---- */
  function ensure(M) {
    if (M.sw) return; M.sw = SW.map((s, i) => ({ ph: i * 2.1, tight: 0, rhoK: 1, dir: 1, pause: 0, glow: 0.5 })); M.nv = [0.5, 0.45, 0.74]; M.turn = 0; M.spiral = 0; M.wards = M.wards || [1, 1, 1]; M.shine = M.shine == null ? -1 : M.shine;
  }
  /* the swirls and the hemispheres move on their own time */
  function animate(M, dt, lv, t) {
    t = t || 0;
    M.sw.forEach((S, i) => { const st = SW[i], busy = (M.casts || []).some(cs => cs.sw === i) || (M.doom && i < 2) || (M.post && M.post.sw === i);
      S.tight = lerp(S.tight, busy ? 1 : 0, Math.min(1, dt * 2.5)); S.glow = lerp(S.glow, busy ? 1 : 0.5, Math.min(1, dt * 3));
      if (S.pause > 0) { S.pause -= dt; if (S.pause <= 0 && S.flip) { S.dir *= -1; S.flip = false; } }
      const slow = M.recT > 0 ? 0.35 : 1; S.ph += dt * st.om * S.dir * (S.pause > 0 ? 0 : 1) * (1 + S.tight * 1.8) * slow;
      S.rhoK = lerp(S.rhoK, M.doom && i < 2 ? 0.74 : lv >= 3 ? 1.55 : lv >= 2 ? 1.22 : 1, Math.min(1, dt * 0.8)); });
    M.spiral = lerp(M.spiral || 0, lv >= 3 && !M.doom ? 1 : 0, Math.min(1, dt * 0.5));
    // the light hemisphere's pole: wandering slowly, turned away during Doomsday, kicked by a small deliberate turn before each spell
    M.turn = Math.max(0, (M.turn || 0) - dt * 1.5);
    const sp = lv >= 2 ? 1.7 : 1, ang = 0.7 + t * 0.12 * sp + Math.sin(t * 0.31 * sp) * 0.5 + M.turn * 0.6, tz = 0.26 + Math.sin(t * 0.17 * sp) * 0.16;
    const want = M.doom ? [0.1, 0.35, -0.93] : norm3([Math.cos(ang), Math.sin(ang), tz]);
    M.nv = norm3(M.nv.map((v, j) => lerp(v, want[j], Math.min(1, dt * 1.5))));
  }
  function inWard(FX, x, y, onlyShine) { const M = FX.mem; for (let i = 0; i < 3; i++) { const w = wardAt(FX.C, i); if (Math.hypot(x - w.x, y - w.y) < WARD_R && (onlyShine ? i === M.shine : M.wards[i])) return true; } return false; }
  /* ---- casting ---- */
  function makeCycle(lv) {
    const sh = a => a.sort(() => Math.random() - 0.5);
    if (lv <= 1) return sh(['lance', 'eventide', 'wheel']).map(x => [x]);
    if (lv === 2) { const pool = ['lance', 'eventide', 'wheel'], out = [['curse', sh(pool.slice())[0]], ['meteor'], sh(pool.slice()).slice(0, 2)]; return sh(out); }
    return [sh(['lance', 'eventide', 'wheel', 'curse', 'meteor']).slice(0, 3)];   // stage three: one announced sequence of three
  }
  function nextCast(FX, m, lv) {
    const M = FX.mem, k = 1 / FX.S.fast, H = FX.H;
    if (!M.cycle || !M.cycle.length) {
      if (M.cycleDone) { M.cycleDone = false; M.recT = 3.6; M.wards = M.wards.map(() => 1); H.text(m.x, m.y - HOVER - R0 - 1, 'The orbits loosen', GOLD, 14); M.castT = 0.8; return; }
      M.cycle = makeCycle(lv);
      if (lv === 2) { const on = [0, 1, 2].filter(i => M.wards[i]); if (on.length === 3) { const i = on[Math.floor(Math.random() * 3)]; M.wards[i] = 0; H.text(wardAt(FX.C, i).x, wardAt(FX.C, i).y - 2, 'A Lightward dims', '#C8C0D8', 13); } }
      if (lv >= 3) { const list = M.cycle[0]; M.seq = { list, cur: 0, t: 0, life: 99 }; H.banner('THE SEQUENCE', list.map(s => NAMES[s]).join('  ·  '), GOLD, 2.2); }
    }
    const step = M.cycle.shift(); if (!M.cycle.length) M.cycleDone = true;
    M.turn = 1;   // a small deliberate rotation before every spell
    if (lv >= 3) step.forEach((kind, j) => cast(FX, m, kind, j * 2.4 * k, lv, j)); else step.forEach((kind, j) => cast(FX, m, kind, j * 1.0 * k, lv));
    if (lv >= 3 && M.seq) { M.seq.life = M.seq.t + 2.4 * k * step.length + 2; M.seq.started = FX.S.t; }
    M.castT = (lv >= 3 ? 1.6 : lv >= 2 ? 2.0 : 2.4) * k;
  }
  function cast(FX, m, kind, delay, lv, seqI) {
    const M = FX.mem, k = 1 / FX.S.fast, cs = { kind, sw: SW_OF[kind], t: 0, wait: 0, teles: [], hzs: [], knot: null, khp: 1, kmax: 1, done: false };
    cs.mult = () => 0.35 + 0.65 * clamp(cs.khp / cs.kmax, 0, 1);
    const spell = { lance: lance, eventide: eventide, wheel: wheel, curse: curse, meteor: meteor }[kind];
    spell(FX, m, cs, delay, lv, k);
    if (kind !== 'meteor') makeKnot(FX, m, cs, 0.1);
    M.casts.push(cs);
    if (M.seq && seqI != null) setTimeoutT(FX, delay + 0.02, () => { if (M.seq) M.seq.cur = seqI; });
  }
  // a tiny scheduler on the fight's clock, through a telegraph with no shape
  function setTimeoutT(FX, t, fn) { FX.tele({ shape: 'fn', test: () => false, x: 0, y: 0, t: Math.max(0.01, t), dmg: 0, fn, invisible: true }); }
  /* the aura knot: where the active swirl gathers its energy, within reach in front of the sphere */
  function knotPoint(FX, m, swi) {
    const M = FX.mem, me = FX.me, pts = ribbon(M, swi, FX.S.t || 0); let best = null, bd = 1e9;
    for (const p of pts) { if (p.z < 0.2 || Math.hypot(p.x, p.y, p.z) < R0 * 1.02) continue; const wx = m.x + p.x, wy = m.y - HOVER - p.y, d = Math.hypot(wx - me.x, wy - me.y); if (d < bd) { bd = d; best = { x: wx, y: wy }; } }
    return best || { x: m.x, y: m.y - HOVER + R0 + 0.6 };
  }
  function makeKnot(FX, m, cs, frac, big, at) {
    const p = at || knotPoint(FX, m, cs.sw), hp = Math.max(400, (FX.S.barHP || 4000) * frac);
    cs.khp = cs.kmax = hp; cs.knot = FX.obj({ kind: 'knot', sw: cs.sw, cs, big, x: p.x, y: p.y, r: big ? 1.3 : 0.95, hp: 1e12, forward: 1, front: true, onHit: (o, dmg) => knotHit(FX, cs, dmg) });
  }
  function knotHit(FX, cs, dmg) {
    if (cs.done) return; cs.khp -= dmg; const f = cs.mult();
    cs.teles.forEach(s => { if (s.base) s.dmg = s.base * f; });
    if (cs.khp <= 0) breakKnot(FX, cs);
  }
  function breakKnot(FX, cs) {
    const M = FX.mem, H = FX.H, m = FX.m, kn = cs.knot; cs.done = true; cs.teles.forEach(s => { if (!s.done) s.done = 'cut'; }); cs.hzs.forEach(z => { z.life = 0; });
    if (kn) { H.boom(kn.x, kn.y, 1.6, SW[cs.sw].col, '#FFFFFF', { n: 22, shake: 8, smoke: 4 }); H.text(kn.x, kn.y - 1.2, cs.doom ? 'THE UMBRAL KNOT BREAKS!' : 'SPELL BROKEN!', SW[cs.sw].col, 15); kn.dead = true; for (let i = 0; i < 2; i++) H.drop(i ? 'mp' : 'hp', kn.x, kn.y + 1); }
    H.sfx.crash(); M.exposeT = Math.max(M.exposeT, cs.doom ? 7.5 : 3.2);
    if (cs.post) { m.stunT = Math.max(m.stunT || 0, 1.6); }
  }
  /* Radiant Lance: parallel lines across the platform, then pillars of light along them */
  function lance(FX, m, cs, delay, lv, k) {
    const me = FX.me, n = lv >= 2 ? 5 : 4, a = Math.random() * Math.PI, wait = 1.8 * k + delay, nx = -Math.sin(a), ny = Math.cos(a), shift = Math.random() * 1.6;
    cs.wait = wait;
    for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 3.1 + shift - 0.8, px = me.x + nx * o, py = me.y + ny * o;
      const s = FX.tele({ shape: 'line', x: px - Math.cos(a) * 16, y: py - Math.sin(a) * 16, a, len: 32, w: 1.25, t: wait, dmg: m.dmg * 1.3, col: GOLD, label: i === 0 ? 'RADIANT LANCE' : '', fn: q => { if (q.done === 'cut') return; FX.H.sfx.zap && FX.H.sfx.zap(); for (let j = 0; j < 12; j++) { const u = j / 11, x = q.x + Math.cos(q.a) * q.len * u, y = q.y + Math.sin(q.a) * q.len * u; if (FX.inArena && !FX.inArena(x, y)) continue; FX.H.sparks(x, y, GOLD, 4, 4); } FX.hz({ kind: 'pillar', shape: 'line', x: q.x, y: q.y, a: q.a, len: q.len, w: q.w, life: 0.6, dps: 0, draw: drawPillars }); FX.H.shake(5, 0.2); } });
      s.base = s.dmg; cs.teles.push(s); }
  }
  /* Eventide: a dark wave rolling outward, its gaps turning with the Umbral Swirl */
  function eventide(FX, m, cs, delay, lv, k) {
    const M = FX.mem, me = FX.me, wait = 1.6 * k + delay, g0 = Math.random() * TAU, ng = lv >= 2 ? 2 : 3, gw = lv >= 2 ? 0.36 : 0.42, rot = 0.45 * Math.sign(SW[1].om * M.sw[1].dir), gaps = [];
    for (let i = 0; i < ng; i++) gaps.push(g0 + i * TAU / ng); cs.wait = wait;
    const s = FX.tele({ shape: 'ring', x: m.x, y: m.y, r0: 2.4, r1: 3.6, gaps: gaps.map(g => [g + rot * wait, gw]), t: wait, dmg: 0, col: VIOLET, label: 'EVENTIDE', fn: q => { if (q.done === 'cut') return;
      const z = FX.hz({ kind: 'eventide', x: q.x, y: q.y, r: 2.4, life: 3.1, dps: 0, gaps: gaps.map(g => g + rot * wait), gw, rot, hit: false, update: (dt, zz) => { zz.r += dt * 5.0; zz.gaps = zz.gaps.map(g => g + zz.rot * dt); const d = Math.hypot(me.x - zz.x, me.y - zz.y); if (!zz.hit && Math.abs(d - zz.r) < 0.5 + me.r * 0.5) { const aa = Math.atan2(me.y - zz.y, me.x - zz.x); if (!zz.gaps.some(g => Math.abs(angD(g, aa)) < zz.gw)) { if (FX.hurt(m.dmg * 1.5 * cs.mult())) zz.hit = true; } } }, draw: drawEventide });
      cs.hzs.push(z); FX.H.sfx.hum(); } });
    cs.teles.push(s);
  }
  /* Worldwheel: the Prismatic Swirl names one of three patterns */
  function wheel(FX, m, cs, delay, lv, k) {
    const me = FX.me, C = FX.C, pat = ['fire', 'water', 'wind'][Math.floor(Math.random() * 3)], wait = 1.9 * k + delay; cs.wait = wait + (pat === 'fire' ? 0.8 : 0); cs.pat = pat;
    FX.H.text(m.x, m.y - HOVER - R0 - 1.2, { fire: 'WORLDWHEEL · FIRE + THUNDER', water: 'WORLDWHEEL · WATER + ICE', wind: 'WORLDWHEEL · WIND + EARTH' }[pat], { fire: PRISM[0], water: PRISM[2], wind: PRISM[4] }[pat], 14);
    if (pat === 'fire') {   // clusters of explosive circles, one after another
      for (let cl = 0; cl < 3; cl++) { const ca = Math.random() * TAU, cd = cl ? 3.2 : 0, cx = me.x + Math.cos(ca) * cd, cy = me.y + Math.sin(ca) * cd;
        for (let i = 0; i < 4; i++) { const p = FX.clampArena({ x: cx + (i ? Math.cos(i * 2.1 + ca) * 1.5 : 0), y: cy + (i ? Math.sin(i * 2.1 + ca) * 1.5 : 0) }, 0.5);
          const s = FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.35, t: wait + cl * 0.4, dmg: m.dmg * 1.15, col: i % 2 ? PRISM[1] : PRISM[0], label: '', fn: q => { if (q.done === 'cut') return; FX.H.boom(q.x, q.y, 1.4, i % 2 ? PRISM[1] : PRISM[0], '#FFFFFF', { n: 10, shake: 4, smoke: 3 }); } }); s.base = s.dmg; cs.teles.push(s); } }
    } else if (pat === 'water') {   // lanes of freezing mist that advance across the platform
      const a = Math.random() * TAU, nx = -Math.sin(a), ny = Math.cos(a), off = Math.random() * 2;
      for (let i = -3; i <= 3; i++) { const o = i * 5.0 + off, px = me.x + nx * o, py = me.y + ny * o;
        const s = FX.tele({ shape: 'line', x: px - Math.cos(a) * 16, y: py - Math.sin(a) * 16, a, len: 32, w: 1.9, t: wait, dmg: 0, col: PRISM[3], label: i === 0 ? 'FREEZING MIST' : '', fn: q => { if (q.done === 'cut') return;
          const z = FX.hz({ kind: 'mist', shape: 'line', x: q.x, y: q.y, a: q.a, len: q.len, w: 1.9, life: 3.2, dps: m.dmg * 0.55 * cs.mult(), tick: 0.3, slow: true, col: PRISM[3], update: (dt, zz) => { zz.x += nx * dt * 1.0; zz.y += ny * dt * 1.0; }, draw: drawMist }); cs.hzs.push(z); } }); cs.teles.push(s); }
    } else {   // a sweeping front of abrasive dust, with one gap to step through
      const a = Math.random() * TAU, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, gap = (Math.random() - 0.5) * 6, x0 = C.x - dx * C.R, y0 = C.y - dy * C.R;
      const s = FX.tele({ shape: 'line', x: x0 - nx * 16, y: y0 - ny * 16, a: a + Math.PI / 2, len: 32, w: 1.2, t: wait, dmg: 0, col: PRISM[5], label: 'DUST FRONT', fn: q => { if (q.done === 'cut') return;
        const z = FX.hz({ kind: 'front', x: x0, y: y0, a, nx, ny, gap, life: 6.5, dps: 0, hit: false, update: (dt, zz) => { zz.x += dx * dt * 5.2; zz.y += dy * dt * 5.2; const rx = me.x - zz.x, ry = me.y - zz.y, al = rx * dx + ry * dy, lat = rx * nx + ry * ny; if (!zz.hit && Math.abs(al) < 0.7 + me.r * 0.5 && Math.abs(lat - zz.gap) > 1.6) { if (FX.hurt(m.dmg * 1.4 * cs.mult())) { zz.hit = true; me.push = { vx: dx * 9, vy: dy * 9, t: 0.25 }; } } }, draw: drawFront });
        cs.hzs.push(z); FX.H.sfx.whoosh(); } });
      // mark the gap the whole way across, so the route is plain from the start
      FX.hz({ kind: 'gapmark', x: x0, y: y0, a, nx, ny, gap, life: wait + 6.5, dps: 0, draw: drawGapMark });
      cs.teles.push(s);
    }
  }
  /* Curse of the Unremembered: dark droplets on marked circles; a hit lays Entropy on the pet */
  function curse(FX, m, cs, delay, lv, k) {
    const M = FX.mem, me = FX.me, wait = 1.5 * k + delay; cs.wait = wait;
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + Math.random(), d = i ? 1.8 + Math.random() * 3 : 0, p = FX.clampArena({ x: me.x + Math.cos(a) * d, y: me.y + Math.sin(a) * d }, 0.5);
      const s = FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.25, t: wait + i * 0.08, dmg: m.dmg * 0.6, col: VIOLET2, label: i === 0 ? 'CURSE' : '', fn: q => { if (q.done === 'cut') return; FX.H.sparks(q.x, q.y, VIOLET, 8, 3); if (FX.inShape(q, me.x, me.y, me.r) && !(M.entropy > 0)) { M.entropy = 5.5; FX.H.text(me.x, me.y - 1.5, 'ENTROPY: reach a Lightward!', VIOLET, 14); } } });
      s.base = s.dmg; cs.teles.push(s); }
  }
  /* Meteor: three fragments whose shadows show the order they fall in; afterwards the Prismatic knot hangs low */
  function meteor(FX, m, cs, delay, lv, k) {
    const M = FX.mem, me = FX.me, wait = 1.9 * k + delay, a = Math.random() * TAU, p1 = { x: me.x, y: me.y }, p2 = FX.clampArena({ x: me.x + Math.cos(a) * 4.4, y: me.y + Math.sin(a) * 4.4 }, 2), p3 = FX.clampArena({ x: me.x - Math.cos(a + 0.5) * 4.4, y: me.y - Math.sin(a + 0.5) * 4.4 }, 2);
    cs.wait = wait + 1.8;
    [p1, p2, p3].forEach((p, i) => { const s = FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 2.5, t: wait + i * 0.9, dmg: m.dmg * 1.6, col: PRISM[i * 2], label: String(i + 1), fn: q => { if (q.done === 'cut') return; FX.H.boom(q.x, q.y, 2.4, PRISM[i * 2], '#FFFFFF', { n: 26, shake: 12, smoke: 10 }); FX.H.sfx.crash();
        if (i === 2) { const post = { sw: 2, t: 0, life: 4, post: true, teles: [], hzs: [], done: false, khp: 1, kmax: 1 }; post.mult = () => 1; makeKnot(FX, m, post, 0.1, false, { x: m.x + 0.5, y: m.y - 0.6 }); M.post = post; FX.H.text(m.x, m.y - 2, 'The Prismatic knot hangs low!', PRISM[2], 14); } } });
      s.base = s.dmg; cs.teles.push(s);
      FX.hz({ kind: 'meteor', x: p.x, y: p.y, life: wait + i * 0.9, dps: 0, i, draw: drawMeteor }); });
  }
  /* Doomsday: the gathering, the decision, the collapse */
  function startDoom(FX, m) {
    const M = FX.mem, k = 1 / FX.S.fast, H = FX.H, on = [0, 1, 2]; M.wards = [1, 1, 1]; M.shine = on[Math.floor(Math.random() * 3)];
    const cs = { sw: 1, t: 0, wait: 99, teles: [], hzs: [], doom: true, done: false }; cs.mult = () => 1; makeKnot(FX, m, cs, 0.28, true, { x: m.x, y: m.y - HOVER + R0 + 1.2 });
    M.doom = { t: 0, gather: 5.2 * k, cs }; M.casts.forEach(c2 => { c2.teles.forEach(s => { if (!s.done) s.done = 'cut'; }); if (c2.knot) c2.knot.dead = true; }); M.casts = [];
    H.banner('DOOMSDAY · THE UNREMEMBERING', 'Shelter in the shining Lightward, or break the Umbral knot first and turn it on itself', VIOLET, 3.4, true); H.sfx.hum(); H.shake(8, 0.6);
  }
  function runDoom(FX, m, dt) {
    const M = FX.mem, D = M.doom, H = FX.H, me = FX.me; D.t += dt;
    if (D.cs.done) {   // the knot broke: its dark layer ruptures and the blast turns on itself
      M.doom = null; M.doomT = 26 / FX.S.fast; M.wards = [1, 1, 1]; M.shine = -1; m.hp = Math.max(m.maxhp * 0.02, m.hp - (FX.S.barHP || 0) * 1.1); m.stunT = 7.5; M.exposeT = 7.5;
      H.banner('IT TURNS ON ITSELF', 'The dark hemisphere ruptures: its light is bare. Strike!', GOLD, 2.6, true); H.flash(0.45, '#FFFFFF'); H.shake(16, 0.7); H.ring(m.x, m.y - HOVER, 1, 10, 0.8, GOLD, 0.5); return; }
    if (D.t >= D.gather) {
      if (D.cs.knot && !D.cs.knot.dead) D.cs.knot.dead = true;
      H.flash(0.5, '#1A0A30'); H.shake(20, 0.8); H.sfx.crash(); FX.hz({ kind: 'doompulse', x: m.x, y: m.y, r: 1, life: 1.4, dps: 0, update: (dt2, z) => { z.r += dt2 * 16; }, draw: drawDoomPulse });
      if (inWard(FX, me.x, me.y, true)) H.text(me.x, me.y - 1.5, 'The Lightward holds!', WARD, 16); else FX.hurt(m.dmg * 3.0);
      M.doom = null; M.doomT = 26 / FX.S.fast; M.wards = [1, 1, 1]; M.shine = -1; m.stunT = 3.2; M.exposeT = 3.2;
    }
  }
  /* ---- geometry: a swirl's ribbon in view space around the sphere's centre ---- */
  function basis(n) { n = norm3(n); const a = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], e1 = norm3(cross(n, a)), e2 = cross(n, e1); return [n, e1, e2]; }
  function ribbon(M, i, t) {
    const S = M.sw[i], st = SW[i], NS = 34, out = [], yaw = Math.sin(t * 0.13 + i * 2) * 0.35, n0 = st.n, n = [n0[0] * Math.cos(yaw) + n0[2] * Math.sin(yaw), n0[1], -n0[0] * Math.sin(yaw) + n0[2] * Math.cos(yaw)];
    const [N, e1, e2] = basis(n), tight = S.tight, rho = st.rho * S.rhoK * (1 - tight * 0.25), span = st.span * (1 - tight * 0.2), spiral = (M.spiral || 0);
    for (let j = 0; j <= NS; j++) { const u = j / NS; let ph = S.ph - u * span * S.dir, r = rho * (1 + spiral * u * 1.4) + Math.sin(u * 9 + t * 2 + i) * 0.12;
      if (u > 0.8) { const e = (u - 0.8) / 0.2; r *= 1 - e * 0.5; ph -= e * 1.7 * S.dir; }   // the tail curls in on itself
      const lift = Math.sin(u * 6 + t * 1.5 + i) * 0.25, c = Math.cos(ph) * r, s = Math.sin(ph) * r;
      const p = [e1[0] * c + e2[0] * s + N[0] * lift, e1[1] * c + e2[1] * s + N[1] * lift, e1[2] * c + e2[2] * s + N[2] * lift];
      const w = st.w * Math.min(1, u / 0.07 + 0.15) * Math.pow(1 - u, 0.75) * (1 + tight * 0.6) * (1 + spiral * 1.3);
      out.push({ x: p[0], y: p[1], z: p[2], w, u }); }
    return out;
  }
  /* ---- painting ---- */
  function drawAion(c, FX, m, X, Y, T, t) {
    const M = FX.mem; ensure(M);
    const style = M.style || AION_STYLE, sStyle = sphereStyleOf(style), rStyle = ribStyleOf(style), demo = M.demo, lv = (FX.S && FX.S.lv) || 1;
    if (demo && !M.demoSet) { M.demoSet = 1; if (demo === 'lance') { M.sw[0].tight = 1; M.sw[0].glow = 1; } if (demo === 'eventide') { M.sw[1].tight = 1; M.sw[1].glow = 1; } if (demo === 'wheel') { M.sw[2].tight = 1; M.sw[2].glow = 1; } if (demo === 'spiral') { M.spiral = 1; M.sw.forEach(S => { S.rhoK = 1.55; }); } if (demo === 'doom') { M.doom = { t: 3, gather: 5, cs: {} }; M.sw[0].tight = 1; M.sw[1].tight = 1; M.sw[0].rhoK = M.sw[1].rhoK = 0.74; M.nv = [0.1, 0.35, -0.93]; M.shine = 1; } }
    if (!FX.S || FX.S.t == null) { M.sw.forEach((S, i) => { S.ph = t * SW[i].om + i * 2.1; }); if (demo !== 'doom') { const ang = 0.7 + t * 0.12; M.nv = norm3([Math.cos(ang), Math.sin(ang), 0.26]); } }
    const bob = Math.sin(t * 1.1) * 0.12, cx = X, cy = Y - (HOVER + bob) * T, R = R0 * T;
    const ribs = [0, 1, 2].map(i => ribbon(M, i, t));
    // in the fight it is kept as a picture, painted continually a third a frame (the shadow, glow and far ribbons; the
    // sphere; the near ribbons); art and previews paint straight
    const K = FX.K, ft = K.fightT ? K.fightT(FX, t) : null, vb = ft != null ? K.viewBox(c, T * 1.5) : null, sig = `${Math.round(T * 8)}|${K.qq()}|${lv}|${style}`, glowUnder = style === 'hybrid';
    const steps = [], part = (key, slot, fn) => steps.push(fn), SK = M.skipP || {};
    part('back', 0, c => {
    // its shadow on the grass, and the glow it throws around itself
    c.save(); c.fillStyle = 'rgba(40,30,60,.22)'; c.beginPath(); c.ellipse(X, Y + T * 0.1, R * 1.25, R * 0.42, 0, 0, TAU); c.fill(); c.restore();
    if (sStyle === 'real') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22; blitSized(c, glowSprite(GOLD), cx - R * 3.2 + M.nv[0] * R, cy - R * 3.2 - M.nv[1] * R, R * 6.4, R * 6.4); c.globalAlpha = 0.3; blitSized(c, glowSprite(VIOLET), cx - R * 3 - M.nv[0] * R, cy - R * 3 + M.nv[1] * R, R * 6, R * 6); c.restore(); }
    // the ribbons behind the sphere, the sphere, then the ribbons in front of it
    if (!SK.ribB) ribs.forEach((pts, i) => paintRibbon(c, rStyle, pts, i, cx, cy, T, t, M, false, glowUnder));
    });
    part('sphere', 0, c => { if (SK.sphere) return; if (sStyle === 'real') sphereReal(c, cx, cy, R, M, t, lv); else sphereToon(c, cx, cy, R, M, t, lv); });
    part('front', 1, c => {
    if (!SK.ribF) ribs.forEach((pts, i) => paintRibbon(c, rStyle, pts, i, cx, cy, T, t, M, true, glowUnder));
    // a knot drawn in the art test (in the fight the knots are objects of their own)
    if (demo === 'lance') { const p = ribs[0].filter(q => q.z > 0.3).sort((a, b) => b.y - a.y)[Math.floor(ribs[0].length * 0.1)] || ribs[0][3]; drawKnot(c, rStyle, 0, cx + p.x * T, cy - p.y * T, T, t, 0.7, false); }
    if (demo === 'doom') drawKnot(c, rStyle, 1, cx, cy + R + T * 1.2, T, t, 1, true);
    // Doomsday gathering: dark aura drawn inward
    if (M.doom) { const k = clamp(M.doom.t / (M.doom.gather || 5), 0, 1); c.save(); c.strokeStyle = sStyle === 'real' ? 'rgba(154,106,232,.5)' : INK; c.lineWidth = sStyle === 'real' ? 2 : 3; for (let i = 0; i < 4; i++) { const ph = (t * 0.8 + i * 0.25) % 1, r = R * (2.6 - ph * 1.5); c.globalAlpha = (1 - ph) * (0.4 + k * 0.6); c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); } c.restore(); }
    });
    if (vb) K.layer(c, 'aion', { t, box: vb, ax: X, ay: Y, steps: 3, sig }, (g, i) => steps[i](g)); else steps.forEach(f => f(c));
    if (FX.H && FX.H.part && Math.random() < 0.35) { const i = Math.floor(Math.random() * 3), p = ribs[i][Math.floor(Math.random() * 30)]; FX.H.part({ kind: 'spark', x: m.x + p.x, y: m.y - HOVER - p.y, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, life: 0.9, max: 0.9, size: 2.2, color: i === 2 ? PRISM[Math.floor(Math.random() * 6)] : SW[i].col }); }
  }
  /* the light hemisphere on screen: the outline on its side and the folding terminator back */
  function lightPath(cx, cy, R, nv, t, fold) {
    const a = Math.atan2(-nv[1], nv[0]), nz = nv[2], kk = Math.abs(nz), ux = Math.cos(a + Math.PI / 2), uy = Math.sin(a + Math.PI / 2), vx = -Math.cos(a), vy = -Math.sin(a), pts = [];
    for (let i = 0; i <= 32; i++) { const th = (nz > 0 ? 1 : -1) * i / 32 * Math.PI, w = Math.sin(th * 3 + t * 1.7) * R * 0.08 * fold * Math.abs(Math.sin(th)), ex = Math.cos(th) * R, ey = Math.sin(th) * R * kk; pts.push([cx + ux * ex + vx * (ey + w * (nz > 0 ? 1 : -1)), cy + uy * ex + vy * (ey + w * (nz > 0 ? 1 : -1))]); }
    const path = c => { c.moveTo(cx + Math.cos(a - Math.PI / 2) * R, cy + Math.sin(a - Math.PI / 2) * R); c.arc(cx, cy, R, a - Math.PI / 2, a + Math.PI / 2, false); pts.forEach(p => c.lineTo(p[0], p[1])); c.closePath(); };
    return { path, term: pts };
  }
  /* spiral arms mapped onto the sphere around a pole: screen polylines with a width, only on the visible face */
  function arms(cx, cy, R, pole, n, turns, ph, wk) {
    pole = norm3(pole); const a = Math.abs(pole[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], b1 = norm3(cross(pole, a)), b2 = cross(pole, b1), out = [];
    for (let k = 0; k < n; k++) { const pts = []; for (let j = 0; j <= 18; j++) { const al = 0.08 + j / 18 * 1.45, be = ph + k * TAU / n + al * turns, sa = Math.sin(al), ca = Math.cos(al);
        const p = [pole[0] * ca + (b1[0] * Math.cos(be) + b2[0] * Math.sin(be)) * sa, pole[1] * ca + (b1[1] * Math.cos(be) + b2[1] * Math.sin(be)) * sa, pole[2] * ca + (b1[2] * Math.cos(be) + b2[2] * Math.sin(be)) * sa];
        pts.push({ x: cx + p[0] * R, y: cy - p[1] * R, z: p[2], w: R * wk * Math.sin(Math.min(1.2, al * 1.4)) * Math.max(0.15, p[2] + 0.2) }); }
      out.push(pts); }
    return out;
  }
  function fillArm(c, pts) { const vis = pts.filter(p => p.z > -0.05); if (vis.length < 3) return; const { L, R: Rr } = TN.ribbonPts(vis.map(p => [p.x, p.y]), u => vis[Math.min(vis.length - 1, Math.round(u * (vis.length - 1)))].w); c.beginPath(); L.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let i = Rr.length - 1; i >= 0; i--) c.lineTo(Rr[i][0], Rr[i][1]); c.closePath(); c.fill(); }
  function stars(c, cx, cy, R, pole, ph, t, n, toon) {
    const R2 = mulberry32(31); pole = norm3(pole); const a = Math.abs(pole[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], b1 = norm3(cross(pole, a)), b2 = cross(pole, b1);
    for (let k = 0; k < n; k++) { const al = 0.15 + R2() * 1.3, be = R2() * TAU + ph, sa = Math.sin(al), ca = Math.cos(al), p = [pole[0] * ca + (b1[0] * Math.cos(be) + b2[0] * Math.sin(be)) * sa, pole[1] * ca + (b1[1] * Math.cos(be) + b2[1] * Math.sin(be)) * sa, pole[2] * ca + (b1[2] * Math.cos(be) + b2[2] * Math.sin(be)) * sa];
      if (p[2] < 0.05) continue; const x = cx + p[0] * R, y = cy - p[1] * R, tw = 0.5 + 0.5 * Math.sin(t * (2 + R2() * 3) + k), s = (0.6 + R2() * 1.6) * (0.5 + p[2] * 0.6);
      if (toon) TN.twinkle(c, x, y, s * 2.2, '#FFFFFF', 0.4 + 0.6 * tw); else { c.globalAlpha = 0.4 + 0.6 * tw; c.fillStyle = R2() < 0.3 ? '#BFD8FF' : '#FFFFFF'; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); if (s > 1.6) { c.globalAlpha *= 0.5; c.fillRect(x - s * 2.5, y - 0.4, s * 5, 0.8); c.fillRect(x - 0.4, y - s * 2.5, 0.8, s * 5); } } }
    c.globalAlpha = 1;
  }
  /* REALISTIC: liquid pearl and coloured smoke, a distant universe in its dark half, the terminator folding with light */
  function sphereReal(c, cx, cy, R, M, t, lv) {
    const nv = M.nv, fold = lv >= 3 ? 1.6 : lv >= 2 ? 1.2 : 0.8, LP = lightPath(cx, cy, R, nv, t, fold), anti = [-nv[0], -nv[1], -nv[2]], bleed = lv >= 3 ? 0.35 : 0;
    const q = DunFiend.KIT.qq();
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
    // the dark hemisphere: midnight deepening to black, nebulae and stars inside it
    let g = c.createRadialGradient(cx - anti[0] * R * 0.4, cy + anti[1] * R * 0.4, R * 0.05, cx, cy, R * 1.05); g.addColorStop(0, '#4A2C88'); g.addColorStop(0.45, '#22185A'); g.addColorStop(0.8, '#0E0A2C'); g.addColorStop(1, '#05040E'); c.fillStyle = g; c.fillRect(cx - R, cy - R, R * 2, R * 2);
    c.save(); c.globalCompositeOperation = 'lighter'; [[0.4, -0.3, '#7A4AE8', 0.5], [-0.35, 0.25, '#3A5AE8', 0.4], [0.1, 0.45, '#C84AB8', 0.3]].forEach(([u, v, col, a], i) => { const rr = R * (0.8 + i * 0.2), x = cx + (u * Math.cos(t * -0.25) - v * Math.sin(t * -0.25)) * R, y = cy + (u * Math.sin(t * -0.25) + v * Math.cos(t * -0.25)) * R; c.globalAlpha = a; blitSized(c, glowSprite(col), x - rr, y - rr, rr * 2, rr * 2); }); c.restore();
    stars(c, cx, cy, R, anti, -t * 0.4, t, q >= 1 ? 46 : 24, false);
    // smoky swirls in the dark half, turning one way
    c.save(); c.fillStyle = 'rgba(120,80,210,.28)'; arms(cx, cy, R, anti, 5, 2.6, -t * 0.4, 0.2).forEach(a => fillArm(c, a)); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(160,110,255,.12)'; arms(cx, cy, R, anti, 5, 2.6, -t * 0.4 + 0.25, 0.09).forEach(a => fillArm(c, a)); c.restore();
    // the light hemisphere: white at the pole through gold to rose at its edge, with pearl swirls turning the other way
    c.save(); c.beginPath(); LP.path(c); c.clip();
    const pole = [cx + nv[0] * R * 0.6, cy - nv[1] * R * 0.6]; g = c.createRadialGradient(pole[0], pole[1], R * 0.02, pole[0], pole[1], R * 1.5); g.addColorStop(0, '#FFFDF4'); g.addColorStop(0.22, '#FFEAB8'); g.addColorStop(0.5, '#F6C277'); g.addColorStop(0.78, '#EC98B6'); g.addColorStop(1, '#9A5A8A'); c.fillStyle = g; c.fillRect(cx - R, cy - R, R * 2, R * 2);
    c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,240,.2)'; arms(cx, cy, R, nv, 4, 2.2, t * 0.4, 0.17).forEach(a => fillArm(c, a)); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(214,130,90,.22)'; arms(cx, cy, R, nv, 4, 2.2, t * 0.4 + 0.45, 0.07).forEach(a => fillArm(c, a)); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,200,120,.16)'; arms(cx, cy, R, nv, 4, 2.2, t * 0.4 + 0.45, 0.1).forEach(a => fillArm(c, a));
    if (q >= 1) { c.fillStyle = 'rgba(150,230,255,.14)'; arms(cx, cy, R, nv, 3, 1.4, -t * 0.25 + 1, 0.06).forEach(a => fillArm(c, a)); c.fillStyle = 'rgba(255,150,220,.14)'; arms(cx, cy, R, nv, 3, 1.6, -t * 0.25 + 2, 0.06).forEach(a => fillArm(c, a)); }   // the iridescence of pearl
    if (bleed) { c.globalCompositeOperation = 'source-over'; c.fillStyle = `rgba(40,20,90,${bleed})`; arms(cx, cy, R, nv, 3, 3.2, -t * 0.6, 0.12).forEach(a => fillArm(c, a)); }
    c.restore();
    if (bleed) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,220,150,${bleed * 0.6})`; arms(cx, cy, R, anti, 3, 3.2, t * 0.6, 0.1).forEach(a => fillArm(c, a)); c.restore(); }
    // the boundary, folding and burning white
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; [[R * 0.16, 'rgba(200,160,255,.16)'], [R * 0.07, 'rgba(255,230,255,.35)'], [R * 0.025, 'rgba(255,255,255,.85)']].forEach(([w, col]) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); LP.term.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }); c.restore();
    // volume: the limb darkened, a fresnel rim of pearl light
    g = c.createRadialGradient(cx - R * 0.15, cy - R * 0.2, R * 0.55, cx, cy, R); g.addColorStop(0, 'rgba(10,6,30,0)'); g.addColorStop(1, 'rgba(10,6,30,.55)'); c.fillStyle = g; c.fillRect(cx - R, cy - R, R * 2, R * 2);
    c.globalCompositeOperation = 'lighter'; c.lineWidth = R * 0.06; c.strokeStyle = 'rgba(255,215,245,.32)'; c.beginPath(); c.arc(cx, cy, R * 0.97, 0, TAU); c.stroke(); c.lineWidth = R * 0.025; c.strokeStyle = 'rgba(170,220,255,.4)'; c.beginPath(); c.arc(cx, cy, R * 0.99, Math.PI * 0.6, Math.PI * 1.6); c.stroke();
    c.restore();
    // the gloss of the pearl
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45; blitSized(c, glowSprite('#FFFFFF'), cx - R * 0.78, cy - R * 0.82, R * 0.7, R * 0.55); c.globalAlpha = 0.85; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(cx - R * 0.42, cy - R * 0.55, R * 0.13, R * 0.06, -0.6, 0, TAU); c.fill(); c.restore();
  }
  /* TOON: the same sphere in flat cel bands and ink */
  function sphereToon(c, cx, cy, R, M, t, lv) {
    const nv = M.nv, fold = lv >= 3 ? 1.6 : lv >= 2 ? 1.2 : 0.8, LP = lightPath(cx, cy, R, nv, t, fold), anti = [-nv[0], -nv[1], -nv[2]], lw = Math.max(2, R * 0.045);
    TN.shape(c, TN.ell(cx, cy, R, R), { col: '#4E3296', shade: '#2E1C66', shade2: '#1C1046', hi: '#7E5ED8', line: INK, r: R, lw, d1: 0.08, d2: 0.16, spec: false,
      inner: c2 => { c2.fillStyle = '#3A2478'; arms(cx, cy, R, anti, 5, 2.6, -t * 0.4, 0.2).forEach(a => fillArm(c2, a)); c2.fillStyle = '#6A4AC0'; arms(cx, cy, R, anti, 5, 2.6, -t * 0.4 + 0.3, 0.07).forEach(a => fillArm(c2, a)); stars(c2, cx, cy, R, anti, -t * 0.4, t, 26, true); } });
    TN.shape(c, LP.path, { col: '#FFF4DA', shade: '#FFD27A', shade2: '#F2A6B8', hi: '#FFFFFF', line: INK, r: R, lw, d1: 0.08, d2: 0.16, spec: false,
      inner: c2 => { c2.fillStyle = '#FFE4A0'; arms(cx, cy, R, nv, 4, 2.2, t * 0.4, 0.16).forEach(a => fillArm(c2, a)); c2.fillStyle = '#FFFFFF'; arms(cx, cy, R, nv, 4, 2.2, t * 0.4 + 0.4, 0.06).forEach(a => fillArm(c2, a)); } });
    TN.spec(c, cx - R * 0.42, cy - R * 0.55, R * 0.14, -0.6, 0.9);
  }
  /* a ribbon of aura: realistic as layered light, toon as an inked band; only the half asked for (behind or in front) */
  function ribColor(i, u, t) { if (i !== 2) return SW[i].col; const k = ((u * 6 + t * 0.8) % 6 + 6) % 6, a = Math.floor(k), b = (a + 1) % 6; return DunFiend.KIT.mixC(PRISM[a], PRISM[b], k - a); }
  function paintRibbon(c, style, pts, i, cx, cy, T, t, M, front, glowUnder) {
    const S = M.sw[i], scr = pts.map(p => ({ x: cx + p.x * T, y: cy - p.y * T, w: p.w * T, u: p.u, f: p.z > 0 && Math.hypot(p.x, p.y, p.z) > R0 * 0.98 })), glowK = 0.7 + S.glow * 0.6;
    if (style === 'real') {
      const q = DunFiend.KIT.qq(), passes = q >= 1 ? [[3.6, 0.06], [2.2, 0.12], [1.2, 0.26], [0.45, 0.5], [0.14, 0.55]] : [[2.0, 0.18], [0.6, 0.45]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'butt';
      // a smoky body first: soft puffs along the ribbon, so it reads as mist rather than a line
      if (q >= 1) for (let j = 1; j < scr.length - 1; j += 2) { const p = scr[j]; if (p.f !== front) continue; const rr = p.w * 2.4 + 2; c.globalAlpha = 0.16 * glowK * (front ? 0.85 : 0.6); blitSized(c, glowSprite(ribColor(i, p.u, t)), p.x - rr + Math.sin(t * 2 + j) * p.w * 0.5, p.y - rr, rr * 2, rr * 2); } c.globalAlpha = 1;
      passes.forEach(([wk, a], pi) => { for (let j = 0; j < scr.length - 1; j++) { const p = scr[j], q2 = scr[j + 1]; if ((p.f && q2.f) !== front) continue;
          c.strokeStyle = rgba(pi === passes.length - 1 ? '#FFFFFF' : ribColor(i, p.u, t), a * glowK * (front ? 0.85 : 0.65)); c.lineWidth = Math.max(1, (p.w + q2.w) / 2 * wk); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q2.x, q2.y); c.stroke(); } });
      // sparks trailing off the ribbon
      for (let j = 4; j < scr.length; j += 4) { const p = scr[j]; if (p.f !== front) continue; const tw = 0.5 + 0.5 * Math.sin(t * 6 + j + i * 3); c.globalAlpha = tw * 0.8; c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(p.x + Math.sin(t * 3 + j) * T * 0.4, p.y + Math.cos(t * 2.5 + j) * T * 0.4, 1.4, 0, TAU); c.fill(); }
      c.restore(); return;
    }
    // a soft glow beneath the inked band (the hybrid style), so it still reads as light
    const SK = M.skipP || {};
    // (its puffs are capped in size: the great spiral of stage three widens the ribbons, and glows that grew with them
    // cost more to paint than all the rest of it while adding nothing the eye can see on the pale marble)
    if (glowUnder && !SK.glowU) { const wide = (M.spiral || 0) > 0.4, dj = wide ? 3 : 2; c.save(); c.globalCompositeOperation = 'lighter'; for (let j = 1; j < scr.length - 1; j += dj) { const p = scr[j]; if (p.f !== front) continue; const rr = Math.min(p.w * 2.2 + 3, T * 1.5 + 3); c.globalAlpha = (wide ? 0.26 : 0.2) * glowK; blitSized(c, glowSprite(ribColor(i, p.u, t)), p.x - rr, p.y - rr, rr * 2, rr * 2); } c.restore(); }
    // toon: runs of consecutive segments on the asked side, each an inked tube
    const runs = []; let cur = null; scr.forEach(p => { if (p.f === front) { if (!cur) { cur = []; runs.push(cur); } cur.push(p); } else cur = null; });
    runs.forEach(run => { if (run.length < 2) return; const pts2 = run.map(p => [p.x, p.y]), wf = u => Math.max(1.5, run[Math.min(run.length - 1, Math.round(u * (run.length - 1)))].w);
      const base = i === 0 ? '#FFE9A8' : i === 1 ? '#6A48C0' : '#BFEFFF', shade = i === 0 ? '#F2B84A' : i === 1 ? '#3A2470' : '#7FB8E8', hi = i === 0 ? '#FFFFFF' : i === 1 ? '#A88AF0' : '#FFFFFF';
      TN.tubeLite(c, pts2, wf, { col: base, shade, hi, line: INK, lw: Math.max(1.5, T * 0.07), d2: 0.35, d1: 0.15, alpha: front ? 1 : 0.85,
        inner: i === 2 && !SK.inner ? (c2 => { const { L, R: Rr } = TN.ribbonPts(pts2, wf); for (let j = 0; j < L.length - 1; j++) { c2.fillStyle = ribColor(2, run[j].u, t); c2.beginPath(); c2.moveTo(L[j][0], L[j][1]); c2.lineTo(L[j + 1][0], L[j + 1][1]); c2.lineTo(Rr[j + 1][0], Rr[j + 1][1]); c2.lineTo(Rr[j][0], Rr[j][1]); c2.closePath(); c2.fill(); } }) : null }); });
    if (front) for (let j = 5; j < scr.length; j += 6) { const p = scr[j]; if (!p.f) continue; TN.twinkle(c, p.x + Math.sin(t * 3 + j) * T * 0.4, p.y + Math.cos(t * 2.5 + j) * T * 0.4, T * 0.16, '#FFFFFF', 0.5 + 0.5 * Math.sin(t * 6 + j)); }
  }
  /* the aura knot: energy drawn into one point; its ring shows how much is left */
  function drawKnot(c, style, swi, X, Y, T, t, frac, big) {
    const col = SW[swi].col, deep = SW[swi].deep, r = T * (big ? 1.25 : 0.85) * (0.9 + 0.1 * Math.sin(t * 9));
    c.save();
    if (style === 'real') { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7; blitSized(c, glowSprite(swi === 2 ? PRISM[Math.floor(t * 4) % 6] : col), X - r * 2.2, Y - r * 2.2, r * 4.4, r * 4.4); c.globalAlpha = 1; c.lineCap = 'round';
      for (let k = 0; k < 5; k++) { const a = t * 3 + k * TAU / 5; c.strokeStyle = rgba(swi === 2 ? PRISM[k] : col, 0.75); c.lineWidth = Math.max(1.5, r * 0.14); c.beginPath(); c.moveTo(X + Math.cos(a) * r * 1.6, Y + Math.sin(a) * r * 1.6); c.quadraticCurveTo(X + Math.cos(a + 1.2) * r * 0.9, Y + Math.sin(a + 1.2) * r * 0.9, X, Y); c.stroke(); }
      const g = c.createRadialGradient(X, Y, 0, X, Y, r * 0.6); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, rgba(col, 0.9)); g.addColorStop(1, rgba(deep, 0)); c.fillStyle = g; c.beginPath(); c.arc(X, Y, r * 0.6, 0, TAU); c.fill();
      c.globalCompositeOperation = 'source-over'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.arc(X, Y, r * 1.15, 0, TAU); c.stroke(); c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(X, Y, r * 1.15, -Math.PI / 2, -Math.PI / 2 + TAU * frac); c.stroke(); }
    else { const pts = []; for (let k = 0; k < 16; k++) { const a = -Math.PI / 2 + k / 16 * TAU + t * 1.5, rr = k % 2 ? r * 0.45 : r; pts.push([X + Math.cos(a) * rr, Y + Math.sin(a) * rr]); } TN.shape(c, TN.poly(pts), { col: swi === 1 ? '#8A6AE0' : col, shade: deep, hi: '#FFFFFF', line: INK, r, lw: Math.max(1.5, T * 0.07), spec: 0.9, specAt: [X - r * 0.3, Y - r * 0.35], specR: 0.3 });
      c.lineWidth = 4; c.strokeStyle = INK; c.beginPath(); c.arc(X, Y, r * 1.25, 0, TAU); c.stroke(); c.lineWidth = 2.5; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(X, Y, r * 1.25, -Math.PI / 2, -Math.PI / 2 + TAU * frac); c.stroke(); }
    c.restore();
  }
  /* a Lightward: a sigil set in the marble with a crystal floating over it; dim when it is put out, blazing when it is the shelter */
  function drawWard(c, FX, p, X, Y, T, t) {
    const M = FX.mem, style = sphereStyleOf(M.style || AION_STYLE), on = !M.wards || M.wards[p.i], shine = M.shine === p.i, r = WARD_R * T, cz = T * (1.7 + Math.sin(t * 1.6 + p.i) * 0.12);
    c.save();
    if (style === 'real') {
      if (on) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = shine ? 0.9 : 0.4; blitSized(c, glowSprite(GOLD), X - r * 1.3, Y - r * 0.6, r * 2.6, r * 1.2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      c.strokeStyle = on ? 'rgba(200,160,70,.85)' : 'rgba(140,134,128,.6)'; c.lineWidth = 2; c.beginPath(); c.ellipse(X, Y, r, r * 0.92, 0, 0, TAU); c.stroke(); c.lineWidth = 1.2; c.beginPath(); c.ellipse(X, Y, r * 0.75, r * 0.7, 0, 0, TAU); c.stroke();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + t * 0.1; c.beginPath(); c.moveTo(X + Math.cos(a) * r * 0.3, Y + Math.sin(a) * r * 0.28); c.lineTo(X + Math.cos(a) * r * 0.7, Y + Math.sin(a) * r * 0.65); c.stroke(); }
      if (shine) { c.globalCompositeOperation = 'lighter'; const a0 = c.globalAlpha; c.globalAlpha = a0 * 0.6; blitSized(c, columnSprite('#FFF0C8'), X - r * 1.05, Y - T * 9, r * 2.1, T * 9); c.globalAlpha = a0; c.globalCompositeOperation = 'source-over'; }
      // the crystal
      const w = T * 0.38 * (0.75 + 0.25 * Math.abs(Math.cos(t * 0.9 + p.i))), h = T * 0.9, y0 = Y - cz; const g = c.createLinearGradient(X - w, y0 - h, X + w, y0 + h); g.addColorStop(0, on ? '#FFFFFF' : '#D8D4CC'); g.addColorStop(0.5, on ? '#FFE9A8' : '#A8A49C'); g.addColorStop(1, on ? '#C88A3A' : '#6A6660'); c.fillStyle = g; c.beginPath(); c.moveTo(X, y0 - h); c.lineTo(X + w, y0); c.lineTo(X, y0 + h * 0.7); c.lineTo(X - w, y0); c.closePath(); c.fill(); c.strokeStyle = on ? 'rgba(255,255,255,.8)' : 'rgba(80,76,70,.6)'; c.lineWidth = 1; c.stroke();
      if (on) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = shine ? 1 : 0.55; blitSized(c, glowSprite(GOLD), X - T * 1.2, y0 - T * 1.2, T * 2.4, T * 2.4); }
    } else {
      TN.shape(c, TN.ell(X, Y, r, r * 0.92), { col: on ? '#FFF2CC' : '#CFCBC4', shade: on ? '#F2C870' : '#ABA79F', hi: '#FFFFFF', line: INK, r, lw: 2, d2: 0.12, spec: false, alpha: 0.85,
        inner: c2 => { c2.strokeStyle = on ? '#C8902A' : '#8A867E'; c2.lineWidth = 2; c2.beginPath(); c2.ellipse(X, Y, r * 0.7, r * 0.64, 0, 0, TAU); c2.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c2.beginPath(); c2.moveTo(X + Math.cos(a) * r * 0.25, Y + Math.sin(a) * r * 0.23); c2.lineTo(X + Math.cos(a) * r * 0.62, Y + Math.sin(a) * r * 0.57); c2.stroke(); } } });
      if (shine) { c.globalAlpha = 0.7; blitSized(c, columnSprite('#FFF4D0'), X - r * 0.95, Y - T * 9, r * 1.9, T * 9); c.globalAlpha = 1; }
      const w = T * 0.4, h = T * 0.9, y0 = Y - cz; TN.shape(c, TN.poly([[X, y0 - h], [X + w, y0], [X, y0 + h * 0.7], [X - w, y0]]), { col: on ? '#FFE9A8' : '#B8B4AC', shade: on ? '#F2B84A' : '#8A867E', hi: '#FFFFFF', line: INK, r: h, lw: 2, spec: on ? 0.9 : 0, specAt: [X - w * 0.3, y0 - h * 0.4] });
      if (on) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = shine ? 0.9 : 0.4; blitSized(c, glowSprite(GOLD), X - T * 1.1, y0 - T * 1.1, T * 2.2, T * 2.2); }
    }
    c.restore();
  }
  /* the symbols of the three-part sequence */
  function symbol(c, x, y, r, kind, cur) {
    const sw = SW_OF[kind], col = SW[sw].col; c.save(); c.translate(x, y); c.fillStyle = 'rgba(20,10,40,.75)'; c.beginPath(); c.arc(0, 0, r * 1.25, 0, TAU); c.fill(); c.strokeStyle = cur ? '#FFFFFF' : col; c.lineWidth = cur ? 3 : 1.5; c.stroke(); c.fillStyle = col;
    if (sw === 0) { c.beginPath(); c.arc(0, 0, r * 0.45, 0, TAU); c.fill(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.fillRect(Math.cos(a) * r * 0.7 - 1.2, Math.sin(a) * r * 0.7 - 1.2, 2.4, 2.4); } }
    else if (sw === 1) { c.beginPath(); c.arc(0, 0, r * 0.7, 0, TAU); c.fill(); c.fillStyle = 'rgba(20,10,40,1)'; c.beginPath(); c.arc(r * 0.3, -r * 0.15, r * 0.6, 0, TAU); c.fill(); }
    else { for (let k = 0; k < 4; k++) { c.fillStyle = PRISM[k + (kind === 'meteor' ? 2 : 0)]; c.save(); c.rotate(k * Math.PI / 2); c.beginPath(); c.moveTo(0, -r * 0.8); c.lineTo(r * 0.2, 0); c.lineTo(-r * 0.2, 0); c.closePath(); c.fill(); c.restore(); } }
    c.restore();
  }
  /* ---- the spells on the ground ---- */
  function drawPillars(c, z, FX, T, t) { const u = z.age / z.life, X = FX.sx(z.x), Y = FX.sy(z.y); c.save(); c.globalCompositeOperation = 'lighter'; for (let j = 0; j <= 10; j++) { const v = j / 10, x = X + Math.cos(z.a) * z.len * T * v, y = Y + Math.sin(z.a) * z.len * T * v, h = T * 5 * (1 - u), w = T * z.w * 0.5; c.globalAlpha = 0.8 * (1 - u); blitSized(c, columnSprite('#FFF0BE'), x - w * 1.5, y - h, w * 3, h); } c.restore(); }
  function drawEventide(c, z, FX, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y), r = z.r * T, f = Math.min(1, (z.life - z.age) * 2); c.save(); c.lineCap = 'round'; const segs = []; const gs = z.gaps.map(g => [g - z.gw, g + z.gw]).sort((a, b) => a[0] - b[0]); for (let i = 0; i < gs.length; i++) { const nx = gs[(i + 1) % gs.length][0] + (i === gs.length - 1 ? TAU : 0); segs.push([gs[i][1], nx]); }
    segs.forEach(([a0, a1]) => { c.strokeStyle = `rgba(20,8,40,${0.65 * f})`; c.lineWidth = T * 1.1; c.beginPath(); c.arc(X, Y, r, a0, a1); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(154,106,232,${0.6 * f})`; c.lineWidth = T * 0.35; c.beginPath(); c.arc(X, Y, r, a0, a1); c.stroke(); c.globalCompositeOperation = 'source-over'; }); c.restore(); }
  function drawMist(c, z, FX, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y), f = Math.min(1, z.age * 3, (z.life - z.age) * 2); c.save(); c.translate(X, Y); c.rotate(z.a); c.globalAlpha = 0.55 * f; for (let j = 0; j < 12; j++) { const x = (j / 12) * z.len * T + Math.sin(t * 2 + j) * T * 0.3; blitSized(c, glowSprite('#DFF4FF'), x - T * 1.4, -T * 1.2, T * 2.8, T * 2.4); } c.restore(); }
  function drawFront(c, z, FX, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y); c.save(); c.translate(X, Y); c.rotate(Math.atan2(z.ny, z.nx)); c.fillStyle = 'rgba(200,154,90,.6)'; for (let j = -16; j <= 16; j += 0.8) { if (Math.abs(j - z.gap) < 1.6) continue; c.beginPath(); c.arc(j * T, Math.sin(j * 2 + t * 10) * T * 0.2, T * (0.45 + 0.15 * Math.sin(j * 3 + t * 6)), 0, TAU); c.fill(); } c.restore(); }
  function drawGapMark(c, z, FX, T, t) { const C = FX.C, X0 = z.x, Y0 = z.y; c.save(); c.strokeStyle = 'rgba(143,232,176,.55)'; c.lineWidth = 2; c.setLineDash([6, 6]); for (const s of [-1, 1]) { const ox = z.nx * (z.gap + s * 1.6), oy = z.ny * (z.gap + s * 1.6); c.beginPath(); c.moveTo(FX.sx(X0 + ox), FX.sy(Y0 + oy)); c.lineTo(FX.sx(X0 + ox + Math.cos(z.a) * C.R * 2), FX.sy(Y0 + oy + Math.sin(z.a) * C.R * 2)); c.stroke(); } c.restore(); }
  function drawMeteor(c, z, FX, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y), u = clamp(z.age / z.life, 0, 1), h = (1 - u) * T * 12; c.save(); c.fillStyle = `rgba(20,10,40,${0.2 + u * 0.4})`; c.beginPath(); c.ellipse(X, Y, T * 2.5 * (0.4 + u * 0.6), T * 1.0 * (0.4 + u * 0.6), 0, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.font = `900 ${Math.round(T * 0.8)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(z.i + 1), X, Y); if (u > 0.4) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = (u - 0.4) / 0.6; blitSized(c, glowSprite(PRISM[z.i * 2]), X - T, Y - h - T, T * 2, T * 2); c.fillStyle = '#3A2A40'; c.beginPath(); c.arc(X, Y - h, T * 0.55, 0, TAU); c.fill(); } c.restore(); }
  function drawDoomPulse(c, z, FX, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y), f = 1 - z.age / z.life; c.save(); c.strokeStyle = `rgba(20,8,40,${0.7 * f})`; c.lineWidth = T * 2.2; c.beginPath(); c.ellipse(X, Y, z.r * T, z.r * T * 0.95, 0, 0, TAU); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(154,106,232,${0.7 * f})`; c.lineWidth = T * 0.5; c.stroke(); c.restore(); }
})();
