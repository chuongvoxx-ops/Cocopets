/* ---------- Gate 11, Leo: The Crown Chase ----------
   Michael's sun-court: a floor of white marble and gold that floats in the light under a great sun disc, set with
   pillars and low laurel hedges to weave round. A crown-bearer (a small radiant lion cub of light, wearing a golden
   crown too big for it) darts about the court; this is cooperative tag, no harm in it. Touch the cub to tag it. It
   runs from the pet while it has breath, slips aside once or twice when you're on it, and must stop to puff after a
   dash: that is the moment to catch it. It never leaves the court, and it never runs itself into a corner: it picks
   open ground, and if it is truly hemmed in it vaults over the pet. Each tag is a little ceremony (the crown flashes
   up, the cub laughs, and it resets across the court). Each round it is quicker; from the second it throws decoy
   afterimages of light (only the real one wears the crown and casts a shadow; touching a decoy only pops it); in the
   third it fades into the sunlight as it runs, leaving a trail of gold dust to follow. Three tags, and Leo wakes. */
(() => {
  const TAU = Math.PI * 2, INK = '#2E2414', GOLD = '#F2C14E', GOLD_HI = '#FFF1B8', GOLD_D = '#B07F1E', GOLD_DD = '#7A5410', MARBLE = '#F6F0E2', MARBLE_HI = '#FFFFFF', MARBLE_D = '#D9CDB4', MARBLE_DD = '#A99A7C', CIT = '#FFB72E', CIT_HI = '#FFE59A', CIT_D = '#D9861A', LEAF = '#7DB35B', LEAF_D = '#3F7A35', LEAF_HI = '#B9E08A', SUN = '#FFE27A';
  const glowAt = (c, x, y, r, col, a) => { if (a <= 0 || r <= 0) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const ell = (c, x, y, rx, ry) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const LEO = 'M4 15a3 3 0 1 0 6 0a3 3 0 1 0-6 0M10 15C10 9 9.5 4 13.5 4s4.5 4 2.5 8-2 7 1.5 8.4c1.8.7 3-.6 3-2';
  // the court: CW × CH tiles of marble in a ring of open light; pillars (1×1) and hedges (w×h) stand on it as gaps
  const CW = 12, CH = 15, MG = 3;
  const PILLARS = [[2, 3], [9, 3], [2, 11], [9, 11]];
  const HEDGES = [{ i: 5, j: 4, w: 2, h: 1 }, { i: 5, j: 10, w: 2, h: 1 }, { i: 3, j: 7, w: 1, h: 2 }, { i: 8, j: 6, w: 1, h: 2 }];
  const START = [6, 13];
  const LAYOUT = (() => { const W = CW + MG * 2, Hh = CH + MG * 2, g = Array.from({ length: Hh }, () => Array(W).fill('~'));
    for (let y = MG; y < MG + CH; y++) for (let x = MG; x < MG + CW; x++) g[y][x] = '.';
    for (const [i, j] of PILLARS) g[MG + j][MG + i] = '~';
    for (const h of HEDGES) for (let y = 0; y < h.h; y++) for (let x = 0; x < h.w; x++) g[MG + h.j + y][MG + h.i + x] = '~';
    g[MG + START[1]][MG + START[0]] = 'S'; return g.map(r => r.join('')); })();
  // the rounds: run speed, breath (seconds of dashing), the puff after, how near the pet must come before it bolts,
  // side-steps per breath, decoys per split (and the wait between splits), the fade into the light and the gold dust
  const ROUNDS = [
    { v: 4.8, stam: 8.0, rest: 1.1, alert: 4.6, jukes: 1, decoys: 0, dcd: 0, fade: false, dust: false },
    { v: 5.2, stam: 10.0, rest: 1.0, alert: 4.8, jukes: 2, decoys: 2, dcd: 6.0, fade: false, dust: false },
    { v: 5.5, stam: 11.0, rest: 0.95, alert: 5.0, jukes: 2, decoys: 3, dcd: 5.0, fade: true, dust: true },
  ];
  const CUB_R = 0.4, TAG_D = 0.95;

  /* the crown-bearer: a sphere-bodied cub of light with a mane of flame petals, a tufted tail, and (the real one) a crown
     o: { face, ph (run phase), mood: 'run'|'rest'|'idle'|'laugh'|'caught', a (alpha), crown, shadow, z, crownUp, flash } */
  function drawCub(c, Xs, Ys, T, o, t) {
    T *= 1.3;   // (the cub stands a little larger than a tile's worth, so it reads at a glance)
    const a = o.a == null ? 1 : o.a, f = o.face < 0 ? -1 : 1, run = o.mood === 'run', rest = o.mood === 'rest', happy = o.mood === 'laugh' || o.mood === 'caught' || o.mood === 'idle';
    const hop = run ? Math.abs(Math.sin(o.ph)) * T * 0.14 : rest ? Math.abs(Math.sin(t * 7)) * T * 0.03 : Math.abs(Math.sin(t * 2.2)) * T * 0.04;
    const lift = (o.z || 0) * T + hop, rb = T * 0.36, rh = T * 0.3, bx = Xs, by = Ys - T * 0.36 - lift;
    // the shadow on the marble (the real one only): it shrinks as the cub hops
    if (o.shadow) { c.save(); const k = 1 - Math.min(0.5, lift / (T * 1.4)); c.fillStyle = `rgba(110,72,14,${0.38 * k})`; ell(c, Xs, Ys + T * 0.02, T * 0.46 * k, T * 0.16 * k); c.fill(); c.fillStyle = `rgba(110,72,14,${0.22 * k})`; ell(c, Xs, Ys + T * 0.02, T * 0.6 * k, T * 0.22 * k); c.fill(); c.restore(); }
    c.save(); c.globalAlpha = a;
    glowAt(c, bx, by - rb * 0.4, T * 1.25, '#FFD36B', (0.5 + 0.12 * Math.sin(t * 6)) * a); glowAt(c, bx, by - rb * 0.4, T * 0.7, '#FFFFFF', 0.35 * a);
    c.lineJoin = 'round'; c.lineCap = 'round';
    // the tail, and its tuft of light
    { const tx0 = bx - f * rb * 0.8, ty0 = by + rb * 0.1, sw = Math.sin(t * (run ? 14 : 4)) * T * 0.08, tx1 = bx - f * rb * 1.7, ty1 = by - rb * 1.1 + sw;
      c.strokeStyle = INK; c.lineWidth = T * 0.11 + 2; c.beginPath(); c.moveTo(tx0, ty0); c.quadraticCurveTo(bx - f * rb * 1.8, by + rb * 0.2, tx1, ty1); c.stroke(); c.strokeStyle = '#F0B444'; c.lineWidth = T * 0.11; c.stroke();
      glowAt(c, tx1, ty1, T * 0.42, CIT_HI, 0.7 * a); const tg = c.createRadialGradient(tx1 - T * 0.03, ty1 - T * 0.05, 0, tx1, ty1, T * 0.15); tg.addColorStop(0, '#FFFFFF'); tg.addColorStop(0.5, CIT_HI); tg.addColorStop(1, CIT); c.fillStyle = tg; c.beginPath(); c.moveTo(tx1, ty1 - T * 0.24); c.quadraticCurveTo(tx1 + T * 0.15, ty1, tx1, ty1 + T * 0.12); c.quadraticCurveTo(tx1 - T * 0.15, ty1, tx1, ty1 - T * 0.24); c.fill(); }
    // the legs: four soft paws, swinging when it runs
    const sw = run ? Math.sin(o.ph) : 0, legs = [[-0.55, sw], [0.5, -sw], [-0.3, -sw], [0.72, sw]];
    legs.forEach(([dx, s], i) => { const lx = bx + f * dx * rb + s * T * 0.1 * f, ly = by + rb * 0.78 - Math.max(0, -s) * T * 0.06; c.fillStyle = i < 2 ? '#E2A23C' : '#F3BE57'; c.strokeStyle = INK; c.lineWidth = 1.8; ell(c, lx, ly, T * 0.1, T * 0.13); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.45)'; ell(c, lx - T * 0.02, ly - T * 0.04, T * 0.04, T * 0.04); c.fill(); });
    // the body: a shaded sphere of gold light
    { const g2 = c.createRadialGradient(bx - rb * 0.4, by - rb * 0.45, rb * 0.1, bx, by, rb * 1.05); g2.addColorStop(0, '#FFFBE6'); g2.addColorStop(0.35, '#FFE08A'); g2.addColorStop(0.75, '#F2B544'); g2.addColorStop(1, '#C98A22'); c.fillStyle = g2; c.strokeStyle = INK; c.lineWidth = 2; ell(c, bx, by, rb * 1.08, rb); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,248,220,.75)'; ell(c, bx + f * rb * 0.15, by + rb * 0.35, rb * 0.55, rb * 0.42); c.fill(); }
    // the mane: a ring of flickering flame petals round the head
    const hx = bx + f * rb * 0.62, hy = by - rb * 0.78;
    glowAt(c, hx, hy, rh * 3.0, CIT, 0.45 * a);
    for (let i = 0; i < 14; i++) { const an = i / 14 * TAU + t * 0.6, L = rh * (1.62 + 0.16 * Math.sin(t * 9 + i * 1.7)), w = rh * 0.42, px = hx + Math.cos(an) * rh * 0.9, py = hy + Math.sin(an) * rh * 0.9, ex = hx + Math.cos(an) * L, ey = hy + Math.sin(an) * L, nx = -Math.sin(an) * w, ny = Math.cos(an) * w;
      c.fillStyle = i % 2 ? '#FFB938' : '#FFD86B'; c.strokeStyle = 'rgba(122,84,16,.75)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px + nx, py + ny); c.quadraticCurveTo(hx + Math.cos(an) * rh * 1.3 + nx * 0.6, hy + Math.sin(an) * rh * 1.3 + ny * 0.6, ex, ey); c.quadraticCurveTo(hx + Math.cos(an) * rh * 1.3 - nx * 0.6, hy + Math.sin(an) * rh * 1.3 - ny * 0.6, px - nx, py - ny); c.closePath(); c.fill(); c.stroke(); }
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * a; c.fillStyle = '#FFF6C8'; for (let i = 0; i < 14; i += 2) { const an = i / 14 * TAU + t * 0.6; ell(c, hx + Math.cos(an) * rh * 1.25, hy + Math.sin(an) * rh * 1.25, rh * 0.18, rh * 0.18); c.fill(); } c.restore();
    // the head: ears, a shaded sphere, the face turned the way it runs
    for (const s of [-1, 1]) { const ex = hx + s * rh * 0.62 + f * rh * 0.05, ey = hy - rh * 0.72; c.fillStyle = '#F2B544'; c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.arc(ex, ey, rh * 0.3, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#FF9FA8'; c.beginPath(); c.arc(ex, ey + rh * 0.04, rh * 0.15, 0, TAU); c.fill(); }
    { const g3 = c.createRadialGradient(hx - rh * 0.35, hy - rh * 0.4, rh * 0.08, hx, hy, rh * 1.05); g3.addColorStop(0, '#FFFCEB'); g3.addColorStop(0.4, '#FFE394'); g3.addColorStop(0.8, '#F4B94C'); g3.addColorStop(1, '#CF9127'); c.fillStyle = g3; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(hx, hy, rh, 0, TAU); c.fill(); c.stroke(); }
    { const fx = hx + f * rh * 0.22, fy = hy + rh * 0.08, eo = rh * 0.36;
      c.fillStyle = 'rgba(255,140,150,.5)'; ell(c, fx - eo - rh * 0.08, fy + rh * 0.24, rh * 0.16, rh * 0.1); c.fill(); ell(c, fx + eo + rh * 0.08, fy + rh * 0.24, rh * 0.16, rh * 0.1); c.fill();
      c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 2;
      if (happy) { for (const s of [-1, 1]) { c.beginPath(); c.arc(fx + s * eo, fy - rh * 0.05, rh * 0.14, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } }
      else if (rest) { for (const s of [-1, 1]) { c.beginPath(); c.moveTo(fx + s * eo - rh * 0.13, fy - rh * 0.08); c.lineTo(fx + s * eo + rh * 0.13, fy - rh * 0.02); c.stroke(); } }
      else { for (const s of [-1, 1]) { ell(c, fx + s * eo, fy - rh * 0.06, rh * 0.11, rh * 0.15); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(fx + s * eo - rh * 0.04, fy - rh * 0.12, rh * 0.045, 0, TAU); c.fill(); c.fillStyle = INK; } }
      c.fillStyle = '#FFF4D6'; ell(c, fx, fy + rh * 0.3, rh * 0.36, rh * 0.24); c.fill();
      c.fillStyle = '#7A4A2A'; c.beginPath(); c.moveTo(fx - rh * 0.1, fy + rh * 0.18); c.lineTo(fx + rh * 0.1, fy + rh * 0.18); c.lineTo(fx, fy + rh * 0.3); c.closePath(); c.fill();
      c.lineWidth = 1.6; c.beginPath(); if (happy || rest) { c.arc(fx, fy + rh * 0.32, rh * 0.16, 0.15, Math.PI - 0.15); c.fillStyle = '#C44A5A'; c.fill(); c.stroke(); } else { c.moveTo(fx - rh * 0.16, fy + rh * 0.38); c.quadraticCurveTo(fx - rh * 0.08, fy + rh * 0.46, fx, fy + rh * 0.34); c.quadraticCurveTo(fx + rh * 0.08, fy + rh * 0.46, fx + rh * 0.16, fy + rh * 0.38); c.stroke(); } }
    c.fillStyle = 'rgba(255,255,255,.6)'; ell(c, hx - rh * 0.4, hy - rh * 0.45, rh * 0.18, rh * 0.12); c.fill();
    // the crown (the real one only): gold, three points tipped with citrine, a gem in the band; it flashes up at a tag
    if (o.crown) { const up = (o.crownUp || 0) * T * 1.3, spin = o.crownUp ? Math.cos(t * 9) : 1, cx = hx - f * rh * 0.05, cy = hy - rh * 0.88 - up, w = rh * 0.86, h = rh * 0.8;
      if (o.flash) { glowAt(c, cx, cy - h * 0.4, T * (1.2 + o.flash * 1.4), '#FFFFFF', 0.9 * o.flash); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * o.flash; c.strokeStyle = GOLD_HI; c.lineWidth = 2.5; for (let k = 0; k < 12; k++) { const an = k / 12 * TAU + t * 1.5, r0 = T * 0.45, r1 = T * (0.9 + o.flash * 1.1) * (k % 2 ? 0.7 : 1); c.beginPath(); c.moveTo(cx + Math.cos(an) * r0, cy - h * 0.4 + Math.sin(an) * r0); c.lineTo(cx + Math.cos(an) * r1, cy - h * 0.4 + Math.sin(an) * r1); c.stroke(); } c.restore(); }
      c.save(); c.translate(cx, cy); c.rotate(o.crownUp ? 0 : f * -0.18); c.scale(Math.max(0.15, Math.abs(spin)), 1);
      glowAt(c, 0, -h * 0.4, T * 0.6, GOLD, 0.5);
      const cg = c.createLinearGradient(-w, 0, w, 0); cg.addColorStop(0, GOLD_D); cg.addColorStop(0.35, GOLD_HI); cg.addColorStop(0.6, GOLD); cg.addColorStop(1, GOLD_DD); c.fillStyle = cg; c.strokeStyle = INK; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w, -h * 0.55); c.lineTo(-w * 0.75, -h * 0.35); c.lineTo(-w * 0.45, -h * 1.0); c.lineTo(-w * 0.2, -h * 0.4); c.lineTo(0, -h * 1.25); c.lineTo(w * 0.2, -h * 0.4); c.lineTo(w * 0.45, -h * 1.0); c.lineTo(w * 0.75, -h * 0.35); c.lineTo(w, -h * 0.55); c.lineTo(w, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = GOLD_D; c.fillRect(-w, -h * 0.22, w * 2, h * 0.22); c.strokeRect(-w, -h * 0.22, w * 2, h * 0.22);
      for (const [px, py, r0] of [[-w * 0.45, -h * 1.0, 0.13], [0, -h * 1.25, 0.16], [w * 0.45, -h * 1.0, 0.13]]) { const r = r0 * rh / T; const gg = c.createRadialGradient(px - r * T * 0.3, py - r * T * 0.3, 0, px, py, r * T); gg.addColorStop(0, '#FFFFFF'); gg.addColorStop(0.4, CIT_HI); gg.addColorStop(1, CIT_D); c.fillStyle = gg; c.beginPath(); c.arc(px, py, r * T, 0, TAU); c.fill(); c.stroke(); }
      { const q = rh * 0.13, gg = c.createRadialGradient(-q * 0.3, -h * 0.13, 0, 0, -h * 0.11, q * 1.2); gg.addColorStop(0, '#FFFFFF'); gg.addColorStop(0.5, CIT); gg.addColorStop(1, CIT_D); c.fillStyle = gg; c.beginPath(); c.moveTo(0, -h * 0.11 - q); c.lineTo(q * 0.8, -h * 0.11); c.lineTo(0, -h * 0.11 + q); c.lineTo(-q * 0.8, -h * 0.11); c.closePath(); c.fill(); c.lineWidth = 1.2; c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-w * 0.8, -h * 0.5, w * 0.14, h * 0.3);
      c.restore();
      // a glint that runs over the crown
      { const gl = (t * 0.7) % 1; if (gl < 0.3) { const k = Math.sin(gl / 0.3 * Math.PI); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k; c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.6; const sx2 = cx + w * 0.5, sy2 = cy - h * 0.9, s = T * 0.22 * k; c.beginPath(); c.moveTo(sx2 - s, sy2); c.lineTo(sx2 + s, sy2); c.moveTo(sx2, sy2 - s); c.lineTo(sx2, sy2 + s); c.stroke(); c.restore(); } } }
    c.restore();
    // a soft sheen over a decoy: it is only light
    if (!o.crown && !o.shadow) glowAt(c, bx, by - rb * 0.3, T * 0.9, '#FFFFFF', 0.25 * a);
  }

  defGate('choir', {
    name: 'The Crown Chase', biome: 'heaven', goal: 'Tag the crown-bearer three times', how: `Michael's sun-court floats in the light: white marble and gold, set with pillars and low laurel hedges. A little lion cub of light has run off with the crown, and it wants to be chased. Touch it to tag it: there is no harm in this game. It runs while it has breath and slips aside when you're right on it, but after a dash it must stop and puff for a moment: that is your chance. Weave round the pillars and hedges to cut it off; it never leaves the court and never lets itself be cornered (hem it in and it vaults over you). Each tag it laughs, resets across the court, and gets quicker. From the second round it throws decoy afterimages of light: only the real cub wears the crown and casts a shadow (touching a decoy just pops it). In the third it fades into the sunlight as it runs; follow its gold-dust trail and its shadow. Three tags, and Leo wakes.`,
    layout: LAYOUT, legend: {},
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, ox = (M.MW - LAYOUT[0].length) / 2, oy = (M.MH - LAYOUT.length) / 2;
      const X0 = ox + MG, Y0 = oy + MG, X1 = X0 + CW, Y1 = Y0 + CH, CX = X0 + CW / 2, CY = Y0 + CH / 2;
      const solid = new Set(); for (const [i, j] of PILLARS) solid.add(i + ',' + j); for (const h of HEDGES) for (let y = 0; y < h.h; y++) for (let x = 0; x < h.w; x++) solid.add((h.i + x) + ',' + (h.j + y));
      const tileBlocked = (tx, ty) => tx < 0 || ty < 0 || tx >= CW || ty >= CH || solid.has(tx + ',' + ty);
      // is a circle of radius r at (x, y) clear of the court's edge and its pillars and hedges?
      const blockedAt = (x, y, r) => { const lx = x - X0, ly = y - Y0; for (let ty = Math.floor(ly - r); ty <= Math.floor(ly + r); ty++) for (let tx = Math.floor(lx - r); tx <= Math.floor(lx + r); tx++) { if (!tileBlocked(tx, ty)) continue; const cx = clamp(lx, tx, tx + 1), cy = clamp(ly, ty, ty + 1); if ((lx - cx) ** 2 + (ly - cy) ** 2 < r * r) return true; } return false; };
      const clearLine = (ax, ay, bx, by, r) => { const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / 0.25)); for (let k = 1; k <= n; k++) { const u = k / n; if (blockedAt(ax + (bx - ax) * u, ay + (by - ay) * u, r)) return false; } return true; };
      const pillarOn = (ax, ay, bx, by) => PILLARS.some(([i, j]) => segDist(ax, ay, bx, by, X0 + i + 0.5, Y0 + j + 0.5) < 0.95);
      const segDist = (ax, ay, bx, by, px, py) => { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-6, u = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1); return Math.hypot(ax + dx * u - px, ay + dy * u - py); };
      const S = { intro: true, won: false, round: 0, tags: 0, decoys: [], dust: [], dustT: 0, decoyCd: 4, cer: null, pops: 0, splits: 0, jukes: 0, vaults: 0, rests: 0, outside: 0, motes: [] };
      const cub = { x: CX, y: Y0 + 2.6, vx: 0, vy: 0, face: 1, st: 'idle', stam: ROUNDS[0].stam, rest: 0, jukes: ROUNDS[0].jukes, juke: null, vault: null, dest: null, ph: 0, a: 1, z: 0, stuck: 0, wander: 0, laugh: 0, crownUp: 0, flash: 0, said: 0 };
      // a place to run to: open ground, far from the pet, not past it, not into a corner (bias: a direction to favour)
      function pickDest(from, bias, avoidPet) { let best = null, bs = -1e9; const mg = 0.75;
        for (let k = 0; k < 48; k++) { const x = X0 + mg + Math.random() * (CW - mg * 2), y = Y0 + mg + Math.random() * (CH - mg * 2); if (blockedAt(x, y, CUB_R + 0.12)) continue; if (!clearLine(from.x, from.y, x, y, CUB_R)) continue;
          const dp = Math.hypot(x - me.x, y - me.y), dc = Math.hypot(x - from.x, y - from.y); if (dc < 1.6) continue;
          if (avoidPet && segDist(from.x, from.y, x, y, me.x, me.y) < 1.4) continue;
          const walls = (x - X0 < 2.2 ? 1 : 0) + (X1 - x < 2.2 ? 1 : 0) + (y - Y0 < 2.2 ? 1 : 0) + (Y1 - y < 2.2 ? 1 : 0);
          let s = dp * 1.0 + Math.min(dc, 6) * 0.25 - (walls >= 2 ? 4 : walls * 0.6) + Math.random() * 1.2;
          if (bias) s += ((x - from.x) * bias.x + (y - from.y) * bias.y) / (dc || 1) * 3;
          { const pd = Math.hypot(from.x - me.x, from.y - me.y) || 1; if (pd < 6) s += ((x - from.x) * (from.x - me.x) + (y - from.y) * (from.y - me.y)) / ((dc || 1) * pd) * 2.5; }   // (away from the pet, not round past it)
          if (s > bs) { bs = s; best = { x, y }; } }
        return best; }
      const R = () => ROUNDS[S.round];
      // the cub and its decoys stand in the court as things drawn among the pillars, sorted by depth
      const cubObj = H.obj({ x: cub.x, y: cub.y, kind: 'crownbearer', r: 0.4, draw(c, Xs, Ys, T) { if (cub.st === 'gone') return; drawCub(c, Xs, Ys, T, { face: cub.face, ph: cub.ph, mood: cub.st === 'caught' ? 'caught' : cub.st === 'rest' ? 'rest' : cub.st === 'run' || cub.juke || cub.vault ? 'run' : cub.laugh > 0 ? 'laugh' : 'idle', a: cub.a, crown: true, shadow: true, z: cub.z, crownUp: cub.crownUp, flash: cub.flash }, g.t);
        if (!S.intro && !S.won && cub.st === 'rest') label(c, 'PUFF… TAG IT!', Xs, Ys - T * 1.75 - Math.abs(Math.sin(g.t * 5)) * T * 0.1, T * 0.24, GOLD_HI);
        else if (!S.intro && !S.won && S.tags === 0 && cub.st === 'idle' && Math.hypot(me.x - cub.x, me.y - cub.y) > 4) label(c, 'CATCH ME!', Xs, Ys - T * 1.75, T * 0.24, '#FFFFFF'); } });
      const decoyObjs = [0, 1, 2].map(n => H.obj({ x: -99, y: -99, kind: 'decoy', r: 0.4, draw(c, Xs, Ys, T) { const d = S.decoys[n]; if (!d) return; const a = Math.min(1, d.t / 0.25) * Math.min(1, (d.life - d.t) / 0.5) * 0.78; drawCub(c, Xs, Ys, T, { face: d.face, ph: d.ph, mood: d.rest ? 'rest' : 'run', a, crown: false, shadow: false, z: 0 }, g.t + n); } }));
      // the pillars and hedges, drawn among the pets so the pet can pass behind them
      for (const [i, j] of PILLARS) H.obj({ x: X0 + i + 0.5, y: Y0 + j + 0.98, kind: 'pillar', r: 0.1, draw: (c, Xs, Ys, T) => drawPillar(c, Xs, Ys, T, i + j) });
      for (const h of HEDGES) H.obj({ x: X0 + h.i + h.w / 2, y: Y0 + h.j + h.h - 0.02, kind: 'hedge', r: 0.1, draw: (c, Xs, Ys, T) => drawHedge(c, X.sx(X0 + h.i), X.sy(Y0 + h.j), h.w * T, h.h * T, T, h.i * 3 + h.j) });
      for (let k = 0; k < 18; k++) S.motes.push({ x: X0 - 2 + Math.random() * (CW + 4), y: Y0 - 3 + Math.random() * (CH + 5), ph: Math.random() * TAU, s: 0.5 + Math.random() });
      X.after(1.2, () => { S.intro = false; X.banner('THE CROWN CHASE', 'The little sun-lion has the crown! Touch it to tag it: three tags. It must stop to puff after a dash', GOLD_HI, 3.8, true, true); X.sfx.giggle && X.sfx.giggle(); X.text(cub.x, cub.y - 1.8, 'Catch me!', GOLD_HI, 15); cub.laugh = 1.2; });

      function split() { const n = R().decoys; if (!n) return; S.splits++; S.decoyCd = R().dcd; X.ring(cub.x, cub.y - 0.4, 0.2, 1.4, 0.4, GOLD_HI, 0.3); X.sfx.chirp && X.sfx.chirp();
        const away = Math.atan2(cub.y - me.y, cub.x - me.x);
        for (let k = 0; k < n; k++) { const an = away + (k - (n - 1) / 2) * 1.25 + (Math.random() - 0.5) * 0.4, dst = pickDest(cub, { x: Math.cos(an), y: Math.sin(an) }, false) || { x: CX, y: CY };
          S.decoys[k] = { x: cub.x, y: cub.y, vx: 0, vy: 0, dest: dst, t: 0, life: 4.2 + Math.random() * 0.8, face: Math.cos(an) < 0 ? -1 : 1, ph: Math.random() * TAU, rest: false }; }
        cub.dest = pickDest(cub, null, true) || cub.dest; X.text(cub.x, cub.y - 1.8, n > 2 ? 'Which is me?' : 'Find me!', '#FFFFFF', 14); }
      function popDecoy(k, touched) { const d = S.decoys[k]; if (!d) return; S.decoys[k] = null; X.ring(d.x, d.y - 0.4, 0.1, 0.9, 0.3, '#FFFFFF', 0.25); for (let i = 0; i < 8; i++) X.part({ kind: 'star', x: d.x + (Math.random() - 0.5) * 0.6, y: d.y - 0.4 - Math.random() * 0.5, vx: (Math.random() - 0.5) * 2, vy: -1.4, life: 0.7, max: 0.7, size: 2.6, color: GOLD_HI });
        if (touched) { S.pops++; X.text(d.x, d.y - 1.5, 'Only light! No crown, no shadow', '#FFFFFF', 13); X.sfx.tick && X.sfx.tick(); } }
      function tag() { S.tags++; cub.st = 'caught'; cub.juke = cub.vault = null; cub.dest = null; cub.vx = cub.vy = 0; cub.z = 0; cub.a = 1; S.cer = { t: 0, laughed: false, moved: false };
        for (let k = 0; k < 3; k++) popDecoy(k, false); S.dust = [];
        X.boom(cub.x, cub.y - 0.6, 1.2, GOLD, '#FFFFFF', { n: 18, shake: 3 }); X.flash(0.25, '#FFF6D0'); X.sfx.coin && X.sfx.coin(); X.text(cub.x, cub.y - 2.2, `TAG! ${S.tags}/3`, GOLD_HI, 18); }
      function win() { if (S.won) return; S.won = true; self.done = true; X.flash(0.5, '#FFFFFF'); X.shake(6, 0.5); X.sfx.fanfare && X.sfx.fanfare(); X.banner('LEO WAKES', 'Three tags, and the crown given gladly: Michael the Just answers', GOLD_HI, 3, true, true); X.ring(CX, CY, 0.5, 8, 0.9, GOLD_HI, 0.5); X.after(2.8, () => X.winStage()); }
      function nextRound() { S.round = Math.min(2, S.tags); const r = R(); cub.st = 'idle'; cub.stam = r.stam; cub.jukes = r.jukes; cub.rest = 0; S.decoyCd = 2.5;
        if (S.round === 1) X.banner('ONE TAG OF THREE', 'Quicker now, and it throws afterimages of light: only the real cub wears the crown and casts a shadow', GOLD_HI, 3.6, true);
        else X.banner('TWO TAGS OF THREE', 'Quicker still: it fades into the sunlight as it runs. Follow its gold dust and its shadow', GOLD_HI, 3.6, true); }
      // move a runner toward its goal at speed v, sliding along what it meets; never off the court
      function stepRunner(o, tx, ty, v, dt, turn) { const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy) || 1e-6, wvx = dx / d * v, wvy = dy / d * v, k = Math.min(1, dt * (turn || 9));
        o.vx += (wvx - o.vx) * k; o.vy += (wvy - o.vy) * k; return moveR(o, o.vx * dt, o.vy * dt); }
      function moveR(o, mx, my) { const x0 = o.x, y0 = o.y; const n = Math.max(1, Math.ceil(Math.hypot(mx, my) / 0.2));
        for (let s = 0; s < n; s++) { const nx = o.x + mx / n; if (!blockedAt(nx, o.y, CUB_R)) o.x = nx; else o.vx *= 0.3; const ny = o.y + my / n; if (!blockedAt(o.x, ny, CUB_R)) o.y = ny; else o.vy *= 0.3; }
        o.x = clamp(o.x, X0 + CUB_R, X1 - CUB_R); o.y = clamp(o.y, Y0 + CUB_R, Y1 - CUB_R); if (Math.abs(mx) > 0.01) o.face = mx < 0 ? -1 : 1; return Math.hypot(o.x - x0, o.y - y0); }
      function updateCub(dt) { const r = R(), d = Math.hypot(me.x - cub.x, me.y - cub.y);
        cub.laugh = Math.max(0, cub.laugh - dt); cub.flash = Math.max(0, cub.flash - dt * 1.6);
        // the hop over the pet when it is hemmed in
        if (cub.vault) { const V = cub.vault; V.t += dt; const u = Math.min(1, V.t / V.dur); cub.x = V.ax + (V.bx - V.ax) * u; cub.y = V.ay + (V.by - V.ay) * u; cub.z = Math.sin(u * Math.PI) * 1.6; cub.ph += dt * 10; if (u >= 1) { cub.vault = null; cub.z = 0; cub.dest = pickDest(cub, null, true); } return; }
        if (cub.juke) { const J = cub.juke; J.t += dt; moveR(cub, J.vx * dt, J.vy * dt); cub.ph += dt * 18; if (Math.random() < 0.7) X.part({ kind: 'ghost', x: cub.x, y: cub.y - 0.4, vx: 0, vy: 0, life: 0.2, max: 0.2, size: 1, color: GOLD }); if (J.t >= J.dur) { cub.juke = null; cub.dest = pickDest(cub, null, true); } return; }
        if (cub.st === 'rest') { cub.rest -= dt; cub.vx *= 0.8; cub.vy *= 0.8; cub.a += (1 - cub.a) * Math.min(1, dt * 6); if (Math.random() < dt * 3) X.part({ kind: 'smoke', x: cub.x + cub.face * 0.5, y: cub.y - 0.7, vx: cub.face * 0.6, vy: -0.6, life: 0.5, max: 0.5, size: 0.25, color: '#FFFFFF' });
          if (cub.rest <= 0) { cub.st = 'idle'; cub.stam = r.stam * 0.7; cub.jukes = r.jukes; } return; }
        const threat = d < r.alert;
        if (threat && cub.stam > 0) {
          if (cub.st !== 'run') { cub.st = 'run'; cub.dest = null; if (cub.said <= 0) { cub.said = 4; X.text(cub.x, cub.y - 1.8, ['Hee hee!', 'Too slow!', 'Over here!', 'Nyah!'][Math.floor(Math.random() * 4)], GOLD_HI, 13); } }
          // slip aside when the pet is right on it
          if (d < 1.45 && cub.jukes > 0) { const ax = (cub.x - me.x) / (d || 1), ay = (cub.y - me.y) / (d || 1); let best = null; for (const s of [1, -1]) { const jx = -ay * s * 0.8 + ax * 0.6, jy = ax * s * 0.8 + ay * 0.6, ex = cub.x + jx * 2.2, ey = cub.y + jy * 2.2; if (!blockedAt(ex, ey, CUB_R) && clearLine(cub.x, cub.y, ex, ey, CUB_R)) { const sc = Math.hypot(ex - me.x, ey - me.y) + Math.random(); if (!best || sc > best.sc) best = { jx, jy, sc }; } }
            if (best) { cub.jukes--; S.jukes++; cub.juke = { t: 0, dur: 0.28, vx: best.jx * 8, vy: best.jy * 8 }; X.sfx.giggle && X.sfx.giggle(); return; } }
          const unsafe = !cub.dest || Math.hypot(cub.dest.x - cub.x, cub.dest.y - cub.y) < 0.45 || Math.hypot(me.x - cub.dest.x, me.y - cub.dest.y) < Math.hypot(cub.x - cub.dest.x, cub.y - cub.dest.y) + 0.3 || segDist(cub.x, cub.y, cub.dest.x, cub.dest.y, me.x, me.y) < 1.1;
          if (unsafe) { const nd = pickDest(cub, null, true); if (nd) cub.dest = nd;
            else { cub.dest = null; } // (no open way that doesn't pass the pet: stand and taunt, never run into its arms)
            if (!cub.dest && d < 3.2) { // hemmed in: vault over the pet to open ground behind it
              let land = null; for (let k = 0; k < 16 && !land; k++) { const an = Math.atan2(me.y - cub.y, me.x - cub.x) + (Math.random() - 0.5) * 1.4, L = d + 2 + Math.random() * 1.5, x = clamp(cub.x + Math.cos(an) * L, X0 + 0.8, X1 - 0.8), y = clamp(cub.y + Math.sin(an) * L, Y0 + 0.8, Y1 - 0.8); if (!blockedAt(x, y, CUB_R + 0.1) && Math.hypot(x - me.x, y - me.y) > 1.6 && !pillarOn(cub.x, cub.y, x, y)) land = { x, y }; }
              if (land) { S.vaults++; cub.vault = { t: 0, dur: 0.6, ax: cub.x, ay: cub.y, bx: land.x, by: land.y }; cub.face = land.x < cub.x ? -1 : 1; X.text(cub.x, cub.y - 1.8, 'Wheee!', GOLD_HI, 14); X.sfx.giggle && X.sfx.giggle(); return; } } }
          // split into afterimages (from the second round)
          if (r.decoys && S.decoyCd <= 0 && d < 2.8 && !S.decoys.some(Boolean)) split();
          if (cub.dest) { const moved = stepRunner(cub, cub.dest.x, cub.dest.y, r.v, dt, 10); cub.ph += dt * r.v * 3.2; cub.stuck = moved < r.v * dt * 0.3 ? cub.stuck + dt : 0; if (cub.stuck > 0.35) { cub.stuck = 0; cub.dest = null; } }
          cub.stam -= dt;
          if (cub.stam <= 0) { cub.st = 'rest'; cub.rest = r.rest; S.rests++; cub.dest = null; X.text(cub.x, cub.y - 1.8, 'puff… puff…', '#FFFFFF', 13); }
        } else {
          // no one near (or out of breath): it trots about, catching its breath, and taunts
          if (cub.st === 'run') { cub.st = 'idle'; cub.dest = null; }
          cub.stam = Math.min(r.stam, cub.stam + dt * 0.9); cub.wander -= dt;
          if (!cub.dest || cub.wander <= 0 || Math.hypot(cub.dest.x - cub.x, cub.dest.y - cub.y) < 0.4) { cub.wander = 2 + Math.random() * 2; const nd = pickDest(cub, null, true); cub.dest = nd && Math.hypot(nd.x - cub.x, nd.y - cub.y) < 5 ? nd : cub.dest && Math.hypot(cub.dest.x - cub.x, cub.dest.y - cub.y) >= 0.4 ? cub.dest : null; }
          if (cub.dest) { stepRunner(cub, cub.dest.x, cub.dest.y, 1.3, dt, 6); cub.ph += dt * 4; } else { cub.vx *= 0.8; cub.vy *= 0.8; }
          if (cub.stam <= 0 && cub.st !== 'rest') { cub.st = 'rest'; cub.rest = r.rest; }
        }
        cub.said -= dt;
        // the third round: it fades into the sunlight while it dashes, and sheds gold dust
        const fast = Math.hypot(cub.vx, cub.vy) > 1.6, want = r.fade && cub.st === 'run' ? 0.22 : 1; cub.a += (want - cub.a) * Math.min(1, dt * 4);
        if (r.dust && fast) { S.dustT -= dt; if (S.dustT <= 0) { S.dustT = 0.08; S.dust.push({ x: cub.x + (Math.random() - 0.5) * 0.3, y: cub.y + (Math.random() - 0.5) * 0.25, t: 0, life: 5.5, s: 0.6 + Math.random() * 0.6, r: Math.random() * TAU }); if (S.dust.length > 120) S.dust.shift(); } }
      }
      function updateDecoys(dt) { const r = R();
        S.decoys.forEach((dc, k) => { if (!dc) return; dc.t += dt; if (dc.t >= dc.life) { popDecoy(k, false); return; }
          if (Math.hypot(dc.dest.x - dc.x, dc.dest.y - dc.y) < 0.45) { dc.dest = pickDest(dc, null, true) || dc.dest; }
          const moved = stepRunner(dc, dc.dest.x, dc.dest.y, r.v * 0.95, dt, 10); dc.ph += dt * r.v * 3.2; if (moved < 0.02) dc.dest = pickDest(dc, null, false) || dc.dest;
          if (dc.t > 0.35 && Math.hypot(me.x - dc.x, me.y - dc.y) < TAG_D) popDecoy(k, true); });
        S.decoyCd -= dt; }
      return { S, cub, CX, CY, X0, Y0, X1, Y1, ROUNDS, blockedAt,
        cam() { return { x: CX, y: CY + 1.2, k: 1, zoom: 0.62 }; },
        update(dt) { cubObj.x = cub.x; cubObj.y = cub.y; S.decoys.forEach((d, k) => { decoyObjs[k].x = d ? d.x : -99; decoyObjs[k].y = d ? d.y : -99; });
          for (const q of S.dust) q.t += dt; S.dust = S.dust.filter(q => q.t < q.life);
          if (S.won || S.intro) { cub.laugh = Math.max(0, cub.laugh - dt); return; }
          // the catch ceremony: the crown flashes up, the cub laughs, then it resets across the court
          if (S.cer) { const C = S.cer; C.t += dt; cub.crownUp = C.t < 1.4 ? Math.sin(Math.min(1, C.t / 1.4) * Math.PI) : 0; cub.flash = C.t < 0.3 ? 1 : Math.max(0, 1 - (C.t - 0.3) / 0.9);
            if (C.t > 0.55 && !C.laughed) { C.laughed = true; cub.laugh = 1.4; X.sfx.giggle && X.sfx.giggle(); X.text(cub.x, cub.y - 1.6, S.tags >= 3 ? 'You win! The crown is yours!' : S.tags === 1 ? 'Hee hee! You got me! Again!' : 'Ha ha! Once more!', '#FFFFFF', 14); }
            if (S.tags >= 3 && C.t > 1.2) { S.cer = null; cub.crownUp = 0; cub.st = 'idle'; win(); return; }
            if (C.t > 1.8 && !C.moved) { C.moved = true; X.ring(cub.x, cub.y - 0.4, 0.2, 1.1, 0.35, GOLD_HI, 0.3); let best = null, bd = -1; for (let k = 0; k < 40; k++) { const x = X0 + 1.2 + Math.random() * (CW - 2.4), y = Y0 + 1.2 + Math.random() * (CH - 2.4); if (blockedAt(x, y, CUB_R + 0.2)) continue; const dd = Math.hypot(x - me.x, y - me.y) - Math.hypot(x - CX, y - CY) * 0.4; if (dd > bd) { bd = dd; best = { x, y }; } } if (best) { cub.x = best.x; cub.y = best.y; } cub.vx = cub.vy = 0; X.ring(cub.x, cub.y - 0.4, 0.1, 1.1, 0.35, GOLD_HI, 0.3); cub.st = 'gone'; }
            if (C.t > 2.0 && cub.st === 'gone') cub.st = 'caught';
            if (C.t > 2.4) { S.cer = null; nextRound(); }
            return; }
          // a tag: the pet touches the real cub
          if (!me.dead && Math.hypot(me.x - cub.x, me.y - cub.y) < TAG_D && !cub.vault) { tag(); return; }
          updateCub(dt); updateDecoys(dt);
          if (cub.x < X0 || cub.x > X1 || cub.y < Y0 || cub.y > Y1) S.outside++; },
        goal() { if (S.won) return 'Leo wakes'; if (S.intro) return 'The Crown Chase'; if (S.cer) return `Tags ${S.tags}/3 · tagged!`;
          return `Tags ${S.tags}/3 · catch the crown-bearer${cub.st === 'rest' ? ' · it\'s puffing: now!' : S.round === 1 ? ' · the crown & shadow are real' : S.round === 2 ? ' · follow the gold dust' : ''}`; },
        hint() { return null; },
        drawGround(c) { const T = X.Tz(), t = g.t, W = X.W(), Hh = X.H(), sx0 = X.sx(X0), sy0 = X.sy(Y0), sx1 = X.sx(X1), sy1 = X.sy(Y1), mx = (sx0 + sx1) / 2;
          // ---- the sky of light ----
          c.save(); const sk = c.createLinearGradient(0, 0, 0, Hh); sk.addColorStop(0, '#FFE6A0'); sk.addColorStop(0.35, '#FFF3D2'); sk.addColorStop(0.75, '#FDEEDC'); sk.addColorStop(1, '#F6E2C8'); c.fillStyle = sk; c.fillRect(0, 0, W, Hh);
          // ---- the great sun disc behind the court, with a lion's face in relief ----
          const sunX = mx, sunY = sy0 - T * 1.2, sunR = T * 4.6;
          glowAt(c, sunX, sunY, sunR * 3.2, SUN, 0.55); glowAt(c, sunX, sunY, sunR * 1.8, '#FFFFFF', 0.5);
          c.save(); c.translate(sunX, sunY); c.rotate(t * 0.05); c.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 24; k++) { const an = k / 24 * TAU, L = sunR * (k % 2 ? 1.7 : 2.4), w = 0.07; c.globalAlpha = k % 2 ? 0.16 : 0.22; c.fillStyle = k % 2 ? '#FFFFFF' : SUN; c.beginPath(); c.moveTo(Math.cos(an - w) * sunR * 0.95, Math.sin(an - w) * sunR * 0.95); c.lineTo(Math.cos(an) * L, Math.sin(an) * L); c.lineTo(Math.cos(an + w) * sunR * 0.95, Math.sin(an + w) * sunR * 0.95); c.closePath(); c.fill(); }
          c.restore();
          { const sg = c.createRadialGradient(sunX - sunR * 0.3, sunY - sunR * 0.35, sunR * 0.1, sunX, sunY, sunR); sg.addColorStop(0, '#FFFDF0'); sg.addColorStop(0.45, '#FFE88E'); sg.addColorStop(0.85, '#F7C44C'); sg.addColorStop(1, '#E6A630'); c.fillStyle = sg; c.beginPath(); c.arc(sunX, sunY, sunR, 0, TAU); c.fill(); c.strokeStyle = GOLD_D; c.lineWidth = T * 0.12; c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = T * 0.04; c.beginPath(); c.arc(sunX, sunY, sunR * 0.93, 0, TAU); c.stroke();
            // the lion: a mane of flames round a calm face, in raised gold
            c.save(); c.translate(sunX, sunY + sunR * 0.05); c.strokeStyle = 'rgba(176,127,30,.55)'; c.fillStyle = 'rgba(255,246,210,.35)'; c.lineWidth = T * 0.07; c.lineJoin = 'round';
            c.beginPath(); for (let k = 0; k <= 32; k++) { const an = k / 32 * TAU, rr = sunR * (k % 2 ? 0.58 : 0.74); const x = Math.cos(an) * rr, y = Math.sin(an) * rr; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.fill(); c.stroke();
            c.fillStyle = 'rgba(255,236,170,.55)'; c.beginPath(); c.arc(0, 0, sunR * 0.46, 0, TAU); c.fill(); c.stroke();
            c.lineWidth = T * 0.06; c.beginPath(); c.arc(-sunR * 0.17, -sunR * 0.08, sunR * 0.07, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.beginPath(); c.arc(sunR * 0.17, -sunR * 0.08, sunR * 0.07, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
            c.beginPath(); c.moveTo(-sunR * 0.08, sunR * 0.08); c.lineTo(sunR * 0.08, sunR * 0.08); c.lineTo(0, sunR * 0.17); c.closePath(); c.fillStyle = 'rgba(176,127,30,.55)'; c.fill();
            c.beginPath(); c.moveTo(0, sunR * 0.17); c.lineTo(0, sunR * 0.24); c.moveTo(-sunR * 0.13, sunR * 0.26); c.quadraticCurveTo(-sunR * 0.06, sunR * 0.3, 0, sunR * 0.24); c.quadraticCurveTo(sunR * 0.06, sunR * 0.3, sunR * 0.13, sunR * 0.26); c.stroke(); c.restore();
            c.fillStyle = 'rgba(255,255,255,.4)'; ell(c, sunX - sunR * 0.45, sunY - sunR * 0.5, sunR * 0.25, sunR * 0.13); c.fill(); }
          // ---- the clouds the court floats on ----
          const cloud = (x, y, r, a) => { c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(214,190,160,.35)'; ell(c, x, y + r * 0.35, r * 1.8, r * 0.45); c.fill(); c.fillStyle = '#FFFFFF'; ell(c, x, y, r * 1.6, r * 0.55); c.fill(); ell(c, x - r * 0.7, y - r * 0.25, r * 0.8, r * 0.55); c.fill(); ell(c, x + r * 0.55, y - r * 0.35, r * 0.95, r * 0.62); c.fill(); c.fillStyle = 'rgba(255,236,190,.5)'; ell(c, x + r * 0.4, y - r * 0.55, r * 0.6, r * 0.25); c.fill(); c.restore(); };
          for (let k = 0; k < 6; k++) { const u = ((t * 0.012 * (1 + k % 3 * 0.4) + k * 0.19) % 1.4) - 0.2; cloud(u * W, Hh * (0.08 + k * 0.15), T * (1.2 + (k % 3) * 0.5), 0.75); }
          // ---- banners on gold poles at the court's top corners ----
          for (const s of [-1, 1]) { const px = s < 0 ? sx0 - T * 0.9 : sx1 + T * 0.9, py0 = sy0 + T * 0.6, py1 = sy0 - T * 4.2; c.save(); c.lineCap = 'round';
            c.strokeStyle = INK; c.lineWidth = T * 0.16; c.beginPath(); c.moveTo(px, py0); c.lineTo(px, py1); c.stroke(); const pg = c.createLinearGradient(px - T * 0.08, 0, px + T * 0.08, 0); pg.addColorStop(0, GOLD_D); pg.addColorStop(0.5, GOLD_HI); pg.addColorStop(1, GOLD_D); c.strokeStyle = pg; c.lineWidth = T * 0.1; c.stroke();
            glowAt(c, px, py1, T * 0.7, CIT, 0.6); c.fillStyle = CIT; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.arc(px, py1, T * 0.15, 0, TAU); c.fill(); c.stroke();
            const bw = T * 1.1, bh = T * 2.4, top = py1 + T * 0.35, wave = Math.sin(t * 2 + s) * T * 0.08, bx = px - s * T * 0.05 - bw / 2 + s * bw * 0.5 * 0; c.beginPath(); c.moveTo(px - bw / 2, top); c.lineTo(px + bw / 2, top); c.quadraticCurveTo(px + bw / 2 + wave, top + bh * 0.5, px + bw / 2, top + bh); c.lineTo(px, top + bh - T * 0.35); c.lineTo(px - bw / 2, top + bh); c.quadraticCurveTo(px - bw / 2 + wave, top + bh * 0.5, px - bw / 2, top); c.closePath(); void bx;
            const bg = c.createLinearGradient(px - bw / 2, 0, px + bw / 2, 0); bg.addColorStop(0, '#E9E0CF'); bg.addColorStop(0.45, '#FFFFFF'); bg.addColorStop(1, '#DCD0B8'); c.fillStyle = bg; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
            c.strokeStyle = GOLD; c.lineWidth = T * 0.08; c.beginPath(); c.moveTo(px - bw / 2 + T * 0.1, top + T * 0.15); c.lineTo(px + bw / 2 - T * 0.1, top + T * 0.15); c.stroke();
            c.fillStyle = GOLD; c.strokeStyle = GOLD_D; c.lineWidth = 1.2; const cy2 = top + bh * 0.45; c.beginPath(); for (let k = 0; k < 16; k++) { const an = k / 16 * TAU, rr = T * (k % 2 ? 0.2 : 0.34); c.lineTo(px + Math.cos(an) * rr, cy2 + Math.sin(an) * rr); } c.closePath(); c.fill(); c.stroke(); c.fillStyle = CIT_HI; c.beginPath(); c.arc(px, cy2, T * 0.12, 0, TAU); c.fill();
            c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px - bw / 2, top); c.lineTo(px + bw / 2, top); c.lineTo(px + bw / 2, top - T * 0.12); c.lineTo(px - bw / 2, top - T * 0.12); c.closePath(); c.fill(); c.stroke(); c.restore(); }
          // ---- the court: a slab of marble, its front face set with lion medallions ----
          const th = T * 0.75;
          c.fillStyle = 'rgba(120,80,30,.16)'; ell(c, mx, sy1 + th + T * 0.6, (sx1 - sx0) * 0.62, T * 1.1); c.fill();
          for (let k = 0; k < 5; k++) cloud(sx0 + (sx1 - sx0) * (k / 4) + Math.sin(t * 0.3 + k) * T * 0.3, sy1 + th + T * (0.5 + (k % 2) * 0.35), T * (1.3 + (k % 2) * 0.3), 0.92);
          { const fg = c.createLinearGradient(0, sy1, 0, sy1 + th); fg.addColorStop(0, MARBLE_D); fg.addColorStop(1, MARBLE_DD); c.fillStyle = fg; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(sx0, sy1, sx1 - sx0, th); c.strokeRect(sx0, sy1, sx1 - sx0, th);
            c.fillStyle = GOLD; c.fillRect(sx0, sy1 + th * 0.12, sx1 - sx0, th * 0.12); c.fillStyle = GOLD_D; c.fillRect(sx0, sy1 + th * 0.8, sx1 - sx0, th * 0.08);
            for (let k = 0; k < 3; k++) { const qx = sx0 + (sx1 - sx0) * (0.2 + k * 0.3), qy = sy1 + th * 0.52, r = th * 0.34; const mg = c.createRadialGradient(qx - r * 0.3, qy - r * 0.3, 0, qx, qy, r); mg.addColorStop(0, GOLD_HI); mg.addColorStop(1, GOLD_D); c.fillStyle = mg; c.beginPath(); for (let j = 0; j < 16; j++) { const an = j / 16 * TAU, rr = r * (j % 2 ? 0.78 : 1); c.lineTo(qx + Math.cos(an) * rr, qy + Math.sin(an) * rr); } c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(); c.fillStyle = '#F7D47A'; c.beginPath(); c.arc(qx, qy, r * 0.5, 0, TAU); c.fill(); c.strokeStyle = GOLD_DD; c.lineWidth = 1; c.beginPath(); c.arc(qx - r * 0.18, qy - r * 0.08, r * 0.08, 0, TAU); c.arc(qx + r * 0.18, qy - r * 0.08, r * 0.08, 0, TAU); c.fillStyle = GOLD_DD; c.fill(); } }
          // the top face: warm marble tiles, veined, lit from the sun
          { const tg = c.createLinearGradient(0, sy0, 0, sy1); tg.addColorStop(0, MARBLE_HI); tg.addColorStop(0.5, MARBLE); tg.addColorStop(1, '#EFE5CF'); c.fillStyle = tg; c.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0); }
          c.save(); c.beginPath(); c.rect(sx0, sy0, sx1 - sx0, sy1 - sy0); c.clip();
          for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) if ((i + j) % 2) { c.fillStyle = 'rgba(232,214,176,.32)'; c.fillRect(X.sx(X0 + i), X.sy(Y0 + j), T, T); }
          c.strokeStyle = 'rgba(170,140,90,.32)'; c.lineWidth = 1; c.beginPath(); for (let i = 1; i < CW; i++) { const x = X.sx(X0 + i); c.moveTo(x, sy0); c.lineTo(x, sy1); } for (let j = 1; j < CH; j++) { const y = X.sy(Y0 + j); c.moveTo(sx0, y); c.lineTo(sx1, y); } c.stroke();
          c.strokeStyle = 'rgba(190,170,130,.4)'; c.lineWidth = 1; c.beginPath(); for (let k = 0; k < 14; k++) { const x0 = X.sx(X0 + (k * 3.7) % CW), y0 = X.sy(Y0 + (k * 2.3 + 0.6) % CH); c.moveTo(x0, y0); c.bezierCurveTo(x0 + T * 0.5, y0 + T * 0.2, x0 + T * 0.6, y0 + T * 0.9, x0 + T * 1.3, y0 + T * 1.1); } c.stroke();
          // the sunburst mosaic at the heart of the court, with Leo's sign inlaid
          { const qx = X.sx(CX), qy = X.sy(CY), R0 = T * 2.6; glowAt(c, qx, qy, R0 * 1.4, SUN, 0.35);
            for (let k = 0; k < 16; k++) { const a0 = k / 16 * TAU + t * 0.02, a1 = a0 + TAU / 16; c.fillStyle = k % 2 ? 'rgba(255,200,80,.5)' : 'rgba(255,236,170,.55)'; c.beginPath(); c.moveTo(qx, qy); c.arc(qx, qy, R0, a0, a1); c.closePath(); c.fill(); }
            c.strokeStyle = GOLD; c.lineWidth = T * 0.12; c.beginPath(); c.arc(qx, qy, R0, 0, TAU); c.stroke(); c.strokeStyle = GOLD_D; c.lineWidth = T * 0.04; c.beginPath(); c.arc(qx, qy, R0 + T * 0.12, 0, TAU); c.stroke();
            for (let k = 0; k < 12; k++) { const an = k / 12 * TAU, gx = qx + Math.cos(an) * R0, gy = qy + Math.sin(an) * R0; c.fillStyle = CIT; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(gx, gy - T * 0.13); c.lineTo(gx + T * 0.09, gy); c.lineTo(gx, gy + T * 0.13); c.lineTo(gx - T * 0.09, gy); c.closePath(); c.fill(); c.stroke(); }
            const ig = c.createRadialGradient(qx - T * 0.3, qy - T * 0.3, 0, qx, qy, T * 1.15); ig.addColorStop(0, '#FFFBEA'); ig.addColorStop(1, '#F8DE92'); c.fillStyle = ig; c.beginPath(); c.arc(qx, qy, T * 1.15, 0, TAU); c.fill(); c.strokeStyle = GOLD; c.lineWidth = T * 0.07; c.stroke();
            const s = T * 0.075; c.save(); c.translate(qx - 12 * s, qy - 12 * s); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = GOLD_DD; c.lineWidth = 3.4; c.stroke(new Path2D(LEO)); c.strokeStyle = GOLD; c.lineWidth = 2; c.stroke(new Path2D(LEO)); c.restore(); }
          // lion-paw prints in gold, crossing the court (the cub's own path, set in the stone)
          c.fillStyle = 'rgba(214,160,50,.3)'; for (let k = 0; k < 7; k++) { const px = X.sx(X0 + 1.2 + k * 1.5), py = X.sy(Y0 + 13.6 - (k % 2) * 0.5 - k * 0.18); ell(c, px, py, T * 0.13, T * 0.11); c.fill(); for (let j = 0; j < 3; j++) { ell(c, px + (j - 1) * T * 0.1, py - T * 0.16, T * 0.045, T * 0.05); c.fill(); } }
          // the light pooling round each pillar
          for (const [i, j] of PILLARS) glowAt(c, X.sx(X0 + i + 0.5), X.sy(Y0 + j + 0.6), T * 1.6, CIT, 0.25);
          c.restore();
          // the gold border, studded with citrine
          c.save(); c.strokeStyle = INK; c.lineWidth = T * 0.3 + 2; c.strokeRect(sx0 + T * 0.15, sy0 + T * 0.15, sx1 - sx0 - T * 0.3, sy1 - sy0 - T * 0.3); c.strokeStyle = GOLD; c.lineWidth = T * 0.3 - 1; c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = T * 0.08; c.strokeRect(sx0 + T * 0.12, sy0 + T * 0.12, sx1 - sx0 - T * 0.24, sy1 - sy0 - T * 0.24);
          for (let i = 1; i < CW; i += 2) for (const y of [sy0 + T * 0.15, sy1 - T * 0.15]) { const x = X.sx(X0 + i); glowAt(c, x, y, T * 0.3, CIT, 0.35 + 0.2 * Math.sin(t * 3 + i)); c.fillStyle = CIT; c.strokeStyle = GOLD_DD; c.lineWidth = 1; c.beginPath(); c.arc(x, y, T * 0.08, 0, TAU); c.fill(); c.stroke(); }
          for (let j = 1; j < CH; j += 2) for (const x of [sx0 + T * 0.15, sx1 - T * 0.15]) { const y = X.sy(Y0 + j); c.fillStyle = CIT; c.strokeStyle = GOLD_DD; c.lineWidth = 1; c.beginPath(); c.arc(x, y, T * 0.08, 0, TAU); c.fill(); c.stroke(); }
          c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(sx0, sy0, sx1 - sx0, sy1 - sy0); c.restore();
          // corner bosses: a gold sun on each corner
          for (const [x, y] of [[sx0, sy0], [sx1, sy0], [sx0, sy1], [sx1, sy1]]) { c.save(); c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); for (let k = 0; k < 16; k++) { const an = k / 16 * TAU, rr = T * (k % 2 ? 0.22 : 0.36); c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } c.closePath(); c.fill(); c.stroke(); const cg = c.createRadialGradient(x - T * 0.05, y - T * 0.05, 0, x, y, T * 0.17); cg.addColorStop(0, '#FFFFFF'); cg.addColorStop(0.5, CIT_HI); cg.addColorStop(1, CIT_D); c.fillStyle = cg; c.beginPath(); c.arc(x, y, T * 0.17, 0, TAU); c.fill(); c.stroke(); c.restore(); }
          // ---- the gold dust the cub sheds in the third round ----
          for (const q of S.dust) { const k = 1 - q.t / q.life, a = Math.min(1, q.t / 0.2) * k, x = X.sx(q.x), y = X.sy(q.y); glowAt(c, x, y, T * 0.4 * q.s, GOLD, 0.5 * a); c.save(); c.globalAlpha = a; c.fillStyle = GOLD_HI; c.translate(x, y); c.rotate(q.r + t * 0.5); const s = T * 0.09 * q.s; c.beginPath(); c.moveTo(0, -s * 2); c.lineTo(s * 0.5, -s * 0.5); c.lineTo(s * 2, 0); c.lineTo(s * 0.5, s * 0.5); c.lineTo(0, s * 2); c.lineTo(-s * 0.5, s * 0.5); c.lineTo(-s * 2, 0); c.lineTo(-s * 0.5, -s * 0.5); c.closePath(); c.fill(); c.fillStyle = CIT; c.beginPath(); c.arc(0, 0, s * 0.5, 0, TAU); c.fill(); c.restore(); }
          // the cub's breath meter, as a ring under it while it runs
          if (!S.intro && !S.won && !S.cer && (cub.st === 'run' || cub.st === 'rest')) { const x = X.sx(cub.x), y = X.sy(cub.y), k = cub.st === 'rest' ? 0 : clamp(cub.stam / R().stam, 0, 1); c.save(); c.globalAlpha = cub.st === 'rest' ? 0.9 : 0.45 * Math.max(0.35, cub.a); c.strokeStyle = cub.st === 'rest' ? '#FFFFFF' : GOLD; c.lineWidth = 2.5; c.beginPath(); c.ellipse(x, y, T * 0.62, T * 0.26, 0, -Math.PI / 2, -Math.PI / 2 + TAU * (cub.st === 'rest' ? 1 - cub.rest / R().rest : k)); c.stroke(); c.restore(); }
          c.restore(); },
        drawOver(c) { const T = X.Tz(), t = g.t, W = X.W(), Hh = X.H();
          // shafts of sunlight falling across the court
          c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const x0 = W * (0.1 + k * 0.28) + Math.sin(t * 0.2 + k) * T * 0.6, w = T * (1.2 + (k % 2) * 0.8), a = 0.05 + 0.02 * Math.sin(t * 0.7 + k * 2); const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, `rgba(255,236,170,${a * 1.6})`); gr.addColorStop(1, 'rgba(255,236,170,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + w, 0); c.lineTo(x0 + w + Hh * 0.35, Hh); c.lineTo(x0 + Hh * 0.35, Hh); c.closePath(); c.fill(); } c.restore();
          // motes and citrine glints drifting in the light
          for (const m of S.motes) { const x = X.sx(m.x + Math.sin(t * 0.4 + m.ph) * 0.6), y = X.sy(m.y - ((t * 0.25 * m.s + m.ph) % 3)), tw = 0.5 + 0.5 * Math.sin(t * 3 * m.s + m.ph); glowAt(c, x, y, T * 0.25 * m.s, CIT_HI, 0.5 * tw); if (tw > 0.85) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (tw - 0.85) / 0.15; c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.2; const s = T * 0.16; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x + s, y); c.moveTo(x, y - s); c.lineTo(x, y + s); c.stroke(); c.restore(); } } },
      };
      // a marble pillar: plinth, fluted shaft shaded round, gold capital, a citrine flame on top
      function drawPillar(c, Xs, Ys, T, seed) { const t = g.t, w = T * 0.62, h = T * 2.1, top = Ys - h; c.save(); c.lineJoin = 'round';
        c.fillStyle = 'rgba(110,72,14,.22)'; ell(c, Xs + T * 0.18, Ys - T * 0.02, T * 0.62, T * 0.2); c.fill();
        // the plinth
        c.fillStyle = MARBLE_D; c.strokeStyle = INK; c.lineWidth = 1.8; c.fillRect(Xs - T * 0.48, Ys - T * 0.3, T * 0.96, T * 0.3); c.strokeRect(Xs - T * 0.48, Ys - T * 0.3, T * 0.96, T * 0.3); c.fillStyle = MARBLE_HI; c.fillRect(Xs - T * 0.48, Ys - T * 0.42, T * 0.96, T * 0.12); c.strokeRect(Xs - T * 0.48, Ys - T * 0.42, T * 0.96, T * 0.12); c.fillStyle = GOLD; c.fillRect(Xs - T * 0.48, Ys - T * 0.2, T * 0.96, T * 0.05);
        // the shaft
        const sg = c.createLinearGradient(Xs - w / 2, 0, Xs + w / 2, 0); sg.addColorStop(0, MARBLE_DD); sg.addColorStop(0.3, MARBLE_HI); sg.addColorStop(0.55, MARBLE); sg.addColorStop(1, '#B8A988'); c.fillStyle = sg; c.fillRect(Xs - w / 2, top + T * 0.3, w, h - T * 0.72); c.strokeRect(Xs - w / 2, top + T * 0.3, w, h - T * 0.72);
        c.strokeStyle = 'rgba(140,120,80,.4)'; c.lineWidth = 1; c.beginPath(); for (let k = 1; k < 5; k++) { const x = Xs - w / 2 + w * k / 5; c.moveTo(x, top + T * 0.36); c.lineTo(x, Ys - T * 0.48); } c.stroke();
        c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1.4; c.fillRect(Xs - w / 2 - 1, Ys - T * 0.62, w + 2, T * 0.08); c.strokeRect(Xs - w / 2 - 1, Ys - T * 0.62, w + 2, T * 0.08);
        // the capital: a gold block with a lion's face roundel
        const cg = c.createLinearGradient(Xs - T * 0.5, 0, Xs + T * 0.5, 0); cg.addColorStop(0, GOLD_D); cg.addColorStop(0.35, GOLD_HI); cg.addColorStop(0.65, GOLD); cg.addColorStop(1, GOLD_DD); c.fillStyle = cg; c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(Xs - w / 2, top + T * 0.3); c.lineTo(Xs - T * 0.5, top + T * 0.08); c.lineTo(Xs + T * 0.5, top + T * 0.08); c.lineTo(Xs + w / 2, top + T * 0.3); c.closePath(); c.fill(); c.stroke();
        c.fillRect(Xs - T * 0.52, top - T * 0.06, T * 1.04, T * 0.14); c.strokeRect(Xs - T * 0.52, top - T * 0.06, T * 1.04, T * 0.14);
        { const rx = Xs, ry = top + T * 0.66, r = T * 0.17; c.fillStyle = GOLD; c.beginPath(); for (let k = 0; k < 12; k++) { const an = k / 12 * TAU, rr = r * (k % 2 ? 0.75 : 1.05); c.lineTo(rx + Math.cos(an) * rr, ry + Math.sin(an) * rr); } c.closePath(); c.fill(); c.lineWidth = 1; c.stroke(); c.fillStyle = '#F7D47A'; c.beginPath(); c.arc(rx, ry, r * 0.55, 0, TAU); c.fill(); c.fillStyle = GOLD_DD; c.beginPath(); c.arc(rx - r * 0.2, ry - r * 0.1, r * 0.09, 0, TAU); c.arc(rx + r * 0.2, ry - r * 0.1, r * 0.09, 0, TAU); c.fill(); }
        // the citrine flame on top
        const fy = top - T * 0.12, fl = 1 + 0.1 * Math.sin(t * 7 + seed); glowAt(c, Xs, fy - T * 0.3, T * 1.2, CIT, 0.55); glowAt(c, Xs, fy - T * 0.3, T * 0.5, '#FFFFFF', 0.5);
        c.fillStyle = GOLD_D; c.strokeStyle = INK; c.lineWidth = 1.4; ell(c, Xs, fy, T * 0.3, T * 0.1); c.fill(); c.stroke();
        const gg = c.createRadialGradient(Xs - T * 0.06, fy - T * 0.36, 0, Xs, fy - T * 0.28, T * 0.3); gg.addColorStop(0, '#FFFFFF'); gg.addColorStop(0.35, CIT_HI); gg.addColorStop(0.8, CIT); gg.addColorStop(1, CIT_D); c.fillStyle = gg; c.beginPath(); c.moveTo(Xs, fy - T * 0.62 * fl); c.quadraticCurveTo(Xs + T * 0.26, fy - T * 0.25, Xs, fy - T * 0.04); c.quadraticCurveTo(Xs - T * 0.26, fy - T * 0.25, Xs, fy - T * 0.62 * fl); c.closePath(); c.fill(); c.lineWidth = 1.2; c.stroke();
        c.restore(); }
      // a low laurel hedge in a gold-banded marble planter, flecked with golden blossoms
      function drawHedge(c, x0, y0, w, h, T, seed) { const t = g.t; c.save(); c.lineJoin = 'round';
        c.fillStyle = 'rgba(110,72,14,.2)'; c.fillRect(x0 + T * 0.12, y0 + h - T * 0.05, w, T * 0.18);
        const bh = T * 0.42, by = y0 + h - bh; const pg = c.createLinearGradient(0, by, 0, by + bh); pg.addColorStop(0, MARBLE_HI); pg.addColorStop(1, MARBLE_D); c.fillStyle = pg; c.strokeStyle = INK; c.lineWidth = 1.8; c.fillRect(x0 + T * 0.04, by, w - T * 0.08, bh); c.strokeRect(x0 + T * 0.04, by, w - T * 0.08, bh); c.fillStyle = GOLD; c.fillRect(x0 + T * 0.04, by + bh * 0.2, w - T * 0.08, bh * 0.16); c.fillStyle = GOLD_D; c.fillRect(x0 + T * 0.04, by + bh * 0.36, w - T * 0.08, bh * 0.05);
        // the foliage: rows of shaded leaf-balls over the planter's top
        const cols = Math.max(2, Math.round(w / T * 2)), rows = Math.max(1, Math.round(h / T * 1.6)), fx0 = x0 + T * 0.1, fw = w - T * 0.2, ftop = y0 - T * 0.45, fh = (by - ftop);
        c.fillStyle = LEAF_D; c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.roundRect ? c.roundRect(fx0, ftop + T * 0.15, fw, fh - T * 0.1, T * 0.3) : c.rect(fx0, ftop + T * 0.15, fw, fh - T * 0.1); c.fill(); c.stroke();
        for (let r = 0; r < rows + 1; r++) for (let k = 0; k < cols; k++) { const bx = fx0 + fw * (k + 0.5) / cols + ((r % 2) ? fw / cols * 0.25 : 0) * (k < cols - 1 ? 1 : 0), byy = ftop + T * 0.32 + (fh - T * 0.45) * (r / Math.max(1, rows)), rr = T * (0.3 + 0.04 * Math.sin(seed + k * 2 + r));
          const lg = c.createRadialGradient(bx - rr * 0.35, byy - rr * 0.4, rr * 0.1, bx, byy, rr); lg.addColorStop(0, LEAF_HI); lg.addColorStop(0.55, LEAF); lg.addColorStop(1, LEAF_D); c.fillStyle = lg; c.beginPath(); c.arc(bx, byy, rr, 0, TAU); c.fill(); c.strokeStyle = 'rgba(30,60,25,.6)'; c.lineWidth = 1; c.stroke(); }
        for (let k = 0; k < cols * 2; k++) { const bx = fx0 + fw * ((k * 0.37 + 0.13) % 1), byy = ftop + T * 0.2 + fh * 0.6 * ((k * 0.61 + 0.2) % 1), tw = 0.5 + 0.5 * Math.sin(t * 2.5 + k + seed); c.fillStyle = k % 3 ? GOLD_HI : CIT; c.strokeStyle = GOLD_D; c.lineWidth = 0.8; for (let j = 0; j < 5; j++) { const an = j / 5 * TAU; ell(c, bx + Math.cos(an) * T * 0.06, byy + Math.sin(an) * T * 0.06, T * 0.05, T * 0.05); c.fill(); } c.fillStyle = CIT_D; c.beginPath(); c.arc(bx, byy, T * 0.03, 0, TAU); c.fill(); if (tw > 0.9) glowAt(c, bx, byy, T * 0.3, CIT_HI, (tw - 0.9) * 6); }
        c.restore(); }
    },
  });
})();
