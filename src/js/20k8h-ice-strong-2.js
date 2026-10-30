/* ---------- Ice, reworked: Snowglass Bell, Frostneedle Loom, Icicle Pendulum, Polar Dominoes, Hoarfrost Halo ----------
   Five Ice Strongs brought to the fire / lightning standard with the ice kit (IK): translucent faceted crystal with
   brilliant cyan edges, glowing internal fractures, lavender glints, a glow and snow round every piece, light and frost on
   the floor that fade out (nothing dark is left behind); each has a gathering, a strike and a fading.
   The big shapes (the bell, the needles, the icicle, the plates, the halo blades) are drawn once into cached sprites and
   blitted (plates through an affine transform, so they tip in perspective); shards go through IK's cached shard sprites
   at a few fixed sizes, scaled. Damage is the old factor x C.K x evoK, x1.07 from Adept and x1.15 at Celestial.
   Evolution (C.evo 1 Hatchling .. 4 Adept .. 7 Celestial; stages 2-3 grow level 1, 5-6 grow level 4):
     Snowglass Bell    1 bell / a great bell flanked by 2 small bells / 3 tolls, each bell bigger, the last ringed by 4
     Frostneedle Loom  6 needles / 10 / 3 volleys (8, 10, 12), each larger and longer, then the woven lattice flares
     Icicle Pendulum   1 swing / 2 crossing icicles / 3 swings from alternate sides, each bigger, the last a giant
     Polar Dominoes    6 plates / 9 / two chains: 8 plates, then 10 larger ones ending in a great plate
     Hoarfrost Halo    1 ring of blades / 2 / 3 nested rings released one after another, each wider with more blades
   Anything round the pet is drawn behind it (drawUnder) on the far side, and fades where it would pass over it. */
(() => {
  const S = ELEM_IMPL.ice.strong, TAU = Math.PI * 2;
  let H, K, P;
  const bind = h => { H = h; K = IK.bind(h); P = K.P; return K; };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u);
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sfx = k => { const s = H.X.sfx; if (s && s[k]) s[k](); };
  const stageK = (C, e) => C.K * K.evoK(C) * (e >= 7 ? 1.15 : e >= 4 ? 1.07 : 1);
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

  /* ---------- sprites ---------- */
  const SPR = {};
  function sprite(key, w, h, fn) { let cv = SPR[key]; if (cv) return cv; cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h); return (SPR[key] = cv); }
  /* blit a sprite at (x, y) by its anchor (ax, ay), rotated, scaled kx / ky (kx < 0 mirrors) */
  function blit(c, spr, x, y, ang, kx, ky, ax, ay, a, add) { if (!(a > 0.01) || !(Math.abs(kx) > 0.001) || !(Math.abs(ky) > 0.001)) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.translate(x, y); if (ang) c.rotate(ang); c.scale(kx, ky); c.drawImage(spr, -ax, -ay); c.restore(); }
  /* IK's faceted shard at a few fixed sprite sizes, scaled (so growing or flying shards never build new sprites) */
  const HB = [12, 18, 26, 36, 52, 72, 100, 140, 200];
  function shd(c, x, y, w, h, ang, s, a, t) { if (!(a > 0.01) || h < 2) return; let h0 = HB[HB.length - 1]; for (const b of HB) if (b >= h) { h0 = b; break; } const ar = Math.max(0.15, Math.min(0.7, Math.round(w / h * 10) / 10)); c.save(); c.translate(x, y); c.scale(h / h0, h / h0); K.shard(c, 0, 0, h0 * ar, h0, ang, s, a, t); c.restore(); }

  /* the bell (128 x 128): a faceted translucent shell, dome, waist and flared mouth, its mouth centred at (64, BRIM) */
  const BW = 128, BH = 128, BTOP = 14, BRIM = 108, BRX = 58, BRY = 10, BHH = BRIM - BTOP;
  const BP = [[0, 4], [0.07, 17], [0.18, 26], [0.42, 30], [0.64, 34], [0.8, 41], [0.92, 50], [1, 58]];
  function bprof(v) { for (let i = 1; i < BP.length; i++) if (v <= BP[i][0]) { const [v0, r0] = BP[i - 1], [v1, r1] = BP[i]; return r0 + (r1 - r0) * (v - v0) / (v1 - v0); } return BRX; }
  function bellPath(c) { const cx = BW / 2; c.beginPath(); c.moveTo(cx, BTOP - 1); for (let i = 0; i <= 20; i++) { const v = i / 20; c.lineTo(cx - bprof(v), BTOP + v * BHH); } c.ellipse(cx, BRIM, BRX, BRY, 0, Math.PI, 0, true); for (let i = 20; i >= 0; i--) { const v = i / 20; c.lineTo(cx + bprof(v), BTOP + v * BHH); } c.closePath(); }
  function bellSprite() {
    return sprite('bell', BW, BH, c => { const cx = BW / 2;
      c.save(); bellPath(c); c.clip();
      let g = c.createLinearGradient(cx - BRX, 0, cx + BRX, 0); g.addColorStop(0, rgbaS(P.frost, 0.8)); g.addColorStop(0.28, rgbaS(P.pale, 0.55)); g.addColorStop(0.6, rgbaS(P.ice, 0.45)); g.addColorStop(0.85, rgbaS(P.blue, 0.58)); g.addColorStop(1, rgbaS(P.deep, 0.75)); c.fillStyle = g; c.fillRect(0, 0, BW, BH);
      c.fillStyle = rgbaS(P.deep, 0.3); c.beginPath(); c.ellipse(cx, BRIM, BRX - 4, BRY - 2, 0, 0, TAU); c.fill();
      g = c.createLinearGradient(0, BTOP, 0, BRIM + BRY); g.addColorStop(0, rgbaS(P.white, 0.3)); g.addColorStop(0.55, rgbaS(P.deep, 0.1)); g.addColorStop(1, rgbaS(P.cyan, 0.32)); c.fillStyle = g; c.fillRect(0, 0, BW, BH);
      // facets down the shell: lit edges on the left, shaded on the right
      c.lineWidth = 1.2; for (const fr of [-0.74, -0.42, -0.12, 0.22, 0.56, 0.84]) { c.beginPath(); for (let i = 0; i <= 20; i++) { const v = i / 20; c.lineTo(cx + bprof(v) * fr, BTOP + v * BHH + BRY * Math.sqrt(1 - fr * fr) * v * v * v); } c.strokeStyle = fr < 0.1 ? rgbaS(P.white, 0.55) : rgbaS(P.abyss, 0.32); c.stroke(); }
      c.globalCompositeOperation = 'lighter';
      // a bright band of refracted light on the lit side, a lavender one on the shaded
      c.beginPath(); for (let i = 0; i <= 20; i++) { const v = i / 20; c.lineTo(cx - bprof(v) * 0.66, BTOP + v * BHH + BRY * 0.75 * v * v * v); } for (let i = 20; i >= 0; i--) { const v = i / 20; c.lineTo(cx - bprof(v) * 0.5, BTOP + v * BHH + BRY * 0.86 * v * v * v); } c.closePath(); c.fillStyle = rgbaS(P.white, 0.38); c.fill();
      c.beginPath(); for (let i = 2; i <= 20; i++) { const v = i / 20; c.lineTo(cx + bprof(v) * 0.4, BTOP + v * BHH + BRY * 0.9 * v * v * v); } for (let i = 20; i >= 2; i--) { const v = i / 20; c.lineTo(cx + bprof(v) * 0.5, BTOP + v * BHH + BRY * 0.86 * v * v * v); } c.closePath(); c.fillStyle = rgbaS(P.lav, 0.3); c.fill();
      // glowing internal fractures
      c.lineJoin = 'round'; c.lineCap = 'round'; const FR = [[cx - 22, 34, cx - 10, 48, cx - 16, 62, cx - 4, 78], [cx + 10, 26, cx + 20, 42, cx + 14, 56], [cx - 34, 82, cx - 20, 90, cx - 27, 102], [cx + 22, 70, cx + 34, 86, cx + 27, 100], [cx - 4, 90, cx + 6, 98, cx + 2, 110]];
      for (const L of FR) { c.beginPath(); for (let i = 0; i < L.length; i += 2) c.lineTo(L[i], L[i + 1]); c.strokeStyle = rgbaS(P.cyan, 0.32); c.lineWidth = 3.5; c.stroke(); c.strokeStyle = rgbaS(P.white, 0.75); c.lineWidth = 1; c.stroke(); }
      // two raised bands round the shoulder and the mouth
      c.strokeStyle = rgbaS(P.frost, 0.75); c.lineWidth = 2; c.beginPath(); c.ellipse(cx, BTOP + 0.2 * BHH, bprof(0.2), 4, 0, 0, Math.PI); c.stroke(); c.beginPath(); c.ellipse(cx, BTOP + 0.86 * BHH, bprof(0.86), 8, 0, 0, Math.PI); c.stroke();
      c.restore();
      // the lip: a pale front edge, a fainter back edge; the outline cyan, the shaded side touched with deep blue
      c.lineWidth = 3.5; c.strokeStyle = rgbaS(P.frost, 0.9); c.beginPath(); c.ellipse(cx, BRIM, BRX - 1.5, BRY - 1, 0, 0, Math.PI); c.stroke();
      c.lineWidth = 1.4; c.strokeStyle = rgbaS(P.pale, 0.6); c.beginPath(); c.ellipse(cx, BRIM, BRX - 2.5, BRY - 2, 0, Math.PI, TAU); c.stroke();
      c.lineWidth = 1.7; c.strokeStyle = rgbaS(P.cyan, 0.95); bellPath(c); c.stroke();
      c.lineWidth = 1; c.strokeStyle = rgbaS(P.abyss, 0.45); c.beginPath(); for (let i = 4; i <= 20; i++) { const v = i / 20; c.lineTo(cx + bprof(v) + 0.8, BTOP + v * BHH); } c.stroke();
      // the crown: a little faceted crystal knob
      c.fillStyle = rgbaS(P.frost, 0.95); c.beginPath(); c.moveTo(cx, 1); c.lineTo(cx - 6, BTOP); c.lineTo(cx, BTOP + 5); c.closePath(); c.fill();
      c.fillStyle = rgbaS(P.blue, 0.9); c.beginPath(); c.moveTo(cx, 1); c.lineTo(cx + 6, BTOP); c.lineTo(cx, BTOP + 5); c.closePath(); c.fill();
      c.strokeStyle = rgbaS(P.cyan, 0.9); c.lineWidth = 1; c.beginPath(); c.moveTo(cx, 1); c.lineTo(cx - 6, BTOP); c.lineTo(cx, BTOP + 5); c.lineTo(cx + 6, BTOP); c.closePath(); c.stroke();
    });
  }
  /* the bell's cracks (additive): a jagged white-cyan network radiating from the shoulder, clipped to the shell */
  function crackSprite() {
    return sprite('bellcrack', BW, BH, c => { const cx = BW / 2, oy = BTOP + BHH * 0.42; c.save(); bellPath(c); c.clip(); c.lineJoin = 'round'; c.lineCap = 'round';
      const paths = []; for (let i = 0; i < 9; i++) { let b = i / 9 * TAU + R1(i) * 0.5, x = cx, y = oy; const pts = [[x, y]]; for (let k = 0; k < 5; k++) { b += (R1(i * 7 + k) - 0.5) * 0.9; x += Math.cos(b) * 14; y += Math.sin(b) * 13; pts.push([x, y]); if (k === 2) paths.push([[x, y], [x + Math.cos(b + 0.9) * 12, y + Math.sin(b + 0.9) * 12]]); } paths.push(pts); }
      for (const pts of paths) { c.beginPath(); pts.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = rgbaS(P.cyan, 0.45); c.lineWidth = 4; c.stroke(); c.strokeStyle = rgbaS(P.white, 0.95); c.lineWidth = 1.4; c.stroke(); }
      c.restore(); });
  }
  /* a frost needle (184 x 26) pointing along +x, its tip at (180, 13): a lit upper face, a shaded lower face, a white
     ridge, a cyan rim and fracture chevrons; its tail fades into frost */
  function needleSprite() {
    return sprite('needle', 184, 26, c => { const y = 13;
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45; blitSized(c, glowSprite(P.cyan), 30, 0, 154, 26); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      let g = c.createLinearGradient(0, y - 6, 0, y); g.addColorStop(0, rgbaS(P.white, 0.95)); g.addColorStop(1, rgbaS(P.pale, 0.8)); c.fillStyle = g; c.beginPath(); c.moveTo(6, y); c.lineTo(46, y - 4.2); c.lineTo(148, y - 5); c.lineTo(181, y); c.closePath(); c.fill();
      g = c.createLinearGradient(0, y, 0, y + 6); g.addColorStop(0, rgbaS(P.ice, 0.85)); g.addColorStop(1, rgbaS(P.deep, 0.9)); c.fillStyle = g; c.beginPath(); c.moveTo(6, y); c.lineTo(46, y + 4.2); c.lineTo(148, y + 5); c.lineTo(181, y); c.closePath(); c.fill();
      c.strokeStyle = rgbaS(P.cyan, 0.95); c.lineWidth = 1; c.beginPath(); c.moveTo(46, y - 4.2); c.lineTo(148, y - 5); c.lineTo(181, y); c.stroke(); c.strokeStyle = rgbaS(P.abyss, 0.55); c.beginPath(); c.moveTo(46, y + 4.2); c.lineTo(148, y + 5); c.lineTo(181, y); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = P.white; c.lineWidth = 1.3; c.beginPath(); c.moveTo(36, y - 0.5); c.lineTo(178, y - 0.3); c.stroke();
      c.strokeStyle = rgbaS(P.cyan, 0.8); c.lineWidth = 1; for (let i = 0; i < 5; i++) { const x = 62 + i * 20; c.beginPath(); c.moveTo(x - 4, y - 3.5); c.lineTo(x + 2, y + 0.5); c.lineTo(x - 3, y + 3.8); c.stroke(); }
      c.globalCompositeOperation = 'destination-out'; g = c.createLinearGradient(0, 0, 60, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 60, 26);
    });
  }
  /* a hanging icicle (64 x 240) pointing down from its frost cap at (32, 8): growth ridges, a lit and a shaded face
     meeting on a ridge, a glowing core, fractures, and two small icicles beside it */
  function icicleSprite() {
    return sprite('icicle', 64, 240, c => { const cx = 32;
      const Lc = [[cx - 20, 8], [cx - 17, 42], [cx - 19, 54], [cx - 13, 94], [cx - 14.5, 104], [cx - 9, 146], [cx - 9.5, 156], [cx - 4.5, 196], [cx, 236]], Rc = Lc.map(([x, y], i) => [2 * cx - x + (i % 2 ? 1 : -1), y]);
      const ridge = x => cx - 3 + (x - 8) * 0.012;
      const side = (cont, g) => { c.fillStyle = g; c.beginPath(); c.moveTo(ridge(8), 6); cont.forEach(p => c.lineTo(p[0], p[1])); for (let y = 236; y >= 6; y -= 23) c.lineTo(ridge(y), y); c.closePath(); c.fill(); };
      // the little icicles behind
      for (const s of [-1, 1]) { const x0 = cx + s * 16, L = s < 0 ? 64 : 48; let g = c.createLinearGradient(0, 8, 0, 8 + L); g.addColorStop(0, rgbaS(P.pale, 0.85)); g.addColorStop(1, rgbaS(P.blue, 0.75)); c.fillStyle = g; c.beginPath(); c.moveTo(x0 - 7, 8); c.lineTo(x0 + 6, 8); c.lineTo(x0 + s * 3, 8 + L); c.closePath(); c.fill(); c.strokeStyle = rgbaS(P.cyan, 0.85); c.lineWidth = 1; c.stroke(); }
      let g = c.createLinearGradient(0, 6, 0, 236); g.addColorStop(0, rgbaS(P.white, 0.95)); g.addColorStop(0.35, rgbaS(P.frost, 0.78)); g.addColorStop(0.75, rgbaS(P.pale, 0.62)); g.addColorStop(1, rgbaS(P.ice, 0.7)); side(Lc, g);
      g = c.createLinearGradient(0, 6, 0, 236); g.addColorStop(0, rgbaS(P.ice, 0.85)); g.addColorStop(0.45, rgbaS(P.blue, 0.68)); g.addColorStop(1, rgbaS(P.deep, 0.8)); side(Rc, g);
      c.globalCompositeOperation = 'lighter';
      g = c.createLinearGradient(0, 20, 0, 220); g.addColorStop(0, rgbaS(P.cyan, 0.55)); g.addColorStop(1, rgbaS(P.cyan, 0.1)); c.strokeStyle = g; c.lineWidth = 5; c.beginPath(); c.moveTo(cx + 1, 20); c.lineTo(cx, 220); c.stroke();
      c.strokeStyle = rgbaS(P.white, 0.6); c.lineWidth = 1.2; for (const y of [54, 104, 156]) { const w = y < 80 ? 18 : y < 130 ? 13.5 : 9; c.beginPath(); c.ellipse(cx, y, w, 3, 0, 0.15, Math.PI - 0.15); c.stroke(); }
      c.strokeStyle = rgbaS(P.cyan, 0.75); c.lineWidth = 1; const FR = [[cx - 9, 66, cx - 3, 78, cx - 8, 88], [cx + 7, 116, cx + 2, 128, cx + 6, 138], [cx - 5, 170, cx + 1, 180]]; for (const L of FR) { c.beginPath(); for (let i = 0; i < L.length; i += 2) c.lineTo(L[i], L[i + 1]); c.stroke(); }
      c.strokeStyle = rgbaS(P.white, 0.95); c.lineWidth = 1.4; c.beginPath(); c.moveTo(ridge(8), 8); c.lineTo(cx, 234); c.stroke();
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = rgbaS(P.cyan, 0.95); c.lineWidth = 1.5; c.beginPath(); Lc.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
      c.strokeStyle = rgbaS(P.abyss, 0.5); c.lineWidth = 1.2; c.beginPath(); Rc.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
      // the frost cap
      g = c.createLinearGradient(0, 2, 0, 14); g.addColorStop(0, rgbaS(P.white, 0.95)); g.addColorStop(1, rgbaS(P.pale, 0.7)); c.fillStyle = g; c.beginPath(); c.ellipse(cx, 8, 23, 6, 0, 0, TAU); c.fill(); c.strokeStyle = rgbaS(P.cyan, 0.8); c.lineWidth = 1; c.stroke();
    });
  }
  /* a domino plate (64 x 112), base along the bottom, a faceted top: translucent face, lit and shaded facets, fractures,
     a cyan rim; a darker back face for its thickness; a sheen band for its reflection flash */
  const PW = 64, PH = 112, PLATE = [[3, 112], [61, 112], [62, 30], [50, 9], [33, 2], [14, 10], [2, 34]];
  const platePath = c => { c.beginPath(); PLATE.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  function plateSprite(back) {
    return sprite(back ? 'plateB' : 'plate', PW, PH, c => {
      c.save(); platePath(c); c.clip();
      let g = c.createLinearGradient(0, 0, PW, PH); if (back) { g.addColorStop(0, rgbaS(P.ice, 0.55)); g.addColorStop(0.5, rgbaS(P.deep, 0.55)); g.addColorStop(1, rgbaS(P.abyss, 0.7)); } else { g.addColorStop(0, rgbaS(P.white, 0.88)); g.addColorStop(0.3, rgbaS(P.pale, 0.6)); g.addColorStop(0.7, rgbaS(P.ice, 0.5)); g.addColorStop(1, rgbaS(P.blue, 0.7)); }
      c.fillStyle = g; c.fillRect(0, 0, PW, PH);
      if (!back) {
        c.fillStyle = rgbaS(P.white, 0.28); c.beginPath(); c.moveTo(2, 34); c.lineTo(14, 10); c.lineTo(33, 2); c.lineTo(27, 42); c.closePath(); c.fill();
        c.fillStyle = rgbaS(P.deep, 0.28); c.beginPath(); c.moveTo(33, 2); c.lineTo(50, 9); c.lineTo(62, 30); c.lineTo(40, 46); c.closePath(); c.fill();
        c.strokeStyle = rgbaS(P.white, 0.45); c.lineWidth = 1; c.beginPath(); c.moveTo(27, 42); c.lineTo(22, 112); c.moveTo(40, 46); c.lineTo(46, 112); c.moveTo(27, 42); c.lineTo(40, 46); c.stroke();
        g = c.createLinearGradient(0, 80, 0, PH); g.addColorStop(0, rgbaS(P.frost, 0)); g.addColorStop(1, rgbaS(P.frost, 0.55)); c.fillStyle = g; c.fillRect(0, 80, PW, 32);
        c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; const FR = [[8, 60, 17, 70, 12, 84, 20, 96], [44, 58, 52, 72, 47, 80], [30, 74, 36, 88, 31, 100]];
        for (const L of FR) { c.beginPath(); for (let i = 0; i < L.length; i += 2) c.lineTo(L[i], L[i + 1]); c.strokeStyle = rgbaS(P.cyan, 0.35); c.lineWidth = 3.5; c.stroke(); c.strokeStyle = rgbaS(P.white, 0.8); c.lineWidth = 1; c.stroke(); }
        g = c.createLinearGradient(0, 0, 0, 60); g.addColorStop(0, rgbaS(P.cyan, 0)); g.addColorStop(1, rgbaS(P.cyan, 0.18)); c.fillStyle = g; c.fillRect(0, 0, PW, PH);
      }
      c.restore(); c.lineJoin = 'round';
      c.strokeStyle = back ? rgbaS(P.blue, 0.7) : rgbaS(P.cyan, 0.95); c.lineWidth = 1.8; platePath(c); c.stroke();
      if (!back) { c.strokeStyle = rgbaS(P.white, 0.95); c.lineWidth = 1.6; c.beginPath(); c.moveTo(2, 34); c.lineTo(14, 10); c.lineTo(33, 2); c.lineTo(50, 9); c.stroke(); }
    });
  }
  function sheenSprite() {
    return sprite('sheen', PW, PH, c => { c.save(); platePath(c); c.clip(); const g = c.createLinearGradient(0, PH * 0.75, PW, PH * 0.25); g.addColorStop(0.25, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,0.9)'); g.addColorStop(0.55, rgbaS(P.lav, 0.7)); g.addColorStop(0.75, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, PW, PH); c.restore(); });
  }
  /* a plate face mapped onto the parallelogram from base point B: across vector (px, py), up vector (vx, vy) */
  function plateAt(c, spr, bx, by, px, py, vx, vy, a, add) { if (!(a > 0.01)) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.transform(px / PW, py / PW, -vx / PH, -vy / PH, bx - 0.5 * px + vx, by - 0.5 * py + vy); c.drawImage(spr, 0, 0); c.restore(); }
  /* a curved halo blade (40 x 120), pointing up, centred at (20, 60): a sickle of ice, lit outer face, shaded inner edge */
  function bladeSprite() {
    return sprite('blade', 40, 120, c => {
      const out = () => { c.moveTo(22, 2); c.quadraticCurveTo(-8, 58, 17, 118); }, path = () => { c.beginPath(); out(); c.quadraticCurveTo(25, 60, 22, 2); c.closePath(); };
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; blitSized(c, glowSprite(P.cyan), -6, 0, 52, 120); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      let g = c.createLinearGradient(2, 0, 26, 0); g.addColorStop(0, rgbaS(P.white, 0.92)); g.addColorStop(0.45, rgbaS(P.pale, 0.7)); g.addColorStop(0.75, rgbaS(P.ice, 0.62)); g.addColorStop(1, rgbaS(P.deep, 0.85)); c.fillStyle = g; path(); c.fill();
      c.save(); path(); c.clip(); c.fillStyle = rgbaS(P.deep, 0.35); c.beginPath(); c.moveTo(22, 2); c.quadraticCurveTo(12, 60, 17, 118); c.quadraticCurveTo(25, 60, 22, 2); c.fill();
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(P.cyan, 0.75); c.lineWidth = 1; for (let i = 0; i < 4; i++) { const y = 26 + i * 22; c.beginPath(); c.moveTo(6 + i * 0.5, y); c.lineTo(13, y + 6); c.lineTo(9, y + 13); c.stroke(); } c.restore();
      c.strokeStyle = rgbaS(P.cyan, 0.95); c.lineWidth = 1.4; path(); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(P.white, 0.95); c.lineWidth = 1.3; c.beginPath(); c.moveTo(22, 4); c.quadraticCurveTo(6, 60, 17, 116); c.stroke();
    });
  }

  /* ---------- shared effects ---------- */
  /* tumbling shard fragments thrown from (x, y) at height z (tiles): o.v speed, o.up, o.size, o.life, o.a and o.spread to aim them */
  function flyers(x, y, z, n, o) {
    o = o || {}; const N = H.n(n), ps = [], v = o.v || 5, sz = o.size || 0.35, life = o.life || 0.8;
    for (let i = 0; i < N; i++) { const b = o.a != null ? o.a + (Math.random() - 0.5) * (o.spread || TAU) : i / N * TAU + Math.random() * 0.5, s = v * (0.55 + Math.random() * 0.6);
      ps.push({ x, y, z: z * (0.5 + Math.random() * 0.7), vx: Math.cos(b) * s, vy: Math.sin(b) * s * 0.8, vz: (o.up || 3) * (0.5 + Math.random()), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, w: sz * (0.35 + Math.random() * 0.25), h: sz * (0.7 + Math.random() * 0.6), s: i }); }
    H.add({ life, update(dt) { for (const p of ps) { p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= 16 * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = -p.vz * 0.25; p.vx *= 0.5; p.vy *= 0.5; p.vr *= 0.5; } p.rot += p.vr * dt; } },
      draw(c, f, X, Y, T) { const k = cl(f.life / (life * 0.55)); for (const p of ps) shd(c, H.sx(p.x), H.sy(p.y) - p.z * T, p.w * T, p.h * T, p.rot, p.s, 0.92 * k); } });
  }
  /* frost on the floor that grows and fades out (light only) */
  function frostMark(x, y, r, life, s, n, pool) { H.add({ life, x, y, drawUnder(c, f, X, Y, T) { const k = cl(f.life / (life * 0.6)), u = sm(f.t / 0.22); K.floorLight(c, X, Y, r * T * 1.2, 0.45 * k); K.frostVeins(c, X, Y, r * T, u, 0.85 * k, s || 0, n || 7); if (pool) K.frozenPool(c, X, Y, r * T * 0.72 * u, 0.85 * k, f.t); } }); }
  /* frost branches that spring out and retract */
  function frostFlick(x, y, r, s) { H.add({ life: 0.5, x, y, drawUnder(c, f, X, Y, T) { const u = f.t < 0.16 ? H.ease.out(f.t / 0.16) : cl(1 - (f.t - 0.16) / 0.34); K.frostVeins(c, X, Y, r * T, u, 0.95, s, 6); K.floorLight(c, X, Y, r * T * 0.9, 0.35 * u); } }); }
  /* the pet's screen fade where something tall passes over it: a 0.3..1 multiplier from the distance (px) to segment ab */
  function petFade(T, ax, ay, bx, by, wide) { const me = H.me, mx = H.sx(me.x), my = H.sy(me.y) - T * 0.5, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, u = cl(((mx - ax) * dx + (my - ay) * dy) / L2), d = Math.hypot(ax + dx * u - mx, ay + dy * u - my); return 0.3 + 0.7 * cl((d - (wide || 0.4) * T) / (0.6 * T)); }

  /* ======================= I-S03 Snowglass Bell =======================
     A thin bell of faceted ice crystallises over the aim from its crown down; a bright frost ring climbs its surface, it
     cracks with light from within (the clapper glows white), and it breaks in a short radial burst of curved fragments, a
     soft halo of snow and frost that spreads and fades on the floor. */
  function bell(C, x, y, R, t0, dmg, o) {
    o = o || {}; const sp = o.sp || 1, FORM = 0.32 * sp, RING = 0.45 * sp, BRK = FORM + RING + 0.14 * sp, s = o.seed || 0, me = H.me;
    H.X.after(t0, () => { H.warn(x, y, R, BRK, C.col); if (!o.quiet) sfx('hum'); });
    H.add({ life: t0 + BRK + 1.0, x, y,
      update(dt, f) { const u = f.t - t0; if (u > 0 && u < BRK) { K.aura(x, y, R * 0.8, dt, 10 * R, R * 0.6); if (u < FORM && Math.random() < 0.6 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'spark', x: x + Math.cos(b) * R * 1.3, y: y + Math.sin(b) * R * 0.7 - R * 0.8, vx: -Math.cos(b) * R * 3, vy: -Math.sin(b) * R * 1.6, life: 0.3, max: 0.3, size: 2, color: Math.random() < 0.5 ? P.white : P.cyan }); } } },
      drawUnder(c, f, X, Y, T) { const u = f.t - t0; if (u < 0) return; const out = u > BRK ? cl(1 - (u - BRK) / 1.0) : 1, up = cl(u / BRK);
        K.floorLight(c, X, Y, R * T * (0.7 + 0.6 * up), (0.25 + 0.4 * up) * out, P.ice);
        if (u > BRK) { const v = u - BRK; K.frostVeins(c, X, Y, R * T * 1.15, sm(v / 0.2), 0.9 * out, s, 9); K.frozenPool(c, X, Y, R * T * 0.85 * sm(v / 0.15), 0.85 * out, f.t); }
        else K.frostVeins(c, X, Y, R * T * 0.85, sm(u / BRK) * 0.8, 0.55, s, 7); },
      draw(c, f, X, Y, T) { const u = f.t - t0; if (u < 0) return; const k = R * T * 0.74 / BRX, top = Y - BRIM * k;
        if (u > BRK) { const v = u - BRK; K.glow(c, X, Y - BHH * k * 0.45, R * T * (0.9 + v * 1.6), P.frost, 0.55 * cl(1 - v / 0.55)); K.glow(c, X, Y - BHH * k * 0.45, R * T * (0.5 + v), P.white, 0.6 * cl(1 - v / 0.25)); return; }
        const form = cl(u / FORM), ring = cl((u - FORM) / RING), crack = cl((u - FORM - RING * 0.55) / (BRK - FORM - RING * 0.55)), jx = crack > 0.2 ? (Math.random() - 0.5) * 2.2 * crack : 0;
        const fa = (o.near ? 0.55 : 1) * (Math.hypot(me.x - x, me.y - y) < R * 1.25 ? 0.45 : 1);
        K.glow(c, X, Y - BHH * k * 0.5, R * T * 1.15, P.cyan, (0.18 + 0.35 * crack) * form);
        const rv = sm(form) * BH; c.save(); c.globalAlpha = (0.45 + 0.55 * form) * fa; c.drawImage(bellSprite(), 0, 0, BW, Math.max(1, rv), X - BW / 2 * k + jx, top, BW * k, Math.max(1, rv) * k); c.restore();
        if (form < 1) { const v = cl((rv - BTOP) / BHH), yy = top + rv * k, rx = (bprof(v) + 3) * k; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(P.white, 0.9); c.lineWidth = 2; c.beginPath(); c.ellipse(X, yy, rx, rx * 0.18, 0, 0, TAU); c.stroke(); c.restore(); K.glow(c, X, yy, rx * 1.3, P.cyan, 0.45); }
        // the clapper: a crystal drop inside that brightens to a white core as the bell cracks
        const cly = top + (BTOP + 0.74 * BHH) * k; K.glow(c, X, cly, k * 22 * (1 + crack * 2.2), P.white, (0.3 + 0.7 * crack) * form * fa); shd(c, X, cly - 6 * k, 9 * k, 22 * k, Math.PI / 2, s, 0.85 * form * fa, f.t);
        if (ring > 0 && ring < 1) { const v = 1 - sm(ring), yy = top + (BTOP + v * BHH) * k, rx = (bprof(v) + 2) * k; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(P.cyan, 0.4); c.lineWidth = 7; c.beginPath(); c.ellipse(X + jx, yy, rx, Math.max(1, rx * 0.2), 0, 0, TAU); c.stroke(); c.strokeStyle = rgbaS(P.white, 0.95); c.lineWidth = 2.4; c.stroke(); c.restore(); K.glow(c, X, yy, rx * 1.25, P.cyan, 0.4); }
        if (crack > 0) blit(c, crackSprite(), X + jx, top, 0, k, k, BW / 2, 0, crack * fa, true);
      } });
    H.X.after(t0 + BRK, () => {
      for (const m of H.near(x, y, R)) K.shatterAt(m.x, m.y, 0.6);
      H.hitArea(x, y, R, dmg, C.dmgO({ kb: 3, freeze: o.freeze || 0.7 }));
      const z = R * 0.55; flyers(x, y, z, 8 + R * 4, { v: 3 + R * 2.6, up: 3.5, size: 0.3 + R * 0.14, life: 0.85 });
      for (let i = 0; i < H.n(10 + R * 6); i++) { const b = i / (10 + R * 6) * TAU; H.P({ kind: 'shard', x: x + Math.cos(b) * R * 0.3, y: y - z + Math.sin(b) * R * 0.2, vx: Math.cos(b) * (4 + R * 2.5), vy: Math.sin(b) * (2 + R) - 1.5, g: 9, life: 0.6, max: 0.6, size: 3.5 + R, rot: b + 1.3, vr: 6, color: i % 3 ? P.frost : P.cyan }); }
      for (let i = 0; i < H.n(14 + R * 6); i++) { const b = i / (14 + R * 6) * TAU; H.P({ kind: 'ember', x: x + Math.cos(b) * R * 0.5, y: y - z + Math.sin(b) * R * 0.3, vx: Math.cos(b) * (1.4 + R * 0.8), vy: Math.sin(b) * (0.8 + R * 0.4) + 0.3, g: 0.4, drag: 1.2, life: 1.1, max: 1.1, size: 2.4, color: i % 2 ? P.white : P.pale }); }
      K.glitter(x, y - z, 8 + R * 4, 4 + R * 2); H.X.ring(x, y, 0.3, R * 1.15, 0.45, P.frost, 0.5); H.X.light(x, y, R * 2.2, 0.45);
      H.X.shake(2 + R * 1.6, 0.12); H.X.hitstop(o.big ? 0.06 : 0.03); if (o.big) H.X.flash(0.08, P.frost); if (!o.quiet) sfx('crash');
    });
    return t0 + BRK;
  }
  S.snowbell = (C, h) => { bind(h); const e = K.evo(C), x = C.tx, y = C.ty, a = C.a, px = -Math.sin(a), py = Math.cos(a), tot = C.base * 2.5 * stageK(C, e); H.X.sfx.sparkle && H.X.sfx.sparkle();
    const BT = sp => (0.32 + 0.45 + 0.14) * sp;
    if (e >= 7) {   // three tolls, each bell bigger; the last ringed by four small bells that break with it
      bell(C, x, y, 1.35, 0, tot * 0.25, { sp: 0.82 }); bell(C, x, y, 1.85, 0.6, tot * 0.32, { sp: 0.9, seed: 1 });
      const t3 = 1.25, brk = t3 + BT(1.05); bell(C, x, y, 2.5, t3, tot * 0.43, { sp: 1.05, seed: 2, freeze: 1, big: 1 });
      for (let i = 0; i < 4; i++) { const b = a + Math.PI / 4 + i * Math.PI / 2; bell(C, x + Math.cos(b) * 2.6, y + Math.sin(b) * 2.6, 0.85, brk - BT(0.8), tot * 0.1, { sp: 0.8, seed: 3 + i, quiet: 1 }); }
    } else if (e >= 4) {   // a great bell flanked by two small ones, which break first
      const R = 1.85 + 0.08 * (e - 4); for (const s of [-1, 1]) bell(C, x + px * s * (R + 0.5), y + py * s * (R + 0.5), 1.05, 0.12, tot * 0.2, { sp: 0.75, seed: s + 4, quiet: s > 0 });
      bell(C, x, y, R, 0, tot * 0.85, { sp: 1.12, seed: 1, freeze: 0.8, big: 1 });
    } else bell(C, x, y, 1.7 + 0.06 * (e - 1), 0, tot, { seed: 0 });
  };

  /* ======================= I-S04 Frostneedle Loom =======================
     Long ice needles crystallise in two staggered rows ahead of the pet, strung on faint warp threads of frost; they fire
     alternately, each crossing to the other side, so their trails weave a lattice over the floor; each impact springs
     frost branches that retract. At Celestial three volleys, each larger and longer, then the woven lattice flares. */
  S.frostloom = (C, h) => { bind(h); const e = K.evo(C), me = H.me, a = C.a, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca, tot = C.base * 3.0 * stageK(C, e), x0 = me.x, y0 = me.y;
    const plan = e >= 7 ? [{ n: 8, sc: 1, rng: 4.2, st: 0.07 }, { n: 10, sc: 1.2, rng: 4.9, st: 0.06 }, { n: 12, sc: 1.45, rng: 5.7, st: 0.05 }] : e >= 4 ? [{ n: 10 + (e - 4), sc: 1.12, rng: 4.6, st: 0.075 }] : [{ n: 6 + (e - 1), sc: 1, rng: 4.2, st: 0.1 }];
    const NT = plan.reduce((s, v) => s + v.n, 0), dk = tot * (e >= 7 ? 0.8 : 1) / NT, FORM = 0.36, needles = []; let tv = 0;
    plan.forEach((v, vi) => { const gap = Math.min(0.55, 2.2 / (v.n / 2));
      for (let i = 0; i < v.n; i++) { const s = i % 2 ? 1 : -1, d = 0.95 + Math.floor(i / 2) * gap + (i % 2) * gap * 0.5, off = (0.75 + 0.1 * vi) * v.sc;
        needles.push({ vi, sc: v.sc, rng: v.rng, s, x: x0 + ca * d + px * s * off, y: y0 + sa * d + py * s * off, z: (0.55 + (i % 2) * 0.32 + vi * 0.12), ta: 0, tf: tv + FORM + i * v.st, tb: tv + i * 0.025, fired: false, done: false, hits: new Set(), pierce: 2, seed: i + vi * 13 }); }
      for (const n of needles) if (n.vi === vi) { const dd = Math.max(Math.max(1.9, Math.min(3.6, Math.hypot(C.tx - x0, C.ty - y0))) + 0.25 * vi, (n.x - x0) * ca + (n.y - y0) * sa + 1.1), gx = x0 + ca * dd, gy = y0 + sa * dd, dn = Math.hypot(gx - n.x, gy - n.y); n.ta = dn > 0.5 ? Math.atan2(gy - n.y, gx - n.x) : a - n.s * 0.36; }
      if (vi === 0) H.warnLine(x0, y0, a, v.rng + 0.8, 2.2, FORM + v.n * v.st, C.col);
      tv += FORM + v.n * v.st + 0.12; });
    const tLast = Math.max(...needles.map(n => n.tf)) + 0.35, FLARE = e >= 7 ? tLast + 0.12 : -1, END = (FLARE > 0 ? FLARE + 0.7 : tLast + 0.6);
    sfx('hum'); plan.forEach((v, vi) => { if (vi) H.X.after(needles.find(n => n.vi === vi).tb, () => sfx('hum')); });
    const T_OF = n => Math.max(0.2, n.rng / 17);
    H.add({ life: END,
      update(dt, f) { for (const n of needles) {
          if (!n.fired && f.t >= n.tb && f.t < n.tf) K.aura(n.x, n.y, 0.25 * n.sc, dt, 6, n.z);
          if (!n.fired && f.t >= n.tf) { n.fired = true; n.lx = n.x; n.ly = n.y; n.lz = n.z; n.hx = n.x; n.hy = n.y; n.hz = n.z; n.d = 0; if (n.vi === 0 || Math.random() < 0.5) sfx('whoosh'); }
          if (n.fired && !n.done) { const sp = n.rng / T_OF(n), step = sp * dt, nx = n.hx + Math.cos(n.ta) * step, ny = n.hy + Math.sin(n.ta) * step; n.d += step; n.hz = n.lz + (0.3 - n.lz) * cl(n.d / n.rng);
            for (const m of H.living()) { if (n.hits.has(m)) continue; const rx = m.x - n.hx, ry = m.y - n.hy, al = cl((rx * (nx - n.hx) + ry * (ny - n.hy)) / (step * step || 1)), d = Math.hypot(n.hx + (nx - n.hx) * al - m.x, n.hy + (ny - n.hy) * al - m.y); if (d < 0.28 * n.sc + m.r) { n.hits.add(m); H.X.hitMon(m, dk, C.dmgO({ kb: 1.5, chill: true })); frostFlick(m.x, m.y, 0.9 * n.sc, n.seed); K.glitter(m.x, m.y - 0.4, 6, 4); if (--n.pierce < 0) { n.done = true; n.te = f.t; break; } } }
            if (!n.done && (n.d >= n.rng || H.X.blocked(nx, ny, 0.1, 0))) { n.done = true; n.te = f.t; frostFlick(nx, ny, 0.6 * n.sc, n.seed + 3); K.glitter(nx, ny - n.hz, 4, 3); }
            if (!n.done) { n.hx = nx; n.hy = ny; if (Math.random() < 0.7 * H.Q()) H.P({ kind: 'ember', x: nx, y: ny - n.hz, vx: -Math.cos(n.ta) * 0.6, vy: 0.3, life: 0.35, max: 0.35, size: 2, color: P.white }); } } } },
      drawUnder(c, f, X, Y, T) { const t = f.t, fl = FLARE > 0 && t > FLARE ? cl(1 - (t - FLARE) / 0.6) : 0;
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        // the woven lattice on the floor: every needle's ground path, a cold light that fades (or flares at Celestial)
        for (const n of needles) { if (!n.fired) { if (t > n.tb) K.floorLight(c, H.sx(n.x), H.sy(n.y), T * 0.5 * n.sc, 0.3 * cl((t - n.tb) / 0.3)); continue; }
          const fade = FLARE > 0 ? (t < FLARE ? 1 : fl) : n.done ? cl(1 - (t - n.te) / 0.7) : 1, a = (0.22 + 0.7 * fl) * fade; if (a < 0.01) continue;
          const ax = H.sx(n.lx), ay = H.sy(n.ly), bx = H.sx(n.hx), by = H.sy(n.hy); c.globalAlpha = a; c.strokeStyle = P.cyan; c.lineWidth = T * 0.16 * n.sc * (1 + fl); c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.globalAlpha = Math.min(1, a * 1.6); c.strokeStyle = P.frost; c.lineWidth = 1.2 + fl * 1.5; c.stroke(); }
        c.restore();
        if (fl > 0) { const L = plan[plan.length - 1].rng; for (let i = 0; i <= 4; i++) { const d = 0.8 + i / 4 * L; K.floorLight(c, H.sx(x0 + ca * d), H.sy(y0 + sa * d), T * 1.3, 0.5 * fl, P.cyan); } } },
      draw(c, f, X, Y, T) { const t = f.t, spr = needleSprite();
        // the warp threads of the loom: each row's waiting needles strung together
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineWidth = 1; for (const s of [-1, 1]) { let first = true; c.beginPath(); for (const n of needles) { if (n.s !== s || n.fired || t < n.tb) continue; const nx = H.sx(n.x), ny = H.sy(n.y) - n.z * T; if (first) { c.moveTo(nx, ny); first = false; } else c.lineTo(nx, ny); } c.strokeStyle = rgbaS(P.pale, 0.45); c.stroke(); } c.restore();
        for (const n of needles) { if (t < n.tb) continue;
          const len = T * 1.55 * n.sc, k = len / 176;
          if (!n.fired) { const u = H.ease.out(cl((t - n.tb) / 0.3)), nx = H.sx(n.x), ny = H.sy(n.y) - n.z * T, ang = n.ta, cx = nx + Math.cos(ang) * len * 0.5 * u, cy = ny + Math.sin(ang) * len * 0.5 * u, tremble = t > n.tf - 0.12 ? (Math.random() - 0.5) * 1.5 : 0;
            K.glow(c, nx + Math.cos(ang) * len * 0.5, ny + Math.sin(ang) * len * 0.5, len * 0.6, P.cyan, 0.45 * u); blit(c, spr, cx + tremble, cy, ang, k * u, k * 2.1, 180, 13, u); continue; }
          // the flying needle and its trail in the air
          const ax = H.sx(n.lx), ay = H.sy(n.ly) - n.lz * T, bx = H.sx(n.hx), by = H.sy(n.hy) - n.hz * T, fade = n.done ? cl(1 - (t - n.te) / 0.45) : 1;
          if (fade > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.globalAlpha = 0.3 * fade; c.strokeStyle = P.cyan; c.lineWidth = T * 0.12 * n.sc; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.globalAlpha = 0.85 * fade; c.strokeStyle = P.white; c.lineWidth = 1.3; c.stroke(); c.restore(); }
          if (!n.done) { K.glow(c, bx, by, len * 0.5, P.cyan, 0.4); blit(c, spr, bx, by, n.ta, k, k * 2.1, 180, 13, 1); K.glow(c, bx, by, T * 0.22, P.white, 0.7); } }
      } });
    if (FLARE > 0) H.X.after(FLARE, () => { const L = plan[plan.length - 1].rng + 0.6; H.hitLine(x0, y0, a, L, 2.2, tot * 0.2, C.dmgO({ kb: 2.5, freeze: 0.6 }));
      for (let i = 0; i < 5; i++) { const d = 1 + i / 4 * (L - 1.4), xx = x0 + ca * d, yy = y0 + sa * d; flyers(xx, yy, 0.3, 4, { v: 3, up: 4, size: 0.35 }); K.glitter(xx, yy - 0.3, 6, 4); }
      H.X.light(x0 + ca * L * 0.5, y0 + sa * L * 0.5, L * 0.9, 0.5); H.X.shake(5, 0.14); H.X.hitstop(0.04); H.X.flash(0.06, P.frost); sfx('crash'); });
  };

  /* ======================= I-S07 Icicle Pendulum =======================
     A long icicle crystallises from a frost knot high above and beside the pet, hung on a curved thread of frost; it swings
     forward through a broad arc, leaving a crescent of cold light, and shatters at its lowest point in a splash of shards.
     Adept: two icicles from the same knot swing across one another; Celestial: three swings from alternate sides, each
     icicle bigger and reaching further, the last a giant. */
  S.pendulum = (C, h) => { bind(h); const e = K.evo(C), me = H.me, a = C.a, dx = Math.cos(a), dy = Math.sin(a), s0 = Math.abs(dx) > 0.3 ? Math.sign(dx) : 1, tot = C.base * 2.5 * stageK(C, e);
    const plan = e >= 7 ? [{ side: s0, D: 1.55, sc: 1, t0: 0, sh: 0.25 }, { side: -s0, D: 2.05, sc: 1.25, t0: 0.55, sh: 0.32 }, { side: s0, D: 2.65, sc: 1.6, t0: 1.15, sh: 0.43, big: 1 }]
      : e >= 4 ? [{ side: s0, D: 1.75, sc: 1.12, t0: 0, sh: 0.5 }, { side: -s0, D: 1.75, sc: 1.12, t0: 0.3, sh: 0.5, big: 1 }] : [{ side: s0, D: 1.7, sc: 1 + 0.04 * (e - 1), t0: 0, sh: 1, big: 1 }];
    const FORM = 0.3, SW = 0.5, LOW = 0.642, phiAt = (p, t) => { const sw = cl((t - p.t0 - FORM) / SW); return (-1.45 + 1.95 * H.ease.io(sw)) * p.side; };
    sfx('hum');
    for (const p of plan) { p.cx = me.x + dx * p.D; p.cy = me.y + dy * p.D; p.hit = p.t0 + FORM + SW * LOW; p.R = 1.25 * p.sc; p.len = p.D + 1.25 * p.sc;
      H.X.after(p.t0, () => H.warnCone(me.x, me.y, a, p.len, 0.62, p.hit - p.t0, C.col)); H.X.after(p.t0 + FORM, () => sfx('whoosh'));
      H.X.after(p.hit, () => { me.sq = 0.75; for (const m of H.near(p.cx, p.cy, p.R)) K.shatterAt(m.x, m.y, 0.6);
        H.hitCone(me.x, me.y, a, p.len, 0.62, tot * p.sh * 0.6, C.dmgO({ kb: 5, chill: true })); H.hitArea(p.cx, p.cy, p.R, tot * p.sh * 0.4, C.dmgO({ kb: 3, chill: true, freeze: p.big ? 0.6 : 0 }));
        const z = 0.7 * p.sc; flyers(p.cx, p.cy, z, 10 + 6 * p.sc, { v: 4.5 * p.sc, up: 4, size: 0.4 * p.sc, life: 0.85 }); flyers(p.cx, p.cy, z, 5, { a, spread: 1.4, v: 7 * p.sc, up: 3, size: 0.5 * p.sc });
        K.glitter(p.cx, p.cy - z, 14 * p.sc, 6 * p.sc); K.snow(p.cx, p.cy - z, 12 * p.sc); K.fragments(p.cx, p.cy - z, 8 * p.sc, 6);
        H.X.ring(p.cx, p.cy, 0.2, p.R * 1.25, 0.4, P.frost, 0.5); H.X.light(p.cx, p.cy, p.R * 2.2, 0.45); H.X.shake(4 + 3 * p.sc, 0.13); H.X.hitstop(p.big ? 0.06 : 0.035); if (p.big && e >= 4) H.X.flash(0.07, P.frost); sfx('crash');
        frostMark(p.cx, p.cy, p.R * 1.1, 0.9, p.sc * 3, 8, true); }); }
    const last = plan[plan.length - 1], END = last.hit + 0.55;
    H.add({ life: END,
      update(dt, f) { for (const p of plan) { const u = f.t - p.t0; if (u < 0 || f.t > p.hit) continue; if (Math.random() < 0.5 * H.Q()) { const v = Math.random(); H.P({ kind: 'ember', x: me.x + (p.cx - me.x) * v - p.side * (1 - v) * 0.6, y: me.y + (p.cy - me.y) * v - 1.2 - 2 * v * p.sc, vx: (Math.random() - 0.5) * 0.4, vy: 0.5, life: 0.6, max: 0.6, size: 2, color: P.white }); } } },
      drawUnder(c, f, X, Y, T) { for (const p of plan) { const u = f.t - p.t0; if (u < 0 || f.t > p.hit + 0.05) continue; const sw = cl((u - FORM) / SW), ph = phiAt(p, f.t), L = T * 2.45 * p.sc, gx = H.sx(p.cx) + Math.sin(ph) * L * 0.95; K.floorLight(c, gx, H.sy(p.cy), T * 0.9 * p.sc, (0.2 + 0.4 * sw) * (1 - Math.min(1, Math.abs(ph)) * 0.6), P.cyan); } },
      draw(c, f, X, Y, T) { const t = f.t, mx = H.sx(me.x), my = H.sy(me.y);
        for (const p of plan) { const u = t - p.t0; if (u < 0) continue; const broken = t > p.hit, k0 = broken ? cl(1 - (t - p.hit) / 0.4) : 1; if (k0 <= 0) continue;
          const g = H.ease.out(cl(u / FORM)), PX = H.sx(p.cx), PY = H.sy(p.cy) - T * 3.1 * p.sc, L = T * 2.45 * p.sc, ph = phiAt(p, t), tipX = PX + Math.sin(ph) * L * g, tipY = PY + Math.cos(ph) * L * g;
          // the curved frost thread it hangs from, out of the frost round the pet up to the knot
          const tx0 = mx - p.side * T * 0.9, ty0 = my - T * 1.1, qx = mx - p.side * T * 0.6, qy = PY - T * 0.6; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.globalAlpha = 0.3 * k0; c.strokeStyle = P.cyan; c.lineWidth = 5; c.beginPath(); c.moveTo(tx0, ty0); c.quadraticCurveTo(qx, qy, PX, PY); c.stroke(); c.globalAlpha = 0.85 * k0 * g; c.strokeStyle = P.frost; c.lineWidth = 1.5; c.stroke(); c.restore();
          K.glow(c, PX, PY, T * 0.6 * p.sc, P.cyan, 0.5 * k0); for (let i = 0; i < 3; i++) shd(c, PX, PY, T * 0.1 * p.sc, T * 0.32 * p.sc * g, -Math.PI / 2 + (i - 1) * 0.8, i, 0.9 * k0);
          if (broken) { K.glow(c, H.sx(p.cx), H.sy(p.cy) - T * 0.7 * p.sc, T * 1.6 * p.sc * (1 + (t - p.hit) * 2), P.white, 0.55 * k0); continue; }
          // the crescent of cold light behind the swinging tip
          if (t > p.t0 + FORM) { const pb = phiAt(p, t - 0.14); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const A0 = Math.PI / 2 - pb, A1 = Math.PI / 2 - ph, ccw = A1 < A0; for (const [rr, al, w, col] of [[0.62, 0.22, 3, P.cyan], [0.74, 0.3, 3, P.cyan], [0.86, 0.45, 2.5, P.pale], [0.97, 0.85, 2, P.frost]]) { c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = w * p.sc; c.beginPath(); c.arc(PX, PY, L * rr, A0, A1, ccw); c.stroke(); } c.restore(); }
          const fa = petFade(T, PX + Math.sin(ph) * L * 0.4, PY + Math.cos(ph) * L * 0.4, tipX, tipY, 0.35 * p.sc), lowGlow = 1 - Math.min(1, Math.abs(ph) / 0.6);
          K.glow(c, PX + (tipX - PX) * 0.6, PY + (tipY - PY) * 0.6, L * 0.45, P.cyan, (0.25 + 0.3 * lowGlow) * fa);
          blit(c, icicleSprite(), PX, PY, -ph, L / 236 * 1.3, L * g / 236, 32, 8, 0.95 * fa);
          K.glow(c, tipX, tipY, T * 0.35 * p.sc, P.white, (0.4 + 0.5 * lowGlow) * fa);
        } } });
  };

  /* ======================= I-S08 Polar Dominoes =======================
     Upright faceted ice plates rise one after another toward the aim on a line of frost; the nearest tips and the chain
     falls forward, each plate flashing a reflection of the one striking it before it breaks into glittering fragments.
     The last plate falls flat and bursts. Adept: a longer chain; Celestial: a second, larger chain rises as the first
     ends, its last plate a great slab. */
  S.dominoes = (C, h) => { bind(h); const e = K.evo(C), me = H.me, a = C.a, ca = Math.cos(a), sa = Math.sin(a), tot = C.base * 3.0 * stageK(C, e);
    const sgnX = Math.abs(sa) > 0.15 ? -Math.sign(sa) : 1;
    const mk = (N, sc, gap, t0, step, share, lastK) => { const x0 = me.x + ca * 1.1, y0 = me.y + sa * 1.1, plates = []; for (let i = 0; i < N; i++) { const x = x0 + ca * i * gap, y = y0 + sa * i * gap; if (H.X.blocked(x, y, 0.25, 0)) break; plates.push({ x, y, i, sc: sc * (i === N - 1 ? lastK : 1) }); } if (!plates.length) plates.push({ x: x0, y: y0, i: 0, sc }); const n = plates.length;
      const tTip = t0 + 0.32 + n * 0.035, W = 1 / (n + 1);
      plates.forEach((p, i) => { p.tr = t0 + i * 0.035; p.ts = tTip + i * step; p.last = i === n - 1; p.tb = p.ts + (p.last ? step * 1.5 : step); p.h = 1.3 * p.sc; p.w = 0.85 * p.sc; p.th = Math.asin(Math.min(0.95, gap / p.h)); p.dmg = tot * share * W * (p.last ? 2 : 1); });
      return { plates, gap, step, t0, end: plates[n - 1].tb }; };
    const chains = e >= 7 ? [mk(8, 1, 0.8, 0, 0.09, 0.4, 1.25)] : e >= 4 ? [mk(9 + (e - 4), 1.08, 0.8, 0, 0.1, 1, 1.35)] : [mk(6 + Math.min(1, e - 1), 1, 0.95, 0, 0.13, 1, 1.25)];
    if (e >= 7) chains.push(mk(10, 1.3, 0.86, chains[0].end - 0.12, 0.085, 0.6, 1.7));
    const all = []; chains.forEach(ch => ch.plates.forEach(p => all.push(p)));
    const END = Math.max(...all.map(p => p.tb)) + 0.75;
    chains.forEach((ch, ci) => { const pl = ch.plates, L = Math.hypot(pl[pl.length - 1].x - me.x, pl[pl.length - 1].y - me.y) + 1; H.X.after(ch.t0, () => { H.warnLine(me.x, me.y, a, L, 1.8, pl[pl.length - 1].tb - ch.t0, C.col); sfx('hum'); }); });
    for (const p of all) H.X.after(p.tb, () => {
      const hx = p.x + ca * (p.last ? p.h * 0.6 : 0.5), hy = p.y + sa * (p.last ? p.h * 0.6 : 0.5), R = p.last ? 1.5 * p.sc : 1.0 * p.sc;
      for (const m of H.near(hx, hy, R)) K.shatterAt(m.x, m.y, 0.5);
      H.hitArea(hx, hy, R, p.dmg, C.dmgO({ kb: p.last ? 4 : 2, chill: true, freeze: p.last ? 0.6 : 0 }));
      flyers(hx, hy, p.h * 0.45, p.last ? 14 * p.sc : 6, { a: p.last ? null : a, spread: 1.8, v: p.last ? 5 * p.sc : 4, up: 3, size: 0.35 * p.sc }); K.glitter(hx, hy - 0.5, p.last ? 16 : 7, p.last ? 6 : 4); K.snow(hx, hy - 0.5, p.last ? 10 : 4);
      H.X.light(hx, hy, R * 1.8, 0.3); H.X.shake(p.last ? 4 + 2 * p.sc : 2.2, 0.08); if (p.last) { H.X.ring(hx, hy, 0.2, R * 1.2, 0.4, P.frost, 0.5); H.X.hitstop(0.05); frostMark(hx, hy, R, 0.9, p.i, 8, true); sfx('crash'); } else if (p.i % 2 === 0) sfx('crack');
    });
    H.add({ life: END,
      update(dt, f) { for (const p of all) if (f.t > p.tr && f.t < p.tr + 0.3 && Math.random() < 0.5 * H.Q()) K.glitter(p.x, p.y, 1, 2); },
      drawUnder(c, f, X, Y, T) { const t = f.t;
        // the frost line the plates rise on, and frost where each broke (both fade)
        for (const ch of chains) { const pl = ch.plates, u = cl((t - ch.t0) / 0.3), out = cl((END - t) / 0.6); if (u <= 0) continue; const ax = H.sx(me.x + ca * 0.6), ay = H.sy(me.y + sa * 0.6), q = pl[Math.min(pl.length - 1, Math.floor(u * (pl.length - 1) + 0.5))], bx = H.sx(q.x), by = H.sy(q.y);
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.globalAlpha = 0.14 * out; c.strokeStyle = P.cyan; c.lineWidth = T * 0.3; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.globalAlpha = 0.4 * out; c.strokeStyle = P.frost; c.lineWidth = 1.2; c.stroke(); c.restore(); }
        for (const p of all) { const X1 = H.sx(p.x), Y1 = H.sy(p.y); if (t < p.tr) continue; if (t < p.tb) K.floorLight(c, X1, Y1, T * 0.8 * p.sc, 0.35 * cl((t - p.tr) / 0.2), P.ice); else { const k = cl(1 - (t - p.tb) / 0.8); K.frostVeins(c, X1 + ca * T * 0.5, Y1 + sa * T * 0.5, T * 0.75 * p.sc, sm((t - p.tb) / 0.15), 0.7 * k, p.i * 1.7, 5); } } },
      draw(c, f, X, Y, T) { const t = f.t, spr = plateSprite(false), sprB = plateSprite(true), sh = sheenSprite();
        const list = all.filter(p => t >= p.tr && t < p.tb).sort((p, q) => p.y - q.y);
        for (const p of list) { const up = H.ease.back(cl((t - p.tr) / 0.26)), tip = t > p.ts ? (p.last ? 1.35 : p.th) * H.ease.in(cl((t - p.ts) / (p.tb - p.ts))) : 0;
          const bx = H.sx(p.x), by = H.sy(p.y), hh = p.h * T * up, ww = p.w * T, pxv = Math.abs(sa) > 0.55 ? -sa * ww : sgnX * ww * 0.6, pyv = ca * H.GY * ww * 0.75, vx = ca * Math.sin(tip) * hh, vy = -Math.cos(tip) * hh + sa * Math.sin(tip) * hh * H.GY, ox = ca * T * 0.13 * p.sc, oy = sa * T * 0.13 * p.sc;
          K.glow(c, bx + vx * 0.5, by + vy * 0.5, Math.max(ww, hh) * 0.75, P.cyan, 0.22 * up);
          const farFirst = oy < 0; const backX = bx + ox, backY = by + oy;
          if (farFirst) { plateAt(c, sprB, backX, backY, pxv, pyv, vx, vy, 0.9 * up); plateAt(c, spr, bx, by, pxv, pyv, vx, vy, 0.95 * up); } else { plateAt(c, spr, bx, by, pxv, pyv, vx, vy, 0.95 * up); plateAt(c, sprB, backX, backY, pxv, pyv, vx, vy, 0.6 * up); }
          // the reflection: the plate about to be struck flashes as its neighbour falls onto it; a lavender glint creeps up every face
          const fl = t > p.ts - 0.12 && t < p.ts + 0.08 ? 1 - Math.abs(t - (p.ts - 0.02)) / 0.12 : 0;
          if (fl > 0) plateAt(c, sh, bx, by, pxv, pyv, vx, vy, fl, true);
          const gu = ((t * 0.9 + p.i * 0.29) % 1.4) / 1.4; if (gu < 1) K.glow(c, bx + vx * gu - pxv * 0.2, by + vy * gu - pyv * 0.2, ww * 0.35, P.lav, 0.45 * Math.sin(gu * Math.PI) * up);
          if (tip > 0) K.glow(c, bx + vx, by + vy, T * 0.35, P.white, 0.5);
        } } });
  };

  /* ======================= I-S09 Hoarfrost Halo =======================
     Curved ice blades crystallise in a ring round the pet, strung together by threads of snow; the ring turns once, the
     blades tumbling on their own axes, then it flies outward, clearing everything it passes, and leaves a faint circle
     of frost that fades. Adept: two rings, the outer larger and counter-turning; Celestial: three nested rings released
     one after another, each wider, with more and bigger blades. */
  S.hoarfrost = (C, h) => { bind(h); const e = K.evo(C), me = H.me, tot = C.base * 2.3 * stageK(C, e);
    const rings = e >= 7 ? [{ N: 9, R0: 1.1, R1: 3.2, z: 0.38, sc: 1, dir: 1, tOut: 0.85, sh: 0.25 }, { N: 12, R0: 1.45, R1: 4.1, z: 0.6, sc: 1.2, dir: -1, tOut: 1.2, sh: 0.33 }, { N: 16, R0: 1.8, R1: 5.1, z: 0.82, sc: 1.45, dir: 1, tOut: 1.55, sh: 0.42 }]
      : e >= 4 ? [{ N: 9, R0: 1.15, R1: 3.3, z: 0.4, sc: 1, dir: 1, tOut: 0.85, sh: 0.45 }, { N: 12 + (e - 4), R0: 1.55, R1: 4.1, z: 0.64, sc: 1.2, dir: -1, tOut: 1.18, sh: 0.55 }]
      : [{ N: 9 + (e - 1), R0: 1.25, R1: 3.6 + 0.1 * (e - 1), z: 0.45, sc: 1, dir: 1, tOut: 0.85, sh: 1 }];
    const FORM = 0.25, OUT = 0.45, last = rings[rings.length - 1], END = last.tOut + OUT + 1.0;
    rings.forEach((r, i) => { r.hits = new Set(); r.i = i; r.rad = () => 0;
      H.X.after(r.tOut, () => { me.sq = 0.75; sfx('whoosh'); H.X.ring(me.x, me.y, r.R0, r.R1, OUT, P.frost, 0.35 + 0.1 * i); H.X.shake(2.5 + i * 1.5, 0.1); if (i === rings.length - 1 && i) { H.X.flash(0.06, P.frost); H.X.hitstop(0.03); } K.glitter(me.x, me.y - r.z, 10 + r.N, 6); }); });
    sfx('hum');
    const radius = (r, t) => t < r.tOut ? r.R0 * (0.6 + 0.4 * H.ease.out(cl(t / FORM))) : r.R0 + (r.R1 - r.R0) * H.ease.out(cl((t - r.tOut) / OUT)), rot = (r, t) => r.dir * (H.ease.io(cl((t - FORM * 0.8) / (r.tOut - FORM * 0.8))) * TAU + Math.max(0, t - r.tOut) * 2.5);
    const alive = (r, t) => (t < r.tOut + OUT ? H.ease.out(cl(t / FORM)) : cl(1 - (t - r.tOut - OUT) / 0.28));
    H.add({ life: END,
      update(dt, f) { const t = f.t; for (const r of rings) { const rr = radius(r, t);
          if (t < r.tOut) { if (Math.random() < 0.6 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'ember', x: me.x + Math.cos(b) * rr, y: me.y + Math.sin(b) * rr * 0.6 - r.z, vx: -Math.sin(b) * r.dir * 1.8, vy: Math.cos(b) * r.dir * 0.8 + 0.2, life: 0.5, max: 0.5, size: 2, color: Math.random() < 0.6 ? P.white : P.pale }); } }
          else if (t < r.tOut + OUT + 0.05) { for (const m of H.living()) { if (r.hits.has(m)) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < rr + 0.55 * r.sc + m.r) { r.hits.add(m); H.X.hitMon(m, tot * r.sh, C.dmgO({ kb: 4 + r.i, chill: true })); K.shatterAt(m.x, m.y, 0.5); flyers(m.x, m.y, 0.5, 4, { v: 3, up: 3, size: 0.3 }); } } } } },
      drawUnder(c, f, X, Y, T) { const t = f.t; drawRings(c, X, Y, T, t, false);
        // the floor: a band of cold light under each ring, a frost circle where it stopped (both fade)
        for (const r of rings) { if (t < r.tOut) { K.floorLight(c, X, Y, radius(r, t) * T * 1.1, 0.12 * alive(r, t), P.cyan); continue; } const rr = radius(r, t) * T, k = t < r.tOut + OUT ? 1 : cl(1 - (t - r.tOut - OUT) / 0.9);
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.2 * k; c.strokeStyle = P.cyan; c.lineWidth = T * 0.14 * r.sc; H.floorEllipse(c, X, Y, rr); c.stroke(); c.globalAlpha = 0.6 * k; c.strokeStyle = P.frost; c.lineWidth = 1.3; H.floorEllipse(c, X, Y, rr * 0.97); c.stroke(); c.restore();
          if (t > r.tOut + OUT * 0.6) for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + r.i; K.frostVeins(c, X + Math.cos(b) * rr, Y + Math.sin(b) * rr * H.GY, T * 0.4 * r.sc, sm((t - r.tOut - OUT * 0.6) / 0.25), 0.5 * k, i + r.i * 9, 3); } } },
      draw(c, f, X, Y, T) { drawRings(c, X, Y, T, f.t, true); } });
    function drawRings(c, X, Y, T, t, front) { const spr = bladeSprite();
      for (const r of rings) { const al = alive(r, t); if (al <= 0.01) continue; const rr = radius(r, t) * T, ro = rot(r, t), cy = Y - r.z * T, ry = rr * H.GY, out = t > r.tOut ? cl((t - r.tOut) / OUT) : 0;
        // the snow threads: the half of the ring on this side, a soft cyan band with a bright moving dash
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.2 * al * (1 - out * 0.6); c.strokeStyle = P.cyan; c.lineWidth = 2.5 * r.sc; c.beginPath(); c.ellipse(X, cy, rr, ry, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.stroke();
        c.globalAlpha = 0.7 * al * (1 - out * 0.5); c.strokeStyle = P.frost; c.lineWidth = 1.2; c.setLineDash([T * 0.18, T * 0.14]); c.lineDashOffset = -t * 60 * r.dir; c.stroke(); c.setLineDash([]); c.restore();
        if (front) K.glow(c, X, cy, rr * 0.9, P.ice, 0.08 * al);
        for (let i = 0; i < r.N; i++) { const b = i / r.N * TAU + ro, sb = Math.sin(b); if ((sb >= 0) !== front) continue;
          const bx = X + Math.cos(b) * rr, by = cy + sb * ry, tum = Math.cos(t * (6 + out * 6) + i * 1.3), k = T * 1.3 * r.sc / 120, depth = 0.8 + 0.2 * sb;
          const fa = front ? petFade(T, bx, by - T * 0.9 * r.sc, bx, by + T * 0.3 * r.sc, 0.3) : 1;
          K.glow(c, bx, by - T * 0.3 * r.sc, T * 0.6 * r.sc, P.cyan, 0.3 * al * fa); K.floorLight(c, bx, by + r.z * T, T * 0.4 * r.sc, 0.3 * al);
          blit(c, spr, bx, by - T * 0.25 * r.sc, -sb * r.dir * 0.45 + Math.cos(b) * 0.5 * out + Math.sin(t * 3 + i) * 0.15, k * depth * (0.18 + 0.82 * Math.abs(tum)) * (tum < 0 ? -1 : 1), k * depth, 20, 60, 0.95 * al * fa);
          if (Math.abs(tum) > 0.92) K.glow(c, bx, by, T * 0.2 * r.sc, P.lav, 0.5 * al * fa); } } }
  };
})();
