/* ---------- The Garden of Unborn Stars' three bosses: Super Fiend-class, cel-shaded and three-dimensional ----------
   What they share: the garden's palette, a floor of moon-moss veined with roots under a hedge of thorns, and a sky of
   three unmoving moons with the orchard's egg-laden branches hanging into it. */
const GardenFiend = (() => {
  const TAU = Math.PI * 2;
  const PLUM = '#2F183A', PLUM_SH = '#1B0D22', PLUM_HI = '#5C3D70', ROSE = '#A85E87', ROSE_SH = '#73395B', ROSE_HI = '#D98FB5', JADE = '#4A8D7B', JADE_SH = '#2C5A4E', JADE_HI = '#86C9B2', CREAM = '#F2D8A1', CREAM_SH = '#C9AB72', GOLD = '#FFD36B', INK = '#1A0D20';
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k);
  // a strike's follow-through: 0..1 of its time, overshooting to 1.2 in the first quarter and settling back
  const snap = u => u < 0.25 ? 1.2 * Math.sin(u / 0.25 * Math.PI / 2) : 1.2 * Math.cos((u - 0.25) / 0.75 * Math.PI / 2);
  /* the garden floor: moon-moss in near-black plum, root veins of jade, seed motes, pale pools where the moons fall */
  function floor(c, A, o) { const R = A.R, rnd = A.rnd; o = o || {};
    let g = c.createRadialGradient(0, 0, R * 0.15, 0, 0, R + 1.4); g.addColorStop(0, o.mid || '#3A2449'); g.addColorStop(0.7, o.edge || '#2A1634'); g.addColorStop(0.94, '#1B0D22'); g.addColorStop(1, 'rgba(27,13,34,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.fill();
    // moss: soft flecks, lighter where the moons fall
    [[-R * 0.35, -R * 0.3, '242,216,161'], [R * 0.4, -R * 0.1, '217,143,181'], [0, R * 0.45, '134,201,178']].forEach(([x, y, col]) => { const gg = c.createRadialGradient(x, y, 0, x, y, R * 0.5); gg.addColorStop(0, `rgba(${col},.1)`); gg.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gg; c.fillRect(x - R * 0.5, y - R * 0.5, R, R); });
    for (let i = 0; i < 420; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 0.3), x = Math.cos(a) * d, y = Math.sin(a) * d; c.fillStyle = `rgba(${90 + rnd() * 40},${60 + rnd() * 50},${110 + rnd() * 40},${0.12 + rnd() * 0.14})`; c.beginPath(); c.ellipse(x, y, 0.25 + rnd() * 0.5, 0.15 + rnd() * 0.3, rnd() * 3, 0, TAU); c.fill(); }
    // root veins: curving from the rim toward the middle, dark jade with a lighter ridge
    for (let i = 0; i < 14; i++) { const a0 = i / 14 * TAU + rnd() * 0.3; let x = Math.cos(a0) * (R + 0.5), y = Math.sin(a0) * (R + 0.5), a = a0 + Math.PI + (rnd() - 0.5) * 0.4; const pts = [[x, y]]; for (let j = 0; j < 7; j++) { x += Math.cos(a) * (0.9 + rnd() * 0.8); y += Math.sin(a) * (0.9 + rnd() * 0.8); a += (rnd() - 0.5) * 0.9; if (Math.hypot(x, y) < R * 0.3) break; pts.push([x, y]); }
      for (const [col, w] of [['rgba(20,40,34,.7)', 0.42], [JADE_SH, 0.28], ['rgba(134,201,178,.25)', 0.08]]) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); pts.forEach(([px, py], k) => k ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke(); } }
    // seed motes: tiny gold seeds in the moss
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 90; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 0.6); c.fillStyle = `rgba(255,211,107,${0.15 + rnd() * 0.3})`; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, 0.05 + rnd() * 0.07, 0, TAU); c.fill(); } c.restore();
    if (o.extra) o.extra(c, A);
    // the rim: a hedge of thorns, dark spikes leaning in
    c.fillStyle = '#1B0D22'; c.strokeStyle = 'rgba(217,143,181,.25)'; c.lineWidth = 0.08; for (let i = 0; i < 110; i++) { const a = i / 110 * TAU, r0 = R + 0.1, h = 0.5 + rnd() * 0.7, w = 0.25 + rnd() * 0.15, ca = Math.cos(a), sa = Math.sin(a); c.beginPath(); c.moveTo(ca * r0 - sa * w, sa * r0 + ca * w); c.lineTo(ca * (r0 - h) + (rnd() - 0.5) * 0.3, sa * (r0 - h) - 0.4 * h); c.lineTo(ca * r0 + sa * w, sa * r0 - ca * w); c.closePath(); c.fill(); c.stroke(); }
    c.strokeStyle = 'rgba(134,201,178,.3)'; c.lineWidth = 0.14; c.beginPath(); c.arc(0, 0, R + 0.15, 0, TAU); c.stroke(); }
  /* the sky: three unmoving moons over a plum night, the orchard's branches hanging in with their eggs */
  function sky(c, W, H, t, cam, T, o) { o = o || {}; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.top || '#120820'); g.addColorStop(0.5, o.mid || '#2A1538'); g.addColorStop(1, o.bot || '#0E0712'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(77); c.fillStyle = '#FFFFFF'; for (let i = 0; i < 70; i++) { c.globalAlpha = 0.25 + R() * 0.6; c.beginPath(); c.arc(R() * W, R() * H * 0.6, 0.6 + R() * 1.2, 0, TAU); c.fill(); } c.globalAlpha = 1;
    // the moons: cream, rose and jade, each with its own halo
    [[CREAM, 0.2, 0.13, 7.5], [ROSE_HI, 0.56, 0.08, 4.6], [JADE_HI, 0.84, 0.17, 5.4]].forEach(([col, fx, fy, r]) => { const mx = W * fx - (cam.x - 28) * T * 0.06, my = H * fy; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45; blitSized(c, glowSprite(col), mx - T * r * 1.8, my - T * r * 1.8, T * r * 3.6, T * r * 3.6); c.restore(); c.fillStyle = col; c.beginPath(); c.arc(mx, my, T * r * 0.42, 0, TAU); c.fill(); c.fillStyle = 'rgba(30,15,38,.25)'; c.beginPath(); c.arc(mx - T * r * 0.12, my + T * r * 0.1, T * r * 0.1, 0, TAU); c.arc(mx + T * r * 0.15, my - T * r * 0.12, T * r * 0.07, 0, TAU); c.fill(); });
    // branches from above, eggs hanging from them
    c.save(); c.strokeStyle = '#1B0D22'; c.lineCap = 'round'; const R2 = mulberry32(31); for (let i = 0; i < 6; i++) { const x0 = W * (i + 0.5) / 6 + (R2() - 0.5) * 40, L = 60 + R2() * 70, sw = (R2() - 0.5) * 60; c.lineWidth = 7; c.beginPath(); c.moveTo(x0, -10); c.quadraticCurveTo(x0 + sw * 0.5, L * 0.5, x0 + sw, L); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(x0 + sw * 0.6, L * 0.6); c.quadraticCurveTo(x0 + sw * 0.9 + 20, L * 0.8, x0 + sw + 30, L * 0.75); c.stroke();
      for (let k = 0; k < 3; k++) { const u = 0.4 + k * 0.28, ex = x0 + sw * u + (k - 1) * 10, ey = L * u + 14 + R2() * 8; c.lineWidth = 1.5; c.beginPath(); c.moveTo(ex, ey - 12); c.lineTo(ex, ey - 4); c.stroke(); c.fillStyle = 'rgba(242,216,161,.55)'; c.beginPath(); c.ellipse(ex, ey + 3, 4.5, 6, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(27,13,34,.5)'; c.beginPath(); c.ellipse(ex + 1.5, ey + 4, 2, 3.5, 0.3, 0, TAU); c.fill(); } } c.restore();
    if (o.silhouette) o.silhouette(c, W, H, t, cam, T); }
  /* an egg: cream, in plum seams, toon-shaded (a hanging pod, a lobbed bomb) */
  function egg(c, x, y, r, o) { o = o || {}; FiendToon.shape(c, FiendToon.ell(x, y, r * 0.78, r, o.rot || 0), { col: o.col || CREAM, shade: CREAM_SH, hi: '#FFF6E0', line: INK, r, lw: o.lw || Math.max(1.2, r * 0.1), spec: 0.5, specAt: [x - r * 0.25, y - r * 0.5], force: true, inner: g => { g.save(); g.strokeStyle = o.seam || PLUM; g.lineWidth = Math.max(1, r * 0.1); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4 + (o.rot || 0); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.6, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 1.0); g.stroke(); } if (o.crack > 0.3) { g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.08); g.beginPath(); g.moveTo(x - r * 0.3, y - r * 0.6); g.lineTo(x - r * 0.05, y - r * 0.2); g.lineTo(x - r * 0.25, y + r * 0.1); g.lineTo(x + r * 0.1, y + r * 0.45); g.stroke(); } g.restore(); } }); }
  return { TAU, PLUM, PLUM_SH, PLUM_HI, ROSE, ROSE_SH, ROSE_HI, JADE, JADE_SH, JADE_HI, CREAM, CREAM_SH, GOLD, INK, decay, toward, snap, floor, sky, egg };
})();

/* ---------- ORRUBEL THE SEED-MOTHER ----------
   A colossal walking flower-bud: a bulb of overlapping plum petals the height of a house, carried on five thick jade
   roots that step and curl, a ring of cream egg pods swinging from its neck on stalks, and in the heart of the bud a
   single golden eye that only shows when the petals peel. It paces the Cradle Bed round the pet. Pollen Breath parts
   the crown and pours a cone of golden spores; Root Spears mark spots and roots burst up through them; Seed Bombs lob
   eggs that burst where they land (and hatch thornlings in the second phase); Petal Slam rears the whole bulb up and
   brings it down in a ring with gaps. Three Cradle Pods grow at the bed's edge: break one and it inhales, the petals
   peel open for six seconds and the eye is bared. In the second phase the pods grow back and the bombs hatch.
   It is never still: the bulb breathes, the roots step in turn (each a thud) and curl their tips, the eggs swing on
   their stalks with every step, the crown parts to sniff at the pet; before a breath it draws itself up and the crown
   parts, before a slam it rears back on its hind roots and comes down with overshoot, before the spears its roots dig
   in; struck, the bulb is squashed; peeled open, it sways dizzy and its roots curl in; it rears and roars on entering. */
RiftFiend.define({ id: 'orrubel', name: 'Orrubel', title: 'The Seed-Mother', color: '#2F183A', glow: '#FFD36B', accent: '#F2D8A1', biome: 'garden', r: 2.6, els: ['earth', 'dark'] }, (() => {
  const { TAU, TN, frame, tubeLite, ell, sorted, hit } = RiftFiend, G = GardenFiend;
  const { PLUM, PLUM_SH, PLUM_HI, ROSE, ROSE_SH, ROSE_HI, JADE, JADE_SH, JADE_HI, CREAM, CREAM_SH, GOLD, INK, decay, toward, snap } = G;
  const PETAL = '#4E2C68', PETAL_SH = '#2A1538', PETAL_HI = '#7E5398', BS = 0.95, ROOT_A = [-0.5, 0.5, 1.9, -1.9, Math.PI], POD_A = [Math.PI / 2 + 0.6, Math.PI / 2 + 0.6 + TAU / 3, Math.PI / 2 + 0.6 - TAU / 3];
  const podAt = (C, i) => [C.x + Math.cos(POD_A[i]) * (C.R - 2.4), C.y + Math.sin(POD_A[i]) * (C.R - 2.4)];
  return {
    arenaR: 15, firstAct: 'circle',
    artPoses: [{ name: 'pacing, side on', mem: { hd: 0.1, gait: 1, spdK: 1 } }, { name: 'drawing breath', mem: { hd: 1.57, inhale: 1, menace: 1 } }, { name: 'rearing to slam', mem: { hd: 1.57, rear: 1, menace: 1 } }, { name: 'peeled open: the eye bared', mem: { hd: 1.57, open: 1 } }],
    phaseNames: ['The Cradle Bed', 'The Hatching', 'The Brood Bed', 'The Last Seed'],
    paintGround(c, A) { G.floor(c, A, { extra: (c2, A2) => { const R = A2.R;
      // the cradle beds: three raised mounds of moss where the pods grow, and a ring of planted eggs round the middle
      POD_A.forEach(a => { const x = Math.cos(a) * (R - 2.4), y = Math.sin(a) * (R - 2.4); c2.fillStyle = '#3A2449'; c2.beginPath(); c2.ellipse(x, y + 0.2, 1.9, 1.1, 0, 0, TAU); c2.fill(); c2.strokeStyle = JADE_SH; c2.lineWidth = 0.18; c2.stroke(); c2.fillStyle = 'rgba(134,201,178,.18)'; c2.beginPath(); c2.ellipse(x, y + 0.1, 1.5, 0.8, 0, 0, TAU); c2.fill(); });
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, x = Math.cos(a) * 5.5, y = Math.sin(a) * 5.5; c2.fillStyle = 'rgba(242,216,161,.5)'; c2.beginPath(); c2.ellipse(x, y, 0.28, 0.36, 0, 0, TAU); c2.fill(); c2.strokeStyle = 'rgba(27,13,34,.6)'; c2.lineWidth = 0.06; c2.stroke(); }
      c2.strokeStyle = 'rgba(168,94,135,.3)'; c2.lineWidth = 0.3; c2.beginPath(); c2.arc(0, 0, 5.5, 0, TAU); c2.stroke(); } }); },
    sky(c, W, H, t, cam, T) { G.sky(c, W, H, t, cam, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem; FX.m.act = 'enter';
      Object.assign(M, { hd: Math.PI / 2, gait: 0, spdK: 0, open: 0, rear: 0, inhale: 0, breath: 0, menace: 0, crouch: 0, dig: 0, roar: 0, lunge: 0, slam: 0, slamT: 0, recoil: 0, blink: 0, blinkT: 2, sniff: 0, sniffT: 3, bt: 0, px: FX.m.x, py: FX.m.y, vx: 0, vy: 0, lean: 0, roll: 0, wasEnter: true, roared: false, lobs: [], pods: POD_A.map(() => ({ obj: null, respawnT: 0 })), broodT: 14, stepT: 0 });
      POD_A.forEach((a, i) => spawnPod(FX, i)); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; M.roar = 1; M.menace = 1; M.inhale = 0.6; M.broodT = 4; FX.H.shake(10, 0.5); FX.H.flash(0.2, GOLD); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - 4, GOLD, 18, 7);
      M.pods.forEach((h, i) => { if (!h.obj || h.obj.dead) { h.respawnT = 0; spawnPod(FX, i); } });
      for (let i = 0; i < 2; i++) { const a = FX.angPet(m.x, m.y) + (i - 0.5) * 0.9, p = FX.clampArena({ x: FX.me.x + Math.cos(a) * 3, y: FX.me.y + Math.sin(a) * 3 }, 1.5); lob(FX, m, p.x, p.y, 1.3 + i * 0.3, true); }
      if (lv >= 2) FX.H.banner('THE HATCHING', 'The seed bombs hatch thornlings; the pods grow back', GOLD, 2.4); if (lv >= 4) FX.H.banner('The Last Seed', 'Nothing it sows stays buried', '#FF6A5A', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, P = FX.S.lv, fast = (1 + (P - 1) * 0.1) * FX.S.fast, d = FX.dist(m.x, m.y), aPet = FX.angPet(m.x, m.y);
      M.pods.forEach((h, i) => { if ((!h.obj || h.obj.dead) && !h.respawnT && P >= 2) h.respawnT = 11; if (h.respawnT) { h.respawnT -= dt; if (h.respawnT <= 0) { h.respawnT = 0; spawnPod(FX, i); } } });
      m.actT += dt; let menace = 0, crouch = 0, inhale = 0, rear = 0, dig = 0;
      switch (m.act) {
        case 'circle': {   // paces round the pet, then chooses
          FX.circlePet(m, dt, 6.5, 3.6 * fast, { full: 5, stepK: 0.6 });
          if (m.actT > (P >= 3 ? 1.5 : 2.1)) { m.actT = 0; FX.mem.cDir = Math.random() < 0.5 ? 1 : -1;
            const r = Math.random(); if (d < 8.5 && r < 0.32) startBreath(FX, m); else if (r < 0.58) startSpears(FX, m); else if (r < 0.8 || d > 6) startBombs(FX, m); else startSlam(FX, m); }
          break; }
        case 'breath': { const drawn = m.actT < M.bw; menace = drawn ? 1 : 0.4; inhale = drawn ? 1 : 0; if (!drawn) { M.breath = Math.max(0, 1 - (m.actT - M.bw) / 0.9); if (M.breath > 0.1) for (let i = 0; i < 2; i++) { const a = M.ba + (Math.random() - 0.5) * 0.9, v = 7 + Math.random() * 4, top = crownAt(m, M); FX.H.part({ kind: 'glow', x: top[0], y: top[1] - top[2] + 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 2.5, life: 0.75, max: 0.75, size: 0.35 + Math.random() * 0.3, color: Math.random() < 0.3 ? CREAM : GOLD }); } }
          if (m.actT > M.bw + 1.0) { m.act = 'circle'; m.actT = 0; M.breath = 0; } break; }
        case 'spears': { menace = 0.7; crouch = m.actT < 1.0 ? Math.min(1, m.actT / 0.5) : 0; dig = crouch; if (m.actT > 1.9) { m.act = 'circle'; m.actT = 0; } break; }
        case 'bombs': { menace = 0.5; rear = m.actT < 0.5 ? m.actT / 0.5 * 0.4 : Math.max(0, 0.4 - (m.actT - 0.5)); if (m.actT > 1.6) { m.act = 'circle'; m.actT = 0; } break; }
        case 'slam': { const up = m.actT < M.sw; menace = up ? 1 : 0.2; rear = up ? Math.min(1, m.actT / (M.sw * 0.7)) : 0; if (m.actT > M.sw + 0.9) { m.act = 'circle'; m.actT = 0; } break; }
      }
      if (P >= 2 && (M.broodT -= dt) <= 0 && m.act === 'circle') { M.broodT = P >= 4 ? 10 : 15; for (let i = 0; i < 2; i++) { const a = aPet + (i - 0.5) * 1.6, p = FX.clampArena({ x: m.x + Math.cos(a) * 3.5, y: m.y + Math.sin(a) * 3.5 }, 1.5); lob(FX, m, p.x, p.y, 1.2 + i * 0.3, true); } FX.H.text(m.x, m.y - 4, 'It sows its brood', CREAM, 13); }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3); M.crouch = toward(M.crouch, crouch, dt, crouch > M.crouch ? 4 : 6); M.inhale = toward(M.inhale, inhale, dt, inhale > M.inhale ? 2 : 8); M.rear = toward(M.rear, rear, dt, rear > M.rear ? 2.2 : 9); M.dig = toward(M.dig, dig, dt, 4);
      if (m.act !== 'circle') M.spdK *= Math.pow(0.02, dt);
      // heading: side-on as it paces, square to the pet to strike
      const want = m.act === 'circle' ? aPet + (M.cDir || 1) * Math.PI / 2 : m.act === 'breath' ? M.ba : aPet; M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * (m.act === 'circle' ? 2.5 : 4)));
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.open = Math.min(1, M.open + dt * 2.2); M.inhale = decay(M.inhale, dt, 3); M.menace = decay(M.menace, dt, 4); M.rear = decay(M.rear, dt, 6); M.crouch = decay(M.crouch, dt, 4); M.breath = 0; const p = eyeAt(m, M); FX.weak('eye', p[0], p[1], 1.3, 2.4, m.stunT > 0.05);
      // dizzy: a seed falls now and then, the ground is pawed
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.5; FX.H.part({ kind: 'petal', x: m.x + FX.rnd(-2, 2), y: m.y - 3 + FX.rnd(-1, 1), vx: FX.rnd(-1, 1), vy: 1.5, g: 3, life: 1.2, max: 1.2, size: 4, rot: Math.random() * 3, color: ROSE_HI }); FX.H.shake(1.5, 0.08); }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return; M.bt += dt; if (!(m.stunT > 0)) { M.open = Math.max(0, M.open - dt * 1.8); if (FX.S.weak.eye) FX.weak('eye', 0, 0, 0, 0, false); }
      // where it is going: it leans into it and rocks with its stride
      if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt; M.px = m.x; M.py = m.y; M.vx = toward(M.vx, vx, dt, 8); M.vy = toward(M.vy, vy, dt, 8); }
      const hd = M.hd == null ? Math.PI / 2 : M.hd, fwd = M.vx * Math.cos(hd) + M.vy * Math.sin(hd), side = -M.vx * Math.sin(hd) + M.vy * Math.cos(hd);
      M.lean = toward(M.lean, -fwd * 0.03, dt, 6); M.roll = toward(M.roll, side * 0.03, dt, 6);
      // the gait: each root that lands thuds and shakes the moss a little
      const g0 = M.gait || 0; if (m.act !== 'circle' || !(M.spdK > 0.05)) M.gait = g0 + dt * 0.6; M.stepT -= dt;
      if (M.spdK > 0.3 && M.stepT <= 0 && !(M.open > 0.3)) { for (let i = 0; i < 5 && M.stepT <= 0; i++) { const ph0 = ((g0 + i * 1.26) % TAU + TAU) % TAU, ph1 = ((M.gait + i * 1.26) % TAU + TAU) % TAU; if (ph0 < Math.PI && ph1 >= Math.PI) { const W = budFrame(m, M), a = ROOT_A[i], ft = W(Math.cos(a) * 3.4, Math.sin(a) * 3.4, 0); for (let k = 0; k < 3; k++) FX.H.part({ kind: 'petal', x: ft[0] + FX.rnd(-0.3, 0.3), y: ft[1], vx: FX.rnd(-1.5, 1.5), vy: -1.5 - Math.random(), g: 6, life: 0.5, max: 0.5, size: 3, rot: Math.random() * 3, color: JADE_HI }); FX.H.shake(1 + M.spdK * 1.6, 0.07); if (Math.random() < 0.4) FX.H.sfx.thud(); M.stepT = 0.08; break; } } }
      // the follow-through of a slam, the roar, the recoil
      if (M.slam > 0) { M.slamT += dt; M.slam = M.slamT > 0.8 ? 0 : 1; } M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.5);
      if (m.act !== 'enter') M.lunge = decay(M.lunge, dt, 2.5);
      // the eye blinks when it shows; the crown parts to sniff at the pet now and then
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 2.5 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.13; M.blink = Math.sin(Math.min(1, M.blinkU) * Math.PI); if (M.blinkU >= 1) { M.blinkU = null; M.blink = 0; } }
      M.sniffT -= dt; if (M.sniffT <= 0) { M.sniffT = 2.5 + Math.random() * 3; M.sniffU = 0; } if (M.sniffU != null) { M.sniffU += dt / 0.9; M.sniff = Math.sin(Math.min(1, M.sniffU) * Math.PI) * 0.5; if (M.sniffU >= 1) { M.sniffU = null; M.sniff = 0; } }
      // the eggs it lobbed: arcs through the air to their marks
      for (let i = M.lobs.length - 1; i >= 0; i--) { const L = M.lobs[i]; L.t += dt; if (L.t >= L.dur) M.lobs.splice(i, 1); }
      // the entrance: it rises out of the bed, rears up on its hind roots with a roar, and comes down on all five
      if (m.act === 'enter') { const e = FX.S.enterT || 0; if (e > 1.4) { M.lunge = toward(M.lunge, 1, dt, 4); M.menace = toward(M.menace, 1, dt, 4); M.inhale = toward(M.inhale, 1, dt, 3); if (!M.roared) { M.roared = true; FX.H.sfx.crash(); FX.H.shake(6, 0.3); } } }
      else if (M.wasEnter) { M.wasEnter = false; M.slam = 1; M.slamT = 0; M.inhale = 0; FX.H.sfx.thud(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; FX.H.part({ kind: 'petal', x: m.x + Math.cos(a) * 3, y: m.y + Math.sin(a) * 1.8, vx: Math.cos(a) * 3, vy: -2, g: 6, life: 0.6, max: 0.6, size: 4, rot: a, color: JADE_HI }); } } },
    dmgK(FX, m) { return 1; },
    keep: { steps: 2, pad: 2.5 },
    draw(c, FX, m, X, Y, T, t, step) { drawBud(c, FX, m, X, Y, T, t, step); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'pod') drawPod(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { const M = FX.mem; if (!M.lobs) return; for (const L of M.lobs) { const u = Math.min(1, L.t / L.dur), x = L.x0 + (L.x1 - L.x0) * u, y = L.y0 + (L.y1 - L.y0) * u, h = 4 * u * (1 - u) * L.h, X = FX.sx(x), Y = FX.sy(y); c.save(); c.fillStyle = 'rgba(10,6,4,.3)'; c.beginPath(); c.ellipse(X, Y, T * 0.4 * (1 - h * 0.08), T * 0.18 * (1 - h * 0.08), 0, 0, TAU); c.fill(); G.egg(c, X, Y - h * T, T * 0.45, { rot: L.t * 3 }); c.restore(); } },
  };
  /* ---- pieces of the fight ---- */
  function spawnPod(FX, i) { const p = podAt(FX.C, i), h = FX.mem.pods[i]; h.obj = FX.obj({ kind: 'pod', x: p[0], y: p[1], r: 0.9, hp: FX.S.barHP * 0.03, idx: i, onKill: o => { const m = FX.m; if (!m || m.dead) return; FX.H.boom(o.x, o.y, 1.3, CREAM, '#FFFFFF', { n: 16, shake: 7 }); for (let k = 0; k < 8; k++) FX.H.part({ kind: 'petal', x: o.x, y: o.y - 1, vx: FX.rnd(-3, 3), vy: FX.rnd(-4, -1), g: 7, life: 0.8, max: 0.8, size: 4, rot: Math.random() * 3, color: CREAM }); FX.H.sfx.crack(); startOpen(FX, m); } }); }
  function startOpen(FX, m) { const M = FX.mem; m.stunT = 6; m.act = 'circle'; m.actT = 0; M.inhale = 1; M.breath = 0; M.rear = 0; FX.S.tele.length = 0; M.lobs.length = 0; FX.H.banner('THE PETALS PEEL', 'It inhales and opens: strike the golden eye!', GOLD, 2, true); FX.H.shake(10, 0.5); FX.H.sfx.hum(); FX.H.sparks(m.x, m.y - 4, GOLD, 16, 6); }
  function startBreath(FX, m) { const M = FX.mem, a = FX.angPet(m.x, m.y), wait = 1.1 / FX.S.fast; M.ba = a; M.bw = wait; m.act = 'breath'; m.actT = 0; FX.H.sfx.hum(); FX.tele({ shape: 'cone', x: m.x, y: m.y, a, len: 8.5, spread: 0.5, t: wait, dmg: m.dmg * 1.5, col: GOLD, fn: s => { M.breath = 1; M.recoil = 0.6; FX.H.sfx.whoosh(); FX.H.beamFx && FX.H.beamFx(s.x, s.y, s.a, s.len, CREAM); FX.H.shake(5, 0.3); } }); FX.H.banner('POLLEN BREATH', 'Out of the cone', GOLD, 1.3, true); }
  function startSpears(FX, m) { const M = FX.mem, P = FX.S.lv, me = FX.me, n = P >= 2 ? 6 : 4; m.act = 'spears'; m.actT = 0; FX.H.sfx.hum();
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, dd = i === 0 ? 0 : 1.2 + Math.random() * 3.2, p = FX.clampArena({ x: me.x + Math.cos(a) * dd, y: me.y + Math.sin(a) * dd }, 1); FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.25, t: 1.0 + i * 0.12, dmg: m.dmg * 1.4, col: JADE_HI, fn: s => { FX.H.part({ kind: 'spike', x: s.x, y: s.y, life: 0.9, max: 0.9, size: 2.2, color: JADE }); FX.H.shake(5, 0.2); FX.H.sfx.crack(); for (let k = 0; k < 5; k++) FX.H.part({ kind: 'petal', x: s.x, y: s.y, vx: FX.rnd(-3, 3), vy: FX.rnd(-5, -2), g: 8, life: 0.6, max: 0.6, size: 3, rot: Math.random() * 3, color: '#3A2449' }); } }); }
    FX.H.banner('ROOT SPEARS', 'Off the marked moss', JADE_HI, 1.3, true); }
  function startBombs(FX, m) { const M = FX.mem, P = FX.S.lv, me = FX.me; m.act = 'bombs'; m.actT = 0; FX.H.sfx.hum(); const n = 3;
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, dd = i === 0 ? 0.6 : 1.5 + Math.random() * 3, p = FX.clampArena({ x: me.x + Math.cos(a) * dd, y: me.y + Math.sin(a) * dd }, 1.2); lob(FX, m, p.x, p.y, 1.3 + i * 0.25, P >= 2); }
    FX.H.banner('SEED BOMBS', P >= 2 ? 'Eggs that hatch: break them or step away' : 'Eggs that burst where they land', CREAM, 1.3, true); }
  // an egg lobbed from the crown to a mark: it bursts there (and, hatching, leaves an egg that becomes a thornling)
  function lob(FX, m, x, y, dur, hatch) { const M = FX.mem, top = crownAt(m, M); M.lobs.push({ x0: top[0], y0: top[1] - top[2], x1: x, y1: y, t: 0, dur, h: 3 });
    FX.tele({ shape: 'circle', x, y, r: 1.3, t: dur, dmg: m.dmg * 1.2, col: CREAM, fn: s => { FX.H.boom(s.x, s.y, 1.1, CREAM, '#FFFFFF', { n: 12, shake: 4 }); FX.H.sfx.pop(); if (hatch && FX.m && !FX.m.dead) { const e = FX.minion('egg', s.x, s.y); if (e) { e.life = 3.2; e.aggro = true; } } } }); }
  function startSlam(FX, m) { const M = FX.mem, wait = 1.1 / FX.S.fast; M.sw = wait; m.act = 'slam'; m.actT = 0; FX.H.sfx.hum(); const gaps = [[Math.random() * TAU, 0.4], [Math.random() * TAU, 0.4]];
    FX.tele({ shape: 'ring', x: m.x, y: m.y, r0: 1.2, r1: 6, gaps, t: wait, dmg: m.dmg * 1.7, col: ROSE_HI, fn: s => { M.slam = 1; M.slamT = 0; FX.H.shake(12, 0.5); FX.H.sfx.crash(); FX.H.boom(s.x, s.y, 2.5, ROSE_HI, '#FFFFFF', { n: 22, shake: 10, smoke: 6 }); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; FX.H.part({ kind: 'petal', x: s.x + Math.cos(a) * 3, y: s.y + Math.sin(a) * 2, vx: Math.cos(a) * 4, vy: -3, g: 7, life: 0.7, max: 0.7, size: 5, rot: a, color: ROSE_HI }); } } });
    FX.H.banner('PETAL SLAM', 'Through a gap in the ring, or in close', ROSE_HI, 1.4, true); }
  /* ---- the bud in three dimensions ---- */
  function budFrame(m, M) { const open = M.open || 0, hs = m.hitSq || 0, lunge = M.lunge || 0, slam = M.slam > 0 ? snap(Math.min(1, M.slamT / 0.8)) : 0, roar = M.roar || 0, bt = M.bt || 0, rear = M.rear || 0, crouch = M.crouch || 0;
    // breathing lifts it; a crouch and a slam press it down; a rear lifts it and tips it back; struck, it flinches
    const z = 0.1 + Math.sin(bt * 1.3) * 0.04 - crouch * 0.3 - slam * 0.35 + rear * 0.5 + lunge * (m.act === 'enter' ? 0.6 : 0.2) - hs * 0.12 + open * Math.sin(bt * 2.2) * 0.05;
    const pitch = (M.lean || 0) + rear * 0.55 + (m.act === 'enter' ? lunge * 0.5 : 0) - slam * 0.12 + (M.recoil || 0) * 0.2 + hs * 0.08 + roar * 0.15 - crouch * 0.1;
    const roll = (M.roll || 0) + Math.sin(M.gait || 0) * 0.05 * (M.spdK || 0) + open * Math.sin(bt * 2.4) * 0.1;
    const scale = BS * (1 + Math.sin(bt * 1.3) * 0.02 + roar * 0.08 + hs * 0.06 - crouch * 0.03);
    return frame(m, M.hd == null ? Math.PI / 2 : M.hd, { z, pitch, roll, scale }); }
  function crownAt(m, M) { const W = budFrame(m, M); return W(0, 0, 5.0 - (M.open || 0) * 2.2); }
  function eyeAt(m, M) { const W = budFrame(m, M), p = W(0.6, 0, 3.2); return [p[0], p[1] - p[2]]; }
  function bodyParts(m, M) { const W = budFrame(m, M), b = W(0, 0, 2.6), n = W(0, 0, 1.2); return [hit('bulb', b, 2.4, m), hit('neck', n, 2.0, m)]; }
  function drawPod(c, FX, o, X, Y, T, t) { const cracked = 1 - o.hp / o.maxhp, sw = Math.sin(t * 1.6 + o.idx * 2) * 0.08;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + 0.15 * Math.sin(t * 4 + o.idx); blitSized(c, glowSprite(CREAM), X - T * 1.5, Y - T * 2.6, T * 3, T * 3); c.restore();
    // the stalk, and leaves at its foot
    c.save(); c.strokeStyle = INK; c.lineWidth = Math.max(2, T * 0.3); c.lineCap = 'round'; c.beginPath(); c.moveTo(X, Y); c.quadraticCurveTo(X + sw * T * 3, Y - T * 0.9, X + sw * T * 2, Y - T * 1.4); c.stroke(); c.strokeStyle = JADE; c.lineWidth = Math.max(1, T * 0.18); c.stroke();
    [-1, 1].forEach(sd => TN.shape(c, TN.blob([[X, Y + T * 0.1], [X + sd * T * 0.5, Y - T * 0.35], [X + sd * T * 1.1, Y - T * 0.2], [X + sd * T * 0.6, Y + T * 0.2]]), { col: JADE, shade: JADE_SH, hi: JADE_HI, line: INK, r: T * 0.5, lw: Math.max(1.2, T * 0.06), force: true }));
    G.egg(c, X + sw * T * 2, Y - T * 2.1, T * 0.8 * (1 + Math.sin(t * 3 + o.idx) * 0.02), { rot: sw * 0.5, crack: cracked, lw: Math.max(1.4, T * 0.08) });
    c.restore(); }
  function drawBud(c, FX, m, X, Y, T0, t, step) {
    const go = i => step == null || step === i, T = T0 * BS, K = FX.K, M = FX.mem, P3 = TN.cam(X, Y, T0, m), W = budFrame(m, M), bt = M.bt || t, gait = M.gait || 0, spd = M.spdK || 0, open = M.open || 0, hs = m.hitSq || 0;
    const menace = M.menace || 0, crouch = M.crouch || 0, roar = M.roar || 0, inhale = M.inhale || 0, breath = M.breath || 0, rear = M.rear || 0, dig = M.dig || 0, lunge = m.act === 'enter' ? (M.lunge || 0) : 0, br = Math.sin(bt * 1.3), me = FX.me || { x: m.x, y: m.y + 5 };
    const lw = Math.max(1.4, T * 0.08), parts = [];
    const jade = r => ({ col: JADE, shade: JADE_SH, hi: JADE_HI, line: INK, r, lw, d1: 0.1, d2: 0.24, spec: false, force: true });
    // the roots: five, from the bulb's underside to feet on the moss, each lifting and curling its tip as it steps; they dig
    // in (knees high, feet close) before the spears, spread wide in a rear and a roar, and curl in under it when it is open
    for (let i = 0; i < 5; i++) { const a = ROOT_A[i], ca = Math.cos(a), sa = Math.sin(a), ph = gait + i * 1.26, lift = Math.max(0, Math.sin(ph)) * (0.3 + spd * 0.45) * (1 - open * 0.7), spread = 1 + roar * 0.1 + lunge * 0.15 + rear * (ca < 0 ? -0.1 : 0.2) - dig * 0.15 - open * 0.2 - crouch * 0.1, stride = Math.cos(ph) * 0.35 * spd;
      const sh = W(ca * 1.1, sa * 1.1, 1.4 - crouch * 0.1), kn = W(ca * 2.5 * spread, sa * 2.5 * spread, 1.5 + lift * 0.5 + dig * 0.6 - crouch * 0.3 + open * 0.3), ft = W(ca * 3.4 * spread + stride, sa * 3.4 * spread, lift * 0.6 + open * 0.2), tip = W(ca * (3.9 - open * 0.6) * spread + stride, sa * (3.9 - open * 0.6) * spread, 0.3 + lift * 0.4 + Math.sin(bt * 2 + i) * 0.06 + open * 0.5);
      parts.push({ at: ft, draw: () => { tubeLite(c, P3, [sh, [(sh[0] + kn[0]) / 2, (sh[1] + kn[1]) / 2, (sh[2] + kn[2]) / 2 + 0.2], kn, [(kn[0] + ft[0]) / 2, (kn[1] + ft[1]) / 2, (kn[2] + ft[2]) / 2], ft, tip], u => T * (0.6 - u * 0.46), jade(T * 0.6));
        // knobs along the root
        const q = P3(kn[0], kn[1], kn[2]); c.fillStyle = JADE_SH; c.beginPath(); c.arc(q[0] + T * 0.1, q[1] + T * 0.08, T * 0.07, 0, TAU); c.arc(q[0] - T * 0.12, q[1] - T * 0.04, T * 0.05, 0, TAU); c.fill(); } }); }
    // the egg pods on their stalks round the neck, swinging with the stride and lagging the drift
    const lagx = -(M.vx || 0) * 0.06, lagy = -(M.vy || 0) * 0.06;
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3, ca = Math.cos(a), sa = Math.sin(a), sw = Math.sin(bt * 2.4 + i * 1.3) * 0.12 * (1 + spd) + Math.sin(gait) * 0.1 * spd, root = W(ca * 1.5, sa * 1.5, 1.6 - crouch * 0.1), e = W(ca * 2.05 + lagx + ca * sw, sa * 2.05 + lagy + sa * sw, 0.95 - crouch * 0.1 + Math.abs(sw) * 0.2);
      parts.push({ at: e, draw: () => { const q0 = P3(root[0], root[1], root[2]), q1 = P3(e[0], e[1], e[2] + 0.35); c.strokeStyle = INK; c.lineWidth = Math.max(1.5, T * 0.12); c.lineCap = 'round'; c.beginPath(); c.moveTo(q0[0], q0[1]); c.quadraticCurveTo((q0[0] + q1[0]) / 2, q0[1] + T * 0.1, q1[0], q1[1]); c.stroke(); c.strokeStyle = JADE; c.lineWidth = Math.max(1, T * 0.06); c.stroke(); const q = P3(e[0], e[1], e[2]); G.egg(c, q[0], q[1], T * 0.42, { rot: sw * 0.6, lw: Math.max(1.2, T * 0.06) }); } }); }
    // the bulb and its petals: six petals wrapped round a plum heart, closed to a point above; they part at the crown to
    // sniff or draw breath, and peel right down and out when it is opened; the heart breathes, and is squashed by a blow
    const part = Math.min(1, open + (M.sniff || 0) * 0.4 + inhale * 0.35 + breath * 0.5 + roar * 0.4 + lunge * 0.5), heart = W(0, 0, 2.5 - crouch * 0.1), hp = P3(heart[0], heart[1], heart[2]);
    parts.push({ at: heart, heart: true, draw: () => { ell(c, P3, W.th, heart, [1.75 * BS * (1 + br * 0.02 + hs * 0.08 + inhale * 0.06), 1.75 * BS * (1 + br * 0.02 + hs * 0.08 + inhale * 0.06), 2.1 * BS * (1 - br * 0.02 - hs * 0.14 + roar * 0.08 + inhale * 0.1)], { T: T0, col: open > 0.3 ? K.mixC(PLUM_HI, ROSE_SH, Math.min(1, (open - 0.3) / 0.5)) : PLUM_HI, shade: PLUM_SH, hi: K.mixC(PLUM_HI, ROSE_HI, 0.5), line: INK, r: T * 2, lw, d1: 0.1, d2: 0.22, spec: 0.3, force: true, inner: g => { g.save(); g.strokeStyle = 'rgba(27,13,34,.5)'; g.lineWidth = Math.max(1, T * 0.05); for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(hp[0] + i * T * 0.5, hp[1] + T * 1.9); g.quadraticCurveTo(hp[0] + i * T * 0.9, hp[1] - T * 0.2, hp[0] + i * T * 0.3, hp[1] - T * 2.0); g.stroke(); } g.restore(); } });
      // the eye in the heart: golden, watching the pet, blinking; dizzy when it is bared
      if (open > 0.3) { const k = Math.min(1, (open - 0.3) / 0.5), ep = P3(heart[0] + W.cf * 0.6, heart[1] + W.sf * 0.6, heart[2] + 0.7), dx = me.x - m.x, dy = me.y - m.y, dl = Math.hypot(dx, dy) || 1, dizzy = m.stunT > 0 || open > 0.9;
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * (0.5 + 0.2 * Math.sin(t * 5)); blitSized(c, glowSprite(GOLD), ep[0] - T * 1.8, ep[1] - T * 1.8, T * 3.6, T * 3.6); c.restore();
        TN.eye(c, ep[0], ep[1], T * 0.8 * k, { iris: GOLD, white: '#FFF4D6', line: INK, look: dizzy ? [Math.cos(bt * 6) * 0.7, Math.sin(bt * 6) * 0.5] : [dx / dl * 0.7, Math.max(-0.4, dy / dl) * 0.6], blink: Math.max(M.blink || 0, hs * 0.6), lid: PLUM_HI, brow: 0.3 + menace * 0.8, pupilR: 0.42 + (dizzy ? 0.12 : 0), squash: 0.9 }); } } });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6, ca = Math.cos(a), sa = Math.sin(a), ta = -sa, tb = ca, k = open, flutter = Math.sin(bt * 2 + i * 1.1) * 0.06 * (1 + breath * 3) + hs * 0.1;
      const rb = 1.45, zb = 1.7, rm = 1.9 + k * 0.9 + part * 0.15, zm = 3.3 + k * 0.4, rt = 0.3 + k * 3.0 + part * 0.9 * (1 - k) + flutter, zt = 5.1 - k * 2.6 - part * 0.4 * (1 - k), wb = 0.6, wm = 0.95 - k * 0.15, wt = 0.15 + k * 0.4;
      const pt = (r, z, w) => W(ca * r + ta * w, sa * r + tb * w, z), pts = [pt(rb, zb, -wb), pt(rm, zm, -wm), pt(rt, zt, -wt), pt(rt + 0.1, zt + 0.1 - k * 0.3, 0), pt(rt, zt, wt), pt(rm, zm, wm), pt(rb, zb, wb)], mid = pt(rm, zm, 0);
      parts.push({ at: [mid[0], mid[1] + 0.3, mid[2]], draw: () => { const sp = pts.map(p => P3(p[0], p[1], p[2])), facing = (sp[1][1] + sp[5][1]) / 2 > hp[1], col = K.mixC(PETAL, ROSE, facing ? k * 0.9 : k * 0.3), q = P3(mid[0], mid[1], mid[2]);
        TN.shape(c, TN.blob(sp), { col, shade: K.mixC(PETAL_SH, ROSE_SH, k * 0.6), hi: K.mixC(PETAL_HI, ROSE_HI, k * 0.5), line: INK, r: T * 1.1, lw, d1: 0.1, d2: 0.2, spec: 0.25, specAt: [q[0] - T * 0.3, q[1] - T * 0.8], force: true, inner: g => { g.save(); g.strokeStyle = 'rgba(27,13,34,.45)'; g.lineWidth = Math.max(1, T * 0.05); g.beginPath(); g.moveTo(sp[6][0], sp[6][1]); g.quadraticCurveTo(q[0], q[1], sp[3][0], sp[3][1]); g.stroke(); g.strokeStyle = 'rgba(217,143,181,.35)'; g.lineWidth = Math.max(1, T * 0.04); g.beginPath(); g.moveTo(sp[0][0], sp[0][1]); g.quadraticCurveTo(sp[1][0] + T * 0.2, sp[1][1], sp[2][0], sp[2][1]); g.stroke(); if (k > 0.3) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = (k - 0.3) * 0.4; blitSized(g, glowSprite(GOLD), q[0] - T, q[1] - T, T * 2, T * 2); } g.restore(); } }); } }); }
    // far to near, the heart in its place among them; the picture in two steps: up to the heart, then the rest
    const list = sorted(parts), hi = list.findIndex(p => p.heart);
    if (go(0)) { TN.groundShadow(c, X, Y + T * 0.3, T * 3.4 * (1 + roar * 0.1), T * 1.9, 0, 0.5); list.slice(0, hi + 1).forEach(p => p.draw()); }
    if (go(1)) { list.slice(hi + 1).forEach(p => p.draw());
      // the crown: spores glow between the parted petals as it draws and loosens breath, and in a roar
      const cr = W(0, 0, 4.6 - open * 2.0), cq = P3(cr[0], cr[1], cr[2]); if (part > 0.15) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = part * (0.4 + 0.3 * Math.sin(t * 9)) * (1 - open * 0.5); const r = T * (0.8 + part * 1.2 + breath * 0.8); blitSized(c, glowSprite(GOLD), cq[0] - r, cq[1] - r, r * 2, r * 2); c.restore(); }
      if (menace > 0.05 && open < 0.3) for (let i = 0; i < 3; i++) { const ph = (bt * 0.8 + i * 0.33) % 1; TN.twinkle(c, cq[0] + Math.sin(i * 2.1 + bt) * T * 0.5, cq[1] - ph * T * 1.2, T * 0.12 * menace, GOLD, (1 - ph) * menace); }
      // a roar, or the lunge of its landing: a flare of gold about it
      if (roar > 0 || lunge > 0) { const k = Math.max(roar, lunge); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * 0.3; blitSized(c, glowSprite(GOLD), hp[0] - T * 4, hp[1] - T * 3.5, T * 8, T * 7); c.restore(); }
      if (open > 0.6) for (let i = 0; i < 3; i++) { const a = bt * 3 + i * TAU / 3; TN.twinkle(c, cq[0] + Math.cos(a) * T * 1.6, cq[1] - T * 0.6 + Math.sin(a) * T * 0.4, T * 0.2, '#FFFFFF', 0.9); } }
  }
})());
