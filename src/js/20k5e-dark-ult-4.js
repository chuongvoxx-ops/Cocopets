/* ---------- Dark, reworked: Eventide Spiral ----------
   A towering corkscrew of darkness winds up out of the aim: a thick ribbon of shadow spiralling to a height of four
   tiles, built as a shaded helical volume (a near-black outer face, a plum inner face, a smoky-violet top lip that gives
   it thickness, a violet rim light along its upper edge, shaded by the side it turns to the light). Violet currents run
   up it, smoke and ash peel off its back, dark fragments orbit it, and the floor beneath carries only light: a violet
   ring and slow spiral arms, nothing dark left behind. Three sweeps pull the monsters in; then the spiral unwinds from the
   top, each coil tearing loose as an expanding ring of torn shadow (a thick band with a luminous inner rim and a feathered
   outer edge) that races across the floor; the last of it collapses into a dark bloom of fragments and mist round a
   violet core. The beats, hits and areas are the old Eventide Spiral's (20k5-elem-dark.js): three sweeps at 1.1 / 1.5 /
   1.9 s, six coils from 2.6 s a fifth of a second apart, the burst at 3.7 s; total 12.9 x base (x K and the level factor).
   Levels: one ribbon to Hatchling, a second interleaved ribbon and a second current from Adept, three ribbons, branching
   violet fractures along the edges and a last coil that sweeps the whole arena at Celestial. The spiral dims smoothly
   wherever it passes over the pet (no cut-outs). Cheap: the floor light, the swirl, the torn rings and the fragment are
   cached sprites; the ribbon is plain quads with precomputed colour strings; no per-frame gradients, no shadowBlur. */
(() => {
  const U = ELEM_IMPL.dark.ult, TAU = Math.PI * 2;
  const cl = u => Math.max(0, Math.min(1, u));
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const lerp = (a, b, u) => a + (b - a) * u;
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const VOID = [8, 5, 15], BODY = [24, 11, 46], PLUM = [43, 11, 69], SMOK = [70, 48, 82], ENER = [109, 40, 168], EDGE = [165, 92, 255], ACC = [208, 174, 255];
  const EDGEh = '#A55CFF', ACCh = '#D0AEFF', ENERh = '#6D28A8';
  const mixC = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const css = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a < 0 ? 0 : a > 1 ? 1 : +a.toFixed(3)})`;
  /* shaded body colours by light (16 steps), built once: the outer face, the inner face, the top lip */
  const NL = 16, OUT = [], INN = [], LIP = [];
  for (let i = 0; i < NL; i++) { const L = i / (NL - 1); OUT.push(mixC(VOID, mixC(BODY, SMOK, 0.6), L * L * 0.4 + L * 0.6)); INN.push(mixC(mixC(VOID, PLUM, 0.6), mixC(PLUM, SMOK, 0.45), L)); LIP.push(mixC(PLUM, mixC(SMOK, EDGE, 0.2), L)); }
  const rg = (g, x, y, r, stops) => { const q = g.createRadialGradient(x, y, 0, x, y, r); stops.forEach(s => q.addColorStop(s[0], s[1])); return q; };

  /* ---- cached sprites ---- */
  // the violet light on the floor: a soft disc with a brighter band near its rim, feathered out to nothing (additive)
  const floorSpr = () => fxSprite('du4floor', 256, 256, (g, w) => { const c0 = w / 2; g.fillStyle = rg(g, c0, c0, c0, [[0, 'rgba(109,40,168,0.05)'], [0.5, 'rgba(109,40,168,0.12)'], [0.78, 'rgba(165,92,255,0.3)'], [0.86, 'rgba(208,174,255,0.5)'], [0.92, 'rgba(165,92,255,0.2)'], [1, 'rgba(165,92,255,0)']]); g.fillRect(0, 0, w, w); });
  // slow spiral arms of violet light on the floor (additive), feathered
  const swirlSpr = () => fxSprite('du4swirl', 256, 256, (g, w) => { const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round';
    for (let arm = 0; arm < 4; arm++) for (const [col, lw] of [['rgba(109,40,168,0.35)', 12], ['rgba(165,92,255,0.5)', 4], ['rgba(208,174,255,0.7)', 1.2]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
      for (let i = 0; i <= 40; i++) { const u = i / 40, r = c0 * (0.96 - 0.9 * u), b = arm * TAU / 4 + u * 3.2; i ? g.lineTo(Math.cos(b) * r, Math.sin(b) * r) : g.moveTo(Math.cos(b) * r, Math.sin(b) * r); } g.stroke(); }
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = rg(g, 0, 0, c0, [[0, 'rgba(0,0,0,0.3)'], [0.3, 'rgba(0,0,0,1)'], [0.7, 'rgba(0,0,0,0.8)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(-c0, -c0, w, w); });
  // a torn ring of shadow seen from above: its side (near-black band, ragged, feathered outward) and its top (plum band with a luminous inner rim)
  const tornRing = (key, body, rim, rimW) => fxSprite(key, 256, 256, (g, w) => { const c0 = w / 2; g.translate(c0, c0); const N = 72, ri = c0 * 0.66, ro = c0 * 0.9;
    g.beginPath(); for (let i = 0; i <= N; i++) { const b = i / N * TAU, j = i % N, r = ro * (1 - 0.05 * R1(j * 3.3) - (R1(j * 7.1) > 0.82 ? 0.08 : 0)); i ? g.lineTo(Math.cos(b) * r, Math.sin(b) * r) : g.moveTo(Math.cos(b) * r, Math.sin(b) * r); }
    for (let i = N; i >= 0; i--) { const b = i / N * TAU, j = i % N, r = ri * (1 + 0.05 * R1(j * 5.7 + 1)); g.lineTo(Math.cos(b) * r, Math.sin(b) * r); } g.closePath(); g.fillStyle = body; g.fill();
    g.strokeStyle = rim; g.lineWidth = rimW; g.stroke();   // the rims (clipped off by the feather on the outside)
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = rg(g, 0, 0, c0, [[0, 'rgba(0,0,0,1)'], [0.8, 'rgba(0,0,0,1)'], [0.86, 'rgba(0,0,0,0.75)'], [0.93, 'rgba(0,0,0,0.2)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(-c0, -c0, w, w); });
  const ringSide = () => tornRing('du4ringS', 'rgba(12,6,24,0.92)', 'rgba(109,40,168,0.55)', 2.5);
  const ringTop = () => tornRing('du4ringT', 'rgba(43,11,69,0.9)', 'rgba(165,92,255,0.95)', 1.8);
  // a dark fragment: a faceted shard with a plum facet, a violet edge and a pale glint
  const fragSpr = () => fxSprite('du4frag', 32, 32, (g, w) => { const c0 = w / 2; g.translate(c0, c0); const P = [[0, -13], [8, -3], [5, 12], [-6, 9], [-9, -4]];
    g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = '#180B2E'; g.fill(); g.strokeStyle = 'rgba(165,92,255,0.9)'; g.lineWidth = 1.3; g.stroke();
    g.beginPath(); g.moveTo(0, -13); g.lineTo(8, -3); g.lineTo(0, 0); g.closePath(); g.fillStyle = 'rgba(70,48,82,0.9)'; g.fill();
    g.beginPath(); g.moveTo(-6, 9); g.lineTo(0, 0); g.lineTo(5, 12); g.closePath(); g.fillStyle = 'rgba(43,11,69,0.9)'; g.fill();
    g.strokeStyle = 'rgba(208,174,255,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1, -10); g.lineTo(5, -4); g.stroke(); });
  // a thin ring of violet light, feathered both ways (the sweeps' waves and the last bloom's wave)
  const waveSpr = () => fxSprite('du4wave', 256, 256, (g, w) => { const c0 = w / 2; g.fillStyle = rg(g, c0, c0, c0, [[0, 'rgba(165,92,255,0)'], [0.7, 'rgba(165,92,255,0)'], [0.84, 'rgba(165,92,255,0.35)'], [0.9, 'rgba(208,174,255,0.8)'], [0.95, 'rgba(165,92,255,0.3)'], [1, 'rgba(165,92,255,0)']]); g.fillRect(0, 0, w, w); });
  const blitF = (c, img, X, Y, r, GY, a, rot) => { if (!(a > 0.01) || !(r > 1)) return; c.save(); c.translate(X, Y); c.scale(1, GY); if (rot) c.rotate(rot); c.globalAlpha = Math.min(1, a); c.drawImage(img, -r, -r, r * 2, r * 2); c.restore(); };

  U.eventide = (C, H) => {
    const me = H.me, x = C.tx, y = C.ty, ev = Math.max(1, Math.min(7, C.evo || 1)), cel = ev >= 7, ek = 1 + 0.08 * (ev - 1), DK = C.K * ek;
    const R = 2.7 * C.K, COILS = 6, SW = [1.1, 1.5, 1.9], UNW = 2.3, FIN = 3.7, STEP = 0.2, LIFE = 4.4, GY = H.GY;
    const NR = cel ? 3 : ev >= 4 ? 2 : 1, HK = 1 + 0.07 * (ev - 1), BW = (0.42 + 0.02 * (ev - 1)) * (NR >= 3 ? 0.78 : NR >= 2 ? 0.9 : 1), TW = TAU * 2.2, SEG = 54, NFR = H.n(cel ? 18 : ev >= 4 ? 12 : 8);
    const coilR = i => R * (1 - i / COILS * 0.75), unwOf = (t, i) => cl((t - UNW - (COILS - 1 - i) * STEP) / 0.4);
    H.warn(x, y, R, 1.0, C.col); H.X.banner('EVENTIDE SPIRAL', '', C.col, 1.4); H.X.sfx.hum();
    [floorSpr, swirlSpr, ringSide, ringTop, fragSpr, waveSpr].forEach(f => f());
    const rib = []; for (let i = 0; i < NR; i++) rib.push({ b: i * TAU / NR, ph: R1(i * 2.1) });
    const frags = []; for (let i = 0; i < NFR; i++) frags.push({ u: 0.1 + 0.85 * R1(i * 1.7), a: R1(i * 3.1) * TAU, k: 1.25 + 0.5 * R1(i * 4.3), s: 0.14 + 0.14 * R1(i * 6.1), rot: R1(i) * TAU, vr: (R1(i * 2.9) - 0.5) * 5, sp: 1.2 + 0.8 * R1(i * 8.7), bob: R1(i * 5.5) * TAU, vx: 0, vy: 0, vz: 0, z: 0, flung: false });
    const pts = []; for (let k = 0; k <= SEG; k++) pts.push({});
    // the fractures (Celestial): fixed spots along each ribbon, each a short jagged branch
    const fracs = []; if (cel) for (let i = 0; i < 14; i++) fracs.push({ u: 0.08 + 0.88 * R1(i * 9.3 + 2), sd: i, len: 0.5 + 0.5 * R1(i * 4.1) });
    let phi = 0;
    /* a smooth dimming weight near the pet's head on screen: the spiral never covers it */
    const petDim = (T, px, py) => { const hx = H.sx(me.x), hy = H.sy(me.y) - T * 0.46; return 1 - 0.72 * (1 - sstep(T * 0.5, T * 1.45, Math.hypot(px - hx, (py - hy) * 1.25))); };
    /* a ribbon's spine: per segment its floor point on screen, its height, band height, light, facing and alpha */
    const spine = (r, f, X, Y, T) => { const t = f.t, grow = H.ease.out(cl(t / 1.0));
      for (let k = 0; k <= SEG; k++) { const u = k / SEG, p = pts[k], un = unwOf(t, u * (COILS - 1)), a = r.b + phi + u * TW;
        const rr = R * (1 - 0.75 * u) * grow * (1 + un * 0.8) * (1 + 0.03 * Math.sin(t * 3 + u * 9 + r.ph * 6)), h = (0.3 + 3.75 * u) * HK * grow * (1 - un);
        p.x = X + Math.cos(a) * rr * T; p.y = Y + Math.sin(a) * rr * T * GY; p.h = h * T; p.w = T * BW * (1.1 - 0.4 * u) * (1 - 0.45 * sstep(0.86, 1, u)) * grow * (1 - un);
        p.a = a; p.ca = Math.cos(a); p.sa = Math.sin(a); p.vis = u <= grow && un < 1; p.al = (1 - un) * (1 - un) * cl(u / 0.07 + 0.1) * (1 - 0.6 * sstep(0.9, 1, u)); p.L = 0.5 + 0.5 * Math.cos(a - 3.9); p.u = u; } };
    const drawRib = (c, r, f, X, Y, T, front) => { spine(r, f, X, Y, T); const t = f.t, fa = cl(Math.min(t / 0.25, (FIN + 0.25 - t) / 0.3)); if (fa <= 0.01) return;
      const lipT = T * 0.17, pulse = f.pulse;
      for (let k = 0; k < SEG; k++) { const p = pts[k], q = pts[k + 1]; if (!p.vis || !q.vis) continue; const sa = (p.sa + q.sa) * 0.5; if ((sa > 0) !== front) continue;
        const edgeOn = Math.abs(sa), L = (p.L + q.L) * 0.5, li = Math.round(L * (NL - 1)), dim = petDim(T, (p.x + q.x) * 0.5, (p.y + q.y) * 0.5 - p.h - p.w * 0.5);
        const A = fa * p.al * dim * (front ? 1 : 0.8), y0 = p.y - p.h, y1 = q.y - q.h, t0 = y0 - p.w, t1 = y1 - q.w;
        // the face: outer (front half) near-black, inner (back half) plum; denser where the band turns edge-on
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = css(front ? OUT[li] : INN[li], A * (0.86 + 0.1 * (1 - edgeOn)));
        c.beginPath(); c.moveTo(p.x, y0); c.lineTo(q.x, y1); c.lineTo(q.x, t1); c.lineTo(p.x, t0); c.closePath(); c.fill();
        // the top lip: the band's thickness, stepping inward from the upper edge
        const ix0 = -p.ca * lipT, iy0 = -p.sa * lipT * GY, ix1 = -q.ca * lipT, iy1 = -q.sa * lipT * GY;
        c.fillStyle = css(LIP[li], A * 0.9); c.beginPath(); c.moveTo(p.x, t0); c.lineTo(q.x, t1); c.lineTo(q.x + ix1, t1 + iy1); c.lineTo(p.x + ix0, t0 + iy0); c.closePath(); c.fill();
        // a shadow under the lower edge of the band where it turns to the camera (the volume sits on the coil below)
        if (front) { c.fillStyle = css(VOID, A * 0.35 * edgeOn); c.beginPath(); c.moveTo(p.x, y0); c.lineTo(q.x, y1); c.lineTo(q.x, y1 + T * 0.05); c.lineTo(p.x, y0 + T * 0.05); c.closePath(); c.fill(); }
        c.globalCompositeOperation = 'lighter';
        // the rim light along the upper outer edge, brighter on the lit side and in the sweeps' pulses
        c.strokeStyle = css(EDGE, A * (0.22 + 0.5 * L + 0.3 * pulse) * (front ? 1 : 0.55)); c.lineWidth = 1 + 0.6 * L; c.beginPath(); c.moveTo(p.x, t0); c.lineTo(q.x, t1); c.stroke();
        // currents running up the band (a second, faster one from Adept)
        const NC = ev >= 4 ? 2 : 1; for (let s = 0; s < NC; s++) { const ph = (p.u * 2.6 - t * (0.7 + 0.5 * s) + r.ph + s * 0.5) % 1, v = ph < 0 ? ph + 1 : ph; if (v < 0.16) { const kk = Math.sin(v / 0.16 * Math.PI); c.strokeStyle = css(s ? ACC : EDGE, A * kk * (0.45 + 0.4 * pulse) * (front ? 1 : 0.5)); c.lineWidth = Math.max(1.2, p.w * (0.22 - 0.06 * s)); c.beginPath(); c.moveTo(p.x, y0 - p.w * (0.5 + 0.15 * s)); c.lineTo(q.x, y1 - q.w * (0.5 + 0.15 * s)); c.stroke(); } }
        // the fractures (Celestial): short jagged violet branches from the upper edge, flickering
        if (cel) for (const fr of fracs) { if (fr.u < p.u || fr.u >= q.u) continue; const fl = 0.35 + 0.65 * Math.abs(Math.sin(t * 6 + fr.sd * 1.7)), mx = p.x + (q.x - p.x) * 0.5, my = t0 + (t1 - t0) * 0.5, dn = p.w * fr.len; c.strokeStyle = css(EDGE, A * fl * 0.9); c.lineWidth = 1;
          c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + T * 0.06 * (fr.sd % 2 ? 1 : -1), my + dn * 0.4); c.lineTo(mx - T * 0.04 * (fr.sd % 2 ? 1 : -1), my + dn * 0.75); c.lineTo(mx + T * 0.05, my + dn); c.moveTo(mx + T * 0.06 * (fr.sd % 2 ? 1 : -1), my + dn * 0.4); c.lineTo(mx + T * 0.14 * (fr.sd % 2 ? 1 : -1), my + dn * 0.55); c.stroke(); } }
      c.globalCompositeOperation = 'source-over'; };
    // a fragment's place on screen
    const fragPos = (fr, f, X, Y, T) => { const grow = H.ease.out(cl(f.t / 1.0)); if (fr.flung) return [X + fr.px * T, Y + fr.py * T * GY - fr.z * T]; const un = unwOf(f.t, fr.u * (COILS - 1)), rr = R * (1 - 0.75 * fr.u) * fr.k * grow * (1 + un * 0.9), h = ((0.3 + 3.75 * fr.u) * HK * (1 - un) + 0.25 * Math.sin(f.t * 2 + fr.bob)) * grow; return [X + Math.cos(fr.a) * rr * T, Y + Math.sin(fr.a) * rr * T * GY - h * T]; };
    const drawFrags = (c, f, X, Y, T, front) => { const t = f.t, img = fragSpr(), fa = cl(t / 0.6) * (f.bt ? cl(1 - (t - f.bt) / 0.8) : 1); if (fa <= 0.01) return;
      for (const fr of frags) { if (!fr.flung && (Math.sin(fr.a) > 0) !== front) continue; if (fr.flung && !front) continue; const [px, py] = fragPos(fr, f, X, Y, T), s = T * fr.s * (0.7 + 0.3 * fa), a = fa * petDim(T, px, py); if (a < 0.02) continue;
        c.save(); c.translate(px, py); c.rotate(fr.rot); c.globalAlpha = a; c.drawImage(img, -s, -s, s * 2, s * 2); c.restore(); } };
    const rings = [];
    H.add({ life: LIFE, x, y, pulse: 0, nsw: 0, ncoil: 0, bt: 0,
      update(dt, f) { const t = f.t; phi += (1.1 + 1.4 * cl(t / UNW) + (t > UNW ? 1.2 : 0)) * dt; f.pulse = Math.max(0, f.pulse - dt * 2.2);
        for (const fr of frags) { if (fr.flung) { fr.vx *= Math.exp(-1.6 * dt); fr.vy *= Math.exp(-1.6 * dt); fr.px += fr.vx * dt; fr.py += fr.vy * dt; fr.vz -= 9 * dt; fr.z = Math.max(0, fr.z + fr.vz * dt); fr.rot += fr.vr * 1.5 * dt; } else { fr.a += fr.sp * (1 + 0.8 * cl(t / UNW)) * dt; fr.rot += fr.vr * dt; } }
        // the sweeps' pulses (the hits are scheduled below, at the old beats)
        while (f.nsw < SW.length && t >= SW[f.nsw]) { f.nsw++; f.pulse = 1; }
        // the coils tearing loose from the top: each becomes a torn ring on the floor
        while (f.ncoil < COILS && t >= UNW + f.ncoil * STEP + 0.1) { const i = COILS - 1 - f.ncoil; f.ncoil++; const r0 = coilR(i); rings.push({ r0, r1: r0 * 1.8 + 0.6 + (cel && i === 0 ? 1.6 : 0), t0: t, w: 0.26 + 0.05 * (COILS - 1 - i) / COILS }); f.pulse = Math.max(f.pulse, 0.7);
          for (let k = 0; k < H.n(5); k++) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: x + Math.cos(b) * r0, y: y + Math.sin(b) * r0 * GY - 0.2, vx: Math.cos(b) * 2.2, vy: Math.sin(b) * 1.3 - 0.4, life: 0.8, max: 0.8, size: 0.55, color: 'rgba(40,22,66,' }); } }
        if (t < FIN) {
          // smoke and ash peeling off the back of the ribbon, drifting out and up; a little violet dust at the foot
          const grow = H.ease.out(cl(t / 1.0));
          if (t > 0.2 && Math.random() < 1.3 * H.Q()) { const r = rib[Math.floor(Math.random() * NR)], u = 0.15 + 0.8 * Math.random() * grow, un = unwOf(t, u * (COILS - 1)); if (un < 1) { const a = r.b + phi + u * TW, rr = R * (1 - 0.75 * u) * grow * (1 + un * 0.8), h = (0.3 + 3.75 * u) * HK * grow * (1 - un);
            if (Math.random() < 0.6) H.P({ kind: 'smoke', x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * GY - h, vx: Math.cos(a) * 0.9 - Math.sin(a) * 0.8, vy: -0.45 + Math.sin(a) * 0.3, life: 1.0, max: 1.0, size: 0.42 + 0.25 * Math.random(), color: Math.random() < 0.5 ? 'rgba(34,20,58,' : 'rgba(60,36,92,' });
            else H.P({ kind: 'shard', x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * GY - h, vx: Math.cos(a) * 1.4, vy: -0.2, g: 1.2, life: 1.1, max: 1.1, size: 1.4 + Math.random(), rot: a, vr: 4, color: Math.random() < 0.5 ? '#463052' : '#6D28A8' }); } }
          if (t > 0.6 && Math.random() < 0.9 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'spark', x: x + Math.cos(b) * R * 0.5, y: y + Math.sin(b) * R * 0.3, vx: -Math.sin(b) * 1.5, vy: -2.5 - Math.random() * 2, life: 0.7, max: 0.7, size: 1.6, color: Math.random() < 0.6 ? EDGEh : ACCh }); } }
        if (!f.bt && t >= FIN) { f.bt = t;   // the dark bloom: the fragments fly, mist rolls out, light runs across the floor
          for (const fr of frags) { const un = unwOf(t, fr.u * (COILS - 1)), rr = R * (1 - 0.75 * fr.u) * fr.k * (1 + un * 0.9); fr.px = Math.cos(fr.a) * rr; fr.py = Math.sin(fr.a) * rr; fr.z = (0.3 + 3.75 * fr.u) * HK * (1 - un) + 0.3; fr.vx = fr.px * 1.8 + (Math.random() - 0.5) * 2; fr.vy = fr.py * 1.8 + (Math.random() - 0.5) * 2; fr.vz = 2 + Math.random() * 4; fr.flung = true; }
          for (let k = 0; k < H.n(16); k++) { const b = Math.random() * TAU, v = 1.5 + Math.random() * 2.5; H.P({ kind: 'smoke', x: x + Math.cos(b) * 0.3, y: y + Math.sin(b) * 0.2 - 0.6, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6 - 0.6, life: 1.1, max: 1.1, size: 0.7 + Math.random() * 0.5, color: k % 3 ? 'rgba(30,16,52,' : 'rgba(80,40,130,' }); }
          H.burst(x, y - 0.8, 'shard', 14, { v: 7, up: 3, g: 9, life: 0.7, size: 3.5, color: ['#463052', EDGEh, '#2B0B45'] }); } },
      drawUnder(c, f, X, Y, T) { const t = f.t, fa = cl(Math.min(t / 0.4, (LIFE - t) / 0.7)), sp = H.ease.out(cl(t / 0.6)), Rp = R * T * sp;
        if (Rp < 2) return;
        // the floor: violet light only (a ring, slow spiral arms turning, a glow that swells with the pulses), fully gone at the end
        c.save(); c.globalCompositeOperation = 'lighter';
        blitF(c, floorSpr(), X, Y, Rp * 1.15, GY, fa * (0.55 + 0.4 * f.pulse) * (f.bt ? cl(1 - (t - f.bt) / 0.6) : 1));
        blitF(c, swirlSpr(), X, Y, Rp * 1.05, GY, fa * (0.5 + 0.3 * f.pulse) * (f.bt ? cl(1 - (t - f.bt) / 0.5) : 1), -phi * 0.6);
        if (ev >= 4) blitF(c, swirlSpr(), X, Y, Rp * 0.7, GY, fa * 0.35, phi * 0.9 + 1);
        H.glow(c, X, Y, Rp * 0.5, ENERh, fa * (0.25 + 0.35 * f.pulse));
        // the sweeps: a wave of light racing out across the floor
        for (let i = 0; i < SW.length; i++) { const u = (t - SW[i]) / 0.45; if (u <= 0 || u >= 1) continue; blitF(c, waveSpr(), X, Y, Rp * (0.15 + 1.0 * H.ease.out(u)) / 0.9, GY, (1 - u) * 0.8); }
        c.restore();
        // the torn rings of each unwound coil: a thick band (side under, top lifted) with a luminous inner rim, feathered outward, racing out and thinning
        for (const q of rings) { const u = cl((t - q.t0) / 0.6); if (u >= 1) continue; const rad = lerp(q.r0, q.r1, H.ease.out(u)) * T / 0.78, a = Math.pow(1 - u, 1.3) * 0.95, th = T * q.w * (1 - 0.55 * u) * 0.8, dim = petDim(T, X, Y - th) * 0.5 + 0.5;
          blitF(c, ringSide(), X, Y, rad, GY, a * dim); blitF(c, ringSide(), X, Y - th * 0.5, rad, GY, a * dim * 0.8); blitF(c, ringTop(), X, Y - th, rad, GY, a * dim);
          c.save(); c.globalCompositeOperation = 'lighter'; blitF(c, waveSpr(), X, Y - th, rad * 0.9 / 0.9, GY, a * 0.55); c.restore(); }
        // the back halves of the ribbons and the fragments behind the axis (under the monsters)
        c.save(); for (const r of rib) drawRib(c, r, f, X, Y, T, false); drawFrags(c, f, X, Y, T, false); c.restore(); },
      draw(c, f, X, Y, T) { const t = f.t;
        // the front halves, the fragments in front, the core
        for (const r of rib) drawRib(c, r, f, X, Y, T, true); drawFrags(c, f, X, Y, T, true);
        if (t > UNW && t < FIN + 0.35) { const u = cl((t - UNW) / (FIN - UNW)), col = t > FIN ? cl((t - FIN) / 0.35) : 0, cz = T * 1.2 * HK * (1 - col), cr = Math.max(1, T * (0.3 + u * 0.3) * (1 - col * 0.6)), dim = petDim(T, X, Y - cz);
          if (col < 1) { H.glow(c, X, Y - cz, cr * 2.6, ENERh, 0.5 * (1 - col) * dim); H.core(c, X, Y - cz, cr, EDGEh, ACCh, 0.85 * (1 - col) * dim); } }
        if (f.bt) { const u = cl((t - f.bt) / 0.6); if (u < 1) { c.save(); c.globalCompositeOperation = 'lighter'; H.glow(c, X, Y - T * 0.6, T * (1.5 + u * 2.5), EDGEh, (1 - u) * 0.7); blitF(c, waveSpr(), X, Y, T * (0.6 + (R + 1.2) * H.ease.out(u)), GY, (1 - u) * 0.9); c.restore(); } } } });
    // the hits: the old Eventide Spiral's beats, areas and split (x K and the level factor)
    SW.forEach((t0, i) => H.X.after(t0, () => { H.hitRing(x, y, 0, R + 0.3, C.base * 1.5 * DK, C.dmgO({ kb: 1 })); for (const m of H.near(x, y, R + 1)) H.pull(m, x, y, 0.35); H.X.ring(x, y, 0.3, R, 0.4, i % 2 ? ACCh : EDGEh, 0.4); H.burst(x, y, 'spark', 8, { v: 5, up: 2, life: 0.45, size: 1.8, color: [EDGEh, ACCh] }); H.X.light(x, y, R, 0.25); H.X.shake(4, 0.12); H.X.sfx.whoosh(); }));
    for (let i = COILS - 1; i >= 0; i--) H.X.after(UNW + (COILS - 1 - i) * STEP + 0.3, () => { const r0 = coilR(i), r1 = r0 * 1.8 + 0.6; H.hitRing(x, y, Math.max(0, r0 - 0.4), r1, C.base * 0.8 * DK, C.dmgO({ kb: 2 })); H.X.ring(x, y, r0, r1, 0.4, i % 2 ? ACCh : EDGEh, 0.45); H.burst(x, y, 'shard', 6, { v: 6, up: 2, g: 9, life: 0.55, size: 3.5, color: ['#463052', EDGEh, '#2B0B45'] }); H.X.shake(3, 0.1); H.X.sfx.thud(); });
    H.X.after(FIN, () => { H.hitArea(x, y, R + 0.5, C.base * 3.6 * DK, C.dmgO({ kb: 6, stun: 0.5 })); H.X.boom(x, y, 2.0, EDGEh, ACCh, { n: 36, shake: 16, smoke: 6 }); H.X.ring(x, y, 0.3, R + 0.5, 0.5, EDGEh, 0.55); H.X.flash(0.2, ACCh); H.X.light(x, y, R + 1, 0.4); H.X.hitstop(0.08); H.X.sfx.crash(); });
  };
})();
