/* ---------- Gate 09, Libra: The Suspended Garden ----------
   A great marble board hangs from four gold chains over a garden in the sky. The board leans toward wherever the pet
   stands on it (the pet's offset from the centre is the tilt, eased), and a luminous pearl rolls on it under that tilt:
   it speeds up down the slope, slows on the flat, rebounds from the gold rim. Three blossom cups stand on the board; one
   is open at a time. Roll the pearl into the open cup and it blooms; a new pearl appears at the centre for the next.
   Holes pierce the board: a pearl that rolls into one falls through (the sky garden far below) and a new one appears at
   the centre after a moment. After the first cup, gold weights drop onto the board and each pulls it toward itself for a
   while; after the second, a hole wanders the board. Three pearls set, and Libra wakes. */
(() => {
  const TAU = Math.PI * 2, INK = '#2A2538', GOLD = '#E8C46A', GOLD_HI = '#FFF0B8', GOLD_D = '#A8842C', MARBLE = '#F1EBDD', MARBLE_HI = '#FFFFFF', MARBLE_D = '#B9AE9B', MARBLE_DD = '#8E8474', SKY = '#BFDAFF', SKY_LO = '#EAF2FF', PINK = '#FFC2DA', PINK_D = '#D97BA3', SAPPH = '#4F8FF0', PEARL = '#F6FAFF';
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const ell = (c, x, y, rx, ry) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), ch = s => Math.round((A >> s & 255) + ((B >> s & 255) - (A >> s & 255)) * k); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
  const LIBRA = 'M3.5 20h17M3.5 15.5h5.6a3.6 3.6 0 1 1 5.8 0h5.6';
  // the board: BW × BH tiles of floor in a sky of gaps; the pet starts at its centre
  const BW = 11, BH = 9, MG = 3, HW = BW / 2, HH = BH / 2, RIM = 0.35, PR = 0.32, HR = 0.5, CUP_R = 0.55, LIFT = 1.25, TH = 0.5, G_ACC = 6.5;
  const LAYOUT = (() => { const W = BW + MG * 2, Hh = BH + MG * 2, g = Array.from({ length: Hh }, () => Array(W).fill('~'));
    for (let y = MG; y < MG + BH; y++) for (let x = MG; x < MG + BW; x++) g[y][x] = '.'; g[MG + (BH >> 1)][MG + (BW >> 1)] = 'S'; return g.map(r => r.join('')); })();
  // the cups (in order) and the holes, as offsets from the board's centre
  const CUPS = [[3.6, -2.4], [-3.9, 2.3], [0.8, 3.1]], HOLES = [[-2.4, -2.2], [3.2, 0.9], [3.6, 2.5], [-1.2, 2.6]];
  const DRIFT = { rx: 2.2, ry: 1.5, w: 0.26 };   // the wandering hole's path round the centre
  function weightShape(c, X, Y, s, lit) { c.save(); c.translate(X, Y); c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 2;
    const gr = c.createLinearGradient(-s * 0.5, 0, s * 0.5, 0); gr.addColorStop(0, GOLD_D); gr.addColorStop(0.45, GOLD_HI); gr.addColorStop(1, GOLD_D); c.fillStyle = gr;
    c.beginPath(); c.moveTo(-s * 0.32, -s * 0.55); c.lineTo(s * 0.32, -s * 0.55); c.lineTo(s * 0.5, 0); c.lineTo(-s * 0.5, 0); c.closePath(); c.fill(); c.stroke();
    ell(c, 0, 0, s * 0.5, s * 0.16); c.fillStyle = GOLD_D; c.fill(); c.stroke(); c.beginPath(); c.arc(0, -s * 0.7, s * 0.16, 0, TAU); c.strokeStyle = INK; c.lineWidth = s * 0.1 + 2; c.stroke(); c.strokeStyle = GOLD; c.lineWidth = s * 0.1; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(-s * 0.2, -s * 0.5, s * 0.1, s * 0.4); if (lit) glowAt(c, 0, -s * 0.3, s * 0.9, GOLD, 0.35); c.restore(); }

  defGate('basilica', {
    name: 'The Suspended Garden', biome: 'heaven', goal: 'Roll the pearl into the three blossoms', how: `A great marble board hangs from four gold chains over a garden in the sky. It leans toward wherever you stand on it: the farther from the centre, the steeper. A luminous pearl rolls on the board under that lean, and rebounds from the gold rim. Three blossom cups stand on the board, one open at a time: roll the pearl into the open blossom and it blooms, and a new pearl appears at the centre. Holes pierce the board: a pearl that rolls into one is lost (a new one appears at the centre after a moment; blossoms already filled stay filled). After the first blossom, gold weights drop onto the board and each pulls it toward itself for a while (don't stand under one). After the second, a hole wanders the board. Fill all three and Libra wakes.`,
    layout: LAYOUT, legend: {},
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, ox = (M.MW - LAYOUT[0].length) / 2, oy = (M.MH - LAYOUT.length) / 2;
      const CX = ox + MG + HW, CY = oy + MG + HH;
      const cups = CUPS.map(([dx, dy], i) => ({ x: CX + dx, y: CY + dy, i, state: i === 0 ? 'open' : 'bud', bloom: 0 }));
      const holes = HOLES.map(([dx, dy]) => ({ x: CX + dx, y: CY + dy, r: HR }));
      const S = { intro: true, won: false, tx: 0, ty: 0, wt: { x: 0, y: 0 }, pearl: { x: CX, y: CY, vx: 0, vy: 0, state: 'spawn', t: 0, hole: null, cup: null }, delivered: 0, falls: 0, weights: [], weightT: 5, drift: null, trail: [], phase: 0, bounces: 0 };
      X.after(1.2, () => { S.intro = false; X.banner('THE SUSPENDED GARDEN', 'The board leans toward you. Roll the pearl into the open blossom; mind the holes', GOLD_HI, 3.8, true, true); });
      const openCup = () => cups.find(q => q.state === 'open') || null;
      const tiltAt = () => ({ x: clamp((me.x - CX) / HW, -1, 1) + S.wt.x, y: clamp((me.y - CY) / HH, -1, 1) + S.wt.y });
      // how high the board stands at a point (negative on the low side), in tiles
      const hAt = (x, y) => -(S.tx * (x - CX) / HW + S.ty * (y - CY) / HH) * LIFT;
      // a board point on the screen: lifted by its height, and spread a little wider where it comes up toward the eye
      const P = (x, y, z) => { const T = X.Tz(), h = hAt(x, y) + (z || 0), Xs = X.sx(x), Ys = X.sy(y), cxs = X.sx(CX); return { X: Xs + (Xs - cxs) * h * 0.04, Y: Ys - h * T, h }; };
      function respawn(delay) { const p = S.pearl; p.state = 'gone'; p.t = 0; p.gone = delay; }
      function fall(p, hole) { p.state = 'fall'; p.t = 0; p.hole = hole; p.fx = p.x; p.fy = p.y; S.falls++; X.sfx.wrong && X.sfx.wrong(); X.text(hole.x, hole.y - 1.2, 'Lost through the board!', '#CFE4FF', 14); X.ring(hole.x, hole.y, 0.2, 1.0, 0.35, '#CFE4FF', 0.3); }
      function caught(p, cup) { p.state = 'cup'; p.t = 0; p.cup = cup; p.vx = p.vy = 0; cup.state = 'filling'; X.sfx.tick && X.sfx.tick(); }
      function bloom(cup) { cup.state = 'done'; cup.bloom = 1; S.delivered++; X.boom(cup.x, cup.y - 0.6, 1.1, PINK, '#FFFFFF', { n: 16, shake: 3 }); X.sfx.coin && X.sfx.coin(); X.text(cup.x, cup.y - 1.8, `BLOSSOM ${S.delivered}/3`, GOLD_HI, 16);
        if (S.delivered >= 3) { win(); return; }
        cups[S.delivered].state = 'open'; S.phase = S.delivered;
        if (S.delivered === 1) { X.banner('ONE OF THREE', 'Gold weights fall onto the board now: each pulls it toward itself for a while', GOLD_HI, 3, true); S.weightT = 3.5; }
        else { X.banner('TWO OF THREE', 'A hole wanders the board now: keep the pearl clear of it', GOLD_HI, 3, true); S.drift = { a: Math.PI * 0.5, x: CX, y: CY + DRIFT.ry, r: HR, drift: true, born: 0 }; }
        respawn(0.9); }
      function win() { if (S.won) return; S.won = true; self.done = true; S.weights = []; X.flash(0.5, '#FFFFFF'); X.shake(6, 0.5); X.sfx.fanfare && X.sfx.fanfare(); X.banner('LIBRA WAKES', 'Three pearls weighed and set: the Seer of the scales answers', GOLD_HI, 3, true, true); X.ring(CX, CY, 0.5, 7, 0.8, GOLD_HI, 0.5); X.after(2.8, () => X.winStage()); }
      function dropWeight() { let best = null; for (let k = 0; k < 24; k++) { const x = CX + (Math.random() * 2 - 1) * (HW - 1.2), y = CY + (Math.random() * 2 - 1) * (HH - 1.2); const dp = Math.hypot(x - me.x, y - me.y), dq = Math.hypot(x - S.pearl.x, y - S.pearl.y); if (dp < 1.6 || dq < 1.4 || cups.some(q => Math.hypot(q.x - x, q.y - y) < 1.4) || S.weights.some(w => Math.hypot(w.x - x, w.y - y) < 1.5)) continue; best = { x, y }; break; }
        if (!best) return; S.weights.push({ x: best.x, y: best.y, t: 0, fallT: 1.3, life: 6.5, landed: false }); }
      return { S, cups, holes, CX, CY, HW, HH, P, hAt, tiltAt, openCup, allHoles: () => S.drift ? holes.concat([S.drift]) : holes,
        cam() { return { x: CX, y: CY + 0.6, k: 1, zoom: 0.64 }; },
        update(dt) { if (S.won) return;
          // the board leans toward the pet (and toward the weights), eased
          const want = S.intro ? { x: 0, y: 0 } : tiltAt(); S.tx += (clamp(want.x, -1, 1) - S.tx) * Math.min(1, dt * 3); S.ty += (clamp(want.y, -1, 1) - S.ty) * Math.min(1, dt * 3);
          if (!me.leap) me.z = hAt(me.x, me.y);
          if (S.intro) return;
          // the weights: a shadow on the board, the fall, a stay that pulls the board, then they dissolve
          if (S.phase >= 1 && S.weights.length < 2) { S.weightT -= dt; if (S.weightT <= 0) { S.weightT = S.phase >= 2 ? 6.5 : 7.5; dropWeight(); } }
          S.wt.x = S.wt.y = 0;
          for (const w of S.weights) { w.t += dt; if (!w.landed && w.t >= w.fallT) { w.landed = true; X.boom(w.x, w.y, 0.8, GOLD, '#FFFFFF', { n: 10, shake: 5, smoke: 2 }); X.sfx.crash && X.sfx.crash(); if (!me.dead && Math.hypot(me.x - w.x, me.y - w.y) < 0.95) { X.hurtPet(X.ST().hp * 0.09, null); X.text(me.x, me.y - 1.4, 'A weight!', GOLD_HI, 14); } }
            if (w.landed) { const k = Math.min(1, (w.t - w.fallT) / 0.6); S.wt.x += (w.x - CX) / HW * 0.5 * k; S.wt.y += (w.y - CY) / HH * 0.5 * k; } }
          S.weights = S.weights.filter(w => { if (w.t < w.fallT + w.life) return true; X.ring(w.x, w.y, 0.2, 0.9, 0.3, GOLD, 0.3); for (let i = 0; i < 6; i++) X.part({ kind: 'star', x: w.x + (Math.random() - 0.5) * 0.6, y: w.y - 0.3 - Math.random() * 0.5, vx: 0, vy: -1.2, life: 0.7, max: 0.7, size: 2.5, color: GOLD_HI }); return false; });
          // the wandering hole
          if (S.drift) { const D = S.drift; D.a += dt * DRIFT.w; D.born = Math.min(1, D.born + dt); D.x = CX + Math.cos(D.a) * DRIFT.rx; D.y = CY + Math.sin(D.a) * DRIFT.ry; }
          // the pearl
          const p = S.pearl; p.t += dt;
          if (p.state === 'spawn') { if (p.t >= 0.6) { p.state = 'roll'; p.t = 0; } return; }
          if (p.state === 'gone') { if (p.t >= p.gone) { p.state = 'spawn'; p.t = 0; p.x = CX; p.y = CY; p.vx = p.vy = 0; X.ring(CX, CY, 0.1, 0.9, 0.4, '#CFE4FF', 0.4); } return; }
          if (p.state === 'fall') { if (p.t >= 0.55) respawn(0.8); return; }
          if (p.state === 'cup') { const cup = p.cup; p.x += (cup.x - p.x) * Math.min(1, dt * 8); p.y += (cup.y - p.y) * Math.min(1, dt * 8); if (cup.state === 'filling') { cup.bloom = Math.min(1, p.t / 1.1); if (p.t >= 1.1) bloom(cup); } return; }
          // rolling: down the lean, slowed by the marble, rebounding from the rim
          p.vx += S.tx * G_ACC * dt; p.vy += S.ty * G_ACC * dt; const fr = Math.exp(-dt * 0.55); p.vx *= fr; p.vy *= fr; const sp = Math.hypot(p.vx, p.vy); if (sp > 7.5) { p.vx *= 7.5 / sp; p.vy *= 7.5 / sp; }
          p.x += p.vx * dt; p.y += p.vy * dt; const bx = HW - RIM - PR, by = HH - RIM - PR;
          if (p.x < CX - bx) { p.x = CX - bx; if (p.vx < 0) { p.vx *= -0.55; S.bounces++; X.sfx.tick && X.sfx.tick(); } } else if (p.x > CX + bx) { p.x = CX + bx; if (p.vx > 0) { p.vx *= -0.55; S.bounces++; X.sfx.tick && X.sfx.tick(); } }
          if (p.y < CY - by) { p.y = CY - by; if (p.vy < 0) { p.vy *= -0.55; S.bounces++; X.sfx.tick && X.sfx.tick(); } } else if (p.y > CY + by) { p.y = CY + by; if (p.vy > 0) { p.vy *= -0.55; S.bounces++; X.sfx.tick && X.sfx.tick(); } }
          S.trail.push({ x: p.x, y: p.y, a: 1 }); if (S.trail.length > 14) S.trail.shift(); for (const q of S.trail) q.a -= dt * 2.2;
          for (const h of this.allHoles()) if (Math.hypot(p.x - h.x, p.y - h.y) < h.r * 0.9 * (h.born != null ? h.born : 1)) { fall(p, h); return; }
          const cup = openCup(); if (cup && Math.hypot(p.x - cup.x, p.y - cup.y) < CUP_R) caught(p, cup); },
        goal() { if (S.won) return 'Libra wakes'; if (S.intro) return 'The Suspended Garden'; const p = S.pearl; return `Blossoms ${S.delivered}/3 · ${p.state === 'cup' ? 'the blossom opens…' : p.state === 'roll' ? 'roll the pearl into the open blossom' : 'a new pearl comes'}${S.phase >= 1 ? ' · mind the weights' : ''}`; },
        hint() { return null; },
        drawGround(c) { const T = X.Tz(), t = g.t, W = X.W(), Hh = X.H(), mag = Math.min(1, Math.hypot(S.tx, S.ty));
          // ---- the sky, and the garden far below ----
          c.save(); const sk = c.createLinearGradient(0, 0, 0, Hh); sk.addColorStop(0, '#8DB8F5'); sk.addColorStop(0.5, '#AFCDF8'); sk.addColorStop(1, SKY_LO); c.fillStyle = sk; c.fillRect(0, 0, W, Hh);
          glowAt(c, W * 0.82, Hh * 0.1, T * 6, GOLD_HI, 0.55); glowAt(c, W * 0.82, Hh * 0.1, T * 2.2, '#FFFFFF', 0.7);
          const gx = X.sx(CX), gy = X.sy(CY + 1.4);
          // the terrace: rings of marble and gold, pools, blossom trees, all hazed by the air between
          c.save(); c.translate(gx, gy); c.scale(1, 0.72);
          ell(c, 0, 0, T * 12.5, T * 12.5); c.fillStyle = '#DCE3EE'; c.fill(); c.strokeStyle = GOLD; c.lineWidth = T * 0.14; c.stroke();
          ell(c, 0, 0, T * 9.2, T * 9.2); c.fillStyle = '#E6EBF2'; c.fill(); c.strokeStyle = GOLD; c.lineWidth = T * 0.1; c.stroke();
          ell(c, 0, 0, T * 5.2, T * 5.2); c.fillStyle = '#C5DDFB'; c.fill(); c.strokeStyle = GOLD; c.lineWidth = T * 0.1; c.stroke(); for (let k = 0; k < 3; k++) { const r = ((t * 0.25 + k / 3) % 1); c.globalAlpha = 0.5 * (1 - r); c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; ell(c, 0, 0, T * 5.2 * r, T * 5.2 * r); c.stroke(); } c.globalAlpha = 1;
          c.strokeStyle = 'rgba(168,132,44,.35)'; c.lineWidth = 1.5; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * T * 5.2, Math.sin(a) * T * 5.2); c.lineTo(Math.cos(a) * T * 12.5, Math.sin(a) * T * 12.5); c.stroke(); }
          for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + 0.3, r = T * (k % 2 ? 10.9 : 7.2), x = Math.cos(a) * r, y = Math.sin(a) * r; c.fillStyle = 'rgba(0,0,0,.12)'; ell(c, x + T * 0.3, y + T * 0.5, T * 0.9, T * 0.5); c.fill(); c.fillStyle = k % 3 ? PINK : '#FFE1EC'; c.strokeStyle = PINK_D; c.lineWidth = 1.5; ell(c, x, y, T * 0.95, T * 0.95); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; ell(c, x - T * 0.3, y - T * 0.3, T * 0.35, T * 0.3); c.fill(); }
          for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.9, x = Math.cos(a) * T * 9.0, y = Math.sin(a) * T * 9.0; c.fillStyle = '#FFFFFF'; c.strokeStyle = GOLD; c.lineWidth = 1.5; c.fillRect(x - T * 0.3, y - T * 1.3, T * 0.6, T * 1.3); c.strokeRect(x - T * 0.3, y - T * 1.3, T * 0.6, T * 1.3); ell(c, x, y - T * 1.3, T * 0.45, T * 0.3); c.fillStyle = GOLD; c.fill(); c.stroke(); }
          c.restore();
          // the board's shadow on the terrace, swung toward its low side
          { const sh = 0.9; c.fillStyle = 'rgba(40,50,90,.16)'; for (let k = 0; k < 3; k++) { ell(c, gx + S.tx * T * sh + T * 0.3, gy + S.ty * T * sh * 0.7 + T * 0.4, T * (HW * 0.95 + k * 0.25), T * (HH * 0.7 + k * 0.2)); c.fill(); } }
          c.fillStyle = 'rgba(200,222,255,.38)'; c.fillRect(0, 0, W, Hh);
          // clouds drifting between the terrace and the board
          c.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 0; k < 7; k++) { const u = ((t * 0.018 * (1 + k % 3 * 0.3) + k * 0.143) % 1.3) - 0.15, x = u * W, y = Hh * (0.12 + ((k * 0.37) % 1) * 0.8), r = T * (1.3 + k % 3 * 0.5); ell(c, x, y, r * 1.6, r * 0.55); c.fill(); ell(c, x + r * 0.6, y - r * 0.25, r * 0.9, r * 0.5); c.fill(); ell(c, x - r * 0.7, y - r * 0.1, r * 0.8, r * 0.4); c.fill(); }
          c.restore();
          // ---- the chains, from each corner up into the light ----
          const corner = (i) => P(CX + (i & 1 ? HW : -HW) * 0.96, CY + (i & 2 ? HH : -HH) * 0.96);
          for (let i = 0; i < 4; i++) { const q = corner(i), ax = q.X + (X.sx(CX) - q.X) * 0.12, ay = -T * 0.5; c.save(); c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = T * 0.16; c.beginPath(); c.moveTo(q.X, q.Y); c.lineTo(ax, ay); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = T * 0.09; c.setLineDash([T * 0.22, T * 0.14]); c.lineDashOffset = 0; c.stroke(); c.setLineDash([]); c.strokeStyle = GOLD_HI; c.lineWidth = T * 0.03; c.stroke(); c.restore(); }
          // ---- the slab: its front face, then the top ----
          const c00 = P(CX - HW, CY - HH), c10 = P(CX + HW, CY - HH), c11 = P(CX + HW, CY + HH), c01 = P(CX - HW, CY + HH), th = TH * T;
          c.save(); c.lineJoin = 'round';
          c.fillStyle = 'rgba(30,40,80,.18)'; c.beginPath(); c.moveTo(c00.X, c00.Y + th * 1.6); c.lineTo(c10.X, c10.Y + th * 1.6); c.lineTo(c11.X + T * 0.3, c11.Y + th * 1.8); c.lineTo(c01.X - T * 0.3, c01.Y + th * 1.8); c.closePath(); c.fill();
          const fg = c.createLinearGradient(c01.X, 0, c11.X, 0); fg.addColorStop(0, mix(MARBLE_D, MARBLE_DD, Math.max(0, -S.tx) * 0.8)); fg.addColorStop(1, mix(MARBLE_D, MARBLE_DD, Math.max(0, S.tx) * 0.8)); c.fillStyle = fg; c.strokeStyle = INK; c.lineWidth = 2;
          c.beginPath(); c.moveTo(c01.X, c01.Y); c.lineTo(c11.X, c11.Y); c.lineTo(c11.X, c11.Y + th); c.lineTo(c01.X, c01.Y + th); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(Math.min(c01.X, c11.X), Math.min(c01.Y, c11.Y) + th * 0.6, Math.abs(c11.X - c01.X), th * 0.4);
          c.strokeStyle = GOLD; c.lineWidth = T * 0.07; c.beginPath(); c.moveTo(c01.X, c01.Y + th * 0.5); c.lineTo(c11.X, c11.Y + th * 0.5); c.stroke();
          // the top face: marble lit on the high side, dark on the low
          const top = () => { c.beginPath(); c.moveTo(c00.X, c00.Y); c.lineTo(c10.X, c10.Y); c.lineTo(c11.X, c11.Y); c.lineTo(c01.X, c01.Y); c.closePath(); };
          { const nx = mag > 0.01 ? S.tx / mag : 0, ny = mag > 0.01 ? S.ty / mag : 1, a = P(CX - nx * HW, CY - ny * HH), b = P(CX + nx * HW, CY + ny * HH), tg = c.createLinearGradient(a.X, a.Y, b.X, b.Y); tg.addColorStop(0, mix(MARBLE, MARBLE_HI, mag * 0.9)); tg.addColorStop(0.5, MARBLE); tg.addColorStop(1, mix(MARBLE, MARBLE_D, mag * 0.9)); c.fillStyle = tg; top(); c.fill(); }
          c.save(); top(); c.clip();
          // the paving: a grid of marble tiles, veined
          c.strokeStyle = 'rgba(150,130,90,.35)'; c.lineWidth = 1.2; c.beginPath(); for (let i = 1; i < BW; i++) { const a = P(CX - HW + i, CY - HH), b = P(CX - HW + i, CY + HH); c.moveTo(a.X, a.Y); c.lineTo(b.X, b.Y); } for (let j = 1; j < BH; j++) { const a = P(CX - HW, CY - HH + j), b = P(CX + HW, CY - HH + j); c.moveTo(a.X, a.Y); c.lineTo(b.X, b.Y); } c.stroke();
          c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.beginPath(); for (let k = 0; k < 9; k++) { const x0 = CX - HW + ((k * 2.7) % BW), y0 = CY - HH + ((k * 1.9 + 0.4) % BH), a = P(x0, y0), b = P(x0 + 1.3, y0 + 0.9); c.moveTo(a.X, a.Y); c.quadraticCurveTo((a.X + b.X) / 2 + T * 0.2, (a.Y + b.Y) / 2 - T * 0.2, b.X, b.Y); } c.stroke();
          // the scales of Libra inlaid in gold at the centre, in a ring
          { const q = P(CX, CY), s = T * 0.17; c.save(); c.translate(q.X, q.Y); c.scale(1 + S.tx * 0.02, 0.92 - Math.abs(S.ty) * 0.08); c.strokeStyle = GOLD; c.lineWidth = T * 0.09; c.beginPath(); c.arc(0, 0, T * 1.75, 0, TAU); c.stroke(); c.lineWidth = T * 0.035; c.beginPath(); c.arc(0, 0, T * 1.45, 0, TAU); c.stroke(); c.fillStyle = 'rgba(232,196,106,.14)'; c.beginPath(); c.arc(0, 0, T * 1.45, 0, TAU); c.fill();
            for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.fillStyle = GOLD; c.beginPath(); c.arc(Math.cos(a) * T * 1.6, Math.sin(a) * T * 1.6, T * 0.07, 0, TAU); c.fill(); }
            c.translate(-12 * s, -12 * s - T * 0.1); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = GOLD_D; c.lineWidth = 2.6 / s * 1.4; c.stroke(new Path2D(LIBRA)); c.strokeStyle = GOLD; c.lineWidth = 1.6 / s * 1.4; c.stroke(new Path2D(LIBRA)); c.restore(); }
          // the glow of the pearl on the marble, and a sheen that slides as the board leans
          { const p = S.pearl; if (p.state === 'roll' || p.state === 'cup') { const q = P(p.x, p.y); glowAt(c, q.X, q.Y, T * 1.6, '#CFE4FF', 0.35); } }
          { const sg = c.createLinearGradient(c00.X, c00.Y, c11.X, c11.Y); const u = 0.5 + S.tx * 0.3 - S.ty * 0.2; sg.addColorStop(Math.max(0, u - 0.25), 'rgba(255,255,255,0)'); sg.addColorStop(clamp(u, 0.01, 0.99), 'rgba(255,255,255,.28)'); sg.addColorStop(Math.min(1, u + 0.25), 'rgba(255,255,255,0)'); c.fillStyle = sg; top(); c.fill(); }
          c.restore();
          // the gold rim, the corner bosses, the edge
          { const r00 = P(CX - HW + RIM * 0.5, CY - HH + RIM * 0.5), r10 = P(CX + HW - RIM * 0.5, CY - HH + RIM * 0.5), r11 = P(CX + HW - RIM * 0.5, CY + HH - RIM * 0.5), r01 = P(CX - HW + RIM * 0.5, CY + HH - RIM * 0.5); c.beginPath(); c.moveTo(r00.X, r00.Y); c.lineTo(r10.X, r10.Y); c.lineTo(r11.X, r11.Y); c.lineTo(r01.X, r01.Y); c.closePath(); c.strokeStyle = INK; c.lineWidth = RIM * T + 2; c.stroke(); c.strokeStyle = GOLD; c.lineWidth = RIM * T - 1; c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = RIM * T * 0.3; c.stroke(); }
          top(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
          for (let i = 0; i < 4; i++) { const q = corner(i); c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(q.X, q.Y, T * 0.26, 0, TAU); c.fill(); c.stroke(); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(q.X - T * 0.07, q.Y - T * 0.07, T * 0.09, 0, TAU); c.fill(); }
          c.restore();
          // ---- the holes: the sky shows through ----
          for (const h of this.allHoles()) { const q = P(h.x, h.y), k = h.born != null ? h.born : 1, rx = h.r * T * k, ry = h.r * T * 0.8 * k; c.save(); const hg = c.createLinearGradient(q.X, q.Y - ry, q.X, q.Y + ry); hg.addColorStop(0, '#7E9CC8'); hg.addColorStop(0.35, SKY); hg.addColorStop(1, SKY_LO); c.fillStyle = hg; ell(c, q.X, q.Y, rx, ry); c.fill();
            c.lineWidth = T * 0.07; c.strokeStyle = 'rgba(40,36,60,.6)'; c.beginPath(); c.ellipse(q.X, q.Y, rx * 0.93, ry * 0.9, 0, Math.PI, TAU); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(q.X, q.Y, rx * 0.93, ry * 0.9, 0, 0.1, Math.PI - 0.1); c.stroke(); c.strokeStyle = INK; c.lineWidth = 1.5; ell(c, q.X, q.Y, rx, ry); c.stroke();
            if (h.drift) { c.strokeStyle = SAPPH; c.lineWidth = 2; c.setLineDash([5, 6]); c.lineDashOffset = -t * 30; ell(c, q.X, q.Y, rx + T * 0.2, ry + T * 0.16); c.stroke(); c.setLineDash([]); } c.restore(); }
          // ---- the blossom cups ----
          for (const cup of cups) { const q = P(cup.x, cup.y), open = cup.state === 'open', fill = cup.state === 'filling', done = cup.state === 'done', k = done ? 1 : fill ? cup.bloom : 0, pulse = 0.5 + 0.5 * Math.sin(t * 4 + cup.i);
            if (open || fill) glowAt(c, q.X, q.Y, T * (1.3 + pulse * 0.3), GOLD, 0.35 + pulse * 0.2); if (done) glowAt(c, q.X, q.Y - T * 0.2, T * 1.1, '#CFE4FF', 0.45);
            c.save(); c.fillStyle = 'rgba(30,30,60,.2)'; ell(c, q.X + T * 0.08, q.Y + T * 0.12, T * 0.6, T * 0.3); c.fill();
            if (cup.state === 'bud') { // a closed bud on a gold dish, with its turn number
              c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 2; ell(c, q.X, q.Y, T * 0.42, T * 0.2); c.fill(); c.stroke();
              for (const [dx, rot, col] of [[-0.13, -0.35, '#E9B9CD'], [0.13, 0.35, '#E9B9CD'], [0, 0, '#F6D3E2']]) { c.save(); c.translate(q.X + dx * T, q.Y - T * 0.28); c.rotate(rot); c.fillStyle = col; c.strokeStyle = PINK_D; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -T * 0.34); c.quadraticCurveTo(T * 0.22, -T * 0.05, 0, T * 0.14); c.quadraticCurveTo(-T * 0.22, -T * 0.05, 0, -T * 0.34); c.closePath(); c.fill(); c.stroke(); c.restore(); }
              c.restore(); label(c, String(cup.i + 1), q.X, q.Y + T * 0.55, T * 0.26, '#FFFFFF'); continue; }
            const spread = open ? 0.56 + pulse * 0.05 : done ? 0.5 : fill ? 0.5 + k * 0.08 : 0.22, size = open || done ? 0.34 : fill ? 0.3 + k * 0.05 : 0.22, col = cup.state === 'bud' ? '#E8DCE4' : PINK, edge = cup.state === 'bud' ? '#B9A3B0' : PINK_D;
            for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2 + (open ? Math.sin(t * 2 + i) * 0.05 : 0), px = q.X + Math.cos(a) * T * spread, py = q.Y + Math.sin(a) * T * spread * 0.8; c.save(); c.translate(px, py); c.rotate(a + Math.PI / 2); c.fillStyle = col; c.strokeStyle = edge; c.lineWidth = 1.5; ell(c, 0, 0, T * size * 0.55, T * size); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, -T * size * 0.1, -T * size * 0.3, T * size * 0.2, T * size * 0.4); c.fill(); c.restore(); }
            const bg = c.createRadialGradient(q.X, q.Y, 0, q.X, q.Y, T * 0.45); bg.addColorStop(0, cup.state === 'bud' ? '#D8C890' : GOLD_HI); bg.addColorStop(1, cup.state === 'bud' ? '#B0A070' : GOLD); c.fillStyle = bg; c.strokeStyle = INK; c.lineWidth = 2; ell(c, q.X, q.Y, T * 0.45, T * 0.36); c.fill(); c.stroke(); c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, q.X, q.Y + T * 0.03, T * 0.3, T * 0.22); c.fill();
            if (done) { glowAt(c, q.X, q.Y - T * 0.15, T * 0.6, '#FFFFFF', 0.6); const pg = c.createRadialGradient(q.X - T * 0.07, q.Y - T * 0.22, 0, q.X, q.Y - T * 0.15, T * 0.22); pg.addColorStop(0, '#FFFFFF'); pg.addColorStop(0.7, PEARL); pg.addColorStop(1, '#AFC8EE'); c.fillStyle = pg; c.beginPath(); c.arc(q.X, q.Y - T * 0.15, T * 0.22, 0, TAU); c.fill(); }
            c.restore();
            if (open) label(c, 'ROLL HERE', q.X, q.Y - T * 0.95 - Math.abs(Math.sin(t * 3)) * T * 0.12, T * 0.26, GOLD_HI); if (fill) label(c, 'BLOOMING…', q.X, q.Y - T * 0.95, T * 0.24, PINK); }
          // ---- the weights standing on the board, and the shadow of one about to land ----
          for (const w of S.weights) { const q = P(w.x, w.y); if (!w.landed) { const u = Math.min(1, w.t / w.fallT), on = Math.hypot(me.x - w.x, me.y - w.y) < 0.95; c.save(); c.fillStyle = 'rgba(40,30,10,.25)'; ell(c, q.X, q.Y, T * 0.55 * u, T * 0.28 * u); c.fill(); c.strokeStyle = on ? '#FF6B6B' : GOLD; c.lineWidth = 3; c.setLineDash([4, 5]); ell(c, q.X, q.Y, T * 0.9, T * 0.42); c.stroke(); c.setLineDash([]); c.lineWidth = 2; ell(c, q.X, q.Y, T * 0.9 * (1 - u * 0.85), T * 0.42 * (1 - u * 0.85)); c.stroke(); c.restore(); if (on) label(c, 'MOVE!', q.X, q.Y + T * 0.8, T * 0.26, '#FF6B6B'); continue; }
            const left = w.fallT + w.life - w.t, fade = Math.min(1, left / 0.5); c.save(); c.globalAlpha = fade; c.fillStyle = 'rgba(40,30,10,.3)'; ell(c, q.X + T * 0.1, q.Y + T * 0.08, T * 0.55, T * 0.26); c.fill(); weightShape(c, q.X, q.Y, T * 0.95, left < 1.5 && Math.sin(t * 12) > 0); c.restore(); }
          // ---- the pearl ----
          { const p = S.pearl; if (p.state === 'roll' || p.state === 'cup' || p.state === 'fall' || p.state === 'spawn') {
            for (const q0 of S.trail) { if (q0.a <= 0) continue; const q = P(q0.x, q0.y); glowAt(c, q.X, q.Y - PR * T, T * 0.45 * q0.a, '#CFE4FF', 0.3 * q0.a); }
            let scale = 1, lift = PR, alpha = 1; if (p.state === 'fall') { const u = p.t / 0.55; scale = 1 - u * 0.8; lift = PR - u * 1.2; alpha = 1 - u * u; } if (p.state === 'spawn') { const u = p.t / 0.6; scale = Math.min(1, u * 1.4); lift = PR + (1 - u) * 1.2; alpha = Math.min(1, u * 2); } if (p.state === 'cup') { scale = 1 - p.t / 1.1 * 0.3; lift = PR - p.t / 1.1 * 0.25; }
            const q = P(p.x, p.y), r = PR * T * scale, bob = p.state === 'roll' ? Math.abs(Math.sin(t * 9)) * T * 0.02 : 0, Y = q.Y - lift * T - bob;
            c.save(); c.globalAlpha = alpha;
            if (p.state !== 'fall' || p.t < 0.3) { c.fillStyle = 'rgba(30,40,80,.28)'; ell(c, q.X, q.Y + T * 0.02, r * 1.1, r * 0.5); c.fill(); }
            glowAt(c, q.X, Y, r * 3.2, '#CFE4FF', 0.45 + 0.1 * Math.sin(t * 5)); glowAt(c, q.X, Y, r * 1.8, '#FFFFFF', 0.5);
            const pg = c.createRadialGradient(q.X - r * 0.35, Y - r * 0.4, r * 0.1, q.X, Y, r); pg.addColorStop(0, '#FFFFFF'); pg.addColorStop(0.55, PEARL); pg.addColorStop(0.85, '#C9DBF5'); pg.addColorStop(1, '#8FB0E0'); c.fillStyle = pg; c.beginPath(); c.arc(q.X, Y, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(60,80,140,.6)'; c.lineWidth = 1.5; c.stroke();
            c.fillStyle = 'rgba(255,190,220,.35)'; c.beginPath(); c.arc(q.X + r * 0.3, Y + r * 0.25, r * 0.35, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(q.X - r * 0.35, Y - r * 0.4, r * 0.22, 0, TAU); c.fill(); c.restore(); } } },
        drawOver(c) { const T = X.Tz(), t = g.t, W = X.W();
          // the weights falling out of the light
          for (const w of S.weights) { if (w.landed) continue; const u = Math.min(1, w.t / w.fallT), q = P(w.x, w.y), drop = (1 - u) * (1 - u) * T * 10; if (u < 0.08) continue; weightShape(c, q.X, q.Y - drop, T * 0.95, false); }
          // blossom vines hanging into view from the garden's upper boughs
          c.save(); c.lineCap = 'round'; for (const [fx, len, ph] of [[0.05, 5.2, 0], [0.13, 3.4, 1.3], [0.9, 4.4, 2.1], [0.97, 6.0, 0.7]]) { const x0 = W * fx, sway = Math.sin(t * 0.8 + ph) * T * 0.25; c.strokeStyle = '#6F9F6A'; c.lineWidth = T * 0.09; c.beginPath(); c.moveTo(x0, -4); c.quadraticCurveTo(x0 + sway * 0.4, len * T * 0.5, x0 + sway, len * T); c.stroke();
            for (let k = 1; k <= Math.floor(len); k++) { const u = k / len, px = x0 + sway * u * u, py = u * len * T, side = k % 2 ? 1 : -1; c.fillStyle = '#8FBF8A'; c.strokeStyle = '#4E7F4A'; c.lineWidth = 1.2; c.save(); c.translate(px + side * T * 0.18, py); c.rotate(side * 0.9 + sway / T * 0.3); ell(c, 0, 0, T * 0.3, T * 0.13); c.fill(); c.stroke(); c.restore(); if (k % 2 === 0 || k === Math.floor(len)) { c.fillStyle = k % 4 ? PINK : '#FFFFFF'; c.strokeStyle = PINK_D; c.lineWidth = 1.2; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + t * 0.3; ell(c, px - side * T * 0.15 + Math.cos(a) * T * 0.14, py + Math.sin(a) * T * 0.14, T * 0.1, T * 0.1); c.fill(); c.stroke(); } c.fillStyle = GOLD; c.beginPath(); c.arc(px - side * T * 0.15, py, T * 0.06, 0, TAU); c.fill(); } } }
          c.restore(); },
      };
    },
  });
})();
