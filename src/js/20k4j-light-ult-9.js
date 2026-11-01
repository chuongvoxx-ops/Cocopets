/* ---------- Light (pink): Aphrodite's Beam (replaces Crescent Beam) ----------
   A great pink love heart (the same thick spinning heart as Rainbow Heart Attack) sprouts above the pet, rises and spins
   like a top, swaying a little; every third of a second it fires pink rays at the nearest monsters (3, 4 at Adept, 5 at
   Celestial), each a curved beam with a pearl core, a candy body and a rose glow, and little love hearts sprout where
   they strike. It follows the pet. 7 s / 10 s at Adept / 14 s at Celestial; Adept adds stars orbiting the heart,
   Celestial a larger heart framed by two turning heart outlines. At the end it slows, flares and dissolves into
   expanding heart outlines and rising hearts. */
(() => {
  const U = ELEM_IMPL.light.ult, TAU = Math.PI * 2;
  delete U.crescentbeam;
  const ROSE = '#FF5CCB', CANDY = '#FF8FDB', BLUSH = '#FFD4EE', PEARL = '#FFF4FC', LAV = '#D5C4FF';
  const cl = u => Math.max(0, Math.min(1, u)), sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

  U.aphroditebeam = (C, H) => {
    const K = globalThis.LU1; K.setH(H);
    const me = H.me, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1;
    const DUR = ev <= 4 ? 7 + (ev - 1) : 10 + (ev - 4) * 4 / 3, TICK = 0.33, NTG = tier + 2, RANGE = 9 * Math.max(1, C.K * 0.9);
    const DK = C.base * C.K * (1 + 0.08 * (ev - 1)), DMG = DK * 15 / (7 / TICK);   // a monster in reach the whole time: 15 x per 7 s
    const GROW = 0.55, OUT = 0.9, HP0 = (tier === 3 ? 2.3 : tier === 2 ? 2.0 : 1.75);   // the heart's height in tiles
    const B = K.bits(), zaps = [];
    H.X.banner("APHRODITE'S BEAM", '', ROSE, 1.4); H.X.sfx.hum();
    return H.add({ life: DUR + OUT, x: me.x, y: me.y, tk: GROW, n: 0,
      update(dt, f) {
        const t = f.t; f.x = me.x; f.y = me.y; B.step(dt);
        for (let i = zaps.length - 1; i >= 0; i--) { zaps[i].t += dt; if (zaps[i].t > 0.3) zaps.splice(i, 1); }
        if (t < DUR && t >= f.tk) { f.tk += TICK; f.n++;
          const tg = H.sortNear(me.x, me.y).filter(m => Math.hypot(m.x - me.x, m.y - me.y) < RANGE + m.r).slice(0, NTG);
          for (const m of tg) { H.X.hitMon(m, DMG, C.dmgO({ kb: 0.5 })); zaps.push({ m, x: m.x, y: m.y, t: 0, sd: f.n * 7 + zaps.length, bend: (R1(f.n * 3.1 + m.x) - 0.5) * 2 });
            // little love hearts sprout where it strikes
            const nh = H.n(7 + 2 * tier); for (let q = 0; q < nh; q++) { const b = Math.random() * TAU, sp = 2.6 + Math.random() * 3.4; B.add(m.x, m.y, 0.45, { vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.55, vz: 1.6 + Math.random() * 2.6, g: 7, drag: 2.6, life: 0.4 + Math.random() * 0.3, s: 0.13 + Math.random() * 0.08, kind: q % 3 ? 'h' : 's', col: [CANDY, ROSE, BLUSH, tier === 3 ? LAV : PEARL][q % 4], rot: 0.4 }); } }
          for (const m of tg) H.burst(m.x, m.y - 0.45, 'spark', H.n(4 + tier), { v: 6, up: 2, g: 9, life: 0.28, size: 1.8, color: [PEARL, BLUSH, ROSE] });   // bright sparks with the hearts, like an ignition
          if (tg.length) { H.X.light(me.x, me.y - 2, 4, 0.2); if (f.n % 3 === 0) H.X.sfx.sparkle && H.X.sfx.sparkle(); }
        }
        // a few sparkles shed from the heart as it spins
        if (t < DUR && Math.random() < dt * 6 * H.Q()) { const b = Math.random() * TAU; B.add(me.x + Math.cos(b) * 0.5, me.y + 0.05, 2.3, { vx: Math.cos(b) * 0.5, vz: -0.3, life: 0.8, s: 0.06, kind: Math.random() < 0.5 ? 'h' : 's', col: Math.random() < 0.5 ? BLUSH : CANDY, drag: 0.8 }); }
        if (t >= DUR && !f.done) { f.done = true; const nh = H.n(10); for (let q = 0; q < nh; q++) { const b = q / nh * TAU; B.add(me.x, me.y, 2.2, { vx: Math.cos(b) * 1.6, vy: Math.sin(b) * 0.8, vz: 0.6 + Math.random(), g: 0.4, drag: 1, life: 1.1, s: 0.1, kind: q % 2 ? 'h' : 's', col: q % 3 ? CANDY : PEARL }); } }
      },
      draw(c, f, X, Y, T) {
        const t = f.t, g0 = H.ease.back ? H.ease.back(cl(t / GROW)) : sm(t / GROW), out = cl((t - DUR) / OUT), a = Math.min(1, t / 0.2) * (1 - out);
        const px = H.sx(me.x), py = H.sy(me.y), hh = T * HP0 * Math.max(0, g0) * (1 - 0.35 * out), hx = px + Math.sin(t * 1.7) * T * 0.12, hy = py - T * (1.3 + (0.9 + HP0 * 0.55) * sm(t / GROW)) - T * 0.12 * Math.sin(t * 2.3);
        const spin = t < DUR ? t * (3.2 + 0.8 * tier) : DUR * (3.2 + 0.8 * tier) + (t - DUR) * 2, lean = 0.12 * Math.sin(t * 1.3);
        c.save();
        // the rays: from the heart's lower point to each monster, a gentle curve, glow / body / pearl core, fading fast
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        const sx = hx, sy = hy + hh * 0.25;
        for (const z of zaps) { const u = z.t / 0.3, za = (u < 0.15 ? u / 0.15 : 1 - sm((u - 0.15) / 0.85)) * a; if (za < 0.02) continue;
          const mx = H.sx(z.m.dead ? z.x : z.m.x), my = H.sy(z.m.dead ? z.y : z.m.y) - T * 0.35, dx = mx - sx, dy = my - sy, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, bw = L * 0.12 * z.bend * (1 - u * 0.5);
          const cx = sx + dx * 0.5 + nx * bw, cy = sy + dy * 0.5 + ny * bw, wk = tier === 3 ? 1.25 : tier === 2 ? 1.1 : 1;
          for (const [col, lw, al] of [[ROSE, T * 0.42 * wk, 0.16], [ROSE, T * 0.24 * wk, 0.3], [CANDY, T * 0.11 * wk, 0.8], [PEARL, Math.max(1.2, T * 0.04 * wk), 0.95]]) { c.globalAlpha = al * za; c.strokeStyle = col; c.lineWidth = lw * (1 - 0.4 * u); c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(cx, cy, mx, my); c.stroke(); }
          K.glowC(c, mx, my, T * (0.7 + 0.3 * (1 - u)), ROSE, 0.55 * za); K.glowC(c, mx, my, T * 0.3, PEARL, 0.9 * za * (1 - u));
          if (u < 0.5) K.blitC(c, K.lineSpr(), mx, my, T * (0.8 + 1.4 * u), T * (0.8 + 1.4 * u), (1 - u * 2) * a, true); }
        // the heart's own light and, from Adept, stars orbiting it; at Celestial two heart outlines turn round it
        if (hh > 2) {
          K.glowC(c, hx, hy, hh * 1.5, ROSE, 0.3 * a); K.glowC(c, hx, hy + hh * 0.1, hh * 0.7, PEARL, (0.18 + 0.1 * Math.sin(t * 9)) * a);
          if (tier === 3) for (let q = 0; q < 2; q++) { const th = t * (q ? -1.3 : 0.9) + q * 1.4, ws = Math.abs(Math.cos(th)) * 0.85 + 0.15, sz = hh * (1.85 + q * 0.35); c.save(); c.globalAlpha = (0.45 - q * 0.12) * a; c.drawImage(K.lineSpr(), hx - sz * ws / 2, hy - sz * 0.47, sz * ws, sz); c.restore(); }
          if (tier >= 2) { const NS = tier === 3 ? 6 : 4; for (let q = 0; q < NS; q++) { const b = t * 2.2 + q / NS * TAU, ox = Math.cos(b) * hh * 0.95, oy = Math.sin(b) * hh * 0.28; if (Math.sin(b) < 0) K.blitC(c, K.starSpr(q % 2 ? BLUSH : PEARL), hx + ox, hy + oy, T * 0.32, T * 0.32, 0.5 * a, true); } }
          c.globalCompositeOperation = 'source-over';
          // the spinning heart itself (pulses as it fires)
          const lit = f.n && f.tk - t > TICK - 0.1 ? 0.6 : 0;
          K.thickHeart(c, hx, hy, hh, spin, lean, a, lit, (t * 0.6) % 1);
          c.globalCompositeOperation = 'lighter';
          if (tier >= 2) { const NS = tier === 3 ? 6 : 4; for (let q = 0; q < NS; q++) { const b = t * 2.2 + q / NS * TAU, ox = Math.cos(b) * hh * 0.95, oy = Math.sin(b) * hh * 0.28; if (Math.sin(b) >= 0) K.blitC(c, K.starSpr(q % 2 ? BLUSH : PEARL), hx + ox, hy + oy, T * 0.36, T * 0.36, 0.85 * a, true); } }
        }
        // the ending: nested heart outlines expanding from where the heart was
        if (out > 0) for (let q = 0; q < 3; q++) { const u = cl((t - DUR - q * 0.15) / 0.7); if (u <= 0 || u >= 1) continue; const sz = T * HP0 * (1.2 + 2.2 * u) * (1 + q * 0.2); K.blitC(c, K.lineSpr(), hx, hy, sz, sz, (1 - u) * 0.9, true); }
        c.restore();
        B.draw(c, T);
      } });
  };
})();
