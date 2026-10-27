/* ---------- the bestiary in the round: beasts seen from above and a little in front, as the Tower's camera sees them ----------
   A heading angle turns the whole creature; its body is ellipsoids in three dimensions, its legs root at points on
   those ellipsoids and plant their feet on the ground, stepping when the body has moved too far from them. So a beast
   that turns toward you shows its chest, one walking away shows its back and haunches, and nothing is ever flipped
   flat. Built with the same painter's kit (lit volumes, textures, rim light), and no blend modes the phone dislikes. */
const FiendBeast3 = (() => {
  const TAU = Math.PI * 2, lerp = (a, b, u) => a + (b - a) * u;
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  /* a camera: world (x, y, z) to the screen, around the beast's own ground point */
  function cam(X, Y, T, m) { return (x, y, z) => [X + (x - m.x) * T, Y + (y - m.y) * T - (z || 0) * T]; }
  /* body coordinates (u along the heading, v across it to the right, z up) to world */
  function frame(m, th) { const fx = Math.cos(th), fy = Math.sin(th); return { fx, fy, w: (u, v, z) => [m.x + fx * u - fy * v, m.y + fy * u + fx * v, z || 0] }; }
  /* ---- the foot rig: feet stay planted and step when they must; turning on the spot steps them round ---- */
  function rig(M, m, th, legs, F, dt, o) {
    o = o || {}; const stride = o.stride || 0.9;
    if (!M.feet || M.feet.length !== legs.length) { M.feet = legs.map((L, i) => { const [x, y] = F.w(L.u + (L.lead || 0), L.v * (L.spread || 1), 0); return { i, x, y, lift: 0, u: 1, grp: (i + (L.v > 0 ? 1 : 0)) % 2 }; }); M.lx = m.x; M.ly = m.y; }
    const vx = (m.x - (M.lx == null ? m.x : M.lx)) / Math.max(dt, 1e-3), vy = (m.y - (M.ly == null ? m.y : M.ly)) / Math.max(dt, 1e-3), sp = Math.min(14, Math.hypot(vx, vy)); M.lx = m.x; M.ly = m.y; M.spd3 = sp;
    if (dt <= 0) return;
    const busy = [0, 0]; M.feet.forEach(f => { if (f.u < 1) busy[f.grp]++; });
    for (const f of M.feet) {
      const L = legs[f.i];
      if (f.u < 1) { f.u = Math.min(1, f.u + dt / f.dur); const e = f.u * f.u * (3 - 2 * f.u); f.x = lerp(f.x0, f.x1, e); f.y = lerp(f.y0, f.y1, e); f.lift = Math.sin(f.u * Math.PI) * (o.liftH || 0.55); if (f.u >= 1) { f.lift = 0; if (M.dust) M.dust.push([f.x, f.y]); } continue; }
      const [rx, ry] = F.w(L.u + (L.lead || 0), L.v * (L.spread || 1), 0), d = Math.hypot(f.x - rx, f.y - ry);
      if (d > (sp > 0.8 ? stride : stride * 0.45) && !busy[1 - f.grp]) { f.u = 0; f.x0 = f.x; f.y0 = f.y; const ahead = Math.min(0.9, sp * 0.14); f.x1 = rx + vx / Math.max(sp, 1e-3) * ahead; f.y1 = ry + vy / Math.max(sp, 1e-3) * ahead; f.dur = (o.stepT || 0.2) * (1 - 0.4 * Math.min(1, sp / 8)); busy[f.grp]++; }
    }
  }
  /* ---- an ellipsoid on the screen: its outline, a point on its upper surface, and a painted lit volume ---- */
  function ellipsoid(c, K, P3, th, g, A, o) {
    const [rx, ry, rot] = K.ell3(A[0], A[1], A[2], th), p = P3(g[0], g[1], g[2]);
    const path = K.ellP(c, p[0], p[1], rx * o.T, ry * o.T, rot);
    if (o.paint !== false) K.body(c, path, p[0], p[1] - ry * o.T * 0.15, Math.max(rx, ry) * o.T, Object.assign({ lx: -0.35, ly: -0.6 }, o));
    return { p, rx: rx * o.T, ry: ry * o.T, rot, path };
  }
  const surf = (K, P3, th, g, A, u, v, lift) => K.surf3(P3, g[0], g[1], g[2], A[0], A[1], A[2], th, u, v, lift);
  /* ---- a leg: hip on the body, foot on the ground, the knee bending the right way for its kind ---- */
  function leg(c, K, P3, F, L, f, o, T, zl) {
    const hip = F.w(L.u, L.v, L.z), ground = [f.x, f.y, f.lift * (L.liftK || 1)];
    // the knee sits between hip and foot, pushed forward (front legs) or back (hind legs) along the heading, and raised
    const dx = ground[0] - hip[0], dy = ground[1] - hip[1], dz = ground[2] - hip[2], dist = Math.hypot(dx, dy, dz), reach = L.l1 + L.l2;
    const k = dist > reach * 0.98 ? reach * 0.98 / dist : 1, foot = [hip[0] + dx * k, hip[1] + dy * k, hip[2] + dz * k];
    const bend = (L.side > 0 ? 1 : -1) * (L.bend == null ? 0.55 : L.bend), kneeZ = Math.max(foot[2] + L.l2 * 0.55, hip[2] - L.l1 * 0.75);
    const knee = [lerp(hip[0], foot[0], 0.45) + F.fx * bend, lerp(hip[1], foot[1], 0.45) + F.fy * bend, kneeZ], ank = [lerp(knee[0], foot[0], 0.7) - F.fx * bend * 0.4, lerp(knee[1], foot[1], 0.7) - F.fy * bend * 0.4, foot[2] + L.l2 * 0.22];
    const H = P3(...hip), Kn = P3(...knee), An = P3(...ank), Ft = P3(foot[0], foot[1], foot[2] + zl * 0);
    const far = (hip[1] - o.m.y) < -0.1 ? 1 : 0, col = K.sh(L.col || o.col, far ? -0.35 : 0), tx = { col, tex: o.tex, texA: o.texA, texS: (o.texS || 0.35) * 0.9, dk: o.dk2 || '#030204', dkA: 0.35, hiA: 0.12, rim: far ? null : o.rim, rimA: 0.2 };
    const w0 = (L.w0 || 0.8) * T * 1.25, w1 = (L.w1 || 0.4) * T * 1.25, w2 = (L.w2 || 0.28) * T * 1.2;
    K.tube(c, [H, [(H[0] + Kn[0]) / 2, (H[1] + Kn[1]) / 2], Kn], u => w0 * (1 - u) + w1 * u, tx);
    K.tube(c, [Kn, [(Kn[0] + An[0]) / 2, (Kn[1] + An[1]) / 2], An, Ft], u => w1 * (1 - u) + w2 * u, tx);
    if (o.furCols && L.fur !== false) K.tufts(c, T, [Kn, An], 0.18, 0.5, 4, 300 + L.u * 10 + L.v * 3, { cols: o.furCols });
    foot3(c, K, Ft, F, L, far, o, T);
    return { hip, knee, foot, H, Kn, Ft, far };
  }
  function foot3(c, K, Ft, F, L, far, o, T) {
    const kind = L.foot || o.foot || 'paw', w = (L.fw || 0.4) * T, col = K.sh(L.col || o.col, far ? -0.35 : -0.05), clawC = far ? K.sh(o.claw || '#D8D0C0', -0.4) : (o.claw || '#D8D0C0');
    // the foot is a flattened ellipse pointing along the heading, claws fanned at its front
    const a = Math.atan2(F.fy * 0.6, F.fx);
    if (kind === 'hoof') { K.body(c, () => { c.beginPath(); c.ellipse(Ft[0], Ft[1], w * 0.6, w * 0.4, a, 0, TAU); }, Ft[0], Ft[1], w * 0.6, { col: '#1A1418', hi: '#5A4E58', spec: 0.35 }); return; }
    K.body(c, () => { c.beginPath(); c.ellipse(Ft[0] + F.fx * w * 0.3, Ft[1] + F.fy * w * 0.2, w * 0.75, w * 0.5, a, 0, TAU); }, Ft[0], Ft[1], w * 0.7, { col, hi: K.sh(col, 0.4), tex: o.tex, texA: 0.6, texS: 0.3, spec: 0.1 });
    c.save(); c.fillStyle = clawC; const n = 3, L2 = w * (kind === 'talon' ? 0.75 : 0.42); for (let k = 0; k < n; k++) { const aa = a + (k - 1) * 0.55, bx = Ft[0] + F.fx * w * 0.75 + Math.cos(aa + Math.PI / 2) * (k - 1) * w * 0.28, by = Ft[1] + F.fy * w * 0.5 + Math.sin(aa + Math.PI / 2) * (k - 1) * w * 0.18; c.beginPath(); c.moveTo(bx - Math.sin(aa) * w * 0.1, by + Math.cos(aa) * w * 0.1); c.quadraticCurveTo(bx + Math.cos(aa) * L2 * 0.6, by + Math.sin(aa) * L2 * 0.6 * 0.6, bx + Math.cos(aa) * L2, by + Math.sin(aa) * L2 * 0.6); c.lineTo(bx + Math.sin(aa) * w * 0.1, by - Math.cos(aa) * w * 0.1); c.fill(); } c.restore();
  }
  /* ---- heads, in the round: built from ellipsoids and tubes along the heading, with the jaw as a part of its own ---- */
  function head3(c, K, P3, th, F, h, o, T) {
    const at = h.at, hs = h.hs, jaw = h.jaw || 0, fx = F.fx, fy = F.fy, kind = h.kind || 'canine', col = h.col || o.col, hi = h.hi || K.sh(col, 0.45), rim = h.rim || o.rim;
    const W = (u, v, z) => [at[0] + fx * u * hs - fy * v * hs, at[1] + fy * u * hs + fx * v * hs, at[2] + z * hs];
    const E = (g, A, opt) => ellipsoid(c, K, P3, th, g, A.map(a => a * hs), Object.assign({ T, col, hi, dk: K.sh(col, -0.55), tex: h.tex || o.tex, texA: 0.85, texS: 0.3, spec: 0.3, rim, rimA: 0.35, ao: 0.14, aoA: 0.4 }, opt || {}));
    const tube = (pts, wf, opt) => K.tube(c, pts.map(p => P3(...p)), wf, Object.assign({ col, tex: h.tex || o.tex, texA: 0.8, texS: 0.3, dk: K.sh(col, -0.6), dkA: 0.5, hiA: 0.12, rim, rimA: 0.3 }, opt || {}));
    const facingAway = fy < -0.2, side = fx;   // features on the far side draw first
    const eye = (s) => { const p = P3(...W(kind === 'croc' || kind === 'dragon' ? 0.35 : 0.42, s * (kind === 'bat' ? 0.3 : 0.44), kind === 'croc' || kind === 'dragon' ? 0.42 : 0.42)); if (facingAway && Math.abs(fy) > 0.75) return; K.eyeR(c, p[0], p[1], hs * (h.eyeR || 0.12) * T, h.eye || '#FFB347', { white: h.eyeWhite || '#1A0A0C', irisK: 0.9, ry: 0.75, slit: h.slit }); K.glow(c, p[0], p[1], hs * 0.4 * T, h.eye || '#FFB347', 0.4); };
    const ear = (s) => { if (h.ears === 0) return; const k = h.ears == null ? 1 : h.ears, b0 = W(-0.3, s * 0.42, 0.5), b1 = W(0.15, s * 0.55, 0.52), tip = W(-0.6 * k, s * 0.9 * k, 0.5 + 0.95 * k), P0 = P3(...b0), P1 = P3(...b1), Pt = P3(...tip);
      K.body(c, () => { c.beginPath(); c.moveTo(P0[0], P0[1]); c.quadraticCurveTo(lerp(P0[0], Pt[0], 0.5) - (P1[0] - P0[0]) * 0.25, lerp(P0[1], Pt[1], 0.5), Pt[0], Pt[1]); c.quadraticCurveTo(lerp(P1[0], Pt[0], 0.5) + (P1[0] - P0[0]) * 0.25, lerp(P1[1], Pt[1], 0.5), P1[0], P1[1]); c.closePath(); }, (P0[0] + P1[0] + Pt[0]) / 3, (P0[1] + P1[1] + Pt[1]) / 3, hs * T * 0.5, { col: K.sh(col, -0.08), hi, tex: h.tex || o.tex, texA: 0.8, texS: 0.3, spec: 0.1, rim, rimA: 0.3, ao: 0.1, aoA: 0.35, inner: () => { c.fillStyle = h.earIn || 'rgba(255,170,190,.3)'; c.beginPath(); c.moveTo(lerp(P0[0], P1[0], 0.3), lerp(P0[1], P1[1], 0.3)); c.lineTo(lerp(Pt[0], (P0[0] + P1[0]) / 2, 0.15), lerp(Pt[1], (P0[1] + P1[1]) / 2, 0.15)); c.lineTo(lerp(P0[0], P1[0], 0.8), lerp(P0[1], P1[1], 0.8)); c.fill(); } }); };
    const order = [-1, 1].sort((a, b) => (fx * a) - (fx * b));   // the ear/eye on the far side (further up-screen) first
    if (kind === 'canine' || kind === 'trunk') {
      if (kind === 'canine') order.forEach(ear);
      // the skull, a bridge to the muzzle, the muzzle itself; the lower jaw under it, hinged open; then the nose
      E(W(0.05, 0, 0.3), [0.66, 0.54, 0.48]); if (kind === 'trunk') ear3(c, K, P3, W, h, hs, T, order, col, hi);
      if (kind === 'canine') {
        E(W(0.78, 0, 0.24), [0.55, 0.38, 0.3], { ao: 0.06, aoA: 0.2 });
        if (jaw > 0.05) { const j0 = W(0.6, 0, 0.02), j1 = W(1.75, 0, -0.05 - jaw * 0.9); tube([j0, [(j0[0] + j1[0]) / 2, (j0[1] + j1[1]) / 2, (j0[2] + j1[2]) / 2], j1], u => hs * T * (0.44 - u * 0.2), { col: K.sh(col, -0.12), inner: () => { if (h.breath) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = jaw; const q = P3(...j1); blitSized(c, glowSprite(h.breath), q[0] - hs * T * 0.6, q[1] - hs * T * 0.6, hs * T * 1.2, hs * T * 1.2); c.restore(); } } }); const q = P3(...W(1.2, 0, 0.0 - jaw * 0.45)); c.fillStyle = h.mouth || '#4A0E16'; c.beginPath(); c.ellipse(q[0], q[1], hs * T * 0.4, hs * T * (0.1 + jaw * 0.2), Math.atan2(fy, fx), 0, TAU); c.fill(); K.teeth(c, [-0.3, 0, 0.3].map(v => { const p = P3(...W(1.1, v * 0.7, -0.08 - jaw * 0.7)); return [p[0], p[1], -Math.PI / 2, 0.5]; }), hs * T * 0.14, h.teeth || '#EFE6D2'); }
        const m0 = W(0.95, 0, 0.2), m1 = W(1.85, 0, 0.1); tube([m0, [(m0[0] + m1[0]) / 2, (m0[1] + m1[1]) / 2, (m0[2] + m1[2]) / 2 + 0.04 * hs], m1], u => hs * T * (0.52 - u * 0.22));
        K.teeth(c, [-0.35, 0.35].map(v => { const p = P3(...W(1.55, v * 0.5, 0.0)); return [p[0], p[1], Math.PI / 2, 0.5]; }), hs * T * 0.14, h.teeth || '#F0F6F2');
        const n = P3(...W(1.92, 0, 0.16)); c.fillStyle = '#060408'; c.beginPath(); c.ellipse(n[0], n[1], hs * T * 0.14, hs * T * 0.1, 0, 0, TAU); c.fill();
      } else { trunk3(c, K, P3, W, h, hs, T, col, tube); }
      order.forEach(eye);
      if (h.brow !== false) { c.save(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = Math.max(1, hs * T * 0.06); c.lineCap = 'round'; order.forEach(s => { const a = P3(...W(0.1, s * 0.5, 0.6)), b = P3(...W(0.6, s * 0.3, 0.58)); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }); c.restore(); }
    } else if (kind === 'croc' || kind === 'dragon') {
      if (kind === 'dragon') horns3(c, K, P3, W, h, hs, T, order, col);
      E(W(-0.1, 0, 0.25), [0.8, 0.7, 0.5]);
      // long flat jaws: the upper a tapered tube forward, the lower hinged down when open
      const u0 = W(0.4, 0, 0.3), u1 = W(1.9, 0, 0.22); tube([u0, [(u0[0] + u1[0]) / 2, (u0[1] + u1[1]) / 2, (u0[2] + u1[2]) / 2], u1], u => hs * T * (0.62 - u * 0.25), { inner: () => { c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; for (let k = 0; k < 6; k++) { const p = P3(...W(0.6 + k * 0.22, 0, 0.5)); c.beginPath(); c.arc(p[0], p[1], hs * T * 0.05, 0, TAU); c.fill(); } c.restore(); } });
      const l0 = W(0.4, 0, 0.0), l1 = W(1.8, 0, -jaw * 0.9); tube([l0, [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2, (l0[2] + l1[2]) / 2], l1], u => hs * T * (0.5 - u * 0.22), { col: h.belly || K.sh(col, 0.25), inner: () => { if (h.breath && jaw > 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = jaw; const q = P3(...W(1.2, 0, -jaw * 0.4)); blitSized(c, glowSprite(h.breath), q[0] - hs * T * 0.9, q[1] - hs * T * 0.9, hs * T * 1.8, hs * T * 1.8); c.restore(); } } });
      if (jaw > 0.1) { const q = P3(...W(1.0, 0, -jaw * 0.3)); c.fillStyle = h.mouth || '#4A1A2A'; c.beginPath(); c.ellipse(q[0], q[1], hs * T * 0.55, hs * T * 0.22 * (0.5 + jaw), Math.atan2(fy, fx), 0, TAU); c.fill(); }
      K.teeth(c, [0.7, 1.0, 1.3, 1.6].flatMap(u => [-1, 1].map(s => { const p = P3(...W(u, s * (0.42 - (u - 0.7) * 0.15), 0.08)); return [p[0], p[1], Math.PI / 2 + s * 0.3, 0.6]; })), hs * T * 0.16, h.teeth || '#F0F6F2');
      order.forEach(eye); const n = P3(...W(1.85, 0, 0.35)); c.fillStyle = '#060408'; c.beginPath(); c.ellipse(n[0], n[1], hs * T * 0.1, hs * T * 0.07, 0, 0, TAU); c.fill();
    } else if (kind === 'beak') {
      E(W(0, 0, 0.3), [0.7, 0.62, 0.6]); if (h.crest) crest3(c, K, P3, W, h, hs, T, order);
      const bk = h.beak || '#F2B35B', b0 = W(0.5, 0, 0.3), b1 = W(1.3, 0, 0.2), b2 = W(1.45, 0, -0.15 - jaw * 0.1); tube([b0, [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2, (b0[2] + b1[2]) / 2 + hs * 0.05], b1, b2], u => hs * T * (0.42 - u * 0.3), { col: bk, hi: K.sh(bk, 0.45), dk: K.sh(bk, -0.5), tex: null, texA: 0, spec: 0.5 });
      if (jaw > 0.05) { const m0 = W(0.5, 0, 0.1), m1 = W(1.2, 0, 0.05 - jaw * 0.6); tube([m0, [(m0[0] + m1[0]) / 2, (m0[1] + m1[1]) / 2, (m0[2] + m1[2]) / 2], m1], u => hs * T * (0.3 - u * 0.2), { col: K.sh(bk, -0.25), tex: null, texA: 0 }); }
      order.forEach(eye);
    } else if (kind === 'bat') {
      order.forEach(s => { const b = W(-0.1, s * 0.4, 0.5), tip = W(-0.3, s * 0.7, 1.4); K.body(c, () => { const p0 = P3(...b), p1 = P3(...tip), p2 = P3(...W(0.25, s * 0.45, 0.5)); c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(p1[0] + (p0[0] - p1[0]) * 0.4, p1[1], p1[0], p1[1]); c.quadraticCurveTo(p2[0] + (p1[0] - p2[0]) * 0.2, p2[1] - hs * T * 0.2, p2[0], p2[1]); c.closePath(); }, P3(...b)[0], P3(...b)[1], hs * T * 0.6, { col: K.sh(col, -0.05), hi, tex: 'skin', texA: 0.6, texS: 0.3, spec: 0.1, rim, rimA: 0.3, inner: () => { const p0 = P3(...b), p1 = P3(...tip); c.fillStyle = h.earIn || 'rgba(120,40,70,.55)'; c.beginPath(); c.moveTo(p0[0] + hs * T * 0.08 * s, p0[1]); c.lineTo(p1[0], p1[1]); c.lineTo(p0[0] + hs * T * 0.22 * s, p0[1] - hs * T * 0.05); c.fill(); } }); });
      E(W(0, 0, 0.25), [0.7, 0.68, 0.6]);
      const m0 = W(0.45, 0, 0.15), m1 = W(0.95, 0, 0.1); tube([m0, [(m0[0] + m1[0]) / 2, (m0[1] + m1[1]) / 2, (m0[2] + m1[2]) / 2], m1], u => hs * T * (0.45 - u * 0.15));
      if (jaw > 0.05) { const q = P3(...W(0.85, 0, -0.05 - jaw * 0.3)); c.fillStyle = h.mouth || '#3A0A14'; c.beginPath(); c.ellipse(q[0], q[1], hs * T * 0.32, hs * T * 0.2 * (0.4 + jaw), Math.atan2(fy, fx), 0, TAU); c.fill(); K.teeth(c, [-0.4, -0.15, 0.15, 0.4].map(v => { const p = P3(...W(0.95, v * 0.7, 0.05)); return [p[0], p[1], Math.PI / 2, Math.abs(v) > 0.3 ? 1 : 0.5]; }), hs * T * 0.14, h.teeth || '#1A1A22'); }
      // the leaf nose
      const n0 = P3(...W(1.0, 0, 0.15)); K.body(c, () => { c.beginPath(); c.moveTo(n0[0] - hs * T * 0.14, n0[1] + hs * T * 0.05); c.quadraticCurveTo(n0[0], n0[1] - hs * T * 0.45, n0[0] + hs * T * 0.14, n0[1] + hs * T * 0.05); c.quadraticCurveTo(n0[0], n0[1] + hs * T * 0.15, n0[0] - hs * T * 0.14, n0[1] + hs * T * 0.05); }, n0[0], n0[1], hs * T * 0.25, { col: h.nose || '#5A2030', hi: '#A05070', spec: 0.2 });
      order.forEach(eye);
    }
    if (h.after) h.after(c, { W, P3, hs, T, order });
  }
  function ear3(c, K, P3, W, h, hs, T, order, col, hi) { order.forEach(s => { const g = W(-0.15, s * 0.75, 0.3); const p = P3(...g); K.body(c, () => { c.beginPath(); c.ellipse(p[0], p[1], hs * T * 0.42, hs * T * 0.55, s * 0.3, 0, TAU); }, p[0], p[1], hs * T * 0.5, { col: K.sh(col, -0.1), hi, tex: h.tex, texA: 0.8, texS: 0.35, spec: 0.1, inner: () => { c.fillStyle = h.earIn || 'rgba(230,160,170,.35)'; c.beginPath(); c.ellipse(p[0], p[1], hs * T * 0.26, hs * T * 0.38, s * 0.3, 0, TAU); c.fill(); } }); }); }
  function trunk3(c, K, P3, W, h, hs, T, col, tube) { const sw = h.sway || 0, pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(W(0.6 + u * 1.1, Math.sin(u * 2.5 + sw * 2) * 0.25 * u + sw * u * 0.5, 0.1 - u * u * 1.6 + Math.sin(u * 3 + sw) * 0.05)); } tube(pts, u => hs * T * (0.34 - u * 0.2), { col, tex: 'skin', inner: () => { c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = hs * T * 0.03; for (let i = 1; i < 8; i++) { const p = P3(...pts[i]); c.beginPath(); c.moveTo(p[0] - hs * T * 0.18, p[1]); c.lineTo(p[0] + hs * T * 0.18, p[1]); c.stroke(); } } }); for (const s of [-1, 1]) { const a = W(0.55, s * 0.3, 0.0), b = W(0.95, s * 0.4, -0.2), e = W(1.2, s * 0.35, -0.05); K.tube(c, [P3(...a), P3(...b), P3(...e)], u => hs * T * (0.1 - u * 0.06), { col: '#F2EAD8', hiA: 0.3, dkA: 0.3 }); } }
  function horns3(c, K, P3, W, h, hs, T, order, col) { const n = h.horns || 2; order.forEach(s => { for (let k = 0; k < n / 2; k++) { const b = W(-0.3 - k * 0.2, s * (0.35 + k * 0.15), 0.5), tip = W(-1.1 - k * 0.25, s * (0.55 + k * 0.3), 1.2 + k * 0.2); const mid = [(b[0] + tip[0]) / 2, (b[1] + tip[1]) / 2, (b[2] + tip[2]) / 2 + hs * 0.15]; K.tube(c, [P3(...b), P3(...mid), P3(...tip)], u => hs * T * (0.2 - u * 0.15), { col: h.horn || '#2A2228', hi: '#8A7A80', hiA: 0.25, dkA: 0.5, rim: h.rim, rimA: 0.3 }); } }); }
  function crest3(c, K, P3, W, h, hs, T, order) { for (let k = 0; k < 5; k++) { const u = -0.2 - k * 0.1, b = W(u, (k - 2) * 0.12, 0.8), tip = W(u - 0.5 - (k === 2 ? 0.25 : 0), (k - 2) * 0.22, 1.1 + (k === 2 ? 0.2 : 0)); K.tube(c, [P3(...b), P3(...tip)], uu => hs * T * (0.1 - uu * 0.08), { col: h.crest, hiA: 0.2, dkA: 0.3 }); } }
  /* ---- the whole beast ---- */
  function beast(c, K, o) {
    const { T, X, Y, m, th, M } = o, t = o.t || 0, zl = o.zl || 0, P3 = cam(X, Y, T, m), F = frame(m, th), fx = F.fx, fy = F.fy;
    const dt = o.dt == null ? 0 : o.dt;
    const legs = o.legs || [];
    if (legs.length) { if (o.rig !== false) rig(M, m, th, legs, F, dt, o.rigO); else if (!M.feet || M.feet.length !== legs.length) rig(M, m, th, legs, F, 0, o.rigO); }
    const lift = zl, breathe = 1 + Math.sin(t * 1.5) * 0.012;
    const bodyParts = (o.body || []).map(B => { const g = F.w(B.g[0], B.g[1], B.g[2] + lift); return Object.assign({}, B, { gw: g, y: g[1] + (B.g[2] || 0) * 0.0 }); });
    // depth: things further up the screen first. Legs sort by their hip, body parts by their centre, the head by its own
    const items = [];
    legs.forEach((L, i) => { const f = M.feet ? M.feet[i] : { x: F.w(L.u, L.v, 0)[0], y: F.w(L.u, L.v, 0)[1], lift: 0 }; const hip = F.w(L.u, L.v, L.z); items.push({ y: hip[1] - 0.02 + (L.v < 0 ? 0 : 0), k: 'leg', L, f }); });
    bodyParts.forEach(B => items.push({ y: B.gw[1] + (B.dy || 0), k: 'body', B }));
    if (o.tail) items.push({ y: F.w(o.tail.pts[Math.floor(o.tail.pts.length / 2)][0], 0, 0)[1] + (o.tail.dy || 0), k: 'tail' });
    (o.necks || (o.neck ? [o.neck] : [])).forEach(N => { const hd = F.w(N.to[0], N.to[1], N.to[2] + lift); items.push({ y: hd[1] + (N.dy || 0) + 0.01, k: 'neck', N, hd }); });
    (o.extra || []).forEach(E => items.push({ y: F.w(E.u, E.v, 0)[1] + (E.dy || 0), k: 'extra', E }));
    items.sort((p, q) => p.y - q.y);
    const api = { P3, F, W: F.w, T, th, surf: (g, A, u, v, l) => surf(K, P3, th, g, A, u, v, l), ellipsoid: (g, A, opt) => ellipsoid(c, K, P3, th, g, A, Object.assign({ T }, opt)), lift };
    if (o.before) o.before(c, api);
    for (const it of items) {
      if (it.k === 'leg') leg(c, K, P3, F, it.L, it.f, o, T, zl);
      else if (it.k === 'body') { const B = it.B; const E = ellipsoid(c, K, P3, th, B.gw, B.A.map(a => a * breathe), { T, col: B.col || o.col, hi: B.hi || o.hi, dk: B.dk || o.dk, dk2: o.dk2, tex: B.tex === undefined ? o.tex : B.tex, texA: o.texA == null ? 0.85 : o.texA, texS: B.texS || o.texS || 0.35, spec: B.spec == null ? 0.2 : B.spec, rim: o.rim, rimA: B.rimA != null ? B.rimA : (o.rimA == null ? 0.14 : o.rimA * 0.5), ao: 0.07, aoA: 0.3, inner: B.inner ? () => B.inner(c, api, B) : null }); if (B.after) B.after(c, api, B, E); }
      else if (it.k === 'tail') tail3(c, K, P3, F, o.tail, o, T, lift, t);
      else if (it.k === 'neck') neck3(c, K, P3, F, th, it.N, o, T, lift, t);
      else if (it.k === 'extra') it.E.draw(c, api);
    }
    if (o.after) o.after(c, api);
    return api;
  }
  function tail3(c, K, P3, F, Tl, o, T, lift, t) { const pts = Tl.pts.map(p => P3(...F.w(p[0], p[1], p[2] + lift))); K.tube(c, pts, u => T * ((Tl.w0 || 0.5) * (1 - u) + (Tl.w1 || 0.12) * u), Object.assign({ col: Tl.col || o.dk || K.sh(o.col, -0.2), tex: o.tex, texA: 0.85, texS: 0.3, dk: '#030204', dkA: 0.55, hiA: 0.08, rim: o.rim, rimA: 0.15 }, Tl.tube || {})); if (Tl.tufts && o.furCols) K.tufts(c, T, pts, 0.35, 0.6, 18, 53, { cols: o.furCols }); if (Tl.tip) Tl.tip(c, pts[pts.length - 1], pts[pts.length - 2]); }
  function neck3(c, K, P3, F, th, N, o, T, lift, t) {
    const a = F.w(N.from[0], N.from[1], N.from[2] + lift), b = F.w(N.to[0], N.to[1], N.to[2] + lift), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + (N.bow || 0.15)];
    K.tube(c, [P3(...a), P3(...mid), P3(...b)], u => T * ((N.w0 || 1.2) * (1 - u) + (N.w1 || 0.8) * u), Object.assign({ col: N.col || o.col, tex: o.tex, texA: 0.85, texS: o.texS || 0.35, dk: o.dk2 || '#030204', dkA: 0.45, hiA: 0.1, rim: N.rim || o.rim, rimA: 0.3 }, N.tube || {}));
    if (N.mane && (N.mane.cols || o.furCols)) K.tufts(c, T, [P3(...a), P3(...mid), P3(...b)], N.mane.len || 0.4, 0.5, N.mane.n || 12, 77 + (N.id || 0), { cols: N.mane.cols || o.furCols });
    if (N.collar) N.collar(c, P3(...mid), P3(...b));
    if (N.head) head3(c, K, P3, th + (N.head.yaw || 0), F, Object.assign({ at: b }, N.head), o, T);
  }
  /* ---- wings seen from above: a membrane or feathers either side of the body, raised or folded ---- */
  function wings3(c, K, api, o) {
    const { P3, F, T } = api, s = o.span, fl = o.flap || 0, fold = o.fold || 0, kind = o.kind || 'bat';
    for (const sd of [-1, 1].sort((a, b) => (F.fx * a) - (F.fx * b))) {
      const root = F.w(o.u || 0, sd * (o.v || 0.6), (o.z || 1.6) + (o.zl || 0)), n = o.fingers || 4, el = F.w((o.u || 0) - 0.3 * fold, sd * (o.v || 0.6) * (1 + 1.6 * (1 - fold)) + sd * s * 0.35 * (1 - fold), (o.z || 1.6) + (o.zl || 0) + fl * s * 0.25 * (1 - fold) + 0.3), wr = F.w((o.u || 0) - 0.6 * fold + 0.2 * (1 - fold), sd * (o.v || 0.6) + sd * s * 0.7 * (1 - fold) + sd * 0.4 * fold, (o.z || 1.6) + (o.zl || 0) + fl * s * 0.45 * (1 - fold) + 0.2);
      const tips = []; for (let i = 0; i < n; i++) { const u = i / (n - 1), back = -0.2 - u * 1.3, out = 1 - u * 0.45; tips.push(F.w((o.u || 0) + (back * s * 0.45 + 0.3) * (1 - fold) - (0.5 + u * 1.2) * fold, sd * (o.v || 0.6) + sd * (s * (0.7 + out * 0.5) * (1 - fold) + 0.5 * fold), (o.z || 1.6) + (o.zl || 0) + fl * s * (0.5 - u * 0.25) * (1 - fold) + 0.1 - u * 0.2 * fold)); }
      const R = P3(...root), El = P3(...el), Wr = P3(...wr), Tp = tips.map(p => P3(...p)), far = sd * F.fx < 0;
      if (kind === 'bat') {
        const path = () => { c.beginPath(); c.moveTo(R[0], R[1]); c.lineTo(El[0], El[1]); c.lineTo(Wr[0], Wr[1]); Tp.forEach((tp, i) => { c.lineTo(tp[0], tp[1]); const nx = Tp[i + 1]; if (nx) { const mx = (tp[0] + nx[0]) / 2, my = (tp[1] + nx[1]) / 2; c.quadraticCurveTo(mx + (Wr[0] - mx) * 0.4, my + (Wr[1] - my) * 0.4, nx[0], nx[1]); } }); const bk = P3(...F.w((o.u || 0) - 1.6, sd * (o.v || 0.6) * 0.6, (o.z || 1.6) + (o.zl || 0) - 0.6)); const lt = Tp[Tp.length - 1]; c.quadraticCurveTo((lt[0] + bk[0]) / 2 + (Wr[0] - (lt[0] + bk[0]) / 2) * 0.3, (lt[1] + bk[1]) / 2 + (Wr[1] - (lt[1] + bk[1]) / 2) * 0.3, bk[0], bk[1]); c.closePath(); };
        K.body(c, path, Wr[0], Wr[1], s * T * 0.5, { col: K.sh(o.memb || o.col, far ? -0.3 : 0), hi: K.sh(o.memb || o.col, 0.45), dk: K.sh(o.memb || o.col, -0.55), tex: 'skin', texA: 0.65, texS: 0.45, spec: 0.1, rim: o.rim, rimA: far ? 0.1 : 0.3, ao: 0.08, aoA: 0.3, inner: () => { c.save(); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = T * 0.16; Tp.forEach(tp => { c.beginPath(); c.moveTo(Wr[0], Wr[1]); c.lineTo(tp[0], tp[1]); c.stroke(); }); if (o.inner) o.inner(c, { tips: Tp, wrist: Wr, elbow: El, far }); c.restore(); } });
        K.tube(c, [R, El, Wr], u => T * (0.45 * (1 - u) + 0.24 * u), { col: K.sh(o.col, far ? -0.3 : 0), tex: 'skin', texA: 0.8, texS: 0.4, dk: '#030204', dkA: 0.5, hiA: 0.1 });
        Tp.forEach(tp => K.tube(c, [Wr, [(Wr[0] + tp[0]) / 2, (Wr[1] + tp[1]) / 2], tp], u => T * (0.15 - u * 0.08), { col: K.sh(o.col, far ? -0.3 : 0), dkA: 0.5, hiA: 0.08 }));
      } else {
        const fc = K.sh(o.feathersCol || o.col, far ? -0.3 : 0), fc2 = K.sh(o.feathersCol2 || K.sh(fc, -0.25), far ? -0.3 : 0);
        const quill = (x, y, a, L, w, col2) => { c.save(); c.translate(x, y); c.rotate(a); K.body(c, () => { c.beginPath(); c.moveTo(0, -w); c.quadraticCurveTo(L * 0.55, -w * 1.2, L, 0); c.quadraticCurveTo(L * 0.55, w * 1.2, 0, w); c.closePath(); }, L * 0.5, 0, L * 0.5, { col: col2, hi: K.sh(col2, 0.3), dk: K.sh(col2, -0.45), tex: 'feather', texA: 0.7, texS: 0.4, spec: 0.12, ao: 0.08, aoA: 0.3, rim: o.rim, rimA: far ? 0.05 : 0.22 }); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(0.6, w * 0.12); c.beginPath(); c.moveTo(0, 0); c.lineTo(L * 0.9, 0); c.stroke(); if (o.ice) { c.strokeStyle = 'rgba(220,245,255,.5)'; c.lineWidth = w * 0.25; c.beginPath(); c.moveTo(L * 0.3, -w * 0.6); c.lineTo(L * 0.85, -w * 0.15); c.stroke(); } c.restore(); };
        for (let i = Tp.length - 1; i >= 0; i--) { const tp = Tp[i], a = Math.atan2(tp[1] - Wr[1], tp[0] - Wr[0]), L = Math.hypot(tp[0] - Wr[0], tp[1] - Wr[1]); quill(Wr[0], Wr[1], a, L, T * 0.34, i % 2 ? fc : fc2); }
        for (let i = 0; i < 6; i++) { const u = i / 5, x = lerp(R[0], El[0], u), y = lerp(R[1], El[1], u), tp = Tp[Tp.length - 1], a = Math.atan2(tp[1] - El[1], tp[0] - El[0]) + 0.5 * (1 - u) * sd * (F.fx >= 0 ? 1 : -1) * 0, L = s * T * 0.4 * (1 - fold * 0.5); quill(x, y, a, L, T * 0.3, i % 2 ? fc2 : fc); }
        for (let i = 0; i < 7; i++) { const u = i / 6, x = lerp(R[0], Wr[0], u), y = lerp(R[1], Wr[1], u), tp = Tp[0], a = Math.atan2(tp[1] - Wr[1], tp[0] - Wr[0]), L = s * T * 0.22; quill(x, y, a + 0.2, L, T * 0.24, K.sh(o.covertCol || o.col, (i % 2) * 0.15 + (far ? -0.3 : 0))); }
        K.tube(c, [R, El, Wr], u => T * (0.4 * (1 - u) + 0.22 * u), { col: K.sh(o.col, far ? -0.3 : 0), tex: 'feather', texA: 0.8, texS: 0.4, dk: '#030204', dkA: 0.45, hiA: 0.12 });
        if (o.inner) o.inner(c, { tips: Tp, wrist: Wr, elbow: El, far });
      }
    }
  }
  /* ---- light in the body, in the round: volumes as plain alpha (no blend modes), veins and scale rows on a surface ---- */
  function volumes(c, api, list, col) { if (DunFiend.KIT.qq() < 1) return; c.save(); list.forEach(([g, A, u, v, r, k]) => { const p = api.surf(g, A, u, v, 0.02), R = r * api.T, kk = k == null ? 1 : k; let gr = c.createRadialGradient(p[0] - R * 0.35, p[1] - R * 0.4, 0, p[0], p[1], R); gr.addColorStop(0, `rgba(255,255,255,${0.22 * kk})`); gr.addColorStop(0.6, `rgba(255,255,255,${0.05 * kk})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], R, 0, TAU); c.fill(); gr = c.createRadialGradient(p[0] + R * 0.4, p[1] + R * 0.5, 0, p[0] + R * 0.2, p[1] + R * 0.3, R); gr.addColorStop(0, `rgba(10,4,12,${0.28 * kk})`); gr.addColorStop(1, 'rgba(10,4,12,0)'); c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], R * 1.1, 0, TAU); c.fill(); }); c.restore(); }
  function veins(c, api, g, A, V, t) { if (DunFiend.KIT.qq() < 1) return; const R = mulberry32(V.seed || 3), col = V.col, n = V.n || 5, k = V.k == null ? 1 : V.k, T = api.T; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let i = 0; i < n; i++) { let u = (R() - 0.5) * 1.2, v = (R() - 0.5) * 1.2; const branch = (u0, v0, a, L, w, d) => { const u1 = u0 + Math.cos(a) * L, v1 = v0 + Math.sin(a) * L; if (u1 * u1 + v1 * v1 > 0.9) return; const p0 = api.surf(g, A, u0, v0, 0.02), p1 = api.surf(g, A, u1, v1, 0.02), pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + i + d); c.strokeStyle = rgba(col, (0.25 + 0.5 * pulse) * k); c.lineWidth = w; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); if (d > 0) { branch(u1, v1, a + (R() - 0.5) * 1.4, L * 0.65, w * 0.7, d - 1); if (R() < 0.7) branch(u1, v1, a + (R() - 0.5) * 1.4, L * 0.55, w * 0.6, d - 1); } }; branch(u, v, R() * TAU, 0.3, Math.max(1, T * 0.05), 3); } c.restore(); }
  function scaleRows(c, K, api, g, A, rows, o) { rows.forEach((row, ri) => { const R = mulberry32(17 + ri), n = row.n || 8, sz = (row.size || 0.3) * api.T, col = row.col || o.col; for (let i = 0; i < n; i++) { const u = row.u0 + (row.u1 - row.u0) * (i / (n - 1)), v = row.v, p = api.surf(g, A, u, v, 0.03), q = api.surf(g, A, u - 0.05, v, 0.03), a = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI, w = sz * (1 - Math.abs(v) * 0.3); c.save(); c.translate(p[0], p[1]); c.rotate(a); if (K.qq() < 2) { if (i % (K.qq() < 1 ? 3 : 2) === 0) { c.fillStyle = K.sh(col, -0.1); c.beginPath(); c.moveTo(-w * 0.5, -w * 0.45); c.quadraticCurveTo(w * 0.5, -w * 0.5, w * 0.75, 0); c.quadraticCurveTo(w * 0.5, w * 0.5, -w * 0.5, w * 0.45); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(0.8, w * 0.07); c.stroke(); } c.restore(); continue; } K.body(c, () => { c.beginPath(); c.moveTo(-w * 0.5, -w * 0.45); c.quadraticCurveTo(w * 0.5, -w * 0.5, w * 0.75, 0); c.quadraticCurveTo(w * 0.5, w * 0.5, -w * 0.5, w * 0.45); c.closePath(); }, 0, 0, w * 0.7, { col: K.sh(col, (R() - 0.5) * 0.12), hi: K.sh(col, 0.5), dk: K.sh(col, -0.5), spec: 0.45, specR: 0.35, rim: row.rim || o.rim, rimA: 0.35, ao: 0.12, aoA: 0.45, edge: row.edge || null, edgeA: 0.8, edgeW: Math.max(0.8, w * 0.07) }); c.restore(); } }); }
  /* ---- which way it faces: where it is going when it moves, its prey when it stands, or what the fight says ---- */
  function heading(M, m, me, dt, o) {
    o = o || {}; const px = M.px == null ? m.x : M.px, py = M.py == null ? m.y : M.py, dx = m.x - px, dy = m.y - py, sp = dt > 0 ? Math.hypot(dx, dy) / dt : 0; M.px = m.x; M.py = m.y;
    const want = M.faceTo != null ? M.faceTo : M.spin != null && M.spin > 0 ? M.spin : sp > (o.minSp || 1.2) ? Math.atan2(dy, dx) : me ? Math.atan2(me.y - m.y, me.x - m.x) : (M.ang == null ? Math.PI / 2 : M.ang);
    if (M.ang == null) M.ang = want;
    let d = want - M.ang; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    M.ang += d * Math.min(1, dt * (o.turn || 4)); m.face = Math.cos(M.ang) >= 0 ? 1 : -1; M.spd3 = sp;
    return M.ang;
  }
  /* a point in body coordinates for the fight's own geometry (weak points, hit proxies) */
  function at(m, th, u, v) { const fx = Math.cos(th), fy = Math.sin(th); return { x: m.x + fx * u - fy * v, y: m.y + fy * u + fx * v }; }
  return { cam, frame, rig, beast, ellipsoid, head3, wings3, volumes, veins, scaleRows, leg, surf, lerp, rgba, heading, at };
})();
