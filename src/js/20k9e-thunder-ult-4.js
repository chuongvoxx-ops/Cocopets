/* ---------- Lightning, reworked: Ultimates 7-8 (heavensbow, lotus) ----------
   Heaven's Bow: two streams of electricity rise beside the pet and grow into a gigantic floating longbow (translucent
   limbs with layered currents flowing through them, a faceted crystal grip, a thin white lightning string). The pet
   braces, the string draws back and the bow bends; lightning arrows with crystalline faceted heads and three streaming
   filaments for feathers materialise along the string and spread into a fan, fly in a rapid sequence, then a second
   draw concentrates the charge into one immense piercing arrow whose release recoils through bow and pet.
   Thunder Lotus: a seed of lightning plunges under the monsters, veins branch over the floor, rise and curl into a
   closed bud whose petals are curved 3-D ribbons of electricity (cupped, the back ones drawn behind the monsters and
   the front ones in front, the inner face bright and the outer face deep, lit from the upper left). It opens in a
   spiral, pulses climb through it, beads race along the petal edges and fling off as sparks; it peels apart into
   curling strands and leaves a fading flower of light on the floor (never a dark mark). */
(() => {
  const U = ELEM_IMPL.thunder.ult, TAU = Math.PI * 2;
  let H, K, P;
  const cl = u => Math.max(0, Math.min(1, u)), lerp = (a, b, u) => a + (b - a) * u;
  const sm = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const eo = u => 1 - (1 - u) * (1 - u), eio = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const back = u => { const s = 1.4; u -= 1; return u * u * ((s + 1) * u + s) + 1; };
  /* how much a thing at screen (X0, Y0) may show: a ghost where it would stand over the pet */
  function petGuard(X0, Y0, T, rad) { const mx = H.sx(H.me.x), my = H.sy(H.me.y) - T * 0.45, d = Math.hypot(X0 - mx, (Y0 - my) * 1.15) - (rad || 0); return Math.max(0.28, cl((d - T * 0.55) / (T * 0.8))); }
  /* a screen point back to the world (particles live in world units; height folds into y) */
  const toW = (X, Y, T) => [H.me.x + (X - H.sx(H.me.x)) / T, H.me.y + (Y - H.sy(H.me.y)) / T];
  /* a cheap jagged spark line: a cyan haze and a white core (two additive strokes) */
  function zig(c, x0, y0, x1, y1, s, jit, w, a, col) { if (!(a > 0.01)) return; const pts = K.path(x0, y0, x1, y1, s, jit, 5); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = 0.5 * Math.min(1, a); c.strokeStyle = col || P.cyan; K.line(c, pts, w * 2.2); c.globalAlpha = Math.min(1, a); c.strokeStyle = P.white; K.line(c, pts, w * 0.6); c.restore(); }
  function pathOf(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
  /* a point a fraction s along a polyline */
  function at(pts, s) { const n = pts.length - 1, f = cl(s) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; }

  /* ---------- crystal pieces ---------- */
  /* the facets of a crystalline arrowhead, tip at the origin pointing along +x (unit size): [points, tone] where tone
     0 lit white-ice, 1 cyan, 2 blue, 3 deep violet. big: a second, flared layer of barbs */
  const HEAD = [[[0, 0], [-0.62, -0.4], [-0.5, 0]], 0], HEAD2 = [[[0, 0], [-0.5, 0], [-0.62, 0.4]], 1], HEAD3 = [[[-0.62, -0.4], [-0.98, 0], [-0.5, 0]], 2], HEAD4 = [[[-0.5, 0], [-0.98, 0], [-0.62, 0.4]], 3];
  const FACETS = [HEAD, HEAD2, HEAD3, HEAD4];
  const FACETS_BIG = FACETS.concat([[[[-0.62, -0.4], [-1.18, -0.62], [-0.86, -0.18]], 1], [[[-0.62, 0.4], [-0.86, 0.18], [-1.18, 0.62]], 3], [[[0.02, 0], [-0.3, -0.16], [-0.62, -0.4], [-0.5, 0]], 0], [[[0.02, 0], [-0.5, 0], [-0.62, 0.4], [-0.3, 0.16]], 2],
    [[[-0.86, -0.18], [-1.18, -0.62], [-1.05, -0.12]], 2], [[[-0.86, 0.18], [-1.05, 0.12], [-1.18, 0.62]], 0]]);
  const TONE = () => [P.ice, P.cyan, P.blue, P.deep];
  /* a faceted crystal head at screen (x, y) pointing along ang, s px long. o.asm (0..1): its facets fly in from a
     turning ring and lock into place; o.gold: golden edges; o.spin: the ring's turn */
  function crystalHead(c, x, y, ang, s, a, o) {
    if (!(a > 0.01) || s < 1) return; o = o || {}; const F = o.big ? FACETS_BIG : FACETS, tones = TONE(), asm = o.asm == null ? 1 : o.asm;
    K.glow(c, x - Math.cos(ang) * s * 0.45, y - Math.sin(ang) * s * 0.45, s * (1.8 + 0.6 * (o.big ? 1 : 0)), o.gold ? P.gold : P.cyan, 0.55 * a * (0.4 + 0.6 * asm));
    c.save(); c.translate(x, y); c.rotate(ang); c.lineJoin = 'round';
    for (let k = 0; k < F.length; k++) { const pts = F[k][0], tone = F[k][1], u = o.asm == null ? 1 : cl((asm - k * 0.045) / 0.55), e = eo(u); if (u <= 0) continue;
      let mx = 0, my = 0; for (const p of pts) { mx += p[0]; my += p[1]; } mx /= pts.length; my /= pts.length;
      c.save(); if (u < 1) { const b = Math.atan2(my, mx + 0.5) + (o.spin || 0) + k * 1.3, R = (1 - e) * 1.25; c.translate((Math.cos(b) * R) * s, (Math.sin(b) * R) * s); c.translate(mx * s, my * s); c.rotate((1 - e) * 4 * (k % 2 ? 1 : -1)); c.translate(-mx * s, -my * s); }
      c.globalAlpha = a * (0.25 + 0.65 * e); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0] * s, p[1] * s) : c.moveTo(p[0] * s, p[1] * s))); c.closePath(); c.fillStyle = tones[tone]; c.fill();
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * e * 0.9; c.strokeStyle = o.gold && (tone === 0 || tone === 2) ? P.gold : P.cyan; c.lineWidth = Math.max(1, s * 0.05); c.stroke(); c.restore(); }
    // the ridge and a glint on the tip
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * asm; c.strokeStyle = P.white; c.lineWidth = Math.max(1, s * 0.045); c.beginPath(); c.moveTo(0, 0); c.lineTo(-s * 0.98, 0); c.moveTo(-s * 0.62, -s * 0.4); c.lineTo(-s * 0.5, 0); c.lineTo(-s * 0.62, s * 0.4); c.stroke();
    c.restore(); K.glow(c, x, y, s * 0.55, P.white, 0.75 * a * asm);
  }
  /* a lightning arrow: head tip at (hx, hy) pointing along ang, len px long, hs the head's size: a white-hot shaft in a
     cyan-violet haze and three streaming filaments in place of feathers */
  function arrow(c, hx, hy, ang, len, hs, a, t, seed, o) {
    if (!(a > 0.01)) return; o = o || {}; const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, tx = hx - dx * len, ty = hy - dy * len, bx = hx - dx * hs * 0.6, by = hy - dy * hs * 0.6;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 0; i < 2; i++) { const u = (i + 0.5) / 2; K.glow(c, tx + (bx - tx) * u, ty + (by - ty) * u, hs * 0.7, P.blue, 0.16 * a); }
    c.beginPath(); c.moveTo(tx, ty); c.lineTo(bx, by); c.globalAlpha = 0.3 * a; c.strokeStyle = P.violet; c.lineWidth = Math.max(2, hs * 0.26); c.stroke(); c.globalAlpha = 0.75 * a; c.strokeStyle = P.cyan; c.lineWidth = Math.max(1.2, hs * 0.1); c.stroke(); c.globalAlpha = a; c.strokeStyle = P.white; c.lineWidth = Math.max(0.8, hs * 0.045); c.stroke();
    // the three filaments trailing off the tail, rippling
    const FL = len * (o.flen || 0.5), cols = [P.violet, P.cyan, P.ice];
    for (let k = 0; k < 3; k++) { c.beginPath(); for (let j = 0; j <= 7; j++) { const u = j / 7, sp = (k - 1) * hs * 0.42 * Math.pow(u, 0.7) + Math.sin(u * 7 - t * 26 + k * 2.1 + seed) * hs * 0.16 * u, px = tx - dx * FL * u + nx * sp, py = ty - dy * FL * u + ny * sp; j ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.globalAlpha = (o.fa || 0.85) * a; c.strokeStyle = cols[k]; c.lineWidth = Math.max(1, hs * 0.06); c.stroke(); }
    // the nock: a bright bead
    c.globalAlpha = a; c.fillStyle = P.white; c.beginPath(); c.arc(tx, ty, Math.max(1.2, hs * 0.09), 0, TAU); c.fill(); c.restore();
    crystalHead(c, hx, hy, ang, hs, a, o);
  }

  /* ---------- the bow ---------- */
  /* a point on a limb in the bow's frame: p along the shot (the grip at 0, the string behind it), q along the limb;
     s 0 at the grip .. 1 at the tip, sd the side (+1 / -1), d how far it is drawn (bends the limbs and pulls the tips
     in), the tips recurving toward the target */
  function limbPQ(Lb, d, s, sd) { return [-Lb * (0.3 + 0.16 * d) * s * s + Lb * 0.14 * Math.pow(Math.max(0, (s - 0.76) / 0.24), 2), sd * Lb * s * (1 - 0.1 * d * s * s)]; }
  /* the frame: G the grip (screen), (ux, uy) the shot's screen direction, v the limb axis; sc / sh / rot: a contour's
     scale, its shift ahead of the bow and its turn about the grip */
  function bowXY(B, p, q, sc, sh, rot) { q *= sc || 1; p += sh || 0; if (rot) { const c0 = Math.cos(rot), s0 = Math.sin(rot), p2 = p * c0 - q * s0; q = p * s0 + q * c0; p = p2; } return [B.G[0] + B.ux * p + B.vx * q, B.G[1] + B.uy * p + B.vy * q]; }
  const tipPQ = (Lb, d) => limbPQ(Lb, d, 1, 1);
  /* one limb from s0 to s1: a translucent deep-blue volume, a soft blue bloom, three layered currents flowing out to the
     tip (violet, cyan and a dashed white-hot core), a bright lit back edge facing the target and a violet belly */
  function limb(c, B, d, s0, s1, sd, t, a) {
    if (s1 - s0 < 0.02 || !(a > 0.01)) return null; const Lb = B.Lb, n = 12, C_ = [], W = [], N = [];
    for (let i = 0; i < n; i++) { const s = s0 + (s1 - s0) * i / (n - 1), pq = limbPQ(Lb, d, s, sd); C_.push(bowXY(B, pq[0], pq[1])); W.push(Lb * (0.15 * (1 - s) + 0.035) * (s > 0.88 ? 1 - (s - 0.88) * 4 : 1)); }
    for (let i = 0; i < n; i++) { const p0 = C_[Math.max(0, i - 1)], p1 = C_[Math.min(n - 1, i + 1)], tx = p1[0] - p0[0], ty = p1[1] - p0[1], L = Math.hypot(tx, ty) || 1; N.push([-ty / L, tx / L]); }
    const mid = Math.floor(n / 2), bk = N[mid][0] * B.ux + N[mid][1] * B.uy > 0 ? 1 : -1;   // which side faces the target
    const E1 = [], E2 = []; for (let i = 0; i < n; i++) { E1.push([C_[i][0] + N[i][0] * W[i] * 0.5 * bk, C_[i][1] + N[i][1] * W[i] * 0.5 * bk]); E2.push([C_[i][0] - N[i][0] * W[i] * 0.5 * bk, C_[i][1] - N[i][1] * W[i] * 0.5 * bk]); }
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i += 2) K.glow(c, C_[i][0], C_[i][1], W[i] * 3.4 + Lb * 0.08, P.blue, 0.4 * a);
    c.globalCompositeOperation = 'source-over'; c.beginPath(); pathOf(c, E1); for (let i = n - 1; i >= 0; i--) c.lineTo(E2[i][0], E2[i][1]); c.closePath(); c.globalAlpha = 0.6 * a; c.fillStyle = P.night; c.fill();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * a; c.fillStyle = P.blue; c.fill();
    for (let k = -1; k <= 1; k++) { c.beginPath(); for (let i = 0; i < n; i++) { const s = i / (n - 1), o = (k * 0.27 + Math.sin(s * 15 - t * 19 + k * 2.1) * 0.11) * W[i]; i ? c.lineTo(C_[i][0] + N[i][0] * o, C_[i][1] + N[i][1] * o) : c.moveTo(C_[i][0] + N[i][0] * o, C_[i][1] + N[i][1] * o); }
      if (k === 0) { c.setLineDash([Lb * 0.09, Lb * 0.05]); c.lineDashOffset = -t * Lb * 1.4; c.globalAlpha = a; c.strokeStyle = P.white; c.lineWidth = Math.max(1.2, Lb * 0.014); c.stroke(); c.setLineDash([]); }
      else { c.globalAlpha = 0.8 * a; c.strokeStyle = k > 0 ? P.cyan : P.violet; c.lineWidth = Math.max(1.1, Lb * 0.012); c.stroke(); } }
    c.beginPath(); pathOf(c, E1); c.globalAlpha = 0.95 * a; c.strokeStyle = P.ice; c.lineWidth = Math.max(1.2, Lb * 0.013); c.stroke();
    c.beginPath(); pathOf(c, E2); c.globalAlpha = 0.7 * a; c.strokeStyle = P.violet; c.lineWidth = Math.max(1.4, Lb * 0.018); c.stroke();
    c.restore(); const e = C_[n - 1]; K.glow(c, e[0], e[1], Lb * 0.12, P.ice, 0.8 * a); return e;
  }
  /* a contour: a thin glowing outline of a limb, scaled, shifted ahead and turned (the layered bows) */
  function contour(c, B, d, s1, sd, sc, sh, rot, col, a) { if (!(a > 0.01) || s1 < 0.02) return null; const pts = []; for (let i = 0; i <= 10; i++) { const pq = limbPQ(B.Lb, d, s1 * i / 10, sd); pts.push(bowXY(B, pq[0], pq[1], sc, sh, rot)); }
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pathOf(c, pts); c.globalAlpha = 0.3 * a; c.strokeStyle = col; c.lineWidth = Math.max(3, B.Lb * 0.05); c.stroke(); c.globalAlpha = 0.85 * a; c.lineWidth = Math.max(1, B.Lb * 0.012); c.strokeStyle = P.white; c.stroke(); c.restore(); return pts[10]; }
  /* the grip: a faceted crystal along the limb axis with a gold glint */
  function grip(c, B, s, a, t) { if (!(a > 0.01)) return; const [x, y] = B.G, ang = Math.atan2(B.vy, B.vx); K.glow(c, x, y, s * 2.6, P.cyan, 0.5 * a); c.save(); c.translate(x, y); c.rotate(ang); const tones = TONE(), w = s * 0.42;
    const F = [[[[0, 0], [-s, 0], [0, -w]], 0], [[[0, 0], [0, -w], [s, 0]], 1], [[[0, 0], [s, 0], [0, w]], 2], [[[0, 0], [0, w], [-s, 0]], 3]];
    for (const [pts, tone] of F) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.globalAlpha = 0.9 * a; c.fillStyle = tones[tone]; c.fill(); }
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.strokeStyle = P.gold; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-s, 0); c.lineTo(0, -w); c.lineTo(s, 0); c.lineTo(0, w); c.closePath(); c.stroke(); c.restore(); K.glow(c, x, y, s * 0.6, P.gold, (0.5 + 0.3 * Math.sin(t * 9)) * a); }

  /* ================= 7. Heaven's Bow ================= */
  U.heavensbow = (C, h) => { H = h; K = TK.bind(H); P = K.P;
    const me = H.me, ev = K.evo(C), a0 = C.a, ux = Math.cos(a0), uy = Math.sin(a0), sg = ux >= 0 ? 1 : -1;
    const NS = [3, 4, 4, 5, 6, 6, 9][ev - 1], GS = ev >= 6 ? 3 : NS, NG = Math.ceil(NS / GS), NC = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, BRAID = ev >= 7 ? 3 : ev >= 4 ? 2 : 0, CUR = ev >= 4;
    const LB = 1.8 + 0.06 * (ev - 1), OFF = lerp(1.35, 1.9, Math.abs(uy)), ZG = lerp(LB * 0.95, 0.55, Math.abs(uy)), BEHIND = uy < -0.35;
    const D = C.base * C.K * K.evoK(C), smallD = D * 5.6 / NS, finalD = D * 8.4;
    // the timeline: the bow forms, NG draws of a fan each (a group of three at a time from stage 6), then the final draw
    const G0 = 0.72, GD = NG > 1 ? 0.46 : 0.7, DR = NG > 1 ? 0.26 : 0.44, STEP = NG > 1 ? 0.06 : 0.085;
    const groups = []; for (let g = 0; g < NG; g++) { const st = G0 + g * GD, m = Math.min(GS, NS - g * GS), sp = m >= 5 ? 0.17 : 0.21, arr = []; for (let i = 0; i < m; i++) arr.push({ ang: a0 + (i - (m - 1) / 2) * sp * (g % 2 ? -1 : 1), rel: st + DR + 0.03 + i * STEP, i, fired: false }); groups.push({ st, m, arr, end: st + DR + 0.03 + (m - 1) * STEP }); }
    const lastRel = groups[NG - 1].end, FC0 = lastRel + 0.22, FCD = ev >= 7 ? 1.05 : 0.9, FR = FC0 + FCD, DIS0 = FR + 0.32, DISD = 0.75, END = DIS0 + DISD + 0.25;
    const HS = (0.3 + 0.01 * ev), HB = 0.62 + 0.06 * ev;   // head sizes (tiles): small arrows, the final one
    H.X.banner("HEAVEN'S BOW", '', C.col, 1.4); H.X.sfx.hum();
    // where the arrows go: each one picks the monster nearest its own line
    const pick = ang => { let best = null, bs = 1e9; for (const m of H.living()) { const dx = m.x - me.x, dy = m.y - me.y, d = Math.hypot(dx, dy); if (d > 10 || d < 0.3) continue; const da = Math.abs(H.wrap(Math.atan2(dy, dx) - ang)); if (da > 0.9) continue; const sc = da * 3 + d * 0.08 + (m._hbAim || 0) * 0.6; if (sc < bs) { bs = sc; best = m; } } if (best) best._hbAim = (best._hbAim || 0) + 1; return best; };
    // how far the great arrow can fly before a wall
    const gripW = () => [me.x + ux * OFF, me.y + uy * OFF];
    const reach = (x, y) => { let L = 0.3; while (L < 11 && !H.X.blocked(x + ux * L, y + uy * L, 0.1)) L += 0.25; return L; };
    const shots = [], imps = []; let fin = null, recoil = 0;
    const dAt = t => { let d = 0; for (const g of groups) { if (t < g.st) continue; d = Math.max(d, t < g.st + DR ? eo((t - g.st) / DR) : t < g.end + 0.02 ? 1 : 1 - cl((t - g.end - 0.02) / 0.09)); }
      if (t > FC0) d = Math.max(d, t < FR ? 1.12 * eio(cl((t - FC0) / FCD)) : 1.12 * (1 - cl((t - FR) / 0.07))); return d; };
    const vibAt = t => { let v = 0; for (const g of groups) for (const ar of g.arr) if (t > ar.rel) v += Math.exp(-(t - ar.rel) * 12) * Math.sin((t - ar.rel) * 70) * 0.4; if (t > FR) v += Math.exp(-(t - FR) * 7) * Math.sin((t - FR) * 55); return v; };
    const frame = (T, t) => { const [gx, gy] = gripW(), rc = recoil, G = [H.sx(gx) - ux * rc * LB * T * 0.22, H.sy(gy) - ZG * T - uy * rc * LB * T * 0.22]; return { G, ux, uy, vx: uy, vy: -ux, Lb: LB * T }; };
    const release = (ar, T) => { ar.fired = true; const [gx, gy] = gripW(), tg = pick(ar.ang); shots.push({ x: gx + Math.cos(ar.ang) * 0.4, y: gy + Math.sin(ar.ang) * 0.4, z: ZG, z0: ZG, hd: ar.ang, tg, d0: tg ? Math.hypot(tg.x - gx, tg.y - gy) : 8, tr: [], gone: 0, dist: 0, seed: ar.i * 1.7 + ar.ang });
      recoil = Math.max(recoil, 0.3); K.sparks(gx - ux * 0.2, gy - uy * 0.2 - ZG, 4, 5); H.X.sfx.crack(); };
    const F = H.add({ life: END,
      update(dt, f) { const t = f.t, T = H.X.Tz(); recoil = Math.max(0, recoil - dt * 3.2);
        // the pet braces against the draw and is thrown back by the release
        const d = dAt(t); if (t < DIS0) { if (Math.abs(ux) > 0.2) me.face = sg; me.sq = Math.max(me.sq, 0.45 * Math.min(1, d) + 0.9 * recoil); me.tilt = -sg * (0.08 * Math.min(1, d) + 0.3 * recoil); }
        const [gx, gy] = gripW();
        if (t < 0.6) { for (const s of [-1, 1]) K.aura(me.x - uy * s * 0.55 + ux * 0.3, me.y + ux * s * 0.55 + uy * 0.3, 0.3, dt, 16, 0); }
        if (t > 0.4 && t < DIS0 + DISD) K.aura(gx, gy - ZG, 0.6, dt, t > FC0 ? 18 : 7, 0);
        if (t > FC0 && t < FR) { const u = (t - FC0) / FCD; if (Math.random() < dt * 30 * H.Q()) { const b = Math.random() * TAU, r = 1.4 * (1 - u) + 0.2; H.P({ kind: 'spark', x: gx + Math.cos(b) * r, y: gy + Math.sin(b) * r * 0.6 - ZG, vx: -Math.cos(b) * r * 4, vy: -Math.sin(b) * r * 2.4, g: 0, drag: 2, life: 0.25, max: 0.25, size: 2, color: Math.random() < 0.3 ? P.gold : P.ice }); } }
        for (const g of groups) for (const ar of g.arr) if (!ar.fired && t >= ar.rel) release(ar, T);
        // the small arrows: they curve onto the monster nearest their line, dropping to its height
        for (const s of shots) { if (s.gone) { s.gone += dt; continue; } const sp = 15 * dt;
          if (s.tg && !s.tg.dead) { const want = Math.atan2(s.tg.y - s.y, s.tg.x - s.x); s.hd += Math.max(-7 * dt, Math.min(7 * dt, H.wrap(want - s.hd))); }
          s.x += Math.cos(s.hd) * sp; s.y += Math.sin(s.hd) * sp; s.dist += sp; const rem = s.tg && !s.tg.dead ? Math.hypot(s.tg.x - s.x, s.tg.y - s.y) : Math.max(0, s.d0 - s.dist); s.z = 0.45 + (s.z0 - 0.45) * cl(rem / Math.max(0.5, s.d0));
          s.tr.push([s.x, s.y, s.z]); if (s.tr.length > 8) s.tr.shift();
          let hit = null; for (const m of H.living()) if (Math.hypot(m.x - s.x, m.y - s.y) < m.r + 0.28) { hit = m; break; }
          if (hit) { H.X.hitMon(hit, smallD, C.dmgO({ kb: 1.5, stun: hit.boss ? 0.1 : 0.3 })); s.gone = 0.001; imps.push({ x: s.x, y: s.y, z: s.z, t, big: 0, s: s.seed }); K.zapAt(s.x, s.y - s.z, 1); K.sparks(s.x, s.y - s.z, 6, 7); H.X.shake(3, 0.08); }
          else if (s.dist > 10 || H.X.blocked(s.x, s.y, 0.05)) { s.gone = 0.001; imps.push({ x: s.x, y: s.y, z: s.z, t, big: 0, s: s.seed }); K.sparks(s.x, s.y - s.z, 5, 4); } }
        // the great arrow: it pierces the whole line
        if (!fin && t >= FR) { const L = reach(gx, gy); fin = { x0: gx, y0: gy, L, dist: 0, hit: new Set(), t0: t, done: 0 }; recoil = 1;
          H.X.flash(0.22, P.ice); H.X.shake(11, 0.3); H.X.hitstop(0.06); H.X.sfx.crash(); H.X.light(gx, gy, 5, 0.4); K.sparks(gx - ux * 0.5, gy - uy * 0.5 - ZG, 14, 8); K.goldSparks(gx, gy - ZG, 8, 6); }
        if (fin && !fin.done) { const d0 = fin.dist; fin.dist = Math.min(fin.L, fin.dist + 24 * dt);
          for (const m of H.living()) { if (fin.hit.has(m)) continue; const rx = m.x - fin.x0, ry = m.y - fin.y0, al = rx * ux + ry * uy, of = Math.abs(-rx * uy + ry * ux); if (al > d0 - m.r - 0.2 && al < fin.dist + m.r && of < 0.75 + m.r) { fin.hit.add(m); H.X.hitMon(m, finalD, C.dmgO({ kb: 3.5, stun: m.boss ? 0.4 : 1.0 })); K.zapAt(m.x, m.y - 0.5, 1.4); K.sparks(m.x, m.y - 0.5, 12, 9); K.goldSparks(m.x, m.y - 0.5, 5, 6); H.X.shake(5, 0.1); imps.push({ x: m.x, y: m.y, z: 0.5, t, big: 1, s: m.x }); } }
          if (fin.dist >= fin.L) { fin.done = t; const ex = fin.x0 + ux * fin.L, ey = fin.y0 + uy * fin.L; imps.push({ x: ex, y: ey, z: 0.55, t, big: 2, s: 3 }); K.zapAt(ex, ey - 0.5, 2); K.sparks(ex, ey - 0.5, 16, 8); K.motes(ex, ey - 0.5, 10); H.X.light(ex, ey, 4, 0.35); H.X.sfx.crack(); } }
        // the bow comes apart from its tips inward, shedding sparks
        if (t > DIS0 && t < DIS0 + DISD && f._tips) for (const p of f._tips) if (Math.random() < dt * 40 * H.Q()) { const w = toW(p[0], p[1], T); H.P({ kind: Math.random() < 0.5 ? 'spark' : 'ember', x: w[0], y: w[1], vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2, g: -0.5, drag: 1, life: 0.5, max: 0.5, size: 2.2, color: Math.random() < 0.5 ? P.cyan : P.violet }); } },
      drawUnder(c, f, X, Y, T) { const t = f.t, k = Math.min(1, f.life / 0.4), [gx, gy] = gripW();
        // the floor lit beneath the bow, and the impacts' light (violet, fading; nothing dark)
        K.floorLight(c, H.sx(gx), H.sy(gy), T * LB * (1.2 + 0.4 * (dAt(t) > 0.5 ? 1 : 0)), 0.4 * k * cl(t / 0.6) * (1 - cl((t - DIS0) / DISD)));
        if (t < 0.7) for (const s of [-1, 1]) K.floorLight(c, H.sx(me.x - uy * s * 0.55 + ux * 0.3), H.sy(me.y + ux * s * 0.55 + uy * 0.3), T * 0.7, 0.7 * (1 - t / 0.7), P.cyan);
        for (const im of imps) { const u = (t - im.t) / (im.big ? 1.0 : 0.6); if (u < 0 || u > 1) continue; const IX = H.sx(im.x), IY = H.sy(im.y); K.floorLight(c, IX, IY, T * (im.big ? 1.6 : 0.8), 0.6 * (1 - u), P.violet); K.shockRing(c, IX, IY, T * (0.3 + (im.big ? 1.4 : 0.7) * eo(u)), 0.8 * (1 - u), t, im.big ? 3 : 0); }
        if (fin) { const wa = fin.done ? 1 - cl((t - fin.done) / 0.9) : 1; if (wa > 0) { const p0 = [H.sx(fin.x0), H.sy(fin.y0)], p1 = [H.sx(fin.x0 + ux * fin.dist), H.sy(fin.y0 + uy * fin.dist)]; K.scar(c, K.path(p0[0], p0[1], p1[0], p1[1], 7, T * 0.08, 12), 0.7 * wa); } }
        if (BEHIND) this._bow(c, f, T, t, k); },
      draw(c, f, X, Y, T) { const t = f.t, k = Math.min(1, f.life / 0.4);
        if (!BEHIND) this._bow(c, f, T, t, k);
        // the small arrows in flight, each with its tapered plasma trail
        for (const s of shots) { if (s.gone > 0.3) continue; const ga = s.gone ? 1 - s.gone / 0.3 : 1; const tr = s.tr.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]); if (tr.length > 1) K.ribbon(c, tr, T * 0.16, 0.9 * ga);
          if (!s.gone && tr.length > 1) { const p = tr[tr.length - 1], q = tr[Math.max(0, tr.length - 3)]; arrow(c, p[0], p[1], Math.atan2(p[1] - q[1], p[0] - q[0]), LB * T * 0.55, HS * T, 1, t, s.seed, { flen: 0.6 }); } }
        // impact flares: a white flash with a few forks
        for (const im of imps) { const u = (t - im.t) / 0.35; if (u < 0 || u > 1) continue; const IX = H.sx(im.x), IY = H.sy(im.y) - im.z * T, r = T * (im.big ? 1.3 : 0.6); K.glow(c, IX, IY, r * (1 + u), P.cyan, 0.8 * (1 - u)); K.glow(c, IX, IY, r * 0.5, P.white, 1 - u); for (let j = 0; j < (im.big ? 3 : 2); j++) { const b = im.s * 3 + j * 2.4; zig(c, IX, IY, IX + Math.cos(b) * r * 1.3, IY + Math.sin(b) * r, K.seed(t, j), r * 0.25, 1.3, 1 - u); } }
        // the great arrow: a braided electrical wake behind its immense head
        if (fin) { const wa = fin.done ? 1 - cl((t - fin.done) / 0.8) : 1; if (wa > 0.01) { const zAt = d => ZG + (0.55 - ZG) * cl(d / 2.5), d0 = Math.max(0, fin.dist - 7.5), pts = []; for (let j = 0; j <= 24; j++) { const d = d0 + (fin.dist - d0) * j / 24; pts.push([H.sx(fin.x0 + ux * d), H.sy(fin.y0 + uy * d) - zAt(d) * T, d]); }
            const q = pts.map(p => [p[0], p[1]]); K.ribbon(c, q, T * 0.55, 0.85 * wa, ev >= 7); K.ribbon(c, q, T * 0.25, wa);
            const n = q.length, sx_ = q[n - 1][0] - q[0][0], sy_ = q[n - 1][1] - q[0][1], sl = Math.hypot(sx_, sy_) || 1, nx = -sy_ / sl, ny = sx_ / sl;
            for (let b = 0; b < BRAID; b++) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let j = 1; j < n; j++) { const ph0 = pts[j - 1][2] * 2.4 - t * 9 + b * TAU / BRAID, ph1 = pts[j][2] * 2.4 - t * 9 + b * TAU / BRAID, tp = cl((fin.dist - pts[j][2]) / 1.2) * (j / n), A = T * 0.42 * tp;
                c.globalAlpha = wa * (0.35 + 0.55 * (0.5 + 0.5 * Math.cos(ph1))) * (j / n); c.strokeStyle = b === 0 ? P.ice : b === 1 ? P.violet : P.gold; c.lineWidth = Math.max(1, T * 0.05 * (0.6 + 0.4 * Math.cos(ph1)));
                c.beginPath(); c.moveTo(q[j - 1][0] + nx * Math.sin(ph0) * A, q[j - 1][1] + ny * Math.sin(ph0) * A); c.lineTo(q[j][0] + nx * Math.sin(ph1) * A, q[j][1] + ny * Math.sin(ph1) * A); c.stroke(); } c.restore(); }
            if (!fin.done) { const p = q[n - 1], pp = q[n - 3]; const ang = Math.atan2(p[1] - pp[1], p[0] - pp[0]); arrow(c, p[0], p[1], ang, LB * T * 1.25, HB * T, 1, t, 9, { big: ev >= 4, gold: true, flen: 0.35 }); for (let j = 0; j < 2; j++) zig(c, p[0] - Math.cos(ang) * T, p[1] - Math.sin(ang) * T, p[0] - Math.cos(ang + (j ? 0.6 : -0.6)) * T * 2.2, p[1] - Math.sin(ang + (j ? 0.6 : -0.6)) * T * 2.2, K.seed(t, j + 5), T * 0.3, 1.5, 0.8); } } } },
      /* the bow itself, its strings, the contours and the arrows on it */
      _bow(c, f, T, t, k) { const B = frame(T, t), Lb = B.Lb, d = dAt(t);
        const form = cl((t - 0.24) / 0.44), dis = cl((t - DIS0) / DISD), s1 = Math.min(eo(form), 1 - dis), a = k * (1 - sm(0.8, 1, dis));
        // the two streams rising beside the pet to the grip
        if (t < 0.8) { const PX = H.sx(me.x), PY = H.sy(me.y); for (const s of [-1, 1]) { const F0 = [PX - uy * s * 0.55 * T + ux * 0.3 * T, PY + ux * s * 0.55 * T * 0.6 + uy * 0.3 * T], u = eo(cl(t / 0.4)), fa = 1 - cl((t - 0.5) / 0.3), pts = [];
            for (let j = 0; j <= 14; j++) { const v = j / 14 * u, sw = Math.sin(v * 7 + t * 6 + s) * T * 0.25 * (1 - v); pts.push([lerp(F0[0], B.G[0], v) + sw * s, lerp(F0[1], B.G[1], eo(v)) - Math.sin(v * Math.PI) * T * 0.4]); }
            K.ribbon(c, pts, T * 0.22, fa); if (u < 1) K.glow(c, pts[14][0], pts[14][1], T * 0.5, P.ice, 0.9 * fa); else zig(c, F0[0], F0[1], B.G[0], B.G[1], K.seed(t, s + 3), T * 0.4, 1.2, 0.6 * fa); } }
        if (s1 <= 0.01 || a <= 0.01) return;
        const align = NC < 3 ? 1 : eio(cl((t - FC0) / (FCD * 0.75))), mis = (1 - align) * 0.22, cA = NC > 1 ? a * cl((t - (NC > 2 ? FC0 - 0.1 : G0)) / 0.4) : 0;
        // the contours ahead of the bow (a second at Adept, three layered ones aligning for the last shot at Celestial)
        const ctips = []; if (cA > 0) for (let kk = 1; kk < NC; kk++) { const sc = 1 + 0.1 * kk, sh = Lb * 0.075 * kk, rot = mis * (kk % 2 ? 1 : -1), col = kk === 1 ? P.cyan : P.gold; for (const sd of [-1, 1]) { const e = contour(c, B, d, s1, sd, sc, sh, rot, col, cA * (0.75 + 0.25 * Math.sin(t * 7 + kk))); if (e) ctips.push(e); } }
        const e1 = limb(c, B, d, 0, s1, 1, t, a), e2 = limb(c, B, d, 0, s1, -1, t, a); f._tips = [e1, e2].filter(Boolean);
        grip(c, B, Lb * 0.13, a * cl(t / 0.4) * (1 - sm(0.7, 0.95, dis)), t);
        // the string: a thin white bolt from tip to tip, pulled back at the nock (and the contours' strings at Celestial, merging)
        const tp = tipPQ(Lb, d), vib = vibAt(t) * Lb * 0.05, nockP = tp[0] - Lb * 0.42 * d, nock = bowXY(B, nockP, vib), strA = a * cl((t - 0.6) / 0.1) * (form >= 1 ? 1 : 0) * (dis > 0 ? 1 - dis * 2 : 1);
        if (strA > 0.01) { const sd = K.seed(t, 1, 24); K.bolt(c, K.path(e1[0], e1[1], nock[0], nock[1], sd, 2, 6), 1.2, strA); K.bolt(c, K.path(nock[0], nock[1], e2[0], e2[1], sd + 9, 2, 6), 1.2, strA);
          if (NC > 2 && align < 1) for (let j = 0; j + 1 < ctips.length; j += 2) { zig(c, ctips[j + 1][0], ctips[j + 1][1], nock[0], nock[1], sd + j, 2, 0.9, strA * (1 - align) * 0.9, P.gold); zig(c, nock[0], nock[1], ctips[j][0], ctips[j][1], sd + j + 3, 2, 0.9, strA * (1 - align) * 0.9, P.gold); }
          K.glow(c, nock[0], nock[1], T * 0.35 * (0.5 + d), P.ice, 0.7 * strA * Math.min(1, d + 0.2)); }
        if (strA <= 0.01) return;
        // the small arrows: they materialise along the string and spread into a fan converging on the nock
        const stringAt = qq => { const pq = [tp[0], qq]; return bowXY(B, pq[0], pq[1]); };
        for (const g of groups) { if (t < g.st - 0.05 || t > g.end + 0.05) continue;
          for (const ar of g.arr) { if (ar.fired) continue; const u = cl((t - g.st - ar.i * 0.03) / (DR * 0.9)), conv = eo(cl(u * 1.25 - 0.15)), ap = cl(u * 3);
            const sp = stringAt((ar.i - (g.m - 1) / 2) / Math.max(1, g.m) * 1.5 * Lb), tail = [lerp(sp[0], nock[0], conv), lerp(sp[1], nock[1], conv)], da = (ar.ang - a0) * conv, dx = ux * Math.cos(da) - uy * Math.sin(da), dy = ux * Math.sin(da) + uy * Math.cos(da), len = LB * T * 0.95;
            const gd = petGuard(tail[0] + dx * len * 0.5, tail[1] + dy * len * 0.5, T); arrow(c, tail[0] + dx * len, tail[1] + dy * len, Math.atan2(dy, dx), len, HS * T, ap * gd * a, t, ar.i, { flen: 0.22, fa: 0.5 }); if (u < 0.35) K.glow(c, sp[0], sp[1], T * 0.4, P.white, (1 - u / 0.35) * 0.9); } }
        // the final arrow, its head assembling from turning facets, the charge running from the tips into it
        if (t > FC0 - 0.05 && t < FR) { const u = cl((t - FC0) / FCD), ap = cl(u * 4), len = LB * T * 1.12, hx = nock[0] + ux * len, hy = nock[1] + uy * len, gd = petGuard(nock[0] + ux * len * 0.4, nock[1] + uy * len * 0.4, T);
          arrow(c, hx, hy, a0, len, HB * T * (ev >= 4 ? 1 : 0.5 + 0.5 * eo(u)), ap * a * Math.max(0.55, gd), t, 9, { big: ev >= 4, gold: true, asm: ev >= 4 ? cl(u * 1.25) : null, spin: t * 5, flen: 0.4 });
          if (CUR) for (const e of [e1, e2]) { for (let j = 0; j < 3; j++) { const v = (t * 1.6 + j / 3) % 1, w = v < 0.5 ? v * 2 : 1, p = v < 0.5 ? [lerp(e[0], nock[0], w), lerp(e[1], nock[1], w)] : [lerp(nock[0], hx, (v - 0.5) * 2), lerp(nock[1], hy, (v - 0.5) * 2)]; K.glow(c, p[0], p[1], T * 0.28, P.ice, 0.9 * ap * a); }
            zig(c, e[0], e[1], hx - ux * T * 0.4, hy - uy * T * 0.4, K.seed(t, e === e1 ? 7 : 8, 14), T * 0.5, 1.2, (0.4 + 0.4 * u) * ap * a, P.violet); }
          if (u > 0.8) K.glow(c, hx, hy, HB * T * 2.5, P.white, (u - 0.8) * 3 * a); } } });
    return F;
  };

  /* ================= 8. Thunder Lotus ================= */
  /* the three curves of one petal (left edge, spine, right edge; screen px) for a petal at floor angle phi on the ring
     r0 round (CX, CY), Lp long, Wp its half-width, th its lean out from upright, curl how far its tip bends back in,
     spread how wide it is (narrow in the bud), cup how far its edges curve inward; with which face shows and how lit
     each half is (the light from the upper left, a little in front) */
  const VIEW = [0, 0.6, 0.8], LIGHT = (() => { const v = [-0.55, -0.25, 0.8], l = Math.hypot(v[0], v[1], v[2]); return v.map(x => x / l); })();
  const PN = 9, WID = []; for (let i = 0; i < PN; i++) { const s = i / (PN - 1); WID.push(0.24 * (1 - s) + Math.pow(Math.sin(Math.PI * Math.min(1, s)), 0.75) * (1 - 0.2 * s)); }
  function petalGeo(CX, CY, T, GY, phi, r0, Lp, Wp, th, curl, spread, cup) {
    const cp = Math.cos(phi), sp = Math.sin(phi), b1r = r0 + Lp * 0.55 * Math.sin(th), b1z = Lp * 0.55 * Math.cos(th), b2r = b1r + Lp * 0.5 * Math.sin(th - curl), b2z = b1z + Lp * 0.5 * Math.cos(th - curl);
    const L = [], M = [], R = []; let tipW = null;
    for (let i = 0; i < PN; i++) { const s = i / (PN - 1), s1 = 1 - s, rho = s1 * s1 * r0 + 2 * s1 * s * b1r + s * s * b2r, z = 2 * s1 * s * b1z + s * s * b2z, dr0 = 2 * s1 * (b1r - r0) + 2 * s * (b2r - b1r), dz0 = 2 * s1 * b1z + 2 * s * (b2z - b1z), dl = Math.hypot(dr0, dz0) || 1, nr = -dz0 / dl, nz = dr0 / dl, w = Wp * WID[i];
      for (let q = -1; q <= 1; q++) { const lat = q * w * spread, inn = cup * w * q * q, rr = rho + nr * inn, zz = z + nz * inn, dx = cp * rr - sp * lat, dy = sp * rr + cp * lat, p = [CX + dx * T, CY + dy * T * GY - zz * T]; (q < 0 ? L : q > 0 ? R : M).push(p); }
      if (i === PN - 1) tipW = [rho, z]; }
    // the inner face's normal at the middle of the petal, the halves tilted by the cup
    const sm_ = 0.5, sm1 = 0.5, dr = 2 * sm1 * (b1r - r0) + 2 * sm_ * (b2r - b1r), dz = 2 * sm1 * b1z + 2 * sm_ * (b2z - b1z), dl = Math.hypot(dr, dz) || 1, nr = -dz / dl, nz = dr / dl, Ni = [cp * nr, sp * nr, nz];
    const faceIn = Ni[0] * VIEW[0] + Ni[1] * VIEW[1] + Ni[2] * VIEW[2] > 0, sg = faceIn ? 1 : -1, tx = -sp, ty = cp;
    const litOf = k => { const n = [sg * Ni[0] + k * tx * 0.6, sg * Ni[1] + k * ty * 0.6, sg * Ni[2]], l = Math.hypot(n[0], n[1], n[2]) || 1; return Math.max(0, (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / l); };
    const midR = 0.25 * r0 + 0.5 * b1r + 0.25 * b2r;
    return { L, M, R, faceIn, litL: litOf(faceIn ? 1 : -1), litR: litOf(faceIn ? -1 : 1), key: sp * midR, tip: M[PN - 1], tipW, phi };
  }
  /* one petal: a translucent body in two halves (the inner face bright blue, the outer face deep violet) lit by the cup,
     white-violet veins with a current flowing out through the spine, cyan edges, a small arc jumping between its ribs,
     a bead racing along an edge, and the pulses climbing it as bright bands */
  function drawPetal(c, g, t, T) {
    const a = g.a * (g.lk || 1), a0 = g.a; if (!(a > 0.01)) return; const { L, M, R } = g, body = g.body;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    if (body > 0.01) { for (let h = 0; h < 2; h++) { const E = h ? R : L, lit = h ? g.litR : g.litL; c.beginPath(); pathOf(c, E); for (let i = PN - 1; i >= 0; i--) c.lineTo(M[i][0], M[i][1]); c.closePath();
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = a0 * body * (g.faceIn ? 0.55 : 0.62); c.fillStyle = g.faceIn ? P.deep : P.night; c.fill();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = a0 * body * Math.min(1, g.faceIn ? 0.12 + 0.5 * lit : 0.06 + 0.35 * lit); c.fillStyle = g.faceIn ? P.blue : P.violet; c.fill(); if (g.glow > 0.02) { c.globalAlpha = a * body * Math.min(1, g.glow * 0.25); c.fillStyle = P.cyan; c.fill(); } } }
    c.globalCompositeOperation = 'lighter';
    // the veins: the spine and two side veins (white-violet), the spine's current flowing toward the tip
    const V1 = [], V2 = []; for (let i = 0; i < PN; i++) { V1.push([(L[i][0] + M[i][0] * 1.4) / 2.4, (L[i][1] + M[i][1] * 1.4) / 2.4]); V2.push([(R[i][0] + M[i][0] * 1.4) / 2.4, (R[i][1] + M[i][1] * 1.4) / 2.4]); }
    c.beginPath(); pathOf(c, V1); pathOf(c, V2); c.globalAlpha = a * (0.6 + 0.3 * g.glow); c.strokeStyle = P.violet; c.lineWidth = 2.2; c.stroke(); c.globalAlpha = a * (0.3 + 0.4 * g.glow); c.strokeStyle = P.white; c.lineWidth = 0.7; c.stroke();
    c.beginPath(); pathOf(c, M); c.globalAlpha = a * 0.5; c.strokeStyle = P.violet; c.lineWidth = 3.2; c.stroke(); c.setLineDash([T * 0.18, T * 0.14]); c.lineDashOffset = -t * T * 2.2 - g.seed * 7; c.globalAlpha = 0.85 * a; c.strokeStyle = P.white; c.lineWidth = 1.2; c.stroke(); c.setLineDash([]);
    // the cyan edges
    c.beginPath(); pathOf(c, L); pathOf(c, R); c.globalAlpha = a * (0.22 + 0.3 * g.glow); c.strokeStyle = P.blue; c.lineWidth = 3.4; c.stroke(); c.globalAlpha = 0.9 * a; c.strokeStyle = P.cyan; c.lineWidth = 1.3; c.stroke();
    c.restore();
    // an arc jumping between the ribs (re-grows; not every petal every moment)
    if (g.rib && body > 0.3) { const sd = K.seed(t, g.seed * 13, 9); if (K.R1(sd) < 0.6) { const s = 0.25 + 0.55 * K.R1(sd + 1.3), p = at(K.R1(sd + 2.1) < 0.5 ? V1 : V2, s), q = at(K.R1(sd + 3.7) < 0.5 ? L : R, s + 0.08); zig(c, p[0], p[1], q[0], q[1], sd, T * 0.06, 0.9, a * 0.9); } }
    // the beads racing along the edges toward the tip
    for (let e = 0; e < g.beads; e++) { const s = (t * 1.25 + g.seed * 0.37 + e * 0.5) % 1, p = at(e % 2 ? R : L, s); K.glow(c, p[0], p[1], T * 0.2, P.ice, a * 0.9 * Math.sin(s * Math.PI)); }
    // the pulses: bright bands crossing the petal on their way out to the tip
    for (const s of g.bands) { if (s <= 0 || s >= 1) continue; const pl = at(L, s), pm = at(M, s), pr = at(R, s), k = a * (1 - s * 0.35); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pl[0], pl[1]); c.quadraticCurveTo(pm[0] * 2 - (pl[0] + pr[0]) / 2, pm[1] * 2 - (pl[1] + pr[1]) / 2, pr[0], pr[1]); c.globalAlpha = 0.35 * k; c.strokeStyle = P.cyan; c.lineWidth = 6; c.stroke(); c.globalAlpha = k; c.strokeStyle = P.white; c.lineWidth = 2; c.stroke(); c.restore(); K.glow(c, pm[0], pm[1], T * 0.45, P.cyan, 0.45 * k * (g.lk || 1)); }
  }

  U.lotus = (C, h) => { H = h; K = TK.bind(H); P = K.P;
    const me = H.me, ev = K.evo(C), NR = K.lv(C, [1, 2, 3]), NP = 5 + ev, NPU = [2, 2, 2, 3, 3, 3, 4][ev - 1], FIN = ev >= 7, BRIDGE = ev >= 4, sc = Math.sqrt(C.K) * (1 + 0.02 * (ev - 1)), GY = H.GY;
    // under the monsters round the aim, never on the pet
    let cx = C.tx, cy = C.ty; { const grp = H.living().filter(m => Math.hypot(m.x - cx, m.y - cy) < 2.6); if (grp.length) { let sx = cx, sy = cy; for (const m of grp) { sx += m.x; sy += m.y; } cx = sx / (grp.length + 1); cy = sy / (grp.length + 1); }
      const dx = cx - me.x, dy = cy - me.y, d = Math.hypot(dx, dy), MIN = 2.3; if (d < MIN) { const b = d > 0.1 ? Math.atan2(dy, dx) : C.a; cx = me.x + Math.cos(b) * MIN; cy = me.y + Math.sin(b) * MIN; } const w = H.walk(cx, cy); cx = w.x; cy = w.y; }
    // the rings, outer first: [r0, length, half-width, lean when open, lean at full extent, curl when open]
    const RS = NR === 1 ? [[0.42, 1.45, 0.5, 1.05, 1.2, 0.42]] : NR === 2 ? [[0.55, 1.6, 0.48, 1.18, 1.32, 0.4], [0.28, 1.4, 0.44, 0.68, 0.86, 0.45]]
      : [[0.68, 1.55, 0.46, 1.28, 1.45, 0.36], [0.4, 1.45, 0.42, 0.82, 1.05, 0.42], [0.18, 1.9, 0.36, 0.3, 0.5, 0.5]];
    const rings = RS.map((r, j) => ({ j, r0: r[0] * sc, Lp: r[1] * sc, W: r[2] * sc, thO: r[3], thF: r[4], curlO: r[5], dir: j % 2 ? -1 : 1 }));
    const SEED = 0.42, VEIN = 0.42, RISE = 0.95, OPEN = 1.55, SPI = 0.45, OPD = 0.5, RJ = 0.22;
    const PUL = NPU === 2 ? [2.35, 2.95] : NPU === 3 ? [2.25, 2.7, 3.15] : [2.35, 2.72, 3.1, 3.55], LAST = PUL[PUL.length - 1], PEEL = LAST + 0.5, LIFE = LAST + 2.5;
    const reachOf = r => r.r0 + r.Lp * (0.55 * Math.sin(r.thO) + 0.5 * Math.sin(r.thO - r.curlO)), RH = reachOf(rings[0]) + 0.35;
    const petals = []; for (const r of rings) for (let i = 0; i < NP; i++) { const idx = r.dir > 0 ? i : NP - 1 - i; petals.push({ r, i, phi: (i + r.j * 0.5) / NP * TAU + r.j * 0.17 - Math.PI / 2, tOpen: OPEN + r.j * RJ + idx / NP * SPI, seed: i * 1.7 + r.j * 5.3 }); }
    const D = C.base * C.K * K.evoK(C), wts = PUL.map((_, i) => (i === PUL.length - 1 ? 1.5 : 1)), wsum = wts.reduce((s, w) => s + w, 0);
    // the floor: the veins the seed sends out (world offsets, jittered once), and the flower pattern left behind
    const veins = []; for (let i = 0; i < NP; i++) { const b = (i / NP) * TAU - Math.PI / 2, Rv = (rings[0].r0 + rings[0].Lp * 0.95), main = [[0, 0]]; for (let j = 1; j <= 7; j++) { const u = j / 7, o = (K.R1(i * 9.1 + j * 3.3) - 0.5) * 0.35 * Math.sin(u * Math.PI); main.push([Math.cos(b) * Rv * u - Math.sin(b) * o, Math.sin(b) * Rv * u + Math.cos(b) * o]); }
      veins.push(main); for (const s of [-1, 1]) { const p = main[3], bb = b + s * 0.65, tw = [p]; for (let j = 1; j <= 3; j++) { const u = j / 3, o = (K.R1(i * 4.7 + j + s) - 0.5) * 0.12; tw.push([p[0] + Math.cos(bb) * Rv * 0.38 * u - Math.sin(bb) * o, p[1] + Math.sin(bb) * Rv * 0.38 * u + Math.cos(bb) * o]); } veins.push(tw); } }
    const pattern = petals.map(p => { const r = p.r, ext = reachOf(r) * (0.92 + 0.08 * r.j), pts = []; for (let i = 0; i < PN; i++) { const s = i / (PN - 1), rho = r.r0 + (ext - r.r0) * s, w = r.W * WID[i] * 0.9; pts.push([Math.cos(p.phi) * rho - Math.sin(p.phi) * w, Math.sin(p.phi) * rho + Math.cos(p.phi) * w]); } for (let i = PN - 1; i >= 0; i--) { const s = i / (PN - 1), rho = r.r0 + (ext - r.r0) * s, w = r.W * WID[i] * 0.9; pts.push([Math.cos(p.phi) * rho + Math.sin(p.phi) * w, Math.sin(p.phi) * rho - Math.cos(p.phi) * w]); } return pts; });
    H.X.banner('THUNDER LOTUS', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.6;
    H.X.after(SEED, () => { H.hitArea(cx, cy, 1.3, D * 0.8, C.dmgO({ kb: 0, stun: 0.2 })); K.zapAt(cx, cy, 1.4); K.sparks(cx, cy, 14, 7); H.X.shake(5, 0.15); H.X.sfx.crack(); H.X.light(cx, cy, 3.5, 0.4); });
    H.X.after(RISE - 0.35, () => H.warn(cx, cy, RH, PUL[0] - RISE + 0.35, C.col));
    PUL.forEach((tp, k) => H.X.after(tp + 0.15, () => { const last = k === PUL.length - 1;
      H.hitArea(cx, cy, RH, D * 13.2 * wts[k] / wsum, C.dmgO({ kb: last ? 2 : 0, stun: last ? 0.6 : 0.3 })); K.zapAt(cx, cy - 0.6, last ? 2.2 : 1.4); K.sparks(cx, cy - 0.5, last ? 22 : 12, last ? 9 : 7); K.motes(cx, cy - 0.8, last ? 16 : 8);
      if (last && FIN) { K.goldSparks(cx, cy - 1, 14, 8); H.X.flash(0.18, P.ice); } H.X.shake(last ? 9 : 5, last ? 0.25 : 0.12); last ? H.X.sfx.crash() : H.X.sfx.crack(); H.X.light(cx, cy, RH + 1, 0.3); }));
    /* each petal's pose at time t: lying in its vein, rising into the bud, opening in the spiral, opening to its full
       extent at the last pulse (Celestial), then peeling back into strands */
    const pose = (p, t) => { const r = p.r, ru = eio(cl((t - RISE - r.j * 0.08) / 0.55)), ou = cl((t - p.tOpen) / OPD), oe = ou > 0 ? back(ou) : 0, fu = FIN ? sm(LAST, LAST + 0.3, t) : 0, idx = r.dir > 0 ? p.i : NP - 1 - p.i, pu = cl((t - PEEL - idx / NP * 0.25 - (NR - 1 - r.j) * 0.06) / 0.8);
      let th = lerp(1.52, 0.16 + 0.04 * r.j, ru), curl = lerp(-0.05, 0.72, ru), spread = lerp(1, 0.78, ru);
      th = lerp(th, r.thO, oe); curl = lerp(curl, r.curlO, oe); spread = lerp(spread, 1, cl(oe)); th = lerp(th, r.thF, fu); curl = lerp(curl, 0.18, fu);
      th += 0.04 * Math.sin(t * 2.6 + p.i * 0.9 + r.j) * cl(ou); th += pu * 0.9; curl -= pu * 2.4; spread *= 1 + pu * 0.7;
      return { th, curl, spread, ru, ou, pu }; };
    const geo = (f, X, Y, T) => { if (f._gT === f.t && f._gX === X && f._gY === Y) return f._G; const t = f.t, out = [], byRing = rings.map(() => []);
      for (const p of petals) { const ps = pose(p, t); if (ps.ru <= 0 || ps.pu >= 1) { byRing[p.r.j].push(null); continue; }
        const g = petalGeo(X, Y, T, GY, p.phi, p.r.r0, p.r.Lp, p.r.W, ps.th, ps.curl, ps.spread, 0.5), mid = g.M[Math.floor(PN / 2)];
        g.a = Math.min(1, ps.ru * 3) * (1 - ps.pu) * petGuard(mid[0], mid[1], T, T * 0.2) * Math.min(1, f.life / 0.4); g.body = Math.pow(1 - ps.pu, 1.6); g.seed = p.seed; g.rib = (p.i + p.r.j) % (NR > 2 ? 2 : 1) === 0; g.beads = ps.ou > 0.5 && ps.pu <= 0 ? (NR > 2 ? 1 : 2) : 0;
        // the glow and the bands: the petal's own opening pulse, the climbing pulses, the final wave through every petal
        g.bands = []; g.glow = 0; if (ps.ou > 0 && ps.ou < 1) g.bands.push(ps.ou * 1.25 - 0.1);
        PUL.forEach((tp, k) => { const climb = FIN && k < PUL.length - 1, onRing = climb ? k === p.r.j : true, s = (t - tp - (climb ? 0 : p.r.j * 0.07)) / 0.42; if (!onRing) return; if (s > 0 && s < 1) { g.bands.push(s); g.glow = Math.max(g.glow, Math.sin(s * Math.PI) * (k === PUL.length - 1 ? 1 : 0.6)); } });
        if (FIN) { const s = (t - LAST) / 0.55; if (s > 0 && s < 1.3) g.glow = Math.max(g.glow, Math.sin(cl(s) * Math.PI) * 0.8); }
        if (ps.pu > 0) g.glow = Math.max(g.glow, 0.2 * Math.sin(ps.pu * Math.PI));
        g.ring = p.r.j; g.lk = NR > 2 ? 0.55 : NR > 1 ? 0.75 : 1; out.push(g); byRing[p.r.j].push(g); }
      const backL = out.filter(g => g.key < 0).sort((p, q) => p.key - q.key), front = out.filter(g => g.key >= 0).sort((p, q) => p.key - q.key);
      f._G = { back: backL, front, byRing, all: out }; f._gT = f.t; f._gX = X; f._gY = Y; return f._G; };
    // the strands a petal peels into, curling away
    const strands = (c, g, T, t) => { const k = g.a * (g.lk || 1) * 0.75; if (!(k > 0.02)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.beginPath(); pathOf(c, g.L); pathOf(c, g.R); c.globalAlpha = Math.min(1, k) * 0.8; c.strokeStyle = P.cyan; c.lineWidth = 1.1; c.stroke(); c.beginPath(); pathOf(c, g.M); c.globalAlpha = Math.min(1, k); c.strokeStyle = P.violet; c.lineWidth = 1.8; c.stroke(); c.restore(); };
    const drawCentre = (c, f, X, Y, T, t, front) => { const bud = sm(RISE + 0.2, RISE + 0.5, t) * (1 - sm(OPEN + 0.2, OPEN + 0.9, t)), bloom = sm(OPEN, OPEN + 0.6, t) * (1 - sm(PEEL, PEEL + 0.6, t)), k = Math.min(1, f.life / 0.4);
      if (!front) { if (bud > 0) { const zb = rings[0].Lp * 0.55 * (NR > 2 ? 1.3 : 1); K.glow(c, X, Y - zb * T, T * (1.1 + 0.15 * Math.sin(t * 12)), P.violet, 0.7 * bud * k); H.core(c, X, Y - zb * T, T * 0.32, P.cyan, P.white, bud * k); for (let j = 0; j < 3; j++) { const b = j * 2.1 + t * 3; zig(c, X, Y - zb * T, X + Math.cos(b) * T * 0.7, Y - zb * T + Math.sin(b) * T * 0.9, K.seed(t, j + 20), T * 0.15, 1, bud * k * 0.8); } }
        return; }
      if (bloom > 0) { const pz = T * (NR > 2 ? 0.55 : 0.32), pul = PUL.reduce((m, tp) => Math.max(m, t > tp && t < tp + 0.4 ? 1 - (t - tp) / 0.4 : 0), 0); K.glow(c, X, Y - pz, T * (0.8 + 0.6 * pul), P.cyan, (0.5 + 0.5 * pul) * bloom * k); K.orb(c, X, Y - pz, T * (0.16 + 0.06 * pul), t, 2, bloom * k);
        for (let j = 0; j < 4 + NR * 2; j++) { const b = j / (4 + NR * 2) * TAU + t * 1.5; zig(c, X, Y - pz, X + Math.cos(b) * T * 0.55, Y - pz + Math.sin(b) * T * 0.35 - T * 0.2, K.seed(t, j + 40, 12), T * 0.1, 0.9, 0.55 * bloom * k); } } };
    const F = H.add({ life: LIFE, x: cx, y: cy,
      update(dt, f) { const t = f.t, T = H.X.Tz();
        if (t > RISE && t < OPEN + 0.2) for (const m of H.living()) { const d = Math.hypot(m.x - cx, m.y - cy); if (d < RH + 0.6 && d > 0.6) H.pull(m, cx, cy, dt * 1.1); }
        if (t > VEIN && t < PEEL + 0.8) K.aura(cx, cy, RH * 0.7, dt, t > OPEN ? 16 : 8, 0.2);
        if (t > PEEL && t < PEEL + 1) K.aura(cx, cy - 0.8, RH * 0.8, dt, 14, 0.4);
        // the beads flung off the petal tips as sparks
        if (f._G && t > OPEN && t < PEEL + 0.6) for (const g of f._G.all) { if (!(g.a > 0.2) || Math.random() > dt * (NR > 2 ? 0.9 : 1.6) * H.Q()) continue; const w = toW(g.tip[0], g.tip[1], T), b = g.phi; H.P({ kind: 'spark', x: w[0], y: w[1], vx: Math.cos(b) * 3.5, vy: Math.sin(b) * 2 - 1.2, g: 3, drag: 0.6, life: 0.45, max: 0.45, size: 2, color: Math.random() < 0.5 ? P.ice : P.cyan }); }
        if (t > PEEL && f._G && Math.random() < dt * 20 * H.Q()) { const g = f._G.all[Math.floor(Math.random() * f._G.all.length)]; if (g) { const w = toW(g.tip[0], g.tip[1], T); K.motes(w[0], w[1], 1); } } },
      drawUnder(c, f, X, Y, T) { const t = f.t, k = Math.min(1, f.life / 0.5), bloom = sm(OPEN - 0.3, OPEN + 0.5, t);
        // the light on the floor beneath the flower
        K.floorLight(c, X, Y, T * RH * 1.25, (0.25 + 0.4 * bloom) * k * sm(SEED, SEED + 0.3, t) * (1 - sm(PEEL + 0.4, LIFE - 0.3, t)));
        // the seed's impact ring and the veins spreading from it
        if (t > SEED && t < SEED + 0.6) { const u = (t - SEED) / 0.6; K.shockRing(c, X, Y, T * (0.3 + RH * 0.8 * eo(u)), 0.9 * (1 - u), t, 3); }
        const vg = eo(cl((t - VEIN) / 0.5)), va = (1 - sm(RISE + 0.1, RISE + 0.6, t)) * k; if (vg > 0 && va > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
          for (let v = 0; v < veins.length; v++) { const V = veins[v], main = v % 3 === 0, g0 = main ? vg : cl((vg - 0.45) / 0.55); if (g0 <= 0) continue; const n = (V.length - 1) * g0; for (let j = 0; j <= Math.ceil(n); j++) { const jj = Math.min(j, n), i0 = Math.floor(jj), u = jj - i0, p0 = V[Math.min(i0, V.length - 1)], p1 = V[Math.min(i0 + 1, V.length - 1)], px = X + (p0[0] + (p1[0] - p0[0]) * u) * T, py = Y + (p0[1] + (p1[1] - p0[1]) * u) * T * GY; j ? c.lineTo(px, py) : c.moveTo(px, py); } }
          c.globalAlpha = 0.4 * va; c.strokeStyle = P.violet; c.lineWidth = 5; c.stroke(); c.globalAlpha = 0.85 * va; c.strokeStyle = P.cyan; c.lineWidth = 2; c.stroke(); c.setLineDash([T * 0.2, T * 0.25]); c.lineDashOffset = -t * T * 3; c.globalAlpha = va; c.strokeStyle = P.white; c.lineWidth = 1; c.stroke(); c.setLineDash([]); c.restore(); }
        // the flower of light left on the floor, fading out (violet and ice, never dark)
        const pa = sm(OPEN, OPEN + 0.8, t) * (1 - sm(PEEL + 0.9, LIFE - 0.05, t)) * k; if (pa > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.beginPath(); for (const pts of pattern) { pts.forEach((p, i) => (i ? c.lineTo(X + p[0] * T, Y + p[1] * T * GY) : c.moveTo(X + p[0] * T, Y + p[1] * T * GY))); c.closePath(); }
          c.globalAlpha = 0.22 * pa; c.fillStyle = P.deep; c.fill(); c.globalAlpha = 0.6 * pa; c.strokeStyle = P.violet; c.lineWidth = 2.5; c.stroke(); c.globalAlpha = 0.45 * pa; c.strokeStyle = P.ice; c.lineWidth = 0.9; c.stroke();
          c.beginPath(); H.floorEllipse(c, X, Y, T * rings[0].r0 * 0.9); c.globalAlpha = 0.6 * pa; c.strokeStyle = P.cyan; c.lineWidth = 1.5; c.stroke(); c.restore(); }
        // the pulses running out over the floor
        for (const tp of PUL) { const u = (t - tp) / 0.5; if (u > 0 && u < 1) K.shockRing(c, X, Y, T * RH * (0.3 + 0.75 * eo(u)), 0.75 * (1 - u), t, tp === LAST ? 4 : 2); }
        // the back half of the flower, behind the monsters at its heart
        const G = geo(f, X, Y, T); for (const g of G.back) { drawPetal(c, g, t, T); if (g.body < 0.95) strands(c, g, T, t); }
        drawCentre(c, f, X, Y, T, t, false); },
      draw(c, f, X, Y, T) { const t = f.t, k = Math.min(1, f.life / 0.5);
        // the seed: a brilliant orb arcing from the pet into the ground under the monsters
        if (t < SEED) { const pts = []; for (let j = 0; j <= 8; j++) { const u = Math.max(0, t / SEED - 0.35 + j / 8 * 0.35), x = lerp(me.x, cx, u), y = lerp(me.y, cy, u), z = 0.8 * (1 - u) + 1.6 * Math.sin(u * Math.PI); pts.push([H.sx(x), H.sy(y) - z * T]); } K.ribbon(c, pts, T * 0.2, 1); const p = pts[8]; K.orb(c, p[0], p[1], T * 0.17, t, 1, 1); }
        const G = geo(f, X, Y, T); for (const g of G.front) { drawPetal(c, g, t, T); if (g.body < 0.95) strands(c, g, T, t); }
        // lightning bridges between neighbouring petals while a pulse passes (Adept on)
        if (BRIDGE) PUL.forEach((tp, kk) => { const s = (t - tp) / 0.42; if (s < 0.25 || s > 1.05) return; const climb = FIN && kk < PUL.length - 1; G.byRing.forEach((list, j) => { if (climb && j !== kk) return; if (!climb && FIN && j === 0 && kk === PUL.length - 1) { /* (the final wave bridges every ring) */ } const n = list.length;
            for (let i = 0; i < n; i++) { const A = list[i], B = list[(i + 1) % n]; if (!A || !B || A.a < 0.3 || B.a < 0.3) continue; const pa = at(A.R, 0.66), pb = at(B.L, 0.66); zig(c, pa[0], pa[1], pb[0], pb[1], K.seed(t, i + j * 20 + kk * 50, 16), T * 0.1, 1.1, Math.min(A.a, B.a) * Math.sin(cl((s - 0.25) / 0.8) * Math.PI)); } }); });
        drawCentre(c, f, X, Y, T, t, true);
        // the final wave: a luminous ring rising through the whole flower
        if (FIN) { const u = (t - LAST) / 0.55; if (u > 0 && u < 1) { const rr = T * RH * (0.25 + 0.75 * eo(u)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * (1 - u) * k; c.strokeStyle = P.white; c.lineWidth = 3; c.beginPath(); c.ellipse(X, Y - T * 1.2 * u, rr, rr * GY, 0, 0, TAU); c.stroke(); c.strokeStyle = P.gold; c.lineWidth = 1.5; c.beginPath(); c.ellipse(X, Y - T * 1.2 * u, rr * 0.92, rr * 0.92 * GY, 0, 0, TAU); c.stroke(); c.restore(); K.glow(c, X, Y - T * 1.4, T * RH * 1.1, P.ice, 0.45 * Math.sin(u * Math.PI) * k); } } } });
    return F;
  };
})();
