/* ---------- the bestiary's bones: shared painters for the high tower's Super Fiends ----------
   Quadrupeds with IK legs and a gait, wings of membrane or feather, serpents from a trail of points, a drawer of
   heads, and the stone furniture of their arenas (pillars, gates, pylons, slabs, reefs). Everything is painted in
   the fiend hand: lit volumes, textures, rim light, no ink. Each fiend composes these and adds what is its own. */
const FiendBeast = (() => {
  const TAU = Math.PI * 2, lerp = (a, b, u) => a + (b - a) * u;
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  /* ---- a four-, six- or eight-legged beast in profile, facing +x, standing on y = 0, in units of s ----
     o: s, gait, spd, col/hi/dk (hide), tex, texS, rim, body (outline points in s units, y up negative), bodyC, bodyR,
        legs: [{x, y, l1, l2, side, w0, w1, ph, foot}] shoulder/hip joints (each painted twice: far, then near),
        neck: {from, to, w0, w1}, head(c, at, s, near) painted at the neck's end, tail: points, inner(c) markings on the torso,
        mane: {pts, len, lean, n, cols}, lift (pounce: front feet leave the ground), crouch, rear (hind-legs-only stance 0..1) */
  function quadruped(c, K, o) {
    const s = o.s, gait = o.gait || 0, spd = o.spd || 0, cr = o.crouch || 0, re = o.rear || 0, po = o.lift || 0, t = o.t || 0;
    const bob = Math.sin(gait * 2) * s * 0.07 * spd - cr * s * 0.45, rot = -re * 0.55 - po * 0.1, pv = o.pivot || [-1.4, -2.2];
    const P = (x, y) => { const dx = (x - pv[0]) * s, dy = (y - pv[1]) * s; return [pv[0] * s + dx * Math.cos(rot) - dy * Math.sin(rot), pv[1] * s + dx * Math.sin(rot) + dy * Math.cos(rot) + bob]; };
    const PL = pts => pts.map(([x, y]) => P(x, y));
    const hide = (path, x, y, r, extra) => K.body(c, path, x, y, r, Object.assign({ col: o.col, hi: o.hi, dk: o.dk, dk2: o.dk2, tex: o.tex, texA: o.texA == null ? 0.85 : o.texA, texS: o.texS || 0.35, spec: o.spec == null ? 0.18 : o.spec, rim: o.rim, rimA: o.rimA == null ? 0.3 : o.rimA, ao: 0.14, aoA: 0.4 }, extra || {}));
    const foot = (x, y, near, L) => { const kind = L.foot || o.foot || 'paw', dark = near ? 0 : -0.4, col = K.sh(L.col || o.col, dark), w = (L.fw || 0.42) * s;
      if (kind === 'hoof') { K.body(c, () => { c.beginPath(); c.moveTo(x - w * 0.6, y); c.lineTo(x - w * 0.45, y - w * 0.7); c.lineTo(x + w * 0.5, y - w * 0.7); c.lineTo(x + w * 0.7, y); c.closePath(); }, x, y - w * 0.3, w, { col: '#1A1418', hi: '#5A4E58', spec: 0.3 }); return; }
      K.body(c, () => { c.beginPath(); c.moveTo(x - w * 0.7, y); c.quadraticCurveTo(x - w * 0.75, y - w * 0.75, x - w * 0.1, y - w * 0.8); c.quadraticCurveTo(x + w * 0.85, y - w * 0.7, x + w * 1.05, y - w * 0.05); c.closePath(); }, x, y - w * 0.35, w, { col, hi: K.sh(col, 0.4), tex: o.tex, texA: 0.7, texS: 0.3, spec: 0.1 });
      c.save(); c.fillStyle = near ? (o.claw || '#D8D0C0') : K.sh(o.claw || '#D8D0C0', -0.45); const n = kind === 'talon' ? 3 : 3; for (let k = 0; k < n; k++) { const cx = x + w * (0.35 + k * 0.26), cy = y - w * 0.08, cl = w * (kind === 'talon' ? 0.55 : 0.32); c.beginPath(); c.moveTo(cx, cy - w * 0.15); c.quadraticCurveTo(cx + cl, cy - w * 0.05, cx + cl * 0.8, cy + w * 0.1); c.lineTo(cx, cy); c.fill(); } c.restore(); };
    const leg = (L, near) => {
      const dark = near ? 0 : -0.42, ox = near ? 0 : -(L.ox == null ? 0.26 : L.ox), J = P(L.x + ox, L.y), ph = L.ph || 0, front = L.side > 0;
      const lift = Math.max(0, Math.sin(gait + ph)) * 0.5 * (0.2 + spd) * (1 - re * front), stride = -Math.cos(gait + ph) * (L.stride || 0.9) * (0.12 + spd);
      let fx = (L.fx == null ? L.x : L.fx) + ox + stride, fy = -lift;
      if (front && po > 0) { fx = lerp(fx, L.x + ox + 1.3, po); fy = lerp(fy, -1.0, po); }
      if (front && re > 0) { fx = lerp(fx, L.x + ox + 0.9, re); fy = lerp(fy, -(L.l1 + L.l2) * 0.75, re); }
      if (!front && cr > 0) fx -= cr * 0.3;
      const F = [fx * s, fy * s], mid = K.ik(J[0], J[1], F[0] + (front ? -s * 0.08 : -s * 0.3), F[1] - s * (L.ankle || 0.5), L.l1 * s, L.l2 * s, L.side), col = K.sh(L.col || o.col, dark), tx = Object.assign({ col, tex: o.tex, texA: o.texA == null ? 0.9 : o.texA, texS: (o.texS || 0.35) * 0.9, dk: o.dk2 || '#030204', dkA: 0.4, hiA: 0.05, rim: near ? o.rim : null, rimA: 0.2 }, L.tube || {});
      const w0 = (L.w0 || 0.9) * s, w1 = (L.w1 || 0.42) * s, w2 = (L.w2 || 0.3) * s, ank = [F[0] + (front ? -s * 0.08 : -s * 0.3), F[1] - s * (L.ankle || 0.5)];
      K.tube(c, [J, [(J[0] + mid[0]) / 2 + (front ? s * 0.1 : -s * 0.12), (J[1] + mid[1]) / 2], mid], u => w0 * (1 - u) + w1 * u, tx);
      K.tube(c, [mid, [(mid[0] + ank[0]) / 2, (mid[1] + ank[1]) / 2], ank], u => w1 - (w1 - w2) * u, tx);
      if (o.fur !== false && o.mane !== null) K.tufts(c, s, [mid, ank], 0.2, 0.6, 5, (L.x * 100 | 0) + (near ? 1 : 2), { cols: o.furCols || [K.sh(col, -0.1), K.sh(col, -0.3), K.sh(col, 0.05)] });
      K.tube(c, [ank, [lerp(ank[0], F[0], 0.5) + s * 0.03, lerp(ank[1], F[1], 0.5)], [F[0] + s * 0.05, F[1] - s * 0.1]], u => w2 - u * s * 0.03, Object.assign({}, tx, { texA: 0.7 }));
      foot(F[0], F[1], near, L);
      if (L.extra) L.extra(c, { J, mid, ank, F, near, s });
    };
    const legs = o.legs || [{ x: 1.6, y: -2.3, l1: 1.15, l2: 1.05, side: 1, ph: 0 }, { x: -1.9, y: -2.5, l1: 1.25, l2: 1.2, side: -1, ph: Math.PI }];
    // far legs, tail, torso, mane, neck, head, near legs
    legs.forEach(L => leg(L, false));
    if (o.tail) { const tl = PL(o.tail); K.tube(c, tl, u => s * ((o.tailW0 || 0.5) * (1 - u) + (o.tailW1 || 0.12) * u + Math.sin(u * Math.PI) * (o.tailBulge || 0)), Object.assign({ col: o.dk || K.sh(o.col, -0.2), tex: o.tex, texA: 0.9, texS: 0.3, dk: '#030204', dkA: 0.55, hiA: 0.06, rim: o.rim, rimA: 0.15 }, o.tailTube || {})); if (o.tailTufts) K.tufts(c, s, tl, 0.35, 0.7, 20, 53, { cols: o.furCols }); if (o.tailTip) o.tailTip(c, tl[tl.length - 1], tl[tl.length - 2]); }
    const torso = PL(o.body || [[-2.6, -2.7], [-2.0, -3.1], [-1.0, -3.05], [0.2, -3.15], [1.3, -3.4], [2.1, -3.2], [2.5, -2.5], [2.3, -1.75], [1.4, -1.5], [0.3, -1.6], [-0.8, -1.9], [-1.7, -2.1], [-2.5, -2.1], [-2.85, -2.45]]), tc = P(...(o.bodyC || [-0.1, -2.5]));
    hide(K.blobP(c, torso), tc[0], tc[1], s * (o.bodyR || 2.6), { inner: () => {
      // the volumes under the hide: muscle groups lit from above, a shadowed belly, light in the veins, armour in rows
      if (o.muscles !== false) volumes(c, K, P, s, o.muscles || defaultMuscles(o), o);
      if (o.veins) veins(c, P, s, o.veins, t);
      if (o.scaleRows) scaleRows(c, K, P, s, o.scaleRows, o);
      if (o.inner) o.inner(c, P, PL, s);
    } });
    if (o.mane) K.tufts(c, s, PL(o.mane.pts), o.mane.len || 0.5, o.mane.lean == null ? 0.6 : o.mane.lean, o.mane.n || 28, 71, { cols: o.mane.cols || o.furCols, w: o.mane.w || 1.2 });
    if (o.neck) { const N = o.neck, a = P(...N.from), b = P(...N.to), mid = [(a[0] + b[0]) / 2 + (N.bow || 0) * s, (a[1] + b[1]) / 2 - Math.abs(N.bow || 0) * s * 0.4]; K.tube(c, [a, mid, b], u => s * ((N.w0 || 1.4) * (1 - u) + (N.w1 || 0.9) * u), Object.assign({ col: o.col, tex: o.tex, texA: 0.9, texS: o.texS || 0.35, dk: o.dk2 || '#030204', dkA: 0.45, hiA: 0.08, rim: o.rim, rimA: 0.3 }, N.tube || {})); if (N.mane) K.tufts(c, s, [a, mid, b], N.mane.len || 0.45, 0.5, N.mane.n || 14, 77, { cols: N.mane.cols || o.furCols }); }
    if (o.head) { const at = P(...(o.neck ? o.neck.to : [2.4, -3.2])); o.head(c, at, s, P); }
    legs.forEach(L => leg(L, true));
    // the big masses over the near limbs: a haunch and a shoulder, so the legs read as rooted in the body
    if (o.muscles !== false && o.masses !== false) { const hind = legs.filter(L => L.side < 0).sort((a, b) => a.x - b.x)[0], fore = legs.filter(L => L.side > 0).sort((a, b) => b.x - a.x)[0];
      if (hind) mass(c, K, P, hind.x + 0.15, hind.y + 0.2, (o.haunchR || 1.05) * s, (o.haunchR || 1.05) * s * 0.72, 0.45, o.haunchCol ? Object.assign({}, o, { col: o.haunchCol, hi: K.sh(o.haunchCol, 0.4), dk: K.sh(o.haunchCol, -0.5) }) : o);
      if (fore) mass(c, K, P, fore.x - 0.15, fore.y + 0.15, (o.shoulderR || 0.8) * s, (o.shoulderR || 0.8) * s * 1.05, -0.4, o.shoulderCol ? Object.assign({}, o, { col: o.shoulderCol, hi: K.sh(o.shoulderCol, 0.4), dk: K.sh(o.shoulderCol, -0.5) }) : o); }
    if (o.after) o.after(c, P, PL, s);
    return { P, PL };
  }
  function defaultMuscles(o) { return [[-1.9, -2.3, 1.0, 0.75, 0.2], [-0.4, -2.5, 1.1, 0.55, 0], [1.2, -2.6, 1.0, 0.8, -0.3], [0.3, -1.85, 1.4, 0.4, 0]]; }
  /* soft bulges: a light on the upper left of each, shadow pooling under, drawn as light rather than paint so the hide's texture shows through */
  function volumes(c, K, P, s, list, o) { if (K.qq() < 1) return;
    c.save(); list.forEach(([x, y, rx, ry, rot, k]) => { const p = P(x, y), RX = rx * s, RY = ry * s, kk = k == null ? 1 : k;
      c.save(); c.translate(p[0], p[1]); c.rotate(rot || 0);
      c.globalCompositeOperation = 'multiply'; let g = c.createRadialGradient(RX * 0.2, RY * 0.35, RX * 0.1, 0, 0, RX * 1.15); g.addColorStop(0, `rgba(20,10,20,${0.0 * kk})`); g.addColorStop(0.6, `rgba(20,10,20,${0.18 * kk})`); g.addColorStop(1, `rgba(20,10,20,${0.5 * kk})`); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, RX, RY, 0, 0, TAU); c.fill();
      c.globalCompositeOperation = 'soft-light'; g = c.createRadialGradient(-RX * 0.35, -RY * 0.45, 0, -RX * 0.2, -RY * 0.2, RX); g.addColorStop(0, `rgba(255,255,255,${0.95 * kk})`); g.addColorStop(0.5, `rgba(255,255,255,${0.35 * kk})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, RX, RY, 0, 0, TAU); c.fill();
      c.globalCompositeOperation = 'lighter'; g = c.createRadialGradient(-RX * 0.4, -RY * 0.5, 0, -RX * 0.4, -RY * 0.5, RX * 0.45); g.addColorStop(0, `rgba(255,255,255,${0.16 * kk})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-RX, -RY, RX * 2, RY * 2);
      c.restore(); });
    // the shadowed line where the belly turns under
    c.restore();
  }
  function mass(c, K, P, x, y, rx, ry, rot, o) {
    const p = P(x, y); K.body(c, () => { c.beginPath(); c.ellipse(p[0], p[1], rx, ry, rot, 0, TAU); }, p[0], p[1], Math.max(rx, ry), { col: o.col, hi: o.hi, dk: o.dk, dk2: o.dk2, tex: o.tex, texA: o.texA == null ? 0.85 : o.texA, texS: o.texS || 0.35, spec: 0.22, specR: 0.4, rim: o.rim, rimA: 0.2, ao: 0.2, aoA: 0.5 });
    if (o.fur !== false) K.tufts(c, o.s, [[p[0] - rx * 0.7, p[1] + ry * 0.6], [p[0] + rx * 0.4, p[1] + ry * 0.85]], 0.25, 0.4, 8, 131, { cols: o.furCols });
  }
  /* light running in the veins: branching lines that breathe */
  function veins(c, P, s, V, t) { if (DunFiend.KIT.qq() < 1) return;
    const R = mulberry32(V.seed || 3), col = V.col || '#FF9F43', n = V.n || 5, k = V.k == null ? 1 : V.k;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 0; i < n; i++) { const [x0, y0] = P(V.x0 + (R() - 0.5) * V.w, V.y0 + (R() - 0.5) * V.h); const branch = (x, y, a, L, w, d) => { const x1 = x + Math.cos(a) * L, y1 = y + Math.sin(a) * L, pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + i + d); c.strokeStyle = `rgba(${hexRGB(col).join(',')},${(0.25 + 0.5 * pulse) * k})`; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + x1) / 2 + (R() - 0.5) * L * 0.5, (y + y1) / 2 + (R() - 0.5) * L * 0.5, x1, y1); c.stroke(); if (d > 0) { branch(x1, y1, a + (R() - 0.5) * 1.4, L * 0.65, w * 0.7, d - 1); if (R() < 0.7) branch(x1, y1, a + (R() - 0.5) * 1.4, L * 0.55, w * 0.6, d - 1); } };
      branch(x0, y0, R() * TAU, s * 0.6, Math.max(1, s * 0.05), 3); }
    c.restore();
  }
  /* rows of individual scales or plates along curves, each bevelled and lit on its own */
  function scaleRows(c, K, P, s, rows, o) { if (K.qq() < 1) return;
    rows.forEach((row, ri) => { const pts = row.pts.map(([x, y]) => P(x, y)), n = row.n || 8, sz = (row.size || 0.3) * s, col = row.col || o.col, R = mulberry32(17 + ri);
      for (let i = 0; i < n; i++) { const u = i / (n - 1), k = u * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(k)), e = k - j, x = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * e, y = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * e, a = Math.atan2(pts[j + 1][1] - pts[j][1], pts[j + 1][0] - pts[j][0]), w = sz * (row.taper ? 1 - u * 0.5 : 1);
        c.save(); c.translate(x, y); c.rotate(a + (row.tilt || 0)); if (K.qq() < 2) { if (i % (K.qq() < 1 ? 3 : 2) === 0) { c.fillStyle = K.sh(col, -0.1); c.beginPath(); c.moveTo(-w * 0.5, -w * 0.45); c.quadraticCurveTo(w * 0.5, -w * 0.5, w * 0.75, 0); c.quadraticCurveTo(w * 0.5, w * 0.5, -w * 0.5, w * 0.45); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(0.8, w * 0.07); c.stroke(); } c.restore(); continue; } K.body(c, () => { c.beginPath(); c.moveTo(-w * 0.5, -w * 0.45); c.quadraticCurveTo(w * 0.5, -w * 0.5, w * 0.75, 0); c.quadraticCurveTo(w * 0.5, w * 0.5, -w * 0.5, w * 0.45); c.closePath(); }, 0, 0, w * 0.7, { col: K.sh(col, (R() - 0.5) * 0.12), hi: K.sh(col, 0.5), dk: K.sh(col, -0.5), tex: o.tex, texA: 0.4, texS: 0.25, spec: 0.45, specR: 0.35, rim: row.rim || o.rim, rimA: 0.35, ao: 0.12, aoA: 0.45, edge: row.edge || null, edgeA: 0.8, edgeW: Math.max(0.8, w * 0.07) }); c.restore(); } });
  }
  /* ---- the aura: what the air does round a thing like this. Behind the body: a halo on the ground and rising light;
     in front: motes and rays. Deterministic in t, so it costs nothing to remember ---- */
  function aura(c, K, X, Y, s, o, front) {
    const col = o.col, t = o.t || 0, k = o.k == null ? 1 : o.k, R = mulberry32(o.seed || 5); if (k <= 0.01) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    if (!front) {
      c.globalAlpha = 0.28 * k; blitSized(c, glowSprite(col), X - s * 4.5, Y - s * 4.5 - s * 1.5, s * 9, s * 9);
      // a halo on the ground
      c.globalAlpha = 0.5 * k; c.save(); c.translate(X, Y + s * 0.1); c.scale(1, 0.28); const g = c.createRadialGradient(0, 0, s * 1.5, 0, 0, s * 4); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.6, rgba(col, 0.28)); g.addColorStop(0.75, rgba(col, 0.05)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * 4, 0, TAU); c.fill(); c.restore();
      // rays
      if (o.rays !== false) { c.globalAlpha = 0.18 * k; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i - 4.5) * 0.3 + Math.sin(t * 0.7 + i) * 0.08, L = s * (3 + 1.5 * Math.abs(Math.sin(t * 1.1 + i * 1.7))), w = s * 0.35; c.save(); c.translate(X, Y - s * 1.6); c.rotate(a + Math.PI / 2); c.drawImage(sheetSprite(col), -w, -L, w * 2, L); c.restore(); } }   // (each ray a soft sheet of light: brightest at its root, fading out to its tip and at both sides)
    } else {
      // motes rising and drifting about it, and a thin heat shimmer line
      const n = o.motes == null ? 18 : o.motes; for (let i = 0; i < n; i++) { const ph = ((t * (0.25 + (i % 4) * 0.08) + i * 0.173) % 1), x = X + Math.sin(i * 2.4 + t * 0.6) * s * (1.8 + (i % 3) * 0.7), y = Y - s * 0.4 - ph * s * 4.2, r = s * (0.08 + (i % 3) * 0.05) * (1 - ph * 0.6); c.globalAlpha = (0.9 - ph * 0.9) * k; blitSized(c, glowSprite(i % 5 === 0 ? '#FFFFFF' : col), x - r * 2.5, y - r * 2.5, r * 5, r * 5); }
      if (o.rings) { c.globalAlpha = 0.35 * k; c.strokeStyle = rgba(col, 0.9); c.lineWidth = 1.5; for (let i = 0; i < 2; i++) { const ph = (t * 0.4 + i * 0.5) % 1; c.save(); c.translate(X, Y - s * 1.6); c.scale(1, 0.5); c.beginPath(); c.arc(0, 0, s * (1.5 + ph * 3), 0, TAU); c.stroke(); c.restore(); } }
    }
    c.restore();
  }
  /* ---- a wing: fingers radiating from a wrist with membrane between (bat) or rows of feathers (feather) ----
     o: s, at [x,y] shoulder, span, a (angle of the arm, radians; 0 = straight out behind), flap (0..1 raises the tips), kind, col, memb, far, feathersCol, ice */
  function wing(c, K, o) {
    const s = o.s, [ax, ay] = o.at, dir = o.dir || -1, span = o.span * s, fl = o.flap || 0, kind = o.kind || 'bat', far = !!o.far, dk = far ? -0.35 : 0;
    const a0 = (o.a == null ? -0.25 : o.a) - fl * 0.9, elbow = [ax + Math.cos(a0) * span * 0.42 * dir, ay + Math.sin(a0) * span * 0.42 - fl * span * 0.15], a1 = a0 + 0.35 - fl * 0.6, wrist = [elbow[0] + Math.cos(a1) * span * 0.33 * dir, elbow[1] + Math.sin(a1) * span * 0.33];
    const col = K.sh(o.col, dk), memb = K.sh(o.memb || o.col, dk), n = o.fingers || 4, tips = [];
    for (let i = 0; i < n; i++) { const u = i / (n - 1), fa = a1 - 0.15 + u * (1.25 + fl * 0.3), L = span * (0.62 - u * 0.2); tips.push([wrist[0] + Math.cos(fa) * L * dir, wrist[1] + Math.sin(fa) * L]); }
    if (kind === 'bat') {
      // the membrane: a scalloped sheet from the body to each fingertip
      c.save(); const path = () => { c.beginPath(); c.moveTo(ax, ay + s * 0.9); c.lineTo(elbow[0], elbow[1]); c.lineTo(wrist[0], wrist[1]); tips.forEach((tp, i) => { c.lineTo(tp[0], tp[1]); const nx = tips[i + 1]; if (nx) { const mx = (tp[0] + nx[0]) / 2, my = (tp[1] + nx[1]) / 2; c.quadraticCurveTo(mx + (wrist[0] - mx) * 0.42, my + (wrist[1] - my) * 0.42, nx[0], nx[1]); } }); const lt = tips[tips.length - 1], bx = ax + s * 0.3 * dir, by = ay + s * 1.9; c.quadraticCurveTo((lt[0] + bx) / 2 + (wrist[0] - (lt[0] + bx) / 2) * 0.3, (lt[1] + by) / 2 + (wrist[1] - (lt[1] + by) / 2) * 0.3, bx, by); c.closePath(); };
      K.body(c, path, wrist[0], wrist[1], span * 0.5, { col: memb, hi: K.sh(memb, 0.45), dk: K.sh(memb, -0.55), tex: o.tex || 'skin', texA: 0.7, texS: 0.45, spec: 0.12, rim: o.rim, rimA: far ? 0.1 : 0.3, ao: 0.08, aoA: 0.3, inner: () => { c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = s * 0.3; tips.forEach(tp => { c.beginPath(); c.moveTo(wrist[0], wrist[1]); c.lineTo(tp[0], tp[1]); c.stroke(); }); c.restore(); if (o.ragged) { c.globalCompositeOperation = 'destination-out'; const R = mulberry32(far ? 3 : 5); tips.forEach((tp, i) => { const nx = tips[i + 1]; if (!nx) return; for (let k = 0; k < 3; k++) { const u = 0.2 + R() * 0.6, x = lerp(tp[0], nx[0], u), y = lerp(tp[1], nx[1], u) + s * 0.3; c.beginPath(); c.arc(x, y, s * (0.1 + R() * 0.22), 0, TAU); c.fill(); } }); c.globalCompositeOperation = 'source-over'; } if (o.inner) o.inner(c, { tips, wrist, elbow }); } });
      c.restore();
      // the arm and the fingers
      K.tube(c, [[ax, ay], elbow, wrist], u => s * (0.5 * (1 - u) + 0.26 * u), { col, tex: o.tex || 'skin', texA: 0.8, texS: 0.4, dk: '#030204', dkA: 0.5, hiA: 0.1 });
      tips.forEach((tp, i) => K.tube(c, [wrist, [(wrist[0] + tp[0]) / 2, (wrist[1] + tp[1]) / 2 + s * 0.05], tp], u => s * (0.17 - u * 0.09), { col, dkA: 0.5, hiA: 0.08 }));
      c.fillStyle = o.claw || '#D8D0C0'; const th = tips[0]; c.beginPath(); c.moveTo(wrist[0], wrist[1] - s * 0.1); c.lineTo(wrist[0] + dir * s * 0.1, wrist[1] - s * 0.55); c.lineTo(wrist[0] + dir * s * 0.25, wrist[1] - s * 0.1); c.fill(); th;
    } else {
      // feathers: primaries fan from the wrist, secondaries along the arm, coverts over the roots
      const fc = K.sh(o.feathersCol || o.col, dk), fc2 = K.sh(o.feathersCol2 || K.sh(fc, -0.25), dk);
      const quill = (x, y, a, L, w, col2) => { c.save(); c.translate(x, y); c.rotate(a); K.body(c, () => { c.beginPath(); c.moveTo(0, -w); c.quadraticCurveTo(L * 0.55, -w * 1.2, L, 0); c.quadraticCurveTo(L * 0.55, w * 1.2, 0, w); c.closePath(); }, L * 0.5, 0, L * 0.5, { col: col2, hi: K.sh(col2, 0.3), dk: K.sh(col2, -0.45), tex: 'feather', texA: 0.7, texS: 0.4, spec: 0.12, ao: 0.08, aoA: 0.3, rim: o.rim, rimA: far ? 0.05 : 0.22 }); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(0.6, w * 0.12); c.beginPath(); c.moveTo(0, 0); c.lineTo(L * 0.9, 0); c.stroke(); if (o.ice) { c.strokeStyle = 'rgba(220,245,255,.5)'; c.lineWidth = w * 0.25; c.beginPath(); c.moveTo(L * 0.3, -w * 0.6); c.lineTo(L * 0.85, -w * 0.15); c.stroke(); } c.restore(); };
      const np = o.primaries || 7, fw = o.fw || 1; for (let i = np - 1; i >= 0; i--) { const u = i / (np - 1), fa = a1 - 0.25 + u * (1.2 + fl * 0.35), L = span * (0.68 - u * 0.2), w = s * 0.34 * fw; quill(wrist[0], wrist[1], dir > 0 ? fa : Math.PI - fa, L, w, i % 2 ? fc : fc2); }
      for (let i = 0; i < 7; i++) { const u = i / 6, x = lerp(ax, elbow[0], u), y = lerp(ay, elbow[1], u), fa = a0 + 1.1 - fl * 0.3 + u * 0.2, L = span * 0.4, w = s * 0.32 * fw; quill(x, y, dir > 0 ? fa : Math.PI - fa, L, w, i % 2 ? fc2 : fc); }
      for (let i = 0; i < 6; i++) { const u = i / 5, x = lerp(elbow[0], wrist[0], u), y = lerp(elbow[1], wrist[1], u), fa = a1 + 1.0 - fl * 0.3 + u * 0.3, L = span * 0.32, w = s * 0.28 * fw; quill(x, y, dir > 0 ? fa : Math.PI - fa, L, w, i % 2 ? fc : fc2); }
      // coverts: short soft feathers lying over the arm, hiding the bone
      for (let i = 0; i < 9; i++) { const u = i / 8, x = lerp(ax, wrist[0], u), y = lerp(ay, wrist[1], u), fa = (u < 0.45 ? a0 : a1) + 0.9 - fl * 0.2, L = span * 0.2, w = s * 0.22 * fw; quill(x, y, dir > 0 ? fa : Math.PI - fa, L, w, K.sh(o.covertCol || col, (i % 2) * 0.15)); }
      K.tube(c, [[ax, ay], elbow, wrist], u => s * (0.42 * (1 - u) + 0.22 * u), { col, tex: 'feather', texA: 0.8, texS: 0.4, dk: '#030204', dkA: 0.45, hiA: 0.12, rim: o.rim, rimA: far ? 0.05 : 0.2 });
      if (o.inner) o.inner(c, { tips, wrist, elbow });
    }
    return { elbow, wrist, tips };
  }
  /* ---- a trail of points behind a head, and the body laid along it (serpents, long weasels) ---- */
  function trail(M, m, n, seg) {
    const pts = [], tr = M.trail; let acc = 0; pts.push([tr[0].x, tr[0].y]);
    for (let i = 1; i < tr.length && pts.length < n; i++) { const a = tr[i - 1], b = tr[i], d = Math.hypot(b.x - a.x, b.y - a.y); acc += d; while (acc >= seg && pts.length < n) { acc -= seg; const u = 1 - acc / (d || 1); pts.push([lerp(a.x, b.x, u), lerp(a.y, b.y, u)]); } }
    while (pts.length < n) { const l = pts[pts.length - 1]; pts.push([l[0] - Math.cos(M.hd) * seg, l[1] - Math.sin(M.hd) * seg]); }
    return pts;
  }
  function trailPush(M, m) { const l = M.trail[0]; if (!l || Math.hypot(m.x - l.x, m.y - l.y) > 0.08) { M.trail.unshift({ x: m.x, y: m.y }); if (M.trail.length > 220) M.trail.pop(); } }
  function trailInit(M, m, n, a) { M.hd = a == null ? Math.PI / 2 : a; M.trail = []; for (let i = 0; i < (n || 120); i++) M.trail.push({ x: m.x - Math.cos(M.hd) * i * 0.15, y: m.y - Math.sin(M.hd) * i * 0.15 }); }
  function trailMove(FX, m, M, tx, ty, spd, dt, turn, pad) { const want = Math.atan2(ty - m.y, tx - m.x), d = Math.hypot(tx - m.x, ty - m.y); if (d < 0.1) return 0; M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * (turn || 2))); const v = Math.min(spd, d * 3) * dt; m.x += Math.cos(M.hd) * v; m.y += Math.sin(M.hd) * v; const q = FX.clampArena(m, pad == null ? 1.5 : pad); m.x = q.x; m.y = q.y; M.gait = (M.gait || 0) + v * 1.4; trailPush(M, m); return d; }
  /* the body along screen points, scaled: wfn(i) is the width at point i */
  function serpent(c, K, pts, wfn, o) {
    const N = pts.length;
    c.save(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineCap = 'round'; for (let i = 0; i < N - 1; i++) { c.lineWidth = wfn(i) * 1.1; c.beginPath(); c.moveTo(pts[i][0], pts[i][1] + (o.shadowDy || 0)); c.lineTo(pts[i + 1][0], pts[i + 1][1] + (o.shadowDy || 0)); c.stroke(); } c.restore();
    const body = pts.map(([x, y]) => [x, y - (o.lift || 0)]);
    return K.tube(c, body.slice().reverse(), u => wfn(N - 1 - Math.round(u * (N - 1))), Object.assign({ col: o.col, tex: o.tex || 'scale', texA: 0.95, texS: 0.42, dk: o.dk || '#040A0E', dkA: 0.6, hi: o.hi || '#FFFFFF', hiA: 0.2, rim: o.rim, rimA: 0.3,
      inner: (L, R) => { if (o.belly) { c.strokeStyle = o.belly; c.lineWidth = Math.max(1, wfn(2) * 0.35); c.beginPath(); (body[0][1] < body[N - 1][1] ? R : L).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); } if (o.inner) o.inner(L, R, body); } }, o.tube || {}));
  }
  /* ---- heads: painted in local coordinates, facing +x, the origin at the back of the skull; hs = head size ---- */
  const heads = {
    /* a hound: long muzzle, brow, ears back, a jaw that opens */
    canine(c, K, hs, o) {
      const jaw = o.jaw || 0, col = o.col, hi = o.hi || K.sh(col, 0.4), ears = o.ears == null ? 1 : o.ears;
      for (const s of [1, -1]) { if (s < 0 && !o.farEar) continue; const ex = -hs * 0.25 - (s < 0 ? hs * 0.18 : 0), ey = -hs * 0.55; K.body(c, () => { c.beginPath(); c.moveTo(ex, ey); c.quadraticCurveTo(ex - hs * 0.45, ey - hs * 0.5 * ears, ex - hs * 0.1, ey - hs * 0.95 * ears); c.quadraticCurveTo(ex + hs * 0.25, ey - hs * 0.4, ex + hs * 0.3, ey + hs * 0.05); c.closePath(); }, ex, ey - hs * 0.3, hs * 0.45, { col: K.sh(col, s < 0 ? -0.4 : -0.05), hi, tex: o.tex, texA: 0.8, texS: 0.3, spec: 0.1, rim: o.rim, rimA: 0.3 }); }
      // lower jaw
      c.save(); c.translate(hs * 0.15, hs * 0.1); c.rotate(jaw * 0.85);
      if (jaw > 0.05) { c.fillStyle = o.mouth || '#4A0E16'; c.beginPath(); c.moveTo(-hs * 0.05, -hs * 0.1); c.lineTo(hs * 1.05, -hs * 0.05); c.lineTo(hs * 0.95, hs * 0.05 - hs * 0.4 * jaw); c.closePath(); c.fill(); if (o.breath) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = jaw * 0.9; blitSized(c, glowSprite(o.breath), hs * 0.1, -hs * 0.7, hs * 1.3, hs * 1.1); c.restore(); } }
      K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.1, -hs * 0.08); c.quadraticCurveTo(hs * 0.5, -hs * 0.02, hs * 1.05, -hs * 0.05); c.quadraticCurveTo(hs * 1.1, hs * 0.15, hs * 0.95, hs * 0.22); c.quadraticCurveTo(hs * 0.4, hs * 0.35, -hs * 0.1, hs * 0.25); c.closePath(); }, hs * 0.45, hs * 0.1, hs * 0.6, { col: K.sh(col, -0.1), hi, tex: o.tex, texA: 0.7, texS: 0.3, spec: 0.1 });
      K.teeth(c, [0.3, 0.5, 0.7, 0.9].map((u, i) => [hs * u, -hs * 0.03, -Math.PI / 2 - 0.1, i === 1 ? 1 : 0.55]), hs * 0.16, o.teeth || '#EFE6D2');
      c.restore();
      // skull and muzzle
      K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.5, -hs * 0.15); c.quadraticCurveTo(-hs * 0.45, -hs * 0.85, hs * 0.05, -hs * 0.85); c.quadraticCurveTo(hs * 0.45, -hs * 0.85, hs * 0.7, -hs * 0.45); c.quadraticCurveTo(hs * 0.95, -hs * 0.3, hs * 1.15, -hs * 0.12); c.quadraticCurveTo(hs * 1.22, hs * 0.08, hs * 1.05, hs * 0.14); c.quadraticCurveTo(hs * 0.5, hs * 0.22, -hs * 0.45, hs * 0.22); c.closePath(); }, hs * 0.3, -hs * 0.3, hs * 0.85, { col, hi, dk: K.sh(col, -0.55), tex: o.tex, texA: 0.9, texS: 0.32, spec: 0.3, specR: 0.4, rim: o.rim, rimA: 0.35, inner: () => {
        // the skull's planes: brow ridge, cheek, the dark hollow of the temple; wrinkles over the muzzle when it snarls
        c.save(); c.globalCompositeOperation = 'soft-light'; let g = c.createRadialGradient(hs * 0.05, -hs * 0.6, 0, hs * 0.1, -hs * 0.45, hs * 0.55); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-hs, -hs, hs * 2.5, hs * 2); g = c.createRadialGradient(hs * 0.55, -hs * 0.15, 0, hs * 0.5, -hs * 0.1, hs * 0.5); g.addColorStop(0, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-hs, -hs, hs * 2.5, hs * 2);
        c.globalCompositeOperation = 'multiply'; g = c.createRadialGradient(-hs * 0.15, -hs * 0.25, 0, -hs * 0.1, -hs * 0.2, hs * 0.4); g.addColorStop(0, 'rgba(30,10,20,.55)'); g.addColorStop(1, 'rgba(30,10,20,0)'); c.fillStyle = g; c.fillRect(-hs, -hs, hs * 2.5, hs * 2); c.restore();
        if (jaw > 0.2) { c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = hs * 0.03; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(hs * (0.6 + k * 0.15), -hs * 0.3); c.quadraticCurveTo(hs * (0.68 + k * 0.15), -hs * 0.15, hs * (0.62 + k * 0.15), hs * 0.0); c.stroke(); } }
        if (o.inner) o.inner(); } });
      K.teeth(c, [0.45, 0.65, 0.85, 1.02].map((u, i) => [hs * u, hs * 0.12, Math.PI / 2 + 0.05, i === 0 ? 1 : 0.55]), hs * 0.17, o.teeth || '#F0F6F2');
      c.fillStyle = '#060408'; c.beginPath(); c.ellipse(hs * 1.1, -hs * 0.12, hs * 0.1, hs * 0.07, 0.3, 0, TAU); c.fill();
      K.eyeR(c, hs * 0.2, -hs * 0.42, hs * (o.eyeR || 0.13), o.eye || '#FFB347', { white: o.eyeWhite || '#1A0A0C', irisK: 0.9, ry: 0.75, slit: o.slit });
      if (o.glowEye !== false) K.glow(c, hs * 0.2, -hs * 0.42, hs * 0.45, o.eye || '#FFB347', 0.45);
      c.save(); c.strokeStyle = 'rgba(0,0,0,.75)'; c.lineWidth = hs * 0.07; c.lineCap = 'round'; c.beginPath(); c.moveTo(-hs * 0.05, -hs * 0.6); c.quadraticCurveTo(hs * 0.2, -hs * 0.66, hs * 0.45, -hs * 0.5); c.stroke(); c.restore();
      if (o.after) o.after(c, hs);
    },
    /* a crocodile: long flat jaws, nostrils up, an eye set back under a ridge */
    croc(c, K, hs, o) {
      const jaw = o.jaw || 0, col = o.col, hi = o.hi || K.sh(col, 0.4);
      c.save(); c.translate(hs * 0.1, hs * 0.18); c.rotate(jaw * 0.5);
      if (jaw > 0.05) { c.fillStyle = o.mouth || '#4A1A2A'; c.beginPath(); c.moveTo(0, -hs * 0.05); c.lineTo(hs * 1.7, 0); c.lineTo(hs * 1.6, -hs * 0.5 * jaw); c.closePath(); c.fill(); if (o.breath) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = jaw; blitSized(c, glowSprite(o.breath), hs * 0.2, -hs * 0.9, hs * 1.8, hs * 1.4); c.restore(); } }
      K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.3, -hs * 0.05); c.quadraticCurveTo(hs * 0.8, hs * 0.05, hs * 1.75, -hs * 0.02); c.quadraticCurveTo(hs * 1.8, hs * 0.18, hs * 1.6, hs * 0.22); c.quadraticCurveTo(hs * 0.7, hs * 0.4, -hs * 0.3, hs * 0.3); c.closePath(); }, hs * 0.7, hs * 0.12, hs, { col: K.sh(col, -0.1), hi: o.belly || hi, tex: o.tex || 'scale', texA: 0.7, texS: 0.25, spec: 0.3 });
      K.teeth(c, [0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5].map((u, i) => [hs * u, -hs * 0.02, -Math.PI / 2 - 0.1, 0.5 + (i % 3 === 1 ? 0.6 : 0)]), hs * 0.2, o.teeth || '#E8F0EC');
      c.restore();
      K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.5, -hs * 0.1); c.quadraticCurveTo(-hs * 0.35, -hs * 0.65, hs * 0.3, -hs * 0.6); c.quadraticCurveTo(hs * 1.0, -hs * 0.5, hs * 1.8, -hs * 0.12); c.quadraticCurveTo(hs * 1.95, hs * 0.05, hs * 1.75, hs * 0.14); c.quadraticCurveTo(hs * 0.8, hs * 0.22, -hs * 0.4, hs * 0.26); c.closePath(); }, hs * 0.6, -hs * 0.15, hs * 1.3,
        { col, hi, dk: K.sh(col, -0.55), tex: o.tex || 'scale', texA: 0.95, texS: 0.3, spec: 0.5, rim: o.rim, rimA: 0.35, inner: () => { c.save(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = hs * 0.03; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(hs * (0.1 + k * 0.3), -hs * 0.5); c.quadraticCurveTo(hs * (0.2 + k * 0.3), -hs * 0.2, hs * (0.12 + k * 0.3), hs * 0.15); c.stroke(); } c.fillStyle = 'rgba(0,0,0,.5)'; for (let k = 0; k < 7; k++) { c.beginPath(); c.arc(hs * (k * 0.25), -hs * (0.55 - Math.abs(k - 3) * 0.04), hs * 0.06, 0, TAU); c.fill(); } c.restore(); if (o.inner) o.inner(c, hs); } });
      K.teeth(c, [0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6].map((u, i) => [hs * u, hs * 0.16, Math.PI / 2 + 0.05, 0.55 + (i % 2 ? 0.5 : 0)]), hs * 0.22, o.teeth || '#F0F6F2');
      c.fillStyle = '#040A0E'; c.beginPath(); c.ellipse(hs * 1.7, -hs * 0.12, hs * 0.08, hs * 0.05, 0.3, 0, TAU); c.fill();
      K.eyeR(c, hs * 0.4, -hs * 0.28, hs * 0.14, o.eye || '#FFD447', { white: o.eyeWhite || '#0A2228', irisK: 0.9, ry: 0.7, slit: o.slit == null ? true : o.slit }); K.glow(c, hs * 0.4, -hs * 0.28, hs * 0.5, o.eye || '#FFD447', 0.5);
      c.save(); c.strokeStyle = 'rgba(0,0,0,.8)'; c.lineWidth = hs * 0.07; c.beginPath(); c.moveTo(hs * 0.15, -hs * 0.42); c.quadraticCurveTo(hs * 0.4, -hs * 0.5, hs * 0.7, -hs * 0.36); c.stroke(); c.restore();
      if (o.after) o.after(c, hs);
    },
    /* a bird of prey: hooked beak, fierce brow, feathered crown */
    beak(c, K, hs, o) {
      const col = o.col, hi = o.hi || K.sh(col, 0.4), jaw = o.jaw || 0, bk = o.beak || '#F2B35B';
      K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.55, -hs * 0.1); c.quadraticCurveTo(-hs * 0.5, -hs * 0.85, hs * 0.1, -hs * 0.9); c.quadraticCurveTo(hs * 0.6, -hs * 0.85, hs * 0.75, -hs * 0.35); c.quadraticCurveTo(hs * 0.7, hs * 0.2, hs * 0.2, hs * 0.35); c.quadraticCurveTo(-hs * 0.3, hs * 0.4, -hs * 0.55, hs * 0.1); c.closePath(); }, hs * 0.1, -hs * 0.3, hs * 0.75, { col, hi, dk: K.sh(col, -0.55), tex: o.tex || 'feather', texA: 0.9, texS: 0.35, spec: 0.15, rim: o.rim, rimA: 0.35, inner: o.inner });
      if (o.crest) for (let k = 0; k < 5; k++) { const a = -2.4 + k * 0.22, L = hs * (0.5 + (k === 2 ? 0.3 : 0)); K.tube(c, [[-hs * 0.2 + k * hs * 0.08, -hs * 0.75], [-hs * 0.2 + k * hs * 0.08 + Math.cos(a) * L, -hs * 0.75 + Math.sin(a) * L]], u => hs * (0.12 - u * 0.1), { col: o.crest, hiA: 0.2, dkA: 0.3 }); }
      // lower mandible, then the hooked upper beak
      c.save(); c.translate(hs * 0.55, hs * 0.05); c.rotate(jaw * 0.5); K.body(c, () => { c.beginPath(); c.moveTo(0, -hs * 0.05); c.lineTo(hs * 0.75, hs * 0.02); c.lineTo(hs * 0.7, hs * 0.12); c.quadraticCurveTo(hs * 0.3, hs * 0.25, 0, hs * 0.22); c.closePath(); }, hs * 0.35, hs * 0.1, hs * 0.4, { col: K.sh(bk, -0.2), hi: K.sh(bk, 0.3), spec: 0.3 }); c.restore();
      K.body(c, () => { c.beginPath(); c.moveTo(hs * 0.45, -hs * 0.4); c.quadraticCurveTo(hs * 1.1, -hs * 0.45, hs * 1.25, -hs * 0.05); c.quadraticCurveTo(hs * 1.3, hs * 0.3, hs * 1.1, hs * 0.45); c.quadraticCurveTo(hs * 1.05, hs * 0.1, hs * 0.85, hs * 0.05); c.lineTo(hs * 0.5, hs * 0.08); c.closePath(); }, hs * 0.9, -hs * 0.1, hs * 0.5, { col: bk, hi: K.sh(bk, 0.45), dk: K.sh(bk, -0.5), spec: 0.5, rim: o.rim, rimA: 0.25 });
      c.fillStyle = '#060408'; c.beginPath(); c.ellipse(hs * 0.7, -hs * 0.25, hs * 0.06, hs * 0.04, 0.4, 0, TAU); c.fill();
      K.eyeR(c, hs * 0.22, -hs * 0.35, hs * 0.15, o.eye || '#FFD447', { white: o.eyeWhite || '#F2EADF', irisK: 0.8, ry: 0.85 }); if (o.glowEye) K.glow(c, hs * 0.22, -hs * 0.35, hs * 0.5, o.eye || '#FFD447', 0.4);
      c.save(); c.strokeStyle = 'rgba(0,0,0,.8)'; c.lineWidth = hs * 0.08; c.lineCap = 'round'; c.beginPath(); c.moveTo(-hs * 0.1, -hs * 0.6); c.lineTo(hs * 0.45, -hs * 0.45); c.stroke(); c.restore();
      if (o.after) o.after(c, hs);
    },
    /* a bat: big ears, a leaf nose, a mouth of needle teeth */
    bat(c, K, hs, o) {
      const col = o.col, hi = o.hi || K.sh(col, 0.4), jaw = o.jaw || 0;
      for (const s of [-1, 1]) { const ex = -hs * 0.1 + s * hs * 0.25, ey = -hs * 0.65; K.body(c, () => { c.beginPath(); c.moveTo(ex - hs * 0.2, ey); c.quadraticCurveTo(ex - hs * 0.25, ey - hs * 0.9, ex + hs * 0.05, ey - hs * 1.15); c.quadraticCurveTo(ex + hs * 0.3, ey - hs * 0.5, ex + hs * 0.25, ey + hs * 0.05); c.closePath(); }, ex, ey - hs * 0.4, hs * 0.5, { col: K.sh(col, s < 0 ? -0.35 : 0), hi, tex: 'skin', texA: 0.6, texS: 0.3, spec: 0.1, rim: o.rim, rimA: 0.3, inner: () => { c.fillStyle = o.earIn || 'rgba(120,40,70,.6)'; c.beginPath(); c.moveTo(ex - hs * 0.08, ey - hs * 0.05); c.quadraticCurveTo(ex - hs * 0.1, ey - hs * 0.6, ex + hs * 0.05, ey - hs * 0.85); c.quadraticCurveTo(ex + hs * 0.15, ey - hs * 0.4, ex + hs * 0.12, ey); c.fill(); } }); }
      c.save(); c.translate(hs * 0.2, hs * 0.1); c.rotate(jaw * 0.7); if (jaw > 0.05) { c.fillStyle = o.mouth || '#3A0A14'; c.beginPath(); c.moveTo(0, -hs * 0.05); c.lineTo(hs * 0.7, -hs * 0.02); c.lineTo(hs * 0.65, -hs * 0.4 * jaw); c.closePath(); c.fill(); }
      K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.1, -hs * 0.05); c.quadraticCurveTo(hs * 0.3, 0, hs * 0.72, -hs * 0.02); c.quadraticCurveTo(hs * 0.75, hs * 0.2, hs * 0.6, hs * 0.25); c.quadraticCurveTo(hs * 0.2, hs * 0.35, -hs * 0.1, hs * 0.25); c.closePath(); }, hs * 0.3, hs * 0.1, hs * 0.45, { col: K.sh(col, -0.1), hi, tex: 'skin', texA: 0.6, texS: 0.3, spec: 0.1 });
      K.teeth(c, [0.2, 0.35, 0.5, 0.65].map((u, i) => [hs * u, -hs * 0.03, -Math.PI / 2 - 0.1, i === 0 ? 1.1 : 0.5]), hs * 0.15, o.teeth || '#1A1A22'); c.restore();
      K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.55, -hs * 0.1); c.quadraticCurveTo(-hs * 0.55, -hs * 0.8, hs * 0.05, -hs * 0.8); c.quadraticCurveTo(hs * 0.5, -hs * 0.8, hs * 0.72, -hs * 0.4); c.quadraticCurveTo(hs * 0.9, -hs * 0.2, hs * 0.85, hs * 0.05); c.quadraticCurveTo(hs * 0.7, hs * 0.18, hs * 0.3, hs * 0.2); c.quadraticCurveTo(-hs * 0.3, hs * 0.22, -hs * 0.55, hs * 0.15); c.closePath(); }, hs * 0.15, -hs * 0.3, hs * 0.8, { col, hi, dk: K.sh(col, -0.55), tex: 'fur', texA: 0.9, texS: 0.3, spec: 0.12, rim: o.rim, rimA: 0.35, inner: o.inner });
      K.teeth(c, [0.3, 0.45, 0.6, 0.75].map((u, i) => [hs * u, hs * 0.12, Math.PI / 2 + 0.05, i === 0 ? 1.1 : 0.5]), hs * 0.16, o.teeth || '#1A1A22');
      // the leaf nose
      K.body(c, () => { c.beginPath(); c.moveTo(hs * 0.6, -hs * 0.15); c.quadraticCurveTo(hs * 0.95, -hs * 0.55, hs * 0.85, -hs * 0.7); c.quadraticCurveTo(hs * 0.65, -hs * 0.55, hs * 0.55, -hs * 0.35); c.quadraticCurveTo(hs * 0.6, -hs * 0.55, hs * 0.75, -hs * 0.72); c.quadraticCurveTo(hs * 0.95, -hs * 0.5, hs * 0.95, -hs * 0.1); c.closePath(); }, hs * 0.8, -hs * 0.4, hs * 0.35, { col: o.nose || '#5A2030', hi: '#A05070', spec: 0.2 });
      c.fillStyle = '#060408'; c.beginPath(); c.ellipse(hs * 0.88, -hs * 0.12, hs * 0.07, hs * 0.05, 0, 0, TAU); c.fill();
      K.eyeR(c, hs * 0.25, -hs * 0.4, hs * 0.12, o.eye || '#FF6FD8', { white: o.eyeWhite || '#120810', irisK: 0.92, ry: 0.8 }); K.glow(c, hs * 0.25, -hs * 0.4, hs * 0.45, o.eye || '#FF6FD8', 0.5);
      if (o.after) o.after(c, hs);
    },
    /* a dragon: a croc's jaws under a crown of horns */
    dragon(c, K, hs, o) {
      const col = o.col;
      for (let k = 0; k < (o.horns || 2); k++) { const s = k % 2 ? -1 : 1, hx = -hs * 0.15 - k * hs * 0.12, hy = -hs * 0.5, L = hs * (0.9 + k * 0.15), a = -2.1 - k * 0.25; K.tube(c, [[hx, hy], [hx + Math.cos(a) * L * 0.5 - hs * 0.1, hy + Math.sin(a) * L * 0.5], [hx + Math.cos(a) * L, hy + Math.sin(a) * L]], u => hs * (0.22 - u * 0.17), { col: o.horn || '#2A2228', hi: '#8A7A80', hiA: 0.25, dkA: 0.5, rim: o.rim, rimA: 0.3 }); s; }
      heads.croc(c, K, hs, o);
    },
    /* an elephantine head with a trunk and small tusks (the baku) */
    trunk(c, K, hs, o) {
      const col = o.col, hi = o.hi || K.sh(col, 0.4), sw = o.sway || 0;
      // ears
      K.body(c, () => { c.beginPath(); c.ellipse(-hs * 0.25, -hs * 0.35, hs * 0.5, hs * 0.65, -0.2, 0, TAU); }, -hs * 0.25, -hs * 0.35, hs * 0.6, { col: K.sh(col, -0.15), hi, tex: o.tex || 'fur', texA: 0.8, texS: 0.35, spec: 0.1, rim: o.rim, rimA: 0.3, inner: () => { c.fillStyle = o.earIn || 'rgba(230,160,170,.35)'; c.beginPath(); c.ellipse(-hs * 0.25, -hs * 0.35, hs * 0.3, hs * 0.45, -0.2, 0, TAU); c.fill(); } });
      K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.4, -hs * 0.15); c.quadraticCurveTo(-hs * 0.4, -hs * 0.95, hs * 0.2, -hs * 0.95); c.quadraticCurveTo(hs * 0.75, -hs * 0.9, hs * 0.85, -hs * 0.35); c.quadraticCurveTo(hs * 0.85, hs * 0.1, hs * 0.5, hs * 0.25); c.quadraticCurveTo(0, hs * 0.35, -hs * 0.4, hs * 0.2); c.closePath(); }, hs * 0.2, -hs * 0.35, hs * 0.85, { col, hi, dk: K.sh(col, -0.5), tex: o.tex || 'fur', texA: 0.9, texS: 0.35, spec: 0.12, rim: o.rim, rimA: 0.35, inner: o.inner });
      // tusks and the trunk
      for (const s of [1]) { K.tube(c, [[hs * 0.55, hs * 0.1], [hs * 0.9, hs * 0.2], [hs * 1.15, hs * 0.05]], u => hs * (0.1 - u * 0.07), { col: '#F2EAD8', hiA: 0.3, dkA: 0.3 }); s; }
      const tr = []; for (let i = 0; i <= 8; i++) { const u = i / 8; tr.push([hs * (0.8 + u * 0.9 * (1 - 0.5 * Math.abs(sw))), -hs * 0.2 + u * u * hs * 1.5 + Math.sin(u * 3 + sw * 2) * hs * 0.1 * u + sw * u * hs * 0.6]); }
      K.tube(c, tr, u => hs * (0.34 - u * 0.2), { col, tex: o.tex || 'skin', texA: 0.8, texS: 0.3, dk: K.sh(col, -0.6), dkA: 0.5, hiA: 0.12, rim: o.rim, rimA: 0.25, inner: () => { c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = hs * 0.03; for (let i = 1; i < 8; i++) { c.beginPath(); c.moveTo(tr[i][0] - hs * 0.2, tr[i][1]); c.lineTo(tr[i][0] + hs * 0.2, tr[i][1]); c.stroke(); } } });
      K.eyeR(c, hs * 0.35, -hs * 0.45, hs * 0.12, o.eye || '#FF9BD2', { white: o.eyeWhite || '#F2EADF', irisK: 0.8, ry: 0.8 }); if (o.glowEye) K.glow(c, hs * 0.35, -hs * 0.45, hs * 0.5, o.eye, 0.45);
      c.save(); c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = hs * 0.06; c.lineCap = 'round'; c.beginPath(); c.moveTo(hs * 0.1, -hs * 0.68); c.quadraticCurveTo(hs * 0.35, -hs * 0.75, hs * 0.6, -hs * 0.6); c.stroke(); c.restore();
      if (o.after) o.after(c, hs);
    },
  };
  /* paint a head at a screen point with a heading; f flips when it faces left */
  function headAt(c, K, kind, at, ang, hs, o) { c.save(); c.translate(at[0], at[1]); c.rotate(ang); if (Math.cos(ang) < 0) c.scale(1, -1); heads[kind](c, K, hs, o); c.restore(); }
  /* ---- stone furniture ---- */
  const props = {
    /* a column: fluted shaft, capital, optional break; hp shows as cracks and a lean */
    pillar(c, K, X, Y, T, o) {
      o = o || {}; const h = T * (o.h || 3.2), w = T * (o.w || 0.9), broken = o.broken || 0, col = o.col || '#8A8A96', lean = o.lean || 0;
      K.shade(c, X, Y + T * 0.1, w * 0.9, w * 0.4, 0.5);
      c.save(); c.translate(X, Y); c.rotate(lean);
      K.body(c, () => { c.beginPath(); c.moveTo(-w * 0.5, 0); c.lineTo(-w * 0.45, -h * (1 - broken)); if (broken) { for (let k = 0; k <= 4; k++) c.lineTo(-w * 0.45 + k * w * 0.225, -h * (1 - broken) - (k % 2 ? w * 0.25 : 0)); } else { c.lineTo(w * 0.45, -h); } c.lineTo(w * 0.5, 0); c.closePath(); }, 0, -h * 0.5, w, { col, hi: K.sh(col, 0.35), dk: K.sh(col, -0.5), tex: 'stone', texA: 0.8, texS: 0.5, spec: 0.1, rim: o.rim, rimA: 0.2, lx: -0.7, ly: -0.2, inner: () => { c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(1, w * 0.05); for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * w * 0.22, -w * 0.1); c.lineTo(k * w * 0.2, -h * (1 - broken) + w * 0.1); c.stroke(); } if (o.crack) { c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = Math.max(1, w * 0.06); c.beginPath(); c.moveTo(-w * 0.3, -h * 0.3); c.lineTo(w * 0.05, -h * 0.45); c.lineTo(-w * 0.1, -h * 0.6); c.lineTo(w * 0.25, -h * 0.75); c.stroke(); } if (o.inner) o.inner(c, w, h); } });
      if (!broken) { K.body(c, () => { c.beginPath(); c.rect(-w * 0.7, -h - w * 0.35, w * 1.4, w * 0.35); }, 0, -h - w * 0.2, w * 0.7, { col: K.sh(col, 0.1), hi: K.sh(col, 0.4), tex: 'stone', texA: 0.7, texS: 0.5, spec: 0.1 }); if (o.cap) o.cap(c, w, h); }
      K.body(c, () => { c.beginPath(); c.rect(-w * 0.75, -w * 0.3, w * 1.5, w * 0.3); }, 0, -w * 0.15, w * 0.7, { col: K.sh(col, -0.1), hi: K.sh(col, 0.3), tex: 'stone', texA: 0.7, texS: 0.5, spec: 0.05 });
      c.restore();
    },
    /* a stone gate: two piers, a lintel, and a pair of doors (open 0..1) */
    gate(c, K, X, Y, T, o) {
      o = o || {}; const h = T * (o.h || 4.2), w = T * (o.w || 3.4), col = o.col || '#5A4A4E', open = o.open || 0, broken = o.broken || 0;
      K.shade(c, X, Y + T * 0.1, w * 0.7, w * 0.25, 0.5);
      // the dark beyond the gate, and the doors
      c.fillStyle = o.beyond || '#0A0408'; c.fillRect(X - w * 0.36, Y - h * 0.92, w * 0.72, h * 0.92);
      if (o.glowBeyond) K.glow(c, X, Y - h * 0.45, w * 0.6, o.glowBeyond, 0.35 + 0.2 * Math.sin((o.t || 0) * 2));
      for (const s of [-1, 1]) { const dw = w * 0.36 * (1 - open * 0.85); K.body(c, () => { c.beginPath(); c.rect(s > 0 ? X : X - dw, Y - h * 0.9, dw, h * 0.9); }, X + s * dw / 2, Y - h * 0.45, dw, { col: o.door || '#2A2024', hi: '#5A4A50', tex: 'stone', texA: 0.6, texS: 0.5, spec: 0.1, inner: () => { c.strokeStyle = 'rgba(200,170,120,.35)'; c.lineWidth = Math.max(1, T * 0.05); for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(s > 0 ? X : X - dw, Y - h * 0.9 * k / 4); c.lineTo(s > 0 ? X + dw : X, Y - h * 0.9 * k / 4); c.stroke(); } } }); }
      for (const s of [-1, 1]) K.body(c, () => { c.beginPath(); c.moveTo(X + s * w * 0.5, Y); c.lineTo(X + s * w * 0.5, Y - h * (1 - broken * (s > 0 ? 0.5 : 0))); c.lineTo(X + s * w * 0.34, Y - h * (1 - broken * (s > 0 ? 0.5 : 0))); c.lineTo(X + s * w * 0.34, Y); c.closePath(); }, X + s * w * 0.42, Y - h * 0.5, w * 0.3, { col, hi: K.sh(col, 0.35), dk: K.sh(col, -0.5), tex: 'stone', texA: 0.85, texS: 0.5, spec: 0.08, rim: o.rim, rimA: 0.2, lx: -0.7, inner: () => { c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(1, T * 0.04); for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(X + s * w * 0.34, Y - h * k / 6); c.lineTo(X + s * w * 0.5, Y - h * k / 6); c.stroke(); } } });
      if (!broken) K.body(c, () => { c.beginPath(); c.moveTo(X - w * 0.6, Y - h); c.lineTo(X - w * 0.5, Y - h * 1.25); c.lineTo(X + w * 0.5, Y - h * 1.25); c.lineTo(X + w * 0.6, Y - h); c.closePath(); }, X, Y - h * 1.1, w * 0.6, { col: K.sh(col, 0.05), hi: K.sh(col, 0.4), tex: 'stone', texA: 0.8, texS: 0.5, spec: 0.1, inner: () => { if (o.sigil) o.sigil(c, X, Y - h * 1.12, w * 0.2); } });
      else { c.fillStyle = K.sh(col, -0.3); for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(X + (k - 1.5) * w * 0.3, Y - T * 0.1, T * (0.25 + (k % 2) * 0.15), 0, TAU); c.fill(); } }
    },
    /* a bronze pylon: a stepped base, a rod, a sphere that holds a charge */
    pylon(c, K, X, Y, T, o) {
      o = o || {}; const h = T * (o.h || 3.4), col = o.col || '#8A6A3A', ch = o.charge || 0, glow = o.glow || '#8FE8FF', t = o.t || 0;
      K.shade(c, X, Y + T * 0.1, T * 0.9, T * 0.35, 0.5);
      K.body(c, () => { c.beginPath(); c.moveTo(X - T * 0.8, Y); c.lineTo(X - T * 0.55, Y - T * 0.5); c.lineTo(X + T * 0.55, Y - T * 0.5); c.lineTo(X + T * 0.8, Y); c.closePath(); }, X, Y - T * 0.25, T * 0.8, { col: '#55575E', hi: '#9A9CA6', tex: 'stone', texA: 0.7, texS: 0.5, spec: 0.1 });
      K.tube(c, [[X, Y - T * 0.45], [X, Y - h * 0.55], [X, Y - h]], u => T * (0.3 - u * 0.12), { col, tex: 'chitin', texA: 0.6, texS: 0.5, dk: '#201408', dkA: 0.5, hi: '#F2D8A0', hiA: 0.25, rim: glow, rimA: ch * 0.6, inner: () => { c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(1, T * 0.04); for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(X - T * 0.3, Y - T * 0.45 - (h - T * 0.45) * k / 6); c.lineTo(X + T * 0.3, Y - T * 0.45 - (h - T * 0.45) * k / 6); c.stroke(); } } });
      if (ch > 0) { K.glow(c, X, Y - h, T * (1.2 + ch * 1.2), glow, 0.4 + ch * 0.5); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(glow, 0.8); c.lineWidth = Math.max(1, T * 0.06); for (let k = 0; k < 4; k++) { let x = X, y = Y - h; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (Math.sin(t * 31 + k * 7 + j * 3) * 0.5) * T * 0.6; y += (Math.cos(t * 23 + k * 5 + j) * 0.5 - 0.3) * T * 0.4; c.lineTo(x, y); } c.stroke(); } c.restore(); }
      K.body(c, () => { c.beginPath(); c.arc(X, Y - h, T * 0.42, 0, TAU); }, X, Y - h, T * 0.42, { col: ch > 0.3 ? glow : '#C8A860', hi: '#FFFFFF', dk: K.sh(col, -0.5), spec: 0.6, rim: glow, rimA: 0.4 + ch * 0.4 });
      if (o.ground) { c.save(); c.globalAlpha = 0.9; c.fillStyle = '#4A5A60'; c.beginPath(); c.ellipse(X, Y + T * 0.05, T * 0.9, T * 0.4, 0, 0, TAU); c.fill(); c.strokeStyle = '#A8C8D0'; c.lineWidth = Math.max(1, T * 0.06); c.stroke(); c.restore(); }
    },
    /* a mirror slab on a pivot: a tall polished plate turned to angle a */
    slab(c, K, X, Y, T, o) {
      o = o || {}; const h = T * (o.h || 2.8), w = T * (o.w || 1.6) * Math.max(0.18, Math.abs(Math.cos(o.a || 0))), col = o.col || '#C8D0D8', lit = o.lit || 0, glow = o.glow || '#FFE9A8';
      K.shade(c, X, Y + T * 0.1, w * 0.8 + T * 0.3, T * 0.35, 0.5);
      K.body(c, () => { c.beginPath(); c.rect(X - T * 0.45, Y - T * 0.35, T * 0.9, T * 0.35); }, X, Y - T * 0.15, T * 0.5, { col: '#6A6A74', hi: '#B8B8C4', tex: 'stone', texA: 0.7, texS: 0.5, spec: 0.1 });
      K.body(c, () => { c.beginPath(); c.moveTo(X - w * 0.5, Y - T * 0.3); c.lineTo(X - w * 0.5, Y - h); c.lineTo(X + w * 0.5, Y - h - w * 0.08 * Math.sign(Math.sin(o.a || 0))); c.lineTo(X + w * 0.5, Y - T * 0.3); c.closePath(); }, X, Y - h * 0.5, Math.max(w, T * 0.6), { col, hi: '#FFFFFF', dk: '#6A7A88', tex: 'stone', texA: 0.25, texS: 0.5, spec: 0.7, specR: 0.5, rim: glow, rimA: 0.2 + lit * 0.6, lx: -0.6, ly: -0.7, inner: () => { const g = c.createLinearGradient(X - w * 0.5, Y - h, X + w * 0.5, Y); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.45, 'rgba(255,255,255,.05)'); g.addColorStop(0.5, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(120,150,180,.2)'); c.fillStyle = g; c.fillRect(X - w, Y - h - T, w * 2, h + T); if (lit > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = lit; blitSized(c, glowSprite(glow), X - w, Y - h * 0.6 - w, w * 2, w * 2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } } });
      c.strokeStyle = 'rgba(40,40,50,.6)'; c.lineWidth = Math.max(1, T * 0.05); c.strokeRect(X - w * 0.5, Y - h, w, h - T * 0.3);
    },
    /* a stone lantern: a pedestal, a lit chamber, a little roof */
    lantern(c, K, X, Y, T, o) {
      o = o || {}; const lit = o.lit == null ? 1 : o.lit, col = o.col || '#8A8A90', glow = o.glow || '#FFD88A', h = T * (o.h || 2.2);
      K.shade(c, X, Y + T * 0.1, T * 0.6, T * 0.25, 0.45);
      K.body(c, () => { c.beginPath(); c.rect(X - T * 0.2, Y - h * 0.55, T * 0.4, h * 0.55); }, X, Y - h * 0.3, T * 0.4, { col, hi: K.sh(col, 0.3), tex: 'stone', texA: 0.7, texS: 0.5, spec: 0.1 });
      if (lit > 0) K.glow(c, X, Y - h * 0.72, T * 1.6, glow, 0.5 * lit);
      K.body(c, () => { c.beginPath(); c.rect(X - T * 0.36, Y - h * 0.9, T * 0.72, h * 0.35); }, X, Y - h * 0.72, T * 0.5, { col: K.sh(col, 0.05), hi: K.sh(col, 0.4), tex: 'stone', texA: 0.7, texS: 0.5, spec: 0.1, inner: () => { c.fillStyle = lit > 0 ? rgba(glow, 0.5 + 0.5 * lit) : '#1A1418'; c.fillRect(X - T * 0.22, Y - h * 0.85, T * 0.44, h * 0.25); } });
      K.body(c, () => { c.beginPath(); c.moveTo(X - T * 0.55, Y - h * 0.9); c.lineTo(X, Y - h * 1.12); c.lineTo(X + T * 0.55, Y - h * 0.9); c.closePath(); }, X, Y - h, T * 0.5, { col: K.sh(col, -0.15), hi: K.sh(col, 0.3), tex: 'stone', texA: 0.6, texS: 0.5, spec: 0.1 });
    },
    /* a coral reef: a growth of branching knobs, low or tall, that can glow along its roots */
    reef(c, K, X, Y, T, o) {
      o = o || {}; const g = o.grow == null ? 1 : o.grow, h = T * (o.tall ? 2.6 : 1.2) * g, col = o.col || '#E0785A', R = mulberry32(o.seed || 7);
      K.shade(c, X, Y + T * 0.08, T * 0.9 * g + T * 0.2, T * 0.35, 0.45);
      const n = o.tall ? 7 : 5;
      for (let i = 0; i < n; i++) { const u = (i / (n - 1) - 0.5), bx = X + u * T * 1.2 * g, bh = h * (0.55 + R() * 0.45) * (1 - Math.abs(u) * 0.4), cc = i % 2 ? col : K.sh(col, 0.25);
        K.tube(c, [[bx, Y], [bx + (R() - 0.5) * T * 0.4, Y - bh * 0.55], [bx + (R() - 0.5) * T * 0.5, Y - bh]], u2 => T * (0.3 - u2 * 0.12) * g, { col: cc, tex: 'chitin', texA: 0.6, texS: 0.4, dk: K.sh(col, -0.6), dkA: 0.5, hi: '#FFFFFF', hiA: 0.15, rim: o.glow, rimA: (o.lit || 0) * 0.6 });
        for (let k = 0; k < 3; k++) { const kx = bx + (R() - 0.5) * T * 0.6, ky = Y - bh * (0.3 + R() * 0.7); K.body(c, () => { c.beginPath(); c.arc(kx, ky, T * (0.1 + R() * 0.1) * g, 0, TAU); }, kx, ky, T * 0.14, { col: K.sh(cc, 0.15), hi: '#FFFFFF', spec: 0.3 }); } }
      if (o.lit > 0) K.glow(c, X, Y - T * 0.2, T * 1.4 * g, o.glow || '#5FFFE0', 0.5 * o.lit);
    },
    /* a counterweight: a carved block with a groove-runner, or any heavy stone */
    block(c, K, X, Y, T, o) {
      o = o || {}; const w = T * (o.w || 1.4), h = T * (o.h || 1.3), col = o.col || '#B89A5A';
      K.shade(c, X, Y + T * 0.08, w * 0.7, w * 0.3, 0.5);
      K.body(c, () => { c.beginPath(); c.moveTo(X - w * 0.5, Y); c.lineTo(X - w * 0.42, Y - h); c.lineTo(X + w * 0.42, Y - h); c.lineTo(X + w * 0.5, Y); c.closePath(); }, X, Y - h * 0.5, w * 0.6, { col, hi: K.sh(col, 0.4), dk: K.sh(col, -0.5), tex: 'stone', texA: 0.8, texS: 0.5, spec: 0.12, rim: o.rim, rimA: 0.25, lx: -0.6, inner: () => { if (o.sigil) o.sigil(c, X, Y - h * 0.5, w * 0.3); } });
      K.body(c, () => { c.beginPath(); c.moveTo(X - w * 0.42, Y - h); c.lineTo(X - w * 0.3, Y - h - w * 0.18); c.lineTo(X + w * 0.3, Y - h - w * 0.18); c.lineTo(X + w * 0.42, Y - h); c.closePath(); }, X, Y - h - w * 0.1, w * 0.4, { col: K.sh(col, 0.15), hi: K.sh(col, 0.5), tex: 'stone', texA: 0.7, texS: 0.5, spec: 0.15 });
    },
  };
  /* scenery is static most of the time, so each prop is painted once into a small sprite and stamped from then on:
     a pillar is a few dozen lit strokes, a stamp is one. Anything with a moving light or an animated callback paints live */
  const spriteCache = new Map(), SPRITE_MAX = 56;
  const keyOf = (o) => { let k = ''; for (const n in o) { const v = o[n]; if (n === 't') continue; if (typeof v === 'function') k += n + ':fn;'; else if (typeof v === 'number') k += n + ':' + (Math.round(v * 40) / 40) + ';'; else k += n + ':' + v + ';'; } return k; };
  function cachedProp(name, fn) {
    return function (c, K, X, Y, T, o) {
      o = o || {};
      const live = o.cache === false || (name === 'pylon' && o.charge > 0) || (name === 'gate' && o.glowBeyond) || (o.t != null && Object.values(o).some(v => typeof v === 'function'));
      if (live) return fn(c, K, X, Y, T, o);
      const dpr = Math.min(2, (typeof arc !== 'undefined' && arc.dpr) || window.devicePixelRatio || 1), hw = T * (o.bw || 3.2), up = T * (o.bh || 6), dn = T * 0.8;
      const key = name + '|' + Math.round(T * 2) + '|' + Math.round(dpr * 4) + '|' + keyOf(o);
      let sp = spriteCache.get(key);
      if (!sp) {
        const cv = document.createElement('canvas'); cv.width = Math.ceil(hw * 2 * dpr); cv.height = Math.ceil((up + dn) * dpr);
        const c2 = cv.getContext('2d'); c2.setTransform(dpr, 0, 0, dpr, hw * dpr, up * dpr); c2.lineJoin = 'round'; c2.lineCap = 'round';
        fn(c2, K, 0, 0, T, o);
        sp = { cv, hw, up, dn }; if (spriteCache.size >= SPRITE_MAX) spriteCache.delete(spriteCache.keys().next().value); spriteCache.set(key, sp);
      }
      c.drawImage(sp.cv, X - sp.hw, Y - sp.up, sp.hw * 2, sp.up + sp.dn);
    };
  }
  for (const n in props) props[n] = cachedProp(n, props[n]);
  /* ---- a soft silhouette of a creature's shadow under a flyer ---- */
  function flyShadow(c, K, X, Y, T, r, z) { K.shade(c, X, Y + T * 0.1, r * T * (1 - z * 0.2), r * T * 0.35 * (1 - z * 0.2), 0.5 * (1 - Math.min(0.7, z * 0.3))); }
  /* ---- a stagger meter in the world, over a part of the fiend ---- */
  function meter(c, X, Y, w, v, col, label) { c.save(); c.globalAlpha = 0.9; c.fillStyle = 'rgba(0,0,0,.55)'; GFX.rr(c, X - w / 2 - 1, Y - 3, w + 2, 6, 3); c.fill(); c.fillStyle = col; GFX.rr(c, X - w / 2, Y - 2, Math.max(2, w * Math.max(0, Math.min(1, v))), 4, 2); c.fill(); if (label) { c.font = `900 8px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.strokeText(label, X, Y - 4); c.fillStyle = '#FFFFFF'; c.fillText(label, X, Y - 4); } c.restore(); }
  return { quadruped, wing, trail, trailPush, trailInit, trailMove, serpent, heads, headAt, props, flyShadow, meter, lerp, rgba, volumes, veins, scaleRows, aura, mass };
})();
