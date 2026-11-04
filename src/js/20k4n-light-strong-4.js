/* ---------- Light (pink) Strongs, reworked: Eternal Light, Sweetheart Stamp ----------
   Eternal Light (was Sun Seed): thin pink S-curves draw themselves across the marked area round the target, little
   hearts rising off them; then each lifts into a wide ribbon of light curling up in a loose helix (a soft translucent
   sheet, a deep-pink edged body, a pearl centre stripe, light beads flowing up it), its base riding its glowing ground
   path through the monsters, its top bending forward and shedding stars. Each ribbon strikes a monster once as its
   base passes. 3 ribbons / 5 at Adept (crossing chords; the tops fork into two thin strands) / 7 at Celestial (they
   rise from the centre outward in quick succession and lean apart into an open blossom of ribbons). They unwind into
   hearts as the paths fade from their ends inward. Release ~1.8 / 2.4 / 3 s.
   Sweetheart Stamp (was Lucent Wheel): a thick heart seal (~2H wide: a pearly pink back, a stack of pearly side copies
   for its thickness, a bevelled rose-gold rim, nested engraved hearts glowing on its stamping face) forms above the
   target face toward the camera, turns flat, drops; fine light threads join its face to a matching heart on the floor,
   it hits a soft pink light cushion with a heart-shaped ripple and a spray of hearts. It rebounds on an arc, tilts and
   stamps again: 1 press / 2 at Adept (the second leaves a brighter double heart) / 3 at Celestial (a nested heart
   sigil; the last press larger and strongest). Then it rises, turns its glowing face to the camera and breaks into
   pearl-pink fragments; the floor engraving lingers. One AoE hit per press.
   2D canvas: "3D" is cached shaded sprites, squashed for tilt, a stacked thickness band, moving highlights. */
(() => {
  const S = ELEM_IMPL.light.strong, TAU = Math.PI * 2;
  delete S.sunseed; delete S.lucentwheel;
  const PINK = '#FF69B4', BLOS = '#FFB7D5', DEEP = '#D94B91', PEARL = '#FFF0F7', LAV = '#D8B4FF', RGOLD = '#E8AFB8', SHADE = '#8F2D73';
  const cl = u => Math.max(0, Math.min(1, u)), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const evoK = ev => 1 + 0.08 * (ev - 1);
  // the pet's light: an effect near the pet dims smoothly (never a hole cut round it)
  const petDim = (H, x, y) => 0.4 + 0.6 * sm((Math.hypot(x - H.me.x, y - H.me.y) - 0.5) / 1.4);

  /* ---- the heart curve (as the shipped pink moves): lobes up, point down ---- */
  const HP = (() => { const N = 96, pts = []; for (let i = 0; i <= N; i++) { const t = i / N * TAU, s = Math.sin(t); pts.push([16 * s * s * s / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.15]); } return pts; })();
  const HN = HP.length - 1;
  function heartPath(g, s, ox, oy) { g.beginPath(); for (let i = 0; i < HN; i++) { const p = HP[i], x = (ox || 0) + p[0] * s, y = (oy || 0) + p[1] * s; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
  // sprites: 200 px square, heart unit 80 px, the heart's middle at the origin (100, 76) -> spans y 31..168
  const SW = 200, SU = 80, OX = 100, OY = 76, HW = 1.88 * SU;
  const goldGrad = (g, s) => { const gr = g.createLinearGradient(-s, -s * 0.6, s, s * 1.1); gr.addColorStop(0, '#FFE4EA'); gr.addColorStop(0.3, RGOLD); gr.addColorStop(0.65, '#C98A94'); gr.addColorStop(1, '#9C5F6E'); return gr; };
  /* the stamping face: a rose-gold bevelled rim, a pearly pink face, nested engraved hearts */
  const faceSpr = () => fxSprite('lsk4face', SW, SW, g => { g.translate(OX, OY);
    heartPath(g, SU); g.fillStyle = goldGrad(g, SU); g.fill(); g.strokeStyle = 'rgba(120,50,75,0.9)'; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
    heartPath(g, SU * 0.95, 0, SU * 0.005); g.strokeStyle = 'rgba(255,240,247,0.75)'; g.lineWidth = 2; g.stroke();   // the rim's lit bevel
    let gr = g.createRadialGradient(-SU * 0.2, -SU * 0.05, SU * 0.04, 0, SU * 0.15, SU * 1.0); [[0, PEARL], [0.22, BLOS], [0.55, PINK], [0.85, DEEP], [1, SHADE]].forEach(s => gr.addColorStop(s[0], s[1]));
    heartPath(g, SU * 0.82, 0, SU * 0.03); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(143,45,115,0.85)'; g.lineWidth = 2.2; g.stroke();
    for (const [k, a, w] of [[0.62, 0.95, 2.6], [0.42, 0.85, 2.2]]) { heartPath(g, SU * k, 0, SU * 0.06 + SU * (0.82 - k) * 0.12); g.strokeStyle = `rgba(143,45,115,${a * 0.6})`; g.lineWidth = w + 2; g.stroke(); g.strokeStyle = `rgba(255,240,247,${a})`; g.lineWidth = w * 0.6; g.stroke(); }
    heartPath(g, SU * 0.2, 0, SU * 0.12); g.fillStyle = PEARL; g.fill();
    g.save(); g.translate(-SU * 0.42, -SU * 0.2); g.rotate(-0.6); g.scale(SU * 0.24, SU * 0.12); gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, 'rgba(255,240,247,0.7)'); gr.addColorStop(1, 'rgba(255,240,247,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore(); });
  /* the engravings alone, glowing (added on top when the seal charges) */
  const glyphSpr = () => fxSprite('lsk4glyph', SW, SW, g => { g.translate(OX, OY); g.lineJoin = 'round';
    for (const k of [0.62, 0.42]) for (const [col, lw] of [['rgba(255,105,180,0.3)', 12], ['rgba(255,183,213,0.7)', 5], ['rgba(255,240,247,1)', 1.8]]) { heartPath(g, SU * k, 0, SU * 0.06 + SU * (0.82 - k) * 0.12); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }
    heartPath(g, SU * 0.22, 0, SU * 0.12); g.fillStyle = 'rgba(255,240,247,0.9)'; g.fill(); });
  /* the back (the top while it is face down): the rim and a pearly pink domed plate with a raised heart */
  const backSpr = () => fxSprite('lsk4back', SW, SW, g => { g.translate(OX, OY);
    heartPath(g, SU); g.fillStyle = goldGrad(g, SU); g.fill(); g.strokeStyle = 'rgba(120,50,75,0.9)'; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
    heartPath(g, SU * 0.95, 0, SU * 0.005); g.strokeStyle = 'rgba(255,240,247,0.7)'; g.lineWidth = 2; g.stroke();
    let gr = g.createRadialGradient(-SU * 0.25, -SU * 0.1, SU * 0.04, 0, SU * 0.2, SU * 1.05); [[0, '#FFFFFF'], [0.15, PEARL], [0.4, BLOS], [0.75, PINK], [1, DEEP]].forEach(s => gr.addColorStop(s[0], s[1]));
    heartPath(g, SU * 0.84, 0, SU * 0.025); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(217,75,145,0.8)'; g.lineWidth = 2; g.stroke();
    heartPath(g, SU * 0.4, 0, SU * 0.09); g.strokeStyle = 'rgba(232,175,184,0.95)'; g.lineWidth = 3; g.stroke(); g.strokeStyle = 'rgba(255,240,247,0.8)'; g.lineWidth = 1.2; g.stroke(); });
  /* the side of the thickness band: pearly pink, deeper below; o: the copy at a face, with a rose-gold rim line */
  const sideSpr = o => fxSprite('lsk4side' + (o ? 'o' : ''), SW, SW, g => { g.translate(OX, OY); const gr = g.createLinearGradient(0, -SU * 0.6, 0, SU * 1.15); gr.addColorStop(0, '#FFD3E6'); gr.addColorStop(0.4, '#F08CC0'); gr.addColorStop(1, '#B2407F'); heartPath(g, SU); g.fillStyle = gr; g.fill(); if (o) { g.strokeStyle = 'rgba(232,175,184,1)'; g.lineWidth = 4; g.stroke(); } });
  /* floor engravings: 1 a heart outline, 2 a brighter double outline, 3 an ornate nested sigil (drawn additive) */
  const engrSpr = k => fxSprite('lsk4engr' + k, SW, SW, g => { g.translate(OX, OY); g.lineJoin = 'round';
    for (let q = 0; q < 4; q++) { heartPath(g, SU * (1.0 - q * 0.14), 0, SU * q * 0.04); g.fillStyle = `rgba(255,105,180,${0.07 + q * 0.025})`; g.fill(); }
    const lines = k === 1 ? [[0.95, 1]] : k === 2 ? [[1.0, 1], [0.86, 0.9]] : [[1.02, 1], [0.88, 0.85], [0.64, 0.8], [0.4, 0.75]];
    for (const [s, a] of lines) for (const [col, lw] of [['rgba(255,105,180,0.25)', 14], ['rgba(255,105,180,0.55)', 7], ['rgba(255,183,213,0.9)', 3.4], ['rgba(255,240,247,1)', 1.5]]) { heartPath(g, SU * s, 0, SU * (1 - s) * 0.14); g.strokeStyle = col.replace(/[\d.]+\)$/, m => (parseFloat(m) * a) + ')'); g.lineWidth = lw; g.stroke(); }
    if (k === 3) { for (let i = 0; i < 10; i++) { const p = HP[Math.round(i / 10 * HN)], x = p[0] * SU * 0.76, y = p[1] * SU * 0.76 + SU * 0.03; g.save(); g.translate(x, y); heartPath(g, SU * 0.07); g.fillStyle = 'rgba(255,240,247,0.95)'; g.fill(); g.restore(); }
      heartPath(g, SU * 0.18, 0, SU * 0.14); g.fillStyle = 'rgba(255,240,247,0.95)'; g.fill(); } });
  const fillSpr = () => fxSprite('lsk4fill', SW, SW, g => { g.translate(OX, OY); for (let q = 0; q < 6; q++) { heartPath(g, SU * (1.05 - q * 0.15), 0, SU * q * 0.04); g.fillStyle = `rgba(255,183,213,${0.08 + q * 0.04})`; g.fill(); } });
  /* draw a sprite with its origin at (x, y), s screen px per sprite px, ky its vertical squash */
  function spr(c, img, x, y, s, ky, rot, a, add) { if (!(a > 0.01) || s <= 0) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.translate(x, y); if (rot) c.rotate(rot); c.scale(s, s * ky); c.drawImage(img, -OX, -OY); c.restore(); }
  // a glow squashed onto the floor
  // the shipped glowing heart outline (LU1.lineSpr: a 160 px sprite, heart 108 px wide) laid on the floor, w its heart's width
  function floorLine(c, x, y, w, a) { const K = globalThis.LU1, z = w * 160 / 108; c.save(); c.translate(x, y); c.scale(1, 0.55); K.blitC(c, K.lineSpr(), 0, -z * 0.07, z, z, a, true); c.restore(); }
  function floorGlow(c, x, y, r, col, a, K) { if (!(a > 0.01)) return; c.save(); c.translate(x, y); c.scale(1, 0.55); K.glowC(c, 0, 0, r, col, a); c.restore(); }

  /* ================= Eternal Light ================= */
  S.eternallight = (C, H) => {
    const K = globalThis.LU1; K.setH(H);
    const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, q = (ev - 1) / 6, GY = H.GY;
    const N = [3, 3, 3, 5, 5, 5, 7][ev - 1], R = 2.5 + 0.9 * q, cx = C.tx, cy = C.ty;
    const PREP = 0.42, SWEEP = tier === 3 ? 1.55 : tier === 2 ? 1.0 + 0.05 * (ev - 4) : 0.85 + 0.05 * (ev - 1), STAG = tier === 3 ? 0.08 : 0.15 - 0.005 * (ev - 1), RISE = 0.22, UNW = 0.4;
    const tot = C.base * 2.4 * C.K * evoK(ev), per = tot * 1.25 / N, HIT_R = 0.75 + 0.1 * q;
    const HT = 2.1 + 0.4 * q + (tier === 3 ? 0.3 : 0);   // the ribbon's height, tiles
    const B = K.bits(), a0 = C.a + Math.PI / 2, swirls = [];
    for (let i = 0; i < N; i++) {
      const s = { i, t0: PREP + i * STAG, hits: new Set(), sd: R1(i * 7.3 + ev), pts: [], dir: [1, 0], up: false, out: false };
      if (tier === 3) { const th = a0 + i / N * TAU + 0.2; s.th = th; for (let k = 0; k <= 24; k++) { const u = k / 24, r = 0.25 + (R - 0.25) * u, w = Math.sin(u * TAU) * 0.45 * u, b = th + w / Math.max(0.6, r); s.pts.push([cx + Math.cos(b) * r, cy + Math.sin(b) * r * GY]); } }
      else { const th = a0 + (i - (N - 1) / 2) * (Math.PI / N) * 0.95, off = (i - (N - 1) / 2) * R * 0.16, sgn = i % 2 ? -1 : 1, dx = Math.cos(th) * sgn, dy = Math.sin(th) * sgn;
        for (let k = 0; k <= 24; k++) { const u = k / 24, l = (u - 0.5) * 2 * R * 0.95, w = Math.sin(u * TAU) * 0.42 * (0.8 + 0.4 * s.sd) + off; s.pts.push([cx + dx * l - dy * w, cy + (dy * l + dx * w) * GY]); } }
      swirls.push(s);
    }
    const at = (s, u) => { u = cl(u) * 24; const k = Math.min(23, Math.floor(u)), f = u - k, p = s.pts[k], p2 = s.pts[k + 1]; return [lerp(p[0], p2[0], f), lerp(p[1], p2[1], f)]; };
    const END = PREP + (N - 1) * STAG + SWEEP + UNW;
    H.X.sfx.hum();
    return H.add({ life: END + 0.6, x: cx, y: cy,
      update(dt, f) { const t = f.t; B.step(dt);
        // little hearts rise off the drawing lines
        if (t < PREP + 0.2 && Math.random() < dt * 22 * H.Q()) { const s = swirls[Math.floor(Math.random() * N)], u = Math.random() * cl(t / PREP), p = at(s, u); B.add(p[0], p[1], 0.05, { vz: 0.6 + Math.random() * 0.5, g: 0, drag: 0.6, life: 0.55, s: 0.07 + Math.random() * 0.04, kind: Math.random() < 0.7 ? 'h' : 's', col: Math.random() < 0.5 ? BLOS : PINK }); }
        for (const s of swirls) {
          const u = (t - s.t0) / SWEEP;
          if (!s.up && t >= s.t0) { s.up = true; if (s.i % 2 === 0) H.X.sfx.whoosh(); const p = at(s, 0); H.X.light && H.X.light(p[0], p[1], 2, 0.25); }
          if (u < 0 || u > 1.02) { if (u > 1 && !s.out) { s.out = true; const p = s.top || at(s, 1); const nh = H.n(5 + tier * 2); for (let k = 0; k < nh; k++) { const b = Math.random() * TAU, sp = 0.6 + Math.random() * 1.2; B.add(p[0], p[1], s.topZ || HT, { vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.5, vz: 0.4 + Math.random() * 0.8, g: 0.3, drag: 1.2, life: 0.8 + Math.random() * 0.5, s: k < 2 ? 0.16 : 0.08 + Math.random() * 0.04, kind: k % 3 === 2 ? 's' : 'h', col: [PINK, BLOS, PEARL, tier === 3 ? LAV : PINK][k % 4], rot: 0.5 }); } } continue; }
          const p = at(s, u), p2 = at(s, u + 0.03); s.base = p; const dx = p2[0] - p[0], dy = p2[1] - p[1], dl = Math.hypot(dx, dy) || 1; s.dir = [dx / dl, dy / dl];
          if (t >= s.t0 + RISE * 0.5) for (const m of H.near(p[0], p[1], HIT_R)) { if (s.hits.has(m)) continue; s.hits.add(m); H.X.hitMon(m, per, C.dmgO({ kb: 1.2 })); H.burst(m.x, m.y - 0.45, 'spark', H.n(4 + tier), { v: 5, up: 2, g: 8, life: 0.3, size: 1.8, color: [PEARL, BLOS, PINK] });
            const nh = H.n(4 + tier); for (let k = 0; k < nh; k++) { const b = Math.random() * TAU, sp = 1.5 + Math.random() * 2.5; B.add(m.x, m.y, 0.5, { vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.5, vz: 1.5 + Math.random() * 1.5, g: 5, drag: 2.4, life: 0.45 + Math.random() * 0.3, s: k ? 0.08 : 0.15, kind: k % 3 === 1 ? 's' : 'h', col: k % 2 ? BLOS : PINK, rot: 0.4 }); }
            if (s.hits.size === 1) H.X.sfx.sparkle && H.X.sfx.sparkle(); }
          // stars shed from the bending top
          if (s.top && Math.random() < dt * 9 * H.Q()) B.add(s.top[0], s.top[1], s.topZ, { vx: s.dir[0] * -0.6 + (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.3, vz: -0.2 - Math.random() * 0.4, life: 0.6, s: 0.06, kind: Math.random() < 0.6 ? 's' : 'h', col: Math.random() < 0.5 ? PEARL : BLOS, drag: 0.8 });
        }
      },
      drawUnder(c, f, X, Y, T) { const t = f.t, fa = cl(t / 0.25) * (1 - cl((t - END + 0.1) / 0.6));
        // the marked area: a faint feathered pink floor light
        floorGlow(c, X, Y, T * R * 1.25, PINK, 0.22 * fa, K);
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (const s of swirls) {
          const draw0 = cl((t - s.i * 0.03) / PREP), u = (t - s.t0) / SWEEP, endU = cl((t - s.t0 - SWEEP) / (UNW + 0.3)), lit = t >= s.t0 ? 1 : 0.35 + 0.65 * draw0 * draw0;
          if (draw0 <= 0 || endU >= 1) continue;
          // the path fades from its ends inward after its ribbon has passed
          const lo = endU * 0.5, hi = Math.min(draw0, 1 - endU * 0.5); if (hi <= lo) continue;
          const pts = []; for (let k = 0; k <= 24; k++) { const uu = lerp(lo, hi, k / 24), p = at(s, uu); pts.push([H.sx(p[0]), H.sy(p[1])]); }
          for (const [col, lw, al] of [[PINK, T * 0.22, 0.12], [PINK, T * 0.1, 0.3], [BLOS, T * 0.045, 0.7], [PEARL, Math.max(1, T * 0.016), 0.9]]) { c.globalAlpha = al * lit * fa; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
          // the swept stretch glows brighter behind the ribbon's base
          if (u > 0 && u < 1.05) { const b = at(s, u); floorGlow(c, H.sx(b[0]), H.sy(b[1]), T * 0.9, PINK, 0.55 * fa, K); floorGlow(c, H.sx(b[0]), H.sy(b[1]), T * 0.35, PEARL, 0.6 * fa, K); }
          if (draw0 < 1) { const p = at(s, draw0); K.glowC(c, H.sx(p[0]), H.sy(p[1]), T * 0.22, PEARL, 0.9 * fa); }
        }
        c.restore();
      },
      draw(c, f, X, Y, T) { const t = f.t;
        c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
        // back to front by screen depth
        const order = swirls.filter(s => s.base && t >= s.t0 && t < s.t0 + SWEEP + UNW).sort((p, q2) => p.base[1] - q2.base[1]);
        for (const s of order) drawRibbon(c, s, t, T);
        c.restore();
        B.draw(c, T);
      } });

    function drawRibbon(c, s, t, T) {
      const lt = t - s.t0, rise = H.ease.back ? Math.max(0, H.ease.back(cl(lt / RISE))) : sm(lt / RISE), unw = cl((lt - SWEEP) / UNW);
      const bx = H.sx(s.base[0]), by = H.sy(s.base[1]), dim = petDim(H, s.base[0], s.base[1]), A = (1 - unw * unw) * Math.min(1, lt / 0.12) * dim;
      if (A < 0.02) return;
      const Hh = T * HT * rise, NS = 24, vTop = 1 - unw * 0.85, W0 = T * (0.38 + 0.1 * q + (tier === 3 ? 0.04 : 0));
      // lean: forward along the sweep (screen), and at Celestial outward from the centre into the blossom
      let lx = s.dir[0] * T * 0.75, ly = s.dir[1] * T * 0.25;
      if (tier === 3) { const ox = H.sx(s.base[0]) - H.sx(cx), oy = H.sy(s.base[1]) - H.sy(cy), ol = Math.hypot(ox, oy) || 1, bl = sm(lt / (RISE + 0.5)); lx = lerp(lx, ox / ol * T * 1.5, bl); ly = lerp(ly, oy / ol * T * 0.5 - T * 0.2, bl); }
      const C0 = [], L = [], Rr = [], depth = [];
      for (let k = 0; k <= NS; k++) { const v = k / NS * vTop, ph = s.sd * TAU + v * TAU * 1.35 - t * 6.5, r = T * (0.15 + 0.55 * v);
        const x = bx + Math.cos(ph) * r + lx * v * v, y = by - Hh * v + Math.sin(ph) * r * 0.3 + ly * v * v;
        C0.push([x, y]); depth.push(Math.sin(ph)); }
      for (let k = 0; k <= NS; k++) { const v = k / NS, a = C0[Math.max(0, k - 1)], b = C0[Math.min(NS, k + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
        const tw = Math.abs(Math.cos(s.sd * 5 + v * Math.PI * 1.6 - t * 2.2)), taper = sm(v / 0.12) * 0.6 + 0.4, tip = 1 - sm((v - 0.62) / 0.38);
        const w = W0 * (0.3 + 0.7 * tw) * Math.min(taper, tip) * (0.6 + 0.4 * rise);
        L.push([C0[k][0] - ty / tl * w, C0[k][1] + tx / tl * w]); Rr.push([C0[k][0] + ty / tl * w, C0[k][1] - tx / tl * w]); }
      const strip = sc => { c.beginPath(); for (let k = 0; k <= NS; k++) { const p = C0[k], l = L[k]; const x = p[0] + (l[0] - p[0]) * sc, y = p[1] + (l[1] - p[1]) * sc; k ? c.lineTo(x, y) : c.moveTo(x, y); } for (let k = NS; k >= 0; k--) { const p = C0[k], r = Rr[k]; c.lineTo(p[0] + (r[0] - p[0]) * sc, p[1] + (r[1] - p[1]) * sc); } c.closePath(); };
      // the ribbon's light on the floor at its base
      floorGlow(c, bx, by, T * 0.8, PINK, 0.5 * A, K);
      // the soft translucent sheet round it
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.13 * A; c.fillStyle = PINK; strip(2.5); c.fill();
      c.globalAlpha = 0.2 * A; strip(1.7); c.fill();
      // the body: deep pink edges, a saturated pink inside (solid under the glow)
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 0.85 * A; c.fillStyle = DEEP; strip(1); c.fill();
      c.globalAlpha = 0.92 * A; c.fillStyle = PINK; strip(0.68); c.fill();
      c.globalAlpha = 0.55 * A; c.fillStyle = BLOS; strip(0.36); c.fill();
      // the pearl centre stripe, bright on the front turns, dim behind
      c.globalCompositeOperation = 'lighter';
      for (const front of [false, true]) { c.globalAlpha = (front ? 0.95 : 0.35) * A; c.strokeStyle = PEARL; c.lineWidth = Math.max(1.2, W0 * (front ? 0.2 : 0.14)); c.beginPath(); let on = false;
        for (let k = 1; k <= NS - 2; k++) { const f2 = depth[k] > -0.15; if (f2 === front) { const p = C0[k]; on ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); on = true; } else on = false; } c.stroke(); }
      // light flowing up its length
      for (let k = 0; k < 3; k++) { const v = (t * 1.7 + k / 3 + s.sd) % 1; if (v > vTop * 0.95) continue; const i2 = Math.round(v / vTop * NS), p = C0[Math.min(NS, i2)]; K.glowC(c, p[0], p[1], T * 0.2, PEARL, 0.7 * A * Math.sin(v * Math.PI)); }
      // Adept: the top forks into two delicate strands; Celestial: a third, lavender-touched
      if (tier >= 2 && rise > 0.5) { const k0 = Math.round(NS * 0.5), nf = tier === 3 ? 3 : 2;
        for (let j = 0; j < nf; j++) { const sg = j === 2 ? 0 : j ? 1 : -1, pts = [];
          for (let k = k0; k <= NS; k++) { const v = (k - k0) / (NS - k0), p = C0[k], a = C0[Math.max(0, k - 1)], tx = p[0] - a[0], ty = p[1] - a[1], tl = Math.hypot(tx, ty) || 1, o = T * 0.55 * v * v * (sg || 0.4) * (1 + 0.25 * Math.sin(t * 4 + j + s.sd * 6)), up = sg ? 0 : -T * 0.4 * v * v;
            pts.push([p[0] - ty / tl * o, p[1] + tx / tl * o + up]); }
          const fa2 = A * (1 - unw);
          for (const [col, lw, al] of [[PINK, T * 0.12, 0.35], [j === 2 ? LAV : BLOS, T * 0.045, 0.8], [PEARL, Math.max(1, T * 0.018), 0.9]]) { c.globalAlpha = al * fa2; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
          const e = pts[pts.length - 1]; K.blitC(c, K.starSpr(j === 2 ? LAV : PEARL), e[0], e[1], T * 0.3, T * 0.3, 0.9 * fa2, true); } }
      // the top's glow, a star at the tip
      const tp = C0[NS]; K.glowC(c, tp[0], tp[1], T * 0.45, PINK, 0.45 * A); K.blitC(c, K.starSpr(BLOS), tp[0], tp[1], T * 0.34, T * 0.34, 0.9 * A, true);
      // the base: a pearl bloom where it rises out of the floor
      K.glowC(c, bx, by - T * 0.05, T * 0.42, PEARL, 0.55 * A);
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      // where the top is, in world terms, for the shed stars and the unwinding hearts
      s.top = [s.base[0] + (tp[0] - bx) / T, s.base[1]]; s.topZ = Math.max(0.3, (by - tp[1]) / T);
    }
  };

  /* ================= Sweetheart Stamp ================= */
  S.sweetheartstamp = (C, H) => {
    const K = globalThis.LU1; K.setH(H);
    const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, q = (ev - 1) / 6, GY = H.GY;
    const NP = tier, WT = 1.75 + 0.25 * q, R = 1.65 + 0.35 * q;   // seal width (tiles), press radius
    const tot = C.base * 2.6 * C.K * evoK(ev), COEF = NP === 1 ? [1] : NP === 2 ? [0.44, 0.56] : [0.27, 0.31, 0.42];
    // contact times: form 0..0.3, turn flat ..0.6, drop ..0.8; each rebound 0.58 s; the last at Celestial a beat longer
    const CT = []; for (let i = 0; i < NP; i++) CT.push(0.8 + i * 0.58 + (tier === 3 && i === NP - 1 ? 0.1 : 0));
    const LAST = CT[NP - 1], RISE0 = LAST + 0.22, TURN = RISE0 + 0.4, DISS = TURN + 0.38, END = DISS + 0.9;
    const B = K.bits(), tgt0 = [C.tx, C.ty], spots = [tgt0.slice()], engr = [], rips = [];
    // where each press lands: the middle of the monsters near the first spot, never far from it (the sigil nests)
    const spotFor = () => { const ms = H.near(tgt0[0], tgt0[1], R + 0.8); if (!ms.length) return tgt0.slice(); let x = 0, y = 0; for (const m of ms) { x += m.x; y += m.y; } x /= ms.length; y /= ms.length; const dx = x - tgt0[0], dy = y - tgt0[1], d = Math.hypot(dx, dy), k = d > 1 ? 1 / d : 1; return [tgt0[0] + dx * k, tgt0[1] + dy * k]; };
    spots[0] = spotFor();
    const big = i => (tier === 3 && i === NP - 1 ? 1.15 : 1);
    H.X.sfx.whoosh();
    // the seal's pose at time t: ground spot (x, y), height z (tiles), tilt al (0 face to the camera .. PI/2 face down), roll, scale, squash
    function pose(t) {
      const p = { x: spots[0][0], y: spots[0][1], z: 2.7, al: 0, roll: 0.0, sc: 1, sq: 0, a: 1 };
      if (t < 0.3) { const u = sm(t / 0.3); p.z = 2.4 + 0.3 * u; p.sc = 0.7 + 0.3 * u; p.a = u; p.roll = 0.25 * (1 - u); return p; }
      if (t < 0.6) { const u = sm((t - 0.3) / 0.3); p.al = u * Math.PI / 2; p.z = 2.7 + 0.25 * Math.sin(u * Math.PI); p.roll = 0.08 * Math.sin(u * Math.PI); return p; }
      for (let i = 0; i < NP; i++) {
        const c0 = CT[i], start = i ? CT[i - 1] : 0.6, sp = spots[Math.min(i, spots.length - 1)], prev = spots[Math.max(0, Math.min(i - 1, spots.length - 1))];
        if (t < c0) { p.al = Math.PI / 2;
          if (i === 0) { const u = cl((t - 0.6) / 0.2); p.z = 2.7 * (1 - u * u * u); p.sc = 1 + 0.05 * u; return p; }
          // rebound: up along an arc to the next spot, a slight tilt, then the drop
          const dur = c0 - start, u = (t - start) / dur, up = cl(u / 0.68), dn = cl((u - 0.68) / 0.32), sq0 = cl(1 - (t - start) / 0.12);
          p.x = lerp(prev[0], sp[0], sm(u / 0.8)); p.y = lerp(prev[1], sp[1], sm(u / 0.8));
          p.z = u < 0.68 ? 1.7 * Math.sin(up * Math.PI / 2) : 1.7 * (1 - dn * dn * dn); p.al = Math.PI / 2 - 0.42 * Math.sin(cl(u / 0.85) * Math.PI); p.roll = (i % 2 ? -0.16 : 0.16) * Math.sin(cl(u / 0.85) * Math.PI); p.sq = 0.12 * sq0; p.sc = big(i) > 1 ? lerp(1, big(i), sm(u)) : 1; return p; }
      }
      // after the last contact: the squash, then the rise, the turn to the camera and the dissolve
      const sp = spots[spots.length - 1], sc = big(NP - 1); p.x = sp[0]; p.y = sp[1]; p.sc = sc;
      if (t < RISE0) { const u = (t - LAST) / 0.22; p.z = 0; p.al = Math.PI / 2; p.sq = 0.16 * (1 - sm(u)); return p; }
      const u = sm((t - RISE0) / (TURN - RISE0)); p.z = 1.6 * u + 0.4 * sm((t - TURN) / 0.4); p.al = Math.PI / 2 * (1 - u); p.roll = 0.1 * Math.sin(u * Math.PI);
      p.a = 1 - sm((t - TURN) / (DISS - TURN)); return p;
    }
    return H.add({ life: END, x: spots[0][0], y: spots[0][1], n: 0, frag: false,
      update(dt, f) { const t = f.t; B.step(dt);
        for (let i = rips.length - 1; i >= 0; i--) { rips[i].t += dt; if (rips[i].t > 0.7) rips.splice(i, 1); }
        // pick the next landing spot as the seal rebounds
        if (f.n < NP && f.n > 0 && spots.length === f.n) spots.push(spotFor());
        if (f.n < NP && t >= CT[f.n]) { const i = f.n, sp = spots[i], rr = R * big(i); f.n++;
          H.hitArea(sp[0], sp[1], rr, tot * COEF[i], C.dmgO({ kb: 2.5 + i }));
          engr.push({ x: sp[0], y: sp[1], k: tier === 3 && i === 2 ? 3 : tier >= 2 && i >= 1 ? 2 : 1, t0: t, s: big(i) });
          rips.push({ x: sp[0], y: sp[1], t: 0, s: rr * big(i) });
          H.X.shake && H.X.shake(5 + 2 * i + (i === NP - 1 ? 2 : 0), 0.14); H.X.hitstop && H.X.hitstop(0.035 + (i === NP - 1 ? 0.02 : 0)); H.X.sfx.thud ? H.X.sfx.thud() : H.X.sfx.crash(); H.X.sfx.sparkle && H.X.sfx.sparkle(); H.X.light && H.X.light(sp[0], sp[1], 3, 0.3);
          // little hearts launch outward from the edge, a few big ones tumbling slowly, many quick stars
          const nh = H.n(14 + 4 * tier); for (let k = 0; k < nh; k++) { const b = k / nh * TAU + Math.random() * 0.3, sp2 = 2.4 + Math.random() * 3.2, bigH = k % 6 === 0; B.add(sp[0] + Math.cos(b) * rr * 0.5, sp[1] + Math.sin(b) * rr * 0.5 * GY, 0.15, { vx: Math.cos(b) * sp2 * (bigH ? 0.6 : 1), vy: Math.sin(b) * sp2 * 0.55 * (bigH ? 0.6 : 1), vz: 1.2 + Math.random() * 2.2, g: bigH ? 2.5 : 6, drag: bigH ? 1.6 : 2.4, life: bigH ? 1.0 : 0.45 + Math.random() * 0.35, s: bigH ? 0.17 : 0.07 + Math.random() * 0.05, kind: k % 3 === 2 && !bigH ? 's' : 'h', col: [PINK, BLOS, PEARL, DEEP, tier === 3 ? LAV : BLOS][k % 5], rot: bigH ? 0.7 : 0.3 }); }
          H.burst(sp[0], sp[1] - 0.15, 'spark', H.n(8 + 2 * tier), { v: 7, up: 1.5, g: 9, life: 0.3, size: 1.8, flat: true, color: [PEARL, BLOS, PINK] }); }
        if (!f.frag && t >= TURN + 0.05) { f.frag = true; const p = pose(t), nh = H.n(16 + 4 * tier); for (let k = 0; k < nh; k++) { const hp = HP[Math.floor(Math.random() * HN)], w = WT * p.sc, x = p.x + hp[0] * w * 0.5, z = p.z + 0.7 + -hp[1] * w * 0.5 + 0.2; B.add(x, p.y, Math.max(0.2, z), { vx: hp[0] * 1.6 + (Math.random() - 0.5), vy: (Math.random() - 0.5) * 0.4, vz: 0.4 + Math.random() * 0.9, g: 0.6, drag: 1.4, life: 0.6 + Math.random() * 0.5, s: k % 4 ? 0.07 : 0.13, kind: k % 2 ? 's' : 'h', col: [PEARL, BLOS, PINK, RGOLD][k % 4], rot: 0.6 }); } H.X.sfx.sparkle && H.X.sfx.sparkle(); }
      },
      drawUnder(c, f, X, Y, T) { const t = f.t, p = pose(t);
        c.save();
        // the matching heart on the floor brightens beneath the seal as it comes down; then the engravings left behind
        const nxt = f.n < NP ? f.n : -1;
        if (nxt >= 0 && t > 0.35) { const c0 = CT[nxt], u = cl(1 - (c0 - t) / (nxt ? 0.5 : 0.45)), sp = spots[Math.min(nxt, spots.length - 1)], s = WT * big(nxt) * T / HW * 1.02; if (u > 0) { spr(c, engrSpr(1), H.sx(sp[0]), H.sy(sp[1]), s, GY, 0, 0.65 * u, true); spr(c, fillSpr(), H.sx(sp[0]), H.sy(sp[1]), s, GY, 0, 0.45 * u, true); } }
        for (const e of engr) { const lt = t - e.t0, s = WT * e.s * T / HW * 1.02, fa = (0.55 + 0.45 * Math.exp(-lt * 4)) * (1 - sm((t - (END - 0.85)) / 0.85)), X2 = H.sx(e.x), Y2 = H.sy(e.y);
          floorGlow(c, X2, Y2, T * R * e.s * 0.9, PINK, 0.3 * fa, K);
          spr(c, engrSpr(e.k), X2, Y2, s, GY, 0, fa * (e.k > 1 ? 1 : 0.85), true);
          if (lt < 0.25) spr(c, fillSpr(), X2, Y2, s * (1 + lt), GY, 0, (1 - lt / 0.25) * 0.9, true); }
        // the soft light cushion squeezing out from under the seal, and the heart-shaped ripple
        for (const r of rips) { const u = r.t / 0.7, X2 = H.sx(r.x), Y2 = H.sy(r.y), e = H.ease.out(cl(u * 1.4));
          if (u < 0.4) floorGlow(c, X2, Y2, T * r.s * (0.7 + 0.6 * e), BLOS, 0.7 * (1 - u / 0.4), K);
          floorLine(c, X2, Y2, T * WT * (0.95 + 1.5 * e) * r.s / R, (1 - u) * 0.95);
          if (tier >= 2) { const e2 = H.ease.out(cl((u - 0.12) * 1.5)); if (e2 > 0) floorLine(c, X2, Y2, T * WT * (0.9 + 1.9 * e2) * r.s / R, (1 - u) * 0.5); } }
        // the seal's soft shadow
        if (p.a > 0.02 && t < DISS) { const k = cl(1 - p.z / 2.8); H.softShadow(c, H.sx(p.x), H.sy(p.y) + T * 0.1, T * WT * p.sc * (0.35 + 0.25 * k), 0.12 + 0.22 * k * p.a); }
        c.restore();
      },
      draw(c, f, X, Y, T) { const t = f.t, p = pose(t);
        if (t < DISS && p.a > 0.01) drawSeal(c, f, t, p, T);
        B.draw(c, T);
      } });

    function drawSeal(c, f, t, p, T) {
      const X = H.sx(p.x), Yg = H.sy(p.y), dim = petDim(H, p.x, p.y), a = p.a * (0.55 + 0.45 * dim);
      const s = WT * p.sc * T / HW * (1 + p.sq * 0.5), kyR = Math.cos(p.al + 0.576), ky0 = kyR >= 0 ? kyR / 0.84 : kyR, ky = Math.sign(ky0 || 1) * Math.max(0.07, Math.abs(ky0)) * (1 - p.sq);
      const d = T * 0.24 * p.sc * (1 - p.sq * 0.6), off = -(Math.cos(p.al) * GY + Math.sin(p.al)) * d;   // from the stamping face to the back, on screen
      // the anchor: the stamping face's middle; resting flat it sits on the floor (the heart's middle is the sprite origin)
      const Y = Yg - p.z * T;
      const faceUp = ky0 > 0, hid = faceUp ? off : 0, vis = faceUp ? 0 : off, NK = Math.max(3, Math.min(10, Math.round(Math.abs(off) / 2)));
      // charge: the engravings light as it turns and drops; the glow under the face before each contact
      const nxt = f.n < NP ? CT[f.n] : -1, charge = nxt > 0 ? cl(1 - (nxt - t) / 0.45) : 0;
      K.glowC(c, X, Y + off * 0.5, T * WT * p.sc * 0.75, PINK, (0.28 + 0.25 * charge) * a);
      // fine light threads from the face down to the heart on the floor, just before contact
      if (nxt > 0 && nxt - t < 0.16 && p.z > 0.02) { const u = 1 - (nxt - t) / 0.16; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (let k = 0; k < 12; k++) { const hp = HP[Math.round(k / 12 * HN)], hx = hp[0] * SU * s, hy = hp[1] * SU * s; c.globalAlpha = 0.55 * u * a; c.strokeStyle = k % 2 ? BLOS : PEARL; c.lineWidth = Math.max(1, T * 0.025);
          c.beginPath(); c.moveTo(X + hx, Y + hy * Math.abs(ky)); c.lineTo(X + hx * 1.02, Yg + hy * GY * 1.02); c.stroke(); }
        c.restore(); }
      c.save(); c.translate(X, Y); c.rotate(p.roll);
      // the thickness: pearly side copies from the hidden face to the visible one
      for (let k = 0; k <= NK; k++) { const oy = lerp(hid, vis, k / NK); spr(c, sideSpr(k === 0 || k === NK), 0, oy, s, Math.abs(ky), 0, a, false); }
      // the visible face: the engraved stamping face, or the pearly back
      spr(c, faceUp ? faceSpr() : backSpr(), 0, vis, s, Math.abs(ky), 0, a, false);
      if (faceUp) spr(c, glyphSpr(), 0, vis, s, Math.abs(ky), 0, a * (0.35 + 0.65 * Math.max(charge, cl(1 - t / 0.6), cl((t - RISE0) / 0.3))), true);
      // a moving highlight round the rose-gold rim, and a soft sheen gliding over the face
      const rp = HP[Math.floor(((t * 0.45) % 1) * HN)], rp2 = HP[Math.floor(((t * 0.45 + 0.5) % 1) * HN)];
      K.glowC(c, rp[0] * SU * s, vis + rp[1] * SU * s * Math.abs(ky), T * 0.22, PEARL, 0.7 * a); K.glowC(c, rp2[0] * SU * s, vis + rp2[1] * SU * s * Math.abs(ky), T * 0.14, RGOLD, 0.5 * a);
      const sh = Math.sin(t * 2.1); K.glowC(c, sh * SU * s * 0.45, vis + (-0.15 + 0.1 * Math.cos(t * 1.7)) * SU * s * Math.abs(ky), T * 0.45, PEARL, 0.22 * a);
      c.restore();
    }
  };
})();
