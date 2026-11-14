/* ---------- The fire kit: shared rendering for the twenty fire moves ----------
   The Spike Bloom standard applied to fire: every flame is a shaded volume (a hot white-yellow root, an orange body, red
   tips that fade toward smoke), lit from the upper left with a darker right flank, with a white-hot inner core and an
   additive glow; every burning thing throws light on the floor, sheds embers and sparks round itself, and leaves a
   scorched, still-glowing mark. Moves call FK.bind(H) at cast time and draw with what it returns.
   Evolution: C.evo is the pet's stage (1 Hatchling .. 5 Guardian .. 7 Celestial); FK.evoN(C, a, b) runs a count from a
   at stage 1 to b at stage 7, FK.evoK(C) is the extra damage an evolved move deals (split over its pieces). */
const FK = (() => {
  const TAU = Math.PI * 2;
  const P = { char: '#24100A', crust: '#5A2A1E', crustL: '#8A4A32', dred: '#7A1E0E', red: '#D2401A', org: '#FF7A2E', amb: '#FFA640', yel: '#FFD866', wht: '#FFF6D8', gold: '#FFC24A' };
  let H;
  const rgba = (h, a) => H.rgba(h, a);
  /* an additive glow sprite of radius r */
  /* (v347) the GPU mode (as the lightning kit's): between gpuBegin and gpuEnd every glow, floor light, flame, fireball, fire
     ribbon and shock ring this kit draws goes to the GPU painter (20k6h's NIDHOGG_MOVES.FGFX) as real fire (turbulent tongues,
     billowing balls with a corona, ribbons of scrolling flame), flushed in one pass at gpuEnd over what the move drew itself
     (scorch marks and crafted solids stay 2D). window[flag] = 0, __FIRE_GL = 0, a software rasteriser or no WebGL keep the 2D */
  let GQ = null, GF = null, GO = null;   // (GO: options; GO.ground: scorch marks burn on the GPU as glowing, cracked ground, v348)
  function gpuBegin(c, flag, pet, o) { if (GQ) return null; GO = o || null; try { if (window[flag] === 0 || window.__FIRE_GL === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; if (!F || !F.usable()) return null; GF = F; GQ = F.begin(c, null);   /* (v349: no mask round the pet; pet kept in the signature) */ BM = c.getTransform(); return GQ; } catch (e) { GQ = null; return null; } }
  // a point (x, y) in the context's current frame -> the frame the batch began in (a move may draw a flame under its own
  // translate/rotate, as flameAt does): its position and the extra rotation
  let BM = null;
  function gpuXY(c, x, y) { const m = c.getTransform(); if (!BM || (m.a === BM.a && m.b === BM.b && m.c === BM.c && m.d === BM.d && m.e === BM.e && m.f === BM.f)) return [x, y, 0, 1];
    const X = m.a * x + m.c * y + m.e, Y = m.b * x + m.d * y + m.f, det = BM.a * BM.d - BM.b * BM.c, dx = X - BM.e, dy = Y - BM.f;
    return [(BM.d * dx - BM.c * dy) / det, (-BM.b * dx + BM.a * dy) / det, Math.atan2(m.b, m.a) - Math.atan2(BM.b, BM.a), Math.sqrt(Math.abs((m.a * m.d - m.b * m.c) / det)) || 1]; }   // (x, y, the extra rotation, the extra scale)
  function gpuEnd(c) { if (!GQ) return; const F = GF; GQ = null; GF = null; try { F.flush(c); } catch (e) {} }
  // a ribbon of fire through screen points (head last), w its width at full, taper(u) along it: a glow, a laid-over body,
  // turbulent fire in overlapping stretches, bands of light hotter to a white-hot core, balls of flame along it
  function gpuRibbon(pts, w, a, taper, seed) { const n = pts.length; if (n < 2 || w < 0.5 || !(a > 0.01)) return; const tp = u => (taper ? taper(u) : 1);
    for (let i = 0; i < n; i += 2) GQ.glow(pts[i][0], pts[i][1], w * 1.9 * tp(i / (n - 1)), P.org, 0.3 * a);
    for (let i = 1; i < n; i++) { const u = (i - 0.5) / (n - 1), ww = w * tp(u), p0 = pts[i - 1], p1 = pts[i], dx = p1[0] - p0[0], dy = p1[1] - p0[1], x0 = p0[0] - dx * 0.125, y0 = p0[1] - dy * 0.125, x1 = p1[0] + dx * 0.125, y1 = p1[1] + dy * 0.125;
      if (ww < 0.3) continue; GQ.beam(x0, y0, x1, y1, ww * 0.55, P.red, 0.7 * a); GQ.beam(x0, y0, x1, y1, ww * 0.34, P.org, 0.85 * a); GQ.beam(x0, y0, x1, y1, ww * 0.17, P.yel, 0.9 * a); GQ.beam(x0, y0, x1, y1, ww * 0.06, '#FFFFFF', a); }
    for (let i = 1; i < n; i += 2) { const u = i / (n - 1), r = w * 0.5 * tp(u); if (r > 1) GQ.fire(pts[i][0], pts[i][1], r, 0.85 + 0.2 * u, 0.75 * a, (seed || 0) + i * 0.7); } }
  function glow(c, x, y, r, col, a) { if (GQ) { if (r >= 1 && a > 0.01) { const p = gpuXY(c, x, y); GQ.glow(p[0], p[1], r * 1.1 * p[3], col || P.org, Math.min(1, a * 1.3)); } return; } if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col || P.org), x - r, y - r, r * 2, r * 2); c.restore(); }
  /* light thrown on the floor: a squashed additive pool */
  function floorLight(c, X, Y, r, a, col) { if (GQ) { if (r >= 1 && a > 0.01) GQ.glow(X, Y, r * 1.1, col || P.org, Math.min(1, a * 1.3), H.GY); return; } if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col || P.org), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  /* the outline of a flame tongue standing at (x, y), w wide, h tall, its tip at (tx, ty) */
  function tonguePath(c, x, y, w, h, tx, ty, wb) { c.beginPath(); c.moveTo(x - w / 2, y); c.bezierCurveTo(x - w * 0.62 + wb, y - h * 0.38, tx - w * 0.3, y - h * 0.74, tx, ty); c.bezierCurveTo(tx + w * 0.26, y - h * 0.7, x + w * 0.6 - wb, y - h * 0.4, x + w / 2, y); c.quadraticCurveTo(x, y + w * 0.22, x - w / 2, y); c.closePath(); }
  /* one volumetric flame: hot root, orange body, red tips fading to smoke, a darker right flank, a white core, a glow */
  function flame(c, x, y, w, h, t, seed, lean, a, solo) {
    if (h < 2 || w < 1) return; a = a == null ? 1 : a; if (a <= 0.01) return; lean = lean || 0; const s = seed || 0;
    if (GQ) { const tr = c.getTransform(), ox = tr.e, oy = tr.f, X0 = x, Y0 = y;   // (under the caller's own translate/rotate: the painter takes the screen frame)
      const rot = Math.atan2(lean, h), W2 = w * (solo ? 0.62 : 0.68), H2 = h * 0.58;
      const [sx, sy, sr] = gpuXY(c, X0, Y0); GQ.glow(sx, sy - Math.cos(sr) * h * 0.35, w * 1.25, P.org, 0.32 * a); GQ.tongue(sx, sy, W2, H2, rot + sr, 0.95, a, s);
      if (!solo && h > 12) { GQ.tongue(sx - Math.cos(sr) * w * 0.28, sy - Math.sin(sr) * w * 0.28, W2 * 0.6, H2 * 0.62, rot + sr - 0.18, 0.88, 0.75 * a, s + 3.1); GQ.tongue(sx + Math.cos(sr) * w * 0.3, sy + Math.sin(sr) * w * 0.3, W2 * 0.55, H2 * 0.56, rot + sr + 0.2, 0.88, 0.7 * a, s + 5.3); }
      return; }
    // a big flame is a crown of tongues: two lesser ones behind it, flickering on their own
    if (!solo && w > 14) for (const sd of [-1, 1]) flame(c, x + sd * w * 0.24, y - w * 0.04, w * 0.62, h * (0.55 + 0.12 * Math.sin(t * 6 + s + sd)), t, s + sd * 3.7, lean * 0.6 + sd * w * 0.3, a * 0.95, true);
    const wb = Math.sin(t * 13 + s) * w * 0.16, flick = 0.88 + 0.12 * Math.sin(t * 17 + s * 2.1) + 0.06 * Math.sin(t * 29 + s), hh = h * flick;
    const tx = x + lean + Math.sin(t * 9 + s * 1.3) * w * 0.22, ty = y - hh;
    glow(c, x + lean * 0.3, y - hh * 0.35, Math.max(w, hh * 0.55) * 1.15, P.org, 0.55 * a);
    c.save(); c.globalAlpha = a;
    const gb = c.createLinearGradient(0, y + w * 0.2, 0, ty); gb.addColorStop(0, P.amb); gb.addColorStop(0.3, P.org); gb.addColorStop(0.72, P.red); gb.addColorStop(1, rgba(P.dred, 0.15));
    tonguePath(c, x, y, w, hh, tx, ty, wb); c.fillStyle = gb; c.fill();
    // volume: the right flank in shadow, the left catching the light
    c.save(); c.clip(); const gs = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gs.addColorStop(0, rgba(P.yel, 0.35)); gs.addColorStop(0.45, rgba(P.yel, 0)); gs.addColorStop(0.7, rgba(P.dred, 0)); gs.addColorStop(1, rgba(P.dred, 0.5)); c.fillStyle = gs; c.fillRect(x - w, ty - 2, w * 2 + Math.abs(lean) * 2, hh + w);
    // licks of brighter flame climbing inside
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.yel, 0.35); c.lineWidth = Math.max(1, w * 0.08); c.lineCap = 'round'; for (let i = 0; i < 2; i++) { const ph = (t * 1.6 + i * 0.5 + s * 0.13) % 1, yy = y - hh * ph, xx = x + (tx - x) * ph + Math.sin(t * 7 + i * 3 + s) * w * 0.15; c.beginPath(); c.moveTo(xx, yy + hh * 0.1); c.quadraticCurveTo(xx + w * 0.12, yy, xx, yy - hh * 0.12); c.stroke(); }
    c.restore();
    c.strokeStyle = rgba(P.dred, 0.45); c.lineWidth = Math.max(0.8, w * 0.035); tonguePath(c, x, y, w, hh, tx, ty, wb); c.stroke();
    // the white-hot inner core
    c.globalCompositeOperation = 'lighter'; const cw = w * 0.52, ch = hh * 0.5, ctx = x + (tx - x) * 0.45, cty = y - ch; const gc = c.createLinearGradient(0, y, 0, cty); gc.addColorStop(0, P.wht); gc.addColorStop(0.5, rgba(P.yel, 0.85)); gc.addColorStop(1, rgba(P.amb, 0));
    tonguePath(c, x, y - w * 0.04, cw, ch, ctx, cty, wb * 0.5); c.fillStyle = gc; c.fill();
    c.restore();
  }
  /* a flame pointing along a screen angle from (x, y) */
  function flameAt(c, x, y, ang, w, h, t, seed, a) { c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); flame(c, 0, 0, w, h, t, seed, Math.sin(t * 8 + (seed || 0)) * w * 0.18, a); c.restore(); }
  /* a ball of fire: a shaded sphere of flame (lit upper left), a turbulent rim of short tongues, a white-hot heart */
  function fireball(c, x, y, r, t, seed, a, tail) {
    if (r < 1) return; a = a == null ? 1 : a; const s = seed || 0;
    if (GQ) { if (a <= 0.01) return; const [X, Y] = gpuXY(c, x, y); GQ.glow(X, Y, r * 2.6, P.org, 0.5 * a); GQ.billow(X, Y, r * 1.05, 0.75, a, s); GQ.quad(3, X, Y, r, 0, 0, r, '#FFFFFF', 0.8 * a, 1.0, s + 1); GQ.quad(13, X, Y, r * 1.7, 0, 0, r * 1.7, P.org, 0.85 * a, 1.0, s + 2, 0.25); GQ.glow(X - r * 0.1, Y - r * 0.12, r * 0.5, '#FFFFFF', 0.55 * a); return; } glow(c, x, y, r * 3, P.org, 0.6 * a); glow(c, x, y, r * 1.6, P.yel, 0.35 * a);
    c.save(); c.globalAlpha = a; const n = r > 10 ? 9 : 6;
    for (let i = 0; i < n; i++) { const b = i / n * TAU + t * 2.2 + s, up = -Math.PI / 2, bb = b + Math.sin(t * 5 + i) * 0.2, toward = tail != null ? tail : up, d = Math.cos(bb - toward), len = r * (0.75 + 1.1 * Math.max(0, d)) * (0.8 + 0.2 * Math.sin(t * 14 + i * 2.7 + s)); flameAt(c, x + Math.cos(bb) * r * 0.78, y + Math.sin(bb) * r * 0.78, bb * 0.35 + toward * 0.65, r * 0.7, len, t, i * 1.7 + s, 0.95); }
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r); g.addColorStop(0, P.wht); g.addColorStop(0.3, P.yel); g.addColorStop(0.62, P.org); g.addColorStop(0.88, P.red); g.addColorStop(1, rgba(P.dred, 0.9));
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = g; c.fill();
    c.save(); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.yel, 0.45); c.lineWidth = Math.max(1, r * 0.12); c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const b = t * (3 + i) + i * 2.1 + s; c.beginPath(); c.arc(x + Math.cos(b) * r * 0.2, y + Math.sin(b) * r * 0.2, r * (0.45 + i * 0.16), b, b + 1.4); c.stroke(); } c.restore();
    c.strokeStyle = rgba(P.dred, 0.55); c.lineWidth = Math.max(0.8, r * 0.06); c.beginPath(); c.arc(x, y, r, 0.2, 1.9); c.stroke();
    H.core(c, x - r * 0.12, y - r * 0.15, r * 0.5, P.yel, '#FFFFFF', 0.9 * a); c.restore();
  }
  /* a ribbon of flame along a polyline (screen points): layered bands from dark red to white, tongues licking up off it, glow along it */
  function ribbon(c, pts, w, t, a, taper, seed) {
    if (pts.length < 2 || w < 0.5) return; a = a == null ? 1 : a; const s = seed || 0; if (GQ) { gpuRibbon(pts, w, a, taper, s); return; } c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < pts.length; i += 3) glow(c, pts[i][0], pts[i][1], w * 1.8, P.org, 0.35 * a);
    c.globalAlpha = a; H.ribbon(c, pts, w * 1.15, rgba(P.dred, 0.8), null, taper); H.ribbon(c, pts, w * 0.92, P.red, null, taper); H.ribbon(c, pts, w * 0.68, P.org, null, taper);
    c.globalCompositeOperation = 'lighter'; H.ribbon(c, pts, w * 0.4, rgba(P.yel, 0.9), null, taper); H.ribbon(c, pts, w * 0.14, P.wht, null, taper); c.globalCompositeOperation = 'source-over';
    for (let i = 1; i < pts.length; i += Math.max(1, Math.round(pts.length / 7))) { const u = i / (pts.length - 1), k = taper ? taper(u) : 1; if (k < 0.25) continue; flame(c, pts[i][0], pts[i][1] + w * 0.2 * k, w * 0.95 * k, w * (1.5 + 0.7 * Math.sin(t * 9 + i * 1.7 + s)) * k, t, i * 1.3 + s, Math.sin(t * 5 + i) * w * 0.2, 0.85 * a); }
    c.restore();
  }
  /* a ring of flames standing on a floor ellipse round (X, Y), screen radius r; the back ones drawn first, kept clear of the middle */
  function flameRing(c, X, Y, r, n, h, t, a, spin) { const L = []; for (let i = 0; i < n; i++) { const b = i / n * TAU + (spin == null ? t * 0.6 : spin); L.push([Math.sin(b), b, i]); } L.sort((p, q) => p[0] - q[0]); for (const [, b, i] of L) { const dep = 0.75 + 0.25 * Math.sin(b); flame(c, X + Math.cos(b) * r, Y + Math.sin(b) * r * H.GY, h * 0.5, h * dep * (0.85 + 0.15 * Math.sin(t * 7 + i * 1.9)), t, i * 1.3, Math.cos(b) * h * 0.15, a); } }
  /* a scorched mark: charred centre, a glowing rim of embers fading with heat, light on the floor */
  function scorch(c, X, Y, r, a, heat, seed) {
    // (no dark residue: reads on light and dark floors alike) a faint warm additive tint, glowing embers and cracks, all fading with heat
    if (r < 1 || !(a > 0.01) || !(heat > 0.02)) return; const s = seed || 0, hk = Math.min(1, heat) * a; c.save(); c.globalCompositeOperation = 'lighter';
    floorLight(c, X, Y, r * 1.2, 0.32 * hk, P.org);
    c.strokeStyle = rgba(P.org, 0.6 * hk); c.lineWidth = Math.max(1, r * 0.04); c.lineCap = 'round'; c.beginPath(); for (let i = 0; i < 5; i++) { const b = i * 1.26 + s; c.moveTo(X + Math.cos(b) * r * 0.15, Y + Math.sin(b) * r * 0.15 * H.GY); c.lineTo(X + Math.cos(b + 0.3) * r * 0.55, Y + Math.sin(b + 0.3) * r * 0.55 * H.GY); c.lineTo(X + Math.cos(b + 0.1) * r * 0.85, Y + Math.sin(b + 0.1) * r * 0.85 * H.GY); } c.stroke();
    c.strokeStyle = rgba(P.yel, 0.55 * hk); c.lineWidth = Math.max(0.8, r * 0.015); c.stroke();
    for (let i = 0; i < 9; i++) { const b = i * 2.39 + s, rr = r * (0.35 + 0.5 * ((i * 0.37 + s * 0.1) % 1)), px = X + Math.cos(b) * rr, py = Y + Math.sin(b) * rr * H.GY; c.fillStyle = rgba(i % 2 ? P.org : P.yel, 0.85 * hk); c.beginPath(); c.ellipse(px, py, 1.5 + heat * 1.5, 1 + heat, 0, 0, TAU); c.fill(); }
    c.restore();
    if (GQ && GO && GO.ground) { const p = gpuXY(c, X, Y); GQ.ground(p[0], p[1], r * 0.95 * p[3], 0.55 + 0.4 * Math.min(1, heat), 0.85 * hk, s, H.GY, 0.85); }   // (v348: the ground itself burning)
  }
  /* a shock ring on the floor: a wide soft orange band and a thin white-hot leading edge */
  function shockRing(c, X, Y, r, a) { if (r < 1 || !(a > 0.01)) return; if (GQ) { GQ.ring(X, Y, r * 0.93, P.org, 0.85 * a, Math.max(2, r * 0.2), H.GY); GQ.ring(X, Y, r, P.yel, a, Math.max(1.5, r * 0.05), H.GY); GQ.ring(X, Y, r * 1.01, '#FFFFFF', 0.6 * a, Math.max(1, r * 0.015), H.GY); GQ.shimmer(X, Y, r * 1.05, 0.35 * a, H.GY); return; } c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.strokeStyle = rgba(P.org, 0.45); c.lineWidth = Math.max(2, r * 0.18); H.floorEllipse(c, X, Y, r * 0.93); c.stroke(); c.strokeStyle = rgba(P.yel, 0.8); c.lineWidth = Math.max(1.5, r * 0.05); H.floorEllipse(c, X, Y, r); c.stroke(); c.strokeStyle = rgba(P.wht, 0.9); c.lineWidth = 1; H.floorEllipse(c, X, Y, r * 1.01); c.stroke(); c.restore(); }
  /* particles (world units): rising embers, falling sparks, smoke, char flakes */
  const embers = (x, y, k, o) => H.burst(x, y, 'ember', k, Object.assign({ v: 2.5, up: 2.5, g: -1.5, life: 0.8, size: 3.5, color: [P.org, P.yel, P.gold, P.amb] }, o || {}));
  const sparks = (x, y, k, v, o) => H.burst(x, y, 'spark', k, Object.assign({ v: v || 6, up: 2, g: 8, life: 0.45, size: 2, color: [P.yel, P.wht, P.org] }, o || {}));
  const flakes = (x, y, k) => H.burst(x, y, 'shard', k, { v: 4, up: 3, g: 10, life: 0.6, size: 3, color: [P.char, P.crust, P.gold] });
  const smoke = (x, y, k, r) => { for (let i = 0; i < H.n(k); i++) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: x + Math.cos(b) * (r || 0.4), y: y + Math.sin(b) * (r || 0.4) * 0.6, vx: Math.cos(b) * 0.8, vy: -1.2 - Math.random() * 0.8, life: 1.0, max: 1.0, size: 0.5, color: 'rgba(58,38,34,' }); } };
  /* the living air round a burning thing: call from update(dt) with a rate per second; embers drift up, the odd spark */
  function aura(x, y, r, dt, rate, z) { const k = (rate || 12) * dt * H.Q(); let m = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (m-- > 0) { const b = Math.random() * TAU, rr = Math.sqrt(Math.random()) * (r || 0.6); H.P({ kind: 'ember', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * 0.6 - (z || 0), vx: (Math.random() - 0.5) * 0.8, vy: -1.2 - Math.random() * 1.6, g: -0.8, drag: 0.6, life: 0.55 + Math.random() * 0.5, max: 1.05, size: 2.2 + Math.random() * 2, color: Math.random() < 0.45 ? P.yel : Math.random() < 0.5 ? P.org : P.gold }); if (Math.random() < 0.12) H.P({ kind: 'spark', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * 0.6 - (z || 0), vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 3, g: 7, life: 0.4, max: 0.4, size: 1.6, color: P.wht }); } }
  /* a hit's flare: light, embers, sparks, a little smoke */
  function ignite(x, y, r) { H.X.light(x, y, r * 1.6, 0.25); embers(x, y, 8); sparks(x, y, 6); H.glowAt(x, y, r * 0.8, 0.3, P.org, 0.7); }
  /* an explosion of fire scaled by k */
  function blast(x, y, r, k) { k = k || 1; H.X.boom(x, y, r, P.org, P.yel, { n: Math.round(22 * k), shake: Math.min(16, 4 + r * 2 * k), smoke: Math.round(3 * k) }); H.X.flash(0.07 * k, '#FFB066'); ignite(x, y, r); smoke(x, y, 4 * k, r * 0.4); flakes(x, y, Math.round(5 * k)); if (k >= 1.5) H.X.hitstop(0.04); }
  const evo = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const evoN = (C, a, b) => Math.round(a + (b - a) * (evo(C) - 1) / 6);
  const evoK = C => 1 + 0.08 * (evo(C) - 1);
  const K = { gpuBegin, gpuEnd, gq: () => GQ, gpuRibbon: (pts, w, a, taper, seed) => GQ && gpuRibbon(pts, w, a, taper, seed), gpuXY, P, TAU, glow, floorLight, flame, flameAt, fireball, ribbon, flameRing, scorch, shockRing, embers, sparks, flakes, smoke, aura, ignite, blast, evo, evoN, evoK };
  return { bind: h => { H = h; return K; }, P };
})();
