/* ---------- v435 AG: the Gate of Aries's pictures (the Ember Switchyard and the Cataclysm Altar) ----------
   Every solid piece of the gate is painted once, at the floor's sharpness, by the Drowned Belfry's software shading pass
   (BELPROPS.kit, 20n9: each pixel of a solid gets a normal and a material and is lit), in a light of its own: the forge's
   ("forge": a warm ember key, smoke-dark reflections, a red-orange rim, lava's bounce from below) and the altar's ("altar":
   the same, hotter from below, the lake of fire under the platform). Materials: basalt (vesicled, soot in its hollows),
   obsidian (glassy black with a violet sheen), blackened iron (rust in its pits), antique gold, fire brick, brine, and
   molten light (an emission). Each is finished with a little 2D detail (glints, an ink edge). Nothing here is painted per
   frame: the frame lays the pictures down; what glows or moves is the gate's own GPU light over them (20zza).
   Pictures (name, v): crucible (the great crucible on its ram-horned frame, where the ember is poured), furnace (a ram's-head
   forge mouth: the yard's goal), lever (a switch's iron plinth) and handle (its bar, drawn turned), ramsw (the ram switch's
   obsidian drum) and rhorns (its rocking horns), kiln (the bellows kiln's brick ring, hood and bellows), trough (a quench
   trough of brine), brazier (an iron tripod brazier), door (the great door: basalt jambs with molten rune channels, an iron
   lintel with three ram sockets, a crest of a ram's skull with curled horns round an ember core), leaf (v 'l' | 'r': its two
   iron leaves, half the Aries glyph cut through each), bar (the iron bar across the leaves), hornarch (the altar's monument:
   the Aries glyph as two colossal horns of obsidian), shard (v 0..2: basalt held up by the updraft, molten in its cracks),
   spire (v 0..2: obsidian spires rising from the lake, far below), and for the sky: cliff (v 0..1: strips of the caldera's
   far wall, its lavafalls), eclipse (the dying sun over the caldera). Engine props (DunWorld.PROPS, breakable through
   BREAK_FX): agpillar (v 0..1: the yard's basalt columns, an ember cage or a ram's horns on top), agruin (v 0..3: the altar's
   broken basalt columns, one with a fire basket, one chained).
   API (global ARIES_PROPS): draw(c, name, v, Xs, Ys, T, o) the picture with its feet at Xs, Ys (o: { alpha, sx, sy, rot })
   -> false when it is not painted yet; sprite(name, v, P); warm(P) -> jobs for the loading screen; release() frees every
   picture (the gate calls it when its stage closes); setBase(P); GEO (the door's numbers, shared with the gate).
   window.__AGP = 0 turns the pictures off (the gate then draws nothing of them). */
var ARIES_PROPS = (() => {
  const TAU = Math.PI * 2;
  const BP = () => (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.kit && window.__BELP !== 0 && window.__AGP !== 0) ? window.BELPROPS : null;
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0 };
  const LIGHT = {
    forge: { a0: [0.11, 0.07, 0.06], a1: [0.07, 0.045, 0.07], e0: [0.16, 0.06, 0.035], e1: [0.34, 0.18, 0.14], k: [1.26, 1.0, 0.8], rim: [0.78, 0.34, 0.1], bo: [0.24, 0.08, 0.02] },
    altar: { a0: [0.13, 0.07, 0.06], a1: [0.08, 0.045, 0.08], e0: [0.24, 0.08, 0.035], e1: [0.44, 0.21, 0.16], k: [1.32, 1.02, 0.8], rim: [0.9, 0.38, 0.1], bo: [0.34, 0.11, 0.025] } };
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT[name] || {}); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  // the door's measures (tiles): the doorway's half width and height, the plinth, the jambs, the lintel (as the Gate of Taurus's)
  const GEO = { WO: 1.22, PZ: 0.2, JW: 0.6, JD: 0.42, L0: 3.25, L1: 3.95, stud: [-0.72, 0, 0.72], studZ: 3.6, crestZ: 4.55, barZ: 1.85 };

  /* ======================= materials ======================= */
  function basaltM(K, u, v, ao, sd) { const { M, vn, fbm } = K, w = fbm(u * 2.8 + sd, v * 2.8 + sd * 0.6), p = vn(u * 23 + sd, v * 23), ves = vn(u * 41 + sd * 2, v * 41), t = 0.78 + 0.32 * w;
    M.r = 0.2 * t; M.g = 0.168 * t; M.b = 0.162 * t; M.rg = 0.86; M.cc = 0.04; if (p > 0.7) M.ao *= 1 - (p - 0.7) * 1.6; if (ves > 0.84) M.ao *= 0.7;
    const soot = (1 - ao) * 0.5; M.r *= 1 - soot * 0.5; M.g *= 1 - soot * 0.56; M.b *= 1 - soot * 0.56; }
  function obsidM(K, u, v, sd) { const { M, vn, fbm } = K, w = fbm(u * 3 + sd, v * 3), rp = Math.sin((u * 5 + v * 3 + w * 4) * 3); M.r = 0.04 + 0.025 * w; M.g = 0.032 + 0.02 * w; M.b = 0.06 + 0.045 * w; M.rg = 0.07 + 0.1 * vn(u * 9, v * 9 + sd) + 0.03 * rp; M.cc = 0.9; }
  function goldM(K, u, v, e) { const M = K.M, w = K.vn(u * 13, v * 13); M.mt = 1; M.r = 0.28; M.g = 0.18; M.b = 0.07; M.fr = 0.94 * (0.88 + 0.16 * w); M.fg = 0.66 * (0.88 + 0.16 * w); M.fb = 0.28; M.rg = 0.22 + 0.15 * (e || 0) + 0.12 * w; M.cc = 0; }
  function ironM(K, u, v, ao, sd, rust) { const { M, vn, ss, lerp } = K, ru = ss(0.5, 0.82, vn(u * 6 + sd, v * 6) * 0.6 + vn(u * 23, v * 23 + sd) * 0.5 + (1 - ao) * 0.3) * (rust == null ? 1 : rust);
    M.mt = 0.86 - ru * 0.72; M.r = lerp(0.07, 0.3, ru); M.g = lerp(0.065, 0.12, ru); M.b = lerp(0.072, 0.06, ru); M.fr = lerp(0.36, 0.05, ru); M.fg = lerp(0.34, 0.05, ru); M.fb = lerp(0.35, 0.05, ru); M.rg = lerp(0.36, 0.85, ru); }
  function brickM(K, u, v, ao, sd) { const { M, vn } = K, row = Math.floor(v / 0.16), off = (row % 2) * 0.17, bx = (u + off) / 0.34, fx = bx - Math.floor(bx), fy = v / 0.16 - row, mort = fx < 0.07 || fy < 0.12, n = vn(Math.floor(bx) * 3.1 + sd, row * 1.7);
    if (mort) { M.r = 0.09; M.g = 0.075; M.b = 0.07; M.rg = 0.95; M.ao *= 0.7; return; } const t = 0.75 + 0.4 * n; M.r = 0.36 * t; M.g = 0.14 * t; M.b = 0.09 * t; M.rg = 0.88; const soot = Math.min(1, (1 - ao) * 0.8 + vn(u * 9, v * 9) * 0.3); M.r *= 1 - soot * 0.5; M.g *= 1 - soot * 0.5; M.b *= 1 - soot * 0.5; }
  const molten = (K, k) => { const M = K.M; M.er += 1.15 * k; M.eg += 0.45 * k; M.eb += 0.1 * k; };
  function pool(K, S, rx, col, a) { const c = S.c; K.contact(S, 0.03, 0.03, rx * 0.9, rx * 0.9 * K.K, 0.5); c.save(); c.scale(1, K.K); const g = c.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx * 1.3); g.addColorStop(0, `rgba(${col},${0.22 * a})`); g.addColorStop(0.6, `rgba(${col},${0.08 * a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx * 1.3, 0, TAU); c.fill(); c.restore(); }
  // a jagged break: everything above a ragged line at height h (tiles up) erased, between x0 and x1
  function breakTop(S, x0, x1, h, amp, sd) { const c = S.c, R = (s => { let x = s >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; })(sd * 977 + 13);
    c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(x0 - 0.3, -h - 9); c.lineTo(x0 - 0.3, -h); const n = 9; for (let i = 0; i <= n; i++) c.lineTo(x0 + (x1 - x0) * i / n, -h - (R() - 0.5) * amp * 2 - Math.sin(i * 1.7 + sd) * amp * 0.5); c.lineTo(x1 + 0.3, -h); c.lineTo(x1 + 0.3, -h - 9); c.closePath(); c.fill(); c.restore(); }
  /* a curled ram's horn as a path (tiles, y down): from its root (bx, by) up `rise`, then over and outward (dir) and down and in,
     `turns` half turns, its curl's radius R shrinking toward the tip */
  function hornPts(bx, by, dir, R, rise, turns, n) { n = n || 26; const cx = bx + dir * R, cy = by - rise, pts = [[bx, by]]; for (let i = 0; i <= n; i++) { const t = i / n, th = Math.PI - t * Math.PI * turns, r = R * (1 - 0.48 * t); pts.push([cx + dir * Math.cos(th) * r, cy - Math.sin(th) * r]); } return pts; }
  // a horn's surface: ridged (annulated) iron or obsidian, a gold ring now and then, molten in the deep grooves, its tip gold
  function hornMat(K, t, s2, ao, sd, o) { o = o || {}; const rib = Math.sin(t * (o.ribs || 34) * Math.PI), M = K.M, rd = o.rib == null ? 0.22 : o.rib; if (o.obsid) obsidM(K, t * 4, s2, sd); else ironM(K, t * 5, s2 * 2, ao, sd, 0.45); M.ao *= 1 - rd + rd * (rib * 0.5 + 0.5);
    if (o.molten && rib < -0.93 && t < 0.85 && (!o.every || Math.floor(t * (o.ribs || 34) / 2) % o.every === 0)) molten(K, o.molten * (1 - t)); if (o.rings && Math.abs(((t * o.rings) % 1) - 0.5) < 0.035 && t < 0.9) goldM(K, t, s2, 0.25); if (t > (o.tip || 0.88)) goldM(K, t, s2, 0.3); }

  /* ======================= the switchyard ======================= */
  // the great crucible: an iron bowl hung by chains from a beam on two posts, ram horns curling from the posts, molten at its brim
  function paintCrucible(K, S) { const { M } = K;
    pool(K, S, 1.5, '255,130,50', 1);
    for (const sd of [-1, 1]) { K.rbox(S, sd * 1.25, 0, 0.17, 0.17, 0, 2.9, 0.04, (f, u, v, ao) => { ironM(K, u * 3, v * 2, ao, 2 + sd, 0.5); if (Math.abs(v - 0.5) < 0.04 || Math.abs(v - 2.62) < 0.04) goldM(K, u, v, 0.3); }); S.unlock();
      K.rbox(S, sd * 1.25, 0, 0.26, 0.24, 0, 0.3, 0.04, (f, u, v, ao) => basaltM(K, u * 2, v * 2, ao, 3 + sd)); S.unlock(); }
    for (const sd of [-1, 1]) { K.tube(S, hornPts(sd * 1.25, -2.88, sd, 0.4, 0.22, 1.35), 0.11, 0.028, (t, s2, ao) => hornMat(K, t, s2, ao, 4 + sd, { molten: 0.5 })); S.unlock(); }
    K.tube(S, [[-1.38, -2.96], [1.38, -2.96]], 0.1, 0.1, (t, s2, ao) => { ironM(K, t * 4, s2, ao, 4, 0.4); if (Math.abs(t - 0.5) < 0.02) goldM(K, t, s2, 0.3); }); S.unlock();
    for (const sd of [-1, 1]) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([sd * (0.95 - 0.3 * t), -2.92 + t * 0.9]); } K.tube(S, pts, 0.034, 0.034, (t, s2, ao) => { ironM(K, t * 20, s2, ao, 6, 0.3); if (((t * 12) % 1) < 0.18) M.ao *= 0.6; }); S.unlock(); }
    K.rev(S, 0, 0, h => { const u = (h - 0.8) / 1.25; return 0.32 + 0.44 * Math.sin(Math.min(1, u * 1.12) * Math.PI * 0.62) + (u > 0.92 ? 0.05 : 0); }, 0.8, 2.05, { floorAO: 0,
      mat: (u, h, ao) => { ironM(K, u * 2, h * 2, ao, 7, 0.5); if (Math.abs(h - 1.9) < 0.035) goldM(K, u, h, 0.3); const cr = Math.abs(K.vn(u * 6, h * 5) - 0.5); if (h < 1.75 && h > 0.95 && cr < 0.018) molten(K, 0.55); },
      top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const r = Math.hypot(x / 0.8, ey); if (r > 0.86) { ironM(K, x, ey, 1, 8, 0.2); return; } M.r = 0.5; M.g = 0.18; M.b = 0.05; M.rg = 0.3; molten(K, 0.75 + 0.4 * K.vn(x * 7, ey * 7 + 3)); } }); S.unlock();
    K.tube(S, [[0, -1.9], [0.04, -1.72], [0.07, -1.58]], 0.13, 0.08, (t, s2, ao) => { ironM(K, t, s2, ao, 9, 0.3); if (t > 0.6) molten(K, 0.5 * (t - 0.6) / 0.4); }); S.unlock();
    K.glint(S.c, -0.42, -1.75, 0.14, 0.6); K.glint(S.c, 1.1, -2.95, 0.12, 0.5); K.ink(S, [20, 10, 8], 0.5); }
  // a forge mouth in a ram's head: a basalt block, its arched mouth dark (lit by the gate's fire when it roars), an iron skull with ember eyes and curled horns
  function paintFurnace(K, S) { const { M, ss } = K;
    pool(K, S, 1.3, '255,120,50', 0.8);
    K.rbox(S, 0, 0, 1.15, 0.5, 0, 2.0, 0.06, (f, u, v, ao) => { if (f === 't') { basaltM(K, u * 2, v * 2, ao, 1.3); return; } basaltM(K, u * 1.5, v * 1.5, ao, 1.7);
      const top = 0.78 + Math.sqrt(Math.max(0, 0.55 * 0.55 - u * u)) * 0.85, au = Math.abs(u);
      if (au < 0.55 && v > 0.12 && v < top) { M.r = 0.028; M.g = 0.018; M.b = 0.016; M.rg = 0.9; M.ao *= 0.5; molten(K, 0.22 * ss(0.55, 0.12, v) * (0.7 + 0.3 * K.vn(u * 9, v * 9))); return; }
      if (au < 0.66 && v > 0.08 && v < top + 0.1) { ironM(K, u * 3, v * 3, ao, 2.1, 0.35); if (Math.abs(au - 0.6) < 0.025 || Math.abs(v - top - 0.06) < 0.025) goldM(K, u, v, 0.3); return; }
      if (Math.abs(v - 0.18) < 0.035 || Math.abs(v - 1.86) < 0.035) goldM(K, u, v, 0.35); }); S.unlock();
    K.ball(S, 0, -1.62, 0.44, 0.38, (dx, dy, ao) => { ironM(K, dx * 2, dy * 2, ao, 3.3, 0.4); const e = Math.hypot(Math.abs(dx) - 0.42, (dy + 0.12) * 1.6); if (e < 0.16) { M.r = 0.05; M.g = 0.02; M.b = 0.02; molten(K, 0.55 * (1 - e / 0.16)); } if (Math.abs(dx) < 0.04 && dy > -0.85) goldM(K, dx, dy, 0.3); M.ao = ao; }); S.unlock();
    K.ball(S, 0, -1.3, 0.24, 0.2, (dx, dy, ao) => { ironM(K, dx * 3, dy * 3, ao, 3.9, 0.4); const n = Math.hypot(Math.abs(dx) - 0.38, dy - 0.25); if (n < 0.14) { M.r *= 0.3; M.g *= 0.3; M.b *= 0.3; } M.ao = ao; }); S.unlock();
    for (const sd of [-1, 1]) { K.tube(S, hornPts(sd * 0.34, -1.84, sd, 0.42, 0.12, 1.35), 0.14, 0.03, (t, s2, ao) => hornMat(K, t, s2, ao, 5 + sd, { molten: 0.35 })); S.unlock(); }
    K.glint(S.c, -0.2, -1.85, 0.14, 0.6); K.glint(S.c, -0.95, -1.95, 0.1, 0.45); K.ink(S, [22, 10, 8], 0.5); }
  // a switch's lever: an iron plinth with a gold band and a slot, little horns curled on its sides; the handle is its own picture
  function paintLever(K, S) { pool(K, S, 0.55, '255,140,60', 0.5);
    K.rbox(S, 0, 0, 0.3, 0.24, 0, 0.4, 0.05, (f, u, v, ao) => { if (f === 't') { ironM(K, u * 3, v * 3, ao, 1.1, 0.3); if (Math.abs(u) < 0.05 && Math.abs(v) < 0.16) { K.M.r = 0.03; K.M.g = 0.02; K.M.b = 0.02; } return; } ironM(K, u * 3, v * 3, ao, 1.4, 0.5); if (Math.abs(v - 0.31) < 0.03) goldM(K, u, v, 0.3); }); S.unlock();
    for (const sd of [-1, 1]) { K.tube(S, hornPts(sd * 0.26, -0.26, sd, 0.12, 0.04, 1.2, 14), 0.05, 0.015, (t, s2, ao) => hornMat(K, t, s2, ao, 2 + sd, { tip: 0.7 })); S.unlock(); }
    K.ink(S, [22, 10, 8], 0.45); }
  function paintHandle(K, S) { K.tube(S, [[0, 0], [0, -0.82]], 0.05, 0.04, (t, s2, ao) => { ironM(K, t * 4, s2, ao, 2.2, 0.2); if (t < 0.12) goldM(K, t, s2, 0.3); }); S.unlock();
    K.ball(S, 0, -0.9, 0.11, 0.11, (dx, dy, ao) => { const M = K.M; M.r = 0.5; M.g = 0.08; M.b = 0.04; M.rg = 0.12; M.cc = 1; molten(K, 0.35 + 0.4 * (1 - Math.hypot(dx, dy))); }); S.unlock();
    K.glint(S.c, -0.04, -0.94, 0.06, 0.7); K.ink(S, [22, 10, 8], 0.4); }
  // the ram switch: a squat obsidian drum ringed in gold, an ember set in its top; its horns are their own picture (they rock)
  function paintRamSw(K, S) { const { M } = K; pool(K, S, 0.65, '255,120,60', 0.6);
    K.rev(S, 0, 0, h => 0.44 - (h > 0.3 ? 0.03 : 0), 0, 0.36, { mat: (u, h, ao) => { obsidM(K, u * 2, h * 3, 2.7); if (Math.abs(h - 0.06) < 0.025 || Math.abs(h - 0.29) < 0.025) goldM(K, u, h, 0.3); },
      top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const r = Math.hypot(x / 0.41, ey); if (r > 0.86) { goldM(K, x, ey, 0.3); return; } obsidM(K, x * 3, ey * 3, 3.1); if (r < 0.28) { M.r = 0.4; M.g = 0.08; M.b = 0.03; molten(K, 0.5 * (1 - r / 0.28)); } } }); S.unlock();
    K.glint(S.c, -0.22, -0.3, 0.1, 0.5); K.ink(S, [22, 10, 8], 0.45); }
  function paintRHorns(K, S) { K.ball(S, 0, -0.16, 0.14, 0.13, (dx, dy, ao) => { ironM(K, dx * 2, dy * 2, ao, 4.4, 0.3); K.M.ao = ao; }); S.unlock();
    for (const sd of [-1, 1]) { K.tube(S, hornPts(sd * 0.07, -0.22, sd, 0.3, 0.16, 1.3, 18), 0.085, 0.022, (t, s2, ao) => hornMat(K, t, s2, ao, 6 + sd, { tip: 0.55, ribs: 18 })); S.unlock(); }
    K.glint(S.c, -0.3, -0.62, 0.09, 0.6); K.ink(S, [22, 10, 8], 0.45); }
  // the bellows kiln: a low ring of fire brick the channel runs through (its middle left open), an iron hood on two posts behind, a leather bellows at its side
  function paintKiln(K, S) { const { M } = K; pool(K, S, 1.0, '255,140,60', 0.7);
    for (const sd of [-1, 1]) { K.tube(S, [[sd * 0.5, -0.12], [sd * 0.42, -1.3]], 0.05, 0.045, (t, s2, ao) => ironM(K, t * 6, s2, ao, 3 + sd, 0.4)); S.unlock(); }
    K.rev(S, 0, 0, h => 0.66, 0, 0.32, { shell: () => true, th: () => 0.15, mat: (u, h, ao, ins) => { brickM(K, u * 1.4, h, ao, ins ? 2.2 : 1.1); if (ins) { M.ao *= 0.7; molten(K, 0.18 * (1 - h / 0.32)); } }, floorAO: 0.6 }); S.unlock();
    K.rev(S, 0, -0.08, h => 0.06 + (1.9 - h) * 0.62, 1.25, 1.85, { floorAO: 0, mat: (u, h, ao) => { ironM(K, u * 2, h * 3, ao, 5.2, 0.5); if (Math.abs(h - 1.3) < 0.03) goldM(K, u, h, 0.3); } }); S.unlock();
    K.tube(S, [[0, -1.85], [0, -2.22]], 0.08, 0.07, (t, s2, ao) => { ironM(K, t * 3, s2, ao, 5.9, 0.6); if (t > 0.8) molten(K, 0.3); }); S.unlock();
    K.rbox(S, -0.98, 0.06, 0.2, 0.28, 0.08, 0.48, 0.08, (f, u, v, ao) => { const w = K.vn(u * 9, v * 9); M.r = 0.24 * (0.8 + 0.3 * w); M.g = 0.12 * (0.8 + 0.3 * w); M.b = 0.07; M.rg = 0.6; M.cc = 0.2; if (f === 'f' && Math.abs(((v - 0.08) / 0.1) % 1 - 0.5) < 0.12) M.ao *= 0.6; }); S.unlock();
    K.tube(S, [[-0.8, -0.3], [-0.55, -0.22]], 0.05, 0.035, (t, s2, ao) => goldM(K, t, s2, 0.3)); S.unlock();
    K.glint(S.c, -0.3, -1.55, 0.1, 0.5); K.ink(S, [22, 10, 8], 0.45); }
  // a quench trough: an iron basin of black brine
  function paintTrough(K, S) { const { M } = K; K.contact(S, 0.03, 0.03, 0.7, 0.7 * K.K, 0.5);
    K.rbox(S, 0, 0, 0.62, 0.4, 0, 0.34, 0.05, (f, u, v, ao) => { if (f === 't' && Math.abs(u) < 0.5 && Math.abs(v) < 0.28) { M.r = 0.025; M.g = 0.05; M.b = 0.065; M.rg = 0.06; M.cc = 1; M.mt = 0; return; } ironM(K, u * 3, v * 3, ao, 6.6, 0.55); if (f === 'f' && (Math.abs(v - 0.06) < 0.025 || Math.abs(v - 0.28) < 0.025)) goldM(K, u, v, 0.4); if (f === 'f' && Math.abs(((u + 0.62) / 0.31) % 1 - 0.5) < 0.05) M.ao *= 0.7; }); S.unlock();
    K.glint(S.c, -0.25, -0.38, 0.1, 0.55); K.ink(S, [16, 12, 14], 0.45); }
  // an iron tripod brazier, its bowl ringed in gold, coals in it, little horns for handles
  function paintBrazier(K, S) { const { M } = K; pool(K, S, 0.7, '255,140,60', 0.8);
    for (const [x0, k] of [[-0.42, 0], [0.42, 1], [0.05, 2]]) { K.tube(S, [[x0, k === 2 ? 0.08 : 0], [x0 * 0.3, -0.95]], 0.045, 0.04, (t, s2, ao) => ironM(K, t * 5, s2, ao, 2 + k, 0.4)); S.unlock(); }
    K.rev(S, 0, 0, h => 0.12 + Math.pow((h - 0.95) / 0.38, 1.4) * 0.34, 0.95, 1.33, { floorAO: 0, mat: (u, h, ao) => { ironM(K, u * 3, h * 3, ao, 3.3, 0.4); if (Math.abs(h - 1.28) < 0.025) goldM(K, u, h, 0.3); }, top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const r = Math.hypot(x / 0.46, ey); if (r > 0.88) { goldM(K, x, ey, 0.3); return; } M.r = 0.07; M.g = 0.045; M.b = 0.04; M.rg = 0.85; const e = K.vn(x * 14, ey * 6 + 2); molten(K, 0.12 + 0.6 * K.ss(0.5, 0.85, e)); } }); S.unlock();
    for (const sd of [-1, 1]) { K.tube(S, hornPts(sd * 0.44, -1.22, sd, 0.13, 0.04, 1.25, 12), 0.045, 0.015, (t, s2, ao) => hornMat(K, t, s2, ao, 7 + sd, { tip: 0.6 })); S.unlock(); }
    K.glint(S.c, -0.22, -1.32, 0.1, 0.6); K.ink(S, [22, 10, 8], 0.45); }
  // the yard's columns (an engine prop): basalt, iron bands, an ember cage on top (v 0) or a ram's horns cupping a gold ring (v 1)
  function paintPillar(K, S, v) { const { M } = K, H = 2.5;
    pool(K, S, 0.8, '255,120,50', 0.6);
    K.rbox(S, 0, 0, 0.44, 0.38, 0, 0.32, 0.05, (f, u, vv, ao) => { basaltM(K, u, vv, ao, 2.3 + v); if (f === 'f' && vv > 0.26) goldM(K, u, vv, 0.4); }); S.unlock();
    K.rev(S, 0, 0, h => (h > H - 0.2 ? 0.28 + 0.08 * K.ss(H - 0.2, H, h) : 0.26) * (1 + 0.05 * Math.sin(h * 7 + v)), 0.32, H, { part: 'front', top: true, capMat: (x, h, ao, i, ph, x2, ey) => basaltM(K, x * 3, ey, 1, 3.1),
      mat: (u, h, ao, ins, phi) => { if (Math.abs(h - 0.6) < 0.05 || Math.abs(h - (H - 0.3)) < 0.05) { ironM(K, u * 3, h * 3, ao, 1.1, 0.4); return; } basaltM(K, u * 1.4, h, ao, 2.3 + v); const f = Math.cos(phi * 6); M.ao *= 0.8 + 0.2 * f * f; const cr = Math.abs(K.vn(u * 4 + v, h * 2.2) - 0.5); if (cr < 0.015 && h < H - 0.5) molten(K, 0.35); } });
    S.unlock();
    if (v === 0) { for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI + 0.2, x = Math.cos(a) * 0.24; K.tube(S, [[x, -(H + 0.02)], [x * 1.2, -(H + 0.42)], [x * 0.5, -(H + 0.58)]], 0.03, 0.025, (t, s2, ao) => ironM(K, t * 4, s2, ao, 4 + i, 0.5)); S.unlock(); }
      K.ball(S, 0, -(H + 0.24), 0.17, 0.15, (dx, dy, ao) => { M.r = 0.3; M.g = 0.06; M.b = 0.03; M.rg = 0.6; molten(K, 0.5 + 0.5 * (1 - Math.hypot(dx, dy))); }); S.unlock(); }
    else { for (const sd of [-1, 1]) { K.tube(S, hornPts(sd * 0.16, -(H + 0.02), sd, 0.3, 0.12, 1.3, 16), 0.09, 0.022, (t, s2, ao) => hornMat(K, t, s2, ao, 2 + sd, { tip: 0.7 })); S.unlock(); }
      const rp = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * TAU; rp.push([Math.cos(a) * 0.2, -(H + 0.36) + Math.sin(a) * 0.2]); } K.tube(S, rp, 0.03, 0.03, (t, s2, ao) => goldM(K, t, s2, 0.2)); S.unlock(); }
    K.glint(S.c, -0.12, -(H + 0.3), 0.12, 0.6); K.ink(S, [20, 10, 8], 0.5); }

  /* ======================= the great door ======================= */
  function paintDoor(K, S) { const { M } = K, c = S.c, G = GEO, jx = G.WO + G.JW, RN = K.R1(4435);
    pool(K, S, 3.0, '255,130,60', 0.8);
    K.rbox(S, 0, 0, 3.0, 0.62, 0, G.PZ, 0.05, (f, u, v, ao) => { basaltM(K, u, v * 2, ao, 1.7); if (f === 't' && Math.abs(v + 0.5) < 0.06) goldM(K, u, v, 0.3); if (f === 'f' && v > G.PZ - 0.035) goldM(K, u, v, 0.4); }); S.unlock();
    for (const sd of [-1, 1]) { const x = sd * jx;
      K.rbox(S, x, 0, G.JW, G.JD, G.PZ, G.L0, 0.06, (f, u, v, ao) => { const lu = u * sd; if (f === 't') { basaltM(K, u, v, ao, 5); return; }
        const inset = Math.abs(lu) < G.JW - 0.14 && v > 0.62 && v < G.L0 - 0.36; if (!inset) { basaltM(K, u * 1.4, v, ao, 5.7 + sd); if (Math.abs(v - 0.42) < 0.05 || Math.abs(v - (G.L0 - 0.18)) < 0.05) ironM(K, u * 3, v * 3, ao, 2, 0.4); return; }
        obsidM(K, u * 2, v, 2.2 + sd); const ch = Math.abs(lu) < 0.03 && v > 0.8 && v < G.L0 - 0.55, chev = Math.abs(Math.abs(lu) * 1.2 - (((v - 0.8) / 0.42) % 1) * 0.36) < 0.03 && v > 0.8 && v < G.L0 - 0.6 && Math.abs(lu) < 0.3;
        if (ch || chev) { M.r = 0.3; M.g = 0.06; M.b = 0.03; molten(K, 0.42); } if (Math.abs(Math.abs(lu) - (G.JW - 0.14)) < 0.02) M.ao *= 0.6; }); S.unlock(); }
    // the lintel: iron, gold borders, three ram sockets (lit by the gate as each furnace wakes)
    K.rbox(S, 0, 0, jx + G.JW + 0.12, G.JD + 0.06, G.L0, G.L1, 0.06, (f, u, v, ao) => { if (f === 't') { basaltM(K, u, v, ao, 8); return; } ironM(K, u * 2, v * 2, ao, 6.1, 0.45);
      if (Math.abs(v - G.L0 - 0.06) < 0.03 || Math.abs(v - G.L1 + 0.06) < 0.03) goldM(K, u, v, 0.2);
      for (const sx of G.stud) { const d = Math.hypot(u - sx, v - G.studZ); if (d < 0.15) { if (d > 0.1) goldM(K, u, v, 0.2); else { M.r = 0.03; M.g = 0.02; M.b = 0.02; M.rg = 0.4; M.ao *= 0.7; } } } }); S.unlock();
    // the crest: a ram's skull of iron, horns curling out from it, an ember held between them
    const cz = G.crestZ; for (const sd of [-1, 1]) { K.tube(S, hornPts(sd * 0.28, -(cz - 0.15), sd, 0.62, 0.28, 1.4, 30), 0.22, 0.045, (t, s2, ao) => hornMat(K, t, s2, ao, 3.1 + sd, { molten: 0.55, rings: 4 })); S.unlock(); }
    K.ball(S, 0, -(cz - 0.15), 0.36, 0.32, (dx, dy, ao) => { ironM(K, dx * 2, dy * 2, ao, 4.4, 0.35); const e = Math.hypot(Math.abs(dx) - 0.4, (dy + 0.1) * 1.6); if (e < 0.15) { M.r = 0.05; M.g = 0.02; M.b = 0.02; molten(K, 0.6 * (1 - e / 0.15)); } M.ao = ao; }); S.unlock();
    K.ball(S, 0, -(cz + 0.42), 0.2, 0.2, (dx, dy, ao) => { obsidM(K, dx * 2, dy * 2, 4.9); const cr = Math.abs(K.vn(dx * 5 + 3, dy * 5) - 0.5); if (cr < 0.05) molten(K, 1 - cr / 0.05); M.ao = ao; }); S.unlock();
    K.glint(c, -jx - 0.3, -G.L0 + 0.1, 0.16, 0.6); K.glint(c, jx + 0.3, -G.L1 + 0.1, 0.14, 0.5); K.glint(c, -0.95, -(cz + 0.6), 0.18, 0.8); K.glint(c, 0.1, -(cz + 0.15), 0.12, 0.7);
    c.save(); for (let i = 0; i < 60; i++) { const x = (RN() - 0.5) * 6, y = -RN() * 4.8; c.fillStyle = `rgba(255,170,90,${(0.12 + RN() * 0.35).toFixed(2)})`; c.fillRect(x, y, 0.012, 0.012); } c.restore();
    K.ink(S, [24, 12, 10], 0.5); }
  // a leaf: blackened iron in three panels, rivets, half the Aries glyph cut through it as a molten channel, gold at the seam
  function paintLeaf(K, S, v) { const { M, clamp } = K, G = GEO, sd = v === 'l' ? -1 : 1, P = S.P, top = G.L0 + 0.2;
    S.lock();
    for (let py = 0; py < S.h; py++) { const Yt = (S.ay - py - 0.5) / P; if (Yt < G.PZ - 0.02 || Yt > top) continue; for (let px = 0; px < S.w; px++) { const X = (px + 0.5 - S.ax) / P, lx = X * sd; if (lx < -0.5 / P || lx > G.WO + 0.1) continue;
      let nx = 0, nz = 0, ao = 1; K.M0(); ironM(K, X * 1.3, Yt * 1.3, 0.85, v === 'l' ? 2.1 : 4.7, 0.4);
      if (lx < 0.04) { nx = sd * (1 - lx / 0.04) * 0.6; ao = 0.6; goldM(K, X, Yt, 0.25); }
      const fx = G.WO - lx, bands = [0.75, 2.65]; if (fx < 0.12 || bands.some(b => Math.abs(Yt - b) < 0.06)) { nz += 0.25; M.fr *= 1.1; M.fg *= 1.06; } else ao *= 0.92;
      const sx = ((lx * 4.2) % 1) - 0.5, sy = ((Yt * 3.6) % 1) - 0.5, sdd = Math.hypot(sx, sy); if (sdd < 0.13 && lx > 0.18 && lx < G.WO - 0.18 && (Yt < 0.95 || Yt > 2.55)) { ironM(K, X * 3, Yt * 3, 1, 9, 0.1); M.mt = 1; nx += sx * 2.2 * sd; nz -= sy * 2.2; }
      // the glyph's half: its horn an arc over to the seam, its stem down the seam (a molten channel with a dark groove round it)
      const hd = Math.abs(Math.hypot(lx - 0.48, Yt - 2.05) - 0.46), onArc = Yt > 1.9 || lx > 0.9, stem = lx < 0.07 && Yt > 0.95 && Yt < 2.05, e = Math.min(onArc ? hd : 9, stem ? Math.max(0, lx - 0.02) : 9);
      if (e < 0.085) { if (e < 0.04) { M.r = 0.35; M.g = 0.07; M.b = 0.03; M.mt = 0; M.rg = 0.4; molten(K, 0.55 * (1 - e / 0.04)); } else { M.r *= 0.35; M.g *= 0.35; M.b *= 0.35; ao *= 0.7; } }
      M.ao = ao; const l = Math.hypot(nx, 1, nz); K.shade(nx / l, 1 / l, nz / l); K.put(S, px, py, clamp((G.WO + 0.1 - lx) * P + 0.5, 0, 1) * clamp(lx * P + 1, 0, 1)); } }
    S.unlock(); K.ink(S, [24, 12, 10], 0.35); }
  function paintBar(K, S) { K.tube(S, [[-1.32, 0], [1.32, 0]], 0.1, 0.1, (t, s2, ao) => { ironM(K, t * 8, s2, ao, 7.7, 0.35); if (Math.abs(t - 0.12) < 0.012 || Math.abs(t - 0.88) < 0.012) goldM(K, t, s2, 0.3); }); S.unlock();
    for (const sd of [-1, 1]) { K.ball(S, sd * 1.36, 0, 0.15, 0.14, (dx, dy, ao) => { ironM(K, dx * 2, dy * 2, ao, 8.1, 0.3); K.M.ao = ao; }); S.unlock(); }
    K.glint(S.c, -0.4, -0.06, 0.08, 0.5); K.ink(S, [24, 12, 10], 0.45); }

  /* ======================= the altar ======================= */
  // the Aries glyph as a monument: two colossal horns of ridged obsidian rising from basalt plinths and curling outward, gold rings round them, molten in their grooves
  function paintHornArch(K, S, v) { const { M } = K, sp = 2.35;
    pool(K, S, 3.6, '255,120,50', 0.7);
    for (const sd of [-1, 1]) { K.tube(S, hornPts(sd * sp, -0.66, sd, 1.4, 3.6, v ? 1.0 : 1.42, 40), 0.6, 0.11, (t, s2, ao) => hornMat(K, t, s2, ao, 5 + sd, { obsid: true, molten: 0.7, every: 3, rings: 3, ribs: 20, rib: 0.12, tip: 0.9 })); S.unlock(); }
    for (const sd of [-1, 1]) { K.rbox(S, sd * sp, 0, 0.82, 0.64, 0, 0.62, 0.06, (f, u, vv, ao) => { basaltM(K, u * 2, vv * 2, ao, 3 + sd); if (f === 'f' && Math.abs(vv - 0.52) < 0.035) goldM(K, u, vv, 0.3); if (f === 'f' && Math.abs(vv - 0.12) < 0.03) goldM(K, u, vv, 0.3); if (f === 't' && Math.hypot(u, vv) < 0.62) { obsidM(K, u * 2, vv * 2, 5 + sd); K.M.ao *= 0.6; } }); S.unlock(); }
    K.ball(S, 0, -5.0, 0.36, 0.36, (dx, dy, ao) => { obsidM(K, dx * 2, dy * 2, 9.1); const cr = Math.abs(K.vn(dx * 4 + 3, dy * 4) - 0.5); if (cr < 0.06) molten(K, 1.1 * (1 - cr / 0.06)); M.ao = ao; }); S.unlock();
    for (const sd of [-1, 1]) { const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([sd * (0.32 + (sp - 0.95) * t), -5.0 - Math.sin(t * Math.PI) * 0.4 + t * 0.6]); } K.tube(S, pts, 0.03, 0.03, (t, s2, ao) => { ironM(K, t * 20, s2, ao, 6, 0.3); if (((t * 14) % 1) < 0.2) M.ao *= 0.6; }); S.unlock(); }
    K.glint(S.c, -sp - 0.9, -4.6, 0.2, 0.6); K.glint(S.c, -0.12, -5.15, 0.14, 0.6); K.ink(S, [26, 12, 10], 0.5); }
  // a shard held up by the updraft: a faceted lump of basalt (v 0, 2) or obsidian (v 1), molten in its cracks
  function paintShard(K, S, v) { const { M, vn } = K, r = [0.62, 0.48, 0.36][v], sd = 9 + v * 3;
    K.ball(S, 0, -r, r, r * 0.82, (dx, dy, ao) => { if (v === 1) obsidM(K, dx * 3, dy * 3, sd); else basaltM(K, dx * 2, dy * 2, ao, sd); const f = Math.floor((Math.atan2(dy, dx) + 4) * 2.2) + Math.floor(Math.hypot(dx, dy) * 3); M.ao = ao * (0.72 + 0.28 * vn(f * 1.7 + sd, 2.3)); const cr = Math.abs(vn(dx * 3 + sd, dy * 3) - 0.5); if (cr < 0.03 && dy > -0.6) molten(K, 0.7 * (1 - cr / 0.03)); }); S.unlock();
    K.ball(S, r * 0.35, -r * 1.45, r * 0.5, r * 0.4, (dx, dy, ao) => { basaltM(K, dx * 2 + 4, dy * 2, ao, sd + 1); M.ao = ao * 0.9; }); S.unlock();
    K.ink(S, [26, 12, 10], 0.45); }
  // the altar's rim columns (an engine prop): basalt drums on an obsidian plinth, iron bands; broken (v 0 tall, v 1 a stump, v 3 chained), whole with a fire basket (v 2)
  function paintRuin(K, S, v) { const { M } = K, H = [3.2, 1.2, 3.4, 2.4][v], R0 = 0.44, sd = 1.7 + v * 2.3;
    pool(K, S, 0.95, '255,120,50', 0.7);
    K.rbox(S, 0, 0, 0.62, 0.52, 0, 0.36, 0.05, (f, u, vv, ao) => { obsidM(K, u * 2, vv * 2, sd); if (f === 'f' && Math.abs(vv - 0.28) < 0.03) goldM(K, u, vv, 0.3); }); S.unlock();
    K.rev(S, 0, 0, h => R0 - 0.03 * (h / 4), 0.36, H, { part: 'front', top: v === 2, capMat: (x, h, ao) => basaltM(K, x * 3, h, 1, sd + 1), mat: (u, h, ao, ins, phi) => { const drum = ((h - 0.36) / 0.62) % 1; basaltM(K, u * 1.2, h, ao, sd); if (drum < 0.03) M.ao *= 0.5; const f = Math.cos(phi * 6); M.ao *= 0.75 + 0.25 * f * f; if (Math.abs(h - 0.64) < 0.045 || Math.abs(h - 2.9) < 0.045) ironM(K, u * 3, h * 3, ao, sd, 0.5); const cr = Math.abs(K.vn(u * 3 + sd, h * 1.6) - 0.5); if (cr < 0.012) molten(K, 0.4); } }); S.unlock();
    if (v === 2) { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI + 0.15, x = Math.cos(a) * 0.36; K.tube(S, [[x, -(H + 0.02)], [x * 1.25, -(H + 0.5)]], 0.035, 0.03, (t, s2, ao) => ironM(K, t * 4, s2, ao, 4 + i, 0.5)); S.unlock(); }
      K.ball(S, 0, -(H + 0.3), 0.3, 0.2, (dx, dy, ao) => { M.r = 0.25; M.g = 0.06; M.b = 0.03; M.rg = 0.7; molten(K, 0.35 + 0.7 * (1 - Math.hypot(dx, dy)) * K.vn(dx * 6, dy * 6 + 1)); }); S.unlock(); }
    else { breakTop(S, -R0 - 0.1, R0 + 0.1, H - 0.05, 0.12, sd); }
    if (v === 1) { K.tube(S, [[0.35, -0.3], [1.15, -0.18]], 0.36, 0.36, (t, s2, ao) => { basaltM(K, t * 3, s2, ao, sd + 5); const f = Math.cos(s2 * 6); M.ao *= 0.75 + 0.25 * f * f; }); S.unlock(); }
    if (v === 3) { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([-0.42 + t * 1.1, -(H - 0.4) + Math.sin(t * Math.PI) * 0.7 + t * 1.6]); } K.tube(S, pts, 0.045, 0.045, (t, s2, ao) => { ironM(K, t * 30, s2, ao, 5, 0.4); if (((t * 18) % 1) < 0.22) M.ao *= 0.55; }); S.unlock(); }
    K.glint(S.c, -0.3, -Math.min(H, 2.4) + 0.2, 0.15, 0.55); K.ink(S, [26, 12, 10], 0.5); }
  // a spire rising from the lake far below: jagged obsidian (2D, per pixel: a fixed key from the upper left), its facets
  // glinting, molten where it meets the fire and in its low cracks, the lake's light on its foot
  const SPIRE_H = [6.2, 4.6, 7.4];
  function paintSpire(K, S, v) { const { fbm, vn, clamp, ss } = K, P = S.P, H = SPIRE_H[v], sd = 3.3 + v * 1.7; S.lock(); const d = S.d;
    for (let py = 0; py < S.h; py++) { const y = (S.ay - py - 0.5) / P; if (y < -0.3 || y > H + 0.1) continue; const u = clamp(y / H, 0, 1), half = 0.92 * Math.pow(1 - u, 0.9) + 0.03, wob = 0.42 * (1 - u * 0.6);
      const xl = -half + (fbm(y * 1.6 + sd, 1.1) - 0.5) * wob + (vn(y * 6 + sd, 3) - 0.5) * 0.08, xr = half + (fbm(y * 1.6 + sd, 7.7) - 0.5) * wob + (vn(y * 6 + sd, 9) - 0.5) * 0.08; if (xr <= xl) continue;
      for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P; if (x < xl - 1 / P || x > xr + 1 / P) continue; const sx = (x - xl) / (xr - xl), fac = Math.floor(sx * 3 + fbm(y * 0.8 + sd, sx) * 2);
        let L = 0.95 - sx * 0.75 + (vn(fac * 3.1 + sd, Math.floor(y * 1.5)) - 0.5) * 0.35; L = clamp(L, 0.08, 1.1);
        let r = (0.05 + 0.03 * L) * (0.6 + 0.8 * L), g = (0.04 + 0.02 * L) * (0.6 + 0.8 * L), b = (0.07 + 0.05 * L) * (0.6 + 0.8 * L);
        const gl = Math.exp(-Math.pow((sx - 0.22) / 0.05, 2)) * (vn(y * 2.2 + sd, 5) > 0.45 ? 0.35 : 0.08); r += gl * 0.9; g += gl * 0.8; b += gl * 0.95;   // (a glassy glint down its lit facet)
        const heat = Math.exp(-y / 0.9); r += 0.7 * heat * (0.6 + 0.4 * sx); g += 0.22 * heat; b += 0.05 * heat;   // (the lake's light on its foot)
        const cr = Math.abs(fbm(x * 3 + sd, y * 1.4) - 0.5); if (cr < 0.022 && y < H * 0.55) { const e = (1 - cr / 0.022) * (1 - y / (H * 0.55)); r += 1.2 * e; g += 0.45 * e; b += 0.08 * e; }
        if (y < 0.25) { const e = ss(0.25, -0.2, y); r += 1.0 * e; g += 0.4 * e; b += 0.08 * e; }
        const i = (py * S.w + px) * 4, a = clamp((x - xl) * P + 0.5, 0, 1) * clamp((xr - x) * P + 0.5, 0, 1) * clamp((y + 0.3) * P * 0.5, 0, 1); d[i] = clamp(r * 255, 0, 255); d[i + 1] = clamp(g * 255, 0, 255); d[i + 2] = clamp(b * 255, 0, 255); d[i + 3] = a * 255; } }
    S.unlock(); }

  /* ======================= the sky (2D, per pixel: no lighting pass) ======================= */
  // a strip of the caldera's far wall, 16 tiles wide, rising from the lake: ridged basalt in strata, hot from below, lavafalls pouring down it
  const CL_W = 16, CL_H = 10;
  function paintCliff(K, S, v) { const { fbm, vn, clamp, ss } = K, P = S.P; S.lock(); const d = S.d;
    const ridge = x => 6.2 + 2.6 * fbm(x * 0.21 + v * 7.3, 1.7) + 1.1 * fbm(x * 0.8 + v * 3.1, 4.2) - 0.9 * ss(0.2, 0, Math.min(x, CL_W - x) / CL_W) * 0;
    const falls = [[3.2 + v * 1.7, 0.42], [9.6 - v * 1.3, 0.3], [13.4, 0.22]];
    for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, top = ridge(x); for (let py = 0; py < S.h; py++) { const y = (S.ay - py - 0.5) / P; if (y > top + 1 / P || y < -0.02) continue;
      const strata = Math.sin(y * 3.2 + fbm(x * 0.6, y * 0.4 + v) * 3) * 0.5 + 0.5, n = fbm(x * 1.4 + v * 5, y * 1.4), cr = vn(x * 2.2, y * 0.6 + v * 3);
      const but = fbm(x * 0.85 + v * 3, 0.5 + y * 0.05), col = vn(x * 4.5 + v, y * 0.35), sh = clamp(0.55 + (but - 0.5) * 1.3 + (col - 0.5) * 0.4, 0.2, 1.2);   // (buttresses and columns of rock, lit from the west)
      let r = (0.07 + 0.05 * n + 0.025 * strata) * sh, g = (0.055 + 0.035 * n + 0.018 * strata) * sh, b = (0.06 + 0.03 * n + 0.02 * strata) * sh;
      const heat = Math.exp(-y / 1.6); r += 0.55 * heat; g += 0.16 * heat; b += 0.04 * heat;   // (the lake's light on the wall's foot)
      const rim = ss(0.5, 0, top - y); r += 0.32 * rim; g += 0.12 * rim; b += 0.08 * rim;   // (the ember sky behind its crest)
      let e = 0; for (const [fx, w] of falls) { const wob = fx + Math.sin(y * 0.7 + v + fx) * 0.09, dx = Math.abs(x - wob), ww = w * (0.55 + 0.45 * ss(top - 0.6, 1, y)); if (dx < ww && y < top - 0.6) { const k = (1 - dx / ww), fl = 0.55 + 0.45 * vn(x * 7, y * 2.2 + fx); e = Math.max(e, k * k * fl * ss(top - 0.6, top - 1.6, y)); } }
      if (cr < 0.04 && y < top - 1) e = Math.max(e, 0.5 * (1 - cr / 0.04) * ss(top - 1, 1, y));
      r += 1.3 * e; g += 0.55 * e + 0.25 * e * e; b += 0.1 * e * e;
      const i = (py * S.w + px) * 4, a = clamp((top - y) * P + 0.5, 0, 1); d[i] = clamp(r * 255, 0, 255); d[i + 1] = clamp(g * 255, 0, 255); d[i + 2] = clamp(b * 255, 0, 255); d[i + 3] = a * 255; } }
    S.unlock(); }
  // the dying sun over the caldera (P px per its radius): a dark disc of cinders, its limb aflame, a corona of fire
  function paintEclipse(K, S) { const { fbm, clamp, ss } = K, P = S.P; S.lock(); const d = S.d;
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, r = Math.hypot(x, y), a = Math.atan2(y, x); if (r > 1.9) continue;
      let R = 0, G = 0, B = 0, A = 0;
      if (r < 1) { const z = Math.sqrt(1 - r * r), n = fbm(x * 3 + 2, y * 3); R = 0.07 + 0.08 * n + 0.6 * Math.pow(1 - z, 3); G = 0.025 + 0.03 * n + 0.18 * Math.pow(1 - z, 3); B = 0.02 + 0.02 * n; A = clamp((1 - r) * P + 0.5, 0, 1); const cr = Math.abs(fbm(x * 4, y * 4 + 7) - 0.5); if (cr < 0.025) { R += 0.4; G += 0.1; } }
      const cor = Math.exp(-(r - 1) * 3.4) * (0.45 + 0.55 * fbm(Math.cos(a) * 3 + 5, Math.sin(a) * 3 + r * 2.5)) * ss(0.96, 1.0, r); if (r >= 0.97) { R += 1.4 * cor; G += 0.55 * cor + 0.3 * cor * cor; B += 0.12 * cor * cor; A = Math.max(A, clamp(cor * 1.4, 0, 1)); }
      const i = (py * S.w + px) * 4; d[i] = clamp(R * 255, 0, 255); d[i + 1] = clamp(G * 255, 0, 255); d[i + 2] = clamp(B * 255, 0, 255); d[i + 3] = A * 255; }
    S.unlock(); }

  /* ======================= the pictures ======================= */
  const DEFS = {
    crucible: { light: 'forge', box: () => [-1.75, -3.65, 1.75, 0.6], paint: paintCrucible },
    furnace: { light: 'forge', box: () => [-1.6, -3.3, 1.6, 0.55], paint: paintFurnace },
    lever: { light: 'forge', box: () => [-0.62, -0.75, 0.62, 0.4], paint: paintLever },
    handle: { light: 'forge', box: () => [-0.16, -1.05, 0.16, 0.08], paint: paintHandle },
    ramsw: { light: 'forge', box: () => [-0.7, -0.75, 0.7, 0.42], paint: paintRamSw },
    rhorns: { light: 'forge', box: () => [-0.75, -0.85, 0.75, 0.08], paint: paintRHorns },
    kiln: { light: 'forge', box: () => [-1.28, -2.35, 1.0, 0.5], paint: paintKiln },
    trough: { light: 'forge', box: () => [-0.85, -0.7, 0.85, 0.45], paint: paintTrough },
    brazier: { light: 'forge', box: () => [-0.75, -1.55, 0.75, 0.45], paint: paintBrazier },
    pillar: { light: 'forge', box: () => [-1.0, -3.4, 1.0, 0.5], paint: paintPillar },
    door: { light: 'forge', box: () => [-3.45, -5.35, 3.45, 0.75], paint: paintDoor },
    leaf: { light: 'forge', box: v => v === 'l' ? [-GEO.WO - 0.15, -GEO.L0 - 0.3, 0.06, -GEO.PZ + 0.1] : [-0.06, -GEO.L0 - 0.3, GEO.WO + 0.15, -GEO.PZ + 0.1], paint: paintLeaf },
    bar: { light: 'forge', box: () => [-1.55, -0.2, 1.55, 0.2], paint: paintBar },
    hornarch: { light: 'altar', box: v => [-4.6, -7.4, 4.6, 0.75], paint: paintHornArch },
    shard: { light: 'altar', box: v => { const r = [0.62, 0.48, 0.36][v]; return [-r - 0.1, -r * 2.05, r + 0.2, 0.08]; }, paint: paintShard },
    ruin: { light: 'altar', box: v => [-1.15, -(v === 2 ? 4.0 : v === 3 ? 3.4 : 3.6), v === 1 ? 1.65 : 1.15, 0.6], paint: paintRuin },
    spire: { box: v => [-1.3, -SPIRE_H[v] - 0.2, 1.3, 0.35], paint: paintSpire },
    cliff: { box: () => [0, -CL_H, CL_W, 0.02], paint: paintCliff },
    eclipse: { box: () => [-1.9, -1.9, 1.9, 1.9], paint: paintEclipse } };
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  function paint(name, v, P) { const B = BP(); if (!B) return null; const K = B.kit, D = DEFS[name], b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); const go = () => { D.paint(K, S, v); S.unlock(); }; if (D.light) lit(K, D.light, go); else go(); } catch (e) { if (typeof console !== 'undefined') console.warn('ARIES_PROPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = document.createElement('canvas'); cv.width = S.w; cv.height = S.h; cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (the work canvas, read back often, given back at once)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  const keyOf = (name, v, P) => name + '|' + v + '|' + P;
  function sprite(name, v, P, force) { if (!DEFS[name] || !BP()) return null; P = Math.max(6, Math.round(P || BASE || 48)); const key = keyOf(name, v, P); let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 12) return null;   // (a painting budget: what does not fit waits a frame)
    s = paint(name, v, P); if (s) CACHE.set(key, s); return s; }
  // (the sky's pictures are drawn smaller than the floor and capped: the cliffs at 3/4 of a tile's sharpness, the sun at a radius of 2.4 tiles)
  const SKY_P = { cliff: P => Math.round(Math.min(P, 64) * 0.75), eclipse: P => Math.round(Math.min(P, 56) * 2.4), spire: P => Math.round(Math.min(P, 72) * 0.8) };
  const ECL_R = 2.4;
  function pick(name, v) { if (!BASE) return null; const PB = SKY_P[name] ? SKY_P[name](BASE) : BASE, s = CACHE.get(keyOf(name, v, PB)); return s || sprite(name, v, PB); }
  function draw(c, name, v, Xs, Ys, T, o) { const s = pick(name, v); if (!s) { STATS.misses++; return false; } o = o || {}; const f = T / s.P * (name === 'eclipse' ? ECL_R : 1), sx = o.sx == null ? 1 : o.sx, sy = o.sy == null ? 1 : o.sy; STATS.draws++;
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.translate(Xs, Ys); if (o.rot) c.rotate(o.rot); if (sx !== 1 || sy !== 1) c.scale(sx, sy); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); return true; }
  const WARM = [['crucible', 0], ['furnace', 0], ['lever', 0], ['handle', 0], ['ramsw', 0], ['rhorns', 0], ['kiln', 0], ['trough', 0], ['brazier', 0], ['door', 0], ['leaf', 'l'], ['leaf', 'r'], ['bar', 0],
    ['hornarch', 0], ['shard', 0], ['shard', 1], ['shard', 2], ['spire', 0], ['spire', 1], ['spire', 2], ['cliff', 0], ['cliff', 1], ['eclipse', 0]];
  function warm(P) { if (!BP() || !(P > 2)) return []; BASE = Math.round(P); return WARM.map(([n, v]) => () => { sprite(n, v, SKY_P[n] ? SKY_P[n](BASE) : BASE, true); }); }
  function release() { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); BASE = 0; }

  /* ======================= the engine's props (breakable): painted straight into the engine's prop cache ======================= */
  const PROP_OF = { agpillar: ['pillar', 2], agruin: ['ruin', 4] };
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS;
    for (const [kind, [name, n]] of Object.entries(PROP_OF)) { if (PR[kind] && PR[kind].__agp) continue;
      const f = function (c, P, v) { const s = paint(name, ((v | 0) % n + n) % n, Math.max(8, Math.round(P))); if (!s) return; c.drawImage(s.cv, -s.ax, -s.ay); s.cv.width = s.cv.height = 1; };
      f.__agp = 1; PR[kind] = f; }
    if (!PR.agnone) PR.agnone = () => {};
    if (typeof window !== 'undefined') { window.PROP_EXT = window.PROP_EXT || {}; Object.assign(window.PROP_EXT, { agpillar: [2.4, 3.6], agruin: [2.8, 4.4] }); }
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) Object.assign(BREAK_FX.KIND, { agpillar: { mat: 'stone', cols: ['#2E2829', '#5A5052', '#FF8A3D'] }, agruin: { mat: 'stone', cols: ['#2B2627', '#120E16', '#FFB070'] } });
    if (typeof PROP_EL !== 'undefined') Object.assign(PROP_EL, { agpillar: 'fire', agruin: 'fire' }); }
  install();
  const setBase = P => { if (P > 2) BASE = Math.round(P); };
  const API = { draw, sprite: (n, v, P) => sprite(n, v, P, true), has: n => !!DEFS[n] && !!BP(), warm, release, setBase, install, hornPts, GEO, ECL_R, CL_W, CL_H, SKY_P, DEFS, LIGHT, get base() { return BASE; }, get stats() { return Object.assign({ cached: CACHE.size, keys: [...CACHE.keys()] }, STATS); } };
  if (typeof window !== 'undefined') window.ARIES_PROPS = API;
  return API;
})();
