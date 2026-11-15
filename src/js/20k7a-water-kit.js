/* ---------- (v361) the water kit: water on the GPU ----------
   Every water Strong and Ult (Jaws apart: it has its own model) runs its draws in a GPU mode (the wrapper at the end of the
   water files): between gpuBegin and gpuEnd the ice kit's glows and floor light, the context's glows, cores, trails and rays
   and this kit's water paint through Nidhogg's painter (20k6h FGFX), whose water kinds are drawn from maths and noise in the
   fragment shader: a sphere of water (a turning globe of translucent water, deep sapphire in its heart, currents banding
   round it, a fresnel rim, caustic light webbing through it, specular glints), a stream of water (a translucent flowing tube,
   streaks racing along it, a glossy highlight, caustic glimmer), caustic light on the floor, foam and spray, ripples.
   The moves draw their GPU picture from the same numbers as their 2D one; without WebGL (or with a software rasteriser, or
   window.__WATER_GL = 0) each keeps its 2D picture. */
const WK = (() => {
  const TAU = Math.PI * 2;
  const W = { white: '#FFFFFF', foam: '#F2FBFF', pale: '#CFF6FF', aqua: '#6FF2FF', turq: '#3FD6E0', water: '#2E9BE6', blue: '#2A6FD0', sapph: '#1A4FB0', deep: '#0E2F7A', abyss: '#081E52' };
  let H = null, K = null;
  const hx = (c, d) => (typeof c === 'string' && c[0] === '#' && (c.length === 7 || c.length === 4) ? c : d);
  /* the GPU mode: IK's (so the ice kit's glows inside a water move paint on the GPU too) */
  function gpuBegin(c, flag) { try { if (window.__WATER_GL === 0) return null; } catch (e) {} return K.gpuBegin(c, flag || '__WTR_GL'); }
  const gpuEnd = c => K.gpuEnd(c), gq = () => (K ? K.gq() : null);
  const xy = (c, x, y) => K.gpuXY(c, x, y);
  /* flush what is queued so far and start again: what the move draws next in 2D lies over the water already painted */
  function mid(c) { if (!gq()) return; K.gpuEnd(c); K.gpuBegin(c, '__WTR_GL'); }
  /* a sphere of water at (x, y), radius r (the caller's coordinates); o: col, dens, lite, turn, seed, halo */
  function sphere(c, x, y, r, a, o) { const Q = gq(); if (!Q || !(r > 0.5) || !(a > 0.01)) return false; o = o || {}; const p = xy(c, x, y), R = r * p[3], col = hx(o.col, W.water), sd = o.seed || 0;
    if (o.halo !== 0) Q.glow(p[0], p[1], R * (o.halo || 1.9), hx(o.glow, W.aqua), 0.3 * a);
    Q.wsphere(p[0], p[1], R, col, a, sd, o.turn == null ? 1 : o.turn, o.dens, o.lite); return true; }
  /* a stream of water along screen points pts ([x, y] or [x, y, w]), half-width w, tapering by o.taper (0..1) toward pts[0] */
  function stream(c, pts, w, a, o) { const Q = gq(); if (!Q || !(a > 0.01)) return false; const n = pts.length; if (n < 2) return false; o = o || {}; const col = hx(o.col, W.water), sd = o.seed || 0, tp = o.taper == null ? 0.5 : o.taper, P = pts.map(q => xy(c, q[0], q[1]));
    for (let i = 1; i < n; i++) { const u = i / (n - 1), p0 = P[i - 1], p1 = P[i], dx = p1[0] - p0[0], dy = p1[1] - p0[1], ww = (pts[i][2] != null ? pts[i][2] : w) * p1[3] * (1 - tp + tp * u), aa = a * (o.fade ? 0.25 + 0.75 * u : 1);
      Q.wstream(p0[0] - dx * 0.35, p0[1] - dy * 0.35, p1[0] + dx * 0.35, p1[1] + dy * 0.35, ww, col, aa, sd + i * 0.37, o.flow == null ? 3 : o.flow, o.dens, o.lite); }
    if (o.glow) for (let i = 0; i < n; i += 2) Q.glow(P[i][0], P[i][1], w * 2.2 * P[i][3], hx(o.glow, W.aqua), 0.12 * a);
    return true; }
  /* a straight stream (a jet, a waterfall) from (x0, y0) to (x1, y1) */
  function jet(c, x0, y0, x1, y1, w, a, o) { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.min(12, Math.ceil(L / (w * 2.2)) + 1)), pts = []; for (let i = 0; i < n; i++) { const u = i / (n - 1); pts.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * u]); } return stream(c, pts, w, a, Object.assign({ taper: 0 }, o)); }
  /* caustic light on the floor (a pool of rippling light) */
  function pool(c, x, y, r, a, o) { const Q = gq(); if (!Q || !(r > 0.5) || !(a > 0.01)) return false; o = o || {}; const p = xy(c, x, y), R = r * p[3], sy = o.sy == null ? H.GY : o.sy; Q.caustic(p[0], p[1], R, hx(o.col, W.aqua), a, o.seed || 0, sy); if (o.glow !== 0) Q.glow(p[0], p[1], R * 1.15, hx(o.glow, W.water), 0.22 * a, sy); return true; }
  /* foam and spray: a churning white cloud breaking up as it spreads (spread 0..1) */
  function spray(c, x, y, r, a, o) { const Q = gq(); if (!Q || !(r > 0.5) || !(a > 0.01)) return false; o = o || {}; const p = xy(c, x, y); Q.spray(p[0], p[1], r * p[3], hx(o.col, W.pale), a, o.seed || 0, o.spread || 0, o.sy || 1); return true; }
  /* a ripple spreading on the floor (r its front) */
  function ripple(c, x, y, r, a, o) { const Q = gq(); if (!Q || !(r > 1) || !(a > 0.01)) return false; o = o || {}; const p = xy(c, x, y); Q.ripple(p[0], p[1], r * p[3], hx(o.col, W.aqua), a, o.seed || 0, o.sy == null ? H.GY : o.sy, o.th); return true; }
  /* a glow, a sparkle */
  function glow(c, x, y, r, col, a, sy) { const Q = gq(); if (!Q || !(r > 0.5) || !(a > 0.01)) return false; const p = xy(c, x, y); Q.glow(p[0], p[1], r * p[3], hx(col, W.aqua), Math.min(1, a), sy || 1); return true; }
  function star(c, x, y, s, a, col) { const Q = gq(); if (!Q || !(a > 0.01)) return false; const p = xy(c, x, y); Q.glow(p[0], p[1], s * 0.45 * p[3], col || '#E8FBFF', 0.7 * a); Q.star(p[0], p[1], s * 0.6 * p[3], 0.45 * a, col || '#FFFFFF'); return true; }   /* (v364: a soft glint, not a sharp cross) */
  /* a ring of light (a halo, a rim) */
  function ring(c, x, y, r, col, a, w, sy) { const Q = gq(); if (!Q || !(r > 0.5) || !(a > 0.01)) return false; const p = xy(c, x, y); Q.ripple(p[0], p[1], r * p[3], hx(col, W.aqua), a, (x * 0.01) % 9, sy || 1, Math.max(0.06, (w || r * 0.1) / r)); return true; }   /* (v364: a soft ripple of light, not a hard ring) */
  /* a whirl of water seen from above (the energy vortex in water colours, turning with spin) */
  function whirl(c, x, y, r, a, o) { const Q = gq(); if (!Q || !(r > 0.5) || !(a > 0.01)) return false; o = o || {}; const p = xy(c, x, y), sy = o.sy == null ? H.GY : o.sy; Q.evortex(p[0], p[1], r * p[3], hx(o.col, W.water), o.heat == null ? 0.72 : o.heat, a, o.seed || 0, o.spin || 1, sy); Q.caustic(p[0], p[1], r * 0.9 * p[3], W.aqua, 0.55 * a, (o.seed || 0) + 3, sy); return true; }
  /* a water ribbon (a curling band of water) through world-screen points, as a stream with a bright edge */
  const ribbon = (c, pts, w, a, o) => stream(c, pts, w, a, Object.assign({ taper: 0.7, flow: 4 }, o));
  /* (v364) a cloud of bubbles rising (rx, ry its extent), and shafts of light falling through water from (x0, y0) to (x1, y1) */
  function bubbles(c, x, y, rx, ry, a, o) { const Q = gq(); if (!Q || !(rx > 1) || !(a > 0.01)) return false; o = o || {}; const p = xy(c, x, y); Q.bubbles(p[0], p[1], rx * p[3], (ry || rx) * p[3], hx(o.col, W.pale), a, o.seed || 0, o.rise == null ? 1 : o.rise); return true; }
  function shafts(c, x0, y0, x1, y1, w, a, o) { const Q = gq(); if (!Q || !(a > 0.01)) return false; o = o || {}; const p0 = xy(c, x0, y0), p1 = xy(c, x1, y1); Q.shafts(p0[0], p0[1], p1[0], p1[1], w * p0[3], hx(o.col, W.pale), a, o.seed || 0); return true; }
  const bind = h => { H = h; K = IK.bind(h); return WKB; };
  const WKB = { W, gpuBegin, gpuEnd, gq, xy, mid, sphere, stream, jet, pool, spray, ripple, glow, star, ring, whirl, ribbon, bubbles, shafts, TAU };
  /* (for shared helpers that draw outside a bound cast: the kit as last bound, and whether its GPU mode is on) */
  return { bind, W, on: () => !!(K && K.gq()), gy: () => (H && H.GY) || 0.55, get api() { return WKB; } };
})();
