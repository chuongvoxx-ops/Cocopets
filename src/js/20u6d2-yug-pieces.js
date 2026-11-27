/* ---------- v472 YE: the Yuggoth Engine's trial pieces, painted (20u6d's YUG_PROPS) ----------
   Each piece is painted once (BELPROPS.kit, the land's light) and laid down by the stages' "v472 YE" hooks (20u5) through
   YUG_PROPS.stage.*; what moves (a blast door's leaves, a ram, a belt) is the same picture slid; what glows (a node's orb and its
   arcs, the cables' current, the docks, the coil's beams and its orb, the ring pulse, the sparks, the live floor, the rams' and
   doors' tells, the meltdown's plasma, a valve) is the GPU painter's light (FGFX, YE-FX 571 / 574 / 575 with glows) queued with
   YUG_PROPS.ql / .qo for this stage's light pass. Their rules are untouched: these are their looks. Without the painter (or the
   GPU) each hook returns false and the stage draws its old 2D art.
     the Conductor Hunt: yugnode (a dead circuit node: a hull drum, three copper-banded prongs, a glass orb), yugdock (a charging
       dock: a hazard-ringed pad, a copper coil), yugblast (a blast door's leaf: hull plating, ribs, a hazard band)
     the Spinning Coil: yugcoil (the tesla coil: a plinth, a dark column, copper windings, a glass crown)
     the Meltdown Run: yugram (a piston ram: its rod and its striped head), yugbelt (a conveyor's belt: ribbed rubber between steel
       frames), yugblast (its blast doors), valve (20u6d's, the coolant valves) */
(() => {
  const A = typeof YUG_PROPS !== 'undefined' ? YUG_PROPS : null; if (!A) return;
  const TAU = Math.PI * 2, X0 = A.kitx, DEF = A.DEF, clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u;
  const VIOLET = '#C452FF', VIOLET_HI = '#E8B8FF', TEAL = '#3FE0C8', TEAL_HI = '#B8FFF2', AMBER = '#FFB23F', MAGENTA = '#FF4FB8';
  const hazard = (K, u, sd) => { const M = K.M, s = ((u * 3.4) % 1 + 1) % 1 < 0.5; if (s) { M.mt = 0.1; M.r = 0.85; M.g = 0.52; M.b = 0.12; M.rg = 0.5; } else { M.mt = 0.1; M.r = 0.03; M.g = 0.03; M.b = 0.035; M.rg = 0.6; } if (K.vn(u * 9 + sd, sd) > 0.75) M.ao *= 0.7; };
  Object.assign(DEF, {
    /* a dead circuit node: a bolted hull drum, three tall prongs (dark steel, copper bands) round a ceramic post, a glass orb on top
       (dark: its light, when the circuit goes live, is the GPU's) */
    yugnode: { box: () => [-1.15, -2.3, 1.15, 0.55], vs: [0], paint(K, S, v, L) { const sd = 601, c = S.c; X0.contact(K, S, 1.0, 0.36, 0.62);
      K.rev(S, 0, 0, h => h < 0.06 ? 0.86 : 0.8, 0, 0.42, { mat: (u, h, ao) => { X0.hullM(K, u * 2, h * 3, sd, { paint: 0.6, burn: 0.2 }); if (Math.abs(h - 0.22) < 0.02) K.M.ao *= 0.5; }, top: true, capMat: (x, h, ao, i, phi, x2, ey) => { X0.hullM(K, x * 2, (ey || 0) * 2, sd + 1, { tone: 1.1 }); const rr = Math.hypot(x / 0.8, (ey || 0)); if (Math.abs(rr - 0.7) < 0.04) K.M.ao *= 0.5; } }); S.unlock();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, x = Math.cos(a) * 0.72, y = -0.42 + Math.sin(a) * 0.24; if (Math.sin(a) < -0.3) continue; K.ball(S, x, y + 0.02, 0.035, 0.035, (dx, dy) => X0.chromeM(K, dx, dy, sd)); } S.unlock();
      const pr = [[-0.45, -0.32, -0.08], [0.45, -0.32, 0.08], [0, -0.5, 0]]; pr.sort((a, b) => a[1] - b[1]);
      for (const [x, y, lean] of pr) { X0.prism(K, S, x, y, 0.09, 0.05, 1.05, 0.25, lean, (f, q, wt) => { X0.darkM(K, q, wt * 4, sd + x * 9); if (Math.abs(((wt * 7) % 1) - 0.5) > 0.38 && wt < 0.75) { X0.copperM(K, q * 3, wt * 30, sd, 0); } }, { flat: 0.3 }); } S.unlock();
      K.rev(S, 0, -0.42, h => 0.11 + 0.03 * Math.abs(Math.sin(h * Math.PI * 5)), 0, 0.9, { mat: (u, h) => { const M = K.M; M.r = 0.6; M.g = 0.58; M.b = 0.56; M.rg = 0.18; M.cc = 0.8; } }); S.unlock();
      K.ball(S, 0, -1.55, 0.22, 0.22, (dx, dy) => { const M = K.M; M.r = 0.03; M.g = 0.02; M.b = 0.05; M.rg = 0.05; M.cc = 1; M.er = 0.06; M.eb = 0.1; }); S.unlock();
      K.glint(c, -0.08, -1.64, 0.08, 0.8); K.ink(S, X0.INK[L], 0.45); } },
    /* a charging dock: a round steel pad set in the deck, ringed in amber and black, a copper coil in its middle, four stubby
       terminals (its charge, as a mite comes out, is the GPU's) */
    yugdock: { box: () => [-1.2, -0.75, 1.2, 0.75], vs: [0], paint(K, S, v, L) { const sd = 611, c = S.c;
      X0.disc(K, S, 0, 0, 1.05, 0.52, (dx, dy, r) => { if (r > 0.78) { const a = Math.atan2(dy, dx); hazard(K, a / TAU * 4, sd); } else X0.hullM(K, dx * 2, dy * 2, sd, { tone: 1.05, paint: 0.4 }); if (Math.abs(r - 0.78) < 0.025) K.M.ao *= 0.4; }, { bv: 0.12, dome: 0.06 }); S.unlock();
      const ring = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * TAU; ring.push([Math.cos(a) * 0.42, Math.sin(a) * 0.2 - 0.04]); } K.tube(S, ring, 0.07, 0.07, (t, s2) => X0.copperM(K, t * 20, s2, sd, Math.abs(((t * 40) % 1) - 0.5) > 0.35 ? 1 : 0)); S.unlock();
      for (const [x, y] of [[-0.75, -0.18], [0.75, -0.18], [-0.75, 0.2], [0.75, 0.2]]) { K.rev(S, x, y, h => 0.08, 0, 0.22, { mat: (u, h) => X0.darkM(K, u, h, sd), top: true, capMat: () => X0.copperM(K, 0, 0, sd, 0) }); } S.unlock();
      K.ink(S, X0.INK[L], 0.4); } },
    /* a blast door's leaf (3 x 2.2 tiles, its feet the bottom-left corner): hull plating in two courses with a heavy rib between,
       rivets, a hazard band along its foot, its inner edge bevelled bright (slid per frame, and stretched to the opening) */
    yugblast: { box: () => [-0.02, -2.25, 3.02, 0.08], vs: [0], paint(K, S, v, L) { const sd = 621;
      X0.plate(K, S, [[0, 0], [3, 0], [3, -2.2], [0, -2.2]], [0, 1, 0.08], 0.06, (x, y, ao, e) => { const yy = -y; if (yy < 0.32) { hazard(K, x * 0.9 + yy, sd); if (yy > 0.28) K.M.ao *= 0.5; return; }
          X0.hullM(K, x * 1.4, yy * 1.4, sd + Math.floor(yy / 0.95), { burn: 0.2, paint: 0.65, tone: 1.05 }); if (Math.abs(yy - 1.25) < 0.08) { X0.darkM(K, x * 3, yy * 3, sd); } if (Math.abs(((x / 1.5) % 1) - 0.5) > 0.48) K.M.ao *= 0.6; if (e > 0.5) { K.M.rg = 0.15; } }); S.unlock();
      const rv = []; for (let i = 0; i < 12; i++) { rv.push([0.15 + i * 0.245, -0.45], [0.15 + i * 0.245, -2.05]); } X0.rivets(K, S, rv, 0.035, sd);
      K.ink(S, X0.INK[L], 0.4); } },
    /* the tesla coil: a round hull plinth, a dark column, six copper windings narrowing up it (lit in their grooves), a glass crown
       of plasma (its light, the beams and the crackle round it the GPU's) */
    yugcoil: { box: () => [-1.7, -4.4, 1.7, 0.7], vs: [0], paint(K, S, v, L) { const sd = 631, c = S.c; X0.contact(K, S, 1.5, 0.55, 0.65);
      K.rev(S, 0, 0, h => h < 0.08 ? 1.35 : 1.25 - h * 0.3, 0, 0.45, { mat: (u, h, ao) => { X0.hullM(K, u * 2, h * 3, sd, { paint: 0.6 }); if (Math.abs(h - 0.25) < 0.02) K.M.ao *= 0.5; }, top: true, capMat: (x, h, ao, i, phi, x2, ey) => { const rr = Math.hypot(x / 1.1, ey || 0), a = Math.atan2(ey || 0, x); if (rr > 0.82) hazard(K, a / TAU * 6, sd); else X0.hullM(K, x * 2, (ey || 0) * 2, sd + 1, { tone: 1.05 }); } }); S.unlock();
      K.rev(S, 0, -0.45, h => 0.3, 0, 2.7, { mat: (u, h) => X0.darkM(K, u * 3, h * 2, sd) }); S.unlock();
      for (let i = 0; i < 6; i++) { const h0 = 0.25 + i * 0.4, rr = 0.72 - i * 0.045; K.rev(S, 0, -0.45, h => rr * (0.94 + 0.06 * Math.sin(clamp((h - h0) / 0.3, 0, 1) * Math.PI)), h0, h0 + 0.3, { mat: (u, h) => { const gr = Math.abs(((h * 40) % 1) - 0.5) > 0.32 ? 1 : 0; X0.copperM(K, u * 4, h * 30, sd + i, gr); if (gr) X0.glowAdd(K.M, X0.E_VIO, 0.3); } }); S.unlock(); }
      K.rev(S, 0, -3.1, h => 0.55 * Math.sin(Math.PI * 0.15 + h / 0.5 * Math.PI * 0.35) + 0.1, 0, 0.42, { mat: (u, h) => X0.darkM(K, u * 4, h * 4, sd), top: true, capMat: () => X0.darkM(K, 0, 0, sd) }); S.unlock();
      K.ball(S, 0, -3.75, 0.5, 0.5, (dx, dy) => { const r = Math.hypot(dx, dy), M = K.M; M.r = 0.04; M.g = 0.02; M.b = 0.06; M.rg = 0.05; M.cc = 1; X0.glowAdd(M, X0.E_VIO, 0.25 + 0.4 * (1 - r)); }); S.unlock();
      K.glint(c, -0.18, -3.95, 0.14, 0.8); K.ink(S, X0.INK[L], 0.45); } },
    /* a piston ram (its feet the head's front face, its body reaching back 4 tiles; ~1 tile tall): a polished rod into a heavy
       striped head */
    yugram: { box: () => [-4.0, -1.0, 0.08, 0.06], vs: [0], paint(K, S, v, L) { const sd = 641;
      K.tube(S, [[-4.0, -0.5], [-0.3, -0.5]], 0.17, 0.17, (t, s2) => { X0.chromeM(K, t * 8, s2, sd); if (s2 > 0.5) K.M.ao *= 0.8; }); S.unlock();
      X0.plate(K, S, [[-0.42, -0.04], [0, -0.04], [0, -0.96], [-0.42, -0.96]], [0.35, 0.9, 0.2], 0.05, (x, y, ao, e) => { if (x > -0.12) hazard(K, -y * 1.2 + x, sd); else X0.hullM(K, x * 3, y * 3, sd, { paint: 0.6 }); if (e > 0.5) K.M.rg = 0.15; }); S.unlock();
      K.ink(S, X0.INK[L], 0.4); } },
    /* a conveyor's belt, one tile (its feet the tile's top-left corner, seen from above): ribbed black rubber between two steel frames
       with rollers (slid along as it runs) */
    yugbelt: { box: () => [-0.02, -0.02, 1.02, 1.02], vs: [0], paint(K, S, v, L) { const sd = 651;
      X0.plate(K, S, [[0, 0], [1, 0], [1, 1], [0, 1]], [0, 0.35, 1], 0.02, (x, y, ao) => { const rib = Math.abs(((y * 5) % 1) - 0.5) > 0.36; X0.rubberM(K, x * 5, y * 5, sd); if (rib) { K.M.r += 0.04; K.M.g += 0.04; K.M.b += 0.05; K.M.rg = 0.5; } else K.M.ao *= 0.8; }); S.unlock(); } },
  });
  A.PIECES_OF.push([/Conductor/, [['yugnode', 0], ['yugdock', 0], ['yugblast', 0]]], [/Spinning Coil/, [['yugcoil', 0]]], [/Meltdown/, [['yugram', 0], ['yugbelt', 0], ['yugblast', 0], ['valve', 0]]]);

  /* ======================= the stages' hooks ======================= */
  const R = X => (A.ready && A.ready(X)) ? A : null;
  const qo = A.qo, ql = A.ql;
  // a short bolt between two screen points (lightning, YE-FX 571), its age u 0..1
  const sbolt = (q, ax, ay, bx, by, w, col, a, sd, u, wander) => { const dx = (bx - ax) / 2, dy = (by - ay) / 2, l = Math.hypot(dx, dy); if (l < 2) return; q('quad', 571, ax + dx, ay + dy, dx * 1.04, dy * 1.04, -dy / l * w, dx / l * w, col, a, sd, u || 0, wander == null ? 0.7 : wander); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const ST = {
    /* the Conductor Hunt's ground: o { nodes, strip, docks, S, dx0, dx1, dy, charged } */
    conductor(c, X, o, T, t) { const Y = R(X); if (!Y) return false; const { nodes, strip, docks, S } = o;
      // the cables from each node to its lock: a dark armoured cable; live, current running along it in pulses of light
      for (const n of nodes) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#0E1016'; c.lineWidth = T * 0.24; c.beginPath(); n.path.forEach(([x, y], i) => (i ? c.lineTo(X.sx(x), X.sy(y)) : c.moveTo(X.sx(x), X.sy(y)))); c.stroke(); c.strokeStyle = '#2A2F3E'; c.lineWidth = T * 0.14; c.stroke(); c.strokeStyle = 'rgba(150,160,190,.25)'; c.lineWidth = T * 0.03; c.stroke(); c.restore();
        if (n.k > 0.05) { let acc = 0; for (let i = 0; i + 1 < n.path.length; i++) { const [x0, y0] = n.path[i], [x1, y1] = n.path[i + 1], Lg = Math.hypot(x1 - x0, y1 - y0); ql('rbeam', X.sx(x0), X.sy(y0), X.sx(x1), X.sy(y1), T * 0.32, VIOLET, 0.18 * n.k, 1, 1);
            for (let d = 0; d < Lg; d += 0.7) { const u = d / Lg, pulse = Math.pow(Math.max(0, Math.cos((acc + d) * 1.4 - t * 7)), 6); if (pulse > 0.05) ql('glow', X.sx(x0 + (x1 - x0) * u), X.sy(y0 + (y1 - y0) * u), T * 0.35, VIOLET_HI, 0.55 * pulse * n.k); } acc += Lg; } } }
      // the live strip: dark plates; as it warns its seams kindle amber; live, threads of current crawl over it
      const kk = S.stripSt === 'live' ? 1.9 : S.stripSt === 'warn' ? 0.55 + 0.4 * Math.abs(Math.sin(t * 9)) : 0.18;
      for (const tl of strip) { const Xs = X.sx(tl.tx) + T / 2, Ys = X.sy(tl.ty) + T / 2; c.save(); c.fillStyle = 'rgba(8,8,14,.4)'; c.fillRect(Xs - T / 2 + 2, Ys - T / 2 + 2, T - 4, T - 4); c.restore(); ql('quad', 575, Xs, Ys, T * 0.52, 0, 0, T * 0.52, S.stripSt === 'live' ? VIOLET : AMBER, 0.95, tl.tx * 3 + tl.ty, kk); if (S.stripSt === 'live' && (tl.tx + tl.ty) % 2 === 0) sbolt(qo, Xs - T * 0.4, Ys, Xs + T * 0.4, Ys - T * 0.1, T * 0.4, VIOLET, 0.8, tl.tx * 7 + tl.ty, 0, 0.8); }
      // the docks the charged mites come from: painted pads, their coils glowing amber, a slow ring of charge
      for (const d of docks) { const Xs = X.sx(d.x), Ys = X.sy(d.y); A.piece(c, 'yugdock', 0, Xs, Ys, T); const u = (t * 0.6) % 1; ql('glow', Xs, Ys - T * 0.04, T * 0.9, AMBER, 0.22 + 0.08 * Math.sin(t * 3), 0.5); ql('ring', Xs, Ys - T * 0.04, T * (0.4 + u * 0.7), AMBER, 0.3 * (1 - u), T * 0.08, 0.5); label(c, 'CHARGING DOCK', Xs, Ys + T * 0.95, T * 0.22, AMBER); }
      // a charged mite's halo (glow only) and its mark
      for (const m of o.charged) { if (m.dead) continue; const Xs = X.sx(m.x), Ys = X.sy(m.y); ql('ring', Xs, Ys + T * 0.1, T * 0.7, AMBER, 0.45 + 0.2 * Math.sin(t * 8), T * 0.12, 0.45); ql('glow', Xs, Ys + T * 0.1, T * 0.9, AMBER, 0.2, 0.45); qo('glow', Xs, Ys - T * 0.3, T * 0.8, AMBER, 0.22); label(c, '⚡', Xs, Ys - T * 1.1, T * 0.4, AMBER); }
      // the blast door: two painted leaves sliding apart, a lock light per circuit
      { const Xa = X.sx(o.dx0), Xb = X.sx(o.dx1), Y1 = X.sy(o.dy) + T, w = (Xb - Xa) / 2, sh = S.openK * w * 0.95, sx = w / (3 * T), sy = (T * 2.2) / (2.2 * T);
        c.save(); c.beginPath(); c.rect(Xa, Y1 - T * 2.3, Xb - Xa, T * 2.4); c.clip(); A.piece(c, 'yugblast', 0, Xa - sh, Y1, T, { sx, sy }); A.piece(c, 'yugblast', 0, Xb + sh, Y1, T, { sx, sy, flip: true }); c.restore();
        if (S.openK < 0.95) for (const n of nodes) { const Lx = X.sx(n.lock.x), Ly = X.sy(o.dy) - T * 0.2, f = 1 - S.openK; c.save(); c.fillStyle = 'rgba(10,10,16,.85)'; c.beginPath(); c.arc(Lx, Ly, T * 0.18, 0, TAU); c.fill(); c.restore(); if (n.on) { qo('glow', Lx, Ly, T * 0.7, VIOLET, 0.6 * f); qo('glow', Lx, Ly, T * 0.2, '#FFFFFF', 0.7 * f); } else qo('glow', Lx, Ly, T * 0.3, AMBER, 0.18 * f); }
        if (S.openK > 0.02 && S.openK < 1) qo('rbeam', (Xa + Xb) / 2, Y1 - T * 2.1, (Xa + Xb) / 2, Y1, T * 0.4 * S.openK * 3, '#E8D8FF', 0.2 * (1 - S.openK), 1, 1); }
      return true; },
    /* a dead node (drawn as an object among the monsters): the painted node; live, its orb lit and arcs from the prongs to it; dead,
       an amber glow kindling round its foot (its tell: no dashed ring) */
    node(c, X, n, Xs, Ys, T) { const Y = R(X); if (!Y || !A.piece(c, 'yugnode', 0, Xs, Ys, T)) return false; const t = X.g.t, k = n.k;
      if (k > 0.05) { const oy = Ys - T * 1.55; qo('glow', Xs, oy, T * 1.5, VIOLET, 0.55 * k); qo('glow', Xs, oy, T * 0.35, '#FFFFFF', 0.8 * k); for (const [px, py] of [[-0.45, -1.45], [0.45, -1.45], [0, -1.6]]) { const x0 = Xs + px * T, y0 = Ys + py * T; if (Math.abs(px) < 0.01) continue; sbolt(qo, x0, y0, Xs, oy, T * 0.25, VIOLET, 0.9 * k, n.i * 13 + px * 9, 0, 0.6); } ql('glow', Xs, Ys, T * 1.6, VIOLET, 0.25 * k, 0.45); }
      else { const p = 0.5 + 0.4 * Math.sin(t * 4); ql('ring', Xs, Ys, T * 1.0, AMBER, 0.25 * p, T * 0.2, 0.45); ql('glow', Xs, Ys, T * 1.1, AMBER, 0.12 * p, 0.45); }
      return true; },
    /* the Spinning Coil's ground: o { S, O, R, r0, NEED } */
    coil(c, X, o, T, t) { const Y = R(X); if (!Y) return false; const { S, O } = o, Xo = X.sx(O.x), Yo = X.sy(O.y), RR = o.R, r0 = o.r0;
      for (const rr of [3, 6, RR]) ql('ring', Xo, Yo, rr * T, VIOLET_HI, 0.07, T * 0.12, 0.95);
      if (!S.won) {
        for (let i = 0; i < S.n; i++) { const b = S.rot + i * TAU / S.n, ax = Xo + Math.cos(b) * r0 * T, ay = Yo + Math.sin(b) * r0 * T * 0.95, bx = Xo + Math.cos(b) * RR * T, by = Yo + Math.sin(b) * RR * T * 0.95;
          if (S.warnT > 0) { const p = 0.5 + 0.4 * Math.sin(t * 20); ql('rbeam', ax, ay, bx, by, T * 0.5, AMBER, 0.22 * p, 1, 0.4); ql('beam', ax, ay, bx, by, T * 0.06, '#FFE2A0', 0.3 * p); }
          else { ql('rbeam', ax, ay, bx, by, T * 0.9, VIOLET, 0.22, 1, 0.6); sbolt(qo, ax, ay, bx, by, T * 0.55, VIOLET, 1, i * 7 + 1, 0, 0.5); sbolt(qo, ax, ay, bx, by, T * 0.35, '#B88AFF', 0.7, i * 7 + 4, 0.3, 0.9); qo('glow', bx, by, T * 0.9, VIOLET_HI, 0.55); qo('glow', bx, by, T * 0.25, '#FFFFFF', 0.6); } }
        if (S.ring && S.ring.pre <= 0) { const rr = S.ring.r; qo('ring', Xo, Yo, rr * T, VIOLET, 0.5, T * 0.55, 0.95); qo('ring', Xo, Yo, rr * T, '#FFFFFF', 0.6, T * 0.12, 0.95); }
        for (const s of S.sparks) { const Xs = X.sx(s.x), Ys = X.sy(s.y) - T * 0.4, fade = Math.min(1, (s.life - s.t) / 1.5), k = Math.min(1, s.t / 0.3); qo('glow', Xs, Ys, T * 1.1 * k, VIOLET_HI, 0.55 * fade); qo('star', Xs, Ys, T * 0.55 * k, 0.9 * fade, '#FFFFFF'); qo('glow', Xs, Ys, T * 0.22, '#FFFFFF', 0.8 * fade); ql('glow', Xs, Ys + T * 0.4, T * 0.6, VIOLET, 0.2 * fade, 0.45); } }
      if (S.ring && S.ring.pre > 0) label(c, 'RING PULSE', Xo, Yo - T * 4.6, T * 0.3, AMBER);
      c.save(); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 6; c.beginPath(); c.ellipse(Xo, Yo, T * 1.9, T * 0.8, 0, 0, TAU); c.stroke(); c.strokeStyle = VIOLET_HI; c.beginPath(); c.ellipse(Xo, Yo, T * 1.9, T * 0.8, 0, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, S.got / o.NEED)); c.stroke(); c.restore();
      return true; },
    /* the coil itself (an object): the painted tower; its crown lit, arcs crackling round it (a pulse: brighter) */
    coilTower(c, X, o, Xs, Ys, T) { const Y = R(X); if (!Y || !A.piece(c, 'yugcoil', 0, Xs, Ys, T)) return false; const S = o.S, t = X.g.t, hot = S.won ? 0.15 : 1, pulse = S.ring && S.ring.pre > 0 ? 1 : 0, oy = Ys - T * 3.75;
      qo('glow', Xs, oy, T * (1.8 + pulse * 1.2), VIOLET, (0.5 + 0.25 * Math.sin(t * 6)) * hot); qo('glow', Xs, oy, T * 0.5, '#FFFFFF', (0.6 + pulse * 0.4) * hot);
      if (hot > 0.5) for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; sbolt(qo, Xs + Math.cos(a) * T * 0.35, oy + Math.sin(a) * T * 0.35, Xs + Math.cos(a) * T * 1.4, oy + Math.sin(a) * T * 0.95, T * 0.3, VIOLET, 0.85, i * 5 + 2, 0, 0.8); }
      ql('glow', Xs, Ys, T * 2.4, VIOLET, 0.18 * hot, 0.45); return true; },
    /* the Meltdown Run's ground: o { S, x0, x1, convs, zaps, pistons, doors } */
    melt(c, X, o, T, t) { const Y = R(X); if (!Y) return false; const { S } = o, Xa = X.sx(o.x0), Xb = X.sx(o.x1), W = X.W(), H2 = X.H ? X.H() : 2000;
      // conveyor belts: the painted belt running back toward the meltdown, amber chevrons of light along it
      for (const cv of o.convs) { const Yr = X.sy(cv.ty); if (Yr < -T * 2 || Yr > H2 + T) continue; const off = ((t * 2.0) % 1) * T; c.save(); c.beginPath(); c.rect(Xa, Yr, Xb - Xa, T); c.clip(); for (let x = Xa; x < Xb; x += T) { A.piece(c, 'yugbelt', 0, x, Yr + off - T, T); A.piece(c, 'yugbelt', 0, x, Yr + off, T); } c.restore();
        for (let x = Xa + T * 0.6; x < Xb; x += T * 1.2) { const u = ((t * 2.0 + x / T * 0.1) % 0.8) / 0.8; qo('glow', x, Yr + T * (0.2 + u * 0.6), T * 0.28, AMBER, 0.3 * Math.sin(u * Math.PI)); } ql('rbeam', Xa, Yr + T * 0.5, Xb, Yr + T * 0.5, T * 0.7, AMBER, 0.05, 1, 1); }
      // live floor: plates kindling amber, then crackling violet
      const zk = S.zst === 'live' ? 1.9 : S.zst === 'warn' ? 0.55 + 0.4 * Math.abs(Math.sin(t * 9)) : 0.15;
      for (const z of o.zaps) { const Xs = X.sx(z.tx) + T / 2, Ys = X.sy(z.ty) + T / 2; if (Ys < -T || Ys > H2 + T) continue; c.save(); c.fillStyle = 'rgba(8,8,14,.4)'; c.fillRect(Xs - T / 2 + 2, Ys - T / 2 + 2, T - 4, T - 4); c.restore(); ql('quad', 575, Xs, Ys, T * 0.52, 0, 0, T * 0.52, S.zst === 'live' ? VIOLET : AMBER, 0.95, z.tx * 3 + z.ty, zk); if (S.zst === 'live' && (z.tx + z.ty) % 2 === 0) sbolt(qo, Xs - T * 0.35, Ys - T * 0.3, Xs + T * 0.35, Ys + T * 0.3, T * 0.35, VIOLET, 0.8, z.tx * 5 + z.ty, 0, 0.8); }
      // pistons: a glow kindling at both wall emitters as they warn (no red band), then the painted rams slam in from the walls
      for (const Pn of o.pistons) { const Yr = X.sy(Pn.ty); if (Yr < -T * 2 || Yr > H2 + T) continue; const reach = (Xb - Xa) / 2 * Pn.k;
        if (Pn.st === 'warn') { const p = 0.5 + 0.5 * Math.sin(t * 24); for (const ex of [Xa, Xb]) { qo('glow', ex, Yr + T * 0.5, T * (0.8 + 0.3 * p), AMBER, 0.45 + 0.3 * p); qo('glow', ex, Yr + T * 0.5, T * 0.22, '#FFF2D0', 0.7); } ql('rbeam', Xa, Yr + T * 0.5, Xb, Yr + T * 0.5, T * 0.9, AMBER, 0.08 + 0.06 * p, 1, 1); }
        c.save(); c.beginPath(); c.rect(Xa, Yr - T * 0.2, Xb - Xa, T * 1.3); c.clip(); A.piece(c, 'yugram', 0, Xa + reach, Yr + T * 0.98, T); A.piece(c, 'yugram', 0, Xb - reach, Yr + T * 0.98, T, { flip: true }); c.restore();
        if (Pn.st === 'slam') qo('glow', (Xa + Xb) / 2, Yr + T * 0.5, T * 1.2, '#FFE2A0', 0.3); }
      // blast doors: painted leaves sliding shut; amber lights at the jambs before they close
      for (const D of o.doors) { const Yr = X.sy(D.ty); if (Yr < -T * 2 || Yr > H2 + T) continue; const w = (Xb - Xa) / 2, k = D.st === 'shut' ? 1 : D.st === 'warn' ? 0.15 : 0, sx = w / (3 * T), sy = (T * 1.5) / (2.2 * T);
        c.save(); c.beginPath(); c.rect(Xa, Yr - T * 0.6, Xb - Xa, T * 1.7); c.clip(); A.piece(c, 'yugblast', 0, Xa - w * (1 - k) * 0.95, Yr + T, T, { sx, sy }); A.piece(c, 'yugblast', 0, Xb + w * (1 - k) * 0.95, Yr + T, T, { sx, sy, flip: true }); c.restore();
        if (D.st === 'warn') for (const ex of [Xa + 6, Xb - 6]) { const p = 0.6 + 0.4 * Math.sin(t * 30); qo('glow', ex, Yr - T * 0.2, T * 0.8, AMBER, 0.55 * p); qo('glow', ex, Yr - T * 0.2, T * 0.2, '#FFF2D0', 0.8); } }
      // the meltdown: a wall of plasma rising from the bottom (a dark body under it, its roiling front and crest the GPU's)
      if (!S.won || S.py < X.me.y + 20) { const Yp = X.sy(S.py); if (Yp < H2 + 40) { c.save(); const gr = c.createLinearGradient(0, Yp - T * 0.2, 0, Yp + T * 5); gr.addColorStop(0, 'rgba(120,20,110,.6)'); gr.addColorStop(0.25, 'rgba(70,12,90,.92)'); gr.addColorStop(1, 'rgba(24,4,36,1)'); c.fillStyle = gr; c.fillRect(0, Yp - T * 0.2, W + 20, H2 + 60 - Yp); c.restore();
          qo('quad', 574, W / 2, Yp + T * 2.0, W * 0.62, 0, 0, T * 2.6, MAGENTA, 0.95, 3.1, 1, 0); qo('glow', W / 2, Yp, W * 0.6, MAGENTA, 0.25, 0.25); } }
      // close behind you: the screen's lower edge glows magenta (as before), RUN!
      const gap = S.py - X.me.y; if (!S.won && gap < 4) { c.save(); c.globalAlpha = (1 - gap / 4) * (0.35 + 0.15 * Math.sin(t * 12)); const gg = c.createLinearGradient(0, 0, 0, H2); gg.addColorStop(0, 'rgba(255,79,184,0)'); gg.addColorStop(1, 'rgba(255,79,184,1)'); c.fillStyle = gg; c.fillRect(0, 0, W, H2); c.restore(); label(c, 'RUN!', X.sx(X.me.x), X.sy(X.me.y) - T * 1.9, T * 0.45, '#FFFFFF'); }
      return true; },
    /* a coolant valve (an object): the painted valve; teal light while it can be vented */
    valve(c, X, V, Xs, Ys, T) { const Y = R(X); if (!Y || !A.piece(c, 'valve', 0, Xs, Ys, T)) return false; if (!V.used) { const p = 0.75 + 0.25 * Math.sin(X.g.t * 3 + V.i); qo('glow', Xs, Ys - T * 1.12, T * 0.9, TEAL, 0.4 * p); ql('glow', Xs, Ys, T * 1.2, TEAL, 0.18 * p, 0.45); } return true; },
  };
  A.stage = ST;
})();
