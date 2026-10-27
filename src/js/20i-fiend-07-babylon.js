/* ---------- BABYLON, the Drifting Cataclysm ----------
   A tortoise shell the size of a hill, floating over the ash on nothing at all: basalt scutes with fire in the seams and
   a little volcano smoking on top. Underneath it is only shadow, two small eyes peeking out of the dark, and a curtain of
   thin, glowing tentacles that trail like a jellyfish's. Painted cel-shaded, like a cartoon. Its arena is an ash plain
   crossed by cooled lava. The shell turns almost every blow, but six of its tentacles carry ember nodes near the tip:
   burst one and the shell lurches down, its eyes staring out from under the rim, open to a strike. Then the crater wakes
   and rains molten rock that pools and cools across the plain. At the last the shell falls away, a new hill in the
   arena, and what is left is a glowing jelly of magma: bare, fast and furious.
   Extinction Bloom: its vents charge and it looses a ring of molten rock in every direction; break a charged vent
   and the ring opens there. */
FIEND_DEFS.babylon = (() => {
  const TAU = Math.PI * 2;
  const OBS = '#1E1A1C', SKIN = '#4A4440', LAVA = '#FF6A1E', LAVAC = '#FFD27A', ASH = '#8A847C', BARE = '#5A2420';
  const lerp = (a, b, u) => a + (b - a) * u;
  const TN = FiendToon, NT = 18, NODES = [1, 4, 7, 10, 13, 16];   // eighteen thin tentacles; six carry ember nodes
  // cel-shaded palette: cocoa basalt, ember seams, the shadow underneath, coral-ember jelly
  const SH0 = '#7C5A4E', SH_SH = '#4E3530', SH_HI = '#B08672', RIM = '#8E6A56', RIM_SH = '#60443A', RIM_HI = '#C09A80', INK = '#1E0F0E';
  // the scutes: five down the spine, four each side, worked out once as cells of the shell's (u, v) disc
  const SCUTES = (() => {
    const C = [[-0.62, 0], [-0.31, 0], [0, 0], [0.31, 0], [0.62, 0]]; for (const s of [-1, 1]) [[-0.5, 0.47], [-0.17, 0.53], [0.17, 0.53], [0.5, 0.47]].forEach(([u, v]) => C.push([u, v * s]));
    const inside = (x, y, i) => { if (Math.hypot(x, y) > 0.8) return false; const d = Math.hypot(x - C[i][0], (y - C[i][1]) * 1.1); for (let j = 0; j < C.length; j++) if (j !== i && Math.hypot(x - C[j][0], (y - C[j][1]) * 1.1) < d) return false; return true; };
    return C.map((c, i) => { const pts = []; for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a); let lo = 0, hi = 1.2; for (let it = 0; it < 18; it++) { const mid = (lo + hi) / 2; if (inside(c[0] + dx * mid, c[1] + dy * mid, i)) lo = mid; else hi = mid; } pts.push([c[0] + dx * lo, c[1] + dy * lo]); } return pts; });
  })();
  const UNDER = '#24141E', UNDER_SH = '#120A12', JEL = '#FF9466', JEL_SH = '#E0603E', JEL_HI = '#FFD2B4', JEL_LN = '#7A2618', EYE = '#FFB347';
  return {
    arenaR: 15, firstAct: 'walk', artY: 0.66, ambient: 'embers',
    artPoses: [{ name: 'drifting', mem: { ang: Math.PI / 2 + 0.3, vx: 1.2, vy: 0.4 } }, { name: 'turned', mem: { ang: 0.05, bt: 2 } }, { name: 'tentacle lash', mem: { ang: 1.2, neck: 1, lashA: 0.6 } },
      { name: 'node burst: eyes exposed', mem: { ang: 1.9, slump: 1, broken: [1, 0, 0, 0, 0, 0] } }, { name: 'erupting', mem: { ang: 2.4, erupt: 1 } }, { name: 'shell fallen: the magma jelly', mem: { ang: 1.0, shed: true, bare: 1 } }],
    phaseNames: ['Adrift', 'The Crater Wakes', 'The Shell Falls', 'Extinction'],
    /* ---- the arena: an ash plain crossed by cooled lava ---- */
    paintGround(c, A) {
      const R = A.R, rnd = A.rnd;
      let g = c.createRadialGradient(0, 0, R * 0.1, 0, 0, R + 1.4); g.addColorStop(0, '#46403C'); g.addColorStop(0.7, '#36302C'); g.addColorStop(0.93, '#221E1C'); g.addColorStop(1, 'rgba(30,26,24,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.fill();
      for (let i = 0; i < 90; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, r = 0.8 + rnd() * 2.5, x = Math.cos(a) * d, y = Math.sin(a) * d, gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rnd() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(200,190,180,.07)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
      // rivers of cooled lava: black ropy rock, still hot in the cracks
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (let k = 0; k < 4; k++) { let x = (rnd() - 0.5) * R * 1.6, y = -R, a = Math.PI / 2 + (rnd() - 0.5) * 0.8; const pts = []; for (let j = 0; j < 22; j++) { pts.push([x, y]); a += (rnd() - 0.5) * 0.5; x += Math.cos(a) * 1.4; y += Math.sin(a) * 1.4; }
        [[1.1, '#141212'], [0.8, '#2A2422'], [0.14, 'rgba(255,100,30,.45)'], [0.05, 'rgba(255,220,140,.6)']].forEach(([w, col]) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke(); });
        for (let j = 0; j < pts.length; j += 2) { const [px, py] = pts[j]; c.strokeStyle = 'rgba(60,56,54,.6)'; c.lineWidth = 0.05; c.beginPath(); c.arc(px, py, 0.3, Math.PI * 0.2, Math.PI * 0.8); c.stroke(); } }
      // cracked earth
      for (let i = 0; i < 40; i++) { let x = (rnd() - 0.5) * R * 2, y = (rnd() - 0.5) * R * 2; if (Math.hypot(x, y) > R) continue; c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (rnd() - 0.5) * 1.8; y += (rnd() - 0.5) * 1.8; c.lineTo(x, y); } c.stroke(); }
      // charred stumps, pumice, footprints the size of ponds
      for (let i = 0; i < 9; i++) { const a = rnd() * TAU, d = 4 + rnd() * (R - 6), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.3 + rnd() * 0.25; const sg = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); sg.addColorStop(0, '#3A2A20'); sg.addColorStop(1, '#0A0806'); c.fillStyle = sg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,120,40,.35)'; c.lineWidth = 0.04; c.beginPath(); c.arc(x, y, r * 0.5, 0, TAU); c.stroke(); }
      for (let i = 0; i < 5; i++) { const a = rnd() * TAU, d = 3 + rnd() * (R - 5), x = Math.cos(a) * d, y = Math.sin(a) * d, b = rnd() * TAU; c.save(); c.translate(x, y); c.rotate(b); c.fillStyle = 'rgba(20,16,14,.35)'; c.beginPath(); c.ellipse(0, 0, 1.3, 1.0, 0, 0, TAU); c.fill(); for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(1.2, (k - 1.5) * 0.55, 0.3, 0.2, 0, 0, TAU); c.fill(); } c.restore(); }
      for (let i = 0; i < 600; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R; c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.3)' : 'rgba(220,210,200,.1)'; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 0.06, 0.06); }
      // a moat of living lava round the plain
      c.strokeStyle = 'rgba(255,100,30,.5)'; c.lineWidth = 0.6; c.beginPath(); c.arc(0, 0, R + 0.7, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,220,140,.6)'; c.lineWidth = 0.15; c.stroke();
    },
    /* ---- the sky: ash, volcanic lightning and a mountain coming apart ---- */
    sky(c, W, H, t, cam, T) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1A1614'); g.addColorStop(0.6, '#2A1A14'); g.addColorStop(1, '#4A2010'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const px = (cam.x - 28) * T;
      c.fillStyle = '#120E0C'; c.beginPath(); c.moveTo(W * 0.45 - px * 0.04, H * 0.2); c.lineTo(W * 0.62 - px * 0.04, H * 0.2); c.lineTo(W * 0.95 - px * 0.04, H * 0.62); c.lineTo(W * 0.1 - px * 0.04, H * 0.62); c.closePath(); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite(LAVA), W * 0.53 - px * 0.04 - 70, H * 0.2 - 70, 140, 140); c.restore();
      for (let i = 0; i < 12; i++) { const x = W * 0.53 - px * 0.04 + Math.sin(i * 1.7 + t * 0.2) * (20 + i * 9), y = H * 0.2 - i * 16 - (t * 8 % 16), r = 22 + i * 7; c.globalAlpha = 0.5; blitSized(c, puffSprite('rgba(60,50,46,'), x - r, y - r, r * 2, r * 2); } c.globalAlpha = 1;
      // lightning in the ash cloud
      if (Math.sin(t * 1.3) > 0.97) { c.save(); c.strokeStyle = 'rgba(230,210,255,.85)'; c.lineWidth = 2; let x = W * 0.5 + Math.sin(t * 9) * 60, y = 0; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.sin(t * 31 + k) * 30); y += H * 0.03; c.lineTo(x, y); } c.stroke(); c.restore(); }
      c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 50; i++) { const x = (i * 131 + t * 15) % W, y = ((i * 83) + t * (25 + (i % 4) * 9)) % H; c.globalAlpha = 0.45; blitSized(c, glowSprite(LAVA), x - 3, y - 3, 6, 6); } c.restore();
    },
    /* ---- the fight ---- */
    init(FX) {
      Object.assign(FX.mem, { ang: Math.PI / 2, faceTo: Math.PI / 2, neck: 0, jaw: 0, slump: 0, erupt: 0, bare: 0, broken: [0, 0, 0, 0, 0, 0], regrow: [0, 0, 0, 0, 0, 0], sigT: 13, bombT: 3, legObjs: [], vents: [], bt: 0, vx: 0, vy: 0, blink: 0, blinkT: 2, look: [0, 0.4] });
      FX.m.noTouch = false; FX.m.touchK = 0.9;
    },
    phase(FX, p, lv) {
      const M = FX.mem, H = FX.H; M.sigT = Math.min(M.sigT, 4); M.bombT = 1.5;
      if (lv === 2) H.banner('THE CRATER WAKES', 'Molten rock rains down: it pools, then cools', LAVA, 2.6, true);
      if (lv >= 3 && !M.shed) shedShell(FX, FX.m, p === 2);
      if (lv === 4) H.banner('EXTINCTION', 'Nothing will be left standing', '#FF3A1E', 2.4, true);
    },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, lv = FX.S.lv, bare = M.shed, fast = (1 + (lv - 1) * 0.08) * FX.S.fast * (bare ? 1.8 : 1);
      M.sigT -= dt; M.bombT -= dt; m.actT += dt;
      const d = FX.dist(m.x, m.y), aPet = FX.angPet(m.x, m.y);
      let tx = null, ty = null, spd = 0; M.faceTo = aPet;
      // the ember nodes on its tentacles, and their regrowing
      if (!bare) nodeArmour(FX, m, M, dt);
      if (lv >= 2 && M.bombT <= 0) { M.bombT = (lv >= 4 ? 4.5 : 6) / FX.S.fast; bombs(FX, m, lv); }
      switch (m.act) {
        case 'walk': {
          const want = bare ? 5 : 3.2, R = Math.max(0, d - want), p = FX.clampArena({ x: m.x + Math.cos(aPet) * Math.min(R, 4), y: m.y + Math.sin(aPet) * Math.min(R, 4) }, m.r);
          tx = p.x; ty = p.y; spd = (bare ? 4.5 : 1.8) * fast;
          if (m.actT > (bare ? 1.1 : 1.9) / FX.S.fast) { m.actT = 0; pick(FX, m, d, lv); }
          break; }
        case 'stomp': M.rear = m.actT < M.st.wait ? Math.min(1, (M.rear || 0) + dt * 2) : Math.max(0, (M.rear || 0) - dt * 6); if (m.actT > M.st.wait + 0.6) { m.act = 'walk'; m.actT = 0; } break;
        case 'snap': { M.lashA = M.sn.a; const u = m.actT / M.sn.wait; M.neck = u < 1 ? Math.max(-0.35, M.neck - dt * 0.6) : Math.min(1, M.neck + dt * 8); M.jaw = u < 1 ? Math.min(0.7, M.jaw + dt * 2) : Math.max(0, M.jaw - dt * 6); if (m.actT > M.sn.wait + 0.55) { m.act = 'walk'; m.actT = 0; } break; }
        case 'tail': M.tailS = Math.min(1, (M.tailS || 0) + dt * (m.actT > M.tl.wait ? 8 : 0.5)); if (m.actT > M.tl.wait + 0.5) { m.act = 'walk'; m.actT = 0; M.tailS = 0; } break;
        case 'erupt': M.erupt = Math.min(1, M.erupt + dt * 2); if (m.actT > 1.2) { m.act = 'walk'; m.actT = 0; } break;
        case 'charge': {   // the bare beast: a line, then a run
          const L = M.ch; M.faceTo = L.a; if (m.actT < L.wait) break;
          const sp = 18 * FX.S.fast; m.x += Math.cos(L.a) * sp * dt; m.y += Math.sin(L.a) * sp * dt; L.left -= sp * dt;
          if (!L.hit && d < m.r + me.r + 0.2) { if (FX.hurt(m.dmg * 1.8)) { L.hit = true; me.push = { vx: Math.cos(L.a) * 13, vy: Math.sin(L.a) * 13, t: 0.25 }; } }
          if (L.left <= 0 || !FX.inArena(m.x + Math.cos(L.a) * m.r, m.y + Math.sin(L.a) * m.r)) { FX.H.shake(12, 0.35); FX.H.sfx.crash(); m.act = 'walk'; m.actT = 0; }
          const q = FX.clampArena(m, m.r * 0.7); m.x = q.x; m.y = q.y; break; }
        case 'bloom': {   // Extinction Bloom: the vents charge, then the ring is loosed
          const B = M.bl; M.erupt = Math.min(1, M.erupt + dt); placeVents(FX, m, M);
          if (m.actT >= B.wait && !B.fired) { B.fired = true; fireBloom(FX, m, M, B); if (FX.S.lv >= 4) B.second = 0.55; }
          if (B.second != null) { B.second -= dt; if (B.second <= 0) { B.second = null; fireBloom(FX, m, M, B, 0.5); } }
          if (m.actT >= B.wait + 1.2) { m.act = 'walk'; m.actT = 0; M.vents.forEach(v => { if (!v.dead) v.dead = true; }); M.vents = []; M.bl = null; }
          break; }
      }
      if (m.act !== 'snap') { M.neck = M.neck > 0 ? Math.max(0, M.neck - dt * 2) : Math.min(0, M.neck + dt * 2); M.jaw = Math.max(0, M.jaw - dt * 2); }
      if (m.act !== 'erupt' && m.act !== 'bloom') M.erupt = Math.max(0, M.erupt - dt);
      if (M.slump > 0) { tx = null; }   // a burst node leaves it reeling
      if (tx != null) walk(FX, m, tx, ty, spd, dt);
      M.ang = FX.K.lerpA(M.ang, M.faceTo, Math.min(1, dt * (bare ? 4 : 1.3))); m.face = Math.cos(M.ang) >= 0 ? 1 : -1;
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { FX.parts(bodyParts(m, FX.mem)); },
    update(FX, dt) {
      const M = FX.mem, m = FX.m; if (!m) return;
      // drifting: a slow bob, the drift velocity the tentacles trail behind, blinks, and eyes that follow the pet
      M.bt = (M.bt || 0) + dt; const vx = (m.x - (M.px == null ? m.x : M.px)) / Math.max(dt, 1e-3), vy = (m.y - (M.py == null ? m.y : M.py)) / Math.max(dt, 1e-3); M.px = m.x; M.py = m.y;
      const kv = Math.min(1, dt * 3); M.vx += (clamp(vx, -8, 8) - M.vx) * kv; M.vy += (clamp(vy, -8, 8) - M.vy) * kv;
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 2 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.2; M.blink = Math.sin(Math.min(1, M.blinkU) * Math.PI); if (M.blinkU >= 1) { M.blinkU = null; M.blink = 0; } }
      const me = FX.me, e = eyesAt(m, M), lx = me.x - e.x, ly = me.y - e.y - 1, ll = Math.hypot(lx, ly) || 1; M.look = [lx / ll * 0.9, Math.max(-0.2, ly / ll) * 0.8];
      // a burst node drops the shell, its eyes staring out from under the rim
      if (M.slumpT > 0) { M.slumpT -= dt; M.slump = Math.min(1, M.slump + dt * 3); FX.weak('eyes', e.x, e.y, 1.3, 2.5, true); if (M.slumpT <= 0) FX.weak('eyes', 0, 0, 0, 0, false); }
      else M.slump = Math.max(0, M.slump - dt * 1.5);
    },
    // obsidian turns almost every blow, until the shell is gone
    dmgK(FX) { return FX.mem.shed ? 1 : 0.3; },
    // the shell is kept as a picture, painted continually a third a frame; the fallen shells about the arena are pictures too,
    // repainted only now and then (they lie still)
    keep: { steps: 3 },
    propKeep: { every: 12, box: p => [-3.4, -4.6, 3.4, 2.4] },
    draw(c, FX, m, X, Y, T, t, step) { drawShell(c, FX, m, X, Y, T, t, step); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'shell') drawShellHill(c, FX, p, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'plate') drawNode(c, FX, o, X, Y, T, t); else if (o.kind === 'vent') drawVent(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) {
      const M = FX.mem, B = M.bl, m = FX.m; if (!B || B.fired || !m) return;
      // the bloom's ring, shown around it as it charges, open where vents are broken
      const X = FX.sx(m.x), Y = FX.sy(m.y), u = clamp(m.actT / B.wait, 0, 1), r = T * (3 + u * 2);
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,120,40,${0.35 + u * 0.4})`; c.lineWidth = T * 0.3;
      const gaps = M.vents.filter(v => v.dead && v.broke).map(v => v.ga);
      // the dashes are one path, stroked once
      c.beginPath(); for (let k = 0; k < 64; k++) { const a = k / 64 * TAU; if (gaps.some(g => Math.abs(FX.K.angTo(g, a)) < 0.34)) continue; c.moveTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); c.arc(X, Y, r, a, a + TAU / 64 * 0.7); } c.stroke();
      gaps.forEach(g => { c.globalAlpha = 0.9; blitSized(c, glowSprite('#9FE8FF'), X + Math.cos(g) * r - T, Y + Math.sin(g) * r - T, T * 2, T * 2); });
      c.restore();
    },
  };
  /* ---- choosing ---- */
  function pick(FX, m, d, lv) {
    const M = FX.mem, me = FX.me, k = 1 / FX.S.fast;
    if (lv >= 2 && M.sigT <= 0) return startBloom(FX, m);
    const a = FX.angPet(m.x, m.y), behind = Math.abs(FX.K.angTo(M.ang + Math.PI, a)) < 0.9;
    if (M.shed) {   // the bare beast hunts: charges, leaps and bites
      if (d > 5 && Math.random() < 0.6) { const len = Math.min(24, d + 4), wait = 0.7 * k; M.ch = { a, left: len, wait, hit: false }; m.act = 'charge'; m.actT = 0; FX.tele({ shape: 'line', x: m.x, y: m.y, a, len, w: m.r * 1.5, t: wait, dmg: 0, col: LAVA }); return; }
      const p = FX.clampArena({ x: me.x, y: me.y }, m.r); FX.slam(p.x, p.y, 2.6, 0.75 * k, m.dmg * 1.6, { col: LAVA, after: q => { m.x = q.x; m.y = q.y; for (let i = 0; i < 10; i++) FX.bullet(q.x, q.y, i / 10 * TAU, 5.5, { color: LAVA, core: LAVAC }); } }); m.act = 'stomp'; m.actT = 0; M.st = { wait: 0.75 * k }; return;
    }
    if (behind && d < 9) { const wait = 0.85 * k; m.act = 'tail'; m.actT = 0; M.tl = { wait }; FX.tele({ shape: 'cone', x: m.x, y: m.y, a: M.ang + Math.PI, len: 8, spread: 0.75, t: wait, dmg: m.dmg * 1.5, col: '#B89A7A', fn: () => FX.H.shake(8, 0.25) }); return; }
    if (d < 9 && Math.random() < 0.5) { const wait = 0.95 * k; m.act = 'snap'; m.actT = 0; M.sn = { a, wait }; FX.tele({ shape: 'line', x: m.x + Math.cos(a) * 2.5, y: m.y + Math.sin(a) * 2.5, a, len: 7, w: 1.8, t: wait, dmg: m.dmg * 1.7, col: LAVA, fn: () => { FX.H.sfx.crash(); FX.H.shake(8, 0.2); } }); return; }
    // the slam: it rises high on its tentacles and drops, two of them spearing the ground, the plain ringing around it
    const wait = 1.0 * k; m.act = 'stomp'; m.actT = 0; M.st = { wait };
    for (const s of [-1, 1]) { const fa = M.ang + s * 0.75, x = m.x + Math.cos(M.ang) * 1.25 + Math.cos(fa) * 3.0, y = m.y + Math.sin(M.ang) * 1.25 + Math.sin(fa) * 3.0; FX.slam(x, y, 2.1, wait, m.dmg * 1.6, { col: ASH }); }
    FX.tele({ shape: 'ring', x: m.x, y: m.y, r0: 4.6, r1: 6.6, t: wait + 0.3, dmg: m.dmg * 0.9, col: ASH });
  }
  function walk(FX, m, tx, ty, spd, dt) {
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d < 0.05) return;
    const v = Math.min(spd, d * 3) * dt; FX.H.moveEnt(m, dx / d * v, dy / d * v, 1);
  }
  /* ---- the ember nodes: burst one and the shell lurches down ---- */
  function nodeArmour(FX, m, M, dt) {
    for (let i = 0; i < 6; i++) {
      const f = nodeAt(m, M, i);
      if (M.broken[i]) { M.regrow[i] -= dt; if (M.regrow[i] <= 0) { M.broken[i] = 0; FX.H.text(f.x, f.y - 1.5, 'Node regrown', JEL, 12); } continue; }
      let o = M.legObjs[i]; if (!o || o.dead) { o = M.legObjs[i] = FX.obj({ kind: 'plate', x: f.x, y: f.y, r: 0.85, hp: FX.S.barHP * 0.03, leg: i,
        onKill: q => { M.broken[q.leg] = 1; M.regrow[q.leg] = 14; M.slumpT = 5; M.tip = (q.x > m.x ? 1 : -1); FX.H.banner('A node bursts!', 'The shell drops: strike the eyes beneath!', LAVAC, 1.6); FX.H.shake(14, 0.5); FX.H.sfx.crash(); FX.H.boom(q.x, q.y, 1.3, JEL, LAVAC, { n: 14, shake: 4 }); for (let k = 0; k < 12; k++) { const a = Math.random() * TAU; FX.H.part({ kind: 'ember', x: q.x, y: q.y, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5 - 3, g: 8, life: 0.8, max: 0.8, size: 4 + Math.random() * 3, color: k % 2 ? JEL : LAVAC }); } } }); }
      o.x = f.x; o.y = f.y;
    }
  }
  /* ---- the crater: molten rock raining down, pooling and cooling ---- */
  function bombs(FX, m, lv) {
    const M = FX.mem, me = FX.me, n = lv >= 4 ? 8 : 6; m.act = m.act === 'walk' ? 'erupt' : m.act; m.actT = 0; FX.H.sfx.crash(); FX.H.shake(8, 0.4);
    for (let k = 0; k < n; k++) { const a = Math.random() * TAU, r = k < 2 ? FX.rnd(0, 2) : FX.rnd(2, 9), p = FX.clampArena({ x: me.x + Math.cos(a) * r, y: me.y + Math.sin(a) * r }, 1);
      FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.5, t: (1.1 + k * 0.12) / FX.S.fast, dmg: m.dmg * 1.3, col: LAVA, fn: q => { FX.H.boom(q.x, q.y, 1.4, LAVA, LAVAC, { n: 12, shake: 4, smoke: 4 }); lavaPool(FX, q.x, q.y); } }); }
  }
  function lavaPool(FX, x, y) {
    FX.hz({ kind: 'lava', x, y, r: 1.4, life: 11, dps: FX.m.dmg * 0.6, tick: 0.35, arm: 0.1, col: LAVA,
      update: (dt, z) => { if (z.age > 6.5) z.dps = 0; },   // after a while it cools to harmless rock
      draw: (c, z, FX2, T, t) => { const X = FX.sx(z.x), Y = FX.sy(z.y), rr = z.r * T, cool = clamp((z.age - 5) / 1.5, 0, 1), a = Math.min(1, z.age / 0.3, (z.life - z.age) / 1.5);
        c.globalAlpha = a; const g = c.createRadialGradient(X, Y, rr * 0.1, X, Y, rr); g.addColorStop(0, cool < 1 ? `rgba(255,${200 - cool * 150},${120 - cool * 100},.9)` : 'rgba(40,34,30,.95)'); g.addColorStop(0.7, `rgba(${200 - cool * 160},${60 - cool * 26},${20 + cool * 10},.85)`); g.addColorStop(1, 'rgba(30,26,24,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(X, Y, rr, rr * 0.75, 0, 0, TAU); c.fill();
        c.strokeStyle = `rgba(0,0,0,${0.3 + cool * 0.4})`; c.lineWidth = 1; for (let k = 0; k < 5; k++) { const b = k / 5 * TAU + z.x; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + Math.cos(b) * rr * 0.8, Y + Math.sin(b) * rr * 0.6); c.stroke(); }
        if (cool < 1) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (1 - cool) * (0.4 + 0.2 * Math.sin(t * 5 + z.x)); blitSized(c, glowSprite(LAVA), X - rr, Y - rr, rr * 2, rr * 2); } } });
  }
  /* ---- the shell falls away and becomes a hill in the arena ---- */
  function shedShell(FX, m, fromP2) {
    const M = FX.mem, H = FX.H, me = FX.me; M.shed = true; M.bare = 1; M.legObjs.forEach(o => { if (o && !o.dead) o.dead = true; }); M.slumpT = 0; FX.weak('eyes', 0, 0, 0, 0, false);
    // where it lands: away from the pet, inside the plain
    let best = null; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, p = { x: m.x + Math.cos(a) * 4.5, y: m.y + Math.sin(a) * 4.5 }; if (!FX.inArena(p.x, p.y, 3.5)) continue; const dp = Math.hypot(p.x - me.x, p.y - me.y); if (!best || dp > best.d) best = { x: p.x, y: p.y, d: dp }; }
    if (best && best.d > 4) { const cx = Math.floor(best.x), cy = Math.floor(best.y), G = FX.H.M.G, MW = FX.H.M.MW; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (Math.abs(dx) + Math.abs(dy) < 2 || Math.random() < 0.5) G[(cy + dy) * MW + cx + dx] = T_SOLID; FX.S.props.push({ kind: 'shell', x: cx + 0.5, y: cy + 0.5, ang: M.ang }); }
    H.banner(fromP2 ? 'The crater wakes, and the shell falls!' : 'THE SHELL FALLS', 'The magma jelly underneath is fast: watch for its charge', LAVA, 2.8, true); H.shake(24, 1.2); H.sfx.crash();
    for (let k = 0; k < 30; k++) { const a = Math.random() * TAU; H.part({ kind: 'shard', x: m.x + Math.cos(a) * 2, y: m.y - 3 + Math.sin(a), vx: Math.cos(a) * 9, vy: Math.sin(a) * 9 - 5, g: 14, life: 1.2, max: 1.2, size: 6 + Math.random() * 8, rot: a, vr: 6, color: k % 3 ? SH_SH : RIM }); }
  }
  /* ---- Extinction Bloom ---- */
  function startBloom(FX, m) {
    const M = FX.mem, lv = FX.S.lv; M.sigT = lv >= 4 ? 15 : 19; m.act = 'bloom'; m.actT = 0; M.bl = { wait: (lv >= 4 ? 3.6 : 4.2) / FX.S.fast, fired: false };
    M.vents = []; const n = 4, a0 = Math.random() * TAU;
    for (let k = 0; k < n; k++) { const ga = a0 + k / n * TAU; M.vents.push(FX.obj({ kind: 'vent', x: m.x, y: m.y, r: 0.8, hp: FX.S.barHP * 0.022, ga, k, onKill: o => { o.broke = true; FX.H.text(o.x, o.y - 1, 'Vent broken!', '#9FE8FF', 14); FX.H.boom(o.x, o.y, 1.2, LAVA, LAVAC, { n: 14, shake: 6, smoke: 6 }); } })); }
    placeVents(FX, m, M);
    FX.H.banner('EXTINCTION BLOOM', 'A ring of molten rock is coming: break a vent to open a way through!', LAVA, 2.8, true); FX.H.sfx.hum();
  }
  function placeVents(FX, m, M) { for (const v of M.vents) if (!v.dead) { v.x = m.x + Math.cos(v.ga) * 2.7; v.y = m.y + Math.sin(v.ga) * 2.1 - 1.4; } }
  function fireBloom(FX, m, M, B, off) {
    const gaps = M.vents.filter(v => v.broke).map(v => v.ga), n = 60;
    for (let k = 0; k < n; k++) { const a = (k + (off || 0)) / n * TAU; if (gaps.some(g => Math.abs(FX.K.angTo(g, a)) < 0.34)) continue; FX.bullet(m.x, m.y, a, 6.5, { color: LAVA, core: LAVAC, r: 0.3, dmg: m.dmg * 0.9, life: 4 }); }
    FX.H.flash(0.3, LAVA); FX.H.shake(18, 0.6); FX.H.sfx.crash(); FX.H.ring(m.x, m.y, 0.5, 6, 0.5, LAVA, 0.4);
  }
  /* ---- where its parts are ---- */
  // the shell floats: a slow bob, raised high before a slam, dropped when a node bursts
  function bellZ(M) { const b = M.bt || 0; return (M.shed ? 2.0 : 2.8) + Math.sin(b * 1.1) * 0.2 + (M.rear || 0) * 1.6 - (M.slump || 0) * 0.9; }
  // the two small eyes in the shadow under the front of the rim (in the bare form, on the jelly itself)
  function eyePos(m, M) { const sl = M.slump || 0, z = bellZ(M) - (M.shed ? 0.45 : 0.95), lx = (M.look ? M.look[0] : 0) * 0.45; return { x: m.x + lx, y: m.y + (M.shed ? 1.9 : 2.98 + sl * 0.4), z }; }
  function eyesAt(m, M) { const e = eyePos(m, M); return { x: e.x, y: e.y - e.z }; }
  function bodyParts(m, M) { const z = bellZ(M); return [{ key: 'shell', dx: 0, dy: -z - (M.shed ? 0.4 : 1.2), r: M.shed ? 2.0 : 3.0 }, { key: 'bell', dx: 0, dy: 1.4 - z + 0.9, r: 1.8 }]; }
  /* ---- tentacles: thin, wavy, trailing behind the drift like a jellyfish's ---- */
  function tentPts(m, M, i, tt) {
    const a = i / NT * TAU + 0.21, bz = bellZ(M) - (M.shed ? 0.55 : 1.05), Rb = M.shed ? 1.55 : 2.2, ph = i * 1.37 + (i % 2) * 0.6;
    const rx = Math.cos(a), ry = Math.sin(a), vx = M.vx || 0, vy = M.vy || 0, back = -(rx * Math.cos(M.ang) + ry * Math.sin(M.ang)), sw = M.tailS ? Math.sin(M.tailS * Math.PI) * Math.max(0, back) : 0;
    const spread = 0.75 + (i % 3) * 0.3 + (M.rear || 0) * 0.9 + (M.shed ? 0.5 : 0), pts = [];
    for (let k = 0; k <= 10; k++) {
      const u = k / 10, wav = (Math.sin(u * 5 - tt * 2.4 + ph) * 0.42 + Math.sin(u * 11 - tt * 3.7 + ph * 2) * 0.12) * u, out = Rb + u * spread * (0.6 + 0.6 * u);
      pts.push([m.x + rx * out - ry * wav - vx * u * u * 0.32 - Math.sin(M.ang) * sw * 2.6 * u, m.y + ry * out + rx * wav - vy * u * u * 0.32 + Math.cos(M.ang) * sw * 2.6 * u, 0.18 + (bz - 0.18) * Math.pow(1 - u, 1.2)]);
    }
    return pts;
  }
  function nodeAt(m, M, i) { const p = tentPts(m, M, NODES[i], M.bt || 0)[8]; return { x: p[0], y: p[1] - p[2], z: p[2] }; }
  // the lash: one tentacle coils back, then whips out along the telegraphed line
  function lashPts(m, M, tt) {
    const a = M.lashA != null ? M.lashA : M.ang, ex = Math.max(0, M.neck || 0), wind = Math.min(0, M.neck || 0), bz = bellZ(M) - 1.0, L = 1.6 + ex * 6.4 + wind * 2.4, pts = [];
    for (let k = 0; k <= 12; k++) { const u = k / 12, wav = Math.sin(u * 6 - tt * 5) * 0.3 * u * (1 - ex * 0.7), d = 1.6 + u * L, curl = wind * Math.sin(u * Math.PI) * 1.6;
      pts.push([m.x + Math.cos(a) * d - Math.sin(a) * (wav + curl), m.y + Math.sin(a) * d + Math.cos(a) * (wav + curl), 0.25 + (bz - 0.25) * (1 - u) * (1 - ex * 0.4) + Math.sin(u * Math.PI) * (0.5 + ex * 0.7)]); }
    return pts;
  }
  /* ---- painting: cel-shaded, like a cartoon ---- */
  function drawNode(c, FX, o, X, Y, T, t) {
    // an ember node swelling on a tentacle: it glows hotter as it cracks
    const K = FX.K, r = T * 0.48 * (1 + 0.06 * Math.sin(t * 5 + o.leg)), cr = 1 - o.hp / o.maxhp;
    K.glow(c, X, Y, r * 2.4, JEL, 0.35 + cr * 0.3);
    TN.shape(c, TN.ell(X, Y, r, r * 0.92), { col: cr > 0.5 ? '#FFB45A' : '#FF8A4A', shade: '#D2452C', hi: '#FFE7B8', line: JEL_LN, r, lw: Math.max(1.5, T * 0.07), d2: 0.3, spec: 0.9, specAt: [X - r * 0.35, Y - r * 0.4], glowCol: LAVAC, glowA: 0.3 + cr * 0.5 });
    if (cr > 0.15) { c.save(); c.strokeStyle = `rgba(255,248,210,${0.5 + cr * 0.5})`; c.lineWidth = Math.max(1, T * 0.05); c.lineCap = 'round'; c.beginPath(); c.moveTo(X - r * 0.55, Y - r * 0.2); c.lineTo(X - r * 0.05, Y + r * 0.1); c.lineTo(X + r * 0.25, Y + r * 0.5); c.moveTo(X - r * 0.05, Y + r * 0.1); c.lineTo(X + r * 0.45, Y - r * 0.35); c.stroke(); c.restore(); }
  }
  function drawVent(c, FX, o, X, Y, T, t) {
    const p = 0.5 + 0.5 * Math.sin(t * 9 + o.k), r = T * 0.7;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + p * 0.4; blitSized(c, glowSprite(LAVA), X - r * 2, Y - r * 2, r * 4, r * 4); c.restore();
    TN.shape(c, TN.ell(X, Y, r, r * 0.7), { col: LAVA, shade: '#C8361A', hi: LAVAC, line: INK, r, lw: Math.max(2, T * 0.1), spec: 0.8, specAt: [X - r * 0.3, Y - r * 0.3], glowCol: '#FFFFFF', glowA: 0.3 * p });
    // an arrow showing the way this vent will open the ring
    c.save(); c.translate(X, Y); c.rotate(o.ga); c.fillStyle = 'rgba(159,232,255,.8)'; c.beginPath(); c.moveTo(r * 1.3, 0); c.lineTo(r * 0.9, -r * 0.3); c.lineTo(r * 0.9, r * 0.3); c.closePath(); c.fill(); c.restore();
  }
  /* the shell itself: a scalloped rim of marginal scutes, a dome of plates with ember in the seams, a stubby volcano on
     top. Used for the floating shell and for the empty one lying in the arena after it falls */
  var SKP;   // (a var: this module returns before its helpers, so a let here would never be initialised)
  // part: 'base' (the rim and the dome of glowing seams), 'top' (the scutes laid on the dome, the volcano) or both
  function shellArt(c, K, P3, cx, cy, z, th, T, heat, tt, erupt, cool, sc, part) {
    sc = sc || 1; const SK = SKP || {}, base = part !== 'top', topP = part !== 'base'; const lw = Math.max(2, T * 0.1 * Math.sqrt(sc)), SA = [3.45 * sc, 3.1 * sc, 1.4 * sc], seam = cool ? '#4A2A22' : LAVA;
    // the rim's thickness, seen along its front edge
    const rimAt = (dz, k) => { const pts = []; for (let i = 0; i < 44; i++) { const a = i / 44 * TAU, ss = 1 + (i % 2 ? -0.03 : 0.03) * k; pts.push(P3(cx + Math.cos(a) * 3.8 * sc * ss, cy + Math.sin(a) * 3.45 * sc * ss, z + dz * sc)); } return pts; };
    if (base) TN.shape(c, TN.blob(rimAt(-0.28, 1)), { col: '#4A3028', shade: '#2E1C18', hi: false, line: INK, r: T * 3.6 * sc, lw, d2: 0.05, spec: false });
    if (base) TN.shape(c, TN.blob(rimAt(0.05, 1)), { col: RIM, shade: RIM_SH, hi: RIM_HI, line: INK, r: T * 3.6 * sc, lw, d1: 0.04, d2: 0.07, spec: false, force: true,
      inner: g => { g.save(); g.lineCap = 'round'; g.beginPath(); for (let i = 0; i < 22; i++) { const a = (i + 0.5) / 22 * TAU, p0 = P3(cx + Math.cos(a) * 3.0 * sc, cy + Math.sin(a) * 2.7 * sc, z + 0.2 * sc), p1 = P3(cx + Math.cos(a) * 3.85 * sc, cy + Math.sin(a) * 3.5 * sc, z + 0.05 * sc); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); }
        g.strokeStyle = INK; g.lineWidth = Math.max(1.2, T * 0.07); g.stroke(); if (!cool) { g.strokeStyle = `rgba(255,140,60,${0.35 + heat * 0.35})`; g.lineWidth = Math.max(0.8, T * 0.03); g.stroke(); } g.restore(); } });
    // the dome: ember shows in every seam between the plates
    const D = K.dome(c, P3, cx, cy, z + 0.12 * sc, SA[0], SA[1], SA[2], th), top = K.surf3(P3, cx, cy, z + 0.12 * sc, SA[0], SA[1], SA[2], th, 0, 0);
    const scutes = g => {
        const S3 = (u, v) => K.surf3(P3, cx, cy, z + 0.12 * sc, SA[0], SA[1], SA[2], th, u, v, 0.02);
        const plates = SCUTES.map(cell => cell.map(([u, v]) => S3(u, v)));
        for (let k = 0; k < 18; k++) { const a0 = k / 18 * TAU, a1 = (k + 1) / 18 * TAU, pts = []; for (let j = 0; j <= 3; j++) { const a = lerp(a0, a1, j / 3); pts.push(S3(Math.cos(a) * 0.99, Math.sin(a) * 0.99)); } for (let j = 3; j >= 0; j--) { const a = lerp(a0, a1, j / 3); pts.push(S3(Math.cos(a) * 0.78, Math.sin(a) * 0.78)); } plates.push(pts); }
        // the scutes, painted together: a fill per colour, one for all the shadow bands, one for the highlights, one stroke
        // for the outlines (rather than a shaded shape apiece: there are thirty-one of them)
        if (!SK.plates) { const list = [], inner = [], specs = [];
          plates.forEach((pts, i) => { if (SK.small && i >= 13) return; const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length, sh2 = pts.map(([x, y]) => [mx + (x - mx) * 0.88, my + (y - my) * 0.88]);
            const big = i < 13, r = T * (big ? 1.0 : 0.55) * sc;
            list.push({ pts: sh2, col: i % 2 ? SH0 : '#846256', r });
            if (big) inner.push(sh2.map(([x, y]) => [mx + (x - mx) * 0.55, my + (y - my) * 0.55]));
            if (big && i % 3 === 0) specs.push([mx - r * 0.35, my - r * 0.3, r]); });
          TN.plates(g, list, { shade: SH_SH, hi: SH_HI, line: INK, lw: Math.max(1, T * 0.05), d1: 0.12, d2: 0.32, force: true, skip: SK });
          if (!SK.pinner) { g.save(); g.strokeStyle = 'rgba(30,15,14,.35)'; g.lineWidth = Math.max(1, T * 0.035); g.lineJoin = 'round'; g.beginPath(); inner.forEach(P => TN.poly(P)(g)); g.stroke(); g.restore(); }
          if (!SK.pspec) specs.forEach(([x, y, r]) => TN.spec(g, x, y, r * 0.22, -0.7, 0.55)); }
      };
    const domeO = { col: seam, shade: cool ? '#2A1612' : '#C8361A', hi: false, line: INK, r: T * 3.4 * sc, lw: Math.max(2, T * 0.11), d2: 0.12, spec: false, glowCol: cool ? null : LAVAC, glowA: 0.2 + heat * 0.3 };
    if (base && topP) TN.shape(c, TN.poly(D.pts), Object.assign({ inner: scutes }, domeO));
    else if (base) TN.shape(c, TN.poly(D.pts), domeO);
    else { c.save(); c.beginPath(); TN.poly(D.pts)(c); c.clip(); scutes(c); c.restore();   // laid on the dome painted a step before, its outline gone over again
      c.save(); c.beginPath(); TN.poly(D.pts)(c); c.lineWidth = domeO.lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); c.restore(); }
    if (!topP) return null;
    // the volcano: a stubby cartoon cone, a caldera of glowing lava, drips running down its sides
    const vx = top[0], vy = top[1] + T * 0.25 * sc, vh = T * 1.25 * sc, w = T * 1.15 * sc;
    TN.shape(c, TN.blob([[vx - w, vy + w * 0.09], [vx - w * 0.72, vy - vh * 0.5], [vx - w * 0.48, vy - vh], [vx + w * 0.48, vy - vh], [vx + w * 0.72, vy - vh * 0.5], [vx + w, vy + w * 0.09], [vx, vy + w * 0.28]]), { col: '#5E423C', shade: '#3A2622', hi: '#946C5E', line: INK, r: w, lw: Math.max(2, T * 0.1), d1: 0.1, d2: 0.3, spec: false });
    const lv = cool ? '#3A2420' : LAVA;
    TN.shape(c, TN.ell(vx, vy - vh, w * 0.48, w * 0.2), { col: lv, shade: cool ? '#241614' : '#C8361A', hi: cool ? false : LAVAC, line: INK, r: w * 0.5, lw: Math.max(1.5, T * 0.07), d2: 0.2, spec: false, glowCol: cool ? null : '#FFFFFF', glowA: 0.25 + erupt * 0.4, lx: 0.4, ly: 0.9 });
    if (!cool) {
      const dr = []; for (let k = 0; k < 4; k++) dr.push([vx - w * 0.36 + k * w * 0.24, vy - vh + w * 0.12]);
      TN.drips(c, dr, LAVA, T * (0.5 + erupt * 0.5), tt, 3);
      K.glow(c, vx, vy - vh, w * (1.2 + erupt), LAVA, 0.45 + erupt * 0.45);
    }
    return { vx, vy: vy - vh };
  }
  function drawShellHill(c, FX, p, X, Y, T, t) {
    const K = FX.K, P3 = TN.cam(X, Y, T, p);
    TN.groundShadow(c, X, Y + T * 0.2, T * 2.4, T * 1.8, 0, 0.5);
    shellArt(c, K, P3, p.x, p.y, 0.1, p.ang || 1, T, 0, t, 0, true, 0.58);
    if (Math.random() < 0.06 && FX.H.part) FX.H.part({ kind: 'smoke', x: p.x + FX.rnd(-0.5, 0.5), y: p.y - 1.8, vx: 0.2, vy: -0.8, life: 1.5, max: 1.5, size: 0.6, color: 'rgba(80,70,66,' });
  }
  // kept, it is painted in three steps: what hangs under the shell (its tentacles, the jelly); its eyes, the rim and the
  // dome of glowing seams; then the scutes laid on the dome and the volcano
  function drawShell(c, FX, m, X, Y, T, t, step) {
    const K = FX.K, M = FX.mem; if (M.ang == null) M.ang = Math.PI / 2;
    const go0 = step == null || step === 0, go1 = step == null || step === 1, go2 = step == null || step === 2, SK = SKP = M.skipP || {};
    const P3 = TN.cam(X, Y, T, m), tt = M.bt != null ? M.bt : t, bare = !!(M.shed || M.bare), q = K.qq(), bz = bellZ(M), th = M.ang, sl = M.slump || 0;
    const heat = 0.5 + 0.2 * Math.sin(tt * 2) + (M.erupt || 0) * 0.5;
    if (go0) { TN.groundShadow(c, X, Y + T * 0.15, T * (bare ? 2.8 : 3.9), T * (bare ? 2.0 : 2.8), bz, 0.5);
    K.glow(c, X, Y, T * 3.2, JEL, 0.14); }
    // the tentacles, sorted round the bell
    const tents = []; for (let i = 0; i < NT; i++) { if (q < 1 && i % 2 && NODES.indexOf(i) < 0) continue; tents.push({ i, pts: tentPts(m, M, i, tt) }); }
    tents.forEach(o => { o.y = o.pts[0][1]; });
    const paintTent = o => {
      const sp = o.pts.map(p => P3(p[0], p[1], p[2])), frill = o.i % 3 === 0, w0 = T * (frill ? 0.3 : 0.19) * (bare ? 1.2 : 1), wf = u => w0 * (1 - u * 0.72) + T * 0.04;
      TN.tubeLite(c, sp, wf, { col: JEL, shade: JEL_SH, hi: JEL_HI, line: JEL_LN, lw: Math.max(1, T * 0.045), d1: 0.18, d2: 0.38, spec: false, glowCol: bare ? LAVAC : null, glowA: 0.4 });
      if (frill && q >= 1) { c.save(); c.fillStyle = JEL_HI; c.beginPath(); for (let k = 2; k < sp.length - 1; k += 2) { const p = sp[k], p2 = sp[k + 1], a = Math.atan2(p2[1] - p[1], p2[0] - p[0]), w = wf(k / 10), ex = p[0] - Math.sin(a) * w * 0.55, ey = p[1] + Math.cos(a) * w * 0.55; c.moveTo(ex + Math.cos(a) * w * 0.42, ey + Math.sin(a) * w * 0.42); c.ellipse(ex, ey, w * 0.42, w * 0.26, a, 0, TAU); } c.fill(); c.restore(); }
      const e = sp[sp.length - 1]; K.glow(c, e[0], e[1], T * 0.45, LAVAC, 0.35 + 0.2 * Math.sin(tt * 5 + o.i));
    };
    const behind = tents.filter(o => o.y < m.y + 0.2).sort((a, b) => a.y - b.y), front = tents.filter(o => o.y >= m.y + 0.2).sort((a, b) => a.y - b.y);
    if (go0 && !SK.tents) behind.forEach(paintTent);
    // under the shell: nothing but shadow, a soft dark jelly the tentacles hang from
    const rf = P3(m.x, m.y + 3.5, bz - 0.3), ub = [X, rf[1] - T * (0.05 - sl * 0.3)], urx = T * 2.9, ury = T * (0.78 + sl * 0.3);
    if (!go0) {}
    else if (bare) {
      // the bare form: a glowing bell of magma jelly, hot light swimming inside it
      const g3 = [m.x, m.y + 0.1, bz - 0.25];
      TN.ellipsoid(c, P3, th, g3, [2.25, 2.05, 1.4], { T, col: '#FF7A48', shade: '#D2452C', hi: '#FFD39A', line: '#6A1A10', lw: Math.max(2, T * 0.1), d1: 0.1, d2: 0.24, spec: 0.9, specR: 0.14, glowCol: LAVAC, glowA: 0.4,
        inner: g => { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { const a = tt * 0.7 + k * 1.26, p = P3(m.x + Math.cos(a) * 1.1, m.y + 0.1 + Math.sin(a) * 0.9, bz + 0.3 + Math.sin(tt * 2 + k) * 0.3); g.globalAlpha = 0.45; blitSized(g, glowSprite(LAVAC), p[0] - T, p[1] - T, T * 2, T * 2); } g.restore();
          g.save(); g.strokeStyle = 'rgba(255,240,190,.55)'; g.lineWidth = Math.max(1, T * 0.06); g.lineCap = 'round'; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3, p0 = P3(m.x + Math.cos(a) * 0.4, m.y + Math.sin(a) * 0.4, bz + 1.0), p1 = P3(m.x + Math.cos(a) * 1.9, m.y + Math.sin(a) * 1.7, bz - 0.2); g.beginPath(); g.moveTo(p0[0], p0[1]); g.quadraticCurveTo((p0[0] + p1[0]) / 2 + Math.sin(tt * 2 + k) * T * 0.3, (p0[1] + p1[1]) / 2, p1[0], p1[1]); g.stroke(); } g.restore(); } });
    } else {
      // a soft pool of shadow, darkest right under the rim, the tentacles' glow faint at its lower edge
      c.save(); c.translate(ub[0], ub[1] - ury * 0.35); c.scale(1, ury * 1.35 / urx); const gr = c.createRadialGradient(0, 0, urx * 0.15, 0, 0, urx); gr.addColorStop(0, 'rgba(14,6,12,.97)'); gr.addColorStop(0.62, 'rgba(22,10,18,.9)'); gr.addColorStop(0.85, 'rgba(60,20,22,.45)'); gr.addColorStop(1, 'rgba(60,20,22,0)'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, urx, 0, TAU); c.fill(); c.restore();
      K.glow(c, ub[0], ub[1] + ury * 0.6, urx * 0.9, JEL, 0.12);
    }
    if (go0 && !SK.tents) front.forEach(paintTent);
    if (!go1 && !go2) return;
    if (go1 && Math.abs(M.neck || 0) > 0.02) { const lp = lashPts(m, M, tt).map(p => P3(p[0], p[1], p[2])), ex = Math.max(0, M.neck || 0), wf = u => T * (0.42 - u * 0.3 + ex * 0.06);
      TN.tubeLite(c, lp, wf, { col: JEL, shade: JEL_SH, hi: JEL_HI, line: JEL_LN, lw: Math.max(1.5, T * 0.06), d1: 0.18, d2: 0.38, spec: false, glowCol: LAVAC, glowA: 0.3 + (M.jaw || 0) * 0.6 });
      const e = lp[lp.length - 1]; K.glow(c, e[0], e[1], T * (0.7 + ex), LAVAC, 0.5 + ex * 0.4); }
    // the eyes: two small lamps in the dark, peeking out from under the rim
    const E = eyePos(m, M), er = T * (bare ? 0.5 : 0.3 + sl * 0.14), gap = bare ? 0.7 : 0.62;
    if (go1) for (const s of [-1, 1]) { const p = P3(E.x + s * gap, E.y, E.z);
      K.glow(c, p[0], p[1], er * 3, EYE, bare ? 0.35 : 0.25 + sl * 0.3);
      if (!bare) { c.save(); c.fillStyle = 'rgba(6,2,6,.55)'; c.beginPath(); c.ellipse(p[0], p[1], er * 1.5, er * 1.25, 0, 0, TAU); c.fill(); c.restore(); }
      TN.eye(c, p[0], p[1], er, { iris: EYE, look: M.look || [0, 0.4], blink: M.blink || 0, lid: bare ? '#D2452C' : UNDER, line: INK, squash: bare ? 0.86 : 0.8 + sl * 0.15, irisR: bare ? 0.6 : 0.7, pupilR: sl > 0.3 ? 0.32 : 0.5, white: '#FFF1D6', brow: bare ? 0.9 + (FX.S && FX.S.lv >= 4 ? 0.6 : 0) : 0, rot: bare ? s * 0.12 : 0 });
    }
    // the shell, over everything underneath; it tips and drops when a node bursts
    if (!bare) {
      const tilt = sl * 0.2 * (M.tip || 1), pc = P3(m.x, m.y, bz); c.save(); if (tilt) { c.translate(pc[0], pc[1]); c.rotate(tilt); c.translate(-pc[0], -pc[1]); }
      if (!SK.shell) shellArt(c, K, P3, m.x, m.y, bz, th, T, heat, tt, M.erupt || 0, false, 1, step == null ? undefined : go1 ? 'base' : 'top'); c.restore();
      if (go2 && FX.H.part && Math.random() < 0.3 + (M.erupt || 0) * 0.5) { const cz = bz + 3.2; FX.H.part({ kind: 'smoke', x: m.x + FX.rnd(-0.3, 0.3), y: m.y - cz, vx: FX.rnd(-0.3, 0.3), vy: -1.2, life: 1.6, max: 1.6, size: 0.8, color: 'rgba(70,60,56,' }); if (M.erupt > 0.3) FX.H.part({ kind: 'ember', x: m.x, y: m.y - cz, vx: FX.rnd(-3, 3), vy: -FX.rnd(3, 6), g: 6, life: 0.9, max: 0.9, size: 4, color: LAVA }); }
    } else if (go1 && FX.H.part && Math.random() < 0.35) FX.H.part({ kind: 'ember', x: m.x + FX.rnd(-1.5, 1.5), y: m.y - bz - FX.rnd(0, 1), vx: FX.rnd(-0.6, 0.6), vy: -1.2, g: -0.4, life: 1, max: 1, size: 3, color: LAVAC });
  }
  function sh(h, k) { return shadeC(h, k); }
})();
