/* ---------- (v417 BR) Earth Strong: Ball Crusher (replaces Quarry Wheel; key 'ballcrusher', the old 'quarry' aliased to it) ----------
   The pet braces and an enormous boulder heaves up out of the floor in front of it (anticipation: the floor cracks, a ring
   of dust rolls out), then it is launched along the aim and rolls for six seconds: an irregular stone sphere of layered
   orange-brown strata, embedded crystals and basalt, broad cracks lit amber inside, turning visibly as it rolls. It
   rebounds off walls, drops and the edge of the encounter (a circle round where it was cast) - a mirror rebound per
   axis, so it is predictable - and crosses the battlefield again and again while the pet fights on. It throws dust out
   where it meets the ground, kicks gravel ahead that it then crushes flat, leaves a scuffed trail that fades behind it,
   and at the end of its life crumbles harmlessly into chunks and dust.
     boulders   1 / 1 / 2 (Celestial: two of the Adept size on slightly diverging paths)
     radius     0.95 / 1.19 / 1.19 tiles (Adept about 25% larger)
     damage     1.6 / 2.0 / 2.0 x base x K a hit
   Hits: each boulder keeps its own record per monster. A monster is hit once per distinct pass: the pass starts when the
   boulder's footprint first overlaps it, and a new pass needs the boulder to leave (clear by 0.2 tile) and come back; at
   least 0.75 s between two hits of the same boulder on it. Every hit is one hitMon made in the update (none scheduled), the
   movement is stepped in slices of at most 1/90 s, so a long frame gives the same hits as many short ones. A non-boss
   monster is shoved aside (H.push); a boss takes the damage and is never pushed. Dust, gravel and chunks never hit.
   Everything lives in the cast's effects (cleaned with the game); defeat (the pet down), a won or ended stage crumble it at
   once. Tunables: EARTH_STRONG_TUNE.ballcrusher. Cost 28, cooldown 16 s (20k1, from the commit of the cast).
   The picture: the boulder and its crumbling chunks real 3D meshes on GLM (20k2r EARTH_BR_GPU); trail, gravel, dust and
   shadow on the shared painter (20k6h FGFX, kinds 84, 104, 105, sshadow). Without the GPU, a plain 2D picture. */
(() => {
  const S = ELEM_IMPL.earth.strong; delete S.quarry;
  const TAU = Math.PI * 2, cl = u => Math.max(0, Math.min(1, u)), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const GT = typeof globalThis !== 'undefined' ? globalThis : self, TT = GT.EARTH_STRONG_TUNE || (GT.EARTH_STRONG_TUNE = {});
  const TUNE = TT.ballcrusher = Object.assign({
    count: [1, 1, 2], radius: [0.95, 1.19, 1.19], dmg: [1.6, 2.0, 2.0],   // (Base / Adept / Celestial)
    speed: 5.4, life: 6, rise: 0.42, crumble: 0.8, gap: 0.75, exitPad: 0.2, spread: 0.26,   // (tiles a second; seconds; tile; radians between the two Celestial paths)
    push: 0.5, stun: 0.12, wallK: 0.85, minWallR: 0.32, leash: 9.5, trail: 1.5, trailW: 0.6, dustRate: 16, gravelRate: 8 }, TT.ballcrusher || {});
  const tierOf = C => { const ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))); return ev >= 7 ? 2 : ev >= 4 ? 1 : 0; };
  const SE = 0.55, CE = Math.sqrt(1 - SE * SE), DUSTC = '#8A7258', DIRT = '#5E4A38', AMBER = '#FFB84D', GOLD = '#FFD98A', PALE = '#FFF1D6';
  const GPU = () => (typeof EARTH_BR_GPU !== 'undefined' ? EARTH_BR_GPU : null);
  const gfx = () => { try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX, G = GPU(); return F && F.usable() && G && G.usable() ? F : null; } catch (e) { return null; } };

  S.ballcrusher = (C, h) => { const H = h, me = H.me, X = H.X, tier = tierOf(C), N = TUNE.count[tier], R = TUNE.radius[tier], DMG = C.base * C.K * TUNE.dmg[tier];
    const blk = (x, y, r) => X.blocked(x, y, r, 0), ox = me.x, oy = me.y, a0 = C.a;
    try { if (gfx()) GPU().warm(); } catch (e) { /* (drawn in 2D) */ }
    me.sq = 0.6; X.sfx.thud(); X.shake(4, 0.15); const group = [];
    for (let i = 0; i < N; i++) {
      const a = a0 + (N > 1 ? (i - (N - 1) / 2) * TUNE.spread : 0), dx = Math.cos(a), dy = Math.sin(a), lat = N > 1 ? (i - (N - 1) / 2) * R * 1.1 : 0;
      // where it rises: ahead of the pet, side by side at Celestial; nearer, then smaller against the walls, then anywhere free near the pet
      let px = me.x + Math.cos(a0) * (R + 0.45) - Math.sin(a0) * lat, py = me.y + Math.sin(a0) * (R + 0.45) + Math.cos(a0) * lat, rw = R * TUNE.wallK, ok = false;
      for (let k = 0; k <= 6 && !ok; k++) { const u = 1 - k / 6, qx = lerp(me.x, px, u), qy = lerp(me.y, py, u); if (!blk(qx, qy, rw)) { px = qx; py = qy; ok = true; } }
      while (!ok && rw > TUNE.minWallR) { rw = Math.max(TUNE.minWallR, rw - 0.06); for (let k = 0; k <= 6 && !ok; k++) { const u = 1 - k / 6, qx = lerp(me.x, px, u), qy = lerp(me.y, py, u); if (!blk(qx, qy, rw)) { px = qx; py = qy; ok = true; } } }
      if (!ok) { px = me.x; py = me.y; }
      const b = { i, x: px, y: py, vx: dx * TUNE.speed, vy: dy * TUNE.speed, R, rw, t: 0, ph: 'rise', rec: new Map(), M: [1, 0, 0, 0, 1, 0, 0, 0, 1], roll: 0, arc: 0, runs: [{ x: px, y: py, s: 0 }], hits: 0, bounces: 0, escapes: 0, lastB: -9, chk: { t: 0, x: px, y: py },
        dust: [], peb: [], chunks: [], rings: [], sparks: [], dAcc: 0, pAcc: 0, end: 0, seed: Math.random() * 50 };
      try { GPU() && GPU().rotate(b.M, 0, 0, 1, Math.random() * TAU); GPU() && GPU().rotate(b.M, 1, 0, 0, Math.random() * TAU); } catch (e) { /* */ }
      b.rings.push({ x: px, y: py, t: 0, life: 0.7, r0: R * 0.6, r1: R * 2.4, a: 0.75 });
      group.push(H.add({ key: 'ballcrusher', life: 999, b, entY: py, x: px, y: py, dmgEvents: [],
        update(dt, f) { step(f, dt); f.entY = b.y; f.x = b.x; f.y = b.y; },
        drawUnder(c, f, X0, Y0, T) { drawUnder(c, f, T); },
        drawEnt(c, f) { drawBoulder(c, f); },
        draw(c, f, X0, Y0, T) { drawOver(c, f, T); } }));
    }

    /* ---------- the boulder's life ---------- */
    function crumble(f) { const b = f.b; if (b.ph === 'crumble' || b.ph === 'done') return; b.ph = 'crumble'; b.ct = 0; X.sfx.crash && X.sfx.crash(); X.shake(5, 0.2);
      const zc = b.R; for (let k = 0; k < 9; k++) { const an = k / 9 * TAU + Math.random() * 0.5, up = 0.3 + Math.random() * 0.9, sp = 1.4 + Math.random() * 2.2, M = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        try { GPU() && GPU().rotate(M, Math.random() - 0.5, Math.random() - 0.5, 0.6, Math.random() * TAU); } catch (e) { /* */ }
        b.chunks.push({ x: b.x + Math.cos(an) * b.R * 0.35, y: b.y + Math.sin(an) * b.R * 0.35, z: zc * (0.5 + up * 0.6), vx: Math.cos(an) * sp + b.vx * 0.15, vy: Math.sin(an) * sp + b.vy * 0.15, vz: 1.5 + up * 3, s: b.R * (k % 2 ? 0.42 + 0.3 * Math.random() : 0.2 + 0.12 * Math.random()), M, w: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5], wr: 4 + Math.random() * 6, v: k % 3, t: 0, life: 1.1 + Math.random() * 0.4 }); }
      for (let k = 0; k < H.n(10); k++) { const an = Math.random() * TAU, sp = 0.6 + Math.random() * 1.6; b.dust.push({ x: b.x + Math.cos(an) * b.R * 0.6, y: b.y + Math.sin(an) * b.R * 0.4, z: 0.2 + Math.random() * b.R, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp * 0.7, vz: 0.4 + Math.random() * 0.6, t: 0, life: 0.9 + Math.random() * 0.5, s: b.R * (0.55 + 0.4 * Math.random()), sd: 1 + Math.random() * 9 }); }
      for (let k = 0; k < H.n(10); k++) gravel(b, b.x, b.y, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 2 + Math.random() * 3, 0.5);
      b.rings.push({ x: b.x, y: b.y, t: 0, life: 0.8, r0: b.R * 0.7, r1: b.R * 2.6, a: 0.8 }); }
    function gravel(b, x, y, vx, vy, vz, z) { if (b.peb.length > 46) return; b.peb.push({ x, y, z: z || 0.15, vx, vy, vz, t: 0, life: 1.6 + Math.random() * 0.8, s: 0.05 + Math.random() * 0.07, rot: Math.random() * TAU, md: Math.random() < 0.18 ? 2 : Math.random() < 0.5 ? 0 : Math.random() < 0.5 ? 1 : 3, fl: 0, sd: 1 + Math.random() * 30 }); }
    function bounceFx(b, nx, ny) { if (b.t - b.lastB < 0.12) return; b.lastB = b.t; const cx = b.x + nx * b.R * 0.9, cy = b.y + ny * b.R * 0.9;
      b.rings.push({ x: cx, y: cy, t: 0, life: 0.5, r0: b.R * 0.3, r1: b.R * 1.3, a: 0.6 }); X.shake(3, 0.1); X.sfx.thud();
      for (let k = 0; k < H.n(5); k++) gravel(b, cx, cy, -nx * (1 + Math.random() * 2) + (Math.random() - 0.5) * 2, -ny * (1 + Math.random() * 2) + (Math.random() - 0.5) * 2, 1.5 + Math.random() * 2, 0.3);
      for (let k = 0; k < H.n(4); k++) { const an = Math.random() * TAU; b.dust.push({ x: cx, y: cy, z: 0.3, vx: -nx * 1.2 + Math.cos(an) * 0.6, vy: -ny * 1.2 + Math.sin(an) * 0.5, vz: 0.6, t: 0, life: 0.7 + Math.random() * 0.3, s: b.R * 0.5, sd: 1 + Math.random() * 9 }); } }
    function hit(f, m) { const b = f.b, d = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / d, uy = b.vy / d, sx = Math.sign(-uy * (m.x - b.x) + ux * (m.y - b.y)) || (Math.random() < 0.5 ? -1 : 1);
      const dmg = X.hitMon(m, DMG, C.dmgO({ stun: TUNE.stun })); b.hits++; f.dmgEvents.push({ m, t: b.t, dmg, boss: !!m.boss, x0: m.x, y0: m.y });
      if (!m.boss) { const px = ux * 0.35 - uy * sx, py = uy * 0.35 + ux * sx, pl = Math.hypot(px, py); H.push(m, m.x - px / pl, m.y - py / pl, TUNE.push); }
      const hx = lerp(b.x, m.x, 0.6), hy = lerp(b.y, m.y, 0.6); for (let k = 0; k < H.n(4); k++) gravel(b, hx, hy, (Math.random() - 0.5) * 4 + ux * 2, (Math.random() - 0.5) * 4 + uy * 2, 2 + Math.random() * 2, 0.4);
      b.sparks.push({ x: hx, y: hy, z: 0.5, t: 0, life: 0.22 }); X.shake(m.boss ? 4 : 2.5, 0.1); X.sfx.thud(); }
    function step(f, dt) { const b = f.b; if (!(dt > 0)) return;
      if ((b.ph === 'rise' || b.ph === 'roll') && (me.dead || H.g.won || H.g.over)) crumble(f);   // (defeat or the stage over: it crumbles at once, harmlessly)
      const n = Math.min(900, Math.max(1, Math.ceil(dt * 90))), hdt = dt / n, sp = TUNE.speed, L = H.living();
      for (let s = 0; s < n; s++) { b.t += hdt;
        if (b.ph === 'rise') { if (b.t >= TUNE.rise) { b.ph = 'roll'; b.t0 = b.t; X.sfx.whoosh && X.sfx.whoosh(); } continue; }
        if (b.ph === 'roll') {
          if (b.t - b.t0 >= TUNE.life) { crumble(f); continue; }
          // unstick: if it ever sits in a wall, the nearest free place round it
          if (X.blocked(b.x, b.y, b.rw, 0)) { let best = null; for (let rr = 0.2; rr <= 3 && !best; rr += 0.2) for (let k = 0; k < 16; k++) { const an = k / 16 * TAU, qx = b.x + Math.cos(an) * rr, qy = b.y + Math.sin(an) * rr; if (!X.blocked(qx, qy, b.rw, 0)) { best = [qx, qy]; break; } }
            if (best) { b.x = best[0]; b.y = best[1]; } else b.rw = Math.max(TUNE.minWallR, b.rw - 0.05); b.escapes++; b.runs.push({ x: b.x, y: b.y, s: b.arc }); }
          // each axis on its own: up to the contact (found by halving), then the rest of the slice mirrored back (so the path does not depend on the slice)
          const mv = ax => { const v = ax ? b.vy : b.vx, d = v * hdt, at = k => ax ? X.blocked(b.x, b.y + d * k, b.rw, 0) : X.blocked(b.x + d * k, b.y, b.rw, 0); if (!at(1)) { if (ax) b.y += d; else b.x += d; return 0; }
            let lo = 0, hi = 1; for (let k = 0; k < 8; k++) { const m = (lo + hi) / 2; if (at(m)) hi = m; else lo = m; }
            if (ax) { b.y += d * lo; b.vy = -v; if (!X.blocked(b.x, b.y - d * (1 - lo), b.rw, 0)) b.y -= d * (1 - lo); } else { b.x += d * lo; b.vx = -v; if (!X.blocked(b.x - d * (1 - lo), b.y, b.rw, 0)) b.x -= d * (1 - lo); } return Math.sign(v); };
          let bx = mv(0), by = mv(1);
          const lx = b.x - ox, ly = b.y - oy, ld = Math.hypot(lx, ly);   // (the edge of the encounter: a mirror rebound off the circle round the cast)
          if (ld > TUNE.leash) { const ex = lx / ld, ey = ly / ld, vn = b.vx * ex + b.vy * ey; if (vn > 0) { b.vx -= 2 * vn * ex; b.vy -= 2 * vn * ey; bx = ex; by = ey; const mx = ox + ex * (2 * TUNE.leash - ld), my = oy + ey * (2 * TUNE.leash - ld); if (!X.blocked(mx, my, b.rw, 0)) { b.x = mx; b.y = my; } } }
          if (bx || by) { b.bounces++; b.runs.push({ x: b.x, y: b.y, s: b.arc }); bounceFx(b, bx, by); }
          const v = Math.hypot(b.vx, b.vy) || 1, ds = sp * hdt; b.arc += ds; b.roll += ds / b.R;
          try { const G = GPU(); if (G) G.rotate(b.M, -b.vy / v, b.vx / v, 0, ds / b.R); } catch (e) { /* */ }
          // the hits: once per distinct pass, the gap between two at least TUNE.gap
          for (const m of L) { if (m.dead) continue; const d = Math.hypot(m.x - b.x, m.y - b.y), rr = b.R + (m.r || 0.4); let r = b.rec.get(m); if (!r) { r = { in: false, armed: false, last: -1e9, n: 0 }; b.rec.set(m, r); }
            if (!r.in) { if (d < rr) { r.in = true; r.armed = true; r.n++; } } else if (d > rr + TUNE.exitPad) { r.in = false; r.armed = false; }
            if (r.in && r.armed && b.t - r.last >= TUNE.gap) { r.armed = false; r.last = b.t; hit(f, m); } }
          // where it meets the ground: dust thrown out, gravel kicked ahead
          const ux = b.vx / v, uy = b.vy / v; b.dAcc += hdt * TUNE.dustRate * H.Q(); b.pAcc += hdt * TUNE.gravelRate * H.Q();
          while (b.dAcc >= 1) { b.dAcc--; if (b.dust.length > 40) continue; const sd = Math.random() < 0.5 ? -1 : 1, k2 = 0.8 + Math.random() * 1.4; b.dust.push({ x: b.x - ux * b.R * 0.35 - uy * sd * b.R * 0.5, y: b.y - uy * b.R * 0.35 + ux * sd * b.R * 0.5, z: 0.08, vx: -uy * sd * k2 - ux * 0.7, vy: ux * sd * k2 * 0.8 - uy * 0.7, vz: 0.35 + Math.random() * 0.5, t: 0, life: 0.55 + Math.random() * 0.4, s: b.R * (0.32 + 0.25 * Math.random()), sd: 1 + Math.random() * 9 }); }
          while (b.pAcc >= 1) { b.pAcc--; const lt = (Math.random() - 0.5) * 1.3 * b.R, kk = sp * (1.15 + Math.random() * 0.35); gravel(b, b.x + ux * b.R * 0.75 - uy * lt, b.y + uy * b.R * 0.75 + ux * lt, ux * kk - uy * (Math.random() - 0.5) * 2.5, uy * kk + ux * (Math.random() - 0.5) * 2.5, 1.2 + Math.random() * 1.6, 0.12); }
          // trapped (it should never be: the rebounds are mirror ones): a new heading back toward the middle of the encounter
          //  (trapped: everywhere it went in the last second fits in a box 0.6 tile across)
          const K = b.chk; K.x0 = Math.min(K.x0 == null ? b.x : K.x0, b.x); K.x1 = Math.max(K.x1 == null ? b.x : K.x1, b.x); K.y0 = Math.min(K.y0 == null ? b.y : K.y0, b.y); K.y1 = Math.max(K.y1 == null ? b.y : K.y1, b.y);
          if (b.t - K.t > 1) { if (Math.hypot(K.x1 - K.x0, K.y1 - K.y0) < 0.6) { const an = Math.atan2(oy - b.y, ox - b.x) + (b.escapes % 2 ? 0.35 : -0.35); b.vx = Math.cos(an) * sp; b.vy = Math.sin(an) * sp; b.escapes++; b.runs.push({ x: b.x, y: b.y, s: b.arc }); } b.chk = { t: b.t }; }
          continue; }
        if (b.ph === 'crumble') { b.ct += hdt; if (b.ct >= TUNE.crumble) { b.ph = 'done'; b.dt0 = b.t; } continue; }
        if (b.ph === 'done') { b.end = b.t - b.dt0; }
      }
      // the cosmetic bits (they never hit)
      const cdt = Math.min(dt, 0.1);
      for (let i = b.dust.length - 1; i >= 0; i--) { const p = b.dust[i]; p.t += cdt; const k = Math.exp(-1.8 * cdt); p.vx *= k; p.vy *= k; p.x += p.vx * cdt; p.y += p.vy * cdt; p.z += p.vz * cdt; if (p.t >= p.life) b.dust.splice(i, 1); }
      for (let i = b.peb.length - 1; i >= 0; i--) { const p = b.peb[i]; p.t += cdt;
        if (p.z > 0 || p.vz > 0) { p.vz -= 13 * cdt; p.x += p.vx * cdt; p.y += p.vy * cdt; p.z += p.vz * cdt; p.rot += cdt * 9; if (p.z <= 0) { p.z = 0; p.vz = 0; p.vx *= 0.35; p.vy *= 0.35; } }
        else { const k = Math.exp(-7 * cdt); p.vx *= k; p.vy *= k; p.x += p.vx * cdt; p.y += p.vy * cdt;
          if (!p.fl && b.ph === 'roll' && Math.hypot(p.x - b.x, p.y - b.y) < b.R * 0.8) { p.fl = 0.01; p.vx = p.vy = 0; p.life = Math.max(p.life, p.t + 1.4); } }   // (crushed flat under it)
        if (p.fl > 0 && p.fl < 1) p.fl = Math.min(1, p.fl + cdt / 0.08);
        if (p.t >= p.life) b.peb.splice(i, 1); }
      for (let i = b.chunks.length - 1; i >= 0; i--) { const p = b.chunks[i]; p.t += cdt; p.vz -= 12 * cdt; p.x += p.vx * cdt; p.y += p.vy * cdt; p.z += p.vz * cdt;
        const zf = p.s < b.R * 0.34 ? p.s * 0.9 : p.s * 0.25; if (p.z < zf) { p.z = zf; if (p.vz < -1.5) { p.vz = -p.vz * 0.3; p.vx *= 0.5; p.vy *= 0.5; } else { p.vz = 0; p.vx *= Math.exp(-6 * cdt); p.vy *= Math.exp(-6 * cdt); p.wr *= Math.exp(-5 * cdt); } }
        try { const G = GPU(); if (G) { const wl = Math.hypot(p.w[0], p.w[1], p.w[2]) || 1; G.rotate(p.M, p.w[0] / wl, p.w[1] / wl, p.w[2] / wl, p.wr * cdt); } } catch (e) { /* */ }
        if (p.t >= p.life) b.chunks.splice(i, 1); }
      for (let i = b.rings.length - 1; i >= 0; i--) { const r = b.rings[i]; r.t += cdt; if (r.t >= r.life) b.rings.splice(i, 1); }
      for (let i = b.sparks.length - 1; i >= 0; i--) { const r = b.sparks[i]; r.t += cdt; if (r.t >= r.life) b.sparks.splice(i, 1); }
      if (b.ph === 'done' && b.end >= TUNE.trail && !b.dust.length && !b.peb.length && !b.chunks.length && !b.rings.length) f.life = 0;   // (all gone: the effect ends)
    }

    /* ---------- drawing ---------- */
    const zOf = b => b.ph === 'rise' ? b.R * (-1 + 2 * (1 - Math.pow(1 - cl(b.t / TUNE.rise), 2.2))) : b.R * (1 + 0.025 * Math.sin(b.roll * 1.7 + b.seed));
    const trailA = b => b.ph === 'done' ? 1 - cl(b.end / TUNE.trail) : 1;
    function runs(b, fn) {   // each straight stretch of the trail still showing: (x0, y0, s0, x1, y1, s1)
      const fade = TUNE.speed * TUNE.trail * 0.8, head = b.arc, from = head - fade;
      for (let i = 0; i < b.runs.length; i++) { const r = b.runs[i], nx = b.runs[i + 1], s0 = r.s, s1 = nx ? nx.s : head; if (s1 <= from || s1 - s0 < 1e-3) continue;
        const x1 = nx ? nx.x : b.x, y1 = nx ? nx.y : b.y, L = s1 - s0, u0 = cl((from - s0) / L); fn(lerp(r.x, x1, u0), lerp(r.y, y1, u0), Math.max(s0, from), x1, y1, s1, fade, head); } }
    // (the cast's boulders share one painter pass for what lies under them and one for what flies over: the first still alive draws for all)
    const lead = f => { for (const g of group) if (H.fx.indexOf(g) >= 0) return g === f; return true; }, alive = () => group.filter(g => H.fx.indexOf(g) >= 0).map(g => g.b);
    function drawUnder(c, f, T) { if (!lead(f)) return; const FG = gfx(), L = alive();
      if (FG) { const Q = FG.begin(c, null); for (const b of L) underQ(Q, b, T); FG.flush(c); return; }
      for (const b of L) under2D(c, b, T); }
    function underQ(Q, b, T) { const ta = trailA(b), z = zOf(b); {
        runs(b, (x0, y0, s0, x1, y1, s1, fade, head) => { const X0 = H.sx(x0), Y0 = H.sy(y0), X1 = H.sx(x1), Y1 = H.sy(y1), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, w = b.R * TUNE.trailW, a0 = cl(1 - (head - s0) / fade), a1 = cl(1 - (head - s1) / fade);
          Q.quad(104, (X0 + X1) / 2, (Y0 + Y1) / 2, (X1 - X0) / 2, (Y1 - Y0) / 2, -dy / L * w * T, dx / L * w * T * SE, DIRT, 0.95 * ta, s0, s1 - s0, Math.floor(a0 * 1000) + a1 * 0.999); });
        for (const r of b.rings) { const q = r.t / r.life, rr = lerp(r.r0, r.r1, 1 - Math.pow(1 - q, 2)) * T; Q.quad(84, H.sx(r.x), H.sy(r.y), rr * 1.3, 0, 0, rr * 1.3 * SE, DUSTC, r.a * (1 - q) * sm(q / 0.08), 0.75, r.x * 3.1 % 9, 1); }
        for (const p of b.peb) if (p.z <= 0) { const s = p.s * T * (p.fl ? 1.25 : 1), al = (1 - sm((p.t - p.life + 0.35) / 0.35)); Q.rq(105, H.sx(p.x), H.sy(p.y) - s * 0.25 * (1 - p.fl), s, s * lerp(0.8, 0.45, p.fl), p.rot, '#FFFFFF', al, p.rot, p.sd, p.md + 0.9 * p.fl); }
        if (b.ph === 'rise' || b.ph === 'roll') { const on = b.ph === 'rise' ? sm(b.t / TUNE.rise) : 1, X0 = H.sx(b.x), Y0 = H.sy(b.y), hz = Math.max(0, z - b.R) / b.R;
          Q.sshadow(X0, Y0, b.R * T * 1.0 * on, b.R * T * SE * 0.95 * on, 0.62 * on / (1 + hz), '#140C06');
          if (b.ph === 'rise') { Q.quad(89, X0, Y0, b.R * T * 1.6, 0, 0, b.R * T * 1.6 * SE, '#FFFFFF', 0.9 * on, 0.4 + 0.5 * on, b.seed, 0.25 * on); Q.glow(X0, Y0, b.R * T * 1.4, AMBER, 0.3 * on * (1 - on * 0.5), SE); } }
        else if (b.ph === 'crumble') { const q = cl(b.ct / 0.3); Q.sshadow(H.sx(b.x), H.sy(b.y), b.R * T * (1 + 0.4 * q), b.R * T * SE * (1 + 0.4 * q), 0.55 * (1 - q), '#140C06'); } } }
    function under2D(c, b, T) { const ta = trailA(b);   // (2D) the trail as a soft scuff, the shadow
      c.save(); c.lineCap = 'round'; runs(b, (x0, y0, s0, x1, y1, s1, fade, head) => { const a = cl(1 - (head - s1) / fade) * ta; c.strokeStyle = `rgba(70,52,36,${0.28 * a})`; c.lineWidth = b.R * T * 1.0 * SE + 2; c.beginPath(); c.moveTo(H.sx(x0), H.sy(y0)); c.lineTo(H.sx(x1), H.sy(y1)); c.stroke(); }); c.restore();
      if (b.ph === 'rise' || b.ph === 'roll') { const on = b.ph === 'rise' ? sm(b.t / TUNE.rise) : 1; H.softShadow(c, H.sx(b.x), H.sy(b.y), b.R * T * on, 0.4 * on); }
    }
    function drawBoulder(c, f) { const b = f.b, T = X.Tz(), FG = gfx(), z = zOf(b), X0 = H.sx(b.x), Y0 = H.sy(b.y), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45;
      const showB = b.ph === 'rise' || b.ph === 'roll' || (b.ph === 'crumble' && b.ct < 0.12), ba = b.ph === 'crumble' ? 1 - b.ct / 0.12 : 1, gw = 0.55 + 0.35 * Math.sin(b.t * 5 + b.seed) + (b.ph === 'rise' ? 0.6 * (1 - cl(b.t / TUNE.rise)) : 0);
      if (FG) { const L = [];
        if (showB) L.push({ mesh: 'boulder', X: X0, Y: Y0, z, M: b.M, s: b.R / 0.97 * (b.ph === 'crumble' ? 1 + 0.08 * b.ct / 0.12 : 1), glow: gw, alpha: ba });
        for (const p of b.chunks) L.push({ mesh: p.s < b.R * 0.34 ? 'chunk' : 'shard', v: p.v, X: H.sx(p.x), Y: H.sy(p.y), z: p.z, M: p.M, s: p.s, kind: 1, glow: 0.4, alpha: 1 - sm((p.t - p.life + 0.3) / 0.3) });
        if (L.length) { let pet = null; if (me.y < b.y + 0.2 && Math.hypot(PX - X0, PY - (Y0 - z * CE * T)) < b.R * T * 1.2) pet = [PX, PY, T * 0.85]; if (GPU().draw(c, L, { k: T, pet })) return; } }
      // (2D) a lit stone ball with turning bands
      if (!showB) { for (const p of b.chunks) { const s = p.s * T * 0.45; c.fillStyle = '#9A6B44'; c.beginPath(); c.arc(H.sx(p.x), H.sy(p.y) - p.z * CE * T, s, 0, TAU); c.fill(); } return; }
      const Yc = Y0 - z * CE * T, r = b.R * T; c.save(); c.globalAlpha = ba; if (b.ph === 'rise') { c.beginPath(); c.rect(X0 - r * 2, Yc - r * 3, r * 4, Y0 - Yc + r * 3 + r * 0.15 * SE); c.clip(); }
      H.sphere(c, X0, Yc, r, '#B87A45', '#F1D2A2', '#5A3519', { spec: false }); c.save(); c.beginPath(); c.arc(X0, Yc, r * 0.98, 0, TAU); c.clip();
      for (let k = -4; k <= 4; k++) { const o = ((b.roll * 0.5 + k * 0.45) % 1.8 + 1.8) % 1.8 - 0.9; c.strokeStyle = k % 2 ? 'rgba(90,46,20,0.35)' : 'rgba(255,226,180,0.22)'; c.lineWidth = r * 0.09; c.beginPath(); c.ellipse(X0, Yc + o * r, r * 1.05, r * 0.22, 0.25, 0, TAU); c.stroke(); }
      c.strokeStyle = 'rgba(255,184,77,0.8)'; c.lineWidth = 2; c.beginPath(); const ca = b.roll * 0.8; c.moveTo(X0 + Math.cos(ca) * r * 0.8, Yc + Math.sin(ca) * r * 0.5); c.lineTo(X0 + Math.cos(ca + 0.5) * r * 0.2, Yc + Math.sin(ca + 0.9) * r * 0.2); c.lineTo(X0 + Math.cos(ca + 2.4) * r * 0.75, Yc + Math.sin(ca + 2.4) * r * 0.6); c.stroke(); c.restore(); c.restore(); }
    function drawOver(c, f, T) { if (!lead(f)) return; const FG = gfx(), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45, L = alive();
      if (FG) { const Q = FG.begin(c, [PX, PY, T * 0.6]); for (const b of L) overQ(Q, b, T); FG.flush(c); return; }
      for (const b of L) over2D(c, b, T); }
    function overQ(Q, b, T) { {
        for (const p of b.dust) { const q = p.t / p.life, r = T * p.s * (0.6 + 0.9 * q), a = Math.sin(Math.min(1, q * 2.5) * Math.PI / 2) * (1 - q) * 0.6; Q.quad(84, H.sx(p.x), H.sy(p.y) - p.z * CE * T, r, 0, 0, r * 0.8, DUSTC, a, q, p.sd, 0); }
        for (const p of b.peb) if (p.z > 0) { const s = p.s * T; Q.rq(105, H.sx(p.x), H.sy(p.y) - p.z * CE * T, s, s * 0.8, p.rot, '#FFFFFF', 1, p.rot, p.sd, p.md); }
        for (const p of b.sparks) { const q = p.t / p.life, X0 = H.sx(p.x), Y0 = H.sy(p.y) - p.z * CE * T; Q.glow(X0, Y0, b.R * T * (0.5 + 0.6 * q), AMBER, 0.45 * (1 - q)); Q.star(X0, Y0, b.R * T * 0.5 * (1 - q * 0.5), 0.8 * (1 - q), PALE); }
        if (b.ph === 'rise') { const q = cl(b.t / TUNE.rise); Q.glow(H.sx(b.x), H.sy(b.y) - b.R * T * 0.3, b.R * T * 1.5, GOLD, 0.22 * (1 - q)); } } }
    function over2D(c, b, T) { c.save(); for (const p of b.dust) { const q = p.t / p.life, r = T * p.s * (0.6 + 0.9 * q); c.globalAlpha = (1 - q) * 0.35; c.fillStyle = '#8A7258'; c.beginPath(); c.ellipse(H.sx(p.x), H.sy(p.y) - p.z * CE * T, r, r * 0.75, 0, 0, TAU); c.fill(); }
      c.globalAlpha = 1; for (const p of b.peb) { const s = p.s * T * 0.7; c.fillStyle = p.md === 2 ? '#2E2A27' : p.md === 1 ? '#A8603A' : '#C9A577'; c.beginPath(); c.ellipse(H.sx(p.x), H.sy(p.y) - p.z * CE * T, s, s * (p.fl ? 0.4 : 0.75), p.rot, 0, TAU); c.fill(); } c.restore(); }
  };
  S.ballcrusher.warm = () => { setTimeout(() => { try { if (gfx()) GPU().warm(); } catch (e) { /* (built on the cast instead) */ } }, 400); };
  S.ballcrusher.TUNE = TUNE;
})();
