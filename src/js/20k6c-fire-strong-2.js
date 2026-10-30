/* ---------- Fire, reworked: Firewheel Skip, Candlewick Chain, Salamander Rush, Hearthburst, Falling Matchstars ----------
   Spike Bloom standard (see 20k6a-fire-kit.js): flames are FK volumes; solid fire (the wheel rim, the salamander's hide,
   the hearth stones, the match heads) is shaded in tone ramps with a dark crust, glowing seams, a rim light and an
   outline; every burning thing lights the floor and sheds embers; every contact leaves a scorch. Loads after
   20k6-elem-fire.js and replaces these five Strong attacks. */
(() => {
  const S = ELEM_IMPL.fire.strong, TAU = Math.PI * 2;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---- move-specific shapes ---- */
  /* a wheel of fire at screen (x, y), r px: flame blades trailing the spin off a molten rim, four molten spokes, a hot hub */
  function wheel(c, H, K, x, y, r, rot, t, s, nb, a, dir) {
    const P = K.P; if (r < 2 || a <= 0.01) return;
    K.glow(c, x, y, r * 2.3, P.org, 0.5 * a); K.glow(c, x, y, r * 1.1, P.yel, 0.3 * a);
    for (let i = 0; i < nb; i++) { const b = rot + i / nb * TAU, fx = x + Math.cos(b) * r * 0.72, fy = y + Math.sin(b) * r * 0.72; K.flameAt(c, fx, fy, b - dir * 0.8, r * 0.52, r * (0.95 + 0.25 * Math.sin(t * 15 + i * 2.3 + s)), t, i * 1.7 + s, 0.95 * a); }
    c.save(); c.globalAlpha = a; c.lineCap = 'butt';
    const rr = r * 0.6, rw = r * 0.22;
    // the disc inside the rim: a turning sheet of flame, white at the hub
    const gd = c.createRadialGradient(x - r * 0.1, y - r * 0.12, 0, x, y, rr); gd.addColorStop(0, P.wht); gd.addColorStop(0.4, P.yel); gd.addColorStop(0.75, P.amb); gd.addColorStop(1, P.org); c.fillStyle = gd; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const b = rot * 1.4 + i * 2.1; c.strokeStyle = H.rgba(P.yel, 0.55); c.lineWidth = Math.max(1, r * 0.07); c.beginPath(); c.arc(x, y, rr * (0.45 + i * 0.15), b, b + 1.5 * dir, dir < 0); c.stroke(); } c.restore();
    c.strokeStyle = P.char; c.lineWidth = rw + 2; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.stroke();
    const g = c.createLinearGradient(x - rr, y - rr, x + rr, y + rr); g.addColorStop(0, P.yel); g.addColorStop(0.35, P.org); g.addColorStop(1, P.dred);
    c.strokeStyle = g; c.lineWidth = rw; c.stroke();
    // plates of dark crust riding on the molten rim, lit on the upper left
    const gc = c.createLinearGradient(x - rr, y - rr, x + rr, y + rr); gc.addColorStop(0, P.crustL); gc.addColorStop(0.5, P.crust); gc.addColorStop(1, P.char);
    const seg = TAU * rr / 5; c.setLineDash([seg * 0.58, seg * 0.42]); c.lineDashOffset = -rot * rr; c.strokeStyle = gc; c.lineWidth = rw * 0.6; c.stroke(); c.setLineDash([]);
    // a molten inner lip
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = H.rgba(P.org, 0.85); c.lineWidth = Math.max(1, r * 0.06); c.beginPath(); c.arc(x, y, rr - rw * 0.32, 0, TAU); c.stroke();
    c.lineCap = 'round';
    // the rim light on the upper left
    c.strokeStyle = H.rgba(P.wht, 0.55); c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, rr + rw * 0.42, Math.PI * 0.95, Math.PI * 1.55); c.stroke();
    // motion arcs trailing the spin outside the blades
    c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const b = rot + i / 3 * TAU; c.strokeStyle = H.rgba(P.amb, 0.5); c.lineWidth = Math.max(1.5, r * 0.08); c.beginPath(); c.arc(x, y, r * 1.18, b - dir * 1.1, b, dir < 0); c.stroke(); }
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 4; i++) { const b = rot + i / 4 * TAU + 0.6, ex = x + Math.cos(b) * (rr - rw * 0.4), ey = y + Math.sin(b) * (rr - rw * 0.4); c.strokeStyle = H.rgba(P.char, 0.8); c.lineWidth = r * 0.12 + 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke(); c.strokeStyle = i % 2 ? P.red : P.org; c.lineWidth = r * 0.12; c.stroke(); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.85); c.lineWidth = Math.max(1, r * 0.05); c.stroke(); c.restore(); }
    H.sphere(c, x, y, r * 0.22, P.org, P.wht, P.dred, { rimCol: P.yel, lw: 1.2 }); H.core(c, x, y, r * 0.16, P.yel, P.wht, 0.75);
    c.restore();
  }
  /* a burnt circular print on the floor: charred rings, spoke-tread marks, a cooling glow */
  function wheelPrint(c, H, K, X, Y, r, a, heat, seed) {
    K.scorch(c, X, Y, r, a, heat, seed); const P = K.P; c.save(); c.globalAlpha = a; c.lineWidth = Math.max(1.5, r * 0.08);
    c.strokeStyle = H.rgba(P.char, 0.5); H.floorEllipse(c, X, Y, r * 0.72); c.stroke(); H.floorEllipse(c, X, Y, r * 0.4); c.stroke();
    if (heat > 0.02) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.7 * heat); c.lineWidth = Math.max(1, r * 0.05); H.floorEllipse(c, X, Y, r * 0.56); c.stroke();
      c.strokeStyle = H.rgba(P.yel, 0.6 * heat); for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + seed; c.beginPath(); c.moveTo(X + Math.cos(b) * r * 0.78, Y + Math.sin(b) * r * 0.78 * H.GY); c.lineTo(X + Math.cos(b) * r * 0.96, Y + Math.sin(b) * r * 0.96 * H.GY); c.stroke(); } }
    c.restore();
  }
  /* a salamander of living fire along a screen spine (tail .. head): legs, a shaded hide with a crusted, seamed back, a crest of flame, a head with white-hot eyes */
  function salamander(c, H, K, pts, sc, t, step, a, seed) {
    const P = K.P, n = pts.length; if (n < 3 || a <= 0.01) return; c.save(); c.globalAlpha = a; c.lineJoin = 'round'; c.lineCap = 'round';
    const nrm = [], rad = [];
    for (let i = 0; i < n; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy) || 1; nrm.push([-dy / d, dx / d]); const u = i / (n - 1); rad.push(sc * (0.08 + 0.42 * Math.sin(Math.min(1, u * 1.25) * Math.PI * 0.5) - 0.1 * Math.max(0, u - 0.82) / 0.18)); }
    for (let i = 0; i < n; i += 2) K.glow(c, pts[i][0], pts[i][1], sc * 1.1, P.org, 0.3);
    // tail flame streaming back
    const tl = pts[0], tdir = Math.atan2(pts[0][1] - pts[1][1], pts[0][0] - pts[1][0]); K.flameAt(c, tl[0], tl[1], tdir, sc * 0.42, sc * (1.1 + 0.25 * Math.sin(t * 13 + seed)), t, seed + 9, 0.9);
    // four legs, stepping: thigh and shin, a clawed foot that scatters sparks
    for (const li of [Math.round((n - 1) * 0.42), Math.round((n - 1) * 0.76)]) for (const sd of [-1, 1]) {
      const p = pts[li], nm = nrm[li], ph = step + (li > n / 2 ? 0 : Math.PI) + (sd > 0 ? Math.PI : 0), sw = Math.sin(ph), lift = Math.max(0, Math.cos(ph)), dx = pts[Math.min(n - 1, li + 1)][0] - pts[li - 1][0], dy = pts[Math.min(n - 1, li + 1)][1] - pts[li - 1][1], dl = Math.hypot(dx, dy) || 1, fx = dx / dl, fy = dy / dl;
      const kx = p[0] + nm[0] * sd * sc * 0.6 + fx * sw * sc * 0.16, ky = p[1] + nm[1] * sd * sc * 0.6 + fy * sw * sc * 0.16 - sc * 0.12, ftx = p[0] + nm[0] * sd * sc * 0.74 + fx * sw * sc * 0.36, fty = p[1] + nm[1] * sd * sc * 0.74 + fy * sw * sc * 0.36 + sc * 0.26 - lift * sc * 0.16;
      c.strokeStyle = P.char; c.lineWidth = sc * 0.19 + 2.5; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(kx, ky); c.lineTo(ftx, fty); c.stroke(); c.strokeStyle = sd > 0 ? P.red : P.org; c.lineWidth = sc * 0.19; c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.7); c.lineWidth = Math.max(1, sc * 0.04); c.stroke(); c.restore();
      c.fillStyle = P.gold; for (let k = -1; k <= 1; k++) { c.beginPath(); c.arc(ftx + fx * sc * 0.1 + nm[0] * k * sc * 0.08, fty + fy * sc * 0.1 + nm[1] * k * sc * 0.08, Math.max(1.3, sc * 0.05), 0, TAU); c.fill(); }
    }
    // the hide: an outlined silhouette, lit along its upper side, a dark crusted back with glowing seams
    const L = [], R = []; for (let i = 0; i < n; i++) { L.push([pts[i][0] + nrm[i][0] * rad[i], pts[i][1] + nrm[i][1] * rad[i]]); R.push([pts[i][0] - nrm[i][0] * rad[i], pts[i][1] - nrm[i][1] * rad[i]]); }
    const body = () => { c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]); for (let i = n - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath(); };
    let y0 = 1e9, y1 = -1e9; for (const p of L.concat(R)) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    body(); c.strokeStyle = P.char; c.lineWidth = 3; c.stroke();
    const gb = c.createLinearGradient(0, y0 - 2, 0, y1 + 2); gb.addColorStop(0, P.yel); gb.addColorStop(0.3, P.amb); gb.addColorStop(0.62, P.org); gb.addColorStop(1, P.dred); c.fillStyle = gb; c.fill();
    c.save(); body(); c.clip();
    c.strokeStyle = P.crust; c.lineWidth = sc * 0.26; c.beginPath(); for (let i = 1; i < n; i++) { const p = pts[i]; i === 1 ? c.moveTo(p[0], p[1] - sc * 0.03) : c.lineTo(p[0], p[1] - sc * 0.03); } c.stroke();
    c.strokeStyle = H.rgba(P.char, 0.7); c.lineWidth = sc * 0.12; c.stroke();
    c.globalCompositeOperation = 'lighter'; for (let i = 2; i < n - 1; i++) { const p = pts[i], nm = nrm[i], k = 0.55 + 0.45 * Math.sin(t * 12 + i * 1.9 + seed); c.strokeStyle = H.rgba(i % 2 ? P.yel : P.amb, 0.9 * k); c.lineWidth = Math.max(1, sc * 0.05); c.beginPath(); c.moveTo(p[0] + nm[0] * sc * 0.15, p[1] + nm[1] * sc * 0.15); c.lineTo(p[0] - nm[0] * sc * 0.15, p[1] - nm[1] * sc * 0.15); c.stroke(); }
    c.restore();
    const up = L[(n / 2) | 0][1] < R[(n / 2) | 0][1] ? L : R; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.wht, 0.55); c.lineWidth = 1.5; c.beginPath(); for (let i = 1; i < n - 1; i++) i === 1 ? c.moveTo(up[i][0], up[i][1] + 1) : c.lineTo(up[i][0], up[i][1] + 1); c.stroke(); c.restore();
    // a crest of flames along the back
    for (const u of [0.3, 0.5, 0.68]) { const i = Math.round((n - 1) * u), p = pts[i], dx = pts[n - 1][0] - pts[0][0]; K.flame(c, p[0], p[1] - sc * 0.08, sc * 0.42, sc * (0.8 + 0.35 * u) * (0.9 + 0.1 * Math.sin(t * 9 + i)), t, i * 2.1 + seed, -Math.sign(dx || 1) * sc * 0.35, 0.95); }
    // the head: a shaded wedge, crusted crown, white-hot eyes, a glowing mouth
    const hd = pts[n - 1], hp = pts[n - 2], hdx = hd[0] - hp[0], hdy = hd[1] - hp[1], hl = Math.hypot(hdx, hdy) || 1, fx = hdx / hl, fy = hdy / hl, nx = -fy, ny = fx, Q = (u, v) => [hd[0] + fx * u * sc + nx * v * sc, hd[1] + fy * u * sc + ny * v * sc];
    const head = [Q(-0.2, -0.36), Q(0.12, -0.4), Q(0.36, -0.3), Q(0.52, -0.12), Q(0.56, 0), Q(0.52, 0.12), Q(0.36, 0.3), Q(0.12, 0.4), Q(-0.2, 0.36)];
    let hy0 = 1e9, hy1 = -1e9; for (const p of head) { hy0 = Math.min(hy0, p[1]); hy1 = Math.max(hy1, p[1]); }
    H.poly(c, head); c.strokeStyle = P.char; c.lineWidth = 3; c.stroke(); const gh = c.createLinearGradient(0, hy0 - 2, 0, hy1 + 2); gh.addColorStop(0, P.yel); gh.addColorStop(0.35, P.amb); gh.addColorStop(0.7, P.org); gh.addColorStop(1, P.red); c.fillStyle = gh; c.fill();
    H.poly(c, [Q(-0.12, -0.17), Q(0.2, -0.13), Q(0.32, 0), Q(0.2, 0.13), Q(-0.12, 0.17)]); c.fillStyle = P.crust; c.fill(); c.strokeStyle = H.rgba(P.char, 0.8); c.lineWidth = 1; c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.amb, 0.9); c.lineWidth = Math.max(1, sc * 0.04); const s1 = Q(-0.08, 0), s2 = Q(0.24, 0); c.beginPath(); c.moveTo(s1[0], s1[1]); c.lineTo(s2[0], s2[1]); c.stroke();
    for (const sd of [-1, 1]) { const e = Q(0.2, sd * 0.24); c.fillStyle = P.wht; c.beginPath(); c.arc(e[0], e[1], Math.max(1.5, sc * 0.06), 0, TAU); c.fill(); K.glow(c, e[0], e[1], sc * 0.18, P.yel, 0.7); }
    const m = Q(0.54, 0); H.core(c, m[0], m[1], sc * 0.14, P.yel, P.wht, 0.85); c.restore();
    c.restore();
  }
  /* a five-pointed glint (the "star" of a matchstar) */
  function glint(c, H, x, y, r, rot, col, a) { if (r < 1 || a <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const b = rot + i / 10 * TAU - Math.PI / 2, rr = i % 2 ? r * 0.28 : r; i ? c.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr) : c.moveTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); } c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - r * 1.6, y); c.lineTo(x + r * 1.6, y); c.moveTo(x, y - r * 1.6); c.lineTo(x, y + r * 1.6); c.stroke(); c.restore(); }
  /* one hearth stone on the floor at (x, y): a lit top face, a shaded front, a glowing seam at its foot */
  function stone(c, H, K, x, y, w, h, heat, a) { if (h < 0.5 || a <= 0.01) return; const P = K.P; c.save(); c.globalAlpha = a; const top = [[x - w / 2, y - h], [x - w * 0.36, y - h - w * 0.22], [x + w * 0.4, y - h - w * 0.22], [x + w / 2, y - h]];
    const gf = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gf.addColorStop(0, P.crustL); gf.addColorStop(0.5, P.crust); gf.addColorStop(1, P.char); c.fillStyle = gf; c.fillRect(x - w / 2, y - h, w, h);
    H.poly(c, top); c.fillStyle = H.mix(P.crustL, '#FFB070', 0.25 + 0.4 * heat); c.fill();
    c.strokeStyle = P.char; c.lineWidth = 1.2; c.strokeRect(x - w / 2, y - h, w, h); H.poly(c, top); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.85 * heat); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - w * 0.3, y - h * 0.15); c.lineTo(x - w * 0.05, y - h * 0.55); c.lineTo(x + w * 0.2, y - h * 0.3); c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.8 * heat); c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.stroke(); c.restore(); }

  /* F-S06 Firewheel Skip: wheels of fire spin up beside you and skip along the aim in a fan, each contact printing a burnt
     ring; the last bounce breaks each wheel into rolling coals that cool.
     Evolution: FK.evoN(C, 1, 7) wheels (one at Hatchling, seven at Celestial), the damage split between them; at Celestial
     each last bounce bursts. */
  S.firewheel = (C, H) => { const K = FK.bind(H), P = K.P, me = H.me, N = K.evoN(C, 1, 7), ev = K.evo(C), dx = C.tx - me.x, dy = C.ty - me.y, d = Math.max(2.5, Math.hypot(dx, dy)), a0 = Math.atan2(dy, dx), L = Math.min(d + 1.5, 7), HOP = 0.32, NH = 3, SPIN = 0.18;
    const spread = N > 1 ? Math.min(0.32, 1.85 / (N - 1)) : 0, rk = N === 1 ? 0.62 : Math.max(0.4, 0.6 - 0.035 * (N - 1)), nb = N > 3 ? 5 : 8, share = C.K * K.evoK(C) / N, fin = ev >= 7;
    H.X.sfx.whoosh(); me.sq = 0.6;
    for (let i = 0; i < N; i++) { const off = i - (N - 1) / 2, ang = a0 + off * spread, ca = Math.cos(ang), sa = Math.sin(ang), lead = i === Math.floor(N / 2), sb = a0 + off * (N > 1 ? Math.min(0.42, 2.4 / (N - 1)) : 0), x0 = me.x + Math.cos(sb) * 1.25, y0 = me.y + Math.sin(sb) * 1.25, Lw = L - 1.25 + 0.15 * Math.abs(off), dl = SPIN + Math.abs(off) * 0.03, dir = ca >= 0 ? 1 : -1, marks = [], coals = [];
      H.add({ life: dl + HOP * NH + 0.85, x: x0, y: y0, z: 0, rot: i * 0.7, hop: 0, done: 0, hist: [], seed: i * 2.3,
        update(dt, f) { f.rot += dt * 16 * dir; const tt = f.t - dl;
          if (!f.done) K.aura(f.x, f.y, rk * 0.6, dt, N > 3 ? 6 : 14, (rk + f.z) * 1);
          if (tt < 0) { if (Math.random() < 0.6 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'spark', x: x0 + Math.cos(b) * 0.8, y: y0 - rk + Math.sin(b) * 0.8, vx: -Math.cos(b) * 4, vy: -Math.sin(b) * 4, life: 0.2, max: 0.2, size: 2, color: P.yel }); } return; }
          if (f.done) return; const u = tt / (HOP * NH);
          const land = (x, y, r, dmg, last) => { H.hitArea(x, y, r, C.base * dmg * share, C.dmgO({ kb: last ? 3 : 2, burn: 1 })); marks.push({ x, y, r, t: f.t }); K.sparks(x, y, N > 3 ? 4 : 7); K.embers(x, y, N > 3 ? 3 : 6); K.flakes(x, y, 2); H.X.light(x, y, 1.8, 0.2); if (lead) { H.X.shake(3 + (last ? 2 : 0), 0.1); H.X.sfx.thud(); } };
          if (u >= 1) { f.done = 1; f.endT = f.t; const ex = x0 + ca * Lw, ey = y0 + sa * Lw; f.x = ex; f.y = ey; f.z = 0; land(ex, ey, fin ? 1.35 : 1.0, 0.5, true);
            if (fin) K.blast(ex, ey, 1.0, 0.45); else K.smoke(ex, ey, 3, 0.4);
            for (let k = 0; k < (N > 3 ? 2 : 4); k++) coals.push({ off: (k - (N > 3 ? 0.5 : 1.5)) * 0.32, sp: 2.2 + Math.random() * 1.6, r: 0.11 + Math.random() * 0.05 });
            for (let k = 0; k < H.n(N > 3 ? 5 : 12); k++) H.P({ kind: 'ember', x: ex, y: ey - 0.15, vx: ca * (2 + Math.random() * 4) + (Math.random() - 0.5) * 2, vy: sa * (2 + Math.random() * 4) * 0.7 - Math.random(), g: 3, drag: 1.4, life: 0.8, max: 0.8, size: 3.5, color: k % 3 ? P.org : P.gold }); return; }
          f.x = x0 + ca * Lw * u; f.y = y0 + sa * Lw * u; const hop = Math.floor(tt / HOP), hu = (tt % HOP) / HOP; f.z = Math.sin(hu * Math.PI) * (1.05 - hop * 0.25);
          if (hop > f.hop) { f.hop = hop; land(x0 + ca * Lw * hop / NH, y0 + sa * Lw * hop / NH, 1.0 + hop * 0.15, 0.95, false); }
          f.hist.push([f.x, f.y, f.z]); if (f.hist.length > 7) f.hist.shift(); },
        drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.5), hk = N > 3 ? 0.55 : 1;
          for (const m of marks) { const age = f.t - m.t, mx = H.sx(m.x), my = H.sy(m.y), r = T * m.r * 0.78; wheelPrint(c, H, K, mx, my, r * Math.min(1, 0.4 + age / 0.12), k, Math.max(0, 1 - age / 0.9) * hk, m.x * 3.1); if (age < 0.3) K.shockRing(c, mx, my, r * (0.4 + 1.1 * H.ease.out(age / 0.3)), (1 - age / 0.3) * hk); }
          if (!f.done) { const gs = f.t < dl ? H.ease.out(Math.min(1, f.t / dl)) : 1; K.floorLight(c, X, Y, T * rk * 2.2 * gs, 0.55 / (1 + f.z)); H.softShadow(c, X, Y, T * rk * 0.95 * gs, 0.28 / (1 + f.z)); } },
        draw(c, f, X, Y, T, t) { const r = T * rk;
          if (f.done) { const age = f.t - f.endT; if (age > 0.75) return; const ex = H.sx(f.x), ey = H.sy(f.y), px = -sa, py = ca; for (const co of coals) { const dd = co.sp * (age - age * age * 0.6) * T, cx = ex + ca * dd + px * co.off * T, cy = ey + sa * dd + py * co.off * T - T * co.r, heat = 1 - age / 0.75, rr = T * co.r; K.floorLight(c, cx, cy + rr, rr * 3, 0.4 * heat); H.sphere(c, cx, cy, rr, H.mix(P.crust, P.org, heat), heat > 0.4 ? P.yel : P.crustL, P.char, { lw: 1, spec: false }); if (heat > 0.3) K.flame(c, cx, cy - rr * 0.4, rr * 1.4, rr * 3 * heat, t, co.off * 7, 0, heat); } return; }
          const tt = f.t - dl, gs = tt < 0 ? H.ease.back(Math.min(1, f.t / dl)) : 1, cy = Y - T * (rk + f.z) * gs;
          if (tt > 0 && f.hist.length > 2) H.trail(c, f.hist.map(p => [H.sx(p[0]), H.sy(p[1]) - T * (rk + p[2])]), r * 1.1, P.org, P.yel);
          wheel(c, H, K, X, cy, r * gs, f.rot, t, f.seed, nb, Math.min(1, gs + 0.2), dir); } }); } };

  /* F-S07 Candlewick Chain: a match flares above you, then a burning wick races from monster to monster; the flame runs
     along a sagging cord that chars and crumbles behind it, and every monster it reaches is crowned by a candle-flare.
     Evolution: 5 links at Hatchling to 8 at Celestial with a longer reach (damage per link normalised so the total grows by
     FK.evoK); at Celestial the whole chain re-lights at once for a final flare. */
  S.candlewick = (C, H) => { const K = FK.bind(H), P = K.P, me = H.me, ev = K.evo(C), NL = K.evoN(C, 5, 8), REACH = 4 + (ev - 1) / 6, fin = ev >= 7, LEAD = 0.16, GAP = 0.16, RUN = 0.14, BURN = 0.35, links = [];
    let from = { x: me.x, y: me.y, m: null, src: true }, cur = H.X.nearestMon(C.tx, C.ty, 3.5) || H.X.nearestMon(me.x, me.y, 8, null, true); const done = new Set();
    for (let j = 0; j < NL; j++) { const to = cur ? { x: cur.x, y: cur.y, m: cur } : (j === 0 ? { x: C.tx, y: C.ty, m: null } : null); if (!to) break; links.push({ from, to, t0: LEAD + j * GAP }); if (cur) done.add(cur); from = to; cur = cur ? H.X.nearestMon(cur.x, cur.y, REACH, done) : null; }
    const wts = links.map((l, j) => Math.pow(0.92, j) * (fin ? 1.3 : 1)), old = [0, 1, 2, 3, 4].reduce((s, j) => s + Math.pow(0.92, j), 0), per = C.base * C.K * old * K.evoK(C) / Math.max(old, wts.reduce((s, w) => s + w, 0));
    const pos = e => (e.m && !e.m.dead ? [e.m.x, e.m.y] : [e.x, e.y]), FIN = LEAD + links.length * GAP + 0.3;
    const scr = (e, T) => { const [x, y] = pos(e); return e.src ? [H.sx(x), H.sy(y) - T * 1.3] : [H.sx(x), H.sy(y) - T * 0.8]; };
    H.X.sfx.hum(); me.sq = 0.7;
    H.add({ life: FIN + (fin ? 0.9 : 0.7),
      update(dt, f) { links.forEach(l => { const w = f.t - l.t0 - RUN; if (w > 0 && w < 0.6) { const [x, y] = pos(l.to); K.aura(x, y, 0.3, dt, 9, 0.9); } }); if (f.t < LEAD + 0.1) K.aura(me.x, me.y, 0.15, dt, 10, 1.3); },
      drawUnder(c, f, X, Y, T, t) { links.forEach(l => { const w = f.t - l.t0 - RUN; if (w <= 0) return; const [x, y] = pos(l.to), k = Math.max(0, 1 - w / 0.9); K.floorLight(c, H.sx(x), H.sy(y), T * 0.9, 0.5 * k); }); if (f.t < LEAD + 0.25) K.floorLight(c, H.sx(me.x), H.sy(me.y), T * 0.8, 0.3); },
      draw(c, f, X, Y, T, t) {
        // the match: a flare above your head, gathering then sending the flame off
        if (f.t < LEAD + 0.3) { const [sx, sy] = scr({ x: me.x, y: me.y, src: true }, T), u = Math.min(1, f.t / LEAD), k = f.t < LEAD ? 1 : 1 - (f.t - LEAD) / 0.3; K.flame(c, sx, sy + T * 0.12, T * 0.18 * u, T * 0.5 * u * k + 1, t, 4.2, 0, k); H.core(c, sx, sy, T * 0.12 * u, P.yel, P.wht, 0.9 * k); glint(c, H, sx, sy, T * 0.2 * u * k, t * 2, P.yel, 0.7 * k); }
        links.forEach((l, j) => { const u = cl((f.t - l.t0) / RUN, 0, 1); if (u <= 0) return; const burn = cl((f.t - l.t0 - RUN) / BURN, 0, 1), ka = 1 - cl((f.t - l.t0 - RUN - BURN) / 0.45, 0, 1), [x0, y0] = scr(l.from, T), [x1, y1] = scr(l.to, T), sag = Math.min(T * 0.6, Math.hypot(x1 - x0, y1 - y0) * 0.12);
          const at = s => [x0 + (x1 - x0) * s + Math.sin(s * 13 + j) * T * 0.03, y0 + (y1 - y0) * s + Math.sin(s * Math.PI) * sag];
          // the charred cord left behind the flame, glowing then crumbling
          if (burn > 0 && ka > 0) { c.save(); c.globalAlpha = ka; c.lineCap = 'round'; const cp = []; for (let i = 0; i <= 10; i++) cp.push(at(burn * i / 10)); H.ribbon(c, cp, T * 0.07, P.char); c.globalCompositeOperation = 'lighter'; for (let i = 1; i < cp.length; i += 2) { const fl = 0.5 + 0.5 * Math.sin(t * 17 + i * 2.7 + j); c.fillStyle = H.rgba(i % 4 === 1 ? P.org : P.amb, 0.8 * fl * ka); c.beginPath(); c.arc(cp[i][0], cp[i][1], Math.max(1, T * 0.03), 0, TAU); c.fill(); } c.restore();
            if (ka < 1 && Math.random() < 0.3 * H.Q()) { const s = Math.random() * burn, [fx, fy] = pos(l.from), [ex, ey] = pos(l.to); H.P({ kind: 'shard', x: fx + (ex - fx) * s, y: fy + (ey - fy) * s - 0.8, vx: (Math.random() - 0.5), vy: 0, g: 6, life: 0.4, max: 0.4, size: 2, color: P.char }); } }
          // the burning stretch between the burn front and the racing head
          if (u > burn + 0.02) { const pts = []; for (let i = 0; i <= 6; i++) pts.push(at(burn + (u - burn) * i / 6)); K.ribbon(c, pts, T * 0.17, t, 1, s => 0.45 + 0.55 * s, j * 3); const tail = pts[0]; if (burn > 0) { K.glow(c, tail[0], tail[1], T * 0.35, P.yel, 0.6); if (Math.random() < 0.4 * H.Q()) { const [fx, fy] = pos(l.from), [ex, ey] = pos(l.to); K.smoke(fx + (ex - fx) * burn, fy + (ey - fy) * burn - 0.8, 1, 0.1); } } }
          if (u < 1) { const [hx, hy] = at(u); K.fireball(c, hx, hy, T * 0.13, t, j * 2, 1, Math.atan2(y0 - y1, x0 - x1)); glint(c, H, hx, hy, T * 0.16, t * 4 + j, P.yel, 0.8); }
          // the candle-flare at the contact: a black wick curl crowned with a tall flame; it flares on contact and again in the Celestial finale
          const w = f.t - l.t0 - RUN; if (w > 0) { const wl = 0.7, rel = fin ? f.t - FIN : -1, k = rel > 0 ? Math.max(0, 1 - rel / 0.6) : Math.max(0, 1 - w / wl), fl = rel > 0 ? 1.6 * Math.min(1, rel / 0.06) : 1 + 0.6 * Math.max(0, 1 - w / 0.1); if (k > 0) { const bx = x1, by = y1 - T * 0.05;
            c.save(); c.strokeStyle = P.char; c.lineWidth = Math.max(1.5, T * 0.04); c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by + T * 0.1); c.quadraticCurveTo(bx + T * 0.06, by, bx + T * 0.02, by - T * 0.08); c.stroke(); c.restore();
            K.flame(c, bx + T * 0.02, by - T * 0.04, T * 0.3 * (0.7 + 0.3 * k), T * (0.95 * fl) * (0.6 + 0.4 * k) * Math.min(1, w / 0.05), t, j * 3.3, Math.sin(t * 7 + j) * T * 0.06, Math.min(1, k * 1.5)); H.core(c, bx + T * 0.02, by - T * 0.12, T * 0.09 * k, P.yel, P.wht, 0.8 * k); } } }); } });
    links.forEach((l, j) => H.X.after(l.t0 + RUN, () => { const [ex, ey] = pos(l.to), dmg = per * Math.pow(0.92, j); if (l.to.m && !l.to.m.dead) H.X.hitMon(l.to.m, dmg, C.dmgO({ burn: 1, kb: 1 })); else H.hitArea(ex, ey, 1.0, dmg, C.dmgO({ burn: 1, kb: 1 })); H.flareAt(ex, ey - 0.8, 0.8, 0.2, P.yel); K.sparks(ex, ey - 0.6, 7, 4); K.embers(ex, ey - 0.5, 5); H.X.light(ex, ey, 1.6, 0.2); H.X.sfx.sparkle && H.X.sfx.sparkle(); }));
    if (fin) H.X.after(FIN, () => { links.forEach((l, j) => { const [ex, ey] = pos(l.to), dmg = per * Math.pow(0.92, j) * 0.3; if (l.to.m && !l.to.m.dead) H.X.hitMon(l.to.m, dmg, C.dmgO({ burn: 1 })); else H.hitArea(ex, ey, 1.0, dmg, C.dmgO({ burn: 1 })); K.sparks(ex, ey - 0.8, 5, 5); K.embers(ex, ey - 0.8, 4); }); H.X.flash(0.05, '#FFB066'); H.X.sfx.whoosh(); }); };

  /* F-S08 Salamander Rush: a puff of flame in front of you births a salamander of living fire that darts and weaves along the
     aim, legs stepping and scattering sparks, scorching a track; at the end it coils into a knot and bursts, leaving a
     curling tail of smoke.
     Evolution: 1 salamander at Hatchling, 2 from stage 3, 3 from stage 6 (braided, the damage split), a longer run and a
     wider burst; at Celestial the burst throws up a ring of flame pillars. */
  S.salamander = (C, H) => { const K = FK.bind(H), P = K.P, me = H.me, a = C.a, ev = K.evo(C), NS = K.evoN(C, 1, 3), fin = ev >= 7, L = 6 + (ev - 1) / 3, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca, x0 = me.x + ca * 0.7, y0 = me.y + sa * 0.7, WIND = 0.14, BR = 1.7 + 0.1 * (ev - 1), share = C.K * K.evoK(C);
    let Lm = 0; while (Lm < L && !H.X.blocked(x0 + ca * (Lm + 0.15), y0 + sa * (Lm + 0.15), 0.3, 0)) Lm += 0.15; Lm = Math.max(0.9, Lm);
    const DUR = 0.85 * Lm / 6, SEG = 0.115, NP = 11, COIL = 0.24, ex = x0 + ca * Lm, ey = y0 + sa * Lm;
    const AMP = [0.3, 0.8, 0.8], PH = [0, 2.1, 4.2], env = d => cl(Math.min(d / 0.45, (Lm - d) / 0.7), 0, 1);
    const BASE = [0, 0.5, -0.5], at = (d, i) => { const o = BASE[i] * (1 - d / Lm) + AMP[i] * Math.sin(d * 1.85 + PH[i]) * env(d); return [x0 + ca * d + px * o, y0 + sa * d + py * o]; };
    H.warnLine(x0, y0, a, Lm + 0.5, NS > 1 ? 2.2 : 1.8, 0.3, C.col); H.X.sfx.whoosh(); me.sq = 0.6;
    const st = { boom: false, head: 0 }, hits = [new Set(), new Set(), new Set()];
    H.add({ life: WIND + DUR + 0.12 * (NS - 1) + COIL + 0.85, x: x0, y: y0,
      update(dt, f) { const tt = f.t - WIND; st.head = tt;
        if (tt < 0) { K.aura(x0, y0, 0.3, dt, 16, 0.3); return; }
        for (let i = 0; i < NS; i++) { const d = cl((tt - i * 0.12) / DUR, 0, 1) * Lm; if (d <= 0 || d >= Lm) continue; const [hx, hy] = at(d, i);
          for (const m of H.near(hx, hy, 0.85)) { if (hits[i].has(m)) continue; hits[i].add(m); H.X.hitMon(m, C.base * 1.1 * share / NS, C.dmgO({ kb: 1, burn: 1 })); K.ignite(m.x, m.y, 0.5); }
          if (Math.random() < 0.9 * H.Q()) for (const s of [-1, 1]) H.P({ kind: 'spark', x: hx + px * s * 0.3, y: hy + py * s * 0.3, vx: px * s * 3 - ca * 2, vy: py * s * 2 - sa * 1.5 - 1.5, g: 9, life: 0.35, max: 0.35, size: 2, color: s > 0 ? P.yel : P.wht });
          K.aura(hx, hy, 0.35, dt, 10, 0.3); }
        const tc = tt - DUR - 0.12 * (NS - 1); if (!st.boom && tc >= COIL) { st.boom = true; st.bt = f.t; H.hitArea(ex, ey, BR, C.base * 1.6 * share, C.dmgO({ kb: 4, burn: 1 })); K.blast(ex, ey, BR, 1.2 + 0.08 * ev); H.X.sfx.crash();
          for (let i = 0; i < H.n(12); i++) { const b = i / 12 * TAU * 1.3; H.P({ kind: 'smoke', x: ex + Math.cos(b) * 0.3 * (i / 12), y: ey + Math.sin(b) * 0.2 - 0.3 - i * 0.12, vx: Math.cos(b) * 0.7, vy: -1.5 - i * 0.15, life: 1.2, max: 1.2, size: 0.35 + i * 0.03, color: 'rgba(58,38,34,' }); }
          if (fin) { K.sparks(ex, ey, 14, 9); K.embers(ex, ey, 12, { v: 5 }); H.X.shake(6, 0.2); } }
        if (st.boom && f.t - st.bt < 0.6) K.aura(ex, ey, BR * 0.6, dt, 20, 0); },
      drawUnder(c, f, X, Y, T, t) { const tt = f.t - WIND, k = Math.min(1, f.life / 0.6);
        // the scorched track each salamander has run
        for (let i = 0; i < NS; i++) { const dh = cl((tt - i * 0.12) / DUR, 0, 1) * Lm; if (dh <= 0.1) continue; const pts = []; for (let s = 0; s <= 14; s++) { const [x, y] = at(dh * s / 14, i); pts.push([H.sx(x), H.sy(y)]); }
          c.save(); c.globalAlpha = 0.55 * k; H.ribbon(c, pts, T * 0.32, H.rgba(P.char, 0.6), null, u => 0.4 + 0.6 * u); c.globalCompositeOperation = 'lighter'; H.ribbon(c, pts, T * 0.12, H.rgba(P.org, 0.7), null, u => u * u); c.restore();
          if (dh < Lm) { const [hx, hy] = at(dh, i); K.floorLight(c, H.sx(hx), H.sy(hy), T * 1.3, 0.55); H.softShadow(c, H.sx(hx), H.sy(hy), T * 0.5, 0.25); } }
        if (st.boom) { const age = f.t - st.bt, bx = H.sx(ex), by = H.sy(ey); K.scorch(c, bx, by, T * BR * 0.85, k, Math.max(0, 1 - age / 1.0), 3); if (age < 0.35) K.shockRing(c, bx, by, T * BR * (0.3 + 0.9 * H.ease.out(age / 0.35)), 1 - age / 0.35); }
        else if (tt > DUR) K.floorLight(c, H.sx(ex), H.sy(ey), T * BR, 0.4 + 0.4 * cl((tt - DUR) / COIL, 0, 1)); },
      draw(c, f, X, Y, T, t) { const tt = f.t - WIND, sc = T * (0.6 + 0.015 * ev);
        if (tt < 0.15) { const u = cl(f.t / WIND, 0, 1), k = tt < 0 ? 1 : 1 - tt / 0.15; K.fireball(c, X, Y - T * 0.25, T * 0.22 * H.ease.back(u), t, 1, k, -Math.PI / 2); }
        if (tt < 0) return;
        if (st.boom) { const age = f.t - st.bt; if (fin && age < 0.6) { const u = age / 0.6; K.flameRing(c, H.sx(ex), H.sy(ey), T * BR * (0.7 + 0.2 * u), 10, T * 1.6 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.62) * (1 - u * 0.4), t, 1 - u * u, t * 0.4); } if (age < 0.25) K.fireball(c, H.sx(ex), H.sy(ey) - T * 0.4, T * (0.5 + 0.7 * age / 0.25), t, 7, 1 - age / 0.25, -Math.PI / 2); return; }
        const cx = H.sx(ex), cy = H.sy(ey) - T * 0.25;
        for (let i = NS - 1; i >= 0; i--) { const ti = tt - i * 0.12; if (ti <= 0) continue; const dh = cl(ti / DUR, 0, 1) * Lm, coil = H.ease.io(cl((ti - DUR) / COIL, 0, 1)), grow = cl(ti / 0.1, 0.25, 1), pts = [];
          for (let k = NP - 1; k >= 0; k--) { const dd = dh - k * SEG * grow; const [wx, wy] = at(Math.max(0, dd), i), sx = H.sx(wx), sy = H.sy(wy) - T * 0.28; if (coil > 0) { const th = a + Math.PI + k * 0.62 + i * TAU / NS + coil * 2, rr = T * (0.12 + 0.07 * k) * (1 - coil * 0.35); pts.push([sx + (cx + Math.cos(th) * rr - sx) * coil, sy + (cy + Math.sin(th) * rr * 0.7 - k * T * 0.04 * coil - sy) * coil]); } else pts.push([sx, sy]); }
          salamander(c, H, K, pts, sc * (i ? 0.78 : 1), t, t * 22 + i, 1, i * 5); if (coil > 0) K.glow(c, cx, cy, T * (0.4 + coil), P.yel, 0.5 * coil); } } }); };

  /* F-S09 Hearthburst: a ring of hearth stones rises round your feet and catches, flames gathering on it, then the fire
     rolls outward as a low wave with a white-hot leading edge, its inside dimming at once. Everything stays round the pet:
     what lies behind it is drawn under it, what lies in front is kept low near it.
     Evolution: radius 3.0 at Hatchling to 4.5 at Celestial (times C.K), FK.evoN(C, 1, 3) waves sharing the damage; at
     Celestial the last wave throws up a crown of flame pillars at its rim. */
  S.hearthburst = (C, H) => { const K = FK.bind(H), P = K.P, me = H.me, ev = K.evo(C), cx = me.x, cy = me.y, R = (3.0 + 0.25 * (ev - 1)) * C.K, NW = K.evoN(C, 1, 3), fin = ev >= 7, GATHER = 0.38, ROLL = 0.5, WGAP = 0.2, R0 = 0.95, NSTONE = 10;
    const WT = [[1], [0.62, 0.38], [0.5, 0.3, 0.2]][NW - 1], hits = WT.map(() => new Set()), nf = Math.max(8, Math.round([22, 16, 12][NW - 1] * H.Q())), END = GATHER + (NW - 1) * WGAP + ROLL;
    H.X.sfx.hum(); me.sq = 0.6;
    const flames = (c, f, T, t, back) => { const mx = H.sx(cx), my = H.sy(cy);
      // gathering: flames catch on the hearth ring
      if (f.t < GATHER + 0.25) { const u = cl(f.t / GATHER, 0, 1), k = f.t < GATHER ? 1 : 1 - (f.t - GATHER) / 0.25; for (let i = 0; i < NSTONE; i++) { const b = i / NSTONE * TAU + 0.3, sb = Math.sin(b); if ((sb < 0) !== back) continue; const x = mx + Math.cos(b) * R0 * T, y = my + sb * R0 * T * H.GY - T * 0.18, hmax = back ? T * 0.9 : T * 0.42; K.flame(c, x, y, T * 0.24 * (0.5 + 0.5 * u), Math.min(hmax, T * (0.25 + 0.7 * u)) * k * cl(u * 3 - i * 0.12, 0, 1), t, i * 1.7, -Math.cos(b) * T * 0.12, 0.95 * k); } }
      // the waves rolling out
      for (let w = 0; w < NW; w++) { const tw = f.t - GATHER - w * WGAP; if (tw < 0) continue; const u = cl(tw / ROLL, 0, 1), k = 1 - cl((tw - ROLL) / 0.35, 0, 1); if (k <= 0) continue; const r = (R0 + (R - R0) * H.ease.out(u)) * T, h = T * (1.35 - 0.6 * u) * (1 - w * 0.12);
        for (let i = 0; i < nf; i++) { const b = i / nf * TAU + w * 0.4 + t * 0.25, sb = Math.sin(b); if ((sb < 0) !== back) continue; const x = mx + Math.cos(b) * r, y = my + sb * r * H.GY, near = Math.abs(Math.cos(b) * r) < T * 0.75, hh = !back && near ? Math.min(h, Math.max(T * 0.2, sb * r * H.GY + T * 0.05)) : h; K.flame(c, x, y, T * 0.46 * (1 - 0.25 * u), hh * (0.8 + 0.2 * Math.sin(t * 7 + i * 1.9)) * k, t, i * 1.3 + w, Math.cos(b) * T * 0.25, k * (1 - 0.25 * u)); } }
      // the Celestial crown: pillars of flame at the rim
      if (fin) { const tf = f.t - END; if (tf > -0.05 && tf < 0.6) { const u = cl(tf / 0.6, 0, 1); for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.2, sb = Math.sin(b); if ((sb < 0) !== back) continue; K.flame(c, mx + Math.cos(b) * R * T, my + sb * R * T * H.GY, T * 0.5, T * 2.2 * Math.sin(Math.min(1, u * 1.8) * Math.PI * 0.55) * (1 - u * 0.5) + 1, t, i * 2.9, 0, 1 - u * u); } } } };
    H.add({ life: END + (fin ? 0.75 : 0.55),
      update(dt, f) {
        if (f.t < GATHER) { if (Math.random() < 1.4 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'ember', x: cx + Math.cos(b) * 2.4, y: cy + Math.sin(b) * 2.4 * H.GY, vx: -Math.cos(b) * 3.8, vy: -Math.sin(b) * 3.8 * H.GY - 0.4, drag: 1.5, life: 0.35, max: 0.35, size: 3, color: Math.random() < 0.5 ? P.yel : P.org }); } K.aura(cx, cy, R0, dt, 14, 0); return; }
        for (let w = 0; w < NW; w++) { const tw = f.t - GATHER - w * WGAP; if (tw < 0 || tw > ROLL) continue; const r = R0 + (R - R0) * H.ease.out(tw / ROLL);
          for (const m of H.living()) { if (hits[w].has(m)) continue; if (Math.hypot(m.x - cx, m.y - cy) < r + m.r) { hits[w].add(m); H.X.hitMon(m, C.base * 2.3 * C.K * K.evoK(C) * WT[w], C.dmgO({ kb: w ? 2 : 5, burn: 1 })); K.ignite(m.x, m.y, 0.6); } }
          for (let i = 0; i < H.n(3); i++) { const b = Math.random() * TAU; H.P({ kind: 'ember', x: cx + Math.cos(b) * r, y: cy + Math.sin(b) * r * H.GY, vx: Math.cos(b) * 2, vy: -2 - Math.random() * 2, g: -1, life: 0.5, max: 0.5, size: 3.5, color: Math.random() < 0.5 ? P.org : P.yel }); } } },
      drawUnder(c, f, X, Y, T, t) { const mx = H.sx(cx), my = H.sy(cy), kAll = Math.min(1, f.life / 0.45), u0 = cl(f.t / GATHER, 0, 1);
        // the hearth: a glow under you, a scorch, a ring of stones with glowing seams
        K.floorLight(c, mx, my, T * (1.2 + 0.6 * u0), (0.35 + 0.35 * u0) * kAll); if (f.t > GATHER) K.scorch(c, mx, my, T * Math.min(R * 0.9, 1.4 + (f.t - GATHER) * 6), 0.65 * kAll, Math.max(0.1, 1 - (f.t - GATHER) / 0.8), 1);
        const sk = f.t < END ? 1 : Math.max(0, 1 - (f.t - END) / 0.4); for (let i = 0; i < NSTONE; i++) { const b = i / NSTONE * TAU + 0.3; stone(c, H, K, mx + Math.cos(b) * R0 * T, my + Math.sin(b) * R0 * T * H.GY, T * 0.4, T * 0.2 * H.ease.back(cl(u0 * 2.2 - i * 0.08, 0, 1)), 0.4 + 0.6 * u0, sk * kAll); }
        // each wave: a bright band and white-hot edge, the inside dimming behind it
        for (let w = 0; w < NW; w++) { const tw = f.t - GATHER - w * WGAP; if (tw < 0) continue; const u = cl(tw / ROLL, 0, 1), k = 1 - cl((tw - ROLL) / 0.35, 0, 1); if (k <= 0) continue; const r = (R0 + (R - R0) * H.ease.out(u)) * T;
          c.save(); c.translate(mx, my); c.scale(1, H.GY); const g = c.createRadialGradient(0, 0, r * 0.55, 0, 0, r); g.addColorStop(0, H.rgba(P.org, 0)); g.addColorStop(0.7, H.rgba(P.red, 0.18 * k)); g.addColorStop(0.92, H.rgba(P.org, 0.45 * k)); g.addColorStop(1, H.rgba(P.yel, 0.6 * k)); c.fillStyle = g; c.globalCompositeOperation = 'lighter'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.restore();
          c.save(); c.strokeStyle = H.rgba(P.red, 0.55 * k); c.lineWidth = T * 0.24 * (1 - 0.5 * u); H.floorEllipse(c, mx, my, r * 0.97); c.stroke(); c.restore(); K.shockRing(c, mx, my, r * 1.03, k * (1 - w * 0.2)); }
        if (fin && f.t > END - 0.05) { const u = cl((f.t - END) / 0.6, 0, 1); K.shockRing(c, mx, my, T * R * (1 + 0.25 * u), 1 - u); }
        flames(c, f, T, t, true); },
      draw(c, f, X, Y, T, t) { flames(c, f, T, t, false); } });
    H.X.after(GATHER, () => { H.X.flash(0.08, '#FFB066'); H.X.shake(5, 0.15); H.X.light(cx, cy, R * 1.3, 0.35); H.X.sfx.whoosh(); H.X.sfx.thud(); K.sparks(cx, cy, 12, 7); });
    if (fin) H.X.after(END, () => { H.X.shake(5, 0.15); H.X.sfx.whoosh(); for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.2; K.embers(cx + Math.cos(b) * R, cy + Math.sin(b) * R * H.GY, 3, { v: 3 }); } }); };

  /* F-S10 Falling Matchstars: a fan of sparks and match-head stars fountains up from above your head; each falls onto a
     marked spot as a small comet (a burning head, a five-point glint, a stretched tail) and bursts in a crown of flame.
     Evolution: FK.evoN(C, 3, 7) stars (the damage split between them, the impacts closer together); at Celestial a last,
     larger star falls on the centre. */
  S.matchstars = (C, H) => { const K = FK.bind(H), P = K.P, me = H.me, a = C.a, ev = K.evo(C), NS = K.evoN(C, 3, 7), fin = ev >= 7, GAP = 0.2 - (NS - 3) * 0.02, FALL = 0.35;
    const spots = []; for (let i = 0; i < NS; i++) { if (NS === 3) { const b = a + (i - 1) * 1.1, r = i === 1 ? 0 : 1.1; spots.push({ x: C.tx + Math.cos(b) * r, y: C.ty + Math.sin(b) * r }); } else if (i === 0) spots.push({ x: C.tx, y: C.ty }); else { const b = a + (i - 1) / (NS - 1) * TAU + 0.4, r = 1.45; spots.push({ x: C.tx + Math.cos(b) * r, y: C.ty + Math.sin(b) * r }); } }
    const order = NS === 3 ? [0, 1, 2] : spots.map((s, i) => i); spots.forEach((s, i) => { s.t0 = 0.55 + order[i] * GAP; s.big = false; s.r = 1.15; s.k = 1; s.side = (i % 2 ? 1 : -1) * (0.4 + (i % 3) * 0.25); });
    if (fin) spots.push({ x: C.tx, y: C.ty, t0: 0.55 + NS * GAP + 0.3, big: true, r: 1.8, k: 1.5, side: 0 });
    const per = C.base * 0.9 * 3 * C.K * K.evoK(C) / spots.reduce((s, p) => s + p.k, 0);
    H.X.sfx.whoosh(); me.sq = 0.7;
    // the launch: a fountain of sparks and the stars themselves rising from above your head
    for (let i = 0; i < H.n(16 + NS * 2); i++) H.P({ kind: 'spark', x: me.x + (Math.random() - 0.5) * 0.3, y: me.y - 1.1, vx: Math.cos(a) * 2 + (Math.random() - 0.5) * 4, vy: -7 - Math.random() * 4, g: 9, life: 0.5, max: 0.5, size: 2, color: i % 2 ? P.yel : P.wht });
    H.add({ life: 0.6,
      update(dt, f) { if (f.t < 0.3) K.aura(me.x, me.y, 0.2, dt, 12, 1.1); },
      draw(c, f, X, Y, T, t) { const sx = X, sy = Y - T * 1.15, k0 = Math.min(1, f.t / 0.08); if (f.t < 0.15) { glint(c, H, sx, sy, T * 0.35 * k0, t * 3, P.yel, 1 - f.t / 0.15); K.glow(c, sx, sy, T * 0.8, P.org, 0.6 * (1 - f.t / 0.15)); }
        spots.forEach((s, i) => { if (s.big) return; const u = cl(f.t / 0.45, 0, 1); if (u >= 1) return; const e = H.ease.out(u), hx = sx + (s.side * 1.6 + Math.cos(a) * 0.8) * T * e, hy = sy - T * 5.5 * e - Math.sin(u * Math.PI) * T * 0.3, k = 1 - u * u; K.fireball(c, hx, hy, T * 0.07 * (1 - u * 0.4), t, i, k, Math.PI / 2); glint(c, H, hx, hy, T * 0.12, t * 4 + i, P.yel, k); }); } });
    spots.forEach((s, i) => { H.warn(s.x, s.y, s.r * 0.95, s.t0, C.col); const sz = s.big ? 0.26 : 0.17;
      H.add({ life: s.t0 + 1.0, x: s.x, y: s.y, done: false,
        update(dt, f) { const fl = (f.t - (s.t0 - FALL)) / FALL; if (fl > 0 && fl < 1) K.aura(s.x, s.y, 0.2, dt, s.big ? 14 : 6, (1 - H.ease.in(fl)) * 5.2); if (f.t > s.t0 && f.t < s.t0 + 0.5) K.aura(s.x, s.y, s.r * 0.5, dt, s.big ? 18 : 8, 0); },
        drawUnder(c, f, X, Y, T, t) { const fl = cl((f.t - (s.t0 - FALL)) / FALL, 0, 1), age = f.t - s.t0;
          if (age < 0) { if (fl > 0) { const e = H.ease.in(fl); K.floorLight(c, X, Y, T * (0.4 + 0.6 * e) * s.r, 0.55 * e); H.softShadow(c, X, Y, T * 0.3 * e, 0.22 * e); } return; }
          const k = Math.min(1, f.life / 0.5); K.scorch(c, X, Y, T * s.r * 0.75, k, Math.max(0, 1 - age / 0.8), i * 1.9);
          c.save(); c.globalAlpha = k * Math.max(0, 1 - age / 0.8); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.7); c.lineWidth = 1.5; for (let j = 0; j < 5; j++) { const b = j / 5 * TAU - Math.PI / 2 + i, r1 = T * s.r * 0.85; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + Math.cos(b) * r1, Y + Math.sin(b) * r1 * H.GY); c.stroke(); } c.restore();
          if (age < 0.3) K.shockRing(c, X, Y, T * s.r * (0.3 + 0.9 * H.ease.out(age / 0.3)), 1 - age / 0.3); },
        draw(c, f, X, Y, T, t) { const fl = (f.t - (s.t0 - FALL)) / FALL, age = f.t - s.t0;
          if (fl > 0 && fl < 1) { const pos = q => { const e = H.ease.in(cl(q, 0, 1)); return [X + (1 - e) * T * (s.side * 1.4 - Math.cos(a) * 1.0), Y - (1 - e) * 5.2 * T]; }; const [hx, hy] = pos(fl), pts = [];
            for (let j = 6; j >= 0; j--) pts.push(pos(fl - j * 0.05)); c.save(); c.globalCompositeOperation = 'lighter'; const tp = q => 0.15 + 0.85 * q * q; for (let j = 1; j < pts.length; j += 2) K.glow(c, pts[j][0], pts[j][1], T * sz * (1 + 2 * j / pts.length), P.org, 0.35); H.ribbon(c, pts, T * sz * 2.1, H.rgba(P.red, 0.55), null, tp); H.ribbon(c, pts, T * sz * 1.5, H.rgba(P.org, 0.8), null, tp); H.ribbon(c, pts, T * sz * 0.8, H.rgba(P.yel, 0.9), null, tp); H.ribbon(c, pts, T * sz * 0.3, P.wht, null, tp); c.restore();
            const ta = Math.atan2(pts[0][1] - hy, pts[0][0] - hx); K.fireball(c, hx, hy, T * sz * 1.15, t, i * 1.3, 1, ta); H.sphere(c, hx, hy, T * sz * 0.45, P.red, P.yel, P.char, { lw: 1, spec: false }); glint(c, H, hx, hy, T * sz * 1.4, t * 5 + i, P.yel, 0.85); }
          // the burst: a crown of flame standing on the spot, sinking as it cools
          if (age > 0 && age < 0.45) { const u = age / 0.45; K.flame(c, X, Y + T * 0.05, T * (s.big ? 0.8 : 0.5), T * (s.big ? 1.9 : 1.2) * Math.sin(Math.min(1, u * 3) * Math.PI * 0.5) * (1 - u) + 1, t, i * 2.2, 0, 1 - u * u); } } });
      H.X.after(s.t0, () => { H.hitArea(s.x, s.y, s.r, per * s.k, C.dmgO({ kb: s.big ? 4 : 2, burn: 1 })); K.blast(s.x, s.y, s.r, s.big ? 1.5 : 0.75); for (let j = 0; j < H.n(s.big ? 10 : 6); j++) { const b = j / 6 * TAU; H.P({ kind: 'star', x: s.x + Math.cos(b) * 0.2, y: s.y - 0.3 + Math.sin(b) * 0.15, vx: Math.cos(b) * 3, vy: Math.sin(b) * 2 - 2, g: 6, life: 0.45, max: 0.45, size: 4, color: j % 2 ? P.yel : P.wht }); } H.X.sfx.crash(); }); }); };
})();
