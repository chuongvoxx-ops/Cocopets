/* ---------- v470 AE: the Pale Aurora's boss arenas' standing pieces, painted (20s6d's AUR_PROPS) ----------
   The fights' props are repainted to the lands' standard without touching the boss files: their drawProp / drawObj are wrapped
   here at run time (FIEND_DEFS.thul / nivora / ahuul), and every live state they carry is drawn over the painted bodies exactly
   where the old art drew it:
     Thul (the Sheltered Ice Cave): the two windbreak pillars (thulpillar: a stone core sheathed in glacier ice, strata, wedges
       of ice at its foot, a cap of snow) with their marks (the warm pulse) and spreading cracks (the same cracks, same seed);
       broken, the rubble wall (thulblock v 0..3) drops into place block by block as before.
     Nivora (the Telescope Platform): the telescope's stone drum (nivdrum) and its brass tube (nivtube), still tracking Nivora
       (the tube is the painted barrel laid along the live sight line, its fork and lens as before); the two wind vanes: the
       painted post (nivpost) and crank wheel (nivwheel, turned with the vane), the fin and arrow in 3D as before (shaded metal),
       raised (green light) and frozen fast (the ice skin and icicles) as before.
     Ahuul (the Broad Summit): the three ice shelters (their hoods' blocks laid with the land's own ice and snow textures, lit
       per block, icicles on the lip), the broken telescope (ahscope) and the ice anchor (ahanchor, its green core, its cracks
       as it is hit, its label).
   Without the painter (or window.__AURP = 0) each wrapper hands back to the old art. */
(() => {
  const A = typeof AUR_PROPS !== 'undefined' ? AUR_PROPS : null; if (!A) return;
  const TAU = Math.PI * 2, X = A.kitx, DEF = A.DEF, HAS_W = typeof window !== 'undefined';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, easeOut = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const on = () => !(HAS_W && (window.__AURP === 0 || window.__BELP === 0)) && HAS_W && window.BELPROPS && window.BELPROPS.kit;
  const ice = (K, sd, L, o) => (f, q, wt, tip) => X.iceM(K, f, q, wt, tip, sd, Object.assign({ tint: X.TINT[L] }, o || {}));
  const mb32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const glowSp = (c, col, x, y, r, a) => { if (typeof blitSized !== 'function' || typeof glowSprite !== 'function') return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(a, 0, 1); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };

  /* ======================= the pictures ======================= */
  Object.assign(DEF, {
    /* Thul's windbreak pillar: a core of dark strata stone, sheathed in tall facets of glacier ice, wedges of ice leaning at its
       foot, a broad cap of snow overhanging, icicles under it (its feet where the old art stood it; 4.4 tiles tall) */
    thulpillar: { box: () => [-1.7, -5.75, 1.7, 0.75], vs: [0, 1], paint(K, S, v, L) { const sd = 701 + v * 9, c = S.c; X.contact(K, S, 1.5, 0.5, 0.65, 0.25, 0.08);
      X.box(K, S, 0, 0.0, 0.92, 0.42, 0, 4.25, 0.12, (f, u, vv) => { X.stoneM(K, u * 1.6, vv * 1.6, sd, { tone: 0.55 + 0.25 * (Math.floor(vv * 1.8) % 2), frost: 0.55, up: f === 't' }); if (f === 'f' && Math.abs(((vv * 1.8) % 1) - 0.5) > 0.46) K.M.ao *= 0.55; }); S.unlock();
      const R = K.R1(sd); for (const [x, r, h, ang] of [[-0.62, 0.32, 3.7, -0.03], [-0.18, 0.36, 4.1, 0.01], [0.3, 0.34, 3.9, 0.02], [0.72, 0.28, 3.4, 0.04]]) X.prism(K, S, x, 0.1, r, r * 0.92, h * 0.9, h * 0.1, ang, ice(K, sd + x * 7, L, { root: 0.08, frost: 0.9, glow: 0.85 }), { alpha: 0.82 });
      S.unlock();
      for (const [u, s, lean] of [[-0.95, 0.75, -0.32], [0.82, 0.6, 0.3], [0.12, 0.45, 0.08]]) X.prism(K, S, u, 0.32, 0.2 + s * 0.12, 0.16, 0.65 + s * 0.5, 0.35, lean, ice(K, sd + u * 13, L, { root: 0.15 }));
      S.unlock(); X.snowCap(K, S, 0.02, -4.55, 1.2, 0.42, sd + 3, { blue: 0.15 }); X.icicles(K, S, -0.9, 0.95, -4.18, 8, 0.45, sd, L);
      X.lump(K, S, 0.1, 0.18, 1.45, 0.3, { amp: 0.2, fr: 2.4, sd: sd + 5, bump: 0.3, flat: 1, mat: (dx, dy, ao, e, nz, wx, wy) => X.snowM(K, wx * 2, wy * 2, sd + 5, { blue: 0.2 }) }); S.unlock();
      X.dust(c, R, 0, -4.4, 1.0, 0.2, 40); K.glint(c, -0.35, -3.6, 0.18, 0.8); K.ink(S, X.INK[L], 0.45); } },
    // a block of the fallen windbreak: stone under ice, its snow cap (v 0..3: the four blocks' heights)
    thulblock: { box: v => [-0.85, -[1.05, 1.3, 1.15, 0.9][v % 4] - 0.55, 0.85, 0.32], vs: [0, 1, 2, 3], paint(K, S, v, L) { const sd = 721 + v * 5, H = [1.05, 1.3, 1.15, 0.9][v % 4]; X.contact(K, S, 0.7, 0.24, 0.55, 0.1, 0.05);
      X.box(K, S, 0, 0.02, 0.5, 0.36, 0, H * 0.92, 0.1, (f, u, vv) => X.stoneM(K, u * 2, vv * 2, sd, { tone: 0.6, frost: 0.5, up: f === 't' })); S.unlock();
      X.prism(K, S, -0.2, 0.06, 0.32, 0.28, H * 0.75, H * 0.2, -0.06, ice(K, sd + 1, L, { root: 0.1 }), { alpha: 0.8 }); X.prism(K, S, 0.28, 0.08, 0.26, 0.22, H * 0.6, H * 0.18, 0.08, ice(K, sd + 2, L, { root: 0.1 }), { alpha: 0.8 }); S.unlock();
      X.snowCap(K, S, 0, -H - 0.12, 0.55, 0.2, sd + 3); X.icicles(K, S, -0.4, 0.4, -H + 0.08, 4, 0.22, sd, L); K.ink(S, X.INK[L], 0.45); } },
    /* Nivora's telescope drum: dressed stone, two carved grooves, a brass band, snow lying on its top */
    nivdrum: { box: () => [-1.3, -1.6, 1.3, 0.7], vs: [0], paint(K, S, v, L) { const sd = 741; X.contact(K, S, 1.3, 0.5, 0.6, 0.15, 0.1);
      K.rev(S, 0, 0, h => h < 0.08 ? 1.0 : 0.95, 0, 1.0, { mat: (u, h, ao) => { X.stoneM(K, u * 2, h * 2, sd, { tone: 0.95, frost: 0.45 }); if (Math.abs(h - 0.33) < 0.025 || Math.abs(h - 0.66) < 0.025) K.M.ao *= 0.5; if (Math.abs(h - 0.5) < 0.05) X.brassM(K, u * 6, h * 6, ao, sd, 0.4); if (Math.abs(((u * 2.4) % 1 + 1) % 1 - 0.5) > 0.48) K.M.ao *= 0.6; }, top: true, capMat: (x, h, ao, i, ph, x2, ey) => { X.snowM(K, x * 2, ey * 2, sd + 1, { blue: 0.1 }); K.M.ao = 0.85 + 0.15 * K.vn(x * 5, ey * 5); } }); S.unlock();
      X.icicles(K, S, -0.8, 0.8, -1.0, 7, 0.22, sd, L); K.ink(S, X.INK[L], 0.45); } },
    // its brass barrel, lying along +x from its back end (0) to its dew cap (3.5): rings, wear, rime on its top side
    nivtube: { box: () => [-0.15, -0.5, 3.75, 0.5], vs: [0], paint(K, S, v, L) { const sd = 751;
      K.tube(S, [[0, 0], [1.2, 0], [2.4, 0], [3.5, 0]], 0.23, 0.33, (t, s2, ao) => { const u = t * 3.5; X.brassM(K, u * 2, s2, ao, sd, 0.25 * (1 - Math.abs(s2))); for (const rr of [0.35, 1.6, 2.8]) if (Math.abs(u - rr) < 0.06) { X.brassM(K, u * 8, s2, ao, sd + 1, 0.8); K.M.ao *= 0.9; } if (s2 < -0.55) { const f = clamp((-0.55 - s2) / 0.3, 0, 1) * 0.8; K.M.mt *= 1 - f; K.M.r = lerp(K.M.r, 0.84, f); K.M.g = lerp(K.M.g, 0.9, f); K.M.b = lerp(K.M.b, 0.96, f); K.M.rg = lerp(K.M.rg, 0.8, f); } }); S.unlock();
      K.tube(S, [[3.3, 0], [3.68, 0]], 0.38, 0.39, (t, s2, ao) => { X.brassM(K, t * 3, s2, ao, sd + 2, 0.4); K.M.ao *= 0.85; }); S.unlock(); K.glint(S.c, 2.2, -0.14, 0.14, 0.7); K.ink(S, X.INK[L], 0.4); } },
    /* a wind vane's post: a stepped plinth of rimed granite, the black iron post 3.6 up, a brass hub */
    nivpost: { box: () => [-0.75, -3.95, 0.75, 0.45], vs: [0], paint(K, S, v, L) { const sd = 761; X.contact(K, S, 0.7, 0.26, 0.6);
      X.box(K, S, 0, 0.05, 0.5, 0.36, 0, 0.22, 0.05, (f, u, vv) => X.rockM(K, u * 2, vv * 2, sd, 0.6, f === 't')); S.unlock(); X.snowCap(K, S, 0, -0.3, 0.45, 0.07, sd + 1);
      K.rev(S, 0, -0.22, h => (h < 0.12 ? 0.14 : 0.1) - h * 0.006, 0, 3.38, { mat: (u, h, ao) => { K.iron(u * 3, h, ao, sd); const fr = (K.vn(u * 7 + sd, h * 3) > 0.6 && u < 0) ? 0.6 : 0; if (fr) { K.M.mt *= 1 - fr; K.M.r = lerp(K.M.r, 0.8, fr); K.M.g = lerp(K.M.g, 0.86, fr); K.M.b = lerp(K.M.b, 0.92, fr); K.M.rg = 0.85; } }, top: true, capMat: () => X.brassM(K, 0, 0, 1, sd, 0.6) }); S.unlock();
      K.ball(S, 0, -3.6, 0.17, 0.17, (dx, dy) => X.brassM(K, dx, dy, 1, sd + 3, 0.55)); S.unlock(); X.icicles(K, S, -0.35, 0.35, -0.22, 4, 0.14, sd, L); K.ink(S, X.INK[L], 0.45); } },
    // its crank wheel (turned with the vane): a brass rim and four spokes
    nivwheel: { box: () => [-0.52, -0.52, 0.52, 0.52], vs: [0], paint(K, S, v, L) { const sd = 771, ring = []; for (let i = 0; i <= 36; i++) { const a = i / 36 * TAU; ring.push([Math.cos(a) * 0.42, Math.sin(a) * 0.42]); }
      K.tube(S, ring, 0.05, 0.05, (t, s2, ao) => X.brassM(K, t * 9, s2, ao, sd, 0.5)); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; K.tube(S, [[0, 0], [Math.cos(a) * 0.4, Math.sin(a) * 0.4]], 0.03, 0.025, (t, s2, ao) => K.iron(t * 4, s2, ao, sd + k)); } S.unlock();
      K.ball(S, 0, 0, 0.08, 0.08, (dx, dy) => X.brassM(K, dx, dy, 1, sd + 5, 0.6)); S.unlock(); K.ink(S, X.INK[L], 0.4); } },
    /* Ahuul's broken telescope: a stone pedestal with a snowy top, its back barrel aimed up, its front snapped and hanging from a
       strap, its cracked lens (painted in the fight's projection: (x, y, z) about its foot -> (x, y - z) tiles) */
    ahscope: { box: () => [-1.3, -3.6, 2.4, 0.9], vs: [0], paint(K, S, v, L) { const sd = 781, c = S.c, P = (p) => [p[0], p[1] - p[2]];
      X.contact(K, S, 1.1, 0.4, 0.55, 0.1, 0.25);
      X.box(K, S, 0, 0.5, 0.6, 0.5, 0, 0.75, 0.05, (f, u, vv) => X.stoneM(K, u * 2, vv * 2, sd, { tone: 0.85, frost: 0.5, up: f === 't' })); S.unlock();
      X.box(K, S, 0, 0.3, 0.35, 0.3, 0.75, 1.15, 0.05, (f, u, vv) => { if (f === 't') X.snowM(K, u * 3, vv * 3, sd + 1); else X.stoneM(K, u * 2, vv * 2, sd + 2, { tone: 0.95, frost: 0.4 }); }); S.unlock();
      const d0 = [-7.6, -7.6, 6], dl = Math.hypot(...d0), d = d0.map(q => q / dl), base = [0, 0, 1.25], add = (a, b) => a.map((q, i) => q + b[i]), mul = (a, k) => a.map(q => q * k), mid = add(base, mul(d, 1.7));
      K.tube(S, [P(add(base, mul(d, -0.7))), P(mid)], 0.17, 0.2, (t, s2, ao) => X.brassM(K, t * 3, s2, ao, sd + 3, 0.3)); S.unlock();
      const f0 = add(mid, [0.15, 0.2, -0.15]), f1 = add(f0, [0.9, 0.7, -0.75]); K.tube(S, [P(mid), P(f0)], 0.025, 0.025, (t, s2, ao) => K.iron(t * 4, s2, ao, sd)); K.tube(S, [P(f0), P(f1)], 0.21, 0.24, (t, s2, ao) => X.brassM(K, t * 3, s2, ao, sd + 4, 0.35)); S.unlock();
      const tp = P(add(mid, mul(d, 0.15))); X.disc(K, S, tp[0], tp[1], 0.36, 0.24, (dx, dy, e, ao) => X.brassM(K, dx, dy, ao, sd + 5, 0.4), { bv: 0.3 }); const ln = P(f1); X.disc(K, S, ln[0], ln[1], 0.24, 0.18, (dx, dy, e) => { const M = K.M; M.r = 0.03; M.g = 0.07; M.b = 0.12; M.rg = 0.04; M.cc = 1; M.er = 0.2 + 0.3 * (1 - e); M.eg = 0.45 + 0.35 * (1 - e); M.eb = 0.6 + 0.3 * (1 - e); }, { bv: 0.25, dome: 0.3 }); S.unlock();
      c.save(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 0.025; c.beginPath(); c.moveTo(ln[0] - 0.12, ln[1] - 0.08); c.lineTo(ln[0] + 0.05, ln[1] + 0.1); c.stroke(); c.restore();
      X.icicles(K, S, -0.5, 0.5, -0.75, 5, 0.2, sd, L); K.ink(S, X.INK[L], 0.45); } },
    /* the ice anchor: a spike of blue glacier ice driven into the summit, frost at its root (its green core is light) */
    ahanchor: { box: () => [-1.1, -2.9, 1.1, 0.5], vs: [0], paint(K, S, v, L) { const sd = 791; X.contact(K, S, 1.0, 0.36, 0.55, 0, 0.1);
      X.prism(K, S, -0.08, 0.05, 0.62, 0.42, 1.7, 0.85, 0.06, ice(K, sd, L, { root: 0.2, frost: 1.2 })); X.prism(K, S, 0.5, 0.1, 0.22, 0.16, 0.55, 0.3, 0.4, ice(K, sd + 1, L, { root: 0.2 })); X.prism(K, S, -0.6, 0.12, 0.2, 0.15, 0.45, 0.25, -0.45, ice(K, sd + 2, L, { root: 0.2 })); S.unlock();
      X.lump(K, S, 0, 0.12, 0.95, 0.22, { amp: 0.2, fr: 2.6, sd: sd + 3, bump: 0.3, flat: 1, mat: (dx, dy, ao, e, nz, wx, wy) => X.snowM(K, wx * 2, wy * 2, sd + 3, { blue: 0.2 }) }); S.unlock(); K.glint(S.c, -0.2, -2.3, 0.14, 0.8); K.ink(S, X.INK[L], 0.4); } },
  });

  /* ======================= the live states over them ======================= */
  const WARN = '#FF8A6E', GREEN = '#78D7B2', GREEN_HI = '#B8F5DA', ICE_HI = '#CFE8F4';
  function thulPillar(c, FX, w, T, t) { const Xs = FX.sx(w.x), Ys = FX.sy(w.y) + T * 0.35, r = w.r * T * 1.05, h = 4.4 * T, mk = w.mark ? 0.5 + 0.5 * Math.sin(t * 8) : 0;
    if (!A.piece(c, 'thulpillar', w.i % 2, Xs, Ys, T, { L: 'glacier' })) return false;
    if (w.crack > 0.02) { const R = mb32(31 + w.i), n = Math.ceil(9 * w.crack); c.save(); c.lineCap = 'round'; for (let k = 0; k < n; k++) { let x = Xs + (R() - 0.5) * r * 1.4, y = Ys - R() * h * 0.9; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (R() - 0.5) * T * 0.7; y += (R() - 0.4) * T * 0.7; c.lineTo(x, y); } c.strokeStyle = 'rgba(8,16,34,.9)'; c.lineWidth = T * 0.12; c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,138,110,${(0.6 + 0.4 * mk).toFixed(3)})`; c.lineWidth = T * 0.07; c.stroke(); c.globalCompositeOperation = 'source-over'; } c.restore(); }
    if (w.mark) glowSp(c, WARN, Xs, Ys - h * 0.8, r * 2, 0.35 + 0.35 * mk);
    return true; }
  function thulWall(c, FX, w, T) { const k = w.k == null ? 1 : w.k, BL = [[-1.5, -0.12], [-0.5, 0.08], [0.5, -0.06], [1.5, 0.15]]; let ok = true;
    BL.forEach(([u, tilt], i) => { const kk = clamp(k * 1.6 - i * 0.18, 0, 1); if (kk <= 0) return; const Xs = FX.sx(w.x + u), Ys = FX.sy(w.y) + T * 0.3 - (1 - easeOut(kk)) * T * 3; if (!A.piece(c, 'thulblock', i, Xs, Ys, T, { L: 'glacier', rot: tilt, alpha: Math.min(1, kk * 2) })) ok = false; });
    return ok; }
  function nivTelescope(c, FX, p, Xs, Ys, T, t, cfg) { const m = FX.m, P3 = (x, y, z) => [Xs + (x - p.x) * T, Ys + (y - p.y) * T - z * T], h = 1.0;
    if (!A.piece(c, 'nivdrum', 0, Xs, Ys, T, { L: 'obs' })) return false;
    const az = m && !m.dead ? Math.atan2(m.y - p.y, m.x - p.x) : -0.9, el = m && !m.dead ? clamp(0.35 + ((FX.mem && FX.mem.alt) || cfg.alt) * 0.05, 0.35, 0.8) : 0.6, pv = [p.x, p.y, h + 0.75], dd = [Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el)];
    const at = u => [pv[0] + dd[0] * u, pv[1] + dd[1] * u, pv[2] + dd[2] * u], sP = P3(...at(-0.9)), fP = P3(...at(2.6));
    c.save(); c.lineCap = 'round'; for (const s of [-1, 1]) { const b = P3(p.x - Math.sin(az) * 0.45 * s, p.y + Math.cos(az) * 0.45 * s, h), tp = P3(pv[0] - Math.sin(az) * 0.4 * s, pv[1] + Math.cos(az) * 0.4 * s, pv[2]); const g = c.createLinearGradient(b[0], b[1], tp[0], tp[1]); g.addColorStop(0, '#5A4420'); g.addColorStop(0.5, '#C9A55E'); g.addColorStop(1, '#8A6A34'); c.strokeStyle = 'rgba(8,14,26,.9)'; c.lineWidth = T * 0.2; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(tp[0], tp[1]); c.stroke(); c.strokeStyle = g; c.lineWidth = T * 0.12; c.stroke(); } c.restore();
    const L2 = Math.hypot(fP[0] - sP[0], fP[1] - sP[1]); A.piece(c, 'nivtube', 0, sP[0], sP[1], T, { L: 'obs', rot: Math.atan2(fP[1] - sP[1], fP[0] - sP[0]), sx: Math.max(0.2, L2 / (3.5 * T)) });
    c.save(); c.fillStyle = '#0E1A2E'; c.strokeStyle = 'rgba(8,14,26,.9)'; c.lineWidth = Math.max(1.2, T * 0.06); c.beginPath(); c.ellipse(fP[0], fP[1], T * 0.32, T * 0.24, Math.atan2(fP[1] - sP[1], fP[0] - sP[0]), 0, TAU); c.fill(); c.stroke(); c.restore();
    glowSp(c, GREEN, fP[0], fP[1], T * 0.5, 0.5 + 0.2 * Math.sin(t * 1.3)); return true; }
  function nivVane(c, FX, p, Xs, Ys, T, t) { const M = FX.mem || {}, i = p.i, va = M.vA ? M.vA[i] : 0, S = M.sh, locked = !!(S && S.locked === i), up = !!(M.bar && M.bar[i] && M.bar[i].up), Hp = 3.6, P3 = (x, y, z) => [Xs + (x - p.x) * T, Ys + (y - p.y) * T - z * T], LN = 'rgba(8,14,26,.9)';
    if (!A.piece(c, 'nivpost', 0, Xs, Ys, T, { L: 'obs' })) return false;
    const ch = M.vch ? M.vch[i] : 0, wa = va * 2 + ch * 6; A.piece(c, 'nivwheel', 0, Xs, Ys - T * 1.0, T, { L: 'obs', rot: wa });
    const d = [Math.cos(va), Math.sin(va)], tp = [p.x, p.y, Hp], fin = [[0.15, 0.15], [-1.7, 1.05], [-1.9, -0.45], [-0.2, -0.2]].map(([u, z]) => P3(tp[0] + d[0] * u, tp[1] + d[1] * u, tp[2] + z)), face = Math.abs(Math.sin(va)) * 0.6 + 0.4;
    const arrow = [P3(tp[0] + d[0] * 1.5, tp[1] + d[1] * 1.5, Hp), P3(tp[0] + d[0] * 0.9, tp[1] + d[1] * 0.9, Hp + 0.3), P3(tp[0] + d[0] * 0.9, tp[1] + d[1] * 0.9, Hp - 0.3)], rod = [P3(tp[0] - d[0] * 0.3, tp[1] - d[1] * 0.3, Hp), P3(tp[0] + d[0] * 1.2, tp[1] + d[1] * 1.2, Hp)];
    const poly = pts => { c.beginPath(); pts.forEach((q, k) => k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = T * 0.14; c.beginPath(); c.moveTo(rod[0][0], rod[0][1]); c.lineTo(rod[1][0], rod[1][1]); c.stroke(); c.strokeStyle = '#3A4458'; c.lineWidth = T * 0.08; c.stroke();
    // the fin: beaten metal, lit by how square it turns to us, a rime edge along its top, two rows of rivets
    const k2 = face, g = c.createLinearGradient(fin[1][0], fin[1][1] - T * 0.6, fin[3][0], fin[3][1] + T * 0.6); g.addColorStop(0, `rgb(${Math.round(150 + 80 * k2)},${Math.round(165 + 70 * k2)},${Math.round(185 + 60 * k2)})`); g.addColorStop(0.55, `rgb(${Math.round(70 + 60 * k2)},${Math.round(84 + 60 * k2)},${Math.round(104 + 60 * k2)})`); g.addColorStop(1, '#2A3446');
    poly(fin); c.fillStyle = g; c.fill(); c.strokeStyle = LN; c.lineWidth = Math.max(1.2, T * 0.06); c.stroke();
    c.strokeStyle = up ? GREEN_HI : 'rgba(236,246,252,.8)'; c.lineWidth = Math.max(1, T * (up ? 0.12 : 0.06)); c.beginPath(); c.moveTo(fin[0][0], fin[0][1]); c.lineTo(fin[1][0], fin[1][1]); c.lineTo(fin[2][0], fin[2][1]); c.stroke();
    c.fillStyle = 'rgba(20,28,44,.7)'; for (let r2 = 0; r2 < 5; r2++) { const u = (r2 + 0.5) / 5, q = [lerp(fin[0][0], fin[1][0], u) * 0.85 + lerp(fin[3][0], fin[2][0], u) * 0.15, lerp(fin[0][1], fin[1][1], u) * 0.85 + lerp(fin[3][1], fin[2][1], u) * 0.15]; c.beginPath(); c.arc(q[0], q[1], Math.max(1, T * 0.04), 0, TAU); c.fill(); }
    const ga = c.createLinearGradient(arrow[1][0], arrow[1][1], arrow[2][0], arrow[2][1]); ga.addColorStop(0, '#F2D79A'); ga.addColorStop(0.5, '#C9A55E'); ga.addColorStop(1, '#6A5024'); poly(arrow); c.fillStyle = ga; c.fill(); c.strokeStyle = LN; c.lineWidth = Math.max(1.2, T * 0.06); c.stroke();
    if (up) glowSp(c, GREEN_HI, Xs, Ys - Hp * T, T * 1.4, 0.6 + 0.2 * Math.sin(t * 6));
    if (locked) { c.globalAlpha = 0.55; c.fillStyle = ICE_HI; poly(fin); c.fill(); c.fillRect(Xs - T * 0.2, Ys - Hp * T, T * 0.4, Hp * T); c.globalAlpha = 1; c.fillStyle = '#F2FAFF'; c.strokeStyle = '#5E86A8'; c.lineWidth = 1;
      for (let k = 0; k < 5; k++) { const q = [lerp(fin[1][0], fin[2][0], k / 4), lerp(fin[1][1], fin[2][1], k / 4)], L = T * (0.3 + (k % 3) * 0.15); c.beginPath(); c.moveTo(q[0] - T * 0.07, q[1]); c.lineTo(q[0], q[1] + L); c.lineTo(q[0] + T * 0.07, q[1]); c.closePath(); c.fill(); c.stroke(); } }
    c.restore(); return true; }
  // Ahuul's shelters: the hood's blocks as before (their shape and parts), each face laid with the land's ice texture and lit
  // by which way it turns, its top with the snow texture, a rim of light along the top, icicles off the outer lip
  function texPat(c, name, T) { const t = A.tex(name, Math.round(T * Math.min(3, Math.max(1, (c.getTransform ? Math.hypot(c.getTransform().a, c.getTransform().b) : 1))))); if (!t) return null; const p = c.createPattern(t.cv, 'repeat'); if (!p) return null; try { p.setTransform(new DOMMatrix([T / t.P, 0, 0, T / t.P, 0, 0])); } catch (e) {} return p; }
  function ahShelter(c, FX, p, T, t) { const nx = p.nx, ny = p.ny, Q = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T], ri = 1.95, ro = 3.15, a0 = p.oa + 0.95, a1 = p.oa + TAU - 0.95, n = 16, back = p.part === 'back';
    const pIce = texPat(c, 'bank:white', T), pSnow = texPat(c, 'roof:white', T); if (!pIce || !pSnow) return false;
    const hAt = a => 0.75 + 1.25 * Math.pow(Math.max(0, -Math.sin(a)), 0.8), segs = [];
    for (let i = 0; i < n; i++) { const b0 = lerp(a0, a1, i / n), b1 = lerp(a0, a1, (i + 1) / n), am = (b0 + b1) / 2; if ((Math.sin(am) < 0) !== back) continue; segs.push([b0, b1, am, i]); }
    segs.sort((P1, P2) => Math.sin(P1[2]) - Math.sin(P2[2]));
    const P = (r, a, z) => Q(nx + Math.cos(a) * r, ny + Math.sin(a) * r, z), poly = pts => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };
    c.save(); c.lineJoin = 'round';
    for (const [b0, b1, am, i] of segs) { const h0 = hAt(b0), h1 = hAt(b1), outer = Math.sin(am) > 0, r = outer ? ro : ri, face = [P(r, b0, 0), P(r, b1, 0), P(r, b1, h1), P(r, b0, h0)], lit = clamp(0.5 - Math.cos(am) * 0.4 + (outer ? -0.1 : 0.1), 0.15, 1);
      poly(face); c.fillStyle = outer ? '#8FB8D2' : '#B4DAEB'; c.fill(); c.globalAlpha = 0.9; c.fillStyle = pIce; c.fill(); c.globalAlpha = 1; c.save(); c.clip(); const yT = Math.min(face[2][1], face[3][1]), yB = Math.max(face[0][1], face[1][1]), g = c.createLinearGradient(0, yT, 0, yB); g.addColorStop(0, `rgba(240,250,255,${(0.35 * lit).toFixed(3)})`); g.addColorStop(0.5, `rgba(120,170,210,${(0.15 + 0.2 * (1 - lit)).toFixed(3)})`); g.addColorStop(1, `rgba(20,50,90,${(0.2 + 0.3 * (1 - lit)).toFixed(3)})`); c.fillStyle = g; c.fillRect(Math.min(face[0][0], face[1][0]) - 2, yT - 2, Math.abs(face[1][0] - face[0][0]) + 4, yB - yT + 4);
        if (i % 3 === 0) { c.strokeStyle = 'rgba(30,60,100,.5)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(face[0][0], face[0][1]); c.lineTo(face[3][0], face[3][1]); c.stroke(); } c.restore();
      const top = [P(ri, b0, h0), P(ri, b1, h1), P(ro, b1, h1), P(ro, b0, h0)]; poly(top); c.fillStyle = pSnow; c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(face[3][0], face[3][1]); c.lineTo(face[2][0], face[2][1]); c.stroke();
      if (outer && !back) for (let k = 0; k < 2; k++) { const u = (k + 0.3 + 0.4 * ((i * 7 + k * 3) % 5) / 5), q = [lerp(face[3][0], face[2][0], u), lerp(face[3][1], face[2][1], u)], L = T * (0.18 + 0.14 * ((i + k) % 3)), gi = c.createLinearGradient(q[0], q[1], q[0], q[1] + L); gi.addColorStop(0, 'rgba(240,250,255,.95)'); gi.addColorStop(1, 'rgba(160,210,240,.3)'); c.fillStyle = gi; c.beginPath(); c.moveTo(q[0] - T * 0.05, q[1]); c.lineTo(q[0], q[1] + L); c.lineTo(q[0] + T * 0.05, q[1]); c.closePath(); c.fill(); } }
    const ord = segs.slice().sort((P1, P2) => P1[0] - P2[0]); c.strokeStyle = 'rgba(20,34,60,.85)'; c.lineWidth = Math.max(1.3, T * 0.06); c.beginPath(); for (const r of back ? [ri, ro] : [ro, ri]) ord.forEach(([b0, b1], i) => { const q0 = P(r, b0, hAt(b0)), q1 = P(r, b1, hAt(b1)); if (i === 0) c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); }); c.stroke();
    c.restore(); return true; }
  function ahScope(c, FX, p, T, t, cfg) { const C = p.C; if (!C) return false; const bx = C.x + cfg.scope[0], by = C.y + cfg.scope[1], Xs = FX.sx(bx), Ys = FX.sy(by); if (!A.piece(c, 'ahscope', 0, Xs, Ys, T, { L: 'white' })) return false;
    const d0 = [-7.6, -7.6, 6], dl = Math.hypot(...d0), d = d0.map(q => q / dl), mid = [d[0] * 1.7, d[1] * 1.7, 1.25 + d[2] * 1.7], f1 = [mid[0] + 1.05, mid[1] + 0.9, mid[2] - 0.9]; glowSp(c, '#CFF0FF', Xs + f1[0] * T, Ys + (f1[1] - f1[2]) * T, T * 0.45, 0.25 + 0.2 * Math.max(0, Math.sin(t * 1.7)));
    return true; }
  function ahAnchor(c, FX, o, Xs, Ys, T, t) { if (!A.piece(c, 'ahanchor', 0, Xs, Ys, T, { L: 'white' })) return false; const cr = 1 - o.hp / o.maxhp, pu = 0.5 + 0.5 * Math.sin(t * 4);
    glowSp(c, GREEN, Xs, Ys - T * 1.1, T * (1.1 + pu * 0.3), 0.6); c.save(); c.fillStyle = GREEN_HI; c.beginPath(); c.arc(Xs, Ys - T * 1.1, T * 0.18, 0, TAU); c.fill();
    if (cr > 0.25) { c.strokeStyle = 'rgba(20,34,60,.9)'; c.lineWidth = Math.max(1.2, T * 0.07); c.beginPath(); c.moveTo(Xs - T * 0.45, Ys - T * 1.3); c.lineTo(Xs - T * 0.05, Ys - T * 0.9); c.lineTo(Xs - T * 0.25, Ys - T * 0.4); if (cr > 0.6) { c.moveTo(Xs + T * 0.3, Ys - T * 1.5); c.lineTo(Xs + T * 0.05, Ys - T * 1.0); } c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(184,245,218,.5)'; c.lineWidth = Math.max(1, T * 0.03); c.stroke(); }
    c.font = `800 ${Math.round(T * 0.75)}px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText('ICE ANCHOR', Xs, Ys - T * 3.0); c.fillText('ICE ANCHOR', Xs, Ys - T * 3.0); c.restore(); return true; }

  /* ======================= the wrappers (run time: the boss files load after this one) ======================= */
  const STATS = { thul: 0, nivora: 0, ahuul: 0, fallback: 0 };
  function wrap() { try { if (typeof FIEND_DEFS === 'undefined') return; const D1 = FIEND_DEFS.thul, D2 = FIEND_DEFS.nivora, D3 = FIEND_DEFS.ahuul;
    if (D1 && typeof D1.drawProp === 'function' && !D1.drawProp.__aurA) { const od = D1.drawProp; const f = function (c, FX, p, Xs, Ys, T, t) { if (on() && p && p.kind === 'pillar' && p.wb) { try { const w = p.wb; if (w.kind === 'pillar' ? thulPillar(c, FX, w, T, t) : thulWall(c, FX, w, T)) { STATS.thul++; return; } } catch (e) {} STATS.fallback++; } return od.apply(this, arguments); }; f.__aurA = 1; D1.drawProp = f; }
    if (D2 && typeof D2.drawProp === 'function' && !D2.drawProp.__aurA) { const od = D2.drawProp; const f = function (c, FX, p, Xs, Ys, T, t) { if (on() && p) { try { if ((p.kind === 'telescope' && nivTelescope(c, FX, p, Xs, Ys, T, t, { alt: 4.4 })) || (p.kind === 'vane' && nivVane(c, FX, p, Xs, Ys, T, t))) { STATS.nivora++; return; } } catch (e) {} if (p.kind === 'telescope' || p.kind === 'vane') STATS.fallback++; } return od.apply(this, arguments); }; f.__aurA = 1; D2.drawProp = f; }
    if (D3 && typeof D3.drawProp === 'function' && !D3.drawProp.__aurA) { const od = D3.drawProp; const f = function (c, FX, p, Xs, Ys, T, t) { if (on() && p) { try { if ((p.kind === 'shelter' && ahShelter(c, FX, p, T, t)) || (p.kind === 'scope' && ahScope(c, FX, p, T, t, { scope: [7.6, -7.4] }))) { STATS.ahuul++; return; } } catch (e) {} if (p.kind === 'shelter' || p.kind === 'scope') STATS.fallback++; } return od.apply(this, arguments); }; f.__aurA = 1; D3.drawProp = f; }
    if (D3 && typeof D3.drawObj === 'function' && !D3.drawObj.__aurA) { const od = D3.drawObj; const f = function (c, FX, o, Xs, Ys, T, t) { if (on() && o && o.kind === 'anchor') { try { if (ahAnchor(c, FX, o, Xs, Ys, T, t)) { STATS.ahuul++; return; } } catch (e) {} STATS.fallback++; } return od.apply(this, arguments); }; f.__aurA = 1; D3.drawObj = f; }
  } catch (e) {} }
  if (typeof setTimeout === 'function') setTimeout(wrap, 0);
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.aurora; if (Rf && !Rf.__aurA) { Rf.__aurA = 1; const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} wrap();
      // the arena's pictures, painted on the loading screen
      const id = P && P.F && P.F.fiend && P.F.fiend.id, list = { thul: [['thulpillar', 0], ['thulpillar', 1], ['thulblock', 0], ['thulblock', 1], ['thulblock', 2], ['thulblock', 3]], nivora: [['nivdrum', 0], ['nivtube', 0], ['nivpost', 0], ['nivwheel', 0]], ahuul: [['ahscope', 0], ['ahanchor', 0]] }[id], L = { thul: 'glacier', nivora: 'obs', ahuul: 'white' }[id];
      const b = []; if (list && P.T > 0) { const PB = Math.round(P.T * (P.k || 1)); for (const [nm, v] of list) b.push(() => { try { A.sprite(nm, v, PB, L); } catch (e) {} }); if (id === 'ahuul') for (const n of ['bank:white', 'roof:white']) for (const j of A.texJobs(n, PB)) b.push(j); }
      return a.concat(b); }; } } catch (e) {}
  A.arena = { wrap, get stats() { return Object.assign({}, STATS); } };
})();
