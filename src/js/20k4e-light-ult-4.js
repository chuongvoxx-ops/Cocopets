/* ---------- Light (pink), reworked: Crescent Beam, Meteor Shower ----------
   Crescent Beam: a luminous pink crescent forms just ahead of the pet, tips forward; tiny stars spiral in between its
   tips while thin strings of light pull toward its focus, which swells into a pearl orb. A narrow line shoots out along
   the aim, then widens into one massive straight beam floating a little above the floor: a soft rose halo, a solid rose
   body, an opaque pearl-white centre and additive bloom over it, bright streaks racing forward through it, fine strands
   spiralling round its surface (brighter on the near side) and little hearts and stars streaming off its edges; a faint
   pink light trace on the floor beneath. The crescent stays at the source, slowly turning about the beam's axis (three
   nested crescents turning at different speeds at Celestial, with a broader, more layered beam). Every 0.25 s every
   monster in the beam takes Light damage (about 15 x base for one inside throughout) with a pink contact flash and
   glints scattering outward. Channel 4 s (Hatchling) .. 7 s (Celestial); at the end the beam narrows at the source and
   its remaining light streams forward and fades. Both ends are feathered; the whole beam dims smoothly if the pet
   walks into it.
   Meteor Shower: a field of small pink lights gathers high over the monsters; one by one they stretch into droplets and
   fall, each a pearl core with a long tapered pink trail (slightly different angles, lengths and sizes for depth),
   separated streaks first, building to a dense glittering rain. Each impact: a brief pink light pool, a small expanding
   ring, a burst of five-pointed stars, and from every third one little hearts floating up. Meteors favour the monsters
   (round-robin), counts and area grow with evo; Celestial adds a field of suspended star glints, overlapping waves and
   a final rapid sweep across the area that leaves the floor shimmering. Damage per monster is capped at about the house
   total (a lone boss is not hit by every meteor at full value). All heavy shapes are cached sprites. */
(() => {
  const U = ELEM_IMPL.light.ult, TAU = Math.PI * 2; delete U.guilloche; delete U.mirrors;
  const ROSE = '#FF5CCB', CANDY = '#FF8FDB', MAG = '#E83EAC', BLUSH = '#FFD4EE', PEARL = '#FFF4FC', DEEP = '#8F2D73', LAV = '#D5C4FF';
  let H;
  const cl = u => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  function heartPath(g, cx, cy, s) { g.beginPath(); for (let i = 0; i <= 72; i++) { const t = i / 72 * TAU, x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); if (i) g.lineTo(cx + x * s, cy + y * s); else g.moveTo(cx + x * s, cy + y * s); } g.closePath(); }
  const gl = (c, col, x, y, r, a, sq) => { if (!(a > 0.005) || r < 1) return; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r * (sq || 1), r * 2, r * 2 * (sq || 1)); };
  const mixA = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

  /* ---- shared little sprites: a heart with thickness, a five-pointed star, a ring ---- */
  const miniHeart = col => fxSprite('lu4mh' + col, 40, 40, g => { let gr = g.createRadialGradient(20, 20, 0, 20, 20, 20); gr.addColorStop(0, rgbaS(col, 0.5)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 40, 40); const s = 0.78, cy = 20 - 2.5 * s; gr = g.createRadialGradient(16, 15, 0, 20, 21, 12); gr.addColorStop(0, PEARL); gr.addColorStop(0.45, col); gr.addColorStop(1, MAG); heartPath(g, 20, cy, s); g.fillStyle = gr; g.fill(); g.strokeStyle = rgbaS(DEEP, 0.6); g.lineWidth = 1; g.stroke(); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(13.5, 13, 2.2, 1.3, -0.6, 0, TAU); g.fill(); });
  const miniSide = () => fxSprite('lu4ms', 40, 40, g => { const s = 0.78; heartPath(g, 20, 20 - 2.5 * s, s); g.fillStyle = '#B8378F'; g.fill(); g.strokeStyle = rgbaS(DEEP, 0.8); g.lineWidth = 1; g.stroke(); });
  const starSpr = col => fxSprite('lu4st' + col, 32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, rgbaS(col, 0.7)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.4 : 8.5, b = -Math.PI / 2 + i * Math.PI / 5; i ? g.lineTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r) : g.moveTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r); } g.closePath(); g.fillStyle = PEARL; g.fill(); g.strokeStyle = rgbaS(col, 0.9); g.lineWidth = 1; g.stroke(); });
  const ringSpr = () => fxSprite('lu4ring', 128, 128, (g, W) => { const c0 = W / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); [[0, 'rgba(255,92,203,0)'], [0.62, 'rgba(255,92,203,0)'], [0.78, 'rgba(255,92,203,0.5)'], [0.86, 'rgba(255,244,252,1)'], [0.92, 'rgba(255,143,219,0.55)'], [1, 'rgba(255,92,203,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, W, W); });
  const poolSpr = () => fxSprite('lu4pool', 128, 128, (g, W) => { const c0 = W / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); [[0, 'rgba(255,244,252,0.75)'], [0.22, 'rgba(255,212,238,0.5)'], [0.55, 'rgba(255,92,203,0.3)'], [1, 'rgba(255,92,203,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, W, W); });

  /* little hearts and stars: a local list in world coordinates (x, y on the floor, z up), drawn above the floor */
  function bitsDraw(c, B, t, kF) {
    const T = H.X.Tz();
    for (const b of B) { const u = b.t / b.life, al = Math.min(1, u * 6) * (1 - u) * (1 - u * 0.3); if (al < 0.02) continue; const bx = H.sx(b.x), by = H.sy(b.y) - b.z * T, r = b.s * T * (b.kind === 'h' ? 1.6 : 1.3), k = al * kF(bx, by); if (k < 0.02) continue;
      if (b.kind === 'h') { const cs = Math.cos(t * b.sp + b.ph), ws = 0.25 + 0.75 * Math.abs(cs), dep = r * 0.16 * Math.sin(t * b.sp + b.ph); c.globalCompositeOperation = 'source-over'; c.globalAlpha = k;
        c.drawImage(miniSide(), bx - r * ws + dep, by - r, r * 2 * ws, r * 2); c.drawImage(miniHeart(b.col), bx - r * ws, by - r, r * 2 * ws, r * 2); }
      else { c.globalCompositeOperation = 'lighter'; c.globalAlpha = k; c.save(); c.translate(bx, by); c.rotate(t * 1.5 + b.ph); c.drawImage(starSpr(b.col), -r, -r, r * 2, r * 2); c.restore(); } }
  }
  function bitsStep(B, dt) { for (let i = B.length - 1; i >= 0; i--) { const b = B[i]; b.t += dt; if (b.t >= b.life) { B.splice(i, 1); continue; } const k = Math.exp(-b.drag * dt); b.vx *= k; b.vy *= k; b.vz = b.vz * Math.exp(-0.4 * dt) - (b.grav || 0) * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z = Math.max(0, b.z + b.vz * dt); } }
  const addB = (B, x, y, z, o) => B.push(Object.assign({ x, y, z, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 0.12, col: CANDY, kind: 'h', sp: 2 + Math.random() * 3, ph: Math.random() * TAU, drag: 1.2 }, o));
  // the pet's head on screen, and a smooth dimming weight near it
  const petK = (T, amt) => { const pX = H.sx(H.me.x), pY = H.sy(H.me.y) - T * 0.46; return (px, py) => 1 - amt * (1 - sstep(T * 0.55, T * 1.35, Math.hypot(px - pX, (py - pY) * 1.3))); };

  /* ================= Crescent Beam ================= */
  /* beam cross-sections, along x (64 px), across y (128 px); cap = alpha ramps up along x (the feathered ends) */
  const LAYERS = [
    q => [mixA(hexRGB(CANDY), hexRGB(MAG), sstep(0, 0.9, q)), Math.exp(-q * q * 3.2) * 0.75 * (1 - sstep(0.8, 1, q))],   // 0 halo (additive)
    q => [q < 0.45 ? mixA(hexRGB(CANDY), hexRGB(ROSE), q / 0.45) : mixA(hexRGB(ROSE), hexRGB(MAG), (q - 0.45) / 0.55), (1 - sstep(0.76, 1, q)) * (0.62 - 0.2 * q) + Math.exp(-Math.pow((q - 0.82) / 0.07, 2)) * 0.32],   // 1 body glow (additive)
    q => [mixA(hexRGB(PEARL), hexRGB(BLUSH), sstep(0.2, 1, q)), Math.exp(-q * q * 4.5) * (1 - sstep(0.75, 1, q))],   // 2 core glow (additive)
    q => [q < 0.5 ? mixA(hexRGB(CANDY), hexRGB(ROSE), q / 0.5) : mixA(hexRGB(ROSE), hexRGB(MAG), (q - 0.5) / 0.5), 0.85 * (1 - sstep(0.3, 1, q)) + 0.0],   // 3 solid rose body
    q => [q < 0.5 ? mixA([255, 255, 255], hexRGB(PEARL), q / 0.5) : mixA(hexRGB(BLUSH), hexRGB(CANDY), (q - 0.5) / 0.5), 1 - sstep(0.55, 1, q)]];   // 4 solid pearl core
  const profSpr = (k, cap) => fxSprite('lu4prof' + k + (cap ? 'c' : ''), 64, 128, (g, W, Hh) => {
    const im = g.createImageData(W, Hh), d = im.data;
    for (let y = 0; y < Hh; y++) { const q = Math.abs(y + 0.5 - Hh / 2) / (Hh / 2), [col, a] = LAYERS[k](q);
      for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, ca = cap ? sstep(0, 1, (x + 0.5) / W) : 1; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = Math.round(255 * cl(a * ca)); } }
    g.putImageData(im, 0, 0); });
  /* a forward streak: pearl centre, faded at both ends, brighter toward its head (+x) */
  const flowSpr = col => fxSprite('lu4flow|' + col, 96, 12, (g, W, Hh) => { const im = g.createImageData(W, Hh), d = im.data, P = [255, 250, 253], Cc = hexRGB(col);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const u = (x + 0.5) / W, q = Math.abs(y + 0.5 - Hh / 2) / (Hh / 2), al = Math.pow(u, 1.4) * (1 - sstep(0.82, 1, u)) * Math.exp(-q * q * 4), cc = mixA(Cc, P, Math.exp(-q * q * 10)), i = (y * W + x) * 4; d[i] = cc[0]; d[i + 1] = cc[1]; d[i + 2] = cc[2]; d[i + 3] = Math.round(255 * cl(al * 1.2)); }
    g.putImageData(im, 0, 0); });
  /* the crescent: an arc of radius 80 px round the focus (130, 128), thickest at its back, tips forward (+x); a radial
     shading from a pearl inner edge through candy to a rose-magenta outer edge, a fine pearl line, a baked soft glow */
  const CSW = 176, CSH = 256, CFX = 136, CFY = 128, CRR = 80, CA = 1.2, CTH = 28;
  const crescentSpr = () => fxSprite('lu4cres', CSW, CSH, g => {
    const path = (th, rr) => { g.beginPath(); const N = 48; for (let i = 0; i <= N; i++) { const u = i / N, b = Math.PI - CA + 2 * CA * u, w = th * Math.pow(Math.sin(Math.PI * u), 0.75) + 0.6; const r = rr + w / 2; i ? g.lineTo(CFX + Math.cos(b) * r, CFY + Math.sin(b) * r) : g.moveTo(CFX + Math.cos(b) * r, CFY + Math.sin(b) * r); }
      for (let i = N; i >= 0; i--) { const u = i / N, b = Math.PI - CA + 2 * CA * u, w = th * Math.pow(Math.sin(Math.PI * u), 0.75) + 0.6; const r = rr - w / 2; g.lineTo(CFX + Math.cos(b) * r, CFY + Math.sin(b) * r); } g.closePath(); };
    // the baked glow: the same shape, thicker and fainter, several times
    for (const [th, a] of [[CTH * 3.2, 0.06], [CTH * 2.4, 0.08], [CTH * 1.7, 0.12]]) { path(th, CRR); g.fillStyle = rgbaS(ROSE, a); g.fill(); }
    let gr = g.createRadialGradient(CFX, CFY, CRR - CTH / 2, CFX, CFY, CRR + CTH / 2);
    [[0, PEARL], [0.22, BLUSH], [0.5, CANDY], [0.78, ROSE], [1, MAG]].forEach(s => gr.addColorStop(s[0], s[1]));
    path(CTH, CRR); g.fillStyle = gr; g.fill(); g.strokeStyle = rgbaS(DEEP, 0.55); g.lineWidth = 1.4; g.stroke();
    // inner luminosity and a fine pearl line just inside the middle
    g.globalCompositeOperation = 'lighter'; path(CTH * 0.45, CRR - CTH * 0.12); g.fillStyle = 'rgba(255,212,238,0.45)'; g.fill();
    g.strokeStyle = 'rgba(255,244,252,0.9)'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.arc(CFX, CFY, CRR - CTH * 0.18, Math.PI - CA * 0.82, Math.PI + CA * 0.82); g.stroke(); });

  U.crescentbeam = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), L = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, a = C.a, ca = Math.cos(a), sa = Math.sin(a);
    const CH = [4, 4.4, 4.8, 5.5, 5.9, 6.3, 7][ev - 1], HW = [0.8, 0.84, 0.88, 1.0, 1.05, 1.1, 1.38][ev - 1] * C.K, MAXL = [10, 10.5, 11, 12, 12.5, 13, 15][ev - 1];
    const FO = L === 3 ? 1.75 : 1.5, Z = 0.6, G0 = 0.95, W0 = 1.22, A0 = 1.5, A1 = A0 + CH, FOLD = 0.9, END = A1 + FOLD, TICK = 0.25, NT = Math.round(CH / TICK);
    const dmg = C.base * 15 * C.K * (1 + 0.08 * (ev - 1)) / NT;
    const Fx = me.x + ca * FO, Fy = me.y + sa * FO;
    // the reach: up to the first wall
    let LEN = MAXL; for (let s = 0.3; s < MAXL; s += 0.2) if (H.X.blocked(Fx + ca * s, Fy + sa * s, 0.08, 0)) { LEN = Math.max(2, s + 0.2); break; }
    H.X.banner('CRESCENT BEAM', '', ROSE, 1.4); if (H.X.sfx && H.X.sfx.hum) H.X.sfx.hum();
    // the gathering stars and strings, in the beam's frame (tiles: u forward, v across)
    const GS = [], GL = []; { const n = [12, 16, 22][L - 1]; for (let i = 0; i < n; i++) GS.push({ r: 1.1 + 1.3 * R1(i * 3.1), b: R1(i * 7.7) * TAU, t0: 0.05 + 0.4 * R1(i * 1.3), sp: (R1(i * 5.9) < 0.5 ? 1 : -1) * (1.6 + R1(i * 2.2)), col: i % 4 === 3 ? LAV : i % 2 ? BLUSH : PEARL });
      const m = [5, 6, 8][L - 1]; for (let i = 0; i < m; i++) { const b = (i / m - 0.5) * 2.6 + (R1(i * 9.1) - 0.5) * 0.3; GL.push({ b, r: 1.8 + 0.8 * R1(i * 4.3), bend: (R1(i * 6.6) - 0.5) * 1.6, t0: 0.15 + 0.3 * R1(i * 2.9) }); } }
    const SPIR = [2, 3, 4][L - 1], NFL = [12, 16, 24][L - 1], B = [];
    const warm = [() => profSpr(0), () => profSpr(0, 1), () => profSpr(1), () => profSpr(1, 1), () => profSpr(2), () => profSpr(2, 1), () => profSpr(3), () => profSpr(3, 1), () => profSpr(4), () => profSpr(4, 1), crescentSpr, () => flowSpr(BLUSH), () => flowSpr(CANDY), () => miniHeart(CANDY), () => miniHeart(ROSE), () => miniHeart(BLUSH), miniSide, () => starSpr(BLUSH), () => starSpr(ROSE), () => starSpr(LAV)];
    H.add({ life: END + 0.05, x: Fx, y: Fy, wi: 0, nt: 0, pu: 0, acc: 0, fl0: false, fl1: false,
      update(dt, f) {
        const t = f.t; for (let q = 0; q < 4 && f.wi < warm.length; q++) warm[f.wi++]();
        f.pu = Math.max(0, f.pu - dt * 4);
        if (!f.fl0 && t >= W0) { f.fl0 = true; H.flareAt(Fx + ca * 0.2, Fy + sa * 0.2 - Z, 1.0 + 0.25 * L, 0.25, PEARL);
          for (let k = 0; k < H.n(12); k++) { const b = a + (Math.random() - 0.5) * 2.2, v = 3 + Math.random() * 3; H.P({ kind: k % 3 ? 'spark' : 'star', x: Fx, y: Fy - Z, vx: Math.cos(b) * v, vy: Math.sin(b) * v, life: 0.45, max: 0.45, size: 2 + Math.random() * 1.4, color: k % 2 ? BLUSH : ROSE, drag: 2.2 }); } }
        // the ticks: everything in the beam, a contact flash and glints scattering outward from each
        while (f.nt < NT && t >= A0 + TICK / 2 + f.nt * TICK) { f.nt++; f.pu = 1;
          for (const m of H.living()) { const rx = m.x - Fx, ry = m.y - Fy, al = rx * ca + ry * sa, of = -rx * sa + ry * ca; if (al < -m.r || al > LEN + m.r || Math.abs(of) > HW + m.r) continue;
            H.X.hitMon(m, dmg, C.dmgO());
            if (f.nt % 2 === 0 || m.boss) { H.flareAt(m.x, m.y - 0.4, 0.45 + 0.06 * L, 0.12, BLUSH); H.P({ kind: 'glow', x: m.x, y: m.y - 0.35, vx: 0, vy: 0, life: 0.22, max: 0.22, size: 0.8 + (m.r || 0.4), color: ROSE, alpha: 0.75 }); }
            const sd = of >= 0 ? 1 : -1; for (let k = 0; k < H.n(3); k++) { const b = a + sd * (Math.PI / 2) * (0.5 + Math.random() * 0.6), v = 2.5 + Math.random() * 2.5; H.P({ kind: k === 2 ? 'star' : 'spark', x: m.x, y: m.y - 0.35, vx: Math.cos(b) * v, vy: Math.sin(b) * v - 0.6, life: 0.35 + Math.random() * 0.2, max: 0.55, size: 1.6 + Math.random() * 1.2, color: k % 2 ? PEARL : CANDY, drag: 2.2 }); } } }
        // hearts and stars streaming from the beam's outer edges
        if (t >= A0 - 0.2 && t < A1) { f.acc += dt * [10, 14, 20][L - 1] * H.Q();
          while (f.acc >= 1) { f.acc--; const s = 0.6 + Math.random() * (LEN - 1), sd = Math.random() < 0.5 ? 1 : -1, heart = Math.random() < 0.55, ox = -sa * sd, oy = ca * sd;
            addB(B, Fx + ca * s + ox * HW * 0.85, Fy + sa * s + oy * HW * 0.85, Z + (oy < 0 ? 0.15 : -0.1) * 0, { vx: ox * (0.5 + Math.random() * 0.4) + ca * (0.8 + Math.random()), vy: oy * (0.5 + Math.random() * 0.4) * 0.6 + sa * (0.8 + Math.random()), vz: 0.35 + Math.random() * 0.4, drag: 1.4, life: 0.9 + Math.random() * 0.6, s: heart ? 0.09 + Math.random() * 0.05 : 0.09 + Math.random() * 0.06, kind: heart ? 'h' : 's', col: heart ? (Math.random() < 0.5 ? CANDY : Math.random() < 0.5 ? ROSE : BLUSH) : (Math.random() < 0.25 ? LAV : BLUSH) }); } }
        // the end: a ring of hearts and stars lifts off the crescent
        if (!f.fl1 && t >= A1) { f.fl1 = true; const n = 8 + 3 * L; for (let k = 0; k < n; k++) { const b = k / n * TAU; addB(B, Fx + Math.cos(b) * 0.5, Fy + Math.sin(b) * 0.3, Z, { vx: Math.cos(b) * 0.8, vy: Math.sin(b) * 0.5, vz: 0.7 + 0.4 * R1(k), life: 1.0, s: 0.12, kind: k % 3 === 2 ? 's' : 'h', col: k % 2 ? CANDY : BLUSH }); } }
        bitsStep(B, dt);
      },
      drawUnder(c, f, X, Y, T) {
        // the light trace on the floor under the beam
        const t = f.t, on = t < W0 ? 0 : t < A0 ? sstep(W0, A0, t) : t < A1 ? 1 : 1 - sstep(A1, A1 + FOLD * 0.8, t); if (on < 0.01 || !profSpr(0, 1)) return;
        const x0 = t > A1 ? LEN * T * H.ease.in(cl((t - A1) / FOLD)) : 0, x1 = LEN * T, w = HW * T * 3.4;
        c.save(); c.globalCompositeOperation = 'lighter'; c.translate(X, Y); c.rotate(a); c.scale(1, 0.75); const cp = Math.min(T * 2.2, (x1 - x0) * 0.4);
        if (x1 - x0 > 2) { c.globalAlpha = on * 0.32; c.drawImage(profSpr(0, 1), x0, -w / 2, cp, w); c.drawImage(profSpr(0), x0 + cp, -w / 2, x1 - x0 - 2 * cp, w); c.save(); c.translate(x1, 0); c.scale(-1, 1); c.drawImage(profSpr(0, 1), 0, -w / 2, cp, w); c.restore(); }
        c.restore();
        gl(c, ROSE, X, Y, T * 1.4, on * 0.3, H.GY);
      },
      draw(c, f, X, Y, T, tg) {
        const t = f.t; if (!(T > 0) || !crescentSpr()) return;
        const Y0 = Y - Z * T, pX = H.sx(me.x), pY = H.sy(me.y) - T * 0.46;
        // the phases: thin line shooting out, widening (a touch of overshoot), channel, the fold streaming forward
        const thin = Math.max(2.5, T * 0.1), full = HW * T * 2;
        let bw = 0, x0 = 0, x1 = 0, ba = 0;
        if (t >= G0 && t < W0) { const u = (t - G0) / (W0 - G0); bw = thin; x1 = LEN * T * H.ease.out(cl(u / 0.8)); ba = 0.7 + 0.3 * u; }
        else if (t >= W0 && t < A0) { const u = (t - W0) / (A0 - W0); bw = lerp(thin, full, H.ease.back(u)); x1 = LEN * T; ba = 1; }
        else if (t >= A0 && t < A1) { bw = full * (1 + 0.02 * Math.sin(tg * 5.3) + 0.035 * f.pu); x1 = LEN * T; ba = 1; }
        else if (t >= A1) { const u = cl((t - A1) / FOLD); bw = full * (1 - 0.55 * H.ease.io(u)); x0 = LEN * T * H.ease.in(u) * 0.92; x1 = LEN * T; ba = 1 - sstep(0.55, 1, u); }
        // the pet's head in the beam's frame: the whole beam dims smoothly if the pet stands in it
        const pu0 = (pX - X) * ca + (pY - Y0) * sa, pv0 = -(pX - X) * sa + (pY - Y0) * ca;
        const DIM = 1 - 0.6 * (1 - sstep(bw * 0.5, bw * 0.5 + T * 0.9, Math.abs(pv0))) * sstep(x0 - T, x0 + T * 0.2, pu0) * (1 - sstep(x1, x1 + T, pu0));
        c.save(); c.translate(X, Y0); c.rotate(a);
        const wk = bw / full, FL = 0.9 + 0.05 * Math.sin(t * 23) + 0.04 * Math.sin(t * 37 + 1.3);
        // a layer from x0 to x1, w wide: feathered caps at both ends (a short one at the source)
        const lay = (k, w, al, add) => { if (!(al > 0.005) || w < 0.5 || x1 - x0 < 2) return; c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = Math.min(1, al * DIM);
          const ln = x1 - x0, ca0 = Math.min(T * (t > A1 ? 1.6 : 0.45), ln * 0.3), cb = Math.min(T * 2.4, ln * 0.35);
          c.drawImage(profSpr(k, 1), x0, -w / 2, ca0, w); c.drawImage(profSpr(k), x0 + ca0, -w / 2, ln - ca0 - cb, w); c.save(); c.translate(x1, 0); c.scale(-1, 1); c.drawImage(profSpr(k, 1), 0, -w / 2, cb, w); c.restore(); };
        if (bw > 0 && ba > 0.01) {
          lay(0, bw * (L === 3 ? 2.7 : 2.3), ba * (0.13 + 0.07 * Math.sin(t * 5.5)) * wk, 1);
          lay(0, bw * (L === 3 ? 1.85 : 1.7), ba * FL * 0.5, 1);
          lay(3, bw * 0.92, ba * sstep(0.2, 0.7, wk) * 0.9, 0);
          lay(1, bw, ba * FL * (0.7 + 0.1 * f.pu), 1);
          if (L === 3) { lay(1, bw * 0.66, ba * FL * 0.35, 1); lay(3, bw * 0.6, ba * sstep(0.3, 0.8, wk) * 0.35, 0); }
          lay(4, Math.max(bw * (L === 3 ? 0.42 : 0.38), thin), ba * Math.min(1, 0.85 + 0.15 * FL) * (t < W0 ? 1 : sstep(0.1, 0.5, wk)), 0);
          lay(2, Math.max(bw * (L === 3 ? 0.55 : 0.48), thin * 1.4), ba * FL * (0.85 + 0.15 * f.pu), 1);
          // bright streaks racing forward through it
          if (wk > 0.3) { c.globalCompositeOperation = 'lighter'; const n = H.n(NFL), span = x1 - x0;
            for (let i = 0; i < n; i++) { const v = (R1(i * 5.3 + 2) * 2 - 1) * 0.72, sp = (14 + 9 * R1(i * 2.9)) * T, sl = T * (1.6 + 1.8 * R1(i * 8.1)), sw = T * (i % 3 ? 0.13 : 0.2) * (L === 3 ? 1.2 : 1);
              const xx = x0 + ((R1(i * 1.7) * (span + sl) + t * sp) % (span + sl)) - sl, al = ba * sstep(0.3, 0.7, wk) * 0.75 * sstep(x0, x0 + T, xx) * (1 - sstep(x1 - T * 2.5, x1, xx + sl)) * DIM; if (al < 0.02) continue;
              c.globalAlpha = al; c.drawImage(flowSpr(i % 3 ? BLUSH : CANDY), xx, v * bw / 2 - sw / 2, sl, sw); } }
          // fine strands spiralling round the beam's surface: brighter where they pass on its near side
          if (wk > 0.5) { c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const lam = T * (L === 3 ? 2.6 : 2.2), st = T * 0.3, amp = bw * 0.5 * (L === 3 ? 0.96 : 0.92), aa = ba * sstep(0.5, 0.9, wk) * DIM;
            for (let k = 0; k < SPIR; k++) { const ph = k / SPIR * TAU, col = k === 3 ? LAV : k % 2 ? CANDY : BLUSH; let px = null, py = 0;
              for (let x = x0 + T * 0.4; x <= x1 + 0.1; x += st) { const th = TAU * x / lam - t * 9 + ph, y = Math.sin(th) * amp, dep = Math.cos(th); if (px != null) { const e = sstep(x0, x0 + T * 1.5, x) * (1 - sstep(x1 - T * 2.6, x1, x)), al = aa * e * (dep > 0 ? 0.3 + 0.55 * dep : 0.12);
                  if (al > 0.02) { c.globalAlpha = al; c.strokeStyle = dep > 0.6 ? PEARL : col; c.lineWidth = dep > 0 ? 1.8 : 1.1; c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke(); } } px = x; py = y; } } }
        }
        // the crescent(s) at the source, slowly turning about the beam's axis; the pearl orb at the focus
        const cin = t < 0.4 ? H.ease.back(cl(t / 0.4)) : 1, cA = Math.min(1, t / 0.25) * (t > A1 ? 1 - sstep(0.15, 0.85, (t - A1) / FOLD) : 1);
        if (cA > 0.01) { const rings = L === 3 ? [[0.62, 0.55, 0.5], [0.85, -0.32, 1], [1.12, 0.22, 0.65]] : L === 2 ? [[0.8, -0.3, 1], [1.02, 0.25, 0.45]] : [[0.82, 0.3, 1]];
          c.globalCompositeOperation = 'source-over';
          for (let i = 0; i < rings.length; i++) { const [rr, spd, al] = rings[i], psi = t * spd + i * 0.9, ys = Math.max(0.32, Math.abs(Math.cos(psi))) * (Math.cos(psi) < 0 ? -1 : 1), k = rr * T * cin / CRR;
            c.save(); c.rotate(0.06 * Math.sin(t * 1.3 + i)); c.scale(1, ys); c.globalAlpha = cA * al * DIM; c.drawImage(crescentSpr(), -CFX * k, -CFY * k, CSW * k, CSH * k); c.restore();
            // glints at the tips
            c.globalCompositeOperation = 'lighter'; for (const sd of [-1, 1]) gl(c, PEARL, Math.cos(Math.PI - CA) * rr * T * cin * 1.02, sd * Math.sin(CA) * rr * T * cin * ys * 1.02, T * 0.22, cA * al * (0.6 + 0.3 * Math.sin(t * 6 + i + sd)) * DIM); c.globalCompositeOperation = 'source-over'; } }
        c.globalCompositeOperation = 'lighter';
        // the gathering: strings of light pulled toward the focus, stars spiralling in between the tips
        if (t < W0 + 0.1) { c.lineCap = 'round';
          for (const s of GL) { const u = cl((t - s.t0) / 0.55); if (u <= 0 || u >= 1) continue; const P = w => { const r = s.r * (1 - w) * T, b = s.b + s.bend * w * (1 - w); return [Math.cos(b) * r, Math.sin(b) * r]; };
            const hd = H.ease.in(u), tl = Math.max(0, hd - 0.35), n = 8; for (const [lw, al, col] of [[3.2, 0.25, ROSE], [1.3, 0.8, BLUSH]]) { c.strokeStyle = col; c.lineWidth = lw; c.globalAlpha = al * Math.sin(Math.PI * u) * DIM; c.beginPath(); for (let j = 0; j <= n; j++) { const p = P(lerp(tl, hd, j / n)); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); } }
          for (const s of GS) { const u = cl((t - s.t0) / (G0 - s.t0)); if (u <= 0 || u >= 1) continue; const r = s.r * Math.pow(1 - u, 1.3) * T, b = s.b + s.sp * u * 2, x = Math.cos(b) * r, y = Math.sin(b) * r * 0.8, z = T * (0.12 + 0.1 * (1 - u));
            c.globalAlpha = Math.min(1, u * 5) * (1 - sstep(0.85, 1, u)) * DIM; c.save(); c.translate(x, y); c.rotate(t * 3 + s.b); c.drawImage(starSpr(s.col), -z, -z, z * 2, z * 2); c.restore(); } }
        { const orb = t < G0 ? sstep(0.25, G0, t) : t < A1 ? 1 : 1 - sstep(A1, A1 + FOLD * 0.6, t); if (orb > 0.01) { const r = T * (0.3 + 0.2 * orb + (t > W0 ? 0.25 * wk : 0)) * (1 + 0.08 * Math.sin(t * 9) + 0.15 * f.pu);
          gl(c, ROSE, 0, 0, r * 2.4, orb * 0.5 * DIM); gl(c, BLUSH, 0, 0, r * 1.3, orb * 0.7 * DIM); gl(c, PEARL, 0, 0, r * 0.75, orb * DIM); } }
        c.restore();
        c.save(); bitsDraw(c, B, t, () => DIM); c.restore();
      } });
  };

  /* ================= Meteor Shower ================= */
  /* a falling meteor's tail: tapered, faded toward its tail (x = 0), pearl down the middle near the head (x = W) */
  const tailSpr = () => fxSprite('lu4tail', 128, 24, (g, W, Hh) => { const im = g.createImageData(W, Hh), d = im.data, P = [255, 248, 252], Ro = hexRGB(ROSE), Mg = hexRGB(MAG), Cn = hexRGB(CANDY);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const u = (x + 0.5) / W, hw = 1.2 + 9.5 * Math.pow(u, 0.75), q = Math.abs(y + 0.5 - Hh / 2) / hw, al = Math.pow(u, 1.25) * Math.exp(-q * q * 2.4) * (1 - sstep(0.94, 1, u) * 0.6);
      const body = u < 0.5 ? mixA(Mg, Ro, u / 0.5) : mixA(Ro, Cn, (u - 0.5) / 0.5), cc = mixA(body, P, Math.exp(-q * q * 7) * sstep(0.35, 1, u)), i = (y * W + x) * 4; d[i] = cc[0]; d[i + 1] = cc[1]; d[i + 2] = cc[2]; d[i + 3] = Math.round(255 * cl(al)); }
    g.putImageData(im, 0, 0); });
  const coreSpr = () => fxSprite('lu4core', 32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,244,252,1)'], [0.55, 'rgba(255,212,238,0.7)'], [1, 'rgba(255,143,219,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });

  U.meteorshower = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), L = ev >= 7 ? 3 : ev >= 4 ? 2 : 1;
    const AR = [2.6, 2.8, 3.0, 3.5, 3.7, 3.9, 4.7][ev - 1] * C.K, N = [22, 26, 30, 38, 44, 50, 66][ev - 1], NSW = L === 3 ? 18 : 0;
    const F0 = 0.85, D = [3.0, 3.05, 3.1, 3.2, 3.25, 3.3, 3.0][ev - 1], RI = 0.8 + 0.05 * L;
    const DK = C.base * C.K * (1 + 0.08 * (ev - 1)), DPM = DK * 15 / Math.max(4, 0.22 * N), CAP = DK * 16;
    // the centre: the aim, pulled onto the monster group near it
    let cx = C.tx, cy = C.ty; { const g0 = H.near(cx, cy, AR * 1.4); if (g0.length) { let sx = 0, sy = 0; for (const m of g0) { sx += m.x; sy += m.y; } cx = lerp(cx, sx / g0.length, 0.6); cy = lerp(cy, sy / g0.length, 0.6); } const w = H.walk(cx, cy); cx = w.x; cy = w.y; }
    const tgts = H.sortNear(cx, cy).filter(m => Math.hypot(m.x - cx, m.y - cy) < AR + 0.6);
    H.X.banner('METEOR SHOWER', '', ROSE, 1.4); if (H.X.sfx && H.X.sfx.hum) H.X.sfx.hum();
    // the meteors: launch times thin at first, then a dense rain; Celestial's last ones sweep across the area
    const M = [], rnd = Math.random, slant0 = (rnd() < 0.5 ? -1 : 1) * 0.32;
    const pick = (i, sweepU) => { if (sweepU != null) { const sa = Math.atan2(cy - me.y, cx - me.x) + Math.PI / 2, s = (sweepU - 0.5) * 2 * AR * 0.9, o = (rnd() - 0.5) * AR * 0.9; return [cx + Math.cos(sa) * s + Math.cos(sa - Math.PI / 2) * o, cy + Math.sin(sa) * s + Math.sin(sa - Math.PI / 2) * o, null]; }
      if (tgts.length && rnd() < 0.6) { const m = tgts[i % tgts.length], b = rnd() * TAU, r = rnd() * 0.35; return [m.x + Math.cos(b) * r, m.y + Math.sin(b) * r, m]; }
      for (let k = 0; k < 6; k++) { const b = rnd() * TAU, r = Math.sqrt(rnd()) * AR, x = cx + Math.cos(b) * r, y = cy + Math.sin(b) * r; if (Math.hypot(x - me.x, y - me.y) > 1.1) return [x, y, null]; } return [cx, cy, null]; };
    for (let i = 0; i < N; i++) { const sw = i >= N - NSW, u = sw ? (i - (N - NSW)) / Math.max(1, NSW - 1) : i / Math.max(1, N - NSW);
      let t0 = sw ? F0 + D + 0.06 + u * 0.75 : F0 + D * Math.pow(u, 1.55) * (L === 3 ? 0.95 : 1);
      if (L === 3 && !sw) t0 += 0.12 * Math.sin(u * 19);   // overlapping waves
      const [x, y, m] = pick(i, sw ? u : null), far = cl((cy + AR - y) / (2 * AR + 0.01));
      M.push({ x, y, m, t0: Math.max(F0, t0), fd: (L === 3 && (sw || i % 3 === 0) ? 0.55 : 0.48) + 0.1 * rnd(), h0: 6.5 + 2.5 * rnd(), sl: slant0 + (rnd() - 0.5) * 0.18, tl: (L === 3 && (sw || i % 2) ? 3.6 : 2.2) + 1.4 * rnd(), w: (0.8 + 0.35 * rnd()) * (1 - 0.18 * far) * (sw ? 1.2 : 1), heart: i % 3 === 0, done: false, app: 0 }); }
    for (const q of M) q.app = Math.max(0, Math.min(q.t0 - 0.25, q.t0 - 1.1 - rnd() * 0.5) * (q.t0 > F0 + 1.4 ? 1 : 0.4));
    const LAST = Math.max(...M.map(q => q.t0 + q.fd)), POOL = L === 3 ? 1.5 : 0.8, END = LAST + Math.max(POOL, 1.2) + 0.1;
    const GLN = L === 3 ? 28 : L === 2 ? 10 : 0, GLT = []; for (let i = 0; i < GLN; i++) { const b = rnd() * TAU, r = Math.sqrt(rnd()) * AR * 1.1; GLT.push({ x: cx + Math.cos(b) * r, y: cy + Math.sin(b) * r, z: 1.6 + 4 * rnd(), ph: rnd() * TAU, sp: 2 + 3 * rnd(), s: 0.08 + 0.08 * rnd(), col: i % 4 === 0 ? LAV : i % 2 ? BLUSH : PEARL }); }
    const dealt = new Map(), IMP = [], B = [];
    const warm = [tailSpr, coreSpr, ringSpr, poolSpr, () => miniHeart(CANDY), () => miniHeart(ROSE), () => miniHeart(BLUSH), miniSide, () => starSpr(BLUSH), () => starSpr(ROSE), () => starSpr(PEARL), () => starSpr(LAV)];
    H.add({ life: END, x: cx, y: cy, wi: 0,
      update(dt, f) {
        const t = f.t; for (let q = 0; q < 3 && f.wi < warm.length; q++) warm[f.wi++]();
        for (const q of M) { if (q.done || t < q.t0 + q.fd) continue; q.done = true;
          if (q.m && !q.m.dead) { q.x = lerp(q.x, q.m.x, 0.7); q.y = lerp(q.y, q.m.y, 0.7); }   // a little homing onto its monster
          for (const m of H.near(q.x, q.y, RI)) { const d0 = dealt.get(m) || 0; if (d0 >= CAP) continue; const d = Math.min(DPM, CAP - d0); dealt.set(m, d0 + d); H.X.hitMon(m, d, C.dmgO()); H.flareAt(m.x, m.y - 0.35, 0.4, 0.1, BLUSH); }
          IMP.push({ x: q.x, y: q.y, t, w: q.w });
          H.P({ kind: 'glow', x: q.x, y: q.y, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 1.2 * q.w, color: ROSE, alpha: 0.6 });
          const ns = H.n(5); for (let k = 0; k < ns; k++) { const b = k / ns * TAU + rnd() * 0.5, v = 1.1 + rnd() * 0.9; addB(B, q.x, q.y, 0.1, { vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6, vz: 1.8 + rnd() * 1.2, grav: 4.5, drag: 1.2, life: 0.55 + rnd() * 0.3, s: 0.08 + rnd() * 0.05, kind: 's', col: k % 3 === 0 ? PEARL : k % 3 === 1 ? BLUSH : (L >= 2 && k === 2 ? LAV : ROSE) }); }
          if (q.heart) for (let k = 0; k < (L === 3 ? 2 : 1); k++) addB(B, q.x + (rnd() - 0.5) * 0.3, q.y, 0.15, { vx: (rnd() - 0.5) * 0.25, vz: 0.7 + rnd() * 0.4, drag: 1.5, life: 1.2 + rnd() * 0.5, s: 0.1 + rnd() * 0.05, col: rnd() < 0.5 ? CANDY : rnd() < 0.5 ? ROSE : BLUSH });
          if (rnd() < 0.25 && H.X.sfx && H.X.sfx.sparkle) H.X.sfx.sparkle(); }
        while (IMP.length && t - IMP[0].t > POOL + 0.1) IMP.shift();
        bitsStep(B, dt);
      },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, kF = petK(T, 0.6); c.save(); c.globalCompositeOperation = 'lighter';
        // a faint rose sheen over the target area while the shower lasts
        const on = sstep(0.2, F0 + 0.4, t) * (1 - sstep(LAST, END, t)); gl(c, ROSE, X, Y, AR * T * 1.15, on * 0.14, H.GY);
        for (const e of IMP) { const u = (t - e.t) / POOL, ex = H.sx(e.x), ey = H.sy(e.y), k = kF(ex, ey); if (u >= 1 || k < 0.02) continue;
          // the light pool: a bright flash that settles into a lingering shimmer
          const fl = 1 - sstep(0, 0.35 / POOL, u), sh = (1 - u) * (1 - u) * (0.45 + 0.15 * Math.sin(t * 13 + e.x * 7)), pr = T * e.w * (0.55 + 0.35 * sstep(0, 0.3 / POOL, u));
          c.save(); c.translate(ex, ey); c.scale(1, H.GY); c.globalAlpha = Math.min(1, (fl * 0.9 + sh * 0.5)) * k; c.drawImage(poolSpr(), -pr, -pr, pr * 2, pr * 2);
          // the small ring expanding out (its first 0.4 s)
          const ru = (t - e.t) / 0.4; if (ru < 1) { const rr = T * e.w * (0.25 + 0.9 * H.ease.out(ru)); c.globalAlpha = (1 - ru) * 0.95 * k; c.drawImage(ringSpr(), -rr, -rr, rr * 2, rr * 2); }
          c.restore(); }
        c.restore();
      },
      draw(c, f, X, Y, T) {
        const t = f.t; if (!(T > 0) || !tailSpr()) return; const kF = petK(T, 0.55);
        c.save(); c.globalCompositeOperation = 'lighter';
        // Celestial (and Adept, fewer): suspended star glints over the field
        for (const s of GLT) { const a0 = sstep(0.3, 1.2, t) * (1 - sstep(END - 1, END, t)) * (0.45 + 0.55 * Math.abs(Math.sin(t * s.sp + s.ph))); if (a0 < 0.03) continue; const x = H.sx(s.x), y = H.sy(s.y) - s.z * T, r = s.s * T * 1.4;
          c.globalAlpha = a0 * kF(x, y); c.save(); c.translate(x, y); c.rotate(t * 0.8 + s.ph); c.drawImage(starSpr(s.col), -r, -r, r * 2, r * 2); c.restore(); }
        // the meteors: lights waiting in the sky, then falling with long tapered trails
        for (const q of M) { if (q.done || t < q.app) continue; const gx = H.sx(q.x), gy = H.sy(q.y), sx0 = gx - q.sl * q.h0 * T, sy0 = gy - q.h0 * T;
          if (t < q.t0) { // waiting: a small twinkling light, swelling just before it drops
            const a0 = sstep(q.app, q.app + 0.35, t), sw = 1 + 0.5 * sstep(q.t0 - 0.25, q.t0, t), tw = 0.7 + 0.3 * Math.sin(t * 9 + q.h0 * 3);
            gl(c, ROSE, sx0, sy0, T * 0.32 * q.w * sw, a0 * 0.55 * tw); gl(c, PEARL, sx0, sy0, T * 0.12 * q.w * sw, a0 * 0.9 * tw); continue; }
          const u = cl((t - q.t0) / q.fd), e = Math.pow(u, 1.5), hx = lerp(sx0, gx, e), hy = lerp(sy0, gy, e), dx = gx - sx0, dy = gy - sy0, dl = Math.hypot(dx, dy) || 1;
          const tl = q.tl * T * (0.25 + 0.75 * sstep(0, 0.45, u)), tw = T * 0.36 * q.w, k = kF(hx, hy);
          c.save(); c.translate(hx, hy); c.rotate(Math.atan2(dy, dx));
          c.globalAlpha = 0.45 * k; c.drawImage(tailSpr(), -tl * 1.05, -tw * 1.3, tl * 1.05, tw * 2.6);   // soft wide glow pass
          c.globalAlpha = 0.95 * k; c.drawImage(tailSpr(), -tl, -tw / 2, tl, tw);
          c.restore();
          gl(c, ROSE, hx, hy, T * 0.5 * q.w, 0.75 * k); gl(c, BLUSH, hx, hy, T * 0.26 * q.w, 0.6 * k);
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = k; const cr = T * 0.19 * q.w; c.drawImage(coreSpr(), hx - cr, hy - cr, cr * 2, cr * 2); c.globalCompositeOperation = 'lighter'; }
        // impact flashes up off the floor (brief)
        for (const e of IMP) { const u = (t - e.t) / 0.22; if (u >= 1) continue; const ex = H.sx(e.x), ey = H.sy(e.y) - T * 0.12, k = kF(ex, ey); gl(c, PEARL, ex, ey, T * 0.55 * e.w * (0.6 + 0.4 * u), (1 - u) * 0.8 * k); }
        c.restore();
        c.save(); bitsDraw(c, B, t, kF); c.restore();
      } });
  };
})();
