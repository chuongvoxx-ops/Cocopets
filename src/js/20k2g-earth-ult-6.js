/* ---------- Earth, reworked: Rock Steady ----------
   A golden circle opens on the floor round the pet and thick stone slabs lift out of it, lying flat, shedding dust from
   their undersides, then turn on edge and settle into a slow, heavy orbit: two slightly tilted paths (Adept: a second,
   farther depth layer of smaller stones turning the other way; Celestial: twelve rocks in three interlocking bands, large
   slabs outside, smaller stones inside). Each slab is a real cel-shaded 3D solid drawn through GeoKit: an irregular
   beveled polygon pushed into a thick slab, dark rough stone on its broad faces, warm mineral bevels, worn-stone texture
   turned with each face, dark recessed fractures and a faint golden seam that runs right round it (both cut through the
   model where a plane meets its faces, so they wrap the solid as it turns), ink outline, warm light from below. Thin amber
   strands join rocks of different bands briefly as they pass. Rocks behind the pet draw under it; the ones in front dim
   smoothly where they cross it, and the paths keep wide gaps, so the pet stays in view.
   The protection (for 15 s, 20 at Adept, 25 at Celestial, evenly between): every hit on the pet (contact, shots, zones,
   boss attacks: all of them go through hurtPet in 20b-game-dungeon.js; this adds a ward with X.addWard, alongside Love
   Sanctuary's X.setWard) is HALVED: the pet takes (1 - ABSORB) of the damage after its own mitigation, the prevented share
   is A = ABSORB x d, through the gaps between the rocks too; no finite pool, no break. For every such hit, at once, every
   monster within 3 / 3.75 / 4.5 x K tiles (evenly between) takes an Earth hit of RET_K x A = 10 x A (not divided between
   them), through hitMon's normal mitigation. Those hits carry `reflected: true`: a ward that sees a packet so tagged still
   halves it but never reflects it again (no loop; in this game monsters do not reflect damage at all, so the tag only
   guards against a future reflector). No damage to the party (the only party member on the field is the pet itself).
   The look of a hit: the rock nearest the attacker turns toward it and steps out a little to meet it, a tight golden flash
   runs through its fissures and then round the whole orbit; a low golden pressure ring runs out from the pet to the edge
   of the reach, short amber fissures light under each monster struck and mineral chips spray up from them (aggregated in
   dense attacks; every damage event still lands). At the end the strands go out, the rocks lie back flat and sink into the
   floor in small dust puffs, and the ring fades: no stored-damage burst, nothing left running. Floor marks are light only
   and fade. No per-frame gradients, no shadowBlur: soft pieces are cached sprites, the rocks GeoKit solids. */
(() => {
  const U = ELEM_IMPL.earth.ult; delete U.saturn;
  const TAU = Math.PI * 2;
  const DEEP = '#2A2118', CHAR = '#3A3028', UMBER = '#5C4126', EARTH = '#7A5218', AMBER = '#D98A1E', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8', EMBER = '#FFF4D6', INK = '#120A05';
  /* the rules (the numbers the user set; ABSORB is the identity line's "halve every incoming attack's damage") */
  const ABSORB = 0.5;   // the share of each hit (after the pet's own mitigation) that Rock Steady prevents
  const RET_K = 10;     // each prevented amount A strikes back as RET_K x A on every monster in reach
  const PARTY_DMG = false;   // (the friendly-fire switch the spec asks for: the party is never struck; kept for clarity)
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const wrapA = d => { d = (d + Math.PI) % TAU; if (d < 0) d += TAU; return d - Math.PI; };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const G = () => GeoKit;
  let H;

  /* ---- cached sprites (every edge soft) ---- */
  const radial = (key, S, stops) => fxSprite(key, S, S, g => { const h = S / 2, gr = g.createRadialGradient(h, h, 0, h, h, h); stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, S, S); });
  // the ground circle: a golden band (its radius at 0.88 of the sprite's half size), feathered both ways
  const ringSpr = () => radial('rs4ring', 256, [[0, 'rgba(217,138,30,0)'], [0.6, 'rgba(217,138,30,0)'], [0.76, 'rgba(217,138,30,0.14)'], [0.85, 'rgba(242,183,58,0.6)'], [0.88, 'rgba(255,233,184,0.95)'], [0.91, 'rgba(242,183,58,0.55)'], [0.96, 'rgba(217,138,30,0.12)'], [1, 'rgba(217,138,30,0)']]);
  // warm floor light (under the ring, under each rock, under each monster struck)
  const poolSpr = () => radial('rs4pool', 128, [[0, 'rgba(255,207,92,0.55)'], [0.35, 'rgba(242,183,58,0.3)'], [0.7, 'rgba(217,138,30,0.1)'], [1, 'rgba(217,138,30,0)']]);
  // the pressure pulse: a band at 0.92 of the half size, a faint wake inside it
  const pulseSpr = () => radial('rs4pulse', 256, [[0, 'rgba(217,138,30,0)'], [0.5, 'rgba(217,138,30,0.04)'], [0.78, 'rgba(217,138,30,0.18)'], [0.88, 'rgba(242,183,58,0.55)'], [0.92, 'rgba(255,233,184,0.95)'], [0.95, 'rgba(242,183,58,0.4)'], [1, 'rgba(217,138,30,0)']]);
  function blit(c, img, x, y, w, h, a, add) { if (!(a > 0.01) || !(w > 0.5) || !(h > 0.5)) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - w / 2, y - h / 2, w, h); c.restore(); }
  const glow = (c, x, y, r, col, a) => blit(c, glowSprite(col), x, y, r * 2, r * 2, a, true);

  /* ---- the slab: an irregular convex polygon (long along x) pushed through a thickness, every rim beveled ---- */
  function slabMesh(seed, n) {
    const g = G(), R = mulberry32(seed), poly = [];
    for (let i = 0; i < n; i++) { const a = (i + (R() - 0.5) * 0.55) / n * TAU, r = 0.74 + R() * 0.36; poly.push([Math.cos(a) * r * 1.3, Math.sin(a) * r * 0.92]); }
    const th = 0.62 + R() * 0.18, b = 0.17, slope = (R() - 0.5) * 0.14, ks = poly.map(() => 0.7 + R() * 0.17), v = [];
    poly.forEach(([x, y], i) => v.push([x * ks[i], y * ks[i], th / 2 + slope * x + (R() - 0.5) * 0.05]));                                        // top (inset)
    for (const [x, y] of poly) v.push([x, y, th / 2 - b + (R() - 0.5) * 0.06 + slope * x]);                         // upper rim
    for (const [x, y] of poly) v.push([x, y, -th / 2 + b + (R() - 0.5) * 0.06]);                                    // lower rim
    poly.forEach(([x, y], i) => v.push([x * (1.55 - ks[i]), y * (1.55 - ks[i]), -th / 2]));                                                     // bottom (inset)
    const f = [poly.map((_, i) => i)], mat = [0];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([i, j, n + j, n + i]); mat.push(1); f.push([n + i, n + j, 2 * n + j, 2 * n + i]); mat.push(0); f.push([2 * n + i, 2 * n + j, 3 * n + j, 3 * n + i]); mat.push(1); }
    f.push(poly.map((_, i) => 3 * n + i)); mat.push(0);
    const M = g.mesh(v, f); M.mat = mat;
    // fissures: where a plane cuts the faces (so a line wraps the solid); jagged within each face's own plane
    const cut = (nrm, d0, keep, jag) => { const out = [];
      M.f.forEach((F, fi) => { const pts = []; for (let k2 = 0; k2 < F.length; k2++) { const a = M.v[F[k2]], c2 = M.v[F[(k2 + 1) % F.length]], da = g.dot(nrm, a) - d0, db = g.dot(nrm, c2) - d0; if ((da < 0) !== (db < 0)) pts.push(g.lerp3(a, c2, da / (da - db))); }
        if (pts.length < 2) return; const p0 = pts[0], p1 = pts[1], fc = g.mul(F.reduce((s, i) => g.add(s, M.v[i]), [0, 0, 0]), 1 / F.length); if (keep && !keep(fc)) return;
        const fn = g.norm(g.cross(g.sub(M.v[F[1]], M.v[F[0]]), g.sub(M.v[F[2]], M.v[F[0]]))), dir = g.sub(p1, p0), L = g.len(dir), perp = g.norm(g.cross(fn, dir)), P = [p0];
        for (let j = 1; j < 4; j++) P.push(g.add(g.lerp3(p0, p1, j / 4), g.mul(perp, (R() - 0.5) * jag * Math.min(1, L)))); P.push(p1); out.push({ fi, P }); });
      return out; };
    const seam = cut(g.norm([1, (R() - 0.5) * 0.9, (R() - 0.5) * 0.7]), (R() - 0.5) * 0.35, null, 0.16);
    const frac = []; for (let q = 0; q < 2; q++) { const c0 = [(R() - 0.5) * 1.6, (R() - 0.5) * 0.9, (R() < 0.5 ? 1 : -1) * th / 2], nn = g.norm([(R() - 0.5), 1, (R() - 0.5) * 0.6]);
      frac.push(...cut(nn, g.dot(nn, c0) + (R() - 0.5) * 0.2, fc => g.len(g.sub(fc, c0)) < 0.95, 0.22)); }
    return { M, seam, frac };
  }
  const MATS = [
    { c: ['#17110C', '#2E241B', '#4F4133'], tex: 'stone', texA: 0.85, texS: 0.8, under: AMBER, backA: 0.6 },                  // broad faces: dark rough stone
    { c: ['#2A1C10', '#4E3820', '#8C6638'], tex: 'stone', texA: 0.65, texS: 0.8, under: AMBER, gloss: 0.25, glint: PALE, glintA: 0.7, backA: 0.6 },   // bevels: warm mineral
  ];
  // the camera: GeoKit's solids in the pet's own space (tiles; x right, y toward the viewer, z up), the floor squashed as
  // the elements draw it (H.GY) so the orbit sits on the ground circle
  const camAt = (X, Y, T) => { const GY = H ? H.GY : 0.55, CE = G().CE, SE = G().SE; return { X, Y, T, P: p => [X + p[0] * T, Y + (p[1] * GY - p[2] * CE) * T], dep: p => p[1] * CE + p[2] * SE }; };

  /* ================= Rock Steady ================= */
  U.rocksteady = (C, h) => {
    H = h; const g = G(), me = H.me, X0 = H.X, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, CE = g.CE;
    const DUR = 15 + (ev - 1) * 10 / 6, OUT = 1.35, FORM = 1.2;              // 15 s / 20 s at Adept / 25 s at Celestial
    const RR = (3 + (ev - 1) * 0.25) * C.K;                                  // the retaliation reach: 3 / 3.75 / 4.5 x K
    const NR = [6, 6, 7, 8, 9, 10, 12][ev - 1], seed = Math.floor(Math.random() * 1e4);
    // the orbits: { r radius, zc height, tilt about a floor axis at tAz, w turn rate, s rock size (tiles per model unit) }
    const BANDS = tier === 1 ? [{ r: 1.5, zc: 0.6, tilt: 0.21, tAz: 0.6, w: 0.5, s: 0.36 }, { r: 1.62, zc: 0.68, tilt: 0.21, tAz: 0.6 + Math.PI, w: 0.5, s: 0.34 }]
      : tier === 2 ? [{ r: 1.52, zc: 0.6, tilt: 0.22, tAz: 0.6, w: 0.48, s: 0.37 }, { r: 1.66, zc: 0.68, tilt: 0.22, tAz: 0.6 + Math.PI, w: 0.48, s: 0.35 }, { r: 2.3, zc: 1.05, tilt: 0.16, tAz: 2.2, w: -0.36, s: 0.24 }]
      : [{ r: 1.9, zc: 0.7, tilt: 0.36, tAz: 0.3, w: 0.42, s: 0.39 }, { r: 1.58, zc: 0.66, tilt: 0.36, tAz: 0.3 + TAU / 3, w: -0.5, s: 0.3 }, { r: 1.28, zc: 0.74, tilt: 0.36, tAz: 0.3 + 2 * TAU / 3, w: 0.6, s: 0.21 }];
    const NB = BANDS.length, per = BANDS.map(() => 0);
    if (tier === 2) { per[2] = NR >= 10 ? 3 : 2; per[0] = Math.ceil((NR - per[2]) / 2); per[1] = NR - per[2] - per[0]; } else for (let i = 0; i < NR; i++) per[i % NB]++;
    BANDS.forEach(b => { b.Rb = g.axisR([Math.cos(b.tAz), Math.sin(b.tAz), 0], b.tilt); });
    const rocks = []; let ri = 0;
    BANDS.forEach((b, bi) => { for (let k = 0; k < per[bi]; k++) { const sd = seed + ri * 37; rocks.push(Object.assign(slabMesh(sd, 7 + (ri % 2)), {
      i: ri, band: bi, a0: k / per[bi] * TAU + bi * 0.9 + (R1(sd) - 0.5) * 0.3, s: b.s * (0.9 + 0.2 * R1(sd + 1)), sp0: R1(sd + 2) * TAU, spW: (R1(sd + 3) - 0.5) * 0.5, ph: R1(sd + 4) * TAU,
      d0: 0.12 + ri * (0.5 / NR), d1: R1(sd + 5) * 0.3, meetT: -9, meetA: 0, flT: -9, flK: 0, pose: null, puffed: false })); ri++; } });
    let state = 'on', endT = 0, lastSfx = -9, lastCrack = -9, absT = -9;
    const pulses = [], fissures = [], chips = [], stat = { hits: 0, prevented: 0, packets: 0, retDmg: 0 };
    X0.banner('ROCK STEADY', '', C.col, 1.4); X0.sfx.hum && X0.sfx.hum(); X0.sfx.thud && X0.sfx.thud(); X0.shake && X0.shake(3, 0.2);

    /* ---- the rules: the ward (called by hurtPet with the damage after mitigation; returns what the pet still takes) ---- */
    const ward = (d, src, o) => {
      if (state !== 'on' || me.dead || !(d > 0)) return d;
      const A = d * ABSORB; stat.hits++; stat.prevented += A;
      absorbed(src);
      if (!(o && o.reflected)) retaliate(A);   // a reflected packet is halved like any hit, but never sent back again
      return d - A;
    };
    let unWard = X0.addWard ? X0.addWard(ward) : null;
    const release = () => { if (unWard) { unWard(); unWard = null; } };
    function retaliate(A) {
      const t = F.t, dmg = RET_K * A, list = H.near(me.x, me.y, RR);
      for (const m of list) { X0.hitMon(m, dmg, C.dmgO({ reflected: true, rockSteady: true })); stat.packets++; stat.retDmg += dmg; strike(m, t); }
      if (!PARTY_DMG) { /* (the party is never struck) */ }
      // one clear cue per hit; hits close together grow the latest pulse instead of stacking more
      const last = pulses[pulses.length - 1]; if (last && t - last.t < 0.12) last.k = Math.min(1.6, last.k + 0.35); else { pulses.push({ t, k: 1 }); if (pulses.length > 5) pulses.shift(); }
      if (t - lastCrack > 0.14) { lastCrack = t; X0.sfx.crack && X0.sfx.crack(); }
      X0.light && X0.light(me.x, me.y, RR * 0.9, 0.22);
    }
    function strike(m, t) {
      // short amber fissures under the monster (one set per monster at a time: a fresh hit relights it)
      let fs = fissures.find(q => q.m === m && t - q.t < 0.5);
      if (fs) { fs.t = t; fs.k = Math.min(1.5, fs.k + 0.3); }
      else { const cr = [], n = 4 + Math.floor(Math.random() * 2), b0 = Math.random() * TAU; for (let i = 0; i < n; i++) { let a = b0 + i / n * TAU + (Math.random() - 0.5) * 0.6, r = 0.12; const L = (0.4 + Math.random() * 0.45) * Math.max(0.8, m.r * 1.6), pts = [[Math.cos(a) * r, Math.sin(a) * r]]; for (let k = 1; k <= 4; k++) { a += (Math.random() - 0.5) * 0.7; r += L / 4; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } cr.push(pts); }
        fissures.push({ m, x: m.x, y: m.y, t, k: 1, cr }); if (fissures.length > 28) fissures.shift(); }
      // a sharp upward spray of mineral chips
      const nC = H.n(chips.length > 90 ? 2 : 6); for (let i = 0; i < nC; i++) { const a = Math.random() * TAU, v = 0.6 + Math.random() * 1.4, gold = i % 3 === 0;
        chips.push({ x: m.x + Math.cos(a) * 0.15, y: m.y + Math.sin(a) * 0.1, z: 0.05, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: 4.5 + Math.random() * 3.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16, s: (gold ? 0.05 : 0.07) + Math.random() * 0.05, gold, t: 0, life: 0.9 + Math.random() * 0.3 }); }
      if (Math.random() < H.Q()) H.burst(m.x, m.y - 0.2, 'spark', 3, { v: 5, up: 3, life: 0.35, size: 1.4, color: [HONEY, PALE] });
    }
    function absorbed(src) {
      const t = F.t; let ai;
      if (src && src.x != null) ai = Math.atan2(src.y - me.y, src.x - me.x);
      else { const nm = H.sortNear(me.x, me.y)[0]; ai = nm ? Math.atan2(nm.y - me.y, nm.x - me.x) : Math.random() * TAU; }
      // the nearest rock turns to meet it; the flash runs through its fissures, then round the orbit
      let best = null, bd = 1e9; for (const rk of rocks) { if (!rk.pose) continue; const a = Math.atan2(rk.pose.p[1], rk.pose.p[0]), d = Math.abs(wrapA(a - ai)) + rk.band * 0.05; if (d < bd) { bd = d; best = rk; } }
      if (best) { if (t - best.meetT > 0.18) best.meetT = t; best.meetA = ai; const a0 = Math.atan2(best.pose.p[1], best.pose.p[0]);
        for (const rk of rocks) { if (!rk.pose) continue; const da = Math.abs(wrapA(Math.atan2(rk.pose.p[1], rk.pose.p[0]) - a0)), at = rk === best ? t : t + 0.07 + 0.22 * da / Math.PI; if (at > rk.flT + 0.1 || rk.flT > t + 0.4) { rk.flT = at; rk.flK = rk === best ? 1 : 0.7; } } }
      absT = t; if (t - lastSfx > 0.12) { lastSfx = t; X0.sfx.thud && X0.sfx.thud(); }
      X0.shake && X0.shake(2, 0.08);
      const ix = me.x + Math.cos(ai) * 1.1, iy = me.y + Math.sin(ai) * 1.1; if (Math.random() < H.Q()) H.burst(ix, iy - 0.5, 'spark', 4, { v: 4, life: 0.3, size: 1.3, color: [HONEY, PALE, GOLD] });
    }
    const meetE = u => u < 0 ? 0 : u < 0.12 ? sm(u / 0.12) : 1 - sm((u - 0.12) / 0.6);
    const flashE = u => u < 0 ? 0 : u < 0.05 ? u / 0.05 : Math.exp(-(u - 0.05) * 5);

    /* ---- a rock's pose at time t: centre p (pet space), turn R, alpha ---- */
    function pose(rk, t) {
      const b = BANDS[rk.band], th = rk.a0 + b.w * t, loc = [b.r * Math.cos(th), b.r * Math.sin(th), 0];
      let p = g.mv(b.Rb, loc); p[2] += b.zc + 0.05 * Math.sin(t * 0.9 + rk.ph);
      let az = Math.atan2(p[1], p[0]), phi = Math.PI / 2 - 0.42 + 0.08 * Math.sin(t * 0.7 + rk.ph), a = 1;
      // meeting an attack: a short step out toward it, the broad face turned to it
      const e = meetE(t - rk.meetT); if (e > 0) { const ma = rk.meetA; p = g.add(p, [Math.cos(ma) * 0.32 * e, Math.sin(ma) * 0.32 * e, 0.04 * e]); az += wrapA(ma - az) * 0.85 * e; phi = lerp(phi, Math.PI / 2 - 0.12, e); }
      // forming: lying flat on the ground circle, lifting and turning on edge
      const uf = (t - rk.d0) / 0.85; if (uf < 1) { const u = cl(uf), lift = H.ease.back(u), rr = 1.08; a = cl(uf * 6); const p0 = [Math.cos(az) * Math.hypot(p[0], p[1]) * rr, Math.sin(az) * Math.hypot(p[0], p[1]) * rr, 0.07];
        p = [lerp(p0[0], p[0], sm(u)), lerp(p0[1], p[1], sm(u)), lerp(p0[2], p[2], lift)]; phi = lerp(0, phi, sm(u * 1.25)); }
      // ending: lying back down and sinking into the floor
      if (state === 'end') { const v = cl((t - endT - rk.d1) / 0.85); if (v > 0) { const e2 = v * v; p = [p[0], p[1], lerp(p[2], -0.06, e2)]; phi = lerp(phi, 0, sm(v * 1.4)); a = 1 - sm((v - 0.62) / 0.38); } }
      const tg = [-Math.sin(az), Math.cos(az), 0], R = g.mm(g.axisR(tg, phi), g.mm(g.rz(az + Math.PI / 2), g.rz(rk.sp0 + rk.spW * t)));
      return { p, R, a, az };
    }

    const F = H.add({ life: DUR + OUT, x: me.x, y: me.y, rs: stat, ABSORB, RET_K, RR, DUR,
      update(dt, f) {
        const t = f.t; f.x = me.x; f.y = me.y;
        if (state === 'on' && (t >= DUR || me.dead)) {   // the end: the ward lets go at once; the rocks lie down and sink
          state = 'end'; endT = t; f.life = OUT; release(); X0.sfx.thud && X0.sfx.thud();
        }
        for (const rk of rocks) rk.pose = pose(rk, t);
        // dust from the undersides as they rise; small puffs where they sink back in
        for (const rk of rocks) { const P = rk.pose, u = (t - rk.d0) / 0.85, wx = me.x + P.p[0], wy = me.y + P.p[1] * H.GY;
          if (u > 0 && u < 1.1 && Math.random() < dt * 14 * H.Q()) H.P({ kind: Math.random() < 0.6 ? 'smoke' : 'shard', x: wx + (Math.random() - 0.5) * rk.s * 2, y: wy - (P.p[2] - rk.s * 0.3) * CE, vx: (Math.random() - 0.5) * 0.4, vy: 0.9 + Math.random() * 0.9, g: 3, life: 0.6 + Math.random() * 0.4, max: 1, size: Math.random() < 0.6 ? 0.22 + Math.random() * 0.12 : 2 + Math.random() * 2, rot: Math.random() * TAU, vr: 6, color: Math.random() < 0.6 ? 'rgba(150,118,80,' : UMBER });
          if (u > 0 && u < 0.2 && !rk.lifted) { rk.lifted = true; for (let q = 0; q < H.n(4); q++) H.P({ kind: 'smoke', x: wx + (Math.random() - 0.5) * 0.4, y: wy, vx: (Math.random() - 0.5) * 1.2, vy: -0.2 - Math.random() * 0.3, life: 0.7, max: 0.7, size: 0.3, color: 'rgba(170,135,90,' }); }
          if (state === 'end' && !rk.puffed && P.p[2] < 0.12) { rk.puffed = true; for (let q = 0; q < H.n(5); q++) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: wx + Math.cos(b) * 0.2, y: wy + Math.sin(b) * 0.1, vx: Math.cos(b) * 0.9, vy: Math.sin(b) * 0.4 - 0.3, life: 0.7 + Math.random() * 0.3, max: 1, size: 0.28 + Math.random() * 0.1, color: 'rgba(160,128,88,' }); } } }
        // chips: ballistic, gone when they fall back to the floor
        for (let i = chips.length - 1; i >= 0; i--) { const p = chips[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= 18 * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.t > p.life || (p.z < 0 && p.vz < 0)) chips.splice(i, 1); }
        for (let i = fissures.length - 1; i >= 0; i--) if (t - fissures[i].t > 1.0) fissures.splice(i, 1);
        for (let i = pulses.length - 1; i >= 0; i--) if (t - pulses[i].t > 0.6) pulses.splice(i, 1);
      },
      onEnd() { release(); },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, fa = fadeOf(t), GY = H.GY, Rg = tier === 3 ? 1.62 : tier === 2 ? 1.6 : 1.56;
        c.save(); c.globalCompositeOperation = 'lighter';
        // the golden ground circle: it opens out from the pet, brightens on each absorbed hit and on each retaliation
        const uo = H.ease.out(cl(t / 0.45)), flare = Math.exp(-Math.max(0, t - absT) * 5), form = 1 - sm((t - 0.2) / 1.2), rg = Rg * T * (0.35 + 0.65 * uo) / 0.88;
        blit(c, ringSpr(), X, Y, rg * 2, rg * 2 * GY, fa * (0.42 + 0.45 * form + 0.35 * flare) * cl(t / 0.15), false);
        blit(c, poolSpr(), X, Y, Rg * T * 2.4, Rg * T * 2.4 * GY, fa * (0.18 + 0.3 * form + 0.25 * flare), false);
        // slow glints round the circle
        const NG = 6 + 2 * tier; for (let q = 0; q < NG; q++) { const b = q / NG * TAU + t * 0.25, tw = 0.5 + 0.5 * Math.sin(t * 2.2 + q * 1.9); glow(c, X + Math.cos(b) * rg * 0.88, Y + Math.sin(b) * rg * 0.88 * GY, T * 0.16, PALE, 0.55 * tw * fa * uo); }
        // the pressure pulses: low golden rings running out to the edge of the reach (true floor circles, as the reach is)
        for (const pl of pulses) { const u = cl((t - pl.t) / 0.42); if (u >= 1) continue; const r = (0.4 + (RR - 0.4) * H.ease.out(u)) * T / 0.92, a = Math.pow(1 - u, 1.4) * Math.min(1, pl.k) * 0.85;
          blit(c, pulseSpr(), X, Y, r * 2, r * 2, a, false); if (u < 0.3) blit(c, poolSpr(), X, Y, T * 2.6, T * 2.6 * GY, (1 - u / 0.3) * 0.6 * Math.min(1, pl.k), false); }
        // the fissures under each monster struck: grow in, hold, fade (light only)
        c.lineCap = 'round'; c.lineJoin = 'round';
        for (const fs of fissures) { const age = t - fs.t, gr = sm(age / 0.08), a = Math.min(1, fs.k) * (1 - sm((age - 0.2) / 0.75)); if (a <= 0.01) continue; const fx = H.sx(fs.x), fy = H.sy(fs.y);
          blit(c, poolSpr(), fx, fy, T * 2.2, T * 2.2 * GY, a * 0.8, false);
          for (const cr of fs.cr) { const n = cr.length - 1, m = gr * n; for (let i = 0; i < n && i < m; i++) { const e = Math.min(1, m - i), p0 = cr[i], p1 = cr[i + 1], x0 = fx + p0[0] * T, y0 = fy + p0[1] * T * GY, x1 = fx + lerp(p0[0], p1[0], e) * T, y1 = fy + lerp(p0[1], p1[1], e) * T * GY, tip = 1 - i / n * 0.75;
            c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1);
            c.globalAlpha = a * 0.22 * tip; c.strokeStyle = AMBER; c.lineWidth = T * 0.16 * tip; c.stroke();
            c.globalAlpha = a * 0.75 * tip; c.strokeStyle = GOLD; c.lineWidth = Math.max(1.2, T * 0.05 * tip); c.stroke();
            c.globalAlpha = a * 0.9 * tip; c.strokeStyle = EMBER; c.lineWidth = Math.max(0.7, T * 0.016); c.stroke(); } } }
        // warm light under each rock (from its seam), and its soft contact shadow
        c.globalAlpha = 1;
        for (const rk of rocks) { const P = rk.pose; if (!P) continue; const sx = X + P.p[0] * T, sy = Y + P.p[1] * GY * T, k = flashE(t - rk.flT) * rk.flK, a = P.a * fa;
          blit(c, poolSpr(), sx, sy, rk.s * T * 4.2, rk.s * T * 4.2 * GY, a * (0.14 + 0.5 * k) / (1 + P.p[2] * 0.8), false); }
        c.restore();
        for (const rk of rocks) { const P = rk.pose; if (!P || P.a * fa < 0.02) continue; c.save(); c.globalAlpha = P.a * fa; g.shadow(c, X + P.p[0] * T, Y + P.p[1] * GY * T, rk.s * T * 1.5, rk.s * T * 0.75, P.p[2] * 6, 0.32); c.restore(); }
        // the rocks behind the pet (and their strands)
        drawRocks(c, X, Y, T, t, fa, false);
      },
      draw(c, f, X, Y, T) {
        const t = f.t, fa = fadeOf(t);
        drawRocks(c, X, Y, T, t, fa, true);
        // chips (cel two-tone flakes, gold ones glowing)
        if (chips.length) { const px = H.sx(me.x), py = H.sy(me.y) - T * 0.55;
          for (const p of chips) { const x = H.sx(p.x), y = H.sy(p.y) - p.z * CE * T, s = p.s * T, a = cl((p.life - p.t) / 0.25); if (a <= 0.02) continue; const co = Math.cos(p.rot), si = Math.sin(p.rot);
            const pts = [[s, 0], [s * 0.2, s * 0.7], [-s * 0.8, s * 0.3], [-s * 0.5, -s * 0.6]].map(([u, v]) => [x + u * co - v * si, y + u * si + v * co]);
            c.globalAlpha = a; c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); c.fillStyle = p.gold ? GOLD : CHAR; c.fill(); c.lineWidth = 1; c.strokeStyle = INK; c.stroke();
            c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[3][0], pts[3][1]); c.closePath(); c.fillStyle = p.gold ? PALE : '#6E5A44'; c.fill();
            if (p.gold) glow(c, x, y, s * 2.2, HONEY, a * 0.6); }
          c.globalAlpha = 1; }
      } });
    function fadeOf(t) { return cl(t / 0.12) * (state === 'end' ? 1 - sm((t - endT - OUT * 0.75) / (OUT * 0.25)) : 1); }

    /* ---- the rocks of one layer (front: over the pet, dimmed where they cross it), depth-sorted, with their strands ---- */
    function drawRocks(c, X, Y, T, t, fa, front) {
      const cm = camAt(X, Y, T), list = [], px = X, py = Y - T * 0.55, q = DunFiend.KIT.qq();
      for (const rk of rocks) { const P = rk.pose; if (!P || P.a * fa < 0.02) continue; if ((P.p[1] > 0) !== front) continue; list.push(rk); }
      list.sort((a, b) => cm.dep(a.pose.p) - cm.dep(b.pose.p));
      const mask = (x, y) => front ? 0.3 + 0.7 * sm((Math.hypot(x - px, (y - py) * 0.85) - T * 0.45) / (T * 0.6)) : 1;
      // (each rock is rendered into its own two small canvases, its body and its seam light, and re-rendered only when its
      // turn has drifted past a few degrees or the tile size changed, a few rocks a frame at most: the blits carry it between)
      if (t !== rFrame) { rFrame = t; rBudget = 3; }
      const sc = (c.getTransform && c.getTransform().a) || 1;
      const drift = (rk, P) => { if (!rk.cvB || rk.cT !== T || rk.cS !== sc) return 9; let d = 0; for (let i = 0; i < 9; i++) d = Math.max(d, Math.abs(rk.cR[i] - P.R[i])); return d; };
      const due = list.map(rk => [rk, drift(rk, rk.pose)]).filter(([, d]) => d > 0.045).sort((x, y) => y[1] - x[1]);
      for (const [rk, d] of due) { if (rBudget <= 0 && d < 0.2 && rk.cvB) break; rBudget--; paintRock(rk, rk.pose.R, T, sc, q); }
      for (const rk of list) {
        const P = rk.pose, k = flashE(t - rk.flT) * rk.flK, sp = cm.P(P.p), a = P.a * fa * mask(sp[0], sp[1]), lk = 0.32 + 0.68 * k + 0.08 * Math.sin(t * 2.3 + rk.ph), hf = rk.cH;
        // the light in the seam leaks round the rock (under it), the solid over that, the seam's light over it
        glow(c, sp[0], sp[1], rk.s * T * (2.2 + 1.2 * k), AMBER, a * (0.1 + 0.4 * k));
        c.save(); c.globalAlpha = a; c.drawImage(rk.cvB, sp[0] - hf, sp[1] - hf, hf * 2, hf * 2);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * lk); c.drawImage(rk.cvG, sp[0] - hf, sp[1] - hf, hf * 2, hf * 2);
        if (k > 0.2) { c.globalAlpha = Math.min(1, a * (k - 0.2) * 0.8); c.drawImage(rk.cvG, sp[0] - hf, sp[1] - hf, hf * 2, hf * 2); }
        c.restore();
        if (k > 0.3) glow(c, sp[0], sp[1], rk.s * T * 1.4, HONEY, a * 0.5 * (k - 0.3));
      }
      // amber strands between rocks of different bands as they pass (drawn with the nearer one's layer)
      if (state === 'on') { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (let i = 0; i < rocks.length; i++) for (let j = i + 1; j < rocks.length; j++) { const A = rocks[i], B = rocks[j]; if (A.band === B.band || !A.pose || !B.pose) continue;
          const d = g.len(g.sub(A.pose.p, B.pose.p)), lim = 0.95 + 0.6 * (A.s + B.s); if (d > lim) continue; const mid = g.mul(g.add(A.pose.p, B.pose.p), 0.5); if ((mid[1] > 0) !== front) continue;
          const e = sm((lim - d) / 0.4) * Math.min(A.pose.a, B.pose.a) * fa * (front ? mask(...cm.P(mid)) : 1), ft = Math.max(flashE(t - A.flT) * A.flK, flashE(t - B.flT) * B.flK); if (e < 0.02) continue;
          const pa = cm.P(A.pose.p), pb = cm.P(B.pose.p), pm = cm.P(g.add(mid, [0, 0, -0.08])), N = 10;
          for (let s = 0; s < N; s++) { const u0 = s / N, u1 = (s + 1) / N, env = Math.sin(Math.PI * (s + 0.5) / N), B0 = qb(pa, pm, pb, u0), B1 = qb(pa, pm, pb, u1);
            c.beginPath(); c.moveTo(B0[0], B0[1]); c.lineTo(B1[0], B1[1]);
            c.globalAlpha = e * env * (0.16 + 0.2 * ft); c.strokeStyle = AMBER; c.lineWidth = T * 0.1; c.stroke();
            c.globalAlpha = e * env * (0.6 + 0.4 * ft); c.strokeStyle = HONEY; c.lineWidth = Math.max(0.8, T * 0.022); c.stroke(); }
          const u = (t * 0.9 + i * 0.37 + j * 0.21) % 1, bp = qb(pa, pm, pb, u); glow(c, bp[0], bp[1], T * 0.12, PALE, e * 0.8 * Math.sin(Math.PI * u)); }
        c.restore(); }
    }
    let rFrame = -1, rBudget = 0;
    /* render one rock, turned by R, into its cached body canvas (solid, fractures, the seam's dark groove) and its seam
       light canvas (amber, gold and a pale core, laid additively over the body at the seam's current brightness) */
    function paintRock(rk, R, T, sc, q) {
      const hf = rk.s * T * 1.75, N = Math.ceil(hf * 2 * sc) + 2;
      if (!rk.cvB) { rk.cvB = document.createElement('canvas'); rk.cvG = document.createElement('canvas'); }
      for (const cv of [rk.cvB, rk.cvG]) { if (cv.width !== N) { cv.width = N; cv.height = N; } }
      const b = rk.cvB.getContext('2d'), gl = rk.cvG.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, N, N); gl.setTransform(1, 0, 0, 1, 0, 0); gl.clearRect(0, 0, N, N);
      const o = N / 2 / sc; b.setTransform(sc, 0, 0, sc, 0, 0); gl.setTransform(sc, 0, 0, sc, 0, 0);
      const cm = camAt(o, o, T), res = g.solid(b, cm, rk.M, { R, t: [0, 0, 0], s: rk.s }, { mats: MATS, ink: INK, lw: 0.045, lwI: 0.02, inkIA: 0.4, force: true, underK: 0.3 });
      const toS = p => cm.P(g.mv(R, g.mul(p, rk.s))), seamP = new Path2D(), fracP = new Path2D(); let ns = 0, nf = 0;
      const addP = (path, s2) => { const S = s2.P.map(toS); path.moveTo(S[0][0], S[0][1]); for (let i = 1; i < S.length; i++) path.lineTo(S[i][0], S[i][1]); };
      for (const s2 of rk.seam) if (res.vis[s2.fi]) { addP(seamP, s2); ns++; }
      for (const s2 of rk.frac) if (res.vis[s2.fi]) { addP(fracP, s2); nf++; }
      b.lineCap = gl.lineCap = 'round'; b.lineJoin = gl.lineJoin = 'round';
      if (nf) { b.save(); b.translate(0.8, 1); b.globalAlpha = 0.35; b.strokeStyle = '#9A7A55'; b.lineWidth = 1; b.stroke(fracP); b.restore(); b.globalAlpha = 0.75; b.strokeStyle = INK; b.lineWidth = Math.max(1, T * 0.026); b.stroke(fracP); }
      if (ns) { b.globalAlpha = 0.75; b.strokeStyle = INK; b.lineWidth = Math.max(1.4, T * 0.045); b.stroke(seamP);
        if (q >= 1) { gl.globalAlpha = 0.22; gl.strokeStyle = AMBER; gl.lineWidth = T * 0.12; gl.stroke(seamP); }
        gl.globalAlpha = 0.85; gl.strokeStyle = GOLD; gl.lineWidth = Math.max(1, T * 0.026); gl.stroke(seamP);
        gl.globalAlpha = 0.5; gl.strokeStyle = EMBER; gl.lineWidth = Math.max(0.7, T * 0.012); gl.stroke(seamP); }
      rk.cR = R.slice(); rk.cT = T; rk.cS = sc; rk.cH = hf;
    }
    const qb = (a, m, b, u) => { const v = 1 - u; return [v * v * a[0] + 2 * v * u * m[0] + u * u * b[0], v * v * a[1] + 2 * v * u * m[1] + u * u * b[1]]; };
  };
  U.rocksteady.__dbg = { slabMesh, MATS, camAt, G: GeoKit };
})();
