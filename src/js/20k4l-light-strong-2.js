/* ---------- Light (pink) Strongs: Lantern Fall (rebuilt in place), Love Mirrors (was the Palace of Mirrors ult) ----------
   Lantern Fall: tiny hearts trace circles over the aim, little hexagonal lanterns (pearly pink panels, rose-gold beveled
   bars, a domed cap with a top loop, a hanging crystal heart, two swinging tassels) assemble inside them and lower, their
   inner heart lights swelling, while soft heart rings mark each footprint. They open one after another (0.18 / 0.16 /
   0.14 s apart): the lower panels hinge outward like petals and a solid white-pink core pours down into a broad
   translucent pink column with spiral strands; one AoE strike per lantern where it lands (a heart ripple, rising hearts).
   3 lanterns, 5 at Adept on two staggered heights with heart cutouts, 7 at Celestial in a canopy hung on rose-gold
   garlands, the larger central lantern last, completing a flower of heart ripples. Then they close partway and dissolve
   from the crystal hearts upward into hearts and pearly sparks.
   Love Mirrors: 3 / 5 at Adept / 7 at Celestial tall rounded heart-crested mirrors rise round the aim, their frames
   unfolding from two curved halves that lock; the heart in each face lights in turn; a narrow pink lance leaves the pet,
   enters the nearest mirror and ricochets round a star route (each leg bending through the monster nearest its path, one
   hit per monster per leg), each bend a face ripple and a puff of hearts, the travelled legs lingering as a pink
   constellation; then all mirrors tilt down and fire short shafts together into the ring (one AoE per shaft, heart
   ripples), and the frames split into curved glints while the faces dissolve into hearts and silver-pink flakes.
   2D canvas: "3D" is drawn - projected hexagon rings that slowly turn, shaded panels, a thickness band behind each mirror
   squashed to its yaw, moving sheens; heavy shapes are cached sprites. */
(() => {
  const S = ELEM_IMPL.light.strong, TAU = Math.PI * 2;
  delete S.halo;
  const ROSE = '#FF69B4', BLUSH = '#FFB7D5', DPK = '#D94B91', PEARL = '#FFF0F7', LAV = '#D8B4FF', RG = '#E8AFB8', RGD = '#9C5A66', DEEP = '#8F2D73', CANDY = '#FF8FCB', SILV = '#F6E3EE';
  let H;
  const cl = u => Math.max(0, Math.min(1, u)), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`; };
  const mixA = (h1, h2, k, a) => { const p = hexRGB(h1), q = hexRGB(h2); return `rgba(${Math.round(lerp(p[0], q[0], k))},${Math.round(lerp(p[1], q[1], k))},${Math.round(lerp(p[2], q[2], k))},${Math.max(0, Math.min(1, a))})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const sfx = (k, ...a) => H.X.sfx[k] && H.X.sfx[k](...a);
  function heartPath(g, cx, cy, s) { g.beginPath(); for (let i = 0; i <= 60; i++) { const t = i / 60 * TAU, x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); i ? g.lineTo(cx + x * s, cy + y * s) : g.moveTo(cx + x * s, cy + y * s); } g.closePath(); }

  /* ---- cached sprites ---- */
  // the column's cross-sections, feathered at the lantern and at the foot: 0 halo (add), 1 body with bright limbs (add), 2 solid pearl core
  const colSpr = k => fxSprite('lb2col' + k, 64, 128, (g, W, Hh) => {
    const im = g.createImageData(W, Hh), d = im.data, P = hexRGB(PEARL), B = hexRGB(BLUSH), Ro = hexRGB(ROSE), Dk = hexRGB(DPK);
    const mx = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
    for (let y = 0; y < Hh; y++) { const v = y / (Hh - 1), ve = k === 2 ? sstep(0, 0.06, v) * (1 - sstep(0.86, 1, v)) : sstep(0, 0.16, v) * (1 - sstep(0.78, 1, v));
      for (let x = 0; x < W; x++) { const q = Math.abs(x + 0.5 - W / 2) / (W / 2); let col, a;
        if (k === 0) { col = mx(Ro, Dk, q); a = Math.exp(-q * q * 3) * 0.6 * (1 - sstep(0.75, 1, q)); }
        else if (k === 1) { col = q < 0.5 ? mx(B, Ro, q / 0.5) : mx(Ro, Dk, (q - 0.5) / 0.5); a = (1 - sstep(0.7, 1, q)) * (0.48 - 0.15 * q) + Math.exp(-Math.pow((q - 0.72) / 0.08, 2)) * 0.32; }
        else { col = mx(P, B, sstep(0.3, 1, q)); a = 1 - sstep(0.5, 1, q); }
        const i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = Math.round(255 * cl(a * ve)); } }
    g.putImageData(im, 0, 0); });
  // a short light shaft (horizontal, drawn rotated): pearl centre, blush edges, feathered at both ends
  const shaftSpr = () => fxSprite('lb2shaft', 128, 16, (g, W, Hh) => { const im = g.createImageData(W, Hh), d = im.data, P = hexRGB(PEARL), B = hexRGB(BLUSH);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const q = Math.abs(y + 0.5 - Hh / 2) / (Hh / 2), v = x / (W - 1), a = (1 - sstep(0.45, 1, q)) * sstep(0, 0.12, v) * (1 - sstep(0.8, 1, v)), i = (y * W + x) * 4, k = sstep(0.1, 0.8, q); d[i] = lerp(P[0], B[0], k); d[i + 1] = lerp(P[1], B[1], k); d[i + 2] = lerp(P[2], B[2], k); d[i + 3] = Math.round(255 * a); }
    g.putImageData(im, 0, 0); });
  // the lance head: a tapered streak, transparent tail to a pearl point
  const lanceSpr = () => fxSprite('lb2lance', 64, 16, g => { const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,105,180,0)'); gr.addColorStop(0.6, 'rgba(255,143,203,0.7)'); gr.addColorStop(0.92, 'rgba(255,240,247,1)'); gr.addColorStop(1, 'rgba(255,240,247,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 8); g.quadraticCurveTo(40, 3, 60, 6); g.quadraticCurveTo(64, 8, 60, 10); g.quadraticCurveTo(40, 13, 0, 8); g.closePath(); g.fill(); });
  // a moving glass sheen (a soft vertical band)
  const sheenSpr = () => fxSprite('lb2sheen', 32, 8, g => { const gr = g.createLinearGradient(0, 0, 32, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 8); });
  // the floor pool under a strike (a soft filled heart)
  const hpoolSpr = () => fxSprite('lb2hpool', 128, 128, g => { const gr = g.createRadialGradient(64, 62, 0, 64, 62, 60); gr.addColorStop(0, 'rgba(255,240,247,0.7)'); gr.addColorStop(0.35, 'rgba(255,183,213,0.4)'); gr.addColorStop(1, 'rgba(255,105,180,0)'); heartPath(g, 64, 58, 3.4); g.fillStyle = gr; g.fill(); });

  /* ---- the mirror: an arched top, rounded foot; a beveled pink frame with rose-gold lines (beads at Adept, little hearts
     at Celestial) and a pearly, faintly lavender face ---- */
  const MW = 96, MH = 176, OHW = 42, OHH = 84, IHW = 29, IHH = 71;
  function mPath(g, hw, hh) { const rb = hw * 0.62; g.beginPath(); g.moveTo(-hw, -hh + hw); g.arc(0, -hh + hw, hw, Math.PI, 0); g.lineTo(hw, hh - rb); g.quadraticCurveTo(hw, hh, hw - rb, hh); g.lineTo(-hw + rb, hh); g.quadraticCurveTo(-hw, hh, -hw, hh - rb); g.closePath(); }
  const frameSpr = tier => fxSprite('lb2frame' + tier, MW, MH, g => {
    g.translate(MW / 2, MH / 2);
    let gr = g.createLinearGradient(-OHW, -OHH, OHW, OHH); gr.addColorStop(0, BLUSH); gr.addColorStop(0.32, ROSE); gr.addColorStop(0.72, DPK); gr.addColorStop(1, DEEP);
    mPath(g, OHW, OHH); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = rgbaS(DEEP, 0.95); g.stroke();
    mPath(g, OHW - 2.2, OHH - 2.2); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,240,247,0.6)'; g.stroke();   // bevel highlight
    mPath(g, 37.5, 79.5); g.lineWidth = 1.7; g.strokeStyle = RG; g.stroke();
    if (tier >= 2) { mPath(g, 35.2, 77.2); g.lineWidth = 0.9; g.strokeStyle = rgbaS(RG, 0.75); g.stroke();
      const bead = (x, y) => { g.beginPath(); g.arc(x, y, 1.7, 0, TAU); g.fillStyle = PEARL; g.fill(); g.lineWidth = 0.6; g.strokeStyle = rgbaS(RGD, 0.9); g.stroke(); };
      for (let i = 1; i < 8; i++) { const b = Math.PI + i / 8 * Math.PI; bead(Math.cos(b) * 39.6, -84 + 42 + Math.sin(b) * 39.6); }
      for (const sx of [-39.6, 39.6]) for (let y = -30; y < 66; y += 16) bead(sx, y); }
    if (tier >= 3) for (const sx of [-38, 38]) { heartPath(g, sx, 8, 0.32); g.fillStyle = RG; g.fill(); g.lineWidth = 0.7; g.strokeStyle = rgbaS(DEEP, 0.8); g.stroke(); heartPath(g, sx - 0.8, 7, 0.14); g.fillStyle = PEARL; g.fill(); }
    // the face: pearly glass with a lavender foot and two faint diagonal glints, an inner shade at the rim
    mPath(g, IHW, IHH); g.save(); g.clip(); gr = g.createLinearGradient(0, -IHH, 0, IHH); gr.addColorStop(0, PEARL); gr.addColorStop(0.35, '#FFD0E6'); gr.addColorStop(0.75, '#F5C6E8'); gr.addColorStop(1, '#DDB8F2'); g.fillStyle = gr; g.fillRect(-IHW, -IHH, IHW * 2, IHH * 2);
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-IHW, -10); g.lineTo(IHW * 0.3, -IHH); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(-IHW, 12); g.lineTo(IHW, -40); g.stroke();
    mPath(g, IHW, IHH); g.lineWidth = 7; g.strokeStyle = rgbaS(DPK, 0.28); g.stroke(); g.restore();
    mPath(g, IHW, IHH); g.lineWidth = 1.6; g.strokeStyle = rgbaS(DEEP, 0.85); g.stroke(); });
  const backSpr = () => fxSprite('lb2mback', MW, MH, g => { g.translate(MW / 2, MH / 2); const gr = g.createLinearGradient(-OHW, 0, OHW, 0); gr.addColorStop(0, DEEP); gr.addColorStop(0.5, DPK); gr.addColorStop(1, DEEP); mPath(g, OHW, OHH); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = rgbaS('#5E1A4A', 0.9); g.stroke(); });

  /* a heart outline lying on the floor, centred on (X, Y), R px across half-width; rot turns it in the floor plane */
  function floorHeart(c, K, X, Y, R, a, rot, img) { if (!(a > 0.01) || R < 1) return; const Sz = 2 * R / 0.68; c.save(); c.translate(X, Y); c.scale(1, H.GY); if (rot) c.rotate(rot); K.blitC(c, img || K.lineSpr(), 0, -Sz * 0.07, Sz, Sz, a, true); c.restore(); }
  const floorGlow = (c, K, X, Y, R, col, a) => K.blitC(c, glowSprite(col), X, Y, R * 2, R * 2 * H.GY, a, true);

  /* ---- Lantern Fall ---- */
  /* a lantern centred at the canvas origin, w wide and h tall: o = { spin, open, glow, a, dis, tier, sway, lit, t } */
  function lantern(c, K, w, h, o) {
    const a0 = o.a; if (!(a0 > 0.01) || w < 3) return;
    const fa = (lo, hi) => a0 * (1 - sstep(lo, hi, o.dis));
    const aCr = fa(0, 0.35), aPet = fa(0.15, 0.6), aBody = fa(0.35, 0.85), aCap = fa(0.55, 1), u = o.open, gl = o.glow;
    const yt = -0.36 * h, ye = 0, yb = 0.32 * h, rt = 0.3 * w, re = 0.5 * w, rb = 0.3 * w;
    const V = []; for (let k = 0; k <= 6; k++) { const th = o.spin + k * TAU / 6; V.push({ c: Math.cos(th), s: Math.sin(th) }); }
    const P = (r, y, v) => [r * v.c, y + r * v.s * 0.24];
    const rbo = rb + u * 0.34 * w, Bt = v => [rbo * v.c, lerp(yb, ye + 0.14 * h, u) + rbo * v.s * 0.24 * (1 + u * 1.4)];
    const pts = (L) => { c.beginPath(); L.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
    const face = (k, front) => {
      const v0 = V[k], v1 = V[k + 1], th = o.spin + (k + 0.5) * TAU / 6, ms = Math.sin(th), lit = 0.5 + 0.5 * Math.cos(th - (Math.PI / 2 + 0.7));
      const t0 = P(rt, yt, v0), t1 = P(rt, yt, v1), e0 = P(re, ye, v0), e1 = P(re, ye, v1), b0 = Bt(v0), b1 = Bt(v1);
      // the upper panel (fixed), bulging slightly
      if (aBody > 0.01) { c.globalAlpha = aBody; c.beginPath(); c.moveTo(t0[0], t0[1]); c.lineTo(t1[0], t1[1]); c.quadraticCurveTo((t1[0] + e1[0]) * 0.56, (t1[1] + e1[1]) / 2, e1[0], e1[1]); c.lineTo(e0[0], e0[1]); c.quadraticCurveTo((t0[0] + e0[0]) * 0.56, (t0[1] + e0[1]) / 2, t0[0], t0[1]); c.closePath();
        c.fillStyle = front ? mixA(DPK, BLUSH, lit * 0.7, 0.62 + 0.15 * lit) : rgbaS(DEEP, 0.5); c.fill();
        if (front && gl > 0.01) { c.globalCompositeOperation = 'lighter'; c.fillStyle = rgbaS(ROSE, 0.18 * gl); c.fill(); c.globalCompositeOperation = 'source-over'; }
        // a glowing heart motif in the front panels (cutouts on every front panel from Adept)
        if (front && ms > (o.tier >= 2 ? 0.25 : 0.6)) { const cx = (t0[0] + t1[0] + e0[0] + e1[0]) / 4, cy = (t0[1] + t1[1] + e0[1] + e1[1]) / 4, sz = w * (o.tier >= 2 ? 0.5 : 0.46); c.globalCompositeOperation = 'lighter'; c.globalAlpha = aBody * (0.35 + 0.65 * gl) * ms; c.drawImage(K.smallSpr(o.tier >= 2 ? PEARL : BLUSH), cx - sz * ms / 2, cy - sz / 2, sz * ms, sz);
          if (o.tier >= 2) { c.globalAlpha = aBody * 0.6 * gl * ms; c.drawImage(K.lineSpr(), cx - sz * 0.45 * ms, cy - sz * 0.47, sz * 0.9 * ms, sz * 0.9); } c.globalCompositeOperation = 'source-over'; } }
      // the lower panel: a petal hinged at the equator
      if (aPet > 0.01) { c.globalAlpha = aPet; const mx = (b0[0] + b1[0]) / 2, my = (b0[1] + b1[1]) / 2 + 0.07 * h * (1 - u * 0.5); c.beginPath(); c.moveTo(e0[0], e0[1]); c.lineTo(e1[0], e1[1]); c.quadraticCurveTo((e1[0] + b1[0]) * 0.55, (e1[1] + b1[1]) / 2, b1[0], b1[1]); c.quadraticCurveTo(mx, my, b0[0], b0[1]); c.quadraticCurveTo((e0[0] + b0[0]) * 0.55, (e0[1] + b0[1]) / 2, e0[0], e0[1]); c.closePath();
        c.fillStyle = front ? mixA(DPK, BLUSH, lit * 0.7 * (1 - 0.3 * u), 0.6 + 0.1 * lit) : rgbaS(DEEP, 0.4); c.fill();
        if (gl > 0.01) { c.globalCompositeOperation = 'lighter'; c.fillStyle = rgbaS(u > 0.2 ? PEARL : ROSE, (front ? 0.25 : 0.15) * gl * (0.6 + 0.6 * u)); c.fill(); c.globalCompositeOperation = 'source-over'; }
        if (o.tier >= 2 && front && ms > 0.4) { const sz = w * 0.26; c.globalCompositeOperation = 'lighter'; c.globalAlpha = aPet * gl * ms; c.drawImage(K.smallSpr(BLUSH), (e0[0] + e1[0] + b0[0] + b1[0]) / 4 - sz * ms / 2, (e0[1] + e1[1] + b0[1] + b1[1]) / 4 - sz / 2, sz * ms, sz); c.globalCompositeOperation = 'source-over'; }
        c.lineWidth = Math.max(0.8, w * 0.03); c.strokeStyle = rgbaS(RGD, front ? 0.9 : 0.4); c.stroke(); }
    };
    const bars = front => { c.lineCap = 'round'; c.lineJoin = 'round';
      for (const [col, lw, al] of [[RGD, 0.075, 0.95], [RG, 0.042, 1], [PEARL, 0.014, 0.7]]) { if (!front && col === PEARL) continue; c.strokeStyle = rgbaS(col, al * (front ? 1 : 0.45)); c.lineWidth = Math.max(0.6, w * lw);
        for (let k = 0; k < 6; k++) { const v = V[k]; if ((v.s > -0.05) !== front) continue; const t0 = P(rt, yt, v), e0 = P(re, ye, v); c.globalAlpha = aBody; c.beginPath(); c.moveTo(t0[0], t0[1]); c.quadraticCurveTo(t0[0] + (e0[0] - t0[0]) * 0.5 * 1.12, (t0[1] + e0[1]) / 2, e0[0], e0[1]); c.stroke(); }
        // the rings (top, equator), front or back halves
        for (const [r, y] of [[rt, yt], [re, ye]]) { c.globalAlpha = aBody; c.beginPath(); c.ellipse(0, y, r, r * 0.24, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.stroke(); } } };
    c.save();
    // back panels, back bars
    for (let k = 0; k < 6; k++) if (Math.sin(o.spin + (k + 0.5) * TAU / 6) < 0) face(k, false);
    bars(false);
    // the internal heart-shaped light
    c.globalAlpha = 1; K.glowC(c, 0, 0, w * 0.75, ROSE, 0.5 * gl * aBody); K.glowC(c, 0, 0.02 * h, w * 0.3, PEARL, (0.3 + 0.3 * gl) * aBody);
    K.blitC(c, K.smallSpr(PEARL), 0, 0, w * 0.6 * (0.85 + 0.25 * gl), w * 0.6 * (0.85 + 0.25 * gl), aBody * (0.4 + 0.6 * gl), true);
    if (u > 0.05) K.glowC(c, 0, yb * 0.8, w * (0.5 + 0.3 * u), PEARL, 0.55 * u * gl * aPet);
    for (let k = 0; k < 6; k++) if (Math.sin(o.spin + (k + 0.5) * TAU / 6) >= 0) face(k, true);
    bars(true);
    // the cap: a dome, a knob, a top loop and the thread it hangs from
    if (aCap > 0.01) { c.globalAlpha = aCap; c.beginPath(); c.moveTo(-rt * 1.12, yt); c.quadraticCurveTo(-rt * 0.9, yt - 0.24 * h, 0, yt - 0.25 * h); c.quadraticCurveTo(rt * 0.9, yt - 0.24 * h, rt * 1.12, yt); c.ellipse(0, yt, rt * 1.12, rt * 0.27, 0, 0, Math.PI); c.closePath(); c.fillStyle = DPK; c.fill(); c.lineWidth = Math.max(0.8, w * 0.035); c.strokeStyle = RGD; c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(BLUSH, 0.7); c.lineWidth = Math.max(0.6, w * 0.03); c.beginPath(); c.moveTo(-rt * 0.75, yt - 0.06 * h); c.quadraticCurveTo(-rt * 0.5, yt - 0.2 * h, 0, yt - 0.22 * h); c.stroke(); c.globalCompositeOperation = 'source-over';
      const ly = yt - 0.32 * h; c.strokeStyle = RG; c.lineWidth = Math.max(0.8, w * 0.04); c.beginPath(); c.arc(0, ly, w * 0.07, 0, TAU); c.stroke();
      for (let q = 0; q < 3; q++) { c.globalAlpha = aCap * (0.5 - q * 0.15); c.strokeStyle = RG; c.lineWidth = Math.max(0.5, w * 0.02); c.beginPath(); c.moveTo(0, ly - w * 0.07 - q * 0.22 * h); c.lineTo(0, ly - w * 0.07 - (q + 1) * 0.22 * h); c.stroke(); } }
    // the tassels (lag behind the motion) and the hanging crystal heart
    if (aCr > 0.01) { const bY = lerp(yb + rb * 0.24, ye + 0.2 * h, u * 0.6);
      for (const sd of [-1, 1]) { const x0 = sd * rb * 0.85, L = 0.5 * h, sw = o.sway + sd * 0.12; let px = x0, py = bY; for (let q = 1; q <= 4; q++) { const an = sw * q / 4, nx = x0 + Math.sin(an) * L * q / 4 * 1.1, ny = bY + Math.cos(an) * L * q / 4; c.globalAlpha = aCr; c.lineCap = 'round'; c.strokeStyle = q < 3 ? DPK : ROSE; c.lineWidth = Math.max(0.6, w * (0.075 - q * 0.013)); c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke(); px = nx; py = ny; } K.glowC(c, px, py, w * 0.12, BLUSH, 0.6 * aCr); }
      const cy = bY + 0.22 * h; c.strokeStyle = rgbaS(RG, aCr); c.lineWidth = Math.max(0.5, w * 0.025); c.beginPath(); c.moveTo(0, bY); c.lineTo(0, cy - 0.08 * h); c.stroke();
      if (o.lit > 0.02) K.glowC(c, 0, cy, w * (0.5 + 0.4 * o.lit), PEARL, 0.8 * o.lit * aCr);
      K.thickHeart(c, 0, cy, Math.max(4, w * 0.32), o.t * 2.2, 0.15 * Math.sin(o.t * 2), aCr, o.lit * 0.9, null); }
    c.restore();
  }
  /* the column: a halo, a solid pearl core under an additive candy body with bright limbs, spiral strands; it pours from
     the lantern down to the floor (pour 0..1), widens (wid) and fades (a) */
  function column(c, X, Yt, Yg, W, a, pour, wid, t, tier) {
    const Yf = lerp(Yt, Yg, pour), L = (Yf - Yt) * 1.1; if (L < 2 || !(a > 0.01)) return;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 * a * wid; c.drawImage(colSpr(0), X - W * 1.1, Yt, W * 2.2, L);
    c.globalCompositeOperation = 'source-over'; const cw = W * 0.16 * (0.5 + 0.5 * wid); c.globalAlpha = 0.9 * a; c.drawImage(colSpr(2), X - cw / 2, Yt, cw, L);
    c.globalCompositeOperation = 'lighter'; const bw = W * (0.3 + 0.7 * wid); c.globalAlpha = 0.6 * a; c.drawImage(colSpr(1), X - bw / 2, Yt, bw, L);
    const NS = tier >= 2 ? 3 : 2, n = 14; c.lineCap = 'round';
    for (let s = 0; s < NS; s++) for (let j = 0; j < n; j++) { const v0 = j / n, v1 = (j + 1) / n, y0 = Yt + v0 * L * 0.92, y1 = Yt + v1 * L * 0.92, ph = s * TAU / NS, f0 = (v0 * 3 - t * 2.5) * TAU + ph, f1 = (v1 * 3 - t * 2.5) * TAU + ph, env = Math.sin(Math.PI * (v0 + v1) / 2), front = 0.5 + 0.5 * Math.cos(f0);
      const al = a * wid * env * (0.25 + 0.75 * front); if (al < 0.03) continue; const x0 = X + Math.sin(f0) * bw * 0.46, x1 = X + Math.sin(f1) * bw * 0.46;
      c.globalAlpha = al * 0.45; c.strokeStyle = s === 2 && tier >= 3 ? LAV : ROSE; c.lineWidth = Math.max(1, W * 0.06); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.globalAlpha = al * 0.9; c.strokeStyle = PEARL; c.lineWidth = Math.max(0.6, W * 0.02); c.stroke(); }
    c.globalCompositeOperation = 'source-over';
  }

  S.lanternfall = (C, h) => {
    H = h; const K = globalThis.LU1; K.setH(H);
    const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, N = tier === 3 ? 7 : tier === 2 ? 5 : 3;
    const evoK = 1 + 0.08 * (ev - 1), TOT = C.base * C.K * evoK * 2.6, RF = (1.0 + 0.03 * (ev - 1)) * C.K, SZ = (1 + 0.035 * (ev - 1)) * Math.sqrt(C.K);
    const x0 = C.tx, y0 = C.ty, GP = N >= 7 ? 0.14 : N >= 5 ? 0.16 : 0.18, OPEN0 = 0.72, POUR = 0.06, STRIKE = 0.13;
    // the layout: a triangle (the original), a staggered pentagon, a hexagonal canopy round a larger centre
    let Lay;
    if (N === 3) Lay = [[0, -0.62, 0], [-1.0, 0.5, 0], [1.0, 0.5, 0]];
    else if (N === 5) Lay = [0, 1, 2, 3, 4].map(i => { const b = -Math.PI / 2 + i * TAU / 5; return [Math.cos(b) * 1.2, Math.sin(b) * 1.15, i % 2]; });
    else Lay = [0, 1, 2, 3, 4, 5].map(i => { const b = -Math.PI / 2 + Math.PI / 6 + i * TAU / 6; return [Math.cos(b) * 1.45, Math.sin(b) * 1.38, i % 2]; }).concat([[0, 0, 2]]);
    const mons = H.living().filter(m => Math.hypot(m.x - x0, m.y - y0) < 3.5);
    const wts = Lay.map(p => p[2] === 2 ? 1.4 : 1), wsum = wts.reduce((a, b) => a + b, 0);
    const Ls = Lay.map((p, i) => { let x = x0 + p[0] * C.K, y = y0 + p[1] * C.K; let bm = null, bd = 0.9; for (const m of mons) { const d = Math.hypot(m.x - x, m.y - y); if (d < bd) { bd = d; bm = m; } } if (bm && p[2] !== 2) { x += (bm.x - x) * 0.5; y += (bm.y - y) * 0.5; }
      const big = p[2] === 2, to = OPEN0 + i * GP; return { i, x, y, z: big ? 2.85 : tier >= 2 ? 2.1 + p[2] * 0.5 : 2.25 + 0.1 * Math.sin(i * 2.1), big, r: RF * (big ? 1.15 : 1), to, hitT: to + STRIKE, hit: false, dmg: TOT * 1.1 * wts[i] / wsum, ph: i * 1.7 }; });
    const LAST = Ls[N - 1].hitT, CLOSE = LAST + 0.28, END = CLOSE + 0.15 + 0.03 * N + 0.55, LIFE = END + 0.6;
    const B = K.bits(), rips = [];
    sfx('hum'); sfx('chime', 1046, 0.7);
    return H.add({ life: LIFE, x: x0, y: y0, so: 0,
      update(dt, f) { const t = f.t; B.step(dt); for (let i = rips.length - 1; i >= 0; i--) { rips[i].t += dt; if (rips[i].t > rips[i].life) rips.splice(i, 1); }
        for (const l of Ls) {
          if (!l.op && t >= l.to) { l.op = true; sfx('chime', 1318 + l.i * 90, 0.6); }
          if (!l.hit && t >= l.hitT) { l.hit = true;
            H.hitArea(l.x, l.y, l.r, l.dmg, C.dmgO({ kb: 1.5 }));
            rips.push({ x: l.x, y: l.y, r: l.r, t: 0, life: 0.7, k: 0 }); H.X.light(l.x, l.y, l.r * 1.8, 0.2); sfx('thud'); if (l.i % 2 === 0) sfx('sparkle');
            // little hearts emerge from the contact, tumble out and float up as they slow; tiny fast stars
            const nh = H.n(7 + 2 * tier); for (let q = 0; q < nh; q++) { const b = Math.random() * TAU, sp = 1.6 + Math.random() * 2.4, big = q < 2; B.add(l.x, l.y, 0.15, { vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.6, vz: 1.2 + Math.random() * 1.8, g: -0.5, drag: 2.6, life: big ? 1.0 : 0.55 + Math.random() * 0.3, s: big ? 0.2 : 0.08 + Math.random() * 0.05, kind: big || q % 3 ? 'h' : 's', col: [CANDY, ROSE, BLUSH, tier === 3 ? LAV : PEARL][q % 4], rot: 0.5 }); }
            H.burst(l.x, l.y - 0.2, 'spark', H.n(5 + tier), { v: 5, up: 1.5, g: 8, life: 0.3, size: 1.8, color: [PEARL, BLUSH, ROSE] });
            if (l.big) { H.X.shake(3, 0.12); for (let q = 0; q < 6; q++) rips.push({ x: l.x, y: l.y, r: l.r, t: -q * 0.03, life: 0.95, k: 1, a: -Math.PI / 2 + Math.PI / 6 + q * TAU / 6 }); }
          }
          // hearts rise along the column's outer edge, against the light coming down
          const tc = t - l.to - POUR; if (tc > 0.05 && tc < 0.4 && Math.random() < dt * 14 * H.Q()) { const sd = Math.random() < 0.5 ? -1 : 1; B.add(l.x + sd * l.r * (0.45 + Math.random() * 0.15), l.y + (Math.random() - 0.5) * 0.2, 0.2 + Math.random() * 0.6, { vz: 1.4 + Math.random(), vx: sd * 0.15, g: -0.6, drag: 0.5, life: 0.7 + Math.random() * 0.3, s: 0.07 + Math.random() * 0.05, kind: Math.random() < 0.65 ? 'h' : 's', col: Math.random() < 0.5 ? BLUSH : CANDY }); }
          // the dissolve: hearts and pearly sparks shed from the lower ornaments upward
          const ds = (t - CLOSE - 0.15 - l.i * 0.03) / 0.55; if (ds > 0 && ds < 1 && Math.random() < dt * 22 * H.Q()) B.add(l.x + (Math.random() - 0.5) * 0.4, l.y + 0.05, l.z + lerp(-0.45, 0.35, ds) * SZ * (l.big ? 1.25 : 1), { vx: (Math.random() - 0.5) * 0.8, vz: 0.4 + Math.random() * 0.8, g: -0.3, drag: 1, life: 0.7, s: 0.06 + Math.random() * 0.05, kind: Math.random() < 0.5 ? 'h' : 's', col: Math.random() < 0.5 ? PEARL : BLUSH });
        } },
      drawUnder(c, f, X, Y, T) { const t = f.t, kf = Math.min(1, f.life / 0.5);
        // a soft heart ring marks each footprint until its strike
        for (const l of Ls) { const X2 = H.sx(l.x), Y2 = H.sy(l.y), ap = sm((t - 0.12 - l.i * 0.04) / 0.35) * (1 - sm((t - l.hitT - 0.05) / 0.25)); if (ap <= 0.01) continue;
          const pulse = 0.85 + 0.15 * Math.sin(t * 7 + l.ph); floorGlow(c, K, X2, Y2, l.r * T * 1.1, ROSE, 0.22 * ap * kf); floorHeart(c, K, X2, Y2, l.r * T * 0.9 * pulse, 0.4 * ap * kf);
          if (t > l.to - 0.15) floorHeart(c, K, X2, Y2, l.r * T * 0.9, 0.5 * ap * sm((t - l.to + 0.15) / 0.15), 0, hpoolSpr()); }
        // the ripples: a heart ring and a pool where each column struck; at Celestial, petals round the centre
        for (const r of rips) { if (r.t < 0) continue; const u = r.t / r.life, X2 = H.sx(r.x), Y2 = H.sy(r.y);
          if (!r.k) { floorGlow(c, K, X2, Y2, r.r * T * 1.4, ROSE, 0.5 * (1 - u)); floorHeart(c, K, X2, Y2, r.r * T * (0.7 + 0.7 * H.ease.out(u)), 0.95 * (1 - u)); floorHeart(c, K, X2, Y2, r.r * T * (0.5 + 0.3 * u), 0.7 * (1 - u), 0, hpoolSpr()); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * (1 - u); c.strokeStyle = BLUSH; c.lineWidth = 2; c.beginPath(); c.ellipse(X2, Y2, r.r * T * (0.4 + 1.0 * H.ease.out(u)), r.r * T * (0.4 + 1.0 * H.ease.out(u)) * H.GY, 0, 0, TAU); c.stroke(); c.restore(); }
          else { const d = r.r * T * (0.5 + 1.3 * H.ease.out(u)), px = X2 + Math.cos(r.a) * d, py = Y2 + Math.sin(r.a) * d * H.GY; floorHeart(c, K, px, py, r.r * T * 0.55 * (0.7 + 0.5 * u), 0.9 * (1 - u), r.a - Math.PI / 2); } } },
      draw(c, f, X, Y, T) { const t = f.t, px = H.sx(me.x), py = H.sy(me.y) - T * 0.4;
        // Celestial: rose-gold garlands between the canopy lanterns' loops, dotted with tiny stars
        const pos = Ls.map(l => { const sc = SZ * (l.big ? 1.25 : 1), asm = cl((t - 0.18 - l.i * 0.04) / 0.38); return { X: H.sx(l.x), Y: H.sy(l.y) - T * (l.z + 0.06 * Math.sin(t * 2 + l.ph)) - (1 - sm(asm)) * T * 0.45, w: T * 0.64 * sc, h: T * 0.8 * sc, asm }; });
        if (tier === 3) { const ga = sm((t - 0.5) / 0.3) * (1 - sm((t - CLOSE) / 0.4)); if (ga > 0.01) { c.save(); c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const p = pos[i], q = pos[(i + 1) % 6], ax = p.X, ay = p.Y - p.h * 0.68, bx = q.X, by = q.Y - q.h * 0.68, mx = (ax + bx) / 2, my = (ay + by) / 2 + T * 0.35;
          c.globalAlpha = ga * 0.8; c.strokeStyle = RGD; c.lineWidth = 2; c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx, my, bx, by); c.stroke(); c.strokeStyle = RG; c.lineWidth = 1; c.stroke();
          for (let s = 1; s < 4; s++) { const u = s / 4, sx2 = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * mx + u * u * bx, sy2 = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * my + u * u * by; K.blitC(c, K.starSpr(s % 2 ? PEARL : BLUSH), sx2, sy2, T * 0.22, T * 0.22, ga * (0.6 + 0.4 * Math.sin(t * 6 + i + s)), true); } } c.restore(); } }
        // tiny hearts trace a circle where each lantern will assemble
        for (const l of Ls) { const p = pos[l.i], u0 = cl((t - l.i * 0.04) / 0.36), fo = 1 - sm((t - 0.3 - l.i * 0.04) / 0.35); if (u0 <= 0 || fo <= 0.01) continue; const rr = p.w * 0.85, b0 = -Math.PI / 2, b1 = b0 + u0 * TAU, cy = p.Y;
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.65 * fo; c.strokeStyle = ROSE; c.lineWidth = 3; c.beginPath(); c.ellipse(p.X, cy, rr, rr * 0.75, 0, b0, b1); c.stroke(); c.strokeStyle = PEARL; c.lineWidth = 1.1; c.stroke(); c.restore();
          for (let q = 0; q < 3; q++) { const b = b1 - q * 0.5; if (b < b0) continue; K.blitC(c, K.smallSpr(q ? BLUSH : PEARL), p.X + Math.cos(b) * rr, cy + Math.sin(b) * rr * 0.75, T * (0.24 - q * 0.05), T * (0.24 - q * 0.05), fo * (1 - q * 0.25), q > 0); } }
        // columns (behind their lanterns), then the lanterns from the back row forward
        for (const l of Ls) { const p = pos[l.i], tc = t - l.to - POUR; if (tc < 0 || tc > 0.62) continue; const X2 = H.sx(l.x), Yg = H.sy(l.y), Yt = p.Y + p.h * 0.36, W = l.r * T * 1.25;
          const dim = (px > X2 - W && px < X2 + W && py > Yt) ? 0.45 + 0.55 * sm(Math.abs(px - X2) / W) : 1, a = (1 - sm((tc - 0.28) / 0.34)) * dim;
          column(c, X2, Yt, Yg, W, a, cl(tc / 0.07), sm((tc - 0.03) / 0.12), t + l.ph, tier);
          K.blitC(c, glowSprite(PEARL), X2, Yg, W * 1.2, W * 1.2 * H.GY, 0.35 * a * cl(tc / 0.08), true); K.glowC(c, X2, Yg - T * 0.1, W * 0.8, ROSE, 0.3 * a); }
        Ls.slice().sort((p, q) => p.y - q.y || p.z - q.z).forEach(l => { const p = pos[l.i]; if (p.asm <= 0) return;
          const e = H.ease.back(p.asm), sc = 0.55 + 0.45 * e, open = t < CLOSE ? H.ease.out(cl((t - l.to) / 0.1)) : lerp(1, 0.4, sm((t - CLOSE) / 0.2)), dis = cl((t - CLOSE - 0.15 - l.i * 0.03) / 0.55);
          const glow = t < l.to ? 0.3 + 0.7 * sm((t - 0.3) / (l.to - 0.3)) : t < CLOSE ? 1 : 1 - 0.5 * sm((t - CLOSE) / 0.3), lit = t > l.hitT ? Math.exp(-(t - l.hitT) * 5) : 0;
          const sway = 0.6 * (1 - sm(p.asm)) * Math.sin(t * 10 + l.ph) + 0.1 * Math.sin(t * 2.3 + l.ph) + (t > l.to ? 0.3 * Math.exp(-(t - l.to) * 4) * Math.sin((t - l.to) * 13) : 0);
          c.save(); c.translate(p.X, p.Y); c.scale(sc, sc);
          K.glowC(c, 0, 0, p.w * 1.3, ROSE, 0.16 * glow * (1 - dis));
          lantern(c, K, p.w, p.h, { spin: Math.PI / 2 + 0.35 * t + l.ph, open, glow: Math.min(1, glow + lit * 0.5), a: sm(p.asm * 1.6), dis, tier, sway, lit, t: t + l.ph });
          c.restore(); });
        B.draw(c, T); } });
  };

  /* ---- Love Mirrors ---- */
  S.lovemirrors = (C, h) => {
    H = h; const K = globalThis.LU1; K.setH(H);
    const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, N = tier === 3 ? 7 : tier === 2 ? 5 : 3;
    const evoK = 1 + 0.08 * (ev - 1), TOT = C.base * C.K * evoK * 2.8, x = C.tx, y = C.ty, R = (2.2 + 0.1 * (ev - 1)) * C.K;
    const HT = (1.4 + 0.03 * (ev - 1)) * (tier === 3 ? 1.06 : 1), WT = HT * 0.62, LW = 0.45, RS = (1.0 + 0.03 * (ev - 1)) * C.K;
    const STG = 0.3 / N, UNF = 0.42, L0 = 0.52, LT = 0.2, SEG0 = L0 + LT, SG = N >= 7 ? 0.16 : N >= 5 ? 0.19 : 0.24, TR = 0.13, LEND = SEG0 + N * SG, FIRE = LEND + 0.3, DIS = FIRE + 0.32, LIFE = DIS + 0.95;
    // the mirrors: the pet sits between two of them; the first is the nearest to the pet
    const bp = Math.atan2(me.y - y, me.x - x), M = [];
    for (let i = 0; i < N; i++) { const b = bp + Math.PI / N + i * TAU / N, yaw = Math.max(-1, Math.min(1, H.wrap(b + Math.PI / 2))) * 0.78; M.push({ i, b, x: x + Math.cos(b) * R, y: y + Math.sin(b) * R, z: 0.32 + HT / 2 + (tier === 3 ? (i % 2) * 0.32 : 0), yaw, lit: 0, rip: -9, fl: -9 }); }
    let i0 = 0; M.forEach((m, i) => { if (Math.hypot(m.x - me.x, m.y - me.y) < Math.hypot(M[i0].x - me.x, M[i0].y - me.y)) i0 = i; });
    const step = N === 3 ? 1 : N === 5 ? 2 : 3, route = []; for (let k = 0; k <= N; k++) route.push(M[(i0 + k * step) % N]);
    M.forEach(m => { m.k = (route.indexOf(m) + N) % N; m.on = 0.32 + m.k * STG; });
    const segs = [{ A: { x: me.x, y: me.y, z: 0.6 }, B: route[0], t0: L0, tr: LT, dmg: 0, hit: new Set(), pu: 0 }];
    for (let k = 0; k < N; k++) segs.push({ A: route[k], B: route[k + 1], t0: SEG0 + k * SG, tr: TR, dmg: TOT * 0.45 / N, hit: new Set(), pu: 0 });
    const pt = (s, u) => { const A = s.A, Bm = s.B; if (!s.P) return [lerp(A.x, Bm.x, u), lerp(A.y, Bm.y, u), lerp(A.z, Bm.z, u)]; const qx = 2 * s.P.x - (A.x + Bm.x) / 2, qy = 2 * s.P.y - (A.y + Bm.y) / 2, qz = 2 * 0.45 - (A.z + Bm.z) / 2, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u; return [w0 * A.x + w1 * qx + w2 * Bm.x, w0 * A.y + w1 * qy + w2 * Bm.y, Math.max(0.2, w0 * A.z + w1 * qz + w2 * Bm.z)]; };
    const shafts = [], rips = [], B = K.bits(); let lastP = null;
    sfx('hum'); H.X.light(x, y, R, 0.3);
    const pop = (wx, wy, z, k, sp0) => { const nh = H.n(k); for (let q = 0; q < nh; q++) { const b = Math.random() * TAU, sp = (sp0 || 2) * (0.6 + Math.random() * 0.8), big = q < 2; B.add(wx, wy, z, { vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.6, vz: 0.8 + Math.random() * 1.6, g: -0.4, drag: 2.6, life: big ? 0.95 : 0.5 + Math.random() * 0.3, s: big ? 0.19 : 0.07 + Math.random() * 0.05, kind: big || q % 3 ? 'h' : 's', col: [CANDY, ROSE, BLUSH, tier >= 2 ? LAV : PEARL][q % 4], rot: 0.5 }); } };
    return H.add({ life: LIFE, x, y,
      update(dt, f) { const t = f.t; B.step(dt); for (let i = rips.length - 1; i >= 0; i--) { rips[i].t += dt; if (rips[i].t > rips[i].life) rips.splice(i, 1); }
        if (!f.s0 && t > 0.3) { f.s0 = true; sfx('chime', 988, 0.6); }
        for (const s of segs) { if (t < s.t0) continue;
          if (!s.go) { s.go = true; if (s.dmg) { const mx = (s.A.x + s.B.x) / 2, my = (s.A.y + s.B.y) / 2; let best = null, bs = R * 0.95; for (const m of H.living()) { if (Math.hypot(m.x - x, m.y - y) > R * 0.95) continue; const sc = Math.hypot(m.x - mx, m.y - my) + (m === lastP ? 1.2 : 0); if (sc < bs) { bs = sc; best = m; } } if (best) { s.P = { x: best.x, y: best.y }; lastP = best; } } sfx('whoosh'); }
          const u = cl((t - s.t0) / s.tr);
          if (s.dmg && u > s.pu) { const n = Math.max(1, Math.ceil((u - s.pu) * 24)); for (const m of H.living()) { if (s.hit.has(m)) continue; for (let k = 0; k <= n; k++) { const p = pt(s, s.pu + (u - s.pu) * k / n); if (Math.hypot(m.x - p[0], m.y - p[1]) < LW + m.r) { s.hit.add(m); H.X.hitMon(m, s.dmg, C.dmgO({ kb: 1.2 })); H.burst(m.x, m.y - 0.4, 'spark', H.n(4), { v: 4, up: 1.5, g: 8, life: 0.25, size: 1.6, color: [PEARL, BLUSH] }); pop(m.x, m.y, 0.45, 3 + tier, 1.6); break; } } } }
          s.pu = u;
          if (u >= 1 && !s.arr) { s.arr = true; const m = s.B; m.lit = 1; m.rip = t; m.fl = t; pop(m.x, m.y + 0.05, m.z, 5 + tier, 1.8); sfx('chime', 1175 + segs.indexOf(s) * 70, 0.55); H.X.light(m.x, m.y, 1.4, 0.12); } }
        for (const m of M) m.lit = Math.max(0, m.lit - dt * 2.2);
        if (!f.fired && t >= FIRE) { f.fired = true; sfx('crash'); H.X.shake(4, 0.14); H.X.light(x, y, R * 1.3, 0.25);
          const live = H.living().filter(m => Math.hypot(m.x - x, m.y - y) < R + m.r);
          for (const m of M) { let ix = x + Math.cos(m.b) * R * 0.42, iy = y + Math.sin(m.b) * R * 0.42, bm = null, bd = 1.3; for (const q of live) { const d = Math.hypot(q.x - ix, q.y - iy); if (d < bd) { bd = d; bm = q; } } if (bm) { ix = lerp(ix, bm.x, 0.75); iy = lerp(iy, bm.y, 0.75); }
            shafts.push({ m, x: ix, y: iy }); H.hitArea(ix, iy, RS, TOT * 0.55 / N, C.dmgO({ kb: 2 })); rips.push({ x: ix, y: iy, t: 0, life: 0.75 }); pop(ix, iy, 0.15, 5 + tier, 2.4); H.burst(ix, iy - 0.2, 'spark', H.n(4 + tier), { v: 5, up: 1.5, g: 8, life: 0.3, size: 1.8, color: [PEARL, BLUSH, ROSE] }); } }
        if (!f.dz && t >= DIS) { f.dz = true; sfx('sparkle'); for (const m of M) for (let q = 0; q < H.n(7); q++) B.add(m.x + (Math.random() - 0.5) * WT * 0.6, m.y + 0.05, m.z + (Math.random() - 0.5) * HT * 0.7 + 0.2, { vx: (Math.random() - 0.5) * 1.2, vz: 0.3 + Math.random() * 0.9, g: q % 2 ? -0.3 : 0.6, drag: 1.2, life: 0.7 + Math.random() * 0.3, s: 0.06 + Math.random() * 0.06, kind: q % 2 ? 'h' : 's', col: q % 2 ? (q % 4 === 1 ? CANDY : BLUSH) : SILV }); } },
      drawUnder(c, f, X, Y, T) { const t = f.t, ap = sm(t / 0.4) * (1 - sm((t - DIS) / 0.6));
        if (ap > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; for (const [lw, al, col] of [[7, 0.08, ROSE], [2.5, 0.22, CANDY], [1, 0.35, PEARL]]) { c.globalAlpha = al * ap; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.ellipse(X, Y, R * T, R * T * H.GY, 0, 0, TAU); c.stroke(); } c.restore();
          for (const m of M) { const u = sm((t - m.on + 0.25) / 0.3); floorGlow(c, K, H.sx(m.x), H.sy(m.y), T * WT * (0.9 + 0.5 * m.lit), ROSE, (0.3 + 0.4 * m.lit) * u * ap); } }
        for (const r of rips) { const u = r.t / r.life, X2 = H.sx(r.x), Y2 = H.sy(r.y); floorGlow(c, K, X2, Y2, RS * T * 1.3, ROSE, 0.5 * (1 - u)); floorHeart(c, K, X2, Y2, RS * T * (0.6 + 0.8 * H.ease.out(u)), 0.95 * (1 - u)); floorHeart(c, K, X2, Y2, RS * T * 0.6, 0.6 * (1 - u), 0, hpoolSpr()); if (tier >= 2) floorHeart(c, K, X2, Y2, RS * T * (0.4 + 1.2 * H.ease.out(u)), 0.45 * (1 - u)); } },
      draw(c, f, X, Y, T) { const t = f.t, fr = frameSpr(tier), bk = backSpr(), tilt = sm((t - LEND - 0.04) / 0.24), syncP = tier === 3 ? Math.exp(-Math.pow((t - (FIRE - 0.12)) / 0.07, 2)) : 0, dis = cl((t - DIS) / 0.7);
        const hp = T * HT, wp = T * WT;
        const scr = m => { const rise = 1 - sm((t - m.on + 0.3) / 0.38); return [H.sx(m.x), H.sy(m.y) - T * (m.z + 0.15 * tilt - 0.6 * rise + 0.05 * Math.sin(t * 2 + m.i))]; };
        M.slice().sort((p, q) => p.y - q.y).forEach(m => { const st = t - m.on + 0.3; if (st <= 0) return; const [mX, mY] = scr(m), e = H.ease.back(cl(st / UNF)), ws = Math.cos(m.yaw), side = Math.sin(m.yaw), dw = Math.hypot(m.x - me.x, m.y - me.y), da = (0.45 + 0.55 * sm((dw - 0.3) / 1.1)) * sm(st / 0.2);
          c.save(); c.translate(mX, mY); c.scale(ws, 1 - 0.22 * tilt);
          const half = (ee, add, al) => { for (const sd of [-1, 1]) { c.save(); c.globalAlpha = al; if (add) c.globalCompositeOperation = 'lighter'; c.translate(0, hp / 2); c.rotate(sd * (1 - ee) * 0.85); c.translate(sd * (1 - ee) * wp * 0.35, -hp / 2); c.drawImage(fr, sd < 0 ? 0 : MW / 2, 0, MW / 2, MH, sd < 0 ? -wp / 2 : 0, -hp / 2, wp / 2, hp); c.restore(); } };
          if (dis > 0) { half(1 - dis * 1.2, true, da * (1 - dis) * 0.9); c.restore(); return; }
          if (e < 0.999 || st < UNF) { half(Math.min(1, e), false, da); c.restore(); return; }
          // the thickness band behind, offset to the turned side, then the mirror
          c.globalAlpha = da; for (let q = 1; q >= 0.5; q -= 0.5) c.drawImage(bk, -wp / 2 + side * wp * 0.13 * q / ws, -hp / 2, wp, hp); c.drawImage(fr, -wp / 2, -hp / 2, wp, hp);
          // the face: a moving sheen, fainter heart reflections, the suspended glowing heart, a ripple at each bend
          const s = wp / MW; c.save(); mPath(c, IHW * s, IHH * s); c.clip();
          const sx = ((t * 0.45 + m.i * 0.37) % 1.6 - 0.8) * wp * 1.4; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 * da; c.translate(sx, 0); c.rotate(0.45); c.drawImage(sheenSpr(), -wp * 0.18, -hp, wp * 0.36, hp * 2); c.restore();
          const NR = tier >= 2 ? 3 : 1; for (let q = NR; q >= 1; q--) { const ox = Math.sin(t * 0.9 + m.i * 1.3 + q * 2) * wp * 0.12 * q, oy = -hp * 0.04 * q + Math.cos(t * 0.7 + q) * hp * 0.02, sz = wp * (0.95 - 0.15 * q); K.blitC(c, K.smallSpr(q % 2 ? LAV : BLUSH), ox, oy, sz, sz, da * (0.34 - 0.07 * q), false); }
          const on = sm((t - m.on) / 0.12), fire = t > FIRE ? Math.exp(-(t - FIRE) * 4) : 0, grow = 1 + 0.06 * Math.sin(t * 4 + m.i) + 0.6 * tilt * (1 - dis) + 0.3 * m.lit, hz = wp * 1.0 * grow;
          K.glowC(c, 0, 0, wp * 0.55 * grow, ROSE, (0.25 + 0.4 * on + 0.4 * m.lit + 0.5 * fire) * da);
          K.blitC(c, K.smallSpr(ROSE), 0, 0, hz, hz, da * (0.35 + 0.65 * on), false);
          K.glowC(c, 0, -hz * 0.03, hz * 0.2, PEARL, (0.35 + 0.5 * m.lit + 0.6 * fire) * on * da);
          const ra = t - m.rip; if (ra > 0 && ra < 0.45) { const u = ra / 0.45; K.blitC(c, K.lineSpr(), 0, 0, wp * (0.5 + 1.4 * u), wp * (0.5 + 1.4 * u), (1 - u) * da, true); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * (1 - u) * da; c.strokeStyle = PEARL; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, wp * (0.2 + 0.6 * u), wp * (0.2 + 0.6 * u) * 1.3, 0, 0, TAU); c.stroke(); c.restore(); }
          c.restore();
          // the frame lights: a flash where the lance strikes, the synchronized pulse before the Celestial volley
          const fl = Math.max(t - m.fl < 0.3 ? 1 - (t - m.fl) / 0.3 : 0, syncP, st < UNF + 0.15 ? cl(1 - (st - UNF) / 0.15) : 0); if (fl > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * fl * da; c.drawImage(fr, -wp / 2, -hp / 2, wp, hp); c.globalCompositeOperation = 'source-over'; }
          // the heart crest on top
          const cy = -hp / 2 - wp * 0.02, cz = wp * 0.55 * (1 + 0.12 * fl); K.glowC(c, 0, cy, cz * (tier === 3 ? 0.8 : 0.6), ROSE, (0.3 + 0.3 * on + (tier === 3 ? 0.25 : 0) + 0.4 * fl) * da); K.blitC(c, K.smallSpr(tier === 3 ? CANDY : ROSE), 0, cy, cz, cz, da, false); if (tier === 3) K.glowC(c, 0, cy - cz * 0.05, cz * 0.35, PEARL, (0.6 + 0.4 * Math.sin(t * 6 + m.i)) * da);
          c.restore(); });
        // the lance legs: a constellation that lingers briefly, its head a bright tapered streak
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (const s of segs) { if (!s.go) continue; const age = t - s.t0 - s.tr, u = cl((t - s.t0) / s.tr), fa = age > 0 ? 1 - sm(age / 0.6) : 1; if (fa <= 0.01) continue; const n = 16, P = [];
          for (let k = 0; k <= n; k++) { const v = u * k / n, p = pt(s, v); P.push([H.sx(p[0]), H.sy(p[1]) - T * p[2]]); }
          for (const [col, lw, al] of [[ROSE, 0.3, 0.18], [CANDY, 0.13, 0.55], [PEARL, 0.045, 0.95]]) { c.strokeStyle = col; for (let k = 1; k <= n; k++) { const v = k / n, tw = age > 0 ? 1 - 0.6 * sm(age / 0.6) : 0.35 + 0.65 * v; c.globalAlpha = al * fa * (age > 0 ? 1 : 0.3 + 0.7 * v); c.lineWidth = Math.max(0.6, T * lw * tw); c.beginPath(); c.moveTo(P[k - 1][0], P[k - 1][1]); c.lineTo(P[k][0], P[k][1]); c.stroke(); } }
          if (age > 0) { const q = P[n]; K.blitC(c, K.starSpr(PEARL), q[0], q[1], T * 0.4 * fa, T * 0.4 * fa, fa, true); if (s.P) { const m = P[n >> 1]; K.blitC(c, K.starSpr(BLUSH), m[0], m[1], T * 0.3 * fa, T * 0.3 * fa, 0.8 * fa, true); } }
          else { const q = P[n], q0 = P[n - 2], an = Math.atan2(q[1] - q0[1], q[0] - q0[0]); K.glowC(c, q[0], q[1], T * 0.45, ROSE, 0.7); K.glowC(c, q[0], q[1], T * 0.18, PEARL, 1); c.save(); c.translate(q[0], q[1]); c.rotate(an); c.globalAlpha = 1; c.drawImage(lanceSpr(), -T * 0.95, -T * 0.12, T, T * 0.24); c.restore(); } }
        // the finale: short shafts from every mirror's heart down into the ring
        for (const sh of shafts) { const u = (t - FIRE) / 0.42; if (u >= 1) continue; const [mX, mY] = scr(sh.m), iX = H.sx(sh.x), iY = H.sy(sh.y), dx = iX - mX, dy = iY - mY, L = Math.hypot(dx, dy), an = Math.atan2(dy, dx), gr = cl(u / 0.15), al = 1 - sm((u - 0.35) / 0.65), wd = T * 0.42 * (1 - 0.5 * sm(u));
          H.ray(c, mX, mY, an, L * gr, wd * 1.6, ROSE, 0.55 * al); c.save(); c.globalCompositeOperation = 'source-over'; c.translate(mX, mY); c.rotate(an); c.globalAlpha = al; c.drawImage(shaftSpr(), -wd * 0.2, -wd * 0.22, L * gr + wd * 0.4, wd * 0.44); c.restore(); H.ray(c, mX, mY, an, L * gr, wd * 0.7, CANDY, 0.6 * al);
          if (u < 0.5) { K.glowC(c, iX, iY - T * 0.1, T * 0.9 * (1 - u), PEARL, 0.8 * (1 - u * 2)); } }
        c.restore();
        B.draw(c, T); } });
  };
})();
