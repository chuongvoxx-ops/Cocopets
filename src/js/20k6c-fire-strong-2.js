/* ---------- Fire, reworked: Firewheel Skip, Burning Mandala, Salamander Rush, Hearthburst, Falling Matchstars ----------
   Spike Bloom standard (see 20k6a-fire-kit.js): flames are FK volumes; solid fire (the wheel rim, the salamander's hide,
   the match heads) is shaded in tone ramps with a dark crust, glowing seams, a rim light and an
   outline; every burning thing lights the floor and sheds embers; every contact leaves a scorch. Loads after
   20k6-elem-fire.js and replaces these five Strong attacks. */
(() => {
  const S = ELEM_IMPL.fire.strong, TAU = Math.PI * 2;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---- move-specific shapes ---- */
  /* a wheel of fire at screen (x, y), r px: flame blades trailing the spin off a molten rim, four molten spokes, a hot hub */
  function wheel(c, H, K, x, y, r, rot, t, s, nb, a, dir) {
    const P = K.P; if (r < 2 || a <= 0.01) return;
    K.glow(c, x, y, r * 2.3, P.org, 0.5 * a); K.glow(c, x, y, r * 1.1, P.yel, 0.3 * a);
    for (let i = 0; i < nb; i++) { const b = rot + i / nb * TAU, fx = x + Math.cos(b) * r * 0.72, fy = y + Math.sin(b) * r * 0.72; K.flameAt(c, fx, fy, b - dir * 0.8, r * 0.52, r * (0.95 + 0.25 * Math.sin(t * 15 + i * 2.3 + s)), t, i * 1.7 + s, 0.95 * a); }
    c.save(); c.globalAlpha = a; c.lineCap = 'butt';
    const rr = r * 0.6, rw = r * 0.22;
    // the disc inside the rim: a turning sheet of flame, white at the hub
    const gd = c.createRadialGradient(x - r * 0.1, y - r * 0.12, 0, x, y, rr); gd.addColorStop(0, P.wht); gd.addColorStop(0.4, P.yel); gd.addColorStop(0.75, P.amb); gd.addColorStop(1, P.org); c.fillStyle = gd; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const b = rot * 1.4 + i * 2.1; c.strokeStyle = H.rgba(P.yel, 0.55); c.lineWidth = Math.max(1, r * 0.07); c.beginPath(); c.arc(x, y, rr * (0.45 + i * 0.15), b, b + 1.5 * dir, dir < 0); c.stroke(); } c.restore();
    c.strokeStyle = P.char; c.lineWidth = rw + 2; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.stroke();
    const g = c.createLinearGradient(x - rr, y - rr, x + rr, y + rr); g.addColorStop(0, P.yel); g.addColorStop(0.35, P.org); g.addColorStop(1, P.dred);
    c.strokeStyle = g; c.lineWidth = rw; c.stroke();
    // plates of dark crust riding on the molten rim, lit on the upper left
    const gc = c.createLinearGradient(x - rr, y - rr, x + rr, y + rr); gc.addColorStop(0, P.crustL); gc.addColorStop(0.5, P.crust); gc.addColorStop(1, P.char);
    const seg = TAU * rr / 5; c.setLineDash([seg * 0.58, seg * 0.42]); c.lineDashOffset = -rot * rr; c.strokeStyle = gc; c.lineWidth = rw * 0.6; c.stroke(); c.setLineDash([]);
    // a molten inner lip
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = H.rgba(P.org, 0.85); c.lineWidth = Math.max(1, r * 0.06); c.beginPath(); c.arc(x, y, rr - rw * 0.32, 0, TAU); c.stroke();
    c.lineCap = 'round';
    // the rim light on the upper left
    c.strokeStyle = H.rgba(P.wht, 0.55); c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, rr + rw * 0.42, Math.PI * 0.95, Math.PI * 1.55); c.stroke();
    // motion arcs trailing the spin outside the blades
    c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const b = rot + i / 3 * TAU; c.strokeStyle = H.rgba(P.amb, 0.5); c.lineWidth = Math.max(1.5, r * 0.08); c.beginPath(); c.arc(x, y, r * 1.18, b - dir * 1.1, b, dir < 0); c.stroke(); }
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 4; i++) { const b = rot + i / 4 * TAU + 0.6, ex = x + Math.cos(b) * (rr - rw * 0.4), ey = y + Math.sin(b) * (rr - rw * 0.4); c.strokeStyle = H.rgba(P.char, 0.8); c.lineWidth = r * 0.12 + 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke(); c.strokeStyle = i % 2 ? P.red : P.org; c.lineWidth = r * 0.12; c.stroke(); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.85); c.lineWidth = Math.max(1, r * 0.05); c.stroke(); c.restore(); }
    H.sphere(c, x, y, r * 0.22, P.org, P.wht, P.dred, { rimCol: P.yel, lw: 1.2 }); H.core(c, x, y, r * 0.16, P.yel, P.wht, 0.75);
    c.restore();
  }
  /* a burnt circular print on the floor: charred rings, spoke-tread marks, a cooling glow */
  function wheelPrint(c, H, K, X, Y, r, a, heat, seed) {
    K.scorch(c, X, Y, r, a, heat, seed); const P = K.P; c.save(); c.globalAlpha = a; c.lineWidth = Math.max(1.5, r * 0.08);
    c.strokeStyle = H.rgba(P.char, 0.5); H.floorEllipse(c, X, Y, r * 0.72); c.stroke(); H.floorEllipse(c, X, Y, r * 0.4); c.stroke();
    if (heat > 0.02) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.7 * heat); c.lineWidth = Math.max(1, r * 0.05); H.floorEllipse(c, X, Y, r * 0.56); c.stroke();
      c.strokeStyle = H.rgba(P.yel, 0.6 * heat); for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + seed; c.beginPath(); c.moveTo(X + Math.cos(b) * r * 0.78, Y + Math.sin(b) * r * 0.78 * H.GY); c.lineTo(X + Math.cos(b) * r * 0.96, Y + Math.sin(b) * r * 0.96 * H.GY); c.stroke(); } }
    c.restore();
  }
  /* a salamander of faceted molten crystal along a screen spine (tail .. head). Real 3D: every spine point carries a
     six-sided cross-section (ridge, two crust plates, two flanks, a belly) in a frame oriented along the spine and banked
     by the weave; the rings are joined into faces, culled, sorted back to front and shaded by their normal against a
     light from the upper left. Screen x/y are the floor plane, z is up (drawn as y - z): the viewer sits toward +y, +z.
     Obsidian plates with ember rims on top, molten flanks, a white-hot belly, glowing seams between segments, a hot
     ridge with sliding glints; a wedge head with slit eyes and a jaw line; crystal dorsal spikes trailing flame; four
     jointed crystal legs with claw shards; a blade tail trailing a flame ribbon. */
  const SL = (() => { const l = Math.hypot(-0.5, -0.55, 0.67); return [-0.5 / l, -0.55 / l, 0.67 / l]; })(), SV = [0, Math.SQRT1_2, Math.SQRT1_2];
  const RING = [[0, 1], [0.8, 0.42], [0.62, -0.48], [0, -0.78], [-0.62, -0.48], [-0.8, 0.42]];   // (side, up) of the cross-section; faces k..k+1: 0,5 plates, 1,4 flanks, 2,3 belly
  const KIND = ['plate', 'flank', 'belly', 'belly', 'flank', 'plate'];
  const v3 = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
  function salamander(c, H, K, pts, sc, t, step, a, seed) {
    const P = K.P, n = pts.length; if (n < 3 || a <= 0.01) return; c.save(); c.globalAlpha = a; c.lineJoin = 'round'; c.lineCap = 'round';
    const pr = p => [p[0], p[1] - p[2]], GZ = -sc * 0.42;   // the floor sits this far below the spine
    // the frame at every spine point: forward along the spine, side banked by the turn, up
    const F = [], Sd = [], Up = [], W = [], Hh = [];
    for (let i = 0; i < n; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy) || 1, fx = dx / d, fy = dy / d;
      let turn = 0; if (i > 0 && i < n - 1) { const ax = pts[i][0] - pts[i - 1][0], ay = pts[i][1] - pts[i - 1][1], bx = pts[i + 1][0] - pts[i][0], by = pts[i + 1][1] - pts[i][1]; turn = Math.atan2(ax * by - ay * bx, ax * bx + ay * by); }
      const bk = cl(turn * 1.4, -0.45, 0.45) + Math.sin(step * 0.5 + i * 0.4) * 0.08, cb = Math.cos(bk), sb = Math.sin(bk), s0 = [-fy, fx, 0];
      F.push([fx, fy, 0]); Sd.push([s0[0] * cb, s0[1] * cb, sb]); Up.push([-s0[0] * sb, -s0[1] * sb, cb]);
      const u = i / (n - 1), w = sc * (0.07 + 0.42 * Math.sin(Math.min(1, u * 1.35) * Math.PI / 2)) * (u > 0.78 ? 1 - 0.28 * Math.sin((u - 0.78) / 0.22 * Math.PI) : 1); W.push(w); Hh.push(w * 0.85); }
    const at = (i, s, u, f) => { const p = pts[i]; f = f || 0; return [p[0] + Sd[i][0] * s + Up[i][0] * u + F[i][0] * f, p[1] + Sd[i][1] * s + Up[i][1] * u + F[i][1] * f, Sd[i][2] * s + Up[i][2] * u]; };
    const rings = []; for (let i = 0; i < n; i++) rings.push(RING.map(([s, u]) => at(i, s * W[i], u * Hh[i])));
    const faces = [], face = (q, kind, i, extra, ref) => { let nn = v3.norm(v3.cross(v3.sub(q[1], q[0]), v3.sub(q[q.length - 1], q[0]))); const ce = q.reduce((s, p) => [s[0] + p[0] / q.length, s[1] + p[1] / q.length, s[2] + p[2] / q.length], [0, 0, 0]), rp = ref || [pts[Math.max(0, i)][0], pts[Math.max(0, i)][1], 0]; if (v3.dot(nn, v3.sub(ce, rp)) < 0) nn = [-nn[0], -nn[1], -nn[2]]; if (v3.dot(nn, SV) <= 0.02) return; let dp = 0; for (const p of q) dp += p[1] + p[2]; faces.push(Object.assign({ q, kind, i, nn, dp: dp / q.length, lit: Math.max(0, v3.dot(nn, SL)) }, extra || {})); };
    // the body bands (outward normals: ring order runs clockwise seen from the tail, so (next ring - this) x (next vertex - this))
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6, A = rings[i][k], B = rings[i][k2], C2 = rings[i + 1][k2], D = rings[i + 1][k]; face([A, D, C2, B], KIND[k], i, { seam: [A, B], ridge: k === 0 ? [A, D] : null, lon: k === 0 ? [B, C2] : k === 5 ? [A, D] : null }); }
    // the blade tail: the first ring closes on a point trailing back
    const tp = at(0, 0, Hh[0] * 0.2, -sc * 0.45), tc = at(0, 0, 0, -sc * 0.1); for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; face([tp, rings[0][k], rings[0][k2]], KIND[k], -1, null, tc); }
    // the wedge head: the last ring runs into a snout, the brow raised
    const hi = n - 1, tip = at(hi, 0, Hh[hi] * 0.05, sc * 0.62), brow = at(hi, 0, Hh[hi] * 1.15, sc * 0.18), hc = at(hi, 0, 0, sc * 0.2);
    for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6, A = rings[hi][k], B = rings[hi][k2]; if (k === 0) { face([A, brow, tip], 'plate', hi, { head: 1 }, hc); } else if (k === 5) { face([brow, B, tip], 'plate', hi, { head: 1 }, hc); } else face([B, A, tip], KIND[k], hi, { head: 1 }, hc); }
    // crystal spikes along the back: two faces each, lit and shaded, meeting on a bright edge
    const spikes = []; for (const u of [0.32, 0.5, 0.66]) { const i = Math.round((n - 1) * u), h = sc * (0.24 + 0.12 * u), base = at(i, 0, Hh[i] * 0.95), apex = at(i, 0, Hh[i] * 0.95 + h, -h * 0.55), bl = at(i, -W[i] * 0.42, Hh[i] * 0.65, -sc * 0.08), br = at(i, W[i] * 0.42, Hh[i] * 0.65, -sc * 0.08), bf = at(i, 0, Hh[i] * 0.85, sc * 0.16);
      const sr = [(bl[0] + br[0] + bf[0]) / 3, (bl[1] + br[1] + bf[1]) / 3, (bl[2] + br[2] + bf[2]) / 3]; face([bl, apex, bf], 'spike', i, { edge: [apex, bf] }, sr); face([bf, apex, br], 'spike', i, { edge: [apex, bf] }, sr); face([br, apex, bl], 'spike', i, { edge: [apex, bl] }, sr); spikes.push({ apex, i, h }); }
    // legs: hip at the flank, knee raised and out, foot on the floor, stepping with the gait
    const legs = []; for (const li of [Math.round((n - 1) * 0.4), Math.round((n - 1) * 0.74)]) for (const sd of [-1, 1]) { const ph = step + (li > n / 2 ? 0 : Math.PI) + (sd > 0 ? Math.PI : 0), sw = Math.sin(ph), lift = Math.max(0, Math.cos(ph));
      const hip = at(li, sd * W[li] * 0.75, -Hh[li] * 0.1), knee = at(li, sd * (W[li] + sc * 0.26), -sc * 0.02 + lift * sc * 0.1, sw * sc * 0.12 + sc * 0.06), foot = at(li, sd * (W[li] + sc * 0.3), 0, sw * sc * 0.28 - sc * 0.04); foot[2] = GZ + lift * sc * 0.18;
      legs.push({ hip, knee, foot, sd, li, far: (Sd[li][1] + Sd[li][2]) * sd < 0, lift }); }
    const P2 = p => pr(p), poly = q => { c.beginPath(); q.forEach((p, j) => { const s = P2(p); j ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath(); };
    // a jointed crystal limb: two faceted bars (lit and shaded halves), a molten knee, claw shards
    const leg = L => { const seg = (A, B, w) => { const a2 = P2(A), b2 = P2(B), dx = b2[0] - a2[0], dy = b2[1] - a2[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * w, ny = dx / d * w, lt = nx * SL[0] + ny * SL[1] < 0;
        c.beginPath(); c.moveTo(a2[0] + nx, a2[1] + ny); c.lineTo(b2[0] + nx * 0.6, b2[1] + ny * 0.6); c.lineTo(b2[0], b2[1]); c.lineTo(a2[0], a2[1]); c.closePath(); c.fillStyle = lt ? '#D0602E' : '#4A1408'; c.fill();
        c.beginPath(); c.moveTo(a2[0] - nx, a2[1] - ny); c.lineTo(b2[0] - nx * 0.6, b2[1] - ny * 0.6); c.lineTo(b2[0], b2[1]); c.lineTo(a2[0], a2[1]); c.closePath(); c.fillStyle = lt ? '#4A1408' : '#D0602E'; c.fill();
        c.beginPath(); c.moveTo(a2[0] + nx, a2[1] + ny); c.lineTo(b2[0] + nx * 0.6, b2[1] + ny * 0.6); c.lineTo(b2[0] - nx * 0.6, b2[1] - ny * 0.6); c.lineTo(a2[0] - nx, a2[1] - ny); c.closePath(); c.strokeStyle = P.char; c.lineWidth = 1.2; c.stroke();
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.amb, 0.85); c.lineWidth = Math.max(1, w * 0.35); c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke(); c.restore(); };
      seg(L.hip, L.knee, sc * 0.13); seg(L.knee, L.foot, sc * 0.1); const k2 = P2(L.knee), f2 = P2(L.foot); H.core(c, k2[0], k2[1], sc * 0.07, P.org, P.yel, 0.9);
      const fd = F[L.li], s2 = Sd[L.li]; for (let j = -1; j <= 1; j++) { const cx = L.foot[0] + fd[0] * sc * 0.16 + s2[0] * j * sc * 0.09, cy = L.foot[1] + fd[1] * sc * 0.16 + s2[1] * j * sc * 0.09, tip2 = [cx, cy - L.foot[2]], bx = f2[0] + s2[0] * j * sc * 0.04, by = f2[1] + s2[1] * j * sc * 0.04, px = -fd[1] * sc * 0.025, py = fd[0] * sc * 0.025;
        c.beginPath(); c.moveTo(bx + px, by + py); c.lineTo(tip2[0], tip2[1]); c.lineTo(bx - px, by - py); c.closePath(); c.fillStyle = P.gold; c.fill(); c.strokeStyle = P.char; c.lineWidth = 0.8; c.stroke(); } };
    // light round the body and the trailing flame ribbon off the tail blade
    for (let i = 1; i < n; i += 3) { K.glow(c, pts[i][0], pts[i][1] - Hh[i] * 0.2, sc * 1.0, P.org, 0.35); K.glow(c, pts[i][0], pts[i][1], sc * 0.45, P.yel, 0.25); }
    const t2 = pr(tp), rib = [t2]; for (let j = 1; j <= 4; j++) rib.unshift([t2[0] - F[0][0] * sc * 0.28 * j + Sd[0][0] * Math.sin(t * 14 + j + seed) * sc * 0.08 * j, t2[1] - F[0][1] * sc * 0.28 * j + Sd[0][1] * Math.sin(t * 14 + j + seed) * sc * 0.08 * j - j * sc * 0.04]);
    c.save(); c.globalCompositeOperation = 'lighter'; const tw = q => 0.15 + 0.85 * q; H.ribbon(c, rib, sc * 0.3, H.rgba(P.red, 0.6), null, tw); H.ribbon(c, rib, sc * 0.2, H.rgba(P.org, 0.8), null, tw); H.ribbon(c, rib, sc * 0.08, H.rgba(P.yel, 0.9), null, tw); c.restore();
    K.flameAt(c, t2[0], t2[1], Math.atan2(-F[0][1], -F[0][0]) - 0.25, sc * 0.3, sc * (0.75 + 0.2 * Math.sin(t * 13 + seed)), t, seed + 9, 0.9);
    for (const L of legs) if (L.far) leg(L);
    // the faces, back to front
    faces.sort((p, q) => p.dp - q.dp);
    for (const f of faces) { const d = f.lit, band = f.i >= 0 && f.i % 2 ? 0.88 : 1; let fill;
      if (f.kind === 'plate') fill = H.mix('#4A140C', '#E8784A', Math.min(1, 0.15 + d * 1.1) * band);
      else if (f.kind === 'flank') fill = H.mix(P.red, P.yel, 0.1 + 0.9 * d);
      else if (f.kind === 'belly') fill = H.mix(P.org, P.wht, 0.35 + 0.65 * d);
      else fill = H.mix('#8A2A14', '#FFD08A', 0.25 + 0.75 * d);
      poly(f.q); c.fillStyle = fill; c.fill(); c.strokeStyle = H.rgba(P.char, 0.9); c.lineWidth = 1; c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter';
      if (f.kind === 'plate') { c.strokeStyle = H.rgba(P.amb, 0.12 + 0.35 * d); c.lineWidth = 1; poly(f.q); c.stroke(); }
      if (f.kind === 'plate' && d > 0.55 && f.q.length === 4) { const q = f.q.map(P2), cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4; c.strokeStyle = H.rgba(P.wht, (d - 0.55) * 1.4); c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx + (q[0][0] - q[1][0]) * 0.3, cy + (q[0][1] - q[1][1]) * 0.3); c.lineTo(cx - (q[0][0] - q[1][0]) * 0.3, cy - (q[0][1] - q[1][1]) * 0.3); c.stroke(); }
      if (f.lon) { const a2 = P2(f.lon[0]), b2 = P2(f.lon[1]); c.strokeStyle = H.rgba(P.org, 0.9); c.lineWidth = Math.max(1.5, sc * 0.06); c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
      if (f.seam && f.kind !== 'belly' && f.i % 2 === 0) { const a2 = P2(f.seam[0]), b2 = P2(f.seam[1]), k = 0.6 + 0.4 * Math.sin(t * 11 + f.i * 1.7 + seed); c.strokeStyle = H.rgba(f.kind === 'plate' ? P.org : P.yel, 0.95 * k); c.lineWidth = Math.max(1.5, sc * 0.07); c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
      if (f.ridge) { const a2 = P2(f.ridge[0]), b2 = P2(f.ridge[1]), gl = Math.max(0, Math.cos(f.i * 0.8 - t * 9 + seed)); c.strokeStyle = H.rgba(gl > 0.85 ? P.wht : P.yel, 0.45 + 0.5 * gl); c.lineWidth = 1.2 + gl; c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
      if (f.edge) { const a2 = P2(f.edge[0]), b2 = P2(f.edge[1]); c.strokeStyle = H.rgba(P.wht, 0.8); c.lineWidth = 1.2; c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
      if (f.kind === 'belly') { const m = f.q.reduce((s, p) => [s[0] + p[0] / f.q.length, s[1] + p[1] / f.q.length, s[2] + p[2] / f.q.length], [0, 0, 0]), m2 = P2(m); K.glow(c, m2[0], m2[1], sc * 0.25, P.yel, 0.35); }
      c.restore(); }
    // the head's details: white-hot slit eyes on the visible side(s), a glowing jaw line, a hot mouth
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const sd of [-1, 1]) { const vis = (Sd[hi][1] + Sd[hi][2]) * sd; if (vis < -0.25) continue; const e1 = P2(at(hi, sd * W[hi] * 0.52, Hh[hi] * 0.48, sc * 0.08)), e2 = P2(at(hi, sd * W[hi] * 0.36, Hh[hi] * 0.42, sc * 0.3)), j1 = P2(at(hi, sd * W[hi] * 0.78, -Hh[hi] * 0.15, -sc * 0.02)), j2 = P2(at(hi, sd * W[hi] * 0.12, -Hh[hi] * 0.05, sc * 0.56));
      K.glow(c, (e1[0] + e2[0]) / 2, (e1[1] + e2[1]) / 2, sc * 0.22, P.yel, 0.7); c.strokeStyle = P.wht; c.lineWidth = Math.max(1.5, sc * 0.06); c.beginPath(); c.moveTo(e1[0], e1[1]); c.lineTo(e2[0], e2[1]); c.stroke();
      c.strokeStyle = H.rgba(P.amb, 0.9); c.lineWidth = Math.max(1, sc * 0.035); c.beginPath(); c.moveTo(j1[0], j1[1]); c.lineTo(j2[0], j2[1]); c.stroke(); }
    const m2 = pr(tip); H.core(c, m2[0], m2[1], sc * 0.1, P.yel, P.wht, 0.8); c.restore();
    for (const L of legs) if (!L.far) leg(L);
    // short flames streaming back off the spike tips
    for (const s of spikes) { const a2 = pr(s.apex), back = Math.atan2(-F[s.i][1], -F[s.i][0]); K.flameAt(c, a2[0], a2[1] + s.h * 0.15, back * 0.35 - Math.PI / 2 * 0.65, sc * 0.22, sc * (0.5 + 0.15 * Math.sin(t * 12 + s.i)), t, s.i * 2.1 + seed, 0.9); }
    c.restore();
  }
  /* a five-pointed glint (the "star" of a matchstar) */
  function glint(c, H, x, y, r, rot, col, a) { if (r < 1 || a <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const b = rot + i / 10 * TAU - Math.PI / 2, rr = i % 2 ? r * 0.28 : r; i ? c.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr) : c.moveTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); } c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - r * 1.6, y); c.lineTo(x + r * 1.6, y); c.moveTo(x, y - r * 1.6); c.lineTo(x, y + r * 1.6); c.stroke(); c.restore(); }

  /* F-S06 Firewheel Skip: wheels of fire spin up beside you and skip along the aim in a fan, each contact printing a burnt
     ring; the last bounce breaks each wheel into rolling coals that cool.
     Evolution: FK.evoN(C, 1, 7) wheels (one at Hatchling, seven at Celestial), the damage split between them; at Celestial
     each last bounce bursts. */
  S.firewheel = (C, H) => { const K = FK.bind(H), P = K.P, me = H.me, N = K.evoN(C, 1, 7), ev = K.evo(C), dx = C.tx - me.x, dy = C.ty - me.y, d = Math.max(2.5, Math.hypot(dx, dy)), a0 = Math.atan2(dy, dx), L = Math.min(d + 1.5, 7), HOP = 0.32, NH = 3, SPIN = 0.18;
    const spread = N > 1 ? Math.min(0.32, 1.85 / (N - 1)) : 0, rk = N === 1 ? 0.62 : Math.max(0.4, 0.6 - 0.035 * (N - 1)), nb = N > 3 ? 5 : 8, share = C.K * K.evoK(C) / N, fin = ev >= 7;
    H.X.sfx.whoosh(); me.sq = 0.6;
    for (let i = 0; i < N; i++) { const off = i - (N - 1) / 2, ang = a0 + off * spread, ca = Math.cos(ang), sa = Math.sin(ang), lead = i === Math.floor(N / 2), sb = a0 + off * (N > 1 ? Math.min(0.42, 2.4 / (N - 1)) : 0), x0 = me.x + Math.cos(sb) * 1.25, y0 = me.y + Math.sin(sb) * 1.25, Lw = L - 1.25 + 0.15 * Math.abs(off), dl = SPIN + Math.abs(off) * 0.03, dir = ca >= 0 ? 1 : -1, marks = [], coals = [];
      H.add({ life: dl + HOP * NH + 0.85, x: x0, y: y0, z: 0, rot: i * 0.7, hop: 0, done: 0, hist: [], seed: i * 2.3,
        update(dt, f) { f.rot += dt * 16 * dir; const tt = f.t - dl;
          if (!f.done) K.aura(f.x, f.y, rk * 0.6, dt, N > 3 ? 6 : 14, (rk + f.z) * 1);
          if (tt < 0) { if (Math.random() < 0.6 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'spark', x: x0 + Math.cos(b) * 0.8, y: y0 - rk + Math.sin(b) * 0.8, vx: -Math.cos(b) * 4, vy: -Math.sin(b) * 4, life: 0.2, max: 0.2, size: 2, color: P.yel }); } return; }
          if (f.done) return; const u = tt / (HOP * NH);
          const land = (x, y, r, dmg, last) => { H.hitArea(x, y, r, C.base * dmg * share, C.dmgO({ kb: last ? 3 : 2, burn: 1 })); marks.push({ x, y, r, t: f.t }); K.sparks(x, y, N > 3 ? 4 : 7); K.embers(x, y, N > 3 ? 3 : 6); K.flakes(x, y, 2); H.X.light(x, y, 1.8, 0.2); if (lead) { H.X.shake(3 + (last ? 2 : 0), 0.1); H.X.sfx.thud(); } };
          if (u >= 1) { f.done = 1; f.endT = f.t; const ex = x0 + ca * Lw, ey = y0 + sa * Lw; f.x = ex; f.y = ey; f.z = 0; land(ex, ey, fin ? 1.35 : 1.0, 0.5, true);
            if (fin) K.blast(ex, ey, 1.0, 0.45); else K.smoke(ex, ey, 3, 0.4);
            for (let k = 0; k < (N > 3 ? 2 : 4); k++) coals.push({ off: (k - (N > 3 ? 0.5 : 1.5)) * 0.32, sp: 2.2 + Math.random() * 1.6, r: 0.11 + Math.random() * 0.05 });
            for (let k = 0; k < H.n(N > 3 ? 5 : 12); k++) H.P({ kind: 'ember', x: ex, y: ey - 0.15, vx: ca * (2 + Math.random() * 4) + (Math.random() - 0.5) * 2, vy: sa * (2 + Math.random() * 4) * 0.7 - Math.random(), g: 3, drag: 1.4, life: 0.8, max: 0.8, size: 3.5, color: k % 3 ? P.org : P.gold }); return; }
          f.x = x0 + ca * Lw * u; f.y = y0 + sa * Lw * u; const hop = Math.floor(tt / HOP), hu = (tt % HOP) / HOP; f.z = Math.sin(hu * Math.PI) * (1.05 - hop * 0.25);
          if (hop > f.hop) { f.hop = hop; land(x0 + ca * Lw * hop / NH, y0 + sa * Lw * hop / NH, 1.0 + hop * 0.15, 0.95, false); }
          f.hist.push([f.x, f.y, f.z]); if (f.hist.length > 7) f.hist.shift(); },
        drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.5), hk = N > 3 ? 0.55 : 1;
          for (const m of marks) { const age = f.t - m.t, mx = H.sx(m.x), my = H.sy(m.y), r = T * m.r * 0.78; wheelPrint(c, H, K, mx, my, r * Math.min(1, 0.4 + age / 0.12), k, Math.max(0, 1 - age / 0.9) * hk, m.x * 3.1); if (age < 0.3) K.shockRing(c, mx, my, r * (0.4 + 1.1 * H.ease.out(age / 0.3)), (1 - age / 0.3) * hk); }
          if (!f.done) { const gs = f.t < dl ? H.ease.out(Math.min(1, f.t / dl)) : 1; K.floorLight(c, X, Y, T * rk * 2.2 * gs, 0.55 / (1 + f.z)); H.softShadow(c, X, Y, T * rk * 0.95 * gs, 0.28 / (1 + f.z)); } },
        draw(c, f, X, Y, T, t) { const r = T * rk;
          if (f.done) { const age = f.t - f.endT; if (age > 0.75) return; const ex = H.sx(f.x), ey = H.sy(f.y), px = -sa, py = ca; for (const co of coals) { const dd = co.sp * (age - age * age * 0.6) * T, cx = ex + ca * dd + px * co.off * T, cy = ey + sa * dd + py * co.off * T - T * co.r, heat = 1 - age / 0.75, rr = T * co.r; K.floorLight(c, cx, cy + rr, rr * 3, 0.4 * heat); H.sphere(c, cx, cy, rr, H.mix(P.crust, P.org, heat), heat > 0.4 ? P.yel : P.crustL, P.char, { lw: 1, spec: false }); if (heat > 0.3) K.flame(c, cx, cy - rr * 0.4, rr * 1.4, rr * 3 * heat, t, co.off * 7, 0, heat); } return; }
          const tt = f.t - dl, gs = tt < 0 ? H.ease.back(Math.min(1, f.t / dl)) : 1, cy = Y - T * (rk + f.z) * gs;
          if (tt > 0 && f.hist.length > 2) H.trail(c, f.hist.map(p => [H.sx(p[0]), H.sy(p[1]) - T * (rk + p[2])]), r * 1.1, P.org, P.yel);
          wheel(c, H, K, X, cy, r * gs, f.rot, t, f.seed, nb, Math.min(1, gs + 0.2), dir); } }); } };

  /* F-S07 Burning Mandala: a blazing mandala unfolds upright behind you (rings of sigil segments, petals of flame and a
     star of glowing lines, each turning at its own speed, embers drifting off), and you fire small glowing hoops of fire
     from round it in quick succession; they home gently onto the nearest monsters and burst in a ring flare.
     Evolution: 8 hoops at stages 1-3, 12 from Adept (stage 4), 18 at Celestial, the damage split between them; the
     mandala grows, gains a second ring of sigils from Adept and a third ring of flame petals and a crown at Celestial. */
  delete S.candlewick;
  function hoop(c, H, K, x, y, r, ang, spin, t, a) { const P = K.P; if (a <= 0.01) return; K.glow(c, x, y, r * 3, P.org, 0.55 * a); c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(ang);
    c.lineCap = 'round'; c.strokeStyle = H.rgba(P.red, 0.75); c.lineWidth = Math.max(2, r * 0.55); c.beginPath(); c.ellipse(0, 0, r * 0.55, r, 0, 0, TAU); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.95); c.lineWidth = Math.max(1.5, r * 0.32); c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.95); c.lineWidth = Math.max(1, r * 0.16); c.stroke(); c.strokeStyle = P.wht; c.lineWidth = 1; c.stroke();
    // tufts of flame licking back off the rim
    for (let i = 0; i < 5; i++) { const b = spin + i / 5 * TAU, ex = Math.cos(b) * r * 0.55, ey = Math.sin(b) * r, l = r * (0.55 + 0.25 * Math.sin(t * 17 + i * 2.3)); c.strokeStyle = H.rgba(i % 2 ? P.amb : P.org, 0.85); c.lineWidth = Math.max(1.5, r * 0.22); c.beginPath(); c.moveTo(ex, ey); c.quadraticCurveTo(ex - l * 0.6, ey + Math.sin(b) * l * 0.3, ex - l, ey + Math.sin(b + t * 9) * l * 0.25); c.stroke(); }
    c.restore(); }
  /* the mandala, upright, centred at (x, y), radius R px, opened by u (0..1), alpha a, tier 1..3 */
  function mandala(c, H, K, x, y, R, u, a, t, tier, pulse) { const P = K.P; if (a <= 0.01 || R < 2) return; const e = H.ease.out(u);
    K.glow(c, x, y, R * 2.1, P.org, 0.45 * a); K.glow(c, x, y, R * 0.8, P.yel, (0.15 + 0.25 * pulse) * a);
    c.save(); c.translate(x, y); c.scale(1, 0.92); c.globalAlpha = a; c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    // petals of flame round the middle (soft teardrops, a red edge and a yellow heart), turning one way
    const np = tier >= 3 ? 16 : 12, rot1 = t * 0.5;
    for (let i = 0; i < np; i++) { const b = rot1 + i / np * TAU, r0 = R * 0.42 * e, r1 = R * (0.86 + 0.06 * Math.sin(t * 6 + i)) * e, w = R * 0.13 * e; c.save(); c.rotate(b); const g = c.createLinearGradient(r0, 0, r1, 0); g.addColorStop(0, H.rgba(P.yel, 0.65)); g.addColorStop(0.6, H.rgba(P.org, 0.5)); g.addColorStop(1, H.rgba(P.red, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(r0, 0); c.quadraticCurveTo((r0 + r1) / 2, -w, r1, 0); c.quadraticCurveTo((r0 + r1) / 2, w, r0, 0); c.fill(); c.restore(); }
    // the outer ring: a double circle of sigil segments with diamond runes in the gaps, turning the other way
    const ring = (rr, n, sp, lw, col) => { c.strokeStyle = H.rgba(col, 0.9); c.lineWidth = lw; for (let i = 0; i < n; i++) { const b = sp + i / n * TAU, span = TAU / n * 0.72 * Math.min(1, u * 1.6); c.beginPath(); c.arc(0, 0, rr, b, b + span); c.stroke(); const d = b + TAU / n * 0.86, dx = Math.cos(d) * rr, dy = Math.sin(d) * rr, s = lw * 1.6; c.fillStyle = H.rgba(P.wht, 0.9 * e); c.beginPath(); c.moveTo(dx + Math.cos(d) * s, dy + Math.sin(d) * s); c.lineTo(dx - Math.sin(d) * s * 0.6, dy + Math.cos(d) * s * 0.6); c.lineTo(dx - Math.cos(d) * s, dy - Math.sin(d) * s); c.lineTo(dx + Math.sin(d) * s * 0.6, dy - Math.cos(d) * s * 0.6); c.closePath(); c.fill(); } };
    c.strokeStyle = H.rgba(P.red, 0.5); c.lineWidth = R * 0.1; c.beginPath(); c.arc(0, 0, R * 0.98 * e, 0, TAU); c.stroke();
    ring(R * 0.98 * e, 12, -t * 0.35, Math.max(1.5, R * 0.035), P.yel); c.strokeStyle = H.rgba(P.amb, 0.6); c.lineWidth = 1; c.beginPath(); c.arc(0, 0, R * 1.06 * e, 0, TAU); c.stroke();
    if (tier >= 2) ring(R * 0.66 * e, 8, t * 0.7, Math.max(1.2, R * 0.028), P.amb);
    if (tier >= 3) { c.strokeStyle = H.rgba(P.org, 0.45); c.lineWidth = R * 0.06; c.beginPath(); c.arc(0, 0, R * 1.22 * e, 0, TAU); c.stroke(); ring(R * 1.22 * e, 18, t * 0.22, Math.max(1.2, R * 0.025), P.gold); }
    // the star of glowing lines in the middle, two triangles counter-turning, spokes out to the ring
    for (const [sp, col] of [[t * 0.9, P.yel], [-t * 0.6 + Math.PI / 3, P.org]]) { c.strokeStyle = H.rgba(col, 0.85); c.lineWidth = Math.max(1.2, R * 0.025); c.beginPath(); for (let i = 0; i <= 3; i++) { const b = sp + i / 3 * TAU, rr = R * 0.5 * e; i ? c.lineTo(Math.cos(b) * rr, Math.sin(b) * rr) : c.moveTo(Math.cos(b) * rr, Math.sin(b) * rr); } c.stroke(); }
    c.strokeStyle = H.rgba(P.amb, 0.45); c.lineWidth = 1; for (let i = 0; i < 6; i++) { const b = -t * 0.35 + i / 6 * TAU; c.beginPath(); c.moveTo(Math.cos(b) * R * 0.5 * e, Math.sin(b) * R * 0.5 * e); c.lineTo(Math.cos(b) * R * 0.98 * e, Math.sin(b) * R * 0.98 * e); c.stroke(); }
    c.strokeStyle = H.rgba(P.wht, 0.7); c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, R * 0.22 * e, 0, TAU); c.stroke();
    c.restore();
    // tongues of real flame standing on the rim (the Celestial crown has more)
    const nf = tier >= 3 ? 10 : 6; for (let i = 0; i < nf; i++) { const b = -t * 0.35 + i / nf * TAU, fx = x + Math.cos(b) * R * 0.98 * e, fy = y + Math.sin(b) * R * 0.98 * e * 0.92; K.flameAt(c, fx, fy, b, R * 0.13, R * (0.26 + 0.08 * Math.sin(t * 9 + i)) * e, t, i * 1.9, 0.9 * a); }
    H.core(c, x, y, R * 0.1 * e, P.yel, P.wht, (0.35 + 0.4 * pulse) * a); }
  S.mandala = (C, H) => { const K = FK.bind(H), P = K.P, me = H.me, ev = K.evo(C), NR = ev >= 7 ? 18 : ev >= 4 ? 12 : 8, tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, OPEN = 0.28, FIRE = 0.6, gap = FIRE / NR, RM = 1.1 + 0.08 * (ev - 1), per = C.base * 4.0 * C.K * K.evoK(C) * (ev >= 7 ? 1.08 : 1) / NR;
    const mx0 = me.x, my0 = me.y, cand = H.sortNear(me.x, me.y).filter(m => Math.hypot(m.x - me.x, m.y - me.y) < 8).slice(0, Math.min(6, NR)), rings = [], flares = [];
    H.X.sfx.hum(); me.sq = 0.7;
    const F = H.add({ life: 4, pulse: 0, fired: 0,
      update(dt, f) { f.pulse = Math.max(0, f.pulse - dt * 5); const u = cl(f.t / OPEN, 0, 1);
        if (!f.endT) { const R = RM * u; for (let k = 0; k < (H.Q() > 0.5 ? 2 : 1); k++) if (Math.random() < dt * 14) { const b = Math.random() * TAU; H.P({ kind: 'ember', x: me.x + Math.cos(b) * R, y: me.y - 0.95 + Math.sin(b) * R * 0.92, vx: Math.cos(b) * 0.8, vy: -1 - Math.random(), g: -0.6, life: 0.7, max: 0.7, size: 2.5 + Math.random() * 1.5, color: Math.random() < 0.5 ? P.yel : P.org }); } }
        // fire the hoops in quick succession from round the mandala
        while (f.fired < NR && f.t >= OPEN + f.fired * gap) { const j = f.fired++, b = -Math.PI / 2 + j * 2.39996, m = cand.length ? cand[j % cand.length] : null, sx = me.x + Math.cos(b) * RM * 0.95, z = Math.max(0.25, 0.95 - Math.sin(b) * RM * 0.92), tx = m ? m.x : C.tx + Math.cos(b) * 0.8, ty = m ? m.y : C.ty + Math.sin(b) * 0.8;
          rings.push({ x: sx, y: me.y + 0.02, z, vx: Math.cos(b) * 5, vy: Math.sin(b) * 2, vz: -Math.sin(b) * 2, m, tx, ty, t: 0, hist: [], spin: j, done: false }); f.pulse = 1; if (j % 2 === 0) H.X.sfx.sparkle && H.X.sfx.sparkle(); }
        for (const r of rings) { if (r.done) continue; r.t += dt; if (r.m && r.m.dead) { const nm = H.X.nearestMon(r.x, r.y, 5); r.m = nm || null; if (!nm) { r.tx = r.x + r.vx * 0.2; r.ty = r.y + r.vy * 0.2; } }
          const tx = r.m ? r.m.x : r.tx, ty = r.m ? r.m.y : r.ty, dx = tx - r.x, dy = ty - r.y, d = Math.hypot(dx, dy) || 1, spd = 8.5 + r.t * 6, k = Math.min(1, dt * (3 + r.t * 10));
          r.vx += (dx / d * spd - r.vx) * k; r.vy += (dy / d * spd - r.vy) * k; r.vz += ((0.5 - r.z) * 6 - r.vz) * k; r.x += r.vx * dt; r.y += r.vy * dt; r.z += r.vz * dt; r.hist.push([r.x, r.y, r.z]); if (r.hist.length > 6) r.hist.shift();
          if (Math.random() < 0.6 * H.Q()) H.P({ kind: 'spark', x: r.x, y: r.y - r.z, vx: -r.vx * 0.2 + (Math.random() - 0.5) * 2, vy: -r.vy * 0.2 - Math.random() * 2, g: 6, life: 0.3, max: 0.3, size: 1.8, color: Math.random() < 0.5 ? P.yel : P.wht });
          if (d < 0.45 || r.t > 1.4) { r.done = true; if (r.m && !r.m.dead && d < 0.8) H.X.hitMon(r.m, per, C.dmgO({ burn: 1, kb: 0.6 })); else H.hitArea(r.x, r.y, 0.6, per, C.dmgO({ burn: 1, kb: 0.6 })); flares.push({ x: r.x, y: r.y, t: 0 }); K.sparks(r.x, r.y - 0.5, 5, 5); K.embers(r.x, r.y - 0.5, 3); H.X.light(r.x, r.y, 1.2, 0.15); } }
        for (const fl of flares) fl.t += dt;
        if (!f.endT && f.fired >= NR && rings.every(r => r.done)) { f.endT = f.t; f.life = 0.55; } },
      drawUnder(c, f, X, Y, T, t) { const u = cl(f.t / OPEN, 0, 1), a = f.endT ? Math.max(0, f.life / 0.55) : 1, px = H.sx(me.x), py = H.sy(me.y);
        K.floorLight(c, px, py, T * RM * 1.6, 0.5 * a * u);
        mandala(c, H, K, px, py - T * 0.95, T * RM, u, a, t, tier, f.pulse);
        for (const fl of flares) { if (fl.t > 0.35) continue; const k = 1 - fl.t / 0.35; K.shockRing(c, H.sx(fl.x), H.sy(fl.y), T * (0.2 + 0.6 * H.ease.out(fl.t / 0.35)), k); } },
      draw(c, f, X, Y, T, t) {
        for (const r of rings) { if (r.done) continue; const sx = H.sx(r.x), sy = H.sy(r.y) - r.z * T, ang = Math.atan2(r.vy - r.vz, r.vx), pts = r.hist.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]); if (pts.length > 2) H.trail(c, pts, T * 0.14, P.org, P.yel); hoop(c, H, K, sx, sy, T * 0.22, ang, t * 8 + r.spin, t, Math.min(1, r.t / 0.06)); }
        for (const fl of flares) { if (fl.t > 0.3) continue; const k = 1 - fl.t / 0.3, sx = H.sx(fl.x), sy = H.sy(fl.y) - T * 0.5, rr = T * (0.2 + 0.5 * H.ease.out(fl.t / 0.3)); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.9 * k); c.lineWidth = 3 * k + 1; c.beginPath(); c.ellipse(sx, sy, rr, rr * 0.6, 0, 0, TAU); c.stroke(); c.strokeStyle = H.rgba(P.wht, k); c.lineWidth = 1; c.stroke(); c.restore(); K.glow(c, sx, sy, rr * 1.4, P.org, 0.6 * k); } } });
    return F; };

  /* F-S08 Salamander Rush: a puff of flame births salamanders of faceted molten crystal that sprout from round you and
     dart outward along fanned paths, weaving, legs stepping and scattering sparks, scorching a track; at the end of its
     run each coils into a knot and bursts, leaving a curling tail of smoke.
     Evolution: FK.evoN(C, 1, 7) salamanders (one at Hatchling, seven at Celestial, fanning out from round you on separate
     paths, the damage split between them), a longer run; at Celestial every burst throws up a ring of flame. */
  S.salamander = (C, H) => { const K = FK.bind(H), P = K.P, me = H.me, a0 = C.a, ev = K.evo(C), N = K.evoN(C, 1, 7), fin = ev >= 7, L = 6 + (ev - 1) / 3, WIND = 0.14, BR = (N > 1 ? 1.35 : 1.7) + 0.05 * (ev - 1), share = C.K * K.evoK(C) / N, spread = N > 1 ? Math.min(0.5, 3.0 / (N - 1)) : 0, NP = N > 3 ? 8 : 11, SEG = 0.115 * 10 / (NP - 1), COIL = 0.24;
    H.X.sfx.whoosh(); me.sq = 0.6;
    for (let i = 0; i < N; i++) { const off = i - (N - 1) / 2, a = a0 + off * spread, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca, sb = a, x0 = me.x + Math.cos(sb) * (N > 1 ? 1.1 : 0.75), y0 = me.y + Math.sin(sb) * (N > 1 ? 1.1 : 0.75), dl = Math.abs(off) * 0.05, ph = i * 1.7;
      let Lm = 0; const Li = L - Math.abs(off) * 0.25; while (Lm < Li && !H.X.blocked(x0 + ca * (Lm + 0.15), y0 + sa * (Lm + 0.15), 0.3, 0)) Lm += 0.15; Lm = Math.max(0.9, Lm);
      const DUR = 0.85 * Lm / 6, ex = x0 + ca * Lm, ey = y0 + sa * Lm, AMP = N > 1 ? 0.22 : 0.3, env = d => cl(Math.min(d / 0.45, (Lm - d) / 0.7), 0, 1), at = d => { const o = AMP * Math.sin(d * 1.85 + ph) * env(d); return [x0 + ca * d + px * o, y0 + sa * d + py * o]; };
      H.warnLine(x0, y0, a, Lm + 0.4, N > 1 ? 1.2 : 1.8, 0.3, C.col);
      const st = { boom: false }, hits = new Set();
      H.add({ life: WIND + dl + DUR + COIL + 0.85, x: x0, y: y0,
        update(dt, f) { const tt = f.t - WIND - dl;
          if (tt < 0) { if (i === 0 || N < 4) K.aura(x0, y0, 0.3, dt, 16 / N + 4, 0.3); return; }
          const d = cl(tt / DUR, 0, 1) * Lm; if (d > 0 && d < Lm) { const [hx, hy] = at(d);
            for (const m of H.near(hx, hy, 0.8)) { if (hits.has(m)) continue; hits.add(m); H.X.hitMon(m, C.base * 1.1 * share, C.dmgO({ kb: 1, burn: 1 })); K.ignite(m.x, m.y, 0.5); }
            if (Math.random() < (N > 3 ? 0.45 : 0.9) * H.Q()) for (const s of [-1, 1]) H.P({ kind: 'spark', x: hx + px * s * 0.3, y: hy + py * s * 0.3, vx: px * s * 3 - ca * 2, vy: py * s * 2 - sa * 1.5 - 1.5, g: 9, life: 0.35, max: 0.35, size: 2, color: s > 0 ? P.yel : P.wht });
            K.aura(hx, hy, 0.35, dt, N > 3 ? 5 : 10, 0.3); }
          if (!st.boom && tt - DUR >= COIL) { st.boom = true; st.bt = f.t; H.hitArea(ex, ey, BR, C.base * 1.6 * share, C.dmgO({ kb: 4, burn: 1 })); K.blast(ex, ey, BR, N > 3 ? 0.55 : 1.2 + 0.08 * ev); if (i === Math.floor(N / 2)) H.X.sfx.crash();
            for (let j = 0; j < H.n(N > 3 ? 5 : 12); j++) { const b = j / 12 * TAU * 1.3; H.P({ kind: 'smoke', x: ex + Math.cos(b) * 0.3 * (j / 12), y: ey + Math.sin(b) * 0.2 - 0.3 - j * 0.12, vx: Math.cos(b) * 0.7, vy: -1.5 - j * 0.15, life: 1.2, max: 1.2, size: 0.35 + j * 0.03, color: 'rgba(58,38,34,' }); }
            if (fin) { K.sparks(ex, ey, 6, 8); K.embers(ex, ey, 5, { v: 5 }); if (i === 0) H.X.shake(7, 0.25); } }
          if (st.boom && f.t - st.bt < 0.5) K.aura(ex, ey, BR * 0.5, dt, N > 3 ? 8 : 20, 0); },
        drawUnder(c, f, X, Y, T, t) { const tt = f.t - WIND - dl, k = Math.min(1, f.life / 0.6), dh = cl(tt / DUR, 0, 1) * Lm;
          if (dh > 0.1) { const pts = []; for (let s = 0; s <= 12; s++) { const [x, y] = at(dh * s / 12); pts.push([H.sx(x), H.sy(y)]); }
            c.save(); c.globalAlpha = 0.55 * k; H.ribbon(c, pts, T * 0.3, H.rgba(P.char, 0.6), null, u => 0.4 + 0.6 * u); c.globalCompositeOperation = 'lighter'; H.ribbon(c, pts, T * 0.11, H.rgba(P.org, 0.7), null, u => u * u); c.restore();
            if (dh < Lm) { const [hx, hy] = at(dh), [mx, my] = at(Math.max(0, dh - 0.55)), [qx, qy] = at(Math.max(0, dh - 1.0)); K.floorLight(c, H.sx(hx), H.sy(hy), T * 1.2, 0.5); H.softShadow(c, H.sx(hx), H.sy(hy), T * 0.42, 0.25); H.softShadow(c, H.sx(mx), H.sy(my), T * 0.4, 0.22); H.softShadow(c, H.sx(qx), H.sy(qy), T * 0.28, 0.16); } }
          if (st.boom) { const age = f.t - st.bt, bx = H.sx(ex), by = H.sy(ey); K.scorch(c, bx, by, T * BR * 0.85, k, Math.max(0, 1 - age / 1.0), 3 + i); if (age < 0.35) K.shockRing(c, bx, by, T * BR * (0.3 + 0.9 * H.ease.out(age / 0.35)), 1 - age / 0.35); }
          else if (tt > DUR) K.floorLight(c, H.sx(ex), H.sy(ey), T * BR, 0.4 + 0.4 * cl((tt - DUR) / COIL, 0, 1)); },
        draw(c, f, X, Y, T, t) { const tt = f.t - WIND - dl, sc = T * (0.6 + 0.015 * ev) * (N > 3 ? 0.74 : 1);
          if (tt < 0.15) { const u = cl((f.t - dl) / WIND, 0, 1), k = tt < 0 ? 1 : 1 - tt / 0.15; if (u > 0) K.fireball(c, X, Y - T * 0.25, T * (N > 3 ? 0.15 : 0.22) * H.ease.back(u), t, 1 + i, k, -Math.PI / 2); }
          if (tt < 0) return;
          if (st.boom) { const age = f.t - st.bt; if (fin && age < 0.55) { const u = age / 0.55; K.flameRing(c, H.sx(ex), H.sy(ey), T * BR * (0.6 + 0.25 * u), 4, T * 1.3 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.62) * (1 - u * 0.4), t, 1 - u * u, t * 0.4 + i); } if (age < 0.25) K.fireball(c, H.sx(ex), H.sy(ey) - T * 0.4, T * (0.4 + 0.6 * age / 0.25) * (N > 3 ? 0.75 : 1), t, 7 + i, 1 - age / 0.25, -Math.PI / 2); return; }
          const cx = H.sx(ex), cy = H.sy(ey) - T * 0.25, dh = cl(tt / DUR, 0, 1) * Lm, coil = H.ease.io(cl((tt - DUR) / COIL, 0, 1)), grow = cl(tt / 0.1, 0.25, 1), pts = [];
          for (let k = NP - 1; k >= 0; k--) { const dd = dh - k * SEG * grow; const [wx, wy] = at(Math.max(0, dd)), sx = H.sx(wx), sy = H.sy(wy) - T * 0.28; if (coil > 0) { const th = a + Math.PI + k * 0.62 * 10 / (NP - 1) + coil * 2, rr = T * (0.12 + 0.07 * k * 10 / (NP - 1)) * (1 - coil * 0.35); pts.push([sx + (cx + Math.cos(th) * rr - sx) * coil, sy + (cy + Math.sin(th) * rr * 0.7 - k * T * 0.04 * coil - sy) * coil]); } else pts.push([sx, sy]); }
          salamander(c, H, K, pts, sc, t, t * 22 + i, 1, i * 5); if (coil > 0) K.glow(c, cx, cy, T * (0.4 + coil), P.yel, 0.5 * coil); } }); } };

  /* F-S09 Hearthburst: soft fire gathers in a ring round your feet, glowing up from the floor, then rolls outward as a
     low wave of real flame: a feathered band of light with a hot (never hard) leading edge, its inside dimming at once,
     smoke wisps curling off it. Everything stays round the pet: what lies behind it is drawn under it, what lies in front
     is kept low near it.
     Evolution: radius 3.0 at Hatchling to 4.5 at Celestial (times C.K), FK.evoN(C, 1, 3) waves sharing the damage; at
     Celestial the last wave throws up a crown of flame pillars at its rim. */
  /* a feathered band of light on the floor ellipse: layered soft strokes, wide and faint outside, narrow and hot inside */
  function softBand(c, H, K, x, y, r, w, k) { if (k <= 0.01 || r < 1) return; const P = K.P; c.save(); c.globalCompositeOperation = 'lighter'; const L = [[1, P.red, 0.07], [0.72, P.red, 0.1], [0.5, P.org, 0.14], [0.32, P.amb, 0.2], [0.18, P.yel, 0.26], [0.08, P.wht, 0.3]];
    for (const [lw, col, al] of L) { c.strokeStyle = H.rgba(col, al * k); c.lineWidth = Math.max(1, w * lw); H.floorEllipse(c, x, y, r); c.stroke(); } c.restore(); }
  /* soft char on the floor: a feathered dark pool, no cracks */
  function softChar(c, H, x, y, r, a) { if (r < 1 || a <= 0.01) return; c.save(); c.translate(x, y); c.scale(1, H.GY); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, 0.25 * a); blitSized(c, glowSprite('#FF7A2E'), -r, -r, r * 2, r * 2); c.restore(); }   /* (a warm additive afterglow: no dark residue) */
  S.hearthburst = (C, H) => { const K = FK.bind(H), P = K.P, me = H.me, ev = K.evo(C), cx = me.x, cy = me.y, R = (3.0 + 0.25 * (ev - 1)) * C.K, NW = K.evoN(C, 1, 3), fin = ev >= 7, GATHER = 0.38, ROLL = 0.5, WGAP = 0.2, R0 = 0.95, NG = 10;
    const WT = [[1], [0.62, 0.38], [0.5, 0.3, 0.2]][NW - 1], hits = WT.map(() => new Set()), nf = Math.max(8, Math.round([20, 15, 11][NW - 1] * H.Q())), END = GATHER + (NW - 1) * WGAP + ROLL;
    H.X.sfx.hum(); me.sq = 0.6;
    const flames = (c, f, T, t, back) => { const mx = H.sx(cx), my = H.sy(cy);
      // gathering: soft flames rise in a ring round your feet
      if (f.t < GATHER + 0.3) { const u = cl(f.t / GATHER, 0, 1), k = f.t < GATHER ? 1 : 1 - (f.t - GATHER) / 0.3; for (let i = 0; i < NG; i++) { const b = i / NG * TAU + 0.3 + t * 0.8, sb = Math.sin(b); if ((sb < 0) !== back) continue; const x = mx + Math.cos(b) * R0 * T, y = my + sb * R0 * T * H.GY, hmax = back ? T * 0.9 : T * 0.4, kk = k * cl(u * 3 - i * 0.12, 0, 1); K.glow(c, x, y - T * 0.15, T * 0.45, P.org, 0.35 * kk); K.flame(c, x, y, T * 0.26 * (0.5 + 0.5 * u), Math.min(hmax, T * (0.25 + 0.7 * u)) * kk, t, i * 1.7, -Math.cos(b) * T * 0.12, 0.85 * kk); } }
      // the waves rolling out: soft glows under a row of flames
      for (let w = 0; w < NW; w++) { const tw = f.t - GATHER - w * WGAP; if (tw < 0) continue; const u = cl(tw / ROLL, 0, 1), k = 1 - cl((tw - ROLL) / 0.4, 0, 1); if (k <= 0) continue; const r = (R0 + (R - R0) * H.ease.out(u)) * T, h = T * (1.3 - 0.6 * u) * (1 - w * 0.12);
        for (let i = 0; i < nf; i++) { const b = i / nf * TAU + w * 0.4 + t * 0.25, sb = Math.sin(b); if ((sb < 0) !== back) continue; const x = mx + Math.cos(b) * r, y = my + sb * r * H.GY, near = Math.abs(Math.cos(b) * r) < T * 0.75, hh = (!back && near ? Math.min(h, Math.max(T * 0.2, sb * r * H.GY + T * 0.05)) : h) * (0.75 + 0.25 * Math.sin(t * 7 + i * 1.9)) * k;
          K.glow(c, x, y - hh * 0.3, hh * 0.75, P.org, 0.3 * k); K.flame(c, x, y, T * 0.46 * (1 - 0.25 * u), hh, t, i * 1.3 + w, Math.cos(b) * T * 0.25, 0.8 * k * (1 - 0.25 * u)); } }
      // the Celestial crown: pillars of flame at the rim
      if (fin) { const tf = f.t - END; if (tf > -0.05 && tf < 0.65) { const u = cl(tf / 0.65, 0, 1); for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.2, sb = Math.sin(b); if ((sb < 0) !== back) continue; const x = mx + Math.cos(b) * R * T, y = my + sb * R * T * H.GY, hh = T * 2.2 * Math.sin(Math.min(1, u * 1.8) * Math.PI * 0.55) * (1 - u * 0.5) + 1; K.glow(c, x, y - hh * 0.35, hh * 0.7, P.org, 0.4 * (1 - u)); K.flame(c, x, y, T * 0.5, hh, t, i * 2.9, 0, 0.9 * (1 - u * u)); } } } };
    H.add({ life: END + (fin ? 0.8 : 0.6),
      update(dt, f) {
        if (f.t < GATHER) { if (Math.random() < 1.4 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'ember', x: cx + Math.cos(b) * 2.4, y: cy + Math.sin(b) * 2.4 * H.GY, vx: -Math.cos(b) * 3.8, vy: -Math.sin(b) * 3.8 * H.GY - 0.4, drag: 1.5, life: 0.35, max: 0.35, size: 3, color: Math.random() < 0.5 ? P.yel : P.org }); } K.aura(cx, cy, R0, dt, 14, 0); return; }
        for (let w = 0; w < NW; w++) { const tw = f.t - GATHER - w * WGAP; if (tw < 0 || tw > ROLL + 0.2) continue; const r = R0 + (R - R0) * H.ease.out(Math.min(1, tw / ROLL));
          if (tw <= ROLL) for (const m of H.living()) { if (hits[w].has(m)) continue; if (Math.hypot(m.x - cx, m.y - cy) < r + m.r) { hits[w].add(m); H.X.hitMon(m, C.base * 2.3 * C.K * K.evoK(C) * WT[w], C.dmgO({ kb: w ? 2 : 5, burn: 1 })); K.ignite(m.x, m.y, 0.6); } }
          for (let i = 0; i < H.n(3); i++) { const b = Math.random() * TAU; H.P({ kind: 'ember', x: cx + Math.cos(b) * r, y: cy + Math.sin(b) * r * H.GY, vx: Math.cos(b) * 2, vy: -2 - Math.random() * 2, g: -1, life: 0.5, max: 0.5, size: 3.5, color: Math.random() < 0.5 ? P.org : P.yel }); }
          // smoke wisps curling up off the wave
          if (Math.random() < dt * 10 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: cx + Math.cos(b) * r * 0.92, y: cy + Math.sin(b) * r * 0.92 * H.GY - 0.3, vx: Math.cos(b) * 0.5, vy: -1 - Math.random() * 0.6, life: 1.0, max: 1.0, size: 0.45, color: 'rgba(58,38,34,' }); } } },
      drawUnder(c, f, X, Y, T, t) { const mx = H.sx(cx), my = H.sy(cy), kAll = Math.min(1, f.life / 0.5), u0 = cl(f.t / GATHER, 0, 1);
        // the hearth: a soft glow under and round you, a feathered ring of light where the fire gathers, a soft char
        K.floorLight(c, mx, my, T * (1.3 + 0.7 * u0), (0.35 + 0.35 * u0) * kAll); softBand(c, H, K, mx, my, R0 * T, T * 0.9, u0 * (f.t < GATHER ? 1 : Math.max(0, 1 - (f.t - GATHER) / 0.4)));
        if (f.t > GATHER) softChar(c, H, mx, my, T * Math.min(R * 0.95, 1.4 + (f.t - GATHER) * 6), 0.8 * kAll);
        // each wave: a feathered band, the inside dimming behind it
        for (let w = 0; w < NW; w++) { const tw = f.t - GATHER - w * WGAP; if (tw < 0) continue; const u = cl(tw / ROLL, 0, 1), k = 1 - cl((tw - ROLL) / 0.4, 0, 1); if (k <= 0) continue; const r = (R0 + (R - R0) * H.ease.out(u)) * T;
          c.save(); c.translate(mx, my); c.scale(1, H.GY); const g = c.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.12); g.addColorStop(0, H.rgba(P.red, 0)); g.addColorStop(0.55, H.rgba(P.red, 0.12 * k)); g.addColorStop(0.82, H.rgba(P.org, 0.3 * k)); g.addColorStop(0.9, H.rgba(P.amb, 0.32 * k)); g.addColorStop(1, H.rgba(P.org, 0)); c.fillStyle = g; c.globalCompositeOperation = 'lighter'; c.beginPath(); c.arc(0, 0, r * 1.12, 0, TAU); c.fill(); c.restore();
          softBand(c, H, K, mx, my, r, T * (1.1 - 0.4 * u), k * (1 - w * 0.2)); }
        if (fin && f.t > END - 0.05) { const u = cl((f.t - END) / 0.65, 0, 1); softBand(c, H, K, mx, my, T * R * (1 + 0.2 * u), T * 1.2, 1 - u); }
        flames(c, f, T, t, true); },
      draw(c, f, X, Y, T, t) { flames(c, f, T, t, false); } });
    H.X.after(GATHER, () => { H.X.flash(0.07, '#FFB066'); H.X.shake(5, 0.15); H.X.light(cx, cy, R * 1.3, 0.35); H.X.sfx.whoosh(); H.X.sfx.thud(); K.embers(cx, cy, 12, { v: 4 }); K.smoke(cx, cy, 4, 0.8); });
    if (fin) H.X.after(END, () => { H.X.shake(5, 0.15); H.X.sfx.whoosh(); for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.2; K.embers(cx + Math.cos(b) * R, cy + Math.sin(b) * R * H.GY, 3, { v: 3 }); K.smoke(cx + Math.cos(b) * R, cy + Math.sin(b) * R * H.GY, 1, 0.3); } }); };

  /* F-S10 Falling Matchstars: a fan of sparks and match-head stars fountains up from above your head; each falls onto a
     marked spot as a small comet (a burning head, a five-point glint, a stretched tail) and bursts in a crown of flame.
     Evolution: FK.evoN(C, 3, 12) stars (four times as many at Celestial; the damage split between them, the impacts
     closer together and spread over two rings, each star drawn more cheaply when there are many); at Celestial a last,
     larger star falls on the centre. */
  S.matchstars = (C, H) => { const K = FK.bind(H), P = K.P, me = H.me, a = C.a, ev = K.evo(C), NS = K.evoN(C, 3, 12), fin = ev >= 7, GAP = Math.max(0.065, 0.6 / NS), FALL = 0.35, lite = NS > 5;
    const spots = []; for (let i = 0; i < NS; i++) { if (NS === 3) { const b = a + (i - 1) * 1.1, r = i === 1 ? 0 : 1.1; spots.push({ x: C.tx + Math.cos(b) * r, y: C.ty + Math.sin(b) * r }); } else if (i === 0) spots.push({ x: C.tx, y: C.ty }); else { const n1 = Math.min(6, NS - 1), inner = i <= n1, b = inner ? a + (i - 1) / n1 * TAU + 0.4 : a + (i - 1 - n1) / (NS - 1 - n1) * TAU + 0.4 + Math.PI / n1, r = inner ? (NS > 7 ? 1.3 : 1.45) : 2.5; spots.push({ x: C.tx + Math.cos(b) * r, y: C.ty + Math.sin(b) * r }); } }
    const order = NS === 3 ? [0, 1, 2] : spots.map((s, i) => i); spots.forEach((s, i) => { s.t0 = 0.55 + order[i] * GAP; s.big = false; s.r = NS > 7 ? 1.0 : 1.15; s.k = 1; s.side = (i % 2 ? 1 : -1) * (0.4 + (i % 3) * 0.25); });
    if (fin) spots.push({ x: C.tx, y: C.ty, t0: 0.55 + NS * GAP + 0.3, big: true, r: 1.8, k: 1.5, side: 0 });
    const per = C.base * 0.9 * 3 * C.K * K.evoK(C) / spots.reduce((s, p) => s + p.k, 0);
    H.X.sfx.whoosh(); me.sq = 0.7;
    // the launch: a fountain of sparks and the stars themselves rising from above your head
    for (let i = 0; i < H.n(16 + NS * 2); i++) H.P({ kind: 'spark', x: me.x + (Math.random() - 0.5) * 0.3, y: me.y - 1.1, vx: Math.cos(a) * 2 + (Math.random() - 0.5) * 4, vy: -7 - Math.random() * 4, g: 9, life: 0.5, max: 0.5, size: 2, color: i % 2 ? P.yel : P.wht });
    H.add({ life: 0.6,
      update(dt, f) { if (f.t < 0.3) K.aura(me.x, me.y, 0.2, dt, 12, 1.1); },
      draw(c, f, X, Y, T, t) { const sx = X, sy = Y - T * 1.15, k0 = Math.min(1, f.t / 0.08); if (f.t < 0.15) { glint(c, H, sx, sy, T * 0.35 * k0, t * 3, P.yel, 1 - f.t / 0.15); K.glow(c, sx, sy, T * 0.8, P.org, 0.6 * (1 - f.t / 0.15)); }
        spots.forEach((s, i) => { if (s.big) return; const u = cl(f.t / 0.45, 0, 1); if (u >= 1) return; const e = H.ease.out(u), hx = sx + (s.side * 1.6 + Math.cos(a) * 0.8) * T * e, hy = sy - T * 5.5 * e - Math.sin(u * Math.PI) * T * 0.3, k = 1 - u * u; if (lite) H.core(c, hx, hy, T * 0.07, P.org, P.wht, k); else K.fireball(c, hx, hy, T * 0.07 * (1 - u * 0.4), t, i, k, Math.PI / 2); glint(c, H, hx, hy, T * 0.12, t * 4 + i, P.yel, k); }); } });
    spots.forEach((s, i) => { H.warn(s.x, s.y, s.r * 0.95, s.t0, C.col); const sz = s.big ? 0.26 : 0.17;
      H.add({ life: s.t0 + 1.0, x: s.x, y: s.y, done: false,
        update(dt, f) { const fl = (f.t - (s.t0 - FALL)) / FALL; if (fl > 0 && fl < 1) K.aura(s.x, s.y, 0.2, dt, s.big ? 14 : 6, (1 - H.ease.in(fl)) * 5.2); if (f.t > s.t0 && f.t < s.t0 + 0.5) K.aura(s.x, s.y, s.r * 0.5, dt, s.big ? 18 : 8, 0); },
        drawUnder(c, f, X, Y, T, t) { const fl = cl((f.t - (s.t0 - FALL)) / FALL, 0, 1), age = f.t - s.t0;
          if (age < 0) { if (fl > 0) { const e = H.ease.in(fl); K.floorLight(c, X, Y, T * (0.4 + 0.6 * e) * s.r, 0.55 * e); H.softShadow(c, X, Y, T * 0.3 * e, 0.22 * e); } return; }
          const k = Math.min(1, f.life / 0.5); K.scorch(c, X, Y, T * s.r * 0.75, k, Math.max(0, 1 - age / 0.8), i * 1.9);
          c.save(); c.globalAlpha = k * Math.max(0, 1 - age / 0.8); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.7); c.lineWidth = 1.5; for (let j = 0; j < 5; j++) { const b = j / 5 * TAU - Math.PI / 2 + i, r1 = T * s.r * 0.85; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + Math.cos(b) * r1, Y + Math.sin(b) * r1 * H.GY); c.stroke(); } c.restore();
          if (age < 0.3) K.shockRing(c, X, Y, T * s.r * (0.3 + 0.9 * H.ease.out(age / 0.3)), 1 - age / 0.3); },
        draw(c, f, X, Y, T, t) { const fl = (f.t - (s.t0 - FALL)) / FALL, age = f.t - s.t0;
          if (fl > 0 && fl < 1) { const pos = q => { const e = H.ease.in(cl(q, 0, 1)); return [X + (1 - e) * T * (s.side * 1.4 - Math.cos(a) * 1.0), Y - (1 - e) * 5.2 * T]; }; const [hx, hy] = pos(fl), pts = [];
            for (let j = 6; j >= 0; j--) pts.push(pos(fl - j * 0.05)); c.save(); c.globalCompositeOperation = 'lighter'; const tp = q => 0.15 + 0.85 * q * q; for (let j = 1; j < pts.length; j += lite ? 3 : 2) K.glow(c, pts[j][0], pts[j][1], T * sz * (1 + 2 * j / pts.length), P.org, 0.35); if (!lite) H.ribbon(c, pts, T * sz * 2.1, H.rgba(P.red, 0.55), null, tp); H.ribbon(c, pts, T * sz * 1.5, H.rgba(P.org, 0.8), null, tp); H.ribbon(c, pts, T * sz * 0.8, H.rgba(P.yel, 0.9), null, tp); H.ribbon(c, pts, T * sz * 0.3, P.wht, null, tp); c.restore();
            const ta = Math.atan2(pts[0][1] - hy, pts[0][0] - hx); if (lite && !s.big) { K.glow(c, hx, hy, T * sz * 3, P.org, 0.6); H.core(c, hx, hy, T * sz * 0.9, P.amb, P.wht, 1); } else K.fireball(c, hx, hy, T * sz * 1.15, t, i * 1.3, 1, ta); H.sphere(c, hx, hy, T * sz * 0.45, P.red, P.yel, P.char, { lw: 1, spec: false }); glint(c, H, hx, hy, T * sz * 1.4, t * 5 + i, P.yel, 0.85); }
          // the burst: a crown of flame standing on the spot, sinking as it cools
          if (age > 0 && age < 0.45) { const u = age / 0.45; K.flame(c, X, Y + T * 0.05, T * (s.big ? 0.8 : 0.5), T * (s.big ? 1.9 : 1.2) * Math.sin(Math.min(1, u * 3) * Math.PI * 0.5) * (1 - u) + 1, t, i * 2.2, 0, 1 - u * u); } } });
      H.X.after(s.t0, () => { H.hitArea(s.x, s.y, s.r, per * s.k, C.dmgO({ kb: s.big ? 4 : 2, burn: 1 })); K.blast(s.x, s.y, s.r, s.big ? 1.5 : lite ? 0.45 : 0.75); for (let j = 0; j < H.n(s.big ? 10 : lite ? 3 : 6); j++) { const b = j / 6 * TAU; H.P({ kind: 'star', x: s.x + Math.cos(b) * 0.2, y: s.y - 0.3 + Math.sin(b) * 0.15, vx: Math.cos(b) * 3, vy: Math.sin(b) * 2 - 2, g: 6, life: 0.45, max: 0.45, size: 4, color: j % 2 ? P.yel : P.wht }); } if (!lite || i % 3 === 0 || s.big) H.X.sfx.crash(); }); }); };
})();
