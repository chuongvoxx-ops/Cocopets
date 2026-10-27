/* ---------- the Tower's dragons, repainted to the Threnn standard ----------
   One painter for all five: the Inferno Dragon, the Frost, Bone, Storm and Venom Dragons (each B.art 'dragon').
   A wyvern rearing on its hind legs, three-quarters on, turned toward the pet (it swings round when the pet crosses it).
   Built back to front from separate parts, each with its own three-tone ramp (lit, body, shade) and an edge highlight:
   the far wing, the tail (a chain of twelve segments, each with its own dorsal blade, a wave running down it), the far
   hind leg, the barrel of the body (scales, ventral scutes, a chest that breathes), the near hind leg, the arms, the
   neck (seven segments, throat plates in front, spines behind), the head (skull, brow ridge, swept horns ringed with
   growth ridges, a hinged lower jaw, teeth, tongue, a slit eye that follows the pet, nostrils that smoke) and the near
   wing (an arm of two bones, four fingers, five membrane panels each shaded on its own, veins, a wrist claw).
   It is never still: the chest breathes, the wings stir, the tail waves, the head bobs and looks, smoke curls from the
   nostrils. Every attack has a wind-up that reads as its warning:
     breath     it rears back, its throat lights from the chest up the neck, then the jaw drops wide toward its aim
     tail       it twists away and coils the tail back, then whips it round
     fireballs  it rears and gapes, the jaw snapping with each spit
     dive       the wings beat hard and fast as it climbs
   Hit, it recoils (the head jerks back, the wings flare); stunned, its head hangs and its eyes swim; asleep, it lies with
   its head low, wings folded and eyes shut. From the second phase the eyes burn and cracks of its element open in the
   chest. Each dragon has its own touches: embers (Inferno), icicles and frost breath (Frost), bare ribs and torn
   membranes (Bone), lightning crawling along the wing bones (Storm), venom dripping from the teeth and leafy frills
   (Venom). */
(() => {
  const { P, REACH, parts } = DunBoss, { form, limb, scales, horn, eye, teeth, glow, blobPath, lit } = parts;
  const TAU = Math.PI * 2, INK = 'rgba(22,12,34,.78)';
  const ink = (c, w) => { c.lineWidth = w; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const ellB = (c, x, y, rx, ry, rot) => () => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u;
  const ss = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
  // a material's ramp: body, lit, shade, deep shade, edge highlight
  const ramp = col => ({ b: col, hi: shadeC(col, 0.3), sh: shadeC(col, -0.32), dk: shadeC(col, -0.55), rim: shadeC(col, 0.55) });
  // the five dragons' own touches
  const KIND = {
    fire: { belly: '#E8B88A', memb: '#5A1E2B', horn: '#EBDCC4', eye: '#FF9F43', breath: '#FF7A3D', hot: '#FFE37A' },
    frost: { belly: '#DCEEFA', memb: '#3A5F88', horn: '#EAF6FF', eye: '#BFEFFF', breath: '#BFEFFF', hot: '#FFFFFF' },
    shadow: { belly: '#E8E2D0', memb: '#4A4438', horn: '#F2ECDC', eye: '#A8E0C0', breath: '#A8E0C0', hot: '#E8FFF2' },
    spark: { belly: '#D8DCF2', memb: '#2E3A6A', horn: '#ECE8D8', eye: '#FFE37A', breath: '#FFE37A', hot: '#FFFFFF' },
    leaf: { belly: '#D8EAB0', memb: '#2E5A34', horn: '#E8E4C8', eye: '#D8FF8A', breath: '#9BE07A', hot: '#E8FFB0' },
  };

  /* ---- the wing: a shoulder at (0,0); the arm rises out to the wrist with a bend at the elbow, four fingers fan out from
     the wrist, and the membrane hangs between them in five panels, its trailing edge scalloped between the fingertips ---- */
  function wing(c, S, side, spread, beat, R, memb, K, t, o) {
    c.save(); c.scale(side, 1); c.rotate(-beat * 0.32);
    const sp = 0.45 + 0.55 * spread, pol = (x, y, a, L) => [x + Math.cos(a) * L, y + Math.sin(a) * L];
    const E = pol(0, 0, -0.5 - 0.2 * sp, S * 0.72), W = pol(E[0], E[1], -0.28 - 0.25 * sp + beat * 0.2, S * 0.85 * (0.8 + 0.2 * sp));
    const FA = [-1.2, -0.62, -0.08, 0.5].map(a => a * (0.8 + 0.2 * sp) + beat * 0.25), FL = [1.15, 1.38, 1.28, 1.02];
    const F = FA.map((a, i) => pol(W[0], W[1], a, S * FL[i] * (0.55 + 0.45 * sp)));
    const root = [S * 0.2, S * 0.85];
    const scallop = (a, b, k) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; c.quadraticCurveTo(lerp(mx, W[0], k), lerp(my, W[1], k), b[0], b[1]); };
    const panels = [() => { c.moveTo(0, 0); c.lineTo(E[0], E[1]); c.lineTo(W[0], W[1]); c.lineTo(F[0][0], F[0][1]); scallop(F[0], [0, 0], 0.12); },
      () => { c.moveTo(W[0], W[1]); c.lineTo(F[0][0], F[0][1]); scallop(F[0], F[1], 0.28); },
      () => { c.moveTo(W[0], W[1]); c.lineTo(F[1][0], F[1][1]); scallop(F[1], F[2], 0.28); },
      () => { c.moveTo(W[0], W[1]); c.lineTo(F[2][0], F[2][1]); scallop(F[2], F[3], 0.26); },
      () => { c.moveTo(W[0], W[1]); c.lineTo(F[3][0], F[3][1]); scallop(F[3], root, 0.22); c.lineTo(0, S * 0.25); c.lineTo(0, 0); c.lineTo(E[0], E[1]); }];
    panels.forEach((pp, i) => {
      c.beginPath(); pp(); c.closePath();
      if (o.torn && i > 0) for (let h = 0; h < 2; h++) { const f = F[Math.min(3, i - 1 + h)], u = 0.55 + 0.2 * h, hx = lerp(W[0], f[0], u) + S * 0.1, hy = lerp(W[1], f[1], u) + S * 0.08, hr = S * (0.06 + 0.03 * ((i + h) % 2)); c.moveTo(hx + hr, hy); for (let q = 1; q <= 7; q++) { const a = q / 7 * TAU, rr = hr * (0.65 + 0.35 * Math.sin(q * 2.7 + i)); c.lineTo(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr); } c.closePath(); }
      const tip = i === 0 ? F[0] : i === 4 ? root : F[i], g = c.createLinearGradient(W[0], W[1], tip[0], tip[1]);
      const m1 = shadeC(memb, [0.06, -0.04, 0.02, -0.06, -0.12][i]);
      g.addColorStop(0, shadeC(m1, -0.38)); g.addColorStop(0.5, m1); g.addColorStop(1, shadeC(m1, 0.2));
      c.fillStyle = g; c.fill(o.torn ? 'evenodd' : 'nonzero'); ink(c, Math.max(1, S * 0.018));
      // a faint backlight through the thin membrane by its edge, and veins fanning from the wrist
      c.save(); c.clip(o.torn ? 'evenodd' : 'nonzero');
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.07 + 0.12 * (o.hot || 0); glow(c, tip[0], tip[1], S * 0.6, K.breath, 1); c.globalCompositeOperation = 'source-over';
      c.strokeStyle = shadeC(memb, -0.5); c.globalAlpha = 0.45; c.lineWidth = Math.max(0.8, S * 0.011);
      if (i > 0 && i < 4) { const a2 = F[i - 1], b2 = F[i]; for (let k = 1; k <= 2; k++) { const u = k / 3, ex = lerp(a2[0], b2[0], u), ey = lerp(a2[1], b2[1], u); c.beginPath(); c.moveTo(W[0], W[1]); c.quadraticCurveTo(lerp(W[0], ex, 0.55), lerp(W[1], ey, 0.55) + S * 0.06, lerp(W[0], ex, 0.82), lerp(W[1], ey, 0.82)); c.stroke(); } }
      c.restore();
    });
    // the bones over the membrane: the arm, the four fingers tapering, the knuckles, the wrist claw
    limb(c, 0, 0, E[0], E[1], S * 0.26, S * 0.18, R.b, { lw: Math.max(1, S * 0.02) });
    limb(c, E[0], E[1], W[0], W[1], S * 0.18, S * 0.12, R.b, { lw: Math.max(1, S * 0.02) });
    F.forEach((f, i) => limb(c, W[0], W[1], f[0], f[1], S * (0.1 - i * 0.01), S * 0.03, shadeC(R.b, 0.06), { lw: Math.max(0.8, S * 0.016) }));
    [[0, 0, 0.15], [E[0], E[1], 0.11], [W[0], W[1], 0.1]].forEach(([x, y, k]) => form(c, ellB(c, x, y, S * k, S * k), x, y, S * k, R.hi, { lw: Math.max(0.8, S * 0.015), shade: 0.35 }));
    F.forEach(f => { c.beginPath(); c.arc(f[0], f[1], S * 0.03, 0, TAU); c.fillStyle = K.horn; c.fill(); ink(c, 0.8); });
    horn(c, W[0], W[1], S * 0.32, -2.4 - beat * 0.2, S * 0.08, K.horn, 0.4, { lw: 1 });
    if (o.spark) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = K.hot; c.lineWidth = Math.max(1, S * 0.02); c.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(t * 23));
      const f = F[Math.floor(t * 3) % 4]; c.beginPath(); c.moveTo(W[0], W[1]); for (let k = 1; k <= 5; k++) { const u = k / 5; c.lineTo(lerp(W[0], f[0], u) + Math.sin(t * 40 + k * 3) * S * 0.05, lerp(W[1], f[1], u) + Math.cos(t * 37 + k * 2) * S * 0.05); } c.stroke(); c.restore(); }
    c.restore();
  }

  /* ---- the tail: twelve segments along a curve that waves; each a lit oval with a dorsal blade; a spade at the tip ---- */
  function tail(c, S, R, K, t, coil, whip, kind) {
    const N = 12, pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, wave = Math.sin(t * 2.2 - u * 4.5) * S * 0.12 * u;
      const a = lerp(0.35, -0.55 - coil * 1.6 + whip * 2.6, u * u);
      const L = S * (2.4 - coil * 0.7);
      pts.push([S * 0.35 + Math.cos(a) * L * u + wave * 0.3, S * 0.72 + Math.sin(a) * L * u * 0.55 - Math.sin(u * Math.PI) * S * 0.18 + wave]);
    }
    for (let i = N - 1; i >= 0; i--) {
      const [x, y] = pts[i], [x2, y2] = pts[i + 1], u = i / N, rr = S * lerp(0.33, 0.1, u), a = Math.atan2(y2 - y, x2 - x);
      // the dorsal blade first, then the segment over its root
      c.save(); c.translate(x, y); c.rotate(a);
      c.beginPath(); c.moveTo(-rr * 0.6, -rr * 0.7); c.lineTo(rr * 0.1, -rr * (1.55 + 0.25 * Math.sin(i))); c.lineTo(rr * 0.65, -rr * 0.6); c.closePath();
      c.fillStyle = lit(c, 0, -rr, rr, R.sh, R.b, R.dk); c.fill(); ink(c, Math.max(0.8, S * 0.014)); c.restore();
      form(c, ellB(c, x, y, rr * 1.15, rr * 0.92, a), x, y, rr, i % 2 ? R.b : shadeC(R.b, -0.06), { lw: Math.max(0.8, S * 0.016), hi: R.hi, dk: R.dk, shade: 0.42 });
      // a belly band under each segment
      c.save(); ellB(c, x, y, rr * 1.15, rr * 0.92, a)(); c.clip(); c.fillStyle = shadeC(K.belly, -0.2); c.globalAlpha = 0.55; c.beginPath(); c.ellipse(x, y + rr * 0.75, rr * 0.9, rr * 0.35, a, 0, TAU); c.fill(); c.restore();
      if (kind === 'shadow' && i % 2 === 0) { c.strokeStyle = 'rgba(30,24,16,.5)'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, rr * 0.7, rr * 0.55, a, -0.6, 0.6); c.stroke(); }
    }
    // the last of the tail, tapering into the spade at the tip
    limb(c, pts[N - 1][0], pts[N - 1][1], pts[N][0], pts[N][1], S * 0.12, S * 0.06, R.b, { lw: Math.max(0.8, S * 0.016) });
    const [tx, ty] = pts[N], [px, py] = pts[N - 1], ta = Math.atan2(ty - py, tx - px);
    c.save(); c.translate(tx, ty); c.rotate(ta);
    c.beginPath(); c.moveTo(-S * 0.08, 0); c.quadraticCurveTo(S * 0.06, -S * 0.26, S * 0.36, 0); c.quadraticCurveTo(S * 0.06, S * 0.26, -S * 0.08, 0); c.closePath();
    c.fillStyle = lit(c, S * 0.12, -S * 0.06, S * 0.25, R.sh, R.hi, R.dk); c.fill(); ink(c, Math.max(0.8, S * 0.016));
    c.strokeStyle = R.rim; c.globalAlpha = 0.6; c.lineWidth = Math.max(0.8, S * 0.012); c.beginPath(); c.moveTo(S * 0.02, -S * 0.05); c.quadraticCurveTo(S * 0.12, -S * 0.2, S * 0.34, -S * 0.01); c.stroke(); c.globalAlpha = 1;
    c.restore();
    return pts;
  }

  /* ---- a hind leg: a great thigh, a shin bent back, a foot with three toes and claws ---- */
  function hindLeg(c, S, side, R, K, lift, far) {
    const col = far ? R.sh : R.b, x0 = side * S * 0.62, y0 = S * 0.5, kx = side * S * 0.92, ky = S * 0.82 - lift * S * 0.15, fx = side * S * 0.88, fy = S * 1.08 - lift * S * 0.2;
    form(c, ellB(c, x0, y0, S * 0.5, S * 0.44, side * 0.45), x0, y0, S * 0.5, col, { lw: Math.max(1, S * 0.02), hi: far ? R.b : R.hi, dk: R.dk, shade: 0.5 });
    scales(c, ellB(c, x0, y0, S * 0.5, S * 0.44, side * 0.45), col, S * 0.16, 0.3);
    limb(c, kx, ky - S * 0.12, fx, fy - S * 0.05, S * 0.28, S * 0.2, shadeC(col, -0.06), { rings: 3, lw: Math.max(1, S * 0.018) });
    form(c, ellB(c, fx + side * S * 0.06, fy, S * 0.34, S * 0.13), fx, fy, S * 0.34, shadeC(col, -0.12), { lw: Math.max(1, S * 0.018), spec: false });
    for (let k = 0; k < 3; k++) { const tx = fx + side * S * (-0.12 + k * 0.16); horn(c, tx, fy + S * 0.06, S * 0.2, 1.25 + side * 0.15 * (k - 1), S * 0.065, K.horn, 0.2, { lw: 0.8 }); }
  }

  /* ---- the head: drawn facing +x around (0,0); open 0..1 drops the jaw ---- */
  function head(c, S, R, K, kind, open, look, t, lids, burn) {
    const s = S * 1.12;
    // horns behind the skull
    [[-0.3, -0.4, -2.6, 0.85], [-0.08, -0.48, -2.25, 0.62]].forEach(([hx, hy, a, L], i) => horn(c, hx * s, hy * s, s * L, a, s * (0.34 - i * 0.08), i ? shadeC(K.horn, -0.14) : K.horn, 0.5, { lw: 1.2, rings: 5 }));
    if (kind === 'frost') for (let i = 0; i < 3; i++) horn(c, (-0.45 - i * 0.1) * s, (-0.15 + i * 0.05) * s, s * (0.32 - i * 0.06), -2.9, s * 0.07, '#DDF6FF', 0.1, { lw: 0.7 });
    // the lower jaw, hinged behind the eye
    c.save(); c.translate(-s * 0.15, s * 0.1); c.rotate(open * 0.62);
    c.beginPath(); c.moveTo(-s * 0.25, -s * 0.05); c.quadraticCurveTo(s * 0.45, s * 0.02, s * 0.98, -s * 0.02); c.quadraticCurveTo(s * 0.62, s * 0.3, -s * 0.2, s * 0.22); c.closePath();
    c.fillStyle = lit(c, s * 0.3, s * 0.1, s * 0.7, R.sh, R.b, R.dk); c.fill(); ink(c, Math.max(1, S * 0.02));
    c.save(); c.clip(); c.fillStyle = shadeC(K.belly, -0.15); c.globalAlpha = 0.7; c.beginPath(); c.ellipse(s * 0.35, s * 0.22, s * 0.6, s * 0.08, 0.05, 0, TAU); c.fill(); c.restore();
    if (open > 0.15) { c.fillStyle = '#3A1424'; c.beginPath(); c.moveTo(-s * 0.15, -s * 0.03); c.quadraticCurveTo(s * 0.45, -s * 0.02, s * 0.9, -s * 0.01); c.quadraticCurveTo(s * 0.5, s * 0.12, -s * 0.12, s * 0.1); c.fill();
      c.fillStyle = '#C24A6A'; c.beginPath(); c.ellipse(s * 0.25, s * 0.05, s * 0.28, s * 0.05, 0.05, 0, TAU); c.fill(); }
    for (let i = 0; i < 6; i++) { const x = s * (0.12 + i * 0.14), L = s * (i % 2 ? 0.08 : 0.12); c.beginPath(); c.moveTo(x - s * 0.035, -s * 0.01); c.lineTo(x, -s * 0.01 - L); c.lineTo(x + s * 0.035, -s * 0.01); c.closePath(); c.fillStyle = '#F6F0DC'; c.fill(); ink(c, 0.8); }
    if (kind === 'leaf' && open > 0.1) { c.fillStyle = '#B8FF6A'; for (let i = 0; i < 2; i++) { const ph = (t * 0.8 + i * 0.5) % 1; c.globalAlpha = 1 - ph; c.beginPath(); c.ellipse(s * (0.4 + i * 0.3), s * 0.05 + ph * s * 0.5, s * 0.025, s * 0.045, 0, 0, TAU); c.fill(); } c.globalAlpha = 1; }
    c.restore();
    // the mouth's glow when it opens to breathe
    if (open > 0.35) glow(c, s * 0.55, s * 0.12, s * (0.4 + open * 0.4), K.breath, 0.5 + open * 0.4);
    // the skull: a long wedge, a heavy brow, the snout
    const skull = () => blobPath(c, [[-0.55, -0.05], [-0.42, -0.46], [0.05, -0.5], [0.62, -0.33], [1.05, -0.18], [1.08, 0.04], [0.55, 0.12], [-0.2, 0.2], [-0.5, 0.15]], s);
    form(c, skull, s * 0.2, -s * 0.15, s * 0.8, R.b, { lw: Math.max(1, S * 0.022), hi: R.hi, dk: R.dk, shade: 0.45 });
    scales(c, skull, R.b, s * 0.13, 0.32);
    // a ridge of lit plates along the snout
    for (let i = 0; i < 4; i++) { const x = s * (0.15 + i * 0.22), y = -s * (0.42 - i * 0.06); c.beginPath(); c.ellipse(x, y, s * 0.1, s * 0.045, -0.25, 0, TAU); c.fillStyle = lit(c, x, y, s * 0.1, R.hi, R.rim, R.b); c.fill(); ink(c, 0.8); }
    // upper teeth
    for (let i = 0; i < 6; i++) { const x = s * (0.15 + i * 0.15), L = s * (i % 2 ? 0.07 : 0.11); c.beginPath(); c.moveTo(x - s * 0.03, s * 0.08); c.lineTo(x + s * 0.01, s * 0.08 + L); c.lineTo(x + s * 0.035, s * 0.08); c.closePath(); c.fillStyle = '#F6F0DC'; c.fill(); ink(c, 0.8); }
    if (kind === 'frost') for (let i = 0; i < 3; i++) { const x = s * (0.3 + i * 0.25); c.beginPath(); c.moveTo(x - s * 0.03, s * 0.1); c.lineTo(x, s * 0.26 + i * s * 0.03); c.lineTo(x + s * 0.03, s * 0.1); c.closePath(); c.fillStyle = 'rgba(220,246,255,.9)'; c.fill(); ink(c, 0.6); }
    // nostril and its smoke
    c.fillStyle = R.dk; c.beginPath(); c.ellipse(s * 0.98, -s * 0.12, s * 0.06, s * 0.035, 0.4, 0, TAU); c.fill();
    for (let i = 0; i < 3; i++) { const ph = (t * 0.45 + i / 3) % 1; c.globalAlpha = (1 - ph) * 0.35; c.fillStyle = kind === 'fire' ? '#6A5A58' : kind === 'frost' ? '#E8F8FF' : '#8A8A90'; c.beginPath(); c.arc(s * (1.02 + ph * 0.25) + Math.sin(t * 2 + i) * s * 0.05, -s * (0.18 + ph * 0.55), s * (0.05 + ph * 0.1), 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    if (kind === 'fire') for (let i = 0; i < 2; i++) { const ph = (t * 0.9 + i * 0.5) % 1; c.globalAlpha = 1 - ph; c.fillStyle = i ? K.hot : K.breath; c.beginPath(); c.arc(s * (1.0 + ph * 0.2), -s * (0.1 + ph * 0.4), s * 0.025, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    // the brow, heavy over the eye, and the eye under it
    const ex = s * 0.25, ey = -s * 0.22;
    eye(c, ex, ey, s * 0.16, { iris: K.eye, slit: true, lookX: look[0], lookY: look[1], glow: burn ? K.breath : null, ry: 0.7 });
    if (lids > 0) { c.save(); c.beginPath(); c.ellipse(ex, ey, s * 0.17, s * 0.13, 0, 0, TAU); c.clip(); c.fillStyle = R.sh; c.fillRect(ex - s * 0.2, ey - s * 0.15, s * 0.4, s * 0.3 * lids); c.restore(); }
    c.beginPath(); c.moveTo(-s * 0.05, -s * 0.33); c.quadraticCurveTo(s * 0.25, -s * 0.5, s * 0.5, -s * 0.32); c.lineTo(s * 0.44, -s * 0.24); c.quadraticCurveTo(s * 0.22, -s * 0.36, -s * 0.02, -s * 0.24); c.closePath();
    c.fillStyle = lit(c, s * 0.2, -s * 0.38, s * 0.3, R.sh, R.b, R.dk); c.fill(); ink(c, Math.max(0.8, S * 0.016));
    // cheek frills
    for (let i = 0; i < 3; i++) { const a = 2.6 + i * 0.32; c.beginPath(); c.moveTo(-s * 0.35, s * 0.02); c.lineTo(-s * 0.35 + Math.cos(a) * s * (0.42 - i * 0.07), s * 0.02 + Math.sin(a) * s * (0.42 - i * 0.07)); c.lineTo(-s * 0.3 + Math.cos(a + 0.3) * s * 0.12, s * 0.05 + Math.sin(a + 0.3) * s * 0.12); c.closePath(); c.fillStyle = kind === 'leaf' ? (i % 2 ? '#7FCF5A' : '#9BE07A') : shadeC(K.memb, 0.15 + i * 0.06); c.fill(); ink(c, 0.8); }
  }

  P.dragon = function (c, m, r, t, me, lw, sx, sy, B) {
    const S = r, kind = B.el || 'fire', K = KIND[kind] || KIND.fire, R = ramp(m.color), memb = B.id === 'dragon' ? K.memb : shadeC(m.color, -0.34);
    const act = m.act, T = m.actT || 0, ph2 = m.phase >= 2;
    // which way it faces: toward the pet, swinging round smoothly
    const want = me && me.x < m.x ? -1 : 1; if (m._df == null) m._df = want; m._df += (want - m._df) * 0.12; const face = Math.abs(m._df) < 0.12 ? (m._df < 0 ? -0.12 : 0.12) : m._df;
    // the poses each act asks for: rear (lean back, head up), gape (jaw), coil and whip (tail), spread and beat (wings)
    let rear = 0, gape = 0.08 + 0.05 * Math.sin(t * 2.6), coil = 0, whip = 0, spread = 0.75 + 0.08 * Math.sin(t * 1.3), beat = Math.sin(t * 1.9) * 0.25, throat = 0, headDown = 0, lids = 0, twist = 0;
    if (act === 'breath') { if (T < 0.9) { const u = ss(T / 0.9); rear = u; throat = u; gape = lerp(gape, 0.35, u); spread = lerp(spread, 1.05, u); } else if (T < 3.0) { rear = 0.35; gape = 0.95; throat = 1; spread = 1.05; } else { const u = ss((T - 3.0) / 0.4); rear = 0.35 * (1 - u); gape = lerp(0.95, 0.1, u); } }
    else if (act === 'tail') { if (T < 0.7) { const u = ss(T / 0.7); coil = u; twist = u; } else { const u = ss((T - 0.7) / 0.35); coil = 1 - u; whip = Math.sin(Math.min(1, u) * Math.PI); twist = 1 - u; } }
    else if (act === 'fireballs') { rear = 0.55; gape = 0.45 + 0.45 * Math.abs(Math.sin(T * 10.5)); throat = 0.6; spread = 0.95; }
    else if (act === 'dive') { beat = Math.sin(t * 13) * 0.9; spread = 1.1; rear = 0.25; gape = 0.3; }
    else if (act === 'stunned' || act === 'dizzy') { headDown = 0.8; gape = 0.35; spread = 0.45; beat = 0; lids = 0.45; }
    else if (act === 'sleep') { headDown = 1; gape = 0.02; spread = 0.25; beat = Math.sin(t * 0.8) * 0.05; lids = 1; }
    if (act === 'move') beat = Math.sin(t * 2.6) * 0.32;
    const hurt = clamp((m.flash || 0) * 4, 0, 1), breathe = Math.sin(t * 1.6) * 0.025;
    rear += hurt * 0.4; spread += hurt * 0.25;
    const walk = act === 'move' ? Math.sin(t * 6) : 0;
    c.save(); c.scale(face, 1);
    // everything leans back about the feet as it rears
    c.translate(0, S * 1.05); c.rotate(-rear * 0.16 - twist * 0.08); c.translate(0, -S * 1.05);
    const bob = Math.sin(t * 2.2) * S * 0.03 + Math.abs(walk) * S * 0.04;
    c.translate(0, -bob);
    // 1. the far wing, behind everything
    c.save(); c.translate(-S * 0.38, -S * 0.32); c.scale(0.9, 0.94);
    wing(c, S, -1, spread, beat, ramp(R.sh), shadeC(memb, -0.15), K, t, { torn: kind === 'shadow', spark: kind === 'spark', hot: throat }); c.restore();
    // 1b. the near wing, spread behind the body too (both wings rise from the upper back)
    c.save(); c.translate(S * 0.36, -S * 0.36);
    wing(c, S, 1, spread, beat, R, memb, K, t, { torn: kind === 'shadow', spark: kind === 'spark', hot: throat }); c.restore();
    // 2. the tail
    tail(c, S, R, K, t, coil, whip, kind);
    // 3. the far hind leg
    hindLeg(c, S, -1, R, K, walk > 0 ? walk : 0, true);
    // 4. the body: a barrel that breathes, scales, ventral scutes lit from inside when it gathers its breath
    const body = () => blobPath(c, [[-0.82, -0.25], [-0.95, 0.35], [-0.62, 0.95], [0.1, 1.05], [0.72, 0.85], [0.92, 0.32], [0.78, -0.3], [0.32, -0.62], [-0.38, -0.62]].map(([x, y]) => [x * (1 + breathe), y * (1 - breathe * 0.5) + 0.12]), S);
    form(c, body, 0, S * 0.25, S * 1.0, R.b, { lw: Math.max(1.2, S * 0.024), hi: R.hi, dk: R.dk, shade: 0.5 });
    scales(c, body, R.b, S * 0.18, 0.42);
    c.save(); body(); c.clip();
    for (let i = 0; i < 7; i++) {
      const y = S * (-0.28 + i * 0.17), w = S * (0.42 - Math.abs(i - 3) * 0.045), x0 = S * 0.12;
      c.beginPath(); c.moveTo(x0 - w, y); c.quadraticCurveTo(x0, y - S * 0.05, x0 + w, y); c.lineTo(x0 + w * 0.97, y + S * 0.15); c.quadraticCurveTo(x0, y + S * 0.2, x0 - w * 0.97, y + S * 0.15); c.closePath();
      c.fillStyle = lit(c, x0 - w * 0.3, y + S * 0.05, w, K.belly, shadeC(K.belly, 0.28), shadeC(K.belly, -0.38)); c.fill(); ink(c, Math.max(0.8, S * 0.014));
      if (throat > 0 || ph2) { const a = Math.max(throat * ss((throat * 7 - (6 - i)) / 2), ph2 ? 0.25 : 0); if (a > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.8; c.fillStyle = K.breath; c.fillRect(x0 - w, y + S * 0.145, w * 2, S * 0.03); c.restore(); } }
    }
    if (kind === 'shadow') { c.strokeStyle = 'rgba(40,32,22,.55)'; c.lineWidth = Math.max(1, S * 0.025); for (let i = 0; i < 4; i++) { const y = S * (0.0 + i * 0.16); c.beginPath(); c.moveTo(-S * 0.75, y - S * 0.05); c.quadraticCurveTo(-S * 0.45, y + S * 0.1, -S * 0.2, y + S * 0.06); c.stroke(); } }
    if (ph2) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = K.breath; c.globalAlpha = 0.65 + 0.25 * Math.sin(t * 5); c.lineWidth = Math.max(1, S * 0.022); c.beginPath(); c.moveTo(-S * 0.55, -S * 0.1); c.lineTo(-S * 0.42, S * 0.12); c.lineTo(-S * 0.5, S * 0.3); c.moveTo(-S * 0.42, S * 0.12); c.lineTo(-S * 0.28, S * 0.2); c.stroke(); c.restore(); }
    c.restore();
    // a rim of light along the back
    c.save(); c.strokeStyle = R.rim; c.globalAlpha = 0.45; c.lineWidth = Math.max(1, S * 0.02); c.beginPath(); c.moveTo(-S * 0.86, S * 0.05); c.quadraticCurveTo(-S * 0.75, -S * 0.42, -S * 0.3, -S * 0.5); c.stroke(); c.restore();
    // 5. the near hind leg
    hindLeg(c, S, 1, R, K, walk < 0 ? -walk : 0, false);
    // 6. the arms, small and clawed, held to the chest (thrown wide when it rears to breathe)
    [-1, 1].forEach(sd => { const ax = sd * S * 0.42, ay = S * 0.05, hx = sd * S * (0.66 + rear * 0.2), hy = S * (0.48 - rear * 0.15) + Math.sin(t * 2 + sd) * S * 0.02;
      limb(c, ax, ay, hx, hy, S * 0.27, S * 0.19, sd < 0 ? R.sh : R.b, { rings: 2, lw: Math.max(1, S * 0.018) }); form(c, ellB(c, hx, hy + S * 0.02, S * 0.13, S * 0.1), hx, hy, S * 0.13, sd < 0 ? R.sh : R.b, { lw: Math.max(1, S * 0.016), spec: false });
      for (let k = 0; k < 3; k++) horn(c, hx + sd * S * (-0.07 + k * 0.07), hy + S * 0.08, S * 0.19, 1.3 + sd * 0.12 * (k - 1), S * 0.06, K.horn, 0.25, { lw: 0.8 }); });
    // 7. the neck: seven segments from the chest to the head, throat plates in front, spines behind
    const look = [clamp(((me ? me.x : m.x) - m.x) * face, -1, 1), clamp((me ? me.y : m.y) - m.y, -1, 1)];
    let hx = S * (0.3 + rear * 0.05 + 0.04 * Math.sin(t * 1.1)), hy = -S * (1.28 + rear * 0.28) + Math.sin(t * 1.7) * S * 0.04 + headDown * S * 0.85; hx += headDown * S * 0.75;
    if (act === 'breath' && m.ba != null && T >= 0.9) { const ax = Math.cos(m.ba) * face, ay = Math.sin(m.ba); hx += ax * S * 0.25; hy += ay * S * 0.2; }
    const nb = [S * 0.12, -S * 0.42], nc = [S * (0.42 + headDown * 0.35), -S * (0.95 - headDown * 0.35)];
    const NS = 10, neck = [];
    for (let i = 0; i <= NS; i++) { const u = i / NS, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u; neck.push([a * nb[0] + b * nc[0] + d * hx, a * nb[1] + b * nc[1] + d * hy]); }
    const nw = u => S * lerp(0.36, 0.24, u), nrm = i => { const p0 = neck[Math.max(0, i - 1)], p1 = neck[Math.min(NS, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; };
    const edge = sgn => neck.map((p, i) => { const n = nrm(i), w = nw(i / NS); return [p[0] + n[0] * w * sgn, p[1] + n[1] * w * sgn]; });
    const back = edge(1), front = edge(-1);   /* (back: the side away from the viewer's lower right; front: the throat) */
    // spines along the back edge first
    for (let i = 1; i < NS; i += 2) { const p = back[i], n = nrm(i), L = S * (0.2 - i * 0.008); c.beginPath(); c.moveTo(p[0] - n[1] * S * 0.07, p[1] + n[0] * S * 0.07); c.lineTo(p[0] + n[0] * L - n[1] * S * 0.08, p[1] + n[1] * L + n[0] * S * 0.08); c.lineTo(p[0] + n[1] * S * 0.07, p[1] - n[0] * S * 0.07); c.closePath(); c.fillStyle = lit(c, p[0], p[1], L, R.sh, R.b, R.dk); c.fill(); ink(c, Math.max(0.8, S * 0.014)); }
    const neckPath = () => { c.beginPath(); back.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let i = NS; i >= 0; i--) c.lineTo(front[i][0], front[i][1]); c.closePath(); };
    const g2 = c.createLinearGradient(back[NS >> 1][0], back[NS >> 1][1], front[NS >> 1][0], front[NS >> 1][1]); g2.addColorStop(0, R.hi); g2.addColorStop(0.45, R.b); g2.addColorStop(1, R.dk);
    neckPath(); c.fillStyle = g2; c.fill(); scales(c, neckPath, R.b, S * 0.15, 0.36);
    // throat plates down the front, lit from inside as it gathers its breath
    c.save(); neckPath(); c.clip();
    for (let i = 0; i < NS; i++) { const p = front[i], q = front[i + 1], n = nrm(i), w = nw(i / NS) * 0.75, cx = (p[0] + q[0]) / 2 - n[0] * w * -0.5, cy = (p[1] + q[1]) / 2 - n[1] * w * -0.5, a = Math.atan2(q[1] - p[1], q[0] - p[0]);
      c.beginPath(); c.ellipse(cx + n[0] * w * 0.15, cy + n[1] * w * 0.15, Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.62, w * 0.62, a, 0, TAU); c.fillStyle = lit(c, cx, cy, w, shadeC(K.belly, -0.06), shadeC(K.belly, 0.2), shadeC(K.belly, -0.3)); c.fill(); c.strokeStyle = 'rgba(22,12,34,.45)'; c.lineWidth = 0.8; c.stroke();
      const ga = throat * ss((throat * (NS + 3) - i) / 2.5); if (ga > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = ga * 0.7; glow(c, cx, cy, w * 1.4, K.breath, 1); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } }
    c.restore(); neckPath(); ink(c, Math.max(1, S * 0.02));
    // 8. the head, turned along the neck's end (and down when it hangs or sleeps)
    const na = Math.atan2(neck[NS][1] - neck[NS - 1][1], neck[NS][0] - neck[NS - 1][0]);
    c.save(); c.translate(hx, hy); c.rotate(clamp(na + Math.PI / 2, -0.6, 0.6) * 0.4 - rear * 0.35 + headDown * 0.7 + (act === 'stunned' ? Math.sin(t * 3) * 0.12 : 0) - hurt * 0.3);
    head(c, S, R, K, kind, gape, look, t, lids, ph2);
    if (act === 'stunned' || act === 'dizzy') for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; c.fillStyle = '#FFE37A'; c.globalAlpha = 0.85; c.beginPath(); c.arc(S * 0.2 + Math.cos(a) * S * 0.35, -S * 0.65 + Math.sin(a) * S * 0.1, S * 0.05, 0, TAU); c.fill(); }
    c.globalAlpha = 1; c.restore();
    // frost breath hangs in the air round it; the inferno sheds embers
    if (kind === 'frost') for (let i = 0; i < 4; i++) { const ph = (t * 0.25 + i / 4) % 1; c.globalAlpha = 0.25 * (1 - ph); c.fillStyle = '#EAF8FF'; c.beginPath(); c.arc(S * (-0.6 + i * 0.4), S * (0.9 - ph * 0.5), S * (0.12 + ph * 0.18), 0, TAU); c.fill(); }
    if (kind === 'fire') for (let i = 0; i < 5; i++) { const ph = (t * 0.4 + i * 0.21) % 1; c.globalAlpha = 0.9 * (1 - ph); c.fillStyle = i % 2 ? K.hot : K.breath; c.beginPath(); c.arc(S * (-0.5 + i * 0.25) + Math.sin(t * 2 + i) * S * 0.08, S * (0.3 - ph * 1.6), S * 0.03, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    c.restore();
  };
  REACH.dragon = 3.7;
})();
