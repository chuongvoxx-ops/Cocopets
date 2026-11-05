/* ---------- Dark, reworked: Black Rose Compass ----------
   The mechanics are the old move's (20k5-elem-dark.js U.blackrose): four thorn-needles form at the compass points round
   the aim, strike inward in alternating pairs at 1.2 / 1.7 / 2.2 / 2.7 s (a hitLine each, base × 1.5, plus base × 0.6 at the
   centre), then a rose opens at 3.0 s and bursts at 3.35 s (base × 4.4 over the whole compass, knockback and a stun).
   The picture is new. A violet compass sigil draws itself on the floor (light only, under everything). The needles are
   true 3D thorns built with GeoKit: a fluted, tapered spike of dark glass (cel bands, a glint sliding over the ridges as
   it turns, ink edges) with four grooves of #6D28A8 energy running its length that brighten as it winds up; each
   materialises point-up out of shadow mist, turns to aim at the centre, and strikes with weight: a slow draw back, a
   fast drilling thrust with a violet trail and a flare at the centre, a recoil. The rose is a layered volume: dark petals
   with plum depth and a violet rim (shaded strips, painted once, laid down curled about the bud and unfolding in
   sequence, inner ring first) round a glowing energy heart on a thorned stem with two leaves, dark fragments orbiting
   it, mist at its foot; at the burst it flashes, snaps shut and shatters: the petals tumble out and down, dark glass and
   smoke with them. Levels: one ring of petals at Hatchling, two from Adept (richer, more fragments), three at
   Celestial with a larger rose, violet fractures crawling over the needles and a last bloom that scatters petals across
   the arena. Near the pet everything dims smoothly (no cut-out). */
(() => {
  const U = ELEM_IMPL.dark.ult, TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF', INK = '#06040A';
  let H;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const mixH = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  /* a floor direction as its angle on screen */
  const scrA = a => Math.atan2(Math.sin(a) * H.GY, Math.cos(a));
  /* how much a thing of radius rad px drawn at screen (sx, sy) fades near the pet: a smooth dip, never a hole */
  function petDim(sx, sy, T, rad) { const px = H.sx(H.me.x), py = H.sy(H.me.y) - T * 0.45, d = Math.max(0, Math.hypot(sx - px, sy - py) - (rad || 0)); return 0.16 + 0.84 * sstep(T * 0.55, T * 1.7, d); }

  /* ---- cached pictures ---- */
  /* the compass sigil (seen from above; squashed onto the floor when drawn): a double outer ring, four long compass
     points where the needles stand, four lesser points between, a ring of thorn hooks, an inner rune ring and a rose
     glyph at the heart; all light, nothing dark */
  const sigilSpr = () => fxSprite('dk3sigil', 512, 512, (g, w) => {
    const c0 = w / 2, Rr = 236; g.translate(c0, c0); g.lineCap = 'round'; g.lineJoin = 'round';
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, Rr); gr.addColorStop(0, rgba(ENERGY, 0.22)); gr.addColorStop(0.5, rgba(ENERGY, 0.08)); gr.addColorStop(0.92, rgba(ENERGY, 0.1)); gr.addColorStop(1, rgba(ENERGY, 0)); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w);
    g.strokeStyle = rgba(EDGE, 0.75); g.lineWidth = 3; g.beginPath(); g.arc(0, 0, Rr, 0, TAU); g.stroke(); g.strokeStyle = rgba(EDGE, 0.4); g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, Rr - 11, 0, TAU); g.stroke();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, big = k % 2 === 0, r0 = big ? 128 : 176, r1 = big ? Rr - 2 : 214, hw = big ? 15 : 8; g.save(); g.rotate(a);
      g.beginPath(); g.moveTo(r0, 0); g.lineTo((r0 + r1) / 2, -hw); g.lineTo(r1, 0); g.lineTo((r0 + r1) / 2, hw); g.closePath(); g.fillStyle = rgba(ENERGY, big ? 0.55 : 0.4); g.fill(); g.strokeStyle = rgba(EDGE, big ? 0.9 : 0.6); g.lineWidth = big ? 2 : 1.4; g.stroke();
      if (big) { g.strokeStyle = rgba(ACC, 0.7); g.lineWidth = 1.2; g.beginPath(); g.moveTo(r0 + 10, 0); g.lineTo(r1 - 10, 0); g.stroke(); } g.restore(); }
    // thorn hooks round a vine circle
    g.strokeStyle = rgba(EDGE, 0.55); g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, 158, 0, TAU); g.stroke();
    for (let k = 0; k < 20; k++) { const a = k / 20 * TAU + 0.1, s = k % 2 ? 1 : -1; g.save(); g.rotate(a); g.beginPath(); g.moveTo(158, 0); g.quadraticCurveTo(158 + 9 * s, 7, 158 + 15 * s, 2); g.strokeStyle = rgba(EDGE, 0.7); g.lineWidth = 1.5; g.stroke(); g.restore(); }
    // the rune ring
    g.strokeStyle = rgba(EDGE, 0.6); g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 86, 0, TAU); g.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.save(); g.rotate(a); g.strokeStyle = rgba(ACC, 0.65); g.lineWidth = 1.4; g.beginPath(); if (k % 3 === 0) { g.moveTo(88, -4); g.lineTo(98, 0); g.lineTo(88, 4); } else if (k % 3 === 1) { g.moveTo(89, 0); g.lineTo(97, 0); g.moveTo(93, -4); g.lineTo(93, 4); } else { g.arc(93, 0, 3.5, 0, TAU); } g.stroke(); g.restore(); }
    // the rose glyph
    for (let ring = 0; ring < 3; ring++) { const n = 5 + ring * 3, pr = 18 + ring * 16; for (let p = 0; p < n; p++) { const a = p / n * TAU + ring * 0.5; g.save(); g.rotate(a); g.beginPath(); g.moveTo(pr * 0.4, 0); g.quadraticCurveTo(pr * 0.8, -pr * 0.45, pr * 1.3, 0); g.quadraticCurveTo(pr * 0.8, pr * 0.45, pr * 0.4, 0); g.strokeStyle = rgba(EDGE, 0.55 - ring * 0.1); g.lineWidth = 1.3; g.stroke(); g.restore(); } }
    g.fillStyle = rgba(ACC, 0.8); g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill(); });
  /* the inner wheel that turns the other way: eight pointed arches and a dotted ring */
  const wheelSpr = () => fxSprite('dk3wheel', 256, 256, (g, w) => {
    const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round';
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.save(); g.rotate(a); g.strokeStyle = rgba(EDGE, 0.6); g.lineWidth = 1.5; g.beginPath(); g.moveTo(84, -14); g.quadraticCurveTo(108, -10, 116, 0); g.quadraticCurveTo(108, 10, 84, 14); g.stroke(); g.fillStyle = rgba(ACC, 0.7); g.beginPath(); g.arc(70, 0, 2.2, 0, TAU); g.fill(); g.restore(); }
    g.setLineDash([4, 7]); g.strokeStyle = rgba(EDGE, 0.5); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 120, 0, TAU); g.stroke(); });
  /* a petal, pointing up, its base at the bottom middle: a curved strip with a fold down its heart, the near half plum,
     the far half near-black, a violet rim along its upper edges, an ink outline; three variants (inner, middle, outer) */
  const petalSpr = v => fxSprite('dk3petal' + v, 96, 192, (g, w, h) => {
    const bx = w / 2, by = h - 6, tipY = 8, hw = [30, 38, 44][v], bulge = [1.15, 1.0, 0.9][v];
    const path = () => { g.beginPath(); g.moveTo(bx, by); g.bezierCurveTo(bx - hw * bulge * 1.3, by - h * 0.25, bx - hw * bulge, tipY + h * 0.2, bx - 2, tipY); g.bezierCurveTo(bx + hw * 0.95, tipY + h * 0.22, bx + hw * 1.25, by - h * 0.3, bx, by); g.closePath(); };
    path(); const gr = g.createLinearGradient(bx - hw, 0, bx + hw, 0); gr.addColorStop(0, VOID); gr.addColorStop(0.38, BODY); gr.addColorStop(0.5, mixH(SMOKE, EDGE, 0.45)); gr.addColorStop(0.75, mixH(PLUM, SMOKE, 0.7)); gr.addColorStop(1, mixH(ENERGY, EDGE, 0.3)); g.fillStyle = gr; g.fill();
    // depth down the length: darker at the base, a soft lift toward the tip
    g.save(); path(); g.clip(); const gv = g.createLinearGradient(0, by, 0, tipY); gv.addColorStop(0, 'rgba(0,0,0,0.5)'); gv.addColorStop(0.35, 'rgba(0,0,0,0.05)'); gv.addColorStop(1, rgba(SMOKE, 0.4)); g.fillStyle = gv; g.fillRect(0, 0, w, h);
    // the fold: a dark crease and a smoky highlight beside it
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx, by - 4); g.quadraticCurveTo(bx - 4, h * 0.5, bx - 2, tipY + 6); g.stroke();
    g.strokeStyle = rgba(SMOKE, 0.5); g.lineWidth = 5; g.beginPath(); g.moveTo(bx + 4, by - 10); g.quadraticCurveTo(bx + 6, h * 0.5, bx + 1, tipY + 14); g.stroke();
    // rim light: the upper right edge and the tip
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(EDGE, 0.95); g.lineWidth = 7; g.beginPath(); g.moveTo(bx + hw * 1.1, by - h * 0.32); g.bezierCurveTo(bx + hw * 1.0, by - h * 0.5, bx + hw * 0.7, tipY + h * 0.16, bx - 2, tipY); g.stroke();
    g.strokeStyle = rgba(ACC, 0.6); g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx + hw * 0.9, by - h * 0.45); g.bezierCurveTo(bx + hw * 0.75, by - h * 0.6, bx + hw * 0.5, tipY + h * 0.2, bx - 1, tipY + 3); g.stroke();
    g.strokeStyle = rgba(EDGE, 0.5); g.lineWidth = 3.5; g.beginPath(); g.moveTo(bx - hw * bulge * 0.95, by - h * 0.3); g.bezierCurveTo(bx - hw * bulge * 0.9, by - h * 0.5, bx - hw * bulge * 0.6, tipY + h * 0.22, bx - 2, tipY + 2); g.stroke();
    g.restore();
    path(); g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(); });
  /* a leaf, pointing up, its base at the bottom middle: dark with a plum vein side and a violet midrib */
  const leafSpr = () => fxSprite('dk3leaf', 64, 128, (g, w, h) => {
    const bx = w / 2, by = h - 4, ty = 6; const path = () => { g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx - 26, by - h * 0.45, bx, ty); g.quadraticCurveTo(bx + 26, by - h * 0.45, bx, by); g.closePath(); };
    path(); const gr = g.createLinearGradient(bx - 24, 0, bx + 24, 0); gr.addColorStop(0, VOID); gr.addColorStop(0.5, BODY); gr.addColorStop(1, PLUM); g.fillStyle = gr; g.fill();
    g.save(); path(); g.clip(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(EDGE, 0.7); g.lineWidth = 1.6; g.beginPath(); g.moveTo(bx, by - 4); g.lineTo(bx, ty + 6); g.stroke(); g.strokeStyle = rgba(EDGE, 0.35); g.lineWidth = 1; for (let k = 0; k < 4; k++) { const y = by - 18 - k * 20; g.beginPath(); g.moveTo(bx, y); g.lineTo(bx - 12, y - 14); g.moveTo(bx, y); g.lineTo(bx + 12, y - 14); g.stroke(); } g.restore();
    path(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
    for (const [x, y] of [[bx - 11, by - 40], [bx + 13, by - 62]]) { g.beginPath(); g.moveTo(x, y + 3); g.lineTo(x + (x < bx ? -7 : 7), y - 4); g.lineTo(x, y - 3); g.closePath(); g.fillStyle = PLUM; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke(); } });
  /* a dark fragment: a sliver of black glass with a violet edge (blitted turned) */
  const fragSpr = () => fxSprite('dk3frag', 24, 24, (g, w) => { g.translate(w / 2, w / 2); g.beginPath(); g.moveTo(0, -10); g.lineTo(6, -1); g.lineTo(1, 10); g.lineTo(-6, 2); g.closePath(); const gr = g.createLinearGradient(-6, -8, 6, 8); gr.addColorStop(0, SMOKE); gr.addColorStop(0.5, BODY); gr.addColorStop(1, VOID); g.fillStyle = gr; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.4; g.lineJoin = 'round'; g.stroke(); g.strokeStyle = rgba(EDGE, 0.85); g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -10); g.lineTo(6, -1); g.stroke(); });

  /* ---- the thorn: a GeoKit solid ----
     Model space: the axis runs along +x from the butt (-0.24) to the point (1); the girth is the unit circle in y, z,
     fluted: four sharp ridges and four flat-bottomed grooves (the grooves a second material: the energy). Scaled to
     [length, girth, girth] when drawn. Faces: three ring segments of 12, a fan of 12 at the point, 12 at the butt */
  let THORN = null;
  function thorn() {
    if (THORN) return THORN;
    const NR = 12, prof = [[-0.16, 0.58], [0, 1], [0.34, 0.92], [0.68, 0.58]], v = [], f = [], mat = [];
    prof.forEach(([px, pr]) => { for (let k = 0; k < NR; k++) { const a = k / NR * TAU, rr = (k % 3 === 0 ? 1 : 0.72) * pr; v.push([px, Math.cos(a) * rr, Math.sin(a) * rr]); } });
    v.push([1, 0, 0]); v.push([-0.24, 0, 0]); const AP = prof.length * NR, BK = AP + 1;
    for (let s = 0; s < prof.length - 1; s++) for (let k = 0; k < NR; k++) { const a = s * NR, k2 = (k + 1) % NR; f.push([a + k, a + k2, a + NR + k2, a + NR + k]); mat.push(s === 0 ? 2 : k % 3 === 1 ? 1 : 0); }
    const last = (prof.length - 1) * NR; for (let k = 0; k < NR; k++) { f.push([last + k, last + (k + 1) % NR, AP]); mat.push(k % 3 === 1 ? 1 : 0); }
    for (let k = 0; k < NR; k++) { f.push([k, (k + 1) % NR, BK]); mat.push(2); }
    THORN = GeoKit.mesh(v, f); THORN.mat = mat; return THORN;
  }
  /* the energy in the grooves at seven brightnesses (the material is swapped per needle per frame, never rebuilt) */
  const EN = []; for (let i = 0; i <= 6; i++) { const u = i / 6; EN.push([mixH(PLUM, ENERGY, 0.45 + u * 0.55), mixH(ENERGY, EDGE, u * 0.85), mixH(EDGE, ACC, u)]); }
  const M_GLASS = { c: ['#0E0818', '#261540', '#54387C'], gloss: 1.2, glint: '#E2D4FF', glintA: 0.25 };
  const M_EN = { c: EN[0] };
  const M_BUTT = { c: ['#0E0818', '#2C1A42', '#5A4270'], gloss: 0.6, glint: '#C4ACF0', glintA: 1.2 };
  const MATS = [M_GLASS, M_EN, M_BUTT];
  /* violet fractures over the ridge faces of the two broad segments (Celestial): a jagged crack and a branch in the face's own frame */
  let fracK = 0;
  function fractures(cc, i, fr) {
    if (thorn().mat[i] !== 0 || i < 12 || i >= 36) return;
    const du = fr.u1 - fr.u0, dv = fr.v1 - fr.v0, s = i * 3.7; let u = fr.u0 + du * (0.15 + R1(s) * 0.2), v = fr.v0 + dv * (0.2 + R1(s + 1) * 0.6);
    cc.globalCompositeOperation = 'lighter'; cc.lineCap = 'round'; cc.lineJoin = 'round';
    const run = (n, step, a0) => { cc.beginPath(); cc.moveTo(u, v); let a = a0; for (let k = 0; k < n; k++) { a += (R1(s + k * 2.3) - 0.5) * 1.1; u += Math.cos(a) * step * du; v += Math.sin(a) * step * dv * 0.3; cc.lineTo(u, v); } };
    run(5, 0.16, 0.15); cc.strokeStyle = rgba(EDGE, 0.28 * fracK); cc.lineWidth = Math.max(du, dv) * 0.05; cc.stroke(); cc.strokeStyle = rgba(ACC, 0.8 * fracK); cc.lineWidth = Math.max(du, dv) * 0.014; cc.stroke();
    u = fr.u0 + du * 0.5; v = fr.v0 + dv * (0.35 + R1(s + 5) * 0.3); run(3, 0.12, -0.5 + R1(s + 7)); cc.strokeStyle = rgba(ACC, 0.6 * fracK); cc.stroke();
  }
  /* draw one thorn: its model origin at floor point (bx, by), Z tiles up, pointing along dir (cam space: x right, y
     into the floor, z up), rolled about its axis; L long, w across; en 0..1 the energy; a its alpha */
  function drawThorn(c, T, bx, by, Z, dir, roll, L, w, en, a, frac) {
    if (!(a > 0.01)) return;
    const cam = GeoKit.cam(H.sx(bx), H.sy(by), T), R = GeoKit.mm(GeoKit.frame(dir), GeoKit.rx(roll)), sa = scrA(Math.atan2(dir[1], dir[0]));
    // the shadow under it, along its axis on the floor
    const flat = Math.hypot(dir[0], dir[1]); c.save(); c.globalAlpha = a; c.translate(cam.X + dir[0] * L * 0.4 * T, cam.Y + dir[1] * L * 0.4 * T * H.GY); c.rotate(sa); GeoKit.shadow(c, 0, 0, L * T * (0.2 + 0.35 * flat), w * T * 1.6, Z * 2, 0.4); c.restore();
    M_EN.c = EN[Math.round(cl(en) * 6)]; fracK = 0.6 + 0.4 * en;
    GeoKit.solid(c, cam, thorn(), { R, t: [0, 0, Z], s: [L, w, w] }, { mats: MATS, ink: INK, lw: 0.05, lwI: 0.018, inkIA: 0.3, force: true, alpha: a, face: frac ? fractures : null });
    // the point: a small violet light, hotter with the energy
    const tp = cam.P([dir[0] * L, dir[1] * L, Z + dir[2] * L]); GeoKit.glow(c, tp[0], tp[1], T * (0.35 + 0.5 * en), EDGE, a * (0.25 + 0.55 * en)); if (en > 0.5) GeoKit.glow(c, tp[0], tp[1], T * 0.2, ACC, a * (en - 0.5) * 1.2);
    return { cam, tp, sa };
  }

  // D-U08 Black Rose Compass
  U.blackrose = (C, h) => {
    H = h; const x = C.tx, y = C.ty, a = C.a, R = 3.2 * C.K, evo = Math.max(1, Math.min(7, C.evo || 1)), STRIKES = [[1.2, 0], [1.7, 1], [2.2, 0], [2.7, 1]], ROSE = 3.0, BURST = 3.35;
    H.warn(x, y, R, 1.1, C.col); H.X.banner('BLACK ROSE COMPASS', '', C.col, 1.4); H.X.sfx.hum();
    const nd = []; for (let i = 0; i < 4; i++) nd.push({ b: a + Math.PI / 4 + i * Math.PI / 2, pair: i % 2 });
    // the level: rings of petals, their size, the fragments, the fractures
    const RINGS = evo >= 7 ? 3 : evo >= 4 ? 2 : 1, RS = (1.08 + 0.04 * (evo - 1)) * (evo >= 7 ? 1.22 : 1), NFRAG = [5, 6, 7, 9, 10, 11, 14][evo - 1], FRAC = evo >= 6, NEEDLE_L = 1.85 + 0.04 * (evo - 1), NEEDLE_W = 0.26 + 0.012 * (evo - 1), PN = [7, 9, 12];
    // the petals: ring, index, angle, open order, and after the burst a flight
    const petals = []; for (let r = 0; r < RINGS; r++) for (let p = 0; p < PN[r]; p++) petals.push({ r, p, b: p / PN[r] * TAU + r * 0.37, sd: R1(r * 17 + p * 3.1), vx: 0, vy: 0, vz: 0, rot: 0, vr: 0 });
    const frags = []; for (let i = 0; i < NFRAG; i++) frags.push({ a0: R1(i * 2.1) * TAU, rr: 0.9 + R1(i * 5.3) * 1.3, z: 0.4 + R1(i * 7.7) * 1.4, sp: (0.5 + R1(i * 3.3) * 0.6) * (i % 2 ? 1 : -1), ph: R1(i * 9.1) * TAU, s: 0.5 + R1(i * 4.4) * 0.6 });
    const inkDrops = (px, py, k, rr, up) => { for (let i = 0; i < H.n(k); i++) { const q = Math.random() * TAU, d = (rr || 0.4) * Math.sqrt(Math.random()); H.P({ kind: 'smoke', x: px + Math.cos(q) * d, y: py + Math.sin(q) * d * 0.6, vx: Math.cos(q) * 0.5, vy: Math.sin(q) * 0.3 - (up || 0.5), life: 0.9, max: 0.9, size: 0.45, color: 'rgba(58,36,96,' }); } };
    const motes = (px, py, k, o) => H.burst(px, py, 'spark', k, Object.assign({ v: 4, life: 0.45, size: 1.8, color: [EDGE, ACC, ENERGY] }, o || {}));
    const shards = (px, py, k, o) => H.burst(px, py, 'shard', k, Object.assign({ v: 6, up: 2, g: 9, life: 0.55, size: 4, color: [SMOKE, PLUM, EDGE] }, o || {}));
    const thrustOf = (t, t0) => { const u = (t - t0 + 0.35) / 0.55; if (u < 0 || u > 1) return null; return u < 0.45 ? -H.ease.out(u / 0.45) * 0.6 : u < 0.65 ? -0.6 + 1.6 * H.ease.in((u - 0.45) / 0.2) : 1 - H.ease.out((u - 0.65) / 0.35); };
    H.add({ life: 4.4, x, y, thrust: [0, 0, 0, 0], vel: [0, 0, 0, 0], en: [0, 0, 0, 0], roll: [0, 0.8, 1.6, 2.4], flare: 0, burstT: -1, petals, frags,
      /* the floor: the sigil and its counter-turning wheel, a soft violet light under the aim, a flare at every strike */
      drawUnder(c, f, X, Y, T) {
        const k = H.fade(f, 0.6, 0.7), t = f.t; let pulse = 0; for (const [t0] of STRIKES) if (t > t0 && t < t0 + 0.35) pulse = Math.max(pulse, 1 - (t - t0) / 0.35);
        const bk = f.burstT >= 0 ? Math.max(0, 1 - (t - f.burstT) / 0.5) : 0, draw = Math.min(1, t / 0.9), rad = R * T * 1.08;
        c.save(); c.translate(X, Y); c.scale(1, H.GY); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = k * (0.28 + 0.2 * pulse + 0.5 * bk); blitSized(c, glowSprite(ENERGY), -rad * 0.8, -rad * 0.8, rad * 1.6, rad * 1.6);
        c.save(); c.rotate(a + Math.PI / 4 + t * 0.22); c.globalAlpha = k * draw * (0.62 + 0.3 * pulse + 0.4 * bk); const sg = sigilSpr(); c.drawImage(sg, -rad * 1.085, -rad * 1.085, rad * 2.17, rad * 2.17); c.restore();
        c.save(); c.rotate(-t * 0.5); c.globalAlpha = k * draw * (0.55 + 0.3 * pulse); const wh = wheelSpr(); c.drawImage(wh, -rad * 0.5, -rad * 0.5, rad, rad); c.restore();
        c.restore();
      },
      update(dt, f) {
        const t = f.t, old = f.thrust.slice();
        STRIKES.forEach(([t0, pr]) => { const th = thrustOf(t, t0); if (th == null) return; nd.forEach((n, i) => { if (n.pair === pr) f.thrust[i] = th; }); });
        if (t > ROSE) f.thrust = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) { const v = (f.thrust[i] - old[i]) / Math.max(1e-3, dt); f.vel[i] = v; f.en[i] += ((f.thrust[i] < 0 ? 0.5 - f.thrust[i] * 0.8 : f.thrust[i] > 0.2 ? 1 : 0.3) - f.en[i]) * Math.min(1, dt * 7); f.roll[i] += dt * (0.7 + Math.max(0, v) * 1.4 + Math.max(0, -v) * 0.3); }
        f.flare = Math.max(0, f.flare - dt * 4);
        // shadow mist: at the needles' points as they form, round the stem as the rose grows, everywhere after the burst
        if (t < 0.7 && Math.random() < 2.2 * H.Q()) { const n = nd[Math.floor(Math.random() * 4)]; inkDrops(x + Math.cos(n.b) * R, y + Math.sin(n.b) * R - 0.5, 1, 0.35, 0.8); }
        if (t > ROSE - 0.4 && t < BURST && Math.random() < 2.5 * H.Q()) inkDrops(x, y, 1, 0.8, 0.4);
        if (f.burstT >= 0) { const u = t - f.burstT; for (const p of f.petals) { p.vz -= 9 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; p.vx *= 1 - dt * 0.9; p.vy *= 1 - dt * 0.9; if (p.z < 0) { p.z = 0; p.vz = 0; p.vr *= 0.5; } }
          if (u < 0.5 && Math.random() < 2 * H.Q()) inkDrops(x, y, 1, R * 0.5, 0.6); }
      },
      draw(c, f, X, Y, T, gt) {
        const t = f.t, k = Math.min(1, f.life / 0.7), form = H.ease.out(Math.min(1, t / 0.5)), aim = H.ease.io(cl((t - 0.4) / 0.45)), nfade = t > ROSE ? Math.min(1, (t - ROSE) / 0.3) : 0, items = [];
        /* --- the needles --- */
        if (nfade < 1) nd.forEach((n, i) => {
          const th = f.thrust[i], rr = R * (1 + 0.25 * Math.max(0, -th)) - R * 0.85 * Math.max(0, th), bx = x + Math.cos(n.b) * rr, by = y + Math.sin(n.b) * rr;
          const inw = [Math.cos(n.b + Math.PI), Math.sin(n.b + Math.PI), 0], dir = GeoKit.norm(GeoKit.lerp3([0, 0, 1], inw, aim)), Z = 0.55 + 0.06 * (1 - aim) + Math.sin(t * 2.6 + i * 1.7) * 0.03 * (1 - Math.abs(th)), en = f.en[i], L = NEEDLE_L * form * (1 + 0.08 * Math.max(0, th)), w = NEEDLE_W * form;
          const sx = H.sx(bx), sy = H.sy(by) - Z * T, al = k * (1 - nfade) * petDim(sx + inw[0] * L * 0.5 * T, sy + inw[1] * L * 0.5 * T * H.GY, T, L * 0.5 * T) * Math.min(1, t / 0.12);
          items.push({ y: H.sy(by) + inw[1] * L * 0.5 * T * H.GY, draw() {
            // the trail of a fast thrust: a soft violet streak back along the path, gone as soon as the point stops
            const v = f.vel[i], TP = drawThorn(c, T, bx, by, Z, dir, f.roll[i], L, w, en, al, FRAC);
            if (TP && v > 1.5) { const kv = cl(v / 7); c.save(); c.globalAlpha = al; H.ray(c, TP.tp[0], TP.tp[1], TP.sa + Math.PI, L * T * (0.5 + 0.7 * kv), T * 0.3, EDGE, 0.5 * kv); H.ray(c, TP.tp[0], TP.tp[1], TP.sa + Math.PI, L * T * 0.6 * kv, T * 0.12, ACC, 0.5 * kv); c.restore(); }
            // forming: the mist it condenses from, a halo
            if (t < 0.7) { const q = 1 - t / 0.7; GeoKit.glow(c, sx, sy - L * T * 0.4, T * (0.6 + 0.6 * q), ENERGY, al * 0.45 * q); } } });
        });
        /* --- the strike flare at the centre --- */
        if (f.flare > 0) { const q = f.flare, cy = Y - T * 0.55; c.save(); c.globalAlpha = k * q * petDim(X, cy, T, T * 0.4); GeoKit.glow(c, X, cy, T * (1.1 + (1 - q) * 1.2), EDGE, 0.6); H.core(c, X, cy, T * (0.14 + (1 - q) * 0.2), ENERGY, ACC, q); c.restore(); }
        /* --- the fragments orbiting the heart (seen through the whole cast, thickest round the rose) --- */
        const fk = Math.min(1, t / 0.8) * (t > ROSE - 0.4 ? 1 : 0.55) * (f.burstT >= 0 ? Math.max(0, 1 - (t - f.burstT) / 0.4) : 1) * k, fs = fragSpr();
        if (fk > 0.02) for (const g of f.frags) { const b = g.a0 + gt * g.sp, rr = g.rr * T * (t > ROSE - 0.4 ? 0.8 : 1), fx = X + Math.cos(b) * rr, fy = Y - g.z * T + Math.sin(b) * rr * 0.45 + Math.sin(gt * 2 + g.ph) * T * 0.06, s = T * 0.22 * g.s; items.push({ y: Y + Math.sin(b) * rr * 0.45, draw() { c.save(); c.globalAlpha = fk * petDim(fx, fy, T, s); c.translate(fx, fy); c.rotate(gt * g.sp * 2 + g.ph); c.drawImage(fs, -s, -s, s * 2, s * 2); c.restore(); } }); }
        items.sort((p, q) => p.y - q.y).forEach(it => it.draw());
        /* --- the rose --- */
        if (t > ROSE - 0.4) {
          const grow = H.ease.out(cl((t - ROSE + 0.4) / 0.4)), open = cl((t - ROSE + 0.1) / (BURST - ROSE + 0.1)), burst = f.burstT >= 0, bu = burst ? t - f.burstT : 0, shut = burst ? cl(bu / 0.07) : 0, gone = burst ? cl((bu - 0.07) / 0.75) : 0;
          const cy = Y - T * (0.5 + 0.85 * grow), roseR = T * 2.2 * RS, dimR = petDim(X, cy, T, roseR * 0.6), ka = k * dimR;
          if (gone < 1) {
            c.save(); c.globalAlpha = ka * (burst ? 1 - gone : 1);
            H.softShadow(c, X, Y, T * 1.3 * RS * grow, 0.3 * grow * (1 - gone));
            // the stem rises from the floor, bowed a little, thorned, two leaves
            if (!burst || gone < 0.6) { const sh = (Y - cy) * grow, bend = T * 0.18, p0 = [X + bend * 0.2, Y], p1 = [X - bend, Y - sh * 0.55], p2 = [X, Y - sh]; c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = T * 0.12; c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); c.stroke(); c.strokeStyle = PLUM; c.lineWidth = T * 0.07; c.stroke(); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(EDGE, 0.55); c.lineWidth = T * 0.018; c.beginPath(); c.moveTo(p0[0] - T * 0.03, p0[1]); c.quadraticCurveTo(p1[0] - T * 0.03, p1[1], p2[0] - T * 0.03, p2[1]); c.stroke(); c.restore();
              for (let q = 0; q < 4; q++) { const u = 0.2 + q * 0.2, px = (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0], py = (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1], s = q % 2 ? 1 : -1; c.beginPath(); c.moveTo(px, py + T * 0.04); c.lineTo(px + s * T * 0.12, py - T * 0.06); c.lineTo(px, py - T * 0.05); c.closePath(); c.fillStyle = PLUM; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(); }
              const lf = leafSpr(); for (const [u, s, rot] of [[0.42, -1, -1.1], [0.66, 1, 1.0]]) { const px = (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0], py = (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1], lw = T * 0.34 * grow, lh = T * 0.7 * grow; c.save(); c.translate(px, py); c.rotate(rot * (0.6 + 0.4 * grow)); c.drawImage(lf, -lw / 2, -lh, lw, lh); c.restore(); } }
            // the heart's light behind everything
            const beat = 0.5 + 0.5 * Math.sin(gt * 9); GeoKit.glow(c, X, cy, roseR * (0.9 + 0.3 * open) * grow, ENERGY, (0.18 + 0.12 * open + 0.08 * beat * open) * (1 - gone)); if (burst && bu < 0.3) GeoKit.glow(c, X, cy, roseR * 1.6, ACC, 0.8 * (1 - bu / 0.3));
            // the petals, back to front, the heart between them
            const list = [];
            for (const p of f.petals) {
              const n = PN[p.r], ring = p.r, pr = T * (0.66 + ring * 0.42) * RS * grow;
              // unfolds in sequence: the inner ring first, round each ring in turn
              const o0 = (ring * 0.9 + (p.p / n) * 0.55) / (RINGS * 0.9 + 0.55), po = burst ? Math.max(0.12, 1 - shut) * (1 - gone * 0.3) : H.ease.out(cl((open - o0 * 0.65) / 0.35)) * 0.92 + 0.08;
              let ox = Math.cos(p.b) * pr, oy = Math.sin(p.b) * pr * 0.42, len = pr * (1.3 - ring * 0.08) * (0.55 + 0.45 * po), wid = len * 0.5, rot, sx = X, sy = cy + ring * T * 0.2 * RS, lean;
              if (burst && gone > 0) { sx = X + p.x * T; sy = Y + p.y * T * H.GY - p.z * T; rot = p.rot; lean = 1; }
              else { const out = Math.atan2(oy, ox) + Math.PI / 2; let d = out; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; rot = d * (0.08 + 0.6 * po); sx += ox * (0.15 + 0.6 * po); sy += oy * (0.15 + 0.6 * po); lean = 1 - 0.3 * Math.max(0, Math.sin(p.b)) * po; }
              list.push({ y: burst && gone > 0 ? sy + 1e3 : oy - ring * 0.01, draw: () => { c.save(); c.translate(sx, sy); c.rotate(rot); c.scale(1, lean); c.drawImage(petalSpr(ring), -wid / 2, -len, wid, len); c.restore(); } });
            }
            list.push({ y: 0, draw: () => { const r0 = T * 0.27 * RS * grow; H.sphere(c, X, cy - T * 0.05, r0, PLUM, SMOKE, VOID, { rimCol: EDGE, outline: false, spec: false }); c.strokeStyle = rgba(EDGE, 0.7); c.lineWidth = 1.4; c.beginPath(); c.arc(X, cy - T * 0.05, r0, 0, TAU); c.stroke(); H.core(c, X, cy - T * 0.05, r0 * (0.7 + 0.25 * open), ENERGY, ACC, (0.55 + 0.35 * open) * (1 - gone)); } });
            list.sort((p, q) => p.y - q.y).forEach(it => it.draw());
            c.restore();
          }
        }
      } });
    STRIKES.forEach(([t0, pr]) => H.X.after(t0, () => { nd.forEach(n => { if (n.pair === pr) H.hitLine(x + Math.cos(n.b) * R, y + Math.sin(n.b) * R, n.b + Math.PI, R * 0.95, 1.3, C.base * 1.5, C.dmgO({ kb: 2 })); }); H.hitArea(x, y, 0.9, C.base * 0.6, C.dmgO({ kb: 2 }));
      const F = H.fx.find(q => q.petals === petals); if (F) F.flare = 1; motes(x, y, 10, { v: 6, up: 2 }); shards(x, y, 5, { v: 4, up: 3, size: 3 }); H.X.ring(x, y, 0.2, 1.2, 0.3, EDGE, 0.3); H.X.light(x, y, 1.4, 0.2); H.X.shake(5, 0.12); H.X.sfx.whoosh(); H.X.hitstop(0.02); }));
    H.X.after(BURST, () => { H.hitArea(x, y, R, C.base * 4.4, C.dmgO({ kb: 6, stun: 0.5 })); H.X.boom(x, y, 2.2, EDGE, ACC, { n: 36, shake: 16, smoke: 6 }); H.X.ring(x, y, 0.3, R, 0.5, EDGE, 0.55); H.X.ring(x, y, 0.2, R * 0.6, 0.35, ACC, 0.3); H.X.light(x, y, R, 0.5); H.X.flash(0.25, '#D9C8FF'); H.X.hitstop(0.08); H.X.sfx.crash(); shards(x, y, 24, { v: 7, up: 4, size: 4.5, color: [PLUM, SMOKE, EDGE] });
      // the petals fly (tiles and tiles a second: out along their own angle, up a little, tumbling; farther at Celestial)
      const F = H.fx.find(q => q.petals === petals); if (F) { F.burstT = F.t; for (const p of F.petals) { const sp = (3 + p.sd * 2.5) * (evo >= 7 ? 1.9 : 1 + 0.08 * (evo - 1)); p.x = Math.cos(p.b) * (0.3 + p.r * 0.3); p.y = Math.sin(p.b) * (0.15 + p.r * 0.15); p.z = 1.25 + p.r * 0.1; p.vx = Math.cos(p.b) * sp; p.vy = Math.sin(p.b) * sp; p.vz = 2 + p.sd * 3; p.rot = Math.random() * TAU; p.vr = (Math.random() - 0.5) * 14; } }
      H.burst(x, y, 'petal', evo >= 7 ? 40 : 10 + evo * 2, { v: evo >= 7 ? 10 : 5, up: 3, g: 5, life: 1.2, size: 4.5, color: [PLUM, SMOKE, '#5A3A7C'] });
      inkDrops(x, y, 10, R * 0.5, 0.7); });
  };
})();
