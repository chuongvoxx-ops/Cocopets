/* ---------- Light (pink), reworked Strongs: Love Shock (was Radiant Stitch), Love Bombs (was Mirrorwing Sweep) ----------
   Love Shock: luminous wings of tapered light ribbons (five big feathers a side, six at Celestial; deep pink roots,
   candy middles, pearl tips, thin interior streaks; a second back layer from Adept, a broader span at Celestial)
   unfold from the pet's back, the spheres gather in an arc in front of it, then the wings snap forward and fling them.
   Each sphere is a translucent pink shell over a solid pearl core with a little turning heart inside and an orbiting
   sparkle strand. From its first monster hit it bounces for exactly 3 s along short curved hops to other monsters
   (one hit per arrival; the same monster again only after 0.3 s per sphere, by a short loop when it is alone), each
   contact popping little hearts and stars; with no monster left it fades. Its final pop is decorative.
   3 spheres / 5 at Adept / 6 at Celestial (set symmetrically). Hits are timed by travel, never by frame rate.
   Love Bombs: two plump glossy heart bombs (rose-gold seam, a fuse of tiny linked lights with a heart charm) form
   beside the pet and are hurled on two different, staggered arcs, tumbling, to two ground spots marked by small heart
   footprints. Each squashes on landing, pulses, splits along its seam and explodes once: a pearl centre flash, a broad
   pink shockwave (a second thin ring from Adept), curved light fragments, and a rounded cloud of rising hearts (big slow
   ones and tiny fast stars; a flower-like burst and floor pattern at Celestial, nested hearts inside the shell).
   Blast radius x1.0 / x1.2 / x1.4 (interpolated). Two bombs at every level.
   2D canvas: "3D" here is cached shaded sprites, the shared thick turning heart (LU1, 20k4b), squash and moving light. */
(() => {
  const S = ELEM_IMPL.light.strong, TAU = Math.PI * 2;
  delete S.stitch; delete S.mirrorwing;
  const PINK = '#FF69B4', BLOS = '#FFB7D5', DEEP = '#D94B91', PEARL = '#FFF0F7', LAV = '#D8B4FF', RGOLD = '#E8AFB8', ROSE = '#FF5CCB', CANDY = '#FF8FDB';
  const cl = u => Math.max(0, Math.min(1, u)), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rg = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1))), evoK = ev => 1 + 0.08 * (ev - 1), tierOf = ev => (ev >= 7 ? 2 : ev >= 4 ? 1 : 0);
  const sfx = (H, k) => { const s = H.X.sfx; if (s && s[k]) s[k](); };
  const backOut = u => { u = cl(u); const s = 1.7; u -= 1; return u * u * ((s + 1) * u + s) + 1; };

  /* ---- cached sprites ---- */
  // a wing feather: root at (6, 34), tip at (186, 22); deep pink root -> candy -> blossom -> pearl tip, every end feathered
  const FW = 192, FH = 56;
  const fPath = (g, k) => { g.beginPath(); g.moveTo(6, 30 - 3 * k); g.bezierCurveTo(50, 8 - 6 * k, 120, 2 - 6 * k, 188 + 2 * k, 22); g.bezierCurveTo(130, 40 + 6 * k, 60, 50 + 6 * k, 6, 38 + 3 * k); g.closePath(); };
  const along = (g, stops) => { const gr = g.createLinearGradient(0, 0, FW, 0); stops.forEach(s => gr.addColorStop(s[0], s[1])); return gr; };
  const featherSpr = () => fxSprite('ls3feather', FW, FH, g => {
    for (const [k, a] of [[1.7, 0.06], [1.1, 0.1], [0.55, 0.18]]) { fPath(g, k); g.fillStyle = along(g, [[0, rg(PINK, 0)], [0.15, rg(PINK, a)], [0.8, rg(BLOS, a)], [1, rg(PEARL, 0)]]); g.fill(); }
    fPath(g, 0); g.fillStyle = along(g, [[0, rg(DEEP, 0)], [0.07, rg(DEEP, 0.95)], [0.36, rg(PINK, 0.96)], [0.7, rg(BLOS, 0.96)], [0.92, rg(PEARL, 0.92)], [1, rg(PEARL, 0)]]); g.fill();
    g.save(); fPath(g, 0); g.clip();
    let gr = g.createLinearGradient(0, 6, 0, 50); gr.addColorStop(0, 'rgba(255,240,247,0.4)'); gr.addColorStop(0.42, 'rgba(255,240,247,0)'); gr.addColorStop(0.58, 'rgba(140,28,86,0)'); gr.addColorStop(1, 'rgba(140,28,86,0.5)'); g.fillStyle = gr; g.fillRect(0, 0, FW, FH);
    g.lineCap = 'round'; g.lineWidth = 1.1;
    for (let i = 0; i < 9; i++) { const x = 28 + i * 17, y = 34 - 12 * x / 186; g.strokeStyle = rg(PEARL, 0.12 + 0.03 * i); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 6, x + 18, y - 12 + i * 0.6); g.moveTo(x, y + 1); g.quadraticCurveTo(x + 8, y + 5, x + 18, y + 9 - i * 0.5); g.stroke(); }
    g.strokeStyle = along(g, [[0, rg(PEARL, 0)], [0.15, rg(PEARL, 0.45)], [0.85, rg(PEARL, 0.95)], [1, rg(PEARL, 0)]]); g.lineWidth = 2.2; g.beginPath(); g.moveTo(8, 34); g.quadraticCurveTo(100, 25, 184, 22); g.stroke();
    g.restore(); });
  // a sphere's translucent shell (64 px): clear-ish middle, saturated rim, shade low right, a highlight crescent upper left
  const shellSpr = () => fxSprite('ls3shell', 64, 64, g => {
    let gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); [[0, 'rgba(255,183,213,0.10)'], [0.55, 'rgba(255,105,180,0.26)'], [0.8, 'rgba(255,105,180,0.6)'], [0.9, 'rgba(217,75,145,0.8)'], [0.96, 'rgba(217,75,145,0.4)'], [1, 'rgba(217,75,145,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    g.save(); g.beginPath(); g.arc(32, 32, 30, 0, TAU); g.clip();
    gr = g.createRadialGradient(46, 48, 0, 46, 48, 28); gr.addColorStop(0, 'rgba(140,28,86,0.38)'); gr.addColorStop(1, 'rgba(140,28,86,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(255,183,213,0.55)'; g.lineWidth = 2.6; g.beginPath(); g.arc(31, 31, 26.5, 0.15, 1.65); g.stroke();
    g.save(); g.translate(21, 19); g.rotate(-0.65); g.scale(12, 6.5); gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, 'rgba(255,255,255,0.8)'); gr.addColorStop(0.6, 'rgba(255,240,247,0.3)'); gr.addColorStop(1, 'rgba(255,240,247,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(19, 17, 2.4, 0, TAU); g.fill(); g.restore(); });
  // soft floor rings (shockwaves, contact ripples)
  const ringSpr = thin => fxSprite('ls3ring' + (thin ? 't' : ''), 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    (thin ? [[0, 'rgba(255,105,180,0)'], [0.84, 'rgba(255,105,180,0)'], [0.92, 'rgba(255,240,247,0.85)'], [0.97, 'rgba(255,105,180,0.3)'], [1, 'rgba(255,105,180,0)']]
      : [[0, 'rgba(255,105,180,0)'], [0.45, 'rgba(255,105,180,0.06)'], [0.72, 'rgba(255,105,180,0.4)'], [0.86, 'rgba(255,240,247,0.75)'], [0.94, 'rgba(255,105,180,0.3)'], [1, 'rgba(255,105,180,0)']]).forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const blit = (c, img, x, y, w, h, a, add) => { if (!(a > 0.01) || w < 0.5 || h < 0.3) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - w / 2, y - h / 2, w, h); c.restore(); };
  const floorRing = (c, X, Y, r, a, thin) => blit(c, ringSpr(thin), X, Y, r * 2, r * 2 * 0.55, a, true);
  // a tapered trail through screen points (tail first): zero width at the tail, w at the head, soft layered edges
  function taper(c, pts, w, layers) { if (pts.length < 2 || w < 0.5) return; const n = pts.length, Lft = [], Rgt = [];
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)]; let dx = q[0] - o[0], dy = q[1] - o[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; const k = Math.pow(i / (n - 1), 0.8); Lft.push([p[0] - dy * k, p[1] + dx * k]); Rgt.push([p[0] + dy * k, p[1] - dx * k]); }
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const [col, wk, a] of layers) { c.beginPath(); for (let i = 0; i < n; i++) { const p = pts[i], l = Lft[i]; const x = p[0] + (l[0] - p[0]) * w * wk, y = p[1] + (l[1] - p[1]) * w * wk; i ? c.lineTo(x, y) : c.moveTo(x, y); } for (let i = n - 1; i >= 0; i--) { const p = pts[i], r = Rgt[i]; c.lineTo(p[0] + (r[0] - p[0]) * w * wk, p[1] + (r[1] - p[1]) * w * wk); } c.closePath(); c.globalAlpha = a; c.fillStyle = col; c.fill(); }
    c.restore(); }
  const cubic = (p0, p1, p2, p3, u) => { const v = 1 - u; return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3; };

  /* ================= Love Shock ================= */
  // one feather in the wing's frame (already mirrored for the side): angle up from horizontal, length, width (px)
  function feather(c, th, len, wid, a, add) { if (!(a > 0.01) || len < 2) return; c.save(); c.rotate(-th); c.globalAlpha = Math.min(1, a); if (add) c.globalCompositeOperation = 'lighter'; const sx = len / 182, sy = wid / 40; c.drawImage(featherSpr(), -6 * sx, -34 * sy, FW * sx, FH * sy); c.restore(); }
  function drawWings(c, X, Y, T, W, tips) {
    const NF = W.tier === 2 ? 6 : 5, lo = W.tier === 2 ? -0.6 : -0.45, hi = W.tier === 2 ? 1.35 : 1.2, spanK = W.span;
    const ARM = T * 0.5 * spanK * lerp(0.3, 1, W.open) * (1 - 0.6 * W.diss), AA = lerp(-0.6, 0.8, W.open);
    // feathers root along a short arm (the lower ones near the back, the upper ones out at the wrist): a wing, not a fan
    const feather0 = feather; const atArm = (j, n, f2) => { const u = n > 1 ? j / (n - 1) : 0.5, d = ARM * (0.1 + 0.9 * u); c.save(); c.translate(Math.cos(AA) * d, -Math.sin(AA) * d); f2(); c.restore(); };
    for (const s of [-1, 1]) {
      c.save(); c.translate(X + s * T * 0.07, Y - T * 0.5); c.scale(s * (1 - 0.32 * W.snap), 1 + 0.08 * W.snap);
      const feather = (th, len, wid, a, add, j, n) => atArm(j, n, () => feather0(c, th, len, wid, a, add));
      const ang = (j, n, off) => { const u = n > 1 ? j / (n - 1) : 0.5, op = W.open; return lerp(-1.3 + j * 0.06, lerp(lo, hi, u) * 0.85 + (off || 0), op) + W.snap * 0.32 * (0.4 + u) - W.droop * 0.14 * (1 - u) + 0.045 * Math.sin(W.t * 5.2 - j * 0.7 + s); };
      const lenOf = (j, n) => { const u = n > 1 ? j / (n - 1) : 0.5; return T * spanK * (0.72 + 0.6 * Math.sin(Math.PI * (0.18 + 0.72 * u))) * lerp(0.38, 1, W.open) * (1 - 0.82 * W.diss); };
      const A = W.a * (1 - Math.pow(W.diss, 1.4));
      // Adept: a second, deeper back layer between the big feathers
      if (W.tier >= 1) for (let j = 0; j < NF - 1; j++) { const L = lenOf(j + 0.5, NF) * 1.1; feather(ang(j + 0.5, NF, 0.04), L, L * 0.34, A * 0.62, false, j + 0.5, NF); }
      for (let j = 0; j < NF; j++) { const L = lenOf(j, NF); feather(ang(j, NF), L, L * 0.36, A, false, j, NF); if (tips && s === 1 && j % 2 === 0) { const th = ang(j, NF), d = ARM * (0.1 + 0.9 * j / (NF - 1)); tips.push([Math.cos(AA) * d + Math.cos(th) * L * 0.95, -Math.sin(AA) * d - Math.sin(th) * L * 0.95]); } }
      // thin interior streaks, and a controlled glow over the big feathers
      for (let j = 0; j < NF - 1; j++) { const L = lenOf(j + 0.5, NF) * 0.62; feather(ang(j + 0.5, NF, -0.05), L, L * 0.16, A * 0.7, true, j + 0.5, NF); }
      for (let j = 0; j < NF; j += 2) { const L = lenOf(j, NF); feather(ang(j, NF), L * 1.05, L * 0.5, A * (0.14 + 0.4 * W.flash), true, j, NF); }
      c.restore();
    }
  }
  function drawSphere(c, X, Y, r, sp, t, a, rich) {
    if (!(a > 0.01) || r < 1) return; const K = globalThis.LU1;
    K.glowC(c, X, Y, r * 2.5, ROSE, 0.32 * a); K.glowC(c, X, Y, r * 1.4, BLOS, 0.25 * a);
    const tilt = 0.55 + 0.25 * Math.sin(sp.sd), NS = rich ? 7 : 5, ph = t * 3.4 + sp.sd;
    const strand = front => { c.save(); c.translate(X, Y); c.rotate(tilt); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rg(PEARL, (front ? 0.55 : 0.22) * a); c.lineWidth = Math.max(0.8, r * 0.07); c.beginPath(); c.ellipse(0, 0, r * 1.3, r * 0.42, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.stroke();
      for (let q = 0; q < NS; q++) { const b = ph + q / NS * TAU, sn = Math.sin(b); if ((sn >= 0) !== front) continue; const ss = r * (0.34 + 0.12 * (q % 2)); c.globalAlpha = (front ? 0.95 : 0.45) * a; c.drawImage(K.starSpr(q % 2 ? BLOS : PEARL), Math.cos(b) * r * 1.3 - ss, sn * r * 0.42 - ss, ss * 2, ss * 2); } c.restore(); };
    strand(false);
    // the solid pearl core under its glow, the little turning heart, then the translucent shell
    c.save(); c.globalAlpha = a; c.fillStyle = PEARL; c.beginPath(); c.arc(X, Y, r * 0.34, 0, TAU); c.fill(); c.restore();
    K.glowC(c, X, Y, r * 0.75, PEARL, 0.75 * a);
    const hs = Math.max(0.18, Math.abs(Math.cos(sp.spin))), hr = r * 0.95; c.save(); c.globalAlpha = a; c.translate(X, Y + r * 0.04); c.rotate(0.25 * Math.sin(sp.spin * 0.5)); c.drawImage(K.smallSpr(PINK), -hr * hs, -hr, hr * 2 * hs, hr * 2); c.restore();
    blit(c, shellSpr(), X, Y, r * 2.15, r * 2.15, a);
    strand(true);
  }
  S.loveshock = (C, H) => {
    const K = globalThis.LU1; K.setH(H);
    const me = H.me, X = H.X, ev = evoOf(C), L = tierOf(ev), N = [3, 5, 6][L], u7 = (ev - 1) / 6;
    // configurable: bounce window, hop speed, the alone-loop time, the per-sphere per-target repeat delay, search reach
    const BOUNCE = 3, HOP_V = 10.5, LOOP = 0.32, REHIT = 0.3, REACH = 6.5, REL = 0.58, LAUNCH_R = 9;
    const tot = C.base * 2.6 * C.K * evoK(ev), PER = tot * 1.3 / (N * 9);   // a sphere lands ~9 hits in its 3 s
    const RS = 0.23 + 0.03 * u7, SPAN = 1 + 0.3 * u7;
    const B = K.bits(), pops = [], sph = [], aim = C.a, spread = N > 1 ? Math.min(0.48, 2.4 / (N - 1)) : 0;
    for (let i = 0; i < N; i++) { const q = i - (N - 1) / 2; sph.push({ i, q, b: aim + q * spread, x: me.x, y: me.y, z: 0.8, st: 'form', hop: null, tg: null, t0: -1, last: new Map(), tr: [], a: 0, spin: R1(i + 3) * TAU, sd: i * 1.7 + 1, nh: 0, dieT: 0, vel: 0, side: i % 2 ? 1 : -1 }); }
    sfx(H, 'hum');
    let lastSnd = -1;
    const ping = (f, k) => { if (f.t - lastSnd > 0.07) { lastSnd = f.t; sfx(H, k); } };
    const pop = (f, x, y, z, big) => { pops.push({ x, y, z, t0: f.t, big });
      const nh = H.n(big ? 9 : 5 + L), ns = H.n(big ? 7 : 4 + L);
      for (let q = 0; q < nh; q++) { const b = Math.random() * TAU, v = 1.4 + Math.random() * (big ? 2.6 : 2); B.add(x, y, z, { vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5, vz: 1.2 + Math.random() * 1.6, g: 1.2, drag: 2.4, life: 0.55 + Math.random() * 0.4, s: q === 0 ? 0.17 : 0.07 + Math.random() * 0.06, kind: 'h', col: [PINK, BLOS, CANDY, L === 2 ? LAV : PINK][q % 4], rot: 0.5 }); }
      for (let q = 0; q < ns; q++) { const b = Math.random() * TAU, v = 3 + Math.random() * 3; B.add(x, y, z, { vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5, vz: Math.random() * 2.2, drag: 3.4, life: 0.32 + Math.random() * 0.2, s: 0.08 + Math.random() * 0.05, kind: 's', col: q % 2 ? PEARL : BLOS }); }
      H.burst(x, y - z, 'spark', H.n(4), { v: 4.5, up: 1.5, g: 6, life: 0.25, size: 1.6, color: [PEARL, BLOS, PINK] }); };
    const eligible = (sp, m, t) => m && !m.dead && !(sp.last.has(m) && t - sp.last.get(m) < REHIT - 1e-6);
    const pickNext = (sp, t) => { const skip = new Set(); if (sp.tg) skip.add(sp.tg); for (const [m, t1] of sp.last) if (t - t1 < REHIT + 0.05) skip.add(m); return X.nearestMon(sp.x, sp.y, REACH, skip, true); };
    // a short curved hop: cubic from the sphere to the monster (its live position), or a loop out and back when alone
    const startHop = (sp, t, m, loop) => { const dx = m.x - sp.x, dy = m.y - sp.y, d = Math.hypot(dx, dy) || 0.01, nx = -dy / d, ny = dx / d; sp.side = -sp.side;
      if (loop) { const b = sp.b + sp.side * 1.1 + (R1(sp.nh + sp.i * 7) - 0.5), ox = Math.cos(b), oy = Math.sin(b), px = -oy, py = ox; sp.hop = { t0: t, dur: LOOP, x0: sp.x, y0: sp.y, z0: sp.z, c1: [m.x + ox * 1.15 + px * 0.65, m.y + oy * 1.15 + py * 0.65], c2: [m.x + ox * 1.15 - px * 0.65, m.y + oy * 1.15 - py * 0.65], m, h: 0.5 }; sp.b = b; }
      else { const k = Math.min(1.2, d * 0.32) * sp.side; sp.hop = { t0: t, dur: Math.max(0.16, d / HOP_V), x0: sp.x, y0: sp.y, z0: sp.z, c1: [sp.x + dx * 0.3 + nx * k, sp.y + dy * 0.3 + ny * k], c2: [sp.x + dx * 0.72 + nx * k * 0.6, sp.y + dy * 0.72 + ny * k * 0.6], m, h: 0.25 + Math.min(0.7, d * 0.12) }; sp.b = Math.atan2(dy, dx); }
      sp.tg = m; };
    const endSphere = (sp, f, popIt) => { if (sp.st === 'die' || sp.st === 'gone') return; sp.st = 'die'; sp.dieT = f.t; sp.hop = null; if (popIt) { pop(f, sp.x, sp.y, sp.z, true); ping(f, 'chime'); } };
    return H.add({ life: 12, x: me.x, y: me.y,
      update(dt, f) {
        const t = f.t; f.x = me.x; f.y = me.y; B.step(dt);
        for (let i = pops.length - 1; i >= 0; i--) if (t - pops[i].t0 > 0.6) pops.splice(i, 1);
        if (t < REL) { // gathering in an arc in front of the pet
          for (const sp of sph) { const k = backOut((t - 0.12 - sp.i * 0.04) / 0.3); sp.a = cl(k); sp.x = me.x + Math.cos(sp.b) * 0.95 * (0.6 + 0.4 * k); sp.y = me.y + Math.sin(sp.b) * 0.95 * (0.6 + 0.4 * k); sp.z = 0.72 + 0.28 * Math.cos(sp.q / Math.max(1, N - 1) * Math.PI) + 0.04 * Math.sin(t * 7 + sp.i); }
          if (t > 0.1 && Math.random() < dt * 22 * H.Q()) { const sp = sph[Math.floor(Math.random() * N)], b = Math.random() * TAU; B.add(sp.x + Math.cos(b) * 0.55, sp.y + Math.sin(b) * 0.3, sp.z + 0.2, { vx: -Math.cos(b) * 1.6, vy: -Math.sin(b) * 0.8, vz: -0.4, drag: 1, life: 0.3, s: 0.05, kind: 's', col: BLOS }); }
        }
        if (t >= REL && !f.rel) { f.rel = true; sfx(H, 'whoosh'); sfx(H, 'chime'); X.light(me.x, me.y, 3, 0.2);
          const list = H.sortNear(me.x, me.y).filter(m => Math.hypot(m.x - me.x, m.y - me.y) < LAUNCH_R + m.r);
          // spread the first targets: each sphere takes the monster nearest its own launch direction, distinct while there are enough
          const used = new Set();
          for (const sp of sph) { let best = null, bs = 1e9; for (const m of list) { const da = Math.abs(H.wrap(Math.atan2(m.y - me.y, m.x - me.x) - sp.b)), sc = da * 3 + Math.hypot(m.x - me.x, m.y - me.y) * 0.25 + (used.has(m) ? 4 : 0); if (sc < bs) { bs = sc; best = m; } }
            sp.st = 'fly'; sp.launchT = t + sp.i * 0.035; if (best) { used.add(best); sp.pend = best; } else sp.pend = null; }
        }
        let alive = 0;
        for (const sp of sph) {
          if (sp.st === 'gone') continue; alive++;
          if (sp.st === 'form') continue;
          if (sp.st === 'die') { sp.a = 1 - cl((t - sp.dieT) / 0.28); if (sp.a <= 0) sp.st = 'gone'; continue; }
          if (sp.st === 'fly' && !sp.hop) { if (t < sp.launchT) continue;
            let m = sp.pend && !sp.pend.dead ? sp.pend : X.nearestMon(sp.x, sp.y, LAUNCH_R, null, true);
            if (m) startHop(sp, t, m, false);
            else { // nothing to seek: a straight fling along its direction, then a fade
              sp.hop = { t0: t, dur: 0.6, x0: sp.x, y0: sp.y, z0: sp.z, c1: [sp.x + Math.cos(sp.b) * 1.5, sp.y + Math.sin(sp.b) * 1.5], c2: [sp.x + Math.cos(sp.b) * 3, sp.y + Math.sin(sp.b) * 3], end: [sp.x + Math.cos(sp.b) * 4.5, sp.y + Math.sin(sp.b) * 4.5], m: null, h: 0.2 }; } }
          const hp = sp.hop; if (!hp) continue;
          // retarget a hop whose monster died on the way
          if (hp.m && hp.m.dead) { const m = pickNext(sp, t) || (sp.st === 'fly' ? X.nearestMon(sp.x, sp.y, LAUNCH_R, null, true) : null); if (m) { startHop(sp, t, m, false); continue; } endSphere(sp, f, false); continue; }
          const u = cl((t - hp.t0) / hp.dur), ex = hp.m ? hp.m.x : hp.end[0], ey = hp.m ? hp.m.y : hp.end[1], ox = sp.x, oy = sp.y;
          sp.x = cubic(hp.x0, hp.c1[0], hp.c2[0], ex, u); sp.y = cubic(hp.y0, hp.c1[1], hp.c2[1], ey, u); sp.z = lerp(hp.z0, 0.5, u) + Math.sin(Math.PI * u) * hp.h;
          sp.vel = Math.hypot(sp.x - ox, sp.y - oy) / Math.max(1e-3, dt); sp.spin += dt * (5 + sp.vel * 0.4);
          if (!hp.m) { if (sp.st === 'fly') for (const m of H.living()) if (Math.hypot(m.x - sp.x, m.y - sp.y) < m.r + RS) { startHop(sp, t, m, false); sp.hop.dur = 0.001; break; } if (u >= 1) endSphere(sp, f, false); continue; }
          if (u < 1) continue;
          // arrival: one hit (the bounce window opens on the first)
          const m = hp.m; sp.hop = null;
          if (sp.st === 'fly') { sp.st = 'bounce'; sp.t0 = t; }
          if (t - sp.t0 <= BOUNCE && eligible(sp, m, t)) { X.hitMon(m, PER, C.dmgO({ kb: 0.6 })); sp.last.set(m, t); sp.nh++; pop(f, m.x, m.y, 0.5, false); ping(f, sp.nh % 3 ? 'pop' : 'sparkle'); X.light(m.x, m.y, 1.6, 0.12); }
          if (t - sp.t0 >= BOUNCE) { endSphere(sp, f, true); continue; }
          const nx = pickNext(sp, t);
          if (nx) startHop(sp, t, nx, false); else if (!m.dead) startHop(sp, t, m, true); else { const any = X.nearestMon(sp.x, sp.y, REACH, null, true); if (any) startHop(sp, t, any, any === m); else endSphere(sp, f, true); }
        }
        // the bounce windows close on time even mid-hop
        for (const sp of sph) if (sp.st === 'bounce' && t - sp.t0 >= BOUNCE) endSphere(sp, f, true);
        for (const sp of sph) { if (sp.st === 'form' || sp.st === 'gone') { sp.tr.length = 0; continue; } sp.tr.push([sp.x, sp.y, sp.z, t]); while (sp.tr.length && t - sp.tr[0][3] > (L ? 0.2 : 0.14)) sp.tr.shift(); if (L >= 1 && sp.st !== 'die' && Math.random() < dt * 14 * H.Q()) B.add(sp.x, sp.y, sp.z, { vz: 0.4, drag: 2, life: 0.35, s: 0.05, kind: 's', col: Math.random() < 0.5 ? PEARL : BLOS }); }
        // the wings shed sparkles from their tips as they dissolve
        if (f.tips && t > 1.15 && t < 1.7 && Math.random() < dt * 30 * H.Q()) { const T = X.Tz(), p = f.tips[Math.floor(Math.random() * f.tips.length)], s = Math.random() < 0.5 ? -1 : 1; B.add(me.x + s * p[0] / T, me.y + 0.02, 0.52 + -p[1] / T, { vx: s * 0.4, vz: 0.5, drag: 1, life: 0.45, s: 0.06, kind: Math.random() < 0.4 ? 'h' : 's', col: Math.random() < 0.5 ? BLOS : PEARL }); }
        if (t > 1.8 && alive === 0 && B.L.length === 0 && !pops.length) f.life = 0;
        if (t > 9) for (const sp of sph) sp.st = 'gone';
      },
      drawUnder(c, f, X0, Y0, T) {
        const t = f.t;
        // the wings, behind the pet: unfold, snap forward to fling, settle, dissolve from the tips
        const open = backOut(t / 0.4), snap = t > REL - 0.06 ? Math.sin(Math.PI * cl((t - REL + 0.06) / 0.26)) : 0, droop = sm((t - 0.85) / 0.4), diss = sm((t - 1.15) / 0.5);
        if (diss < 1) { const tips = []; drawWings(c, H.sx(me.x), H.sy(me.y), T, { open, snap, droop, diss, t, a: cl(t / 0.12), tier: L, span: SPAN, flash: snap }, tips); f.tips = tips; }
        // pink floor light under each sphere and its contact ripples
        for (const sp of sph) { if (sp.st === 'gone' || sp.a < 0.02) continue; const gx = H.sx(sp.x), gy = H.sy(sp.y), k = cl(1 - sp.z / 2.5); blit(c, glowSprite(PINK), gx, gy, T * RS * 5 * k, T * RS * 5 * 0.55 * k, 0.32 * sp.a, true); H.softShadow(c, gx, gy, T * RS * 1.1, 0.16 * sp.a * k); }
        for (const p of pops) { const u = (t - p.t0) / 0.5; if (u < 0 || u > 1) continue; floorRing(c, H.sx(p.x), H.sy(p.y), T * (0.25 + (p.big ? 1.1 : 0.75) * H.ease.out(u)), (1 - u) * 0.8); }
      },
      draw(c, f, X0, Y0, T) {
        const t = f.t;
        for (const sp of sph) { if (sp.st === 'gone' || sp.a < 0.02) continue;
          // the trail: follows the real path, widens with speed, tapers to nothing
          if (sp.tr.length > 2) { const pts = sp.tr.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]), w = T * RS * (0.35 + 0.65 * cl(sp.vel / 9)) * sp.a;
            taper(c, pts, w, L ? [[ROSE, 1.5, 0.16], [PINK, 1, 0.34], [BLOS, 0.5, 0.5], [PEARL, 0.2, 0.75]] : [[ROSE, 1.4, 0.16], [PINK, 0.9, 0.36], [PEARL, 0.3, 0.65]]); }
          const sx0 = H.sx(sp.x), sy0 = H.sy(sp.y) - sp.z * T, pulse = sp.st === 'die' ? 1 + 0.5 * (1 - sp.a) : 1;
          drawSphere(c, sx0, sy0, T * RS * pulse * (sp.st === 'form' ? Math.max(0.05, sp.a) : 1), sp, t, sp.st === 'form' ? cl(sp.a * 1.4) : sp.a, L >= 1);
        }
        // contact pops: a little heart outline springs out of the contact and a brief pearl flash
        for (const p of pops) { const u = (t - p.t0) / 0.42; if (u < 0 || u > 1) continue; const X = H.sx(p.x), Y = H.sy(p.y) - p.z * T, sz = T * (p.big ? 0.9 : 0.55) * (0.5 + 0.9 * H.ease.out(u)); K.blitC(c, K.lineSpr(), X, Y - T * 0.1 * u, sz, sz, (1 - u) * 0.9, true); if (u < 0.35) K.glowC(c, X, Y, T * (p.big ? 0.8 : 0.5), PEARL, (1 - u / 0.35) * 0.8); }
        B.draw(c, T);
      } });
  };

  /* ================= Love Bombs ================= */
  S.lovebombs = (C, H) => {
    const K = globalThis.LU1; K.setH(H);
    const me = H.me, X = H.X, ev = evoOf(C), L = tierOf(ev), u7 = (ev - 1) / 6;
    const R = 1.6 * (1 + 0.4 * u7), DMG = C.base * 1.35 * C.K * evoK(ev), HB = 0.78 + 0.14 * u7;   // radius x1.0..1.4, each bomb one AoE hit; bomb height (tiles)
    const MAXD = 7.5, B = K.bits(), aim = C.a, ca = Math.cos(aim), sa = Math.sin(aim);
    // two ground spots: the aim (its monster) and a second monster near it, else a spot beside the first
    const clampD = (x, y) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); return d > MAXD ? [me.x + dx / d * MAXD, me.y + dy / d * MAXD] : [x, y]; };
    let p1 = clampD(C.tx, C.ty); const cand = H.sortNear(p1[0], p1[1]).filter(m => Math.hypot(m.x - me.x, m.y - me.y) < MAXD + 1 && Math.hypot(m.x - p1[0], m.y - p1[1]) > R * 1.05);
    let p2 = cand.length ? clampD(cand[0].x, cand[0].y) : [p1[0] - sa * R * 1.5, p1[1] + ca * R * 1.5];
    const w1 = H.walk(p1[0], p1[1]), w2 = H.walk(p2[0], p2[1]); p1 = [w1.x, w1.y]; p2 = [w2.x, w2.y];
    // the bomb thrown from the left takes the spot on its side, so the arcs do not cross
    const side = (p) => (p[0] - me.x) * -sa + (p[1] - me.y) * ca;
    if (side(p1) > side(p2)) { const q = p1; p1 = p2; p2 = q; }
    const bombs = [-1, 1].map((s, i) => ({ s, i, tx: (i ? p2 : p1)[0], ty: (i ? p2 : p1)[1], lt: 0.34 + i * 0.2, peak: 2.1 + i * 0.75, st: 'form', x: 0, y: 0, z: 0, tr: [], ph: R1(i + 5) * TAU, det: -1, land: -1, sx0: 0, sy0: 0 }));
    for (const b of bombs) { const d = Math.hypot(b.tx - me.x, b.ty - me.y); b.dur = 0.52 + d * 0.035; }
    sfx(H, 'hum');
    const explode = (f, b) => { b.st = 'boom'; b.det = f.t;
      H.hitArea(b.tx, b.ty, R, DMG, C.dmgO({ kb: 3 }));
      X.light(b.tx, b.ty, R * 1.7, 0.45); X.shake(5 + L, 0.16); if (X.hitstop) X.hitstop(0.03); sfx(H, 'crash'); sfx(H, 'thud'); sfx(H, 'sparkle');
      // the rounded cloud of hearts: a few big slow tumbling ones, many small, tiny fast stars; a flower-like burst at Celestial
      const NB = H.n(4 + L), NSm = H.n(10 + 3 * L), NSt = H.n(10 + 3 * L);
      for (let q = 0; q < NB; q++) { const a = q / NB * TAU + R1(q + b.i) * 0.6, v = 1 + Math.random() * 1.2; B.add(b.tx, b.ty, 0.5, { vx: Math.cos(a) * v * R * 0.6, vy: Math.sin(a) * v * R * 0.3, vz: 2 + Math.random() * 1.2, g: 0.8, drag: 1.4, life: 1.1 + Math.random() * 0.4, s: 0.22 + Math.random() * 0.08, kind: 'h', col: q % 2 ? PINK : CANDY, rot: 0.8 }); }
      for (let q = 0; q < NSm; q++) { const a = Math.random() * TAU, v = (1.5 + Math.random() * 2.5) * R * 0.5; B.add(b.tx, b.ty, 0.45, { vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5, vz: 1.5 + Math.random() * 2.5, g: 1, drag: 2.2, life: 0.7 + Math.random() * 0.5, s: 0.08 + Math.random() * 0.06, kind: 'h', col: [PINK, BLOS, CANDY, L === 2 ? LAV : BLOS][q % 4], rot: 0.5 }); }
      for (let q = 0; q < NSt; q++) { const a = Math.random() * TAU, v = (4 + Math.random() * 4) * R * 0.5; B.add(b.tx, b.ty, 0.4, { vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5, vz: Math.random() * 3, drag: 3.5, life: 0.35 + Math.random() * 0.25, s: 0.07 + Math.random() * 0.04, kind: 's', col: q % 2 ? PEARL : BLOS }); }
      if (L === 2) for (let pe = 0; pe < 6; pe++) { const a = pe / 6 * TAU + b.i * 0.5; for (let q = 0; q < H.n(3); q++) { const v = (1.6 + q * 1.1) * R * 0.45; B.add(b.tx, b.ty, 0.5, { vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.55, vz: 1.2 + q * 0.5, g: 0.6, drag: 2, life: 0.9 + q * 0.15, s: 0.1 + 0.03 * (2 - q), kind: q === 1 ? 's' : 'h', col: q ? BLOS : PINK }); } }
      H.burst(b.tx, b.ty - 0.5, 'spark', H.n(10), { v: 7, up: 2, g: 8, life: 0.35, size: 2, color: [PEARL, BLOS, PINK] });
      b.frags = []; const NF = 6 + 2 * L; for (let q = 0; q < NF; q++) b.frags.push({ a: q / NF * TAU + R1(q * 3 + b.i), v: 0.8 + R1(q + 9) * 0.6, len: 0.5 + R1(q + 2) * 0.6, up: 0.4 + R1(q + 4) * 0.8 }); };
    return H.add({ life: 4, x: me.x, y: me.y,
      update(dt, f) {
        const t = f.t; B.step(dt);
        for (const b of bombs) {
          const fx0 = me.x - sa * b.s * 0.8 - ca * 0.15, fy0 = me.y + ca * b.s * 0.8 - sa * 0.15;
          if (b.st === 'form') { b.x = fx0; b.y = fy0; b.z = 0.95 + 0.05 * Math.sin(t * 6 + b.i); b.sx0 = b.x; b.sy0 = b.y;
            if (Math.random() < dt * 14 * H.Q()) { const a = Math.random() * TAU; B.add(b.x + Math.cos(a) * 0.6, b.y + Math.sin(a) * 0.3, b.z + 0.1, { vx: -Math.cos(a) * 1.8, vy: -Math.sin(a) * 0.9, drag: 1, life: 0.28, s: 0.05, kind: 's', col: BLOS }); }
            if (t >= b.lt) { b.st = 'fly'; b.ft = t; sfx(H, 'whoosh'); } }
          else if (b.st === 'fly') { const u = cl((t - b.ft) / b.dur); b.x = lerp(b.sx0, b.tx, u); b.y = lerp(b.sy0, b.ty, u); b.z = lerp(0.95, 0.4, u) + 4 * u * (1 - u) * b.peak;
            if (u >= 1) { b.st = 'land'; b.land = t; b.z = 0.4; sfx(H, 'bounce'); } }
          else if (b.st === 'land') { if (t - b.land >= 0.12) explode(f, b); }
          if (b.st === 'form' || b.st === 'fly' || b.st === 'land') { b.tr.push([b.x, b.y, b.z, t]); } while (b.tr.length && t - b.tr[0][3] > 0.15) b.tr.shift();
        }
        if (bombs.every(b => b.st === 'boom' && t - b.det > 1.25) && B.L.length === 0) f.life = 0;
      },
      drawUnder(c, f, X0, Y0, T) {
        const t = f.t;
        for (const b of bombs) { const X = H.sx(b.tx), Y = H.sy(b.ty);
          // the heart footprint marking the landing spot, brightening as the bomb arrives
          if (b.st !== 'boom' || t - b.det < 0.2) { const u = b.st === 'fly' ? cl((t - b.ft) / b.dur) : b.st === 'form' ? 0 : 1, a = cl(t / 0.25) * (b.st === 'boom' ? 1 - (t - b.det) / 0.2 : 1), sz = T * (0.75 + 0.2 * u + 0.05 * Math.sin(t * 10));
            K.blitC(c, K.lineSpr(), X, Y, sz, sz * 0.55, a * (0.4 + 0.45 * u), true); blit(c, glowSprite(PINK), X, Y, T * 1.4, T * 0.77, a * 0.25 * (0.4 + u), true); }
          // the bomb's shadow and its moving pink light on the floor
          if (b.st !== 'boom') { const gx = H.sx(b.x), gy = H.sy(b.y), k = cl(1 - b.z / 4); H.softShadow(c, gx, gy, T * HB * 0.45 * (0.6 + 0.4 * k), 0.22 * k); blit(c, glowSprite(PINK), gx, gy, T * HB * 2 * k, T * HB * 1.1 * k, 0.3, true); }
          else { const e = t - b.det;
            // the shockwave: a broad ring (a second thin one from Adept), a soft light pool, a flower of heart prints at Celestial
            const u = cl(e / 0.5); if (u < 1) { floorRing(c, X, Y, T * R * (0.25 + 0.95 * H.ease.out(u)), (1 - u) * 0.95); blit(c, glowSprite(PINK), X, Y, T * R * 2.2, T * R * 1.2, (1 - u) * 0.45, true); }
            if (L >= 1) { const v = cl((e - 0.07) / 0.55); if (v > 0 && v < 1) floorRing(c, X, Y, T * R * (0.3 + 1.05 * H.ease.out(v)), (1 - v) * 0.85, true); }
            if (L === 2) { const v = cl((e - 0.05) / 0.9); if (v > 0 && v < 1) for (let q = 0; q < 6; q++) { const a = q / 6 * TAU + b.i * 0.5, rr = T * R * (0.25 + 0.4 * H.ease.out(v)), sz = T * 0.55 * (0.6 + 0.6 * v); K.blitC(c, K.lineSpr(), X + Math.cos(a) * rr, Y + Math.sin(a) * rr * 0.55, sz, sz * 0.55, (1 - v) * 0.7, true); } }
          } }
      },
      draw(c, f, X0, Y0, T) {
        const t = f.t;
        for (const b of bombs) {
          if (b.st === 'boom') { const e = t - b.det, X = H.sx(b.tx), Y = H.sy(b.ty) - T * 0.42;
            // the shell splits along its seam: two halves peel apart and fade
            if (e < 0.34) { const u = e / 0.34, hp = T * HB, a = 1 - u * u;
              for (const s of [-1, 1]) { c.save(); c.translate(X + s * T * 0.9 * H.ease.out(u), Y - T * 0.35 * u + T * 0.6 * u * u); c.rotate(s * 1.6 * u); c.beginPath(); c.rect(s < 0 ? -hp : 0, -hp, hp, hp * 2); c.clip(); K.thickHeart(c, 0, 0, hp, 0.25, 0, a, 0.8 * (1 - u)); c.restore(); }
              c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - u) * 0.9; c.strokeStyle = PEARL; c.lineWidth = Math.max(1, T * 0.05 * (1 - u)); c.lineCap = 'round'; c.beginPath(); c.moveTo(X, Y - hp * 0.3); c.lineTo(X, Y + hp * 0.5); c.stroke(); c.restore(); }
            // the pearl centre flash over a solid core, and the airborne pink dome of the blast
            const fu = e / 0.2; if (fu < 1) { if (fu < 0.45) { c.save(); c.globalAlpha = 1 - fu / 0.45; c.fillStyle = PEARL; c.beginPath(); c.arc(X, Y, T * 0.28 * (1 + fu), 0, TAU); c.fill(); c.restore(); } K.glowC(c, X, Y, T * R * (0.3 + 0.35 * fu), PEARL, (1 - fu) * 0.85); }
            const du = e / 0.55; if (du < 1) { K.glowC(c, X, Y + T * 0.1, T * R * (0.6 + 0.6 * H.ease.out(du)), ROSE, (1 - du) * 0.5); K.blitC(c, K.lineSpr(), X, Y - T * 0.1 * du, T * R * (0.6 + 1.0 * H.ease.out(du)), T * R * (0.6 + 1.0 * H.ease.out(du)), (1 - du) * 0.55, true); }
            // curved fragments of light peel away and vanish
            const gu = e / 0.4; if (gu < 1 && b.frags) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
              for (const q of b.frags) { const rr = T * R * (0.25 + 0.75 * H.ease.out(gu)) * q.v, cx = X + Math.cos(q.a) * rr, cy = Y + Math.sin(q.a) * rr * 0.6 - T * q.up * gu, ln = q.len * (1 - gu * 0.7);
                for (const [col, lw, al] of [[PINK, T * 0.12, 0.4], [PEARL, T * 0.04, 0.9]]) { c.globalAlpha = al * (1 - gu); c.strokeStyle = col; c.lineWidth = Math.max(0.8, lw * (1 - gu * 0.6)); c.beginPath(); c.arc(cx - Math.cos(q.a) * T * 0.3, cy - Math.sin(q.a) * T * 0.18, T * 0.3, q.a - ln, q.a + ln); c.stroke(); } }
              c.restore(); }
            continue; }
          if (!b.tr.length) continue;
          const a = b.st === 'form' ? cl((t - b.i * 0.06) / 0.25) : 1, grow = b.st === 'form' ? backOut((t - b.i * 0.06) / 0.3) : 1, X = H.sx(b.x), Y = H.sy(b.y) - b.z * T;
          if (a < 0.02) continue;
          // the short ribbon trail behind it
          if (b.st === 'fly' && b.tr.length > 2) taper(c, b.tr.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]), T * 0.22, [[ROSE, 1.4, 0.15], [CANDY, 0.8, 0.34], [PEARL, 0.25, 0.6]]);
          // tumble: a slow turn about its vertical axis and a rocking lean; squash on landing
          const ft = b.st === 'fly' ? t - b.ft : 0, spin = b.ph + (b.st === 'form' ? 0.25 * Math.sin(t * 3) : ft * 3.4), lean = b.st === 'form' ? 0.1 * b.s : 0.55 * Math.sin(ft * 4.2 + b.ph) * (b.st === 'land' ? 0 : 1);
          const hp = T * HB * Math.max(0.05, grow), lu = b.st === 'land' ? (t - b.land) / 0.12 : 0, sqx = b.st === 'land' ? 1 + 0.2 * Math.sin(Math.PI * lu) : 1, sqy = b.st === 'land' ? 1 - 0.25 * Math.sin(Math.PI * lu) : 1;
          c.save(); c.translate(X, Y + hp * 0.5); c.scale(sqx, sqy); c.translate(0, -hp * 0.5);
          K.thickHeart(c, 0, 0, hp, spin, lean, a, b.st === 'land' ? 0.9 * lu : 0.1 + 0.08 * Math.sin(t * 11));
          // the rose-gold seam down its middle, the nested heart pattern inside at Celestial, a gloss highlight
          const cs = Math.cos(spin), ws = Math.max(0.07, Math.abs(cs));
          c.save(); c.rotate(lean);
          if (Math.abs(cs) > 0.25) { c.lineCap = 'round'; c.globalAlpha = a * (Math.abs(cs) - 0.25) / 0.75; c.strokeStyle = RGOLD; c.lineWidth = Math.max(1, hp * 0.035); c.beginPath(); c.moveTo(0, -hp * 0.25); c.quadraticCurveTo(hp * 0.06 * Math.sin(spin), hp * 0.12, 0, hp * 0.47); c.stroke(); c.strokeStyle = rg(PEARL, 0.8); c.lineWidth = Math.max(0.6, hp * 0.012); c.stroke();
            if (L >= 1) { c.globalCompositeOperation = 'lighter'; for (let q = 0; q < (L === 2 ? 2 : 1); q++) { const sz = hp * (0.62 - q * 0.22); c.globalAlpha = a * (0.42 - q * 0.1) * Math.abs(cs); c.drawImage(K.lineSpr(), -sz * ws / 2, -sz * 0.47 + hp * 0.06, sz * ws, sz); } c.globalCompositeOperation = 'source-over'; } }
          K.glowC(c, -hp * 0.2 * cs, -hp * 0.28, hp * 0.16, PEARL, 0.6 * a);
          // the fuse: tiny linked lights from the cleft, lagging behind the motion, a heart charm at its tip
          const vx = b.tr.length > 1 ? b.tr[b.tr.length - 1][0] - b.tr[b.tr.length - 2][0] : 0, vz = b.tr.length > 1 ? b.tr[b.tr.length - 1][2] - b.tr[b.tr.length - 2][2] : 0, lag = [-vx * T * 3, vz * T * 3];
          const fp = []; for (let k = 0; k <= 5; k++) { const u = k / 5; fp.push([Math.sin(u * 2.2 + t * 3) * hp * 0.05 + lag[0] * u * u, -hp * 0.27 - u * hp * 0.4 + lag[1] * u * u]); }
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.7; c.strokeStyle = BLOS; c.lineWidth = Math.max(0.7, hp * 0.02); c.beginPath(); fp.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
          for (let k = 1; k < 5; k++) { const fl = 0.6 + 0.4 * Math.sin(t * 16 + k * 2); K.glowC(c, fp[k][0], fp[k][1], hp * 0.09, k % 2 ? PEARL : CANDY, a * fl); }
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; const ch = hp * 0.26; c.drawImage(K.smallSpr(PINK), fp[5][0] - ch / 2, fp[5][1] - ch / 2, ch, ch); K.glowC(c, fp[5][0], fp[5][1], ch * 0.8, PEARL, 0.5 * a * (0.7 + 0.3 * Math.sin(t * 9)));
          c.restore(); c.restore();
        }
        B.draw(c, T);
      } });
  };
})();
