/* ---------- Light (pink), reworked: Wish Upon a Star ----------
   A giant pink wishing star forms on the floor beneath the monster group near the aim: a five-pointed outline traces
   itself round (a rose ribbon with a pearl thread and a bright head), fills with translucent blush light and rises a
   little into a shallow, softly rounded star (a cached shaded height field: ridges to its points, a pearl-white centre,
   saturated rose-to-magenta points, a deep-pink side band for its thickness, every edge feathered). Tiny stars spiral
   inward over it, its five points brighten one after another as the charge builds and it makes a slow partial turn;
   its centre contracts, then releases a broad five-pointed wave of light that runs out across the floor (a brilliant
   pearl leading edge, a rose band, a translucent body, star dust trailing off the front). 1 wave; 2 at Adept, the second
   turned a tenth of a turn so the two interlace; 3 at Celestial, where three nested star outlines turn round the source
   and line up just before each release, the last wave is the widest and strongest with long pink trails behind its
   points, and the source then separates into smaller stars that rise and fade.
   Damage: each wave hits each monster once, when its star-shaped front (the radius times the star's angular profile)
   reaches it; the waves share about 15 x base (1: all; 2: 44/56 %; 3: 27/31/42 %). Floor art is additive light or
   translucent and drawn under everything; the floating stars dim near the pet. */
(() => {
  const U = ELEM_IMPL.light.ult, TAU = Math.PI * 2; delete U.heavenriver;
  const ROSE = '#FF5CCB', CANDY = '#FF8FDB', MAG = '#E83EAC', BLUSH = '#FFD4EE', PEARL = '#FFF4FC', DEEP = '#8F2D73';
  let H;
  const cl = u => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const gl = (c, col, x, y, r, a, sq) => { if (!(a > 0.005) || r < 1) return; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r * (sq || 1), r * 2, r * 2 * (sq || 1)); };

  /* the star's polar profile: 1 at a point (angle 0, 72 deg, ...), RI at a notch; straight sides the tips
     blunted a little so the points are softly rounded. The same function shapes the art and the hit test */
  const RI = 0.53, ARM = TAU / 5, EX = RI * Math.cos(ARM / 2) - 1, EY = RI * Math.sin(ARM / 2);
  function prof(a) { let u = ((a % ARM) + ARM) % ARM; if (u > ARM / 2) u = ARM - u; const c = Math.cos(u), s = Math.sin(u), poly = EY / (c * EY - s * EX); return poly * (1 - 0.07 * Math.exp(-u * u / 0.008)); }
  /* points of the star outline on the floor (screen px), radius Rp px, turned by rot */
  function starPts(X, Y, Rp, rot, N) { const p = []; for (let i = 0; i <= N; i++) { const a = i / N * TAU, r = Rp * prof(a); p.push([X + Math.cos(a + rot) * r, Y + Math.sin(a + rot) * r * H.GY]); } return p; }
  const ramp = (stops, u) => { u = cl(u); for (let i = 1; i < stops.length; i++) if (u <= stops[i][0]) { const [u0, c0] = stops[i - 1], [u1, c1] = stops[i], k = (u - u0) / (u1 - u0 || 1); return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)]; } return stops[stops.length - 1][1]; };

  /* ---- the source star (seen from straight above; squashed onto the floor when drawn): a shallow rounded height
     field h = 1 - q^1.6 (q = r / profile) lit from the upper left, pearl at the centre to saturated rose and magenta
     points, translucent, its rim feathered. Its edge sits at 0.9 of the sprite's half width ---- */
  const SEDGE = 0.9;
  const starSpr = () => fxSprite('lu7gstar', 320, 320, (g, W) => {
    const im = g.createImageData(W, W), d = im.data, c0 = W / 2, Re = c0 * SEDGE, hh = new Float32Array(W * W), qq = new Float32Array(W * W), rr = new Float32Array(W * W);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const dx = (x + 0.5 - c0) / Re, dy = (y + 0.5 - c0) / Re, r = Math.hypot(dx, dy), q = r / prof(Math.atan2(dy, dx)), i = y * W + x; qq[i] = q; rr[i] = r; hh[i] = q < 1 ? 1 - Math.pow(q, 1.6) : 0; }
    const st = [[0, hexRGB(PEARL)], [0.22, hexRGB(PEARL)], [0.4, hexRGB(BLUSH)], [0.5, hexRGB('#FFB0E6')], [0.68, hexRGB(CANDY)], [0.86, hexRGB(ROSE)], [1, hexRGB(MAG)]];
    let Lx = -0.45, Ly = -0.6, Lz = 0.66; const Ln = Math.hypot(Lx, Ly, Lz); Lx /= Ln; Ly /= Ln; Lz /= Ln; const S = Re * 0.22;
    for (let y = 1; y < W - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x, q = qq[i]; if (q > 1.08) continue;
      const gx = (hh[i + 1] - hh[i - 1]) * S, gy = (hh[i + W] - hh[i - W]) * S, nl = Math.hypot(gx, gy, 1), dot = (-gx * Lx - gy * Ly + Lz) / nl, sh = Math.max(0.6, Math.min(1.35, 1 + (dot - Lz) * 1.1));
      const r = rr[i], base = ramp(st, r), o = i * 4;
      for (let k = 0; k < 3; k++) d[o + k] = Math.round(sh <= 1 ? base[k] * (0.55 + 0.45 * sh) : base[k] + (255 - base[k]) * (sh - 1) * 1.2);
      // a pearly bevel line just inside the rim on the lit sides
      const bev = Math.exp(-Math.pow((q - 0.9) / 0.035, 2)) * Math.max(0, dot - Lz) * 2.2; for (let k = 0; k < 3; k++) d[o + k] = Math.round(d[o + k] + (255 - d[o + k]) * cl(bev));
      d[o + 3] = Math.round(255 * cl((1 - sstep(0.86, 1.05, q)) * (0.5 + 0.38 * Math.pow(1 - cl(r), 1.5) + 0.1 * cl(bev)))); }
    g.putImageData(im, 0, 0); });
  /* its side band (the thickness): the same silhouette, magenta to deep pink, feathered */
  const sideSpr = () => fxSprite('lu7side', 320, 320, (g, W) => {
    const im = g.createImageData(W, W), d = im.data, c0 = W / 2, Re = c0 * SEDGE, A = hexRGB(MAG), B = hexRGB(DEEP);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const dx = (x + 0.5 - c0) / Re, dy = (y + 0.5 - c0) / Re, q = Math.hypot(dx, dy) / prof(Math.atan2(dy, dx)); if (q > 1.06) continue; const o = (y * W + x) * 4, k = cl(0.5 + dy * 0.5); d[o] = lerp(A[0], B[0], k); d[o + 1] = lerp(A[1], B[1], k); d[o + 2] = lerp(A[2], B[2], k); d[o + 3] = Math.round(255 * 0.85 * (1 - sstep(0.84, 1.04, q))); }
    g.putImageData(im, 0, 0); });
  /* ---- the shockwave (additive, squashed onto the floor): a pearl leading edge at q = 1, a rose band just inside, a
     translucent candy body fading inward; every edge soft. The front sits at WEDGE of the half width ---- */
  const WEDGE = 0.92;
  const waveSpr = () => fxSprite('lu7wave', 384, 384, (g, W) => {
    const im = g.createImageData(W, W), d = im.data, c0 = W / 2, Re = c0 * WEDGE, P = hexRGB(PEARL), Ro = hexRGB(ROSE), Ca = hexRGB(CANDY), Bl = hexRGB(BLUSH);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const dx = (x + 0.5 - c0) / Re, dy = (y + 0.5 - c0) / Re, q = Math.hypot(dx, dy) / prof(Math.atan2(dy, dx)); if (q > 1.07 || q < 0.25) continue;
      const e1 = Math.exp(-Math.pow((q - 0.985) / 0.02, 2)), e2 = Math.exp(-Math.pow((q - 0.94) / 0.05, 2)), b = sstep(0.3, 0.92, q) * (1 - sstep(0.96, 1.02, q)) * 0.26, b2 = Math.exp(-Math.pow((q - 0.8) / 0.08, 2)) * 0.08;
      const wsum = e1 * 1.3 + e2 + b + b2 + 1e-6, o = (y * W + x) * 4;
      for (let k = 0; k < 3; k++) d[o + k] = Math.round((P[k] * e1 * 1.3 + Ro[k] * e2 + Ca[k] * b + Bl[k] * b2) / wsum);
      d[o + 3] = Math.round(255 * cl(e1 * 0.95 + e2 * 0.62 + b + b2)); }
    g.putImageData(im, 0, 0); });
  /* a long trail behind a point of the final wave: transparent at its inner end, rose, pearl at the tip; gaussian across */
  const trailSpr = () => fxSprite('lu7trail', 160, 32, (g, W, Hh) => {
    const im = g.createImageData(W, Hh), d = im.data, Ro = hexRGB(ROSE), P = hexRGB(PEARL);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const u = (x + 0.5) / W, v = (y + 0.5 - Hh / 2) / (Hh / 2), wv = Math.exp(-v * v * 3.2 / Math.max(0.15, 0.3 + 0.7 * (1 - u))), k = sstep(0.85, 1, u), o = (y * W + x) * 4;
      for (let j = 0; j < 3; j++) d[o + j] = Math.round(lerp(Ro[j], P[j], k * Math.exp(-v * v * 8))); d[o + 3] = Math.round(255 * cl(Math.pow(u, 1.6) * wv * (1 - sstep(0.95, 1, u)) * 0.9)); }
    g.putImageData(im, 0, 0); });
  /* a little five-pointed star: candy body, pearl lit side and centre, a soft glow round it */
  const tinyStar = col => fxSprite('lu7tiny|' + col, 48, 48, (g, W) => {
    const c0 = W / 2; let gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); gr.addColorStop(0, rgbaS(col, 0.5)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, W);
    g.beginPath(); for (let i = 0; i < 10; i++) { const b = -Math.PI / 2 + i / 10 * TAU, r = i % 2 ? W * 0.14 : W * 0.34; if (i) g.lineTo(c0 + Math.cos(b) * r, c0 + Math.sin(b) * r); else g.moveTo(c0 + Math.cos(b) * r, c0 + Math.sin(b) * r); } g.closePath();
    gr = g.createLinearGradient(c0 - W * 0.3, c0 - W * 0.3, c0 + W * 0.3, c0 + W * 0.3); gr.addColorStop(0, PEARL); gr.addColorStop(0.45, col); gr.addColorStop(1, MAG); g.fillStyle = gr; g.lineJoin = 'round'; g.fill(); g.strokeStyle = rgbaS(DEEP, 0.5); g.lineWidth = 0.8; g.stroke();
    gr = g.createRadialGradient(c0, c0, 0, c0, c0, W * 0.15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,244,252,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, W); });
  const stroke = (c, pts, n, col, lw, a) => { if (n < 2 || !(a > 0.01)) return; c.globalAlpha = Math.min(1, a); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); };

  /* ================= 9. Wish Upon a Star ================= */
  U.wishuponastar = (C, h) => {
    H = h;
    const ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), K = C.K, NW = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, CEL = ev >= 7;
    // centred on the monster group near the aim (a boss counts more); one tip turned toward its farthest member
    let x = C.tx, y = C.ty; const grp = H.living().filter(m => Math.hypot(m.x - x, m.y - y) < 4.5);
    if (grp.length) { let sx = 0, sy = 0, sw = 0; for (const m of grp) { const w = m.boss ? 3 : 1; sx += m.x * w; sy += m.y * w; sw += w; } x = sx / sw; y = sy / sw; }
    let rot0 = -Math.PI / 2; if (grp.length) { let far = null, fd = 0.6; for (const m of grp) { const dd = Math.hypot(m.x - x, m.y - y); if (dd > fd) { fd = dd; far = m; } } if (far) rot0 = Math.atan2(far.y - y, far.x - x); }
    const RS = (1.9 + 0.08 * (ev - 1)) * K, RW = (4.7 + 0.2 * (ev - 1)) * K;
    const TR = 0.55, FL0 = 0.38, FL1 = 0.95, DROT = Math.PI / 10;
    const rel = NW === 1 ? [1.55] : NW === 2 ? [1.55, 2.0] : [1.75, 2.22, 2.72], LAST = rel[NW - 1];
    const WGT = NW === 1 ? [1] : NW === 2 ? [0.44, 0.56] : [0.27, 0.31, 0.42], TOT = C.base * 15 * K * (1 + 0.08 * (ev - 1));
    const waves = rel.map((t0, i) => { const fin = CEL && i === NW - 1; return { t0, rot: rot0 + i * DROT, R: RW * (fin ? 1.25 : 1), dur: fin ? 1.15 : 0.95, dmg: TOT * WGT[i], fin, on: false, hit: new Set() }; });
    const END = LAST + waves[NW - 1].dur, RISE0 = LAST + 0.35, LIFE = CEL ? Math.max(END + 0.6, RISE0 + 0.5 + 1.4) : END + 0.6;
    const front = (w, t) => { const u = cl((t - w.t0) / w.dur); return w.R * (1 - Math.pow(1 - u, 2.2)); };
    /* the slow partial turn while it charges, then a tenth of a turn between releases, each wave leaving at the angle the star has then */
    const rotAt = t => { if (t < rel[0]) return rot0 - 0.6 * (1 - sstep(FL0, rel[0] - 0.05, t)); for (let i = 0; i < NW - 1; i++) if (t < rel[i + 1]) return rot0 + DROT * (i + sstep(rel[i] + 0.06, rel[i + 1] - 0.08, t)); return rot0 + DROT * (NW - 1) + 0.12 * sstep(LAST, END, t); };
    /* the five points light one after another through each charge window; a release fades them */
    const tipB = (k, t) => { for (let i = 0; i < NW; i++) { const w0 = i ? rel[i - 1] + 0.08 : FL1, w1 = rel[i] - 0.1, seg = (w1 - w0) / 5; if (t < rel[i] + 0.3) return t < w0 ? 0 : sstep(w0 + k * seg, w0 + (k + 0.7) * seg, t) * (1 - sstep(rel[i], rel[i] + 0.3, t)); } return 0; };
    /* the centre contracts just before each release and pops as the wave leaves */
    const pulse = t => { let con = 0, pop = 0; for (const r0 of rel) { const d = t - r0; con = Math.max(con, sstep(-0.22, -0.03, d) * (1 - sstep(-0.03, 0.1, d))); pop = Math.max(pop, sstep(-0.03, 0.04, d) * (1 - sstep(0.04, 0.4, d))); } return [con, pop]; };
    const NSP = CEL ? 18 : ev >= 4 ? 13 : 9, NRS = 9;
    const rs = []; for (let i = 0; i < NRS; i++) { const b = R1(i * 4.1 + 2) * TAU, r = i ? RS * (0.25 + 0.4 * R1(i * 2.7)) : 0; rs.push({ x: Math.cos(b) * r, y: Math.sin(b) * r, t0: RISE0 + (i ? 0.05 + R1(i * 6.3) * 0.35 : 0), up: 2.2 + 1.6 * R1(i * 1.3), dx: (R1(i * 9.7) - 0.5) * 0.8, sz: i ? 0.32 + 0.22 * R1(i * 5.5) : 0.75, sp: (R1(i * 3.3) - 0.5) * 3 }); }
    const warm = [starSpr, sideSpr, waveSpr, trailSpr, () => tinyStar(BLUSH), () => tinyStar(CANDY), () => tinyStar(ROSE)];
    H.X.banner('WISH UPON A STAR', '', ROSE, 1.6); if (H.X.sfx.hum) H.X.sfx.hum();
    H.add({ life: LIFE, x, y, wi: 0,
      update(dt, f) {
        for (let q = 0; q < 2 && f.wi < warm.length; q++) warm[f.wi++]();
        const t = f.t, Q = H.Q();
        // charging: motes drawn in over the star
        if (t > FL0 && t < LAST) if (Math.random() < dt * 16 * Q) { const b = Math.random() * TAU, r = RS * (1.1 + Math.random() * 0.8); H.P({ kind: 'spark', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r, vx: -Math.cos(b) * r * 1.4, vy: -Math.sin(b) * r * 1.4 - 0.3, life: 0.55, max: 0.55, size: 1.6, color: Math.random() < 0.5 ? BLUSH : ROSE, drag: 1.2 }); }
        for (const w of waves) {
          if (!w.on) { if (t < w.t0) continue; w.on = true; if (H.X.sfx.sparkle) H.X.sfx.sparkle(); H.flareAt(x, y - 0.1, w.fin ? 2.4 : 1.7, 0.3, PEARL); H.glowAt(x, y, RS * 2.2, 0.45, ROSE, 0.6);
            for (let k = 0; k < H.n(w.fin ? 16 : 9); k++) { const b = rot0 + (k % 5) * ARM + (Math.random() - 0.5) * 0.4, v = 2.5 + Math.random() * 2.5; H.P({ kind: k % 3 ? 'spark' : 'star', x, y, vx: Math.cos(b) * v, vy: Math.sin(b) * v - 0.8, life: 0.6, max: 0.6, size: 2 + Math.random() * 2, color: k % 2 ? BLUSH : ROSE, drag: 2 }); } }
          if (t > w.t0 + w.dur) continue;
          const s = front(w, t);
          // the hit: each monster once, when the star-shaped front reaches it
          for (const m of H.living()) { if (w.hit.has(m)) continue; const dx = m.x - x, dy = m.y - y, dd = Math.hypot(dx, dy); if (s * prof(Math.atan2(dy, dx) - w.rot) < dd - (m.r || 0.4) * 0.85) continue;
            w.hit.add(m); H.X.hitMon(m, w.dmg, C.dmgO({ kb: w.fin ? 2 : 1 }));
            H.P({ kind: 'glow', x: m.x, y: m.y - 0.3, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 1 + (m.r || 0.4), color: ROSE, alpha: 0.8 }); H.flareAt(m.x, m.y - 0.35, w.fin ? 0.95 : 0.7, 0.18, CANDY);
            for (let k = 0; k < H.n(3); k++) H.P({ kind: 'star', x: m.x + (Math.random() - 0.5) * 0.5, y: m.y - 0.2, vx: dx / (dd || 1) * 1.2 + (Math.random() - 0.5) * 0.8, vy: -1 - Math.random(), life: 0.65, max: 0.65, size: 2 + Math.random() * 1.5, color: k % 2 ? BLUSH : ROSE }); }
          // star dust trailing off the front (and off the points of the final wave)
          const u = (t - w.t0) / w.dur; if (u < 0.92) for (let k = 0; k < 3; k++) if (Math.random() < dt * (w.fin ? 40 : 26) * Q) { const tip = k === 0 && w.fin, a = tip ? Math.floor(Math.random() * 5) * ARM : Math.random() * TAU, r = s * prof(a) * 0.97, b = a + w.rot;
            H.P({ kind: Math.random() < 0.35 ? 'star' : 'spark', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r, vx: Math.cos(b) * 0.6, vy: Math.sin(b) * 0.6 - 0.5 - Math.random() * 0.6, life: 0.7, max: 0.7, size: 1.4 + Math.random() * 1.4, color: Math.random() < 0.4 ? PEARL : Math.random() < 0.5 ? BLUSH : ROSE, drag: 1.5 }); }
        }
        // after the last release at Hatchling/Adept the source fades out in a few sparkles
        if (!CEL && t > LAST + 0.2 && t < LAST + 0.7 && Math.random() < dt * 14 * Q) { const b = Math.random() * TAU, r = Math.random() * RS * 0.7; H.P({ kind: 'spark', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r, vx: 0, vy: -0.9 - Math.random() * 0.6, life: 0.8, max: 0.8, size: 1.6, color: Math.random() < 0.5 ? PEARL : ROSE }); }
      },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, GY = H.GY, rot = rotAt(t), [con, pop] = pulse(t);
        c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
        /* ---- the outline tracing itself round, from the point at the top ---- */
        const trU = sstep(0, TR, t), trA = 1 - sstep(FL1 - 0.15, FL1 + 0.35, t);
        if (trA > 0.01) { const pts = starPts(X, Y, RS * T, rot, 150), n = Math.max(2, Math.round(trU * 150) + 1);
          c.globalCompositeOperation = 'lighter'; stroke(c, pts, n, ROSE, T * 0.2, 0.32 * trA); stroke(c, pts, n, CANDY, T * 0.09, 0.7 * trA); stroke(c, pts, n, PEARL, T * 0.035, 0.9 * trA);
          if (trU < 1) { const p = pts[n - 1]; gl(c, ROSE, p[0], p[1], T * 0.7, 0.7 * trA); gl(c, PEARL, p[0], p[1], T * 0.25, 0.9 * trA); } }
        /* ---- the star itself: fills with light, rises a little, contracts and pops at each release, fades at the end ---- */
        const fillA = sstep(FL0, FL1, t), outA = CEL ? sstep(RISE0 - 0.1, RISE0 + 0.45, t) : sstep(LAST + 0.25, END + 0.3, t), a = fillA * (1 - outA);
        if (a > 0.01) {
          const lift = T * 0.16 * sstep(FL0 + 0.15, FL1 + 0.1, t), sc = 1 - 0.1 * con + 0.06 * pop, Rp = RS * T * sc, half = Rp / SEDGE;
          c.globalCompositeOperation = 'source-over';
          for (let k = 0; k < 3; k++) { c.save(); c.translate(X, Y - lift * k / 3); c.scale(1, GY); c.rotate(rot); c.globalAlpha = a * 0.5; c.drawImage(sideSpr(), -half, -half, half * 2, half * 2); c.restore(); }
          c.save(); c.translate(X, Y - lift); c.scale(1, GY); c.rotate(rot); c.globalAlpha = a * 0.95; c.drawImage(starSpr(), -half, -half, half * 2, half * 2); c.restore();
          c.globalCompositeOperation = 'lighter';
          let lit = 0; for (let k = 0; k < 5; k++) lit += tipB(k, t); lit /= 5;
          // a rose halo round it, the pearl centre (brighter as the charge builds, a flash as it releases)
          gl(c, ROSE, X, Y - lift, Rp * 1.45, a * (0.16 + 0.12 * lit + 0.2 * pop), GY);
          gl(c, BLUSH, X, Y - lift, Rp * 0.5 * (1 - 0.25 * con), a * (0.35 + 0.35 * lit + 0.4 * pop), GY);
          gl(c, '#FFFFFF', X, Y - lift, Rp * 0.2 * (1 - 0.3 * con + 0.5 * pop), a * (0.45 + 0.3 * lit + 0.5 * pop), GY);
          // a soft sheen slowly circling the face
          const sb = t * 0.9; gl(c, BLUSH, X + Math.cos(sb) * Rp * 0.42, Y - lift + Math.sin(sb) * Rp * 0.42 * GY, Rp * 0.32, a * 0.18, GY);
          // the points, lighting one after another
          for (let k = 0; k < 5; k++) { const b = rot + k * ARM, tb = tipB(k, t), px = X + Math.cos(b) * Rp * 0.8, py = Y - lift + Math.sin(b) * Rp * 0.8 * GY;
            gl(c, ROSE, px, py, T * (0.45 + 0.45 * tb), a * (0.18 + 0.5 * tb), 0.75); if (tb > 0.02) gl(c, PEARL, px, py, T * 0.2 * (0.6 + 0.4 * tb), a * 0.75 * tb, 0.75); }
          // its rim line, a fine rose contour that keeps the shape readable
          const pts = starPts(X, Y - lift, Rp * 0.985, rot, 150); stroke(c, pts, pts.length, ROSE, T * 0.07, a * (0.35 + 0.3 * lit));
        }
        /* ---- Celestial: three nested star outlines turning round the source, lining up just before each release ---- */
        if (CEL) { const oa = sstep(FL0 + 0.1, FL1 + 0.3, t) * (1 - sstep(LAST + 0.05, LAST + 0.6, t));
          if (oa > 0.01) { let nx = null; for (const r0 of rel) if (r0 >= t - 0.02) { nx = r0; break; } const mis = nx != null ? sstep(0.04, 0.42, nx - t) : sstep(0, 0.5, t - LAST);
            for (let k = 0; k < 3; k++) { const Rk = RS * T * (1.24 + 0.22 * k), rk = rot + mis * 1.05 * Math.sin(t * (1.3 + 0.4 * k) * (k % 2 ? -1 : 1) + k * 1.9), al = oa * (0.55 + 0.45 * (1 - mis)), pts = starPts(X, Y, Rk, rk, 120);
              stroke(c, pts, pts.length, ROSE, T * 0.12, al * 0.3); stroke(c, pts, pts.length, CANDY, T * 0.05, al * 0.6); stroke(c, pts, pts.length, PEARL, T * 0.018, al * 0.75 * (1 - mis * 0.6));
              for (let j = 0; j < 5; j++) { const b = rk + j * ARM; gl(c, PEARL, X + Math.cos(b) * Rk, Y + Math.sin(b) * Rk * GY, T * 0.18, al * (0.35 + 0.5 * (1 - mis)), 0.8); } } } }
        /* ---- the shockwaves ---- */
        for (const w of waves) { if (!w.on) continue; const u = (t - w.t0) / w.dur; if (u > 1.05) continue; const s = front(w, t) * T; if (s < 2) continue;
          const wa = (1 - sstep(0.6, 1.05, u)) * sstep(0, 0.06, u);
          c.globalCompositeOperation = 'lighter';
          if (u < 0.3) gl(c, PEARL, X, Y, RS * T * 1.3, (1 - u / 0.3) * 0.5, GY);
          c.save(); c.translate(X, Y); c.scale(1, GY); c.rotate(w.rot); c.globalAlpha = wa * (w.fin ? 1 : 0.92); const hw = s / WEDGE; c.drawImage(waveSpr(), -hw, -hw, hw * 2, hw * 2);
          // the final wave: long pink trails streaming behind its points, and a fainter echo inside it
          if (w.fin) { c.globalAlpha = wa * 0.5; c.drawImage(waveSpr(), -hw * 0.82, -hw * 0.82, hw * 1.64, hw * 1.64); const tl = Math.min(s * 0.85, T * 3.6), tw = T * 0.75;
            for (let k = 0; k < 5; k++) { c.save(); c.rotate(k * ARM); c.globalAlpha = wa * 0.95; c.drawImage(trailSpr(), s - tl, -tw / 2, tl * 1.03, tw); c.globalAlpha = wa * 0.4; c.drawImage(trailSpr(), s - tl * 1.3, -tw, tl * 1.3, tw * 2); c.restore(); } }
          c.restore(); }
        c.restore(); },
      draw(c, f, X, Y, T) {
        const t = f.t, GY = H.GY, pX = H.sx(H.me.x), pY = H.sy(H.me.y) - T * 0.46, near = (px, py) => 1 - 0.75 * (1 - sstep(T * 0.5, T * 1.4, Math.hypot(px - pX, (py - pY) * 1.2)));
        const lift = T * 0.16 * sstep(FL0 + 0.15, FL1 + 0.1, t);
        c.save(); c.globalCompositeOperation = 'lighter';
        /* tiny stars spiralling inward over the charging star */
        const spA = sstep(FL0, FL1, t) * (1 - sstep(LAST - 0.1, LAST + 0.15, t));
        if (spA > 0.01) for (let i = 0; i < NSP; i++) { const per = 1.1 + 0.4 * R1(i * 1.7), u = (t / per + R1(i * 3.7)) % 1, r = RS * (1.9 - 1.75 * u) * T, ang = R1(i * 5.1) * TAU + 2.6 * u + t * 0.3, hg = T * (0.12 + 0.9 * (1 - u) * R1(i * 2.3)) + lift;
          const px = X + Math.cos(ang) * r, py = Y + Math.sin(ang) * r * GY - hg, al = spA * Math.pow(Math.sin(Math.PI * u), 0.7) * near(px, py); if (al < 0.02) continue; const sz = T * (0.26 + 0.14 * R1(i * 8.3)) * (1 - 0.4 * u);
          c.globalAlpha = al; c.save(); c.translate(px, py); c.rotate(t * 2 + i); c.drawImage(tinyStar(i % 3 === 0 ? BLUSH : i % 3 === 1 ? CANDY : ROSE), -sz / 2, -sz / 2, sz, sz); c.restore(); }
        /* Celestial: the source separates into smaller stars that rise and fade */
        if (CEL) for (const o of rs) { const k = (t - o.t0) / 1.4; if (k <= 0 || k >= 1) continue; const e = H.ease.out(k), px = X + (o.x + o.dx * e) * T, py = Y + o.y * T * GY - lift - T * (0.2 + o.up * e), al = sstep(0, 0.08, k) * (1 - sstep(0.45, 1, k)) * near(px, py), sz = T * o.sz * (1 - 0.45 * k);
          if (al < 0.02) continue; gl(c, ROSE, px, py, sz * 1.3, al * 0.45); c.globalAlpha = al; c.save(); c.translate(px, py); c.rotate(o.sp * k); c.drawImage(tinyStar(o.sz > 0.6 ? BLUSH : CANDY), -sz / 2, -sz / 2, sz, sz); c.restore(); gl(c, PEARL, px, py, sz * 0.3, al * 0.6); }
        c.restore(); } });
  };
})();
