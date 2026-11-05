/* ---------- Dark, reworked: Annihilation ----------
   Dark's supreme finisher. Six concentrated purple lights erupt across the field, narrow pillars with brilliant cores and
   dark energy curling round their edges; their bases spread into six ritual circles (one giant over the aim, five smaller
   of visibly different sizes round it): the outer arcs trace themselves across the floor, concentric rings turn in
   opposite directions, gothic glyphs light in sequence, fine spokes run to bright central seals, sparks crawl round the
   inscriptions and jump between them, and shards of shadow rise and hang over them. Then exactly one missile bursts up
   from each circle (the giant one launches the largest, last): brilliant violet cores, deep-purple outer layers, pointed
   heads and long spiralling tails; they rise, then curve to a shared point high over the aim on different arcs, the
   central one climbing through the middle, and their lingering trails briefly draw a colossal ritual pattern from the
   floor to the sky. Each arrival feeds an immense sphere (a ripple races across it, it swells): a lavender core inside
   swirling violet currents and counter-rotating bands, under a darker translucent shell, sparks leaving its surface and
   curving back. It holds at full charge while the six circles pulse together and feed their remaining light upward; it
   compresses, its underside blazing; then it empties into a thick downward strike (a violet-white spearhead, twisting
   streams) into the giant circle, whose inscriptions flare outward just before the impact.
   The impact: H.X.negative(0.12) once and ONE authoritative Dark hit (24 x base x K x evoK, R = 4.4 K .. 6 K at
   Celestial, kb 7, stun 0.6) -- nothing before it, nothing after. A tight violet-white flash, an enormous expanding blast
   shell, a broad purple shockwave throwing out dark fragments, low rolling mist and luminous pressure streaks; a towering
   column rising into a rolling mushroom crown of purple-black energy, lit from within (violet underside, dark folds
   rolling over the top, sparks flickering inside); the six circles fracture into glowing segments, their glyphs lift
   and disintegrate, temporary violet cracks spread under the blast; a long aftermath of falling fragments, drifting ash,
   curling clouds and a slowly dying central glow. Light-only floor traces; nothing stays.
   Adept: wider coverage, more intricate circles, layered missile trails, richer movement inside the sphere. Celestial: a
   monumental formation with raised rotating rings over the giant circle, six coordinated spiralling trails, an immense
   layered core and the largest explosion. Six circles and six missiles at every level.
   Near the pet everything over it dims smoothly (never a cut-out). Built for the phone: the circles, glyphs, missiles,
   sphere layers, swirl, beam and cloud puffs are cached sprites; no per-frame gradients, no shadowBlur, no filters. */
(() => {
  const U = ELEM_IMPL.dark.ult; delete U.abyssorrery;
  const TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF', WHITE = '#FFFFFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  let H, GY = 0.55;
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorLight(c, X, Y, r, a, col) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), X - r, Y - r * GY, r * 2, r * 2 * GY); c.restore(); }
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }
  /* how much a thing drawn at screen (sx, sy) of radius rad px fades near the pet: a smooth dip, never a hole */
  function petDist(sx, sy, T, rad) { const px = H.sx(H.me.x), py = H.sy(H.me.y) - T * 0.45; return Math.max(0, Math.hypot(sx - px, sy - py) - (rad || 0)); }
  const dimAt = (sx, sy, T, rad) => 0.18 + 0.82 * sstep(T * 0.45, T * 1.7, petDist(sx, sy, T, rad));
  function segD(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, u = L > 0 ? cl(((px - ax) * dx + (py - ay) * dy) / L) : 0; return Math.hypot(px - ax - dx * u, py - ay - dy * u); }
  const dimSeg = (ax, ay, bx, by, T, w) => { const px = H.sx(H.me.x), py = H.sy(H.me.y) - T * 0.45; return 0.18 + 0.82 * sstep(T * 0.45, T * 1.7, segD(px, py, ax, ay, bx, by) - (w || 0)); };

  /* ================= cached pictures ================= */
  // a stroke with its glow baked in: a wide faint energy band, a mid violet one, the bright line
  function gs(g, w, col, a, gw) { g.strokeStyle = rgba(ENERGY, a * 0.22); g.lineWidth = w * (gw || 4.5); g.stroke(); g.strokeStyle = rgba(EDGE, a * 0.35); g.lineWidth = w * 2.2; g.stroke(); g.strokeStyle = rgba(col, a); g.lineWidth = w; g.stroke(); }
  const pol = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];
  function ringP(g, r) { g.beginPath(); g.arc(0, 0, r, 0, TAU); }
  /* the outer layer of a circle, seen from above (Rr = 240 in a 512 box is the circle's radius): a soft violet wash
     strongest at the rim, a heavy double ring with ticks between, a gothic arcade of pointed arches inside it; more
     rings, dots and crosses with the tier */
  const outerSpr = tier => fxSprite('da8outer' + tier, 512, 512, (g, w) => {
    const c0 = w / 2, Rr = 240; g.translate(c0, c0); g.lineCap = 'round'; g.lineJoin = 'round';
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, Rr + 14); [[0, rgba(ENERGY, 0.04)], [0.6, rgba(ENERGY, 0.07)], [0.86, rgba(ENERGY, 0.2)], [0.95, rgba(EDGE, 0.16)], [1, rgba(ENERGY, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w);
    ringP(g, Rr - 6); gs(g, 4, EDGE, 0.95); ringP(g, Rr - 20); gs(g, 1.6, EDGE, 0.7);
    g.beginPath(); for (let k = 0; k < 96; k++) { const a = k / 96 * TAU, L = k % 8 === 0 ? 11 : 5; g.moveTo(...pol(Rr - 8, a)); g.lineTo(...pol(Rr - 8 - L, a)); } gs(g, 1.2, ACC, 0.75, 3);
    const NA = 16 + tier * 4, ra = Rr - 24, rb = Rr - 50;
    g.beginPath(); for (let k = 0; k < NA; k++) { const a0 = k / NA * TAU, a1 = (k + 1) / NA * TAU, am = (a0 + a1) / 2, rm = rb + (ra - rb) * 0.45; g.moveTo(...pol(ra, a0)); g.quadraticCurveTo(...pol(rm, a0 + (am - a0) * 0.12), ...pol(rb, am)); g.quadraticCurveTo(...pol(rm, a1 - (a1 - am) * 0.12), ...pol(ra, a1)); } gs(g, 1.4, EDGE, 0.7);
    g.beginPath(); for (let k = 0; k < NA; k++) { const am = (k + 0.5) / NA * TAU, p = pol(ra - 9, am); g.moveTo(p[0] + 2.4, p[1]); g.arc(p[0], p[1], 2.4, 0, TAU); } g.fillStyle = rgba(ACC, 0.85); g.fill();
    ringP(g, rb - 4); gs(g, 1.2, EDGE, 0.55);
    if (tier >= 1) { g.setLineDash([3, 9]); ringP(g, rb - 14); gs(g, 1.6, ACC, 0.6, 3); g.setLineDash([]); g.beginPath(); for (let k = 0; k < NA; k++) { const a = k / NA * TAU, p = pol(rb - 26, a); g.moveTo(p[0], p[1] - 5); g.lineTo(p[0] + 4, p[1]); g.lineTo(p[0], p[1] + 5); g.lineTo(p[0] - 4, p[1]); g.closePath(); } gs(g, 1, EDGE, 0.6, 3); }
    if (tier >= 2) { ringP(g, Rr + 4); gs(g, 1, ACC, 0.5, 3); g.beginPath(); for (let k = 0; k < 24; k++) { const a = (k + 0.5) / 24 * TAU, p = pol(Rr - 13, a); g.moveTo(p[0] - 3, p[1]); g.lineTo(p[0] + 3, p[1]); g.moveTo(p[0], p[1] - 3); g.lineTo(p[0], p[1] + 3); } gs(g, 1, WHITE, 0.6, 3); }
  });
  /* the inner layer (the same scale): a ring pair, a hexagram (a second at Celestial), fine spokes from the seal to the
     ring, small rings at the star's points, dashes of script between the rings from Adept */
  const innerSpr = tier => fxSprite('da8inner' + tier, 512, 512, (g, w) => {
    const c0 = w / 2, r1 = 150, r2 = 134, rs = 46; g.translate(c0, c0); g.lineCap = 'round'; g.lineJoin = 'round';
    ringP(g, r1); gs(g, 2.6, EDGE, 0.9); ringP(g, r2); gs(g, 1.2, EDGE, 0.6);
    const star = (off, col, lw, a) => { g.beginPath(); for (let s = 0; s < 2; s++) { for (let k = 0; k < 3; k++) { const p = pol(r2, off + s * Math.PI / 3 + k * TAU / 3 - Math.PI / 2); k ? g.lineTo(...p) : g.moveTo(...p); } g.closePath(); } gs(g, lw, col, a); };
    star(0, EDGE, 1.6, 0.85); if (tier >= 2) star(Math.PI / 6, ACC, 1, 0.55);
    const NS = tier >= 1 ? 24 : 12; g.beginPath(); for (let k = 0; k < NS; k++) { const a = k / NS * TAU + 0.13, r0 = rs + 4, rr = k % 2 && tier >= 1 ? r2 * 0.72 : r2; g.moveTo(...pol(r0, a)); g.lineTo(...pol(rr, a)); } gs(g, 0.8, ACC, 0.5, 3.5);
    g.beginPath(); for (let k = 0; k < 6; k++) { const p = pol(r2, k * TAU / 6 - Math.PI / 2); g.moveTo(p[0] + 9, p[1]); g.arc(p[0], p[1], 9, 0, TAU); } gs(g, 1.3, EDGE, 0.85);
    g.beginPath(); for (let k = 0; k < 6; k++) { const p = pol(r2, k * TAU / 6 - Math.PI / 2); g.moveTo(p[0] + 3, p[1]); g.arc(p[0], p[1], 3, 0, TAU); } g.fillStyle = rgba(ACC, 0.95); g.fill();
    ringP(g, rs + 6); gs(g, 1.4, EDGE, 0.7);
    if (tier >= 1) { g.beginPath(); for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, d = (k * 7) % 3; g.moveTo(...pol(r2 + 4, a)); g.lineTo(...pol(r2 + 8 + d * 2, a + 0.03)); } gs(g, 1, ACC, 0.6, 3); g.setLineDash([2, 6]); ringP(g, 96); gs(g, 1.2, EDGE, 0.55, 3); g.setLineDash([]); }
  });
  /* the central seal: a hot core, a pointed quatrefoil, a ring, a small hexagon (r 44 in a 128 box) */
  const sealSpr = () => fxSprite('da8seal', 128, 128, (g, w) => {
    const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round'; g.lineJoin = 'round';
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 62); [[0, 'rgba(255,255,255,0.95)'], [0.1, rgba(ACC, 0.9)], [0.28, rgba(EDGE, 0.5)], [0.6, rgba(ENERGY, 0.18)], [1, rgba(ENERGY, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w);
    g.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, b = a + Math.PI / 4; g.moveTo(...pol(10, a - Math.PI / 4)); g.quadraticCurveTo(...pol(30, a - 0.3), ...pol(40, a)); g.quadraticCurveTo(...pol(30, a + 0.3), ...pol(10, b)); } gs(g, 1.4, ACC, 0.9, 3.5);
    ringP(g, 44); gs(g, 1.4, EDGE, 0.85, 3); g.beginPath(); for (let k = 0; k < 6; k++) { const p = pol(13, k * TAU / 6); k ? g.lineTo(...p) : g.moveTo(...p); } g.closePath(); gs(g, 1, WHITE, 0.9, 3);
  });
  /* eight gothic glyphs (48 px): pointed arch, barred triangle, crescent, fork, hooked cross, vesica, chevrons, orb */
  const GLYPHS = [
    g => { g.moveTo(-8, 10); g.quadraticCurveTo(-8, -6, 0, -13); g.quadraticCurveTo(8, -6, 8, 10); g.moveTo(0, -5); g.lineTo(0, 10); },
    g => { g.moveTo(-9, -8); g.lineTo(9, -8); g.lineTo(0, 11); g.closePath(); g.moveTo(-5, -1); g.lineTo(5, -1); },
    g => { g.arc(1, 0, 9, 0.7, TAU - 0.7); g.moveTo(-4, -12); g.lineTo(-4, 12); },
    g => { g.moveTo(0, 12); g.lineTo(0, -4); g.moveTo(-8, -12); g.quadraticCurveTo(-8, -2, 0, -4); g.quadraticCurveTo(8, -2, 8, -12); },
    g => { g.moveTo(0, -12); g.lineTo(0, 12); g.moveTo(-9, -3); g.lineTo(9, -3); g.lineTo(9, 4); g.moveTo(-9, -3); g.lineTo(-9, -10); },
    g => { g.moveTo(-11, 0); g.quadraticCurveTo(0, -11, 11, 0); g.quadraticCurveTo(0, 11, -11, 0); g.moveTo(3, 0); g.arc(0, 0, 3, 0, TAU); },
    g => { g.moveTo(-9, -10); g.lineTo(0, -2); g.lineTo(9, -10); g.moveTo(-9, 0); g.lineTo(0, 8); g.lineTo(9, 0); },
    g => { g.arc(0, -4, 6, 0, TAU); g.moveTo(0, 2); g.lineTo(0, 12); g.moveTo(-6, 12); g.lineTo(6, 12); },
  ];
  const glyphSpr = k => fxSprite('da8glyph' + k, 48, 48, (g, w) => { g.translate(w / 2, w / 2); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); GLYPHS[k](g); g.strokeStyle = rgba(ENERGY, 0.35); g.lineWidth = 7; g.stroke(); g.strokeStyle = rgba(EDGE, 0.75); g.lineWidth = 3.4; g.stroke(); g.strokeStyle = rgba(ACC, 1); g.lineWidth = 1.6; g.stroke(); });
  // a soft dark disc (the floor darkened a little under each circle, so its light reads on a bright floor)
  const markSpr = () => fxSprite('da8mark', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); [[0, 'rgba(8,5,15,0.5)'], [0.62, 'rgba(8,5,15,0.34)'], [0.86, 'rgba(24,11,46,0.1)'], [1, 'rgba(24,11,46,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  // the missile, pointing +x, its head at x = 176 of 192: a deep-purple pointed outer layer (drawn normally) ...
  function teardrop(g, x0, x1, hw) { const xm = x0 + (x1 - x0) * 0.62; g.beginPath(); g.moveTo(x1, 32); g.quadraticCurveTo(xm + (x1 - xm) * 0.4, 32 - hw, xm, 32 - hw * 0.92); g.quadraticCurveTo(x0 + (xm - x0) * 0.4, 32 - hw * 0.5, x0, 32); g.quadraticCurveTo(x0 + (xm - x0) * 0.4, 32 + hw * 0.5, xm, 32 + hw * 0.92); g.quadraticCurveTo(xm + (x1 - xm) * 0.4, 32 + hw, x1, 32); g.closePath(); }
  const missDSpr = () => fxSprite('da8missD', 192, 64, g => {
    const gr = g.createLinearGradient(0, 0, 192, 0); gr.addColorStop(0, rgba(PLUM, 0)); gr.addColorStop(0.4, rgba(PLUM, 0.55)); gr.addColorStop(0.8, rgba(BODY, 0.85)); gr.addColorStop(1, rgba(BODY, 0.9));
    for (const [hw, a] of [[27, 0.22], [24, 0.4], [21, 1]]) { teardrop(g, 4, 188, hw); g.globalAlpha = a; g.fillStyle = gr; g.fill(); } g.globalAlpha = 1;
    teardrop(g, 30, 186, 19); g.strokeStyle = rgba(EDGE, 0.5); g.lineWidth = 1.4; g.stroke(); });
  // ... and its light (drawn additively): violet body, a brilliant violet-white spear core, the hot tip
  const missLSpr = () => fxSprite('da8missL', 192, 64, g => {
    let gr = g.createLinearGradient(0, 0, 192, 0); gr.addColorStop(0, rgba(ENERGY, 0)); gr.addColorStop(0.45, rgba(ENERGY, 0.5)); gr.addColorStop(0.85, rgba(EDGE, 0.75)); gr.addColorStop(1, rgba(EDGE, 0.6));
    for (const [hw, a] of [[16, 0.3], [13, 0.5], [10, 0.9]]) { teardrop(g, 36, 184, hw); g.globalAlpha = a; g.fillStyle = gr; g.fill(); } g.globalAlpha = 1;
    gr = g.createLinearGradient(60, 0, 186, 0); gr.addColorStop(0, rgba(ACC, 0)); gr.addColorStop(0.55, rgba(ACC, 0.85)); gr.addColorStop(1, 'rgba(255,255,255,1)'); teardrop(g, 64, 186, 5); g.fillStyle = gr; g.fill();
    const rg = g.createRadialGradient(162, 32, 0, 162, 32, 22); rg.addColorStop(0, 'rgba(255,255,255,0.9)'); rg.addColorStop(0.3, rgba(ACC, 0.6)); rg.addColorStop(1, rgba(EDGE, 0)); g.fillStyle = rg; g.fillRect(140, 10, 44, 44); });
  /* the sphere's layers (r = 120 in a 256 box): the darker translucent shell, the luminous rim, the air darkened round it */
  const shellSpr = () => fxSprite('da8shell', 256, 256, g => { const gr = g.createRadialGradient(118, 114, 0, 128, 128, 128);
    [[0, 'rgba(52,16,84,0.78)'], [0.45, 'rgba(36,14,62,0.82)'], [0.75, 'rgba(20,9,38,0.9)'], [0.88, 'rgba(8,5,15,0.93)'], [0.95, 'rgba(8,5,15,0.6)'], [1, 'rgba(8,5,15,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const rimSpr = () => fxSprite('da8rim', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, rgba(ENERGY, 0)], [0.74, rgba(ENERGY, 0)], [0.86, rgba(ENERGY, 0.3)], [0.92, rgba(EDGE, 0.7)], [0.945, rgba(ACC, 0.65)], [0.975, rgba(EDGE, 0.25)], [1, rgba(EDGE, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.strokeStyle = rgba(ACC, 0.5); g.lineWidth = 5; g.beginPath(); g.arc(128, 128, 113, Math.PI * 1.02, Math.PI * 1.62); g.stroke(); g.strokeStyle = rgba(WHITE, 0.45); g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 114, Math.PI * 1.12, Math.PI * 1.48); g.stroke(); });
  // the sphere's lavender core: a hot white heart, lavender, violet, fading
  const coreSpr = () => fxSprite('da8core', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); [[0, 'rgba(255,255,255,1)'], [0.16, rgba(ACC, 0.95)], [0.4, rgba(EDGE, 0.6)], [0.68, rgba(ENERGY, 0.26)], [1, rgba(ENERGY, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const haloSpr = () => fxSprite('da8halo', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); [[0, 'rgba(8,5,15,0.7)'], [0.45, 'rgba(14,8,26,0.42)'], [0.75, 'rgba(24,11,46,0.14)'], [1, 'rgba(24,11,46,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  // swirling currents seen face on: three spiral arms, violet with pale cores (squashed into a tilted disc when drawn)
  const swirlSpr = () => fxSprite('da8swirl', 192, 192, (g, w) => {
    const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) for (const [col, lw] of [[rgba(ENERGY, 0.4), 13], [rgba(EDGE, 0.55), 6], [rgba(ACC, 0.8), 2]]) { g.strokeStyle = col; for (let i = 1; i <= 36; i++) { const u0 = (i - 1) / 36, u = i / 36, b0 = arm * TAU / 3 + u0 * 4.4, b = arm * TAU / 3 + u * 4.4; g.lineWidth = lw * (0.25 + 0.75 * Math.sin(u * Math.PI)); g.beginPath(); g.moveTo(Math.cos(b0) * c0 * 0.94 * u0, Math.sin(b0) * c0 * 0.94 * u0); g.lineTo(Math.cos(b) * c0 * 0.94 * u, Math.sin(b) * c0 * 0.94 * u); g.stroke(); } }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, c0); gr.addColorStop(0, rgba(ACC, 0.55)); gr.addColorStop(0.35, rgba(EDGE, 0.18)); gr.addColorStop(1, rgba(EDGE, 0)); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w); });
  // vertical beams (64 x 256), gaussian across: the strike's dark outer layer, its violet body with a white core
  function vbeam(key, stops, top) { return fxSprite(key, 64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(top, 'rgba(0,0,0,1)'); gv.addColorStop(0.94, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0.4)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); }); }
  const beamDSpr = () => vbeam('da8beamD', [[0, 'rgba(24,11,46,0)'], [0.2, 'rgba(24,11,46,0.5)'], [0.38, 'rgba(43,11,69,0.85)'], [0.62, 'rgba(43,11,69,0.85)'], [0.8, 'rgba(24,11,46,0.5)'], [1, 'rgba(24,11,46,0)']], 0.12);
  const beamLSpr = () => vbeam('da8beamL', [[0, rgba(ENERGY, 0)], [0.22, rgba(ENERGY, 0.35)], [0.36, rgba(EDGE, 0.75)], [0.45, rgba(ACC, 0.95)], [0.5, 'rgba(255,255,255,1)'], [0.55, rgba(ACC, 0.95)], [0.64, rgba(EDGE, 0.75)], [0.78, rgba(ENERGY, 0.35)], [1, rgba(ENERGY, 0)]], 0.12);
  // a pillar of the awakening: the same light, feathered over its upper half
  const pillarSpr = () => vbeam('da8pillar', [[0, rgba(ENERGY, 0)], [0.25, rgba(ENERGY, 0.4)], [0.4, rgba(EDGE, 0.8)], [0.5, 'rgba(255,255,255,1)'], [0.6, rgba(EDGE, 0.8)], [0.75, rgba(ENERGY, 0.4)], [1, rgba(ENERGY, 0)]], 0.55);
  // the column of the blast: dark, soft at both sides
  const colSpr = () => vbeam('da8col', [[0, 'rgba(24,11,46,0)'], [0.2, 'rgba(24,11,46,0.65)'], [0.42, 'rgba(8,5,15,0.92)'], [0.6, 'rgba(24,11,46,0.88)'], [0.8, 'rgba(43,11,69,0.55)'], [1, 'rgba(43,11,69,0)']], 0.1);
  // bands round a circle (shockwaves and the blast shell): dark body + violet edge, and light only
  const bandSpr = () => fxSprite('da8band', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(24,11,46,0)'], [0.7, 'rgba(24,11,46,0)'], [0.79, 'rgba(24,11,46,0.45)'], [0.86, 'rgba(43,11,69,0.7)'], [0.91, 'rgba(109,40,168,0.8)'], [0.95, 'rgba(165,92,255,0.95)'], [0.98, 'rgba(208,174,255,0.5)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const bandLSpr = () => fxSprite('da8bandL', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, rgba(ENERGY, 0)], [0.66, rgba(ENERGY, 0)], [0.84, rgba(ENERGY, 0.35)], [0.93, rgba(EDGE, 0.8)], [0.965, rgba(ACC, 0.9)], [1, rgba(ACC, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // the blast shell: a faint violet haze inside a luminous skin
  const shellBSpr = () => fxSprite('da8shellB', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, rgba(ACC, 0.08)], [0.5, rgba(EDGE, 0.07)], [0.8, rgba(ENERGY, 0.2)], [0.92, rgba(EDGE, 0.6)], [0.965, rgba(ACC, 0.8)], [1, rgba(ACC, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // cloud puffs: dark (the folds on top), smoky violet, and the dark puff's lit twin for the underside (additive)
  const dpuffSpr = () => fxSprite('da8dpuff', 96, 96, g => { const gr = g.createRadialGradient(42, 40, 0, 48, 48, 48); [[0, 'rgba(30,14,52,0.95)'], [0.4, 'rgba(18,9,34,0.85)'], [0.72, 'rgba(24,11,46,0.4)'], [1, 'rgba(24,11,46,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  const puffSpr = () => fxSprite('da8puff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); [[0, 'rgba(70,48,82,0.6)'], [0.5, 'rgba(43,11,69,0.34)'], [1, 'rgba(24,11,46,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  /* a shaded cloud ball (128): a dense dark body with a feathered edge and a faint smoky lift high on it; v 1: its
     underside lit violet from within (the light painted only where the ball is); v 2: a plum-tinted middle variant */
  const ballSpr = v => fxSprite('da8ball' + v, 128, 128, g => {
    const gr = g.createRadialGradient(56, 50, 0, 64, 64, 64); [[0, v === 2 ? 'rgba(62,30,90,1)' : 'rgba(44,24,66,1)'], [0.35, v === 2 ? 'rgba(40,16,66,1)' : 'rgba(26,12,46,1)'], [0.62, 'rgba(16,8,30,0.98)'], [0.8, 'rgba(12,6,22,0.75)'], [0.92, 'rgba(12,6,22,0.3)'], [1, 'rgba(12,6,22,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.globalCompositeOperation = 'source-atop'; const hl = g.createRadialGradient(46, 34, 0, 46, 34, 40); hl.addColorStop(0, 'rgba(110,80,130,0.45)'); hl.addColorStop(1, 'rgba(110,80,130,0)'); g.fillStyle = hl; g.fillRect(0, 0, 128, 128);
    const rl = g.createRadialGradient(44, 40, 0, 44, 40, 92); rl.addColorStop(0, 'rgba(165,92,255,0)'); rl.addColorStop(0.62, 'rgba(165,92,255,0)'); rl.addColorStop(0.76, 'rgba(165,92,255,0.32)'); rl.addColorStop(0.9, 'rgba(165,92,255,0)'); g.fillStyle = rl; g.fillRect(0, 0, 128, 128);
    if (v === 1) { const lg = g.createRadialGradient(64, 104, 0, 64, 96, 70); lg.addColorStop(0, 'rgba(208,174,255,0.95)'); lg.addColorStop(0.25, 'rgba(165,92,255,0.85)'); lg.addColorStop(0.55, 'rgba(109,40,168,0.55)'); lg.addColorStop(1, 'rgba(109,40,168,0)'); g.fillStyle = lg; g.fillRect(0, 0, 128, 128); } });
  const lpuffSpr = () => fxSprite('da8lpuff', 96, 96, g => { const gr = g.createRadialGradient(48, 56, 0, 48, 52, 48); [[0, rgba(EDGE, 0.75)], [0.35, rgba(ENERGY, 0.5)], [0.7, rgba(ENERGY, 0.15)], [1, rgba(ENERGY, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });

  /* a small dark fragment: a triangle with a violet edge */
  function frag(c, x, y, s, rot, a, sq) { if (!(a > 0.01) || s < 0.5) return; c.save(); c.translate(x, y); if (sq) c.scale(1, sq); c.rotate(rot); c.globalAlpha = Math.min(1, a); c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.6, s * 0.55); c.lineTo(-s * 0.35, -s * 0.5); c.closePath(); c.fillStyle = BODY; c.fill(); c.strokeStyle = rgba(EDGE, 0.75); c.lineWidth = 1; c.stroke(); c.restore(); }
  function growPath(c, pts, g, T) { const n = pts.length - 1; if (n < 1 || g <= 0) return; const k = g * n, m = Math.min(n, Math.floor(k)); c.moveTo(pts[0][0] * T, pts[0][1] * T); for (let i = 1; i <= m; i++) c.lineTo(pts[i][0] * T, pts[i][1] * T); if (m < n) { const e = k - m, a = pts[m], b = pts[m + 1]; c.lineTo(lerp(a[0], b[0], e) * T, lerp(a[1], b[1], e) * T); } }
  function makeFractures(n, L, seed) { const out = []; for (let i = 0; i < n; i++) { let a = i / n * TAU + (R1(seed + i * 3.3) - 0.5) * 0.45, r = 0.3 + 0.3 * R1(seed + i), len = L * (0.6 + 0.5 * R1(seed + i * 5.1)); const pts = [[Math.cos(a) * r, Math.sin(a) * r]]; for (let k = 1; k <= 7; k++) { a += (R1(seed + i * 11 + k) - 0.5) * 0.42; r += len / 7 * (0.7 + 0.6 * R1(seed + i * 7 + k)); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const q = pts[2 + Math.floor(R1(seed + i * 17) * 3)], ba = Math.atan2(q[1], q[0]) + (R1(seed + i * 19) < 0.5 ? 0.7 : -0.7), br = [q]; for (let k = 1; k <= 3; k++) { const aa = ba + (R1(seed + i * 23 + k) - 0.5) * 0.4, rr = len * 0.32 * k / 3; br.push([q[0] + Math.cos(aa) * rr, q[1] + Math.sin(aa) * rr]); }
    out.push({ pts, br, d: R1(seed + i * 31) * 0.15 }); } return out; }
  // a polyline drawn in nCh chunks, each styled by sty(u along 0..1, its middle point) (a fading, tapering trail in few strokes)
  function chunked(c, pts, nCh, sty) { const n = pts.length; if (n < 2) return; for (let q = 0; q < nCh; q++) { const i0 = Math.floor(q * (n - 1) / nCh), i1 = Math.floor((q + 1) * (n - 1) / nCh); if (i1 <= i0) continue; if (sty((q + 0.5) / nCh, pts[(i0 + i1) >> 1]) === false) continue; c.beginPath(); c.moveTo(pts[i0][0], pts[i0][1]); for (let i = i0 + 1; i <= i1; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); } }
  // 3D helpers for the sphere (view space: x right, y down, z toward the viewer)
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  function basis(n) { const e1 = nrm(Math.abs(n[2]) > 0.9 ? crs(n, [1, 0, 0]) : crs(n, [0, 0, 1])); return [e1, crs(n, e1)]; }
  /* a small circle on the unit sphere round axis n at latitude lat, as 3D points (k segments, rotated by ph) */
  function smallCircle(n, lat, k, ph) { const [e1, e2] = basis(n), cL = Math.cos(lat), sL = Math.sin(lat), out = []; for (let i = 0; i <= k; i++) { const a = i / k * TAU + ph, ca = Math.cos(a) * cL, sa = Math.sin(a) * cL; out.push([ca * e1[0] + sa * e2[0] + sL * n[0], ca * e1[1] + sa * e2[1] + sL * n[1], ca * e1[2] + sa * e2[2] + sL * n[2]]); } return out; }
  // stroke the front (or back) part of a 3D polyline on a sphere of radius r
  function sphPath(c, pts, r, front) { c.beginPath(); let pen = false; for (const p of pts) { const vis = front ? p[2] > 0 : p[2] <= 0; if (vis) { if (pen) c.lineTo(p[0] * r, p[1] * r); else c.moveTo(p[0] * r, p[1] * r); pen = true; } else pen = false; } }

  /* ================= D-U08 Annihilation ================= */
  U.annihilation = (C, h) => {
    H = h; GY = H.GY; const me = H.me, x = C.tx, y = C.ty, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, tier = CEL ? 2 : ADE ? 1 : 0, K = C.K, evoK = 1 + 0.08 * (ev - 1);
    const R = (4.4 + 1.6 * (ev - 1) / 6) * K, DMG = C.base * 24 * K * evoK, seed = Math.floor(Math.random() * 1000);
    const RS = (1.65 + 0.14 * (ev - 1)) * Math.sqrt(K), LR = Math.min(R, (4.2 + 0.12 * (ev - 1)) * Math.sqrt(K));
    /* the timeline */
    const TR0 = 0.35, TR1 = 1.2, IN0 = 0.6, IN1 = 1.4, GL0 = 0.9, GL1 = 1.85, SE0 = 1.45, HOLD0 = 3.55, STK = 4.4 + (CEL ? 0.3 : ADE ? 0.12 : 0), IMP = STK + 0.3, LIFE = IMP + 4.6;
    /* the six circles: the giant over the aim, five smaller of different sizes round it */
    const SF = [0.21, 0.16, 0.25, 0.18, 0.23], circ = [];
    circ.push({ i: 0, wx: 0, wy: 0, r: LR * 0.42, dir: 1, a0: R1(seed) * TAU, d: 0 });
    const th0 = -Math.PI / 2 + (R1(seed + 2) - 0.5) * 0.5;
    for (let i = 0; i < 5; i++) { const r = LR * SF[i], th = th0 + i * TAU / 5 + (R1(seed + i * 3.7) - 0.5) * 0.3, D = LR * 0.42 + r + LR * (0.07 + 0.05 * R1(seed + i * 5.3)); circ.push({ i: i + 1, wx: Math.cos(th) * D, wy: Math.sin(th) * D, th, D, r, dir: i % 2 ? 1 : -1, a0: R1(seed + i * 9) * TAU, d: 0.06 * (i + 1) }); }
    for (const ci of circ) { const gsz = Math.max(0.2, ci.r * 0.13), n = Math.max(6, Math.round(TAU * ci.r * 0.71 / (gsz * 1.7))) + tier * 2; ci.gsz = gsz; ci.gl = []; for (let j = 0; j < n; j++) ci.gl.push({ k: Math.floor(R1(seed + ci.i * 31 + j * 7) * 8), a: j / n * TAU, z: 0.6 + 1.6 * R1(seed + ci.i * 13 + j), rv: (R1(seed + ci.i * 3 + j * 11) - 0.5) * 4, dust: false }); }
    /* the six missiles: satellites launch in turn, the giant circle's (the largest) last; spirals all turning one way */
    const MS = []; const SPIN = 1.9 * (R1(seed + 5) < 0.5 ? 1 : -1);
    for (let i = 1; i <= 5; i++) { const ci = circ[i]; MS.push({ ci, L: 2.05 + (i - 1) * 0.1, FT: 1.0 + 0.04 * (i % 2), rho: ci.D, th: ci.th, s: 0.62 + 0.9 * SF[i - 1], central: false }); }
    MS.push({ ci: circ[0], L: 2.62, FT: 0.88, rho: 0, th: R1(seed + 8) * TAU, s: 1.15, central: true });
    for (const m of MS) { m.arr = m.L + m.FT; m.w = m.central ? 2 : 1; }
    const ARR_END = Math.max(...MS.map(m => m.arr));
    /* a missile's position (floor offset wx, wy in tiles about the aim; height z) along its flight u 0..1 */
    function mpos(m, u, ZC) { const e = sstep(0.18, 1, u), z = ZC * (1 - Math.pow(1 - u, 1.55));
      if (m.central) { const rr = 0.28 * (1 - e) * Math.sin(Math.PI * Math.min(1, u * 1.2)), b = m.th + u * 7; return [Math.cos(b) * rr, Math.sin(b) * rr, z]; }
      const rho = m.rho * (1 + 0.28 * Math.sin(Math.PI * Math.min(1, u / 0.55))) * (1 - e), b = m.th + SPIN * sstep(0.05, 1, u); return [Math.cos(b) * rho, Math.sin(b) * rho, z]; }
    // bands inside the sphere (counter-rotating), escaping sparks
    const NB = CEL ? 5 : ADE ? 4 : 3, bands = []; for (let i = 0; i < NB; i++) bands.push({ tilt: 0.35 + 0.9 * R1(seed + i * 4.1), b0: R1(seed + i * 6.3) * TAU, w: (0.5 + 0.4 * R1(seed + i)) * (i % 2 ? -1 : 1), lat: (R1(seed + i * 2.9) - 0.5) * 0.7, sp: (1.4 + R1(seed + i * 8) * 1.2) * (i % 2 ? 1 : -1) });
    const NSP = CEL ? 16 : ADE ? 12 : 9;
    // shadow shards hanging over the circles
    const shards = []; for (const ci of circ) for (let k = 0; k < H.n(3 + (ev >> 1) + (ci.i ? 0 : 2)); k++) shards.push({ ci, a: R1(seed + ci.i * 17 + k * 3) * TAU, rr: 0.25 + 0.6 * R1(seed + ci.i * 5 + k * 7), z0: 0.35 + 1.1 * R1(seed + ci.i * 9 + k * 13), t0: 0.7 + 0.9 * R1(seed + ci.i + k * 19), s: 0.07 + 0.07 * R1(seed + k * 23 + ci.i), rot: R1(seed + k * 29) * TAU, ph: R1(seed + k * 31 + ci.i) * TAU });
    const FR = makeFractures(8 + ev, R * 1.0, seed), NPF = H.n(CEL ? 32 : ADE ? 26 : 20), crown = [];
    for (let j = 0; j < NPF; j++) crown.push({ phi: j / NPF * TAU + (R1(seed + j * 2.3) - 0.5) * 0.35, psi: R1(seed + j * 4.7) * TAU, s: 0.8 + 0.4 * R1(seed + j * 6.1), v: 1.1 + 0.5 * R1(seed + j * 7.9) });
    const deb = [], fall = [], segs = [];
    const CROWN = CEL ? 1.18 : ADE ? 1.08 : 1;
    H.X.banner('ANNIHILATION', '', C.col, 1.6); H.X.sfx.hum();
    const F = H.add({ life: LIFE, x, y, ZC: 0, rip: [], fed: 0, crH: 1, crR: 1,
      update(dt, f) {
        const t = f.t, ZC = f.ZC || 6, Q = H.Q();
        // the awakening: sparks climbing each pillar; the tracing pens shedding sparks
        if (t < 0.8) for (const ci of circ) if (Math.random() < 9 * dt * Q) H.P({ kind: 'spark', x: x + ci.wx + (Math.random() - 0.5) * 0.3, y: y + ci.wy * GY, vx: (Math.random() - 0.5) * 1.5, vy: -5 - Math.random() * 4, g: 0, life: 0.4 + Math.random() * 0.3, max: 0.7, size: 1.5 + Math.random() * 1.5, color: Math.random() < 0.5 ? EDGE : ACC });
        if (t > TR0 && t < TR1) for (const ci of circ) if (Math.random() < 5 * dt * Q) { const a = ci.a0 + t * 0.2 * ci.dir + cl((t - TR0 - ci.d) / (TR1 - TR0)) * TAU; H.P({ kind: 'spark', x: x + ci.wx + Math.cos(a) * ci.r, y: y + (ci.wy + Math.sin(a) * ci.r) * GY, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random() * 2, g: 2, life: 0.35, max: 0.35, size: 1.6, color: ACC }); }
        // launches and arrivals
        for (const m of MS) {
          if (!m.go && t >= m.L) { m.go = true; const ci = m.ci; H.burst(x + ci.wx, y + ci.wy * GY, 'spark', m.central ? 18 : 10, { v: 5, up: 3, life: 0.5, size: 2, color: [EDGE, ACC, ENERGY] }); for (let j = 0; j < H.n(m.central ? 6 : 3); j++) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: x + ci.wx + Math.cos(b) * ci.r * 0.5, y: y + ci.wy * GY + Math.sin(b) * ci.r * 0.3, vx: Math.cos(b) * 1.2, vy: Math.sin(b) * 0.6 - 0.8, life: 0.8, max: 0.8, size: 0.5 + 0.3 * ci.r, color: 'rgba(58,36,96,' }); } H.X.sfx.whoosh(); if (m.central) H.X.shake(5, 0.25); }
          const u = (t - m.L) / m.FT;
          if (u > 0 && u < 1 && Math.random() < 16 * dt * Q) { const p = mpos(m, u, ZC); H.P({ kind: Math.random() < 0.6 ? 'spark' : 'ember', x: x + p[0] + (Math.random() - 0.5) * 0.2, y: y + p[1] * GY - p[2], vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 1.6, g: 1, life: 0.35 + Math.random() * 0.3, max: 0.65, size: 1.4 + Math.random() * 1.6, color: Math.random() < 0.5 ? EDGE : Math.random() < 0.5 ? ACC : ENERGY }); }
          if (!m.hit && u >= 1) { m.hit = true; const p = mpos(m, 0.9, ZC), d = nrm([p[0], p[1] * GY - (p[2] - ZC), p[1] * 0.9 + (m.central ? 0.25 : 0)]); f.rip.push({ t0: t, d, w: m.w }); H.X.shake(m.central ? 7 : 3, 0.2); H.X.sfx.thud(); if (m.central) H.X.sfx.hum(); }
        }
        // how much the sphere has been fed (each arrival eased in; the central counts double)
        let fed = 0; for (const m of MS) fed += m.w * sstep(m.arr - 0.04, m.arr + 0.3, t); f.fed = fed / 7;
        // the hold: motes pulled up from the floor toward the sphere
        if (t > ARR_END && t < STK && Math.random() < 10 * dt * Q) { const ci = circ[Math.floor(Math.random() * 6)], b = Math.random() * TAU, rr = Math.random() * ci.r, life = 0.7; H.P({ kind: 'spark', x: x + ci.wx + Math.cos(b) * rr, y: y + (ci.wy + Math.sin(b) * rr) * GY, vx: -(ci.wx + Math.cos(b) * rr) / life * 0.7, vy: -ZC * 0.75 / life, g: 0, life, max: life, size: 1.8, color: Math.random() < 0.5 ? ACC : EDGE }); }
        // after the impact: debris, the slow rain of fragments from the cloud, glyph dust, ash
        const post = t - IMP;
        if (post > 0) {
          for (const d of deb) { d.age += dt; if (d.rest) continue; d.wx += d.vx * dt; d.wy += d.vy * dt; d.z += d.vz * dt; d.vz -= d.g * dt; d.rot += d.vr * dt; d.vx *= 1 - dt * 0.4; d.vy *= 1 - dt * 0.4; if (d.z <= 0 && d.vz < 0) { d.z = 0; if (d.bn++ < 1 && d.g > 3) { d.vz *= -0.3; d.vx *= 0.5; d.vy *= 0.5; } else { d.rest = true; } } }
          if (post > 0.7 && post < 3.4 && Math.random() < 7 * dt * Q) { const b = Math.random() * TAU, rr = (0.3 + Math.random()) * f.crR, hz = f.crH; fall.push({ wx: Math.cos(b) * rr, wy: Math.sin(b) * rr * 0.8, z: hz + (Math.random() - 0.3) * f.crR * 0.4, vx: Math.cos(b) * (0.3 + Math.random() * 0.6), vy: Math.sin(b) * 0.3, vz: -(0.5 + Math.random() * 0.8), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 4, s: 0.06 + Math.random() * 0.08, age: 0 }); }
          for (const p of fall) { p.age += dt; p.wx += p.vx * dt; p.wy += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); p.rot += p.vr * dt; p.wx += Math.sin(t * 1.3 + p.rot) * 0.25 * dt; }
          for (const ci of circ) for (const gl of ci.gl) if (!gl.dust && gl.fx != null && post > 0.6 + gl.z * 0.35) { gl.dust = true; if (Math.random() < 0.6 * Q) { const zz = gl.z * 0.9; H.burst(x + gl.fx, y + gl.fy * GY - zz, 'spark', 3, { v: 1.6, life: 0.5, size: 1.4, color: [EDGE, ACC] }); } }
          if (post > 0.3 && post < 4 && Math.random() < 12 * dt * Q * (1 - post / 4)) { const b = Math.random() * TAU, rr = Math.random() * R * 0.9, hz = Math.random() * f.crH; H.P({ kind: Math.random() < 0.55 ? 'ember' : 'smoke', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * GY - hz, vx: (Math.random() - 0.5) * 0.8, vy: 0.25 + Math.random() * 0.5, g: 0.15, life: 1.2 + Math.random() * 0.8, max: 2, size: Math.random() < 0.5 ? 1.4 + Math.random() : 0.35 + 0.2 * Math.random(), color: Math.random() < 0.5 ? (Math.random() < 0.5 ? EDGE : SMOKE) : 'rgba(40,25,60,' }); }
        }
      },
      drawUnder(c, f, X, Y, T, gt) {
        const t = f.t, post = t - IMP, endK = cl((LIFE - t) / 0.8);
        /* --- the six circles (before the impact; a quick fade into their fractured segments at it) --- */
        const gone = post > 0 ? cl(post / 0.18) : 0, holdK = sstep(ARR_END - 0.1, STK, t), flare = sstep(IMP - 0.18, IMP, t);
        if (gone < 1) for (const ci of circ) {
          const ap = sstep(0.05 + ci.d, 0.35 + ci.d, t) * (1 - gone), tr = cl((t - TR0 - ci.d) / (TR1 - TR0)), inn = cl((t - IN0 - ci.d) / (IN1 - IN0)), m = MS.find(q => q.ci === ci), fl = t > m.L ? Math.exp(-(t - m.L) * 5) : 0;
          const pulse = holdK * (0.5 + 0.5 * Math.sin((t - ARR_END) * TAU * 2.2)), feedDim = 1 - 0.4 * sstep(ARR_END + 0.2, STK, t), fk = ci.i === 0 ? flare : 0;
          drawCircle(c, X, Y, T, ci, t, { ap, tr, inn, lit: (0.7 + 0.3 * pulse) * feedDim + fl * 0.8 + fk, fl, pulse, flare: fk });
        }
        if (post > 0) {
          /* --- the fractured circles: glowing arcs flung outward, fading; temporary cracks; the shockwaves --- */
          const q = cl(post / 1.5), sa = (1 - q) * (1 - q) * endK;
          if (sa > 0.01) for (const ci of circ) { const cx = X + ci.wx * T, cy = Y + ci.wy * T * GY; c.save(); c.translate(cx, cy); c.scale(1, GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
            const path = () => { c.beginPath(); for (let L = 0; L < 3; L++) { const rr0 = ci.r * T * [0.97, 0.71, 0.6][L], n = 5 + L + (ci.i ? 0 : 3); for (let k = 0; k < n; k++) { const s = R1(seed + ci.i * 41 + L * 13 + k), a0 = ci.a0 + (k + 0.1 + 0.15 * s) / n * TAU, a1 = ci.a0 + (k + 0.8 + 0.1 * s) / n * TAU, rr = rr0 + (0.6 + 1.6 * s) * T * H.ease.out(cl(post / 1.2)) * (1 + ci.r * 0.3); c.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr); c.arc(0, 0, Math.max(1, rr), a0, a1); } } };
            path(); c.globalAlpha = sa * 0.45; c.strokeStyle = ENERGY; c.lineWidth = Math.max(3, T * 0.16); c.stroke(); c.globalAlpha = sa * 0.9; c.strokeStyle = EDGE; c.lineWidth = Math.max(1.5, T * 0.05); c.stroke(); c.globalAlpha = sa * Math.max(0, 1 - post / 0.5); c.strokeStyle = ACC; c.lineWidth = 1.2; c.stroke(); c.restore(); }
          // the cracks: light only, racing out, glowing, gone within ~2.5 s
          const fg = H.ease.out(cl(post / 0.5)), fk = (1 - cl((post - 0.7) / 1.8)) * endK;
          if (fk > 0.01) { c.save(); c.translate(X, Y); c.scale(1, GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
            for (const [col, lw, al] of [[ENERGY, Math.max(3, T * 0.24), 0.4], [EDGE, Math.max(1.5, T * 0.075), 0.85], [ACC, 1.2, 0.6]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (const k of FR) { const gg = cl((fg - k.d) / (1 - k.d)); growPath(c, k.pts, gg, T); growPath(c, k.br, cl(gg * 1.6 - 0.5), T); } c.globalAlpha = al * fk * (0.75 + 0.25 * Math.sin(gt * 6)); c.stroke(); }
            c.restore(); }
          // the floor flash, then a slowly dying violet glow at the centre
          floorLight(c, X, Y, R * T * 1.2, 0.7 * Math.max(0, 1 - post / 0.4), ACC);
          floorLight(c, X, Y, R * T * (0.7 + 0.3 * cl(post / 1.5)), (0.45 * Math.exp(-post / 1.6) + 0.05) * endK, ENERGY); floorLight(c, X, Y, R * T * 0.3, 0.5 * Math.exp(-post / 1.2) * endK, EDGE);
          // the broad shockwave (dark body, violet edge), a light ring after it, the widest last; luminous pressure streaks
          const waves = CEL ? [[0, 1.0, 1, 0], [0.1, 1.2, 0.7, 1], [0.26, 1.5, 0.5, 1]] : ADE ? [[0, 1.0, 1, 0], [0.12, 1.25, 0.7, 1], [0.3, 1.4, 0.35, 1]] : [[0, 1.0, 1, 0], [0.12, 1.25, 0.7, 1]];
          for (const [d, sc, w, L] of waves) { const qq = cl((post - d) / 0.85); if (qq > 0 && qq < 1) { const rr = R * T * 1.2 * sc * H.ease.out(qq); c.save(); c.globalAlpha = (1 - qq) * w; c.drawImage(L ? bandLSpr() : bandSpr(), X - rr, Y - rr * GY, rr * 2, rr * 2 * GY); c.restore(); } }
          const qs = cl(post / 0.8); if (qs < 1) { const rr = R * T * 1.2 * H.ease.out(qs), NS = 22 + 3 * ev; c.save(); c.translate(X, Y); c.scale(1, GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i < NS; i++) { const a = i / NS * TAU + R1(seed + i * 3) * 0.2, l = rr * (0.18 + 0.2 * R1(seed + i * 7)); c.moveTo(Math.cos(a) * (rr - l), Math.sin(a) * (rr - l)); c.lineTo(Math.cos(a) * rr * 0.99, Math.sin(a) * rr * 0.99); } c.globalAlpha = (1 - qs) * 0.5; c.strokeStyle = EDGE; c.lineWidth = Math.max(2, T * 0.08); c.stroke(); c.globalAlpha = (1 - qs) * 0.8; c.strokeStyle = ACC; c.lineWidth = 1.1; c.stroke(); c.restore(); }
          // low rolling mist from the centre outward, thinning
          const mk = (1 - cl((post - 0.6) / 2.6)) * endK; if (mk > 0.01) { const sp = dpuffSpr(), N = H.n(14 + 2 * ev); c.save(); for (let i = 0; i < N; i++) { const a = i / N * TAU + R1(seed + i) * 0.4, d = R * (0.12 + 0.15 * R1(seed + i * 2)) + R * (0.5 + 0.45 * R1(seed + i * 3)) * H.ease.out(cl(post / 1.6)), px = X + Math.cos(a) * d * T, py = Y + Math.sin(a) * d * T * GY, pr = T * (0.6 + 0.5 * R1(seed + i * 5)) * (0.8 + 0.9 * cl(post / 1)) * (1 + 0.1 * Math.sin(gt * 1.7 + i)); c.globalAlpha = mk * 0.7 * cl(post / 0.2) * (0.35 + 0.65 * dimAt(px, py - pr * 0.3, T, pr * 0.5)); c.drawImage(sp, px - pr, py - pr * 0.6, pr * 2, pr * 1.2); } c.restore(); }
        }
      },
      draw(c, f, X, Y, T, gt) {
        const t = f.t, post = t - IMP, SC = scr(c);
        // the convergence height: the sphere's top inside the play area (never under the HUD), 4.5..8 tiles up
        if (!f.ZC) { const room = Y - (SC.y0 + T * 4.4) - RS * T; f.ZC = Math.max(4.2, Math.min(6.6, room / T)); }
        const ZC = f.ZC, SX = X, SY = Y - ZC * T, P3 = (wx, wy, z) => [X + wx * T, Y + wy * T * GY - z * T];
        /* --- the six lights awakening: narrow pillars with brilliant cores, dark energy curling round their edges --- */
        if (t < TR1 + 0.3) for (const ci of circ) { const u = t - ci.d * 0.5, k = sstep(0, 0.12, u) * (1 - sstep(TR0 + 0.2, TR1 + 0.25, t)); if (k <= 0.01) continue;
          const bx = X + ci.wx * T, by = Y + ci.wy * T * GY, hp = T * (2.4 + 1.6 * ci.r) * (0.4 + 0.6 * H.ease.out(cl(u / 0.25))), w = T * (0.16 + 0.1 * ci.r) * (1 + 0.6 * sstep(TR0, TR1, t)), AL = k * dimSeg(bx, by, bx, by - hp, T, w);
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL; c.drawImage(pillarSpr(), bx - w * 1.6, by - hp, w * 3.2, hp); c.restore();
          c.save(); c.lineCap = 'round'; for (let s = 0; s < 2; s++) { c.beginPath(); for (let j = 0; j <= 12; j++) { const v = j / 12, yy = by - hp * v * 0.85, xx = bx + Math.sin(v * 7 - t * 7 + s * Math.PI + ci.i) * w * (0.55 + 0.5 * v); j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.globalAlpha = AL * 0.3; c.strokeStyle = PLUM; c.lineWidth = Math.max(2, w * 0.5); c.stroke(); c.globalAlpha = AL * 0.35; c.strokeStyle = VOID; c.lineWidth = Math.max(1, w * 0.12); c.stroke(); } c.restore();
          glow(c, bx, by - T * 0.1, w * 3, EDGE, AL * 0.6); glow(c, bx, by - T * 0.1, w * 1.2, WHITE, AL * 0.5); }
        /* --- shadow shards hanging over the circles (pulled up into the light at the launch) --- */
        if (t < IMP + 0.05) for (const s of shards) { const m = MS[s.ci.i === 0 ? 5 : s.ci.i - 1], up = sstep(m.L - 0.05, m.L + 0.5, t), a = sstep(s.t0, s.t0 + 0.5, t) * (1 - up); if (a <= 0.01) continue; const z = s.z0 * sstep(s.t0, s.t0 + 1.2, t) + 0.08 * Math.sin(gt * 1.6 + s.ph) + up * 2.5, rr = s.ci.r * s.rr * (1 - up * 0.6), p = P3(s.ci.wx + Math.cos(s.a + gt * 0.2) * rr, s.ci.wy + Math.sin(s.a + gt * 0.2) * rr, z); frag(c, p[0], p[1], T * s.s, s.rot + gt * 0.8, a * dimAt(p[0], p[1], T), 0); }
        /* --- Celestial: two raised rings turning over the giant circle, threads of light to the floor --- */
        if (CEL && t < IMP + 0.3) { const k = sstep(1.0, 1.8, t) * (1 - sstep(IMP, IMP + 0.3, t)), G = circ[0]; if (k > 0.01) for (let j = 0; j < 2; j++) { const z = (0.9 + 0.75 * j) * sstep(1.0, 2.0, t) + 0.05 * Math.sin(gt * 2 + j) + post * (post > 0 ? 3 : 0), rr = G.r * T * (0.78 - 0.2 * j) * (1 + 0.3 * Math.max(0, post) / 0.3), cy = Y - z * T, AL = k * dimAt(X, cy, T, rr * 0.9) * (0.8 + 0.4 * flareOf(t));
            c.save(); c.translate(X, cy); c.scale(1, GY); c.rotate(gt * (j ? -0.5 : 0.35)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL * 0.8; const s = rr * 256 / 240; c.drawImage(outerSpr(2), -s, -s, s * 2, s * 2); c.restore();
            c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = EDGE; c.lineWidth = 1; c.globalAlpha = AL * 0.35; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + gt * (j ? -0.5 : 0.35); c.moveTo(X + Math.cos(a) * rr, cy + Math.sin(a) * rr * GY); c.lineTo(X + Math.cos(a) * G.r * T * 0.97, Y + Math.sin(a) * G.r * T * 0.97 * GY); } c.stroke(); c.restore(); } }
        /* --- the missiles, their spiralling tails and the lingering ritual pattern --- */
        const strand = CEL ? 3 : ADE ? 2 : 1;
        if (t > 2 && t < STK + 0.3) for (const m of MS) { const ur = (t - m.L) / m.FT; if (ur <= 0) continue; const u = Math.min(1, ur);
          const sz = T * (1.0 + 0.07 * (ev - 1)) * m.s, lw = sz * 0.34;
          // the lingering pattern: the whole path so far, faint, fading during the hold
          const lk = ur < 1 ? 1 : 1 - sstep(0.25, 1.3, t - m.arr); if (lk > 0.01) { const N = 26, pts = []; for (let j = 0; j <= N; j++) { const p = mpos(m, u * j / N, ZC); pts.push(P3(p[0], p[1], p[2])); }
            c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
            c.strokeStyle = ENERGY; c.lineWidth = lw * 1.4; chunked(c, pts, 4, (v, p) => { c.globalAlpha = lk * 0.22 * dimAt(p[0], p[1], T); });
            c.strokeStyle = EDGE; c.lineWidth = Math.max(1, lw * 0.25); chunked(c, pts, 4, (v, p) => { c.globalAlpha = lk * 0.55 * dimAt(p[0], p[1], T); }); c.restore(); }
          // the tail: dark wide body, violet, a bright thread, and helical strands round it (layered from Adept)
          if (ur < 1.35) { const u1 = u, u0 = Math.max(0, Math.min(1, ur) - 0.42) + Math.max(0, ur - 1) * 1.5, N = 18; if (u1 - u0 > 0.01) { const pts = []; for (let j = 0; j <= N; j++) { const p = mpos(m, lerp(u0, u1, j / N), ZC); pts.push(P3(p[0], p[1], p[2])); } const hd = pts[N], AL = dimAt(hd[0], hd[1], T, sz * 0.5) * (ur > 1 ? 1 - cl((ur - 1) / 0.35) : 1);
            c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = PLUM; chunked(c, pts, 4, v => { c.globalAlpha = AL * 0.5 * v; c.lineWidth = lw * 2.4 * (0.35 + 0.65 * v); });
            c.globalCompositeOperation = 'lighter'; c.strokeStyle = ENERGY; chunked(c, pts, 4, v => { c.globalAlpha = AL * 0.7 * v; c.lineWidth = lw * 1.3 * (0.3 + 0.7 * v); }); c.strokeStyle = EDGE; chunked(c, pts, 4, v => { c.globalAlpha = AL * 0.85 * v; c.lineWidth = lw * 0.45 * (0.3 + 0.7 * v); }); c.strokeStyle = ACC; chunked(c, pts, 3, v => { if (v < 0.5) return false; c.globalAlpha = AL * v; c.lineWidth = Math.max(1, lw * 0.18); });
            for (let s = 0; s < strand; s++) { const sp = []; for (let j = 0; j <= N; j++) { const a = pts[Math.max(0, j - 1)], b = pts[Math.min(N, j + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, v = j / N, off = lw * (0.6 + 1.4 * (1 - v)) * (CEL ? 1.2 : 1) * Math.sin(j * 0.75 - gt * 11 + s * TAU / strand); sp.push([pts[j][0] - dy / l * off, pts[j][1] + dx / l * off]); }
              c.strokeStyle = s % 2 ? ACC : EDGE; chunked(c, sp, 4, v => { c.globalAlpha = AL * 0.75 * v; c.lineWidth = Math.max(1, lw * 0.2); }); }
            c.restore(); } }
          // the head: deep-purple pointed body, brilliant core, a halo
          if (ur < 1) { const p1 = mpos(m, u, ZC), p0 = mpos(m, Math.max(0, u - 0.03), ZC), a = P3(p1[0], p1[1], p1[2]), b = P3(p0[0], p0[1], p0[2]), ang = Math.atan2(a[1] - b[1], a[0] - b[0]), AL = dimAt(a[0], a[1], T, sz * 0.4) * sstep(0, 0.06, ur);
            glow(c, a[0], a[1], sz * 1.6, ENERGY, AL * 0.5); c.save(); c.translate(a[0], a[1]); c.rotate(ang); const L = sz * 2.4, Hh = L / 3; c.globalAlpha = AL; c.drawImage(missDSpr(), -L * 176 / 192, -Hh / 2, L, Hh); c.globalCompositeOperation = 'lighter'; c.drawImage(missLSpr(), -L * 176 / 192, -Hh / 2, L, Hh); c.restore(); glow(c, a[0], a[1], sz * 0.55, WHITE, AL * 0.5); }
        }
        /* --- the hold: the six circles feed their remaining light upward --- */
        const fd = sstep(ARR_END - 0.05, ARR_END + 0.3, t) * (1 - sstep(STK - 0.1, STK + 0.15, t));
        if (fd > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; for (const ci of circ) { const bx = X + ci.wx * T, by = Y + ci.wy * T * GY, ang = Math.atan2(SY - by, SX - bx), len = Math.hypot(SX - bx, SY - by) - RS * T * 0.6, AL = fd * dimSeg(bx, by, SX, SY, T, T * 0.1);
            H.ray(c, bx, by, ang, Math.max(1, len), T * (ci.i ? 0.12 : 0.22), EDGE, AL * (0.35 + 0.15 * Math.sin(gt * 14 + ci.i)));
            for (let j = 0; j < 3; j++) { const v = ((gt * 0.9 + j / 3 + ci.i * 0.17) % 1), px = bx + Math.cos(ang) * len * v, py = by + Math.sin(ang) * len * v, gsz = T * 0.14; c.globalAlpha = AL * Math.sin(v * Math.PI) * 0.9; blitSized(c, glowSprite(ACC), px - gsz, py - gsz, gsz * 2, gsz * 2); } } c.restore(); }
        /* --- the sphere --- */
        if (t > 2.2 && t < IMP + 0.2) { const fed = f.fed, grow = 0.16 + 0.84 * H.ease.out(fed), empty = sstep(STK, IMP + 0.04, t), hold = sstep(ARR_END + 0.2, STK, t);
          let jolt = 0; for (const rp of f.rip) { const q = (t - rp.t0) / 0.5; if (q > 0 && q < 1) jolt = Math.max(jolt, (1 - q) * (1 - q) * rp.w); }
          const r = RS * T * grow * (1 + 0.06 * jolt) * (1 - 0.88 * empty) * (1 + 0.025 * Math.sin(gt * 9) * hold), sq = 1 - 0.12 * hold + 0.1 * empty, AL = dimAt(SX, SY, T, r * 0.85) * sstep(2.2, 2.7, t) * (1 - sstep(IMP - 0.02, IMP + 0.12, t));
          drawSphere(c, SX, SY, r, sq, gt, t, f, { AL, fed, hold, empty, T });
          // the seed of light before the first arrival: a gathering glow at the convergence point
          if (fed < 0.2) { const k = sstep(2.2, 2.9, t) * (1 - fed / 0.2); glow(c, SX, SY, T * (0.6 + 0.4 * Math.sin(gt * 12)), ACC, AL * k * 0.8); glow(c, SX, SY, T * 1.6, ENERGY, AL * k * 0.6); } }
        /* --- the downward strike --- */
        if (t > STK && t < IMP + 0.4) { const k = cl((t - STK) / (IMP - STK)), r0 = RS * T, top = SY + r0 * 0.55 * (1 - 0.6 * k), tip = lerp(top, Y - T * 0.15, H.ease.in(k)), af = 1 - cl((t - IMP) / 0.4), bw = T * (0.5 + 0.06 * (ev - 1)) * (1 - 0.5 * cl((t - IMP) / 0.4)), AL = af * dimSeg(X, top, X, tip, T, bw * 0.6), len = Math.max(1, tip - top);
          c.save(); c.globalAlpha = AL * 0.9; c.drawImage(beamDSpr(), X - bw * 1.6, top, bw * 3.2, len); c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL; c.drawImage(beamLSpr(), X - bw, top, bw * 2, len); c.globalAlpha = AL * 0.6; c.drawImage(beamLSpr(), X - bw * 0.45, top, bw * 0.9, len);
            // twisting streams round it
            c.lineCap = 'round'; const NSt = CEL ? 5 : ADE ? 4 : 3; for (let s = 0; s < NSt; s++) { c.beginPath(); for (let j = 0; j <= 16; j++) { const v = j / 16, yy = top + len * v, ph = v * 9 - gt * 16 + s * TAU / NSt, xx = X + Math.sin(ph) * bw * (1.1 + 0.3 * Math.sin(v * 5 + s)); j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.globalAlpha = AL * 0.35; c.strokeStyle = ENERGY; c.lineWidth = Math.max(2, bw * 0.3); c.stroke(); c.globalAlpha = AL * 0.75; c.strokeStyle = s % 2 ? ACC : EDGE; c.lineWidth = Math.max(1, bw * 0.08); c.stroke(); }
            c.restore();
          if (t < IMP) { glow(c, X, tip, bw * 3.4, EDGE, AL * 0.7); glow(c, X, tip, bw * 1.5, WHITE, AL * 0.8); c.save(); c.translate(X, tip); c.rotate(Math.PI / 2); c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL; const L = bw * 4.4, Hh = L / 3; c.drawImage(missLSpr(), -L * 176 / 192, -Hh / 2, L, Hh); c.restore(); } }
        if (post < 0) return;
        /* ================= the annihilation blast ================= */
        const endK = cl((LIFE - t) / 0.8), RT = R * T;
        // the concentrated flash
        { const fl = Math.max(0, 1 - post / 0.32); if (fl > 0) { const AL = 0.4 + 0.6 * dimAt(X, Y - T * 0.6, T, T); glow(c, X, Y - T * 0.6, T * (1.0 + 2.6 * H.ease.out(cl(post / 0.12))), WHITE, AL * fl); glow(c, X, Y - T * 0.6, RT * 0.6 * (0.5 + 0.5 * H.ease.out(cl(post / 0.12))), ACC, AL * fl * 0.6); } }
        // the enormous expanding blast shell: a purple-black skin over a violet haze, rising off the floor
        { const q = cl(post / 0.8); if (q < 1) { const rr = RT * 1.15 * H.ease.out(q) * CROWN, ry = rr * 0.72, cy = Y - rr * 0.32, AL = (1 - q) * (0.55 + 0.45 * dimAt(X, Y - T * 0.5, T, T)); c.save(); c.globalAlpha = AL * 0.75; c.drawImage(bandSpr(), X - rr, cy - ry, rr * 2, ry * 2); c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL; c.drawImage(shellBSpr(), X - rr, cy - ry, rr * 2, ry * 2); c.restore(); } }
        // rays thrown up out of the impact
        { const ra = Math.max(0, 1 - post / 0.7); if (ra > 0) { const NR = 9 + ev, AL = 0.4 + 0.6 * dimAt(X, Y - T, T, T); for (let i = 0; i < NR; i++) { const b = -Math.PI + (i + 0.5) / NR * Math.PI + Math.sin(i * 7.3) * 0.12, L = RT * (0.8 + 0.5 * R1(seed + i * 3)) * H.ease.out(cl(post / 0.25)); H.ray(c, X, Y - T * 0.3, b, L, T * (0.35 + 0.3 * R1(seed + i)), i % 3 ? EDGE : ACC, 0.5 * ra * AL); } } }
        // the column and the mushroom crown
        drawCloud(c, f, X, Y, T, gt, post, endK);
        // the glyphs lifting off the floor and coming apart
        { const N = []; for (const ci of circ) for (const gl of ci.gl) { if (gl.fx == null) { const a = ci.a0 - IMP * 0.14 * ci.dir + gl.a, rg = ci.r * 0.71; gl.fx = ci.wx + Math.cos(a) * rg; gl.fy = ci.wy + Math.sin(a) * rg; gl.ang = a; } const q = cl(post / (1.0 + gl.z * 0.45)); if (q >= 1) continue; const z = gl.z * H.ease.out(q) * (1 + 0.25 * ci.r), p = P3(gl.fx + Math.cos(gl.ang) * q * 0.5, gl.fy + Math.sin(gl.ang) * q * 0.5, z), sz = T * ci.gsz * 1.25 * (1 - 0.6 * q), a = sstep(0, 0.08, post) * (1 - q) * (1 - q) * dimAt(p[0], p[1], T); if (a <= 0.01) continue; c.save(); c.translate(p[0], p[1]); c.rotate(gl.rv * q); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * 1.2); c.drawImage(glyphSpr(gl.k), -sz, -sz, sz * 2, sz * 2); c.restore(); } }
        // the debris: dark fragments thrown out, then the slow rain falling from the cloud
        for (const d of deb) { const a = (1 - cl((d.age - 1.4) / 0.7)) * endK; if (a <= 0.01) continue; const p = P3(d.wx, d.wy, d.z); frag(c, p[0], p[1], T * d.s, d.rot, a * dimAt(p[0], p[1], T), d.rest ? GY : 0); }
        for (const p of fall) { const a = sstep(0, 0.3, p.age) * (1 - cl((p.age - 2.4) / 0.8)) * cl(p.z / 0.4 + 0.2) * endK; if (a <= 0.01) continue; const s = P3(p.wx, p.wy, p.z); frag(c, s[0], s[1], T * p.s, p.rot, a * dimAt(s[0], s[1], T), 0); }
      } });
    function flareOf(t) { return sstep(IMP - 0.18, IMP, t) * (t < IMP ? 1 : 0); }
    /* one circle on the floor: dark under-disc, floor light, the traced outer layer, the counter-turning inner layer, the
       glyph band lighting in sequence, the seal, crawling sparks and sparks jumping between the rings */
    function drawCircle(c, X, Y, T, ci, t, S) {
      if (S.ap <= 0.01) return; const cx = X + ci.wx * T, cy = Y + ci.wy * T * GY, rp = ci.r * T * (1 + 0.12 * S.flare), a = S.ap, L = Math.min(1.6, S.lit), s = rp * 256 / 240;
      c.save(); c.translate(cx, cy); c.scale(1, GY);
      c.globalAlpha = a * 0.55; c.drawImage(markSpr(), -rp * 1.25, -rp * 1.25, rp * 2.5, rp * 2.5);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, a * (0.22 + 0.18 * S.pulse + 0.6 * S.fl + 0.5 * S.flare)); blitSized(c, glowSprite(ENERGY), -rp * 1.15, -rp * 1.15, rp * 2.3, rp * 2.3);
      if (S.tr > 0) { const ra = ci.a0 + t * 0.2 * ci.dir; c.save(); c.rotate(ra); if (S.tr < 1) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, s * 1.5, 0, S.tr * TAU); c.closePath(); c.clip(); } c.globalAlpha = Math.min(1, a * L); c.drawImage(outerSpr(tier), -s, -s, s * 2, s * 2); c.restore();
        if (S.tr < 1) { const ha = ra + S.tr * TAU, hx = Math.cos(ha) * rp * 0.96, hy = Math.sin(ha) * rp * 0.96, gsz = T * 0.5; c.globalAlpha = a; blitSized(c, glowSprite(ACC), hx - gsz, hy - gsz, gsz * 2, gsz * 2); blitSized(c, glowSprite(WHITE), hx - gsz * 0.35, hy - gsz * 0.35, gsz * 0.7, gsz * 0.7); } }
      if (S.inn > 0) { const e = H.ease.out(S.inn); c.save(); c.rotate(ci.a0 * 0.7 - t * 0.34 * ci.dir); c.scale(0.75 + 0.25 * e, 0.75 + 0.25 * e); if (S.inn < 1) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, s * 1.5, 0, -S.inn * TAU, true); c.closePath(); c.clip(); } c.globalAlpha = Math.min(1, a * L * e); c.drawImage(innerSpr(tier), -s, -s, s * 2, s * 2); c.restore(); }
      // the glyph band (turning against the outer ring), each glyph lighting in turn with a flash; they flare outward before the impact
      const gr = rp * 0.71 * (1 + 0.35 * S.flare), gsz = ci.gsz * T * (1 + 0.4 * S.flare), n = ci.gl.length, ga = ci.a0 - t * 0.14 * ci.dir;
      for (let j = 0; j < n; j++) { const gl = ci.gl[j], dt = t - (GL0 + ci.d + j / n * (GL1 - GL0) * 0.85); if (dt <= 0) continue; const b = Math.min(1, dt / 0.06) * (0.62 + 0.5 * Math.exp(-dt * 6) + 0.08 * Math.sin(t * 9 + j * 2.1)); c.save(); c.rotate(ga + gl.a); c.translate(gr, 0); c.rotate(Math.PI / 2); c.globalAlpha = Math.min(1, a * b * L); c.drawImage(glyphSpr(gl.k), -gsz, -gsz, gsz * 2, gsz * 2); c.restore(); }
      // the seal
      const sk = cl((t - SE0 - ci.d) / 0.25); if (sk > 0) { const ss = rp * 0.42 * (1 + 0.25 * Math.exp(-(t - SE0 - ci.d) * 5)); c.save(); c.rotate(t * 0.6 * ci.dir); c.globalAlpha = Math.min(1, a * sk * (0.75 + 0.25 * S.pulse + S.fl + S.flare)); c.drawImage(sealSpr(), -ss, -ss, ss * 2, ss * 2); c.restore(); }
      // sparks crawling round the inscriptions, and now and then one jumping between the rings
      if (S.tr >= 1) { for (let k = 0; k < 2; k++) { const b = ci.a0 + t * (1.4 + k * 0.5) * (k ? -ci.dir : ci.dir) + k * 2, rr = rp * (k ? 0.625 : 0.965), gsz = T * 0.16; c.globalAlpha = a * 0.9; blitSized(c, glowSprite(ACC), Math.cos(b) * rr - gsz, Math.sin(b) * rr - gsz, gsz * 2, gsz * 2); }
        const bk = Math.floor(t * 7 + ci.i * 3.1); if (R1(seed + bk * 7.7 + ci.i) < 0.45) { const b = R1(seed + bk * 3.3 + ci.i) * TAU, r0 = rp * 0.96, r1 = rp * 0.62; c.beginPath(); for (let j = 0; j <= 4; j++) { const v = j / 4, rr = lerp(r0, r1, v), bb = b + (j % 2 ? 1 : -1) * 0.05 * (j > 0 && j < 4 ? 1 : 0); j ? c.lineTo(Math.cos(bb) * rr, Math.sin(bb) * rr) : c.moveTo(Math.cos(bb) * rr, Math.sin(bb) * rr); } c.lineCap = 'round'; c.globalAlpha = a * 0.5; c.strokeStyle = EDGE; c.lineWidth = Math.max(2, T * 0.07); c.stroke(); c.globalAlpha = a; c.strokeStyle = ACC; c.lineWidth = 1.1; c.stroke(); } }
      c.restore();
    }
    /* the sphere: the air darkened round it, the bloom, the darker translucent shell; inside, counter-rotating bands
       (their far halves first), turning spiral currents and a lavender core; the near halves of the bands, the luminous
       rim, a specular, ripples racing across it from each arrival; sparks leaving its surface and curving back */
    function drawSphere(c, X0, Y0, r, sq, gt, t, f, P) {
      if (r < 2 || P.AL <= 0.01) return; const AL = P.AL, T = P.T, ch = 0.5 * P.fed + 0.5 * P.hold;
      c.save(); c.globalAlpha = AL * 0.75; c.drawImage(haloSpr(), X0 - r * 2.1, Y0 - r * 2.1 * sq, r * 4.2, r * 4.2 * sq); c.restore();
      glow(c, X0, Y0, r * 2.7, ENERGY, AL * (0.3 + 0.3 * ch)); glow(c, X0, Y0, r * 1.7, EDGE, AL * (0.08 + 0.2 * ch));
      c.save(); c.translate(X0, Y0); c.scale(1, sq);
      c.globalAlpha = AL * 0.95; c.drawImage(shellSpr(), -r * 128 / 120, -r * 128 / 120, r * 256 / 120, r * 256 / 120);
      const bandPts = bands.map(b => { const pr = b.b0 + gt * b.w, n = nrm([Math.sin(b.tilt) * Math.cos(pr), -Math.cos(b.tilt), Math.sin(b.tilt) * Math.sin(pr)]); return { b, n, pts: smallCircle(n, b.lat, 30, 0) }; });
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const B of bandPts) { sphPath(c, B.pts, r * 0.9, false); c.globalAlpha = AL * 0.12; c.strokeStyle = ENERGY; c.lineWidth = Math.max(2, r * 0.06); c.stroke(); c.globalAlpha = AL * 0.18; c.strokeStyle = EDGE; c.lineWidth = Math.max(1, r * 0.015); c.stroke(); }
      // the currents: spiral arms turning in tilted planes (a counter-turning layer from Adept, a third at Celestial)
      const sw = swirlSpr(); for (let L = 0; L < (CEL ? 3 : ADE ? 2 : 1); L++) { c.save(); c.rotate([0.25, -0.5, 1.1][L]); c.scale(1, [0.55, 0.4, 0.75][L]); c.rotate(gt * [1.0, -1.5, 0.7][L]); const rr = r * [0.9, 0.78, 0.66][L]; c.globalAlpha = AL * [0.8, 0.6, 0.5][L] * (0.6 + 0.4 * ch); c.drawImage(sw, -rr, -rr, rr * 2, rr * 2); c.restore(); }
      // the lavender core (immense and layered at Celestial)
      const pu = 0.9 + 0.1 * Math.sin(gt * 7), cr = r * (0.42 + 0.16 * ch + (CEL ? 0.06 : 0));
      c.globalAlpha = AL * 0.7; blitSized(c, glowSprite(ENERGY), -r * 1.05, -r * 1.05, r * 2.1, r * 2.1);
      c.globalAlpha = AL * 0.75 * pu; blitSized(c, glowSprite(EDGE), -cr * 1.9, -cr * 1.9, cr * 3.8, cr * 3.8);
      c.globalAlpha = AL * 0.95 * pu; blitSized(c, glowSprite(ACC), -cr * 1.25, -cr * 1.25, cr * 2.5, cr * 2.5);
      c.globalAlpha = AL * 0.8 * pu; blitSized(c, glowSprite(WHITE), -cr * 0.6, -cr * 0.6, cr * 1.2, cr * 1.2); c.globalAlpha = AL * 0.9 * pu; blitSized(c, coreSpr(), -cr * 1.15, -cr * 1.15, cr * 2.3, cr * 2.3);
      if (CEL) { c.globalAlpha = AL * 0.5; c.strokeStyle = ACC; c.lineWidth = Math.max(1, r * 0.012); for (let k = 0; k < 3; k++) { const rr = cr * (0.55 + 0.2 * k); c.beginPath(); c.ellipse(0, 0, rr, rr * 0.35, gt * (k % 2 ? -1.6 : 1.2) + k, 0, TAU); c.stroke(); } }
      // the near halves of the bands, a bead running each
      for (const B of bandPts) { sphPath(c, B.pts, r * 0.9, true); c.globalAlpha = AL * 0.2; c.strokeStyle = ENERGY; c.lineWidth = Math.max(2, r * 0.06); c.stroke(); c.globalAlpha = AL * 0.5; c.strokeStyle = EDGE; c.lineWidth = Math.max(1, r * 0.014); c.stroke();
        const bp = smallCircle(B.n, B.b.lat, 1, gt * B.b.sp)[0]; if (bp[2] > 0) { const gsz = r * 0.09; c.globalAlpha = AL * 0.9; blitSized(c, glowSprite(ACC), bp[0] * r * 0.9 - gsz, bp[1] * r * 0.9 - gsz, gsz * 2, gsz * 2); } }
      // the ripples of the arrivals
      for (const rp of f.rip) { const q = (t - rp.t0) / 0.7; if (q <= 0 || q >= 1) continue; const pts = smallCircle(rp.d, Math.PI / 2 - q * 1.9, 32, 0); sphPath(c, pts, r * 1.0, true); c.globalAlpha = AL * (1 - q) * 0.5 * rp.w; c.strokeStyle = EDGE; c.lineWidth = Math.max(2, r * 0.06 * (1 - q * 0.5)); c.stroke(); c.globalAlpha = AL * (1 - q) * 0.9; c.strokeStyle = ACC; c.lineWidth = Math.max(1, r * 0.015); c.stroke();
        if (q < 0.4 && rp.d[2] > -0.2) { const gsz = r * 0.5 * (1 - q / 0.4); c.globalAlpha = AL * (1 - q / 0.4); blitSized(c, glowSprite(WHITE), rp.d[0] * r - gsz, rp.d[1] * r - gsz, gsz * 2, gsz * 2); } }
      // the rim and a specular
      c.globalAlpha = AL * (0.65 + 0.35 * ch); c.drawImage(rimSpr(), -r * 128 / 120, -r * 128 / 120, r * 256 / 120, r * 256 / 120);
      c.globalAlpha = AL * 0.3; blitSized(c, glowSprite(ACC), -r * 0.66, -r * 0.7, r * 0.6, r * 0.6);
      // the underside blazing as it compresses
      if (P.hold > 0.01) { c.globalAlpha = AL * P.hold * 0.85; blitSized(c, glowSprite(ACC), -r * 0.8, r * 0.25, r * 1.6, r * 0.9); c.globalAlpha = AL * P.hold * 0.6; blitSized(c, glowSprite(WHITE), -r * 0.4, r * 0.5, r * 0.8, r * 0.45); }
      c.restore();
      // sparks escaping its surface and curving back in
      if (P.fed > 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < NSP; k++) { const per = 1.1 + 0.4 * R1(seed + k), tk = gt + k * 0.37, cyc = Math.floor(tk / per), u = tk / per - cyc, a0 = R1(seed + k * 3.1 + cyc * 1.7) * TAU, dir = k % 2 ? 1 : -1;
          for (let j = 0; j < 3; j++) { const v = u - j * 0.05; if (v <= 0) continue; const ang = a0 + 0.9 * v * dir, d = r * (0.98 + 0.42 * Math.sin(Math.PI * v)), gsz = T * (0.09 - j * 0.022); c.globalAlpha = AL * Math.sin(Math.PI * v) * (1 - j * 0.3); blitSized(c, glowSprite(j ? EDGE : ACC), X0 + Math.cos(ang) * d - gsz, Y0 + Math.sin(ang) * d * sq - gsz, gsz * 2, gsz * 2); } } c.restore(); }
    }
    /* the column and the mushroom crown: a dark billowing column with violet light up its heart and a skirt rolling out at
       its foot; at its top a torus of puffs rolling outward over the top (dark folds above, violet-lit underneath), a
       dark cap, light inside it, sparks flickering through it; it rises, widens, darkens and thins away */
    function drawCloud(c, f, X, Y, T, gt, post, endK) {
      const ZC = f.ZC, rise = H.ease.out(cl(post / 1.2)), late = cl((post - 1.1) / 2.8), fadeK = sstep(0, 0.1, post) * (1 - sstep(2.6, 4.4, post)) * endK;
      const hcr = Math.min(ZC * 0.78, (1.2 + (ZC * 0.62 - 1.2) * rise) * CROWN) + late * 0.7, Rr = R * 0.3 * CROWN * (0.4 + 0.6 * rise) * (1 + 0.3 * late), rt = Rr * 0.52, wb = R * 0.085 * CROWN * (1 + 0.35 * late);
      f.crH = hcr; f.crR = Rr;
      if (fadeK <= 0.01) return;
      const B0 = ballSpr(0), B1 = ballSpr(1), B2 = ballSpr(2), PX = H.sx(H.me.x), PY = H.sy(H.me.y) - T * 0.45, dim = (px, py, pr) => 0.22 + 0.78 * sstep(T * 0.4, T * 1.6, Math.hypot(px - PX, py - PY) - pr * 0.75);
      const ball = (S, px, py, pr, a, sy) => { if (a <= 0.01 || pr < 1) return; c.globalAlpha = Math.min(1, a); c.drawImage(S, px - pr, py - pr * (sy || 1), pr * 2, pr * 2 * (sy || 1)); };
      c.save();
      // the skirt at its foot: dark balls rolling out along the floor, violet light under them
      { const N = H.n(12 + ev), rb = wb * T * (1.4 + 2.2 * rise + 1.2 * late); for (let i = 0; i < N; i++) { const a = i / N * TAU + post * 0.25, px = X + Math.cos(a) * rb, py = Y - T * 0.1 + Math.sin(a) * rb * 0.38, pr = wb * T * (1.0 + 0.35 * R1(seed + i * 3)) * (0.6 + 0.6 * rise); ball(i % 2 ? B1 : B0, px, py, pr, fadeK * 0.9 * dim(px, py, pr), 0.75); } }
      // the column: stacked billows (narrow at the waist, wider at the foot), the violet light up its heart, currents climbing it
      const topY = Y - hcr * T, hp = Y - topY, w = wb * T * (1 - 0.2 * late);
      { const NB = 11; for (let i = 0; i < NB; i++) { const v = (i + 0.5) / NB, roll = (post * 0.5 + i * 0.37) % 1, yy = Y - hp * v, wv = w * (1.15 - 0.45 * Math.sin(Math.PI * v * 0.85)), side = (i % 2 ? 1 : -1) * wv * 0.28 * Math.sin(roll * TAU), pr = wv * (0.95 + 0.15 * R1(seed + i)); ball(i % 3 === 1 ? B2 : B0, X + side, yy, pr, fadeK * dim(X, yy, pr) * (v > 0.85 ? 1 - (v - 0.85) / 0.3 : 1)); }
        c.globalCompositeOperation = 'lighter'; const NS = 5; for (let k = 0; k < NS; k++) { const y0 = Y - hp * k / NS, y1 = Y - hp * (k + 1) / NS, a = fadeK * (0.7 + 0.3 * (1 - cl(post / 0.8))) * (1 - late * 0.5) * dim(X, (y0 + y1) / 2, w * 0.4); c.globalAlpha = a; c.drawImage(beamLSpr(), X - w * 0.55, y1 - 1, w * 1.1, y0 - y1 + 2); }
        c.lineCap = 'round'; for (let i = 0; i < 2 + (ev >> 1); i++) { c.beginPath(); for (let k = 0; k <= 10; k++) { const u = k / 10, xx = X + Math.sin(u * 6 + post * 6 + i * 2.1) * w * (0.3 + 0.35 * u), yy = Y - hp * u; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.globalAlpha = fadeK * 0.5 * (1 - late) * dim(X, Y - hp * 0.5, hp * 0.3); c.strokeStyle = EDGE; c.lineWidth = Math.max(1, T * 0.05); c.stroke(); }
        c.globalCompositeOperation = 'source-over'; }
      // the crown: balls on a rolling torus (outward over the top, down the outside, in underneath): back half, the light
      // inside, the front half, then the dark cap whose folds roll over the top
      const items = []; for (const p of crown) { const psi = p.psi - post * p.v * 1.2, d = Rr + rt * Math.cos(psi), hh = hcr + rt * 0.66 * Math.sin(psi), px = X + Math.cos(p.phi) * d * T, py = Y - hh * T + Math.sin(p.phi) * d * T * 0.42; items.push({ px, py, top: Math.sin(psi), dep: Math.sin(p.phi) - 0.35 * Math.sin(psi), pr: rt * T * p.s * (0.85 + 0.25 * rise) }); }
      items.sort((a, b) => a.dep - b.dep);
      const lit = 1 - late * 0.65, drawI = it => ball(it.top < 0.15 ? B1 : it.top < 0.6 ? B2 : B0, it.px, it.py, it.pr, fadeK * dim(it.px, it.py, it.pr) * (it.top < 0.15 ? 0.6 + 0.4 * lit : 1));
      let i = 0; for (; i < items.length && items[i].dep < 0; i++) drawI(items[i]);
      const iy = Y - hcr * T, ir = (Rr + rt * 0.4) * T, da = dim(X, iy, ir); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fadeK * da * (0.6 + 0.2 * Math.sin(gt * 5)) * lit; blitSized(c, glowSprite(ENERGY), X - ir * 1.3, iy - ir * 0.75, ir * 2.6, ir * 1.5); c.globalAlpha = fadeK * da * 0.55 * lit; blitSized(c, glowSprite(EDGE), X - ir * 0.8, iy - ir * 0.25, ir * 1.6, ir * 0.7); c.globalCompositeOperation = 'source-over';
      for (; i < items.length; i++) drawI(items[i]);
      { const uy = iy + rt * T * 0.45, ux = (Rr + rt * 0.9) * T, ua = fadeK * dim(X, uy, ux * 0.5) * lit; c.globalCompositeOperation = 'lighter'; c.globalAlpha = ua * 0.55; blitSized(c, glowSprite(EDGE), X - ux, uy - rt * T * 0.45, ux * 2, rt * T * 0.9); c.globalAlpha = ua * 0.4; blitSized(c, glowSprite(ACC), X - ux * 0.55, uy - rt * T * 0.2, ux * 1.1, rt * T * 0.4); c.globalCompositeOperation = 'source-over'; }
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + post * 0.35, d = Rr * (k % 2 ? 0.25 : 0.6) * T, px = X + Math.cos(a) * d, py = Y - (hcr + rt * 0.85) * T + Math.sin(a) * d * 0.4 - (k % 2 ? rt * T * 0.2 : 0), pr = rt * T * (0.95 + 0.2 * R1(seed + k)) * (0.75 + 0.25 * rise); ball(k % 2 ? B0 : B2, px, py, pr, fadeK * dim(px, py, pr), 0.85); }
      // fine sparks flickering through the layers
      c.globalCompositeOperation = 'lighter'; const bk = Math.floor(gt * 12); for (let k = 0; k < 10 + ev; k++) { const a = R1(seed + bk * 3.1 + k * 7.7) * TAU, d = (Rr + rt * (R1(seed + bk + k * 5.3) - 0.5) * 1.6) * T, hh = hcr + rt * (R1(seed + bk * 1.7 + k) - 0.5) * 1.4, gsz = T * (0.07 + 0.06 * R1(k + bk)), px = X + Math.cos(a) * d, py = Y - hh * T + Math.sin(a) * d * 0.42; c.globalAlpha = fadeK * 0.9 * lit * dim(px, py, 0); blitSized(c, glowSprite(k % 3 ? EDGE : ACC), px - gsz, py - gsz, gsz * 2, gsz * 2); }
      c.restore();
    }
    /* the timeline: the warning, the impact */
    H.X.after(TR0, () => H.X.sfx.sparkle && H.X.sfx.sparkle()); H.X.after(SE0, () => { H.X.sfx.chime && H.X.sfx.chime(); H.X.shake(2, 0.3); });
    H.X.after(ARR_END + 0.05, () => { H.X.sfx.hollow && H.X.sfx.hollow(); H.X.shake(3, 0.8); });
    H.X.after(STK - 0.4, () => H.warn(x, y, R, IMP - STK + 0.4, C.col));
    H.X.after(STK, () => { H.X.sfx.whoosh(); H.X.shake(6, 0.3); });
    H.X.after(IMP, () => {
      if (H.X.negative) H.X.negative(0.12);
      H.hitArea(x, y, R, DMG, C.dmgO({ kb: 7, stun: 0.6 }));
      H.X.flash(0.2, ACC); H.X.hitstop(0.12); H.X.sfx.crash(); H.X.shake(24 + 2 * ev, 0.55); H.X.light(x, y, R * 1.4, 0.5);
      H.X.boom(x, y, R * 0.6, EDGE, ACC, { n: 30 + 3 * ev, shake: 22, smoke: 8 });
      for (let i = 0; i < H.n(20 + 3 * ev); i++) { const b = Math.random() * TAU, v = 4 + Math.random() * 5 + 0.3 * ev; deb.push({ wx: Math.cos(b) * 0.4, wy: Math.sin(b) * 0.3, z: 0.3 + Math.random() * 0.8, vx: Math.cos(b) * v, vy: Math.sin(b) * v / GY * 0.55, vz: 3 + Math.random() * 5, g: 12, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, s: 0.09 + Math.random() * 0.13 + 0.01 * ev, age: 0, bn: 0 }); }
      for (let j = 0; j < H.n(30 + 3 * ev); j++) { const b = Math.random() * TAU, v = 5 + Math.random() * 8; H.P({ kind: 'spark', x, y: y - 0.3, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6 - 2, g: 4, life: 0.5 + Math.random() * 0.3, max: 0.8, size: 2 + Math.random() * 1.5, color: j % 3 ? EDGE : ACC }); }
      for (let j = 0; j < H.n(14); j++) { const b = Math.random() * TAU; H.P({ kind: 'shard', x: x + Math.cos(b) * 0.4, y: y - 0.3, vx: Math.cos(b) * (3 + Math.random() * 5), vy: Math.sin(b) * 2.5 - 3 - Math.random() * 3, g: 9, life: 0.7 + Math.random() * 0.4, max: 1.1, size: 3 + Math.random() * 3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, color: j % 2 ? PLUM : SMOKE }); }
      if (CEL) H.burst(x, y - 1.5, 'spark', 24, { v: 7, life: 0.6, size: 2, color: [EDGE, ACC] });
    });
    H.X.after(IMP + 0.12, () => H.X.sfx.thud()); H.X.after(IMP + 0.35, () => { H.X.sfx.hum(); H.X.shake(8, 0.4); }); H.X.after(IMP + 1.0, () => H.X.shake(3, 0.6));
    void F;
  };
})();
