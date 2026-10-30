/* ---------- Ice, reworked: Frozen Orrery (kept, scaled with evolution) and Diamond Dust ----------
   Frozen Orrery is the user's favourite: at Hatchling it is exactly the old move (nested rings of ice round a sapphire
   core, the rings sweep down through the zone, the core splits into icicles that fall in turn and leave a lattice of
   frost lines). With evolution it grows smoothly to three times the size, area and damage at Celestial, where a frost
   nova runs out along the finished lattice. Diamond Dust: a frost spiral runs over the floor; curved crystal petals rise
   round its end, curl inward and turn, gathering a storm of small diamonds, and the ice flower travels inside a cyclone
   (1 vortex of 6 petals; 2 larger ones with a counter-turning inner layer at Adept, trading ribbons of diamond dust;
   3 enormous ones with three layers round a luminous spindle at Celestial, circling the monsters and opening into full
   bloom before releasing their petals in a spiralling shower). This file also drops the old Ice keys that no longer exist. */
(() => {
  const S = ELEM_IMPL.ice.strong, U = ELEM_IMPL.ice.ult, TAU = Math.PI * 2;
  for (const k of ['wintermoth', 'hailshot']) delete S[k];
  for (const k of ['stillwinter', 'aurorastag', 'snowglass', 'whitecomet', 'hourglass', 'sevenfold', 'mirrorlabyrinth', 'snowfall', 'absolutewinter']) delete U[k];
  const ICE = '#9FE0F8', ICE_L = '#DDF6FF', WHITE = '#FFFFFF', ICE_D = '#2F80B7', ICE_DD = '#1B4F7A', SAPH = '#3B7BFF', SAPH_L = '#8FB4FF';
  let H;
  /* --- the old Orrery's vocabulary (kept so its look stays exactly the same) --- */
  const sliver = (w, h, k) => [[0, -h / 2], [w * 0.5, -h * 0.1 + (k || 0) * h * 0.1], [w * 0.3, h / 2], [-w * 0.3, h * 0.42], [-w * 0.5, -h * 0.15]];
  function oShard(c, x, y, w, h, rot, alpha, tint) { c.save(); c.translate(x, y); c.rotate(rot || 0); const pts = sliver(w, h, 1); H.glass(c, pts, tint || ICE, alpha == null ? 0.85 : alpha, { lit: WHITE, dark: ICE_DD, edge: H.rgba(ICE_DD, 0.9), lw: 1.5 }); c.strokeStyle = H.rgba(WHITE, 0.5 * (alpha == null ? 1 : alpha)); c.lineWidth = 1; c.beginPath(); c.moveTo(0, -h / 2); c.lineTo(-w * 0.1, h * 0.3); c.stroke(); c.restore(); }
  const frostCache = new Map();
  function frostSprite(r, seed, arms) { const key = r + '|' + seed + '|' + arms; let cv = frostCache.get(key); if (cv) return cv; if (frostCache.size > 48) frostCache.clear(); cv = document.createElement('canvas'); const Sz = Math.ceil(r * 2 + 6); cv.width = Sz; cv.height = Sz; const c = cv.getContext('2d'); c.translate(Sz / 2, Sz / 2); c.lineCap = 'round'; for (let i = 0; i < arms; i++) { const a = i / arms * TAU + seed, L = r * (0.75 + 0.25 * Math.sin(seed * 3 + i * 2.1)); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.stroke(); c.strokeStyle = 'rgba(221,246,255,0.6)'; c.lineWidth = 1; c.beginPath(); for (let j = 1; j <= 3; j++) { const d = L * j / 3.6, bl = L * 0.3 * (1 - j / 4), px = Math.cos(a) * d, py = Math.sin(a) * d; for (const s of [-1, 1]) { c.moveTo(px, py); c.lineTo(px + Math.cos(a + s * 0.6) * bl, py + Math.sin(a + s * 0.6) * bl); } } c.stroke(); } frostCache.set(key, cv); return cv; }
  function frost(c, x, y, r, u, seed, alpha, arms) { if (u <= 0 || r < 2) return; const rr = Math.max(8, Math.round(r / 8) * 8), sd = Math.round((seed || 0) * 4) / 4, cv = frostSprite(rr, sd, arms || 6), Sz = cv.width, k = u * r / rr; c.save(); c.globalAlpha *= Math.max(0, Math.min(1, alpha)); c.translate(x, y); c.scale(k, k * H.GY); c.drawImage(cv, -Sz / 2, -Sz / 2); c.restore(); }
  const snow = (x, y, k, z, v) => { for (let i = 0; i < H.n(k); i++) { const a = Math.random() * TAU, s = (v || 1) * (0.3 + Math.random()); H.P({ kind: 'snow', x: x + (Math.random() - 0.5) * 0.4, y: y - (z || 0) + (Math.random() - 0.5) * 0.3, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.5 + 0.6, life: 0.7 + Math.random() * 0.5, max: 1.1, size: 1.5 + Math.random() * 1.5 }); } };
  const shatter = (x, y, k, v, o) => { o = o || {}; H.burst(x, y - (o.z || 0.3), 'shard', k, { v: v || 7, up: o.up == null ? 3 : o.up, g: o.g == null ? 11 : o.g, life: o.life || 0.6, size: o.size || 4, color: [ICE_L, ICE, WHITE, SAPH_L] }); snow(x, y, Math.round(k / 2), o.z || 0.3, 1.5); };
  const glint = (x, y, k, z) => { for (let i = 0; i < H.n(k); i++) H.P({ kind: 'star', x: x + (Math.random() - 0.5) * 0.8, y: y - (z || 0.5) + (Math.random() - 0.5) * 0.6, vx: 0, vy: -0.3, life: 0.5 + Math.random() * 0.4, max: 0.9, size: 2 + Math.random() * 2, color: i % 2 ? WHITE : ICE_L }); };
  const crackle = (x, y, r) => { H.X.light(x, y, r * 1.5, 0.25); H.X.sfx.crack ? H.X.sfx.crack() : H.X.sfx.crash(); };
  const banner = (C, s) => { H.X.banner(s, '', C.col, 1.4); H.X.sfx.hum(); };
  const snowfallAfter = (x, y, r, life) => H.add({ life, x, y, update(dt, f) { if (Math.random() < 2.2 * H.Q() * Math.min(1, f.life / 0.6) * Math.max(1, r / 3.5)) { const b = Math.random() * TAU, d = Math.random() * r; H.P({ kind: 'snow', x: x + Math.cos(b) * d, y: y + Math.sin(b) * d * H.GY - 3 - Math.random() * 1.5, vx: (Math.random() - 0.5) * 0.4, vy: 1.1 + Math.random() * 0.5, life: 1.6, max: 1.6, size: 1.5 + Math.random() * 1.5 }); if (Math.random() < 0.3) H.P({ kind: 'star', x: x + Math.cos(b) * d, y: y + Math.sin(b) * d * H.GY - 2 - Math.random() * 2, vx: 0, vy: 0.6, life: 0.8, max: 0.8, size: 2 + Math.random() * 2, color: ICE_L }); } } });
  /* H.crystal (a gradient per call) rendered once per size into a sprite, so the ring crystals cost a blit each */
  const crysCache = new Map();
  function crys(c, x, y, w, h, rot, fill, lit) { const bw = Math.max(2, Math.round(w)), bh = Math.max(3, Math.round(h)), key = bw + '|' + bh + fill + lit; let cv = crysCache.get(key);
    if (!cv) { if (crysCache.size > 120) crysCache.clear(); cv = document.createElement('canvas'); cv.width = Math.ceil(bw * 2 + 6); cv.height = Math.ceil(bh * 1.5 + 6); const cx = cv.getContext('2d'); H.crystal(cx, cv.width / 2, cv.height / 2, bw, bh, 0, fill, lit); crysCache.set(key, cv); }
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(w / bw, h / bh); c.drawImage(cv, -cv.width / 2, -cv.height / 2); c.restore(); }

  /* ================= FROZEN ORRERY ================= */
  // I-U03 Frozen Orrery: nested ice rings turn round a suspended sapphire core, snow flowing along each orbit; the rings detach and sweep down through the zone, then the core splits into icicles that fall in turn and leave a lattice of frost lines.
  // Evolution grows it smoothly: sc runs 1 (Hatchling) .. 3 (Celestial) for size, area and damage; more ring crystals and icicles keep the bigger rings dense.
  U.frozenorrery = (C, h) => { H = h; const K = IK.bind(H), e = K.evo(C), sc = 1 + 2 * (e - 1) / 6, dm = sc, me = H.me;
    const x = C.tx, y = C.ty, Z = 3.2 + 0.2 * (sc - 1), RR = [1.3, 2.1, 2.9].map(r => r * C.K * sc), R = RR[2] + 0.6 * sc, drops = [], ND = Math.round(4 + (e - 1)), NC = 6 + Math.round((sc - 1) * 3), GAP = 0.2 - 0.07 * (e - 1) / 6, DROP0 = 2.7;
    for (let i = 0; i < ND; i++) { const b = i / ND * TAU + 0.8, r = i ? (1.3 + (i % 2) * 0.6) * sc * (ND > 6 ? 1 + 0.35 * ((i >> 1) % 2) : 1) : 0; let px = x + Math.cos(b) * r, py = y + Math.sin(b) * r * 0.8; const dp = Math.hypot(px - me.x, py - me.y); if (dp < 1.4) { const k = 1.4 / Math.max(0.01, dp); px = me.x + (px - me.x) * k; py = me.y + (py - me.y) * k; } drops.push([px, py]); }
    // the lattice: every pair of landed icicles (as the old move had); with more icicles, spokes from the centre and links round the ring
    const EDGES = []; if (ND <= 5) { for (let i = 0; i < ND; i++) for (let j = i + 1; j < ND; j++) EDGES.push([i, j]); } else for (let i = 1; i < ND; i++) { EDGES.push([0, i]); EDGES.push([i, i + 1 < ND ? i + 1 : 1]); }
    const END = DROP0 + ND * GAP + 0.3, NOVA = END + 0.15, LIFE = e >= 7 ? NOVA + 1.5 : 4.4 + (END - (DROP0 + 0.8 + 0.3));
    H.warn(x, y, R, 1.5, C.col); banner(C, 'FROZEN ORRERY');
    const lattice = c => { const L = F.landed; c.beginPath(); for (const [i, j] of EDGES) { const p = L[i], q = L[j]; if (!p || !q) continue; c.moveTo(H.sx(p[0]), H.sy(p[1])); c.lineTo(H.sx(q[0]), H.sy(q[1])); } };
    const F = H.add({ life: LIFE, x, y, rz: [Z, Z, Z], split: 0, landed: [], nova: -1, drawUnder(c, f, X, Y, T) { const k = Math.min(1, f.life / 0.8); if (f.landed.length > 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * k; c.strokeStyle = WHITE; c.lineWidth = 1.5 * Math.pow(sc, 0.35); lattice(c); c.stroke(); c.restore(); } for (const p of f.landed) if (p) frost(c, H.sx(p[0]), H.sy(p[1]), T * 0.9 * Math.sqrt(sc), 1, p[0] * 3, 0.6 * k, 6);
        if (f.nova >= 0) { const u = H.ease.out(Math.min(1, f.nova / 0.9)), a = Math.max(0, 1 - f.nova / 1.3); K.floorLight(c, X, Y, R * T * (0.4 + 0.8 * u), 0.55 * a, K.P.cyan); K.frostVeins(c, X, Y, R * T * 1.05, u, a, 1.3, 14); K.iceRing(c, X, Y, R * T * u, a, null, f.t, Math.max(3, T * 0.18)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * a; c.strokeStyle = K.P.cyan; c.lineWidth = 4; lattice(c); c.stroke(); c.restore(); } },
      draw(c, f, X, Y, T) { const form = H.ease.out(Math.min(1, f.t / 0.8)), k = Math.min(1, f.life / 0.8), items = [], B = T * sc; c.globalAlpha = k; if (f.split < 1) H.softShadow(c, X, Y, T * 1.1 * sc * form * (1 - f.split), 0.22);
        RR.forEach((r, i) => { if (f.rz[i] < -0.5) return; const rr = r * T * form, tilt = 0.4 + 0.2 * Math.sin(f.t * (0.9 + i * 0.3) + i), rot = Math.sin(f.t * 0.6 + i * 2) * 0.4, cy = Y - T * f.rz[i]; items.push({ y: cy + rr * 0.1, draw() { c.save(); c.translate(X, cy); c.rotate(rot); c.scale(1, tilt); // a band of ice: a dark underside, the glass band, a highlight arc
            c.strokeStyle = H.rgba(ICE_DD, 0.8); c.lineWidth = B * 0.26; c.beginPath(); c.arc(0, B * 0.06, rr, 0, TAU); c.stroke(); c.strokeStyle = H.rgba(ICE, 0.8); c.lineWidth = B * 0.22; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke(); c.strokeStyle = H.rgba(WHITE, 0.75); c.lineWidth = B * 0.06; c.beginPath(); c.arc(0, -B * 0.05, rr, Math.PI * 1.05, Math.PI * 1.75); c.stroke(); c.strokeStyle = H.line(); c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, rr + B * 0.11, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, Math.max(1, rr - B * 0.11), 0, TAU); c.stroke(); for (let j = 0; j < NC; j++) { const b = j / NC * TAU + f.t * (1.2 + i * 0.4) * (i % 2 ? 1 : -1); c.save(); c.translate(Math.cos(b) * rr, Math.sin(b) * rr); c.scale(1, 1 / tilt); crys(c, 0, 0, B * 0.14, B * 0.32, b, j % 2 ? ICE_L : SAPH_L, WHITE); c.restore(); } c.restore();
            for (let q = 0, nq = sc > 1.5 ? 2 : 1; q < nq; q++) if (Math.random() < 0.7 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'snow', x: x + Math.cos(b + rot) * r * form, y: y - f.rz[i] + Math.sin(b) * r * form * tilt, vx: -Math.sin(b) * 2.5 * sc * (i % 2 ? 1 : -1), vy: Math.cos(b) * 1.2 * tilt, life: 0.35 * Math.sqrt(sc), max: 0.35 * Math.sqrt(sc), size: (1.5 + Math.random()) * Math.sqrt(sc) }); } } }); });
        if (f.split < 1) items.push({ y: Y - T * Z, draw() { const cy = Y - T * Z, s = form * (1 - f.split); if (sc > 1.2) K.glow(c, X, cy, B * 1.6 * s, K.P.cyan, 0.25 * (sc - 1)); H.crystal(c, X, cy, B * 0.6 * s, B * 1.1 * s, f.t * 0.5, SAPH, SAPH_L); H.core(c, X, cy, B * 0.25 * s, SAPH_L, WHITE, 0.6 + 0.3 * Math.sin(f.t * 6)); if (f.split > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(WHITE, f.split); c.lineWidth = 1.5 * Math.sqrt(sc); for (let j = 0; j < 5; j++) { const b = j / 5 * TAU; c.beginPath(); c.moveTo(X, cy); c.lineTo(X + Math.cos(b) * B * 0.6, cy + Math.sin(b) * B * 1.0); c.stroke(); } c.restore(); } } });
        items.sort((p, q) => p.y - q.y).forEach(it => it.draw()); },
      update(dt, f) { [1.2, 1.6, 2.0].forEach((t0, i) => { if (f.t > t0) f.rz[i] = Math.max(-1, Z - (f.t - t0) / 0.32 * (Z + 1)); }); if (f.t > 2.4) f.split = Math.min(1, (f.t - 2.4) / 0.3); if (f.nova >= 0) f.nova += dt; } });
    [1.2, 1.6, 2.0].forEach((t0, i) => H.X.after(t0 + 0.3, () => { const r = RR[i]; H.hitRing(x, y, Math.max(0, r - 0.8 * sc), r + 0.8 * sc, C.base * 2.8 * dm * C.K, C.dmgO({ kb: 3, chill: true })); H.X.ring(x, y, Math.max(0.2, r - 0.6 * sc), r + 0.6 * sc, 0.4, i % 2 ? WHITE : ICE_L, 0.5); for (let j = 0, nj = Math.round(16 * Math.sqrt(sc)); j < H.n(nj); j++) { const b = j / nj * TAU; H.P({ kind: 'shard', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r * H.GY, vx: Math.cos(b) * 3 * Math.sqrt(sc), vy: -3 - Math.random() * 3, g: 11, life: 0.6, max: 0.6, size: 4 * Math.sqrt(sc), rot: b, vr: 8, color: j % 2 ? ICE_L : ICE }); } snow(x, y, Math.round(8 * sc), 0.3, 3 * Math.sqrt(sc)); crackle(x, y, r); H.X.shake(6 + 3 * (sc - 1), 0.15); H.X.sfx.crash(); }));
    drops.forEach((p, i) => H.X.after(DROP0 + i * GAP, () => { const hr = 1.25 * Math.pow(sc, 0.8); H.warn(p[0], p[1], 1.2 * Math.pow(sc, 0.8), 0.3, C.col, () => { H.hitArea(p[0], p[1], hr, C.base * 2.3 * dm * C.K, C.dmgO({ kb: 3, freeze: 0.6 })); F.landed[i] = p; shatter(p[0], p[1], Math.round(9 * Math.sqrt(sc)), 6 * Math.sqrt(sc), { z: 0.3, size: 4 * Math.sqrt(sc) }); glint(p[0], p[1], 4, 0.8); H.X.boom(p[0], p[1], 1.0 * Math.sqrt(sc), ICE_L, WHITE, { n: 8, shake: 5, smoke: 0 }); crackle(p[0], p[1], 1.2 * sc); });
      H.add({ life: 0.3, x: p[0], y: p[1], draw(c, f, X, Y, T) { const u = H.ease.in(f.t / 0.3), B = T * Math.pow(sc, 0.8), zz = T * (Z - 0.5) * (1 - u) + T * 0.5; H.softShadow(c, X, Y, B * 0.4 * u, 0.25 * u); oShard(c, X, Y - zz, B * 0.3, B * 1.3, Math.PI, 0.92, i % 2 ? ICE_L : ICE); H.trail(c, [[X, Y - zz - B * 1.6], [X, Y - zz - B * 0.4]], B * 0.3, ICE_L, WHITE); } }); }));
    H.X.after(END, () => snowfallAfter(x, y, R, 0.6 + 0.3 * (sc - 1)));
    // Celestial: a frost nova runs out along the finished lattice, the outer ring flashing white
    if (e >= 7) H.X.after(NOVA, () => { F.nova = 0; H.hitArea(x, y, R, C.base * 1.0 * dm * C.K, C.dmgO({ kb: 4, freeze: 1.0 })); H.X.ring(x, y, 0.5, R, 0.6, ICE_L, 0.55); H.X.flash(0.25, ICE_L); H.X.shake(12, 0.25); H.X.hitstop(0.06); H.X.sfx.crash(); for (const p of F.landed) if (p) { glint(p[0], p[1], 3, 1.0); K.glitter(p[0], p[1] - 0.4, 5, 4); } for (let i = 0; i < H.n(28); i++) { const b = i / 28 * TAU; H.P({ kind: 'shard', x: x + Math.cos(b) * R * 0.9, y: y + Math.sin(b) * R * 0.9 * H.GY, vx: Math.cos(b) * 4, vy: -4 - Math.random() * 3, g: 10, life: 0.8, max: 0.8, size: 6, rot: b, vr: 8, color: i % 2 ? ICE_L : SAPH_L }); } }); };

  /* ================= DIAMOND DUST ================= */
  /* a curved crystal petal, cached once (front and back face): a sickle-shaped blade, base at the bottom centre, its tip
     bending to one side; three facets (frost, pale, deep blue), glowing fractures, a white midrib, a cyan rim. Drawn
     through an affine transform onto the plane of the petal (its tangent and its base-to-tip line), so it turns in 3D. */
  const PW = 72, PH = 196, PAD = 8, petalCache = {};
  const pCentre = v => [PW * (0.34 * v * v - 0.06 * Math.sin(v * Math.PI)), -PH * v];
  const pWidth = v => PW * 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.02)), 0.75) * (1 - 0.25 * v);
  function petalEdge(v, side) { const [cx, cy] = pCentre(v), e = 0.002, [ax, ay] = pCentre(Math.min(1, v + e)), dx = ax - cx, dy = ay - cy, L = Math.hypot(dx, dy) || 1, w = pWidth(v) * side; return [cx - dy / L * w, cy + dx / L * w]; }
  function petalSprite(back) { const key = back ? 'b' : 'f'; if (petalCache[key]) return petalCache[key]; const cv = document.createElement('canvas'); cv.width = PW * 2 + PAD * 2; cv.height = PH + PAD * 2; const c = cv.getContext('2d'), P = IK.P; c.translate(PW + PAD, PH + PAD); c.lineJoin = 'round'; c.lineCap = 'round';
    const N = 26, L = [], R = [], M = [], Lm = [], Rm = []; for (let i = 0; i <= N; i++) { const v = i / N; L.push(petalEdge(v, -1)); R.push(petalEdge(v, 1)); const m = pCentre(v); M.push(m); const a = petalEdge(v, -0.45), b = petalEdge(v, 0.55); Lm.push(a); Rm.push(b); }
    const rgb = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; }, path = (A, Bk) => { c.beginPath(); c.moveTo(A[0][0], A[0][1]); for (const p of A) c.lineTo(p[0], p[1]); for (let i = Bk.length - 1; i >= 0; i--) c.lineTo(Bk[i][0], Bk[i][1]); c.closePath(); };
    const al = back ? 0.5 : 1.08; let g;
    // outer lit facet, inner lit facet, shaded facet beyond the midrib, outer shaded strip (the back face: paler, thinner)
    g = c.createLinearGradient(-PW * 0.5, -PH, PW * 0.3, 0); g.addColorStop(0, rgb(back ? P.frost : P.white, 0.92 * al)); g.addColorStop(0.45, rgb(back ? P.pale : P.frost, 0.8 * al)); g.addColorStop(1, rgb(back ? P.ice : P.pale, 0.66 * al)); path(L, Lm); c.fillStyle = g; c.fill();
    g = c.createLinearGradient(-PW * 0.2, -PH, PW * 0.3, 0); g.addColorStop(0, rgb(P.pale, 0.8 * al)); g.addColorStop(0.5, rgb(P.cyan, 0.55 * al)); g.addColorStop(1, rgb(P.ice, 0.62 * al)); path(Lm, M); c.fillStyle = g; c.fill();
    g = c.createLinearGradient(0, -PH, PW * 0.5, 0); g.addColorStop(0, rgb(P.pale, 0.62 * al)); g.addColorStop(0.5, rgb(P.ice, 0.66 * al)); g.addColorStop(1, rgb(P.blue, 0.75 * al)); path(M, Rm); c.fillStyle = g; c.fill();
    g = c.createLinearGradient(0, -PH, PW * 0.6, 0); g.addColorStop(0, rgb(P.ice, 0.72 * al)); g.addColorStop(0.6, rgb(P.blue, 0.78 * al)); g.addColorStop(1, rgb(P.deep, 0.85 * al)); path(Rm, R); c.fillStyle = g; c.fill();
    // glowing internal fractures and a cyan inner light near the base
    c.save(); path(L, R); c.clip(); c.globalCompositeOperation = 'lighter'; const gi = c.createLinearGradient(0, 0, 0, -PH * 0.7); gi.addColorStop(0, rgb(P.cyan, back ? 0.25 : 0.4)); gi.addColorStop(1, rgb(P.cyan, 0)); c.fillStyle = gi; c.fillRect(-PW, -PH, PW * 2, PH);
    c.strokeStyle = rgb(P.cyan, back ? 0.3 : 0.5); c.lineWidth = 1.6; for (const [v0, s0, s1] of [[0.18, -0.8, 0.5], [0.38, 0.7, -0.4], [0.55, -0.6, 0.6], [0.72, 0.5, -0.5]]) { const a = petalEdge(v0, s0), b = petalEdge(v0 + 0.09, s1), m = petalEdge(v0 + 0.05, (s0 + s1) * 0.2); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(m[0], m[1]); c.lineTo(b[0], b[1]); c.lineTo(b[0] + 4, b[1] - 9); c.stroke(); }
    c.restore();
    // the bright midrib, the cyan rim, a white sheen down the lit edge, a thin deep line on the shaded edge
    c.strokeStyle = rgb(P.white, back ? 0.55 : 0.95); c.lineWidth = 2.6; c.beginPath(); M.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    c.strokeStyle = rgb(P.cyan, back ? 0.55 : 0.95); c.lineWidth = 2.2; path(L, R); c.stroke();
    c.strokeStyle = rgb(P.white, back ? 0.35 : 0.85); c.lineWidth = 1.6; c.beginPath(); for (let i = 3; i <= N - 2; i++) { const p = petalEdge(i / N, -0.86); i > 3 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
    c.strokeStyle = rgb(P.abyss, 0.5); c.lineWidth = 1; c.beginPath(); R.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    petalCache[key] = cv; return cv; }
  /* the petal's light: a soft cyan glow along its rim and midrib, drawn additively over the body */
  function petalRim() { if (petalCache.r) return petalCache.r; const cv = document.createElement('canvas'); cv.width = PW * 2 + PAD * 2; cv.height = PH + PAD * 2; const c = cv.getContext('2d'), P = IK.P; c.translate(PW + PAD, PH + PAD); c.lineJoin = 'round'; c.lineCap = 'round';
    const N = 26, L = [], R = [], M = []; for (let i = 0; i <= N; i++) { L.push(petalEdge(i / N, -1)); R.push(petalEdge(i / N, 1)); M.push(pCentre(i / N)); }
    const outline = () => { c.beginPath(); L.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath(); };
    for (const [w, a, col] of [[14, 0.1, P.cyan], [7, 0.22, P.cyan], [3, 0.45, P.pale]]) { c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w; outline(); c.stroke(); }
    for (const [w, a, col] of [[8, 0.15, P.cyan], [2.5, 0.5, P.white]]) { c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w; c.beginPath(); M.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
    petalCache.r = cv; return cv; }
  /* one petal on screen: base (bx, by), the unit tangent (ux, uy) times its width w, the base-to-tip vector (vx, vy) */
  function drawPetal(c, bx, by, ux, uy, w, vx, vy, back, a, rim) { if (!(a > 0.02)) return; const cv = petalSprite(back), k = w / PW; c.save(); c.globalAlpha = a; c.translate(bx, by); c.transform(ux * k, uy * k, -vx / PH, -vy / PH, 0, 0); c.drawImage(cv, -PW - PAD, -PH - PAD); if (rim > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * rim); c.drawImage(petalRim(), -PW - PAD, -PH - PAD); } c.restore(); }
  const onPetal = (bx, by, ux, uy, w, vx, vy, v, s) => { const p = petalEdge(v, s); return [bx + ux * w * p[0] / PW - vx * p[1] / PH, by + uy * w * p[0] / PW - vy * p[1] / PH]; };

  U.diamonddust = (C, h) => { H = h; const K = IK.bind(H), P = K.P, me = H.me, e = K.evo(C), NV = K.lv(C, [1, 2, 3]), NL = K.lv(C, [1, 2, 3]), SZ = [1, 1.08, 1.16, 1.3, 1.38, 1.46, 1.62][e - 1];
    const RISE = 0.6, RUN = 1.35, TRAV = K.lv(C, [2.4, 2.7, 2.9]), TE = RUN + TRAV, FIN = e >= 7 ? 1.3 : 0.7, LIFE = TE + FIN + (e >= 7 ? 0.6 : 0.8);
    const HR = 1.45 * SZ * C.K, DT = 0.25, dmK = C.base * C.K * K.evoK(C), TICK = dmK * [1.25, 0.85, 0.42][NV - 1], FINAL = dmK * [4.2, 2.6, 1.7][NV - 1];
    // the paths: across the front of the monsters (1), a do-si-do past each other (2), circling the formation (3)
    let dx = C.tx - me.x, dy = C.ty - me.y, dd = Math.hypot(dx, dy); if (dd < 0.1) { dx = Math.cos(C.a); dy = Math.sin(C.a); dd = 1; } dx /= dd; dy /= dd; const px = -dy, py = dx;
    const G0 = Math.max(dd, NV === 3 ? 3.6 : 1.4 + 1.7 * SZ), gx = me.x + dx * G0, gy = me.y + dy * G0;
    const at = (gfa, gpa) => [gx + dx * gfa + px * gpa, gy + dy * gfa + py * gpa];
    const pathFn = i => { if (NV === 1) return u => { const s = 1 - 2 * u; return at(0.6 * Math.sin(u * Math.PI) - 0.3, 2.5 * s); };
      if (NV === 2) { const sg = i ? -1 : 1; return u => { const s = sg * (1 - 2 * u); return at((i ? -1.25 : 1.45) * Math.sin(u * Math.PI) + 0.1, 2.9 * s); }; }
      const th0 = -Math.PI / 2 + i * TAU / 3 + 0.4; return u => { const th = th0 + u * Math.PI * 1.25, rho = 3.15 - 0.45 * Math.sin(u * Math.PI); return at(Math.sin(th) * rho * 0.85, Math.cos(th) * rho); }; };
    const V = []; for (let i = 0; i < NV; i++) { const pf = pathFn(i), s0 = pf(0); V.push({ i, pf, x: s0[0], y: s0[1], sx: s0[0], sy: s0[1], tick: 0, trail: [], seed: i * 2.3 + 0.7, k: 1 }); }
    const layers = [{ n: 6, r0: 0.5, h: 2.0, w: 1.55, spin: 0.85 }, { n: 6, r0: 0.32, h: 1.5, w: 1.1, spin: -1.35 }, { n: 5, r0: 0.18, h: 1.1, w: 0.78, spin: 1.9 }].slice(0, NL);
    const ND = K.lv(C, [16, 22, 28]), dia = []; for (let j = 0; j < ND; j++) dia.push({ r: 0.1 + 0.32 * K.R1(j * 3.1), z: 0.3 + 2.1 * K.R1(j * 7.7), w: 0.11 + 0.09 * K.R1(j * 1.3), sp: 6 + 4 * K.R1(j * 5.3), ph: K.R1(j * 9.1) * TAU, r0: 1.2 + 0.8 * K.R1(j * 2.2) });
    H.warn(gx, gy, NV === 3 ? 2.9 + HR : 2.6 + HR, RUN, C.col); banner(C, 'DIAMOND DUST'); me.sq = 0.75;
    const ph = t => t < RISE ? 0 : t < RUN ? 1 : t < TE ? 2 : 3;
    // the travelling frost spirals (floor), the vortices' skirts, trails and floor light
    const F = H.add({ life: LIFE, x: gx, y: gy, _V: V,
      drawUnder(c, f, X0, Y0, T) { const t = f.t, end = Math.min(1, f.life / 0.8);
        for (const v of V) { // the thin spiral of frost running from the pet to the vortex's start
          const sp = Math.min(1, t / RISE), sa = Math.max(0, 1 - Math.max(0, t - RUN) / 0.9) * end; if (sa > 0) { const x0 = me.x + dx * 0.6, y0 = me.y + dy * 0.6, pts = []; for (let k = 0; k <= 48 * sp; k++) { const s = k / 48, b = s * TAU * 5 + v.i * 2.1, rr = 0.24 * SZ * (0.4 + 0.6 * s), wx = x0 + (v.sx - x0) * s + Math.cos(b) * rr, wy = y0 + (v.sy - y0) * s + Math.sin(b) * rr; pts.push([H.sx(wx), H.sy(wy)]); }
              if (pts.length > 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.globalAlpha = 0.3 * sa; c.strokeStyle = P.blue; c.lineWidth = 7; c.stroke(); c.globalAlpha = 0.7 * sa; c.strokeStyle = P.cyan; c.lineWidth = 3; c.stroke(); c.globalAlpha = 0.8 * sa; c.strokeStyle = P.frost; c.lineWidth = 1.6; c.stroke(); c.restore(); const hd = pts[pts.length - 1]; if (sp < 1) { K.glow(c, hd[0], hd[1], T * 0.6, P.cyan, 0.7); K.glow(c, hd[0], hd[1], T * 0.25, P.white, 0.8); } } }
          const X = H.sx(v.x), Y = H.sy(v.y), g = ph(t) === 0 ? 0 : Math.min(1, (t - RISE) / 0.5), fo = t > TE + FIN * 0.6 ? Math.max(0, 1 - (t - TE - FIN * 0.6) / 0.6) : 1, a = g * fo * end * v.k;
          // a frost spiral curling round the vortex's foot as the petals rise
          if (t > RISE * 0.8 && t < RUN + 0.8) { const u = Math.min(1, (t - RISE * 0.8) / 0.5), sa2 = Math.min(1, (RUN + 0.8 - t) / 0.5); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = P.pale; c.lineWidth = 1.4; c.globalAlpha = 0.85 * sa2; c.beginPath(); for (let k = 0; k <= 40 * u; k++) { const s = k / 40, b = s * TAU * 2.2 + f.t * 1.5, rr = T * SZ * 1.2 * s; const qx = X + Math.cos(b) * rr, qy = Y + Math.sin(b) * rr * H.GY; k ? c.lineTo(qx, qy) : c.moveTo(qx, qy); } c.stroke(); c.restore(); }
          // the frosted trail: fading light and frost stars along the way it came
          if (v.trail.length > 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; for (let k = 1; k < v.trail.length; k++) { const p = v.trail[k - 1], q = v.trail[k], ag = Math.max(0, 1 - (t - q[2]) / (NV === 3 ? 2.0 : 1.3)) * end; if (ag <= 0) continue; c.globalAlpha = 0.18 * ag; c.strokeStyle = P.ice; c.lineWidth = T * SZ * 0.6; c.beginPath(); c.moveTo(H.sx(p[0]), H.sy(p[1])); c.lineTo(H.sx(q[0]), H.sy(q[1])); c.stroke(); c.globalAlpha = 0.6 * ag; c.strokeStyle = P.frost; c.lineWidth = 1.2; c.stroke(); } c.restore(); for (let k = 0; k < v.trail.length; k += 2) { const q = v.trail[k], ag = Math.max(0, 1 - (t - q[2]) / (NV === 3 ? 2.0 : 1.3)) * end; if (ag > 0.02) frost(c, H.sx(q[0]), H.sy(q[1]), T * SZ * 0.9, 1, k * 0.37 + v.i, 0.55 * ag, 6); } }
          if (a > 0.01) { K.floorLight(c, X, Y, T * SZ * 2.3, 0.55 * a, P.ice); K.frozenPool(c, X, Y, T * SZ * 1.25, 0.7 * a, t); K.mist(c, X, Y, T * SZ * 1.7, a / Math.sqrt(NV), t * 1.5 + v.i); } } },
      draw(c, f, X0, Y0, T) { const t = f.t, end = Math.min(1, f.life / 0.8), pz = ph(t);
        // ribbons of diamond dust between neighbouring vortices while they pass close (Adept, Celestial)
        if (NV > 1 && pz === 2) { const u = (t - RUN) / TRAV, rk = NV === 2 ? Math.max(0, Math.sin(Math.min(1, Math.max(0, (u - 0.3) / 0.4)) * Math.PI)) : 0.35 + 0.35 * Math.sin(t * 2.2); if (rk > 0.02) for (let i = 0; i < NV; i++) { const A = V[i], Bv = V[(i + 1) % NV]; if (NV === 2 && i) break; const ax = H.sx(A.x), ay = H.sy(A.y) - T * SZ, bx = H.sx(Bv.x), by = H.sy(Bv.y) - T * SZ, mx = (ax + bx) / 2, my = Math.min(ay, by) - T * SZ * 1.2, qa = rk * end * Math.min(A.k, Bv.k);
            c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (const sd of [-1, 1]) { const oy = sd * T * 0.35; c.globalAlpha = 0.22 * qa; c.strokeStyle = P.cyan; c.lineWidth = T * 0.35; c.beginPath(); c.moveTo(ax, ay + oy); c.quadraticCurveTo(mx, my + oy * 2, bx, by + oy); c.stroke(); c.globalAlpha = 0.55 * qa; c.strokeStyle = P.frost; c.lineWidth = 1.2; c.stroke(); } c.restore();
            for (let k = 0; k < 14; k++) { const dir = k % 2, s0 = (t * 0.9 + k / 14) % 1, s = dir ? 1 - s0 : s0, oy = (dir ? 1 : -1) * T * 0.35, qx = (1 - s) * (1 - s) * ax + 2 * s * (1 - s) * mx + s * s * bx, qy = (1 - s) * (1 - s) * (ay + oy) + 2 * s * (1 - s) * (my + oy * 2) + s * s * (by + oy); K.glow(c, qx, qy, T * 0.22, k % 3 ? P.cyan : P.lav, 0.8 * qa); K.shard(c, qx, qy, 3.5, 8, t * 9 + k, k, qa); } } }
        for (const v of V) drawVortex(c, f, v, H.sx(v.x), H.sy(v.y), T, t, end); },
      update(dt, f) { const t = f.t, pz = ph(t);
        for (const v of V) { if (pz >= 2) { const u = Math.min(1, (t - RUN) / TRAV), ue = H.ease.io(u), p = v.pf(ue); v.x = p[0]; v.y = p[1]; if (pz === 2 && (!v.trail.length || t - v.trail[v.trail.length - 1][2] > 0.09)) v.trail.push([v.x, v.y, t]); }
          // never cover the pet: a vortex fades while it passes close to it
          const dp = Math.hypot(v.x - me.x, v.y - me.y); v.k = Math.max(0.28, Math.min(1, (dp - 0.5) / (1.4 * SZ)));
          if (pz === 2) { v.tick -= dt; if (v.tick <= 0) { v.tick += DT; H.hitArea(v.x, v.y, HR, TICK, C.dmgO({ kb: 0.5, chill: true })); }
            for (const m of H.near(v.x, v.y, HR * 1.25)) { H.pull(m, v.x, v.y, 1.6 * dt); H.slow(m, 0.6); }
            K.aura(v.x, v.y, 0.9 * SZ, dt, 16 * SZ, 0.6 * SZ); if (Math.random() < 6 * dt * H.Q() * SZ) { const b = Math.random() * TAU, r = 0.6 * SZ; H.P({ kind: 'spark', x: v.x + Math.cos(b) * r, y: v.y + Math.sin(b) * r * 0.55 - (0.4 + Math.random() * 1.2) * SZ, vx: -Math.sin(b) * 5, vy: Math.cos(b) * 2 - 0.5, g: 0.5, drag: 1.5, life: 0.5, max: 0.5, size: 2.2, color: Math.random() < 0.3 ? P.lav : P.white }); } }
          else if (pz === 1) K.aura(v.x, v.y, 0.8 * SZ, dt, 10 * SZ, 0.5 * SZ); } } });
    // a vortex: far funnel streaks, far petals, the storm of diamonds and the spindle, near petals, near streaks
    function drawVortex(c, f, v, X, Y, T, t, end) { const pz = ph(t); if (pz === 0) return; const rise = Math.min(1, (t - RISE) / (RUN - RISE)), B = T * SZ;
      const fin = pz === 3 ? (t - TE) / FIN : 0, bloom = e >= 7 ? H.ease.io(Math.min(1, fin / 0.38)) : 0, rel = e >= 7 ? Math.max(0, (fin - 0.38) / 0.62) : 0, snap = e < 7 ? H.ease.in(Math.min(1, fin / 0.4)) : 0, burst = e < 7 ? Math.max(0, (fin - 0.4) / 0.6) : 0;
      const vis = end * v.k * (e < 7 ? 1 - burst : 1); if (vis < 0.01 && rel <= 0) return; const items = [], storm = (pz === 1 ? H.ease.out(rise) : 1) * (1 - Math.max(burst, rel));
      // a soft glow behind the flower, so the crystal reads inside the light
      items.push({ d: -9, draw() { K.glow(c, X, Y - B * 0.85, B * 1.9, P.ice, 0.28 / Math.sqrt(NV) * vis * (pz === 1 ? rise : 1)); } });
      // petals
      layers.forEach((L, li) => { for (let j = 0; j < L.n; j++) { const rj = H.ease.back(Math.max(0, Math.min(1, rise * 1.6 - j / L.n * 0.6 - li * 0.15))); if (rj <= 0) continue;
        const rot = (pz >= 1 ? (t - RISE) : 0) * L.spin * (0.4 + 0.6 * Math.min(1, rise * 1.5)) + (pz === 2 ? (t - RUN) * L.spin * 0.25 : 0) + li * 0.5 + v.seed, phi0 = j / L.n * TAU + rot;
        // open: unfurled as they rise, curled inward as they turn, breathing in travel; full bloom (Celestial) or snapped shut at the finish
        let o = pz === 1 ? 0.85 - 0.4 * H.ease.io(Math.min(1, Math.max(0, (rise - 0.45) / 0.55))) : 0.66 + 0.17 * Math.sin(t * 2.3 + j * 1.3 + li * 0.9 + v.seed) - li * 0.14;
        if (pz === 3) o = e >= 7 ? o + (1 - o) * bloom : o * (1 - snap);
        // the release (Celestial): each petal spirals out and up, shrinking, then breaks into diamonds
        const rl = rel > 0 ? H.ease.in(Math.min(1, Math.max(0, rel * 1.25 - j / L.n * 0.25))) : 0, phi = phi0 + rl * 2.2 * Math.sign(L.spin), r0 = L.r0 * (1 + rl * 3.2), lift = rl * 1.6, sh = 1 - rl * 0.7;
        const hh = L.h * rj * (1 - 0.3 * o * o) * sh, r1 = r0 + L.h * (-0.2 + 0.95 * o), tw = 0.18 * Math.sin(t * 1.7 + j * 2.1 + v.seed) * L.w;
        const cs = Math.cos(phi), sn = Math.sin(phi), bx = X + cs * r0 * B, by = Y + sn * r0 * B * H.GY - lift * B, tx = X + (cs * r1 - sn * tw) * B, ty = Y + (sn * r1 + cs * tw) * B * H.GY - hh * B - lift * B;
        const ux = -sn, uy = cs * H.GY, un = Math.hypot(ux, uy) || 1, w = L.w * B * rj * sh, a = vis * (rel > 0 ? 1 - Math.max(0, (rl - 0.75) / 0.25) : 1) * (0.9 - li * 0.08);
        const back = sn < -0.05, depth = sn * r0 - li * 0.001;
        items.push({ d: depth, draw() { drawPetal(c, bx, by, ux / un, uy / un, w, tx - bx, ty - by, back, back ? a * 0.6 : a, back ? 0.2 : 0.85);
          if (!back) { // lavender reflection flashing across the turning face, cyan light running up its edge
            const gl = Math.pow(Math.max(0, Math.cos(phi - 1.05)), 16); if (gl > 0.05) { const q = onPetal(bx, by, ux / un, uy / un, w, tx - bx, ty - by, 0.55, -0.2); K.glow(c, q[0], q[1], w * 0.55, P.lav, 0.55 * gl * a); K.glow(c, q[0], q[1], w * 0.2, P.white, 0.7 * gl * a); }
            const s = ((t * 0.75 + j * 0.29 + li * 0.17) % 1.3); if (s < 1) { const q = onPetal(bx, by, ux / un, uy / un, w, tx - bx, ty - by, 0.1 + s * 0.85, -1); K.glow(c, q[0], q[1], B * 0.22, P.cyan, 0.85 * a * Math.sin(s * Math.PI)); } } } }); } });
      // the storm: small diamonds whipping round the centre (gathering in from outside as the flower rises)
      if (storm > 0.01) { const sa = vis * storm; for (const d of dia) { const r = (d.r + (pz === 1 ? d.r0 * (1 - H.ease.out(rise)) : 0) + (rel > 0 ? rel * 1.5 : 0)) * SZ, b = d.ph + t * d.sp, z = d.z * SZ * (0.4 + 0.6 * storm), qx = X + Math.cos(b) * r * B / SZ * 1, qy = Y + Math.sin(b) * r * B / SZ * H.GY - z * T, ang = Math.atan2(Math.cos(b) * H.GY, -Math.sin(b)) + 0.4;
          const dw = d.w * B; items.push({ d: Math.sin(b) * r * 0.9, draw() { K.glow(c, qx, qy, dw * 1.8, P.cyan, 0.45 * sa); K.shard(c, qx, qy, dw, dw * 2.6, ang, (d.ph * 3) | 0, sa); } }); }
        // the tight core: a column of light, and at Celestial the luminous spindle of ice
        items.push({ d: 0.0005, draw() { const cy = Y - B * 0.95; K.glow(c, X, cy, B * 1.2, P.cyan, 0.5 * sa); K.glow(c, X, cy - B * 0.5, B * 0.7, P.cyan, 0.4 * sa); K.glow(c, X, cy, B * 0.5, P.white, 0.7 * sa);
          if (NL >= 3) { const sw = 0.55 + 0.45 * Math.abs(Math.cos(t * 4 + v.seed)), hs = B * 1.15 * (0.5 + 0.5 * storm); K.glow(c, X, cy, B * 0.8, P.lav, 0.3 * sa); K.shard(c, X, cy, B * 0.36 * sw, hs, -Math.PI / 2, 2, sa, t); K.shard(c, X, cy, B * 0.36 * sw, hs * 0.8, Math.PI / 2, 3, sa * 0.9); H.core(c, X, cy, B * 0.2, P.cyan, P.white, 0.8 * sa); } } }); }
      // the cyclone: streaks of snow round a funnel, widening upward (far halves behind, near halves in front)
      const NA = Math.min(5, 3 + NL), fa = vis * (pz === 1 ? rise : 1) * (1 - Math.max(burst, rel));
      if (fa > 0.01) for (let k = 0; k < NA; k++) { const z = (0.2 + k * 2.3 / NA) * B, rr = (0.55 + 0.16 * k) * B * (1 + 0.15 * Math.sin(t * 3 + k)), a0 = t * (6.5 - k * 0.5) + k * 1.9 + v.seed, sw = 2.3;
        for (let s = 0; s < 3; s++) { const b0 = a0 + s * sw / 3, b1 = b0 + sw / 3, mid = (b0 + b1) / 2, al = fa * (0.18 + 0.3 * (s + 1) / 3);
          items.push({ d: Math.sin(mid) * 1.2, draw() { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.globalAlpha = al; c.strokeStyle = s === 2 ? P.frost : s ? P.cyan : P.ice; c.lineWidth = Math.max(2, B * (0.05 + 0.035 * s)); c.beginPath(); c.ellipse(X, Y - z, rr, rr * 0.38, 0, b0, b1); c.stroke(); c.restore(); } }); } }
      items.sort((p, q) => p.d - q.d); for (const it of items) it.draw();
      // the finish flash
      if (pz === 3) { const fl = e >= 7 ? Math.max(0, 1 - Math.abs(fin - 0.38) / 0.18) : Math.max(0, 1 - Math.abs(fin - 0.4) / 0.15); if (fl > 0) { K.glow(c, X, Y - B, B * 2.6, P.cyan, 0.6 * fl * end); K.glow(c, X, Y - B, B, P.white, 0.7 * fl * end); } } }
    // the finish: Hatchling/Adept snap shut and burst; Celestial opens into full bloom and releases a spiralling shower of diamonds
    H.X.after(TE + FIN * (e >= 7 ? 0.38 : 0.4), () => { for (const v of V) { H.hitArea(v.x, v.y, HR * 1.25, FINAL, C.dmgO({ kb: 3, freeze: 1.0 })); for (const m of H.near(v.x, v.y, HR * 1.25)) H.bind(m, 1.0); H.X.ring(v.x, v.y, 0.3, HR * 1.3, 0.45, ICE_L, 0.5); K.shatterAt(v.x, v.y - 0.8 * SZ, SZ);
        if (e >= 7) { for (let i = 0; i < H.n(30); i++) { const b = i / 30 * TAU, z = 0.5 + Math.random() * 1.8; H.P({ kind: i % 3 ? 'spark' : 'shard', x: v.x + Math.cos(b) * 0.6 * SZ, y: v.y + Math.sin(b) * 0.35 * SZ - z, vx: Math.cos(b) * 3 - Math.sin(b) * 4, vy: (Math.sin(b) * 3 + Math.cos(b) * 4) * 0.55 - 2.5, g: 2.5, drag: 0.6, life: 1.3, max: 1.3, size: i % 3 ? 2.6 : 4, rot: b, vr: 9, color: [P.white, P.cyan, P.lav, P.pale][i % 4] }); } K.snow(v.x, v.y - 1.2, 12, { v: 2.5 }); }
        else { K.fragments(v.x, v.y - 0.8 * SZ, 14, 6); K.glitter(v.x, v.y - 1, 12, 5); } }
      H.X.boom(gx, gy, 1.2 * SZ, ICE_L, WHITE, { n: 12 * NV, shake: 8 + 4 * NV, smoke: 0 }); H.X.flash(0.2 + 0.06 * NV, ICE_L); H.X.hitstop(0.06); H.X.sfx.crash(); });
    if (e >= 7) H.X.after(TE + FIN * 0.75, () => { for (const v of V) { K.glitter(v.x, v.y - 1.6, 16, 6); H.X.light(v.x, v.y, 3, 0.3); } snowfallAfter(gx, gy, 4.5, 1.2); });
    H.X.after(RISE, () => { for (const v of V) { K.glitter(v.x, v.y - 0.3, 8, 3); H.X.light(v.x, v.y, 2 * SZ, 0.25); } H.X.sfx.hum(); });
    H.X.after(RUN, () => H.X.shake(3 + NV, 0.2)); };
})();
