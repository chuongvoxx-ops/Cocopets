/* ---------- Earth, reworked: Geode Arsenal (ember crystals) ----------
   The pet swirls up into the air (it rises about a tile and twirls; arms up, feet dangling) and summons ember crystals:
   each bursts out of it in a flash of embers and spirals out into a ring that circles it in a tilted swirl. Then they
   launch one after another as homing missiles: thrown out along the swirl, they curve round onto their monster's
   CURRENT place (the turn tightens as they speed up), trailing a feathered ember tail, and strike once each: one Earth
   hit on that monster and an ember-crystal burst (golden splinters, sparks, a flash, a light-only crack mark). A
   crystal whose monster dies turns to the nearest other one; with none it flies on and falls. Each launch aims at the
   monsters in range at that moment, round-robin from the nearest. Then the pet floats down, its twirl settling.
   Crystals: 6 7 8 10 11 12 14 by level (Hatchling 6, Adept 10, Celestial 14 in two waves of 7: summon 7, fire,
   summon 7 more, fire). Damage (DK = base x K x evoK): each crystal TOT / N, so a lone monster taking them all gets
   TOT = 14 / 16 / 20 x DK (levels between interpolate); every crystal is equal (kb 1.6).
   The crystals are real ray-cast 3D (Cataclysm's kit, EARTHC in 20k2e): a doubly-terminated hexagonal amber crystal
   lying along its flight, cel-banded honey facets, inner planes, pale gold edges, a hard specular, ink, and an emissive
   ember core layer; rendered once per size in six roll steps (it spins on its own axis as it flies) and two shapes,
   cached. The pet's lift and twirl go through the hooks me.z (Trampoline's) and me.twirl (20b's pet draw); all reset
   at the end and on the pet's death; no invulnerability. Floor marks are light only; every edge feathered. */
(() => {
  const U = ELEM_IMPL.earth.ult; delete U.celestialgeode;
  const TAU = Math.PI * 2, CE = Math.cos(0.62);
  const AMBER = '#D98A1E', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8', CORE = '#FFF4D6';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  let H;
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorSpr(c, img, X, Y, r, a, add) { if (r < 1 || !(a > 0.01)) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  function floorGlow(c, X, Y, r, a, col) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  function scr(c) { const m = c.getTransform(); return { k: m.a || 1 }; }

  /* ---- cached soft sprites ---- */
  const radial = (key, S, stops) => fxSprite(key, S, S, g => { const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, S, S); });
  const bandSpr = () => radial('egaband', 256, [[0, 'rgba(217,138,30,0)'], [0.55, 'rgba(217,138,30,0)'], [0.78, 'rgba(217,138,30,0.22)'], [0.9, 'rgba(242,183,58,0.6)'], [0.955, 'rgba(255,233,184,0.7)'], [1, 'rgba(255,233,184,0)']]);
  const puffSpr = () => radial('egapuff', 96, [[0, 'rgba(168,136,98,0.42)'], [0.5, 'rgba(128,100,72,0.22)'], [1, 'rgba(92,65,38,0)']]);
  const gpuffSpr = () => radial('egagpuff', 96, [[0, 'rgba(255,214,120,0.5)'], [0.45, 'rgba(242,170,58,0.24)'], [1, 'rgba(217,138,30,0)']]);
  const shardSpr = v => fxSprite('egash' + v, 32, 32, g => { const w = 4 + v * 1.5, L = 13; g.translate(16, 16); g.rotate(v * 0.7);
    const gr = g.createLinearGradient(-w, -L, w, L); gr.addColorStop(0, '#FFF4D6'); gr.addColorStop(0.4, '#FFCF5C'); gr.addColorStop(0.75, '#D98A1E'); gr.addColorStop(1, '#7A5218');
    g.beginPath(); g.moveTo(0, -L); g.lineTo(w, -2); g.lineTo(w * 0.6, L * 0.7); g.lineTo(0, L); g.lineTo(-w, 1); g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(92,52,12,0.9)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -L + 2); g.lineTo(-w * 0.6, 0); g.stroke(); });
  const starSpr = () => fxSprite('egastar', 48, 48, g => { g.translate(24, 24); g.globalCompositeOperation = 'lighter'; for (const [w, a] of [[0.9, 0.9], [2.4, 0.3]]) { g.strokeStyle = `rgba(255,244,214,${a})`; g.lineWidth = w; g.beginPath(); g.moveTo(-22, 0); g.lineTo(22, 0); g.moveTo(0, -22); g.lineTo(0, 22); g.stroke(); } const gr = g.createRadialGradient(0, 0, 0, 0, 0, 10); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(1, 'rgba(255,207,92,0)'); g.fillStyle = gr; g.fillRect(-10, -10, 20, 20); });
  // a feathered ember-tail stamp: hot centre, amber falloff
  const tailSpr = () => radial('egatail', 64, [[0, 'rgba(255,236,190,0.95)'], [0.2, 'rgba(255,190,80,0.7)'], [0.5, 'rgba(217,120,30,0.25)'], [1, 'rgba(160,70,10,0)']]);

  /* ---- the ember crystals: doubly terminated hexagonal amber, lying along +x, ray-cast with the EARTHC kit, six roll
     steps and two shapes per size (EARTHC is defined by 20k2e, after this file: only touched at the cast) ---- */
  const NR = 6, CSET = {};
  function crystalSet(Spx) { const key = Spx; if (CSET[key]) return CSET[key]; const E = EARTHC, out = { v: [[], []], its: [], ready: false };
    for (let s = 0; s < 2; s++) { const r = 0.1, A = E.crystalModel(510 + s * 31, { r, taper: 0.8, hs: 0.3, ht: 0.56 + 0.05 * s, sides: 6 }), B = E.crystalModel(540 + s * 17, { r: r * 0.9, taper: 0.96, hs: 0.015, ht: 0.2, sides: 6 });
      // (cut both at their bases, so the two points meet in one doubly-terminated crystal)
      A.pl[A.pl.length - 1] = { n: [0, 0, -1], d: 0 }; B.pl[B.pl.length - 1] = { n: [0, 0, -1], d: 0 };
      const parts = [{ md: A, M: E.rotAxis([0, 1, 0], Math.PI / 2), mat: 'crystal' }, { md: B, M: E.rotAxis([0, 1, 0], -Math.PI / 2), mat: 'crystal' }];
      for (let k = 0; k < NR; k++) { const res = {}; out.v[s].push(res); out.its.push(E.clusterGen(parts, E.rotAxis([1, 0, 0], k / NR * Math.PI / 3 + 0.25), Spx, res, false)); } }
    out.step = ms => { const t0 = performance.now(); while (out.its.length && performance.now() - t0 < ms) { if (E.runGen(out.its[0], Math.max(0.5, ms - (performance.now() - t0)))) out.its.shift(); else break; } out.ready = !out.its.length; };
    return (CSET[key] = out); }

  /* ================= E7 Geode Arsenal ================= */
  U.geodearsenal = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), CEL = ev >= 7, K = C.K, evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    const N = [6, 7, 8, 10, 11, 12, 14][ev - 1], WAVES = CEL ? 2 : 1, NW = N / WAVES, TOT = (ev <= 4 ? lerp(14, 16, (ev - 1) / 3) : lerp(16, 20, (ev - 4) / 3)) * DK, D1 = TOT / N;
    const RNG = 10 * K, ZP = 1.05, RO = 1.15 + 0.03 * NW, SZ = (1.2 + 0.03 * ev) * Math.sqrt(K), GAP = 0.085;
    // the beats: rise, summon (crystals burst out over SUMW), swirl, launch one by one; a second wave at Celestial; descend
    const SUM0 = [0.3], SUMW = 0.5, LS = [SUM0[0] + SUMW + 0.42]; if (WAVES > 1) { SUM0.push(LS[0] + NW * GAP + 0.25); LS.push(SUM0[1] + SUMW + 0.36); }
    const LAST = LS[WAVES - 1] + (NW - 1) * GAP, DESC = LAST + 0.45, LAND = DESC + 0.5;
    const crys = []; for (let w = 0; w < WAVES; w++) for (let j = 0; j < NW; j++) crys.push({ w, j, ph: j / NW * TAU + w * 0.45, born: SUM0[w] + j * SUMW / NW, go: LS[w] + j * GAP, s: (j + w) % 2, roll: Math.random() * 6, st: 'wait', tr: [], m: null });
    const shards = [], sparks = [], puffs = [], rings = [], marks = [], motes = [];
    let died = false, endT = 1e9, twGoal = null, spin = 0, swirl = 0, landed = false, shot = 0, CS = null;
    H.X.banner('GEODE ARSENAL', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.5;
    const pc = t => [me.x, me.y, (me.z || 0) + 0.55];   // the pet's middle, in the air
    // a crystal on the swirl: a tilted ring round the pet, turning
    const orbitPos = (q, t) => { const a = q.ph + swirl, rr = RO * (1 + 0.05 * Math.sin(t * 3 + q.j)), p = pc(t); return [p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr * 0.8, p[2] + Math.sin(a + 0.9) * 0.28 + 0.06 * Math.sin(t * 4 + q.j * 2)]; };
    const live = () => H.sortNear(me.x, me.y, H.near(me.x, me.y, RNG));
    const reset = () => { me.z = 0; me.twirl = 0; me.hopArm = 0; me.hopFoot = 0; me.hopSq = 0; };
    function launch(q, t) { const L = live(), m = L.length ? L[shot % L.length] : null; shot++; q.m = m; q.st = 'fly'; q.ft = 0;
      const p = orbitPos(q, t), a = q.ph + swirl, tan = [-Math.sin(a), Math.cos(a) * 0.8, 0.15], out = [Math.cos(a), Math.sin(a), 0.6], to = m ? nrm([m.x - p[0], m.y - p[1], 0.45 - p[2]]) : [Math.cos(C.a), Math.sin(C.a), 0];
      q.p = p; q.v = nrm([tan[0] * 1.1 + out[0] * 0.6 + to[0] * 0.5, tan[1] * 1.1 + out[1] * 0.6 + to[1] * 0.5, tan[2] + out[2] * 0.6 + to[2] * 0.3]); q.sp = 6;
      for (let k = 0; k < H.n(5); k++) { const b = Math.random() * TAU; sparks.push({ x: p[0], y: p[1], z: p[2], vx: Math.cos(b) * 1.5 - q.v[0] * 2, vy: Math.sin(b) * 1.5 - q.v[1] * 2, vz: Math.random() * 1.5, t: 0, life: 0.3 + Math.random() * 0.25 }); }
      puffs.push({ x: p[0], y: p[1], z: p[2], vx: -q.v[0], vy: -q.v[1], vz: 0.2, t: 0, life: 0.45, s: 0.3, gold: 1 });
      if (q.j % 2 === 0) H.X.sfx.whoosh(); }
    function impact(q, m) {
      if (m) H.X.hitMon(m, D1, C.dmgO({ kb: 1.6 }));
      const [x, y, z0] = q.p, z = Math.max(0.08, z0); q.st = 'done';
      for (let k = 0; k < H.n(9); k++) { const b = Math.random() * TAU, v = 2 + Math.random() * 4; shards.push({ x, y, z, vx: Math.cos(b) * v + q.v[0] * 1.5, vy: Math.sin(b) * v + q.v[1] * 1.5, vz: 1.5 + Math.random() * 3.5, t: 0, life: 0.5 + Math.random() * 0.35, v: k % 3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 20 }); }
      for (let k = 0; k < H.n(10); k++) { const b = Math.random() * TAU, v = 1.5 + Math.random() * 4; sparks.push({ x, y, z, vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: 1 + Math.random() * 3, t: 0, life: 0.35 + Math.random() * 0.35 }); }
      for (let k = 0; k < H.n(3); k++) { const b = Math.random() * TAU; puffs.push({ x: x + Math.cos(b) * 0.15, y: y + Math.sin(b) * 0.15, z: 0.12, vx: Math.cos(b) * 0.8, vy: Math.sin(b) * 0.8, vz: 0.3, t: 0, life: 0.6, s: 0.28 }); }
      rings.push({ x, y, t: 0, life: 0.42, r0: 0.15, r1: 0.95, a: 0.8 }); marks.push({ x, y, t: 0, life: 0.9, seed: 1 + (shot % 3) }); motes.push({ x, y, z, t: 0, life: 0.2, s: 0.55 });
      H.X.light(x, y, 1.6, 0.22); H.X.shake(1.3, 0.07); if (q.j % 2 === 0) H.X.sfx.crack(); }
    const f = H.add({ life: LAND + 3, x: me.x, y: me.y, key: 'geodearsenal', TB: LAST,
      update(dt, f) {
        const t = f.t;
        if (me.dead && !died) { died = true; endT = t; reset(); for (const q of crys) if (q.st !== 'done') q.st = 'gone'; }
        if (!died) {
          // the pet: rises, twirls (faster while summoning), sways; floats down at the end, the twirl settling on a whole turn
          const up = H.ease.out(cl(t / 0.55)), down = sstep(DESC, LAND, t);
          me.z = ZP * up * (1 - down) + 0.07 * Math.sin(t * 3.4) * up * (1 - down);
          const sumK = crys.some(q => q.st === 'orbit' && t - q.born < 0.35) ? 1 : 0;
          spin = lerp(spin, t < DESC ? 9 + 6 * sumK : 0, Math.min(1, dt * 4));
          if (t < DESC) me.twirl = (me.twirl || 0) + spin * dt; else { if (twGoal == null) twGoal = Math.ceil(((me.twirl || 0) + 0.5) / TAU) * TAU; me.twirl = lerp(me.twirl || 0, twGoal, Math.min(1, dt * 6)); }
          me.hopArm = lerp(me.hopArm || 0, t < DESC ? 70 + 25 * sumK : (t < LAND ? 40 : 0), Math.min(1, dt * 8)); me.hopFoot = lerp(me.hopFoot || 0, t < DESC ? -1.5 : 0, Math.min(1, dt * 8));
          me.hopSq = t < 0.12 ? 0.4 * sm(t / 0.12) : t < 0.4 ? -0.25 * (1 - sm((t - 0.12) / 0.28)) : t >= LAND ? 0.35 * Math.exp(-(t - LAND) * 9) : 0;
          if (t >= 0.08 && !f.lift) { f.lift = true; rings.push({ x: me.x, y: me.y, t: 0, life: 0.6, r0: 0.3, r1: 1.4, a: 0.5 }); for (let k = 0; k < H.n(8); k++) { const b = k / 8 * TAU; puffs.push({ x: me.x + Math.cos(b) * 0.3, y: me.y + Math.sin(b) * 0.25, z: 0.05, vx: Math.cos(b) * 1.6, vy: Math.sin(b) * 1.3, vz: 0.4, t: 0, life: 0.8, s: 0.32 }); } H.X.sfx.whoosh(); }
          if (t >= LAND && !landed) { landed = true; me.z = 0; rings.push({ x: me.x, y: me.y, t: 0, life: 0.5, r0: 0.2, r1: 1.1, a: 0.45 }); for (let k = 0; k < H.n(6); k++) { const b = k / 6 * TAU; puffs.push({ x: me.x, y: me.y, z: 0.05, vx: Math.cos(b) * 1.2, vy: Math.sin(b) * 1.0, vz: 0.3, t: 0, life: 0.6, s: 0.28 }); } H.X.sfx.thud(); }
          if (landed && t > LAND + 0.3) { me.twirl = 0; me.hopArm = 0; me.hopFoot = 0; }
          swirl += dt * (3.0 + 1.5 * sumK);
          // rising ember motes round the pet while it is aloft
          if (t < DESC && Math.random() < dt * 22 * H.Q()) { const b = Math.random() * TAU, p = pc(t); sparks.push({ x: p[0] + Math.cos(b) * 0.7, y: p[1] + Math.sin(b) * 0.5, z: p[2] - 0.4, vx: -Math.sin(b) * 1.5, vy: Math.cos(b) * 1.2, vz: 1.2 + Math.random(), t: 0, life: 0.5 + Math.random() * 0.4, g: -1 }); }
        }
        // the crystals: wait, burst out and orbit, fly
        for (const q of crys) {
          if (q.st === 'wait' && !died && t >= q.born) { q.st = 'orbit'; const p = pc(t); for (let k = 0; k < H.n(6); k++) { const b = Math.random() * TAU, v = 1.5 + Math.random() * 2; sparks.push({ x: p[0], y: p[1], z: p[2], vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: Math.random() * 2, t: 0, life: 0.35 + Math.random() * 0.25 }); } motes.push({ x: p[0], y: p[1], z: p[2], t: 0, life: 0.22, s: 0.45 }); if (q.j % 2 === 0) H.X.sfx.sparkle(); }
          if (q.st === 'orbit') { q.roll += dt * 9; if (!died && t >= q.go) launch(q, t); }
          if (q.st === 'fly') { q.ft += dt; q.roll += dt * 16;
            if (!q.m || q.m.dead) { const L = H.sortNear(q.p[0], q.p[1], H.near(q.p[0], q.p[1], 12)); q.m = L.length ? L[0] : null; }
            q.sp = Math.min(19, q.sp + dt * 26);
            if (q.m) { const want = nrm([q.m.x - q.p[0], q.m.y - q.p[1], 0.45 - q.p[2]]), k = Math.min(1, dt * (3 + 11 * sstep(0, 0.45, q.ft) + 30 * sstep(0.7, 1.2, q.ft))); q.v = nrm([lerp(q.v[0], want[0], k), lerp(q.v[1], want[1], k), lerp(q.v[2], want[2], k)]); }
            else q.v = nrm([q.v[0], q.v[1], q.v[2] - dt * 1.2]);
            const step = q.sp * dt, n = Math.max(1, Math.ceil(step / 0.2)); let done = false;
            for (let i = 0; i < n && !done; i++) { q.p = [q.p[0] + q.v[0] * step / n, q.p[1] + q.v[1] * step / n, q.p[2] + q.v[2] * step / n];
              if (q.m && !q.m.dead && Math.hypot(q.m.x - q.p[0], q.m.y - q.p[1]) < q.m.r + 0.28 && q.p[2] < 1.4) { impact(q, q.m); done = true; }
              else if (q.p[2] <= 0.04 || q.ft > 3 || (q.p[2] < 0.7 && H.X.blocked(q.p[0], q.p[1], 0.1, 1))) { impact(q, null); done = true; } }
            if (!done) { q.tr.push([q.p[0], q.p[1], q.p[2]]); if (q.tr.length > 16) q.tr.shift(); if (Math.random() < dt * 30 * H.Q()) sparks.push({ x: q.p[0], y: q.p[1], z: q.p[2], vx: (Math.random() - 0.5) * 1.5 - q.v[0], vy: (Math.random() - 0.5) * 1.5 - q.v[1], vz: Math.random(), t: 0, life: 0.3 + Math.random() * 0.3 }); } } }
        for (const L2 of [shards, sparks, puffs, rings, marks, motes]) for (let i = L2.length - 1; i >= 0; i--) { const p = L2[i]; p.t += dt; if (p.t >= p.life) { L2.splice(i, 1); continue; }
          if (L2 === shards) { p.vz -= 12 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.5; p.vy *= 0.5; } }
          else if (L2 === sparks) { p.vz -= (p.g != null ? p.g : 7) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); }
          else if (L2 === puffs) { const dr = Math.exp(-2 * dt); p.vx *= dr; p.vy *= dr; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; } }
        const busy = crys.some(q => q.st === 'orbit' || q.st === 'fly' || q.st === 'wait') || shards.length || sparks.length || puffs.length;
        if ((died && t > endT + 0.6 && !busy) || (!died && landed && t > LAND + 0.4 && !busy)) f.life = Math.min(f.life, 0.02);
        if (died && t > endT + 1.5) f.life = Math.min(f.life, 0.02);
      },
      onEnd() { reset(); },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, sx = H.sx, sy = H.sy;
        // the warm light under the hovering pet, the lift-off and landing rings, the impacts' light marks
        if (!died) { const k = sstep(0.05, 0.4, t) * (1 - sstep(DESC, LAND, t)); floorGlow(c, sx(me.x), sy(me.y), T * 1.6, 0.35 * k, AMBER); floorGlow(c, sx(me.x), sy(me.y), T * 0.8, 0.25 * k, HONEY); }
        for (const rg of rings) { const u = rg.t / rg.life; floorSpr(c, bandSpr(), sx(rg.x), sy(rg.y), (rg.r0 + (rg.r1 - rg.r0) * H.ease.out(u)) * T, rg.a * (1 - u), true); }
        for (const mk of marks) { const u = mk.t / mk.life, kk = scr(c).k, img = EARTHC.cracks(mk.seed, T * 0.8 * kk, 6, 1), w = img.width / kk, hh = img.height / kk; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - sstep(0.2, 1, u)) * Math.min(1, u * 8); c.drawImage(img, sx(mk.x) - w / 2, sy(mk.y) - hh / 2, w, hh); c.restore(); }
        // the crystals on the far side of the swirl pass behind the pet
        drawCrystals(c, T, t, false);
      },
      draw(c, f, X, Y, T) {
        const t = f.t, sx = H.sx, sy = H.sy;
        // the swirl: ember ribbons circling the pet while it is aloft
        if (!died) { const k = sstep(0.1, 0.5, t) * (1 - sstep(DESC - 0.2, LAND, t)); if (k > 0.02) { const p = pc(t), PX = sx(p[0]), PY = sy(p[1]) - p[2] * CE * T, rx = RO * T * 0.95, ryy = rx * 0.8 * 0.6;
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          for (let j = 0; j < 3; j++) { const a0 = swirl * 1.15 + j * TAU / 3, span = 1.5; for (const [col, w, aa] of [[AMBER, 0.12, 0.18], [HONEY, 0.05, 0.45], [CORE, 0.018, 0.6]]) { c.strokeStyle = col; c.lineWidth = Math.max(0.8, T * w); c.beginPath(); for (let i = 0; i <= 14; i++) { const u = i / 14, a = a0 + span * u, x = PX + Math.cos(a) * rx * (0.85 + 0.15 * u), y = PY + Math.sin(a) * ryy - Math.sin(a + 0.9) * T * 0.2; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.globalAlpha = k * aa; c.stroke(); } }
          c.restore(); } }
        drawCrystals(c, T, t, true);
        // splinters, sparks, dust, flashes
        for (const p of shards) { const u = p.t / p.life, s = T * 0.1; c.save(); c.translate(sx(p.x), sy(p.y) - p.z * CE * T); c.rotate(p.rot); c.globalAlpha = 1 - sstep(0.6, 1, u); c.drawImage(shardSpr(p.v), -s, -s, s * 2, s * 2); c.restore(); }
        for (const p of sparks) { const u = p.t / p.life; glow(c, sx(p.x), sy(p.y) - p.z * CE * T, T * 0.08, HONEY, (1 - u) * 0.9); }
        for (const p of puffs) { const u = p.t / p.life, r = p.s * (0.6 + 0.9 * u) * T; c.globalAlpha = 0.85 * Math.sin(Math.PI * Math.min(1, u * 1.3 + 0.08)) * (1 - u); if (p.gold) c.globalCompositeOperation = 'lighter'; c.drawImage(p.gold ? gpuffSpr() : puffSpr(), sx(p.x) - r, sy(p.y) - p.z * CE * T - r * 0.8, r * 2, r * 1.6); c.globalCompositeOperation = 'source-over'; }
        c.globalAlpha = 1;
        for (const p of motes) { const u = p.t / p.life, s = p.s * T * (1 + u), x = sx(p.x), y = sy(p.y) - p.z * CE * T; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - u; c.drawImage(starSpr(), x - s, y - s, s * 2, s * 2); c.restore(); glow(c, x, y, s, HONEY, 0.6 * (1 - u)); }
        f.zx = sx(me.x); f.zy = sy(me.y) - T * (1 + (me.z || 0) * CE);
      } });
    // the crystals (front: the near half of the swirl and every flying one; back: the far half, drawn under the pet)
    function drawCrystals(c, T, t, front) {
      const k = scr(c).k, Spx = Math.max(16, Math.min(160, Math.round(T * k * SZ / 4) * 4)); if (!CS) CS = crystalSet(Spx); if (!CS.ready) CS.step(3);
      const sx = H.sx, sy = H.sy, pX = sx(me.x), pY = sy(me.y) - T * (0.45 + (me.z || 0) * CE);
      for (const q of crys) {
        let p, v, al = 1, sc = 1;
        if (q.st === 'orbit') { const a = q.ph + swirl; if ((Math.sin(a) > 0) !== front) continue; p = orbitPos(q, t); v = [-Math.sin(a), Math.cos(a) * 0.8, Math.cos(a + 0.9) * 0.28]; const u = cl((t - q.born) / 0.32); sc = H.ease.back(u) * 0.95 + 0.05; al = Math.min(1, u * 3);
          if (u < 1) { const c0 = pc(t), e = H.ease.out(u); p = [lerp(c0[0], p[0], e), lerp(c0[1], p[1], e), lerp(c0[2], p[2], e)]; }
          // launched soon: it turns its point outward and glows hotter
          const pre = sstep(q.go - 0.25, q.go, t); if (pre > 0) { const L = live(), m = L.length ? L[shot % L.length] : null; if (m) v = nrm([lerp(v[0], m.x - p[0], pre), lerp(v[1], m.y - p[1], pre), lerp(v[2], 0, pre)]); } }
        else if (q.st === 'fly') { if (!front) continue; p = q.p; v = q.v; }
        else continue;
        const X = sx(p[0]), Y = sy(p[1]) - p[2] * CE * T, X2 = sx(p[0] + v[0] * 0.1), Y2 = sy(p[1] + v[1] * 0.1) - (p[2] + v[2] * 0.1) * CE * T, ang = Math.atan2(Y2 - Y, X2 - X), fore = Math.max(0.55, Math.min(1, Math.hypot(X2 - X, Y2 - Y) / (T * 0.1)));
        // near the pet (passing in front of it) a crystal dims smoothly
        const pd = q.st === 'orbit' && front ? 0.45 + 0.55 * sstep(0.15 * T, 0.6 * T, Math.hypot(X - pX, Y - pY)) : 1, A = al * pd;
        // the ember tail: feathered stamps along its recent path, hot near it, cooling behind
        if (q.st === 'fly' && q.tr.length > 1) { const img = tailSpr(); c.save(); c.globalCompositeOperation = 'lighter';
          for (let i = 0; i < q.tr.length; i++) { const u = (i + 1) / q.tr.length, tp = q.tr[i], tx = sx(tp[0]), ty = sy(tp[1]) - tp[2] * CE * T, r = T * (0.08 + 0.24 * u) * SZ; c.globalAlpha = 0.8 * u * u; c.drawImage(img, tx - r, ty - r, r * 2, r * 2); }
          c.lineCap = 'round'; c.strokeStyle = CORE; c.lineWidth = Math.max(0.8, T * 0.035 * SZ); c.globalAlpha = 0.7; c.beginPath(); q.tr.forEach((tp, i) => { const tx = sx(tp[0]), ty = sy(tp[1]) - tp[2] * CE * T; i ? c.lineTo(tx, ty) : c.moveTo(tx, ty); }); c.lineTo(X, Y); c.stroke(); c.restore(); }
        glow(c, X, Y, T * 0.42 * SZ * sc, AMBER, 0.35 * A); glow(c, X, Y, T * 0.2 * SZ * sc, HONEY, 0.4 * A);
        const res = CS.v[q.s][Math.floor(q.roll) % NR];
        c.save(); c.translate(X, Y); let an = ang; if (Math.cos(an) < 0) { c.scale(-1, 1); an = Math.PI - an; } c.rotate(an); c.scale(fore * sc, sc);
        if (res && res.ready) { const qd = 1 / k; c.globalAlpha = A; c.drawImage(res.body, -res.cx * qd, -res.cy * qd, res.W * qd, res.H * qd); EARTHC.addLayer(c, res.glow, -res.cx * qd, -res.cy * qd, res.W * qd, res.H * qd, A * (0.28 + 0.14 * Math.sin(t * 13 + q.j * 2) + (q.st === 'fly' ? 0.15 : 0))); }
        else { const s = T * 0.3 * SZ; c.globalAlpha = A; c.rotate(Math.PI / 2); c.drawImage(shardSpr(1), -s, -s, s * 2, s * 2); }
        c.restore(); }
      c.globalAlpha = 1; }
    return f;
  };
  U.geodearsenal.dbg = { crystalSet };   // (the harness's door: the crystal sprites)
})();
