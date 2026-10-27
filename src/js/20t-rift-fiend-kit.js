/* ---------- the rift fiends' kit: the bits every rift boss shares ----------
   Rift bosses are Super Fiend-class fights on the fiend engine (20h), painted with the toon kit (20h4): cel-shaded
   bodies placed in three dimensions. This file holds what they share: a body frame (heading, hover, lean), 3D limbs
   as toon tubes, ellipsoid parts, a depth sort, and the roster registration. */
const RiftFiend = (() => {
  const TAU = Math.PI * 2, TN = FiendToon;
  /* a body frame: u forward, v left, h up; heading th; lean tips the body forward (pitch) and roll banks it */
  function frame(m, th, o) { o = o || {}; const cf = Math.cos(th), sf = Math.sin(th), pt = o.pitch || 0, rl = o.roll || 0, cp = Math.cos(pt), sp = Math.sin(pt), cr = Math.cos(rl), sr = Math.sin(rl), bz = o.z || 0, S = o.scale || 1;
    const W = (u, v, h) => { u *= S; v *= S; h *= S; const u1 = u * cp - h * sp, h1 = u * sp + h * cp, v1 = v * cr - h1 * sr, h2 = v * sr + h1 * cr; return [m.x + cf * u1 - sf * v1, m.y + sf * u1 + cf * v1, bz + h2]; };
    W.th = th; W.cf = cf; W.sf = sf; return W; }
  /* a 3D polyline as a toon tube: points in world [x, y, z], projected */
  function tube(c, P3, pts, wf, o) { TN.tube(c, pts.map(p => P3(p[0], p[1], p[2])), wf, o); }
  function tubeLite(c, P3, pts, wf, o) { TN.tubeLite(c, pts.map(p => P3(p[0], p[1], p[2])), wf, o); }
  /* a jointed limb: from a shoulder to a foot through a knee lifted by k (up) and bowed out along n */
  function limb(c, P3, sh, ft, k, n, w0, w1, o, lift) { const mx = (sh[0] + ft[0]) / 2 + n[0] * k, my = (sh[1] + ft[1]) / 2 + n[1] * k, mz = (sh[2] + ft[2]) / 2 + (lift == null ? k : lift); const pts = [sh, [(sh[0] + mx) / 2, (sh[1] + my) / 2, (sh[2] + mz) / 2], [mx, my, mz], [(mx + ft[0]) / 2, (my + ft[1]) / 2, (mz + ft[2]) / 2], ft]; tubeLite(c, P3, pts, u => w0 + (w1 - w0) * u, o); return [mx, my, mz]; }
  /* an ellipsoid part: half-axes A = [along, across, up] about world point g, turned to heading th */
  function ell(c, P3, th, g, A, o) { return TN.ellipsoid(c, P3, th, g, A, o); }
  /* a depth key for sorting parts far to near: the camera looks from the south and above */
  const depth = p => p[1] + p[2] * 0.35;
  function sorted(list) { return list.slice().sort((a, b) => depth(a.at) - depth(b.at)); }
  /* a part's hit proxy (for FX.parts): where its screen centre lands on the ground plane */
  const hit = (key, p, r, m) => ({ key, dx: p[0] - m.x, dy: p[1] - p[2] - m.y, r });
  /* the roster: a rift boss is registered like a Super Fiend (its entry in RIFT_FIENDS, its definition in FIEND_DEFS) */
  function define(entry, def) { RIFT_FIENDS[entry.id] = entry; FIEND_DEFS[entry.id] = def; }
  /* a wet ground for the drowned fights: dark stone under shallow water, caustic light, ripples */
  function wetFloor(c, A, o) { const R = A.R, rnd = A.rnd; o = o || {};
    let g = c.createRadialGradient(0, 0, R * 0.2, 0, 0, R + 1.4); g.addColorStop(0, o.mid || '#1C3A42'); g.addColorStop(0.7, o.edge || '#102A32'); g.addColorStop(0.93, '#0A1C22'); g.addColorStop(1, 'rgba(10,28,34,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.fill();
    // flagstones under the water
    for (let y = -R; y < R; y += 1.1) for (let x = -R; x < R; x += 1.3) { if (Math.hypot(x + 0.65, y + 0.55) > R - 0.4) continue; c.fillStyle = `rgba(${150 + rnd() * 30},${160 + rnd() * 30},${150 + rnd() * 30},${0.12 + rnd() * 0.08})`; c.fillRect(x + 0.06, y + 0.06, 1.18, 0.98); }
    // caustics
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(120,220,230,.16)'; c.lineWidth = 0.08; for (let i = 0; i < 160; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 0.5), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.3 + rnd() * 0.6; c.beginPath(); c.ellipse(x, y, r, r * 0.6, rnd() * 3, 0, TAU); c.stroke(); } c.restore();
    if (o.extra) o.extra(c, A);
    // the rim
    c.strokeStyle = 'rgba(200,240,230,.3)'; c.lineWidth = 0.12; c.beginPath(); for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU, r = R + 0.2 + Math.sin(a * 9) * 0.1 + Math.sin(a * 23) * 0.05; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); }
  /* a night sky over the drowned coast: dark water, a drowned moon, the belfry's silhouette */
  function seaSky(c, W, H, t, cam, T, o) { o = o || {}; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.top || '#06141C'); g.addColorStop(0.55, o.mid || '#0A2432'); g.addColorStop(1, o.bot || '#06141C'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const mx = W * 0.76 - (cam.x - 28) * T * 0.08, my = H * 0.13; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite(o.moon || '#9FE8D8'), mx - T * 6, my - T * 6, T * 12, T * 12); c.globalAlpha = 0.7; blitSized(c, glowSprite('#E8FFF8'), mx - T * 1.4, my - T * 1.4, T * 2.8, T * 2.8); c.restore();
    c.save(); c.lineCap = 'round'; for (let i = 0; i < 26; i++) { const y = ((i * 37 + t * 9 - cam.y * T * 0.6) % (H + 60) + H + 60) % (H + 60) - 30, amp = 4 + (i % 4) * 2; c.strokeStyle = `rgba(120,200,190,${0.05 + (i % 3) * 0.03})`; c.lineWidth = 1.2 + (i % 3); c.beginPath(); for (let x = -20; x <= W + 20; x += 18) { const yy = y + Math.sin(x * 0.02 + t * 0.8 + i) * amp; x < -10 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); } c.restore();
    if (o.silhouette) o.silhouette(c, W, H, t, cam, T); }
  return { TAU, TN, frame, tube, tubeLite, limb, ell, depth, sorted, hit, define, wetFloor, seaSky };
})();
