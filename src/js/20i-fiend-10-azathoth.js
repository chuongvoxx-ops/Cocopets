/* ---------- AZATHOTH, the Heart Outside Creation ----------
   A nautilus the size of a moon, its spiral shell chambered with dead worlds, a crown of anemone tendrils, and at its
   centre a black sun that beats. Its arena is a disc of broken stone at the end of everything. First it pulls and
   pushes: everything slides toward it, then is flung away. Then its shell opens and the worlds come out and orbit it,
   crushing what they roll over and sheltering what stands behind them. At the last its tendrils tear the floor into
   drifting islands, and between contractions the black sun is bare.
   Uncreation: its gaze unmakes everything it can see. Stand in the shadow of an orbiting world, then strike the heart. */
FIEND_DEFS.azathoth = (() => {
  const TAU = Math.PI * 2;
  const SHELL = '#2A1E44', PEARL = '#C9B8E8', PINK = '#FF4FD8', CYAN = '#8FE8FF', VOID = '#05030A', SUN = '#0A0612';
  const lerp = (a, b, u) => a + (b - a) * u;
  return {
    arenaR: 15, firstAct: 'drift', artY: 0.7, ambient: 'sparkles',
    artPoses: [{ name: 'closed, drifting' }, { name: 'tendrils reaching', mem: { reach: 1 } }, { name: 'the pull', mem: { pull: 1 } }, { name: 'shell open, worlds out', mem: { open: 1 } }, { name: 'Uncreation: the gaze', mem: { open: 1, gaze: 1 } }, { name: 'between contractions (heart bare)', mem: { open: 1, bare: 1 } }],
    phaseNames: ['Gravity', 'The Worlds Come Out', 'Drifting Islands', 'The End of Everything'],
    /* ---- the arena: the last disc of stone, carved with a spiral, at the edge of nothing ---- */
    paintGround(c, A) {
      const R = A.R, rnd = A.rnd;
      let g = c.createRadialGradient(0, 0, R * 0.1, 0, 0, R + 1.4); g.addColorStop(0, '#2A2240'); g.addColorStop(0.7, '#1C1630'); g.addColorStop(0.93, '#120E20'); g.addColorStop(1, 'rgba(14,10,26,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.fill();
      for (let i = 0; i < 80; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, r = 0.8 + rnd() * 2.6, x = Math.cos(a) * d, y = Math.sin(a) * d, gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rnd() < 0.5 ? 'rgba(255,79,216,.07)' : 'rgba(0,0,0,.3)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
      // the spiral carved into the stone, a nautilus seen from above
      c.lineCap = 'round'; c.strokeStyle = 'rgba(201,184,232,.22)'; c.lineWidth = 0.16; c.beginPath(); for (let k = 0; k <= 300; k++) { const u = k / 300, a = u * TAU * 2.6, r = 0.4 + u * u * 13.5; k ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 0.08; for (let k = 0; k < 14; k++) { const a = k / 14 * TAU * 2.6 * 0.9, u = Math.sqrt(k / 14), r0 = 0.4 + u * u * 13.5 * 0.9, r1 = r0 * 1.35; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); }
      // stars under the stone: the floor is thin here and the void shows through the cracks
      for (let i = 0; i < 30; i++) { let x = (rnd() - 0.5) * R * 2, y = (rnd() - 0.5) * R * 2; if (Math.hypot(x, y) > R - 1) continue; const pts = [[x, y]]; for (let j = 0; j < 5; j++) { x += (rnd() - 0.5) * 2.2; y += (rnd() - 0.5) * 2.2; pts.push([x, y]); } c.strokeStyle = '#05030A'; c.lineWidth = 0.14; c.beginPath(); pts.forEach(([a, b], k) => k ? c.lineTo(a, b) : c.moveTo(a, b)); c.stroke(); c.strokeStyle = 'rgba(143,232,255,.45)'; c.lineWidth = 0.04; c.stroke(); for (const [a, b] of pts) if (rnd() < 0.4) { c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(a + (rnd() - 0.5) * 0.1, b + (rnd() - 0.5) * 0.1, 0.05, 0, TAU); c.fill(); } }
      // monoliths toppled by the stars' gravity, and dust
      for (let i = 0; i < 6; i++) { const a = rnd() * TAU, d = 5 + rnd() * (R - 7), x = Math.cos(a) * d, y = Math.sin(a) * d, b = rnd() * TAU; c.save(); c.translate(x, y); c.rotate(b); const mg = c.createLinearGradient(0, -0.4, 0, 0.4); mg.addColorStop(0, '#6A5A90'); mg.addColorStop(1, '#1A1428'); c.fillStyle = mg; c.fillRect(-1.5, -0.4, 3, 0.8); c.strokeStyle = 'rgba(255,79,216,.3)'; c.lineWidth = 0.05; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(-1 + k * 0.7, 0, 0.18, 0, TAU); c.stroke(); } c.restore(); }
      for (let i = 0; i < 500; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R; c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.3)' : 'rgba(230,220,255,.12)'; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 0.06, 0.06); }
      // the edge of the disc, crumbling into nothing
      for (let k = 0; k < 60; k++) { const a = k / 60 * TAU + rnd() * 0.08, r = R + 0.2 + rnd() * 0.6, x = Math.cos(a) * r, y = Math.sin(a) * r, s = 0.3 + rnd() * 0.6; c.fillStyle = '#1A1428'; c.beginPath(); c.moveTo(x - s, y + s * 0.3); c.lineTo(x - s * 0.2, y - s * 0.7); c.lineTo(x + s * 0.7, y - s * 0.2); c.lineTo(x + s, y + s * 0.5); c.closePath(); c.fill(); c.strokeStyle = 'rgba(143,232,255,.3)'; c.lineWidth = 0.05; c.stroke(); }
    },
    /* ---- beyond: the void, nebulae, the dust of unmade worlds ---- */
    sky(c, W, H, t, cam, T) {
      c.fillStyle = VOID; c.fillRect(0, 0, W, H);
      const px = (cam.x - 28) * T, py = (cam.y - 28) * T;
      [[0.2, 0.3, 160, '255,79,216'], [0.75, 0.2, 200, '143,232,255'], [0.5, 0.8, 180, '160,120,255']].forEach(([u, v, r, col]) => { const x = W * u - px * 0.04, y = H * v - py * 0.04, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},.22)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); });
      for (let i = 0; i < 160; i++) { const x = (i * 173 - px * (0.02 + (i % 3) * 0.02)) % W, y = (i * 97 - py * 0.03) % H, r = 0.5 + (i % 5) * 0.4, tw = 0.5 + 0.5 * Math.sin(t * 2 + i); c.fillStyle = `rgba(255,255,255,${0.3 + tw * 0.5})`; c.fillRect(((x % W) + W) % W, ((y % H) + H) % H, r, r); }
      // the dust of worlds spiralling slowly inward
      c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const a = i * 0.7 + t * 0.08, r = 60 + ((i * 53) % 300) - (t * 4 % 60), x = W / 2 + Math.cos(a) * r * 1.3 - px * 0.05, y = H * 0.45 + Math.sin(a) * r * 0.5 - py * 0.05; c.globalAlpha = 0.3; blitSized(c, glowSprite(i % 2 ? PINK : CYAN), x - 4, y - 4, 8, 8); } c.restore();
    },
    /* ---- living layer: the islands, once the floor is torn ---- */
    overlay(c, FX, t, T) {
      const M = FX.mem, k = M.tear || 0; if (k <= 0) return; const C = FX.C, X = FX.sx(C.x), Y = FX.sy(C.y), R = C.R * T;
      // the cracks between the islands: void showing through, widening
      c.save(); c.globalAlpha = k; c.strokeStyle = VOID; c.lineCap = 'round'; c.lineWidth = T * (0.6 + k * 0.9);
      M.cracks.forEach(cr => { c.beginPath(); cr.forEach(([a, r], i) => { const x = X + Math.cos(a + Math.sin(t * 0.3) * 0.02) * r * T, y = Y + Math.sin(a) * r * T; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); });
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(143,232,255,.35)'; c.lineWidth = 1.5; M.cracks.forEach(cr => { c.beginPath(); cr.forEach(([a, r], i) => { const x = X + Math.cos(a) * r * T, y = Y + Math.sin(a) * r * T; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); });
      c.restore();
    },
    /* ---- the fight ---- */
    init(FX) {
      const M = FX.mem, m = FX.m; m.x = FX.C.x; m.y = FX.C.y - 1; m.still = true; m.touchK = 1.0;
      Object.assign(M, { reach: 0, pull: 0, open: 0, gaze: 0, bare: 0, beat: 0, worlds: [], cracks: [], tear: 0, sigT: 16, gravT: 4, lashT: 2.5, beatT: 0, contract: 0 });
    },
    phase(FX, p, lv) {
      const M = FX.mem, H = FX.H; M.sigT = Math.min(M.sigT, 5); M.gravT = 2;
      if (lv >= 2 && !M.opened) { M.opened = true; openShell(FX, FX.m, lv >= 4 ? 4 : 3); H.banner(p === 2 ? 'The shell opens' : 'THE WORLDS COME OUT', 'They crush what they roll over, and shelter what stands behind them', PINK, 2.8, true); }
      if (lv >= 3 && !M.torn) { M.torn = true; tearFloor(FX); H.banner('DRIFTING ISLANDS', 'The floor is torn: mind the gaps. Its heart is bare between beats', CYAN, 2.8, true); H.shake(20, 1); }
      if (lv === 4) H.banner('THE END OF EVERYTHING', 'Its gaze comes sooner, its heart beats faster', PINK, 2.4, true);
    },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, lv = FX.S.lv, fast = (1 + (lv - 1) * 0.08) * FX.S.fast;
      M.sigT -= dt; M.gravT -= dt; M.lashT -= dt; m.actT += dt;
      const d = FX.dist(m.x, m.y), aPet = FX.angPet(m.x, m.y);
      // it drifts a little, always; the worlds keep their orbits
      m.x += Math.sin(m.t * 0.3) * dt * 0.4; m.y += Math.cos(m.t * 0.23) * dt * 0.3; const q = FX.clampArena(m, 6); m.x = q.x; m.y = q.y;
      M.worlds.forEach(w => { if (w.dead) return; w.ang += dt * w.spd * fast; w.x = m.x + Math.cos(w.ang) * w.orb; w.y = m.y + Math.sin(w.ang) * w.orb * 0.8; if (w.cd > 0) w.cd -= dt; if (w.cd <= 0 && Math.hypot(me.x - w.x, me.y - w.y) < w.r + me.r * 0.5) { if (FX.hurt(m.dmg * 1.3)) { w.cd = 1; const a = Math.atan2(me.y - w.y, me.x - w.x); me.push = { vx: Math.cos(a) * 11, vy: Math.sin(a) * 11, t: 0.25 }; } } });
      // the heart beats: between contractions, with the shell open, it is bare
      if (M.opened) { M.beatT += dt * (lv >= 4 ? 1.6 : 1.1) * FX.S.fast; const ph = M.beatT % 4; M.contract = ph < 2.6 ? 1 : 0; M.bare = lv >= 3 && M.contract === 0 ? 1 : 0; const h = heartAt(m); FX.weak('heart', h.x, h.y, 1.1, 2.5, M.bare > 0 && m.act !== 'gaze'); }
      // the void between islands
      if (M.torn && !me.dead && inCrack(FX, me.x, me.y)) { me.chill = Math.max(me.chill || 0, 0.3); M.voidT = (M.voidT || 0) + dt; if (M.voidT > 0.4) { M.voidT = 0; FX.hurt(m.dmg * 0.3, { dot: true }); FX.H.text(me.x, me.y - 1, 'the void', CYAN, 11); } }
      switch (m.act) {
        case 'drift': if (m.actT > (lv >= 3 ? 1.4 : 1.9) / FX.S.fast) { m.actT = 0; pick(FX, m, d, lv); } break;
        case 'pull': { const G = M.gv; G.t += dt; M.pull = Math.min(1, M.pull + dt * 3); const dx = m.x - me.x, dy = m.y - me.y, dd = Math.hypot(dx, dy) || 1, k = G.dir * (lv >= 3 ? 3.6 : 3) * FX.S.fast; FX.push(dx / dd * k * dt, dy / dd * k * dt);
          if (G.dir > 0 && dd < m.r + 0.8 && !G.hit) { G.hit = true; FX.hurt(m.dmg * 2.2); FX.H.text(me.x, me.y - 1.2, 'CRUSHED!', PINK, 17); me.push = { vx: -dx / dd * 14, vy: -dy / dd * 14, t: 0.3 }; }
          if (G.dir < 0 && !FX.inArena(me.x, me.y, 0.6) && !G.hit) { G.hit = true; FX.hurt(m.dmg * 1.6); FX.H.text(me.x, me.y - 1.2, 'Flung to the edge!', CYAN, 14); }
          if (G.t > G.dur) { m.act = 'drift'; m.actT = 0; M.pull = 0; if (G.dir > 0 && lv >= 2) { M.gv = { t: 0, dur: 1.6 / FX.S.fast, dir: -1, hit: false }; m.act = 'pull'; FX.H.banner('REPULSION', 'Flung outward: stay off the edge', CYAN, 1.2); } }
          break; }
        case 'lash': M.reach = Math.min(1, M.reach + dt * 3); if (m.actT > M.ls.wait + 0.5) { m.act = 'drift'; m.actT = 0; } break;
        case 'gaze': { const G = M.gz; G.t += dt; M.gaze = Math.min(1, M.gaze + dt * 1.5);
          if (G.t >= G.wait && !G.fired) { G.fired = true; const sh = sheltered(FX, m, M); FX.H.flash(0.6, '#FFFFFF'); FX.H.shake(20, 0.8); FX.H.sfx.crash();
            if (!sh) { FX.hurt(m.dmg * 4.5); FX.H.text(me.x, me.y - 1.2, 'UNMADE', PINK, 20); } else FX.H.text(me.x, me.y - 1.2, 'Sheltered!', CYAN, 16); }
          if (G.t >= G.wait + 0.6) { m.act = 'drift'; m.actT = 0; M.gaze = 0; m.stunT = 3; M.bare = 1; FX.H.banner('The heart is bare!', 'Strike it before the shell closes', PINK, 1.6); }
          break; }
      }
      if (m.act !== 'lash') M.reach = Math.max(0, M.reach - dt * 2);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.bare = 1; const h = heartAt(m); FX.weak('heart', h.x, h.y, 1.2, 3, m.stunT > 0.05); FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return; M.open = lerp(M.open, M.opened ? 1 : 0, Math.min(1, dt * 1.2)); if (M.torn) M.tear = Math.min(1, M.tear + dt * 0.4); if (!(m.stunT > 0) && !(M.bare > 0) && FX.S.weak.heart) FX.weak('heart', 0, 0, 0, 0, false); },
    // the shell turns most of what strikes it; the heart does not
    dmgK(FX) { return FX.mem.open > 0.5 ? 0.6 : 0.4; },
    draw(c, FX, m, X, Y, T, t) { drawAzathoth(c, FX, m, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'world') drawWorld(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) {
      const M = FX.mem, m = FX.m; if (!m) return;
      // the gaze: the arena whitens, except in the shadows of the worlds
      if (m.act === 'gaze' && M.gz) { const u = clamp(M.gz.t / M.gz.wait, 0, 1), W = FX.H.W(), H = FX.H.H(), X = FX.sx(m.x), Y = FX.sy(m.y);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = u * 0.55; blitSized(c, glowSprite('#FFFFFF'), X - T * 16, Y - T * 16, T * 32, T * 32); c.restore();
        c.save(); for (const w of M.worlds) { if (w.dead) continue; const a = Math.atan2(w.y - m.y, w.x - m.x), wX = FX.sx(w.x), wY = FX.sy(w.y), half = Math.atan2(w.r * 1.15, Math.hypot(w.x - m.x, w.y - m.y)); c.fillStyle = `rgba(10,6,18,${0.55 + 0.3 * u})`; c.beginPath(); c.moveTo(wX + Math.cos(a + Math.PI / 2) * w.r * T * 1.1, wY + Math.sin(a + Math.PI / 2) * w.r * T * 1.1); c.lineTo(X + Math.cos(a + half) * T * 30, Y + Math.sin(a + half) * T * 30); c.lineTo(X + Math.cos(a - half) * T * 30, Y + Math.sin(a - half) * T * 30); c.lineTo(wX + Math.cos(a - Math.PI / 2) * w.r * T * 1.1, wY + Math.sin(a - Math.PI / 2) * w.r * T * 1.1); c.closePath(); c.fill(); } c.restore();
        if (sheltered(FX, m, M)) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite(CYAN), FX.sx(FX.me.x) - T * 1.5, FX.sy(FX.me.y) - T * 2, T * 3, T * 3); c.restore(); } }
      // the pull: lines of force streaming to it
      if (M.pull > 0 && M.gv) { const X = FX.sx(m.x), Y = FX.sy(m.y); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = M.gv.dir > 0 ? 'rgba(255,79,216,.4)' : 'rgba(143,232,255,.4)'; c.lineWidth = 2; for (let k = 0; k < 32; k++) { const a = k / 32 * TAU, ph = ((t * 1.2 * M.gv.dir + k * 0.13) % 1 + 1) % 1, r0 = T * 16 * (1 - ph), r1 = T * 16 * Math.max(0, 1 - ph - 0.06); c.globalAlpha = M.pull * (0.3 + 0.5 * ph); c.beginPath(); c.moveTo(X + Math.cos(a) * r0, Y + Math.sin(a) * r0); c.lineTo(X + Math.cos(a) * r1, Y + Math.sin(a) * r1); c.stroke(); } c.restore(); }
    },
  };
  /* ---- choosing ---- */
  function pick(FX, m, d, lv) {
    const M = FX.mem, me = FX.me, k = 1 / FX.S.fast;
    if (lv >= 2 && M.sigT <= 0) return startGaze(FX, m);
    if (M.gravT <= 0) { M.gravT = (lv >= 4 ? 7 : 9.5) * k; m.act = 'pull'; m.actT = 0; M.gv = { t: 0, dur: 2.2 * k, dir: 1, hit: false }; FX.H.banner('GRAVITY', 'Everything falls toward it: run outward!', PINK, 1.4); FX.H.sfx.hum(); return; }
    if (M.lashT <= 0 || Math.random() < 0.5) {   // the tendrils reach: lines radiating from it, then its spores
      M.lashT = 5 * k; const wait = 0.95 * k, n = lv >= 3 ? 7 : 5, a0 = FX.angPet(m.x, m.y); m.act = 'lash'; m.actT = 0; M.ls = { wait };
      for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * (0.32 + (lv >= 4 ? 0.04 : 0)); FX.tele({ shape: 'line', x: m.x, y: m.y, a, len: 14, w: 1.3, t: wait + Math.abs(i - (n - 1) / 2) * 0.1, dmg: m.dmg * 1.4, col: PINK, fn: () => FX.H.sfx.whoosh() }); }
      return; }
    // spores: slow orbs that burst where the pet stands
    const n = 3 + (lv >= 3 ? 2 : 0); for (let i = 0; i < n; i++) { const p = FX.clampArena({ x: me.x + FX.rnd(-3, 3) * (i ? 1 : 0.1), y: me.y + FX.rnd(-3, 3) * (i ? 1 : 0.1) }, 1); FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.7, t: (1.2 + i * 0.15) * k, dmg: m.dmg * 1.2, col: CYAN, fn: q => { FX.H.boom(q.x, q.y, 1.5, CYAN, '#FFFFFF', { n: 12, shake: 4, smoke: 2 }); for (let j = 0; j < 6; j++) FX.bullet(q.x, q.y, j / 6 * TAU + i, 4.5, { color: CYAN, core: '#FFFFFF' }); } }); }
    FX.H.sfx.bubble();
  }
  function openShell(FX, m, n) {
    const M = FX.mem; M.worlds.forEach(w => { if (!w.dead) w.dead = true; }); M.worlds = [];
    const KINDS = [['#C86A3A', '#5A2A14', 'desert'], ['#4A8AD8', '#1A3A6A', 'ocean'], ['#8AA860', '#2A4A20', 'forest'], ['#D8D0E8', '#6A6080', 'ice']];
    for (let k = 0; k < n; k++) { const kind = KINDS[k % 4]; M.worlds.push(FX.obj({ kind: 'world', x: m.x, y: m.y, r: 1.35 + (k % 2) * 0.25, hp: 1e12, invuln: true, ang: k / n * TAU, orb: 7 + (k % 2) * 2.5, spd: (k % 2 ? -0.5 : 0.42), cd: 0, col: kind[0], dk: kind[1], seed: k * 7 + 3, front: true })); }
    FX.H.sfx.hum(); FX.H.ring(m.x, m.y, 0.5, 9, 0.8, PINK, 0.4);
  }
  function tearFloor(FX) {
    const M = FX.mem, C = FX.C; M.cracks = [];
    for (let k = 0; k < 5; k++) { const a0 = k / 5 * TAU + 0.3, cr = []; let a = a0, r = 3.5; for (let j = 0; j < 9; j++) { cr.push([a, r]); a += (Math.random() - 0.5) * 0.35; r += 1.5; } M.cracks.push(cr); }
  }
  function inCrack(FX, x, y) { const M = FX.mem, C = FX.C, a = Math.atan2(y - C.y, x - C.x), r = Math.hypot(x - C.x, y - C.y), w = 0.45 + M.tear * 0.5; for (const cr of M.cracks) for (let j = 0; j < cr.length - 1; j++) { const [a0, r0] = cr[j], [a1, r1] = cr[j + 1]; if (r < r0 - 0.5 || r > r1 + 0.5) continue; const u = clamp((r - r0) / (r1 - r0 || 1), 0, 1), ca = a0 + FX.K.angTo(a0, a1) * u; if (Math.abs(FX.K.angTo(ca, a)) * r < w) return true; } return false; }
  function sheltered(FX, m, M) { const me = FX.me, ap = Math.atan2(me.y - m.y, me.x - m.x), dp = Math.hypot(me.x - m.x, me.y - m.y); return M.worlds.some(w => { if (w.dead) return false; const aw = Math.atan2(w.y - m.y, w.x - m.x), dw = Math.hypot(w.x - m.x, w.y - m.y); return dp > dw && Math.abs(FX.K.angTo(aw, ap)) < Math.atan2(w.r * 1.15, dw); }); }
  function startGaze(FX, m) {
    const M = FX.mem, lv = FX.S.lv; M.sigT = lv >= 4 ? 16 : 21; m.act = 'gaze'; m.actT = 0; M.gz = { t: 0, wait: (lv >= 4 ? 3.2 : 3.8) / FX.S.fast, fired: false };
    if (!M.worlds.some(w => !w.dead)) openShell(FX, m, 3);
    FX.H.banner('UNCREATION', 'Its gaze unmakes all it sees: stand in the shadow of a world!', PINK, 2.8, true); FX.H.sfx.hum();
  }
  function heartAt(m) { return { x: m.x, y: m.y - 2.4 }; }
  function bodyParts(m, M) { return [{ key: 'shell', dx: 0, dy: -2.6, r: 3.0 }, { key: 'base', dx: 0, dy: -0.6, r: 2.2 }]; }
  /* ---- painting ---- */
  function drawWorld(c, FX, o, X, Y, T, t) {
    const K = FX.K, r = o.r * T, R = mulberry32(o.seed);
    K.shade(c, X, Y + T * 0.2, r * 1.1, r * 0.4, 0.5);
    const y = Y - T * 0.9;
    K.body(c, K.ellP(c, X, y, r, r), X, y, r, { col: o.col, hi: '#FFFFFF', dk: o.dk, dk2: '#05030A', spec: 0.6, specR: 0.25, ao: 0.25, aoA: 0.6, rim: PINK, rimA: 0.35, lx: -0.5, ly: -0.5,
      inner: () => { c.save(); c.beginPath(); c.arc(X, y, r, 0, TAU); c.clip(); c.rotate(0); const rot = t * 0.3 * (o.spd > 0 ? 1 : -1);
        for (let k = 0; k < 7; k++) { const a = R() * TAU + rot, d = R() * r * 0.8, cx = X + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = r * (0.15 + R() * 0.3); c.fillStyle = `rgba(${R() < 0.5 ? '255,255,255' : '0,0,0'},.22)`; c.beginPath(); c.ellipse(cx, cy, rr, rr * 0.6, a, 0, TAU); c.fill(); }
        // a dead world: cities dark, a crack of fire
        c.strokeStyle = 'rgba(255,120,80,.6)'; c.lineWidth = Math.max(1, r * 0.04); c.beginPath(); c.moveTo(X - r * 0.6, y + r * 0.2); c.lineTo(X - r * 0.2, y - r * 0.1); c.lineTo(X + r * 0.3, y + r * 0.3); c.stroke(); c.restore(); } });
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; blitSized(c, glowSprite(CYAN), X - r * 1.6, y - r * 1.6, r * 3.2, r * 3.2); c.restore();
  }
  function drawAzathoth(c, FX, m, X, Y, T, t) {
    const K = FX.K, M = FX.mem, s = T * 1.3;
    K.shade(c, X, Y + s * 0.1, s * 3.4, s * 1.0, 0.6);
    K.stage(c, 'azathoth', X, Y, s * 11, s * 9.5, s * 0.6, (a, step) => paintAzathoth(a, K, M, s, t, step), { key: 'rgba(230,210,255,1)', keyA: 0.28, rim: PINK, rimA: 0.4, ao: 0.4, side: 0.3, off: 0.004, steps: 2, t: K.fightT(FX, t), sig: Math.round(T * 8) });
    if (FX.H.part && Math.random() < 0.3) FX.H.part({ kind: 'star', x: m.x + FX.rnd(-3, 3), y: m.y - FX.rnd(0, 5), vx: FX.rnd(-0.5, 0.5), vy: -FX.rnd(0.5, 1.5), life: 1.2, max: 1.2, size: 2 + Math.random() * 2, color: Math.random() < 0.5 ? PINK : CYAN });
  }
  // in two steps when it is kept (the far tendrils, the mantle and the shell; then the crown and the near tendrils)
  function paintAzathoth(c, K, M, s, t, step) {
    const open = M.open || 0, reach = M.reach || 0, pull = M.pull || 0, gaze = M.gaze || 0, bare = M.bare || 0, con = M.contract == null ? 1 : M.contract, br = 1 + Math.sin(t * 1.3) * 0.02;
    // the anemone: a skirt of tendrils round the base, swaying, reaching out when it lashes
    const tend = far => { for (let k = 0; k < 18; k++) { const u = k / 18, a = u * TAU, side = Math.sin(a), isFar = side < 0; if (isFar !== far) continue; const bx = Math.cos(a) * s * 2.4, by = -s * 0.5 + side * s * 0.5, L = s * (1.6 + 0.5 * Math.sin(k * 2.3)) * (1 + reach * 0.8), pts = [];
      for (let j = 0; j <= 7; j++) { const v = j / 7, sw = Math.sin(t * 2 + k * 0.8 + v * 3) * s * 0.25 * v; pts.push([bx + Math.cos(a) * L * v * (0.4 + reach * 0.6) + sw * Math.sin(a) + (pull ? -Math.cos(a) * s * 0.4 * v * pull : 0), by - L * v * (0.9 - reach * 0.5) * (far ? 1 : 0.8) + sw * 0.3]); }
      K.tube(c, pts, v => s * (0.22 * (1 - v) + 0.03), { col: far ? '#3A1A48' : '#6A2A78', tex: 'skin', texA: 0.6, texS: 0.3, dk: '#140618', dkA: 0.5, hi: '#FF9AE8', hiA: 0.25, rim: PINK, rimA: 0.3 });
      K.glow(c, pts[7][0], pts[7][1], s * 0.25, k % 2 ? PINK : CYAN, 0.6 + 0.3 * Math.sin(t * 4 + k)); } };
    if (step !== 1) {
    tend(true);
    // the base: a mantle of flesh the shell sits in
    K.body(c, K.ellP(c, 0, -s * 0.6, s * 2.6, s * 1.1), 0, -s * 0.6, s * 2.6, { col: '#4A2258', hi: '#A060B0', dk: '#140618', tex: 'skin', texA: 0.7, texS: 0.4, spec: 0.3, rim: PINK, rimA: 0.3 });
    // the shell: a spiral of chambers, each holding a dead world, seen from the side
    const cx = 0, cy = -s * 3.0, sr = s * 2.7 * br, openK = open;
    c.save(); c.translate(cx, cy);
    // open: the two halves part to show the black sun
    const half = (side) => { c.save(); c.translate(side * openK * s * 1.3, 0); c.rotate(side * openK * 0.35);
      K.body(c, () => { c.beginPath(); c.moveTo(0, -sr); c.arc(0, 0, sr, -Math.PI / 2, side > 0 ? Math.PI / 2 : -Math.PI * 1.5, side < 0); c.closePath(); }, side * sr * 0.4, 0, sr, { col: SHELL, hi: '#8A6AC8', dk: '#0A0614', dk2: '#000000', tex: 'nebula', texA: 0.9, texS: 0.6, spec: 0.7, specR: 0.3, ao: 0.2, aoA: 0.5, rim: CYAN, rimA: 0.4,
        inner: () => {
          // the spiral and its chambers, each a window onto a world that ended
          c.save(); c.strokeStyle = 'rgba(201,184,232,.5)'; c.lineWidth = Math.max(1, s * 0.06); c.beginPath(); for (let k = 0; k <= 200; k++) { const u = k / 200, a = u * TAU * 2.2 + Math.PI, r = sr * 0.05 + u * u * sr * 0.95; k ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke();
          for (let k = 0; k < 10; k++) { const u = (k + 1) / 11, a = u * TAU * 2.2 + Math.PI, r = sr * 0.05 + u * u * sr * 0.95, wr = sr * (0.05 + u * 0.1), wx = Math.cos(a) * r * 0.82, wy = Math.sin(a) * r * 0.82; if (Math.sign(wx) !== side && Math.abs(wx) > wr) continue;
            const g = c.createRadialGradient(wx - wr * 0.3, wy - wr * 0.3, 0, wx, wy, wr); g.addColorStop(0, ['#D88A5A', '#6AA8E8', '#A8C870', '#E8E0F0'][k % 4]); g.addColorStop(1, '#0A0614'); c.fillStyle = g; c.beginPath(); c.arc(wx, wy, wr, 0, TAU); c.fill(); c.strokeStyle = 'rgba(201,184,232,.5)'; c.lineWidth = 1; c.stroke(); }
          // the spiral's growth lines
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * sr * 0.3, Math.sin(a) * sr * 0.3); c.lineTo(Math.cos(a) * sr, Math.sin(a) * sr); c.stroke(); }
          c.restore(); } });
      // the lip of the shell, pearl
      c.save(); c.strokeStyle = PEARL; c.lineWidth = Math.max(1.5, s * 0.08); c.globalAlpha = 0.6; c.beginPath(); c.arc(0, 0, sr * 0.98, -Math.PI / 2, side > 0 ? Math.PI / 2 : -Math.PI * 1.5, side < 0); c.stroke(); c.restore();
      c.restore(); };
    // between the halves: the black sun, beating; bare between contractions
    if (openK > 0.05) { const pulse = con ? 0.9 + 0.1 * Math.sin(t * 6) : 1.15 + bare * 0.1, hr = s * 1.1 * pulse * openK;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = openK * (0.5 + gaze * 0.5); blitSized(c, glowSprite(bare ? PINK : '#8060C0'), -hr * 2.6, -hr * 2.6, hr * 5.2, hr * 5.2); c.restore();
      // the corona, in negative: rays of dark with bright edges
      c.save(); c.globalAlpha = openK; for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + t * 0.15, L = hr * (1.6 + 0.4 * Math.sin(t * 3 + k * 1.7)); c.strokeStyle = `rgba(255,79,216,${0.35 + gaze * 0.5})`; c.lineWidth = Math.max(1, s * 0.05); c.beginPath(); c.moveTo(Math.cos(a) * hr, Math.sin(a) * hr); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.stroke(); }
      const g = c.createRadialGradient(0, 0, 0, 0, 0, hr); g.addColorStop(0, '#000000'); g.addColorStop(0.75, SUN); g.addColorStop(0.92, bare ? '#FF4FD8' : '#4A2A6A'); g.addColorStop(1, '#FFFFFF'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, hr, 0, TAU); c.fill();
      // the eye that opens in it for the gaze
      if (gaze > 0.2) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(0, 0, hr * 0.7 * gaze, hr * 0.3 * gaze, 0, 0, TAU); c.fill(); c.fillStyle = '#000000'; c.beginPath(); c.arc(0, 0, hr * 0.22 * gaze, 0, TAU); c.fill(); }
      if (bare) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = PINK; c.lineWidth = Math.max(1.5, s * 0.06); c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8); c.beginPath(); c.arc(0, 0, hr * 1.1, 0, TAU); c.stroke(); c.restore(); }
      c.restore(); }
    half(-1); half(1);
    c.restore();
    }
    if (step === 0) return;
    // the crown: longer tendrils rising from behind the shell, their tips lit
    for (let k = 0; k < 7; k++) { const u = (k - 3) / 3, pts = []; for (let j = 0; j <= 8; j++) { const v = j / 8; pts.push([u * s * 1.8 * (1 + v * 0.6) + Math.sin(t * 1.5 + k + v * 4) * s * 0.3 * v, -s * 4.5 - v * s * (2.2 + Math.abs(u) * -0.6) * (1 + reach * 0.4)]); } K.tube(c, pts, v => s * (0.16 * (1 - v) + 0.03), { col: '#5A2270', tex: 'skin', texA: 0.5, dk: '#140618', dkA: 0.5, hi: '#FF9AE8', hiA: 0.3 }); K.glow(c, pts[8][0], pts[8][1], s * 0.35, k % 2 ? CYAN : PINK, 0.7 + 0.3 * Math.sin(t * 3 + k)); }
    tend(false);
  }
})();
