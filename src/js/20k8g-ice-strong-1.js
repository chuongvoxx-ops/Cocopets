/* ---------- Ice, reworked: Rimecoil, Thousand-Wing Snowfall, Heart of Absolute Winter, Crystal Antler, Glacier Skate ----------
   Translucent blue ice with brilliant cyan edges, glowing internal fractures, refracted lavender light, swirling snow and
   glittering fragments (the ice kit IK). Every repeated shape (moth wings, the great wings, the heart's halves, the skate
   blade, the snow column) is drawn once into a cached sprite and blitted; shards go through the kit's cached shard sprite
   at a few canonical sizes. Floors only ever take light and frost that fade out.
   Evolution (C.evo 1 Hatchling .. 4 Adept .. 7 Celestial; stages 1-3 / 4-6 / 7 unless said):
     Rimecoil        the kept look, scaled smoothly 1x -> 3x (size, reach, slow, damage ~3.4x at Celestial)
     Snowfall        6 / 10 / 16 crystal moths in 2 / 3 / 3 waves; Adept: the great wings close once; Celestial: twice, the second bigger
     Absolute Winter 2 / 3 / 5 heartbeats, each ring wider than the last, then the heart opens on its core and the final wave
     Crystal Antler  3 / 5 antlers (Adept: forked tines); Celestial: a row of five, a fan of three larger, then one great antler
     Glacier Skate   1 / 2 weaving / 5 blades (Celestial: two, two larger, then one great blade with a towering fan)
   Anything tall standing in front of the pet leaves a pet-shaped hole so the pet always shows. */
(() => {
  const S = ELEM_IMPL.ice.strong, TAU = Math.PI * 2;
  let H, K, P;
  const bind = h => { H = h; K = IK.bind(h); P = K.P; return K; };
  const cl = u => Math.max(0, Math.min(1, u));
  const hexC = h => hexRGB(h);
  const mixC = (a, b, k, al) => { const p = hexC(a), q = hexC(b); return `rgba(${Math.round(p[0] + (q[0] - p[0]) * k)},${Math.round(p[1] + (q[1] - p[1]) * k)},${Math.round(p[2] + (q[2] - p[2]) * k)},${al == null ? 1 : al})`; };
  const rgbaS = (h, a) => { const p = hexC(h); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; };
  const lvl = C => { const e = K.evo(C); return e >= 7 ? 2 : e >= 4 ? 1 : 0; };
  const bonus = C => [1, 1.07, 1.15][lvl(C)];

  /* ---------- the pet always shows: draw fn with a pet-shaped hole when the screen box (x0, y0)-(x1, y1) overlaps it ---------- */
  function aroundPet(c, x0, y0, x1, y1, fn) {
    const me = H.me, T = H.X.Tz(), px = H.sx(me.x), py = H.sy(me.y), rx = T * 0.62, top = py - T * 1.25, bot = py + T * 0.2;
    if (x1 < px - rx || x0 > px + rx || y1 < top || y0 > bot) { fn(); return; }
    c.save(); c.beginPath(); c.rect(px - 1e4, py - 1e4, 2e4, 2e4); c.ellipse(px, py - T * 0.5, rx, T * 0.78, 0, 0, TAU); c.clip('evenodd'); fn(); c.restore();
  }

  /* ---------- shards at a few canonical sprite sizes (the kit caches by size; this keeps the cache small) ---------- */
  function shardQ(c, x, y, w, h, ang, s, a, t) {
    if (!(a > 0.01) || h < 2) return; const bw = w < 8 ? 6 : w < 16 ? 12 : w < 32 ? 24 : 42, asp = h / w, ba = asp < 2.5 ? 2 : asp < 3.5 ? 3 : asp < 5 ? 4 : 6, k = w / bw, hk = h / (bw * ba);
    c.save(); c.translate(x, y); c.rotate((ang == null ? -Math.PI / 2 : ang) + Math.PI / 2); c.scale(k, k * hk); K.shard(c, 0, 0, bw, bw * ba, -Math.PI / 2, (s | 0) & 3, a, t); c.restore();
  }
  /* a burst of real faceted shards flying from (x, y) at height z (world), tumbling and falling; o: n, v, up, ang, spread, w, h (tiles), life */
  function shardBurst(x, y, z, o) {
    const pcs = [], n = H.n(o.n || 8), life = o.life || 0.6;
    for (let i = 0; i < n; i++) { const b = o.ang == null ? Math.random() * TAU : o.ang + (Math.random() - 0.5) * (o.spread || 1), v = (o.v || 4) * (0.5 + Math.random() * 0.7);
      pcs.push({ x, y, z: z + (Math.random() - 0.5) * (o.zr || 0), vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: (o.up == null ? 2 : o.up) * (0.4 + Math.random()), r: o.ang == null ? Math.random() * TAU : b - Math.PI / 2 * 0 + (Math.random() - 0.5), vr: (Math.random() - 0.5) * (o.spin || 10), w: (o.w || 0.12) * (0.7 + Math.random() * 0.6), h: (o.h || 0.36) * (0.7 + Math.random() * 0.6), s: i }); }
    H.add({ life, update(dt) { for (const p of pcs) { p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= (o.g == null ? 9 : o.g) * dt; p.z = Math.max(0, p.z + p.vz * dt); p.r += p.vr * dt; p.vx *= 0.985; p.vy *= 0.985; } },
      draw(c, f, X, Y, T) { const k = cl(f.life / (life * 0.6)); for (const p of pcs) { const sx = H.sx(p.x), sy = H.sy(p.y) - p.z * T; shardQ(c, sx, sy, p.w * T, p.h * T, p.r, p.s, 0.92 * k); } } });
  }
  /* floor rings of ice that spread and fade (light only): call from drawUnder with a list of { x, y, t0, r, dur, w } */
  function floorRings(c, list, ft, T, t) { for (const r of list) { const u = (ft - r.t0) / r.dur; if (u <= 0 || u >= 1) continue; const e = H.ease.out(u), X = H.sx(r.x), Y = H.sy(r.y); K.iceRing(c, X, Y, T * r.r * e, (1 - u) * (r.a || 1), null, t, Math.max(2, T * (r.w || 0.1) * (1 - u * 0.5))); K.floorLight(c, X, Y, T * r.r * (0.6 + 0.6 * e), 0.5 * (1 - u), P.cyan); } }

  /* ---------- cached sprites ---------- */
  const SPR = {};
  function sprite(key, w, h, fn) { if (SPR[key]) return SPR[key]; const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); fn(c, w, h); SPR[key] = cv; return cv; }
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  /* a faceted translucent panel: pts split by the ridge (first point to the ridge point) into a lit and a shaded facet */
  function facetPanel(c, pts, ridge, litA, darkA, s, light) {
    // lit facet: from pts[0] round to the ridge point; shaded facet: the rest
    const A = pts.slice(0, ridge + 1), B = [pts[0]].concat(pts.slice(ridge));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    let g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgbaS(P.white, litA)); g.addColorStop(0.45, rgbaS(P.pale, litA * 0.85)); g.addColorStop(1, rgbaS(P.ice, litA * 0.75)); poly(c, A); c.fillStyle = g; c.fill();
    g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgbaS(light ? P.pale : P.ice, darkA)); g.addColorStop(0.6, rgbaS(light ? P.ice : P.blue, darkA)); g.addColorStop(1, rgbaS(light ? P.blue : P.deep, darkA)); poly(c, B); c.fillStyle = g; c.fill();
    // glowing internal fractures
    c.save(); poly(c, pts); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(P.cyan, 0.7); c.lineWidth = 1.1; c.lineCap = 'round';
    const pr = pts[ridge]; for (let i = 0; i < 3; i++) { const u = 0.3 + i * 0.22 + K.R1(s + i) * 0.08, mx = pts[0][0] + (pr[0] - pts[0][0]) * u, my = pts[0][1] + (pr[1] - pts[0][1]) * u; c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + 6 + K.R1(s * 2 + i) * 6, my + 7); c.lineTo(mx + 3, my + 13 + K.R1(i + s) * 5); c.moveTo(mx, my); c.lineTo(mx - 6, my - 5 - K.R1(i * 3 + s) * 4); c.stroke(); }
    // a lavender refraction near the tip
    const lg = c.createRadialGradient(pr[0] * 0.8 + pts[0][0] * 0.2, pr[1] * 0.8 + pts[0][1] * 0.2, 0, pr[0] * 0.8 + pts[0][0] * 0.2, pr[1] * 0.8 + pts[0][1] * 0.2, Math.max(x1 - x0, y1 - y0) * 0.35); lg.addColorStop(0, rgbaS(P.lav, 0.45)); lg.addColorStop(1, rgbaS(P.lav, 0)); c.fillStyle = lg; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore();
    // ridge, cyan rim, a thin deep outline on the shaded side
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = rgbaS(P.white, 0.95); c.lineWidth = 1.6; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pr[0], pr[1]); c.stroke();
    c.strokeStyle = rgbaS(P.cyan, 0.95); c.lineWidth = 1.4; poly(c, pts); c.stroke();
    c.strokeStyle = rgbaS(P.abyss, 0.45); c.lineWidth = 0.8; c.beginPath(); B.slice(1).forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
  }
  /* one moth wing (the right side; the body at (8, 60) of 120 x 120): a long forewing and a rounder hindwing */
  function mothWing() { return sprite('mwing', 120, 120, c => { c.translate(8, 60);
    facetPanel(c, [[0, 4], [8, 24], [36, 42], [62, 34], [58, 10]], 3, 0.7, 0.5, 3, true);
    facetPanel(c, [[0, 2], [2, -10], [36, -36], [92, -40], [110, -22], [72, 0]], 3, 0.85, 0.55, 1, true);
  }); }
  /* one great ice wing for the Snowfall climax (the hinge at (12, 150) of 300 x 260): three long plumes fanned up and out */
  function greatWing() { return sprite('gwing', 300, 260, c => { c.translate(12, 150);
    const plume = (ang, L, W, s) => { const ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca; const p = (u, v) => [ca * L * u + nx * W * v, sa * L * u + ny * W * v];
      facetPanel(c, [[0, 0], p(0.4, -0.55), p(0.78, -0.5), p(1, 0), p(0.7, 0.55), p(0.3, 0.45)], 3, 0.8, 0.62, s); };
    plume(0.5, 120, 36, 4); plume(0.22, 170, 40, 5); plume(-0.72, 190, 50, 1); plume(-0.46, 245, 52, 2); plume(-0.22, 275, 50, 3); plume(0.0, 225, 46, 0);
  }); }
  /* the heart of absolute winter: two faceted halves (220 x 220 each, centre at (110, 104)), shaded from 3D facet normals */
  function heartHalf(side) { return sprite('heart' + side, 220, 220, c => { c.translate(110, 104);
    const V = { D: [0, -42, 18], A: [40, -92, 0], B: [82, -78, 0], Cc: [100, -36, 0], Dd: [78, 22, 0], Bot: [0, 100, 0], F: [44, -34, 46], G: [34, 34, 36], M: [0, 12, 52] };
    const tris = [['D', 'A', 'F'], ['A', 'B', 'F'], ['B', 'Cc', 'F'], ['Cc', 'Dd', 'F'], ['F', 'Dd', 'G'], ['Dd', 'Bot', 'G'], ['G', 'Bot', 'M'], ['F', 'G', 'M'], ['D', 'F', 'M']];
    const L = [-0.45, -0.7, 0.55], ln = Math.hypot(L[0], L[1], L[2]); const v3 = k => { const q = V[k]; return [q[0] * side, q[1], q[2]]; };
    for (const tr of tris) { const [a, b, d] = tr.map(v3), u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]]; let n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]; if (n[2] < 0) n = n.map(q => -q); const nl = Math.hypot(n[0], n[1], n[2]) || 1, lit = cl(0.15 + 1.1 * (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / (nl * ln));
      const pts = [a, b, d].map(q => [q[0], q[1]]), g = c.createLinearGradient(pts[0][0], pts[0][1], (pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2);
      g.addColorStop(0, mixC(P.blue, P.white, lit, 0.5 + 0.3 * lit)); g.addColorStop(1, mixC(P.deep, P.pale, lit, 0.45 + 0.25 * lit)); poly(c, pts); c.fillStyle = g; c.fill();
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(P.frost, 0.25 + 0.4 * lit); c.lineWidth = 1.2; c.stroke(); c.restore(); }
    // glowing fractures inside and the cyan rim round the outline
    c.save(); poly(c, ['D', 'A', 'B', 'Cc', 'Dd', 'Bot', 'M'].map(k => [V[k][0] * side, V[k][1]])); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(P.cyan, 0.75); c.lineWidth = 1.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(side * 8, -20); c.lineTo(side * 30, -6); c.lineTo(side * 26, 18); c.lineTo(side * 48, 40); c.moveTo(side * 30, -6); c.lineTo(side * 62, -16); c.lineTo(side * 74, -48); c.moveTo(side * 26, 18); c.lineTo(side * 10, 50); c.stroke();
    const lg = c.createRadialGradient(side * 60, -64, 0, side * 60, -64, 40); lg.addColorStop(0, rgbaS(P.lav, side < 0 ? 0.5 : 0.3)); lg.addColorStop(1, rgbaS(P.lav, 0)); c.fillStyle = lg; c.fillRect(-110, -110, 220, 220); c.restore();
    c.lineJoin = 'round'; c.strokeStyle = rgbaS(P.cyan, 0.95); c.lineWidth = 2.2; c.beginPath(); ['D', 'A', 'B', 'Cc', 'Dd', 'Bot'].forEach((k, i) => (i ? c.lineTo(V[k][0] * side, V[k][1]) : c.moveTo(V[k][0] * side, V[k][1]))); c.stroke();
    c.strokeStyle = rgbaS(P.white, 0.9); c.lineWidth = 1.2; c.beginPath(); c.moveTo(V.A[0] * side, V.A[1]); c.lineTo(V.F[0] * side, V.F[1]); c.lineTo(V.G[0] * side, V.G[1]); c.stroke();
  }); }
  /* the skate blade, lying along +x (centre (100, 36) of 200 x 72): faceted edges powdered white, a glass-clear middle */
  function bladeSprite() { return sprite('blade', 200, 72, c => { c.translate(100, 36);
    const top = [[-92, 0], [-50, -18], [30, -20], [70, -12], [96, 0]], bot = [[96, 0], [70, 12], [30, 20], [-50, 18], [-92, 0]];
    let g = c.createLinearGradient(0, -20, 0, 0); g.addColorStop(0, rgbaS(P.white, 0.95)); g.addColorStop(0.5, rgbaS(P.pale, 0.8)); g.addColorStop(1, rgbaS(P.ice, 0.55)); poly(c, top); c.fillStyle = g; c.fill();
    g = c.createLinearGradient(0, 0, 0, 20); g.addColorStop(0, rgbaS(P.ice, 0.55)); g.addColorStop(0.5, rgbaS(P.blue, 0.75)); g.addColorStop(1, rgbaS(P.deep, 0.85)); poly(c, bot); c.fillStyle = g; c.fill();
    // a glass-clear middle: cut a soft lens out of the body
    c.save(); c.globalCompositeOperation = 'destination-out'; c.scale(1, 0.22); const cg = c.createRadialGradient(0, 0, 0, 0, 0, 70); cg.addColorStop(0, 'rgba(0,0,0,0.75)'); cg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = cg; c.beginPath(); c.arc(0, 0, 70, 0, TAU); c.fill(); c.restore();
    c.save(); poly(c, top.concat(bot)); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(P.cyan, 0.7); c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i < 5; i++) { const x = -60 + i * 30; c.moveTo(x, -10); c.lineTo(x + 12, -2); c.lineTo(x + 6, 9); } c.stroke();
    const lg = c.createRadialGradient(60, -6, 0, 60, -6, 26); lg.addColorStop(0, rgbaS(P.lav, 0.5)); lg.addColorStop(1, rgbaS(P.lav, 0)); c.fillStyle = lg; c.fillRect(20, -30, 80, 60); c.restore();
    c.lineJoin = 'round'; c.strokeStyle = rgbaS(P.cyan, 0.95); c.lineWidth = 1.6; poly(c, top.concat(bot)); c.stroke(); c.strokeStyle = rgbaS(P.white, 0.95); c.lineWidth = 1.6; c.beginPath(); c.moveTo(-92, 0); c.lineTo(96, 0); c.stroke();
    // powder along both edges
    c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 26; i++) { const u = i / 25, x = -80 + u * 160, e = 17 * Math.sin(Math.PI * (0.1 + 0.85 * u)); for (const s of [-1, 1]) { c.beginPath(); c.arc(x + K.R1(i * s) * 4, s * (e + K.R1(i + 7 * s) * 3), 1 + K.R1(i * 5 + s), 0, TAU); c.fill(); } }
  }); }
  /* a column of snow light (64 x 256): bright in the middle, soft at the edges, fading out toward the top */
  function columnSprite() { return sprite('column', 64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(191,239,255,0)'); g.addColorStop(0.3, 'rgba(191,239,255,0.45)'); g.addColorStop(0.5, 'rgba(255,255,255,0.95)'); g.addColorStop(0.7, 'rgba(191,239,255,0.45)'); g.addColorStop(1, 'rgba(191,239,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'destination-in'; const v = c.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.35, 'rgba(0,0,0,0.7)'); v.addColorStop(0.9, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = v; c.fillRect(0, 0, w, h);
  }); }

  /* ============ I-S06 Rimecoil (kept: the user's favourite) ============
     At Hatchling exactly the old look: a frost ribbon winds up the target from the ground, seven crystal plates grow along
     its spiral (slowing it), then snap outward in a tight burst. With evolution the whole coil grows smoothly to 3x (at
     Celestial): 3x as tall and wide, a 3x wider frost bloom, slowing everything inside it, a 3x wider burst and ~3.4x the
     damage. A coil that would wrap the pet is moved off it along the aim. */
  const ICE = '#9FE0F8', ICE_L = '#DDF6FF', WHITE = '#FFFFFF', ICE_D = '#2F80B7', ICE_DD = '#1B4F7A';
  const frostCache = new Map();
  function frostSprite(r, seed, arms) { const key = r + '|' + seed + '|' + arms; let cv = frostCache.get(key); if (cv) return cv; if (frostCache.size > 48) frostCache.clear(); cv = document.createElement('canvas'); const Sz = Math.ceil(r * 2 + 6); cv.width = Sz; cv.height = Sz; const c = cv.getContext('2d'); c.translate(Sz / 2, Sz / 2); c.lineCap = 'round'; for (let i = 0; i < arms; i++) { const a = i / arms * TAU + seed, L = r * (0.75 + 0.25 * Math.sin(seed * 3 + i * 2.1)); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.stroke(); for (let k = 1; k <= 2; k++) { const u = k / 3, bx = Math.cos(a) * L * u, by = Math.sin(a) * L * u, tl = L * 0.28 * (1 - u * 0.4); c.lineWidth = 1; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(a + s * 0.7) * tl, by + Math.sin(a + s * 0.7) * tl); c.stroke(); } } } frostCache.set(key, cv); return cv; }
  function frost(c, x, y, r, u, seed, alpha, arms) { if (u <= 0 || r < 2) return; const rr = Math.max(8, Math.round(r / 8) * 8), sd = Math.round((seed || 0) * 4) / 4, cv = frostSprite(rr, sd, arms || 6), Sz = cv.width, k = u * r / rr; c.save(); c.globalAlpha *= Math.max(0, Math.min(1, alpha)); c.translate(x, y); c.scale(k, k * H.GY); c.drawImage(cv, -Sz / 2, -Sz / 2); c.restore(); }
  const glint = (x, y, k, z) => { for (let i = 0; i < H.n(k); i++) H.P({ kind: 'star', x: x + (Math.random() - 0.5) * 0.8, y: y - (z || 0.5) + (Math.random() - 0.5) * 0.6, vx: 0, vy: -0.3, life: 0.5 + Math.random() * 0.4, max: 0.9, size: 2 + Math.random() * 2, color: i % 2 ? WHITE : ICE_L }); };
  const crackle = (x, y, r) => { H.X.light(x, y, r * 1.5, 0.25); H.X.sfx.crack ? H.X.sfx.crack() : H.X.sfx.crash(); };
  S.rimecoil = (C, h) => { bind(h); const E = K.evo(C), s = 1 + 2 * (E - 1) / 6, me = H.me;
    const near = H.sortNear(C.tx, C.ty)[0], tgt = near && Math.hypot(near.x - C.tx, near.y - C.ty) < 2.5 * Math.max(1, s * 0.7) ? near : null, WIND = 0.85, SNAP = 1.0;
    // a coil that would wrap the pet is moved off it, away from the pet (only once it has grown past its Hatchling size)
    const p0 = tgt ? [tgt.x, tgt.y] : [C.tx, C.ty]; let ox = 0, oy = 0; { const need = s > 1 ? 0.62 * s * 1.15 + 0.75 : 0, dx = p0[0] - me.x, dy = p0[1] - me.y, d = Math.hypot(dx, dy); if (d < need) { const ux = d > 0.05 ? dx / d : Math.cos(C.a), uy = d > 0.05 ? dy / d : Math.sin(C.a); ox = ux * (need - d); oy = uy * (need - d); } }
    const at = () => (tgt && !tgt.dead ? [tgt.x + ox, tgt.y + oy] : [p0[0] + ox, p0[1] + oy]); H.X.sfx.hum(); if (!tgt) H.warn(p0[0] + ox, p0[1] + oy, 1.2 * s, SNAP, C.col);
    const dmg = C.base * 2.5 * C.K * K.evoK(C) * bonus(C) * (1 + (s - 1) * 0.5);
    H.add({ life: SNAP + 0.4, drawUnder(c, f, X, Y, T) { const [x, y] = at(); frost(c, H.sx(x), H.sy(y), T * 0.9 * s, Math.min(1, f.t / WIND), 0.6, 0.7 * Math.min(1, f.life / 0.3), 6); },
      update(dt, f) { const [x, y] = at(); if (f.t > 0.15 && f.t < SNAP) { if (tgt && !tgt.dead) H.slow(tgt, 0.4); if (s > 1.05) for (const m of H.near(x, y, 0.62 * s)) H.slow(m, 0.4); }
        if (f.t < SNAP) { const k = 0.6 * H.Q() * s; let n = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (n-- > 0) { const u = Math.min(1, f.t / WIND), b = u * TAU * 2.5 + Math.random() * 0.4; H.P({ kind: 'snow', x: x + Math.cos(b) * 0.55 * s, y: y + Math.sin(b) * 0.3 * s - u * 1.5 * s, vx: -Math.sin(b) * 0.8 * s, vy: Math.cos(b) * 0.4 * s - 0.3, life: 0.4, max: 0.4, size: 1.5 * Math.sqrt(s) }); } } },
      draw(c, f, X, Y, T) { if (f.t > SNAP) return; const [x, y] = at(), cx = H.sx(x), cy = H.sy(y), u = Math.min(1, f.t / WIND), TURNS = 2.5, Hh = T * 1.7 * s, pts = []; for (let i = 0; i <= 40; i++) { const v = i / 40 * u, b = v * TAU * TURNS - Math.PI / 2, r = T * s * (0.62 - v * 0.15); pts.push([cx + Math.cos(b) * r, cy - v * Hh + Math.sin(b) * r * 0.35, Math.sin(b)]); }
        aroundPet(c, cx - T * s * 0.9, cy - Hh - T * 0.4 * s, cx + T * s * 0.9, cy + T * 0.3 * s, () => {
          // the ribbon behind the target first, then the plates and the front half, so it reads as wrapping
          const draw = (list, lit) => { if (list.length > 1) H.ribbon(c, list, T * 0.14 * s, H.rgba(lit ? ICE_L : ICE_D, 0.85), lit ? WHITE : ICE, undefined); }; let seg = []; for (const p of pts) { if (p[2] < 0) seg.push(p); else { draw(seg, false); seg = []; } } draw(seg, false);
          const np = Math.floor(u * 7); for (let i = 0; i < np; i++) { const v = (i + 0.5) / 7, b = v * TAU * TURNS - Math.PI / 2, r = T * s * (0.62 - v * 0.15), g = Math.min(1, (u * 7 - i) / 1.5); H.crystal(c, cx + Math.cos(b) * r * 1.15, cy - v * Hh + Math.sin(b) * r * 0.35, T * 0.16 * g * s, T * 0.42 * g * s, b + Math.PI / 2 + 0.3, i % 2 ? ICE : ICE_L, WHITE); }
          seg = []; for (const p of pts) { if (p[2] >= 0) seg.push(p); else { draw(seg, true); seg = []; } } draw(seg, true); if (f.t > WIND) H.glow(c, cx, cy - Hh * 0.5, T * 1.1 * s, WHITE, 0.3 * Math.min(1, (f.t - WIND) / 0.15)); }); } });
    H.X.after(SNAP, () => { const [x, y] = at(); H.hitArea(x, y, 1.25 * s, dmg, C.dmgO({ kb: 3 + s, freeze: 0.8 })); const n = Math.round(10 * Math.sqrt(s) * 1.2) - 2; for (let i = 0; i < H.n(n); i++) { const b = i / n * TAU; H.P({ kind: 'shard', x: x + Math.cos(b) * 0.4 * s, y: y - 0.3 * s - (i % 3) * 0.5 * s, vx: Math.cos(b) * 7 * Math.sqrt(s), vy: Math.sin(b) * 3.5 * Math.sqrt(s) - 1.5, g: 10, life: 0.55 * Math.sqrt(s), max: 0.55 * Math.sqrt(s), size: 4.5 * Math.sqrt(s), rot: b, vr: 6, color: i % 2 ? ICE : ICE_L }); }
      glint(x, y, Math.round(6 * s), 1 * s); H.X.ring(x, y, 0.2, 1.25 * s, 0.35, ICE_L, 0.4); if (s > 1.3) H.X.ring(x, y, 0.2, 0.8 * s, 0.3, WHITE, 0.3); crackle(x, y, 1.2 * s); H.X.shake(4 * Math.sqrt(s), 0.1); H.X.hitstop(0.03); }); };

  /* ============ I-S09 Thousand-Wing Snowfall ============
     A column of snow rises at the aim and crystal moths climb out of it to orbit at many heights, their faceted translucent
     wings beating and shedding powder; they dive in grouped waves, each folding into a narrow shard before it strikes.
     Adept: the rest of the flock forms one great pair of ice wings that closes over the zone and shatters. Celestial: three
     larger waves, then the wings close twice, the second pair bigger. */
  S.snowfall = (C, h) => { bind(h); const L = lvl(C), x = C.tx, y = C.ty, me = H.me;
    const WAVES = [[3, 3], [3, 3, 4], [4, 5, 7]][L], NM = WAVES.reduce((a, b) => a + b, 0), R = [1.8, 2.1, 2.5][L], MS = [1, 1.08, 1.15][L];
    const WT = [[0.78, 1.1], [0.72, 0.98, 1.24], [0.68, 0.92, 1.16]][L], DIVE = 0.3, CLIMAX = [[], [[1.35, 1.0]], [[1.32, 0.85], [1.84, 1.25]]][L];
    const END = CLIMAX.length ? CLIMAX[CLIMAX.length - 1][0] + 0.55 : WT[WT.length - 1] + DIVE + 0.1, LIFE = END + 0.6;
    const tot = C.base * 2.6 * C.K * K.evoK(C) * bonus(C), mothK = L === 0 ? 1 : L === 1 ? 0.62 : 0.5, perMoth = tot * mothK * 2.2 / NM, wingK = L === 1 ? [0.38] : [0.2, 0.3];
    const moths = []; for (let i = 0; i < NM; i++) moths.push({ i, b: i * 2.39996, r: (0.5 + (i % 4) * 0.34) * (0.95 + 0.08 * L), z: 1.15 + (i % 5) * 0.3 + K.R1(i) * 0.2, w: (1.7 + (i % 3) * 0.45) * (i % 2 ? 1 : -1), ph: i * 1.7, te: 0.1 + i * 0.42 / NM, dive: null, gone: false });
    const rings = [], hits = []; H.warn(x, y, R, WT[0] + DIVE, C.col); H.X.sfx.hum(); H.X.sfx.whoosh();
    const posOf = (m, ft) => { const u = cl((ft - m.te) / 0.35), e = H.ease.out(u), b = m.b + m.w * ft; return [x + Math.cos(b) * m.r * e, y + Math.sin(b) * m.r * 0.6 * e, 0.3 + (m.z - 0.3) * e + Math.sin(ft * 4 + m.ph) * 0.08]; };
    // the waves: each moth picks an enemy in the zone (spread over them), or a point on the zone
    let wi0 = 0; WAVES.forEach((nw, w) => { const ids = []; for (let j = 0; j < nw; j++) ids.push(wi0 + j); wi0 += nw;
      H.X.after(WT[w], () => { const tg = H.sortNear(x, y).filter(m => Math.hypot(m.x - x, m.y - y) < R + 0.4); H.X.sfx.whoosh();
        ids.forEach((id, j) => { const m = moths[id], t = tg.length ? tg[(j + w) % tg.length] : null, b = j / nw * TAU + w * 0.9, rr = (0.5 + 0.35 * w) * R / 2; const px = t ? t.x + (Math.random() - 0.5) * 0.3 : x + Math.cos(b) * rr, py = t ? t.y + (Math.random() - 0.5) * 0.3 : y + Math.sin(b) * rr * 0.8;
          const d0 = j * 0.045; H.X.after(d0, () => { m.dive = { t0: F.t, from: posOf(m, F.t), x: px, y: py }; });
          H.X.after(d0 + DIVE, () => { m.gone = true; H.hitArea(px, py, 0.7, perMoth, C.dmgO({ kb: 1.5, chill: true })); rings.push({ x: px, y: py, t0: F.t, r: 0.85, dur: 0.45, w: 0.07 }); hits.push({ x: px, y: py, t0: F.t });
            shardBurst(px, py, 0.35, { n: 5, v: 3.2, up: 2.5, w: 0.09, h: 0.3, life: 0.5 }); K.glitter(px, py - 0.3, 5, 4); K.snow(px, py - 0.3, 3); H.glowAt(px, py - 0.2, 0.9, 0.22, P.cyan, 0.55); if (j === 0) { H.X.sfx.crack(); H.X.shake(2 + w, 0.08); } }); }); }); });
    // the climaxes: the great wings form above the zone, close over it and shatter
    CLIMAX.forEach(([tc, sc], ci) => H.X.after(tc + 0.38, () => { const rr = R * sc; H.hitArea(x, y, rr, tot * wingK[ci], C.dmgO({ kb: 3 + ci * 2, freeze: 0.6 + 0.3 * ci })); rings.push({ x, y, t0: F.t, r: rr * 1.1, dur: 0.6, w: 0.14 }, { x, y, t0: F.t + 0.08, r: rr * 0.7, dur: 0.5, w: 0.1 });
      shardBurst(x, y, 1.4 * sc, { n: 14 + ci * 8, v: 4.5 * sc, up: 2, w: 0.14 * sc, h: 0.45 * sc, life: 0.75, zr: 0.6 }); K.shatterAt(x, y - 0.4, rr * 0.8); K.snow(x, y - 1.2, 10 + ci * 6, { v: 2.2 }); K.glitter(x, y - 0.8, 12 + ci * 6, 6);
      H.X.light(x, y, rr * 1.8, 0.35); H.X.ring(x, y, 0.3, rr, 0.4, P.frost, 0.45); H.X.flash(0.12 + 0.08 * ci, P.frost); H.X.shake(5 + ci * 3, 0.15); H.X.hitstop(0.04 + 0.02 * ci); H.X.sfx.crash(); }));
    const F = H.add({ life: LIFE, x, y,
      update(dt, f) { if (f.t < 0.55) { const k = 26 * dt * H.Q(); let n = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (n-- > 0) { const b = Math.random() * TAU, z = Math.random() * 2.6 * cl(f.t / 0.3); H.P({ kind: 'snow', x: x + Math.cos(b) * 0.3, y: y + Math.sin(b) * 0.18 - z, vx: -Math.sin(b) * 1.4, vy: -0.8 - Math.random() * 0.6, life: 0.6, max: 0.6, size: 1.6 + Math.random() * 1.4 }); } }
        for (const m of moths) if (!m.gone && !m.dive && f.t > m.te && Math.random() < 3 * dt * H.Q()) { const [mx, my, mz] = posOf(m, f.t); H.P({ kind: 'snow', x: mx, y: my - mz, vx: (Math.random() - 0.5) * 0.4, vy: 0.5, life: 0.5, max: 0.5, size: 1.4 }); }
        CLIMAX.forEach(([tc, sc]) => { if (f.t > tc - 0.12 && f.t < tc + 0.2) K.aura(x, y, R * sc * 0.6, dt, 30, 1.6 * sc); }); },
      drawUnder(c, f, X, Y, T, t) { const k = H.fade(f, 0.25, 0.5); K.frozenPool(c, X, Y, T * R * (0.5 + 0.5 * cl(f.t / 0.6)), 0.5 * k, t); K.floorLight(c, X, Y, T * 1.2, 0.6 * cl(1 - (f.t - 0.6) / 0.4) * cl(f.t / 0.2), P.pale);
        let grown = 0; WT.forEach(tw => { if (f.t > tw + DIVE) grown += 1 / WT.length; }); K.frostVeins(c, X, Y, T * R, Math.min(1, 0.25 + grown), 0.7 * k, 1.3, 7 + L * 2);
        floorRings(c, rings, f.t, T, t); for (const p of hits) { const u = (f.t - p.t0) / 0.6; if (u > 0 && u < 1) frost(c, H.sx(p.x), H.sy(p.y), T * 0.7, H.ease.out(cl(u * 3)), p.x * 3, 0.8 * (1 - u), 6); } },
      draw(c, f, X, Y, T, t) {
        aroundPet(c, X - T * R * 1.4, Y - T * 3.4, X + T * R * 1.4, Y + T * 0.6, () => {
          // the column of snow light
          const col = cl(f.t / 0.25) * cl(1 - (f.t - 0.55) / 0.35); if (col > 0) { const cw = T * 0.8, chh = T * 3.1 * H.ease.out(cl(f.t / 0.3)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * col; c.drawImage(columnSprite(), X - cw / 2, Y - chh, cw, chh); c.restore(); K.glow(c, X, Y - chh * 0.45, T * 1.1, P.cyan, 0.4 * col); K.glow(c, X, Y, T * 0.8, P.white, 0.4 * col); }
          // moths, far ones first
          const list = []; for (const m of moths) { if (m.gone || f.t < m.te) continue; let mx, my, mz, fold = 0, dir = 0; if (m.dive) { const u = cl((f.t - m.dive.t0) / DIVE), e = H.ease.in(u), fr = m.dive.from; mx = fr[0] + (m.dive.x - fr[0]) * e; my = fr[1] + (m.dive.y - fr[1]) * e; mz = fr[2] + (0.25 - fr[2]) * e; fold = cl(u * 2.2); dir = Math.atan2(H.sy(m.dive.y) - (H.sy(fr[1]) - fr[2] * T), H.sx(m.dive.x) - H.sx(fr[0])); } else { [mx, my, mz] = posOf(m, f.t); }
            list.push({ m, mx, my, mz, fold, dir, d: my }); }
          list.sort((p, q) => p.d - q.d); const wing = mothWing(), Sm = T * 0.36 * MS / 56;
          for (const it of list) { const { m, mx, my, mz, fold, dir } = it, sx = H.sx(mx), sy = H.sy(my) - mz * T, em = cl((f.t - m.te) / 0.3);
            if (!m.dive) K.floorLight(c, sx, H.sy(my), T * 0.35, 0.25 * em, P.cyan);
            K.glow(c, sx, sy, T * (0.6 + 0.2 * fold) * MS, P.cyan, 0.4 * em); K.glow(c, sx, sy, T * 0.22 * MS, P.white, 0.55 * em);
            const beat = 0.25 + 0.75 * Math.abs(Math.cos(f.t * 13 + m.ph)), open = Math.max(0.06, beat * (1 - fold)) * em;
            if (fold < 1) { c.save(); c.globalAlpha = (1 - fold * 0.8); c.translate(sx, sy); c.rotate(Math.sin(f.t * 3 + m.ph) * 0.15); for (const sd of [-1, 1]) { c.save(); c.scale(sd * open * Sm, Sm * (0.85 + 0.15 * beat)); c.drawImage(wing, -8, -60); c.restore(); } c.restore(); }
            // the body: a narrow shard, which lengthens into the striking shard as it dives
            const bl = T * (0.26 + 0.4 * fold) * MS, bw = T * (0.07 + 0.03 * fold) * MS, ang = fold > 0 ? dir : Math.PI / 2;
            shardQ(c, sx - Math.cos(ang) * bl * 0.45, sy - Math.sin(ang) * bl * 0.45, bw, bl, ang, m.i, 0.95 * em, fold > 0 ? null : t);
            if (fold > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * fold; c.strokeStyle = P.pale; c.lineWidth = Math.max(1.5, T * 0.05); c.lineCap = 'round'; c.beginPath(); c.moveTo(sx - Math.cos(dir) * T * 0.9, sy - Math.sin(dir) * T * 0.9); c.lineTo(sx, sy); c.stroke(); c.strokeStyle = P.white; c.lineWidth = 1.2; c.stroke(); c.restore(); K.glow(c, sx + Math.cos(dir) * bl * 0.5, sy + Math.sin(dir) * bl * 0.5, T * 0.3, P.white, 0.6 * fold); } }
          // the great wings
          CLIMAX.forEach(([tc, sc]) => { const u0 = (f.t - (tc - 0.3)) / 0.3; if (u0 <= 0) return; const form = H.ease.out(cl(u0)), close = H.ease.in(cl((f.t - tc) / 0.38)), gone = cl((f.t - tc - 0.38) / 0.12); if (gone >= 1) return;
            const gw = greatWing(), Wk = T * R * sc * 1.0 / 270 * form, hz = T * (1.9 + 0.5 * sc) - close * T * 1.0; c.save(); c.globalAlpha = (1 - gone) * cl(u0 * 2); c.translate(X, Y - hz);
            for (const sd of [-1, 1]) { c.save(); c.scale(sd, 1); c.rotate(-0.18 + close * 1.05 + Math.sin(f.t * 9) * 0.06 * (1 - close)); c.scale(Wk * (1 - 0.3 * close), Wk); c.drawImage(gw, -12, -150); c.restore(); }
            c.restore(); K.glow(c, X, Y - hz, T * R * sc * 0.8, P.cyan, 0.32 * form * (1 - gone)); K.glow(c, X, Y - hz, T * 0.55 * sc, P.white, (0.45 + 0.5 * close) * (1 - gone));
            // the body between the wings: a crystal pointed both ways
            shardQ(c, X, Y - hz, T * 0.16 * sc, T * 0.55 * sc, -Math.PI / 2, 2, 0.95 * form * (1 - gone), t); shardQ(c, X, Y - hz, T * 0.14 * sc, T * 0.7 * sc, Math.PI / 2, 1, 0.9 * form * (1 - gone)); });
        });
      } });
  };

  /* ============ I-S10 Heart of Absolute Winter ============
     A faceted ice heart forms above the aim, its translucent halves lit by a core that brightens with every beat. Each beat
     sends frost veins across the ground and raises a ring of crystals, each ring wider than the last (2 / 3 / 5 beats).
     Then the heart opens along its seam, the brilliant core releases the final wave, and it all dissolves into snow. */
  S.absolutewinter = (C, h) => { bind(h); const L = lvl(C), x = C.tx, y = C.ty, me = H.me;
    const NB = [2, 3, 5][L], SZ = [0.72, 0.86, 1.05][L], Z = [1.85, 2.0, 2.25][L], RB = [[1.2, 1.75], [1.1, 1.65, 2.2], [1.0, 1.45, 1.9, 2.35, 2.8]][L], RF = [2.0, 2.5, 3.1][L], GAP = L === 2 ? 0.27 : 0.32;
    const BT = []; for (let i = 0; i < NB; i++) BT.push(0.45 + i * GAP); const OPEN = BT[NB - 1] + 0.24, FIN = OPEN + 0.2, LIFE = FIN + 0.75;
    const tot = C.base * 2.6 * C.K * K.evoK(C) * bonus(C), beatK = 0.5 / NB * (L === 2 ? 1.2 : 1), finK = 1 - 0.5 * (L === 2 ? 1.2 : 1);
    const rings = [], crys = []; H.warn(x, y, RF, FIN, C.col); H.X.sfx.hum();
    BT.forEach((tb, i) => H.X.after(tb, () => { const r = RB[i], big = i === NB - 1 ? 1.25 : 1; H.hitRing(x, y, 0, r + 0.35, tot * beatK * (0.8 + 0.4 * i / Math.max(1, NB - 1)), C.dmgO({ kb: 1.5 + i * 0.5, chill: true }));
      rings.push({ x, y, t0: F.t, r: r + 0.2, dur: 0.5, w: 0.1 * big }); const n = Math.round((7 + i * 1.5 + L) * r / 1.5);
      for (let j = 0; j < n; j++) { const b = j / n * TAU + i * 0.4, cx = x + Math.cos(b) * r, cy = y + Math.sin(b) * r * 0.62; if (Math.hypot(cx - me.x, cy - me.y) < 0.75 || H.X.blocked(cx, cy, 0.1, 0)) continue; crys.push({ x: cx, y: cy, t0: F.t, s: j + i * 5, h: (0.45 + 0.25 * K.R1(j + i * 7)) * (1 + 0.12 * i) * (1 + 0.15 * L), w: 0.17 + 0.03 * L, die: 0.42 + 0.06 * K.R1(j) }); }
      H.X.after(0.4, () => { for (let j = 0; j < Math.min(6, n); j++) { const b = j / 6 * TAU + i; K.glitter(x + Math.cos(b) * r, y + Math.sin(b) * r * 0.62 - 0.2, 3, 3); } });
      K.snow(x, y - Z, 4 + i, { v: 2 }); H.X.light(x, y, r * 1.6, 0.22); H.X.shake(2 + i * 0.8, 0.1); H.X.sfx.thud(); if (i % 2) H.X.sfx.crack(); }));
    H.X.after(OPEN, () => { H.X.sfx.hum(); H.X.sfx.sparkle && H.X.sfx.sparkle(); K.glitter(x, y - Z, 14, 4); });
    H.X.after(FIN, () => { H.hitArea(x, y, RF, tot * finK, C.dmgO({ kb: 4 + L, freeze: 0.7 + 0.15 * L })); for (const m of H.near(x, y, RF * 0.7)) H.bind(m, 0.5 + 0.15 * L);
      rings.push({ x, y, t0: F.t, r: RF * 1.05, dur: 0.6, w: 0.16 }, { x, y, t0: F.t + 0.08, r: RF * 0.7, dur: 0.5, w: 0.1 });
      const n = Math.round(10 + 4 * L); for (let j = 0; j < n; j++) { const b = j / n * TAU + 0.2, cx = x + Math.cos(b) * RF * 0.9, cy = y + Math.sin(b) * RF * 0.9 * 0.62; if (Math.hypot(cx - me.x, cy - me.y) < 0.75 || H.X.blocked(cx, cy, 0.1, 0)) continue; crys.push({ x: cx, y: cy, t0: F.t + 0.05, s: j + 31, h: (0.7 + 0.3 * K.R1(j + 3)) * (1 + 0.2 * L), w: 0.22 + 0.04 * L, die: 0.5 }); }
      shardBurst(x, y, Z, { n: 16 + L * 6, v: 5 + L, up: 1.5, w: 0.13 + 0.03 * L, h: 0.42 + 0.1 * L, life: 0.8 }); K.shatterAt(x, y - Z, 1.2 + 0.3 * L); K.glitter(x, y - Z, 14 + 6 * L, 7); K.snow(x, y - Z, 14 + 6 * L, { v: 2.5, life: 1.4 });
      H.X.ring(x, y, 0.3, RF, 0.45, P.frost, 0.5); H.X.flash(0.15 + 0.06 * L, P.frost); H.X.light(x, y, RF * 1.8, 0.4); H.X.shake(5 + 2 * L, 0.18); H.X.hitstop(0.05); H.X.sfx.crash(); });
    const F = H.add({ life: LIFE, x, y,
      update(dt, f) { if (f.t < FIN) K.aura(x, y, 0.6 * SZ, dt, 10 + 6 * L, Z); if (f.t > FIN && f.t < FIN + 0.6) { const k = 20 * dt * H.Q(); let n = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (n-- > 0) H.P({ kind: 'snow', x: x + (Math.random() - 0.5) * RF * 1.6, y: y - Z - Math.random() * 1.2, vx: (Math.random() - 0.5) * 0.6, vy: 0.7 + Math.random() * 0.5, life: 1.1, max: 1.1, size: 1.6 + Math.random() * 1.6 }); } },
      beat(ft) { let b = 0; for (const tb of BT) { const u = (ft - tb) / 0.3; if (u > -0.08 && u < 1) b = Math.max(b, u < 0 ? 1 + u / 0.08 : 1 - u); } return cl(b); },
      drawUnder(c, f, X, Y, T, t) { const k = H.fade(f, 0.3, 0.6), grown = cl((f.t - 0.3) / (FIN - 0.3));
        K.frozenPool(c, X, Y, T * (0.8 + (RF - 0.8) * grown), 0.5 * k, t); K.frostVeins(c, X, Y, T * RF, 0.2 + 0.8 * grown, 0.75 * k, 4.2, 8 + 2 * L);
        K.floorLight(c, X, Y, T * 1.4 * SZ / 0.62, (0.35 + 0.5 * this.beat(f.t)) * k * cl(1 - (f.t - FIN) / 0.4), P.cyan);
        floorRings(c, rings, f.t, T, t);
        // crystals behind the pet stand under it
        for (const q of crys) if (q.y < me.y) this.crystal(c, q, T, t); },
      crystal(c, q, T, t) { const u = (this.t - q.t0); if (u < 0 || u > q.die + 0.12) return; const up = H.ease.back ? H.ease.back(cl(u / 0.16)) : H.ease.out(cl(u / 0.16)), a = cl(1 - (u - q.die) / 0.12); if (u > q.die && !q.burst) { q.burst = 1; K.glitter(q.x, q.y - q.h * 0.5, 2, 3); } const X1 = H.sx(q.x), Y1 = H.sy(q.y); K.floorLight(c, X1, Y1, T * q.w * 2.2, 0.3 * a, P.cyan); shardQ(c, X1, Y1, T * q.w, T * q.h * up, -Math.PI / 2, q.s, a, q.s % 3 ? null : t); },
      draw(c, f, X, Y, T, t) {
        for (const q of crys) if (q.y >= me.y) this.crystal(c, q, T, t);
        const form = H.ease.out(cl(f.t / 0.4)), bt = this.beat(f.t), open = H.ease.out(cl((f.t - OPEN) / 0.3)), gone = cl((f.t - FIN - 0.05) / 0.35); if (gone >= 1) return;
        const Sk = T * SZ * form * (1 + 0.12 * bt) / 100, hy = Y - T * Z - Math.sin(f.t * 3) * T * 0.05;
        aroundPet(c, X - T * 1.2, hy - T * 1.2, X + T * 1.2, hy + T * 1.2, () => {
          // the core inside (seen through the translucent halves), brightening on each beat and blazing when the heart opens
          K.glow(c, X, hy, T * (1.2 + 0.8 * bt + 1.2 * open) * SZ / 0.62, P.cyan, (0.45 + 0.4 * bt + 0.3 * open) * form * (1 - gone));
          H.core(c, X, hy + T * 0.05, T * (0.26 + 0.14 * bt + 0.3 * open) * SZ / 0.62, P.cyan, P.white, (0.7 + 0.3 * bt) * form * (1 - gone * 0.5));
          for (const sd of [-1, 1]) { const spr = heartHalf(sd); c.save(); c.globalAlpha = form * (1 - gone); c.translate(X + sd * open * T * 0.55 * SZ / 0.62, hy - open * T * 0.1); c.rotate(sd * open * 0.45); c.scale(Sk, Sk); c.drawImage(spr, -110, -104); c.restore(); }
          // light pouring through the opened seam
          if (open > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = open * (1 - gone); for (let i = 0; i < 7; i++) { const b = -Math.PI / 2 + (i - 3) * 0.32; H.ray(c, X, hy, b, T * (1.4 + 0.8 * open) * SZ / 0.62, T * 0.28, P.frost, 0.6 * open * (1 - gone)); } c.restore(); H.core(c, X, hy, T * 0.55 * open * SZ / 0.62, P.pale, P.white, open * (1 - gone)); }
          // a halo ring round the heart on each beat
          if (bt > 0.05) K.iceRing(c, X, hy, T * SZ * (1.1 + 0.6 * (1 - bt)) * 1.3, bt * 0.8, T * SZ * (1.1 + 0.6 * (1 - bt)) * 0.45, t, 2.5);
        });
      } });
  };

  /* ============ I-S01 Crystal Antler ============
     Branching antlers of faceted crystal grow from the ground along a short path ahead; frost light runs from their bases
     up to every tip, then each formation shatters outward into tumbling shards. Hatchling: three. Adept: five, larger, their
     tines forking. Celestial: a row of five, then a fan of three larger ones, then one great antler, each wave bigger. */
  S.antler = (C, h) => { bind(h); const L = lvl(C), me = H.me, a = C.a, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
    const tot = C.base * 2.55 * C.K * K.evoK(C) * bonus(C), list = [];
    const put = (d, lat, sc, t0, dk, fork, seed) => { let x = me.x + ca * d + px * lat, y = me.y + sa * d + py * lat; if (H.X.blocked(x, y, 0.25, 0)) { x = me.x + ca * d; y = me.y + sa * d; if (H.X.blocked(x, y, 0.25, 0)) return; } list.push({ x, y, sc, t0, dk, fork, seed, flip: seed % 2 ? -1 : 1 }); };
    if (L === 0) [1.2, 2.3, 3.4].forEach((d, i) => put(d, 0, 1, i * 0.14, 0.42, 0, i));
    else if (L === 1) [1.1, 1.9, 2.7, 3.5, 4.3].forEach((d, i) => put(d, (i % 2 ? 0.38 : -0.38) * (i ? 1 : 0), 1 + i * 0.07, i * 0.1, 0.3, 1, i));
    else { [1.1, 1.8, 2.5, 3.2, 3.9].forEach((d, i) => put(d, (i % 2 ? 0.36 : -0.36) * (i ? 1 : 0), 1 + i * 0.05, i * 0.08, 0.17, 1, i)); [-1, 0, 1].forEach((k, i) => put(3.0 + Math.abs(k) * -0.3, k * 1.05, 1.45, 0.55 + i * 0.06, 0.24, 2, 10 + i)); put(4.5, 0, 2.2, 1.05, 0.62, 3, 20); }
    H.X.sfx.hum(); me.sq = 0.7;
    /* a rack: a pair of curved beams rising from one root, tines climbing from each beam (forking from Adept), brow tines
       at Celestial. Limbs are polylines in units of the antler's height (x right, y up negative), with a root width, a
       growth start and duration (0..1 of the growing), drawn as faceted crystal (lit and shaded facets on a bright ridge). */
    const rack = fork => { const out = [], NS = fork >= 3 ? 5 : fork >= 1 ? 4 : 3, A = [0.3, 0.52, 0.34, 0.08, -0.14], LS = [0.27, 0.25, 0.22, 0.18, 0.14], dir = (a2, s) => [s * Math.sin(a2), -Math.cos(a2)];
      for (const s of [-1, 1]) { const pts = [[s * 0.04, 0]]; let x = s * 0.04, y = 0; for (let j = 0; j < NS; j++) { const d = dir(A[j], s); x += d[0] * LS[j]; y += d[1] * LS[j]; pts.push([x, y]); }
        const beamL = LS.slice(0, NS).reduce((q, v) => q + v, 0); out.push({ pts, w: 0.19, st: 0, du: 0.55 }); let cum = 0;
        for (let j = 1; j < NS; j++) { cum += LS[j - 1]; if (fork === 0 && j > 2) break; const tl = (0.34 - 0.03 * j) * (fork >= 3 ? 1.15 : 1), b0 = pts[j], d1 = dir(-0.04 - 0.05 * j, s), d2 = dir(-0.28, s), m = [b0[0] + d1[0] * tl * 0.55, b0[1] + d1[1] * tl * 0.55], e = [m[0] + d2[0] * tl * 0.45, m[1] + d2[1] * tl * 0.45], st = 0.55 * cum / beamL;
          out.push({ pts: [b0, m, e], w: 0.19 * (1 - cum / beamL) * 0.85 + 0.03, st, du: 0.3 });
          if (fork >= 1 && (j >= 2 || fork >= 2)) { const d3 = dir(0.55, s); out.push({ pts: [m, [m[0] + d3[0] * tl * 0.42, m[1] + d3[1] * tl * 0.42]], w: 0.06, st: st + 0.17, du: 0.22 }); } }
        if (fork >= 2) { const b0 = [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.45, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.45], d = dir(1.2, s); out.push({ pts: [b0, [b0[0] + d[0] * 0.17, b0[1] + d[1] * 0.17]], w: 0.075, st: 0.12, du: 0.22 }); } }
      return out; };
    /* faceted crystal limbs, batched by facet colour: pts in screen px, widths tapering to a point at the grown tip */
    const FC = ['rgba(240,252,255,0.86)', 'rgba(191,239,255,0.82)', 'rgba(70,150,225,0.74)', 'rgba(36,92,170,0.72)'];
    function limbs(c, Ls, k) { const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], rim = new Path2D(), ridge = new Path2D();
      for (const Lm of Ls) { const p = Lm.p, n = p.length; if (n < 2) continue; const W = [], N = [];
        let tot = 0; const seg = []; for (let i = 1; i < n; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]) || 0.01; seg.push(l); tot += l; } let cum = 0;
        for (let i = 0; i < n; i++) { W.push(Lm.w * (1 - cum / tot)); if (i < n - 1) cum += seg[i]; const a0 = i > 0 ? Math.atan2(p[i][1] - p[i - 1][1], p[i][0] - p[i - 1][0]) : null, a1 = i < n - 1 ? Math.atan2(p[i + 1][1] - p[i][1], p[i + 1][0] - p[i][0]) : null; let nx = 0, ny = 0; for (const aa of [a0, a1]) if (aa != null) { nx += -Math.sin(aa); ny += Math.cos(aa); } const nl = Math.hypot(nx, ny) || 1; N.push([nx / nl, ny / nl]); }
        const Lp = p.map((q, i) => [q[0] + N[i][0] * W[i] / 2, q[1] + N[i][1] * W[i] / 2]), Rp = p.map((q, i) => [q[0] - N[i][0] * W[i] / 2, q[1] - N[i][1] * W[i] / 2]);
        for (let i = 0; i < n - 1; i++) { const litL = (N[i][0] * -0.6 + N[i][1] * -0.8) > 0, q = (i + Lm.s) % 2; const pl = paths[litL ? q : 2 + q], pr = paths[litL ? 2 + q : q];
          pl.moveTo(Lp[i][0], Lp[i][1]); pl.lineTo(Lp[i + 1][0], Lp[i + 1][1]); pl.lineTo(p[i + 1][0], p[i + 1][1]); pl.lineTo(p[i][0], p[i][1]); pl.closePath();
          pr.moveTo(p[i][0], p[i][1]); pr.lineTo(p[i + 1][0], p[i + 1][1]); pr.lineTo(Rp[i + 1][0], Rp[i + 1][1]); pr.lineTo(Rp[i][0], Rp[i][1]); pr.closePath(); }
        rim.moveTo(Lp[0][0], Lp[0][1]); for (let i = 1; i < n; i++) rim.lineTo(Lp[i][0], Lp[i][1]); for (let i = n - 1; i >= 0; i--) rim.lineTo(Rp[i][0], Rp[i][1]);
        ridge.moveTo(p[0][0], p[0][1]); for (let i = 1; i < n; i++) ridge.lineTo(p[i][0], p[i][1]); }
      c.save(); c.globalAlpha = k; for (let i = 0; i < 4; i++) { c.fillStyle = FC[i]; c.fill(paths[i]); } c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = 'rgba(95,232,255,0.95)'; c.lineWidth = 1.4; c.stroke(rim); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.1; c.stroke(ridge); c.restore(); }
    /* a polyline cut to fraction u of its length */
    const cut = (pts, u) => { if (u >= 1) return pts; let tot = 0; for (let i = 1; i < pts.length; i++) tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); let rem = tot * u; const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (rem >= l) { out.push(pts[i]); rem -= l; } else { const v = rem / l; out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * v, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * v]); break; } } return out; };
    list.forEach(an => { an.pcs = rack(an.fork); an.dmg = tot * an.dk; an.r = 0.85 * Math.sqrt(an.sc) * (an.sc > 2 ? 1.25 : 1); const GROW = 0.32 + 0.06 * an.sc, RUN = 0.32, SH = GROW + RUN + 0.06; an.GROW = GROW; an.SH = SH;
      H.X.after(an.t0 + SH, () => { H.hitArea(an.x, an.y, an.r, an.dmg, C.dmgO({ kb: 2.5 + an.sc, chill: true, freeze: an.sc > 2 ? 0.6 : 0 }));
        const hh = 1.9 * an.sc; an.pcs.forEach((p, i) => { if (i % 2) return; const q = p.pts[p.pts.length - 1]; shardBurst(an.x + q[0] * hh * 0.6, an.y, -q[1] * hh * 0.7, { n: 2, v: 3.5 * Math.sqrt(an.sc), up: 2.5, w: 0.11 * Math.sqrt(an.sc), h: 0.34 * Math.sqrt(an.sc), life: 0.55 }); });
        K.shatterAt(an.x, an.y - 0.6 * an.sc, 0.8 * an.sc); K.glitter(an.x, an.y - 1.0 * an.sc, Math.round(6 * an.sc), 5); F.rings.push({ x: an.x, y: an.y, t0: F.t, r: an.r * 1.15, dur: 0.45, w: 0.08 + 0.02 * an.sc }); H.X.light(an.x, an.y, an.r * 1.6, 0.22);
        H.X.shake(2 + an.sc * 1.5, 0.1); if (an.sc > 2) { H.X.flash(0.12, P.frost); H.X.hitstop(0.04); H.X.sfx.crash(); } else H.X.sfx.crack(); });
      H.X.after(an.t0, () => { K.snow(an.x, an.y, 3); H.X.sfx.thud && an.sc > 1.3 && H.X.sfx.thud(); }); });
    const end = list.reduce((m, an) => Math.max(m, an.t0 + an.SH), 0);
    const F = H.add({ life: end + 0.55, x: me.x, y: me.y, rings: [],
      update(dt, f) { for (const an of list) { const u = f.t - an.t0; if (u > 0 && u < an.SH) K.aura(an.x, an.y, 0.3 * an.sc, dt, 6 * an.sc, 1.2 * an.sc * Math.random()); } },
      drawUnder(c, f, X, Y, T, t) { for (const an of list) { const u = f.t - an.t0; if (u < 0) continue; const ax = H.sx(an.x), ay = H.sy(an.y), k = cl(1 - (u - an.SH) / 0.45), g = cl(u / an.GROW);
          K.floorLight(c, ax, ay, T * 0.9 * an.sc, 0.55 * k * g, P.cyan); K.frostVeins(c, ax, ay, T * 0.6 * an.sc, H.ease.out(g), 0.45 * k, an.seed * 1.7, 4); }
        floorRings(c, f.rings, f.t, T, t); for (const an of list) if (an.y < me.y - 0.1) this.antler(c, an, T, t); },
      antler(c, an, T, t) { const u = this.t - an.t0; if (u < 0 || u >= an.SH) return; const g = cl(u / an.GROW), fr = cl((u - an.GROW) / 0.32), hh = T * 2.15 * an.sc, X0 = H.sx(an.x), Y0 = H.sy(an.y), k = 1 - cl((u - an.SH + 0.05) / 0.05);
        const Ls = []; for (const p of an.pcs) { const gp = H.ease.out(cl((g - p.st) / p.du)); if (gp <= 0.02) continue; const sp = cut(p.pts, gp).map(q => [X0 + q[0] * hh, Y0 + q[1] * hh]); Ls.push({ p: sp, w: T * p.w * 2.2 * an.sc * (0.5 + 0.5 * gp), s: an.seed, st: p.st }); }
        aroundPet(c, X0 - hh * 0.9, Y0 - hh * 1.2, X0 + hh * 0.9, Y0 + 4, () => {
          K.glow(c, X0, Y0 - hh * 0.45 * g, hh * 0.6, P.cyan, (0.18 + 0.15 * fr) * k);
          limbs(c, Ls, 0.95 * k);
          // frost light runs from the root up every limb: the ice it has passed glows from within, a bright front leads it
          if (fr > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; const glowP = new Path2D(); for (const Lm of Ls) { const pp = cl((fr * 1.35 - Lm.st * 1.0) / 0.55); if (pp <= 0) continue; const q = cut(Lm.p, pp); glowP.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) glowP.lineTo(q[i][0], q[i][1]); if (pp < 1) { const e = q[q.length - 1]; K.glow(c, e[0], e[1], T * 0.22 * Math.sqrt(an.sc), P.white, 0.85 * k); } }
            c.globalAlpha = 0.3 * k; c.strokeStyle = P.cyan; c.lineWidth = T * 0.08 * an.sc; c.stroke(glowP); c.globalAlpha = 0.65 * k; c.strokeStyle = P.white; c.lineWidth = Math.max(1.2, T * 0.035 * an.sc); c.stroke(glowP); c.restore(); }
          if (fr > 0.6) K.glow(c, X0, Y0 - hh * 0.6, hh * 0.5, P.cyan, 0.15 * (fr - 0.6) / 0.4 * k);
        }); },
      draw(c, f, X, Y, T, t) { for (const an of list) if (!(an.y < me.y - 0.1)) this.antler(c, an, T, t); } });
  };

  /* ============ I-S02 Glacier Skate ============
     A faceted ice blade, glass-clear in the middle and powdered white at its edges, slides low across the floor leaving a
     narrow frosted track and shedding powder; at the end it tilts up and fractures into a compact fan of shards.
     Hatchling: one. Adept: two blades weaving across each other. Celestial: two, then two larger on a wider weave, then one
     great blade straight down the middle whose fan towers over the rest. */
  S.skate = (C, h) => { bind(h); const L = lvl(C), me = H.me, a = C.a, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
    const tot = C.base * 2.4 * C.K * K.evoK(C) * bonus(C), DUR = 0.62;
    const specs = L === 0 ? [[0, 0, 1, 1]] : L === 1 ? [[0, 0.55, 1.1, 0.5], [0, -0.55, 1.1, 0.5]] : [[0, 0.5, 1, 0.15], [0, -0.5, 1, 0.15], [0.3, 0.85, 1.25, 0.18], [0.3, -0.85, 1.25, 0.18], [0.62, 0, 1.8, 0.34]];
    const blades = specs.map(([t0, amp, sc, dk], i) => { let len = 5.2 * (sc > 1.5 ? 1.05 : 1); while (len > 1.5) { let ok = true; for (let u = 0.1; u <= 1.001; u += 0.1) { const q = pathAt(u * len / 5.2, len, amp); if (H.X.blocked(q[0], q[1], 0.25, 0)) { ok = false; break; } } if (ok) break; len -= 0.4; }
      return { t0, amp, sc, len, pass: tot * dk * 0.38, fan: tot * dk * 0.62, pts: [], hits: new Set(), done: false, i }; });
    function pathAt(u, len, amp) { const d = Math.min(1, u) * len, w = Math.sin(Math.min(1, u) * Math.PI) * amp; return [me.x + ca * (0.5 + d) + px * w, me.y + sa * (0.5 + d) + py * w]; }
    const x0 = me.x, y0 = me.y; const P0 = (b, u) => { const d = Math.min(1, u) * b.len, w = Math.sin(Math.min(1, u) * Math.PI) * b.amp; return [x0 + ca * (0.5 + d) + px * w, y0 + sa * (0.5 + d) + py * w]; };
    H.X.sfx.whoosh(); me.sq = 0.75; const end = Math.max(...blades.map(b => b.t0)) + DUR + 0.75;
    for (const b of blades) H.X.after(b.t0, () => { H.X.sfx.whoosh(); K.snow(x0 + ca * 0.5, y0 + sa * 0.5, 4); });
    const F = H.add({ life: end, x: x0, y: y0, rings: [],
      update(dt, f) { for (const b of blades) { const u = (f.t - b.t0) / DUR; if (u < 0 || b.done) continue; const e = H.ease.out(cl(u)), q = P0(b, e); b.x = q[0]; b.y = q[1]; const q2 = P0(b, Math.min(1, e + 0.02)); b.h = Math.atan2(q2[1] - q[1], q2[0] - q[0]) || b.h || a;
          if (!b.pts.length || Math.hypot(q[0] - b.pts[b.pts.length - 1][0], q[1] - b.pts[b.pts.length - 1][1]) > 0.22) b.pts.push([q[0], q[1], f.t]);
          for (const m of H.near(q[0], q[1], 0.6 * b.sc)) { if (b.hits.has(m)) continue; b.hits.add(m); H.X.hitMon(m, b.pass, C.dmgO({ kb: 1, chill: true })); K.glitter(m.x, m.y - 0.3, 4, 3); K.fragments(m.x, m.y - 0.3, 3, 4); }
          if (Math.random() < 0.7 * H.Q() * b.sc) for (const s of [-1, 1]) { const r1 = Math.random(); H.P({ kind: r1 < 0.6 ? 'snow' : 'spark', x: q[0] - Math.sin(b.h) * s * 0.3 * b.sc, y: q[1] + Math.cos(b.h) * s * 0.2 * b.sc, vx: -Math.cos(b.h) * (0.6 + Math.random() * 1.6) - Math.sin(b.h) * s * (0.5 + Math.random()), vy: -Math.sin(b.h) * 0.7 - 0.4 - Math.random() * 0.8, g: 1.5, life: 0.35 + Math.random() * 0.3, max: 0.65, size: 1.2 + Math.random() * 1.4, color: r1 < 0.8 ? P.white : P.cyan }); }
          if (u >= 1) { b.done = true; b.end = f.t; H.X.after(0.16, () => { const fx = b.x, fy = b.y, rr = 2.2 * Math.sqrt(b.sc); H.hitCone(fx, fy, b.h, rr, 0.8, b.fan, C.dmgO({ kb: 3 + b.sc * 1.5, chill: true, freeze: b.sc > 1.5 ? 0.5 : 0 }));
            shardBurst(fx, fy, 0.5 * b.sc, { n: Math.round(9 * b.sc), ang: b.h, spread: 1.5, v: 6 * Math.sqrt(b.sc), up: 3, w: 0.12 * Math.sqrt(b.sc), h: 0.42 * Math.sqrt(b.sc), life: 0.6, spin: 6 }); F.fans.push({ x: fx, y: fy, h: b.h, t0: F.t, sc: b.sc });
            K.glitter(fx, fy - 0.4, Math.round(8 * b.sc), 6); K.snow(fx, fy - 0.3, Math.round(5 * b.sc)); F.rings.push({ x: fx, y: fy, t0: F.t, r: 1.0 * b.sc, dur: 0.45, w: 0.08 }); H.X.light(fx, fy, 1.6 * b.sc, 0.22);
            H.X.shake(2.5 + b.sc * 1.5, 0.1); if (b.sc > 1.5) { H.X.flash(0.1, P.frost); H.X.hitstop(0.04); H.X.sfx.crash(); } else H.X.sfx.crack(); }); } } },
      fans: [],
      drawUnder(c, f, X, Y, T, t) {
        // the frosted tracks: a narrow clear groove between two powdered white edges, lit from below, fading behind
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (const b of blades) { const n = b.pts.length; if (n < 2) continue; const S2 = b.pts.map(q => [H.sx(q[0]), H.sy(q[1]), cl(1 - (f.t - q[2] - 0.35) / 0.5)]);
          // the groove: one band per few points (butt ends, so no beads where they meet), then the powdered edges
          c.lineCap = 'butt'; c.strokeStyle = P.ice; c.lineWidth = T * 0.2 * b.sc; for (let i = 0; i < n - 1; i += 3) { const j = Math.min(n - 1, i + 3), al = S2[Math.min(n - 1, i + 1)][2]; if (al <= 0) continue; c.globalAlpha = 0.28 * al; c.beginPath(); c.moveTo(S2[i][0], S2[i][1]); for (let q = i + 1; q <= j; q++) c.lineTo(S2[q][0], S2[q][1]); c.stroke(); }
          c.lineCap = 'round'; for (let i = 1; i < n; i++) { const p0 = S2[i - 1], q = S2[i], al = q[2]; if (al <= 0) continue; const ax = p0[0], ay = p0[1], bx = q[0], by = q[1], ang = Math.atan2(by - ay, bx - ax), nx = -Math.sin(ang) * T * 0.15 * b.sc, ny = Math.cos(ang) * T * 0.15 * b.sc * 0.7;
            c.globalAlpha = 0.85 * al; c.strokeStyle = P.frost; c.lineWidth = Math.max(1.2, T * 0.035); c.beginPath(); c.moveTo(ax + nx, ay + ny); c.lineTo(bx + nx, by + ny); c.moveTo(ax - nx, ay - ny); c.lineTo(bx - nx, by - ny); c.stroke();
            if (i % 3 === 0) { c.globalAlpha = 0.55 * al; c.strokeStyle = P.cyan; c.lineWidth = 1; c.beginPath(); c.moveTo(bx + nx, by + ny); c.lineTo(bx + nx * 2.2 + Math.cos(ang) * T * 0.15, by + ny * 2.2 + Math.sin(ang) * T * 0.1); c.moveTo(bx - nx, by - ny); c.lineTo(bx - nx * 2.2 + Math.cos(ang) * T * 0.15, by - ny * 2.2 + Math.sin(ang) * T * 0.1); c.stroke(); } } }
        c.restore();
        for (const b of blades) if (b.x != null && !(b.done && f.t - b.end > 0.3)) K.floorLight(c, H.sx(b.x), H.sy(b.y), T * 0.9 * b.sc, 0.55, P.cyan);
        floorRings(c, f.rings, f.t, T, t); },
      draw(c, f, X, Y, T, t) { const spr = bladeSprite();
        for (const b of blades) { if (b.x == null) continue; const tilt = b.done ? cl((f.t - b.end) / 0.16) : 0, k = b.done ? cl(1 - (f.t - b.end - 0.16) / 0.1) : cl((f.t - b.t0) / 0.08); if (k <= 0) continue; const bx = H.sx(b.x), by = H.sy(b.y), Lb = T * 1.6 * b.sc;
          K.glow(c, bx, by - T * 0.15, T * 0.9 * b.sc, P.cyan, 0.4 * k);
          // the blade: lying in the floor plane, tilting up toward the screen as it ends
          const sh = Math.atan2(Math.sin(b.h) * H.GY, Math.cos(b.h)), facing = Math.cos(sh) >= 0 ? 1 : -1;
          c.save(); c.globalAlpha = k; c.translate(bx, by - T * 0.1 * b.sc - tilt * T * 0.4 * b.sc); c.rotate(sh * (1 - tilt) + tilt * (facing > 0 ? -1.15 : Math.PI + 1.15)); c.scale(Lb / 188, Lb / 188 * (1.05 + 0.2 * tilt)); c.drawImage(spr, -100, -36); c.restore();
          if (!b.done) K.glow(c, bx + Math.cos(sh) * Lb * 0.45, by + Math.sin(sh) * Lb * 0.45, T * 0.3, P.white, 0.6); else K.glow(c, bx, by - T * 0.5 * b.sc, T * 0.9 * b.sc, P.white, 0.6 * tilt * k); }
        // the fans: the blade's fractured pieces standing up in a compact fan for an instant
        for (const fn of f.fans) { const u = (f.t - fn.t0) / 0.32; if (u < 0 || u > 1) continue; const fx = H.sx(fn.x), fy = H.sy(fn.y), n = fn.sc > 1.5 ? 9 : 5, rise = H.ease.out(cl(u * 2.5)), al = 1 - cl((u - 0.5) / 0.5), sh = Math.atan2(Math.sin(fn.h) * H.GY, Math.cos(fn.h));
          aroundPet(c, fx - T * 2 * fn.sc, fy - T * 2 * fn.sc, fx + T * 2 * fn.sc, fy + T * 0.3, () => { K.glow(c, fx, fy - T * 0.6 * fn.sc, T * 1.3 * fn.sc, P.cyan, 0.5 * al);
            for (let i = 0; i < n; i++) { const v = (i / (n - 1) - 0.5), ang = -Math.PI / 2 + v * 1.9 + Math.cos(sh) * 0.35, ln = T * (0.9 + 0.5 * (1 - Math.abs(v) * 1.6)) * fn.sc * rise; shardQ(c, fx + Math.cos(sh) * T * 0.25 * fn.sc, fy, T * 0.2 * Math.sqrt(fn.sc), ln, ang, i, 0.95 * al, t); } }); } } });
  };
})();
