/* ---------- Water, reworked: Mayhem, Deep Blue Sea, Heavenfall ----------
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
   Deep Blue Sea: ringed spheres of luminous water (~2x the pet, 1 / 3 / 5 at Hatchling / Adept / Celestial) like tiny
   ocean planets: a sapphire centre under a translucent aqua surface, currents turning inside, bubbles spiralling,
   turquoise highlights gliding over it, a tilted ring of flowing water (cached halves: the far one behind the sphere, the
   near one in front) that banks as it turns. They rise from streams round the pet, wobble, grow their rings, charge,
   launch one after another and sweep through the monsters in banked passes (each monster at most once per pass); on
   contact the front compresses, a ripple runs over it and the ring flares. Adept: droplet rings, weaving paths.
   Celestial: two counter-rotating droplet rings, inner counter-currents, and a finale: a wide arc round the target,
   rings aligned, centres blazing, five staggered finishing passes each ending in one burst. ~16 x base in total.
   Round 2: Mayhem's columns 25% thinner, feathered at their feet, with more flow streaks and spray.
   Heavenfall: luminous rings of water open overhead (2 / 3 / 5 at Hatchling / Adept / Celestial); a dark opening grows in
   each glowing disc as light runs round its rim, then a thick waterfall (cached flow frames) plunges into a foaming basin
   that sends out rings; at the end the source narrows, the last water falls through, the ring dissolves into droplets and
   the basin spreads into a glistening puddle (light only). Celestial: five rings in an elevated arc opening in sequence,
   overlapping cascades, the basins joined into one luminous water pattern, mist between the columns. ~14 x base in total.
   This file also retires the Ultimates the water rework removed. */
(() => {
  const U = ELEM_IMPL.water.ult, TAU = Math.PI * 2;
  for (const k of ['deeppalace', 'koispiral', 'moontide', 'shellocean', 'whirlgalaxy']) delete U[k];
  for (const k of ['leviathanribbon', 'returningsea', 'rainmaker', 'monsoon']) delete U[k];
  delete U.tsunami;
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
    g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.15, 'rgba(0,0,0,0.25)'); gv.addColorStop(0.4, 'rgba(0,0,0,1)'); gv.addColorStop(0.74, 'rgba(0,0,0,1)'); gv.addColorStop(0.9, 'rgba(0,0,0,0.45)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); });
  /* the body of a water column: dark sapphire edges, a translucent turquoise interior, lighter on the lit (left) side */
  const bodySpr = () => fxSprite('wu1body', 72, 384, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    [[0, 'rgba(26,79,176,0)'], [0.1, 'rgba(14,47,122,0.28)'], [0.2, 'rgba(26,79,176,0.55)'], [0.32, 'rgba(46,155,230,0.55)'], [0.43, 'rgba(120,230,240,0.5)'], [0.55, 'rgba(63,214,224,0.42)'], [0.68, 'rgba(46,155,230,0.52)'], [0.8, 'rgba(26,79,176,0.55)'], [0.9, 'rgba(14,47,122,0.28)'], [1, 'rgba(26,79,176,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
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
  /* the feather of a column: in over its top, and a long soft fade at its foot so it melts into the foot swirl */
  const maskSpr = () => fxSprite('wu1mask', 8, 384, (g, w, h) => { const gv = g.createLinearGradient(0, 0, 0, h); [[0, 0], [0.1, 0.5], [0.22, 1], [0.7, 1], [0.86, 0.5], [0.95, 0.12], [1, 0]].forEach(s => gv.addColorStop(s[0], `rgba(0,0,0,${s[1]})`)); g.fillStyle = gv; g.fillRect(0, 0, w, h); });
  function beamFrame(fi, kq, bq, lvl) { return fxSprite('wu1bf|' + fi + '|' + kq + '|' + bq + '|' + lvl, 72, 384, (g, Wd, Hh) => {
    const w = Wd / 1.1, cx = Wd / 2, BRb = bq / 100, ph = fi / NBF * TAU, k = w / (1.4 * BRb);
    g.globalAlpha = 0.8 + 0.2 * kq / 100; g.drawImage(bodySpr(), 0, 0, Wd, Hh); g.globalAlpha = 1;
    const fadeIn = y => cl(y / (Hh * 0.3));
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    // the bright aqua rims, wobbling
    for (const sd of [-1, 1]) { g.strokeStyle = 'rgba(111,242,255,0.55)'; g.lineWidth = 2; g.beginPath(); for (let j = 0; j <= 24; j++) { const y = j / 24 * Hh, x = cx + sd * (Wd * 0.4 + Math.sin(y * 0.05 + ph * 2 + sd) * 2); if (j) g.lineTo(x, y); else g.moveTo(x, y); } g.globalAlpha = 0.9; g.stroke(); }
    // highlights running down the lit side (they wrap round as the frames turn)
    for (let q = 0; q < 14; q++) { const yc = ((q / 14 + R1(q * 7.7) * 0.05 + fi / NBF) % 1) * Hh * 1.15 - Hh * 0.08, x0 = cx - w * (0.18 + 0.12 * R1(q * 3.3)) + (q % 2) * w * 0.32, L = Hh * (0.07 + 0.06 * R1(q)); const a = fadeIn(yc); if (a <= 0) continue;
      g.globalAlpha = 0.55 * a; g.strokeStyle = 'rgba(207,246,255,0.8)'; g.lineWidth = q % 2 ? 2.2 : 4; g.beginPath(); g.moveTo(x0, yc - L / 2); g.quadraticCurveTo(x0 + 4 * Math.sin(q + ph), yc, x0, yc + L / 2); g.stroke();
      g.globalAlpha = 0.8 * a; g.strokeStyle = '#FFFFFF'; g.lineWidth = 1; g.stroke(); }
    // flow streaks spiralling down round the column (they move a whole turn as the frames turn)
    for (let q = 0; q < 10; q++) { const u0 = ((q / 10 + fi / NBF) % 1), yc = u0 * Hh * 1.1 - Hh * 0.05, qq = q * 2.1 + u0 * 9, x0 = cx + Math.sin(qq) * w * 0.38, a = fadeIn(yc) * (0.4 + 0.6 * Math.max(0, Math.cos(qq))); if (a <= 0.05) continue;
      g.globalAlpha = 0.6 * a; g.strokeStyle = 'rgba(160,240,255,0.85)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0 - Math.cos(qq) * 6, yc - 14); g.quadraticCurveTo(x0, yc, x0 + Math.cos(qq) * 6, yc + 16); g.stroke(); }
    g.globalCompositeOperation = 'source-over';
    const NR = lvl >= 3 ? 3 : 2;
    const ribbon = (sd, amp, turns, wk) => { const N = 48, back = [], front = []; for (let j = 0; j <= N; j++) { const u = j / N, q = u * turns + ph + sd * TAU / NR; (Math.cos(q) > 0 ? front : back).push([cx + Math.sin(q) * w * amp * (0.6 + 0.4 * u), u * Hh, j, Math.cos(q)]); }
      const run = (pts, col, lw, al) => { g.globalAlpha = al; g.beginPath(); let last = -9; for (const p of pts) { if (p[2] !== last + 1) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); last = p[2]; } g.strokeStyle = col; g.lineWidth = lw; g.stroke(); };
      run(back, rgbaS(W.sapph, 0.75), k * 0.08 * wk, 0.55); run(front, rgbaS(W.turq, 0.85), k * 0.11 * wk, 0.9);
      g.globalCompositeOperation = 'lighter'; run(front, rgbaS(W.foam, 0.95), k * 0.035 * wk, 0.85); g.globalCompositeOperation = 'source-over';
      // droplets shed from the ribbon's front edge
      for (let j = 0; j < front.length; j += 7) { const p = front[j]; if (p[1] < Hh * 0.25) continue; g.globalAlpha = 0.85; g.fillStyle = rgbaS(W.pale, 0.9); g.beginPath(); g.arc(p[0] + 4 * Math.sin(j + ph), p[1] + 5, 1.6, 0, TAU); g.fill(); } };
    for (let sd = 0; sd < NR; sd++) ribbon(sd, 0.5, 6, 1);
    if (lvl >= 3) ribbon(0.5, 0.62, 2.6, 0.7);
    g.globalCompositeOperation = 'destination-in'; g.globalAlpha = 1; g.drawImage(maskSpr(), 0, 0, Wd, Hh); }); }
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
          // spray, droplets and bubbles peeling off the column's sides at every height
          if (on && f.t - b.s > 0.4) { const kq2 = 14 * dt * H.Q() * kN; let nq = Math.floor(kq2) + (Math.random() < kq2 % 1 ? 1 : 0); while (nq-- > 0) { const sd = Math.random() < 0.5 ? -1 : 1, z = 0.3 + Math.random() * 3.6, r = Math.random(); H.P({ kind: r < 0.4 ? 'bubble' : r < 0.75 ? 'spark' : 'ember', x: b.x + sd * BR * 0.38, y: b.y - z, vx: sd * (1 + Math.random() * 2) + b.vx * 0.3, vy: -0.6 + Math.random() * 1.2, g: r < 0.4 ? 5 : 3, drag: 0.5, life: 0.5 + Math.random() * 0.5, max: 1, size: r < 0.4 ? 1.6 + Math.random() * 2 : 1.4 + Math.random() * 1.4, color: r < 0.3 ? W.pale : r < 0.6 ? W.aqua : W.white }); } }
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
            const w = T * BR * 1.05 * (on ? 1 : 1 - 0.7 * out) * (0.25 + 0.75 * cl((tt - b.s - 0.15) / 0.3)) * (1 + 0.06 * Math.sin(tt * 9 + b.ph));
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

  /* ================= 4. Deep Blue Sea ================= */
  /* the sphere: a deep sapphire centre under a translucent aqua surface with a bright rim and a gloss */
  const dbsBody = () => fxSprite('wu1dbsb', 128, 128, (g, w) => { const c0 = w / 2, R = 60, gr = g.createRadialGradient(c0 + 8, c0 + 10, 2, c0, c0, R);
    [[0, 'rgba(8,30,82,0.95)'], [0.35, 'rgba(14,47,122,0.9)'], [0.62, 'rgba(26,79,176,0.75)'], [0.82, 'rgba(46,155,230,0.6)'], [0.93, 'rgba(111,242,255,0.75)'], [0.98, 'rgba(207,246,255,0.6)'], [1, 'rgba(111,242,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.beginPath(); g.arc(c0, c0, R, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(c0 - 22, c0 - 26, 14, 7, -0.6, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(c0 + 26, c0 + 24, 3.5, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(207,246,255,0.45)'; g.lineWidth = 2; g.beginPath(); g.arc(c0, c0, R - 9, 3.6, 4.6); g.stroke(); });
  /* broad currents turning inside it (3 arms; and a tighter 2-arm set that turns the other way at Celestial) */
  const dbsCur = () => fxSprite('wu1dbsc', 128, 128, (g, w) => { const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) for (const [col, lw] of [['rgba(63,214,224,0.4)', 10], ['rgba(160,248,255,0.55)', 3], ['rgba(255,255,255,0.6)', 1]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (let i = 0; i <= 30; i++) { const u = i / 30, r = 52 * (0.15 + 0.85 * u), b = arm * TAU / 3 + u * 2.6; if (i) g.lineTo(Math.cos(b) * r, Math.sin(b) * r * 0.8); else g.moveTo(Math.cos(b) * r, Math.sin(b) * r * 0.8); } g.stroke(); } });
  const dbsCur2 = () => fxSprite('wu1dbsc2', 128, 128, (g, w) => { const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round';
    for (let arm = 0; arm < 2; arm++) for (const [col, lw] of [['rgba(46,155,230,0.5)', 6], ['rgba(207,246,255,0.7)', 1.5]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (let i = 0; i <= 30; i++) { const u = i / 30, r = 50 * u, b = arm * Math.PI - u * 5; if (i) g.lineTo(Math.cos(b) * r, Math.sin(b) * r); else g.moveTo(0, 0); } g.stroke(); } });
  /* half of the planetary ring (back = the far arc, front = the near arc), in 4 openings and 3 flow frames: a thick band of
     water, a cyan inner edge, foam flowing along it, its outer edge breaking into spray */
  const RAB = [0.18, 0.28, 0.38, 0.5], NRF = 3;
  const ringHalf = (front, ai, fi) => fxSprite('wu1dbsr|' + front + '|' + ai + '|' + fi, 256, 160, (g, w, h) => { const ar = RAB[ai], a0 = front ? 0 : Math.PI, a1 = a0 + Math.PI; g.translate(w / 2, h / 2); g.lineCap = 'round';
    const el = (r, lw, col) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.ellipse(0, 0, r, r * ar, 0, a0, a1); g.stroke(); };
    g.globalAlpha = front ? 1 : 0.75; el(100, 20, 'rgba(26,79,176,0.55)'); el(100, 13, 'rgba(63,214,224,0.62)');
    g.globalCompositeOperation = 'lighter'; el(91, 2.6, 'rgba(111,242,255,0.95)'); el(91, 1, 'rgba(255,255,255,0.9)');
    g.setLineDash([12, 16]); g.lineDashOffset = -fi * 9; el(102, 2.2, 'rgba(242,251,255,0.8)'); g.setLineDash([]);
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 26; i++) { const b = a0 + R1(i * 3.7 + fi * 11) * Math.PI, rr = 110 + 12 * R1(i * 5.1 + fi); g.fillStyle = i % 3 ? 'rgba(242,251,255,0.8)' : 'rgba(160,248,255,0.8)'; g.beginPath(); g.arc(Math.cos(b) * rr, Math.sin(b) * rr * ar, 1 + 1.6 * R1(i + fi * 3), 0, TAU); g.fill(); } });
  U.deepbluesea = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, ev = K.evo(C), lvl = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, N = K.lv(C, [1, 3, 5]), cx0 = C.tx, cy0 = C.ty, RX = (5 + 0.15 * (ev - 1)) * C.K;
    const RW = 1.0, ZH = 1.45, FORM = 1.0, CHG = 1.5, DF = lvl >= 3 ? 3.0 : 3.6, FEND = CHG + DF + 0.22 * (N - 1), GATH = lvl >= 3 ? 0.65 : 0, FGAP = 0.28, END = FEND + GATH + FGAP * (N - 1) + 0.45 + 1.4;
    const TOT = C.base * 16 * C.K * K.evoK(C), FIN = lvl >= 3 ? 0.3 : 0.2, HPX = 5, MAXP = 7, dmgP = TOT * (1 - FIN) / (N * HPX), dmgF = TOT * FIN / N, HITI = 0.8;
    H.X.banner('DEEP BLUE SEA', '', C.col, 1.6); H.X.sfx.hum();
    const S = []; for (let i = 0; i < N; i++) { const b = -Math.PI / 2 + (i - (N - 1) / 2) * (N > 1 ? 2.7 / (N - 1) : 0), rr = N > 3 && i % 2 ? 2.9 : 2.2; const hx = me.x + Math.cos(b) * rr * 1.15, hy = me.y + Math.sin(b) * rr * 0.75 - 0.2;
      S.push({ i, x: hx, y: hy, hx, hy, vx: 0, vy: 0, z: ZH, tgt: null, hitT: new Map(), np: 0, lt: CHG + i * 0.22, tilt: (i - (N - 1) / 2) * 0.25, ar: 0.32, sq: 0, sqT: -9, flT: -9, over: 0, tr: [], trT: 0, ph: R1(i * 3.3) * TAU, curv: i % 2 ? 1 : -1, fin: null, ft: 0, done: false, burstT: -9 }); }
    const warm = [() => dbsBody(), () => dbsCur(), () => dbsCur2(), () => bubbleSpr(), () => rippleSpr(), () => ringSpr(0), () => ringSpr(1)]; for (let a = 0; a < 4; a++) for (let fi = 0; fi < NRF; fi++) { warm.push(() => ringHalf(0, a, fi)); warm.push(() => ringHalf(1, a, fi)); } for (let i = 0; i < NSF; i++) { warm.push(() => rotF('dc', dbsCur, 3, NSF, i)); if (lvl >= 3) warm.push(() => rotF('dc2', dbsCur2, 2, NSF, i)); }
    const pickT = (s, t, live) => { const cand = live.filter(m => Math.hypot(m.x - cx0, m.y - cy0) < RX * 1.3 + m.r && !(t - (s.hitT.get(m) || -9) < HITI)); const others = new Set(S.filter(q => q !== s && q.tgt).map(q => q.tgt)); const pool = cand.filter(m => !others.has(m)).length ? cand.filter(m => !others.has(m)) : cand; return pool.length ? pool.sort((p, q) => Math.hypot(p.x - s.x, p.y - s.y) - Math.hypot(q.x - s.x, q.y - s.y))[0] : null; };
    const finish = s => { s.done = true; s.burstT = s.ft; H.hitArea(s.x, s.y, 1.7, dmgF, C.dmgO({ chill: true })); H.X.shake(lvl >= 3 ? 6 : 4, 0.2); H.X.sfx.crash(); H.X.light(s.x, s.y, 2.6, 0.45); H.X.ring(s.x, s.y, 0.3, 2.4, 0.5, W.aqua, 0.25);
      H.burst(s.x, s.y - s.z, 'bubble', 18, { v: 6, up: 2, g: 8, life: 0.8, size: 2.4, color: [W.pale, W.aqua, W.white] }); H.burst(s.x, s.y - s.z, 'spark', 40, { v: 8, up: 2, g: 5, life: 0.9, size: 1.8, color: [W.white, W.aqua, W.pale, W.foam] }); H.burst(s.x, s.y - s.z, 'spark', 14, { v: 3, up: 1, g: 0.8, life: 1.4, size: 2.2, color: [W.white, W.aqua] }); };
    H.add({ life: END, x: cx0, y: cy0, wi: 0,
      update(dt, f) {
        for (let q = 0; q < 3 && f.wi < warm.length; q++) warm[f.wi++]();
        const t = f.t, live = H.living();
        for (const s of S) { if (s.done) continue; let dx = 0, dy = 0, V = 0;
          if (t < s.lt) { // forming and charging round the pet: a gentle hover; droplets streaming backward while charging
            dx = (s.hx + Math.cos(t * 1.5 + s.i) * 0.15 - s.x) * 4; dy = (s.hy + Math.sin(t * 1.7 + s.i) * 0.1 - s.y) * 4;
            if (t > FORM && Math.random() < 14 * dt * H.Q()) H.P({ kind: 'spark', x: s.x + (Math.random() - 0.5) * 0.6, y: s.y - s.z + (Math.random() - 0.5) * 0.4, vx: -Math.cos(C.a) * 2.5, vy: -Math.sin(C.a) * 2.5 - 0.3, g: 1, drag: 1, life: 0.5, max: 0.5, size: 1.6, color: Math.random() < 0.5 ? W.aqua : W.white }); }
          else if (t < FEND) { // sweeping passes: curved travel, a sudden dash at the target, through it, then turn to another
            if (!s.tgt || s.tgt.dead || (s.over > 0 && t > s.over)) { s.tgt = pickT(s, t, live); s.over = 0; s.curv = -s.curv; }
            let gx, gy; if (s.tgt) { gx = s.tgt.x; gy = s.tgt.y; } else { gx = cx0 + Math.cos(t * 0.9 + s.i * 2) * RX * 0.6; gy = cy0 + Math.sin(t * 0.9 + s.i * 2) * RX * 0.45; }
            const ex = gx - s.x, ey = gy - s.y, d = Math.hypot(ex, ey) || 1, dash = s.tgt && !s.over && d < 2.6;
            if (s.over) { const sp = Math.hypot(s.vx, s.vy) || 1; dx = s.vx / sp * 6; dy = s.vy / sp * 6; }
            else { V = dash ? 10 : 4.2 + 0.2 * lvl; const wv = (lvl >= 2 ? 0.75 : 0.5) * s.curv * Math.min(1, d / 3); dx = (ex / d - ey / d * wv) * V; dy = (ey / d + ex / d * wv) * V; } }
          else { // the finale: (Celestial) a wide arc round the target area, rings aligned, then one finishing pass each
            const k = s.i, a0 = C.a + Math.PI / 2 + (k - (N - 1) / 2) * (N > 1 ? 2.6 / (N - 1) : 0), ax = cx0 + Math.cos(a0) * RX * 0.75, ay = cy0 + Math.sin(a0) * RX * 0.6, tf = FEND + GATH + k * FGAP;
            if (!s.fin) { const m = live.filter(q => Math.hypot(q.x - cx0, q.y - cy0) < RX * 1.4).sort((p, q) => Math.hypot(p.x - s.x, p.y - s.y) - Math.hypot(q.x - s.x, q.y - s.y))[k % Math.max(1, live.length)] || null; s.fin = m ? [m.x, m.y] : [cx0, cy0]; }
            if (t < tf) { if (GATH) { dx = (ax - s.x) * 5; dy = (ay - s.y) * 5; } else { dx = s.vx * 0.9; dy = s.vy * 0.9; } }
            else { const ex = s.fin[0] - s.x, ey = s.fin[1] - s.y, d = Math.hypot(ex, ey); V = 13; if (d < 0.35 || t > tf + 0.5) { s.ft = t; finish(s); continue; } dx = ex / d * V; dy = ey / d * V; } }
          // keep in the arena and off the pet; steer
          const ox = s.x - cx0, oy = s.y - cy0, dc = Math.hypot(ox, oy); if (dc > RX * 1.2 && t >= s.lt) { dx -= ox / dc * (dc - RX * 1.2) * 4; dy -= oy / dc * (dc - RX * 1.2) * 4; }
          if (t >= s.lt) { const px = s.x - me.x, py = (s.y - s.z) - (me.y - 0.5), dp = Math.hypot(px, py) || 0.01; if (dp < 1.8) { dx += px / dp * (1.8 - dp) * 6; dy += py / dp * (1.8 - dp) * 6; } }
          const kk = Math.min(1, dt * (t < s.lt ? 6 : 3.2)), ovx = s.vx, ovy = s.vy; s.vx += (dx - s.vx) * kk; s.vy += (dy - s.vy) * kk; s.x += s.vx * dt; s.y += s.vy * dt;
          // bank: the ring tilts into turns; its opening drifts
          const turn = (ovx * s.vy - ovy * s.vx) / Math.max(1, Math.hypot(s.vx, s.vy)) / Math.max(dt, 0.001); let wantT = Math.max(-0.7, Math.min(0.7, s.vx * 0.05 + turn * 0.04)); if (t > FEND && GATH && s.fin) wantT = Math.atan2(s.fin[1] - s.y, s.fin[0] - s.x) * 0.25; s.tilt += (wantT - s.tilt) * Math.min(1, dt * 3); s.ar = 0.32 + 0.12 * Math.sin(t * 0.8 + s.ph) + Math.min(0.08, Math.abs(s.vy) * 0.01);
          if (t - s.trT > 0.04) { s.trT = t; s.tr.push([s.x, s.y]); if (s.tr.length > 18) s.tr.shift(); }
          // contact: each monster once per pass (a per-monster interval), the front compresses, a ripple runs over it, the ring flares
          if (t >= s.lt && t < FEND) { let hit = 0; for (const m of live) { if (Math.hypot(m.x - s.x, m.y - s.y) > RW + m.r) continue; if (t - (s.hitT.get(m) || -9) < HITI || s.np >= MAXP) continue; s.hitT.set(m, t); H.X.hitMon(m, dmgP, C.dmgO({ chill: true })); H.slow(m, 0.6); hit++; if (Math.random() < H.Q()) { H.burst(m.x, m.y - 0.5, 'spark', 8, { v: 6, up: 2, g: 7, life: 0.5, size: 2, color: [W.white, W.foam, W.aqua] }); H.burst(m.x, m.y - 0.5, 'bubble', 4, { v: 4, up: 2, g: 8, life: 0.6, size: 2, color: [W.pale, W.aqua] }); } }
            if (hit) { s.np++; s.sqT = t; s.flT = t; s.over = t + 0.35; H.X.shake(2, 0.08); if (Math.random() < 0.5) H.X.sfx.crash(); } }
          // the wake: bubbles and droplets
          const sp = Math.hypot(s.vx, s.vy); if (t >= s.lt && Math.random() < Math.min(1, sp * 2.5 * dt) * H.Q() * 2.5) { H.P({ kind: Math.random() < 0.6 ? 'bubble' : 'spark', x: s.x - s.vx * 0.08 + (Math.random() - 0.5) * 0.5, y: s.y - s.z - s.vy * 0.08 + (Math.random() - 0.5) * 0.5, vx: -s.vx * 0.15, vy: -s.vy * 0.15 - 0.4, g: 0.5, drag: 1, life: 0.8, max: 0.8, size: 1.4 + Math.random() * 1.8, color: Math.random() < 0.5 ? W.pale : W.aqua }); } }
      },
      drawUnder(c, f, X, Y, T) { const t = f.t, GY = H.GY, rp = rippleSpr();
        c.save(); c.globalCompositeOperation = 'lighter';
        for (const s of S) { const SX = H.sx(s.x), SY = H.sy(s.y);
          // formation: water gathering in rings on the floor under each forming sphere
          if (t < FORM + 0.2) { for (let q = 0; q < 2; q++) { const u = ((t * 1.5 + q / 2 + s.i * 0.2) % 1), r = T * (0.4 + 1.1 * (1 - u)); c.globalAlpha = 0.6 * u * cl((FORM + 0.2 - t) * 4); c.drawImage(rp, SX - r, SY - r * GY, r * 2, r * 2 * GY); } }
          if (!s.done) fl(c, SX, SY, T * 1.7, 0.45 * cl(t / 0.6), W.water);
          // the finishing burst's fading ripple of blue light
          const bk = (t - s.burstT) / 1.4; if (bk > 0 && bk < 1) { const r = T * (1 + 2.6 * H.ease.out(bk)); c.globalAlpha = 0.8 * (1 - bk); c.drawImage(rp, SX - r, SY - r * GY, r * 2, r * 2 * GY); fl(c, SX, SY, r, 0.4 * (1 - bk), W.aqua); } }
        c.restore(); },
      draw(c, f, X, Y, T) {
        const t = f.t, PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46, RS = T * 1.2, body = dbsBody(), bub = bubbleSpr(), fi = Math.floor(t * 10) % NRF, gw = glowSprite(W.white), ga = glowSprite(W.aqua);
        for (const s of S.slice().sort((p, q) => p.y - q.y)) { const SX = H.sx(s.x), SY0 = H.sy(s.y), SY = SY0 - s.z * T;
          // the finishing burst: a water halo, a curved sheet of spray
          const bu = (t - s.burstT) / 0.6; if (bu > 0 && bu < 1) { const r = RS * (1 + 2.2 * H.ease.out(bu)); c.save(); c.globalAlpha = 0.9 * (1 - bu); c.drawImage(ringSpr(s.i % 3), SX - r, SY - r * 0.55, r * 2, r * 1.1); c.lineCap = 'round'; const sa0 = Math.atan2(s.vy, s.vx); for (let q = -2; q <= 2; q++) { const b = sa0 + q * 0.32, e = r * 1.2; c.strokeStyle = rgbaS(W.turq, 0.45); c.lineWidth = T * 0.22 * (1 - bu); c.beginPath(); c.moveTo(SX, SY); c.quadraticCurveTo(SX + Math.cos(b) * e * 0.6, SY + Math.sin(b) * e * 0.3 - RS * 1.2, SX + Math.cos(b) * e, SY + Math.sin(b) * e * 0.5 - RS * 0.4); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(W.white, 0.8); c.lineWidth = 1.4; c.stroke(); c.globalCompositeOperation = 'source-over'; } c.restore(); }
          if (s.done) continue;
          const form = H.ease.back(cl((t - 0.4) / 0.4)), wob = Math.exp(-Math.max(0, t - 0.6) * 4) * Math.sin(t * 22) * 0.12, rk = cl((t - 0.7) / 0.4), chg = t > FORM && t < s.lt ? cl((t - FORM) / 0.4) : 0, fin = t > FEND ? cl((t - FEND) / 0.4) : 0;
          const sq = Math.max(0, 1 - (t - s.sqT) / 0.25), fl2 = Math.max(0, 1 - (t - s.flT) / 0.35);
          const near = Math.abs(SX - PX) < RS * 2.2 && Math.abs(SY - PY) < RS * 1.8; c.save(); if (near) petHole(c, T);
          // the rising stream it forms from
          if (t < 0.95) { const u = cl(t / 0.6), a = 1 - cl((t - 0.7) / 0.25); c.save(); c.lineCap = 'round'; const pts = []; for (let j = 0; j <= 8; j++) { const v = j / 8 * u; pts.push([SX + Math.sin(v * 9 + t * 8 + s.i) * T * 0.25 * (1 - v), SY0 - (SY0 - SY) * v]); } c.globalAlpha = a; c.strokeStyle = rgbaS(W.turq, 0.55); c.lineWidth = T * 0.3; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(W.pale, 0.8); c.lineWidth = 1.6; c.stroke(); c.restore(); }
          if (form <= 0.01) { c.restore(); continue; }
          // the wake: a curved ribbon of blue light behind it
          if (t > s.lt && s.tr.length > 3) { const pts = []; for (let k = s.tr.length - 1; k >= 0; k--) pts.push([H.sx(s.tr[k][0]), H.sy(s.tr[k][1]) - s.z * T]); wribbon(c, pts, RS * 0.3, 0.5); }
          // the ring: its far half behind the sphere
          const ai = Math.max(0, Math.min(3, Math.round((s.ar * (0.3 + 0.7 * rk) - 0.18) / 0.107))), rsc = RS * 1.75 / 100 * (0.6 + 0.4 * rk) * (1 + 0.35 * fl2) * form, ra = rk * (1 - 0.3 * fl2);
          const ring = (front) => { if (ra <= 0.01) return; c.save(); c.translate(SX, SY); c.rotate(s.tilt); c.globalAlpha = Math.min(1, ra * (1 + 0.4 * chg)); c.drawImage(ringHalf(front, ai, (fi + s.i) % NRF), -128 * rsc, -80 * rsc, 256 * rsc, 160 * rsc);
            // the secondary ring of orbiting droplets (Adept; Celestial: two, turning opposite ways)
            if (lvl >= 2) { c.globalCompositeOperation = 'lighter'; const ar2 = RAB[ai]; for (let rr = 0; rr < (lvl >= 3 ? 2 : 1); rr++) { const R2 = 100 * rsc * (1.28 + 0.14 * rr), d = rr ? -1 : 1; for (let q = 0; q < 12; q++) { const b = q / 12 * TAU + t * 1.6 * d + s.ph, sb = Math.sin(b); if ((sb > 0) !== !!front) continue; const gr = T * 0.09; c.globalAlpha = ra * 0.9; c.drawImage(q % 3 ? gw : ga, Math.cos(b) * R2 - gr, sb * R2 * ar2 - gr, gr * 2, gr * 2); } } }
            c.restore(); };
          ring(0);
          // the sphere: body (compressed on contact, wobbling as it forms), turning currents, spiralling bubbles, gliding highlights
          const sx = (1 + wob - 0.18 * sq) * form, sy = (1 - wob + 0.1 * sq) * form, r = RS;
          c.save(); c.translate(SX, SY); c.scale(sx, sy); c.drawImage(body, -r * 1.067, -r * 1.067, r * 2.133, r * 2.133);
          c.globalCompositeOperation = 'lighter'; const spd = 1.2 + 2.5 * chg + 1.5 * fin; c.globalAlpha = 0.75; c.drawImage(rotAt('dc', dbsCur, 3, t * spd + s.ph), -r * 0.9, -r * 0.9, r * 1.8, r * 1.8);
          if (lvl >= 3) { c.globalAlpha = 0.7; c.drawImage(rotAt('dc2', dbsCur2, 2, -t * spd * 1.7), -r * 0.55, -r * 0.55, r * 1.1, r * 1.1); }
          c.globalAlpha = 0.5 + 0.5 * Math.max(chg, fin); c.drawImage(ga, -r * (0.5 + 0.4 * fin), -r * (0.5 + 0.4 * fin), r * (1 + 0.8 * fin), r * (1 + 0.8 * fin));
          for (let q = 0; q < 2; q++) { const b = t * (0.9 + 0.3 * q) + s.ph + q * 2.5, gx = Math.cos(b) * r * 0.55, gy = Math.sin(b) * r * 0.3 - r * 0.25; c.globalAlpha = 0.55 * (0.5 + 0.5 * Math.sin(b)); c.drawImage(glowSprite(W.turq), gx - r * 0.35, gy - r * 0.18, r * 0.7, r * 0.36); }
          if (sq > 0.01) { const rr = r * (0.3 + 0.75 * (1 - sq)); c.globalAlpha = sq; c.drawImage(rippleSpr(), -rr, -rr, rr * 2, rr * 2); }
          c.globalCompositeOperation = 'source-over'; for (let q = 0; q < 6; q++) { const u = (t * 0.45 + q / 6) % 1, b = u * 9 + q * 1.1 + s.ph, rr = r * 0.75 * (1 - u), br = r * (0.06 + 0.05 * R1(q)); c.globalAlpha = 0.8 * Math.sin(u * Math.PI); c.drawImage(bub, Math.cos(b) * rr - br, Math.sin(b) * rr * 0.7 - br - u * r * 0.2, br * 2, br * 2); }
          c.restore();
          ring(1);
          c.restore(); }
      } });
  };
  /* ================= 8. Heavenfall ================= */
  /* a thick ring of water hanging overhead, seen from below and in front: deep body, turquoise, a lit lower rim, a white
     specular streak on its far edge, an aqua inner rim */
  const hfRingSpr = () => fxSprite('wu1hfring', 256, 112, (g, w, h) => { g.translate(w / 2, h / 2); const rx = w * 0.42, ry = rx * 0.36; g.lineCap = 'round';
    for (const [col, lw] of [['rgba(14,47,122,0.7)', 26], ['rgba(46,155,230,0.75)', 18], ['rgba(63,214,224,0.7)', 10]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.stroke(); }
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(160,248,255,0.8)'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 5, rx, ry, 0, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.8; g.beginPath(); g.ellipse(0, -6, rx, ry, 0, 1.15 * Math.PI, 1.62 * Math.PI); g.stroke();
    g.strokeStyle = 'rgba(111,242,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, rx - 12, ry - 6, 0, 0, TAU); g.stroke();
    for (let i = 0; i < 14; i++) { const b = i / 14 * TAU, x = Math.cos(b) * rx, y = Math.sin(b) * ry + 9; if (Math.sin(b) < 0.2) continue; g.fillStyle = 'rgba(207,246,255,0.8)'; g.beginPath(); g.arc(x, y, 1.6 + R1(i) * 1.4, 0, TAU); g.fill(); } });
  /* the opening in the glowing disc: deep water in the middle, an aqua lip of light */
  const hfHoleSpr = () => fxSprite('wu1hfhole', 128, 128, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(4,16,48,0.95)'], [0.5, 'rgba(8,30,82,0.88)'], [0.75, 'rgba(26,79,176,0.55)'], [0.88, 'rgba(111,242,255,0.6)'], [0.95, 'rgba(207,246,255,0.5)'], [1, 'rgba(111,242,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  /* the falling column at one step of its flow: the shaded water body, long highlights moving down, fine streaks,
     translucent edges; a short fade at the top (into the ring) and a softer one at the foot (into the basin). 16 frames */
  const NHF = 16;
  const hfMask = () => fxSprite('wu1hfmask', 8, 256, (g, w, h) => { const gv = g.createLinearGradient(0, 0, 0, h); [[0, 0.45], [0.05, 1], [0.84, 1], [0.95, 0.5], [1, 0.15]].forEach(s => gv.addColorStop(s[0], `rgba(0,0,0,${s[1]})`)); g.fillStyle = gv; g.fillRect(0, 0, w, h); });
  const hfColFr = fi => fxSprite('wu1hfcol|' + fi, 64, 256, (g, w, h) => { g.drawImage(bodySpr(), 0, -h * 0.5, w, h * 1.5); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; const ph = fi / NHF;
    for (let q = 0; q < 8; q++) { const yc = ((q / 8 + R1(q * 3.7) * 0.06 + ph) % 1) * h * 1.3 - h * 0.15, x0 = w * (0.3 + 0.4 * R1(q * 5.9)), Lq = h * (0.22 + 0.14 * R1(q)); g.globalAlpha = 0.5; g.strokeStyle = 'rgba(207,246,255,0.85)'; g.lineWidth = q % 3 ? 2.4 : 4; g.beginPath(); g.moveTo(x0, yc - Lq / 2); g.lineTo(x0 + 1.5, yc + Lq / 2); g.stroke(); g.globalAlpha = 0.8; g.strokeStyle = '#FFFFFF'; g.lineWidth = 1; g.stroke(); }
    for (let q = 0; q < 14; q++) { const yc = ((R1(q * 1.3) + ph * 2) % 1) * h, x0 = w * (0.15 + 0.7 * R1(q * 8.3)); g.globalAlpha = 0.45; g.strokeStyle = 'rgba(111,242,255,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, yc); g.lineTo(x0, yc + h * 0.06); g.stroke(); }
    for (const sd of [-1, 1]) { g.globalAlpha = 0.6; g.strokeStyle = 'rgba(111,242,255,0.6)'; g.lineWidth = 1.5; g.beginPath(); for (let j = 0; j <= 16; j++) { const y = j / 16 * h, x = w / 2 + sd * (w * 0.4 + Math.sin(y * 0.07 + ph * TAU * 2 + sd) * 1.8); if (j) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
    g.globalCompositeOperation = 'destination-in'; g.globalAlpha = 1; g.drawImage(hfMask(), 0, 0, w, h); });
  /* foam churning in an impact basin (2 variants, swapped for movement): a ring of white foam blobs and splash flecks */
  const hfFoamSpr = v => fxSprite('wu1hffoam' + v, 160, 80, (g, w, h) => { const cx = w / 2, cy = h * 0.62, rx = w * 0.4, ry = rx * 0.38;
    for (let i = 0; i < 40; i++) { const b = R1(i * 3.3 + v * 9) * TAU, rr = 0.7 + 0.35 * R1(i * 7 + v), x = cx + Math.cos(b) * rx * rr, y = cy + Math.sin(b) * ry * rr, r = 2 + 5 * R1(i * 5 + v); g.globalAlpha = 0.45 + 0.45 * R1(i + v); g.fillStyle = i % 3 ? '#FFFFFF' : '#CFF6FF'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.lineCap = 'round'; for (let i = 0; i < 12; i++) { const b = R1(i * 2.1 + v * 5) * Math.PI + Math.PI, x = cx + Math.cos(b) * rx * 0.8, y = cy + Math.sin(b) * ry * 0.5; g.globalAlpha = 0.7; g.strokeStyle = 'rgba(242,251,255,0.85)'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * 6, y - 10 - 10 * R1(i + v)); g.stroke(); } });

  U.heavenfall = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, ev = K.evo(C), lvl = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, N = K.lv(C, [2, 3, 5]), a = C.a, ca = Math.cos(a), sa = Math.sin(a), pa = -sa, pb = ca, tx = C.tx, ty = C.ty;
    const RW = (0.95 + 0.03 * (ev - 1)) * Math.sqrt(C.K), Z0 = 4.2 + 0.2 * lvl, DUR = 1.9, TICK = 0.27, NT = Math.floor(DUR / TICK), TOT = C.base * 14 * C.K * K.evoK(C), dmgT = TOT / N / NT;
    H.X.banner('HEAVENFALL', '', C.col, 1.6); H.X.sfx.hum();
    /* where the waterfalls land: on the monsters near the aim; at Celestial an arc across the target area (each source
       drawn toward a monster near it), the middle rings highest */
    const live = H.living().filter(m => Math.hypot(m.x - tx, m.y - ty) < 4.6 * C.K + m.r).sort((p, q) => Math.hypot(p.x - tx, p.y - ty) - Math.hypot(q.x - tx, q.y - ty)), used = new Set(), src = [];
    for (let i = 0; i < N; i++) { let x, y, Z = Z0;
      if (N >= 5) { const u = i - (N - 1) / 2, un = u / ((N - 1) / 2); x = tx + pa * u * 1.75 + ca * (0.6 * un * un - 0.3); y = ty + pb * u * 1.75 + sa * (0.6 * un * un - 0.3); Z = Z0 + 1.1 * (1 - un * un);
        const m = live.filter(q => !used.has(q)).sort((p, q) => Math.hypot(p.x - x, p.y - y) - Math.hypot(q.x - x, q.y - y))[0]; if (m && Math.hypot(m.x - x, m.y - y) < 2.4) { used.add(m); x = x * 0.15 + m.x * 0.85; y = y * 0.15 + m.y * 0.85; } }
      else if (live[i]) { x = live[i].x; y = live[i].y; } else { const b = a + i * TAU / N + 0.5; x = tx + Math.cos(b) * 1.5; y = ty + Math.sin(b) * 1.5; }
      const dp = Math.hypot(x - me.x, y - me.y); if (dp < 1.7) { const k = 1.7 / Math.max(0.05, dp); x = me.x + (x - me.x) * k; y = me.y + (y - me.y) * k; }
      const tA = 0.2 + i * (lvl >= 3 ? 0.32 : 0.45), POUR = tA + 0.75; src.push({ i, x, y, Z, tA, OPEN: tA + 0.35, POUR, PE: POUR + DUR, nt: POUR + 0.12, n: 0, hit: false, gone: false, ph: R1(i * 4.3) * TAU }); }
    const END = src[N - 1].PE + 1.8;
    const warm = [() => hfRingSpr(), () => hfHoleSpr(), () => hfMask(), () => hfFoamSpr(0), () => hfFoamSpr(1), () => rippleSpr(), () => ringSpr(0), () => ringSpr(1), () => ringSpr(2), () => bodySpr(), () => colSpr()]; for (let i = 0; i < NHF; i++) warm.push(() => hfColFr(i)); for (let i = 0; i < NSF; i++) warm.push(() => rotF('sw', swirlSpr, 3, NSF, i));
    /* a source's state at time tt: ring scale, opening, column width factor and top/bottom (0 at the ring, 1 at the floor) */
    const ph = (s, tt) => { const form = H.ease.back(cl((tt - s.tA) / 0.45)), open = cl((tt - s.OPEN) / 0.4) * (1 - cl((tt - s.PE) / 0.3)), bot = H.ease.in(cl((tt - s.POUR) / 0.2)), narrow = 1 - 0.75 * cl((tt - s.PE) / 0.3), top = H.ease.in(cl((tt - s.PE - 0.15) / 0.32)), dis = cl((tt - s.PE - 0.35) / 0.45);
      return { form, open, bot, narrow, top, dis, pour: tt >= s.POUR && top < 1 }; };
    H.add({ life: END, x: tx, y: ty, wi: 0,
      update(dt, f) {
        for (let q = 0; q < 3 && f.wi < warm.length; q++) warm[f.wi++]();
        for (const s of src) { const P = ph(s, f.t);
          if (!s.hit && f.t >= s.POUR + 0.18) { s.hit = true; H.X.shake(lvl >= 3 ? 4 : 3, 0.15); H.X.sfx.crash(); H.X.light(s.x, s.y, RW * 2.4, 0.35); H.burst(s.x, s.y - 0.2, 'bubble', 8, { v: 4, up: 5, g: 10, life: 0.6, size: 2.6, color: [W.pale, W.aqua, W.white] }); H.burst(s.x, s.y - 0.2, 'spark', 8, { v: 5, up: 4, g: 9, life: 0.5, size: 2, color: [W.white, W.foam, W.aqua] }); H.X.ring(s.x, s.y, 0.2, RW * 2, 0.45, W.aqua, 0.14); }
          if (f.t >= s.nt && s.n < NT && f.t < s.PE) { s.nt += TICK; s.n++; H.hitArea(s.x, s.y, RW * 1.05, dmgT, C.dmgO({ chill: true })); }
          if (P.pour && P.bot > 0.9) { // spray peeling off the falling stream, foam thrown from the basin
            let k = 12 * dt * H.Q(), nq = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (nq-- > 0) { const sd = Math.random() < 0.5 ? -1 : 1, z = 0.3 + Math.random() * s.Z * 0.9; H.P({ kind: Math.random() < 0.5 ? 'spark' : 'bubble', x: s.x + sd * RW * 0.32 * P.narrow, y: s.y - z, vx: sd * (0.8 + Math.random() * 1.6), vy: 0.5 + Math.random(), g: 6, drag: 0.4, life: 0.5 + Math.random() * 0.4, max: 0.9, size: 1.4 + Math.random() * 1.6, color: Math.random() < 0.5 ? W.pale : W.white }); }
            k = 8 * dt * H.Q(); nq = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (nq-- > 0) { const b = Math.random() * TAU; H.P({ kind: 'spark', x: s.x + Math.cos(b) * RW * 0.6, y: s.y + Math.sin(b) * RW * 0.3, vx: Math.cos(b) * 2.5, vy: -2.5 - Math.random() * 2, g: 9, life: 0.5, max: 0.5, size: 1.8, color: Math.random() < 0.6 ? W.white : W.aqua }); } }
          if (!s.gone && P.dis > 0) { s.gone = true; H.burst(s.x, s.y - s.Z, 'bubble', 12, { v: 3, up: 0, g: 8, life: 0.9, size: 2.2, color: [W.pale, W.aqua, W.white] }); H.burst(s.x, s.y - s.Z, 'spark', 6, { v: 2.5, up: 0, g: 5, life: 0.8, size: 1.6, color: [W.white, W.aqua] }); } }
        // Celestial: mist drifting between the columns
        if (lvl >= 3) for (let i = 0; i + 1 < src.length; i++) { const A = src[i], B = src[i + 1]; if (!ph(A, f.t).pour || !ph(B, f.t).pour || Math.random() > 5 * dt * H.Q()) continue; const u = 0.25 + Math.random() * 0.5; H.P({ kind: 'smoke', x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u - 0.3 - Math.random() * 1.5, vx: (Math.random() - 0.5) * 0.6, vy: -0.25, life: 1.4, max: 1.4, size: 0.6, color: 'rgba(170,225,245,' }); }
      },
      drawUnder(c, f, X, Y, T) {
        const tt = f.t, GY = H.GY, rp = rippleSpr();
        // Celestial: the basins join into one luminous water pattern
        if (lvl >= 3) { let k0 = 1; for (const s of src) k0 = Math.min(k0, cl((tt - s.POUR - 0.2) / 0.5)); const kf = k0 * (1 - cl((tt - (END - 1.4)) / 1.2)); if (kf > 0.01) {
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); src.forEach((s, i) => i ? c.lineTo(H.sx(s.x), H.sy(s.y)) : c.moveTo(H.sx(s.x), H.sy(s.y)));
          c.globalAlpha = 0.35 * kf; c.strokeStyle = W.turq; c.lineWidth = T * 0.5; c.stroke(); c.globalAlpha = 0.6 * kf; c.strokeStyle = W.aqua; c.lineWidth = T * 0.14; c.stroke(); c.globalAlpha = 0.8 * kf; c.strokeStyle = W.white; c.lineWidth = 1.4; c.stroke();
          const cx = H.sx(tx), cy = H.sy(ty), R = T * (3.3 + 0.5 * Math.sin(tt * 1.3)) * Math.sqrt(C.K); fl(c, cx, cy, R * 1.2, 0.3 * kf, W.water); c.globalAlpha = 0.5 * kf; c.drawImage(swirlAt(tt * 0.5), cx - R, cy - R * GY, R * 2, R * 2 * GY); c.globalAlpha = 0.45 * kf; c.drawImage(rp, cx - R * 1.1, cy - R * 1.1 * GY, R * 2.2, R * 2.2 * GY); c.restore(); } }
        for (const s of src) { const P = ph(s, tt), SX = H.sx(s.x), SY = H.sy(s.y), R0 = RW * T;
          // small ripples mark the ground under a forming source
          if (tt > s.tA + 0.15 && tt < s.POUR + 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; for (let q = 0; q < 2; q++) { const u = ((tt - s.tA) * 1.4 + q / 2) % 1, r = R0 * (0.3 + 0.9 * u); c.globalAlpha = 0.7 * (1 - u); c.drawImage(rp, SX - r, SY - r * GY, r * 2, r * 2 * GY); } c.restore(); }
          // the foaming basin and the rings it sends out
          const bk = cl((tt - s.POUR - 0.1) / 0.25) * (1 - cl((tt - s.PE - 0.4) / 0.3));
          if (bk > 0.01) { const br = R0 * (1.25 + 0.06 * Math.sin(tt * 7 + s.ph)); c.save(); c.globalCompositeOperation = 'lighter'; fl(c, SX, SY, br * 2.2, 0.45 * bk, W.water); fl(c, SX, SY, br * 1.2, 0.4 * bk, W.aqua); c.globalAlpha = 0.6 * bk; c.drawImage(swirlAt(tt * 3 + s.ph), SX - br, SY - br * GY, br * 2, br * 2 * GY); c.restore();
            c.save(); c.globalAlpha = 0.8 * bk; c.drawImage(ringSpr(s.i % 3), SX - br, SY - br * GY, br * 2, br * 2 * GY);
            for (let q = 0; q < 3; q++) { const u = ((tt - s.POUR) * 0.8 + q / 3) % 1, r = R0 * (1.1 + 2.2 * u); c.globalAlpha = 0.65 * bk * Math.pow(1 - u, 1.3); c.drawImage(ringSpr((s.i + q + 1) % 3), SX - r, SY - r * GY, r * 2, r * 2 * GY); } c.restore(); }
          // the basin spreads into a shallow glistening puddle and fades (light only)
          const pk = (tt - s.PE - 0.3) / 1.5; if (pk > 0 && pk < 1) { const r = R0 * (1.4 + 1.4 * H.ease.out(pk)), al = 1 - pk; c.save(); c.globalCompositeOperation = 'lighter'; fl(c, SX, SY, r * 1.2, 0.4 * al, W.turq); c.globalAlpha = 0.5 * al; c.drawImage(rp, SX - r, SY - r * GY, r * 2, r * 2 * GY); for (let q = 0; q < 4; q++) { const b = q * 1.7 + tt * 0.6 + s.ph, gq = T * 0.18; c.globalAlpha = al * (0.4 + 0.4 * Math.sin(tt * 5 + q)); c.drawImage(glowSprite(W.white), SX + Math.cos(b) * r * 0.6 - gq, SY + Math.sin(b) * r * 0.6 * GY - gq, gq * 2, gq * 2); } c.restore(); } }
      },
      draw(c, f, X, Y, T) {
        const tt = f.t, GY = H.GY, PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46, hole = hfHoleSpr(), ring = hfRingSpr(), fi = Math.floor(tt * 20) % NHF;
        const order = src.slice().sort((p, q) => p.y - q.y);
        for (const s of order) { const P = ph(s, tt); if (tt < s.tA || P.dis >= 1) continue; const SX = H.sx(s.x), SY = H.sy(s.y), RY = SY - s.Z * T, rr = RW * T * 1.55 * P.form * (1 + 0.15 * P.dis), ra = cl((tt - s.tA) / 0.25) * (1 - P.dis), w = RW * T * 0.95 * P.narrow * cl(P.open * 1.6);
          const over = Math.abs(PX - SX) < w / 2 + T * 0.75 && PY > RY && PY < SY + T * 0.3; c.save(); if (over) petHole(c, T);
          // the glowing disc and the opening that develops in it, light running round its rim
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * ra; c.drawImage(glowSprite(W.aqua), SX - rr * 1.1, RY - rr * 0.42, rr * 2.2, rr * 0.84); c.restore();
          if (P.open > 0.01) { const hr = rr * 0.72 * P.open; c.save(); c.globalAlpha = ra; c.drawImage(hole, SX - hr, RY - hr * 0.36, hr * 2, hr * 0.72); c.restore(); }
          c.save(); c.globalCompositeOperation = 'lighter'; const gq = T * 0.32; for (let q = 0; q < 3; q++) { const b = tt * 4.5 + q * TAU / 3 + s.ph; c.globalAlpha = 0.85 * ra; c.drawImage(glowSprite(W.white), SX + Math.cos(b) * rr * 0.72 - gq, RY + Math.sin(b) * rr * 0.26 - gq, gq * 2, gq * 2); } c.restore();
          // the waterfall: from inside the ring down into the basin; it narrows at the end and the last water falls through
          if (P.bot > 0 && P.top < 1 && w > T * 0.18) { const y0 = RY + (SY - RY) * P.top, y1 = RY + (SY - RY) * P.bot + T * 0.15; if (y1 - y0 > 2) { c.save(); c.globalAlpha = 0.95 * cl((w / (RW * T * 0.95) - 0.18) * 2); c.drawImage(hfColFr(fi), SX - w / 2, y0, w, y1 - y0); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3; c.drawImage(colSpr(), SX - w * 0.35, y0, w * 0.7, y1 - y0); c.restore(); } }
          // the ring itself, over the top of the stream
          c.save(); c.globalAlpha = ra; c.drawImage(ring, SX - rr, RY - rr * 0.4375, rr * 2, rr * 0.875); c.restore();
          // foam churning in the basin
          const bk = cl((tt - s.POUR - 0.1) / 0.25) * (1 - cl((tt - s.PE - 0.3) / 0.3)); if (bk > 0.01) { const fw = RW * T * 2.5 * (1 + 0.05 * Math.sin(tt * 9 + s.ph)); c.save(); c.globalAlpha = 0.85 * bk; c.drawImage(hfFoamSpr(Math.floor(tt * 8 + s.i) & 1), SX - fw / 2, SY - fw * 0.31, fw, fw * 0.5); c.restore(); }
          c.restore(); }
      } });
  };
})();
