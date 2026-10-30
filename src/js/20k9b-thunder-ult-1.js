/* ---------- Lightning, reworked: Ultimates LI-U01 Lightning Flash, LI-U02 Thunderstorm ----------
   (This file also retires the ten old thunder Ultimates: the new keys are in ELEM_MOVES.thunder.ult.)
   Lightning Flash moves the pet itself: it is invulnerable through the dashes (me.inv held just under the blink
   threshold), the stick is held still (a zero push), every dash moves it with the game's own collision (moveEnt, the
   walk mode: never through walls or over gaps) toward a point checked clear first, and it ends on a walkable spot.
   Its afterimages are the pet's own silhouette made of light: a picture of the pet built once per size (a hollow
   violet / cyan / white rim and the pet re-hued electric inside, its markings showing as the brightest parts). */
(() => {
  const S = ELEM_IMPL.thunder.strong, U = ELEM_IMPL.thunder.ult;   // (S unused here: the Strongs are other workers')
  for (const k of ['thunderking', 'ninedragon', 'capacitorsky', 'thunderloom', 'stormbird', 'magnetar', 'thousandbells', 'heavenrail', 'lightningtree', 'heartbeat']) delete U[k];
  const TAU = Math.PI * 2, P = TK.P;
  let H, K;
  const cl = u => Math.max(0, Math.min(1, u)), lerp = (a, b, u) => a + (b - a) * u;
  const rnd = k => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const ppx = c => { const m = c.getTransform(); return Math.max(0.5, Math.hypot(m.a, m.b)); };
  /* how much a tall thing at screen (X0, Y0) may show: it thins to a ghost where it would stand in front of the pet */
  function petGuard(X0, Y0, T, rad) { const mx = H.sx(H.me.x), my = H.sy(H.me.y) - T * 0.45, d = Math.hypot(X0 - mx, (Y0 - my) * 1.15) - (rad || 0); return Math.max(0.22, cl((d - T * 0.6) / (T * 0.8))); }
  /* the pet's height and feet on screen, as the game draws it */
  const petH = T => { const me = H.me, g = H.g, SZ = Math.max(0.6, ((me.r || 0.3) - 0.2) / 0.1); return T * 1.02 * SZ * (g.pw && g.pw.giant ? 1.35 : 1) * (g.petK || 1); };

  /* ---- the pet's light-silhouette: built once per pet picture and size ---- */
  const PG = { S: null, hh: 0, rim: null, body: null, W: 0, H: 0, fx: 0, fy: 0 };
  function petGlow(hpx) {
    const SP = typeof arc !== 'undefined' ? arc.sprites : null, hh = Math.max(16, Math.min(360, Math.round(hpx / 4) * 4));
    if (PG.rim && PG.S === SP && PG.hh === hh) return PG;
    const W = Math.ceil(hh * 1.7), Hh = Math.ceil(hh * 1.8), fx = W / 2, fy = Math.round(Hh * 0.86);
    const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; return cv; };
    const body = mk(), bg = body.getContext('2d'); try { drawPetSprite(bg, fx, fy, hh, {}); } catch (e) { bg.fillStyle = '#fff'; bg.beginPath(); bg.ellipse(fx, fy - hh / 2, hh * 0.42, hh / 2, 0, 0, TAU); bg.fill(); }
    const mask = mk(), mg = mask.getContext('2d'); mg.drawImage(body, 0, 0); mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#FFFFFF'; mg.fillRect(0, 0, W, Hh);
    const tint = mk(), tg = tint.getContext('2d'), rim = mk(), rg = rim.getContext('2d');
    // the rim: the silhouette in four colours spread round it, wide and faint violet to tight and white, then hollowed
    for (const [col, rr, a, n] of [[P.deep, 0.11, 0.16, 12], [P.violet, 0.07, 0.3, 12], [P.blue, 0.042, 0.5, 12], [P.cyan, 0.024, 0.85, 10], [P.white, 0.011, 1, 8]]) {
      tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, Hh); tg.drawImage(mask, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = col; tg.fillRect(0, 0, W, Hh);
      rg.globalAlpha = a; for (let i = 0; i < n; i++) { const b = i / n * TAU; rg.drawImage(tint, Math.cos(b) * rr * hh, Math.sin(b) * rr * hh); } }
    rg.globalAlpha = 1; rg.globalCompositeOperation = 'destination-out'; rg.drawImage(mask, 0, 0);
    // the body: the pet's own picture re-hued electric (its light and dark kept, so its markings show), then a white
    // sheen down its lit side
    bg.globalCompositeOperation = 'color'; bg.fillStyle = P.cyan; bg.fillRect(0, 0, W, Hh);
    bg.globalCompositeOperation = 'multiply'; bg.fillStyle = '#6FA8FF'; bg.fillRect(0, 0, W, Hh); bg.globalCompositeOperation = 'lighter'; bg.globalAlpha = 0.3; const sh = bg.createLinearGradient(fx - hh * 0.5, fy - hh, fx + hh * 0.3, fy); sh.addColorStop(0, P.white); sh.addColorStop(0.5, P.blue); sh.addColorStop(1, P.deep); bg.fillStyle = sh; bg.fillRect(0, 0, W, Hh);
    bg.globalAlpha = 1; bg.globalCompositeOperation = 'destination-in'; bg.drawImage(mask, 0, 0);
    Object.assign(PG, { S: SP, hh, rim, body, W, H: Hh, fx, fy }); return PG;
  }
  /* the light-silhouette with its feet at screen (X, Y), h px tall. o: { rim, body, flip, lean, sx, sy, halo } */
  function ghost(c, X, Y, h, a, o) {
    if (!(a > 0.01) || h < 4) return; o = o || {}; const G = petGlow(h * ppx(c)), k = h / G.hh;
    if (o.halo !== 0) K.glow(c, X, Y - h * 0.5, h * 0.95, P.blue, 0.35 * a * (o.halo || 1));
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(X, Y); if (o.lean) { c.translate(0, -h * 0.15); c.rotate(o.lean); c.translate(0, h * 0.15); } c.scale((o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1);
    const b = o.body == null ? 0.55 : o.body; if (b > 0.01) { c.globalAlpha = Math.min(1, a * b); c.drawImage(G.body, -G.fx * k, -G.fy * k, G.W * k, G.H * k); }
    const r = o.rim == null ? 1 : o.rim; if (r > 0.01) { c.globalAlpha = Math.min(1, a * r); c.drawImage(G.rim, -G.fx * k, -G.fy * k, G.W * k, G.H * k); if (a * r > 1.01) { c.globalAlpha = Math.min(1, a * r - 1); c.drawImage(G.rim, -G.fx * k, -G.fy * k, G.W * k, G.H * k); } }
    c.restore(); }
  /* crackle round a body (screen): n small arcs jumping between points of an ellipse */
  function crackle(c, X, Y, rx, ry, n, t, a, s) { for (let i = 0; i < n; i++) { const sd = K.seed(t, i + (s || 0), 16), b0 = rnd(sd) * TAU, b1 = b0 + 0.5 + rnd(sd + 3) * 0.9; K.arc(c, X + Math.cos(b0) * rx, Y + Math.sin(b0) * ry, X + Math.cos(b1) * rx * 0.95, Y + Math.sin(b1) * ry * 0.95, sd, 1.1, a, { forks: 1, jit: rx * 0.2 }); } }

  /* a tapered plasma ribbon from (ax, ay) (the tail) to (bx, by) (the head), screen px: a wide violet fringe, a cyan
     body, a white leading edge; three filled tapers (cheap: no per-segment strokes) and a glow at the head */
  function taper(c, ax, ay, bx, by, w, t0, t1) { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, x0 = ax + dx * t0, y0 = ay + dy * t0;
    c.beginPath(); c.moveTo(x0 + nx * w * 0.08, y0 + ny * w * 0.08); c.lineTo(bx + nx * w, by + ny * w); c.arc(bx, by, w, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true); c.lineTo(x0 - nx * w * 0.08, y0 - ny * w * 0.08); c.closePath(); }
  function plasma(c, ax, ay, bx, by, w, a, gold) { if (!(a > 0.01) || w < 0.5) return; c.save(); c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.32 * a; c.fillStyle = P.violet; taper(c, ax, ay, bx, by, w * 1.9, 0); c.fill();
    c.globalAlpha = 0.5 * a; c.fillStyle = gold ? P.gold : P.blue; taper(c, ax, ay, bx, by, w * 1.15, 0.12); c.fill();
    c.globalAlpha = 0.85 * a; c.fillStyle = gold ? P.amber : P.cyan; taper(c, ax, ay, bx, by, w * 0.7, 0.3); c.fill();
    c.globalAlpha = a; c.fillStyle = P.white; taper(c, ax, ay, bx, by, w * 0.32, 0.55); c.fill(); c.restore();
    K.glow(c, bx, by, w * 3, gold ? P.gold : P.cyan, 0.38 * a); K.glow(c, lerp(ax, bx, 0.6), lerp(ay, by, 0.6), w * 3.2, P.violet, 0.25 * a); }
  /* two fine filaments spiralling round a trail (screen), phase turning with time */
  function filaments(c, ax, ay, bx, by, w, t, a) { if (!(a > 0.01)) return; const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, n = Math.max(6, Math.min(22, Math.round(L / 9))), tw = Math.max(2, L / (w * 2.6));
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let s = 0; s < 2; s++) { c.beginPath(); for (let i = 0; i <= n; i++) { const u = i / n, ph = u * tw * TAU * 0.5 - t * 14 + s * Math.PI, A = w * 1.25 * (0.25 + 0.75 * u), px = ax + dx * u + nx * Math.cos(ph) * A, py = ay + dy * u + ny * Math.cos(ph) * A - Math.sin(ph) * A * 0.55; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.globalAlpha = 0.45 * a; c.strokeStyle = s ? P.violet : P.blue; c.lineWidth = 3; c.stroke(); c.globalAlpha = 0.9 * a; c.strokeStyle = s ? P.ice : P.white; c.lineWidth = 1.1; c.stroke(); }
    c.restore(); }
  /* a contact flare: a four-pointed star of light with a ring on the floor */
  function flare(c, X, Y, r, a, rot, gold) { if (!(a > 0.01)) return; K.glow(c, X, Y, r * 1.6, gold ? P.gold : P.blue, 0.55 * a); K.glow(c, X, Y, r * 0.45, P.white, 0.7 * a);
    for (let i = 0; i < 4; i++) { const b = rot + i * Math.PI / 2, L = r * (i % 2 ? 1.0 : 1.6); H.ray(c, X, Y, b, L, r * 0.12, i % 2 ? P.cyan : P.white, 0.85 * a); } }

  /* ================= LI-U01 Lightning Flash ================= */
  // The pet crouches as electricity gathers along its body: its markings light, sparks are pulled to its feet, its
  // silhouette becomes a brilliant outline. Then it launches through the monsters in lightning dashes, each leaving a
  // tapered plasma ribbon (white leading edge, cyan centre, violet fringe) and, at each turn, an afterimage of the pet
  // already leaning into its next dash; sparks spray backward as it goes.
  // Level 1: four sharp dashes through the group, a stronger flare on the fourth contact. Level 4: eight, two fine
  // filaments spiralling round each trail; it circles the group, then cuts through it from alternating angles. Level 7:
  // sixteen in four accelerating bursts of four along a sixteen-point star (the trails linger and reveal the pattern);
  // the sixteenth is a long spear-shaped streak, and on its contact every trail fragment races back into the pet's outline
  // as it lands amid backward-streaming sparks.
  U.flash = (C, h) => { H = h; K = TK.bind(H); const me = H.me, ev = K.evo(C), fin = ev >= 7, fil = ev >= 4, D = C.base * C.K * K.evoK(C);
    const N = [4, 5, 6, 8, 10, 12, 16][ev - 1], CH = fin ? 0.75 : 0.85, ZH = 0.42;
    // the group and the ring the pet runs round it
    const ax = C.tx, ay = C.ty, grp = H.sortNear(ax, ay).filter(m => Math.hypot(m.x - ax, m.y - ay) < 4.5 || Math.hypot(m.x - me.x, m.y - me.y) < 4.5).slice(0, 8);
    let gx = ax, gy = ay; if (grp.length) { gx = 0; gy = 0; for (const m of grp) { gx += m.x; gy += m.y; } gx /= grp.length; gy /= grp.length; }
    { const q = H.walk(gx, gy); gx = q.x; gy = q.y; }
    const Rc = Math.max(1.9, Math.min(3.4, grp.reduce((a, m) => Math.max(a, Math.hypot(m.x - gx, m.y - gy)), 0) + 1.3)), th0 = Math.atan2(me.y - gy, me.x - gx);
    // the plan: N dashes, each an angle on the ring round the group (and whether it cuts through it); each is made safe
    // when it begins: of a few nearby angles, the one with the longest clear run (and, for a cut, nearest the group's heart)
    const plan = []; { let b = th0;
      if (fin) { for (let k = 1; k <= 16; k++) plan.push({ b: th0 + k * 7 * TAU / 16, r: 1, cut: true }); plan[15] = { spear: true, r: (Rc + 2.0) / Rc, cut: true }; }
      else if (fil) { const nC = Math.max(3, Math.round(N * 0.38)); for (let k = 0; k < N; k++) { if (k < nC) b += 1.25; else b += Math.PI + ((k - nC) % 2 ? -0.45 : 0.45); plan.push({ b, r: 1, cut: k >= nC }); } }
      else { for (let k = 0; k < N; k++) { b += Math.PI + (k % 2 ? -0.62 : 0.62) * (k ? 1 : 0); plan.push({ b, r: 1, cut: true }); } } }
    const target = (k, f) => { const p = plan[k], b0 = p.spear ? Math.atan2(gy - me.y, gx - me.x) : p.b, C2 = [];
      for (const off of p.spear ? [0, 0.2, -0.2, 0.4, -0.4] : [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05]) { const b = b0 + off; C2.push([p.spear ? me.x + Math.cos(b) * Rc * (1 + p.r) : gx + Math.cos(b) * Rc * p.r, p.spear ? me.y + Math.sin(b) * Rc * (1 + p.r) : gy + Math.sin(b) * Rc * p.r, off]); }
      // (a cut may also aim straight through a monster and out the far side)
      if (k === 0 || (p.cut && !fin)) for (const m of H.living()) { const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < 0.4 || d > Rc * 2.2) continue; C2.push([m.x + (m.x - me.x) / d * 1.5, m.y + (m.y - me.y) / d * 1.5, 0.5]); }
      let best = null;
      for (const [tx, ty, off] of C2) { const q = clearTo(me.x, me.y, tx, ty), L = Math.hypot(q[0] - me.x, q[1] - me.y);
        let hits = 0; for (const m of H.living()) if (segD(m.x, m.y, me.x, me.y, q[0], q[1]) < m.r + 0.55) hits++;
        const back = f.dash ? Math.hypot(q[0] - f.dash.x0, q[1] - f.dash.y0) : 9, sc = Math.min(L, Rc * 2.2) + Math.min(3, hits) * (k === 0 ? 4 : 1.5) - (p.cut ? 1.0 * segD(gx, gy, me.x, me.y, q[0], q[1]) : 0) - off * off * 0.6 - (back < 0.9 ? 2.5 : 0) - (L < 1 ? 3 : 0);
        if (!best || sc > best.sc) best = { sc, q }; }
      return best.q; };
    // timing: each dash's length in time and the pause at the turn after it (Celestial: four bursts, each faster)
    const durOf = k => fin ? [0.17, 0.14, 0.115, 0.095][k >> 2] * (k === 15 ? 2.0 : 1) : fil ? 0.17 : 0.21, pauseOf = k => fin ? ((k & 3) === 3 ? 0.21 : [0.05, 0.04, 0.03, 0.025][k >> 2]) : fil ? 0.1 : 0.15;
    const per = (fin ? 11.5 : 12) * D / N, TF = fin ? 1.5 : fil ? 0.65 : 0.5, LIFE_END = fin ? 1.25 : 0.95;
    const sx0 = me.x, sy0 = me.y; me.dash = null; me.dodge = null; me.leap = null;
    H.X.banner('LIGHTNING FLASH', '', C.col, 1.3); H.X.sfx.hum(); me.sq = 1;
    const F = H.add({ life: 30, x: sx0, y: sy0, onEnd(f) { if (me.push === f.hold) me.push = null; me.sq = 0; }, ph: 'crouch', k: -1, dash: null, trails: [], ghosts: [], flares: [], conv: -1, land: -1, endT: -1, hold: null, sum: 0,
      update(dt, f) { const t = f.t;
        if (me.dead) { f.life = Math.min(f.life, 0.3); return; }
        const busy = f.endT < 0; if (busy) { me.inv = Math.max(me.inv, 0.08 + dt); f.hold = me.push = { vx: 0, vy: 0, t: 0.12 }; }
        if (f.ph === 'crouch') { const u = cl(t / CH); me.sq = Math.max(me.sq, 0.35 + 0.65 * u);
          // sparks pulled in to its feet, charged air round it
          const k2 = 26 * u * dt * H.Q(); let m = Math.floor(k2) + (Math.random() < k2 % 1 ? 1 : 0); while (m-- > 0) { const b = Math.random() * TAU, rr = 0.9 + Math.random() * 0.9, x = me.x + Math.cos(b) * rr, y = me.y + Math.sin(b) * rr * 0.6 - Math.random() * 0.6, life = 0.28 + Math.random() * 0.12; H.P({ kind: 'spark', x, y, vx: (me.x - x) / life, vy: (me.y + 0.1 - y) / life, life, max: life, size: 1.6, color: Math.random() < 0.5 ? P.white : Math.random() < 0.6 ? P.cyan : P.violet }); }
          K.aura(me.x, me.y, 0.45, dt, 10 * u, 0.4);
          if (t >= CH) { f.ph = 'turn'; f.turnT = 0; f.k = -1; H.X.sfx.crack(); H.X.flash(0.08, P.ice); H.X.shake(4, 0.12); } }
        if (f.ph === 'turn') { f.turnT -= dt; if (f.turnT <= 0) startDash(f); }
        else if (f.ph === 'dash') runDash(f, dt);
        // the end: the fragments come home (Celestial), the pet's outline settles, everything fades
        if (f.conv >= 0 && t - f.conv > 0.5 && f.land < 0) land(f);
        if (f.endT >= 0 && t - f.endT > LIFE_END) f.life = 0;
        for (const fl of f.flares) if (t - fl.t0 < 0.5 && !fl.lit) { fl.lit = 1; H.X.light(fl.x, fl.y, fl.big ? 3.2 : 1.8, fl.big ? 0.35 : 0.2); } },
      drawUnder(c, f, X, Y, T) { const t = f.t, PX = H.sx(me.x), PY = H.sy(me.y) + T * 0.18;
        if (f.ph === 'crouch' || (f.k === 0 && f.ph === 'turn')) { const u = cl(t / CH); K.floorLight(c, PX, PY, T * (0.6 + 1.3 * u), 0.55 * u, P.blue); K.floorLight(c, PX, PY, T * 0.5, 0.6 * u, P.cyan); K.groundArcs(c, PX, PY, T * (1.6 - 0.9 * u), 3, t, 0.55 * u, 1.3); }
        // the floor holds a fading violet impression of every dash (at Celestial a luminous star, lit again as it closes)
        for (const tr of f.trails) { const age = tr.done < 0 ? 0 : t - tr.done, life = tr.spear ? TF + 0.6 : TF + 0.5; let a = tr.done < 0 ? 1 : cl(1 - age / life); if (f.conv >= 0) a *= 1 - cl((t - f.conv) / 0.8) * 0.6; if (a <= 0.01) continue;
          const A = [H.sx(tr.x0), H.sy(tr.y0)], B = [H.sx(tr.x1), H.sy(tr.y1)]; K.scar(c, [A, B], a * (fin ? 0.9 : 0.75));
          if (fin) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * a; c.strokeStyle = P.cyan; c.lineWidth = 1.2; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); c.restore(); } }
        for (const fl of f.flares) { const u = (t - fl.t0) / (fl.big ? 0.7 : 0.45); if (u < 0 || u > 1) continue; const FX = H.sx(fl.x), FY = H.sy(fl.y); K.shockRing(c, FX, FY, T * (fl.big ? 0.5 + 2.2 * H.ease.out(u) : 0.3 + 1.0 * H.ease.out(u)), 1 - u, t, fl.big ? 5 : 0); K.floorLight(c, FX, FY, T * (fl.big ? 2.6 : 1.3), 0.6 * (1 - u), P.blue); }
        if (f.land >= 0) { const u = cl((t - f.land) / 0.9); K.floorLight(c, PX, PY, T * (1 + 1.6 * u), 0.6 * (1 - u), P.cyan); if (u < 0.6) K.shockRing(c, PX, PY, T * (0.4 + 1.8 * H.ease.out(u / 0.6)), 1 - u / 0.6, t, 4); } },
      draw(c, f, X, Y, T) { const t = f.t, ph = petH(T), PX = H.sx(me.x), PY = H.sy(me.y) + T * 0.18, sq = me.sq || 0, flip = me.face < 0, zh = T * ZH;
        // the trails: tapered plasma, two filaments round each from Adept, the spear's head
        for (const tr of f.trails) { const age = tr.done < 0 ? 0 : t - tr.done; let a = tr.done < 0 ? 1 : cl(1 - age / TF);
          if (fin && tr.done >= 0 && !tr.spear) { a = cl(1 - age / 0.4);   // (the ribbon thins to a fine strand: together they draw the star)
            const sa = f.conv < 0 ? cl(age / 0.25) * (0.55 + 0.25 * Math.sin(t * 7 + tr.i * 1.3)) : 0; if (sa > 0.01) { const A0 = [H.sx(tr.x0), H.sy(tr.y0) - zh], A1 = [H.sx(tr.x1), H.sy(tr.y1) - zh], pv = (t * 1.6 + tr.i * 0.37) % 1;
              c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.globalAlpha = 0.28 * sa; c.strokeStyle = P.violet; c.lineWidth = 5; c.beginPath(); c.moveTo(A0[0], A0[1]); c.lineTo(A1[0], A1[1]); c.stroke(); c.globalAlpha = 0.75 * sa; c.strokeStyle = P.cyan; c.lineWidth = 1.4; c.stroke(); c.restore();
              K.glow(c, lerp(A0[0], A1[0], pv), lerp(A0[1], A1[1], pv), T * 0.3, P.ice, 0.7 * sa); } }
          if (f.conv >= 0 && tr.done >= 0 && !tr.spear) a = 0;   // (its pieces are flying home: drawn below)
          if (a <= 0.01) continue; const ax0 = H.sx(tr.x0), ay0 = H.sy(tr.y0) - zh, bx0 = H.sx(tr.x1), by0 = H.sy(tr.y1) - zh, w = T * (tr.spear ? 0.3 : 0.2) * (tr.done < 0 ? 1 : 0.75 + 0.25 * a);
          plasma(c, ax0, ay0, bx0, by0, w, a, tr.spear);
          if (fil) filaments(c, ax0, ay0, bx0, by0, w, t + tr.i, a * 0.9);
          if (tr.spear) { const dx = bx0 - ax0, dy = by0 - ay0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, hl = T * 0.9, hw = T * 0.28; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.fillStyle = H.rgba(P.gold, 0.6); c.beginPath(); c.moveTo(bx0 + ux * hl, by0 + uy * hl); c.lineTo(bx0 - uy * hw, by0 + ux * hw); c.lineTo(bx0 - ux * hl * 0.4, by0 - uy * hl * 0.4); c.lineTo(bx0 + uy * hw, by0 - ux * hw); c.closePath(); c.fill(); c.fillStyle = P.white; c.beginPath(); c.moveTo(bx0 + ux * hl * 0.85, by0 + uy * hl * 0.85); c.lineTo(bx0 - uy * hw * 0.4, by0 + ux * hw * 0.4); c.lineTo(bx0 - ux * hl * 0.2, by0 - uy * hl * 0.2); c.lineTo(bx0 + uy * hw * 0.4, by0 - ux * hw * 0.4); c.closePath(); c.fill(); c.restore(); K.glow(c, bx0 + ux * hl * 0.3, by0 + uy * hl * 0.3, T * 1.3, P.gold, 0.6 * a); }
          if (tr.done < 0) { const sd = K.seed(t, tr.i, 24); K.arc(c, bx0, by0, lerp(ax0, bx0, 0.55 + rnd(sd) * 0.3) + (rnd(sd + 1) - 0.5) * T * 0.6, lerp(ay0, by0, 0.6) + (rnd(sd + 2) - 0.5) * T * 0.5, sd, 1.2, 0.8, { forks: 1 }); } }
        // Celestial: the fragments of every trail race back into the pet
        if (f.conv >= 0) { const v0 = (t - f.conv) / 0.5, hx = PX, hy = PY - ph * 0.5;
          for (const tr of f.trails) { if (tr.spear || tr.done < 0) continue; const A0 = [H.sx(tr.x0), H.sy(tr.y0) - zh], A1 = [H.sx(tr.x1), H.sy(tr.y1) - zh];
            for (let j = 0; j < 3; j++) { const v = cl(v0 * 1.3 - j * 0.1 - (tr.i % 4) * 0.05); if (v >= 1) continue; const e = H.ease.in(v), mx = lerp(A0[0], A1[0], (j + 0.5) / 3), my = lerp(A0[1], A1[1], (j + 0.5) / 3), hx2 = (A1[0] - A0[0]) / 6 * (1 - e), hy2 = (A1[1] - A0[1]) / 6 * (1 - e), cx = lerp(mx, hx, e), cy = lerp(my, hy, e);
              plasma(c, cx - hx2 - (hx - mx) * 0.08 * e, cy - hy2 - (hy - my) * 0.08 * e, cx + hx2, cy + hy2, T * 0.13 * (1 - e * 0.5), 0.7 - v * 0.3); } } }
        // the afterimages: the pet in light, leaning into its next dash, flickering out
        for (const gh of f.ghosts) { const u = (t - gh.t0) / gh.life; if (u < 0 || u >= 1) continue; const GX = H.sx(gh.x), GY = H.sy(gh.y) + T * 0.18, a = (u < 0.3 ? 1 : (1 - u) / 0.7) * (0.85 + 0.15 * Math.sin(t * 40 + gh.x * 9));
          ghost(c, GX, GY, ph, a, { flip: gh.flip, lean: gh.lean, sx: 1 + 0.08 * (1 - u), sy: 1 - 0.04 * (1 - u), body: 0.5, rim: 1.15, halo: 0.5 });
          if (u < 0.6) crackle(c, GX, GY - ph * 0.5, ph * 0.45, ph * 0.55, 2, t, a * 0.8, gh.i * 7); }
        // the pet itself: in the crouch its markings light and the outline grows brilliant; through the dashes it is all
        // outline and light; afterward the light ebbs away from it
        let ga = 0, gb = 0; const cu = cl(t / CH);
        if (f.ph === 'crouch') { ga = 0.1 + 0.9 * cu; gb = (0.05 + 0.25 * cu) * (0.7 + 0.3 * Math.sin(t * 22)); }
        else if (f.endT < 0) { ga = 1.0; gb = 0.28; }
        else { const u = cl((t - f.endT) / (LIFE_END - 0.1)); ga = (1 - u) * (f.land >= 0 && t - f.land < 0.25 ? 1.8 : 1.1); gb = 0.45 * (1 - u); }
        if (ga > 0.01) { ghost(c, PX, PY, ph, 1, { flip, rim: ga, body: gb, sx: 1 + sq * 0.12, sy: 1 - sq * 0.1, halo: 0.4 * ga });
          if (f.ph === 'crouch') { crackle(c, PX, PY - ph * 0.45, ph * 0.42, ph * 0.5, 1 + Math.round(cu * 3), t, 0.4 + 0.5 * cu, 3); K.glow(c, PX, PY - T * 0.05, T * 0.6 * cu, P.cyan, 0.45 * cu); }
          else if (f.endT < 0 && f.dash) { const d = f.dash, ux = Math.cos(d.a), uy = Math.sin(d.a); K.glow(c, PX - ux * T * 0.6, PY - ph * 0.5 - uy * T * 0.35, ph * 0.7, P.violet, 0.4); } }
        // the contact flares (the fourth at Hatchling and every last contact bigger, gold at its heart)
        for (const fl of f.flares) { const u = (t - fl.t0) / (fl.big ? 0.55 : 0.3); if (u < 0 || u > 1) continue; const e = H.ease.out(u); flare(c, H.sx(fl.x), H.sy(fl.y) - T * 0.4, T * (fl.big ? 1.1 + 1.4 * e : 0.55 + 0.6 * e), (1 - u) * (fl.big ? 1 : 0.7), fl.rot + u * 0.6, fl.big); } } });
    // a dash begins: its target made safe (clear of walls and gaps from where the pet now is)
    function startDash(f) { f.k++; if (f.k >= N) { finish(f); return; }
      const k = f.k, q = target(k, f), dx = q[0] - me.x, dy = q[1] - me.y, L = Math.hypot(dx, dy);
      const a = L > 0.05 ? Math.atan2(dy, dx) : (f.dash ? f.dash.a + 2 : th0 + Math.PI);
      f.dash = { k, x0: me.x, y0: me.y, x1: q[0], y1: q[1], a, L, dur: durOf(k), t: 0, hit: new Set(), spear: fin && k === N - 1, tr: { i: k, x0: me.x, y0: me.y, x1: me.x, y1: me.y, done: -1, spear: fin && k === N - 1 } };
      f.trails.push(f.dash.tr); f.ph = 'dash'; if (Math.cos(a) !== 0) me.face = Math.cos(a) < 0 ? -1 : 1;
      // the afterimage at the turn, leaning into this dash
      f.ghosts.push({ i: k, x: me.x, y: me.y, t0: f.t, life: fin ? 0.75 : 0.7, flip: Math.cos(a) < 0, lean: Math.max(-0.42, Math.min(0.42, Math.cos(a) * 0.5)) });
      K.sparks(me.x, me.y - 0.4, 8, 6, { v: 6 }); if (k % 2 === 0 || fin) H.X.sfx.whoosh(); }
    function runDash(f, dt) { const d = f.dash; d.t += dt; const u = cl(d.t / d.dur), e = u * u * (1.6 - 0.6 * u) / 1.0, px = lerp(d.x0, d.x1, Math.min(1, e)), py = lerp(d.y0, d.y1, Math.min(1, e)), bx = me.x, by = me.y;
      H.X.moveEnt(me, px - me.x, py - me.y, 0); d.tr.x1 = me.x; d.tr.y1 = me.y;
      // the hits: whatever the dash passes through this frame
      for (const m of H.living()) { if (d.hit.has(m)) continue; if (segD(m.x, m.y, bx, by, me.x, me.y) < m.r + 0.55) { d.hit.add(m); const big = (!fin && !fil && d.k === N - 1 && d.hit.size === 1) || d.spear; H.X.hitMon(m, per * (d.spear ? 1.6 : big ? 1.4 : 1), C.dmgO({ kb: 0.4, stun: m.boss ? 0.1 : 0.22 }));
        if (big || !f.flares.some(q => f.t - q.t0 < 0.3 && Math.hypot(q.x - m.x, q.y - m.y) < 1)) f.flares.push({ x: m.x, y: m.y, t0: f.t, big, rot: d.a + Math.PI / 4 }); K.sparks(m.x, m.y - 0.4, big ? 22 : 9, big ? 9 : 6); K.motes(m.x, m.y - 0.4, big ? 10 : 4); if (big) { H.X.flash(0.12, P.ice); H.X.shake(7, 0.18); H.X.hitstop(0.05); H.X.sfx.crash(); } else { H.X.hitstop(0.012); H.X.sfx.crack(); }
        if (big && !d.spear) H.hitArea(m.x, m.y, 1.4, 2.2 * D, C.dmgO({ kb: 3, stun: m.boss ? 0.3 : 0.6 })); } }
      // sparks spraying backward
      const nS = H.n(3); for (let i = 0; i < nS; i++) { const b = d.a + Math.PI + (Math.random() - 0.5) * 0.9, v = 5 + Math.random() * 7; H.P({ kind: 'spark', x: me.x + (Math.random() - 0.5) * 0.3, y: me.y - 0.42 + (Math.random() - 0.5) * 0.3, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7 - 0.5, g: 3, life: 0.22 + Math.random() * 0.15, max: 0.35, size: 1.7, color: i % 3 ? P.cyan : P.white }); }
      if (Math.random() < 0.5 * H.Q()) H.P({ kind: 'ember', x: me.x, y: me.y - 0.42, vx: -Math.cos(d.a) * 1.5, vy: -Math.sin(d.a) * 1.5 - 0.6, g: -0.4, life: 0.5, max: 0.5, size: 3, color: P.violet });
      if (u >= 1) { d.tr.done = f.t; if (d.spear) { f.conv = f.t; K.goldSparks(me.x, me.y - 0.4, 16, 8); if (!d.hit.size) f.flares.push({ x: me.x, y: me.y, t0: f.t, big: true, rot: d.a }); H.X.sfx.crash(); H.X.shake(8, 0.2); H.X.flash(0.15, P.ice); }
        else if (!fin && !fil && d.k === N - 1 && !d.hit.size) { f.flares.push({ x: me.x, y: me.y, t0: f.t, big: true, rot: d.a }); H.hitArea(me.x, me.y, 1.4, 2.2 * D, C.dmgO({ kb: 3, stun: 0.5 })); H.X.sfx.crash(); }
        f.ph = 'turn'; f.turnT = pauseOf(d.k); if (d.k === N - 1) f.turnT = fin ? 0 : 0.05; } }
    function finish(f) { f.ph = 'done'; if (f.conv < 0) land(f); }
    function land(f) { f.land = f.t; f.endT = f.t; const q = H.walk(me.x, me.y); if (Math.hypot(q.x - me.x, q.y - me.y) < 1.6) { me.x = q.x; me.y = q.y; }
      if (me.push === f.hold) me.push = null; me.sq = 0.8; me.inv = Math.max(me.inv, 0.3);
      // it lands amid backward-streaming sparks
      const a = f.dash ? f.dash.a : 0, nS = H.n(fin ? 40 : 18); for (let i = 0; i < nS; i++) { const b = a + Math.PI + (Math.random() - 0.5) * 1.6, v = 4 + Math.random() * (fin ? 10 : 6); H.P({ kind: 'spark', x: me.x, y: me.y - 0.3, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6 - 1, g: 5, drag: 0.6, life: 0.4 + Math.random() * 0.3, max: 0.7, size: 2, color: i % 4 === 0 ? P.gold : i % 2 ? P.cyan : P.white }); }
      K.motes(me.x, me.y - 0.4, fin ? 14 : 6); H.X.light(me.x, me.y, fin ? 3.5 : 2, 0.3);
      if (fin) { H.hitArea(me.x, me.y, 2.2, 1.6 * D, C.dmgO({ kb: 3, stun: 0.5 })); H.X.flash(0.2, P.ice); H.X.hitstop(0.06); } }
    function clearTo(x0, y0, x1, y1) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.2)); let lx = x0, ly = y0; for (let i = 1; i <= n; i++) { const u = i / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; if (H.X.blocked(x, y, (me.r || 0.3) + 0.05, 0)) break; lx = x; ly = y; } return [lx, ly]; }
    return F; };
  function segD(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-6, u = cl(((px - ax) * dx + (py - ay) * dy) / L2); return Math.hypot(px - ax - dx * u, py - ay - dy * u); }

  /* ================= LI-U02 Thunderstorm ================= */
  /* a storm-cloud puff (made once): soft lobes of night-violet, lit lighter along the top */
  let PUFF = null;
  function puff() { if (PUFF) return PUFF; const cv = document.createElement('canvas'); cv.width = 160; cv.height = 104; const g = cv.getContext('2d');
    for (const [x, y, r] of [[80, 62, 42], [50, 66, 30], [112, 66, 31], [64, 46, 30], [98, 44, 29], [80, 34, 24]]) { const gr = g.createRadialGradient(x, y - r * 0.25, r * 0.1, x, y, r); gr.addColorStop(0, 'rgba(140,130,230,0.42)'); gr.addColorStop(0.5, 'rgba(78,62,170,0.34)'); gr.addColorStop(0.8, 'rgba(50,36,130,0.16)'); gr.addColorStop(1, 'rgba(30,18,80,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'lighter'; for (const [x, y, r] of [[70, 34, 30], [100, 36, 24]]) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(190,210,255,0.4)'); gr.addColorStop(1, 'rgba(170,190,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    PUFF = cv; return cv; }
  /* a violet current (screen polyline): a soft violet band, an ice-white thread */
  function current(c, pts, w, a) { if (!pts || pts.length < 2 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = 0.5 * a; c.strokeStyle = P.violet; K.line(c, pts, w * 2.6); c.globalAlpha = 0.85 * a; c.strokeStyle = P.ice; K.line(c, pts, Math.max(0.6, w * 0.6)); c.restore(); }
  /* an angular branch (tile units) off point p heading at angle b (screen; down is +y): sharp turns, getting shorter */
  function branch(p, b, L, s, segs) { const pts = [[p[0], p[1]]]; let x = p[0], y = p[1], a = b; for (let i = 0; i < segs; i++) { a = b + (i % 2 ? -1 : 1) * (0.35 + rnd(s + i) * 0.45); const l = L / segs * (1.2 - i * 0.25); x += Math.cos(a) * l; y += Math.sin(a) * l; pts.push([x, y]); } return pts; }
  /* a bolt (tile units, impact at 0,0) from the cloud at height Z: a jittered main path and angular branches */
  function makeBolt(Z, s, nb, big) { const ox = (rnd(s) - 0.5) * Z * 0.3, main = K.path(ox, -Z, 0, 0, s, big ? 0.55 : 0.4, big ? 16 : 12), br = [];
    for (let j = 0; j < nb; j++) { const k = 2 + Math.floor(rnd(s + j * 7.7) * (main.length - 4)), p = main[k], side = (j % 2 ? 1 : -1), b = Math.PI / 2 + side * (0.55 + rnd(s + j * 3.1) * 0.5), L = (0.5 + rnd(s + j * 1.9) * 0.7) * (big ? 1.6 : 1) * (1 - k / main.length * 0.4);
      const pts = branch(p, b, L, s + j * 13, 3); br.push({ k, pts, w: 0.5 });
      if (big && j % 2 === 0) { const q = pts[1]; br.push({ k: k + 1, pts: branch(q, b + side * 0.6, L * 0.55, s + j * 29, 3), w: 0.32 }); } }
    return { main, br }; }
  const toS = (pts, X, Y, T) => pts.map(p => [X + p[0] * T, Y + p[1] * T]);
  /* a floor impression (tile units, floor-projected): crawling violet branches from the impact */
  function makeScar(s, n, R) { const L = []; for (let i = 0; i < n; i++) { const b = i / n * TAU + rnd(s + i) * 0.8; let x = 0, y = 0; const pts = [[0, 0]]; for (let j = 0; j < 4; j++) { const a = b + (rnd(s + i * 5 + j) - 0.5) * 1.2, l = R * (0.3 - j * 0.04) * (0.8 + rnd(s + i + j * 3) * 0.5); x += Math.cos(a) * l; y += Math.sin(a) * l * 0.55; pts.push([x, y]); } L.push(pts); } return L; }

  // The pet raises its head as a translucent storm canopy gathers over the aim, violet currents moving inside the clouds
  // and lighting them from within. Before each strike a thin tendril rises from the ground; a much larger bolt comes down
  // to meet it, splitting into angular branches; each impact makes a low shockwave, crawling ground arcs and a fading
  // violet impression. The strikes build: measured first, then quicker and quicker.
  // Level 1: six strikes and one large finishing burst. Level 4: ten, landing in alternating pairs, luminous currents
  // joining recent impact points. Level 7: sixteen in four escalating sequences; then the clouds open round a brilliant
  // eye, one colossal, heavily branching bolt falls through it with a broad corona over the ground, and the storm unravels
  // into fine descending threads of light.
  U.thunderstorm = (C, h) => { H = h; K = TK.bind(H); const me = H.me, x = C.tx, y = C.ty, ev = K.evo(C), fin = ev >= 7, pairs = ev >= 4 && !fin, D = C.base * C.K * K.evoK(C);
    const R = 3.5 * C.K * (1 + 0.035 * (ev - 1)), Z = 3.6, N = [6, 7, 8, 10, 12, 14, 16][ev - 1], GATH = 1.15;
    // the rhythm: measured to rapid
    const times = []; if (fin) { const gaps = [0.24, 0.18, 0.13, 0.09], st0 = [GATH, GATH + 0.85, GATH + 1.5, GATH + 2.05]; for (let q = 0; q < 4; q++) for (let i = 0; i < 4; i++) times.push(st0[q] + i * gaps[q]); }
    else if (pairs) { let t0 = GATH; const np = N / 2; for (let i = 0; i < np; i++) { times.push(t0, t0 + 0.08); t0 += lerp(0.6, 0.3, i / Math.max(1, np - 1)); } }
    else { let t0 = GATH; for (let i = 0; i < N; i++) { times.push(t0); t0 += lerp(0.58, 0.24, i / Math.max(1, N - 1)); } }
    const last = times[times.length - 1], FIN = last + (fin ? 0.85 : 0.55), EYE = last + 0.25, END = FIN + (fin ? 1.35 : 1.0), per = (fin ? 8 : 8.5) * D / N, finD = (fin ? 5.5 : 5) * D;
    // the canopy: puffs in three rings over the aim
    const puffs = []; { const rings = [[0, 1], [0.5, 6], [0.95, fin ? 10 : 8]]; let i = 0; for (const [rr, n] of rings) for (let j = 0; j < n; j++) { const b = j / n * TAU + rr * 2.1; puffs.push({ i: i++, b, r: rr * R, s: (rr ? 1.0 : 1.25) * (0.85 + rnd(i * 3.3) * 0.35), z: Z + 0.25 * Math.sin(i * 1.7) - rr * 0.35, lit: 0, spin: (rnd(i) - 0.5) * 0.15 }); } }
    const strikes = times.map((t0, i) => ({ i, t0, x, y, done: false, pick: false, bolt: null, scar: null, z: Z - 0.2 }));
    H.warn(x, y, R, GATH, C.col); H.X.banner('THUNDERSTORM', '', C.col, 1.4); H.X.sfx.hum();
    const used = new Map();
    const pickSpot = (s, i) => { const L = H.sortNear(x, y).filter(m => Math.hypot(m.x - x, m.y - y) < R + 0.6); let m = null;
      if (L.length) { const pv = i ? strikes[i - 1] : null, dp = q => pv && pv.pick ? Math.hypot(q.x - pv.x, q.y - pv.y) : 0; m = L.slice().sort((p, q) => (used.get(p) || 0) - (used.get(q) || 0) || dp(q) - dp(p))[0]; used.set(m, (used.get(m) || 0) + 1); }
      let px, py; if (m) { px = m.x + (Math.random() - 0.5) * 0.35; py = m.y + (Math.random() - 0.5) * 0.35; } else { const b = i * 2.4 + 0.5, r = R * 0.85 * Math.sqrt((i + 0.5) / N); px = x + Math.cos(b) * r; py = y + Math.sin(b) * r; }
      const q = H.walk(px, py); s.x = q.x; s.y = q.y; s.bolt = makeBolt(s.z, 17 + i * 31, 4, false); s.scar = makeScar(5 + i * 13, 5, 1.6);
      // the nearest puffs light up from inside
      for (const p of puffs) { const pxx = x + Math.cos(p.b) * p.r, pyy = y + Math.sin(p.b) * p.r * 0.75, d = Math.hypot(pxx - s.x, pyy - s.y); if (d < 1.8) p.lit = Math.max(p.lit, 1 - d / 2.2); } };
    const big = { bolt: makeBolt(Z + 0.3, 991, fin ? 10 : 6, true), scar: makeScar(77, fin ? 10 : 7, fin ? R * 0.9 : R * 0.6), tend: [0, 1, 2].map(j => ({ b: j / 3 * TAU + 0.4, r: 0.5 })) };
    const F = H.add({ life: END, x, y, open: 0, threads: [],
      update(dt, f) { const t = f.t;
        for (const p of puffs) { p.b += p.spin * dt; p.lit = Math.max(0, p.lit - dt * 2.6); if (Math.random() < 0.35 * dt) p.lit = Math.max(p.lit, 0.35 + Math.random() * 0.3); }
        for (const s of strikes) if (!s.pick && t > s.t0 - 0.32) { s.pick = true; pickSpot(s, s.i); }
        f.open = fin ? cl((t - EYE) / 0.45) * (1 - cl((t - FIN - 0.7) / 0.6)) : 0;
        if (t < GATH + 0.3) { K.aura(me.x, me.y - 0.6, 0.25, dt, 6, 0.3); if (Math.random() < 3 * dt * H.Q()) H.P({ kind: 'ember', x: me.x + (Math.random() - 0.5) * 0.4, y: me.y - 0.8, vx: (x - me.x) * 0.3, vy: -2.5, g: -0.5, life: 0.7, max: 0.7, size: 2.5, color: P.violet }); }
        if (t < FIN + 0.4) { f._lt = (f._lt || 0) - dt; if (f._lt <= 0) { f._lt = 0.12; H.X.light(x, y - 1, R * (0.5 + 0.35 * cl(t / GATH)), 0.18); } }
        // Celestial: the storm unravels into threads of light falling from the clouds
        if (fin && t > FIN + 0.35 && t < END - 0.4 && f.threads.length < 70) { const k2 = 60 * dt; for (let i = 0; i < k2; i++) { const p = puffs[Math.floor(Math.random() * puffs.length)]; f.threads.push({ x: x + Math.cos(p.b) * p.r * (1 + f.open * 0.4) + (Math.random() - 0.5) * 0.8, y: y + Math.sin(p.b) * p.r * 0.75 * (1 + f.open * 0.4), z: p.z - 0.2, t0: t, v: 2.2 + Math.random() * 1.5, L: 0.4 + Math.random() * 0.5 }); } } },
      drawUnder(c, f, X, Y, T) { const t = f.t, form = cl(t / GATH), kk = Math.min(1, f.life / 0.8);
        K.floorLight(c, X, Y, T * R * 1.05, 0.16 * form * kk, P.violet);
        for (const s of strikes) { if (!s.pick || t < s.t0 - 0.32) continue; const SX = H.sx(s.x), SY = H.sy(s.y), u = t - s.t0;
          if (u < 0) { K.floorLight(c, SX, SY, T * 0.5, 0.4 * cl(1 + u / 0.32), P.cyan); continue; }
          if (u < 1.8) for (const L of s.scar) K.scar(c, toS(L, SX, SY, T), (1 - u / 1.8) * 0.9);
          if (u < 0.5) { K.floorLight(c, SX, SY, T * 1.6, 0.75 * (1 - u / 0.5), P.blue); K.shockRing(c, SX, SY, T * (0.3 + 1.3 * H.ease.out(u / 0.5)), 1 - u / 0.5, t, 0); }
          if (u < 0.45) K.groundArcs(c, SX, SY, T * (0.8 + u * 1.4), 4, t, 0.85 * (1 - u / 0.45), s.i); }
        // Adept: luminous currents join the recent impacts
        if (pairs || ev >= 4) for (let i = 1; i < strikes.length; i++) { const a0 = strikes[i - 1], a1 = strikes[i], u = t - a1.t0; if (u < 0 || u > 0.75 || !a0.pick) continue; const k = (1 - u / 0.75); K.arc(c, H.sx(a0.x), H.sy(a0.y), H.sx(a1.x), H.sy(a1.y), K.seed(t, i, 18), 1.5, 0.75 * k, { forks: 1, jit: T * 0.35 }); if (pairs && i % 2 && i > 1) { const b0 = strikes[i - 2]; K.arc(c, H.sx(b0.x), H.sy(b0.y), H.sx(a1.x), H.sy(a1.y), K.seed(t, i + 50, 18), 1.1, 0.5 * k, { forks: 0, jit: T * 0.3 }); } }
        // the finish: a broad corona across the floor (Celestial), a strong ring (below)
        const u = t - FIN; if (u > -0.35 && u < 1.6) { if (u < 0) K.floorLight(c, X, Y, T * R * 0.6, 0.5 * cl(1 + u / 0.35), P.cyan);
          else { const RR = T * R * (fin ? 1.3 : 1.0); K.floorLight(c, X, Y, RR * (0.6 + 0.6 * H.ease.out(cl(u / 0.4))), 0.6 * (1 - cl(u / 1.4)), P.blue); if (u < 1.6) for (const L of big.scar) K.scar(c, toS(L, X, Y, T), (1 - u / 1.6));
            if (u < 0.7) { K.shockRing(c, X, Y, RR * H.ease.out(u / 0.7), 1 - u / 0.7, t, fin ? 8 : 4); if (fin) K.shockRing(c, X, Y, RR * 0.65 * H.ease.out(cl(u / 0.5)), 0.8 * (1 - u / 0.7), t, 0); }
            if (u < 0.8) K.groundArcs(c, X, Y, RR * (0.5 + 0.5 * u), fin ? 10 : 6, t, 0.9 * (1 - u / 0.8), 0.3);
            if (fin && u < 1.0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 * (1 - u); c.fillStyle = P.cyan; H.floorEllipse(c, X, Y, RR * 0.9 * H.ease.out(cl(u / 0.4))); c.fill(); c.restore(); } } } },
      draw(c, f, X, Y, T) { const t = f.t, form = H.ease.out(cl(t / GATH)), fade = 1 - cl((t - FIN - (fin ? 0.6 : 0.25)) / (fin ? 0.9 : 0.75)), A = form * fade;
        // tendrils rising, bolts descending to meet them, then the impact's crackle and its violet afterglow in the air
        for (const s of strikes) { if (!s.pick) continue; const u = t - s.t0; if (u < -0.32 || u > 0.7) continue; const SX = H.sx(s.x), SY = H.sy(s.y);
          if (u < 0.02) { const g = cl((u + 0.32) / 0.3), hh = T * (0.35 + 0.75 * H.ease.out(g)); K.arc(c, SX, SY, SX + (rnd(s.i) - 0.5) * T * 0.3, SY - hh, K.seed(t, s.i, 22), 1.0 + g * 0.5, 0.55 + 0.4 * g, { forks: 1, jit: T * 0.12 }); K.glow(c, SX, SY, T * 0.4, P.cyan, 0.5 * g); }
          const gu = petGuard(SX, SY - T * 1.5, T, T * 0.4);
          if (u > -0.09 && u < 0) { const v = cl((u + 0.09) / 0.09), n = Math.max(2, Math.ceil(s.bolt.main.length * v)), pts = toS(s.bolt.main.slice(0, n), SX, SY, T); K.bolt(c, pts, 4.6, 0.95 * gu); for (const b of s.bolt.br) if (b.k < n - 1) K.bolt(c, toS(b.pts, SX, SY, T), 4.6 * b.w, 0.8 * gu); }
          else if (u >= 0 && u < 0.24) { const fl = 0.75 + 0.25 * rnd(K.seed(t, s.i, 30)), a = (1 - u / 0.24) * fl * gu, w = 5.6 * (1 - u * 1.5); const jit = K.seed(t, s.i, 25) % 3 === 0 ? makeBolt(s.z, 17 + s.i * 31 + K.seed(t, 0, 25), 4, false) : s.bolt;
            K.bolt(c, toS(jit.main, SX, SY, T), w, a); for (const b of jit.br) K.bolt(c, toS(b.pts, SX, SY, T), w * b.w, a * 0.85); K.glow(c, SX, SY - T * 0.2, T * 1.2, P.white, 0.8 * (1 - u / 0.24)); }
          if (u > 0.08 && u < 0.7) current(c, toS(s.bolt.main, SX, SY, T), 1.6, 0.55 * (1 - (u - 0.08) / 0.62) * gu); }
        // the finish: a big bolt (Celestial: colossal, through the opened eye, heavily branched, gold at its forks)
        { const u = t - FIN, w0 = fin ? 5.5 : 4.5;
          if (u > -0.35 && u < 0.02) for (const td of big.tend) { const g = cl((u + 0.35) / 0.33), tx = X + Math.cos(td.b) * T * td.r, ty = Y + Math.sin(td.b) * T * td.r * H.GY; K.arc(c, tx, ty, tx + Math.cos(td.b) * T * 0.15, ty - T * (0.4 + 0.9 * g), K.seed(t, td.b * 9, 22), 1.4, 0.8 * g, { forks: 1, jit: T * 0.14 }); }
          if (u > -0.1 && u < 0.6) { const gu = petGuard(X, Y - T * 1.6, T, T * 0.8); if (u < 0) { const v = cl((u + 0.1) / 0.1), n = Math.max(2, Math.ceil(big.bolt.main.length * v)); K.bolt(c, toS(big.bolt.main.slice(0, n), X, Y, T), w0 * 0.8, gu); for (const b of big.bolt.br) if (b.k < n - 1) K.bolt(c, toS(b.pts, X, Y, T), w0 * b.w, 0.9 * gu, fin && b.w < 0.4); }
            else { const fl = 0.8 + 0.2 * rnd(K.seed(t, 7, 30)), a = (u < 0.3 ? 1 : 1 - (u - 0.3) / 0.3) * fl * gu, B = K.seed(t, 0, 20) % 2 ? big.bolt : makeBolt(Z + 0.3, 991 + K.seed(t, 0, 20), fin ? 10 : 6, true);
              K.glow(c, X, Y - T * Z * 0.5, T * Z * 0.7, P.blue, 0.18 * a); K.bolt(c, toS(B.main, X, Y, T), w0 * (1 - u * 0.6), a); for (const b of B.br) K.bolt(c, toS(b.pts, X, Y, T), w0 * b.w, a * 0.9, fin && b.w < 0.4); K.glow(c, X, Y - T * 0.3, T * (fin ? 2.0 : 1.5), P.white, 0.75 * a); K.glow(c, X, Y, T * R * 0.6, P.cyan, 0.3 * a); } }
          if (u > 0.2 && u < 1.0) current(c, toS(big.bolt.main, X, Y, T), 2.4, 0.6 * (1 - (u - 0.2) / 0.8)); }
        // the canopy (back to front): its puffs, lit from within; violet currents moving between them; the eye
        if (A > 0.01) { const CY = Y - Z * T, open = f.open, list = puffs.map(p => { const rr = p.r * (1.25 - 0.25 * form) * (1 + open * (p.r ? 0.45 : 0)) + (p.r ? 0 : open * R * 0.9), px = X + Math.cos(p.b + (p.r ? 0 : 1.3)) * rr * T, py = Y + Math.sin(p.b + (p.r ? 0 : 1.3)) * rr * T * 0.62 - p.z * T; return { p, px, py }; }).sort((a, b) => a.py - b.py), im = puff();
          K.glow(c, X, CY + T * 0.2, T * R * 1.1, P.deep, 0.35 * A); K.glow(c, X, CY + T * 0.4, T * R * 0.7, P.violet, 0.18 * A * (1 + puffs.reduce((m, p) => Math.max(m, p.lit), 0)));
          for (const q of list) { const p = q.p, sz = T * 1.55 * p.s * (0.6 + 0.4 * form), gu = petGuard(q.px, q.py + sz * 0.2, T, sz * 0.4), a = A * gu * (p.r ? 1 : 1 - open);
            c.save(); c.globalAlpha = 0.85 * a; c.drawImage(im, q.px - sz, q.py - sz * 0.65, sz * 2, sz * 1.3); c.restore();
            const L = p.lit + 0.2 + 0.1 * Math.sin(t * 3 + p.i * 1.7); K.glow(c, q.px, q.py, sz * 0.95, P.violet, 0.6 * L * a); K.glow(c, q.px, q.py + sz * 0.25, sz * 0.6, P.blue, 0.3 * L * a); if (p.lit > 0.4) K.glow(c, q.px, q.py + sz * 0.1, sz * 0.5, P.ice, 0.5 * (p.lit - 0.3) * a); }
          const nc = fin ? 4 : 3; for (let i = 0; i < nc; i++) { const sd = K.seed(t, i, 7), p0 = list[Math.floor(rnd(sd) * list.length)], p1 = list.filter(q => q !== p0).sort((q, r) => Math.hypot(q.px - p0.px, q.py - p0.py) - Math.hypot(r.px - p0.px, r.py - p0.py))[Math.floor(rnd(sd + 5) * 2)]; if (!p1) continue; const gu = petGuard((p0.px + p1.px) / 2, (p0.py + p1.py) / 2, T, T); current(c, K.path(p0.px, p0.py, p1.px, p1.py, K.seed(t, i, 14), T * 0.25), 1.1, 0.7 * A * gu * (1 - open)); }
          if (open > 0.01) { const er = T * R * 0.55 * open; K.glow(c, X, CY, er * 1.6, P.blue, 0.6 * open * fade); K.glow(c, X, CY, er * 0.8, P.white, 0.85 * open * fade); c.save(); c.globalCompositeOperation = 'lighter'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.globalAlpha = (0.6 - i * 0.15) * open * fade; c.strokeStyle = i ? P.cyan : P.white; c.beginPath(); c.ellipse(X, CY, er * (0.7 + i * 0.25), er * (0.7 + i * 0.25) * 0.45, 0, t * (1 + i) % TAU, t * (1 + i) % TAU + 4.6); c.stroke(); } c.restore(); }
          // the strikes' bolt roots: a bright knot in the cloud above each strike as it falls
          for (const s of strikes) { const u = t - s.t0; if (s.pick && u > -0.1 && u < 0.2) K.glow(c, H.sx(s.x) + s.bolt.main[0][0] * T, H.sy(s.y) + s.bolt.main[0][1] * T, T * 0.9, P.ice, 0.7 * (1 - Math.abs(u - 0.05) / 0.15) * A); } }
        // the threads of light (Celestial's unravelling)
        if (f.threads.length) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (const th of f.threads) { const u = (t - th.t0) / 0.9; if (u < 0 || u > 1) continue; const TX = H.sx(th.x), TY = H.sy(th.y) - (th.z - th.v * (t - th.t0)) * T; c.globalAlpha = 0.7 * Math.sin(u * Math.PI); c.strokeStyle = th.L > 0.7 ? P.cyan : P.ice; c.lineWidth = 1.2; c.beginPath(); c.moveTo(TX, TY - th.L * T); c.lineTo(TX, TY); c.stroke(); } c.restore(); } } });
    strikes.forEach(s => H.X.after(s.t0, () => { H.hitArea(s.x, s.y, 1.15, per, C.dmgO({ kb: 1.5, stun: 0.3 })); K.zapAt(s.x, s.y, 1.2); K.sparks(s.x, s.y, 8, 7, { up: 3 }); H.X.shake(3 + (s.i / N) * 3, 0.1); H.X.sfx.crack(); if (s.i % 4 === 3) H.X.hitstop(0.015); }));
    H.X.after(FIN - 0.4, () => { H.warn(x, y, R * (fin ? 1.25 : 1), 0.4, C.col); H.X.sfx.hum(); });
    H.X.after(FIN, () => { H.hitArea(x, y, R * (fin ? 1.25 : 1), finD, C.dmgO({ kb: 4, stun: 0.8 })); K.zapAt(x, y, 2.5); K.sparks(x, y, fin ? 40 : 24, 10, { up: 4 }); K.motes(x, y, fin ? 24 : 12); if (fin) K.goldSparks(x, y - 0.5, 18, 9);
      H.X.ring(x, y, 0.3, R * (fin ? 1.3 : 1), 0.5, P.cyan, 0.4); H.X.flash(fin ? 0.2 : 0.15, P.ice); H.X.shake(fin ? 14 : 10, 0.3); H.X.hitstop(0.06); H.X.light(x, y, R * 2.2, 0.5); H.X.sfx.crash(); });
    return F; };
})();
