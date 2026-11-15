/* (v361) the ten water Strongs and the Ults (Jaws apart: its own model) on the GPU, as fire, ice and lightning: each cast runs
   with a view of the move context (H) whose add() wraps every effect's draw and drawUnder in the water kit's GPU mode
   (WK.gpuBegin/gpuEnd), so the moves' own GPU water (spheres of water with caustic light in them, flowing streams, caustic
   pools, foam and spray, ripples; see 20k7a) paints through Nidhogg's painter; the context's glows become GPU glows, its
   energy cores small spheres of water, its trails and rays streams of water; the ice kit's glows and floor light paint on
   the GPU too. window.__WTR_GL = 0 (or __WATER_GL = 0) keeps the 2D picture; a software rasteriser or no WebGL keep it too */
(() => {
  const S = ELEM_IMPL.water.strong, U = ELEM_IMPL.water.ult;
  const SK = ['ribbonfin', 'tideglass', 'crescenttide', 'rainneedle', 'whirlpool', 'bubblesnare', 'waterwheel', 'twinundertow', 'pearlburst', 'basin'];
  const UK = ['mayhem', 'lotusbloom', 'aquaillusion', 'deepbluesea', 'rhapsody', 'abyssalspiral', 'bubblereverie', 'heavenfall', 'neptunetrident', 'jellyfish'];
  const hx = c => (typeof c === 'string' && c[0] === '#' && (c.length === 7 || c.length === 4) ? c : null);
  function gpuH(H) { const Hp = Object.create(H), K = WK.bind(H), WC = K.W;
    Hp.add = o => { for (const k of ['draw', 'drawUnder']) { const fn = o[k]; if (typeof fn !== 'function') continue;
        o[k] = function (c, f, X, Y, T, t) { WK.bind(H); const q = K.gpuBegin(c, '__WTR_GL'); try { return fn.call(this, c, f, X, Y, T, t); } finally { if (q) K.gpuEnd(c); } }; }
      return H.add(o); };
    Hp.glow = (c, x, y, r, col, a) => { if (!K.gq()) return H.glow(c, x, y, r, col, a); K.glow(c, x, y, r * 1.1, hx(col) || WC.aqua, Math.min(1, (a == null ? 0.6 : a) * 1.2)); };
    Hp.core = (c, x, y, r, col, hot, a) => { if (!K.gq()) return H.core(c, x, y, r, col, hot, a); if (!(r > 0.5)) return; const A = a == null ? 1 : a; K.sphere(c, x, y, r * 1.15, A, { col: hx(col) || WC.water, seed: x * 0.013 + y * 0.007, turn: 2, halo: 2.4 }); };
    Hp.trail = (c, pts, w, col, core) => { if (!K.gq() || pts.length < 2) return H.trail(c, pts, w, col, core); K.stream(c, pts, w * 0.45, 0.85, { col: hx(col) || WC.water, taper: 0.8, fade: 1, flow: 4 }); };
    Hp.ray = (c, x, y, a, len, w, col, alpha) => { if (!K.gq()) return H.ray(c, x, y, a, len, w, col, alpha); K.jet(c, x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, w * 0.6, alpha == null ? 0.8 : alpha, { col: hx(col) || WC.water, flow: 5 }); };
    return Hp; }
  const wrap = (T, keys) => { for (const key of keys) { const I = T[key]; if (typeof I !== 'function' || I.__gl) continue; const Wf = (C, H) => I(C, gpuH(H)); Wf.__gl = 1; for (const k in I) Wf[k] = I[k]; T[key] = Wf; } };
  wrap(S, SK); wrap(U, UK);
})();
