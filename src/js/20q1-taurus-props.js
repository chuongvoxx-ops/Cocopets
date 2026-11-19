/* ---------- v426 TG: the Gate of Taurus's pictures (the Star Vault and the Court of the World Pillar) ----------
   Every solid piece of the gate is painted once, at the floor's sharpness, by the Drowned Belfry's software shading pass
   (BELPROPS.kit, 20n9: each pixel of a solid gets a normal and a material and is lit), in a light of its own: the vault's
   ("vault": a cold starlight key, night-blue sky in the reflections, an amber rim from the braziers) and the court's
   ("dusk": a low gold sun, violet dusk in the reflections, an amber rim). Materials: ivory stone, obsidian, antique gold,
   old bronze, amber light. Then each is finished with a little 2D detail (glints, an ink edge). Nothing here is painted per
   frame: the frame lays the pictures down; what glows or moves is the gate's own GPU light over them (20q).
   Pictures (name, v): node (a star's dais: an ivory drum, a bronze band, an obsidian star in a gold rim), door (the great
   door: obsidian jambs inlaid with gold, a lintel with the three sky studs and the bull's sign, a crest of bronze horns
   ringed in gold round a dark core), leaf (v 'l' | 'r': its two bronze leaves), brazier (a bronze bowl with horn handles
   on an ivory plinth), arch (v 0: the great broken arch on the court's north rim; v 1: a lone pier and its springer),
   monolith (v 0..2: floating obsidian slabs with gold glyphs), debris (v 0..2: chunks of stone held by the pull), sun
   (the dusk sun behind the court). Engine props (DunWorld.PROPS, breakable through BREAK_FX): tgcolumn (v 0..1: the
   vault's obsidian columns with bronze horn capitals), tgruin (v 0..3: the court's colossal ivory pillars, broken).
   API (global TAURUS_PROPS): draw(c, name, v, Xs, Ys, T, o) the picture with its feet at Xs, Ys (o: { alpha, sx, sy, rot })
   -> false when it is not painted yet; sprite(name, v, P); warm(P) -> jobs for the loading screen; release() frees every
   picture (the gate calls it when its stage closes); setBase(P); GEO (the door's numbers, shared with the gate).
   window.__TGP = 0 turns the pictures off (the gate then draws nothing of them). */
var TAURUS_PROPS = (() => {
  const TAU = Math.PI * 2;
  const BP = () => (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.kit && window.__BELP !== 0 && window.__TGP !== 0) ? window.BELPROPS : null;
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0 };
  const LIGHT = {
    vault: { a0: [0.08, 0.09, 0.17], a1: [0.1, 0.1, 0.18], e0: [0.07, 0.08, 0.18], e1: [0.42, 0.46, 0.72], k: [1.12, 1.08, 1.04], rim: [0.6, 0.4, 0.16], bo: [0.12, 0.08, 0.03] },
    dusk: { a0: [0.16, 0.12, 0.12], a1: [0.1, 0.09, 0.15], e0: [0.18, 0.12, 0.1], e1: [0.6, 0.5, 0.48], k: [1.32, 1.1, 0.84], rim: [0.62, 0.42, 0.2], bo: [0.1, 0.07, 0.05] } };
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT[name] || {}); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  // the door's measures (tiles): the doorway's half width and height, the plinth, the jambs, the lintel
  const GEO = { WO: 1.22, PZ: 0.2, JW: 0.6, JD: 0.42, L0: 3.25, L1: 3.95, stud: [-0.72, 0, 0.72], studZ: 3.6, crestZ: 4.55 };

  /* ======================= materials ======================= */
  function ivory(K, u, v, ao, sd) { const { M, vn, fbm, ss } = K, w = fbm(u * 2.6 + sd, v * 2.6 + sd * 0.7), p = vn(u * 27 + sd, v * 27), t = 0.84 + 0.2 * w;
    M.r = 0.86 * t; M.g = 0.8 * t; M.b = 0.67 * t; M.rg = 0.62; M.cc = 0.12; if (p > 0.76) M.ao *= 1 - (p - 0.76) * 1.6;
    const dirt = (1 - ao) * 0.45 + ss(0.58, 0.86, vn(u * 3 + sd, v * 1.4)) * 0.16; M.r *= 1 - dirt * 0.45; M.g *= 1 - dirt * 0.52; M.b *= 1 - dirt * 0.6; }
  function obsid(K, u, v, sd) { const { M, vn, fbm } = K, w = fbm(u * 3 + sd, v * 3), rp = Math.sin((u * 5 + v * 3 + w * 4) * 3); M.r = 0.05 + 0.03 * w; M.g = 0.045 + 0.025 * w; M.b = 0.065 + 0.04 * w; M.rg = 0.1 + 0.1 * vn(u * 9, v * 9 + sd) + 0.04 * rp; M.cc = 0.85; }
  function goldM(K, u, v, e) { const M = K.M, w = K.vn(u * 13, v * 13); M.mt = 1; M.r = 0.28; M.g = 0.2; M.b = 0.08; M.fr = 0.92 * (0.88 + 0.16 * w); M.fg = 0.7 * (0.88 + 0.16 * w); M.fb = 0.32; M.rg = 0.2 + 0.15 * (e || 0) + 0.12 * w; M.cc = 0; }
  function bronzeM(K, u, v, ao, sd, wear) { const { M, vn, clamp, ss, lerp } = K, s = vn(u * 4 + sd, v * 4), s2 = vn(u * 15, v * 15 + sd), pt = clamp((1 - ao) * 0.8 + ss(0.6, 0.86, s * 0.7 + s2 * 0.4) * 0.5, 0, 1) * (1 - (wear || 0));
    M.mt = 1 - pt * 0.7; M.r = lerp(0.3, 0.13, pt); M.g = lerp(0.18, 0.19, pt); M.b = lerp(0.08, 0.13, pt); M.fr = lerp(0.72, 0.34, pt) * (0.85 + 0.25 * s2); M.fg = lerp(0.45, 0.31, pt) * (0.85 + 0.25 * s2); M.fb = lerp(0.22, 0.2, pt); M.rg = lerp(0.3, 0.7, pt); }
  const amber = (K, k) => { const M = K.M; M.er += 0.95 * k; M.eg += 0.52 * k; M.eb += 0.1 * k; };
  function pool(K, S, rx, col, a) { const c = S.c; K.contact(S, 0.03, 0.03, rx * 0.9, rx * 0.9 * K.K, 0.5); c.save(); c.scale(1, K.K); const g = c.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx * 1.3); g.addColorStop(0, `rgba(${col},${0.2 * a})`); g.addColorStop(0.6, `rgba(${col},${0.08 * a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx * 1.3, 0, TAU); c.fill(); c.restore(); }
  // a jagged break: everything above a ragged line at height h (tiles up) erased, between x0 and x1
  function breakTop(S, x0, x1, h, amp, sd) { const c = S.c, R = S.R || (S.R = (s => { let x = s >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; })(sd * 977 + 13));
    c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(x0 - 0.3, -h - 9); c.lineTo(x0 - 0.3, -h); const n = 9; for (let i = 0; i <= n; i++) c.lineTo(x0 + (x1 - x0) * i / n, -h - (R() - 0.5) * amp * 2 - Math.sin(i * 1.7 + sd) * amp * 0.5); c.lineTo(x1 + 0.3, -h); c.lineTo(x1 + 0.3, -h - 9); c.closePath(); c.fill(); c.restore(); }

  /* ======================= the vault ======================= */
  // a star's dais: a low ivory drum, a bronze band, its top an obsidian eight-pointed star in a gold rim
  function paintNode(K, S) { const { M } = K, R = 0.52;
    pool(K, S, 0.72, '140,160,255', 0.8);
    K.rev(S, 0, 0, h => R + (h < 0.05 ? 0.04 : 0) - (h > 0.2 ? 0.03 : 0), 0, 0.24, { mat: (u, h, ao) => { if (Math.abs(h - 0.12) < 0.035) { bronzeM(K, u * 3, h * 3, ao, 1.3, 0.35); return; } ivory(K, u * 2, h * 3, ao, 2.2); },
      top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const xr = x / (R - 0.03), r = Math.hypot(xr, ey), a = Math.atan2(ey, xr); if (r > 0.86) { goldM(K, x, ey, 0.2); return; }
        const st = 0.3 + 0.42 * Math.pow(Math.abs(Math.cos(a * 4)), 5); if (r < st) { obsid(K, x * 4, ey * 4, 3.3); if (Math.abs(r - st) < 0.05) goldM(K, x, ey, 0.4); } else { ivory(K, x * 3, ey * 3, 1, 4.1); M.ao *= 0.9; } } });
    S.unlock(); K.glint(S.c, -0.22, -0.3, 0.1, 0.6); K.ink(S, [18, 16, 40], 0.45); }
  // the great door: plinth, obsidian jambs inlaid with gold, the lintel, a crest of horns ringed in gold round a dark core
  function paintDoor(K, S) { const { M } = K, c = S.c, G = GEO, jx = G.WO + G.JW, RN = K.R1(4410);
    pool(K, S, 3.0, '255,190,110', 0.7);
    K.rbox(S, 0, 0, 3.0, 0.62, 0, G.PZ, 0.05, (f, u, v, ao) => { ivory(K, u, v * 2, ao, 1.7); if (f === 't' && Math.abs(v + 0.5) < 0.06) goldM(K, u, v, 0.3); if (f === 'f' && v > G.PZ - 0.035) goldM(K, u, v, 0.4); }); S.unlock();
    for (const sd of [-1, 1]) { const x = sd * jx;
      K.rbox(S, x, 0, G.JW, G.JD, G.PZ, G.L0, 0.06, (f, u, v, ao) => { const lu = u * sd; if (f === 't') { ivory(K, u, v, ao, 5); return; }
        const inset = Math.abs(lu) < G.JW - 0.14 && v > 0.62 && v < G.L0 - 0.36; if (!inset) { ivory(K, u * 1.4, v, ao, 5.7 + sd); if (Math.abs(v - 0.42) < 0.05 || Math.abs(v - (G.L0 - 0.18)) < 0.05) bronzeM(K, u * 3, v * 3, ao, 2, 0.3); return; }
        obsid(K, u * 2, v, 2.2 + sd); const gl = Math.abs(lu) < 0.025 && v > 0.8 && v < G.L0 - 0.55, star = Math.hypot(lu, v - 1.85) < 0.1, ring = Math.abs(Math.hypot(lu, v - 1.85) - 0.2) < 0.02; if (gl || star || ring) goldM(K, u, v, 0.25); if (Math.abs(Math.abs(lu) - (G.JW - 0.14)) < 0.02) M.ao *= 0.6; }); S.unlock(); }
    // the lintel: obsidian, gold borders, the bull's sign at its middle, three studs (lit by the gate as each sky is traced)
    K.rbox(S, 0, 0, jx + G.JW + 0.12, G.JD + 0.06, G.L0, G.L1, 0.06, (f, u, v, ao) => { if (f === 't') { ivory(K, u, v, ao, 8); return; } obsid(K, u, v * 2, 6.1);
      if (Math.abs(v - G.L0 - 0.06) < 0.03 || Math.abs(v - G.L1 + 0.06) < 0.03) goldM(K, u, v, 0.2);
      for (const sx of G.stud) { const d = Math.hypot(u - sx, v - G.studZ); if (sx !== 0 && d < 0.11) { goldM(K, u, v, d / 0.11); M.ao *= 0.8 + 0.2 * (1 - d / 0.11); } }
      const zc = G.studZ - 0.08, dc = Math.hypot(u, v - zc), cz2 = zc + 0.13 + 0.17; if (Math.abs(dc - 0.13) < 0.028) goldM(K, u, v, 0.2); if (Math.abs(Math.hypot(u, v - cz2) - 0.17) < 0.028 && v < cz2 + 0.03) goldM(K, u, v, 0.2); }); S.unlock();
    // the crest: two bronze horns sweeping up from a dark core, a gold ring round each tip
    const cz = G.crestZ; for (const sd of [-1, 1]) { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16, a = Math.PI * (0.05 + 0.62 * t); pts.push([sd * (0.25 + Math.sin(a) * 1.25), -(cz - 0.2) + (1 - Math.cos(a)) * -0.55 + t * t * -0.25]); }
      K.tube(S, pts, 0.22, 0.05, (t, s2, ao) => { bronzeM(K, t * 3 + sd, s2, ao, 3.1 + sd, t > 0.7 ? 0.7 : 0.2); if (t > 0.86) goldM(K, t, s2, 0.3); }); S.unlock();
      const [tx, ty] = pts[12], rp = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; rp.push([tx + Math.cos(a) * 0.2, ty + Math.sin(a) * 0.07]); }
      K.tube(S, rp.filter((p, i) => i <= 12), 0.038, 0.038, (t, s2, ao) => goldM(K, t, s2, 0.2)); S.unlock(); }
    K.ball(S, 0, -(cz - 0.05), 0.3, 0.3, (dx, dy, ao) => { obsid(K, dx * 2, dy * 2, 4.4); const cr = Math.abs(K.vn(dx * 5 + 3, dy * 5) - 0.5); if (cr < 0.04) amber(K, 1 - cr / 0.04); M.ao = ao; }); S.unlock();
    const rr = []; for (let i = 0; i <= 40; i++) { const a = -0.15 * Math.PI + i / 40 * 1.3 * Math.PI; rr.push([Math.cos(a) * 0.48, -(cz - 0.05) + Math.sin(a) * 0.12]); }
    K.tube(S, rr, 0.028, 0.028, (t, s2, ao) => goldM(K, t, s2, 0.25)); S.unlock();
    K.glint(c, -jx - 0.3, -G.L0 + 0.1, 0.16, 0.6); K.glint(c, jx + 0.3, -G.L1 + 0.1, 0.14, 0.5); K.glint(c, -0.95, -(cz + 0.6), 0.18, 0.8); K.glint(c, 0.1, -(cz + 0.15), 0.12, 0.7);
    c.save(); for (let i = 0; i < 70; i++) { const x = (RN() - 0.5) * 6, y = -RN() * 4.8; c.fillStyle = `rgba(255,226,160,${(0.15 + RN() * 0.4).toFixed(2)})`; c.fillRect(x, y, 0.012, 0.012); } c.restore();
    K.ink(S, [26, 18, 24], 0.5); }
  // a leaf: bronze in three panels, gold studs, half of the bull's medallion at the seam
  function paintLeaf(K, S, v) { const { M, clamp } = K, G = GEO, sd = v === 'l' ? -1 : 1, P = S.P, top = G.L0 + 0.2;
    S.lock();
    for (let py = 0; py < S.h; py++) { const Yt = (S.ay - py - 0.5) / P; if (Yt < G.PZ - 0.02 || Yt > top) continue; for (let px = 0; px < S.w; px++) { const X = (px + 0.5 - S.ax) / P, lx = X * sd; if (lx < -0.5 / P || lx > G.WO + 0.1) continue;
      let nx = 0, nz = 0, ao = 1; K.M0(); bronzeM(K, X * 1.3, Yt * 1.3, 0.85, v === 'l' ? 2.1 : 4.7, 0.35);
      if (lx < 0.04) { nx = sd * (1 - lx / 0.04) * 0.6; ao = 0.6; }
      // the panels' raised frames
      const fx = G.WO - lx, bands = [0.75, 1.75, 2.65]; let fr = Math.min(fx, lx + 0.02 > 0.12 ? 9 : 9); for (const b of bands) fr = Math.min(fr, Math.abs(Yt - b)); if (fx < 0.12 || bands.some(b => Math.abs(Yt - b) < 0.06)) { nz += 0.25; M.fr *= 1.12; M.fg *= 1.08; } else ao *= 0.92;
      // studs
      const sx = ((lx * 4.2) % 1) - 0.5, sy = ((Yt * 3.6) % 1) - 0.5, sdd = Math.hypot(sx, sy); if (sdd < 0.14 && lx > 0.18 && lx < G.WO - 0.18 && Math.hypot(lx, Yt - 1.75) > 0.75) { goldM(K, X, Yt, 0.2); nx += sx * 2.2 * sd; nz -= sy * 2.2; }
      // the medallion: a gold ring, the bull's sign (a disc with a crescent of horns over it) in relief
      const md = Math.hypot(lx, Yt - 1.75); if (md < 0.68) { if (Math.abs(md - 0.6) < 0.05) { goldM(K, X, Yt, 0.15); nz += (Yt - 1.75) / md * 0.3; } else if (md < 0.55) { K.M0(); obsid(K, X * 2, Yt * 2, 5.5); const dd = Math.hypot(lx, Yt - 1.58), hc = Math.hypot(lx, Yt - 2.04); if (Math.abs(dd - 0.19) < 0.045 || (Math.abs(hc - 0.27) < 0.045 && Yt < 2.08)) goldM(K, X, Yt, 0.2); } }
      M.ao = ao; const l = Math.hypot(nx, 1, nz); K.shade(nx / l, 1 / l, nz / l); K.put(S, px, py, clamp((G.WO + 0.1 - lx) * P + 0.5, 0, 1) * clamp(lx * P + 1, 0, 1)); } }
    S.unlock(); K.ink(S, [26, 16, 10], 0.35); }
  // a brazier: an ivory plinth, a bronze bowl with horn handles, embers in it (its fire is the GPU's)
  function paintBrazier(K, S) { const { M } = K;
    pool(K, S, 0.75, '255,170,80', 1);
    K.rbox(S, 0, 0, 0.34, 0.3, 0, 0.62, 0.05, (f, u, v, ao) => { ivory(K, u * 2, v * 2, ao, 3.3); if (f === 'f' && Math.abs(v - 0.5) < 0.035) goldM(K, u, v, 0.3); }); S.unlock();
    K.rev(S, 0, -0.12, h => h < 0.75 ? 0.1 : 0.1 + Math.pow((h - 0.75) / 0.32, 1.6) * 0.34, 0.62, 1.07, { mat: (u, h, ao) => { bronzeM(K, u * 3, h * 3, ao, 1.9, h > 1.02 ? 0.8 : 0.2); if (Math.abs(h - 0.96) < 0.025) goldM(K, u, h, 0.3); }, top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const r = Math.hypot(x / 0.44, ey); if (r > 0.9) { bronzeM(K, x, ey, 1, 1.2, 0.8); return; } M.r = 0.08; M.g = 0.05; M.b = 0.04; M.rg = 0.8; const e = K.vn(x * 14, ey * 6 + 2); amber(K, 0.25 + 0.9 * K.ss(0.45, 0.85, e)); } });
    S.unlock();
    for (const sd of [-1, 1]) { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, a = t * 2.3; pts.push([sd * (0.4 + Math.sin(a) * 0.22), -0.98 - (1 - Math.cos(a)) * 0.22]); } K.tube(S, pts, 0.05, 0.015, (t, s2, ao) => bronzeM(K, t * 2, s2, ao, 4 + sd, t > 0.7 ? 0.8 : 0.3)); S.unlock(); }
    K.glint(S.c, -0.25, -1.02, 0.12, 0.7); K.ink(S, [26, 18, 10], 0.45); }
  // the vault's columns (an engine prop): obsidian, fluted, bronze bands, a capital of bronze horns cupping an amber orb (v 0) or a gold ring (v 1)
  function paintColumn(K, S, v) { const { M } = K, H = 2.55;
    pool(K, S, 0.8, '255,190,110', 0.6);
    K.rbox(S, 0, 0, 0.44, 0.38, 0, 0.32, 0.05, (f, u, vv, ao) => { ivory(K, u, vv, ao, 2.3 + v); if (f === 'f' && vv > 0.27) goldM(K, u, vv, 0.4); }); S.unlock();
    K.rev(S, 0, 0, h => h > H - 0.2 ? 0.27 + 0.08 * K.ss(H - 0.2, H, h) : 0.26, 0.32, H, { part: 'front', top: true, capMat: (x, h, ao, i, ph, x2, ey) => ivory(K, x * 3, ey, 1, 3.1),
      mat: (u, h, ao, ins, phi) => { if (Math.abs(h - 0.55) < 0.05 || Math.abs(h - (H - 0.3)) < 0.05) { bronzeM(K, u * 3, h * 3, ao, 1.1, 0.4); return; } obsid(K, u * 1.4, h, 2.3 + v); const f = Math.cos(phi * 9); M.ao *= 0.75 + 0.25 * f * f; if (Math.abs(h - 1.45) < 0.012) goldM(K, u, h, 0.3); } });
    S.unlock();
    for (const sd of [-1, 1]) { const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, a = t * 2.0; pts.push([sd * (0.18 + Math.sin(a) * 0.36), -(H + 0.02) - (1 - Math.cos(a)) * 0.34]); } K.tube(S, pts, 0.09, 0.02, (t, s2, ao) => { bronzeM(K, t * 3, s2, ao, 2 + sd, t > 0.6 ? 0.7 : 0.2); if (t > 0.88) goldM(K, t, s2, 0.3); }); S.unlock(); }
    if (v === 0) { K.ball(S, 0, -(H + 0.32), 0.2, 0.2, (dx, dy, ao) => { M.r = 0.5; M.g = 0.28; M.b = 0.06; M.rg = 0.1; M.cc = 1; amber(K, 0.4 + 0.5 * (1 - Math.hypot(dx, dy))); }); S.unlock(); }
    else { const rp = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * TAU; rp.push([Math.cos(a) * 0.3, -(H + 0.3) + Math.sin(a) * 0.3]); } K.tube(S, rp, 0.035, 0.035, (t, s2, ao) => goldM(K, t, s2, 0.2)); S.unlock(); }
    K.glint(S.c, -0.12, -(H + 0.45), 0.14, 0.7); K.ink(S, [20, 16, 30], 0.5); }

  /* ======================= the court ======================= */
  // the colossal pillars (an engine prop): ivory drums on an obsidian plinth, gold bands; broken (v 0 tall, v 1 a stump and a fallen drum, v 3 broken with a drum held aloft by the pull), whole with its capital (v 2)
  function paintRuin(K, S, v) { const { M } = K, c = S.c, H = [3.3, 1.15, 3.6, 2.2][v], R0 = 0.44, sd = 1.7 + v * 2.3;
    pool(K, S, 0.95, '255,200,120', 0.7);
    K.rbox(S, 0, 0, 0.62, 0.52, 0, 0.36, 0.05, (f, u, vv, ao) => { obsid(K, u * 2, vv * 2, sd); if (f === 'f' && Math.abs(vv - 0.28) < 0.03) goldM(K, u, vv, 0.3); if (f === 't' && Math.abs(Math.abs(u) - 0.5) < 0.025) goldM(K, u, vv, 0.3); }); S.unlock();
    const mat = (u, h, ao, ins, phi) => { const drum = ((h - 0.36) / 0.62) % 1; if (drum < 0.025) M.ao *= 0.55; ivory(K, u * 1.2, h, ao, sd); const f = Math.cos(phi * 10); M.ao *= 0.7 + 0.3 * f * f; if (Math.abs(h - 0.62) < 0.045 || Math.abs(h - 2.9) < 0.045) goldM(K, u, h, 0.3); };
    K.rev(S, 0, 0, h => R0 - 0.03 * (h / 4), 0.36, H, { part: 'front', top: v === 2, capMat: (x, h, ao, i, ph, x2, ey) => ivory(K, x * 3, ey * 3, 1, sd + 1), mat }); S.unlock();
    if (v === 2) { K.rbox(S, 0, 0, 0.56, 0.5, H, H + 0.26, 0.05, (f, u, vv, ao) => { ivory(K, u, vv, ao, sd + 3); if (f === 'f' && vv > H + 0.2) goldM(K, u, vv, 0.4); }); S.unlock(); }
    else { breakTop(S, -R0 - 0.1, R0 + 0.1, H - 0.05, 0.12, sd);
      // the broken face seen from above: a rough ivory ellipse, darker in its pits
      c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(0, -H - 0.2, 0, -H + 0.3); g.addColorStop(0, 'rgba(60,40,30,.0)'); g.addColorStop(0.6, 'rgba(60,40,30,.22)'); g.addColorStop(1, 'rgba(60,40,30,0)'); c.fillStyle = g; c.fillRect(-1, -H - 0.3, 2, 0.6); c.restore(); }
    if (v === 1) { const pts = [[0.35, -0.3], [1.15, -0.18]]; K.tube(S, pts, 0.36, 0.36, (t, s2, ao) => { ivory(K, t * 3, s2, ao, sd + 5); const f = Math.cos(s2 * 9); M.ao *= 0.75 + 0.25 * f * f; }); S.unlock(); }
    if (v === 3) { K.rev(S, 0.06, -(H + 0.45), h => R0 - 0.05, 0, 0.6, { part: 'front', top: true, capMat: (x, h, ao, i, ph, x2, ey) => { ivory(K, x * 3, ey * 3, 1, sd + 7); M.ao *= 0.85; }, mat: (u, h, ao, ins, phi) => { ivory(K, u * 1.2, h + 4, ao, sd + 2); const f = Math.cos(phi * 10); M.ao *= 0.7 + 0.3 * f * f; } }); S.unlock(); }
    K.glint(c, -0.3, -Math.min(H, 2.4) + 0.2, 0.15, 0.55); K.ink(S, [40, 28, 20], 0.5); }
  // an arch: piers of ivory on obsidian bases, a span of voussoirs with a gold keystone, broken through (v 0); a lone pier and its springer (v 1)
  function archSolid(K, S, cx, cy, Ri, Ro, keep, mat) { const { M, clamp } = K, P = S.P, bv = 0.07, KK = K.K * 0.55;
    const xa = Math.max(0, Math.floor(S.ax + (cx - Ro) * P) - 2), xb = Math.min(S.w - 1, Math.ceil(S.ax + (cx + Ro) * P) + 2), ya = Math.max(0, Math.floor(S.ay - (cy + Ro + KK) * P) - 2), yb = Math.min(S.h - 1, Math.ceil(S.ay - cy * P) + 2);
    S.lock();
    for (let py = ya; py <= yb; py++) { const Yt = (S.ay - py - 0.5) / P; for (let px = xa; px <= xb; px++) { const X = (px + 0.5 - S.ax) / P, dx = X - cx, dy = Yt - cy, d = Math.hypot(dx, dy); if (dy < 0) continue; const an = Math.atan2(dy, dx); if (!keep(an + (K.vn(d * 9, 3.3) - 0.5) * 0.12)) continue;
      if (d >= Ri - 0.5 / P && d <= Ro + 0.5 / P) { const eo = Ro - d, ei = d - Ri, q = eo < bv ? 1 - eo / bv : ei < bv ? -(1 - ei / bv) : 0, rx = dx / (d || 1), rz = dy / (d || 1), nx = rx * q * 0.8, nz = rz * q * 0.8, ny = Math.sqrt(Math.max(0.05, 1 - nx * nx - nz * nz));
        K.M0(); M.ao = 1; mat('f', dx, dy, d, an); K.shade(nx, ny, nz); K.put(S, px, py, clamp(eo * P + 0.5, 0, 1) * clamp(ei * P + 0.5, 0, 1)); continue; }
      if (d > Ro) { const s2 = Ro * Ro - dx * dx; if (s2 > 0) { const zs = Math.sqrt(s2), k = dy - zs; if (k >= 0 && k <= KK) { const a2 = Math.atan2(zs, dx); if (!keep(a2)) continue; K.M0(); M.ao = 0.75 + 0.25 * (1 - k / KK); mat('o', dx, zs, k / KK, a2); const l = Math.hypot(dx / Ro * 0.7, 0.25, zs / Ro * 0.9 + 0.2); K.shade(dx / Ro * 0.7 / l, 0.25 / l, (zs / Ro * 0.9 + 0.2) / l); K.put(S, px, py, clamp((KK - k) * P + 0.5, 0, 1)); } } } } }
    S.unlock(); }
  function paintArch(K, S, v) { const { M } = K, c = S.c, sp = 3.0, PH = 4.0, Ri = sp - 0.55, Ro = sp + 0.55, sd = 3.3 + v;
    pool(K, S, v ? 1.2 : 3.4, '255,200,120', 0.6);
    const piers = v ? [-1] : [-1, 1];
    for (const s of piers) { const x = s * sp;
      K.rbox(S, x, 0, 0.7, 0.55, 0, 0.42, 0.05, (f, u, vv, ao) => { obsid(K, u * 2, vv * 2, sd + s); if (f === 'f' && Math.abs(vv - 0.34) < 0.03) goldM(K, u, vv, 0.3); }); S.unlock();
      K.rbox(S, x, 0, 0.55, 0.48, 0.42, PH, 0.05, (f, u, vv, ao) => { if (f === 't') { ivory(K, u, vv, ao, sd); return; } ivory(K, u * 1.3, vv, ao, sd + s); const course = ((vv - 0.42) / 0.55) % 1; if (course < 0.03) M.ao *= 0.6; if (Math.abs(vv - (PH - 0.25)) < 0.05) goldM(K, u, vv, 0.3); if (Math.abs(u) < 0.02 && vv > 1 && vv < PH - 0.6) goldM(K, u, vv, 0.4); }); S.unlock(); }
    // the span (the far side of v 0 broken away at its crown, a gap of sky), its voussoirs' joints, the gold keystone
    const keep = v ? an => an > Math.PI * 0.7 : an => an > Math.PI * 0.56 || an < Math.PI * 0.3;
    archSolid(K, S, 0, PH, Ri, Ro, keep, (face, dx, dy, d, an) => { ivory(K, dx * 1.2 + 4, dy * 1.2, 1, sd + 2); const j = Math.abs(((an / Math.PI * 13) % 1) - 0.5); if (face === 'f' && j > 0.47) M.ao *= 0.55;
      if (face === 'f' && Math.abs(an - Math.PI / 2) < 0.08) goldM(K, dx, dy, 0.3); if (face === 'f' && (d - Ri < 0.05 || Ro - d < 0.05)) goldM(K, dx, dy, 0.45); });
    if (!v) { breakTop(S, -0.9, -0.15, PH + Ro - 0.2, 0.0, 9); }
    K.glint(c, -sp - 0.3, -PH + 0.2, 0.16, 0.6); K.ink(S, [40, 28, 20], 0.5); }
  // a floating monolith: an obsidian slab, gold glyph lines (the bull's stars) cut in its face, broken ivory at its ends
  function paintMonolith(K, S, v) { const { M } = K, H = [2.3, 1.7, 1.25][v], W = [0.34, 0.3, 0.36][v], sd = 5.1 + v * 1.9, RN = K.R1(71 + v);
    const st = []; for (let i = 0; i < 5; i++) st.push([(RN() - 0.5) * W * 1.3, 0.35 + RN() * (H - 0.7)]);
    K.rbox(S, 0, 0, W, 0.2, 0, H, 0.05, (f, u, vv, ao) => { if (f === 't') { ivory(K, u * 3, vv * 3, ao, sd); return; } obsid(K, u * 2, vv, sd);
      if (vv < 0.18 || vv > H - 0.2) { ivory(K, u * 2, vv * 2, ao, sd + 1); M.ao *= 0.85; }
      for (let i = 0; i < st.length; i++) { const [sx, sy] = st[i], dd = Math.hypot(u - sx, vv - sy); if (dd < 0.045) { goldM(K, u, vv, 0.2); amber(K, 0.25); } if (i) { const [ax, ay] = st[i - 1], bx = sx - ax, by = sy - ay, l2 = bx * bx + by * by, t = Math.max(0, Math.min(1, ((u - ax) * bx + (vv - ay) * by) / l2)), e = Math.hypot(u - ax - bx * t, vv - ay - by * t); if (e < 0.012) goldM(K, u, vv, 0.3); } } }); S.unlock();
    breakTop(S, -W - 0.1, W + 0.1, H - 0.08, 0.07, sd); K.glint(S.c, -W * 0.6, -H * 0.7, 0.12, 0.5); K.ink(S, [30, 22, 18], 0.45); }
  // a chunk of debris: a faceted lump of ivory (v 0, 2) or obsidian (v 1)
  function paintDebris(K, S, v) { const { M, vn } = K, r = [0.24, 0.2, 0.15][v], sd = 9 + v * 3;
    K.ball(S, 0, -r, r, r * 0.85, (dx, dy, ao) => { if (v === 1) obsid(K, dx * 3, dy * 3, sd); else ivory(K, dx * 2, dy * 2, ao, sd); M.ao = ao * (0.75 + 0.25 * vn(dx * 4 + sd, dy * 4)); if (v === 2 && Math.abs(dx + dy * 0.4) < 0.05) goldM(K, dx, dy, 0.3); }); S.unlock();
    K.ink(S, [30, 22, 18], 0.45); }
  // the dusk sun (P px per its radius): a gold-white core, the limb deepening to orange, violet cloud bands drawn across it
  function paintSun(K, S) { const { fbm, clamp, ss } = K, P = S.P; S.lock(); const d = S.d;
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, r = Math.hypot(x, y); if (r > 1.0 + 1.5 / P) continue;
      const z = Math.sqrt(Math.max(0, 1 - r * r)), limb = Math.pow(z, 0.45), cl = ss(0.5, 0.75, fbm(x * 1.2 + 3, y * 6 + 1)) * ss(-0.1, 0.5, y);
      let R = 1.0 * (0.75 + 0.25 * limb), G = 0.86 * (0.5 + 0.5 * limb) + 0.1 * z, B = 0.55 * (0.3 + 0.7 * limb) * z + 0.1; R = R * (1 - cl * 0.45) + 0.42 * cl * 0.45; G = G * (1 - cl * 0.55) + 0.24 * cl * 0.55; B = B * (1 - cl * 0.5) + 0.36 * cl * 0.5;
      const i = (py * S.w + px) * 4; d[i] = clamp(R * 255, 0, 255); d[i + 1] = clamp(G * 255, 0, 255); d[i + 2] = clamp(B * 255, 0, 255); d[i + 3] = clamp((1 - r) * P + 0.5, 0, 1) * 255; }
    S.unlock(); }

  /* ======================= the pictures ======================= */
  const DEFS = {
    node: { light: 'vault', box: () => [-0.95, -0.65, 0.95, 0.5], paint: paintNode },
    door: { light: 'dusk', box: () => [-3.35, -5.45, 3.35, 0.75], paint: paintDoor },
    leaf: { light: 'dusk', box: v => v === 'l' ? [-GEO.WO - 0.15, -GEO.L0 - 0.3, 0.06, -GEO.PZ + 0.1] : [-0.06, -GEO.L0 - 0.3, GEO.WO + 0.15, -GEO.PZ + 0.1], paint: paintLeaf },
    brazier: { light: 'vault', box: () => [-0.9, -1.5, 0.9, 0.5], paint: paintBrazier },
    column: { light: 'vault', box: () => [-1.0, -3.4, 1.0, 0.5], paint: paintColumn },
    ruin: { light: 'dusk', box: v => [-1.15, -(v === 2 ? 4.2 : v === 3 ? 3.4 : 3.7), v === 1 ? 1.65 : 1.15, 0.6], paint: paintRuin },
    arch: { light: 'dusk', box: v => v ? [-4.0, -7.9, -1.2, 0.7] : [-4.0, -7.9, 4.0, 0.7], paint: paintArch },
    monolith: { light: 'dusk', box: v => [-0.6, -[2.3, 1.7, 1.25][v] - 0.4, 0.6, 0.35], paint: paintMonolith },
    debris: { light: 'dusk', box: () => [-0.32, -0.55, 0.32, 0.12], paint: paintDebris },
    sun: { light: 'dusk', box: () => [-1.02, -1.02, 1.02, 1.02], paint: paintSun } };
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  function paint(name, v, P) { const B = BP(); if (!B) return null; const K = B.kit, D = DEFS[name], b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); lit(K, D.light, () => { D.paint(K, S, v); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('TAURUS_PROPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = document.createElement('canvas'); cv.width = S.w; cv.height = S.h; cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (the work canvas, read back often, given back at once)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  const keyOf = (name, v, P) => name + '|' + v + '|' + P;
  function sprite(name, v, P, force) { if (!DEFS[name] || !BP()) return null; P = Math.max(8, Math.round(P || BASE || 48)); const key = keyOf(name, v, P); let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 12) return null;   // (a painting budget: what does not fit waits a frame)
    s = paint(name, v, P); if (s) CACHE.set(key, s); return s; }
  const SUN_R = 2.6, sunP = P => Math.round(Math.min(P, 64) * SUN_R);   // (the sun's radius in tiles as the sky draws it; its sharpness capped)
  function pick(name, v) { if (!BASE) return null; const PB = name === 'sun' ? sunP(BASE) : BASE, s = CACHE.get(keyOf(name, v, PB)); return s || sprite(name, v, PB); }
  function draw(c, name, v, Xs, Ys, T, o) { const s = pick(name, v); if (!s) { STATS.misses++; return false; } o = o || {}; const f = T / s.P, sx = o.sx == null ? 1 : o.sx, sy = o.sy == null ? 1 : o.sy; STATS.draws++;
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.translate(Xs, Ys); if (o.rot) c.rotate(o.rot); if (sx !== 1 || sy !== 1) c.scale(sx, sy); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); return true; }
  const WARM = [['node', 0], ['door', 0], ['leaf', 'l'], ['leaf', 'r'], ['brazier', 0], ['arch', 0], ['arch', 1], ['monolith', 0], ['monolith', 1], ['monolith', 2], ['debris', 0], ['debris', 1], ['debris', 2], ['sun', 0]];
  function warm(P) { if (!BP() || !(P > 2)) return []; BASE = Math.round(P); return WARM.map(([n, v]) => () => { sprite(n, v, n === 'sun' ? sunP(BASE) : BASE, true); }); }
  function release() { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); BASE = 0; }

  /* ======================= the engine's props (breakable): painted straight into the engine's prop cache ======================= */
  const PROP_OF = { tgcolumn: ['column', 2], tgruin: ['ruin', 4] };
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS;
    for (const [kind, [name, n]] of Object.entries(PROP_OF)) { if (PR[kind] && PR[kind].__tgp) continue;
      const f = function (c, P, v) { const s = paint(name, ((v | 0) % n + n) % n, Math.max(8, Math.round(P))); if (!s) return; c.drawImage(s.cv, -s.ax, -s.ay); s.cv.width = s.cv.height = 1; };
      f.__tgp = 1; PR[kind] = f; }
    if (!PR.tgnone) PR.tgnone = () => {};
    if (typeof window !== 'undefined') { window.PROP_EXT = window.PROP_EXT || {}; Object.assign(window.PROP_EXT, { tgcolumn: [2.4, 3.6], tgruin: [2.8, 4.4] }); }
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) Object.assign(BREAK_FX.KIND, { tgcolumn: { mat: 'stone', cols: ['#2A2632', '#B08A4E', '#FFD9A0'] }, tgruin: { mat: 'stone', cols: ['#D8CCB0', '#8E8068', '#F2C774'] } });
    if (typeof PROP_EL !== 'undefined') Object.assign(PROP_EL, { tgcolumn: 'prism', tgruin: 'prism' }); }
  install();
  const setBase = P => { if (P > 2) BASE = Math.round(P); };
  const API = { draw, sprite: (n, v, P) => sprite(n, v, P, true), has: n => !!DEFS[n] && !!BP(), warm, release, setBase, install, GEO, SUN_R, sunP, DEFS, LIGHT, get base() { return BASE; }, get stats() { return Object.assign({ cached: CACHE.size }, STATS); } };
  if (typeof window !== 'undefined') window.TAURUS_PROPS = API;
  return API;
})();
