/* ---------- The ice kit: shared rendering for the reworked Ice moves ----------
   The user's direction: translucent blue ice, brilliant cyan edges, glowing internal fractures, refracted light,
   swirling snow and glittering crystal fragments; the large shapes stay visible inside the glow. Moves call IK.bind(H)
   at cast time. Screen-space drawing (px); particles in world units. Shards are drawn as faceted translucent solids: a lit
   face and a shaded face meeting on a bright ridge, a cyan rim, glowing fracture lines inside, a lavender glint.
   Evolution: C.evo 1..7; IK.evoN(C, a, b), IK.lv(C, [n1, n4, n7]) (stages 2-3 take level 1's, 5-6 level 4's), IK.evoK(C). */
const IK = (() => {
  const TAU = Math.PI * 2;
  const P = { white: '#FFFFFF', frost: '#E8FBFF', pale: '#BFEFFF', cyan: '#5FE8FF', ice: '#7FC8F0', blue: '#3B8EE0', deep: '#1E4FA0', abyss: '#122E66', lav: '#C8B8FF', silver: '#DDE8F5' };
  let H;
  const rgba = (h, a) => H.rgba(h, a);
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col || P.cyan), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorLight(c, X, Y, r, a, col) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col || P.ice), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  /* a faceted shard standing at (x, y) (its base), pointing along screen angle ang (default up), w wide and h long; s a
     seed for its fractures; a alpha. A translucent lit face and shaded face meet on a bright ridge, a cyan rim, glowing
     fracture lines inside, a lavender glint sliding with t. Cached as sprites by size bucket, so many stay cheap. */
  const shardCache = new Map();
  function shardSprite(w, h, s) { const bw = Math.max(4, Math.round(w / 3) * 3), bh = Math.max(6, Math.round(h / 4) * 4), key = bw + '|' + bh + '|' + (s % 4); let cv = shardCache.get(key); if (cv) return cv;
    const pad = Math.ceil(bw * 0.6), W = bw + pad * 2, Hh = bh + pad * 2; cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const c = cv.getContext('2d'); c.translate(W / 2, Hh - pad);
    const tip = [bw * 0.06 * ((s % 3) - 1), -bh], L = [-bw / 2, 0], Rr = [bw / 2, 0], F = [bw * 0.08, bw * 0.18], ridgeTop = tip;
    // lit face (left) and shaded face (right), both translucent
    let g = c.createLinearGradient(L[0], tip[1], F[0], 0); g.addColorStop(0, rgbaS(P.frost, 0.92)); g.addColorStop(0.5, rgbaS(P.pale, 0.72)); g.addColorStop(1, rgbaS(P.ice, 0.6));
    c.beginPath(); c.moveTo(L[0], L[1]); c.lineTo(F[0], F[1]); c.lineTo(tip[0], tip[1]); c.closePath(); c.fillStyle = g; c.fill();
    g = c.createLinearGradient(F[0], tip[1], Rr[0], 0); g.addColorStop(0, rgbaS(P.blue, 0.7)); g.addColorStop(0.6, rgbaS(P.deep, 0.72)); g.addColorStop(1, rgbaS(P.abyss, 0.8));
    c.beginPath(); c.moveTo(F[0], F[1]); c.lineTo(Rr[0], Rr[1]); c.lineTo(tip[0], tip[1]); c.closePath(); c.fillStyle = g; c.fill();
    // glowing internal fractures
    c.save(); c.beginPath(); c.moveTo(L[0], L[1]); c.lineTo(F[0], F[1]); c.lineTo(Rr[0], Rr[1]); c.lineTo(tip[0], tip[1]); c.closePath(); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(P.cyan, 0.75); c.lineWidth = Math.max(0.8, bw * 0.05); c.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const y0 = -bh * (0.2 + 0.25 * i + 0.1 * R1(s + i)), x0 = (R1(s * 3 + i) - 0.5) * bw * 0.5; c.beginPath(); c.moveTo(x0 - bw * 0.25, y0 + bh * 0.06); c.lineTo(x0, y0); c.lineTo(x0 + bw * 0.2, y0 - bh * 0.1); c.lineTo(x0 + bw * 0.05, y0 - bh * 0.18); c.stroke(); }
    const gi = c.createLinearGradient(0, 0, 0, -bh); gi.addColorStop(0, rgbaS(P.cyan, 0.35)); gi.addColorStop(1, rgbaS(P.white, 0)); c.fillStyle = gi; c.fillRect(-bw, -bh, bw * 2, bh); c.restore();
    // the bright ridge and cyan rim, a thin dark outline on the shaded side
    c.lineJoin = 'round'; c.strokeStyle = rgbaS(P.white, 0.95); c.lineWidth = Math.max(1, bw * 0.07); c.beginPath(); c.moveTo(F[0], F[1]); c.lineTo(ridgeTop[0], ridgeTop[1]); c.stroke();
    c.strokeStyle = rgbaS(P.cyan, 0.9); c.lineWidth = Math.max(0.8, bw * 0.045); c.beginPath(); c.moveTo(L[0], L[1]); c.lineTo(tip[0], tip[1]); c.lineTo(Rr[0], Rr[1]); c.stroke();
    c.strokeStyle = rgbaS(P.abyss, 0.5); c.lineWidth = Math.max(0.6, bw * 0.03); c.beginPath(); c.moveTo(tip[0], tip[1]); c.lineTo(Rr[0], Rr[1]); c.lineTo(F[0], F[1]); c.stroke();
    if (shardCache.size > 160) shardCache.clear(); shardCache.set(key, cv); cv._ax = W / 2; cv._ay = Hh - pad; return cv; }
  function rgbaS(h, a) { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; }
  function shard(c, x, y, w, h, ang, s, a, t) { if (h < 2 || !(a > 0.01)) return; const cv = shardSprite(w, h, s | 0), sc = w / Math.max(4, Math.round(w / 3) * 3); c.save(); c.translate(x, y); c.rotate((ang == null ? -Math.PI / 2 : ang) + Math.PI / 2); c.globalAlpha = a; c.scale(sc, h / Math.max(6, Math.round(h / 4) * 4) ); c.drawImage(cv, -cv._ax, -cv._ay); c.restore();
    // a lavender glint sliding up the lit face
    if (t != null) { const u = ((t * 0.8 + (s || 0) * 0.37) % 1.6) / 1.6; if (u < 1) { const b = (ang == null ? -Math.PI / 2 : ang), gx = x + Math.cos(b) * h * u - Math.sin(b) * w * 0.12, gy = y + Math.sin(b) * h * u + Math.cos(b) * w * 0.12; glow(c, gx, gy, w * 0.5, P.lav, 0.5 * a * Math.sin(u * Math.PI)); } } }
  /* a crystal standing on the floor at (X, Y): a shard with a cyan glow and floor light at its foot */
  function crystal(c, X, Y, w, h, s, a, t) { floorLight(c, X, Y, w * 1.8, 0.45 * a); glow(c, X, Y - h * 0.4, Math.max(w, h * 0.5), P.cyan, 0.3 * a); shard(c, X, Y, w, h, null, s, a, t); }
  /* a ring of ice on the floor (or tilted in the air when ry given): a pale band, a cyan inner edge, bright glints */
  function iceRing(c, X, Y, r, a, ry, t, w) { if (r < 1 || !(a > 0.01)) return; ry = ry == null ? r * H.GY : ry; w = w || Math.max(2, r * 0.08); c.save(); c.globalAlpha = a; c.lineCap = 'round';
    c.strokeStyle = rgbaS(P.deep, 0.45); c.lineWidth = w * 1.4; c.beginPath(); c.ellipse(X, Y, r, Math.max(0.1, Math.abs(ry)), 0, 0, TAU); c.stroke(); c.strokeStyle = rgbaS(P.pale, 0.85); c.lineWidth = w; c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(P.cyan, 0.8); c.lineWidth = Math.max(1, w * 0.35); c.beginPath(); c.ellipse(X, Y, Math.max(0.1, r - w * 0.3), Math.max(0.1, ry - w * 0.3 * ry / r), 0, 0, TAU); c.stroke();
    for (let i = 0; i < 3; i++) { const b = (t || 0) * 0.9 + i * 2.1; glow(c, X + Math.cos(b) * r, Y + Math.sin(b) * ry, w * 2.5, P.white, 0.6 * a); } c.restore(); }
  /* frost veins spreading across the floor from (X, Y) out to radius r (u 0..1 how far grown); fades with a */
  function frostVeins(c, X, Y, r, u, a, s, n) { if (!(a > 0.01) || u <= 0) return; n = n || 7; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 0; i < n; i++) { let b = (s || 0) + i / n * TAU + R1(i + (s || 0)) * 0.5, x = X, y = Y; const seg = 6, L = r * u * (0.7 + 0.3 * R1(i * 3 + (s || 0))); c.beginPath(); c.moveTo(x, y);
      for (let k = 1; k <= seg; k++) { b += (R1(i * 13 + k + (s || 0)) - 0.5) * 0.7; x += Math.cos(b) * L / seg; y += Math.sin(b) * L / seg * H.GY; c.lineTo(x, y);
        if (k === 3 || k === 5) { const bb = b + (R1(i + k) < 0.5 ? 0.8 : -0.8); c.moveTo(x, y); c.lineTo(x + Math.cos(bb) * L * 0.18, y + Math.sin(bb) * L * 0.18 * H.GY); c.moveTo(x, y); } }
      c.globalAlpha = 0.35 * a; c.strokeStyle = P.blue; c.lineWidth = 3; c.stroke(); c.globalAlpha = 0.8 * a; c.strokeStyle = P.pale; c.lineWidth = 1.2; c.stroke(); } c.restore(); }
  /* a glassy frozen pool on the floor: a pale translucent sheen, a cyan rim, glints (light only, fades) */
  function frozenPool(c, X, Y, r, a, t) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22 * a; c.fillStyle = P.ice; H.floorEllipse(c, X, Y, r); c.fill(); c.globalAlpha = 0.5 * a; c.strokeStyle = P.cyan; c.lineWidth = 1.5; H.floorEllipse(c, X, Y, r); c.stroke(); c.restore(); floorLight(c, X, Y, r * 1.1, 0.35 * a, P.pale);
    for (let i = 0; i < 4; i++) { const b = i * 1.7 + (t || 0) * 0.2, rr = r * (0.3 + 0.15 * i); glow(c, X + Math.cos(b) * rr, Y + Math.sin(b) * rr * H.GY, 4, P.white, 0.5 * a * (0.5 + 0.5 * Math.sin((t || 0) * 3 + i))); } }
  /* a low skirt of freezing mist round (X, Y) */
  function mist(c, X, Y, r, a, t) { if (!(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + (t || 0) * 0.4, x = X + Math.cos(b) * r * 0.8, y = Y + Math.sin(b) * r * 0.8 * H.GY; c.globalAlpha = 0.18 * a; blitSized(c, glowSprite(P.frost), x - r * 0.6, y - r * 0.3, r * 1.2, r * 0.6); } c.restore(); }
  /* particles (world units): snow, glittering fragments, frost sparks */
  const snow = (x, y, k, o) => H.burst(x, y, 'ember', k, Object.assign({ v: 1.2, up: 0.6, g: 0.8, life: 1.2, size: 2.6, color: [P.white, P.frost, P.pale] }, o || {}));
  const glitter = (x, y, k, v, o) => H.burst(x, y, 'spark', k, Object.assign({ v: v || 5, up: 2, g: 7, life: 0.55, size: 2, color: [P.white, P.cyan, P.pale, P.lav] }, o || {}));
  const fragments = (x, y, k, v) => H.burst(x, y, 'shard', k, { v: v || 5, up: 3, g: 10, life: 0.7, size: 3.2, color: [P.pale, P.ice, P.frost, P.blue] });
  /* the frozen air round a thing: call from update(dt) with a rate per second */
  function aura(x, y, r, dt, rate, z) { const k = (rate || 10) * dt * H.Q(); let m = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (m-- > 0) { const b = Math.random() * TAU, rr = Math.sqrt(Math.random()) * (r || 0.6); H.P({ kind: Math.random() < 0.7 ? 'ember' : 'spark', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * 0.6 - (z || 0), vx: (Math.random() - 0.5) * 1.2, vy: -0.4 - Math.random() * 0.8, g: 0.2, drag: 0.8, life: 0.6 + Math.random() * 0.6, max: 1.2, size: 1.6 + Math.random() * 1.8, color: Math.random() < 0.5 ? P.white : Math.random() < 0.6 ? P.pale : P.cyan }); } }
  /* an icy hit: light, glitter, fragments, snow */
  function shatterAt(x, y, r) { H.X.light(x, y, r * 1.6, 0.22); glitter(x, y, 10, 5); fragments(x, y, 6); snow(x, y, 6); H.glowAt(x, y, r * 0.8, 0.25, P.cyan, 0.6); }
  const evo = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const evoN = (C, a, b) => Math.round(a + (b - a) * (evo(C) - 1) / 6);
  const lv = (C, L) => { const e = evo(C); return e >= 7 ? L[2] : e >= 4 ? L[1] : L[0]; };
  const evoK = C => 1 + 0.08 * (evo(C) - 1);
  const K = { P, TAU, R1, glow, floorLight, shard, crystal, iceRing, frostVeins, frozenPool, mist, snow, glitter, fragments, aura, shatterAt, evo, evoN, lv, evoK };
  return { bind: h => { H = h; return K; }, P };
})();
