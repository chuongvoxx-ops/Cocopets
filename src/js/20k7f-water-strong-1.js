/* ---------- Water, reworked Strongs: Crescent Tide, Ribbonfin, Tideglass Orb, Rainneedle Fan, Whirlpool Step ----------
   Shaded translucent water (sapphire depths, turquoise bodies, aqua edges, white foam), moving reflections, bubbles with
   clear centres and pearlescent rims, droplets, spray and glints; each builds up, releases and fades, never covers the
   pet, and escalates with evolution: more pieces at Adept, a repeated climax at Celestial, each repeat bigger.
   Crescent Tide (from the Ultimates): 1 / 2 / 4 crescents orbit and peel away through the monsters (Celestial: two
     crossing pairs and long hanging ribbons). Ribbonfin: 1 / 2 / 3 water fish, each bigger, curl, dart and wrap the
     target, bursting in crowns of splash. Tideglass Orb: 1 / 2 / 3 rolling spheres in a fan, each bigger, ending in a
     stretched collapse. Rainneedle Fan: 1 / 2 / 3 volleys of needles (7 / 9 / 11), the sheet reforming each time.
   Whirlpool Step: a spiral pool (a counter-turning inner swirl at Adept) whose column rises and collapses 1 / 2 / 3
     times, each higher and wider. Damage ≈ the old factor × C.K × evoK × (1.07 Adept / 1.15 Celestial), split over the
   pieces. Built on the shared water sprites of 20k7c (WU2K). */
(() => {
  const S = ELEM_IMPL.water.strong, TAU = Math.PI * 2; delete S.crescentsurf; delete ELEM_IMPL.water.ult.crescenttide;
  const { W, R1, cl, lerp, glow, strip, drawBub, WFLOOR, spoutSpr, bandSpr, poolSpr, sheenSpr, bubLSpr, hlSpr } = globalThis.WU2K;
  let H, K;
  const sfx = k => { const s = H.X.sfx; if (s && s[k]) s[k](); };
  function petHole(c, T) { return;   /* (v349: no mask round the pet: an attack in front of it covers it) */ const me = H.me, x = H.sx(me.x), y = H.sy(me.y) - T * 0.46; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd'); }
  const lvK = ev => ev >= 7 ? 1.15 : ev >= 4 ? 1.07 : 1;
  const FK = C => C.K * K.evoK(C) * lvK(K.evo(C));
  const sum = a => a.reduce((p, q) => p + q, 0);
  /* a tapered ribbon of water through screen points: thin at the start, thick at the end (sym: thick in the middle) */
  const chaikin = P => { const o = [P[0]]; for (let i = 0; i < P.length - 1; i++) { const p = P[i], q = P[i + 1]; o.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); } o.push(P[P.length - 1]); return o; };
  function rib(c, pts, w, a, sym) { if (pts.length < 2 || !(a > 0.01)) return; if (pts.length < 24) pts = chaikin(pts);
    if (WK.on()) { const G = WK.api, n = pts.length, P = pts.map((p, i) => { const u = i / (n - 1), tw = sym ? 0.2 + 0.8 * Math.sin(Math.PI * u) : 0.15 + 0.85 * u; return [p[0], p[1], Math.max(0.6, w * 0.62 * tw)]; }), sd = (pts[0][0] * 0.07 + pts[0][1] * 0.03) % 30;
      const Pd = []; for (let i = 0; i < n; i += 2) Pd.push(P[i]); if (Pd[Pd.length - 1] !== P[n - 1]) Pd.push(P[n - 1]);   /* (v361: a ribbon of flowing water on the GPU) */
      G.stream(c, Pd, w * 0.5, Math.min(1, a), { taper: 0, flow: 5, seed: sd, col: W.blue, dens: 0.9, lite: 0.7 }); G.glow(c, Pd[Pd.length >> 1][0], Pd[Pd.length >> 1][1], w * 2.5, W.turq, 0.18 * a); return; }
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const [col, k, aa] of [[W.turq, 1, 0.32], [W.aqua, 0.5, 0.6], [W.white, 0.14, 0.55]]) { c.strokeStyle = col; for (let i = 1; i < pts.length; i++) { const u = i / (pts.length - 1), tw = sym ? 0.2 + 0.8 * Math.sin(Math.PI * u) : 0.15 + 0.85 * u; c.globalAlpha = Math.min(1, a * aa * (sym ? 1 : 0.4 + 0.6 * u)); c.lineWidth = Math.max(0.6, w * k * tw); c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke(); } }
    c.restore(); }
  /* (v365) a thin trail of water energy through screen points (oldest first): a turbulent cyan energy thread with a bright
     core, fading toward its tail, bubbles and droplets trailing behind it. False without the GPU */
  function energyTrail(c, pts, T, a, sd, t) { if (!WK.on() || pts.length < 2 || !(a > 0.01)) return false; const G = WK.api, Q = G.gq(), n = pts.length, P = pts.map(p => G.xy(c, p[0], p[1]));
    for (let i = 1; i < n; i++) { const u = i / (n - 1), p0 = P[i - 1], p1 = P[i], dx = p1[0] - p0[0], dy = p1[1] - p0[1], w = T * 0.075 * (0.3 + 0.7 * u);
      Q.ebeam(p0[0] - dx * 0.3, p0[1] - dy * 0.3, p1[0] + dx * 0.3, p1[1] + dy * 0.3, w * 2.2, '#2E7BE6', 0.55, 0.45 * a * u, sd + i * 0.7, 10);
      Q.ebeam(p0[0] - dx * 0.3, p0[1] - dy * 0.3, p1[0] + dx * 0.3, p1[1] + dy * 0.3, w, '#5FE8FF', 0.82, 0.9 * a * u, sd + i * 1.3, 16); }
    for (let i = 0; i < n - 1; i += 3) { const u = i / (n - 1), p = pts[i]; G.bubbles(c, p[0], p[1] - T * 0.08 * (1 - u), T * (0.2 + 0.25 * (1 - u)), T * (0.2 + 0.3 * (1 - u)), 0.75 * a * (0.3 + 0.7 * u), { seed: sd + i * 1.7, rise: 1.2 }); }
    for (let i = 0; i < 4; i++) { const v = (t * 1.4 + i * 0.25 + sd * 0.1) % 1, k = Math.min(n - 1, Math.floor((1 - v) * (n - 1))), p = pts[k]; G.sphere(c, p[0] + Math.sin(i * 2.3 + t * 3) * T * 0.12, p[1] - v * T * 0.4, T * 0.035, a * (1 - v), { col: '#2E9BE6', seed: i + sd, halo: 1.6, dens: 0.5 }); }
    return true; }
  /* spray, droplets, a glint and the light of a splash (particles, world units) */
  function splashP(x, y, r, k) { H.burst(x, y - 0.3, 'spark', Math.round(8 * k), { v: 3 + 2 * r, up: 3, g: 9, life: 0.6, size: 2.3, color: [W.white, W.aqua, W.foam, W.turq] }); H.burst(x, y - 0.2, 'ember', Math.round(5 * k), { v: 2.5, up: 1.5, g: 4, life: 0.7, size: 2, color: [W.aqua, W.foam] }); H.glowAt(x, y - 0.3, r * 1.2, 0.35, W.aqua, 0.6); H.X.light(x, y, r * 2, 0.35); }
  /* a crown splash: a ring of water racing over the floor and spouts rising and falling round it (kept off the pet) */
  function crownFx(x, y, r, n, hh, dl) { H.add({ life: 0.75 + (dl || 0),
    drawUnder(c, f, X0, Y0, T) { const u = (f.t - (dl || 0)) / 0.7; if (u < 0 || u > 1) return; const X = H.sx(x), Y = H.sy(y), rr = T * r * (0.4 + 1.1 * H.ease.out(u)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - u) * 0.9; WFLOOR(c, 'band', X, Y, rr); c.restore(); },
    draw(c, f, X0, Y0, T) { const v = (f.t - (dl || 0)) / 0.6; if (v < 0 || v > 1) return; const X = H.sx(x), Y = H.sy(y), hq = T * hh * Math.sin(Math.PI * Math.min(1, v * 1.15)); c.save(); petHole(c, T);
      for (let i = 0; i < n; i++) { const th = i / n * TAU + R1(i + x) * 0.3, rr = r * (0.6 + 0.5 * v), x0 = X + Math.cos(th) * rr * T, y0 = Y + Math.sin(th) * rr * T * H.GY, h2 = hq * (0.6 + 0.6 * R1(i * 3 + y)), ln = T * (0.15 + 0.5 * v) * r;
        strip(c, spoutSpr(), 16, 124, 118, x0, y0, x0 + Math.cos(th) * ln, y0 + Math.sin(th) * ln * H.GY - h2, T * 0.26 * Math.max(0.7, Math.min(1.6, r)), (1 - v * v) * (Math.sin(th) < 0 ? 0.75 : 1)); }
      c.restore(); } }); }

  /* ================= Crescent Tide ================= */
  const cresSpr = () => fxSprite('wu2cres', 224, 128, g => {
    g.translate(16, 16); const outer = () => { g.moveTo(78, 4); g.quadraticCurveTo(150, 48, 78, 92); }, body = () => { g.beginPath(); outer(); g.quadraticCurveTo(108, 48, 78, 4); g.closePath(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [lw, a] of [[26, 0.05], [16, 0.08], [9, 0.12]]) { g.beginPath(); outer(); g.strokeStyle = `rgba(110,255,220,${a})`; g.lineWidth = lw; g.stroke(); }
    // the thin trailing sheet
    g.beginPath(); g.moveTo(78, 4); g.quadraticCurveTo(108, 48, 78, 92); g.quadraticCurveTo(40, 48, 78, 4); g.closePath(); let gr = g.createLinearGradient(50, 0, 102, 0); gr.addColorStop(0, 'rgba(47,212,208,0)'); gr.addColorStop(1, 'rgba(47,212,208,0.35)'); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(95,240,255,0.25)'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(78, 4 + k * 3); g.quadraticCurveTo(70 + k * 10, 48, 78, 92 - k * 3); g.stroke(); }
    // the body: turquoise, deeper behind, bright toward the rim
    body(); gr = g.createLinearGradient(85, 0, 116, 0); gr.addColorStop(0, 'rgba(20,80,180,0.55)'); gr.addColorStop(0.5, 'rgba(47,212,208,0.7)'); gr.addColorStop(1, 'rgba(150,250,240,0.85)'); g.fillStyle = gr; g.fill();
    // the thick rounded leading rim, its aquamarine edge and foam along the front
    g.beginPath(); outer(); g.strokeStyle = 'rgba(80,225,215,0.9)'; g.lineWidth = 6; g.stroke(); g.strokeStyle = 'rgba(160,255,235,0.95)'; g.lineWidth = 3; g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 16; k++) { const u = 0.1 + 0.8 * k / 15, q = 1 - u, x = q * q * 78 + 2 * q * u * 150 + u * u * 78 + 2 + R1(k) * 3, y = q * q * 4 + 2 * q * u * 48 + u * u * 92; g.beginPath(); g.arc(x, y, 0.8 + 1.6 * R1(k * 3.1), 0, TAU); g.fill(); } });
  /* one crescent at screen (X, Y), facing ang (its rim leading), size px; flex: the trailing sheet's sway */
  /* (v362) a crescent of water built on the GPU from scratch: a rolling crest of flowing water (thick and bright at its
     leading edge, thinning through translucent water to its inner curve), a thin trailing sheet swaying behind it, foam
     breaking along the crest with glints racing round it, a glow; Celestial's pearl a sphere of water riding the crest */
  function cres(c, X, Y, ang, sz, sy, a, flex, pearl) { if (!(a > 0.01)) return; if (!WK.on()) return cres2d(c, X, Y, ang, sz, sy, a, flex, pearl);
    const G = WK.api, s = sz / 88, A = Math.min(1, a), tt = (performance.now() / 1000) % 1000, sd = (ang * 3.7) % 20;
    const curve = (cx, w0, n) => { const P = []; for (let i = 0; i <= n; i++) { const u = i / n, q = 1 - u, lx = q * q * -16 + 2 * q * u * cx + u * u * -16, ly = q * q * -44 + u * u * 44; P.push([lx, ly, w0 * (0.15 + 0.85 * Math.pow(Math.sin(Math.PI * u), 0.8))]); } return P; };
    c.save(); c.translate(X, Y); c.rotate(ang); c.scale(s, s * sy);
    G.glow(c, 16, 0, 78, W.aqua, 0.22 * A);
    G.stream(c, curve(-22 - 14 * flex, 5, 6), 5, 0.45 * A, { taper: 0, flow: 3, seed: sd + 9, col: W.blue, dens: 0.3, lite: 0.6 });
    G.stream(c, curve(18, 7, 6), 7, 0.6 * A, { taper: 0, flow: 4, seed: sd + 5, col: W.sapph || '#1450B4', dens: 0.4, lite: 0.5 });
    G.stream(c, curve(36, 9, 7), 9, 0.8 * A, { taper: 0, flow: 5, seed: sd + 2, col: W.blue, dens: 0.55, lite: 0.7 });
    G.stream(c, curve(54, 9, 8), 9, A, { taper: 0, flow: 7, seed: sd, col: W.blue, dens: 0.9, lite: 1.0 });
    for (let i = 0; i < 3; i++) { const u = 0.25 + 0.25 * i, q = 1 - u, lx = q * q * -16 + 2 * q * u * 58 + u * u * -16, ly = q * q * -44 + u * u * 44; G.spray(c, lx + 4, ly, 13, 0.45 * A, { seed: sd + i * 3.1 + Math.floor(tt * 5) * 0.31, spread: 0.45 }); }
    for (let i = 0; i < 2; i++) { const u = (tt * 0.9 + i * 0.5 + sd * 0.1) % 1, q = 1 - u, lx = q * q * -16 + 2 * q * u * 56 + u * u * -16, ly = q * q * -44 + u * u * 44; G.star(c, lx + 2, ly, 16 * Math.sin(Math.PI * u), 0.8 * A); }
    if (pearl) { const u = pearl, q = 1 - u, lx = q * q * -16 + 2 * q * u * 56 + u * u * -16, ly = q * q * -44 + u * u * 44; G.sphere(c, lx, ly, 8, A, { col: W.blue, seed: sd, turn: 3, halo: 2.4 }); }
    G.bubbles(c, 12, 0, 26, 36, 0.6 * A, { seed: sd, rise: 1.6 });   /* (v364: bubbles caught in the body, droplets flung off the crest) */
    for (let i = 0; i < 5; i++) { const u = 0.1 + 0.2 * i, q = 1 - u, v = (tt * 1.8 + i * 0.37 + sd) % 1, lx = q * q * -16 + 2 * q * u * 58 + u * u * -16 + 10 + v * 26, ly = q * q * -44 + u * u * 44 + (u - 0.5) * v * 30; G.sphere(c, lx, ly, 2.6 * (1 - 0.5 * v), A * (1 - v), { col: W.blue, seed: i + sd, halo: 1.6, dens: 0.6 }); }
    c.restore(); }
  function cres2d(c, X, Y, ang, sz, sy, a, flex, pearl) { if (!(a > 0.01)) return; const s = sz / 88, spr = cresSpr();
    c.save(); c.translate(X, Y); c.rotate(ang); c.globalAlpha = Math.min(1, a * 0.4); c.save(); c.translate(-sz * 0.12, 0); c.scale(s * (0.85 + 0.12 * flex), s * sy * 0.96); c.drawImage(spr, -110, -64); c.restore();
    c.scale(s, s * sy); c.globalAlpha = Math.min(1, a); c.drawImage(spr, -110, -64);
    if (pearl) { c.globalCompositeOperation = 'lighter'; const u = pearl, q = 1 - u, px = q * q * 78 + 2 * q * u * 150 + u * u * 78 - 94, py = q * q * 4 + 2 * q * u * 48 + u * u * 92 - 48; c.globalAlpha = 0.8 * a; c.drawImage(glowSprite(W.pearl), px - 14, py - 14, 28, 28); c.drawImage(glowSprite(W.white), px - 6, py - 6, 12, 12); }
    c.restore(); }
  S.crescenttide = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, ev = K.evo(C), N = K.lv(C, [1, 2, 4]), cel = ev >= 7, dmg = C.base * 2.6 * FK(C) / N, SZ = 1.45 + 0.08 * (ev - 1), RL = cel ? 0.9 : 0.55;
    sfx('whoosh'); me.sq = 0.8;
    const cs = []; for (let i = 0; i < N; i++) { const p = i >> 1; cs.push({ i, s: 0.04 * i, R: 1.45 + 0.15 * (i % 2), z0: 0.3 + 0.3 * (i % 3), th0: i * TAU / N + C.a + Math.PI, rel: 0.5 + p * 0.24 + (i % 2) * 0.08, st: 0, hit: new Set(), tr: [], x: me.x, y: me.y, z: 0, ang: 0, rise: 0, th: 0 }); }
    const LIFE = cs[N - 1].rel + 0.65 + RL + 0.25, W0 = 4.2;
    H.add({ life: LIFE, rot: 0,
      update(dt, f) { const t = f.t; f.rot += dt * W0;
        for (const b of cs) {
          if (b.st === 0) { const th = b.th0 + f.rot, rise = H.ease.out(cl((t - b.s) / 0.28)); b.x = me.x + Math.cos(th) * b.R; b.y = me.y + Math.sin(th) * b.R * H.GY; b.z = (b.z0 + 0.12 * Math.sin(th * 2)) * rise; b.th = th; b.rise = rise;
            if (rise > 0.8 && Math.random() < 6 * dt * H.Q()) for (const sd of [-1, 1]) H.P({ kind: 'spark', x: b.x + Math.cos(th) * 0.3 * sd, y: b.y - b.z - SZ * 0.4 * sd, vx: -Math.sin(th) * 3, vy: Math.cos(th) * 2 - 1, g: 6, drag: 0.4, life: 0.45, max: 0.45, size: 1.8, color: Math.random() < 0.5 ? W.white : W.aqua });
            if (t >= b.rel) { b.st = 1; b.t0 = t; b.p0 = [b.x, b.y, b.z]; const L = H.sortNear(C.tx, C.ty), m = L.length && Math.hypot(L[0].x - C.tx, L[0].y - C.ty) < 5 ? L[0] : null, ex = m ? m.x : C.tx, ey = m ? m.y : C.ty, d = Math.hypot(ex - b.x, ey - b.y) || 1;
              b.dx = (ex - b.x) / d; b.dy = (ey - b.y) / d; b.len = Math.min(8, Math.max(5.5, d + 2.5)); b.cv = (b.i % 2 ? 1 : -1) * (0.9 + 0.3 * (b.i >> 1)); b.zt = cel ? (b.i % 2 ? 1.1 : 0.3) : 0.55; b.dur = 0.65; sfx('whoosh'); } }
          else if (b.st === 1) { const u = cl((t - b.t0) / b.dur), e = H.ease.io(u) * 0.35 + u * 0.65, s = e * b.len, k = Math.sin(Math.PI * e) * b.cv;
            const x = b.p0[0] + b.dx * s - b.dy * k, y = b.p0[1] + b.dy * s + b.dx * k; b.ang = Math.atan2(y - b.y, x - b.x); b.x = x; b.y = y; b.z = lerp(b.p0[2], b.zt, Math.min(1, u * 2));
            if (!b.trT || t - b.trT > 0.025) { b.trT = t; b.tr.push([b.x, b.y, b.z]); if (b.tr.length > 30) b.tr.shift(); }
            for (const m of H.living()) { if (b.hit.has(m) || Math.hypot(m.x - b.x, m.y - b.y) > 1.0 + m.r) continue; b.hit.add(m); H.X.hitMon(m, dmg, C.dmgO({ kb: 1.4 }));
              for (const sd of [-1, 1]) H.burst(m.x, m.y - 0.5, 'spark', 4, { v: 4, up: 1.5, g: 8, life: 0.45, size: 2.2, color: [W.white, W.aqua, W.foam], extra: { vx: -Math.sin(b.ang) * 6 * sd, vy: Math.cos(b.ang) * 4 * sd - 1.5 } }); }
            if (u >= 1) { b.st = 2; b.t1 = t; H.burst(b.x, b.y - b.z, 'spark', 10, { v: 3, up: 1, g: 5, life: 0.7, size: 2.2, color: [W.white, W.aqua, W.foam, W.turq] }); H.glowAt(b.x, b.y - b.z, 1.6, 0.5, W.aqua, 0.5); if (cel) crownFx(b.x, b.y, 0.8, 8, 0.7); } }
        }
      },
      paint(c, f, T, under) {
        const t = f.t, fa = cl((LIFE - t) / 0.25), sz = T * SZ;
        c.save(); if (!under) petHole(c, T);
        for (const b of cs) {
          if (b.st === 0) { if (t < b.s) continue; const sn = Math.sin(b.th); if ((sn < 0) !== under) continue; const X = H.sx(b.x), Y = H.sy(b.y);
            const u = cl((t - b.s) / 0.5); if (u < 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - u) * 0.8; c.strokeStyle = W.aqua; c.lineWidth = T * 0.06; c.beginPath(); c.ellipse(X, Y, T * (0.4 + u), T * (0.4 + u) * H.GY, 0, b.th + Math.PI / 2 - 1.2, b.th + Math.PI / 2 + 1.2); c.stroke(); c.restore(); }
            const dir = Math.atan2(Math.cos(b.th) * H.GY, -Math.sin(b.th)), bank = 0.55 + 0.45 * Math.abs(Math.cos(b.th));
            cres(c, X, Y - b.z * T - sz * 0.25, dir, sz * (0.5 + 0.5 * b.rise), (0.45 + 0.55 * b.rise) * bank, b.rise * (sn < 0 ? 0.8 : 1), Math.sin(t * 7 + b.i), cel ? (t * 0.8 + b.i * 0.17) % 1 : 0); continue; }
          if (under) continue;
          const ra = b.st === 1 ? 0.8 : cl(1 - (t - b.t1) / RL); if (b.tr.length > 1 && ra > 0) { const tp = b.tr.map((p, q) => [H.sx(p[0]), H.sy(p[1]) - p[2] * T - sz * 0.25 + (b.st === 2 ? Math.sin(t * 3 + q * 0.4) * T * 0.07 : 0)]); if (!energyTrail(c, tp, T, ra * fa, b.i * 3.1, t)) rib(c, tp, T * 0.3, ra * fa, true); }
          const X = H.sx(b.x), Y = H.sy(b.y) - b.z * T - sz * 0.25, an = Math.atan2(Math.sin(b.ang) * 0.8, Math.cos(b.ang));
          if (b.st === 1) cres(c, X, Y, an, sz, 1, fa, Math.sin(t * 9 + b.i), cel ? (t * 1.5 + b.i * 0.2) % 1 : 0);
          else { const u = cl((t - b.t1) / 0.35); if (u < 1) { c.save(); c.translate(X, Y); c.scale(1 + 0.8 * u, 1); cres(c, 0, 0, an, sz, 1 - 0.7 * u, (1 - u) * fa, 0, 0); c.restore(); c.save(); c.globalCompositeOperation = 'lighter'; glow(c, X, Y, sz * (0.5 + 0.6 * u), W.foam, 0.35 * (1 - u) * fa); c.restore(); } }
        }
        c.restore(); },
      drawUnder(c, f, X0, Y0, T) { f.paint(c, f, T, true); },
      draw(c, f, X0, Y0, T) { f.paint(c, f, T, false); } });
  };

  /* ================= Ribbonfin ================= */
  S.ribbonfin = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, ev = K.evo(C), NF = K.lv(C, [1, 2, 3]), wts = [1, 1.25, 1.6].slice(0, NF), ws = sum(wts), TOT = C.base * 2.5 * FK(C);
    sfx('whoosh'); me.sq = 0.75;
    for (let k = 0; k < NF; k++) {
      const dl = k * 0.2, sz = 1 + 0.25 * k, side = k % 2 ? -1 : 1, last = k === NF - 1, x0 = me.x, y0 = me.y, sp = (k ? (k % 2 ? 0.7 : -0.7) : 0), a1 = Math.atan2(C.ty - y0, C.tx - x0), tx = C.tx - Math.sin(a1) * sp * 0.6, ty = C.ty + Math.cos(a1) * sp * 0.6;
      const d = Math.hypot(tx - x0, ty - y0), a0 = Math.atan2(ty - y0, tx - x0), T1 = 0.28, T2 = T1 + Math.max(0.25, Math.min(0.45, d / 12)), T3 = T2 + 0.3, dm = TOT * wts[k] / ws;
      H.add({ life: dl + T3 + 0.45, pts: [], done: false, hx: x0, hy: y0, hz: 0,
        update(dt, f) { const t = f.t - dl; if (t < 0 || f.done) return; let hx, hy, z;
          if (t < T1) { const u = t / T1, b = a0 + Math.PI - u * Math.PI * 1.6 * side; hx = x0 + Math.cos(b) * 0.9 * sz; hy = y0 + Math.sin(b) * 0.5 * sz; z = 0.5 + u * 0.4 + 0.15 * k; }
          else if (t < T2) { const u = H.ease.io((t - T1) / (T2 - T1)), s = Math.sin(u * Math.PI * 3) * 0.35 * (1 - u); hx = x0 + (tx - x0) * u - Math.sin(a0) * s; hy = y0 + (ty - y0) * u + Math.cos(a0) * s; z = 0.9 + 0.15 * k - u * 0.3;
            if (!f.hit1 && u > 0.92) { f.hit1 = true; for (const m of H.near(tx, ty, 1.0)) { H.X.hitMon(m, dm * 0.2, C.dmgO({})); H.slow(m, 0.6); } }
            if (Math.random() < 0.8 * H.Q()) H.P({ kind: Math.random() < 0.5 ? 'spark' : 'ember', x: f.pts.length ? f.pts[0][0] : hx, y: (f.pts.length ? f.pts[0][1] - f.pts[0][2] : hy - z), vx: -Math.cos(a0) * 1.5, vy: 1, g: 6, life: 0.45, max: 0.45, size: 2, color: Math.random() < 0.5 ? W.white : W.aqua }); }
          else { const u = (t - T2) / (T3 - T2), b = a0 + u * TAU * side; if (u >= 1) { f.done = true; f.life = 0.35; const r = 1.5 * Math.sqrt(sz); H.hitArea(tx, ty, r, dm * 0.8, C.dmgO({ kb: 3 })); splashP(tx, ty, r, sz); crownFx(tx, ty, 1.1 * sz, 10 + 3 * k, 0.8 * sz); if (last && NF === 3) crownFx(tx, ty, 2.0, 18, 1.4, 0.12); sfx('crash'); H.X.shake(3 + 2 * k, 0.14); return; }
            hx = tx + Math.cos(b) * 0.7 * sz; hy = ty + Math.sin(b) * 0.5 * sz; z = 0.6 + Math.sin(u * Math.PI) * 0.3; }
          f.hx = hx; f.hy = hy; f.hz = z; f.pts.push([hx, hy, z]); if (f.pts.length > 16) f.pts.shift(); },
        drawUnder(c, f, X0, Y0, T) { if (f.t < dl || !f.pts.length) return; const a = f.done ? f.life / 0.35 : 1, X = H.sx(f.hx), Y = H.sy(f.hy), r = T * 0.9 * sz; if (WK.api.pool(c, X, Y, r * 1.1, 0.7 * a, { seed: dl * 7 })) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * a; WFLOOR(c, 'pool', X, Y, r); c.restore(); },
        draw(c, f, X0, Y0, T) { if (f.t < dl || f.pts.length < 2) return; const a = f.done ? f.life / 0.35 : cl((f.t - dl) / 0.12), P = f.pts.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]), n = P.length;
          c.save(); petHole(c, T);
          // the body: a tapered ribbon, a tail fin fanning from its end, a bright head with an eye glint, bubbles in its wake
          rib(c, P, T * 0.42 * sz, a, false);
          const tl = P[0], tn = P[Math.min(2, n - 1)], ta = Math.atan2(tl[1] - tn[1], tl[0] - tn[0]), fl = T * 0.45 * sz, wv = Math.sin(f.t * 18) * 0.25;
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (const sd of [-1, 1]) { const b = ta + sd * 0.6 + wv; for (const [col, lw, aa] of [[W.turq, T * 0.16 * sz, 0.35], [W.aqua, T * 0.06 * sz, 0.8]]) { c.globalAlpha = aa * a; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(tl[0], tl[1]); c.quadraticCurveTo(tl[0] + Math.cos(b - sd * 0.4) * fl * 0.6, tl[1] + Math.sin(b - sd * 0.4) * fl * 0.6, tl[0] + Math.cos(b) * fl, tl[1] + Math.sin(b) * fl); c.stroke(); } }
          const hd = P[n - 1]; WK.api.sphere(c, hd[0], hd[1], T * 0.2 * sz, a, { col: W.blue, seed: dl * 5, turn: 3, halo: 2.5 }); glow(c, hd[0], hd[1], T * 0.5 * sz, W.aqua, 0.5 * a); glow(c, hd[0], hd[1], T * 0.18 * sz, W.white, 0.9 * a); c.restore();
          for (let q = 1; q < n - 2; q += 3) drawBub(c, P[q][0] + Math.sin(q + f.t * 6) * T * 0.15, P[q][1] - T * 0.12 * (n - q) * 0.15, T * (0.06 + 0.03 * (q % 2)) * sz, 0.8 * a * q / n);
          c.restore(); } });
    }
  };

  /* ================= Tideglass Orb ================= */
  const orbSpr = () => fxSprite('wu3orb', 96, 96, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0 - 6, c0 - 8, 0, c0, c0, c0 - 1);
    [[0, 'rgba(190,250,255,0.22)'], [0.45, 'rgba(47,212,208,0.16)'], [0.8, 'rgba(20,80,180,0.42)'], [0.95, 'rgba(10,42,102,0.55)'], [1, 'rgba(10,42,102,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.lineCap = 'round'; g.strokeStyle = 'rgba(200,255,255,0.55)'; g.lineWidth = 3; g.beginPath(); g.arc(c0, c0, c0 * 0.78, 0.35 * Math.PI, 0.68 * Math.PI); g.stroke();
    g.strokeStyle = 'rgba(95,240,255,0.9)'; g.lineWidth = 1.6; g.beginPath(); g.arc(c0, c0, c0 - 3, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(c0 - 15, c0 - 17, 7, 4, -0.6, 0, TAU); g.fill(); });
  S.tideglass = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, ev = K.evo(C), NO = K.lv(C, [1, 2, 3]), wts = [1, 1.3, 1.7].slice(0, NO), ws = sum(wts), f0 = FK(C);
    sfx('hum'); me.sq = 0.7;
    for (let k = 0; k < NO; k++) {
      const dl = k * 0.22, a = C.a + (k === 1 ? 0.22 : k === 2 ? -0.22 : 0), R = 0.75 * (1 + 0.22 * k), V = 4.4 + 0.3 * k, dir = [Math.cos(a), Math.sin(a)], wk = wts[k] / ws, last = k === NO - 1;
      H.add({ life: dl + 1.75, x: me.x + dir[0] * 0.9, y: me.y + dir[1] * 0.9, roll: 0, hits: new Map(), ph: 0, t0: 0, ripples: [], st: 0,
        update(dt, f) { const t = f.t - dl; if (t < 0) return;
          if (f.ph === 0) { const nx = f.x + dir[0] * V * dt, ny = f.y + dir[1] * V * dt; if (t > 1.0 || H.X.blocked(nx, ny, 0.5, 0)) { f.ph = 1; f.t0 = t; } else { f.x = nx; f.y = ny; f.roll += V * dt / R; }
            for (const m of H.near(f.x, f.y, R)) { const l = f.hits.get(m); if (l != null && t - l < 0.45) continue; f.hits.set(m, t); H.X.hitMon(m, C.base * 0.7 * f0 * wk * NO, C.dmgO({ kb: 1 })); f.ripples.push({ x: m.x - f.x, y: m.y - f.y, t: 0 }); H.burst(m.x, m.y - 0.3, 'spark', 4, { v: 3, up: 2, g: 7, life: 0.4, size: 2, color: [W.white, W.aqua] }); sfx('thud'); }
            for (const r of f.ripples) r.t += dt; f.ripples = f.ripples.filter(r => r.t < 0.5);
            if (Math.random() < 0.6 * H.Q()) H.P({ kind: Math.random() < 0.5 ? 'spark' : 'ember', x: f.x - dir[0] * R, y: f.y - dir[1] * R * 0.5 - 0.1, vx: -dir[0], vy: -0.8, g: 2, life: 0.5, max: 0.5, size: 2, color: Math.random() < 0.5 ? W.aqua : W.foam }); }
          else if (f.ph === 1 && t - f.t0 > 0.3) { f.ph = 2; f.life = 0.3; const r = 1.7 * (1 + 0.15 * k); H.hitArea(f.x, f.y, r, C.base * 1.4 * f0 * wk, C.dmgO({ kb: 3 })); splashP(f.x, f.y, r, 1 + 0.4 * k); crownFx(f.x, f.y, 1.1 + 0.25 * k, 10 + 3 * k, 0.9 + 0.3 * k); if (last && NO === 3) crownFx(f.x, f.y, 2.2, 18, 1.5, 0.12); sfx('crash'); H.X.shake(3 + 2 * k, 0.14); } },
        drawUnder(c, f, X0, Y0, T) { const t = f.t - dl; if (t < 0 || f.ph === 2) return; const X = H.sx(f.x), Y = H.sy(f.y), r = T * R * 1.4, a = cl(t / 0.15); if (WK.api.pool(c, X, Y, r, 0.85 * a, { seed: k * 3 + f.roll * 0.1 })) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * a; WFLOOR(c, 'pool', X, Y, r);
          c.translate(X, Y); c.scale(1, H.GY); c.rotate(f.roll * 0.3); c.globalAlpha = 0.4 * a; WFLOOR(c, 'shee', 0, 0, r * 0.8, 1); c.restore(); },
        draw(c, f, X0, Y0, T) { const t = f.t - dl; if (t < 0) return; const fa = f.ph === 2 ? f.life / 0.3 : cl(t / 0.15), u = f.ph >= 1 ? cl((t - f.t0) / 0.3) : 0, r = T * R * (0.6 + 0.4 * cl(t / 0.2));
          if (f.ph === 2) return; const X = H.sx(f.x), wob = 0.04 * Math.sin(t * 9), rx = r * (1 - 0.3 * u + wob), ry = r * (1 + 0.75 * u - wob), cy = H.sy(f.y) - ry;
          c.save(); petHole(c, T); c.globalCompositeOperation = 'lighter'; glow(c, X, cy, r * 1.6, W.turq, 0.3 * fa); c.globalCompositeOperation = 'source-over';
          if (WK.on()) { const G = WK.api, p = G.xy(c, X, cy), Q = G.gq(); Q.glow(p[0], p[1], r * 1.9 * p[3], W.aqua, 0.3 * fa); Q.quad(24, p[0], p[1], rx * p[3], 0, 0, ry * p[3], W.blue, fa, 0.85, k * 3.1, (dir[0] >= 0 ? 1 : -1) * 2.5); Q.quad(26, p[0], p[1], rx * p[3], 0, 0, ry * p[3], W.aqua, fa, 1.0, k * 3.1, 1);   /* (v361: a rolling sphere of water on the GPU) */
            c.translate(X, cy); c.scale(rx / r, ry / r); c.globalCompositeOperation = 'lighter'; c.strokeStyle = W.foam; c.lineWidth = Math.max(1, r * 0.06); for (const rp of f.ripples) { const v = rp.t / 0.5; c.globalAlpha = 0.6 * (1 - v) * fa; c.beginPath(); c.arc(cl(rp.x) * r * 0.4, cl(rp.y) * r * 0.4, r * (0.15 + 0.7 * v), 0, TAU); c.stroke(); } c.restore(); return; }
          c.translate(X, cy); c.scale(rx / r, ry / r); c.globalAlpha = 0.95 * fa; c.drawImage(orbSpr(), -r, -r, r * 2, r * 2); c.drawImage(bubLSpr(), -r, -r, r * 2, r * 2);
          // rotating bands of reflected light, and ripples where it touched a monster
          c.globalCompositeOperation = 'lighter'; const sg = dir[0] >= 0 ? 1 : -1; for (let i = 0; i < 2; i++) { c.save(); c.rotate(f.roll * sg + i * 2.6); c.globalAlpha = 0.6 * fa; c.drawImage(hlSpr(), -r, -r, r * 2, r * 2); c.restore(); }
          c.strokeStyle = W.foam; c.lineWidth = Math.max(1, r * 0.06); for (const rp of f.ripples) { const v = rp.t / 0.5; c.globalAlpha = 0.6 * (1 - v) * fa; c.beginPath(); c.arc(cl(rp.x) * r * 0.4, cl(rp.y) * r * 0.4, r * (0.15 + 0.7 * v), 0, TAU); c.stroke(); }
          c.restore(); } });
    }
  };

  /* ================= Rainneedle Fan ================= */
  const sheetSpr = () => fxSprite('wu3sheet', 128, 96, (g, w, h) => {
    const path = () => { g.beginPath(); g.moveTo(4, 14); for (let i = 0; i <= 12; i++) g.lineTo(4 + i * 10, 10 + Math.sin(i * 1.7) * 4); g.lineTo(124, 84); for (let i = 12; i >= 0; i--) g.lineTo(4 + i * 10, 86 + Math.sin(i * 2.3) * 3); g.closePath(); };
    path(); const gr = g.createLinearGradient(0, 8, 0, 90); gr.addColorStop(0, 'rgba(150,245,255,0.6)'); gr.addColorStop(0.3, 'rgba(47,212,208,0.4)'); gr.addColorStop(0.75, 'rgba(20,80,180,0.4)'); gr.addColorStop(1, 'rgba(47,212,208,0.55)'); g.fillStyle = gr; g.fill();
    g.save(); path(); g.clip(); g.strokeStyle = 'rgba(200,255,255,0.35)'; g.lineWidth = 1.4; for (let i = 0; i < 11; i++) { const x = 10 + i * 10.8; g.beginPath(); g.moveTo(x, 12); g.quadraticCurveTo(x + 3, 50, x, 88); g.stroke(); } g.restore();
    path(); g.strokeStyle = 'rgba(95,240,255,0.9)'; g.lineWidth = 2; g.stroke(); });
  S.rainneedle = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, ev = K.evo(C), NV = K.lv(C, [1, 2, 3]), a = C.a, wts = [1, 1.2, 1.45].slice(0, NV), ws = sum(wts), f0 = FK(C), sx0 = me.x + Math.cos(a) * 1.1, sy0 = me.y + Math.sin(a) * 1.1;
    const VT = []; for (let k = 0; k < NV; k++) VT.push(0.3 + 0.3 * k);
    sfx('hum');
    H.add({ life: VT[NV - 1] + 0.75, nv: 0, nd: [],
      update(dt, f) {
        while (f.nv < NV && f.t >= VT[f.nv]) { const k = f.nv++, n = 7 + 2 * k, spr = 0.17 * (1 + 0.12 * k), dm = C.base * 0.5 * f0 * wts[k] / ws * NV; sfx('whoosh');
          for (let i = 0; i < n; i++) { const b = a + (i - (n - 1) / 2) * spr * 7 / n * 1.0, off = (i - (n - 1) / 2) / n * (1.6 + 0.4 * k); f.nd.push({ x: sx0 - Math.sin(a) * off, y: sy0 + Math.cos(a) * off, b, v: 4, t0: f.t, hit: new Set(), dm, k, done: false }); }
          if (k === 0) H.hitCone(me.x, me.y, a, 2.2, 0.6, C.base * 0.3 * f0, C.dmgO({})); H.burst(sx0, sy0 - 0.4, 'spark', 8, { v: 3, up: 2, g: 5, life: 0.5, size: 2, color: [W.white, W.aqua, W.foam] }); }
        for (const d of f.nd) { if (d.done) continue; const age = f.t - d.t0; d.v = Math.min(17, d.v + dt * 90); d.x += Math.cos(d.b) * d.v * dt; d.y += Math.sin(d.b) * d.v * dt;
          if (age > 0.55 || H.X.blocked(d.x, d.y, 0.1, 0)) { d.done = true; d.te = f.t; if (Math.random() < H.Q()) H.burst(d.x, d.y, 'spark', 3, { v: 2, up: 1.5, g: 6, life: 0.35, size: 1.6, color: [W.white, W.aqua] }); continue; }
          for (const m of H.living()) { if (d.hit.has(m) || Math.hypot(m.x - d.x, m.y - d.y) > 0.3 + m.r) continue; d.hit.add(m); H.X.hitMon(m, d.dm, C.dmgO({})); H.glowAt(m.x, m.y - 0.4, 0.5, 0.25, W.foam, 0.8); if (d.hit.size === 1) crownFx(m.x, m.y, 0.4 + 0.08 * d.k, 6, 0.45); if (d.hit.size > 1) { d.done = true; d.te = f.t; break; } } }
      },
      /* (v362) rebuilt on the GPU from scratch: the sheet is a hanging curtain of water woven from rippling bands that flow
         across it, a thicker lip along its top, caustic light through it, drops swelling along its lower edge, a light
         sweeping over it and caustic light under it on the floor; it bursts into spray at each volley and reforms. Each
         needle is a slender jet of water with a pearl of water at its point, a glint and droplets trailing it; where one
         strikes, a burst of spray and a ripple. Without the GPU the old picture */
      draw(c, f, X0, Y0, T) { if (!WK.on()) return f.draw2d(c, f, X0, Y0, T); const G = WK.api, Q = G.gq(), t = f.t;
        let sa = 0, brk = -1; for (let k = 0; k < NV; k++) { const s0 = k ? VT[k - 1] + 0.05 : 0, e = VT[k]; if (t >= s0 && t < e + 0.08) sa = Math.max(sa, Math.min(cl((t - s0) / 0.15), 1 - cl((t - e) / 0.08))); if (t >= e && t < e + 0.3) brk = (t - e) / 0.3; }
        const kk = Math.min(f.nv, NV - 1), X = H.sx(sx0), Y = H.sy(sy0) - T * 0.15, w = T * (1.7 + 0.45 * kk), hh = T * (0.85 + 0.15 * kk), FY = H.sy(sy0);
        if (sa > 0.01) { G.pool(c, X, FY, w * 0.62, 0.55 * sa, { seed: 2.2 });
          const h2 = hh * (0.6 + 0.4 * sa), top = Y - hh, NB = 5;
          for (let i = 0; i < NB; i++) { const yy = top + h2 * (0.12 + 0.8 * i / (NB - 1)), P = []; for (let j = 0; j <= 6; j++) { const u = j / 6; P.push([X - w * 0.5 + w * u, yy + Math.sin(t * 5 + i * 1.3 + u * 6) * T * 0.05, h2 * 0.11 * (0.55 + 0.45 * Math.sin(Math.PI * u))]); } G.stream(c, P, h2 * 0.1, sa * (i ? 0.7 : 1), { taper: 0, flow: i % 2 ? -2.5 : 2.5, seed: i * 2.7, col: W.blue, dens: i ? 0.45 : 0.85, lite: i ? 0.6 : 1.0 }); }
          const cp = G.xy(c, X, top + h2 * 0.5); Q.quad(26, cp[0], cp[1], w * 0.52 * cp[3], 0, 0, h2 * 0.5 * cp[3], W.aqua, 0.75 * sa, 1, 1.7, 0);
          for (let j = 0; j < 6; j++) { const u = (j + 0.5) / 6, sw = (t * 1.3 + j * 0.37) % 1; G.sphere(c, X - w * 0.5 + w * u, top + h2 + T * 0.05 + sw * T * 0.12, T * (0.035 + 0.04 * sw), sa, { col: W.blue, seed: j, halo: 2 }); }
          G.glow(c, X - w / 2 + ((t * 2.2) % 1) * w, top + h2 * 0.5, h2 * 0.6, W.foam, 0.35 * sa); G.glow(c, X, top + h2 * 0.5, w * 0.6, W.turq, 0.18 * sa);
          G.bubbles(c, X, top + h2 * 0.5, w * 0.46, h2 * 0.46, 0.65 * sa, { seed: kk * 2.1, rise: 1.2 }); G.shafts(c, X, top - h2 * 0.6, X, FY, w * 0.6, 0.22 * sa, { seed: 1.7 }); }
        if (brk >= 0) for (let i = 0; i < 4; i++) G.spray(c, X - w * 0.4 + w * 0.8 * i / 3, Y - hh * 0.5, T * 0.55, 0.7 * (1 - brk), { seed: i * 3 + kk, spread: 0.3 + 0.7 * brk });
        for (const d of f.nd) { const hx = H.sx(d.x), hy = H.sy(d.y) - T * 0.4, sc = 1 + 0.15 * d.k;
          if (d.done) { const u = (t - d.te) / 0.3; if (u >= 0 && u < 1) { G.spray(c, hx, hy, T * 0.35 * sc, 0.7 * (1 - u), { seed: d.b * 9, spread: u }); G.ripple(c, hx, H.sy(d.y), T * (0.15 + 0.5 * u), 0.6 * (1 - u), { seed: d.b, th: 0.1 }); } continue; }
          const L = Math.min(T * 1.4, d.v * T * 0.06), ex = hx - Math.cos(d.b) * L, ey = hy - Math.sin(d.b) * L;
          G.stream(c, [[ex, ey, T * 0.015 * sc], [(ex + hx) / 2, (ey + hy) / 2, T * 0.045 * sc], [hx, hy, T * 0.065 * sc]], T * 0.05 * sc, 1, { taper: 0, flow: 10, seed: d.b * 5, col: W.blue, lite: 1.0 });
          G.sphere(c, hx, hy, T * 0.075 * sc, 1, { col: W.blue, seed: d.b * 3, halo: 2.6, turn: 4 }); G.star(c, hx, hy, T * 0.25 * sc, 0.65); G.spray(c, ex, ey, T * 0.22 * sc, 0.3, { seed: d.b * 7, spread: 0.6 });
          for (let q = 1; q <= 2; q++) G.sphere(c, ex - Math.cos(d.b) * L * 0.25 * q + Math.sin(d.b) * T * 0.05 * (q - 1.5), ey - Math.sin(d.b) * L * 0.25 * q, T * 0.03 * sc / q, 0.7, { col: W.blue, seed: q + d.b, halo: 1.5 }); } },
      draw2d(c, f, X0, Y0, T) { const t = f.t; c.save(); petHole(c, T);
        // the hanging sheet: forming, a reflection sweeping across it; it breaks at each volley and reforms (bigger) for the next
        let sa = 0; for (let k = 0; k < NV; k++) { const s = k ? VT[k - 1] + 0.05 : 0, e = VT[k]; if (t >= s && t < e + 0.08) sa = Math.max(sa, Math.min(cl((t - s) / 0.15), 1 - cl((t - e) / 0.08))); }
        const kk = Math.min(f.nv, NV - 1), X = H.sx(sx0), Y = H.sy(sy0) - T * 0.15, w = T * (1.7 + 0.45 * kk), hh = T * (0.85 + 0.15 * kk);
        if (sa > 0.01 && WK.on()) { const G = WK.api, p = G.xy(c, X, Y - hh * 0.5), Q = G.gq(); Q.quad(26, p[0], p[1], w * 0.55 * p[3], 0, 0, hh * 0.55 * p[3], W.aqua, sa * 0.9, 1, 1.7, 0); for (let i = 0; i < 3; i++) G.stream(c, [[X - w * 0.5, Y - hh * (0.9 - 0.4 * i)], [X, Y - hh * (0.95 - 0.4 * i) + Math.sin(t * 6 + i) * T * 0.06], [X + w * 0.5, Y - hh * (0.9 - 0.4 * i)]], T * 0.08, sa * (i === 0 ? 0.9 : 0.5), { taper: 0, flow: 3, seed: i * 2, col: W.blue }); }   /* (v361: caustic light and flowing bands in the hanging sheet) */
        if (sa > 0.01) { c.save(); c.globalAlpha = 0.85 * sa; c.drawImage(sheetSpr(), X - w / 2, Y - hh, w, hh * (0.6 + 0.4 * sa)); c.globalCompositeOperation = 'lighter'; const gx = X - w / 2 + ((t * 2.2) % 1) * w; c.globalAlpha = 0.6 * sa; blitSized(c, glowSprite(W.foam), gx - T * 0.25, Y - hh, T * 0.5, hh); c.restore(); }
        // the needles: bright streaks with droplet heads
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (const d of f.nd) { if (d.done) continue; const hx = H.sx(d.x), hy = H.sy(d.y) - T * 0.4, L = Math.min(T * 1.4, d.v * T * 0.06), ex = hx - Math.cos(d.b) * L, ey = hy - Math.sin(d.b) * L, sc = 1 + 0.15 * d.k;
          if (WK.on()) { const G = WK.api; G.jet(c, ex - (hx - ex) * 0.3, ey - (hy - ey) * 0.3, hx, hy, T * 0.07 * sc, 1, { flow: 9, seed: d.b * 5, col: W.blue, lite: 1.2 }); G.sphere(c, hx, hy, T * 0.07 * sc, 1, { col: W.blue, seed: d.b * 3, halo: 3 }); G.star(c, hx, hy, T * 0.22 * sc, 0.7); continue; }   /* (v361: needles of water on the GPU) */
          for (const [col, lw, aa] of [[W.turq, T * 0.13 * sc, 0.35], [W.aqua, T * 0.055 * sc, 0.85], [W.white, T * 0.022 * sc, 1]]) { c.globalAlpha = aa; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(ex, ey); c.lineTo(hx, hy); c.stroke(); }
          glow(c, hx, hy, T * 0.18 * sc, W.foam, 0.9); }
        c.restore(); } });
  };

  /* ================= Whirlpool Step ================= */
  const swirlSpr = () => fxSprite('wu3swirl', 192, 192, (g, w) => { const c0 = w / 2; g.translate(c0, c0);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, c0); [[0, 'rgba(6,24,70,0.6)'], [0.35, 'rgba(10,42,102,0.5)'], [0.7, 'rgba(20,80,180,0.35)'], [0.9, 'rgba(47,212,208,0.25)'], [1, 'rgba(47,212,208,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w);
    g.lineCap = 'round'; for (let arm = 0; arm < 4; arm++) for (const [col, lw] of [['rgba(47,212,208,0.4)', 10], ['rgba(95,240,255,0.7)', 4], ['rgba(232,255,255,0.85)', 1.5]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (let i = 0; i <= 36; i++) { const u = i / 36, r = c0 * 0.92 * (1 - u) + 4, b = arm * TAU / 4 + u * 4.6; if (i) g.lineTo(Math.cos(b) * r, Math.sin(b) * r); else g.moveTo(Math.cos(b) * r, Math.sin(b) * r); } g.stroke(); } });
  S.whirlpool = (C, h) => {
    H = h; K = IK.bind(H);
    const x = C.tx, y = C.ty, ev = K.evo(C), NC = K.lv(C, [1, 2, 3]), R = 2.2 * (1 + 0.08 * (NC - 1)), DUR = 1.35, wts = [1, 1.3, 1.7].slice(0, NC), ws = sum(wts), f0 = FK(C);
    const CT = []; for (let k = 0; k < NC; k++) CT.push(DUR + 0.42 * k);
    const LIFE = CT[NC - 1] + 0.75;
    sfx('hum');
    H.add({ life: LIFE, tk: 0.1, nc: 0, x, y,
      update(dt, f) {
        if (f.t < DUR) { for (const m of H.near(x, y, R)) { H.pull(m, x, y, 1.1 * dt); H.slow(m, 0.3); } f.tk -= dt; if (f.tk <= 0) { f.tk = 0.3; H.hitRing(x, y, 0, R, C.base * 0.35 * f0, C.dmgO({ dot: true, dotC: W.aqua })); } }
        while (f.nc < NC && f.t >= CT[f.nc]) { const k = f.nc++, r = R + 0.3 + 0.35 * k; H.hitArea(x, y, r, C.base * 1.3 * f0 * wts[k] / ws, C.dmgO({ kb: 4 })); splashP(x, y, r * 0.6, 1.2 + 0.5 * k); crownFx(x, y, r * 0.55, 12 + 4 * k, 1.0 + 0.45 * k); sfx('crash'); H.X.shake(4 + 2 * k, 0.16); }
        if (f.t < DUR && Math.random() < 5 * dt * H.Q()) { const b = Math.random() * TAU, rr = R * (0.5 + 0.5 * Math.random()); H.P({ kind: 'spark', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * 0.6, vx: -Math.sin(b) * 3 - Math.cos(b) * 1.5, vy: Math.cos(b) * 2 - Math.sin(b) - 0.6, g: 1, drag: 0.6, life: 0.5, max: 0.5, size: 1.8, color: Math.random() < 0.5 ? W.white : W.aqua }); }
      },
      drawUnder(c, f, X0, Y0, T) { const t = f.t, X = H.sx(x), Y = H.sy(y), fa = cl(Math.min(t / 0.25, (LIFE - t) / 0.5)), gr = H.ease.out(cl(t / 0.3)), rr = T * R * gr * (t > CT[NC - 1] ? 1 + 0.2 * cl((t - CT[NC - 1]) / 0.5) : 1);
        if (WK.on()) { const G = WK.api; G.whirl(c, X, Y, rr * 1.05, 0.95 * fa, { spin: 3.2, seed: 1.3, col: W.blue, heat: 0.7 }); if (NC >= 2) G.whirl(c, X, Y, rr * 0.6, 0.5 * fa, { spin: -2.2, seed: 4.1, col: W.aqua, heat: 0.6 }); G.ripple(c, X, Y, rr * 0.98, 0.6 * fa, { seed: t, th: 0.06 }); G.glow(c, X, Y, rr * 1.2, W.blue, 0.25 * fa, H.GY); }   /* (v361: the whirlpool turning on the GPU) */
        c.save(); c.translate(X, Y); c.scale(1, H.GY);
        if (!WK.on()) { c.save(); c.rotate(-t * 3.2); c.globalAlpha = 0.9 * fa; c.drawImage(swirlSpr(), -rr, -rr, rr * 2, rr * 2); c.restore(); }
        c.globalCompositeOperation = 'lighter'; if (NC >= 2) { c.save(); c.rotate(t * 2.2); c.globalAlpha = 0.45 * fa; c.drawImage(swirlSpr(), -rr * 0.6, -rr * 0.6, rr * 1.2, rr * 1.2); c.restore(); }
        c.save(); c.rotate(t * 0.6); c.globalAlpha = 0.4 * fa; WFLOOR(c, 'shee', 0, 0, rr, 1); c.restore();
        // a foaming rim turning round it
        c.lineCap = 'round'; for (let q = 0; q < 6; q++) { const a0 = -t * 2.4 + q * TAU / 6; c.globalAlpha = 0.7 * fa; c.strokeStyle = W.foam; c.lineWidth = T * 0.06; c.beginPath(); c.arc(0, 0, rr * 0.97, a0, a0 + 0.55); c.stroke(); c.globalAlpha = 0.4 * fa; c.strokeStyle = W.aqua; c.lineWidth = T * 0.16; c.stroke(); }
        c.restore(); },
      draw(c, f, X0, Y0, T) { const t = f.t, X = H.sx(x), Y = H.sy(y), fa = cl(Math.min(t / 0.25, (LIFE - t) / 0.5));
        c.save(); petHole(c, T);
        // bubbles spiralling up out of the pool
        for (let i = 0; i < H.n(10); i++) { const P0 = 1 + 0.6 * R1(i), u = ((t + R1(i * 3) * P0) % P0) / P0, b = R1(i * 7) * TAU - t * 3, rr = T * R * 0.6 * (1 - u); drawBub(c, X + Math.cos(b) * rr, Y + Math.sin(b) * rr * H.GY - u * T * 0.9, T * (0.06 + 0.06 * R1(i * 5)), fa * Math.sin(Math.PI * u) * (t < CT[NC - 1] ? 1 : 0.4)); }
        // the column: rising before each collapse (each higher and wider), twisted ribbons round it
        for (let k = 0; k < NC; k++) { const s = CT[k] - 0.4, u = (t - s) / 0.4; if (u < 0 || u > 1.15) continue; const up = u <= 1 ? H.ease.in(u) : 1 - (u - 1) / 0.15, hc = T * (1.5 + 0.6 * k) * up, wc = T * (0.75 + 0.2 * k);
          if (hc < 2) continue; c.save(); c.globalCompositeOperation = 'lighter'; glow(c, X, Y - hc * 0.5, wc * 1.6, W.turq, 0.4 * up); c.restore();
          strip(c, spoutSpr(), 16, 124, 118, X, Y + T * 0.1, X, Y - hc, wc, 0.95 * Math.min(1, up * 1.5));
          for (let q = 0; q < 2 + k; q++) { const pts = []; for (let j = 0; j <= 14; j++) { const v = j / 14, b = v * 7 + t * 9 + q * TAU / (2 + k); pts.push([X + Math.cos(b) * wc * 0.55 * (1 - 0.3 * v), Y - hc * v + Math.sin(b) * wc * 0.15]); } rib(c, pts, T * 0.12, 0.8 * up, true); } }
        c.restore(); } });
  };
})();
