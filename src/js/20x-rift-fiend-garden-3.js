/* ---------- CALYX ASTRUM THE STARBORN VINE ----------
   The garden's last boss, under the three moons: a serpent-dragon woven of starlit vines, as long as the Hollow is
   wide, with constellation blossoms along its length that glow and a head like a great closed flower-bud whose lower
   petal is a jaw of thorn-fangs; when the jaw opens there is a star burning in the bud's heart. Built on the same rig
   as Veilwrack (the head leads, the body follows its trail), but it slithers on the moss rather than flying, rearing
   its head up to call the stars down. Vine Whips lash lines across the Hollow from three of its body segments; Star
   Rain marks rings on the moss and stars fall into them; Bloom Burst opens the blossoms on its body and each one shoots
   a fan; Constrict coils round the pet in a ring with one gap. Three Star Blossoms grow on the floor and light one at
   a time: pour enough damage into the lit one and the vine seizes up, its bud opens and the star core is bared for six
   seconds. In the second phase the stars fall thicker and thornlings crawl out of its coils.
   It is never still: a wave runs down its body as it slithers (faster the quicker it goes), its blossoms pulse, its
   tendrils curl, it blinks and works its jaw; before the whips its body bunches, before the rain it rears up and
   opens its jaw to the sky, before a bloom its blossoms swell; struck, a jolt runs down it; seized, it goes rigid and
   trembles with its bud peeled open; it rears and roars on entering. */
RiftFiend.define({ id: 'calyx', name: 'Calyx Astrum', title: 'The Starborn Vine', color: '#3E7A68', glow: '#FFD36B', accent: '#FFF4C0', biome: 'garden', r: 2.3, els: ['earth', 'light'] }, (() => {
  const { TAU, TN } = RiftFiend, G = GardenFiend, N = 24, SEG = 0.62;
  const { PLUM, PLUM_SH, PLUM_HI, ROSE, ROSE_SH, ROSE_HI, JADE, JADE_SH, JADE_HI, CREAM, CREAM_SH, GOLD, INK, decay, toward, snap } = G;
  const VINE = '#3E7A68', VINE_SH = '#1F4A3E', VINE_HI = '#86C9B2', BLOOM = [4, 9, 14, 19], WHIP = [6, 12, 18], BL_A = [Math.PI / 2 + 0.3, Math.PI / 2 + 0.3 + TAU / 3, Math.PI / 2 + 0.3 - TAU / 3];
  const lerp = (a, b, u) => a + (b - a) * u, blossomAt = (C, i) => [C.x + Math.cos(BL_A[i]) * (C.R - 3.6), C.y + Math.sin(BL_A[i]) * (C.R - 3.6)];
  const pulse = t => 0.7 + 0.3 * Math.sin(t * 2.4);
  return {
    arenaR: 15, firstAct: 'circle', artY: 0.5, ambient: 'motes',
    artPoses: [{ name: 'slithering', mem: { demoA: 0.3 } }, { name: 'rearing to call the stars', mem: { demoA: 1.6, alt: 2, jaw: 0.6, menace: 1 } }, { name: 'the blossoms open', mem: { demoA: 2.6, bloom: 1 } }, { name: 'seized: the star core bared', mem: { demoA: 1.0, seize: 1, open: 1, jaw: 1 } }],
    phaseNames: ['The Hollow', 'The Star Fall', 'The Thorn Night', 'The Last Star'],
    paintGround(c, A) { G.floor(c, A, { mid: '#2E1E3C', edge: '#1F1229', extra: (c2, A2) => { const R = A2.R;
      // the Hollow: three beds where the star blossoms grow, and a dial of moonlight across the floor
      BL_A.forEach(a => { const x = Math.cos(a) * (R - 3.6), y = Math.sin(a) * (R - 3.6); c2.fillStyle = '#3A2449'; c2.beginPath(); c2.ellipse(x, y + 0.2, 1.8, 1.0, 0, 0, TAU); c2.fill(); c2.strokeStyle = 'rgba(255,211,107,.35)'; c2.lineWidth = 0.14; c2.stroke(); });
      c2.strokeStyle = 'rgba(255,244,192,.14)'; c2.lineWidth = 0.2; for (let i = 0; i < 3; i++) { c2.beginPath(); c2.arc(0, 0, 3 + i * 3.2, 0, TAU); c2.stroke(); } c2.save(); c2.globalCompositeOperation = 'lighter'; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = 3 + (i % 3) * 3.2; c2.fillStyle = 'rgba(255,244,192,.5)'; c2.beginPath(); c2.arc(Math.cos(a) * r, Math.sin(a) * r, 0.12, 0, TAU); c2.fill(); } c2.restore(); } }); },
    sky(c, W, H, t, cam, T) { G.sky(c, W, H, t, cam, T, { top: '#0A0614', mid: '#1E1030', bot: '#080410' }); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m; m.x = FX.C.x; m.y = FX.C.y - 4; FX.m.act = 'enter';
      Object.assign(M, { hd: Math.PI / 2, alt: 0.45, jaw: 0, open: 0, seize: 0, bloom: 0, bunch: 0, menace: 0, roar: 0, recoil: 0, blink: 0, blinkT: 2.5, clack: 0, clackT: 2, trail: [], px: m.x, py: m.y, vx: 0, vy: 0, spd: 0, wph: 0, lit: -1, litT: 6, blossoms: BL_A.map(() => ({ obj: null, respawnT: 0 })), rain: [], broodT: 13, wasEnter: true, roared: false, wasStun: false, tremT: 0 });
      for (let i = 0; i < 70; i++) M.trail.push({ x: m.x, y: m.y - i * 0.2, z: 0.45 });
      BL_A.forEach((a, i) => spawnBlossom(FX, i)); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; M.roar = 1; M.jaw = 1; M.menace = 1; M.bloom = 1; M.broodT = 4; FX.H.shake(10, 0.5); FX.H.flash(0.2, GOLD); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - 1.5, GOLD, 20, 8);
      const B = body(M); for (let i = 0; i < 2; i++) { const p = B[8 + i * 6]; FX.minion('thornling', p.x, p.y); }
      if (lv >= 2) FX.H.banner('THE STAR FALL', 'The stars fall thicker; thornlings crawl from its coils', GOLD, 2.6, true); if (lv >= 4) FX.H.banner('The Last Star', 'The sky comes down', '#FF6A5A', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, fast = (1 + (P - 1) * 0.08) * FX.S.fast, d = FX.dist(m.x, m.y); m.actT += dt;
      // the star blossoms: one lights at a time; a dead one regrows
      M.blossoms.forEach((h, i) => { if ((!h.obj || h.obj.dead) && !h.respawnT) h.respawnT = 14; if (h.respawnT) { h.respawnT -= dt; if (h.respawnT <= 0) { h.respawnT = 0; spawnBlossom(FX, i); } } });
      if (M.lit < 0) { M.litT -= dt; if (M.litT <= 0) { const alive = M.blossoms.map((h, i) => (h.obj && !h.obj.dead ? i : -1)).filter(i => i >= 0); if (alive.length) lightBlossom(FX, alive[Math.floor(Math.random() * alive.length)]); else M.litT = 2; } }
      if (P >= 2 && (M.broodT -= dt) <= 0 && m.act === 'circle') { M.broodT = P >= 4 ? 9 : 12; const B = body(M); for (let i = 0; i < 2; i++) { const p = B[8 + i * 6]; FX.minion('thornling', p.x, p.y); } FX.H.text(m.x, m.y - 2, 'Thornlings crawl from its coils', '#B98BE0', 13); }
      let menace = 0, altW = 0.45, jaw = 0, bunch = 0, bloom = 0;
      switch (m.act) {
        case 'circle': { M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.5 * fast * (M.dir || 1); const R = 6.5 + Math.sin(m.t * 0.7) * 1.5, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 2); slither(FX, m, M, p.x, p.y, 6.5 * fast, dt, 2.6);
          if (m.actT > (P >= 3 ? 1.4 : 1.9) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; pick(FX, m, d, P); } break; }
        case 'whips': { menace = m.actT < M.ww ? 0.9 : 0.3; bunch = m.actT < M.ww ? Math.min(1, m.actT / 0.6) : 0; slither(FX, m, M, m.x, m.y, 1, dt, 1); if (m.actT > M.ww + 0.7) { m.act = 'circle'; m.actT = 0; } break; }
        case 'rain': { menace = 1; altW = 2.2; jaw = Math.min(1, m.actT / 0.8); slither(FX, m, M, m.x, m.y, 1, dt, 1); if (m.actT > M.rw + 0.8) { m.act = 'circle'; m.actT = 0; M.recoil = 0.6; } break; }
        case 'bloom': { const drawn = m.actT < 0.9; menace = 0.7; bloom = drawn ? Math.min(1, m.actT / 0.7) : 1; slither(FX, m, M, m.x, m.y, 1, dt, 1); M.blT = (M.blT || 0) - dt;
          if (!drawn && M.blN > 0 && M.blT <= 0) { M.blT = 0.6; M.blN--; const B = body(M); BLOOM.forEach((i, k) => { const p = B[i], a = Math.atan2(me.y - p.y, me.x - p.x); FX.fan(p.x, p.y, a + (k - 1.5) * 0.08, 5, 0.8, 6 * fast, { dmg: m.dmg * 0.5, color: GOLD, core: '#FFFFFF', r: 0.24 }); FX.H.sparks(p.x, p.y - 0.5, GOLD, 6, 4); }); FX.H.sfx.hum(); M.recoil = 0.3; }
          if (m.actT > 0.9 + (P >= 2 ? 1.4 : 0.9)) { m.act = 'circle'; m.actT = 0; } break; }
        case 'constrict': { const L = M.cl, a = L.a0 + m.actT * 3.0, p = { x: L.x + Math.cos(a) * 3.6, y: L.y + Math.sin(a) * 3.6 }; slither(FX, m, M, p.x, p.y, 11 * fast, dt, 6); menace = 0.6; bunch = 0.4; if (m.actT > L.wait + 0.5) { m.act = 'circle'; m.actT = 0; } break; }
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3); M.alt = toward(M.alt, altW, dt, altW > M.alt ? 2.5 : 4); M.jaw = toward(M.jaw, Math.max(jaw, M.roar || 0), dt, jaw > M.jaw ? 3 : 4); M.bunch = toward(M.bunch, bunch, dt, 4); M.bloom = toward(M.bloom, bloom, dt, bloom > M.bloom ? 3 : 2); M.seize = decay(M.seize, dt, 2); M.open = decay(M.open, dt, 2);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.seize = Math.min(1, M.seize + dt * 3); M.open = Math.min(1, M.open + dt * 2); M.jaw = toward(M.jaw, 1, dt, 3); M.alt = toward(M.alt, 1.4, dt, 3); M.menace = decay(M.menace, dt, 4); M.bloom = decay(M.bloom, dt, 3); M.bunch = decay(M.bunch, dt, 3);
      const h = headAt(M); FX.weak('core', h[0], h[1] - h[2], 1.3, 2.4, m.stunT > 0.05);
      // rigid and trembling: a leaf shakes loose now and then
      M.tremT -= dt; if (M.tremT <= 0) { M.tremT = 0.4; const B = body(M), p = B[Math.floor(Math.random() * N)]; FX.H.part({ kind: 'petal', x: p.x, y: p.y - p.z, vx: FX.rnd(-1, 1), vy: 1, g: 2.5, life: 1, max: 1, size: 4, rot: Math.random() * 3, color: JADE_HI }); FX.H.shake(1.5, 0.08); }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return;
      if (!(m.stunT > 0)) { if (FX.S.weak.core) FX.weak('core', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.litT = 6; M.recoil = 0.8; M.roar = 0.5; FX.H.text(m.x, m.y - 2, 'The vine stirs again', GOLD, 13); } } else M.wasStun = true;
      // how it moves: its speed drives the wave down its body
      if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt; M.px = m.x; M.py = m.y; M.vx = toward(M.vx, vx, dt, 10); M.vy = toward(M.vy, vy, dt, 10); M.spd = toward(M.spd, Math.hypot(vx, vy), dt, 6); }
      M.wph += dt * (2.6 + M.spd * 0.7) * (1 - (M.seize || 0) * 0.9);
      M.recoil = decay(M.recoil, dt, 2.2); M.roar = decay(M.roar, dt, 0.8);
      if (M.rain.length) M.rain = M.rain.filter(s => FX.S.tele.includes(s));
      // the eyes blink; the jaw works now and then
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 3 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.12; M.blink = Math.sin(Math.min(1, M.blinkU) * Math.PI); if (M.blinkU >= 1) { M.blinkU = null; M.blink = 0; } }
      M.clackT -= dt; if (M.clackT <= 0) { M.clackT = 2 + Math.random() * 3; M.clackU = 0; } if (M.clackU != null) { M.clackU += dt / 0.5; M.clack = Math.sin(Math.min(1, M.clackU) * Math.PI) * 0.4; if (M.clackU >= 1) { M.clackU = null; M.clack = 0; } }
      // the entrance: it uncoils out of the Hollow's floor, rears up with a roar and strikes at the pet before it begins
      if (m.act === 'enter') { const e = FX.S.enterT || 0; if (e > 1.4) { if (e < 2.7 && FX.dist(m.x, m.y) > 3) slither(FX, m, M, FX.me.x, FX.me.y, 6, dt, 4); M.jaw = Math.min(1, M.jaw + dt * 3); M.alt = toward(M.alt, 1.8, dt, 3); M.menace = toward(M.menace, 1, dt, 5); if (!M.roared) { M.roared = true; FX.H.sfx.crash(); FX.H.shake(6, 0.3); } } }
      else if (M.wasEnter) { M.wasEnter = false; M.recoil = 1; M.bloom = 1; M.roar = 0.6; FX.H.sfx.thud(); } },
    dmgK() { return 1; },
    keep: { every: 2 },
    draw(c, FX, m, X, Y, T, t) { drawVine(c, FX, m, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'blossom') drawBlossom(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { const M = FX.mem; if (!M.rain) return;
      // the stars coming down: high over their rings, falling faster toward the end, with a tail
      for (const s of M.rain) { if (s.done) continue; const u = clamp(s.age / s.t, 0, 1), X = FX.sx(s.x), Y = FX.sy(s.y), h = (1 - u * u) * T * 9, y = Y - h; if (y < -40) continue; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.4 * u; softRay(c, X + T * 0.5, y - T * 2.2 * (1 - u * 0.6), X, y, T * 0.2, GOLD, 0.6, 0.5); c.globalAlpha = 1; blitSized(c, glowSprite(GOLD), X - T * 0.6, y - T * 0.6, T * 1.2, T * 1.2); TN.twinkle(c, X, y, T * (0.25 + 0.1 * Math.sin(t * 9)), '#FFFFFF', 1); c.restore(); } },
  };
  /* ---- the star blossoms on the floor ---- */
  function spawnBlossom(FX, i) { const p = blossomAt(FX.C, i), h = FX.mem.blossoms[i]; h.obj = FX.obj({ kind: 'blossom', x: p[0], y: p[1], r: 0.95, hp: FX.S.barHP * 0.03, idx: i, invuln: true, onKill: o => { const m = FX.m, M = FX.mem; if (!m || m.dead) return; if (M.lit === i) M.lit = -1; FX.H.boom(o.x, o.y, 1.4, GOLD, '#FFFFFF', { n: 18, shake: 8 }); FX.H.sfx.crack(); for (let k = 0; k < 10; k++) FX.H.part({ kind: 'petal', x: o.x, y: o.y - 0.5, vx: FX.rnd(-3, 3), vy: FX.rnd(-4, -1), g: 6, life: 0.9, max: 0.9, size: 4, rot: Math.random() * 3, color: CREAM }); seize(FX, m); } }); }
  function lightBlossom(FX, i) { const M = FX.mem, o = M.blossoms[i].obj; M.lit = i; M.blossoms.forEach((h, k) => { if (h.obj && !h.obj.dead) h.obj.invuln = k !== i; }); o.hp = o.maxhp; FX.H.banner('A STAR BLOSSOM LIGHTS', `Blossom ${i + 1} is lit: break it to seize the vine`, GOLD, 2.2, true); FX.H.sfx.chime(); FX.H.ring(o.x, o.y, 0.3, 3, 0.6, GOLD, 0.3); }
  function seize(FX, m) { const M = FX.mem; m.stunT = 6; m.act = 'circle'; m.actT = 0; M.seize = 0; M.open = 0; FX.S.tele.length = 0; M.rain.length = 0; M.blossoms.forEach(h => { if (h.obj && !h.obj.dead) h.obj.invuln = true; }); FX.H.banner('THE VINE SEIZES', 'Its bud peels open: strike the star core!', GOLD, 2.2, true); FX.H.shake(12, 0.5); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - 1.5, GOLD, 18, 7); }
  function drawBlossom(c, FX, o, X, Y, T, t) { const M = FX.mem, lit = M.lit === o.idx, cracked = 1 - o.hp / o.maxhp, k = lit ? pulse(t * 2 + o.idx) : 0.35 + 0.1 * Math.sin(t * 1.5 + o.idx), sway = Math.sin(t * 1.4 + o.idx * 2) * 0.06; c.save();
    c.fillStyle = 'rgba(10,6,4,.3)'; c.beginPath(); c.ellipse(X, Y + T * 0.1, T * 0.7, T * 0.26, 0, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = (lit ? 0.6 : 0.2) * k + (lit ? 0.2 : 0); blitSized(c, glowSprite(GOLD), X - T * 2.2, Y - T * 2.8, T * 4.4, T * 4.4); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // a stem with sepals, and a star-flower on it: five cream petals round a gold heart, wide open when lit, half closed asleep
    c.strokeStyle = INK; c.lineWidth = Math.max(2, T * 0.26); c.lineCap = 'round'; c.beginPath(); c.moveTo(X, Y); c.quadraticCurveTo(X + sway * T * 4, Y - T * 0.8, X + sway * T * 3, Y - T * 1.5); c.stroke(); c.strokeStyle = JADE; c.lineWidth = Math.max(1, T * 0.14); c.stroke();
    [-1, 1].forEach(sd => TN.shape(c, TN.blob([[X, Y + T * 0.05], [X + sd * T * 0.45, Y - T * 0.4], [X + sd * T * 1.0, Y - T * 0.25], [X + sd * T * 0.55, Y + T * 0.15]]), { col: JADE, shade: JADE_SH, hi: JADE_HI, line: INK, r: T * 0.45, lw: Math.max(1.2, T * 0.06), force: true }));
    const fx = X + sway * T * 3, fy = Y - T * 1.55, open = lit ? 1 : 0.55; c.translate(fx, fy); c.rotate(sway + (lit ? Math.sin(t * 3) * 0.04 : 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2 + (lit ? t * 0.3 : 0), r = T * (0.3 + open * 0.4); TN.shape(c, TN.ell(Math.cos(a) * r, Math.sin(a) * r * 0.8, T * 0.34 * open + T * 0.1, T * 0.2, a), { col: lit ? '#FFF4D6' : CREAM, shade: CREAM_SH, hi: '#FFFFFF', line: INK, r: T * 0.3, lw: Math.max(1.2, T * 0.06), spec: false, force: true }); }
    if (cracked > 0.3) { c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-T * 0.5, -T * 0.2); c.lineTo(-T * 0.15, T * 0.05); c.lineTo(-T * 0.35, T * 0.4); c.stroke(); }
    c.fillStyle = lit ? '#FFFFFF' : GOLD; c.strokeStyle = INK; c.lineWidth = Math.max(1.2, T * 0.06); c.beginPath(); for (let k2 = 0; k2 < 10; k2++) { const a = -Math.PI / 2 + k2 * Math.PI / 5 + (lit ? t * 1.5 : 0), rr = k2 % 2 ? T * 0.13 : T * 0.28; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke();
    c.restore();
    if (lit) { c.save(); c.font = `800 ${Math.round(T * 0.26)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText('LIT · break it', X, Y - T * 2.9); c.fillText('LIT · break it', X, Y - T * 2.9); c.restore(); } }
  /* ---- the body: the head leads, the rest follows its trail (Veilwrack's rig, on the ground) ---- */
  function push(M, m) { const tr = M.trail, last = tr[0]; if (!last || Math.hypot(m.x - last.x, m.y - last.y) > 0.1) { const K = Math.min(18, tr.length - 1); if (K >= 10 && Math.hypot(m.x - tr[K].x, m.y - tr[K].y) < 1.5) { tr[0] = { x: m.x, y: m.y, z: M.alt }; return; } tr.unshift({ x: m.x, y: m.y, z: M.alt }); if (tr.length > 160) tr.pop(); } }
  function slither(FX, m, M, tx, ty, spd, dt, turn) { const d = Math.hypot(tx - m.x, ty - m.y); if (d > 0.2) { const want = Math.atan2(ty - m.y, tx - m.x); M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * (turn || 2.2))); } const v = Math.min(spd, d * 3); m.x += Math.cos(M.hd) * v * dt; m.y += Math.sin(M.hd) * v * dt; const q = FX.clampArena(m, 1.2); m.x = q.x; m.y = q.y; push(M, m); }
  function body(M) { const pts = [], tr = M.trail; let acc = 0; pts.push({ x: tr[0].x, y: tr[0].y, z: M.alt });
    for (let i = 1; i < tr.length && pts.length < N; i++) { const a = tr[i - 1], b = tr[i], d = Math.hypot(b.x - a.x, b.y - a.y); acc += d; while (acc >= SEG && pts.length < N) { acc -= SEG; const u = 1 - acc / (d || 1); pts.push({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 0.45 }); } }
    while (pts.length < N) { const l = pts[pts.length - 1]; pts.push({ x: l.x, y: l.y - 0.3, z: 0.45 }); }
    // the neck eases the head's height down into the body
    for (let i = 1; i < 5; i++) pts[i].z = lerp(M.alt, 0.45, i / 5);
    return pts; }
  function headAt(M) { const h = body(M)[0]; return [h.x, h.y, h.z]; }
  function bodyParts(m, M) { const B = body(M), out = [{ key: 'head', dx: 0, dy: -M.alt, r: 1.3 }]; [4, 8, 12, 16, 20].forEach((i, k) => { const p = B[i]; out.push({ key: 'b' + k, dx: p.x - m.x, dy: p.y - p.z - m.y, r: 1.0 - k * 0.08 }); }); return out; }
  /* ---- choosing ---- */
  function pick(FX, m, d, P) { const r = Math.random(); if (r < 0.28) startWhips(FX, m); else if (r < 0.52) startRain(FX, m); else if (r < 0.76) startBloom(FX, m); else startConstrict(FX, m); }
  function startWhips(FX, m) { const M = FX.mem, me = FX.me, P = FX.S.lv, wait = 1.2 / FX.S.fast, B = body(M), segs = P >= 2 ? WHIP.concat([3]) : WHIP; m.act = 'whips'; m.actT = 0; M.ww = wait; FX.H.sfx.hum();
    segs.forEach((i, k) => { const p = B[i], a = Math.atan2(me.y - p.y, me.x - p.x) + (k === 3 ? 0.5 : 0); FX.tele({ shape: 'line', x: p.x, y: p.y, a, len: 9.5, w: 1.5, t: wait + k * 0.15, dmg: m.dmg * 1.4, col: JADE_HI, fn: s => { M.recoil = Math.max(M.recoil, 0.5); FX.H.part({ kind: 'slash', x: s.x + Math.cos(s.a) * 4, y: s.y + Math.sin(s.a) * 4, a: s.a, r: 3, life: 0.3, max: 0.3, color: JADE_HI }); FX.H.sparks(s.x + Math.cos(s.a) * 5, s.y + Math.sin(s.a) * 5, JADE_HI, 10, 6); FX.H.shake(6, 0.25); FX.H.sfx.whoosh(); } }); });
    FX.H.banner('VINE WHIPS', 'Off the lines', JADE_HI, 1.3, true); }
  function startRain(FX, m) { const M = FX.mem, me = FX.me, P = FX.S.lv, n = P >= 2 ? 10 : 6, wait = 1.3 / FX.S.fast; m.act = 'rain'; m.actT = 0; M.rain.length = 0; FX.H.sfx.hum();
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, dd = i === 0 ? 0 : 1.2 + Math.random() * 4.5, p = FX.clampArena({ x: me.x + Math.cos(a) * dd, y: me.y + Math.sin(a) * dd }, 1), s = FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.4, t: wait + i * 0.2, dmg: m.dmg * 1.3, col: GOLD, fn: s2 => { FX.H.boom(s2.x, s2.y, 1.3, GOLD, '#FFFFFF', { n: 14, shake: 5 }); FX.H.sfx.pop(); for (let k = 0; k < 4; k++) FX.H.part({ kind: 'star', x: s2.x, y: s2.y - 0.3, vx: FX.rnd(-2, 2), vy: FX.rnd(-3, -1), g: 5, life: 0.6, max: 0.6, size: 3, color: '#FFFFFF' }); } }); M.rain.push(s); }
    M.rw = wait + n * 0.2; FX.H.banner('STAR RAIN', 'Off the rings as the stars come down', GOLD, 1.5, true); }
  function startBloom(FX, m) { const M = FX.mem, P = FX.S.lv; m.act = 'bloom'; m.actT = 0; M.blN = P >= 2 ? 3 : 2; M.blT = 0; FX.H.sfx.hum(); FX.H.banner('BLOOM BURST', 'Its blossoms open and shoot: between the petals', CREAM, 1.4, true); }
  function startConstrict(FX, m) { const M = FX.mem, me = FX.me, wait = 1.4 / FX.S.fast, p = FX.clampArena({ x: me.x, y: me.y }, 4.5); m.act = 'constrict'; m.actT = 0; M.cl = { x: p.x, y: p.y, a0: Math.atan2(m.y - p.y, m.x - p.x), wait }; FX.H.sfx.hum();
    FX.tele({ shape: 'ring', x: p.x, y: p.y, r0: 2.3, r1: 4.8, gaps: [[Math.random() * TAU, 0.45]], t: wait, dmg: m.dmg * 1.5, col: JADE_HI, fn: () => { M.recoil = 0.5; M.bunch = 1; FX.H.sfx.crash(); FX.H.shake(8, 0.3); } }); FX.H.banner('CONSTRICT', 'Through the gap', JADE_HI, 1.2, true); }
  /* ---- painting: a serpent of woven vines, blossoms along it, a bud for a head ---- */
  function drawVine(c, FX, m, X, Y, T, t) {
    const K = FX.K, M = FX.mem;
    if (M.demoA != null && (!M.trail || !M.trail.length)) { M.hd = M.demoA; M.alt = M.alt || 0.45; M.trail = []; for (let i = 0; i < 90; i++) { const u = i * 0.15; M.trail.push({ x: m.x - Math.cos(M.hd) * u + Math.sin(u * 0.6) * 0.8 * Math.sin(M.hd), y: m.y - Math.sin(M.hd) * u - Math.sin(u * 0.6) * 0.8 * Math.cos(M.hd), z: 0.45 }); } }
    const SX = x => X + (x - m.x) * T, SY = y => Y + (y - m.y) * T, B = body(M), P = p => [SX(p.x), SY(p.y) - p.z * T], hs = m.hitSq || 0, roar = M.roar || 0, menace = M.menace || 0, recoil = M.recoil || 0, seize = M.seize || 0, open = M.open || 0, bloom = M.bloom || 0, bunch = M.bunch || 0, wph = M.wph == null ? t * 3 : M.wph;
    // the slithering: a wave runs down the body from the neck, side to side and a little up and down; bigger when it is
    // struck (a jolt), bunched up before a whip, gone when it is seized (a fine tremble instead)
    const amp = (1 + hs * 1.2 + bunch * 0.6) * (1 - seize * 0.95), trem = seize * 0.06;
    for (let i = 1; i < N; i++) { const u = i / (N - 1), a = B[Math.max(0, i - 1)], b = B[Math.min(N - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, s = Math.sin(wph - i * 0.55) * (0.12 + u * 0.55) * amp * Math.min(1, i / 3) + Math.sin(t * 40 + i) * trem, p = B[i]; p.x += -dy / d * s; p.y += dx / d * s; p.z += Math.max(0, Math.cos(wph * 0.8 - i * 0.5)) * 0.18 * amp * Math.min(1, i / 3); }
    if (recoil > 0) { const h = B[0], n = B[1], dx = h.x - n.x, dy = h.y - n.y, d = Math.hypot(dx, dy) || 1; h.x -= dx / d * recoil * 0.3; h.y -= dy / d * recoil * 0.3; h.z += recoil * 0.35; }
    const wfn = i => { const u = i / (N - 1); return T * (u < 0.1 ? 1.05 + u * 3.5 : 1.4 * Math.pow(1 - (u - 0.1) / 0.9, 0.7) + 0.12) * (1 + hs * 0.1 + roar * 0.08 + bunch * 0.12 * Math.sin(u * Math.PI)); };
    // shadows on the moss
    c.save(); c.strokeStyle = 'rgba(10,6,4,.35)'; c.lineCap = 'round'; for (let i = 0; i < N - 1; i++) { c.lineWidth = wfn(i) * 1.1; c.beginPath(); c.moveTo(SX(B[i].x), SY(B[i].y)); c.lineTo(SX(B[i + 1].x), SY(B[i + 1].y)); c.stroke(); } c.restore();
    const pts = B.map(P);
    // the woven body: a toon tube of vine green, three strands plaited down it, thorns along the edge, and the blossoms
    const tail = pts.slice().reverse();
    TN.tube(c, tail, u => wfn(N - 1 - Math.round(u * (N - 1))), { col: VINE, shade: VINE_SH, hi: VINE_HI, line: INK, r: T * 0.9, lw: Math.max(1.4, T * 0.08), d1: 0.12, d2: 0.26, force: true, inner: g => { g.save(); g.lineCap = 'round';
      for (let k = 0; k < 3; k++) { g.strokeStyle = k === 1 ? 'rgba(134,201,178,.45)' : 'rgba(31,74,62,.55)'; g.lineWidth = Math.max(1, T * (k === 1 ? 0.07 : 0.1)); g.beginPath(); for (let i = 0; i < N; i++) { const w = wfn(i) * 0.5, q = pts[i], nx = pts[Math.min(N - 1, i + 1)][0] - pts[Math.max(0, i - 1)][0], ny = pts[Math.min(N - 1, i + 1)][1] - pts[Math.max(0, i - 1)][1], nd = Math.hypot(nx, ny) || 1, off = Math.sin(i * 0.9 + k * 2.1 - wph * 0.3) * w * 0.6, x = q[0] - ny / nd * off, y = q[1] + nx / nd * off; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      // starlight down the spine: faint gold between the blossoms
      g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,211,107,${0.18 + bloom * 0.25 + open * 0.3})`; g.lineWidth = Math.max(1, T * 0.12); g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1] - wfn(i) * 0.2) : g.moveTo(q[0], q[1] - wfn(i) * 0.2)); g.stroke(); g.restore(); } });
    // thorns down both edges
    c.save(); c.fillStyle = CREAM; c.strokeStyle = INK; c.lineWidth = Math.max(1, T * 0.04); for (let i = 2; i < N - 1; i += 2) { const w = wfn(i) * 0.5, q = pts[i], nx = pts[i + 1][0] - pts[i - 1][0], ny = pts[i + 1][1] - pts[i - 1][1], nd = Math.hypot(nx, ny) || 1, tx = nx / nd, ty = ny / nd; for (const s of [-1, 1]) { const bx = q[0] - ty * w * s * 0.95, by = q[1] + tx * w * s * 0.95, L = w * 0.45; c.beginPath(); c.moveTo(bx - tx * L * 0.3, by - ty * L * 0.3); c.lineTo(bx - ty * L * s - tx * L * 0.5, by + tx * L * s - ty * L * 0.5); c.lineTo(bx + tx * L * 0.3, by + ty * L * 0.3); c.closePath(); c.fill(); c.stroke(); } } c.restore();
    // the constellation blossoms: five-petalled stars of cream round a gold heart, pulsing; they swell and blaze for a
    // bloom, and all of them burn while the vine is seized
    BLOOM.forEach((i, k) => { const q = pts[i], w = wfn(i), lit = Math.max(bloom, open, roar), pk = pulse(t + k * 1.3), r = w * (0.42 + lit * 0.25) * (0.95 + pk * 0.05);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + lit * 0.5 + pk * 0.1; blitSized(c, glowSprite(GOLD), q[0] - r * 2.4, q[1] - w * 0.3 - r * 2.4, r * 4.8, r * 4.8); c.restore();
      c.save(); c.translate(q[0], q[1] - w * 0.3); c.rotate(t * 0.4 * lit + k);
      for (let j = 0; j < 5; j++) { const a = j / 5 * TAU, rr = r * 0.75; TN.shape(c, TN.ell(Math.cos(a) * rr, Math.sin(a) * rr, r * 0.55, r * 0.32, a), { col: lit > 0.4 ? '#FFF4D6' : CREAM, shade: CREAM_SH, hi: '#FFFFFF', line: INK, r: r * 0.5, lw: Math.max(1, T * 0.05), spec: false, force: true }); }
      c.fillStyle = lit > 0.4 ? '#FFFFFF' : GOLD; c.strokeStyle = INK; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); for (let k2 = 0; k2 < 10; k2++) { const a = -Math.PI / 2 + k2 * Math.PI / 5, rr = k2 % 2 ? r * 0.2 : r * 0.42; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); c.restore(); });
    // the tail ends in a curl of tendril and a leaf
    const te = pts[N - 1], tb = pts[N - 3], ta = Math.atan2(te[1] - tb[1], te[0] - tb[0]); c.save(); c.translate(te[0], te[1]); c.rotate(ta); K.tube(c, [[0, 0], [T * 0.8, -T * 0.2 + Math.sin(t * 2) * T * 0.1], [T * 1.3, T * 0.4], [T * 0.9, T * 0.8]], u => T * (0.22 - u * 0.18), { col: VINE, hi: VINE_HI, dk: VINE_SH, dkA: 0.5, hiA: 0.3 }); TN.shape(c, TN.blob([[T * 0.6, -T * 0.1], [T * 1.6, -T * 0.9], [T * 2.1, -T * 0.3], [T * 1.3, T * 0.15]]), { col: JADE, shade: JADE_SH, hi: JADE_HI, line: INK, r: T * 0.5, lw: Math.max(1.2, T * 0.06), force: true }); c.restore();
    const jaw = clamp(Math.max(M.jaw || 0, M.clack || 0, roar, open), 0, 1);
    paintHead(c, K, pts[0], Math.atan2(pts[0][1] - pts[2][1], pts[0][0] - pts[2][0]), T * 1.2 * (1 + roar * 0.1 + hs * 0.06), jaw, t, M, FX.me, m);
    if (seize > 0.4) for (let i = 0; i < 3; i++) { const a = t * 3 + i * TAU / 3; TN.twinkle(c, pts[0][0] + Math.cos(a) * T * 1.4, pts[0][1] - T * 1.7 + Math.sin(a) * T * 0.35, T * 0.18, '#FFFFFF', 0.9); }
  }
  function paintHead(c, K, at, ang, hs, jaw, t, M, me, m) {
    const flip = Math.cos(ang) < 0, menace = M.menace || 0, open = M.open || 0, blink = M.blink || 0, seize = M.seize || 0, lw = Math.max(1.3, hs * 0.07);
    c.save(); c.translate(at[0], at[1]); c.rotate(ang); if (flip) c.scale(1, -1);
    // tendrils curling back from the neck, and sepals of jade at the bud's base
    [[-0.3, -0.5, -1.4, -1.1, -2.0, -0.6], [-0.3, 0.45, -1.3, 1.0, -1.9, 0.55]].forEach(([x0, y0, x1, y1, x2, y2], k) => { const tw = Math.sin(t * 2.2 + k * 2) * 0.1; TN.tubeLite(c, [[x0 * hs, y0 * hs], [x1 * hs, (y1 + tw) * hs], [x2 * hs, (y2 - tw) * hs], [(x2 + 0.3) * hs, (y2 * 0.6) * hs]], u => hs * (0.14 - u * 0.11), { col: VINE, shade: VINE_SH, hi: VINE_HI, line: INK, lw: lw * 0.7, force: true }); });
    [[-0.1, -0.55, -0.9, -0.95, -0.4, -0.2], [-0.1, 0.5, -0.9, 0.9, -0.4, 0.2]].forEach(([x0, y0, x1, y1, x2, y2]) => TN.shape(c, TN.blob([[x0 * hs, y0 * hs], [x1 * hs, y1 * hs], [(x1 - 0.3) * hs, (y1 * 0.4) * hs], [x2 * hs, y2 * hs]]), { col: JADE, shade: JADE_SH, hi: JADE_HI, line: INK, r: hs * 0.4, lw, force: true }));
    // the star core, burning in the throat behind the jaw
    if (jaw > 0.1) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = jaw * (0.7 + 0.3 * Math.sin(t * 9)) * (1 + open * 0.5); blitSized(c, glowSprite(GOLD), hs * 0.1, -hs * 0.8, hs * 1.6, hs * 1.6); c.restore(); TN.twinkle(c, hs * 0.85, 0, hs * (0.22 + jaw * 0.18 + open * 0.1) * (0.9 + 0.1 * Math.sin(t * 12)), '#FFFFFF', 1); }
    // the lower jaw: a petal of plum hinged at the throat, thorn-fangs along its lip; it opens with the bud
    c.save(); c.translate(hs * 0.05, hs * 0.2); c.rotate(jaw * 0.75);
    TN.shape(c, TN.blob([[-hs * 0.15, 0], [hs * 0.6, hs * 0.08], [hs * 1.35, -hs * 0.05], [hs * 1.3, hs * 0.2], [hs * 0.6, hs * 0.38], [-hs * 0.15, hs * 0.28]]), { col: PLUM_HI, shade: PLUM_SH, hi: ROSE_SH, line: INK, r: hs * 0.6, lw, d1: 0.12, d2: 0.24, spec: false, force: true });
    K.teeth(c, [0.35, 0.6, 0.85, 1.1, 1.3].map((u, i) => [hs * u, hs * 0.02, -Math.PI / 2, 0.5 + (i === 4 ? 0.5 : 0)]), hs * 0.14, CREAM); c.restore();
    // the bud: two upper petals of plum closing to a point forward, their edges lined in rose; the bud peels back
    // when it is seized, its petals curling up and out
    const peel = open * 0.5;
    TN.shape(c, TN.blob([[-hs * 0.5, -hs * 0.05], [-hs * 0.3, -hs * (0.5 + peel * 0.5)], [hs * (0.4 - peel * 0.5), -hs * (0.48 + peel * 0.5)], [hs * (1.45 - peel * 0.4), -hs * (0.05 + peel * 0.5)], [hs * 1.35, hs * 0.12], [hs * 0.5, hs * 0.2], [-hs * 0.25, hs * 0.25]]), { col: PLUM_HI, shade: PLUM_SH, hi: '#7A5098', line: INK, r: hs * 0.8, lw, d1: 0.12, d2: 0.24, spec: 0.35, specAt: [hs * 0.1, -hs * 0.3], force: true, inner: g => { g.save(); g.strokeStyle = 'rgba(217,143,181,.5)'; g.lineWidth = Math.max(1, hs * 0.05); g.beginPath(); g.moveTo(-hs * 0.3, -hs * 0.3); g.quadraticCurveTo(hs * 0.5, -hs * 0.45, hs * 1.3, -hs * 0.05); g.stroke(); g.strokeStyle = 'rgba(26,13,32,.45)'; g.beginPath(); g.moveTo(-hs * 0.1, hs * 0.1); g.quadraticCurveTo(hs * 0.6, -hs * 0.2, hs * 1.3, hs * 0.02); g.stroke(); if (menace > 0.1 || open > 0.1) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.max(menace * 0.3, open * 0.5); blitSized(g, glowSprite(GOLD), -hs * 0.3, -hs * 0.8, hs * 1.6, hs * 1.4); } g.restore(); } });
    K.teeth(c, [0.5, 0.75, 1.0, 1.25].map((u, i) => [hs * u, hs * 0.15, Math.PI / 2, 0.5 + (i === 3 ? 0.5 : 0)]), hs * 0.14, CREAM);
    // the eye: a slit of gold on the bud, watching the pet, blinking; rolling when it is seized; blazing before a blow
    const ex = hs * 0.5, ey = -hs * 0.18, dx = me ? me.x - m.x : 0, dy = me ? me.y - m.y : 1, dl = Math.hypot(dx, dy) || 1, ca = Math.cos(ang), sa = Math.sin(ang), lx = (dx * ca + dy * sa) / dl, ly = (-dx * sa + dy * ca) / dl * (flip ? -1 : 1);
    if (menace > 0.05) K.glow(c, ex, ey, hs * (0.5 + menace * 0.5), GOLD, menace * (0.5 + 0.25 * Math.sin(t * 14)));
    TN.eye(c, ex, ey, hs * 0.16, { iris: GOLD, white: '#2A1838', pupil: '#0A0410', line: INK, look: seize > 0.4 ? [Math.cos(t * 7) * 0.7, Math.sin(t * 7) * 0.5] : [lx * 0.6, ly * 0.5], blink: Math.max(blink, (m.hitSq || 0) * 0.6), lid: PLUM_HI, irisR: 0.8, slit: true, pupilR: 0.5 - menace * 0.15, squash: 0.7 });
    c.restore();
  }
})());
