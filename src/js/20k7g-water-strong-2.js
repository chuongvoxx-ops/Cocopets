/* ---------- Water, reworked: five Strong attacks (Bubble Spray, Waterwheel Strike, Twin Undertow, Pearlburst Volley,
   Falling Basin) ----------
   Round 3: overhauled to the fire / ice / thunder standard and escalating with evolution: more pieces at Adept, and at
   Celestial a repeated, stacked climax where each repeat is bigger than the last. Translucent shaded water (sapphire
   bodies, turquoise surfaces, aqua edges, white foam), moving highlights, bubbles with clear centres and pearlescent
   rims, droplets, spray and glints; build-up, release, fade; light-only floor traces; the pet is never covered. The
   bubble, the pearl, the wheel blade, the waterfall column, the bowl and the floor ring are cached sprites.
   Damage ~ the old factor x C.K x evoK x (1.07 at Adept, 1.15 at Celestial), shared among the pieces by their size.
   Bubble Spray: waves of bubbles sprayed at the aim trap the monsters they reach (slowed) and burst; each wave ends in
     a large bubble popping over the aim. 1 wave, 2 at Adept, 3 at Celestial (each bigger, more bubbles).
   Waterwheel Strike: upright wheels of curved water blades surge ahead, striking as they roll, then lose cohesion into
     foam: 1 wheel; 2 side by side at Adept; 3 at Celestial, the last a great central wheel crashing in a big splash.
   Twin Undertow: two streams either side of the aim curve together into an upward splash; 1 pair, 2 at Adept, 3 at
     Celestial, each pair wider, longer and its splash taller.
   Pearlburst Volley: dense pearls hover in an arc beside the pet, droplets in orbit, and fire one by one: 3, 5 at Adept,
     8 at Celestial, growing along the volley, the last the broadest splash.
   Falling Basin: floating bowls tip and pour waterfalls: 1; at Adept a small one then a bigger one at the aim; at
     Celestial two at the sides then a giant one at the aim. */
(() => {
  const S = ELEM_IMPL.water.strong, TAU = Math.PI * 2;
  const cl = u => Math.max(0, Math.min(1, u));
  const lv = (ev, a) => (ev >= 7 ? a[2] : ev >= 4 ? a[1] : a[0]);
  const AQ = '#5FE8FF', TQ = '#3FD0E0', PALE = '#CFF6FF', WH = '#FFFFFF', PINK = '#FFC7F0', GOLD = '#FFF4B0';
  const rg = (g, x, y, r, st) => { const q = g.createRadialGradient(x, y, 0, x, y, r); st.forEach(s => q.addColorStop(s[0], s[1])); return q; };
  let H;
  const evOf = C => Math.max(1, Math.min(7, C.evo || 1));
  const DK = C => { const ev = evOf(C); return C.base * C.K * (1 + 0.08 * (ev - 1)) * lv(ev, [1, 1.07, 1.15]); };
  const hole = (c, T) => { const me = H.me, x = H.sx(me.x), y = H.sy(me.y) - T * 0.46; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd'); };
  const blit = (c, img, x, y, w, h, a, rot) => { if (!(a > 0.01) || !(w > 0.5)) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); if (rot) c.rotate(rot); c.drawImage(img, -w / 2, -h / 2, w, h); c.restore(); };

  /* ---- cached sprites ---- */
  // a bubble: a clear centre, a pearlescent rim (pink, gold, cyan bands); the specular crescent is its own sprite so it stays lit from above
  const bubSpr = () => fxSprite('ws2bub', 96, 96, (g, w) => { const c0 = w / 2, r = 44;
    g.fillStyle = rg(g, c0, c0, r + 2, [[0, 'rgba(200,245,255,0.03)'], [0.68, 'rgba(140,220,250,0.07)'], [0.86, 'rgba(95,232,255,0.26)'], [0.96, 'rgba(232,251,255,0.7)'], [1, 'rgba(232,251,255,0)']]); g.fillRect(0, 0, w, w);
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineWidth = 3;
    [[PINK, 2.1, 3.1], [GOLD, 3.5, 4.3], [AQ, 0.2, 1.4], ['#C8B8FF', 4.8, 5.6]].forEach(([col, a0, a1]) => { g.strokeStyle = col; g.globalAlpha = 0.55; g.beginPath(); g.arc(c0, c0, r * 0.9, a0, a1); g.stroke(); }); });
  const specSpr = () => fxSprite('ws2spec', 96, 96, (g, w) => { const c0 = w / 2, r = 44; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 4; g.beginPath(); g.arc(c0, c0, r * 0.72, 3.55, 4.45); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(c0 + r * 0.38, c0 + r * 0.42, 2.6, 0, TAU); g.fill(); });
  // a dense water pearl: lit off-centre, sapphire depth, an aqua rim and a white specular point
  const pearlSpr = () => fxSprite('ws2pearl', 64, 64, (g, w) => { const c0 = w / 2, r = 28;
    g.fillStyle = rg(g, c0, c0, 32, [[0, 'rgba(95,232,255,0.35)'], [1, 'rgba(95,232,255,0)']]); g.fillRect(0, 0, w, w);
    const q = g.createRadialGradient(c0 - 9, c0 - 11, 1, c0, c0, r); [[0, '#FFFFFF'], [0.22, '#BFF4FF'], [0.55, 'rgba(47,143,216,0.92)'], [0.88, 'rgba(18,58,140,0.94)'], [1, 'rgba(95,232,255,0.95)']].forEach(s => q.addColorStop(s[0], s[1]));
    g.fillStyle = q; g.beginPath(); g.arc(c0, c0, r, 0, TAU); g.fill();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(95,232,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.arc(c0, c0, r - 1, 0.2, 2.2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(c0 - 10, c0 - 12, 6, 3.5, -0.6, 0, TAU); g.fill(); });
  // a wheel blade: a curved crescent of water from the hub out to the rim, sapphire root, turquoise body, foam leading edge
  const bladeSpr = () => fxSprite('ws2blade', 128, 128, (g, w) => { const c0 = w / 2; g.translate(c0, c0);
    g.beginPath(); g.moveTo(10, 0); g.bezierCurveTo(28, -14, 46, -30, 60, -16); g.bezierCurveTo(50, -10, 36, 2, 30, 14); g.bezierCurveTo(22, 10, 14, 6, 10, 0); g.closePath();
    g.fillStyle = rg(g, 0, 0, 62, [[0.15, 'rgba(24,70,170,0.6)'], [0.55, 'rgba(47,143,216,0.62)'], [0.85, 'rgba(63,208,224,0.72)'], [1, 'rgba(160,245,255,0.9)']]); g.fill();
    g.strokeStyle = 'rgba(18,58,140,0.55)'; g.lineWidth = 1.2; g.stroke();
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.strokeStyle = 'rgba(232,251,255,0.95)'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(12, -2); g.bezierCurveTo(28, -15, 46, -30, 59, -17); g.stroke();
    g.strokeStyle = 'rgba(160,245,255,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(22, 2); g.bezierCurveTo(32, -6, 42, -14, 50, -14); g.stroke(); });
  // a water column (vertical): clear aqua edges, a turquoise body, white streaks repeating every 128 px so it can scroll
  const colSpr = () => fxSprite('ws2col', 64, 256, (g, w, h) => {
    const q = g.createLinearGradient(0, 0, w, 0); [[0, 'rgba(95,232,255,0)'], [0.12, 'rgba(160,245,255,0.7)'], [0.25, 'rgba(47,143,216,0.5)'], [0.5, 'rgba(63,208,224,0.45)'], [0.75, 'rgba(47,143,216,0.5)'], [0.88, 'rgba(160,245,255,0.7)'], [1, 'rgba(95,232,255,0)']].forEach(s => q.addColorStop(s[0], s[1]));
    g.fillStyle = q; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineCap = 'round';
    for (let k = 0; k < 2; k++) for (let i = 0; i < 9; i++) { const x = 10 + ((i * 37) % 44), y = k * 128 + ((i * 53) % 128), L = 18 + (i * 13) % 30; g.lineWidth = 1 + (i % 3) * 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y + L); g.stroke(); } });
  // a floor ring of light: a soft band with a bright edge (light-only traces)
  const ringSpr = () => fxSprite('ws2ring', 128, 128, (g, w) => { const c0 = w / 2; g.fillStyle = rg(g, c0, c0, c0, [[0, 'rgba(63,208,224,0)'], [0.55, 'rgba(63,208,224,0.06)'], [0.78, 'rgba(63,208,224,0.3)'], [0.9, 'rgba(200,250,255,0.8)'], [0.95, 'rgba(255,255,255,0.9)'], [1, 'rgba(160,245,255,0)']]); g.fillRect(0, 0, w, w); });
  // the bowl: a translucent half-shell seen a little from above, a foam rim (the water surface is drawn per frame)
  const bowlSpr = () => fxSprite('ws2bowl', 160, 96, (g, w, h) => { const cx = w / 2, cy = 30, rx = 74, ry = 24;
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); g.lineTo(cx - rx, cy); g.ellipse(cx, cy, rx, 60, 0, Math.PI, 0, true); g.closePath();
    const q = g.createLinearGradient(0, cy, 0, cy + 60); [[0, 'rgba(63,208,224,0.55)'], [0.5, 'rgba(47,143,216,0.6)'], [1, 'rgba(18,58,140,0.75)']].forEach(s => q.addColorStop(s[0], s[1])); g.fillStyle = q; g.fill();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(160,245,255,0.6)'; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, rx * 0.86, 50, 0, 2.3, 2.9); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.stroke(); });
  const warm = () => [bubSpr, specSpr, pearlSpr, bladeSpr, colSpr, ringSpr, bowlSpr].forEach(f => f());

  /* ---- particles ---- */
  const foam = (x, y, k, v, up) => { H.burst(x, y, 'spark', k, { v: v || 5, up: up == null ? 3 : up, g: 11, life: 0.5, size: 2, color: [WH, PALE, AQ] }); H.burst(x, y, 'bubble', Math.max(1, Math.round(k * 0.5)), { v: (v || 5) * 0.6, up: (up == null ? 3 : up) * 0.8, g: 7, life: 0.6, size: 3, color: [PALE, AQ] }); };
  const glints = (x, y, k, r) => { for (let i = 0; i < H.n(k); i++) { const a = Math.random() * TAU, d = Math.random() * (r || 0.6); H.P({ kind: 'glow', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.6, vx: 0, vy: -0.6, life: 0.4, max: 0.4, size: 0.08 + Math.random() * 0.1, alpha: 0.8, color: Math.random() < 0.5 ? WH : AQ }); } };
  // a light-only floor splash: an expanding feathered ring, drawn by its own little effect
  const floorRing = (x, y, r, life, a) => H.add({ life, x, y, drawUnder(c, f, X, Y, T) { const u = f.t / life, d = T * r * 2 * (0.3 + 0.7 * H.ease.out(u)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (a || 0.8) * (1 - u); c.drawImage(ringSpr(), X - d / 2, Y - d / 2 * H.GY, d, d * H.GY); } });
  const splash = (x, y, r, big) => { foam(x, y - 0.3, Math.round(10 + 10 * big), 4 + 2 * big, 3 + 2 * big); glints(x, y - 0.4, 4 + 4 * big, r * 0.6); floorRing(x, y, r * 1.2, 0.55, 0.85); H.X.light && H.X.light(x, y, r * 1.5, 0.25); };

  /* ================= Bubble Spray ================= */
  S.bubblesnare = (C, h) => { H = h; warm(); const me = H.me, ev = evOf(C), W = lv(ev, [1, 2, 3]), D = DK(C) * 2.9, tx = C.tx, ty = C.ty;
    const scs = []; for (let w = 0; w < W; w++) scs.push(1 + 0.3 * w); const sumS = scs.reduce((a, b) => a + b, 0);
    const bubs = [], bigs = [];
    for (let w = 0; w < W; w++) { const sc = scs[w], Dw = D * sc / sumS, nb = H.n(lv(ev, [6, 7, 8]) + 2 * w), t0 = w * 0.42;
      for (let i = 0; i < nb; i++) { const q = Math.random() * TAU, d = Math.sqrt(Math.random()) * 1.25 * sc, s = (0.75 + Math.random() * 0.5) * (0.9 + 0.12 * w);
        bubs.push({ st: 'wait', t0: t0 + i * 0.045, ft: 0.38 + Math.random() * 0.14, tx: tx + Math.cos(q) * d, ty: ty + Math.sin(q) * d * 0.8, side: (Math.random() - 0.5) * 2.2, s, x: me.x, y: me.y, z: 0.6, dmg: Dw * 0.45 / Math.max(2, nb * 0.35), m: null, tt: 0, ph: Math.random() * TAU }); }
      bigs.push({ t0: t0 + 0.5, tp: t0 + 0.95, sc, dmg: Dw * 0.55, done: false }); }
    H.X.sfx.bubble ? H.X.sfx.bubble() : H.X.sfx.hum(); me.sq = 0.75;
    const sx0 = me.x + Math.cos(C.a) * 0.5, sy0 = me.y + Math.sin(C.a) * 0.5, px = -Math.sin(C.a), py = Math.cos(C.a);
    H.add({ life: (W - 1) * 0.42 + 1.35,
      update(dt, f) { const t = f.t;
        for (const b of bubs) { if (b.st === 'gone') continue; const lt = t - b.t0; if (lt < 0) continue;
          if (b.st === 'wait') { b.st = 'fly'; if (Math.random() < 0.5) H.P({ kind: 'spark', x: sx0, y: sy0 - 0.5, vx: Math.cos(C.a) * 3, vy: Math.sin(C.a) * 2 - 1, life: 0.25, max: 0.25, size: 2, color: PALE }); }
          if (b.st === 'fly') { const u = cl(lt / b.ft), e = H.ease.out(u), bend = Math.sin(u * Math.PI) * b.side;
            b.x = sx0 + (b.tx - sx0) * e + px * bend; b.y = sy0 + (b.ty - sy0) * e + py * bend; b.z = 0.6 + Math.sin(u * Math.PI) * 0.7 - u * 0.2;
            if (u >= 1) { const ms = H.near(b.x, b.y, 0.55).sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y)); b.m = ms[0] || null; b.st = 'trap'; b.tt = t; if (b.m) H.slow(b.m, 0.7); } }
          else if (b.st === 'trap') { const k = t - b.tt; if (b.m && !b.m.dead) { b.x = b.m.x; b.y = b.m.y; H.slow(b.m, 0.3); }
            if (k > (b.m ? 0.45 : 0.18)) { b.st = 'gone';
              if (b.m && !b.m.dead) H.X.hitMon(b.m, b.dmg, C.dmgO({ noCrit: false })); else H.hitArea(b.x, b.y, 0.5, b.dmg * 0.6, C.dmgO({}));
              H.burst(b.x, b.y - 0.5, 'bubble', 4, { v: 3, up: 1.5, g: 5, life: 0.45, size: 2.6, color: [PALE, AQ, PINK] }); H.burst(b.x, b.y - 0.5, 'spark', 4, { v: 4, life: 0.3, size: 1.8, color: [WH, AQ] }); } } }
        for (const g of bigs) { if (g.done || t < g.tp) continue; g.done = true; const R = 1.2 * g.sc;
          H.hitArea(tx, ty, R, g.dmg, C.dmgO({ kb: 2 })); splash(tx, ty, R, g.sc - 0.6); H.X.ring(tx, ty, 0.3, R * 1.1, 0.35, AQ, 0.25); H.X.shake(2 + 2 * g.sc, 0.12); H.X.sfx.crash();
          for (let i = 0; i < H.n(10 + 4 * g.sc); i++) { const q = i / 10 * TAU; H.P({ kind: 'bubble', x: tx + Math.cos(q) * R * 0.6, y: ty + Math.sin(q) * R * 0.4 - 0.8, vx: Math.cos(q) * 5 * g.sc, vy: Math.sin(q) * 3 - 1.5, g: 6, life: 0.6, max: 0.6, size: 3 + 1.5 * g.sc, color: [PALE, AQ, PINK, GOLD][i % 4] }); } }
      },
      draw(c, f, X, Y, T) { const t = f.t; c.save(); hole(c, T); const B = bubSpr(), SP = specSpr();
        for (const g of bigs) { if (g.done || t < g.t0) continue; const u = cl((t - g.t0) / (g.tp - g.t0)), r = T * 1.2 * g.sc * H.ease.out(u) * (1 - 0.12 * H.ease.in(u)), wb = 1 + 0.05 * Math.sin(t * 11) + 0.1 * H.ease.in(u) * Math.sin(t * 40), gx = H.sx(tx), gy = H.sy(ty) - r * 0.75;
          H.glow(c, gx, gy, r * 1.3, AQ, 0.15 + 0.25 * u); c.save(); c.translate(gx, gy); c.scale(wb, 2 - wb); c.rotate(t * 0.8); c.globalAlpha = 0.95; c.drawImage(B, -r, -r, r * 2, r * 2); c.restore(); blit(c, SP, gx, gy, r * 2, r * 2, 0.9); }
        for (const b of bubs) { if (b.st === 'gone' || b.st === 'wait' || t < b.t0) continue; let r, bx = H.sx(b.x), by;
          if (b.st === 'fly') { r = T * 0.17 * b.s; by = H.sy(b.y) - b.z * T; }
          else { const k = t - b.tt, m = b.m, grow = H.ease.back(cl(k / 0.15)); r = T * (m ? m.r + 0.3 : 0.25) * b.s * grow * (1 - 0.15 * cl((k - 0.3) / 0.15)); by = H.sy(b.y) - (m ? m.r * T : r * 0.8); }
          const wb = 1 + 0.07 * Math.sin(t * 13 + b.ph); c.save(); c.translate(bx, by); c.scale(wb, 2 - wb); c.rotate(t + b.ph); c.drawImage(B, -r, -r, r * 2, r * 2); c.restore(); blit(c, SP, bx, by, r * 2, r * 2, 0.85); }
        c.restore(); } }); };

  /* ================= Waterwheel Strike ================= */
  S.waterwheel = (C, h) => { H = h; warm(); const me = H.me, ev = evOf(C), a = C.a, dir = [Math.cos(a), Math.sin(a)], pp = [-dir[1], dir[0]], V = 7, FORM = 0.3, RUN = 1.1;
    const cfg = lv(ev, [[[0, 1, 0]], [[-0.6, 1, 0], [0.6, 1.15, 0.18]], [[-0.75, 1, 0], [0.75, 1.15, 0.15], [0, 1.45, 0.42]]]), sumS = cfg.reduce((s, q) => s + q[1], 0), NBL = lv(ev, [6, 8, 10]), D = DK(C) * (cfg.length > 1 ? 1.3 : 1);
    H.X.sfx.hum(); me.sq = 0.7;
    cfg.forEach(([o, s, d], wi) => H.X.after(d, () => { const last = wi === cfg.length - 1 && cfg.length > 1, R = 0.78 * s, kD = s / sumS;
      H.add({ life: FORM + RUN + 0.45, x: me.x + dir[0] * 0.9 + pp[0] * o, y: me.y + dir[1] * 0.9 + pp[1] * o, rot: 0, hits: new Map(), gone: false, trail: [], gt: 0,
        update(dt, f) { if (f.t < FORM) { if (Math.random() < 0.8 * H.Q()) { const q = Math.random() * TAU; H.P({ kind: 'spark', x: f.x + Math.cos(q) * R * 2, y: f.y + Math.sin(q) * R - R, vx: -Math.cos(q) * R * 6, vy: -Math.sin(q) * R * 3, life: 0.2, max: 0.2, size: 2, color: PALE }); } return; }
          if (f.gone) return; const v = V * dt, nx = f.x + dir[0] * v, ny = f.y + dir[1] * v;
          if (f.t > FORM + RUN || H.X.blocked(nx, ny, 0.4, 0)) { f.gone = true; f.gt = f.t; f.life = Math.min(f.life, 0.45); const r2 = 1.1 * s * (last ? 1.3 : 1);
            H.hitArea(f.x, f.y, r2, 0.9 * D * kD, C.dmgO({ kb: 2 + (last ? 2 : 0) })); splash(f.x, f.y, r2, last ? 1.6 : 0.8 * s); if (last) { H.X.ring(f.x, f.y, 0.3, r2 * 1.6, 0.4, AQ, 0.25); H.X.shake(6, 0.15); } H.X.sfx.crash(); return; }
          f.x = nx; f.y = ny; f.rot += v / R; f.trail.push([f.x, f.y]); if (f.trail.length > 14) f.trail.shift();
          for (const m of H.near(f.x, f.y, R + 0.15)) { const l = f.hits.get(m); if (l != null && f.t - l < 0.3) continue; f.hits.set(m, f.t); H.X.hitMon(m, 0.95 * D * kD, C.dmgO({ kb: 2 })); foam(m.x, m.y - 0.5, 5, 4, 3); glints(m.x, m.y - 0.5, 2, 0.3); H.X.sfx.thud(); }
          if (Math.random() < 1.2 * H.Q()) H.P({ kind: Math.random() < 0.6 ? 'spark' : 'bubble', x: f.x - dir[0] * R * 0.6, y: f.y - dir[1] * R * 0.6 - 0.1, vx: -dir[0] * 2 + (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 2.5, g: 10, life: 0.45, max: 0.45, size: 2 + Math.random() * 1.5, color: Math.random() < 0.5 ? WH : PALE });
          if (Math.random() < 0.6 * H.Q()) { const q = -Math.PI / 2 + (Math.random() - 0.5); H.P({ kind: 'spark', x: f.x, y: f.y - R * 2, vx: dir[0] * 3 + Math.cos(q) * 2, vy: -2.5, g: 10, life: 0.4, max: 0.4, size: 1.8, color: AQ }); } },
        drawUnder(c, f, X, Y, T) { if (f.trail.length < 2) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * Math.min(1, f.life / 0.45); c.lineCap = 'round'; c.lineJoin = 'round';
          const pts = f.trail.map(p => [H.sx(p[0]), H.sy(p[1])]); for (const [col, lw] of [['rgba(63,208,224,0.18)', T * R * 1.2], ['rgba(160,245,255,0.3)', T * R * 0.45], ['rgba(255,255,255,0.35)', 1.5]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); } },
        draw(c, f, X, Y, T) { const u = H.ease.out(cl(f.t / FORM)), coh = f.gone ? Math.max(0, 1 - (f.t - f.gt) / 0.45) : 1 - 0.5 * cl((f.t - FORM - RUN * 0.65) / (RUN * 0.35)), r = T * R, k = Math.min(1, f.life / 0.45), cy = Y - r * 1.05;
          c.save(); hole(c, T); H.softShadow(c, X, Y + T * 0.05, r, 0.22 * k);
          H.glow(c, X, cy, r * 1.5, AQ, 0.22 * k);
          c.save(); c.translate(X, cy); c.rotate(f.rot * (dir[0] >= 0 ? 1 : -1)); c.globalAlpha = k * (0.4 + 0.6 * coh);
          const BL = bladeSpr(), sz = r * 2.1 * (0.6 + 0.4 * u);
          for (let i = 0; i < NBL; i++) { c.save(); c.rotate(i / NBL * TAU); const gap = (1 - u) * r * 1.2 + (1 - coh) * r * 0.6 * (1 + (i % 2)); c.translate(gap, 0); c.drawImage(BL, -sz / 2, -sz / 2, sz, sz); c.restore(); }
          if (coh < 0.9) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,255,255,${(0.7 * (1 - coh)).toFixed(3)})`; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r * (1 + 0.3 * (1 - coh)), -f.rot * 2, -f.rot * 2 + 3.5 * coh + 1); c.stroke(); c.globalCompositeOperation = 'source-over'; }
          c.globalAlpha = k * coh; c.drawImage(pearlSpr(), -r * 0.32, -r * 0.32, r * 0.64, r * 0.64); c.restore();
          // the foam where the wheel meets the ground
          c.globalCompositeOperation = 'lighter'; H.glow(c, X, Y - r * 0.05, r * 0.7, WH, 0.35 * k * coh); c.restore(); } }); })); };

  /* ================= Twin Undertow ================= */
  S.twinundertow = (C, h) => { H = h; warm(); const me = H.me, ev = evOf(C), a = C.a, L0 = Math.max(3, Math.min(5, Math.hypot(C.tx - me.x, C.ty - me.y))), ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca, TR = 0.5;
    const NP = lv(ev, [1, 2, 3]), ss = []; for (let j = 0; j < NP; j++) ss.push(1 + 0.3 * j); const sumS = ss.reduce((p, q) => p + q, 0), D = DK(C);
    H.X.sfx.whoosh(); me.sq = 0.7;
    ss.forEach((s, j) => H.X.after(j * 0.3, () => { const ox = me.x, oy = me.y, L = Math.min(6, L0 * (1 + 0.12 * j)), OFF = 1.3 * (1 + 0.25 * j), mx = ox + ca * L, my = oy + sa * L, kD = s / sumS;
      const path = (sd, u) => { const w = Math.sin(u * Math.PI) * OFF * sd, d = u * L; return [ox + ca * d + px * w, oy + sa * d + py * w]; };
      H.add({ life: TR + 0.8,
        update(dt, f) { const u = cl(f.t / TR); if (u < 1 && Math.random() < 1.4 * H.Q()) for (const sd of [-1, 1]) { const p = path(sd, u); H.P({ kind: Math.random() < 0.6 ? 'spark' : 'bubble', x: p[0], y: p[1] - 0.15, vx: -px * sd * 2 + ca * 2, vy: -1.5 - Math.random() * 2, g: 8, life: 0.35, max: 0.35, size: 2 + Math.random() * 1.5, color: Math.random() < 0.5 ? WH : PALE }); } },
        drawUnder(c, f, X, Y, T) { const u = cl(f.t / TR), k = Math.min(1, f.life / 0.35); c.lineCap = 'round'; c.lineJoin = 'round';
          for (const sd of [-1, 1]) { const pts = []; for (let i = 0; i <= 18; i++) { const p = path(sd, i / 18 * u); pts.push([H.sx(p[0]), H.sy(p[1])]); }
            const line = () => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); };
            c.globalAlpha = k; line(); c.strokeStyle = 'rgba(24,70,170,0.32)'; c.lineWidth = T * 0.58 * s; c.stroke(); c.strokeStyle = 'rgba(63,208,224,0.45)'; c.lineWidth = T * 0.34 * s; c.stroke();
            c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(160,245,255,0.5)'; c.lineWidth = T * 0.1 * s; c.stroke();
            c.setLineDash([T * 0.35, T * 0.55]); c.lineDashOffset = -f.t * T * 9; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.8; c.stroke(); c.setLineDash([]);
            if (u < 1) { const hd = pts[pts.length - 1]; H.glow(c, hd[0], hd[1], T * 0.6 * s, AQ, 0.5); H.glow(c, hd[0], hd[1], T * 0.25 * s, WH, 0.5); }
            c.globalCompositeOperation = 'source-over'; } },
        draw(c, f, X, Y, T) { if (f.t < TR) return; const v = (f.t - TR) / 0.8, up = v < 0.3 ? H.ease.out(v / 0.3) : Math.max(0, 1 - (v - 0.3) / 0.6), hh = T * 2.4 * s * up, MX = H.sx(mx), MY = H.sy(my), w = T * (0.7 + 0.4 * v) * s;
          if (hh < 2) return; c.save(); hole(c, T); const cs = colSpr(), off = Math.floor((f.t * 300) % 128);
          c.globalAlpha = 0.85 * Math.min(1, up * 2); c.drawImage(cs, 0, 128 - off, 64, 128, MX - w / 2, MY - hh, w, hh);
          c.globalCompositeOperation = 'lighter'; H.glow(c, MX, MY - hh, w * 0.9, AQ, 0.45 * up); H.glow(c, MX, MY, w * 1.1, PALE, 0.3 * up);
          for (let i = 0; i < 5; i++) { const q = -Math.PI / 2 + (i - 2) * 0.45, rr = w * (0.6 + v); c.globalAlpha = 0.6 * up; c.drawImage(pearlSpr(), MX + Math.cos(q) * rr - 4, MY - hh + Math.sin(q) * rr * 0.6 - 4, 8, 8); }
          c.restore(); } });
      H.X.after(TR * 0.55, () => { for (const sd of [-1, 1]) H.hitLine(ox + px * sd * OFF * 0.6, oy + py * sd * OFF * 0.6, a, L * 0.8, 1.0, 0.7 * D * kD, C.dmgO({ kb: 1 }));
        for (const m of H.living()) { const rx = m.x - ox, ry = m.y - oy, al = rx * ca + ry * sa, of = -rx * sa + ry * ca; if (al > 0.5 && al < L && Math.abs(of) < OFF) H.pull(m, m.x + ca * 0.5, m.y + sa * 0.5, 0.5); } H.X.sfx.whoosh(); });
      H.X.after(TR, () => { H.hitArea(mx, my, 1.4 + 0.25 * j, 1.6 * D * kD, C.dmgO({ kb: 3 }));
        for (const m of H.living()) { const rx = m.x - ox, ry = m.y - oy, al = rx * ca + ry * sa, of = -rx * sa + ry * ca; if (al > L * 0.4 && al < L + 0.5 && Math.abs(of) < OFF * 0.6) H.X.hitMon(m, 0.6 * D * kD, C.dmgO({ kb: 2 })); }
        splash(mx, my, 1.4 + 0.3 * j, 0.6 + 0.5 * j); H.burst(mx, my - 1.2 * s, 'bubble', 8 + 4 * j, { v: 4 + j, up: 4, g: 9, life: 0.7, size: 3.5, color: [PALE, AQ, WH] }); H.X.sfx.crash(); H.X.shake(3 + 2 * j, 0.12); }); })); };

  /* ================= Pearlburst Volley ================= */
  S.pearlburst = (C, h) => { H = h; warm(); const me = H.me, ev = evOf(C), N = lv(ev, [3, 5, 8]), side = Math.sin(C.a) >= 0 ? -1 : 1, GAP = lv(ev, [0.3, 0.22, 0.17]), GR = lv(ev, [0.15, 0.3, 0.55]), D = DK(C) * 2.6;
    const ps = [], sc = []; for (let i = 0; i < N; i++) sc.push(1 + GR * i / Math.max(1, N - 1)); const sumS = sc.reduce((p, q) => p + q, 0);
    for (let i = 0; i < N; i++) ps.push({ i, s: sc[i], ang: C.a + side * Math.PI * (0.38 + 0.5 * i / Math.max(1, N - 1)), hz: 0.85 + 0.4 * (i % 2) + 0.1 * Math.sin(i), x: me.x, y: me.y, z: 0.9, orb: i * 2, st: 'form', ft: 0, trail: [], tx: 0, ty: 0, ft0: 0.35 + i * GAP });
    H.X.sfx.hum();
    H.add({ life: 0.35 + (N - 1) * GAP + 1.2,
      update(dt, f) { const t = f.t; let live = 0;
        for (const p of ps) { if (p.st === 'gone') continue; live++; p.orb += dt * 5;
          if (p.st === 'form') { const rr = 1.0 + 0.15 * (p.i % 2); p.x = me.x + Math.cos(p.ang) * rr; p.y = me.y + Math.sin(p.ang) * rr * 0.8; p.z = p.hz * H.ease.out(cl((t - p.i * 0.04) / 0.3)) + Math.sin(t * 3 + p.i) * 0.06;
            if (t >= p.ft0) { const list = H.sortNear(C.tx, C.ty, H.living().filter(m => Math.hypot(m.x - me.x, m.y - me.y) < 9)).slice(0, 3), m = list.length ? list[p.i === N - 1 ? 0 : p.i % list.length] : null;
              p.tx = m ? m.x : me.x + Math.cos(C.a) * 5; p.ty = m ? m.y : me.y + Math.sin(C.a) * 5; p.st = 'fly'; foam(p.x, p.y - p.z, 4, 3, 1); H.X.sfx.whoosh(); } continue; }
          p.ft += dt; const d = Math.hypot(p.tx - p.x, p.ty - p.y), v = 14 * dt; p.trail.push([p.x, p.y, p.z]); if (p.trail.length > 9) p.trail.shift();
          if (d < Math.max(0.3, v) || p.ft > 1.0) { p.st = 'gone'; const last = p.i === N - 1, r = (last ? 1.6 : 1.05) * p.s;
            H.hitArea(p.tx, p.ty, r, D * p.s / sumS, C.dmgO({ kb: last ? 3 : 2 })); splash(p.tx, p.ty, r, last ? 1.3 * p.s : 0.5 * p.s);
            for (let k = 0; k < H.n(5 + Math.round(p.s * 2)); k++) { const b = p.orb + k / 6 * TAU; H.P({ kind: 'bubble', x: p.tx + Math.cos(b) * 0.3, y: p.ty - 0.4 + Math.sin(b) * 0.2, vx: Math.cos(b) * 5 * p.s, vy: Math.sin(b) * 3 - 2, g: 9, life: 0.55, max: 0.55, size: 3, color: k % 2 ? PALE : AQ }); }
            if (last) H.X.ring(p.tx, p.ty, 0.3, r * 1.3, 0.35, AQ, 0.25); H.X.sfx.crash(); H.X.shake(2 + p.s * 1.5 + (last ? 2 : 0), 0.1); }
          else { p.x += (p.tx - p.x) / d * v; p.y += (p.ty - p.y) / d * v; p.z = Math.max(0.4, p.z - dt * 0.9); } }
        if (!live) f.life = 0; },
      draw(c, f, X, Y, T) { const t = f.t; c.save(); hole(c, T); const PS = pearlSpr();
        for (const p of ps) { if (p.st === 'gone') continue; const PX = H.sx(p.x), PY = H.sy(p.y) - p.z * T, r = T * 0.26 * p.s, ch = p.st === 'form' ? cl(1 - (p.ft0 - t) / 0.3) : 0;
          H.softShadow(c, PX, H.sy(p.y), r * 1.1, 0.16);
          if (p.st === 'fly' && p.trail.length > 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const pts = p.trail.map(q => [H.sx(q[0]), H.sy(q[1]) - q[2] * T]).concat([[PX, PY]]);
            for (const [col, lw] of [['rgba(63,208,224,0.25)', r * 1.8], ['rgba(160,245,255,0.45)', r * 0.8], ['rgba(255,255,255,0.7)', r * 0.25]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke(); } c.restore(); }
          c.save(); c.globalCompositeOperation = 'lighter'; H.glow(c, PX, PY, r * (2 + ch), AQ, 0.25 + 0.4 * ch); c.restore();
          const st = p.st === 'fly' ? 1.18 : 1 + 0.12 * ch; c.save(); c.translate(PX, PY); if (p.st === 'fly') c.rotate(Math.atan2(H.sy(p.ty) - PY, H.sx(p.tx) - PX)); c.scale(st, 1 / st); c.drawImage(PS, -r * 1.15, -r * 1.15, r * 2.3, r * 2.3); c.restore();
          for (let i = 0; i < 5; i++) { const b = p.orb + i / 5 * TAU, rr = r * 1.8, front = Math.sin(b) > 0, dr = r * 0.32 * (0.8 + 0.2 * Math.sin(b)); c.globalAlpha = front ? 0.95 : 0.55; c.drawImage(PS, PX + Math.cos(b) * rr - dr, PY + Math.sin(b) * rr * 0.42 - dr, dr * 2, dr * 2); } c.globalAlpha = 1; }
        c.restore(); } }); };

  /* ================= Falling Basin ================= */
  S.basin = (C, h) => { H = h; warm(); const ev = evOf(C), x0 = C.tx, y0 = C.ty, px = -Math.sin(C.a), py = Math.cos(C.a), FORM = 0.4, TIP = 0.3, POUR = 0.45, DIS = 0.4;
    const cfg = lv(ev, [[[0, 1, 0]], [[-1.5, 0.8, 0], [0, 1.15, 0.35]], [[-1.6, 0.8, 0], [1.6, 0.95, 0.25], [0, 1.35, 0.55]]]), sumS = cfg.reduce((s, q) => s + q[1], 0), D = DK(C);
    H.X.sfx.hum();
    cfg.forEach(([o, s, d], bi) => { const x = x0 + px * o, y = y0 + py * o, Z = 2.4 * s + 0.5, kD = s / sumS, big = bi === cfg.length - 1 && cfg.length > 1, tipDir = o > 0 ? -1 : 1;
      H.X.after(d, () => { H.X.sfx.hum();
        H.add({ life: FORM + TIP + POUR + DIS, x, y,
          update(dt, f) { const t = f.t; if (t > FORM + TIP && t < FORM + TIP + POUR && Math.random() < 1.5 * H.Q()) H.P({ kind: Math.random() < 0.6 ? 'spark' : 'bubble', x: x + (Math.random() - 0.5) * 0.9 * s, y, vx: (Math.random() - 0.5) * 6 * s, vy: -3 - Math.random() * 3 * s, g: 11, life: 0.45, max: 0.45, size: 2 + Math.random() * 2, color: Math.random() < 0.5 ? WH : PALE });
            if (t > FORM + TIP + POUR && Math.random() < 1.5 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'bubble', x: x + Math.cos(b) * 1.3 * s, y: y - Z + Math.sin(b) * 0.4 * s, vx: 0, vy: 3, g: 6, life: 0.55, max: 0.55, size: 2.5 + Math.random() * 2, color: Math.random() < 0.5 ? PALE : AQ }); } },
          drawUnder(c, f, X, Y, T) { const t = f.t, form = H.ease.out(cl(t / FORM)), pour = cl((t - FORM - TIP) / POUR), k = 1 - cl((t - FORM - TIP - POUR) / DIS);
            // the aqua mark gathering under the bowl, then the foam basin where it lands (light only)
            c.globalCompositeOperation = 'lighter'; const d = T * 1.4 * s * 2 * (0.5 + 0.5 * form + 0.6 * pour); c.globalAlpha = (0.3 + 0.5 * pour) * k; c.drawImage(ringSpr(), X - d / 2, Y - d / 2 * H.GY, d, d * H.GY); H.glow(c, X, Y, T * s * (0.8 + pour), AQ, 0.25 * k * (0.4 + pour)); },
          draw(c, f, X, Y, T) { const t = f.t, form = H.ease.out(cl(t / FORM)), tip = cl((t - FORM) / TIP), pour = cl((t - FORM - TIP) / POUR), diss = cl((t - FORM - TIP - POUR) / DIS), rw = T * 1.5 * s * form, cy = Y - T * Z, k = 1 - diss;
            if (rw < 1) return; c.save(); hole(c, T);
            // the waterfall: a scrolling column from the bowl's lip down to the ground
            if (pour > 0 && pour < 1) { const fall = cl(pour / 0.3), w = T * 0.62 * s * (1 + 0.08 * Math.sin(t * 14)) * (1 - 0.5 * cl((pour - 0.7) / 0.3)), top = cy + rw * 0.15, len = (Y - top) * fall, off = Math.floor((t * 420) % 128);
              c.globalAlpha = 0.92; c.drawImage(colSpr(), 0, 128 - off, 64, 128, X - w / 2, top, w, len); c.globalCompositeOperation = 'lighter'; H.glow(c, X, top + len, w * 1.2, PALE, 0.4 * fall); c.globalCompositeOperation = 'source-over'; }
            // the bowl, tipping, its water surface draining; the rim dissolving after the pour
            c.save(); c.translate(X, cy); c.rotate(tipDir * tip * 0.85 * (1 - pour * 0.3)); c.globalAlpha = k; const bw = rw * 2.15, bh = bw * 0.6; c.drawImage(bowlSpr(), -bw / 2, -bh * 0.31, bw, bh);
            const wl = 1 - pour; if (wl > 0.02) { const ry = rw * 0.3 * 0.92; c.fillStyle = `rgba(63,208,224,${(0.6 * wl * k).toFixed(3)})`; c.beginPath(); c.ellipse(0, 0, rw * 0.9, Math.max(1, ry), 0, 0, TAU); c.fill();
              c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(232,251,255,${(0.55 * wl * k).toFixed(3)})`; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const q = t * (1.2 + i * 0.4) + i * 2; c.beginPath(); c.ellipse(Math.cos(q) * rw * 0.3, Math.sin(q) * ry * 0.3, rw * 0.35, ry * 0.35, 0, q, q + 1.6); c.stroke(); } }
            c.restore(); c.restore(); } });
        H.X.after(FORM + TIP + 0.15, () => { H.hitArea(x, y, 1.1 * s, 1.4 * D * kD, C.dmgO({ kb: 2 })); foam(x, y, 8 + 6 * s, 4, 4); floorRing(x, y, 1.1 * s, 0.45, 0.9); H.X.sfx.crash(); H.X.shake(3 + (big ? 3 : 0), 0.12); });
        H.X.after(FORM + TIP + POUR, () => { H.hitRing(x, y, 0.4, 2.2 * s, 1.2 * D * kD, C.dmgO({ kb: 3 })); H.X.ring(x, y, 0.3, 2.2 * s, 0.4, AQ, 0.25); splash(x, y, 2.2 * s, big ? 1.5 : 0.7); H.X.sfx.whoosh(); if (big) H.X.shake(6, 0.15); }); }); }); };
})();
