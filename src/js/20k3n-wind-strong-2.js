/* ---------- (v370) Wind Strongs, new (2 of 3): Blades of Wind, Coconut Cyclone, Featherfall Curse, Wings of Sanctuary ----------
   See 20k3m for the shared rules (GPU wind through the wind kit, counts and damage in each move's table, every hit made
   in an update, everything moved by dt). The lasting ones (the ring of swords, the cyclone, the marks, the shield) end
   through their own cleanup when the pet dies or is swapped out; the floor's end throws all of them away. */
(() => {
  const S = ELEM_IMPL.wind.strong, TAU = Math.PI * 2, U = WDK.U, { cl, lerp, sm, eo, R1, tierOf, valid, aimPt } = U;
  const petOf = H => (H.X.pet ? H.X.pet() : H.X.ST()), alive = (H, P0) => !H.me.dead && petOf(H) === P0;

  /* ================= W-S05 Blades of Wind =================
     A slightly tilted ring of pale silver (a dimensional band: lit top, shaded side, engraved notches, an emerald channel of
     energy round its middle) forms round the pet's lower body with four long swords fixed to it, points outward (solid
     blades with a ridge and a thickness, emerald-set guards, luminous green cutting edges). The assembly turns round the
     pet and follows it everywhere; the far half passes behind the pet, the near half in front. Each sword cuts what it
     sweeps: a cutting trail behind every sword, a small burst of wind where it strikes. Near the end the channel dims and
     the trails thin; at the end the assembly dissolves into four streams of wind.
       swords      4 at every tier
       duration    20 / 25 / 30 s (recasting refreshes it: one ring a pet)
       hits        0.35 x base x K x (1 + 0.08 (evo - 1)) as a sword sweeps a monster (floor angle swept since the last frame;
                   reach 0.6 .. 2.35 tiles from the pet), each monster at most once every 0.55 s however many swords pass
     Turns at 3.4 rad / s (a sword passes a point every 0.46 s). The pet moves and attacks freely. Cost 32, cooldown 15 s. */
  S.windblades = (C, h) => { const H = h, me = H.me, g = H.g, tier = tierOf(C), ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), DUR = [20, 25, 30][tier], DMG = C.base * C.K * 0.35 * (1 + 0.08 * (ev - 1)), IV = 0.55, OM = 3.4, NS = 4, RR = 1.05, LS = 1.5, FORM = 0.5, ENDT = 0.9;
    const old = H.fx.find(f => f.key === 'windblades' && f.st === 'on');
    if (old) { old.until = g.t + DUR; old.dur = DUR; old.flash = g.t; old.dmg = Math.max(old.dmg, DMG); H.X.sfx.hum && H.X.sfx.hum(); return old; }   /* (refreshed: never a second ring) */
    const P0 = petOf(H), last = new Map(), imps = [], dbg = { hits: 0, refresh: 0 };
    H.X.sfx.hum && H.X.sfx.hum(); me.sq = 0.75;
    const F = H.add({ key: 'windblades', life: 1e6, st: 'on', t0: g.t, until: g.t + DUR, dur: DUR, dmg: DMG, rot: Math.random() * TAU, flash: -9, endT: 0, dbg, imps,
      update(dt, f) { const now = g.t;
        if (f.st === 'on' && (!alive(H, P0) || now >= f.until)) { f.st = 'end'; f.endT = now; H.X.sfx.whoosh && H.X.sfx.whoosh(); }
        if (f.st === 'end') { f.rot += OM * dt * 0.6; if (now - f.endT > ENDT) f.life = 0; return; }
        const r0 = f.rot; f.rot += OM * dt; const form = cl((now - f.t0) / FORM); if (form < 0.6) return;
        // the cuts: each sword's floor angle swept since the last frame, against every monster in its reach
        for (const m of H.living()) { if (!valid(m)) continue; const dx = m.x - me.x, dy = m.y - me.y, d = Math.hypot(dx, dy), mr = m.r || 0.4; if (d > RR + LS + mr || d < RR * 0.6 - mr) continue;
          const lt = last.get(m); if (lt != null && now - lt < IV) continue; const am = Math.atan2(dy, dx), tol = Math.asin(Math.min(1, mr / Math.max(d, mr))) + 0.05;
          for (let i = 0; i < NS; i++) { const a0 = r0 + i * TAU / NS; let da = ((am - a0) % TAU + TAU) % TAU; if (da > Math.PI) da -= TAU;
            if (da >= -tol && da <= OM * dt + tol) { last.set(m, now); dbg.hits++; H.X.hitMon(m, f.dmg, C.dmgO({ kb: 1.2 })); imps.push({ x: m.x, y: m.y, z: 0.35 + mr * 0.6, t: now, a: am, sd: Math.random() * 9 }); if (imps.length > 12) imps.shift();
              for (let k = 0; k < H.n(3); k++) U.wisp(H, m.x, m.y - 0.4, Math.cos(am + 1.6) * 4, Math.sin(am + 1.6) * 3, 0.3); if (Math.random() < 0.5) H.X.sfx.whoosh && H.X.sfx.whoosh(); break; } } }
        if (Math.random() < 0.6 * H.Q()) { const b = f.rot + Math.floor(Math.random() * 4) * TAU / 4, d = RR + LS * Math.random(); U.wisp(H, me.x + Math.cos(b) * d, me.y + Math.sin(b) * d - 0.4, -Math.sin(b) * 3, Math.cos(b) * 2, 0.3); } },
      onEnd() { for (const k of kids) k.life = 0; } });
    // the far half (behind the pet) and the near half (in front of it), depth-sorted among the others
    const kids = [H.add({ key: 'windbladesB', life: 1e6, entY: me.y - 0.01, drawEnt: c => paint(c, 0), update(dt, k) { k.entY = me.y - 0.01; } }), H.add({ key: 'windbladesF', life: 1e6, entY: me.y + 0.02, drawEnt: c => paint(c, 1), update(dt, k) { k.entY = me.y + 0.02; } })];
    function paint(c, near) { const G = WDK.bind(H), P = G.P, T = H.X.Tz(), now = g.t, f = F, X = H.sx(me.x), Yf = H.sy(me.y), zc = 0.42 + (me.r || 0.35) * 0.3, Yc = Yf - zc * T, k = 0.42, beta = 0.08 * Math.sin(now * 0.7), cb = Math.cos(beta), sb = Math.sin(beta);
      const form = eo((now - f.t0) / FORM), endU = f.st === 'end' ? cl((now - f.endT) / ENDT) : 0, rem = f.until - now, dim = f.st === 'on' ? 0.35 + 0.65 * cl(rem / 3) : 0.3, fl = Math.max(0, 1 - (now - f.flash) / 0.5), A = (1 - endU) * Math.min(1, form * 1.3);
      const pt = (th, r, dz) => { const ex = Math.cos(th) * r * T, ey = Math.sin(th) * r * T * k; return [X + ex * cb - ey * sb, Yc + ex * sb + ey * cb + (dz || 0) * T]; };
      const isNear = th => Math.sin(th) > 0;
      // the swords' angles, this half's, back to front
      const sw = []; for (let i = 0; i < NS; i++) { const th = f.rot + i * TAU / NS; if (isNear(th) === !!near) sw.push([th, i]); } sw.sort((a, b) => Math.sin(a[0]) - Math.sin(b[0]));
      G.layer(c, () => {
        // cutting trails behind each sword (thinner near the end), the energy channel in the ring
        for (const [th, i] of sw) { const tr = 0.8 * dim * A, len = 1.2 * (0.5 + 0.5 * dim); G.arc(c, X, Yc, (RR + LS * 0.98) * T, th, tr, { k, beta, dir: 1, mode: 0, span: len, th: (LS * 0.82) / (RR + LS) * (0.55 + 0.45 * dim), seed: i * 2.3, dens: 0.55 }); }
        G.wring(c, X, Yc, RR * T, RR * T * k, beta, (0.55 + 0.45 * fl) * dim * A, { side: near ? 1 : 0, th: 0.07, spin: 4, seed: 1.7, col: P.emer });
        if (near) G.glow(c, X, Yc, (RR + 0.3) * T, P.jade, 0.16 * dim * A, k);
        // the impact bursts (a small wind burst where a sword struck)
        for (const q of f.imps) { const u = (now - q.t) / 0.35; if (u > 1 || (Math.sin(q.a) > 0) !== !!near) continue; const qx = H.sx(q.x), qy = H.sy(q.y) - q.z * T; G.arc(c, qx, qy, T * (0.35 + 0.5 * eo(u)), q.a + 1.6, 1 - u, { k: 0.7, beta: q.sd, mode: 0, span: 2.2, th: 0.18, seed: q.sd }); G.ring(c, qx, qy, T * 0.6 * eo(u), 0.8 * (1 - u), { k: 0.75, th: 0.15 }); }
        // the dissolve: four streams of wind spiralling away from the swords
        if (endU > 0) for (let i = 0; i < NS; i++) { const th0 = f.rot + i * TAU / NS; if (isNear(th0 + endU * 1.5) !== !!near) continue; const pts = []; for (let j = 0; j <= 12; j++) { const v = j / 12, th = th0 + endU * 2.2 - v * 1.4, r = RR + LS * (0.4 + 0.5 * v) + endU * 2.2 * (1 - v); const p = pt(th, r, -endU * 1.4 * (1 - v)); pts.push([p[0], p[1], T * 0.18 * (1 - v * 0.6)]); } G.rib(c, pts, T * 0.18, (1 - endU) * 0.95, { edge: 0, taper: 0.7, seed: i, flow: 7 }); } });
      if (A < 0.02) return;
      // the ring: a band of pale silver, seen in this half (its side faces, its top, engraved notches)
      c.save(); c.globalAlpha = A; c.lineJoin = 'round'; const a0 = near ? 0 : Math.PI, a1 = near ? Math.PI : TAU, n = 24, bw = 0.15, bh = 0.11;
      const band = (r0, r1, dz0, dz1) => { c.beginPath(); for (let j = 0; j <= n; j++) { const p = pt(a0 + (a1 - a0) * j / n, r0, dz0); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } for (let j = n; j >= 0; j--) { const p = pt(a0 + (a1 - a0) * j / n, r1, dz1); c.lineTo(p[0], p[1]); } c.closePath(); };
      if (near) { band(RR + bw, RR + bw, 0, bh); c.fillStyle = P.steel; c.fill(); } else { band(RR - bw, RR - bw, 0, bh); c.fillStyle = '#7F9396'; c.fill(); }
      band(RR - bw, RR + bw, 0, 0); const gr = c.createLinearGradient(X, Yc - RR * T * k, X, Yc + RR * T * k); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.5, P.silver); gr.addColorStop(1, '#C3D0D1'); c.fillStyle = gr; c.fill();
      c.strokeStyle = H.rgba('#24343A', 0.8); c.lineWidth = Math.max(1, T * 0.025); c.stroke();
      // the emerald channel (its glow is the GPU ring), engraved notches turning with it
      c.strokeStyle = H.rgba(P.emer, 0.9 * (0.5 + 0.5 * dim)); c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); for (let j = 0; j <= n; j++) { const p = pt(a0 + (a1 - a0) * j / n, RR, 0); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
      c.strokeStyle = H.rgba('#4B5E62', 0.75); c.lineWidth = Math.max(0.7, T * 0.015); c.beginPath(); for (let j = 0; j < 24; j++) { const th = f.rot + j * TAU / 24; if (isNear(th) !== !!near) continue; const p = pt(th, RR - bw * 0.9), q = pt(th, RR - bw * 0.35); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); const p2 = pt(th, RR + bw * 0.35), q2 = pt(th, RR + bw * 0.9); c.moveTo(p2[0], p2[1]); c.lineTo(q2[0], q2[1]); } c.stroke(); c.restore();
      // the swords (back to front): hilt at the ring, point outward, in the ring's plane
      for (const [th, i] of sw) { const b = pt(th, RR - 0.05), tp = pt(th, RR + LS); G.sword(c, b[0], b[1], tp[0], tp[1], T * 0.12 * (0.7 + 0.3 * Math.abs(Math.sin(th))), A, { glow: (0.45 + 0.55 * dim) * (1 + fl), thick: T * 0.07 }); } }
    return F; };

  /* ================= W-S06 Coconut Cyclone =================
     A circular gust stirs at the aimed ground (dust, small leaves and bits of coconut circling), the pet gestures and the
     air rises into a great tropical tornado: a narrow twisting foot churning against the floor, a broad funnel above, its
     ribbons of emerald and turquoise wound in three layers turning at different speeds, white pressure streaks, gaps
     through which the monsters inside stay visible. Coconuts and palm leaves ride spiral paths inside it. Near the end the
     funnel contracts and its bands race, and it collapses in one final burst of wind that throws the coconuts and leaves
     out to dissolve.
       one cyclone at every tier; rises in 0.6 s, lasts 4 s (FORM, DUR below)
       ticks      every 0.4 s through those 4 s (10 ticks): 0.28 x base x K x (1 + 0.08 (evo - 1)) to every monster within
                  2.0 x K tiles of its centre (one hitArea a tick)
       collapse   0.6 s; then one final burst: 1.4 x base x K x (1 + 0.08 (evo - 1)), radius 2.6 x K tiles
     A modest inward current draws ordinary monsters toward its eye (H.pull: bosses stay put). Cost 30, cooldown 6 s. */
  S.cyclone = (C, h) => { const H = h, me = H.me, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), EK = 1 + 0.08 * (ev - 1), RH = 2.0 * C.K, DT = C.base * C.K * 0.28 * EK, DF = C.base * C.K * 1.4 * EK, FORM = 0.6, DUR = 4.0, IVL = 0.4, COL = 0.6, FADE = 0.75, HH = 4.6, RW = 1.9 * C.K;
    const [x, y] = aimPt(H, C, 8), dbg = { ticks: 0, fin: 0, hits: 0 }; H.warn(x, y, RH, FORM, C.col); me.sq = 0.65; H.X.sfx.hum && H.X.sfx.hum();
    const deb = []; for (let i = 0; i < 14; i++) { const nut = i < 5; deb.push({ nut, th: R1(i * 3.7) * TAU, om: (nut ? 2.6 : 3.4) + R1(i * 5.1) * 1.4, hb: nut ? 0.18 + 0.4 * R1(i * 2.2) : 0.3 + 0.55 * R1(i * 7.9), hp: R1(i * 9.3) * TAU, s: nut ? 0.2 + 0.05 * R1(i) : 0.55 + 0.25 * R1(i + 3), rot: R1(i * 1.3) * TAU, vr: (R1(i * 4.4) - 0.5) * 9, sx: 0, sy: 0, vx: 0, vy: 0, vz: 0, z: 0, x: 0, y: 0 }); }
    let next = FORM + IVL / 2, fin = false;
    const geo = t => { const cu = cl((t - (FORM + DUR - COL)) / COL), rise = eo(t / FORM); return { cu, rise, rw: RW * (0.35 + 0.65 * rise) * (1 - 0.55 * sm(cu)), hh: HH * rise * (1 - 0.18 * cu), spin: 1.2 + 2.2 * cu }; };
    const F = H.add({ key: 'cyclone', life: FORM + DUR + FADE + 0.1, x, y, dbg, deb,
      update(dt, f) { const t = f.t;
        while (!fin && t >= next && next < FORM + DUR) { dbg.ticks++; dbg.hits += H.hitArea(x, y, RH, DT, C.dmgO({ kb: 0.3 })) || 0; next += IVL; }   /* (a fixed cadence, however long the frame) */
        if (!fin && t >= FORM + DUR) { fin = true; dbg.fin++; dbg.hits += H.hitArea(x, y, RH * 1.3, DF, C.dmgO({ kb: 6 })) || 0; H.X.shake(7, 0.22); H.X.sfx.thud && H.X.sfx.thud(); H.X.sfx.whoosh && H.X.sfx.whoosh(); H.X.light && H.X.light(x, y, RH * 1.6, 0.35);
          for (const d of deb) { const G0 = geo(t), hgt = d.hb + 0.12 * Math.sin(t * 1.3 + d.hp), rr = (G0.rw / C.K) * (0.25 + 0.7 * hgt) * 0.8; d.x = x + Math.cos(d.th) * rr; d.y = y + Math.sin(d.th) * rr * 0.6; d.z = hgt * G0.hh; const v = 4 + Math.random() * 4; d.vx = Math.cos(d.th) * v; d.vy = Math.sin(d.th) * v * 0.6; d.vz = 2 + Math.random() * 3; }
          for (let k = 0; k < H.n(24); k++) { const b = k / 24 * TAU; U.wisp(H, x + Math.cos(b) * 0.6, y + Math.sin(b) * 0.4 - 0.5, Math.cos(b) * 9, Math.sin(b) * 6, 0.55); } }
        if (fin) { for (const d of deb) { d.x += d.vx * dt; d.y += d.vy * dt; d.z = Math.max(0, d.z + d.vz * dt); d.vz -= 9 * dt; d.rot += d.vr * dt * 2; } return; }
        for (const d of deb) { d.th += d.om * dt * geo(t).spin * 0.8; d.rot += d.vr * dt; }
        if (t > FORM * 0.4) for (const m of H.near(x, y, RH + 1)) H.pull(m, x, y, dt * 0.9);
        if (Math.random() < 3 * H.Q()) { const b = Math.random() * TAU, r = RH * (0.5 + 0.5 * Math.random()); H.P({ kind: 'spark', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r * 0.6, vx: -Math.sin(b) * 5, vy: Math.cos(b) * 3 - 1.5, life: 0.5, max: 0.5, size: 1.6, color: Math.random() < 0.6 ? '#E6DAB4' : '#BFF5DA' }); }
        if (Math.random() < 0.7 * H.Q()) U.leafP(H, x + (Math.random() - 0.5) * 1.5, y - HH * 0.8, (Math.random() - 0.5) * 6, -1 - Math.random() * 2, 0.7); },   /* (debris peeling away near the top) */
      drawUnder(c, f, X, Y, T) { const G = WDK.bind(H), t = f.t, P = G.P, G0 = geo(t), fu = fin ? cl((t - FORM - DUR) / FADE) : 0, a = (1 - fu) * Math.min(1, t / 0.25);
        G.layer(c, () => { G.swirl(c, X, Y, T * RH * (0.75 + 0.25 * G0.rise), 0.9 * a, { spin: 2.5 * G0.spin, seed: 3.1 });
          G.ring(c, X, Y, T * RH, 0.7 * a * (1 - G0.cu * 0.5), { th: 0.08, seed: 2, col: P.deep, lite: P.mint });   /* (its reach, on the floor) */
          for (let j = 0; j < 4; j++) G.arc(c, X, Y, T * RH * (0.45 + j * 0.14), t * (5 + j) * G0.spin + j * 1.6, 0.6 * a, { mode: 0, span: 2.2, th: 0.18, seed: j });
          for (let j = 0; j < 5; j++) { const b = t * 3.5 * G0.spin + j * 1.25; G.puff(c, X + Math.cos(b) * T * RH * 0.45, Y + Math.sin(b) * T * RH * 0.25, T * 0.55, 0.45 * a, { col: '#E8DFC2', seed: j + Math.floor(t * 5) * 0.2, spread: 0.3, sy: 0.6 }); }
          if (fin) { const e = eo(fu / 0.5); G.ring(c, X, Y, T * RH * 1.3 * (0.3 + 0.75 * e), 1 - fu, { th: 0.15, col: P.deep, lite: P.mintW, seed: 5 }); G.ripple(c, X, Y, T * RH * 1.3 * (0.5 + 0.8 * e), 0.6 * (1 - fu), { th: 0.06 }); } }); },
      draw(c, f, X, Y, T) { const G = WDK.bind(H), t = f.t, P = G.P, G0 = geo(t), fu = fin ? cl((t - FORM - DUR) / FADE) : 0;
        const dpos = d => { const hgt = cl(d.hb + 0.12 * Math.sin(t * 1.3 + d.hp)), rr = G0.rw * T * (0.22 + 0.72 * Math.pow(hgt, 1.1)) * 0.85; return [X + Math.cos(d.th) * rr + Math.sin(hgt * 4 - t * 1.7) * 0.05 * T, Y - hgt * G0.hh * T + Math.sin(d.th) * rr * 0.3, Math.sin(d.th)]; };
        const drawDeb = (front) => { for (const d of deb) { if (fin) { if (!front) continue; const a = 1 - fu; const sx = H.sx(d.x), sy = H.sy(d.y) - d.z * T; if (d.nut) G.coconut(c, sx, sy, T * d.s, d.rot, a); else G.palm(c, sx, sy, d.rot, T * d.s, a, Math.cos(d.rot * 2)); continue; }
            const p = dpos(d); if ((p[2] > 0) !== front) continue; const a = Math.min(1, t / FORM) * (front ? 1 : 0.7); if (d.nut) G.coconut(c, p[0], p[1], T * d.s, d.rot, a); else G.palm(c, p[0], p[1], d.th + Math.PI / 2 + Math.sin(t * 3 + d.hp) * 0.6, T * d.s, a, Math.cos(d.th * 2 + t)); } };
        if (!fin) drawDeb(false);
        G.layer(c, () => { if (!fin || fu < 0.35) { const a = fin ? 1 - fu / 0.35 : Math.min(1, t / (FORM * 0.6)); G.funnel(c, X, Y + T * 0.1, G0.rw * T * (fin ? 1 + fu : 1), G0.hh * T, a * 0.95, { base: 0.13, spin: G0.spin, seed: 4.2, dens: 0.38 });
            G.glow(c, X, Y - G0.hh * T * 0.3, G0.rw * T * 0.9, P.jade, 0.18 * a);
            for (let j = 0; j < 6; j++) { const v = 0.1 + j * 0.14, rr = G0.rw * T * (0.13 + 0.79 * Math.pow(v, 1.25)) * 1.02, cx = X + Math.sin(v * 4 - t * 1.7) * 0.05 * (0.3 + v) * G0.rw * T;   /* (sharp-edged ribbons wound round it at different speeds) */
              G.arc(c, cx, Y - v * G0.hh * T, rr, t * G0.spin * (3.2 + j * 0.7) + j * 1.9, 0.75 * a, { k: 0.3, mode: 0, span: 2.2 + 0.3 * (j % 3), th: 0.16, seed: j * 1.3, dens: 0.45 }); } }
          if (fin && fu < 0.5) { const e = eo(fu / 0.4); G.gust(c, X, Y - T * RH * 0.5, T * RH * 1.25 * e, 1 - fu / 0.5, { core: Math.max(0, 1 - fu / 0.15), spin: 3, seed: 7, shade: 0.3 }); } });
        drawDeb(true); } });
    return F; };

  /* ================= W-S07 Featherfall Curse =================
     The pet looses a shimmering plume that arcs up over the aim and bursts, showering spectral feathers; they settle on the
     monsters and melt into glowing feather-shaped marks with small curling currents of air round them. A marked monster
     takes more from every allied hit and walks slower; when the mark runs out its feathers peel away, spiral round it and
     collapse into a sharp burst of wind.
       area       2.6 tiles round the aim (the monsters there when the feathers land, 0.8 s after the cast)
       duration   6 / 8 / 10 s
       mark       defence -15% (every allied hit x1.15, bosses too); walking speed -20% (never a boss)
       wear       (v371) 0.3 x base x K to the marked monster every 1 s while marked (6 / 8 / 10 ticks; a refresh keeps
                  the one clock)
       expiry     1.8 x base x K to the marked monster (one hitMon, resolved before the mark is cleared)
     Recasting refreshes a mark's time (and stops a mark that had begun to peel): never a second mark, never a stacked cut, never
     a second pending burst. Cost 26, cooldown 6 s. */
  const FFV = { def: 0.15, slow: 0.2, peel: 0.5, burst: 0.35, iv: 1.0, dot: 0.3 };
  function ffMgr(H) { let M = H.fx.find(f => f.key === 'ffMgr' && f.life > 0); if (M) return M;
    const marks = new Map();
    M = H.add({ key: 'ffMgr', life: 1e6, marks,
      update(dt, f) { const now = H.g.t;
        for (const [m, k] of marks) {
          if (k.st === 'on') { if (m.dead || H.mons.indexOf(m) < 0 || m.under || m.fobj) { clear(m, k); marks.delete(m); continue; }
            while (now >= k.nt && k.nt < k.until) { k.nt += FFV.iv; k.dbg.dots++; H.X.hitMon(m, k.dot, k.C.dmgO({ kb: 0 })); k.fl = now; }   /* (v371: damage over time, one hit a second of the game clock) */
            if (now >= k.until) { k.st = 'peel'; k.pt = now; } }
          if (k.st === 'peel') { if (m.dead) { clear(m, k); marks.delete(m); continue; } if (now - k.pt >= FFV.peel) { k.st = 'burst'; k.bt = now; k.bx = m.x; k.by = m.y; k.bz = 0.4 + (m.r || 0.4) * 0.6; k.dbg.bursts++; H.X.hitMon(m, k.dmg, k.C.dmgO({ kb: 2 })); clear(m, k); H.X.sfx.pop ? H.X.sfx.pop() : H.X.sfx.whoosh && H.X.sfx.whoosh(); for (let j = 0; j < H.n(8); j++) { const b = j / 8 * TAU; U.wisp(H, k.bx, k.by - 0.4, Math.cos(b) * 5, Math.sin(b) * 3.5, 0.3); } } }
          if (k.st === 'burst' && now - k.bt > FFV.burst) marks.delete(m); }
        if (!marks.size) f.life = 0; },
      draw(c, f, X0, Y0, T) { const G = WDK.bind(H), P = G.P, now = H.g.t;
        G.layer(c, () => { for (const [m, k] of marks) { const X = H.sx(m.x), Yf = H.sy(m.y), mr = m.r || 0.4, Y = Yf - (0.4 + mr * 0.6) * T;
          if (k.st === 'on') { const fl = Math.max(0, 1 - (now - k.fl) / 0.5), rem = k.until - now, pul = rem < 1.2 ? 0.5 + 0.5 * Math.sin(now * 14) : 1;
            for (let j = 0; j < 2; j++) G.arc(c, X, Yf - T * 0.15, T * (mr + 0.35 + j * 0.2), now * (3 + j) * (j ? -1 : 1) + k.sd + j * 2, 0.55 + 0.3 * fl, { mode: 0, span: 1.8, th: 0.14, seed: k.sd + j, dir: j ? -1 : 1, dens: 0.4 });   /* (small curling currents round its feet) */
            G.glow(c, X, Y, T * (mr + 0.5), P.jade, (0.22 + 0.25 * fl) * pul); }
          if (k.st === 'peel') { const u = (now - k.pt) / FFV.peel; G.arc(c, X, Y, T * (mr + 0.7) * (1 - 0.6 * u), now * 9, 0.8, { k: 0.45, mode: 0, span: 3, th: 0.2, seed: k.sd }); G.glow(c, X, Y, T * 0.6, P.mint, 0.5 * u); }
          if (k.st === 'burst') { const u = (now - k.bt) / FFV.burst, bx = H.sx(k.bx), by = H.sy(k.by) - k.bz * T; G.ring(c, bx, by, T * 1.3 * eo(u), 1 - u, { k: 0.75, th: 0.14, col: P.deep, lite: P.mintW, seed: k.sd }); G.ring(c, bx, H.sy(k.by), T * 1.2 * eo(u), 0.7 * (1 - u), { th: 0.1 }); if (u < 0.3) G.star(c, bx, by, T * 1.1, 1 - u / 0.3); } } });
        // the marks: feather-shaped glyphs on the body (they peel away and spiral round it at the end)
        for (const [m, k] of marks) { if (k.st === 'burst') continue; const X = H.sx(m.x), Yf = H.sy(m.y), mr = m.r || 0.4, Y = Yf - (0.4 + mr * 0.6) * T, rem = k.until - now, pul = k.st === 'on' && rem < 1.2 ? 0.6 + 0.4 * Math.sin(now * 14) : 1;
          for (let j = 0; j < 3; j++) { let fx, fy, ang, s = T * 0.3, al = 0.8 * pul;
            if (k.st === 'on') { const b = k.sd + j * 2.1; fx = X + Math.cos(b) * T * mr * 0.55; fy = Y + Math.sin(b) * T * mr * 0.35 - j * T * 0.08; ang = -Math.PI / 2 + Math.cos(b) * 0.6; }
            else { const u = (now - k.pt) / FFV.peel, b = k.sd + j * 2.1 + u * 7, r = T * (mr * 0.55 + 0.5 * Math.sin(u * Math.PI)); fx = X + Math.cos(b) * r; fy = Y + Math.sin(b) * r * 0.45 - u * T * 0.5; ang = b + Math.PI / 2; s *= 1 - 0.5 * u; al *= 1 - 0.3 * u; }
            G.feather(c, fx - Math.cos(ang) * s * 0.5, fy - Math.sin(ang) * s * 0.5, ang, s, al, 0.7, { tint: '#DFFFF1', root: '#0F8F5F', glow: 1.3 }); } } } });
    function clear(m, k) { if (m.ffMark === k) { m.ffMark = null; m.ffDef = 0; m.ffSlow = 0; } }
    return M; }
  S.featherfall = (C, h) => { const H = h, me = H.me, tier = tierOf(C), DUR = [6, 8, 10][tier], DMG = C.base * C.K * 1.8, DOT = C.base * C.K * FFV.dot, RA = 2.6, FLY = 0.45, LAND = 0.35;
    const [ax, ay] = aimPt(H, C, 8), x0 = me.x, y0 = me.y, dbg = { marked: 0, refreshed: 0, bursts: 0, dots: 0 }; me.sq = 0.7; H.X.sfx.hum && H.X.sfx.hum(); H.warn(ax, ay, RA, FLY + LAND, C.col);
    let feathers = null, applied = false;
    function apply(t) { applied = true; const M = ffMgr(H), now = H.g.t;
      for (const m of H.living()) { if (!valid(m) || Math.hypot(m.x - ax, m.y - ay) > RA + (m.r || 0.4)) continue; let k = M.marks.get(m);
        if (k && (k.st === 'on' || k.st === 'peel')) { if (k.st === 'peel') k.nt = now + FFV.iv; k.until = now + DUR; k.st = 'on'; k.fl = now; k.dmg = Math.max(k.dmg, DMG); k.dot = Math.max(k.dot || 0, DOT); dbg.refreshed++; }   /* (refreshed: no stacking, no second burst) */
        else { k = { st: 'on', until: now + DUR, fl: now, dmg: DMG, dot: DOT, nt: now + FFV.iv, C, sd: Math.random() * 9, dbg, pt: 0, bt: 0 }; M.marks.set(m, k); dbg.marked++; }
        m.ffMark = k; m.ffDef = FFV.def; m.ffSlow = (m.boss || m.still) ? 0 : FFV.slow; } }
    const F = H.add({ key: 'featherfall', life: FLY + LAND + 0.7, dbg,
      update(dt, f) { const t = f.t; if (t >= FLY && !feathers) { feathers = []; const tg = H.living().filter(m => valid(m) && Math.hypot(m.x - ax, m.y - ay) < RA + (m.r || 0.4));
          for (let i = 0; i < 22; i++) { const m = i < tg.length * 2 ? tg[i % tg.length] : null, b = Math.random() * TAU, r = RA * Math.sqrt(Math.random()); feathers.push({ x: ax + Math.cos(b) * r * 0.6, y: ay + Math.sin(b) * r * 0.5, z: 2.7 + Math.random() * 0.6, m, ex: m ? m.x : ax + Math.cos(b) * r, ey: m ? m.y : ay + Math.sin(b) * r, ez: m ? 0.5 + (m.r || 0.4) * 0.6 : 0, d: Math.random() * LAND * 0.5, ph: Math.random() * TAU }); }
          H.X.sfx.whoosh && H.X.sfx.whoosh(); H.X.shake(2, 0.08); }
        if (!applied && t >= FLY + LAND) apply(t); },
      draw(c, f, X0, Y0, T) { const G = WDK.bind(H), P = G.P, t = f.t;
        const bz = (u) => { const q = 1 - u, cx = (x0 + ax) / 2, cy = (y0 + ay) / 2; return [q * q * x0 + 2 * q * u * cx + u * u * ax, q * q * y0 + 2 * q * u * cy + u * u * ay, q * q * 0.8 + 2 * q * u * 4.2 + u * u * 2.9]; };
        G.layer(c, () => {
          if (t < FLY) { const u = eo(t / FLY), pts = []; for (let j = 0; j <= 8; j++) { const p = bz(Math.max(0, u - j * 0.05)); pts.push([H.sx(p[0]), H.sy(p[1]) - p[2] * T]); } G.rib(c, pts, T * 0.22, 0.95, { edge: 0, taper: 0.9, fade: 1, seed: 1.3, flow: 6 }); G.glow(c, pts[0][0], pts[0][1], T * 0.7, P.mint, 0.6); }
          else { const u = cl((t - FLY) / 0.45), BX = H.sx(ax), BY = H.sy(ay) - 2.9 * T; G.ring(c, BX, BY, T * RA * 0.8 * eo(u), 1 - u, { k: 0.5, th: 0.14, col: P.deep, lite: P.mintW, seed: 2 }); if (u < 0.4) { G.glow(c, BX, BY, T * 1.6, P.mint, 0.6 * (1 - u / 0.4)); G.star(c, BX, BY, T * 1.4, 1 - u / 0.4); }
            const v = cl((t - FLY) / (LAND + 0.4)); G.ring(c, H.sx(ax), H.sy(ay), T * RA, 0.75 * (1 - v) * Math.min(1, (t - FLY) * 6), { th: 0.07, seed: 3, col: P.deep, lite: P.mint }); } });
        if (t < FLY) { const p = bz(eo(t / FLY)), b = Math.atan2(H.sy(bz(Math.min(1, eo(t / FLY) + 0.05))[1]) - H.sy(p[1]) - 0.5 * T, 1); G.feather(c, H.sx(p[0]) - T * 0.6, H.sy(p[1]) - p[2] * T, b * 0 - 0.3, T * 1.2, 1, Math.cos(t * 8), { glow: 1.5 }); }
        if (feathers) for (const q of feathers) { const u = cl((t - FLY - q.d) / LAND), e = sm(u), fx = H.sx(lerp(q.x, q.m && valid(q.m) ? q.m.x : q.ex, e)), fy = H.sy(lerp(q.y, q.m && valid(q.m) ? q.m.y : q.ey, e)) - lerp(q.z, q.ez, e) * T + Math.sin(t * 6 + q.ph) * T * 0.15 * (1 - u), a = u >= 1 ? cl(1 - (t - FLY - q.d - LAND) / 0.3) : 1;
          if (a > 0.01) G.feather(c, fx, fy, -Math.PI / 2 + Math.sin(t * 5 + q.ph) * 0.8, T * 0.55, a * 0.85, Math.cos(t * 7 + q.ph), { tint: '#E6FFF5', glow: 1.2 }); } } });
    return F; };

  /* ================= W-S08 Wings of Sanctuary =================
     Two enormous feathered wings of white and mint wind wrap round the pet, then unfold into a protective breeze: a shield
     of overlapping translucent feathers turning slowly round it (not a bubble). As it soaks up damage the feathers brighten
     and peel away into the air. When it breaks or runs out it lets go one gentle outward gust that pushes ordinary monsters
     away.
       shield     12 / 16 / 20% of the pet's max HP, for 8 s (a ward: X.addWard; it takes damage before the pet does)
       speed      +15% movement while it holds (X.mvMod 'sanctuary')
       end gust   (v371) strikes every monster within 3 tiles for 1.5 / 1.8 / 2.1 x base x K (one hitArea), then pushes the
                  ordinary ones 1.8 tiles away (H.push: bosses stay put); not when the pet dies or is swapped out
     Recasting refreshes it (its pool back to the larger of what is left and a fresh one, its 8 s from now): never two shields
     from this skill. The party's other pets are off the field: the shield covers the pet in play. Cost 30, cooldown 12 s. */
  S.sanctuary = (C, h) => { const H = h, me = H.me, g = H.g, tier = tierOf(C), PCT = [0.12, 0.16, 0.2][tier], BURST = C.base * C.K * [1.5, 1.8, 2.1][tier], DUR = 8, MV = 1.15, NF = 18, WRAP = 0.35, OPEN = 0.45;
    const maxHP = (H.X.ST && H.X.ST().hp) || me.maxhp || 100, AMT = PCT * maxHP;
    const old = H.fx.find(f => f.key === 'sanctuary' && f.st === 'on');
    if (old) { old.pool = Math.max(old.pool, AMT); old.cap = Math.max(old.cap, old.pool); old.until = g.t + DUR; old.fl = g.t; old.dbg.refresh++; H.X.sfx.hum && H.X.sfx.hum(); return old; }
    const P0 = petOf(H), dbg = { absorbed: 0, refresh: 0, end: null, pushed: 0 }; me.sq = 0.7; H.X.sfx.hum && H.X.sfx.hum();
    const fs = []; for (let i = 0; i < NF; i++) { const up = i >= 12; fs.push({ i, b: up ? (i - 12) / 6 * TAU + 0.3 : i / 12 * TAU, up, gone: -1, vx: 0, vy: 0, vz: 0, x: 0, y: 0, z: 0, sd: R1(i * 3.3) }); }
    let un = null;
    const F = H.add({ key: 'sanctuary', life: 1e6, st: 'on', t0: g.t, until: g.t + DUR, pool: AMT, cap: AMT, fl: -9, endT: 0, dbg, rot: 0, fs,
      update(dt, f) { const now = g.t; f.rot += dt * 0.7;
        if (f.st === 'on') { if (!alive(H, P0)) finish(f, 'gone'); else if (now >= f.until) finish(f, 'expire'); else if (f.pool <= 1e-6) finish(f, 'break'); }
        // the feathers it has lost peel away
        const keep = f.st === 'on' ? Math.ceil(NF * cl(f.pool / f.cap)) : 0; let kept = 0;
        for (const q of fs) { if (q.gone >= 0) { q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= 1.5 * dt; continue; } kept++; if (kept > keep && f.st === 'on') { const b = q.b + f.rot * (q.up ? -1 : 1); q.gone = now; q.x = me.x + Math.cos(b) * 0.75; q.y = me.y + Math.sin(b) * 0.5; q.z = q.up ? 1.1 : 0.55; q.vx = Math.cos(b) * 2.5; q.vy = Math.sin(b) * 1.8; q.vz = 1.5 + Math.random(); } }
        if (f.st === 'end' && now - f.endT > 0.8) f.life = 0; },
      onEnd(f) { if (f.st === 'on') finish(f, 'gone'); for (const k of kids) k.life = 0; } });
    function finish(f, why) { if (f.st !== 'on') return; f.st = 'end'; f.endT = g.t; dbg.end = why; if (un) { un(); un = null; } if (H.X.mvMod) H.X.mvMod('sanctuary', null);
      for (const q of fs) if (q.gone < 0) { const b = q.b + f.rot * (q.up ? -1 : 1); q.gone = g.t; q.x = me.x + Math.cos(b) * 0.75; q.y = me.y + Math.sin(b) * 0.5; q.z = q.up ? 1.1 : 0.55; q.vx = Math.cos(b) * 5; q.vy = Math.sin(b) * 3.5; q.vz = 1 + Math.random(); }
      if (why !== 'gone') { dbg.burst = H.hitArea(me.x, me.y, 3, BURST, C.dmgO({ kb: 3 })) || 0; H.X.shake(4, 0.12); H.X.sfx.thud && H.X.sfx.thud();   /* (v371: the burst strikes, then pushes) */
        for (const m of H.near(me.x, me.y, 3)) { if (H.push(m, me.x, me.y, 1.8)) dbg.pushed++; } H.X.sfx.whoosh && H.X.sfx.whoosh(); for (let k = 0; k < H.n(18); k++) { const b = k / 18 * TAU; U.wisp(H, me.x + Math.cos(b) * 0.6, me.y + Math.sin(b) * 0.4 - 0.5, Math.cos(b) * 8, Math.sin(b) * 5, 0.5); } } }
    // the ward: it takes what it can of each hit while it holds
    const ward = (d, src) => { if (F.st !== 'on' || !(d > 0) || g.t >= F.until) return d; const s = Math.min(F.pool, d); F.pool -= s; dbg.absorbed += s; F.fl = g.t; H.X.sfx.note && H.X.sfx.note(990, 0.1, 'sine', 0.04, 760); return d - s; };
    un = H.X.addWard ? H.X.addWard(ward) : null; if (H.X.mvMod) H.X.mvMod('sanctuary', MV);
    const kids = [H.add({ key: 'sanctB', life: 1e6, entY: me.y - 0.01, drawEnt: c => paint(c, 0), update(dt, k) { k.entY = me.y - 0.01; } }), H.add({ key: 'sanctF', life: 1e6, entY: me.y + 0.02, drawEnt: c => paint(c, 1), update(dt, k) { k.entY = me.y + 0.02; } })];
    function paint(c, near) { const G = WDK.bind(H), P = G.P, T = H.X.Tz(), now = g.t, f = F, X = H.sx(me.x), Yf = H.sy(me.y), PH = 0.55 + (me.r || 0.35) * 0.5, Yc = Yf - PH * T * 0.6, tc = now - f.t0, fl = Math.max(0, 1 - (now - f.fl) / 0.4), endU = f.st === 'end' ? cl((now - f.endT) / 0.8) : 0;
      // the wings at the cast: wrapped round the pet, then unfolding outward and fading into the shield
      const wu = cl(tc / WRAP), ou = cl((tc - WRAP) / OPEN), wa = Math.min(1, wu * 2) * (1 - sm((tc - WRAP - OPEN * 0.5) / (OPEN * 0.7)));
      G.layer(c, () => { const sa = f.st === 'on' ? Math.min(1, tc / WRAP) : 1 - endU;
        if (near) { G.glow(c, X, Yc, T * (1.25 + 0.15 * fl), P.mint, (0.18 + 0.25 * fl) * sa); G.ring(c, X, Yf, T * 1.05, 0.45 * sa, { th: 0.08, seed: 1.1 }); }
        G.wring(c, X, Yc, T * 0.95, T * 0.95 * 0.45, 0, 0.5 * sa, { side: near ? 1 : 0, th: 0.05, spin: 1.5, col: P.jade, seed: 2 });
        if (endU > 0 && near) { G.ring(c, X, Yf, T * 3 * eo(endU), 1 - endU, { th: 0.12, col: P.deep, lite: P.mintW, seed: 3 }); G.ring(c, X, Yc, T * 2.2 * eo(endU), 0.8 * (1 - endU), { k: 0.6, th: 0.12, seed: 4 }); }
        if (wa > 0.01) for (const sd of [-1, 1]) G.glow(c, X + sd * T * 0.9 * ou, Yc - T * 0.4 * ou, T * 1.2, P.mint, 0.25 * wa); });
      // shield feathers (this half), turning slowly in two rings, pointing up and out
      const keep = f.st === 'on' ? NF : 0, sa = f.st === 'on' ? sm(tc / (WRAP + OPEN * 0.6)) : 0;
      const items = []; for (const q of fs) { if (q.gone >= 0) { const u = (now - q.gone) / 0.6; if (u > 1) continue; const z = q.z, sx = H.sx(q.x), sy = H.sy(q.y) - z * T; if ((q.vy > 0) !== !!near) continue; items.push([sy, () => G.feather(c, sx, sy, Math.atan2(q.vy - q.vz, q.vx), T * 0.8, (1 - u) * 0.9, Math.cos(u * 9 + q.i), { tint: '#FFFFFF', glow: 1.8 })]); continue; }
        if (!keep || sa <= 0) continue; const b = q.b + f.rot * (q.up ? -1 : 1), s = Math.sin(b); if ((s > 0) !== !!near) continue; const r = q.up ? 0.42 : 0.82, zz = q.up ? 1.05 : 0.15, fx = X + Math.cos(b) * r * T, fy = Yf - zz * PH * T * 1.4 + s * r * T * 0.42, ang = -Math.PI / 2 - Math.cos(b) * (q.up ? 0.55 : 0.3);
        items.push([fy, () => G.feather(c, fx, fy, ang, T * (q.up ? 0.85 : 1.25), sa * (near ? 0.42 : 0.55) * (0.8 + 0.4 * fl), 0.35 + 0.65 * Math.abs(Math.sin(b)), { tint: '#F6FFFB', root: '#2FB083', glow: 1 + fl })]); }
      // the cast wings: nine long feathers a wing from the shoulders
      if (wa > 0.01 && !near) for (const sd of [-1, 1]) for (let j = 0; j < 9; j++) { const v = j / 8, fold = 1 - ou, angO = -Math.PI / 2 + sd * (0.15 + v * 1.25), angF = sd > 0 ? Math.PI * 0.15 + v * 0.9 : Math.PI * 0.85 - v * 0.9, ang = angO * (1 - fold) + angF * fold + (sd > 0 ? 0 : 0), L = T * (1.4 + 0.8 * Math.sin(v * Math.PI)) * (0.6 + 0.4 * eo(wu)), sx0 = X + sd * T * (0.25 + 0.2 * (1 - fold)), sy0 = Yc - T * 0.15;
        items.push([-1e6 + j, () => G.feather(c, sx0, sy0, ang, L, wa * 0.9, 0.8, { tint: '#FFFFFF', root: '#5FD9AA', glow: 1.4 })]); }
      items.sort((a, b) => a[0] - b[0]); for (const it of items) it[1](); }
    return F; };
})();
