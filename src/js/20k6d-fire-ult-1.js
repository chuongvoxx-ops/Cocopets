/* ---------- Fire, reworked: Ultimates F-U01..F-U05 (armageddon, embers, crucible, dragonkiln, crimsonlotus) ----------
   The showpieces. Every flame is FK's shaded volume; every molten or solid thing (a bowl plate, a kiln brick, a lotus
   petal, a lantern cap) has a four-tone ramp, a dark crust, glowing seams, a rim of firelight and an outline; every
   burning thing lights the floor and sheds embers; every hit scorches the ground. Things over the aim fade where they
   would pass in front of the pet (petGuard), and the fire tornadoes steer clear of the pet. */
(() => {
  const S = ELEM_IMPL.fire.strong, U = ELEM_IMPL.fire.ult;   // (S unused here: Strongs are other workers')
  const TAU = Math.PI * 2, P = FK.P, HOT = '#CFEFFF';
  let H, K;
  const cl = u => Math.max(0, Math.min(1, u));
  const rnd = k => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const lerp = (a, b, u) => a + (b - a) * u;
  /* a burning thing cuts its light into the dungeon's dark: a short light renewed every tenth of a second while it burns */
  function lit(f, key, x, y, r, dt) { const L = f._lt || (f._lt = {}); L[key] = (L[key] || 0) - dt; if (L[key] <= 0) { H.X.light(x, y, r, 0.26); L[key] = 0.1; } }

  /* how much a tall thing at screen (X0, Y0) may show: it thins to a ghost where it would stand in front of the pet */
  function petGuard(X0, Y0, T, rad) { const mx = H.sx(H.me.x), my = H.sy(H.me.y) - T * 0.45, d = Math.hypot(X0 - mx, (Y0 - my) * 1.15) - (rad || 0); return Math.max(0.28, cl((d - T * 0.6) / (T * 0.8))); }
  /* a single (crownless) shaded flame pointing along a screen angle */
  function sflame(c, x, y, ang, w, h, t, seed, a) { if (h < 2 || w < 1 || !(a > 0.01)) return; c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); K.flame(c, 0, 0, w, h, t, seed, Math.sin(t * 8 + seed) * w * 0.15, a, true); c.restore(); }
  /* a stream of fire along a polyline: banded dark red to white-hot, a glow along it (no tongues: cheap) */
  function stream(c, pts, w, a, taper) {
    if (pts.length < 2 || w < 0.5 || !(a > 0.01)) return; c.save(); c.globalAlpha = Math.min(1, a); c.lineCap = 'round'; c.lineJoin = 'round';
    H.ribbon(c, pts, w * 1.2, P.dred, null, taper); H.ribbon(c, pts, w * 0.95, P.red, null, taper); H.ribbon(c, pts, w * 0.7, P.org, null, taper);
    c.globalCompositeOperation = 'lighter'; H.ribbon(c, pts, w * 0.42, H.rgba(P.yel, 0.85), null, taper); H.ribbon(c, pts, w * 0.15, P.wht, null, taper); c.restore();
    for (let i = 0; i < pts.length; i += 3) K.glow(c, pts[i][0], pts[i][1], w * 1.7 * (taper ? taper(i / (pts.length - 1)) : 1), P.org, 0.3 * a);
  }
  /* a molten/charred solid: a four-tone ramp lit from the upper left, a dark crust cracked by glowing seams, heat welling
     at its foot, a rim of firelight, a bright lit edge and the outline. o.inner: the face that looks into the fire (hot) */
  function crust(c, pts, heat, t, seed, o) {
    o = o || {}; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const w = x1 - x0, h = y1 - y0; if (w < 1 && h < 1) return; const s = seed || 0, g = c.createLinearGradient(x0, y0, x0 + w * 0.85, y1);
    if (o.inner) { g.addColorStop(0, P.wht); g.addColorStop(0.25, P.yel); g.addColorStop(0.6, P.org); g.addColorStop(1, P.red); }
    else { g.addColorStop(0, o.lit || '#B8744C'); g.addColorStop(0.3, P.crustL); g.addColorStop(0.65, P.crust); g.addColorStop(1, '#2A120A'); }
    H.poly(c, pts); c.fillStyle = g; c.fill();
    const fl = heat * (0.78 + 0.22 * Math.sin(t * 9 + s * 1.7)), lw = Math.max(1, Math.min(w, h) * 0.07);
    c.save(); H.poly(c, pts); c.clip(); c.lineCap = 'round'; c.lineJoin = 'round';
    const seams = []; for (let i = 0; i < (o.seams || 2); i++) { const sp = []; let u = 0.22 + 0.56 * rnd(s + i * 3.1); for (let j = 0; j <= 4; j++) { sp.push([x0 + w * u, y0 + h * (0.06 + j * 0.23)]); u = cl(u + (rnd(s * 1.3 + i * 5.7 + j * 2.3) - 0.5) * 0.36); } seams.push(sp); }
    c.strokeStyle = H.rgba(o.inner ? P.dred : P.char, o.inner ? 0.55 : 0.85); c.lineWidth = lw * 1.9; for (const sp of seams) { H.poly(c, sp, false); c.stroke(); }
    c.globalCompositeOperation = 'lighter';
    if (fl > 0.02) { c.strokeStyle = H.rgba(P.org, fl); c.lineWidth = lw * 1.1; for (const sp of seams) { H.poly(c, sp, false); c.stroke(); } c.strokeStyle = H.rgba(P.yel, fl * 0.9); c.lineWidth = lw * 0.45; for (const sp of seams) { H.poly(c, sp, false); c.stroke(); }
      K.glow(c, x0 + w * 0.55, y1, Math.max(w, h) * 0.6, P.org, 0.42 * fl); c.strokeStyle = H.rgba(P.org, 0.5 * fl); c.lineWidth = lw * 2.4; H.poly(c, pts); c.stroke(); }
    c.restore();
    c.strokeStyle = H.rgba(o.inner ? P.wht : P.gold, 0.55); c.lineWidth = Math.max(1, lw * 0.8); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.stroke();
    H.poly(c, pts); c.strokeStyle = H.line(); c.lineWidth = 1.5; c.stroke();
  }
  /* heat shimmer: faint rising wavy lines, additive */
  function shimmer(c, X, Y, r, h, t, a) { if (!(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 * a; c.strokeStyle = P.wht; c.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const ox = (i - 1.5) * r * 0.4, ph = t * 5 + i * 2; c.beginPath(); for (let j = 0; j <= 6; j++) { const u = j / 6, px = X + ox + Math.sin(ph + u * 7) * r * 0.1, py = Y - u * h - ((t * 0.6 + i * 0.3) % 1) * h * 0.2; j ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); } c.restore(); }
  /* a ring of single flames on a floor ellipse round (X, Y): back ones first */
  function fring(c, X, Y, r, n, h, t, a, spin, lean) { const L = []; for (let i = 0; i < n; i++) { const b = i / n * TAU + (spin || 0); L.push([Math.sin(b), b, i]); } L.sort((p, q) => p[0] - q[0]); for (const [, b, i] of L) { const dep = 0.78 + 0.22 * Math.sin(b), hh = h * dep * (0.82 + 0.18 * Math.sin(t * 7 + i * 1.9)); K.flame(c, X + Math.cos(b) * r, Y + Math.sin(b) * r * H.GY, hh * 0.5, hh, t, i * 1.3, Math.cos(b) * hh * (lean || 0.15), a, true); } }
  /* a firework burst at screen (X, Y): drooping radial streaks of sparks with bright heads, u 0..1 */
  function firework(c, X, Y, r, u, n, t, a, seed) { if (u <= 0 || u >= 1) return; const e = H.ease.out(u), k = (1 - u) * a; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 0; i < n; i++) { const b = i / n * TAU + seed, rr = r * e * (0.85 + 0.15 * rnd(i + seed)), dx = Math.cos(b), dy = Math.sin(b), dr = u * u * r * 0.35, hx = X + dx * rr, hy = Y + dy * rr * 0.8 + dr, tx = X + dx * rr * 0.55, ty = Y + dy * rr * 0.44 + dr * 0.5;
      c.strokeStyle = H.rgba(i % 3 ? P.org : P.gold, 0.7 * k); c.lineWidth = 2.5; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + hx) / 2, (ty + hy) / 2 - r * 0.05, hx, hy); c.stroke(); c.fillStyle = H.rgba(i % 2 ? P.wht : P.yel, k); c.beginPath(); c.arc(hx, hy, 2.2 + 1.5 * (1 - u), 0, TAU); c.fill(); }
    c.restore(); K.glow(c, X, Y, r * (0.6 + e * 0.6), P.org, 0.6 * k); K.glow(c, X, Y, r * 0.4, P.yel, 0.7 * k * (1 - u)); }

  /* ================= F-U01 Armageddon (Super Armageddon at Celestial) ================= */
  // (Phoenix of the Turning Sky was retired: the old file still registers it, so drop it here)
  delete ELEM_IMPL.fire.ult.turningsky;
  const SMOKE_D = 'rgba(44,28,24,';
  /* a fire tornado standing at screen (X, Y): Ht px tall, rb its radius at the ground, rt at the top, spin its turn, sway
     its lean (px at the top), a its alpha, lite a cheaper build. Drawn as a volume, back to front: the far halves of its
     stacked flame bands (dark, behind), the far spiral streaks and orbiting debris, the white-hot core column, then the
     near halves (bright, lit on the left, shaded on the right), the near streaks and debris, flames licking off its flanks
     and crown, smoke boiling off the top. */
  function tornado(c, X, Y, T, Ht, rb, rt, spin, sway, t, a, lite, seed) {
    if (!(a > 0.01) || Ht < 4) return; const NB = lite ? 9 : 13, RY = 0.34, s0 = seed || 0;
    const ax = u => X + sway * u * u + Math.sin(t * 2.3 + u * 4 + s0) * rb * 0.35 * u, ay = u => Y - Ht * u, rr = u => rb + (rt - rb) * Math.pow(u, 1.35);
    const bandW = Ht / NB * 1.5;
    K.glow(c, ax(0.5), ay(0.5), Math.max(rt * 1.6, Ht * 0.6), P.org, (lite ? 0.28 : 0.55) * a); K.glow(c, ax(0.15), ay(0.15), rb * 3, P.yel, 0.4 * a);
    c.save(); c.globalAlpha = a; c.lineCap = 'butt';
    const band = (j, front) => { const u = (j + 0.5) / NB, cx = ax(u), cy = ay(u), r = rr(u), w = bandW * (0.75 + 0.35 * u), g = c.createLinearGradient(cx - r, 0, cx + r, 0);
      if (front) { g.addColorStop(0, P.yel); g.addColorStop(0.22, P.amb); g.addColorStop(0.52, P.org); g.addColorStop(0.8, P.red); g.addColorStop(1, '#4A0E06'); }
      else { g.addColorStop(0, P.amb); g.addColorStop(0.4, P.red); g.addColorStop(1, '#3A0C06'); }
      c.save(); c.translate(cx, cy); c.scale(1, RY); c.strokeStyle = g; c.lineWidth = w / RY * 0.62; c.globalAlpha = a * (front ? 0.8 : 0.85); c.beginPath(); if (front) c.arc(0, 0, r, 0.02, Math.PI - 0.02); else c.arc(0, 0, r, Math.PI, TAU); c.stroke();
      // the streaks of flame racing round it: dashes riding the band, brighter in front
      c.globalCompositeOperation = 'lighter'; c.setLineDash([r * 0.5, r * 0.35]); c.lineDashOffset = -(spin * (1.6 - u * 0.6) * r) % (r * 0.85); c.strokeStyle = H.rgba(front ? P.yel : P.org, (front ? 0.55 : 0.25) * (lite ? 0.6 : 1)); c.lineWidth = w / RY * 0.22; c.beginPath(); if (front) c.arc(0, 0, r * 1.02, 0.1, Math.PI - 0.1); else c.arc(0, 0, r * 0.98, Math.PI + 0.1, TAU - 0.1); c.stroke(); c.setLineDash([]); c.restore(); };
    /* the spiral flame streaks wrapping it with perspective: split by which side of the funnel they are on */
    const spiral = front => { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let k = 0; k < (lite ? 2 : 3); k++) { let open = false; c.strokeStyle = H.rgba(front ? P.yel : P.red, front ? 0.75 : 0.4); c.lineWidth = Math.max(1.5, rt * 0.09); c.beginPath();
        for (let q = 0; q <= 26; q++) { const u = q / 26, th = spin * 1.3 + u * TAU * 1.6 + k * TAU / 3, sn = Math.sin(th), on = front ? sn > 0 : sn <= 0, px = ax(u) + Math.cos(th) * rr(u) * 1.04, py = ay(u) + sn * rr(u) * RY * 1.04; if (on) { open ? c.lineTo(px, py) : c.moveTo(px, py); open = true; } else open = false; } c.stroke(); } c.restore(); };
    /* debris and embers orbiting it, climbing and flung out near the top */
    const debris = front => { for (let i = 0; i < (lite ? 6 : 12); i++) { const u = ((i * 0.37 + t * 0.35 + s0 * 0.1) % 1), th = spin * 1.8 + i * 2.4, sn = Math.sin(th); if ((sn > 0) !== front) continue; const r = rr(u) * (1.12 + 0.3 * u * u), px = ax(u) + Math.cos(th) * r, py = ay(u) + sn * r * RY, sz = T * (0.07 + 0.05 * ((i * 7) % 3));
        c.save(); c.globalAlpha = a * (1 - u * 0.4); c.translate(px, py); c.rotate(th * 2); if (i % 3 === 0) { c.fillStyle = P.char; c.strokeStyle = H.rgba(P.org, 0.8); c.lineWidth = 1; H.poly(c, [[-sz, -sz * 0.6], [sz, -sz * 0.3], [sz * 0.5, sz * 0.7], [-sz * 0.8, sz * 0.4]]); c.fill(); c.stroke(); } else { c.fillStyle = i % 2 ? P.yel : P.org; c.beginPath(); c.arc(0, 0, sz * 0.6, 0, TAU); c.fill(); } c.restore(); } };
    for (let j = NB - 1; j >= 0; j--) band(j, false); spiral(false); debris(false);
    // the funnel's body: a continuous volume of fire, lit on the left, deep red on its shaded right flank
    { const L_ = [], R_ = []; for (let q = 0; q <= 12; q++) { const u = q / 12, cx = ax(u), cy = ay(u), r = rr(u) * 0.96; L_.push([cx - r, cy]); R_.unshift([cx + r, cy]); } const top = ay(1), g = c.createLinearGradient(ax(0.5) - rt, 0, ax(0.5) + rt, 0); g.addColorStop(0, H.rgba(P.amb, 0.88)); g.addColorStop(0.3, H.rgba(P.org, 0.8)); g.addColorStop(0.65, H.rgba(P.red, 0.8)); g.addColorStop(1, H.rgba('#2E0904', 0.88));
      H.poly(c, L_.concat([[ax(1) + rt * 0.0, top - rt * RY * 0.3]], R_)); c.fillStyle = g; c.fill(); const gv = c.createLinearGradient(0, Y, 0, top); gv.addColorStop(0, H.rgba(P.wht, 0.55)); gv.addColorStop(0.35, H.rgba(P.yel, 0.2)); gv.addColorStop(1, H.rgba(P.dred, 0.25)); if (!lite) { c.globalCompositeOperation = 'lighter'; c.fillStyle = gv; c.fill(); c.globalCompositeOperation = 'source-over'; }
      c.strokeStyle = H.rgba(P.dred, 0.55); c.lineWidth = 1.5; H.poly(c, R_, false); c.stroke(); c.strokeStyle = H.rgba(P.wht, 0.45); H.poly(c, L_, false); c.stroke(); }
    // the white-hot core column, swaying with the funnel
    { const pts = []; for (let q = 0; q <= 8; q++) { const u = q / 8 * 0.92; pts.push([ax(u), ay(u)]); } c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; H.ribbon(c, pts, rb * 1.1, H.rgba(P.org, 0.45), null, u => 0.6 + 0.8 * u); H.ribbon(c, pts, rb * 0.6, H.rgba(P.yel, 0.7), null, u => 0.7 + 0.6 * u); H.ribbon(c, pts, rb * 0.25, H.rgba(P.wht, 0.9), null, u => 0.8 + 0.5 * u); c.restore(); }
    for (let j = 0; j < NB; j++) band(j, true); spiral(true); debris(true);
    c.restore();
    // flames licking off both flanks (leaning outward) and a crown of flame round the rim
    const step = lite ? 2 : 1; for (let j = 1; j < NB; j += step + (lite ? 0 : (j > NB * 0.6 ? 0 : 1))) { const u = (j + 0.5) / NB, cx = ax(u), cy = ay(u), r = rr(u); for (const sd of [-1, 1]) { if (lite && (j % 4 === 1) === (sd > 0)) continue; K.flame(c, cx + sd * r * 0.97, cy + bandW * 0.3, r * 0.42 + T * 0.12, (r * 0.7 + T * 0.35) * (0.8 + 0.2 * Math.sin(t * 9 + j * 1.7 + sd)), t, j * 2.1 + sd + s0, sd * r * 0.5, a * 0.95, true); } }
    const NC = lite ? 3 : 6; for (let i = 0; i < NC; i++) { const th = spin * 1.1 + i / NC * TAU, sn = Math.sin(th), cx = ax(1), cy = ay(1), r = rr(1); K.flame(c, cx + Math.cos(th) * r * 0.85, cy + sn * r * RY, rt * 0.4, rt * (0.8 + 0.3 * Math.sin(t * 7 + i)), t, i * 3 + s0, Math.cos(th) * rt * 0.4, a * (sn > 0 ? 0.95 : 0.6), true); }
    // smoke boiling off the top
    c.save(); for (let i = 0; i < (lite ? 3 : 5); i++) { const u = ((t * 0.4 + i / 5 + s0 * 0.07) % 1), px = ax(1) + Math.sin(i * 2.1 + t) * rt * (0.4 + u), py = ay(1) - u * Ht * 0.35, r = rt * (0.35 + u * 0.6); c.globalAlpha = a * 0.2 * Math.sin(u * Math.PI); c.fillStyle = SMOKE_D + '1)'; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill(); } c.restore();
    shimmer(c, ax(1), ay(1) - T * 0.2, rt * 1.2, T * 1.6, t, a);
  }
  /* where it touches down: a swirling ring of fire and embers on the floor */
  function touchdown(c, X, Y, T, rb, spin, t, a, lite) { K.floorLight(c, X, Y, rb * 4.5, 0.75 * a); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const r = rb * (1.4 + k * 0.7); c.strokeStyle = H.rgba(k ? P.org : P.yel, (0.65 - k * 0.15) * a); c.lineWidth = Math.max(1.5, T * (0.09 - k * 0.02)); for (let i = 0; i < 3; i++) { const b = spin * (1.6 - k * 0.3) + i * TAU / 3 + k; c.beginPath(); c.ellipse(X, Y, r, r * H.GY, 0, b, b + 1.3); c.stroke(); } } c.restore();
    if (!lite) for (let i = 0; i < 6; i++) { const b = spin * 1.2 + i / 6 * TAU, sn = Math.sin(b); if (sn < 0) K.flame(c, X + Math.cos(b) * rb * 2, Y + sn * rb * 2 * H.GY, T * 0.25, T * 0.5 * (0.8 + 0.2 * Math.sin(t * 9 + i)), t, i * 1.7, -Math.sin(b) * T * 0.2, a * 0.85, true); } }

  // F-U01 Armageddon: a spinning ember ring flares at the aim and a towering tornado of fire rises out of it: stacked bands of flame turning round a white-hot core, spiral streaks, orbiting debris and embers, flames licking off its flanks, smoke boiling off the top; it roams toward the nearest monsters, dragging them into its burning spiral, scorching and setting alight the ground it crosses, then lifts away into embers and smoke in a last flare
  // Evolution: one tornado through stages 1-6, its damage growing each stage (evoK) and a touch taller and wider; at Celestial it becomes Super Armageddon: four great tornadoes wander the battlefield on their own paths, the damage split between them, leaving scorched, cracked and glowing earth, smoke columns and debris.
  U.armageddon = (C, h) => { H = h; K = FK.bind(H); const me = H.me, ev = K.evo(C), sup = ev >= 7, N = sup ? 4 : 1, gs = 1 + 0.035 * (ev - 1), D = C.base * C.K * K.evoK(C), FORM = 0.8, LIFE = 5.6, END = LIFE - 1.0, TICK = 0.3, NT = Math.round((END - FORM) / TICK);
    const tickD = 9.5 / NT * D / N, flareD = 1.5 * D / N, a0 = C.a;
    H.X.banner(sup ? 'SUPER ARMAGEDDON' : 'ARMAGEDDON', '', C.col, 1.4); H.X.sfx.hum();
    // where they rise: one at the aim (kept clear of you); four spread round it at Celestial
    const tws = []; for (let i = 0; i < N; i++) { let x = C.tx, y = C.ty; if (sup) { const b = a0 + Math.PI / 4 + i * Math.PI / 2; x += Math.cos(b) * 2.6; y += Math.sin(b) * 2.6; }
      const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < 2.6) { const b = d > 0.1 ? Math.atan2(dy, dx) : a0; x = me.x + Math.cos(b) * 2.6; y = me.y + Math.sin(b) * 2.6; } const w = H.walk(x, y);
      tws.push({ x: w.x, y: w.y, hd: Math.atan2(w.y - me.y, w.x - me.x) + (i % 2 ? 0.6 : -0.6), spin: i * 1.7, tick: FORM + i * 0.07, trailT: 0, fireT: 0.3, trail: [], seed: i * 3.7, al: 1 }); }
    for (const tw of tws) H.warn(tw.x, tw.y, sup ? 1.6 : 2.0, FORM, C.col);
    const HT = (sup ? 4.2 : 4.6) * gs, RB = (sup ? 0.32 : 0.38) * gs, RT = (sup ? 1.35 : 1.6) * gs, RHIT = (sup ? 1.6 : 1.9) * gs, RPULL = 3.2 * gs, SPD = sup ? 1.5 : 1.15;
    const F = H.add({ life: LIFE + 0.6, x: C.tx, y: C.ty,
      update(dt, f) { const t = f.t, live = H.living();
        for (const tw of tws) { tw.spin += dt * (6 + 3 * cl(t / FORM)); if (t > LIFE) continue;
          if (t > FORM && t < END) { // roam: toward the nearest monster, away from you and from walls, wandering at Celestial
            let tx = 0, ty = 0, best = null, bd = 7; for (const m of live) { const d = Math.hypot(m.x - tw.x, m.y - tw.y); if (d < bd) { bd = d; best = m; } }
            if (best && bd > 0.6) { tx += (best.x - tw.x) / bd; ty += (best.y - tw.y) / bd; }
            if (sup || !best) { tw.hd += (Math.sin(t * 1.3 + tw.seed) * 1.6) * dt; tx += Math.cos(tw.hd) * (sup ? 1.0 : 0.6); ty += Math.sin(tw.hd) * (sup ? 1.0 : 0.6); }
            for (const o of tws) if (o !== tw) { const d = Math.hypot(tw.x - o.x, tw.y - o.y); if (d < 2.4 && d > 0.01) { tx += (tw.x - o.x) / d * 0.8; ty += (tw.y - o.y) / d * 0.8; } }
            if (tw.y > me.y - 0.5 && tw.y < me.y + HT + 0.5 && Math.abs(tw.x - me.x) < RT + 1.4) tx += (tw.x >= me.x ? 1 : -1) * 4;   /* (never stand in front of you: its tall funnel would hide you) */
            const pd = Math.hypot(tw.x - me.x, tw.y - me.y); if (pd < 3.5) { const k = (3.5 - pd) / 3.5 * 6; tx += (tw.x - me.x) / (pd || 1) * k; ty += (tw.y - me.y) / (pd || 1) * k; }
            const tl = Math.hypot(tx, ty) || 1, nx = tw.x + tx / tl * SPD * dt, ny = tw.y + ty / tl * SPD * dt, w = H.walk(nx, ny); if (Math.hypot(w.x - nx, w.y - ny) < 0.01) { tw.x = nx; tw.y = ny; } else tw.hd += Math.PI * 0.6;
            for (const m of live) { const d = Math.hypot(m.x - tw.x, m.y - tw.y); if (d < RPULL && d > 0.35) H.pull(m, tw.x, tw.y, (1.6 - d / RPULL) * dt * 1.2); }
            if (t >= tw.tick) { tw.tick += TICK; H.hitArea(tw.x, tw.y, RHIT, tickD, C.dmgO({ kb: 0, burn: 1 })); K.sparks(tw.x, tw.y - 0.5, 3, 5); }
            tw.trailT -= dt; if (tw.trailT <= 0) { tw.trailT = 0.22; tw.trail.push({ x: tw.x, y: tw.y, t, s: Math.random() * 9 }); if (sup && Math.random() < 0.5) K.smoke(tw.x, tw.y, 2, 0.6); if (sup && Math.random() < 0.4) K.flakes(tw.x, tw.y, 2); }
            tw.fireT -= dt; if (tw.fireT <= 0) { tw.fireT = sup ? 0.75 : 0.6; H.fire(tw.x, tw.y, sup ? 0.9 : 1.0, 2.0, C.base * 0.3, 'fire'); } }
          const up = cl((t - END) / (LIFE - END)), al = t < FORM ? cl(t / FORM) : 1 - up; K.aura(tw.x, tw.y, RB * 2.5, dt, sup ? 10 : 22, 0.2); if (al > 0.2) K.aura(tw.x, tw.y - HT * 0.5, RT * 0.8, dt, sup ? 5 : 10, 0); lit(f, 'w' + tw.seed, tw.x, tw.y - 1, (sup ? 3.6 : 4.5) * Math.max(0.3, al), dt);
          if (up > 0 && Math.random() < 10 * dt * H.Q()) K.smoke(tw.x, tw.y - HT * (0.5 + up), 1, RT * 0.6); } },
      drawUnder(c, f, X, Y, T) { const t = f.t, k = Math.min(1, f.life / 0.8);
        for (const tw of tws) { // scorched earth along the trail: charred, still glowing, cracked at Celestial
          for (const p of tw.trail) { const heat = Math.max(0.08, 1 - (t - p.t) / 2.2), PX = H.sx(p.x), PY = H.sy(p.y); K.scorch(c, PX, PY, T * (sup ? 1.0 : 1.15), 0.8 * k, heat, p.s);
            if (sup) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.6 * heat * k); c.lineWidth = 1.6; c.beginPath(); for (let i = 0; i < 3; i++) { const b = p.s + i * 2.1; c.moveTo(PX, PY); c.lineTo(PX + Math.cos(b) * T * 0.5, PY + Math.sin(b) * T * 0.28); c.lineTo(PX + Math.cos(b + 0.4) * T * 0.9, PY + Math.sin(b + 0.4) * T * 0.5); } c.stroke(); c.restore(); } }
          const TX = H.sx(tw.x), TY = H.sy(tw.y), form = cl(t / FORM), up = cl((t - END) / (LIFE - END)), al = (1 - up) * k;
          if (t < FORM + 0.2) { const u = cl(t / FORM); K.shockRing(c, TX, TY, T * (0.6 + 1.6 * u), 0.8 * (1 - u * 0.5)); fring(c, TX, TY, T * (1.6 - u * 0.8), 8, T * 0.6 * Math.sin(u * Math.PI), t, 0.9, tw.spin * 0.3, 0.3); }
          if (form > 0) { H.softShadow(c, TX, TY, T * RT * 1.2, 0.3 * al); touchdown(c, TX, TY, T, T * RB * (0.6 + 0.4 * form) * (1 + up), tw.spin, t, al * form, sup); } } },
      draw(c, f, X, Y, T, gt) { const t = f.t, k = Math.min(1, f.life / 0.6);
        const order = tws.slice().sort((p, q) => p.y - q.y);
        for (const tw of order) { const TX = H.sx(tw.x), TY = H.sy(tw.y), form = H.ease.out(cl((t - 0.15) / (FORM + 0.2))), up = cl((t - END) / (LIFE - END)), ht = T * HT * form * (1 + up * 0.5), al = k * (1 - up) * Math.min(1, form * 1.5);
          const PXs = H.sx(me.x), PYs = H.sy(me.y) - T * 0.45, pu = (TY - PYs) / Math.max(1, ht), cov = pu > -0.05 && pu < 1.05 ? cl((Math.abs(PXs - TX) - T * (RB + (RT - RB) * Math.pow(cl(pu), 1.35)) - T * 0.2) / (T * 0.8)) : 1, gd = Math.max(0.22, Math.min(cov, petGuard(TX, TY - T * 0.8, T, T * RB * 1.5)));
          tornado(c, TX, TY - up * T * 1.5, T, ht, T * RB * (1 + up), T * RT * (0.5 + 0.5 * form) * (1 + up * 0.6), tw.spin, Math.sin(t * 0.9 + tw.seed) * T * 0.8, gt, al * gd, sup, tw.seed);
          if (up > 0 && up < 0.6) { const v = up / 0.6; K.glow(c, TX, TY - ht * 0.6, T * RT * 2.5, P.yel, 0.6 * (1 - v)); K.shockRing(c, TX, TY, T * (1 + 2.5 * v), 1 - v); } } } });
    for (const tw of tws) H.X.after(FORM, () => { K.blast(tw.x, tw.y, 1.6, 1.2); H.X.ring(tw.x, tw.y, 0.3, 2.2, 0.4, P.org, 0.5); H.X.sfx.whoosh(); });
    H.X.after(END, () => { for (const tw of tws) { H.hitArea(tw.x, tw.y, RHIT + 0.8, flareD, C.dmgO({ kb: 4, burn: 1 })); K.blast(tw.x, tw.y, 2.0, sup ? 1.2 : 1.8); K.embers(tw.x, tw.y - 2, 16, { v: 4, up: 4 }); K.smoke(tw.x, tw.y - 2, 6, 1); } H.X.flash(0.18, '#FFD9A0'); H.X.sfx.crash(); H.X.shake(sup ? 12 : 8, 0.3); });
    return F; };

  /* ================= F-U02 Festival of a Thousand Embers ================= */
  /* a paper fire lantern at screen (X, Y), r its half height: paper lit through by its flame (a hot left, a shaded right),
     bamboo ribs, lacquered caps with gold rims, a tassel; open 0..1 drops its bottom and pours a jet of fire */
  function lantern(c, X, Y, r, open, heat, t, seed, a) {
    if (!(a > 0.01) || r < 2) return; const w = r * 0.8, g = 0.8 + 0.2 * Math.sin(t * 7 + seed * 1.3), sw = Math.sin(t * 2.2 + seed) * 0.07, ob = 1 + open * 0.35;
    K.glow(c, X, Y, r * 2.8, P.org, 0.42 * heat * g * a);
    c.save(); c.translate(X, Y); c.rotate(sw); c.globalAlpha = a;
    c.strokeStyle = H.rgba(P.char, 0.8); c.lineWidth = 1; c.beginPath(); c.moveTo(0, -r * 1.05); c.lineTo(0, -r * 1.6); c.stroke();
    const body = () => { c.beginPath(); c.moveTo(-w * 0.5, -r * 0.88); c.bezierCurveTo(-w * 1.18, -r * 0.7, -w * 1.18, r * 0.62, -w * 0.5 * ob, r * 0.88); c.lineTo(w * 0.5 * ob, r * 0.88); c.bezierCurveTo(w * 1.18, r * 0.62, w * 1.18, -r * 0.7, w * 0.5, -r * 0.88); c.closePath(); };
    const gr = c.createLinearGradient(-w, -r * 0.4, w, r * 0.4); gr.addColorStop(0, heat > 0.5 ? P.wht : P.yel); gr.addColorStop(0.28, P.amb); gr.addColorStop(0.62, P.red); gr.addColorStop(1, P.dred);
    body(); c.fillStyle = gr; c.fill();
    c.save(); body(); c.clip(); c.globalCompositeOperation = 'lighter'; K.glow(c, -w * 0.15, r * 0.25, r * 1.0, P.yel, 0.6 * heat * g); c.globalCompositeOperation = 'source-over';
    c.lineWidth = 1.2; for (let i = -3; i <= 3; i++) { c.strokeStyle = H.rgba(P.dred, i > 0 ? 0.5 : 0.3); c.beginPath(); c.moveTo(i * w * 0.17, -r * 0.88); c.quadraticCurveTo(i * w * 0.36, 0, i * w * 0.17 * ob, r * 0.88); c.stroke(); }
    c.strokeStyle = H.rgba(P.gold, 0.7); c.lineWidth = 1.4; for (const yy of [-0.62, 0.62]) { c.beginPath(); c.moveTo(-w, r * yy); c.quadraticCurveTo(0, r * yy + r * 0.12, w, r * yy); c.stroke(); }
    c.fillStyle = H.rgba(P.wht, 0.35); c.beginPath(); c.ellipse(-w * 0.45, -r * 0.25, w * 0.12, r * 0.4, 0.15, 0, TAU); c.fill(); c.restore();
    body(); c.strokeStyle = H.line(); c.lineWidth = 1.5; c.stroke();
    const cap = (yy, ww, hh, al) => { c.globalAlpha = a * al; const gc = c.createLinearGradient(-ww / 2, 0, ww / 2, 0); gc.addColorStop(0, '#7A3A26'); gc.addColorStop(0.4, P.crust); gc.addColorStop(1, P.char); c.fillStyle = gc; c.fillRect(-ww / 2, yy, ww, hh); c.strokeStyle = H.line(); c.lineWidth = 1.2; c.strokeRect(-ww / 2, yy, ww, hh); c.strokeStyle = H.rgba(P.gold, 0.85); c.lineWidth = 1; c.beginPath(); c.moveTo(-ww / 2 + 1, yy + hh * 0.5); c.lineTo(ww / 2 - 1, yy + hh * 0.5); c.stroke(); c.globalAlpha = a; };
    cap(-r * 1.04, w * 1.05, r * 0.17, 1); if (open < 1) cap(r * 0.86 + open * r * 0.9, w * 1.0, r * 0.15, 1 - open);
    if (open < 0.4) { const ty = r * 1.01; c.strokeStyle = H.rgba(P.red, 0.9); c.lineWidth = 1.2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 2, ty); c.lineTo(i * 3 + Math.sin(t * 3 + seed + i) * 2, ty + r * 0.5); c.stroke(); } c.fillStyle = P.gold; c.beginPath(); c.arc(0, ty + 1, 2, 0, TAU); c.fill(); }
    c.restore();
    if (open > 0) { sflame(c, X, Y + r * 0.85, Math.PI / 2, w * 0.9 * open, r * 1.7 * open * g, t, seed, 0.95 * a); K.glow(c, X, Y + r * 1.4, r * 1.4, P.yel, 0.4 * open * a); }
  }
  // F-U02 Festival of a Thousand Embers: shaded paper lanterns rise in three turning tiers over the aim and open in turn, each dropping a fire shell on a marked spot; the rest gather into a garlanded canopy and burst together as a great firework into slow-falling ember ribbons
  // Evolution: more lanterns (6 to 12) and more shells (4 to 8, the shell damage split between them), a wider festival; at Celestial three more fireworks burst over the area as a finale.
  U.embers = (C, h) => { H = h; K = FK.bind(H); const x = C.tx, y = C.ty, ev = K.evo(C), R = 3.6 * C.K * (1 + 0.03 * (ev - 1)), N = K.evoN(C, 6, 12), nS = K.evoN(C, 4, 8), fin = ev >= 7, D = C.base * C.K * K.evoK(C), norm = fin ? 14 / 15.8 : 1, GATH = 2.9, BURST = 3.45, CZ = 3.3;
    const lans = []; for (let i = 0; i < N; i++) { const tier = i % 3; lans.push({ tier, b: i / N * TAU + tier, r: (1.25 + tier * 0.95) * R / 3.6, z: 1.3 + tier * 0.65, open: 0, gone: false, x, y, cz: 0, spot: -1, shell: null }); }
    H.warn(x, y, R, 1.0, C.col); H.X.banner('FESTIVAL OF A THOUSAND EMBERS', '', C.col, 1.4); H.X.sfx.hum();
    const spots = []; const tg = H.sortNear(x, y).filter(m => Math.hypot(m.x - x, m.y - y) < R + 0.5); for (let i = 0; i < nS; i++) { const m = tg[i % Math.max(1, tg.length)], b = i / nS * TAU + 0.4, r = (1.2 + (i % 2) * 1.4) * R / 3.6; spots.push({ x: m ? m.x + (Math.random() - 0.5) * 0.6 : x + Math.cos(b) * r, y: m ? m.y + (Math.random() - 0.5) * 0.6 : y + Math.sin(b) * r, hitT: 0 }); }
    const opens = spots.map((s, i) => 1.0 + i * (1.35 / Math.max(1, nS - 1))), finals = fin ? [0, 1, 2].map(i => { const b = i / 3 * TAU + 0.9; return { x: x + Math.cos(b) * R * 0.55, y: y + Math.sin(b) * R * 0.55, t0: BURST + 0.35 + i * 0.22 }; }) : [];
    const F = H.add({ life: fin ? 5.5 : 4.8, x, y, gather: 0,
      update(dt, f) { const form = H.ease.out(cl(f.t / 0.9)); f.gather = cl((f.t - GATH) / 0.5);
        lans.forEach((l, i) => { if (l.gone) return; l.b += dt * (0.5 + l.tier * 0.25) * (l.tier % 2 ? -1 : 1); const rr = l.r * form * (1 - f.gather * 0.75), zz = (l.z * form + 0.4 * (1 - form) + Math.sin(f.t * 2 + i) * 0.1) * (1 - f.gather) + f.gather * CZ; l.x = x + Math.cos(l.b) * rr; l.y = y + Math.sin(l.b) * rr * H.GY; l.cz = zz;
          if (l.open > 0 && l.open < 1) l.open = Math.min(1, l.open + dt * 4); if (l.open >= 1 && f.t > l.openT + 0.6) l.gone = true;
          if (Math.random() < (l.open > 0 ? 6 : 1.2) * dt * H.Q()) H.P({ kind: 'ember', x: l.x + (Math.random() - 0.5) * 0.3, y: l.y - l.cz + 0.3, vx: (Math.random() - 0.5) * 0.6, vy: l.open > 0 ? 1.5 : -0.6, g: l.open > 0 ? 3 : -0.6, life: 0.6, max: 0.6, size: 3, color: Math.random() < 0.5 ? P.yel : P.org }); });
        for (const s of spots) if (s.hitT && f.t < s.hitT + 1.2) K.aura(s.x, s.y, 0.6, dt, 6, 0);
        if (f.t < BURST) lit(f, 'l', x, y - 1.6, R * 0.9 * cl(f.t * 1.5), dt); else if (f.t < BURST + 1.6) { K.aura(x, y, R * 0.6, dt, 16, 0); lit(f, 'l', x, y - 1, R * 1.1, dt); } for (const s of spots) if (s.hitT && f.t < s.hitT + 0.8) lit(f, 's' + s.hitT, s.x, s.y, 2, dt); },
      drawUnder(c, f, X, Y, T) { const t = f.t, k = H.fade(f, 0.5, 0.8);
        for (const l of lans) if (!l.gone) K.floorLight(c, H.sx(l.x), H.sy(l.y), T * (0.7 + l.open * 0.5), (0.22 + 0.3 * l.open) * k * (1 - f.gather));
        for (const s of spots) if (s.hitT && t > s.hitT) K.scorch(c, H.sx(s.x), H.sy(s.y), T * 1.2, 0.8 * k, Math.max(0.08, 1 - (t - s.hitT) / 1.4), s.x * 3);
        if (t > BURST) { const u = cl((t - BURST) / 0.5); K.scorch(c, X, Y, T * R * 0.75 * H.ease.out(u), 0.75 * k, Math.max(0.1, 1 - (t - BURST) / 1.4), 4); K.floorLight(c, X, Y, T * R, 0.5 * (1 - cl((t - BURST) / 1.2))); }
        for (const q of finals) if (t > q.t0 + 0.3) K.scorch(c, H.sx(q.x), H.sy(q.y), T * 1.4, 0.7 * k, Math.max(0.1, 1 - (t - q.t0 - 0.3) / 1.0), q.x); },
      draw(c, f, X, Y, T) { const t = f.t, k = Math.min(1, f.life / 0.6), CY = Y - CZ * T;
        // the canopy: garlands of fire strung between the gathering lanterns, a hot knot at its heart
        if (f.gather > 0 && t < BURST) { const live = lans.filter(l => !l.gone); for (let i = 0; i < live.length; i++) { const p = live[i], q = live[(i + 1) % live.length], ax = H.sx(p.x), ay = H.sy(p.y) - p.cz * T, bx = H.sx(q.x), by = H.sy(q.y) - q.cz * T, pts = []; for (let j = 0; j <= 6; j++) { const u = j / 6; pts.push([lerp(ax, bx, u), lerp(ay, by, u) + Math.sin(u * Math.PI) * T * 0.35]); } stream(c, pts, T * 0.1, 0.8 * f.gather * k); }
          K.fireball(c, X, CY, T * 0.55 * f.gather, t, 2, f.gather * k); shimmer(c, X, CY - T * 0.4, T * 1.2, T * 1.4, t, f.gather); }
        const list = lans.filter(l => !l.gone).sort((p, q) => p.y - q.y); for (const l of list) { const LX = H.sx(l.x), LY = H.sy(l.y) - l.cz * T; lantern(c, LX, LY, T * 0.5 * (1 - f.gather * 0.25), l.open, 0.65 + 0.35 * l.open, t, lans.indexOf(l) * 1.7, k * petGuard(LX, LY, T) * (l.open >= 1 ? cl(1 - (t - l.openT - 0.3) / 0.3) : 1)); }
        // the fire shells falling to their spots
        for (const l of lans) { const sh = l.shell; if (!sh) continue; const u = (t - sh.t0) / 0.32; if (u <= 0 || u >= 1) continue; const s = spots[l.spot], e = H.ease.in(u), hx = lerp(sh.x, s.x, e), hy = lerp(sh.y, s.y, e), pts = []; for (let j = 0; j <= 5; j++) { const v = Math.max(0, e - j * 0.06); pts.unshift([H.sx(lerp(sh.x, s.x, v)), H.sy(lerp(sh.y, s.y, v))]); } stream(c, pts, T * 0.22, k, v => 0.2 + 0.8 * v); H.core(c, H.sx(hx), H.sy(hy), T * 0.22, P.org, P.wht, k); }
        for (const s of spots) if (s.hitT && t > s.hitT && t < s.hitT + 0.5) { const u = (t - s.hitT) / 0.5, SX = H.sx(s.x), SY = H.sy(s.y); K.shockRing(c, SX, SY, T * (0.4 + 1.1 * H.ease.out(u)), 1 - u); fring(c, SX, SY, T * 0.55 * (0.6 + u), 5, T * 0.9 * (1 - u), t, (1 - u) * k * petGuard(SX, SY - T * 0.4, T), t, 0.3); firework(c, SX, SY - T * 0.6, T * 1.1, u, 14, t, k, s.x); }
        // the great burst, and the slow-falling ribbons
        if (t > BURST) { const u = cl((t - BURST) / 1.1); firework(c, X, CY, T * R * 0.95, u, 30, t, k, 0.2); firework(c, X, CY, T * R * 0.55, cl(u * 1.4), 18, t, k, 1.1); if (u < 0.5) K.shockRing(c, X, Y, T * R * H.ease.out(u * 2), 1 - u * 2);
          for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.3, rr = T * R * 0.75 * H.ease.out(u), ox = X + Math.cos(b) * rr, oy = CY + Math.sin(b) * rr * 0.6, pts = []; for (let j = 0; j <= 6; j++) { const v = j / 6; pts.push([ox + Math.sin(v * 5 + t * 2 + i) * T * 0.25, oy + v * T * 2.4 * u]); } stream(c, pts, T * 0.1, (1 - u) * k * 0.9, v => 1 - v * 0.7); } }
        for (const q of finals) { const u = cl((t - q.t0) / 0.9); if (u > 0 && u < 1) { const QX = H.sx(q.x), QY = H.sy(q.y); firework(c, QX, QY - T * 2.6, T * 1.9, u, 20, t, k, q.x); if (u < 0.35) { const v = u / 0.35; H.core(c, QX, lerp(QY - T * 2.6, QY, v), T * 0.25, P.org, P.wht, 1 - v * 0.3); } } } } });
    spots.forEach((s, i) => H.X.after(opens[i], () => { const l = lans[i % N]; l.open = 0.01; l.openT = F.t; l.spot = i; l.shell = { t0: F.t + 0.05, x: l.x, y: l.y - l.cz + 0.5 }; H.warn(s.x, s.y, 1.25, 0.37, C.col, () => { s.hitT = F.t; H.hitArea(s.x, s.y, 1.3, 9.6 / nS * D * norm, C.dmgO({ kb: 2, burn: 1 })); K.blast(s.x, s.y, 1.2, 0.8); K.flakes(s.x, s.y, 5); for (let j = 0; j < H.n(10); j++) H.P({ kind: 'star', x: s.x + (Math.random() - 0.5) * 0.6, y: s.y - 0.2, vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 3, g: 6, life: 0.5, max: 0.5, size: 3.5, color: j % 2 ? P.yel : P.wht }); H.X.sfx.crash(); }); H.X.sfx.sparkle && H.X.sfx.sparkle(); }));
    H.X.after(GATH, () => H.X.sfx.hum());
    H.X.after(BURST - 0.35, () => H.warn(x, y, R, 0.35, C.col));
    H.X.after(BURST, () => { for (const l of lans) l.gone = true; H.hitArea(x, y, R, 4.4 * D * norm, C.dmgO({ kb: 5, burn: 1, stun: 0.4 })); K.blast(x, y, R * 0.8, 2); H.X.ring(x, y, 0.3, R, 0.5, P.gold, 0.5); H.X.flash(0.28, '#FFE0B0'); for (let j = 0; j < H.n(36); j++) H.P({ kind: 'petal', x: x + (Math.random() - 0.5) * R * 1.6, y: y - 3 - Math.random() * 1.5, vx: (Math.random() - 0.5) * 1.5, vy: 1.0 + Math.random() * 0.8, life: 1.4, max: 1.4, size: 5, rot: Math.random() * 6, vr: 4, color: j % 3 ? P.org : P.gold }); H.fire(x, y, 1.6, 2.5, C.base * 0.6, 'fire'); H.X.sfx.crash(); H.X.hitstop(0.06); });
    for (const q of finals) H.X.after(q.t0 + 0.3, () => { H.hitArea(q.x, q.y, 1.7, 0.6 * D * norm, C.dmgO({ kb: 3, burn: 1 })); K.blast(q.x, q.y, 1.4, 1); for (let j = 0; j < H.n(12); j++) H.P({ kind: 'star', x: q.x + (Math.random() - 0.5), y: q.y - 2.6 + (Math.random() - 0.5), vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, g: 3, life: 0.8, max: 0.8, size: 3.5, color: j % 2 ? P.gold : P.wht }); H.X.sfx.crash(); });
    return F; };

  /* ================= F-U03 Solar Crucible ================= */
  /* a corona: a sun of radius r at screen (X, Y): turning rays, the fireball, a white heart */
  function sun(c, X, Y, r, t, a) { if (r < 2 || !(a > 0.01)) return; K.glow(c, X, Y, r * 4.2, P.org, 0.5 * a); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; for (let i = 0; i < 12; i++) { const b = i / 12 * TAU + t * 0.8 * (i % 2 ? 1 : -1), l = r * (1.9 + 0.5 * Math.sin(t * 5 + i * 1.7)); c.fillStyle = H.rgba(i % 2 ? P.yel : P.org, 0.35); c.beginPath(); c.moveTo(X + Math.cos(b - 0.12) * r * 0.9, Y + Math.sin(b - 0.12) * r * 0.9); c.lineTo(X + Math.cos(b) * l, Y + Math.sin(b) * l); c.lineTo(X + Math.cos(b + 0.12) * r * 0.9, Y + Math.sin(b + 0.12) * r * 0.9); c.closePath(); c.fill(); } c.restore();
    c.save(); c.globalAlpha = a; for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + t * 1.6; sflame(c, X + Math.cos(b) * r * 0.75, Y + Math.sin(b) * r * 0.75, b * 0.4 - Math.PI / 2 * 0.6, r * 0.6, r * (0.9 + 0.3 * Math.sin(t * 9 + i)), t, i * 1.9, 0.95); }
    const g = c.createRadialGradient(X - r * 0.3, Y - r * 0.35, r * 0.05, X, Y, r); g.addColorStop(0, P.wht); g.addColorStop(0.3, P.yel); g.addColorStop(0.65, P.org); g.addColorStop(0.9, P.red); g.addColorStop(1, P.dred); c.fillStyle = g; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.5); c.lineWidth = Math.max(1, r * 0.12); c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const b = t * (3 + i) + i * 2.1; c.beginPath(); c.arc(X, Y, r * (0.45 + i * 0.16), b, b + 1.4); c.stroke(); } c.restore(); H.core(c, X - r * 0.12, Y - r * 0.15, r * 0.55, P.yel, '#FFFFFF', 0.9 * a); }
  // F-U03 Solar Crucible: a bowl of molten plates (dark crust, glowing seams, a hot inner face) forms over the aim round a small sun with a turning corona; molten streams pour through its gaps onto marked spots, then the plates open and drop the sun as a broad blast whose rolling flame edge cools into black-and-gold flakes
  // Evolution: more plates (6 to 10), more pours (3 to 6, their damage split), a wider blast; at Celestial the sun throws six solar prominences that arc out and land round the blast.
  U.crucible = (C, h) => { H = h; K = FK.bind(H); const x = C.tx, y = C.ty, ev = K.evo(C), R = 3.4 * C.K * (1 + 0.04 * (ev - 1)), Z = 3.0, NP = K.evoN(C, 6, 10), nP = K.evoN(C, 3, 6), DROP = 3.0, HIT = 3.35, fin = ev >= 7, D = C.base * C.K * K.evoK(C), norm = fin ? 11.2 / 13.0 : 1;
    const pours = []; for (let i = 0; i < nP; i++) pours.push(1.1 + i * (1.2 / Math.max(1, nP - 1)));
    H.warn(x, y, R, 1.0, C.col); H.X.banner('SOLAR CRUCIBLE', '', C.col, 1.4); H.X.sfx.hum();
    const spots = []; const tg = H.sortNear(x, y).filter(m => Math.hypot(m.x - x, m.y - y) < R); pours.forEach((t0, i) => { const m = tg[i % Math.max(1, tg.length)], b = i / nP * TAU + 0.7; spots.push({ x: m ? m.x : x + Math.cos(b) * 1.8, y: m ? m.y : y + Math.sin(b) * 1.8, gap: Math.round(i * NP / nP) % NP, hitT: 0 }); });
    const proms = fin ? [0, 1, 2, 3, 4, 5].map(i => { const b = i / 6 * TAU + 0.25; return { x: x + Math.cos(b) * R * 0.9, y: y + Math.sin(b) * R * 0.9, t0: HIT + 0.3 + i * 0.07 }; }) : [];
    const F = H.add({ life: fin ? 5.4 : 4.8, x, y, open: 0, cz: Z + 0.45, pour: -1,
      update(dt, f) { f.open = cl((f.t - 2.75) / 0.4); if (f.t > DROP) f.cz = Math.max(0.2, Z + 0.45 - (f.t - DROP) / (HIT - DROP) * (Z + 0.25)); if (f.t < HIT) { K.aura(x, y - f.cz + 0.2, 0.9, dt, 14, 0); lit(f, 's', x, y - f.cz * 0.6, 3.6 * cl(f.t * 1.2), dt); } else if (f.t < HIT + 1.5) { K.aura(x, y, R * 0.7, dt, 18, 0); lit(f, 's', x, y, R * 1.1, dt); } for (const s of spots) if (s.hitT && f.t < s.hitT + 1) K.aura(s.x, s.y, 0.5, dt, 6, 0); },
      drawUnder(c, f, X, Y, T) { const t = f.t, k = Math.min(1, f.life / 0.7), form = H.ease.out(cl(f.t / 0.9));
        if (f.t < HIT) { const nearer = f.t > DROP ? (f.t - DROP) / (HIT - DROP) : 0; K.floorLight(c, X, Y, T * (1.8 + nearer * 1.5) * form, (0.4 + nearer * 0.4) * form); H.softShadow(c, X, Y, T * 1.5 * form, 0.2 * form); }
        for (const s of spots) if (s.hitT && t > s.hitT) K.scorch(c, H.sx(s.x), H.sy(s.y), T * 1.15, 0.8 * k, Math.max(0.1, 1 - (t - s.hitT) / 1.3), s.x);
        if (t > HIT) { const u = cl((t - HIT) / 0.6); K.scorch(c, X, Y, T * R * H.ease.out(u), 0.85 * k, Math.max(0.1, 1 - (t - HIT) / 1.3), 2); K.floorLight(c, X, Y, T * R * 1.1, 0.6 * (1 - cl((t - HIT) / 1.3))); }
        for (const p of proms) if (t > p.t0 + 0.4) K.scorch(c, H.sx(p.x), H.sy(p.y), T * 1.1, 0.7 * k, Math.max(0.1, 1 - (t - p.t0 - 0.4) / 1.0), p.x); },
      draw(c, f, X, Y, T, t) { const form = H.ease.out(cl(f.t / 0.9)), k = Math.min(1, f.life / 0.6), cy = Y - T * Z, r = T * 1.5 * form, CY = Y - T * f.cz, gd = petGuard(X, cy, T);
        if (f.t < HIT + 0.3) { const fall = cl((f.t - DROP) / 0.6), al = k * gd * (1 - fall);
          // the bowl: plates between a narrow foot ring and a wide rim, each a quad; the back ones show their hot inner face
          const items = []; for (let i = 0; i < NP; i++) { const b0 = i / NP * TAU + (1 - form) * 3, b1 = b0 + TAU / NP * 0.82, bm = (b0 + b1) / 2, ro = r * (1 + f.open * 0.75), rb = r * 0.55, ty = cy - f.open * r * 0.15 + fall * T * 1.5, by = cy + r * 0.62 + fall * T * 1.5, sp = 1 + (1 - form) * 1.4;
            const P4 = [[X + Math.cos(b0) * ro * sp, ty + Math.sin(b0) * ro * 0.42], [X + Math.cos(b1) * ro * sp, ty + Math.sin(b1) * ro * 0.42], [X + Math.cos(b1) * rb * sp, by + Math.sin(b1) * rb * 0.42], [X + Math.cos(b0) * rb * sp, by + Math.sin(b0) * rb * 0.42]]; items.push({ d: Math.sin(bm), P4, i }); }
          const back = items.filter(p => p.d < 0).sort((p, q) => p.d - q.d), front = items.filter(p => p.d >= 0).sort((p, q) => p.d - q.d), heat = 0.5 + 0.5 * cl((f.t - 0.6) / 1.5);
          c.save(); c.globalAlpha = al; for (const p of back) crust(c, p.P4, heat, t, p.i * 3.1, { inner: true }); c.restore();
          // the molten lip and the sun sitting in the bowl
          if (al > 0.01) { c.save(); c.globalAlpha = al; c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.6); c.lineWidth = T * 0.12; c.beginPath(); c.ellipse(X, cy, r * (1 + f.open * 0.75) * 0.95, r * 0.4, 0, Math.PI, TAU); c.stroke(); c.restore(); }
          if (f.t < HIT) sun(c, X, CY, T * 0.62 * form * (1 + cl((f.t - DROP) / 0.35) * 0.25), t, k * Math.max(gd, f.t > DROP ? 1 : 0));
          c.save(); c.globalAlpha = al; for (const p of front) crust(c, p.P4, heat * 0.85, t, p.i * 3.1 + 1, { seams: 2 }); c.restore();
          if (al > 0.01) { c.save(); c.globalAlpha = al; c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.7); c.lineWidth = T * 0.07; c.beginPath(); c.ellipse(X, cy, r * (1 + f.open * 0.75) * 0.95, r * 0.4, 0, 0, Math.PI); c.stroke(); c.restore(); }
          if (f.t > 0.9 && f.t < DROP) shimmer(c, X, cy - r * 0.6, r * 1.2, T * 1.6, t, gd); }
        // the pours: molten streams from a gap to the spot, a splash of flame where they land
        for (let i = 0; i < nP; i++) { const u = (f.t - pours[i]) / 0.5; if (u < 0 || u >= 1) continue; const s = spots[i], SX = H.sx(s.x), SY = H.sy(s.y), b = (s.gap + 0.91) / NP * TAU, gx = X + Math.cos(b) * r * 0.75, gy = cy + r * 0.35 + Math.sin(b) * r * 0.32, len = Math.min(1, u * 3.2), tail = Math.max(0, (u - 0.6) / 0.4), pts = []; for (let j = 0; j <= 9; j++) { const q = tail + (len - tail) * j / 9, e = q * q; pts.push([lerp(gx, SX, q) + Math.sin(q * 9 + t * 14) * T * 0.06, lerp(gy, SY, e)]); }
          stream(c, pts, T * 0.3, k, q => 0.55 + 0.45 * q); if (len >= 1) { const sg = petGuard(SX, SY - T * 0.5, T); K.floorLight(c, SX, SY, T * 1.3, 0.6 * k); K.flame(c, SX, SY, T * 0.55, T * 1.0 * (0.8 + 0.2 * Math.sin(t * 12)), t, i * 2, 0, k * sg); fring(c, SX, SY, T * 0.45, 4, T * 0.45, t, k * sg, t * 2, 0.4); } }
        // the blast's rolling edge, cooling as it goes
        if (f.t > HIT && f.t < HIT + 1.0) { const u = (f.t - HIT) / 1.0, e = H.ease.out(u); fring(c, X, Y, T * R * Math.min(1, e * 1.15), 16, T * (1.5 - u) * (1 - u * 0.4), t, (1 - u) * k, t * 0.5, 0.25); K.shockRing(c, X, Y, T * (R + 0.6) * e, 1 - u); if (u < 0.5) { const v = u / 0.5; K.glow(c, X, Y - T * 1.2, T * 3.4 * (1 - v * 0.5), P.yel, 0.7 * (1 - v)); for (let i = 0; i < 3; i++) K.flame(c, X + (i - 1) * T * 0.6, Y, T * (1.0 - Math.abs(i - 1) * 0.3), T * (3.6 - Math.abs(i - 1)) * (1 - v), t, i * 2.3, 0, (1 - v) * k * gd); } }
        // Celestial: solar prominences arcing out from the impact
        for (const p of proms) { const u = cl((f.t - p.t0) / 0.4); if (u <= 0 || f.t > p.t0 + 0.75) continue; const PX = H.sx(p.x), PY = H.sy(p.y), fade = 1 - cl((f.t - p.t0 - 0.4) / 0.35), pts = []; for (let j = 0; j <= 10; j++) { const q = Math.max(0, u - 0.5) + (u - Math.max(0, u - 0.5)) * j / 10; pts.push([lerp(X, PX, q), lerp(Y, PY, q) - Math.sin(q * Math.PI) * T * 2.4]); } stream(c, pts, T * 0.32, fade * k, q => 0.3 + 0.7 * q); const hd = pts[10]; H.core(c, hd[0], hd[1], T * 0.3, P.org, P.wht, fade * k); }
      } });
    pours.forEach((t0, i) => H.X.after(t0 - 0.3, () => { const s = spots[i]; H.warn(s.x, s.y, 1.15, 0.45, C.col); }));
    pours.forEach((t0, i) => H.X.after(t0, () => { F.pour = i; H.X.sfx.whoosh(); }));
    pours.forEach((t0, i) => H.X.after(t0 + 0.16, () => { const s = spots[i]; s.hitT = F.t; H.hitArea(s.x, s.y, 1.2, 6.0 / nP * D * norm, C.dmgO({ kb: 2, burn: 1 })); K.ignite(s.x, s.y, 1.1); K.sparks(s.x, s.y, 8, 5); K.flakes(s.x, s.y, 4); H.X.ring(s.x, s.y, 0.2, 1.2, 0.3, P.org, 0.4); H.X.shake(3, 0.1); H.X.sfx.thud(); }));
    H.X.after(DROP - 0.3, () => H.warn(x, y, R, HIT - DROP + 0.3, C.col));
    H.X.after(HIT, () => { H.hitArea(x, y, R + 0.3, 5.2 * D * norm, C.dmgO({ kb: 6, burn: 1, stun: 0.5 })); K.blast(x, y, R, 2.2); H.X.ring(x, y, 0.3, R + 0.3, 0.5, P.yel, 0.5); H.X.flash(0.3, '#FFE0B0'); H.fire(x, y, 1.8, 3, C.base * 0.7, 'fire'); K.flakes(x, y, 14); H.X.sfx.crash(); H.X.hitstop(0.08);
      for (let j = 0; j < H.n(30); j++) { const b = Math.random() * TAU, rr = R * (0.5 + Math.random() * 0.6); H.P({ kind: 'petal', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * 0.7 - 0.5 - Math.random(), vx: Math.cos(b) * 0.8, vy: -0.4 - Math.random() * 0.6, life: 1.6, max: 1.6, size: 4, rot: Math.random() * 6, vr: 3, color: j % 2 ? P.char : P.gold }); } });
    for (const p of proms) H.X.after(p.t0 + 0.4, () => { H.hitArea(p.x, p.y, 1.2, 0.3 * D * norm, C.dmgO({ kb: 2, burn: 1 })); K.blast(p.x, p.y, 1.0, 0.7); H.fire(p.x, p.y, 0.8, 1.6, C.base * 0.4, 'fire'); });
    return F; };

  /* ================= F-U04 Dragonkiln Procession ================= */
  // F-U04 Dragonkiln Procession: brick kiln rings (shaded bricks, glowing mortar, a white-hot interior, flames licking off them) stand along the aim; a spirit dragon of living flame rises from a fissure ahead of you and threads them: one long translucent twisting band of fire with a pale white-hot back edge, great translucent ribbed fin membranes, a long narrow head with a glowing eye and swept-back horns, and a flame tail fin, growing at each ring as it flares; it coils round the last and detonates into a spiralling fire crown
  // Evolution: more rings (3 to 5, packed into the same route; the surge and ring damage split between them) and a bigger dragon through stage 6; at Celestial three dragons materialise from their own fissures one after another, each threading its own procession of kilns on a fanned path and exploding at its end, the damage split between the three. Damage: its burning body surges along each stretch of route, each ring flares, the coil detonates.
  U.dragonkiln = (C, h) => { H = h; K = FK.bind(H); const me = H.me, ev = K.evo(C), fin = ev >= 7, NL = fin ? 3 : 1, NR = fin ? 3 : K.evoN(C, 3, 5), GAP = Math.max(1.05, Math.min(1.8, 5.0 / NR)), STEP = 2.0 / NR, START = 0.8, D = C.base * C.K * K.evoK(C) / NL, sc0 = 1 + 0.05 * (ev - 1) * (fin ? 0.6 : 1);
    const COIL0 = START + NR * STEP + 0.05, DET0 = COIL0 + 0.75, NS = 24, speed = GAP / STEP, dT = (2.6 + 0.25 * NR) / (NS * speed);
    H.X.banner('DRAGONKILN PROCESSION', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.6;
    const BR = []; for (let i = 0; i <= 7; i++) BR.push(H.mix('#2A120A', '#C07A50', i / 7));   /* the brick tone ramp, dark to lit */
    /* a lane: one dragon's procession of kilns along its own heading, starting `delay` seconds in */
    const lanes = []; for (let l = 0; l < NL; l++) { const a = C.a + (NL > 1 ? (l - 1) * 0.95 : 0), ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca, r0 = NL > 1 && l !== 1 ? 1.8 : 1.4, x0 = me.x + ca * r0, y0 = me.y + sa * r0, delay = l === 1 ? 0 : l === 0 ? 0.35 : 0.7, rings = [];
      for (let i = 0; i < NR; i++) { const d = (i + 0.8) * GAP; rings.push({ x: x0 + ca * d, y: y0 + sa * d, d: d + l * 9, r: 0.82 + 0.25 * i / Math.max(1, NR - 1), t: delay + START + (i + 0.6) * STEP }); }
      lanes.push({ a, ca, sa, px, py, x0, y0, delay, rings, last: rings[NR - 1], COIL: COIL0, DET: delay + DET0, grow: 0, seed: l * 5.3 }); }
    /* a dragon's path in its lane: [ground x, ground y, height] at its own time tau, or null before it exists / after it detonates */
    function path(Ln, tau) { const { ca, sa, px, py, x0, y0, rings, last } = Ln, a = Ln.a, hr = i => rings[Math.max(0, Math.min(NR - 1, i))].r; if (tau < 0 || tau >= DET0) return null;
      if (tau < START) { const e = tau / START, d = 0.3 * GAP * e; return [x0 + ca * d, y0 + sa * d, -0.7 + 1.3 * H.ease.out(e)]; }
      if (tau < COIL0) { const u = (tau - START) / (COIL0 - START), d = (u * NR + 0.3) * GAP, fi = d / GAP - 0.8; let z, wv = 0; if (fi < 0) { const e = (d - 0.3 * GAP) / (0.5 * GAP); z = lerp(0.6, hr(0), cl(e)) + 0.3 * Math.sin(cl(e) * Math.PI); } else { const i0 = Math.floor(fi), fr = fi - i0; z = lerp(hr(i0), hr(i0 + 1), fr) + 0.5 * Math.sin(Math.PI * fr) * (i0 < NR - 1 ? 1 : 0.4); wv = 0.45 * Math.sin(Math.PI * fr) * (i0 % 2 ? 1 : -1); } return [x0 + ca * d + px * wv, y0 + sa * d + py * wv, z]; }
      const u = (tau - COIL0) / (DET0 - COIL0), b = a + u * TAU * 1.5, r = 1.45 * (1 - u * 0.45); return [last.x + Math.cos(b) * r, last.y + Math.sin(b) * r * 0.8, hr(NR - 1) + u * 1.8]; }
    /* a kiln ring: bricks round a torus standing across the aim; half 0 the far bricks, 1 the near ones */
    function kiln(c, R_, half, heat, form, t, T, al, Ln) { const { px, py, ca, sa } = Ln, rr = R_.r * form, CX = H.sx(R_.x), CY = H.sy(R_.y) - rr * T, Ux = (px + 0.5 * ca * Math.abs(py)) * rr * T, Uy = py * rr * T * H.GY * 0.8, Vy = -rr * T, th = T * 0.22, ox = ca * th, oy = sa * th * H.GY, NB = 12;
      const pt = (b, kk, o) => [CX + (Math.cos(b) * Ux) * kk + o * ox, CY + (Math.cos(b) * Uy + Math.sin(b) * Vy) * kk + o * oy];
      c.save(); c.globalAlpha = al;
      if (half === 0) { // the plinth and its shadow, and the far (back) face of the whole ring in shadow
        const g0 = [CX, H.sy(R_.y)], pl = [[g0[0] - Ux * 0.75 - T * 0.12, g0[1] - Uy * 0.75], [g0[0] + Ux * 0.75 + T * 0.12, g0[1] + Uy * 0.75], [g0[0] + Ux * 0.6 + T * 0.1, g0[1] + Uy * 0.6 - T * 0.28], [g0[0] - Ux * 0.6 - T * 0.1, g0[1] - Uy * 0.6 - T * 0.28]]; H.softShadow(c, g0[0], g0[1], T * rr * 0.9, 0.25); crust(c, pl, heat * 0.6, t, R_.d * 3, { seams: 1 });
        c.fillStyle = P.char; c.beginPath(); for (let j = 0; j <= 24; j++) { const p = pt(j / 24 * TAU, 1, -1); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } for (let j = 24; j >= 0; j--) { const p = pt(j / 24 * TAU, 0.6, -1); c.lineTo(p[0], p[1]); } c.closePath(); c.fill();
        if (heat > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; const gi = c.createRadialGradient(CX, CY, 0, CX, CY, rr * T * 0.62); gi.addColorStop(0, H.rgba(P.wht, 0.95 * heat)); gi.addColorStop(0.45, H.rgba(P.yel, 0.75 * heat)); gi.addColorStop(0.85, H.rgba(P.org, 0.45 * heat)); gi.addColorStop(1, H.rgba(P.red, 0)); c.fillStyle = gi; c.beginPath(); for (let j = 0; j <= 20; j++) { const p = pt(j / 20 * TAU, 0.62, 0); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.closePath(); c.fill(); c.restore(); K.glow(c, CX, CY, rr * T * 1.4, P.yel, 0.45 * heat * al); } }
      for (let i = 0; i < NB; i++) { const b0 = i / NB * TAU, b1 = (i + 0.93) / NB * TAU, bm = (b0 + b1) / 2, dep = Math.cos(bm) * py; if ((half === 1) !== (dep > 0.02)) { if (!(Math.abs(py) < 0.15 && half === 0)) continue; } if (Math.abs(py) < 0.15 && half === 1) continue;
        const q = [pt(b0, 1, 1), pt(b1, 1, 1), pt(b1, 0.6, 1), pt(b0, 0.6, 1)], nx = Math.cos(bm) * Ux, ny = Math.cos(bm) * Uy + Math.sin(bm) * Vy, nl = Math.hypot(nx, ny) || 1, L = (nx * -0.6 + ny * -0.8) / nl;
        H.poly(c, q); c.fillStyle = BR[Math.round(cl(0.5 + L * 0.5) * 7)]; c.fill(); c.strokeStyle = H.line(); c.lineWidth = 1; c.stroke();
        if (L > 0.3) { c.strokeStyle = H.rgba(P.gold, 0.35 * L); c.lineWidth = 1.2; c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.stroke(); } }
      // the glowing mortar and the white-hot inner rim
      if (heat > 0.02) { c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let i = 0; i < NB; i++) { const b = i / NB * TAU - 0.02, dep = Math.cos(b) * py; if (Math.abs(py) >= 0.15 && (half === 1) !== (dep > 0.02)) continue; if (Math.abs(py) < 0.15 && half === 1) continue; const p0 = pt(b, 1, 1), p1 = pt(b, 0.6, 1); c.strokeStyle = H.rgba(P.org, 0.8 * heat); c.lineWidth = 2; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); }
        c.strokeStyle = H.rgba(P.yel, 0.75 * heat); c.lineWidth = T * 0.06; c.beginPath(); let st = false; for (let j = 0; j <= 32; j++) { const b = j / 32 * TAU, dep = Math.cos(b) * py, on = Math.abs(py) < 0.15 ? half === 0 : (half === 1) === (dep > 0.02), p = pt(b, 0.62, 1); if (on) { st ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); st = true; } else st = false; } c.stroke(); }
      c.restore();
      if (Math.abs(py) < 0.15 ? half === 0 : half === 1) { if (heat > 0.05) { K.glow(c, CX, CY, rr * T * 2.0, P.org, 0.5 * heat * al); for (let i = -2; i <= 2; i++) { const b = -Math.PI / 2 + i * 0.62, p = pt(b, 1, 0.3), nx = Math.cos(b) * Ux, ny = Math.cos(b) * Uy + Math.sin(b) * Vy; K.flame(c, p[0], p[1] + T * 0.06, T * 0.34 * (1 - Math.abs(i) * 0.12), T * (0.95 - Math.abs(i) * 0.12) * heat * (0.8 + 0.2 * Math.sin(t * 10 + i * 1.7 + R_.d)), t, i * 2 + R_.d, nx / (Math.hypot(nx, ny) || 1) * T * 0.35, al, true); } } } }
    /* the spirit dragon's head at screen (X, Y) heading ang, hs its size: a long narrow angular skull and jaw of translucent
       fire, a pale hot edge along its brow, a glowing eye, two horn spikes swept back, flame wisps off the nape */
    function head(c, X, Y, ang, hs, grow, t, al) { c.save(); c.translate(X, Y); c.rotate(ang); if (Math.cos(ang) < 0) c.scale(1, -1); c.globalAlpha = al;
      for (let i = 0; i < 2 + Math.min(2, grow >> 1); i++) sflame(c, -hs * 0.2 - i * hs * 0.25, -hs * 0.25 + i * hs * 0.1, Math.PI + 0.7 - i * 0.2, hs * 0.4, hs * (0.9 + 0.1 * grow), t, i * 2.1, 0.85);
      const hl = hs * (1.0 + 0.15 * Math.min(4, grow)); c.lineJoin = 'round';
      for (const [dy, k] of [[0.02, 0.75], [-0.1, 1]]) { const hp = [[hs * 0.1, -hs * 0.28 + dy * hs], [-hl, -hs * (0.75 + 0.2 * k) + dy * hs], [-hs * 0.05, -hs * 0.12 + dy * hs]]; const g = c.createLinearGradient(hs * 0.1, 0, -hl, -hs); g.addColorStop(0, H.rgba(P.yel, 0.95 * k)); g.addColorStop(1, H.rgba(P.wht, 0.2)); H.poly(c, hp); c.fillStyle = g; c.fill(); c.strokeStyle = H.rgba(P.wht, 0.6 * k); c.lineWidth = 1; c.stroke(); }
      const skull = [[-hs * 0.35, -hs * 0.32], [hs * 0.45, -hs * 0.36], [hs * 1.95, -hs * 0.1], [hs * 2.05, hs * 0.02], [hs * 0.9, hs * 0.06], [-hs * 0.35, hs * 0.12]], jaw = [[-hs * 0.25, hs * 0.1], [hs * 1.75, hs * 0.08 + hs * 0.1 * (0.5 + 0.5 * Math.sin(t * 5))], [hs * 1.2, hs * 0.3], [-hs * 0.3, hs * 0.32]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * 0.45; c.fillStyle = P.org; c.beginPath(); c.ellipse(hs * 0.7, 0, hs * 1.6, hs * 0.6, 0, 0, TAU); c.fill(); c.restore();
      let g = c.createLinearGradient(0, -hs * 0.36, 0, hs * 0.12); g.addColorStop(0, H.rgba(P.yel, 0.95)); g.addColorStop(0.5, H.rgba(P.org, 0.85)); g.addColorStop(1, H.rgba(P.red, 0.8)); H.poly(c, skull); c.fillStyle = g; c.fill();
      g = c.createLinearGradient(0, hs * 0.08, 0, hs * 0.32); g.addColorStop(0, H.rgba(P.red, 0.85)); g.addColorStop(1, H.rgba(P.dred, 0.6)); H.poly(c, jaw); c.fillStyle = g; c.fill();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.wht, 0.9); c.lineWidth = Math.max(1.5, hs * 0.07); c.beginPath(); c.moveTo(-hs * 0.35, -hs * 0.32); c.lineTo(hs * 0.45, -hs * 0.36); c.lineTo(hs * 1.95, -hs * 0.1); c.stroke();
      c.strokeStyle = H.rgba(P.yel, 0.8); c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 4; i++) { const x = hs * (0.5 + i * 0.32); c.moveTo(x, hs * 0.06); c.lineTo(x + hs * 0.05, hs * 0.16); } c.stroke();
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = H.rgba(P.dred, 0.7); c.lineWidth = 1.2; H.poly(c, jaw, true); c.stroke();
      K.glow(c, hs * 0.55, -hs * 0.12, hs * 0.55, P.yel, 0.9); c.fillStyle = P.wht; c.beginPath(); c.ellipse(hs * 0.55, -hs * 0.13, hs * 0.11, hs * 0.07, -0.15, 0, TAU); c.fill();
      sflame(c, hs * 2.0, 0, 0.1, hs * 0.25, hs * (0.5 + 0.2 * Math.sin(t * 13)), t, 9, 0.8);
      c.restore(); }
    /* one long spirit body of living flame along screen spine pts (head first), half-widths ws: a flat band that twists (its
       width breathing as it turns), translucent layered fills (a soft glow, a red-orange body, an orange inner body, a hot
       core), a pale white-hot edge along its back and a dark red underside, large translucent fin membranes with glowing ribs
       sweeping back off it, flame wisps streaming off the back and the fins, a flame tail fin */
    function body(c, pts, ws0, t, a, grow, seed, fins, tail) { const n = pts.length; if (n < 3 || !(a > 0.01)) return; const L = [], R = [], nr = [], ws = ws0.map((w, i) => w * (0.5 + 0.5 * Math.abs(Math.cos(i * 0.32 + t * 2.2 + seed))));
      for (let i = 0; i < n; i++) { const p = pts[Math.max(0, i - 1)], q = pts[Math.min(n - 1, i + 1)]; let dx = q[0] - p[0], dy = q[1] - p[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; let nx = -dy, ny = dx; if (ny < 0) { nx = -nx; ny = -ny; } nr.push([nx, ny]); L.push([pts[i][0] - nx * ws[i], pts[i][1] - ny * ws[i]]); R.push([pts[i][0] + nx * ws[i], pts[i][1] + ny * ws[i]]); }   /* (L: the back, up the screen; R: the underside) */
      const shape = k => { c.beginPath(); for (let i = 0; i < n; i++) { const p = pts[i], w = ws[i] * k; i ? c.lineTo(p[0] - nr[i][0] * w, p[1] - nr[i][1] * w) : c.moveTo(p[0] - nr[i][0] * w, p[1] - nr[i][1] * w); } for (let i = n - 1; i >= 0; i--) { const p = pts[i], w = ws[i] * k; c.lineTo(p[0] + nr[i][0] * w, p[1] + nr[i][1] * w); } c.closePath(); };
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
      // the fins: translucent flame membranes fanning back off the back, glowing ribs, wisps off their tips
      if (fins) for (const u of fins) { const i = Math.min(n - 2, Math.max(1, Math.round(u * (n - 1)))), b = L[i], tx = pts[i + 1][0] - pts[i - 1][0], ty = pts[i + 1][1] - pts[i - 1][1], tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, nx = -nr[i][0], ny = -nr[i][1], F_ = ws0[i] * 3.6 * (1 + 0.06 * grow), fl = Math.sin(t * 6 + i + seed) * 0.15, tips = [];
        for (let k = 0; k <= 4; k++) { const s = k / 4, back = 0.45 + s * 1.0, out = 0.8 * (1 - s * 0.5) * (1 + fl * (1 - s)); tips.push([b[0] + ux * F_ * back + nx * F_ * out, b[1] + uy * F_ * back + ny * F_ * out]); }
        const base2 = [b[0] + ux * F_ * 0.9, b[1] + uy * F_ * 0.9]; c.globalAlpha = a; const g = c.createLinearGradient(b[0], b[1], tips[2][0], tips[2][1]); g.addColorStop(0, H.rgba(P.yel, 0.95)); g.addColorStop(0.45, H.rgba(P.amb, 0.8)); g.addColorStop(1, H.rgba(P.red, 0.4));
        c.beginPath(); c.moveTo(b[0], b[1]); for (let k = 0; k <= 4; k++) { const p = tips[k], q = tips[Math.max(0, k - 1)]; k ? c.quadraticCurveTo((p[0] + q[0]) / 2 - nx * F_ * 0.08, (p[1] + q[1]) / 2 - ny * F_ * 0.08, p[0], p[1]) : c.lineTo(p[0], p[1]); } c.lineTo(base2[0], base2[1]); c.closePath(); c.fillStyle = g; c.fill(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * a; c.fill(); c.globalAlpha = a;
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.7); c.lineWidth = 1.3; c.beginPath(); for (let k = 0; k <= 4; k++) { const s = k / 4; c.moveTo(lerp(b[0], base2[0], s), lerp(b[1], base2[1], s)); c.lineTo(tips[k][0], tips[k][1]); } c.stroke(); c.strokeStyle = H.rgba(P.wht, 0.55); c.lineWidth = 1.6; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(tips[0][0], tips[0][1]); c.stroke(); c.globalCompositeOperation = 'source-over';
        c.restore(); sflame(c, tips[0][0], tips[0][1], Math.atan2(uy * 0.7 - 0.7, ux * 0.7), F_ * 0.22, F_ * 0.5, t, i + seed, 0.8 * a); c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; }
      if (tail) { const e = pts[n - 1], p = pts[n - 3], dx = e[0] - p[0], dy = e[1] - p[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, fw = ws0[2] * 1.6; c.globalAlpha = 0.8 * a; const g = c.createLinearGradient(e[0], e[1], e[0] + ux * fw * 2.2, e[1] + uy * fw * 2.2); g.addColorStop(0, P.yel); g.addColorStop(0.5, P.org); g.addColorStop(1, H.rgba(P.red, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(e[0] - uy * fw * 0.2, e[1] + ux * fw * 0.2); for (let k = 0; k <= 4; k++) { const b = (k / 4 - 0.5) * 1.6 + Math.sin(t * 7 + k) * 0.15, l = fw * (1.6 + 0.6 * Math.sin(k * 1.7 + t * 5)); c.quadraticCurveTo(e[0] + (ux * Math.cos(b) - uy * Math.sin(b)) * l * 0.6, e[1] + (uy * Math.cos(b) + ux * Math.sin(b)) * l * 0.6, e[0] + (ux * Math.cos(b) - uy * Math.sin(b)) * l, e[1] + (uy * Math.cos(b) + ux * Math.sin(b)) * l); } c.lineTo(e[0] + uy * fw * 0.2, e[1] - ux * fw * 0.2); c.closePath(); c.fill(); }
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 * a; c.fillStyle = P.org; shape(1.6); c.fill();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.62 * a; c.fillStyle = '#D8401A'; shape(1); c.fill();
      c.globalAlpha = 0.7 * a; c.fillStyle = P.org; shape(0.62); c.fill();
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.75 * a; c.fillStyle = P.yel; shape(0.26); c.fill();
      // the pale white-hot edge along its back, the dark red underside
      c.globalAlpha = a; c.strokeStyle = H.rgba(P.wht, 0.85); c.lineWidth = Math.max(2, ws0[2] * 0.35); H.poly(c, L, false); c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.5); c.lineWidth = Math.max(4, ws0[2] * 0.8); H.poly(c, L, false); c.stroke();
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = H.rgba(P.dred, 0.7); c.lineWidth = Math.max(1.5, ws0[2] * 0.25); H.poly(c, R, false); c.stroke();
      c.restore();
      // flame wisps streaming back off its back edge
      for (let i = 3; i < n - 2; i += 4) { const p = L[i], q = pts[Math.min(n - 1, i + 2)], bx = q[0] - pts[i][0], by = q[1] - pts[i][1], bl = Math.hypot(bx, by) || 1; sflame(c, p[0], p[1], Math.atan2(by / bl * 0.7 - 0.7, bx / bl * 0.7), ws0[i] * 0.9, ws0[i] * (1.8 + 0.2 * grow), t, i * 1.7 + seed, 0.75 * a); }
    }
    const D_ = H.add({ life: DET0 + lanes[NL - 1].delay + 1.15, x: me.x, y: me.y,
      update(dt, f) { for (const Ln of lanes) { const tau = f.t - Ln.delay, p = path(Ln, tau), last = Ln.last; if (p && p[2] > 0) { K.aura(p[0], p[1], 0.5 * (1 + Ln.grow * 0.12), dt, NL > 1 ? 8 : 14, p[2]); lit(f, 'h' + Ln.seed, p[0], p[1], 2.8, dt); }
          if (tau > 0 && tau < 1.2) lit(f, 'r' + Ln.seed, (Ln.x0 + last.x) / 2, (Ln.y0 + last.y) / 2, NR * GAP * 0.6, dt); for (const R_ of Ln.rings) if (f.t > R_.t && f.t < Ln.DET + 0.4) K.aura(R_.x, R_.y, 0.6, dt, NL > 1 ? 2 : 4, R_.r * 1.6); if (f.t > Ln.DET && f.t < Ln.DET + 1.2) { K.aura(last.x, last.y, 2.2, dt, NL > 1 ? 9 : 16, 0.3); lit(f, 'd' + Ln.seed, last.x, last.y, 4, dt); } } },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.8);
        for (const Ln of lanes) { const { x0, y0, px, py, ca, rings, last } = Ln, tau = f.t - Ln.delay, form = H.ease.out(cl(tau / 0.7));
          // the fissure it rises from, the scorched route, the kilns' light on the floor
          const FX = H.sx(x0), FY = H.sy(y0), fis = cl(tau / 0.3) * cl((START + 0.9 - tau) / 0.5); if (fis > 0) { K.scorch(c, FX, FY, T * 1.0, fis, fis, 1); K.floorLight(c, FX, FY, T * 1.4, 0.7 * fis); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.8 * fis); c.lineWidth = 2.5; c.beginPath(); c.moveTo(FX - px * T * 0.7, FY - py * T * 0.7 * H.GY); c.lineTo(FX + px * T * 0.1 + ca * T * 0.1, FY + py * T * 0.05); c.lineTo(FX + px * T * 0.7, FY + py * T * 0.7 * H.GY); c.stroke(); c.restore(); }
          if (tau > 0) for (let i = 0; i < NR; i++) { const R_ = rings[i], RX = H.sx(R_.x), RY = H.sy(R_.y), on = f.t > R_.t, heat = on ? Math.max(0.5, 1 - (f.t - R_.t) / 2.5) : 0.4 * form; K.floorLight(c, RX, RY, T * (1.8 + R_.r), (0.45 + 0.5 * heat) * k * form); if (on) K.scorch(c, RX, RY, T * (1.3 + i * 0.15), 0.75 * k, heat, i * 2.2); }
          const p = path(Ln, tau); if (p && p[2] > 0) H.softShadow(c, H.sx(p[0]), H.sy(p[1]), T * 0.6, 0.2);
          if (f.t > Ln.DET) { const u = cl((f.t - Ln.DET) / 0.5); K.scorch(c, H.sx(last.x), H.sy(last.y), T * 3.0 * H.ease.out(u), 0.85 * k, Math.max(0.1, 1 - (f.t - Ln.DET) / 1.3), 6); K.floorLight(c, H.sx(last.x), H.sy(last.y), T * 3.6, 0.6 * (1 - cl((f.t - Ln.DET) / 1.1))); } } },
      draw(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.6), items = [];
        for (const Ln of lanes) { const tau = f.t - Ln.delay; if (tau < 0) continue; const form = H.ease.out(cl(tau / 0.7)), grow = Ln.grow, sc = sc0 * (1 + grow * 0.1), last = Ln.last;
          Ln.rings.forEach((R_, i) => { const lastGone = i === NR - 1 ? cl((f.t - Ln.DET) / 0.25) : 0; if (lastGone >= 1) return; const heat = f.t > R_.t ? 0.75 + 0.25 * Math.max(0, 1 - (f.t - R_.t) / 0.8) : (0.45 + 0.1 * Math.sin(t * 3 + i)) * form, al = k * (1 - lastGone) * petGuard(H.sx(R_.x), H.sy(R_.y) - R_.r * T, T); items.push({ y: R_.y - 0.001, draw: () => kiln(c, R_, 0, heat, form, t, T, al, Ln) }, { y: R_.y + 0.001, draw: () => kiln(c, R_, 1, heat, form, t, T, al, Ln) }); });
          // the body, sampled back along its path; split into a few pieces so it threads the kilns in depth
          const sp = []; for (let j = 0; j < NS; j++) { const p = path(Ln, tau - j * dT); if (!p || p[2] < -0.05) break; sp.push(p); }
          if (sp.length > 2) { const scr = sp.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]), ws = sp.map((p, j) => { const u = j / (NS - 1); return T * 0.36 * sc * (u < 0.12 ? 0.72 + u / 0.12 * 0.28 : 1 - (u - 0.12) / 0.88 * 0.86) * (p[2] < 0.25 ? 0.5 + 0.5 * cl(p[2] / 0.25) : 1); }), gd = petGuard(scr[0][0], scr[0][1], T, T * 0.3);
            const CH = 4, per = Math.ceil((scr.length - 1) / CH); for (let ch = 0; ch < CH; ch++) { const i0 = ch * per, i1 = Math.min(scr.length - 1, i0 + per); if (i1 - i0 < 1) break; const sub = scr.slice(i0, i1 + 1), sw = ws.slice(i0, i1 + 1), mid = sp[Math.floor((i0 + i1) / 2)], uL = [i0 / (NS - 1), i1 / (NS - 1)], lg = [0.2, 0.5].filter(u => u >= uL[0] && u < uL[1]).map(u => (u - uL[0]) / (uL[1] - uL[0])), isTail = i1 === scr.length - 1 && scr.length > NS * 0.7;
              items.push({ y: mid[1], draw: () => { if (ch === 0) K.glow(c, sub[0][0], sub[0][1], T * 1.4 * sc, P.org, 0.4 * k); body(c, sub, sw, t, k * Math.min(gd, petGuard(sub[Math.floor(sub.length / 2)][0], sub[Math.floor(sub.length / 2)][1], T, T * 0.6)), grow, ch * 3 + Ln.seed, lg, isTail); } }); }
            const hd = scr[0], nx = scr[1], ang = Math.atan2(hd[1] - nx[1], hd[0] - nx[0]), clip = cl(sp[0][2] / 0.3 + 0.2); items.push({ y: sp[0][1] + 0.0005, draw: () => { K.glow(c, hd[0], hd[1], T * 1.5 * sc, P.org, 0.6 * k * gd); K.glow(c, hd[0], hd[1], T * 0.7 * sc, P.yel, 0.4 * k * gd); head(c, hd[0], hd[1], ang, T * 0.38 * sc, grow, t, k * clip * gd); } }); }
          // the detonation: a spiralling crown of flame, the kiln's bricks flung out
          if (f.t > Ln.DET && f.t < Ln.DET + 1.1) { const u = (f.t - Ln.DET) / 1.1, LX = H.sx(last.x), LY = H.sy(last.y), NF = NL > 1 ? 8 : 12; for (let i = 0; i < NF; i++) { const u2 = (i / NF + u * 0.8) % 1, b = u2 * TAU * 2 + t, r = T * (2.2 - u2 * 1.4) * Math.min(1, u * 3), gx = LX + Math.cos(b) * r, gy = LY - T * 0.3 - u2 * T * 3.6 + Math.sin(b) * r * 0.45; K.flame(c, gx, gy, T * 0.4 * (1 - u2 * 0.5), T * 1.0 * (1 - u2 * 0.5) * (1 - u * 0.5), t, i * 1.3, 0, (1 - u) * (1 - u2 * 0.3) * k, true); } K.glow(c, LX, LY - T * 1.8, T * 2.8 * (1 - u), P.org, 0.55 * (1 - u)); if (u < 0.5) K.shockRing(c, LX, LY, T * 3.4 * H.ease.out(u * 2), 1 - u * 2); shimmer(c, LX, LY - T * 1, T * 1.8, T * 3, t, 1 - u);
            for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.4, e = H.ease.out(cl(u * 2)), bx = LX + Math.cos(b) * T * 2.4 * e, by = LY - T * last.r - Math.sin(b) * T * 0.6 * e - T * 1.6 * e + T * 4 * e * e * 0.6; if (u < 0.6) crust(c, [[bx - T * 0.14, by - T * 0.1], [bx + T * 0.16, by - T * 0.12], [bx + T * 0.12, by + T * 0.1], [bx - T * 0.12, by + T * 0.12]], 1 - u, t, i * 1.3, { seams: 1 }); } } }
        items.sort((p, q) => p.y - q.y).forEach(it => it.draw()); } });
    for (const Ln of lanes) { const { rings, ca, sa, a, x0, y0, last } = Ln;
      /* the surges: as the dragon reaches each ring its body has burned the stretch of route behind it (each monster once per surge) */
      rings.forEach((R_, i) => H.X.after(R_.t - 0.05, () => { const sx0 = i ? rings[i - 1].x : me.x + ca * 0.5, sy0 = i ? rings[i - 1].y : me.y + sa * 0.5, ex = i === NR - 1 ? R_.x + ca * GAP * 0.6 : R_.x, ey = i === NR - 1 ? R_.y + sa * GAP * 0.6 : R_.y; H.hitLine(sx0, sy0, a, Math.hypot(ex - sx0, ey - sy0), 2.6, 3.6 / NR * D, C.dmgO({ kb: 1.5, burn: 1 })); for (let j = 0; j < 4; j++) { const u = (j + 0.5) / 4; K.embers(lerp(sx0, ex, u), lerp(sy0, ey, u), 3, { v: 2 }); } }));
      H.X.after(Ln.delay, () => H.warnLine(x0, y0, a, NR * GAP + 1.2, 2.4, 1.2, C.col));
      H.X.after(Ln.delay + START * 0.6, () => { H.hitArea(x0, y0, 1.9, 0.6 * D, C.dmgO({ kb: 2, burn: 1 })); K.blast(x0, y0, 1.3, 0.8); K.flakes(x0, y0, 6); H.X.sfx.thud(); });   /* (the fissure bursting as it rises) */
      rings.forEach((R_, i) => H.X.after(R_.t, () => { Ln.grow = i + 1; const w = (3.3 / NR) * (0.8 + 0.4 * i / Math.max(1, NR - 1)); H.hitArea(R_.x, R_.y, 1.6 + i * 0.12, w * D, C.dmgO({ kb: 2 + i * 0.5, burn: 1 })); K.blast(R_.x, R_.y, 1.4 + i * 0.15, NL > 1 ? 0.7 : 1); H.X.ring(R_.x, R_.y, 0.2, 1.6 + i * 0.12, 0.3, P.org, 0.45); K.sparks(R_.x, R_.y - R_.r, 10, 5); H.X.sfx.thud(); }));
      H.X.after(Ln.DET - 0.35, () => H.warn(last.x, last.y, 3.2 * C.K, 0.35, C.col));
      H.X.after(Ln.DET, () => { H.hitArea(last.x, last.y, 3.2 * C.K, 4.8 * D, C.dmgO({ kb: 6, burn: 1, stun: 0.5 })); K.blast(last.x, last.y, 3.0, NL > 1 ? 1.6 : 2.2); H.X.ring(last.x, last.y, 0.3, 3.2 * C.K, 0.5, P.yel, 0.5); H.X.flash(0.25, '#FFE0B0'); H.fire(last.x, last.y, 1.8, 3, C.base * 0.7, 'fire'); K.flakes(last.x, last.y, 16); H.X.sfx.crash(); H.X.hitstop(0.06); }); }
    return D_; };

  /* ================= F-U05 Crimson Lotus Forge ================= */
  /* a lotus petal standing at screen (X, Y): w wide, ph tall, leaning by tilt (shear) and foreshortened by sq; its outer
     face molten crust, its inner face (shown by inner 0..1) glowing, a hot midrib */
  function petal(c, X, Y, w, ph, tilt, sq, inner, heat, t, seed, a) { if (ph < 2 || !(a > 0.01)) return; c.save(); c.translate(X, Y); c.transform(1, 0, tilt, sq, 0, 0); c.globalAlpha = a;
    const side = [], N = 5; for (let j = 0; j <= N; j++) { const v = j / N, hw = w * 0.5 * (0.28 + 0.72 * Math.pow(Math.sin(Math.PI * Math.min(0.98, v * 0.92 + 0.04)), 0.8)) * (1 - v * 0.25); side.push([hw, -ph * v]); } const pts = side.map(p => [-p[0], p[1]]).concat(side.slice().reverse().map(p => [p[0], p[1]])); pts.splice(N, 1, [0, -ph * 1.04]); pts.splice(N + 1, 1);
    crust(c, pts, heat, t, seed, { seams: 2 });
    if (inner > 0.02) { const ip = pts.map(p => [p[0] * 0.72, p[1] * 0.97 - ph * 0.02]); c.save(); c.globalAlpha = a * inner; const g = c.createLinearGradient(0, 0, 0, -ph); g.addColorStop(0, P.wht); g.addColorStop(0.3, P.yel); g.addColorStop(0.7, P.org); g.addColorStop(1, P.red); H.poly(c, ip); c.fillStyle = g; c.fill(); c.strokeStyle = H.rgba(P.dred, 0.7); c.lineWidth = 1.2; c.stroke(); c.restore(); }
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = H.rgba(P.org, 0.7 * heat); c.lineWidth = Math.max(1.5, w * 0.08); c.beginPath(); c.moveTo(0, -ph * 0.05); c.quadraticCurveTo(w * 0.05, -ph * 0.5, 0, -ph * 0.9); c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.8 * heat); c.lineWidth = Math.max(0.8, w * 0.03); c.stroke(); c.restore();
    c.restore(); }
  // F-U05 Crimson Lotus Forge: heavy molten petals rise round the aim, crusted dark and split by glowing seams, and unfold into a fire lotus whose inner faces glow, flame sweeps racing between its layers; the bud erupts last as a pillar of fire and the petals break into cooling embers
  // Evolution: a third ring of petals from Guardian-ish stage 4, more petals per ring, more sweeps (2 to 4, their damage split), a wider bloom; at Celestial six lotus seeds bloom round the rim after the bud and burst.
  U.crimsonlotus = (C, h) => { H = h; K = FK.bind(H); const x = C.tx, y = C.ty, ev = K.evo(C), R = 3.2 * C.K * (1 + 0.04 * (ev - 1)), nSw = K.evoN(C, 2, 4), BUD = 3.2, fin = ev >= 7, D = C.base * C.K * K.evoK(C), norm = fin ? 10 / 11.8 : 1;
    const sweeps = []; for (let i = 0; i < nSw; i++) sweeps.push(1.4 + i * (1.0 / Math.max(1, nSw - 1)));
    const layers = [[K.evoN(C, 7, 10), 0.85, 1.65, 0.2, 0.6], [K.evoN(C, 5, 7), 0.55, 1.45, 0.65, 0.42]]; if (ev >= 4) layers.push([K.evoN(C, 3, 5), 0.3, 1.2, 1.1, 0.25]);
    const seeds = fin ? [0, 1, 2, 3, 4, 5].map(i => { const b = i / 6 * TAU + 0.5; return { x: x + Math.cos(b) * R * 0.95, y: y + Math.sin(b) * R * 0.95 }; }) : [];
    H.warn(x, y, R + 0.4, 1.3, C.col); H.X.banner('CRIMSON LOTUS FORGE', '', C.col, 1.4); H.X.sfx.hum();
    const F = H.add({ life: fin ? 5.3 : 4.7, x, y,
      update(dt, f) { if (f.t < BUD) K.aura(x, y, R * 0.7 * cl(f.t), dt, 10 + 10 * cl((f.t - 1.2) / 1.5), 0.6); else if (f.t < BUD + 1.4) K.aura(x, y, R * 0.6, dt, 20, 0.2); if (f.t < BUD + 1.2) lit(f, 'c', x, y - 0.5, R * (0.6 + 0.5 * cl((f.t - 1) / 2)), dt); },
      drawUnder(c, f, X, Y, T, t) { const k = H.fade(f, 0.4, 0.7), heat = 0.5 + 0.5 * cl((f.t - 1.2) / 1.5); c.save(); c.globalAlpha = k;
        K.floorLight(c, X, Y, T * R * 1.15, 0.45 * heat); const g = c.createRadialGradient(X, Y, 0, X, Y, R * T); g.addColorStop(0, H.rgba(P.dred, 0.45)); g.addColorStop(0.75, H.rgba(P.dred, 0.25)); g.addColorStop(1, H.rgba(P.dred, 0)); c.save(); c.translate(X, Y); c.scale(1, H.GY); c.beginPath(); c.arc(0, 0, R * T, 0, TAU); c.restore(); c.fillStyle = g; c.fill();
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.2, gl = 0.45 + 0.25 * Math.sin(t * 6 + i); c.strokeStyle = H.rgba(P.org, gl * heat); c.lineWidth = 2.5; c.beginPath(); c.moveTo(X + Math.cos(b) * T * 0.4, Y + Math.sin(b) * T * 0.4 * H.GY); c.quadraticCurveTo(X + Math.cos(b + 0.3) * R * T * 0.6, Y + Math.sin(b + 0.3) * R * T * 0.6 * H.GY, X + Math.cos(b) * R * T, Y + Math.sin(b) * R * T * H.GY); c.stroke(); c.strokeStyle = H.rgba(P.yel, gl * heat * 0.7); c.lineWidth = 1; c.stroke(); }
        c.strokeStyle = H.rgba(P.org, 0.5 * heat); c.lineWidth = 2; H.floorEllipse(c, X, Y, R * T); c.stroke(); c.restore();
        if (f.t > BUD) K.scorch(c, X, Y, T * R * 0.75, k, Math.max(0.1, 1 - (f.t - BUD) / 1.3), 3);
        for (const s of seeds) if (f.t > BUD + 0.75) K.scorch(c, H.sx(s.x), H.sy(s.y), T * 1.1, 0.7 * k, Math.max(0.1, 1 - (f.t - BUD - 0.75) / 1.0), s.x); },
      draw(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.7), rise = H.ease.out(cl(f.t / 1.0)), open = H.ease.io(cl((f.t - 1.2) / 0.9)), bud = cl((f.t - 2.8) / 0.4), frag = cl((f.t - BUD) / 0.9), items = [];
        layers.forEach(([n, rr, hh, off, lean0], li) => { for (let i = 0; i < n; i++) { const b = i / n * TAU + off, lean = lean0 * open, px = X + Math.cos(b) * rr * R * T * (1 + lean * 0.35), py = Y + Math.sin(b) * rr * R * T * H.GY * (1 + lean * 0.35), dep = Math.sin(b);
          items.push({ y: py, draw: () => { const ph = T * hh * rise, w = T * (1.0 + 0.15 * (1 - li * 0.5)) * rise, tilt = Math.cos(b) * lean * 0.75, drop = frag * frag * T * 1.6, gd = petGuard(px, py - ph * 0.5, T), al = k * (1 - frag) * gd, heat = 0.4 + 0.6 * Math.max(open * 0.75, bud) * (0.75 + 0.25 * Math.sin(t * 7 + i + li));
            H.softShadow(c, px, py, w * 0.8, 0.2 * rise * (1 - frag)); petal(c, px + Math.cos(b) * frag * T * 0.6, py + drop, w, ph * (1 - frag * 0.3), tilt, 1 - lean * 0.3, dep < 0 ? open : open * 0.25, heat, t, i * 2.3 + li * 7, al);
            if (li === 0 && open > 0.3 && frag < 0.5 && i % 2 === 0) { const tx = px + tilt * -ph * (1 - lean * 0.3) * 0.98, ty = py - ph * (1 - lean * 0.3); K.flame(c, tx, ty + T * 0.05, w * 0.32 * open, ph * 0.35 * open, t, i * 2 + li, Math.cos(b) * w * 0.3, 0.9 * al * (1 - frag * 2), true); } } }); } });
        // the bud: five crust petals closed round a white heart that swells, then bursts
        items.push({ y: Y + 0.01, draw: () => { if (frag >= 1) return; const br = T * 0.62 * rise * (1 + bud * 0.15), heat = 0.4 + 0.6 * Math.max(open * 0.6, bud), gd = petGuard(X, Y - br, T); H.softShadow(c, X, Y, br, 0.22); if (bud > 0 && f.t < BUD + 0.1) H.core(c, X, Y - br * 0.9, br * (0.5 + 0.6 * bud), P.org, P.wht, bud * gd);
          for (let i = 0; i < 5; i++) { const b = i / 5 * TAU - Math.PI / 2, sp = bud * 0.6 + frag, d = Math.sin(b); petal(c, X + Math.cos(b) * br * 0.3 * (1 + sp * 1.8), Y - br * 0.15 + d * br * 0.12 + frag * T, br * 0.75, br * 1.7 * (1 - frag * 0.4), Math.cos(b) * sp * 0.8, 1, bud * 0.5, heat * (0.8 + 0.2 * Math.sin(t * 9 + i)), t, i * 5.1 + 40, k * (1 - frag) * gd); } } });
        items.sort((p, q) => p.y - q.y).forEach(it => it.draw());
        // the flame sweeps racing round between the layers
        for (const t0 of sweeps) { const u = (f.t - t0) / 0.4; if (u <= 0 || u >= 1) continue; for (let j = 0; j < 2; j++) { const rr = T * R * (0.73 + j * 0.3) * (0.8 + 0.2 * u), a0 = u * TAU * 1.1 + j * 2.1 + t0 * 3, al = k * (1 - u * 0.6) * Math.sin(u * Math.PI); for (const off of [0, Math.PI]) { const pts = []; for (let q = 0; q <= 10; q++) { const b = a0 + off + q / 10 * 1.7; pts.push([X + Math.cos(b) * rr, Y - T * 0.35 + Math.sin(b) * rr * H.GY]); } K.floorLight(c, pts[10][0], pts[10][1] + T * 0.35, T * 1.4, 0.5 * al); stream(c, pts, T * 0.3, al, q => 0.2 + 0.8 * q); for (let q = 4; q <= 10; q += 3) { const p = pts[q]; K.flame(c, p[0], p[1] + T * 0.2, T * 0.32, T * 0.8 * (q / 10), t, q + j * 5, -Math.sin(a0 + off + q / 10 * 1.7) * T * 0.3, al * petGuard(p[0], p[1], T), true); } } } }
        // the bud's eruption: a pillar of flame and a white flash rising
        if (f.t > BUD && f.t < BUD + 0.9) { const u = (f.t - BUD) / 0.9, pa = Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - u), gd = petGuard(X, Y - T * 1.5, T); K.glow(c, X, Y - T * 2.2 * u, T * 2.6 * (1 - u * 0.5), P.yel, 0.65 * (1 - u)); for (let i = 0; i < 3; i++) K.flame(c, X + (i - 1) * T * 0.55, Y, T * (0.95 - Math.abs(i - 1) * 0.3), T * (3.8 - Math.abs(i - 1) * 1.2) * pa, t, i * 3.1, 0, k * gd * Math.min(1, pa * 1.5)); K.shockRing(c, X, Y, T * (R + 0.4) * H.ease.out(cl(u * 1.6)), 1 - cl(u * 1.6)); shimmer(c, X, Y - T * 1.5, T * 1.4, T * 3, t, 1 - u); }
        // Celestial: lotus seeds bloom round the rim, then burst
        for (const s of seeds) { const u = cl((f.t - BUD - 0.35) / 0.4), v = cl((f.t - BUD - 0.75) / 0.45); if (u <= 0 || v >= 1) continue; const SX = H.sx(s.x), SY = H.sy(s.y), gd = petGuard(SX, SY - T * 0.5, T); if (v <= 0) { for (let i = 0; i < 3; i++) petal(c, SX + (i - 1) * T * 0.22, SY, T * 0.35, T * 0.7 * H.ease.back(u), (i - 1) * 0.5 * u, 1, u, 0.9, t, i + s.x, k * gd); H.core(c, SX, SY - T * 0.4, T * 0.3 * u, P.org, P.wht, u * gd); } else { K.shockRing(c, SX, SY, T * 1.4 * H.ease.out(v), 1 - v); K.flame(c, SX, SY, T * 0.6, T * 1.8 * (1 - v), t, s.x, 0, (1 - v) * k * gd, true); } } } });
    sweeps.forEach((t0, i) => H.X.after(t0 + 0.12, () => { H.hitRing(x, y, 0.6, R + 0.5, 5.4 / nSw * D * norm, C.dmgO({ kb: 2 + i, burn: 1 })); for (const m of H.living()) if (Math.hypot(m.x - x, m.y - y) < R + 0.5) H.slow(m, 0.6); for (let j = 0; j < H.n(14); j++) { const b = Math.random() * TAU, r = R * (0.4 + Math.random() * 0.6); H.P({ kind: 'ember', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r * H.GY, vx: -Math.sin(b) * 3, vy: Math.cos(b) * 1.5 - 2, g: -1, life: 0.6, max: 0.6, size: 4, color: j % 2 ? P.org : P.yel }); } K.sparks(x, y, 6, 6); H.X.light(x, y, R * 1.3, 0.25); H.X.shake(4, 0.12); H.X.sfx.whoosh(); }));
    H.X.after(BUD - 0.35, () => H.warn(x, y, R + 0.5, 0.35, C.col));
    H.X.after(BUD, () => { H.hitArea(x, y, R + 0.5, 4.6 * D * norm, C.dmgO({ kb: 6, burn: 1, stun: 0.5 })); K.blast(x, y, R * 0.8, 2.2); H.P({ kind: 'pillar', x, y, vx: 0, vy: 0, life: 0.55, max: 0.55, size: 1.5, color: P.org }); H.X.ring(x, y, 0.3, R + 0.5, 0.5, P.yel, 0.5); H.X.flash(0.3, '#FFE0B0'); H.fire(x, y, 1.6, 3, C.base * 0.7, 'fire');
      for (let j = 0; j < H.n(26); j++) { const b = j / 26 * TAU; H.P({ kind: 'shard', x: x + Math.cos(b) * R * 0.7, y: y + Math.sin(b) * R * 0.4 - 1, vx: Math.cos(b) * 5, vy: Math.sin(b) * 2.5 - 4, g: 9, life: 0.9, max: 0.9, size: 4.5, rot: b, vr: 7, color: j % 3 ? P.char : P.gold }); H.P({ kind: 'ember', x: x + Math.cos(b) * R * 0.7, y: y + Math.sin(b) * R * 0.4 - 1, vx: Math.cos(b) * 3, vy: Math.sin(b) * 1.5 - 2, g: 2, life: 0.9, max: 0.9, size: 4, color: P.org }); } K.smoke(x, y, 6, R * 0.4); H.X.sfx.crash(); H.X.hitstop(0.08); });
    for (const s of seeds) H.X.after(BUD + 0.75, () => { H.hitArea(s.x, s.y, 1.3, 0.3 * D * norm, C.dmgO({ kb: 3, burn: 1 })); K.blast(s.x, s.y, 1.1, 0.7); K.flakes(s.x, s.y, 4); });
    return F; };
})();
