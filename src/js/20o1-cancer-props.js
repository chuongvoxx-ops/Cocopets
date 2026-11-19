/* ---------- v420 GC: the Gate of Cancer's pictures (the Oracle Shell and the Moonlit Arena) ----------
   Every solid piece of the gate is painted once, at the floor's sharpness, by the Drowned Belfry's software shading pass
   (BELPROPS.kit, 20n9: each pixel of a solid gets a normal and a material and is lit), in a light of its own: the Oracle
   Shell's ("oracle": a warm pearl key from the upper left, rose and lilac in the reflections, an aqua bounce from the tide
   pools) and the arena's ("lunar": a cold silver key, violet sky in the reflections, a lavender rim). Then each is finished
   with layered 2D detail (growth lines, ribs, kintsugi gold, carved moon phases, glints). Nothing here is painted per
   frame: the frame lays the pictures down; what glows or moves is the gate's own GPU light over them (20o).
   Pictures (name, v): clam (the lower valve on its pearl bed, the oracle pearl in it), lid (the upper valve closed), lidup
   (the upper valve raised: its nacre underside), door (the great moon gate: ring, pylons and plinth), leaf (v 'l' | 'r':
   the gate's two half-disc leaves), pillar (v 0..3: moonstone columns with crescent, orb or mended tops), shard (v 0..2:
   floating crescents of moonstone), coral (v 0..3), scallop (v 0..1), rib (v 0..1: a great nacre rib of the shell's wall),
   moon (the great moon behind the arena). Engine props (DunWorld.PROPS, breakable through BREAK_FX): cxpillar, cxcoral,
   cxscallop.
   API (global CANCER_PROPS): draw(c, name, v, Xs, Ys, T, o) the picture with its feet at Xs, Ys (o: { alpha, sx, sy (a
   scale about the feet), rot }) -> false when it is not painted yet; sprite(name, v) -> { cv, ax, ay, P }; warm(P) -> jobs
   for the loading screen (P: the floor's sharpness, TS x SK); release() frees every picture (the gate calls it when its
   stage closes); GEO: the numbers the gate shares with the pictures (the clam, the door). window.__CXP = 0 turns the
   pictures off (the gate then draws nothing of them). */
var CANCER_PROPS = (() => {
  const TAU = Math.PI * 2;
  const BP = () => (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.kit && window.__BELP !== 0 && window.__CXP !== 0) ? window.BELPROPS : null;
  const hh = (a, b) => { let n = (a * 374761393 + b * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0 };
  /* the two lights (as BELPROPS.kit.LIGHTS: ambient low/high, the sky's reflection low/high, the key, the rim, the bounce) */
  const LIGHT = {
    oracle: { a0: [0.2, 0.15, 0.19], a1: [0.12, 0.1, 0.15], e0: [0.2, 0.15, 0.2], e1: [0.66, 0.58, 0.74], k: [1.22, 1.13, 1.08], rim: [0.42, 0.3, 0.55], bo: [0.07, 0.14, 0.15] },
    lunar: { a0: [0.12, 0.1, 0.19], a1: [0.13, 0.12, 0.22], e0: [0.14, 0.11, 0.22], e1: [0.6, 0.56, 0.84], k: [1.1, 1.07, 1.18], rim: [0.5, 0.38, 0.85], bo: [0.13, 0.09, 0.2] } };
  /* the kit lights with LIGHTS.bel (the object its shading reads outside its own painting): ours swapped in for one painting */
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT[name] || {}); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  const GEO = { clamR: 1.32, clamH: 0.78, bedR: 1.95, bedH: 0.14, pearlR: 0.3, lidD: 0.66, hinge: -1.37, ring: { cy: 1.95, Ri: 1.55, Ro: 2.2, dep: 0.5 }, pylon: 2.85, lidLen: 2.3 };

  /* ======================= materials ======================= */
  // nacre: mother-of-pearl, a clear coat over a pale rose body, thin-film colour (rose, aqua, gold, lilac) turning through its growth bands
  function nacre(K, u, v, ao, sd, ir) { const { M, vn, fbm } = K; const w = fbm(u * 2.4 + sd, v * 2.4 + sd * 0.7), band = Math.sin((v * 7 + u * 1.3 + w * 3.2) * 2.2 + sd), b2 = vn(u * 9 + sd, v * 13), t = 0.86 + 0.1 * w;
    M.r = 0.93 * t; M.g = 0.85 * t; M.b = 0.87 * t; M.rg = 0.2; M.cc = 0.85; M.sh = 0.9; const ph = band * 1.1 + w * 2.6 + sd, k = (ir == null ? 1 : ir) * 0.7;
    M.er = (0.07 + 0.07 * Math.cos(ph)) * k; M.eg = (0.055 + 0.065 * Math.cos(ph - 2.1)) * k; M.eb = (0.08 + 0.08 * Math.cos(ph - 4.2)) * k; if (b2 > 0.8) M.ao *= 0.93; }
  // the shell's outside: ivory and blush in growth rings, rose-brown bands, radial ribs (rq 0..1 on a crest), fine growth lines, a few worn pits
  function shellOut(K, u, h, sd, rq) { const { M, vn, fbm, ss, lerp } = K; const w = fbm(u * 3 + sd, h * 3), ring = ss(0.78, 0.97, Math.sin(h * 10.5 + w * 2.4 + sd) * 0.5 + 0.5), gl = Math.sin(h * 46 + w * 6) * 0.5 + 0.5;
    M.r = lerp(1.0, 0.9, ring * 0.85); M.g = lerp(0.85, 0.5, ring * 0.85); M.b = lerp(0.87, 0.64, ring * 0.85); const tt = 0.9 + 0.1 * gl; M.r *= tt; M.g *= tt; M.b *= tt;
    M.ao *= 0.66 + 0.34 * rq; M.rg = 0.5; M.cc = 0.3; if (rq > 0.86) { M.r += 0.06; M.g += 0.05; M.b += 0.05; } const p = vn(u * 31 + sd, h * 27); if (p > 0.82) M.ao *= 0.75; }
  // moonstone: a pale lavender-grey stone, a blue sheen floating in it (adularescence), faint violet veins; gold kintsugi along its mended cracks (gold 0..1)
  function moon(K, u, v, ao, sd, gold, sheen) { const { M, vn, fbm, ss } = K; const w = fbm(u * 2.1 + sd, v * 2.1 + sd * 0.6), t = 0.86 + 0.16 * w;
    M.r = 0.86 * t; M.g = 0.84 * t; M.b = 0.91 * t; M.rg = 0.34; M.cc = 0.55; const ad = ss(0.42, 0.82, fbm(u * 1.3 + sd + 4, v * 1.7)) * (sheen == null ? 1 : sheen); M.er += 0.05 * ad; M.eg += 0.09 * ad; M.eb += 0.2 * ad;
    const vv = Math.abs(vn(u * 5 + sd, v * 5 + 2) - 0.5); if (vv < 0.018) { const k = 1 - vv / 0.018; M.r -= 0.12 * k; M.g -= 0.14 * k; M.b -= 0.06 * k; }
    if (gold > 0) { const cr = Math.abs(vn(u * 1.5 + sd * 3, v * 1.5 + 1.7) - 0.5), th = 0.018 * gold * ss(0.45, 0.62, vn(u * 0.6 + sd + 9, v * 0.6)); if (cr < th) goldM(K, u, v, cr / th); } }
  const nsh = (K, x, y, z) => { const l = Math.hypot(x, y, z) || 1; K.shade(x / l, y / l, z / l); };
  function goldM(K, u, v, e) { const M = K.M; M.mt = 1; M.r = 0.3; M.g = 0.22; M.b = 0.08; M.fr = 1.0; M.fg = 0.8; M.fb = 0.42; M.rg = 0.16 + 0.2 * (e || 0); M.cc = 0; M.er = 0.12; M.eg = 0.08; M.eb = 0.02; }
  function darkstone(K, u, v, sd) { const { M, fbm, vn } = K; const w = fbm(u * 2.6 + sd, v * 2.6), t = 0.8 + 0.3 * w; M.r = 0.2 * t; M.g = 0.17 * t; M.b = 0.33 * t; M.rg = 0.28; M.cc = 0.7; const s = vn(u * 40, v * 40 + sd); if (s > 0.9) { M.er = 0.25; M.eg = 0.25; M.eb = 0.35; } }
  function pearlM(K, dx, dy, sd) { const M = K.M, e = Math.hypot(dx, dy), ph = e * 6.5 + Math.atan2(dy, dx) * 0.6 + sd; M.r = 0.94; M.g = 0.92; M.b = 0.97; M.rg = 0.06; M.cc = 1; M.sh = 1;
    M.er = 0.06 + 0.07 * Math.cos(ph); M.eg = 0.05 + 0.06 * Math.cos(ph - 2.1); M.eb = 0.08 + 0.08 * Math.cos(ph - 4.2); }
  function coralM(K, u, v, sd) { const { M, vn } = K; const w = vn(u * 11 + sd, v * 11), pr = vn(u * 37, v * 37 + sd), t = 0.82 + 0.26 * w; M.r = 0.95 * t; M.g = 0.5 * t; M.b = 0.6 * t; M.rg = 0.55; M.cc = 0.3; M.er = 0.08; M.eg = 0.02; M.eb = 0.04; if (pr > 0.74) M.ao *= 0.7; }

  /* a contact shadow and a soft pool of the land's own light on the floor (painted; the live light is the GPU's) */
  function pool(K, S, rx, col, a) { const c = S.c; K.contact(S, 0.03, 0.03, rx * 0.9, rx * 0.9 * K.K, 0.5); c.save(); c.scale(1, K.K); const g = c.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx * 1.3); g.addColorStop(0, `rgba(${col},${0.2 * a})`); g.addColorStop(0.6, `rgba(${col},${0.08 * a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx * 1.3, 0, TAU); c.fill(); c.restore(); }
  function specks(c, R, x, y, rx, ry, n, col) { c.save(); for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()), s = 0.008 + R() * 0.014; c.fillStyle = `rgba(${col},${(0.35 + R() * 0.5).toFixed(2)})`; c.fillRect(x + Math.cos(a) * rx * d - s / 2, y + Math.sin(a) * ry * d - s / 2, s, s); } c.restore(); }

  /* ======================= the oracle clam ======================= */
  const wave = phi => 0.075 * Math.sin(phi * 7 + 0.4);   // (the valves' zigzag lips, interlocking)
  /* domeSolid: a dome on a rim of radius R at height H0 (tiles up), rising D at its middle, its rim waved by wv(angle) (angle 0 = +x,
     pi/2 toward the camera); the front-most surface found per pixel along the view (marched, then halved). mat(x, d, z) sets the
     material (d: tiles toward the camera) */
  function domeSolid(K, S, H0, R, D, wv, mat) { const { M, clamp } = K, P = S.P, KK = K.K, N = 18;
    const zAt = (x, d) => { const q = 1 - (x * x + d * d) / (R * R); if (q < 0) return -9; const s = Math.sqrt(q); return H0 + wv(Math.atan2(d, x)) * (1 - s * s) + D * s; };
    const xa = Math.max(0, Math.floor(S.ax - R * P) - 2), xb = Math.min(S.w - 1, Math.ceil(S.ax + R * P) + 2), ya = Math.max(0, Math.floor(S.ay - (H0 + D + 0.2 + KK * R) * P) - 2), yb = Math.min(S.h - 1, Math.ceil(S.ay - (H0 - 0.2 - KK * R) * P) + 2);
    S.lock();
    for (let py = ya; py <= yb; py++) { const Yt = (S.ay - py - 0.5) / P; for (let px = xa; px <= xb; px++) { const x = (px + 0.5 - S.ax) / P; if (Math.abs(x) >= R - 0.2 / P) continue; const dm = Math.sqrt(R * R - x * x) * 0.999;
      const f = d => zAt(x, d) - KK * d - Yt, f0 = f(dm); if (f0 > 0.6 / P) continue;
      let dPrev = dm, hit = null, best = -9, bd = 0;
      for (let i = 1; i <= N; i++) { const d = dm - 2 * dm * i / N, fv = f(d); if (fv > best) { best = fv; bd = d; } if (fv >= 0) { let a2 = dPrev, b2 = d; for (let k = 0; k < 9; k++) { const m = (a2 + b2) / 2; if (f(m) >= 0) b2 = m; else a2 = m; } hit = b2; break; } dPrev = d; }
      let al = clamp(0.5 - f0 * P, 0, 1); if (hit == null) { if (best < -1.2 / P) continue; hit = bd; al *= clamp(1 + best * P, 0, 1); }
      const e = 0.004, z = zAt(x, hit), zx = (zAt(x + e, hit) - zAt(x - e, hit)) / (2 * e), zd = (zAt(x, hit + e) - zAt(x, hit - e)) / (2 * e), nx = -clamp(zx, -9, 9), ny = -clamp(zd, -9, 9), l = Math.hypot(nx, ny, 1);
      K.M0(); M.ao = 1; mat(x, hit, z); K.shade(nx / l, ny / l, 1 / l); K.put(S, px, py, al * clamp((R - Math.abs(x)) * P, 0, 1)); } }
    S.unlock(); }
  // the mantle inside the clam: lilac-blue velvet, rings, glowing spots (a giant clam's own living colour)
  function mantleM(K, x, d, sd) { const { M, vn, fbm, ss } = K; const w = fbm(x * 2.2 + sd, d * 2.2), ring = Math.sin(Math.hypot(x, d) * 15 + w * 3);
    M.r = 0.66 + 0.14 * w + 0.05 * ring; M.g = 0.5 + 0.1 * w; M.b = 0.82 + 0.08 * w + 0.04 * ring; M.rg = 0.4; M.cc = 0.5;
    const sp = vn(x * 15 + sd, d * 15 + 3); if (sp > 0.74) { const k = ss(0.74, 0.84, sp); M.er += 0.12 * k; M.eg += 0.3 * k; M.eb += 0.42 * k; } }
  // the lower valve: a deep ribbed bowl, nacre inside, its lip zigzag; the mantle in it and the oracle pearl on it; a low round bed of nacre with a gold rim, pearls strewn on it
  function paintClam(K, S) { const { M } = K, c = S.c, R = GEO.clamR, Hc = GEO.clamH, BR = GEO.bedR, BH = GEO.bedH, RN = K.R1(4207), ribs = 14, pr = GEO.pearlR;
    pool(K, S, 2.15, '255,190,215', 1);
    // the pearl bed: a low disc, its side nacre, a gold band at its lip, its top pale pearl-stone in rings
    K.rev(S, 0, 0, h => BR * (h > BH - 0.03 ? 0.985 : 1), 0, BH, { mat: (u, h) => { if (h > BH - 0.035) { goldM(K, u, h, 0.2); return; } nacre(K, u * 1.6, h * 3, 1, 2.1, 0.5); M.r *= 0.92; M.g *= 0.86; M.b *= 0.9; },
      top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const rr = Math.hypot(x / BR, ey); nacre(K, x * 1.4, ey * 4, 1, 5.3, 0.45); const ring = Math.abs(((rr * 5.5) % 1) - 0.5); if (ring < 0.04) M.ao *= 0.8; if (rr > 0.94) goldM(K, x, ey, 0.3); } });
    S.unlock();
    // pearls strewn round the clam on the bed (behind it first)
    const strew = []; for (let i = 0; i < 16; i++) { const a = RN() * TAU, d = 1.42 + RN() * 0.42, x = Math.cos(a) * d, y = Math.sin(a) * d; strew.push([x, y, 0.045 + RN() * 0.05]); }
    const pearlAt = ([x, y, r]) => K.ball(S, x, -BH + y * K.K - r, r, r, (dx, dy, ao) => { pearlM(K, dx, dy, x * 3); M.ao = ao; });
    for (const p of strew.filter(p => p[1] < 0)) pearlAt(p); S.unlock();
    const bS = { __proto__: S, ay: S.ay - BH * S.P };   // (the bowl stands on the bed: its feet BH up)
    const top = phi => Hc + wave(phi), prof = h => { const q = 1 - Math.min(1, Math.max(0, h) / Hc); return R * Math.sqrt(Math.max(0, 1 - q * q)) * (h > Hc ? 1 + (h - Hc) * 0.1 : 1); };
    const bowl = part => { K.rev(bS, 0, 0, prof, 0, Hc + 0.1, { shell: (phi, h) => h <= top(phi), th: () => 0.08, part,
      mat: (u, h, ao, inside, phi) => { const rb = Math.cos(phi * ribs), rq = rb * rb; if (!inside) { shellOut(K, u, h * 1.3, 1.3, rq); M.er += 0.14 * M.ao; M.eg += 0.09 * M.ao; M.eb += 0.1 * M.ao; if (h > top(phi) - 0.04) { nacre(K, u * 3, h * 3, 1, 3.3, 0.4); M.r += 0.05; M.g += 0.05; M.b += 0.05; } }
        else { nacre(K, u * 1.3 + 1, h * 2.6, ao, 7.7, 0.7); M.ao *= 0.8 + 0.2 * rq; } } }); S.unlock(); };
    bowl('back');
    // the mantle, filling the bowl, and the oracle pearl resting on it
    domeSolid(K, bS, Hc - 0.14, R * 0.82, 0.16, phi => 0.03 * Math.sin(phi * 9), (x, d) => mantleM(K, x, d, 1.7));
    bowl('front');
    const pz = BH + Hc + 0.02 + pr * 0.85; K.contact(S, 0.02, -(pz - pr * 0.8), pr * 1.1, pr * 0.36, 0.4);
    K.ball(S, 0, -pz, pr, pr, (dx, dy, ao) => { pearlM(K, dx, dy, 0.7); M.er += 0.05; M.eg += 0.03; M.eb += 0.06; M.ao = 0.85 + 0.15 * ao; }); S.unlock();
    for (const p of strew.filter(p => p[1] >= 0)) pearlAt(p); S.unlock();
    // finishing: glints on the pearls, a little sand
    K.glint(c, -pr * 0.35, -pz - pr * 0.4, 0.16, 0.95); K.glint(c, pr * 0.25, -pz + pr * 0.35, 0.06, 0.5);
    for (const [x, y, r] of strew) if (RN() < 0.6) K.glint(c, x - r * 0.35, -BH + y * K.K - r * 1.4, r * 0.9, 0.7);
    specks(c, RN, 0, -BH + 0.05, BR * 0.95, BR * K.K * 0.9, 60, '255,236,228');
    K.ink(S, [70, 34, 52], 0.45); }
  // the upper valve closed: a ribbed dome on the bowl's lip
  function paintLid(K, S) { const { M } = K, R = GEO.clamR, Hc = GEO.clamH, BH = GEO.bedH, ribs = 14, D = GEO.lidD;
    const bS = { __proto__: S, ay: S.ay - BH * S.P };
    domeSolid(K, bS, Hc, R * 1.01, D, wave, (x, d, z) => { const a = Math.atan2(d, x), rb = Math.cos(a * ribs), rq = rb * rb, rr = Math.hypot(x, d) / R; shellOut(K, a * 1.3, rr * 2.2, 4.1, rq); M.ao *= 0.7 + 0.3 * Math.min(1, (1 - rr) * 4 + 0.4); M.er += 0.2; M.eg += 0.12; M.eb += 0.15; if (rr > 0.95) { nacre(K, x * 3, d * 3, 1, 3.3, 0.4); M.r += 0.04; M.g += 0.04; M.b += 0.04; } });
    const c = S.c; c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createRadialGradient(-0.45, -BH - Hc - D * 0.9, 0.05, -0.2, -BH - Hc - D * 0.6, R * 1.1); g.addColorStop(0, 'rgba(255,248,250,.3)'); g.addColorStop(1, 'rgba(255,248,250,0)'); c.fillStyle = g; c.fillRect(-2, -3, 4, 4); c.restore();
    K.ink(S, [70, 34, 52], 0.45); }
  // the upper valve raised (75 degrees): its nacre underside toward us, a disc standing on its hinge, its zigzag rim of ribbed shell, grooves from the hinge
  function paintLidUp(K, S) { const { M, ss, clamp } = K, R = GEO.clamR, Hl = GEO.lidLen, y0 = GEO.hinge, P = S.P, ribs = 14;
    S.lock();
    for (let py = 0; py < S.h; py++) { const Yt = (S.ay - py - 0.5) / P; for (let px = 0; px < S.w; px++) { const X = (px + 0.5 - S.ax) / P;
      const u = X / R, w = (Yt + y0 - Hl / 2) / (Hl / 2), ac = Math.atan2(w, u), rr0 = Math.hypot(u, w), sc = 1 + wave(ac) / R * 0.9;
      if (rr0 > sc + 1.5 / (P * R)) continue; const e = rr0 / sc, ah = Math.atan2(Yt + y0, X);
      K.M0(); M.ao = 0.5 + 0.5 * ss(0.0, 0.75, (w + 1) * 0.5 + 0.15);
      if (e > 0.88) { const rb = Math.cos(ac * ribs), rq = rb * rb; shellOut(K, X * 2, Yt, 2.7, rq); M.ao *= 0.92; nsh(K, u * 0.9, 0.45, w * 0.9); }
      else { nacre(K, X * 1.1, Yt * 1.2, 1, 9.1, 1.1); const gr = Math.cos(ah * ribs * 1.4); M.ao *= 0.82 + 0.18 * gr * gr; M.cc = 1; M.rg = 0.14; const pl = 0.22 * (1 - Math.min(1, Math.hypot(u, w + 0.6) * 0.7)); M.er += 0.1 + pl; M.eg += 0.08 + pl * 0.8; M.eb += 0.1 + pl; nsh(K, -u * 0.6, 1, -w * 0.6); }
      K.put(S, px, py, clamp((sc - rr0) * R * P + 0.5, 0, 1)); } }
    S.unlock(); const c = S.c;
    c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(0, y0 - Hl, 0, y0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.75, 'rgba(60,20,50,.06)'); g.addColorStop(1, 'rgba(60,20,50,.28)'); c.fillStyle = g; c.fillRect(-2, y0 - Hl - 0.2, 4, Hl + 0.3); c.restore();
    K.ink(S, [70, 34, 52], 0.45); }

  /* ======================= the great moon gate ======================= */
  // the ring standing upright (its front face toward us): a flat front with bevelled edges, the top of its outer side and the floor of its hole seen from above
  function ringSolid(K, S, cx, cy, Ri, Ro, dep, mat) { const { M, clamp } = K, P = S.P, KK = K.K * dep, bv = 0.07;
    const xa = Math.max(0, Math.floor(S.ax + (cx - Ro) * P) - 2), xb = Math.min(S.w - 1, Math.ceil(S.ax + (cx + Ro) * P) + 2), ya = Math.max(0, Math.floor(S.ay - (cy + Ro + KK) * P) - 2), yb = Math.min(S.h - 1, Math.ceil(S.ay - (cy - Ro) * P) + 2);
    S.lock();
    for (let py = ya; py <= yb; py++) { const Yt = (S.ay - py - 0.5) / P; for (let px = xa; px <= xb; px++) { const X = (px + 0.5 - S.ax) / P, dx = X - cx, dy = Yt - cy, d = Math.hypot(dx, dy);
      if (d >= Ri - 0.5 / P && d <= Ro + 0.5 / P) { // the front face, its edges bevelled
        const eo = Ro - d, ei = d - Ri, q = eo < bv ? 1 - eo / bv : ei < bv ? -(1 - ei / bv) : 0, rx = dx / (d || 1), rz = dy / (d || 1), nx = rx * q * 0.8, nz = rz * q * 0.8, ny = Math.sqrt(Math.max(0.05, 1 - nx * nx - nz * nz));
        K.M0(); M.ao = 1; mat('f', dx, dy, d, Math.atan2(dy, dx)); K.shade(nx, ny, nz); K.put(S, px, py, clamp(eo * P + 0.5, 0, 1) * clamp(ei * P + 0.5, 0, 1)); continue; }
      if (d > Ro && dy > -0.2) { const s2 = Ro * Ro - dx * dx; if (s2 > 0) { const zs = Math.sqrt(s2), k = dy - zs; if (k >= 0 && k <= KK) { // the outer side's top, seen from above
        K.M0(); M.ao = 0.75 + 0.25 * (1 - k / KK); mat('o', dx, zs, k / KK, Math.atan2(zs, dx)); nsh(K, dx / Ro * 0.7, 0.25, zs / Ro * 0.9 + 0.2); K.put(S, px, py, clamp((KK - k) * P + 0.5, 0, 1)); } } continue; }
      if (d < Ri && dy < 0.2) { const s2 = Ri * Ri - dx * dx; if (s2 > 0) { const zs = -Math.sqrt(s2), k = dy - zs; if (k >= 0 && k <= KK) { // the floor of the hole, seen from above
        K.M0(); M.ao = 0.5 + 0.5 * (k / KK); mat('i', dx, zs, k / KK, Math.atan2(zs, dx)); nsh(K, -dx / Ri * 0.6, 0.3, -zs / Ri * 0.9 + 0.1); K.put(S, px, py, clamp(k * P + 0.5, 0, 1) * clamp((KK - k) * P + 0.5, 0, 1)); } } } } }
    S.unlock(); }
  function paintDoor(K, S) { const { M } = K, c = S.c, G = GEO.ring, cy = G.cy, Ri = G.Ri, Ro = G.Ro, px = GEO.pylon, RN = K.R1(9133);
    pool(K, S, 3.0, '170,140,255', 0.8);
    // the pylons either side: dressed moonstone, a gold band, a capital, a crescent on each
    for (const sd of [-1, 1]) { const x = sd * px;
      K.rbox(S, x, 0, 0.5, 0.36, 0, 0.32, 0.05, (f, u, v, ao) => moon(K, u + x, v, ao, 3.1, 0.6, 0.6));
      K.rbox(S, x, 0, 0.4, 0.3, 0.32, 3.15, 0.06, (f, u, v, ao) => { moon(K, u * 1.3 + x, v, ao, 5.7 + sd, 1, 1); const b = Math.abs(v - 2.3); if (f === 'f' && b < 0.06) goldM(K, u, v, b / 0.06); if (f === 'f' && Math.abs(u) > 0.3) M.ao *= 0.85; });
      K.rbox(S, x, 0, 0.5, 0.36, 3.15, 3.38, 0.05, (f, u, v, ao) => { moon(K, u + x, v, ao, 8.3, 0, 0.8); if (f === 'f' && v > 3.3) goldM(K, u, v, 0.4); });
      S.unlock();
      const pts = []; for (let i = 0; i <= 20; i++) { const a = -0.25 * Math.PI + i / 20 * 1.5 * Math.PI; pts.push([x + Math.cos(a) * 0.32 * -sd, -3.82 + Math.sin(a) * 0.32]); }
      K.tube(S, pts.slice(0, 11), 0.035, 0.1, (t, s2, ao) => { moon(K, t * 3 + x, s2, ao, 2.2, 0, 1.3); M.er += 0.04; M.eb += 0.08; });
      K.tube(S, pts.slice(10), 0.1, 0.035, (t, s2, ao) => { moon(K, t * 3 + x + 1, s2, ao, 2.2, 0, 1.3); M.er += 0.04; M.eb += 0.08; }); S.unlock(); }
    // the plinth the ring stands on
    K.rbox(S, 0, 0, 2.55, 0.42, 0, 0.2, 0.05, (f, u, v, ao) => { moon(K, u, v * 2, ao, 1.7, 0.8, 0.5); if (f === 't' && Math.abs(v) < 0.05) goldM(K, u, v, 0.3); }); S.unlock();
    // the ring: moonstone with eight moon phases carved round it, a gold band at its inner and outer lip, kintsugi across it
    ringSolid(K, S, 0, cy, Ri, Ro, G.dep, (face, dx, dy, d, an) => {
      if (face === 'f') { const rn = (d - Ri) / (Ro - Ri); moon(K, dx * 1.2, dy * 1.2, 1, 4.4, 1.2, 1.1);
        if (rn < 0.07 || rn > 0.93) { goldM(K, dx, dy, Math.abs(rn - (rn < 0.5 ? 0.035 : 0.965)) / 0.035); return; }
        // the phases: eight discs carved round the band, each lit to its phase (the carving's floor darker, a bright lit side)
        const k = Math.round((an + Math.PI / 2) / (TAU / 8)), ac = k * TAU / 8 - Math.PI / 2, rm = (Ri + Ro) / 2, mx = Math.cos(ac) * rm, my = Math.sin(ac) * rm, md = Math.hypot(dx - mx, dy - my), mr = 0.19;
        if (md < mr) { const ph = ((k % 8) + 8) % 8, sh = Math.cos(ph / 8 * TAU), lx = (dx - mx) / mr, ly = (dy - my) / mr, inLit = lx > sh * Math.sqrt(Math.max(0, 1 - ly * ly)); M.ao *= md > mr - 0.025 ? 0.55 : 0.85; if (inLit && md < mr - 0.03) { M.r += 0.12; M.g += 0.12; M.b += 0.16; M.er += 0.08; M.eg += 0.08; M.eb += 0.14; } }
        else if (Math.abs(rn - 0.5) > 0.36) M.ao *= 0.9; }
      else if (face === 'o') { moon(K, dx * 2, dy * 3, 1, 6.1, 0.4, 0.8); M.ao *= 0.95; }
      else { moon(K, dx * 2, dy * 3, 1, 7.3, 0, 0.6); M.r *= 0.85; M.g *= 0.82; M.b *= 0.92; } });
    // finishing: the keystone crescent over the ring, glints on its gold, dust of light
    const kp = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * 1.12 + i / 24 * Math.PI * 0.76; kp.push([Math.cos(a) * 0.5, -(cy + Ro + 0.4) - Math.sin(a) * 0.42]); }
    K.tube(S, kp.slice(0, 13), 0.04, 0.12, (t, s2, ao) => { goldM(K, t, s2, 0.2); }); K.tube(S, kp.slice(12), 0.12, 0.04, (t, s2, ao) => { goldM(K, t, s2, 0.2); }); S.unlock();
    K.glint(c, -Ro * 0.62, -cy - Ro * 0.62, 0.22, 0.85); K.glint(c, Ri * 0.7, -cy + Ri * 0.7, 0.12, 0.6); K.glint(c, -px + 0.2, -3.85, 0.15, 0.7); K.glint(c, px - 0.2, -3.85, 0.15, 0.7);
    specks(c, RN, 0, -cy, Ro, Ro, 90, '230,220,255');
    K.ink(S, [36, 22, 64], 0.5); }
  // a leaf of the gate: a half disc of night-blue stone, its half of the full moon emblem in silver, three crescent sockets (the riddles) down its edge
  function paintLeaf(K, S, v) { const { M, clamp, ss } = K, G = GEO.ring, Ri = G.Ri + 0.04, cy = G.cy, sd = v === 'l' ? -1 : 1, P = S.P;
    S.lock();
    for (let py = 0; py < S.h; py++) { const Yt = (S.ay - py - 0.5) / P; for (let px = 0; px < S.w; px++) { const X = (px + 0.5 - S.ax) / P, dx = X, dy = Yt - cy, d = Math.hypot(dx, dy);
      if (d > Ri + 0.5 / P || dx * sd < -0.5 / P) continue; let nx = 0, nz = 0, ao = 1;
      const er = Ri - d, ec = Math.abs(dx); if (ec < 0.05) { nx = sd * (1 - ec / 0.05) * 0.6; ao = 0.75; }   // the seam where the leaves meet
      K.M0(); darkstone(K, dx * 1.4, dy * 1.4, v === 'l' ? 2.1 : 4.7);
      // the emblem: a full moon of silver in relief, its rim raised
      const me = Math.hypot(dx, dy - 0.05), mr = 0.86; if (me < mr) { const q = me > mr - 0.08 ? (me - (mr - 0.08)) / 0.08 : 0; K.M0(); M.mt = 0.9; M.r = 0.18; M.g = 0.18; M.b = 0.22; M.fr = 0.86; M.fg = 0.86; M.fb = 0.95; M.rg = 0.24 + 0.1 * K.vn(dx * 9, dy * 9); nx += dx / (me || 1) * q * 0.7; nz += (dy - 0.05) / (me || 1) * q * 0.7;
        const mar = K.ss(0.5, 0.66, K.fbm(dx * 1.9 + 5, dy * 1.9 + 2)); M.fr *= 1 - 0.28 * mar; M.fg *= 1 - 0.28 * mar; M.fb *= 1 - 0.2 * mar; M.rg += 0.15 * mar; }
      // the three sockets: crescents down the seam, below and above the emblem
      for (const sy of [1.18, -1.05]) { const cd = Math.hypot(dx, dy - sy), cr2 = 0.2, inner = Math.hypot(dx + sd * 0.07, dy - sy - 0.02); if (cd < cr2 && inner > cr2 * 0.82) { K.M0(); goldM(K, dx, dy, 0.3); ao = 0.9; } }
      // stars carved in the dark field
      const st = K.vn(dx * 13 + sd * 7, dy * 13); if (st > 0.93 && me > mr + 0.05) { M.er += 0.4; M.eg += 0.38; M.eb += 0.55; }
      M.ao = ao * (0.8 + 0.2 * ss(0, 0.3, er)); const l = Math.hypot(nx, 1, nz); K.shade(nx / l, 1 / l, nz / l); K.put(S, px, py, clamp(er * P + 0.5, 0, 1) * clamp((dx * sd) * P + 0.5, 0, 1)); } }
    S.unlock(); K.ink(S, [20, 12, 40], 0.4); }

  /* ======================= the arena's moonstone ======================= */
  function paintPillar(K, S, v) { const { M } = K, c = S.c, sd = 2.3 + v * 1.7, H = v === 2 ? 1.85 : 2.55, RN = K.R1(331 + v * 7);
    pool(K, S, 0.7, '180,150,255', 0.9);
    K.rbox(S, 0, 0, 0.42, 0.36, 0, 0.3, 0.05, (f, u, vv, ao) => { moon(K, u, vv, ao, sd, 0.7, 0.6); if (f === 't' && Math.abs(Math.abs(u) - 0.33) < 0.03) goldM(K, u, vv, 0.4); }); S.unlock();
    const prof = h => h < 0.42 ? 0.31 - 0.06 * K.ss(0.3, 0.42, h) + 0.04 * Math.sin((h - 0.3) / 0.12 * Math.PI) : h > H - 0.16 ? 0.25 + 0.08 * K.ss(H - 0.16, H, h) : 0.25 - 0.02 * (h / H);
    K.rev(S, 0, 0, prof, 0.3, H, { part: 'front', top: true, capMat: (x, h, ao, i, ph, x2, ey) => { moon(K, x * 3, ey, 1, sd, 0, 0.5); if (Math.hypot(x / 0.33, ey) > 0.85) goldM(K, x, ey, 0.4); },
      mat: (u, h, ao, ins, phi) => { const b1 = Math.abs(h - H * 0.34), b2 = Math.abs(h - (H - 0.24)); if (b1 < 0.05 || (v !== 2 && b2 < 0.04)) { goldM(K, u, h, Math.min(b1, b2) / 0.05); return; } moon(K, u * 1.4, h, ao, sd, v === 2 ? 1.6 : 1, 1.1); const f = Math.cos(phi * 8 + sd); M.ao *= 0.8 + 0.2 * f * f; } });
    S.unlock();
    if (v === 0 || v === 3) { const tilt = v === 3 ? 0.35 : 0, pts = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * 0.2 + i / 24 * Math.PI * 1.6 + tilt; pts.push([Math.cos(a) * 0.36, -(H + 0.42) - Math.sin(a) * 0.36]); }
      K.tube(S, pts.slice(0, 13), 0.03, 0.11, (t, s2, ao) => { moon(K, t * 3, s2, ao, sd + 1, 0, 1.4); M.eb += 0.08; M.er += 0.04; }); K.tube(S, pts.slice(12), 0.11, 0.03, (t, s2, ao) => { moon(K, t * 3 + 1, s2, ao, sd + 1, 0, 1.4); M.eb += 0.08; M.er += 0.04; }); S.unlock();
      K.glint(c, -0.3, -(H + 0.6), 0.14, 0.8); }
    if (v === 1) { K.ball(S, 0, -(H + 0.3), 0.3, 0.3, (dx, dy, ao) => { moon(K, dx, dy, ao, sd, 0, 1.6); M.rg = 0.12; M.cc = 1; M.er += 0.06; M.eg += 0.08; M.eb += 0.16; }); S.unlock(); K.glint(c, -0.1, -(H + 0.42), 0.16, 0.9); }
    if (v === 2) { c.save(); for (let i = 0; i < 5; i++) { const x = (RN() - 0.5) * 1.1, y = 0.05 + RN() * 0.2, s = 0.06 + RN() * 0.08; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y - s * 0.7); c.lineTo(x + s, y + 0.01); c.closePath(); c.fillStyle = 'rgba(214,206,236,.85)'; c.fill(); c.strokeStyle = 'rgba(255,214,120,.8)'; c.lineWidth = 0.012; c.stroke(); } c.restore(); }
    specks(c, RN, 0, 0.05, 0.75, 0.25, 30, '230,224,255');
    K.ink(S, [36, 22, 64], 0.5); }
  // a crescent of moonstone afloat: thick at its middle, tapering to two horns; opal light in it
  function paintShard(K, S, v) { const { M } = K, c = S.c, sd = 1.1 + v * 2.9, R = 0.5 + v * 0.08, w = 0.15 + v * 0.02, a0 = [0.6, 1.0, 0.3][v % 3], span = 3.6, pts = [];
    for (let i = 0; i <= 30; i++) { const a = a0 + i / 30 * span; pts.push([Math.cos(a) * R, -0.05 - Math.sin(a) * R * 0.94]); }
    const mat = (t, s2, ao) => { moon(K, t * 3 + sd, s2 * 0.4, ao, sd, 0.5, 1.6); M.rg = 0.16; M.cc = 0.9; M.er += 0.05; M.eg += 0.06; M.eb += 0.14; };
    K.tube(S, pts.slice(0, 16), 0.02, w, mat); K.tube(S, pts.slice(15), w, 0.02, mat); S.unlock();
    const [hx, hy] = pts[9]; K.glint(c, hx, hy, 0.16, 0.9); K.ink(S, [36, 22, 64], 0.45); }

  /* ======================= the shell chamber's pieces ======================= */
  function paintCoral(K, S, v) { const { M } = K, c = S.c, R = K.R1(77 + v * 13), sd = v * 3.1;
    pool(K, S, 0.72, '255,170,200', 0.8);
    K.ball(S, 0, -0.1, 0.5, 0.2, (dx, dy, ao) => { nacre(K, dx, dy, ao, sd, 0.5); M.r *= 0.82; M.g *= 0.74; M.b *= 0.8; M.ao = ao; }); S.unlock();
    const tips = [];
    const branch = (x, y, a, L, r, depth) => { const pts = [[x, y]]; let px = x, py = y, aa = a; for (let i = 0; i < 6; i++) { aa += (R() - 0.5) * 0.35; px += Math.cos(aa) * L / 6; py += Math.sin(aa) * L / 6; pts.push([px, py]); }
      K.tube(S, pts, r, r * 0.55, (t, s2, ao) => { coralM(K, t * 2 + x, s2, sd); M.ao *= 0.8 + 0.2 * ao; }); S.unlock();
      if (depth < 2) { const n = 2; for (let k = 0; k < n; k++) branch(px, py, aa + (k ? 0.42 : -0.4) + (R() - 0.5) * 0.25, L * 0.66, r * 0.68, depth + 1); } else tips.push([px, py, r]); };
    const n = 4 + (v % 2); for (let i = 0; i < n; i++) branch((i - (n - 1) / 2) * 0.16, -0.16, -Math.PI / 2 + (i - (n - 1) / 2) * 0.3, 0.62 + R() * 0.25, 0.1, 0);
    for (const [x, y, r] of tips) { const pr = r * 1.5 + 0.02; K.ball(S, x, y - pr * 0.4, pr, pr, (dx, dy, ao) => { pearlM(K, dx, dy, x); M.ao = ao; }); } S.unlock();
    for (const [x, y] of tips) if (R() < 0.5) K.glint(c, x - 0.02, y - 0.06, 0.07, 0.7);
    K.ink(S, [80, 30, 50], 0.45); }
  function paintScallop(K, S, v) { const { M, clamp, ss } = K, c = S.c, P = S.P, R = 0.62, ribs = 11, sd = v * 2.3 + 0.4, RN = K.R1(51 + v);
    pool(K, S, 0.7, '255,200,220', 0.7);
    // the raised valve behind, then the lower one: fans of ribbed shell (custom: a fan standing on its hinge, lit by its ribs)
    const fan = (y0, Hf, back) => { S.lock(); for (let py = 0; py < S.h; py++) { const Yt = (S.ay - py - 0.5) / P; for (let px = 0; px < S.w; px++) { const X = (px + 0.5 - S.ax) / P, dy = back ? Yt - y0 : (y0 - Yt) * 1, ang = Math.atan2(dy, X), rr = Math.hypot(X / R, dy / Hf);
      if (dy < -0.02 || rr > 1.02) continue; const sc = 1 - 0.05 * (1 - Math.abs(Math.cos(ang * ribs * 0.5))); if (rr > sc + 1.2 / (P * R)) continue; const rb = Math.cos(ang * ribs), rq = rb * rb;
      K.M0(); if (back) { nacre(K, X * 2, Yt * 2, 1, sd, 1); M.ao = 0.7 + 0.3 * rq; M.er += 0.1; M.eg += 0.08; M.eb += 0.1; nsh(K, -X * 0.5, 0.85, -0.2 + rb * 0.25); } else { shellOut(K, X * 2, rr, sd + 1, rq); M.er += 0.12; M.eg += 0.08; M.eb += 0.09; nsh(K, rb * 0.35, 0.4, 0.85); }
      K.put(S, px, py, clamp((sc - rr) * R * P + 0.5, 0, 1)); } } S.unlock(); };
    fan(0.18, 0.75, true); fan(0.22, 0.24, false);
    for (let i = 0; i < 4 + v; i++) { const x = (RN() - 0.5) * 0.6, y = 0.02 + RN() * 0.1, r = 0.05 + RN() * 0.05; K.ball(S, x, -0.2 - y - r, r, r, (dx, dy, ao) => { pearlM(K, dx, dy, x * 7); M.ao = ao; }); } S.unlock();
    K.glint(c, -0.1, -0.42, 0.1, 0.7); K.ink(S, [80, 30, 50], 0.45); }
  // a great rib of the shell's wall: a curved nacre spine rising from the floor and bending inward, ridged
  function paintRib(K, S, v) { const { M } = K, sg = v % 2 ? -1 : 1, pts = [];
    pool(K, S, 0.6, '255,190,215', 0.6);
    for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push([sg * (0.05 + 0.95 * t * t), -t * 2.9]); }
    K.tube(S, pts, 0.24, 0.07, (t, s2, ao) => { nacre(K, t * 3, s2, ao, 3.7 + v, 1); const rg = Math.sin(t * 34); M.ao *= 0.82 + 0.18 * rg * rg; if (Math.abs(s2) > 0.8) { M.r *= 0.92; M.g *= 0.86; } }); S.unlock();
    K.glint(S.c, sg * 0.25, -1.4, 0.1, 0.5); K.ink(S, [70, 34, 52], 0.4); }
  // the great moon (P px per moon radius): a pale disc, its seas violet-grey, rayed craters, the limb a little darker, a soft lit rim
  function paintMoon(K, S) { const { vn, fbm, clamp, ss } = K, P = S.P; S.lock(); const d = S.d;
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, r = Math.hypot(x, y); if (r > 1.0 + 1.5 / P) continue;
      const z = Math.sqrt(Math.max(0, 1 - r * r)), u = x / (z + 0.35), w = y / (z + 0.35), mar = ss(0.48, 0.66, fbm(u * 1.4 + 3.1, w * 1.4 + 1.7)), cr = vn(u * 7 + 2, w * 7 + 9), cr2 = vn(u * 19, w * 19 + 4);
      let L = 0.93 - 0.22 * mar - (cr > 0.8 ? (cr - 0.8) * 0.7 : 0) - (cr2 > 0.86 ? (cr2 - 0.86) * 0.6 : 0) + 0.06 * (fbm(u * 6, w * 6) - 0.5); const limb = 0.62 + 0.38 * Math.pow(z, 0.5); L *= limb;
      const R = L * (0.96 + 0.04 * mar), G = L * (0.94 - 0.04 * mar), B = L * (1.04 + 0.06 * mar), i = (py * S.w + px) * 4, a = clamp((1 - r) * P + 0.5, 0, 1);
      d[i] = clamp(R * 255, 0, 255); d[i + 1] = clamp(G * 255, 0, 255); d[i + 2] = clamp(B * 255, 0, 255); d[i + 3] = a * 255; }
    S.unlock(); }

  /* ======================= the pictures ======================= */
  const DEFS = {
    clam: { light: 'oracle', box: () => [-2.3, -1.85, 2.3, 0.85], paint: paintClam },
    lid: { light: 'oracle', box: () => [-1.6, -1.95, 1.6, -0.2], paint: paintLid },
    lidup: { light: 'oracle', box: () => [-1.55, -(GEO.lidLen - GEO.hinge) - 0.15, 1.55, GEO.hinge + 0.15], paint: paintLidUp },
    door: { light: 'lunar', box: () => [-3.5, -4.8, 3.5, 0.75], paint: paintDoor },
    leaf: { light: 'lunar', box: v => v === 'l' ? [-1.7, -(GEO.ring.cy + 1.7), 0.08, -(GEO.ring.cy - 1.7)] : [-0.08, -(GEO.ring.cy + 1.7), 1.7, -(GEO.ring.cy - 1.7)], paint: paintLeaf },
    pillar: { light: 'lunar', box: () => [-1.0, -3.6, 1.0, 0.5], paint: paintPillar },
    shard: { light: 'lunar', box: () => [-0.85, -1.05, 0.85, 0.65], paint: paintShard },
    coral: { light: 'oracle', box: () => [-1.15, -2.6, 1.15, 0.5], paint: paintCoral },
    scallop: { light: 'oracle', box: () => [-0.95, -1.3, 0.95, 0.45], paint: paintScallop },
    rib: { light: 'oracle', box: v => v % 2 ? [-1.45, -3.25, 0.6, 0.35] : [-0.6, -3.25, 1.45, 0.35], paint: paintRib },
    moon: { light: 'lunar', box: () => [-1.02, -1.02, 1.02, 1.02], paint: paintMoon } };
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  function paint(name, v, P) { const B = BP(); if (!B) return null; const K = B.kit, D = DEFS[name], b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); lit(K, D.light, () => { D.paint(K, S, v); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('CANCER_PROPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = document.createElement('canvas'); cv.width = S.w; cv.height = S.h; cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (the work canvas, read back often, given back at once: the plain copy is kept)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  const keyOf = (name, v, P) => name + '|' + v + '|' + P;
  function sprite(name, v, P, force) { if (!DEFS[name] || !BP()) return null; P = Math.max(8, Math.round(P || BASE || 48)); const key = keyOf(name, v, P); let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 12) return null;   // (a painting budget: what does not fit waits a frame)
    s = paint(name, v, P); if (s) CACHE.set(key, s); return s; }
  // the picture for a tile: always at the floor's sharpness (BASE: TS x SK, as the engine's own props), scaled to the zoom; a picture
  // not painted at loading is painted within a small budget a frame. Before the stage's sharpness is known nothing is painted
  function pick(c, name, v) { if (!BASE) return null; const PB = name === 'moon' ? moonP(BASE) : BASE, s = CACHE.get(keyOf(name, v, PB)); return s || sprite(name, v, PB); }
  function draw(c, name, v, Xs, Ys, T, o) { const s = pick(c, name, v, T); if (!s) { STATS.misses++; return false; } o = o || {}; const f = T / s.P, sx = o.sx == null ? 1 : o.sx, sy = o.sy == null ? 1 : o.sy; STATS.draws++;
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.translate(Xs, Ys); if (o.rot) c.rotate(o.rot); if (sx !== 1 || sy !== 1) c.scale(sx, sy); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); return true; }
  /* the loading screen's jobs: every picture the gate draws, at the floor's sharpness */
  const WARM = [['clam', 0], ['lid', 0], ['lidup', 0], ['door', 0], ['leaf', 'l'], ['leaf', 'r'], ['shard', 0], ['shard', 1], ['shard', 2], ['rib', 0], ['rib', 1], ['moon', 0]];
  function warm(P) { if (!BP() || !(P > 2)) return []; BASE = Math.round(P); return WARM.map(([n, v]) => () => { sprite(n, v, n === 'moon' ? moonP(BASE) : BASE, true); }); }
  const MOON_R = 3.4;   // (the moon's radius in tiles as the backdrop draws it)
  const moonP = P => Math.round(P * MOON_R);
  /* everything let go (the gate's stage closed): the pictures' memory given back at once (WebKit caps a page's canvases) */
  function release() { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); BASE = 0; }

  /* ======================= the engine's props (breakable): their pictures painted straight into the engine's prop cache ======================= */
  const PROP_OF = { cxpillar: 'pillar', cxcoral: 'coral', cxscallop: 'scallop' };
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS;
    for (const [kind, name] of Object.entries(PROP_OF)) { if (PR[kind] && PR[kind].__cxp) continue;
      const f = function (c, P, v) { const s = paint(name, name === 'scallop' ? v % 2 : v % 4, Math.max(8, Math.round(P))); if (!s) return; c.drawImage(s.cv, -s.ax, -s.ay); s.cv.width = s.cv.height = 1; };   // (painted once into the engine's own cached picture; our copy given back)
      f.__cxp = 1; PR[kind] = f; }
    if (typeof window !== 'undefined') { window.PROP_EXT = window.PROP_EXT || {}; Object.assign(window.PROP_EXT, { cxpillar: [2.4, 3.9], cxcoral: [2.6, 2.9], cxscallop: [2.2, 1.6] }); }
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) Object.assign(BREAK_FX.KIND, { cxpillar: { mat: 'stone', cols: ['#D8D2EC', '#8E84B4', '#FFF2C8'] }, cxcoral: { mat: 'coral', cols: ['#F2A0B8', '#B8607A', '#FFF0F4'] }, cxscallop: { mat: 'coral', cols: ['#F4D8D4', '#B08A88', '#FFFFFF'] } });
    if (typeof PROP_EL !== 'undefined') Object.assign(PROP_EL, { cxpillar: 'prism', cxcoral: 'bubble', cxscallop: 'bubble' }); }
  install();

  // (the stage says its sharpness as it is made, so nothing is painted at a passing zoom before the loading's own pictures)
  const setBase = P => { if (P > 2) BASE = Math.round(P); };
  const API = { draw, sprite: (n, v, P) => sprite(n, v, P, true), has: n => !!DEFS[n] && !!BP(), warm, release, setBase, GEO, MOON_R, moonP, DEFS, LIGHT, install, get base() { return BASE; }, get stats() { return Object.assign({ cached: CACHE.size }, STATS); } };
  if (typeof window !== 'undefined') window.CANCER_PROPS = API;
  return API;
})();
