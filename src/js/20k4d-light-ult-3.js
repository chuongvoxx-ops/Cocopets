/* ---------- Light (pink), reworked: Ray of Light ----------
   Ray of Light: a bright circular mark (rings and a ring of tiny hearts) appears on the floor at the aim; a narrow line of
   pearl light drops onto it from the sky, then widens into one enormous, continuous pink-white column whose top runs off
   the top of the screen. The column stays upright while its contact point glides along a smooth spline through the
   monsters (waypoints picked nearest-first from the cast point, a loop round a boss with live homing; with no monsters it
   sweeps ahead along the aim). Layers: a soft blush halo, a rose-pink body with a brighter limb, a pearl-white centre,
   inner currents scrolling down (one at Hatchling, a second at Adept, three layered at Celestial) and fine strands
   streaming down. A brilliant rim rides the floor at the contact point and leaves a fast-fading additive pink trail;
   tiny hearts and star glints rise from the trail (at Celestial also a slower procession of larger hearts and stars).
   Every 0.25 s every monster inside the beam takes Light damage (about 15 x base for one that stays inside throughout);
   each one hit gives a small contact flash and particles streaming outward. Width and route length grow with evo; the
   column fades where it passes over the pet; at the end it narrows to a line, pulls up into the sky and fades. Every
   heavy shape is a cached sprite (column profiles, current tiles, rim, pool, mark, little hearts and stars). */
(() => {
  const U = ELEM_IMPL.light.ult, TAU = Math.PI * 2; delete U.seraphic;
  const ROSE = '#FF5CCB', CANDY = '#FF8FDB', MAG = '#E83EAC', BLUSH = '#FFD4EE', PEARL = '#FFF4FC', DEEP = '#8F2D73', LAV = '#D5C4FF';
  let H;
  const cl = u => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  function heartPath(g, cx, cy, s) { g.beginPath(); for (let i = 0; i <= 72; i++) { const t = i / 72 * TAU, x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); if (i) g.lineTo(cx + x * s, cy + y * s); else g.moveTo(cx + x * s, cy + y * s); } g.closePath(); }
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }
  const gl = (c, col, x, y, r, a, sq) => { if (!(a > 0.005) || r < 1) return; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r * (sq || 1), r * 2, r * 2 * (sq || 1)); };

  /* ---- the column's cross-sections (uniform down its length, stretched to any height): 0 halo, 1 body, 2 core ---- */
  const colSpr = k => fxSprite('lu3col' + k, 128, 2, (g, W, Hh) => {
    const im = g.createImageData(W, Hh), d = im.data, P = hexRGB(PEARL), B = hexRGB(BLUSH), Cn = hexRGB(CANDY), Ro = hexRGB(ROSE), Mg = hexRGB(MAG);
    const mixA = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
    for (let x = 0; x < W; x++) { const q = Math.abs(x + 0.5 - W / 2) / (W / 2); let col, a;
      if (k === 0) { col = mixA(Cn, Mg, sstep(0, 0.9, q)); a = Math.exp(-q * q * 3.2) * 0.75 * (1 - sstep(0.8, 1, q)); }
      else if (k === 1) { col = q < 0.45 ? mixA(Cn, Ro, q / 0.45) : mixA(Ro, Mg, (q - 0.45) / 0.55); a = (1 - sstep(0.76, 1, q)) * (0.62 - 0.2 * q) + Math.exp(-Math.pow((q - 0.82) / 0.07, 2)) * 0.32; }
      else { col = mixA(P, B, sstep(0.2, 1, q)); a = Math.exp(-q * q * 4.5) * (1 - sstep(0.75, 1, q)); }
      for (let y = 0; y < Hh; y++) { const i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = Math.round(255 * cl(a)); } }
    g.putImageData(im, 0, 0); });
  /* ---- the inner currents: tileable tiles of light strands winding down (0 one strand, 1 a double helix with a lavender
     thread, 2 three fine threads twice round) ---- */
  const curSpr = k => fxSprite('lu3cur' + k, 64, 128, (g, W, Hh) => {
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'butt';
    const S = k === 0 ? [[0, 0.3, 1, CANDY]] : k === 1 ? [[0, 0.3, 1, CANDY], [Math.PI, 0.3, 1, LAV]] : [[0, 0.36, 2, BLUSH], [TAU / 3, 0.36, 2, CANDY], [TAU * 2 / 3, 0.36, 2, BLUSH]];
    for (const [ph, amp, cyc, col] of S) for (const [cc, lw, al] of [[ROSE, k === 2 ? 5 : 8, 0.35], [col, k === 2 ? 2 : 3.2, 0.7], [PEARL, k === 2 ? 0.9 : 1.3, 0.9]]) {
      g.strokeStyle = rgbaS(cc, al); g.lineWidth = lw; g.beginPath();
      for (let j = 0; j <= 48; j++) { const y = j / 48 * Hh, x = W / 2 + Math.sin(j / 48 * TAU * cyc + ph) * W * amp; if (j) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); } });
  /* a falling strand (vertical): pearl core, pink edges, faded at both ends */
  const streakSpr = col => fxSprite('lu3streak|' + col, 12, 96, (g, W, Hh) => { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, rgbaS(col, 0)); gr.addColorStop(0.35, rgbaS(col, 0.5)); gr.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.65, rgbaS(col, 0.5)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, Hh); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.5, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gv; g.fillRect(0, 0, W, Hh); });
  /* the contact rim (drawn squashed): a rose band with a pearl edge */
  const rimSpr = () => fxSprite('lu3rim', 256, 256, (g, W) => { const c0 = W / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); [[0, 'rgba(255,92,203,0)'], [0.66, 'rgba(255,92,203,0)'], [0.8, 'rgba(255,92,203,0.55)'], [0.875, 'rgba(255,244,252,1)'], [0.92, 'rgba(255,143,219,0.6)'], [1, 'rgba(255,92,203,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, W, W); });
  /* the lit pool inside the rim: pearl centre, blush, rose */
  const poolSpr = () => fxSprite('lu3pool', 128, 128, (g, W) => { const c0 = W / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); [[0, 'rgba(255,244,252,0.7)'], [0.25, 'rgba(255,212,238,0.45)'], [0.6, 'rgba(255,92,203,0.3)'], [1, 'rgba(255,92,203,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, W, W); });
  /* the ground mark: a bright band, two fine rings and a ring of tiny hearts */
  const markSpr = () => fxSprite('lu3mark', 256, 256, (g, W) => {
    const c0 = W / 2; let gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(255,244,252,0.55)'], [0.3, 'rgba(255,143,219,0.22)'], [0.78, 'rgba(255,92,203,0.18)'], [0.86, 'rgba(255,92,203,0.75)'], [0.91, 'rgba(255,244,252,1)'], [0.95, 'rgba(255,92,203,0.4)'], [1, 'rgba(255,92,203,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, W, W);
    g.translate(c0, c0); g.strokeStyle = 'rgba(255,212,238,0.6)'; g.lineWidth = 1.6; for (const r of [0.5, 0.7]) { g.beginPath(); g.arc(0, 0, c0 * r, 0, TAU); g.stroke(); }
    for (let i = 0; i < 12; i++) { const b = i / 12 * TAU; g.save(); g.translate(Math.cos(b) * c0 * 0.6, Math.sin(b) * c0 * 0.6); g.rotate(b + Math.PI / 2); heartPath(g, 0, -1.5, 0.3); g.fillStyle = 'rgba(255,244,252,0.85)'; g.fill(); g.restore(); } });
  /* a little heart: soft glow, candy body, pearl highlight, deep contour; and its side (thickness) */
  const miniHeart = col => fxSprite('lu3mh' + col, 40, 40, g => { let gr = g.createRadialGradient(20, 20, 0, 20, 20, 20); gr.addColorStop(0, rgbaS(col, 0.5)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 40, 40); const s = 0.78, cy = 20 - 2.5 * s; gr = g.createRadialGradient(16, 15, 0, 20, 21, 12); gr.addColorStop(0, PEARL); gr.addColorStop(0.45, col); gr.addColorStop(1, MAG); heartPath(g, 20, cy, s); g.fillStyle = gr; g.fill(); g.strokeStyle = rgbaS(DEEP, 0.6); g.lineWidth = 1; g.stroke(); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(13.5, 13, 2.2, 1.3, -0.6, 0, TAU); g.fill(); });
  const miniSide = () => fxSprite('lu3ms', 40, 40, g => { const s = 0.78; heartPath(g, 20, 20 - 2.5 * s, s); g.fillStyle = '#B8378F'; g.fill(); g.strokeStyle = rgbaS(DEEP, 0.8); g.lineWidth = 1; g.stroke(); });
  /* a five-pointed star glint */
  const starSpr = col => fxSprite('lu3st' + col, 32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, rgbaS(col, 0.7)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.4 : 8.5, b = -Math.PI / 2 + i * Math.PI / 5; i ? g.lineTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r) : g.moveTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r); } g.closePath(); g.fillStyle = PEARL; g.fill(); g.strokeStyle = rgbaS(col, 0.9); g.lineWidth = 1; g.stroke(); });

  /* centripetal Catmull-Rom between p1 and p2 */
  function crPt(p0, p1, p2, p3, u) {
    const dd = (a, b) => Math.max(1e-3, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1]))), t1 = dd(p0, p1), t2 = t1 + dd(p1, p2), t3 = t2 + dd(p2, p3), t = t1 + (t2 - t1) * u;
    const L = (a, b, ta, tb) => { const k = (t - ta) / (tb - ta); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
    const A1 = L(p0, p1, 0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3), B1 = L(A1, A2, 0, t2), B2 = L(A2, A3, t1, t3); return L(B1, B2, t1, t2); }

  /* ================= Ray of Light ================= */
  U.rayoflight = (C, h) => {
    H = h; const me = H.me, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), L = ev >= 7 ? 3 : ev >= 4 ? 2 : 1;
    const R = [1.0, 1.08, 1.16, 1.42, 1.52, 1.62, 2.15][ev - 1] * C.K, ROUTE = [7, 7.6, 8.2, 9.2, 9.8, 10.4, 14][ev - 1], NW = [3, 3, 3, 4, 4, 5, 7][ev - 1];
    const M0 = 0.4, L0 = 0.7, W0 = 1.0, GL = L === 3 ? 6.5 : 5, G1 = W0 + GL, FOLD = 0.6, END = G1 + FOLD, TICK = 0.25, NT = Math.round(GL / TICK);
    const dmg = C.base * 15 * C.K * (1 + 0.08 * (ev - 1)) / NT, TRL = L === 3 ? 0.9 : 0.65;
    H.X.banner('RAY OF LIGHT', '', ROSE, 1.4); if (H.X.sfx && H.X.sfx.hum) H.X.sfx.hum();
    /* ---- the route ---- */
    const S = H.walk(C.tx, C.ty), pts = [[S.x, S.y]], dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const pool = H.sortNear(S.x, S.y).filter(m => Math.hypot(m.x - S.x, m.y - S.y) < 10), boss = pool.find(m => m.boss) || null;
    if (pool[0] && !pool[0].boss && Math.hypot(pool[0].x - S.x, pool[0].y - S.y) < 0.8) pts[0].push(pool[0]);
    if (boss) { const b0 = Math.atan2(S.y - boss.y, S.x - boss.x); for (let k = 0; k < 4; k++) { const b = b0 + Math.PI + k * 1.9, w = H.walk(boss.x + Math.cos(b) * R * 0.5, boss.y + Math.sin(b) * R * 0.5); pts.push([w.x, w.y, boss]); } }
    const left = pool.filter(m => !m.boss); let guard = 0;
    while (pts.length - 1 < NW + (boss ? 4 : 0) && left.length && guard++ < 60) { const cur = pts[pts.length - 1]; left.sort((p, q) => Math.hypot(p.x - cur[0], p.y - cur[1]) - Math.hypot(q.x - cur[0], q.y - cur[1])); const m = left.shift(); if (Math.hypot(m.x - cur[0], m.y - cur[1]) < R * 0.6) continue; pts.push([m.x, m.y, m]); }
    const plen = () => { let s = 0; for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]); return s; };
    while (pts.length > 2 && plen() > ROUTE * 1.7) pts.pop();
    { const n = pts.length, ext = ROUTE - plen();
      if (ext > 0.8) { // sweep on (along the aim when there was nothing to chase): a gentle S curve
        let a = C.a; if (n > 1) a = Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]);
        const segs = n > 1 ? 2 : 3; let p = pts[n - 1];
        for (let k = 1; k <= segs; k++) { const b = a + (k % 2 ? 0.45 : -0.45) * (n > 1 ? 0.7 : 1), w = H.walk(p[0] + Math.cos(b) * ext / segs, p[1] + Math.sin(b) * ext / segs); if (dist([w.x, w.y], p) < 0.3) break; p = [w.x, w.y]; pts.push(p); } } }
    for (let i = pts.length - 1; i > 0; i--) if (dist(pts[i], pts[i - 1]) < 0.3) pts.splice(i, 1);
    if (pts.length < 2) pts.push([S.x + Math.cos(C.a) * 0.5, S.y + Math.sin(C.a) * 0.5]);
    // dense samples along the spline, with their running length
    const SP = [], SL = [0]; { const n = pts.length, P = i => pts[Math.max(0, Math.min(n - 1, i))], Pm = i => i < 0 ? [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]] : i > n - 1 ? [2 * pts[n - 1][0] - pts[n - 2][0], 2 * pts[n - 1][1] - pts[n - 2][1]] : P(i);
      for (let i = 0; i < n - 1; i++) for (let j = 0; j < 24; j++) SP.push(crPt(Pm(i - 1), P(i), P(i + 1), Pm(i + 2), j / 24)); SP.push(pts[n - 1].slice());
      for (let i = 1; i < SP.length; i++) SL.push(SL[i - 1] + dist(SP[i], SP[i - 1])); }
    const LEN = SL[SL.length - 1] || 1; let si = 0;
    const at = s => { s = Math.max(0, Math.min(LEN, s)); while (si > 0 && SL[si] > s) si--; while (si < SL.length - 2 && SL[si + 1] < s) si++; const k = (s - SL[si]) / Math.max(1e-6, SL[si + 1] - SL[si]); return [lerp(SP[si][0], SP[si + 1][0], cl(k)), lerp(SP[si][1], SP[si + 1][1], cl(k))]; };
    // the waypoints that sit on a monster follow it as it moves: their shift is blended in smoothly along the route
    const anc = []; pts.forEach((p, i) => { if (p[2]) anc.push({ m: p[2], s: SL[Math.min(SL.length - 1, i * 24)], x0: p[2].x, y0: p[2].y, dx: 0, dy: 0 }); });
    /* ---- the little hearts and stars (local, drawn above the floor) ---- */
    const B = [];
    const addB = (x, y, z, o) => B.push(Object.assign({ x, y, z, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 0.12, col: CANDY, kind: 'h', sp: 2 + Math.random() * 3, ph: Math.random() * TAU, drag: 1.2 }, o));
    const NST = [12, 16, 24][L - 1], warm = [() => colSpr(0), () => colSpr(1), () => colSpr(2), () => curSpr(0), rimSpr, poolSpr, markSpr, () => miniHeart(CANDY), () => miniHeart(ROSE), () => miniHeart(BLUSH), miniSide, () => starSpr(BLUSH), () => starSpr(ROSE), () => starSpr(LAV), () => streakSpr(BLUSH), () => streakSpr(CANDY)];
    if (L >= 2) warm.push(() => curSpr(1)); if (L >= 3) warm.push(() => curSpr(2));
    H.add({ life: END + 0.05, x: S.x, y: S.y, wi: 0, nt: 0, pu: 0, tr: [], acc: 0, trav: 0, proc: 0, fl0: false, fl1: false, s: 0,
      update(dt, f) {
        const t = f.t; for (let q = 0; q < 3 && f.wi < warm.length; q++) warm[f.wi++]();
        f.pu = Math.max(0, f.pu - dt * 4);
        // the glide: arc length eased in and out (no jitter); the route bends toward where its monsters (a boss) are now
        const tau = cl((t - W0) / GL), p = 0.7 * tau + 0.3 * (tau - Math.sin(TAU * tau) / TAU), s = p * LEN, q = at(s);
        let x = q[0], y = q[1], ox = 0, oy = 0, ws = 0; for (const a of anc) { if (!a.m.dead) { a.dx = a.m.x - a.x0; a.dy = a.m.y - a.y0; } const w = 1 - sstep(R * 0.6, R * 2.4, Math.abs(s - a.s)); ox += a.dx * w; oy += a.dy * w; ws += w; }
        if (ws > 1) { ox /= ws; oy /= ws; } const om = Math.hypot(ox, oy); if (om > 3) { ox *= 3 / om; oy *= 3 / om; } x += ox; y += oy;
        const mv = Math.hypot(x - f.x, y - f.y); f.trav += mv; f.x = x; f.y = y;
        // the flash as the line widens
        if (!f.fl0 && t >= L0) { f.fl0 = true; H.flareAt(x, y - 0.15, 1.1 + 0.25 * L, 0.25, PEARL); H.P({ kind: 'glow', x, y, vx: 0, vy: 0, life: 0.4, max: 0.4, size: R * 2.2, color: ROSE, alpha: 0.7 });
          for (let k = 0; k < H.n(14); k++) { const b = k / 14 * TAU, v = 3 + Math.random() * 2; H.P({ kind: k % 3 ? 'spark' : 'star', x: x + Math.cos(b) * R * 0.5, y: y + Math.sin(b) * R * 0.3, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.55 - 0.6, life: 0.5, max: 0.5, size: 2 + Math.random() * 1.5, color: k % 2 ? BLUSH : ROSE, drag: 2 }); } }
        // the ticks: every monster inside the beam; a contact flash and particles streaming outward from each
        while (f.nt < NT && t >= W0 + TICK / 2 + f.nt * TICK) { f.nt++; f.pu = 1; const hit = H.near(x, y, R); H.hitArea(x, y, R, dmg, C.dmgO());
          for (const m of hit) { H.flareAt(m.x, m.y - 0.35, 0.42 + 0.06 * L, 0.12, BLUSH); H.P({ kind: 'glow', x: m.x, y: m.y - 0.3, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 0.8 + (m.r || 0.4), color: ROSE, alpha: 0.75 });
            let dx = m.x - x, dy = m.y - y, d = Math.hypot(dx, dy); if (d < 0.1) { const b = Math.random() * TAU; dx = Math.cos(b); dy = Math.sin(b); d = 1; }
            for (let k = 0; k < H.n(3); k++) { const b = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.1, v = 3 + Math.random() * 2.5; H.P({ kind: k === 2 ? 'star' : 'spark', x: m.x, y: m.y - 0.3, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6 - 0.5, life: 0.35 + Math.random() * 0.15, max: 0.5, size: 1.6 + Math.random() * 1.2, color: k % 2 ? PEARL : CANDY, drag: 2.2 }); } } }
        // the trail on the floor (light only), and hearts and stars rising out of it
        const gliding = t >= W0 && t < G1 + 0.2;
        if (gliding) { const l = f.tr[f.tr.length - 1]; if (!l || Math.hypot(l.x - x, l.y - y) > 0.12) f.tr.push({ x, y, t }); }
        while (f.tr.length && t - f.tr[0].t > TRL) f.tr.shift();
        if (gliding && f.tr.length > 1) { f.acc += dt * [9, 12, 18][L - 1] * H.Q();
          while (f.acc >= 1) { f.acc--; const e = f.tr[Math.floor(Math.random() * Math.max(1, f.tr.length - 1))], b = Math.random() * TAU, r = Math.sqrt(Math.random()) * R * 0.75, heart = Math.random() < 0.6;
            addB(e.x + Math.cos(b) * r, e.y + Math.sin(b) * r * 0.6, 0.05, { vx: (Math.random() - 0.5) * 0.3, vz: 0.9 + Math.random() * 0.7, life: 0.9 + Math.random() * 0.6, s: heart ? 0.09 + Math.random() * 0.06 : 0.1 + Math.random() * 0.06, kind: heart ? 'h' : 's', col: heart ? (Math.random() < 0.5 ? CANDY : Math.random() < 0.5 ? ROSE : BLUSH) : (Math.random() < 0.2 ? LAV : BLUSH) }); }
          // Celestial: a procession of larger hearts and stars left behind at even steps along the route
          if (L === 3) while (f.trav - f.proc > 0.55) { f.proc += 0.55; const k = Math.round(f.proc / 0.55), side = k % 2 ? 1 : -1, b = Math.random() * TAU;
            addB(x + Math.cos(b) * R * 0.3, y + side * R * 0.35, 0.15, { vz: 0.3 + 0.1 * Math.random(), drag: 0.9, life: 2.1, s: k % 3 ? 0.2 : 0.16, kind: k % 3 ? 'h' : 's', col: k % 3 === 1 ? CANDY : k % 3 === 2 ? ROSE : PEARL }); } }
        // the fold: a ring of hearts lifts off the rim
        if (!f.fl1 && t >= G1) { f.fl1 = true; for (let k = 0; k < 10 + 4 * L; k++) { const b = k / (10 + 4 * L) * TAU; addB(x + Math.cos(b) * R * 0.8, y + Math.sin(b) * R * 0.45, 0.1, { vx: Math.cos(b) * 0.7, vy: Math.sin(b) * 0.4, vz: 1.1 + 0.4 * R1(k), life: 1.1, s: 0.13, kind: k % 3 === 2 ? 's' : 'h', col: k % 2 ? CANDY : BLUSH }); } }
        // fine dust drifting up off the rim
        if (gliding && Math.random() < dt * 16 * H.Q()) { const b = Math.random() * TAU, r = R * (0.85 + Math.random() * 0.2); H.P({ kind: 'spark', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r * 0.6, vx: Math.cos(b) * 0.4, vy: -0.9 - Math.random() * 0.7, life: 0.7, max: 0.7, size: 1.5, color: Math.random() < 0.5 ? BLUSH : PEARL }); }
        for (let i = B.length - 1; i >= 0; i--) { const b = B[i]; b.t += dt; if (b.t >= b.life) { B.splice(i, 1); continue; } const k = Math.exp(-b.drag * dt); b.vx *= k; b.vy *= k; b.vz *= Math.exp(-0.4 * dt); b.x += b.vx * dt; b.y += b.vy * dt; b.z = Math.max(0, b.z + b.vz * dt); }
      },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, pX = H.sx(me.x), pY = H.sy(me.y);
        const nearK = (px, py) => 1 - 0.6 * (1 - sstep(T * 0.5, T * 1.3, Math.hypot(px - pX, (py - pY) * 1.4)));
        c.save(); c.globalCompositeOperation = 'lighter';
        // the mark (it stays under the beam as the beam first lands, then fades)
        if (t < W0 + 0.3) { const u = cl(t / M0), rm = R * T * 1.1 * (0.35 + 0.65 * H.ease.out(u)), a = Math.min(1, u * 2.5) * (1 - sstep(W0 - 0.1, W0 + 0.3, t)) * nearK(X, Y);
          c.save(); c.translate(X, Y); c.scale(1, H.GY); c.rotate(t * 0.6); c.globalAlpha = a * 0.95; c.drawImage(markSpr(), -rm, -rm, rm * 2, rm * 2); c.restore();
          gl(c, ROSE, X, Y, rm * 1.3, a * 0.3, H.GY); }
        // the trail: soft pink pools fading fast behind the contact point
        for (const e of f.tr) { const u = (t - e.t) / TRL; if (u >= 1) continue; const ex = H.sx(e.x), ey = H.sy(e.y), a = (1 - u) * (1 - u) * nearK(ex, ey), r = R * T * (0.95 - 0.4 * u);
          gl(c, ROSE, ex, ey, r, a * 0.32, H.GY); gl(c, BLUSH, ex, ey, r * 0.5, a * 0.22, H.GY); }
        // the lit pool round the contact point (and Celestial's broad rose-white halo)
        const on = t < L0 ? 0 : t < W0 ? sstep(L0, W0, t) : t < G1 ? 1 : 1 - sstep(G1, G1 + FOLD * 0.7, t);
        if (on > 0.01) { const r = R * T * (1.05 + 0.05 * f.pu), k = nearK(X, Y);
          gl(c, ROSE, X, Y, r * (L === 3 ? 2.6 : 1.7), on * k * (L === 3 ? 0.4 : 0.28), H.GY);
          if (L === 3) gl(c, BLUSH, X, Y, r * 1.7, on * k * 0.25, H.GY);
          c.save(); c.translate(X, Y); c.scale(1, H.GY); c.globalAlpha = on * k * (0.55 + 0.15 * f.pu); c.drawImage(poolSpr(), -r, -r, r * 2, r * 2); c.restore(); }
        c.restore();
      },
      draw(c, f, X, Y, T, tg) {
        const t = f.t, s0 = scr(c), top = s0.y0 - 20, full = R * T * 1.8;
        if (!colSpr(2) || !(T > 0)) return;
        // the beam's width and reach over its phases: a thin line, the widening (a touch of overshoot), the glide, the fold
        const thin = Math.max(2.5, T * 0.09);
        let bw = 0, yb = Y, a = 1;
        if (t >= M0 && t < L0) { const u = (t - M0) / (L0 - M0); bw = thin; yb = lerp(top, Y, H.ease.in(cl(u / 0.45))); a = 0.6 + 0.4 * u; }
        else if (t >= L0 && t < W0) { const u = (t - L0) / (W0 - L0); bw = lerp(thin, full, H.ease.back(u)); }
        else if (t >= W0 && t < G1) bw = full * (1 + 0.025 * Math.sin(tg * 5.3) + 0.04 * f.pu);
        else if (t >= G1) { const u = cl((t - G1) / FOLD); bw = lerp(full, thin, H.ease.in(sstep(0, 0.55, u))); yb = lerp(Y, top, H.ease.in(sstep(0.4, 1, u))); a = 1 - sstep(0.6, 1, u); }
        const pX = H.sx(me.x), pY = H.sy(me.y) - T * 0.46;
        const nearK = (px, py) => 1 - 0.65 * (1 - sstep(T * 0.5, T * 1.3, Math.hypot(px - pX, (py - pY) * 1.3)));
        c.save(); c.globalCompositeOperation = 'lighter';
        if (bw > 0 && yb > top + 1 && a > 0.01) {
          // the pet's cut-out: how much of a slice at height y to keep for a layer centred on the beam, w wide
          const ov = w => 0.85 * (1 - sstep(0.55, 1, Math.abs(pX - X) / (w / 2 + T * 0.45)));
          const keep = (y, o) => 1 - o * (1 - sstep(T * 0.5, T * 1.15, Math.abs(y - pY)));
          const col = (img, w, al) => { if (!(al > 0.005) || w < 0.5) return; const o = ov(w), y0 = top, y1 = yb;
            if (o < 0.01 || pY + T * 1.2 < y0 || pY - T * 1.2 > y1) { c.globalAlpha = Math.min(1, al); c.drawImage(img, X - w / 2, y0, w, y1 - y0); return; }
            const c0 = Math.max(y0, pY - T * 1.2), c1 = Math.min(y1, pY + T * 1.2);
            if (c0 > y0) { c.globalAlpha = Math.min(1, al); c.drawImage(img, X - w / 2, y0, w, c0 - y0); }
            const NS = 14, hh = (c1 - c0) / NS; for (let i = 0; i < NS; i++) { const yy = c0 + i * hh; c.globalAlpha = Math.min(1, al * keep(yy + hh / 2, o)); c.drawImage(img, X - w / 2, yy, w, hh); }
            if (c1 < y1) { c.globalAlpha = Math.min(1, al); c.drawImage(img, X - w / 2, c1, w, y1 - c1); } };
          const pu = f.pu, wk = bw / full;
          col(colSpr(0), bw * (L === 3 ? 1.9 : 1.75), a * 0.5);
          col(colSpr(1), bw, a * (0.72 + 0.1 * pu));
          if (L === 3) col(colSpr(1), bw * 0.62, a * 0.35);
          col(colSpr(2), Math.max(bw * (L === 3 ? 0.44 : 0.38), thin * 0.8), a * (0.85 + 0.15 * pu));
          // the inner currents: tiles scrolling down, layered at Adept and Celestial
          if (wk > 0.35) { const ca = a * sstep(0.35, 0.8, wk), lay = [[0, 0.7, 2.6, 0.55]]; if (L >= 2) lay.push([1, 0.46, 3.8, 0.5]); if (L >= 3) lay.push([2, 0.92, 1.8, 0.3]);
            c.save(); c.beginPath(); c.rect(X - bw, top, bw * 2, yb - top); c.clip();
            for (const [k, wf, spd, al] of lay) { const w = bw * wf, th = w * 2, off = ((t * spd * T) % th + th) % th, img = curSpr(k), o = ov(w);
              for (let y = top - th + off; y < yb; y += th) { c.globalAlpha = Math.min(1, ca * al * (o > 0.01 ? keep(y + th / 2, o) : 1)); c.drawImage(img, X - w / 2, y, w, th); } }
            c.restore(); }
          // fine strands streaming down through the column
          if (wk > 0.3) { const NS = H.n(NST), span = yb - top; for (let i = 0; i < NS; i++) { const sx = (R1(i * 5.3 + 2) * 2 - 1) * 0.8, sp = (5 + 4 * R1(i * 2.9)) * T, sl = T * (1.4 + 1.4 * R1(i * 8.1)), sw = T * (L === 3 && i % 2 ? 0.1 : 0.16), yy = top + ((R1(i * 1.7) * (span + sl) + t * sp) % (span + sl)) - sl / 2;
              const px = X + sx * bw / 2, al = a * sstep(0.3, 0.7, wk) * 0.6 * (1 - sstep(span - sl, span, yy - top)) * (Math.abs(px - pX) < T * 0.9 ? keep(yy, 0.85) : 1); if (al < 0.02) continue;
              c.globalAlpha = al; c.drawImage(streakSpr(i % 3 ? BLUSH : CANDY), px - sw / 2, yy - sl / 2, sw, sl); } }
          // the brilliant rim at the contact point, with glints running round it; Celestial adds a broad outer ring
          if (yb >= Y - 1) { const r = Math.max(bw * 0.58, thin * 2), k = nearK(X, Y);
            c.save(); c.translate(X, Y); c.scale(1, H.GY); c.globalAlpha = Math.min(1, a * k * (0.9 + 0.1 * f.pu)); c.drawImage(rimSpr(), -r, -r, r * 2, r * 2);
            if (L === 3) { const r2 = r * 1.45; c.globalAlpha = a * k * 0.4; c.drawImage(rimSpr(), -r2, -r2, r2 * 2, r2 * 2); }
            c.restore();
            const NG = 2 + L; for (let i = 0; i < NG; i++) { const b = t * (1.8 + 0.3 * (i % 2)) * (i % 2 ? -1 : 1) + i / NG * TAU, gx = X + Math.cos(b) * r * 0.86, gy = Y + Math.sin(b) * r * 0.86 * H.GY; gl(c, PEARL, gx, gy, T * 0.28, a * k * 0.75); }
            gl(c, PEARL, X, Y - T * 0.05, bw * 0.3, a * k * (0.3 + 0.2 * f.pu), H.GY); }
        } else if (t < M0) { // the mark's own glint before the line falls
          gl(c, PEARL, X, Y, R * T * 0.4 * cl(t / M0), 0.5 * cl(t / M0) * nearK(X, Y), H.GY); }
        // the hearts and stars rising from the trail
        for (const b of B) { const u = b.t / b.life, al = Math.min(1, u * 6) * (1 - u) * (1 - u * 0.3); if (al < 0.02) continue; const bx = H.sx(b.x), by = H.sy(b.y) - b.z * T, r = b.s * T * (b.kind === 'h' ? 1.6 : 1.3), k = al * nearK(bx, by); if (k < 0.02) continue;
          if (b.kind === 'h') { const cs = Math.cos(t * b.sp + b.ph), ws = 0.25 + 0.75 * Math.abs(cs), dep = r * 0.16 * Math.sin(t * b.sp + b.ph); c.globalCompositeOperation = 'source-over'; c.globalAlpha = k;
            c.drawImage(miniSide(), bx - r * ws + dep, by - r, r * 2 * ws, r * 2); c.drawImage(miniHeart(b.col), bx - r * ws, by - r, r * 2 * ws, r * 2); }
          else { c.globalCompositeOperation = 'lighter'; c.globalAlpha = k; c.save(); c.translate(bx, by); c.rotate(t * 1.5 + b.ph); c.drawImage(starSpr(b.col), -r, -r, r * 2, r * 2); c.restore(); } }
        c.restore();
      } });
  };
})();
