/* ---------- HĀHĀLUA, the Moonlit Tide ----------
   A giant cartoon stingray, cel-shaded and fully 3D like Babylon: a sky-blue disc dappled with darker spots and little
   glowing star-freckles, a cream belly with gill slits, big round eyes on top of its head, a wide open mouth between two
   curling head-fins and a long whip tail that arcs up over its back. It hovers over the ground, its wings rippling in
   slow flaps, banking into its turns, while rings of moonlight orbit it the way Aion's swirls do. Its passing leaves
   pools of poisonous brine. The arena is a drowned salt flat cut by three dry freshwater channels; striking a sluice
   stone at a channel's end lets fresh water run for a while. Standing in running water keeps the pet safe from its brine
   and mist, and luring it into the water makes it flip over and bare its belly. Dead Sea Glide raises a wall of brine
   around the arena that closes inward: only an open channel breaks it. */
FIEND_DEFS.nuckelavee = (() => {
  const TAU = Math.PI * 2, CH_A = [Math.PI / 2, Math.PI / 2 + TAU / 3, Math.PI / 2 - TAU / 3], CH_W = 1.7;
  const BRINE = '#5FE8C8', SEA = '#0B1A1E', TN = FiendToon, RAY_S = 0.8;   // the model's scale (its units to arena tiles)
  // the ray's cel-shaded palette
  const SKY = '#6EC3F2', SKY_SH = '#3F8FD0', SKY_HI = '#C2EAFF', SPOT = '#3A7CC8', CREAM = '#FFF0C8', CREAM_SH = '#E2C48E', LINE = '#16305C', MOUTH = '#1C1430', GLOW = '#BFF4FF';
  // the rings of moonlight that orbit the ray (tilt normal, radius, speed, comet length, colour)
  const ORB = [{ tilt: 0.42, spin: 0.3, R: 7.1, sp: 0.85, span: 2.6, w: 0.48, col: '#BFF4FF', shade: '#6FB8E8' }, { tilt: 0.62, spin: 2.3, R: 6.4, sp: -1.1, span: 2.2, w: 0.4, col: '#E2D4FF', shade: '#9A86E0' }, { tilt: 0.22, spin: 4.1, R: 7.7, sp: 0.65, span: 2.0, w: 0.36, col: '#B8FFEA', shade: '#5FCFA8' }];
  const chEnd = (C, i, r) => [C.x + Math.cos(CH_A[i]) * r, C.y + Math.sin(CH_A[i]) * r];
  // distance from a point to channel i (the segment from the central well to the sluice)
  function chDist(C, i, x, y) { const [x0, y0] = chEnd(C, i, 1.4), [x1, y1] = chEnd(C, i, C.R - 1.2), dx = x1 - x0, dy = y1 - y0, u = clamp(((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(x - (x0 + dx * u), y - (y0 + dy * u)); }
  const inWater = (FX, x, y, pad) => FX.mem.ch.some((ch, i) => ch.open > 0 && chDist(FX.C, i, x, y) < CH_W / 2 + (pad || 0));
  return {
    arenaR: 15, firstAct: 'circle',
    artPoses: [{ name: 'hovering, facing you', mem: { hd: 1.57, fp: 1.0, mood: 0.55 } }, { name: 'wings up', mem: { hd: 0.5, fp: 1.57, spdK: 1, mood: 0.55 } }, { name: 'wings down, banking', mem: { hd: 2.5, fp: 4.7, spdK: 1, roll: -0.3, mood: 1 } }, { name: 'gulp: scowling', mem: { hd: 1.45, jaw: 1, fp: 0.3, mood: 1 } }, { name: 'side on', mem: { hd: 0.05, fp: 2.2, mood: 0.55 } }, { name: 'flipped: belly bare', mem: { hd: 1.1, rear: 1, fp: 2 } }, { name: 'gills breathing mist, turned away', mem: { hd: -1.3, gill: 1, fp: 3.4, mood: 1 }, phase: 2 }],
    phaseNames: ['The Glide', 'Gills of Brine', 'Salt Storm', 'The Drowning Hunt'],
    /* ---- the arena: black wet sand under a crust of salt, three stone channels from a dry central well ---- */
    paintGround(c, A) {
      const R = A.R, rnd = A.rnd, K = A.K;
      // the shore: foam and shallow water bleeding into the flat
      let g = c.createRadialGradient(0, 0, R * 0.2, 0, 0, R + 1.4); g.addColorStop(0, '#1C2826'); g.addColorStop(0.7, '#131D1C'); g.addColorStop(0.93, '#0C1515'); g.addColorStop(1, 'rgba(10,20,22,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.fill();
      // wet sheen and darker hollows
      for (let i = 0; i < 70; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, r = 0.6 + rnd() * 2.6, x = Math.cos(a) * d, y = Math.sin(a) * d; const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rnd() < 0.5 ? 'rgba(0,0,0,.35)' : 'rgba(120,170,160,.08)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
      // salt crust: pale polygon cracks over the sand
      const pts = []; for (let i = 0; i < 90; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 0.6); pts.push([Math.cos(a) * d, Math.sin(a) * d]); }
      c.lineCap = 'round';
      pts.forEach((p, i) => { const near = pts.map((q, j) => [Math.hypot(q[0] - p[0], q[1] - p[1]), j]).sort((a, b) => a[0] - b[0]).slice(1, 4); near.forEach(([d, j]) => { if (d > 3.4 || j < i) return; const q = pts[j], mx = (p[0] + q[0]) / 2 + (rnd() - 0.5) * 0.4, my = (p[1] + q[1]) / 2 + (rnd() - 0.5) * 0.4; c.strokeStyle = `rgba(210,232,222,${0.1 + rnd() * 0.16})`; c.lineWidth = 0.05 + rnd() * 0.06; c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(mx, my, q[0], q[1]); c.stroke(); }); });
      for (let i = 0; i < 260; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 0.5); c.fillStyle = `rgba(220,240,232,${0.05 + rnd() * 0.12})`; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, 0.04 + rnd() * 0.1, 0, TAU); c.fill(); }
      // tidepools with drowned weed
      for (let i = 0; i < 9; i++) { const a = rnd() * TAU, d = 4 + rnd() * (R - 6), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.5 + rnd() * 0.9; if (CH_A.some(ca => Math.abs(K.angTo(ca, a)) < 0.25)) continue;
        const gg = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); gg.addColorStop(0, '#2E4A48'); gg.addColorStop(1, '#0A1416'); c.fillStyle = gg; c.beginPath(); c.ellipse(x, y, r, r * 0.8, rnd(), 0, TAU); c.fill(); c.strokeStyle = 'rgba(160,220,210,.25)'; c.lineWidth = 0.05; c.stroke();
        c.strokeStyle = 'rgba(40,70,40,.7)'; c.lineWidth = 0.06; for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (rnd() - 0.5) * r, y + (rnd() - 0.5) * r, x + (rnd() - 0.5) * r * 1.6, y + (rnd() - 0.5) * r * 1.4); c.stroke(); } }
      // bones of a drowned ship half buried in the flat
      [[0.62, 0.9], [2.4, 0.7], [4.1, 0.55]].forEach(([ang, k]) => { const x = Math.cos(ang) * R * k, y = Math.sin(ang) * R * k; if (CH_A.some(ca => Math.abs(K.angTo(ca, ang)) < 0.35)) return; for (let j = 0; j < 5; j++) { const bx = x + (j - 2) * 0.55; c.strokeStyle = '#3A3026'; c.lineWidth = 0.22; c.beginPath(); c.moveTo(bx, y + 0.4); c.quadraticCurveTo(bx + 0.5, y - 0.6, bx + 0.2, y - 1.3 + j * 0.08); c.stroke(); c.strokeStyle = 'rgba(230,210,180,.18)'; c.lineWidth = 0.06; c.stroke(); } });
      // the channels: stone troughs cut into the flat, dry and salt-rimed
      CH_A.forEach(a => {
        const ca = Math.cos(a), sa = Math.sin(a), x0 = ca * 1.3, y0 = sa * 1.3, x1 = ca * (R - 0.9), y1 = sa * (R - 0.9), nx = -sa, ny = ca, w = CH_W / 2;
        c.fillStyle = '#0A0F10'; c.beginPath(); c.moveTo(x0 + nx * w, y0 + ny * w); c.lineTo(x1 + nx * w, y1 + ny * w); c.lineTo(x1 - nx * w, y1 - ny * w); c.lineTo(x0 - nx * w, y0 - ny * w); c.closePath(); c.fill();
        const L = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(L / 0.62);
        for (let s = -1; s <= 1; s += 2) for (let j = 0; j < n; j++) { const u = j / n, bx = x0 + (x1 - x0) * u + nx * w * s, by = y0 + (y1 - y0) * u + ny * w * s; c.save(); c.translate(bx, by); c.rotate(a); const sg = c.createLinearGradient(0, -0.2, 0, 0.2); sg.addColorStop(0, '#5A5650'); sg.addColorStop(1, '#25221E'); c.fillStyle = sg; c.fillRect(-0.3 + rnd() * 0.04, -0.2, 0.58, 0.4); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 0.04; c.strokeRect(-0.3, -0.2, 0.58, 0.4); c.restore(); }
        c.strokeStyle = 'rgba(210,230,220,.22)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      });
      // the central well
      g = c.createRadialGradient(0, 0, 0.2, 0, 0, 1.6); g.addColorStop(0, '#000000'); g.addColorStop(0.6, '#0A1214'); g.addColorStop(0.75, '#4A4640'); g.addColorStop(0.9, '#2A2622'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1.6, 0, TAU); c.fill();
      // the rim of the flat: a ragged foam line
      c.strokeStyle = 'rgba(200,240,230,.35)'; c.lineWidth = 0.12; c.beginPath(); for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU, r = R + 0.25 + Math.sin(a * 9) * 0.12 + Math.sin(a * 23) * 0.06; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke();
    },
    /* ---- outside the flat: a night sea under a drowned moon ---- */
    sky(c, W, H, t, cam, T, FX) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#071214'); g.addColorStop(0.5, SEA); g.addColorStop(1, '#040A0C'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      // the moon, far off and greenish, seen through the water's skin
      const mx = W * 0.78 - (cam.x - 28) * T * 0.08, my = H * 0.12 - (cam.y - 28) * T * 0.05; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45; blitSized(c, glowSprite('#9FE8D8'), mx - T * 6, my - T * 6, T * 12, T * 12); c.globalAlpha = 0.6; blitSized(c, glowSprite('#E8FFF8'), mx - T * 1.4, my - T * 1.4, T * 2.8, T * 2.8); c.restore();
      // swells rolling past, a slow parallax
      c.save(); c.lineCap = 'round';
      for (let i = 0; i < 26; i++) { const y = ((i * 37 + t * 9 - cam.y * T * 0.6) % (H + 60) + H + 60) % (H + 60) - 30, amp = 4 + (i % 4) * 2; c.strokeStyle = `rgba(120,200,190,${0.05 + (i % 3) * 0.03})`; c.lineWidth = 1.2 + (i % 3); c.beginPath(); for (let x = -20; x <= W + 20; x += 18) { const yy = y + Math.sin(x * 0.02 + t * 0.8 + i) * amp; x < -10 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
      c.restore();
      // a colossal drowned rib cage on the horizon, the first thing that is wrong
      c.save(); c.globalAlpha = 0.16; c.strokeStyle = '#7FB8B0'; c.lineWidth = 6; const hx = W * 0.2 - (cam.x - 28) * T * 0.05, hy = H * 0.08;
      for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(hx + i * 28, hy + 70); c.quadraticCurveTo(hx + i * 28 + 40, hy - 10, hx + i * 26 + 90, hy + 30 + i * 4); c.stroke(); } c.restore();
    },
    /* ---- living layers: running water in the open channels ---- */
    overlay(c, FX, t, T) {
      const C = FX.C, ch = FX.mem.ch; if (!ch) return;
      ch.forEach((h, i) => {
        if (h.open <= 0 && h.fill <= 0) return;
        const a = CH_A[i], [x0, y0] = chEnd(C, i, 1.3), [x1, y1] = chEnd(C, i, C.R - 1), X0 = FX.sx(x0), Y0 = FX.sy(y0), X1 = FX.sx(x1), Y1 = FX.sy(y1), L = Math.hypot(X1 - X0, Y1 - Y0), w = CH_W * T * 0.86, f = h.fill;
        c.save(); c.translate(X1, Y1); c.rotate(a + Math.PI);   // water runs from the sluice toward the well
        const g = c.createLinearGradient(0, -w / 2, 0, w / 2); g.addColorStop(0, 'rgba(90,190,220,.55)'); g.addColorStop(0.5, 'rgba(160,230,255,.75)'); g.addColorStop(1, 'rgba(60,150,190,.55)');
        c.globalAlpha = 0.85; c.fillStyle = g; c.fillRect(0, -w / 2, L * f, w);
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(220,250,255,.5)'; c.lineWidth = 1.4;
        for (let j = 0; j < 14; j++) { const u = ((j / 14 + t * 0.35) % 1) * L * f, yy = Math.sin(j * 2.3) * w * 0.32; c.beginPath(); c.moveTo(u, yy); c.lineTo(u + T * 0.7, yy + Math.sin(t * 3 + j) * 2); c.stroke(); }
        c.restore();
      });
    },
    /* ---- the fight ---- */
    init(FX) {
      const M = FX.mem; M.ch = CH_A.map(() => ({ open: 0, fill: 0, stone: null })); M.gait = 0; M.spdK = 0; M.jaw = 0; M.rear = 0; M.gill = 0; M.ang = 0; M.sigT = 14; M.mistT = 9; M.exposeCd = 0;
      FX.m.act = 'enter'; FX.m.face = -1;
      CH_A.forEach((a, i) => spawnSluice(FX, i));
    },
    phase(FX, p, lv) {
      const M = FX.mem; M.sigT = 4; M.mistT = 2;
      if (lv === 2) FX.H.banner('Its gills open!', 'Corrosive mist: stand in running fresh water', BRINE, 2.2);
      if (lv === 3) { FX.H.banner(p === 2 ? 'Gills open, salt storm rising' : 'A salt storm rises', 'Fresh water shelters you, and baring its chest there', '#E8F4F0', 2.4); M.storm = 1; }
      if (lv === 4) FX.H.banner('The Drowning Hunt', 'It never stops gliding', '#FF6A5A', 2.2);
    },
    ai(FX, m, dt) {
      const M = FX.mem, C = FX.C, me = FX.me, P = FX.S.lv, fast = (1 + (P - 1) * 0.12) * FX.S.fast;
      M.exposeCd -= dt; M.sigT -= dt; M.mistT -= dt;
      for (const h of M.ch) { if (h.open > 0) { h.open -= dt; h.fill = Math.min(1, h.fill + dt * 1.4); if (h.open <= 0) h.closing = true; } else if (h.fill > 0) { h.fill = Math.max(0, h.fill - dt * 0.8); } }
      M.ch.forEach((h, i) => { if (h.open <= 0 && h.fill <= 0 && (!h.stone || h.stone.dead) && !h.respawnT) { h.respawnT = 1.5; } if (h.respawnT) { h.respawnT -= dt; if (h.respawnT <= 0) { h.respawnT = 0; spawnSluice(FX, i); } } });
      const d = FX.dist(m.x, m.y), aPet = Math.atan2(me.y - m.y, me.x - m.x);
      let vx = 0, vy = 0;
      // fresh water under it: it rears, shrieking, and bares its chest
      if (M.exposeCd <= 0 && inWater(FX, m.x, m.y, m.r * 0.4) && m.act !== 'gallop') { M.exposeCd = 9; m.stunT = 2.8; m.act = 'circle'; m.actT = 0; FX.H.banner('Fresh water!', 'It flips over: strike its bare belly!', '#9FE8FF', 1.6); FX.H.sfx.crash(); FX.H.shake(10, 0.4); for (let i = 0; i < 16; i++) FX.H.part({ kind: 'bubble', x: m.x + FX.rnd(-1.5, 1.5), y: m.y + FX.rnd(-0.5, 0.5), vx: FX.rnd(-2, 2), vy: -FX.rnd(2, 5), g: 8, life: 0.8, max: 0.8, size: 4 + Math.random() * 4, color: '#BFF5E4' }); return; }
      m.actT += dt;
      switch (m.act) {
        case 'circle': {   // glides round the pet, dripping brine
          M.ang += dt * 0.55 * fast * (M.dir || 1); const R = clamp(d, 5.5, 8), tx = me.x + Math.cos(M.ang) * R, ty = me.y + Math.sin(M.ang) * R, p = FX.clampArena({ x: tx, y: ty }, m.r + 0.5);
          const dx = p.x - m.x, dy = p.y - m.y, dd = Math.hypot(dx, dy) || 1, sp = Math.min(4.6 * fast, dd * 3); vx = dx / dd * sp; vy = dy / dd * sp;
          if (m.actT > (P >= 3 ? 1.4 : 2.1)) {
            m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1;
            if (P >= 2 && M.sigT <= 0) { startGallop(FX, m); break; }
            if (P >= 2 && M.mistT <= 0) { m.act = 'mist'; break; }
            if (d < 5.2) { m.act = 'bite'; const mx = m.x + Math.cos(aPet) * 1.2, my = m.y + Math.sin(aPet) * 1.2; M.biteA = aPet; FX.tele({ shape: 'cone', x: mx, y: my, a: aPet, len: 5.4, spread: 0.62, t: 0.75 / fast, dmg: m.dmg * 1.5, fn: () => { M.jaw = -1; FX.H.sfx.crash(); FX.H.shake(6, 0.2); } }); }
            else { m.act = 'trample'; M.charges = P >= 3 ? 3 : P >= 2 && Math.random() < 0.4 ? 2 : 1; aimCharge(FX, m); }
          }
          break; }
        case 'bite': M.jaw = Math.min(1, M.jaw + dt * 2.5); if (m.actT > 1.1 / fast) { m.act = 'circle'; m.actT = 0; } m.face = Math.cos(M.biteA) >= 0 ? 1 : -1; break;
        case 'aim': m.face = Math.cos(M.chA) >= 0 ? 1 : -1; M.rear = Math.min(0.35, M.rear + dt); if (m.actT >= M.chWait) { m.act = 'charge'; m.actT = 0; M.rear = 0; FX.H.sfx.whoosh && FX.H.sfx.whoosh(); } break;
        case 'charge': {
          const sp = 17 * fast; vx = Math.cos(M.chA) * sp; vy = Math.sin(M.chA) * sp; M.chLeft -= sp * dt;
          if (Math.hypot(me.x - m.x, me.y - m.y) < m.r + me.r + 0.3 && !M.chHit) { if (FX.hurt(m.dmg * 1.9)) { M.chHit = true; me.push = { vx: Math.cos(M.chA + Math.PI / 2) * 14, vy: Math.sin(M.chA + Math.PI / 2) * 14, t: 0.25 }; } }
          M.poolT = (M.poolT || 0) - dt; if (M.poolT <= 0) { M.poolT = 0.12; brine(FX, m.x + FX.rnd(-0.6, 0.6), m.y + FX.rnd(-0.4, 0.4), 0.9, 6); }
          if (M.chLeft <= 0 || !FX.inArena(m.x + Math.cos(M.chA) * (m.r + 0.6), m.y + Math.sin(M.chA) * (m.r + 0.6))) { FX.H.shake(8, 0.3); M.charges--; if (M.charges > 0) aimCharge(FX, m, 0.55); else { m.act = 'circle'; m.actT = 0; } }
          break; }
        case 'mist': {   // the gill slits under its wings breathe a corrosive fog over the flat
          M.gill = Math.min(1, M.gill + dt * 2);
          if (m.actT > 0.6 && !M.misted) { M.misted = true; const n = P >= 3 ? 4 : 3; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, r = 1.5 + Math.random() * 4, p = FX.clampArena({ x: me.x + Math.cos(a) * r, y: me.y + Math.sin(a) * r }, 2); mist(FX, p.x, p.y, 3 + Math.random()); } FX.H.sfx.hum(); }
          if (m.actT > 1.4) { m.act = 'circle'; m.actT = 0; M.misted = false; M.mistT = P >= 3 ? 7 : 9.5; }
          break; }
        case 'gallop': {   // Dead Sea Glide: it sweeps round the shore, raising a wall of brine that closes in
          const W = M.wall, u = clamp(m.actT / W.dur, 0, 1), r = (C.R - 0.6) - u * (C.R - 2.4);
          W.z.r1 = r; W.z.r0 = Math.max(0.2, r - 1.5); W.z.gaps = M.ch.map((h, i) => h.fill > 0.5 ? [CH_A[i], 0.22 + 1.1 / Math.max(2, r)] : null).filter(Boolean);
          M.ang += dt * 1.9; const tx = C.x + Math.cos(M.ang) * (r + 0.6), ty = C.y + Math.sin(M.ang) * (r + 0.6); m.x += (tx - m.x) * Math.min(1, dt * 6); m.y += (ty - m.y) * Math.min(1, dt * 6); M.spdK = 1; m.face = -Math.sin(M.ang) >= 0 ? 1 : -1; M.gait += dt * 9;
          M.poolT = (M.poolT || 0) - dt; if (M.poolT <= 0) { M.poolT = 0.3; FX.H.part({ kind: 'bubble', x: m.x, y: m.y, vx: FX.rnd(-1, 1), vy: -3, g: 6, life: 0.6, max: 0.6, size: 5, color: BRINE }); }
          if (u >= 1) { W.z.life = W.z.age + 0.4; m.act = 'circle'; m.actT = 0; M.sigT = P >= 4 ? 15 : 20; }
          FX.parts(bodyParts(m, M)); return; }
      }
      // move, stepping and splashing
      if (m.act !== 'gallop') { const before = [m.x, m.y]; FX.H.moveEnt(m, vx * dt, vy * dt, 1); const sp = Math.hypot(m.x - before[0], m.y - before[1]) / Math.max(dt, 1e-4); M.spdK += (Math.min(1, sp / 8) - M.spdK) * Math.min(1, dt * 6); M.gait += dt * (1.5 + sp * 0.9); if (Math.abs(vx) > 0.3) m.face = vx >= 0 ? 1 : -1;
        M.stepT = (M.stepT || 0) - dt; if (sp > 2 && M.stepT <= 0) { M.stepT = 0.42; brine(FX, m.x + FX.rnd(-1, 1), m.y + FX.rnd(-0.3, 0.5), 0.7, 4.5); } }
      if (m.act !== 'bite') M.jaw = Math.max(0, M.jaw - dt * 3); if (m.act !== 'mist') M.gill = Math.max(P >= 2 ? 0.35 : 0, M.gill - dt);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.rear = Math.min(1, M.rear + dt * 3); M.gait += dt * 2; const ch = chestAt(m, M); FX.weak('chest', ch[0], ch[1], 1.4, 2.6, true); if (m.stunT <= 0.05) { FX.weak('chest', 0, 0, 0, 0, false); } FX.parts(bodyParts(m, M)); },
    update(FX, dt) {
      const M = FX.mem, m = FX.m; if (!m) return;
      if (!(m.stunT > 0)) { M.rear = Math.max(0, M.rear - dt * 1.5); if (FX.S.weak.chest) FX.weak('chest', 0, 0, 0, 0, false); }
      // flight: heading follows its drift (or the pet when it hovers), it banks into turns, flaps faster the faster it goes
      const vx = (m.x - (M.px == null ? m.x : M.px)) / Math.max(dt, 1e-3), vy = (m.y - (M.py == null ? m.y : M.py)) / Math.max(dt, 1e-3), sp = Math.hypot(vx, vy); M.px = m.x; M.py = m.y;
      const me = FX.me, want = sp > 1.2 ? Math.atan2(vy, vx) : m.act === 'bite' && M.biteA != null ? M.biteA : m.act === 'aim' && M.chA != null ? M.chA : Math.atan2(me.y - m.y, me.x - m.x);
      if (M.hd == null) M.hd = want; const prev = M.hd; M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * (m.act === 'charge' ? 8 : 2.6)));
      let turn = (M.hd - prev); while (turn > Math.PI) turn -= TAU; while (turn < -Math.PI) turn += TAU;
      M.roll = (M.roll || 0) + (clamp(-turn / Math.max(dt, 1e-3) * 0.22, -0.55, 0.55) - (M.roll || 0)) * Math.min(1, dt * 4);
      M.pitch = (M.pitch || 0) + ((m.act === 'charge' ? -0.18 : m.act === 'aim' ? 0.12 : 0) - (M.pitch || 0)) * Math.min(1, dt * 5);
      M.low = (M.low || 0) + ((m.act === 'charge' ? 1 : 0) - (M.low || 0)) * Math.min(1, dt * 4);
      M.fp = (M.fp || 0) + dt * (1.5 + Math.min(1, sp / 8) * 2.6); M.bt = (M.bt || 0) + dt;
      const moodT = m.act === 'bite' || m.act === 'charge' || m.act === 'aim' || m.act === 'mist' || m.act === 'gallop' ? 1 : 0.55; M.mood = (M.mood == null ? moodT : M.mood) + (moodT - (M.mood == null ? moodT : M.mood)) * Math.min(1, dt * 6);
      M.blinkT = (M.blinkT == null ? 2 : M.blinkT) - dt; if (M.blinkT <= 0) { M.blinkT = 2 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.2; M.blink = Math.sin(Math.min(1, M.blinkU) * Math.PI); if (M.blinkU >= 1) { M.blinkU = null; M.blink = 0; } }
      // brine drips from its wingtips as it passes
      if (sp > 2 && FX.H.part && Math.random() < dt * 6) { const s2 = Math.random() < 0.5 ? 1 : -1, wx = m.x - Math.sin(M.hd) * s2 * 6.3 * RAY_S, wy = m.y + Math.cos(M.hd) * s2 * 6.3 * RAY_S; FX.H.part({ kind: 'bubble', x: wx, y: wy - hoverZ(M), vx: 0, vy: 1.5, g: 9, life: 0.5, max: 0.5, size: 3, color: BRINE }); }
    },
    dmgK(FX, m) { return 1; },
    /* ---- the colossus ---- */
    // the ray is kept as a picture, repainted every other frame
    // kept as a picture painted whole every other frame (painting it in two halves, one a frame, cost more than it saved)
    keep: { steps: 2 },
    draw(c, FX, m, X, Y, T, t, step) { drawRay(c, FX, m, X, Y, T, t, step); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'sluice') drawSluice(c, o, X, Y, T, t); },
    drawFx(c, FX, T, t) {
      const M = FX.mem, W = FX.H.W(), H = FX.H.H();
      if (M.storm) { c.save(); c.globalCompositeOperation = 'source-over'; const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, 'rgba(200,220,215,0)'); g.addColorStop(1, 'rgba(200,220,215,.35)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(235,245,240,.45)'; c.lineWidth = 1.2; for (let i = 0; i < 70; i++) { const x = ((i * 97 + t * 420) % (W + 80)) - 40, y = (i * 53 + t * 60 * (1 + (i % 3))) % H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 16, y + 3); c.stroke(); } c.restore(); }
    },
  };
  /* ---- pieces of the fight ---- */
  function spawnSluice(FX, i) {
    const p = chEnd(FX.C, i, FX.C.R - 1.7), h = FX.mem.ch[i];
    h.stone = FX.obj({ kind: 'sluice', x: p[0], y: p[1], r: 0.75, hp: FX.S.barHP * 0.018, idx: i, onKill: o => { h.open = 16; h.closing = false; FX.H.banner('Fresh water runs!', 'Stand in it, or lure the fiend into it', '#9FE8FF', 1.6); FX.H.boom(o.x, o.y, 1.4, '#9FE8FF', '#FFFFFF', { n: 18, shake: 6, smoke: 3 }); FX.H.sfx.splash && FX.H.sfx.splash(); } });
  }
  function brine(FX, x, y, r, life) {
    if (!FX.inArena(x, y, 0.5)) return;
    FX.hz({ kind: 'brine', x, y, r, life, dps: FX.m.dmg * 0.45, tick: 0.35, arm: 0.3, col: BRINE, safe: () => inWater(FX, FX.me.x, FX.me.y),
      draw: (c, z, FX2, T, t) => { const X = FX.sx(z.x), Y = FX.sy(z.y), a = Math.min(1, z.age / 0.3, (z.life - z.age) / 0.8), rr = z.r * T; c.globalAlpha = a; const g = c.createRadialGradient(X, Y, rr * 0.1, X, Y, rr); g.addColorStop(0, 'rgba(20,70,60,.85)'); g.addColorStop(0.7, 'rgba(30,110,90,.55)'); g.addColorStop(1, 'rgba(60,200,170,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(X, Y, rr, rr * 0.72, 0, 0, TAU); c.fill(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(120,255,220,.35)'; c.lineWidth = 1; c.beginPath(); c.ellipse(X, Y, rr * 0.8, rr * 0.55, 0, 0, TAU); c.stroke(); for (let i = 0; i < 2; i++) { const ph = (t * 0.9 + i * 0.5 + z.x) % 1; c.globalAlpha = a * (1 - ph) * 0.8; c.beginPath(); c.arc(X + Math.sin(z.y * 3 + i) * rr * 0.4, Y + Math.cos(z.x * 3 + i) * rr * 0.2, 1 + ph * rr * 0.25, 0, TAU); c.stroke(); } } });
  }
  function mist(FX, x, y, r) {
    FX.hz({ kind: 'mist', x, y, r, life: 8, dps: FX.m.dmg * 0.4, tick: 0.4, arm: 0.6, col: '#9BFFB0', vx: FX.rnd(-0.4, 0.4), vy: FX.rnd(-0.4, 0.4), safe: () => inWater(FX, FX.me.x, FX.me.y),
      update: (dt, z) => { z.x += z.vx * dt; z.y += z.vy * dt; },
      draw: (c, z, FX2, T, t) => { const X = FX.sx(z.x), Y = FX.sy(z.y), a = Math.min(1, z.age / 0.6, (z.life - z.age) / 1.2), rr = z.r * T; for (let i = 0; i < 7; i++) { const an = t * 0.3 + i * 0.9, d = rr * (0.2 + (i % 3) * 0.25), s = rr * (0.55 + (i % 2) * 0.2); c.globalAlpha = a * 0.32; blitSized(c, puffSprite('rgba(120,200,140,'), X + Math.cos(an) * d - s, Y + Math.sin(an) * d * 0.7 - s, s * 2, s * 2); } c.globalAlpha = a * 0.5; c.strokeStyle = 'rgba(160,255,190,.5)'; c.setLineDash([6, 6]); c.beginPath(); c.arc(X, Y, rr, 0, TAU); c.stroke(); c.setLineDash([]); } });
  }
  function aimCharge(FX, m, wait) {
    const M = FX.mem, me = FX.me, a = Math.atan2(me.y - m.y, me.x - m.x), len = Math.min(26, Math.hypot(me.x - m.x, me.y - m.y) + 6);
    M.chA = a; M.chLeft = len; M.chHit = false; M.chWait = wait || 0.95; m.act = 'aim'; m.actT = 0;
    FX.tele({ shape: 'line', x: m.x, y: m.y, a, len, w: m.r * 1.5, t: M.chWait, dmg: 0, col: '#FF6A5A' });
  }
  function startGallop(FX, m) {
    const M = FX.mem, C = FX.C;
    m.act = 'gallop'; m.actT = 0; M.ang = Math.atan2(m.y - C.y, m.x - C.x);
    const z = FX.hz({ kind: 'wall', shape: 'ring', x: C.x, y: C.y, r0: C.R - 2, r1: C.R - 0.6, life: 99, dps: m.dmg * 3.2, tick: 0.25, col: BRINE,
      draw: (c, z2, FX2, T, t) => drawWall(c, FX, z2, T, t) });
    M.wall = { z, dur: FX.S.lv >= 4 ? 6 : 7.5 };
    FX.H.banner('DEAD SEA GLIDE', 'A wall of brine closes in: open a sluice and stand in its water!', BRINE, 2.6, true);
    M.ch.forEach(h => { if (h.stone && !h.stone.dead) h.stone.hint = 3; });
  }
  function drawWall(c, FX, z, T, t) {
    const X = FX.sx(z.x), Y = FX.sy(z.y), r0 = z.r0 * T, r1 = z.r1 * T, gaps = z.gaps || [];
    c.save();
    const N = 140;
    for (let i = 0; i < N; i++) {
      const a = i / N * TAU; if (gaps.some(([g0, w]) => Math.abs(FX.K.angTo(g0, a)) < w)) continue;
      const h = (0.7 + 0.3 * Math.sin(a * 7 + t * 5)) * T * 1.6, x = X + Math.cos(a) * (r0 + r1) / 2, y = Y + Math.sin(a) * (r0 + r1) / 2;
      const g = c.createLinearGradient(x, y - h, x, y + T * 0.2); g.addColorStop(0, 'rgba(200,255,240,.0)'); g.addColorStop(0.25, 'rgba(160,255,230,.45)'); g.addColorStop(1, 'rgba(20,90,80,.85)');
      c.fillStyle = g; c.fillRect(x - (r1 - r0) * 0.3, y - h, (r1 - r0) * 0.6, h + T * 0.2);
    }
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(180,255,235,.55)'; c.lineWidth = 2;
    c.beginPath(); c.arc(X, Y, r1, 0, TAU); c.stroke();
    gaps.forEach(([g0]) => { const r = (r0 + r1) / 2; c.globalAlpha = 0.9; blitSized(c, glowSprite('#9FE8FF'), X + Math.cos(g0) * r - T * 1.2, Y + Math.sin(g0) * r - T * 1.2, T * 2.4, T * 2.4); });
    c.restore();
  }
  /* ---- the ray in 3D: a frame for its body (heading, bank, pitch and the belly-up flip), and where its parts are ---- */
  function hoverZ(M) { return 1.75 + Math.sin((M.bt || 0) * 1.2) * 0.22 + (M.rear || 0) * 0.9 - (M.low || 0) * 0.65; }
  function rayFrame(m, M) {
    const th = M.hd == null ? 0.9 : M.hd, cf = Math.cos(th), sf = Math.sin(th), rl = M.roll || 0, pt = M.pitch || 0, cr = Math.cos(rl), sr = Math.sin(rl), cp = Math.cos(pt), sp = Math.sin(pt), bz = hoverZ(M);
    const fa = (M.rear || 0) * 2.2, cfa = Math.cos(fa), sfa = Math.sin(fa);   // flipped belly-up toward the camera when fresh water stuns it
    return (u, v, h) => { u *= RAY_S; v *= RAY_S; h *= RAY_S; const u1 = u * cp - h * sp, h1 = u * sp + h * cp, v1 = v * cr - h1 * sr, h2 = v * sr + h1 * cr, dx = cf * u1 - sf * v1, dy = sf * u1 + cf * v1; return [m.x + dx, m.y + dy * cfa - h2 * sfa, bz + dy * sfa + h2 * cfa]; };
  }
  // does a surface with this world normal face the camera (which looks from the south, from above)?
  function faces(n) { return n[1] + n[2] > 0; }
  function nrm(a, b, c) { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; }
  function chestAt(m, M) { const W = rayFrame(m, M), p = W(0.2, 0, -0.3); return [p[0], p[1] - p[2]]; }
  function bodyParts(m, M) { const W = rayFrame(m, M), c = W(0.3, 0, 0.3), L = W(-0.6, -4.0, 0.1), Rr = W(-0.6, 4.0, 0.1); return [{ key: 'torso', dx: c[0] - m.x, dy: c[1] - c[2] - m.y, r: 2.3 }, { key: 'wingL', dx: L[0] - m.x, dy: L[1] - L[2] - m.y, r: 1.9 }, { key: 'wingR', dx: Rr[0] - m.x, dy: Rr[1] - Rr[2] - m.y, r: 1.9 }]; }
  /* ---- the arena's sluice stones ---- */
  function drawSluice(c, o, X, Y, T, t) {
    const K = DunFiend.KIT, w = T * 0.62, h = T * 1.5, cracked = 1 - o.hp / o.maxhp;
    K.shade(c, X, Y + T * 0.1, w * 1.2, w * 0.4, 0.6);
    K.body(c, () => { c.beginPath(); c.moveTo(X - w, Y); c.lineTo(X - w * 0.86, Y - h); c.quadraticCurveTo(X, Y - h - w * 0.5, X + w * 0.86, Y - h); c.lineTo(X + w, Y); c.closePath(); }, X, Y - h * 0.5, h * 0.7, { col: '#5A5852', tex: 'stone', texA: 0.9, texS: 0.5, rim: '#9FE8FF', rimA: 0.35, spec: 0.15 });
    c.save(); c.globalCompositeOperation = 'lighter'; const p = 0.5 + 0.5 * Math.sin(t * 4), hint = o.hint > 0 ? 1 : 0; if (o.hint > 0) o.hint -= 1 / 60;
    c.strokeStyle = `rgba(160,240,255,${0.45 + cracked * 0.4 + hint * p * 0.5})`; c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); for (let i = 0; i <= 16; i++) { const u = i / 16, x = X - w * 0.55 + u * w * 1.1, y = Y - h * 0.55 + Math.sin(u * TAU * 1.5) * T * 0.14; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    if (hint) { c.globalAlpha = 0.6 * p; blitSized(c, glowSprite('#9FE8FF'), X - T * 1.4, Y - h * 0.6 - T * 1.4, T * 2.8, T * 2.8); }
    c.restore();
    if (cracked > 0.2) { c.strokeStyle = 'rgba(0,0,0,.65)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(X - w * 0.2, Y - h); c.lineTo(X + w * 0.1, Y - h * 0.6); c.lineTo(X - w * 0.15, Y - h * 0.3); c.stroke(); }
  }
  /* ---- painting helpers ---- */
  function bez2(a, b, c2, d, n) { const out = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; out.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c2[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c2[1] + u * u * u * d[1]]); } return out; }
  function hull(pts) {
    pts = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }
  // the screen outline of an ellipsoid (or its upper dome) carried by the ray's frame
  function ellHull(W, P3, cu, ch, a, b, cz, half, cv) { cv = cv || 0; const pts = []; for (let i = 0; i < 24; i++) { const ph = i / 24 * TAU; for (const r of [1, 0.75, 0.45, 0.15]) { const u = Math.cos(ph) * r, v = Math.sin(ph) * r, w = Math.sqrt(Math.max(0, 1 - r * r)); if (half >= 0) pts.push(P3(...W(cu + u * a, cv + v * b, ch + w * cz))); if (half <= 0) pts.push(P3(...W(cu + u * a, cv + v * b, ch - w * cz))); } } if (half >= 0) pts.push(P3(...W(cu, cv, ch + cz))); if (half <= 0) pts.push(P3(...W(cu, cv, ch - cz))); return hull(pts); }
  function dirOf(W, u, v, h) { const a = W(0, 0, 0), b = W(u, v, h); return [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; }
  function smooth(sp) { return c => { const n = sp.length; c.moveTo((sp[0][0] + sp[n - 1][0]) / 2, (sp[0][1] + sp[n - 1][1]) / 2); for (let i = 0; i < n; i++) { const p = sp[i], q = sp[(i + 1) % n]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } c.closePath(); }; }
  function twinkle(c, x, y, r, a) { if (a <= 0.02) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(GLOW), x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2); c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(x, y - r * 1.6); c.quadraticCurveTo(x, y, x + r * 1.6, y); c.quadraticCurveTo(x, y, x, y + r * 1.6); c.quadraticCurveTo(x, y, x - r * 1.6, y); c.quadraticCurveTo(x, y, x, y - r * 1.6); c.fill(); c.restore(); }
  /* ---- the orbiting moonlight: rings of light on tilted orbits round the ray, comets of light running round them,
     inked bands over a soft glow like Aion's swirls, passing behind it and in front of it ---- */
  function orbitPts(C, o, t, phase) {
    const sp = o.spin + Math.sin(t * 0.21 + o.R) * 0.4, ct = Math.cos(o.tilt), st = Math.sin(o.tilt), cs = Math.cos(sp), ss = Math.sin(sp);
    // a ring tilted about the x axis toward the camera, then turned about the vertical
    const e1 = [cs, ss, 0], e2 = [-ss * ct, cs * ct, st], out = [], N = 26, dir = Math.sign(o.sp), a0 = t * o.sp + phase;
    for (let i = 0; i <= N; i++) { const u = i / N, a = a0 - dir * u * o.span, r = o.R * RAY_S * (1 + Math.sin(u * 7 + t * 1.6 + o.R) * 0.025), ca = Math.cos(a) * r, sa = Math.sin(a) * r, lift = Math.sin(u * 5 + t * 1.3 + o.spin) * 0.18;
      out.push({ w: [C[0] + ca * e1[0] + sa * e2[0], C[1] + ca * e1[1] + sa * e2[1], C[2] + ca * e1[2] + sa * e2[2] + lift], u, k: Math.min(1, u / 0.06 + 0.2) * Math.pow(1 - u, 0.8) }); }
    return out;
  }
  var SKO;   // (part switches for timing; a var, as this module returns before its helpers)
  function drawOrbits(c, P3, C, T, t, front, q) {
    const SK = SKO || {}; if (SK.orbs) return;
    ORB.forEach((o, k) => { for (const phase of q >= 1 ? [0, Math.PI] : [0]) {
      const pts = orbitPts(C, o, t, phase + k * 2.1), sp = pts.map(p => ({ s: P3(...p.w), w: o.w * p.k * T, u: p.u, f: (p.w[1] - C[1]) + (p.w[2] - C[2]) > 0 }));
      // a soft glow beneath the band, so it reads as light
      if (!SK.oglow) { c.save(); c.globalCompositeOperation = 'lighter'; for (let j = 1; j < sp.length - 1; j += q >= 1 ? 2 : 4) { const p = sp[j]; if (p.f !== front) continue; const rr = p.w * 2.4 + 3; c.globalAlpha = 0.2; blitSized(c, glowSprite(o.col), p.s[0] - rr, p.s[1] - rr, rr * 2, rr * 2); } c.restore(); }
      const runs = []; let cur = null; sp.forEach(p => { if (p.f === front) { if (!cur) { cur = []; runs.push(cur); } cur.push(p); } else cur = null; });
      runs.forEach(run => { if (run.length < 2) return; const p2 = run.map(p => p.s), wf = u => Math.max(1.4, run[Math.min(run.length - 1, Math.round(u * (run.length - 1)))].w);
        TN.tubeLite(c, p2, wf, { col: o.col, shade: o.shade, hi: '#FFFFFF', line: '#1E3A6A', lw: Math.max(1.3, T * 0.06), d1: 0.15, d2: 0.35, spec: false, alpha: front ? 0.95 : 0.8 }); });
      const hd = sp[1]; if (hd.f === front) twinkle(c, hd.s[0], hd.s[1], T * 0.2, 0.95);
      if (q >= 1 && front) for (let j = 5; j < sp.length; j += 6) { const p = sp[j]; if (!p.f) continue; twinkle(c, p.s[0] + Math.sin(t * 3 + j) * T * 0.3, p.s[1] + Math.cos(t * 2.5 + j) * T * 0.3, T * 0.08, 0.4 + 0.4 * Math.sin(t * 6 + j + k)); }
    } });
  }
  /* ---- the ray itself: no head, just a broad body with big angry-cute eyes on top, and wide wings that thin out to a
     fine edge ---- */
  // the edge of its disc (one side; v > 0): a rounded snout, the leading edge sweeping out to a wide wingtip, the trailing edge back to the tail
  function discEdge() { if (discEdge.c) return discEdge.c; const lead = bez2([2.3, 0], [2.25, 1.8], [1.1, 5.2], [-1.25, 6.9], 16), trail = bez2([-1.25, 6.9], [-2.0, 6.1], [-2.35, 3.1], [-2.95, 0.8], 12).slice(1); return (discEdge.c = lead.concat(trail, [[-3.1, 0]])); }
  // the front of the snout at a given side offset (for the mouth along it)
  function frontU(v) { const E = discEdge(); v = Math.abs(v); for (let i = 1; i < 10; i++) { const a = E[i - 1], b = E[i]; if (b[1] >= v) { const u = (v - a[1]) / Math.max(1e-6, b[1] - a[1]); return a[0] + (b[0] - a[0]) * u; } } return E[9][0]; }
  // the disc is thick over the body and thins out gradually toward the wingtips (k: 0 at the body, 1 at the tip)
  function wingK(av) { return clamp((av - 1.2) / 5.7, 0, 1); }
  function topLift(k) { return 0.025 + 0.36 * Math.pow(1 - k, 1.8); }
  function botLift(k) { return -(0.02 + 0.27 * Math.pow(1 - k, 1.8)); }
  // an angry-cute eye: a big white, a glossy navy-and-blue pupil and a slanted lid that frowns toward the middle
  function rayEye(c, x, y, r, o) {
    const ry = r * 1.08, sIn = o.sIn, ang = o.ang, shock = o.shock || 0, bl = o.blink || 0, lk = o.look || [0, 0];
    c.save(); c.translate(x, y);
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.clip();
    // a soft blue shade under the top of the eye
    c.fillStyle = 'rgba(120,170,230,.35)'; c.beginPath(); c.ellipse(-r * 0.1, -ry * 0.55, r * 1.1, ry * 0.6, 0, 0, TAU); c.fill();
    const ir = r * (0.62 - shock * 0.24), ix = lk[0] * r * 0.32, iy = lk[1] * ry * 0.3 + r * 0.05;
    c.fillStyle = '#2E64D2'; c.beginPath(); c.arc(ix, iy, ir, 0, TAU); c.fill();
    c.fillStyle = '#5FA2FF'; c.beginPath(); c.ellipse(ix, iy + ir * 0.35, ir * 0.78, ir * 0.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#10163A'; c.beginPath(); c.arc(ix, iy, ir * 0.62, 0, TAU); c.fill();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(ix - ir * 0.34, iy - ir * 0.36, ir * 0.3, ir * 0.24, -0.5, 0, TAU); c.fill(); c.beginPath(); c.arc(ix + ir * 0.32, iy + ir * 0.34, ir * 0.12, 0, TAU); c.fill();
    // the frowning lid: low at the inner corner, high at the outer, and the blink brings it down
    const yIn = -ry * (1.05 - 0.92 * ang) + bl * ry * 2.2, yOut = -ry * (1.05 - 0.32 * ang) + bl * ry * 2.2;
    if (shock < 0.5 && (ang > 0.02 || bl > 0)) { c.fillStyle = SKY; c.beginPath(); c.moveTo(-r * 1.3 * sIn, -ry * 1.4); c.lineTo(r * 1.3 * sIn, -ry * 1.4); c.lineTo(r * 1.3 * sIn, yIn + (yIn - yOut) * 0.15); c.lineTo(-r * 1.3 * sIn, yOut - (yIn - yOut) * 0.15); c.closePath(); c.fill();
      c.strokeStyle = LINE; c.lineWidth = Math.max(1.5, r * 0.17); c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 1.2 * sIn, yOut - (yIn - yOut) * 0.1); c.lineTo(r * 1.2 * sIn, yIn + (yIn - yOut) * 0.1); c.stroke(); }
    c.restore();
    c.strokeStyle = LINE; c.lineWidth = Math.max(1.3, r * 0.11); c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.stroke();
    c.restore();
  }
  // kept, it is painted in two steps: what lies behind and the disc; then the body on it, its face, the near orbits
  function drawRay(c, FX, m, X, Y, T0, t, step) {
    const go = i => step == null || step === i, SK = SKO = FX.mem.skipP || {};
    const T = T0 * RAY_S, K = FX.K, M = FX.mem, q = K.qq(), P3 = TN.cam(X, Y, T0, m), W = rayFrame(m, M), bt = M.bt != null ? M.bt : t, fp = M.fp != null ? M.fp : t * 1.5, spd = M.spdK || 0, jaw = Math.max(0, M.jaw || 0), gill = M.gill || 0, rear = M.rear || 0;
    const lw = Math.max(1.5, T * 0.09), C = W(0, 0, 0.3), me = FX.me || { x: m.x, y: m.y + 5 };
    if (go(0)) { TN.groundShadow(c, X, Y + T * 0.2, T * 6.6, T * 3.6, hoverZ(M), 0.5);
      K.glow(c, X, Y - T * 1.8, T * 6, '#8FD8FF', 0.1);
      drawOrbits(c, P3, C, T, bt, false, q); }
    const upV = dirOf(W, 0, 0, 1), showTop = faces(upV), fwdV = dirOf(W, 1, 0, 0), front = fwdV[1] + fwdV[2] > 0.12;
    // the flap: the wings rise and fall from the body out, a slow ripple running out to the tips; the outer wing stays flat
    const flap = Math.sin(fp) * (0.5 + spd * 0.35), wave = fp * 1.4;
    const hOf = av => { const k = wingK(av); return { k, h: flap * Math.pow(k, 1.35) * 2.1 + Math.sin(wave - k * 2.6) * 0.16 * k }; };
    const DISC = discEdge(), ring = DISC.concat(DISC.slice(1, -1).reverse().map(([u, v]) => [u, -v]));
    const discPts = lift => ring.map(([u, v]) => { const { k, h } = hOf(Math.abs(v)); return P3(...W(u, v, h + lift(k))); });
    const top = discPts(topLift), bot = discPts(botLift);
    const onDisc = (u, v, dz) => { const { k, h } = hOf(Math.abs(v)); return P3(...W(u, v, h + topLift(k) + 0.02 + (dz || 0))); };
    // the top: sky blue, a paler swell over the body fading out in steps toward the thin wing edges, dapples, pale dots and star-freckles
    const plateau = (sc, sv) => smooth(ring.map(([u, v]) => { const vv = v * sv, uu = u * sc; const { k, h } = hOf(Math.abs(vv)); return P3(...W(uu, vv, h + topLift(k) + 0.01)); }));
    const paintTop = () => TN.shape(c, smooth(top), { col: SKY, shade: SKY_SH, hi: SKY_HI, line: LINE, r: T * 2.4, lw, d1: 0.06, d2: 0.09, shade2: false, spec: false, force: true,
      inner: SK.dapple ? null : g => {
        if (q >= 1) { g.fillStyle = 'rgba(190,232,255,.32)'; g.beginPath(); plateau(0.84, 0.56)(g); g.fill(); g.fillStyle = 'rgba(200,238,255,.3)'; g.beginPath(); plateau(0.7, 0.3)(g); g.fill(); }
        // a darker rim where the wing thins to its edge
        g.strokeStyle = 'rgba(40,100,180,.28)'; g.lineWidth = T * 0.34; g.lineJoin = 'round'; g.beginPath(); smooth(top)(g); g.stroke();
        for (const sd of [-1, 1]) {
          [[0.75, 2.4, 0.38], [-0.4, 3.4, 0.3], [0.65, 4.0, 0.22], [-1.15, 2.2, 0.33], [-0.55, 4.7, 0.19], [0.25, 1.75, 0.22], [-1.75, 3.6, 0.2], [-1.0, 5.3, 0.14], [0.1, 5.0, 0.15]].forEach(([u, v, r]) => { const p = onDisc(u, sd * v); g.fillStyle = SPOT; g.beginPath(); g.ellipse(p[0], p[1], r * T, r * T * 0.8, 0, 0, TAU); g.fill(); });
          [[0.25, 3.0], [0.38, 3.15], [0.1, 3.2], [-1.3, 2.85], [-1.15, 3.0], [-0.7, 4.1], [-0.2, 5.4]].forEach(([u, v]) => { const p = onDisc(u, sd * v); g.fillStyle = 'rgba(235,250,255,.85)'; g.beginPath(); g.arc(p[0], p[1], Math.max(1, T * 0.06), 0, TAU); g.fill(); });
          [[1.1, 2.7], [-0.8, 2.8], [-0.1, 3.9], [-1.9, 2.6], [-0.9, 4.9]].forEach(([u, v], i) => { const p = onDisc(u, sd * v); twinkle(g, p[0], p[1], T * 0.08, 0.45 + 0.5 * Math.sin(bt * 3 + i * 1.7 + sd)); });
        } } });
    const paintBot = () => TN.shape(c, smooth(bot), { col: CREAM, shade: CREAM_SH, hi: '#FFFFFF', line: LINE, r: T * 2.4, lw, d1: 0.06, d2: 0.1, shade2: false, spec: false, force: true });
    // the body: a sky-blue swell rising out of the disc, and a cream belly under it with its gill slits
    const half = (cu, ch, a, b, cz, hf, cv) => TN.poly(ellHull(W, P3, cu, ch, a, b, cz, hf, cv));
    const blueOpt = (r, at) => ({ col: SKY, shade: SKY_SH, hi: SKY_HI, line: LINE, r, lw, d1: 0.1, d2: 0.22, spec: 0.7, specR: 0.16, specAt: at, force: true });
    const creamOpt = r => ({ col: CREAM, shade: CREAM_SH, hi: '#FFFFFF', line: LINE, r, lw, d2: 0.2, spec: false, force: true });
    const DU = 0.15, DA = 2.15, DB = 1.8, DC = 0.55, D0 = topLift(0) - 0.05;
    const domeSurf = (u, v) => D0 + DC * Math.sqrt(Math.max(0, 1 - (u - DU) * (u - DU) / (DA * DA) - v * v / (DB * DB)));
    const paintDome = () => TN.shape(c, half(DU, D0, DA, DB, DC, 1), Object.assign(blueOpt(T * 1.3, P3(...W(0.0, -0.5, domeSurf(0, -0.5) + 0.05))), { line: false, d1: 0.08, d2: 0.16, shade2: false, inner: g => { [[-0.75, 0.4, 0.22], [-1.35, -0.3, 0.18], [-0.3, -0.75, 0.17], [-0.95, -0.75, 0.14], [-0.2, 0.75, 0.14]].forEach(([u, v, r]) => { const p = P3(...W(u, v, domeSurf(u, v) + 0.02)); g.fillStyle = SPOT; g.beginPath(); g.ellipse(p[0], p[1], r * T, r * T * 0.8, 0, 0, TAU); g.fill(); }); } }));
    const paintBelly = () => TN.shape(c, half(0.1, botLift(0) + 0.05, 2.3, 1.4, 0.4, -1), Object.assign(creamOpt(T * 1.6), { line: CREAM_SH, lw: lw * 0.75, inner: g => { // gill slits on the bared belly, glowing when it breathes its mist
        for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) { const a = P3(...W(1.0 - i * 0.34, sd * 0.55, botLift(0) - 0.32)), b = P3(...W(1.05 - i * 0.34, sd * 1.0, botLift(0) - 0.24)); g.strokeStyle = gill > 0.2 ? `rgba(120,255,200,${0.5 + gill * 0.5})` : 'rgba(150,110,70,.6)'; g.lineWidth = Math.max(1, T * 0.07); g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } } }));
    // the mouth: a wide, sulky frown along the front of the snout with two little fangs; it gapes wide to bite
    const paintMouth = () => { const MW = 0.8, op = 0.06 + jaw * 0.3, hm = 0.0, up = [], lo = [];
      for (let i = 0; i <= 10; i++) { const v = -MW + i / 10 * MW * 2, e = v / MW, hu = hm + 0.05 - 0.13 * e * e - jaw * 0.04 * (1 - e * e); up.push([v, hu]); lo.push([v, hu - op * Math.pow(Math.max(0, 1 - e * e), 0.6)]); }
      const pt = ([v, h]) => P3(...W(frontU(v) + 0.03, v, h)), pts = up.map(pt).concat(lo.slice(1, -1).reverse().map(pt));
      TN.shape(c, TN.poly(pts), { col: MOUTH, shade: '#0A0614', hi: false, line: LINE, r: T * 0.5, lw: lw * 0.9, spec: false, force: true,
        inner: g => { if (op > 0.12) { const tg = P3(...W(frontU(0) + 0.03, 0, hm + 0.05 - op * 0.85)); g.fillStyle = '#FF7A9A'; g.beginPath(); g.ellipse(tg[0], tg[1], T * 0.36, T * op * 0.45, 0, 0, TAU); g.fill(); }
          if (gill > 0.3) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = gill * 0.5; const gp = P3(...W(frontU(0), 0, hm)); blitSized(g, glowSprite('#9FFFD0'), gp[0] - T, gp[1] - T, T * 2, T * 2); } } });
      // two little fangs hanging from the top lip
      c.save(); c.fillStyle = '#FFFFFF'; c.strokeStyle = LINE; c.lineWidth = Math.max(1, T * 0.04); c.lineJoin = 'round';
      [-0.34, 0.34].forEach(v => { const e = v / MW, hu = hm + 0.05 - 0.13 * e * e - jaw * 0.04 * (1 - e * e), a = P3(...W(frontU(v) + 0.04, v - 0.09, hu)), b = P3(...W(frontU(v) + 0.04, v + 0.09, hu)), tip = P3(...W(frontU(v) + 0.05, v, hu - 0.15 - jaw * 0.04)); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(tip[0], tip[1]); c.lineTo(b[0], b[1]); c.closePath(); c.fill(); c.stroke(); });
      c.restore(); };
    // big eyes bulging from the front of the body, frowning at the pet
    const EU = 1.0, EV = 1.48;
    const paintEyes = () => { const sp = [-1, 1].map(sd => P3(...W(EU, sd * EV, domeSurf(EU, EV) + 0.44))), dx = me.x - m.x, dy = me.y - m.y, dl = Math.hypot(dx, dy) || 1;
      const ang = clamp(M.mood != null ? M.mood : 0.6, 0, 1), shock = rear > 0.25 ? 1 : 0;
      [-1, 1].forEach((sd, i) => { const ez = domeSurf(EU, EV);
        TN.shape(c, half(EU - 0.05, ez - 0.12, 0.74, 0.72, 0.42, 1, sd * EV), Object.assign(blueOpt(T * 0.5, null), { line: SKY_SH, lw: lw * 0.7, spec: false }));
        const ep = sp[i], inner = dirOf(W, 0.9, -sd, 0), il = Math.hypot(inner[0], inner[1]) || 1, sIn = Math.sign(inner[0] || 1) * clamp(Math.abs(inner[0]) / il * 2.5, 0.65, 1);
        rayEye(c, ep[0], ep[1], T * 0.8, { sIn, ang, shock, blink: M.blink || 0, look: [dx / dl * 0.8, Math.max(-0.45, dy / dl) * 0.65] }); }); };
    // the tail: a long whip arcing up over its back, a dark stripe down it
    const tw = Math.sin(bt * 2.1) * 0.35, tl = [[-2.75, 0, 0.12], [-3.95, 0.25 + tw * 0.3, 0.3], [-5.05, 0.9 + tw, 0.9], [-5.6, 1.8 + tw * 1.3, 1.95], [-5.25, 2.55 + tw * 1.45, 2.95], [-4.45, 2.8 + tw * 1.3, 3.4], [-3.8, 2.55 + tw * 1.1, 3.3]].map(p => W(...p));
    const tailPts = []; for (let i = 0; i < tl.length - 1; i++) for (let j = 0; j < 3; j++) { const u = j / 3, a = tl[i], b = tl[i + 1]; tailPts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]); } tailPts.push(tl[tl.length - 1]);
    const tailBehind = (tl[2][1] + tl[2][2]) - (C[1] + C[2]) < 0.5;
    const tail = () => { const sp = tailPts.map(p => P3(...p)), wf = u => T * (0.75 * Math.pow(1 - u, 1.2) + 0.08);
      TN.tube(c, sp, wf, { col: SKY, shade: SKY_SH, hi: SKY_HI, line: LINE, lw: Math.max(1.2, T * 0.07), d2: 0.4, spec: false,
        inner: g => { g.strokeStyle = SPOT; g.lineCap = 'round'; g.lineWidth = Math.max(1, T * 0.12); g.beginPath(); sp.forEach((p, i) => { if (i > sp.length - 3) return; i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke(); } });
      const tp = sp[sp.length - 1]; twinkle(c, tp[0], tp[1], T * 0.12, 0.5 + 0.4 * Math.sin(bt * 4)); };
    // paint far to near
    if (tailBehind && go(0)) tail();
    if (showTop) { if (go(0)) { paintBot(); paintTop(); } if (go(1)) { paintDome(); if (front) paintMouth(); paintEyes(); } }
    else { if (go(0)) { paintDome(); paintTop(); } if (go(1)) { paintBot(); paintBelly(); if (front) paintMouth(); }
      // flipped and dazed: little stars circle over it
      if (go(1)) for (let i = 0; i < 3; i++) { const a = bt * 3 + i * TAU / 3, p = P3(...W(0, 0, 0)); twinkle(c, p[0] + Math.cos(a) * T * 1.4, p[1] - T * 2.6 + Math.sin(a) * T * 0.45, T * 0.2, 0.9); } }
    if (!go(1)) return;
    if (!tailBehind) tail();
    if (gill > 0.3 && FX.H.part && Math.random() < 0.3 * gill) { const p = W(0.2, (Math.random() < 0.5 ? -1 : 1) * 1.2, -0.4); FX.H.part({ kind: 'smoke', x: p[0], y: p[1] - p[2] + 0.5, vx: FX.rnd(-0.6, 0.6), vy: 0.6, life: 1, max: 1, size: 0.6, color: 'rgba(130,220,160,' }); }
    drawOrbits(c, P3, C, T, bt, true, q);
    if (rear > 0.4) K.glow(c, X, Y - T * 2.2, T * 2.6, '#9FE8FF', 0.25 + 0.15 * Math.sin(t * 10));
  }
  function sh(h, k) { return shadeC(h, k); }
})();
