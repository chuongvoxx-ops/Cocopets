/* ---------- Dark Strongs, new: Eclipse Mantle and Witch's Brand ----------
   They replace Raven Fold and Umbral Hook (rows in 20k1: 'eclipsemantle' cost 28 cd 8, 'witchsbrand' cost 26 cd 3.2).
   Tiers (C.evo): levels 1-3 base, 4-6 Adept, 7 Celestial.

   ECLIPSE MANTLE (defence, no damage, no healing)
     A small eclipsed moon forms over the pet and a ground pulse runs out to RANGE (4.5 tiles) showing who is covered.
     Recipients, once, at the cast: the caster, plus every Day of the Dead spirit (20k5q) standing within RANGE when the
     played pet casts (each through its own ward list, S.X.addWard, sized from its own max HP = its temporary hpMax).
     In the Tower the played pet is the only party member on the field, so nobody else is covered. A spirit that casts
     it covers itself only.
     Shield per recipient: 10 / 14 / 18 % of ITS max HP (H.X.ST().hp for the pet) for 6 / 7 / 8 s (EM below).
     Absorption: X.addWard (the game's ward chain in hurtPet: after all mitigation, in order with Rock Steady / Zephyr,
     before Love Sanctuary and Rebuttal's guard). Reapplication never adds: the greater of the remaining shield and the
     new grant is kept, the expiry becomes max(old, new). The shield follows its recipient; a party swap or the
     recipient's fall dissolves it (the ward is released at once). Depleted: breaks into black feathers and silver
     sparks; natural expiry: a gentle dissolve.
     Pictures: the moon is a per-pixel shaded sphere with a silver-violet corona (a richer, rayed one at Celestial),
     baked once; the cloak is a surface of revolution cut into ribbons that sway and scroll a baked smoke texture, its
     back half drawn under the pet (drawUnder) and its front half translucent over it; luminous cracks spread as the
     shield falls; absorbs ripple outward from the side the hit came from; crescent fragments orbit on a thin ring
     (a second tilted ring at Celestial).

   WITCH'S BRAND (debuff + one delayed detonation)
     A rotating demonic seal (three baked layers turning in opposite directions, a ground footprint of light) unfolds
     over the aimed point (reach 6.5 tiles, snapped to walkable ground); threads descend from its glyphs and at
     WB.applyT (0.55 s) every living monster within R of the centre (R = 1.9 / 2.15 / 2.4 tiles) is branded:
       defence -15 / -20 / -25 % (hitMon: damage taken x (1 + def), every allied hit, bosses included; it MULTIPLIES
       with Windworn's x1.25), movement -20 / -25 / -30 % (updMon: the walking speed A.sp x (1 - slow); a boss keeps
       its scripted movement as with Windworn, so its slow is 0 while the defence cut and the detonation still apply),
       for 6 / 7 / 8 s. No damage on application or during the brand.
     Natural expiry: the brand detonates once on its bearer: H.X.hitMon(m, det) with det = WB.detK (2.6) x base x K x
     (1 + 0.08 (evo - 1)) (Dark, the Strong formula, crits allowed), resolved BEFORE the modifiers are cleared, so it
     benefits from the defence cut. Single target, no splash, no chain.
     One brand per monster (m.wBrand, a unique id): a recast keeps the strongest defence / slow / damage and moves the
     single expiry to max(old, new); the detonation reads the instance's current expiry, so the old timer never fires.
     The atomic flag is the instance's state: 'on' -> 'det' (once) or 'cancel'.
     Death, despawn (no longer in the monster list), the effect's removal (onEnd) or a cleanse cancel it without a
     detonation. The game has no monster cleanse; S.witchsbrand.cleanse(m) is the hook for one. No full-mark immunity
     exists in the status system. If the caster falls or the pet is swapped before the brands land, the seal fades and
     nothing is applied; once applied, brands run their course.
   Cost: everything heavy is a cached sprite (smoke texture, moon, crescent, feather, seal layers, footprint, emblem),
   baked lazily from a queue (one sprite at a time, ~2 ms budget a frame; Strongs are not prewarmed) with the layer
   simply skipped until it exists. */
(() => {
  const S = ELEM_IMPL.dark.strong; delete S.ravenfold; delete S.umbralhook;
  const TAU = Math.PI * 2, GY = 0.55;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const SILV = '#ECE6FA', CRIM = '#D0183F', RUBY = '#FF2D55';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const tierOf = ev => (ev >= 7 ? 2 : ev >= 4 ? 1 : 0);
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const backE = u => { const s = 1.7; u = cl(u) - 1; return u * u * ((s + 1) * u + s) + 1; };

  /* ================= lazily baked sprites ================= */
  const SPR = {}, QUEUE = [];
  function need(name, fn) { if (name in SPR || QUEUE.some(q => q.name === name)) return; QUEUE.push({ name, fn }); }
  const BT = {};   // (bake times, ms: a debug read-out)
  function pump(ms) { const t0 = nowMs(); while (QUEUE.length && nowMs() - t0 < ms) { const q = QUEUE[0], a = nowMs();
      try { if (!q.it) { const v = q.fn(); if (v && typeof v.next === 'function') q.it = v; else { SPR[q.name] = v; QUEUE.shift(); } }
        if (q.it) { let r; do { r = q.it.next(); } while (!r.done && nowMs() - t0 < ms); if (r.done) { SPR[q.name] = r.value; QUEUE.shift(); } } }
      catch (e) { SPR[q.name] = null; QUEUE.shift(); }
      BT[q.name] = +((BT[q.name] || 0) + nowMs() - a).toFixed(2); BTmax[q.name] = Math.max(BTmax[q.name] || 0, +(nowMs() - a).toFixed(2)); } }
  const BTmax = {};
  const spr = n => SPR[n] || null;
  // a tileable value noise (period p cells)
  const hashP = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
  function vnoiseP(x, y, p) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), m = k => ((k % p) + p) % p;
    const a = hashP(m(xi), m(yi)), b = hashP(m(xi + 1), m(yi)), c = hashP(m(xi), m(yi + 1)), d = hashP(m(xi + 1), m(yi + 1)); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const fbmP = (x, y, p) => vnoiseP(x, y, p) * 0.55 + vnoiseP(x * 2, y * 2, p * 2) * 0.28 + vnoiseP(x * 4, y * 4, p * 4) * 0.17;
  const hx = h => hexRGB(h);
  // the smoke texture: deep violet smoke with lighter wisps (tileable, 128 px)
  function* bakeTex() { const N = 128, cv = mk(N, N), c = cv.getContext('2d'), im = c.createImageData(N, N), A = hx(VOID), B = hx(PLUM), Cc = hx(SMOKE), E = hx(ENERGY);
    for (let y = 0; y < N; y++) { for (let x = 0; x < N; x++) { const u = x / N * 4, v = y / N * 4, w = fbmP(u + fbmP(u + 1.7, v + 9.2, 4) * 1.6, v + fbmP(u + 5.1, v + 2.3, 4) * 1.6, 4), k = sm((w - 0.25) / 0.6), hi = sm((w - 0.62) / 0.2) * 0.6, i = (y * N + x) * 4;
      for (let j = 0; j < 3; j++) im.data[i + j] = Math.round(lerp(lerp(A[j], B[j], k), lerp(Cc[j], E[j], 0.4), hi)); im.data[i + 3] = 255; } if (y % 2 === 1) yield 0; }
    c.putImageData(im, 0, 0); return cv; }
  // the eclipsed moon: an obsidian sphere lit faintly from the upper left, back-lit at its limb, a silver-violet corona
  function* bakeMoon(rich) { const N = 176, cv = mk(N, N), c = cv.getContext('2d'), im = c.createImageData(N, N), cx = N / 2, rm = 44, L = [-0.48, -0.62, 0.62], Ln = Math.hypot(...L), V = hx(VOID), Bd = hx(BODY), Pl = hx(PLUM), Ed = hx(EDGE), Sv = hx(SILV), Ac = hx(ACC);
    for (let y = 0; y < N; y++) { if (y % 3 === 2) yield 0; for (let x = 0; x < N; x++) { const dx = (x + 0.5 - cx) / rm, dy = (y + 0.5 - cx) / rm, d = Math.hypot(dx, dy), th = Math.atan2(dy, dx), i = (y * N + x) * 4; let r = 0, g = 0, b = 0, a = 0;
      if (d < 1) { const nz = Math.sqrt(1 - d * d), di = Math.max(0, (dx * L[0] + dy * L[1] + nz * L[2]) / Ln), tx = fbmP(dx * 3 + 4, dy * 3 + 4, 64), rim = Math.pow(1 - nz, 3);
        const k1 = 0.25 + 0.75 * di * di; for (let j = 0; j < 3; j++) { const base = lerp(V[j], lerp(Bd[j], Pl[j], tx), k1) * (0.8 + 0.35 * tx); const v = base + (Ed[j] - base) * rim * 0.75 + Sv[j] * Math.pow(di, 18) * 0.25; if (j === 0) r = v; else if (j === 1) g = v; else b = v; }
        a = 1; const e = cl((1 - d) * rm); a = Math.min(1, 0.4 + e); }
      else { const e = d - 1, ang = rich ? 1 + 0.9 * Math.pow(Math.max(0, Math.cos(8 * th + 2 * fbmP(th * 2 + 3, 1, 64))), 5) : 1 + 0.25 * Math.sin(5 * th + 1);
        const ring = Math.exp(-e * rm / 3.2), halo = Math.exp(-e * (rich ? 2.0 : 2.8) / Math.max(0.6, ang * 0.75)) * (rich ? 0.95 : 0.8), bead = Math.exp(-Math.pow((th + 0.8) / 0.22, 2)) * Math.exp(-e * 7) * 1.4;
        const I = cl(ring + halo * ang * 0.8 + bead), hot = cl(ring * 1.2 + bead);
        for (let j = 0; j < 3; j++) { const col = lerp(lerp(Ed[j], Ac[j], cl(halo)), Sv[j], hot); if (j === 0) r = col; else if (j === 1) g = col; else b = col; } a = I; }
      im.data[i] = r; im.data[i + 1] = g; im.data[i + 2] = b; im.data[i + 3] = Math.round(cl(a) * 255); } }
    c.putImageData(im, 0, 0); return { cv, rm, N }; }
  // a crescent fragment (pointing +x): silver-violet edge, a dark smoky body
  function bakeCres() { const N = 48, cv = mk(N, N), c = cv.getContext('2d'); c.translate(N / 2, N / 2);
    const g0 = c.createRadialGradient(0, 0, 2, 0, 0, 22); g0.addColorStop(0, rgba(EDGE, 0.5)); g0.addColorStop(1, rgba(EDGE, 0)); c.fillStyle = g0; c.fillRect(-24, -24, 48, 48);
    const path = () => { c.beginPath(); c.arc(0, 0, 13, -Math.PI * 0.5, Math.PI * 0.5); c.arc(-6, 0, 13 * 1.06, Math.PI * 0.42, -Math.PI * 0.42, true); c.closePath(); };
    const gb = c.createLinearGradient(-6, -13, 10, 13); gb.addColorStop(0, '#5A3F7E'); gb.addColorStop(0.5, BODY); gb.addColorStop(1, VOID); path(); c.fillStyle = gb; c.fill();
    c.save(); path(); c.clip(); c.strokeStyle = SILV; c.lineWidth = 2.4; c.beginPath(); c.arc(0, 0, 12.4, -Math.PI * 0.48, Math.PI * 0.48); c.stroke(); c.restore();
    c.strokeStyle = rgba(ACC, 0.9); c.lineWidth = 1; path(); c.stroke(); return cv; }
  // a black feather (rachis along +x): a dark vane, a silver edge on one side, notched barbs
  function bakeFeather() { const W = 64, Hh = 24, cv = mk(W, Hh), c = cv.getContext('2d'); c.translate(4, Hh / 2);
    const vane = () => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(14, -10, 40, -10, 56, -1); c.bezierCurveTo(42, 7, 16, 9, 0, 0); c.closePath(); };
    const g0 = c.createLinearGradient(0, -9, 0, 9); g0.addColorStop(0, '#3A2A55'); g0.addColorStop(0.45, BODY); g0.addColorStop(1, VOID); vane(); c.fillStyle = g0; c.fill();
    c.save(); c.globalCompositeOperation = 'destination-out'; c.lineWidth = 1.4; for (const [x, s] of [[18, -1], [31, -1], [26, 1], [42, 1]]) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 6, s * 9); c.stroke(); } c.restore();
    c.strokeStyle = rgba(SILV, 0.85); c.lineWidth = 1.2; c.beginPath(); c.moveTo(2, -1); c.bezierCurveTo(14, -10, 40, -10, 56, -1); c.stroke();
    c.strokeStyle = rgba(ACC, 0.6); c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, 0); c.lineTo(56, -1); c.stroke(); return cv; }
  // seal glyphs: angular runes, seeded
  function glyph(c, x, y, s, rot, seed) { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); const n = 3 + Math.floor(R1(seed) * 2); let px = (R1(seed + 1) - 0.5) * s, py = -s * 0.6; c.moveTo(px, py);
    for (let k = 0; k < n; k++) { const ax = (R1(seed + 2 + k) - 0.5) * s * 1.1, ay = -s * 0.6 + (k + 1) / n * s * 1.2; if (R1(seed + 9 + k) < 0.35) { c.moveTo(ax, ay); } else c.lineTo(ax, ay); px = ax; py = ay; }
    c.moveTo(-s * 0.35, (R1(seed + 20) - 0.5) * s * 0.6); c.lineTo(s * 0.35, (R1(seed + 21) - 0.5) * s * 0.6); c.stroke(); c.restore(); }
  const SEALPX = 360;
  function sealCtx() { const cv = mk(SEALPX, SEALPX), c = cv.getContext('2d'); c.translate(SEALPX / 2, SEALPX / 2); return { cv, c, R: SEALPX / 2 - 6 }; }
  function texFill(c, a) { const T = spr('tex'); c.save(); c.globalAlpha = a; c.fillStyle = T ? c.createPattern(T, 'repeat') : BODY; c.fill(); c.restore(); }
  function edgeStroke(c, col, lw, blur) { c.save(); c.strokeStyle = col; c.lineWidth = lw; c.shadowColor = EDGE; c.shadowBlur = blur || 0; c.stroke(); c.restore(); }
  function annulus(c, r0, r1) { c.beginPath(); c.arc(0, 0, r1, 0, TAU); c.arc(0, 0, r0, 0, TAU, true); c.closePath(); }
  function bakeSealOuter(tier) { const { cv, c, R } = sealCtx();
    annulus(c, R * 0.82, R * 0.96); texFill(c, 0.92); const gl = c.createRadialGradient(0, 0, R * 0.8, 0, 0, R); gl.addColorStop(0, rgba(ENERGY, 0)); gl.addColorStop(0.5, rgba(ENERGY, 0.28)); gl.addColorStop(1, rgba(ENERGY, 0)); c.save(); c.globalCompositeOperation = 'lighter'; annulus(c, R * 0.82, R * 0.96); c.fillStyle = gl; c.fill(); c.restore();
    c.beginPath(); c.arc(0, 0, R * 0.96, 0, TAU); edgeStroke(c, EDGE, 2.2, 6); c.beginPath(); c.arc(0, 0, R * 0.82, 0, TAU); edgeStroke(c, EDGE, 1.8, 5);
    c.beginPath(); c.arc(0, 0, R * 0.96, 0, TAU); edgeStroke(c, rgba(SILV, 0.8), 0.8);
    const NG = 12 + tier * 2; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < NG; i++) { const a = i / NG * TAU, rr = R * 0.89; c.strokeStyle = ACC; c.lineWidth = 2; c.shadowColor = EDGE; c.shadowBlur = 7; glyph(c, Math.cos(a) * rr, Math.sin(a) * rr, R * 0.085, a + Math.PI / 2, i * 7.3 + 3); }
    c.shadowBlur = 0; c.strokeStyle = rgba(ACC, 0.75); c.lineWidth = 1.5; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU, r0 = R * (i % 4 ? 0.985 : 0.97); c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * R, Math.sin(a) * R); c.stroke(); }
    c.setLineDash([R * 0.18, R * 0.07]); c.beginPath(); c.arc(0, 0, R * 0.775, 0, TAU); edgeStroke(c, rgba(EDGE, 0.8), 1.2, 3); c.setLineDash([]); return cv; }
  function bakeSealMid(tier) { const { cv, c, R } = sealCtx(), n = 7, rr = R * 0.7, P = k => [Math.cos(k / n * TAU - Math.PI / 2) * rr, Math.sin(k / n * TAU - Math.PI / 2) * rr];
    // a heptagram {7/3}: its points filled with dark textured smoke, edges luminous
    c.beginPath(); for (let k = 0; k <= n; k++) { const p = P(k * 3); if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } c.closePath(); c.save(); c.fillStyle = '#000'; texFill(c, 0.6); c.restore();
    c.lineJoin = 'miter'; edgeStroke(c, EDGE, 2, 7); edgeStroke(c, rgba(SILV, 0.6), 0.7);
    annulus(c, rr * 0.98, rr * 1.06); texFill(c, 0.95); c.beginPath(); c.arc(0, 0, rr * 1.06, 0, TAU); edgeStroke(c, EDGE, 1.6, 4); c.beginPath(); c.arc(0, 0, rr * 0.98, 0, TAU); edgeStroke(c, EDGE, 1.2, 3);
    c.lineCap = 'round'; for (let k = 0; k < n; k++) { const p = P(k), a = k / n * TAU; c.save(); c.translate(p[0] * 1.02, p[1] * 1.02); c.rotate(a); c.beginPath(); c.moveTo(0, -R * 0.06); c.lineTo(R * 0.035, 0); c.lineTo(0, R * 0.06); c.lineTo(-R * 0.035, 0); c.closePath(); c.fillStyle = PLUM; c.fill(); edgeStroke(c, ACC, 1.4, 5); c.restore(); }
    if (tier >= 1) { c.strokeStyle = ACC; c.lineWidth = 1.6; c.shadowColor = EDGE; c.shadowBlur = 5; for (let k = 0; k < n; k++) { const a = (k + 0.5) / n * TAU - Math.PI / 2; glyph(c, Math.cos(a) * rr * 0.62, Math.sin(a) * rr * 0.62, R * 0.06, a + Math.PI / 2, k * 3.1 + 40); } c.shadowBlur = 0; }
    return cv; }
  function bakeSealInner() { const { cv, c, R } = sealCtx();
    annulus(c, R * 0.27, R * 0.36); texFill(c, 0.95); c.beginPath(); c.arc(0, 0, R * 0.36, 0, TAU); edgeStroke(c, EDGE, 1.8, 5); c.beginPath(); c.arc(0, 0, R * 0.27, 0, TAU); edgeStroke(c, EDGE, 1.4, 4);
    c.strokeStyle = ACC; c.lineWidth = 1.5; c.shadowColor = EDGE; c.shadowBlur = 5; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; glyph(c, Math.cos(a) * R * 0.315, Math.sin(a) * R * 0.315, R * 0.04, a + Math.PI / 2, i * 5.7 + 90); } c.shadowBlur = 0;
    // the central diamond: four facets of obsidian, lit from the upper left, violet edges, a crimson-violet core
    const d = R * 0.2, w = R * 0.13, F = [[[0, -d], [-w, 0], [0, 0]], [[0, -d], [w, 0], [0, 0]], [[-w, 0], [0, d], [0, 0]], [[w, 0], [0, d], [0, 0]]], FC = ['#5B4383', '#2E1E4C', '#22163A', VOID];
    F.forEach((f, i) => { c.beginPath(); c.moveTo(f[0][0], f[0][1]); c.lineTo(f[1][0], f[1][1]); c.lineTo(f[2][0], f[2][1]); c.closePath(); c.fillStyle = FC[i]; c.fill(); });
    c.beginPath(); c.moveTo(0, -d); c.lineTo(w, 0); c.lineTo(0, d); c.lineTo(-w, 0); c.closePath(); edgeStroke(c, EDGE, 2, 8); edgeStroke(c, rgba(SILV, 0.7), 0.8);
    const gc = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.8); gc.addColorStop(0, '#FFE1EA'); gc.addColorStop(0.3, RUBY); gc.addColorStop(1, rgba(CRIM, 0)); c.globalCompositeOperation = 'lighter'; c.fillStyle = gc; c.beginPath(); c.arc(0, 0, w * 0.8, 0, TAU); c.fill(); return cv; }
  // the footprint on the floor: light only (an additive violet ring and a faint inner wash)
  function* bakeGround() { const N = 256, cv = mk(N, N), c = cv.getContext('2d'), im = c.createImageData(N, N), E = hx(EDGE), A = hx(ACC);
    for (let y = 0; y < N; y++) { if (y % 4 === 3) yield 0; for (let x = 0; x < N; x++) { const d = Math.hypot(x + 0.5 - N / 2, y + 0.5 - N / 2) / (N / 2 - 4), th = Math.atan2(y - N / 2, x - N / 2), i = (y * N + x) * 4;
      const ring = Math.exp(-Math.pow((d - 0.95) / 0.035, 2)), ring2 = Math.exp(-Math.pow((d - 0.62) / 0.02, 2)) * 0.45 * (0.6 + 0.4 * Math.cos(th * 7)), wash = d < 0.95 ? 0.1 + 0.08 * fbmP(x / 32, y / 32, 8) : 0, halo = Math.exp(-Math.pow((d - 0.95) / 0.12, 2)) * 0.35;
      const I = cl(ring + ring2 + wash + halo); for (let j = 0; j < 3; j++) im.data[i + j] = Math.round(lerp(E[j], A[j], cl(ring))); im.data[i + 3] = Math.round(I * 255); } }
    c.putImageData(im, 0, 0); return cv; }
  // the brand emblem: a horned diamond sigil, dark textured body, violet emissive edges; and its crimson core
  function bakeBrand() { const N = 112, cv = mk(N, N), c = cv.getContext('2d'); c.translate(N / 2, N / 2 + 4); const s = 30;
    const gl = c.createRadialGradient(0, 0, 4, 0, 0, 50); gl.addColorStop(0, rgba(EDGE, 0.45)); gl.addColorStop(1, rgba(EDGE, 0)); c.fillStyle = gl; c.fillRect(-56, -60, 112, 112);
    // horns: two crescents curling up from the sides
    for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(sg * s * 0.45, -s * 0.2); c.quadraticCurveTo(sg * s * 1.15, -s * 0.55, sg * s * 0.7, -s * 1.35); c.quadraticCurveTo(sg * s * 0.82, -s * 0.62, sg * s * 0.25, -s * 0.48); c.closePath(); c.fillStyle = BODY; c.fill(); edgeStroke(c, EDGE, 1.6, 6); }
    const dia = () => { c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.62, 0); c.lineTo(0, s); c.lineTo(-s * 0.62, 0); c.closePath(); };
    dia(); c.fillStyle = BODY; c.fill(); dia(); texFill(c, 0.7); dia(); edgeStroke(c, EDGE, 2.4, 9); dia(); edgeStroke(c, rgba(SILV, 0.75), 0.9);
    c.beginPath(); c.moveTo(0, -s * 0.62); c.lineTo(s * 0.36, 0); c.lineTo(0, s * 0.62); c.lineTo(-s * 0.36, 0); c.closePath(); edgeStroke(c, ACC, 1.2, 4);
    c.strokeStyle = ACC; c.lineWidth = 1.4; c.shadowColor = EDGE; c.shadowBlur = 5; c.beginPath(); c.moveTo(-s * 0.85, s * 0.05); c.lineTo(-s * 0.68, s * 0.05); c.moveTo(s * 0.85, s * 0.05); c.lineTo(s * 0.68, s * 0.05); c.moveTo(0, s * 1.02); c.lineTo(0, s * 1.3); c.stroke(); c.shadowBlur = 0;
    // the slit
    c.beginPath(); c.moveTo(0, -s * 0.4); c.quadraticCurveTo(s * 0.12, 0, 0, s * 0.4); c.quadraticCurveTo(-s * 0.12, 0, 0, -s * 0.4); c.fillStyle = rgba(ACC, 0.95); c.fill(); return cv; }
  function bakeBrandCore() { const N = 112, cv = mk(N, N), c = cv.getContext('2d'); c.translate(N / 2, N / 2 + 4); const s = 30;
    const g0 = c.createRadialGradient(0, 0, 0, 0, 0, 44); g0.addColorStop(0, rgba(RUBY, 0.9)); g0.addColorStop(0.35, rgba(CRIM, 0.55)); g0.addColorStop(1, rgba(CRIM, 0)); c.fillStyle = g0; c.fillRect(-56, -60, 112, 112);
    c.beginPath(); c.moveTo(0, -s * 0.62); c.lineTo(s * 0.36, 0); c.lineTo(0, s * 0.62); c.lineTo(-s * 0.36, 0); c.closePath(); const g1 = c.createRadialGradient(0, 0, 0, 0, 0, s * 0.6); g1.addColorStop(0, '#FFE6EE'); g1.addColorStop(0.4, RUBY); g1.addColorStop(1, CRIM); c.fillStyle = g1; c.fill(); return cv; }
  function queueAll() { need('tex', bakeTex); need('moon0', () => bakeMoon(false)); need('cres', bakeCres); need('feather', bakeFeather); need('moon2', () => bakeMoon(true));
    need('ground', bakeGround); need('sealO0', () => bakeSealOuter(0)); need('sealM0', () => bakeSealMid(0)); need('sealI', bakeSealInner); need('brand', bakeBrand); need('brandCore', bakeBrandCore);
    need('sealO1', () => bakeSealOuter(1)); need('sealM1', () => bakeSealMid(1)); need('sealO2', () => bakeSealOuter(2)); }
  const spriteDriver = H => H.add({ key: 's4bake', life: 30, update(dt, f) { pump(QUEUE.length && f.t < 0.05 ? 2.5 : 2); if (!QUEUE.length) f.life = 0; } });
  function ensureBakes(H, first) { queueAll(); if (first) for (const n of first.slice().reverse()) { const i = QUEUE.findIndex(q => q.name === n); if (i > 0 && !QUEUE[i].it) QUEUE.unshift(QUEUE.splice(i, 1)[0]); } if (QUEUE.length && !H.fx.some(f => f.key === 's4bake')) { pump(2); if (QUEUE.length) spriteDriver(H); } }
  // sounds, throttled per cue (several brands may burst in one frame)
  const SND = {};
  function cue(H, name, fn) { const t = H.g.t; if (SND[name] != null && t - SND[name] < 0.07 && t >= SND[name]) return; SND[name] = t; try { fn(H.X.sfx || {}); } catch (e) { /* (no sound) */ } }

  /* =============================== ECLIPSE MANTLE =============================== */
  const EM = { frac: [0.10, 0.14, 0.18], dur: [6, 7, 8], range: 4.5, form: 0.5, fade: 0.8, brk: 0.9, ribbons: [4, 5, 6], frags: [3, 4, 5] };
  const MANTLES = new WeakMap();
  const petSizeOf = H => { try { const p = H.X.pet ? H.X.pet() : null; return p && typeof dunPetSize === 'function' ? dunPetSize(p, formOf(p)) : 1; } catch (e) { return 1; } };
  const spiritLive = Sp => !!Sp && !Sp.dead && !Sp.gone && Sp.phase !== 'depart' && Sp.phase !== 'fracture';
  // the cloak's surface: (phi, v) -> screen point; phi the floor azimuth (sin > 0 faces the viewer), v the height share
  function cloakGeo(I, T, t) { const o = I.r.o, h = T * 1.02 * I.r.size; return { cx: H0sx(I, o.x), base: H0sy(I, o.y) - (o.z || 0) * T - I.rise * h, h, t }; }
  const H0sx = (I, x) => I.H.sx(x), H0sy = (I, y) => I.H.sy(y);
  function cP(G, I, phi, v, rk) { const r = G.h * (0.3 + 0.38 * (1 - v)) * (1 + 0.05 * Math.sin(G.t * 2.2 + phi * 3 + v * 5)) * (rk || 1); return [G.cx + Math.cos(phi) * r, G.base - v * G.h + Math.sin(phi) * r * GY * 0.9]; }
  function grantMantle(H, r, amt, until, tier) {
    const g = H.g; let I = MANTLES.get(r.o);
    if (I && I.state === 'on' && I.H.fx.indexOf(I.F) >= 0) {   // reapplication: never adds; the greater shield, the later expiry
      if (amt >= I.pool) { I.pool = amt; I.cap = amt; } I.until = Math.max(I.until, until); I.tier = Math.max(I.tier, tier); I.reT = g.t; I.grants++; return I; }
    I = { r, H, pool: amt, cap: amt, until, tier, state: 'on', t0: g.t, reT: -9, endT: 0, hits: [], absorbed: 0, grants: 1, seed: Math.random() * 100, rise: 0, feathers: null, flash: -9 };
    I.cracks = []; for (let k = 0; k < 9; k++) { const sd = I.seed + k * 13.7, pts = []; let ph = R1(sd) * TAU, v = 0.12 + R1(sd + 1) * 0.42; for (let j = 0; j < 5; j++) { pts.push([ph, v]); ph += (R1(sd + 2 + j) - 0.5) * 0.35; v += (R1(sd + 8 + j) - 0.5) * 0.22; } I.cracks.push(pts); }
    const ward = (d, src) => {
      if (I.state !== 'on' || !(d > 0) || H.g.t >= I.until) return d;
      const s = Math.min(I.pool, d); I.pool -= s; I.absorbed += s;
      const o = r.o, sx0 = src && src.x != null ? src.x : null; let phi;
      if (sx0 != null) phi = Math.atan2(src.y - o.y, src.x - o.x); else { const nm = H.sortNear(o.x, o.y)[0]; phi = nm ? Math.atan2(nm.y - o.y, nm.x - o.x) : Math.PI / 2; }
      I.hits.push({ t: H.g.t, phi, v: 0.35 + Math.random() * 0.35 }); if (I.hits.length > 6) I.hits.shift(); I.flash = H.g.t;
      cue(H, 'emAbs', s2 => { s2.note && s2.note(620, 0.14, 'sine', 0.05, 520); });
      if (I.pool <= 1e-6) { I.pool = 0; endMantle(I, 'break'); }
      return d - s;
    };
    I.ward = ward; I.un = r.X && r.X.addWard ? r.X.addWard(ward) : null;
    I.F = H.add({ key: 'eclMantle', I, life: 1e6, x: r.o.x, y: r.o.y,
      update(dt, f) { f.x = r.o.x; f.y = r.o.y; const now = H.g.t;
        if (I.state === 'on') { if (!r.live()) endMantle(I, 'fade'); else if (now >= I.until) endMantle(I, 'fade'); }
        if (I.state === 'fade') { const u = (now - I.endT) / EM.fade; I.rise = 0.12 * sm(u); if (Math.random() < 0.5 * H.Q()) H.P({ kind: 'smoke', x: r.o.x + (Math.random() - 0.5) * 0.7, y: r.o.y + (Math.random() - 0.5) * 0.3, vx: (Math.random() - 0.5) * 0.4, vy: -0.9, life: 0.8, max: 0.8, size: 0.35, color: 'rgba(70,48,110,' }); if (u >= 1) f.life = 0; }
        if (I.state === 'break') { if (now - I.endT >= EM.brk) f.life = 0; for (const q of I.feathers) { q.vy += 260 * dt * q.gk; q.vx *= Math.pow(0.4, dt); q.vy *= Math.pow(0.55, dt); q.x += (q.vx + Math.sin(now * 6 + q.ph) * 18) * dt; q.y += q.vy * dt; q.rot += q.vr * dt; } } },
      drawUnder(c, f, X, Y, T, t) { drawMantle(c, I, T, H.g.t, false); },
      draw(c, f, X, Y, T, t) { drawMantle(c, I, T, H.g.t, true); },
      onEnd() { if (I.un) { I.un(); I.un = null; } if (I.state === 'on') I.state = 'gone'; if (MANTLES.get(r.o) === I) MANTLES.delete(r.o); } });
    MANTLES.set(r.o, I); return I;
  }
  function endMantle(I, how) { if (I.state !== 'on') return; I.state = how; I.endT = I.H.g.t; if (I.un) { I.un(); I.un = null; } if (MANTLES.get(I.r.o) === I) MANTLES.delete(I.r.o);
    const H = I.H, o = I.r.o;
    if (how === 'break') { const T = H.X.Tz ? H.X.Tz() : 48, h = T * 1.02 * I.r.size; I.feathers = [];
      const nF = Math.max(6, H.n(13)); for (let k = 0; k < nF; k++) { const a = k / nF * TAU + Math.random() * 0.4, v = 0.15 + Math.random() * 0.75, r = h * (0.33 + 0.25 * (1 - v)), sp = h * (0.9 + Math.random() * 1.2);
        I.feathers.push({ x: Math.cos(a) * r, y: -v * h + Math.sin(a) * r * GY, vx: Math.cos(a) * sp, vy: -h * (0.8 + Math.random() * 1.4) + Math.sin(a) * sp * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 9, s: h * (0.34 + Math.random() * 0.16), ph: Math.random() * TAU, gk: 0.22 + Math.random() * 0.2, flip: Math.random() < 0.5 ? -1 : 1 }); }
      H.burst(o.x, o.y - 0.5, 'spark', 14, { v: 5, up: 2, life: 0.55, size: 1.8, color: [SILV, ACC, '#FFFFFF'] });
      cue(H, 'emBreak', s2 => { s2.hiss && s2.hiss(0.3, 0.07, 3800); s2.chime && s2.chime(988, 0.35); s2.note && s2.note(330, 0.25, 'triangle', 0.05, 180); });
      if (H.X.shake && !RM()) H.X.shake(2, 0.1); }
    else cue(H, 'emFade', s2 => { s2.note && s2.note(392, 0.6, 'sine', 0.04, 330); }); }
  function drawMantle(c, I, T, now, front) {
    const age = now - I.t0, G = cloakGeo(I, T, now), h = G.h;
    let A = 1; if (I.state === 'fade') A = 1 - sm((now - I.endT) / EM.fade); else if (I.state === 'break') A = 1 - cl((now - I.endT) / 0.14); else if (I.state === 'gone') return;
    const form = sm(age / EM.form), reF = Math.exp(-Math.max(0, now - I.reT) * 5) * (now >= I.reT ? 1 : 0), flash = Math.max(Math.exp(-Math.max(0, now - I.flash) * 7) * (now >= I.flash ? 1 : 0), reF * 0.8);
    const dmgF = I.cap > 0 ? 1 - I.pool / I.cap : 0, tier = I.tier;
    if (A > 0.01) {
      c.save(); const NR = EM.ribbons[tier], tex = spr('tex'), pat = tex ? c.createPattern(tex, 'repeat') : null;
      if (pat && pat.setTransform && typeof DOMMatrix !== 'undefined') { const k = h / 150; pat.setTransform(new DOMMatrix([k, 0, 0, k, G.cx + now * 9 * k * 3, G.base - now * 14 * k * 3])); }
      const vg = c.createLinearGradient(0, G.base - h, 0, G.base); vg.addColorStop(0, rgba(SILV, 0.0)); vg.addColorStop(0.55, rgba(ENERGY, 0.12)); vg.addColorStop(1, rgba(EDGE, 0.32));
      const vTopB = 0.64, hemV = phi => 0.04 + 0.04 * Math.sin(phi * 5 + now * 2.1);
      for (let i = 0; i < NR; i++) {
        // a ribbon: s across it (-1..1), v up it (hem 0 .. shoulder 1); gathered narrow at the shoulders, flaring and swaying at the hem
        const pc = i / NR * TAU + now * 0.28 + I.seed, dl0 = TAU / NR * 0.42, dl = v => dl0 * (0.38 + 0.8 * (1 - v)), sway = v => 0.36 * (1 - v) * (1 - v) * Math.sin(now * 1.5 + i * 1.7 + v * 2.6);
        const vT = s2 => vTopB + 0.03 * Math.sin(s2 * 2 + now + i), vB = s2 => lerp(vT(s2), hemV(pc + s2 * dl0), form);
        const phiAt = (s2, v) => pc + s2 * dl(v) + sway(v), dlM = dl(0.45);
        const list = []; const M = 7; for (let k = 0; k <= M; k++) list.push(-1 + 2 * k / M);
        for (let n = Math.ceil((pc - dlM) / Math.PI); n * Math.PI < pc + dlM; n++) list.push((n * Math.PI - pc) / dlM); list.sort((p, q) => p - q);
        let piece = [list[0]]; const pieces = [];
        for (let k = 1; k < list.length; k++) { piece.push(list[k]); const mid = pc + (list[k - 1] + list[k]) / 2 * dlM, nxt = k + 1 < list.length ? pc + (list[k] + list[k + 1]) / 2 * dlM : null; if (nxt == null || Math.sign(Math.sin(mid)) !== Math.sign(Math.sin(nxt))) { pieces.push({ ss: piece, fr: Math.sin(mid) > 0 }); piece = [list[k]]; } }
        for (const pz of pieces) { if (pz.fr !== front) continue;
          const SS = pz.ss, top = SS.map(q => cP(G, I, phiAt(q, vT(q)), vT(q))), bot = SS.map(q => { const v = vB(q); return cP(G, I, phiAt(q, v), v, 1 + 0.1 * (1 - v)); });
          const side = q => { const out = []; for (const f of [0.25, 0.5, 0.75]) { const v = lerp(vT(q), vB(q), f); out.push(cP(G, I, phiAt(q, v), v, 1 + 0.1 * (1 - v))); } return out; };
          const sR = side(SS[SS.length - 1]), sL = side(SS[0]).reverse();
          c.beginPath(); top.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); for (const p of sR) c.lineTo(p[0], p[1]); for (let k = bot.length - 1; k >= 0; k--) c.lineTo(bot[k][0], bot[k][1]); for (const p of sL) c.lineTo(p[0], p[1]); c.closePath();
          c.globalAlpha = (front ? 0.36 : 0.7) * A; c.fillStyle = pat || BODY; c.fill(); c.globalAlpha = A * (front ? 0.8 : 1); c.globalCompositeOperation = 'lighter'; c.fillStyle = vg; c.fill();
          c.lineJoin = 'round'; c.lineCap = 'round';
          const hem = () => { c.beginPath(); bot.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); };
          c.strokeStyle = rgba(EDGE, (0.35 + 0.4 * flash) * (front ? 0.9 : 0.6)); c.lineWidth = Math.max(2, h * 0.06); hem(); c.stroke();
          c.strokeStyle = rgba(ACC, (0.6 + 0.4 * flash) * (front ? 0.95 : 0.6)); c.lineWidth = Math.max(1, h * 0.018); hem(); c.stroke();
          c.strokeStyle = rgba(SILV, (0.4 + 0.5 * flash) * (front ? 0.8 : 0.45)); c.lineWidth = Math.max(0.8, h * 0.012); c.beginPath(); top.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
          c.strokeStyle = rgba(ACC, (0.22 + 0.3 * flash) * (front ? 1 : 0.6)); c.lineWidth = Math.max(0.7, h * 0.01);
          if (SS[0] === -1) { c.beginPath(); c.moveTo(top[0][0], top[0][1]); for (let k = sL.length - 1; k >= 0; k--) c.lineTo(sL[k][0], sL[k][1]); c.lineTo(bot[0][0], bot[0][1]); c.stroke(); }
          if (SS[SS.length - 1] === 1) { const e = SS.length - 1; c.beginPath(); c.moveTo(top[e][0], top[e][1]); for (const p of sR) c.lineTo(p[0], p[1]); c.lineTo(bot[e][0], bot[e][1]); c.stroke(); }
          c.globalCompositeOperation = 'source-over'; }
      }
      // luminous cracks, spreading as the shield falls (front only)
      if (front && dmgF > 0.08) { const nC = Math.min(I.cracks.length, Math.ceil(dmgF * I.cracks.length * 1.05)); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (let k = 0; k < nC; k++) { const cr = I.cracks[k], rot = now * 0.28, pts = cr.map(([p, v]) => [p + rot, v]); if (Math.sin(pts[2][0]) < 0.05) continue; const gk = cl((dmgF * I.cracks.length * 1.05 - k)), sc = pts.map(([p, v]) => cP(G, I, p, v * form + (1 - form) * 0.6, 1.02));
          c.globalAlpha = A * 0.9 * gk; c.strokeStyle = rgba(EDGE, 0.7); c.lineWidth = Math.max(1.2, h * 0.03); c.beginPath(); sc.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.strokeStyle = rgba(SILV, 0.95); c.lineWidth = Math.max(0.6, h * 0.01); c.stroke(); }
        c.globalCompositeOperation = 'source-over'; }
      // ripples from the side each absorbed hit came from
      if (front) for (const hq of I.hits) { const u = (now - hq.t) / 0.45; if (u < 0 || u > 1) continue; const p = cP(G, I, hq.phi, hq.v), rr = h * (0.06 + 0.42 * Math.sqrt(u)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = A * (1 - u);
        c.strokeStyle = rgba(ACC, 0.9); c.lineWidth = Math.max(1, h * 0.03 * (1 - u)); c.beginPath(); c.ellipse(p[0], p[1], rr, rr * 0.7, 0, 0, TAU); c.stroke(); c.strokeStyle = rgba(SILV, 0.8); c.lineWidth = Math.max(0.6, h * 0.01); c.beginPath(); c.ellipse(p[0], p[1], rr * 0.6, rr * 0.42, 0, 0, TAU); c.stroke();
        H0glow(c, I, p[0], p[1], h * 0.25 * (1 - u), EDGE, 0.5 * (1 - u)); c.globalCompositeOperation = 'source-over'; }
      // the orbit rings (a second, tilted one at Celestial) and the crescent fragments on them
      const oy = G.base - h * 0.42, orx = h * 0.8, ory = orx * GY * 0.55, ra = A * form;
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = ra * 0.55; c.strokeStyle = rgba(ACC, 0.7); c.lineWidth = 1; c.beginPath(); c.ellipse(G.cx, oy, orx, ory, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.stroke();
      if (tier >= 2) { c.globalAlpha = ra * 0.7; c.strokeStyle = rgba(SILV, 0.8); c.lineWidth = 1.1; c.beginPath(); c.ellipse(G.cx, oy - h * 0.08, orx * 1.12, ory * 1.3, -0.32, front ? 0 : Math.PI, front ? Math.PI : TAU); c.stroke(); }
      c.globalCompositeOperation = 'source-over';
      const cres = spr('cres'), NF = EM.frags[tier];
      if (cres) for (let j = 0; j < NF; j++) { const th = now * 0.85 + j / NF * TAU + I.seed, fr = Math.sin(th) > 0; if (fr !== front) continue; const ring2 = tier >= 2 && j % 2 === 1;
        let x = G.cx + Math.cos(th) * orx * (ring2 ? 1.12 : 1), y = oy + Math.sin(th) * ory * (ring2 ? 1.3 : 1) + Math.sin(now * 2 + j) * h * 0.02; if (ring2) { const dx = x - G.cx, dy = y - (oy - h * 0.08); const cs = Math.cos(-0.32), sn = Math.sin(-0.32); x = G.cx + dx * cs - (y - oy) * sn; y = oy - h * 0.08 + dx * sn + (y - oy) * cs; }
        const s = h * 0.24 * (0.8 + 0.2 * Math.sin(th)) * (0.4 + 0.6 * form), ang = Math.atan2(Math.cos(th) * ory, -Math.sin(th) * orx);
        c.save(); c.globalAlpha = A * form * (fr ? 0.95 : 0.55); c.translate(x, y); c.rotate(ang + Math.PI / 2); c.drawImage(cres, -s, -s, s * 2, s * 2); c.restore(); }
      c.restore();
    }
    // the shatter: black feathers and fading silver sparks
    if (I.state === 'break' && front && I.feathers) { const fe = spr('feather'), u = (now - I.endT) / EM.brk, G2 = cloakGeo(I, T, now); if (fe) for (const q of I.feathers) { c.save(); c.globalAlpha = (1 - sm((u - 0.45) / 0.55)); c.translate(G2.cx + q.x, G2.base + q.y); c.rotate(q.rot); c.scale(1, q.flip * (0.6 + 0.4 * Math.cos(now * 7 + q.ph))); c.drawImage(fe, -q.s * 0.5, -q.s * 0.19, q.s, q.s * 0.375); c.restore(); }
      if (u < 0.25) { c.save(); H0glow(c, I, G2.cx, G2.base - G2.h * 0.5, G2.h * 0.9 * (1 + u * 2), SILV, 0.55 * (1 - u / 0.25)); c.restore(); } }
  }
  function H0glow(c, I, x, y, r, col, a) { I.H.glow(c, x, y, r, col, a); }
  // the cast: the moon over the caster, the ground pulse out to RANGE
  S.eclipsemantle = (C, H) => {
    const me = H.me, g = H.g, ev = evoOf(C), tier = tierOf(ev), frac = EM.frac[tier], dur = EM.dur[tier], now = g.t;
    ensureBakes(H, [tier >= 2 ? 'moon2' : 'moon0', 'cres']);
    const P0 = H.X.pet ? H.X.pet() : null;
    const selfLive = me.spirit ? () => spiritLive(me) : () => !me.dead && (!P0 || !H.X.pet || H.X.pet() === P0);
    const selfHP = me.spirit ? me.hpMax : (H.X.ST ? H.X.ST().hp : me.hp);
    const recips = [{ o: me, X: H.X, hp: selfHP, size: me.spirit ? me.size || 1 : petSizeOf(H), live: selfLive, self: true }];
    if (!me.spirit) for (const f of H.fx) { const Sp = f.key === 'dotdSpirit' && f.S; if (Sp && spiritLive(Sp) && Math.hypot(Sp.x - me.x, Sp.y - me.y) <= EM.range && !recips.some(r => r.o === Sp)) recips.push({ o: Sp, X: Sp.X, hp: Sp.hpMax, size: Sp.size || 1, live: () => spiritLive(Sp) }); }
    const out = recips.map(r => { const amt = frac * r.hp, I = grantMantle(H, r, amt, now + dur, tier); return { who: r.self ? 'self' : 'spirit', amt, pool: I.pool, until: I.until }; });
    S.eclipsemantle.last = { tier, frac, dur, out, t: now };
    cue(H, 'emCast', s2 => { s2.note && s2.note(196, 0.9, 'sine', 0.12, 220); s2.note && s2.note(392, 0.7, 'sine', 0.05, 440, 0.04); s2.hollow && s2.hollow(330); s2.chime && s2.chime(784, 0.25); });
    if (!me.spirit) { me.sq = Math.max(me.sq || 0, 0.4); }
    const size = recips[0].size, tg = recips.map(r => r.o);
    H.add({ key: 'eclipsemantle', life: 1.5, x: me.x, y: me.y, tier,
      update(dt, f) { f.x = me.x; f.y = me.y; },
      drawUnder(c, f, X, Y, T) { const t = f.t, u = sstep(0.3, 1.0, t); if (u <= 0 || u >= 1) return; const R = EM.range * T * u, a = (1 - u) * 0.9; c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = a; c.strokeStyle = rgba(EDGE, 0.85); c.lineWidth = Math.max(1.5, T * 0.07 * (1 - u * 0.6)); c.beginPath(); c.ellipse(X, Y, R, R * GY, 0, 0, TAU); c.stroke();
        c.strokeStyle = rgba(SILV, 0.7); c.lineWidth = 1; c.beginPath(); c.ellipse(X, Y, R * 0.94, R * 0.94 * GY, 0, 0, TAU); c.stroke();
        const gr = spr('ground'); if (gr) { c.globalAlpha = a * 0.5; c.drawImage(gr, X - R, Y - R * GY, R * 2, R * 2 * GY); }
        for (const o of tg) { const d = Math.hypot(o.x - f.x, o.y - f.y), hitU = d / EM.range; if (Math.abs(u - hitU) < 0.15 || (o === me && t < 0.6)) { const k = o === me ? sstep(0.3, 0.45, t) * (1 - sstep(0.45, 0.7, t)) : 1 - Math.abs(u - hitU) / 0.15; c.globalAlpha = k * 0.8; const rr = T * 0.9; c.strokeStyle = rgba(ACC, 0.9); c.lineWidth = 2; c.beginPath(); c.ellipse(H.sx(o.x), H.sy(o.y), rr, rr * GY, 0, 0, TAU); c.stroke(); } }
        c.restore(); },
      draw(c, f, X, Y, T) { const t = f.t, h = T * 1.02 * size, mo = spr(tier >= 2 ? 'moon2' : 'moon0') || spr('moon0'); if (!mo) return;
        const grow = backE(t / 0.35), sink = sstep(0.95, 1.45, t), r = h * (tier >= 2 ? 0.36 : 0.32) * grow * (1 - 0.75 * sink), cy = Y - (me.z || 0) * T - h * (1.42 - 0.75 * sink) + Math.sin(t * 3) * h * 0.02;
        if (r < 0.5) return; const k = r / mo.rm; c.save(); c.globalAlpha = 1 - sstep(1.2, 1.5, t);
        H.glow(c, X, cy, r * 3, EDGE, 0.35 * (1 - sink)); c.translate(X, cy); c.rotate(t * 0.35); c.drawImage(mo.cv, -mo.N / 2 * k, -mo.N / 2 * k, mo.N * k, mo.N * k); c.restore();
        if (t < 0.5) { c.save(); H.glow(c, X, cy, r * 2 * (1 - t / 0.5), SILV, 0.6 * (1 - t / 0.5)); c.restore(); } } });
  };
  S.eclipsemantle.TUNE = EM;
  S.eclipsemantle.inst = o => MANTLES.get(o) || null;

  /* =============================== WITCH'S BRAND =============================== */
  const WB = { def: [0.15, 0.20, 0.25], slow: [0.20, 0.25, 0.30], dur: [6, 7, 8], R: [1.9, 2.15, 2.4], reach: 6.5, detK: 2.6, evoStep: 0.08, applyT: 0.55, threadT: 0.38, life: [1.35, 1.35, 1.8], zSeal: 1.9, final: 1.0, burst: 0.6 };
  const LOG = []; let SEQ = 0;
  const logB = e => { LOG.push(e); if (LOG.length > 400) LOG.shift(); };
  function setMods(m, b) { m.wBrand = b; m.brandDef = b.def; m.brandSlow = (m.boss || m.still) ? 0 : b.slow; }   // (hooks read in 20b: hitMon, updMon)
  function clearMods(m, b) { if (m.wBrand === b) { m.wBrand = null; m.brandDef = 0; m.brandSlow = 0; } }
  function applyBrand(H, C, m, v) {
    const now = H.g.t, b0 = m.wBrand;
    if (b0 && b0.state === 'on' && b0.H.fx.indexOf(b0.F) >= 0) {   // refresh: the strongest values, the single expiry moved later; no stacking
      b0.def = Math.max(b0.def, v.def); b0.slow = Math.max(b0.slow, v.slow); b0.dmg = Math.max(b0.dmg, v.dmg); b0.tier = Math.max(b0.tier, v.tier); b0.until = Math.max(b0.until, now + v.dur); b0.flashT = now; b0.refreshes++;
      setMods(m, b0); logB({ ev: 'refresh', id: b0.id, t: now, until: b0.until }); return b0; }
    const b = { id: ++SEQ, m, H, C, def: v.def, slow: v.slow, dmg: v.dmg, tier: v.tier, until: now + v.dur, state: 'on', t0: now, flashT: now, refreshes: 0, hist: [], histT: 0, detT: 0, frags: null, finalCue: -1, seed: Math.random() * 50 };
    setMods(m, b); logB({ ev: 'apply', id: b.id, t: now, until: b.until, def: b.def, slow: m.brandSlow, boss: !!m.boss });
    b.F = H.add({ key: 'wbBrand', b, life: 1e6, x: m.x, y: m.y,
      update(dt, f) { const now2 = H.g.t; f.x = m.x; f.y = m.y;
        if (b.state === 'on') {
          b.chk = (b.chk || 0) - dt; const gone = b.chk <= 0 && (b.chk = 0.2, H.mons.indexOf(m) < 0);
          if (m.dead || gone || m.under || m.fobj) cancelBrand(b, m.dead ? 'death' : 'despawn');
          else if (now2 >= b.until) detonate(b);
          else { b.histT -= dt; if (b.histT <= 0) { b.histT = 0.05; b.hist.push([m.x, m.y]); if (b.hist.length > 8) b.hist.shift(); }
            const rem = b.until - now2; if (rem < WB.final && b.finalCue !== b.until) { b.finalCue = b.until; cue(H, 'wbRise', s2 => { s2.note && s2.note(196, 0.95, 'triangle', 0.035, 620); s2.hiss && s2.hiss(0.8, 0.025, 2200); }); }
            const mv = b.hist.length > 2 ? Math.hypot(b.hist[b.hist.length - 1][0] - b.hist[0][0], b.hist[b.hist.length - 1][1] - b.hist[0][1]) : 0;
            if (mv > 0.15 && Math.random() < 0.35 * H.Q()) H.P({ kind: 'smoke', x: m.x + (Math.random() - 0.5) * m.r, y: m.y + (Math.random() - 0.5) * 0.2, vx: 0, vy: -0.25, life: 0.6, max: 0.6, size: 0.28, color: 'rgba(70,40,110,' }); }
        } else if (b.state === 'det') { if (now2 - b.detT >= WB.burst) f.life = 0; }
        else if (now2 - b.detT >= 0.35) f.life = 0; },
      draw(c, f, X, Y, T) { drawBrand(c, b, T, H.g.t); },
      onEnd() { if (b.state === 'on') { b.state = 'cancel'; b.detT = H.g.t; logB({ ev: 'cancel', id: b.id, why: 'cleanup', t: H.g.t }); } clearMods(m, b); } });
    return b;
  }
  function detonate(b) {
    if (b.state !== 'on') return false;   // the atomic flag: one detonation per instance, never after a cancel
    b.state = 'det'; const H = b.H, m = b.m, now = H.g.t; b.detT = now;
    const defAt = m.brandDef, hp0 = m.hp; H.X.hitMon(m, b.dmg, b.C.dmgO({ witchBrand: true }));   // (resolved while the defence cut still holds)
    logB({ ev: 'det', id: b.id, t: now, until: b.until, def: defAt, dmg: b.dmg, dealt: hp0 - m.hp, boss: !!m.boss });
    clearMods(m, b);
    b.frags = []; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + Math.random() * 0.5; b.frags.push({ a, v: 1.6 + Math.random() * 1.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, len: 0.5 + Math.random() * 0.5 }); }
    b.bx = m.x; b.by = m.y; b.bz = (m.z || 0); b.br = m.r;
    H.burst(m.x, m.y - m.r, 'shard', 7, { v: 5, up: 2, g: 9, life: 0.5, size: 3.5, color: [EDGE, PLUM, ACC] }); H.burst(m.x, m.y - m.r, 'spark', 10, { v: 5, life: 0.4, size: 1.8, color: [RUBY, ACC, SILV] });
    for (let k = 0; k < H.n(5); k++) { const a = Math.random() * TAU; H.P({ kind: 'smoke', x: m.x + Math.cos(a) * 0.2, y: m.y + Math.sin(a) * 0.12, vx: Math.cos(a) * 0.9, vy: Math.sin(a) * 0.5 - 0.5, life: 0.7, max: 0.7, size: 0.4, color: 'rgba(55,30,90,' }); }
    if (H.X.light) H.X.light(m.x, m.y, 1.6, 0.18); if (H.X.shake && !RM()) H.X.shake(m.boss ? 3 : 2.5, 0.1);
    cue(H, 'wbDet', s2 => { s2.crack && s2.crack(); s2.note && s2.note(82, 0.32, 'square', 0.06, 42); s2.hiss && s2.hiss(0.16, 0.1, 3400); s2.note && s2.note(660, 0.12, 'sawtooth', 0.03, 1320); });
    return true;
  }
  function cancelBrand(b, why) { if (b.state !== 'on') return false; b.state = 'cancel'; b.detT = b.H.g.t; clearMods(b.m, b); logB({ ev: 'cancel', id: b.id, why, t: b.detT }); return true; }
  function drawBrand(c, b, T, now) {
    const H = b.H, m = b.m, live = b.state === 'on';
    const X = H.sx(live ? m.x : (b.bx != null ? b.bx : m.x)), Yg = H.sy(live ? m.y : (b.by != null ? b.by : m.y)), z = ((live ? m.z || 0 : b.bz || 0) + (m.liftZ || 0)) * T, r = (live ? m.r : (b.br || m.r)) * T;
    const bodyY = Yg - z, headY = bodyY - r * 1.05 - T * 0.32;
    if (b.state === 'det') return drawBurst(c, b, T, now, X, bodyY, Yg, r);
    const ca = b.state === 'cancel' ? 1 - cl((now - b.detT) / 0.35) : 1; if (ca <= 0) return;
    const rem = b.until - now, k = live ? 1 - cl(rem / WB.final) : 0, k2 = k * k, ap = cl((now - b.t0) / 0.25), pop = Math.exp(-Math.max(0, now - b.flashT) * 7);
    c.save(); c.globalAlpha = ca;
    // smoky strands trailing from a moving bearer (the slow)
    if (live && b.hist.length > 2) { const hs = b.hist, mvd = Math.hypot(hs[hs.length - 1][0] - hs[0][0], hs[hs.length - 1][1] - hs[0][1]); if (mvd > 0.12) { const a = cl((mvd - 0.12) * 3) * 0.55;
      for (const sg of [-1, 1]) { const pts = hs.map(([x, y], i) => { const u = i / (hs.length - 1); return [H.sx(x) + sg * r * 0.35 * (0.4 + 0.6 * u) + Math.sin(now * 5 + i + sg) * T * 0.04, H.sy(y) - r * (0.2 + 0.5 * u)]; }); pts.push([X + sg * r * 0.35, bodyY - r * 0.6]);
        c.lineCap = 'round'; c.lineJoin = 'round'; const tail = (k0) => { c.beginPath(); for (let i = k0; i < pts.length; i++) (i === k0 ? c.moveTo(pts[i][0], pts[i][1]) : c.lineTo(pts[i][0], pts[i][1])); };   // (two widths, the head half thicker: 4 strokes a strand)
        const hf = Math.floor(pts.length / 2); tail(0); c.strokeStyle = rgba(SMOKE, a * 0.45); c.lineWidth = Math.max(1, T * 0.045); c.stroke(); tail(hf); c.strokeStyle = rgba(SMOKE, a); c.lineWidth = Math.max(1, T * 0.085); c.stroke(); c.strokeStyle = rgba(EDGE, a * 0.55); c.lineWidth = Math.max(0.6, T * 0.022); c.stroke(); } } }
    // broken rune arcs orbiting the body (faster in the final second)
    const orx = r * 1.3 + T * 0.12, ory = orx * GY * 0.7, oy = bodyY - r * 0.15, spin = now * (1.4 + 7 * k2) + b.seed;
    c.lineCap = 'round';
    for (let j = 0; j < 3; j++) { const a0 = spin * (j % 2 ? -1 : 1) * (1 + j * 0.15) + j * 2.1, segs = [[0, 0.55], [0.75, 1.05]];
      for (const [s0, s1] of segs) { const A0 = a0 + s0, A1 = a0 + s1, mid = (A0 + A1) / 2, front = Math.sin(mid) > 0, rr = 1 + j * 0.12 - 0.25 * k2 * k;
        c.globalAlpha = ca * ap * (front ? 0.95 : 0.35); c.strokeStyle = rgba(k > 0.3 ? lerpHex(EDGE, RUBY, (k - 0.3) / 0.7) : EDGE, 0.95); c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); c.ellipse(X, oy - j * T * 0.05, orx * rr, ory * rr, 0, A0, A1); c.stroke();
        c.strokeStyle = rgba(ACC, 0.9); c.lineWidth = Math.max(0.6, T * 0.016); c.stroke();
        const tx = X + Math.cos(mid) * orx * rr, ty = oy - j * T * 0.05 + Math.sin(mid) * ory * rr; c.strokeStyle = rgba(SILV, 0.85); c.lineWidth = 1; c.beginPath(); c.moveTo(tx, ty - T * 0.06); c.lineTo(tx, ty + T * 0.06); c.stroke(); } }
    // in the final second the threads draw inward to the mark
    if (k > 0) { c.globalCompositeOperation = 'lighter'; for (let j = 0; j < 3; j++) { const a = spin + j * TAU / 3, sx0 = X + Math.cos(a) * orx * (1 - 0.6 * k), sy0 = oy + Math.sin(a) * ory * (1 - 0.6 * k); c.globalAlpha = ca * k * 0.8; c.strokeStyle = rgba(RUBY, 0.8); c.lineWidth = 1.2; c.beginPath(); c.moveTo(sx0, sy0); c.quadraticCurveTo((sx0 + X) / 2, (sy0 + headY) / 2 - T * 0.2, X, headY); c.stroke(); } c.globalCompositeOperation = 'source-over'; }
    // the emblem over the head: it contracts at the very end; its crimson core builds through the final second
    const em = spr('brand'), core = spr('brandCore'), base = T * 0.55 * Math.min(1.5, Math.max(0.8, r / (T * 0.4)));
    const sc = base * (ap < 1 ? backE(ap) : 1) * (1 + 0.5 * pop) * (1 - 0.3 * sstep(0.7, 1, k)) * (1 + 0.04 * Math.sin(now * 4 + b.seed)), ey = headY - T * 0.05 * Math.sin(now * 2 + b.seed);
    c.globalAlpha = ca; H.glow(c, X, ey, sc * 1.2, EDGE, 0.4 + 0.3 * pop);
    if (em) { c.globalAlpha = ca; c.drawImage(em, X - sc, ey - sc, sc * 2, sc * 2); } else { c.globalAlpha = ca; c.fillStyle = EDGE; c.beginPath(); c.moveTo(X, ey - sc * 0.5); c.lineTo(X + sc * 0.3, ey); c.lineTo(X, ey + sc * 0.5); c.lineTo(X - sc * 0.3, ey); c.fill(); }
    if (core) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = ca * cl(0.12 + 0.88 * k2 + 0.15 * Math.sin(now * (6 + 20 * k)) * k); c.drawImage(core, X - sc, ey - sc, sc * 2, sc * 2); c.restore(); }
    if (pop > 0.05) { c.save(); H.glow(c, X, ey, sc * 2.2 * (1 + (1 - pop)), ACC, 0.6 * pop); c.restore(); }
    // Celestial: a spectral eye flashes inside the mark just before it breaks
    if (b.tier >= 2 && live && rem < 0.28) { const o = Math.sin(cl((0.28 - rem) / 0.28) * Math.PI); drawEye(c, X, ey + sc * 0.04, sc * 0.55, o, ca); }
    c.restore();
  }
  function lerpHex(a, b, u) { const A = hexRGB(a), B = hexRGB(b); u = cl(u); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join(''); }
  function drawBurst(c, b, T, now, X, bodyY, Yg, r) {
    const H = b.H, u = cl((now - b.detT) / WB.burst); if (u >= 1) return; const cy = bodyY - r * 0.4;
    c.save();
    // the pressure ripple (decorative, light only)
    c.globalCompositeOperation = 'lighter'; const pr = T * (0.3 + 1.5 * Math.sqrt(u)); c.globalAlpha = (1 - u) * 0.7; c.strokeStyle = rgba(EDGE, 0.9); c.lineWidth = Math.max(1, T * 0.06 * (1 - u)); c.beginPath(); c.ellipse(X, Yg, pr, pr * GY, 0, 0, TAU); c.stroke();
    c.strokeStyle = rgba(SILV, 0.6); c.lineWidth = 1; c.beginPath(); c.ellipse(X, Yg, pr * 0.8, pr * 0.8 * GY, 0, 0, TAU); c.stroke(); c.globalCompositeOperation = 'source-over';
    // the violet-black sphere with a bright crimson centre
    const sr = T * (0.22 + 0.5 * (1 - Math.pow(1 - u, 3))) * Math.max(0.9, r / (T * 0.4)), a = 1 - sstep(0.35, 1, u);
    if (a > 0) { c.globalAlpha = a; const gr = c.createRadialGradient(X - sr * 0.2, cy - sr * 0.25, sr * 0.05, X, cy, sr); gr.addColorStop(0, rgba(PLUM, 0.95)); gr.addColorStop(0.55, rgba(BODY, 0.9)); gr.addColorStop(0.85, rgba(ENERGY, 0.6)); gr.addColorStop(1, rgba(EDGE, 0)); c.fillStyle = gr; c.beginPath(); c.arc(X, cy, sr, 0, TAU); c.fill();
      c.strokeStyle = rgba(ACC, 0.8 * a); c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.arc(X, cy, sr * 0.9, 0, TAU); c.stroke(); }
    const ck = 1 - sstep(0, 0.45, u); if (ck > 0) H.core(c, X, cy, T * 0.26 * (0.6 + 0.4 * ck) * Math.max(0.9, r / (T * 0.4)), RUBY, '#FFF0F4', ck);
    if (u < 0.12) H.glow(c, X, cy, T * 1.4, CRIM, 0.7 * (1 - u / 0.12));
    // shattered rune fragments
    if (b.frags) { c.lineCap = 'round'; for (const q of b.frags) { const d = T * q.v * (1 - Math.pow(1 - u, 2)) * 0.9, x = X + Math.cos(q.a) * d, y = cy + Math.sin(q.a) * d * 0.7 - T * 0.2 * Math.sin(u * Math.PI); c.save(); c.translate(x, y); c.rotate(q.rot + q.vr * u); c.globalAlpha = 1 - sstep(0.5, 1, u);
      c.strokeStyle = rgba(EDGE, 0.95); c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); c.arc(0, 0, T * 0.2, 0, q.len); c.stroke(); c.strokeStyle = rgba(SILV, 0.9); c.lineWidth = 1; c.stroke(); c.beginPath(); c.moveTo(T * 0.2, -T * 0.05); c.lineTo(T * 0.2, T * 0.05); c.stroke(); c.restore(); } }
    c.restore();
  }
  // the spectral eye: rigid layered plates parting round a glowing slit (o: 0 shut .. 1 open); upright, facing the camera
  function drawEye(c, X, Y, s, o, a) { if (o <= 0.01 || s < 1) return; c.save(); c.globalAlpha = a; H_glowSafe(c, X, Y, s * 2.2, RUBY, 0.4 * o);
    // the almond: a glowing iris (crimson to violet) with a vertical black slit
    const lw = s * 0.95, lh = s * 0.5 * o;
    c.beginPath(); c.moveTo(X - lw, Y); c.quadraticCurveTo(X, Y - lh * 2, X + lw, Y); c.quadraticCurveTo(X, Y + lh * 2, X - lw, Y); c.closePath();
    const gi = c.createRadialGradient(X, Y, 0, X, Y, lw); gi.addColorStop(0, rgba('#FFE8F0', 0.95)); gi.addColorStop(0.22, rgba(RUBY, 0.95)); gi.addColorStop(0.55, rgba(ENERGY, 0.9)); gi.addColorStop(1, rgba(BODY, 0.95)); c.fillStyle = gi; c.fill();
    c.strokeStyle = rgba(ACC, 0.95); c.lineWidth = 1.4; c.stroke();
    c.beginPath(); c.moveTo(X, Y - lh * 0.95); c.quadraticCurveTo(X + s * 0.09, Y, X, Y + lh * 0.95); c.quadraticCurveTo(X - s * 0.09, Y, X, Y - lh * 0.95); c.fillStyle = VOID; c.fill();
    // rigid plates: angular shards ringed round the almond, parting outward as it opens
    const NP = 8; for (let k = 0; k < NP; k++) { const an = k / NP * TAU + Math.PI / NP, d = s * (0.75 + 0.55 * o), cx2 = X + Math.cos(an) * d * 1.25, cy2 = Y + Math.sin(an) * d * 0.62, L = s * 0.42, W = s * 0.13;
      c.save(); c.translate(cx2, cy2); c.rotate(Math.atan2(Math.sin(an) * 0.62, Math.cos(an) * 1.25)); c.beginPath(); c.moveTo(-L * 0.5, 0); c.lineTo(0, -W); c.lineTo(L * 0.6, 0); c.lineTo(0, W); c.closePath();
      c.globalAlpha = a * (0.4 + 0.6 * o); c.fillStyle = k % 2 ? BODY : PLUM; c.fill(); c.strokeStyle = rgba(EDGE, 0.95); c.lineWidth = 1.1; c.stroke(); c.restore(); }
    c.restore(); }
  let H_last = null; const H_glowSafe = (c, x, y, r, col, al) => { if (H_last) H_last.glow(c, x, y, r, col, al); };
  S.witchsbrand = (C, H) => {
    H_last = H; const me = H.me, g = H.g, ev = evoOf(C), tier = tierOf(ev), K = C.K || 1, now = g.t;
    ensureBakes(H, ['tex', 'sealO' + tier, 'sealM' + Math.min(1, tier), 'sealI', 'brand', 'brandCore', 'ground']);
    const R = WB.R[tier], dx = C.tx - me.x, dy = C.ty - me.y, d = Math.hypot(dx, dy) || 1, dd = Math.min(WB.reach, d);
    let cx = me.x + dx / d * dd, cy = me.y + dy / d * dd; try { const p = H.walk(cx, cy); if (p && isFinite(p.x)) { cx = p.x; cy = p.y; } } catch (e) { /* (keep the aimed point) */ }
    const dmg = WB.detK * C.base * K * (1 + WB.evoStep * (ev - 1)), vals = { def: WB.def[tier], slow: WB.slow[tier], dur: WB.dur[tier], dmg, tier };
    const P0 = H.X.pet ? H.X.pet() : null, casterOk = () => (me.spirit ? spiritLive(me) : !me.dead && (!P0 || !H.X.pet || H.X.pet() === P0));
    const life = WB.life[tier], threads = new Map(), branded = [];
    cue(H, 'wbCast', s2 => { s2.hiss && s2.hiss(0.6, 0.045, 2600); s2.chime && s2.chime(330, 0.4); s2.note && s2.note(165, 0.6, 'sine', 0.07, 147); });
    if (!me.spirit) me.sq = Math.max(me.sq || 0, 0.45);
    S.witchsbrand.last = { tier, R, cx, cy, vals, branded };
    H.add({ key: 'witchsbrand', life, x: cx, y: cy, tier, R, applied: false, aborted: false, branded,
      update(dt, f) { const t = f.t;
        if (!f.applied && !f.aborted && !casterOk()) { f.aborted = true; f.life = Math.min(f.life, 0.35); f.abT = t; }
        if (!f.applied && !f.aborted && t >= WB.threadT) for (const m of H.near(cx, cy, R)) if (!threads.has(m)) threads.set(m, t);
        if (!f.applied && !f.aborted && t >= WB.applyT) { f.applied = true;
          for (const m of H.near(cx, cy, R)) { if (!threads.has(m)) threads.set(m, t - 0.12); applyBrand(H, C, m, vals); branded.push(m); }
          for (const m of threads.keys()) if (branded.indexOf(m) < 0) threads.delete(m);
          if (branded.length) cue(H, 'wbApply', s2 => { s2.note && s2.note(140, 0.45, 'sawtooth', 0.04, 300); s2.note && s2.note(280, 0.35, 'sine', 0.06, 560, 0.03); });
          H.burst(cx, cy, 'spark', 10, { v: 3, flat: true, life: 0.5, size: 1.6, color: [EDGE, ACC] });
          if (tier >= 2) cue(H, 'wbEye', s2 => { s2.chime && s2.chime(220, 0.35); s2.hiss && s2.hiss(0.5, 0.03, 1600, 0.1); }); } },
      drawUnder(c, f, X, Y, T) { const t = f.t, A = sealAlpha(f, t), u = sm(t / 0.4); if (A <= 0) return; const gr = spr('ground'), Rp = R * T * (0.4 + 0.6 * u);
        c.save(); c.globalCompositeOperation = 'lighter'; if (gr) { c.globalAlpha = A * 0.85; c.drawImage(gr, X - Rp, Y - Rp * GY, Rp * 2, Rp * 2 * GY); }
        c.globalAlpha = A; c.strokeStyle = rgba(EDGE, 0.9); c.lineWidth = Math.max(1.4, T * 0.04); c.beginPath(); c.ellipse(X, Y, Rp, Rp * GY, 0, 0, TAU); c.stroke(); c.restore(); },
      draw(c, f, X, Y, T) { const t = f.t, A = sealAlpha(f, t); if (A <= 0) return;
        const zS = WB.zSeal * T * (1 + 0.06 * sm((t - 0.9) / 0.9)), SY = Y - zS, Rp = R * T, open = backE(t / 0.42), sq = lerp(0.06, GY, sm(t / 0.42));
        const L = [[spr('sealO' + tier) || spr('sealO0'), 0.45, 0, 1.0], [spr('sealM' + Math.min(1, tier)) || spr('sealM0'), -0.75, 0.06, 0.98], [spr('sealI'), 1.2, 0.12, 0.98]];
        c.save(); if (t < 0.7) H.glow(c, X, SY, Rp * 0.7, EDGE, 0.3 * A * (1 - t / 0.7));
        for (const [im, w, dl, al] of L) { if (!im) continue; const s = Rp * cl(lerp(0, 1, (open - dl) / (1 - dl))) * (t < 0.42 ? 1 : 1); if (s < 1) continue; c.save(); c.globalAlpha = A * al * (1 - 0.3 * sm((t - 0.5) / 0.3)); c.translate(X, SY); c.scale(1, sq); c.rotate(t * w + (w > 0 ? 0.3 : -0.2)); c.drawImage(im, -s, -s, s * 2, s * 2); c.restore(); }
        // threads descending from the glyphs to the monsters below
        if (!f.aborted) for (const [m, t0] of threads) { const ut = cl((t - t0) / 0.17), back = sstep(0.82, 1.08, t); if (ut <= 0 || back >= 1) continue; const a = Math.atan2(m.y - cy, m.x - cx), gx = X + Math.cos(a) * Rp * 0.88, gy = SY + Math.sin(a) * Rp * 0.88 * sq;
          const mx = H.sx(m.x), my = H.sy(m.y) - (m.z || 0) * T - m.r * T * 1.05 - T * 0.32, p0x = lerp(gx, mx, back), p0y = lerp(gy, my, back), ex = lerp(gx, mx, ut), ey = lerp(gy, my, ut), qx = (p0x + ex) / 2 + Math.sin(t * 9 + a) * T * 0.12, qy = (p0y + ey) / 2;
          c.save(); c.lineCap = 'round'; c.globalAlpha = A; c.strokeStyle = rgba(VOID, 0.75); c.lineWidth = Math.max(1.6, T * 0.05); c.beginPath(); c.moveTo(p0x, p0y); c.quadraticCurveTo(qx, qy, ex, ey); c.stroke();
          c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(EDGE, 0.85); c.lineWidth = Math.max(0.8, T * 0.022); c.stroke(); c.strokeStyle = rgba(SILV, 0.5); c.lineWidth = 0.7; c.stroke(); if (ut < 1) H.glow(c, ex, ey, T * 0.25, ACC, 0.6); c.restore(); }
        // Celestial: the seal opens like a spectral eye, then folds shut
        if (tier >= 2 && !f.aborted) { const o = Math.sin(cl((t - 0.62) / 0.75) * Math.PI); if (o > 0.01) drawEye(c, X, SY - T * 0.55 * o, Rp * 0.32, sm(o * 1.3), A); }
        c.restore(); } });
  };
  function sealAlpha(f, t) { const L = f.life + f.t; if (f.aborted) return (1 - cl((t - f.abT) / 0.35)) * cl(t / 0.12); return cl(t / 0.12) * (1 - sstep(L - 0.4, L, t)); }
  S.witchsbrand.TUNE = WB;
  S.witchsbrand.LOG = LOG; S.witchsbrand.BT = BT; S.witchsbrand.BTmax = BTmax;
  S.witchsbrand.cleanse = m => !!(m && m.wBrand && cancelBrand(m.wBrand, 'cleanse'));   // (hook for a future cleanse: fades without exploding)
})();
