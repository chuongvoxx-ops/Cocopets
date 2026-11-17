/* ---------- Shrines and power stones, repainted (v398 PR) ----------
   The dungeons' shrines (20b drawShrine: SHRINES fury, haste, fortune, arcane, guardian) and the power stones that drop on
   the floor (20b drawStone: POWERS multiply ... quick) were flat 2D icons. They are painted here once into cached pictures
   by 20n9's software shading pass (BELPROPS.kit, its neutral light: they stand in every land), and lit per frame by the
   GPU painter (NIDHOGG_MOVES.FGFX) where a real GPU draws, by 2D glow sprites elsewhere.
   - a shrine: a carved stone stele on moulded tiers, weathered and mossy, its effect's rune cut into the front and inlaid
     with light, a brass cup holding a glowing orb of the effect's colour; a soft halo that pulses, motes rising; used, the
     orb goes dark and the rune grey; an activation burst (a ring, a pillar of light) when it is touched
   - a power stone: a faceted gem in a gold bezel, the power's glyph engraved in it and glowing; a halo and sparkle, a bob
     and a slow turn; a pickup burst; its name kept as the game's own label
   Colours come from the effect (SHRINES / POWERS .color), never the land.
   API (global RELICS): shrine(c, s, X, Y, T, near, S) and stone(c, s, X, Y, T, near, P) draw one (false: the old 2D art
   draws it this frame, as while its picture waits for the painting budget); burst(x, y, col, kind) on use or pickup;
   over(c, sx, sy, T, t) once a frame after the standing things (the GPU light in one pass, and the bursts).
   window.__RELIC = 0 turns all of it off; window.__RELIC_GL = 0 (or __DUN_GL = 0) keeps the light in 2D. */
var RELICS = (() => {
  const TAU = Math.PI * 2;
  const off = () => typeof window !== 'undefined' && window.__RELIC === 0;
  const BP = () => (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.kit && window.__BELP !== 0) ? window.BELPROPS : null;
  const fgx = () => { try { if (typeof window !== 'undefined' && (window.__RELIC_GL === 0 || window.__DUN_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const RGBC = new Map(), RGB = h => { let v = RGBC.get(h); if (!v) { const q = hexRGB(h); v = [q[0] / 255, q[1] / 255, q[2] / 255]; RGBC.set(h, v); } return v; };
  const RUNE = { fury: 'fist', haste: 'dash', fortune: 'stars', arcane: 'nova', guardian: 'shield' };
  const STATS = { painted: 0, paintMs: 0, gpu: 0, d2: 0, fallbacks: 0, bursts: 0 };

  /* ======================= materials ======================= */
  // weathered pale stone: grain, pits, bright worn edges, moss gathered low, in hollows and on top faces
  function stoneM(K, u, v, ao, sd, moss, top) { const { M, vn, fbm, ss, lerp } = K, w = fbm(u * 3 + sd, v * 3 + sd * 0.7), p = vn(u * 23 + sd, v * 23), t = 0.44 + 0.16 * (w - 0.5);
    M.r = t * 1.03; M.g = t; M.b = t * 0.95; M.rg = 0.8; if (p > 0.76) { M.r *= 0.7; M.g *= 0.7; M.b *= 0.72; M.ao *= 0.8; }
    const mk = moss * ss(0.5, 0.78, vn(u * 4.3 + 7, v * 4.3 + sd) * 0.75 + (top ? 0.22 : 0) + (1 - ao) * 0.35); if (mk > 0) { const m2 = vn(u * 17, v * 17); M.r = lerp(M.r, 0.13 + m2 * 0.05, mk); M.g = lerp(M.g, 0.27 + m2 * 0.08, mk); M.b = lerp(M.b, 0.1, mk); M.rg = lerp(M.rg, 0.95, mk); } }
  function brassM(K, u, v, ao) { const { M, vn } = K, g = vn(u * 30, v * 30); M.mt = 1; M.fr = 0.98; M.fg = 0.74; M.fb = 0.36; M.r = 0.9; M.g = 0.68; M.b = 0.3; M.rg = 0.24 + g * 0.14; M.ao = ao * (0.85 + 0.15 * g); }
  // a gem: deep colour, a glassy coat, its own inner fire (k) brighter toward the middle
  function gemM(K, cr, cg, cb, k, d) { const M = K.M; M.r = cr * 0.28; M.g = cg * 0.28; M.b = cb * 0.28; M.rg = 0.05; M.cc = 1; M.sh = 0.55; const e = k * (1 - 0.45 * d); M.er = cr * e; M.eg = cg * e; M.eb = cb * e; }

  /* a glyph (02d GLYPHS, 24 x 24) cut into the surface: a lit lower lip, the cut's shadow, an inlay of light (lit) or of dull lead */
  const GP = {}; const gpaths = id => GP[id] || (GP[id] = (GLYPHS[id] || GLYPHS.orb).map(([m, d]) => [m, new Path2D(d)]));
  function rune(c, id, x, y, size, col, lit, blurPx) { const k = size / 24; c.save(); c.translate(x - size / 2, y - size / 2); c.scale(k, k); c.lineCap = 'round'; c.lineJoin = 'round'; const P2 = gpaths(id);
    const pass = (dx, dy, st, w, blur) => { c.save(); c.translate(dx, dy); if (blur) { c.shadowColor = col; c.shadowBlur = blur; } for (const [m, p] of P2) { if (m === 'f') { c.fillStyle = st; c.fill(p); c.strokeStyle = st; c.lineWidth = w * 0.6; c.stroke(p); } else { c.strokeStyle = st; c.lineWidth = m === 's' ? w * 1.5 : w; c.stroke(p); } } c.restore(); };
    pass(0.9, 1.1, 'rgba(255,255,255,.2)', 2.4); pass(-0.7, -0.8, 'rgba(8,8,14,.78)', 2.6);
    if (!lit) pass(0, 0, 'rgba(78,78,86,.92)', 1.9);
    else { pass(0, 0, col, 2.2, blurPx);   // (the glow round the cut)
      const [r, g, b] = RGB(col), mix = (k, w) => `rgb(${Math.round((r * (1 - w) + w) * 255 * k)},${Math.round((g * (1 - w) + w) * 255 * k)},${Math.round((b * (1 - w) + w) * 255 * k)})`, hi = mix(1, 0.6), deep = mix(0.35, 0);
      for (const [m, p] of P2) { if (m === 'f') { c.fillStyle = hi; c.fill(p); c.strokeStyle = col; c.lineWidth = 1.1; c.stroke(p); } else if (m === 's') { c.strokeStyle = col; c.lineWidth = 3.2; c.stroke(p); c.strokeStyle = hi; c.lineWidth = 1.7; c.stroke(p); } else { c.strokeStyle = deep; c.lineWidth = 1.7; c.stroke(p); } }   // (the inlay: pale light, its details cut dark so the glyph reads)
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; for (const [m, p] of P2) if (m === 'f') { c.fillStyle = '#FFFFFF'; c.fill(p); } }
    c.restore(); }

  /* ======================= the shrine ======================= (feet at 0, 0; tiles) */
  const ORB_Y = 1.93, ORB_R = 0.19;
  function paintShrine(S, v) { const K = BP().kit, { rbox, rev, ball, contact, ink, grain, glint, M, K: KK } = K, used = v.endsWith('~'), kind = used ? v.slice(0, -1) : v, Sd = SHRINES[kind] || SHRINES.fury, col = Sd.color, [cr, cg, cb] = RGB(col), sd = kind.charCodeAt(0) * 0.31 + kind.length, c = S.c;
    contact(S, 0, 0.05, 0.95, 0.36, 0.55);
    const st = (moss, o) => (f, u, v2, ao, e) => { stoneM(K, u + o, v2 + o * 0.5, ao, sd + o, moss, f === 't'); if (e > 0.55) { M.r *= 1.14; M.g *= 1.14; M.b *= 1.12; } };
    rbox(S, 0, 0, 0.68, 0.45, 0, 0.13, 0.035, st(1.0, 0));           // the footing slab
    rbox(S, 0, -0.03, 0.56, 0.37, 0.13, 0.25, 0.04, st(0.7, 1.3));   // a tier
    rbox(S, 0, -0.05, 0.42, 0.29, 0.25, 0.34, 0.05, st(0.5, 2.1));   // the moulded plinth
    rbox(S, 0, -0.06, 0.3, 0.22, 0.34, 1.42, 0.05, st(0.35, 3.7), { floorAO: 0 });   // the stele
    rbox(S, 0, -0.06, 0.4, 0.3, 1.42, 1.53, 0.04, st(0.45, 5.2), { floorAO: 0 });    // the cornice
    rbox(S, 0, -0.06, 0.32, 0.24, 1.53, 1.62, 0.04, st(0.3, 6.1), { floorAO: 0 });
    rev(S, 0, -0.06, h => 0.11 + Math.pow(Math.max(0, h - 1.62) / 0.16, 1.4) * 0.13, 1.62, 1.78, { mat: (u, h, ao) => brassM(K, u, h, ao), top: true, capMat: () => { M.r = M.g = M.b = 0.03; M.rg = 0.9; }, floorAO: 0 });   // the brass cup
    ball(S, 0, -ORB_Y, ORB_R, ORB_R, (dx, dy) => { const d = Math.hypot(dx, dy); if (used) { M.r = 0.15; M.g = 0.145; M.b = 0.16; M.rg = 0.45; M.cc = 0.4; return; } M.r = cr * 0.32; M.g = cg * 0.32; M.b = cb * 0.32; M.rg = 0.05; M.cc = 1; const e = 0.62 * (1 - d * 0.65); M.er = cr * e; M.eg = cg * e; M.eb = cb * e; });
    S.unlock();
    // the carving: a recessed arched panel on the stele's face, the rune cut in it; cracks, chips, moss at the foot
    const fy0 = -(1.42 - KK * 0.22) + 0.1, fy1 = -(0.34 - KK * 0.22) - 0.08, px = 0.21; c.save();
    c.beginPath(); c.moveTo(-px, fy1); c.lineTo(-px, fy0 + px); c.arc(0, fy0 + px, px, Math.PI, 0); c.lineTo(px, fy1); c.closePath(); c.fillStyle = 'rgba(14,12,18,.32)'; c.fill();
    c.save(); c.clip(); const ig = c.createLinearGradient(-px, fy0, px * 0.4, fy0 + 0.5); ig.addColorStop(0, 'rgba(0,0,0,.45)'); ig.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = ig; c.fillRect(-px, fy0, px * 2, fy1 - fy0); c.restore();
    c.strokeStyle = 'rgba(255,250,240,.22)'; c.lineWidth = 0.018; c.beginPath(); c.moveTo(px, fy0 + px); c.lineTo(px, fy1); c.lineTo(-px, fy1); c.stroke();
    if (!used) { const rg = c.createRadialGradient(0, (fy0 + fy1) / 2, 0, 0, (fy0 + fy1) / 2, 0.32); rg.addColorStop(0, `rgba(${Math.round(cr * 255)},${Math.round(cg * 255)},${Math.round(cb * 255)},.32)`); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = rg; c.fillRect(-px, fy0, px * 2, fy1 - fy0); c.globalCompositeOperation = 'source-over'; }
    rune(c, RUNE[kind] || 'orb', 0, (fy0 + fy1) / 2 + 0.04, 0.4, col, !used, Math.max(2, S.P * 0.06));
    const R = (i) => K.vn(i * 3.7 + sd, i * 1.3); c.strokeStyle = 'rgba(16,14,20,.55)'; c.lineWidth = 0.014;
    for (let i = 0; i < 3; i++) { const x0 = (R(i) - 0.5) * 0.5, y0 = -0.4 - R(i + 9) * 0.9; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (R(i + 3) - 0.5) * 0.12, y0 + 0.1); c.lineTo(x0 + (R(i + 5) - 0.5) * 0.16, y0 + 0.2); c.stroke(); }
    c.fillStyle = 'rgba(20,18,24,.6)'; for (const [x, y] of [[-0.66, -0.13], [0.55, -0.24], [0.4, -1.5]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 0.08, y); c.lineTo(x + 0.04, y + 0.06); c.closePath(); c.fill(); }
    for (let i = 0; i < 7; i++) { const x = (R(i + 20) - 0.5) * 1.25, y = 0.02 + R(i + 30) * 0.12, r = 0.04 + R(i + 40) * 0.05, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(78,118,52,.85)'); g.addColorStop(1, 'rgba(48,82,34,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    // the orb: its inner light, a swirl, a glint; dark and cracked when used
    if (!used) { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(-0.04, -ORB_Y - 0.03, 0, 0, -ORB_Y, ORB_R); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(0.45, `rgba(${Math.round(cr * 255)},${Math.round(cg * 255)},${Math.round(cb * 255)},.45)`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(-ORB_R, -ORB_Y - ORB_R, ORB_R * 2, ORB_R * 2);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.015; c.beginPath(); c.arc(0.01, -ORB_Y + 0.01, ORB_R * 0.55, 3.6, 5.6); c.stroke(); c.globalCompositeOperation = 'source-over'; glint(c, -0.07, -ORB_Y - 0.08, 0.09, 0.85); }
    else { c.strokeStyle = 'rgba(6,6,10,.7)'; c.lineWidth = 0.015; c.beginPath(); c.moveTo(-0.1, -ORB_Y - 0.12); c.lineTo(-0.02, -ORB_Y); c.lineTo(0.08, -ORB_Y + 0.05); c.moveTo(-0.02, -ORB_Y); c.lineTo(-0.05, -ORB_Y + 0.13); c.stroke(); }
    c.restore(); grain(c, 0.12); ink(S, [22, 20, 26], 0.55); }

  /* ======================= the power stone ======================= (its centre at 0, 0) */
  const GR = 0.36, GAY = 1.12;
  function paintGem(S, v) { const K = BP().kit, { shade, put, M, M0, clamp, vn, ball, ink, glint } = K, Pw = POWERS[v] || POWERS.multiply, [cr, cg, cb] = RGB(Pw.color), P = S.P;
    S.lock();
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, u = x / GR, w = y / (GR * GAY);
      const a0 = Math.abs(u), a1 = Math.abs(0.5 * u + 0.866 * w), a2 = Math.abs(-0.5 * u + 0.866 * w), hd = Math.max(a0, a1, a2) / 0.866; if (hd > 1 + 2 / (GR * P)) continue;
      const aa = clamp((1 - hd) * GR * P * 0.866 + 0.5, 0, 1); let ex, ey;
      if (a0 >= a1 && a0 >= a2) { ex = u < 0 ? -1 : 1; ey = 0; } else if (a1 >= a2) { const s = 0.5 * u + 0.866 * w < 0 ? -1 : 1; ex = 0.5 * s; ey = 0.866 * s; } else { const s = -0.5 * u + 0.866 * w < 0 ? -1 : 1; ex = -0.5 * s; ey = 0.866 * s; }
      M0(); let nx, ny, nz;
      if (hd > 0.83) { const t = (hd - 0.83) / 0.17, an = (t * 2 - 1) * 1.15; nx = ex * Math.sin(an); ny = Math.cos(an); nz = -ey * Math.sin(an); brassM(K, x * 3, y * 3, 0.8 + 0.2 * Math.cos(an)); }   // the gold bezel, rounded
      else if (hd > 0.4) { const ang = Math.atan2(w, u), sec = Math.floor((ang + Math.PI) / (TAU / 12)) % 12, ca = (sec + 0.5) * TAU / 12 - Math.PI, tl = 0.5 + 0.12 * (sec % 3) / 2; nx = Math.cos(ca) * tl; nz = -Math.sin(ca) * tl; ny = 1; gemM(K, cr, cg, cb, 0.3 + 0.36 * (((sec * 5) % 4) / 3), hd); }   // twelve crown facets
      else { nx = 0.04; ny = 1; nz = 0.06; gemM(K, cr, cg, cb, 0.75, hd); }   // the table
      const l = Math.hypot(nx, ny, nz); shade(nx / l, ny / l, nz / l); put(S, px, py, aa); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; ball(S, Math.cos(a) * GR * 0.98, Math.sin(a) * GR * GAY * 0.98, 0.045, 0.045, (dx, dy, ao) => brassM(K, dx, dy, ao)); }   // its prongs
    S.unlock(); const c = S.c;
    rune(c, Pw.glyph, 0, 0.01, 0.5, Pw.color, true, Math.max(2, S.P * 0.07));
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 0.012; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; c.moveTo(Math.cos(a) * GR * 0.4 * 1.15, Math.sin(a) * GR * GAY * 0.4 * 1.15); c.lineTo(Math.cos(a) * GR * 0.83, Math.sin(a) * GR * GAY * 0.83); } c.stroke(); c.restore();
    glint(c, -GR * 0.42, -GR * 0.55, 0.12, 0.9); glint(c, GR * 0.5, GR * 0.3, 0.06, 0.5); ink(S, [24, 20, 30], 0.6); }

  /* ======================= the pictures ======================= */
  const DEFS = {
    relshrine: { light: 'neutral', box: () => [-0.85, -2.3, 0.85, 0.42], paint: paintShrine },
    relgem: { light: 'neutral', box: () => [-0.5, -0.55, 0.5, 0.55], paint: paintGem },
  };
  let reg = false; const reg1 = () => { if (reg) return true; const B = BP(); if (!B) return false; Object.assign(B.DEF, DEFS); reg = true; return true; };
  const CACHE = new Map(); let budT = 0, budMs = 0;
  const qP = P => Math.max(8, Math.round(Math.exp(Math.round(Math.log(P) * 10) / 10)));
  function get(name, v, T, c) { if (!reg1()) return null; const m = c.getTransform ? c.getTransform() : null, dpr = Math.min(2, m ? Math.max(0.5, Math.hypot(m.a, m.b)) : 1), P = qP(T * dpr), key = name + '|' + v + '|' + P; let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; }
    if (budMs < 12) { const t0 = now(); try { s = BP().sprite(name, v, P); } catch (e) { s = null; } const ms = now() - t0; budMs += ms; if (s) { STATS.painted++; STATS.paintMs += ms; if (CACHE.size > 120) CACHE.clear(); CACHE.set(key, s); return s; } }
    const pre = name + '|' + v + '|'; for (const [k, s2] of CACHE) if (k.startsWith(pre)) return s2;   // (another size meanwhile)
    STATS.fallbacks++; return null; }
  const blit = (c, s, X, Y, T) => { const f = T / s.P; c.drawImage(s.cv, X - s.ax * f, Y - s.ay * f, s.cv.width * f, s.cv.height * f); };

  /* ======================= the light ======================= (queued, laid in one GPU pass by over(); in 2D at once without one) */
  const OPS = []; let gpuF = null, gpuAt = -1;
  const gpu = () => { const t = now(); if (t - gpuAt > 500) { gpuF = fgx(); gpuAt = t; } return gpuF; };
  function glow2(c, x, y, r, col, a, sy) { if (a <= 0.01 || r < 1) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); if (sy && sy !== 1) { c.translate(x, y); c.scale(1, sy); c.translate(-x, -y); } blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function op(c, a) { if (OPS.length > 400) return; if (gpu() && !(typeof lowFx === 'function' && lowFx() && a[0] === 'star')) { OPS.push(a); return; }
    STATS.d2++; const [k, x, y] = a; if (k === 'glow') glow2(c, x, y, a[3], a[4], a[5] * 0.85, a[6]);
    else if (k === 'star') { if (typeof lowFx === 'function' && lowFx()) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a[4]); c.strokeStyle = a[5] || '#FFFFFF'; c.lineWidth = Math.max(1, a[3] * 0.12); c.beginPath(); c.moveTo(x - a[3], y); c.lineTo(x + a[3], y); c.moveTo(x, y - a[3]); c.lineTo(x, y + a[3]); c.stroke(); c.restore(); }
    else if (k === 'ring') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a[5]); c.strokeStyle = a[4]; c.lineWidth = Math.max(1, a[6]); c.beginPath(); c.ellipse(x, y, a[3], a[3] * (a[7] || 1), 0, 0, TAU); c.stroke(); c.restore(); }
    else if (k === 'beam') { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, a[2], 0, a[4]); g.addColorStop(0, a[6]); g.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = Math.min(1, a[7]); c.fillStyle = g; c.fillRect(x - a[5] / 2, a[4], a[5], a[2] - a[4]); c.restore(); } }
  const glow = (c, x, y, r, col, a, sy) => op(c, ['glow', x, y, r, col, a, sy]);
  const star = (c, x, y, s, a, col) => op(c, ['star', x, y, s, a, col]);

  /* ======================= drawing ======================= */
  function shrine(c, s, X, Y, T, near, Sd) { if (off()) return false; Sd = Sd || SHRINES[s.kind]; if (!Sd) return false; const sp = get('relshrine', s.kind + (s.used ? '~' : ''), T, c); if (!sp) return false;
    const col = Sd.color, t = s.t || 0;
    if (!s.used) glow(c, X, Y - T * 0.05, T * 1.15, col, 0.2, 0.42);   // (its light pooled on the floor)
    blit(c, sp, X, Y, T);
    if (!s.used) { const pul = 0.5 + 0.5 * Math.sin(t * 2.6), oy = Y - T * ORB_Y;
      glow(c, X, oy, T * (0.95 + 0.15 * pul), col, 0.42 + 0.22 * pul); glow(c, X, oy, T * 0.3, '#FFFFFF', 0.3 + 0.15 * pul); glow(c, X, Y - T * 0.78, T * 0.5, col, 0.16 + 0.12 * pul, 1.3);
      for (let i = 0; i < 3; i++) { const u = ((t * 0.35 + i / 3) % 1), x = X + Math.sin(t * 1.3 + i * 2.1) * T * 0.32, y = oy - T * (0.1 + u * 0.9); star(c, x, y, T * 0.07 * (1 - u * 0.5), 0.7 * Math.sin(u * Math.PI), col); }
      if (near < 4) GFX.textS(c, Sd.name, X, Y - T * 2.45, Math.max(10, Math.round(T * 0.3)), col); }
    return true; }
  function stone(c, s, X, Y, T, near, Pw) { if (off()) return false; Pw = Pw || POWERS[s.kind]; if (!Pw) return false; const sp = get('relgem', s.kind, T, c); if (!sp) return false;
    const t = s.t || 0, bob = Math.sin(t * 2.6) * T * 0.08, cy = Y - T * 0.45 + bob, pop = s.fresh > 0 ? 1 + 0.35 * Math.sin(Math.min(1, 1 - s.fresh / 0.6) * Math.PI) : 1, col = Pw.color;
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(X, Y + T * 0.1, T * 0.27 * (1 - bob / T), T * 0.1, 0, 0, TAU); c.fill();
    glow(c, X, cy, T * 0.85 * pop, col, 0.36 + 0.16 * Math.sin(t * 4));
    const turn = Math.cos(t * 1.7), sxk = (0.9 + 0.1 * turn) * pop; c.save(); c.translate(X, cy); c.rotate(Math.sin(t * 1.3) * 0.07); c.scale(sxk, pop); blit(c, sp, 0, 0, T); c.restore();
    glow(c, X, cy, T * 0.22, '#FFFFFF', 0.2 + 0.1 * Math.sin(t * 3));
    const tw = Math.pow(Math.max(0, Math.sin(t * 2.3)), 6); if (tw > 0.02) star(c, X - T * 0.14 * turn, cy - T * 0.16, T * 0.16, tw * 0.9, '#FFFFFF');
    const u = (t * 0.6) % 1; star(c, X + Math.sin(t * 2 + 1) * T * 0.3, cy + T * 0.1 - u * T * 0.7, T * 0.06, 0.6 * Math.sin(u * Math.PI), col);
    if (near < 3.5) GFX.textS(c, Pw.name, X, Y - T * 1.05 + bob, Math.max(10, Math.round(T * 0.28)), col);
    return true; }

  /* the bursts: a shrine touched (a ring along the floor, a pillar of light, a flash at the orb), a stone picked up (a ring, a star) */
  const BURSTS = [];
  function burst(x, y, col, kind) { if (off()) return; STATS.bursts++; BURSTS.push({ x, y, col, kind: kind ? 'shrine' : 'gem', t0: null }); if (BURSTS.length > 12) BURSTS.shift(); }
  function over(c, sx, sy, T, t) {
    for (let i = BURSTS.length - 1; i >= 0; i--) { const b = BURSTS[i]; if (b.t0 == null) b.t0 = t; const life = b.kind === 'shrine' ? 1.1 : 0.65, u = (t - b.t0) / life; if (u >= 1 || u < 0) { BURSTS.splice(i, 1); continue; }
      const X = sx(b.x), Y = sy(b.y + (b.kind === 'shrine' ? 0.3 : 0)), e = 1 - u, ez = 1 - Math.pow(1 - u, 3);
      if (b.kind === 'shrine') { op(c, ['ring', X, Y, T * (0.4 + 2.6 * ez), b.col, 0.7 * e, T * 0.16 * e + 1, 0.42]); op(c, ['ring', X, Y, T * (0.3 + 1.6 * ez), '#FFFFFF', 0.45 * e, T * 0.06 + 1, 0.42]);
        op(c, ['beam', X, Y, X, Y - T * (2.4 + 2.2 * ez), T * (0.5 + 0.3 * e), b.col, 0.55 * e]); glow(c, X, Y - T * ORB_Y, T * (1.2 + 1.6 * ez), b.col, 0.7 * e); glow(c, X, Y - T * ORB_Y, T * 0.6, '#FFFFFF', 0.6 * e * e); }
      else { const cy = Y - T * 0.45; op(c, ['ring', X, cy, T * (0.3 + 1.5 * ez), b.col, 0.75 * e, T * 0.12 * e + 1, 1]); glow(c, X, cy, T * (0.6 + 0.9 * ez), b.col, 0.65 * e); star(c, X, cy, T * (0.3 + 0.5 * ez), 0.9 * e, '#FFFFFF');
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3, r = T * (0.2 + 1.1 * ez); star(c, X + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, T * 0.08 * e + 1, 0.8 * e, b.col); } } }
    if (!OPS.length) return; const F = gpu(); if (!F) { OPS.length = 0; return; }
    try { const Q = F.begin(c, null); for (const a of OPS) { const [k, x, y] = a;
        if (k === 'glow') Q.glow(x, y, a[3], a[4], a[5], a[6]); else if (k === 'star') Q.star(x, y, a[3], a[4], a[5]); else if (k === 'ring') Q.ring(x, y, a[3], a[4], a[5], a[6], a[7]); else if (k === 'beam') Q.beam(x, y, a[3], a[4], a[5], a[6], a[7]); }
      F.flush(c); STATS.gpu += OPS.length; } catch (e) { gpuF = null; gpuAt = now() + 5000; }
    OPS.length = 0; }

  const API = { shrine, stone, burst, over, get stats() { return Object.assign({ sprites: CACHE.size, gpuOn: !!gpu() }, STATS); }, RUNE };
  if (typeof window !== 'undefined') window.RELICS = API;
  return API;
})();
