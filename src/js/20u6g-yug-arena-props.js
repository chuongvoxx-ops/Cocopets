/* ---------- v472 YE: the Yuggoth Engine's boss arenas' standing pieces, painted (20u6d's YUG_PROPS) ----------
   The fights' props are repainted to the lands' standard without touching the boss files: their drawProp / drawObj (and Ix-Vorra's
   drawPropLive) are wrapped here at run time (FIEND_DEFS.khaal / ixvorra / nyarzhul), and every live state they carry is drawn
   over the painted bodies exactly where the old art drew it:
     Kh'aal (the Breach): the four charge cells in their sockets (ykcell: a steel casing, a window of dark glass, a hazard-banded
       foot, a terminal; their core's pulse and their glow as Kh'aal eats one the GPU's), rising out of the deck as before.
     Ix-Vorra (the Capacitor Hall): the four capacitor pylons (yipylon: a hazard-banded plinth, a dark mast, four copper coils, the
       contact, a brass crown with its prongs); the glass cap of plasma drawn live as before (it swells, cracks, goes white-hot,
       shatters to a stub and re-forms); the current climbing the coils, the contact's light and the cap's glow and arcs the GPU's.
     Nyar'zhul (the Core Chamber): the four capacitors at the rim (yncap: a hazard-banded drum, a glass tube, copper coils, a cap
       with two prongs; v 1 shattered); the core's charge, the arc between the prongs and the broken stub's sparks the GPU's.
   Without the painter (or window.__YUGP = 0) each wrapper hands back to the old art. */
(() => {
  const A = typeof YUG_PROPS !== 'undefined' ? YUG_PROPS : null; if (!A) return;
  const TAU = Math.PI * 2, X0 = A.kitx, DEF = A.DEF, HAS_W = typeof window !== 'undefined', clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, easeOut = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const on = () => !(HAS_W && (window.__YUGP === 0 || window.__BELP === 0)) && HAS_W && window.BELPROPS && window.BELPROPS.kit;
  const VIOLET = '#C452FF', VIOLET_HI = '#E8B8FF', TEAL = '#3FE0C8', TEAL_HI = '#B8FFF2', AMBER = '#FFB23F';
  const hazard = (K, u, sd) => { const M = K.M, s = ((u * 3.4) % 1 + 1) % 1 < 0.5; M.mt = 0.1; if (s) { M.r = 0.85; M.g = 0.52; M.b = 0.12; M.rg = 0.5; } else { M.r = 0.03; M.g = 0.03; M.b = 0.035; M.rg = 0.6; } };
  const CAP_Z = 4.15, CON_Z = 0.55;   // (Ix-Vorra's pylon: its cap and contact heights, as 20z8)
  Object.assign(DEF, {
    /* Kh'aal's charge cell (1 unit = the cell's r; its feet at the socket): a riveted steel casing, a window of dark violet glass,
       amber and black bands round its foot, a terminal block on top */
    ykcell: { box: () => [-0.85, -1.75, 0.85, 0.12], vs: [0], paint(K, S, v, L) { const sd = 701;
      K.rbox(S, 0, 0.02, 0.6, 0.34, 0, 0.32, 0.06, (f, u, vv) => { if (f === 'f') hazard(K, u * 0.9 + vv, sd); else X0.hullM(K, u * 2, vv * 2, sd, { tone: 1.05 }); }); S.unlock();
      K.rbox(S, 0, 0.0, 0.56, 0.3, 0.32, 1.55, 0.1, (f, u, vv) => { X0.hullM(K, u * 2, vv * 2, sd + 1, { paint: 0.55, burn: 0.15 }); if (f === 'f' && Math.abs(u) < 0.38 && vv > 0.45 && vv < 1.42) { const M = K.M, e = 1 - Math.abs(u) / 0.38; M.mt = 0; M.r = 0.03; M.g = 0.015; M.b = 0.06; M.rg = 0.05; M.cc = 1; X0.glowAdd(M, X0.E_VIO, 0.12 + 0.2 * e); } }); S.unlock();
      K.rbox(S, 0, 0.0, 0.26, 0.16, 1.55, 1.72, 0.03, (f, u, vv) => X0.darkM(K, u * 3, vv * 3, sd)); S.unlock();
      const rv = []; for (const x of [-0.47, 0.47]) for (let i = 0; i < 4; i++) rv.push([x, -0.5 - i * 0.3]); X0.rivets(K, S, rv, 0.03, sd);
      K.ink(S, X0.INK[L], 0.4); } },
    /* Ix-Vorra's capacitor pylon (its cap drawn live): a two-step plinth banded amber and black, a dark mast, four copper coils, the
       copper contact low on the mast, a brass collar and the crown's two prongs */
    yipylon: { box: () => [-1.25, -(CAP_Z + 0.95), 1.25, 0.6], vs: [0], paint(K, S, v, L) { const sd = 711; X0.contact(K, S, 1.2, 0.5, 0.6);
      K.rev(S, 0, 0, h => 0.95, 0, 0.32, { mat: (u, h) => { if (h > 0.1 && h < 0.26) hazard(K, u * 0.8 + h, sd); else X0.hullM(K, u * 2, h * 3, sd, { paint: 0.6, pc: [0.06, 0.12, 0.14] }); }, top: true, capMat: (x) => X0.hullM(K, x * 2, 1, sd + 1, { tone: 1.05 }) }); S.unlock();
      K.rev(S, 0, -0.32, h => 0.55, 0, 0.3, { mat: (u, h) => X0.hullM(K, u * 2, h * 3, sd + 2, { paint: 0.5, pc: [0.06, 0.12, 0.14] }), top: true, capMat: () => X0.darkM(K, 0, 0, sd) }); S.unlock();
      K.rev(S, 0, -0.62, h => 0.27 - h * 0.03, 0, 2.95, { mat: (u, h) => X0.darkM(K, u * 3, h * 2, sd) }); S.unlock();
      for (let k = 0; k < 4; k++) { const h0 = 1.15 + k * 0.62 - 0.62 - 0.1, rr = 0.48 - k * 0.04; K.rev(S, 0, -0.62, h => rr * (0.92 + 0.08 * Math.sin(clamp((h - h0) / 0.2, 0, 1) * Math.PI)), h0, h0 + 0.2, { mat: (u, h) => { const gr = Math.abs(((h * 36) % 1) - 0.5) > 0.32 ? 1 : 0; X0.copperM(K, u * 4, h * 30, sd + k, gr); } }); S.unlock(); }
      K.rev(S, 0, -CON_Z - 0.06, h => 0.36, 0, 0.12, { mat: (u, h) => X0.copperM(K, u * 3, h * 9, sd, 0), top: true, capMat: () => X0.copperM(K, 0, 0, sd, 0) }); S.unlock();
      K.rev(S, 0, -3.55, h => 0.4 - h * 0.4, 0, 0.18, { mat: (u, h) => { const M = K.M; M.mt = 1; M.fr = 0.72; M.fg = 0.56; M.fb = 0.3; M.rg = 0.32; }, top: true, capMat: () => { const M = K.M; M.mt = 1; M.fr = 0.72; M.fg = 0.56; M.fb = 0.3; M.rg = 0.32; } }); S.unlock();
      for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8, x = lerp(0.3, 0.42, u) * s + Math.sin(u * Math.PI) * 0.45 * s, y = lerp(-3.55, -CAP_Z - 0.55, u); pts.push([x, y]); } K.tube(S, pts, 0.08, 0.05, (t, s2) => { const M = K.M; M.mt = 1; M.fr = 0.78; M.fg = 0.62; M.fb = 0.34; M.rg = 0.28; }); } S.unlock();
      K.ink(S, X0.INK[L], 0.42); } },
    /* Nyar'zhul's capacitor: a hazard-banded steel drum, a glass tube (empty and dark: its charge the GPU's), three copper coils round
       it, a cap with two prongs; v 1 shattered: the tube broken off short, glass teeth, no cap */
    yncap: { box: () => [-1.15, -3.75, 1.15, 0.55], vs: [0, 1], paint(K, S, v, L) { const sd = 721 + v, br = v === 1, H = 2.7, top = br ? 1.7 : H; X0.contact(K, S, 1.1, 0.42, 0.6);
      K.rev(S, 0, 0, h => 0.95, 0, 0.65, { mat: (u, h) => { if (h > 0.3 && h < 0.5) hazard(K, u * 0.8 + h, sd); else X0.hullM(K, u * 2, h * 3, sd, { burn: 0.2 }); }, top: true, capMat: (x) => X0.hullM(K, x * 2, 2, sd + 1, { tone: 1.1 }) }); S.unlock();
      K.rev(S, 0, -0.65, h => 0.6, 0, top - 0.65, { mat: (u, h) => { const M = K.M; M.r = 0.05; M.g = 0.03; M.b = 0.07; M.rg = 0.05; M.cc = 1; M.sh = 0.5; X0.glowAdd(M, X0.E_VIO, 0.08 + 0.1 * (1 - Math.abs(u) / 0.6)); if (Math.abs(u + 0.32) < 0.05) { M.er += 0.25; M.eg += 0.2; M.eb += 0.3; } } }); S.unlock();
      for (let k = 0; k < 3; k++) { const h0 = 1.0 + k * 0.6 - 0.65 - 0.08; if (h0 + 0.65 > top - 0.1) continue; K.rev(S, 0, -0.65, h => 0.66 * (0.94 + 0.06 * Math.sin(clamp((h - h0) / 0.16, 0, 1) * Math.PI)), h0, h0 + 0.16, { mat: (u, h) => X0.copperM(K, u * 4, h * 30, sd + k, Math.abs(((h * 36) % 1) - 0.5) > 0.32 ? 1 : 0) }); S.unlock(); }
      if (!br) { K.rev(S, 0, -H, h => 0.75 - h * 0.43, 0, 0.35, { mat: (u, h) => X0.hullM(K, u * 2, h * 3, sd + 3, { tone: 1.1 }), top: true, capMat: () => X0.darkM(K, 0, 0, sd) }); S.unlock();
        for (const s of [-1, 1]) K.tube(S, [[s * 0.35, -H - 0.35], [s * 0.5, -H - 0.85]], 0.05, 0.035, (t, s2) => X0.chromeM(K, t, s2, sd)); S.unlock(); }
      else { for (let k = 0; k < 5; k++) { const x = -0.48 + k * 0.24; X0.prism(K, S, x, -top + 0.02, 0.06, 0.03, 0.12 + (k % 2) * 0.15, 0.1, (k - 2) * 0.15, (f, q, wt) => { const M = K.M; M.r = 0.2; M.g = 0.12; M.b = 0.28; M.rg = 0.05; M.cc = 1; X0.glowAdd(M, X0.E_VIO, 0.15); }); } S.unlock(); }
      K.ink(S, X0.INK[L], 0.42); } },
  });
  A.PIECES_OF.push([/khaal/, [['ykcell', 0]]], [/ixvorra/, [['yipylon', 0]]], [/nyarzhul/, [['yncap', 0], ['yncap', 1]]]);

  const STATS = { khaal: 0, ixvorra: 0, nyarzhul: 0, fallback: 0 };
  const live = () => !!(A.live && A.gpuOK && A.gpuOK());
  const qo = A.qo, ql = A.ql;
  const sbolt = (ax, ay, bx, by, w, col, a, sd, wander) => { const dx = (bx - ax) / 2, dy = (by - ay) / 2, l = Math.hypot(dx, dy); if (l < 2) return; qo('quad', 571, ax + dx, ay + dy, dx * 1.05, dy * 1.05, -dy / l * w, dx / l * w, col, a, sd, 0, wander == null ? 0.7 : wander); };
  const mixC = (a, b, u) => { const p = q => [parseInt(q.slice(1, 3), 16), parseInt(q.slice(3, 5), 16), parseInt(q.slice(5, 7), 16)], A2 = p(a), B2 = p(b), k = clamp(u, 0, 1); return `rgb(${Math.round(A2[0] + (B2[0] - A2[0]) * k)},${Math.round(A2[1] + (B2[1] - A2[1]) * k)},${Math.round(A2[2] + (B2[2] - A2[2]) * k)})`; };
  /* ---- Kh'aal's cells ---- */
  function khCell(c, FX, o, X, Y, T, t) { const M = FX.mem || {}, s = M.slots ? M.slots[o.slot] : null, rise = s ? easeOut(s.rise) : 1, r = o.r * T * 1.1, eat = o.grabbed && M.dv && M.dv.eating, sh = eat ? Math.sin(t * 40) * T * 0.06 * (0.4 + M.dv.eat) : 0, dy = (1 - rise) * r * 2.2;
    c.save(); if (rise < 1) { c.beginPath(); c.rect(X - r * 3, Y - r * 5, r * 6, r * 5 + r * 0.15); c.clip(); } const okp = A.piece(c, 'ykcell', 0, X + sh, Y + dy, r); c.restore(); if (!okp) return false;
    if (live() && rise > 0.3) { const k = 0.5 + 0.5 * Math.sin((t * 0.7 + o.slot * 0.23) * TAU * 2), cy = Y + dy - r * 0.98; qo('glow', X + sh, cy, r * (1.1 + k * 0.4), VIOLET, (0.35 + k * 0.25) * rise); qo('glow', X + sh, cy, r * 0.25, '#FFFFFF', 0.45 * rise);
      if (Math.sin(t * 9 + o.slot * 2) > 0.6) sbolt(X + sh - r * 0.18, cy - r * 0.4, X + sh + r * 0.12, cy + r * 0.45, r * 0.3, VIOLET_HI, 0.8, o.slot * 7 + Math.floor(t * 9), 0.8);
      ql('glow', X, Y, r * 1.8, VIOLET, 0.16 * rise, 0.45); if (eat) qo('glow', X, Y - r * 1.0, T * 1.4, VIOLET_HI, 0.4 + 0.4 * M.dv.eat); }
    return true; }
  /* ---- Ix-Vorra's pylons: the painted body (kept by the fight's propKeep) and the cap drawn as before; their light live ---- */
  function ixPylon(c, FX, p, X, Y, T, t) { if (!A.piece(c, 'yipylon', 0, X, Y, T)) return false; const M = FX.mem || {}, i = p.i, q = (M.caps && M.caps[i]) || { k: 1, crack: 0, hot: 0 }, hot = q.hot || 0, capY = Y - CAP_Z * T, R0 = 0.6 * T;
    if (q.k > 0.02) { const r = R0 * (0.25 + 0.75 * q.k), gr = c.createRadialGradient(X - r * 0.3, capY - r * 0.35, r * 0.1, X, capY, r); gr.addColorStop(0, mixC('#F4D8FF', '#FFFFFF', hot)); gr.addColorStop(0.45, mixC(VIOLET, '#F0D0FF', hot * 0.8)); gr.addColorStop(1, mixC('#5A1A9A', VIOLET, hot)); c.fillStyle = gr; c.beginPath(); c.arc(X, capY, r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(20,10,30,.7)'; c.lineWidth = Math.max(1, T * 0.04); c.stroke(); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(X - r * 0.38, capY - r * 0.42, r * 0.26, r * 0.13, -0.7, 0, TAU); c.fill();
      if (q.crack > 0.05) { c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = Math.max(1, T * 0.04); const n = Math.ceil(q.crack * 6); for (let j = 0; j < n; j++) { const a = j * 1.9 + 0.4; c.beginPath(); c.moveTo(X + Math.cos(a) * r * 0.1, capY + Math.sin(a) * r * 0.1); c.lineTo(X + Math.cos(a + 0.3) * r * 0.55, capY + Math.sin(a + 0.3) * r * 0.55); c.lineTo(X + Math.cos(a - 0.1) * r, capY + Math.sin(a - 0.1) * r); c.stroke(); } } }
    if (q.k < 1) { c.fillStyle = 'rgba(232,184,255,.65)'; c.strokeStyle = 'rgba(20,10,30,.8)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(X - R0 * 0.8, capY + R0 * 0.55); for (let j = 0; j <= 6; j++) { const u = j / 6; c.lineTo(X - R0 * 0.8 + u * R0 * 1.6, capY + R0 * 0.55 - (j % 2 ? R0 * 0.7 : R0 * 0.25)); } c.lineTo(X + R0 * 0.8, capY + R0 * 0.75); c.closePath(); c.fill(); c.stroke(); }
    return true; }
  function ixPylonLive(c, FX, p, X, Y, T, t) { if (!live()) return; const M = FX.mem || {}, i = p.i, q = (M.caps && M.caps[i]) || { k: 1, crack: 0, hot: 0 }, hot = q.hot || 0, O = M.ov, charging = !!(O && O.i === i), W = M.web, capY = Y - CAP_Z * T;
    const webOn = !!(W && W.rot === 0 && W.beams && W.beams.some(b => b.a === i || b.b === i)), webLive = webOn && W.live;
    for (let k = 0; k < 4; k++) { const z = 1.15 + k * 0.62, fl = 0.5 + 0.5 * Math.sin(t * (charging ? 14 : 3) - k * 1.3); qo('glow', X, Y - z * T + T * 0.05, T * (0.55 - k * 0.04), charging ? (hot > 0.5 ? '#FFFFFF' : VIOLET_HI) : (k % 2 ? TEAL : VIOLET), (0.18 + 0.22 * fl) * (0.7 + hot * 0.6), 0.4); }
    if (webOn) { const ca = Math.atan2(FX.C.y - p.y, FX.C.x - p.x), nx = X + Math.cos(ca) * T * 0.5, ny = Y - (CON_Z + 0.1) * T + Math.sin(ca) * T * 0.2; qo('glow', nx, ny, T * 0.8, VIOLET_HI, webLive ? 0.75 : 0.4 + 0.25 * Math.sin(t * 12)); qo('glow', nx, ny, T * 0.18, '#FFFFFF', 0.7); }
    if (q.k > 0.02) { const r = 0.6 * T * (0.25 + 0.75 * q.k), k = 0.6 + 0.4 * Math.sin(t * (2.2 + hot * 12) + i); qo('glow', X, capY, r * 3.2, hot > 0.6 ? '#FFFFFF' : VIOLET, (0.35 + 0.3 * k) * (0.6 + hot * 0.8)); qo('glow', X, capY, r * 0.6, '#FFFFFF', 0.3 + 0.4 * hot);
      for (let j = 0; j < 2; j++) { const a0 = t * (1.5 + hot * 6) + j * 2.1; sbolt(X, capY, X + Math.cos(a0) * r * 0.95, capY + Math.sin(a0 * 1.3) * r * 0.95, r * 0.35, VIOLET_HI, 0.6, i * 11 + j, 0.9); }
      if (hot > 0.05) { const fr = Math.floor(t * 20); for (let j = 0; j < 1 + Math.round(hot * 3); j++) { const a = ((fr * 7 + j * 13 + i * 3) % 17) / 17 * TAU, L = r * (1.4 + ((fr + j) % 5) * 0.3); sbolt(X + Math.cos(a) * r, capY + Math.sin(a) * r, X + Math.cos(a) * L, capY + Math.sin(a) * L, T * 0.35, VIOLET, 0.9, fr + j * 3, 0.8); } } }
    ql('glow', X, Y, T * 1.4, VIOLET, 0.12 + 0.15 * hot, 0.45); STATS.ixvorra++; }
  /* ---- Nyar'zhul's capacitors ---- */
  function nyCap(c, FX, p, X, Y, T, t) { const M = FX.mem, cp = M && M.caps ? M.caps[p.i] : { st: 'idle' }, st = cp.st, chg = st === 'charged', br = st === 'broken'; if (!A.piece(c, 'yncap', br ? 1 : 0, X, Y, T)) return false;
    if (live()) { const H = 2.7, top = br ? 1.7 : H, pu = 0.5 + 0.5 * Math.sin(t * (chg ? 14 : 2) + p.i), Q = z => Y - z * T;
      if (!br) { qo('rbeam', X, Q(0.8), X, Q(top - 0.1), T * (chg ? 0.9 : 0.6), VIOLET, chg ? 0.45 + 0.2 * pu : 0.12 + 0.06 * pu, 1, 1); for (let k = 0; k < 4; k++) { const z0 = 0.8 + k * (top - 0.9) / 4, z1 = z0 + (top - 0.9) / 4; sbolt(X + Math.sin(k * 1.9 + t * (chg ? 20 : 2)) * T * 0.18, Q(z0), X + Math.sin((k + 1) * 1.9 + t * (chg ? 20 : 2)) * T * 0.18, Q(z1), T * 0.25, chg ? '#FFFFFF' : VIOLET_HI, chg ? 0.9 : 0.4, p.i * 9 + k, 0.5); }
          qo('glow', X, Q(1.7), T * (chg ? 2.2 + pu * 0.6 : 1.3), VIOLET, chg ? 0.5 : 0.18); if (chg) { sbolt(X - T * 0.5, Q(H + 0.85), X + T * 0.5, Q(H + 0.85), T * 0.5, '#FFFFFF', 0.9, p.i * 5 + Math.floor(t * 12), 1); qo('glow', X, Q(H + 0.9), T * 0.8, VIOLET_HI, 0.5); ql('glow', X, Y, T * 2.2, VIOLET, 0.25, 0.45); } }
      else if (Math.sin(t * 9 + p.i * 3) > 0.7) sbolt(X, Q(top), X + T * 0.3, Q(top + 0.45), T * 0.25, VIOLET_HI, 0.8, p.i * 3 + Math.floor(t * 9), 0.8); }
    return true; }
  function wrap() { const FD = typeof FIEND_DEFS !== 'undefined' ? FIEND_DEFS : null; if (!FD) return; const D1 = FD.khaal, D2 = FD.ixvorra, D3 = FD.nyarzhul;
    if (D1 && typeof D1.drawObj === 'function' && !D1.drawObj.__yugA) { const od = D1.drawObj; const f = function (c, FX, o, Xs, Ys, T, t) { if (on() && o && o.kind === 'cell') { try { if (khCell(c, FX, o, Xs, Ys, T, t)) { STATS.khaal++; return; } } catch (e) {} STATS.fallback++; } return od.apply(this, arguments); }; f.__yugA = 1; D1.drawObj = f; }
    if (D2 && typeof D2.drawProp === 'function' && !D2.drawProp.__yugA) { const od = D2.drawProp; const f = function (c, FX, p, Xs, Ys, T, t) { if (on() && p && p.kind === 'pylon') { try { if (ixPylon(c, FX, p, Xs, Ys, T, t)) { STATS.ixvorra++; return; } } catch (e) {} STATS.fallback++; } return od.apply(this, arguments); }; f.__yugA = 1; D2.drawProp = f;
      const ol = D2.drawPropLive; const g = function (c, FX, p, Xs, Ys, T, t) { if (ol) ol.apply(this, arguments); if (on() && p && p.kind === 'pylon') { try { ixPylonLive(c, FX, p, Xs, Ys, T, t); } catch (e) {} } }; g.__yugA = 1; D2.drawPropLive = g; }
    if (D3 && typeof D3.drawProp === 'function' && !D3.drawProp.__yugA) { const od = D3.drawProp; const f = function (c, FX, p, Xs, Ys, T, t) { if (on() && p && p.kind === 'cap') { try { if (nyCap(c, FX, p, Xs, Ys, T, t)) { STATS.nyarzhul++; return; } } catch (e) {} STATS.fallback++; } return od.apply(this, arguments); }; f.__yugA = 1; D3.drawProp = f; } }
  wrap(); if (typeof setTimeout === 'function') setTimeout(wrap, 0);
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.yuggoth; if (Rf && !Rf.__yugA) { Rf.__yugA = 1; const op = Rf.preload; Rf.preload = function (P) { try { wrap(); } catch (e) {} return op ? op.apply(this, arguments) : []; }; } } catch (e) {}
  const API = { wrap, get stats() { return Object.assign({}, STATS); } };
  A.arena = API; if (HAS_W) window.YUG_ARENA = API;
})();
