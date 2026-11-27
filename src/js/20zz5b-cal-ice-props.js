/* ---------- v404 CA: the Rimebound Forge's ice, repainted; the Glass Heart's geodes erupt ----------
   (1) The frost crystal clusters (prop 'frostcluster') and the frost wells (prop 'frostwell', and CAL.frostWellArt, which the
   Ashen Hollows' reservoir and Ifrit's arena use) are painted once into cached pictures by the Drowned Belfry's software
   shading pass (BELPROPS.kit, 20n9), in a cold light of their own (a cool key, a pale sky in the facets, the lava's warmth
   from below, a cyan rim): each crystal a six-sided prism with a pointed tip, standing and leaning, its faces lit as glass
   (a clear coat, sharp highlights, the sky caught at grazing angles) over light held inside it (deep cyan at the root,
   paler toward the tip and the silhouette, refraction bands that break where the face turns, hairline fractures), bright
   ridges, rime at its root, snow clumps and frost dust; the cluster stands on hexagonal basalt columns rimed over; the well
   is a kerb of twelve dressed basalt blocks, rimed, its throat a sunken frozen pool, the snowflake plaque on its face.
   Nothing is painted per frame. Where the GPU painter runs (NIDHOGG_MOVES.FGFX) the live light is laid over them: a cold
   pool of light on the floor, the crystals' inner glow breathing, glints that twinkle on their tips and ridges, a slow
   gleam rising through the tallest crystal, frost motes. Without it the old 2D glow stays as it was.
   Footprint, collision, breaking (BREAK_FX cuts its shards from these pictures) and their roles are unchanged: only the
   pictures change. window.__CALICE = 0 (or __BELP = 0) brings back the old 2D art.
   (2) The Glass Heart's geodes (prop 'geode': the violet-toothed ring round a molten heart) erupt with red energy, on the
   GPU, each on its own beat: pressure builds (the heart swells and pulses faster, crimson light gathers and motes are drawn
   in), then a gush (a plume of red-crimson energy from the heart, a flash of red light on the floor, embers flung up, heat
   shimmer), then it settles (the plume sinks to smoke, the embers fall). Scenery only: it hurts nothing and blocks nothing
   (the geode stays a breakable prop). Without the GPU painter it keeps its old glow.
   API (on CAL): CAL.iceOver(Q, p, Xs, Ys, T, t, ph) and CAL.geodeOver(Q, Xs, Ys, T, t, ph) (20zz5's drawOver calls them
   with its GPU pass), CAL_ICE.stats. */
var CAL_ICE = (() => {
  const TAU = Math.PI * 2;
  const BP = () => (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.kit && window.BELPROPS.DEF && window.__BELP !== 0 && window.__CALICE !== 0) ? window.BELPROPS : null;
  const STATS = { painted: 0, wells: 0, fallbacks: 0, ice: 0, geode: 0 };
  const hh = (a, b) => { let n = (a * 374761393 + b * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };

  /* ======================= the painter's pieces ======================= */
  /* prism: an n-sided crystal (or column) seen in the game's view: section radius r (tiles) from z0 to zb, then (zt > zb) a
     pointed tip at zt, else a flat top; its foot at x (tiles across) and d (tiles toward the camera), leaning `lean` (screen
     tiles across per tile up), turned rot. mat(I) sets the material (K.M) and returns an alpha factor; I: { z, zr (above its
     foot), h (0 root .. 1 tip), u (-1..1 across), th (0 at the silhouette .. 1 facing us), e (face), ed (tiles to the nearest
     ridge), tip, cap, cx, cy (the cap's point, -1..1) } */
  function prism(K, S, o, mat) {
    const { M, M0, shade, put, clamp } = K, P = S.P, KK = K.K, I = {};
    const n = o.n || 6, rot = o.rot || 0, r = o.r, z0 = o.z0 || 0, zb = o.zb, zt = o.zt == null ? zb : o.zt, lean = o.lean || 0, cx = o.x || 0, cd = o.d || 0, flat = zt <= zb + 1e-4;
    const VX = [], VY = [], NX = [], NY = []; for (let k = 0; k <= n; k++) { const a = rot + k * TAU / n; VX.push(Math.cos(a)); VY.push(Math.sin(a)); const m = rot + (k + 0.5) * TAU / n; NX.push(Math.cos(m)); NY.push(Math.sin(m)); }
    let xm = 0; for (let k = 0; k < n; k++) xm = Math.max(xm, Math.abs(VX[k]));
    const ap = Math.cos(Math.PI / n), el = 2 * Math.sin(Math.PI / n), tk = flat ? 0 : r * ap / (zt - zb);
    const rad = z => (z <= zb || flat) ? r : r * Math.max(0, (zt - z) / (zt - zb));
    let FE = 0, FT = 0; const front = u => { let best = -9; for (let k = 0; k < n; k++) { const x0 = VX[k], x1 = VX[k + 1]; if (x0 === x1 || (u - x0) * (u - x1) > 0) continue; const t = (u - x0) / (x1 - x0), y = VY[k] + (VY[k + 1] - VY[k]) * t; if (y > best) { best = y; FE = k; FT = t; } } return best; };
    const zTop = Math.max(zb, zt), xa = Math.max(0, Math.floor(S.ax + (cx + Math.min(0, lean * zTop) - r) * P - 2)), xb = Math.min(S.w - 1, Math.ceil(S.ax + (cx + Math.max(0, lean * zTop) + r) * P + 2));
    const ya = Math.max(0, Math.floor(S.ay - (zTop - KK * (cd - r)) * P - 2)), yb = Math.min(S.h - 1, Math.ceil(S.ay - (z0 - KK * (cd + r)) * P + 2));
    S.lock();
    for (let py = ya; py <= yb; py++) { const Yt = (S.ay - py - 0.5) / P;
      for (let px = xa; px <= xb; px++) { const X = (px + 0.5 - S.ax) / P;
        let z = Yt + KK * cd, ok = false, u = 0, rz = r;
        for (let it = 0; it < 7; it++) { rz = rad(z); if (rz < 1e-4) { ok = false; break; } u = (X - cx - lean * z) / rz; if (u < -xm || u > xm) { ok = false; break; } const yd = front(u) * rz, nz = Yt + KK * (cd + yd); ok = true; if (Math.abs(nz - z) < 0.15 / P) { z = nz; break; } z = nz; }
        if (ok && z >= z0 - 0.6 / P && (z <= zTop || (flat && z <= zb))) {   // a side face (or a tip face)
          const tipf = !flat && z > zb, nx0 = NX[FE], ny0 = NY[FE]; let nx = nx0, ny = ny0, nz = tipf ? tk : 0; nz -= lean * nx; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
          I.z = z; I.zr = z - z0; I.h = clamp((z - z0) / (zTop - z0), 0, 1); I.u = u / xm; I.th = 1 - Math.abs(u) / xm; I.e = FE; I.ed = Math.min(FT, 1 - FT) * el * rz; I.tip = tipf; I.cap = false; I.dzb = Math.abs(z - zb); I.nx = nx; I.nz = nz; I.ft = FT;
          M0(); M.ao = 1; const am = mat(I); shade(nx, ny, nz); put(S, px, py, clamp((xm - Math.abs(u)) * rz * P + 0.5, 0, 1) * clamp((z - z0) * P + 0.6, 0, 1) * (am == null ? 1 : am)); continue; }
        if (flat) {   // the flat top
          const xl = X - cx - lean * zb, yd = (zb - Yt) / KK - cd; let dm = 9; for (let k = 0; k < n; k++) dm = Math.min(dm, r * ap - (xl * NX[k] + yd * NY[k])); if (dm < -1.5 / P) continue;
          I.z = zb; I.zr = zb - z0; I.h = 1; I.u = xl / r; I.th = 1; I.e = -1; I.ed = dm; I.tip = false; I.cap = true; I.cx = xl / r; I.cy = yd / r; I.dzb = 0; I.nx = 0; I.nz = 1; I.ft = 0.5;
          M0(); M.ao = 1; const am = mat(I); shade(0, 0, 1); put(S, px, py, clamp(dm * P * KK * 1.6 + 0.5, 0, 1) * (am == null ? 1 : am)); } } }
  }
  /* ice: glass on the outside (a clear coat, sharp highlights, the sky at grazing angles), light held inside it */
  const DEEP = [0.0, 0.09, 0.24], MID = [0.04, 0.52, 0.9], PALE = [0.95, 1.05, 1.12];
  function iceM(K, I, sd, o) { const { M, vn, ss, lerp, clamp } = K, z = I.z;
    M.r = 0.03; M.g = 0.05; M.b = 0.075; M.rg = 0.05; M.cc = 1; M.sh = 0.5;
    const fs = I.e * 1.37 + sd, w = vn(I.u * 2.2 + fs, z * 3.1 + sd);
    // its depth: a deep cyan root, cyan through the body, pale toward the tip; light caught toward the silhouette (bent back inside)
    const edge = Math.pow(1 - I.th, 1.6), k = clamp(0.04 + 0.8 * Math.pow(I.h, 1.25) + 0.42 * edge + 0.2 * (w - 0.5) + (I.tip ? 0.12 : 0), 0, 1);
    // refraction bands: slanted planes of light, each face bending them its own way (so they break at the ridges)
    const b = Math.sin((z * (2.1 + 0.4 * (I.e % 3)) + I.u * (0.9 + 0.5 * ((I.e + 1) % 2)) + fs) * 5.4 + w * 2.4), band = Math.pow(Math.max(0, b), 14) * (0.25 + 0.75 * I.h);
    // a few hairline fractures (an iso-line of the noise, only where a second noise lets it), and tiny trapped bubbles
    const cr = 0.6 * ss(0.009, 0, Math.abs(vn(I.u * 3.4 + fs * 2.1, z * 4.2 + sd * 3) - 0.5)) * ss(0.55, 0.7, vn(I.u * 1.3 + sd, z * 1.7 + fs)) * 0.9, bub = vn(I.u * 31 + sd, z * 37 + fs) > 0.92 ? 0.3 : 0;
    // subsurface: a soft cyan core low in the body
    const sss = Math.pow(I.th, 1.5) * ss(0.85, 0.1, I.h) * 0.35;
    const lo = k < 0.45 ? k / 0.45 : 1, hi = k < 0.45 ? 0 : (k - 0.45) / 0.55, fe = I.cap ? 0 : Math.pow(1 - 2 * Math.min(I.ft, 1 - I.ft), 3), mx = clamp(hi * hi * 0.85 + band * 0.7 + cr + 0.3 * fe, 0, 1);
    // the faces turned to the light (left and up) carry more of it
    const ff = clamp(0.55 + 0.62 * (-I.nx + I.nz * 0.5 + 0.2), 0.38, 1.35), gl = (o && o.glow != null ? o.glow : 1) * ff;
    M.er = (lerp(lerp(DEEP[0], MID[0], lo), PALE[0], mx) + bub + sss * 0.2) * gl; M.eg = (lerp(lerp(DEEP[1], MID[1], lo), PALE[1], mx) + bub + sss * 0.7) * gl; M.eb = (lerp(lerp(DEEP[2], MID[2], lo), PALE[2], mx) + bub + sss) * gl;
    // a long reflection down each lit face (the sky caught in the glass), fainter on the faces turned away
    if (!I.cap) { const sk = ss(0.09, 0.02, Math.abs(I.ft - 0.24 - 0.05 * Math.sin(z * 3 + sd))) * (0.25 + 0.75 * ss(0.8, 1.3, ff)) * 0.55; M.er += sk * 0.8; M.eg += sk * 0.92; M.eb += sk; }
    // the ridges: thin bright edges where two faces meet, and the ring where the tip begins
    const rg = ss(0.026, 0.004, I.ed) * (0.5 + 0.5 * I.h) + (I.tip ? ss(0.035, 0, I.dzb) * 0.6 : 0); if (rg > 0) { M.er += 0.9 * rg; M.eg += 1.0 * rg; M.eb += 1.05 * rg; }
    // frosted patches: here and there the glass is dulled by hoarfrost (rougher, whiter, less clear)
    const fp = ss(0.66, 0.8, vn(I.u * 2.6 + fs * 1.9 + 11, z * 2.2 + sd)) * 0.45; if (fp > 0) { M.r += 0.32 * fp; M.g += 0.36 * fp; M.b += 0.4 * fp; M.rg = lerp(M.rg, 0.6, fp); M.cc *= 1 - 0.6 * fp; }
    // rime at the root: white, rough, opaque, climbing unevenly
    const fh = (o && o.frost != null ? o.frost : 1) * (0.05 + 0.14 * vn(I.u * 3.3 + sd, 4.7 + sd)), f = fh > 0 ? ss(fh, fh * 0.3, I.zr) : 0;
    if (f > 0) { const fw = vn(I.u * 19 + sd, z * 23); M.r = lerp(M.r, 0.74 + 0.12 * fw, f); M.g = lerp(M.g, 0.82 + 0.1 * fw, f); M.b = lerp(M.b, 0.92, f); M.rg = lerp(M.rg, 0.85, f); M.cc = lerp(M.cc, 0.1, f); M.sh = lerp(M.sh, 1, f); M.er *= 1 - 0.8 * f; M.eg *= 1 - 0.75 * f; M.eb *= 1 - 0.65 * f; }
    return lerp(0.78 + 0.22 * edge, 1, f); }
  /* basalt rimed over: dark grained stone, pitted, its tops and upper edges under hoarfrost */
  function basaltM(K, u, v, ao, sd, top, frost) { const { M, vn, fbm, ss, lerp } = K, w = fbm(u * 3 + sd, v * 3 + sd * 0.7), p = vn(u * 19 + sd, v * 19), t = 0.1 + 0.07 * (w - 0.5);
    M.r = t * 1.04; M.g = t * 0.98; M.b = t * 1.02; M.rg = 0.62; M.cc = 0.12; if (p > 0.75) { M.r *= 0.6; M.g *= 0.6; M.b *= 0.62; M.ao *= 0.8; }
    const fr = frost * ss(0.5, 0.72, vn(u * 5.3 + sd + 3, v * 5.3) * 0.6 + (top ? 0.42 : 0.1) + (1 - ao) * 0.1); if (fr > 0) { const s2 = vn(u * 29, v * 29 + sd); M.r = lerp(M.r, 0.72 + 0.12 * s2, fr); M.g = lerp(M.g, 0.8 + 0.1 * s2, fr); M.b = lerp(M.b, 0.9, fr); M.rg = lerp(M.rg, 0.88, fr); } }
  const snowM = (K, dx, dy, ao, sd) => { const { M, vn } = K, s2 = vn(dx * 9 + sd, dy * 9); M.r = 0.8 + 0.1 * s2; M.g = 0.87 + 0.08 * s2; M.b = 0.95; M.rg = 0.9; M.ao = ao; M.eb = 0.03; M.eg = 0.02; };
  /* frost dust: fine white specks and a few sparkles about a point (2D, tiles) */
  function dust(c, R, x, y, rx, ry, n) { c.save(); for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()), px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * ry * d, s = 0.006 + R() * 0.014; c.fillStyle = `rgba(240,250,255,${0.35 + R() * 0.55})`; c.fillRect(px - s / 2, py - s / 2, s, s); } c.restore(); }
  /* a cold pool of light and a contact shadow on the floor (painted into the picture; the live light is the GPU's) */
  function floorPool(K, S, rx, a) { const c = S.c; K.contact(S, 0.04, 0.03, rx * 0.95, rx * 0.95 * K.K, 0.55); c.save(); c.scale(1, K.K); const g = c.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx * 1.35); g.addColorStop(0, `rgba(120,200,240,${0.16 * a})`); g.addColorStop(0.6, `rgba(90,170,230,${0.08 * a})`); g.addColorStop(1, 'rgba(90,170,230,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx * 1.35, 0, TAU); c.fill(); c.restore(); }

  /* ======================= the crystal clusters ======================= */
  // each crystal: [x, d, r, zb, zt, lean, rot]; the tall one first in the list, painted far to near
  const SETS = [
    [[-0.08, -0.04, 0.2, 1.42, 2.0, 0.03, 0.2], [-0.42, 0.04, 0.12, 0.62, 0.95, -0.24, 0.5], [0.3, 0.0, 0.13, 0.82, 1.18, 0.2, 0.1], [0.14, -0.2, 0.1, 0.95, 1.3, 0.08, 0.7], [-0.22, 0.17, 0.085, 0.34, 0.55, -0.12, 0.3], [0.15, 0.2, 0.08, 0.28, 0.46, 0.14, 0.9], [-0.55, -0.12, 0.07, 0.3, 0.48, -0.3, 0.1]],
    [[0.02, -0.06, 0.22, 1.62, 2.28, -0.04, 0.6], [-0.36, 0.02, 0.13, 0.86, 1.22, -0.2, 0.2], [0.38, 0.05, 0.11, 0.52, 0.8, 0.3, 0.4], [-0.12, -0.24, 0.1, 1.1, 1.45, -0.06, 0.9], [0.18, 0.18, 0.09, 0.36, 0.58, 0.1, 0.2], [-0.25, 0.2, 0.075, 0.25, 0.42, -0.2, 0.6], [0.66, 0.0, 0.1, 0.48, 0.74, 0.18, 0.3], [0.55, 0.16, 0.07, 0.22, 0.38, 0.28, 0.8]],
    [[-0.12, -0.05, 0.21, 1.78, 2.42, 0.05, 0.4], [0.24, -0.02, 0.15, 1.0, 1.42, 0.14, 0.0], [-0.46, 0.06, 0.11, 0.55, 0.85, -0.3, 0.7], [0.06, 0.2, 0.09, 0.32, 0.52, 0.06, 0.5], [-0.24, 0.18, 0.08, 0.26, 0.44, -0.16, 0.2], [0.46, 0.14, 0.08, 0.3, 0.5, 0.3, 0.6]],
    [[0.04, -0.03, 0.2, 1.5, 2.12, -0.02, 0.9], [-0.33, -0.08, 0.14, 1.05, 1.45, -0.16, 0.3], [0.34, 0.04, 0.12, 0.66, 1.0, 0.24, 0.6], [-0.1, 0.2, 0.085, 0.3, 0.5, -0.08, 0.1], [0.2, 0.2, 0.08, 0.26, 0.42, 0.16, 0.4], [-0.62, 0.05, 0.1, 0.42, 0.68, -0.28, 0.5], [0.7, -0.06, 0.09, 0.4, 0.62, 0.24, 0.2]]];
  const CAP = 0.26;   // (the basalt plinth's top, tiles up)
  // the plinth: three hexagonal basalt columns, rimed over
  const COLS = [[0, -0.08, 0.56, CAP], [-0.62, 0.08, 0.34, CAP * 0.62], [0.6, 0.1, 0.36, CAP * 0.72]];
  function paintCluster(S, v) { const B = BP(), K = B.kit, c = S.c, set = SETS[v % SETS.length], sd = v * 7.3 + 1.7, R = K.R1(311 + v * 17);
    floorPool(K, S, 1.05, 1);
    for (const [x, d, r, h] of COLS.slice().sort((a, b) => a[1] - b[1])) prism(K, S, { n: 6, r, x, d, z0: 0, zb: h, rot: 0.26 + x, lean: 0 }, I => { basaltM(K, I.cap ? I.cx * r + x : I.u * r + x, I.cap ? I.cy * r : I.z, 1, sd + x * 3, I.cap, I.cap ? 1 : K.ss(h * 0.45, h, I.z) * 0.8); if (I.cap) { const e = K.ss(0.05, 0, I.ed); M2(K, e); } });
    S.unlock();
    const list = set.map((q, i) => ({ q, i })).sort((a, b) => a.q[1] - b.q[1]);
    for (const { q: [x, d, r, zb, zt, lean, rot], i } of list) { const base = Math.abs(x) < 0.4 ? CAP - 0.04 : x < 0 ? CAP * 0.62 - 0.04 : CAP * 0.72 - 0.04; prism(K, S, { n: 6, r, x, d, z0: base, zb, zt, lean, rot }, I => iceM(K, I, sd + i * 2.9, { frost: i ? 0.8 : 1 }));
    }
    S.unlock();
    // frost dust over the columns' tops and round the roots, glints on the tips
    dust(c, R, 0, -CAP + K.K * 0.05, 0.55, 0.2, 70); dust(c, R, 0, 0.05, 1.05, 0.32, 40);
    const [mx, md, , , mzt, ml] = set[0]; K.glint(c, mx + ml * mzt, -mzt + K.K * md + 0.02, 0.16, 0.95); for (let i = 1; i < 3; i++) { const [x, d, , , zt, l] = set[i]; K.glint(c, x + l * zt, -zt + K.K * d + 0.015, 0.09, 0.7); }
    K.ink(S, [10, 22, 36], 0.5); }
  const KKd = (K, d) => K.K * d;   // (a depth toward the camera as screen tiles down)
  const M2 = (K, e) => { const M = K.M; M.r += 0.2 * e; M.g += 0.22 * e; M.b += 0.24 * e; };   // (a column top's worn bright lip)

  /* ======================= the frost well ======================= (its origin the well's centre on the floor) */
  const WR = 1.05, WI = 0.74, WH = 0.42, WD = 0.11;   // (kerb radius, its throat (a fraction), its height, the pool's depth below it)
  const WSET = [[0.0, -0.04, 0.19, 1.2, 1.78, 0.02, 0.3], [-0.3, 0.0, 0.11, 0.62, 0.92, -0.22, 0.7], [0.28, -0.02, 0.12, 0.74, 1.08, 0.2, 0.1], [0.12, -0.22, 0.09, 0.85, 1.15, 0.08, 0.5], [-0.14, 0.13, 0.075, 0.28, 0.46, -0.12, 0.9], [0.18, 0.12, 0.07, 0.24, 0.4, 0.15, 0.2]];
  function paintWell(S, v) { const B = BP(), K = B.kit, c = S.c, M = K.M, broken = v === 'b', vv = broken ? 2 : v | 0, sd = 5.1 + vv * 3.3, R = K.R1(733 + vv * 11), top = WH;
    floorPool(K, S, WR * 1.1, 0.8);
    const blk = TAU / 12, ph0 = 0.13 + vv * 0.2;
    K.rev(S, 0, 0, h => WR * (h < 0.05 ? 1.04 : h > top - 0.04 ? 1.0 + 0.02 : 1), 0, top, {
      mat: (u, h, ao, inside, phi) => { const f = ((phi + ph0) / blk) % 1, j = Math.min(f, 1 - f) * blk * WR, bi = Math.floor((phi + ph0) / blk); basaltM(K, u * 1.3 + bi * 3.1, h * 1.3, ao, sd + bi, h > top * 0.62 + 0.12 * K.vn(u * 9 + bi, 5), K.ss(top * 0.3, top, h) * 1.1); M.r *= 1.5 + 0.18 * (hh(bi, 3) - 0.5); M.g *= 1.5 + 0.18 * (hh(bi, 3) - 0.5); M.b *= 1.6; M.cc = 0.3; if (j < 0.022) { M.ao *= 0.35 + 0.65 * j / 0.022; } else if (j < 0.04) { M.r += 0.05; M.g += 0.05; M.b += 0.055; }   // (the joints between the blocks, their bright arrises)
        },
      top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const rr = Math.hypot(x / WR, ey);
        if (rr < WI) { const eyP = ey + WD / (K.K * WR), rp = Math.hypot(x / WR, eyP) / WI;
          if (rp < 0.985) { /* the frozen pool: glassy, deep, light held in it; frost crystals ringed on it */ const w = K.vn(x * 4 + sd, eyP * 4); M.r = 0.03; M.g = 0.06; M.b = 0.09; M.rg = 0.05; M.cc = 1; M.sh = 0.5; const kk = 0.25 + 0.55 * rp * rp + 0.15 * (w - 0.5), cr2 = K.ss(0.02, 0, Math.abs(K.vn(x * 6 + sd, eyP * 6 + 3) - 0.5)); M.er = 0.06 + 0.42 * kk + 0.4 * cr2; M.eg = 0.26 + 0.6 * kk + 0.45 * cr2; M.eb = 0.45 + 0.6 * kk + 0.5 * cr2; const fr = K.ss(0.78, 0.98, rp + 0.12 * (w - 0.5)); if (fr > 0) { M.r = K.lerp(M.r, 0.8, fr); M.g = K.lerp(M.g, 0.88, fr); M.b = K.lerp(M.b, 0.95, fr); M.rg = K.lerp(0.05, 0.85, fr); M.er *= 1 - fr * 0.8; M.eg *= 1 - fr * 0.8; M.eb *= 1 - fr * 0.7; } }
          else { /* the throat's inner wall, in shadow, rimed at its lip */ basaltM(K, x * 3, ey * 3, 0.5, sd + 9, false, 0); M.ao = 0.3 + 0.4 * K.ss(1.25, 1.0, rp); M.er = 0.01; M.eg = 0.03; M.eb = 0.05; } return; }
        const a = Math.atan2(-ey, x / WR), f = ((a + ph0 + TAU) / blk) % 1, j = Math.min(f, 1 - f) * blk * rr * WR, bi = Math.floor((a + ph0 + TAU) / blk); basaltM(K, x * 1.4 + bi * 2.3, ey * 1.4, 1, sd + bi, true, 0.75);
        if (j < 0.02) M.ao *= 0.4 + 0.6 * j / 0.02; const lip = K.ss(WI + 0.06, WI, rr) + K.ss(0.92, 1, rr) * 0.7; if (lip > 0) { M.r = K.lerp(M.r, 0.85, lip); M.g = K.lerp(M.g, 0.91, lip); M.b = K.lerp(M.b, 0.97, lip); M.rg = 0.88; } } });
    S.unlock();
    // the crystals rising from the pool (stumps and shards when broken)
    const base = top - WD - 0.01;
    if (!broken) { const list = WSET.map((q, i) => ({ q, i })).sort((a, b) => a.q[1] - b.q[1]); for (const { q: [x, d, r, zb, zt, lean, rot], i } of list) { prism(K, S, { n: 6, r, x, d, z0: base, zb: base + zb, zt: base + zt, lean: lean * (vv % 2 ? -1 : 1), rot: rot + vv * 0.4 }, I => iceM(K, I, sd + i * 2.3, { frost: 0.9 }));  } }
    else { for (const [x, d, r, zb, zt, lean, rot] of [[-0.12, -0.02, 0.17, 0.16, 0.3, -0.1, 0.4], [0.2, 0.02, 0.12, 0.1, 0.2, 0.2, 0.1], [0.02, 0.14, 0.09, 0.06, 0.14, 0.05, 0.8]]) { prism(K, S, { n: 6, r, x, d, z0: base, zb: base + zb, zt: base + zt, lean, rot }, I => iceM(K, I, sd + x * 9, { frost: 1, glow: 0.7 }));  }
      for (let i = 0; i < 6; i++) { const a = R() * TAU, dd = 0.25 + R() * 0.4; prism(K, S, { n: 4, r: 0.04 + R() * 0.03, x: Math.cos(a) * dd, d: Math.sin(a) * dd * 0.6, z0: base, zb: base + 0.01, zt: base + 0.06 + R() * 0.05, lean: (R() - 0.5) * 2, rot: R() * 3 }, I => iceM(K, I, sd + i, { frost: 0.3 }));  } }
    S.unlock();
    // the snowflake plaque on the kerb's face (CAL.emblem, in the picture's own pixels)
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); if (typeof CAL !== 'undefined' && CAL.emblem) CAL.emblem(c, S.ax, S.ay + (K.K * WR - top * 0.48) * S.P, 0.4 * S.P, 0.15); c.restore(); S.T();
    dust(c, R, 0, -top + 0.02, WR * 0.95, WR * K.K * 0.95, 90); dust(c, R, 0, 0.1, WR * 1.2, 0.36, 40);
    if (!broken) { const [mx, md, , , mzt, ml] = WSET[0]; K.glint(c, mx + ml * (vv % 2 ? -1 : 1) * (base + mzt), -(base + mzt) + K.K * md + 0.02, 0.15, 0.95); K.glint(c, 0.28 + 0.2 * (base + 1.08), -(base + 1.08) + 0.01, 0.08, 0.6); }
    K.ink(S, [12, 20, 32], 0.5); }

  /* ======================= the pictures, and the props through the engine's cache ======================= */
  const DEFS = {
    calfrost: { light: 'ice', box: () => [-1.25, -2.75, 1.25, 0.55], paint: paintCluster },
    calfwell: { light: 'ice', box: () => [-1.3, -2.45, 1.3, 0.6], paint: paintWell } };
  const ICE_LIGHT = { a0: [0.05, 0.08, 0.12], a1: [0.1, 0.15, 0.22], e0: [0.16, 0.08, 0.05], e1: [0.5, 0.64, 0.8], k: [1.0, 1.08, 1.22], rim: [0.3, 0.62, 0.88], bo: [0.16, 0.07, 0.03] };
  let reg = false; const reg1 = () => { if (reg) return true; const B = BP(); if (!B) return false; Object.assign(B.DEF, DEFS); if (B.kit.LIGHTS && !B.kit.LIGHTS.ice) B.kit.LIGHTS.ice = ICE_LIGHT; reg = true; return true; };
  const OLD = {};
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS;
    const wrap = (kind, name, vOf, s, dy) => { const old = PR[kind]; if (!old || old.__calice) return; OLD[kind] = old;
      const f = function (c, T, v) { if (!reg1()) return old.apply(this, arguments); let sp = null; try { sp = BP().sprite(name, vOf(v | 0), Math.max(8, Math.round(T * s))); } catch (e) { sp = null; } if (!sp) { STATS.fallbacks++; return old.apply(this, arguments); } STATS.painted++;
        const k = T * s / sp.P; c.drawImage(sp.cv, -sp.ax * k, dy * T - sp.ay * k, sp.cv.width * k, sp.cv.height * k); if (typeof CAL !== 'undefined' && CAL.footFade) CAL.footFade(c, T); /* v466 CF: (its floor light faded out where the prop's picture ends, not cut square) */ }; f.__calice = 1; PR[kind] = f; };
    wrap('frostcluster', 'calfrost', v => v % 4, 1, 0);
    wrap('frostwell', 'calfwell', v => v % 2, 0.9, -0.05); }
  install();
  /* CAL.frostWellArt through the new picture (the reservoir, Ifrit's wells): the same options, its live parts drawn over */
  const oldWell = typeof CAL !== 'undefined' ? CAL.frostWellArt : null;
  function frostWellArt(c, Xs, Ys, T, o) { o = o || {}; const B = reg1() ? BP() : null; if (!B) return oldWell && oldWell(c, Xs, Ys, T, o);
    const s = o.scale || 1, Ts = T * s, Yf = Ys + Ts * 0.55, k = Math.max(0, Math.min(1, o.k || 0)), key = o.broken ? 'b' : String((o.v | 0) % 2);
    if (!B.draw(c, 'calfwell', key, Xs, Yf, Ts)) { STATS.fallbacks++; return oldWell && oldWell(c, Xs, Ys, T, o); } STATS.wells++;
    const top = Yf - Ts * WH, cy = top - Ts * 0.9;
    if (k > 0.02 && !o.broken) { CAL.glow(c, Xs, cy, Ts * 1.5, CAL.FROST, 0.4 * k); CAL.glow(c, Xs, cy - Ts * 0.2, Ts * 0.55, '#FFFFFF', 0.3 * k); }
    if (k > 0.02) CAL.glow(c, Xs, Yf + Ts * (K_() * WR - WH * 0.48), Ts * 0.45, CAL.FROST, 0.5 * k);
    // cracks as its integrity falls (over the tall crystal)
    if (o.integ != null && o.integ < 0.999 && !o.broken) { const n = o.integ < 0.35 ? 3 : o.integ < 0.7 ? 2 : 1; c.save(); c.lineCap = 'round'; for (let i = 0; i < n; i++) { let px = Xs + Ts * (i - 1) * 0.07, py = top + Ts * (WD - 0.25 - i * 0.22); const pts = [[px, py]]; for (let j = 0; j < 4; j++) { px += Ts * (hh(i, j) - 0.5) * 0.12; py -= Ts * 0.1; pts.push([px, py]); }
        for (const [col, w] of [['rgba(20,50,90,.8)', Math.max(1.2, Ts * 0.03)], ['rgba(235,250,255,.7)', Math.max(0.6, Ts * 0.012)]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } } c.restore(); }
    // the charge ring (when shown) and the Hellfire cue (a beating ring): as the old picture had them, round the kerb
    const rx = Ts * WR * 1.18, ry = rx * 0.42, cyR = top + Ts * 0.05;
    if (o.showCharge && o.charge != null) { const f = Math.max(0, Math.min(1, o.charge)); c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(10,14,22,.65)'; c.lineWidth = Math.max(4, T * 0.14); c.beginPath(); c.ellipse(Xs, cyR, rx, ry, 0, 0, TAU); c.stroke(); if (f > 0) { c.strokeStyle = f >= 1 ? '#FFFFFF' : CAL.FROST; c.lineWidth = Math.max(2.5, T * 0.09); c.beginPath(); c.ellipse(Xs, cyR, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke(); } c.restore(); }
    if (o.awake) { const u = o.awake; c.save(); c.strokeStyle = CAL.rgba(CAL.FROST_HI, 0.5 + 0.5 * u); c.lineWidth = Math.max(2, T * 0.08); c.beginPath(); c.ellipse(Xs, cyR, rx * (1.1 + 0.17 * u), ry * (1.1 + 0.17 * u), 0, 0, TAU); c.stroke(); c.restore(); CAL.glow(c, Xs, cy, T * 2.2, CAL.FROST, 0.35 + 0.3 * u); }
    if (o.label) CAL.label(c, o.label, Xs, Ys - T * 2.25 * s, Math.max(11, T * 0.3), CAL.FROST_HI); }
  const K_ = () => { const B = BP(); return B ? B.kit.K : 0.34; };
  if (typeof CAL !== 'undefined' && oldWell) { CAL.frostWellArt = frostWellArt; CAL.frostWellArtOld = oldWell; }

  /* ======================= the live light (GPU) ======================= */
  // where each picture's light sits (tiles about the feet): the tall crystal's foot and tip, the lesser tips (glints)
  const TIPS = {}; const tipsOf = (kind, v) => { const key = kind + v; let L = TIPS[key]; if (L) return L; L = [];
    if (kind === 'frostcluster') { const set = SETS[v % SETS.length]; for (const [x, d, r, zb, zt, l] of set.slice(0, 4)) L.push([x + l * zt, -zt + 0.34 * d + 0.03, r]); L.main = [set[0][0], -CAP, -set[0][4], set[0][5]]; }
    else { const base = WH - WD, sg = v % 2 ? -1 : 1, s = 0.9, dy = -0.05; for (const [x, d, r, zb, zt, l] of WSET.slice(0, 4)) L.push([(x + l * sg * (base + zt)) * s, (-(base + zt) + 0.34 * d + 0.03) * s + dy, r * s]); L.main = [0, (-base) * s + dy, (-(base + WSET[0][4])) * s + dy, WSET[0][5] * sg]; }
    return (TIPS[key] = L); };
  function iceOver(Q, p, X0, Y0, T, t, ph) { STATS.ice++; const L = tipsOf(p.kind, (p.v | 0) % (p.kind === 'frostcluster' ? 4 : 2)), [mx, my0, my1, ml] = L.main, H = (my0 - my1);
    const br = 0.5 + 0.5 * Math.sin(t * 1.1 + ph * 6);
    Q.glow(X0, Y0 - T * 0.04, T * 1.7, '#5FC4FF', 0.2 + 0.06 * br, 0.34);                                       // the cold pool of light on the floor
    Q.glow(X0 + mx * T, Y0 + (my0 + my1) * 0.5 * T, T * (0.7 + 0.12 * br), '#8FDCFF', 0.13 + 0.09 * br, 1.4);  // the light held inside, breathing
    // a gleam rising slowly through the tall crystal, then a pause
    const g = (t * 0.32 + ph) % 1.6; if (g < 1) { const yy = Y0 + (my0 - H * g) * T, xx = X0 + (mx + ml * H * g) * T; Q.glow(xx, yy, T * 0.32, '#E8FAFF', 0.32 * Math.sin(g * Math.PI)); }
    // glints: each tip in turn catches the light
    for (let i = 0; i < L.length; i++) { const [x, y, r] = L[i], tw = Math.pow(Math.max(0, Math.sin(t * (0.9 + i * 0.23) + ph * 9 + i * 2.1)), 28); if (tw > 0.02) Q.star(X0 + x * T, Y0 + y * T, T * (0.22 + r) * (0.5 + 0.5 * tw), 0.95 * tw, '#FFFFFF'); }
    // frost motes drifting up from the roots
    for (let i = 0; i < 3; i++) { const u = (t * 0.22 + ph * 3 + i / 3) % 1, x = X0 + T * (Math.sin(i * 2.4 + ph * 5) * 0.5 + Math.sin(t * 0.9 + i) * 0.08), y = Y0 - T * (0.25 + u * 1.6); Q.star(x, y, T * 0.05, 0.7 * Math.sin(u * Math.PI), '#DFF6FF'); } }

  /* the geode's eruption: build (pressure), gush (the plume), settle; one beat per geode (ph 0..1 its own) */
  const RED = '#FF2436', CRIM = '#C80E2A', HOT = '#FF7A5A';
  function geodeOver(Q, Xs, Ys, T, t, ph) { STATS.geode++; const per = 6.2 + ph * 2.6, tc = (t + ph * 17.3) % per, tB = per - 4.0, tG = tB + 1.7, tS = tG + 0.95;
    const hx = Xs, hy = Ys, seed = ph * 37;
    // its heart at rest: the molten glow it always had
    const idle = 0.35 + 0.12 * Math.sin(t * 2.1 + ph * 6); Q.glow(hx, hy, T * 1.25, '#FF6A1F', idle); Q.fire(hx, hy - T * 0.08, T * 0.36, 0.8, idle * 0.8, seed);
    if (tc < tB) return;
    if (tc < tG) { // pressure builds: the heart swells, pulses faster, crimson light gathers, motes are drawn in
      const u = (tc - tB) / (tG - tB), pul = 0.6 + 0.4 * Math.sin(tc * (7 + 22 * u)), e = u * u;
      const e2 = Math.sqrt(u);
      Q.glow(hx, hy, T * (0.9 + 0.8 * e2), RED, (0.3 + 0.45 * e2) * pul); Q.glow(hx, hy, T * 1.5, CRIM, 0.22 * e2 * pul, 0.8); Q.eorb(hx, hy, T * (0.24 + 0.18 * e), RED, 0.75 + 0.35 * u, (0.5 + 0.5 * e2) * pul, seed, 1.5); Q.glow(hx, hy, T * (0.18 + 0.12 * e), '#FFE2D6', (0.25 + 0.5 * e) * pul);
      Q.glow(hx, Ys + T * 0.72, T * (1.1 + 0.6 * e), CRIM, (0.1 + 0.2 * e) * pul, 0.4);                              // (its light on the floor beneath)
      for (let i = 0; i < 8; i++) { const f = ((tc - tB) * (0.8 + 0.12 * i) + i / 8) % 1, a = i * 0.79 + ph * 4 + f * 1.6, rr = T * (1.35 * (1 - f) + 0.12); Q.glow(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr * 0.75, T * 0.16, RED, 0.5 * f * e2); Q.star(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr * 0.75, T * 0.11, 0.9 * f * e2, HOT); }
      return; }
    const gs = tc - tG;   // seconds since the gush began (embers fly on through the settling)
    for (let i = 0; i < 12; i++) { const h1 = hh(i, Math.floor(ph * 997)), h2 = hh(i + 31, 7), t0 = i * 0.045, tt = gs - t0, life = 1.1 + h2 * 0.6; if (tt < 0 || tt > life) continue;
      const vx = (h1 - 0.5) * 3.4, vy = -(4.2 + h2 * 3.2), x = hx + T * vx * tt, y = hy - T * 0.2 + T * (vy * tt + 3.6 * tt * tt), f = 1 - tt / life; Q.glow(x, y, T * 0.2, RED, 0.55 * f); Q.star(x, y, T * (0.08 + 0.06 * f), f, i % 3 ? HOT : '#FFE0C8'); }
    if (tc < tS) { // the gush: a plume of red energy from the heart, a flash on the floor, heat shimmer above
      const g = (tc - tG) / (tS - tG), env = g < 0.12 ? g / 0.12 : 1 - 0.45 * (g - 0.12) / 0.88, Hh = T * (2.0 + 1.6 * Math.min(1, g * 2.2)), fl = g < 0.25 ? 1 - Math.abs(g - 0.08) / 0.17 : 0;
      Q.glow(hx, Ys + T * 0.7, T * 2.6, RED, 0.42 * Math.max(0, fl) + 0.16 * env, 0.42); Q.glow(hx, hy - Hh * 0.4, T * 2.0, CRIM, 0.3 * env, 1.3);
      for (let i = 0; i < 5; i++) { const o = i - 2, ao = Math.abs(o); Q.etongue(hx + o * T * 0.12, hy + T * 0.08, T * (0.78 - 0.16 * ao), Hh * (1 - 0.2 * ao) * (0.92 + 0.08 * Math.sin(t * 11 + i)), o * 0.2 + Math.sin(t * 7 + i * 1.7) * 0.06, ao ? CRIM : RED, 0.95, env * (ao ? 0.7 : 1), seed + i * 3.1); }
      Q.etongue(hx, hy + T * 0.04, T * 0.34, Hh * 0.62, Math.sin(t * 13) * 0.04, HOT, 1.1, env * 0.9, seed + 9);
      Q.eorb(hx, hy, T * 0.5, RED, 1.05, env, seed, 2); Q.glow(hx, hy, T * 0.6, '#FFD0C0', 0.55 * env);
      for (let i = 0; i < 3; i++) { const u2 = (g * 1.4 + i / 3) % 1; Q.glow(hx + Math.sin(t * 6 + i * 2.2) * T * 0.25, hy - Hh * (0.75 + 0.35 * u2), T * (0.55 + 0.3 * u2), '#FF5040', 0.1 * env * Math.sin(u2 * Math.PI), 1.6); }   // (heat shimmering above it)
      return; }
    { // it settles: the plume sinks into a smoulder of red smoke, the heart dims back to its rest
      const s = (tc - tS) / Math.max(0.3, per - tS), e = Math.pow(1 - Math.min(1, s * 1.6), 2);
      if (e > 0.01) { Q.etongue(hx, hy + T * 0.05, T * 0.36, T * 1.6 * e + T * 0.3, Math.sin(t * 5) * 0.08, CRIM, 0.8, 0.6 * e, seed + 5); Q.glow(hx, hy, T * 1.1, RED, 0.35 * e); Q.glow(hx, Ys + T * 0.7, T * 1.6, CRIM, 0.14 * e, 0.42); }
      for (let i = 0; i < 3; i++) { const u = Math.min(1, s * 1.3 + i * 0.12); if (u >= 1) continue; Q.smoke(hx + T * (i - 1) * 0.22 + Math.sin(t + i) * T * 0.1, hy - T * (0.6 + u * 2.2), T * (0.35 + u * 0.5), 0.3 * (1 - u), seed + i, '#3A1218', 0.4); } } }

  if (typeof CAL !== 'undefined') Object.assign(CAL, { iceOver, geodeOver });
  const API = { get stats() { return Object.assign({}, STATS); }, install, reg: reg1, iceOver, geodeOver, OLD, DEFS, SETS, prism, iceM };
  if (typeof window !== 'undefined') window.CAL_ICE = API;
  return API;
})();
