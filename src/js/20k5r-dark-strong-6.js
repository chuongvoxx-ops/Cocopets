/* ---------- Dark Strong, new: Death's Pursuit ----------
   Demonic obsidian skulls rise round the pet out of small rotating rune rings, hover in a loose formation turning toward
   their prey, then launch in a quick stagger and chase the monsters along curved homing paths with long smoky ribbons
   behind them; just before contact each one tilts forward and opens its jaw, then bites shut and detonates in a crimson
   flash, expanding violet-black flame and spinning obsidian fragments that dissolve into smoke. Replaces Shadow Hem (row
   in 20k1: key 'deathspursuit', cost 26, cd 3, glyph 'skull').
   Counts (held until their breakpoints, C.evo): 2 skulls at levels 1-3, 3 at 4-6, 4 at 7 (Celestial).
   Hits: each skull resolves exactly ONE damage event, in the frame it reaches its target (floor distance <= m.r + 0.22):
   the target takes the skull's damage, every other monster within CFG.splashR of the impact (hypot - m.r <= splashR)
   takes CFG.splashK of it, each once (the bite and the explosion are that one event; flame, fragments, smoke and
   ribbons never hit). Different skulls may strike the same monster. No knockback, no status.
   Damage (DK = base x K x (1 + CFG.evoK (evo - 1)), evoK 0.08), per skull CFG.per[N-2] x DK = 1.25 / 1.0 / 0.85 DK, so a
   lone monster bitten by every skull takes 2.5 / 3.72 / 5.03 x base x K at levels 1 / 4 / 7; splash 0.6 of a skull.
   Targeting (CFG.range 7.5 tiles from the pet): at launch each skull takes the nearest monster with the fewest skulls
   already on it (the aimed monster first), so separate nearby monsters are preferred and a lone one gets them all. If
   its target dies (or is lost) in flight it reacquires the nearest valid monster within CFG.reacq of itself (again
   preferring unclaimed ones); with none it dissipates in smoke. Every flight is bounded (CFG.life 2.2 s), then the
   skull dissipates harmlessly. With nothing in range at launch a skull flies a short way toward the aim and dissipates.
   Commitment: the pet dying or being swapped out before a skull's launch cancels that skull (it dissolves, no hit);
   launched skulls finish their flights.
   Pictures: the skull-mask is a signed-distance model of rigid bevelled forms (an angular cranium with flat temples and
   crown, a chamfered face plate, a tapered muzzle, cheekbones, deep triangular sockets, two blunt fangs and swept-back
   horns of three tapering segments) with a separate tapered jaw, ray-marched once per view (7 yaw buckets over 180°,
   mirrored for the other side) into shaded sprites: obsidian (dark broad faces, polish varying with a noise roughness,
   narrow violet-white speculars, a violet Fresnel rim, a violet floor bounce, sky sheen, ambient occlusion), and
   emissive layers drawn additively: crimson eyes and glowing cracks (pulsing), the violet mouth-fire light on the
   jaw and muzzle (by jaw opening), and the Celestial horn accents. The jaw is hinged on screen about its baked pivot.
   All baked lazily in slices (Strongs are not prewarmed: 1.2 ms a frame, 2 ms while one on screen is missing, a cheap
   vector skull meanwhile); smoke, flame and the rune ring are small per-pixel sprites baked the same way.
   Floor marks are light only (rune rings, a violet impact ring), everything is pooled per cast and removed when done.
   Sounds: hollow jaw clicks on the summon and the bite, a flame burst on each detonation. Reduced motion: no shake. */
(() => {
  const S = ELEM_IMPL.dark.strong; delete S.hem;
  const TAU = Math.PI * 2, PI = Math.PI;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const CRIM = '#D0183F', RUBY = '#FF2D55';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const wrapA = d => { while (d > PI) d -= TAU; while (d < -PI) d += TAU; return d; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const h3 = (x, y, z) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return v - Math.floor(v); };
  function vn3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const a = lerp(lerp(h3(xi, yi, zi), h3(xi + 1, yi, zi), u), lerp(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), u), v);
    const b = lerp(lerp(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), u), lerp(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), u), v);
    return lerp(a, b, w);
  }
  const fbm3 = (x, y, z) => vn3(x, y, z) * 0.55 + vn3(x * 2.1 + 3.1, y * 2.1 + 1.7, z * 2.1 + 5.3) * 0.3 + vn3(x * 4.3 + 7.7, y * 4.3 + 2.9, z * 4.3 + 0.6) * 0.15;
  const vn2 = (x, y) => vn3(x, y, 0.37);
  const RGB = h => hexRGB(h);
  const cV = RGB(VOID), cB = RGB(BODY), cP = RGB(PLUM), cS = RGB(SMOKE), cE = RGB(ENERGY), cG = RGB(EDGE), cA = RGB(ACC);
  let H = null;

  /* ---- the tuning: exposed as S.deathspursuit.cfg ---- */
  const CFG = {
    counts: [2, 3, 4],          // skulls at levels 1-3 / 4-6 / 7
    per: [1.25, 1.0, 0.85],     // one skull's damage, x DK, by count tier
    evoK: 0.08,                 // DK = base x K x (1 + evoK (evo - 1))
    splashR: 0.9,               // tiles from the impact to a monster's edge
    splashK: 0.6,               // the splash's share of a skull's damage (the target always takes the full)
    range: 7.5,                 // launch acquisition, tiles from the pet
    reacq: 6,                   // reacquisition after the target is lost, tiles from the skull
    life: 2.2,                  // a skull's bounded flight time (s)
    speed: 11.5                 // top flight speed (tiles / s)
  };

  /* ================= the skull-mask: a signed-distance model (units: ~ the skull's height; x right, y up, z forward) ================= */
  function sdBox(px, py, pz, bx, by, bz) { const qx = Math.abs(px) - bx, qy = Math.abs(py) - by, qz = Math.abs(pz) - bz, ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0, oz = qz > 0 ? qz : 0; return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0); }
  function sdEll(px, py, pz, rx, ry, rz) { const a = px / rx, b = py / ry, c = pz / rz, k0 = Math.sqrt(a * a + b * b + c * c), a2 = a / rx, b2 = b / ry, c2 = c / rz, k1 = Math.sqrt(a2 * a2 + b2 * b2 + c2 * c2) || 1e-6; return k0 * (k0 - 1) / k1; }
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const smax = (a, b, k) => -smin(-a, -b, k);
  // a round cone between two points (iq), its constants precomputed
  function rc(ax, ay, az, bx, by, bz, r1, r2) { const bax = bx - ax, bay = by - ay, baz = bz - az, l2 = bax * bax + bay * bay + baz * baz, rr = r1 - r2; return { ax, ay, az, bax, bay, baz, l2, rr, a2: l2 - rr * rr, il2: 1 / l2, r1, r2 }; }
  function sdRC(px, py, pz, q) {
    const pax = px - q.ax, pay = py - q.ay, paz = pz - q.az, y = pax * q.bax + pay * q.bay + paz * q.baz, z = y - q.l2;
    const wx = pax * q.l2 - q.bax * y, wy = pay * q.l2 - q.bay * y, wz = paz * q.l2 - q.baz * y, x2 = wx * wx + wy * wy + wz * wz, y2 = y * y * q.l2, z2 = z * z * q.l2, k = Math.sign(q.rr) * q.rr * q.rr * x2;
    if (Math.sign(z) * q.a2 * z2 > k) return Math.sqrt(x2 + z2) * q.il2 - q.r2;
    if (Math.sign(y) * q.a2 * y2 < k) return Math.sqrt(x2 + y2) * q.il2 - q.r1;
    return (Math.sqrt(Math.max(0, x2 * q.a2 * q.il2)) + y * q.rr) * q.il2 - q.r1;
  }
  // a 2D triangle (iq), corners in an array [x0, y0, x1, y1, x2, y2]
  function sdTri(px, py, t) {
    const e0x = t[2] - t[0], e0y = t[3] - t[1], e1x = t[4] - t[2], e1y = t[5] - t[3], e2x = t[0] - t[4], e2y = t[1] - t[5];
    const v0x = px - t[0], v0y = py - t[1], v1x = px - t[2], v1y = py - t[3], v2x = px - t[4], v2y = py - t[5];
    const k0 = cl((v0x * e0x + v0y * e0y) / (e0x * e0x + e0y * e0y)), k1 = cl((v1x * e1x + v1y * e1y) / (e1x * e1x + e1y * e1y)), k2 = cl((v2x * e2x + v2y * e2y) / (e2x * e2x + e2y * e2y));
    const q0x = v0x - e0x * k0, q0y = v0y - e0y * k0, q1x = v1x - e1x * k1, q1y = v1y - e1y * k1, q2x = v2x - e2x * k2, q2y = v2y - e2y * k2;
    const s = Math.sign(e0x * e2y - e0y * e2x);
    let dx = q0x * q0x + q0y * q0y, dy = s * (v0x * e0y - v0y * e0x);
    const d1 = q1x * q1x + q1y * q1y, s1 = s * (v1x * e1y - v1y * e1x), d2 = q2x * q2x + q2y * q2y, s2 = s * (v2x * e2y - v2y * e2x);
    if (d1 < dx) dx = d1; if (s1 < dy) dy = s1; if (d2 < dx) dx = d2; if (s2 < dy) dy = s2;
    return -Math.sqrt(dx) * Math.sign(dy);
  }
  // the deep triangular eye socket (for |x|: inner corner low, outer corner high: a scowl) and the nose slot
  const EYE = [0.05, 0.075, 0.33, 0.22, 0.17, -0.095], NOSE = [-0.05, -0.04, 0.05, -0.04, 0, -0.15];
  // the horns: three tapering segments swept back and up (for |x|)
  const HORN = [rc(0.29, 0.31, 0.0, 0.48, 0.48, -0.2, 0.1, 0.075), rc(0.48, 0.48, -0.2, 0.56, 0.63, -0.46, 0.075, 0.045), rc(0.56, 0.63, -0.46, 0.49, 0.8, -0.7, 0.045, 0.008)];
  const FANG = rc(0.135, -0.235, 0.31, 0.125, -0.335, 0.335, 0.03, 0.006);
  const RAMUS = rc(0.25, -0.16, -0.05, 0.11, -0.37, 0.3, 0.07, 0.055), LFANG = rc(0.08, -0.33, 0.34, 0.075, -0.24, 0.355, 0.028, 0.005);
  let gSock = 1, gHorn = 1;   // (scratch: the last evaluation's socket and horn distances, for the materials)
  function headSD(x, y, z) {
    const ax = Math.abs(x);
    // the cranium: an ellipsoid cut by bevel planes into an angular shell (upper side chamfers, a flat crown, flat temples)
    let d = sdEll(x, y - 0.12, z + 0.1, 0.38, 0.37, 0.45);
    d = smax(d, ax * 0.72 + (y - 0.12) * 0.69 - 0.3, 0.025);
    d = smax(d, y - 0.43, 0.025);
    d = smax(d, ax - 0.33, 0.02);
    d = smax(d, -(z + 0.1) * 0.78 + (y - 0.12) * 0.62 - 0.33, 0.025);   // (the back of the crown, chamfered)
    // the face plate: brow and cheeks, the front corners and the brow edge chamfered
    let f = sdBox(x, y - 0.02, z - 0.2, 0.345, 0.17, 0.19);
    f = smax(f, ax * 0.6 + (z - 0.2) * 0.8 - 0.31, 0.015);
    f = smax(f, (y - 0.02) * 0.55 + (z - 0.2) * 0.84 - 0.235, 0.015);
    d = smin(d, f, 0.045);
    // the muzzle: tapered toward the front, its lower front edge chamfered
    let m = sdBox(x, y + 0.18, z - 0.25, 0.22, 0.095, 0.16);
    m = smax(m, ax + (z - 0.1) * 0.5 - 0.235, 0.02);
    m = smax(m, -(y + 0.17) * 0.45 + (z - 0.24) * 0.9 - 0.12, 0.02);
    d = smin(d, m, 0.05);
    // cheekbones
    d = smin(d, sdBox(ax - 0.28, y + 0.05, z - 0.13, 0.07, 0.055, 0.13), 0.035);
    // two blunt fangs under the muzzle
    d = smin(d, sdRC(ax, y, z, FANG), 0.015);
    // the eye sockets and the nose slot, carved
    const so = Math.max(sdTri(ax, y, EYE), 0.225 - z); gSock = so;
    d = smax(d, -so, 0.012);
    d = smax(d, -Math.max(sdTri(x, y, NOSE), 0.29 - z), 0.01);
    // the horns (only evaluated near them)
    let hn = 9; const hx0 = ax - 0.47, hy0 = y - 0.55, hz0 = z + 0.33, hb = Math.sqrt(hx0 * hx0 + hy0 * hy0 + hz0 * hz0) - 0.5;
    if (hb < d + 0.06) { hn = Math.min(sdRC(ax, y, z, HORN[0]), sdRC(ax, y, z, HORN[1]), sdRC(ax, y, z, HORN[2])); d = smin(d, hn, 0.05); } else hn = hb;
    gHorn = hn;
    return d;
  }
  function jawSD(x, y, z) {
    const ax = Math.abs(x);
    let d = sdRC(ax, y, z, RAMUS);
    d = smax(d, ax - 0.29, 0.02);
    let c = sdBox(x, y + 0.38, z - 0.3, 0.15, 0.065, 0.08);
    c = smax(c, ax * 0.7 + (z - 0.3) * 0.7 - 0.145, 0.015);
    d = smin(d, c, 0.045);
    d = smax(d, -sdBox(x, y + 0.2, z - 0.1, 0.17, 0.11, 0.21), 0.02);   // the mouth's trough
    d = smin(d, sdRC(ax, y, z, LFANG), 0.012);
    gSock = 1; gHorn = 1;
    return d;
  }

  /* ================= the bake ================= */
  const NB = 7, ELV = 0.58, C0 = [0, 0.12, -0.12], BR = 1.1, U_T = 0.7;   // yaw buckets over 0..PI; camera elevation; the model's bound; tiles per model unit
  const BK = { px: 0, spr: new Map(), queue: [], qset: new Set(), job: null, ms: 0, maxSlice: 0, built: 0, miss: 0 };
  function setScale(px) { if (BK.px && Math.abs(px / BK.px - 1) < 0.2) return; for (const k of [...BK.spr.keys()]) if (k[0] === 'H' || k[0] === 'J') BK.spr.delete(k); BK.queue = BK.queue.filter(k => k[0] !== 'H' && k[0] !== 'J'); BK.qset = new Set(BK.queue); if (BK.job && (BK.job.key[0] === 'H' || BK.job.key[0] === 'J')) BK.job = null; BK.px = px; }
  function want(key, front) { if (BK.spr.has(key) || (BK.job && BK.job.key === key)) return; if (BK.qset.has(key)) { if (front) { const i = BK.queue.indexOf(key); if (i > 0) { BK.queue.splice(i, 1); BK.queue.unshift(key); } } return; } BK.qset.add(key); if (front) BK.queue.unshift(key); else BK.queue.push(key); }
  function genFor(key, res) {
    if (key[0] === 'H') return modelGen(parseInt(key.slice(1), 10), false, res, key.slice(-1) === 'l');
    if (key[0] === 'J') return modelGen(parseInt(key.slice(1), 10), true, res, key.slice(-1) === 'l');
    if (key === 'RING') return ringGen(res); if (key === 'SMK0' || key === 'SMK1') return smokeGen(+key[3], res);
    return flameGen(+key[3], res);
  }
  function bakeStep(ms) {
    const t0 = nowMs(), until = t0 + ms;
    while (nowMs() < until) {
      if (!BK.job) { let key = null; while (BK.queue.length && !key) { const k = BK.queue.shift(); BK.qset.delete(k); if (!BK.spr.has(k)) key = k; } if (!key) break; const res = {}; BK.job = { key, res, it: genFor(key, res) }; }
      const jb = BK.job; let done = false; while (nowMs() < until) { const q0 = nowMs(), dn = jb.it.next().done, q1 = nowMs() - q0; if (q1 > (BK.maxStep || 0)) { BK.maxStep = q1; BK.maxKey = jb.key; } if (dn) { done = true; break; } }
      if (!done) break; BK.spr.set(jb.key, jb.res); BK.built++; BK.job = null;
    }
    const dt = nowMs() - t0; BK.ms += dt; if (dt > BK.maxSlice) BK.maxSlice = dt;
  }
  const peek = key => BK.spr.get(key) || null;
  const get = key => { const r = BK.spr.get(key); if (r) return r; want(key, true); BK.miss++; return null; };
  // a view: the nearest baked bucket stands in while the right one is missing
  // a matched head + jaw: this bucket's full views, else the nearest full pair, else a half-resolution pair (baked first)
  function pair(b) { const H0 = peek('H' + b), J0 = peek('J' + b); if (H0 && J0) return [H0, J0];
    if (peek('H0l') || peek('H3l')) { want('J' + b, true); want('H' + b, true); BK.miss++; }
    for (let d = 1; d < NB; d++) for (const s of [-1, 1]) { const b2 = b + s * d, h = peek('H' + b2), j = peek('J' + b2); if (h && j) return [h, j]; }
    for (let d = 0; d < NB; d++) for (const s of [-1, 1]) { const b2 = b + s * d, h = peek('H' + b2 + 'l'), j = peek('J' + b2 + 'l'); if (h && j) return [h, j]; }
    return null; }
  function view(kind, b) { let r = get(kind + b); if (r) return r; for (let d = 1; d < NB; d++) for (const s of [-1, 1]) { const b2 = b + s * d; if (b2 >= 0 && b2 < NB && (r = peek(kind + b2))) return r; } return null; }
  function plan(b0) {
    for (const k of ['RING', 'H' + b0 + 'l', 'J' + b0 + 'l', 'H3l', 'J3l', 'SMK0', 'FLM0', 'H' + b0, 'J' + b0]) want(k);
    for (const b of [3, 2, 4, 1, 5, 0, 6]) { want('H' + b); want('J' + b); }
    for (const k of ['SMK1', 'FLM1']) want(k);
  }
  const N3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function camFor(b) {
    const yaw = b / (NB - 1) * PI, ce = Math.cos(ELV), se = Math.sin(ELV), Bk = [-Math.sin(yaw) * ce, se, Math.cos(yaw) * ce];
    const rl = Math.hypot(Bk[2], Bk[0]), R = [Bk[2] / rl, 0, -Bk[0] / rl], U = [Bk[1] * R[2] - Bk[2] * R[1], Bk[2] * R[0] - Bk[0] * R[2], Bk[0] * R[1] - Bk[1] * R[0]];
    const comb = (a, b2, c) => N3([R[0] * a + U[0] * b2 + Bk[0] * c, R[1] * a + U[1] * b2 + Bk[1] * c, R[2] * a + U[2] * b2 + Bk[2] * c]);
    return { yaw, Bk, R, U, L: comb(-0.5, 0.72, 0.55), Lb: comb(0.3, -0.85, 0.3), Lk: comb(0.85, 0.15, -0.4) };
  }
  /* one view of the head (body, emissive, mouth light, Celestial horn accents) or of the jaw (body, mouth light) */
  function* modelGen(b, jaw, res, lo) {
    const cam = camFor(b), sz = BK.px * (lo ? 0.5 : 1), W = Math.ceil(BR * 2 * sz) + 4, cx = W / 2, cy = W / 2, SD = jaw ? jawSD : headSD;
    const { R, U, Bk, L, Lb, Lk } = cam, V = Bk, Hh = N3([L[0] + V[0], L[1] + V[1], L[2] + V[2]]);
    const proj = p => [cx + dot([p[0] - C0[0], p[1] - C0[1], p[2] - C0[2]], R) * sz, cy - dot([p[0] - C0[0], p[1] - C0[1], p[2] - C0[2]], U) * sz];
    const cvs = [mk(W, W), mk(W, W), mk(W, W), mk(W, W)], ctx = cvs.map(c => c.getContext('2d')), ims = ctx.map(c => c.createImageData(W, W)), D = ims.map(im => im.data);
    const PM = jaw ? [0, -0.22, 0.12] : [0, -0.3, 0.17];   // the mouth fire's light
    const put = (k, i, r, g, bb, a) => { const d = D[k]; d[i] = r > 255 ? 255 : r; d[i + 1] = g > 255 ? 255 : g; d[i + 2] = bb > 255 ? 255 : bb; d[i + 3] = a; };
    const e = 0.0035, pixW = 1 / sz;
    for (let py = 0; py < W; py++) {
      yield;
      for (let px = 0; px < W; px++) {
        const u = (px + 0.5 - cx) / sz, v = -(py + 0.5 - cy) / sz, q = BR * BR - u * u - v * v; if (q <= 0) continue;
        const hh = Math.sqrt(q), ox = C0[0] + R[0] * u + U[0] * v + Bk[0] * hh, oy = C0[1] + R[1] * u + U[1] * v + Bk[1] * hh, oz = C0[2] + R[2] * u + U[2] * v + Bk[2] * hh;
        let t = 0, hit = false, minD = 9, tMin = 0;
        for (let k = 0; k < 72 && t < 2 * hh; k++) { const d = SD(ox - Bk[0] * t, oy - Bk[1] * t, oz - Bk[2] * t); if (d < minD) { minD = d; tMin = t; } if (d < 0.0015) { hit = true; break; } t += Math.max(d * 0.9, 0.002); }
        if (!hit && minD > pixW * 1.2) continue;
        const tt = hit ? t : tMin, x = ox - Bk[0] * tt, y = oy - Bk[1] * tt, z = oz - Bk[2] * tt, cov = hit ? 1 : cl(1 - minD / pixW * 0.85);
        // the normal (a tetrahedron of samples)
        const a1 = SD(x + e, y - e, z - e), a2 = SD(x - e, y - e, z + e), a3 = SD(x - e, y + e, z - e), a4 = SD(x + e, y + e, z + e);
        const n = N3([a1 - a2 - a3 + a4, -a1 - a2 + a3 + a4, -a1 + a2 - a3 + a4]);
        SD(x, y, z); const sock = gSock, horn = gHorn;
        // ambient occlusion from the distance field
        let occ = 0; for (let k = 1; k <= 3; k++) { const hk = 0.035 * k * k; occ += (hk - SD(x + n[0] * hk, y + n[1] * hk, z + n[2] * hk)) / (k * 1.3); }
        const ao = cl(1 - occ * 2.2);
        const dif = Math.max(0, dot(n, L)), bnc = Math.max(0, dot(n, Lb)), kick = Math.max(0, dot(n, Lk)), nv = Math.max(0, dot(n, V)), fr = Math.pow(1 - nv, 3), nh = Math.max(0, dot(n, Hh));
        // obsidian: polish varies (a roughness noise), narrow violet-white speculars, a sky sheen, conchoidal ripples
        const rn = vn3(x * 6.5 + 1.3, y * 6.5 + 7.1, z * 6.5 + 3.3), pol = 0.3 + 0.7 * sstep(0.3, 0.72, rn), rip = (vn3(x * 15, y * 15 + 2, z * 15 + 4) - 0.5) * 0.18;
        const isHorn = horn < 0.012 ? 1 : 0, eyeK = jaw ? 0 : sstep(0.014, 0.0, sock) * (z > 0.17 ? 1 : 0);
        const spec = Math.pow(nh, lerp(16, 120, pol)) * lerp(0.25, 1.15, pol) * (0.4 + 0.6 * ao);
        const ry = 2 * dot(n, V) * n[1] - V[1], env = sstep(0.05, 0.95, ry) * 0.45 * pol;
        const lit = cl(dif * 1.05 + rip);
        let r = cV[0], g = cV[1], bb = cV[2];
        const sh = (c1, k) => { r += (c1[0] - r) * k; g += (c1[1] - g) * k; bb += (c1[2] - bb) * k; };
        sh(cB, sstep(0, 0.6, lit) * 0.9); sh(cP, sstep(0.45, 1, lit) * 0.55); sh(cS, Math.pow(lit, 3) * 0.32 * (isHorn ? 1.3 : 1));
        sh(cS, env * 0.5); sh(cE, bnc * 0.28); sh(cG, kick * 0.14 + fr * 0.42);
        r *= ao; g *= ao; bb *= ao;
        r += (cA[0] * 0.55 + 115) * spec; g += (cA[1] * 0.55 + 115) * spec; bb += (cA[2] * 0.55 + 115) * spec;
        // the eyes: socket walls dark crimson in the body layer
        if (eyeK > 0) { r = lerp(r, 70, eyeK); g = lerp(g, 4, eyeK); bb = lerp(bb, 16, eyeK); }
        // glowing cracks across the cranium and face (not in the sockets, not on the horns)
        let crack = 0;
        if (!jaw && !isHorn && eyeK < 0.5) { const cf = Math.abs(fbm3(x * 3.4 + 2.2, y * 3.4 + 0.5, z * 3.4 + 1.9) - 0.5), zone = sstep(0.56, 0.72, vn3(x * 1.7 + 4, y * 1.7, z * 1.7 + 9)); crack = Math.exp(-Math.pow(cf / 0.016, 2)) * zone; if (crack > 0.02) { r *= 1 - crack * 0.5; g *= 1 - crack * 0.6; bb *= 1 - crack * 0.5; r += 70 * crack; } }
        const i = (py * W + px) * 4, A = Math.round(255 * cov);
        put(0, i, r, g, bb, A);
        // emissive: the eyes (hottest deep in the socket) and the cracks
        const eyeE = eyeK * (0.55 + 0.45 * sstep(0.33, 0.22, z)) * (0.7 + 0.3 * sstep(0, -0.05, sdTri(Math.abs(x), y, EYE)));
        const em = Math.max(eyeE, crack * 0.85);
        if (em > 0.01) { const hot = eyeE * sstep(0.6, 1, eyeE); put(1, i, 255, 45 + 150 * hot, 85 + 110 * hot, Math.round(255 * cov * cl(em))); }
        // the mouth fire's light on the surfaces that face it
        const lx = PM[0] - x, ly = PM[1] - y, lz = PM[2] - z, ld = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1, lam = Math.max(0, (n[0] * lx + n[1] * ly + n[2] * lz) / ld), mI = cl(lam / (1 + 26 * ld * ld) * 1.6) * (jaw ? 1 : sstep(0.02, -0.16, y));
        if (mI > 0.01) put(2, i, lerp(cG[0], cA[0], mI), lerp(cG[1], cA[1], mI * 0.6), 255, Math.round(255 * cov * mI));
        // the Celestial horn accents: three bright bands and a glowing tip, a violet edge along the ridge
        if (!jaw && isHorn) { const s = cl((y - 0.3) / 0.52), band = Math.max(Math.exp(-Math.pow((s - 0.32) / 0.03, 2)), Math.exp(-Math.pow((s - 0.56) / 0.028, 2)), Math.exp(-Math.pow((s - 0.76) / 0.025, 2))), tip = sstep(0.86, 1, s), ridge = Math.pow(fr, 1.5) * 0.6, k = cl(band * 0.9 + tip + ridge * s);
          if (k > 0.01) put(3, i, lerp(cG[0], 255, band * 0.3 + tip * 0.5), lerp(cG[1], 235, band * 0.3 + tip * 0.5), 255, Math.round(255 * cov * k)); }
      }
    }
    for (let k = 0; k < (jaw ? 3 : 4); k++) { yield; ctx[k].putImageData(ims[k], 0, 0); }
    const pv = proj([0, -0.165, -0.05]), mo = proj([0, -0.29, 0.2]);
    const eyes = jaw ? [] : [-1, 1].map(s => { const p = proj([s * 0.18, 0.06, 0.29]), nn = N3([s * 0.35, 0.05, 1]); return [p[0], p[1], cl((dot(nn, V) + 0.15) / 0.5)]; });
    Object.assign(res, { body: cvs[0], em: cvs[1], mouth: cvs[2], acc: jaw ? null : cvs[3], W, sz, cx, cy, pv, mo, eyes, yaw: cam.yaw });
  }
  /* the summoning rune ring: two thin circles, angular glyphs between them, tick marks, a soft glow (white-violet, drawn additively) */
  function* ringGen(res) {
    const N = 128, cv = mk(N, N), g = cv.getContext('2d'), c = N / 2;
    const gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, 'rgba(109,40,168,0.10)'); gr.addColorStop(0.6, 'rgba(109,40,168,0.08)'); gr.addColorStop(0.82, 'rgba(165,92,255,0.28)'); gr.addColorStop(1, 'rgba(165,92,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, N, N);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [rr, w, a] of [[c * 0.86, 2.2, 0.95], [c * 0.62, 1.4, 0.8], [c * 0.3, 1.2, 0.5]]) { g.strokeStyle = `rgba(208,174,255,${a})`; g.lineWidth = w; g.beginPath(); g.arc(c, c, rr, 0, TAU); g.stroke(); }
    yield;
    g.strokeStyle = 'rgba(232,214,255,0.95)'; g.lineWidth = 1.6;
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, ca = Math.cos(a), sa = Math.sin(a), r0 = c * 0.66, r1 = c * 0.82, sd = R1(k * 3.3 + 1);
      const P = (rr, t) => [c + ca * rr - sa * t, c + sa * rr + ca * t];
      g.beginPath(); const p0 = P(r0, -4), p1 = P(r1, -2 + sd * 4), p2 = P(lerp(r0, r1, 0.5), 4), p3 = P(r1, 5); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); if (sd > 0.4) g.lineTo(p3[0], p3[1]); g.stroke();
      const q0 = P(c * 0.34, 0), q1 = P(c * 0.58, 0); g.globalAlpha = 0.5; g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.stroke(); g.globalAlpha = 1; }
    for (let k = 0; k < 36; k++) { const a = k / 36 * TAU; g.strokeStyle = 'rgba(208,174,255,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(c + Math.cos(a) * c * 0.88, c + Math.sin(a) * c * 0.88); g.lineTo(c + Math.cos(a) * c * (k % 3 ? 0.91 : 0.95), c + Math.sin(a) * c * (k % 3 ? 0.91 : 0.95)); g.stroke(); }
    res.cv = cv;
  }
  /* a smoke puff: a soft noisy blob (smoky violet), and a flame burst: ragged radial tongues (additive) with a violet-black body */
  function* smokeGen(v, res) {
    const N = 64, cv = mk(N, N), g = cv.getContext('2d'), im = g.createImageData(N, N), d = im.data;
    for (let y = 0; y < N; y++) { if (y % 8 === 7) yield; for (let x = 0; x < N; x++) { const dx = (x + 0.5) / N * 2 - 1, dy = (y + 0.5) / N * 2 - 1, r = Math.hypot(dx, dy); if (r >= 1) continue;
      const n = vn2(dx * 2.6 + v * 7, dy * 2.6 + 3) * 0.6 + vn2(dx * 5.5 + 1 + v * 3, dy * 5.5 + 8) * 0.4, a = cl((1 - r * (0.75 + 0.5 * n)) * 1.6) * (0.55 + 0.45 * n), i = (y * N + x) * 4;
      d[i] = lerp(30, 84, n); d[i + 1] = lerp(18, 58, n); d[i + 2] = lerp(44, 112, n); d[i + 3] = Math.round(255 * a * a); } }
    g.putImageData(im, 0, 0); res.cv = cv;
  }
  function* flameGen(v, res) {
    const N = 112, add = mk(N, N), drk = mk(N, N), ga = add.getContext('2d'), gd = drk.getContext('2d'), ia = ga.createImageData(N, N), id = gd.createImageData(N, N), A = ia.data, Dd = id.data;
    for (let y = 0; y < N; y++) { if (y % 4 === 3) yield; for (let x = 0; x < N; x++) { const dx = (x + 0.5) / N * 2 - 1, dy = (y + 0.5) / N * 2 - 1, r = Math.hypot(dx, dy); if (r >= 1) continue;
      const a = Math.atan2(dy, dx), tg = vn2(Math.cos(a) * 2.2 + v * 5, Math.sin(a) * 2.2 + r * 2.5) * 0.65 + vn2(Math.cos(a) * 5 + 9, Math.sin(a) * 5 + r * 4 + v) * 0.35;
      const edge = 0.5 + 0.48 * tg, body = cl((edge - r) / 0.22), shell = Math.exp(-Math.pow((r - edge * 0.78) / 0.14, 2)) * body, core = cl(1 - r / 0.35), i = (y * N + x) * 4;
      // additive: hot violet-white tongues toward the rim, a crimson-violet heart
      const ia2 = cl(shell * 0.95 + core * 0.35) * (0.6 + 0.4 * tg);
      if (ia2 > 0.01) { A[i] = lerp(cG[0], 215, shell * shell * 0.6) + core * 70; A[i + 1] = lerp(cG[1], 150, shell * shell * 0.5) * (1 - core * 0.6); A[i + 2] = 255 * (1 - core * 0.4); A[i + 3] = Math.round(255 * ia2); }
      // the dark fire: void-plum smoke inside the shell, ragged
      const dk = body * (1 - shell * 0.6) * cl((r - 0.15) / 0.3) * (0.5 + 0.5 * vn2(dx * 6 + v, dy * 6));
      if (dk > 0.01) { Dd[i] = lerp(cV[0], cP[0], tg); Dd[i + 1] = lerp(cV[1], cP[1], tg); Dd[i + 2] = lerp(cV[2], cP[2], tg); Dd[i + 3] = Math.round(255 * dk * 0.8); } } }
    ga.putImageData(ia, 0, 0); gd.putImageData(id, 0, 0); res.add = add; res.dark = drk;
  }
  // a violet floor ring (light only) for the impacts
  const impRing = () => fxSprite('dp6ring', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 63); gr.addColorStop(0, 'rgba(109,40,168,0.16)'); gr.addColorStop(0.55, 'rgba(109,40,168,0.06)'); gr.addColorStop(0.72, 'rgba(165,92,255,0.3)'); gr.addColorStop(0.8, 'rgba(208,174,255,0.9)'); gr.addColorStop(0.87, 'rgba(165,92,255,0.4)'); gr.addColorStop(1, 'rgba(109,40,168,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const shadowSpr = () => fxSprite('dp6shad', 64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(8,5,15,0.32)'); gr.addColorStop(0.6, 'rgba(8,5,15,0.12)'); gr.addColorStop(1, 'rgba(8,5,15,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  function blit(c, img, x, y, w, h, a, add) { if (!img || !(a > 0.01) || w < 0.5 || h < 0.5) return; c.globalAlpha = Math.min(1, a); c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.drawImage(img, x - w / 2, y - h / 2, w, h); c.globalCompositeOperation = 'source-over'; }
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; }

  /* a debug sheet: every view baked now (for the montage) */
  function sheet(px) {
    setScale(px); for (let b = 0; b < NB; b++) { want('H' + b); want('J' + b); } for (const k of ['RING', 'SMK0', 'SMK1', 'FLM0', 'FLM1']) want(k);
    const t0 = nowMs(); let guard = 0; while ((BK.queue.length || BK.job) && guard++ < 100000) bakeStep(50); const ms = nowMs() - t0;
    const h0 = BK.spr.get('H0'), W = h0.W, cv = mk(W * NB, W * 3), g = cv.getContext('2d'); g.fillStyle = '#2a2236'; g.fillRect(0, 0, cv.width, cv.height);
    for (let b = 0; b < NB; b++) { const hd = BK.spr.get('H' + b), jw = BK.spr.get('J' + b);
      for (let row = 0; row < 3; row++) { const ox = b * W, oy = row * W, open = row === 2 ? 1 : 0;
        g.save(); g.translate(ox, oy); g.save(); g.translate(jw.pv[0], jw.pv[1]); g.rotate(open * 0.55 * Math.sin(hd.yaw)); g.translate(-jw.pv[0], -jw.pv[1] - open * 0.12 * W * 0.25 * Math.abs(Math.cos(hd.yaw))); g.drawImage(jw.body, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = open; g.drawImage(jw.mouth, 0, 0); g.restore();
        g.drawImage(hd.body, 0, 0); g.globalCompositeOperation = 'lighter'; if (row >= 1) { g.drawImage(hd.em, 0, 0); g.globalAlpha = 0.4 + 0.6 * open; g.drawImage(hd.mouth, 0, 0); g.globalAlpha = 1; } if (row === 2) g.drawImage(hd.acc, 0, 0); g.restore(); } }
    return { url: cv.toDataURL(), ms, W, built: BK.built };
  }

  /* ================= the move ================= */
  const T_RING = 0.05, RING_GAP = 0.07, RISE = 0.32, LAUNCH = 0.64, GAP = 0.085, BITE = 0.07, TR = 0.34, FADE = 0.32;
  S.deathspursuit = (C, h) => {
    H = h; const HH = h, me = HH.me, ev = evoOf(C), K = C.K || 1, tier = ev >= 7 ? 2 : ev >= 4 ? 1 : 0, N = CFG.counts[tier];
    const DK = C.base * K * (1 + CFG.evoK * (ev - 1)), dmg = CFG.per[tier] * DK, cel = ev >= 7;
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, RES = Math.min(2, Math.max(1, dpr));
    setScale(HH.X.Tz() * RES * U_T); plan(0); bakeStep(1.5);
    const P0 = HH.X.pet ? HH.X.pet() : null, swapped = () => !!P0 && HH.X.pet && HH.X.pet() !== P0;
    const sfx = HH.X.sfx || {}, note = (...a) => sfx.note && sfx.note(...a), hiss = (...a) => sfx.hiss && sfx.hiss(...a);
    const click = (d, k) => { note(1500, 0.03, 'square', 0.05 * (k || 1), 820, d); note(240, 0.07, 'triangle', 0.16 * (k || 1), 150, d); };
    note(98, 0.7, 'sine', 0.16, 196); hiss(0.45, 0.07, 520); me.sq = 0.7;
    const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
    const claims = new Map(), claim = m => claims.set(m, (claims.get(m) || 0) + 1);
    const aimT = C.A && valid(C.A.t) ? C.A.t : null;
    const dbg = { N, dmg, hits: [], retargets: 0, fizzles: 0, cancels: 0, launched: 0, maxUpd: 0, maxDraw: 0 };
    // the formation: slots over the back half of a ring round the pet (never in front of it)
    const SPR = [[-0.95, 0.95], [-1.2, 0, 1.2], [-1.45, -0.55, 0.55, 1.45]][tier], RX = N === 4 ? 1.3 : 1.12;
    const order = N === 3 ? [1, 0, 2] : N === 4 ? [1, 2, 0, 3] : [0, 1];   // (the ring order: the middle ones first)
    const sk = SPR.map((o, i) => ({ i, ang: -PI / 2 + o, side: o < 0 ? -1 : 1, seed: R1(i * 7.3 + ev) * 10, ring: T_RING + RING_GAP * order.indexOf(i),
      x: me.x, y: me.y, z: 0.1, vx: 0, vy: 0, vz: 0, hd: PI / 2, tilt: 0, jaw: 0, st: 'sum', tgt: null, tl: LAUNCH + GAP * i, t1: 0, hist: [], alpha: 0, scale: 0.4, bx: 0, by: 0, gone: 0, zl: 1 }));
    const PS = [], FREE = [], exps = [];
    const part = o => { const p = FREE.pop() || {}; p.x = 0; p.y = 0; p.z = 0; p.vx = 0; p.vy = 0; p.vz = 0; p.g = 0; p.drag = 0; p.t = 0; p.life = 1; p.s = 0.1; p.grow = 0; p.rot = 0; p.vr = 0; p.spin = 0; p.vs = 0; p.v = 0; p.smoked = false; p.a = 1; Object.assign(p, o); if (PS.length < 220) PS.push(p); return p; };
    const slotPos = s => [me.x + Math.cos(s.ang) * RX, me.y + Math.sin(s.ang) * 0.78];
    const zSlot = s => 1.0 + 0.12 * Math.cos(s.ang + PI / 2);
    const zOf = m => 0.3 + Math.min(0.45, (m.r || 0.4) * 0.75);
    let lastT = 0, endT = -1;
    const kids = sk.map(s => HH.add({ key: 'deathspursuitSkull', life: 30, entY: null, drawEnt: c => drawSkull(c, s) }));
    const F = HH.add({ key: 'deathspursuit', life: 30, N, dmg, dbg, skulls: sk, CFG, update, draw, drawUnder, onEnd() { for (const k of kids) k.life = 0; } });

    /* ---- targeting ---- */
    function acquire(x, y, R, first) {
      let best = null, bs = 1e9; for (const m of HH.living()) { if (!valid(m)) continue; const d = Math.hypot(m.x - x, m.y - y); if (d > R + m.r) continue;
        const sc = d + 2.4 * (claims.get(m) || 0) - (first && m === aimT ? 2 : 0); if (sc < bs) { bs = sc; best = m; } }
      return best;
    }
    // (the hover: a provisional target to turn toward, claimed only at launch)
    function preview(s) { const m = acquire(me.x, me.y, CFG.range, s.i === 0); return m; }

    /* ---- one skull's flight ---- */
    function launch(s, t) {
      s.tgt = acquire(me.x, me.y, CFG.range, dbg.launched === 0); dbg.launched++;
      const tx = s.tgt ? s.tgt.x : s.x + Math.cos(C.a) * 4, ty = s.tgt ? s.tgt.y : s.y + Math.sin(C.a) * 4; if (s.tgt) claim(s.tgt);
      const a0 = Math.atan2(ty - s.y, tx - s.x) + s.side * (0.95 + 0.35 * R1(s.seed)) + (N === 4 && Math.abs(s.ang + PI / 2) < 0.6 ? s.side * -0.4 : 0);
      s.vx = Math.cos(a0) * 2.5; s.vy = Math.sin(a0) * 2.5; s.vz = 1.2; s.st = 'fly'; s.t1 = t; s.zl = s.z; s.d0 = Math.max(1, Math.hypot(tx - s.x, ty - s.y)); s.aimX = tx; s.aimY = ty; s.hist.length = 0;
      hiss(0.2, 0.1, 1500 + 200 * s.i); click(0, 0.6);
    }
    function dissipate(s, t, why) {
      if (s.st === 'fade' || s.st === 'done') return; s.st = 'fade'; s.t1 = t; if (why === 'cancel') dbg.cancels++; else dbg.fizzles++;
      const n = HH.n(5); for (let k = 0; k < n; k++) { const a = Math.random() * TAU; part({ k: 'smoke', x: s.x, y: s.y, z: s.z, vx: Math.cos(a) * 0.8, vy: Math.sin(a) * 0.5, vz: 0.6, drag: 1.5, life: 0.6 + Math.random() * 0.3, s: 0.22, grow: 0.5, v: k % 2, a: 0.7 }); }
      note(180, 0.25, 'sine', 0.08, 120);
    }
    function impact(s, t) {
      const tg = s.tgt, ix = tg.x, iy = tg.y; s.st = 'bite'; s.t1 = t; s.bx = ix - s.x; s.by = iy - s.y;
      // the one damage event: the target in full, the others in the splash in part, each once
      const rec = { skull: s.i, tgt: tg, primary: 0, splash: 0, t }; if (valid(tg)) rec.primary = HH.X.hitMon(tg, dmg, C.dmgO()) || 0;
      for (const m of HH.living()) { if (m === tg || !valid(m)) continue; if (Math.hypot(m.x - ix, m.y - iy) - m.r <= CFG.splashR) { HH.X.hitMon(m, dmg * CFG.splashK, C.dmgO()); rec.splash++; } }
      dbg.hits.push(rec);
      // the detonation
      const z = Math.max(0.3, s.z * 0.6 + zOf(tg) * 0.4), sd = s.seed; exps.push({ x: ix, y: iy, z, t0: t, sd, big: N === 4 && s.i === N - 1 });
      const nf = HH.n(cel ? 11 : 9); for (let k = 0; k < nf; k++) { const a = k / nf * TAU + R1(sd + k) * 0.6, v = 2.2 + 2.6 * R1(sd * 3 + k); part({ k: 'frag', x: ix, y: iy, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: 1.5 + 2.8 * R1(sd + k * 7), g: 9, drag: 1.2, life: 0.5 + 0.3 * R1(k + sd), s: 0.06 + 0.07 * R1(k * 5 + sd), rot: a, vr: (R1(k * 9) - 0.5) * 16, spin: R1(k) * TAU, vs: 8 + 10 * R1(k * 2), v: k % 3 }); }
      const ne = HH.n(10); for (let k = 0; k < ne; k++) { const a = Math.random() * TAU, v = 1 + Math.random() * 2.5; part({ k: 'ember', x: ix, y: iy, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: 1 + Math.random() * 2, g: -0.5, drag: 1.8, life: 0.45 + Math.random() * 0.35, s: 0.05 + Math.random() * 0.04, v: k % 3 }); }
      const ns = HH.n(5); for (let k = 0; k < ns; k++) { const a = Math.random() * TAU, v = 0.6 + Math.random(); part({ k: 'smoke', x: ix + Math.cos(a) * 0.2, y: iy + Math.sin(a) * 0.12, z: z * (0.6 + 0.4 * Math.random()), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: 0.5, drag: 1.6, life: 0.7 + Math.random() * 0.35, s: 0.3, grow: 0.9, v: k % 2, a: 0.55, d: 0.12 }); }
      if (HH.X.light) HH.X.light(ix, iy, 2.4, 0.3);
      click(0, 1.2); click(0.035, 0.8); note(88, 0.32, 'sine', 0.32, 44); hiss(0.38, 0.28, 520, 0.02); hiss(0.18, 0.14, 2400, 0.02); if (sfx.crash && s.i === 0) sfx.crash();
      if (dbg.hits.length === 1) HH.X.hitstop(0.03); if (!RM()) HH.X.shake(dbg.hits.length === N ? 4.5 : 2.5, 0.12);
    }

    /* ---- the update ---- */
    function update(dt, f) {
      const u0 = nowMs(), t = f.t; lastT = t;
      let missing = false;
      const petGone = me.dead || swapped();
      for (const s of sk) {
        // the summon and the hover follow the pet
        if (s.st === 'sum' || s.st === 'hover') {
          if (petGone) { dissipate(s, t, 'cancel'); continue; }
          const [px, py] = slotPos(s), rk = sstep(s.ring + 0.12, s.ring + 0.12 + RISE, t);
          s.x = px; s.y = py; s.z = lerp(0.08, zSlot(s), H.ease.out(rk)) + (rk >= 1 ? 0.06 * Math.sin(t * 5 + s.i * 1.7) : 0); s.alpha = sstep(0, 0.6, rk); s.scale = lerp(0.35, 1, H.ease.back ? Math.min(1.08, H.ease.back(rk)) : rk);
          if (!s.clicked && rk > 0.25) { s.clicked = true; click(0, 0.5); }
          if (rk >= 1 && s.st === 'sum') s.st = 'hover';
          // turning toward the prey (from facing the camera)
          const pv = t > 0.3 ? (s.pv && valid(s.pv) ? s.pv : (s.pv = preview(s))) : null, want = pv ? Math.atan2(pv.y - s.y, pv.x - s.x) : PI / 2;
          s.hd += wrapA(want - s.hd) * Math.min(1, dt * (t > 0.3 ? 7 : 2)); s.tilt = 0.05 * Math.sin(t * 3 + s.i);
          if (t >= s.tl) launch(s, t);
          continue;
        }
        if (s.st === 'fly') {
          const ft = t - s.t1;
          if (s.tgt && !valid(s.tgt)) { const m = acquire(s.x, s.y, CFG.reacq, false); if (m) { s.tgt = m; claim(m); dbg.retargets++; s.d0 = Math.max(1, Math.hypot(m.x - s.x, m.y - s.y)); s.zl = s.z; } else { dissipate(s, t, 'lost'); continue; } }
          if (ft > CFG.life || (!s.tgt && ft > 0.42)) { dissipate(s, t, 'life'); continue; }
          const tx = s.tgt ? s.tgt.x : s.aimX, ty = s.tgt ? s.tgt.y : s.aimY, sp = Math.min(CFG.speed, 2.5 + 22 * ft);
          const nsub = Math.max(1, Math.ceil(sp * dt / 0.12)), dd = dt / nsub; let hit = false;
          for (let k = 0; k < nsub && !hit; k++) {
            const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy) || 1e-6;
            let cur = Math.atan2(s.vy, s.vx); const w = 3 + 14 * sstep(0.04, 0.42, ft) + (d < 1.6 ? 14 : 0), df = wrapA(Math.atan2(dy, dx) - cur); cur += Math.max(-w * dd, Math.min(w * dd, df));
            s.vx = Math.cos(cur) * sp; s.vy = Math.sin(cur) * sp; s.x += s.vx * dd; s.y += s.vy * dd;
            const d2 = Math.hypot(tx - s.x, ty - s.y);
            if (s.tgt && d2 <= s.tgt.r + 0.22) hit = true;
          }
          const d = Math.hypot(tx - s.x, ty - s.y), zT = s.tgt ? zOf(s.tgt) : 0.8, pr = cl(1 - d / s.d0);
          const zG = lerp(zT, s.zl, sstep(0.3, 2.2, d)) + 0.32 * Math.sin(PI * Math.min(1, pr * 1.2)) * sstep(0.4, 1.6, d), z0 = s.z;
          s.z += (zG - s.z) * Math.min(1, dt * 9); s.vz = (s.z - z0) / Math.max(1e-4, dt);
          s.hd = Math.atan2(s.vy, s.vx);
          s.jaw = s.tgt ? sstep(1.6, 0.45, d - s.tgt.r) : 0; s.tilt = s.jaw * 0.42; s.alpha = 1; s.scale = 1 + 0.06 * s.jaw;
          const lp = s.hist[s.hist.length - 1]; if (!lp || Math.hypot(lp.x - s.x, lp.y - s.y) > 0.07) s.hist.push({ x: s.x, y: s.y, z: s.z, t });
          if (hit) impact(s, t);
          continue;
        }
        if (s.st === 'bite') { const u = (t - s.t1) / BITE; if (valid(s.tgt)) { s.x = s.tgt.x - s.bx * (1 - u) * 0.5; s.y = s.tgt.y - s.by * (1 - u) * 0.5; } s.jaw = 1 - sm(u * 1.4); s.scale = 1.06 + 0.16 * u; s.alpha = 1 - sstep(0.4, 1, u); if (u >= 1) { s.st = 'done'; s.gone = t; } continue; }
        if (s.st === 'fade') { const u = (t - s.t1) / FADE; s.alpha = 1 - sm(u); s.z += dt * 0.4; s.jaw *= 0.85; s.scale = 1 - 0.25 * u; if (u >= 1) { s.st = 'done'; s.gone = t; } continue; }
      }
      // trails age out
      for (const s of sk) { while (s.hist.length && t - s.hist[0].t > TR) s.hist.shift(); const kd = kids[s.i]; kd.entY = (s.st === 'done' && !s.hist.length) ? null : s.y + 0.02; }
      // particles
      for (let i = PS.length - 1; i >= 0; i--) { const p = PS[i]; p.t += dt; if (p.t >= p.life) { PS.splice(i, 1); FREE.push(p); continue; }
        const dr = Math.exp(-p.drag * dt); p.vx *= dr; p.vy *= dr; p.vz = p.vz * dr - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; p.spin += p.vs * dt;
        if (p.k === 'frag' && p.z < 0.04 && p.vz < 0) { p.z = 0.04; p.vz *= -0.3; p.vx *= 0.6; p.vy *= 0.6; }
        if (p.k === 'frag' && !p.smoked && p.t > p.life * 0.55) { p.smoked = true; part({ k: 'smoke', x: p.x, y: p.y, z: p.z, vx: p.vx * 0.2, vy: p.vy * 0.2, vz: 0.4, drag: 1.5, life: 0.45, s: p.s * 2.2, grow: 0.8, v: p.v % 2, a: 0.5 }); } }
      // the bake continues a little each frame
      for (const s of sk) if (s.st !== 'done' && s.b != null && !BK.spr.has('H' + s.b)) missing = true;
      bakeStep(missing ? 2 : 1.2);
      // done: every skull resolved, the trails, explosions and particles gone
      const allDone = sk.every(s => s.st === 'done' && !s.hist.length) && !PS.length && exps.every(e => t - e.t0 > 0.75);
      if (allDone) { if (endT < 0) endT = t; f.life = 0; }
      if (t > 8) f.life = 0;
      const du = nowMs() - u0; if (du > dbg.maxUpd) dbg.maxUpd = du;
    }

    /* ---- drawing ---- */
    const T = () => HH.X.Tz();
    const petK = (X, Y, Tt) => { const PX = HH.sx(me.x), PY = HH.sy(me.y) - Tt * 0.5; return lerp(0.35, 1, sstep(Tt * 0.5, Tt * 1.05, Math.hypot(X - PX, Y - PY))); };
    function drawUnder(c, f, X0, Y0, Tt) {
      const t = f.t;
      // the summoning rune rings, rotating, with a faint light column
      const ring = peek('RING');
      for (const s of sk) { const a = sstep(s.ring, s.ring + 0.12, t) * (1 - sstep(s.tl - 0.05, s.tl + 0.25, t)); if (a <= 0.01) continue;
        const [px, py] = slotPos(s), X = HH.sx(px), Y = HH.sy(py), R = Tt * 0.5 * (0.6 + 0.4 * sm((t - s.ring) / 0.2));
        c.save(); c.translate(X, Y); c.scale(1, HH.GY); c.rotate(t * 2.2 * (s.side || 1) + s.seed); if (ring) blit(c, ring.cv, 0, 0, R * 2, R * 2, a * 0.95, true); else { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.6; c.strokeStyle = EDGE; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R * 0.85, 0, TAU); c.stroke(); } c.restore();
        c.save(); glow(c, X, Y, R * 1.1, ENERGY, 0.35 * a); c.restore(); }
      // the impact floor light
      const rs = impRing(); for (const e of exps) { const u = t - e.t0; if (u > 0.7) continue; const X = HH.sx(e.x), Y = HH.sy(e.y), R = Tt * (0.4 + 1.2 * H.ease.out(cl(u / 0.4))) * (e.big ? 1.25 : 1);
        c.save(); c.translate(X, Y); c.scale(1, HH.GY); blit(c, rs, 0, 0, R * 2, R * 2, 0.75 * (1 - sstep(0.1, 0.6, u)), true); c.restore(); c.save(); glow(c, X, Y, Tt * 1.1, ENERGY, 0.5 * (1 - sstep(0, 0.5, u))); c.restore(); }
      // the skulls' soft shadows (they move with them: never a stain)
      const sh = shadowSpr(); for (const s of sk) { if (s.st === 'done' || s.alpha < 0.02) continue; const X = HH.sx(s.x), Y = HH.sy(s.y), w = Tt * 0.7 * s.scale / (1 + s.z * 0.5); c.save(); blit(c, sh, X, Y, w, w * HH.GY, s.alpha * 0.8 * petK(X, Y - s.z * Tt, Tt), false); c.restore(); }
    }
    function drawRibbon(c, s, Tt, t) {
      const n = s.hist.length; if (n < 2 && s.st !== 'fly') return;
      const pts = []; for (let k = 0; k < n; k++) { const p = s.hist[k], age = t - p.t, ak = cl(age / TR); pts.push([HH.sx(p.x), HH.sy(p.y) - (p.z + age * 0.7) * Tt, ak]); }
      if (s.st === 'fly' || s.st === 'bite') pts.push([HH.sx(s.x), HH.sy(s.y) - s.z * Tt, 0]);
      if (pts.length < 2) return;
      // a streaming wobble across the ribbon, growing with age
      for (let k = 0; k < pts.length; k++) { const p = pts[k], q = pts[Math.min(pts.length - 1, k + 1)], o = pts[Math.max(0, k - 1)]; let tx = q[0] - o[0], ty = q[1] - o[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l; const w = Math.sin(t * 15 - k * 0.9 + s.seed) * Tt * 0.09 * p[2]; p[0] += -ty * w; p[1] += tx * w; }
      const smk = [peek('SMK0'), peek('SMK1')];
      // the smoky body: soft stamps, widening and fading with age
      c.save();
      let acc = 0; for (let k = 0; k < pts.length; k++) { const p = pts[k], w = Tt * (0.26 + 0.4 * p[2]) * (k === pts.length - 1 ? 0.7 : 1); if (k > 0) acc += Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]); if (k > 0 && k < pts.length - 1 && acc < w * 0.35) continue; acc = 0;
        const a = Math.pow(1 - p[2], 0.85); if (smk[k % 2]) blit(c, smk[k % 2].cv, p[0], p[1], w * 2, w * 2, 0.8 * a, false);
        glow(c, p[0], p[1], w * 1.3, EDGE, 0.2 * a); }
      // the bright narrow core (feathered: a wider faint pass under a thin bright one)
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
      for (const [wk, col, ak] of [[0.2, EDGE, 0.2], [0.05, ACC, 0.6], [0.02, '#FFF4FF', 0.45]]) {
        for (let k = 1; k < pts.length; k++) { const a = Math.pow(1 - pts[k][2], 1.5) * ak; if (a < 0.02) continue; c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = Math.max(0.8, Tt * wk * (1 - 0.6 * pts[k][2])); c.beginPath(); c.moveTo(pts[k - 1][0], pts[k - 1][1]); c.lineTo(pts[k][0], pts[k][1]); c.stroke(); } }
      c.restore();
    }
    function drawSkull(c, s) {
      const Tt = T(), t = lastT; drawRibbon(c, s, Tt, t);
      if (s.st === 'done' || s.alpha < 0.02) return;
      const X = HH.sx(s.x), Y = HH.sy(s.y) - s.z * Tt, pk = petK(X, Y, Tt), A = s.alpha * pk;
      // the view: the skull's floor heading on screen (0 = toward the viewer), mirrored for the left
      const cx2 = Math.cos(s.hd), cy2 = Math.sin(s.hd), yawS = Math.atan2(cx2, cy2), mir = yawS < 0, ay = Math.abs(yawS), b = Math.max(0, Math.min(NB - 1, Math.round(ay / PI * (NB - 1)))); s.b = b;
      const pr = pair(b), hd = pr && pr[0], jw = pr && pr[1], side = Math.abs(Math.sin(ay)), front = Math.cos(ay);
      // a nose-follows-the-path pitch (profile views) and the pre-bite forward tilt
      let pitch = 0; if (s.st === 'fly') { const sxv = Math.abs(s.vx), syv = s.vy * HH.GY - s.vz; pitch = Math.max(-0.6, Math.min(0.6, Math.atan2(syv, Math.max(0.5, sxv)))) * side * 0.7; }
      const rot = pitch + s.tilt * side + 0.05 * Math.sin(t * 3.1 + s.seed) * (s.st === 'hover' ? 1 : 0.3), sqY = 1 - 0.12 * s.tilt * Math.max(0, front);
      const k = U_T * Tt * s.scale / (hd ? hd.sz : BK.px);
      // the mouth fire behind the jaw, the glow round the skull
      c.save(); glow(c, X, Y, Tt * 0.75 * s.scale, ENERGY, 0.3 * A + 0.25 * s.jaw * A); c.restore();
      if (!hd || !jw) { drawFallback(c, X, Y, Tt * s.scale, A, mir, s.jaw); return; }
      c.save(); c.translate(X, Y); if (mir) c.scale(-1, 1); c.rotate(rot); c.scale(k, k * sqY); c.translate(-hd.cx, -hd.cy);
      const flick = 0.75 + 0.25 * Math.sin(t * 31 + s.seed * 3) * Math.sin(t * 17 + s.seed), open = s.jaw;
      // the jaw on its hinge (rotation in profile, a drop in the front and back views)
      c.save(); c.translate(jw.pv[0], jw.pv[1]); c.rotate(open * 0.62 * side); c.translate(-jw.pv[0], -jw.pv[1] + open * 0.2 * hd.sz * Math.abs(front) * 0.6);
      c.globalAlpha = A; c.drawImage(jw.body, 0, 0); c.globalCompositeOperation = 'lighter'; c.globalAlpha = A * cl(0.25 + open * 0.9) * flick; c.drawImage(jw.mouth, 0, 0); c.restore();
      // the violet fire inside the mouth (between the jaw and the head)
      if (open > 0.05) { c.save(); const fr = peek('FLM' + (s.i % 2)); if (fr) { const r = hd.sz * (0.28 + 0.12 * open) * (0.9 + 0.2 * flick); c.globalCompositeOperation = 'lighter'; c.globalAlpha = A * open * 0.9; c.drawImage(fr.add, hd.mo[0] - r, hd.mo[1] - r + open * 0.06 * hd.sz, r * 2, r * 2); } c.restore(); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = A; c.drawImage(hd.body, 0, 0);
      c.globalCompositeOperation = 'lighter';
      const pulse = 0.7 + 0.3 * Math.sin(t * 9 + s.seed * 2); c.globalAlpha = A * pulse; c.drawImage(hd.em, 0, 0);
      c.globalAlpha = A * cl(0.2 + open * 0.95) * flick; c.drawImage(hd.mouth, 0, 0);
      if (cel && hd.acc) { c.globalAlpha = A * (0.75 + 0.25 * Math.sin(t * 6 + s.seed)); c.drawImage(hd.acc, 0, 0); }
      c.restore();
      // the eyes' bloom (screen space, after the transform)
      c.save(); const cr = Math.cos(rot), sr = Math.sin(rot);
      for (const e of hd.eyes) { if (e[2] < 0.05) continue; let ex = (e[0] - hd.cx) * k, ey = (e[1] - hd.cy) * k * sqY; const rx = ex * cr - ey * sr, ryy = ex * sr + ey * cr; ex = mir ? -rx : rx; glow(c, X + ex, Y + ryy, Tt * 0.2 * s.scale, RUBY, 0.55 * A * e[2] * pulse); }
      c.restore();
    }
    function drawFallback(c, X, Y, s, A, mir, open) {   // (a plain skull while its views bake)
      c.save(); c.translate(X, Y); if (mir) c.scale(-1, 1); c.globalAlpha = A;
      c.fillStyle = BODY; c.strokeStyle = H.rgba(EDGE, 0.7); c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(-s * 0.24, -s * 0.24); c.lineTo(s * 0.18, -s * 0.28); c.lineTo(s * 0.3, -s * 0.02); c.lineTo(s * 0.22, s * 0.12); c.lineTo(-s * 0.1, s * 0.14); c.lineTo(-s * 0.26, 0); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.12, s * 0.12 + open * s * 0.08); c.lineTo(s * 0.22, s * 0.14 + open * s * 0.12); c.lineTo(s * 0.12, s * 0.24 + open * s * 0.12); c.lineTo(-s * 0.08, s * 0.2 + open * s * 0.08); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = RUBY; c.beginPath(); c.moveTo(s * 0.06, -s * 0.06); c.lineTo(s * 0.2, -s * 0.12); c.lineTo(s * 0.14, s * 0.02); c.closePath(); c.fill();
      c.restore();
    }
    function draw(c, f, X0, Y0, Tt) {
      const u0 = nowMs(), t = f.t;
      // Celestial: faint rune threads connect the four skulls while they gather
      if (cel) { const a = sstep(0.32, 0.5, t) * (1 - sstep(LAUNCH - 0.08, LAUNCH + 0.06, t)); if (a > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        const live = sk.filter(s => s.st === 'hover' || s.st === 'sum');
        for (let k = 1; k < live.length; k++) { const p = live[k - 1], q = live[k], P1 = [HH.sx(p.x), HH.sy(p.y) - p.z * Tt], Q1 = [HH.sx(q.x), HH.sy(q.y) - q.z * Tt], mx = (P1[0] + Q1[0]) / 2, my = (P1[1] + Q1[1]) / 2 + Tt * 0.18, fl = 0.75 + 0.25 * Math.sin(t * 23 + k * 2);
          for (const [w, col, al] of [[Tt * 0.08, EDGE, 0.18], [Math.max(0.8, Tt * 0.022), ACC, 0.65]]) { c.globalAlpha = a * al * fl; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(P1[0], P1[1]); c.quadraticCurveTo(mx, my, Q1[0], Q1[1]); c.stroke(); }
          // a small rune at the middle of each thread
          const gx = (P1[0] + 2 * mx + Q1[0]) / 4, gy = (P1[1] + 2 * my + Q1[1]) / 4, r = Tt * 0.09; c.globalAlpha = a * 0.85 * fl; c.strokeStyle = ACC; c.lineWidth = Math.max(0.8, Tt * 0.02);
          c.beginPath(); c.moveTo(gx - r, gy + r * 0.6); c.lineTo(gx, gy - r); c.lineTo(gx + r, gy + r * 0.6); c.moveTo(gx - r * 0.5, gy); c.lineTo(gx + r * 0.5, gy); c.stroke(); glow(c, gx, gy, r * 2.5, EDGE, 0.3 * a); }
        c.restore(); } }
      // the detonations: a compact crimson flash, expanding violet-black flame
      for (const e of exps) { const u = t - e.t0; if (u > 0.75) continue; const X = HH.sx(e.x), Y = HH.sy(e.y) - e.z * Tt, big = e.big ? 1.25 : 1, fr = peek('FLM' + (e.sd > 5 ? 1 : 0)) || peek('FLM0');
        c.save();
        if (u < 0.12) { const k = 1 - u / 0.12; glow(c, X, Y, Tt * (0.9 + 0.5 * (1 - k)) * big, CRIM, 0.95 * k); glow(c, X, Y, Tt * 0.38 * big, '#FF5A7A', 0.75 * k * k); }
        if (fr) { const g2 = H.ease.out(cl(u / 0.4)), R = Tt * (0.35 + 1.05 * g2) * big, fa = 1 - sstep(0.2, 0.7, u);
          c.translate(X, Y); c.rotate(e.sd + u * 1.6);
          blit(c, fr.dark, 0, 0, R * 2.1, R * 2.1, 0.9 * fa * (1 - sstep(0.45, 0.75, u)), false);
          blit(c, fr.add, 0, 0, R * 2, R * 2, 0.75 * fa, true);
          c.rotate(-2 * (e.sd + u * 1.6)); blit(c, fr.add, 0, 0, R * 1.4, R * 1.4, 0.4 * fa * (1 - sstep(0.1, 0.4, u)), true); }
        c.restore(); c.save(); glow(c, X, Y, Tt * 1.4 * big, EDGE, 0.45 * (1 - sstep(0.05, 0.5, u))); c.restore(); }
      // particles: smoke behind, then embers and the spinning obsidian fragments
      c.save();
      for (const p of PS) { if (p.k !== 'smoke') continue; const u = p.t / p.life, X = HH.sx(p.x), Y = HH.sy(p.y) - p.z * Tt, w = Tt * p.s * (1 + p.grow * u) * 2, sp = peek('SMK' + p.v); if (sp) blit(c, sp.cv, X, Y, w, w, p.a * (1 - u) * sstep(0, 0.12, u), false); }
      for (const p of PS) { if (p.k !== 'ember') continue; const u = p.t / p.life, X = HH.sx(p.x), Y = HH.sy(p.y) - p.z * Tt; glow(c, X, Y, Tt * p.s * 2.4, p.v ? EDGE : RUBY, 0.8 * (1 - u)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - u; c.fillStyle = p.v === 2 ? '#FFD6E0' : ACC; c.fillRect(X - 1, Y - 1, 2, 2); c.globalCompositeOperation = 'source-over'; }
      for (const p of PS) { if (p.k !== 'frag') continue; const u = p.t / p.life, X = HH.sx(p.x), Y = HH.sy(p.y) - p.z * Tt, s = Tt * p.s, fl = Math.cos(p.spin), a = 1 - sstep(0.5, 1, u);
        c.save(); c.translate(X, Y); c.rotate(p.rot); c.scale(Math.max(0.15, Math.abs(fl)), 1); c.globalAlpha = a;
        c.beginPath(); c.moveTo(-s * 0.6, -s * 0.2); c.lineTo(-s * 0.1, -s * 0.75); c.lineTo(s * 0.7, -s * 0.15); c.lineTo(s * 0.2, s * 0.55); c.closePath(); c.fillStyle = '#120A1E'; c.fill();
        c.beginPath(); c.moveTo(-s * 0.1, -s * 0.75); c.lineTo(s * 0.7, -s * 0.15); c.lineTo(s * 0.05, -s * 0.05); c.closePath(); c.fillStyle = fl > 0 ? '#5B3C82' : '#2B1A40'; c.fill();
        c.strokeStyle = fl > 0 ? 'rgba(208,174,255,0.85)' : 'rgba(165,92,255,0.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-s * 0.1, -s * 0.75); c.lineTo(s * 0.7, -s * 0.15); c.stroke();
        if (u < 0.35) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - u / 0.35) * 0.7; c.strokeStyle = RUBY; c.beginPath(); c.moveTo(-s * 0.6, -s * 0.2); c.lineTo(s * 0.2, s * 0.55); c.stroke(); }
        c.restore(); }
      c.restore();
      const du = nowMs() - u0; if (du > dbg.maxDraw) dbg.maxDraw = du;
    }
  };
  S.deathspursuit.cfg = CFG;
  S.deathspursuit._bk = BK;
  S.deathspursuit._sheet = sheet;
})();
