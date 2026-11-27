/* ---------- v466 CF: the Caldera's ash mound, remade (prop 'ashmound') ----------
   The user (2026-11-27, of the grey dome with two orange holes in the Cinder Galleries): "seem really low quality compared to
   the other props, please remake it so it's same graphical fidelity as the other props in the gpu."
   It was a flat 2D dome (one gradient, an ink line, four orange dots). Now it is painted once per size into a cached picture
   by the Drowned Belfry's software shading pass (BELPROPS.kit, 20n9), as the Caldera's ice props are (20zz5b), in the
   Caldera's own light ('calash': a dim warm key, the lava's red bounce from below, an ember rim): a heaped cone of volcanic
   ash and cinder over a basalt core, with real volume (a main heap and two lesser lumps, each a lit solid), its flanks laid
   in strata (bands of dark basalt grit and grey ash, wavering), cracked (dark fissures, a few with lava in them), pale ash
   settled on the top and in drifts, cinders and soot specks, and vents in it: two side by side near its crown and two small
   ones low on its flanks, each a crusted lip round a molten throat. Nothing is painted per frame. Where the GPU painter
   (NIDHOGG_MOVES.FGFX) runs, the vents breathe molten light over the picture (CAL.moundOver: a warm glow, a white-hot core,
   an ember orb turning in the throat; 20zz5's drawOver calls it, lowFx respected); without it the old coal glow stays.
   Four variants (v % 4: two shapes, each mirrored). Footprint, collision and its role are unchanged; it still breaks through
   BREAK_FX (20b2), which cuts its shards from this picture, and leaves its fire residue (PROP_EL). window.__CALMOUND = 0 (or
   __BELP = 0) brings back the old 2D art. API: CAL_MOUND { stats, vents(v), install } */
var CAL_MOUND = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const BP = () => (HAS_W && window.BELPROPS && window.BELPROPS.kit && window.BELPROPS.DEF && window.__BELP !== 0 && window.__CALMOUND !== 0) ? window.BELPROPS : null;
  const STATS = { painted: 0, fallbacks: 0, over: 0 };
  const LIGHT = { a0: [0.12, 0.07, 0.06], a1: [0.08, 0.06, 0.08], e0: [0.3, 0.11, 0.04], e1: [0.22, 0.17, 0.19], k: [1.2, 1.0, 0.84], rim: [0.72, 0.3, 0.08], bo: [0.42, 0.14, 0.03] };
  /* the shapes (tiles; the picture's feet at 0, 0): heaps [cx, by (toward the camera), R, H, lumpiness seed], painted far to
     near; the vents [heap, phi (0 = +x, pi/2 = facing us), h (up the heap), r] */
  const SHAPES = [
    { heaps: [[-0.66, -0.14, 0.5, 0.42, 3], [0, 0, 1.08, 0.88, 1], [0.76, 0.16, 0.42, 0.3, 5]], vents: [[1, 1.3, 0.56, 0.1], [1, 1.66, 0.58, 0.095], [1, 2.35, 0.2, 0.07], [1, 0.72, 0.26, 0.065]] },
    { heaps: [[0.66, -0.12, 0.5, 0.44, 7], [-0.06, 0, 1.04, 0.92, 2], [-0.7, 0.18, 0.36, 0.26, 9]], vents: [[1, 1.22, 0.62, 0.095], [1, 1.6, 0.6, 0.1], [1, 2.2, 0.28, 0.065], [0, 1.4, 0.24, 0.06]] } ];
  const prof = (R, H, sd) => h => { const u = Math.max(0, Math.min(1, h / H)); return R * Math.pow(Math.max(0, 1 - Math.pow(u, 1.7)), 0.62) * (1 + 0.035 * Math.sin(h * 23 + sd) + 0.025 * Math.sin(h * 41 + sd * 2.3)); };
  // a vent's centre on its heap in the picture (tiles), and on the heap's surface (3D: x across, y toward us, z up)
  function ventAt(sh, i, mir) { const vt = sh.vents[i], hp = sh.heaps[vt[0]], phi = mir ? Math.PI - vt[1] : vt[1], r = prof(hp[2], hp[3], hp[4])(vt[2]), cx = (mir ? -hp[0] : hp[0]);
    return { x: cx + r * Math.cos(phi), y: hp[1] - vt[2] + 0.34 * r * Math.sin(phi), X: r * Math.cos(phi), Y: r * Math.sin(phi), Z: vt[2], r: vt[3], heap: vt[0] }; }
  function paintMound(S, v) { const B = BP(), K = B.kit, M = K.M, c = S.c, sh = SHAPES[(v >> 1) % 2], mir = !!(v & 1), sd = 3.7 + v * 5.3, R = K.R1(911 + v * 37);
    // the contact shadow and a warm scorch on the floor round its foot
    K.contact(S, 0.05, 0.02, 1.25, 0.26, 0.6);
    c.save(); c.scale(1, K.K); const g = c.createRadialGradient(0, 0, 0.3, 0, 0, 1.4); g.addColorStop(0, 'rgba(255,110,40,.08)'); g.addColorStop(1, 'rgba(255,110,40,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1.4, 0, TAU); c.fill(); c.restore();
    const vents = sh.vents.map((q, i) => ventAt(sh, i, mir));
    const heaps = sh.heaps.map((hp, i) => ({ hp, i })).sort((a, b) => a.hp[1] - b.hp[1]);
    for (const { hp: [cx0, by, Rr, H, ls], i } of heaps) { const cx = mir ? -cx0 : cx0, pf = prof(Rr, H, ls), mine = vents.filter(q => q.heap === i);
      K.rev(S, cx, by, pf, 0, H, { bump: 0.55, floorAO: 0.8, mat: (u, h, ao, inside, phi) => {
        const r = pf(h), X3 = r * Math.cos(phi), Y3 = r * Math.sin(phi), w = K.fbm(u * 2.2 + sd + i, h * 2.6), n2 = K.vn(u * 9 + sd, h * 11 + i);
        // strata: bands up the heap (wavering), dark basalt grit and grey ash in turn, a rusty one now and then
        const band = (h + 0.07 * (w - 0.5) + 0.02 * Math.sin(u * 7 + sd)) * 10.5, bi = Math.floor(band), bf = band - bi, kind = ((bi * 7 + (ls | 0)) % 5);
        let t = kind === 0 || kind === 3 ? 0.085 : kind === 1 ? 0.17 : kind === 2 ? 0.13 : 0.11; t *= 0.85 + 0.3 * w + 0.12 * (n2 - 0.5);
        M.r = t * (kind === 4 ? 1.22 : 1.05); M.g = t * (kind === 4 ? 0.92 : 0.98); M.b = t * (kind === 4 ? 0.8 : 0.98); M.rg = 0.86; M.cc = 0;
        if (bf < 0.08) M.ao *= 0.72 + 3.5 * bf;   // (the step under each layer)
        // pale ash settled on the crown and drifted on the upper flanks
        const ash = K.ss(0.5, 0.86, h / H + 0.18 * (w - 0.5) + 0.12 * (K.vn(u * 4 + 9, h * 4) - 0.5)); if (ash > 0) { const s2 = K.vn(u * 23 + sd, h * 23); M.r = K.lerp(M.r, 0.34 + 0.06 * s2, ash); M.g = K.lerp(M.g, 0.32 + 0.05 * s2, ash); M.b = K.lerp(M.b, 0.31 + 0.05 * s2, ash); M.rg = K.lerp(M.rg, 0.95, ash); }
        // cinders and soot specks
        if (n2 > 0.8) { M.r *= 0.45; M.g *= 0.42; M.b *= 0.42; } else if (n2 < 0.09) { M.r += 0.08; M.g += 0.07; M.b += 0.06; }
        // fissures: dark cracks down the flanks; a few of them with lava showing in them
        const cr = Math.abs(K.vn(u * 7.5 + sd * 1.3 + 0.6 * Math.sin(h * 9), h * 1.1 + i * 3.1) - 0.5); if (cr < 0.022 && h < H * 0.82) { const e = 1 - cr / 0.022; M.r *= 1 - 0.75 * e; M.g *= 1 - 0.75 * e; M.b *= 1 - 0.75 * e; M.ao *= 1 - 0.4 * e;
          if (K.vn(u * 1.7 + sd, h * 1.3 + 7) > 0.62 && cr < 0.011) { const l = (1 - cr / 0.011) * (0.6 + 0.4 * K.ss(H * 0.7, 0, h)); M.er += 0.9 * l; M.eg += 0.3 * l; M.eb += 0.05 * l; } }
        // the vents: a crusted lip, then the molten throat
        for (const q of mine) { const d = Math.hypot(X3 - q.X, Y3 - q.Y, (h - q.Z) * 1.15), rr = q.r;
          if (d < rr) { const k = K.ss(rr, rr * 0.25, d); M.r = 0.05; M.g = 0.025; M.b = 0.02; M.rg = 0.5; M.ao = 0.4 + 0.6 * k; M.er = 0.35 + 1.25 * k; M.eg = 0.08 + 0.55 * k * k; M.eb = 0.02 + 0.16 * k * k * k; }
          else if (d < rr * 1.7) { const e = 1 - (d - rr) / (rr * 0.7); M.r = K.lerp(M.r, 0.07, e * 0.8); M.g = K.lerp(M.g, 0.05, e * 0.8); M.b = K.lerp(M.b, 0.045, e * 0.8); M.ao *= 1 - 0.3 * Math.sin(e * Math.PI); M.er += 0.38 * e * e; M.eg += 0.1 * e * e; } }
      } }); }
    S.unlock();
    // loose cinders round its foot and pale ash dust on its crown (2D, tiles)
    for (let i = 0; i < 26; i++) { const a = R() * TAU, d = 0.9 + R() * 0.4, x = Math.cos(a) * d, y = Math.min(0.2, Math.sin(a) * d * K.K * 0.7 + 0.02), s = 0.025 + R() * 0.035; c.fillStyle = R() < 0.25 ? 'rgba(120,40,20,.9)' : '#141012'; c.beginPath(); c.ellipse(x, y, s, s * 0.7, R() * 3, 0, TAU); c.fill(); c.fillStyle = 'rgba(200,190,180,.25)'; c.fillRect(x - s * 0.4, y - s * 0.6, s * 0.5, s * 0.25); }
    const top = sh.heaps[1]; for (let i = 0; i < 60; i++) { const a = R() * TAU, d = Math.sqrt(R()), x = (mir ? -top[0] : top[0]) + Math.cos(a) * top[2] * 0.3 * d, y = -top[3] * (0.62 + 0.2 * R()) + Math.sin(a) * 0.08 * d, s = 0.008 + R() * 0.012; c.fillStyle = `rgba(225,215,205,${0.25 + R() * 0.4})`; c.fillRect(x - s / 2, y - s / 2, s, s); }
    for (const q of vents.slice(0, 2)) K.glint(c, q.x - q.r * 0.3, q.y - q.r * 0.9, 0.05, 0.35);
    K.ink(S, [14, 6, 6], 0.5); }

  const DEFS = { calmound: { light: 'calash', box: () => [-1.45, -1.25, 1.45, 0.4], paint: paintMound } };
  let reg = false; const reg1 = () => { if (reg) return true; const B = BP(); if (!B) return false; Object.assign(B.DEF, DEFS); if (B.kit.LIGHTS && !B.kit.LIGHTS.calash) B.kit.LIGHTS.calash = LIGHT; reg = true; return true; };
  /* (the engine's prop picture ends 0.35 of a tile below the feet: a picture's floor light or shadow reaching further was cut
     there in a straight line, a square edge on the floor under the prop. Its last 0.15 is faded out instead) */
  function footFade(c, T) { c.save(); c.globalCompositeOperation = 'destination-out'; const g = c.createLinearGradient(0, T * 0.19, 0, T * 0.35); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); c.fillStyle = g; c.fillRect(-T * 4, T * 0.19, T * 8, T * 0.4); c.restore(); }
  if (typeof CAL !== 'undefined') CAL.footFade = footFade;
  let OLD = null;
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS, old = PR.ashmound; if (!old || old.__calmound) return; OLD = old;
    const f = function (c, T, v) { if (!reg1()) return old.apply(this, arguments); let sp = null; try { sp = BP().sprite('calmound', (v | 0) % 4, Math.max(8, Math.round(T))); } catch (e) { sp = null; } if (!sp) { STATS.fallbacks++; return old.apply(this, arguments); } STATS.painted++;
      const k = T / sp.P; c.drawImage(sp.cv, -sp.ax * k, -sp.ay * k, sp.cv.width * k, sp.cv.height * k); footFade(c, T); }; f.__calmound = 1; PR.ashmound = f;
    if (typeof PROP_EXT !== 'undefined') PROP_EXT.ashmound = [2.9, 1.9]; }   // (the picture's reach, for the prop cache's canvas)
  install();
  /* the vents' live light (GPU): at the prop's feet (Xs, Ys), T px a tile; ph its own beat; v its variant */
  function moundOver(Q, Xs, Ys, T, t, ph, v) { if (!reg) return false; STATS.over++; const sh = SHAPES[((v | 0) >> 1) % 2], mir = !!((v | 0) & 1), L = typeof CAL !== 'undefined' ? CAL.LAVA || '#FF6A1F' : '#FF6A1F';
    for (let i = 0; i < sh.vents.length; i++) { const q = ventAt(sh, i, mir), x = Xs + q.x * T, y = Ys + q.y * T, b = 0.75 + 0.25 * Math.sin(t * (1.6 + i * 0.37) + ph * 9 + i * 1.7), big = q.r > 0.08;
      Q.glow(x, y, T * q.r * (big ? 4.2 : 3.2), L, (big ? 0.42 : 0.3) * b);
      Q.glow(x, y, T * q.r * 1.1, '#FFD08A', 0.55 * b);
      if (big && Q.eorb) Q.eorb(x, y, T * q.r * 0.8, L, 0.85, 0.5 * b, ph * 11 + i, 1); }
    Q.glow(Xs, Ys - T * 0.3, T * 1.3, L, 0.07 + 0.03 * Math.sin(t * 0.9 + ph * 5), 0.5);   // (the heat it gives off, faintly)
    return true; }
  if (typeof CAL !== 'undefined') CAL.moundOver = moundOver;
  if (typeof CAL !== 'undefined' && CAL.GLOWS) CAL.GLOWS.ashmound = v => [[0, -0.3, 0.8, 'mound']];
  const API = { get stats() { return Object.assign({}, STATS); }, install, reg: reg1, moundOver, vents: v => SHAPES[((v | 0) >> 1) % 2].vents.map((q, i) => ventAt(SHAPES[((v | 0) >> 1) % 2], i, !!((v | 0) & 1))), DEFS, get OLD() { return OLD; } };
  if (HAS_W) window.CAL_MOUND = API;
  return API;
})();
