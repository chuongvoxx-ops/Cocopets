/* ---------- Water, reworked: Mayhem, Tsunami ----------
   Mayhem: Catastrophe (20k8f) turned to water, with its shape, movement, timing and caching kept: the battlefield sinks
   into a deep sapphire dim and a whirlpool opens in the sky; columns of falling water (liquid shaded: dark sapphire
   edges, a translucent turquoise interior, bright aqua rims, highlights running down them, water ribbons wound round
   them) drop out of it and rove the field. Under each, a glistening aqua aura with circulating currents, a standing
   water ring with foam, rings that keep spreading outward and pearlescent bubbles that rise and rupture into droplets
   that land with tiny ripples; long water ribbons trail their sweeps and shed droplets. When the last column lands the
   main impact: a broad water sheet spreads over surging rings, big bubbles burst into spray. 3 columns for 4 s at
   Hatchling, 7 for 5 s at Adept, 10 for 7 s at Celestial (cooldown 21). Evolution: counter-rotating currents, a second
   trail ribbon, bubbles at different depths; at Celestial three nested current bands round each foot, three helical
   ribbons on each column and successive ripple rings across the ground at the main impact.
   Tsunami: 1 to 6 giant curling waves (Hatchling 1, Adept 4, Celestial 6) roll forward from in front of the pet through
   the target area, each a separate damaging pass (each monster once per wave, pushed along). Each wave is drawn as a
   shaded volume out of cached strips laid along its crest: a thick blue lower body, a translucent turquoise face with
   water streaming up it and bubbles tumbling inside, a darker band under the lip, the curling lip with broken white
   foam rolling over; spray streams off the leading edge and a thin sheet of water spreads behind it. At Celestial the
   crests glow aqua under the foam, spray trails hang between the waves and the sixth, tallest and broadest, rolls over
   into a sweeping fan of water sheets and droplets.
   This file also retires the Ultimates the water rework removed. */
(() => {
  const U = ELEM_IMPL.water.ult, TAU = Math.PI * 2;
  for (const k of ['deeppalace', 'koispiral', 'moontide', 'shellocean', 'whirlgalaxy']) delete U[k];
  let H, K;
  const W = { white: '#FFFFFF', foam: '#F2FBFF', pale: '#CFF6FF', aqua: '#6FF2FF', turq: '#3FD6E0', water: '#2E9BE6', sapph: '#1A4FB0', deep: '#0E2F7A', abyss: '#081E52' };
  const cl = u => Math.max(0, Math.min(1, u));
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  function petHole(c, T) { const me = H.me, x = H.sx(me.x), y = H.sy(me.y) - T * 0.46; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd'); }
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }
  const fl = (c, X, Y, r, a, col) => K.floorLight(c, X, Y, r, a, col);

  /* ---- shared cached water sprites ---- */
  /* a bubble: a clear centre, a pearlescent rim (aqua, rose and mint sheen), a specular highlight */
  const bubbleSpr = () => fxSprite('wu1bub', 48, 48, (g, w) => {
    const c0 = w / 2, r = c0 - 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, r);
    [[0, 'rgba(255,255,255,0)'], [0.55, 'rgba(111,242,255,0.06)'], [0.8, 'rgba(160,230,255,0.32)'], [0.9, 'rgba(207,246,255,0.8)'], [0.96, 'rgba(46,155,230,0.45)'], [1, 'rgba(46,155,230,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, w, w); g.lineCap = 'round';
    for (const [col, a0, a1] of [['rgba(255,190,240,0.55)', 0.3, 1.5], ['rgba(170,255,220,0.5)', 1.8, 3.0], ['rgba(111,242,255,0.6)', 3.3, 4.6], ['rgba(220,200,255,0.5)', 4.8, 5.9]]) { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(c0, c0, r * 0.88, a0, a1); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(c0 - r * 0.38, c0 - r * 0.42, r * 0.2, r * 0.11, -0.7, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(c0 + r * 0.42, c0 + r * 0.38, r * 0.07, 0, TAU); g.fill(); });
  /* a thin ripple ring (floor plane, squashed when drawn): an aqua line with a white crest and a soft inner tint */
  const rippleSpr = () => fxSprite('wu1rip', 64, 64, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(63,214,224,0)'], [0.62, 'rgba(63,214,224,0.08)'], [0.8, 'rgba(111,242,255,0.6)'], [0.88, 'rgba(255,255,255,0.95)'], [0.94, 'rgba(111,242,255,0.4)'], [1, 'rgba(111,242,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  /* an expanding water ring: translucent interior, a brilliant leading edge, patches of white foam (3 variants) */
  const ringSpr = v => fxSprite('wu1ring' + v, 256, 256, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(63,214,224,0)'], [0.5, 'rgba(63,214,224,0.04)'], [0.76, 'rgba(46,155,230,0.2)'], [0.86, 'rgba(63,214,224,0.42)'], [0.92, 'rgba(111,242,255,0.85)'], [0.955, 'rgba(255,255,255,1)'], [0.98, 'rgba(160,240,255,0.4)'], [1, 'rgba(160,240,255,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    const n = 4 + v; for (let i = 0; i < n; i++) { const b = R1(i * 3.1 + v * 7) * TAU, sp = 0.18 + 0.25 * R1(i + v); for (let k = 0; k < 9; k++) { const q = b + (k / 8 - 0.5) * sp, rr = c0 * (0.93 + 0.04 * R1(i * 9 + k)), s = 3 + 5 * R1(i * 5 + k * 2 + v) * Math.sin(k / 8 * Math.PI + 0.3); g.fillStyle = `rgba(255,255,255,${0.45 + 0.4 * R1(k + i * 2)})`; g.beginPath(); g.arc(c0 + Math.cos(q) * rr, c0 + Math.sin(q) * rr, s, 0, TAU); g.fill(); } } });

  /* ================= 1. Mayhem (Catastrophe in water) ================= */
  const colSpr = () => fxSprite('wu1col', 64, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    [[0, 'rgba(26,79,176,0)'], [0.2, 'rgba(26,79,176,0.25)'], [0.36, 'rgba(63,214,224,0.5)'], [0.5, 'rgba(160,248,255,0.8)'], [0.64, 'rgba(63,214,224,0.5)'], [0.8, 'rgba(26,79,176,0.25)'], [1, 'rgba(26,79,176,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.15, 'rgba(0,0,0,0.25)'); gv.addColorStop(0.4, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); });
  /* the body of a water column: dark sapphire edges, a translucent turquoise interior, lighter on the lit (left) side */
  const bodySpr = () => fxSprite('wu1body', 72, 384, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    [[0, 'rgba(8,30,82,0)'], [0.07, 'rgba(8,30,82,0.6)'], [0.16, 'rgba(26,79,176,0.66)'], [0.3, 'rgba(46,155,230,0.55)'], [0.42, 'rgba(120,230,240,0.5)'], [0.55, 'rgba(63,214,224,0.42)'], [0.7, 'rgba(46,155,230,0.52)'], [0.84, 'rgba(26,79,176,0.66)'], [0.93, 'rgba(8,30,82,0.6)'], [1, 'rgba(8,30,82,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.12, 'rgba(0,0,0,0.3)'); gv.addColorStop(0.35, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); });
  /* a water swirl seen from above: three spiral current arms, turquoise with foam-white cores and foam flecks */
  const swirlSpr = () => fxSprite('wu1swirl', 192, 192, (g, w) => {
    const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) { for (const [col, lw] of [['rgba(26,79,176,0.4)', 13], ['rgba(63,214,224,0.6)', 6.5], ['rgba(242,251,255,0.85)', 2.2]]) {
      g.strokeStyle = col; g.beginPath();
      for (let i = 0; i <= 40; i++) { const u = i / 40, r = c0 * 0.95 * u, b = arm * TAU / 3 + u * 4.2; g.lineWidth = lw * (0.3 + 0.7 * Math.sin(u * Math.PI)); if (i) g.lineTo(Math.cos(b) * r, Math.sin(b) * r); else g.moveTo(0, 0); }
      g.stroke(); }
      for (let i = 0; i < 6; i++) { const u = 0.3 + 0.6 * R1(arm * 7 + i), r = c0 * 0.95 * u, b = arm * TAU / 3 + u * 4.2 + 0.12; g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.arc(Math.cos(b) * r, Math.sin(b) * r, 1.5 + 2 * R1(i + arm), 0, TAU); g.fill(); } }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, c0); gr.addColorStop(0, 'rgba(207,246,255,0.6)'); gr.addColorStop(0.3, 'rgba(63,214,224,0.22)'); gr.addColorStop(1, 'rgba(63,214,224,0)'); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w); });
  /* a current band: six dashes of moving water round a circle, each with a bright head (Celestial's nested bands) */
  const bandSpr = () => fxSprite('wu1band', 192, 192, (g, w) => { const c0 = w / 2, r = c0 * 0.9; g.translate(c0, c0); g.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const b0 = i * TAU / 6; for (const [col, lw] of [['rgba(26,79,176,0.5)', 7], ['rgba(63,214,224,0.75)', 3.5], ['rgba(255,255,255,0.9)', 1.3]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(0, 0, r, b0, b0 + 0.7); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(Math.cos(b0 + 0.7) * r, Math.sin(b0 + 0.7) * r, 2.6, 0, TAU); g.fill(); } });
  /* a cached picture turned through its repeat in N frames, drawn unturned */
  const rotF = (name, spr, sym, N, i) => fxSprite('wu1rot|' + name + '|' + i, 160, 160, (g, w) => { g.translate(w / 2, w / 2); g.rotate(i / N * TAU / sym); g.drawImage(spr(), -w / 2, -w / 2, w, w); });
  const NSF = 24, rotAt = (name, spr, sym, ang) => rotF(name, spr, sym, NSF, ((Math.round(ang / (TAU / sym) * NSF) % NSF) + NSF) % NSF);
  const swirlAt = ang => rotAt('sw', swirlSpr, 3, ang), bandAt = ang => rotAt('bd', bandSpr, 6, ang);
  /* a water column at one step of its flow: the shaded body, wobbling aqua rims, highlights running down it, water
     ribbons wound round it (back halves deep, front halves turquoise with a foam thread and droplets on their edges);
     Celestial winds three helical ribbons and a wide sweeping one. 32 frames, drawn stretched to the column */
  const NBF = 32;
  function beamFrame(fi, kq, bq, lvl) { return fxSprite('wu1bf|' + fi + '|' + kq + '|' + bq + '|' + lvl, 72, 384, (g, Wd, Hh) => {
    const w = Wd / 1.1, cx = Wd / 2, BRb = bq / 100, ph = fi / NBF * TAU, k = w / (1.4 * BRb);
    g.globalAlpha = 0.8 + 0.2 * kq / 100; g.drawImage(bodySpr(), 0, 0, Wd, Hh); g.globalAlpha = 1;
    const fadeIn = y => cl(y / (Hh * 0.3));
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    // the bright aqua rims, wobbling
    for (const sd of [-1, 1]) { g.strokeStyle = 'rgba(111,242,255,0.55)'; g.lineWidth = 2; g.beginPath(); for (let j = 0; j <= 24; j++) { const y = j / 24 * Hh, x = cx + sd * (Wd * 0.4 + Math.sin(y * 0.05 + ph * 2 + sd) * 2); if (j) g.lineTo(x, y); else g.moveTo(x, y); } g.globalAlpha = 0.9; g.stroke(); }
    // highlights running down the lit side (they wrap round as the frames turn)
    for (let q = 0; q < 7; q++) { const yc = ((q / 7 + fi / NBF) % 1) * Hh * 1.15 - Hh * 0.08, x0 = cx - w * (0.18 + 0.12 * R1(q * 3.3)) + (q % 2) * w * 0.32, L = Hh * (0.07 + 0.06 * R1(q)); const a = fadeIn(yc); if (a <= 0) continue;
      g.globalAlpha = 0.55 * a; g.strokeStyle = 'rgba(207,246,255,0.8)'; g.lineWidth = q % 2 ? 2.2 : 4; g.beginPath(); g.moveTo(x0, yc - L / 2); g.quadraticCurveTo(x0 + 4 * Math.sin(q + ph), yc, x0, yc + L / 2); g.stroke();
      g.globalAlpha = 0.8 * a; g.strokeStyle = '#FFFFFF'; g.lineWidth = 1; g.stroke(); }
    g.globalCompositeOperation = 'source-over';
    const NR = lvl >= 3 ? 3 : 2;
    const ribbon = (sd, amp, turns, wk) => { const N = 48, back = [], front = []; for (let j = 0; j <= N; j++) { const u = j / N, q = u * turns + ph + sd * TAU / NR; (Math.cos(q) > 0 ? front : back).push([cx + Math.sin(q) * w * amp * (0.6 + 0.4 * u), u * Hh, j, Math.cos(q)]); }
      const run = (pts, col, lw, al) => { g.globalAlpha = al; g.beginPath(); let last = -9; for (const p of pts) { if (p[2] !== last + 1) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); last = p[2]; } g.strokeStyle = col; g.lineWidth = lw; g.stroke(); };
      run(back, rgbaS(W.sapph, 0.75), k * 0.08 * wk, 0.55); run(front, rgbaS(W.turq, 0.85), k * 0.11 * wk, 0.9);
      g.globalCompositeOperation = 'lighter'; run(front, rgbaS(W.foam, 0.95), k * 0.035 * wk, 0.85); g.globalCompositeOperation = 'source-over';
      // droplets shed from the ribbon's front edge
      for (let j = 0; j < front.length; j += 7) { const p = front[j]; if (p[1] < Hh * 0.25) continue; g.globalAlpha = 0.85; g.fillStyle = rgbaS(W.pale, 0.9); g.beginPath(); g.arc(p[0] + 4 * Math.sin(j + ph), p[1] + 5, 1.6, 0, TAU); g.fill(); } };
    for (let sd = 0; sd < NR; sd++) ribbon(sd, 0.5, 6, 1);
    if (lvl >= 3) ribbon(0.5, 0.62, 2.6, 0.7); }); }
  /* the floor under a column (floor plane, squashed when drawn): the glistening aqua aura, the splash of light where the
     water meets the floor, glints, and the standing water ring with its foam (all light: drawn additive) */
  function footSpr(kq, bq) { return fxSprite('wu1ft|' + kq + '|' + bq, 256, 256, (g, Wd) => {
    const R0 = Wd / 2 / 2.1, c0 = Wd / 2, kN = kq / 100, BRb = bq / 100; g.globalCompositeOperation = 'lighter'; g.translate(c0, c0);
    const gl = (col, r, a, x, y) => { g.globalAlpha = a; g.drawImage(glowSprite(col), (x || 0) - r, (y || 0) - r, r * 2, r * 2); };
    gl(W.water, R0 * 2.5, 0.42 * kN); gl(W.turq, R0 * 1.45, 0.3 * kN);
    gl(W.aqua, R0 * 1.5 / Math.sqrt(H.GY), 0.26 * kN); gl(W.white, R0 * 0.6 / Math.sqrt(H.GY), 0.38);
    for (let i = 0; i < 7; i++) { const b = i / 7 * TAU, r = R0 * 1.25; gl(W.aqua, r * 0.45, 0.16 * kN, Math.cos(b) * r * 0.8, Math.sin(b) * r * 0.8); }
    const rw = Math.max(2 / 40, 0.07 / BRb) * R0;
    g.globalAlpha = 0.55; g.strokeStyle = rgbaS(W.water, 0.6); g.lineWidth = rw * 1.6; g.beginPath(); g.arc(0, 0, R0 * 0.95, 0, TAU); g.stroke();
    g.globalAlpha = 0.75; g.strokeStyle = rgbaS(W.turq, 0.8); g.lineWidth = rw * 0.8; g.stroke();
    g.globalAlpha = 0.9; g.strokeStyle = rgbaS(W.aqua, 0.9); g.lineWidth = Math.max(1, rw * 0.3); g.beginPath(); g.arc(0, 0, R0 * 0.95 + rw * 0.45, 0, TAU); g.stroke();
    for (let i = 0; i < 5; i++) { const b = R1(i * 4.7) * TAU; for (let k = 0; k < 6; k++) { const q = b + k * 0.06, rr = R0 * (0.95 + 0.05 * (R1(i + k) - 0.5)); g.globalAlpha = 0.8; g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(Math.cos(q) * rr, Math.sin(q) * rr, rw * (0.25 + 0.3 * R1(k * 3 + i)), 0, TAU); g.fill(); } } }); }

  U.mayhem = (C, h) => {
    H = h; K = IK.bind(H);
    /* Catastrophe's choreography: 4 s at Hatchling, 5 at Adept, 7 at Celestial; 3 / 7 / 10 columns */
    const me = H.me, x = C.tx, y = C.ty, ev = K.evo(C), lvl = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, NB = K.evoN(C, 3, 10), D = ev <= 4 ? 4 + (ev - 1) / 3 : 5 + (ev - 4) * 2 / 3, D0 = 5 + 5 * (ev - 1) / 6, RX = (3.6 + 0.3 * (ev - 1)) * C.K, BR = 0.95 + 0.06 * (ev - 1), TICK = 0.4;
    H.X.banner('MAYHEM', '', C.col, 1.6); H.X.sfx.hum();
    /* screen-wide: pearlescent bubbles rising at two depths, and suspended spray glints drifting down */
    const NFL = H.n(70 + 5 * ev), FL = []; for (let i = 0; i < NFL; i++) { const bub = R1(i * 5.3) < 0.45, sz = bub ? 3 + 8 * R1(i * 1.7) * R1(i * 2.9 + 1) : 2 + 3 * R1(i * 1.3); FL.push({ bub, sz, sp: bub ? 18 + 30 * R1(i * 4.1) + sz * 3 : 10 + 18 * R1(i * 4.1), w: 0.6 + R1(i) * 0.6, x: R1(i * 7.3), y: R1(i * 3.1), ph: R1(i * 9.7) * TAU }); }
    const beams = [], NBU = K.lv(C, [4, 6, 8]);
    for (let i = 0; i < NB; i++) { const s = 0.35 + i * Math.min(0.42, D * 0.3 / NB), e = D - 0.15 - (NB - 1 - i) * Math.min(0.15, 1.2 / NB), b0 = i / NB * TAU + 0.4 + Math.random() * 0.3, r0 = RX * (0.35 + 0.45 * R1(i * 3.7 + 1));
      beams.push({ i, s, e, x: x + Math.cos(b0) * r0, y: y + Math.sin(b0) * r0, vx: 0, vy: 0, tgt: null, re: 0, nt: s + 0.3, tr: [], trT: s, rb: [], rbT: s, cy: [], ph: R1(i * 5.1) * TAU, spin: i % 2 ? 1 : -1, sd: i * 13 + 5 }); }
    const IMP = beams[NB - 1].s + 0.32;
    const dmgT = 1.1 * C.base * C.K * K.evoK(C) * 0.85 / Math.pow(NB / 3 * D0 / 5, 0.7) * D0 / D, kN = Math.min(1, Math.sqrt(3 / NB) * 1.15), kq = Math.round(kN * 100), bq = Math.round(BR * 100);
    /* a bubble of a column's foot: where it is at time tt (world, with its height) and how far through its rise */
    const bubAt = (b, j, tt) => { const per = 1.0 + 0.5 * R1(j * 3.1 + b.i), raw = (tt - b.s) / per + R1(j * 1.7 + b.i), u = raw - Math.floor(raw), q = j * 2.399 + b.ph + Math.floor(raw) * 1.3, rr = BR * (0.45 + 0.45 * R1(j * 5 + b.i)), dep = lvl >= 2 ? R1(j * 3 + b.i * 7) : 0.6;
      return { u, cyc: Math.floor(raw), wx: b.x + Math.cos(q) * rr + Math.sin(u * 9 + j) * 0.12, wy: b.y + Math.sin(q) * rr * 0.7, z: u * 2.4 * (0.8 + 0.4 * R1(j + b.i)), dep }; };
    const warm = [() => footSpr(kq, bq), () => bubbleSpr(), () => rippleSpr(), () => ringSpr(0), () => ringSpr(1), () => ringSpr(2)];
    for (let i = 0; i < NSF; i++) { warm.push(() => rotF('sw', swirlSpr, 3, NSF, i)); if (lvl >= 3) warm.push(() => rotF('bd', bandSpr, 6, NSF, i)); }
    for (let i = 0; i < NBF; i++) warm.push(() => beamFrame(i, kq, bq, lvl));
    H.add({ life: D + 1.2, x, y, wi: 0, pops: [], rip: [], big: [], imp: false,
      update(dt, f) {
        for (let q = 0; q < 3 && f.wi < warm.length; q++) warm[f.wi++]();
        const live = H.living();
        for (const b of beams) { if (f.t < b.s || f.t > b.e + 0.5) continue; const on = f.t < b.e;
          if (on && (!b.tgt || b.tgt.dead || f.t > b.re)) { b.re = f.t + 1.1 + R1(b.sd + f.t) * 0.6; const taken = new Set(beams.filter(q => q !== b && q.tgt).map(q => q.tgt)); const cand = live.filter(m => Math.hypot(m.x - x, m.y - y) < RX * 1.25 + m.r); const free = cand.filter(m => !taken.has(m)); const pool = free.length ? free : R1(b.sd + Math.floor(f.t)) < 0.35 ? cand : []; b.tgt = pool.length ? pool.sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y))[0] : null; }
          const V = 1.7 + 0.08 * ev; let dx = 0, dy = 0;
          if (b.tgt && on) { const tx = b.tgt.x - b.x, ty = b.tgt.y - b.y, d = Math.hypot(tx, ty) || 1, k = Math.min(1, d / 1.2); dx = tx / d * V * k - ty / d * V * 0.55 * b.spin; dy = ty / d * V * k + tx / d * V * 0.55 * b.spin; }
          else { const ox = b.x - x, oy = b.y - y, d = Math.hypot(ox, oy) || 1; dx = -oy / d * V * b.spin + Math.cos(f.t * 0.9 + b.ph) * V * 0.4; dy = ox / d * V * b.spin + Math.sin(f.t * 1.1 + b.ph) * V * 0.4; }
          const cx = b.x - x, cy = b.y - y, dc = Math.hypot(cx, cy); if (dc > RX) { dx -= cx / dc * (dc - RX) * 3; dy -= cy / dc * (dc - RX) * 3; }
          const px = b.x - me.x, py = b.y - me.y, dp = Math.hypot(px, py) || 0.01; if (dp < 1.7) { dx += px / dp * (1.7 - dp) * 5; dy += py / dp * (1.7 - dp) * 5; }
          for (const o of beams) { if (o === b || f.t < o.s || f.t > o.e) continue; const ex = b.x - o.x, ey = b.y - o.y, d2 = Math.hypot(ex, ey) || 0.01; if (d2 < 2.4) { dx += ex / d2 * (2.4 - d2) * 2.2; dy += ey / d2 * (2.4 - d2) * 2.2; } }
          const kk = Math.min(1, dt * 2.4); b.vx += (dx - b.vx) * kk; b.vy += (dy - b.vy) * kk; b.x += b.vx * dt; b.y += b.vy * dt;
          if (on && f.t - b.trT > 0.22) { b.trT = f.t; b.n = (b.n || 0) + 1; b.tr.push({ x: b.x, y: b.y, t: f.t, n: b.n }); if (b.tr.length > 14) b.tr.shift(); }
          // the ribbon trailing the column's sweep (samples every 0.05 s; it drains away once the column is gone)
          if (f.t - b.rbT > 0.05) { b.rbT = f.t; if (on) { b.rb.push({ x: b.x, y: b.y }); if (b.rb.length > 16) b.rb.shift(); } else b.rb.shift(); }
          const spd = Math.hypot(b.vx, b.vy);
          if (on && b.rb.length > 4 && Math.random() < Math.min(1, spd * 0.35) * H.Q() * kN) { const p = b.rb[Math.floor(Math.random() * b.rb.length * 0.7)]; H.P({ kind: 'bubble', x: p.x, y: p.y - 0.6, vx: (Math.random() - 0.5) * 1.5, vy: -1 - Math.random(), g: 9, life: 0.5, max: 0.5, size: 1.6 + Math.random() * 1.4, color: Math.random() < 0.5 ? W.pale : W.aqua }); }
          if (on && f.t >= b.nt) { b.nt += TICK; const k = H.hitArea(b.x, b.y, BR, dmgT, C.dmgO({ chill: true })); if (k && Math.random() < 0.6 * kN) H.burst(b.x, b.y - 0.3, 'spark', 4, { v: 4, up: 3, g: 9, life: 0.5, size: 2, color: [W.white, W.pale, W.aqua] }); }
          if (on && Math.random() < 0.6 * H.Q() * kN) { const q = Math.random() * TAU, rr = BR * (0.4 + Math.random() * 0.6); H.P({ kind: Math.random() < 0.6 ? 'ember' : 'spark', x: b.x + Math.cos(q) * rr, y: b.y + Math.sin(q) * rr * 0.6, vx: -Math.sin(q) * 1.6 * b.spin, vy: -1.2 - Math.random() * 1.5, g: 0.1, drag: 0.6, life: 0.6 + Math.random() * 0.5, max: 1.1, size: 1.8 + Math.random() * 2, color: Math.random() < 0.5 ? W.white : Math.random() < 0.5 ? W.pale : W.aqua }); }
          // the foot's bubbles: each rupture throws droplets, a tiny ripple in the air, and later ripples where they land
          if (on && f.t - b.s > 0.35) for (let j = 0; j < NBU; j++) { const bb = bubAt(b, j, f.t); if (b.cy[j] != null && bb.cyc > b.cy[j]) { const pz = 2.4 * (0.8 + 0.4 * R1(j + b.i)); if (Math.random() < H.Q()) H.burst(bb.wx, bb.wy - pz, 'bubble', 3, { v: 2.4, up: 1.2, g: 9, life: 0.55, size: 1.5, color: [W.pale, W.aqua, W.white] }); if (f.pops.length < 40) f.pops.push({ x: bb.wx, y: bb.wy, z: pz, t: f.t, s: 0.5 + 0.5 * bb.dep }); if (f.rip.length < 60) f.rip.push({ x: bb.wx + (Math.random() - 0.5) * 0.8, y: bb.wy + (Math.random() - 0.5) * 0.4, t: f.t + 0.45 + Math.random() * 0.2, s: 0.6 }); } b.cy[j] = bb.cyc; } }
        // the main impact: the last column lands; big bubbles rise from the sheet and burst into droplets and spray
        if (!f.imp && f.t >= IMP) { f.imp = true; H.X.shake(6, 0.3); H.X.light(x, y, RX * 1.2, 0.4); H.X.sfx.crash(); H.X.ring(x, y, 0.3, RX * 1.3, 0.6, W.aqua, 0.3);
          const nb = H.n(K.lv(C, [6, 9, 14])); for (let i = 0; i < nb; i++) { const q = Math.random() * TAU, r = Math.sqrt(Math.random()) * RX * 0.8, bx = x + Math.cos(q) * r, by = y + Math.sin(q) * r; if (Math.hypot(bx - me.x, by - me.y) < 1.4) continue; f.big.push({ x: bx, y: by, z: 0.2, vz: 1.2 + Math.random() * 1.4, r: 0.32 + 0.3 * Math.random(), t0: f.t, life: 0.7 + Math.random() * 0.6 }); }
          for (let i = 0; i < H.n(30); i++) { const q = Math.random() * TAU, r = Math.random() * RX; H.P({ kind: 'spark', x: x + Math.cos(q) * r, y: y + Math.sin(q) * r * 0.8 - 0.5 - Math.random() * 2, vx: (Math.random() - 0.5) * 1.2, vy: -0.5 - Math.random() * 0.6, g: 0.25, drag: 1.2, life: 1.3 + Math.random() * 0.8, max: 2, size: 1.6 + Math.random() * 1.6, color: Math.random() < 0.5 ? W.aqua : W.pale }); } }
        for (let i = f.big.length - 1; i >= 0; i--) { const B = f.big[i]; B.z += B.vz * dt; if (f.t - B.t0 > B.life) { H.burst(B.x, B.y - B.z, 'bubble', 6, { v: 3.5, up: 1.5, g: 9, life: 0.6, size: 2, color: [W.pale, W.aqua, W.white] }); H.burst(B.x, B.y - B.z, 'spark', 4, { v: 3, up: 1, g: 5, life: 0.5, size: 1.6, color: [W.white, W.aqua] }); if (f.pops.length < 40) f.pops.push({ x: B.x, y: B.y, z: B.z, t: f.t, s: B.r * 2.6 }); for (let k = 0; k < 3; k++) if (f.rip.length < 60) f.rip.push({ x: B.x + (Math.random() - 0.5) * 1.6, y: B.y + (Math.random() - 0.5) * 0.8, t: f.t + 0.5 + Math.random() * 0.3, s: 0.8 }); f.big.splice(i, 1); } }
        f.pops = f.pops.filter(p => f.t - p.t < 0.3); f.rip = f.rip.filter(p => f.t - p.t < 0.9);
      },
      drawUnder(c, f, X, Y, T) {
        const fa = cl(Math.min(f.t / 0.6, (D + 1.2 - f.t) / 0.9)), S = scr(c), tt = f.t, m = T * 3;
        // the light sinks under water: a deep sapphire dim over the battlefield
        c.save(); c.globalAlpha = 0.32 * fa; c.fillStyle = 'rgb(4,22,60)'; c.fillRect(S.x0, S.y0, S.w, S.h); c.restore();
        // a glistening sheen over the whole area with slow caustic currents
        const Rv = T * RX * 1.05; fl(c, X, Y, Rv, 0.18 * fa, W.sapph); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 * fa; c.drawImage(swirlAt(tt * 0.35), X - Rv, Y - Rv * H.GY, Rv * 2, Rv * 2 * H.GY); c.restore();
        const FA = footSpr(kq, bq), rp = rippleSpr();
        c.save(); c.globalCompositeOperation = 'lighter';
        // ripples where droplets land
        for (const p of f.rip) { const age = tt - p.t; if (age < 0) continue; const k = age / 0.9, r = T * p.s * (0.12 + 0.55 * k); c.globalAlpha = 0.75 * (1 - k); c.drawImage(rp, H.sx(p.x) - r, H.sy(p.y) - r * H.GY, r * 2, r * 2 * H.GY); }
        c.restore();
        for (const b of beams) { if (tt < b.s) continue; const BX = H.sx(b.x), BY = H.sy(b.y), on = tt < b.e, a = cl((tt - b.s) / 0.35) * (on ? 1 : Math.max(0, 1 - (tt - b.e) / 0.45));
          // the water sheen and little ripples left along its path, fading
          c.save(); c.globalCompositeOperation = 'lighter';
          for (const p of b.tr) { const age = tt - p.t, k = Math.max(0, 1 - age / 1.3); if (k <= 0) continue; const qx = H.sx(p.x), qy = H.sy(p.y); if (qx < S.x0 - m || qx > S.x0 + S.w + m || qy < S.y0 - m || qy > S.y0 + S.h + m) continue;
            if (!(p.n & 3)) fl(c, qx, qy, T * BR * 1.9 * (0.6 + 0.4 * k), 0.34 * k * kN, W.turq);
            if (p.n & 1) { const ra = cl(age / 1.1), r = T * (0.2 + 0.7 * ra) * BR, ox = (R1(p.n + b.i * 3) - 0.5) * T * 0.8, oy = (R1(p.n * 2 + b.i) - 0.5) * T * 0.4; c.globalAlpha = 0.6 * (1 - ra); c.drawImage(rp, qx + ox - r, qy + oy - r * H.GY, r * 2, r * 2 * H.GY); } }
          c.restore();
          if (a <= 0.01 || BX < S.x0 - m || BX > S.x0 + S.w + m || BY < S.y0 - m || BY > S.y0 + S.h + m) continue;
          const br = 1 + 0.067 * Math.sin(tt * 3 + b.ph), sc = T * BR * 2.1 * br / 128, rot = tt * 2.6 * b.spin + b.ph, R0 = T * BR * br, rs = R0 * 1.5;
          c.save(); c.globalCompositeOperation = 'lighter';
          // circulating currents (Adept and up: a counter-rotating inner current)
          c.globalAlpha = 0.65 * kN * a; c.drawImage(swirlAt(rot), BX - rs, BY - rs * H.GY, rs * 2, rs * 2 * H.GY);
          if (lvl >= 2) { const r2 = rs * 0.62; c.globalAlpha = 0.5 * kN * a; c.drawImage(swirlAt(-rot * 1.4 + 1), BX - r2, BY - r2 * H.GY, r2 * 2, r2 * 2 * H.GY); }
          // Celestial: three nested current bands, turning in alternate directions
          if (lvl >= 3) for (let q = 0; q < 3; q++) { const rb = R0 * (1.2 + 0.38 * q), d = q % 2 ? -1 : 1; c.globalAlpha = (0.6 - 0.1 * q) * a * (0.6 + 0.4 * kN); c.drawImage(bandAt(tt * (1.6 - 0.3 * q) * d * b.spin + q), BX - rb, BY - rb * H.GY, rb * 2, rb * 2 * H.GY); }
          const gq = Math.max(2, T * 0.06) * 2.5; c.globalAlpha = 0.42 * a; for (let i = 0; i < 3; i++) { const q = tt * 2 * b.spin + i * 2.1; c.drawImage(glowSprite(W.white), BX + Math.cos(q) * R0 * 0.95 - gq, BY + Math.sin(q) * R0 * 0.95 * H.GY - gq, gq * 2, gq * 2); }
          c.restore();
          c.save(); c.translate(BX, BY); c.scale(sc, sc * H.GY); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(FA, -128, -128); c.restore();
          // the water rings spreading outward from the foot
          if (tt - b.s > 0.3) { c.save(); for (let q = 0; q < 3; q++) { const u = ((tt - b.s) * 0.75 + q / 3) % 1, r = R0 * (0.7 + 1.7 * u); c.globalAlpha = 0.7 * a * Math.pow(1 - u, 1.3) * cl(u * 6); c.drawImage(ringSpr((b.i + q) % 3), BX - r, BY - r * H.GY, r * 2, r * 2 * H.GY); } c.restore(); } }
        // the main impact: rings surge out under a broad spreading water sheet; at Celestial successive ripple rings
        const ik = (tt - IMP) / 1.1; if (ik > 0 && ik < 1) { const RR = T * RX * 1.35, r = RR * H.ease.out(ik);
          c.save(); c.globalAlpha = 0.55 * (1 - ik); fl(c, X, Y, r * 1.05, 0.5 * (1 - ik), W.turq); c.globalAlpha = 0.85 * Math.pow(1 - ik, 1.2); c.drawImage(ringSpr(0), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY);
          const r2 = r * 0.72; c.globalAlpha = 0.6 * (1 - ik); c.drawImage(ringSpr(1), X - r2, Y - r2 * H.GY, r2 * 2, r2 * 2 * H.GY); c.restore(); }
        if (lvl >= 3) for (let q = 0; q < 4; q++) { const k = (tt - IMP - 0.22 * (q + 1)) / 1.2; if (k <= 0 || k >= 1) continue; const r = T * RX * (0.4 + 1.1 * H.ease.out(k)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8 * (1 - k); c.drawImage(rp, X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
      },
      draw(c, f, X, Y, T) {
        const fa = cl(Math.min(f.t / 0.6, (D + 1.2 - f.t) / 0.9)), S = scr(c), tt = f.t, topY = S.y0 - T * 0.5, m = T * 3;
        const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46, bub = bubbleSpr(), gwA = glowSprite(W.aqua);
        // the whirlpool in the sky the columns fall from
        const VX = X, VY = S.y0 + T * 0.6;
        K.glow(c, VX, VY, T * 7, W.sapph, 0.45 * fa); K.glow(c, VX, VY, T * 3, W.turq, 0.18 * fa);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * fa; const vr = T * 6.5; c.drawImage(swirlAt(-tt * 0.9), VX - vr, VY - vr * 0.38, vr * 2, vr * 2 * 0.38); c.globalAlpha = 0.35 * fa; c.drawImage(swirlAt(tt * 0.7), VX - vr * 0.6, VY - vr * 0.6 * 0.38, vr * 1.2, vr * 1.2 * 0.38); c.restore();
        for (const b of beams) { if (tt < b.s) continue; const on = tt < b.e, out = on ? 0 : cl((tt - b.e) / 0.45);
          const BX = H.sx(b.x), BY = H.sy(b.y), grow = H.ease.in(cl((tt - b.s) / 0.32)), a = (0.35 + 0.65 * cl((tt - b.s - 0.2) / 0.3)) * (1 - out);
          if (out < 1) { const qa = b.ph + tt * 0.45 * b.spin, TY = topY; let TX = BX * 0.55 + VX * 0.45 + Math.cos(qa) * T * 1.6;
            let over = false; { const u = (PY - TY) / (BY - TY); if (u > 0 && u < 1.05) { const need = T * BR * 0.75 + T * 0.75; if (u < 0.97) { const xu = TX + (BX - TX) * u, d = PX - xu; if (Math.abs(d) < need) { const xt = PX - (d >= 0 ? 1 : -1) * need; TX = Math.max(TX - T * 9, Math.min(TX + T * 9, (xt - BX * u) / (1 - u))); } } const u2 = Math.min(1, u); over = Math.abs(PX - (TX + (BX - TX) * u2)) < need; } }
            const w = T * BR * 1.4 * (on ? 1 : 1 - 0.7 * out) * (0.25 + 0.75 * cl((tt - b.s - 0.15) / 0.3)) * (1 + 0.06 * Math.sin(tt * 9 + b.ph));
            const offL = Math.max(TX, BX) + w < S.x0, offR = Math.min(TX, BX) - w > S.x0 + S.w;
            if (!offL && !offR) { const L = Math.hypot(BX - TX, BY - TY), ang = Math.atan2(BY - TY, BX - TX) - Math.PI / 2, Lg = L * grow, top0 = out * L;
              c.save(); if (over) petHole(c, T); c.translate(TX, TY); c.rotate(ang);
              // the water column: one of 32 cached flow frames (mirrored for the other turning sense), and its glow
              const ph = ((tt * 7 / TAU) % 1) * NBF;
              if (Lg - top0 > 1) { c.save(); c.scale(b.spin, 1); c.globalAlpha = a; c.drawImage(beamFrame(Math.floor(ph) % NBF, kq, bq, lvl), -w * 0.55, top0, w * 1.1, Lg - top0); c.restore();
                c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.32 * a * (0.5 + 0.5 * kN); c.drawImage(colSpr(), -w * 0.3, top0, w * 0.6, Lg - top0); }
              c.restore();
              // small bubbles rising inside it
              if (Lg > T) { const mr = T * 0.14, ca = Math.cos(ang), sa = Math.sin(ang); c.save(); c.globalAlpha = 0.85 * a; for (let j = 0; j < 6; j++) { const u = 1 - (tt * 0.45 + j / 6 + b.i * 0.13) % 1, yy = top0 + (Lg - top0) * u, q = u * 12 + j * 1.3 - tt * 3 * b.spin, xx = Math.sin(q) * w * 0.35, rr = mr * (0.7 + 0.6 * R1(j + b.i)); if (yy > Lg) continue; c.drawImage(bub, TX + xx * ca - yy * sa - rr, TY + xx * sa + yy * ca - rr, rr * 2, rr * 2); } c.restore(); } } }
          if (BX < S.x0 - m || BX > S.x0 + S.w + m || BY < S.y0 - m || BY > S.y0 + S.h + m * 2) continue;
          const nearP = Math.abs(BX - PX) < T * 5 && Math.abs(BY - PY) < T * 4; if (nearP) { c.save(); petHole(c, T); }
          // the long water ribbons trailing the sweep (Adept: a second; Celestial: a third, helical)
          if (b.rb.length > 3) { const n = b.rb.length, NRb = lvl; for (let r = 0; r < NRb; r++) { const pts = []; for (let i = n - 1; i >= 0; i--) { const p = b.rb[i], u = (n - 1 - i) / 15, hx = r === 2 ? Math.sin(u * 6 - tt * 6) * T * 0.25 * u : 0; pts.push([H.sx(p.x) + hx, H.sy(p.y) - T * (0.35 + 0.35 * r + (0.35 + 0.2 * r) * u + 0.12 * Math.sin(u * 7 - tt * 6 + b.ph + r * 2.4))]); } wribbon(c, pts, T * BR * (0.3 - 0.07 * r), a * (0.85 - 0.15 * r)); } }
          // the foot's bubbles rising (different depths from Adept) and popping
          if (a > 0.05 && tt - b.s > 0.35) { c.save(); for (let j = 0; j < NBU; j++) { const bb = bubAt(b, j, tt), dep = bb.dep, rr = T * (0.1 + 0.16 * dep) * (bb.u > 0.88 ? 1 + (bb.u - 0.88) * 3 : 1), al = a * (0.45 + 0.5 * dep) * cl(bb.u * 8) * (bb.u > 0.9 ? cl((1 - bb.u) * 10) : 1); if (al < 0.02) continue; c.globalAlpha = al; c.drawImage(bub, H.sx(bb.wx) - rr, H.sy(bb.wy) - bb.z * T - rr, rr * 2, rr * 2); } c.restore(); }
          if (nearP) c.restore();
        }
        // the main impact's big bubbles, and the little ripples where bubbles burst
        if (f.big.length || f.pops.length) { c.save(); for (const B of f.big) { const r = B.r * T * (1 + 0.1 * Math.sin((tt - B.t0) * 14)); c.globalAlpha = cl((tt - B.t0) * 6) * 0.95; c.drawImage(bub, H.sx(B.x) - r, H.sy(B.y) - B.z * T - r, r * 2, r * 2); }
          const rp = rippleSpr(); c.globalCompositeOperation = 'lighter'; for (const p of f.pops) { const k = (tt - p.t) / 0.3, r = T * p.s * (0.25 + 0.6 * k); c.globalAlpha = 0.8 * (1 - k); c.drawImage(rp, H.sx(p.x) - r, H.sy(p.y) - p.z * T - r * 0.5, r * 2, r); } c.restore(); }
        // over the whole screen: pearlescent bubbles rising, spray glints drifting in the blue light
        if (fa > 0.01) { c.save(); for (let i = 0; i < NFL; i++) { const F = FL[i], fx2 = S.x0 + ((F.x * S.w + 16 * Math.sin(tt * F.w + F.ph)) % S.w + S.w) % S.w;
            if (F.bub) { const fy2 = S.y0 + S.h - ((F.y * S.h + tt * F.sp) % S.h); c.globalAlpha = 0.75 * fa; c.drawImage(bub, fx2 - F.sz, fy2 - F.sz, F.sz * 2, F.sz * 2); }
            else { const fy2 = S.y0 + ((F.y * S.h + tt * F.sp) % S.h); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fa * (0.35 + 0.35 * Math.sin(tt * 3 + F.ph)); c.drawImage(gwA, fx2 - F.sz * 2, fy2 - F.sz * 2, F.sz * 4, F.sz * 4); c.globalCompositeOperation = 'source-over'; } } c.restore(); }
      } });
    H.X.after(0.35, () => H.X.sfx.whoosh());
    for (let i = 0; i < NB; i++) H.X.after(beams[i].s + 0.32, () => { const b = beams[i]; H.X.light(b.x, b.y, 2.4, 0.35); H.X.shake(3, 0.12); H.X.sfx.crash(); H.burst(b.x, b.y - 0.2, 'bubble', 8, { v: 4, up: 4, g: 10, life: 0.6, size: 2.6, color: [W.pale, W.aqua, W.white] }); H.burst(b.x, b.y - 0.2, 'spark', 8, { v: 5, up: 3, g: 9, life: 0.5, size: 2, color: [W.white, W.foam, W.aqua] }); H.X.ring(b.x, b.y, 0.2, BR * 1.6, 0.4, W.aqua, 0.14); });
  };
  /* a water ribbon along screen points (head first): a translucent sapphire band, a turquoise current down its middle and
     a foam thread, tapering to its tail */
  function wribbon(c, pts, w, a) { const n = pts.length; if (n < 3 || !(a > 0.02)) return; const Lf = [], Rt = [];
    for (let i = 0; i < n; i++) { const q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)]; let dx = q[0] - o[0], dy = q[1] - o[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; const k = w * Math.pow(1 - i / (n - 1), 0.7) * (0.55 + 0.45 * Math.min(1, i / 2)); Lf.push([pts[i][0] - dy * k, pts[i][1] + dx * k]); Rt.push([pts[i][0] + dy * k, pts[i][1] - dx * k]); }
    c.save(); c.globalAlpha = a; c.beginPath(); Lf.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let i = n - 1; i >= 0; i--) c.lineTo(Rt[i][0], Rt[i][1]); c.closePath(); c.fillStyle = rgbaS(W.sapph, 0.42); c.fill(); c.strokeStyle = rgbaS(W.aqua, 0.5); c.lineWidth = 1.2; c.stroke();
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = rgbaS(W.turq, 0.5); c.lineWidth = Math.max(1, w * 0.6); c.stroke(); c.strokeStyle = rgbaS(W.foam, 0.8); c.lineWidth = Math.max(0.8, w * 0.16); c.stroke(); c.restore(); }

  /* ================= 4. Tsunami ================= */
  /* the face of a wave (a texture that repeats along the crest; rows top to bottom): the darker band under the lip, the
     translucent turquoise face with water streaming upward and bubbles tumbling inside, the thick blue lower body, a
     churn of foam at the floor. 8 flow frames */
  const FW = 256, FH = 160, LH = 96, NTF = 8;
  const faceFr = fi => fxSprite('wu1face|' + fi, FW, FH, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    [[0, 'rgba(8,30,82,0.78)'], [0.1, 'rgba(14,47,122,0.72)'], [0.18, 'rgba(46,155,230,0.5)'], [0.32, 'rgba(63,214,224,0.42)'], [0.5, 'rgba(46,155,230,0.55)'], [0.68, 'rgba(26,79,176,0.75)'], [0.88, 'rgba(14,47,122,0.86)'], [1, 'rgba(14,47,122,0.8)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; const ph = fi / NTF;
    // water streaming upward through the surface (wrapped so the texture tiles along the crest)
    for (let q = 0; q < 16; q++) { const x0 = R1(q * 3.7) * w, yy = (1 - ((R1(q * 1.9) + ph) % 1)) * h * 0.8 + h * 0.12, L = h * (0.1 + 0.1 * R1(q * 5.3)), a = Math.sin(cl((yy - h * 0.12) / (h * 0.8)) * Math.PI);
      for (const dx of [-w, 0, w]) { g.globalAlpha = 0.5 * a; g.strokeStyle = 'rgba(160,240,255,0.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + dx, yy + L / 2); g.quadraticCurveTo(x0 + dx + 5 * Math.sin(q), yy, x0 + dx + 2, yy - L / 2); g.stroke(); g.globalAlpha = 0.7 * a; g.strokeStyle = '#FFFFFF'; g.lineWidth = 1; g.stroke(); } }
    // a soft aqua reflection band across the face
    const gb = g.createLinearGradient(0, h * 0.18, 0, h * 0.42); gb.addColorStop(0, 'rgba(111,242,255,0)'); gb.addColorStop(0.5, 'rgba(111,242,255,0.18)'); gb.addColorStop(1, 'rgba(111,242,255,0)'); g.globalAlpha = 1; g.fillStyle = gb; g.fillRect(0, h * 0.18, w, h * 0.24);
    // bubbles tumbling through the body
    g.globalCompositeOperation = 'source-over';
    for (let q = 0; q < 10; q++) { const b = (R1(q * 2.3) + ph) * TAU, cx0 = R1(q * 7.1) * w, cy0 = h * (0.4 + 0.35 * R1(q * 4.4)), x0 = cx0 + Math.cos(b) * 10, y0 = cy0 + Math.sin(b) * 14, r = 2 + 4 * R1(q * 9.1);
      for (const dx of [-w, 0, w]) { g.globalAlpha = 0.85; g.strokeStyle = 'rgba(207,246,255,0.7)'; g.lineWidth = 1.2; g.beginPath(); g.arc(x0 + dx, y0, r, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x0 + dx - r * 0.35, y0 - r * 0.35, r * 0.25, 0, TAU); g.fill(); } }
    // foam churning at the floor
    for (let q = 0; q < 40; q++) { const x0 = (R1(q * 1.3) * w + ph * 30) % w, y0 = h * (0.94 + 0.05 * R1(q * 2.1)), r = 2 + 4 * R1(q * 3.9); g.globalAlpha = 0.5 + 0.4 * R1(q); g.fillStyle = '#F2FBFF'; g.beginPath(); g.arc(x0, y0, r, 0, TAU); g.fill(); } });
  /* the curling lip (rows: the crest rising, the crest top, the lip tip rolling over), 3 foam variants x 8 roll frames:
     translucent turquoise rising into a bright aqua crest, broken white foam rolling over its edge */
  const lipFr = (v, fi) => fxSprite('wu1lip|' + v + '|' + fi, FW, LH, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    [[0, 'rgba(63,214,224,0.5)'], [0.3, 'rgba(111,242,255,0.6)'], [0.45, 'rgba(160,248,255,0.75)'], [0.62, 'rgba(63,214,224,0.62)'], [0.8, 'rgba(46,155,230,0.55)'], [1, 'rgba(26,79,176,0.4)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, w, h); const ph = fi / NTF;
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(207,246,255,0.7)'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 32; i++) { const x = i / 32 * w, y = h * 0.42 + Math.sin(i / 32 * TAU * 3 + ph * TAU) * 3; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    g.globalCompositeOperation = 'source-over';
    // broken foam: clusters with gaps, rolling over the lip (down the rows) as the frames turn
    for (let q = 0; q < 26 + v * 6; q++) { const cx0 = R1(q * 3.3 + v * 11) * w, gap = R1(q * 7.7 + v) < 0.25; if (gap) continue;
      for (let k = 0; k < 6; k++) { const u = (R1(q * 5.1 + k * 1.7 + v) + ph) % 1, x0 = cx0 + (R1(q + k * 3 + v) - 0.5) * 22, y0 = h * (0.45 + 0.52 * u), r = (2 + 5 * R1(q * 2 + k + v)) * (1 - 0.4 * u);
        for (const dx of [-w, 0, w]) { g.globalAlpha = (0.55 + 0.4 * R1(k + q)) * (1 - 0.5 * u); g.fillStyle = k % 3 ? '#FFFFFF' : '#DFF4FF'; g.beginPath(); g.arc(x0 + dx, y0, r, 0, TAU); g.fill(); } } }
    g.globalAlpha = 0.9; g.fillStyle = '#FFFFFF'; for (let q = 0; q < 20; q++) { const x0 = R1(q * 9.3 + v) * w, y0 = h * (0.9 + 0.08 * R1(q)); g.beginPath(); g.arc(x0, y0, 1.2 + 1.6 * R1(q * 4 + v), 0, TAU); g.fill(); } });
  /* the long back slope of a wave (rows: the crest down to the floor behind it): bright turquoise at the crest, deep
     sapphire lower down, thinning out into the sheet behind; a few sheen lines along it */
  const backSpr = () => fxSprite('wu1back', FW, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h);
    [[0, 'rgba(111,242,255,0.6)'], [0.12, 'rgba(63,214,224,0.55)'], [0.4, 'rgba(46,155,230,0.62)'], [0.75, 'rgba(26,79,176,0.55)'], [1, 'rgba(26,79,176,0.08)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(160,240,255,0.35)'; g.lineWidth = 1.2; for (let q = 0; q < 5; q++) { const y0 = h * (0.12 + 0.16 * q); g.beginPath(); for (let i = 0; i <= 32; i++) { const x = i / 32 * w, y = y0 + Math.sin(i / 32 * TAU * (2 + q % 2) + q) * 2.5; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); } });
  /* a sprite as a repeating fill laid along two screen vectors (one pattern kept per sprite; only its placement changes) */
  function patOf(c, spr, ax, ay, bx, by, ex, ey) { const p = spr._pat || (spr._pat = c.createPattern(spr, 'repeat')); p.setTransform(new DOMMatrix([ax, ay, bx, by, ex, ey])); return p; }
  /* the sheet of water spreading behind a wave (floor plane): a turquoise sheen fading back, light streaks */
  const sheetSpr = () => fxSprite('wu1sheet', 64, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(111,242,255,0.75)'); gr.addColorStop(0.15, 'rgba(63,214,224,0.5)'); gr.addColorStop(0.6, 'rgba(46,155,230,0.2)'); gr.addColorStop(1, 'rgba(46,155,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(207,246,255,0.5)'; g.lineWidth = 1.2; for (let q = 0; q < 5; q++) { const x0 = R1(q * 3.1) * w; g.beginPath(); g.moveTo(x0, 4); g.lineTo(x0 + 3, h * (0.4 + 0.4 * R1(q))); g.stroke(); } });

  U.tsunami = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, ev = K.evo(C), lvl = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, a = C.a, ca = Math.cos(a), sa = Math.sin(a), pa = -sa, pb = ca;
    const NW = K.evoN(C, 1, 6), dT = Math.hypot(C.tx - me.x, C.ty - me.y), S0 = 1.3, L = Math.max(6, Math.min(9.5, dT + 3.5)) * Math.sqrt(C.K);
    const HW0 = (2.8 + 0.17 * (ev - 1)) * C.K, WH0 = (1.95 + 0.08 * (ev - 1)) * Math.sqrt(C.K), GAP = NW > 1 ? Math.min(0.85, 3.8 / (NW - 1)) : 0, TR = 1.9, START = 0.65;
    const ox = me.x + ca * S0, oy = me.y + sa * S0, NS = 22;
    const TOT = C.base * 16 * C.K * K.evoK(C), wts = []; for (let i = 0; i < NW; i++) wts.push(NW >= 6 && i === NW - 1 ? 2 : 1 + 0.12 * i); const SW = wts.reduce((p, q) => p + q, 0);
    const waves = []; for (let i = 0; i < NW; i++) { const cx = NW >= 6 && i === NW - 1;
      waves.push({ i, t0: START + i * GAP + (cx ? 0.3 : 0), v: i % 3, sd: R1(i * 7.7 + 3) * 100, hw: HW0 * (cx ? 1.25 : 1) * (0.95 + 0.1 * R1(i * 3.3)), wh: WH0 * (cx ? 1.5 : 1) * (0.92 + 0.16 * R1(i * 5.1)), bend: 0.22 + 0.22 * R1(i * 2.2), roll: 1.4 + 0.5 * R1(i * 6.1), dmg: TOT * wts[i] / SW, hit: new Set(), climax: cx, end: false, spr: 0 }); }
    const END = waves[NW - 1].t0 + TR + (waves[NW - 1].climax ? 1.1 : 0.7);
    H.X.banner('TSUNAMI', '', C.col, 1.6); H.X.sfx.hum();
    /* where a wave is at time tt: its crest distance from the start line, how risen it is (0..1) */
    const st = (w, tt) => { const u = (tt - w.t0) / TR; return { u, s: L * (0.03 + 0.97 * Math.min(1.08, u)), hk: sm(u / 0.16) * (1 - sm((u - 0.84) / 0.24)) }; };
    const crestAt = (w, s, v, hk) => { const along = s - w.bend * v * v * w.hw * 0.5, perp = v * w.hw * (0.85 + 0.15 * hk); return [ox + ca * along + pa * perp, oy + sa * along + pb * perp]; };
    const htAt = (w, v, hk, tt) => w.wh * hk * (0.85 + 0.15 * Math.cos(v * Math.PI / 2)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(v), 6))) * (1 + 0.04 * Math.sin(v * 2.2 + tt * 2.5 + w.sd));
    const warm = [() => sheetSpr(), () => rippleSpr(), () => backSpr()]; for (let i = 0; i < NTF; i++) { warm.push(() => faceFr(i)); for (let v = 0; v < Math.min(3, NW); v++) warm.push(() => lipFr(v, i)); }
    H.add({ life: END, x: ox, y: oy, wi: 0,
      update(dt, f) {
        for (let q = 0; q < 3 && f.wi < warm.length; q++) warm[f.wi++]();
        for (const w of waves) { const S = st(w, f.t); if (S.u < 0 || S.u > 1.1) continue;
          if (!w.spr) { w.spr = 1; H.X.sfx.whoosh(); }
          // the pass: every monster the crest reaches, once per wave, pushed on and slowed
          if (S.hk > 0.35 && S.u <= 1) for (const m of H.living()) { if (w.hit.has(m)) continue; const rx = m.x - ox, ry = m.y - oy, al = rx * ca + ry * sa, of = rx * pa + ry * pb, v = of / w.hw; if (Math.abs(v) > 1 + m.r / w.hw) continue; const sc = S.s - w.bend * Math.min(1, v * v) * w.hw * 0.5;
            if (al > sc - 0.9 - m.r && al < sc + 0.35 + m.r) { w.hit.add(m); H.X.hitMon(m, w.dmg, C.dmgO({ chill: true })); H.push(m, m.x - ca, m.y - sa, 0.7 + 0.15 * lvl); H.slow(m, 1.2); if (Math.random() < H.Q()) H.burst(m.x, m.y - 0.4, 'spark', 5, { v: 4, up: 3, g: 9, life: 0.5, size: 2, color: [W.white, W.foam, W.aqua] }); } }
          // spray streaming off the leading edge; at Celestial, spray trails that hang in the air
          const k = (18 + 6 * lvl) * dt * H.Q() * S.hk; let nq = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0);
          while (nq-- > 0) { const v = (Math.random() * 2 - 1) * 0.85, p = crestAt(w, S.s, v, S.hk), hh = htAt(w, v, S.hk, f.t);
            H.P({ kind: 'spark', x: p[0] + ca * 0.35, y: p[1] + sa * 0.35 - hh * 0.95, vx: ca * (2 + Math.random() * 2.5) + (Math.random() - 0.5), vy: sa * 2 - 2 - Math.random() * 2, g: 8, drag: 0.4, life: 0.5 + Math.random() * 0.3, max: 0.8, size: 1.6 + Math.random() * 1.6, color: Math.random() < 0.6 ? W.white : W.pale });
            if (lvl >= 3 && Math.random() < 0.5) H.P({ kind: 'spark', x: p[0] - ca * 0.2, y: p[1] - sa * 0.2 - hh * (0.8 + 0.3 * Math.random()), vx: ca * 0.6, vy: -0.3, g: 0.4, drag: 1.6, life: 1.2 + Math.random() * 0.6, max: 1.8, size: 1.4 + Math.random(), color: Math.random() < 0.5 ? W.aqua : W.pale }); }
          // the crash at the end of its run: foam and droplets; the sixth rolls over into a fan of sheets and droplets
          if (!w.end && S.u >= 0.86) { w.end = true; const p = crestAt(w, S.s, 0, 1); H.X.shake(w.climax ? 8 : 4, w.climax ? 0.4 : 0.18); H.X.sfx.crash(); H.X.light(p[0], p[1], w.hw * (w.climax ? 1.4 : 0.9), w.climax ? 0.5 : 0.3);
            for (let q = -2; q <= 2; q++) { const pq = crestAt(w, S.s, q / 2.6, 1); H.burst(pq[0], pq[1] - 0.8, 'bubble', w.climax ? 10 : 5, { v: w.climax ? 6 : 4, up: w.climax ? 6 : 4, g: 10, life: 0.7, size: 2.6, color: [W.pale, W.aqua, W.white] }); H.burst(pq[0], pq[1] - 0.6, 'spark', w.climax ? 10 : 6, { v: 5, up: 4, g: 9, life: 0.5, size: 2, color: [W.white, W.foam] }); }
            if (w.climax) { H.X.ring(p[0], p[1], 0.4, w.hw * 1.3, 0.6, W.aqua, 0.3); } } }
      },
      drawUnder(c, f, X, Y, T) {
        const tt = f.t, rp = rippleSpr(), sh = sheetSpr(), GY = H.GY, Dx = ca * T, Dy = sa * T * GY, Px = pa * T, Py = pb * T * GY;
        c.save(); c.globalCompositeOperation = 'lighter';
        // the widening ground ripple each wave gathers from (an ellipse stretched along the start line)
        for (const w of waves) { for (let q = 0; q < 3; q++) { const k = (tt - (w.t0 - 0.6) - q * 0.12) / 0.8; if (k <= 0 || k >= 1) continue; const rx = (0.4 + w.hw * 1.05 * H.ease.out(k)), ry = 0.35 + 0.9 * k, cx0 = H.sx(ox + ca * L * 0.03), cy0 = H.sy(oy + sa * L * 0.03);
            c.save(); c.globalAlpha = (w.i ? 0.35 : 0.8) * (1 - k); c.transform(Px * rx, Py * rx, Dx * ry, Dy * ry, cx0, cy0); c.drawImage(rp, -1, -1, 2, 2); c.restore(); } }
        // the thin sheet of water spreading behind each wave
        for (const w of waves) { const S = st(w, tt); if (S.u < 0.05 || S.u > 1.35) continue; const fade = S.u > 1 ? 1 - (S.u - 1) / 0.35 : 1, back = Math.min(1.8, 0.4 + S.u * 2.2) * (w.climax ? 1.3 : 1), hk = Math.max(S.hk, 0.5), Bs = [];
          for (let j = 0; j <= NS; j++) { const p = crestAt(w, S.s, -1 + 2 * j / NS, hk); Bs.push([H.sx(p[0]), H.sy(p[1])]); }
          const bx = -Dx * back, by = -Dy * back, ch = [Bs[NS][0] - Bs[0][0], Bs[NS][1] - Bs[0][1]];
          c.globalAlpha = 0.4 * fade; c.fillStyle = patOf(c, sh, ch[0] / 64, ch[1] / 64, bx / 64, by / 64, Bs[0][0], Bs[0][1]); c.beginPath(); Bs.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); for (let j = NS; j >= 0; j--) c.lineTo(Bs[j][0] + bx * (0.4 + 0.6 * Math.cos((-1 + 2 * j / NS) * Math.PI / 2)), Bs[j][1] + by * (0.4 + 0.6 * Math.cos((-1 + 2 * j / NS) * Math.PI / 2))); c.closePath(); c.fill(); }
        c.restore();
      },
      draw(c, f, X, Y, T) {
        const tt = f.t, GY = H.GY, PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46, fi = Math.floor(tt * 16) % NTF;
        const list = waves.map(w => ({ w, S: st(w, tt) })).filter(o => o.S.u >= 0 && o.S.u <= 1.1 && o.S.hk > 0.01);
        // back to front by where the wave stands on the screen
        list.sort((p, q) => H.sy(crestAt(p.w, p.S.s, 0, 1)[1]) - H.sy(crestAt(q.w, q.S.s, 0, 1)[1]));
        for (const { w, S } of list) {
          const Bx = [], By = [], Hp = [];
          let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
          for (let j = 0; j <= NS; j++) { const v = -1 + 2 * j / NS, p = crestAt(w, S.s, v, S.hk), X0 = H.sx(p[0]), Y0 = H.sy(p[1]), hp = htAt(w, v, S.hk, tt) * T; Bx.push(X0); By.push(Y0); Hp.push(hp); x0 = Math.min(x0, X0); x1 = Math.max(x1, X0); y0 = Math.min(y0, Y0 - hp * 1.3); y1 = Math.max(y1, Y0 + hp * 0.5); }
          const near = PX > x0 - T && PX < x1 + T && PY > y0 - T && PY < y1 + T; c.save(); if (near) petHole(c, T);
          const bsp = backSpr(), face = faceFr((fi + w.i * 3) % NTF), lip = lipFr(w.v % 3, (fi + w.i) % NTF), fa = cl(S.hk * 3);
          const roll = 0.5 + 0.5 * Math.sin(tt * TAU / 0.7 * 0.5 * w.roll + w.sd), lipK = (0.55 + 0.45 * cl(S.u * 2.2)) * (w.climax ? 1.15 : 1);
          /* the shape, point by point along the crest: the face's top (leaning forward), the back slope's far edge on the floor,
             the lip's three bends (rising, rolling forward, curling down) */
          const Yv = hp => [ca * 0.2 * hp, sa * GY * 0.2 * hp - hp], Zv = hp => [-ca * 1.5 * hp, -sa * GY * 1.5 * hp];
          const Sg = hp => [[ca * 0.1 * hp, sa * GY * 0.1 * hp - 0.17 * hp], [ca * 0.3 * hp * lipK, sa * GY * 0.3 * hp * lipK - 0.03 * hp], [ca * 0.15 * hp * lipK, sa * GY * 0.15 * hp * lipK + 0.22 * hp * lipK * (0.75 + 0.35 * roll)]];
          const Tp = [], Kp = [], Lp = [[], [], []];
          for (let j = 0; j <= NS; j++) { const y = Yv(Hp[j]), z = Zv(Hp[j]), sg = Sg(Hp[j]); let qx = Bx[j] + y[0], qy = By[j] + y[1]; Tp.push([qx, qy]); Kp.push([Bx[j] + z[0], By[j] + z[1]]); for (let s2 = 0; s2 < 3; s2++) { qx += sg[s2][0]; qy += sg[s2][1]; Lp[s2].push([qx, qy]); } }
          const jc = NS >> 1, hc = Hp[jc], ch = [Bx[NS] - Bx[0], By[NS] - By[0]], cw = 2 * w.hw * (0.85 + 0.15 * S.hk), ux = ch[0] / cw / 64, uy = ch[1] / cw / 64, off = (w.sd * 37) % FW, yc = Yv(hc), zc = Zv(hc), sc = Sg(hc);
          const poly = (A, Bq) => { c.beginPath(); A.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); for (let j = Bq.length - 1; j >= 0; j--) c.lineTo(Bq[j][0], Bq[j][1]); c.closePath(); };
          const Bp = Bx.map((q, j) => [q, By[j]]);
          c.globalAlpha = fa;
          const drawFace = () => { c.fillStyle = patOf(c, face, ux, uy, -yc[0] / FH, -yc[1] / FH, Tp[jc][0] - ux * off, Tp[jc][1] - uy * off); poly(Bp, Tp); c.fill(); };
          const drawBack = () => { c.globalAlpha = fa * 0.9; c.fillStyle = patOf(c, bsp, ux, uy, (zc[0] - yc[0]) / 64, (zc[1] - yc[1]) / 64, Tp[jc][0] - ux * off, Tp[jc][1] - uy * off); poly(Tp, Kp); c.fill(); c.globalAlpha = fa; };
          if (sa < 0) { drawFace(); drawBack(); } else { drawBack(); drawFace(); }
          // the lip, band by band, its rows following the curl
          let ox2 = Tp[jc][0], oy2 = Tp[jc][1];
          for (let s2 = 0; s2 < 3; s2++) { const vx = sc[s2][0] / (LH / 3), vy = sc[s2][1] / (LH / 3); c.fillStyle = patOf(c, lip, ux, uy, vx, vy, ox2 - ux * off - vx * s2 * LH / 3, oy2 - uy * off - vy * s2 * LH / 3); poly(s2 ? Lp[s2 - 1] : Tp, Lp[s2]); c.fill(); ox2 += sc[s2][0]; oy2 += sc[s2][1]; }
          // Celestial: the crest glows aqua beneath the foam
          if (lvl >= 3) for (let j = 1; j < NS; j += 2) K.glow(c, Lp[0][j][0] * 0.4 + Lp[1][j][0] * 0.6, Lp[0][j][1] * 0.4 + Lp[1][j][1] * 0.6, Hp[j] * 0.35, W.aqua, 0.35 * fa);
          c.restore();
          // the sixth rolls over into a sweeping fan of water sheets
          if (w.climax && S.u > 0.84) { const k = cl((S.u - 0.84) / 0.26), p = crestAt(w, S.s, 0, 1), bx = H.sx(p[0]), by = H.sy(p[1]), hm = w.wh * T, fdx = ca * T, fdy = sa * T * GY;
            c.save(); c.lineCap = 'round'; for (let q = 0; q < 9; q++) { const sp = (q / 8 - 0.5) * 1.6, ex = bx + (pa * T * Math.sin(sp) * w.hw * 0.9) + fdx * (1.2 + 1.6 * k) * Math.cos(sp), ey = by + (pb * T * GY * Math.sin(sp) * w.hw * 0.9) + fdy * (1.2 + 1.6 * k) * Math.cos(sp) - hm * (0.4 + 0.5 * k), mx = (bx + ex) / 2, my = by - hm * (1.1 + 0.4 * k), al = (1 - k) * 0.9;
              c.globalAlpha = al; c.strokeStyle = rgbaS(W.turq, 0.4); c.lineWidth = T * 0.35 * (1 - 0.5 * k); c.beginPath(); c.moveTo(bx, by - hm * 0.8); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
              c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(W.aqua, 0.55); c.lineWidth = T * 0.1; c.stroke(); c.strokeStyle = rgbaS(W.white, 0.85); c.lineWidth = 1.6; c.stroke(); c.globalCompositeOperation = 'source-over'; } c.restore(); }
        }
      } });
  };
})();
