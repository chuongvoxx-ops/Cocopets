/* ---------- (v370) Wind Strongs, new (1 of 3): Gust of Wind, Flumes, Boomerang of the Gale, Dandelion Detonation ----------
   The ten Wind Strongs are replaced (rows in 20k1; the old keys are aliased to the new ones in elemParse, so a pet that
   had one equipped keeps that slot). Every picture is painted on the GPU through the wind kit (20k3l), with the solid
   things (feathers, seeds, the dandelion) cel-shaded in 2D between its layers. Counts (explicit, by evolution tier:
   Base L1-3 / Adept L4-6 / Celestial L7, C.evo) and damage (x base x K) are in each move's table below. Every hit is
   one hitMon / hitArea call made in an update (none is scheduled ahead, so nothing is left behind when a cast is cut
   short); everything moves by dt. */
(() => {
  const S = ELEM_IMPL.wind.strong;
  for (const k of ['silkstream', 'courier', 'updraft', 'shears', 'pearl', 'galestair', 'featherstorm', 'zephyr', 'needle', 'tailwind']) delete S[k];
  const TAU = Math.PI * 2, cl = u => Math.max(0, Math.min(1, u)), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, eo = u => 1 - Math.pow(1 - cl(u), 3);
  const R1 = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const tierOf = C => { const ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))); return ev >= 7 ? 2 : ev >= 4 ? 1 : 0; };
  const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
  const segD = (px, py, x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, ll = dx * dx + dy * dy, s = ll > 1e-9 ? cl(((px - x0) * dx + (py - y0) * dy) / ll) : 0; return [Math.hypot(px - x0 - dx * s, py - y0 - dy * s), s]; };
  const turn = (a, b, mx) => { let d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + Math.max(-mx, Math.min(mx, d)); };
  /* the aimed point, no further than range */
  function aimPt(H, C, range) { const me = H.me; let x = isFinite(C.tx) ? C.tx : me.x + Math.cos(C.a) * 4, y = isFinite(C.ty) ? C.ty : me.y + Math.sin(C.a) * 4; const d = Math.hypot(x - me.x, y - me.y); if (d > range) { x = me.x + (x - me.x) / d * range; y = me.y + (y - me.y) / d * range; } return [x, y]; }
  /* n targets around the aim: the monster nearest it, then the others of its group (within spread of it), cycled */
  function pick(H, n, ax, ay, range, spread) { const me = H.me, L = H.living().filter(m => valid(m) && Math.hypot(m.x - me.x, m.y - me.y) < range + (m.r || 0.4)); if (!L.length) return [];
    L.sort((a, b) => Math.hypot(a.x - ax, a.y - ay) - Math.hypot(b.x - ax, b.y - ay)); const p = L[0], grp = L.filter(m => Math.hypot(m.x - p.x, m.y - p.y) < spread); const out = []; for (let i = 0; i < n; i++) out.push(grp[i % grp.length]); return out; }
  /* the first living monster a swept segment meets (floor), within extra of its edge: [monster, s along] */
  function sweep(H, x0, y0, x1, y1, extra, skip) { let hm = null, hs = 2; for (const m of H.living()) { if (!valid(m) || (skip && skip.has(m))) continue; const [d, s] = segD(m.x, m.y, x0, y0, x1, y1); if (d < (m.r || 0.4) + extra && s < hs) { hs = s; hm = m; } } return hm ? [hm, hs] : null; }
  const wisp = (H, x, y, vx, vy, life) => H.P({ kind: 'wind', x, y, vx, vy, life: life || 0.45, max: life || 0.45, size: 2, drag: 1.2, color: Math.random() < 0.5 ? '#D8FFEE' : '#9FF0CC' });
  const leafP = (H, x, y, vx, vy, life) => H.P({ kind: 'petal', x, y, vx, vy, life: life || 0.6, max: life || 0.6, size: 2.6, rot: Math.random() * TAU, vr: 8, drag: 0.6, color: Math.random() < 0.6 ? '#7CD87A' : '#CFF5DF' });
  const mouth = (H, me) => [me.x + (me.face || 1) * 0.3, me.y + 0.02, 0.62 + (me.r || 0.35) * 0.3];
  WDK.U = { cl, lerp, sm, eo, R1, tierOf, valid, segD, turn, aimPt, pick, sweep, wisp: (H, x, y, vx, vy, life) => wisp(H, x, y, vx, vy, life), leafP: (H, x, y, vx, vy, life) => leafP(H, x, y, vx, vy, life), mouth };   /* (shared with 20k3n, 20k3o) */

  /* ================= W-S01 Gust of Wind =================
     The pet gathers a small mint sphere at its mouth (thin ribbons tightening round it, motes drawn in) and fires it: a
     compact orb (a bright core, a clear shell, bands turning round it on different axes, a narrow spiralling trail) that
     flies to its target (restrained homing; swept collision; a dead target leaves it flying on to where it was) and there
     bursts into an enormous sphere of turbulent air: crossing ribbons, a bright pressure front sweeping out, a ring of
     pressure on the floor marking exactly the area it strikes; then it loosens into scattered ribbons and is gone.
       orbs           1 / 2 / 3                 (launched 0.3 s after the cast, then every 0.24 / 0.2 s)
       burst radius   2.0 x 1.0 / 1.2 / 1.4 x K tiles (the sphere and the floor ring are drawn at it)
       damage         2.2 / 1.7 / 1.45 a burst  (one hitArea per orb: the impact and the expansion are the same hit)
     Orbs go to the monster nearest the aim and the others of its group (within 3.5 tiles), cycled; one target takes the
     whole sequence. Cost 24, cooldown 2.6 s. */
  S.gust = (C, h) => { const H = h, me = H.me, tier = tierOf(C), N = [1, 2, 3][tier], R = 2.0 * [1, 1.2, 1.4][tier] * C.K, DMG = C.base * C.K * [2.2, 1.7, 1.45][tier], SPD = 11, RANGE = 9, GAP = [0, 0.24, 0.2][tier], L0 = 0.3, BT = 0.8;
    const [ax, ay] = aimPt(H, C, RANGE), tg = pick(H, N, ax, ay, RANGE, 3.5), orbs = [];
    for (let i = 0; i < N; i++) { const m = tg[i] || null, dx = m ? m.x : ax, dy = m ? m.y : ay; orbs.push({ i, L: L0 + i * GAP, ph: 'wait', tgt: m, dx: dx + (m ? 0 : (i - (N - 1) / 2) * 0.9), dy, x: 0, y: 0, z: 0, a: 0, tr: [], ft: 0, bt: 0, bx: 0, by: 0, sd: Math.random() * 9 }); }
    const dbg = { bursts: 0, hits: 0 };
    me.sq = 0.75; H.X.sfx.hum && H.X.sfx.hum();
    function burst(o, x, y, t) { o.ph = 'burst'; o.bt = t; o.bx = x; o.by = y; dbg.bursts++; dbg.hits += H.hitArea(x, y, R, DMG, C.dmgO({ kb: 4 })) || 0;
      H.X.shake(4 + 2 * tier, 0.14); H.X.sfx.thud && H.X.sfx.thud(); H.X.sfx.whoosh && H.X.sfx.whoosh(); H.X.light && H.X.light(x, y, R * 1.2, 0.25);
      const n = H.n(14 + 4 * tier); for (let k = 0; k < n; k++) { const b = k / n * TAU, v = 6 + R * 2.5; wisp(H, x + Math.cos(b) * 0.4, y + Math.sin(b) * 0.3 - 0.3, Math.cos(b) * v, Math.sin(b) * v * 0.6, 0.5); }
      for (let k = 0; k < H.n(6); k++) { const b = Math.random() * TAU; leafP(H, x, y - 0.4, Math.cos(b) * 5, Math.sin(b) * 3.5 - 2, 0.8); } }
    const F = H.add({ key: 'gust', life: 30, x: me.x, y: me.y, dbg, orbs, R,
      update(dt, f) { const t = f.t, mp = mouth(H, me); let live = 0;
        for (const o of orbs) {
          if (o.ph === 'wait') { if (me.dead) { o.ph = 'done'; continue; } live++;
            if (t >= o.L) { o.ph = 'fly'; o.x = mp[0]; o.y = mp[1]; o.z = mp[2]; o.a = Math.atan2(o.dy - o.y, o.dx - o.x) + (N > 1 ? (o.i - (N - 1) / 2) * 0.35 : 0); me.sq = 0.6; H.X.sfx.whoosh && H.X.sfx.whoosh(); }
            else if (t > o.L - 0.3 && Math.random() < 1.6 * H.Q()) { const b = Math.random() * TAU; wisp(H, mp[0] + Math.cos(b) * 1.1, mp[1] + Math.sin(b) * 0.6 - mp[2], -Math.cos(b) * 4, -Math.sin(b) * 2.6, 0.25); }   /* (motes drawn in to the gathering sphere) */
            continue; }
          if (o.ph === 'fly') { live++; o.ft += dt; if (valid(o.tgt)) { o.dx = o.tgt.x; o.dy = o.tgt.y; }
            const want = Math.atan2(o.dy - o.y, o.dx - o.x), d = Math.hypot(o.dx - o.x, o.dy - o.y), st = SPD * dt; o.a = turn(o.a, want, 9 * dt * (1 + o.ft * 3));
            const nx = o.x + Math.cos(o.a) * Math.min(st, d + 0.01), ny = o.y + Math.sin(o.a) * Math.min(st, d + 0.01); o.z = lerp(o.z, 0.55, Math.min(1, dt * 4));
            const hit = sweep(H, o.x, o.y, nx, ny, 0.32);
            if (hit) { burst(o, lerp(o.x, nx, hit[1]), lerp(o.y, ny, hit[1]), t); continue; }
            if (H.X.blocked(nx, ny, 0.2, 0)) { burst(o, o.x, o.y, t); continue; }
            o.x = nx; o.y = ny; o.tr.unshift([o.x, o.y, o.z]); if (o.tr.length > 14) o.tr.pop();
            if (d <= st || o.ft > 2.2) { burst(o, o.x, o.y, t); continue; }
            continue; }
          if (o.ph === 'burst') { live++; if (t - o.bt > BT) o.ph = 'done'; } }
        if (!live) f.life = 0; },
      drawUnder(c, f, X0, Y0, T) { const G = WDK.bind(H), t = f.t;
        G.layer(c, () => { for (const o of orbs) { if (o.ph !== 'burst') continue; const u = (t - o.bt) / BT, X = H.sx(o.bx), Y = H.sy(o.by), e = eo(u / 0.25);
          G.ring(c, X, Y, R * T * (0.2 + 0.85 * e), (1 - sm((u - 0.25) / 0.75)) * 0.95, { th: 0.12 + 0.1 * (1 - e), seed: o.sd, col: G.P.deep, lite: G.P.mintW });   /* (the pressure front on the floor: the burst's exact reach) */
          G.ripple(c, X, Y, R * T * (0.5 + 0.75 * eo(u)), 0.55 * (1 - u), { th: 0.06, seed: o.sd });
          G.swirl(c, X, Y, R * T * 0.9, 0.55 * (1 - sm(u)), { spin: 4, seed: o.sd }); }
          for (const o of orbs) if (o.ph === 'fly') G.shade(c, H.sx(o.x), H.sy(o.y), T * 0.4, T * 0.4 * H.GY, 0.4); }); },
      draw(c, f, X0, Y0, T) { const G = WDK.bind(H), t = f.t, mp = mouth(H, me), MX = H.sx(mp[0]), MY = H.sy(mp[1]) - mp[2] * T, P = G.P;
        G.layer(c, () => {
          // the gathering sphere at the mouth (for the next orb)
          for (const o of orbs) { if (o.ph !== 'wait') continue; const u = cl(1 - (o.L - t) / 0.3); if (u <= 0) continue; const r = T * 0.3 * eo(u);
            for (let j = 0; j < 3; j++) G.arc(c, MX, MY, T * (1.0 - 0.6 * u) , t * 9 + j * 2.1, 0.8 * u, { k: 0.45 + 0.2 * j, beta: j * 1.1 + t * 2, mode: 1, span: 2.0, th: 0.18, seed: j });   /* (ribbons tightening round it) */
            G.gust(c, MX, MY, r, u, { core: 1, spin: 3, seed: o.sd, shade: 0 }); break; }
          // the orbs in flight: a narrow spiralling trail, the orb, two bands turning round it on their own axes
          for (const o of orbs) { if (o.ph !== 'fly') continue; const X = H.sx(o.x), Y = H.sy(o.y) - o.z * T, r = T * 0.3;
            if (o.tr.length > 2) { for (const s of [0, Math.PI]) { const pts = o.tr.map((q, j) => { const th = t * 18 + j * 0.9 + s, rr = T * 0.14 * (1 - j / o.tr.length * 0.4); return [H.sx(q[0]) + Math.cos(th) * rr * 0.4, H.sy(q[1]) - q[2] * T + Math.sin(th) * rr]; }); pts[0] = [X, Y]; G.rib(c, pts, T * 0.07, 0.85, { edge: 0, taper: 0.9, fade: 1, seed: o.sd + s, flow: 6 }); } }
            G.gust(c, X, Y, r, 1, { core: 1, spin: 3.5, seed: o.sd, shade: 0 }); G.glow(c, X, Y, r * 2, P.jade, 0.25);
            G.ring(c, X, Y, r * 1.45, 0.9, { k: 0.3, beta: t * 6 + o.sd, th: 0.16, seed: o.sd }); G.ring(c, X, Y, r * 1.3, 0.8, { k: 0.55, beta: -t * 4.5 + 1.2, th: 0.16, seed: o.sd + 2 }); }
          // the bursts: the sphere expanding with its front, then loosening into ribbons
          for (const o of orbs) { if (o.ph !== 'burst') continue; const u = (t - o.bt) / BT, X = H.sx(o.bx), Yf = H.sy(o.by), e = eo(u / 0.26), lo = sm((u - 0.22) / 0.78), rS = R * T * (0.12 + 0.88 * e) * (1 + 0.1 * lo), Y = Yf - rS * 0.42, a = 1 - lo * lo;
            G.gust(c, X, Y, rS, a * 0.85, { core: 0.5 * Math.max(0, 1 - u / 0.15), spin: 2.6 - 1.4 * lo, seed: o.sd, shade: 0 });
            for (let j = 0; j < 7; j++) { const s = R1(o.sd + j), ro = rS * (0.92 + 0.35 * lo * (0.6 + s)), ph = j * 0.9 + t * (5 - 2.5 * lo) * (j % 2 ? 1 : -1);
              G.arc(c, X, Y, ro, ph, (0.85 - 0.25 * j / 7) * (1 - lo) * Math.min(1, u * 8), { k: 0.18 + 0.6 * s, beta: j * 0.83 + o.sd, dir: j % 2 ? 1 : -1, span: 1.4 + lo * 1.2, th: 0.07 + 0.05 * s, seed: o.sd + j }); }
            if (u < 0.2) { G.glow(c, X, Y, rS * 0.6, P.mint, 0.25 * (1 - u / 0.2)); G.star(c, X, Y, T * 0.8, 0.6 * (1 - u / 0.2)); } } });   /* (v372: a brief, small flash, not a blinding one) */
        // the solid shadows of the orbs in flight
        for (const o of orbs) if (o.ph === 'fly') H.softShadow(c, H.sx(o.x), H.sy(o.y), T * 0.3, 0.18); } });
    return F; };

  /* ================= W-S02 Flumes =================
     A small fan of long, elegant feathers (a white shaft, layered vanes of pale mint and pearl with emerald roots, luminous
     edges) appears behind the pet and they shoot out one after another, twisting as they fly, curving in on their targets
     (restrained homing), each drawing a thin feather-shaped streak; each strikes and breaks into a quick burst of compressed
     wind: a sharp pressure ring, short slicing ribbons, a scatter of glowing feather fragments. Lighter and quicker than
     Gust of Wind.
       feathers   3 / 4 / 6       (Celestial: two rapid groups of three)
       burst      radius 1.1 tiles, 0.8 x base x K a feather (one hitArea a feather; different feathers may hit the same
                  monster, and a burst may splash a neighbour: the overlap is the radius above)
     Targets: the monster nearest the aim and the others within 3 tiles of it, cycled. Cost 22, cooldown 2.4 s. */
  S.flumes = (C, h) => { const H = h, me = H.me, tier = tierOf(C), N = [3, 4, 6][tier], DMG = C.base * C.K * 0.8, RB = 1.1, SPD = 15, RANGE = 9, BT = 0.42;
    const [ax, ay] = aimPt(H, C, RANGE), tg = pick(H, N, ax, ay, RANGE, 3), aim = Math.atan2(ay - me.y, ax - me.x), dbg = { bursts: 0, hits: 0 };
    const fs = []; for (let i = 0; i < N; i++) { const g = tier === 2 ? (i < 3 ? 0 : 1) : 0, j = tier === 2 ? i % 3 : i, n = tier === 2 ? 3 : N, off = (j - (n - 1) / 2) / Math.max(1, (n - 1) / 2), m = tg[i] || null;
      fs.push({ i, L: 0.3 + j * 0.075 + g * 0.34, off, gy: g, ph: 'wait', tgt: m, dx: m ? m.x : ax + off * 0.8, dy: m ? m.y : ay, x: 0, y: 0, z: 0, a: 0, ft: 0, tr: [], bt: 0, bx: 0, by: 0, bz: 0, sd: Math.random() * 9, frags: null }); }
    me.sq = 0.75; H.X.sfx.whoosh && H.X.sfx.whoosh();
    const home = o => { const b = aim + Math.PI + o.off * 0.95 + (o.gy ? 0.25 : 0), d = 0.95 + 0.15 * Math.abs(o.off); return [me.x + Math.cos(b) * d, me.y + Math.sin(b) * d * 0.7, 1.0 + 0.25 * (1 - Math.abs(o.off)) + o.gy * 0.3]; };
    function burst(o, x, y, z, t) { o.ph = 'burst'; o.bt = t; o.bx = x; o.by = y; o.bz = z; dbg.bursts++; dbg.hits += H.hitArea(x, y, RB, DMG, C.dmgO({ kb: 2 })) || 0;
      o.frags = []; for (let k = 0; k < 6; k++) { const b = k / 6 * TAU + Math.random() * 0.6; o.frags.push({ b, v: 2.5 + Math.random() * 2, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, s: 0.18 + Math.random() * 0.1 }); }
      H.X.sfx.pop ? H.X.sfx.pop() : H.X.sfx.whoosh && H.X.sfx.whoosh(); H.X.shake(2, 0.06); for (let k = 0; k < H.n(7); k++) { const b = Math.random() * TAU; wisp(H, x, y - z * 0.5, Math.cos(b) * 5, Math.sin(b) * 3.5, 0.3); } }
    const F = H.add({ key: 'flumes', life: 30, x: me.x, y: me.y, dbg, fs,
      update(dt, f) { const t = f.t; let live = 0;
        for (const o of fs) {
          if (o.ph === 'wait') { if (me.dead) { o.ph = 'done'; continue; } live++; const p = home(o); o.x = p[0]; o.y = p[1]; o.z = p[2];
            if (t >= o.L) { o.ph = 'fly'; if (valid(o.tgt)) { o.dx = o.tgt.x; o.dy = o.tgt.y; } o.a = Math.atan2(o.dy - o.y, o.dx - o.x) - o.off * 0.75; H.X.sfx.whoosh && H.X.sfx.whoosh(); } continue; }
          if (o.ph === 'fly') { live++; o.ft += dt; if (valid(o.tgt)) { o.dx = o.tgt.x; o.dy = o.tgt.y; }
            const d = Math.hypot(o.dx - o.x, o.dy - o.y), st = SPD * dt; o.a = turn(o.a, Math.atan2(o.dy - o.y, o.dx - o.x), (5 + o.ft * 10) * dt);   /* (curving in: gentle at first, firmer as it closes) */
            const nx = o.x + Math.cos(o.a) * st, ny = o.y + Math.sin(o.a) * st; o.z = lerp(o.z, 0.55, Math.min(1, dt * 5));
            const hit = sweep(H, o.x, o.y, nx, ny, 0.22);
            if (hit) { burst(o, lerp(o.x, nx, hit[1]), lerp(o.y, ny, hit[1]), o.z, t); continue; }
            if (H.X.blocked(nx, ny, 0.15, 0) || o.ft > 1.4 || (d < st && !valid(o.tgt))) { burst(o, o.x, o.y, o.z, t); continue; }
            o.x = nx; o.y = ny; o.tr.unshift([o.x, o.y, o.z]); if (o.tr.length > 9) o.tr.pop(); continue; }
          if (o.ph === 'burst') { live++; if (t - o.bt > BT) o.ph = 'done'; } }
        if (!live) f.life = 0; },
      draw(c, f, X0, Y0, T) { const G = WDK.bind(H), t = f.t, P = G.P;
        // under the feathers: their streaks, their glow; the bursts
        G.layer(c, () => {
          for (const o of fs) { if (o.ph === 'wait') { const u = cl((t - o.L + 0.3) / 0.22); if (u > 0) G.glow(c, H.sx(o.x), H.sy(o.y) - o.z * T, T * 0.55, P.jade, 0.35 * u); continue; }
            if (o.ph === 'fly' && o.tr.length > 1) { const pts = o.tr.map(q => [H.sx(q[0]), H.sy(q[1]) - q[2] * T]); G.rib(c, pts, T * 0.1, 0.9, { edge: 0, taper: 0.95, fade: 1, seed: o.sd, flow: 7 }); G.glow(c, pts[0][0], pts[0][1], T * 0.45, P.jade, 0.3); }
            if (o.ph === 'burst') { const u = (t - o.bt) / BT, X = H.sx(o.bx), Yf = H.sy(o.by), Y = Yf - o.bz * T, e = eo(u / 0.5), a = 1 - sm(u);
              G.ring(c, X, Y, T * RB * (0.25 + 0.75 * e), a, { k: 0.8, beta: o.sd, th: 0.13 * (1.2 - e), seed: o.sd, col: P.deep, lite: P.mintW });   /* (the sharp pressure ring, upright) */
              G.ring(c, X, Yf, T * RB * (0.3 + 0.75 * e), 0.8 * a, { th: 0.1, seed: o.sd + 1 });   /* (its reach on the floor) */
              for (let j = 0; j < 4; j++) { const s = R1(o.sd * 3 + j); G.arc(c, X, Y, T * (0.45 + 0.4 * s) * (0.6 + 0.6 * e), j * 1.6 + t * 16 * (j % 2 ? 1 : -1), a, { k: 0.25 + 0.5 * s, beta: j * 0.8 + o.sd, dir: j % 2 ? 1 : -1, span: 1.6, th: 0.1, seed: o.sd + j }); }   /* (short slicing ribbons) */
              if (u < 0.25) { G.glow(c, X, Y, T * 0.7, P.mint, 0.35 * (1 - u / 0.25)); G.star(c, X, Y, T * 0.7, 0.7 * (1 - u / 0.25)); } } } });
        // the feathers (cel-shaded), and the fragments of the burst ones
        for (const o of fs) {
          if (o.ph === 'wait') { const u = cl((t - o.L + 0.3) / 0.22); if (u <= 0) continue; const X = H.sx(o.x), Y = H.sy(o.y) - o.z * T, b = Math.atan2(o.y - me.y, o.x - me.x) * 0.6 - Math.PI / 2 * 0.4 + (o.off * 0.5);
            G.feather(c, X - Math.cos(b) * T * 0.4, Y - Math.sin(b) * T * 0.4, b, T * 0.95 * eo(u), u, Math.cos(t * 3 + o.i)); continue; }
          if (o.ph === 'fly') { const X = H.sx(o.x), Y = H.sy(o.y) - o.z * T, b = o.a; G.feather(c, X - Math.cos(b) * T * 0.9, Y - Math.sin(b) * T * 0.6, Math.atan2(Math.sin(b), Math.cos(b)), T * 1.05, 1, Math.cos(o.ft * 11 + o.i)); continue; }
          if (o.ph === 'burst' && o.frags) { const u = (t - o.bt) / BT, X = H.sx(o.bx), Y = H.sy(o.by) - o.bz * T; for (const q of o.frags) { const d = q.v * u * T * 0.45; G.feather(c, X + Math.cos(q.b) * d, Y + Math.sin(q.b) * d * 0.7 + u * u * T * 0.4, q.r + q.vr * u, T * q.s * 1.6, 1 - u, Math.cos(q.r + u * 9), { glow: 1.2 }); } } } } });
    return F; };

  /* ================= W-S03 Boomerang of the Gale =================
     The pet summons a huge crescent boomerang of translucent jade wind with a sharp silver outer edge and throws it: it
     spins out through the monsters on a curving arc, then turns and flies back to the pet, tracking where the pet is now
     (move after throwing and it sweeps a different group on its way home). Its spinning crescent leaves a curved wind trail,
     bright at its outer edge and fading inward, and a flowing ribbon of air streams behind it.
       boomerangs   1 / 2 / 3     (Adept: diverging arcs; Celestial: a broad fan, returning in quick succession)
       damage       going 0.9 / 0.75 / 0.62, returning 1.5 / 1.25 / 1.05 (x base x K): every monster at most once each way
                    a boomerang (hitMon as its blade sweeps it: radius 1.0 tile)
     Out 6 tiles over 0.55 s, then home at up to 15 tiles / s (caught within 0.7 tiles of the pet; at most 3 s). Cost 24,
     cooldown 2.8 s. */
  S.boomerang = (C, h) => { const H = h, me = H.me, tier = tierOf(C), N = [1, 2, 3][tier], DO = C.base * C.K * [0.9, 0.75, 0.62][tier], DB = C.base * C.K * [1.5, 1.25, 1.05][tier], RB = 1.0, OUT = 0.55, DIST = 6;
    const [ax, ay] = aimPt(H, C, 9), aim = Math.atan2(ay - me.y, ax - me.x), offs = [[0], [-0.38, 0.38], [-0.62, 0, 0.62]][tier], dbg = { out: 0, back: 0 };
    const bs = offs.map((o, i) => ({ i, L: 0.22 + i * 0.1, off: o, ph: 'wait', x: me.x, y: me.y, z: 0.7, x0: 0, y0: 0, cx: 0, cy: 0, x1: 0, y1: 0, ft: 0, bt: 0, spin: Math.random() * TAU, vx: 0, vy: 0, hOut: new Set(), hBack: new Set(), tr: [], sd: Math.random() * 9, side: o === 0 ? (i % 2 ? -1 : 1) : Math.sign(o) }));
    me.sq = 0.7; H.X.sfx.whoosh && H.X.sfx.whoosh();
    const F = H.add({ key: 'boomerang', life: 30, x: me.x, y: me.y, dbg, bs,
      update(dt, f) { const t = f.t; let live = 0;
        for (const b of bs) {
          if (b.ph === 'wait') { if (me.dead) { b.ph = 'done'; continue; } live++; b.x = me.x + (me.face || 1) * 0.5; b.y = me.y - 0.1; b.z = 0.9;
            if (t >= b.L) { const a = aim + b.off, px = -Math.sin(a), py = Math.cos(a); b.ph = 'out'; b.ft = 0; b.x0 = b.x; b.y0 = b.y; b.x1 = me.x + Math.cos(a) * DIST + px * b.side * 1.2; b.y1 = me.y + Math.sin(a) * DIST + py * b.side * 1.2; b.cx = me.x + Math.cos(a) * DIST * 0.55 - px * b.side * 1.6; b.cy = me.y + Math.sin(a) * DIST * 0.55 - py * b.side * 1.6; me.sq = 0.6; H.X.sfx.whoosh && H.X.sfx.whoosh(); }
            continue; }
          live++; b.ft += dt; b.spin += dt * 17; const px0 = b.x, py0 = b.y;
          if (b.ph === 'out') { const u = cl(b.ft / OUT), e = 1 - (1 - u) * (1 - u) * 0.6 - 0.4 * (1 - u); const v = sm(u) * 0.6 + u * 0.4, q = 1 - v; let nx = q * q * b.x0 + 2 * q * v * b.cx + v * v * b.x1, ny = q * q * b.y0 + 2 * q * v * b.cy + v * v * b.y1;
            if (H.X.blocked(nx, ny, 0.25, 0)) { b.ph = 'back'; b.bt = t; nx = b.x; ny = b.y; }
            b.vx = (nx - b.x) / Math.max(dt, 1e-4); b.vy = (ny - b.y) / Math.max(dt, 1e-4); b.x = nx; b.y = ny; b.z = lerp(0.9, 0.65, u); if (u >= 1 && b.ph === 'out') { b.ph = 'back'; b.bt = t; } void e; }
          else if (b.ph === 'back') { const tb = t - b.bt, dx = me.x - b.x, dy = me.y - b.y, d = Math.hypot(dx, dy) || 1, sp = Math.min(15, 3 + tb * 22);
            // steering toward the pet's current position: the velocity turns toward it, so it returns on a curve
            const k = Math.min(1, dt * (3 + tb * 6)); b.vx = lerp(b.vx, dx / d * sp, k); b.vy = lerp(b.vy, dy / d * sp, k); const vv = Math.hypot(b.vx, b.vy) || 1; b.vx = b.vx / vv * sp; b.vy = b.vy / vv * sp;
            b.x += b.vx * dt; b.y += b.vy * dt; b.z = lerp(b.z, 0.75, Math.min(1, dt * 3));
            if (d < 0.7 || tb > 3 || me.dead) { b.ph = 'caught'; b.bt = t; H.X.sfx.whoosh && H.X.sfx.whoosh(); for (let k2 = 0; k2 < H.n(8); k2++) { const a2 = Math.random() * TAU; wisp(H, me.x, me.y - 0.5, Math.cos(a2) * 4, Math.sin(a2) * 3, 0.35); } } }
          else if (b.ph === 'caught') { if (t - b.bt > 0.35) b.ph = 'done'; continue; }
          else continue;
          // the sweep: every monster the blade passes, once going and once returning
          const out = b.ph === 'out', set = out ? b.hOut : b.hBack;
          for (const m of H.living()) { if (!valid(m) || set.has(m)) continue; if (segD(m.x, m.y, px0, py0, b.x, b.y)[0] < (m.r || 0.4) + RB) { set.add(m); H.X.hitMon(m, out ? DO : DB, C.dmgO({ kb: out ? 1.5 : 3 })); if (out) dbg.out++; else dbg.back++; H.X.sparks && H.X.sparks(m.x, m.y - 0.3, '#CFFFEA', 5, 4); for (let k2 = 0; k2 < H.n(3); k2++) leafP(H, m.x, m.y - 0.4, (Math.random() - 0.5) * 4, -2, 0.5); } }
          b.tr.unshift([b.x, b.y, b.z]); if (b.tr.length > 12) b.tr.pop();
          if (Math.random() < 0.6 * H.Q()) wisp(H, b.x, b.y - b.z, -b.vx * 0.15, -b.vy * 0.15, 0.3); }
        if (!live) f.life = 0; },
      drawUnder(c, f, X0, Y0, T) { const G = WDK.bind(H); G.layer(c, () => { for (const b of bs) if (b.ph === 'out' || b.ph === 'back') G.shade(c, H.sx(b.x), H.sy(b.y), T * RB * 1.1, T * RB * 1.1 * H.GY, 0.35, b.sd); }); },
      draw(c, f, X0, Y0, T) { const G = WDK.bind(H), t = f.t, P = G.P;
        G.layer(c, () => { for (const b of bs) { if (b.ph === 'wait') { const u = cl((t - b.L + 0.22) / 0.2); if (u > 0) { const X = H.sx(b.x), Y = H.sy(b.y) - b.z * T; G.arc(c, X, Y, T * RB * eo(u), t * 6, u, { k: 0.6, mode: 1, span: 2.6, th: 0.42, col: '#0F7A58', lite: P.silver, seed: b.sd }); } continue; }
            if (b.ph === 'caught') { const u = (t - b.bt) / 0.35, X = H.sx(me.x), Y = H.sy(me.y) - 0.6 * T; G.ring(c, X, Y, T * (0.5 + 0.8 * u), 1 - u, { k: 0.5, th: 0.15 }); continue; }
            if (b.ph !== 'out' && b.ph !== 'back') continue; const X = H.sx(b.x), Y = H.sy(b.y) - b.z * T, r = T * RB, k = 0.62, sp = b.spin;
            // the flowing ribbon of air behind it
            if (b.tr.length > 2) { const pts = b.tr.map(q => [H.sx(q[0]), H.sy(q[1]) - q[2] * T]); G.rib(c, pts, T * 0.32, 0.75, { edge: 0, taper: 0.9, fade: 1, seed: b.sd, flow: 5 }); }
            // the curved wind trail its tips leave as it spins (bright outer edge, fading inward), then the crescent
            G.arc(c, X, Y, r * 1.02, sp + 1.3, 0.75, { k, mode: 0, span: 2.6, th: 0.32, seed: b.sd, dens: 0.5 });
            G.arc(c, X, Y, r * 1.02, sp + 1.3 + Math.PI, 0.45, { k, mode: 0, span: 1.8, th: 0.22, seed: b.sd + 1, dens: 0.4 });
            G.arc(c, X, Y, r, sp, 1, { k, mode: 1, span: 2.8, th: 0.55, col: '#0E7A57', lite: P.silver, seed: b.sd, dens: 1.6 });
            G.glow(c, X, Y, r * 1.3, P.jade, 0.25); } });
        // the silver edge, crisp, over the light (so it reads on a pale floor)
        for (const b of bs) { if (b.ph !== 'out' && b.ph !== 'back') continue; const X = H.sx(b.x), Y = H.sy(b.y) - b.z * T, r = T * RB; c.save(); c.translate(X, Y); c.scale(1, 0.62); c.lineCap = 'round';
          c.strokeStyle = 'rgba(40,58,62,0.7)'; c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.arc(0, 0, r * 0.985, b.spin - 1.25, b.spin + 1.25); c.stroke();
          c.strokeStyle = 'rgba(236,246,246,0.95)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.arc(0, 0, r * 0.985, b.spin - 1.2, b.spin + 1.2); c.stroke(); c.restore(); H.softShadow(c, X, H.sy(b.y), r * 0.6, 0.15); } } });
    return F; };

  /* ================= W-S04 Dandelion Detonation =================
     The pet conjures a luminous dandelion and blows: its seeds (a tiny glowing emerald core under fine white filaments)
     float out, gently homing, and catch on the monsters. Each arms for 2 s in plain view (it glows brighter, its
     filaments spread, a thin ring of wind gathers round it, and at the last its filaments open into tiny spinning
     blades), then bursts: a crisp white-green pressure ring, drifting seed fibres. Seeds go to separate monsters first,
     the spare ones to the biggest; one boss may carry several. A seed whose monster dies drops to where it fell and
     finishes its count there; a seed that finds no monster settles where it is and counts there.
       seeds      3 / 5 / 7
       burst      radius 1.3 tiles, 1.3 / 1.0 / 0.8 x base x K (one hitArea a seed, when its count ends)
     Seeds float at 4.5 tiles / s for at most 2.5 s before settling. Cost 26, cooldown 3.2 s. */
  S.seedburst = (C, h) => { const H = h, me = H.me, tier = tierOf(C), N = [3, 5, 7][tier], DMG = C.base * C.K * [1.3, 1.0, 0.8][tier], RB = 1.3, ARM = 2.0, BLOW = 0.5, BT = 0.5;
    const [ax, ay] = aimPt(H, C, 9), dbg = { bursts: 0, hits: 0, dropped: 0 };
    // targets: separate monsters (nearest the aim first), then the spare seeds to the biggest of them
    const L = H.living().filter(m => valid(m) && Math.hypot(m.x - me.x, m.y - me.y) < 10).sort((a, b) => Math.hypot(a.x - ax, a.y - ay) - Math.hypot(b.x - ax, b.y - ay)).slice(0, N), big = L.slice().sort((a, b) => (b.boss ? 1e9 : b.maxhp || 0) - (a.boss ? 1e9 : a.maxhp || 0));
    const face = me.face || 1, sx0 = me.x + face * 0.55, sy0 = me.y - 0.05;
    const ss = []; for (let i = 0; i < N; i++) { const m = i < L.length ? L[i] : big.length ? big[(i - L.length) % big.length] : null, b = Math.atan2(ay - me.y, ax - me.x) + (i - (N - 1) / 2) * 0.32;
      ss.push({ i, ph: 'wait', L: BLOW + i * 0.05, tgt: m, x: sx0, y: sy0, z: 1.2, vx: Math.cos(b) * 3, vy: Math.sin(b) * 3, ft: 0, host: null, ox: 0, oy: 0, oz: 0, at: 0, fall: 0, bt: 0, bx: 0, by: 0, rot: Math.random() * TAU, sd: Math.random() * 9, fib: null }); }
    me.sq = 0.75; H.X.sfx.hum && H.X.sfx.hum();
    function attach(s, m, t) { s.ph = 'arm'; s.host = m; s.at = t; const b = Math.random() * TAU, rr = (m.r || 0.4) * 0.45; s.ox = Math.cos(b) * rr; s.oy = Math.sin(b) * rr * 0.5; s.oz = 0.35 + Math.random() * 0.45 * (1 + (m.r || 0.4)); H.X.sfx.note && H.X.sfx.note(880 + s.i * 60, 0.08, 'sine', 0.04, 1200); }
    function settle(s, t) { s.ph = 'arm'; s.host = null; s.at = t; s.oz = 0; }
    function detonate(s, t) { s.ph = 'burst'; s.bt = t; const p = posOf(s); s.bx = p[0]; s.by = p[1]; s.bz = p[2]; dbg.bursts++; dbg.hits += H.hitArea(p[0], p[1], RB, DMG, C.dmgO({ kb: 3 })) || 0;
      s.fib = []; for (let k = 0; k < 8; k++) s.fib.push({ b: Math.random() * TAU, v: 0.6 + Math.random() * 1.4, up: 0.4 + Math.random() * 0.8, r: Math.random() * TAU });
      H.X.shake(2.5, 0.08); H.X.sfx.pop ? H.X.sfx.pop() : H.X.sfx.thud && H.X.sfx.thud(); for (let k = 0; k < H.n(8); k++) { const b = k / 8 * TAU; wisp(H, p[0], p[1] - 0.2, Math.cos(b) * 6, Math.sin(b) * 4, 0.35); } }
    function posOf(s) { if (s.ph === 'arm' || s.ph === 'drop') { if (s.host) return [s.host.x + s.ox, s.host.y + s.oy, s.oz + (s.host.z || 0)]; return [s.x, s.y, s.z]; } return [s.x, s.y, s.z]; }
    const F = H.add({ key: 'seedburst', life: 40, x: me.x, y: me.y, dbg, ss,
      update(dt, f) { const t = f.t; let live = 0;
        for (const s of ss) {
          if (s.ph === 'wait') { if (me.dead) { s.ph = 'done'; continue; } live++; s.x = me.x + face * 0.55; s.y = me.y - 0.05; if (t >= s.L) { s.ph = 'float'; s.x = s.x; } continue; }
          if (s.ph === 'float') { live++; s.ft += dt; let m = s.tgt; if (!valid(m)) { m = s.tgt = H.X.nearestMon ? H.X.nearestMon(s.x, s.y, 6, null, true) : null; if (m && !valid(m)) m = s.tgt = null; }
            const sp = 4.5, wob = Math.sin(t * 5 + s.sd) * 0.8; if (m) { const dx = m.x - s.x, dy = m.y - s.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, dt * 2.8); s.vx = lerp(s.vx, dx / d * sp, k); s.vy = lerp(s.vy, dy / d * sp, k); } else { s.vx *= Math.pow(0.3, dt); s.vy *= Math.pow(0.3, dt); }
            const nx = s.x + (s.vx - s.vy * wob * 0.25) * dt, ny = s.y + (s.vy + s.vx * wob * 0.25) * dt; if (!H.X.blocked(nx, ny, 0.1, 0)) { s.x = nx; s.y = ny; } s.z = lerp(s.z, 0.6, Math.min(1, dt * 1.5)) + Math.sin(t * 4 + s.sd) * 0.004; s.rot = Math.sin(t * 3 + s.sd) * 0.35;
            if (m && Math.hypot(m.x - s.x, m.y - s.y) < (m.r || 0.4) + 0.2) attach(s, m, t); else if (s.ft > 2.5) settle(s, t);
            continue; }
          if (s.ph === 'arm') { live++; if (s.host && !valid(s.host)) { const p = posOf(s); s.x = p[0]; s.y = p[1]; s.z = p[2]; s.host = null; s.ph = 'drop'; dbg.dropped++; }   /* (its monster died: it falls where it was) */
            if (t - s.at >= ARM) detonate(s, t); continue; }
          if (s.ph === 'drop') { live++; s.z = Math.max(0.05, s.z - dt * 2.5); if (t - s.at >= ARM) detonate(s, t); continue; }
          if (s.ph === 'burst') { live++; if (t - s.bt > BT + 0.4) s.ph = 'done'; } }
        if (!live) f.life = 0; },
      drawUnder(c, f, X0, Y0, T) { const G = WDK.bind(H), t = f.t; G.layer(c, () => { for (const s of ss) { if (s.ph !== 'burst') continue; const u = (t - s.bt) / BT; if (u > 1) continue; G.ring(c, H.sx(s.bx), H.sy(s.by), T * RB * eo(u / 0.6), 1 - sm(u), { th: 0.16, col: '#075C40', lite: G.P.mintW, seed: s.sd, dens: 1.7 }); G.ripple(c, H.sx(s.bx), H.sy(s.by), T * RB * (0.4 + 0.8 * eo(u)), 0.5 * (1 - u), { th: 0.05 }); } }); },
      draw(c, f, X0, Y0, T) { const G = WDK.bind(H), t = f.t, P = G.P, blow = t < BLOW + 0.4;
        // the dandelion at the pet's side while it is blown
        const DX = H.sx(me.x + face * 0.55), DY = H.sy(me.y) - T * 0.95, du = cl(t / 0.2) * (1 - cl((t - BLOW - 0.2) / 0.25));
        G.layer(c, () => {
          if (blow && du > 0) G.glow(c, DX, DY, T * 0.9, P.mint, 0.45 * du);
          for (const s of ss) { const p = posOf(s), X = H.sx(p[0]), Y = H.sy(p[1]) - p[2] * T;
            G.shade(c, X, Y - T * 0.15, T * 0.55, T * 0.55, s.ph === 'burst' ? 0 : 0.6, s.sd);   /* (v371: a deep tint behind each seed) */
            if (s.ph === 'float') { G.glow(c, X, Y, T * 0.4, P.jade, 0.4); G.glow(c, X, Y, T * 0.12, P.mintW, 0.7); }
            if (s.ph === 'arm' || s.ph === 'drop') { const u = cl((t - s.at) / ARM), pul = 0.5 + 0.5 * Math.sin(t * (8 + 18 * u));
              G.glow(c, X, Y, T * (0.35 + 0.35 * u), P.jade, 0.35 + 0.4 * u * pul); G.glow(c, X, Y, T * 0.14, P.mintW, 0.6 + 0.4 * u);
              G.ring(c, X, Y, T * (1.0 - 0.6 * eo(u)), 0.35 + 0.65 * u, { k: 0.5, beta: s.sd, th: 0.14, seed: s.sd, col: '#075C40', dens: 1.6 });   /* (a thin ring of wind gathering round it) */
              if (u > 0.7) for (let j = 0; j < 3; j++) G.arc(c, X, Y, T * 0.5, t * 22 + j * 2.09, (u - 0.7) / 0.3, { k: 0.55, mode: 1, span: 1.2, th: 0.38, seed: s.sd + j, col: '#075C40', dens: 1.6 }); }   /* (its filaments opening into tiny spinning blades) */
            if (s.ph === 'burst') { const u = (t - s.bt) / BT; if (u > 1) continue; const Yb = H.sy(s.by) - s.bz * T; G.ring(c, X, Yb, T * RB * 0.9 * eo(u / 0.5), 1 - sm(u), { k: 0.8, beta: s.sd, th: 0.16, col: '#075C40', lite: P.mintW, seed: s.sd, dens: 1.7 }); if (u < 0.25) { G.glow(c, X, Yb, T * 0.8, P.mint, 0.35 * (1 - u / 0.25)); G.star(c, X, Yb, T * 0.8, 0.7 * (1 - u / 0.25)); } } } });
        // the dandelion (a stem and a globe of filaments, shedding its seeds) and the seeds themselves
        if (blow && du > 0) { c.save(); c.globalAlpha = du; c.strokeStyle = '#3E9A62'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(DX - face * T * 0.2, DY + T * 0.55); c.quadraticCurveTo(DX - face * T * 0.05, DY + T * 0.2, DX, DY); c.stroke(); c.restore();
          const left = ss.filter(s => s.ph === 'wait').length; for (let i = 0; i < 12; i++) { if (i >= 5 + left * 1.2) break; const b = i / 12 * TAU + t * 0.5; G.seed(c, DX + Math.cos(b) * T * 0.1, DY + Math.sin(b) * T * 0.1, T * 0.42, du, 1, b + Math.PI / 2); } }
        for (const s of ss) { if (s.ph === 'wait' || s.ph === 'done' || s.ph === 'burst') { if (s.ph === 'burst' && s.fib) { const u = (t - s.bt) / (BT + 0.4), X = H.sx(s.bx), Y = H.sy(s.by) - s.bz * T; c.save(); c.lineCap = 'round'; c.beginPath(); for (const q of s.fib) { const d = q.v * eo(u) * T, x = X + Math.cos(q.b) * d, y = Y + Math.sin(q.b) * d * 0.6 - q.up * T * eo(u) + u * u * T * 0.8, r = q.r + u * 3; c.moveTo(x, y); c.lineTo(x + Math.cos(r) * T * 0.2, y + Math.sin(r) * T * 0.2); } c.strokeStyle = H.rgba('#06402E', 0.6 * (1 - u)); c.lineWidth = Math.max(1.5, T * 0.04); c.stroke(); c.strokeStyle = H.rgba('#F2FFF9', 0.95 * (1 - u)); c.lineWidth = Math.max(1, T * 0.018); c.stroke(); c.restore(); } continue; }
          const p = posOf(s), X = H.sx(p[0]), Y = H.sy(p[1]) - p[2] * T, u = s.ph === 'float' ? 0 : cl((t - s.at) / ARM); G.seed(c, X, Y + T * 0.12, T * 0.58, 1, s.ph === 'float' ? 0.4 : 0.4 + 0.6 * u, s.rot); } } });
    return F; };
})();
