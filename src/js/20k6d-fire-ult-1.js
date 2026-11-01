/* ---------- Fire, reworked: Ultimates F-U01..F-U05 (armageddon, embers, crucible, dragonkiln, crimsonlotus) ----------
   The showpieces. Every flame is FK's shaded volume; every molten or solid thing (a bowl plate, a kiln brick, a lotus
   petal, a lantern cap) has a four-tone ramp, a dark crust, glowing seams, a rim of firelight and an outline; every
   burning thing lights the floor and sheds embers; every hit scorches the ground. Things over the aim fade where they
   would pass in front of the pet (petGuard), and the beams of Armageddon lean aside round the pet. */
(() => {
  const S = ELEM_IMPL.fire.strong, U = ELEM_IMPL.fire.ult;   // (S unused here: Strongs are other workers')
  const TAU = Math.PI * 2, P = FK.P, HOT = '#CFEFFF';
  let H, K;
  const cl = u => Math.max(0, Math.min(1, u));
  const rnd = k => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const lerp = (a, b, u) => a + (b - a) * u;
  /* a burning thing cuts its light into the dungeon's dark: a short light renewed every tenth of a second while it burns */
  function lit(f, key, x, y, r, dt) { const L = f._lt || (f._lt = {}); L[key] = (L[key] || 0) - dt; if (L[key] <= 0) { H.X.light(x, y, r, 0.26); L[key] = 0.1; } }

  /* how much a tall thing at screen (X0, Y0) may show: it thins to a ghost where it would stand in front of the pet */
  function petGuard(X0, Y0, T, rad) { const mx = H.sx(H.me.x), my = H.sy(H.me.y) - T * 0.45, d = Math.hypot(X0 - mx, (Y0 - my) * 1.15) - (rad || 0); return Math.max(0.28, cl((d - T * 0.6) / (T * 0.8))); }
  /* a single (crownless) shaded flame pointing along a screen angle */
  function sflame(c, x, y, ang, w, h, t, seed, a) { if (h < 2 || w < 1 || !(a > 0.01)) return; c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); K.flame(c, 0, 0, w, h, t, seed, Math.sin(t * 8 + seed) * w * 0.15, a, true); c.restore(); }
  /* a stream of fire along a polyline: banded dark red to white-hot, a glow along it (no tongues: cheap) */
  function stream(c, pts, w, a, taper) {
    if (pts.length < 2 || w < 0.5 || !(a > 0.01)) return; c.save(); c.globalAlpha = Math.min(1, a); c.lineCap = 'round'; c.lineJoin = 'round';
    H.ribbon(c, pts, w * 1.2, P.dred, null, taper); H.ribbon(c, pts, w * 0.95, P.red, null, taper); H.ribbon(c, pts, w * 0.7, P.org, null, taper);
    c.globalCompositeOperation = 'lighter'; H.ribbon(c, pts, w * 0.42, H.rgba(P.yel, 0.85), null, taper); H.ribbon(c, pts, w * 0.15, P.wht, null, taper); c.restore();
    for (let i = 0; i < pts.length; i += 3) K.glow(c, pts[i][0], pts[i][1], w * 1.7 * (taper ? taper(i / (pts.length - 1)) : 1), P.org, 0.3 * a);
  }
  /* a molten/charred solid: a four-tone ramp lit from the upper left, a dark crust cracked by glowing seams, heat welling
     at its foot, a rim of firelight, a bright lit edge and the outline. o.inner: the face that looks into the fire (hot) */
  function crust(c, pts, heat, t, seed, o) {
    o = o || {}; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const w = x1 - x0, h = y1 - y0; if (w < 1 && h < 1) return; const s = seed || 0, g = c.createLinearGradient(x0, y0, x0 + w * 0.85, y1);
    if (o.inner) { g.addColorStop(0, P.wht); g.addColorStop(0.25, P.yel); g.addColorStop(0.6, P.org); g.addColorStop(1, P.red); }
    else { g.addColorStop(0, o.lit || '#B8744C'); g.addColorStop(0.3, P.crustL); g.addColorStop(0.65, P.crust); g.addColorStop(1, '#2A120A'); }
    H.poly(c, pts); c.fillStyle = g; c.fill();
    const fl = heat * (0.78 + 0.22 * Math.sin(t * 9 + s * 1.7)), lw = Math.max(1, Math.min(w, h) * 0.07);
    c.save(); H.poly(c, pts); c.clip(); c.lineCap = 'round'; c.lineJoin = 'round';
    const seams = []; for (let i = 0; i < (o.seams || 2); i++) { const sp = []; let u = 0.22 + 0.56 * rnd(s + i * 3.1); for (let j = 0; j <= 4; j++) { sp.push([x0 + w * u, y0 + h * (0.06 + j * 0.23)]); u = cl(u + (rnd(s * 1.3 + i * 5.7 + j * 2.3) - 0.5) * 0.36); } seams.push(sp); }
    c.strokeStyle = H.rgba(o.inner ? P.dred : P.char, o.inner ? 0.55 : 0.85); c.lineWidth = lw * 1.9; for (const sp of seams) { H.poly(c, sp, false); c.stroke(); }
    c.globalCompositeOperation = 'lighter';
    if (fl > 0.02) { c.strokeStyle = H.rgba(P.org, fl); c.lineWidth = lw * 1.1; for (const sp of seams) { H.poly(c, sp, false); c.stroke(); } c.strokeStyle = H.rgba(P.yel, fl * 0.9); c.lineWidth = lw * 0.45; for (const sp of seams) { H.poly(c, sp, false); c.stroke(); }
      K.glow(c, x0 + w * 0.55, y1, Math.max(w, h) * 0.6, P.org, 0.42 * fl); c.strokeStyle = H.rgba(P.org, 0.5 * fl); c.lineWidth = lw * 2.4; H.poly(c, pts); c.stroke(); }
    c.restore();
    c.strokeStyle = H.rgba(o.inner ? P.wht : P.gold, 0.55); c.lineWidth = Math.max(1, lw * 0.8); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.stroke();
    H.poly(c, pts); c.strokeStyle = H.line(); c.lineWidth = 1.5; c.stroke();
  }
  /* heat shimmer: faint rising wavy lines, additive */
  function shimmer(c, X, Y, r, h, t, a) { if (!(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 * a; c.strokeStyle = P.wht; c.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const ox = (i - 1.5) * r * 0.4, ph = t * 5 + i * 2; c.beginPath(); for (let j = 0; j <= 6; j++) { const u = j / 6, px = X + ox + Math.sin(ph + u * 7) * r * 0.1, py = Y - u * h - ((t * 0.6 + i * 0.3) % 1) * h * 0.2; j ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); } c.restore(); }
  /* a ring of single flames on a floor ellipse round (X, Y): back ones first */
  function fring(c, X, Y, r, n, h, t, a, spin, lean) { const L = []; for (let i = 0; i < n; i++) { const b = i / n * TAU + (spin || 0); L.push([Math.sin(b), b, i]); } L.sort((p, q) => p[0] - q[0]); for (const [, b, i] of L) { const dep = 0.78 + 0.22 * Math.sin(b), hh = h * dep * (0.82 + 0.18 * Math.sin(t * 7 + i * 1.9)); K.flame(c, X + Math.cos(b) * r, Y + Math.sin(b) * r * H.GY, hh * 0.5, hh, t, i * 1.3, Math.cos(b) * hh * (lean || 0.15), a, true); } }
  /* a firework burst at screen (X, Y): drooping radial streaks of sparks with bright heads, u 0..1 */
  function firework(c, X, Y, r, u, n, t, a, seed) { if (u <= 0 || u >= 1) return; const e = H.ease.out(u), k = (1 - u) * a; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 0; i < n; i++) { const b = i / n * TAU + seed, rr = r * e * (0.85 + 0.15 * rnd(i + seed)), dx = Math.cos(b), dy = Math.sin(b), dr = u * u * r * 0.35, hx = X + dx * rr, hy = Y + dy * rr * 0.8 + dr, tx = X + dx * rr * 0.55, ty = Y + dy * rr * 0.44 + dr * 0.5;
      c.strokeStyle = H.rgba(i % 3 ? P.org : P.gold, 0.7 * k); c.lineWidth = 2.5; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + hx) / 2, (ty + hy) / 2 - r * 0.05, hx, hy); c.stroke(); c.fillStyle = H.rgba(i % 2 ? P.wht : P.yel, k); c.beginPath(); c.arc(hx, hy, 2.2 + 1.5 * (1 - u), 0, TAU); c.fill(); }
    c.restore(); K.glow(c, X, Y, r * (0.6 + e * 0.6), P.org, 0.6 * k); K.glow(c, X, Y, r * 0.4, P.yel, 0.7 * k * (1 - u)); }

  /* ================= F-U01 Armageddon (Super Armageddon at Celestial) ================= */
  // (Phoenix of the Turning Sky was retired: the old file still registers it, so drop it here)
  delete ELEM_IMPL.fire.ult.turningsky;
  /* Built on Catastrophe (ice F-U08): the same beams, steering, timing, layering and phone budget, re-skinned in fire.
     Everything heavy is a cached picture painted a few a tick from the cast: the beam column with its spiralling flame
     ribbons (32 turning frames), the swirl (24 frames), the burning ring under each beam, the flame tongues (4 leans x 8
     flicker frames, played back and forth), the ember dots and the glowing cracks; per frame it is only blits. */
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  /* a clip that keeps everything after it off the pet's body */
  function petHole(c, T) { const me = H.me, x = H.sx(me.x), y = H.sy(me.y) - T * 0.46; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd'); }
  /* the visible screen in the current drawing coordinates */
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }
  const vfade = (g, w, h) => { g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.15, 'rgba(0,0,0,0.25)'); gv.addColorStop(0.4, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); };
  /* a column of firelight: red edges, orange, amber, a white-yellow core; fading in over its top */
  const aCol = () => fxSprite('fu1col', 64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0);
    [[0, 'rgba(122,30,14,0)'], [0.17, 'rgba(210,64,26,0.26)'], [0.32, 'rgba(255,122,46,0.6)'], [0.4, 'rgba(255,166,64,0.9)'], [0.46, 'rgba(255,216,102,1)'], [0.5, 'rgba(255,250,225,1)'], [0.54, 'rgba(255,216,102,1)'], [0.6, 'rgba(255,166,64,0.9)'], [0.68, 'rgba(255,122,46,0.6)'], [0.83, 'rgba(210,64,26,0.26)'], [1, 'rgba(122,30,14,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, w, h); vfade(g, w, h); });
  /* the outer fire of a beam: deep red to orange, no core */
  const aColB = () => fxSprite('fu1colB', 64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0);
    [[0, 'rgba(122,30,14,0)'], [0.2, 'rgba(150,36,16,0.34)'], [0.36, 'rgba(210,64,26,0.62)'], [0.5, 'rgba(255,122,46,0.88)'], [0.64, 'rgba(210,64,26,0.62)'], [0.8, 'rgba(150,36,16,0.34)'], [1, 'rgba(122,30,14,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, w, h); vfade(g, w, h); });
  /* a swirl of fire seen from above: three spiral arms, orange with white-hot threads */
  const aSwirl = () => fxSprite('fu1swirl', 192, 192, (g, w) => { const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) for (const [col, lw] of [['rgba(210,64,26,0.42)', 13], ['rgba(255,140,50,0.66)', 6.5], ['rgba(255,236,170,0.9)', 2.2]]) { g.strokeStyle = col; g.beginPath();
      for (let i = 0; i <= 40; i++) { const u = i / 40, r = c0 * 0.95 * u, b = arm * TAU / 3 + u * 4.2; g.lineWidth = lw * (0.3 + 0.7 * Math.sin(u * Math.PI)); if (i) g.lineTo(Math.cos(b) * r, Math.sin(b) * r); else g.moveTo(0, 0); } g.stroke(); }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, c0); gr.addColorStop(0, 'rgba(255,240,200,0.7)'); gr.addColorStop(0.3, 'rgba(255,122,46,0.26)'); gr.addColorStop(1, 'rgba(255,122,46,0)'); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w); });
  const NSFa = 24, aSwirlF = i => fxSprite('fu1sw|' + i, 160, 160, (g, W) => { g.translate(W / 2, W / 2); g.rotate(i / NSFa * TAU / 3); g.drawImage(aSwirl(), -W / 2, -W / 2, W, W); });
  const aSwirlAt = ang => aSwirlF(((Math.round(ang / (TAU / 3) * NSFa) % NSFa) + NSFa) % NSFa);
  /* an ember: a hot dot with a soft glow (0 white-gold, 1 orange-red) */
  const aEmber = v => fxSprite('fu1em' + v, 24, 24, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    if (v) { gr.addColorStop(0, 'rgba(255,220,150,0.95)'); gr.addColorStop(0.3, 'rgba(255,122,46,0.55)'); gr.addColorStop(1, 'rgba(210,64,26,0)'); } else { gr.addColorStop(0, 'rgba(255,252,230,1)'); gr.addColorStop(0.25, 'rgba(255,200,90,0.75)'); gr.addColorStop(1, 'rgba(255,110,40,0)'); } g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  /* a beam column at one turn of its fire: the outer fire, the white-hot core, two flame ribbons spiralling round it
     (back halves deep red, front halves orange with a white-yellow thread) and little curls of flame flicking off them */
  const NBFa = 32;
  function aBeam(fi, kq, bq) { return fxSprite('fu1bf|' + fi + '|' + kq + '|' + bq, 72, 384, (g, W, Hh) => {
    const w = W / 1.1, cx = W / 2, BRb = bq / 100, ph = fi / NBFa * TAU; g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.85 * (0.5 + 0.5 * kq / 100); g.drawImage(aColB(), 0, 0, W, Hh); g.globalAlpha = 0.8; g.drawImage(aCol(), cx - w * 0.17, 0, w * 0.34, Hh);
    g.lineCap = 'round'; const k = w / (1.4 * BRb);
    for (let sd = 0; sd < 2; sd++) { const N = 40, back = [], front = []; for (let j = 0; j <= N; j++) { const u = j / N, q = u * 6 + ph + sd * Math.PI; (Math.cos(q) > 0 ? front : back).push([cx + Math.sin(q) * w * 0.5 * (0.6 + 0.4 * u), u * Hh, j, q]); }
      // each segment's width thins to nothing where the ribbon turns behind the core (no blunt ends); a wide faint pass feathers the sides
      const tp = q => { const u = Math.min(1, Math.abs(Math.cos(q)) / 0.7); return u * u * (3 - 2 * u); };
      const run = (pts, col, lw, al) => { g.strokeStyle = col; for (let i = 1; i < pts.length; i++) { const p0 = pts[i - 1], p1 = pts[i]; if (p1[2] !== p0[2] + 1) continue; const k2 = tp((p0[3] + p1[3]) / 2); if (k2 < 0.03) continue; g.globalAlpha = al * k2; g.lineWidth = Math.max(0.3, lw * k2); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); } };
      run(back, 'rgba(210,64,26,0.85)', k * 0.12, 0.12); run(back, 'rgba(210,64,26,0.85)', k * 0.05, 0.3);
      run(front, 'rgba(255,100,36,0.9)', k * 0.26, 0.12); run(front, 'rgba(255,100,36,0.9)', k * 0.14, 0.3); run(front, 'rgba(255,190,80,0.95)', k * 0.06, 0.5); run(front, 'rgba(255,250,225,1)', k * 0.018, 0.55);
      // curls of flame flicking up and out off the front ribbon (pointing skyward: the sprite's top is the sky)
      for (let j = 3; j < front.length; j += 4) { const p = front[j], dir = Math.sin(p[3]) >= 0 ? 1 : -1, L = k * 0.32 * (0.7 + 0.3 * R1(j + sd * 7)), x0 = p[0], y0 = p[1];
        // a tapered curl: segments thinning and fading to a hair at the tip, with a faint wide halo
        const cx1 = x0 + dir * L * 0.55, cy1 = y0 - L * 0.25, ex = x0 + dir * L * 0.35, ey = y0 - L * 0.9, NQ = 10; let px = x0, py = y0;
        for (let q2 = 1; q2 <= NQ; q2++) { const u = q2 / NQ, m1 = 1 - u, nx = m1 * m1 * x0 + 2 * m1 * u * cx1 + u * u * ex, ny = m1 * m1 * y0 + 2 * m1 * u * cy1 + u * u * ey, f2 = Math.pow(1 - (u - 0.5 / NQ), 1.4);
          g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.globalAlpha = 0.18 * f2; g.strokeStyle = 'rgba(255,120,40,1)'; g.lineWidth = k * 0.09 * f2 + 0.3; g.stroke(); g.globalAlpha = 0.6 * f2; g.strokeStyle = 'rgba(255,200,110,1)'; g.lineWidth = k * 0.025 * f2 + 0.2; g.stroke(); px = nx; py = ny; } } }
    // feather the foot: everything fades out smoothly over the last stretch, so the beam melts into its floor glow
    g.globalCompositeOperation = 'destination-in'; g.globalAlpha = 1; const fg = g.createLinearGradient(0, 0, 0, Hh); fg.addColorStop(0, 'rgba(0,0,0,1)'); fg.addColorStop(0.8, 'rgba(0,0,0,1)'); fg.addColorStop(0.88, 'rgba(0,0,0,0.72)'); fg.addColorStop(0.95, 'rgba(0,0,0,0.25)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = fg; g.fillRect(0, 0, W, Hh); }); }
  /* the floor under a beam, in the floor's own plane (squashed when drawn): a pool of firelight, a white-hot splash where
     the beam meets the floor, hot spots, and a burning ring (all light: no dark mark) */
  function aFoot(kq, bq) { return fxSprite('fu1fa|' + kq + '|' + bq, 256, 256, (g, W) => {
    const R0 = W / 2 / 2.1, c0 = W / 2, kN = kq / 100, BRb = bq / 100; g.globalCompositeOperation = 'lighter'; g.translate(c0, c0);
    const gl = (col, r, a, x, y) => { g.globalAlpha = a; g.drawImage(glowSprite(col), (x || 0) - r, (y || 0) - r, r * 2, r * 2); };
    gl(P.red, R0 * 2.05, 0.45 * kN); gl(P.org, R0 * 1.43, 0.4 * kN);
    gl(P.amb, R0 * 1.5 / Math.sqrt(H.GY), 0.3 * kN); gl(P.wht, R0 * 0.6 / Math.sqrt(H.GY), 0.45);
    for (let i = 0; i < 6; i++) { const b = i / 6 * TAU, r = R0 * 1.3; gl(P.gold, r * 0.55, 0.12 * kN * 1.4, Math.cos(b) * r * 0.8, Math.sin(b) * r * 0.8); }
    const rw = Math.max(2 / 40, 0.06 / BRb) * R0; g.lineCap = 'round';
    for (const [col, lw, al] of [['rgba(210,64,26,0.9)', rw * 2.2, 0.35], ['rgba(255,122,46,0.95)', rw * 1.1, 0.6], ['rgba(255,216,102,1)', Math.max(1, rw * 0.45), 0.7], ['rgba(255,250,225,1)', Math.max(1, rw * 0.18), 0.6]]) { g.globalAlpha = al; g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(0, 0, R0 * 0.95, 0, TAU); g.stroke(); } }); }
  /* glowing cracks across the floor round the aim, in the floor's plane: light only (no char) */
  function aVein(rq, ev) { return fxSprite('fu1vein|' + rq + '|' + ev, Math.ceil(rq * 2.4), Math.ceil(rq * 2.4 * H.GY), (g, W, Hh) => {
    g.translate(W / 2, Hh / 2); g.scale(1, H.GY); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round'; const n = 8 + ev, paths = [];
    for (let i = 0; i < n; i++) { let b = i / n * TAU + R1(i * 3.3) * 0.5, r = rq * 0.18; const p = [[Math.cos(b) * r, Math.sin(b) * r]], R = rq * (0.55 + 0.4 * R1(i * 7.7)); while (r < R) { r += rq * 0.12; b += (R1(i * 11 + r) - 0.5) * 0.9; p.push([Math.cos(b) * r, Math.sin(b) * r]); } paths.push(p);
      if (R1(i * 5.1) < 0.6) { const q = p[Math.floor(p.length / 2)], fb = b + (R1(i) < 0.5 ? 0.6 : -0.6); paths.push([q, [q[0] + Math.cos(fb) * rq * 0.2, q[1] + Math.sin(fb) * rq * 0.2], [q[0] + Math.cos(fb + 0.2) * rq * 0.36, q[1] + Math.sin(fb + 0.2) * rq * 0.36]]); } }
    for (const [col, lw] of [['rgba(210,64,26,0.3)', 4], ['rgba(255,122,46,0.45)', 2], ['rgba(255,216,102,0.6)', 0.8]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (const p of paths) p.forEach((q, j) => j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); } }); }
  const tt0a = (o, f) => f.t < o.s || f.t > o.e;

  // F-U01 Armageddon: the sky darkens to embers and a vortex of fire opens above the battlefield; swirling beams of orange firelight with white-hot cores fall out of it and sweep across the floor, flame ribbons and tongues spiralling up round each one, twisting flame ribbons wrapped round the upper body of each core and a burning ring where it touches down, setting alight every monster it touches and leaving a trail of firelight behind, while embers drift up over the whole screen; each beam bursts in a last flare when it lifts
  // Evolution: 2 beams for 4 s at Hatchling, 4 for 5 s at Adept (the damage growing each stage with evoK and split over the beams); at Celestial it becomes Super Armageddon: 6 wider beams for 7 s under a greater double vortex, ending in a cataclysmic burst over the aim.
  U.armageddon = (C, h) => { H = h; K = FK.bind(H);
    const me = H.me, x = C.tx, y = C.ty, ev = K.evo(C), sup = ev >= 7, NB = K.evoN(C, 2, 6), D = ev <= 4 ? 4 + (ev - 1) / 3 : 5 + (ev - 4) * 2 / 3, RX = (3.6 + 0.3 * (ev - 1)) * C.K, BR = (0.95 + 0.06 * (ev - 1)) * (sup ? 1.08 : 1), TICK = 0.4;
    H.X.banner(sup ? 'SUPER ARMAGEDDON' : 'ARMAGEDDON', '', C.col, 1.6); H.X.sfx.hum(); H.warn(x, y, RX, 0.9, C.col);
    const NFL = H.n(70 + 5 * ev), FL = []; for (let i = 0; i < NFL; i++) { const sz = 2.5 + 6 * R1(i * 1.7) * R1(i * 2.9 + 1); FL.push({ sz, sp: 22 + 40 * R1(i * 4.1) + sz * 5, w: 0.6 + R1(i) * 0.6, x: R1(i * 7.3), y: R1(i * 3.1), v: R1(i * 9.7) < 0.55 ? 1 : 0 }); }
    /* balance as the old Armageddon: 9.5 x the move's damage dealt in ticks (burning) and 1.5 x in the last flares, split
       over the beams; and as many burning patches left on the floor (6, 20 at Celestial) */
    const Dm = C.base * C.K * K.evoK(C), NPATCH = sup ? 20 : 6, kN = Math.min(1, Math.sqrt(3 / NB) * 1.15), kq = Math.round(kN * 100), bq = Math.round(BR * 100), beams = [];
    for (let i = 0; i < NB; i++) { const s = 0.35 + i * Math.min(0.42, D * 0.3 / NB), e = D - 0.15 - (NB - 1 - i) * Math.min(0.15, 1.2 / NB), b0 = i / NB * TAU + 0.4 + Math.random() * 0.3, r0 = RX * (0.35 + 0.45 * R1(i * 3.7 + 1)), nT = Math.max(1, Math.ceil((e - s - 0.3) / TICK - 1e-6));
      beams.push({ i, s, e, x: x + Math.cos(b0) * r0, y: y + Math.sin(b0) * r0, vx: 0, vy: 0, tgt: null, re: 0, nt: s + 0.3, tr: [], trT: s, ph: R1(i * 5.1) * TAU, spin: i % 2 ? 1 : -1, sd: i * 13 + 5, dmg: 9.5 * Dm / NB / nT, land: false, flare: false }); }
    const W0 = beams[0].s + 0.3, W1 = D - 0.4, endT = Math.max(...beams.map(b => b.e));
    const warm = [() => aEmber(0), () => aEmber(1), () => aFoot(kq, bq), () => aVein(Math.round(RX * 40 / 4) * 4, ev)]; for (let i = 0; i < NBFa; i++) warm.push(() => aBeam(i, kq, bq)); for (let i = 0; i < NSFa; i++) warm.push(() => aSwirlF(i));
    return H.add({ life: D + 0.9, x, y, wi: 0, pi: 0, nP: 0, fin: false,
      update(dt, f) {
        for (let q = 0; q < 4 && f.wi < warm.length; q++) warm[f.wi++]();
        const live = H.living(), t = f.t;
        // the burning patches, one at a time at the beams in turn
        if (f.nP < NPATCH && t >= W0 + (W1 - W0) * f.nP / NPATCH) { const on = beams.filter(b => t > b.s + 0.3 && t < b.e); if (on.length) { const b = on[f.pi++ % on.length]; H.fire(b.x, b.y, sup ? 0.9 : 1.0, 2.0, C.base * 0.3, 'fire'); } f.nP++; }
        for (const b of beams) { if (t < b.s || t > b.e + 0.5) continue; const on = t < b.e;
          if (!b.land && t >= b.s + 0.32) { b.land = true; H.X.light(b.x, b.y, 2.4, 0.35); H.X.shake(3, 0.12); H.X.sfx.crash(); K.sparks(b.x, b.y - 0.2, 6, 5); K.embers(b.x, b.y - 0.3, 8, { v: 3 }); H.X.ring(b.x, b.y, 0.2, BR * 1.6, 0.4, P.org, 0.12); }
          if (!on && !b.flare) { b.flare = true; H.hitArea(b.x, b.y, BR + 0.8, 1.5 * Dm / NB, C.dmgO({ kb: 4, burn: 1 })); H.X.light(b.x, b.y, 3, 0.3); K.embers(b.x, b.y - 1, 10, { v: 4, up: 4 }); K.sparks(b.x, b.y - 0.4, 6, 6); H.X.ring(b.x, b.y, 0.3, BR + 0.8, 0.35, P.yel, 0.3); H.X.shake(4, 0.12);
            if (sup && !f.fin && t >= endT) { f.fin = true; K.blast(x, y, RX * 0.55, 1.6); H.X.flash(0.22, '#FFD9A0'); H.X.shake(12, 0.35); H.X.sfx.crash(); } }
          // steer: toward its own monster (one each when there are enough), sweeping across it; held inside the area, away from the pet
          if (on && (!b.tgt || b.tgt.dead || t > b.re)) { b.re = t + 1.1 + R1(b.sd + t) * 0.6; const taken = new Set(beams.filter(q => q !== b && q.tgt).map(q => q.tgt)); const cand = live.filter(m => Math.hypot(m.x - x, m.y - y) < RX * 1.25 + m.r); const free = cand.filter(m => !taken.has(m)); const pool = free.length ? free : R1(b.sd + Math.floor(t)) < 0.35 ? cand : []; b.tgt = pool.length ? pool.sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y))[0] : null; }
          const V = 1.7 + 0.08 * ev; let dx = 0, dy = 0;
          if (b.tgt && on) { const tx = b.tgt.x - b.x, ty = b.tgt.y - b.y, d = Math.hypot(tx, ty) || 1, k = Math.min(1, d / 1.2); dx = tx / d * V * k - ty / d * V * 0.55 * b.spin; dy = ty / d * V * k + tx / d * V * 0.55 * b.spin; }
          else { const ox = b.x - x, oy = b.y - y, d = Math.hypot(ox, oy) || 1; dx = -oy / d * V * b.spin + Math.cos(t * 0.9 + b.ph) * V * 0.4; dy = ox / d * V * b.spin + Math.sin(t * 1.1 + b.ph) * V * 0.4; }
          const cx = b.x - x, cy = b.y - y, dc = Math.hypot(cx, cy); if (dc > RX) { dx -= cx / dc * (dc - RX) * 3; dy -= cy / dc * (dc - RX) * 3; }
          const px = b.x - me.x, py = b.y - me.y, dp = Math.hypot(px, py) || 0.01; if (dp < 1.7) { dx += px / dp * (1.7 - dp) * 5; dy += py / dp * (1.7 - dp) * 5; }
          for (const o of beams) { if (o === b || tt0a(o, f)) continue; const ex = b.x - o.x, ey = b.y - o.y, d2 = Math.hypot(ex, ey) || 0.01; if (d2 < 2.4) { dx += ex / d2 * (2.4 - d2) * 2.2; dy += ey / d2 * (2.4 - d2) * 2.2; } }
          const kk = Math.min(1, dt * 2.4); b.vx += (dx - b.vx) * kk; b.vy += (dy - b.vy) * kk; b.x += b.vx * dt; b.y += b.vy * dt;
          if (on && t - b.trT > 0.22) { b.trT = t; b.n = (b.n || 0) + 1; b.tr.push({ x: b.x, y: b.y, t, c: b.n % 2 === 0, n: b.n, sd: b.sd + b.n }); if (b.tr.length > 14) b.tr.shift(); }
          if (on && t > b.s + 0.3) for (const m of live) { const d = Math.hypot(m.x - b.x, m.y - b.y); if (d < BR * 2 && d > 0.3) H.pull(m, b.x, b.y, (1 - d / (BR * 2)) * dt * 1.2); }   /* (it draws them into its burning spiral) */
          if (on && t >= b.nt) { b.nt += TICK; const k = H.hitArea(b.x, b.y, BR, b.dmg, C.dmgO({ kb: 0, burn: 1 })); if (k && Math.random() < 0.6 * kN) K.sparks(b.x, b.y - 0.3, 3, 4); }
          if (on && b.land) { if (NB <= 5 || (b.i & 1) === 0) lit(f, 'b' + b.i, b.x, b.y - 0.6, 2.4, dt);
            if (Math.random() < 0.8 * H.Q() * kN) { const q = Math.random() * TAU, rr = BR * (0.4 + Math.random() * 0.6); H.P({ kind: Math.random() < 0.7 ? 'ember' : 'spark', x: b.x + Math.cos(q) * rr, y: b.y + Math.sin(q) * rr * 0.6, vx: -Math.sin(q) * 1.6 * b.spin, vy: -1.6 - Math.random() * 1.8, g: -0.6, drag: 0.6, life: 0.6 + Math.random() * 0.5, max: 1.1, size: 1.8 + Math.random() * 2, color: Math.random() < 0.4 ? P.yel : Math.random() < 0.5 ? P.org : P.gold }); }
            if (Math.random() < 0.15 * H.Q()) K.smoke(b.x, b.y - 0.3, 1, 0.5); } }
      },
      drawUnder(c, f, X, Y, T) {
        const fa = cl(Math.min(f.t / 0.6, (D + 0.9 - f.t) / 0.9)), S = scr(c), tt = f.t, m = T * 3;
        // the light leaves the floor: a smouldering dim over the battlefield (so the firelight carries)
        c.save(); c.globalAlpha = (sup ? 0.3 : 0.24) * fa; c.fillStyle = 'rgb(44,12,6)'; c.fillRect(S.x0, S.y0, S.w, S.h); c.restore();
        // glowing cracks spreading across the floor round the aim, breathing
        { const Rv = T * RX * 1.05, gv = H.ease.out(cl(tt / 1.2)), rq = Math.round(RX * 40 / 4) * 4, cv = aVein(rq, ev), k = Rv / rq * (0.35 + 0.65 * gv); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fa * gv * (0.55 + 0.15 * Math.sin(tt * 4)); c.drawImage(cv, X - cv.width / 2 * k, Y - cv.height / 2 * k, cv.width * k, cv.height * k); c.restore(); }
        const FA = aFoot(kq, bq);
        for (const b of beams) { if (tt < b.s) continue; const BX = H.sx(b.x), BY = H.sy(b.y), on = tt < b.e, a = cl((tt - b.s) / 0.35) * (on ? 1 : Math.max(0, 1 - (tt - b.e) / 0.45));
          // the firelight left along its path, fading
          for (const p of b.tr) { const age = tt - p.t, k = Math.max(0, 1 - age / 1.3); if (k <= 0 || (p.n & 3)) continue; const qx = H.sx(p.x), qy = H.sy(p.y); if (qx < S.x0 - m || qx > S.x0 + S.w + m || qy < S.y0 - m || qy > S.y0 + S.h + m) continue; K.floorLight(c, qx, qy, T * BR * 1.9 * (0.6 + 0.4 * k), 0.4 * k * kN, P.org); }
          if (a <= 0.01 || BX < S.x0 - m || BX > S.x0 + S.w + m || BY < S.y0 - m || BY > S.y0 + S.h + m) continue;
          // the floor under it: the turning swirl of fire, the light pool and the burning ring (cached), embers running round the ring
          const br = 1 + 0.067 * Math.sin(tt * 3 + b.ph), sc = T * BR * 2.1 * br / 128, rot = tt * 2.6 * b.spin + b.ph, R0 = T * BR * br, rs = R0 * 1.5; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.65 * kN * a; c.drawImage(aSwirlAt(rot), BX - rs, BY - rs * H.GY, rs * 2, rs * 2 * H.GY);
          const gq = Math.max(2, T * 0.06) * 2.5, ge = aEmber(0); c.globalAlpha = 0.6 * a; for (let i = 0; i < 3; i++) { const q = tt * 2 * b.spin + i * 2.1; c.drawImage(ge, BX + Math.cos(q) * R0 * 0.95 - gq, BY + Math.sin(q) * R0 * 0.95 * H.GY - gq, gq * 2, gq * 2); }
          c.translate(BX, BY); c.scale(sc, sc * H.GY); c.globalAlpha = a * (0.9 + 0.1 * Math.sin(tt * 19 + b.ph)); c.drawImage(FA, -128, -128); c.restore(); }
      },
      draw(c, f, X, Y, T) {
        const fa = cl(Math.min(f.t / 0.6, (D + 0.9 - f.t) / 0.9)), S = scr(c), tt = f.t, topY = S.y0 - T * 0.5, m = T * 3;
        const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46;
        // the vortex of fire in the sky the beams fall from (a greater, double one at Celestial)
        const VX = X, VY = S.y0 + T * 0.6, vs = sup ? 1.3 : 1;
        K.glow(c, VX, VY, T * 7 * vs, P.red, 0.42 * fa); K.glow(c, VX, VY, T * 3 * vs, P.org, 0.22 * fa); if (sup) K.glow(c, VX, VY, T * 1.6, P.yel, 0.3 * fa);
        c.save(); c.globalCompositeOperation = 'lighter'; const vr = T * 6.5 * vs; c.globalAlpha = 0.55 * fa; c.drawImage(aSwirlAt(-tt * 0.9), VX - vr, VY - vr * 0.38, vr * 2, vr * 2 * 0.38); c.globalAlpha = 0.38 * fa; c.drawImage(aSwirlAt(tt * 0.7), VX - vr * 0.6, VY - vr * 0.6 * 0.38, vr * 1.2, vr * 1.2 * 0.38);
        if (sup) { c.globalAlpha = 0.3 * fa; c.drawImage(aSwirlAt(tt * 0.5 + 1), VX - vr * 1.45, VY - vr * 1.45 * 0.38, vr * 2.9, vr * 2.9 * 0.38); } c.restore();
        const gw = aEmber(0), gr2 = aEmber(1);
        for (const b of beams) { if (tt < b.s) continue; const on = tt < b.e, out = on ? 0 : cl((tt - b.e) / 0.45); if (out >= 1) continue;
          const BX = H.sx(b.x), BY = H.sy(b.y), grow = H.ease.in(cl((tt - b.s) / 0.32)), a = (0.35 + 0.65 * cl((tt - b.s - 0.2) / 0.3)) * (1 - out) * (0.92 + 0.08 * Math.sin(tt * 23 + b.ph * 3));
          const qa = b.ph + tt * 0.45 * b.spin, TY = topY; let TX = BX * 0.55 + VX * 0.45 + Math.cos(qa) * T * 1.6;
          /* a beam whose foot is in front of the pet leans aside so its column passes beside the pet, never over it */
          let over = false; { const u = (PY - TY) / (BY - TY); if (u > 0 && u < 1.05) { const need = T * BR * 0.75 + T * 0.75; if (u < 0.97) { const xu = TX + (BX - TX) * u, d = PX - xu; if (Math.abs(d) < need) { const xt = PX - (d >= 0 ? 1 : -1) * need; TX = Math.max(TX - T * 9, Math.min(TX + T * 9, (xt - BX * u) / (1 - u))); } } const u2 = Math.min(1, u); over = Math.abs(PX - (TX + (BX - TX) * u2)) < need; } }
          const w = T * BR * 1.4 * (on ? 1 : 1 - 0.7 * out) * (0.25 + 0.75 * cl((tt - b.s - 0.15) / 0.3)) * (1 + 0.07 * Math.sin(tt * 9 + b.ph) + 0.03 * Math.sin(tt * 21 + b.i));
          const offL = Math.max(TX, BX) + w < S.x0, offR = Math.min(TX, BX) - w > S.x0 + S.w;
          const nearP = Math.abs(BX - PX) < T * 5 && Math.abs(BY - PY) < T * 4, crownOn = grow >= 1 && a > 0.05, cs = tt * 1.8 * b.spin;
          if (crownOn && BY < S.y0 + S.h + m) K.glow(c, BX, BY - T * 0.9, T * BR * 2.2, P.org, 0.4 * a * kN);
          if (!offL && !offR) { const L = Math.hypot(BX - TX, BY - TY), ang = Math.atan2(BY - TY, BX - TX) - Math.PI / 2, Lg = L * grow, top0 = out * L, ca = Math.cos(ang), sa = Math.sin(ang), NT = 7;
            /* twisting flames wrapped round the upper body of the core: tapered flame ribbons spiralling round the column and
               rising, their edges licking (back halves dim behind the column, front halves bright over it); filled polygons, no sprites */
            const NR = sup ? 3 : 2, tw = (front) => { if (Lg - top0 < T * 2) return; c.save(); if (over) petHole(c, T); c.translate(TX, TY); c.rotate(ang); c.globalCompositeOperation = 'lighter';
              const y0 = top0 + (Lg - top0) * 0.12, y1 = top0 + (Lg - top0) * 0.72, NS = 28;
              for (let r = 0; r < NR; r++) { const pts = []; const ph = r / NR * TAU + b.ph, sl = (tt * 0.35 * (1 + r * 0.15) + r * 0.31) % 1;
                for (let j = 0; j <= NS; j++) { const s2 = j / NS, yy = y0 + (y1 - y0) * s2, q = s2 * 9.5 - tt * 4.2 * b.spin + ph, cq = Math.cos(q), rad = w * (0.5 + 0.12 * Math.sin(s2 * 7 + tt * 5 + r)), xx = Math.sin(q) * rad;
                  const env = Math.sin(Math.PI * s2) * (0.6 + 0.4 * Math.sin(s2 * TAU * 2 - sl * TAU * 2)), lick = 1 + 0.35 * Math.sin(s2 * 23 + tt * 17 + r * 2) * Math.sin(tt * 6 + s2 * 5);
                  pts.push([xx, yy - rad * 0.28 * cq, cq, w * 0.21 * env * lick * (0.75 + 0.25 * Math.abs(cq)) * ((u2 => u2 * u2 * (3 - 2 * u2))(cl(Math.abs(cq) / 0.75)))]); }   // (tapers to a point where it turns behind the core)
                // contiguous runs on the wanted side, each filled as a ribbon (offset along the curve's normal)
                let run = []; const flush = () => { if (run.length > 2) { for (const [col, kw, al] of front ? [[P.red, 2.6, 0.04], [P.red, 2.1, 0.05], [P.red, 1.7, 0.07], [P.org, 1.35, 0.09], [P.org, 1.05, 0.12], [P.org, 0.78, 0.15], [P.yel, 0.52, 0.2], [P.yel, 0.3, 0.25], [P.wht, 0.12, 0.3]] : [[P.red, 2.0, 0.05], [P.red, 1.4, 0.07], [P.org, 0.9, 0.1], [P.org, 0.5, 0.12]]) {
                    c.globalAlpha = al * a; c.fillStyle = col; c.beginPath();
                    for (let k = 0; k < run.length; k++) { const p0 = run[Math.max(0, k - 1)], p1 = run[Math.min(run.length - 1, k + 1)], tx = p1[0] - p0[0], ty = p1[1] - p0[1], tn = Math.hypot(tx, ty) || 1, hw = run[k][3] * kw; const X2 = run[k][0] - ty / tn * hw, Y2 = run[k][1] + tx / tn * hw; k ? c.lineTo(X2, Y2) : c.moveTo(X2, Y2); }
                    for (let k = run.length - 1; k >= 0; k--) { const p0 = run[Math.max(0, k - 1)], p1 = run[Math.min(run.length - 1, k + 1)], tx = p1[0] - p0[0], ty = p1[1] - p0[1], tn = Math.hypot(tx, ty) || 1, hw = run[k][3] * kw; c.lineTo(run[k][0] + ty / tn * hw, run[k][1] - tx / tn * hw); }
                    c.closePath(); c.fill(); } } run = []; };
                for (const p2 of pts) { if ((p2[2] > 0) === front) run.push(p2); else { if (run.length) run.push(p2); flush(); } } flush(); }
              c.restore(); };
            const tongues = tw;
            tongues(false);
            c.save(); if (over) petHole(c, T); c.translate(TX, TY); c.rotate(ang); c.globalCompositeOperation = 'lighter';
            // the column of firelight with its spiralling flame ribbons: one of 32 cached turning frames
            const ph = (((tt * 7 * b.spin) / TAU) % 1 + 1) % 1 * NBFa;
            if (Lg - top0 > 1) { c.globalAlpha = a; c.drawImage(aBeam(Math.round(ph) % NBFa, kq, bq), -w * 0.55, top0, w * 1.1, (Lg - top0) * 1.08); }   // reaches a little past the foot so its feathered end centres on the floor glow
            c.restore();
            tongues(true);
            // embers whirling up inside it (placed along the beam, blitted unturned)
            if (Lg > T) { const mr = T * 0.2; c.save(); if (over) petHole(c, T); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * a; for (let j = 0; j < 6; j++) { const u = (tt * 0.6 + j / 6 + b.i * 0.13) % 1, yy = top0 + (Lg - top0) * (1 - u), q = u * 12 + j * 1.3 - tt * 3 * b.spin, xx = Math.sin(q) * w * 0.42; if (yy < top0) continue; c.drawImage(j & 1 ? gr2 : gw, TX + xx * ca - yy * sa - mr, TY + xx * sa + yy * ca - mr, mr * 2, mr * 2); } c.restore(); } }
          if (BX < S.x0 - m || BX > S.x0 + S.w + m || BY < S.y0 - m || BY > S.y0 + S.h + m * 2) continue;
          if (nearP) { c.save(); petHole(c, T); }
          // its last flare as it lifts: a burst of light and a ring of fire
          if (out > 0) { K.glow(c, BX, BY - T * 0.8, T * 2.6 * (1 - out * 0.4), P.yel, 0.7 * (1 - out)); K.shockRing(c, BX, BY, T * (BR + 2 * out), 1 - out); }
          if (nearP) c.restore();
        }
        // embers drifting up over the whole screen: two cached dots, many small blits, twinkling
        if (fa > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < NFL; i++) { const F = FL[i], fx2 = S.x0 + ((F.x * S.w + 16 * Math.sin(tt * F.w * 1.7 + i) - tt * 6) % S.w + S.w) % S.w, fy2 = S.y0 + S.h - ((F.y * S.h + tt * F.sp) % S.h); c.globalAlpha = fa * (0.55 + 0.45 * Math.sin(tt * (3 + F.w * 4) + i * 1.3)); c.drawImage(F.v ? gr2 : gw, fx2 - F.sz, fy2 - F.sz, F.sz * 2, F.sz * 2); } c.restore(); }
      } }); };

  /* ================= F-U02 Festival of a Thousand Embers ================= */
  /* a paper fire lantern at screen (X, Y), r its half height: paper lit through by its flame (a hot left, a shaded right),
     bamboo ribs, lacquered caps with gold rims, a tassel; open 0..1 drops its bottom and pours a jet of fire */
  function lantern(c, X, Y, r, open, heat, t, seed, a) {
    if (!(a > 0.01) || r < 2) return; const w = r * 0.8, g = 0.8 + 0.2 * Math.sin(t * 7 + seed * 1.3), sw = Math.sin(t * 2.2 + seed) * 0.07, ob = 1 + open * 0.35;
    K.glow(c, X, Y, r * 2.8, P.org, 0.42 * heat * g * a);
    c.save(); c.translate(X, Y); c.rotate(sw); c.globalAlpha = a;
    c.strokeStyle = H.rgba(P.char, 0.8); c.lineWidth = 1; c.beginPath(); c.moveTo(0, -r * 1.05); c.lineTo(0, -r * 1.6); c.stroke();
    const body = () => { c.beginPath(); c.moveTo(-w * 0.5, -r * 0.88); c.bezierCurveTo(-w * 1.18, -r * 0.7, -w * 1.18, r * 0.62, -w * 0.5 * ob, r * 0.88); c.lineTo(w * 0.5 * ob, r * 0.88); c.bezierCurveTo(w * 1.18, r * 0.62, w * 1.18, -r * 0.7, w * 0.5, -r * 0.88); c.closePath(); };
    const gr = c.createLinearGradient(-w, -r * 0.4, w, r * 0.4); gr.addColorStop(0, heat > 0.5 ? P.wht : P.yel); gr.addColorStop(0.28, P.amb); gr.addColorStop(0.62, P.red); gr.addColorStop(1, P.dred);
    body(); c.fillStyle = gr; c.fill();
    c.save(); body(); c.clip(); c.globalCompositeOperation = 'lighter'; K.glow(c, -w * 0.15, r * 0.25, r * 1.0, P.yel, 0.6 * heat * g); c.globalCompositeOperation = 'source-over';
    c.lineWidth = 1.2; for (let i = -3; i <= 3; i++) { c.strokeStyle = H.rgba(P.dred, i > 0 ? 0.5 : 0.3); c.beginPath(); c.moveTo(i * w * 0.17, -r * 0.88); c.quadraticCurveTo(i * w * 0.36, 0, i * w * 0.17 * ob, r * 0.88); c.stroke(); }
    c.strokeStyle = H.rgba(P.gold, 0.7); c.lineWidth = 1.4; for (const yy of [-0.62, 0.62]) { c.beginPath(); c.moveTo(-w, r * yy); c.quadraticCurveTo(0, r * yy + r * 0.12, w, r * yy); c.stroke(); }
    c.fillStyle = H.rgba(P.wht, 0.35); c.beginPath(); c.ellipse(-w * 0.45, -r * 0.25, w * 0.12, r * 0.4, 0.15, 0, TAU); c.fill(); c.restore();
    body(); c.strokeStyle = H.line(); c.lineWidth = 1.5; c.stroke();
    const cap = (yy, ww, hh, al) => { c.globalAlpha = a * al; const gc = c.createLinearGradient(-ww / 2, 0, ww / 2, 0); gc.addColorStop(0, '#7A3A26'); gc.addColorStop(0.4, P.crust); gc.addColorStop(1, P.char); c.fillStyle = gc; c.fillRect(-ww / 2, yy, ww, hh); c.strokeStyle = H.line(); c.lineWidth = 1.2; c.strokeRect(-ww / 2, yy, ww, hh); c.strokeStyle = H.rgba(P.gold, 0.85); c.lineWidth = 1; c.beginPath(); c.moveTo(-ww / 2 + 1, yy + hh * 0.5); c.lineTo(ww / 2 - 1, yy + hh * 0.5); c.stroke(); c.globalAlpha = a; };
    cap(-r * 1.04, w * 1.05, r * 0.17, 1); if (open < 1) cap(r * 0.86 + open * r * 0.9, w * 1.0, r * 0.15, 1 - open);
    if (open < 0.4) { const ty = r * 1.01; c.strokeStyle = H.rgba(P.red, 0.9); c.lineWidth = 1.2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 2, ty); c.lineTo(i * 3 + Math.sin(t * 3 + seed + i) * 2, ty + r * 0.5); c.stroke(); } c.fillStyle = P.gold; c.beginPath(); c.arc(0, ty + 1, 2, 0, TAU); c.fill(); }
    c.restore();
    if (open > 0) { sflame(c, X, Y + r * 0.85, Math.PI / 2, w * 0.9 * open, r * 1.7 * open * g, t, seed, 0.95 * a); K.glow(c, X, Y + r * 1.4, r * 1.4, P.yel, 0.4 * open * a); }
  }
  // F-U02 Festival of a Thousand Embers: shaded paper lanterns rise in three turning tiers over the aim and open in turn, each dropping a fire shell on a marked spot; the rest gather into a garlanded canopy and burst together as a great firework into slow-falling ember ribbons
  // Evolution: more lanterns (6 to 12) and more shells (4 to 8, the shell damage split between them), a wider festival; at Celestial three more fireworks burst over the area as a finale.
  U.embers = (C, h) => { H = h; K = FK.bind(H); const x = C.tx, y = C.ty, ev = K.evo(C), R = 3.6 * C.K * (1 + 0.03 * (ev - 1)), N = K.evoN(C, 6, 12), nS = K.evoN(C, 4, 8), fin = ev >= 7, D = C.base * C.K * K.evoK(C), norm = fin ? 14 / 15.8 : 1, GATH = 2.9, BURST = 3.45, CZ = 3.3;
    const lans = []; for (let i = 0; i < N; i++) { const tier = i % 3; lans.push({ tier, b: i / N * TAU + tier, r: (1.25 + tier * 0.95) * R / 3.6, z: 1.3 + tier * 0.65, open: 0, gone: false, x, y, cz: 0, spot: -1, shell: null }); }
    H.warn(x, y, R, 1.0, C.col); H.X.banner('FESTIVAL OF A THOUSAND EMBERS', '', C.col, 1.4); H.X.sfx.hum();
    const spots = []; const tg = H.sortNear(x, y).filter(m => Math.hypot(m.x - x, m.y - y) < R + 0.5); for (let i = 0; i < nS; i++) { const m = tg[i % Math.max(1, tg.length)], b = i / nS * TAU + 0.4, r = (1.2 + (i % 2) * 1.4) * R / 3.6; spots.push({ x: m ? m.x + (Math.random() - 0.5) * 0.6 : x + Math.cos(b) * r, y: m ? m.y + (Math.random() - 0.5) * 0.6 : y + Math.sin(b) * r, hitT: 0 }); }
    const opens = spots.map((s, i) => 1.0 + i * (1.35 / Math.max(1, nS - 1))), finals = fin ? [0, 1, 2].map(i => { const b = i / 3 * TAU + 0.9; return { x: x + Math.cos(b) * R * 0.55, y: y + Math.sin(b) * R * 0.55, t0: BURST + 0.35 + i * 0.22 }; }) : [];
    const F = H.add({ life: fin ? 5.5 : 4.8, x, y, gather: 0,
      update(dt, f) { const form = H.ease.out(cl(f.t / 0.9)); f.gather = cl((f.t - GATH) / 0.5);
        lans.forEach((l, i) => { if (l.gone) return; l.b += dt * (0.5 + l.tier * 0.25) * (l.tier % 2 ? -1 : 1); const rr = l.r * form * (1 - f.gather * 0.75), zz = (l.z * form + 0.4 * (1 - form) + Math.sin(f.t * 2 + i) * 0.1) * (1 - f.gather) + f.gather * CZ; l.x = x + Math.cos(l.b) * rr; l.y = y + Math.sin(l.b) * rr * H.GY; l.cz = zz;
          if (l.open > 0 && l.open < 1) l.open = Math.min(1, l.open + dt * 4); if (l.open >= 1 && f.t > l.openT + 0.6) l.gone = true;
          if (Math.random() < (l.open > 0 ? 6 : 1.2) * dt * H.Q()) H.P({ kind: 'ember', x: l.x + (Math.random() - 0.5) * 0.3, y: l.y - l.cz + 0.3, vx: (Math.random() - 0.5) * 0.6, vy: l.open > 0 ? 1.5 : -0.6, g: l.open > 0 ? 3 : -0.6, life: 0.6, max: 0.6, size: 3, color: Math.random() < 0.5 ? P.yel : P.org }); });
        for (const s of spots) if (s.hitT && f.t < s.hitT + 1.2) K.aura(s.x, s.y, 0.6, dt, 6, 0);
        if (f.t < BURST) lit(f, 'l', x, y - 1.6, R * 0.9 * cl(f.t * 1.5), dt); else if (f.t < BURST + 1.6) { K.aura(x, y, R * 0.6, dt, 16, 0); lit(f, 'l', x, y - 1, R * 1.1, dt); } for (const s of spots) if (s.hitT && f.t < s.hitT + 0.8) lit(f, 's' + s.hitT, s.x, s.y, 2, dt); },
      drawUnder(c, f, X, Y, T) { const t = f.t, k = H.fade(f, 0.5, 0.8);
        for (const l of lans) if (!l.gone) K.floorLight(c, H.sx(l.x), H.sy(l.y), T * (0.7 + l.open * 0.5), (0.22 + 0.3 * l.open) * k * (1 - f.gather));
        for (const s of spots) if (s.hitT && t > s.hitT) K.scorch(c, H.sx(s.x), H.sy(s.y), T * 1.2, 0.8 * k, Math.max(0.08, 1 - (t - s.hitT) / 1.4), s.x * 3);
        if (t > BURST) { const u = cl((t - BURST) / 0.5); K.scorch(c, X, Y, T * R * 0.75 * H.ease.out(u), 0.75 * k, Math.max(0, 1 - (t - BURST) / 1.4), 4); K.floorLight(c, X, Y, T * R, 0.5 * (1 - cl((t - BURST) / 1.2))); }
        for (const q of finals) if (t > q.t0 + 0.3) K.scorch(c, H.sx(q.x), H.sy(q.y), T * 1.4, 0.7 * k, Math.max(0.1, 1 - (t - q.t0 - 0.3) / 1.0), q.x); },
      draw(c, f, X, Y, T) { const t = f.t, k = Math.min(1, f.life / 0.6), CY = Y - CZ * T;
        // the canopy: garlands of fire strung between the gathering lanterns, a hot knot at its heart
        if (f.gather > 0 && t < BURST) { const live = lans.filter(l => !l.gone); for (let i = 0; i < live.length; i++) { const p = live[i], q = live[(i + 1) % live.length], ax = H.sx(p.x), ay = H.sy(p.y) - p.cz * T, bx = H.sx(q.x), by = H.sy(q.y) - q.cz * T, pts = []; for (let j = 0; j <= 6; j++) { const u = j / 6; pts.push([lerp(ax, bx, u), lerp(ay, by, u) + Math.sin(u * Math.PI) * T * 0.35]); } stream(c, pts, T * 0.1, 0.8 * f.gather * k); }
          K.fireball(c, X, CY, T * 0.55 * f.gather, t, 2, f.gather * k); shimmer(c, X, CY - T * 0.4, T * 1.2, T * 1.4, t, f.gather); }
        const list = lans.filter(l => !l.gone).sort((p, q) => p.y - q.y); for (const l of list) { const LX = H.sx(l.x), LY = H.sy(l.y) - l.cz * T; lantern(c, LX, LY, T * 0.5 * (1 - f.gather * 0.25), l.open, 0.65 + 0.35 * l.open, t, lans.indexOf(l) * 1.7, k * petGuard(LX, LY, T) * (l.open >= 1 ? cl(1 - (t - l.openT - 0.3) / 0.3) : 1)); }
        // the fire shells falling to their spots
        for (const l of lans) { const sh = l.shell; if (!sh) continue; const u = (t - sh.t0) / 0.32; if (u <= 0 || u >= 1) continue; const s = spots[l.spot], e = H.ease.in(u), hx = lerp(sh.x, s.x, e), hy = lerp(sh.y, s.y, e), pts = []; for (let j = 0; j <= 5; j++) { const v = Math.max(0, e - j * 0.06); pts.unshift([H.sx(lerp(sh.x, s.x, v)), H.sy(lerp(sh.y, s.y, v))]); } stream(c, pts, T * 0.22, k, v => 0.2 + 0.8 * v); H.core(c, H.sx(hx), H.sy(hy), T * 0.22, P.org, P.wht, k); }
        for (const s of spots) if (s.hitT && t > s.hitT && t < s.hitT + 0.5) { const u = (t - s.hitT) / 0.5, SX = H.sx(s.x), SY = H.sy(s.y); K.shockRing(c, SX, SY, T * (0.4 + 1.1 * H.ease.out(u)), 1 - u); fring(c, SX, SY, T * 0.55 * (0.6 + u), 5, T * 0.9 * (1 - u), t, (1 - u) * k * petGuard(SX, SY - T * 0.4, T), t, 0.3); firework(c, SX, SY - T * 0.6, T * 1.1, u, 14, t, k, s.x); }
        // the great burst, and the slow-falling ribbons
        if (t > BURST) { const u = cl((t - BURST) / 1.1); firework(c, X, CY, T * R * 0.95, u, 30, t, k, 0.2); firework(c, X, CY, T * R * 0.55, cl(u * 1.4), 18, t, k, 1.1); if (u < 0.5) K.shockRing(c, X, Y, T * R * H.ease.out(u * 2), 1 - u * 2);
          for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.3, rr = T * R * 0.75 * H.ease.out(u), ox = X + Math.cos(b) * rr, oy = CY + Math.sin(b) * rr * 0.6, pts = []; for (let j = 0; j <= 6; j++) { const v = j / 6; pts.push([ox + Math.sin(v * 5 + t * 2 + i) * T * 0.25, oy + v * T * 2.4 * u]); } stream(c, pts, T * 0.1, (1 - u) * k * 0.9, v => 1 - v * 0.7); } }
        for (const q of finals) { const u = cl((t - q.t0) / 0.9); if (u > 0 && u < 1) { const QX = H.sx(q.x), QY = H.sy(q.y); firework(c, QX, QY - T * 2.6, T * 1.9, u, 20, t, k, q.x); if (u < 0.35) { const v = u / 0.35; H.core(c, QX, lerp(QY - T * 2.6, QY, v), T * 0.25, P.org, P.wht, 1 - v * 0.3); } } } } });
    spots.forEach((s, i) => H.X.after(opens[i], () => { const l = lans[i % N]; l.open = 0.01; l.openT = F.t; l.spot = i; l.shell = { t0: F.t + 0.05, x: l.x, y: l.y - l.cz + 0.5 }; H.warn(s.x, s.y, 1.25, 0.37, C.col, () => { s.hitT = F.t; H.hitArea(s.x, s.y, 1.3, 9.6 / nS * D * norm, C.dmgO({ kb: 2, burn: 1 })); K.blast(s.x, s.y, 1.2, 0.8); K.flakes(s.x, s.y, 5); for (let j = 0; j < H.n(10); j++) H.P({ kind: 'star', x: s.x + (Math.random() - 0.5) * 0.6, y: s.y - 0.2, vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 3, g: 6, life: 0.5, max: 0.5, size: 3.5, color: j % 2 ? P.yel : P.wht }); H.X.sfx.crash(); }); H.X.sfx.sparkle && H.X.sfx.sparkle(); }));
    H.X.after(GATH, () => H.X.sfx.hum());
    H.X.after(BURST - 0.35, () => H.warn(x, y, R, 0.35, C.col));
    H.X.after(BURST, () => { for (const l of lans) l.gone = true; H.hitArea(x, y, R, 4.4 * D * norm, C.dmgO({ kb: 5, burn: 1, stun: 0.4 })); K.blast(x, y, R * 0.8, 2); H.X.ring(x, y, 0.3, R, 0.5, P.gold, 0.5); H.X.flash(0.28, '#FFE0B0'); for (let j = 0; j < H.n(36); j++) H.P({ kind: 'petal', x: x + (Math.random() - 0.5) * R * 1.6, y: y - 3 - Math.random() * 1.5, vx: (Math.random() - 0.5) * 1.5, vy: 1.0 + Math.random() * 0.8, life: 1.4, max: 1.4, size: 5, rot: Math.random() * 6, vr: 4, color: j % 3 ? P.org : P.gold }); H.fire(x, y, 1.6, 2.5, C.base * 0.6, 'fire'); H.X.sfx.crash(); H.X.hitstop(0.06); });
    for (const q of finals) H.X.after(q.t0 + 0.3, () => { H.hitArea(q.x, q.y, 1.7, 0.6 * D * norm, C.dmgO({ kb: 3, burn: 1 })); K.blast(q.x, q.y, 1.4, 1); for (let j = 0; j < H.n(12); j++) H.P({ kind: 'star', x: q.x + (Math.random() - 0.5), y: q.y - 2.6 + (Math.random() - 0.5), vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, g: 3, life: 0.8, max: 0.8, size: 3.5, color: j % 2 ? P.gold : P.wht }); H.X.sfx.crash(); });
    return F; };

  /* ================= F-U03 Solar Crucible ================= */
  /* a corona: a sun of radius r at screen (X, Y): turning rays, the fireball, a white heart */
  function sun(c, X, Y, r, t, a) { if (r < 2 || !(a > 0.01)) return; K.glow(c, X, Y, r * 4.2, P.org, 0.5 * a); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; for (let i = 0; i < 12; i++) { const b = i / 12 * TAU + t * 0.8 * (i % 2 ? 1 : -1), l = r * (1.9 + 0.5 * Math.sin(t * 5 + i * 1.7)); c.fillStyle = H.rgba(i % 2 ? P.yel : P.org, 0.35); c.beginPath(); c.moveTo(X + Math.cos(b - 0.12) * r * 0.9, Y + Math.sin(b - 0.12) * r * 0.9); c.lineTo(X + Math.cos(b) * l, Y + Math.sin(b) * l); c.lineTo(X + Math.cos(b + 0.12) * r * 0.9, Y + Math.sin(b + 0.12) * r * 0.9); c.closePath(); c.fill(); } c.restore();
    c.save(); c.globalAlpha = a; for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + t * 1.6; sflame(c, X + Math.cos(b) * r * 0.75, Y + Math.sin(b) * r * 0.75, b * 0.4 - Math.PI / 2 * 0.6, r * 0.6, r * (0.9 + 0.3 * Math.sin(t * 9 + i)), t, i * 1.9, 0.95); }
    const g = c.createRadialGradient(X - r * 0.3, Y - r * 0.35, r * 0.05, X, Y, r); g.addColorStop(0, P.wht); g.addColorStop(0.3, P.yel); g.addColorStop(0.65, P.org); g.addColorStop(0.9, P.red); g.addColorStop(1, P.dred); c.fillStyle = g; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.5); c.lineWidth = Math.max(1, r * 0.12); c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const b = t * (3 + i) + i * 2.1; c.beginPath(); c.arc(X, Y, r * (0.45 + i * 0.16), b, b + 1.4); c.stroke(); } c.restore(); H.core(c, X - r * 0.12, Y - r * 0.15, r * 0.55, P.yel, '#FFFFFF', 0.9 * a); }
  // F-U03 Solar Crucible: a bowl of molten plates (dark crust, glowing seams, a hot inner face) forms over the aim round a small sun with a turning corona; molten streams pour through its gaps onto marked spots, then the plates open and drop the sun as a broad blast whose rolling flame edge cools into black-and-gold flakes
  // Evolution: more plates (6 to 10), more pours (3 to 6, their damage split), a wider blast; at Celestial the sun throws six solar prominences that arc out and land round the blast.
  U.crucible = (C, h) => { H = h; K = FK.bind(H); const x = C.tx, y = C.ty, ev = K.evo(C), R = 3.4 * C.K * (1 + 0.04 * (ev - 1)), Z = 3.0, NP = K.evoN(C, 6, 10), nP = K.evoN(C, 3, 6), DROP = 3.0, HIT = 3.35, fin = ev >= 7, D = C.base * C.K * K.evoK(C), norm = fin ? 11.2 / 13.0 : 1;
    const pours = []; for (let i = 0; i < nP; i++) pours.push(1.1 + i * (1.2 / Math.max(1, nP - 1)));
    H.warn(x, y, R, 1.0, C.col); H.X.banner('SOLAR CRUCIBLE', '', C.col, 1.4); H.X.sfx.hum();
    const spots = []; const tg = H.sortNear(x, y).filter(m => Math.hypot(m.x - x, m.y - y) < R); pours.forEach((t0, i) => { const m = tg[i % Math.max(1, tg.length)], b = i / nP * TAU + 0.7; spots.push({ x: m ? m.x : x + Math.cos(b) * 1.8, y: m ? m.y : y + Math.sin(b) * 1.8, gap: Math.round(i * NP / nP) % NP, hitT: 0 }); });
    const proms = fin ? [0, 1, 2, 3, 4, 5].map(i => { const b = i / 6 * TAU + 0.25; return { x: x + Math.cos(b) * R * 0.9, y: y + Math.sin(b) * R * 0.9, t0: HIT + 0.3 + i * 0.07 }; }) : [];
    const F = H.add({ life: fin ? 5.4 : 4.8, x, y, open: 0, cz: Z + 0.45, pour: -1,
      update(dt, f) { f.open = cl((f.t - 2.75) / 0.4); if (f.t > DROP) f.cz = Math.max(0.2, Z + 0.45 - (f.t - DROP) / (HIT - DROP) * (Z + 0.25)); if (f.t < HIT) { K.aura(x, y - f.cz + 0.2, 0.9, dt, 14, 0); lit(f, 's', x, y - f.cz * 0.6, 3.6 * cl(f.t * 1.2), dt); } else if (f.t < HIT + 1.5) { K.aura(x, y, R * 0.7, dt, 18, 0); lit(f, 's', x, y, R * 1.1, dt); } for (const s of spots) if (s.hitT && f.t < s.hitT + 1) K.aura(s.x, s.y, 0.5, dt, 6, 0); },
      drawUnder(c, f, X, Y, T) { const t = f.t, k = Math.min(1, f.life / 0.7), form = H.ease.out(cl(f.t / 0.9));
        if (f.t < HIT) { const nearer = f.t > DROP ? (f.t - DROP) / (HIT - DROP) : 0; K.floorLight(c, X, Y, T * (1.8 + nearer * 1.5) * form, (0.4 + nearer * 0.4) * form); H.softShadow(c, X, Y, T * 1.5 * form, 0.2 * form); }
        for (const s of spots) if (s.hitT && t > s.hitT) K.scorch(c, H.sx(s.x), H.sy(s.y), T * 1.15, 0.8 * k, Math.max(0.1, 1 - (t - s.hitT) / 1.3), s.x);
        if (t > HIT) { const u = cl((t - HIT) / 0.6); K.scorch(c, X, Y, T * R * H.ease.out(u), 0.85 * k, Math.max(0, 1 - (t - HIT) / 1.3), 2); K.floorLight(c, X, Y, T * R * 1.1, 0.6 * (1 - cl((t - HIT) / 1.3))); }
        for (const p of proms) if (t > p.t0 + 0.4) K.scorch(c, H.sx(p.x), H.sy(p.y), T * 1.1, 0.7 * k, Math.max(0.1, 1 - (t - p.t0 - 0.4) / 1.0), p.x); },
      draw(c, f, X, Y, T, t) { const form = H.ease.out(cl(f.t / 0.9)), k = Math.min(1, f.life / 0.6), cy = Y - T * Z, r = T * 1.5 * form, CY = Y - T * f.cz, gd = petGuard(X, cy, T);
        if (f.t < HIT + 0.3) { const fall = cl((f.t - DROP) / 0.6), al = k * gd * (1 - fall);
          // the bowl: plates between a narrow foot ring and a wide rim, each a quad; the back ones show their hot inner face
          const items = []; for (let i = 0; i < NP; i++) { const b0 = i / NP * TAU + (1 - form) * 3, b1 = b0 + TAU / NP * 0.82, bm = (b0 + b1) / 2, ro = r * (1 + f.open * 0.75), rb = r * 0.55, ty = cy - f.open * r * 0.15 + fall * T * 1.5, by = cy + r * 0.62 + fall * T * 1.5, sp = 1 + (1 - form) * 1.4;
            const P4 = [[X + Math.cos(b0) * ro * sp, ty + Math.sin(b0) * ro * 0.42], [X + Math.cos(b1) * ro * sp, ty + Math.sin(b1) * ro * 0.42], [X + Math.cos(b1) * rb * sp, by + Math.sin(b1) * rb * 0.42], [X + Math.cos(b0) * rb * sp, by + Math.sin(b0) * rb * 0.42]]; items.push({ d: Math.sin(bm), P4, i }); }
          const back = items.filter(p => p.d < 0).sort((p, q) => p.d - q.d), front = items.filter(p => p.d >= 0).sort((p, q) => p.d - q.d), heat = 0.5 + 0.5 * cl((f.t - 0.6) / 1.5);
          c.save(); c.globalAlpha = al; for (const p of back) crust(c, p.P4, heat, t, p.i * 3.1, { inner: true }); c.restore();
          // the molten lip and the sun sitting in the bowl
          if (al > 0.01) { c.save(); c.globalAlpha = al; c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.6); c.lineWidth = T * 0.12; c.beginPath(); c.ellipse(X, cy, r * (1 + f.open * 0.75) * 0.95, r * 0.4, 0, Math.PI, TAU); c.stroke(); c.restore(); }
          if (f.t < HIT) sun(c, X, CY, T * 0.62 * form * (1 + cl((f.t - DROP) / 0.35) * 0.25), t, k * Math.max(gd, f.t > DROP ? 1 : 0));
          c.save(); c.globalAlpha = al; for (const p of front) crust(c, p.P4, heat * 0.85, t, p.i * 3.1 + 1, { seams: 2 }); c.restore();
          if (al > 0.01) { c.save(); c.globalAlpha = al; c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.7); c.lineWidth = T * 0.07; c.beginPath(); c.ellipse(X, cy, r * (1 + f.open * 0.75) * 0.95, r * 0.4, 0, 0, Math.PI); c.stroke(); c.restore(); }
          if (f.t > 0.9 && f.t < DROP) shimmer(c, X, cy - r * 0.6, r * 1.2, T * 1.6, t, gd); }
        // the pours: molten streams from a gap to the spot, a splash of flame where they land
        for (let i = 0; i < nP; i++) { const u = (f.t - pours[i]) / 0.5; if (u < 0 || u >= 1) continue; const s = spots[i], SX = H.sx(s.x), SY = H.sy(s.y), b = (s.gap + 0.91) / NP * TAU, gx = X + Math.cos(b) * r * 0.75, gy = cy + r * 0.35 + Math.sin(b) * r * 0.32, len = Math.min(1, u * 3.2), tail = Math.max(0, (u - 0.6) / 0.4), pts = []; for (let j = 0; j <= 9; j++) { const q = tail + (len - tail) * j / 9, e = q * q; pts.push([lerp(gx, SX, q) + Math.sin(q * 9 + t * 14) * T * 0.06, lerp(gy, SY, e)]); }
          stream(c, pts, T * 0.3, k, q => 0.55 + 0.45 * q); if (len >= 1) { const sg = petGuard(SX, SY - T * 0.5, T); K.floorLight(c, SX, SY, T * 1.3, 0.6 * k); K.flame(c, SX, SY, T * 0.55, T * 1.0 * (0.8 + 0.2 * Math.sin(t * 12)), t, i * 2, 0, k * sg); fring(c, SX, SY, T * 0.45, 4, T * 0.45, t, k * sg, t * 2, 0.4); } }
        // the blast's rolling edge, cooling as it goes
        if (f.t > HIT && f.t < HIT + 1.0) { const u = (f.t - HIT) / 1.0, e = H.ease.out(u); fring(c, X, Y, T * R * Math.min(1, e * 1.15), 16, T * (1.5 - u) * (1 - u * 0.4), t, (1 - u) * k, t * 0.5, 0.25); K.shockRing(c, X, Y, T * (R + 0.6) * e, 1 - u); if (u < 0.5) { const v = u / 0.5; K.glow(c, X, Y - T * 1.2, T * 3.4 * (1 - v * 0.5), P.yel, 0.7 * (1 - v)); for (let i = 0; i < 3; i++) K.flame(c, X + (i - 1) * T * 0.6, Y, T * (1.0 - Math.abs(i - 1) * 0.3), T * (3.6 - Math.abs(i - 1)) * (1 - v), t, i * 2.3, 0, (1 - v) * k * gd); } }
        // Celestial: solar prominences arcing out from the impact
        for (const p of proms) { const u = cl((f.t - p.t0) / 0.4); if (u <= 0 || f.t > p.t0 + 0.75) continue; const PX = H.sx(p.x), PY = H.sy(p.y), fade = 1 - cl((f.t - p.t0 - 0.4) / 0.35), pts = []; for (let j = 0; j <= 10; j++) { const q = Math.max(0, u - 0.5) + (u - Math.max(0, u - 0.5)) * j / 10; pts.push([lerp(X, PX, q), lerp(Y, PY, q) - Math.sin(q * Math.PI) * T * 2.4]); } stream(c, pts, T * 0.32, fade * k, q => 0.3 + 0.7 * q); const hd = pts[10]; H.core(c, hd[0], hd[1], T * 0.3, P.org, P.wht, fade * k); }
      } });
    pours.forEach((t0, i) => H.X.after(t0 - 0.3, () => { const s = spots[i]; H.warn(s.x, s.y, 1.15, 0.45, C.col); }));
    pours.forEach((t0, i) => H.X.after(t0, () => { F.pour = i; H.X.sfx.whoosh(); }));
    pours.forEach((t0, i) => H.X.after(t0 + 0.16, () => { const s = spots[i]; s.hitT = F.t; H.hitArea(s.x, s.y, 1.2, 6.0 / nP * D * norm, C.dmgO({ kb: 2, burn: 1 })); K.ignite(s.x, s.y, 1.1); K.sparks(s.x, s.y, 8, 5); K.flakes(s.x, s.y, 4); H.X.ring(s.x, s.y, 0.2, 1.2, 0.3, P.org, 0.4); H.X.shake(3, 0.1); H.X.sfx.thud(); }));
    H.X.after(DROP - 0.3, () => H.warn(x, y, R, HIT - DROP + 0.3, C.col));
    H.X.after(HIT, () => { H.hitArea(x, y, R + 0.3, 5.2 * D * norm, C.dmgO({ kb: 6, burn: 1, stun: 0.5 })); K.blast(x, y, R, 2.2); H.X.ring(x, y, 0.3, R + 0.3, 0.5, P.yel, 0.5); H.X.flash(0.3, '#FFE0B0'); H.fire(x, y, 1.8, 3, C.base * 0.7, 'fire'); K.flakes(x, y, 14); H.X.sfx.crash(); H.X.hitstop(0.08);
      for (let j = 0; j < H.n(30); j++) { const b = Math.random() * TAU, rr = R * (0.5 + Math.random() * 0.6); H.P({ kind: 'petal', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * 0.7 - 0.5 - Math.random(), vx: Math.cos(b) * 0.8, vy: -0.4 - Math.random() * 0.6, life: 1.6, max: 1.6, size: 4, rot: Math.random() * 6, vr: 3, color: j % 2 ? P.char : P.gold }); } });
    for (const p of proms) H.X.after(p.t0 + 0.4, () => { H.hitArea(p.x, p.y, 1.2, 0.3 * D * norm, C.dmgO({ kb: 2, burn: 1 })); K.blast(p.x, p.y, 1.0, 0.7); H.fire(p.x, p.y, 0.8, 1.6, C.base * 0.4, 'fire'); });
    return F; };

  /* ================= F-U04 Dragonkiln Procession ================= */
  // F-U04 Dragonkiln Procession: brick kiln rings (shaded bricks, glowing mortar, a white-hot interior, flames licking off them) stand along the aim; a spirit dragon of living flame rises from a fissure ahead of you and threads them: one long translucent twisting band of fire with a pale white-hot back edge, great translucent ribbed fin membranes, a long narrow head with a glowing eye and swept-back horns, and a flame tail fin, growing at each ring as it flares; it coils round the last and detonates into a spiralling fire crown
  // Evolution: more rings (3 to 5, packed into the same route; the surge and ring damage split between them) and a bigger dragon through stage 6; at Celestial three dragons materialise from their own fissures one after another, each threading its own procession of kilns on a fanned path and exploding at its end, the damage split between the three. Damage: its burning body surges along each stretch of route, each ring flares, the coil detonates.
  U.dragonkiln = (C, h) => { H = h; K = FK.bind(H); const me = H.me, ev = K.evo(C), fin = ev >= 7, NL = fin ? 3 : 1, NR = fin ? 3 : K.evoN(C, 3, 5), GAP = Math.max(1.05, Math.min(1.8, 5.0 / NR)), STEP = 2.0 / NR, START = 0.8, D = C.base * C.K * K.evoK(C) / NL, sc0 = 1 + 0.05 * (ev - 1) * (fin ? 0.6 : 1);
    const COIL0 = START + NR * STEP + 0.05, DET0 = COIL0 + 0.75, NS = 24, speed = GAP / STEP, dT = (2.6 + 0.25 * NR) / (NS * speed);
    H.X.banner('DRAGONKILN PROCESSION', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.6;
    const BR = []; for (let i = 0; i <= 7; i++) BR.push(H.mix('#2A120A', '#C07A50', i / 7));   /* the brick tone ramp, dark to lit */
    /* a lane: one dragon's procession of kilns along its own heading, starting `delay` seconds in */
    const lanes = []; for (let l = 0; l < NL; l++) { const a = C.a + (NL > 1 ? (l - 1) * 0.95 : 0), ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca, r0 = NL > 1 && l !== 1 ? 1.8 : 1.4, x0 = me.x + ca * r0, y0 = me.y + sa * r0, delay = l === 1 ? 0 : l === 0 ? 0.35 : 0.7, rings = [];
      for (let i = 0; i < NR; i++) { const d = (i + 0.8) * GAP; rings.push({ x: x0 + ca * d, y: y0 + sa * d, d: d + l * 9, r: 0.82 + 0.25 * i / Math.max(1, NR - 1), t: delay + START + (i + 0.6) * STEP }); }
      lanes.push({ a, ca, sa, px, py, x0, y0, delay, rings, last: rings[NR - 1], COIL: COIL0, DET: delay + DET0, grow: 0, seed: l * 5.3 }); }
    /* a dragon's path in its lane: [ground x, ground y, height] at its own time tau, or null before it exists / after it detonates */
    function path(Ln, tau) { const { ca, sa, px, py, x0, y0, rings, last } = Ln, a = Ln.a, hr = i => rings[Math.max(0, Math.min(NR - 1, i))].r; if (tau < 0 || tau >= DET0) return null;
      if (tau < START) { const e = tau / START, d = 0.3 * GAP * e; return [x0 + ca * d, y0 + sa * d, -0.7 + 1.3 * H.ease.out(e)]; }
      if (tau < COIL0) { const u = (tau - START) / (COIL0 - START), d = (u * NR + 0.3) * GAP, fi = d / GAP - 0.8; let z, wv = 0; if (fi < 0) { const e = (d - 0.3 * GAP) / (0.5 * GAP); z = lerp(0.6, hr(0), cl(e)) + 0.3 * Math.sin(cl(e) * Math.PI); } else { const i0 = Math.floor(fi), fr = fi - i0; z = lerp(hr(i0), hr(i0 + 1), fr) + 0.5 * Math.sin(Math.PI * fr) * (i0 < NR - 1 ? 1 : 0.4); wv = 0.45 * Math.sin(Math.PI * fr) * (i0 % 2 ? 1 : -1); } return [x0 + ca * d + px * wv, y0 + sa * d + py * wv, z]; }
      const u = (tau - COIL0) / (DET0 - COIL0), b = a + u * TAU * 1.5, r = 1.45 * (1 - u * 0.45); return [last.x + Math.cos(b) * r, last.y + Math.sin(b) * r * 0.8, hr(NR - 1) + u * 1.8]; }
    /* a kiln ring: bricks round a torus standing across the aim; half 0 the far bricks, 1 the near ones */
    function kiln(c, R_, half, heat, form, t, T, al, Ln) { const { px, py, ca, sa } = Ln, rr = R_.r * form, CX = H.sx(R_.x), CY = H.sy(R_.y) - rr * T, Ux = (px + 0.5 * ca * Math.abs(py)) * rr * T, Uy = py * rr * T * H.GY * 0.8, Vy = -rr * T, th = T * 0.22, ox = ca * th, oy = sa * th * H.GY, NB = 12;
      const pt = (b, kk, o) => [CX + (Math.cos(b) * Ux) * kk + o * ox, CY + (Math.cos(b) * Uy + Math.sin(b) * Vy) * kk + o * oy];
      c.save(); c.globalAlpha = al;
      if (half === 0) { // the plinth and its shadow, and the far (back) face of the whole ring in shadow
        const g0 = [CX, H.sy(R_.y)], pl = [[g0[0] - Ux * 0.75 - T * 0.12, g0[1] - Uy * 0.75], [g0[0] + Ux * 0.75 + T * 0.12, g0[1] + Uy * 0.75], [g0[0] + Ux * 0.6 + T * 0.1, g0[1] + Uy * 0.6 - T * 0.28], [g0[0] - Ux * 0.6 - T * 0.1, g0[1] - Uy * 0.6 - T * 0.28]]; H.softShadow(c, g0[0], g0[1], T * rr * 0.9, 0.25); crust(c, pl, heat * 0.6, t, R_.d * 3, { seams: 1 });
        c.fillStyle = P.char; c.beginPath(); for (let j = 0; j <= 24; j++) { const p = pt(j / 24 * TAU, 1, -1); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } for (let j = 24; j >= 0; j--) { const p = pt(j / 24 * TAU, 0.6, -1); c.lineTo(p[0], p[1]); } c.closePath(); c.fill();
        if (heat > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; const gi = c.createRadialGradient(CX, CY, 0, CX, CY, rr * T * 0.62); gi.addColorStop(0, H.rgba(P.wht, 0.95 * heat)); gi.addColorStop(0.45, H.rgba(P.yel, 0.75 * heat)); gi.addColorStop(0.85, H.rgba(P.org, 0.45 * heat)); gi.addColorStop(1, H.rgba(P.red, 0)); c.fillStyle = gi; c.beginPath(); for (let j = 0; j <= 20; j++) { const p = pt(j / 20 * TAU, 0.62, 0); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.closePath(); c.fill(); c.restore(); K.glow(c, CX, CY, rr * T * 1.4, P.yel, 0.45 * heat * al); } }
      for (let i = 0; i < NB; i++) { const b0 = i / NB * TAU, b1 = (i + 0.93) / NB * TAU, bm = (b0 + b1) / 2, dep = Math.cos(bm) * py; if ((half === 1) !== (dep > 0.02)) { if (!(Math.abs(py) < 0.15 && half === 0)) continue; } if (Math.abs(py) < 0.15 && half === 1) continue;
        const q = [pt(b0, 1, 1), pt(b1, 1, 1), pt(b1, 0.6, 1), pt(b0, 0.6, 1)], nx = Math.cos(bm) * Ux, ny = Math.cos(bm) * Uy + Math.sin(bm) * Vy, nl = Math.hypot(nx, ny) || 1, L = (nx * -0.6 + ny * -0.8) / nl;
        H.poly(c, q); c.fillStyle = BR[Math.round(cl(0.5 + L * 0.5) * 7)]; c.fill(); c.strokeStyle = H.line(); c.lineWidth = 1; c.stroke();
        if (L > 0.3) { c.strokeStyle = H.rgba(P.gold, 0.35 * L); c.lineWidth = 1.2; c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.stroke(); } }
      // the glowing mortar and the white-hot inner rim
      if (heat > 0.02) { c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let i = 0; i < NB; i++) { const b = i / NB * TAU - 0.02, dep = Math.cos(b) * py; if (Math.abs(py) >= 0.15 && (half === 1) !== (dep > 0.02)) continue; if (Math.abs(py) < 0.15 && half === 1) continue; const p0 = pt(b, 1, 1), p1 = pt(b, 0.6, 1); c.strokeStyle = H.rgba(P.org, 0.8 * heat); c.lineWidth = 2; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); }
        c.strokeStyle = H.rgba(P.yel, 0.75 * heat); c.lineWidth = T * 0.06; c.beginPath(); let st = false; for (let j = 0; j <= 32; j++) { const b = j / 32 * TAU, dep = Math.cos(b) * py, on = Math.abs(py) < 0.15 ? half === 0 : (half === 1) === (dep > 0.02), p = pt(b, 0.62, 1); if (on) { st ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); st = true; } else st = false; } c.stroke(); }
      c.restore();
      if (Math.abs(py) < 0.15 ? half === 0 : half === 1) { if (heat > 0.05) { K.glow(c, CX, CY, rr * T * 2.0, P.org, 0.5 * heat * al); for (let i = -2; i <= 2; i++) { const b = -Math.PI / 2 + i * 0.62, p = pt(b, 1, 0.3), nx = Math.cos(b) * Ux, ny = Math.cos(b) * Uy + Math.sin(b) * Vy; K.flame(c, p[0], p[1] + T * 0.06, T * 0.34 * (1 - Math.abs(i) * 0.12), T * (0.95 - Math.abs(i) * 0.12) * heat * (0.8 + 0.2 * Math.sin(t * 10 + i * 1.7 + R_.d)), t, i * 2 + R_.d, nx / (Math.hypot(nx, ny) || 1) * T * 0.35, al, true); } } } }
    /* the spirit dragon's head at screen (X, Y) heading ang, hs its size: a long narrow angular skull and jaw of translucent
       fire, a pale hot edge along its brow, a glowing eye, two horn spikes swept back, flame wisps off the nape */
    function head(c, X, Y, ang, hs, grow, t, al) { c.save(); c.translate(X, Y); c.rotate(ang); if (Math.cos(ang) < 0) c.scale(1, -1); c.globalAlpha = al;
      for (let i = 0; i < 2 + Math.min(2, grow >> 1); i++) sflame(c, -hs * 0.2 - i * hs * 0.25, -hs * 0.25 + i * hs * 0.1, Math.PI + 0.7 - i * 0.2, hs * 0.4, hs * (0.9 + 0.1 * grow), t, i * 2.1, 0.85);
      const hl = hs * (1.0 + 0.15 * Math.min(4, grow)); c.lineJoin = 'round';
      for (const [dy, k] of [[0.02, 0.75], [-0.1, 1]]) { const hp = [[hs * 0.1, -hs * 0.28 + dy * hs], [-hl, -hs * (0.75 + 0.2 * k) + dy * hs], [-hs * 0.05, -hs * 0.12 + dy * hs]]; const g = c.createLinearGradient(hs * 0.1, 0, -hl, -hs); g.addColorStop(0, H.rgba(P.yel, 0.95 * k)); g.addColorStop(1, H.rgba(P.wht, 0.2)); H.poly(c, hp); c.fillStyle = g; c.fill(); c.strokeStyle = H.rgba(P.wht, 0.6 * k); c.lineWidth = 1; c.stroke(); }
      const skull = [[-hs * 0.35, -hs * 0.32], [hs * 0.45, -hs * 0.36], [hs * 1.95, -hs * 0.1], [hs * 2.05, hs * 0.02], [hs * 0.9, hs * 0.06], [-hs * 0.35, hs * 0.12]], jaw = [[-hs * 0.25, hs * 0.1], [hs * 1.75, hs * 0.08 + hs * 0.1 * (0.5 + 0.5 * Math.sin(t * 5))], [hs * 1.2, hs * 0.3], [-hs * 0.3, hs * 0.32]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * 0.45; c.fillStyle = P.org; c.beginPath(); c.ellipse(hs * 0.7, 0, hs * 1.6, hs * 0.6, 0, 0, TAU); c.fill(); c.restore();
      let g = c.createLinearGradient(0, -hs * 0.36, 0, hs * 0.12); g.addColorStop(0, H.rgba(P.yel, 0.95)); g.addColorStop(0.5, H.rgba(P.org, 0.85)); g.addColorStop(1, H.rgba(P.red, 0.8)); H.poly(c, skull); c.fillStyle = g; c.fill();
      g = c.createLinearGradient(0, hs * 0.08, 0, hs * 0.32); g.addColorStop(0, H.rgba(P.red, 0.85)); g.addColorStop(1, H.rgba(P.dred, 0.6)); H.poly(c, jaw); c.fillStyle = g; c.fill();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.wht, 0.9); c.lineWidth = Math.max(1.5, hs * 0.07); c.beginPath(); c.moveTo(-hs * 0.35, -hs * 0.32); c.lineTo(hs * 0.45, -hs * 0.36); c.lineTo(hs * 1.95, -hs * 0.1); c.stroke();
      c.strokeStyle = H.rgba(P.yel, 0.8); c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 4; i++) { const x = hs * (0.5 + i * 0.32); c.moveTo(x, hs * 0.06); c.lineTo(x + hs * 0.05, hs * 0.16); } c.stroke();
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = H.rgba(P.dred, 0.7); c.lineWidth = 1.2; H.poly(c, jaw, true); c.stroke();
      K.glow(c, hs * 0.55, -hs * 0.12, hs * 0.55, P.yel, 0.9); c.fillStyle = P.wht; c.beginPath(); c.ellipse(hs * 0.55, -hs * 0.13, hs * 0.11, hs * 0.07, -0.15, 0, TAU); c.fill();
      sflame(c, hs * 2.0, 0, 0.1, hs * 0.25, hs * (0.5 + 0.2 * Math.sin(t * 13)), t, 9, 0.8);
      c.restore(); }
    /* one long spirit body of living flame along screen spine pts (head first), half-widths ws: a flat band that twists (its
       width breathing as it turns), translucent layered fills (a soft glow, a red-orange body, an orange inner body, a hot
       core), a pale white-hot edge along its back and a dark red underside, large translucent fin membranes with glowing ribs
       sweeping back off it, flame wisps streaming off the back and the fins, a flame tail fin */
    function body(c, pts, ws0, t, a, grow, seed, fins, tail) { const n = pts.length; if (n < 3 || !(a > 0.01)) return; const L = [], R = [], nr = [], ws = ws0.map((w, i) => w * (0.5 + 0.5 * Math.abs(Math.cos(i * 0.32 + t * 2.2 + seed))));
      for (let i = 0; i < n; i++) { const p = pts[Math.max(0, i - 1)], q = pts[Math.min(n - 1, i + 1)]; let dx = q[0] - p[0], dy = q[1] - p[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; let nx = -dy, ny = dx; if (ny < 0) { nx = -nx; ny = -ny; } nr.push([nx, ny]); L.push([pts[i][0] - nx * ws[i], pts[i][1] - ny * ws[i]]); R.push([pts[i][0] + nx * ws[i], pts[i][1] + ny * ws[i]]); }   /* (L: the back, up the screen; R: the underside) */
      const shape = k => { c.beginPath(); for (let i = 0; i < n; i++) { const p = pts[i], w = ws[i] * k; i ? c.lineTo(p[0] - nr[i][0] * w, p[1] - nr[i][1] * w) : c.moveTo(p[0] - nr[i][0] * w, p[1] - nr[i][1] * w); } for (let i = n - 1; i >= 0; i--) { const p = pts[i], w = ws[i] * k; c.lineTo(p[0] + nr[i][0] * w, p[1] + nr[i][1] * w); } c.closePath(); };
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
      // the fins: translucent flame membranes fanning back off the back, glowing ribs, wisps off their tips
      if (fins) for (const u of fins) { const i = Math.min(n - 2, Math.max(1, Math.round(u * (n - 1)))), b = L[i], tx = pts[i + 1][0] - pts[i - 1][0], ty = pts[i + 1][1] - pts[i - 1][1], tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, nx = -nr[i][0], ny = -nr[i][1], F_ = ws0[i] * 3.6 * (1 + 0.06 * grow), fl = Math.sin(t * 6 + i + seed) * 0.15, tips = [];
        for (let k = 0; k <= 4; k++) { const s = k / 4, back = 0.45 + s * 1.0, out = 0.8 * (1 - s * 0.5) * (1 + fl * (1 - s)); tips.push([b[0] + ux * F_ * back + nx * F_ * out, b[1] + uy * F_ * back + ny * F_ * out]); }
        const base2 = [b[0] + ux * F_ * 0.9, b[1] + uy * F_ * 0.9]; c.globalAlpha = a; const g = c.createLinearGradient(b[0], b[1], tips[2][0], tips[2][1]); g.addColorStop(0, H.rgba(P.yel, 0.95)); g.addColorStop(0.45, H.rgba(P.amb, 0.8)); g.addColorStop(1, H.rgba(P.red, 0.4));
        c.beginPath(); c.moveTo(b[0], b[1]); for (let k = 0; k <= 4; k++) { const p = tips[k], q = tips[Math.max(0, k - 1)]; k ? c.quadraticCurveTo((p[0] + q[0]) / 2 - nx * F_ * 0.08, (p[1] + q[1]) / 2 - ny * F_ * 0.08, p[0], p[1]) : c.lineTo(p[0], p[1]); } c.lineTo(base2[0], base2[1]); c.closePath(); c.fillStyle = g; c.fill(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * a; c.fill(); c.globalAlpha = a;
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.7); c.lineWidth = 1.3; c.beginPath(); for (let k = 0; k <= 4; k++) { const s = k / 4; c.moveTo(lerp(b[0], base2[0], s), lerp(b[1], base2[1], s)); c.lineTo(tips[k][0], tips[k][1]); } c.stroke(); c.strokeStyle = H.rgba(P.wht, 0.55); c.lineWidth = 1.6; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(tips[0][0], tips[0][1]); c.stroke(); c.globalCompositeOperation = 'source-over';
        c.restore(); sflame(c, tips[0][0], tips[0][1], Math.atan2(uy * 0.7 - 0.7, ux * 0.7), F_ * 0.22, F_ * 0.5, t, i + seed, 0.8 * a); c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; }
      if (tail) { const e = pts[n - 1], p = pts[n - 3], dx = e[0] - p[0], dy = e[1] - p[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, fw = ws0[2] * 1.6; c.globalAlpha = 0.8 * a; const g = c.createLinearGradient(e[0], e[1], e[0] + ux * fw * 2.2, e[1] + uy * fw * 2.2); g.addColorStop(0, P.yel); g.addColorStop(0.5, P.org); g.addColorStop(1, H.rgba(P.red, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(e[0] - uy * fw * 0.2, e[1] + ux * fw * 0.2); for (let k = 0; k <= 4; k++) { const b = (k / 4 - 0.5) * 1.6 + Math.sin(t * 7 + k) * 0.15, l = fw * (1.6 + 0.6 * Math.sin(k * 1.7 + t * 5)); c.quadraticCurveTo(e[0] + (ux * Math.cos(b) - uy * Math.sin(b)) * l * 0.6, e[1] + (uy * Math.cos(b) + ux * Math.sin(b)) * l * 0.6, e[0] + (ux * Math.cos(b) - uy * Math.sin(b)) * l, e[1] + (uy * Math.cos(b) + ux * Math.sin(b)) * l); } c.lineTo(e[0] + uy * fw * 0.2, e[1] - ux * fw * 0.2); c.closePath(); c.fill(); }
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 * a; c.fillStyle = P.org; shape(1.6); c.fill();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.62 * a; c.fillStyle = '#D8401A'; shape(1); c.fill();
      c.globalAlpha = 0.7 * a; c.fillStyle = P.org; shape(0.62); c.fill();
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.75 * a; c.fillStyle = P.yel; shape(0.26); c.fill();
      // the pale white-hot edge along its back, the dark red underside
      c.globalAlpha = a; c.strokeStyle = H.rgba(P.wht, 0.85); c.lineWidth = Math.max(2, ws0[2] * 0.35); H.poly(c, L, false); c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.5); c.lineWidth = Math.max(4, ws0[2] * 0.8); H.poly(c, L, false); c.stroke();
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = H.rgba(P.dred, 0.7); c.lineWidth = Math.max(1.5, ws0[2] * 0.25); H.poly(c, R, false); c.stroke();
      c.restore();
      // flame wisps streaming back off its back edge
      for (let i = 3; i < n - 2; i += 4) { const p = L[i], q = pts[Math.min(n - 1, i + 2)], bx = q[0] - pts[i][0], by = q[1] - pts[i][1], bl = Math.hypot(bx, by) || 1; sflame(c, p[0], p[1], Math.atan2(by / bl * 0.7 - 0.7, bx / bl * 0.7), ws0[i] * 0.9, ws0[i] * (1.8 + 0.2 * grow), t, i * 1.7 + seed, 0.75 * a); }
    }
    const D_ = H.add({ life: DET0 + lanes[NL - 1].delay + 1.15, x: me.x, y: me.y,
      update(dt, f) { for (const Ln of lanes) { const tau = f.t - Ln.delay, p = path(Ln, tau), last = Ln.last; if (p && p[2] > 0) { K.aura(p[0], p[1], 0.5 * (1 + Ln.grow * 0.12), dt, NL > 1 ? 8 : 14, p[2]); lit(f, 'h' + Ln.seed, p[0], p[1], 2.8, dt); }
          if (tau > 0 && tau < 1.2) lit(f, 'r' + Ln.seed, (Ln.x0 + last.x) / 2, (Ln.y0 + last.y) / 2, NR * GAP * 0.6, dt); for (const R_ of Ln.rings) if (f.t > R_.t && f.t < Ln.DET + 0.4) K.aura(R_.x, R_.y, 0.6, dt, NL > 1 ? 2 : 4, R_.r * 1.6); if (f.t > Ln.DET && f.t < Ln.DET + 1.2) { K.aura(last.x, last.y, 2.2, dt, NL > 1 ? 9 : 16, 0.3); lit(f, 'd' + Ln.seed, last.x, last.y, 4, dt); } } },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.8);
        for (const Ln of lanes) { const { x0, y0, px, py, ca, rings, last } = Ln, tau = f.t - Ln.delay, form = H.ease.out(cl(tau / 0.7));
          // the fissure it rises from, the scorched route, the kilns' light on the floor
          const FX = H.sx(x0), FY = H.sy(y0), fis = cl(tau / 0.3) * cl((START + 0.9 - tau) / 0.5); if (fis > 0) { K.scorch(c, FX, FY, T * 1.0, fis, fis, 1); K.floorLight(c, FX, FY, T * 1.4, 0.7 * fis); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.8 * fis); c.lineWidth = 2.5; c.beginPath(); c.moveTo(FX - px * T * 0.7, FY - py * T * 0.7 * H.GY); c.lineTo(FX + px * T * 0.1 + ca * T * 0.1, FY + py * T * 0.05); c.lineTo(FX + px * T * 0.7, FY + py * T * 0.7 * H.GY); c.stroke(); c.restore(); }
          if (tau > 0) for (let i = 0; i < NR; i++) { const R_ = rings[i], RX = H.sx(R_.x), RY = H.sy(R_.y), on = f.t > R_.t, heat = on ? Math.max(0.5, 1 - (f.t - R_.t) / 2.5) : 0.4 * form; K.floorLight(c, RX, RY, T * (1.8 + R_.r), (0.45 + 0.5 * heat) * k * form); if (on) K.scorch(c, RX, RY, T * (1.3 + i * 0.15), 0.75 * k, heat, i * 2.2); }
          const p = path(Ln, tau); if (p && p[2] > 0) H.softShadow(c, H.sx(p[0]), H.sy(p[1]), T * 0.6, 0.2);
          if (f.t > Ln.DET) { const u = cl((f.t - Ln.DET) / 0.5); K.scorch(c, H.sx(last.x), H.sy(last.y), T * 3.0 * H.ease.out(u), 0.85 * k, Math.max(0, 1 - (f.t - Ln.DET) / 1.3), 6); K.floorLight(c, H.sx(last.x), H.sy(last.y), T * 3.6, 0.6 * (1 - cl((f.t - Ln.DET) / 1.1))); } } },
      draw(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.6), items = [];
        for (const Ln of lanes) { const tau = f.t - Ln.delay; if (tau < 0) continue; const form = H.ease.out(cl(tau / 0.7)), grow = Ln.grow, sc = sc0 * (1 + grow * 0.1), last = Ln.last;
          Ln.rings.forEach((R_, i) => { const lastGone = i === NR - 1 ? cl((f.t - Ln.DET) / 0.25) : 0; if (lastGone >= 1) return; const heat = f.t > R_.t ? 0.75 + 0.25 * Math.max(0, 1 - (f.t - R_.t) / 0.8) : (0.45 + 0.1 * Math.sin(t * 3 + i)) * form, al = k * (1 - lastGone) * petGuard(H.sx(R_.x), H.sy(R_.y) - R_.r * T, T); items.push({ y: R_.y - 0.001, draw: () => kiln(c, R_, 0, heat, form, t, T, al, Ln) }, { y: R_.y + 0.001, draw: () => kiln(c, R_, 1, heat, form, t, T, al, Ln) }); });
          // the body, sampled back along its path; split into a few pieces so it threads the kilns in depth
          const sp = []; for (let j = 0; j < NS; j++) { const p = path(Ln, tau - j * dT); if (!p || p[2] < -0.05) break; sp.push(p); }
          if (sp.length > 2) { const scr = sp.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]), ws = sp.map((p, j) => { const u = j / (NS - 1); return T * 0.36 * sc * (u < 0.12 ? 0.72 + u / 0.12 * 0.28 : 1 - (u - 0.12) / 0.88 * 0.86) * (p[2] < 0.25 ? 0.5 + 0.5 * cl(p[2] / 0.25) : 1); }), gd = petGuard(scr[0][0], scr[0][1], T, T * 0.3);
            const CH = 4, per = Math.ceil((scr.length - 1) / CH); for (let ch = 0; ch < CH; ch++) { const i0 = ch * per, i1 = Math.min(scr.length - 1, i0 + per); if (i1 - i0 < 1) break; const sub = scr.slice(i0, i1 + 1), sw = ws.slice(i0, i1 + 1), mid = sp[Math.floor((i0 + i1) / 2)], uL = [i0 / (NS - 1), i1 / (NS - 1)], lg = [0.2, 0.5].filter(u => u >= uL[0] && u < uL[1]).map(u => (u - uL[0]) / (uL[1] - uL[0])), isTail = i1 === scr.length - 1 && scr.length > NS * 0.7;
              items.push({ y: mid[1], draw: () => { if (ch === 0) K.glow(c, sub[0][0], sub[0][1], T * 1.4 * sc, P.org, 0.4 * k); body(c, sub, sw, t, k * Math.min(gd, petGuard(sub[Math.floor(sub.length / 2)][0], sub[Math.floor(sub.length / 2)][1], T, T * 0.6)), grow, ch * 3 + Ln.seed, lg, isTail); } }); }
            const hd = scr[0], nx = scr[1], ang = Math.atan2(hd[1] - nx[1], hd[0] - nx[0]), clip = cl(sp[0][2] / 0.3 + 0.2); items.push({ y: sp[0][1] + 0.0005, draw: () => { K.glow(c, hd[0], hd[1], T * 1.5 * sc, P.org, 0.6 * k * gd); K.glow(c, hd[0], hd[1], T * 0.7 * sc, P.yel, 0.4 * k * gd); head(c, hd[0], hd[1], ang, T * 0.38 * sc, grow, t, k * clip * gd); } }); }
          // the detonation: a spiralling crown of flame, the kiln's bricks flung out
          if (f.t > Ln.DET && f.t < Ln.DET + 1.1) { const u = (f.t - Ln.DET) / 1.1, LX = H.sx(last.x), LY = H.sy(last.y), NF = NL > 1 ? 8 : 12; for (let i = 0; i < NF; i++) { const u2 = (i / NF + u * 0.8) % 1, b = u2 * TAU * 2 + t, r = T * (2.2 - u2 * 1.4) * Math.min(1, u * 3), gx = LX + Math.cos(b) * r, gy = LY - T * 0.3 - u2 * T * 3.6 + Math.sin(b) * r * 0.45; K.flame(c, gx, gy, T * 0.4 * (1 - u2 * 0.5), T * 1.0 * (1 - u2 * 0.5) * (1 - u * 0.5), t, i * 1.3, 0, (1 - u) * (1 - u2 * 0.3) * k, true); } K.glow(c, LX, LY - T * 1.8, T * 2.8 * (1 - u), P.org, 0.55 * (1 - u)); if (u < 0.5) K.shockRing(c, LX, LY, T * 3.4 * H.ease.out(u * 2), 1 - u * 2); shimmer(c, LX, LY - T * 1, T * 1.8, T * 3, t, 1 - u);
            for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.4, e = H.ease.out(cl(u * 2)), bx = LX + Math.cos(b) * T * 2.4 * e, by = LY - T * last.r - Math.sin(b) * T * 0.6 * e - T * 1.6 * e + T * 4 * e * e * 0.6; if (u < 0.6) crust(c, [[bx - T * 0.14, by - T * 0.1], [bx + T * 0.16, by - T * 0.12], [bx + T * 0.12, by + T * 0.1], [bx - T * 0.12, by + T * 0.12]], 1 - u, t, i * 1.3, { seams: 1 }); } } }
        items.sort((p, q) => p.y - q.y).forEach(it => it.draw()); } });
    for (const Ln of lanes) { const { rings, ca, sa, a, x0, y0, last } = Ln;
      /* the surges: as the dragon reaches each ring its body has burned the stretch of route behind it (each monster once per surge) */
      rings.forEach((R_, i) => H.X.after(R_.t - 0.05, () => { const sx0 = i ? rings[i - 1].x : me.x + ca * 0.5, sy0 = i ? rings[i - 1].y : me.y + sa * 0.5, ex = i === NR - 1 ? R_.x + ca * GAP * 0.6 : R_.x, ey = i === NR - 1 ? R_.y + sa * GAP * 0.6 : R_.y; H.hitLine(sx0, sy0, a, Math.hypot(ex - sx0, ey - sy0), 2.6, 3.6 / NR * D, C.dmgO({ kb: 1.5, burn: 1 })); for (let j = 0; j < 4; j++) { const u = (j + 0.5) / 4; K.embers(lerp(sx0, ex, u), lerp(sy0, ey, u), 3, { v: 2 }); } }));
      H.X.after(Ln.delay, () => H.warnLine(x0, y0, a, NR * GAP + 1.2, 2.4, 1.2, C.col));
      H.X.after(Ln.delay + START * 0.6, () => { H.hitArea(x0, y0, 1.9, 0.6 * D, C.dmgO({ kb: 2, burn: 1 })); K.blast(x0, y0, 1.3, 0.8); K.flakes(x0, y0, 6); H.X.sfx.thud(); });   /* (the fissure bursting as it rises) */
      rings.forEach((R_, i) => H.X.after(R_.t, () => { Ln.grow = i + 1; const w = (3.3 / NR) * (0.8 + 0.4 * i / Math.max(1, NR - 1)); H.hitArea(R_.x, R_.y, 1.6 + i * 0.12, w * D, C.dmgO({ kb: 2 + i * 0.5, burn: 1 })); K.blast(R_.x, R_.y, 1.4 + i * 0.15, NL > 1 ? 0.7 : 1); H.X.ring(R_.x, R_.y, 0.2, 1.6 + i * 0.12, 0.3, P.org, 0.45); K.sparks(R_.x, R_.y - R_.r, 10, 5); H.X.sfx.thud(); }));
      H.X.after(Ln.DET - 0.35, () => H.warn(last.x, last.y, 3.2 * C.K, 0.35, C.col));
      H.X.after(Ln.DET, () => { H.hitArea(last.x, last.y, 3.2 * C.K, 4.8 * D, C.dmgO({ kb: 6, burn: 1, stun: 0.5 })); K.blast(last.x, last.y, 3.0, NL > 1 ? 1.6 : 2.2); H.X.ring(last.x, last.y, 0.3, 3.2 * C.K, 0.5, P.yel, 0.5); H.X.flash(0.25, '#FFE0B0'); H.fire(last.x, last.y, 1.8, 3, C.base * 0.7, 'fire'); K.flakes(last.x, last.y, 16); H.X.sfx.crash(); H.X.hitstop(0.06); }); }
    return D_; };

  /* ================= F-U05 Crimson Lotus Forge ================= */
  /* a lotus petal standing at screen (X, Y): w wide, ph tall, leaning by tilt (shear) and foreshortened by sq; its outer
     face molten crust, its inner face (shown by inner 0..1) glowing, a hot midrib */
  function petal(c, X, Y, w, ph, tilt, sq, inner, heat, t, seed, a) { if (ph < 2 || !(a > 0.01)) return; c.save(); c.translate(X, Y); c.transform(1, 0, tilt, sq, 0, 0); c.globalAlpha = a;
    const side = [], N = 5; for (let j = 0; j <= N; j++) { const v = j / N, hw = w * 0.5 * (0.28 + 0.72 * Math.pow(Math.sin(Math.PI * Math.min(0.98, v * 0.92 + 0.04)), 0.8)) * (1 - v * 0.25); side.push([hw, -ph * v]); } const pts = side.map(p => [-p[0], p[1]]).concat(side.slice().reverse().map(p => [p[0], p[1]])); pts.splice(N, 1, [0, -ph * 1.04]); pts.splice(N + 1, 1);
    crust(c, pts, heat, t, seed, { seams: 2 });
    if (inner > 0.02) { const ip = pts.map(p => [p[0] * 0.72, p[1] * 0.97 - ph * 0.02]); c.save(); c.globalAlpha = a * inner; const g = c.createLinearGradient(0, 0, 0, -ph); g.addColorStop(0, P.wht); g.addColorStop(0.3, P.yel); g.addColorStop(0.7, P.org); g.addColorStop(1, P.red); H.poly(c, ip); c.fillStyle = g; c.fill(); c.strokeStyle = H.rgba(P.dred, 0.7); c.lineWidth = 1.2; c.stroke(); c.restore(); }
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = H.rgba(P.org, 0.7 * heat); c.lineWidth = Math.max(1.5, w * 0.08); c.beginPath(); c.moveTo(0, -ph * 0.05); c.quadraticCurveTo(w * 0.05, -ph * 0.5, 0, -ph * 0.9); c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.8 * heat); c.lineWidth = Math.max(0.8, w * 0.03); c.stroke(); c.restore();
    c.restore(); }
  // F-U05 Crimson Lotus Forge: heavy molten petals rise round the aim, crusted dark and split by glowing seams, and unfold into a fire lotus whose inner faces glow, flame sweeps racing between its layers; the bud erupts last as a pillar of fire and the petals break into cooling embers
  // Evolution: a third ring of petals from Guardian-ish stage 4, more petals per ring, more sweeps (2 to 4, their damage split), a wider bloom; at Celestial six lotus seeds bloom round the rim after the bud and burst.
  U.crimsonlotus = (C, h) => { H = h; K = FK.bind(H); const x = C.tx, y = C.ty, ev = K.evo(C), R = 3.2 * C.K * (1 + 0.04 * (ev - 1)), nSw = K.evoN(C, 2, 4), BUD = 3.2, fin = ev >= 7, D = C.base * C.K * K.evoK(C), norm = fin ? 10 / 11.8 : 1;
    const sweeps = []; for (let i = 0; i < nSw; i++) sweeps.push(1.4 + i * (1.0 / Math.max(1, nSw - 1)));
    const layers = [[K.evoN(C, 7, 10), 0.85, 1.65, 0.2, 0.6], [K.evoN(C, 5, 7), 0.55, 1.45, 0.65, 0.42]]; if (ev >= 4) layers.push([K.evoN(C, 3, 5), 0.3, 1.2, 1.1, 0.25]);
    const seeds = fin ? [0, 1, 2, 3, 4, 5].map(i => { const b = i / 6 * TAU + 0.5; return { x: x + Math.cos(b) * R * 0.95, y: y + Math.sin(b) * R * 0.95 }; }) : [];
    H.warn(x, y, R + 0.4, 1.3, C.col); H.X.banner('CRIMSON LOTUS FORGE', '', C.col, 1.4); H.X.sfx.hum();
    const F = H.add({ life: fin ? 5.3 : 4.7, x, y,
      update(dt, f) { if (f.t < BUD) K.aura(x, y, R * 0.7 * cl(f.t), dt, 10 + 10 * cl((f.t - 1.2) / 1.5), 0.6); else if (f.t < BUD + 1.4) K.aura(x, y, R * 0.6, dt, 20, 0.2); if (f.t < BUD + 1.2) lit(f, 'c', x, y - 0.5, R * (0.6 + 0.5 * cl((f.t - 1) / 2)), dt); },
      drawUnder(c, f, X, Y, T, t) { const k = H.fade(f, 0.4, 0.7), heat = 0.5 + 0.5 * cl((f.t - 1.2) / 1.5); c.save(); c.globalAlpha = k;
        K.floorLight(c, X, Y, T * R * 1.15, 0.45 * heat); const g = c.createRadialGradient(X, Y, 0, X, Y, R * T); g.addColorStop(0, H.rgba(P.dred, 0.45)); g.addColorStop(0.75, H.rgba(P.dred, 0.25)); g.addColorStop(1, H.rgba(P.dred, 0)); c.save(); c.translate(X, Y); c.scale(1, H.GY); c.beginPath(); c.arc(0, 0, R * T, 0, TAU); c.restore(); c.fillStyle = g; c.fill();
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.2, gl = 0.45 + 0.25 * Math.sin(t * 6 + i); c.strokeStyle = H.rgba(P.org, gl * heat); c.lineWidth = 2.5; c.beginPath(); c.moveTo(X + Math.cos(b) * T * 0.4, Y + Math.sin(b) * T * 0.4 * H.GY); c.quadraticCurveTo(X + Math.cos(b + 0.3) * R * T * 0.6, Y + Math.sin(b + 0.3) * R * T * 0.6 * H.GY, X + Math.cos(b) * R * T, Y + Math.sin(b) * R * T * H.GY); c.stroke(); c.strokeStyle = H.rgba(P.yel, gl * heat * 0.7); c.lineWidth = 1; c.stroke(); }
        c.strokeStyle = H.rgba(P.org, 0.5 * heat); c.lineWidth = 2; H.floorEllipse(c, X, Y, R * T); c.stroke(); c.restore();
        if (f.t > BUD) K.scorch(c, X, Y, T * R * 0.75, k, Math.max(0.1, 1 - (f.t - BUD) / 1.3), 3);
        for (const s of seeds) if (f.t > BUD + 0.75) K.scorch(c, H.sx(s.x), H.sy(s.y), T * 1.1, 0.7 * k, Math.max(0.1, 1 - (f.t - BUD - 0.75) / 1.0), s.x); },
      draw(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.7), rise = H.ease.out(cl(f.t / 1.0)), open = H.ease.io(cl((f.t - 1.2) / 0.9)), bud = cl((f.t - 2.8) / 0.4), frag = cl((f.t - BUD) / 0.9), items = [];
        layers.forEach(([n, rr, hh, off, lean0], li) => { for (let i = 0; i < n; i++) { const b = i / n * TAU + off, lean = lean0 * open, px = X + Math.cos(b) * rr * R * T * (1 + lean * 0.35), py = Y + Math.sin(b) * rr * R * T * H.GY * (1 + lean * 0.35), dep = Math.sin(b);
          items.push({ y: py, draw: () => { const ph = T * hh * rise, w = T * (1.0 + 0.15 * (1 - li * 0.5)) * rise, tilt = Math.cos(b) * lean * 0.75, drop = frag * frag * T * 1.6, gd = petGuard(px, py - ph * 0.5, T), al = k * (1 - frag) * gd, heat = 0.4 + 0.6 * Math.max(open * 0.75, bud) * (0.75 + 0.25 * Math.sin(t * 7 + i + li));
            H.softShadow(c, px, py, w * 0.8, 0.2 * rise * (1 - frag)); petal(c, px + Math.cos(b) * frag * T * 0.6, py + drop, w, ph * (1 - frag * 0.3), tilt, 1 - lean * 0.3, dep < 0 ? open : open * 0.25, heat, t, i * 2.3 + li * 7, al);
            if (li === 0 && open > 0.3 && frag < 0.5 && i % 2 === 0) { const tx = px + tilt * -ph * (1 - lean * 0.3) * 0.98, ty = py - ph * (1 - lean * 0.3); K.flame(c, tx, ty + T * 0.05, w * 0.32 * open, ph * 0.35 * open, t, i * 2 + li, Math.cos(b) * w * 0.3, 0.9 * al * (1 - frag * 2), true); } } }); } });
        // the bud: five crust petals closed round a white heart that swells, then bursts
        items.push({ y: Y + 0.01, draw: () => { if (frag >= 1) return; const br = T * 0.62 * rise * (1 + bud * 0.15), heat = 0.4 + 0.6 * Math.max(open * 0.6, bud), gd = petGuard(X, Y - br, T); H.softShadow(c, X, Y, br, 0.22); if (bud > 0 && f.t < BUD + 0.1) H.core(c, X, Y - br * 0.9, br * (0.5 + 0.6 * bud), P.org, P.wht, bud * gd);
          for (let i = 0; i < 5; i++) { const b = i / 5 * TAU - Math.PI / 2, sp = bud * 0.6 + frag, d = Math.sin(b); petal(c, X + Math.cos(b) * br * 0.3 * (1 + sp * 1.8), Y - br * 0.15 + d * br * 0.12 + frag * T, br * 0.75, br * 1.7 * (1 - frag * 0.4), Math.cos(b) * sp * 0.8, 1, bud * 0.5, heat * (0.8 + 0.2 * Math.sin(t * 9 + i)), t, i * 5.1 + 40, k * (1 - frag) * gd); } } });
        items.sort((p, q) => p.y - q.y).forEach(it => it.draw());
        // the flame sweeps racing round between the layers
        for (const t0 of sweeps) { const u = (f.t - t0) / 0.4; if (u <= 0 || u >= 1) continue; for (let j = 0; j < 2; j++) { const rr = T * R * (0.73 + j * 0.3) * (0.8 + 0.2 * u), a0 = u * TAU * 1.1 + j * 2.1 + t0 * 3, al = k * (1 - u * 0.6) * Math.sin(u * Math.PI); for (const off of [0, Math.PI]) { const pts = []; for (let q = 0; q <= 10; q++) { const b = a0 + off + q / 10 * 1.7; pts.push([X + Math.cos(b) * rr, Y - T * 0.35 + Math.sin(b) * rr * H.GY]); } K.floorLight(c, pts[10][0], pts[10][1] + T * 0.35, T * 1.4, 0.5 * al); stream(c, pts, T * 0.3, al, q => 0.2 + 0.8 * q); for (let q = 4; q <= 10; q += 3) { const p = pts[q]; K.flame(c, p[0], p[1] + T * 0.2, T * 0.32, T * 0.8 * (q / 10), t, q + j * 5, -Math.sin(a0 + off + q / 10 * 1.7) * T * 0.3, al * petGuard(p[0], p[1], T), true); } } } }
        // the bud's eruption: a pillar of flame and a white flash rising
        if (f.t > BUD && f.t < BUD + 0.9) { const u = (f.t - BUD) / 0.9, pa = Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - u), gd = petGuard(X, Y - T * 1.5, T); K.glow(c, X, Y - T * 2.2 * u, T * 2.6 * (1 - u * 0.5), P.yel, 0.65 * (1 - u)); for (let i = 0; i < 3; i++) K.flame(c, X + (i - 1) * T * 0.55, Y, T * (0.95 - Math.abs(i - 1) * 0.3), T * (3.8 - Math.abs(i - 1) * 1.2) * pa, t, i * 3.1, 0, k * gd * Math.min(1, pa * 1.5)); K.shockRing(c, X, Y, T * (R + 0.4) * H.ease.out(cl(u * 1.6)), 1 - cl(u * 1.6)); shimmer(c, X, Y - T * 1.5, T * 1.4, T * 3, t, 1 - u); }
        // Celestial: lotus seeds bloom round the rim, then burst
        for (const s of seeds) { const u = cl((f.t - BUD - 0.35) / 0.4), v = cl((f.t - BUD - 0.75) / 0.45); if (u <= 0 || v >= 1) continue; const SX = H.sx(s.x), SY = H.sy(s.y), gd = petGuard(SX, SY - T * 0.5, T); if (v <= 0) { for (let i = 0; i < 3; i++) petal(c, SX + (i - 1) * T * 0.22, SY, T * 0.35, T * 0.7 * H.ease.back(u), (i - 1) * 0.5 * u, 1, u, 0.9, t, i + s.x, k * gd); H.core(c, SX, SY - T * 0.4, T * 0.3 * u, P.org, P.wht, u * gd); } else { K.shockRing(c, SX, SY, T * 1.4 * H.ease.out(v), 1 - v); K.flame(c, SX, SY, T * 0.6, T * 1.8 * (1 - v), t, s.x, 0, (1 - v) * k * gd, true); } } } });
    sweeps.forEach((t0, i) => H.X.after(t0 + 0.12, () => { H.hitRing(x, y, 0.6, R + 0.5, 5.4 / nSw * D * norm, C.dmgO({ kb: 2 + i, burn: 1 })); for (const m of H.living()) if (Math.hypot(m.x - x, m.y - y) < R + 0.5) H.slow(m, 0.6); for (let j = 0; j < H.n(14); j++) { const b = Math.random() * TAU, r = R * (0.4 + Math.random() * 0.6); H.P({ kind: 'ember', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r * H.GY, vx: -Math.sin(b) * 3, vy: Math.cos(b) * 1.5 - 2, g: -1, life: 0.6, max: 0.6, size: 4, color: j % 2 ? P.org : P.yel }); } K.sparks(x, y, 6, 6); H.X.light(x, y, R * 1.3, 0.25); H.X.shake(4, 0.12); H.X.sfx.whoosh(); }));
    H.X.after(BUD - 0.35, () => H.warn(x, y, R + 0.5, 0.35, C.col));
    H.X.after(BUD, () => { H.hitArea(x, y, R + 0.5, 4.6 * D * norm, C.dmgO({ kb: 6, burn: 1, stun: 0.5 })); K.blast(x, y, R * 0.8, 2.2); H.P({ kind: 'pillar', x, y, vx: 0, vy: 0, life: 0.55, max: 0.55, size: 1.5, color: P.org }); H.X.ring(x, y, 0.3, R + 0.5, 0.5, P.yel, 0.5); H.X.flash(0.3, '#FFE0B0'); H.fire(x, y, 1.6, 3, C.base * 0.7, 'fire');
      for (let j = 0; j < H.n(26); j++) { const b = j / 26 * TAU; H.P({ kind: 'shard', x: x + Math.cos(b) * R * 0.7, y: y + Math.sin(b) * R * 0.4 - 1, vx: Math.cos(b) * 5, vy: Math.sin(b) * 2.5 - 4, g: 9, life: 0.9, max: 0.9, size: 4.5, rot: b, vr: 7, color: j % 3 ? P.char : P.gold }); H.P({ kind: 'ember', x: x + Math.cos(b) * R * 0.7, y: y + Math.sin(b) * R * 0.4 - 1, vx: Math.cos(b) * 3, vy: Math.sin(b) * 1.5 - 2, g: 2, life: 0.9, max: 0.9, size: 4, color: P.org }); } K.smoke(x, y, 6, R * 0.4); H.X.sfx.crash(); H.X.hitstop(0.08); });
    for (const s of seeds) H.X.after(BUD + 0.75, () => { H.hitArea(s.x, s.y, 1.3, 0.3 * D * norm, C.dmgO({ kb: 3, burn: 1 })); K.blast(s.x, s.y, 1.1, 0.7); K.flakes(s.x, s.y, 4); });
    return F; };
})();
