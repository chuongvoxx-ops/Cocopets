/* ---------- The Drowned Belfry's props, repainted in 2.5D (v392 PR) ----------
   Every prop and piece of set dressing in the Belfry is painted once into its own cached picture, at the size it is
   drawn, by a small software shading pass (each pixel of a solid gets a normal and a material and is lit as the
   environment is: a cool moon key from the upper left, the water's turquoise bounce from below, purple cloud above, a
   turquoise rim, warm brass highlights) and then finished with layered 2D detail (engraving, joints, rivets, cracks,
   weed, glints). Nothing is lit or painted per frame: the frame only lays the pictures down; what glows or moves
   (flames, polyps, a crystal's pulse, a bell's swing) is the callers' own cheap light over them.
   Primitives (tiles; a picture's feet at 0, 0, y down): rev (a solid of revolution on the floor, optionally an open
   shell: a broken bell's half), rbox (a box with rounded edges), tube (a round bar along a path), ball, facet (a flat
   crystal face). Materials: bronze (patina, verdigris streaks, pitting, worn bright edges, engraved bands, cracks),
   brass, limestone (grain, pits, chips, the tide's black stain, wet darkening, algae), iron, wood, coral, clay, wet
   stone, sea glass, enamel, crystal.
   API (global BELPROPS):
     BELPROPS.draw(c, name, v, Xs, Ys, T, o)  the picture at a screen spot (its feet), T the tile in px; o: { rot (about
       the feet), alpha, s (a scale), fit (the picture's height in px: centred on Xs, Ys) } -> false when it could not be
       painted this frame (a painting budget per frame): the caller then draws its old 2D art
     BELPROPS.sprite(name, v, P) -> { cv, ax, ay, P } (P px per tile), BELPROPS.has(name)
   The rift's 13 prop kinds (20n PROPS: belcolumn ... belpipe, belarchl/r) are repainted through the engine's prop
   cache (DunWorld.propSprite), so BREAK_FX shatters the new pictures in their own materials. The originals stay in
   BELPROPS.OLD. window.__BELP = 0 turns all of it off (the old 2D art). */
var BELPROPS = (() => {
  const TAU = Math.PI * 2, K = 0.34;   // (K: a floor circle's ellipse, the Belfry art's own ratio)
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const nrm3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
  const off = () => typeof window !== 'undefined' && window.__BELP === 0;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  /* ---- noise ---- */
  const PM = new Uint8Array(512); { let s = 90731; for (let i = 0; i < 256; i++) PM[i] = i; for (let i = 255; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; const j = s % (i + 1), t = PM[i]; PM[i] = PM[j]; PM[j] = t; } for (let i = 0; i < 256; i++) PM[i + 256] = PM[i]; }
  const hs = (x, y) => PM[(PM[x & 255] + y) & 511] / 255;
  function vn(x, y) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = hs(xi, yi), b = hs(xi + 1, yi), c = hs(xi, yi + 1), d = hs(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const fbm = (x, y) => vn(x, y) * 0.55 + vn(x * 2.07 + 5.3, y * 2.07 + 1.1) * 0.3 + vn(x * 4.3 + 2.9, y * 4.3 + 8.4) * 0.15;
  const R1 = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };

  /* ======================= the light ======================= (x right, y toward the camera, z up) */
  const LK = nrm3(-0.62, 0.46, 0.64), V = nrm3(0, 0.95, 0.31), HK = nrm3(LK[0] + V[0], LK[1] + V[1], LK[2] + V[2]), RIMD = nrm3(0.72, -0.25, 0.55);
  const M = { r: 0.5, g: 0.5, b: 0.5, mt: 0, fr: 0.04, fg: 0.04, fb: 0.04, rg: 0.6, ao: 1, cc: 0, er: 0, eg: 0, eb: 0, sh: 1 };
  const M0 = () => { M.mt = 0; M.fr = M.fg = M.fb = 0.04; M.rg = 0.6; M.ao = 1; M.cc = 0; M.er = M.eg = M.eb = 0; M.sh = 1; };
  const OUT = [0, 0, 0];
  /* v398 PR: the light's colours: the Belfry's (a turquoise sea's bounce and rim, purple sky) or a neutral one (a warm white key,
     grey sky, white rim) for pieces used in every land (the shrines and power stones, 20n9c); a DEF with light: 'neutral' is painted in it */
  const LIGHTS = { bel: { a0: [0.08, 0.25, 0.27], a1: [0.2, 0, 0.11], e0: [0.04, 0.15, 0.18], e1: [0.42, 0.4, 0.55], k: [1.08, 1.12, 1.24], rim: [0.12, 0.48, 0.46], bo: [0.03, 0.16, 0.15] },
    neutral: { a0: [0.2, 0.19, 0.2], a1: [0.08, 0.08, 0.12], e0: [0.12, 0.11, 0.12], e1: [0.46, 0.46, 0.52], k: [1.22, 1.14, 1.02], rim: [0.34, 0.34, 0.38], bo: [0.07, 0.06, 0.05] } };
  let LT = LIGHTS.bel;
  const tone = v => { v = v > 0 ? v : 0; v = v * (1 + v / 7) / (1 + v) * 1.32; return 255 * Math.pow(v > 1 ? 1 : v, 0.92); };
  function shade(nx, ny, nz) {
    const ndl = nx * LK[0] + ny * LK[1] + nz * LK[2], dif = (ndl > 0 ? ndl : 0) * M.sh, ao = M.ao, hm = 0.5 + 0.5 * nz, ak = 0.3 + 0.7 * ao;
    const A0 = LT.a0, A1 = LT.a1, amr = (A0[0] + A1[0] * hm) * ak, amg = (A0[1] + A1[1] * hm) * ak, amb = (A0[2] + A1[2] * hm) * ak;   // v398 PR: the light's colours from LT (the Belfry's own by default)
    let ndv = ny * V[1] + nz * V[2]; if (ndv < 0) ndv = 0; const fk = Math.pow(1 - ndv, 5);
    let ndh = nx * HK[0] + ny * HK[1] + nz * HK[2]; if (ndh < 0) ndh = 0; const shin = Math.min(700, 2 / (M.rg * M.rg + 0.004)), sp = Math.pow(ndh, shin) * (shin + 2) / 8 * dif * 0.8;
    const rx = 2 * ndv * nx, ry = 2 * ndv * ny - V[1], rz = 2 * ndv * nz - V[2], sky = ss(-0.3, 0.45, rz), rl = rx * LK[0] + ry * LK[1] + rz * LK[2];
    const moon = rl > 0 ? Math.pow(rl, 2 + 60 / (1 + M.rg * 14)) * 1.5 / (1 + M.rg * 4) : 0;
    const E0 = LT.e0, E1 = LT.e1, er = lerp(E0[0], E1[0], sky) + moon, eg = lerp(E0[1], E1[1], sky) + moon, eb = lerp(E0[2], E1[2], sky) + moon * 1.05;
    const mt = M.mt, dm = 1 - mt, fr = M.fr + (1 - M.fr) * fk * (1 - M.rg * 0.7), fg = M.fg + (1 - M.fg) * fk * (1 - M.rg * 0.7), fb = M.fb + (1 - M.fb) * fk * (1 - M.rg * 0.7);
    const kr = LT.k[0], kg = LT.k[1], kb = LT.k[2], eo = (0.35 + 0.65 * ao) / (1 + M.rg * 1.6);
    let r = M.r * dm * (dif * kr + amr) + M.fr * mt * (dif * kr * 0.42 + amr * 0.45) + fr * (er * eo * (mt * 0.9 + dm * 0.35) + sp * kr * 1.2);
    let g = M.g * dm * (dif * kg + amg) + M.fg * mt * (dif * kg * 0.42 + amg * 0.45) + fg * (eg * eo * (mt * 0.9 + dm * 0.35) + sp * kg * 1.2);
    let b = M.b * dm * (dif * kb + amb) + M.fb * mt * (dif * kb * 0.42 + amb * 0.45) + fb * (eb * eo * (mt * 0.9 + dm * 0.35) + sp * kb * 1.2);
    if (M.cc > 0) { const c2 = M.cc * (Math.pow(ndh, 220) * 3.2 * dif + (0.04 + fk) * 0.55 * ao), c3 = M.cc * (0.04 + fk) * 0.5 * ao; r += c2 + c3 * er; g += c2 + c3 * eg; b += c2 * 1.05 + c3 * eb; }
    const rim = Math.pow(1 - ndv, 2.4) * Math.max(0, nx * RIMD[0] + ny * RIMD[1] + nz * RIMD[2] + 0.25) * ao * 0.5, bo = (nz < 0 ? -nz : 0) * ao;
    const RC = LT.rim, BC = LT.bo; r += rim * RC[0] + bo * BC[0] + M.er; g += rim * RC[1] + bo * BC[1] + M.eg; b += rim * RC[2] + bo * BC[2] + M.eb;
    OUT[0] = tone(r); OUT[1] = tone(g); OUT[2] = tone(b);
  }
  /* ======================= the painting surface ======================= */
  function surface(x0, y0, x1, y1, P) {   // (the picture's box in tiles about its feet)
    const w = Math.ceil((x1 - x0) * P), h = Math.ceil((y1 - y0) * P), cv = mkc(w, h), c = cv.getContext('2d', { willReadFrequently: true });   // (a work canvas read back often; the cache keeps a plain copy)
    const S = { cv, c, P, w, h, ax: -x0 * P, ay: -y0 * P, d: null, img: null };
    S.T = () => c.setTransform(P, 0, 0, P, S.ax, S.ay);
    S.lock = () => { if (S.img) return; c.setTransform(1, 0, 0, 1, 0, 0); S.img = c.getImageData(0, 0, w, h); S.d = S.img.data; };
    S.unlock = () => { if (!S.img) return; c.setTransform(1, 0, 0, 1, 0, 0); c.putImageData(S.img, 0, 0); S.img = S.d = null; S.T(); };
    S.T(); return S; }
  function put(S, px, py, a) { if (a <= 0.003) return; const d = S.d, i = (py * S.w + px) * 4, da = d[i + 3] / 255; if (a >= 0.999 || da < 0.003) { d[i] = OUT[0]; d[i + 1] = OUT[1]; d[i + 2] = OUT[2]; d[i + 3] = 255 * Math.max(a, da * (1 - a) + a); if (a < 0.999 && da > 0) { const na = a + da * (1 - a); d[i] = (OUT[0] * a + d[i] * 0) / na * 1; } return; }
    const na = a + da * (1 - a); d[i] = (OUT[0] * a + d[i] * da * (1 - a)) / na; d[i + 1] = (OUT[1] * a + d[i + 1] * da * (1 - a)) / na; d[i + 2] = (OUT[2] * a + d[i + 2] * da * (1 - a)) / na; d[i + 3] = na * 255; }
  /* ======================= the primitives ======================= */
  /* rev: a solid of revolution on the floor: axis at x = cx (tiles), the floor at y = by (tiles, the feet line, + down), the
     radius prof(h) for h0 .. h1 tiles up. o: { mat(u, h, ao, inside, phi) sets M (u the arc round it from its front), top
     (cap it: o.capMat(x, z, ao) for the cap), part: 'all' | 'front' | 'back', shell(phi, h) -> true where an open shell has
     wall (phi 0 = +x, pi/2 toward the camera, pi = -x), th(h) the wall's thickness, bump (hammered relief), floorAO } */
  function rev(S, cx, by, prof, h0, h1, o) {
    o = o || {}; const P = S.P, N = Math.max(8, Math.ceil((h1 - h0) * P * 1.3)), R = new Float32Array(N + 1), OV = new Float32Array(N + 1), dh = (h1 - h0) / N;
    let rmax = 0; for (let i = 0; i <= N; i++) { R[i] = Math.max(0, prof(h0 + dh * i)); if (R[i] > rmax) rmax = R[i]; }
    const look = Math.max(2, Math.round(0.25 / dh)); for (let i = 0; i <= N; i++) { let m = 0; for (let j = i + 1; j <= Math.min(N, i + look); j++) if (R[j] > m) m = R[j]; OV[i] = Math.max(0, m - R[i]); }
    const fi = h => clamp((h - h0) / dh, 0, N - 1e-6), rAt = h => { const f = fi(h), i = Math.floor(f), t = f - i; return R[i] + (R[Math.min(N, i + 1)] - R[i]) * t; }, sAt = h => { const i = Math.floor(fi(h)); return (R[Math.min(N, i + 1)] - R[i]) / dh; };
    const thf = o.th || (() => 0.08), sh = o.shell, part = o.part || 'all', CX = S.ax + cx * P, BY = S.ay + by * P, fa = o.floorAO == null ? 1 : o.floorAO, bump = o.bump || 0;
    const xa = Math.max(0, Math.floor(CX - rmax * P - 2)), xb = Math.min(S.w - 1, Math.ceil(CX + rmax * P + 2)), ya = Math.max(0, Math.floor(BY - (h1 + rmax * K) * P - 2)), yb = Math.min(S.h - 1, Math.ceil(BY - (h0 - rmax * K) * P + 2));
    S.lock();
    for (let py = ya; py <= yb; py++) { const Yt = (BY - py - 0.5) / P;
      for (let px = xa; px <= xb; px++) { const x = (px + 0.5 - CX) / P, ax = x < 0 ? -x : x; if (ax > rmax + 0.03) continue;
        let done = false;
        if (part !== 'back') { let h = Yt, ok = false; for (let k = 0; k < 5; k++) { const r = rAt(h), s = r * r - x * x; if (s < 0) { ok = false; break; } h = Yt + K * Math.sqrt(s); ok = true; }
          if (ok && h >= h0 - 0.6 / P && h <= h1 + 0.6 / P) { const r = rAt(h) || 1e-4, c = clamp(x / r, -1, 1), phi = Math.acos(c);
            if (!sh || sh(phi, h)) { const s = Math.sqrt(1 - c * c), sl = sAt(h), u = (phi - Math.PI / 2) * r; let nx = c, ny = s, nz = -sl;
              let ao = (1 - fa + fa * (0.5 + 0.5 * ss(0, 0.45, h - h0))) * (1 - clamp(OV[Math.round(fi(h))] * 3.5, 0, 0.65)); M0(); M.ao = ao; o.mat(u, h, ao, false, phi, x);
              if (bump) { nx += (vn(u * 11 + 3, h * 11) - 0.5) * bump; nz += (vn(u * 11 + 9, h * 11 + 4) - 0.5) * bump; } const l = Math.hypot(nx, ny, nz); shade(nx / l, ny / l, nz / l);
              let a = clamp((r - ax) * P + 0.6, 0, 1) * clamp((h - h0) * P + 0.6, 0, 1); if (sh) { const e = 0.5 / (r * P); a *= clamp(((sh(phi + e, h) ? 1 : 0) + (sh(phi - e, h) ? 1 : 0)) / 2 + 0.5, 0, 1); }
              put(S, px, py, a); done = a > 0.98; } } }
        if (!done && sh && part !== 'front') { let h = Yt, ok = false; for (let k = 0; k < 5; k++) { const r = rAt(h) - thf(h), s = r * r - x * x; if (s < 0) { ok = false; break; } h = Yt - K * Math.sqrt(s); ok = true; }
          if (ok && h >= h0 && h <= h1) { const ri = Math.max(1e-3, rAt(h) - thf(h)), c = clamp(x / ri, -1, 1), phi = TAU - Math.acos(c);
            if (sh(phi, h)) { const s = Math.sqrt(1 - c * c), sl = sAt(h); const l = Math.hypot(c, s, sl); M0(); const ao = (0.3 + 0.35 * ss(h1, h0, h)) * (0.6 + 0.4 * ss(0, 0.3, h - h0)); M.ao = ao; o.mat((phi - Math.PI * 1.5) * ri, h, ao, true, phi, x); shade(-c / l, s / l, sl / l);
              put(S, px, py, clamp((ri - ax) * P + 0.6, 0, 1)); done = true; } } }
        if (!done && o.top && part !== 'back') { const rt = R[N], dy = Yt - h1; if (rt > 0) { const ex = x / rt, ey = dy / (K * rt), e = ex * ex + ey * ey;
            if (e <= 1.02) { const q = ss(0.72, 1.0, Math.sqrt(e)) * 0.9, l = Math.hypot(ex * q, -ey * q, 1); M0(); M.ao = 1; (o.capMat || o.mat)(x, h1, 1, false, -1, x, ey); shade(ex * q / l, -ey * q / l, 1 / l); put(S, px, py, clamp((1 - Math.sqrt(e)) * rt * K * P * 2 + 0.6, 0, 1)); } } }
      } }
  }
  /* rbox: a box with rounded edges on the floor (or raised: z0): centre cx, feet line by; half width hw, half depth hd,
     from z0 to z1 up; b the edge radius; mat(face 'f' | 't', u, v, ao) (front: u across, v up; top: u across, v back) */
  function rbox(S, cx, by, hw, hd, z0, z1, b, mat, o) {
    o = o || {}; const P = S.P, CX = S.ax + cx * P, BY = S.ay + by * P, fa = o.floorAO == null ? 1 : o.floorAO;
    const xa = Math.max(0, Math.floor(CX - hw * P - 1)), xb = Math.min(S.w - 1, Math.ceil(CX + hw * P + 1)), ya = Math.max(0, Math.floor(BY - (z1 + K * hd) * P - 1)), yb = Math.min(S.h - 1, Math.ceil(BY - (z0 - K * hd) * P + 1));
    S.lock();
    for (let py = ya; py <= yb; py++) { const Yt = (BY - py - 0.5) / P;
      for (let px = xa; px <= xb; px++) { const x = (px + 0.5 - CX) / P, ax = Math.abs(x); if (ax > hw + 0.5 / P) continue; const qx = ax > hw - b ? clamp((ax - (hw - b)) / b, 0, 1) : 0, sx = x < 0 ? -1 : 1;
        const zf = Yt + K * hd; let a = clamp((hw - ax) * P + 0.5, 0, 1);
        if (zf >= z0 - 0.5 / P && zf <= z1) {   // the front
          const qz = zf > z1 - b ? clamp((zf - (z1 - b)) / b, 0, 1) : 0, nx = sx * qx, nz = qz, ny = Math.sqrt(Math.max(0.02, 1 - nx * nx - nz * nz)), l = Math.hypot(nx, ny, nz);
          M0(); M.ao = (1 - fa + fa * (0.55 + 0.45 * ss(0, 0.4, zf))) * (0.92 + 0.08 * (1 - qx)); mat('f', x, zf, M.ao, qx + qz); shade(nx / l, ny / l, nz / l); put(S, px, py, a * clamp((zf - z0) * P + 0.6, 0, 1)); }
        else if (zf > z1 && Yt <= z1 + K * hd + 0.5 / P) {   // the top
          const v = (Yt - z1) / K - hd, av = Math.abs(v), qv = av > hd - b ? clamp((av - (hd - b)) / b, 0, 1) : 0, sv = v < 0 ? 1 : -1, nx = sx * qx * 0.8, ny = sv * qv * 0.8, nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny)), l = Math.hypot(nx, ny, nz);
          M0(); M.ao = 1; mat('t', x, v, 1, qx + qv); shade(nx / l, ny / l, nz / l); put(S, px, py, a * clamp((z1 + K * hd - Yt) * P + 0.6, 0, 1)); } } }
  }
  /* tube: a round bar along a path of points [x, y] (tiles, y down), its radius r0 -> r1; mat(t, s, ao) (t along 0..1, s
     across -1..1) */
  function tube(S, pts, r0, r1, mat, o) {
    o = o || {}; const P = S.P, Q = pts.map(p => [S.ax + p[0] * P, S.ay + p[1] * P]), L = [0]; for (let i = 1; i < Q.length; i++) L.push(L[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1])); const LT = L[L.length - 1] || 1, rm = Math.max(r0, r1) * P;
    let xa = 1e9, xb = -1e9, ya = 1e9, yb = -1e9; for (const q of Q) { xa = Math.min(xa, q[0]); xb = Math.max(xb, q[0]); ya = Math.min(ya, q[1]); yb = Math.max(yb, q[1]); }
    xa = Math.max(0, Math.floor(xa - rm - 1)); xb = Math.min(S.w - 1, Math.ceil(xb + rm + 1)); ya = Math.max(0, Math.floor(ya - rm - 1)); yb = Math.min(S.h - 1, Math.ceil(yb + rm + 1));
    S.lock();
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const X = px + 0.5, Y = py + 0.5; let bd = 1e9, bt = 0, bx = 0, by2 = 0;
      for (let i = 1; i < Q.length; i++) { const ax = Q[i - 1][0], ay = Q[i - 1][1], dx = Q[i][0] - ax, dy = Q[i][1] - ay, ll = dx * dx + dy * dy || 1e-6; let t = ((X - ax) * dx + (Y - ay) * dy) / ll; t = t < 0 ? 0 : t > 1 ? 1 : t; const qx = ax + dx * t, qy = ay + dy * t, d = (X - qx) * (X - qx) + (Y - qy) * (Y - qy); if (d < bd) { bd = d; bt = (L[i - 1] + t * (L[i] - L[i - 1])) / LT; bx = X - qx; by2 = Y - qy; } }
      const d = Math.sqrt(bd), r = (r0 + (r1 - r0) * bt) * P; if (d > r + 1) continue; const s = Math.min(1, d / r), ux = d > 1e-6 ? bx / d : 0, uy = d > 1e-6 ? by2 / d : 0;
      const nx = ux * s, nz = -uy * s, ny = Math.sqrt(Math.max(0, 1 - s * s)); M0(); M.ao = 0.75 + 0.25 * ny; mat(bt, s * (ux >= 0 ? 1 : -1), M.ao); shade(nx, ny, nz); put(S, px, py, clamp(r - d + 0.6, 0, 1) * (o.alpha == null ? 1 : o.alpha)); }
  }
  /* ball: an ellipsoid seen from the front: centre (cx, cy) tiles, radii rx, ry; mat(dx, dy, ao) */
  function ball(S, cx, cy, rx, ry, mat) {
    const P = S.P, X0 = S.ax + cx * P, Y0 = S.ay + cy * P, RX = rx * P, RY = ry * P; if (RX < 0.4) return; S.lock();
    for (let py = Math.max(0, Math.floor(Y0 - RY - 1)); py <= Math.min(S.h - 1, Math.ceil(Y0 + RY + 1)); py++) for (let px = Math.max(0, Math.floor(X0 - RX - 1)); px <= Math.min(S.w - 1, Math.ceil(X0 + RX + 1)); px++) {
      const dx = (px + 0.5 - X0) / RX, dy = (py + 0.5 - Y0) / RY, e = dx * dx + dy * dy; if (e > 1 + 3 / RX) continue; const ny = Math.sqrt(Math.max(0, 1 - e)), l = Math.hypot(dx, ny, dy) || 1; M0(); M.ao = 0.7 + 0.3 * ny; mat(dx, dy, M.ao); shade(dx / l, ny / l, -dy / l); put(S, px, py, clamp((1 - Math.sqrt(e)) * Math.min(RX, RY) + 0.6, 0, 1)); }
  }
  /* ======================= materials ======================= (each sets M; u, v surface coordinates in tiles) */
  function bronze(u, h, ao, sd, wear, inside, k) {   // tarnish, verdigris streaks run down by the sea and gathered low and in hollows, pitting, edges worn bright
    const s1 = vn(u * 3.1 + sd, h * 0.8), s2 = vn(u * 8.7 - sd, h * 2.1), streak = s1 * 0.6 + s2 * 0.4, pit = vn(u * 31 + sd * 3, h * 29), w3 = vn(u * 17, h * 17 + sd);
    let pk = clamp(ss(0.5, 0.76, streak + (vn(u * 5 + 2, h * 5) - 0.5) * 0.3) * 0.85 + (1 - ao) * 0.75 + ss(0.45, 0, h) * 0.3 * s1, 0, 1); if (inside) pk = Math.max(pk, 0.45 + 0.35 * s1);
    let wr = clamp(wear || 0, 0, 1) * (0.55 + 0.45 * w3); pk *= 1 - wr * 0.8; if (k) pk = clamp(pk + k, 0, 1);
    M.mt = 1 - pk * 0.92; const t1 = 0.72 + 0.48 * s1, t2 = 0.72 + 0.42 * s2;
    M.r = lerp(0.22 * t1, lerp(0.12, 0.3, w3) * t2, pk); M.g = lerp(0.14 * t1, lerp(0.36, 0.58, w3) * t2, pk); M.b = lerp(0.075 * t1, lerp(0.3, 0.46, w3) * t2, pk);
    M.fr = lerp(0.46 * (0.8 + 0.35 * s2), 1.0, wr); M.fg = lerp(0.3 * (0.8 + 0.35 * s2), 0.75, wr); M.fb = lerp(0.14 * (0.8 + 0.35 * s2), 0.45, wr); M.rg = lerp(lerp(0.4, 0.17, wr), 0.85, pk);
    if (pit > 0.7) M.ao *= 1 - (pit - 0.7) * 1.8;
  }
  function brass(u, v, ao, sd, wear) { const s1 = vn(u * 4 + sd, v * 4), s2 = vn(u * 14 - sd, v * 14), pk = clamp((1 - ao) * 0.9 + ss(0.66, 0.88, s1 * 0.7 + s2 * 0.4) * 0.45 + ss(0.4, 0, v) * 0.2 * s1, 0, 1) * (1 - (wear || 0) * 0.8), wr = clamp(wear || 0, 0, 1);
    M.mt = 1 - pk * 0.85; M.r = lerp(0.32, 0.16 * (0.8 + 0.4 * s2), pk); M.g = lerp(0.23, 0.4 * (0.8 + 0.4 * s2), pk); M.b = lerp(0.08, 0.32, pk);
    M.fr = lerp(0.8 * (0.8 + 0.3 * s1), 1.0, wr); M.fg = lerp(0.58 * (0.8 + 0.3 * s1), 0.88, wr); M.fb = lerp(0.24 * (0.8 + 0.3 * s1), 0.56, wr); M.rg = lerp(lerp(0.34, 0.15, wr), 0.8, pk) * (0.85 + 0.3 * s2); }
  function lime(u, v, ao, sd, stain, h, o) {   // ivory limestone: grain, pits, specks, each block its tone; the black tide stain, algae at its line, wet at the foot
    const g = fbm(u * 3.3 + sd, v * 3.3 + sd * 0.7), p = vn(u * 29 + sd, v * 29), sp = vn(u * 61, v * 61 + sd), t = (o && o.tone) || 1;
    M.r = 0.74 * (0.8 + 0.27 * g) * t; M.g = 0.74 * (0.8 + 0.27 * g) * t; M.b = 0.65 * (0.8 + 0.27 * g) * t; M.rg = 0.84;
    if (p > 0.73) M.ao *= 1 - (p - 0.73) * 2.4; if (sp > 0.86) { M.r *= 1.12; M.g *= 1.12; M.b *= 1.1; }
    if (o && o.fresh) { M.r *= 1.06; M.g *= 1.05; M.b *= 1.0; M.ao *= 0.8 + 0.2 * vn(u * 40, v * 40); }
    if (stain > 0) { const st = ss(stain + 0.15, stain - 0.32, h + (vn(u * 3.1 + 7, h * 2.3) - 0.5) * 0.34); M.r = lerp(M.r, 0.05, st * 0.9); M.g = lerp(M.g, 0.068, st * 0.9); M.b = lerp(M.b, 0.075, st * 0.9); M.rg = lerp(M.rg, 0.28, st); M.cc = st * 0.5;
      const al = ss(0.22, 0, Math.abs(h - stain - 0.06)) * ss(0.42, 0.78, vn(u * 6 + 3, h * 6)) * 0.5; M.r = lerp(M.r, 0.17, al); M.g = lerp(M.g, 0.3, al); M.b = lerp(M.b, 0.19, al); }
    const wt = ss(0.35, 0, h); if (wt > 0) { M.r *= 1 - wt * 0.35; M.g *= 1 - wt * 0.3; M.b *= 1 - wt * 0.28; M.cc = Math.max(M.cc, wt * 0.6); M.rg = lerp(M.rg, 0.3, wt); } }
  function iron(u, v, ao, sd, paint) { const ru = ss(0.42, 0.75, vn(u * 6 + sd, v * 6) * 0.6 + vn(u * 23, v * 23 + sd) * 0.5); M.mt = 1 - ru * 0.85; M.r = lerp(0.05, 0.34, ru); M.g = lerp(0.05, 0.14, ru); M.b = lerp(0.055, 0.06, ru); M.fr = lerp(0.32, 0.04, ru); M.fg = lerp(0.32, 0.04, ru); M.fb = lerp(0.34, 0.04, ru); M.rg = lerp(0.42, 0.85, ru);
    if (paint) { const pt = ss(0.36, 0.52, vn(u * 9 + 5, v * 9)); M.mt *= 1 - pt; M.r = lerp(M.r, 0.5, pt); M.g = lerp(M.g, 0.08, pt); M.b = lerp(M.b, 0.06, pt); M.rg = lerp(M.rg, 0.45, pt); } }
  function wood(u, v, ao, sd) { const gr = vn(u * 2 + sd, v * 34) * 0.6 + vn(u * 9, v * 80) * 0.4, kn = vn(u * 5 + 3, v * 5); M.r = 0.2 * (0.7 + 0.5 * gr); M.g = 0.13 * (0.7 + 0.5 * gr); M.b = 0.08 * (0.7 + 0.5 * gr); if (kn > 0.8) { M.r *= 0.6; M.g *= 0.6; M.b *= 0.6; } M.rg = 0.4; M.cc = 0.45; M.r = lerp(M.r, 0.08, ss(0.55, 0.85, vn(u * 4, v * 3 + 7)) * 0.5); M.g = lerp(M.g, 0.16, ss(0.55, 0.85, vn(u * 4, v * 3 + 7)) * 0.5); }
  function coral(u, v, ao, sd, red) { const rib = Math.abs(((v * 9 + vn(u * 3, v * 3) * 1.5) % 1) - 0.5), w = vn(u * 11 + sd, v * 11), pr = vn(u * 37, v * 37 + sd); M.r = red ? 0.86 : 0.84; M.g = red ? 0.3 : 0.74; M.b = red ? 0.24 : 0.66; const t = 0.82 + 0.28 * w; M.r *= t; M.g *= t; M.b *= t;
    if (rib < 0.1) M.ao *= 0.78; if (pr > 0.72) M.ao *= 1 - (pr - 0.72) * 1.8; M.rg = 0.55; M.cc = 0.3; if (red) { M.er = 0.12; M.eg = 0.02; M.eb = 0.015; } }
  function clay(u, v, ao, sd) { const w = fbm(u * 4 + sd, v * 4), cr = Math.abs(((u * 3.1 + v * 4.7 + vn(u * 3, v * 3) * 2) % 1) - 0.5); M.r = 0.38 * (0.75 + 0.4 * w); M.g = 0.24 * (0.75 + 0.4 * w); M.b = 0.15 * (0.75 + 0.4 * w); M.rg = 0.9; if (cr < 0.025 && vn(u * 7, v * 7) > 0.45) M.ao *= 0.45; M.r = lerp(M.r, 0.14, (1 - ao) * 0.5); M.g = lerp(M.g, 0.3, (1 - ao) * 0.5); M.b = lerp(M.b, 0.26, (1 - ao) * 0.5); }
  function wetstone(u, v, ao, sd) { const w = vn(u * 5 + sd, v * 5), w2 = vn(u * 13, v * 13); M.r = 0.12 * (0.75 + 0.45 * w); M.g = 0.15 * (0.75 + 0.45 * w); M.b = 0.16 * (0.75 + 0.45 * w); M.rg = 0.3; M.cc = 0.7; if (w2 > 0.62) { M.g *= 1.25; M.b *= 1.1; } }

  /* ======================= shared 2D finishing ======================= */
  const GR = (() => { let cv = null; return () => { if (cv) return cv; cv = mkc(128, 128); const c = cv.getContext('2d'), im = c.createImageData(128, 128); for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const v = fbm(x / 9, y / 9) * 0.6 + vn(x / 2.3, y / 2.3) * 0.4, i = (y * 128 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = v * 255; im.data[i + 3] = 255; } c.putImageData(im, 0, 0); return cv; }; })();
  function grain(c, a, comp) { const p = c.createPattern(GR(), 'repeat'); c.save(); c.globalCompositeOperation = comp || 'overlay'; c.globalAlpha = a; c.fillStyle = p; c.setTransform(1, 0, 0, 1, 0, 0); c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); }
  function contact(S, x, y, rx, ry, a, dx) { const c = S.c; c.save(); const g = c.createRadialGradient(x + (dx || 0), y, 0, x + (dx || 0), y, rx); g.addColorStop(0, `rgba(3,10,14,${a})`); g.addColorStop(0.55, `rgba(3,10,14,${a * 0.55})`); g.addColorStop(1, 'rgba(3,10,14,0)'); c.fillStyle = g; c.translate(x + (dx || 0), y); c.scale(1, ry / rx); c.translate(-x - (dx || 0), -y); c.beginPath(); c.arc(x + (dx || 0), y, rx, 0, TAU); c.fill(); c.restore(); }
  function waterRing(S, rx, a) { const c = S.c; c.save(); const g = c.createRadialGradient(0, 0, rx * 0.3, 0, 0, rx); g.addColorStop(0, `rgba(20,90,110,${0.55 * a})`); g.addColorStop(0.75, `rgba(24,100,118,${0.4 * a})`); g.addColorStop(1, 'rgba(24,100,118,0)'); c.fillStyle = g; c.scale(1, K * 1.05); c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
    c.strokeStyle = `rgba(226,247,242,${0.55 * a})`; c.lineWidth = 0.035 / K; c.beginPath(); c.arc(0, 0, rx * 0.8, 0, TAU); c.stroke(); c.strokeStyle = `rgba(226,247,242,${0.22 * a})`; c.beginPath(); c.arc(0, 0, rx * 0.98, 0.2, 2.6); c.stroke(); c.beginPath(); c.arc(0, 0, rx * 0.98, 3.4, 5.6); c.stroke(); c.restore(); }
  /* a thin ink edge round what is painted (the game's outlined look, kept soft): one pixel grown from the silhouette */
  function ink(S, col, a) { S.lock(); const d = S.d, w = S.w, h = S.h, A = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) A[i] = d[i * 4 + 3];
    const cr = col[0], cg = col[1], cb = col[2]; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (A[i] > 140) continue; const m = Math.max(A[i - 1], A[i + 1], A[i - w], A[i + w]); if (m < 150) continue; const j = i * 4, k = (m / 255) * a, da = d[j + 3] / 255, na = k + da * (1 - k);
      d[j] = (cr * k + d[j] * da * (1 - k)) / na; d[j + 1] = (cg * k + d[j + 1] * da * (1 - k)) / na; d[j + 2] = (cb * k + d[j + 2] * da * (1 - k)) / na; d[j + 3] = na * 255; } S.unlock(); }
  /* a darkening toward the top (things that rise into the dark ceiling) */
  function fadeTop(S, y0, y1) { const c = S.c; c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(0, y1, 0, y0); g.addColorStop(0, 'rgba(6,16,22,0)'); g.addColorStop(0.65, 'rgba(6,16,22,.62)'); g.addColorStop(1, 'rgba(6,16,22,.96)'); c.fillStyle = g; c.fillRect(-9, y0 - 1, 18, y1 - y0 + 1); c.restore(); }
  const arcPts = (r, y, a0, a1, n) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([Math.cos(a) * r, y + Math.sin(a) * r * K]); } return o; };   // (a ring on a cylinder: a = pi/2 is its front)
  function strokePts(c, pts, col, lw) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
  function glint(c, x, y, r, a) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,250,235,${a})`); g.addColorStop(0.3, `rgba(220,255,250,${a * 0.35})`); g.addColorStop(1, 'rgba(200,255,250,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.strokeStyle = `rgba(255,255,245,${a * 0.8})`; c.lineWidth = r * 0.06; c.beginPath(); c.moveTo(x - r * 0.9, y); c.lineTo(x + r * 0.9, y); c.moveTo(x, y - r * 0.6); c.lineTo(x, y + r * 0.6); c.stroke(); c.restore(); }
  function rivets(S, pts, r, mt) { for (const p of pts) ball(S, p[0], p[1], r, r, (dx, dy, ao) => { if (mt === 'iron') iron(dx, dy, ao, 3); else brass(dx * 0.2, dy * 0.2, 1, 2, 0.6); }); }

  /* ======================= the bell ======================= */
  // its profile (lip radius 1 at h 0, crown at h 1.31): the lip, the sound bow, the waist, the shoulder, the crown; raised fillets either side of two bands
  const BELLP = [[0, 0.99], [0.04, 1.03], [0.1, 1.0], [0.2, 0.92], [0.34, 0.82], [0.55, 0.71], [0.8, 0.645], [1.0, 0.625], [1.12, 0.595], [1.21, 0.5], [1.27, 0.34], [1.3, 0.16], [1.31, 0]];
  const BANDS = [[0.17, 0.26], [0.93, 1.02]];
  function bellR(h) { let i = 0; while (i < BELLP.length - 2 && BELLP[i + 1][0] < h) i++; const a = BELLP[Math.max(0, i - 1)], b = BELLP[i], c = BELLP[i + 1], d = BELLP[Math.min(BELLP.length - 1, i + 2)], t = clamp((h - b[0]) / (c[0] - b[0] || 1), 0, 1), t2 = t * t, t3 = t2 * t;
    let r = 0.5 * ((2 * b[1]) + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3);
    for (const [b0, b1] of BANDS) { r += 0.018 * (Math.exp(-(((h - b0) / 0.011) ** 2)) + Math.exp(-(((h - b1) / 0.011) ** 2))); } return Math.max(0, r); }
  /* paint a bell: axis cx, lip on y = by (tiles), lip radius Rs, height scale Hs. o: { crack, half (-1 left shell / 1 right shell), clapper, sd (seed), noCrown } */
  function paintBell(S, cx, by, Rs, Hs, o) {
    o = o || {}; const sd = o.sd || 0, H1 = 1.31 * Hs, prof = h => Rs * bellR(h / Hs), crackU = 0.18 * Rs + (o.crack ? 0 : 99);
    const mat = (u, h, ao, inside, phi) => { const hn = h / Hs; let wear = ss(0.06, 0, hn) + ss(0.3, 0.9, (inside ? 0 : 1) * Math.max(0, Math.cos(phi - 2.2))) * 0.15, k = 0;
      for (const [b0, b1] of BANDS) { if (!inside && hn > b0 - 0.006 && hn < b1 + 0.006) { const bv = (hn - b0) / (b1 - b0), au = u / Rs * 4.5, sw = Math.sin(au * Math.PI + sd), gv = Math.abs(bv - 0.5 - 0.24 * sw), gv2 = Math.abs(bv - 0.5 + 0.24 * sw), dt = Math.hypot(((au * 0.5) % 1 + 1) % 1 - 0.5, (bv - 0.5) * 1.3);
          const eng = Math.max(ss(0.085, 0.035, gv), ss(0.07, 0.03, gv2) * (((au * 0.25 + 0.1) % 1 + 1) % 1 > 0.5 ? 1 : 0), ss(0.075, 0.04, dt)); ao *= 1 - eng * 0.55; k += eng * 0.35; wear = Math.max(wear, ss(0.16, 0.03, Math.min(bv, 1 - bv)) * 0.85); } }
      M.ao = ao; bronze(u, h, ao, sd, wear, inside, k); if (inside) { const dk = 0.55 + 0.35 * ss(0.95, 0.1, hn); M.r *= dk; M.g *= dk * 1.05; M.b *= dk * 1.05; M.fr *= dk; M.fg *= dk; M.fb *= dk; M.ao *= 0.7; M.sh = 0.25; }
      if (!inside && o.crack) { const cu = u - crackU - 0.06 * Math.sin(hn * 9 + sd) - 0.05 * (vn(hn * 11, sd) - 0.5), cw = Math.abs(cu); if (hn > 0.12 && hn < 1.08) { if (cw < 0.022 * Rs) { M.mt = 0; M.r = 0.015; M.g = 0.012; M.b = 0.01; M.ao = 0.4; } else if (cw < 0.05 * Rs) { M.fr = 1; M.fg = 0.78; M.fb = 0.48; M.rg = 0.2; M.mt = 1; } } } };
    const shell = o.half ? (o.half < 0 ? (phi, h) => { const hn = h / Hs, j = 0.08 * Math.sin(hn * 13 + sd) + 0.06 * Math.sin(hn * 31 + sd * 2); return phi >= Math.PI / 2 + 0.3 + j && phi <= Math.PI * 1.5 + 0.45 - j * 0.7; }
      : (phi, h) => { const hn = h / Hs, j = 0.08 * Math.sin(hn * 13 + sd) + 0.06 * Math.sin(hn * 31 + sd * 2); return phi <= Math.PI / 2 - 0.3 - j || phi >= Math.PI * 1.5 - 0.45 + j * 0.7; }) : null;
    const th = h => Rs * (0.06 + 0.07 * ss(0.3, 0.05, h / Hs));
    if (shell) { rev(S, cx, by, prof, 0, H1, { mat, shell, th, part: 'back', bump: 0.12 });
      if (o.clapper) {   // the clapper still hangs inside on its iron stem: a ball of iron, a flight below
        const kx = cx + (o.half < 0 ? 0.08 : -0.08) * Rs; tube(S, [[kx, by - 1.18 * Hs], [kx + 0.02, by - 0.42 * Hs]], 0.045 * Rs, 0.05 * Rs, (t, s, ao) => iron(t * 3, s, ao, 4));
        ball(S, kx + 0.02, by - 0.36 * Hs, 0.15 * Rs, 0.15 * Rs, (dx, dy, ao) => iron(dx, dy, ao, 6)); tube(S, [[kx + 0.02, by - 0.26 * Hs], [kx + 0.02, by - 0.12 * Hs]], 0.06 * Rs, 0.035 * Rs, (t, s, ao) => iron(t * 3 + 1, s, ao, 7)); }
      rev(S, cx, by, prof, 0, H1, { mat, shell, th, part: 'front', bump: 0.12 });
      // the fracture's thickness: raw bright bronze along both cut edges, jagged
      S.unlock(); const c = S.c, cutA = h => { const hn = h / Hs, j = 0.08 * Math.sin(hn * 13 + sd) + 0.06 * Math.sin(hn * 31 + sd * 2); return o.half < 0 ? [Math.PI / 2 + 0.3 + j, Math.PI * 1.5 + 0.45 - j * 0.7] : [Math.PI / 2 - 0.3 - j, Math.PI * 1.5 - 0.45 + j * 0.7]; };
      for (const side of [1, 0]) { const ptsO = [], ptsI = []; for (let i = 0; i <= 40; i++) { const h = H1 * 0.985 * i / 40, a = cutA(h)[side], r = prof(h), ri = r - th(h); ptsO.push([cx + Math.cos(a) * r, by - h + Math.sin(a) * r * K]); ptsI.push([cx + Math.cos(a) * ri, by - h + Math.sin(a) * ri * K]); }
        c.beginPath(); ptsO.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let i = ptsI.length - 1; i >= 0; i--) c.lineTo(ptsI[i][0], ptsI[i][1]); c.closePath();
        const g = c.createLinearGradient(cx - Rs, by - H1, cx + Rs, by); g.addColorStop(0, side ? '#F4D9A0' : '#9C7440'); g.addColorStop(0.5, side ? '#C9985A' : '#6E4E28'); g.addColorStop(1, side ? '#8A6234' : '#3E2A14'); c.fillStyle = g; c.fill();
        c.save(); c.clip(); grain(c, 0.55, 'overlay'); c.restore(); strokePts(c, ptsO, side ? 'rgba(255,236,190,.9)' : 'rgba(200,160,100,.5)', Math.max(0.012, 1 / S.P)); strokePts(c, ptsI, 'rgba(30,18,8,.55)', Math.max(0.01, 1 / S.P)); } }
    else rev(S, cx, by, prof, 0, H1, { mat, bump: 0.12 });
    if (!o.noCrown) {   // the crown: a cast boss, the canons (the hanging loops), worn bright on their tops
      S.unlock(); rev(S, cx, by - H1 + 0.02, h => Rs * 0.2 * (1 - 0.35 * ss(0, 0.1 * Hs, h)), 0, 0.11 * Hs, { mat: (u, h, ao) => bronze(u, h + 2, ao, sd + 3, ss(0.05, 0.11, h / Hs) * 0.5), top: true, capMat: (x, h, ao) => bronze(x, 5, 1, sd, 0.4), floorAO: 0 });
      const ty = by - H1 - 0.08 * Hs; for (const s of [-1, 1]) tube(S, [[cx + s * 0.05 * Rs, ty], [cx + s * 0.12 * Rs, ty - 0.12 * Hs], [cx + s * 0.04 * Rs, ty - 0.2 * Hs], [cx, ty - 0.2 * Hs]], 0.038 * Rs, 0.038 * Rs, (t, s2, ao) => bronze(t, 3 + s2, ao, sd, 0.2 + 0.6 * (1 - Math.abs(s2)) * ss(0.3, 0.6, t)));
      tube(S, [[cx - 0.16 * Rs, ty + 0.01], [cx - 0.22 * Rs, ty - 0.1 * Hs], [cx - 0.16 * Rs, ty - 0.14 * Hs]], 0.03 * Rs, 0.03 * Rs, (t, s2, ao) => bronze(t + 2, 3, ao, sd + 1, 0.3));
      tube(S, [[cx + 0.16 * Rs, ty + 0.01], [cx + 0.22 * Rs, ty - 0.1 * Hs], [cx + 0.16 * Rs, ty - 0.14 * Hs]], 0.03 * Rs, 0.03 * Rs, (t, s2, ao) => bronze(t + 4, 3, ao, sd + 2, 0.3)); }
    S.unlock();
  }

  /* ======================= the column ======================= */
  function paintColumn(S, cx, H, v, o) {   // a round drum column: a square plinth, a torus base, a fluted shaft in drums, a brass band, a jagged broken top
    o = o || {}; const sd = v * 1.7 + 0.3, R0 = o.r || 0.5, stain = H * 0.36, fl = !o.banded;
    rbox(S, cx, 0, R0 * 1.42, R0 * 1.25, 0, 0.32, 0.06, (f, u, v2, ao) => lime(u, f === 't' ? v2 : v2, ao, sd, stain, f === 't' ? 0.32 : v2, { tone: 0.95 }));
    const top = (phi) => H - 0.25 - 0.35 * Math.abs(Math.sin(phi * 1.5 + sd)) - 0.2 * vn(phi * 3 + sd, 1) * (o.broken === false ? 0 : 1);
    const prof = h => h < 0.32 ? 0 : h < 0.5 ? R0 * (1.18 - 0.16 * ss(0.32, 0.5, h)) + R0 * 0.07 * Math.sin((h - 0.32) / 0.18 * Math.PI) : R0 * (1 - 0.06 * (h - 0.5) / H) + (Math.abs(h - H * 0.58) < 0.09 ? R0 * 0.07 * ss(0.09, 0.05, Math.abs(h - H * 0.58)) : 0);
    const brassH = H * 0.58;
    rev(S, cx, 0, prof, 0.32, o.broken === false ? H : H - 0.02, { shell: o.broken === false ? null : (phi, h) => h <= top(phi > Math.PI ? TAU - phi : phi), part: 'front',
      mat: (u, h, ao, ins, phi) => { if (Math.abs(h - brassH) < 0.09) { brass(u, h, ao, sd, ss(0.03, 0.08, Math.abs(h - brassH)) * 0.3); return; }
        const dr = Math.floor((h - 0.5) / 0.92), jt = (h - 0.5) / 0.92 - dr; lime(u, h, ao, sd + dr * 3.1, stain, h, { tone: 0.92 + 0.12 * hs(dr + 7, v) });
        if (h > 0.5 && (jt < 0.025 || jt > 0.975)) { M.r = 0.1; M.g = 0.25; M.b = 0.25; M.ao *= 0.6; }
        if (fl && h > 0.55) { const f = Math.cos((phi * 10 + sd)), q = f * f; M.ao *= 0.78 + 0.22 * q; } } , bump: fl ? 0 : 0.08 });
    // the broken top: a jagged lip and the fresh rough break seen from above
    if (o.broken !== false) { S.unlock(); const c = S.c, pts = [], rr = R0 * 0.95; for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU, ph = a <= Math.PI ? a : TAU - a; pts.push([cx + Math.cos(a) * rr, -top(ph) + Math.sin(a) * rr * K]); }
      c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); const g = c.createLinearGradient(cx - rr, -H, cx + rr, -H + 0.5); g.addColorStop(0, '#F2F0E2'); g.addColorStop(0.55, '#CFCDBC'); g.addColorStop(1, '#9A9C8C'); c.fillStyle = g; c.fill(); c.save(); c.clip(); grain(c, 0.7); c.fillStyle = 'rgba(40,60,58,.25)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(cx + (hs(i, v) - 0.5) * rr, -H + 0.3 + (hs(i + 9, v) - 0.5) * 0.25, 0.04 + hs(i, 3) * 0.05, 0, TAU); c.fill(); } c.restore();
      strokePts(c, pts.slice(25), 'rgba(255,255,248,.75)', 0.025); }
    S.unlock();
  }

  /* ======================= the rift's prop kinds ======================= */
  const DEF = {};
  // each: box (tiles about the feet: x0, y0, x1, y1), paint(S, v)
  DEF.belcolumn = { box: v => [-1.4, -6.0 - (v % 3) * 0.35, 1.4, 0.55], paint(S, v) { const H = 3.9 + (v % 3) * 0.45; waterRing(S, 1.15, 1); contact(S.c && S, 0.05, 0.02, 0.85, 0.3, 0.5); paintColumn(S, 0, H, v, { banded: v % 2 === 1 });
      // barnacles at the waterline, weed hanging from them
      for (let i = 0; i < 9; i++) { const a = 0.4 + i / 8 * 2.4, x = Math.cos(a) * 0.52, y = -0.5 - hs(i, v) * 0.45 + Math.sin(a) * 0.52 * K; ball(S, x, y, 0.055 + hs(i + 3, v) * 0.03, 0.05, (dx, dy, ao) => { M.r = 0.62; M.g = 0.62; M.b = 0.56; M.rg = 0.7; M.ao = ao * (Math.hypot(dx, dy) < 0.4 ? 0.4 : 1); }); }
      S.unlock(); weed(S, [[-0.42, -0.7], [-0.2, -0.62], [0.25, -0.68], [0.4, -0.75]], 0.4, v); } };
  DEF.belstump = { box: v => [-1.5, -2.9, 1.5, 0.55], paint(S, v) { const H = 1.35 + (v % 3) * 0.35; waterRing(S, 1.1, 0.9); contact(S, 0.05, 0.02, 0.9, 0.3, 0.5); paintColumn(S, 0, H, v + 2, { banded: true, r: 0.52 });
      const R = R1(5 + v); for (let i = 0; i < 5; i++) { const x = (R() - 0.5) * 2.2, y = 0.1 + R() * 0.25, s = 0.12 + R() * 0.12; if (Math.abs(x) < 0.7) continue; contact(S, x, y + 0.02, s * 1.3, s * 0.5, 0.45); rbox(S, x, y, s, s * 0.8, 0, s * 1.2, s * 0.4, (f, u, v2, ao) => lime(u + i, v2, ao, i * 3, 0.1, v2 + 0.05, { fresh: f === 't' })); }
      S.unlock(); } };
  DEF.belbench = { box: v => [-2.1, -1.3, 2.1, 0.6], paint(S, v) {   // a pew become a raft: four planks, iron straps, weed trailing in the water
      const bob = (v % 2) * 0.05, c = S.c; waterRing(S, 1.9, 1); contact(S, 0, 0.05, 1.7, 0.42, 0.45);
      for (let i = 0; i < 4; i++) { const y = -0.02 - i * 0.16 + bob, hw = 1.38 - (i % 2) * 0.05, dx = (hs(i, v) - 0.5) * 0.08; rbox(S, dx, y, hw, 0.09, 0.08, 0.26, 0.035, (f, u, v2, ao) => { wood(u + i * 2.3, f === 't' ? v2 + i : v2 * 0.3 + i, ao, v + i); if (Math.abs(u) > hw - 0.12) M.ao *= 0.85; }); }
      for (const sx of [-0.85, 0.85]) { rbox(S, sx, 0.0 + bob, 0.075, 0.33, 0.25, 0.29, 0.02, (f, u, v2, ao) => iron(u * 4, v2 * 4, ao, sx + v)); S.unlock(); rivets(S, [[sx, -0.33 + bob], [sx, -0.51 + bob], [sx, -0.69 + bob]], 0.025, 'iron'); }
      S.unlock(); weed(S, [[-1.25, -0.2], [-0.4, -0.15], [0.5, -0.12], [1.2, -0.22]], 0.3, v + 4); c.save(); c.strokeStyle = 'rgba(226,247,242,.55)'; c.lineWidth = 0.03; c.beginPath(); c.ellipse(0, 0.04, 1.62, 0.36, 0, 0.1, Math.PI - 0.1); c.stroke(); c.restore(); } };
  DEF.belfall = { box: v => [-1.4, -6.6 - (v % 3) * 0.4, 1.4, 0.55], paint(S, v) {   // an upward waterfall: a stone basin of churning water, a ribbon of water rising into a crack in the dark
      const H = 5.2 + (v % 3) * 0.5, c = S.c; contact(S, 0, 0.05, 1.15, 0.4, 0.5);
      rev(S, 0, 0, h => 0.95 - 0.06 * ss(0, 0.32, h) + 0.04 * Math.sin(h / 0.32 * Math.PI), 0, 0.32, { mat: (u, h, ao) => lime(u, h, ao, v, 0.25, h, { tone: 0.9 }), top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const rr = Math.hypot(x / 0.89, ey); if (rr < 0.82) { M.r = 0.05; M.g = 0.24; M.b = 0.28; M.cc = 0.9; M.rg = 0.1; M.er = 0.02; M.eg = 0.09; M.eb = 0.1; const fo = vn(x * 9 + 3, ey * 9); if (fo > 0.6 && rr > 0.4) { M.r = 0.7; M.g = 0.82; M.b = 0.82; M.cc = 0.2; } } else lime(x, ey, 1, v, 0, 1, { tone: 1.05 }); } });
      S.unlock(); const w0 = 0.24, w1 = 0.12; c.save(); c.beginPath(); c.moveTo(-w0, -0.3); c.bezierCurveTo(-w0 * 0.9, -H * 0.4, -w1 * 1.4, -H * 0.7, -w1, -H); c.lineTo(w1, -H); c.bezierCurveTo(w1 * 1.4, -H * 0.7, w0 * 0.9, -H * 0.4, w0, -0.3); c.closePath();
      let g = c.createLinearGradient(-w0, 0, w0, 0); g.addColorStop(0, 'rgba(40,140,165,.82)'); g.addColorStop(0.3, 'rgba(200,250,250,.9)'); g.addColorStop(0.55, 'rgba(110,210,220,.85)'); g.addColorStop(1, 'rgba(30,110,140,.82)'); c.fillStyle = g; c.fill(); c.clip();
      const R = R1(9 + v); c.lineCap = 'round'; for (let i = 0; i < 22; i++) { const x = (R() - 0.5) * w0 * 1.6, y0 = -R() * H, l = 0.3 + R() * 0.9; c.strokeStyle = `rgba(235,255,255,${0.25 + R() * 0.45})`; c.lineWidth = 0.015 + R() * 0.03; c.beginPath(); c.moveTo(x, y0); c.lineTo(x * 0.85, y0 - l); c.stroke(); } c.restore();
      for (let i = 0; i < 10; i++) { const a = R() * TAU, r = 0.25 + R() * 0.35; ball(S, Math.cos(a) * r, -0.36 - R() * 0.25 + Math.sin(a) * r * K, 0.05 + R() * 0.06, 0.04 + R() * 0.04, () => { M.r = 0.75; M.g = 0.9; M.b = 0.92; M.rg = 0.2; M.cc = 0.5; }); } S.unlock();
      c.fillStyle = '#060E12'; c.beginPath(); c.moveTo(-0.55, -H - 0.04); c.lineTo(-0.15, -H - 0.24); c.lineTo(0.12, -H - 0.1); c.lineTo(0.5, -H - 0.26); c.lineTo(0.42, -H + 0.07); c.lineTo(0.1, -H + 0.12); c.lineTo(-0.35, -H + 0.08); c.closePath(); c.fill(); fadeTop(S, -H - 0.5, -H + 1.3); } };
  DEF.belrib = { box: v => [-1.6, -5.6 - (v % 2) * 0.6, 1.9, 0.5], paint(S, v) {   // a brass rib: a thick curved beam out of the floor, riveted, green in its folds; a cast shoe at its foot
      const H = 4.2 + (v % 2) * 0.6, sd = v % 2 ? -1 : 1, pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([sd * 0.9 * u * u - sd * 0.08 * Math.sin(u * Math.PI), -H * u]); }
      contact(S, 0, 0.02, 0.75, 0.25, 0.55); tube(S, pts, 0.26, 0.17, (t, s, ao) => { brass(s * 0.3, t * H, ao * (0.6 + 0.4 * ss(0, 0.1, t)), v, ss(0.55, 0.95, -s) * 0.6); if (Math.abs(s) > 0.55 && Math.abs(s) < 0.62) M.ao *= 0.55; });
      rbox(S, 0, 0.04, 0.42, 0.24, 0, 0.26, 0.06, (f, u, v2, ao) => brass(u, v2, ao * 0.85, v + 2, f === 't' ? 0.2 : 0)); S.unlock();
      const rv = []; for (let i = 1; i < 8; i++) { const u = i / 8; rv.push([sd * 0.9 * u * u - sd * 0.08 * Math.sin(u * Math.PI) - 0.07, -H * u]); } rivets(S, rv, 0.045);
      S.unlock(); fadeTop(S, -H - 0.4, -H + 1.4); } };
  DEF.belbell = { box: v => { const s = 0.95 + (v % 3) * 0.18; return [-1.4 * s - 0.3, -2.4 * s - 0.4, 1.4 * s + 0.3, 0.55]; }, paint(S, v) { const s = 0.95 + (v % 3) * 0.18, Rs = 1.04 * s, Hs = 1.42 * s; contact(S, 0.05, 0.03, Rs * 1.15, Rs * 0.42, 0.62);
      paintBell(S, 0, 0, Rs, Hs, { crack: v % 2 === 1, sd: v * 2.3 });
      for (let i = 0; i < 5; i++) { const a = 0.6 + i * 0.5, x = Math.cos(a) * Rs * 0.98, y = Math.sin(a) * Rs * K * 0.98 - 0.03; ball(S, x, y - 0.02, 0.05, 0.045, (dx, dy, ao) => { M.r = 0.6; M.g = 0.62; M.b = 0.56; M.rg = 0.7; M.ao = ao * (Math.hypot(dx, dy) < 0.4 ? 0.35 : 1); }); } S.unlock(); weed(S, [[-Rs * 0.6, -0.05], [Rs * 0.3, -0.03]], 0.22, v); } };
  DEF.belmould = { box: v => [-1.6, -2.3, 1.6, 0.55], paint(S, v) { contact(S, 0, 0.04, 1.35, 0.42, 0.6); paintMould(S, 0, 0, 1, v); } };
  DEF.belrail = { box: v => [-1.6, -1.45, 1.6, 0.5], paint(S, v) {   // a balustrade: a plinth, vase balusters, a rail, one baluster gone into the sea and the rail snapped over it
      const n = 4, w = 2.0, brk = 1 + (v % 3), sd = v * 1.3; contact(S, 0, 0.04, 1.3, 0.3, 0.45);
      rbox(S, 0, 0.02, w / 2 + 0.06, 0.2, 0, 0.14, 0.04, (f, u, v2, ao) => lime(u, v2, ao, sd, 0.1, f === 't' ? 0.14 : v2, {}));
      const bal = h => { const t = h / 0.68; return 0.075 + 0.07 * Math.exp(-(((t - 0.35) / 0.2) ** 2)) + (t > 0.86 ? 0.04 : 0) + (t < 0.1 ? 0.035 : 0); };
      for (let i = 0; i < n; i++) { const x = -w / 2 + (i + 0.5) * w / n; if (i === brk) { rev(S, x, -0.12, h => bal(h), 0, 0.2, { mat: (u, h, ao) => lime(u + i, h, ao, sd + i, 0, h + 0.3, {}), top: true, capMat: (x2, h, ao) => lime(x2 * 3, 7, 1, i, 0, 1, { fresh: true }) }); continue; }
        rev(S, x, -0.12, bal, 0, 0.68, { mat: (u, h, ao) => lime(u + i, h, ao, sd + i, 0, h + 0.3, {}), floorAO: 0.6 }); }
      S.unlock(); const x0 = -w / 2 - 0.06, b0 = -w / 2 + brk * w / n; rbox(S, (x0 + b0 - 0.08) / 2, -0.04, (b0 - 0.08 - x0) / 2, 0.11, 0.78, 0.92, 0.035, (f, u, v2, ao) => lime(u, v2, ao, sd + 5, 0, 1, { tone: 1.02 }));
      if (brk < n - 1) { const b1 = b0 + w / n + 0.08, x1 = w / 2 + 0.06; rbox(S, (b1 + x1) / 2, -0.04, (x1 - b1) / 2, 0.11, 0.78, 0.92, 0.035, (f, u, v2, ao) => lime(u, v2, ao, sd + 6, 0, 1, { tone: 1.02 })); }
      S.unlock(); weed(S, [[b0 + 0.1, -0.15]], 0.18, v); } };
  DEF.belcoral = { box: v => [-1.6, -2.8, 1.6, 0.5], paint(S, v) {   // branching coral on a barnacled rock: ribbed ivory and pink branches forking, turquoise polyps at their tips
      const R = R1(13 + v * 7), tips = []; contact(S, 0, 0.04, 0.9, 0.3, 0.5);
      ball(S, 0, -0.1, 0.5, 0.26, (dx, dy, ao) => { wetstone(dx, dy, ao, v); M.ao = ao; });
      const branch = (x, y, a, L, r, d) => { const pts = [[x, y]]; let cx2 = x, cy2 = y, aa = a; for (let i = 0; i < 6; i++) { aa += (R() - 0.5) * 0.25; cx2 += Math.cos(aa) * L / 6; cy2 += Math.sin(aa) * L / 6; pts.push([cx2, cy2]); }
        tube(S, pts, r, r * 0.6, (t, s, ao) => coral(t * L + d, s, ao, v + d, false)); if (d < 2) { const n2 = 2; for (let k = 0; k < n2; k++) branch(pts[3 + k][0], pts[3 + k][1], aa + (k ? 0.55 : -0.55) + (R() - 0.5) * 0.3, L * 0.55, r * 0.62, d + 1); } else tips.push([cx2, cy2, r]); if (d === 1) tips.push([cx2, cy2, r * 0.7]); };
      for (let i = 0; i < 4; i++) branch((i - 1.5) * 0.18, -0.2, -Math.PI / 2 + (i - 1.5) * 0.42, 1.0 + R() * 0.55, 0.11, 0);
      S.unlock(); for (const [x, y, r] of tips) ball(S, x, y, r * 1.3 + 0.03, r * 1.3 + 0.03, (dx, dy, ao) => { M.r = 0.25; M.g = 0.85; M.b = 0.8; M.rg = 0.2; M.cc = 0.6; M.er = 0.08; M.eg = 0.45; M.eb = 0.42 * (1 - Math.hypot(dx, dy) * 0.4); });
      for (let i = 0; i < 7; i++) { const a = R() * TAU; ball(S, Math.cos(a) * 0.42, -0.08 + Math.sin(a) * 0.12, 0.05, 0.045, (dx, dy, ao) => { M.r = 0.62; M.g = 0.62; M.b = 0.56; M.rg = 0.7; M.ao = ao * (Math.hypot(dx, dy) < 0.4 ? 0.35 : 1); }); } S.unlock(); } };
  DEF.bellamp = { box: v => [-1.0, -3.55, 1.0, 0.5], paint(S, v) {   // a brass post, a bracket, a chain, a caged lantern of sea glass lit turquoise
      const c = S.c, px = -0.42, H = 2.95; contact(S, px, 0.03, 0.4, 0.14, 0.55);
      rev(S, px, 0, h => h < 0.12 ? 0.17 : h < 0.2 ? 0.12 : h > H - 0.12 ? 0.1 : 0.065 + (Math.abs(h - 0.9) < 0.04 || Math.abs(h - 2.0) < 0.04 ? 0.025 : 0), 0, H, { mat: (u, h, ao) => brass(u, h, ao, v, ss(0.8, 1, Math.cos(u * 9)) * 0.5), top: true, capMat: (x, h) => brass(x, 9, 1, v, 0.6) });
      tube(S, [[px, -H + 0.06], [px + 0.2, -H - 0.08], [0.15, -H - 0.12], [0.1, -H + 0.02]], 0.035, 0.03, (t, s, ao) => brass(t * 2, s, ao, v + 1, 0.4 * (1 - Math.abs(s))));
      S.unlock(); for (let i = 0; i < 5; i++) { const y = -H + 0.06 + i * 0.075, rx = i % 2 ? 0.018 : 0.04; tube(S, [[0.1 - rx, y], [0.1, y - 0.04], [0.1 + rx, y], [0.1, y + 0.04], [0.1 - rx, y]], 0.012, 0.012, (t, s, ao) => iron(t, s, ao, i)); }
      const ly = -2.36; S.unlock();
      rev(S, 0.1, ly + 0.36, h => 0.2 - 0.04 * h, 0, 0.62, { mat: (u, h, ao) => { const w = vn(u * 11 + v, h * 11); M.r = 0.12 + 0.2 * w; M.g = 0.55 + 0.3 * w; M.b = 0.52 + 0.28 * w; M.rg = 0.15; M.cc = 0.8; const k = 0.55 + 0.45 * (1 - Math.abs(u) * 3); M.er = 0.08 * k; M.eg = 0.5 * k; M.eb = 0.46 * k; M.ao = 1; }, floorAO: 0 });
      S.unlock(); for (const a of [0.55, 1.25, 1.9, 2.6]) { const x = 0.1 + Math.cos(a) * 0.19; tube(S, [[x, ly + 0.36 + Math.sin(a) * 0.06], [x * 0.95 + 0.005, ly - 0.24 + Math.sin(a) * 0.05]], 0.02, 0.018, (t, s, ao) => brass(t, s, ao, a, 0.5 * (1 - Math.abs(s)))); }
      rev(S, 0.1, ly - 0.24, h => 0.22 * (1 - h / 0.28) + 0.02, 0, 0.28, { mat: (u, h, ao) => brass(u, h + 3, ao, v + 3, ss(0.7, 1, Math.cos(u * 7)) * 0.4), floorAO: 0 });
      rev(S, 0.1, ly + 0.42, h => 0.23, 0, 0.06, { mat: (u, h, ao) => brass(u, h + 5, ao, v + 4, 0.3), top: true, capMat: (x) => brass(x, 6, 1, v, 0.2), floorAO: 0 }); S.unlock();
      ball(S, 0.1, ly - 0.56, 0.05, 0.05, () => brass(0, 0, 1, 1, 0.8)); ball(S, 0.1, ly + 0.08, 0.07, 0.13, (dx, dy) => { M.r = 0.9; M.g = 1; M.b = 1; M.er = 0.6; M.eg = 1.4; M.eb = 1.3; }); S.unlock(); } };
  DEF.belarch = { box: v => [-2.4, -6.3, 2.4, 0.5], paint(S, v) { paintArch(S, v); } };
  DEF.belarchl = { box: v => DEF.belarch.box(0), paint(S) { paintArch(S, 0); } };
  DEF.belarchr = { box: v => DEF.belarch.box(1), paint(S) { paintArch(S, 1); } };
  DEF.belhalf = { box: v => [-2.4, -3.7, 2.4, 0.65], paint(S, v) {   // half of a broken bell standing on its rim: the open side shows its dark inside and the clapper
      const sd = v % 2 ? -1 : 1, Rs = 1.42, Hs = 2.0; contact(S, -sd * 0.25, 0.04, 1.75, 0.5, 0.6);
      paintBell(S, 0, 0, Rs, Hs, { half: -sd, clapper: true, sd: v * 1.9 + 1 });
      const R = R1(17 + v); for (let i = 0; i < 4; i++) { const x = sd * (0.4 + R() * 1.1), y = 0.12 + R() * 0.22, s = 0.08 + R() * 0.08; S.c.save(); S.c.translate(x, y); S.c.rotate((R() - 0.5) * 1.5); S.c.beginPath(); S.c.moveTo(-s, 0); S.c.lineTo(-s * 0.3, -s * 0.7); S.c.lineTo(s, -s * 0.35); S.c.lineTo(s * 0.6, s * 0.25); S.c.closePath(); S.c.fillStyle = '#6E4E28'; S.c.fill(); S.c.strokeStyle = 'rgba(255,220,160,.8)'; S.c.lineWidth = 0.015; S.c.stroke(); S.c.restore(); } } };
  DEF.belpipe = { box: v => [-1.0, -3.6, 1.0, 0.5], paint(S, v) {   // a brass pipe rising out of the floor, flanged and bolted, a red valve wheel, green at the joints
      const c = S.c, H = 3.3; contact(S, 0, 0.03, 0.45, 0.16, 0.55); const fl = h => Math.abs(h - 0.55) < 0.07 || Math.abs(h - 1.75) < 0.07 || h < 0.1;
      rev(S, 0, 0, h => fl(h) ? 0.27 : 0.18, 0, H, { mat: (u, h, ao) => { brass(u, h, fl(h) ? ao * 0.9 : ao, v, fl(h) ? ss(0.6, 1, Math.cos(u * 8)) * 0.5 : 0); if (Math.abs(h - 0.55) < 0.14 || Math.abs(h - 1.75) < 0.14) { M.r = lerp(M.r, 0.14, 0.5); M.g = lerp(M.g, 0.38, 0.5); M.b = lerp(M.b, 0.3, 0.5); M.mt *= 0.5; } } });
      S.unlock(); for (const h of [0.55, 1.75]) rivets(S, [-0.21, -0.1, 0, 0.1, 0.21].map(x => [x, -h + 0.02 + Math.sqrt(Math.max(0, 0.27 * 0.27 - x * x)) * K * 0.9]), 0.028);
      S.unlock(); const wx = 0.46, wy = -1.2; tube(S, [[0.18, wy], [wx, wy]], 0.045, 0.045, (t, s, ao) => brass(t, s, ao, 3, 0.3)); const ring = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; ring.push([wx + Math.cos(a) * 0.26, wy + Math.sin(a) * 0.26]); }
      tube(S, ring, 0.04, 0.04, (t, s, ao) => iron(t * 5, s, ao, 2, true)); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; tube(S, [[wx, wy], [wx + Math.cos(a) * 0.24, wy + Math.sin(a) * 0.24]], 0.022, 0.02, (t, s, ao) => iron(t + k, s, ao, k, true)); } ball(S, wx, wy, 0.06, 0.06, () => brass(0, 0, 1, 2, 0.7)); S.unlock(); fadeTop(S, -H - 0.3, -H + 1.0); } };

  function weed(S, roots, L, v) { const c = S.c, R = R1(31 + v * 3); c.save(); c.lineCap = 'round'; for (const [x, y] of roots) for (let k = 0; k < 3; k++) { const l = L * (0.5 + R() * 0.7), sw = (R() - 0.5) * 0.25; const g = c.createLinearGradient(x, y, x, y + l); g.addColorStop(0, 'rgba(20,70,48,.95)'); g.addColorStop(1, 'rgba(40,120,80,.55)'); c.strokeStyle = g; c.lineWidth = 0.035 + R() * 0.025; c.beginPath(); c.moveTo(x + (R() - 0.5) * 0.1, y); c.quadraticCurveTo(x + sw, y + l * 0.5, x + sw * 1.6, y + l); c.stroke(); } c.restore(); }
  /* the bell mould: a stone base, the cope of fired clay split at its seam (the dark core seen in the gap, the seam flashing bronze), two iron hoops with bolts, lifting lugs, a pouring cup on top */
  function paintMould(S, cx, by, s, v) {
    const sd = v * 2.1 + 0.4, Hm = 1.55 * s, Rm = 0.98 * s, prof = h => Rm * (h < 0.12 * s ? 1.02 : bellR(h / Hm * 1.1) * 0.98 + 0.03 * s) + ((Math.abs(h - 0.32 * s) < 0.05 * s || Math.abs(h - 0.95 * s) < 0.045 * s) ? 0.04 * s : 0);
    rbox(S, cx, by + 0.02, Rm * 1.12, Rm * 0.62, 0, 0.12 * s, 0.04, (f, u, v2, ao) => lime(u, v2, ao, sd, 0, 0.2, { tone: 0.75 }));
    const hoop = h => Math.abs(h - 0.32 * s) < 0.05 * s || Math.abs(h - 0.95 * s) < 0.045 * s;
    const mat = (u, h, ao, ins) => { if (!ins && hoop(h)) { iron(u * 2, h * 3, ao, sd, false); return; } clay(u, h, ao, sd); if (ins) { M.r *= 0.6; M.g *= 0.6; M.b *= 0.6; } };
    const shell = (phi, h) => Math.abs(phi - Math.PI / 2 - 0.08) > 0.07 + 0.03 * Math.sin(h * 20);
    rev(S, cx, by - 0.12 * s, prof, 0, Hm, { mat, shell, th: () => 0.12 * s, part: 'back' });
    rev(S, cx, by - 0.12 * s, h => prof(h) * 0.84, 0, Hm * 0.9, { mat: (u, h, ao) => { clay(u + 3, h, ao * 0.6, sd + 4); M.r *= 0.55; M.g *= 0.5; M.b *= 0.5; }, floorAO: 0.5 });
    rev(S, cx, by - 0.12 * s, prof, 0, Hm, { mat, shell, th: () => 0.12 * s, part: 'front' });
    S.unlock(); const c = S.c, gx = cx + Math.cos(Math.PI / 2 + 0.08) * Rm; c.save(); c.strokeStyle = 'rgba(255,214,140,.85)'; c.lineWidth = 0.022 * s; c.beginPath(); for (let i = 0; i <= 20; i++) { const h = i / 20 * Hm * 0.97, r = prof(h), x = cx + Math.cos(Math.PI / 2 + 0.16) * r, y = by - 0.12 * s - h + Math.sin(Math.PI / 2 + 0.16) * r * K; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore(); void gx;
    for (const h of [0.32, 0.95]) { const r = prof(h * s) + 0.01; rivets(S, [-0.75, -0.4, 0.4, 0.75].map(k => [cx + k * r, by - 0.12 * s - h * s + Math.sqrt(Math.max(0, 1 - k * k)) * r * K]), 0.035 * s, 'iron'); }
    for (const sx of [-1, 1]) { rbox(S, cx + sx * (Rm * 0.98 + 0.06 * s), by - 0.55 * s, 0.07 * s, 0.07 * s, 0, 0.3 * s, 0.025 * s, (f, u, v2, ao) => iron(u * 5, v2 * 5, ao, sx + sd)); S.unlock(); ball(S, cx + sx * (Rm * 0.98 + 0.06 * s), by - 0.55 * s - 0.33 * s, 0.05 * s, 0.05 * s, () => iron(1, 1, 1, sx)); }
    rev(S, cx, by - 0.12 * s - Hm + 0.03, h => 0.2 * s - 0.04 * s * (h / (0.16 * s)), 0, 0.16 * s, { mat: (u, h, ao) => clay(u, h + 5, ao, sd + 7), top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const rr = Math.hypot(x / (0.16 * s), ey); if (rr < 0.62) { M.r = 0.03; M.g = 0.025; M.b = 0.02; M.rg = 0.9; } else { clay(x, ey, 1, sd); M.r = lerp(M.r, 0.7, 0.4); M.g = lerp(M.g, 0.5, 0.4); M.b = lerp(M.b, 0.25, 0.4); } }, floorAO: 0 });
    S.unlock();
  }
  /* a broken stone arch: a pier of blocks with a moulded base and impost, the spring of the arch in voussoirs, snapped off */
  function paintArch(S, v) {
    const sd = v % 2 ? -1 : 1, H = 4.2, stain = H * 0.4, c = S.c; contact(S, 0, 0.03, 0.9, 0.3, 0.55);
    rbox(S, 0, 0, 0.58, 0.42, 0, 0.3, 0.05, (f, u, v2, ao) => lime(u, v2, ao, v, stain, f === 't' ? 0.3 : v2, { tone: 0.92 }));
    for (let i = 0; i < 5; i++) { const z0 = 0.3 + i * (H - 0.3) / 5, z1 = z0 + (H - 0.3) / 5 - 0.03; rbox(S, (hs(i, v) - 0.5) * 0.03, -0.02, 0.44, 0.34, z0, z1, 0.045, (f, u, v2, ao) => lime(u + i * 1.7, v2, ao, v + i * 3, stain, f === 't' ? z1 : v2, { tone: 0.9 + 0.14 * hs(i, 3) }), { floorAO: 0.6 }); S.unlock(); }
    rbox(S, 0, -0.02, 0.56, 0.4, H, H + 0.22, 0.05, (f, u, v2, ao) => lime(u, v2, ao, v + 9, 0, 2, { tone: 1.02 })); S.unlock();
    // the voussoirs: wedges round an arc rising from the impost toward the opening side, the last one broken off
    const cxA = sd * 1.75, cyA = -(H + 0.22), Ri = 1.3, Ro = 2.05; for (let k = 0; k < 4; k++) { const a0 = Math.PI + k * 0.27, a1 = a0 + 0.255, A = [a0, a1].map(a => sd < 0 ? Math.PI - a + Math.PI : a);
      const pt = (a, r) => [cxA + Math.cos(a) * r * -sd * (sd < 0 ? -1 : 1) * 1, cyA + Math.sin(a) * r]; void A;
      const q = [[Math.cos(a0) * Ri, Math.sin(a0) * Ri], [Math.cos(a0) * Ro, Math.sin(a0) * Ro], [Math.cos(a1) * Ro, Math.sin(a1) * Ro], [Math.cos(a1) * Ri, Math.sin(a1) * Ri]].map(([x, y]) => [cxA + x * sd, cyA + y]); void pt;
      if (k === 3) { q[2] = [q[1][0] + (q[2][0] - q[1][0]) * 0.45 + 0.05 * sd, q[1][1] + (q[2][1] - q[1][1]) * 0.45 - 0.08]; q[3] = [q[0][0] + (q[3][0] - q[0][0]) * 0.6, q[0][1] + (q[3][1] - q[0][1]) * 0.6 + 0.05]; }
      c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); const g = c.createLinearGradient(q[1][0], q[1][1], q[3][0], q[3][1]); g.addColorStop(0, '#ECEADB'); g.addColorStop(0.6, '#C6C8B6'); g.addColorStop(1, '#8F9486'); c.fillStyle = g; c.fill();
      c.save(); c.clip(); grain(c, 0.6); c.fillStyle = 'rgba(10,20,22,.25)'; c.fillRect(cxA - 3, cyA + Ri * 0.2, 6, 3); c.restore(); c.strokeStyle = 'rgba(36,80,79,.9)'; c.lineWidth = 0.03; c.stroke();
      // its soffit (the underside), darker, giving the ring its thickness
      const so = [q[0], q[3], [q[3][0], q[3][1] + 0.28], [q[0][0], q[0][1] + 0.28]]; c.beginPath(); so.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = 'rgba(70,78,72,.95)'; c.fill(); c.strokeStyle = 'rgba(36,80,79,.7)'; c.stroke();
      c.strokeStyle = 'rgba(255,255,245,.55)'; c.lineWidth = 0.02; c.beginPath(); c.moveTo(q[1][0], q[1][1]); c.lineTo(q[2][0], q[2][1]); c.stroke(); }
    fadeTop(S, -H - 2.0, -H - 0.2);
  }

  /* ======================= the hall, the trials, the arenas ======================= */
  // (registered by name: BELPROPS.draw(c, name, v, ...)); v a small key of the variant
  const EMB = (c, kind, x, y, s) => { c.beginPath(); if (kind === 'shield') { c.moveTo(x - s * 0.82, y - s * 0.78); c.quadraticCurveTo(x, y - s * 0.98, x + s * 0.82, y - s * 0.78); c.lineTo(x + s * 0.78, y - s * 0.05); c.quadraticCurveTo(x + s * 0.62, y + s * 0.62, x, y + s); c.quadraticCurveTo(x - s * 0.62, y + s * 0.62, x - s * 0.78, y - s * 0.05); c.closePath(); }
    else if (kind === 'fangs') { for (const sd of [-1, 1]) { const bx = x - sd * s * 0.72, by = y - s * 0.82; c.moveTo(bx - sd * s * 0.18, by); c.quadraticCurveTo(x + sd * s * 0.1, y - s * 0.1, x + sd * s * 0.72, y + s * 0.92); c.quadraticCurveTo(x - sd * s * 0.12, y + s * 0.18, bx + sd * s * 0.22, by - s * 0.02); c.closePath(); } }
    else { for (let i = 0; i <= 60; i++) { const u = i / 60, a = u * TAU * 2.15 - 1.2, r = s * (0.08 + 0.9 * u); i ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.95) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.95); } } };
  const BCOL = { E: ['#FF6F61', '#FFD3CC', '#A8302A', 'fangs'], W: ['#7FEFC0', '#DFFFF0', '#2E9C78', 'shield'], N: ['#AEE2FF', '#F2FBFF', '#3E86C8', 'spiral'], G: ['#6FCFC8', '#E2FBF8', '#1A6670', 'shield'] };   // (G: sea glass)
  /* an enamelled emblem in relief: a cast shadow, the enamel with a light from the upper left, a bright bevel */
  function relief(c, kind, x, y, s, col, lit) { const [base, hi, deep] = col; c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    const fill = (dx, dy, st) => { EMB(c, kind, x + dx, y + dy, s); if (kind === 'spiral') { c.strokeStyle = st; c.lineWidth = s * 0.24; c.stroke(); } else { c.fillStyle = st; c.fill(); } };
    fill(s * 0.06, s * 0.08, 'rgba(4,10,12,.6)');
    const g = c.createLinearGradient(x - s, y - s, x + s, y + s); g.addColorStop(0, hi); g.addColorStop(0.45, base); g.addColorStop(1, deep); fill(0, 0, g);
    EMB(c, kind, x - s * 0.03, y - s * 0.03, s); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = kind === 'spiral' ? s * 0.06 : s * 0.05; c.stroke();
    if (lit > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = lit * 0.45; fill(0, 0, base); } c.restore(); }
  /* a crystal: a cluster of flat facets, a coloured depth, light caught on the facet edges, an inner glow, refraction streaks */
  function crystalFacets(c, B, s) {   // (drawn about its centre, s its height)
    const [base, hi, deep] = BCOL[B]; c.save(); c.lineJoin = 'round';
    const prism = (cx, cy, hw, hh, tip, sk, k) => {   // a six-sided prism with pointed ends, seen from the front: three faces each side of the ridge
      const T0 = [cx + sk * hh * 0.1, cy - hh - tip], B0 = [cx - sk * hh * 0.05, cy + hh + tip * 0.6], L1 = [cx - hw, cy - hh * 0.75], L2 = [cx - hw, cy + hh * 0.75], C1 = [cx - hw * 0.2, cy - hh], C2 = [cx - hw * 0.2, cy + hh], R1p = [cx + hw, cy - hh * 0.7], R2p = [cx + hw, cy + hh * 0.8];
      const face = (pts, a, b2, lt) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); const g = c.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]); g.addColorStop(0, a); g.addColorStop(1, b2); c.fillStyle = g; c.globalAlpha = k; c.fill(); c.globalAlpha = k * lt; c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = s * 0.012; c.stroke(); c.globalAlpha = 1; };
      face([T0, L1, L2, B0, C2, C1], hi, base, 0.6); face([T0, C1, C2, B0, R2p, R1p], deep, '#0C1A22', 0.35); face([T0, L1, C1], '#FFFFFF', hi, 0.9);   // (lit, shaded, the bright crown facet)
      c.globalAlpha = 0.35 * k; const dg = c.createLinearGradient(cx, cy - hh, cx, B0[1]); dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, deep); c.fillStyle = dg; c.beginPath(); [T0, L1, L2, B0, R2p, R1p].forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.globalAlpha = 1;   // (its depth: darker toward the root)
      c.globalAlpha = 0.5 * k; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = s * 0.01; c.beginPath(); c.moveTo(C1[0], C1[1]); c.lineTo(C2[0], C2[1]); c.stroke(); c.globalAlpha = 1; };
    if (B === 'N') {   // a faceted gem: a crown of kite facets round a table, a pavilion below, two satellite shards
      prism(-s * 0.3, s * 0.18, s * 0.06, s * 0.1, s * 0.08, -1, 0.9); prism(s * 0.33, s * 0.2, s * 0.05, s * 0.09, s * 0.07, 1, 0.9);
      const r = s * 0.42, n = 7, pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU - Math.PI / 2; pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.95]); }
      for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], m = [(p[0] + q[0]) * 0.33, (p[1] + q[1]) * 0.33], lt = 0.5 + 0.5 * Math.cos(Math.atan2(m[1], m[0]) + 2.4); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.lineTo(m[0], m[1]); c.closePath(); c.fillStyle = lt > 0.6 ? hi : lt > 0.3 ? base : deep; c.fill(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = s * 0.01; c.stroke(); }
      c.beginPath(); for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.lineTo((p[0] + q[0]) * 0.33, (p[1] + q[1]) * 0.33); } c.closePath(); const g = c.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.05, 0, 0, r * 0.5); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.6, hi); g.addColorStop(1, base); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.stroke(); }
    else if (B === 'E') { prism(-s * 0.2, s * 0.2, s * 0.08, s * 0.14, s * 0.1, -1, 0.85); prism(s * 0.21, s * 0.24, s * 0.06, s * 0.1, s * 0.08, 1, 0.85); prism(0, 0, s * 0.17, s * 0.3, s * 0.2, 0, 1); }
    else { prism(-s * 0.32, s * 0.16, s * 0.09, s * 0.13, s * 0.09, -1, 0.85); prism(s * 0.33, s * 0.18, s * 0.08, s * 0.12, s * 0.08, 1, 0.85); prism(0, 0, s * 0.27, s * 0.28, s * 0.14, 0, 1); }
    // the light in it: a soft core, two refraction streaks, a sparkle
    c.globalCompositeOperation = 'lighter'; const g2 = c.createRadialGradient(0, s * 0.02, 0, 0, s * 0.02, s * 0.32); g2.addColorStop(0, 'rgba(255,255,255,.55)'); g2.addColorStop(0.5, base + '55'); g2.addColorStop(1, base + '00'); c.fillStyle = g2; c.fillRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = s * 0.025; c.beginPath(); c.moveTo(-s * 0.1, -s * 0.28); c.lineTo(-s * 0.02, s * 0.1); c.moveTo(s * 0.06, -s * 0.2); c.lineTo(s * 0.1, s * 0.0); c.stroke(); c.restore();
    glint(c, -s * 0.08, -s * 0.33, s * 0.14, 0.9); }
  /* the limestone drum of a socket: a moulded foot, a brass collar, a ring of runes, a brass-rimmed cup, three claws */
  function paintSocket(S, B, ck, lit) {
    const [base, hi] = BCOL[B], sd = B.charCodeAt(0) * 0.37, c = S.c, R = 0.55, H = 0.78; contact(S, 0, 0.05, 0.75, 0.24, 0.6);
    const prof = h => h < 0.1 ? R * 1.12 : h < 0.18 ? R * (1.12 - 0.12 * ss(0.1, 0.18, h)) + 0.03 * Math.sin((h - 0.1) / 0.08 * Math.PI) : Math.abs(h - 0.62) < 0.06 ? R * 1.06 : h > H - 0.06 ? R * 1.04 : R;
    rev(S, 0, 0, prof, 0, H, { mat: (u, h, ao) => { if (Math.abs(h - 0.62) < 0.06) brass(u, h, ao, sd, ss(0.04, 0.06, Math.abs(h - 0.62)) * 0.6); else lime(u, h, ao, sd, 0, h + 0.4, { tone: 1 }); },
      top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const rr = Math.hypot(x / R, ey); if (rr < 0.62) { M.r = 0.05; M.g = 0.08; M.b = 0.09; M.rg = 0.3; M.cc = 0.5; M.ao = 0.4 + 0.6 * ss(0.62, 0.3, rr); if (lit) { M.er = 0.1; M.eg = 0.12; M.eb = 0.12; } } else if (rr < 0.78) brass(x, ey, 0.9, sd, ss(0.75, 0.66, rr) * 0.7); else lime(x, ey, 1, sd, 0, 1, { tone: 1.05 }); } });
    S.unlock(); c.save();   // the rune ring: small glyphs cut round the drum, in the emblem's colour where lit
    for (let i = 0; i < 9; i++) { const a = 0.35 + i / 8 * (Math.PI - 0.7), x = Math.cos(a) * R, y = -0.36 + Math.sin(a) * R * K, w = 0.06 * Math.sin(a); c.save(); c.translate(x, y); c.scale(Math.max(0.2, Math.sin(a)), 1); c.strokeStyle = lit ? base : 'rgba(40,60,58,.75)'; c.lineWidth = 0.022; c.beginPath(); const k = i % 3; if (k === 0) { c.moveTo(-0.03, -0.05); c.lineTo(0, 0.05); c.lineTo(0.03, -0.05); } else if (k === 1) { c.moveTo(0, -0.06); c.lineTo(0, 0.06); c.moveTo(-0.03, 0); c.lineTo(0.03, -0.03); } else { c.arc(0, 0, 0.035, 0.4, 5.5); } c.stroke(); c.restore(); void w; }
    relief(c, BCOL[B][3], 0, -0.25, 0.12, BCOL[B], lit ? 1 : 0); c.restore();
    // the claws: three brass talons from the rim, open and waiting, or closed round the crystal
    const crY = -(H + 0.55); for (const s of [-1, 0, 1]) { const bx = s * R * 0.62, byy = -H - (s ? 0 : 0.06), tx = s * R * (0.9 - 0.62 * ck), ty = crY - 0.1 * (1 - ck) + (s ? 0 : 0.1);
      const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, mx = bx + s * 0.25, my = (byy + ty) / 2; pts.push([(1 - t) * (1 - t) * bx + 2 * (1 - t) * t * mx + t * t * tx, (1 - t) * (1 - t) * byy + 2 * (1 - t) * t * my + t * t * ty]); }
      tube(S, pts, 0.055, 0.02, (t, s2, ao) => brass(t * 2 + s, s2, ao, sd + s, 0.5 * (1 - Math.abs(s2)) * ss(0.5, 1, t))); ball(S, bx, byy, 0.07, 0.05, () => brass(s, 1, 1, sd, 0.5)); }
    S.unlock();
  }
  function paintPedestal(S, kind) {   // a moulded base, a shaft and a capital with brass fittings; kind 'W' the shield's, 'E' the white plinth
    const W = kind === 'W', sd = W ? 3.3 : 7.1, H = W ? 0.98 : 0.72, R = W ? 0.42 : 0.38; contact(S, 0, 0.04, W ? 0.95 : 0.85, 0.3, 0.6);
    rbox(S, 0, 0.02, R * 1.6, R * 1.4, 0, 0.12, 0.04, (f, u, v2, ao) => lime(u, v2, ao, sd, 0, 0.15, { tone: W ? 0.85 : 1.06 }));
    const prof = h => h < 0.05 ? R * 1.35 : h < 0.16 ? R * (1.35 - 0.35 * ss(0.05, 0.16, h)) + 0.035 * Math.sin((h - 0.05) / 0.11 * Math.PI) : h < H - 0.2 ? R * (1 - 0.06 * (h - 0.16)) : h < H - 0.1 ? R * (0.95 + 0.4 * ss(H - 0.2, H - 0.1, h)) : R * 1.4;
    const brassAt = h => (W ? (h < 0.05 || (h > H - 0.1)) : false) || Math.abs(h - (H - 0.22)) < 0.035;
    rev(S, 0, -0.12, prof, 0, H, { mat: (u, h, ao) => { if (brassAt(h)) brass(u, h, ao, sd, ss(0.5, 1, Math.cos(u * 6)) * 0.5); else lime(u, h, ao, sd, 0, h + 0.4, { tone: W ? 0.94 : 1.08 }); if (!W && h < H - 0.1) { const fl = Math.cos(u / R * 7); M.ao *= 0.86 + 0.14 * fl * fl; } },
      top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const rr = Math.hypot(x / (R * 1.4), ey); if (W) { brass(x, ey, rr > 0.85 ? 1 : 0.8, sd, ss(0.85, 1, rr) * 0.6); if (rr < 0.55) { M.r *= 0.7; M.g *= 0.7; } } else { lime(x, ey, 1, sd, 0, 1, { tone: 1.1 }); if (rr > 0.8 && rr < 0.86) M.ao = 0.7; } } });
    S.unlock(); if (W) relief(S.c, 'shield', 0, -0.12 - H * 0.42, 0.13, ['#3FB58A', '#BFFFE6', '#145C44', 'shield'], 0);
    else { const c = S.c; c.save(); c.strokeStyle = 'rgba(120,128,118,.5)'; c.lineWidth = 0.02; for (const h of [0.3, 0.45]) strokePts(c, arcPts(R * 0.97, -0.12 - h, 0.15, Math.PI - 0.15, 16), 'rgba(110,118,108,.45)', 0.02); c.restore(); }
  }
  /* Varkul's way in: a pit in the foundry floor. Rim stones in a ring (worn, chipped, wet), the far inner wall going down into
     black, water far below catching a turquoise glint, a broken iron grating hanging into it, drips, weed (plan: a floor ring) */
  function paintPit(S) {
    const c = S.c, rx = 1.45, ry = 1.05, cy = -0.4, R = R1(77);
    // the hole: the far wall's courses fading into the dark, the water's glint, the near rim's shadow
    c.save(); c.beginPath(); c.ellipse(0, cy, rx, ry, 0, 0, TAU); c.clip();
    let g = c.createLinearGradient(0, cy - ry, 0, cy + ry); g.addColorStop(0, '#3A4A4C'); g.addColorStop(0.18, '#1E2A2D'); g.addColorStop(0.5, '#071012'); g.addColorStop(1, '#020506'); c.fillStyle = g; c.fillRect(-rx, cy - ry, rx * 2, ry * 2);
    for (let k = 0; k < 6; k++) { const y = cy - ry + 0.1 + k * 0.17 * (1 - k * 0.07), a = 0.5 * (1 - k / 6); c.strokeStyle = `rgba(10,24,26,${a})`; c.lineWidth = 0.035; c.beginPath(); c.ellipse(0, y + ry * 0.6, rx * (1 - k * 0.04), ry * 0.6, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.strokeStyle = `rgba(190,230,225,${0.14 * (1 - k / 6)})`; c.lineWidth = 0.014; c.beginPath(); c.ellipse(0, y + ry * 0.6 + 0.03, rx * (1 - k * 0.04), ry * 0.6, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      for (let j = 0; j < 7; j++) { const a2 = Math.PI * (1.12 + j * 0.11 + (k % 2) * 0.05), x = Math.cos(a2) * rx * (1 - k * 0.04), yy = y + ry * 0.6 + Math.sin(a2) * ry * 0.6; c.strokeStyle = `rgba(8,20,22,${a})`; c.lineWidth = 0.02; c.beginPath(); c.moveTo(x, yy); c.lineTo(x, yy + 0.15); c.stroke(); } }
    for (let i = 0; i < 9; i++) { const x = (R() - 0.5) * rx * 1.5, y = cy - ry * 0.7 + R() * 0.3; c.strokeStyle = 'rgba(160,230,230,.25)'; c.lineWidth = 0.012; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 0.2 + R() * 0.4); c.stroke(); }
    g = c.createRadialGradient(0, cy + ry * 0.35, 0, 0, cy + ry * 0.35, rx * 0.6); g.addColorStop(0, 'rgba(70,200,200,.22)'); g.addColorStop(1, 'rgba(70,200,200,0)'); c.fillStyle = g; c.fillRect(-rx, cy - ry, rx * 2, ry * 2);
    c.strokeStyle = 'rgba(150,240,235,.35)'; c.lineWidth = 0.015; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(0.1, cy + ry * 0.38, 0.2 + i * 0.18, 0.05 + i * 0.04, 0, 0.3, Math.PI - 0.3); c.stroke(); }
    g = c.createLinearGradient(0, cy + ry * 0.4, 0, cy + ry); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.85)'); c.fillStyle = g; c.fillRect(-rx, cy, rx * 2, ry * 2); c.restore();
    // the broken grating: iron bars from the rim, snapped, bent down into the dark
    S.unlock(); const bars = [[-0.9, 0.55, 0.15], [-0.45, 0.95, 0.4], [0.0, 0.5, -0.1], [0.45, 1.05, 0.35], [0.9, 0.4, -0.2]];
    for (const [x, len, bend] of bars) { const yt = cy - Math.sqrt(Math.max(0, 1 - (x / rx) ** 2)) * ry; tube(S, [[x, yt - 0.02], [x + bend * 0.2, yt + len * 0.45], [x + bend * 0.45, yt + len * 0.6 + 0.12]], 0.05, 0.04, (t, s, ao) => { iron(t * 3 + x, s, ao, x * 5); M.ao *= 1 - t * 0.6; }); }
    tube(S, [[-1.15, cy - 0.45], [-0.2, cy - 0.62], [0.35, cy - 0.6]], 0.045, 0.045, (t, s, ao) => iron(t * 4, s, ao, 3)); S.unlock();
    // the rim: a ring of wet stones (the far ones lower on the screen as seen past, the near ones in front, lit on top)
    const n = 16; for (const front of [false, true]) for (let i = 0; i < n; i++) { const a0 = i / n * TAU + 0.05, a1 = (i + 1) / n * TAU - 0.04, am = (a0 + a1) / 2, isF = Math.sin(am) > 0; if (isF !== front) continue;
      const r0x = rx, r0y = ry, r1x = rx + 0.38 + hs(i, 3) * 0.06, r1y = ry + 0.27 + hs(i, 4) * 0.04, P4 = [[Math.cos(a0) * r0x, cy + Math.sin(a0) * r0y], [Math.cos(a0) * r1x, cy + Math.sin(a0) * r1y], [Math.cos(a1) * r1x, cy + Math.sin(a1) * r1y], [Math.cos(a1) * r0x, cy + Math.sin(a1) * r0y]], lift = 0.07 + hs(i, 9) * 0.03;
      c.beginPath(); P4.forEach((p, k) => k ? c.lineTo(p[0], p[1] - lift) : c.moveTo(p[0], p[1] - lift)); c.closePath(); const lt = 0.55 + 0.45 * Math.cos(am + 2.3), wet = 0.4 + 0.6 * hs(i, 6), gg = c.createLinearGradient(P4[1][0], P4[1][1] - lift, P4[3][0], P4[3][1]);
      gg.addColorStop(0, `rgb(${Math.round(150 + 70 * lt - 50 * wet)},${Math.round(155 + 68 * lt - 45 * wet)},${Math.round(142 + 62 * lt - 35 * wet)})`); gg.addColorStop(1, `rgb(${Math.round(90 + 40 * lt - 30 * wet)},${Math.round(100 + 40 * lt - 28 * wet)},${Math.round(94 + 36 * lt - 22 * wet)})`); c.fillStyle = gg; c.fill(); c.save(); c.clip(); grain(c, 0.55); c.restore();
      c.strokeStyle = 'rgba(30,60,60,.85)'; c.lineWidth = 0.022; c.stroke();
      if (front || Math.sin(am) > -0.3) { c.beginPath(); c.moveTo(P4[1][0], P4[1][1] - lift); c.lineTo(P4[2][0], P4[2][1] - lift); c.lineTo(P4[2][0], P4[2][1]); c.lineTo(P4[1][0], P4[1][1]); c.closePath(); c.fillStyle = `rgba(${48 + 30 * lt},${58 + 30 * lt},${56 + 26 * lt},.95)`; if (Math.sin(am) > 0.2) c.fill(); }
      c.strokeStyle = `rgba(255,255,245,${0.35 + 0.4 * lt})`; c.lineWidth = 0.018; c.beginPath(); c.moveTo(P4[0][0], P4[0][1] - lift); c.lineTo(P4[3][0], P4[3][1] - lift); c.stroke();
      if (wet > 0.7) { c.fillStyle = 'rgba(210,250,250,.5)'; c.beginPath(); c.ellipse((P4[1][0] + P4[3][0]) / 2, (P4[1][1] + P4[3][1]) / 2 - lift, 0.08, 0.025, am, 0, TAU); c.fill(); } }
    c.save(); c.strokeStyle = 'rgba(20,70,48,.85)'; c.lineWidth = 0.03; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = Math.PI * (1.15 + i * 0.13), x = Math.cos(a) * rx, y = cy + Math.sin(a) * ry; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 0.05, y + 0.18, x - 0.02, y + 0.32 + hs(i, 2) * 0.2); c.stroke(); } c.restore();
  }
  /* the dais of the hall (plan, centred): bevelled limestone segments in rings, the step's face to the south, brass channels with
     riveted walls running from the three sockets to the seam, the seam's two plates */
  function paintDais(S, sock) {
    const c = S.c, R = 6.4, rings = [0, 2.0, 4.1, R], step = 0.22;
    // the step (its face seen to the south) and the shadow it throws
    contact(S, 0, 0.3, R * 1.02, R * 1.02, 0.45); c.save(); c.beginPath(); c.ellipse(0, step, R, R, 0, 0, Math.PI); c.lineTo(-R, 0); c.ellipse(0, 0, R, R, 0, Math.PI, 0, true); c.closePath(); let g = c.createLinearGradient(-R, 0, R, 0); g.addColorStop(0, '#B9BDAD'); g.addColorStop(0.5, '#8F9586'); g.addColorStop(1, '#5E665C'); c.fillStyle = g; c.fill(); c.clip(); grain(c, 0.5); g = c.createLinearGradient(0, R * 0.7, 0, R + step); g.addColorStop(0, 'rgba(10,20,22,0)'); g.addColorStop(1, 'rgba(10,20,22,.55)'); c.fillStyle = g; c.fillRect(-R, 0, R * 2, R + step); c.restore();
    // the segments: each its own tone, bevelled (a lit edge toward the moon, a dark one away), worn, a few chipped
    for (let k = 0; k < 3; k++) { const r0 = rings[k], r1 = rings[k + 1], n = k === 0 ? 1 : 12;
      for (let i = 0; i < n; i++) { const a0 = i / n * TAU + 0.13 + (k === 1 ? 0 : 0.26), a1 = a0 + TAU / n, t = 0.92 + 0.12 * hs(i + k * 13, 5);
        c.beginPath(); if (n === 1) c.arc(0, 0, r1 - 0.03, 0, TAU); else { c.arc(0, 0, r1 - 0.03, a0 + 0.006, a1 - 0.006); c.arc(0, 0, r0 + 0.03, a1 - 0.006 * r1 / Math.max(0.5, r0), a0 + 0.006 * r1 / Math.max(0.5, r0), true); c.closePath(); }
        g = c.createRadialGradient(-R * 0.35, -R * 0.45, R * 0.1, 0, 0, R * 1.05); g.addColorStop(0, `rgb(${Math.round(232 * t)},${Math.round(234 * t)},${Math.round(222 * t)})`); g.addColorStop(0.6, `rgb(${Math.round(204 * t)},${Math.round(208 * t)},${Math.round(192 * t)})`); g.addColorStop(1, `rgb(${Math.round(164 * t)},${Math.round(170 * t)},${Math.round(156 * t)})`); c.fillStyle = g; c.fill();
        c.save(); c.clip(); grain(c, 0.45); c.strokeStyle = 'rgba(60,70,64,.55)'; c.lineWidth = 0.05; c.stroke(); c.restore();
        c.save(); c.clip(); c.translate(0.03, 0.04); c.strokeStyle = 'rgba(255,255,248,.5)'; c.lineWidth = 0.035; c.stroke(); c.restore(); } }
    c.strokeStyle = 'rgba(36,80,79,.8)'; c.lineWidth = 0.05; for (const r of [2.0, 4.1]) { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }
    c.strokeStyle = '#F2F3EA'; c.lineWidth = 0.07; c.beginPath(); c.arc(0, 0, R - 0.02, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.strokeStyle = 'rgba(36,80,79,.9)'; c.lineWidth = 0.05; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
    // wear: a darker, wetter band toward the water, a few chips
    g = c.createRadialGradient(0, 0, R * 0.8, 0, 0, R); g.addColorStop(0, 'rgba(30,60,64,0)'); g.addColorStop(1, 'rgba(30,60,64,.3)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
    const Rr = R1(55); for (let i = 0; i < 14; i++) { const a = Rr() * TAU, r = 1 + Rr() * 5, x = Math.cos(a) * r, y = Math.sin(a) * r, s = 0.06 + Rr() * 0.1; c.fillStyle = 'rgba(90,96,88,.45)'; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y - s * 0.6); c.lineTo(x + s * 0.8, y + s * 0.2); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,245,.4)'; c.lineWidth = 0.015; c.stroke(); }
    // the brass channels: walls with rivets, a dark wet groove
    for (const s of sock) { const L = Math.hypot(s.x, s.y), ux = -s.x / L, uy = -s.y / L, px = -uy, py = ux, a = Math.atan2(uy, ux), e = L - 1.32; c.save(); c.translate(s.x, s.y); c.rotate(a);
      c.fillStyle = 'rgba(8,14,16,.45)'; c.fillRect(0.2, -0.24, e, 0.48); g = c.createLinearGradient(0, -0.2, 0, 0.2); g.addColorStop(0, '#F0D48A'); g.addColorStop(0.25, '#B8913F'); g.addColorStop(0.5, '#3A2E16'); g.addColorStop(0.75, '#9C7A36'); g.addColorStop(1, '#5E4A26'); c.fillStyle = g; c.fillRect(0.2, -0.2, e, 0.4);
      g = c.createLinearGradient(0, -0.09, 0, 0.09); g.addColorStop(0, '#06100F'); g.addColorStop(0.6, '#0E2426'); g.addColorStop(1, '#1D3E3E'); c.fillStyle = g; c.fillRect(0.2, -0.09, e, 0.18); c.fillStyle = 'rgba(120,220,210,.18)'; c.fillRect(0.2, 0.02, e, 0.025);
      c.fillStyle = 'rgba(70,150,120,.45)'; for (let k = 0; k < 5; k++) c.fillRect(0.3 + k * e / 5 + hs(k, 7) * 0.2, 0.11, 0.18, 0.06);
      for (let k = 0; k < 7; k++) { const x = 0.35 + k * (e - 0.3) / 6; for (const yy of [-0.15, 0.15]) { const rg2 = c.createRadialGradient(x - 0.012, yy - 0.012, 0, x, yy, 0.04); rg2.addColorStop(0, '#FFF0C0'); rg2.addColorStop(0.5, '#B8913F'); rg2.addColorStop(1, '#3A2E16'); c.fillStyle = rg2; c.beginPath(); c.arc(x, yy, 0.038, 0, TAU); c.fill(); } }
      c.strokeStyle = 'rgba(255,240,190,.5)'; c.lineWidth = 0.02; c.beginPath(); c.moveTo(0.2, -0.19); c.lineTo(0.2 + e, -0.19); c.stroke(); c.restore(); void px; void py; }
    // the seam: a dark ring, two stone plates with a bronze lip
    c.fillStyle = '#0A1418'; c.beginPath(); c.arc(0, 0, 1.32, 0, TAU); c.fill();
    for (const sd of [-1, 1]) { c.save(); c.beginPath(); c.rect(-1.4, sd < 0 ? -1.4 : 0.02, 2.8, 1.38); c.clip(); g = c.createRadialGradient(-0.4, -0.5, 0.1, 0, 0, 1.3); g.addColorStop(0, '#D8DBCC'); g.addColorStop(1, '#8E9488'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1.22, 0, TAU); c.fill(); grain(c, 0.45); c.strokeStyle = 'rgba(184,145,63,.9)'; c.lineWidth = 0.05; c.stroke(); c.restore(); }
    c.strokeStyle = '#0A1418'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(-1.24, 0); c.lineTo(1.24, 0); c.stroke(); c.strokeStyle = 'rgba(255,250,235,.45)'; c.lineWidth = 0.025; c.beginPath(); c.arc(0, 0, 1.18, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
  }
  function paintMedal(S, B, lit) { const c = S.c, col = BCOL[B]; contact(S, 0.08, 0.1, 1.05, 1.05, 0.5);
    rev(S, 0, 0.0, h => 0, 0, 0.01, { mat: () => 0 }); S.unlock();
    // (a disc facing us: brass, a bevelled rim and a raised fillet, a dark field)
    S.lock(); const P = S.P; for (let py = Math.floor(S.ay - P * 1.02); py < S.ay + P * 1.02; py++) for (let px = Math.floor(S.ax - P * 1.02); px < S.ax + P * 1.02; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, r = Math.hypot(x, y); if (r > 1.01 || px < 0 || py < 0 || px >= S.w || py >= S.h) continue;
      let s = 0; if (r > 0.86) s = (r - 0.86) / 0.15; else if (r > 0.74 && r < 0.8) s = -0.6 * Math.sin((r - 0.74) / 0.06 * Math.PI); const nx = x / (r || 1) * s, nz = -y / (r || 1) * s, ny = Math.sqrt(Math.max(0.05, 1 - nx * nx - nz * nz)); M0();
      if (r < 0.74) { M.r = 0.06; M.g = 0.11; M.b = 0.12; M.rg = 0.5; M.ao = 0.75 + 0.25 * r; } else brass(x * 2, y * 2, r > 0.97 ? 0.8 : 1, 4, r > 0.9 ? 0.5 : 0.15); shade(nx, ny, nz); put(S, px, py, clamp((1.01 - r) * P + 0.5, 0, 1)); } S.unlock();
    relief(c, col[3], 0, col[3] === 'shield' ? 0.04 : 0, 0.55, col, lit); }

  /* the foundry's coral cage round the Fang Crystal: rings and bars of red coral (half: 'b' the back, 'f' the front) */
  function paintCage(S, half) { const n = 9, rx = 1.0, ry = 0.36, hh = 2.6;
    const bar = i => { const a = i / n * TAU + 0.2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [a, x, y]; };
    for (let i = 0; i < n; i++) { const [a, x, y] = bar(i), front = Math.sin(a) > 0; if ((half === 'f') !== front) continue; const pts = []; for (let k = 0; k <= 8; k++) pts.push([x + Math.sin(k * 1.7 + i) * 0.03, y - hh * k / 8]); tube(S, pts, 0.07, 0.05, (t, s, ao) => { coral(t * 2.6 + i, s, ao, i, true); M.ao *= front ? 1 : 0.7; }); S.unlock(); }
    for (const yy of [0, -hh]) { const pts = []; for (let k = 0; k <= 24; k++) { const a = (half === 'f' ? 0 : Math.PI) + k / 24 * Math.PI; pts.push([Math.cos(a) * rx, yy + Math.sin(a) * ry]); } tube(S, pts, 0.07, 0.07, (t, s, ao) => { coral(t * 4, s + yy, ao, 3, true); M.ao *= half === 'f' ? 1 : 0.7; }); S.unlock(); } }
  /* a hung bell (the foundry's two): a headstock of iron-strapped oak on the chain, the bell below (feet = the pivot) */
  function paintHungBell(S, crack) { const Rs = 1.62, Hs = 1.75; rbox(S, 0, 0.32, 0.55, 0.22, -0.15, 0.2, 0.05, (f, u, v2, ao) => wood(u, v2 * 3, ao, 3)); S.unlock(); rbox(S, 0, 0.32, 0.12, 0.24, -0.16, 0.21, 0.02, (f, u, v2, ao) => iron(u * 5, v2 * 5, ao, 1)); S.unlock(); rivets(S, [[-0.42, -0.02], [0.42, -0.02]], 0.035, 'iron'); S.unlock();
    paintBell(S, 0, 1.31 * Hs + 0.28, Rs, Hs, { crack, sd: crack ? 4.4 : 1.2 }); }
  /* the cistern's alcove: a broad stone arch, its jambs in blocks, voussoirs and a keystone with the spiral, the dark beyond */
  function paintAlcove(S) { const c = S.c, aw = 2.2, ah = 3.4, ay = 0.6;
    c.save(); c.beginPath(); c.moveTo(-aw, ay); c.lineTo(-aw, ay - ah * 0.62); c.quadraticCurveTo(-aw, ay - ah, 0, ay - ah * 1.05); c.quadraticCurveTo(aw, ay - ah, aw, ay - ah * 0.62); c.lineTo(aw, ay); c.closePath(); let g = c.createLinearGradient(0, ay - ah, 0, ay); g.addColorStop(0, '#020509'); g.addColorStop(0.7, '#08141B'); g.addColorStop(1, '#10262E'); c.fillStyle = g; c.fill(); c.clip(); g = c.createRadialGradient(0, ay - ah * 0.55, 0, 0, ay - ah * 0.55, aw); g.addColorStop(0, 'rgba(120,190,255,.18)'); g.addColorStop(1, 'rgba(120,190,255,0)'); c.fillStyle = g; c.fillRect(-aw, ay - ah * 1.1, aw * 2, ah * 1.2); c.restore();
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const z0 = i * 0.6, z1 = z0 + 0.57; rbox(S, sd * (aw + 0.22), ay, 0.3, 0.3, z0, z1, 0.04, (f, u, v2, ao) => lime(u + i, v2, ao, i * 2 + sd, 0.9, f === 't' ? z1 : v2, { tone: 0.92 + 0.1 * hs(i, sd + 3) }), { floorAO: 0.6 }); S.unlock(); }
    const n = 11; for (let i = 0; i < n; i++) { const a0 = Math.PI + i / n * Math.PI, a1 = a0 + Math.PI / n - 0.02, cx = 0, cy = ay - ah * 0.62, rI = aw, rO = aw + (i === 5 ? 0.62 : 0.5), sy = (ah * 0.43) / aw;
      const P4 = [[Math.cos(a0) * rI, cy + Math.sin(a0) * rI * sy], [Math.cos(a0) * rO, cy + Math.sin(a0) * rO * sy], [Math.cos(a1) * rO, cy + Math.sin(a1) * rO * sy], [Math.cos(a1) * rI, cy + Math.sin(a1) * rI * sy]];
      c.beginPath(); P4.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); const lt = 0.5 + 0.5 * Math.cos((a0 + a1) / 2 + 2.6); g = c.createLinearGradient(P4[1][0], P4[1][1], P4[3][0], P4[3][1]); g.addColorStop(0, `rgb(${Math.round(200 + 40 * lt)},${Math.round(202 + 40 * lt)},${Math.round(186 + 38 * lt)})`); g.addColorStop(1, `rgb(${Math.round(130 + 40 * lt)},${Math.round(136 + 40 * lt)},${Math.round(124 + 36 * lt)})`); c.fillStyle = g; c.fill(); c.save(); c.clip(); grain(c, 0.6); c.restore(); c.strokeStyle = 'rgba(36,80,79,.85)'; c.lineWidth = 0.035; c.stroke();
      c.strokeStyle = 'rgba(255,255,245,.45)'; c.lineWidth = 0.02; c.beginPath(); c.moveTo(P4[1][0], P4[1][1]); c.lineTo(P4[2][0], P4[2][1]); c.stroke(); if (i === 5) relief(c, 'spiral', (P4[1][0] + P4[2][0]) / 2, (P4[0][1] + P4[1][1]) / 2 - 0.05, 0.17, BCOL.N, 0.3); } }
  /* a drainage mouth in the foundry's north wall: a stone arch, the dark culvert, an iron grate with a bar gone; o 'S' a grate in the floor by the south wall */
  function paintDrain(S, south) { const c = S.c, w = 1.5;
    if (!south) { c.save(); c.beginPath(); c.ellipse(0, -0.1, w, 0.92, 0, Math.PI, TAU); c.closePath(); let g = c.createLinearGradient(0, -1.0, 0, 0); g.addColorStop(0, '#010406'); g.addColorStop(1, '#0B1E24'); c.fillStyle = g; c.fill(); c.clip(); g = c.createRadialGradient(0, -0.05, 0, 0, -0.05, w); g.addColorStop(0, 'rgba(60,150,160,.3)'); g.addColorStop(1, 'rgba(60,150,160,0)'); c.fillStyle = g; c.fillRect(-w, -1, w * 2, 1); c.restore();
      for (let i = -2; i <= 2; i++) { if (i === 1) { tube(S, [[i * w * 0.33, -0.82], [i * w * 0.33 + 0.03, -0.45], [i * w * 0.33 + 0.16, -0.32]], 0.045, 0.04, (t, s, ao) => iron(t * 3, s, ao, i)); continue; } const top = -Math.sqrt(Math.max(0, 1 - (i * 0.33) ** 2)) * 0.92 - 0.06; tube(S, [[i * w * 0.33, top], [i * w * 0.33, -0.02]], 0.045, 0.045, (t, s, ao) => iron(t * 3 + i, s, ao, i)); }
      tube(S, [[-w * 0.85, -0.5], [w * 0.85, -0.5]], 0.04, 0.04, (t, s, ao) => iron(t * 6, s, ao, 9)); S.unlock();
      const n = 9; for (let i = 0; i < n; i++) { const a0 = Math.PI + i / n * Math.PI, a1 = a0 + Math.PI / n - 0.03, rI = 1, rO = 1.32, P4 = [[Math.cos(a0) * w * rI, -0.1 + Math.sin(a0) * 0.92 * rI], [Math.cos(a0) * w * rO, -0.1 + Math.sin(a0) * 0.92 * rO], [Math.cos(a1) * w * rO, -0.1 + Math.sin(a1) * 0.92 * rO], [Math.cos(a1) * w * rI, -0.1 + Math.sin(a1) * 0.92 * rI]];
        c.beginPath(); P4.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); const lt = 0.5 + 0.5 * Math.cos((a0 + a1) / 2 + 2.6), g = c.createLinearGradient(P4[1][0], P4[1][1], P4[3][0], P4[3][1]); g.addColorStop(0, `rgb(${Math.round(170 + 50 * lt)},${Math.round(176 + 48 * lt)},${Math.round(160 + 44 * lt)})`); g.addColorStop(1, `rgb(${Math.round(100 + 40 * lt)},${Math.round(110 + 40 * lt)},${Math.round(102 + 36 * lt)})`); c.fillStyle = g; c.fill(); c.save(); c.clip(); grain(c, 0.6); const sg = c.createLinearGradient(0, -1.3, 0, 0); sg.addColorStop(0, 'rgba(10,20,22,0)'); sg.addColorStop(1, 'rgba(10,20,22,.6)'); c.fillStyle = sg; c.fillRect(-2, -1.4, 4, 1.4); c.restore(); c.strokeStyle = 'rgba(30,60,60,.85)'; c.lineWidth = 0.03; c.stroke(); }
      c.fillStyle = 'rgba(40,90,70,.5)'; c.fillRect(-w * 1.25, -0.06, w * 2.5, 0.08); }
    else { c.save(); c.beginPath(); c.ellipse(0, 0.25, w, 0.55, 0, 0, Math.PI); c.closePath(); let g = c.createLinearGradient(0, 0.25, 0, 0.8); g.addColorStop(0, '#0B1E24'); g.addColorStop(1, '#010406'); c.fillStyle = g; c.fill(); c.restore();
      for (let i = -3; i <= 3; i++) { if (i === -1) continue; const x = i * w * 0.27, bot = 0.25 + Math.sqrt(Math.max(0, 1 - (x / w) ** 2)) * 0.55; tube(S, [[x, 0.25], [x, bot - 0.02]], 0.04, 0.04, (t, s, ao) => iron(t * 3 + i, s, ao, i)); } tube(S, [[-w, 0.25], [w, 0.25]], 0.06, 0.06, (t, s, ao) => iron(t * 8, s, ao, 5)); S.unlock();
      for (let i = 0; i < 8; i++) { const a0 = i / 8 * Math.PI, a1 = a0 + Math.PI / 8 - 0.03; c.beginPath(); c.ellipse(0, 0.25, w + 0.3, 0.8, 0, a0, a1); c.ellipse(0, 0.25, w, 0.55, 0, a1, a0, true); c.closePath(); const g = c.createLinearGradient(0, 0.3, 0, 1.05); g.addColorStop(0, '#C9CBBB'); g.addColorStop(1, '#7F877B'); c.fillStyle = g; c.fill(); c.save(); c.clip(); grain(c, 0.55); c.restore(); c.strokeStyle = 'rgba(30,60,60,.8)'; c.lineWidth = 0.03; c.stroke(); } } }
  /* the raised platform at the foundry's far end (plan): slabs of white stone, bevelled, their front faces, chipped and wet at the foot */
  function paintPlatform(S, w, h) { const c = S.c, d = 0.32; contact(S, w / 2 + 0.15, h + 0.2, w * 0.6, 0.5, 0.45);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0.15, 0.25, w, h); const rows = 4, cols = 3;
    for (let j = 0; j < rows; j++) for (let i = 0; i <= cols; i++) { const x0 = i * w / cols + (j % 2 ? -w / cols * 0.5 : 0), x1 = x0 + w / cols, xa = Math.max(0, x0), xb = Math.min(w, x1), y0 = j * h / rows, y1 = y0 + h / rows, t = 0.93 + 0.1 * hs(i + j * 7, 2); if (xb - xa < 0.05) continue;
      const g = c.createLinearGradient(xa, y0, xb, y1); g.addColorStop(0, `rgb(${Math.round(245 * t)},${Math.round(246 * t)},${Math.round(238 * t)})`); g.addColorStop(1, `rgb(${Math.round(205 * t)},${Math.round(208 * t)},${Math.round(196 * t)})`); c.fillStyle = g; c.fillRect(xa + 0.02, y0 + 0.02, xb - xa - 0.04, y1 - y0 - 0.04);
      c.save(); c.beginPath(); c.rect(xa, y0, xb - xa, y1 - y0); c.clip(); grain(c, 0.55); const wg = c.createRadialGradient(xa + 0.2, y0 + 0.2, 0.1, xa + 0.2, y0 + 0.2, 1.8); wg.addColorStop(0, 'rgba(255,255,250,.18)'); wg.addColorStop(1, 'rgba(255,255,250,0)'); c.fillStyle = wg; c.fillRect(xa, y0, xb - xa, y1 - y0); if (hs(i, j + 3) > 0.55) { c.strokeStyle = 'rgba(70,80,74,.45)'; c.lineWidth = 0.018; c.beginPath(); const cx2 = xa + (xb - xa) * hs(i, j), cy2 = y0 + (y1 - y0) * hs(j, i); c.moveTo(cx2, cy2); c.lineTo(cx2 + 0.3, cy2 + 0.15); c.lineTo(cx2 + 0.45, cy2 + 0.4); c.stroke(); } c.restore(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 0.025; c.beginPath(); c.moveTo(xa + 0.03, y1 - 0.04); c.lineTo(xa + 0.03, y0 + 0.03); c.lineTo(xb - 0.03, y0 + 0.03); c.stroke(); c.strokeStyle = 'rgba(110,118,108,.6)'; c.beginPath(); c.moveTo(xb - 0.03, y0 + 0.04); c.lineTo(xb - 0.03, y1 - 0.03); c.lineTo(xa + 0.04, y1 - 0.03); c.stroke(); }
    const g = c.createLinearGradient(0, h, 0, h + d); g.addColorStop(0, '#BCC0B2'); g.addColorStop(1, '#6E766C'); c.fillStyle = g; c.fillRect(0, h, w, d); c.save(); c.beginPath(); c.rect(0, h, w, d); c.clip(); grain(c, 0.5); const wg = c.createLinearGradient(0, h, 0, h + d); wg.addColorStop(0, 'rgba(20,50,56,0)'); wg.addColorStop(1, 'rgba(20,50,56,.5)'); c.fillStyle = wg; c.fillRect(0, h, w, d); c.restore();
    for (let i = 1; i < cols * 2; i++) { const x = i * w / (cols * 2); c.strokeStyle = 'rgba(60,70,64,.5)'; c.lineWidth = 0.02; c.beginPath(); c.moveTo(x, h); c.lineTo(x, h + d); c.stroke(); } c.strokeStyle = 'rgba(70,78,70,.9)'; c.lineWidth = 0.035; c.strokeRect(0, 0, w, h + d); }
  /* the plaque's frame and post (the text is the hall's own): a bevelled brass frame, a slate field, corner rivets, a brass post */
  function paintPlaque(S) { const w = 2.5, h = 1.32, y0 = -1.0 - h; contact(S, 0, 0.04, 0.6, 0.18, 0.5); rev(S, 0, 0, h2 => h2 < 0.06 ? 0.13 : 0.07, 0, 1.05, { mat: (u, h2, ao) => brass(u, h2, ao, 7, ss(0.6, 1, Math.cos(u * 12)) * 0.4) }); S.unlock();
    rbox(S, 0, y0 + h + 0.05, w / 2, 0.06, 0, h, 0.07, (f, u, v2, ao) => { brass(u, v2, ao, 5, f === 't' ? 0.5 : 0); const ix = Math.abs(u) < w / 2 - 0.1 && v2 > 0.1 && v2 < h - 0.1 && f === 'f'; if (ix) { M.mt = 0; M.r = 0.08; M.g = 0.12; M.b = 0.12; M.rg = 0.55; M.ao = 0.8; } }, { floorAO: 0 });
    S.unlock(); rivets(S, [[-w / 2 + 0.06, y0 + 0.08], [w / 2 - 0.06, y0 + 0.08], [-w / 2 + 0.06, y0 + h - 0.04], [w / 2 - 0.06, y0 + h - 0.04]], 0.035); S.unlock(); }
  /* the gates' stonework: a pillar or pylon (blocks, the black stain, a brass strap, a cap), a leaf (a slab with straps and studs) */
  function paintPillar(S, hw, hh, strap, cap) { contact(S, 0, 0.04, hw * 1.6, 0.25, 0.5); const n = Math.max(3, Math.round(hh / 0.75));
    for (let i = 0; i < n; i++) { const z0 = i * hh / n, z1 = z0 + hh / n - 0.025; rbox(S, (hs(i, 4) - 0.5) * 0.02, 0, hw, hw * 0.7, z0, z1, 0.04, (f, u, v2, ao) => { lime(u + i * 1.3, v2, ao, i * 2.1, hh * 0.42, f === 't' ? z1 : v2, { tone: 0.9 + 0.14 * hs(i, 9) }); if (strap && f === 'f' && Math.abs(u) < hw * 0.22) brass(u, v2, ao, i, ss(hw * 0.2, hw * 0.12, Math.abs(u)) * 0.3); }, { floorAO: i ? 0.4 : 1 }); S.unlock(); }
    if (cap) { rbox(S, 0, 0, hw * 1.12, hw * 0.8, hh, hh + 0.2, 0.05, (f, u, v2, ao) => lime(u, v2, ao, 9, 0, 2, { tone: 1.06 })); S.unlock(); } }
  function paintLeaf(S, w, h) { rbox(S, w / 2, 0, w / 2, 0.08, 0, h, 0.04, (f, u, v2, ao) => { lime(u + 3, v2, ao, 4, h * 0.4, v2, { tone: 0.95 }); if (f === 'f') { for (const s of [0.22, 0.62]) if (Math.abs(v2 - h * (1 - s) + 0.08) < 0.08) brass(u, v2, ao, 3, ss(0.08, 0.05, Math.abs(v2 - h * (1 - s) + 0.08)) * 0.4); } }, { floorAO: 0.7 }); S.unlock();
    const st = []; for (const s of [0.22, 0.62]) for (let k = 0; k < 5; k++) st.push([0.12 + k * (w - 0.24) / 4, -h * (1 - s) + 0.08 - 0.11 + 0.11]); rivets(S, st, 0.035); S.unlock(); }
  /* the central door's frame: two pillars banded in brass, a lintel bearing the three emblems in brass rings */
  function paintDoorFrame(S, w, h, pw, lh) { for (const sd of [-1, 1]) { const x = sd * (w + pw / 2); S.c.save(); S.c.translate(x, 0); S.unlock(); S.c.restore();
      rbox(S, x, 0, pw / 2, pw * 0.4, 0, h, 0.05, (f, u, v2, ao) => { lime(u + sd, v2, ao, sd + 3, h * 0.25, v2, { tone: 0.97 }); if (f === 'f' && Math.abs(u - x) < pw * 0.22) { brass(u, v2, ao, sd, ss(pw * 0.22, pw * 0.15, Math.abs(u - x)) * 0.4); const bd = ((v2 / h * 4.5) % 1); if (bd < 0.12) { M.r = lerp(M.r, 0.16, 0.6); M.g = lerp(M.g, 0.4, 0.6); M.b = lerp(M.b, 0.32, 0.6); M.mt *= 0.4; } } }, { floorAO: 0.5 }); S.unlock();
      rivets(S, [0.1, 0.3, 0.5, 0.7, 0.9].map(k => [x, -h * k]), 0.045); S.unlock(); }
    rbox(S, 0, 0, w + pw + 0.25, 0.32, h, h + lh, 0.06, (f, u, v2, ao) => lime(u, v2, ao, 6, 0, 2, { tone: 1.04 }), { floorAO: 0 }); S.unlock();
    ['E', 'W', 'N'].forEach((B, i) => { const ex = (i - 1) * w * 0.72, ey = -h - lh * 0.5 + 0.03; rev(S, ex, ey + 0.38 * lh * K + 0.02, () => 0, 0, 0.01, { mat: () => 0 }); S.unlock(); const c = S.c, r = lh * 0.38; c.save(); c.fillStyle = '#16262C'; c.beginPath(); c.arc(ex, ey, r, 0, TAU); c.fill(); const g = c.createLinearGradient(ex - r, ey - r, ex + r, ey + r); g.addColorStop(0, '#F0D48A'); g.addColorStop(0.5, '#B8913F'); g.addColorStop(1, '#5E4A26'); c.strokeStyle = g; c.lineWidth = lh * 0.09; c.stroke(); c.restore(); relief(c, BCOL[B][3], ex, ey, lh * 0.25, BCOL[B], 0.6); }); }
  function paintRib(S) { contact(S, 0, 0.02, 0.3, 0.1, 0.5); rbox(S, 0, 0, 0.14, 0.1, 0, 1.45, 0.05, (f, u, v2, ao) => brass(u * 3, v2, ao * (0.7 + 0.3 * ss(0, 0.3, v2)), 3, f === 't' ? 0.4 : ss(0.06, 0.12, Math.abs(u)) * 0.3)); S.unlock(); rivets(S, [0.25, 0.65, 1.05].map(z => [0, -z]), 0.03); S.unlock(); }
  /* the Nhalu nave's long north wall: courses of ivory blocks over a black tide line, brass pilasters, a crack of turquoise light */
  function paintWall(S, w, cx0) { const h = 3.6, c = S.c; cx0 = cx0 || 0; for (let r = 0; r < 5; r++) { const z0 = r * h / 5, z1 = z0 + h / 5 - 0.03, off = (r % 2) * 0.6; for (let x = -w / 2 - off; x < w / 2; x += 1.2) { const xa = Math.max(-w / 2, x) + cx0, xb = Math.min(w / 2, x + 1.17) + cx0; if (xb - xa < 0.1) continue; rbox(S, (xa + xb) / 2, 0, (xb - xa) / 2, 0.25, z0, z1, 0.04, (f, u, v2, ao) => lime(u + x, v2, ao, r * 3 + x, h * 0.38, f === 't' ? z1 : v2, { tone: 0.9 + 0.12 * hs(Math.round(x * 3), r) }), { floorAO: r ? 0.3 : 1 }); } S.unlock(); }
    for (let x = -w / 2 + 1.2; x < w / 2; x += 4.8) { rbox(S, x + cx0, -0.05, 0.14, 0.3, 0, h * 0.66, 0.04, (f, u, v2, ao) => brass(u * 3, v2, ao, x, 0.2)); S.unlock(); }
    rbox(S, cx0, 0, w / 2, 0.28, h, h + 0.22, 0.04, (f, u, v2, ao) => lime(u, v2, ao, 5, 0, 2, { tone: 1.05 }), { floorAO: 0 }); S.unlock();
    c.save(); c.strokeStyle = 'rgba(97,217,210,.85)'; c.lineWidth = 0.04; c.beginPath(); c.moveTo(cx0 - w * 0.2, -h * 0.9); c.lineTo(cx0 - w * 0.1, -h * 0.75); c.lineTo(cx0 - w * 0.18, -h * 0.6); c.stroke(); c.restore(); }
  function paintHousing(S) { contact(S, 0, 0.04, 0.95, 0.3, 0.55); rbox(S, 0, 0, 0.72, 0.42, 0, 1.15, 0.06, (f, u, v2, ao) => lime(u, v2, ao, 4, 0.5, f === 't' ? 1.15 : v2, { tone: 0.82 })); S.unlock(); rbox(S, 0, 0, 0.8, 0.46, 1.15, 1.3, 0.05, (f, u, v2, ao) => lime(u, v2, ao, 6, 0, 2, { tone: 1 })); S.unlock(); }

  // the hall's registry: name -> { box(v), paint(S, v) }
  const SOCKP = [{ x: 0, y: -2.7 }, { x: -2.35, y: 1.35 }, { x: 2.35, y: 1.35 }];
  Object.assign(DEF, {
    dais: { box: () => [-6.6, -6.6, 6.6, 6.75], paint(S) { paintDais(S, SOCKP); } },
    socket: { box: () => [-0.9, -1.75, 0.9, 0.35], paint(S, v) { paintSocket(S, v[0], +v[1] / 4, v[2] === '1'); ink(S, [14, 26, 30], 0.6); } },
    crystal: { box: () => [-0.6, -0.65, 0.6, 0.65], paint(S, v) { crystalFacets(S.c, v, 1); ink(S, [12, 22, 34], 0.75); } },
    pedestal: { box: () => [-1.0, -1.35, 1.0, 0.35], paint(S) { paintPedestal(S, 'W'); ink(S, [14, 26, 30], 0.55); } },
    plinth: { box: () => [-0.9, -1.05, 0.9, 0.35], paint(S) { paintPedestal(S, 'E'); ink(S, [14, 26, 30], 0.5); } },
    pit: { box: () => [-2.1, -1.95, 2.1, 1.0], paint(S) { paintPit(S); } },
    drain: { box: () => [-2.2, -1.5, 2.2, 0.3], paint(S) { paintDrain(S, false); } },
    drainS: { box: () => [-2.2, -0.2, 2.2, 1.2], paint(S) { paintDrain(S, true); } },
    cage: { box: () => [-1.2, -2.85, 1.2, 0.5], paint(S, v) { paintCage(S, v); } },
    hungbell: { box: () => [-2.0, -0.2, 2.0, 3.0], paint(S, v) { paintHungBell(S, v === 'c'); } },
    alcove: { box: () => [-2.9, -3.75, 2.9, 0.8], paint(S) { paintAlcove(S); } },
    medal: { box: () => [-1.15, -1.15, 1.25, 1.25], paint(S, v) { paintMedal(S, v[0], +v[1] / 2); } },
    plaque: { box: () => [-1.35, -2.45, 1.35, 0.3], paint(S) { paintPlaque(S); } },
    rib: { box: () => [-0.35, -1.65, 0.35, 0.2], paint(S) { paintRib(S); } },
    pylon: { box: () => [-0.65, -3.0, 0.65, 0.3], paint(S) { paintPillar(S, 0.45, 2.6, false, true); ink(S, [14, 26, 30], 0.5); } },
    gpillar: { box: () => [-0.55, -3.95, 0.55, 0.3], paint(S) { paintPillar(S, 0.31, 3.8, true, false); } },
    leaf: { box: () => [-0.05, -3.6, 2.65, 0.15], paint(S) { paintLeaf(S, 2.55, 3.5); } },
    lintel: { box: () => [-3.6, -0.95, 3.6, 0.2], paint(S) { rbox(S, 0, 0, 3.4, 0.25, 0, 0.8, 0.06, (f, u, v2, ao) => lime(u, v2, ao, 2, 0, 2, { tone: 1.04 }), { floorAO: 0 }); S.unlock(); } },
    doorframe: { box: () => [-3.5, -5.6, 3.5, 0.3], paint(S) { paintDoorFrame(S, 2.3, 4.3, 0.78, 0.95); } },
    doorslab: { box: () => [-0.05, -4.4, 2.4, 0.15], paint(S) { paintLeaf(S, 2.3, 4.3); } },
    wall: { box: v => [-v / 2 - 0.3, -4.1, v / 2 + 0.3, 0.4], paint(S, v) { paintWall(S, v); } },
    housing: { box: () => [-1.1, -1.75, 1.1, 0.35], paint(S) { paintHousing(S); } },
    navecol: { box: v => [-1.0, -4.6, 1.0, 0.4], paint(S, v) { paintColumn(S, 0, 3.3 + (v % 2) * 0.4, v, { broken: false, banded: false, r: 0.46 }); } },
  });

  /* ---- v398 B2: the north gate's crystal (the user: "make the crystal appear in a cage instead, like the east gate"): a
     blue-white spiral cage (ten porcelain bars twisting over half a turn and closing in a dome, blue veins spiralling up them,
     a finial; 'b' the back half, 'f' the front), its own plinth (cool limestone, a blue enamel band with the spiral, brass
     rims, a wet foot), and the archway behind it repainted in 2.5D (lit voussoirs and a keystone, jambs in blocks with
     imposts, the reveals and the soffit giving it depth, a recess fading softly into a cool light, a wet threshold) ---- */
  function porcelain(u, v, ao, sd, vein) { const w = vn(u * 6 + sd, v * 6), f = vn(u * 23, v * 23 + sd); M.r = 0.9 * (0.92 + 0.1 * w); M.g = 0.95 * (0.92 + 0.1 * w); M.b = 1.0 * (0.94 + 0.08 * w); M.rg = 0.26; M.cc = 0.75; M.er = 0.07; M.eg = 0.1; M.eb = 0.15;
    if (vein > 0) { M.r = lerp(M.r, 0.22, vein); M.g = lerp(M.g, 0.5, vein); M.b = lerp(M.b, 0.95, vein); M.er = lerp(M.er, 0.06, vein); M.eg = lerp(M.eg, 0.2, vein); M.eb = lerp(M.eb, 0.45, vein); } if (f > 0.82) M.ao *= 0.9; }
  const NCAGE = { n: 10, rx: 1.0, ry: 0.36, hh: 2.45, dome: 0.62, tw: 1.1 };
  function ncagePt(i, k) { const C = NCAGE, a = i / C.n * TAU + 0.15 + C.tw * k, q = ss(0.8, 1, k), z = k < 0.8 ? C.hh * k / 0.8 : C.hh + C.dome * Math.sin((k - 0.8) / 0.2 * Math.PI / 2), r = k < 0.8 ? C.rx : C.rx * Math.cos((k - 0.8) / 0.2 * Math.PI / 2) * 0.97 + 0.03 * (1 - q);
    return [Math.cos(a) * r, Math.sin(a) * r * C.ry / C.rx - z, Math.sin(a)]; }
  function paintSpiralCage(S, half) { const C = NCAGE, F = half === 'f', N = 40;
    const vein = (kk, i, s) => ss(0.34, 0.47, Math.abs(((kk * 6 + i * 0.37 + s * 0.06) % 1) - 0.5)) * 0.85;
    for (let i = 0; i < C.n; i++) { let run = [], k0 = 0; const flushRun = () => { if (run.length > 1) { const ka = k0, kb = k0 + (run.length - 1) / N; tube(S, run, 0.068 - 0.024 * ka, 0.068 - 0.024 * kb, (t, s, ao) => { const kk = lerp(ka, kb, t); porcelain(t * 3 + i, s, ao, i, vein(kk, i, s)); if (!F) M.ao *= 0.72; }); S.unlock(); } run = []; };
      for (let j = 0; j <= N; j++) { const k = j / N, p = ncagePt(i, k), front = p[2] > 0; if (front === F) { if (!run.length) { k0 = Math.max(0, (j - 1) / N); if (j > 0) { const q = ncagePt(i, (j - 1) / N); run.push([q[0], q[1]]); } else k0 = 0; } run.push([p[0], p[1]]); } else if (run.length) { run.push([p[0], p[1]]); flushRun(); } }
      flushRun(); }
    for (const [z, r0] of [[0, 0.085], [C.hh, 0.06], [C.hh * 0.48, 0.04]]) { const pts = []; for (let k = 0; k <= 28; k++) { const a = (F ? 0 : Math.PI) + k / 28 * Math.PI; pts.push([Math.cos(a) * C.rx, Math.sin(a) * C.ry - z]); }
      tube(S, pts, r0, r0, (t, s, ao) => { porcelain(t * 5, s + z, ao, 3 + z, z === 0 ? ss(0.2, 0.0, Math.abs(s)) * 0.7 : 0.15); if (!F) M.ao *= 0.72; }); S.unlock(); }
    if (F) { const top = -(C.hh + C.dome); ball(S, 0, top - 0.04, 0.13, 0.12, (dx, dy, ao) => porcelain(dx, dy, ao, 7, ss(0.25, 0.05, Math.abs(dx * 0.8 + dy * 0.6 - 0.1)) * 0.8)); S.unlock();
      tube(S, [[0, top - 0.14], [0.01, top - 0.3], [0, top - 0.42]], 0.035, 0.012, (t, s, ao) => porcelain(t, s, ao, 9, 0.6)); S.unlock(); ball(S, 0, top - 0.44, 0.045, 0.045, (dx, dy, ao) => porcelain(dx, dy, ao, 2, 0.3)); S.unlock(); } }
  function paintPlinthN(S) { const sd = 5.3, H = 0.74, R = 0.4; contact(S, 0, 0.04, 0.95, 0.3, 0.6); waterRing(S, 1.15, 0.55);
    rbox(S, 0, 0.02, R * 1.6, R * 1.4, 0, 0.13, 0.04, (f, u, v2, ao) => lime(u, v2, ao, sd, 0, 0.12, { tone: 0.95 })); S.unlock();
    const prof = h => h < 0.05 ? R * 1.35 : h < 0.16 ? R * (1.35 - 0.35 * ss(0.05, 0.16, h)) + 0.035 * Math.sin((h - 0.05) / 0.11 * Math.PI) : h < H - 0.2 ? R * (1 - 0.05 * (h - 0.16)) : h < H - 0.1 ? R * (0.95 + 0.4 * ss(H - 0.2, H - 0.1, h)) : R * 1.4;
    rev(S, 0, -0.12, prof, 0, H, { mat: (u, h, ao) => { const band = h > 0.3 && h < 0.44, rim = Math.abs(h - 0.3) < 0.022 || Math.abs(h - 0.44) < 0.022 || h > H - 0.035;
        if (rim) brass(u, h, ao, sd, ss(0.5, 1, Math.cos(u * 6)) * 0.5); else if (band) { M.r = 0.1; M.g = 0.26; M.b = 0.6; M.rg = 0.22; M.cc = 0.85; M.eb = 0.05; } else { lime(u, h, ao, sd, 0, h + 0.3, { tone: 0.92 }); M.b *= 1.06; } },
      top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const rr = Math.hypot(x / (R * 1.4), ey); lime(x, ey, 1, sd, 0, 1, { tone: 1.02 }); if (rr > 0.82 && rr < 0.9) brass(x, ey, 1, sd, 0.4); } });
    S.unlock(); relief(S.c, 'spiral', 0, -0.12 - 0.37, 0.085, BCOL.N, 0.45); }
  function paintNArch(S) { const c = S.c, aw = 2.1, by = 0.7, zs = 2.45, ry = 1.3, ring = 0.55, hw = 0.32, cy = by - zs, R = R1(398);
    const opening = () => { c.beginPath(); c.moveTo(-aw, by); c.lineTo(-aw, cy); c.ellipse(0, cy, aw, ry, 0, Math.PI, TAU); c.lineTo(aw, by); c.closePath(); };
    contact(S, 0, by + 0.08, aw + hw * 2 + 0.4, 0.5, 0.5);
    // the recess: a soft fall from the light at its foot into the dark under the arch, the back wall's courses faint in it, a wet floor
    c.save(); opening(); c.clip(); const H0 = by - cy + ry;
    let g = c.createLinearGradient(0, cy - ry, 0, by); g.addColorStop(0, '#0A1822'); g.addColorStop(0.45, '#12293A'); g.addColorStop(0.8, '#1C3E4C'); g.addColorStop(1, '#2A5A64'); c.fillStyle = g; c.fillRect(-aw, cy - ry, aw * 2, H0);
    g = c.createRadialGradient(0, by - 1.2, 0.1, 0, by - 1.2, aw * 1.3); g.addColorStop(0, 'rgba(160,210,255,.32)'); g.addColorStop(0.55, 'rgba(110,170,230,.12)'); g.addColorStop(1, 'rgba(110,170,230,0)'); c.fillStyle = g; c.fillRect(-aw, cy - ry, aw * 2, H0);
    c.lineWidth = 0.022; for (let k = 0; k < 7; k++) { const y = by - 0.5 - k * 0.42, a = 0.11 * (1 - k / 8); c.strokeStyle = `rgba(150,200,215,${a})`; c.beginPath(); c.moveTo(-aw, y); c.lineTo(aw, y); c.stroke(); for (let j = -3; j <= 3; j++) { const x = j * 0.62 + (k % 2) * 0.31; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 0.42); c.stroke(); } }
    g = c.createLinearGradient(0, by - 0.6, 0, by); g.addColorStop(0, 'rgba(70,120,130,0)'); g.addColorStop(1, 'rgba(100,160,170,.5)'); c.fillStyle = g; c.fillRect(-aw, by - 0.6, aw * 2, 0.6);
    c.fillStyle = 'rgba(205,240,255,.14)'; c.beginPath(); c.ellipse(0.1, by - 0.2, aw * 0.6, 0.07, 0, 0, TAU); c.fill();
    // the reveals (the right one faces the moon: lit; the left in shadow) and the soffit under the ring, all feathered
    g = c.createLinearGradient(-aw, 0, -aw + 0.42, 0); g.addColorStop(0, 'rgba(4,10,16,.72)'); g.addColorStop(1, 'rgba(4,10,16,0)'); c.fillStyle = g; c.fillRect(-aw, cy - ry, 0.42, H0);
    g = c.createLinearGradient(aw, 0, aw - 0.34, 0); g.addColorStop(0, 'rgba(176,184,170,.7)'); g.addColorStop(1, 'rgba(176,184,170,0)'); c.fillStyle = g; c.fillRect(aw - 0.34, cy, 0.34, by - cy);
    c.beginPath(); c.ellipse(0, cy, aw, ry, 0, Math.PI, TAU); c.ellipse(0, cy + 0.3, aw, ry, 0, TAU, Math.PI, true); c.closePath(); g = c.createLinearGradient(0, cy - ry, 0, cy + 0.3); g.addColorStop(0, 'rgba(84,94,90,.95)'); g.addColorStop(0.6, 'rgba(52,62,62,.7)'); g.addColorStop(1, 'rgba(30,40,44,0)'); c.fillStyle = g; c.fill(); c.save(); c.clip(); grain(c, 0.4); c.restore();
    c.restore();
    // the jambs: three courses of limestone each side, wet and stained at the foot, an impost with a brass band at the springing
    for (const sd of [-1, 1]) { const x = sd * (aw + hw); for (let i = 0; i < 3; i++) { const z0 = i * zs / 3, z1 = z0 + zs / 3 - 0.03; rbox(S, x + (hs(i, sd + 5) - 0.5) * 0.02, by, hw, 0.34, z0, z1, 0.04, (f, u, v2, ao) => lime(u + i * 1.7 + sd, v2, ao, i * 2 + sd + 4, 0.75, f === 't' ? z1 : v2, { tone: 0.9 + 0.12 * hs(i, sd + 3) }), { floorAO: i ? 0.4 : 1 }); S.unlock(); }
      rbox(S, x - sd * 0.04, by, hw + 0.1, 0.38, zs - 0.02, zs + 0.17, 0.04, (f, u, v2, ao) => { lime(u, v2, ao, sd + 9, 0, 2, { tone: 1.04 }); if (f === 'f' && Math.abs(v2 - (zs + 0.07)) < 0.035) brass(u, v2, ao, sd, 0.4); }, { floorAO: 0 }); S.unlock(); }
    // the voussoirs: thirteen wedges round the ring, each its own tone, lit toward the moon, bevelled, the keystone carved with the spiral
    const n = 13, cy2 = cy - 0.17, rx0 = aw, ry0 = ry + 0.02; for (let i = 0; i < n; i++) { const a0 = Math.PI + i / n * Math.PI + 0.008, a1 = Math.PI + (i + 1) / n * Math.PI - 0.008, key = i === 6, rO = ring + (key ? 0.2 : 0) + (hs(i, 2) - 0.5) * 0.04, lt = 0.5 + 0.5 * Math.cos((a0 + a1) / 2 + 2.4), tn = 0.9 + 0.14 * hs(i, 11);
      const inner = [], outer = []; for (let k = 0; k <= 6; k++) { const a = lerp(a0, a1, k / 6); inner.push([Math.cos(a) * rx0, cy2 + Math.sin(a) * ry0]); outer.push([Math.cos(a) * (rx0 + rO), cy2 + Math.sin(a) * (ry0 + rO * 0.92)]); }
      c.beginPath(); inner.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let k = outer.length - 1; k >= 0; k--) c.lineTo(outer[k][0], outer[k][1]); c.closePath();
      g = c.createLinearGradient(outer[3][0], outer[3][1], inner[3][0], inner[3][1]); g.addColorStop(0, `rgb(${Math.round((196 + 46 * lt) * tn)},${Math.round((200 + 44 * lt) * tn)},${Math.round((184 + 40 * lt) * tn)})`); g.addColorStop(0.7, `rgb(${Math.round((158 + 40 * lt) * tn)},${Math.round((164 + 40 * lt) * tn)},${Math.round((150 + 36 * lt) * tn)})`); g.addColorStop(1, `rgb(${Math.round((112 + 30 * lt) * tn)},${Math.round((120 + 30 * lt) * tn)},${Math.round((112 + 28 * lt) * tn)})`); c.fillStyle = g; c.fill();
      c.save(); c.clip(); grain(c, 0.6); if (hs(i, 7) > 0.55) { c.strokeStyle = 'rgba(40,90,70,.4)'; c.lineWidth = 0.03; const m = inner[2 + (i % 3)]; c.beginPath(); c.moveTo(m[0], m[1]); c.quadraticCurveTo(m[0] + 0.04, m[1] + 0.12, m[0] - 0.01, m[1] + 0.3); c.stroke(); } c.restore();
      c.strokeStyle = 'rgba(30,58,60,.85)'; c.lineWidth = 0.032; c.stroke();
      c.strokeStyle = `rgba(255,255,246,${0.3 + 0.35 * lt})`; c.lineWidth = 0.022; c.beginPath(); outer.forEach((p, k) => k ? c.lineTo(p[0], p[1] + 0.02) : c.moveTo(p[0], p[1] + 0.02)); c.stroke();
      c.strokeStyle = 'rgba(12,24,28,.5)'; c.lineWidth = 0.03; c.beginPath(); inner.forEach((p, k) => k ? c.lineTo(p[0], p[1] - 0.015) : c.moveTo(p[0], p[1] - 0.015)); c.stroke();
      if (key) relief(c, 'spiral', (inner[3][0] + outer[3][0]) / 2, (inner[3][1] + outer[3][1]) / 2 - 0.02, 0.17, BCOL.N, 0.35); }
    // the threshold: a worn step across the opening, wet; the puddle in front, drips and weed on the jambs' feet, glints
    rbox(S, 0, by + 0.32, aw + 0.12, 0.3, 0, 0.12, 0.04, (f, u, v2, ao) => lime(u * 1.3, v2, ao, 13, 0, 0.05, { tone: 1.0, fresh: true }), { floorAO: 0.6 }); S.unlock();
    c.save(); c.translate(0, by + 0.5); waterRing(S, 2.2, 0.6); c.restore();
    c.save(); c.lineCap = 'round'; for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const x = sd * (aw + hw) + (R() - 0.5) * hw * 1.4, y0 = by - zs * (0.3 + R() * 0.6), len = 0.3 + R() * 0.6; c.strokeStyle = 'rgba(20,40,46,.32)'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(x, y0); c.lineTo(x + (R() - 0.5) * 0.04, y0 + len); c.stroke(); c.strokeStyle = 'rgba(220,250,250,.22)'; c.lineWidth = 0.012; c.beginPath(); c.moveTo(x + 0.012, y0); c.lineTo(x + 0.012, y0 + len * 0.7); c.stroke(); }
      c.strokeStyle = 'rgba(30,78,56,.75)'; c.lineWidth = 0.035; for (let i = 0; i < 10; i++) { const sd = i % 2 ? 1 : -1, x = sd * (aw + hw) + (R() - 0.5) * hw * 1.8; c.beginPath(); c.moveTo(x, by - 0.02); c.quadraticCurveTo(x + 0.04, by - 0.12, x - 0.02, by - 0.18 - R() * 0.16); c.stroke(); } c.restore();
    glint(c, -aw - hw * 0.4, by - 0.08, 0.16, 0.55); glint(c, aw + hw * 0.5, by - 0.12, 0.12, 0.45); glint(c, 0.6, by + 0.42, 0.14, 0.5);
    ink(S, [14, 26, 30], 0.45); }
  Object.assign(DEF, {
    ncage: { box: () => [-1.35, -3.65, 1.35, 0.55], paint(S, v) { paintSpiralCage(S, v); } },
    nplinth: { box: () => [-1.3, -1.05, 1.3, 0.55], paint(S) { paintPlinthN(S); ink(S, [14, 26, 30], 0.5); } },
    narch: { box: () => [-3.15, -4.35, 3.15, 1.35], paint(S) { paintNArch(S); } },
  });

  /* ======================= the cache and the drawing ======================= */
  const SPR = new Map(); let budT = 0, budMs = 0; const STATS = { painted: 0, paintMs: 0, draws: 0, fallbacks: 0 };
  function paint(name, v, P) { const D = DEF[name]; const b = D.box(v), t0 = now(); const S = surface(b[0], b[1], b[2], b[3], P); LT = LIGHTS[D.light] || LIGHTS.bel; try { D.paint(S, v); S.unlock(); } catch (e) { LT = LIGHTS.bel; if (typeof console !== 'undefined') console.warn('BELPROPS', name, e); return null; } LT = LIGHTS.bel;   /* v398 PR: (its light) */
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  function sprite(name, v, P, force) { if (!DEF[name] || !(P > 2)) return null; const key = name + '|' + v + '|' + P; let s = SPR.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 14) return null;   // (a painting budget: what does not fit waits a frame)
    s = paint(name, v, P); if (!s) return null; if (SPR.size > 160) SPR.clear(); SPR.set(key, s); return s; }
  const qP = P => Math.max(8, Math.round(Math.exp(Math.round(Math.log(P) * 10) / 10)));   // (steps of ~10%: a gliding camera does not repaint every frame)
  let BASE = 0;   // (the floor's sprite sharpness, TS x SK, set by the loading warm-up: a zoomed-out camera draws the pictures made for it, never paints mid-play)
  function draw(c, name, v, Xs, Ys, T, o) {
    if (off() || !DEF[name]) return false; o = o || {}; const m = c.getTransform ? c.getTransform() : null, dpr = Math.min(2, m ? Math.max(0.5, Math.hypot(m.a, m.b)) : 1), sc = o.s || 1;   // (sharpness capped at 2, as the engine's own props: SK)
    let P = qP(T * sc * dpr * (o.res || 1)); if (BASE && sc === 1 && P <= BASE * 1.1) P = BASE;
    let s = sprite(name, v, P); if (!s) { const pre = name + '|' + v + '|'; for (const [k, s2] of SPR) if (k.startsWith(pre)) { s = s2; break; } if (!s) { STATS.fallbacks++; return false; } }
    const f = T * sc / s.P; STATS.draws++; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    if (o.rot) { c.translate(Xs, Ys); c.rotate(o.rot); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); } else c.drawImage(s.cv, Xs - s.ax * f, Ys - s.ay * f, s.cv.width * f, s.cv.height * f);
    c.restore(); return true; }
  /* a picture by its size: a crystal's height s px about its centre (crystalArt's own size) */
  function fit(c, name, v, x, y, s) { if (off() || !DEF[name]) return false; return draw(c, name, v, x, y, s); }   // (the crystals: their picture's origin is their centre, 1 tile = their height)

  /* ---- more pieces: the foundry's dressing as standing props (breakable through the engine), the hall's pillars, the arenas' urns ---- */
  Object.assign(DEF, {
    platform: { box: v => { const [w, h] = v.split('x').map(Number); return [-0.2, -0.25, w + 0.9, h + 0.85]; }, paint(S, v) { const [w, h] = v.split('x').map(Number); paintPlatform(S, w, h); } },
    belfoundmould: { box: () => [-1.15, -2.0, 1.15, 0.45], paint(S, v) { contact(S, 0, 0.04, 1.05, 0.34, 0.6); paintMould(S, 0, 0, 0.9, v + 1); ink(S, [14, 22, 24], 0.5); } },
    belfoundhalf: { box: v => DEF.belhalf.box(v), paint(S, v) { DEF.belhalf.paint(S, v); ink(S, [14, 22, 24], 0.5); } },
    belhung: { box: () => [-2.0, -9.6, 2.0, 0.5], paint(S, v) {   // a hung bell as a standing prop: its floor shadow, the chain into the dark, the bell 4.6 tiles up
      contact(S, 0.1, 0.12, 1.6, 0.45, 0.32); const c = S.c, top = -4.6 - 1.6; c.save(); const g = c.createLinearGradient(0, top - 3.4, 0, top); g.addColorStop(0, 'rgba(42,30,18,0)'); g.addColorStop(1, 'rgba(42,30,18,1)'); c.strokeStyle = g; c.lineWidth = 0.1; c.beginPath(); c.moveTo(0, top - 3.4); c.lineTo(0, top + 0.05); c.stroke();
      for (let i = 0; i < 12; i++) { const y = top - 3.3 + i * 0.28; c.strokeStyle = `rgba(150,130,100,${0.15 + 0.6 * i / 12})`; c.lineWidth = 0.03; c.beginPath(); c.ellipse(0, y, 0.06, 0.13, 0, 0, TAU); c.stroke(); } c.restore();
      const S2 = { __proto__: S, ay: S.ay + top * S.P }; /* (the same picture, its origin at the pivot: the per-pixel primitives read ay) */ paintHungBell(S2, v % 2 === 1); S.unlock(); fadeTop(S, top - 3.4, top - 1.2); } },
    belpillar: { box: () => [-1.0, -5.0, 1.0, 0.45], paint(S, v) { contact(S, 0, 0.03, 0.8, 0.26, 0.55); paintColumn(S, 0, 3.7 + (v % 2) * 0.3, v + 5, { broken: false, banded: v % 2 === 0, r: 0.44 }); fadeTop(S, -4.6, -3.0); } },
    urn: { box: () => [-0.7, -1.45, 0.7, 0.35], paint(S, v) {   // a drowned urn: a bronze-banded clay jar, barnacled, its lip chipped
      contact(S, 0, 0.03, 0.55, 0.18, 0.55); const pr = h => { const t = h / 1.0; return 0.22 + 0.2 * Math.sin(Math.min(1, t * 1.2) * Math.PI) + (t > 0.86 ? 0.06 : 0) - (t > 0.78 && t < 0.86 ? 0.06 : 0); };
      rev(S, 0, 0, pr, 0, 1.0, { mat: (u, h, ao) => { if (Math.abs(h - 0.55) < 0.05) bronze(u, h, ao, v, 0.4); else { clay(u, h, ao, v + 2); M.r *= 0.95; M.g *= 0.9; } }, top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const rr = Math.hypot(x / pr(1), ey); if (rr < 0.7) { M.r = 0.03; M.g = 0.03; M.b = 0.03; } else clay(x, ey, 1, v); } });
      S.unlock(); for (let i = 0; i < 6; i++) { const a = 0.5 + i * 0.4; ball(S, Math.cos(a) * 0.36, -0.22 - hs(i, v) * 0.2 + Math.sin(a) * 0.1, 0.04, 0.035, (dx, dy, ao) => { M.r = 0.62; M.g = 0.62; M.b = 0.56; M.rg = 0.7; M.ao = ao * (Math.hypot(dx, dy) < 0.4 ? 0.35 : 1); }); } S.unlock(); ink(S, [14, 22, 24], 0.5); } },
    bellfrag: { box: () => [-1.0, -1.3, 1.0, 0.35], paint(S, v) {   // a shard of bronze bell lying on the floor: a curved piece with its band and a bright break
      contact(S, 0, 0.04, 0.8, 0.22, 0.55); S.unlock(); const S2 = { __proto__: S }; paintBell(S2, 0, 0.1, 0.7, 0.62, { half: v % 2 ? 1 : -1, sd: v * 3.1 + 2, noCrown: true }); ink(S, [14, 22, 24], 0.5); } },
    lamppost: { box: v => DEF.bellamp.box(v), paint(S, v) { DEF.bellamp.paint(S, v); } },
    wallseg: { box: () => [-0.05, -4.1, 4.85, 0.4], paint(S) { paintWall(S, 4.8, 2.4); } },
    seaglass: { box: () => [-0.8, -1.25, 0.8, 0.35], paint(S, v) {   // a growth of sea glass on a wet stone: three faceted clusters, lit from within
      contact(S, 0, 0.03, 0.6, 0.2, 0.55); ball(S, 0, -0.06, 0.5, 0.2, (dx, dy, ao) => { wetstone(dx, dy, ao, v); M.ao = ao; }); S.unlock(); const c = S.c;
      for (const [x, y, a, sz] of [[-0.25, -0.35, -0.35, 0.55], [0.22, -0.32, 0.3, 0.5], [0, -0.5, 0, 0.75]]) { c.save(); c.translate(x, y); c.rotate(a); crystalFacets(c, 'G', sz); c.restore(); } ink(S, [8, 30, 34], 0.5); } },   // (the nave's north wall in 4.8-tile bays, laid side by side)
    glassurn: { box: () => [-0.7, -1.75, 0.7, 0.35], paint(S, v) {   // Uldroth's urns: a sea-glass vessel lit from inside, brass bands, on a little stone plinth
      contact(S, 0, 0.03, 0.5, 0.17, 0.55); rev(S, 0, 0, h => 0.32 - 0.1 * h / 0.5 + (h > 0.44 ? 0.04 : 0), 0, 0.5, { mat: (u, h, ao) => lime(u, h, ao, v, 0.3, h, { tone: 0.75 }), top: true, capMat: (x, h, ao) => lime(x, 3, 1, v, 0, 1, { tone: 0.9 }) });
      const gp = h => 0.3 * Math.sqrt(Math.max(0, 1 - ((h - 0.48) / 0.48) ** 2)), band = h => Math.abs(h - 0.15) < 0.04 || Math.abs(h - 0.48) < 0.035 || Math.abs(h - 0.81) < 0.04;
      rev(S, 0, -0.47, h => gp(h) + (band(h) ? 0.025 : 0), 0, 0.96, { mat: (u, h, ao) => { if (band(h)) { brass(u, h, ao, v, 0.4); return; } const w = vn(u * 9 + v, h * 9); M.r = 0.1 + 0.18 * w; M.g = 0.5 + 0.3 * w; M.b = 0.48 + 0.26 * w; M.rg = 0.12; M.cc = 0.9; const k = 0.4 + 0.6 * (1 - Math.abs(u) * 2.2); M.er = 0.06 * k; M.eg = 0.42 * k; M.eb = 0.38 * k; M.ao = 1; }, floorAO: 0 }); S.unlock(); ink(S, [10, 24, 26], 0.5); } },
  });

  /* ======================= v394 PR: the three dungeons' own props (20n9b-belfry-themes.js picks them) =======================
     D2, the Bell Foundry Undercroft: chains hung from the dark, anvils, crucibles of molten bronze, steam vents, iron cages,
     casting pits, braziers. D3, the Storm Galleries: broken statues and their fallen heads, torn banners, bell-rope rigging,
     swinging lanterns, rope-bound bollards. And any prop graded for a dungeon: 'kind@d2' (soot, a warm forge light from below)
     or 'kind@d3' (rain-dark, cold, streaked, a puddle at its foot) */
  function rope(u, v, ao, sd) { const tw = Math.abs(((u * 2.2 + v * 9 + sd) % 1 + 1) % 1 - 0.5), w = vn(u * 9 + sd, v * 9); M.r = 0.42 * (0.75 + 0.35 * w); M.g = 0.33 * (0.75 + 0.35 * w); M.b = 0.21 * (0.75 + 0.35 * w); M.rg = 0.85; if (tw < 0.12) M.ao *= 0.6; }
  function molten(x, y, ao, sd, k) { const w = fbm(x * 5 + sd, y * 5), crust = ss(0.55, 0.75, vn(x * 7 + 3, y * 7 + sd)) * (k == null ? 1 : k); M.mt = 0; M.r = lerp(1, 0.08, crust); M.g = lerp(0.55, 0.05, crust); M.b = lerp(0.15, 0.03, crust); M.rg = 0.4; M.er = lerp(1.6 + 0.6 * w, 0.05, crust); M.eg = lerp(0.6 + 0.4 * w, 0.02, crust); M.eb = lerp(0.12, 0, crust); M.ao = 1; }
  const linkChain = (S, x, y0, y1, r, sd) => { const n = Math.max(2, Math.round((y1 - y0) / (r * 2.6))); for (let i = 0; i < n; i++) { const y = y0 + (i + 0.5) * (y1 - y0) / n, side = (i + sd) % 2; if (side) tube(S, [[x, y - r * 1.25], [x, y + r * 1.25]], r * 0.32, r * 0.32, (t, s, ao) => iron(t + i, s, ao, sd + i)); else { const p = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU; p.push([x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 1.25]); } tube(S, p, r * 0.24, r * 0.24, (t, s, ao) => iron(t * 3 + i, s, ao, sd + i)); } } S.unlock(); };
  function grade(S, key) {   // a prop dressed for a dungeon: its own picture, re-lit
    const c = S.c, w = S.w, h = S.h, src = mkc(w, h); src.getContext('2d').drawImage(S.cv, 0, 0); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (key === 'd2') { c.globalCompositeOperation = 'multiply'; const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5E5650'); g.addColorStop(0.55, '#A69A8E'); g.addColorStop(1, '#D8B49A'); c.fillStyle = g; c.fillRect(0, 0, w, h);   // (soot from above, the forge's warmth below)
      c.globalCompositeOperation = 'destination-in'; c.drawImage(src, 0, 0); c.globalCompositeOperation = 'source-atop'; const g2 = c.createRadialGradient(w * 0.75, h, 0, w * 0.75, h, h * 0.9); g2.addColorStop(0, 'rgba(255,120,40,.32)'); g2.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g2; c.globalCompositeOperation = 'lighter'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'destination-in'; c.drawImage(src, 0, 0); }
    else { c.globalCompositeOperation = 'multiply'; c.fillStyle = '#8B90A8'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'destination-in'; c.drawImage(src, 0, 0);   // (rain-dark, cold)
      c.globalCompositeOperation = 'source-atop'; const R = R1(w * 7 + h); c.lineCap = 'round'; for (let i = 0; i < w * h / 900; i++) { const x = R() * w, y = R() * h, l = S.P * (0.15 + R() * 0.45); c.strokeStyle = `rgba(215,225,255,${0.12 + R() * 0.22})`; c.lineWidth = Math.max(1, S.P * 0.012); c.beginPath(); c.moveTo(x, y); c.lineTo(x - l * 0.05, y + l); c.stroke(); }   // (rain running down it)
      const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(190,180,255,.16)'); g.addColorStop(0.3, 'rgba(190,180,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'destination-over'; const px = S.ax, py = S.ay, pr = S.P * 0.95, pg = c.createRadialGradient(px, py, 0, px, py, pr); pg.addColorStop(0, 'rgba(140,130,190,.5)'); pg.addColorStop(0.7, 'rgba(60,64,96,.4)'); pg.addColorStop(1, 'rgba(60,64,96,0)'); c.translate(px, py); c.scale(1, 0.32); c.translate(-px, -py); c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill(); }   // (a puddle at its foot)
    c.restore(); S.T(); }
  Object.assign(DEF, {
    belchains: { box: () => [-0.9, -6.4, 0.9, 0.45], paint(S, v) {   // chains hung from the dark ceiling, a cargo hook and an iron weight swinging low
      contact(S, 0, 0.04, 0.55, 0.18, 0.4); const two = v % 2 === 0; for (const [x, y1] of two ? [[-0.25, -1.55], [0.28, -2.3]] : [[0, -1.4]]) { linkChain(S, x, -6.3, y1, 0.09, v); tube(S, [[x, y1 - 0.05], [x, y1 + 0.3], [x - 0.12, y1 + 0.45], [x - 0.22, y1 + 0.3]], 0.05, 0.035, (t, s, ao) => iron(t * 2, s, ao, v + 3)); }
      rbox(S, two ? -0.25 : 0, -0.7, 0.2, 0.15, 0, 0.42, 0.05, (f, u, v2, ao) => iron(u * 4, v2 * 4, ao, v + 7)); S.unlock(); rivets(S, [[two ? -0.36 : -0.11, -1.0], [two ? -0.14 : 0.11, -1.0]], 0.025, 'iron'); fadeTop(S, -6.4, -4.4); } },
    belanvil: { box: () => [-0.9, -1.35, 0.9, 0.4], paint(S, v) {   // an anvil on an oak stump: a polished face, a tapering horn, a hardy hole
      contact(S, 0, 0.04, 0.7, 0.22, 0.6); rev(S, 0, 0, h => 0.36 + (h < 0.08 ? 0.04 : 0), 0, 0.55, { mat: (u, h, ao) => wood(u * 2, h * 0.6, ao, v), top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const rr = Math.hypot(x / 0.36, ey); M.r = 0.36; M.g = 0.25; M.b = 0.14; M.rg = 0.7; if (Math.abs(((rr * 6) % 1) - 0.5) < 0.08) M.ao = 0.7; } });
      rbox(S, 0.05, -0.55, 0.2, 0.14, 0, 0.3, 0.05, (f, u, v2, ao) => iron(u * 4, v2 * 4, ao, v)); S.unlock(); rbox(S, 0.05, -0.55, 0.42, 0.17, 0.3, 0.5, 0.05, (f, u, v2, ao) => { iron(u * 3, v2 * 3, ao, v + 2); if (f === 't') { M.mt = 1; M.fr = M.fg = M.fb = 0.75; M.rg = 0.18; } }); S.unlock();
      tube(S, [[-0.37, -1.0], [-0.55, -1.0], [-0.7, -0.95]], 0.09, 0.02, (t, s, ao) => { iron(t, s, ao, v + 4); if (s > 0.5) { M.mt = 1; M.fr = M.fg = M.fb = 0.7; M.rg = 0.2; } }); S.unlock(); ink(S, [12, 18, 20], 0.5); } },
    belcrucible: { box: () => [-0.9, -1.6, 0.9, 0.4], paint(S, v) {   // a clay crucible of molten bronze in an iron cradle on three legs
      contact(S, 0, 0.04, 0.7, 0.22, 0.55); for (const a of [-0.45, 0.45, 0]) tube(S, [[a * 0.8, 0.05 - (a ? 0 : 0.08)], [a * 0.35, -0.55]], 0.04, 0.035, (t, s, ao) => iron(t * 3 + a, s, ao, v));
      rev(S, 0, -0.4, h => 0.3 + 0.12 * Math.sin(Math.min(1, h / 0.7) * Math.PI * 0.8) + (h > 0.7 ? 0.03 : 0), 0, 0.78, { mat: (u, h, ao) => { if (Math.abs(h - 0.25) < 0.05) iron(u * 3, h, ao, v); else clay(u, h, ao, v + 2); if (h > 0.6) { M.er = 0.2 * (h - 0.6) * 5; M.eg = 0.06 * (h - 0.6) * 5; } }, top: true,
        capMat: (x, h, ao, i, ph, x2, ey) => { const rr = Math.hypot(x / 0.33, ey); if (rr < 0.82) molten(x, ey, 1, v, 0.6); else clay(x, ey, 1, v); } });
      S.unlock(); ink(S, [14, 10, 8], 0.5); } },
    belsteamvent: { box: () => [-1.0, -2.3, 1.0, 0.4], paint(S, v) {   // a brass vent elbow out of the floor grate, a valve, steam leaking
      const c = S.c; contact(S, 0, 0.04, 0.7, 0.22, 0.5); rbox(S, 0, 0.05, 0.55, 0.3, 0, 0.06, 0.02, (f, u, v2, ao) => { iron(u * 6, v2 * 6, ao, v); if (Math.abs(((u * 6) % 1) - 0.5) > 0.38) M.ao *= 0.4; }); S.unlock();
      rev(S, -0.2, -0.05, h => (h < 0.08 || Math.abs(h - 0.55) < 0.05) ? 0.2 : 0.15, 0, 0.75, { mat: (u, h, ao) => brass(u, h, ao, v, ss(0.6, 1, Math.cos(u * 8)) * 0.4) }); tube(S, [[-0.2, -0.82], [-0.15, -1.0], [0.1, -1.08], [0.35, -1.05]], 0.15, 0.14, (t, s, ao) => brass(t * 2, s, ao, v + 1, 0.3 * (1 - Math.abs(s))));
      const ring = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * TAU; ring.push([0.12 + Math.cos(a) * 0.17, -0.45 + Math.sin(a) * 0.17]); } tube(S, ring, 0.03, 0.03, (t, s, ao) => iron(t * 5, s, ao, 2, true)); S.unlock();
      c.save(); const R = R1(29 + v); for (let i = 0; i < 9; i++) { const u = i / 9, x = 0.42 + u * 0.3 + (R() - 0.5) * 0.2, y = -1.1 - u * 1.0, r = 0.12 + u * 0.32, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(235,240,240,${0.42 * (1 - u * 0.7)})`); g.addColorStop(1, 'rgba(235,240,240,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); } c.restore(); } },
    belcage: { box: () => [-1.0, -2.3, 1.0, 0.45], paint(S, v) {   // an iron cage: a riveted floor plate, a ring at the top, bars, a padlocked door, rust
      contact(S, 0, 0.05, 0.85, 0.28, 0.55); const rx = 0.62, ry = 0.21, hh = 1.75; rev(S, 0, 0.0, () => rx + 0.06, 0, 0.1, { mat: (u, h, ao) => iron(u * 3, h * 3, ao, v), top: true, capMat: (x, h, ao) => { iron(x * 3, 5, 1, v); M.ao = 0.75; } });
      const bars = n => { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.15, front = Math.sin(a) > 0; if (front !== n) continue; const x = Math.cos(a) * rx, y = -0.1 + Math.sin(a) * ry; tube(S, [[x, y], [x * 0.92, y - hh]], 0.035, 0.035, (t, s, ao) => { iron(t * 4 + i, s, ao, i + v); M.ao *= front ? 1 : 0.6; }); } S.unlock(); };
      bars(false); rev(S, 0, -0.1 - hh + 0.05, () => rx * 0.94, 0, 0.12, { mat: (u, h, ao) => iron(u * 3, h * 3 + 2, ao, v + 1), top: true, capMat: (x, h, ao) => { iron(x * 3, 6, 1, v); M.ao = 0.7; }, floorAO: 0 }); bars(true);
      tube(S, [[0, -0.1 - hh - 0.07], [0, -0.1 - hh - 0.35]], 0.03, 0.03, (t, s, ao) => iron(t, s, ao, 3)); const rr = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU; rr.push([Math.cos(a) * 0.12, -0.1 - hh - 0.47 + Math.sin(a) * 0.12]); } tube(S, rr, 0.03, 0.03, (t, s, ao) => iron(t * 3, s, ao, 5));
      rbox(S, 0.12, -0.32, 0.07, 0.03, 0.55, 0.7, 0.02, (f, u, v2, ao) => brass(u, v2, ao, 4, 0.3), { floorAO: 0 }); S.unlock(); ink(S, [12, 16, 18], 0.45); } },
    belcastpit: { box: () => [-1.3, -0.8, 1.3, 0.75], paint(S, v) {   // a casting pit in the floor: an iron-bound stone kerb, molten bronze inside under a skin of crust, a sprue
      const c = S.c, rx = 0.9, ry = 0.36, cy = 0.05; c.save(); c.beginPath(); c.ellipse(0, cy, rx, ry, 0, 0, TAU); c.clip(); S.unlock(); S.lock(); const P = S.P;
      for (let py = Math.floor(S.ay + (cy - ry) * P); py < S.ay + (cy + ry) * P; py++) for (let px = Math.floor(S.ax - rx * P); px < S.ax + rx * P; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, e = (x / rx) ** 2 + ((y - cy) / ry) ** 2; if (e > 1 || px < 0 || py < 0 || px >= S.w || py >= S.h) continue; M0(); molten(x * 1.3, y * 2.4, 1, v, 0.75); shade(0, 0.3, 0.95); put(S, px, py, clamp((1 - e) * 20, 0, 1)); } S.unlock(); c.restore();
      for (let i = 0; i < 12; i++) { const a0 = i / 12 * TAU, a1 = a0 + TAU / 12 - 0.05, lt = 0.55 + 0.45 * Math.cos((a0 + a1) / 2 + 2.3); c.beginPath(); c.ellipse(0, cy, rx + 0.28, ry + 0.13, 0, a0, a1); c.ellipse(0, cy, rx, ry, 0, a1, a0, true); c.closePath(); c.fillStyle = `rgb(${Math.round(70 + 50 * lt)},${Math.round(74 + 48 * lt)},${Math.round(76 + 44 * lt)})`; c.fill(); c.save(); c.clip(); grain(c, 0.5); const og = c.createLinearGradient(0, cy - ry, 0, cy + ry * 2); og.addColorStop(0, 'rgba(255,140,50,.35)'); og.addColorStop(1, 'rgba(255,140,50,0)'); c.fillStyle = og; c.globalCompositeOperation = 'lighter'; c.fillRect(-2, -1, 4, 2); c.restore(); c.strokeStyle = 'rgba(20,22,24,.9)'; c.lineWidth = 0.025; c.stroke(); }
      c.strokeStyle = '#2A2C30'; c.lineWidth = 0.05; c.beginPath(); c.ellipse(0, cy, rx + 0.3, ry + 0.15, 0, 0, TAU); c.stroke(); rivets(S, [0.3, 1.0, 1.9, 2.6].map(a => [Math.cos(a) * (rx + 0.15), cy + Math.sin(a) * (ry + 0.07)]), 0.035, 'iron'); S.unlock() } },
    belbrazier: { box: () => [-0.85, -2.2, 0.85, 0.4], paint(S, v) {   // an iron brazier on three legs, glowing coals, a tongue of flame
      const c = S.c; contact(S, 0, 0.04, 0.55, 0.18, 0.55); for (const a of [-0.32, 0.32, 0]) tube(S, [[a, 0.02 - (a ? 0 : 0.06)], [a * 0.5, -0.9]], 0.04, 0.035, (t, s, ao) => iron(t * 3 + a, s, ao, v));
      rev(S, 0, -0.85, h => 0.18 + 0.25 * Math.sqrt(h / 0.35), 0, 0.35, { mat: (u, h, ao) => { iron(u * 3, h * 3, ao, v + 2); M.er = 0.25 * h * 3; M.eg = 0.08 * h * 3; }, top: true, capMat: (x, h, ao, i, ph, x2, ey) => { molten(x * 2.5, ey * 2, 1, v + 5, 0.45); M.r *= 0.7; M.er *= 0.8; } });
      S.unlock(); c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const x = (i - 1) * 0.12, h = 0.55 + (i === 1 ? 0.35 : 0.1), g = c.createRadialGradient(x, -1.25 - h * 0.35, 0, x, -1.25 - h * 0.35, h * 0.6); g.addColorStop(0, 'rgba(255,240,180,.9)'); g.addColorStop(0.4, 'rgba(255,150,50,.6)'); g.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 0.14, -1.2); c.quadraticCurveTo(x - 0.1, -1.2 - h * 0.6, x, -1.2 - h); c.quadraticCurveTo(x + 0.1, -1.2 - h * 0.6, x + 0.14, -1.2); c.closePath(); c.fill(); } c.restore(); } },
    belstatue: { box: () => [-1.0, -3.3, 1.0, 0.45], paint(S, v) {   // a broken statue of a robed bell-keeper on its plinth: the head gone, one arm snapped, rain on it
      contact(S, 0, 0.04, 0.85, 0.28, 0.6); rbox(S, 0, 0.02, 0.62, 0.45, 0, 0.45, 0.05, (f, u, v2, ao) => lime(u, v2, ao, v, 0.25, f === 't' ? 0.45 : v2, { tone: 0.82 })); S.unlock();
      const H = 2.15, prof = h => h < 0.1 ? 0.48 : h < H * 0.75 ? 0.46 - 0.18 * (h / (H * 0.75)) : h < H * 0.86 ? 0.3 + 0.08 * Math.sin((h - H * 0.75) / (H * 0.11) * Math.PI * 0.5) : 0.38 - 0.2 * ss(H * 0.86, H, h);
      rev(S, 0, -0.45, prof, 0, H, { mat: (u, h, ao, ins, phi) => { lime(u, h, ao, v + 3, 0.3, h, { tone: 0.88 }); const f = Math.cos(phi * 9 + Math.sin(h * 3) * 0.6); if (h < H * 0.75) M.ao *= 0.8 + 0.2 * f; }, top: true, capMat: (x, h, ao) => lime(x * 3, 7, 1, v, 0, 1, { fresh: true }), bump: 0.06 });
      tube(S, [[-0.36, -0.45 - H * 0.82], [-0.5, -0.45 - H * 0.6], [-0.44, -0.45 - H * 0.47]], 0.11, 0.09, (t, s, ao) => lime(t * 2, s, ao, v + 5, 0, 2, { tone: 0.86 })); tube(S, [[0.36, -0.45 - H * 0.82], [0.5, -0.45 - H * 0.72]], 0.11, 0.1, (t, s, ao) => lime(t * 2, s, ao, v + 6, 0, 2, { tone: 0.86 }));
      S.unlock(); ball(S, -0.4, -0.45 - H * 0.44, 0.1, 0.09, (dx, dy, ao) => lime(dx, dy, ao, v, 0, 2, {})); S.unlock(); ink(S, [14, 18, 24], 0.5); } },
    belstatuehead: { box: () => [-0.9, -0.95, 0.9, 0.4], paint(S, v) {   // the statue's fallen head and rubble
      contact(S, 0, 0.04, 0.7, 0.22, 0.55); ball(S, 0.05, -0.35, 0.36, 0.38, (dx, dy, ao) => { lime(dx * 2, dy * 2, ao, v, 0, 1, { tone: 0.9 }); if (dy > -0.1 && dy < 0.05 && Math.abs(dx + 0.25) < 0.12) M.ao *= 0.5; if (dy > -0.1 && dy < 0.05 && Math.abs(dx - 0.25) < 0.12) M.ao *= 0.5; if (dy > 0.3 && Math.abs(dx) < 0.25) M.ao *= 0.7; });
      for (let i = 0; i < 4; i++) { const x = (hs(i, v) - 0.5) * 1.3, s = 0.08 + hs(i + 4, v) * 0.1; rbox(S, x, 0.12, s, s * 0.8, 0, s * 1.1, s * 0.4, (f, u, v2, ao) => lime(u + i, v2, ao, i, 0, 1, { fresh: f === 't' })); S.unlock(); } ink(S, [14, 18, 24], 0.45); } },
    belbanner: { box: () => [-1.0, -3.6, 1.2, 0.4], paint(S, v) {   // a torn banner on an iron pole: the Belfry's teal with its bell, wind-lashed, soaked
      const c = S.c; contact(S, 0, 0.04, 0.45, 0.15, 0.55); rev(S, -0.45, 0, h => h < 0.15 ? 0.14 : 0.045, 0, 3.3, { mat: (u, h, ao) => iron(u * 3, h, ao, v), top: true, capMat: () => brass(0, 0, 1, v, 0.5) }); S.unlock(); tube(S, [[-0.5, -3.2], [0.85, -3.25]], 0.035, 0.035, (t, s, ao) => iron(t * 4, s, ao, v + 1)); S.unlock();
      const R = R1(5 + v), pts = [[-0.42, -3.18], [0.82, -3.22]]; let x = 0.8, y = -3.2; for (let i = 0; i < 7; i++) { y += 0.28 + R() * 0.1; x = 0.8 - Math.sin(i * 0.9) * 0.08 + (R() - 0.5) * 0.06; pts.push([x, y]); } const bot = y; for (let i = 0; i < 9; i++) { const u = i / 8; pts.push([0.8 - u * 1.22, bot + (i % 2 ? -0.25 - R() * 0.3 : 0.05 + R() * 0.1) * (u > 0.1 ? 1 : 0.3)]); } for (let i = 0; i < 6; i++) pts.push([-0.42 + Math.sin(i * 1.3) * 0.03, bot - i * (bot + 3.18) / 6]);
      c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); const g = c.createLinearGradient(-0.42, 0, 0.82, 0); for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, i % 2 ? '#174A4E' : '#24676A'); c.fillStyle = g; c.fill(); c.save(); c.clip(); grain(c, 0.45); const sg = c.createLinearGradient(0, -3.2, 0, bot); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(8,16,24,.45)'); c.fillStyle = sg; c.fillRect(-1, -3.3, 2.2, 3.3);
      c.strokeStyle = 'rgba(217,179,95,.85)'; c.lineWidth = 0.03; c.strokeRect(-0.34, -3.1, 1.08, bot + 2.9); relief(c, 'shield', 0.2, -2.35, 0.24, ['#D9B35F', '#FFE9B0', '#7A5A28', 'shield'], 0); c.restore(); c.strokeStyle = 'rgba(8,20,24,.8)'; c.lineWidth = 0.025; c.stroke(); } },
    belrigging: { box: () => [-1.2, -4.3, 1.2, 0.45], paint(S, v) {   // a bell-rope mast: an oak post bound in iron, a pulley block, ropes running up into the storm, a coil at its foot
      contact(S, 0, 0.04, 0.6, 0.2, 0.55); rev(S, 0, 0, h => 0.16 - 0.02 * h / 3.8 + ((Math.abs(h - 1.2) < 0.05 || Math.abs(h - 2.6) < 0.05) ? 0.025 : 0), 0, 3.8, { mat: (u, h, ao) => { if (Math.abs(h - 1.2) < 0.05 || Math.abs(h - 2.6) < 0.05) iron(u * 3, h, ao, v); else wood(u * 2, h * 0.5, ao, v); }, top: true, capMat: (x) => wood(x, 9, 1, v) });
      for (const [x1, y1] of [[1.1, -4.3], [-1.1, -4.2], [0.6, -4.3]]) tube(S, [[0, -3.3], [x1 * 0.5, -3.8 + (x1 > 0 ? 0.05 : 0.08)], [x1, y1]], 0.025, 0.02, (t, s, ao) => rope(t * 4, s, ao, x1)); rbox(S, 0.05, -2.95, 0.1, 0.07, 0, 0.26, 0.04, (f, u, v2, ao) => wood(u * 4, v2 * 4, ao, v + 2), { floorAO: 0 }); S.unlock();
      tube(S, [[0.05, -2.7], [0.18, -1.6], [0.22, -0.6], [0.3, -0.2]], 0.03, 0.03, (t, s, ao) => rope(t * 6, s, ao, 2)); for (let k = 0; k < 4; k++) { const p = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU; p.push([0.42 + Math.cos(a) * (0.32 - k * 0.04), 0.0 - k * 0.04 + Math.sin(a) * (0.12 - k * 0.01)]); } tube(S, p, 0.035, 0.035, (t, s, ao) => rope(t * 9 + k, s, ao, k)); } S.unlock(); fadeTop(S, -4.3, -3.4); } },
    belswinglamp: { box: () => [-1.0, -3.4, 1.0, 0.45], paint(S, v) {   // a storm lantern swinging on its bracket, rain on the glass
      const c = S.c, px = -0.42, H = 2.85, sw = ((v % 3) - 1) * 0.22; contact(S, px, 0.03, 0.4, 0.14, 0.55);
      rev(S, px, 0, h => h < 0.12 ? 0.16 : h > H - 0.1 ? 0.09 : 0.06, 0, H, { mat: (u, h, ao) => iron(u * 3, h, ao, v), top: true, capMat: () => iron(0, 0, 1, v) }); tube(S, [[px, -H + 0.05], [0.12, -H + 0.02]], 0.035, 0.035, (t, s, ao) => iron(t * 4, s, ao, v + 1)); S.unlock();
      const lx = 0.1 + Math.sin(sw) * 0.55, ly = -H + 0.02 + Math.cos(sw) * 0.55; tube(S, [[0.1, -H + 0.04], [lx, ly - 0.3]], 0.015, 0.015, (t, s, ao) => iron(t * 9, s, ao, 2)); S.unlock();
      c.save(); c.translate(lx, ly); c.rotate(-sw); const g = c.createLinearGradient(-0.16, 0, 0.16, 0); g.addColorStop(0, 'rgba(160,240,235,.85)'); g.addColorStop(0.5, 'rgba(230,255,250,.95)'); g.addColorStop(1, 'rgba(90,190,190,.85)'); c.fillStyle = g; c.fillRect(-0.15, -0.25, 0.3, 0.42); c.fillStyle = '#2A2C30'; c.beginPath(); c.moveTo(-0.22, -0.25); c.lineTo(0, -0.42); c.lineTo(0.22, -0.25); c.closePath(); c.fill(); c.fillRect(-0.2, 0.17, 0.4, 0.06); c.strokeStyle = '#2A2C30'; c.lineWidth = 0.035; c.strokeRect(-0.15, -0.25, 0.3, 0.42); c.beginPath(); c.moveTo(0, -0.25); c.lineTo(0, 0.17); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.012; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-0.12 + i * 0.06, -0.2 + (i % 2) * 0.08); c.lineTo(-0.13 + i * 0.06, -0.05 + (i % 2) * 0.08); c.stroke(); } c.restore(); } },
    belbollard: { box: () => [-0.8, -1.2, 0.8, 0.4], paint(S, v) {   // an iron mooring bollard, a rope made fast round it, trailing into a puddle
      contact(S, 0, 0.04, 0.55, 0.18, 0.55); rev(S, 0, 0, h => h < 0.1 ? 0.3 : h < 0.55 ? 0.2 : h < 0.7 ? 0.2 + 0.09 * ss(0.55, 0.7, h) : 0.29 - 0.05 * ss(0.7, 0.78, h), 0, 0.78, { mat: (u, h, ao) => iron(u * 3, h * 3, ao, v, v % 2 === 0), top: true, capMat: (x) => iron(x * 3, 9, 1, v) });
      for (let k = 0; k < 3; k++) { const p = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI + Math.PI * 0.02, y = -0.3 - k * 0.07; p.push([Math.cos(a) * 0.23, y + Math.sin(a) * 0.08]); } tube(S, p, 0.035, 0.035, (t, s, ao) => rope(t * 7 + k, s, ao, k)); } tube(S, [[0.22, -0.28], [0.45, -0.05], [0.7, 0.1]], 0.035, 0.03, (t, s, ao) => rope(t * 5, s, ao, 4)); S.unlock(); ink(S, [12, 16, 20], 0.45); } },
  });
  // ('kind@d2' / 'kind@d3': any prop graded for a dungeon)
  const GRADED = ['belcolumn', 'belstump', 'belbench', 'belrib', 'belbell', 'belmould', 'belrail', 'bellamp', 'belarch', 'belhalf', 'belpipe', 'belpillar', 'belcoral', 'belfall'];
  for (const k of GRADED) for (const key of ['d2', 'd3']) DEF[k + '@' + key] = { box: v => { const b = DEF[k].box(v); return [b[0] - 0.1, b[1], b[2] + 0.1, Math.max(b[3], 0.45)]; }, paint(S, v) { DEF[k].paint(S, v); S.unlock(); grade(S, key); } };
  const THEMEK = { belchains: ['iron', 'spark'], belanvil: ['iron', 'spark'], belcrucible: ['pottery', 'fire', 'lava'], belsteamvent: ['iron', 'bubble', 'steam'], belcage: ['iron', 'spark'], belcastpit: ['stone', 'fire', 'lava'], belbrazier: ['iron', 'fire', 'lava'],
    belstatue: ['stone', 'gold'], belstatuehead: ['stone', 'gold'], belbanner: ['wood', 'leaf'], belrigging: ['wood', 'leaf'], belswinglamp: ['glass', 'prism'], belbollard: ['iron', 'gold'] };

  /* ======================= hand-placed dressing, breakable as the engine's props are =======================
     dress(X, [{ kind, v, x, y, hp }]) puts each into the floor's prop list: the engine draws it in depth order through its
     prop cache (these pictures), and areas, Ultimates, strong attacks and vehicles break it (20l: BREAK_FX.prop with its
     material and this picture). Shots that pass through it are this file's own check (tick). Returns { items, tick(dt) },
     or null where it is off (the caller then paints its old 2D). An item's .hold hides it a while (a bell swinging). */
  function dress(X, list) {
    if (off() || !X || !X.props || typeof DunWorld === 'undefined' || !DunWorld.PROPS) return null; install();
    const biome = (X.F && X.F.biome) || 'belfry', items = list.map(d => { const p = { x: d.x, y: d.y, kind: d.kind, v: d.v | 0, biome, k: -1, hp: d.hp || 2, el: d.el || 'gold', flash: 0, belDress: true }; X.props.push(p); return p; });
    const seen = new WeakMap();
    function hit(p, b) { p.hp -= b && b.src === 'ult' ? 3 : b && b.src === 'strong' ? 2 : 1; p.flash = 0.12; try { X.sparks(p.x, p.y - 0.4, '#E8D8A8', 5, 4); } catch (e) {}
      if (p.hp > 0) { try { X.sfx.thud(); } catch (e) {} return; } p.broken = true; let ok = false; try { ok = typeof BREAK_FX !== 'undefined' && BREAK_FX.prop(X, p, {}); } catch (e) {} if (!ok) try { X.boom(p.x, p.y - 0.4, 0.9, '#C9A055', '#FFFFFF', { n: 8, shake: 2 }); X.sfx.crash(); } catch (e) {} }
    function tick(dt) { const sh = X.shots || []; for (const p of items) { if (p.flash > 0) p.flash -= dt; if (p.hold > 0) { p.hold -= dt; p.broken = true; if (p.hold <= 0) { p.hold = 0; p.broken = false; } continue; } if (p.broken) continue;
        for (const b of sh) { if (!(b.life > 0) || b.lob) continue; const d = Math.hypot(b.x - p.x, b.y - (p.y - 0.35)); if (d > 0.62 + (b.r || 0.2)) continue; let s = seen.get(b); if (!s) seen.set(b, s = new Set()); if (s.has(p)) continue; s.add(p); hit(p, b); if (p.broken) break; } } }
    return { items, tick, hit }; }

  /* ======================= the rift's prop kinds through the engine's cache ======================= */
  const OLD = {}, KINDS = ['belcolumn', 'belstump', 'belbench', 'belfall', 'belrib', 'belbell', 'belmould', 'belrail', 'belcoral', 'bellamp', 'belarch', 'belhalf', 'belpipe', 'belarchl', 'belarchr', 'belfoundmould', 'belfoundhalf', 'belhung', 'belpillar'];
  const NEWK = { belfoundmould: 1, belfoundhalf: 1, belhung: 1, belpillar: 1 };   // (kinds of this file's own: no old 2D twin; without these pictures they draw nothing)
  for (const k of Object.keys(THEMEK).concat(Object.keys(DEF).filter(k => k.includes('@')))) { KINDS.push(k); NEWK[k] = 1; }   // v394 PR: the dungeons' own and graded props
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS, EXT = window.PROP_EXT || {};
    for (const k of KINDS) { if (NEWK[k] && !PR[k]) PR[k] = k === 'belpillar' && PR.pillar ? PR.pillar : k.includes('@') && OLD[k.split('@')[0]] ? OLD[k.split('@')[0]] : () => {};   // (a graded kind falls back to its prop's old 2D) if (!PR[k] || PR[k].__belp) continue; const old = OLD[k] = PR[k];
      const f = function (c, T, v) { if (off()) return old.apply(this, arguments); const vv = (v | 0) % 6, s = sprite(k, vv, Math.round(T), true); if (!s) return old.apply(this, arguments); c.drawImage(s.cv, -s.ax, -s.ay); }; f.__belp = 1; PR[k] = f;
      // (the engine's picture must hold the new art: its box about the feet, in tiles)
      let b = [0, 0, 0, 0]; for (let v = 0; v < 4; v++) { const q = DEF[k].box(v); b = [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[2]), Math.max(b[3], q[3])]; }
      const E = EXT[k] || [2.4, 2.9]; EXT[k] = [Math.max(E[0], Math.max(-b[0], b[2]) * 2 - 1.6 + 0.1), Math.max(E[1], -b[1] - 0.25 + 0.1)]; }
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) { const K2 = BREAK_FX.KIND, BRZ = ['#8D6C33', '#3E2A14', '#E8C27A'], LIME = ['#C8CCBC', '#8E9385', '#ECEADB'];   // (what each breaks into: bronze, limestone, the raft's wood, sea glass)
      Object.assign(K2, { belarchl: { mat: 'stone', cols: LIME }, belarchr: { mat: 'stone', cols: LIME }, belbench: { mat: 'wood', cols: ['#4A3420', '#24180C', '#8A6A44'], mix: 'iron' }, belfoundmould: { mat: 'pottery', cols: ['#7A4E30', '#3A2414', '#B88A5E'], mix: 'iron' }, belfoundhalf: { mat: 'iron', cols: BRZ, size: 3.2 }, belhung: { mat: 'iron', cols: BRZ, size: 3.4 }, belpillar: { mat: 'stone', cols: LIME }, belmould: { mat: 'pottery', cols: ['#7A4E30', '#3A2414', '#B88A5E'], mix: 'iron' }, belhalf: { mat: 'iron', cols: BRZ }, belbell: { mat: 'iron', cols: BRZ } }); }
    if (typeof PROP_EL !== 'undefined') Object.assign(PROP_EL, { belfoundmould: 'gold', belfoundhalf: 'gold', belhung: 'gold', belpillar: 'gold', belarchl: 'gold', belarchr: 'gold' });
    // v394 PR: what the dungeons' props break into, and the graded ones as the prop they grade
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) { const K2 = BREAK_FX.KIND, COLS = { iron: ['#4A4C52', '#24262A', '#8A8C94'], pottery: ['#7A4E30', '#3A2414', '#B88A5E'], stone: ['#7A8084', '#4A5054', '#A8AEB2'], wood: ['#4A3420', '#24180C', '#8A6A44'], glass: ['#7FD8D2', '#2E8A92', '#E2FBF8'] };
      for (const [k, [mat, , ex]] of Object.entries(THEMEK)) K2[k] = Object.assign({ mat, cols: COLS[mat] }, ex === 'lava' ? { hot: '#FF8A2A', lava: true } : ex === 'steam' ? { steam: true } : {}, k === 'belbanner' ? { mix: 'iron' } : k === 'belswinglamp' ? { hot: '#9FF0E8', mix: 'iron' } : {});
      for (const k of Object.keys(DEF)) if (k.includes('@')) { const b0 = k.split('@')[0]; K2[k] = Object.assign({}, K2[b0] || { mat: BREAK_FX.matOf(b0) }); } }
    if (typeof PROP_EL !== 'undefined') { for (const [k, [, el]] of Object.entries(THEMEK)) PROP_EL[k] = el; for (const k of Object.keys(DEF)) if (k.includes('@')) PROP_EL[k] = PROP_EL[k.split('@')[0]] || 'gold'; } }
  install();
  /* a painter for BREAK_FX (c, P): these pictures laid at its feet, P px per tile (a break's shards cut from them) */
  const painter = list => off() ? null : (c, P) => { for (const [n, v] of list) { const s2 = sprite(n, v, Math.max(8, Math.round(P)), true); if (s2) c.drawImage(s2.cv, -s2.ax, -s2.ay); } };
  /* the loading screen's warm-up (the Belfry rift's preload, 20n Rf.preload, chained): every hall, trial and arena picture at the
     floor's sharpness, as small jobs */
  const WARM = [['dais', 0], ['rib', 0], ['crystal', 'E'], ['crystal', 'W'], ['crystal', 'N'], ['pedestal', 0], ['plinth', 0], ['pit', 0], ['drain', 0], ['drainS', 0], ['cage', 'b'], ['cage', 'f'], ['hungbell', 'c'], ['alcove', 0], ['plaque', 0], ['pylon', 0], ['gpillar', 0], ['leaf', 0], ['lintel', 0], ['doorframe', 0], ['doorslab', 0], ['platform', '5.4x7.3'], ['navecol', 0], ['navecol', 1], ['wallseg', 0], ['housing', 0], ['glassurn', 0], ['urn', 0], ['bellfrag', 0], ['bellfrag', 1], ['seaglass', 0], ['lamppost', 0]]
    .concat(...['E', 'W', 'N'].map(B => [['socket', B + '00'], ['socket', B + '41'], ['medal', B + '0'], ['medal', B + '1'], ['medal', B + '2']]));
  WARM.push(['ncage', 'b'], ['ncage', 'f'], ['nplinth', 0], ['narch', 0]);   // v398 B2: the north gate's cage, plinth and archway
  const ARENA = { belkharrox: ['urn', 'bellfrag', 'lamppost'], belnhalu: ['navecol', 'wallseg', 'housing', 'seaglass', 'lamppost'], beluldroth: ['glassurn'] };
  function warm(P) { if (off() || !P || !(P.T > 0)) return []; BASE = Math.round(P.T * (P.k || 1)); const S2 = P.S || {}, hall = /Hall of Three Tides/.test(S2.name || ''), ar = ARENA[S2.boss] || null;   // (only what the stage being loaded draws)
    return WARM.filter(([n]) => ar ? ar.includes(n) : hall && !['navecol', 'wallseg', 'housing', 'seaglass', 'glassurn', 'urn', 'bellfrag', 'lamppost'].includes(n)).map(([n, v]) => () => { try { sprite(n, v, BASE, true); } catch (e) {} }); }
  function hookWarm() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.belfry; if (!Rf || Rf.__belp) return; const old = Rf.preload; Rf.preload = function (P) { let a = []; try { a = old ? old.apply(this, arguments) || [] : []; } catch (e) {} return a.concat(warm(P)); }; Rf.__belp = 1; } catch (e) {} }
  hookWarm();
  const API = { draw, fit, dress, painter, warm, sprite: (n, v, P) => sprite(n, v, P, true), has: n => !!DEF[n] && !off(), install, OLD, DEF, get stats() { return Object.assign({ sprites: SPR.size }, STATS); }, relief, crystalFacets, BCOL,
    kit: { surface, shade, put, M, M0, rev, rbox, tube, ball, vn, fbm, R1, ss, clamp, lerp, K, contact, ink, grain, glint, iron, brass, lime, wetstone, bronze, LIGHTS } };   // v398 PR: the painter's kit, for 20n9c's shrines and power stones
  if (typeof window !== 'undefined') window.BELPROPS = API;
  return API;
})();
