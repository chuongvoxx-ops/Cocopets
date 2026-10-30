/* ---------- Ice, reworked: Frozen Swords, Let It Go (Ultimates 2 and 3) ----------
   Frozen Swords: narrow blue lines appear high over the aim; ice grows outward along each into a colossal sword, a
   translucent blade with a diamond cross-section (a lit bevel and a shaded one, deep-blue interior, sharpened edge facets,
   a brilliant central channel), a faceted crossguard with a gem, a wrapped grip and a crystal pommel; fine fragments
   orbit it while its edges finish crystallising. It hangs tip-down, draws back and plunges, stays embedded while glowing
   fractures race out beneath it and jagged ice spikes rise along them in a wave that breaks into glitter. Level 1: two
   swords, one after the other, each a crystal wave and a burst of blue light. Level 4: three larger swords in a triangle;
   their fractures join and their waves overlap. Level 7: five: four plunge round the outside, their light flows along the
   floor toward the centre where a far larger fifth hangs; it impales the ground with the widest wave, cracks from tip to
   hilt and collapses into descending shards. One cached sprite per blade style, drawn scaled.
   Let It Go: a brilliant blue point expands into a hovering orb over the aim (it follows the aim area, never the pet):
   currents of light circulate inside a translucent sphere round a white-blue core, curved faceted crystal plates on
   rotating shells round it, each facet lit by its own normal (the far plates behind the orb, dim, the near ones in
   front, lavender glints flashing as they turn). The floor freezes beneath: branching frost veins, a glassy surface, a
   low fringe of mist, a slow chill on everything on it. Rays: a bright point runs across the orb's surface toward a
   monster, gathers, and extends into an icy lance; crystals grow round the monster struck and shatter. Level 1: 5 s, one
   shell, a compact field, single staggered rays. Level 4: 8 s, two shells turning opposite ways, rays in staggered pairs,
   an intricate frost pattern over a wider field. Level 7: 12 s, a monumental orb with three transparent shells over a
   broad field, volleys of rays sweeping in sequence that leave blue paths across the floor. At its end the shell plates
   separate, the core shows, and the orb breaks into slowly turning fragments and falling snow. */
(() => {
  const U = ELEM_IMPL.ice.ult, TAU = Math.PI * 2, P = IK.P;
  let H, K;
  const cl = u => Math.max(0, Math.min(1, u)), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const outB = u => { u = cl(u); const s = 1.7, v = u - 1; return v * v * ((s + 1) * v + s) + 1; };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const mk = (w, h) => { const e = document.createElement('canvas'); e.width = w; e.height = h; return e; };
  const rgb = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  /* the pet's body on screen: a draw clipped to everything except it never covers the pet */
  const petXY = T => [H.sx(H.me.x), H.sy(H.me.y) - T * 0.46];
  function petHole(c, T) { const [x, y] = petXY(T); c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, T * 0.62, T * 0.72, 0, 0, TAU); c.clip('evenodd'); }
  /* how much a tall thing fades where it passes over the pet: its axis from (x0, y0) to (x1, y1), w its half width */
  function petFade(x0, y0, x1, y1, w, T) { const [px, py] = petXY(T), dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, u = cl(((px - x0) * dx + (py - y0) * dy) / L2), d = Math.hypot(x0 + dx * u - px, y0 + dy * u - py);
    return 0.28 + 0.72 * sm((d - w - T * 0.25) / (T * 0.7)); }
  const SPR = {};

  /* ================= the sword sprite =================
     Drawn pointing down: the pommel at the top, the tip at TIPY. A diamond-section blade: the lit left bevel, the shaded
     right bevel, sharpened edge facets inset along both edges, a deep-blue interior, glowing fractures, a brilliant
     central channel; a faceted crossguard (ornate: crystal wings and a larger gem), a wrapped grip, a crystal pommel */
  const SW = 240, SL = 432, SCX = 120, TIPY = 424, BY0 = 132, BHW = 36, GUY = 98;
  function swordSprite(orn) {
    const key = 'sw' + (orn ? 1 : 0); if (SPR[key]) return SPR[key];
    const e = mk(SW, SL), c = e.getContext('2d'); c.translate(SCX, 0); c.lineJoin = 'round'; c.lineCap = 'round';
    const y0 = BY0, tip = TIPY, hw = BHW, ys = y0 + (tip - y0) * 0.7, xs = hw * 0.88;
    const blade = () => { c.beginPath(); c.moveTo(-hw - 3, y0 - 6); c.lineTo(-hw, y0); c.lineTo(-xs, ys); c.lineTo(0, tip); c.lineTo(xs, ys); c.lineTo(hw, y0); c.lineTo(hw + 3, y0 - 6); c.closePath(); };
    blade(); c.strokeStyle = rgb(P.abyss, 0.6); c.lineWidth = 5; c.stroke();
    // the two bevels: lit left, shaded right, both translucent, meeting deep blue in the middle
    let g = c.createLinearGradient(-hw, 0, 0, 0); g.addColorStop(0, rgb(P.frost, 0.82)); g.addColorStop(0.3, rgb(P.pale, 0.62)); g.addColorStop(0.72, rgb(P.blue, 0.72)); g.addColorStop(1, rgb(P.deep, 0.88));
    c.beginPath(); c.moveTo(0, y0 - 6); c.lineTo(-hw - 3, y0 - 6); c.lineTo(-hw, y0); c.lineTo(-xs, ys); c.lineTo(0, tip); c.closePath(); c.fillStyle = g; c.fill();
    g = c.createLinearGradient(0, 0, hw, 0); g.addColorStop(0, rgb(P.abyss, 0.92)); g.addColorStop(0.35, rgb(P.deep, 0.82)); g.addColorStop(0.78, rgb(P.blue, 0.62)); g.addColorStop(1, rgb(P.ice, 0.66));
    c.beginPath(); c.moveTo(0, y0 - 6); c.lineTo(hw + 3, y0 - 6); c.lineTo(hw, y0); c.lineTo(xs, ys); c.lineTo(0, tip); c.closePath(); c.fillStyle = g; c.fill();
    c.save(); blade(); c.clip(); c.globalCompositeOperation = 'lighter';
    // light within: brighter under the guard and at the point
    g = c.createLinearGradient(0, y0, 0, tip); g.addColorStop(0, rgb(P.cyan, 0.42)); g.addColorStop(0.4, rgb(P.cyan, 0.06)); g.addColorStop(0.82, rgb(P.cyan, 0.14)); g.addColorStop(1, rgb(P.white, 0.4)); c.fillStyle = g; c.fillRect(-hw - 6, y0 - 8, hw * 2 + 12, tip - y0 + 10);
    // the sharpened edge facets
    const k = 0.62; c.beginPath(); c.moveTo(-hw - 3, y0 - 6); c.lineTo(-xs, ys); c.lineTo(0, tip); c.lineTo(0, tip - 26); c.lineTo(-xs * k, ys + 4); c.lineTo(-hw * k, y0 - 6); c.closePath(); c.fillStyle = rgb(P.frost, 0.34); c.fill();
    c.beginPath(); c.moveTo(hw + 3, y0 - 6); c.lineTo(xs, ys); c.lineTo(0, tip); c.lineTo(0, tip - 26); c.lineTo(xs * k, ys + 4); c.lineTo(hw * k, y0 - 6); c.closePath(); c.fillStyle = rgb(P.cyan, 0.16); c.fill();
    c.strokeStyle = rgb(P.white, 0.55); c.lineWidth = 1.4; c.beginPath(); c.moveTo(-hw * k, y0 - 6); c.lineTo(-xs * k, ys + 4); c.lineTo(0, tip - 26); c.stroke();
    c.strokeStyle = rgb(P.cyan, 0.5); c.beginPath(); c.moveTo(hw * k, y0 - 6); c.lineTo(xs * k, ys + 4); c.lineTo(0, tip - 26); c.stroke();
    // glowing internal fractures
    c.strokeStyle = rgb(P.cyan, 0.55); c.lineWidth = 1.3;
    for (let i = 0; i < 6; i++) { const yy = y0 + 30 + i * 44 + R1(i + (orn ? 9 : 0)) * 18, xx = (i % 2 ? 1 : -1) * hw * (0.25 + 0.3 * R1(i * 3)); c.beginPath(); c.moveTo(xx - 9, yy - 8); c.lineTo(xx, yy); c.lineTo(xx + 6, yy + 13); c.lineTo(xx - 2, yy + 22); c.moveTo(xx, yy); c.lineTo(xx + (i % 2 ? -10 : 10), yy + 4); c.stroke(); }
    // the central channel: a soft halo, a cyan groove, a white-hot line, bright nodes
    const cy1 = y0 + (tip - y0) * 0.8;
    c.strokeStyle = rgb(P.cyan, 0.3); c.lineWidth = 30; c.beginPath(); c.moveTo(0, y0 - 2); c.lineTo(0, cy1); c.stroke();
    c.strokeStyle = rgb(P.cyan, 0.6); c.lineWidth = 15; c.stroke();
    c.beginPath(); c.moveTo(-6.5, y0 - 4); c.lineTo(-2.5, cy1); c.lineTo(0, cy1 + 14); c.lineTo(2.5, cy1); c.lineTo(6.5, y0 - 4); c.closePath(); c.fillStyle = rgb(P.white, 1); c.fill();
    if (orn) { c.strokeStyle = rgb(P.lav, 0.5); c.lineWidth = 2; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 10, y0 + 6); c.lineTo(s * 8, cy1 - 40); c.stroke(); } }
    for (let i = 0; i < 4; i++) { const yy = y0 + 22 + i * (cy1 - y0 - 30) / 3; c.fillStyle = rgb(P.white, 0.7); c.beginPath(); c.arc(0, yy, 3.4, 0, TAU); c.fill(); }
    for (let i = 0; i < 14; i++) { c.fillStyle = rgb(P.white, 0.5 + 0.4 * R1(i * 7)); c.beginPath(); c.arc((R1(i * 5) - 0.5) * hw * 1.5, y0 + R1(i * 11) * (tip - y0) * 0.9, 1 + R1(i) * 1.2, 0, TAU); c.fill(); }
    c.restore();
    // the rims: a cyan edge round the blade, a white highlight down the lit edge
    blade(); c.strokeStyle = rgb(P.cyan, 0.95); c.lineWidth = 2; c.stroke();
    c.strokeStyle = rgb(P.white, 0.95); c.lineWidth = 1.6; c.beginPath(); c.moveTo(-hw - 2, y0 - 4); c.lineTo(-xs, ys); c.lineTo(-xs * 0.35, ys + (tip - ys) * 0.62); c.stroke();
    c.strokeStyle = rgb(P.white, 0.6); c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, cy1 + 10); c.lineTo(0, tip - 3); c.stroke();
    // the crossguard: faceted, its quillons swept toward the blade; an upper lit facet and a lower shaded one
    const GW = orn ? 112 : 98, gy = GUY, GT = 30;
    const gTop = [[-GW, gy + GT + 12], [-GW * 0.55, gy + 2], [-GW * 0.2, gy - 4], [0, gy - 8], [GW * 0.2, gy - 4], [GW * 0.55, gy + 2], [GW, gy + GT + 12]];
    const gMid = [[GW, gy + GT + 12], [GW * 0.6, gy + GT * 0.42], [GW * 0.22, gy + GT * 0.3], [0, gy + GT * 0.32], [-GW * 0.22, gy + GT * 0.3], [-GW * 0.6, gy + GT * 0.42], [-GW, gy + GT + 12]];
    const gBot = [[GW, gy + GT + 12], [GW * 0.55, gy + GT + 2], [GW * 0.2, gy + GT + 4], [0, gy + GT + 10], [-GW * 0.2, gy + GT + 4], [-GW * 0.55, gy + GT + 2], [-GW, gy + GT + 12]];
    const path = (A, B) => { c.beginPath(); A.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); B.forEach(p => c.lineTo(p[0], p[1])); c.closePath(); };
    if (orn) {   // crystal wings rising off the quillons
      for (const s of [-1, 1]) { const pts = [[s * GW * 0.5, gy + 4], [s * GW * 0.95, gy - 34], [s * GW * 0.78, gy + 6]]; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
        c.fillStyle = rgb(s < 0 ? P.pale : P.blue, 0.72); c.fill(); c.strokeStyle = rgb(P.abyss, 0.5); c.lineWidth = 3; c.stroke(); c.strokeStyle = rgb(P.cyan, 0.9); c.lineWidth = 1.4; c.stroke();
        c.strokeStyle = rgb(P.white, 0.8); c.lineWidth = 1.2; c.beginPath(); c.moveTo(s * GW * 0.62, gy + 3); c.lineTo(s * GW * 0.95, gy - 34); c.stroke(); }
    }
    path(gTop, gMid.slice(1, -1)); c.strokeStyle = rgb(P.abyss, 0.6); c.lineWidth = 5; c.stroke();
    path(gMid.slice().reverse(), gBot.slice(1, -1).reverse()); c.stroke();
    g = c.createLinearGradient(-GW, gy - 8, GW * 0.6, gy + GT); g.addColorStop(0, rgb(P.white, 0.92)); g.addColorStop(0.45, rgb(P.pale, 0.8)); g.addColorStop(1, rgb(P.ice, 0.75));
    path(gTop, gMid.slice(1, -1)); c.fillStyle = g; c.fill();
    g = c.createLinearGradient(-GW, gy, GW, gy + GT); g.addColorStop(0, rgb(P.pale, 0.9)); g.addColorStop(0.35, rgb(P.ice, 0.85)); g.addColorStop(0.7, rgb(P.blue, 0.88)); g.addColorStop(1, rgb(P.deep, 0.92));
    path(gMid.slice().reverse(), gBot.slice(1, -1).reverse()); c.fillStyle = g; c.fill();
    c.strokeStyle = rgb(P.abyss, 0.55); c.lineWidth = 3; c.beginPath(); gBot.forEach((p, i) => (i ? c.lineTo(p[0], p[1] - 2) : c.moveTo(p[0], p[1] - 2))); c.stroke();
    c.strokeStyle = rgb(P.white, 0.85); c.lineWidth = 1.6; c.beginPath(); gMid.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
    c.strokeStyle = rgb(P.cyan, 0.95); c.lineWidth = 1.6; c.beginPath(); gTop.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); gBot.slice().reverse().forEach(p => c.lineTo(p[0], p[1])); c.closePath(); c.stroke();
    // the gem at its heart
    const gr = orn ? 13 : 10, gc = gy + GT * 0.5;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85; c.drawImage(glowSprite(P.cyan), -gr * 2.6, gc - gr * 2.6, gr * 5.2, gr * 5.2); c.restore();
    const gem = [[0, gc - gr * 1.25], [gr, gc], [0, gc + gr * 1.25], [-gr, gc]];
    [[0, 1, P.white, 0.95], [1, 2, P.blue, 0.9], [2, 3, P.deep, 0.9], [3, 0, P.pale, 0.95]].forEach(([i, j, col, a]) => { c.beginPath(); c.moveTo(0, gc); c.lineTo(gem[i][0], gem[i][1]); c.lineTo(gem[j][0], gem[j][1]); c.closePath(); c.fillStyle = rgb(orn && col === P.blue ? P.lav : col, a); c.fill(); });
    c.beginPath(); gem.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.strokeStyle = rgb(P.cyan, 1); c.lineWidth = 1.4; c.stroke();
    // the grip: a hexagonal crystal rod, lit left, dark right, wrapped
    const gp0 = 40, gp1 = gy - 4, gw = 10;
    c.beginPath(); c.moveTo(-gw - 2, gp0); c.lineTo(gw + 2, gp0); c.lineTo(gw, gp1); c.lineTo(-gw, gp1); c.closePath(); c.strokeStyle = rgb(P.abyss, 0.6); c.lineWidth = 4; c.stroke();
    [[-gw, -gw / 3, P.pale, 0.9], [-gw / 3, gw / 3, P.ice, 0.85], [gw / 3, gw, P.deep, 0.9]].forEach(([a, b, col, al]) => { c.fillStyle = rgb(col, al); c.fillRect(a, gp0, b - a, gp1 - gp0); });
    c.strokeStyle = rgb(P.white, 0.55); c.lineWidth = 2; for (let y = gp0 + 4; y < gp1 - 2; y += 9) { c.beginPath(); c.moveTo(-gw, y); c.lineTo(gw, y + 6); c.stroke(); }
    c.strokeStyle = rgb(P.cyan, 0.9); c.lineWidth = 1.3; c.strokeRect(-gw, gp0, gw * 2, gp1 - gp0);
    // the pommel: a faceted crystal
    const pc = 24, pr = orn ? 15 : 13, pm = [[0, pc - pr * 1.3], [pr, pc], [0, pc + pr * 1.1], [-pr, pc]];
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; c.drawImage(glowSprite(P.cyan), -pr * 2.4, pc - pr * 2.4, pr * 4.8, pr * 4.8); c.restore();
    c.beginPath(); pm.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.strokeStyle = rgb(P.abyss, 0.6); c.lineWidth = 4; c.stroke();
    [[0, 1, P.pale, 0.95], [1, 2, P.deep, 0.9], [2, 3, P.blue, 0.85], [3, 0, P.white, 0.95]].forEach(([i, j, col, a]) => { c.beginPath(); c.moveTo(0, pc); c.lineTo(pm[i][0], pm[i][1]); c.lineTo(pm[j][0], pm[j][1]); c.closePath(); c.fillStyle = rgb(col, a); c.fill(); });
    c.beginPath(); pm.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.strokeStyle = rgb(P.cyan, 1); c.lineWidth = 1.4; c.stroke();
    return (SPR[key] = e);
  }
  /* a sword on the screen: tip at (x, yTip), len px long (pommel to tip), a alpha, grow 0..1 (ice growing out from its
     line), floorY (clip: nothing below the floor where it is embedded), glow 0..1 extra light in the channel */
  const SLEN = TIPY - 8;
  function drawSword(c, s, x, yTip, len, a, grow, floorY, glowK, t) {
    if (a < 0.02) return; const sc = len / SLEN, gx = 0.05 + 0.95 * outB(grow), top = yTip - len;
    c.save(); if (floorY != null) { c.beginPath(); c.rect(x - len, top - len, len * 2, floorY - top + len); c.clip(); }
    // the light round it
    K.glow(c, x, yTip - len * 0.38, len * 0.5, P.blue, 0.3 * a * grow); K.glow(c, x, yTip - len * 0.4, len * 0.3, P.cyan, 0.3 * a * grow); K.glow(c, x, yTip - len * 0.7, len * 0.3, P.cyan, 0.25 * a * grow);
    // the line it grows from
    if (grow < 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (1 - grow * 0.8); c.strokeStyle = P.blue; c.lineWidth = Math.max(2, len * 0.03); c.beginPath(); c.moveTo(x, top + len * 0.02); c.lineTo(x, yTip); c.stroke(); c.strokeStyle = P.cyan; c.lineWidth = Math.max(1, len * 0.012); c.stroke(); c.strokeStyle = P.white; c.lineWidth = 1; c.stroke();
      c.lineWidth = Math.max(1.5, len * 0.02); c.strokeStyle = P.cyan; c.beginPath(); c.moveTo(x - len * 0.17 * grow, yTip - len * 0.71); c.lineTo(x + len * 0.17 * grow, yTip - len * 0.71); c.stroke(); c.restore(); }
    if (grow > 0) { const spr = swordSprite(s.orn); c.save(); c.translate(x, yTip); c.scale(sc * gx, sc); c.globalAlpha = a * Math.min(1, grow * 3);
      if (s.pieces) drawPieces(c, s, spr); else c.drawImage(spr, -SCX, -TIPY);
      // forming: the fresh ice glows white; the channel brightens with glowK
      if (grow < 1 || glowK > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * Math.min(0.85, (1 - grow) * 0.9 + glowK * 0.15); if (!s.pieces) c.drawImage(spr, -SCX, -TIPY); }
      c.restore();
      // the channel's own light
      if (!s.pieces) H.ray(c, x, yTip - len * 0.7, Math.PI / 2, len * 0.55, len * 0.022, P.white, 0.5 * a * grow);
      if (s.crack > 0) drawCrack(c, s, x, yTip, sc, a); }
    if (glowK > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * glowK * a; c.strokeStyle = P.white; c.lineWidth = Math.max(2, len * 0.012); c.beginPath(); c.moveTo(x, yTip - len * 0.68); c.lineTo(x, yTip - len * 0.18); c.stroke(); c.restore(); K.glow(c, x, yTip - len * 0.45, len * 0.25, P.white, 0.25 * glowK * a); }
    c.restore();
  }
  /* the giant's crack: a jagged line running from the floor up to the pommel, branches toward the edges (sprite space) */
  function makeCrack(seed) { const pts = [], br = []; let x = 0; for (let i = 0; i <= 18; i++) { const y = TIPY - 20 - i * (TIPY - 40) / 18; x = Math.max(-14, Math.min(14, x + (R1(seed + i) - 0.5) * 16)); pts.push([x, y]); if (i % 3 === 1) { const s = i % 2 ? 1 : -1; br.push([i, [x + s * (8 + R1(i * 3) * 10), y - 10], [x + s * (14 + R1(i * 5) * 9), y - 22]]); } } return { pts, br }; }
  function drawCrack(c, s, x, yTip, sc, a) {
    const cr = s.crackP, n = cr.pts.length, u = s.crack * (n - 1); if (s.pieces) a *= 1 - cl(s.pieceT / 0.2); if (a < 0.02) return; c.save(); c.translate(x, yTip); c.scale(sc, sc); c.translate(-0, -TIPY); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
    const line = (w, col, al) => { c.globalAlpha = al * a; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(cr.pts[0][0], cr.pts[0][1]); for (let i = 1; i <= Math.min(n - 1, Math.ceil(u)); i++) { const k = Math.min(1, u - (i - 1)); c.lineTo(lerp(cr.pts[i - 1][0], cr.pts[i][0], k), lerp(cr.pts[i - 1][1], cr.pts[i][1], k)); } for (const b of cr.br) { if (b[0] > u) continue; c.moveTo(cr.pts[b[0]][0], cr.pts[b[0]][1]); c.lineTo(b[1][0], b[1][1]); c.lineTo(b[2][0], b[2][1]); } c.stroke(); };
    line(9, P.cyan, 0.35); line(3.5, P.white, 0.95);
    // the bright point racing up
    if (s.crack < 1) { const i = Math.min(n - 1, Math.floor(u)), p = cr.pts[i]; c.globalAlpha = a; c.drawImage(glowSprite(P.white), p[0] - 22, p[1] - 22, 44, 44); }
    c.restore();
  }
  /* the giant breaking: pieces between jagged cut lines across the blade, each falling, drifting and turning */
  function makePieces(seed) { const cuts = []; const NC = 7; for (let k = 0; k <= NC; k++) { const y = k === 0 ? -10 : k === NC ? TIPY + 10 : 40 + (TIPY - 60) * k / NC; const row = []; for (let j = 0; j <= 4; j++) row.push([-SCX + j * SW / 4, y + (k === 0 || k === NC ? 0 : (R1(seed + k * 7 + j) - 0.5) * 34)]); cuts.push(row); }
    const out = []; for (let k = 0; k < NC; k++) out.push({ a: cuts[k], b: cuts[k + 1], vx: (R1(seed + k) - 0.5) * 60, vr: (R1(seed * 2 + k) - 0.5) * 1.2, dl: (NC - 1 - k) * 0.035 + R1(k * 3) * 0.05, cy: (cuts[k][2][1] + cuts[k + 1][2][1]) / 2 }); return out; }
  /* each piece cut out of the sprite once (its broken edges lit), then only drawn: no clipping per frame */
  function pieceImgs(s, spr) { for (const p of s.pieces) { if (p.img) continue; const e = mk(SW, SL), c = e.getContext('2d'), row = (r, i) => r.forEach((q, j) => (j ? c.lineTo(q[0] + SCX, q[1]) : (i ? c.lineTo(q[0] + SCX, q[1]) : c.moveTo(q[0] + SCX, q[1]))));
      c.save(); c.beginPath(); row(p.a, 0); row(p.b.slice().reverse(), 1); c.closePath(); c.clip(); c.drawImage(spr, 0, 0); c.restore();
      c.globalCompositeOperation = 'source-atop'; c.lineJoin = 'round'; for (const [w, col] of [[9, rgb(P.cyan, 0.8)], [3, rgb(P.white, 1)]]) { c.strokeStyle = col; c.lineWidth = w; for (const r of [p.a, p.b]) { c.beginPath(); row(r, 0); c.stroke(); } }
      p.img = e; } }
  function drawPieces(c, s, spr) {
    pieceImgs(s, spr); const u = s.pieceT; for (const p of s.pieces) { const tt = Math.max(0, u - p.dl), al = 1 - sm((tt - 0.25) / 0.85); if (al < 0.02) continue; c.save(); c.globalAlpha *= al;
      c.translate(p.vx * tt, 140 * tt * tt + 20 * tt); c.translate(0, p.cy - TIPY); c.rotate(p.vr * tt); c.translate(0, -(p.cy - TIPY));
      c.drawImage(p.img, -SCX, -TIPY); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= 0.3 + 0.4 * cl(1 - tt * 2); c.drawImage(p.img, -SCX, -TIPY); c.restore(); }
  }

  /* ================= 2. Frozen Swords ================= */
  U.frozenswords = (C, h) => {
    H = h; K = IK.bind(H); const me = H.me, ev = K.evo(C), L = K.lv(C, [1, 4, 7]), a0 = C.a, ca = Math.cos(a0), sa = Math.sin(a0);
    const TOT = C.base * C.K * K.evoK(C) * 14, grow = 1 + 0.04 * (ev - L);
    // the centre of the aim, kept off the pet
    let cx = C.tx, cy = C.ty; { const d = Math.hypot(cx - me.x, cy - me.y); if (d < 2.6) { cx = me.x + ca * 2.8; cy = me.y + sa * 2.8; } const w = H.walk(cx, cy); cx = w.x; cy = w.y; }
    const away = (x, y, r) => { const d = Math.hypot(x - me.x, y - me.y) || 1; if (d < r) { x = me.x + (x - me.x) / d * r; y = me.y + (y - me.y) / d * r; } return [x, y]; };
    const S = [];
    const sword = (x, y, o) => { [x, y] = away(x, y, 1.7); S.push(Object.assign({ x, y, i: S.length, len: 3.3, zh: 1.9, tl: 0, tf: 1.1, fall: 0.17, gd: 0.7, emb: 1.0, Lw: 2.6, nl: 7, ns: 3, imp: 1.1, share: 0.5, orn: false, z: 0, a: 0, gr: 0, st: 'wait', hits: new Set(), sp: [], fr: [], seed: R1(S.length * 3.1 + x) * 100 }, o)); };
    if (L === 1) {
      // the target, then the next monster near it (else beside it)
      const near = H.sortNear(cx, cy).filter(m => Math.hypot(m.x - cx, m.y - cy) > 1.8 && Math.hypot(m.x - cx, m.y - cy) < 3.6);
      const p2 = near[0] ? [near[0].x, near[0].y] : [cx - sa * 1.8, cy + ca * 1.8];
      sword(cx, cy, { len: 3.7 * grow, zh: 1.5, tl: 0, tf: 1.1 }); sword(p2[0], p2[1], { len: 3.7 * grow, zh: 1.5, tl: 0.3, tf: 1.7 });
    } else if (L === 4) {
      for (let i = 0; i < 3; i++) { const b = a0 + i / 3 * TAU, r = 1.65; sword(cx + Math.cos(b) * r, cy + Math.sin(b) * r, { len: 4.2 * grow, zh: 1.6, tl: i * 0.15, tf: 1.25 + i * 0.36, Lw: 2.9, nl: 8, imp: 1.25, share: 1 / 3, emb: 1.3 - i * 0.2 }); }
    } else {
      for (let i = 0; i < 4; i++) { const b = a0 + Math.PI / 4 + i / 4 * TAU, r = 2.5; sword(cx + Math.cos(b) * r, cy + Math.sin(b) * r, { len: 3.9, zh: 1.5, tl: i * 0.12, tf: 1.3 + i * 0.22, Lw: 2.2, nl: 6, imp: 1.1, share: 0.13, emb: 0.5 }); }
      sword(cx, cy, { len: 6.6, zh: 1.9, tl: 0.35, gd: 1.5, tf: 3.2, fall: 0.24, Lw: 4.9, nl: 12, ns: 5, imp: 1.7, share: 0.48, orn: true, giant: true, emb: 0.55 });
      S[4].x = cx; S[4].y = cy;
    }
    const G = S.find(s => s.giant);
    for (const s of S) {
      // its fractures and the spikes that rise along them (world positions), its orbiting fragments
      for (let j = 0; j < s.nl; j++) { const b = j / s.nl * TAU + R1(s.seed + j) * 0.5, pts = [[0, 0]]; let bb = b, d = 0, px = 0, py = 0; const seg = 6;
        for (let k = 1; k <= seg; k++) { bb += (R1(s.seed + j * 13 + k) - 0.5) * 0.6; const st = s.Lw * (0.85 + 0.15 * R1(j + s.seed)) / seg; px += Math.cos(bb) * st; py += Math.sin(bb) * st; d += st; pts.push([px, py, d]); }
        s.fr.push(pts);
        for (let k = 0; k < s.ns; k++) { const u = (k + 0.7) / (s.ns + 0.2), q = pts[Math.min(seg, Math.round(u * seg))], hk = [1.0, 0.8, 0.62, 0.5, 0.42][k] * (s.giant ? 1.25 : L === 4 ? 1.05 : 0.95); s.sp.push({ x: s.x + q[0], y: s.y + q[1], d: q[2], b: Math.atan2(q[1], q[0]), hq: hk, sd: (s.seed + j * 5 + k) | 0, hold: 0.32 + R1(j * 3 + k) * 0.18, broke: false }); }
      }
      if (s.giant) { s.crackP = makeCrack(s.seed); s.crack = 0; }
      H.warn(s.x, s.y, s.imp, s.tf + s.fall, C.col);
    }
    const last = Math.max(...S.map(s => s.tf + s.fall + (s.giant ? 3.0 : s.emb + 0.7)), G ? G.tf + G.fall + 1.6 : 0);
    H.X.banner('FROZEN SWORDS', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.4;
    let crackT = 0;
    const impact = s => {
      s.st = 'emb'; s.ti = s.tf + s.fall; const r = s.imp, big = s.giant ? 1.6 : 1;
      H.hitArea(s.x, s.y, r, TOT * s.share * 0.6, C.dmgO({ freeze: s.giant ? 2 : 1.2, kb: 0 }));
      H.X.light(s.x, s.y, 3.2 * big, 0.4); H.X.ring(s.x, s.y, 0.2, 2.6 * big, 0.45, P.cyan, 0.32); 
      H.X.flash(s.giant ? 0.3 : 0.18, P.cyan); H.X.shake(s.giant ? 16 : 8, s.giant ? 0.45 : 0.25); H.X.hitstop(s.giant ? 0.08 : 0.04); H.X.sfx.crash(); if (s.giant) H.X.sfx.thud();
      K.glitter(s.x, s.y - 0.2, H.n(18 * big), 6 * big); K.fragments(s.x, s.y - 0.2, H.n(12 * big), 6 * big); K.snow(s.x, s.y - 0.3, H.n(10 * big), { v: 2.5 });
      H.glowAt(s.x, s.y - 0.3, 2.6 * big, 0.5, P.blue, 0.8); H.glowAt(s.x, s.y - 0.3, 1.4 * big, 0.35, P.cyan, 0.8);
    };
    H.add({ life: last, S,
      update(dt, f) {
        const t = f.t; crackT -= dt;
        if (t < 0.6) K.aura(me.x, me.y, 0.7, dt, 14, 0.4);
        f.lt = (f.lt || 0) - dt; if (f.lt <= 0) { f.lt = 0.12; for (const s of S) if (t >= s.tl && s.a > 0.1 && !s.pieces) H.X.light(s.x, s.y - Math.max(0, s.z) - s.len * 0.5, s.len * 0.7, 0.26); }
        for (const s of S) {
          const tg = t - s.tl;
          if (tg < 0) continue;
          s.gr = cl((tg - 0.22) / s.gd); s.a = Math.min(1, tg / 0.2);
          if (s.st === 'wait') { s.st = 'grow'; H.X.sfx.sparkle(); }
          if (t < s.tf - 0.18) { s.z = s.zh + 0.06 * Math.sin(t * 3 + s.i) + (1 - sm(s.gr)) * 0.3; if (s.gr > 0 && s.gr < 1) K.aura(s.x, s.y, 0.35, dt, s.giant ? 30 : 14, s.zh + s.len * (0.3 + Math.random() * 0.5)); }
          else if (t < s.tf) s.z = s.zh + 0.3 * sm((t - s.tf + 0.18) / 0.18);   // draws back
          else if (t < s.tf + s.fall) { if (s.st !== 'fall') { s.st = 'fall'; H.X.sfx.whoosh(); } const u = (t - s.tf) / s.fall; s.z = lerp(s.zh + 0.3, -s.len * 0.2, u * u * u); }
          else { if (s.st === 'fall' || s.st === 'grow') impact(s); s.z = -s.len * 0.2;
            const tau = t - s.ti, rf = s.Lw * (1 - Math.pow(1 - cl(tau / (s.giant ? 0.8 : 0.6)), 2));
            // the wave: the spikes rise as the front passes and break into glitter; it strikes once each monster it reaches
            if (tau < 1.3) for (const m of H.living()) { if (s.hits.has(m)) continue; const d = Math.hypot(m.x - s.x, m.y - s.y); if (d < rf + m.r && d > rf - 0.9 - m.r) { s.hits.add(m); H.X.hitMon(m, TOT * s.share * 0.4, C.dmgO({ freeze: 0.8, kb: 0.6 })); K.shatterAt(m.x, m.y - 0.3, 0.6); if (crackT <= 0) { H.X.sfx.crack(); crackT = 0.08; } } }
            for (const p of s.sp) if (!p.broke && rf >= p.d && tau - (p.d / s.Lw) * (s.giant ? 0.5 : 0.4) > p.hold + 0.12) { p.broke = true; if (Math.random() < 0.7) { K.glitter(p.x, p.y - 0.3, H.n(4), 3); K.fragments(p.x, p.y - 0.25, H.n(2), 3); } }
            if (s.giant) {   // it cracks from tip to hilt, then collapses into descending shards
              s.crack = cl((tau - 0.75) / 0.65); if (s.crack > 0 && !s.crackS) { s.crackS = true; H.X.sfx.crack(); }
              if (tau > 1.45) { if (!s.pieces) { s.pieces = makePieces(s.seed); s.pieceT = 0; H.X.sfx.crash(); H.X.shake(6, 0.3); for (let k = 0; k < 6; k++) K.fragments(s.x + (Math.random() - 0.5), s.y - 0.5 - Math.random() * 3, H.n(5), 3); } s.pieceT = tau - 1.45;
                if (Math.random() < 0.6 * H.Q()) K.snow(s.x + (Math.random() - 0.5) * 1.2, s.y - 1 - Math.random() * 3.5, 2, { v: 0.6, g: 1.5, life: 1.4 }); }
            } else if (tau > (G ? Math.max(s.emb, G.tf + G.fall + 0.9 - s.ti) : s.emb)) { if (!s.diss) { s.diss = true; s.td = t; K.glitter(s.x, s.y - 1, H.n(10), 3, { up: 3, g: 1 }); } s.a = 1 - sm((t - s.td) / 0.6); if (Math.random() < 0.5 * H.Q()) K.snow(s.x, s.y - Math.random() * s.len * 0.8, 1, { v: 0.6, up: 0.8, g: -0.3 }); }
          }
        }
      },
      drawUnder(c, f, X0, Y0, T) {
        const t = f.t; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        // where each will land: a cold light that gathers as it hangs
        for (const s of S) {
          const X = H.sx(s.x), Y = H.sy(s.y), tg = t - s.tl; if (tg < 0) continue;
          if (s.st !== 'emb') { K.floorLight(c, X, Y, T * s.imp * (0.6 + 0.6 * s.gr), 0.25 + 0.35 * s.gr * (s.st === 'fall' ? 1.5 : 1), P.blue); continue; }
          const tau = t - s.ti, fl = s.diss ? s.a : s.pieces ? 1 - cl(s.pieceT / 1.0) : 1, rf = s.Lw * (1 - Math.pow(1 - cl(tau / (s.giant ? 0.8 : 0.6)), 2));
          // the burst of blue light and the glassy pool where it went in
          K.floorLight(c, X, Y, T * s.imp * 2.2 * (s.giant ? 1.3 : 1), 0.6 * Math.exp(-tau * 2.5) + 0.15 * fl, P.blue);
          K.frozenPool(c, X, Y, T * s.imp * (0.9 + 0.3 * cl(tau * 3)), 0.5 * fl, t);
          // the glowing fractures racing out
          const fa = fl * (0.45 + 0.55 * Math.exp(-tau * 1.5));
          for (const pts of s.fr) { c.beginPath(); c.moveTo(X, Y); let i = 1; for (; i < pts.length && pts[i][2] <= rf; i++) c.lineTo(X + pts[i][0] * T, Y + pts[i][1] * T * H.GY); if (i < pts.length) { const q0 = pts[i - 1], q1 = pts[i], k = cl((rf - q0[2]) / (q1[2] - q0[2])); c.lineTo(X + lerp(q0[0], q1[0], k) * T, Y + lerp(q0[1], q1[1], k) * T * H.GY); }
            c.globalAlpha = 0.35 * fa; c.strokeStyle = P.blue; c.lineWidth = T * 0.16; c.stroke(); c.globalAlpha = 0.7 * fa; c.strokeStyle = P.cyan; c.lineWidth = T * 0.06; c.stroke(); c.globalAlpha = 0.9 * fa; c.strokeStyle = P.white; c.lineWidth = Math.max(1, T * 0.022); c.stroke(); }
          // the wave front: a ring of cold light on the floor
          if (tau < (s.giant ? 0.95 : 0.75)) { const ra = 1 - cl(tau / (s.giant ? 0.95 : 0.75)); c.globalAlpha = 0.45 * ra; c.strokeStyle = P.cyan; c.lineWidth = T * 0.22; H.floorEllipse(c, X, Y, rf * T); c.stroke(); c.globalAlpha = 0.8 * ra; c.strokeStyle = P.white; c.lineWidth = Math.max(1, T * 0.04); c.stroke(); }
        }
        // Adept: the fractures join between the blades; Celestial: light flows along the floor from the four to the centre
        if (L === 4) { for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) { const p = S[i], q = S[j]; if (p.st !== 'emb' || q.st !== 'emb') continue; const tj = t - Math.max(p.ti, q.ti), u = sm(tj / 0.35), al = Math.min(p.a, q.a) * (0.5 + 0.5 * Math.exp(-tj * 2));
            const x0 = H.sx(p.x), y0 = H.sy(p.y), x1 = H.sx(q.x), y1 = H.sy(q.y), mx = (x0 + x1) / 2 + (R1(i + j) - 0.5) * T * 0.6, my = (y0 + y1) / 2 + (R1(i * j + 2) - 0.5) * T * 0.4;
            c.beginPath(); c.moveTo(x0, y0); c.lineTo(lerp(x0, mx, cl(u * 2)), lerp(y0, my, cl(u * 2))); if (u > 0.5) c.lineTo(lerp(mx, x1, u * 2 - 1), lerp(my, y1, u * 2 - 1)); c.moveTo(x1, y1); c.lineTo(lerp(x1, mx, cl(u * 2)), lerp(y1, my, cl(u * 2)));
            c.globalAlpha = 0.4 * al; c.strokeStyle = P.blue; c.lineWidth = T * 0.2; c.stroke(); c.globalAlpha = 0.85 * al; c.strokeStyle = P.cyan; c.lineWidth = T * 0.07; c.stroke(); c.globalAlpha = al; c.strokeStyle = P.white; c.lineWidth = Math.max(1, T * 0.025); c.stroke();
            const k = (t * 1.6 + i * 0.3) % 1; K.glow(c, lerp(x0, x1, k), lerp(y0, y1, k), T * 0.4, P.white, 0.5 * al * u); } }
        if (G) { const gx = H.sx(G.x), gy = H.sy(G.y);
          for (const s of S) { if (s === G || s.st !== 'emb') continue; const tj = t - s.ti, fl = G.st === 'emb' ? Math.exp(-(t - G.ti) * 2) : 1, u = sm(tj / 0.4), al = fl * s.a; if (al < 0.02) continue;
            const x0 = H.sx(s.x), y0 = H.sy(s.y), x1 = lerp(x0, gx, u), y1 = lerp(y0, gy, u);
            c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.globalAlpha = 0.4 * al; c.strokeStyle = P.blue; c.lineWidth = T * 0.24; c.stroke(); c.globalAlpha = 0.8 * al; c.strokeStyle = P.cyan; c.lineWidth = T * 0.08; c.stroke(); c.globalAlpha = al; c.strokeStyle = P.white; c.lineWidth = Math.max(1, T * 0.025); c.stroke();
            for (let k = 0; k < 3; k++) { const v = ((t - s.ti) * 1.3 + k / 3) % 1; if (v > u) continue; K.glow(c, lerp(x0, gx, v), lerp(y0, gy, v), T * (0.35 + 0.25 * v), P.white, 0.7 * al); K.glow(c, lerp(x0, gx, v), lerp(y0, gy, v), T * 0.8, P.cyan, 0.3 * al); } }
          const nIn = S.filter(s => s !== G && s.st === 'emb').length; if (G.st !== 'emb' && nIn) K.floorLight(c, gx, gy, T * (1.2 + 0.5 * nIn), 0.25 * nIn, P.cyan);
        }
        c.restore();
      },
      draw(c, f, X0, Y0, T) {
        const t = f.t; c.save(); petHole(c, T); const items = [];
        for (const s of S) {
          const tg = t - s.tl; if (tg < 0 || s.a < 0.02) continue;
          const X = H.sx(s.x), Y = H.sy(s.y), len = s.len * T, yTip = Y - s.z * T;
          // the spikes of its wave
          if (s.st === 'emb') { const tau = t - s.ti, rf = s.Lw * (1 - Math.pow(1 - cl(tau / (s.giant ? 0.8 : 0.6)), 2));
            for (const p of s.sp) { if (rf < p.d) continue; const age = tau - (p.d / s.Lw) * (s.giant ? 0.5 : 0.4); if (age < 0 || age > p.hold + 0.3) continue; const gU = outB(age / 0.14), al = 1 - cl((age - p.hold) / 0.3), x = H.sx(p.x), y = H.sy(p.y);
              const hp = Math.round(p.hq * 4) / 4 * T, pf = petFade(x, y, x, y - hp, hp * 0.2, T); items.push({ y, f() { K.floorLight(c, x, y, hp * 0.7, 0.3 * al * pf, P.cyan); c.save(); c.translate(x, y); c.scale(1, gU); K.shard(c, 0, 0, Math.round(hp * 0.46), hp, -Math.PI / 2 + Math.cos(p.b) * 0.45, p.sd, al * pf, t); c.restore(); } }); } }
          const pf = petFade(X, yTip - len, X, Math.min(yTip, Y), len * 0.12, T), glowK = s === G ? cl(S.filter(q => q !== G && q.st === 'emb').length / 4) * (G.st === 'emb' ? Math.exp(-(t - G.ti) * 3) : 1) : 0;
          items.push({ y: Y + 0.01, f() {
            // fragments orbiting while it crystallises
            const ob = s.st === 'grow' || (s.st !== 'emb' && t < s.tf) ? 1 - cl((t - s.tf + 0.4) / 0.4) : 0;
            const orb = (back) => { if (ob < 0.02) return; const n = s.giant ? 10 : 6; for (let k = 0; k < n; k++) { const ph = t * (1.6 + 0.3 * (k % 3)) + k / n * TAU, dz = Math.sin(ph); if ((dz < 0) !== back) continue; const ox = Math.cos(ph) * len * 0.3, oy = yTip - len * (0.15 + 0.6 * R1(k + s.i * 7)) + dz * len * 0.04, w = len * (0.03 + 0.015 * (k % 2)); K.shard(c, X + ox, oy, Math.round(w), Math.round(w * 2.6), ph * 2, k, ob * pf * (back ? 0.5 : 0.9) * sm(s.gr * 2)); } };
            orb(true);
            drawSword(c, s, X, yTip, len, s.a * pf, s.gr, s.st === 'emb' ? Y + T * 0.05 : null, glowK, t);
            orb(false);
            if (s.st === 'emb' && !s.pieces) { const tau = t - s.ti; K.glow(c, X, Y, T * s.imp * 1.2, P.cyan, s.a * pf * (0.2 + 0.4 * Math.exp(-tau * 4))); K.glow(c, X, Y - T * 0.1, T * 0.5, P.white, s.a * pf * 0.5 * Math.exp(-tau * 5)); }
            if (s.st === 'fall') { H.ray(c, X, yTip - len * 1.75, Math.PI / 2, len * 0.95, len * 0.09, P.cyan, 0.55 * pf); K.glow(c, X, yTip, T * 0.7, P.white, 0.7 * pf); }
          } });
        }
        items.sort((p, q) => p.y - q.y); for (const it of items) it.f();
        c.restore();
      },
    });
  };

  /* ================= the orb's sprites ================= */
  /* the translucent sphere: a pale lit cap toward the upper left, a deep-blue interior, a bright fresnel rim */
  function orbSprite() {
    if (SPR.orb) return SPR.orb; const S = 256, e = mk(S, S), c = e.getContext('2d'), o = S / 2, r = S * 0.47;
    let g = c.createRadialGradient(o - r * 0.3, o - r * 0.34, r * 0.05, o, o, r); g.addColorStop(0, rgb(P.frost, 0.9)); g.addColorStop(0.2, rgb(P.ice, 0.7)); g.addColorStop(0.5, rgb(P.blue, 0.68)); g.addColorStop(0.85, rgb(P.deep, 0.8)); g.addColorStop(1, rgb(P.abyss, 0.85));
    c.fillStyle = g; c.beginPath(); c.arc(o, o, r, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter';
    g = c.createRadialGradient(o, o, r * 0.7, o, o, r); g.addColorStop(0, rgb(P.cyan, 0)); g.addColorStop(0.8, rgb(P.cyan, 0.35)); g.addColorStop(1, rgb(P.pale, 0.9)); c.fillStyle = g; c.beginPath(); c.arc(o, o, r, 0, TAU); c.fill();
    c.strokeStyle = rgb(P.white, 0.6); c.lineWidth = r * 0.05; c.lineCap = 'round'; c.beginPath(); c.arc(o, o, r * 0.88, 3.5, 4.6); c.stroke();
    c.fillStyle = rgb(P.white, 0.85); c.beginPath(); c.ellipse(o - r * 0.42, o - r * 0.46, r * 0.14, r * 0.08, -0.7, 0, TAU); c.fill();
    c.globalCompositeOperation = 'source-over'; c.strokeStyle = rgb(P.cyan, 0.9); c.lineWidth = 2.5; c.beginPath(); c.arc(o, o, r - 1, 0, TAU); c.stroke();
    return (SPR.orb = e);
  }
  /* the currents inside: bands of light that circulate like water under ice (drawn turning, clipped to the sphere) */
  function currentSprite(k) {
    const key = 'cur' + k; if (SPR[key]) return SPR[key]; const S = 256, e = mk(S, S), c = e.getContext('2d'), o = S / 2; c.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const ph = R1(i + k * 11) * TAU, rr = S * (0.12 + 0.05 * i), wv = 0.25 + 0.2 * R1(i * 3 + k); c.beginPath();
      for (let j = 0; j <= 40; j++) { const b = ph + j / 40 * Math.PI * (1 + R1(i + k)), r2 = rr * (1 + wv * Math.sin(b * 3 + i)); const x = o + Math.cos(b) * r2, y = o + Math.sin(b) * r2 * 0.8; j ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.strokeStyle = rgb(i % 3 === 0 ? P.white : P.cyan, 0.25); c.lineWidth = 9; c.stroke(); c.strokeStyle = rgb(i % 3 === 0 ? P.white : P.pale, 0.6); c.lineWidth = 2.5; c.stroke(); }
    return (SPR[key] = e);
  }
  /* an intricate frost pattern for the floor: six dendritic arms with branches, hexagonal rings (light only) */
  function frostSprite(k) {
    const key = 'frost' + k; if (SPR[key]) return SPR[key]; const S = 512, e = mk(S, S), c = e.getContext('2d'), o = S / 2, R = S * 0.48; c.lineCap = 'round'; c.lineJoin = 'round';
    const arm = (x, y, b, L, w, d) => { const x2 = x + Math.cos(b) * L, y2 = y + Math.sin(b) * L; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); if (d <= 0) return;
      for (let j = 1; j <= 3; j++) { const u = j / 4, px = x + Math.cos(b) * L * u, py = y + Math.sin(b) * L * u, l2 = L * (0.42 - u * 0.12); arm(px, py, b + 1.05, l2, w * 0.65, d - 1); arm(px, py, b - 1.05, l2, w * 0.65, d - 1); } };
    for (let pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? rgb(P.white, 0.75) : rgb(P.cyan, 0.3); const wk = pass ? 1 : 3.2;
      for (let i = 0; i < 6; i++) arm(o, o, i / 6 * TAU + k * 0.5, R * 0.96, 2.6 * wk, 2);
      for (const rr of [0.34, 0.62, 0.86]) { c.lineWidth = 1.4 * wk; c.beginPath(); for (let i = 0; i <= 6; i++) { const b = i / 6 * TAU + Math.PI / 6 + k * 0.5; i ? c.lineTo(o + Math.cos(b) * R * rr, o + Math.sin(b) * R * rr) : c.moveTo(o + Math.cos(b) * R * rr, o + Math.sin(b) * R * rr); } c.stroke(); } }
    return (SPR[key] = e);
  }

  /* the shells' plates: curved crystal plates on a unit sphere, each a 3x3 grid bulging at its middle (4 flat facets) */
  function shellGeom(rows, n, wl, wp, off) { const plates = []; rows.forEach((lat, ri) => { for (let i = 0; i < n; i++) { const lc = (i + (ri % 2) * 0.5) / n * TAU + (off || 0), g = [];
    for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) { const pin = (j !== 1 && k !== 1) ? 0.72 : 1, lo = lc + (k - 1) * wl * pin, la = lat + (j - 1) * wp * pin, r = 1 + (j === 1 && k === 1 ? 0.07 : (j === 1 || k === 1) ? 0.035 : 0); g.push([Math.cos(la) * Math.cos(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.sin(lo) * r]); }
    plates.push(g); } }); return plates; }
  const LD = (() => { const v = [-0.45, 0.62, 0.64], l = Math.hypot(...v); return v.map(x => x / l); })(), HV = (() => { const v = [LD[0], LD[1], LD[2] + 1], l = Math.hypot(...v); return v.map(x => x / l); })();
  const C_DEEP = [30, 79, 160], C_ICE = [127, 200, 240], C_FROST = [232, 251, 255];
  const shadeCol = (b, a) => { const A = b < 0.5 ? C_DEEP : C_ICE, B = b < 0.5 ? C_ICE : C_FROST, k = b < 0.5 ? b * 2 : b * 2 - 2 + 1; return `rgba(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(A[2] + (B[2] - A[2]) * k)},${a})`; };
  const QUADS = [[0, 1, 4, 3], [1, 2, 5, 4], [3, 4, 7, 6], [4, 5, 8, 7]], RIM = [0, 1, 2, 5, 8, 7, 6, 3];
  /* a shell's rotation: spin th about its own axis, tilted by al about x and be about z */
  function rotM(th, al, be) { const c1 = Math.cos(th), s1 = Math.sin(th), c2 = Math.cos(al), s2 = Math.sin(al), c3 = Math.cos(be), s3 = Math.sin(be);
    return p => { let x = p[0] * c1 + p[2] * s1, y = p[1], z = -p[0] * s1 + p[2] * c1; let y2 = y * c2 - z * s2, z2 = y * s2 + z * c2; return [x * c3 - y2 * s3, x * s3 + y2 * c3, z2]; }; }

  /* ================= 3. Let It Go ================= */
  U.letitgo = (C, h) => {
    H = h; K = IK.bind(H); const me = H.me, ev = K.evo(C), L = K.lv(C, [1, 4, 7]), gk = 1 + 0.04 * (ev - L);
    const DUR = L === 7 ? 12 : L === 4 ? 8 : 5, R = (L === 7 ? 1.5 : L === 4 ? 1.12 : 0.92) * gk, Z = L === 7 ? 3.5 : L === 4 ? 2.9 : 2.55, RF = (L === 7 ? 4.6 : L === 4 ? 3.3 : 2.3) * gk;
    const T1 = C.base * C.K * K.evoK(C) * 14, TOT = T1 * Math.pow(DUR / 5, 0.85), END = DUR, LIFE = DUR + 1.9;   /* (its total grows with its duration, so it never weakens per second) */
    const SH = L === 7 ? [{ r: 1.28, rows: [-0.5, 0.5], n: 5, wl: 0.42, wp: 0.36, al: 0.55, be: 0.35, w: 0.8, op: 0.75 }, { r: 1.52, rows: [-0.42, 0.42], n: 6, wl: 0.33, wp: 0.3, al: -0.75, be: -0.25, w: -0.6, op: 0.6 }, { r: 1.78, rows: [0], n: 8, wl: 0.27, wp: 0.34, al: 1.15, be: 0.6, w: 0.45, op: 0.5 }]
      : L === 4 ? [{ r: 1.3, rows: [-0.5, 0.5], n: 5, wl: 0.42, wp: 0.38, al: 0.5, be: 0.3, w: 0.9, op: 0.85 }, { r: 1.58, rows: [0], n: 7, wl: 0.32, wp: 0.42, al: -0.9, be: -0.35, w: -0.7, op: 0.75 }]
      : [{ r: 1.34, rows: [-0.5, 0.5], n: 5, wl: 0.44, wp: 0.4, al: 0.5, be: 0.3, w: 0.9, op: 0.9 }];
    SH.forEach((s, i) => { s.g = shellGeom(s.rows, s.n, s.wl, s.wp, i * 0.7); });
    // the rays' schedule: single, staggered pairs, or sweeping volleys of four
    const sched = []; { const step = L === 7 ? 0.85 : L === 4 ? 0.62 : 0.42, offs = L === 7 ? [0, 0.09, 0.18, 0.27] : L === 4 ? [0, 0.15] : [0]; let v = 0; for (let t = 1.0; t < END - 0.75; t += step, v++) offs.forEach((o, j) => sched.push({ t: t + o, v, j, nj: offs.length })); }
    const BURST = T1 * 0.15 * (L === 7 ? 1.3 : L === 4 ? 1.15 : 1), RAY = (TOT - BURST) / sched.length;
    // where it hangs: over the aim, kept so neither it nor its field's middle sits on the pet
    const place = (x, y) => { for (let k = 0; k < 2; k++) { let d = Math.hypot(x - me.x, y - me.y) || 1; if (d < 2.4) { x = me.x + (x - me.x) / d * 2.4; y = me.y + (y - me.y) / d * 2.4; }
      const ox = x, oy = y - Z, px = me.x, py = me.y - 0.5, dd = Math.hypot(ox - px, oy - py) || 1, need = R * SH[SH.length - 1].r + 0.9; if (dd < need) { x += (ox - px) / dd * (need - dd); y += (oy - py) / dd * (need - dd); } } return [x, y]; };
    const [x0, y0] = place(C.tx, C.ty);
    const rays = [], blooms = [], paths = [], frags = []; let si = 0, vTargets = null, vIdx = -1, slowT = 0, broke = false, crackT = 0;
    H.X.banner('LET IT GO', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.4;
    const F = H.add({ life: LIFE, x: x0, y: y0, ox: x0, oy: y0, fx0: x0, fy0: y0,
      update(dt, f) {
        const t = f.t; crackT -= dt;
        // follow the aim area: the monster the pet aims at and those round it
        if (t < END) { const tg = H.X.nearestMon(me.x, me.y, 9, null, true); if (tg) { let sx = 0, sy = 0, n = 0; for (const m of H.near(tg.x, tg.y, 2.2)) { sx += m.x; sy += m.y; n++; } const [dx, dy] = place(n ? sx / n : tg.x, n ? sy / n : tg.y), d = Math.hypot(dx - f.ox, dy - f.oy), st = Math.min(d, 2.2 * dt); if (d > 0.05) { f.ox += (dx - f.ox) / d * st; f.oy += (dy - f.oy) / d * st; } } }
        f.x = f.ox; f.y = f.oy; const k = 1 - Math.exp(-dt * 1.5); f.fx0 += (f.ox - f.fx0) * k; f.fy0 += (f.oy - f.fy0) * k;
        // the frozen field: everything on it slows
        slowT -= dt; if (t > 0.4 && t < END && slowT <= 0) { slowT = 0.3; for (const m of H.near(f.fx0, f.fy0, RF * 0.95)) H.slow(m, 0.8); }
        if (t < END) K.aura(f.ox, f.oy, R * 1.3, dt, L === 7 ? 26 : 16, Z);
        // its own light keeps it out of the dark
        f.lt = (f.lt || 0) - dt; if (t < END + 0.3 && f.lt <= 0) { f.lt = 0.12; H.X.light(f.ox, f.oy - Z, R * 3.4 * Math.min(1, t * 2), 0.26); H.X.light(f.fx0, f.fy0, RF * 0.9 * Math.min(1, t), 0.26); }
        if (t < END && Math.random() < dt * 8 * H.Q()) { const b = Math.random() * TAU, r = Math.sqrt(Math.random()) * RF; K.snow(f.fx0 + Math.cos(b) * r, f.fy0 + Math.sin(b) * r * 0.6 - 1.5, 1, { v: 0.4, up: 0, g: 0.6, life: 1.6 }); }
        // the rays
        while (si < sched.length && t >= sched[si].t) { const q = sched[si++];
          if (q.v !== vIdx) { vIdx = q.v; const list = H.living().filter(m => Math.hypot(m.x - f.ox, m.y - f.oy) < 8).sort((p, r) => Math.hypot(p.x - f.ox, p.y - f.oy) - Math.hypot(r.x - f.ox, r.y - f.oy)); vTargets = list.slice(0, Math.max(q.nj, 3));
            if (L === 7) vTargets.sort((p, r) => Math.atan2(p.y - f.oy, p.x - f.ox) - Math.atan2(r.y - f.oy, r.x - f.ox)); }
          const m = vTargets.length ? vTargets[(q.j + (L === 7 ? 0 : q.v)) % vTargets.length] : null; let tx, ty; if (m) { tx = m.x; ty = m.y; } else { const b = Math.random() * TAU, r = (0.4 + 0.5 * Math.random()) * RF; tx = f.fx0 + Math.cos(b) * r; ty = f.fy0 + Math.sin(b) * r; }
          rays.push({ m, tx, ty, t0: t, s0: (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.8), hit: false, sd: (si * 7) % 4 }); H.X.sfx.sparkle(); }
        for (const r of rays) { const u = t - r.t0; if (!r.hit && r.m && !r.m.dead) { r.tx = r.m.x; r.ty = r.m.y; }
          if (!r.hit && u >= 0.42) { r.hit = true; if (r.m && !r.m.dead) { H.X.hitMon(r.m, RAY, C.dmgO({ freeze: 0.7, kb: 0.5 })); blooms.push({ x: r.tx, y: r.ty, t0: t, sd: Math.random() * TAU, done: false, n: L === 7 ? 5 : 4 }); }
            K.glitter(r.tx, r.ty - 0.35, H.n(8), 4); H.X.light(r.tx, r.ty, 1.8, 0.2); H.glowAt(r.tx, r.ty - 0.35, 1.1, 0.2, P.cyan, 0.7); if (crackT <= 0) { H.X.sfx.crack(); crackT = 0.07; }
            if (L === 7) paths.push({ x0: f.ox, y0: f.oy, x1: r.tx, y1: r.ty, t0: t }); } }
        for (let i = rays.length - 1; i >= 0; i--) if (t - rays[i].t0 > 0.85) rays.splice(i, 1);
        for (let i = blooms.length - 1; i >= 0; i--) { const b = blooms[i]; if (!b.done && t - b.t0 > 0.45) { b.done = true; K.shatterAt(b.x, b.y - 0.25, 0.7); } if (t - b.t0 > 0.6) blooms.splice(i, 1); }
        for (let i = paths.length - 1; i >= 0; i--) if (t - paths[i].t0 > 1.4) paths.splice(i, 1);
        // the end: the plates separate, the core shows, the orb breaks into slowly turning fragments and falling snow
        if (!broke && t >= END) { broke = true; f.bx = f.ox; f.by = f.oy;
          H.hitArea(f.ox, f.oy, RF * 0.75, BURST, C.dmgO({ freeze: 1.5, kb: 1 })); H.X.flash(0.35, P.cyan); H.X.shake(L === 7 ? 12 : 8, 0.35); H.X.light(f.ox, f.oy, RF * 1.5, 0.6); H.X.ring(f.ox, f.oy, 0.3, RF, 0.6, P.cyan, 0.3); H.X.sfx.crash(); H.X.hitstop(0.05);
          const nF = L === 7 ? 22 : L === 4 ? 15 : 10; for (let i = 0; i < nF; i++) { const b = i / nF * TAU + R1(i) * 0.4, e = (R1(i * 3) - 0.5) * 1.6, sp = 0.6 + R1(i * 5) * 0.9; frags.push({ x: Math.cos(b) * Math.cos(e) * R * 0.9, y: Math.sin(e) * R * 0.9, vx: Math.cos(b) * sp, vy: Math.sin(e) * sp + 0.4, rot: R1(i * 7) * TAU, vr: (R1(i * 9) - 0.5) * 1.6, w: (0.16 + 0.12 * (i % 3)) * R, sd: i % 4 }); }
          K.glitter(f.ox, f.oy - Z, H.n(30), 6, { g: 2 }); K.snow(f.ox, f.oy - Z, H.n(26), { v: 3, up: 0.5, g: 0.5, life: 2 }); K.fragments(f.ox, f.oy - Z, H.n(14), 5); }
        if (broke) { for (const q of frags) { q.vy -= 1.5 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - dt * 0.8; q.rot += q.vr * dt; } if (Math.random() < dt * 14 * H.Q()) K.snow(f.bx + (Math.random() - 0.5) * RF, f.by + (Math.random() - 0.5) * RF * 0.5 - 2.5, 1, { v: 0.3, up: 0, g: 0.5, life: 1.8 }); }
      },
      drawUnder(c, f, X0, Y0, T) {
        const t = f.t, fa = t < END ? 1 : 1 - sm((t - END) / 1.6), X = H.sx(f.fx0), Y = H.sy(f.fy0), rf = RF * T; if (fa < 0.01) return;
        // the field freezes outward: veins, then the glassy surface, the frost pattern, a low fringe of mist
        const uv = sm((t - 0.45) / 0.7), up = sm((t - 0.8) / 0.8);
        c.save();
        if (uv > 0) { K.frostVeins(c, X, Y, rf, uv, fa * 0.7, 1.3, L === 7 ? 14 : L === 4 ? 11 : 8); if (L >= 4) K.frostVeins(c, X, Y, rf * 0.65, uv, fa * 0.45, 4.1, L === 7 ? 10 : 7); }
        if (up > 0) { K.frozenPool(c, X, Y, rf * up, fa * 0.85, t);
          if (L >= 4) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fa * up * (L === 7 ? 0.32 : 0.3); c.translate(X, Y); c.scale(1, H.GY); c.rotate(t * 0.05); const sp = frostSprite(0), s = rf * 0.98; c.drawImage(sp, -s, -s, s * 2, s * 2);
            if (L === 7) { c.rotate(-t * 0.12 + 0.52); c.globalAlpha = fa * up * 0.25; const s2 = rf * 0.55; c.drawImage(frostSprite(1), -s2, -s2, s2 * 2, s2 * 2); } c.restore(); }
          K.mist(c, X, Y + T * 0.1, rf * 0.85, fa * up * 0.8, t); }
        // the orb's light on the floor beneath it, and Celestial's paths of light where its rays ran
        const ox = H.sx(f.ox), oy = H.sy(f.oy), grow = outB((t - 0.2) / 0.55);
        if (t < END + 0.5) K.floorLight(c, ox, oy, R * T * 2.6 * grow, (0.5 + 0.1 * Math.sin(t * 3)) * fa, P.cyan);
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (const p of paths) { const u = t - p.t0, a = (1 - cl(u / 1.4)) * fa; c.beginPath(); c.moveTo(H.sx(p.x0), H.sy(p.y0)); c.lineTo(H.sx(p.x1), H.sy(p.y1)); c.globalAlpha = 0.35 * a; c.strokeStyle = P.blue; c.lineWidth = T * 0.3; c.stroke(); c.globalAlpha = 0.7 * a; c.strokeStyle = P.cyan; c.lineWidth = T * 0.09; c.stroke(); c.globalAlpha = 0.9 * a; c.strokeStyle = P.white; c.lineWidth = Math.max(1, T * 0.025); c.stroke(); }
        c.restore();
      },
      draw(c, f, X0, Y0, T) {
        const t = f.t; c.save(); petHole(c, T);
        const OX = H.sx(f.ox), OY = H.sy(f.oy) - Z * T, Rp = R * T;
        // the point expanding, the plates arriving, the end's separation
        const ex = outB((t - 0.15) / 0.6), sep = sm((t - (END - 0.7)) / 0.7), body = t < END ? ex * (1 - 0.65 * sep) : 0;
        const pf = petFade(OX, OY, OX, OY, Rp * SH[SH.length - 1].r * 0.8, T);
        if (t < END) {
          // the brilliant point
          if (t < 0.6) { const a = 1 - sm((t - 0.35) / 0.25); K.glow(c, OX, OY, T * (0.4 + 1.6 * t), P.white, a); K.glow(c, OX, OY, T * (1 + 2 * t), P.blue, 0.6 * a); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.strokeStyle = P.white; c.lineWidth = 2; c.beginPath(); c.moveTo(OX - T * 1.4 * t * 2, OY); c.lineTo(OX + T * 1.4 * t * 2, OY); c.moveTo(OX, OY - T * t * 2); c.lineTo(OX, OY + T * t * 2); c.stroke(); c.restore(); }
          K.glow(c, OX, OY, Rp * 3.2 * ex, P.blue, 0.32 * pf * ex); K.glow(c, OX, OY, Rp * 2.0 * ex, P.cyan, 0.3 * pf * ex);
          // the shells: project each plate, the far ones behind the orb, the near ones in front
          const back = [], front = [];
          SH.forEach((s, i) => { const sa = sm((t - 0.3 - i * 0.14) / 0.55), rr = Rp * s.r * (1 + 0.5 * (1 - outB((t - 0.3 - i * 0.14) / 0.6)) + 0.95 * sep), op = s.op * sa * (1 - 0.92 * sep) * pf; if (op < 0.02) return;
            const M = rotM(t * s.w * (1 + 2.5 * sep) + i, s.al + 0.15 * Math.sin(t * 0.4 + i), s.be);
            for (const g of s.g) { const q = g.map(M), cz = q[4][2]; (cz < 0 ? back : front).push({ q, cz, rr, op, i }); } });
          back.sort((p, q) => p.cz - q.cz); front.sort((p, q) => p.cz - q.cz);
          const plate = (pl, isBack) => { const { q, rr, op } = pl, sx = p => OX + p[0] * rr, sy = p => OY - p[1] * rr;
            for (const Q of QUADS) { const a = q[Q[0]], b = q[Q[1]], cc = q[Q[2]], d = q[Q[3]], u = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]], v = [d[0] - b[0], d[1] - b[1], d[2] - b[2]]; let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map(x => x / nl); if (n[0] * a[0] + n[1] * a[1] + n[2] * a[2] < 0) n = n.map(x => -x);
              if (isBack) n = n.map(x => -x);   // (its inner face is the one seen)
              const df = Math.max(0, n[0] * LD[0] + n[1] * LD[1] + n[2] * LD[2]), b2 = 0.18 + 0.82 * df;
              c.beginPath(); c.moveTo(sx(a), sy(a)); c.lineTo(sx(b), sy(b)); c.lineTo(sx(cc), sy(cc)); c.lineTo(sx(d), sy(d)); c.closePath(); c.fillStyle = shadeCol(isBack ? b2 * 0.6 : b2, (isBack ? 0.3 : 0.5 + 0.38 * b2) * op); c.fill();
              if (!isBack) { const spc = Math.pow(Math.max(0, n[0] * HV[0] + n[1] * HV[1] + n[2] * HV[2]), 14); if (spc > 0.1) { const mx = (sx(a) + sx(cc)) / 2, my = (sy(a) + sy(cc)) / 2; K.glow(c, mx, my, rr * 0.22, spc > 0.45 ? P.white : P.lav, (spc > 0.45 ? 0.7 : 0.45) * spc * op); } } }
            c.globalCompositeOperation = 'lighter'; c.beginPath(); RIM.forEach((k, j) => (j ? c.lineTo(sx(q[k]), sy(q[k])) : c.moveTo(sx(q[k]), sy(q[k])))); c.closePath(); c.strokeStyle = rgb(P.cyan, (isBack ? 0.35 : 0.9) * op); c.lineWidth = Math.max(1, rr * 0.022); c.stroke();
            if (!isBack) { c.beginPath(); c.moveTo(sx(q[1]), sy(q[1])); c.lineTo(sx(q[4]), sy(q[4])); c.lineTo(sx(q[7]), sy(q[7])); c.moveTo(sx(q[3]), sy(q[3])); c.lineTo(sx(q[5]), sy(q[5])); c.strokeStyle = rgb(P.white, 0.4 * op); c.lineWidth = Math.max(0.8, rr * 0.012); c.stroke(); }
            c.globalCompositeOperation = 'source-over'; };
          for (const pl of back) plate(pl, true);
          // the orb: the sphere, the currents turning inside it, the white-blue core
          if (body > 0.01) { c.save(); c.globalAlpha = body * pf; c.drawImage(orbSprite(), OX - Rp * 1.064, OY - Rp * 1.064, Rp * 2.128, Rp * 2.128);
            c.beginPath(); c.arc(OX, OY, Rp * 0.97, 0, TAU); c.clip(); c.globalCompositeOperation = 'lighter';
            c.save(); c.translate(OX, OY); c.rotate(t * 0.55); c.globalAlpha = 0.42 * body * pf; c.drawImage(currentSprite(0), -Rp * 1.1, -Rp * 1.1, Rp * 2.2, Rp * 2.2); c.rotate(-t * 1.0 + 1.3); c.scale(1.2, 0.9); c.globalAlpha = 0.3 * body * pf; c.drawImage(currentSprite(1), -Rp, -Rp, Rp * 2, Rp * 2); c.restore();
            c.restore(); }
          const cp = (0.75 + 0.15 * Math.sin(t * 5)) * ex * (1 + 1.2 * sep);
          K.glow(c, OX, OY, Rp * 0.95 * cp, P.cyan, 0.85 * pf); K.glow(c, OX, OY, Rp * 0.5 * cp, P.white, 0.95 * pf); K.glow(c, OX - Rp * 0.06, OY - Rp * 0.06, Rp * 0.22 * cp, P.white, pf);
          for (const pl of front) plate(pl, false);
          // a ray gathering: a bright point running across the surface toward its monster
          for (const r of rays) { const u = t - r.t0; if (u >= 0.42) continue; const tx = H.sx(r.tx), ty = H.sy(r.ty) - T * 0.4, th = Math.atan2(ty - OY, tx - OX), k = sm(u / 0.38), b = th + r.s0 * (1 - k), rr = Rp * lerp(0.55, 0.96, k), px = OX + Math.cos(b) * rr, py = OY + Math.sin(b) * rr;
            K.glow(c, px, py, T * (0.25 + 0.45 * k), P.white, (0.5 + 0.5 * k) * pf); K.glow(c, px, py, T * (0.5 + 0.9 * k), P.cyan, 0.5 * k * pf); }
        }
        // the lances: from the orb's surface to the monster, a beam of cold light round a long crystal
        for (const r of rays) { const u = t - r.t0; if (u < 0.34) continue; const tx = H.sx(r.tx), ty = H.sy(r.ty) - T * 0.4, th = Math.atan2(ty - OY, tx - OX), sx = OX + Math.cos(th) * Rp * 0.96, sy = OY + Math.sin(th) * Rp * 0.96, full = Math.hypot(tx - sx, ty - sy);
          const ext = sm((u - 0.34) / 0.08), a = 1 - sm((u - 0.55) / 0.3), len = full * ext, w = T * (L === 7 ? 0.62 : 0.52) * (1 - 0.5 * sm((u - 0.55) / 0.3)); if (a < 0.02 || len < 2) continue;
          H.ray(c, sx, sy, th, len, w * 1.3, P.blue, 0.7 * a); H.ray(c, sx, sy, th, len, w * 0.6, P.cyan, 0.7 * a); H.ray(c, sx, sy, th, len, w * 0.18, P.white, 0.8 * a);
          c.save(); c.translate(sx, sy); c.rotate(th); c.scale(len / 120, 1); K.shard(c, 0, 0, Math.round(T * 0.24), 120, 0, r.sd, 0.85 * a); c.restore();
          K.glow(c, sx + Math.cos(th) * len, sy + Math.sin(th) * len, T * 0.7, P.white, 0.8 * a); K.glow(c, sx, sy, T * 0.6, P.cyan, 0.6 * a); }
        // crystals growing round each monster struck, then shattering
        for (const b of blooms) { const u = t - b.t0; if (b.done) continue; const gU = outB(u / 0.14), X = H.sx(b.x), Y = H.sy(b.y), hh = Math.round(T * 0.5);
          for (let k = 0; k < b.n; k++) { const q = b.sd + k / b.n * TAU, x = X + Math.cos(q) * T * 0.36, y = Y + Math.sin(q) * T * 0.36 * H.GY; c.save(); c.translate(x, y); c.scale(1, gU); K.shard(c, 0, 0, Math.round(hh * 0.4), hh, -Math.PI / 2 + Math.cos(q) * 0.6, k, 0.95, t); c.restore(); }
          K.glow(c, X, Y - T * 0.3, T * 0.7, P.cyan, 0.4); }
        // the end: the core blazes bare, then the fragments turn slowly as they fall
        if (t >= END) { const u = t - END, bx = H.sx(f.bx), by = H.sy(f.by) - Z * T; K.glow(c, bx, by, Rp * (1.2 + 2.5 * u), P.white, Math.max(0, 1 - u * 2.5)); K.glow(c, bx, by, Rp * (2 + 3 * u), P.cyan, Math.max(0, 0.7 - u)); const fa = 1 - sm((u - 0.6) / 1.2);
          for (const q of frags) { const x = bx + q.x * T, y = by - q.y * T, w = Math.round(q.w * T); K.shard(c, x, y, Math.max(3, Math.round(w * 0.5)), Math.max(6, w), q.rot, q.sd, fa * 0.95, t); } }
        c.restore();
      },
    });
  };
})();
