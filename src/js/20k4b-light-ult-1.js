/* ---------- Light (pink), reworked: Rainbow Heart Attack, Holy Judgement ----------
   Rainbow Heart Attack: a narrow pink ribbon curls up from the pet and traces a great heart outline, which fills with
   light and gains thickness; it tilts its tip to the floor, rises a little and starts to spin like a top, then glides
   through the monsters on smooth sweeping curves, leaning into its turns, trailing strings of pastel light from which
   little hearts and star glints peel away. A contact sends a pulse from the tip to the lobes, a heart-shaped flash at
   the contact point, and the strings tighten and relax. 1 heart (3 strings) / 2 at Adept (4 strings, a travelling rim
   glint, orbiting stars) / 3 at Celestial (5 strings, a loose formation that separates, a final staggered pass, a slowing
   spin and nested expanding heart outlines as they dissolve).
   Holy Judgement: a pink heart draws itself on the floor where the pet stands (from its point up both sides to the
   cleft), fills with soft light; pearl-white cores in pointed pink glows gather over the pet, launch upward in a fan
   and home down onto the monsters, each bursting in an upright love heart that expands, brightens at its rim and pops
   into little hearts, stars and dust over a floor ripple. 20 / 30 / 40 lights (Adept: two fans of fifteen; Celestial: four quick groups of ten).
   The thick heart: one cached face (pearl core, candy body, rose rim, deep shading low right, a lit front highlight),
   one cached side silhouette for the thickness band, eight cached moving sheen frames, outline/fill/small-heart/star
   sprites; a heart turning about its vertical axis is its face squashed by |cos| over a stack of side copies offset
   by the thickness x sin, so edge-on it is a deep pink band with a pearl rim line, never nothing. */
(() => {
  const U = ELEM_IMPL.light.ult, TAU = Math.PI * 2;
  for (const k of ['firstdawn', 'orrery', 'lanterns']) delete U[k];
  let H;
  const ROSE = '#FF5CCB', CANDY = '#FF8FDB', MAG = '#E83EAC', BLUSH = '#FFD4EE', PEARL = '#FFF4FC', DEEP = '#8F2D73', LAV = '#D5C4FF', MINT = '#BFFFEA', PEACH = '#FFCDB4';
  const cl = u => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));

  /* ---- the heart curve: lobes up, point down; unit: x in [-0.94, 0.94], y in [-0.71, 1] (the point at y = 1) ---- */
  const HP = (() => { const N = 96, pts = []; for (let i = 0; i <= N; i++) { const t = i / N * TAU, s = Math.sin(t); pts.push([16 * s * s * s / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.15]); } return pts; })();   // centred: y in about [-0.56, 1.15]
  const HN = HP.length - 1, HHALF = HN / 2;   // index 0 the cleft, HHALF the point
  function heartPath(g, s, ox, oy, sy) { g.beginPath(); for (let i = 0; i < HN; i++) { const p = HP[i]; const x = (ox || 0) + p[0] * s, y = (oy || 0) + p[1] * s * (sy || 1); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
  /* the outline drawn partway: from the point up both sides by progress u (1 = joined at the cleft) */
  function partHeart(c, s, ox, oy, sy, u) { const k = Math.round(HHALF * cl(u)); if (k < 1) return; c.beginPath(); for (let i = HHALF - k; i <= HHALF + k; i++) { const p = HP[i]; const x = ox + p[0] * s, y = oy + p[1] * s * sy; i === HHALF - k ? c.moveTo(x, y) : c.lineTo(x, y); } }
  const HPt = (i, s) => { const p = HP[((i % HN) + HN) % HN]; return [p[0] * s, p[1] * s]; };

  /* ---- cached sprites: 160 px square, heart unit 64 px, centre (80, 72) ---- */
  const SW = 160, SU = 64, SCX = 80, SCY = 74;
  const faceSpr = () => fxSprite('lu1face', SW, SW, g => {
    g.translate(SCX, SCY);
    // body: pearl core, blush, candy, rose, magenta at the edge
    let gr = g.createRadialGradient(-SU * 0.18, -SU * 0.05, SU * 0.04, 0, SU * 0.12, SU * 1.15);
    [[0, PEARL], [0.18, BLUSH], [0.42, CANDY], [0.7, ROSE], [0.92, MAG], [1, DEEP]].forEach(s => gr.addColorStop(s[0], s[1]));
    heartPath(g, SU); g.fillStyle = gr; g.fill();
    g.save(); heartPath(g, SU); g.clip();
    // the shadow side, low right
    gr = g.createLinearGradient(-SU * 0.6, -SU * 0.5, SU * 0.8, SU * 1.0); gr.addColorStop(0, 'rgba(143,45,115,0)'); gr.addColorStop(0.5, 'rgba(143,45,115,0.08)'); gr.addColorStop(1, 'rgba(143,45,115,0.7)'); g.fillStyle = gr; g.fillRect(-SU * 1.2, -SU, SU * 2.4, SU * 2.3);
    // a reflected rim light along the lower right edge
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,143,219,0.45)'; g.lineWidth = SU * 0.09; heartPath(g, SU * 0.93, SU * 0.03, SU * 0.02); g.stroke();
    // inner luminosity
    gr = g.createRadialGradient(0, SU * 0.18, 0, 0, SU * 0.18, SU * 0.62); gr.addColorStop(0, 'rgba(255,244,252,0.55)'); gr.addColorStop(0.5, 'rgba(255,212,238,0.2)'); gr.addColorStop(1, 'rgba(255,212,238,0)'); g.fillStyle = gr; g.fillRect(-SU, -SU, SU * 2, SU * 2.2);
    g.globalCompositeOperation = 'source-over';
    // the lit front highlights on the lobes (light from the upper left)
    for (const [x, y, rx, ry, a] of [[-0.45, -0.22, 0.3, 0.17, 0.85], [0.42, -0.28, 0.16, 0.09, 0.5]]) { g.save(); g.translate(x * SU, y * SU); g.rotate(-0.6); g.scale(rx * SU, ry * SU); const hg = g.createRadialGradient(0, 0, 0, 0, 0, 1); hg.addColorStop(0, `rgba(255,244,252,${a})`); hg.addColorStop(0.6, `rgba(255,244,252,${a * 0.35})`); hg.addColorStop(1, 'rgba(255,244,252,0)'); g.fillStyle = hg; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore(); }
    g.strokeStyle = 'rgba(255,244,252,0.9)'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); for (let i = 8; i <= 20; i++) { const p = HPt(HN - i, SU * 0.86); i === 8 ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1]); } g.stroke();
    g.restore();
    // contour: a deep pink edge, a bright inner line
    heartPath(g, SU); g.strokeStyle = 'rgba(143,45,115,0.95)'; g.lineWidth = 3.2; g.lineJoin = 'round'; g.stroke();
    heartPath(g, SU * 0.955, 0, SU * 0.01); g.strokeStyle = 'rgba(255,212,238,0.55)'; g.lineWidth = 1.4; g.stroke(); });
  /* the side of the thickness band: deep pink, lighter at the top */
  const sideSpr = o => fxSprite('lu1side' + (o ? 'o' : ''), SW, SW, g => { g.translate(SCX, SCY); const gr = g.createLinearGradient(0, -SU * 0.6, 0, SU * 1.15); gr.addColorStop(0, '#E85CB8'); gr.addColorStop(0.45, MAG); gr.addColorStop(1, DEEP); heartPath(g, SU); g.fillStyle = gr; g.fill(); if (o) { g.strokeStyle = 'rgba(110,30,88,0.9)'; g.lineWidth = 3.2; g.stroke(); } });
  /* a moving sheen: a broad soft band across the face at one of eight positions (added on top) */
  const NSH = 8;
  const sheenSpr = i => fxSprite('lu1sheen' + i, SW, SW, g => { g.translate(SCX, SCY); heartPath(g, SU); g.clip(); const p = (i / (NSH - 1) * 2 - 1) * SU * 0.95; g.rotate(0.35); const gr = g.createLinearGradient(p - SU * 0.32, 0, p + SU * 0.32, 0); gr.addColorStop(0, 'rgba(255,244,252,0)'); gr.addColorStop(0.5, 'rgba(255,244,252,0.6)'); gr.addColorStop(1, 'rgba(255,244,252,0)'); g.fillStyle = gr; g.fillRect(-SW, -SW, SW * 2, SW * 2); });
  /* a glowing heart outline (impact pops, dissolving outlines) */
  const lineSpr = () => fxSprite('lu1line', SW, SW, g => { g.translate(SCX, SCY); g.lineJoin = 'round'; for (const [col, lw] of [['rgba(255,92,203,0.18)', 16], ['rgba(255,92,203,0.35)', 9], ['rgba(255,143,219,0.8)', 4.5], ['rgba(255,244,252,1)', 1.8]]) { heartPath(g, SU * 0.9); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); } });
  /* a soft heart of light (the ground heart's fill, the burst's body) */
  const fillSpr = () => fxSprite('lu1fill', SW, SW, g => { g.translate(SCX, SCY); for (let k = 0; k < 5; k++) { heartPath(g, SU * (1.02 - k * 0.12), 0, SU * k * 0.03); g.fillStyle = `rgba(255,92,203,${0.1 + k * 0.03})`; g.fill(); } const gr = g.createRadialGradient(0, SU * 0.2, 0, 0, SU * 0.2, SU * 0.6); gr.addColorStop(0, 'rgba(255,244,252,0.75)'); gr.addColorStop(0.5, 'rgba(255,212,238,0.3)'); gr.addColorStop(1, 'rgba(255,212,238,0)'); heartPath(g, SU * 0.8, 0, SU * 0.05); g.fillStyle = gr; g.fill(); });
  /* a little heart (sparkles): a glow, a coloured heart, a pearl centre */
  const smallSpr = col => fxSprite('lu1sh' + col, 40, 40, g => { let gr = g.createRadialGradient(20, 20, 0, 20, 20, 20); gr.addColorStop(0, rgbaS(col, 0.55)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 40, 40); gr = g.createRadialGradient(17, 17, 0, 20, 21, 10); gr.addColorStop(0, PEARL); gr.addColorStop(0.45, col); gr.addColorStop(1, mixS(col, DEEP, 0.35)); heartPath(g, 10, 20, 19); g.fillStyle = gr; g.fill(); g.strokeStyle = rgbaS(DEEP, 0.6); g.lineWidth = 1; g.stroke(); });
  /* a five-pointed star glint */
  const starSpr = col => fxSprite('lu1st' + col, 32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, rgbaS(col, 0.7)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.4 : 8.5, b = -Math.PI / 2 + i * Math.PI / 5; i ? g.lineTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r) : g.moveTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r); } g.closePath(); g.fillStyle = PEARL; g.fill(); g.strokeStyle = rgbaS(col, 0.9); g.lineWidth = 1; g.stroke(); });
  /* a pointed glow with a pearl core (Holy Judgement's light), head at (48, 16), tail to the left */
  const cometSpr = () => fxSprite('lu1comet', 64, 32, g => { let gr = g.createLinearGradient(4, 0, 50, 0); gr.addColorStop(0, 'rgba(255,92,203,0)'); gr.addColorStop(0.6, 'rgba(255,92,203,0.55)'); gr.addColorStop(1, 'rgba(255,143,219,0.9)'); g.beginPath(); g.moveTo(2, 16); g.quadraticCurveTo(36, 6, 50, 9); g.lineTo(50, 23); g.quadraticCurveTo(36, 26, 2, 16); g.closePath(); g.fillStyle = gr; g.fill();
    gr = g.createRadialGradient(48, 16, 0, 48, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,244,252,0.95)'); gr.addColorStop(0.55, 'rgba(255,92,203,0.55)'); gr.addColorStop(1, 'rgba(255,92,203,0)'); g.fillStyle = gr; g.fillRect(30, 0, 34, 32);
    g.beginPath(); g.moveTo(62, 16); g.lineTo(48, 12.5); g.lineTo(48, 19.5); g.closePath(); g.fillStyle = 'rgba(255,212,238,0.8)'; g.fill(); });
  function mixS(h1, h2, k) { const a = hexRGB(h1), b = hexRGB(h2); return '#' + [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k).toString(16).padStart(2, '0')).join(''); }
  function blitC(c, img, x, y, w, h, a, add) { if (!(a > 0.01) || w < 0.5) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - w / 2, y - h / 2, w, h); c.restore(); }
  const glowC = (c, x, y, r, col, a) => blitC(c, glowSprite(col), x, y, r * 2, r * 2, a, true);

  /* the thick heart at screen (x, y) (its visual centre), hp px tall, spin th about its vertical axis, lean (rad),
     alpha a; lit adds a pulse; sheenOff shifts the moving highlight; rimU (0..1 or null) puts a glint on the rim */
  function thickHeart(c, x, y, hp, th, lean, a, lit, rimU) {
    if (!(a > 0.01) || hp < 3) return;
    const s = hp / (SU * 1.7), cs = Math.cos(th), sn = Math.sin(th), ws = Math.max(0.07, Math.abs(cs)), d = hp * 0.2, near = (cs >= 0 ? 1 : -1) * d / 2 * sn, NK = Math.max(4, Math.min(12, Math.round(d * Math.abs(sn) / 2.5))), face = faceSpr(), side = sideSpr(0), sideO = sideSpr(1);
    c.save(); c.translate(x, y); c.rotate(lean || 0); c.translate(0, -0.3 * SU * s);
    // controlled outer glow, and a soft bloom behind
    glowC(c, 0, 0, hp * 0.95, ROSE, 0.42 * a); glowC(c, 0, hp * 0.05, hp * 0.55, CANDY, 0.25 * a);
    c.globalAlpha = a;
    // the thickness band: side copies from the far face to the near one
    for (let k = 0; k <= NK; k++) { const ox = lerp(-near, near, k / NK) * 0.999; c.drawImage(k ? side : sideO, ox - SCX * s * ws, -SCY * s, SW * s * ws, SW * s); }
    if (Math.abs(cs) < 0.45) { // edge-on: a pearl line down the lit side of the band
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (0.45 - Math.abs(cs)) * 1.6; c.strokeStyle = BLUSH; c.lineWidth = Math.max(1, hp * 0.025); c.beginPath(); c.moveTo(near * 0.2, -hp * 0.32); c.quadraticCurveTo(near * 0.2 - d * 0.1, hp * 0.15, near * 0.2, hp * 0.6); c.stroke(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; }
    if (Math.abs(cs) > 0.08) {
      c.drawImage(face, near - SCX * s * ws, -SCY * s, SW * s * ws, SW * s);
      // the moving highlight across the curved front (follows the turn)
      const si = Math.max(0, Math.min(NSH - 1, Math.round((sn * (cs >= 0 ? 1 : -1) * 0.5 + 0.5) * (NSH - 1))));
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (0.35 + 0.35 * Math.abs(cs)); c.drawImage(sheenSpr(si), near - SCX * s * ws, -SCY * s, SW * s * ws, SW * s);
      if (lit > 0.01) { c.globalAlpha = Math.min(1, a * lit * 0.8); c.drawImage(face, near - SCX * s * ws, -SCY * s, SW * s * ws, SW * s); }
      c.globalCompositeOperation = 'source-over';
    }
    if (rimU != null) { const p = HPt(Math.floor(rimU * HN), SU * s); glowC(c, near + p[0] * ws, p[1], hp * 0.16, PEARL, 0.8 * a); }
    c.restore();
  }
  /* local particles: little hearts and stars that drift and fade (thinned by Fewer effects through the spawners) */
  function bits() { const L = []; return { L,
    add(x, y, z, o) { L.push(Object.assign({ x, y, z, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 0.18, col: ROSE, kind: 'h', rot: 0, g: 0, drag: 1.2 }, o)); },
    step(dt) { for (let i = L.length - 1; i >= 0; i--) { const p = L[i]; p.t += dt; if (p.t >= p.life) { L.splice(i, 1); continue; } const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * k - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); } },
    draw(c, T, fa) { for (const p of L) { const u = p.t / p.life, a = Math.min(1, u * 6) * (1 - u) * (fa == null ? 1 : fa), r = p.s * T * (p.kind === 'h' ? 1.6 : 1.3) * (1 - 0.3 * u); if (a < 0.02) continue; const X = H.sx(p.x), Y = H.sy(p.y) - p.z * T; c.save(); c.globalAlpha = a; c.globalCompositeOperation = p.kind === 'h' ? 'source-over' : 'lighter'; c.translate(X, Y); if (p.rot) c.rotate(p.rot * Math.sin(p.t * 3)); c.drawImage(p.kind === 'h' ? smallSpr(p.col) : starSpr(p.col), -r, -r, r * 2, r * 2); c.restore(); } } }; }
  const near = (x, y, r) => H.living().filter(m => Math.hypot(m.x - x, m.y - y) < r + m.r);

  /* ================= 1. Rainbow Heart Attack ================= */
  U.rainbowheart = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), N = [1, 1, 1, 2, 2, 2, 3][ev - 1], tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, NS = [3, 4, 5][tier - 1];
    const DK = C.base * C.K * (1 + 0.08 * (ev - 1)), PASS = 5, HIT = DK * 15 / (N * PASS), GAP = 0.55, HR = 0.78 + 0.06 * tier;   // hit radius (tiles)
    const TG0 = 1.35, TRAV = [5, 5.4, 5.8][tier - 1], HT = 1.85 + 0.12 * tier, Z0 = 0.15;   // HT: heart height in tiles
    H.X.banner('RAINBOW HEART ATTACK', '', ROSE, 1.4); H.X.sfx.hum();
    const a0 = C.a, fx0 = me.x + Math.cos(a0) * 1.9, fy0 = me.y + Math.sin(a0) * 1.9;
    const SC = [[ROSE, CANDY], [CANDY, PEARL], [ROSE, LAV], [MAG, PEACH], [CANDY, MINT]], B = bits(), pops = [];
    const hearts = []; for (let i = 0; i < N; i++) { const off = (i - (N - 1) / 2) * 1.7, px = -Math.sin(a0) * off, py = Math.cos(a0) * off, w = H.walk(fx0 + px, fy0 + py);
      hearts.push({ i, x: w.x, y: w.y, fx: w.x, fy: w.y, ox: px, oy: py, z: Z0, hd: a0 + (i - (N - 1) / 2) * 0.5, v: 0, th: 0, om: 0, lean: 0, turn: 0, t0: i * 0.14, tg: TG0 + i * 0.14, te: TG0 + i * 0.14 + TRAV, last: new Map(), cnt: new Map(), tgt: null, re: 0, side: i % 2 ? 1 : -1, commit: 0, hist: [], hT: 0, tight: 0, pulse: 9, flash: 0, sd: i * 7 + 3, gone: false }); }
    const END = hearts[N - 1].te + 1.3;
    function pick(hh, t) { const L = H.living(); if (!L.length) return null; const taken = new Set(hearts.filter(q => q !== hh && q.tgt).map(q => q.tgt));
      let best = null, bs = 1e9; for (const m of L) { const d = Math.hypot(m.x - hh.x, m.y - hh.y), lh = hh.last.get(m), recent = lh != null && t - lh < 1.4 ? 6 : 0, many = (hh.cnt.get(m) || 0) >= PASS ? 9 : 0, sc = d + recent + many + (taken.has(m) && L.length > 1 ? 3 : 0); if (sc < bs) { bs = sc; best = m; } } return best; }
    const free = (x, y) => !H.X.blocked(x, y, 0.35, 1);
    H.add({ life: END, x: me.x, y: me.y,
      update(dt, f) {
        const t = f.t; B.step(dt);
        for (let k = pops.length - 1; k >= 0; k--) { pops[k].t += dt; if (pops[k].t > 0.55) pops.splice(k, 1); }
        for (const hh of hearts) {
          const tl = t - hh.t0; hh.tight = Math.max(0, hh.tight - dt * 3); hh.pulse += dt; hh.flash = Math.max(0, hh.flash - dt * 2.5);
          // spin: starts as it forms, a top's whirl in flight, slowing at the end
          const omT = t < hh.tg - 0.35 ? 0 : t < hh.te - 0.5 ? 6.2 : Math.max(0.6, 6.2 * (1 - (t - hh.te + 0.5) / 1.1)); hh.om += (omT - hh.om) * Math.min(1, dt * 2.2); hh.th += hh.om * dt;
          hh.z = t < hh.tg ? Z0 + 0.25 * sm((tl - 0.9) / 0.5) : 0.4 + 0.07 * Math.sin(t * 2.3 + hh.i);
          if (t < hh.tg) { if (Math.random() < 0.8 * H.Q() && tl > 0.3) B.add(hh.x + (Math.random() - 0.5) * 1.4, hh.y + (Math.random() - 0.5) * 0.3, 0.3 + Math.random() * HT, { vz: 0.8 + Math.random(), life: 0.7 + Math.random() * 0.5, s: 0.08 + Math.random() * 0.06, kind: Math.random() < 0.5 ? 'h' : 's', col: Math.random() < 0.6 ? CANDY : BLUSH }); continue; }
          const flying = t < hh.te;
          // steering: smooth curves toward its monster; Celestial holds a loose formation for its first second
          if (flying) {
            if (!hh.tgt || hh.tgt.dead || t > hh.re || (tier === 3 && Math.abs(t - (hh.te - 1.3 + hh.i * 0.25)) < dt * 0.6)) { hh.tgt = pick(hh, t); hh.re = t + 2.2; }
            let gx, gy; const L = H.living();
            if (tier === 3 && t < hh.tg + 0.9 && L.length) { let cx = 0, cy = 0; for (const m of L) { cx += m.x; cy += m.y; } cx /= L.length; cy /= L.length; gx = cx + hh.ox * 0.8; gy = cy + hh.oy * 0.8; }
            else if (hh.tgt) { gx = hh.tgt.x; gy = hh.tgt.y; } else { gx = me.x + Math.cos(t * 0.7 + hh.i * 2) * 3.5; gy = me.y + Math.sin(t * 0.7 + hh.i * 2) * 2.5; }
            let want = Math.atan2(gy - hh.y, gx - hh.x);
            if (hh.commit > 0) { hh.commit -= dt; want = hh.hd + hh.side * 0.9; }
            // keep off the pet and away from the other hearts
            const pdx = hh.x - me.x, pdy = hh.y - me.y, pd = Math.hypot(pdx, pdy); if (pd < 1.1) want = Math.atan2(Math.sin(want) + pdy / pd * (1.1 - pd) * 1.5, Math.cos(want) + pdx / pd * (1.1 - pd) * 1.5);
            for (const o of hearts) { if (o === hh) continue; const ex = hh.x - o.x, ey = hh.y - o.y, e = Math.hypot(ex, ey) || 0.01; if (e < 1.5) want = Math.atan2(Math.sin(want) + ey / e * (1.5 - e), Math.cos(want) + ex / e * (1.5 - e)); }
            // round the walls: look ahead and bend toward the nearest open heading
            const LA = 1.1; if (!free(hh.x + Math.cos(want) * LA, hh.y + Math.sin(want) * LA)) { for (let k = 1; k <= 8; k++) { const sgn = k % 2 ? 1 : -1, b = want + sgn * Math.ceil(k / 2) * 0.4; if (free(hh.x + Math.cos(b) * LA, hh.y + Math.sin(b) * LA)) { want = b; break; } } }
            const dh = H.wrap(want - hh.hd), TR = 3.0, turn = Math.max(-TR, Math.min(TR, dh * 4)); hh.hd += turn * dt; hh.turn += (turn - hh.turn) * Math.min(1, dt * 4);
            const vT = 3.6 + 0.25 * tier - 0.9 * Math.min(1, Math.abs(turn) / TR); hh.v += (vT - hh.v) * Math.min(1, dt * 2);
          } else { hh.v *= Math.exp(-dt * 2.5); hh.turn *= Math.exp(-dt * 3); }
          const nx = hh.x + Math.cos(hh.hd) * hh.v * dt, ny = hh.y + Math.sin(hh.hd) * hh.v * dt; if (free(nx, ny)) { hh.x = nx; hh.y = ny; } else { hh.hd += 1.2 * hh.side; hh.v *= 0.6; }
          hh.lean = -hh.turn * 0.09;   // leans into its turns, straightens as it accelerates
          // the strings' path
          if (flying && t - hh.hT > 1 / 40) { hh.hT = t; hh.hist.push({ x: hh.x, y: hh.y, z: hh.z, t }); if (hh.hist.length > 52) hh.hist.shift(); }
          if (flying) {
            // sparkles peel from the strings
            if (hh.hist.length > 8 && Math.random() < (1.2 + tier * 0.8) * dt * 8 * H.Q()) { const p = hh.hist[Math.floor(Math.random() * (hh.hist.length - 6))], j = Math.floor(Math.random() * NS), col = SC[j][Math.random() < 0.5 ? 0 : 1];
              B.add(p.x + (Math.random() - 0.5) * 0.6, p.y + (Math.random() - 0.5) * 0.3, p.z + HT * (0.2 + Math.random() * 0.45), { vx: (Math.random() - 0.5) * 0.6, vz: 0.3 + Math.random() * 0.6, life: 0.5 + Math.random() * 0.9, s: 0.07 + Math.random() * 0.07, kind: Math.random() < 0.55 ? 'h' : 's', col: tier === 3 && Math.random() < 0.3 ? PEARL : col }); }
            // contacts: a per-monster repeat interval, a cap of passes, the strings tighten
            for (const m of near(hh.x, hh.y, HR)) { const lh = hh.last.get(m); if (lh != null && t - lh < GAP) continue; if ((hh.cnt.get(m) || 0) >= PASS + 1) continue;
              hh.last.set(m, t); hh.cnt.set(m, (hh.cnt.get(m) || 0) + 1); H.X.hitMon(m, HIT, C.dmgO()); hh.tight = 1; hh.pulse = 0; hh.flash = 1;
              const ux = (m.x + hh.x) / 2, uy = (m.y + hh.y) / 2; pops.push({ x: ux, y: uy, z: 0.6, t: 0 }); H.X.light(ux, uy, 1.6, 0.18);
              for (let q = 0; q < H.n(5); q++) B.add(ux, uy, 0.6, { vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 1.5, vz: 1 + Math.random() * 1.5, g: 1.5, life: 0.5 + Math.random() * 0.4, s: 0.09, kind: q % 2 ? 's' : 'h', col: q % 3 ? CANDY : BLUSH });
              if (m === hh.tgt) { hh.commit = 0.5; hh.side = -hh.side; hh.tgt = null; } }
          } else if (!hh.gone && t > hh.te + 0.25) { hh.gone = true; for (let q = 0; q < H.n(10); q++) { const b = q / 10 * TAU; B.add(hh.x + Math.cos(b) * 0.5, hh.y + Math.sin(b) * 0.25, hh.z + HT * 0.5, { vx: Math.cos(b) * 1.2, vz: 0.4 + Math.sin(b) * 0.6, life: 0.8 + Math.random() * 0.5, s: 0.08, kind: q % 2 ? 'h' : 's', col: [CANDY, BLUSH, LAV, PEARL][q % 4] }); } }
        }
      },
      drawUnder(c, f, X, Y, T, t) {
        t = f.t;
        // the soft moving pink reflection under each heart (light only)
        for (const hh of hearts) { const tl = t - hh.t0; let a = sm((tl - 0.6) / 0.6) * (1 - sm((t - hh.te - 0.1) / 0.6)); if (a < 0.02) continue; const hx = H.sx(hh.x), hy = H.sy(hh.y);
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * a; c.drawImage(glowSprite(ROSE), hx - T * 1.3, hy - T * 1.3 * H.GY, T * 2.6, T * 2.6 * H.GY);
          // a faint mirrored heart on the floor, squashed, swaying with the spin
          const s = HT * T * 0.55 / (SU * 1.7), ws = Math.max(0.15, Math.abs(Math.cos(hh.th))); c.globalAlpha = 0.22 * a; c.translate(hx, hy + T * 0.05); c.scale(ws, -H.GY * 0.6); c.drawImage(fillSpr(), -SCX * s, -SCY * s, SW * s, SW * s); c.restore(); }
      },
      draw(c, f, X, Y, T, t) {
        t = f.t; const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.5;
        // formation: a ribbon curls up from the pet and traces the heart, which fills with light
        for (const hh of hearts) { const tl = t - hh.t0; if (tl < 0 || tl > 1.4) continue; const s = HT * T / 1.7, hx = H.sx(hh.fx), hy = H.sy(hh.fy) - (Z0 + HT * 0.5) * T - 0.3 * s, tipX = hx, tipY = hy + s * 1.15;
          const uc = sm(tl / 0.45), uo = sm((tl - 0.35) / 0.55), fade = 1 - sm((tl - 1.0) / 0.4);
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
          if (uc > 0 && fade > 0) { // the curl
            const n = 24, k = Math.round(n * uc); c.beginPath(); for (let q = 0; q <= k; q++) { const u = q / n, bx = lerp(PX, tipX, u) + Math.sin(u * 7 + hh.i) * T * 0.5 * (1 - u), by = lerp(PY, tipY, u) - Math.sin(u * Math.PI) * T * 1.1; q ? c.lineTo(bx, by) : c.moveTo(bx, by); }
            const ca = fade * (1 - sm((tl - 0.6) / 0.4)); c.globalAlpha = 0.4 * ca; c.strokeStyle = ROSE; c.lineWidth = 6; c.stroke(); c.globalAlpha = 0.95 * ca; c.strokeStyle = PEARL; c.lineWidth = 1.8; c.stroke(); }
          if (uo > 0) { partHeart(c, s, hx, hy, 1, uo); c.globalAlpha = 0.45 * fade; c.strokeStyle = ROSE; c.lineWidth = 7; c.stroke(); c.globalAlpha = 0.95 * fade; c.strokeStyle = BLUSH; c.lineWidth = 2.2; c.stroke();
            const kk = Math.round(HHALF * uo); for (const j of [HHALF - kk, HHALF + kk]) { const p = HP[j]; glowC(c, hx + p[0] * s, hy + p[1] * s, T * 0.35, PEARL, 0.9 * fade * (uo < 1 ? 1 : 0.4)); } }
          c.restore(); }
        // the strings (drawn first: the hearts lead them)
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (const hh of hearts) { const L = hh.hist, nL = L.length; if (nL < 3) continue; const da = t < hh.te ? 1 : 1 - cl((t - hh.te) / 1.2), drift = t < hh.te ? 0 : (t - hh.te) * T * 0.5; if (da < 0.02) continue;
          const amp = (1 - 0.75 * hh.tight) * T * 0.55;
          for (let j = 0; j < NS; j++) { const lo = (j / Math.max(1, NS - 1) - 0.5) * 0.9, vo = 0.3 + 0.4 * R1(j * 3.3 + hh.sd), ph = j * 1.9 + hh.sd, pts = [];
            for (let q = nL - 1; q >= 0; q--) { const p = L[q], u = (nL - 1 - q) / 51, nx = q > 0 ? L[q].x - L[q - 1].x : 0, ny = q > 0 ? L[q].y - L[q - 1].y : 0, nn = Math.hypot(nx, ny) || 1, sx = H.sx(p.x), sy = H.sy(p.y) - (p.z + HT * vo) * T, w = Math.sin(u * 9 + ph + t * 3) * amp * Math.min(1, u * 4), lat = lo * HT * T * 0.4 * (1 - u * 0.5);
              pts.push([sx + (-ny / nn) * (lat + w), sy + (nx / nn) * (lat + w) * 0.6 + Math.cos(u * 6 + ph) * T * 0.15 * u - drift * u]); }
            const [c1, c2] = SC[j % 5], n = pts.length, CH = 4;
            for (let k = 0; k < CH; k++) { const i0 = Math.floor(k * (n - 1) / CH), i1 = Math.floor((k + 1) * (n - 1) / CH); if (i1 <= i0) continue; c.beginPath(); c.moveTo(pts[i0][0], pts[i0][1]); for (let q = i0 + 1; q <= i1; q++) c.lineTo(pts[q][0], pts[q][1]); const a = da * (1 - k / CH) * (0.85 + 0.3 * hh.tight);
              c.globalAlpha = 0.28 * a; c.strokeStyle = c1; c.lineWidth = 5.5 - k * 0.8; c.stroke(); c.globalAlpha = 0.85 * a; c.strokeStyle = k === 0 ? PEARL : c2; c.lineWidth = 1.6 - k * 0.2; c.stroke(); } } }
        c.restore();
        // the hearts
        for (const hh of hearts) { const tl = t - hh.t0; if (tl < 0.55) continue; const fill = sm((tl - 0.55) / 0.55), out = 1 - sm((t - hh.te - 0.05) / 0.45); if (out <= 0.01) continue;
          const hx = H.sx(hh.x), hy = H.sy(hh.y) - (hh.z + HT * 0.5) * T, hp = HT * T;
          // fade near the pet so it never covers it
          const pd = Math.hypot(hx - PX, hy - PY) / T, pf = 0.3 + 0.7 * cl((pd - 0.6) / 1.2);
          const tilt = t < hh.tg ? -0.5 * (1 - sm((tl - 0.8) / 0.5)) * (hh.i % 2 ? -1 : 1) : 0;
          const lit = hh.flash * 0.7 + 0.25 * (1 - fill) + 0.15 * Math.max(0, Math.sin(t * 2.5 + hh.i));
          const rim = tier >= 2 ? (t * 0.45 + hh.i * 0.3) % 1 : null;
          thickHeart(c, hx, hy, hp * (0.9 + 0.1 * fill), hh.th, hh.lean + tilt, fill * out * pf, lit, rim);
          // the hit pulse: from the point up to the lobes
          if (hh.pulse < 0.35) { const u = hh.pulse / 0.35, py2 = hy + hp * lerp(0.55, -0.2, u); glowC(c, hx, py2, hp * 0.35, PEARL, 0.7 * (1 - u) * pf); glowC(c, hx - hp * 0.25 * u, py2, hp * 0.2, BLUSH, 0.5 * (1 - u) * pf); glowC(c, hx + hp * 0.25 * u, py2, hp * 0.2, BLUSH, 0.5 * (1 - u) * pf); }
          // orbiting star glints (Adept and up)
          if (tier >= 2 && t < hh.te) for (let q = 0; q < tier; q++) { const b = t * 2.4 + q * TAU / tier + hh.i, ox = Math.cos(b) * hp * 0.62, oy = Math.sin(b) * hp * 0.16, r = T * (Math.sin(b) > 0 ? 0.22 : 0.15); blitC(c, starSpr(q % 2 ? BLUSH : LAV), hx + ox, hy + hp * 0.1 + oy, r * 2, r * 2, (Math.sin(b) > 0 ? 0.95 : 0.5) * pf, true); }
          // dissolving: nested heart outlines expand and fade
          if (t > hh.te - 0.1) { const NO = tier; for (let q = 0; q < NO; q++) { const u = cl((t - hh.te + 0.1 - q * 0.15) / 0.9); if (u <= 0 || u >= 1) continue; const sz = hp * (1 + u * (0.6 + q * 0.35)) * 1.12; blitC(c, lineSpr(), hx, hy + sz * 0.04, sz * SW / (SU * 1.7), sz * SW / (SU * 1.7), (1 - u) * 0.9, true); } }
        }
        // heart-shaped contact flashes
        for (const p of pops) { const u = p.t / 0.55, X2 = H.sx(p.x), Y2 = H.sy(p.y) - p.z * T, sz = T * (0.5 + 1.3 * H.ease.out(u)); glowC(c, X2, Y2, T * 0.9 * (1 - u * 0.5), ROSE, 0.6 * (1 - u)); blitC(c, fillSpr(), X2, Y2, sz * 1.3, sz * 1.3, 0.8 * (1 - u), true); blitC(c, lineSpr(), X2, Y2, sz * 1.5, sz * 1.5, (1 - u), true); }
        B.draw(c, T);
      } });
  };

  /* ================= 6. Holy Judgement ================= */
  U.holyjudgement = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), N = [20, 23, 26, 30, 33, 36, 40][ev - 1], tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1;
    const DK = C.base * C.K * (1 + 0.08 * (ev - 1)), DMG = DK * 15 / N, GR = (1.7 + 0.12 * (ev - 1)) * C.K;   // the ground heart's half-width (tiles)
    const gx = me.x, gy = me.y;   // anchored where the pet stood
    H.X.banner('HOLY JUDGEMENT', '', ROSE, 1.4); H.X.sfx.hum();
    const B = bits(), booms = [], S = [], a0 = C.a;
    const GROUPS = tier === 3 ? 4 : tier === 2 ? 2 : 1, PER = Math.ceil(N / GROUPS), TL = 1.05, TRN = N > 50 ? 9 : N > 30 ? 12 : 16, DENS = 20 / N;   // shorter trails and sparser dust as the count grows
    for (let i = 0; i < N; i++) { const gI = Math.floor(i / PER), j = i % PER, nG = Math.min(PER, N - gI * PER), u = nG > 1 ? j / (nG - 1) * 2 - 1 : 0;
      const tLaunch = TL + gI * (tier === 3 ? 0.3 : 0.36) + j * (tier === 3 ? 0.03 : 0.04), hi = tier >= 2 && j % 2 ? 0.72 : 1, dur = 1.15 + 0.12 * R1(i * 3.1) + (tier === 3 ? 0.1 : 0);
      S.push({ i, gI, j, u, tl: tLaunch, dur, hi, gather: 0.35 + i * 0.6 / N, x: gx, y: gy, z: 2.2, tgt: null, lx: 0, ly: 0, done: false, tr: [], sd: i * 5 + 1, ox: (R1(i * 7.7) - 0.5), oy: (R1(i * 2.3) - 0.5) }); }
    const END = Math.max(...S.map(s => s.tl + s.dur)) + 1.0;
    let rr = 0; // round-robin over the monsters
    function choose(s) { const L = H.sortNear(gx, gy).filter(m => Math.hypot(m.x - gx, m.y - gy) < 13); if (!L.length) return null; const m = L[(rr++) % Math.min(L.length, 8)]; return m; }
    const P0 = s => [gx + s.u * 0.9 + (s.gI - 1.5) * 0.12 * (tier === 3 ? 1 : 0), gy - 0.05, 2.3 + 0.3 * (1 - s.u * s.u)];
    function at(s, t) { // a cubic from the gather point up through the fan's apex and down onto the monster
      const v = cl((t - s.tl) / s.dur), q = 0.5 * v + 0.5 * v * v, [x0, y0, z0] = P0(s), side = s.u * (2.2 + (tier === 3 ? 0.8 : 0));
      const tx = s.lx, ty = s.ly, zA = (tier === 3 ? 6.2 : 5.2) * s.hi;
      const c1 = [x0 + side * 0.9, y0 - 0.4, z0 + zA * 0.9], c2 = [lerp(x0, tx, 0.75) + side * 0.6, lerp(y0, ty, 0.75), zA * 0.85];
      const b = (k) => { const m = 1 - q; return m * m * m * [x0, y0, z0][k] + 3 * m * m * q * c1[k] + 3 * m * q * q * c2[k] + q * q * q * [tx, ty, 0][k]; };
      return [b(0), b(1), b(2), v]; }
    H.add({ life: END, x: gx, y: gy,
      update(dt, f) {
        const t = f.t; B.step(dt);
        for (let k = booms.length - 1; k >= 0; k--) { booms[k].t += dt; if (booms[k].t > 0.9) booms.splice(k, 1); }
        // tiny hearts rise from the ground heart
        if (t < END - 1.2 && Math.random() < dt * 9 * H.Q()) { const b = Math.random() * TAU, r = Math.sqrt(Math.random()) * GR * 0.7; B.add(gx + Math.cos(b) * r, gy + Math.sin(b) * r * 0.6, 0.05, { vz: 0.6 + Math.random() * 0.6, vx: (Math.random() - 0.5) * 0.3, life: 0.9 + Math.random() * 0.6, s: 0.07 + Math.random() * 0.05, kind: Math.random() < 0.7 ? 'h' : 's', col: Math.random() < 0.6 ? CANDY : tier === 3 && Math.random() < 0.5 ? LAV : BLUSH, drag: 0.5, rot: 0.3 }); }
        for (const s of S) { if (s.done) continue;
          if (t < s.tl) { const [x0, y0, z0] = P0(s); s.x = x0; s.y = y0; s.z = z0; continue; }
          if (!s.tgt || s.tgt.dead) { const was = s.tgt; s.tgt = choose(s); if (!s.tgt && !was) { s.lx = gx + Math.cos(a0 + s.u) * 4; s.ly = gy + Math.sin(a0 + s.u) * 4; } }
          if (s.tgt) { const m = s.tgt, k = m.boss ? 0.55 : 0.3; s.lx = m.x + s.ox * m.r * k * 2; s.ly = m.y + s.oy * m.r * k * 2; }
          const [x, y, z, v] = at(s, t); s.x = x; s.y = y; s.z = z; s.tr.push([x, y, z]); if (s.tr.length > TRN) s.tr.shift();
          if (Math.random() < 0.5 * DENS * H.Q()) H.P({ kind: 'spark', x, y: y - z, vx: (Math.random() - 0.5) * 0.6, vy: 0.3, life: 0.35, max: 0.35, size: 1.6, color: Math.random() < 0.5 ? BLUSH : tier === 3 && Math.random() < 0.4 ? LAV : CANDY });
          if (v >= 1) { s.done = true; H.hitArea(s.lx, s.ly, 0.85, DMG, C.dmgO());   // one impact: the heart burst (its monster and any pressed against it)
            booms.push({ x: s.lx, y: s.ly, t: 0, sd: s.i }); H.X.light(s.lx, s.ly, 2, 0.25); if (s.i % 3 === 0) H.X.sfx.sparkle && H.X.sfx.sparkle();
            const nh = H.n(Math.max(3, Math.round((tier === 1 ? 7 : 10) * Math.sqrt(DENS)))); for (let q = 0; q < nh; q++) { const b = q / nh * TAU + R1(s.i + q), sp = 1.6 + Math.random() * 1.6; B.add(s.lx, s.ly, 0.6, { vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.5, vz: 1.2 + Math.random() * 1.8, g: 2.6, drag: 1.5, life: 0.6 + Math.random() * 0.5, s: 0.09 + Math.random() * 0.06, kind: q % (tier >= 2 ? 2 : 3) ? 'h' : 's', col: [CANDY, ROSE, BLUSH, tier === 3 ? LAV : PEARL][q % 4], rot: 0.5 }); }
            H.burst(s.lx, s.ly - 0.4, 'spark', Math.max(3, Math.round(8 * Math.sqrt(DENS))), { v: 4, up: 1.5, g: 5, life: 0.45, size: 2, color: [PEARL, BLUSH, ROSE] }); if (tier >= 2 && s.i % 2 === 0) H.burst(s.lx, s.ly - 0.5, 'star', 3, { v: 3, up: 2, g: 3, life: 0.6, size: 3, color: [PEARL, BLUSH] }); } }
      },
      drawUnder(c, f, X, Y, T, t) {
        t = f.t; const fa = sm(t / 0.25) * (1 - sm((t - END + 0.9) / 0.9)), s = GR * T / 0.94, cy = Y - s * 0.22 * H.GY;
        // the ground heart: its line draws from the point up both sides; soft light fills it
        const uL = sm(t / 0.7), uF = sm((t - 0.45) / 0.6);
        c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.5 * fa; c.drawImage(glowSprite(ROSE), X - s * 1.5, cy - s * 1.5 * H.GY, s * 3, s * 3 * H.GY);
        if (uF > 0) { const k = s / (SU * 0.94) * 1.02, ps = 0.92 + 0.06 * Math.sin(t * 3); c.save(); c.translate(X, cy); c.scale(k * ps, k * ps * H.GY); c.globalAlpha = (0.65 + (tier === 3 ? 0.2 : 0)) * uF * fa; c.drawImage(fillSpr(), -SCX, -SCY); c.restore(); }
        if (tier === 3 && uF > 0) { c.globalAlpha = 0.6 * uF * fa; c.drawImage(glowSprite(PEARL), X - s * 0.5, cy + s * 0.1 * H.GY - s * 0.5 * H.GY, s, s * H.GY); }
        c.lineCap = 'round'; c.lineJoin = 'round';
        const lines = tier === 3 ? [1, 0.82] : [1];
        for (const [li, ls] of lines.map((v, i) => [i, v])) { partHeart(c, s * ls, X, cy + s * (1 - ls) * 0.2 * H.GY, H.GY, uL); c.globalAlpha = 0.35 * fa; c.strokeStyle = ROSE; c.lineWidth = 8 - li * 3; c.stroke(); c.globalAlpha = 0.9 * fa; c.strokeStyle = li ? BLUSH : CANDY; c.lineWidth = 2.4 - li * 0.6; c.stroke(); c.globalAlpha = 0.8 * fa; c.strokeStyle = PEARL; c.lineWidth = 0.9; c.stroke();
          // glints run along the border (the drawing heads first, then moving lights)
          const kk = Math.round(HHALF * uL); if (uL < 1) { for (const j of [HHALF - kk, HHALF + kk]) { const p = HP[j]; glowC(c, X + p[0] * s * ls, cy + p[1] * s * ls * H.GY, T * 0.4, PEARL, fa); } }
          else { const NG = tier === 3 ? 3 : 2; for (let q = 0; q < NG; q++) { const idx = Math.floor((t * (li ? -0.35 : 0.3) + q / NG) * HN), p = HP[((idx % HN) + HN) % HN]; glowC(c, X + p[0] * s * ls, cy + p[1] * s * ls * H.GY + s * (1 - ls) * 0.2 * H.GY, T * 0.3, PEARL, 0.8 * fa); } } }
        // floor ripples under the bursts
        for (const b of booms) { const u = b.t / 0.9, bx = H.sx(b.x), by = H.sy(b.y), r = T * (0.3 + 1.6 * H.ease.out(u)); c.globalAlpha = 0.6 * (1 - u); c.strokeStyle = ROSE; c.lineWidth = 4 * (1 - u) + 1; H.floorEllipse(c, bx, by, r); c.stroke(); c.globalAlpha = 0.7 * (1 - u); c.strokeStyle = BLUSH; c.lineWidth = 1.2; c.stroke(); c.globalAlpha = 0.5 * (1 - u); c.drawImage(glowSprite(CANDY), bx - r, by - r * H.GY, r * 2, r * 2 * H.GY); }
        c.restore();
      },
      draw(c, f, X, Y, T, t) {
        t = f.t; const cm = cometSpr();
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (const s of S) { if (s.done || t < s.gather) continue;
          const ga = sm((t - s.gather) / 0.35), sx = H.sx(s.x), sy = H.sy(s.y) - s.z * T, br = 1 + 0.15 * Math.sin(t * 9 + s.i);
          // trails: two thin strings, spiralling as a pair from Adept
          const tr = s.tr; if (tr.length > 2) { const sp = tr.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]); for (let w = 0; w < 2; w++) { c.beginPath(); for (let q = 0; q < sp.length; q++) { const u = 1 - q / (sp.length - 1), a2 = sp[Math.max(0, q - 1)], b2 = sp[Math.min(sp.length - 1, q + 1)], nx = b2[0] - a2[0], ny = b2[1] - a2[1], nn = Math.hypot(nx, ny) || 1, off = (tier >= 2 ? Math.sin(u * 7 + t * 10 + w * Math.PI) : (w ? 1 : -1) * 0.6) * T * 0.16 * (0.3 + u), X2 = sp[q][0] - ny / nn * off, Y2 = sp[q][1] + nx / nn * off; q ? c.lineTo(X2, Y2) : c.moveTo(X2, Y2); }
              c.globalAlpha = 0.3; c.strokeStyle = ROSE; c.lineWidth = 4.5; c.stroke(); c.globalAlpha = 0.85; c.strokeStyle = tier === 3 && w ? LAV : BLUSH; c.lineWidth = 1.3; c.stroke(); } }
          // the light: a pointed pink glow with a pearl core, along its motion
          let ang = -Math.PI / 2; if (tr.length > 1) { const p = tr[tr.length - 1], q = tr[Math.max(0, tr.length - 3)]; const dx = H.sx(p[0]) - H.sx(q[0]), dy = (H.sy(p[1]) - p[2] * T) - (H.sy(q[1]) - q[2] * T); if (Math.hypot(dx, dy) > 0.5) ang = Math.atan2(dy, dx); }
          glowC(c, sx, sy, T * 0.75 * br, ROSE, 0.45 * ga); const L = T * (tier === 3 ? 1.5 : 1.25) * ga; c.save(); c.translate(sx, sy); c.rotate(ang); c.globalAlpha = ga; c.drawImage(cm, -L * 0.75, -L * 0.25, L, L * 0.5); c.restore(); glowC(c, sx, sy, T * 0.22 * br, PEARL, 0.9 * ga); }
        // the bursts: an upright love heart expands fast, brightens at its rim, pops
        for (const b of booms) { const u = b.t / 0.9, bx = H.sx(b.x), by = H.sy(b.y) - T * 0.7, e = H.ease.out(cl(b.t / 0.3)), sz = T * (0.6 + 1.5 * e), a = 1 - sm((b.t - 0.25) / 0.6);
          glowC(c, bx, by, T * (1.0 + 0.6 * e), ROSE, 0.55 * a); if (b.t < 0.12) glowC(c, bx, by, T * 0.9, PEARL, 0.9 * (1 - b.t / 0.12));
          blitC(c, fillSpr(), bx, by, sz * 1.5, sz * 1.5, 0.85 * a * (1 - 0.6 * e), true);
          blitC(c, lineSpr(), bx, by, sz * 1.6, sz * 1.6, a * (0.6 + 0.6 * e), true);
          if (tier >= 2) { const u2 = cl((b.t - 0.12) / 0.6); if (u2 > 0 && u2 < 1) blitC(c, lineSpr(), bx, by - T * 0.1, sz * 1.6 * (1 + u2 * 0.7), sz * 1.6 * (1 + u2 * 0.7), 0.5 * (1 - u2), true); } }
        c.restore();
        B.draw(c, T);
      } });
  };
})();
