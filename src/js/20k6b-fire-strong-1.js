/* ---------- Fire, reworked: Ember Koi, Cinder Fan, Furnace Seed, Molten Lash, Phoenix Talon ----------
   The first five fire Strongs drawn to the Spike Bloom standard with the fire kit (FK): shaded koi of flame with lit
   backs, scaled flanks, flame fins and ribbon tails; a fan of volumetric tongues over a glowing sheet; a lumpy coal with a
   four-tone crust, glowing seams, a rim of reflected fire and an outline; a molten whip with crust plates over a white-hot
   core; phoenix claws of curved flame that leave molten grooves and raise shaded feathers. Every burning thing lights the
   floor and sheds embers; hits leave scorch marks, shock rings, sparks, flakes and smoke; things gather, strike and cool.
   Anything round the pet is drawn behind it (drawUnder) on its far side and in front only on its near side. */
(() => {
  const S = ELEM_IMPL.fire.strong, TAU = Math.PI * 2, P = FK.P;
  let H, K;
  const bind = h => { H = h; K = FK.bind(h); return K; };
  const cl = u => Math.max(0, Math.min(1, u));
  /* a flame pointing along a screen angle (solo: no lesser tongues behind it) */
  function flameDir(c, x, y, ang, w, h, t, seed, a, solo) { c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); K.flame(c, 0, 0, w, h, t, seed, Math.sin(t * 8 + seed) * w * 0.18, a, solo); c.restore(); }
  /* heat shimmer: faint rising wavy lines, additive */
  function shimmer(c, X, Y, r, h, t, a) { if (!(a > 0.02)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 * a; c.strokeStyle = P.wht; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const ox = (i - 1) * r * 0.5, ph = t * 5 + i * 2; c.beginPath(); for (let j = 0; j <= 6; j++) { const u = j / 6, px = X + ox + Math.sin(ph + u * 7) * r * 0.12, py = Y - u * h - ((t * 0.6 + i * 0.3) % 1) * h * 0.2; j ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); } c.restore(); }
  /* layered molten bands along a polyline (no flames): dark edge to white core */
  function bands(c, pts, w, a, taper) { if (pts.length < 2) return; c.save(); c.globalAlpha = a; H.ribbon(c, pts, w * 1.15, H.rgba(P.dred, 0.75), null, taper); H.ribbon(c, pts, w * 0.9, P.red, null, taper); H.ribbon(c, pts, w * 0.66, P.org, null, taper); c.globalCompositeOperation = 'lighter'; H.ribbon(c, pts, w * 0.38, H.rgba(P.yel, 0.9), null, taper); H.ribbon(c, pts, w * 0.13, P.wht, null, taper); c.restore(); }
  /* the outline of a lumpy rock */
  function lump(c, x, y, r, seed, sq) { c.beginPath(); for (let i = 0; i <= 14; i++) { const b = i / 14 * TAU, k = 1 + 0.08 * Math.sin(b * 3 + seed) + 0.05 * Math.sin(b * 5 + seed * 2.3), px = x + Math.cos(b) * r * k, py = y + Math.sin(b) * r * k * (sq || 1); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); }
  /* a molten coal: a four-tone crust lit from the upper left, a lit facet, seams glowing with heat (0..1), a hot heart,
     a rim of reflected fire on the shaded side, the outline and a dull specular */
  function coal(c, x, y, r, heat, t, seed, nSeam, rot, gl) {
    if (r < 1) return; seed = seed || 0; rot = rot || 0; const fl = 0.85 + 0.15 * Math.sin(t * 11 + seed);
    if (gl !== false) K.glow(c, x, y, r * (1.6 + heat), P.org, (0.2 + 0.45 * heat) * fl);
    c.save(); lump(c, x, y, r, seed);
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r * 1.05); g.addColorStop(0, '#C98A62'); g.addColorStop(0.3, P.crustL); g.addColorStop(0.68, P.crust); g.addColorStop(1, P.char); c.fillStyle = g; c.fill();
    c.save(); c.clip();
    c.fillStyle = 'rgba(255,214,170,0.16)'; c.beginPath(); c.moveTo(x - r, y - r * 0.05); c.lineTo(x - r * 0.2, y - r); c.lineTo(x + r * 0.12, y - r * 0.25); c.lineTo(x - r * 0.3, y + r * 0.2); c.closePath(); c.fill();
    c.fillStyle = 'rgba(20,6,4,0.28)'; c.beginPath(); c.moveTo(x + r * 0.15, y + r); c.lineTo(x + r, y - r * 0.1); c.lineTo(x + r, y + r); c.closePath(); c.fill();
    const n = nSeam || 4, wd = Math.max(1.4, r * (0.08 + 0.12 * heat)); c.lineCap = 'round'; c.lineJoin = 'round';
    const seams = []; for (let i = 0; i < n; i++) { const b = rot + i / n * TAU + seed * 0.7 + Math.sin(i * 2.3 + seed) * 0.35, j = Math.sin(i * 4.1 + seed) * 0.4; seams.push([[x + Math.cos(b) * r * 0.1, y + Math.sin(b) * r * 0.1], [x + Math.cos(b + j) * r * 0.5, y + Math.sin(b + j) * r * 0.5], [x + Math.cos(b - j * 0.4) * r * 1.05, y + Math.sin(b - j * 0.4) * r * 1.05], [x + Math.cos(b + j) * r * 0.5 + Math.cos(b + 1.4) * r * 0.3, y + Math.sin(b + j) * r * 0.5 + Math.sin(b + 1.4) * r * 0.3]]); }
    const path = s => { c.beginPath(); c.moveTo(s[0][0], s[0][1]); c.lineTo(s[1][0], s[1][1]); c.lineTo(s[2][0], s[2][1]); c.moveTo(s[1][0], s[1][1]); c.lineTo(s[3][0], s[3][1]); };
    c.strokeStyle = P.char; c.lineWidth = wd * 1.7; for (const s of seams) { path(s); c.stroke(); }
    if (heat > 0.02) { c.globalCompositeOperation = 'lighter'; for (const s of seams) { path(s); c.strokeStyle = H.rgba(P.red, heat * fl); c.lineWidth = wd * 1.1; c.stroke(); c.strokeStyle = H.rgba(P.org, heat * fl); c.lineWidth = wd * 0.75; c.stroke(); c.strokeStyle = H.rgba(P.yel, heat * fl * 0.9); c.lineWidth = wd * 0.4; c.stroke(); if (heat > 0.65) { c.strokeStyle = H.rgba(P.wht, (heat - 0.65) * 2.4); c.lineWidth = wd * 0.15; c.stroke(); } }
      K.glow(c, x, y, r * 0.8, P.yel, heat * heat * 0.45 * fl); }
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.3 + 0.45 * heat); c.lineWidth = Math.max(1, r * 0.12); c.beginPath(); c.arc(x + r * 0.04, y + r * 0.04, r * 0.9, -0.5, 1.2); c.stroke();
    c.restore();
    lump(c, x, y, r, seed); c.strokeStyle = H.line(); c.lineWidth = 1.6; c.stroke();
    c.fillStyle = 'rgba(255,238,215,0.38)'; c.beginPath(); c.ellipse(x - r * 0.38, y - r * 0.46, r * 0.17, r * 0.09, -0.6, 0, TAU); c.fill();
    c.restore();
  }
  /* a koi of flame, s px long, swimming along a screen angle: forked flame tail, a flame dorsal fin, lit back, scaled
     flanks shading to a dark red belly, a gill line, barbels, an eye with a glint; the lit side always kept on top */
  function koi(c, x, y, ang, s, t, seed, a) {
    if (!(a > 0.02)) return; const flip = Math.cos(ang) < 0 ? -1 : 1, L = s, W = s * 0.42, sw = Math.sin(t * 12 + seed) * 0.28;
    K.glow(c, x, y, L * 0.95, P.org, 0.55 * a);
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(1, flip); c.globalAlpha = a;
    for (const sd of [-1, 1]) flameDir(c, -L * 0.33, sd * W * 0.08, Math.PI + sd * 0.5 + sw, W * 0.6, L * 0.78 * (0.85 + 0.15 * Math.sin(t * 15 + sd + seed)), t, seed + sd * 2, 0.95 * a, true);
    flameDir(c, -L * 0.02, -W * 0.36, -Math.PI / 2 - 0.75, W * 0.55, L * 0.42, t, seed + 5, 0.9 * a, true);
    // the pectoral fin underneath, a shaded leaf
    c.save(); c.translate(L * 0.14, W * 0.3); c.rotate(0.9 + Math.sin(t * 10 + seed) * 0.25); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-L * 0.1, W * 0.35, -L * 0.28, W * 0.18); c.quadraticCurveTo(-L * 0.12, W * 0.02, 0, 0); const gf = c.createLinearGradient(0, 0, -L * 0.28, W * 0.18); gf.addColorStop(0, P.amb); gf.addColorStop(1, H.rgba(P.red, 0.6)); c.fillStyle = gf; c.fill(); c.strokeStyle = H.rgba(P.dred, 0.7); c.lineWidth = 1; c.stroke(); c.restore();
    const body = () => { c.beginPath(); c.moveTo(L * 0.5, W * 0.04); c.bezierCurveTo(L * 0.46, -W * 0.55, L * 0.02, -W * 0.62, -L * 0.38, -W * 0.12); c.quadraticCurveTo(-L * 0.45, 0, -L * 0.38, W * 0.12); c.bezierCurveTo(L * 0.02, W * 0.6, L * 0.46, W * 0.52, L * 0.5, W * 0.04); c.closePath(); };
    body(); const g = c.createLinearGradient(0, -W * 0.55, 0, W * 0.55); g.addColorStop(0, P.wht); g.addColorStop(0.2, P.yel); g.addColorStop(0.45, P.amb); g.addColorStop(0.72, P.red); g.addColorStop(1, P.dred); c.fillStyle = g; c.fill();
    c.save(); c.clip();
    const gt = c.createLinearGradient(L * 0.5, 0, -L * 0.45, 0); gt.addColorStop(0, 'rgba(0,0,0,0)'); gt.addColorStop(0.55, 'rgba(0,0,0,0)'); gt.addColorStop(1, H.rgba(P.dred, 0.55)); c.fillStyle = gt; c.fillRect(-L * 0.5, -W, L, W * 2);
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.42); c.lineWidth = Math.max(0.8, L * 0.025); for (let i = 0; i < 4; i++) for (let j = -1; j <= 1; j++) { const sx = L * (0.18 - i * 0.14) + (j & 1) * L * 0.07, sy = j * W * 0.22; c.beginPath(); c.arc(sx, sy, W * 0.16, -1.2, 1.2); c.stroke(); }
    c.strokeStyle = H.rgba(P.wht, 0.55); c.lineWidth = Math.max(1, W * 0.1); c.beginPath(); c.moveTo(L * 0.36, -W * 0.3); c.quadraticCurveTo(0, -W * 0.5, -L * 0.3, -W * 0.14); c.stroke();
    c.restore();
    body(); c.strokeStyle = 'rgba(70,16,6,0.85)'; c.lineWidth = 1.4; c.stroke();
    c.strokeStyle = H.rgba(P.dred, 0.7); c.lineWidth = 1.2; c.beginPath(); c.arc(L * 0.36, 0, W * 0.32, -1.1, 1.1); c.stroke();
    c.strokeStyle = H.rgba(P.yel, 0.85); c.lineWidth = 1; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(L * 0.49, W * 0.08 * sd + W * 0.08); c.quadraticCurveTo(L * 0.62, W * 0.15 * sd + W * 0.25, L * 0.58 + Math.sin(t * 9 + sd + seed) * L * 0.05, W * 0.5 * sd + W * 0.2); c.stroke(); }
    c.fillStyle = '#2A1008'; c.beginPath(); c.arc(L * 0.33, -W * 0.14, Math.max(1.4, W * 0.11), 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(L * 0.345, -W * 0.17, Math.max(0.6, W * 0.04), 0, TAU); c.fill();
    c.restore();
  }
  /* a phoenix feather, len px along a screen angle: a vane lit on one side, a white rachis, barbs, a dark outline, a hot tip */
  function feather(c, x, y, ang, len, w, t, seed, a) {
    if (!(a > 0.02) || len < 2) return; c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = a; const cu = Math.sin(t * 7 + seed) * w * 0.4;
    K.glow(c, len * 0.55, 0, len * 0.55, P.org, 0.45 * a);
    const vane = () => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(len * 0.25, -w * 0.95, len * 0.72, -w * 0.85, len, cu); c.bezierCurveTo(len * 0.72, w * 0.6, len * 0.3, w * 0.75, 0, 0); c.closePath(); };
    vane(); const g = c.createLinearGradient(0, -w * 0.8, 0, w * 0.7); g.addColorStop(0, P.yel); g.addColorStop(0.35, P.amb); g.addColorStop(0.65, P.org); g.addColorStop(1, P.red); c.fillStyle = g; c.fill();
    c.save(); c.clip(); const g2 = c.createLinearGradient(0, 0, len, 0); g2.addColorStop(0, H.rgba(P.dred, 0.5)); g2.addColorStop(0.35, 'rgba(0,0,0,0)'); g2.addColorStop(0.85, 'rgba(0,0,0,0)'); g2.addColorStop(1, H.rgba(P.dred, 0.45)); c.fillStyle = g2; c.fillRect(0, -w, len, w * 2);
    c.strokeStyle = H.rgba(P.dred, 0.45); c.lineWidth = 0.9; for (let i = 1; i < 6; i++) { const u = i / 6; c.beginPath(); c.moveTo(len * u, cu * u); c.lineTo(len * (u + 0.1), -w); c.moveTo(len * u, cu * u); c.lineTo(len * (u + 0.1), w); c.stroke(); } c.restore();
    vane(); c.strokeStyle = 'rgba(80,18,8,0.85)'; c.lineWidth = 1.1; c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.wht, 0.85); c.lineWidth = Math.max(1, w * 0.14); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, cu * 0.3, len * 0.95, cu); c.stroke();
    K.glow(c, len, cu, w * 1.4, P.yel, 0.7 * a);
    c.restore();
  }
  /* a curved claw blade of flame, tip pointing along +x in the current transform */
  function claw(c, len, w, a) { c.beginPath(); c.moveTo(-len * 0.5, -w * 0.5); c.quadraticCurveTo(len * 0.1, -w * 1.1, len * 0.5, w * 0.3); c.quadraticCurveTo(len * 0.05, -w * 0.1, -len * 0.5, w * 0.5); c.closePath(); const g = c.createLinearGradient(-len * 0.5, 0, len * 0.5, 0); g.addColorStop(0, H.rgba(P.red, 0.5 * a)); g.addColorStop(0.45, H.rgba(P.org, a)); g.addColorStop(0.8, H.rgba(P.yel, a)); g.addColorStop(1, H.rgba(P.wht, a)); c.fillStyle = g; c.fill(); c.strokeStyle = H.rgba(P.dred, 0.8 * a); c.lineWidth = 1.2; c.stroke(); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.wht, 0.8 * a); c.lineWidth = Math.max(1, w * 0.18); c.beginPath(); c.moveTo(-len * 0.3, -w * 0.55); c.quadraticCurveTo(len * 0.12, -w * 0.85, len * 0.45, w * 0.2); c.stroke(); c.restore(); }
  /* a burst of spiralling embers (world units) */
  function spiralEmbers(x, y, k, i) { for (let j = 0; j < H.n(k); j++) { const b = j / k * TAU * 1.5 + (i || 0) * 0.4; H.P({ kind: 'ember', x: x + Math.cos(b) * j * 0.05, y: y + Math.sin(b) * j * 0.05 - 0.4, vx: Math.cos(b + 1.2) * (2 + j * 0.3), vy: Math.sin(b + 1.2) * (1.5 + j * 0.2) - 1.5, g: -1, life: 0.7, max: 0.7, size: 4, color: j % 3 ? P.org : j % 2 ? P.yel : P.gold }); } }

  /* ================= F-S01 Ember Koi =================
     Koi of flame materialise from embers and circle you (behind you on the far side), then swim to the target on mirrored
     curves, one after another, each landing a spiral burst that unwinds, scorches and fades.
     Evolution: 2 koi at Hatchling to 6 at Celestial (damage split, about evoK in total); bigger koi; at Celestial a great
     koi leaps out of the last burst and dives back for a finale. */
  S.emberkoi = (C, h) => {
    bind(h); const me = H.me, tx = C.tx, ty = C.ty, E = K.evo(C), CEL = E >= 7, n = K.evoN(C, 2, 6), sz = 1 + 0.05 * (E - 1), tot = C.base * 2.4 * C.K * K.evoK(C), finK = CEL ? 0.25 : 0, per = tot * (1 - finK) / n, step = Math.min(0.14, 0.36 / Math.max(1, n - 1));
    const fish = []; for (let i = 0; i < n; i++) fish.push({ i, ph: i / n * TAU, x: me.x, y: me.y, z: 0.7, ang: 0, fly: false, hit: false, side: i % 2 ? 1 : -1, bk: 0.55 + 0.45 * (((i >> 1) + 1) / Math.ceil(n / 2)), t0: 0.5 + i * step, back: false });
    const bursts = []; let fin = null; H.X.sfx.whoosh(); me.sq = 0.75;
    const lastHit = 0.5 + (n - 1) * step + 0.42, ORX = 1.3, ORY = 0.95;
    /* where a koi is at time ft (world x, y and height z): circling you, low in front and high behind, then swimming out */
    const orbit = (s, ft) => { const b = s.ph + ft * 6.5; return [me.x + Math.cos(b) * ORX, me.y + Math.sin(b) * ORY, 0.62 - 0.3 * Math.sin(b) + 0.12 * Math.sin(ft * 5 + s.i), Math.sin(b) < 0]; };
    const pos = (s, ft) => { if (ft < s.t0) return orbit(s, ft); const o = s.o0 || orbit(s, s.t0), u = Math.min(1, (ft - s.t0) / 0.42), e = H.ease.io(u), dx = tx - o[0], dy = ty - o[1], d = Math.hypot(dx, dy) || 1, px = -dy / d, py = dx / d, bulge = Math.sin(u * Math.PI) * s.side * s.bk * Math.min(1.7, d * 0.38); return [o[0] + dx * e + px * bulge, o[1] + dy * e + py * bulge, o[2] * (1 - u) + 0.35 * u + Math.sin(u * Math.PI) * 0.9, false]; };
    H.add({ life: lastHit + (CEL ? 1.45 : 0.85), update(dt, f) {
        for (const s of fish) { if (s.hit) continue; const q = pos(s, f.t); s.x = q[0]; s.y = q[1]; s.z = q[2]; s.back = q[3];
          if (f.t < s.t0) { if (f.t < 0.25 && Math.random() < 0.7 * H.Q()) H.P({ kind: 'ember', x: s.x + (Math.random() - 0.5) * 1.2, y: s.y - s.z + (Math.random() - 0.5) * 0.8, vx: (s.x - me.x) * -0.5, vy: -0.4, g: 0, life: 0.3, max: 0.3, size: 3, color: P.gold }); }
          else { if (!s.fly) { s.fly = true; s.o0 = orbit(s, s.t0); H.X.sfx.whoosh(); K.sparks(s.x, s.y - s.z, 4, 3); }
            if (f.t - s.t0 >= 0.42) { s.hit = true; const last = fish.every(q => q.hit); H.hitArea(tx, ty, 1.25, per, C.dmgO({ kb: last ? 3 : 1, burn: 1 })); spiralEmbers(tx, ty, 14, s.i); K.ignite(tx, ty, 1.2); K.flakes(tx, ty, 4); bursts.push({ t: f.t, i: s.i, big: last });
              if (last) { K.blast(tx, ty, 1.3, 1); H.X.sfx.crash(); if (CEL) fin = { t: f.t + 0.18, hit: false }; } else { H.X.ring(tx, ty, 0.2, 1.2, 0.3, P.org, 0.4); H.X.sfx.thud(); H.X.shake(2, 0.06); } } }
          K.aura(s.x, s.y, 0.25, dt, 10, s.z); }
        if (bursts.length) { const b = bursts[bursts.length - 1]; if (f.t - b.t < 0.7) K.aura(tx, ty, 0.9, dt, 14); }
        if (fin && !fin.hit && f.t >= fin.t + 0.6) { fin.hit = true; H.hitArea(tx, ty, 1.8, tot * finK, C.dmgO({ kb: 4, burn: 1 })); K.blast(tx, ty, 1.8, 1.6); spiralEmbers(tx, ty, 20, 7); H.X.sfx.crash(); bursts.push({ t: f.t, i: 9, big: true, fin: true }); }
        if (fin && f.t > fin.t && f.t < fin.t + 0.6) K.aura(tx, ty - 0.2, 0.4, dt, 18, 1.2 * Math.sin((f.t - fin.t) / 0.6 * Math.PI)); },
      drawFish(c, f, T, t, back) { for (const s of fish) { if (s.hit || s.back !== back) continue; const scr = q => [H.sx(q[0]), H.sy(q[1]) - q[2] * T], X = H.sx(s.x), Y = H.sy(s.y), hd = scr([s.x, s.y, s.z]), pv = scr(pos(s, Math.max(0, f.t - 0.03))), a = cl(f.t / 0.25); let ang = s.ang || 0; if (Math.hypot(hd[0] - pv[0], hd[1] - pv[1]) > 0.5) ang = s.ang = Math.atan2(hd[1] - pv[1], hd[0] - pv[0]);
          K.floorLight(c, X, Y, T * 0.6, 0.3 * a); H.softShadow(c, X, Y, T * 0.3, 0.2 * a);
          const pts = []; for (let j = 9; j >= 0; j--) { const ft = f.t - j * 0.024; if (ft >= 0) pts.push(scr(pos(s, ft))); } if (pts.length > 2) bands(c, pts, T * 0.2 * sz, 0.85 * a, u => 0.12 + 0.88 * u);
          koi(c, hd[0], hd[1], ang, T * 0.74 * sz, t, s.i * 2.7, a); } },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.6), PX = H.sx(tx), PY = H.sy(ty);
        if (f.t < lastHit) K.floorLight(c, H.sx(me.x), H.sy(me.y), T * 1.5, 0.25 * cl(f.t / 0.3));
        for (const b of bursts) { const age = f.t - b.t, r = T * (b.fin ? 1.8 : b.big ? 1.3 : 1.0); K.scorch(c, PX, PY, r * 0.8 * Math.min(1, age / 0.15 + 0.3), k, Math.max(0, 1 - age / 1.1), b.i); if (age < 0.4) K.shockRing(c, PX, PY, r * (0.3 + 1.0 * H.ease.out(age / 0.4)), 1 - age / 0.4); }
        this.drawFish(c, f, T, t, true); },
      draw(c, f, X, Y, T, t) { this.drawFish(c, f, T, t, false); const PX = H.sx(tx), PY = H.sy(ty);
        for (const b of bursts) { const age = f.t - b.t, D = b.fin ? 0.8 : 0.6; if (age > D) continue; const u = age / D, R = T * (b.fin ? 1.5 : b.big ? 1.15 : 0.85), pts = []; for (let j = 0; j <= 18; j++) { const v = j / 18, ang = b.i * 1.3 + v * TAU * 1.4 + u * 5 * (b.i % 2 ? -1 : 1), r = R * (0.12 + v * (0.5 + 0.6 * u)); pts.push([PX + Math.cos(ang) * r, PY - T * 0.35 + Math.sin(ang) * r * 0.6]); } bands(c, pts, T * 0.2 * (1 - u * 0.6), 1 - u, v => Math.sin(v * Math.PI) * 0.8 + 0.2);
          if (age < 0.35) { if (b.big) K.fireball(c, PX, PY - T * 0.4, T * (b.fin ? 0.4 : 0.3) * (1 - age / 0.35), t, b.i, 1 - age / 0.35); else H.core(c, PX, PY - T * 0.4, T * 0.3 * (1 - age / 0.35), P.org, P.wht, 1 - age / 0.35); } shimmer(c, PX, PY - T * 0.6, T, T * 1.2, t, 1 - u); }
        if (fin && f.t > fin.t && f.t < fin.t + 0.6) { const u = (f.t - fin.t) / 0.6, z = Math.sin(u * Math.PI) * 2.2, ang = u < 0.5 ? -Math.PI / 2 + 0.6 : Math.PI / 2 + 0.6, gx = PX + (u - 0.5) * T * 1.4; K.floorLight(c, PX, PY, T * 1.8, 0.5); bands(c, [[PX - T * 0.3, PY - T * 0.2], [gx - T * 0.2, PY - z * T * 0.6], [gx, PY - z * T - T * 0.3]], T * 0.35, 0.8, v => 0.2 + 0.8 * v); koi(c, gx, PY - z * T - T * 0.3, ang + (u - 0.5) * 1.6, T * 1.25, t, 11, cl(u * 6) * cl((1 - u) * 6 + 0.4)); }
      } });
  };

  /* ================= F-S02 Cinder Wave =================
     Flames gather in a low ring at your feet, then a wall of fire rolls out all round you over the floor: a glowing crest
     of soft volumetric tongues leaning outward, a white-hot leading edge, a dark smouldering wake behind it, light sweeping
     over the floor, embers and sparks thrown forward; it leaves a scorched ring that cools. It never covers you: its far
     side is drawn behind you and its near side stays low until it has rolled clear.
     Evolution: 1 wave at Hatchling, 2 from stage 4, 3 bigger and faster waves at Celestial, the last breaking into a ring
     of fire pillars at its rim (damage split over the waves, about evoK in total, a little more at Celestial). */
  S.cinderfan = (C, h) => {
    bind(h); const me = H.me, E = K.evo(C), CEL = E >= 7, NW = CEL ? 3 : E >= 4 ? 2 : 1, x0 = me.x, y0 = me.y, WIND = 0.22, R0 = 0.8, tot = C.base * 2.4 * C.K * K.evoK(C) * (CEL ? 1.1 : 1);
    const waves = []; for (let i = 0; i < NW; i++) { const last = CEL && i === NW - 1; waves.push({ i, t0: WIND + i * (CEL ? 0.26 : 0.34), dur: CEL ? 0.48 : 0.58, R: (3.0 + 0.1 * (E - 1)) * (last ? 1.15 : 1) + i * 0.2, hk: (0.95 + 0.04 * (E - 1)) * (last ? 1.25 : 1), nf: NW === 1 ? 18 : NW === 2 ? 16 : 14, hits: new Set(), last, prev: R0, dmg: tot / NW, done: false }); }
    const LW = waves[NW - 1], END = LW.t0 + LW.dur, PIL = 12;
    const rad = (w, ft) => { const u = cl((ft - w.t0) / w.dur); return { u, r: R0 + (w.R - R0) * H.ease.out(u) }; };
    me.sq = 0.6; H.X.sfx.whoosh();
    H.add({ life: END + (CEL ? 1.4 : 1.0), x: x0, y: y0, pil: false, update(dt, f) {
        if (f.t < WIND) { if (Math.random() < 1.2 * H.Q()) { const b = Math.random() * TAU, r = 1.6 + Math.random() * 0.6; H.P({ kind: 'ember', x: x0 + Math.cos(b) * r, y: y0 + Math.sin(b) * r, vx: -Math.cos(b) * 6, vy: -Math.sin(b) * 6, g: 0, life: 0.2, max: 0.2, size: 3, color: Math.random() < 0.5 ? P.yel : P.gold }); } K.aura(x0, y0, R0, dt, 14); return; }
        for (const w of waves) { if (f.t < w.t0) continue; const { u, r } = rad(w, f.t);
          if (u < 1) { for (const m of H.living()) { if (w.hits.has(m)) continue; const d = Math.hypot(m.x - x0, m.y - y0); if (d - m.r < r + 0.25 && d + m.r > w.prev - 0.4) { w.hits.add(m); H.X.hitMon(m, w.dmg, C.dmgO({ kb: 3, burn: 1 })); K.ignite(m.x, m.y, 0.6); } }
            const kk = H.Q() * dt * (30 + r * 8); let n = Math.floor(kk) + (Math.random() < kk % 1 ? 1 : 0); while (n-- > 0) { const b = Math.random() * TAU, px = x0 + Math.cos(b) * r, py = y0 + Math.sin(b) * r; if (Math.random() < 0.65) H.P({ kind: 'ember', x: px, y: py - 0.3, vx: Math.cos(b) * 3.5, vy: Math.sin(b) * 2.5 - 1.5, g: -0.6, drag: 0.8, life: 0.6, max: 0.6, size: 3, color: Math.random() < 0.5 ? P.yel : P.org }); else H.P({ kind: 'spark', x: px, y: py - 0.4, vx: Math.cos(b) * 6, vy: Math.sin(b) * 4 - 3, g: 8, life: 0.4, max: 0.4, size: 1.8, color: P.wht }); } }
          else if (!w.done) { w.done = true; for (let i = 0; i < 4; i++) { const b = i / 4 * TAU + w.i; K.smoke(x0 + Math.cos(b) * w.R, y0 + Math.sin(b) * w.R, 1, 0.3); } }
          w.prev = r; }
        if (CEL && !f.pil && f.t >= END) { f.pil = true; H.X.shake(5, 0.15); H.X.sfx.crash(); for (let i = 0; i < PIL; i += 2) { const b = i / PIL * TAU; K.sparks(x0 + Math.cos(b) * LW.R, y0 + Math.sin(b) * LW.R, 3, 5); } }
        if (f.t > END && f.t < END + 1.0) for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + f.t; K.aura(x0 + Math.cos(b) * LW.R * 0.95, y0 + Math.sin(b) * LW.R * 0.95, 0.3, dt, 2.5); } },
      /* the rolling wall: one half (far or near) of every wave, the crest band, then the tongues sorted far to near */
      wall(c, f, T, t, back) { const X = H.sx(x0), Y = H.sy(y0);
        if (f.t < WIND + 0.12) { const u = cl(f.t / WIND), k = f.t > WIND ? 1 - (f.t - WIND) / 0.12 : 1, L = []; for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.3; if ((Math.sin(b) < 0) === back) L.push(b); } L.sort((p, q) => Math.sin(p) - Math.sin(q)); for (const b of L) K.flame(c, X + Math.cos(b) * R0 * T, Y + Math.sin(b) * R0 * T * H.GY, T * 0.26, T * (back ? 0.55 : 0.3) * u * (0.8 + 0.2 * Math.sin(t * 9 + b * 3)), t, b * 5, Math.cos(b) * T * 0.1, k, true); }
        for (const w of waves) { if (f.t < w.t0) continue; const { u, r } = rad(w, f.t), k = u < 1 ? cl(u * 6) : cl(1 - (f.t - w.t0 - w.dur) / 0.25); if (k <= 0) continue;
          const R = r * T, hh = T * w.hk * (1 - 0.3 * u), low = b => back ? 1 : cl((r - 0.9) / 0.8 + Math.abs(Math.cos(b)) * 0.9), pts = [];
          // the sheet of the wall: stacked arcs from a hot yellow foot to dark red at its top, then the tongues on its crest
          c.save(); c.lineCap = 'round'; const LAY = [[P.yel, 0.75, 'lighter'], [P.amb, 0.7, 'lighter'], [P.org, 0.75, 'source-over'], [P.red, 0.6, 'source-over'], [P.dred, 0.35, 'source-over']];
          for (let i = 0; i < LAY.length; i++) { const [col, al, op] = LAY[LAY.length - 1 - i], lv = (LAY.length - 1 - i) / LAY.length; c.globalCompositeOperation = op; c.strokeStyle = H.rgba(col, al * k); c.lineWidth = Math.max(2, hh * 0.2); c.beginPath(); for (let j = 0; j <= 24; j++) { const bb = (back ? Math.PI : 0) + j / 24 * Math.PI, px = X + Math.cos(bb) * R, py = Y + Math.sin(bb) * R * H.GY - hh * 0.5 * lv * low(bb) - hh * 0.06; j ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
          c.restore();
          const L = []; for (let j = 0; j < w.nf; j++) { const b = j / w.nf * TAU + w.i * 0.37 + u * 0.4; if ((Math.sin(b) < 0) === back) L.push([b, j]); } L.sort((p, q) => Math.sin(p[0]) - Math.sin(q[0]));
          for (const [b, j] of L) { const px = X + Math.cos(b) * R, py = Y + Math.sin(b) * R * H.GY - hh * 0.25 * low(b), fh = hh * low(b) * (0.8 + 0.3 * Math.sin(t * 7 + j * 1.9)); if (fh < 2) continue; K.flame(c, px, py, T * (0.3 + 0.08 * r), fh, t, j * 1.7 + w.i * 5, Math.cos(b) * T * 0.35, k * 0.95, true); } }
        if (CEL && f.t > END && f.t < END + 0.6) { const u = (f.t - END) / 0.6, env = u < 0.2 ? H.ease.out(u / 0.2) : 1 - H.ease.in((u - 0.2) / 0.8), L = []; for (let i = 0; i < PIL; i++) { const b = i / PIL * TAU + 0.13; if ((Math.sin(b) < 0) === back) L.push([b, i]); } L.sort((p, q) => Math.sin(p[0]) - Math.sin(q[0]));
          for (const [b, i] of L) K.flame(c, X + Math.cos(b) * LW.R * T, Y + Math.sin(b) * LW.R * T * H.GY, T * 0.42, T * 1.7 * env * (0.8 + 0.2 * Math.sin(i * 2.3)), t, 40 + i, Math.cos(b) * T * 0.2, cl(env * 1.5), true); } },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.5);
        if (f.t < WIND + 0.1) K.floorLight(c, X, Y, T * 1.4, 0.45 * cl(f.t / WIND));
        for (const w of waves) { if (f.t < w.t0) continue; const { u, r } = rad(w, f.t), R = r * T, wk = u < 1 ? cl(u * 6) : cl(1 - (f.t - w.t0 - w.dur) / 0.25);
          if (wk > 0) { c.save(); c.translate(X, Y); c.scale(1, H.GY); c.beginPath(); c.arc(0, 0, R * 1.04, 0, TAU); c.arc(0, 0, Math.max(1, R * 0.35), 0, TAU, true);
            const g = c.createRadialGradient(0, 0, R * 0.35, 0, 0, R * 1.04); g.addColorStop(0, H.rgba(P.char, 0)); g.addColorStop(0.6, H.rgba(P.char, 0.38 * wk)); g.addColorStop(0.9, H.rgba(P.dred, 0.3 * wk)); g.addColorStop(1, H.rgba(P.char, 0)); c.fillStyle = g; c.fill();
            c.globalCompositeOperation = 'lighter'; const g2 = c.createRadialGradient(0, 0, R * 0.55, 0, 0, R * 1.04); g2.addColorStop(0, H.rgba(P.red, 0)); g2.addColorStop(0.75, H.rgba(P.red, 0.25 * wk)); g2.addColorStop(0.95, H.rgba(P.org, 0.6 * wk)); g2.addColorStop(1, H.rgba(P.yel, 0)); c.fillStyle = g2; c.fill(); c.restore();
            K.shockRing(c, X, Y, R * 1.02, 0.85 * wk); for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + w.i; K.floorLight(c, X + Math.cos(b) * R, Y + Math.sin(b) * R * H.GY, T * 0.9, 0.3 * wk); } }
          if (u >= 1) { const age = f.t - w.t0 - w.dur, heat = Math.max(0, 1 - age / 0.9); c.save(); c.globalAlpha = k * cl(age / 0.15 + 0.5); c.strokeStyle = H.rgba(P.char, 0.3); c.lineWidth = T * 0.45; H.floorEllipse(c, X, Y, w.R * T * 0.93); c.stroke(); if (heat > 0.02) { c.globalCompositeOperation = 'lighter'; c.setLineDash([T * 0.12, T * 0.22]); c.strokeStyle = H.rgba(P.org, 0.6 * heat); c.lineWidth = T * 0.07; c.stroke(); c.setLineDash([]); } c.restore(); } }
        this.wall(c, f, T, t, true); },
      draw(c, f, X, Y, T, t) { this.wall(c, f, T, t, false); } });
  };

  /* ================= F-S03 Furnace Seed =================
     Lumpy coals are lobbed to the aim trailing smoke; each lands with a thud and cracks as its heat builds, the seams
     widening, thin flames curling from them, a heartbeat of light quickening, glowing cracks racing out over the floor to
     its warned ring; then they erupt one after another, the last and greatest at the aim: a crowned pillar of fire, the
     shell flying out in glowing pieces, the ground left burning (H.fire) under a cooling scorch.
     Evolution: 1 seed at stages 1-2, then 2, 3, 4, 5 and 7 seeds at Celestial (a crown round the aim, open toward you,
     detonating in a ripple before the centre); a wider main blast (R 2.0 to 2.6) with more seams (damage split 40/60 when there are
     satellites, about evoK in total). */
  S.furnaceseed = (C, h) => {
    bind(h); const me = H.me, tx = C.tx, ty = C.ty, E = K.evo(C), NSD = [1, 1, 2, 3, 4, 5, 7][E - 1], nm = NSD - 1, R = 2.0 + 0.1 * (E - 1), FLY = 0.35, ERUPT = 1.25, SEAMS = K.evoN(C, 4, 7), tot = C.base * 2.5 * C.K * K.evoK(C), x0 = me.x, y0 = me.y;
    const pa = Math.atan2(y0 - ty, x0 - tx), seeds = []; for (let i = 0; i < nm; i++) { const b = pa + 0.8 + (i + 0.5) / nm * (TAU - 1.6), d = R * 0.95;   /* (round the aim, leaving a gap toward you) */ seeds.push({ x: tx + Math.cos(b) * d, y: ty + Math.sin(b) * d, main: false, r: 1.1, f0: 0.05 * (i + 1), er: ERUPT - 0.1 + i * 0.1, dmg: tot * 0.6 / nm, sz: 0.27, sd: i * 1.7 + 3, seams: 3 }); }
    seeds.push({ x: tx, y: ty, main: true, r: R, f0: 0, er: nm ? ERUPT + nm * 0.1 + 0.05 : ERUPT, dmg: tot * (nm ? 0.4 : 1), sz: 0.4, sd: 2, seams: SEAMS });
    const LAST = Math.max(...seeds.map(s => s.er)), frags = []; H.X.sfx.whoosh(); me.sq = 0.7;
    /* a seed in flight at time ft: world x, y and height */
    const fly = (s, ft) => { const u = cl((ft - s.f0) / FLY); return [x0 + (s.x - x0) * u, y0 + (s.y - y0) * u, 1.0 * (1 - u) + 0.4 * u + Math.sin(u * Math.PI) * (s.main ? 1.8 : 1.4), u]; };
    H.add({ life: LAST + 1.15, x: tx, y: ty, update(dt, f) {
        for (const s of seeds) { const lt = f.t - s.f0;
          if (lt < 0) continue; if (lt < FLY) { const q = fly(s, f.t); if (Math.random() < 0.6 * H.Q()) K.smoke(q[0], q[1] - q[2], 1, 0.1); }
          else if (f.t < s.er) { const heat = cl((f.t - s.f0 - FLY) / (s.er - s.f0 - FLY)); K.aura(s.x, s.y, 0.35 * s.sz / 0.4, dt, (s.main ? 6 + 26 * heat : 3 + 8 * heat), 0.45); if (s.main && Math.random() < heat * 0.25 * H.Q()) K.sparks(s.x, s.y - 0.5, 1, 4); }
          else { const ae = f.t - s.er; if (ae < 0.8) K.aura(s.x, s.y, s.r * 0.6, dt, (s.main ? 30 : 10) * (1 - ae / 0.8)); } }
        for (const p of frags) { if (p.down) continue; p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= 14 * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z <= 0) { p.z = 0; p.down = f.t; K.sparks(p.x, p.y, 2, 3); } } },
      under(c, s, f, T, t, k) { const X = H.sx(s.x), Y = H.sy(s.y), land = s.f0 + FLY; if (f.t < land) return;
        if (f.t < s.er) { const heat = cl((f.t - land) / (s.er - land)), beat = Math.pow(Math.max(0, Math.sin((f.t - land) * (7 + heat * 16) + s.sd)), 6), RR = s.main ? R : s.r;
          K.scorch(c, X, Y, T * 0.75 * (s.sz / 0.4) * cl((f.t - land) / 0.25), 1, heat * 0.7, s.sd); K.floorLight(c, X, Y, T * (0.7 + RR * 0.5 * heat), (0.25 + 0.45 * heat) * (0.7 + 0.3 * beat));
          c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; const nc = s.main ? SEAMS * 2 : 5; for (let i = 0; i < nc; i++) { const b = i / nc * TAU + 0.3 + s.sd + Math.sin(i * 3.3) * 0.2, len = RR * T * cl(heat * 1.25 - (i % 2) * 0.15) * (0.75 + 0.2 * Math.sin(i * 2.1)), r0 = T * 0.3 * s.sz / 0.4; if (len < 2) continue; c.beginPath(); c.moveTo(X + Math.cos(b) * r0, Y + Math.sin(b) * r0 * H.GY); for (let j = 1; j <= 4; j++) { const u = j / 4, bb = b + Math.sin(i * 7 + j * 3) * 0.12; c.lineTo(X + Math.cos(bb) * (r0 + len * u), Y + Math.sin(bb) * (r0 + len * u) * H.GY); } c.strokeStyle = H.rgba(P.char, 0.7); c.lineWidth = s.main ? 3 : 2; c.stroke(); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.4 + 0.5 * heat * (0.7 + 0.3 * beat)); c.lineWidth = s.main ? 1.8 : 1.3; c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.6 * heat); c.lineWidth = 0.8; c.stroke(); c.restore(); } c.restore(); return; }
        const ae = f.t - s.er, heat = Math.max(0, 1 - ae / 1.1), RR = s.main ? R : s.r;
        K.scorch(c, X, Y, RR * T * 0.8, k, heat, s.sd + 5); if (ae < 0.4) K.shockRing(c, X, Y, RR * T * (0.25 + 0.85 * H.ease.out(ae / 0.4)), 1 - ae / 0.4); if (ae < 0.6) K.floorLight(c, X, Y, RR * T * 1.3, (s.main ? 0.8 : 0.5) * (1 - ae / 0.6), P.yel); },
      seed(c, s, f, T, t) { const X = H.sx(s.x), Y = H.sy(s.y), r0 = T * s.sz, lt = f.t - s.f0;
        if (lt < 0) return;
        if (lt < FLY) { const q = fly(s, f.t), px = H.sx(q[0]), py = H.sy(q[1]); H.softShadow(c, px, py, T * 0.3 * s.sz / 0.4, 0.2); const pts = []; for (let j = 7; j >= 0; j--) { const ft = f.t - j * 0.03; if (ft < s.f0) continue; const p2 = fly(s, ft); pts.push([H.sx(p2[0]), H.sy(p2[1]) - p2[2] * T]); } if (pts.length > 2) H.trail(c, pts, T * 0.35 * s.sz / 0.4, P.org, P.yel); coal(c, px, py - q[2] * T, r0 * cl(0.6 + q[3] * 2), 0.55, t, s.sd, 3, f.t * 9); return; }
        if (f.t < s.er) { const land = s.f0 + FLY, heat = cl((f.t - land) / (s.er - land)), beat = Math.pow(Math.max(0, Math.sin((f.t - land) * (7 + heat * 16) + s.sd)), 6), ld = cl((f.t - land) / 0.12), trem = Math.sin(t * 55 + s.sd) * T * 0.05 * heat * heat, r = r0 * (1 + heat * 0.18 + beat * 0.04) * (0.85 + 0.15 * ld), cy = Y - r * 0.72, ns = Math.min(s.seams, 2 + Math.floor(heat * s.seams));
          H.softShadow(c, X, Y, T * 0.5 * s.sz / 0.4, 0.3);
          const nf = s.main ? Math.min(5, 1 + Math.floor(heat * 5)) : (heat > 0.4 ? 2 : 1); for (let i = 0; i < nf; i++) { const b = -Math.PI / 2 + (i - (nf - 1) / 2) * 0.55, fx = X + trem + Math.cos(b) * r * 0.78, fy = cy + Math.sin(b) * r * 0.78; K.flame(c, fx, fy, Math.max(3, r * (0.2 + 0.3 * heat)), r * (0.5 + 1.4 * heat) * (0.7 + 0.3 * Math.sin(t * 9 + i * 2 + s.sd)), t, i * 2.3 + s.sd, Math.sin(t * 5 + i * 1.7) * r * 0.45 + Math.cos(b) * r * 0.3, 0.95, true); }
          coal(c, X + trem, cy, r, 0.3 + 0.7 * heat * (0.85 + 0.15 * beat), t, s.sd, ns, 0.2);
          if (s.main) shimmer(c, X, cy - r, r * 2, T * 1.4 * heat, t, heat); return; }
        const ae = f.t - s.er;
        if (ae < 0.6) { const u = ae / 0.6, env = u < 0.15 ? H.ease.out(u / 0.15) : 1 - H.ease.in((u - 0.15) / 0.85);
          if (s.main) { const sc = 1 + 0.06 * (E - 1), side = fr => { for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + 0.4, d = T * 0.55 * sc * (0.6 + 0.4 * H.ease.out(u)); if ((Math.sin(b) < 0) === fr) K.flame(c, X + Math.cos(b) * d, Y + Math.sin(b) * d * 0.5, T * 0.42 * sc, T * 1.3 * sc * env * (0.8 + 0.2 * Math.sin(i * 2.7)), t, 30 + i, Math.cos(b) * T * 0.6, cl(env * 1.6), true); } };
            side(true); K.flame(c, X, Y, T * 0.85 * sc * (0.75 + 0.25 * env), T * 2.5 * sc * env, t, 7, 0, cl(env * 1.5)); side(false); K.fireball(c, X, Y - T * (1.2 + 1.6 * H.ease.out(u)), T * 0.42 * (1 - u * 0.6), t, 4, 1 - u, -Math.PI / 2); shimmer(c, X, Y - T * 1.5, T * 1.4, T * 2, t, 1 - u); }
          else { for (const sd of [-1, 1]) K.flame(c, X + sd * T * 0.25, Y, T * 0.3, T * 0.9 * env, t, s.sd + sd, sd * T * 0.4, cl(env * 1.6), true); K.flame(c, X, Y, T * 0.5, T * 1.5 * env, t, s.sd, 0, cl(env * 1.5), true); } }
        if (s.main && ae > 0.25 && f.life > 0.1) { const k = Math.min(1, f.life / 0.6), hh = Math.max(0, 1 - ae / 1.1); for (let i = 0; i < 3; i++) { const b = i / 3 * TAU + 0.6; K.flame(c, X + Math.cos(b) * T * 0.45, Y + Math.sin(b) * T * 0.25, T * 0.22, T * 0.55 * hh * (0.8 + 0.2 * Math.sin(t * 8 + i)), t, 20 + i, 0, k * cl((ae - 0.25) / 0.15), true); } } },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.6); for (const s of seeds) this.under(c, s, f, T, t, k); for (const p of frags) if (p.down) { const age = f.t - p.down, hh = Math.max(0, 1 - age / 0.8); K.scorch(c, H.sx(p.x), H.sy(p.y), T * 0.22, k, hh, p.seed); } },
      draw(c, f, X, Y, T, t) { const L = seeds.slice().sort((p, q) => p.y - q.y); for (const s of L) this.seed(c, s, f, T, t);
        for (const p of frags) { const px = H.sx(p.x), py = H.sy(p.y), hh = p.down ? Math.max(0, 1 - (f.t - p.down) / 0.8) : 1; if (p.down && hh <= 0) continue; if (!p.down) H.softShadow(c, px, py, T * 0.15, 0.2); coal(c, px, py - p.z * T - p.r * T * 0.5, p.r * T, 0.5 + 0.5 * hh, t, p.seed, 2, p.rot, !p.down); } } });
    for (const s of seeds) {
      H.X.after(s.f0 + FLY, () => { H.warn(s.x, s.y, s.r, s.er - s.f0 - FLY, C.col); H.X.sfx.thud(); K.flakes(s.x, s.y, s.main ? 5 : 2); K.smoke(s.x, s.y, s.main ? 3 : 1, 0.4); H.X.light(s.x, s.y, 1.5, 0.3); if (s.main) H.X.shake(2, 0.06); });
      H.X.after(s.er, () => { H.hitArea(s.x, s.y, s.r, s.dmg, C.dmgO({ kb: s.main ? 3 : 2, burn: 1 })); if (s.main) { K.blast(s.x, s.y, R, 1.4 + 0.05 * (E - 1)); K.flakes(s.x, s.y, 12); K.embers(s.x, s.y, 16, { v: 4, up: 4 }); H.fire(s.x, s.y, 1.3 + 0.05 * (E - 1), 2.5, C.base * 0.6, 'fire'); H.X.sfx.crash(); } else { K.blast(s.x, s.y, s.r, 0.6); K.embers(s.x, s.y, 6, { v: 3, up: 3 }); }
        const nf = s.main ? 5 + Math.round((E - 1) / 2) : 2; for (let i = 0; i < nf; i++) { const b = i / nf * TAU + Math.random() * 0.5, v = (s.main ? 2 : 1.4) + Math.random() * 1.5; frags.push({ x: s.x, y: s.y, z: 0.5, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.8, vz: 5 + Math.random() * 3, rot: b, vr: (Math.random() - 0.5) * 12, r: (s.main ? 0.09 : 0.07) + Math.random() * 0.05, seed: i * 3.1 + s.sd, down: 0 }); } }); }
  };

  /* ================= F-S04 Molten Lash =================
     Each lash uncoils from your side and rises, then whips across its arc: a white-hot core in molten bands under plates
     of dark crust with glowing seams, a fiery smear behind its tip, crust flaking off as it moves, a burnt arc on the floor
     under the tip's path; the tip snaps in a flare and a shock ring and smoulders as the lash draws back.
     Evolution: 1 lash at stages 1-2, then 2, 3, 3, 4 and 5 lashes at Celestial, fanned round the aim and whipping in a
     staggered sequence in alternate directions; longer (3.3 to 4.1) and thicker (damage split over the lashes, about evoK
     in total, a little more at Celestial). */
  S.moltenlash = (C, h) => {
    bind(h); const me = H.me, a = C.a, E = K.evo(C), CEL = E >= 7, NL = [1, 1, 2, 3, 3, 4, 5][E - 1], L = 3.3 + 0.13 * (E - 1), SW = (1.05 + 0.05 * (E - 1)) * (NL > 1 ? 0.62 : 1), PRE = 0.1, DUR = 0.36, W = 0.4 + 0.02 * (E - 1), NPL = NL > 2 ? 7 : K.evoN(C, 7, 9), per = C.base * 2.6 * C.K * K.evoK(C) * (CEL ? 1.08 : 1) / NL;
    const lashes = []; for (let j = 0; j < NL; j++) { const c0 = a + (j - (NL - 1) / 2) * 0.55, dir = j % 2 ? -1 : 1; lashes.push({ j, t0: j * 0.1, from: c0 - dir * SW, to: c0 + dir * SW, dir, hits: new Set(), snapped: false, prev: c0 - dir * SW, groove: [] }); }
    const END = lashes[NL - 1].t0 + PRE + DUR, snaps = []; me.sq = 0.7; H.X.sfx.whoosh();
    /* a lash's state at time ft: its angle, how far it lags toward the tip, its reach and lift */
    const state = (l, ft) => { const lt = Math.max(0, ft - l.t0), u = cl((lt - PRE) / DUR), ang = u2 => l.from + (l.to - l.from) * H.ease.io(cl(u2)), pre = lt < PRE ? lt / PRE : 1, done = lt - PRE - DUR;
      return { u, ang, lt, ext: lt < PRE ? H.ease.out(pre) : done > 0 ? 1 - H.ease.in(cl(done / 0.35)) : 1, lagK: lt < PRE ? 0 : u < 1 ? 1 : 1 - cl(done / 0.2), coil: lt < PRE ? 1 - pre : 0, k: cl(1 - done / 0.32) }; };
    H.add({ life: END + 0.95, update(dt, f) {
        for (const l of lashes) { if (f.t < l.t0) continue; const s = state(l, f.t), b = s.ang(s.u);
          if (s.lt >= PRE && !l.snapped) { for (const m of H.living()) { if (l.hits.has(m)) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d > L + m.r || d < 0.3) continue; const ma = H.angTo(me.x, me.y, m.x, m.y), tol = Math.asin(Math.min(1, m.r / Math.max(d, m.r))), lo = Math.min(l.prev, b), hi = Math.max(l.prev, b); if (H.wrap(ma - lo) >= -tol && H.wrap(ma - hi) <= tol) { l.hits.add(m); H.X.hitMon(m, per * 0.54, C.dmgO({ kb: 2, burn: 1 })); K.ignite(m.x, m.y, 0.6); } }
            if (s.u < 1) { l.groove.push({ x: me.x + Math.cos(b) * L * 0.97, y: me.y + Math.sin(b) * L * 0.97, t: f.t }); if (Math.random() < (NL > 2 ? 0.5 : 0.9) * H.Q()) { const r = 0.8 + Math.random() * (L - 0.8); H.P({ kind: 'shard', x: me.x + Math.cos(b) * r, y: me.y + Math.sin(b) * r * 0.8 - 0.4, vx: Math.cos(b + 1.4 * l.dir) * 2.5, vy: -2 - Math.random() * 2, g: 10, life: 0.5, max: 0.5, size: 3, rot: b, vr: 9, color: Math.random() < 0.5 ? P.char : P.crust }); H.P({ kind: 'ember', x: me.x + Math.cos(b) * r, y: me.y + Math.sin(b) * r * 0.8 - 0.5, vx: 0, vy: -1.5, g: -1, life: 0.4, max: 0.4, size: 3, color: P.yel }); } }
            else { l.snapped = true; const ex = me.x + Math.cos(b) * L, ey = me.y + Math.sin(b) * L; H.hitArea(ex, ey, CEL ? 1.15 : 1.0, per * 0.46, C.dmgO({ kb: 4, stun: 0.25 })); H.flareAt(ex, ey - 0.5, 1.1, 0.2, P.yel); K.sparks(ex, ey, 10, 7); K.flakes(ex, ey, 5); K.smoke(ex, ey, 2, 0.3); K.embers(ex, ey, 6); H.X.light(ex, ey, 2, 0.25); H.X.shake(NL > 2 ? 3 : 5, 0.12); H.X.sfx.crack && H.X.sfx.crack(); H.X.sfx.thud(); snaps.push({ x: ex, y: ey, t: f.t }); } }
          l.prev = b; if (s.k > 0) K.aura(me.x + Math.cos(b) * L * 0.6 * s.ext, me.y + Math.sin(b) * L * 0.6 * s.ext, 0.6, dt, 8 * s.ext / Math.sqrt(NL), 0.5); }
        for (const sn of snaps) if (f.t - sn.t < 0.7) K.aura(sn.x, sn.y, 0.4, dt, 8); },
      pts(l, ft, T) { const s = state(l, ft), mx = H.sx(me.x), my = H.sy(me.y) - T * 0.35, pts = [], NP = 14, mv = s.u > 0 && s.u < 1 ? Math.sin(s.u * Math.PI) : 0;
        for (let i = 0; i <= NP; i++) { const v = i / NP, bb = s.coil > 0 ? l.from - 0.5 * l.dir * s.coil + Math.sin(v * 5 - ft * 8 + l.j) * 0.25 * s.coil : s.ang(s.u - v * v * 0.3 * s.lagK), r = T * (0.75 + (L - 0.75) * v * s.ext), lift = Math.sin(v * Math.PI) * T * (0.35 + 0.5 * s.coil) * (1 - s.u * 0.5) + v * T * 0.6 * s.coil, wave = Math.sin(v * 9 - ft * 26 + l.j) * T * 0.07 * v * (0.4 + mv); pts.push([mx + Math.cos(bb) * r - Math.sin(bb) * wave, my + Math.sin(bb) * r - lift + Math.cos(bb) * wave]); }
        return { pts, mv, s }; },
      lash(c, l, f, T, t) { const { pts, mv, s } = this.pts(l, f.t, T), k = s.k, NP = pts.length - 1, w = T * W, taper = v => 1.1 - 0.6 * v;
        const at = v => { const x = v * NP, i = Math.min(NP - 1, Math.floor(x)), u = x - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; };
        for (let i = 0; i < pts.length; i += 3) K.glow(c, pts[i][0], pts[i][1], w * 2.2, P.org, 0.35 * k);
        if (mv > 0.05) { const tr = []; for (let j = 7; j >= 0; j--) { const q = this.pts(l, Math.max(l.t0, f.t - j * 0.014), T).pts; tr.push(q[q.length - 1]); } c.save(); c.globalAlpha = k * mv; H.trail(c, tr, w * 1.8, P.org, P.yel); c.restore(); }
        bands(c, pts, w, k, taper);
        // crust plates over the core, lit on top, the molten core glowing in the seams between them; the seams open toward the stretched tip
        c.save(); c.globalAlpha = k; const seg = 0.86 / NPL; for (let j = 0; j < NPL; j++) { const v0 = 0.04 + j * seg, gap = 0.16 + 0.3 * v0 + 0.25 * mv * v0, v1 = v0 + seg * (1 - gap), vm = (v0 + v1) / 2, A = at(v0), B = at(v1), M = at(vm), dx = B[0] - A[0], dy = B[1] - A[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, sg = ny < 0 ? 1 : -1, ww = w * taper(vm) * 0.58, jt = Math.sin(t * 28 + j * 2.1) * mv * w * 0.06, b1 = 1 + 0.12 * Math.sin(j * 3.3), sh = Math.sin(j * 2.7 + l.j) * 0.22;
          const o = (P0, f2) => [P0[0] + nx * ww * (f2 + sh) * sg, P0[1] + ny * ww * (f2 + sh) * sg], q = [o(A, 1), o([M[0] + jt, M[1]], b1), o(B, 0.9), o(B, -0.85), o(M, -1.05), o(A, -1)];
          H.poly(c, q); const g = c.createLinearGradient(q[1][0], q[1][1], q[4][0], q[4][1]); g.addColorStop(0, '#B07050'); g.addColorStop(0.3, P.crustL); g.addColorStop(0.65, P.crust); g.addColorStop(1, P.char); c.fillStyle = g; c.fill(); c.strokeStyle = H.line(); c.lineWidth = 1.1; c.stroke();
          c.strokeStyle = 'rgba(255,214,180,0.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.lineTo(q[2][0], q[2][1]); c.stroke();
          if (j % 2) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.8); c.lineWidth = 1.2; c.beginPath(); c.moveTo(q[1][0] * 0.7 + q[4][0] * 0.3, q[1][1] * 0.7 + q[4][1] * 0.3); c.lineTo(M[0] + dx * 0.1, M[1] + dy * 0.1); c.lineTo(q[4][0] * 0.8 + q[3][0] * 0.2, q[4][1] * 0.8 + q[3][1] * 0.2); c.stroke(); c.restore(); } }
        c.restore();
        const tip = pts[NP], pv = pts[NP - 2]; K.fireball(c, tip[0], tip[1], T * (0.13 + 0.012 * (E - 1)), t, 3 + l.j, k, Math.atan2(pv[1] - tip[1], pv[0] - tip[0]));
        K.glow(c, pts[0][0], pts[0][1], T * 0.4, P.yel, 0.5 * k); },
      /* the lashes on this layer: those swinging through the far side are drawn behind you */
      layer(c, f, T, t, back) { for (const l of lashes) { if (f.t < l.t0) continue; const s = state(l, f.t); if (s.k <= 0) continue; if ((Math.sin(s.ang(s.u)) < -0.25) === back) this.lash(c, l, f, T, t); } },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.5);
        for (const l of lashes) { const gr = l.groove; if (gr.length < 2) continue; c.save(); c.lineCap = 'round'; for (let i = 1; i < gr.length; i++) { const g0 = gr[i - 1], g1 = gr[i], age = f.t - g1.t, heat = Math.max(0, 1 - age / 0.6), x0 = H.sx(g0.x), y0 = H.sy(g0.y), x1 = H.sx(g1.x), y1 = H.sy(g1.y); c.globalCompositeOperation = 'source-over'; c.globalAlpha = k * 0.22; c.strokeStyle = P.char; c.lineWidth = T * 0.36; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); if (heat > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * heat; c.strokeStyle = H.rgba(P.org, 0.7); c.lineWidth = T * 0.14; c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.8); c.lineWidth = T * 0.04; c.stroke(); } } c.restore(); }
        for (const sn of snaps) { const age = f.t - sn.t, px = H.sx(sn.x), py = H.sy(sn.y); K.scorch(c, px, py, T * 0.7, k, Math.max(0, 1 - age / 0.9), sn.x); if (age < 0.35) K.shockRing(c, px, py, T * (0.2 + 1.0 * H.ease.out(age / 0.35)), 1 - age / 0.35); }
        this.layer(c, f, T, t, true); },
      draw(c, f, X, Y, T, t) { this.layer(c, f, T, t, false);
        for (const sn of snaps) { const age = f.t - sn.t; if (age > 0.4) continue; const u = age / 0.4, px = H.sx(sn.x), py = H.sy(sn.y) - T * 0.45; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.wht, 1 - u); c.lineWidth = 2; c.lineCap = 'round'; for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + sn.x, r0 = T * 0.15 * (1 + u * 2), r1 = T * (0.45 + 0.6 * H.ease.out(u)) * (i % 2 ? 0.6 : 1); c.beginPath(); c.moveTo(px + Math.cos(b) * r0, py + Math.sin(b) * r0); c.lineTo(px + Math.cos(b) * r1, py + Math.sin(b) * r1); c.stroke(); } c.restore(); K.glow(c, px, py, T * 1.2 * (1 - u), P.yel, 0.7); if (age > 0.05) K.flame(c, px, py + T * 0.45, T * 0.35, T * 0.9 * (1 - u), t, sn.x, 0, 1 - u, true); } } });
  };

  /* ================= F-S05 Phoenix Talon =================
     Sets of phoenix claws strike in turn round the aim. In each set curved claws of flame swoop down diagonally one after
     another, feathers streaming behind, each leaving three molten gouges in the floor (two diagonals and a bar across
     them) that glow and cool; then the set flares where its marks cross and shaded phoenix feathers burst up from it.
     Evolution: 1 set at stages 1-2, 2 at 3-4, 3 at 5-6 and 4 sets at Celestial, each at its own angle and place round the
     aim; more feathers; at Celestial a phoenix of feathers rises from the aim and dives back on it for a finale (marks
     and crossings split over the sets, about evoK in total). */
  S.phoenixtalon = (C, h) => {
    bind(h); const x = C.tx, y = C.ty, a = C.a, E = K.evo(C), CEL = E >= 7, NS = [1, 1, 2, 2, 3, 3, 4][E - 1], LEN = NS > 1 ? 2.8 : 3.6 + 0.1 * (E - 1), DROP = 0.2, MD = 0.14, SET = NS > 1 ? 0.3 : 0, ek = K.evoK(C), markD = C.base * 2.4 * C.K * ek / (3 * NS), crossD = C.base * 1.0 * C.K * ek * (CEL ? 0.7 : 1) / NS, NF = K.evoN(C, 5, 9);
    /* the sets: the first on the aim, the others round it (leaving a gap toward you), each turned its own way */
    const pa = Math.atan2(H.me.y - y, H.me.x - x), sets = []; for (let j = 0; j < NS; j++) { const off = j === 0 ? 0 : 2.1, ob = pa + 0.9 + (j - 0.5) / Math.max(1, NS - 1) * (TAU - 1.8), cx = x + Math.cos(ob) * off, cy = y + Math.sin(ob) * off, rot = a + j * 0.8; sets.push({ j, x: cx, y: cy, t0: j * SET, fl: j * SET + 2 * MD + DROP + (NS > 1 ? 0.3 : 0.44), rot }); }
    const marks = []; for (const st of sets) [[0.55, 1], [-0.55, 1], [Math.PI / 2, 0.85]].forEach(([o, lk], i) => { const b = st.rot + o, len = LEN * lk; marks.push({ b, len, set: st, d: st.t0 + [0, 2, 1][i] * MD, x0: st.x - Math.cos(b) * len / 2, y0: st.y - Math.sin(b) * len / 2, down: 0, seed: i * 2.3 + st.j * 5.1 }); });
    const LASTF = sets[NS - 1].fl; H.X.sfx.whoosh(); for (const st of sets) H.X.after(st.t0, () => H.warn(st.x, st.y, (NS > 1 ? 1.5 : 1.8 + 0.05 * (E - 1)), Math.max(0.25, st.fl - st.t0 - 0.2), C.col)); let phx = null;
    const heatOf = (m, ft) => { const age = ft - m.d - DROP; if (age < 0) return 0; let h1 = Math.max(0.15, 1 - age / 0.9); if (ft > m.set.fl) h1 = Math.max(h1, Math.max(0, 1 - (ft - m.set.fl) / 0.9)); return h1; };
    H.add({ life: CEL ? LASTF + 1.35 : LASTF + 0.85, x, y, update(dt, f) {
        for (const m of marks) { m.down = cl((f.t - m.d) / DROP); if (m.down > 0 && m.down < 1 && Math.random() < 0.9 * H.Q()) { const u = H.ease.in(m.down), wx = m.x0 + Math.cos(m.b) * m.len * (0.2 + 0.8 * u), wy = m.y0 + Math.sin(m.b) * m.len * (0.2 + 0.8 * u); H.P({ kind: 'ember', x: wx, y: wy - (1 - u) * 2.6, vx: -Math.cos(m.b) * 2, vy: -1, g: -0.5, life: 0.4, max: 0.4, size: 3.5, color: Math.random() < 0.5 ? P.gold : P.org }); } if (m.down >= 1 && heatOf(m, f.t) > 0.3) K.aura(m.x0 + Math.cos(m.b) * m.len * Math.random(), m.y0 + Math.sin(m.b) * m.len * Math.random(), 0.15, dt, 4 * heatOf(m, f.t)); }
        for (const st of sets) if (f.t > st.fl && f.t < st.fl + 0.6) K.aura(st.x, st.y, 0.8, dt, 20);
        if (phx && !phx.hit && f.t >= phx.t + 0.55) { phx.hit = true; H.hitArea(x, y, 2.0, C.base * 1.0 * C.K * ek * 0.4, C.dmgO({ kb: 4, burn: 1 })); K.blast(x, y, 2.0, 1.6); H.X.sfx.crash(); }
        if (phx && f.t > phx.t && f.t < phx.t + 0.55) K.aura(x, y, 0.5, dt, 18, 1.0); },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.5);
        for (const m of marks) { if (m.down < 1) continue; const heat = heatOf(m, f.t), fl = 0.8 + 0.2 * Math.sin(t * 12 + m.seed), cx = H.sx(m.set.x), cy = H.sy(m.set.y);
          if (heat > 0.1) K.floorLight(c, cx, cy, T * m.len * 0.4, 0.25 * heat * k);
          for (let j = -1; j <= 1; j++) { const sh = j ? 0.84 : 1, wx = Math.cos(m.b), wy = Math.sin(m.b), nxw = -wy, nyw = wx, ctr = [];
            // a claw gouge: a curved lens dug into the floor, charred round, a lit lip on its far edge, molten at its bottom
            for (let i = 0; i <= 10; i++) { const v = i / 10, along = m.len * ((1 - sh) / 2 + sh * v), off = j * 0.3 + Math.sin(v * Math.PI) * 0.22; ctr.push([H.sx(m.x0 + wx * along + nxw * off), H.sy(m.y0 + wy * along + nyw * off)]); }
            const lens = (wd, jag) => { const tp = [], bt = []; for (let i = 0; i <= 10; i++) { const v = i / 10, A = ctr[Math.max(0, i - 1)], B = ctr[Math.min(10, i + 1)], dx = B[0] - A[0], dy = B[1] - A[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, ww = wd * Math.pow(Math.sin(v * Math.PI), 0.45) * (1 + (jag ? 0.22 * Math.sin(i * 3.7 + m.seed + j) : 0)); tp.push([ctr[i][0] + nx * ww, ctr[i][1] + ny * ww]); bt.push([ctr[i][0] - nx * ww, ctr[i][1] - ny * ww]); } return [tp, bt]; };
            c.save(); c.globalAlpha = k; let [tp, bt] = lens(T * 0.24, true); H.poly(c, tp.concat(bt.slice().reverse())); c.fillStyle = H.rgba(P.char, 0.18); c.fill();
            [tp, bt] = lens(T * 0.12, true); H.poly(c, tp.concat(bt.slice().reverse())); c.fillStyle = H.rgba(P.char, 0.92); c.fill(); c.strokeStyle = H.line(); c.lineWidth = 1; c.stroke();
            const up = tp[5][1] < bt[5][1] ? tp : bt, dn = up === tp ? bt : tp; c.strokeStyle = H.rgba(P.crustL, 0.85); c.lineWidth = 1.4; H.poly(c, up.slice(1, 10), false); c.stroke(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1.2; H.poly(c, dn.slice(1, 10), false); c.stroke();
            if (heat > 0.02) { c.globalCompositeOperation = 'lighter'; [tp, bt] = lens(T * 0.06, false); H.poly(c, tp.concat(bt.slice().reverse())); c.fillStyle = H.rgba(P.org, heat * fl); c.fill(); c.strokeStyle = H.rgba(P.yel, heat * fl * 0.9); c.lineWidth = Math.max(1, T * 0.035); H.poly(c, ctr.slice(2, 9), false); c.stroke(); if (heat > 0.5) { c.strokeStyle = H.rgba(P.wht, (heat - 0.5) * 1.6); c.lineWidth = 1; c.stroke(); } }
            c.restore(); } }
        for (const st of sets) { if (f.t < st.fl - 0.05) continue; const u = cl((f.t - st.fl) / 0.5), CX = H.sx(st.x), CY = H.sy(st.y); K.scorch(c, CX, CY, T * 1.1, k, Math.max(0, 1 - (f.t - st.fl) / 1.0), 4 + st.j); if (u < 1) K.shockRing(c, CX, CY, T * (0.3 + 1.2 * H.ease.out(u)), 1 - u); }
        if (phx && f.t > phx.t + 0.55) { const v = cl((f.t - phx.t - 0.55) / 0.4); if (v < 1) K.shockRing(c, X, Y, T * (0.4 + 1.8 * H.ease.out(v)), 1 - v); } },
      draw(c, f, X, Y, T, t) {
        for (const m of marks) { if (m.down <= 0 || m.down >= 1) continue; const u = H.ease.in(m.down), z = (1 - u) * 2.6, wx = m.x0 + Math.cos(m.b) * m.len * (0.2 + 0.8 * u), wy = m.y0 + Math.sin(m.b) * m.len * (0.2 + 0.8 * u), px = H.sx(wx), py = H.sy(wy) - z * T, sb = Math.atan2(Math.sin(m.b) * T * m.len * 0.8 + 2.6 * T * 2 * (1 - u), Math.cos(m.b) * T * m.len * 0.8);
          H.softShadow(c, H.sx(wx), H.sy(wy), T * 0.5, 0.25 * u); K.floorLight(c, H.sx(wx), H.sy(wy), T * 1.0, 0.4 * u);
          for (let j = -1; j <= 1; j++) { const ox = -Math.sin(sb) * j * T * 0.22, oy = Math.cos(sb) * j * T * 0.22, pts = []; for (let i = 0; i <= 6; i++) { const v = i / 6; pts.push([px + ox - Math.cos(sb) * T * 1.6 * v, py + oy - Math.sin(sb) * T * 1.6 * v - v * v * T * 0.3]); } bands(c, pts.reverse(), T * 0.2, 0.9, v => 0.2 + 0.8 * v); }
          for (let i = 0; i < 3; i++) feather(c, px - Math.cos(sb) * T * 0.4, py - Math.sin(sb) * T * 0.4, sb + Math.PI + (i - 1) * 0.45 + Math.sin(t * 9 + i) * 0.1, T * 0.8, T * 0.22, t, i + m.seed, 0.9);
          c.save(); c.translate(px, py); c.rotate(sb); for (let j = -1; j <= 1; j++) { c.save(); c.translate(0, j * T * 0.22); claw(c, T * 0.62, T * 0.16, 1); c.restore(); } c.restore(); K.glow(c, px, py, T * 0.8, P.yel, 0.5); }
        // flames standing on the fresh gouges, and again when their set flares
        for (const m of marks) { if (m.down < 1) continue; const age = f.t - m.d - DROP, fa = f.t > m.set.fl ? Math.max(0, 1 - (f.t - m.set.fl) / 0.6) : Math.max(0, 1 - age / 0.5); if (fa <= 0) continue; const nfl = NS > 2 ? 1 : 2; for (let i = 0; i < nfl; i++) { const v = nfl === 1 ? 0.35 : 0.3 + i * 0.4, wx = m.x0 + Math.cos(m.b) * m.len * v, wy = m.y0 + Math.sin(m.b) * m.len * v; K.flame(c, H.sx(wx), H.sy(wy), T * 0.22, T * (0.35 + 0.35 * fa) * fa, t, m.seed + i * 3, 0, Math.min(1, fa * 1.5), true); } }
        for (const st of sets) { if (f.t < st.fl || f.t > st.fl + 0.8) continue; const u = (f.t - st.fl) / 0.8, CX = H.sx(st.x), CY = H.sy(st.y); if (u < 0.4) K.fireball(c, CX, CY - T * 0.35, T * 0.33 * (1 - u / 0.4), t, 2 + st.j, 1 - u / 0.4, -Math.PI / 2); for (let i = 0; i < NF; i++) { const b = -Math.PI / 2 + (i - (NF - 1) / 2) * (1.6 / Math.max(1, NF - 1)) * (0.6 + 0.5 * H.ease.out(cl(u * 2))), r = T * (0.15 + u * 1.1); feather(c, CX + Math.cos(b) * r, CY - T * 0.3 + Math.sin(b) * r * 0.8 - u * T * 0.5, b + Math.sin(t * 6 + i) * 0.15, T * (0.68 + 0.12 * Math.sin(i * 1.9)) * (0.6 + 0.4 * cl(u * 4)), T * 0.24, t, i + st.j, (1 - u) * cl(u * 8)); } K.glow(c, CX, CY - T * 0.5, T * 1.6 * (1 - u), P.yel, 0.55 * (1 - u)); shimmer(c, CX, CY - T * 0.6, T * 1.2, T * 1.4, t, 1 - u); }
        if (phx && f.t > phx.t && f.t < phx.t + 0.75) { const v = (f.t - phx.t) / 0.55, up = v < 0.55 ? H.ease.out(v / 0.55) : 1 - H.ease.in(cl((v - 0.55) / 0.45)), py = Y - T * (0.4 + 1.9 * up), a2 = cl(v * 4) * cl((1.35 - v) * 3), spread = 0.4 + 0.6 * Math.min(1, v * 1.6), flap = Math.sin(t * 10) * 0.18;
          if (v <= 1) { K.floorLight(c, X, Y, T * 1.6, 0.5 * a2); for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { const b = (sd < 0 ? Math.PI : 0) - sd * (0.15 + i * 0.16 * spread) - sd * flap, len = T * (1.1 - i * 0.08); feather(c, X + sd * T * 0.12, py, b, len * 1.3, T * 0.24, t, i + sd * 7, a2); }
            for (let i = 0; i < 3; i++) feather(c, X, py + T * 0.15, Math.PI / 2 + (i - 1) * 0.3, T * 1.25, T * 0.22, t, 30 + i, a2); K.fireball(c, X, py - T * 0.12, T * 0.3, t, 6, a2, Math.PI / 2); } } } });
    marks.forEach(m => H.X.after(m.d + DROP, () => { H.hitLine(m.x0, m.y0, m.b, m.len, 0.9, markD, C.dmgO({ kb: 1, burn: 1 })); const cx = m.x0 + Math.cos(m.b) * m.len / 2, cy = m.y0 + Math.sin(m.b) * m.len / 2; for (let i = 0; i < 3; i++) { const d = (i - 1) * m.len * 0.35; K.sparks(cx + Math.cos(m.b) * d, cy + Math.sin(m.b) * d, 3, 5); } K.flakes(cx, cy, 2); H.X.shake(2, 0.08); H.X.light(cx, cy, 2.5, 0.2); H.X.sfx.whoosh(); }));
    for (const st of sets) H.X.after(st.fl, () => { H.hitArea(st.x, st.y, 1.3, crossD, C.dmgO({ kb: 3, burn: 1 })); H.flareAt(st.x, st.y - 0.4, 1.3, 0.25, P.yel); K.embers(st.x, st.y, 12, { up: 4, v: 2 }); K.sparks(st.x, st.y, 8, 6); K.smoke(st.x, st.y, 2, 0.5); H.X.shake(4, 0.12); H.X.sfx.crash(); });
    if (CEL) H.X.after(LASTF + 0.15, () => { phx = { t: LASTF + 0.15, hit: false }; });
  };
})();
