/* ---------- v470 AE: the Pale Aurora's trial pieces and its frost tomatoes, painted (20s6d's AUR_PROPS) ----------
   Each piece is painted once (BELPROPS.kit, the land's light) and laid down by the stages' "v470 AE" hooks (20s5, 20s6b) through
   AUR_PROPS.piece(c, name, v, Xs, Ys, T, o); what moves (a vane's arrow and pennant, a lever's arm, a sliding block) is the same
   picture turned or moved; what glows (the vanes' eyes, the ember, the brazier's fire, the shelters' warm floor, the wind, the
   frost of an armed tomato) is the GPU painter's light queued with AUR_PROPS.ql / .qo. Their rules are untouched: these are
   their looks. Without the painter (or GPU light) each hook draws the old 2D art.
     the Windbreak Crossing: aurvane (the stone plinth and iron mast of a working vane), aurvanearm (its arrow and fins), aurslab
       (a panel of the folding ice windbreak)
     the Avalanche Galleries: aurchute (a stone chute lined with ice), aurlever (its base) + aurleverarm, aurdeflect (the
       sliding stone deflector), aurblock (a block of glacier ice), aurbasin (v 0 empty, 1 full, 2 a drop into the crevasse)
     Whiteout Ascent: aurniche (a shelter: an arch of dark stone), aurbowl (its gold bowl), aurbrazier (v 0 cold, 1 burning),
       aurbarrier (a slab of the ice barrier)
     the frost tomatoes: aurtomato (the glossy blue fruit and its icy calyx), aurfreeze (the block of ice round a frozen pet) */
(() => {
  const A = typeof AUR_PROPS !== 'undefined' ? AUR_PROPS : null; if (!A) return;
  const TAU = Math.PI * 2, X = A.kitx, DEF = A.DEF, clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u;
  const ice = (K, sd, L, o) => (f, q, wt, tip) => X.iceM(K, f, q, wt, tip, sd, Object.assign({ tint: X.TINT[L] }, o || {}));
  Object.assign(DEF, {
    /* the vane's plinth: a stepped block of rimed granite, a bronze collar, the iron mast to its hub (the arm is aurvanearm) */
    aurvane: { box: () => [-0.75, -2.2, 0.75, 0.4], vs: [0], paint(K, S, v, L) { const sd = 501, c = S.c; X.contact(K, S, 0.6, 0.2, 0.6);
      X.box(K, S, 0, 0.04, 0.44, 0.3, 0, 0.18, 0.04, (f, u, vv) => X.rockM(K, u * 2, vv * 2, sd, 0.6, f === 't')); S.unlock();
      X.box(K, S, 0, 0.02, 0.32, 0.22, 0.18, 0.42, 0.04, (f, u, vv) => { X.rockM(K, u * 2, vv * 2, sd + 1, 0.5, f === 't'); if (f === 'f' && Math.abs(vv - 0.3) < 0.03) X.brassM(K, u * 4, vv * 4, 1, sd, 0.4); }); S.unlock();
      X.snowCap(K, S, 0.02, -0.5, 0.3, 0.07, sd + 3);
      K.rev(S, 0, -0.42, h => (h < 0.1 ? 0.085 : 0.055) - h * 0.005, 0, 1.45, { mat: (u, h, ao) => K.iron(u * 3, h * 2, ao, sd), top: true, capMat: () => X.brassM(K, 0, 0, 1, sd, 0.6) }); S.unlock();
      K.ball(S, 0, -1.9, 0.09, 0.09, (dx, dy) => X.brassM(K, dx, dy, 1, sd + 3, 0.5)); S.unlock(); X.icicles(K, S, -0.3, 0.3, -0.42, 4, 0.14, sd, L); K.ink(S, X.INK[L], 0.45); } },
    // its arm, drawn turned: an arrow and a finned tail on a bar (its feet at the hub)
    aurvanearm: { box: () => [-0.85, -0.35, 0.85, 0.35], vs: [0], paint(K, S, v, L) { const sd = 503, c = S.c;
      K.tube(S, [[-0.65, 0], [0.62, 0]], 0.03, 0.025, (t, s, ao) => K.iron(t * 4, s, ao, sd)); S.unlock();
      c.save(); c.translate(0.64, 0); c.beginPath(); c.moveTo(0.18, 0); c.lineTo(-0.08, -0.12); c.lineTo(-0.03, 0); c.lineTo(-0.08, 0.12); c.closePath(); let g = c.createLinearGradient(0, -0.12, 0, 0.12); g.addColorStop(0, '#B8C4D4'); g.addColorStop(0.5, '#4A5468'); g.addColorStop(1, '#1E2638'); c.fillStyle = g; c.fill(); c.restore();
      c.save(); c.translate(-0.62, 0); c.beginPath(); c.moveTo(0.05, 0); c.lineTo(-0.24, -0.26); c.lineTo(-0.3, -0.2); c.lineTo(-0.14, 0); c.lineTo(-0.3, 0.2); c.lineTo(-0.24, 0.26); c.closePath(); g = c.createLinearGradient(0, -0.26, 0, 0.26); g.addColorStop(0, '#C8D4E2'); g.addColorStop(0.45, '#5A6678'); g.addColorStop(1, '#262E3E'); c.fillStyle = g; c.fill(); c.restore();
      K.ink(S, X.INK[L], 0.4); } },
    /* a panel of the folding windbreak: a tall slab of clear ice in an iron frame, frosted at its foot */
    aurslab: { box: () => [-0.32, -1.45, 0.32, 0.12], vs: [0, 1], paint(K, S, v, L) { const sd = 511 + v;
      X.prism(K, S, 0, 0, 0.2, 0.18, 1.12, 0.22, (v ? 0.04 : -0.04), ice(K, sd, L, { root: 0.25, frost: 1.2 }));
      K.tube(S, [[-0.2, -0.02], [-0.19, -1.15]], 0.025, 0.022, (t, s, ao) => K.iron(t * 4, s, ao, sd)); K.tube(S, [[0.2, -0.02], [0.19, -1.15]], 0.025, 0.022, (t, s, ao) => K.iron(t * 4, s, ao, sd + 1)); S.unlock(); K.ink(S, X.INK[L], 0.4); } },
    /* a chute at the cliff's top: dressed stone walls, its bed lined with blue ice, snow on its lips */
    aurchute: { box: () => [-1.05, -1.95, 1.05, 0.3], vs: [0], paint(K, S, v, L) { const sd = 521, c = S.c;
      for (const sx of [-1, 1]) { X.box(K, S, sx * 0.78, 0, 0.16, 0.26, 0, 1.45, 0.04, (f, u, vv) => X.stoneM(K, u * 2 + sx, vv * 2, sd + sx, { up: f === 't', frost: 0.5 })); S.unlock(); X.snowCap(K, S, sx * 0.78, -1.53, 0.18, 0.06, sd + sx); }
      X.box(K, S, 0, 0.02, 0.62, 0.2, 0, 0.12, 0.03, (f, u, vv) => { const M = K.M; X.iceM(K, 0, u * 1.6, 0.6 + vv * 0.2, false, sd + 4, { tint: X.TINT[L] }); if (f === 't') M.ao *= 0.9; }); S.unlock();
      X.box(K, S, 0, -1.05, 0.62, 0.18, 0, 0.3, 0.03, (f, u, vv) => X.stoneM(K, u * 2, vv * 2, sd + 7, { up: f === 't' })); S.unlock(); X.snowCap(K, S, 0, -1.55, 0.6, 0.08, sd + 8);
      X.icicles(K, S, -0.5, 0.5, -1.05, 6, 0.2, sd, L); K.ink(S, X.INK[L], 0.45); } },
    /* a release lever's base: a squat block of stone, a bronze pivot boss (the arm is aurleverarm) */
    aurlever: { box: () => [-0.55, -0.75, 0.55, 0.3], vs: [0], paint(K, S, v, L) { const sd = 531; X.contact(K, S, 0.45, 0.16, 0.55);
      X.box(K, S, 0, 0.02, 0.32, 0.22, 0, 0.42, 0.05, (f, u, vv) => X.stoneM(K, u * 2, vv * 2, sd, { up: f === 't', frost: 0.5 })); S.unlock();
      X.disc(K, S, 0, -0.42, 0.1, 0.1, (dx, dy, e, ao) => X.brassM(K, dx, dy, ao, sd, 0.5), { bv: 0.3, dome: 0.4 }); S.unlock(); X.snowCap(K, S, 0.04, -0.5, 0.26, 0.05, sd + 3); K.ink(S, X.INK[L], 0.45); } },
    aurleverarm: { box: () => [-0.16, -0.98, 0.16, 0.1], vs: [0], paint(K, S, v, L) { const sd = 533;
      K.tube(S, [[0, 0], [0, -0.78]], 0.04, 0.035, (t, s, ao) => K.iron(t * 4, s, ao, sd)); S.unlock();
      K.ball(S, 0, -0.84, 0.11, 0.11, (dx, dy) => { const M = K.M; M.r = 0.04; M.g = 0.22; M.b = 0.16; M.rg = 0.08; M.cc = 1; M.er = 0.2 + 0.2 * (1 - dy); M.eg = 0.6 + 0.2 * (1 - dy); M.eb = 0.42; }); S.unlock(); K.glint(S.c, -0.04, -0.88, 0.06, 0.8); K.ink(S, X.INK[L], 0.4); } },
    /* the sliding deflector: a wedge of dressed stone on iron shoes, its turning face polished pale (v 0 turns east) */
    aurdeflect: { box: () => [-1.0, -0.9, 1.05, 0.5], vs: [0], paint(K, S, v, L) { const sd = 541, c = S.c;       X.box(K, S, 0, 0.36, 0.86, 0.3, 0, 0.98, 0.05, (f, u, vv) => X.stoneM(K, u * 2, vv * 2, sd + 1, { up: f === 't', frost: 0.4 })); S.unlock();
      c.save(); c.globalCompositeOperation = 'destination-in'; c.beginPath(); c.moveTo(-0.9, -0.66); c.lineTo(0.98, 0.42); c.lineTo(0.98, 0.6); c.lineTo(-0.9, 0.6); c.closePath(); c.fill(); c.restore();   // (cut to its wedge)
      c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(-0.82, -0.62, 0.9, 0.36); g.addColorStop(0, 'rgba(244,250,255,.85)'); g.addColorStop(1, 'rgba(220,236,250,.5)'); c.strokeStyle = g; c.lineWidth = 0.08; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.8, -0.58); c.lineTo(0.86, 0.34); c.stroke(); c.restore();
      X.box(K, S, 0, 0.44, 0.86, 0.1, 0, 0.07, 0.02, (f, u, vv) => K.iron(u * 4, vv * 4, 1, sd)); S.unlock(); c.save(); c.globalCompositeOperation = 'destination-over'; K.contact(S, 0, 0.4, 0.9, 0.24, 0.55); c.restore();
      K.ink(S, X.INK[L], 0.45); } },
    /* a block of glacier ice, cut square and bevelled, light held inside, frost on its top */
    aurblock: { box: () => [-0.75, -1.3, 0.75, 0.3], vs: [0], paint(K, S, v, L) { const sd = 551;
      X.box(K, S, 0, 0.05, 0.62, 0.4, 0, 0.95, 0.08, (f, u, vv, ao, e) => { X.iceM(K, f === 't' ? 0 : u > 0.3 ? 1 : 0, u * 1.6, f === 't' ? 0.95 : 0.2 + vv * 0.7, false, sd + (f === 't' ? 3 : 0), { tint: X.TINT[L], frost: f === 't' ? 1.6 : 0.8, root: 0.15 }); }); S.unlock();
      K.glint(S.c, -0.3, -1.05, 0.12, 0.8); K.ink(S, X.INK[L], 0.45); } },
    /* a catch basin at the slope's foot: a ring of dressed stone, its hollow dark (v 0), or filled with a block's ice (v 1); v 2 a
       drop: a crevasse's mouth in the ice, blue going to black */
    aurbasin: { box: () => [-1.25, -0.65, 1.25, 0.65], vs: [0, 1, 2], paint(K, S, v, L) { const sd = 561 + v, c = S.c, P = S.P, rx = 1.05, ry = 0.5;
      if (v === 2) { S.lock(); for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, e = Math.hypot(x / rx, y / ry) + 0.08 * K.vn(x * 6 + sd, y * 6); if (e > 1) continue; K.M0(); const M = K.M, k = 1 - e; M.r = 0.02; M.g = 0.04; M.b = 0.08; M.rg = 0.2; M.cc = 0.6; M.er = 0.02 + 0.12 * Math.pow(e, 3); M.eg = 0.05 + 0.24 * Math.pow(e, 3); M.eb = 0.1 + 0.36 * Math.pow(e, 3); K.shade(0, 0.3, 0.95); K.put(S, px, py, clamp((1 - e) * 30, 0, 1)); } S.unlock(); K.ink(S, X.INK[L], 0.3); return; }
      S.lock(); for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, e = Math.hypot(x / rx, y / ry); if (e > 1.02) continue; K.M0(); const M = K.M;
        if (e > 0.72) { const a = Math.atan2(y, x), bi = Math.floor((a + Math.PI) / (TAU / 14)), f = ((a + Math.PI) / (TAU / 14)) % 1; X.stoneM(K, x * 3 + bi, y * 3, sd + bi, { up: true, frost: 0.5 }); if (Math.min(f, 1 - f) < 0.06) M.ao *= 0.5; K.shade(x / rx * 0.4, 0.3 - y * 0.3, 0.86); }
        else if (v === 1) { X.iceM(K, 0, x * 1.2, 0.7 + y * 0.3, false, sd, { tint: X.TINT[L], frost: 1.2 }); K.shade(0, 0.2, 0.98); }
        else { M.r = 0.04; M.g = 0.06; M.b = 0.1; M.ao = 0.4 + 0.5 * e; K.shade(-x * 0.4, 0.2, 0.9); }
        K.put(S, px, py, clamp((1.02 - e) * 40, 0, 1)); } S.unlock(); K.ink(S, X.INK[L], 0.4); } },
    /* a shelter: a deep arch of dark stone blocks, snow on its crown, its back wall in shadow (the warm floor and bowl lie inside) */
    aurniche: { box: () => [-1.85, -3.9, 1.85, 0.2], vs: [0], paint(K, S, v, L) { const sd = 571, c = S.c;
      X.box(K, S, 0, -0.55, 1.3, 0.08, 0, 2.25, 0.03, (f, u, vv) => { X.rockM(K, u * 2, vv * 2, sd, 0.35, false); K.M.ao *= 0.55 + 0.3 * Math.min(1, vv / 2.2); }); S.unlock();
      X.lump(K, S, 0, -0.62, 1.25, 0.2, { amp: 0.15, fr: 2.5, sd: sd + 30, bump: 0.25, flat: 1, mat: (dx, dy, ao, e, nz, wx, wy) => X.snowM(K, wx * 2, wy * 2, sd + 30, { blue: 0.25 }) }); S.unlock();   // (snow drifted in at the back wall's foot)
      for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) { X.box(K, S, sx * 1.44, -0.35, 0.2, 0.26, i * 0.46, i * 0.46 + 0.45, 0.03, (f, u, vv) => X.rockM(K, u * 2 + i, vv * 2, sd + sx * 3 + i, 0.55, f === 't')); S.unlock(); }
      const N = 9; for (let i = 0; i < N; i++) { const a0 = Math.PI + i / N * Math.PI, a1 = Math.PI + (i + 1) / N * Math.PI, pts = []; for (let k = 0; k <= 4; k++) { const a = lerp(a0, a1, k / 4); pts.push([Math.cos(a) * 1.44, -2.65 - Math.sin(a + Math.PI) * 1.0]); }
        K.tube(S, pts, 0.2, 0.2, (t, s2, ao) => { X.rockM(K, t * 2 + i * 3, s2, sd + 9 + i, 0.6, s2 < -0.3); if (t < 0.05 || t > 0.95) K.M.ao *= 0.5; }); S.unlock(); }
      X.snowCap(K, S, 0, -3.72, 0.8, 0.2, sd + 2); for (const sx of [-1, 1]) X.snowCap(K, S, sx * 1.46, -2.38, 0.18, 0.07, sd + sx);
      X.icicles(K, S, -0.9, 0.9, -2.62, 8, 0.32, sd, L); K.ink(S, X.INK[L], 0.45); } },
    aurbowl: { box: () => [-0.55, -0.45, 0.55, 0.25], vs: [0], paint(K, S, v, L) { const sd = 581;
      K.rev(S, 0, 0, h => h < 0.06 ? 0.14 : 0.14 + 0.3 * Math.sqrt((h - 0.06) / 0.26), 0, 0.32, { mat: (u, h, ao) => X.brassM(K, u * 3, h * 3, ao, sd, 0.55), top: true, capMat: (x, h, ao, i, ph, x2, ey) => { X.brassM(K, x * 3, ey * 3, 0.5, sd + 1, 0.2); K.M.ao = 0.45; } }); S.unlock(); K.ink(S, X.INK[L], 0.45); } },
    /* the summit brazier: a wide stone bowl on a stepped foot; v 1 burning (its coals glow; the flame is the GPU's) */
    aurbrazier: { box: () => [-0.95, -1.25, 0.95, 0.35], vs: [0, 1], paint(K, S, v, L) { const sd = 591; X.contact(K, S, 0.75, 0.24, 0.6);
      X.box(K, S, 0, 0.03, 0.55, 0.36, 0, 0.2, 0.05, (f, u, vv) => X.rockM(K, u * 2, vv * 2, sd, 0.5, f === 't')); S.unlock();
      K.rev(S, 0, -0.2, h => h < 0.3 ? 0.22 : 0.22 + 0.48 * Math.sqrt((h - 0.3) / 0.45), 0, 0.75, { mat: (u, h, ao) => { X.rockM(K, u * 2, h * 2, sd + 1, 0.4, false); if (v && h > 0.55) { K.M.er = 0.3 * (h - 0.55) * 5; K.M.eg = 0.12 * (h - 0.55) * 5; } }, top: true,
        capMat: (x, h, ao, i, ph, x2, ey) => { const M = K.M, w = K.vn(x * 9 + sd, ey * 9); if (v) { M.r = 0.1; M.g = 0.04; M.b = 0.02; M.rg = 0.7; M.er = 0.9 * w + 0.2; M.eg = 0.36 * w + 0.05; M.eb = 0.05; } else { X.rockM(K, x * 4, ey * 4, sd + 3, 0, false); M.ao = 0.3 + 0.3 * w; } } }); S.unlock();
      if (!v) X.snowCap(K, S, 0, -1.02, 0.55, 0.08, sd + 4); K.ink(S, X.INK[L], 0.45); } },
    /* a slab of the ice barrier over the summit's way out: a thick wall of ice, light inside, snow along its top */
    aurbarrier: { box: () => [-0.56, -1.95, 0.56, 0.2], vs: [0, 1], paint(K, S, v, L) { const sd = 601 + v;
      X.box(K, S, 0, 0.05, 0.52, 0.28, 0, 1.6, 0.05, (f, u, vv) => X.iceM(K, f === 't' ? 0 : u > 0.35 ? 1 : 0, u * 1.4 + v, f === 't' ? 0.9 : 0.15 + vv * 0.5, false, sd, { tint: X.TINT[L], frost: 1.3, root: 0.2 })); S.unlock();
      X.snowCap(K, S, 0, -1.78, 0.5, 0.08, sd + 2); K.ink(S, X.INK[L], 0.35); } },
    /* the frost tomato: a giant glossy fruit of deep blue, five soft lobes, rime freckles, a star of icy pale-green leaves */
    aurtomato: { box: () => [-1.2, -2.05, 1.2, 0.35], vs: [0], paint(K, S, v, L) { const sd = 611, c = S.c, P = S.P, R = 0.95, cy = -0.8; X.contact(K, S, 1.0, 0.3, 0.6);
      S.lock(); for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, a = Math.atan2(y - cy, x), rr = R * (1 + 0.05 * Math.cos(a * 5 + 0.3)), dx = x / rr, dy = (y - cy) / (rr * 0.82), e = dx * dx + dy * dy; if (e > 1.03) continue;
        K.M0(); const M = K.M, nz0 = Math.sqrt(Math.max(0, 1 - e)), crease = Math.pow(Math.abs(Math.cos(Math.atan2(dy, dx) * 2.5 + 0.3)), 18) * 0.25; M.r = 0.08; M.g = 0.2; M.b = 0.62; M.rg = 0.16; M.cc = 1; M.eb = 0.06; M.ao = 0.75 + 0.25 * nz0 - crease;
        if (K.vn(x * 21 + sd, y * 21) > 0.86) { M.r = 0.7; M.g = 0.8; M.b = 0.9; M.rg = 0.7; M.cc = 0.2; }
        K.shade(dx * 0.95, nz0, -dy * 0.95); K.put(S, px, py, clamp((1 - Math.sqrt(e)) * R * P * 1.5 + 0.5, 0, 1)); } S.unlock();
      c.save(); c.translate(0, cy - R * 0.74); c.fillStyle = '#B8F5DA'; c.strokeStyle = 'rgba(30,70,60,.9)'; c.lineWidth = 0.03; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? 0.12 : 0.42; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.42); } c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = '#4FA88A'; c.lineWidth = 0.07; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(0.05, -0.32, 0.22, -0.3); c.stroke(); c.restore();
      K.glint(c, -0.36, cy - 0.42, 0.22, 0.9); K.ink(S, X.INK[L], 0.5); } },
    /* the block of ice round a frozen pet: clear ice, frosted, its facets bright */
    aurfreeze: { box: () => [-1.0, -1.7, 1.0, 0.25], vs: [0], paint(K, S, v, L) { const sd = 621;
      X.prism(K, S, -0.42, 0.05, 0.42, 0.36, 0.95, 0.35, -0.12, ice(K, sd, L, { root: 0.1, glow: 0.7 }), { alpha: 0.7 }); X.prism(K, S, 0.36, 0.06, 0.46, 0.4, 0.85, 0.42, 0.14, ice(K, sd + 3, L, { root: 0.1, glow: 0.7 }), { alpha: 0.7 }); S.unlock(); K.ink(S, X.INK[L], 0.3); } },
  });
  // what each trial's loading screen paints (AUR_PROPS.warm)
  A.PIECES_OF.push([/Windbreak/, [['aurvane', 0], ['aurvanearm', 0], ['aurslab', 0], ['aurslab', 1], ['aurtomato', 0]]], [/Avalanche/, [['aurchute', 0], ['aurlever', 0], ['aurleverarm', 0], ['aurdeflect', 0], ['aurblock', 0], ['aurbasin', 0], ['aurbasin', 1], ['aurbasin', 2], ['aurtomato', 0]]],
    [/Whiteout Ascent/, [['aurniche', 0], ['aurbowl', 0], ['aurbrazier', 0], ['aurbrazier', 1], ['aurbarrier', 0], ['aurbarrier', 1], ['aurtomato', 0]]], [/./, [['aurtomato', 0], ['aurfreeze', 0]]]);

  /* ======================= the light of the pieces (called from the stages' hooks) ======================= */
  // the wind across a span (x0..x1, y0..y1 world), blowing toward dir (+1 east): streaming snow (511, laid over the floor), paler
  // when sheltered; k its strength; warn: a soft warm pulse before a lane blows (glow only)
  function wind(Xg, x0, y0, x1, y1, dir, k, o) { o = o || {}; const T = Xg.Tz(), cx = Xg.sx((x0 + x1) / 2), cy = Xg.sy((y0 + y1) / 2), hw = (x1 - x0) / 2 * T, hh2 = (y1 - y0) / 2 * T, light = A.LN_OF[Xg.F.biome] === 'white';
    if (k > 0.02) A.ql('quad', 511, cx, cy, hw * dir, 0, 0, hh2, light ? '#7E9CBE' : '#F4FBFF', 0.9 * k, o.seed || 0, o.pace || 0.6, 0.7);
    if (o.warn > 0) A.ql('glow', cx, cy, Math.max(hw, hh2) * 1.1, '#FFE2A0', 0.18 * o.warn, 0.3); }
  // a sheltered strip: a soft green glow along it (no outline)
  function shelter(Xg, x0, y0, x1, y1, k) { const T = Xg.Tz(), cx = Xg.sx((x0 + x1) / 2); for (let y = y0 + 0.5; y < y1; y += 1.4) A.ql('glow', cx, Xg.sy(y), (x1 - x0) * T * 0.6, '#B8F5DA', 0.16 * k, 0.4); }
  A.light = { wind, shelter };
})();
