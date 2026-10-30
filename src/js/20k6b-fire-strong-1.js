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

  /* ================= F-S02 Cinder Fan =================
     Flame gathers into a ball before you, then a fan of tongues unfolds across the aim side to side over a glowing sheet,
     the tips curling and shedding sparks, and leaves a half-ring of cooling coals on a scorched band.
     Evolution: 7 tongues at Hatchling to 13 at Celestial, longer reach and a wider fan; at Celestial a second, wider fan
     sweeps back the other way (damage split 70/30, about evoK in total). */
  S.cinderfan = (C, h) => {
    bind(h); const me = H.me, a = C.a, E = K.evo(C), CEL = E >= 7, L = 3.3 + 0.1 * (E - 1), SP = 0.62 + 0.03 * (E - 1), N = K.evoN(C, 7, 13), tot = C.base * 2.4 * C.K * K.evoK(C), WIND = 0.17, back = Math.sin(a) < -0.15, x0 = me.x, y0 = me.y;
    const passes = [{ t0: WIND, dir: 1, L, SP, k: CEL ? 0.7 : 1 }]; if (CEL) passes.push({ t0: WIND + 0.34, dir: -1, L: L * 1.1, SP: SP * 1.18, k: 0.3 });
    const M = K.evoN(C, 13, 21), coals = []; for (let i = 0; i < M; i++) { const v = i / (M - 1), b = a + (v - 0.5) * SP * 2 + Math.sin(i * 5.1) * 0.04, r = L * (0.78 + 0.14 * ((i * 0.618) % 1)); coals.push({ x: x0 + Math.cos(b) * r, y: y0 + Math.sin(b) * r, s: 0.6 + 0.6 * ((i * 0.37) % 1), v, seed: i * 1.9 }); }
    me.sq = 0.6; H.X.sfx.whoosh(); const G = { x: x0 + Math.cos(a) * 0.7, y: y0 + Math.sin(a) * 0.7 };
    const tongue = (p, i, ft) => { const v = i / (N - 1), lt = ft - p.t0 - (p.dir > 0 ? v : 1 - v) * 0.1; if (lt < 0) return null; const grow = H.ease.out(cl(lt / 0.13)), k = cl(1 - (ft - p.t0 - 0.28) / 0.2); return { b: a + (v - 0.5) * p.SP * 2, len: p.L * grow * (0.82 + 0.18 * Math.sin(i * 1.7 + 1 + p.dir)), k, grow }; };
    H.add({ life: WIND + (CEL ? 1.95 : 1.6), x: x0, y: y0, update(dt, f) {
        if (f.t < WIND) { if (Math.random() < 0.9 * H.Q()) { const b = Math.random() * TAU, r = 0.9 + Math.random() * 0.5; H.P({ kind: 'ember', x: G.x + Math.cos(b) * r, y: G.y + Math.sin(b) * r * 0.6 - 0.3, vx: -Math.cos(b) * r * 5, vy: -Math.sin(b) * r * 3, g: 0, life: 0.18, max: 0.18, size: 3, color: P.yel }); } return; }
        for (const p of passes) for (let i = 0; i < N; i++) { const q = tongue(p, i, f.t); if (!q || q.k <= 0 || q.k >= 1 && q.grow < 0.6) continue; if (Math.random() < 0.35 * H.Q()) { const ex = x0 + Math.cos(q.b) * q.len, ey = y0 + Math.sin(q.b) * q.len; H.P({ kind: 'spark', x: ex, y: ey - 0.3, vx: Math.cos(q.b) * 3 + (Math.random() - 0.5) * 2, vy: Math.sin(q.b) * 2 - 2.5, g: 6, life: 0.4, max: 0.4, size: 2, color: Math.random() < 0.5 ? P.yel : P.wht }); } }
        const cool = f.t - WIND - 0.15; if (cool > 0 && cool < 1.2) for (let i = 0; i < coals.length; i += 3) K.aura(coals[i].x, coals[i].y, 0.2, dt, 3 * (1 - cool / 1.2)); },
      fan(c, f, T, t) { const mx = H.sx(x0), my = H.sy(y0) - T * 0.2;
        if (f.t < WIND + 0.08) { const u = cl(f.t / WIND), gx = H.sx(G.x), gy = H.sy(G.y) - T * 0.35; K.floorLight(c, gx, gy + T * 0.35, T * 0.9, 0.4 * u); K.fireball(c, gx, gy, T * (0.08 + 0.14 * u) * (f.t > WIND ? 1 - (f.t - WIND) / 0.08 : 1), t, 3, 1, a); }
        for (const p of passes) { const pt = f.t - p.t0; if (pt < 0 || pt > 0.5) continue; const L2 = []; let lo = 1e9, hi = -1e9, maxL = 0; for (let i = 0; i < N; i++) { const q = tongue(p, i, f.t); if (!q || q.k <= 0) continue; L2.push([i, q]); lo = Math.min(lo, q.b); hi = Math.max(hi, q.b); maxL = Math.max(maxL, q.len); } if (!L2.length) continue;
          const kk = cl(1 - (pt - 0.28) / 0.22);
          // the sheet of fire under the tongues: an additive sector, amber near you, red at its edge
          c.save(); c.translate(mx, my + T * 0.2); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.75 * kk; const R = maxL * T, g = c.createRadialGradient(0, 0, T * 0.4, 0, 0, R * 1.05); g.addColorStop(0, H.rgba(P.yel, 0.7)); g.addColorStop(0.35, H.rgba(P.org, 0.55)); g.addColorStop(0.8, H.rgba(P.red, 0.35)); g.addColorStop(1, H.rgba(P.red, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(Math.cos(lo) * T * 0.45, Math.sin(lo) * T * 0.45); c.arc(0, 0, R * 1.05, lo - 0.08, hi + 0.08); c.arc(0, 0, T * 0.45, hi, lo, true); c.closePath(); c.fill(); c.restore();
          K.floorLight(c, mx + Math.cos(a) * maxL * T * 0.5, my + T * 0.2 + Math.sin(a) * maxL * T * 0.5, maxL * T * 0.6, 0.45 * kk);
          L2.sort((u, v) => Math.sin(u[1].b) - Math.sin(v[1].b));
          for (const [i, q] of L2) { const ox = mx + Math.cos(q.b) * T * 0.55, oy = my + Math.sin(q.b) * T * 0.55, ex = mx + Math.cos(q.b) * q.len * T, ey = my + Math.sin(q.b) * q.len * T; { const ang = Math.atan2(ey - oy, ex - ox), w = T * (0.52 + 0.025 * (E - 1)) * (i % 2 ? 0.85 : 1), hh = Math.hypot(ex - ox, ey - oy) * 1.05; c.save(); c.translate(ox, oy); c.rotate(ang + Math.PI / 2); K.flame(c, 0, 0, w, hh, t, i * 2.1 + p.dir, (Math.sin(t * 6 + i * 1.3) * 0.35 + 0.25 * p.dir) * w, q.k, i % 2 === 1 || p.dir < 0 || N > 9 && i % 3 !== 0); c.restore(); }
            if (q.grow > 0.8 && q.k > 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.5 * q.k); c.lineWidth = 1.5; c.lineCap = 'round'; const cb = q.b + 1.2 * p.dir, cr = T * 0.18; c.beginPath(); c.arc(ex - Math.cos(q.b) * cr * 0.6, ey - Math.sin(q.b) * cr * 0.6, cr, cb, cb + 2.6 + Math.sin(t * 9 + i)); c.stroke(); c.restore(); } }
          shimmer(c, mx + Math.cos(a) * T * 1.6, my + Math.sin(a) * T * 0.9, T * 1.3, T * 1.3, t, kk); } },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.5), cool = f.t - WIND - 0.12;
        if (cool > 0) { const heat = Math.max(0, 1 - cool / 1.2), mx = H.sx(x0), my = H.sy(y0); c.save(); c.translate(mx, my); c.lineCap = 'round'; c.strokeStyle = H.rgba(P.char, 0.3 * k * cl(cool / 0.15)); c.lineWidth = T * 0.5; c.beginPath(); c.arc(0, 0, L * 0.86 * T, a - SP, a + SP); c.stroke(); if (heat > 0.05) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.3 * heat * k); c.lineWidth = T * 0.12; c.stroke(); } c.restore();
          for (const q of coals) { if (cool < Math.abs(q.v - 0.5) * 0.1) continue; const px = H.sx(q.x), py = H.sy(q.y), r = T * 0.11 * q.s, hq = heat * (0.8 + 0.2 * Math.sin(t * 7 + q.seed)); if (hq > 0.15) K.floorLight(c, px, py, r * 4, 0.35 * hq * k); c.save(); c.globalAlpha = k; const g = c.createRadialGradient(px - r * 0.3, py - r * 0.4, 0, px, py, r * 1.3); g.addColorStop(0, H.mix(P.crustL, P.yel, hq)); g.addColorStop(0.5, H.mix(P.crust, P.org, hq)); g.addColorStop(1, H.mix(P.char, P.red, hq * 0.7)); c.fillStyle = g; c.beginPath(); c.ellipse(px, py, r * 1.3, r * 0.85, q.seed, 0, TAU); c.fill(); c.strokeStyle = H.rgba(P.char, 0.8); c.lineWidth = 1; c.stroke(); if (hq > 0.1) { c.globalCompositeOperation = 'lighter'; c.fillStyle = H.rgba(P.yel, 0.8 * hq); c.beginPath(); c.ellipse(px - r * 0.2, py - r * 0.15, r * 0.6, r * 0.35, q.seed, 0, TAU); c.fill(); K.glow(c, px, py, r * 3, P.org, 0.5 * hq * k); } c.restore(); } }
        if (back) this.fan(c, f, T, t); },
      draw(c, f, X, Y, T, t) { if (!back) this.fan(c, f, T, t); } });
    for (const p of passes) H.X.after(p.t0 + 0.04, () => { H.hitCone(x0, y0, a, p.L + 0.4, p.SP + 0.1, tot * p.k, C.dmgO({ kb: 3, burn: 1 })); H.X.shake(p.dir > 0 ? 4 : 3, 0.12); const ex = x0 + Math.cos(a) * p.L * 0.55, ey = y0 + Math.sin(a) * p.L * 0.55; H.X.light(ex, ey, 3, 0.25); K.embers(ex, ey, 10, { v: 3 }); K.smoke(ex, ey, 2, 0.8); H.X.sfx.whoosh(); });
  };

  /* ================= F-S03 Furnace Seed =================
     A lumpy coal is lobbed to the aim trailing smoke; it lands with a thud and cracks as its heat builds, the seams
     widening, thin flames curling from them, a heartbeat of light quickening and glowing cracks racing out over the floor
     to the warned ring; then it erupts in a crowned pillar of fire, its shell flying out in glowing pieces, and the ground
     burns a while (H.fire) under a cooling scorch.
     Evolution: a wider blast (R 2.0 to 2.6) and more seams; from the second stage it spits satellite seeds (1 to 4 at
     Celestial) that land round the crater and pop in turn (damage split 70/30, about evoK in total). */
  S.furnaceseed = (C, h) => {
    bind(h); const me = H.me, tx = C.tx, ty = C.ty, E = K.evo(C), R = 2.0 + 0.1 * (E - 1), FLY = 0.35, ERUPT = 1.25, SEAMS = K.evoN(C, 4, 7), NS = K.evoN(C, 0, 4), tot = C.base * 2.5 * C.K * K.evoK(C), mainK = NS ? 0.7 : 1, x0 = me.x, y0 = me.y;
    const sats = []; for (let i = 0; i < NS; i++) { const b = C.a + Math.PI / 4 + i / NS * TAU, r = R * (1.05 + 0.2 * (i % 2)); sats.push({ x: tx + Math.cos(b) * r, y: ty + Math.sin(b) * r, t0: ERUPT + 0.05 + i * 0.06, land: 0, pop: false }); }
    const frags = [], hist = []; H.X.sfx.whoosh(); me.sq = 0.7;
    H.add({ life: ERUPT + 1.15 + (NS ? 0.3 : 0), x: tx, y: ty, update(dt, f) {
        if (f.t < FLY) { const u = f.t / FLY, z = 1.0 * (1 - u) + 0.4 * u + Math.sin(u * Math.PI) * 1.8; hist.push([x0 + (tx - x0) * u, y0 + (ty - y0) * u, z]); if (hist.length > 9) hist.shift(); if (Math.random() < 0.8 * H.Q()) K.smoke(x0 + (tx - x0) * u, y0 + (ty - y0) * u - z, 1, 0.1); }
        else if (f.t < ERUPT) { const heat = (f.t - FLY) / (ERUPT - FLY); K.aura(tx, ty, 0.35, dt, 6 + 26 * heat, 0.45); if (Math.random() < heat * 0.25 * H.Q()) K.sparks(tx, ty - 0.5, 1, 4); }
        else { const ae = f.t - ERUPT; if (ae < 0.8) K.aura(tx, ty, R * 0.6, dt, 30 * (1 - ae / 0.8)); }
        for (const p of frags) { if (p.down) continue; p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= 14 * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z <= 0) { p.z = 0; p.down = f.t; K.sparks(p.x, p.y, 2, 3); } }
        for (const s of sats) { const u = (f.t - s.t0) / 0.32; if (u >= 1 && !s.land) { s.land = f.t; K.flakes(s.x, s.y, 2); H.X.sfx.thud(); } if (s.land && !s.pop && f.t - s.land > 0.22) { s.pop = true; H.hitArea(s.x, s.y, 0.95, tot * 0.3 / NS, C.dmgO({ kb: 2, burn: 1 })); K.blast(s.x, s.y, 0.9, 0.6); } } },
      drawUnder(c, f, X, Y, T, t) { if (f.t < FLY) return; const k = Math.min(1, f.life / 0.6);
        if (f.t < ERUPT) { const heat = (f.t - FLY) / (ERUPT - FLY), beat = Math.pow(Math.max(0, Math.sin((f.t - FLY) * (7 + heat * 16))), 6);
          K.scorch(c, X, Y, T * 0.75 * cl((f.t - FLY) / 0.25), 1, heat * 0.7, 3); K.floorLight(c, X, Y, T * (0.9 + R * 0.5 * heat), (0.25 + 0.45 * heat) * (0.7 + 0.3 * beat));
          c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; const nc = SEAMS * 2; for (let i = 0; i < nc; i++) { const b = i / nc * TAU + 0.3 + Math.sin(i * 3.3) * 0.2, len = R * T * cl(heat * 1.25 - (i % 2) * 0.15) * (0.75 + 0.2 * Math.sin(i * 2.1)); if (len < 2) continue; c.beginPath(); c.moveTo(X + Math.cos(b) * T * 0.3, Y + Math.sin(b) * T * 0.3 * H.GY); for (let j = 1; j <= 4; j++) { const u = j / 4, bb = b + Math.sin(i * 7 + j * 3) * 0.12; c.lineTo(X + Math.cos(bb) * (T * 0.3 + len * u), Y + Math.sin(bb) * (T * 0.3 + len * u) * H.GY); } c.strokeStyle = H.rgba(P.char, 0.7); c.lineWidth = 3; c.stroke(); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.4 + 0.5 * heat * (0.7 + 0.3 * beat)); c.lineWidth = 1.8; c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.6 * heat); c.lineWidth = 0.8; c.stroke(); c.restore(); } c.restore(); return; }
        const ae = f.t - ERUPT, heat = Math.max(0, 1 - ae / 1.1);
        K.scorch(c, X, Y, R * T * 0.8, k, heat, 5); if (ae < 0.4) K.shockRing(c, X, Y, R * T * (0.25 + 0.85 * H.ease.out(ae / 0.4)), 1 - ae / 0.4); if (ae < 0.6) K.floorLight(c, X, Y, R * T * 1.3, 0.8 * (1 - ae / 0.6), P.yel);
        for (const p of frags) if (p.down) { const age = f.t - p.down, hh = Math.max(0, 1 - age / 0.8); K.scorch(c, H.sx(p.x), H.sy(p.y), T * 0.22, k, hh, p.seed); }
        for (const s of sats) if (s.land) { const age = f.t - s.land, hs = s.pop ? Math.max(0, 1 - (age - 0.22) / 0.8) : 1; K.scorch(c, H.sx(s.x), H.sy(s.y), T * 0.6, k, hs, s.x); if (s.pop && age - 0.22 < 0.3) K.shockRing(c, H.sx(s.x), H.sy(s.y), T * (0.2 + 0.8 * (age - 0.22) / 0.3), 1 - (age - 0.22) / 0.3); if (!s.pop) K.floorLight(c, H.sx(s.x), H.sy(s.y), T * 0.7, 0.5); } },
      draw(c, f, X, Y, T, t) { const r0 = T * 0.4;
        if (f.t < FLY) { const u = f.t / FLY, wx = x0 + (tx - x0) * u, wy = y0 + (ty - y0) * u, z = hist.length ? hist[hist.length - 1][2] : 1, px = H.sx(wx), py = H.sy(wy); H.softShadow(c, px, py, T * 0.3, 0.2); if (hist.length > 2) { const pts = hist.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]); H.trail(c, pts, T * 0.35, P.org, P.yel); } coal(c, px, py - z * T, r0 * cl(0.6 + u * 2), 0.55, t, 1, 3, f.t * 9); return; }
        if (f.t < ERUPT) { const heat = (f.t - FLY) / (ERUPT - FLY), beat = Math.pow(Math.max(0, Math.sin((f.t - FLY) * (7 + heat * 16))), 6), land = cl((f.t - FLY) / 0.12), trem = Math.sin(t * 55) * T * 0.05 * heat * heat, r = r0 * (1 + heat * 0.18 + beat * 0.04) * (0.85 + 0.15 * land), cy = Y - r * 0.72, ns = Math.min(SEAMS, 2 + Math.floor(heat * SEAMS));
          H.softShadow(c, X, Y, T * 0.5, 0.3);
          const nf = Math.min(5, 1 + Math.floor(heat * 5)); for (let i = 0; i < nf; i++) { const b = -Math.PI / 2 + (i - (nf - 1) / 2) * 0.55, fx = X + trem + Math.cos(b) * r * 0.78, fy = cy + Math.sin(b) * r * 0.78; K.flame(c, fx, fy, Math.max(3, r * (0.2 + 0.3 * heat)), r * (0.5 + 1.4 * heat) * (0.7 + 0.3 * Math.sin(t * 9 + i * 2)), t, i * 2.3, Math.sin(t * 5 + i * 1.7) * r * 0.45 + Math.cos(b) * r * 0.3, 0.95, true); }
          coal(c, X + trem, cy, r, 0.3 + 0.7 * heat * (0.85 + 0.15 * beat), t, 2, ns, 0.2);
          shimmer(c, X, cy - r, r * 2, T * 1.4 * heat, t, heat); return; }
        const ae = f.t - ERUPT;
        if (ae < 0.6) { const u = ae / 0.6, env = u < 0.15 ? H.ease.out(u / 0.15) : 1 - H.ease.in((u - 0.15) / 0.85), sc = 1 + 0.06 * (E - 1); for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + 0.4, d = T * 0.55 * sc * (0.6 + 0.4 * H.ease.out(u)), fx = X + Math.cos(b) * d, fy = Y + Math.sin(b) * d * 0.5; if (Math.sin(b) < 0) K.flame(c, fx, fy, T * 0.42 * sc, T * 1.3 * sc * env * (0.8 + 0.2 * Math.sin(i * 2.7)), t, 30 + i, Math.cos(b) * T * 0.6, cl(env * 1.6), true); } K.flame(c, X, Y, T * 0.85 * sc * (0.75 + 0.25 * env), T * 2.5 * sc * env, t, 7, 0, cl(env * 1.5)); for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + 0.4, d = T * 0.55 * sc * (0.6 + 0.4 * H.ease.out(u)), fx = X + Math.cos(b) * d, fy = Y + Math.sin(b) * d * 0.5; if (Math.sin(b) >= 0) K.flame(c, fx, fy, T * 0.42 * sc, T * 1.3 * sc * env * (0.8 + 0.2 * Math.sin(i * 2.7)), t, 30 + i, Math.cos(b) * T * 0.6, cl(env * 1.6), true); } K.fireball(c, X, Y - T * (1.2 + 1.6 * H.ease.out(u)), T * 0.42 * (1 - u * 0.6), t, 4, 1 - u, -Math.PI / 2); shimmer(c, X, Y - T * 1.5, T * 1.4, T * 2, t, 1 - u); }
        if (ae > 0.25 && f.life > 0.1) { const k = Math.min(1, f.life / 0.6), hh = Math.max(0, 1 - ae / 1.1); for (let i = 0; i < 3; i++) { const b = i / 3 * TAU + 0.6; K.flame(c, X + Math.cos(b) * T * 0.45, Y + Math.sin(b) * T * 0.25, T * 0.22, T * 0.55 * hh * (0.8 + 0.2 * Math.sin(t * 8 + i)), t, 20 + i, 0, k * cl((ae - 0.25) / 0.15), true); } }
        for (const p of frags) { const px = H.sx(p.x), py = H.sy(p.y), hh = p.down ? Math.max(0, 1 - (f.t - p.down) / 0.8) : 1; if (p.down && hh <= 0) continue; if (!p.down) H.softShadow(c, px, py, T * 0.15, 0.2); coal(c, px, py - p.z * T - p.r * T * 0.5, p.r * T, 0.5 + 0.5 * hh, t, p.seed, 2, p.rot, !p.down); }
        for (const s of sats) { const u = (f.t - s.t0) / 0.32; if (u < 0 || s.pop) continue; const uu = Math.min(1, u), wx = tx + (s.x - tx) * uu, wy = ty + (s.y - ty) * uu, z = Math.sin(uu * Math.PI) * 1.4 + 0.15, px = H.sx(wx), py = H.sy(wy); H.softShadow(c, px, py, T * 0.2, 0.2); coal(c, px, py - z * T, T * 0.17 * (s.land ? 1 + 0.25 * (f.t - s.land) / 0.22 : 1), s.land ? 1 : 0.7, t, s.x, 3, f.t * 6); if (s.land) shimmer(c, px, py - T * 0.3, T * 0.4, T * 0.7, t, 1); } } });
    H.X.after(FLY, () => { H.warn(tx, ty, R, ERUPT - FLY, C.col); H.X.sfx.thud(); K.flakes(tx, ty, 5); K.smoke(tx, ty, 3, 0.4); H.X.light(tx, ty, 1.5, 0.3); H.X.shake(2, 0.06); });
    H.X.after(ERUPT, () => { H.hitArea(tx, ty, R, tot * mainK, C.dmgO({ kb: 3, burn: 1 })); K.blast(tx, ty, R, 1.4 + 0.05 * (E - 1)); K.flakes(tx, ty, 12); K.embers(tx, ty, 16, { v: 4, up: 4 }); H.fire(tx, ty, 1.3 + 0.05 * (E - 1), 2.5, C.base * 0.6, 'fire'); H.X.sfx.crash();
      const nf = 5 + Math.round((E - 1) / 2); for (let i = 0; i < nf; i++) { const b = i / nf * TAU + Math.random() * 0.5, v = 2 + Math.random() * 1.5; frags.push({ x: tx, y: ty, z: 0.5, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.8, vz: 5 + Math.random() * 3, rot: b, vr: (Math.random() - 0.5) * 12, r: 0.09 + Math.random() * 0.06, seed: i * 3.1, down: 0 }); } });
  };

  /* ================= F-S04 Molten Lash =================
     The lash uncoils from your side and rises, then whips across the aimed arc: a white-hot core in molten bands under
     plates of dark crust with glowing seams, a fiery smear behind its tip, crust flaking off as it moves, a burnt arc on
     the floor under the tip's path; the tip snaps in a flare and a shock ring and smoulders as the lash draws back.
     Evolution: longer (3.3 to 4.1), thicker and a wider sweep with more crust plates; at Celestial it lashes back the
     other way and snaps a second time (damage split 72/28, about evoK in total). */
  S.moltenlash = (C, h) => {
    bind(h); const me = H.me, a = C.a, E = K.evo(C), CEL = E >= 7, L = 3.3 + 0.13 * (E - 1), SW = 1.05 + 0.05 * (E - 1), PRE = 0.1, DUR = 0.36, W = 0.4 + 0.02 * (E - 1), NPL = K.evoN(C, 7, 11), tot = C.base * 2.6 * C.K * K.evoK(C);
    const passes = [{ t0: PRE, d: DUR, from: a - SW, to: a + SW, k: CEL ? 0.72 : 1, hits: new Set(), snapped: false }]; if (CEL) passes.push({ t0: PRE + DUR + 0.14, d: DUR * 0.85, from: a + SW, to: a - SW, k: 0.28, hits: new Set(), snapped: false });
    const END = passes[passes.length - 1].t0 + passes[passes.length - 1].d, snaps = [], groove = []; me.sq = 0.7; H.X.sfx.whoosh();
    /* the lash's state at time ft: its angle, how far it lags toward the tip, its reach and lift */
    const state = ft => { let p = passes[0]; for (const q of passes) if (ft >= q.t0) p = q; const u = cl((ft - p.t0) / p.d), ang = u2 => p.from + (p.to - p.from) * H.ease.io(cl(u2)); const pre = ft < PRE ? ft / PRE : 1, ext = ft < PRE ? H.ease.out(pre) : ft > END ? 1 - H.ease.in(cl((ft - END) / 0.35)) : 1, between = passes.length > 1 && ft > passes[0].t0 + passes[0].d && ft < passes[1].t0;
      const rest = ft > END + 0 || between ? cl((ft - (between ? passes[0].t0 + passes[0].d : END)) / 0.2) : 0;
      return { p, u, ang, ext, pre, lagK: ft < PRE ? 0 : (u < 1 ? 1 : 1 - rest), coil: ft < PRE ? 1 - pre : 0 }; };
    H.add({ life: END + 0.95, prev: a - SW, update(dt, f) {
        const s = state(f.t), p = s.p, b = s.ang(s.u);
        if (f.t >= p.t0 && !p.snapped) { for (const m of H.living()) { if (p.hits.has(m)) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d > L + m.r || d < 0.3) continue; const ma = H.angTo(me.x, me.y, m.x, m.y), tol = Math.asin(Math.min(1, m.r / Math.max(d, m.r))), lo = Math.min(f.prev, b), hi = Math.max(f.prev, b); if (H.wrap(ma - lo) >= -tol && H.wrap(ma - hi) <= tol) { p.hits.add(m); H.X.hitMon(m, tot * p.k * 0.54, C.dmgO({ kb: 2, burn: 1 })); K.ignite(m.x, m.y, 0.6); } }
          if (s.u < 1) { groove.push({ x: me.x + Math.cos(b) * L * 0.97, y: me.y + Math.sin(b) * L * 0.97, t: f.t }); for (let i = 0; i < 2; i++) if (Math.random() < 0.8 * H.Q()) { const r = 0.8 + Math.random() * (L - 0.8); H.P({ kind: 'shard', x: me.x + Math.cos(b) * r, y: me.y + Math.sin(b) * r * 0.8 - 0.4, vx: Math.cos(b + 1.4 * Math.sign(p.to - p.from)) * 2.5, vy: -2 - Math.random() * 2, g: 10, life: 0.5, max: 0.5, size: 3, rot: b, vr: 9, color: i ? P.char : P.crust }); H.P({ kind: 'ember', x: me.x + Math.cos(b) * r, y: me.y + Math.sin(b) * r * 0.8 - 0.5, vx: 0, vy: -1.5, g: -1, life: 0.4, max: 0.4, size: 3, color: P.yel }); } }
          if (s.u >= 1) { p.snapped = true; const ex = me.x + Math.cos(b) * L, ey = me.y + Math.sin(b) * L; H.hitArea(ex, ey, CEL ? 1.15 : 1.0, tot * p.k * 0.46, C.dmgO({ kb: 4, stun: 0.25 })); H.flareAt(ex, ey - 0.5, 1.1, 0.2, P.yel); K.sparks(ex, ey, 12, 7); K.flakes(ex, ey, 6); K.smoke(ex, ey, 2, 0.3); K.embers(ex, ey, 8); H.X.light(ex, ey, 2, 0.25); H.X.shake(5, 0.12); H.X.sfx.crack && H.X.sfx.crack(); H.X.sfx.thud(); snaps.push({ x: ex, y: ey, t: f.t }); } }
        f.prev = b; for (const sn of snaps) if (f.t - sn.t < 0.7) K.aura(sn.x, sn.y, 0.4, dt, 10); K.aura(me.x + Math.cos(b) * L * 0.6 * s.ext, me.y + Math.sin(b) * L * 0.6 * s.ext, 0.6, dt, 8 * s.ext, 0.5); },
      pts(ft, T) { const s = state(ft), mx = H.sx(me.x), my = H.sy(me.y) - T * 0.35, pts = [], NP = 14, mv = s.u > 0 && s.u < 1 ? Math.sin(s.u * Math.PI) : 0;
        for (let i = 0; i <= NP; i++) { const v = i / NP, bb = s.coil > 0 ? s.p.from - 0.5 * s.coil + Math.sin(v * 5 - ft * 8) * 0.25 * s.coil : s.ang(s.u - v * v * 0.3 * s.lagK), r = T * (0.5 + (L - 0.5) * v * s.ext), lift = Math.sin(v * Math.PI) * T * (0.35 + 0.5 * s.coil) * (1 - s.u * 0.5) + v * T * 0.6 * s.coil, wave = Math.sin(v * 9 - ft * 26) * T * 0.07 * v * (0.4 + mv); pts.push([mx + Math.cos(bb) * r - Math.sin(bb) * wave, my + Math.sin(bb) * r - lift + Math.cos(bb) * wave]); }
        return { pts, mv, s }; },
      lash(c, f, T, t) { const k = cl(1 - (f.t - END) / 0.32), { pts, mv, s } = this.pts(f.t, T), NP = pts.length - 1, b = s.ang(s.u), w = T * W, taper = v => 1.1 - 0.6 * v;
        const at = v => { const x = v * NP, i = Math.min(NP - 1, Math.floor(x)), u = x - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; };
        for (let i = 0; i < pts.length; i += 3) K.glow(c, pts[i][0], pts[i][1], w * 2.2, P.org, 0.35 * k);
        if (mv > 0.05) { const tr = []; for (let j = 7; j >= 0; j--) { const q = this.pts(Math.max(0, f.t - j * 0.014), T).pts; tr.push(q[q.length - 1]); } c.save(); c.globalAlpha = k * mv; H.trail(c, tr, w * 1.8, P.org, P.yel); c.restore(); }
        bands(c, pts, w, k, taper);
        // crust plates over the core, lit on top, the molten core glowing in the seams between them; the seams open toward the stretched tip
        c.save(); c.globalAlpha = k; const seg = 0.86 / NPL; for (let j = 0; j < NPL; j++) { const v0 = 0.04 + j * seg, gap = 0.16 + 0.3 * v0 + 0.25 * mv * v0, v1 = v0 + seg * (1 - gap), vm = (v0 + v1) / 2, A = at(v0), B = at(v1), M = at(vm), dx = B[0] - A[0], dy = B[1] - A[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, sg = ny < 0 ? 1 : -1, ww = w * taper(vm) * 0.58, jt = Math.sin(t * 28 + j * 2.1) * mv * w * 0.06, b1 = 1 + 0.12 * Math.sin(j * 3.3), sh = Math.sin(j * 2.7) * 0.22;
          const o = (P0, f2) => [P0[0] + nx * ww * (f2 + sh) * sg, P0[1] + ny * ww * (f2 + sh) * sg], q = [o(A, 1), o([M[0] + jt, M[1]], b1), o(B, 0.9), o(B, -0.85), o(M, -1.05), o(A, -1)];
          H.poly(c, q); const g = c.createLinearGradient(q[1][0], q[1][1], q[4][0], q[4][1]); g.addColorStop(0, '#B07050'); g.addColorStop(0.3, P.crustL); g.addColorStop(0.65, P.crust); g.addColorStop(1, P.char); c.fillStyle = g; c.fill(); c.strokeStyle = H.line(); c.lineWidth = 1.1; c.stroke();
          c.strokeStyle = 'rgba(255,214,180,0.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.lineTo(q[2][0], q[2][1]); c.stroke();
          if (j % 2) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.8); c.lineWidth = 1.2; c.beginPath(); c.moveTo(q[1][0] * 0.7 + q[4][0] * 0.3, q[1][1] * 0.7 + q[4][1] * 0.3); c.lineTo(M[0] + dx * 0.1, M[1] + dy * 0.1); c.lineTo(q[4][0] * 0.8 + q[3][0] * 0.2, q[4][1] * 0.8 + q[3][1] * 0.2); c.stroke(); c.restore(); } }
        c.restore();
        const tip = pts[NP], pv = pts[NP - 2]; K.fireball(c, tip[0], tip[1], T * (0.13 + 0.012 * (E - 1)), t, 3, k, Math.atan2(pv[1] - tip[1], pv[0] - tip[0]));
        K.glow(c, pts[0][0], pts[0][1], T * 0.4, P.yel, 0.5 * k); return Math.sin(b); },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.5);
        if (groove.length > 1) { c.save(); c.lineCap = 'round'; for (let i = 1; i < groove.length; i++) { const g0 = groove[i - 1], g1 = groove[i], age = f.t - g1.t, heat = Math.max(0, 1 - age / 0.6), x0 = H.sx(g0.x), y0 = H.sy(g0.y), x1 = H.sx(g1.x), y1 = H.sy(g1.y); c.globalCompositeOperation = 'source-over'; c.globalAlpha = k * 0.22; c.strokeStyle = P.char; c.lineWidth = T * 0.36; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); if (heat > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * heat; c.strokeStyle = H.rgba(P.org, 0.7); c.lineWidth = T * 0.14; c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.8); c.lineWidth = T * 0.04; c.stroke(); } } c.restore(); }
        for (const sn of snaps) { const age = f.t - sn.t, px = H.sx(sn.x), py = H.sy(sn.y); K.scorch(c, px, py, T * 0.7, k, Math.max(0, 1 - age / 0.9), sn.x); if (age < 0.35) K.shockRing(c, px, py, T * (0.2 + 1.0 * H.ease.out(age / 0.35)), 1 - age / 0.35); }
        if (f.t < END + 0.32 && Math.sin(state(f.t).ang(state(f.t).u)) < -0.25) this.lash(c, f, T, t); },
      draw(c, f, X, Y, T, t) { if (f.t < END + 0.32 && !(Math.sin(state(f.t).ang(state(f.t).u)) < -0.25)) this.lash(c, f, T, t);
        for (const sn of snaps) { const age = f.t - sn.t; if (age > 0.4) continue; const u = age / 0.4, px = H.sx(sn.x), py = H.sy(sn.y) - T * 0.45; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.wht, 1 - u); c.lineWidth = 2; c.lineCap = 'round'; for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + sn.x, r0 = T * 0.15 * (1 + u * 2), r1 = T * (0.45 + 0.6 * H.ease.out(u)) * (i % 2 ? 0.6 : 1); c.beginPath(); c.moveTo(px + Math.cos(b) * r0, py + Math.sin(b) * r0); c.lineTo(px + Math.cos(b) * r1, py + Math.sin(b) * r1); c.stroke(); } c.restore(); K.glow(c, px, py, T * 1.2 * (1 - u), P.yel, 0.7); if (age > 0.05) K.flame(c, px, py + T * 0.45, T * 0.35, T * 0.9 * (1 - u), t, sn.x, 0, 1 - u); } } });
  };

  /* ================= F-S05 Phoenix Talon =================
     Phoenix claws of curved flame swoop down diagonally across the aim one after another, feathers streaming behind,
     each leaving three molten grooves in the floor that glow, cool, and then all flare at once where they cross: a burst
     of shaded phoenix feathers rises from the crossing.
     Evolution: 3 claw marks at Hatchling to 5 at Celestial (the marks' damage split, about evoK in total), longer marks;
     at Celestial a phoenix of feathers rises from the crossing and dives back on it for a finale (crossing damage split). */
  S.phoenixtalon = (C, h) => {
    bind(h); const x = C.tx, y = C.ty, a = C.a, E = K.evo(C), CEL = E >= 7, n = K.evoN(C, 3, 5), LEN = 3.6 + 0.1 * (E - 1), DROP = 0.2, FLARE = 0.92, ek = K.evoK(C), markD = C.base * 2.4 * C.K * ek / n, crossD = C.base * 1.0 * C.K * ek, NF = K.evoN(C, 5, 9);
    /* two long diagonals and a bar across them through the aim (a star); evolution adds bars across the diagonals further
       along the aim, each crossing them at two more points */
    const ca = Math.cos(a), sa = Math.sin(a), spec = [[0.55, 0, 1], [-0.55, 0, 1], [Math.PI / 2, 0, 1], [Math.PI / 2, 1.0, 0.72], [Math.PI / 2, -1.0, 0.72]].slice(0, n), marks = spec.map(([o, sh, lk], i) => { const b = a + o, len = LEN * lk, cx = x + ca * sh, cy = y + sa * sh; return { b, len, d: [0, 2, 1, 3, 4][i] * 0.34 / (n - 1), x0: cx - Math.cos(b) * len / 2, y0: cy - Math.sin(b) * len / 2, down: 0, landed: false, seed: i * 2.3 }; });
    const cross = [{ x, y, k: 1, t: FLARE }]; for (const [o, sh] of spec.slice(3)) for (const sd of [-1, 1]) { const off = sh * Math.tan(0.55) * sd; cross.push({ x: x + ca * sh - sa * off, y: y + sa * sh + ca * off, k: 0.6, t: FLARE + 0.06 * cross.length }); }
    const crossK = (CEL ? 0.6 : 1) * (cross.length > 1 ? 1 : 1), share = cr => crossD * crossK * (cross.length > 1 ? (cr.k === 1 ? 0.6 : 0.4 / (cross.length - 1)) : 1);
    H.X.sfx.whoosh(); H.warn(x, y, 1.8 + 0.05 * (E - 1), 0.4, C.col); let phx = null;
    const heatOf = (m, ft) => { const age = ft - m.d - DROP; if (age < 0) return 0; let h1 = Math.max(0.15, 1 - age / 0.9); if (ft > FLARE) h1 = Math.max(h1, Math.max(0, 1 - (ft - FLARE) / 0.9)); return h1; };
    H.add({ life: CEL ? FLARE + 1.35 : 1.75, x, y, update(dt, f) {
        for (const m of marks) { m.down = cl((f.t - m.d) / DROP); if (m.down > 0 && m.down < 1 && Math.random() < 0.9 * H.Q()) { const u = H.ease.in(m.down), wx = m.x0 + Math.cos(m.b) * m.len * (0.2 + 0.8 * u), wy = m.y0 + Math.sin(m.b) * m.len * (0.2 + 0.8 * u); H.P({ kind: 'ember', x: wx, y: wy - (1 - u) * 2.6, vx: -Math.cos(m.b) * 2, vy: -1, g: -0.5, life: 0.4, max: 0.4, size: 3.5, color: Math.random() < 0.5 ? P.gold : P.org }); } if (m.down >= 1 && heatOf(m, f.t) > 0.3) K.aura(m.x0 + Math.cos(m.b) * m.len * Math.random(), m.y0 + Math.sin(m.b) * m.len * Math.random(), 0.15, dt, 5 * heatOf(m, f.t)); }
        for (const cr of cross) if (f.t > cr.t && f.t < cr.t + 0.6) K.aura(cr.x, cr.y, 0.8 * cr.k, dt, 24 * cr.k);
        if (phx && !phx.hit && f.t >= phx.t + 0.55) { phx.hit = true; H.hitArea(x, y, 1.8, crossD * 0.4, C.dmgO({ kb: 4, burn: 1 })); K.blast(x, y, 1.8, 1.6); H.X.sfx.crash(); }
        if (phx && f.t > phx.t && f.t < phx.t + 0.55) K.aura(x, y, 0.5, dt, 18, 1.0); },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.5);
        for (const m of marks) { if (m.down < 1) continue; const heat = heatOf(m, f.t), fl = 0.8 + 0.2 * Math.sin(t * 12 + m.seed), cx = (H.sx(m.x0) + H.sx(m.x0 + Math.cos(m.b) * m.len)) / 2, cy = (H.sy(m.y0) + H.sy(m.y0 + Math.sin(m.b) * m.len)) / 2;
          if (heat > 0.1) { K.floorLight(c, cx, cy, T * m.len * 0.4, 0.3 * heat * k); }
          for (let j = -1; j <= 1; j++) { const sh = j ? 0.84 : 1, wx = Math.cos(m.b), wy = Math.sin(m.b), nxw = -wy, nyw = wx, ctr = [], top = [], bot = [], lip = [];
            // a claw gouge: a curved lens dug into the floor, charred round, a lit lip on its far edge, molten at its bottom
            for (let i = 0; i <= 10; i++) { const v = i / 10, along = m.len * ((1 - sh) / 2 + sh * v), off = j * 0.3 + Math.sin(v * Math.PI) * 0.22, X0 = H.sx(m.x0 + wx * along + nxw * off), Y0 = H.sy(m.y0 + wy * along + nyw * off); ctr.push([X0, Y0]); }
            const lens = (wd, jag) => { const tp = [], bt = []; for (let i = 0; i <= 10; i++) { const v = i / 10, A = ctr[Math.max(0, i - 1)], B = ctr[Math.min(10, i + 1)], dx = B[0] - A[0], dy = B[1] - A[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, ww = wd * Math.pow(Math.sin(v * Math.PI), 0.45) * (1 + (jag ? 0.22 * Math.sin(i * 3.7 + m.seed + j) : 0)); tp.push([ctr[i][0] + nx * ww, ctr[i][1] + ny * ww]); bt.push([ctr[i][0] - nx * ww, ctr[i][1] - ny * ww]); } return [tp, bt]; };
            c.save(); c.globalAlpha = k; let [tp, bt] = lens(T * 0.24, true); H.poly(c, tp.concat(bt.slice().reverse())); c.fillStyle = H.rgba(P.char, 0.18); c.fill();
            [tp, bt] = lens(T * 0.12, true); H.poly(c, tp.concat(bt.slice().reverse())); c.fillStyle = H.rgba(P.char, 0.92); c.fill(); c.strokeStyle = H.line(); c.lineWidth = 1; c.stroke();
            const up = tp[5][1] < bt[5][1] ? tp : bt, dn = up === tp ? bt : tp; c.strokeStyle = H.rgba(P.crustL, 0.85); c.lineWidth = 1.4; H.poly(c, up.slice(1, 10), false); c.stroke(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1.2; H.poly(c, dn.slice(1, 10), false); c.stroke();
            if (heat > 0.02) { c.globalCompositeOperation = 'lighter'; [tp, bt] = lens(T * 0.06, false); H.poly(c, tp.concat(bt.slice().reverse())); c.fillStyle = H.rgba(P.org, heat * fl); c.fill(); c.strokeStyle = H.rgba(P.yel, heat * fl * 0.9); c.lineWidth = Math.max(1, T * 0.035); H.poly(c, ctr.slice(2, 9), false); c.stroke(); if (heat > 0.5) { c.strokeStyle = H.rgba(P.wht, (heat - 0.5) * 1.6); c.lineWidth = 1; c.stroke(); } }
            c.restore(); } }
        for (const cr of cross) { if (f.t < cr.t - 0.05) continue; const u = cl((f.t - cr.t) / 0.5), CX = H.sx(cr.x), CY = H.sy(cr.y); K.scorch(c, CX, CY, T * 1.1 * cr.k, k, Math.max(0, 1 - (f.t - cr.t) / 1.0), 4 + cr.x); if (u < 1) K.shockRing(c, CX, CY, T * cr.k * (0.3 + 1.2 * H.ease.out(u)), 1 - u); }
        if (f.t > FLARE - 0.05) { if (phx && f.t > phx.t + 0.55) { const v = cl((f.t - phx.t - 0.55) / 0.4); if (v < 1) K.shockRing(c, X, Y, T * (0.4 + 1.6 * H.ease.out(v)), 1 - v); } } },
      draw(c, f, X, Y, T, t) {
        for (const m of marks) { if (m.down <= 0 || m.down >= 1) continue; const u = H.ease.in(m.down), z = (1 - u) * 2.6, wx = m.x0 + Math.cos(m.b) * m.len * (0.2 + 0.8 * u), wy = m.y0 + Math.sin(m.b) * m.len * (0.2 + 0.8 * u), px = H.sx(wx), py = H.sy(wy) - z * T, sb = Math.atan2(Math.sin(m.b) * T * m.len * 0.8 + 2.6 * T * 2 * (1 - u), Math.cos(m.b) * T * m.len * 0.8);
          H.softShadow(c, H.sx(wx), H.sy(wy), T * 0.5, 0.25 * u); K.floorLight(c, H.sx(wx), H.sy(wy), T * 1.0, 0.4 * u);
          for (let j = -1; j <= 1; j++) { const ox = -Math.sin(sb) * j * T * 0.22, oy = Math.cos(sb) * j * T * 0.22, pts = []; for (let i = 0; i <= 6; i++) { const v = i / 6; pts.push([px + ox - Math.cos(sb) * T * 1.6 * v, py + oy - Math.sin(sb) * T * 1.6 * v - v * v * T * 0.3]); } bands(c, pts.reverse(), T * 0.2, 0.9, v => 0.2 + 0.8 * v); }
          for (let i = 0; i < 3; i++) feather(c, px - Math.cos(sb) * T * 0.4, py - Math.sin(sb) * T * 0.4, sb + Math.PI + (i - 1) * 0.45 + Math.sin(t * 9 + i) * 0.1, T * 0.8, T * 0.22, t, i + m.seed, 0.9);
          c.save(); c.translate(px, py); c.rotate(sb); for (let j = -1; j <= 1; j++) { c.save(); c.translate(0, j * T * 0.22); claw(c, T * 0.62, T * 0.16, 1); c.restore(); } c.restore(); K.glow(c, px, py, T * 0.8, P.yel, 0.5); }
        // flames standing on the fresh grooves, and again when they flare
        for (const m of marks) { if (m.down < 1) continue; const age = f.t - m.d - DROP, fa = f.t > FLARE ? Math.max(0, 1 - (f.t - FLARE) / 0.6) : Math.max(0, 1 - age / 0.5); if (fa <= 0) continue; for (let i = 0; i < 2; i++) { const v = 0.3 + i * 0.4, wx = m.x0 + Math.cos(m.b) * m.len * v, wy = m.y0 + Math.sin(m.b) * m.len * v; K.flame(c, H.sx(wx), H.sy(wy), T * 0.22, T * (0.35 + 0.35 * fa) * fa, t, m.seed + i * 3, 0, Math.min(1, fa * 1.5), true); } }
        for (const cr of cross) { if (f.t < cr.t || f.t > cr.t + 0.8) continue; const u = (f.t - cr.t) / 0.8, CX = H.sx(cr.x), CY = H.sy(cr.y), nf = cr.k === 1 ? NF : 3, sc = cr.k === 1 ? 1 : 0.75; if (u < 0.4) { if (cr.k === 1) K.fireball(c, CX, CY - T * 0.35, T * 0.35 * (1 - u / 0.4), t, 2, 1 - u / 0.4, -Math.PI / 2); else H.core(c, CX, CY - T * 0.35, T * 0.3 * (1 - u / 0.4), P.org, P.wht, 1 - u / 0.4); } for (let i = 0; i < nf; i++) { const b = -Math.PI / 2 + (i - (nf - 1) / 2) * (1.6 / Math.max(1, nf - 1)) * (0.6 + 0.5 * H.ease.out(cl(u * 2))), r = T * (0.15 + u * 1.1) * sc; feather(c, CX + Math.cos(b) * r, CY - T * 0.3 + Math.sin(b) * r * 0.8 - u * T * 0.5, b + Math.sin(t * 6 + i) * 0.15, T * sc * (0.68 + 0.12 * Math.sin(i * 1.9)) * (0.6 + 0.4 * cl(u * 4)), T * 0.24 * sc, t, i + cr.k, (1 - u) * cl(u * 8)); } K.glow(c, CX, CY - T * 0.5, T * 1.6 * sc * (1 - u), P.yel, 0.55 * (1 - u)); if (cr.k === 1) shimmer(c, CX, CY - T * 0.6, T * 1.2, T * 1.4, t, 1 - u); }
        if (phx && f.t > phx.t && f.t < phx.t + 0.75) { const v = (f.t - phx.t) / 0.55, up = v < 0.55 ? H.ease.out(v / 0.55) : 1 - H.ease.in(cl((v - 0.55) / 0.45)), py = Y - T * (0.4 + 1.9 * up), a2 = cl(v * 4) * cl((1.35 - v) * 3), spread = 0.4 + 0.6 * Math.min(1, v * 1.6), flap = Math.sin(t * 10) * 0.18;
          if (v <= 1) { K.floorLight(c, X, Y, T * 1.6, 0.5 * a2); for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { const b = (sd < 0 ? Math.PI : 0) - sd * (0.15 + i * 0.16 * spread) - sd * flap, len = T * (1.1 - i * 0.08); feather(c, X + sd * T * 0.12, py, b, len * 1.3, T * 0.24, t, i + sd * 7, a2); }
            for (let i = 0; i < 3; i++) feather(c, X, py + T * 0.15, Math.PI / 2 + (i - 1) * 0.3, T * 1.25, T * 0.22, t, 30 + i, a2); K.fireball(c, X, py - T * 0.12, T * 0.3, t, 6, a2, Math.PI / 2); } } } });
    marks.forEach(m => H.X.after(m.d + DROP, () => { m.landed = true; H.hitLine(m.x0, m.y0, m.b, m.len, 0.9, markD, C.dmgO({ kb: 1, burn: 1 })); const cx = m.x0 + Math.cos(m.b) * m.len / 2, cy = m.y0 + Math.sin(m.b) * m.len / 2; for (let i = 0; i < 3; i++) { const d = (i - 1) * m.len * 0.35; K.sparks(cx + Math.cos(m.b) * d, cy + Math.sin(m.b) * d, 4, 5); } K.flakes(cx, cy, 3); H.X.shake(3, 0.1); H.X.light(cx, cy, 2.5, 0.2); H.X.sfx.whoosh(); }));
    for (const cr of cross) H.X.after(cr.t, () => { H.hitArea(cr.x, cr.y, cr.k === 1 ? 1.3 : 0.9, share(cr), C.dmgO({ kb: cr.k === 1 ? 3 : 1, burn: 1 })); H.flareAt(cr.x, cr.y - 0.4, 1.3 * cr.k, 0.25, P.yel); K.embers(cr.x, cr.y, Math.round(14 * cr.k), { up: 4, v: 2 }); K.sparks(cr.x, cr.y, Math.round(10 * cr.k), 6); if (cr.k === 1) { K.smoke(cr.x, cr.y, 3, 0.5); H.X.shake(4, 0.12); H.X.sfx.crash(); } else H.X.sfx.thud(); });
    if (CEL) H.X.after(FLARE, () => { phx = { t: FLARE + 0.22, hit: false }; });
  };
})();
