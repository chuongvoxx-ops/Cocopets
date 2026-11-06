/* ---------- Wind ultimate W3: Terrible Tornado (replaces Crownless Hurricane) ----------
   Enormous flower-laden tornadoes rise ahead of the pet and sweep across the battlefield: 1 at Hatchling, 3 at Adept
   (staggered lanes, slightly different heights), 6 at Celestial (an outer trio sweeping round the arena, an inner trio
   crossing the enemy area on staggered figure-eights, rolling entrance). 6 / 7 / 8 s.
   The reference is Ice's Catastrophe (20k8f): its beams are columns of cached turning frames that steer across the
   floor over a cached swirl, with a crown and a trail. This keeps that character (cached turning frames, a turning
   floor swirl, a light trail, a planned sweep) and makes it a wide, tall funnel of wind:
   - formation: a big ground spiral opens ahead of the pet; pink petals sweep out round its rim, then whip inward and up
     as a narrow turning stem rises and opens into a vast upper funnel; a surge of light runs up the column at full size;
   - travel: the ground contact follows a planned route (arc-length, accelerating out of the formation) and steers
     first; the upper funnel leans with a lagged velocity, so it swings behind turns. The body is a stack of elliptical
     wind bands (cached per-pixel sprites in 24 turning frames, two widths) scrolling upward with a helical twist, thin
     white cutting streaks (cached additive frames plus a few helix strokes), occasional emerald pressure seams, two pink
     flower streams spiralling up and peeling off the top, slow tumbling blossoms, a turning ground ring that throws
     petals and lifts dust, a contact shadow and a fading floor light trail;
   - finale: the column stretches upward, the base lifts off, the petals open into broad five-armed flower spirals at the
     top and the remaining wind sheds along the floor.
   Gameplay: each tornado ticks on the game clock every 0.5 s from its surge to the finale, hitting its base circle once
   per tick (decorative layers never hit) and drawing small monsters gently in (bosses resist through H.pull). Per tick
   base x K x evoK x 14 / ticks: a monster inside one funnel the whole time takes ~14x base at Hatchling (x1.48 at
   Celestial); overlapping funnels add. Built for the phone: every band, swirl, petal and blossom is a cached sprite
   blitted unturned (rotation buckets); the sprites bake a few a frame from the cast, or in idle time from the floor's
   start (U.terribletornado.warm). */
(() => {
  const U = ELEM_IMPL.wind.ult; delete U.hurricane;
  const TAU = Math.PI * 2, MINT = '#73E8B6', EMER = '#16A57B', PALE = '#E7FFF6', PINK = '#FFAFD2', DEEP = '#DE5A9A', DUST = '#E2D6B0', WHITE = '#FFFFFF';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgb = h => hexRGB(h);
  let H = null; const DBG = {};

  /* ================= cached sprites ================= */
  const NF = 24, NSM = 12, NSW = 12, NPR = 16, NBR = 8;
  const BW = 192, BH = 80, BCX = 96, BCY = 40, BRX = 86, BRY = 33, SQ = BRY / BRX;   // a band: an ellipse ring seen from a little above
  const SPR = new Map();
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  const spr = (key, make) => { let s = SPR.get(key); if (!s) { s = make(); SPR.set(key, s); } return s; };
  /* the band's geometry, per pixel: where it lies across the ellipse, its vertical distance to the front and back
     curves, the angle round the funnel; only the pixels near the curves are kept */
  let BG = null;
  function bandGeo() {
    if (BG) return BG; const ids = [], E = [], F = [], B = [], TH = [], SD = [];
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const X = x + 0.5 - BCX, Y = y + 0.5 - BCY, e = X / BRX, ec = e < -1 ? -1 : e > 1 ? 1 : e, s = Math.sqrt(1 - ec * ec), yF = BRY * s, dF = Y - yF, dB = Y + yF;
      const side = Math.abs(X) > BRX ? Math.exp(-Math.pow((Math.abs(X) - BRX) / 3.5, 2)) : 1;
      if (side < 0.01 || (Math.abs(dF) > 17 && Math.abs(dB) > 17)) continue;
      ids.push(y * BW + x); E.push(ec); F.push(dF); B.push(dB); TH.push(Math.acos(ec)); SD.push(side); }
    BG = { ids: Int32Array.from(ids), E: Float32Array.from(E), F: Float32Array.from(F), B: Float32Array.from(B), TH: Float32Array.from(TH), SD: Float32Array.from(SD) }; return BG; }
  const cE = rgb(EMER), cM = rgb(MINT), cP = rgb(PALE), cW = rgb(WHITE), cS = rgb('#0B6A4D');
  /* kind 0: the translucent body band (normal blend): mint, emerald on the shaded side, pale where the light falls on
     its upper edge; the front half strong, the back faint; ends feathered and thinned. kind 1: the cutting light
     (additive): a thin white streak along the front with a mint halo. kind 2: an emerald pressure seam with a pale
     hairline above it (normal blend). The arc starts at phi: turning the funnel is choosing the frame */
  function bandPaint(kind, v, fi, nf) {
    const G = bandGeo(), cv = mk(BW, BH), g = cv.getContext('2d'), im = g.createImageData(BW, BH), Dd = im.data, phi = fi / nf * TAU;
    const L = kind === 0 ? (v ? 3.1 : 4.5) : kind === 1 ? 2.5 : 1.9, hv = v ? 7.0 : 10.0, PI = Math.PI;
    const win = th => { const s = (((th - phi) % TAU) + TAU) % TAU / L; return s < 1 ? Math.sin(PI * s) : 0; };
    for (let n = 0; n < G.ids.length; n++) {
      const e = G.E[n], dF = G.F[n], dB = G.B[n], th = G.TH[n], sd = G.SD[n], lit = 0.5 - 0.5 * e, mf = win(th), mb = win(TAU - th);
      let r = 0, gg = 0, b = 0, a = 0;
      if (kind === 0) {
        let af = 0, ab = 0, hi = 0;
        if (mf > 0) { const h = hv * (0.3 + 0.7 * mf), q = dF / h; af = Math.exp(-q * q) * Math.pow(mf, 0.6) * 0.9 * sd; hi = cl(0.35 - q * 0.55); }
        if (mb > 0) { const h = hv * (0.3 + 0.7 * mb), q = dB / h; ab = Math.exp(-q * q) * Math.pow(mb, 0.6) * 0.45 * sd; }
        a = af + ab * (1 - af); if (a < 0.004) continue;
        const t1 = 0.25 + 0.75 * lit, kp = (0.55 * lit * lit + 0.2) * hi, t2 = 0.15 + 0.45 * lit;
        const dk = 0.62 + 0.38 * lit, fr = lerp(lerp(cE[0], cM[0], t1) * dk, cP[0], kp), fg = lerp(lerp(cE[1], cM[1], t1) * dk, cP[1], kp), fb = lerp(lerp(cE[2], cM[2], t1) * dk, cP[2], kp);
        const br = lerp(cE[0], cM[0], t2) * 0.62, bg = lerp(cE[1], cM[1], t2) * 0.62, bb = lerp(cE[2], cM[2], t2) * 0.62, wb = ab * (1 - af);
        r = (fr * af + br * wb) / a; gg = (fg * af + bg * wb) / a; b = (fb * af + bb * wb) / a;
      } else if (kind === 1) {
        const ln = mf > 0 ? Math.exp(-Math.pow((dF + 1.6) / 1.25, 2)) * Math.pow(mf, 0.9) : 0, halo = mf > 0 ? Math.exp(-Math.pow(dF / 5.5, 2)) * 0.1 * mf : 0, lb = mb > 0 ? Math.exp(-Math.pow(dB / 1.5, 2)) * 0.16 * mb : 0, s = ln + halo + lb;
        a = cl(s) * sd; if (a < 0.004) continue; const w = 0.3 + 0.7 * ln / (s + 1e-6);
        r = lerp(cM[0], cW[0], w); gg = lerp(cM[1], cW[1], w); b = lerp(cM[2], cW[2], w);
      } else {
        if (mf <= 0) continue; const dk = Math.exp(-Math.pow((dF - 0.8) / 1.5, 2)) * 0.78 * mf * sd, hl = Math.exp(-Math.pow((dF + 2.1) / 0.9, 2)) * 0.6 * mf * sd;
        a = hl + dk * (1 - hl); if (a < 0.004) continue; const wd = dk * (1 - hl);
        r = (cP[0] * hl + cS[0] * wd) / a; gg = (cP[1] * hl + cS[1] * wd) / a; b = (cP[2] * hl + cS[2] * wd) / a; }
      const p = G.ids[n] * 4; Dd[p] = r; Dd[p + 1] = gg; Dd[p + 2] = b; Dd[p + 3] = a * 255; }
    g.putImageData(im, 0, 0); return cv; }
  /* a turning frame, or (while the frames are still baking) the nearest one already baked: nothing heavy is painted on a
     frame that is drawing; only a family with no frame at all bakes one there */
  function near(pre, fi, n, make) { let s = SPR.get(pre + fi); if (s) return s; for (let d = 1; d <= n >> 1; d++) { s = SPR.get(pre + ((fi + d) % n)) || SPR.get(pre + ((fi - d + n) % n)); if (s) return s; } return spr(pre + fi, make); }
  const body = (v, fi) => near('b' + v + '|', fi, NF, () => bandPaint(0, v, fi, NF));
  const light = fi => near('l', fi, NF, () => bandPaint(1, 0, fi, NF));
  const seam = fi => near('s', fi, NSM, () => bandPaint(2, 0, fi, NSM));
  const bakeBody = (v, fi) => spr('b' + v + '|' + fi, () => bandPaint(0, v, fi, NF)), bakeLight = fi => spr('l' + fi, () => bandPaint(1, 0, fi, NF)), bakeSeam = fi => spr('s' + fi, () => bandPaint(2, 0, fi, NSM));
  /* the floor swirl (additive, in the floor's plane: squashed when drawn): three spiral arms with pale cores, a soft
     ring with a pale hairline brightening in three places, a faint centre; feathered to nothing at the rim. 12 frames
     over its 120-degree repeat */
  const SWS = 160;
  let SG = null;
  function swirlPaint(fi) {
    if (!SG) { const R = [], A = [], I = []; for (let y = 0; y < SWS; y++) for (let x = 0; x < SWS; x++) { const X = x + 0.5 - SWS / 2, Y = y + 0.5 - SWS / 2, r = Math.hypot(X, Y) / (SWS / 2 - 3); if (r >= 1) continue; I.push(y * SWS + x); R.push(r); A.push(Math.atan2(Y, X)); } SG = { I: Int32Array.from(I), R: Float32Array.from(R), A: Float32Array.from(A) }; }
    const cv = mk(SWS, SWS), g = cv.getContext('2d'), im = g.createImageData(SWS, SWS), Dd = im.data, phi = fi / NSW * TAU / 3;
    for (let n = 0; n < SG.I.length; n++) {
      const rho = SG.R[n], th = SG.A[n], edge = sm((1 - rho) / 0.12);
      let arm = 0, core = 0; const w = 0.13 + 0.32 * rho, env = Math.pow(Math.sin(Math.PI * Math.min(1, rho / 0.94)), 1.2);
      for (let k = 0; k < 3; k++) { let d = th - (phi + k * TAU / 3 + rho * 3.5); d = ((d % TAU) + TAU) % TAU; if (d > Math.PI) d -= TAU; arm += Math.exp(-Math.pow(d / w, 2)); core += Math.exp(-Math.pow(d / (w * 0.28), 2)); }
      const ring = Math.exp(-Math.pow((rho - 0.8) / 0.08, 2)) * 0.3, hair = Math.exp(-Math.pow((rho - 0.865) / 0.022, 2)) * (0.3 + 0.3 * Math.cos(3 * (th - phi))), ctr = Math.exp(-Math.pow(rho / 0.26, 2)) * 0.2;
      const mintA = ring + arm * 0.4 * env + ctr, paleA = hair + core * 0.45 * env, a = cl(mintA + paleA) * edge; if (a < 0.004) continue;
      const w2 = paleA / (mintA + paleA + 1e-6), p = SG.I[n] * 4; Dd[p] = lerp(cM[0], cP[0], w2); Dd[p + 1] = lerp(cM[1], cP[1], w2); Dd[p + 2] = lerp(cM[2], cP[2], w2); Dd[p + 3] = a * 255; }
    g.putImageData(im, 0, 0); return cv; }
  const swirl = fi => near('w', fi, NSW, () => swirlPaint(fi)), bakeSwirl = fi => spr('w' + fi, () => swirlPaint(fi));
  const swirlAt = ang => swirl(((Math.round(ang / (TAU / 3) * NSW) % NSW) + NSW) % NSW);
  /* a petal (cherry-blossom shape with a notched tip): base deep, body pink, tip pale; a soft darker edge so it reads on
     a bright floor, a pale vein and a highlight. 3 colourings x 16 turns */
  const PCOL = [[DEEP, PINK, '#FFE6F1'], ['#F48DBE', '#FFD3E6', '#FFF7FB'], ['#B8336F', DEEP, PINK]];
  function petalPath(g, L, W) { g.beginPath(); g.moveTo(0, L); g.bezierCurveTo(W * 1.35, L * 0.4, W * 1.15, -L * 0.72, W * 0.42, -L); g.lineTo(0, -L * 0.8); g.lineTo(-W * 0.42, -L); g.bezierCurveTo(-W * 1.15, -L * 0.72, -W * 1.35, L * 0.4, 0, L); g.closePath(); }
  const petal = (v, ri) => near('p' + v + '|', ri, NPR, () => bakePetal(v, ri)), bakePetal = (v, ri) => spr('p' + v + '|' + ri, () => { const cv = mk(28, 28), g = cv.getContext('2d'), L = 11.5, W = 5.4, C3 = PCOL[v]; g.translate(14, 14); g.rotate(ri / NPR * TAU);
    const gr = g.createLinearGradient(0, L, 0, -L); gr.addColorStop(0, C3[0]); gr.addColorStop(0.45, C3[1]); gr.addColorStop(1, C3[2]); petalPath(g, L, W); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(140,30,80,0.38)'; g.lineWidth = 0.9; g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, L * 0.75); g.lineTo(0, -L * 0.45); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(-W * 0.4, -L * 0.25, W * 0.28, L * 0.32, 0.15, 0, TAU); g.fill(); return cv; });
  /* a five-petal blossom, shaded from a deep centre to pale rims, a pale-gold heart with dots; 2 colourings x 8 turns of
     its 72-degree repeat */
  const bloom = (v, ri) => near('f' + v + '|', ri, NBR, () => bakeBloom(v, ri)), bakeBloom = (v, ri) => spr('f' + v + '|' + ri, () => { const cv = mk(44, 44), g = cv.getContext('2d'), C3 = v ? ['#F7A3CB', '#FFDCEB', '#FFFFFF'] : [DEEP, PINK, '#FFEAF3']; g.translate(22, 22); g.rotate(ri / NBR * TAU / 5);
    for (let k = 0; k < 5; k++) { g.save(); g.rotate(k * TAU / 5); g.translate(0, -9.5); const gr = g.createLinearGradient(0, 9, 0, -10); gr.addColorStop(0, C3[0]); gr.addColorStop(0.5, C3[1]); gr.addColorStop(1, C3[2]); petalPath(g, 10, 6.6); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(140,30,80,0.32)'; g.lineWidth = 0.9; g.stroke(); g.restore(); }
    const gc = g.createRadialGradient(-1, -1, 0, 0, 0, 5.5); gc.addColorStop(0, '#FFF6CF'); gc.addColorStop(0.6, '#F6D27A'); gc.addColorStop(1, 'rgba(222,90,154,0.6)'); g.fillStyle = gc; g.beginPath(); g.arc(0, 0, 5.2, 0, TAU); g.fill();
    g.fillStyle = 'rgba(190,90,40,0.7)'; for (let k = 0; k < 5; k++) { const b = k * TAU / 5 + 0.6; g.beginPath(); g.arc(Math.cos(b) * 3.2, Math.sin(b) * 3.2, 0.8, 0, TAU); g.fill(); } return cv; });
  const SHADOW = '#03241A';
  /* the funnel's inner volume at one height: a soft elliptical disc, pale on the lit left, emerald on the right */
  const vol = () => spr('vol', () => { const W = 96, Hh = 40, cv = mk(W, Hh), g = cv.getContext('2d'), im = g.createImageData(W, Hh), Dd = im.data;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const ex = (x + 0.5 - W / 2) / (W / 2 - 2), ey = (y + 0.5 - Hh / 2) / (Hh / 2 - 1), r = Math.hypot(ex, ey); if (r >= 1) continue; const a = Math.pow(1 - r * r, 1.4), k = cl(0.5 - 0.6 * ex), p = (y * W + x) * 4;
      Dd[p] = lerp(cE[0] * 0.55, cM[0], k * 0.9); Dd[p + 1] = lerp(cE[1] * 0.55, cM[1], k * 0.9); Dd[p + 2] = lerp(cE[2] * 0.55, cM[2], k * 0.9); Dd[p + 3] = a * 255; }
    g.putImageData(im, 0, 0); return cv; });
  /* the bake list, in the order the cast needs them; a few run per frame from the cast, or all in idle time */
  const JOBS = [vol];
  /* (frames in a spread order: the first few baked already cover the whole turn) */
  const SPREAD = n => { const o = []; for (let st = n; st >= 1; st >>= 1) for (let i = 0; i < n; i += st) if (!o.includes(i)) o.push(i); for (let i = 0; i < n; i++) if (!o.includes(i)) o.push(i); return o; };
  { const sw = SPREAD(NSW), nf = SPREAD(NF), sm2 = SPREAD(NSM), pr = SPREAD(NPR), br = SPREAD(NBR);
    // (first one of each family, so nothing is ever baked on a drawing frame; then the turns filled in, coarse to fine)
    JOBS.push(() => bakeSwirl(0), () => bakePetal(0, 0), () => bakePetal(1, 0), () => bakePetal(2, 0), () => bakeBody(0, 0), () => bakeBody(1, 0), () => bakeLight(0), () => bakeSeam(0), () => bakeBloom(0, 0), () => bakeBloom(1, 0));
    for (let q = 1; q < NF; q++) { if (q < NSW) JOBS.push(() => bakeSwirl(sw[q])); if (q < NPR) for (let v = 0; v < 3; v++) JOBS.push(() => bakePetal(v, pr[q])); JOBS.push(() => bakeBody(0, nf[q]), () => bakeBody(1, nf[q]), () => bakeLight(nf[q])); if (q < NSM) JOBS.push(() => bakeSeam(sm2[q])); if (q < NBR) JOBS.push(() => bakeBloom(0, br[q]), () => bakeBloom(1, br[q])); } }
  let bakeI = 0, idle = false;
  function bakeSome(ms) { const t0 = performance.now(); while (bakeI < JOBS.length && performance.now() - t0 < ms) JOBS[bakeI++](); }

  /* ================= routes ================= */
  const TF = 1.0, FIN = 1.0, SR = 2.4, TW = 5.0;   // formation, finale, band scroll (bands a second), helical twist
  /* the speed along the route: still while forming, gathering and accelerating out of it, slowing in the finale */
  const spd = (tau, Dk) => sm((tau - (TF - 0.15)) / 0.8) * (tau > Dk - FIN ? lerp(1, 0.12, sm((tau - (Dk - FIN)) / (FIN * 0.8))) : 1);
  /* a route is a polyline (world tiles) with cumulative lengths; Catmull-Rom through waypoints, or sampled from a curve */
  function spline(W) { const out = []; for (let i = 0; i < W.length - 1; i++) { const p0 = W[Math.max(0, i - 1)], p1 = W[i], p2 = W[i + 1], p3 = W[Math.min(W.length - 1, i + 2)];
      for (let j = 0; j < 14; j++) { const t = j / 14, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(q => 0.5 * (2 * p1[q] + (-p0[q] + p2[q]) * t + (2 * p0[q] - 5 * p1[q] + 4 * p2[q] - p3[q]) * t2 + (-p0[q] + 3 * p1[q] - 3 * p2[q] + p3[q]) * t3))); } }
    out.push(W[W.length - 1].slice()); return out; }
  /* the routes are squeezed (around the pet, each side separately) into the view the camera gives: a phone in portrait
     is under ten tiles wide, and a tall funnel needs its height free above its base */
  function fitView(pts, me, hf, rt) {   // (pts: every route's points together, so they keep their spacing)
    const T = H.X.Tz ? H.X.Tz() : 40, vw = (typeof innerWidth === 'number' ? innerWidth : 800) / T, vh = (typeof innerHeight === 'number' ? innerHeight : 800) / T;
    const L = Math.max(3.2, vw / 2 - (rt || 2) * 0.5 - 0.4), Rr = L, Up = Math.max(2.2, vh * 0.45 - hf * 0.8 - 0.6), Dn = Math.max(2.5, vh * 0.5 - 1.6);
    let mx0 = 0, mx1 = 0, my0 = 0, my1 = 0; for (const p of pts) { const dx = p[0] - me.x, dy = p[1] - me.y; mx0 = Math.min(mx0, dx); mx1 = Math.max(mx1, dx); my0 = Math.min(my0, dy); my1 = Math.max(my1, dy); }
    const k = (lim, m) => (m > lim ? Math.max(0.78, lim / m) : 1), kx0 = k(L, -mx0), kx1 = k(Rr, mx1), ky0 = (-my0 > Up ? Math.max(0.55, Up / -my0) : 1), ky1 = k(Dn, my1);
    for (const p of pts) { const dx = p[0] - me.x, dy = p[1] - me.y; p[0] = me.x + dx * (dx < 0 ? kx0 : kx1); p[1] = me.y + dy * (dy < 0 ? ky0 : ky1); } }
  function route(pts, me, uni) {
    // (bent round the pet's own spot: a funnel never parks on the pet)
    if (!DBG.noAvoid) for (const p of pts) { const dx = p[0] - me.x, dy = p[1] - me.y, d = Math.hypot(dx, dy) || 1e-3; if (d < 1.7) { const nd = 1.7 - (1.7 - d) * 0.3; p[0] = me.x + dx / d * nd; p[1] = me.y + dy / d * nd; } }
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    if (uni) { const L = cum[cum.length - 1]; for (let i = 0; i < cum.length; i++) cum[i] = L * i / (cum.length - 1); }
    return { pts, cum, len: cum[cum.length - 1] || 1e-3 }; }
  /* where the monsters are (weighted toward the aim), at least 3 tiles ahead of the pet and no more than 6 */
  function area(C, me) {
    let cx = C.tx, cy = C.ty; const live = H.living().filter(m => Math.hypot(m.x - me.x, m.y - me.y) < 9);
    if (live.length) { let sx = 0, sy = 0, sw = 0; for (const m of live) { const w = 1 / (1 + Math.hypot(m.x - C.tx, m.y - C.ty)); sx += m.x * w; sy += m.y * w; sw += w; } cx = sx / sw; cy = sy / sw; }
    let dx = cx - me.x, dy = cy - me.y, d = Math.hypot(dx, dy); if (d < 0.6) { dx = Math.cos(C.a); dy = Math.sin(C.a); d = 1; }
    const ux = dx / d, uy = dy / d, dd = Math.max(3, Math.min(4.2, d)); return { cx: me.x + ux * dd, cy: me.y + uy * dd, ux, uy, vx: -uy, vy: ux, d: dd }; }
  function plan(C, me, N, s, vr) {
    const A = area(C, me), Wc = (a, b) => [A.cx + (A.ux * a + A.vx * b) * s, A.cy + (A.uy * a + A.vy * b) * s], Wp = (a, b) => [me.x + A.ux * a + A.vx * b, me.y + A.uy * a + A.vy * b], T3 = [];
    if (N === 1) {
      // one funnel: out of a spiral 2 tiles ahead, a cursive loop through the enemy area and back across it
      T3.push({ s: 0, hf: 4.0, rt: 2.0, rb: 0.42, R: 1.2 * s, pts: spline([Wp(2.1, 0), Wc(-0.7, -1.0), Wc(1.0, -0.8), Wc(2.1, 0.7), Wc(0.9, 1.8), Wc(-0.6, 0.9), Wc(0.1, -0.4), Wc(1.4, -1.4), Wc(2.1, -0.5)]) });
    } else if (N === 3) {
      // three lanes 2.4 apart, staggered; parallel S-curves forward, the outer two turn outward and come back wider, the
      // middle one loops back down the middle
      const g = 2.8, H3 = [4.5, 5.0, 5.4], ord = vr & 1 ? [0, 1, 2] : [1, 0, 2];
      for (let k = 0; k < 3; k++) { const L = k - 1, b = L * g, W = [Wp(2.0 + 0.5 * Math.abs(L), L * 2.3)];
        if (L) W.push(Wc(-1.3, b + 0.5), Wc(0.6, b - 0.5), Wc(2.3, b + 0.45), Wc(3.4, b * 1.3), Wc(2.6, b * 1.75), Wc(0.8, b * 1.55), Wc(-0.8, b * 1.2));
        else W.push(Wc(-1.3, 0.5), Wc(0.6, -0.5), Wc(2.3, 0.45), Wc(3.5, 0.2), Wc(3.0, -0.6), Wc(1.4, -0.3), Wc(-0.2, 0.4));
        T3.push({ s: ord.indexOf(k) * 0.18, hf: H3[k], rt: 2.0, rb: 0.4, R: 1.25 * s, pts: spline(W) }); }
    } else {
      // Celestial: an outer trio sweeping round the arena 120 degrees apart, an inner trio crossing the enemy area; the six
      // turn together, the outer ones always between the inner ones (so never on top of each other); they keep step by
      // moving uniformly in the curve's parameter rather than its length; formations roll in 0.1 s apart
      const a0 = Math.atan2(me.y - A.cy, me.x - A.cx) + (vr & 3) * 0.5, Ro = 4.4 * s, R1i = 2.0 * s, od = vr & 4 ? -1 : 1, idr = vr & 8 ? -1 : 1;
      for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 120; i++) { const q = i / 120, th = a0 + 0.4 + Math.PI / 3 + k * TAU / 3 + od * q * Math.PI * 1.3, r = Ro * (1 + 0.1 * Math.sin(q * TAU + k)); pts.push([A.cx + Math.cos(th) * r, A.cy + Math.sin(th) * r]); }
        T3.push({ s: (2 * k + 1) * 0.1, hf: 6.0, rt: 2.05, rb: 0.42, R: 1.3 * s, pts, outer: true, uni: true }); }
      // (the inner trio: a breathing, turning triangle whose centre crosses the enemy area and back: always 120 degrees
      // apart at one radius, so never on top of each other)
      for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 120; i++) { const q = i / 120, rho = R1i * (0.86 + 0.14 * Math.cos(q * TAU * 1.5)), th = a0 + 0.4 + k * TAU / 3 + od * q * Math.PI * 1.3, cu = (0.2 - 0.5 * Math.cos(q * TAU * 0.75)) * s;
          pts.push([A.cx + A.ux * cu + Math.cos(th) * rho, A.cy + A.uy * cu + Math.sin(th) * rho]); }
        T3.push({ s: 2 * k * 0.1, hf: 5.3, rt: 1.75, rb: 0.4, R: 1.2 * s, pts, uni: true }); }
    }
    if (!DBG.noFit) fitView([].concat(...T3.map(t => t.pts)), me, Math.max(...T3.map(t => t.hf)), Math.max(...T3.map(t => t.rt)));
    return { A, T3: T3.map((t, k) => Object.assign(t, route(t.pts, me, t.uni), { k, ph: R1(k * 5.3 + 1) * TAU, spin: 1 })) }; }
  /* the funnels' bases along their routes in time (the same speed profile the move runs), and the closest two come */
  function minSep(T3, D) {
    const st = 0.05, n = Math.ceil(D / st) + 1, cum = new Float32Array(n); for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + spd((i - 0.5) * st, D) * st; const I = cum[n - 1] || 1;
    const at = (t, tau) => { const d = cum[Math.min(n - 1, Math.max(0, Math.round(tau / st)))] / I * t.len, cu = t.cum; let lo = 0, hi = cu.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cu[m] < d) lo = m; else hi = m; } const u = cl((d - cu[lo]) / ((cu[hi] - cu[lo]) || 1e-6)); return [lerp(t.pts[lo][0], t.pts[hi][0], u), lerp(t.pts[lo][1], t.pts[hi][1], u)]; };
    let best = 99; for (let g = TF; g < D - FIN + 0.5; g += 0.1) { const P = []; for (const t of T3) { const tau = g - t.s; if (tau >= TF && tau <= D - FIN) P.push(at(t, tau)); } for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) best = Math.min(best, Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1])); }
    return best; }
  /* the planned composition, from a few variants (turning direction, phase, entrance order) the one keeping them apart */
  function planBest(C, me, N, s, D) { if (N === 1) return plan(C, me, N, s, 0); let best = null, bs = -1; const V = N === 3 ? [0, 1] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    for (const v of V) { const P = plan(C, me, N, s, v), m = minSep(P.T3, D); if (m > bs) { bs = m; best = P; best.sep = m; } if (bs > 2.2) break; } return best; }

  /* ================= the move ================= */
  U.terribletornado = (C, h) => {
    H = h; const me = H.me, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, N = [1, 3, 6][tier - 1], GY = H.GY;
    const D = ev <= 4 ? 6 + (ev - 1) / 3 : 7 + (ev - 4) / 3, evoK = 1 + 0.08 * (ev - 1), KS = C.K || 1;
    const nTk = Math.floor((D - TF - FIN) / 0.5 + 1e-6) + 1, dmgT = C.base * KS * evoK * 14 / nTk, qN = N === 1 ? 1 : N === 3 ? 0.72 : 0.5;
    const NS = [22, 18, 15][tier - 1], NP = [96, 66, 46][tier - 1], NBL = [16, 11, 8][tier - 1], NSTR = [4, 3, 3][tier - 1], NFP = [40, 28, 20][tier - 1], NFS = [40, 30, 20][tier - 1];
    H.X.banner('TERRIBLE TORNADO', '', C.col, 1.6); H.X.sfx.hum();
    const PL = planBest(C, me, N, KS, D), tors = PL.T3;
    /* the speed along the route: still while forming, gathering and accelerating out of it, slowing in the finale */
    let I = 0; for (let x = 0; x < D; x += 0.01) I += spd(x + 0.005, D) * 0.01;
    for (const t of tors) Object.assign(t, { D, V: t.len / I, dist: 0, pi: 0, bx: t.pts[0][0], by: t.pts[0][1], dx: 1, dy: 0, sp: 0, svx: 0, svy: 0, nt: t.s + TF, tr: [], trT: 0, surged: false, fined: false, hits: 0 });
    const sMax = Math.max(...tors.map(t => t.s)), LIFE = sMax + D + 0.8;
    const items = [];   // (a pool of petal draws, reused every frame)
    let nIt = 0; const it = () => { if (nIt >= items.length) items.push({}); return items[nIt++]; };
    function posAt(t) { const P = t.pts, cu = t.cum; while (t.pi < P.length - 2 && cu[t.pi + 1] < t.dist) t.pi++; const i = t.pi, L = cu[i + 1] - cu[i] || 1e-6, u = cl((t.dist - cu[i]) / L);
      t.bx = P[i][0] + (P[i + 1][0] - P[i][0]) * u; t.by = P[i][1] + (P[i + 1][1] - P[i][1]) * u; t.dx = (P[i + 1][0] - P[i][0]) / L; t.dy = (P[i + 1][1] - P[i][1]) / L; }
    const F = H.add({ key: 'terribletornado', life: LIFE, x: me.x, y: me.y, tors, cut: false, sep: PL.sep,
      update(dt, f) {
        if (bakeI < JOBS.length) bakeSome(3);
        // the pet falls: every funnel goes into its finale now
        if (me.dead && !f.cut) { f.cut = true; for (const t of tors) { const tau = f.t - t.s; if (tau < 0) { t.gone = true; continue; } if (tau < t.D - FIN) t.D = Math.max(tau, 0.3) + FIN; } f.life = Math.min(f.life, Math.max(...tors.map(t => t.s + t.D)) - f.t + 0.8); }
        let live = null;
        for (const t of tors) { const tau = f.t - t.s; if (tau < 0 || t.gone) continue;
          t.sp = spd(tau, t.D) * t.V; t.dist = Math.min(t.len, t.dist + t.sp * dt); posAt(t);
          // the upper funnel follows a lagged velocity: it leans with the travel and swings behind turns
          const k = 1 - Math.exp(-dt / 0.55); t.svx += (t.dx * t.sp - t.svx) * k; t.svy += (t.dy * t.sp - t.svy) * k;
          if (tau > TF && tau < t.D && f.t - t.trT > 0.2) { t.trT = f.t; t.tr.push({ x: t.bx, y: t.by, t: f.t }); if (t.tr.length > 7) t.tr.shift(); }
          // the damage: its own tick every 0.5 s on the game clock, its base circle, from the surge to the finale
          while (t.nt <= f.t + 1e-9 && t.nt <= t.s + t.D - FIN + 1e-6) { t.nt += 0.5; t.hits += H.hitArea(t.bx, t.by, t.R, dmgT, C.dmgO({})) || 0; }
          if (tau > TF - 0.1 && tau < t.D - FIN) { live = live || H.living(); for (const m of live) { const ex = t.bx - m.x, ey = t.by - m.y, d = Math.hypot(ex, ey); if (d < t.R * 1.7 + m.r && d > 0.3) H.pull(m, t.bx, t.by, Math.min(d - 0.3, 1.2 * dt)); } }
          // the surge at full size
          if (!t.surged && tau >= TF) { t.surged = true; if (t.k < 2) H.X.sfx.whoosh(); H.X.shake(N === 1 ? 5 : 3, 0.16); H.X.light(t.bx, t.by, 3, 0.3); H.X.ring(t.bx, t.by, 0.3, t.R * 2.2, 0.45, PALE, 0.14);
            for (let j = 0; j < H.n(14 * qN); j++) { const q = j / 14 * TAU + Math.random() * 0.3; H.P({ kind: 'wind', x: t.bx + Math.cos(q) * t.R * 0.6, y: t.by + Math.sin(q) * t.R * 0.4, vx: Math.cos(q) * 8, vy: Math.sin(q) * 5, drag: 2, life: 0.45, max: 0.45, size: 2, color: WHITE }); } }
          // the finale: the wind sheds along the floor, the petals burst out of the top
          if (!t.fined && tau >= t.D - FIN) { t.fined = true; if (t.k === 0) H.X.sfx.whoosh();
            for (let j = 0; j < H.n(18 * qN); j++) { const q = j / 18 * TAU + Math.random() * 0.3, v = 5 + Math.random() * 4; H.P({ kind: 'wind', x: t.bx + Math.cos(q) * t.R * 0.8, y: t.by + Math.sin(q) * t.R * 0.5, vx: Math.cos(q) * v, vy: Math.sin(q) * v * 0.6, drag: 1.6, life: 0.7, max: 0.7, size: 2, color: WHITE }); if (j % 3 === 0) H.P({ kind: 'smoke', x: t.bx + Math.cos(q) * t.R, y: t.by + Math.sin(q) * t.R * 0.6, vx: Math.cos(q) * 1.6, vy: Math.sin(q) * 1, drag: 1.2, life: 1.1, max: 1.1, size: 0.45, color: DUST }); }
            for (let j = 0; j < H.n(22 * qN); j++) { const q = Math.random() * TAU, v = 2 + Math.random() * 4; H.P({ kind: 'petal', x: t.bx + Math.cos(q) * t.rt * 0.8, y: t.by - t.hf * 1.2 + Math.sin(q) * 0.5, vx: Math.cos(q) * v, vy: Math.sin(q) * v * 0.5 - 1, g: 2.2, drag: 0.9, life: 1.5, max: 1.5, size: 3.6, rot: Math.random() * TAU, vr: 7, color: j % 3 ? PINK : j % 2 ? DEEP : '#FFE6F1' }); } }
          // the travelling ground ring throws petals out and lifts dust; white wind runs round the base
          if (tau > 0.6 && tau < t.D - 0.2) { const Q = H.Q() * qN * dt;
            if (Math.random() < 16 * Q) { const q = Math.random() * TAU, r = t.R * 0.9; H.P({ kind: 'petal', x: t.bx + Math.cos(q) * r, y: t.by + Math.sin(q) * r * GY, vx: Math.cos(q) * 3 - Math.sin(q) * 2.4, vy: (Math.sin(q) * 3 + Math.cos(q) * 2.4) * GY - 2.2, g: 4, drag: 0.8, life: 0.9, max: 0.9, size: 3.2, rot: Math.random() * TAU, vr: 9, color: Math.random() < 0.6 ? PINK : Math.random() < 0.5 ? DEEP : '#FFE6F1' }); }
            if (Math.random() < 4 * Q) { const q = Math.random() * TAU; H.P({ kind: 'smoke', x: t.bx + Math.cos(q) * t.R * 0.8, y: t.by + Math.sin(q) * t.R * 0.5, vx: Math.cos(q) * 1.2, vy: Math.sin(q) * 0.7 - 0.3, drag: 1, life: 0.9, max: 0.9, size: 0.35, color: DUST }); }
            if (Math.random() < 10 * Q) { const q = Math.random() * TAU, r = t.R * (0.7 + Math.random() * 0.4); H.P({ kind: 'wind', x: t.bx + Math.cos(q) * r, y: t.by + Math.sin(q) * r * GY, vx: -Math.sin(q) * 7, vy: Math.cos(q) * 7 * GY, drag: 1.5, life: 0.35, max: 0.35, size: 1.5, color: WHITE }); } } }
      },
      drawUnder(c, f, X, Y, T) {
        const tt = f.t;
        for (const t of tors) { const tau = tt - t.s; if (tau < 0 || t.gone) continue; const BX = H.sx(t.bx), BY = H.sy(t.by), fin = cl((tau - (t.D - FIN)) / (FIN * 0.9)), fs = sm(fin), grow = sm((tau - 0.28) / 0.62);
          c.save(); c.globalCompositeOperation = 'lighter';
          // the light the funnel leaves on the floor behind it, fading
          for (const p of t.tr) { const k = 1 - (tt - p.t) / 1.3; if (k <= 0) continue; c.globalAlpha = 0.16 * k * (1 - fs); const r = T * t.R * 1.15; c.drawImage(glowSprite(MINT), H.sx(p.x) - r, H.sy(p.y) - r * GY, r * 2, r * 2 * GY); }
          // the formation's ground spiral: opens ahead of the pet, turning faster and faster, then gives way to the ring
          if (tau < 1.6) { const sp = sm(tau / 0.55), a = (N === 6 ? 0.55 : 0.7) * sp * (1 - sm((tau - 0.9) / 0.7)), r = T * 2.3 * KS * (0.3 + 0.7 * sp) * (1 - 0.25 * sm((tau - 0.6) / 0.6)); if (a > 0.01) { c.globalAlpha = a; c.drawImage(swirlAt(t.spin * (tau * 2.5 + tau * tau * 3.5) + t.ph), BX - r, BY - r * GY, r * 2, r * 2 * GY); } }
          // the travelling ground ring (and in the finale, shed outward along the floor)
          const ga = sm((tau - 0.55) / 0.5) * (1 - sm((fin - 0.25) / 0.75)); if (ga > 0.01) { const r = T * t.R * (1.05 + 0.05 * Math.sin(tau * 5 + t.ph)) * (1 + 1.8 * fs); c.globalAlpha = (N === 1 ? 0.95 : N === 3 ? 0.85 : 0.75) * ga; c.drawImage(swirlAt(t.spin * tau * 5.5 + t.ph), BX - r, BY - r * GY, r * 2, r * 2 * GY); c.globalAlpha = 0.22 * ga; const r2 = r * 1.35; c.drawImage(glowSprite(MINT), BX - r2, BY - r2 * GY, r2 * 2, r2 * 2 * GY); }
          c.restore();
          // the contact shadow under the stem
          const sa = 0.55 * grow * (1 - fs); if (sa > 0.01) { const r = T * (t.rb * 3 + 0.6); c.globalAlpha = sa; c.drawImage(glowSprite(SHADOW), BX - r, BY - r * GY * 0.8, r * 2, r * 2 * GY * 0.8); c.globalAlpha = 1; } }
      },
      draw(c, f, X, Y, T) {
        const tt = f.t, m = c.getTransform(), sa = m.a || 1, S = { x0: -m.e / sa, y0: -m.f / (m.d || 1), w: c.canvas.width / sa, h: c.canvas.height / (m.d || 1) };
        const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46, order = tors.filter(t => tt >= t.s && !t.gone).sort((p, q) => p.by - q.by);
        for (const t of order) drawTornado(c, t, tt - t.s, T, PX, PY, S);
      } });
    /* ---- one tornado ---- */
    const AX = new Float32Array(NS + 1), AY = new Float32Array(NS + 1), UU = new Float32Array(NS + 1);
    function drawTornado(c, t, tau, T, PX, PY, S) {
      const fin = cl((tau - (t.D - FIN)) / (FIN * 0.9)), fs = sm(fin), grow = sm((tau - 0.28) / 0.62), open = sm((tau - 0.5) / 0.55);
      const A = 1 - sm((fin - 0.3) / 0.6), A2 = 1 - sm((fin - 0.5) / 0.5);
      const Hpx = T * t.hf * (0.1 + 0.9 * grow) * (1 + 0.45 * fs), rT = T * t.rt * (0.2 + 0.8 * open) * (1 + 0.9 * fs), rB = T * t.rb * (0.5 + 0.5 * grow) * (1 + 1.6 * fs), u0 = 0.8 * fs;
      const BX = H.sx(t.bx), BY = H.sy(t.by);
      if (BX + rT * 2 < S.x0 || BX - rT * 2 > S.x0 + S.w || BY - Hpx - rT > S.y0 + S.h || BY + T * 2 < S.y0) return;
      let ox = t.svx * 0.32, oy = t.svy * 0.32; const ol = Math.hypot(ox, oy); if (ol > 1.3) { ox *= 1.3 / ol; oy *= 1.3 / ol; }
      const dX = (ox + 0.22 * Math.sin(tau * 1.3 + t.ph) * grow) * T, dY = oy * T * 0.6;
      const ax = u => BX + dX * Math.pow(u, 1.6) + T * 0.07 * u * Math.sin(u * 6 - tau * 3.2 + t.ph), ay = u => BY - Hpx * u + dY * Math.pow(u, 1.6);
      const rad = u => (rB + (rT - rB) * Math.pow(u, 2.0)) * (1 + 0.05 * Math.sin(u * 9 - tau * 6 + t.ph));
      /* (a funnel running up past the top of the screen, under the HUD, fades out softly rather than being cut) */
      const edge = y => sm((y - S.y0 - T * 1.9) / (T * 2.2)), eT = edge(ay(1) + Hpx * 0.25);
      const dimAt = (x, y, r) => { const kx = sm((r + T * 0.85 - Math.abs(x - PX)) / (T * 0.55)), ky = sm((T * 0.95 + r * SQ - Math.abs(y - PY)) / (T * 0.55)); return 1 - 0.68 * Math.min(kx, ky); };
      // ---- the petals: two streams spiralling up and peeling off the top, slow blossoms, the formation's sweep, the finale's flower spirals
      nIt = 0; const sp = t.spin, Rsp = T * 2.3 * KS, kk = t.k * 13.7;
      if (tau < 1.25) for (let i = 0; i < NFP; i++) { const j1 = R1(i * 3.3 + kk), j2 = R1(i * 5.9 + kk), po = sm((tau - 0.03 - j2 * 0.15) / 0.42), pin = Math.pow(cl((tau - 0.55 - j2 * 0.1) / 0.4), 2), a = sm(tau / 0.12) * (1 - sm((pin - 0.65) / 0.35)); if (a < 0.02) continue;
        const r = Rsp * (0.25 + 0.75 * po) * (1 - pin * 0.88), th = i / NFP * TAU + (j1 - 0.5) * 0.4 + sp * (tau * 2.2 + pin * 3.2), o = it();
        o.x = BX + Math.cos(th) * r; o.y = BY + Math.sin(th) * r * GY - pin * T * t.hf * 0.35; o.fr = Math.sin(th) > 0; o.s = T * (0.24 + 0.08 * j1); o.rot = j1 * TAU + tau * 6 * (j2 < 0.5 ? -1 : 1); o.fl = Math.abs(Math.cos(tau * 4 + j1 * 7)); o.v = i % 3; o.a = a; o.b = 0; }
      const ap0 = sm((tau - 0.7) / 0.5);
      if (ap0 > 0 && A2 > 0) {
        for (let i = 0; i < NP; i++) { const j1 = R1(i * 3.17 + kk), j2 = R1(i * 7.31 + kk), j3 = R1(i * 1.93 + kk), uu = (j1 + tau * (0.28 + 0.12 * j2)) % 1, ap = sm((tau - 0.7 - j2 * 0.35) / 0.4);
          let a = ap * A2 * sm(uu / 0.05); const pk = cl((uu - 0.78) / 0.22); a *= 1 - Math.pow(pk, 1.5); if (a < 0.02) continue;
          const u = u0 + uu * (1 - u0); let rr = rad(u) * (1.12 + 0.3 * j2); if (uu < 0.14) rr = lerp(T * t.R, rr, sm(uu / 0.14)); rr *= (1 + 1.7 * pk * pk) * (1 + 1.6 * fs * (0.4 + uu));
          const th = (i & 1) * Math.PI + sp * (tau * 4.2 + uu * 6) + (j3 - 0.5) * 1.0 + t.ph + fs * 2.4 * sp, o = it();
          o.x = ax(u) + Math.cos(th) * rr; o.y = ay(u) + Math.sin(th) * rr * SQ + fs * fs * T * (1 - uu); o.fr = Math.sin(th) > 0; o.s = T * (0.2 + 0.09 * j3); o.rot = j3 * TAU + tau * (3 + 4 * j2) * (j1 < 0.5 ? -1 : 1); o.fl = Math.abs(Math.cos(tau * (2 + 3 * j3) + j1 * 6)); o.v = i % 3; o.a = a * (o.fr ? 1 : 0.7); o.b = 0; }
        for (let i = 0; i < NBL; i++) { const j1 = R1(i * 2.71 + kk + 3), j2 = R1(i * 4.37 + kk), uu = (j1 + tau * 0.17) % 1, pk = cl((uu - 0.8) / 0.2); let a = ap0 * A2 * sm(uu / 0.08) * (1 - pk); if (a < 0.02) continue;
          const u = u0 + uu * (1 - u0), rr = rad(u) * (1.22 + 0.25 * j2) * (1 + 1.2 * pk) * (1 + 1.4 * fs * (0.4 + uu)), th = sp * (tau * 2.4 + uu * 4) + i / NBL * TAU + fs * 2 * sp, o = it();
          o.x = ax(u) + Math.cos(th) * rr; o.y = ay(u) + Math.sin(th) * rr * SQ + fs * fs * T * (1 - uu); o.fr = Math.sin(th) > 0; o.s = T * (0.4 + 0.1 * j2); o.rot = j2 * TAU + tau * 1.6 * (i & 1 ? -1 : 1); o.fl = 0.65 + 0.35 * Math.abs(Math.cos(tau * 1.7 + j1 * 5)); o.v = i & 1; o.a = a * (o.fr ? 1 : 0.75); o.b = 1; } }
      if (fin > 0.02) { const tx = ax(1), ty = ay(1), fa = sm(fin / 0.25) * (1 - sm((fin - 0.55) / 0.45));
        if (fa > 0.01) for (let i = 0; i < NFS; i++) { const arm = i % 5, j = Math.floor(i / 5), th = sp * (fin * 3 + tau * 1.1) + arm * TAU / 5 + j * 0.45 + t.ph, rr = rT * (0.2 + j * 0.13) * (0.35 + 1.3 * fs), o = it();
          o.x = tx + Math.cos(th) * rr; o.y = ty + Math.sin(th) * rr * SQ * 1.3 + T * 0.9 * fs * fs; o.fr = Math.sin(th) > 0; o.s = T * (0.24 + 0.03 * j); o.rot = th + Math.PI / 2; o.fl = 0.7 + 0.3 * Math.cos(tau * 3 + i); o.v = arm % 3; o.a = fa * (1 - j / (NFS / 5 + 1) * 0.5); o.b = (j === 0 && arm % 2 === 0) ? 1 : 0; } }
      const drawItems = front => { for (let n = 0; n < nIt; n++) { const o = items[n]; if (o.fr !== front) continue; const w = o.s, hh = w * Math.max(0.22, o.fl);
          const cv = o.b ? bloom(o.v & 1, ((Math.round(o.rot / (TAU / 5) * NBR) % NBR) + NBR) % NBR) : petal(o.v, ((Math.round(o.rot / TAU * NPR) % NPR) + NPR) % NPR); c.globalAlpha = Math.min(1, o.a * edge(o.y)); c.drawImage(cv, o.x - w / 2, o.y - hh / 2, w, hh); } };
      c.save();
      drawItems(false);
      // ---- the funnel: bands scrolling upward with a helical twist (normal blend), seams among them
      const ga = A * (grow > 0.01 ? 1 : 0);
      if (ga > 0.01) {
        for (let j = 0; j < NS; j++) { const uu = ((j + 0.45 * R1(j * 3.7 + t.k) + tau * SR) % NS) / NS, u = u0 + Math.pow(uu, 1.35) * (1 - u0), x = ax(u), y = ay(u), r = rad(u); AX[j] = x; AY[j] = y; UU[j] = uu;
          const a = ga * sm(uu / 0.05) * sm((1 - uu) / 0.16) * Math.min(1, 1.3 - 0.5 * u) * dimAt(x, y, r) * edge(y); if (a < 0.01 || r < 1) continue;
          { const vw = Math.max(r * 1.75, T * 0.85), vh = Math.max(vw * SQ * 1.15, T * 0.5); c.globalAlpha = a * (0.36 + 0.3 * (1 - u)); c.drawImage(vol(), x - vw / 2, y - vh / 2, vw, vh); }
          const phi = sp * tau * 7 + u * TW + t.ph, fi = ((Math.round(phi / TAU * NF) % NF) + NF) % NF, sc = r / BRX, w = BW * sc, hh = BH * Math.min(sc * 1.9, Math.max(sc, T * 0.0105)) * (0.8 + 0.45 * R1(j * 1.7 + t.k));
          c.globalAlpha = a; c.drawImage(body(j & 1, fi), x - w / 2, y - hh / 2, w, hh);
          if ((j + Math.floor(tau * 1.7 + t.ph * 3)) % 7 === 0) { const fs2 = ((Math.round((phi + 2.6) / TAU * NSM) % NSM) + NSM) % NSM; c.globalAlpha = a * 0.9; c.drawImage(seam(fs2), x - w / 2, y - hh / 2, w, hh); } }
        // the silhouette: a dark emerald edge on the shaded right, a pale rim with a dark line outside it on the lit left
        // (each in three alpha steps: the ends and the screen's top edge faded)
        { const pk = [[], [], []], NE = 14; for (let q = 0; q < NE; q++) { const ua = u0 + q / NE * (1 - u0), ub = u0 + (q + 1) / NE * (1 - u0), w = open * Math.min(sm((q + 0.5) / NE / 0.12), sm((1 - (q + 0.5) / NE) / 0.3)) * edge(ay(ub)) * dimAt(ax(ua), ay(ua), rad(ua)), b = w > 0.7 ? 2 : w > 0.35 ? 1 : w > 0.08 ? 0 : -1; if (b >= 0) pk[b].push(ua, ub); }
          const line = (side, off, col, lw, al) => { c.strokeStyle = col; c.lineWidth = lw; for (let b = 0; b < 3; b++) { const L = pk[b]; if (!L.length) continue; c.beginPath(); for (let i = 0; i < L.length; i += 2) { const r0 = rad(L[i]) * off, r1 = rad(L[i + 1]) * off; c.moveTo(ax(L[i]) + side * r0, ay(L[i])); c.lineTo(ax(L[i + 1]) + side * r1, ay(L[i + 1])); } c.globalAlpha = al * ga * [0.25, 0.6, 1][b]; c.stroke(); } };
          c.lineCap = 'round'; line(1, 0.97, '#0A5C42', Math.max(1.2, T * 0.05), 0.65); line(-1, 1.0, '#0A5C42', Math.max(1, T * 0.04), 0.45); line(-1, 0.94, PALE, Math.max(1, T * 0.035), 0.75); }
        // the cutting light (additive), and the surge of air running up the whole column at full size
        c.globalCompositeOperation = 'lighter'; const uS = (tau - TF + 0.06) / 0.38, surge = uS > -0.2 && uS < 1.3;
        for (let j = 0; j < NS; j++) { if (j % 3 === 2 && !surge) continue; const uu = UU[j], u = u0 + Math.pow(uu, 1.35) * (1 - u0), r = rad(u); if (r < 1) continue; const x = AX[j], y = AY[j], boost = surge ? 2.2 * Math.exp(-Math.pow((u - uS) / 0.1, 2)) : 0;
          const a = ga * sm(uu / 0.1) * sm((1 - uu) / 0.16) * (0.8 + boost) * dimAt(x, y, r) * edge(y); if (a < 0.01) continue;
          const phi = sp * tau * 7 + u * TW + t.ph + 1.9, fi = ((Math.round(phi / TAU * NF) % NF) + NF) % NF, sc = r / BRX, w = BW * sc, hh = BH * Math.min(sc * 1.9, Math.max(sc, T * 0.0105)); c.globalAlpha = Math.min(1, a); c.drawImage(light(fi), x - w / 2, y - hh / 2, w, hh); }
        if (surge && uS > 0 && uS < 1.1) { const u = cl(uS), r = rad(u) * 1.25; c.globalAlpha = 0.5 * (1 - 0.5 * u) * ga; c.drawImage(glowSprite(PALE), ax(u) - r, ay(u) - r * 0.6, r * 2, r * 1.2); }
        // thin white cutting streaks wound round it, faster than the bands, crawling upward (ends faded, the back faint)
        c.strokeStyle = WHITE; c.lineCap = 'round'; c.lineWidth = Math.max(1.2, T * 0.05);
        for (let st = 0; st < NSTR; st++) { const ua = ((tau * 0.42 + st / NSTR + t.ph) % 1) * 0.72, pB = new Path2D(), pM = new Path2D(), pF = new Path2D(); let prev = null;
          for (let j = 0; j <= 12; j++) { const u = u0 + (ua + j * 0.028) * (1 - u0), th = sp * tau * 11 + u * 7 + st * 2.4 + t.ph, r = rad(u) * 1.04, x = ax(u) + Math.cos(th) * r, y = ay(u) + Math.sin(th) * r * SQ, fr = Math.sin(th) > 0.05, w = Math.sin(Math.PI * j / 12);
            if (prev) { const P = !prev.fr || !fr ? pB : w > 0.55 ? pF : pM; P.moveTo(prev.x, prev.y); P.lineTo(x, y); } prev = { x, y, fr }; }
          c.globalAlpha = 0.16 * ga * eT; c.stroke(pB); c.globalAlpha = 0.5 * ga * eT; c.stroke(pM); c.globalAlpha = 0.95 * ga * eT; c.stroke(pF); }
        c.globalCompositeOperation = 'source-over'; }
      drawItems(true);
      c.restore(); }
  };
  U.terribletornado.warm = () => { if (idle || bakeI >= JOBS.length) return; idle = true; const step = () => { bakeSome(4); if (bakeI < JOBS.length) setTimeout(step, 40); else idle = false; }; setTimeout(step, 300); };
  U.terribletornado.__dbg = { JOBS, SPR, bakeSome, plan, minSep, fitView, DBG, get bakeI() { return bakeI; } };
})();
