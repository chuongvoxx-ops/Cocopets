/* ---------- v408 CA: the Blackfire Caldera's geodes and fire traps, repainted (the ice props' treatment, 20zz5b) ----------
   (1) The Glass Heart's geode (prop 'geode'): painted once, per pixel, by the Belfry painter's kit (BELPROPS.kit, 20n9) in a
   warm light of its own (a hot key, the lava's bounce from below, an ember rim): a split boulder of rough vesicular basalt
   (chips with bright arrises, soot), its cut face polished into agate bands, a ring of amethyst teeth pointing inward
   (translucent: a glassy coat, facets, light held inside them, warm where the heart lights them, bright ridges, glints), and
   a sunken molten heart (white-hot to red, a crust of floating slag); a soft contact shadow and its light on the floor.
   The eruption of red energy (CAL.geodeOver, 20zz5b) still rises from its heart. Footprint, collision and breaking are
   unchanged (BREAK_FX cuts its shards from this picture).
   (2) The fire vents (CAL.vent: the trials' and dungeons' vent fields; the Heartward Descent's lane vents, 20zz4): the mouth
   is painted once (a squat crater of crusted basalt with soot scorched round it, cracks running through its crust, a dark
   throat with embers deep in it), with a second picture of its own light (the cracks and the throat, white-hot) laid over it
   additively as the vent heats. Their live fire is the GPU painter's (NIDHOGG_MOVES.FGFX): at rest a faint breathing glow
   and a thread of smoke; the tell (glow only: no ring, no countdown) the mouth heating from orange to red and pulsing faster,
   flames licking inside it, smoke and sparks; the eruption a column of layered flame tongues and rolling fire, white-hot at
   its root, its light flashing on the floor, embers flung up and falling back, heat shimmering above, black smoke after;
   then it cools (smoke, a dimming throat). Without the GPU painter the old 2D tell and column stay as they were.
   (3) Lava you can touch (CAL.lavaPool / CAL.lavaTiles: the Hollows' runnels): its molten surface keeps its flowing pattern;
   on the GPU it gains churning hot currents, a feathered glow over its edges, slow bubbles and rising embers.
   Timing, damage and hit areas are untouched (this file only draws). window.__CALFIRE = 0 (or __BELP = 0) restores the old art.
   API (on CAL): CAL.trapArt = { vent(c, X, v), ventAt(c, Xs, Ys, T, r, seed, heat), fx(Q, Xs, Ys, T, s), live(C), over(Q, X, C, T, t),
   ground(c, X, C), on() }; CAL_FIRE.stats */
var CAL_FIRE = (() => {
  const TAU = Math.PI * 2;
  const BP = () => (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.kit && window.BELPROPS.DEF && window.__BELP !== 0 && window.__CALFIRE !== 0) ? window.BELPROPS : null;
  const fgx = () => { try { if (typeof window !== 'undefined' && (window.__CALFIRE === 0 || window.__CAL_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const STATS = { geode: 0, vents: 0, fx: 0, lava: 0, fallbacks: 0 };
  const hh = (a, b) => { let n = (a * 374761393 + b * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const mix = (a, b, u) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), f = (s) => Math.round(lerp(A >> s & 255, B >> s & 255, u)); return '#' + ((1 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)).toString(16).slice(1); };

  /* ======================= materials ======================= */
  // vesicular basalt: dark, grained, pitted with gas holes, a little glassy; soot darkens it, chips are paler
  function rockM(K, u, v, ao, sd, soot) { const { M, vn, fbm, ss } = K, w = fbm(u * 3.2 + sd, v * 3.2 + sd * 0.7), p = vn(u * 21 + sd, v * 21), t = 0.11 + 0.08 * (w - 0.5);
    M.r = t * 1.08; M.g = t * 0.97; M.b = t * 0.95; M.rg = 0.7; M.cc = 0.1; if (p > 0.74) { const q = ss(0.74, 0.86, p); M.r *= 1 - 0.32 * q; M.g *= 1 - 0.32 * q; M.b *= 1 - 0.3 * q; M.ao *= 1 - 0.2 * q; }
    const s2 = (soot || 0) * ss(0.35, 0.75, vn(u * 4.1 + 7, v * 4.1 + sd)); if (s2 > 0) { M.r *= 1 - 0.6 * s2; M.g *= 1 - 0.62 * s2; M.b *= 1 - 0.6 * s2; M.rg = Math.min(0.95, M.rg + 0.2 * s2); } }

  /* ======================= the geode ======================= (feet at 0, 0; its face centred at GX, GY, radii GRX, GRY) */
  const GX = 0.04, GY = -0.78, GRX = 1.12, GRY = 0.9, GD = 0.2;   // (GD: the boulder's thickness showing under its face)
  const GLIGHT = { a0: [0.1, 0.07, 0.07], a1: [0.1, 0.08, 0.1], e0: [0.24, 0.08, 0.03], e1: [0.34, 0.28, 0.36], k: [1.22, 1.06, 0.98], rim: [0.42, 0.18, 0.1], bo: [0.32, 0.1, 0.03] };
  function paintGeode(S, v) { const B = BP(), K = B.kit, { M, M0, shade, put, vn, fbm, ss, R1 } = K, c = S.c, P = S.P, sd = 3.7 + (v | 0) * 5.1, R = R1(907 + (v | 0) * 31), N = 15 + (v | 0) % 2 * 3;
    const AP = [], AP2 = [], WI = [], WI2 = []; for (let i = 0; i < N; i++) { AP.push(0.34 + hh(i, 11 + (v | 0)) * 0.12); AP2.push(0.27 + hh(i, 19 + (v | 0)) * 0.07); WI.push(0.8 + 0.25 * hh(i, 23)); WI2.push(0.7 + 0.3 * hh(i, 29)); }   // (each tooth's apex, as a fraction of the face, and its width: two rows, the inner one over the outer)
    const rho = a => 1 + 0.055 * (vn(Math.cos(a) * 2.1 + sd, Math.sin(a) * 2.1) - 0.5) * 2 + 0.025 * Math.sin(a * 7 + sd);
    // its shadow on the floor, and the heart's light on the floor round it
    K.contact(S, GX + 0.05, 0.02, 1.25, 0.36, 0.62);
    { c.save(); c.scale(1, 0.34); const g = c.createRadialGradient(GX, 0.3 / 0.34, 0.1, GX, 0.3 / 0.34, 1.5); g.addColorStop(0, 'rgba(255,110,40,.22)'); g.addColorStop(1, 'rgba(255,90,30,0)'); c.fillStyle = g; c.beginPath(); c.arc(GX, 0.3 / 0.34, 1.5, 0, TAU); c.fill(); c.restore(); }
    S.lock();
    const n0 = [0, 0.9, 0.44], toS = (sx, sy) => [sx, 0, -sy];   // (the face looks at us, tilted back a little; a screen direction as a 3D one on it)
    const x0 = Math.max(0, Math.floor(S.ax + (GX - GRX * 1.1) * P)), x1 = Math.min(S.w - 1, Math.ceil(S.ax + (GX + GRX * 1.1) * P)), y0 = Math.max(0, Math.floor(S.ay + (GY - GRY * 1.12) * P)), y1 = Math.min(S.h - 1, Math.ceil(S.ay + (GY + GRY * 1.1 + GD) * P));
    for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, ex = (x - GX) / GRX, ey = (y - GY) / GRY, a = Math.atan2(ey, ex), rh = rho(a), r = Math.hypot(ex, ey) / rh;
      M0(); M.ao = 1; let nx, ny, nz, al = 1;
      if (r > 1) {   // the boulder's flank under its face (the thickness we see below it)
        if (ey <= 0 || Math.abs(ex) >= rh) continue; const yb = GY + GRY * rh * Math.sqrt(Math.max(0, 1 - (ex / rh) * (ex / rh))), dz = y - yb; if (dz < 0 || dz > GD + 0.02) continue;
        const f = dz / GD; nx = ex * 0.7; ny = 0.85; nz = 0.1 - 0.35 * f; rockM(K, x * 1.6, y * 3, 1, sd + 2, 0.7 + 0.3 * f); M.ao = 0.7 - 0.4 * f; const bmp = vn(x * 9 + sd, y * 9) - 0.5; nx += bmp * 0.5;
        al = clamp((GD + 0.02 - dz) * P + 0.5, 0, 1) * clamp((rh - Math.abs(ex)) * GRX * P + 0.5, 0, 1); }
      else { al = clamp((1 - r) * GRX * rh * P + 0.6, 0, 1);
        if (r > 0.8) {   // the rough rind: rock, rounding over at its edge, chipped, sooted toward the rim
          const bev = ss(0.86, 1.0, r), ux = ex / (r * rh || 1), uy = ey / (r * rh || 1), bx = vn(x * 7 + sd, y * 7) - 0.5, by = vn(x * 7 + 3, y * 7 + sd) - 0.5;
          const sx = ux * bev * 0.9 + bx * 0.45, sy = uy * bev * 0.9 + by * 0.45, d = toS(sx, sy); nx = n0[0] * (1 - bev * 0.4) + d[0]; ny = n0[1] * (1 - bev * 0.5); nz = n0[2] * (1 - bev * 0.4) + d[2];
          rockM(K, x * 1.4, y * 1.4, 1, sd, 0.5 + 0.5 * ss(0.85, 1, r)); const chip = vn(x * 5.3 + sd * 2, y * 5.3); if (chip > 0.7 && r < 0.95) { M.r *= 1.6; M.g *= 1.55; M.b *= 1.6; }   // (chipped faces, paler)
          M.ao = 0.75 + 0.25 * (1 - bev); }
        else if (r > 0.62) {   // agate bands, polished: violet, smoke grey, milky white, in uneven rings
          const w = vn(Math.cos(a) * 3 + sd, Math.sin(a) * 3), bnd = Math.sin((r + 0.04 * (w - 0.5)) * 64), b2 = Math.sin((r + 0.03 * w) * 23 + sd);
          nx = n0[0]; ny = n0[1]; nz = n0[2]; const sl = ss(0.62, 0.68, r) * (1 - ss(0.76, 0.8, r)); nz += 0.05 * bnd;
          const wh = ss(0.55, 0.95, bnd) * (0.4 + 0.6 * ss(-0.2, 0.6, b2)), dk = ss(0.2, -0.6, bnd);
          M.r = lerp(0.2, 0.62, wh) * (1 - 0.5 * dk); M.g = lerp(0.12, 0.58, wh) * (1 - 0.5 * dk); M.b = lerp(0.28, 0.68, wh) * (1 - 0.45 * dk); M.rg = 0.18; M.cc = 0.85; M.sh = 0.8;
          M.er = 0.06 * sl; M.eg = 0.02 * sl; M.eb = 0.09 * sl; M.ao = 0.85 + 0.15 * sl;
          if (r > 0.785) { M.ao *= 0.6; } }
        else if (r > 0.26) {   // the amethyst teeth, each a pyramid lying on the face pointing in; drusy sparkle between them
          const sec = TAU / N, aa = ((a % TAU) + TAU) % TAU; let i, loc, ap, f, row = 0, ang;
          { const a2 = (aa + sec * 0.5) % TAU, j = Math.floor(a2 / sec), l2 = (a2 - (j + 0.5) * sec) / (sec / 2) / WI2[j], f2 = (r - AP2[j]) / (0.5 - AP2[j]); if (r < 0.5 && f2 > 0 && Math.abs(l2) < f2) { i = j; loc = l2; ap = AP2[j]; f = f2; row = 1; ang = j * sec; } }
          if (!row) { i = Math.floor(aa / sec); loc = (aa - (i + 0.5) * sec) / (sec / 2) / WI[i]; ap = AP[i]; f = (r - ap) / (0.64 - ap); ang = (i + 0.5) * sec; }
          const ux = Math.cos(ang), uy = Math.sin(ang), tx = -uy, ty = ux, tint = 0.75 + 0.5 * hh(i + row * 50, 3);   // (the tooth's axis outward, and across it)
          if (f > 0 && Math.abs(loc) < f * 1.02) {
            const sgn = loc < 0 ? -1 : 1, ridge = 1 - Math.abs(loc) / Math.max(0.02, f), d = toS(tx * sgn * 0.75 - ux * 0.28, ty * sgn * 0.75 - uy * 0.28); nx = n0[0] * 0.75 + d[0]; ny = n0[1] * 0.75; nz = n0[2] * 0.75 + d[2];
            M.r = 0.12; M.g = 0.04; M.b = 0.2; M.rg = 0.05; M.cc = 1; M.sh = 0.55;
            const heat = ss(0.5, 0.0, f) * 1.0 + 0.15, depth = 0.35 + 0.65 * ridge, w2 = vn(r * 9 + i, loc * 3 + sd);
            M.er = (0.2 * depth + 0.1 * w2) * tint + 0.95 * heat * heat; M.eg = (0.05 * depth) * tint + 0.32 * heat * heat + 0.04 * row; M.eb = (0.36 * depth + 0.08 * w2) * tint + 0.12 * heat;   // (violet held inside it; the heart's fire at its tip)
            const rd = ss(0.1, 0.0, Math.abs(loc) / Math.max(0.02, f)) * 0.7 + ss(0.92, 1.0, Math.abs(loc) / Math.max(0.02, f)) * 0.35; M.er += 0.55 * rd; M.eg += 0.42 * rd; M.eb += 0.65 * rd;   // (its ridge, and the edges of its faces)
          }
          else { nx = n0[0]; ny = n0[1]; nz = n0[2]; const sp = ss(0.9, 0.97, vn(x * 55 + sd, y * 55)); M.r = 0.06; M.g = 0.025; M.b = 0.09; M.rg = 0.1; M.cc = 0.9; M.ao = 0.4; M.er = 0.06 + 0.35 * sp; M.eg = 0.015 + 0.2 * sp; M.eb = 0.11 + 0.35 * sp; } }
        else {   // the molten heart, sunk in the cavity: white-hot in the middle, red at its edge, slag floating on it
          const q = r / 0.26, w = fbm(x * 7 + sd, y * 7), crust = ss(0.66, 0.78, vn(x * 13 + 3, y * 13 + sd)) * ss(0.45, 0.85, q);
          nx = n0[0]; ny = n0[1]; nz = n0[2] + 0.2; M.r = 0.02; M.g = 0.01; M.b = 0.01; M.rg = 0.4; M.sh = 0.3;
          const hot = Math.pow(1 - q, 1.6) * (0.85 + 0.3 * w); M.er = lerp(lerp(0.75, 2.2, hot), 0.12, crust); M.eg = lerp(lerp(0.1, 1.2, hot), 0.03, crust); M.eb = lerp(lerp(0.02, 0.45, hot), 0.01, crust);
          if (crust > 0.2) { M.r = 0.08; M.g = 0.05; M.b = 0.05; M.rg = 0.8; }
          if (q > 0.86) { const rim = ss(0.86, 1, q); M.er *= 1 - 0.5 * rim; M.eg *= 1 - 0.6 * rim; M.eb *= 1 - 0.6 * rim; } } }
      const l = Math.hypot(nx, ny, nz) || 1; shade(nx / l, ny / l, nz / l); put(S, px, py, al); }
    S.unlock();
    // finishing: soot specks on the rind, a heat haze over the heart, glints on the teeth
    c.save(); for (let i = 0; i < 70; i++) { const a = R() * TAU, rr = 0.82 + R() * 0.17, px = GX + Math.cos(a) * GRX * rr, py = GY + Math.sin(a) * GRY * rr, s2 = 0.008 + R() * 0.014; c.fillStyle = R() < 0.7 ? `rgba(10,6,6,${0.3 + R() * 0.4})` : `rgba(255,170,110,${0.15 + R() * 0.2})`; c.fillRect(px - s2 / 2, py - s2 / 2, s2, s2); }
    c.globalCompositeOperation = 'lighter'; const hg = c.createRadialGradient(GX, GY, 0, GX, GY, GRX * 0.55); hg.addColorStop(0, 'rgba(255,150,70,.32)'); hg.addColorStop(0.5, 'rgba(255,80,40,.1)'); hg.addColorStop(1, 'rgba(255,60,30,0)'); c.fillStyle = hg; c.save(); c.translate(GX, GY); c.scale(1, GRY / GRX); c.translate(-GX, -GY); c.beginPath(); c.arc(GX, GY, GRX * 0.55, 0, TAU); c.fill(); c.restore(); c.restore();
    for (let i = 0; i < 4; i++) { const k = Math.floor(R() * N), a = (k + 0.5) * TAU / N, rr = 0.42 + R() * 0.12; K.glint(c, GX + Math.cos(a) * GRX * rr, GY + Math.sin(a) * GRY * rr, 0.05 + R() * 0.04, 0.55 + R() * 0.35); }
    K.ink(S, [16, 10, 14], 0.55); }

  /* ======================= the vent's mouth ======================= (feet at its centre on the floor; r = 1 tile) */
  /* a crater seen in the game's view: a mound of crust round a sunken throat, its height z(rho) above the floor (rho the
     distance from its centre in tiles, irregular round it); each pixel's ray is marched from the front to find the surface */
  const VH = 0.1, VD = 0.16;   // (the rim's height; the throat's depth below the floor)
  function paintVent(S, key) { const B = BP(), K = B.kit, { M, M0, shade, put, ss, vn } = K, c = S.c, P = S.P, KK = K.K, glow = String(key).endsWith('g'), v = parseInt(key, 10) || 0, sd = 9.1 + v * 4.3, R = K.R1(4411 + v * 13);
    if (!glow) { K.contact(S, 0.03, 0.02, 1.08, 0.4, 0.5); c.save(); c.scale(1, KK);   // soot scorched round it, in blotches
      for (let i = 0; i < 10; i++) { const a = R() * TAU, d = 0.65 + R() * 0.55, x = Math.cos(a) * d, y = Math.sin(a) * d, rr = 0.2 + R() * 0.32, g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, `rgba(8,5,5,${0.22 + R() * 0.25})`); g.addColorStop(1, 'rgba(8,5,5,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); } c.restore(); }
    const wob = a => 1 + 0.07 * (vn(Math.cos(a) * 1.8 + sd, Math.sin(a) * 1.8) - 0.5) * 2, hv = a => 0.75 + 0.5 * vn(Math.cos(a) * 2.6 + 3, Math.sin(a) * 2.6 + sd);
    const zf = (x, y) => { const a = Math.atan2(y, x), q = Math.hypot(x, y) / wob(a), H = VH * hv(a); if (q >= 1) return 0; if (q >= 0.66) { const u = (q - 0.66) / 0.34; return H * Math.cos(u * Math.PI / 2) ** 2; } if (q >= 0.48) return lerp(-VD, H, ss(0.48, 0.66, q) ** 1.5); return -VD; };
    const crack = (a, q) => ss(0.03, 0.0, Math.abs(vn(a * 2.2 + sd, q * 7 + sd * 0.3) - 0.5)) * ss(0.45, 0.62, vn(a * 1.1 + 5, q * 2.5 + sd));
    S.lock(); const xa = Math.max(0, Math.floor(S.ax - 1.12 * P)), xb = Math.min(S.w - 1, Math.ceil(S.ax + 1.12 * P)), ya = Math.max(0, Math.floor(S.ay - (VH * 1.3 + KK * 1.15) * P)), yb = Math.min(S.h - 1, Math.ceil(S.ay + (KK * 1.15 + VD) * P)), st = 0.6 / (P * KK);
    const NS = Math.ceil(2.3 / st) + 1, COL = { px: 0, i: 0, Sv: new Float32Array(NS) };
    for (let px0 = xa; px0 <= xb; px0++) { const x0 = (px0 + 0.5 - S.ax) / P; if (Math.abs(x0) > 1.12) continue; COL.px = px0; COL.i = 0; for (let i = 0; i < NS; i++) { const y2 = 1.15 - i * st; COL.Sv[i] = zf(x0, y2) - KK * y2; }   // (the surface's screen height along this column, front to back)
      for (let py = yb; py >= ya; py--) { const Yt = (S.ay - py - 0.5) / P;   // (screen height above the feet: Yt = z - K * yd; rows from the bottom up, so the first hit only moves back)
      const px = COL.px, x = (px + 0.5 - S.ax) / P, Sv = COL.Sv, N = Sv.length; while (COL.i < N && Sv[COL.i] < Yt) COL.i++; if (COL.i >= N) continue;
        let yd = 1.15 - COL.i * st, z; if (COL.i > 0) { const s0 = Sv[COL.i - 1], s1 = Sv[COL.i], f = s1 > s0 ? (Yt - s0) / (s1 - s0) : 0; yd += (1 - f) * st; } z = zf(x, yd);
        const a = Math.atan2(yd, x), q = Math.hypot(x, yd) / wob(a); if (q >= 1 || (z <= 0.0005 && q > 0.66)) continue;
        const e = 0.006, gx = (zf(x + e, yd) - zf(x - e, yd)) / (2 * e), gy = (zf(x, yd + e) - zf(x, yd - e)) / (2 * e); let nx = -gx, ny = -gy, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
        M0(); M.ao = 1; let em = 0;
        if (q < 0.48) { const w = vn(x * 7 + sd, yd * 7); M.r = 0.04; M.g = 0.025; M.b = 0.02; M.rg = 0.5; M.ao = 0.45; em = (0.55 + 0.45 * w) * Math.pow(1 - q / 0.48, 0.8); if (!glow) { M.er = 0.28 * em; M.eg = 0.06 * em; M.eb = 0.01 * em; } }   // (the throat: dark, embers deep in it)
        else { rockM(K, a * 0.9 + q * 0.4, q * 3 + z * 6, 1, sd, 0.65 + 0.35 * ss(0.75, 1, q)); M.r *= 0.85; M.g *= 0.82; M.b *= 0.82; if (q < 0.66) M.ao *= 0.45 + 0.55 * ss(0.48, 0.66, q);   // (the crust; its inner wall in shadow)
          const ash = ss(0.55, 0.8, vn(a * 3 + 1, q * 5 + sd)) * ss(0.5, 0.62, q) * ss(0.8, 0.66, q); M.r += 0.1 * ash; M.g += 0.09 * ash; M.b += 0.085 * ash;   // (pale ash on the lip)
          em = crack(a, q) * (q < 0.66 ? 1 : 0.7) + ss(0.58, 0.48, q) * 0.4; if (!glow) { M.er += 0.28 * em; M.eg += 0.05 * em; M.eb += 0.01 * em; } }
        if (glow) { M.r = M.g = M.b = 0; M.fr = M.fg = M.fb = 0; M.cc = 0; M.rg = 1; M.sh = 0; M.ao = 0; M.er = 1.5 * em; M.eg = 0.6 * em; M.eb = 0.14 * em; }
        shade(nx, ny, nz); put(S, px, py, q > 0.66 ? clamp(z * P * 2.5, 0, 1) : 1); } }
    S.unlock();
    if (!glow) { for (let i = 0; i < 16; i++) { const a = R() * TAU, d = 0.7 + R() * 0.55, s2 = 0.01 + R() * 0.02; c.fillStyle = R() < 0.6 ? `rgba(20,14,12,${0.5 + R() * 0.4})` : `rgba(120,100,92,${0.35 + R() * 0.3})`; c.fillRect(Math.cos(a) * d - s2 / 2, Math.sin(a) * d * KK - s2 / 2, s2, s2); }   // (cinders and grit round it)
      K.ink(S, [14, 8, 8], 0.3); } }

  /* ======================= registration ======================= */
  const DEFS = { calgeode: { light: 'ember', box: () => [-1.3, -1.85, 1.4, 0.55], paint: paintGeode }, calvent: { light: 'ember', box: () => [-1.2, -0.62, 1.2, 0.68], paint: paintVent } };
  let reg = false; const reg1 = () => { if (reg) return true; const B = BP(); if (!B) return false; Object.assign(B.DEF, DEFS); if (B.kit.LIGHTS && !B.kit.LIGHTS.ember) B.kit.LIGHTS.ember = GLIGHT; reg = true; return true; };
  const OLD = {};
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS, old = PR.geode; if (!old || old.__calfire) return; OLD.geode = old;
    const f = function (c, T, v) { if (!reg1()) return old.apply(this, arguments); let sp = null; try { sp = BP().sprite('calgeode', (v | 0) % 2, Math.max(8, Math.round(T))); } catch (e) { sp = null; } if (!sp) { STATS.fallbacks++; return old.apply(this, arguments); } STATS.geode++;
      const k = T / sp.P; c.drawImage(sp.cv, -sp.ax * k, -sp.ay * k, sp.cv.width * k, sp.cv.height * k); }; f.__calfire = 1; PR.geode = f; }
  install();

  /* ======================= the vents: their pictures and live fire ======================= */
  const on = () => !!(reg1() && fgx());
  // the mouth's picture at a screen spot, its own light laid over by `heat` (0..1); -> 0 not drawn, 1 drawn (2D live parts
  // wanted: no GPU painter), 2 drawn and the GPU painter will draw its live fire
  function ventAt(c, Xs, Ys, T, r, seed, heat) { if (!reg1()) return 0; const B = BP(), vv = ((seed | 0) % 3 + 3) % 3, s = T * (r || 1);
    if (!B.draw(c, 'calvent', String(vv), Xs, Ys, s)) { STATS.fallbacks++; return 0; } STATS.vents++;
    if (heat > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; B.draw(c, 'calvent', vv + 'g', Xs, Ys, s, { alpha: Math.min(1, heat) }); c.restore(); }
    return fgx() ? 2 : 1; }
  // a CAL.vent's phase as the picture and the fire read it: { ph, k }
  function calPhase(v) { if (v.st === 'warn') return { ph: 'warn', k: clamp(v.t / v.warn, 0, 1) }; if (v.st === 'erupt') return { ph: 'erupt', k: clamp(v.t / v.erupt, 0, 1) }; if (v.n > 0 && v.t < 1.1) return { ph: 'cool', k: v.t / 1.1 }; return { ph: 'idle', k: 0 }; }
  const heatOf = s => s.ph === 'warn' ? 0.25 + 0.75 * s.k : s.ph === 'erupt' ? 1 : s.ph === 'cool' ? 1 - s.k * 0.85 : 0.12;
  function vent(c, X, v) { const T = X.Tz(), Xs = X.sx(v.x), Ys = X.sy(v.y); if (Xs < -T * 2 || Ys < -T * 2 || Xs > X.W() + T * 2 || Ys > X.H() + T * 2) return reg1() ? (fgx() ? 2 : 1) : 0;   // (off screen: nothing to draw)
    const s = calPhase(v); return ventAt(c, X.sx(v.x), X.sy(v.y), X.Tz(), (v.r || 1.1) / 1.1 * 1.05, (v.x * 7 + v.y * 13) | 0, heatOf(s)); }
  /* the live fire of one vent (GPU, screen px): s = { ph: idle|warn|erupt|cool, k: 0..1 through it, r (tiles), seed, t } */
  function fx(Q, Xs, Ys, T, s) { STATS.fx++; const Rw = T * (s.r || 1), t = s.t, sd = s.seed || 0, k = s.k || 0, lo = lowFx();
    if (s.ph === 'idle') { Q.glow(Xs, Ys - Rw * 0.04, Rw * 0.5, '#FF5A1E', 0.16 + 0.05 * Math.sin(t * 2.3 + sd)); if (!lo) { const u = (t * 0.18 + sd * 0.37) % 1; Q.smoke(Xs + Math.sin(t * 0.7 + sd) * Rw * 0.1, Ys - Rw * (0.1 + u * 1.2), Rw * (0.18 + u * 0.3), 0.14 * Math.sin(u * Math.PI), sd, '#3A3032', 0.3); } return; }
    if (s.ph === 'warn') { const col = k < 0.55 ? mix('#FF9A2A', '#FF5A1E', k / 0.55) : mix('#FF5A1E', '#FF1E14', (k - 0.55) / 0.45), pul = 0.75 + 0.25 * Math.sin(t * (6 + 18 * k));
      Q.glow(Xs, Ys, Rw * (1.0 + 0.8 * k), col, (0.4 + 0.55 * k) * pul, 0.5); Q.glow(Xs, Ys - Rw * 0.1, Rw * (0.55 + 0.35 * k), col, (0.35 + 0.45 * k) * pul); Q.glow(Xs, Ys - Rw * 0.06, Rw * (0.3 + 0.2 * k), '#FFD08A', (0.45 + 0.5 * k) * pul);   // (the mouth heating: orange, then red, faster)
      Q.ground(Xs, Ys - Rw * 0.04, Rw * (0.32 + 0.22 * k), 0.5 + 0.5 * k, (0.45 + 0.5 * k) * pul, sd, 0.45, 1);   // (the throat's floor molten, inside the mouth only)
      Q.fire(Xs, Ys - Rw * 0.12, Rw * (0.24 + 0.3 * k), 0.6 + 0.45 * k, (0.35 + 0.6 * k) * pul, sd, 0.7);   // (flames licking up inside it)
      for (let i = 0; i < 3; i++) Q.tongue(Xs + (i - 1) * Rw * 0.2, Ys + T * 0.02, Rw * 0.18, T * (0.2 + 0.45 * k) * (0.7 + 0.3 * Math.sin(t * (9 + i * 2) + i)), (i - 1) * 0.2, 0.75 + 0.3 * k, (0.35 + 0.5 * k) * pul, sd + i);
      if (!lo) { for (let i = 0; i < 3; i++) { const u = (t * (0.9 + 0.5 * k) + i / 3 + sd * 0.1) % 1; Q.smoke(Xs + Math.sin(i * 2.4 + t * 2) * Rw * 0.25, Ys - Rw * (0.15 + u * 1.5), Rw * (0.16 + u * 0.32), 0.3 * (1 - u) * (0.4 + 0.6 * k), sd + i, '#5A4A48', 0.6); }
        for (let i = 0; i < 4; i++) { const u = (t * 1.3 + i / 4 + sd * 0.2) % 1; Q.star(Xs + Math.sin(i * 3.1 + sd) * Rw * 0.3, Ys - Rw * (0.1 + u * 1.3), T * 0.05, 0.8 * Math.sin(u * Math.PI) * k, '#FFC070'); } }
      return; }
    if (s.ph === 'erupt') { const rise = Math.min(1, k / 0.14), fall = k > 0.7 ? 1 - (k - 0.7) / 0.3 * 0.65 : 1, H = T * (2.5 + 1.3 * (s.r || 1)) * (0.45 + 0.55 * rise) * fall, a = 0.65 + 0.35 * rise, fl = k < 0.25 ? 1 - k / 0.25 : 0;
      Q.glow(Xs, Ys + T * 0.05, Rw * 2.6, '#FF6A1F', 0.32 + 0.4 * fl, 0.45); Q.glow(Xs, Ys - H * 0.45, Rw * 1.9, '#FF7A2A', 0.42 * a, 1.25);   // (its light on the floor, flashing as it bursts; the column's glow)
      Q.billow(Xs, Ys - Rw * 0.18, Rw * 0.85, 1.0, 0.8 * a, sd, 0.6);
      for (let i = 0; i < 5; i++) { const o = i - 2, ao = Math.abs(o); Q.tongue(Xs + o * Rw * 0.2, Ys + T * 0.04, Rw * (0.62 - 0.12 * ao), H * (1 - 0.17 * ao) * (0.92 + 0.08 * Math.sin(t * 13 + i)), o * 0.13 + Math.sin(t * 9 + i * 1.3) * 0.05, 1.0 - 0.1 * ao, a * (ao ? 0.75 : 1), sd + i * 2.3); }
      Q.tongue(Xs, Ys + T * 0.02, Rw * 0.3, H * 0.6, Math.sin(t * 17) * 0.03, 1.15, a, sd + 11);   // (the white-hot root)
      Q.fire(Xs, Ys - H * 0.55, Rw * 0.75, 0.9, 0.55 * a, sd + 3); Q.fire(Xs, Ys - H * 0.85, Rw * 0.5, 0.75, 0.4 * a * fall, sd + 5);
      if (!lo) for (let i = 0; i < 3; i++) { const u = (k * 1.6 + i / 3) % 1; Q.glow(Xs + Math.sin(t * 6 + i * 2.2) * Rw * 0.3, Ys - H * (0.85 + 0.35 * u), Rw * (0.6 + 0.4 * u), '#FF8040', 0.08 * Math.sin(u * Math.PI) * a, 1.6); }   // (heat shimmering above it)
      embers(Q, Xs, Ys, T, Rw, k * 0.9, sd, 1); return; }
    // cooling: the throat dims, black smoke rolls up, the last embers fall
    const e = 1 - k; Q.glow(Xs, Ys, Rw * 0.9, '#FF4A1A', 0.4 * e * e, 0.5); Q.fire(Xs, Ys - Rw * 0.1, Rw * 0.3 * e, 0.6, 0.45 * e, sd, 0.7);
    for (let i = 0; i < 3; i++) { const u = Math.min(1, k * 0.9 + i * 0.15); Q.smoke(Xs + (i - 1) * Rw * 0.25 + Math.sin(t + i) * Rw * 0.1, Ys - T * (0.8 + u * 2.2), Rw * (0.45 + u * 0.6), 0.32 * (1 - u), sd + i, '#2E2426', 0.35); }
    embers(Q, Xs, Ys, T, Rw, 0.9 + k * 1.1, sd, 0.8); }
  // embers flung from the mouth at the burst (stateless: from the time since it, tt seconds)
  function embers(Q, Xs, Ys, T, Rw, tt, sd, a) { const n = lowFx() ? 5 : 10; for (let i = 0; i < n; i++) { const h1 = hh(i, sd | 0), h2 = hh(i + 17, (sd | 0) + 3), t1 = tt - i * 0.03, life = 1.1 + h2 * 0.8; if (t1 < 0 || t1 > life) continue;
      const x = Xs + (h1 - 0.5) * Rw * 0.5 + T * (h1 - 0.5) * 3.4 * t1, y = Ys - T * 0.3 + T * (-(4.5 + h2 * 3.5) * t1 + 3.8 * t1 * t1), f = 1 - t1 / life; Q.glow(x, y, T * 0.17, '#FF6A1F', 0.5 * f * a); Q.star(x, y, T * (0.06 + 0.05 * f), f * a, i % 3 ? '#FFC070' : '#FFF0D0'); } }

  /* ======================= lava you can touch: the GPU's dressing over its 2D surface ======================= */
  function ground(c, X, C) { if (!C.lava.length) return; const F = fgx(); if (!F) return; const T = X.Tz(), W = X.W(), Hh = X.H(), t = C.t, lo = lowFx(), ops = [];
    for (const p of C.lava) { if (p.off) continue;
      if (p.kind === 'pool') { const Xs = X.sx(p.x), Ys = X.sy(p.y), R = p.r * T; if (Xs < -R * 2 || Xs > W + R * 2 || Ys < -R * 2 || Ys > Hh + R * 2) continue; ops.push(['pool', Xs, Ys, R, p.seed || 0]); }
      else for (const tl of p.tiles) { const Xs = X.sx(tl.tx + 0.5), Ys = X.sy(tl.ty + 0.5); if (Xs < -T || Xs > W + T || Ys < -T || Ys > Hh + T) continue; ops.push(['tile', Xs, Ys, T * 0.5, tl.tx * 7 + tl.ty * 13]); } }
    if (!ops.length) return; STATS.lava++;
    try { const Q = F.begin(c, null);
      for (const [kd, Xs, Ys, R, sd] of ops) { const fl = 0.5 + 0.5 * Math.sin(t * 1.7 + sd);
        if (kd === 'pool') { Q.ground(Xs, Ys, R * 0.95, 0.85, 0.55, sd, 1, 0.6); Q.glow(Xs, Ys, R * 1.9, '#FF6A1F', 0.2 + 0.08 * fl, 0.75); }
        else { Q.ground(Xs, Ys, R * 1.15, 0.8, 0.42, sd, 1, 0.3); Q.glow(Xs, Ys, R * 1.7, '#FF6A1F', 0.12 + 0.05 * fl, 0.8); }   // (churning hot currents; a feathered glow that softens its edges)
        if (!lo) { const u = (t * 0.35 + hh(sd | 0, 5)) % 1; if (u < 0.5) { const b = Math.sin(u / 0.5 * Math.PI); Q.glow(Xs + (hh(sd | 0, 9) - 0.5) * R, Ys + (hh(sd | 0, 13) - 0.5) * R * 0.6, R * 0.22 * b + 1, '#FFE0A0', 0.45 * b); }   // (a bubble swelling and bursting)
          const e = (t * 0.5 + hh(sd | 0, 21)) % 1; Q.star(Xs + (hh(sd | 0, 23) - 0.5) * R + Math.sin(t * 2 + sd) * T * 0.08, Ys - e * T * 1.4, T * 0.045, Math.sin(e * Math.PI) * 0.8, '#FFB060'); } }   // (an ember rising)
      F.flush(c); } catch (e) {} }

  /* the vent fires of a running stage's CAL vents, in a GPU pass the caller holds (20zz5 drawOver) */
  const live = C => !!(C && C.vents && C.vents.length && on());
  function over(Q, X, C, T, t) { const W = X.W(), Hh = X.H(); for (const v of C.vents) { if (!v.on && v.st === 'idle' && !(v.n > 0 && v.t < 1.1)) continue; const Xs = X.sx(v.x), Ys = X.sy(v.y); if (Xs < -T * 3 || Xs > W + T * 3 || Ys < -T * 2 || Ys > Hh + T * 6) continue;
      const s = calPhase(v); s.r = (v.r || 1.1) / 1.1 * 1.05; s.seed = (v.x * 7 + v.y * 13) | 0; s.t = t; fx(Q, Xs, Ys, T, s); } }

  /* the loading screen's warm-up (the Caldera's Rf.preload, chained): the vents' mouths and their light, at the sizes a stage
     draws them (the vent fields' 1.0-tile vents, the Descent's lane vents), so none is painted mid-play */
  const qP = P => Math.max(8, Math.round(Math.exp(Math.round(Math.log(P) * 10) / 10)));
  function warm(P) { if (!P || !(P.T > 0) || (P.S && P.S.kind === 'boss') || !reg1()) return []; const B = BP(), base = P.T * (P.k || 1), jobs = [];
    for (const sc of [1.0 / 1.1 * 1.05, 1.12]) for (const v of ['0', '1', '2', '0g', '1g', '2g']) jobs.push(() => { try { B.sprite('calvent', v, qP(base * sc)); } catch (e) {} });
    return jobs; }
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.caldera; if (Rf && !Rf.__calfire) { const old = Rf.preload; Rf.preload = function (P) { let a = []; try { a = old ? old.apply(this, arguments) || [] : []; } catch (e) {} return a.concat(warm(P)); }; Rf.__calfire = 1; } } catch (e) {}
  const trapArt = { vent, ventAt, fx, live, over, ground, on, heatOf };
  if (typeof CAL !== 'undefined') CAL.trapArt = trapArt;
  const API = { get stats() { return Object.assign({}, STATS); }, reg: reg1, install, OLD, DEFS, trapArt, get CAL() { return typeof CAL !== 'undefined' ? CAL : null; } };
  if (typeof window !== 'undefined') window.CAL_FIRE = API;
  return API;
})();
