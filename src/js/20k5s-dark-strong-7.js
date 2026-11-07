/* ---------- Dark Strong, new: Shadow Seam ----------
   Replaces Hollow Lantern (row in 20k1: key 'shadowseam', cost 26, cd 3, glyph 'crescent').
   The pet tears a narrow jagged seam in the air a step ahead of it (near-black inside, a fine violet-white border, a
   violet glow, drifting crimson sparks) and fires razor-thin crescents of darkness out of it down the aimed corridor in
   a rapid sequence. Their planes alternate diagonal left, diagonal right, near-horizontal (lying almost flat), so
   successive crescents cross. Each crescent: a sharp luminous violet-white outer edge, a smoky indigo body lit as a
   bevelled, cupped blade (a per-pixel lit sprite: knife bevel along the outer edge, convex body, tips curling out of the
   plane, Fresnel violet rim, a gloss line), fading to nothing at its inner edge, with streaks of violet smoke flowing
   from its middle out to the tips (4 baked phases cross-faded); two fading afterimages trail it and a violet light
   streak runs on the floor beneath (light only). As one passes through a monster it leaves a brief luminous cut and a
   spray of dark crystalline sparks. Along its path it leaves suspended violet fractures that close from the ends and
   dissolve (decorative: they never deal damage). At Celestial the final crescent is 1.45x broader (its hitbox too)
   with a crimson filament, and its closing fracture is a ring of angular runes that turns and seals shut.

   Counts (C.evo, held until the breakpoints): 3 crescents at levels 1-3, 5 at 4-6, 7 at 7 (Celestial).
   Gameplay: every crescent flies straight down the cast's corridor (fixed at the cast: from the seam, along the aim) at
   15 tiles/s up to 7.5 tiles, or until its centre meets a solid tile (the game's projectile rule: pet shots stop on
   solid tiles, fly over gaps). Swept collision: each frame a monster is struck if its circle overlaps the band the
   crescent swept since last frame (along the corridor, its depth included) within the crescent's half-reach across the
   corridor (0.58 tiles, 0.84 for the broad Celestial final, = 0.85 x its drawn half-span) and the line from the corridor
   to the monster is clear of solid tiles (line of sight). Each crescent strikes each monster at most once; later
   crescents may strike it again. Fractures, seam and sparks deal nothing.
   Damage (DK = base x K x (1 + 0.08 (evo - 1))): a monster struck by every crescent takes TOT = 2.6 / 3.4 / 4.2 DK at
   3 / 5 / 7 crescents (2.6 / 4.22 / 6.22 x base x K at levels 1 / 4 / 7), split evenly, except that the Celestial final
   crescent weighs 1.5: L1 0.867 each; L4 0.68 each; L7 0.56 x 6 + 0.84 (x DK). kb 1 a crescent.
   All of it is in S.shadowseam.cfg (tunable).
   Commitment: the cast is committed when it starts; if the pet dies or is swapped out before a crescent leaves the
   seam, that crescent and every later one are cancelled and the seam zips shut; crescents already released fly on.
   Pictures: the crescent sprites are baked in the crescent's own plane (an affine draws them in any orientation): one
   lit body per plane and aim bucket (3 planes x 16 buckets, lazily, ~1 ms each), one shared additive edge layer and 4
   shared texture phases; baked in slices on a small per-frame budget (Strongs are not prewarmed; S.shadowseam.warm
   exists for the shared layers); a vector arc stands in for anything not yet baked. Crescents and the seam are
   depth-sorted among the monsters (entY / drawEnt). Sounds: a low tearing hiss as the seam opens, a sharp airy cut per
   crescent (a high falling note over a hiss), a soft crack on hits, a chime on the Celestial final. */
(() => {
  const S = ELEM_IMPL.dark.strong; delete S.hollowlantern;
  const TAU = Math.PI * 2, GY = 0.55;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const INDIGO = '#231B5A', PALE = '#F3ECFF', CRIM = '#D0183F', RUBY = '#FF2D55';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const hx = h => hexRGB(h);
  const cV = hx(VOID), cB = hx(BODY), cP = hx(PLUM), cI = hx(INDIGO), cS = hx(SMOKE), cE = hx(ENERGY), cG = hx(EDGE), cA = hx(ACC), cW = hx(PALE), cR = hx(RUBY);
  let H;

  /* ---- tuning ---- */
  const CFG = {
    counts: [3, 5, 7],            // crescents at levels 1-3 / 4-6 / 7
    tot: [2.6, 3.4, 4.2],         // total x DK for a monster struck by every crescent, per tier
    finalW: 1.5,                  // the Celestial final crescent's weight in that split
    evoK: 0.08,                   // DK = base x K x (1 + evoK (evo - 1))
    speed: 15, range: 7.5,        // tiles/s, tiles
    gap: [0.13, 0.11, 0.1],       // seconds between crescents, per tier
    open: 0.2,                    // the seam opens before the first crescent leaves
    seamD: 0.95, z: 0.5,          // the seam's distance ahead of the pet and the crescents' flight height (tiles)
    size: 0.8,                    // tiles per crescent unit (its drawn half-span is 0.97 units)
    reach: 0.85,                  // hitbox half-reach = reach x the drawn half-span
    depth: 0.3,                   // the crescent's depth along the corridor (tiles, swept with it)
    finalScale: 1.45,             // the Celestial final crescent is this much broader (hitbox too)
    kb: 1,
  };

  /* ---- the crescent's shape, in its own plane: u forward (the bulge), v along the chord; units ---- */
  const COU = -0.7, CIU = -1.2, RO = 1, RI = 1, PHM = 1.82;   // outer circle (COU, 0) r RO, inner circle (CIU, 0) r RI; the tips at |phi| ~ 104 deg
  const U0 = -1.02, U1 = 0.42, V0 = -1.08, V1 = 1.08, PPU = 48, SW = Math.round((U1 - U0) * PPU), SH = Math.round((V1 - V0) * PPU), HALF = 0.97;
  const PLANES = 3, NB = 16, TILT = 0.78, FLATR = 0.26;          // planes: 0 diagonal left, 1 diagonal right, 2 near-horizontal (rolled FLATR off flat)
  // a small value noise
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = q => q * q * (3 - 2 * q), h = (i, j) => R1(i * 57.1 + j * 131.7);
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), s(xf)), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), s(xf)), s(yf)); };
  const fbm = (x, y) => vn(x, y) * 0.6 + vn(x * 2.1 + 5.3, y * 2.1 + 1.7) * 0.3 + vn(x * 4.3 + 9.1, y * 4.3 + 3.3) * 0.1;
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // world (x right, y toward the viewer on the floor, z up) -> view (x right, y down the screen, z toward the viewer); the camera looks down ~33 deg
  const SN = GY, CS = Math.sqrt(1 - GY * GY), toView = w => [w[0], w[1] * SN - w[2] * CS, w[1] * CS + w[2] * SN];
  const LD = nrm([-0.5, -0.78, 0.55]), HV = nrm([LD[0], LD[1], LD[2] + 1]);

  /* the crescent's orientation for an aim (floor angle a) and a plane: its screen affine (px per unit / T) and its 3D basis
     F the bulge, B the chord (screen 2-vectors), and the lighting basis in view space */
  function orient(a, plane) {
    const ca = Math.cos(a), sa = Math.sin(a), dsl = Math.hypot(ca, sa * GY), dsx = ca / dsl, dsy = sa * GY / dsl;
    const d3 = [ca, sa, 0]; let F, B, e3;
    if (plane === 2) { // near-horizontal: the chord along the floor's side, rolled a little up
      const side = [-sa, ca, 0], r = FLATR * (ca >= 0 ? 1 : -1); e3 = [side[0] * Math.cos(r), side[1] * Math.cos(r), Math.sin(r)];
      F = [ca, sa * GY]; B = [e3[0], e3[1] * GY - e3[2]];
    } else { // diagonal: a standing blade whose chord leans TILT off the screen perpendicular of the aim, left or right
      const px = -dsy, py = dsx, t = plane === 0 ? -TILT : TILT, bx = px * Math.cos(t) - py * Math.sin(t), by = px * Math.sin(t) + py * Math.cos(t);
      F = [ca, sa * GY]; B = [bx, by]; e3 = nrm([bx, 0.15 * by, -by]);
    }
    // keep the chord's +v pointing up-screen-ish so the lighting basis is consistent
    let N = nrm(cross(d3, e3)); const nv = toView(N); if (nv[2] < 0) N = [-N[0], -N[1], -N[2]];
    return { F, B, Fv: toView(d3), Bv: toView(e3), Nv: toView(N), dsx, dsy };
  }

  /* ---- sprites ---- */
  const spr = {}, jobs = [], queued = new Set();
  function queue(key, it, front) { if (spr[key] || queued.has(key)) return; queued.add(key); if (front) jobs.unshift(it); else jobs.push(it); }
  function pump(ms) { const t0 = now(); while (jobs.length && now() - t0 < ms) { if (jobs[0].next().done) jobs.shift(); } }
  // the per-pixel geometry of the crescent at sprite pixel (px, py)
  const Q = { u: 0, v: 0, dox: 0, dO: 0, oD: 0, iD: 0, phi: 0, s: 0, w: 0, ru: 0, rv: 0 };   // (one scratch record: no garbage per pixel)
  function geo(px, py) {
    const u = U0 + (px + 0.5) / PPU, v = V0 + (py + 0.5) / PPU, dox = u - COU, dO = Math.hypot(dox, v), dI = Math.hypot(u - CIU, v);
    const oD = (RO - dO) * PPU, iD = (dI - RI) * PPU, phi = Math.atan2(v, dox);
    Q.u = u; Q.v = v; Q.dox = dox; Q.dO = dO; Q.oD = oD; Q.iD = iD; Q.phi = phi; Q.s = Math.max(-1, Math.min(1, phi / PHM));
    Q.w = oD > 0 && iD > 0 ? iD / (iD + oD) : (oD <= 0 ? 1 : 0); Q.ru = dox / (dO || 1); Q.rv = v / (dO || 1); return Q;
  }
  // the lit body (source-over): smoky indigo, a knife bevel on the outer edge, cupped toward the tips, fading to 0 at the inner edge
  function* bakeBody(key, plane, bk) {
    const O = orient(bk / NB * TAU, plane), cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
    const g = cv.getContext('2d'), im = g.createImageData(SW, SH), d = im.data, Fv = O.Fv, Bv = O.Bv, Nv = O.Nv;
    let r = 0, gg = 0, b = 0; const sh = (c1, k) => { r = lerp(r, c1[0], k); gg = lerp(gg, c1[1], k); b = lerp(b, c1[2], k); };
    for (let py = 0; py < SH; py++) { if (py % 3 === 2) yield; for (let px = 0; px < SW; px++) {
      const q = geo(px, py); if (q.oD < -0.6 || q.iD <= 0) continue;
      const cov = cl(q.oD + 0.5), as = Math.abs(q.s), w = q.w, n1 = fbm(Math.abs(q.phi) * 3.4 + 2.1, w * 2.8 + 0.7);
      // alpha: nothing at the inner edge, wisps of smoke eating into it, full toward the edge; thinner at the tips
      let a = cov * Math.pow(sstep(0.0, 0.78, w + (n1 - 0.5) * 0.42), 1.25) * (1 - 0.35 * sstep(0.78, 1, as));
      if (a < 0.01) continue;
      // the normal: out of the plane, tipped outward by the bevel (steep near the edge), tipped along the length by the cup
      const bev = w > 0.7 ? 0.25 + 1.05 * sstep(0.7, 1, w) : (w - 0.45) * 0.55, cup = q.s * 0.6;
      const cb = Math.cos(bev), sb = Math.sin(bev), cc = Math.cos(cup), sc = Math.sin(cup), ru = q.ru, rv = q.rv;
      let n0 = Nv[0] * cb * cc + (ru * Fv[0] + rv * Bv[0]) * sb + (-rv * Fv[0] + ru * Bv[0]) * sc, n1v = Nv[1] * cb * cc + (ru * Fv[1] + rv * Bv[1]) * sb + (-rv * Fv[1] + ru * Bv[1]) * sc, n2 = Nv[2] * cb * cc + (ru * Fv[2] + rv * Bv[2]) * sb + (-rv * Fv[2] + ru * Bv[2]) * sc;
      const nl = Math.hypot(n0, n1v, n2) || 1; n0 /= nl; n1v /= nl; n2 /= nl;
      const nz = Math.max(0, n2), dif = Math.max(0, n0 * LD[0] + n1v * LD[1] + n2 * LD[2]), nh = Math.max(0, n0 * HV[0] + n1v * HV[1] + n2 * HV[2]);
      const spec = Math.pow(nh, 36), broad = Math.pow(nh, 6), fr = Math.pow(1 - nz, 2.2);
      // the smoke body: void in the shade, indigo and smoky violet toward the light, marbled
      const lum = cl(dif * 0.85 + (n1 - 0.5) * 0.45 + 0.08);
      r = cV[0]; gg = cV[1]; b = cV[2];
      sh(cB, sstep(0, 0.3, lum)); sh(cI, sstep(0.2, 0.7, lum) * 0.95); sh(cS, sstep(0.6, 1, lum) * 0.6); sh(cP, (1 - w) * 0.35);
      // energy toward the edge, the violet Fresnel rim, the bevel catching the light
      sh(cE, sstep(0.55, 0.92, w) * 0.5); sh(cG, fr * 0.55 * sstep(0.4, 0.9, w));
      const add = broad * 0.22 * sstep(0.5, 0.95, w), sp = spec * 0.85 * sstep(0.62, 0.9, w);
      r += (cA[0] - r) * add + 255 * sp; gg += (cA[1] - gg) * add + 255 * sp; b += (cA[2] - b) * add + 255 * sp;
      const i = (py * SW + px) * 4; d[i] = Math.min(255, r); d[i + 1] = Math.min(255, gg); d[i + 2] = Math.min(255, b); d[i + 3] = Math.round(255 * cl(a * 0.94));
    } }
    yield; g.putImageData(im, 0, 0); spr[key] = cv;
  }
  // the luminous edge (additive): a crisp violet-white line on the outer edge, a violet halo either side, tapering at the tips
  function* bakeEdge() {
    const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH; const g = cv.getContext('2d'), im = g.createImageData(SW, SH), d = im.data;
    for (let py = 0; py < SH; py++) { if (py % 4 === 3) yield; for (let px = 0; px < SW; px++) {
      const q = geo(px, py); if (q.oD < -6 || q.oD > 14) continue;
      // only along the crescent: inside the inner circle's cut it doesn't exist; just past the tips it fades
      const along = 1 - sstep(0.93, 1.06, Math.abs(q.phi) / PHM); if (along <= 0) continue;
      const inside = q.iD > -1.5 ? 1 : 0; if (!inside && q.oD > 0) continue;
      const tip = 1 - 0.55 * sstep(0.6, 1, Math.abs(q.s));
      const core = Math.exp(-Math.pow((q.oD - 0.6) / 0.95, 2)) * tip, halo = Math.exp(-Math.pow((q.oD - 1.2) / 3.4, 2)) * 0.5 * tip, inner = q.oD > 0 ? Math.exp(-Math.pow((q.oD - 4) / 3.2, 2)) * 0.22 * cl(q.iD / 3) : 0;
      const a = cl((core + halo + inner) * along); if (a < 0.01) continue;
      const k = cl(core / Math.max(1e-3, core + halo + inner));
      const i = (py * SW + px) * 4; d[i] = lerp(cG[0], cW[0], k); d[i + 1] = lerp(cG[1], cW[1], k); d[i + 2] = lerp(cG[2], cW[2], k); d[i + 3] = Math.round(255 * a);
    } }
    yield; g.putImageData(im, 0, 0); spr.edge = cv;
  }
  // the moving texture (additive, 4 phases): violet smoke streaks flowing from the middle out to the tips
  function* bakeTex() {   // (all four phases in one pass: the noise is shared)
    const cvs = [], ims = []; for (let k = 0; k < 4; k++) { const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH; cvs.push(cv); ims.push(cv.getContext('2d').createImageData(SW, SH)); }
    for (let py = 0; py < SH; py++) { if (py % 4 === 3) yield; for (let px = 0; px < SW; px++) {
      const q = geo(px, py); if (q.oD < 0 || q.iD <= 0) continue;
      const w = q.w, ap = Math.abs(q.phi), env = sstep(0.12, 0.5, w) * (1 - sstep(0.86, 1, w)) * (1 - sstep(0.8, 1, Math.abs(q.s))) * cl(q.oD) * cl(q.iD); if (env <= 0.01) continue;
      const n2 = fbm(ap * 2.2 + 11.3, w * 3.1 + 4.2), n3 = fbm(ap * 4.5 + 3.7, w * 6.0 + 8.8), i = (py * SW + px) * 4;
      for (let k = 0; k < 4; k++) { const ph = k * Math.PI / 2, d = ims[k].data;
        const s1 = Math.pow(0.5 + 0.5 * Math.sin(ap * 7.5 - w * 4.5 + n2 * 4.2 - ph), 3), s2 = Math.pow(0.5 + 0.5 * Math.sin(ap * 15 + w * 3 + n3 * 3.5 - ph * 2), 4);
        const a = cl((s1 * 0.4 + s2 * 0.22) * env); if (a < 0.01) continue;
        const kk = cl(s2 * 0.8 + w * 0.3); d[i] = lerp(cE[0], cA[0], kk); d[i + 1] = lerp(cE[1], cA[1], kk); d[i + 2] = lerp(cE[2], cA[2], kk); d[i + 3] = Math.round(255 * a); }
    } }
    for (let k = 0; k < 4; k++) { yield; cvs[k].getContext('2d').putImageData(ims[k], 0, 0); spr['tex' + k] = cvs[k]; }
  }
  function* bakeStatic() { yield* bakeEdge(); streakSpr(); yield* bakeTex(); }
  const wantStatic = () => { if (!spr.tex3) queue('static', bakeStatic(), true); };
  const bodyKey = (plane, a) => { const bk = ((Math.round(a / TAU * NB) % NB) + NB) % NB; return { key: 'b' + plane + '_' + bk, bk }; };
  function wantBody(plane, a) { const { key, bk } = bodyKey(plane, a); if (!spr[key]) queue(key, bakeBody(key, plane, bk)); return key; }
  // a floor light streak, feathered at both ends and across
  const streakSpr = () => fxSprite('dk7streak', 128, 32, g => { let gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, 'rgba(165,92,255,0)'); gr.addColorStop(0.3, 'rgba(165,92,255,0.25)'); gr.addColorStop(0.5, 'rgba(208,174,255,0.85)'); gr.addColorStop(0.7, 'rgba(165,92,255,0.25)'); gr.addColorStop(1, 'rgba(165,92,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 32);
    g.globalCompositeOperation = 'destination-in'; gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.7)'); gr.addColorStop(0.92, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 32); });
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  const segClear = (x0, y0, x1, y1) => { const dd = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(dd / 0.2)); for (let i = 1; i < n; i++) { const t = i / n; if (H.X.blocked(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0.04, 1)) return false; } return true; };
  // a jagged polyline between two screen points (seeded), with its ends drawn in to `k` (1 open, 0 closed to the centre)
  function jag(x0, y0, x1, y1, n, amp, seed, k) { const pts = [], mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    for (let i = 0; i <= n; i++) { const t = (i / n - 0.5) * k, j = (i === 0 || i === n) ? 0 : (R1(seed + i * 3.1) - 0.5) * 2 * amp; pts.push([mx + dx * t + nx * j, my + dy * t + ny * j]); } return pts; }
  const strokePts = (c, pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); };

  S.shadowseam = (C, h) => {
    H = h; const me = H.me, a = C.a, ca = Math.cos(a), sa = Math.sin(a), evo = evoOf(C), tier = evo >= 7 ? 2 : evo >= 4 ? 1 : 0, n = CFG.counts[tier], cel = tier === 2;
    const DK = C.base * C.K * (1 + CFG.evoK * (evo - 1)), wts = []; for (let i = 0; i < n; i++) wts.push(cel && i === n - 1 ? CFG.finalW : 1);
    const wsum = wts.reduce((p, q) => p + q, 0), dmgs = wts.map(w => DK * CFG.tot[tier] * w / wsum), GAP = CFG.gap[tier], V = CFG.speed;
    const P0 = H.X.pet ? H.X.pet() : null, ST0 = H.X.ST ? H.X.ST() : null, swapped = () => (P0 ? H.X.pet() !== P0 : (ST0 && H.X.ST() !== ST0));
    const sfx = H.X.sfx, note = (...q) => sfx.note && sfx.note(...q), hiss = (...q) => sfx.hiss && sfx.hiss(...q);
    // the seam: a step ahead (pulled back to the pet if a wall is in the way); the corridor's length from there to the first solid tile
    let ox = me.x + ca * CFG.seamD, oy = me.y + sa * CFG.seamD; if (!segClear(me.x, me.y, ox, oy) || H.X.blocked(ox, oy, 0.08, 1)) { ox = me.x + ca * 0.2; oy = me.y + sa * 0.2; }
    let Lmax = CFG.range; for (let s = 0.15; s < CFG.range; s += 0.15) if (H.X.blocked(ox + ca * s, oy + sa * s, 0.08, 1)) { Lmax = Math.max(0.15, s - 0.1); break; }
    const flight = Lmax / V, PLN = [0, 1, 2];
    const cres = []; for (let i = 0; i < n; i++) { const fin = cel && i === n - 1, plane = PLN[i % 3], O = orient(a, plane);
      cres.push({ i, fin, plane, O, sc: CFG.size * (fin ? CFG.finalScale : 1), W: CFG.size * (fin ? CFG.finalScale : 1) * HALF * CFG.reach, dmg: dmgs[i], tr: CFG.open + i * GAP, state: 'wait', s: 0, sPrev: -0.6, hits: new Set(), nextFr: 0.55, seed: R1(i * 7.7 + a * 3.3) * 50, end: 0, wall: Lmax < CFG.range - 0.01, fx: null, bodyKey: null }); }
    // bake: shared layers first, then this aim's three bodies; a small slice right now
    // (the first crescent's body first, then the shared edge and texture, then the other two bodies)
    wantBody(PLN[0], a); wantStatic(); for (const p of PLN) wantBody(p, a); pump(1.6);
    hiss(0.32, 0.1, 700); note(150, 0.38, 'sawtooth', 0.045, 85); me.sq = 0.75;
    const lastRel = cres[n - 1].tr, life = lastRel + flight + (cel ? 1.45 : 0.9) + 0.3;
    const fr = [], cuts = [];   // suspended fractures; the luminous cuts on struck monsters
    const seam = { open: 0, close: 0, closeT: null, flare: 0, cancelled: false };
    const dbg = { hits: cres.map(() => 0), n, Lmax, dmgs, released: 0, cancelled: 0 };
    const SX = () => H.sx(ox), SYf = () => H.sy(oy), T = () => H.X.Tz();
    const petK = (x, y, T0) => { const PX = H.sx(me.x), PY = H.sy(me.y) - T0 * 0.45; return lerp(0.35, 1, sstep(T0 * 0.4, T0 * 1.0, Math.hypot(x - PX, y - PY))); };
    const kids = [];
    function release(cr) {
      cr.state = 'fly'; dbg.released++; seam.flare = 1; cr.bodyKey = wantBody(cr.plane, a);
      hiss(0.08, 0.16, 3400 + cr.i * 180); note(2300 - cr.i * 90, 0.1, 'sine', 0.05, 700);
      if (cr.fin) { sfx.chime && sfx.chime(988, 0.5); hiss(0.14, 0.18, 2400); }
      H.X.light && H.X.light(ox, oy, 1.6, 0.18);
      cr.fx = H.add({ key: 'shadowseamC', life: 30, entY: oy + 0.02, drawEnt: c => drawCrescent(c, cr) }); kids.push(cr.fx);
    }
    function strike(cr, m) {
      cr.hits.add(m); dbg.hits[cr.i]++;
      H.X.hitMon(m, cr.dmg, C.dmgO({ kb: CFG.kb }));
      cuts.push({ x: m.x, y: m.y, z: Math.min(1.1, (m.r || 0.4) * 1.1 + 0.15), t0: F.t, B: cr.O.B, len: (m.r || 0.4) * 2.4 + 0.5, fin: cr.fin, seed: R1(cr.seed + cuts.length) * 40 });
      H.burst(m.x, m.y - 0.45, 'shard', cr.fin ? 7 : 4, { v: 5, up: 2.2, g: 9, life: 0.5, size: 3, color: ['#1B0E33', PLUM, '#3A1F66', ACC] });
      H.burst(m.x, m.y - 0.45, 'spark', cr.fin ? 6 : 3, { v: 4.5, up: 1.2, life: 0.32, size: 1.6, color: [EDGE, PALE] });
      H.glowAt(m.x, m.y - 0.4, 0.7, 0.18, EDGE, 0.5);
      if (cr.hits.size === 1) { sfx.crack && sfx.crack(); H.X.hitstop(cr.fin ? 0.045 : 0.02); if (!RM()) H.X.shake(cr.fin ? 4 : 2, 0.1); }
    }
    function addFracture(cr, s, big) { if (fr.length > 70) return; fr.push({ x: ox + ca * s, y: oy + sa * s, t0: F.t, B: cr.O.B, len: cr.sc * HALF * (big ? 1.25 : 0.55 + 0.25 * R1(cr.seed + s)), seed: R1(cr.seed * 3 + s * 7) * 60, rune: cr.fin, ring: big && cr.fin, big }); }
    function update(dt, f) {
      const t = f.t, dead = me.dead || swapped(); pump(t < lastRel + 0.1 && jobs.length ? 1.8 : 1.1);
      // the seam
      if (!seam.cancelled && dead && cres.some(cr => cr.state === 'wait')) { seam.cancelled = true; for (const cr of cres) if (cr.state === 'wait') { cr.state = 'gone'; dbg.cancelled++; } seam.closeT = t; dbg.interrupted = me.dead ? 'death' : 'swap'; }
      seam.open = sstep(0, CFG.open, t); if (seam.closeT == null && t > lastRel + 0.12) seam.closeT = t; seam.close = seam.closeT == null ? 0 : sstep(0, 0.24, t - seam.closeT); seam.flare = Math.max(0, seam.flare - dt * 6);
      if (seam.close < 1 && seam.open > 0.3 && Math.random() < 0.55 * H.Q()) { const side = Math.random() < 0.5 ? -1 : 1; H.P({ kind: 'spark', x: ox + (Math.random() - 0.5) * 0.5, y: oy - CFG.z, vx: (Math.random() - 0.5) * 1.2 + side * 0.4, vy: -0.4 - Math.random() * 0.8, life: 0.55, max: 0.55, size: 1.5, color: Math.random() < 0.7 ? RUBY : CRIM }); }
      // the crescents
      for (const cr of cres) {
        if (cr.state === 'wait' && t >= cr.tr) release(cr);
        if (cr.state !== 'fly') continue;
        const s1 = Math.min(Lmax, (t - cr.tr) * V);
        for (const m of H.living()) { if (cr.hits.has(m)) continue; const rx = m.x - ox, ry = m.y - oy, al = rx * ca + ry * sa, of = Math.abs(-rx * sa + ry * ca), mr = m.r || 0.4;
          if (al + mr < cr.sPrev - CFG.depth || al - mr > s1 + CFG.depth * 0.3 || of > cr.W + mr) continue;
          const q = Math.max(0, Math.min(s1, al)); if (!segClear(ox + ca * q, oy + sa * q, m.x, m.y)) continue;
          strike(cr, m); }
        while (cr.nextFr < s1 - 0.25) { addFracture(cr, cr.nextFr, false); cr.nextFr += 1.05 + 0.35 * R1(cr.seed + cr.nextFr); }
        cr.sPrev = s1; cr.s = s1; cr.fx.entY = oy + sa * s1 + 0.02;
        if (Math.random() < 0.5 * H.Q()) H.P({ kind: 'spark', x: ox + ca * (s1 - 0.2) + (Math.random() - 0.5) * 0.3, y: oy + sa * (s1 - 0.2) - CFG.z, vx: -ca * 1.5 + (Math.random() - 0.5), vy: -sa * 0.9 - 0.3, life: 0.3, max: 0.3, size: 1.3, color: cr.fin && Math.random() < 0.4 ? RUBY : EDGE });
        if (s1 >= Lmax) { cr.state = 'end'; cr.end = t; addFracture(cr, Lmax, true);
          if (cr.wall) { const ex = ox + ca * Lmax, ey = oy + sa * Lmax; H.burst(ex, ey - CFG.z, 'shard', 4, { v: 4, up: 1.5, g: 8, life: 0.45, size: 2.6, color: ['#1B0E33', PLUM, ACC] }); H.glowAt(ex, ey - CFG.z, 0.8, 0.2, EDGE, 0.5); } }
      }
      for (const cr of cres) if (cr.state === 'end' && t - cr.end > 0.14) { cr.state = 'gone'; if (cr.fx) cr.fx.life = 0; }
      for (let i = cuts.length - 1; i >= 0; i--) if (t - cuts[i].t0 > 0.3) cuts.splice(i, 1);
      for (let i = fr.length - 1; i >= 0; i--) if (t - fr[i].t0 > (fr[i].ring ? 1.25 : 0.7)) fr.splice(i, 1);
      if (cres.every(cr => cr.state === 'gone') && seam.close >= 1 && !fr.length && !cuts.length) f.life = Math.min(f.life, 0.01);
    }
    /* ---- the crescent: afterimages, the lit body, the flowing texture, the luminous edge; a vector fallback ---- */
    function drawCrescent(c, cr) {
      const T0 = T(), t = F.t, s = cr.s, fadeIn = sstep(0, 0.06, t - cr.tr), fadeOut = cr.state === 'end' ? 1 - sstep(0, 0.14, t - cr.end) : 1, tail = 1 - 0.35 * sstep(Lmax - 1.2, Lmax, s);
      const A = fadeIn * fadeOut * tail; if (A < 0.01 || cr.state === 'gone') return;
      const k = T0 * cr.sc * (1 + 0.04 * Math.sin(t * 30 + cr.seed)), O = cr.O, Fx = O.F[0] * k, Fy = O.F[1] * k, Bx = O.B[0] * k, By = O.B[1] * k;
      const body = cr.bodyKey && spr[cr.bodyKey], edge = spr.edge, ph = (t * 7 + cr.seed) % 4, i0 = Math.floor(ph), fk = ph - i0, t0 = spr['tex' + i0], t1 = spr['tex' + ((i0 + 1) % 4)];
      const at = (ss, z) => [H.sx(ox + ca * ss), H.sy(oy + sa * ss) - z * T0];
      const draw1 = (ss, aa, full) => { const [PX, PY] = at(ss, CFG.z); const pk = petK(PX, PY, T0) * aa; if (pk < 0.01) return;
        c.save(); c.translate(PX, PY); c.transform(Fx, Fy, Bx, By, 0, 0);
        if (full && body) { c.globalAlpha = pk; c.drawImage(body, U0, V0, U1 - U0, V1 - V0); }
        else if (full) { // its body isn't baked yet: a plain vector crescent
          c.globalAlpha = pk * 0.8; c.fillStyle = INDIGO; c.beginPath(); c.arc(COU, 0, RO, -PHM, PHM); c.arc(CIU, 0, RI, PHM * 0.97, -PHM * 0.97, true); c.closePath(); c.fill(); }
        c.globalCompositeOperation = 'lighter';
        if (full && t0 && t1) { c.globalAlpha = pk * (1 - fk) * 0.9; c.drawImage(t0, U0, V0, U1 - U0, V1 - V0); c.globalAlpha = pk * fk * 0.9; c.drawImage(t1, U0, V0, U1 - U0, V1 - V0); }
        if (edge) { c.globalAlpha = pk * (full ? 1 : 0.7); c.drawImage(edge, U0, V0, U1 - U0, V1 - V0); }
        else { c.globalAlpha = pk; c.strokeStyle = PALE; c.lineWidth = 2 / k * 1.2; c.beginPath(); c.arc(COU, 0, RO, -PHM, PHM); c.stroke(); }
        if (cr.fin && full) { c.globalAlpha = pk * 0.85; c.strokeStyle = RUBY; c.lineWidth = 1.4 / k; c.beginPath(); c.arc(COU - 0.06, 0, RO, -PHM * 0.8, PHM * 0.8); c.stroke(); }
        c.restore(); };
      // the glow, the afterimages behind, then the crescent itself
      const [GX, GYc] = at(s, CFG.z); c.save(); glow(c, GX + O.dsx * k * 0.05, GYc + O.dsy * k * 0.05, k * (cr.fin ? 1.7 : 1.35), cr.fin ? EDGE : ENERGY, 0.32 * A * petK(GX, GYc, T0)); c.restore();
      if (H.Q() > 0.5) { if (s > 0.5) draw1(s - 0.36 * cr.sc / CFG.size, A * 0.32, false); if (s > 0.9) draw1(s - 0.72 * cr.sc / CFG.size, A * 0.13, false); }
      draw1(s, A, true);
    }
    /* ---- the seam: a jagged tear, near-black inside, a fine violet-white border, a violet halo ---- */
    const seamJ = []; for (let i = 0; i <= 12; i++) seamJ.push([R1(a * 5.1 + i * 1.7), R1(a * 2.3 + i * 4.9), R1(a + i * 9.3)]);
    function drawSeam(c) {
      if (seam.close >= 1 || seam.open <= 0) return; const T0 = T(), OX = SX(), OY = SYf() - (CFG.z + 0.05) * T0, len = T0 * CFG.size * HALF * (cel ? 1.18 : 1.05) * lerp(0.25, 1, H.ease.out(seam.open)) * (1 - seam.close * 0.9);
      // the slit lies along the screen perpendicular of the aim, leaned a little; it opens across
      const px = -cres[0].O.dsy, py = cres[0].O.dsx, lean = 0.22, ax = px * Math.cos(lean) - py * Math.sin(lean), ay = px * Math.sin(lean) + py * Math.cos(lean), nx = -ay, ny = ax;
      const wid = T0 * (0.085 + 0.06 * seam.flare) * sstep(0.2, 1, seam.open) * (1 - seam.close), pk = petK(OX, OY, T0), N = 12, L = [], R = [];
      for (let i = 0; i <= N; i++) { const l = i / N * 2 - 1, j = seamJ[i], prof = Math.pow(Math.max(0, 1 - l * l), 0.75), along = l + (j[2] - 0.5) * 0.06, cx = OX + ax * len * along, cy = OY + ay * len * along;
        L.push([cx + nx * wid * prof * (0.55 + 0.9 * j[0]), cy + ny * wid * prof * (0.55 + 0.9 * j[0])]); R.push([cx - nx * wid * prof * (0.55 + 0.9 * j[1]), cy - ny * wid * prof * (0.55 + 0.9 * j[1])]); }
      c.save(); c.globalAlpha = pk; glow(c, OX, OY, len * 1.35, ENERGY, (0.4 + 0.3 * seam.flare) * pk); glow(c, OX, OY, len * 0.6, CRIM, 0.12 * pk);
      c.globalAlpha = pk; c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (let i = 1; i <= N; i++) c.lineTo(L[i][0], L[i][1]); for (let i = N; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath();
      c.fillStyle = '#05020A'; c.fill();
      c.lineJoin = 'miter'; c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(EDGE, 0.55); c.lineWidth = Math.max(2, T0 * 0.09); c.stroke();
      c.strokeStyle = H.rgba(PALE, 0.95); c.lineWidth = Math.max(1, T0 * 0.03); c.stroke();
      // a faint violet depth inside, a crimson thread down its middle
      c.strokeStyle = H.rgba(CRIM, 0.35 + 0.3 * seam.flare); c.lineWidth = Math.max(1, T0 * 0.025); c.beginPath(); for (let i = 1; i < N; i++) { const x = (L[i][0] + R[i][0]) / 2, y = (L[i][1] + R[i][1]) / 2; i > 1 ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      c.restore();
    }
    /* ---- the floor: a violet light streak under each crescent (light only) ---- */
    function drawUnder(c, f) {
      const T0 = T(); c.save(); c.globalCompositeOperation = 'lighter';
      for (const cr of cres) { if (cr.state !== 'fly' && cr.state !== 'end') continue; const s = cr.s, s0 = Math.max(0, s - 2.2), A = cr.state === 'end' ? 1 - sstep(0, 0.14, f.t - cr.end) : 1; if (s - s0 < 0.1) continue;
        const X0 = H.sx(ox + ca * s0), Y0 = H.sy(oy + sa * s0), X1 = H.sx(ox + ca * s), Y1 = H.sy(oy + sa * s), l = Math.hypot(X1 - X0, Y1 - Y0); if (l < 1) continue;
        c.save(); c.translate(X0, Y0); c.rotate(Math.atan2(Y1 - Y0, X1 - X0)); c.globalAlpha = 0.4 * A * (cr.fin ? 1.3 : 1); c.drawImage(streakSpr(), 0, -T0 * 0.2 * cr.sc / CFG.size, l, T0 * 0.4 * cr.sc / CFG.size); c.restore(); }
      c.restore();
    }
    /* ---- on top: the suspended fractures (closing from the ends), the Celestial rune ring, the luminous cuts ---- */
    function draw(c, f) {
      const T0 = T(), t = f.t; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.globalCompositeOperation = 'lighter';
      for (const q of fr) { const age = t - q.t0, LIFE = q.ring ? 1.25 : 0.7, op = sstep(0, 0.06, age), shut = sstep(LIFE * 0.3, LIFE, age), k = (1 - shut) * op, A = (1 - sstep(LIFE * 0.75, LIFE, age)) * op; if (A < 0.01) continue;
        const X0 = H.sx(q.x), Y0 = H.sy(q.y) - CFG.z * T0, bl = Math.hypot(q.B[0], q.B[1]) || 1, bx = q.B[0] / bl, by = q.B[1] / bl, L = q.len * T0, pk = petK(X0, Y0, T0);
        if (q.ring) { // the Celestial final: a ring of angular runes that turns and seals shut
          const R = T0 * 0.95 * (1 - 0.65 * shut), rot = age * 1.6, Ng = 10;
          c.globalAlpha = A * pk; glow(c, X0, Y0, R * 1.7, EDGE, 0.35 * A * pk); glow(c, X0, Y0, R * 0.7, CRIM, 0.25 * A * pk * (1 - shut));
          for (let i = 0; i < Ng; i++) { const b0 = rot + i / Ng * TAU, b1 = b0 + TAU / Ng * 0.72, p0 = [X0 + Math.cos(b0) * R, Y0 + Math.sin(b0) * R * GY], p1 = [X0 + Math.cos(b1) * R, Y0 + Math.sin(b1) * R * GY];
            const pts = jag(p0[0], p0[1], p1[0], p1[1], 3, T0 * 0.05, q.seed + i, 1); c.globalAlpha = A * pk; c.strokeStyle = H.rgba(EDGE, 0.6); c.lineWidth = Math.max(1.5, T0 * 0.07); strokePts(c, pts); c.strokeStyle = H.rgba(PALE, 0.95); c.lineWidth = Math.max(1, T0 * 0.022); strokePts(c, pts);
            // a glyph on each arc: an angular tick, a little diamond or a forked mark, pointing in
            const bm = (b0 + b1) / 2, gx = X0 + Math.cos(bm) * R * 0.82, gy = Y0 + Math.sin(bm) * R * 0.82 * GY, gs = T0 * 0.09 * (1 - 0.5 * shut), ux = Math.cos(bm), uy = Math.sin(bm) * GY, kind = i % 3;
            c.strokeStyle = H.rgba(i % 2 ? ACC : RUBY, 0.9); c.lineWidth = Math.max(1, T0 * 0.02); c.beginPath();
            if (kind === 0) { c.moveTo(gx - uy * gs, gy + ux * gs); c.lineTo(gx - ux * gs, gy - uy * gs); c.lineTo(gx + uy * gs, gy - ux * gs); }
            else if (kind === 1) { c.moveTo(gx - ux * gs, gy - uy * gs); c.lineTo(gx - uy * gs * 0.6, gy + ux * gs * 0.6); c.lineTo(gx + ux * gs, gy + uy * gs); c.lineTo(gx + uy * gs * 0.6, gy - ux * gs * 0.6); c.closePath(); }
            else { c.moveTo(gx + ux * gs, gy + uy * gs); c.lineTo(gx, gy); c.lineTo(gx - ux * gs - uy * gs * 0.7, gy - uy * gs + ux * gs * 0.7); c.moveTo(gx, gy); c.lineTo(gx - ux * gs + uy * gs * 0.7, gy - uy * gs - ux * gs * 0.7); }
            c.stroke(); }
          // the inner star of cracks closing on the centre
          for (let i = 0; i < 6; i++) { const b = i / 6 * TAU - rot * 0.5, r0 = R * 0.15, r1 = R * (0.55 + 0.2 * R1(q.seed + i)) * (1 - shut * 0.5), pts = jag(X0 + Math.cos(b) * r0, Y0 + Math.sin(b) * r0 * GY, X0 + Math.cos(b) * r1, Y0 + Math.sin(b) * r1 * GY, 3, T0 * 0.04, q.seed * 2 + i, 1);
            c.strokeStyle = H.rgba(EDGE, 0.55); c.lineWidth = Math.max(1, T0 * 0.045); strokePts(c, pts); c.strokeStyle = H.rgba(PALE, 0.8); c.lineWidth = Math.max(0.8, T0 * 0.015); strokePts(c, pts); }
          continue; }
        const pts = jag(X0 - bx * L, Y0 - by * L, X0 + bx * L, Y0 + by * L, q.big ? 7 : 5, T0 * (q.big ? 0.09 : 0.06), q.seed, k); if (k < 0.02) continue;
        c.globalAlpha = A * pk; c.strokeStyle = H.rgba(ENERGY, 0.6); c.lineWidth = Math.max(1.5, T0 * (q.big ? 0.09 : 0.06)); strokePts(c, pts);
        c.strokeStyle = H.rgba(ACC, 0.6); c.lineWidth = Math.max(0.8, T0 * 0.018); strokePts(c, pts);
        // a short branch or two; on the Celestial final's path, small rune ticks along it
        for (let j = 1; j < pts.length - 1; j += 2) { const p = pts[j], br = (R1(q.seed + j * 5) - 0.5) * 2, bb = T0 * 0.14 * k; c.strokeStyle = H.rgba(q.rune ? (j % 4 === 1 ? RUBY : ACC) : EDGE, 0.7); c.lineWidth = Math.max(0.8, T0 * 0.018); c.beginPath(); c.moveTo(p[0], p[1]);
          if (q.rune) { c.lineTo(p[0] - by * bb, p[1] + bx * bb); c.lineTo(p[0] - by * bb + bx * bb * 0.5, p[1] + bx * bb + by * bb * 0.5); } else c.lineTo(p[0] + (-by + bx * br) * bb, p[1] + (bx + by * br) * bb); c.stroke(); }
      }
      // the luminous cuts on struck monsters
      for (const q of cuts) { const age = t - q.t0, A = 1 - sstep(0.06, 0.3, age), grow = sstep(0, 0.05, age); if (A < 0.01) continue;
        const X0 = H.sx(q.x), Y0 = H.sy(q.y) - q.z * T0, bl = Math.hypot(q.B[0], q.B[1]) || 1, bx = q.B[0] / bl, by = q.B[1] / bl, L = q.len * T0 * 0.5 * grow;
        glow(c, X0, Y0, T0 * 0.6, q.fin ? RUBY : EDGE, 0.45 * A);
        c.globalAlpha = A; c.strokeStyle = H.rgba(EDGE, 0.7); c.lineWidth = Math.max(2, T0 * 0.12 * (1 - age * 2)); c.beginPath(); c.moveTo(X0 - bx * L, Y0 - by * L); c.lineTo(X0 + bx * L, Y0 + by * L); c.stroke();
        c.strokeStyle = H.rgba('#FFFFFF', 0.95); c.lineWidth = Math.max(1, T0 * 0.035); c.stroke(); }
      c.restore();
    }
    const F = H.add({ key: 'shadowseam', life, dbg, cres, update, draw, drawUnder, onEnd() { for (const k of kids) k.life = 0; } });
    kids.push(H.add({ key: 'shadowseamG', life: life, entY: oy + 0.01, drawEnt: c => drawSeam(c), update(dt, f) { if (seam.close >= 1) f.life = 0; } }));
  };
  S.shadowseam.cfg = CFG; S.shadowseam._spr = spr; S.shadowseam._want = wantBody;   // (the baked sprites, for checks)
  // (an idle hook like the ults' warm: bakes the shared layers in small slices)
  S.shadowseam.warm = () => { wantStatic(); pump(1.5); };
})();
