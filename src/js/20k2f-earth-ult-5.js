/* ---------- Earth, reworked: Crystal Coronation ----------
   Enormous crowns of golden mineral crystals erupt round a monster group in a regal, widening formation.
   Crowns: 1 at level 1 (6 spires), 2 at Adept (12), 3 at Celestial (18); levels between hold (1 1 1 2 2 2 3).
   A six-pointed pattern of amber fissures traces across the area (0.6 s, light only), pebbles trembling along its lines;
   then the first crown's six spires drive upward in a circle, their points leaning outward like a heavy mineral blossom.
   Each further crown follows 0.25 s later, wider and taller (a stepped mineral palace at Celestial). Each crown sends a
   ground shockfront from the centre to its ring: ONE Earth hit per enemy in that crown's footprint, dealt when the drawn
   front reaches it (the six spires are one pulse, never six). The formation holds while a golden highlight climbs each
   spire, crystal dust floats up and chips fall round the roots; then the inner glow dims and the spires retract into
   their fissures with dust and chips (cosmetic).
   Damage (DK = base x K x evoK), a monster in the inner area the whole time: 13 / 13.7 / 14.3 / 15 (Adept) / 16.3 /
   17.7 / 19 (Celestial) DK, split over the crowns (1 crown: all; 2: 42 % / 58 %; 3: 25 % / 33 % / 42 %), each crown
   stronger than the last; footprints 1.9 / 2.85 / 3.8 x K tiles.
   The spires are ray-cast 3D crystals from the shared kit (EARTHC, 20k2e): a hexagonal prism tapering to an irregular
   pyramid point, tilted outward per spire, cut by the floor; a dark faceted stone root with a gold seam where the crystal
   grows out of it, honey inner planes (the back facets showing through), thickness-driven inner glow, pale gold bevelled
   edges, a hard specular and a soft ink edge. Each is rendered once per size and level into cached sprites (body + an
   emissive layer). The back half of each crown is drawn under the monsters, the front half over them; spires in front
   of the pet dim smoothly. Floor marks are light only; every edge feathered. */
(() => {
  const U = ELEM_IMPL.earth.ult; delete U.kingdom;
  const E = EARTHC, TAU = Math.PI * 2, { cl, lerp, sm, sstep, R1 } = E;
  const AMBER = '#D98A1E', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8', CORE = '#FFF4D6';
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const RK = [1.9, 2.85, 3.8], HTK = [1.7, 2.25, 2.8], RBK = [0.36, 0.42, 0.48];
  // the spires (cached per size and crown count): twelve, one every 30 degrees round the ring (each leaning outward
  // there), rendered at the largest crown's size; crowns 0 and 2 use the even ones, crown 1 the odd ones, drawn scaled
  const SETS = {};
  function spireSet(Spx, ev, ncr) { const key = Spx + ':' + ev + ':' + ncr; if (SETS[key]) return SETS[key]; const S = { sp: [], its: [], ready: [false, false] }, sz = 1 + 0.025 * (ev - 1), HT = HTK[ncr - 1] * sz, r = RBK[ncr - 1] * sz;
    for (let j = 0; j < 12; j++) { const az = j / 12 * TAU, ht = HT * (0.9 + 0.2 * R1(j * 3.3 + ev));
      // the spire: a long faceted point from a dark stone root; side crystals off its foot; rock lumps round it
      const parts = [{ md: E.crystalModel(700 + j * 7 + ev, { r, taper: 0.62, hs: ht * 0.5, ht, rootH: ht * 0.11, sides: 6 }), M: E.rotAxis([0, 0, 1], R1(j * 2.7) * TAU), mat: 'crystal' }];
      for (let i = 0; i < 1 + j % 2 + (ev >= 7 ? 1 : 0); i++) { const a = (i - 0.5) * 2.1 + R1(j * 5 + i * 3) * 0.8, h2 = ht * (0.32 + 0.16 * R1(j * 7 + i)); parts.push({ md: E.crystalModel(760 + j * 5 + i, { r: r * 0.55, taper: 0.62, hs: h2 * 0.52, ht: h2, rootH: h2 * 0.12, sides: 6 }), M: E.mmul(E.rotAxis([0, 0, 1], a), E.rotAxis([0, 1, 0], 0.5 + 0.2 * R1(i + j))), off: [Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75, 0], mat: 'crystal' }); }
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + R1(j + i * 2) * 1.2; parts.push({ md: E.rockModel(800 + j * 3 + i, 0, true), M: E.rotAxis([R1(i) - 0.5, 0.5, R1(j) - 0.2], i + j), off: [Math.cos(a) * r, Math.sin(a) * r, 0], sc: r * (0.55 + 0.25 * R1(j * 3 + i)), mat: 'stone' }); }
      const M = E.mmul(E.rotAxis([0, 0, 1], az), E.rotAxis([0, 1, 0], 0.32 + (R1(j * 5.1) - 0.5) * 0.08)), res = { az }; S.sp.push(res); S.its.push({ j, it: E.clusterGen(parts, M, Spx, res) }); }
    // build the spires of parity p (crowns 0 and 2: even; crown 1: odd) within ms (all of them when ms is null)
    S.build = (p, ms) => { if (S.ready[p]) return true; const t0 = performance.now(); for (const q of S.its) { if (q.done || q.j % 2 !== p) continue; const left = ms == null ? null : ms - (performance.now() - t0); if (left != null && left <= 0) break; if (E.runGen(q.it, left)) q.done = true; else break; }
      S.ready[p] = S.its.every(q => q.done || q.j % 2 !== p); return S.ready[p]; };
    return (SETS[key] = S); }
  // the six-pointed fissure pattern, jittered polylines in floor units (x, y before the floor squash)
  function hexagram(R, seed) { const L = [], pt = i => [Math.cos(i / 6 * TAU) * R, Math.sin(i / 6 * TAU) * R];
    const jag = (a, b, n, amp, s) => { const out = [a]; for (let j = 1; j < n; j++) { const u = j / n, nx = -(b[1] - a[1]), ny = b[0] - a[0], d = Math.hypot(nx, ny) || 1, o = (R1(s + j * 1.7) - 0.5) * amp * Math.sin(u * Math.PI); out.push([lerp(a[0], b[0], u) + nx / d * o, lerp(a[1], b[1], u) + ny / d * o]); } out.push(b); return out; };
    for (let i = 0; i < 6; i++) L.push({ p: jag(pt(i), pt(i + 2), 9, R * 0.09, seed + i * 11), d0: 0.15 + 0.05 * (i % 2) });   // the two triangles
    for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * TAU, r0 = R * 0.12, r1 = R * 0.52; L.push({ p: jag([Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r1, Math.sin(a) * r1], 5, R * 0.06, seed + 70 + i), d0: 0 }); }   // spokes from the centre
    for (const l of L) { let s = 0; l.c = [0]; for (let j = 1; j < l.p.length; j++) { s += Math.hypot(l.p[j][0] - l.p[j - 1][0], l.p[j][1] - l.p[j - 1][1]); l.c.push(s); } l.len = s; }
    return L; }

  U.coronation = (C, H) => {
    const me = H.me, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, K = C.K, evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    const NCR = CEL ? 3 : ADE ? 2 : 1, TOT = [13, 13.7, 14.3, 15, 16.3, 17.7, 19][ev - 1] * DK, WGT = NCR === 1 ? [1] : NCR === 2 ? [0.42, 0.58] : [0.25, 0.33, 0.42];
    const TR = 0.6, GAP = 0.25, GROW = 0.24, ER = k => TR + k * GAP, LAST = ER(NCR - 1), HOLD = LAST + GROW + 1.15, RET = 0.6, LIFE = HOLD + RET + 0.35;
    // the centre: the aimed monster's group (the centroid of the monsters close to it)
    let cx = C.tx, cy = C.ty; { const g = H.near(cx, cy, 2.4); if (g.length > 1) { cx = g.reduce((a, m) => a + m.x, 0) / g.length; cy = g.reduce((a, m) => a + m.y, 0) / g.length; } const p = H.walk(cx, cy); cx = p.x; cy = p.y; }
    const crowns = []; for (let k = 0; k < NCR; k++) crowns.push({ k, R: RK[k] * K, dmg: TOT * WGT[k], hit: new Set(), done: false, fired: false });
    const RMAX = crowns[NCR - 1].R, star = hexagram(RMAX * 1.02, 17 + ev);
    const pebbles = [], chipsL = [], puffs = [], motes = [], log = []; let S = null, chipS = null, dead = false;
    H.X.banner('CRYSTAL CORONATION', '', GOLD, 1.4); H.X.sfx.hum();
    for (let i = 0; i < H.n(10 + 3 * ev); i++) { const l = star[i % star.length], j = 1 + Math.floor(R1(i * 3.1) * (l.p.length - 2)), q = l.p[j]; pebbles.push({ x: cx + q[0], y: cy + q[1] * E.GY, z: 0.03, ph: R1(i) * TAU, s: 0.09 + 0.07 * R1(i * 2.3), v: i % 6, t0: TR * (0.2 + 0.7 * l.c[j] / l.len) }); }
    // where spire i of crown k stands (world)
    const base = (k, i) => { const az = (i + k * 0.5) / 6 * TAU, R = crowns[k].R; return [cx + Math.cos(az) * R, cy + Math.sin(az) * R * E.GY, az]; };
    function erupt(cr, t) {
      cr.fired = true; H.X.sfx.crash(); H.X.shake(7 + cr.k * 3 + ev * 0.5, 0.25); H.X.hitstop(0.04 + 0.015 * cr.k); H.X.light(cx, cy, cr.R * 1.3, 0.5); if (cr.k === NCR - 1) H.X.flash(0.1, PALE);
      for (let i = 0; i < 6; i++) { const [x, y] = base(cr.k, i);
        for (let j = 0; j < H.n(2); j++) { const b = Math.random() * TAU, v = 1.5 + Math.random() * 2.5; chipsL.push({ x: x + Math.cos(b) * 0.2, y: y + Math.sin(b) * 0.12, z: 0.2, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6, vz: 3.5 + Math.random() * 3, s: 0.07 + Math.random() * 0.06 + 0.015 * cr.k, v: j % 6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, t: 0, life: 1.0 + Math.random() * 0.4 }); }
        for (let j = 0; j < H.n(3); j++) { const b = Math.random() * TAU, v = 0.8 + Math.random() * 1.2; puffs.push({ x, y, z: 0.1, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5, vz: 0.35, t: -Math.random() * 0.06, life: 0.9 + Math.random() * 0.5, s: 0.45 + 0.12 * cr.k + Math.random() * 0.25 }); } }
      if (cr.k === 0) { for (const p of pebbles) chipsL.push({ x: p.x, y: p.y, z: p.z, vx: (p.x - cx) * 0.8, vy: (p.y - cy) * 0.8, vz: 2.5 + Math.random() * 2, s: p.s, v: p.v, rot: p.ph, vr: (Math.random() - 0.5) * 8, t: 0, life: 0.9 + Math.random() * 0.3 }); pebbles.length = 0; }
      H.burst(cx, cy, 'spark', 8 + 3 * cr.k, { v: 6, up: 2, g: 5, life: 0.4, size: 1.8, color: [GOLD, HONEY, PALE] }); }
    const F = H.add({ life: LIFE, x: cx, y: cy, key: 'coronation', log, NCR,
      update(dt, f) {
        const t = f.t;
        if (me.dead && !dead) { dead = true; f.life = Math.min(f.life, 0.6); }
        // the crowns: each erupts on time; its shockfront hits each enemy in its footprint once, as the front reaches it
        for (const cr of crowns) { if (dead || cr.done) continue; const e = ER(cr.k); if (t < e) continue; if (!cr.fired) erupt(cr, t);
          const fr = cr.R * H.ease.out(cl((t - e) / 0.2)); let n = 0;
          for (const m of H.living()) { if (cr.hit.has(m)) continue; if (Math.hypot(m.x - cx, m.y - cy) - m.r < fr) { cr.hit.add(m); H.X.hitMon(m, cr.dmg, C.dmgO({ kb: 2 + cr.k, stun: 0.25 })); n++; } }
          if (n) log.push({ t, kind: 'crown', k: cr.k, n });
          if (t >= e + 0.2) cr.done = true; }
        for (const p of pebbles) { const u = sm((t - p.t0) / 0.25); p.z = 0.03 + u * (0.04 + 0.05 * Math.abs(Math.sin(t * 31 + p.ph))); p.jx = u * Math.sin(t * 43 + p.ph) * 0.03; }
        // crystal dust floats up from the formation while it holds
        if (t > ER(0) + 0.2 && t < HOLD + 0.2 && Math.random() < dt * (14 + 6 * NCR) * H.Q()) { const k = Math.floor(Math.random() * NCR), i = Math.floor(Math.random() * 6), [x, y] = base(k, i), h = HTK[k] * Math.random() * 0.9; motes.push({ x: x + (Math.random() - 0.5) * 0.4, y: y, z: h, vx: (Math.random() - 0.5) * 0.3, vz: 0.4 + Math.random() * 0.6, t: 0, life: 1.0 + Math.random() * 0.8, s: 0.05 + Math.random() * 0.06 }); }
        // heavier chips falling round the roots
        if (t > ER(0) + 0.3 && t < HOLD && Math.random() < dt * 1.6 * NCR * H.Q()) { const k = Math.floor(Math.random() * NCR), [x, y] = base(k, Math.floor(Math.random() * 6)); chipsL.push({ x: x + (Math.random() - 0.5) * 0.4, y: y + 0.05, z: HTK[k] * (0.2 + 0.3 * Math.random()), vx: (Math.random() - 0.5) * 0.8, vy: 0, vz: 0, s: 0.05 + Math.random() * 0.05, v: Math.floor(Math.random() * 6), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 6, t: 0, life: 0.9 }); }
        // the retreat: dust and chips at the roots
        if (t > HOLD && t < HOLD + RET * 0.8 && Math.random() < dt * 30 * H.Q()) { const k = Math.floor(Math.random() * NCR), [x, y] = base(k, Math.floor(Math.random() * 6)), b = Math.random() * TAU; puffs.push({ x, y, z: 0.1, vx: Math.cos(b) * 0.8, vy: Math.sin(b) * 0.4, vz: 0.3, t: 0, life: 0.8, s: 0.35 + 0.1 * k }); if (Math.random() < 0.5) chipsL.push({ x, y, z: 0.2, vx: Math.cos(b) * 1.5, vy: Math.sin(b), vz: 2 + Math.random() * 2, s: 0.08 + Math.random() * 0.07, v: Math.floor(Math.random() * 6), rot: 0, vr: 6, t: 0, life: 0.7 }); }
        for (let i = chipsL.length - 1; i >= 0; i--) { const q = chipsL[i]; q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= 15 * dt; q.rot += q.vr * dt; if (q.z < 0.03) { q.z = 0.03; if (q.vz < -1.5) { q.vz = -q.vz * 0.3; q.vx *= 0.5; q.vy *= 0.5; } else { q.vz = 0; q.vx *= Math.exp(-dt * 8); q.vy *= Math.exp(-dt * 8); q.vr *= Math.exp(-dt * 8); } } if (q.t >= q.life) chipsL.splice(i, 1); }
        for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.t += dt; if (p.t < 0) continue; const d = Math.exp(-2 * dt); p.vx *= d; p.vy *= d; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.t >= p.life) puffs.splice(i, 1); }
        for (let i = motes.length - 1; i >= 0; i--) { const p = motes[i]; p.t += dt; p.x += p.vx * dt; p.z += p.vz * dt; if (p.t >= p.life) motes.splice(i, 1); }
      },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, out = cl(f.life / 0.5), gone = 1 - sstep(HOLD, HOLD + RET, t);
        prep(c, T, t);
        // the fissures: the six-pointed pattern traced over the area, then held, dimming as the spires retract (light only)
        { const tr = cl(t / TR), a = sstep(0, 0.08, t) * (0.55 + 0.45 * gone) * out * (1 - sstep(HOLD + RET * 0.5, LIFE - 0.3, t)), pulse = t > ER(0) ? Math.exp(-(t - ER(0)) * 3) : 0;
          if (a > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
            for (const [lw, col, al] of [[T * 0.32, 'rgba(217,138,30,1)', 0.07], [T * 0.15, 'rgba(217,138,30,1)', 0.2], [T * 0.07, 'rgba(242,183,58,1)', 0.55], [T * 0.028, 'rgba(255,240,205,1)', 0.85]]) { c.strokeStyle = col; c.lineWidth = lw; c.globalAlpha = Math.min(1, al * a * (1 + pulse));
              for (const l of star) { const u = cl((tr - l.d0) / (1 - l.d0)); if (u <= 0) continue; const L = l.len * u; c.beginPath(); c.moveTo(X + l.p[0][0] * T, Y + l.p[0][1] * T * E.GY);
                for (let j = 1; j < l.p.length; j++) { if (l.c[j] <= L) c.lineTo(X + l.p[j][0] * T, Y + l.p[j][1] * T * E.GY); else { const e = (L - l.c[j - 1]) / (l.c[j] - l.c[j - 1]); c.lineTo(X + lerp(l.p[j - 1][0], l.p[j][0], e) * T, Y + lerp(l.p[j - 1][1], l.p[j][1], e) * T * E.GY); break; } } c.stroke(); } }
            c.restore();
            // the tracing heads glow
            if (tr < 1) for (const l of star) { const u = cl((tr - l.d0) / (1 - l.d0)); if (u <= 0 || u >= 1) continue; const L = l.len * u; let j = 1; while (j < l.p.length - 1 && l.c[j] < L) j++; const e = (L - l.c[j - 1]) / (l.c[j] - l.c[j - 1]), hx = lerp(l.p[j - 1][0], l.p[j][0], e), hy = lerp(l.p[j - 1][1], l.p[j][1], e); E.glowAt(c, X + hx * T, Y + hy * T * E.GY, T * 0.45, HONEY, 0.6 * a); } }
          // a soft field of light over the area while it builds
          E.floorSpr(c, glowSprite(AMBER), X, Y, RMAX * T * 1.05, (0.1 * sm(tr) + 0.15 * pulse) * gone * out, true); }
        // the crowns' shockfronts: a light band and a dust band racing from the centre to the ring; light pools at the roots
        for (const cr of crowns) { const p = t - ER(cr.k); if (p < 0) continue; const RR = cr.R * T, q = cl(p / 0.2), q2 = cl(p / 0.55);
          if (q2 < 1) { E.floorSpr(c, E.dustBand(), X, Y, RR * (0.2 + 1.0 * H.ease.out(q2)), (1 - q2) * sstep(0, 0.1, q2) * 0.75 * out); E.floorSpr(c, E.amberBand(), X, Y, RR * (0.12 + 0.95 * H.ease.out(q)) + 2, (1 - q2) * 0.95 * out, true); }
          const g = Math.exp(-p * 3) * 0.6 + 0.16 * gone; for (let i = 0; i < 6; i++) { const [x, y] = base(cr.k, i); E.floorSpr(c, glowSprite(AMBER), H.sx(x), H.sy(y), T * (0.8 + 0.25 * cr.k), g * out, true); } }
        // the back half of each crown stands behind the monsters
        spires(c, T, t, false, out);
      },
      draw(c, f, X, Y, T) {
        const t = f.t, out = cl(f.life / 0.5);
        spires(c, T, t, true, out);
        // pebbles and chips, dust, crystal dust
        const cs = chipS; if (cs) { for (const p of pebbles) { if (t < p.t0) continue; const r2 = cs[p.v], s = p.s * T / r2.S, sx = H.sx(p.x + (p.jx || 0)), sy = H.sy(p.y) - p.z * T; c.save(); c.globalAlpha = out * sstep(0, 0.15, t - p.t0); c.translate(sx, sy); c.rotate(p.ph); c.drawImage(r2.body, -r2.cx * s, -r2.cy * s, r2.W * s, r2.H * s); c.restore(); }
          for (const q of chipsL) { const r2 = cs[q.v], s = q.s * T / r2.S, sx = H.sx(q.x), sy = H.sy(q.y) - q.z * T; c.save(); c.globalAlpha = out * (1 - sstep(q.life - 0.3, q.life, q.t)); c.translate(sx, sy); c.rotate(q.rot); c.drawImage(r2.body, -r2.cx * s, -r2.cy * s, r2.W * s, r2.H * s); c.restore(); } }
        { const sp = E.puff(), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45; c.save(); for (const p of puffs) { if (p.t < 0) continue; const q = p.t / p.life, sx = H.sx(p.x), sy = H.sy(p.y) - p.z * T, r = T * p.s * (0.6 + 0.9 * q); c.globalAlpha = Math.sin(Math.min(1, q * 4) * Math.PI / 2) * (1 - q) * 0.7 * out * (0.4 + 0.6 * sstep(0.3 * T, T, Math.hypot(sx - PX, sy - PY))); c.drawImage(sp, sx - r, sy - r * 0.8, r * 2, r * 1.6); } c.restore(); }
        { const mo = E.mote(); c.save(); c.globalCompositeOperation = 'lighter'; for (const p of motes) { const q = p.t / p.life, r = T * p.s * (1 + q), tw = 0.6 + 0.4 * Math.sin(p.t * 17 + p.s * 99); c.globalAlpha = Math.sin(q * Math.PI) * tw * out; c.drawImage(mo, H.sx(p.x) - r, H.sy(p.y) - p.z * T - r, r * 2, r * 2); } c.restore(); }
      } });
    // the cached sprites at this screen's size, and their building (spread over the trace)
    let lastT = -1;
    function prep(c, T, t) { if (t === lastT) return; lastT = t; const k = E.scr(c).k, want = Math.max(16, Math.min(150, Math.round(T * k / 8) * 8)); if (!S || S.px !== want) { S = spireSet(want, ev, NCR); S.px = want; } if (!chipS) chipS = E.chips(Math.round(T * k * 0.35));
      const t0 = performance.now(); for (let j = 0; j < Math.min(2, NCR); j++) { if (S.ready[j]) continue; if (t >= ER(j) - 0.02) S.build(j, null); else { S.build(j, 8 - (performance.now() - t0)); break; } } }
    // the spires: grow (a heavy drive upward with a little overshoot), hold with the climbing highlight, retract
    function spires(c, T, t, front, out) { if (!S) return; const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45, list = [], mons = front ? H.living() : [];
      for (const cr of crowns) { const e = ER(cr.k); if (t < e || !S.ready[cr.k % 2]) continue; for (let i = 0; i < 6; i++) { const [x, y, az] = base(cr.k, i); if ((Math.sin(az) >= 0) !== front) continue; list.push({ cr, i, x, y, az, d: e + i * 0.018 }); } }
      list.sort((p, q) => p.y - q.y);
      for (const s of list) { const res = S.sp[(2 * s.i + s.cr.k) % 12], p = t - s.d, kz = HTK[s.cr.k] / HTK[NCR - 1]; if (p < 0) continue;
        const gu = cl(p / GROW), grow = gu < 1 ? 1 - Math.pow(1 - gu, 3) + Math.sin(gu * Math.PI) * 0.08 : 1, ret = sstep(HOLD + s.cr.k * 0.06, HOLD + RET + s.cr.k * 0.06, t), sy2 = Math.max(0.001, grow * (1 - ret)), sx2 = 0.75 + 0.25 * Math.min(1, gu * 2) - 0.1 * ret;
        const bx = H.sx(s.x), by = H.sy(s.y), k = T / res.S * kz, w = res.W * k, h = res.H * k, x0 = bx - res.cx * k * sx2, y0 = by - res.cy * k * sy2, ww = w * sx2, hh = h * sy2;
        // a spire in front of the pet dims smoothly
        let A = out * sstep(0, 0.04, p); if (front) { const inX = Math.abs(PX - (x0 + ww / 2)) / (ww / 2 + T * 0.3), inY = PY < by && PY > y0 - T * 0.2 ? 1 : 0; A *= 1 - 0.55 * inY * (1 - sstep(0.6, 1.0, inX));
          // and over a monster standing behind it (the gaps keep the enemies readable)
          let mk = 0; for (const m of mons) { const mx = H.sx(m.x), my = H.sy(m.y) - T * 0.4; if (my < by && my > y0 && Math.abs(mx - (x0 + ww / 2)) < ww * 0.35 + T * 0.25) mk = Math.max(mk, 1 - sstep(0.2, 0.45, Math.abs(mx - (x0 + ww / 2)) / ww)); } A *= 1 - 0.4 * mk; }
        c.save(); c.globalAlpha = A; c.drawImage(res.body, x0, y0, ww, hh); c.restore();
        const flash = Math.exp(-p * 5), base2 = 0.32 + 0.1 * Math.sin(t * 3 + s.i), dim = 1 - 0.75 * sstep(HOLD - 0.2, HOLD + 0.3, t), gl = (base2 * dim + flash * 1.1) * A;
        E.addLayer(c, res.glow, x0, y0, ww, hh, gl);
        // the golden highlight climbing the spire (the glow layer drawn in soft horizontal slices round a moving band)
        const hc = (t - (LAST + 0.35 + s.cr.k * 0.12 + s.i * 0.03)) / 0.8; if (hc > -0.1 && hc < 1.2) { const NS = 14, bandY = 1 - hc; c.save(); c.globalCompositeOperation = 'lighter';
          for (let j = 0; j < NS; j++) { const v0 = j / NS, v1 = (j + 1) / NS, a = Math.exp(-Math.pow(((v0 + v1) / 2 - bandY) / 0.12, 2)) * 1.3 * A * dim; if (a < 0.02) continue; c.globalAlpha = Math.min(1, a); c.drawImage(res.glow, 0, v0 * res.H, res.W, (v1 - v0) * res.H, x0, y0 + v0 * hh, ww, (v1 - v0) * hh); }
          c.restore(); }
        if (flash > 0.05) E.glowAt(c, bx, by - hh * 0.3, T * (0.6 + 0.2 * s.cr.k), HONEY, flash * 0.5 * A); } }
    return F;
  };
})();
