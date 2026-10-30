/* ---------- Lightning, reworked: Sparkling Wide Pressure, Ragnarok (Ultimates 3 and 4) ----------
   Sparkling Wide Pressure: electrical beads gather round the pet, stretch into flat rims and tilt upright into rolling
   thunder wheels. Each wheel is a real upright disc in 3D: its face (spokes, rim teeth, inner rings) is one cached sprite
   drawn through the affine map of the disc's plane, so it foreshortens and its spokes turn in perspective as the wheel
   rolls, banks into its turns and changes heading; the brilliant rim is stroked as that ellipse in two halves (the far
   half dim, behind the face; the near half bright, in front) with a tyre of two thin offset rims; a churning sphere of
   light at the hub; sparks spray back from the contact point, twin violet tracks fade behind; a hit bends the spokes
   back, then they spring into shape. Level 1: four wheels, one rim, four curved spokes. Level 4: ten wheels weaving on
   alternating curved routes with a counter-rotating inner ring. Level 7: sixteen in two waves of eight, three nested
   rims, petal spokes, golden leading edges, homing turns in their final second and a staggered collapse into spinning
   discs of sparks.
   Ragnarok: the pet braces, charged fragments lift from the floor and become the angular plates of a colossal spirit
   hammer assembling high over the target round a white-hot core on a spectral handle; it hangs tilted back while small
   arcs reach down, swings with heavy acceleration trailing ribbons, the light compresses under its face, then erupts in
   a thick radial shockwave and branching ground discharges. Ordinary monsters are paralysed 10 s (a boss at most 1 s).
   Level 4: a broader head, a gyroscopic core, a wider blast. Level 7: a monumental head of floating outer plates round a
   rotating core that close into one striking face on the way down, a crown of lightning across the floor, an electric
   dome breaking into descending sparks, the hammer left embedded in its glowing mark before it disintegrates. */
(() => {
  const U = ELEM_IMPL.thunder.ult, TAU = Math.PI * 2, P = TK.P;
  let H, K;
  const cl = u => Math.max(0, Math.min(1, u)), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const outB = u => { u = cl(u); const s = 1.6, v = u - 1; return v * v * ((s + 1) * v + s) + 1; };
  const CZ = 0.84;   // how much a height shows on screen for the wheels' true 3D (the floor's squash is H.GY)
  const mk = (w, h) => { const e = document.createElement('canvas'); e.width = w; e.height = h; return e; };
  /* the pet's body on screen; clip a draw to everything except it so nothing of a move covers the pet */
  function petHole(c, T) { const me = H.me, x = H.sx(me.x), y = H.sy(me.y) - T * 0.46; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, T * 0.6, T * 0.7, 0, 0, TAU); c.clip('evenodd'); }
  const rgba = (h, a) => H.rgba(h, a);

  /* ---------------- cached sprites ---------------- */
  const WS = 128, WR = 50, SK = 0.6, SS = Math.round(WS * SK);   // a wheel-face sprite's drawing space (rim radius WR in it), kept at SK of that so it stays near its size on screen
  const BENDS = [-0.5, 0, 0.45, 0.9, 1.35];
  const SPR = {};
  /* a wheel's face: a faint translucent disc, the spokes (style 1-2 four curved spokes, style 3 six petals with golden
     leading edges), rim teeth that show the rotation, a hub ring. Rolling turns the sprite clockwise in its own plane, so
     the spokes sweep back (their tips lag); bend sweeps them further back after a hit (negative: the spring-back) */
  function wheelSprite(style, bi) {
    const key = 'w' + style + '_' + bi; if (SPR[key]) return SPR[key];
    const e = mk(SS, SS), c = e.getContext('2d'), bend = BENDS[bi]; c.scale(SK, SK); c.translate(WS / 2, WS / 2); c.lineCap = 'round'; c.lineJoin = 'round';
    const rgb = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
    let g = c.createRadialGradient(0, 0, WR * 0.15, 0, 0, WR); g.addColorStop(0, rgb(P.cyan, 0.14)); g.addColorStop(0.55, rgb(P.blue, 0.12)); g.addColorStop(0.92, rgb(P.violet, 0.3)); g.addColorStop(1, rgb(P.violet, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, WR, 0, TAU); c.fill();
    const ns = style === 3 ? 6 : 4, cur = (style === 3 ? 0.8 : 1.05) + bend * 0.75, r0 = 0.2, sp = (s, a0, off) => { const r = WR * (r0 + (0.97 - r0) * s), b = a0 + cur * Math.pow(s, 1.25) + (off || 0) / Math.max(4, r); return [Math.cos(b) * r, Math.sin(b) * r]; };
    for (let k = 0; k < ns; k++) {
      const a0 = k / ns * TAU;
      if (style === 3) {   // a petal: a lens of light, its leading side gold, its trailing side violet, a white midrib
        const L = [], R = []; for (let j = 0; j <= 12; j++) { const s = j / 12, w = WR * 0.12 * Math.sin(Math.PI * Math.pow(s, 0.8)); L.push(sp(s, a0, -w)); R.push(sp(s, a0, w)); }
        c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (const p of L) c.lineTo(p[0], p[1]); for (let j = R.length - 1; j >= 0; j--) c.lineTo(R[j][0], R[j][1]); c.closePath(); c.fillStyle = rgb(P.blue, 0.2); c.fill();
        c.strokeStyle = rgb(P.violet, 0.5); c.lineWidth = 9; c.beginPath(); R.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.strokeStyle = rgb(P.cyan, 0.9); c.lineWidth = 3.4; c.beginPath(); R.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
        c.strokeStyle = rgb(P.amber, 0.45); c.lineWidth = 6; c.beginPath(); L.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.strokeStyle = rgb(P.gold, 1); c.lineWidth = 3.4; c.stroke();
        c.strokeStyle = rgb(P.white, 0.95); c.lineWidth = 2.2; c.beginPath(); for (let j = 1; j <= 11; j++) { const p = sp(j / 12, a0); j > 1 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
      } else {   // a curved spoke: violet haze, blue, cyan, a white-hot line
        const pts = []; for (let j = 0; j <= 10; j++) pts.push(sp(j / 10, a0));
        [[P.violet, 0.5, 15], [P.blue, 0.7, 9], [P.cyan, 0.85, 4.4], [P.white, 0.85, 1.4]].forEach(([col, a, w]) => { c.strokeStyle = rgb(col, a); c.lineWidth = w; c.beginPath(); pts.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); });
      }
    }
    // rim teeth (show the rim turning): bright arcs on the rim, gold between at style 3
    const nt = style === 3 ? 8 : style === 2 ? 10 : 8;
    for (let k = 0; k < nt; k++) { const b = k / nt * TAU + 0.2, gold = style === 3 && k % 2; c.strokeStyle = rgb(gold ? P.amber : P.blue, 0.6); c.lineWidth = 11; c.beginPath(); c.arc(0, 0, WR * 0.94, b, b + 0.24); c.stroke(); c.strokeStyle = rgb(gold ? P.gold : P.white, 1); c.lineWidth = 4.2; c.stroke(); }
    c.strokeStyle = rgb(P.ice, 0.9); c.lineWidth = 3.5; c.beginPath(); c.arc(0, 0, WR * r0, 0, TAU); c.stroke();
    return (SPR[key] = e);
  }
  /* an inner rim (turning against the wheel): a broken ring of light with bright nodes; gold at style 3's outer one */
  function ringSprite(rr, gaps, gold) {
    const key = 'r' + rr + '_' + gaps + (gold ? 'g' : ''); if (SPR[key]) return SPR[key];
    const e = mk(SS, SS), c = e.getContext('2d'); c.scale(SK, SK); c.translate(WS / 2, WS / 2); c.lineCap = 'round'; const r = WR * rr, seg = TAU / gaps;
    const rgb = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
    for (let k = 0; k < gaps; k++) { const b0 = k * seg + 0.18, b1 = (k + 1) * seg - 0.18; c.strokeStyle = rgb(P.violet, 0.55); c.lineWidth = 12; c.beginPath(); c.arc(0, 0, r, b0, b1); c.stroke(); c.strokeStyle = rgb(gold ? P.gold : P.cyan, 1); c.lineWidth = 5; c.stroke(); c.strokeStyle = rgb(P.white, 0.95); c.lineWidth = 2; c.stroke();
      c.fillStyle = rgb(P.white, 1); c.beginPath(); c.arc(Math.cos(b1) * r, Math.sin(b1) * r, 4, 0, TAU); c.fill(); }
    return (SPR[key] = e);
  }
  /* a shaded sphere of light (lit upper left): the wheels' churning cores and the hammer's core */
  function coreSprite(gold) {
    const key = 'c' + (gold ? 'g' : ''); if (SPR[key]) return SPR[key];
    const S = 96, e = mk(S, S), c = e.getContext('2d'), o = S / 2, r = S * 0.46;
    const rgb = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
    const g = c.createRadialGradient(o - r * 0.32, o - r * 0.36, r * 0.04, o, o, r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.22, rgb(P.ice, 1)); g.addColorStop(0.55, rgb(gold ? P.gold : P.cyan, 0.95)); g.addColorStop(0.85, rgb(P.blue, 0.85)); g.addColorStop(1, rgb(P.deep, 0.6));
    c.fillStyle = g; c.beginPath(); c.arc(o, o, r, 0, TAU); c.fill();
    c.strokeStyle = rgb(P.white, 0.5); c.lineWidth = r * 0.1; c.beginPath(); c.arc(o, o, r * 0.86, 3.6, 5.0); c.stroke();
    return (SPR[key] = e);
  }
  const blit = (c, img, x, y, r) => c.drawImage(img, x - r, y - r, r * 2, r * 2);

  /* ================= 3. Sparkling Wide Pressure ================= */
  /* the screen vector of a world direction (x, y on the floor, z up) per tile */
  const pv = (v, T) => [v[0] * T, (v[1] * H.GY - v[2] * CZ) * T];
  /* a wheel's frame: f along its heading, v its up (leaned by lam toward its side a), n its axle. The visible heading is
     kept off straight up/down the screen so a wheel rolling toward or away from the camera still shows its face a little */
  function frame(h, lam) {
    let cx = Math.cos(h), cy = Math.sin(h); if (Math.abs(cx) < 0.6) { cx = (cx < 0 ? -1 : 1) * 0.6; cy = (cy < 0 ? -1 : 1) * 0.8; }
    const f = [cx, cy, 0], a = [-cy, cx, 0], sL = Math.sin(lam), cL = Math.cos(lam), v = [a[0] * sL, a[1] * sL, cL];
    return { f, a, v, n: [f[1] * v[2], -f[0] * v[2], f[0] * v[1] - f[1] * v[0]] };
  }
  /* one wheel, its hub at screen (X, Y): r world radius, phi spin, sc spokes' presence, a alpha */
  function drawWheel(c, w, X, Y, T, t) {
    const F = frame(w.vh, w.lam), R = w.r, RT = R * T, a = w.a; if (RT < 1 || a < 0.02) return;
    const pu = pv(F.f, T), pw = pv(F.v, T), pn = pv(F.n, T), Vc = [0, CZ, H.GY];
    const dA = F.f[1] * Vc[1] + F.f[2] * Vc[2], dB = F.v[1] * Vc[1] + F.v[2] * Vc[2], psi = Math.atan2(dB, dA);
    const ell = (ox, oy, rr, a0, a1) => { c.save(); c.transform(pu[0] * R * rr, pu[1] * R * rr, pw[0] * R * rr, pw[1] * R * rr, X + ox, Y + oy); c.beginPath(); c.arc(0, 0, 1, a0, a1); c.restore(); };
    const tw = 0.11 * R, gold = w.style === 3;
    c.globalCompositeOperation = 'lighter';
    K.glow(c, X, Y, RT * 2.0, P.violet, 0.3 * a); K.glow(c, X, Y, RT * 1.3, P.blue, 0.22 * a);
    // the far half of the rim (dim, behind the face) and the far half of the tyre
    c.globalAlpha = 0.55 * a; c.lineCap = 'round';
    ell(0, 0, 1, psi + Math.PI / 2, psi + Math.PI * 1.5); c.strokeStyle = P.violet; c.lineWidth = Math.max(1.5, RT * 0.16); c.stroke(); c.strokeStyle = P.blue; c.lineWidth = Math.max(1, RT * 0.06); c.stroke();
    ell(pn[0] * tw, pn[1] * tw, 1, psi + Math.PI / 2, psi + Math.PI * 1.5); c.strokeStyle = P.violet; c.lineWidth = Math.max(1, RT * 0.04); c.stroke();
    // the face, through the disc's plane (rotating inner rims first)
    c.globalAlpha = a; const M = [pu[0] * R / (WR * SK), pu[1] * R / (WR * SK), pw[0] * R / (WR * SK), pw[1] * R / (WR * SK)];
    const face = (img, rot, al) => { if (!(al > 0.01)) return; c.save(); c.globalAlpha = al; c.globalCompositeOperation = 'source-over'; c.transform(M[0], M[1], M[2], M[3], X, Y); c.rotate(rot); c.drawImage(img, -SS / 2, -SS / 2); c.restore(); };
    if (w.style >= 2) face(ringSprite(w.style === 3 ? 0.76 : 0.62, w.style === 3 ? 5 : 3, gold), -w.phi * 0.8 + t * 3, 0.9 * a * w.sc);
    if (w.style === 3) face(ringSprite(0.52, 4, false), w.phi * 1.6 - t * 2, 0.85 * a * w.sc);
    face(wheelSprite(w.style, w.bi), w.phi, a * w.sc);
    // the churning core: a sphere with filaments turning round it
    const rc = RT * (w.style === 3 ? 0.34 : 0.32) * (0.6 + 0.4 * w.sc + 0.06 * Math.sin(t * 17 + w.i));
    K.glow(c, X, Y, rc * 2.6, P.cyan, 0.55 * a); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.95 * a; blit(c, coreSprite(gold && w.i % 2 === 0), X, Y, rc); c.globalCompositeOperation = 'lighter';
    c.strokeStyle = P.ice; c.lineWidth = Math.max(0.7, rc * 0.07); c.globalAlpha = 0.5 * a; for (let k = 0; k < 2; k++) { c.beginPath(); c.ellipse(X, Y, rc * 1.2, rc * (0.3 + 0.2 * k), t * (5 + k * 3) + w.i + k * 1.7, 0, TAU); c.stroke(); }
    K.glow(c, X, Y, rc * 0.9, P.white, 0.8 * a);
    // the near half of the rim: violet haze, blue, cyan, a white-hot edge; the near tyre; gold on the leading edge at Celestial
    c.globalAlpha = a; ell(0, 0, 1, psi - Math.PI / 2, psi + Math.PI / 2);
    c.globalCompositeOperation = 'source-over'; c.strokeStyle = rgba(P.violet, 0.55); c.lineWidth = Math.max(2, RT * 0.2); c.stroke(); c.strokeStyle = rgba(P.blue, 0.85); c.lineWidth = Math.max(1.6, RT * 0.11); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.cyan, 0.7); c.lineWidth = Math.max(1.2, RT * 0.05); c.stroke(); c.strokeStyle = P.white; c.lineWidth = Math.max(0.8, RT * 0.018); c.stroke();
    ell(-pn[0] * tw, -pn[1] * tw, 1, psi - Math.PI / 2, psi + Math.PI / 2); c.strokeStyle = rgba(P.ice, 0.75); c.lineWidth = Math.max(0.8, RT * 0.035); c.stroke();
    if (gold) { ell(0, 0, 1.0, -0.75, 0.75); c.strokeStyle = P.amber; c.lineWidth = Math.max(1.4, RT * 0.1); c.globalAlpha = 0.7 * a; c.stroke(); c.strokeStyle = P.gold; c.lineWidth = Math.max(1, RT * 0.045); c.globalAlpha = a; c.stroke(); }
    // the contact point flares where the rim meets the floor
    if (w.roll > 0.05) { const bx = X - pw[0] * R, by = Y - pw[1] * R; K.glow(c, bx, by, RT * 0.7, P.white, 0.5 * a * w.roll); K.glow(c, bx, by, RT * 1.3, P.cyan, 0.35 * a * w.roll); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }

  U.widepressure = (C, h) => {
    H = h; K = TK.bind(H); const me = H.me, ev = K.evo(C), a0 = C.a, N = K.evoN(C, 4, 16), style = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, WAVES = ev >= 7 ? 2 : 1, PER = Math.ceil(N / WAVES);
    const DK = C.base * C.K * K.evoK(C), HIT = DK * 13 * 0.8 / N, POP = DK * 13 * 0.2 / N, R = ev >= 7 ? 0.48 : ev >= 4 ? 0.52 : 0.6;
    const LAUNCH = 1.05, TRAV = 2.25, COL = 0.5, STAG = ev >= 7 ? 0.06 : ev >= 4 ? 0.08 : 0.14, W2 = 0.6, SPD = ev >= 7 ? 5.4 : ev >= 4 ? 5.0 : 4.6, SPREAD = ev >= 7 ? 1.0 : ev >= 4 ? 1.15 : 0.95;
    const routes = ev >= 7 ? 'flow' : ev >= 4 ? 'weave' : 'sweep', RATE = ev >= 7 ? 12 : ev >= 4 ? 16 : 24;
    H.X.banner('SPARKLING WIDE PRESSURE', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.5;
    const W = [], R1 = K.R1; let last = 0;
    for (let i = 0; i < N; i++) {
      const wave = Math.floor(i / PER), j = i % PER, nw = Math.min(PER, N - wave * PER), u = nw > 1 ? j / (nw - 1) * 2 - 1 : 0, off = u * SPREAD + (wave ? (SPREAD / Math.max(1, nw - 1)) : 0) * (wave ? 1 : 0);
      // where it gathers: a fan in front of the pet (wider for more wheels); Celestial's second wave on the pet's flanks,
      // set to swirl round it and out after the first
      let sa = a0 + u * SPREAD * (ev >= 7 ? 1.25 : 1.5), rs = ev >= 7 ? 1.75 : N >= 8 ? 1.9 : 1.55, h0 = a0 + off;
      if (wave) { const sd = j % 2 ? 1 : -1, k = j >> 1; sa = a0 + sd * (1.7 + k * 0.42); rs = 1.6; h0 = sa - sd * (1.35 + k * 0.25); }
      const slot = H.walk(me.x + Math.cos(sa) * rs, me.y + Math.sin(sa) * rs);
      const t0 = LAUNCH + wave * W2 + j * STAG, side = routes === 'sweep' ? (u === 0 ? (j % 2 ? 1 : -1) : -Math.sign(u)) : (i % 2 ? 1 : -1);
      W.push({ i, wave, j, h0, sx: slot.x, sy: slot.y, t0, side, ph: R1(i * 3.7) * TAU, x: slot.x, y: slot.y, h: h0, vh: h0, lam: Math.PI / 2, r: 0, phi: 0, sc: 0, a: 0, bi: 1, bendT: 9, roll: 0, spd: 0, hits: new Set(), trk: [], trkT: 0, state: 'build', style, popped: false,
        bx: me.x + Math.cos(sa + 2.4) * (2.6 + R1(i) * 1.2), by: me.y + Math.sin(sa + 2.4) * (2.0 + R1(i) * 1.0), bz: 0.8 + R1(i * 1.3) * 0.9 });
      last = Math.max(last, t0 + TRAV + COL);
    }
    let crackT = 0;
    function steer(w, tau) {
      if (routes === 'sweep') return w.side * 0.85 * sm(tau / 0.6);
      if (routes === 'weave') return w.side * 1.9 * Math.sin(tau * 2.7 + 0.4);
      // flow, then tighten toward the monsters in the final second
      let om = w.side * 1.25 * Math.sin(tau * 2.1 + w.wave * 1.6 + w.j * 0.25);
      if (tau > TRAV - 1.0) { let best = null, bd = 6; for (const m of H.living()) { const d = Math.hypot(m.x - w.x, m.y - w.y); if (d < bd && !w.hits.has(m)) { bd = d; best = m; } } if (best) { const dh = H.wrap(Math.atan2(best.y - w.y, best.x - w.x) - w.h); om = Math.max(-4.8, Math.min(4.8, dh * 5)); } }
      return om;
    }
    H.add({ life: last + 0.15, x: me.x, y: me.y, W,
      update(dt, f) {
        const t = f.t; crackT -= dt; if (t < LAUNCH + 0.2) { K.aura(me.x, me.y, 0.7, dt, 16, 0.4); me.sq = Math.max(me.sq, 0.25); }
        for (const w of W) {
          const tau = t - w.t0;
          if (tau < 0) {   // gather: a bead spirals in, stretches into a flat rim, tilts upright and starts to spin
            const ub = sm((t - w.j * 0.03) / 0.5), ur = sm((t - 0.35 - w.j * 0.02) / 0.35), ut = cl((t - 0.62 - w.j * 0.02) / 0.4);
            w.x = lerp(w.bx, w.sx, ub); w.y = lerp(w.by, w.sy, ub); w.r = R * (0.12 + 0.88 * ur); w.lam = Math.PI / 2 * (1 - outB(ut)); w.sc = sm((t - 0.55) / 0.45); w.a = Math.min(1, t / 0.25);
            w.z = lerp(lerp(w.bz, 0.32, ub), R * Math.cos(w.lam) + 0.32 * (1 - ut), ut); w.phi -= dt * (2 + 12 * ut); w.h = w.vh = w.h0; w.roll = ut > 0.9 ? 0.4 : 0; w.ur = ur;
            if (Math.random() < 0.4 * H.Q()) H.P({ kind: 'spark', x: w.x, y: w.y - w.z, vx: (Math.random() - 0.5) * 1.5, vy: -0.6, life: 0.3, max: 0.3, size: 1.8, color: Math.random() < 0.5 ? P.white : P.cyan });
            continue;
          }
          if (tau < TRAV) {
            if (w.state !== 'roll') { w.state = 'roll'; H.X.sfx.whoosh(); K.sparks(w.x, w.y, 6, 4); }
            const om = steer(w, tau); w.spd = SPD * sm(tau / 0.3 + 0.15); w.h += om * dt; w.vh = w.h;
            w.lam += (Math.max(-0.5, Math.min(0.5, om * 0.17)) - w.lam) * (1 - Math.exp(-8 * dt)); w.z = R * Math.cos(w.lam); w.r = R; w.sc = 1; w.a = 1; w.roll = 1;
            let nx = w.x + Math.cos(w.h) * w.spd * dt, ny = w.y + Math.sin(w.h) * w.spd * dt;
            if (H.X.blocked(nx, ny, 0.22)) { if (H.X.blocked(nx, w.y, 0.22)) w.h = Math.PI - w.h; if (H.X.blocked(w.x, ny, 0.22)) w.h = -w.h; nx = w.x; ny = w.y; K.sparks(w.x, w.y, 6, 5); }
            w.x = nx; w.y = ny; w.phi -= w.spd * dt / R;
            // spokes bend back with a hit, then spring into shape
            w.bendT += dt; const bend = Math.exp(-w.bendT * 6) * Math.cos(w.bendT * 15) * 1.35; w.bi = bend > 1.1 ? 4 : bend > 0.65 ? 3 : bend > 0.2 ? 2 : bend < -0.25 ? 0 : 1;
            for (const m of H.near(w.x, w.y, R * 0.75)) { if (w.hits.has(m)) continue; w.hits.add(m); w.bendT = 0; H.X.hitMon(m, HIT, C.dmgO({ kb: 1.5, stun: 0.15 })); K.sparks(m.x, m.y - 0.3, 10, 7); K.motes(m.x, m.y - 0.3, 4); H.X.light(m.x, m.y, 1.6, 0.15); H.glowAt(m.x, m.y - 0.35, 1.0, 0.18, P.cyan, 0.7); if (crackT <= 0) { H.X.sfx.crack(); crackT = 0.09; } }
            // sparks spray back from the contact point
            const k = RATE * dt * H.Q(); let n = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (n-- > 0) { const b = w.h + Math.PI + (Math.random() - 0.5) * 1.1, v = 2.5 + Math.random() * 3; H.P({ kind: 'spark', x: w.x, y: w.y, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6 - 1.5 - Math.random() * 2, g: 9, life: 0.25 + Math.random() * 0.2, max: 0.45, size: 1.6 + Math.random() * 1.4, color: Math.random() < 0.45 ? P.white : style === 3 && Math.random() < 0.4 ? P.gold : P.cyan }); }
            w.trkT -= dt; if (w.trkT <= 0) { w.trkT = 0.05; w.trk.push([w.x, w.y, w.h, t]); if (w.trk.length > 30) w.trk.shift(); }
            continue;
          }
          if (tau < TRAV + COL) {   // collapse: it falls flat, spins up and flies apart into a disc of sparks
            const u = (tau - TRAV) / COL; if (w.state !== 'col') { w.state = 'col'; w.lam0 = w.lam; }
            w.lam = lerp(w.lam0, Math.PI / 2, sm(u / 0.45)); w.z = lerp(R, 0.18, sm(u / 0.45)); w.phi -= dt * (14 + 30 * u); w.r = R * (1 + 0.55 * u); w.a = 1 - sm((u - 0.35) / 0.65); w.sc = 1 - u; w.roll = 0; w.x += Math.cos(w.h) * SPD * 0.4 * (1 - u) * dt; w.y += Math.sin(w.h) * SPD * 0.4 * (1 - u) * dt;
            if (!w.popped && u > 0.4) { w.popped = true; H.hitArea(w.x, w.y, 0.95, POP, C.dmgO({ kb: 1 })); H.X.light(w.x, w.y, 2, 0.2); H.X.ring(w.x, w.y, 0.2, 1.1, 0.3, P.cyan, 0.35); if (crackT <= 0) { H.X.sfx.crack(); crackT = 0.09; }
              for (let q = 0; q < H.n(14); q++) { const b = q / 14 * TAU + Math.random() * 0.3, v = 3 + Math.random() * 2.5; H.P({ kind: 'spark', x: w.x + Math.cos(b) * w.r, y: w.y + Math.sin(b) * w.r * 0.6 - 0.2, vx: Math.cos(b + 1.3) * v, vy: Math.sin(b + 1.3) * v * 0.6 - 1, g: 4, drag: 1, life: 0.5, max: 0.5, size: 2.2, color: q % 3 === 0 ? (style === 3 ? P.gold : P.white) : q % 3 === 1 ? P.cyan : P.violet }); } K.motes(w.x, w.y, 5); }
            continue;
          }
          w.state = 'gone'; w.a = 0;
        }
      },
      drawUnder(c, f, X0, Y0, T) {
        const t = f.t;   /* (the runner passes the game's clock; this move runs on its own) */
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (const w of W) {
          if (w.state === 'build') { if (w.ur > 0.2) K.floorLight(c, H.sx(w.x), H.sy(w.y), R * T * 1.6, 0.35 * w.ur, P.blue); continue; }
          // twin violet tracks fading behind (four age bands, no per-segment strokes)
          const tr = w.trk; if (tr.length > 1) for (let s = -1; s <= 1; s += 2) for (let b = 0; b < 3; b++) { const i0 = Math.floor(b / 3 * (tr.length - 1)), i1 = Math.ceil((b + 1) / 3 * (tr.length - 1)); const age = t - tr[i1][3], al = cl(1 - age / 1.1) * (0.35 + 0.25 * b); if (al < 0.02) continue;
            c.beginPath(); for (let i = i0; i <= i1; i++) { const p = tr[i], ox = -Math.sin(p[2]) * R * 0.32 * s, oy = Math.cos(p[2]) * R * 0.32 * s; const xx = H.sx(p[0] + ox), yy = H.sy(p[1] + oy); i > i0 ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
            c.globalAlpha = al; c.strokeStyle = P.violet; c.lineWidth = Math.max(1.5, T * 0.09); c.stroke(); c.globalAlpha = al * 0.6; c.strokeStyle = P.ice; c.lineWidth = Math.max(0.7, T * 0.025); c.stroke(); }
          c.globalAlpha = 1;
          if (w.a > 0.02) { K.floorLight(c, H.sx(w.x), H.sy(w.y), R * T * (w.state === 'col' ? 2.6 : 1.8), 0.45 * w.a, P.cyan); }
          if (w.state === 'col' && w.a > 0.02) {   // the spinning disc of sparks, flat on the floor
            const X = H.sx(w.x), Y = H.sy(w.y) - w.z * T * CZ, rr = w.r * T, n = 14;
            for (let k = 0; k < n; k++) { const b = k / n * TAU + w.phi * 0.5, x = X + Math.cos(b) * rr, y = Y + Math.sin(b) * rr * H.GY; K.glow(c, x, y, T * 0.16, k % 2 ? P.cyan : style === 3 ? P.gold : P.violet, 0.8 * w.a); K.glow(c, x, y, T * 0.06, P.white, w.a); }
          }
        }
        c.restore();
      },
      draw(c, f, X0, Y0, T) {
        const t = f.t;   /* (the runner passes the game's clock; this move runs on its own) */
        petHole(c, T);
        // nearer wheels last
        const L = W.filter(w => w.a > 0.02 && w.state !== 'gone' && !(w.state === 'col' && w.a < 0.3)).sort((p, q) => p.y - q.y);
        for (const w of L) {
          if (w.state === 'build' && w.ur < 0.05) {   // still a bead: a bright dot with a short tail spiralling in
            const X = H.sx(w.x), Y = H.sy(w.y) - w.z * T; K.glow(c, X, Y, T * 0.4, P.cyan, 0.6 * w.a); K.glow(c, X, Y, T * 0.14, P.white, w.a); continue; }
          const X = H.sx(w.x) + 0, Y = H.sy(w.y) - w.z * T * CZ;
          // the hub sits over the contact point, leaned toward the wheel's side
          const F = frame(w.vh, w.lam), sh = w.state === 'roll' ? pv([F.a[0] * Math.sin(w.lam) * w.r, F.a[1] * Math.sin(w.lam) * w.r, 0], T) : [0, 0];
          drawWheel(c, w, X + sh[0], Y + sh[1], T, t);
        }
      } });
  };

  /* ================= 4. Ragnarok ================= */
  /* the head's angular plates in its own frame (a along the striking axis toward the leading face, b out from the grip):
     two flared striking blocks and a body, each a bevelled slab (a flat face plate and four bevel plates) */
  function hammerPlates(W, ev) {
    const L = [], hl = 1.05 * W, a1 = 0.52 * W, hf = 0.7 * W, hb = 0.5 * W, e = 0.15 * W;
    const slab = (A0, A1, B0, B1, ee, tag) => { const o = [[A0, B0], [A1, B0], [A1, B1], [A0, B1]], i = [[A0 + ee, B0 + ee], [A1 - ee, B0 + ee], [A1 - ee, B1 - ee], [A0 + ee, B1 - ee]];
      L.push({ pts: i, n: [0, 0], face: 1, tag }); L.push({ pts: [o[0], o[1], i[1], i[0]], n: [0, -1], tag }); L.push({ pts: [o[1], o[2], i[2], i[1]], n: [1, 0], tag }); L.push({ pts: [o[2], o[3], i[3], i[2]], n: [0, 1], tag }); L.push({ pts: [o[3], o[0], i[0], i[3]], n: [-1, 0], tag }); };
    slab(-a1, a1, -hb, hb, e, 'body'); slab(a1, hl, -hf, hf, e, 'lead'); slab(-hl, -a1, -hf, hf, e, 'rear');
    if (ev >= 4) { L.push({ pts: [[-a1 * 0.45, -hb - 0.12 * W], [a1 * 0.45, -hb - 0.12 * W], [a1 * 0.3, -hb], [-a1 * 0.3, -hb]], n: [0, -1], tag: 'collar' }); L.push({ pts: [[-a1 * 0.3, hb], [a1 * 0.3, hb], [a1 * 0.45, hb + 0.12 * W], [-a1 * 0.45, hb + 0.12 * W]], n: [0, 1], tag: 'collar' }); }
    for (const p of L) { let x = 0, y = 0; for (const q of p.pts) { x += q[0]; y += q[1]; } p.c = [x / p.pts.length, y / p.pts.length]; }
    const sil = [[-hl, -hf], [-a1, -hf], [-a1, -hb], [a1, -hb], [a1, -hf], [hl, -hf], [hl, hf], [a1, hf], [a1, hb], [-a1, hb], [-a1, hf], [-hl, hf]];
    return { L, sil, hl, hf, hb, a1 };
  }
  const RAMP = [P.ice, P.cyan, P.blue, P.deep];
  const rampC = k => (k > 0.74 ? RAMP[0] : k > 0.5 ? RAMP[1] : k > 0.28 ? RAMP[2] : RAMP[3]);

  U.ragnarok = (C, h) => {
    H = h; K = TK.bind(H); const me = H.me, ev = K.evo(C), R1 = K.R1, x = C.tx, y = C.ty, W = 1 + 0.5 * (ev - 1) / 6, RA = (3.0 + 0.25 * (ev - 1)) * C.K;
    const DK = C.base * C.K * K.evoK(C) * (1 + 0.1 * (ev >= 4) + 0.1 * (ev >= 7)), MAIN = DK * 14, DIS = DK * 2;
    const s = me.x >= x ? 1 : -1, Lh = 2.5 * W, HP = hammerPlates(W, ev), PL = HP.L, D = 0.95 * W, monu = ev >= 7;
    const HAN0 = 0.3, HAN1 = 0.95, PL0 = 0.8, PL1 = 1.65, WIND = 2.25, SW0 = 2.5, IMP = 2.84, ERU = 2.94, STAY = monu ? 0.75 : 0.4, DIS0 = ERU + STAY, DIS1 = DIS0 + 0.6, END = 4.75;
    const gH = -Math.PI / 2 * 0 + Math.PI / 2 - s * 0.44, gI = Math.PI / 2 + s * Math.PI / 2;   // grip->head angle (up positive): held tilted back, then flat at the strike
    const G0 = [s * 0.9 * W, Math.max(1.3, 2.2 + 0.4 * W - Math.max(0, me.y - y) * 0.6)],   /* (held lower when the target is up the screen, so the head stays in view) */ G1 = [s * Lh, HP.hl * 0];   // grip in the swing plane (horizontal, height), held and at the strike
    G1[1] = HP.hl + 0.0;   // at the strike the head stands on its leading face: its centre at half the head's length
    // the order the plates arrive (the body first, then the faces), each from its own fragment rising off the floor
    PL.forEach((p, k) => { const o = p.tag === 'body' ? 0 : p.tag === 'collar' ? 0.25 : p.tag === 'lead' ? 0.45 : 0.6; p.ta = PL0 + 0.25 + (o + R1(k * 2.3) * 0.35) * (PL1 - PL0 - 0.25) / 0.95; const b = R1(k * 5.1) * TAU, rr = (0.5 + 0.5 * R1(k * 1.7)) * RA * 0.55; p.fx = x + Math.cos(b) * rr; p.fy = y + Math.sin(b) * rr * 0.8; p.fly = [Math.cos(b) * 0.9, 1.0 + R1(k) * 0.6]; p.k = k; p.got = false; });
    H.X.banner('RAGNAROK', '', C.col, 1.6); H.X.sfx.hum(); me.sq = 0.7;
    H.X.after(1.2, () => H.warn(x, y, RA, IMP - 1.2, C.col));
    const dis = [], crown = [], paths = [];
    for (let i = 0; i < (ev >= 7 ? 12 : ev >= 4 ? 9 : 6); i++) dis.push(i / (ev >= 7 ? 12 : ev >= 4 ? 9 : 6) * TAU + R1(i * 3.1) * 0.4);
    if (monu) for (let i = 0; i < 14; i++) crown.push(i / 14 * TAU + R1(i * 7.7) * 0.2);
    const Q = [];   // the hammer's pose this frame (swing-plane coordinates)
    function pose(t) {
      let g = gH + Math.sin(t * 1.7) * 0.03, G = G0.slice(), ex = monu ? 1 : 0, sink = 0;
      if (t > WIND && t < SW0) { const u = sm((t - WIND) / (SW0 - WIND)); g = gH + Math.sin(t * 1.7) * 0.03 * (1 - u) - s * 0.2 * u; G = [G0[0] + s * 0.15 * u, G0[1] + 0.25 * u]; }
      else if (t >= SW0 && t < IMP) { const u = (t - SW0) / (IMP - SW0), e = u * u * u; g = lerp(gH - s * 0.2, gI, e); G = [lerp(G0[0] + s * 0.15, G1[0], e), lerp(G0[1] + 0.25, G1[1], e)]; if (monu) ex = 1 - sm(u / 0.85); }
      else if (t >= IMP) { g = gI; G = G1.slice(); ex = 0; sink = Math.min(0.08 * W, (t - IMP) * 1.2); }
      const dg = [Math.cos(g), Math.sin(g)], Hc = [G[0] + dg[0] * Lh, G[1] + dg[1] * Lh - sink], Ld = [Math.cos(g + s * Math.PI / 2), Math.sin(g + s * Math.PI / 2)];
      return { g, G: [G[0], G[1] - sink], Hc, dg, Ld, ex };
    }
    let crackT = 0, erupted = false, para = [];
    H.add({ life: END, x, y,
      update(dt, f) {
        const t = f.t; crackT -= dt;
        if (t < SW0) { me.sq = Math.max(me.sq, 0.45); if (t < PL1) K.aura(me.x, me.y, 0.6, dt, 12, 0.3); K.aura(x, y, RA * 0.5, dt, t < PL1 ? 22 : 10, 0); }
        const q = pose(t); Q[0] = q;
        // plates snap into place
        for (const p of PL) if (!p.got && t >= p.ta) { p.got = true; const wpt = plateWorld(q, p.c); K.sparks(wpt[0], wpt[1], 3, 3); if (crackT <= 0 && R1(p.k) < 0.4) { H.X.sfx.crack(); crackT = 0.12; } }
        if (t >= IMP && !f.hitT) { f.hitT = 1; H.X.hitstop(0.07); H.X.shake(10, 0.15); H.X.sfx.crack(); }
        if (t >= ERU && !erupted) { erupted = true; H.X.flash(0.32, '#E8F6FF'); H.X.shake(18, 0.4); H.X.sfx.crash(); H.X.light(x, y, RA * 1.6, 0.7);
          for (const m of H.living()) { const d = Math.hypot(m.x - x, m.y - y); if (d > RA + m.r) continue; H.X.hitMon(m, MAIN * (d < RA * 0.5 ? 1 : 0.85), C.dmgO({ kb: 2.5, stun: m.boss ? 4 : 10 })); if (!m.boss) para.push(m); K.sparks(m.x, m.y - 0.3, 12, 8); }
          K.sparks(x, y, 40, 11, { up: 4 }); K.motes(x, y, 24, { v: 4 }); K.goldSparks(x, y, 14, 9); H.glowAt(x, y - 0.3, RA * 0.9, 0.35, P.cyan, 0.8);
          for (let i = 0; i < dis.length; i++) { const b = dis[i], L = RA * (0.75 + 0.25 * R1(i * 4.2)); paths.push(K.path(0, 0, Math.cos(b) * L, Math.sin(b) * L * H.GY, i * 13 + 5, L * 0.12)); }
          if (para.length) H.add({ life: 4.5, M: para.slice(),   /* (the crackle of the paralysis; the game marks the rest of its 10 s) */ draw(c, f2, X, Y, T, t2) { c.save(); for (const m of f2.M) { if (m.dead || !(m.stun > 0.05)) continue; const mx = H.sx(m.x), my = H.sy(m.y) - T * (m.r || 0.4) * 1.1, rr = T * (m.r || 0.4) * 1.1, fl = Math.min(1, m.stun / 0.6, f2.life / 0.8); for (let k = 0; k < 2; k++) { const s1 = K.seed(t2, k + m.x * 7, 10), b0 = R1(s1) * TAU, b1 = b0 + 1 + R1(s1 + 1) * 1.6; K.arc(c, mx + Math.cos(b0) * rr, my + Math.sin(b0) * rr * 0.8, mx + Math.cos(b1) * rr, my + Math.sin(b1) * rr * 0.8, s1, 1.2, 0.75 * fl, { forks: 0, jit: rr * 0.3 }); } K.glow(c, mx, my, rr * 1.4, P.violet, 0.22 * fl); } c.restore(); },
            update(dt2, f2) { for (const m of f2.M) if (!m.dead && m.stun > 0.05 && Math.random() < 3 * dt2 * H.Q()) K.sparks(m.x, m.y - 0.4, 2, 3); if (f2.M.every(m => m.dead || !(m.stun > 0.05))) f2.life = Math.min(f2.life, 0.05); } });
        }
        if (erupted && !f.disHit && t >= ERU + 0.22) { f.disHit = 1; H.hitRing(x, y, RA * 0.35, RA, DIS, C.dmgO({ stun: 0.2 })); H.X.sfx.crack(); }
        if (monu && !f.domeB && t >= ERU + 0.85) { f.domeB = 1; const rd = RA * 0.8; for (let i = 0; i < H.n(60); i++) { const b = Math.random() * TAU, el = Math.random() * Math.PI / 2, rr = rd * Math.cos(el); H.P({ kind: Math.random() < 0.6 ? 'spark' : 'ember', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * H.GY - rd * Math.sin(el) * 0.95, vx: Math.cos(b) * 0.6, vy: 0.5, g: 5, drag: 0.6, life: 0.7 + Math.random() * 0.5, max: 1.2, size: 2 + Math.random() * 1.6, color: Math.random() < 0.3 ? P.white : Math.random() < 0.5 ? P.cyan : Math.random() < 0.5 ? P.violet : P.gold }); } }
        if (!f.disB && t >= DIS0) { f.disB = 1; for (const p of PL) { const w = plateWorld(Q[0], p.c); K.sparks(w[0], w[1], 2, 4); } K.motes(x, y - HP.hl, 14, { v: 3 }); }
      },
      drawUnder(c, f, X, Y, T) {
        const t = f.t;   /* (the runner passes the game's clock; this move runs on its own) */
        c.save(); c.globalCompositeOperation = 'lighter';
        // the landing point gathers light, the arcs reach for it
        if (t < IMP) { const k = sm((t - 1.0) / 1.6); K.floorLight(c, X, Y, RA * T * (0.5 + 0.5 * k), 0.25 * k, P.blue); K.floorLight(c, X, Y, RA * T * 0.25, 0.4 * k, P.cyan); }
        // compressed light under the striking face, then the eruption
        if (t >= IMP && t < ERU + 0.05) { const u = (t - IMP) / (ERU - IMP); K.floorLight(c, X, Y, T * HP.hf * 2.2 * (1.3 - 0.6 * u), 0.9, P.white); K.floorLight(c, X, Y, T * HP.hf * 3.5 * (1 - 0.4 * u), 0.6, P.cyan); }
        if (t >= ERU) {
          const u = (t - ERU) / 0.6, rr = RA * T * H.ease.out(cl(u)), al = 1 - sm((t - ERU - 0.25) / 0.5);
          if (al > 0.01) { K.floorLight(c, X, Y, rr * 1.15, 0.5 * al, P.blue); c.globalAlpha = al; for (let k = 0; k < 3; k++) { const r2 = rr * (1 - k * 0.07); c.strokeStyle = k === 0 ? rgba(P.violet, 0.55) : k === 1 ? rgba(P.blue, 0.7) : rgba(P.cyan, 0.9); c.lineWidth = Math.max(2, RA * T * (k === 0 ? 0.2 : k === 1 ? 0.1 : 0.05)); H.floorEllipse(c, X, Y, r2); c.stroke(); } c.strokeStyle = P.white; c.lineWidth = Math.max(1, T * 0.05); H.floorEllipse(c, X, Y, rr); c.stroke(); c.globalAlpha = 1; }
          // branching ground discharges (re-growing), then their fading violet impressions
          const ad = 1 - sm((t - ERU - 0.35) / 0.5); paths.forEach((pts, i) => { const reach = cl(u * 1.6); if (ad > 0.02) { const b = dis[i], L = RA * T * (0.75 + 0.25 * R1(i * 4.2)) * reach; K.arc(c, X, Y, X + Math.cos(b) * L, Y + Math.sin(b) * L * H.GY, K.seed(t, i, 14), 2.2, ad, { forks: 3, jit: L * 0.1 }); }
            const sa = cl(1 - (t - ERU - 0.3) / 1.4); if (sa > 0.02 && u > 0.3) K.scar(c, pts.map(p => [X + p[0] * T, Y + p[1] * T]), sa); });
          const ga = cl(1 - (t - ERU) / 1.7); K.floorLight(c, X, Y, T * 1.8 * W, 0.55 * ga, P.violet); K.floorLight(c, X, Y, T * 0.9 * W, 0.6 * ga, P.cyan);
        }
        c.restore();
      },
      draw(c, f, X, Y, T) {
        const t = f.t;   /* (the runner passes the game's clock; this move runs on its own) */
        petHole(c, T); const q = pose(t), O = [X, Y], sp = pt => [O[0] + pt[0] * T, O[1] - pt[1] * T];
        // fragments rising off the floor to become the plates
        c.save(); c.globalCompositeOperation = 'lighter';
        for (const p of PL) { const t0 = p.ta - 1.0, t1 = p.ta - 0.3; if (t < t0 || t > t1) continue; const u = sm((t - t0) / (t1 - t0)), tgt = headPt(q, [p.c[0] + p.fly[0] * W, p.c[1] + p.fly[1] * W]), x0 = H.sx(p.fx), y0 = H.sy(p.fy), tp = sp(tgt), px = lerp(x0, tp[0], u) + Math.sin(u * 5 + p.k) * T * 0.3 * (1 - u), py = lerp(y0, tp[1], u * u * (3 - 2 * u)), r = T * 0.12 * W, rot = t * 6 + p.k;
          K.glow(c, px, py, r * 3.5, P.cyan, 0.5); c.fillStyle = rgba(P.ice, 0.9); c.beginPath(); for (let k = 0; k < 3; k++) { const b = rot + k * TAU / 3, rk = k ? r : r * 1.7; k ? c.lineTo(px + Math.cos(b) * rk, py + Math.sin(b) * rk) : c.moveTo(px + Math.cos(b) * rk, py + Math.sin(b) * rk); } c.closePath(); c.fill(); K.glow(c, px, py, r, P.white, 0.9); }
        c.restore();
        if (t < HAN0 || t > DIS1) return;
        // ribbons trailing the swing
        if (t > SW0 && t < IMP + 0.22) { const t0 = Math.max(SW0, t - 0.22), t1 = Math.min(t, IMP); if (t1 - t0 > 0.01) [[HP.hl, -HP.hf], [HP.hl, HP.hf], [-HP.hl, HP.hf]].forEach((cc, i) => { const pts = []; for (let k = 0; k <= 12; k++) pts.push(sp(headPt(pose(t0 + (t1 - t0) * k / 12), cc))); const fa2 = t < IMP ? 1 : 1 - (t - IMP) / 0.22;
          K.ribbon(c, pts, T * (i === 2 ? 0.1 : 0.16) * W, 0.85 * fa2); if (i < 2) K.bolt(c, K.path(pts[0][0], pts[0][1], pts[12][0], pts[12][1], K.seed(t, i, 16), T * 0.12, 8).map((p, k) => [pts[Math.min(12, Math.round(k * 12 / 8))][0] + (p[0] - lerp(pts[0][0], pts[12][0], k / 8)), pts[Math.min(12, Math.round(k * 12 / 8))][1] + (p[1] - lerp(pts[0][1], pts[12][1], k / 8))]), 1.2, 0.7 * fa2); }); }
        const fa = t < DIS0 ? 1 : 1 - sm((t - DIS0) / (DIS1 - DIS0)), dk = t < DIS0 ? 0 : (t - DIS0) / (DIS1 - DIS0);
        // the handle grows from the grip to the head
        const hp = sm((t - HAN0) / (HAN1 - HAN0)), Gs = sp(q.G), He = sp([q.G[0] + q.dg[0] * (Lh - HP.hb) * hp, q.G[1] + q.dg[1] * (Lh - HP.hb) * hp]);
        drawHandle(c, Gs, He, T, W, t, fa * Math.min(1, hp * 3), hp < 1);
        if (t < PL0 - 0.3) return;
        drawHead(c, q, sp, T, t, fa, dk);
        // small arcs reach down toward the landing point while it hangs
        if (t > 1.5 && t < SW0 + 0.1) { const k = sm((t - 1.5) / 0.6), hb = sp(headPt(q, [0, 0])); c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < (ev >= 4 ? 3 : 2); i++) { const s1 = K.seed(t, i, 9), ln = 0.35 + 0.35 * R1(s1), tx2 = X + (R1(s1 + 3) - 0.5) * RA * T * 0.6, ty2 = Y; if (R1(s1 + 7) < 0.25) continue; K.arc(c, hb[0] + (R1(s1 + 1) - 0.5) * T * W, hb[1] + T * HP.hf * 0.6, lerp(hb[0], tx2, ln), lerp(hb[1], ty2, ln), s1, 1.4, 0.8 * k, { forks: 2 }); } K.arc(c, X, Y, X + (R1(K.seed(t, 9, 7)) - 0.5) * T, Y - T * 0.8 * k, K.seed(t, 8, 12), 1, 0.7 * k, { forks: 1 }); c.restore(); }
        // Celestial: the crown of lightning and the dome
        if (monu && t >= ERU) {
          c.save(); c.globalCompositeOperation = 'lighter'; const u = (t - ERU) / 0.6, rr = RA * T * H.ease.out(cl(u)) * 0.85, ca = cl((t - ERU - 0.05) / 0.08) * (1 - sm((t - ERU - 0.4) / 0.35));
          if (ca > 0.02) crown.forEach((b, i) => { const bx = X + Math.cos(b) * rr, by = Y + Math.sin(b) * rr * H.GY, hh = T * (1.1 + 0.8 * R1(i * 2.9)) * W * (0.6 + 0.4 * Math.sin(Math.PI * cl(u))); K.bolt(c, K.path(bx, by, bx + (R1(K.seed(t, i, 12)) - 0.5) * T * 0.3, by - hh, K.seed(t, i, 14), T * 0.15, 5), 1.6, ca, i % 3 === 0); K.glow(c, bx, by - hh, T * 0.3, P.white, 0.7 * ca); });
          const du = (t - ERU - 0.25) / 0.6, da = cl(du * 4) * (1 - sm((t - ERU - 0.8) / 0.25)); if (da > 0.02) { const rd = RA * T * 0.8 * H.ease.out(cl(du)), cy = Y;
            c.globalAlpha = da * 0.18; c.fillStyle = P.blue; c.beginPath(); c.ellipse(X, cy, rd, rd * 0.95, 0, Math.PI, TAU); c.ellipse(X, cy, rd, rd * H.GY, 0, 0, Math.PI); c.fill(); c.globalAlpha = da;
            c.strokeStyle = rgba(P.cyan, 0.8); c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.ellipse(X, cy, rd, rd * 0.95, 0, Math.PI, TAU); c.stroke(); c.strokeStyle = rgba(P.white, 0.7); c.lineWidth = Math.max(1, T * 0.025); c.stroke();
            for (let k = 0; k < 4; k++) { const ph = t * 1.4 + k * Math.PI / 4, rx = rd * Math.abs(Math.cos(ph)); c.strokeStyle = rgba(k % 2 ? P.violet : P.ice, 0.55); c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.ellipse(X, cy, Math.max(1, rx), rd * 0.95, 0, Math.PI, TAU); c.stroke(); }
            c.strokeStyle = rgba(P.cyan, 0.5); c.beginPath(); c.ellipse(X, cy - rd * 0.55, rd * 0.83, rd * 0.83 * H.GY, 0, 0, TAU); c.stroke();
            for (let k = 0; k < 4; k++) { const s1 = K.seed(t, k + 30, 12), b0 = Math.PI + R1(s1) * Math.PI, b1 = b0 + (R1(s1 + 1) - 0.5) * 1.4; K.arc(c, X + Math.cos(b0) * rd, cy + Math.sin(b0) * rd * 0.95, X + Math.cos(b1) * rd * 0.8, cy + Math.sin(b1) * rd * 0.76, s1, 1.2, da * 0.8, { forks: 1 }); } }
          c.restore();
        }
      } });
    /* a head-frame point (a, b) -> swing-plane point; the plane point -> world (for particles) */
    function headPt(q, ab) { return [q.Hc[0] + q.Ld[0] * ab[0] + q.dg[0] * ab[1], q.Hc[1] + q.Ld[1] * ab[0] + q.dg[1] * ab[1]]; }
    function plateWorld(q, ab) { const p = headPt(q, ab); return [x + p[0], y - p[1]]; }
    /* the spectral handle: a translucent shaft with a white-hot heart, a lightning spiral wound round it, a pommel */
    function drawHandle(c, A, B, T, W, t, a, growing) {
      if (!(a > 0.01)) return; const w = T * 0.2 * W, dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      c.save(); c.lineCap = 'round'; c.globalAlpha = a;
      c.globalCompositeOperation = 'lighter'; for (let i = 0; i <= 4; i++) K.glow(c, lerp(A[0], B[0], i / 4), lerp(A[1], B[1], i / 4), w * 2.4, P.blue, 0.3 * a);
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = rgba(P.deep, 0.55); c.lineWidth = w * 1.15; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
      c.strokeStyle = rgba(P.blue, 0.6); c.lineWidth = w * 0.8; c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.cyan, 0.8); c.lineWidth = w * 0.4; c.beginPath(); c.moveTo(A[0] - nx * w * 0.18, A[1] - ny * w * 0.18); c.lineTo(B[0] - nx * w * 0.18, B[1] - ny * w * 0.18); c.stroke(); c.strokeStyle = P.white; c.lineWidth = Math.max(1, w * 0.13); c.stroke();
      // the spiral (front turns bright) and grip bands
      c.strokeStyle = rgba(P.ice, 0.9); c.lineWidth = Math.max(1, w * 0.12); c.beginPath(); const n = Math.max(8, Math.round(L / (w * 0.5))); for (let i = 0; i <= n; i++) { const u = i / n, ph = u * L / (w * 1.4) * Math.PI - t * 9, o = Math.sin(ph) * w * 0.55; const px = A[0] + dx * u + nx * o, py = A[1] + dy * u + ny * o; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
      for (let i = 0; i < 3; i++) { const u = 0.06 + i * 0.07, px = A[0] + dx * u, py = A[1] + dy * u; c.strokeStyle = rgba(P.gold, 0.8); c.lineWidth = Math.max(1, w * 0.18); c.beginPath(); c.moveTo(px + nx * w * 0.6, py + ny * w * 0.6); c.lineTo(px - nx * w * 0.6, py - ny * w * 0.6); c.stroke(); }
      c.globalCompositeOperation = 'source-over'; blit(c, coreSprite(true), A[0] - dx / L * w * 0.5, A[1] - dy / L * w * 0.5, w * 0.85); c.globalCompositeOperation = 'lighter'; K.glow(c, A[0], A[1], w * 2.2, P.gold, 0.45 * a);
      if (growing) { K.glow(c, B[0], B[1], w * 3, P.cyan, 0.8 * a); K.glow(c, B[0], B[1], w * 1.2, P.white, a); }
      c.restore();
    }
    /* the hammerhead: the far face and the visible sides of the prism, the core, the translucent front plates shaded
       by the way they face, electricity writhing inside, bright edges, the white-hot core shining through */
    function drawHead(c, q, sp, T, t, fa, dk) {
      const hp = [], dzY = D * 0.5 * H.GY * T;   // half the head's depth on screen
      const scr = (ab, dzz) => { const p = sp(headPt(q, ab)); return [p[0], p[1] + dzz]; };
      const LS = [q.Ld[0], -q.Ld[1]], BS = [q.dg[0], -q.dg[1]];   // screen directions of a and b
      const assembled = PL.reduce((n, p) => n + (t >= p.ta ? 1 : 0), 0) / PL.length, solid = sm((assembled - 0.5) / 0.5) * (1 - q.ex) * fa;
      c.save(); c.lineJoin = 'round';
      // the prism behind: the far face and the sides that face up (where the camera sees them)
      if (solid > 0.02) {
        const S = HP.sil, nS = S.length, F = S.map(p => scr(p, dzY)), Bk = S.map(p => scr(p, -dzY));
        c.globalAlpha = 0.6 * solid; c.fillStyle = rgba(P.deep, 0.45); c.beginPath(); Bk.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill();
        for (let i = 0; i < nS; i++) { const j = (i + 1) % nS, ea = S[i], eb = S[j], dA = eb[0] - ea[0], dB = eb[1] - ea[1], nA = dB, nB = -dA;   // outward normal (the outline runs clockwise in a-b)
          const ny = nA * LS[1] + nB * BS[1], nx = nA * LS[0] + nB * BS[0], ln = Math.hypot(nx, ny) || 1; if (ny / ln > -0.05) continue; const lit = 0.5 + 0.5 * ((nx / ln) * -0.6 + (ny / ln) * -0.8);
          c.fillStyle = rgba(lit > 0.55 ? P.cyan : lit > 0.3 ? P.blue : P.deep, 0.75); c.beginPath(); c.moveTo(F[i][0], F[i][1]); c.lineTo(F[j][0], F[j][1]); c.lineTo(Bk[j][0], Bk[j][1]); c.lineTo(Bk[i][0], Bk[i][1]); c.closePath(); c.fill();
          c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.cyan, 0.7); c.lineWidth = Math.max(1, T * 0.025); c.stroke(); c.globalCompositeOperation = 'source-over'; }
      }
      // the core inside: a white-hot sphere (Adept on: gyroscope rings; Celestial: a large rotating core with three)
      const hc = scr([0, 0], 0), rc = T * W * (monu ? 0.42 : ev >= 4 ? 0.34 : 0.28) * (0.92 + 0.08 * Math.sin(t * 13)) * Math.min(1, (t - PL0 + 0.3) / 0.5) * (1 - dk * 0.6);
      if (rc > 1) { c.globalCompositeOperation = 'lighter'; K.glow(c, hc[0], hc[1], rc * 4, P.blue, 0.5 * fa); K.glow(c, hc[0], hc[1], rc * 2.2, P.cyan, 0.6 * fa); c.globalCompositeOperation = 'source-over'; c.globalAlpha = fa; blit(c, coreSprite(false), hc[0], hc[1], rc); c.globalCompositeOperation = 'lighter';
        const nr = monu ? 3 : ev >= 4 ? 2 : 1; for (let k = 0; k < nr; k++) { c.save(); c.translate(hc[0], hc[1]); c.rotate(t * (1.4 + k * 0.9) * (k % 2 ? -1 : 1) + k * 1.1); c.strokeStyle = rgba(k === 2 ? P.gold : k ? P.violet : P.ice, 0.85 * fa); c.lineWidth = Math.max(1, rc * 0.09); c.beginPath(); c.ellipse(0, 0, rc * (1.45 + k * 0.28), rc * (0.35 + 0.25 * Math.abs(Math.sin(t * 1.3 + k))), 0, 0, TAU); c.stroke(); c.restore(); }
        K.glow(c, hc[0], hc[1], rc * 1.1, P.white, 0.9 * fa); }
      // the plates: translucent, each shaded by the way it faces; flying in from their fragments; Celestial: floating apart
      const mid = [];
      for (const p of PL) {
        const ap = cl((t - (p.ta - 0.3)) / 0.3); if (ap <= 0) continue; const e = H.ease.out(ap), flyA = (1 - e) * W, exv = q.ex * (0.42 * W), cl0 = Math.hypot(p.c[0], p.c[1]) || 1;
        let oa = p.fly[0] * flyA + p.c[0] / cl0 * exv + (dk > 0 ? p.c[0] / cl0 * dk * 1.6 * W : 0), ob = p.fly[1] * flyA + p.c[1] / cl0 * exv + (dk > 0 ? (p.c[1] / cl0 + 0.6) * dk * 1.6 * W : 0);
        if (q.ex > 0) { oa += Math.sin(t * 1.9 + p.k) * 0.05 * W * q.ex; ob += Math.cos(t * 1.6 + p.k * 1.3) * 0.05 * W * q.ex; }
        const rot = (1 - e) * (R1(p.k * 3.3) - 0.5) * 2 + q.ex * Math.sin(t * 1.2 + p.k) * 0.12 + dk * (R1(p.k) - 0.5) * 3;
        const cr = Math.cos(rot), sr = Math.sin(rot), pts = p.pts.map(v => { const da = v[0] - p.c[0], db = v[1] - p.c[1]; return scr([p.c[0] + oa + da * cr - db * sr, p.c[1] + ob + da * sr + db * cr], dzY); });
        const nA = p.n[0], nB = p.n[1], nx = nA * LS[0] + nB * BS[0], ny = nA * LS[1] + nB * BS[1], lit = p.face ? 0.6 + (p.tag === 'lead' ? 0.12 : 0) : 0.5 + 0.5 * (nx * -0.6 + ny * -0.8), al = ap * fa * (1 - dk * 0.5);
        mid.push(pts);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = al * (p.face ? 0.62 : 0.78); c.fillStyle = rampC(lit); c.beginPath(); pts.forEach((v, i) => (i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1]))); c.closePath(); c.fill();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = al; c.strokeStyle = rgba(lit > 0.6 ? P.white : P.cyan, lit > 0.6 ? 0.8 : 0.6); c.lineWidth = Math.max(1, T * 0.035); c.stroke();
        if (p.face) { const a0 = pts[0], a2 = pts[2]; c.strokeStyle = rgba(P.white, 0.35); c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(lerp(a0[0], a2[0], 0.15), lerp(a0[1], a2[1], 0.15)); c.lineTo(lerp(a0[0], a2[0], 0.4), lerp(a0[1], a2[1], 0.4)); c.stroke(); }
        if (ap < 1) K.glow(c, (pts[0][0] + pts[2][0]) / 2, (pts[0][1] + pts[2][1]) / 2, T * 0.5 * W, P.white, (1 - ap) * 0.8);
      }
      // electricity writhing inside the head (clipped to its outline) and the white-hot core shining through the plates
      if (assembled > 0.3 && fa > 0.05) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1;
        if (q.ex < 0.3) { const S = HP.sil.map(p => scr(p, dzY)); c.beginPath(); S.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip(); }
        const na = q.ex > 0.3 ? 3 : monu ? 5 : ev >= 4 ? 4 : 3, sp2 = q.ex > 0.3 ? 1.1 : 1.8; for (let i = 0; i < na; i++) { const s1 = K.seed(t, i, 11), pa = scr([(R1(s1) - 0.5) * HP.hl * sp2, (R1(s1 + 1) - 0.5) * HP.hf * sp2 * 0.9], dzY * 0.5); K.arc(c, hc[0], hc[1], pa[0], pa[1], s1, 1.3, 0.9 * fa, { forks: 2 }); }
        K.glow(c, hc[0], hc[1], rc * 1.6, P.white, 0.55 * fa); c.restore();
      }
      // the striking face blazes as it closes / lands
      if (t > SW0 && t < ERU + 0.3) { const lf = scr([HP.hl, 0], dzY), k = t < IMP ? sm((t - SW0) / (IMP - SW0)) : 1 - (t - IMP) / (ERU + 0.3 - IMP); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1; K.glow(c, lf[0], lf[1], T * HP.hf * 2.4, P.cyan, 0.6 * k); K.glow(c, lf[0], lf[1], T * HP.hf * 1.1, P.white, 0.8 * k); }
      c.restore();
    }
  };
})();
