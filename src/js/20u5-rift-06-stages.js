/* ---------- Rift 06, the Yuggoth Engine: its three challenge dungeons ----------
   YUG_STAGES.CONDUCTOR  The Conductor Hunt: dead circuit nodes hold the blast door shut. Charged spark mites carry
                         current: make one DASH INTO a dead node (stand so the node lies between you and it), or kill
                         it right beside one, and its charge leaps in. Power all three.
   YUG_STAGES.COIL       The Spinning Coil (action): beams of lightning sweep round a giant coil; gather 24 sparks
                         while they turn, faster and more of them, with ring pulses to roll through.
   YUG_STAGES.MELTDOWN   The Meltdown Run (action): a wall of plasma rises behind you up a long corridor of conveyor
                         belts, slamming pistons, cycling blast doors and live floor. Vent the coolant valves to stall
                         it (they are your checkpoints). Reach the top.
   (the palette YUG and the brood live in 20u6; these make() functions only run once a stage starts) */
const YUG_STAGES = {};
(() => {
  const TAU = Math.PI * 2, P = () => YUG;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const alive = list => list.filter(m => !m.dead).length;
  function spawnAt(X, type, p, list, aggro) { const q = X.freeSpot(p.x, p.y, 0.45) || p; const m = X.spawnMon(type, q.x, q.y, { pack: 900, rift: true, aggro: !!aggro }); X.g.total++; if (list) list.push(m); return m; }
  const tilesOf = (M, ch) => (M.marks[ch] || []).map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y }));
  // a jagged bolt drawn between two screen points
  function zig(c, ax, ay, bx, by, n, amp, t, seed) { c.beginPath(); c.moveTo(ax, ay); const nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny) || 1; for (let i = 1; i <= n; i++) { const u = i / n, j = i < n ? Math.sin(t * 37 + i * 2.7 + seed) * amp + Math.sin(t * 23 + i * 5.1 + seed * 2) * amp * 0.5 : 0; c.lineTo(ax + (bx - ax) * u + nx / L * j, ay + (by - ay) * u + ny / L * j); } }
  function bolt(c, ax, ay, bx, by, T, t, seed, k) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; const n = Math.max(4, Math.round(Math.hypot(bx - ax, by - ay) / (T * 0.6)));
    for (const [w, col, a] of [[T * 0.42, '#8A2BD8', 0.3], [T * 0.16, '#E8B8FF', 0.8], [T * 0.05, '#FFFFFF', 1]]) { c.globalAlpha = a * (k == null ? 1 : k); c.strokeStyle = col; c.lineWidth = w; zig(c, ax, ay, bx, by, n, T * 0.22, t, seed); c.stroke(); } c.restore(); }

  /* ======================= THE CONDUCTOR HUNT ======================= */
  function makeConductor(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { VIOLET, VIOLET_HI, AMBER, TEAL, INK } = P();
    const E = mk.E[0], door = tilesOf(M, 'd'); door.forEach(t => X.setTile(t.tx, t.ty, T_SOLID));
    const dx0 = Math.min(...door.map(t => t.tx)), dx1 = Math.max(...door.map(t => t.tx)) + 1, dy = door[0].ty;
    const nodes = ['A', 'B', 'C'].map((ch, i) => ({ i, x: mk[ch][0].x, y: mk[ch][0].y, on: false, k: 0, lock: { x: dx0 + (dx1 - dx0) * (i + 1) / 4, y: dy + 1.0 } }));
    nodes.forEach(n => { n.path = [[n.x, n.y], [n.x, dy + 1.6], [n.lock.x, dy + 1.6], [n.lock.x, n.lock.y]]; });
    const strip = tilesOf(M, 'z'), docks = mk.K || [];
    const S = { intro: true, charged: [], guards: [], dockT: 1.5, stripSt: 'off', stripHit: 0, lost: 0, open: false, openK: 0, taught: false };
    (mk.g || []).forEach(p => spawnAt(X, 'coilsentry', p, S.guards, false)); (mk.h || []).forEach(p => spawnAt(X, 'hullwing', p, S.guards, false));
    g.total = X.mons.length;
    function charged(dock) { const m = spawnAt(X, 'sparkmite', dock, S.charged, true); m.charged = true; m.hp = m.maxhp = Math.round(m.maxhp * 1.3); m.optional = true; m.bname = 'Charged spark mite'; X.ring(m.x, m.y, 0.2, 1.6, 0.4, AMBER, 0.4); X.sparks && X.sparks(m.x, m.y, AMBER, 10, 4); }
    function power(n, how) { if (n.on) return; n.on = true; X.flash(0.25, '#FFFFFF'); X.boom(n.x, n.y - 0.6, 1.6, VIOLET_HI, '#FFFFFF', { n: 24, shake: 6 }); X.sfx.fanfare(); const k = nodes.filter(q => q.on).length;
      X.banner(`CIRCUIT ${k} OF 3`, how === 'dash' ? 'It dashed straight into the node: the current leaps in' : 'Its charge leaps into the node beside it', VIOLET_HI, 2, true); }
    X.after(1.2, () => { S.intro = false; X.banner('THE CONDUCTOR HUNT', 'Charged spark mites carry current: make one dash INTO a dead node, or kill it right beside one', AMBER, 3.4, true, true); });
    return { S, nodes,
      cam() { return { x: me.x, y: me.y, k: 0, zoom: 0.76 }; },
      update(dt) { if (S.intro) return;
        // charged mites come out of the docks (never more than three at once)
        S.dockT -= dt; if (S.dockT <= 0 && !S.open) { S.dockT = 5.5; if (alive(S.charged) < 3 && docks.length) charged(docks[Math.floor(Math.random() * docks.length)]); }
        for (const m of S.charged) { if (m._done) continue;
          if (!m.dead && m.dashT > 0) for (const n of nodes) if (!n.on && Math.hypot(m.x - n.x, m.y - n.y) < 1.05) { m._done = true; m._caught = true; power(n, 'dash'); X.killMon(m); break; }
          if (m.dead && !m._done) { m._done = true; const n = nodes.filter(q => !q.on).sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0]; if (n && Math.hypot(n.x - m.x, n.y - m.y) < 2.1) power(n, 'kill'); else { S.lost++; X.text(m.x, m.y - 1.2, 'Its charge is lost: too far from a node', '#FF9BD2', 12); if (S.lost === 2 && !S.taught) { S.taught = true; X.banner('LURE IT TO A NODE', 'Stand so the dead node is between you and a charged mite: it dashes at you, straight through the node', AMBER, 3.2, true); } } } }
        S.charged = S.charged.filter(m => !m._done || !m.dead);
        // the live strip in front of the far node
        const u = (g.t % 3.2) / 3.2; S.stripSt = u < 0.5 ? 'off' : u < 0.68 ? 'warn' : 'live';
        if (S.stripHit > 0) S.stripHit -= dt; if (S.stripSt === 'live' && !me.dodge && S.stripHit <= 0 && strip.some(t => Math.floor(me.x) === t.tx && Math.floor(me.y) === t.ty)) { S.stripHit = 0.7; X.hurtPet(X.ST().hp * 0.1, null); X.text(me.x, me.y - 1.3, 'ZAP!', VIOLET_HI, 14); }
        for (const n of nodes) n.k += ((n.on ? 1 : 0) - n.k) * Math.min(1, dt * 3);
        if (!S.open && nodes.every(n => n.on)) { S.open = true; door.forEach(t => X.setTile(t.tx, t.ty, T_FLOOR)); X.retile(); self.done = true; H.setExit(E.x, E.y, 'To the breach'); for (const m of S.charged) if (!m.dead) X.killMon(m); X.banner('THE BLAST DOOR OPENS', 'Three circuits live: the way to the breach', VIOLET_HI, 2.6, true, true); X.shake(6, 0.5); }
        if (S.open) S.openK = Math.min(1, S.openK + dt * 0.8); },
      goal() { if (self.done) return 'To the breach'; if (S.intro) return 'The Conductor Hunt'; const k = nodes.filter(n => n.on).length; return `Circuits ${k}/3 · charged mites: ${alive(S.charged)} · lure one through a dead node`; },
      hint() { if (self.done) return null; return null; },
      drawGround(c) { const T = X.Tz(), t = g.t;
        // the cables from each node to its lock on the door: dark when dead, current running along them when live
        for (const n of nodes) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#14161E'; c.lineWidth = T * 0.22; c.beginPath(); n.path.forEach(([x, y], i) => (i ? c.lineTo(X.sx(x), X.sy(y)) : c.moveTo(X.sx(x), X.sy(y)))); c.stroke(); c.strokeStyle = '#3A3F50'; c.lineWidth = T * 0.12; c.stroke();
          if (n.k > 0.05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = n.k; c.strokeStyle = VIOLET_HI; c.lineWidth = T * 0.1; c.setLineDash([T * 0.3, T * 0.5]); c.lineDashOffset = -t * T * 4; c.stroke(); } c.restore(); }
        // the live strip: dark plates; warning amber; live crackling violet
        for (const tl of strip) { const Xs = X.sx(tl.tx), Ys = X.sy(tl.ty); c.save(); c.fillStyle = S.stripSt === 'live' ? 'rgba(196,82,255,.45)' : S.stripSt === 'warn' ? `rgba(255,178,63,${0.25 + 0.2 * Math.sin(t * 30)})` : 'rgba(20,22,30,.45)'; c.fillRect(Xs + 1, Ys + 1, T - 2, T - 2); c.strokeStyle = S.stripSt === 'off' ? 'rgba(255,178,63,.5)' : '#FFFFFF'; c.lineWidth = 1.5; c.strokeRect(Xs + 2, Ys + 2, T - 4, T - 4); c.restore(); if (S.stripSt === 'live' && (tl.tx + tl.ty) % 2 === 0) bolt(c, Xs + T * 0.1, Ys + T * 0.5, Xs + T * 0.9, Ys + T * 0.5, T * 0.6, t, tl.ty, 0.9); }
        // the docks the charged mites come from
        for (const d of docks) { const Xs = X.sx(d.x), Ys = X.sy(d.y); c.save(); c.fillStyle = '#1E2230'; c.strokeStyle = AMBER; c.lineWidth = 2; c.beginPath(); c.ellipse(Xs, Ys, T * 1.0, T * 0.5, 0, 0, TAU); c.fill(); c.stroke(); c.setLineDash([5, 5]); c.lineDashOffset = -t * 20; c.beginPath(); c.ellipse(Xs, Ys, T * 0.7, T * 0.34, 0, 0, TAU); c.stroke(); c.restore(); label(c, 'CHARGING DOCK', Xs, Ys + T * 0.95, T * 0.22, AMBER); }
        // a halo on each charged mite, and the line it will dash along through a node
        for (const m of S.charged) { if (m.dead) continue; const Xs = X.sx(m.x), Ys = X.sy(m.y); c.save(); c.strokeStyle = AMBER; c.lineWidth = 2.5; c.globalAlpha = 0.7 + 0.3 * Math.sin(t * 8); c.beginPath(); c.ellipse(Xs, Ys + T * 0.1, T * 0.7, T * 0.32, 0, 0, TAU); c.stroke(); c.restore(); glowAt(c, Xs, Ys - T * 0.3, T * 0.9, AMBER, 0.3); label(c, '⚡', Xs, Ys - T * 1.1, T * 0.4, AMBER); }
        // the blast door: two steel leaves with three lock lights (one per circuit), sliding apart when it opens
        { const X0 = X.sx(dx0), X1 = X.sx(dx1), Y0 = X.sy(dy) - T * 1.2, Y1 = X.sy(dy) + T, w = (X1 - X0) / 2, sh = S.openK * w * 0.95; c.save(); c.beginPath(); c.rect(X0, Y0 - 4, X1 - X0, Y1 - Y0 + 8); c.clip();
          for (const sd of [-1, 1]) { const lx = sd < 0 ? X0 - sh : X0 + w + sh; c.fillStyle = '#3A3F50'; c.fillRect(lx, Y0, w, Y1 - Y0); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(lx, Y0, w, Y1 - Y0); c.save(); c.beginPath(); c.rect(lx, Y1 - T * 0.35, w, T * 0.3); c.clip(); for (let i = -2; i < 12; i++) { c.fillStyle = i % 2 ? '#1A1A1A' : AMBER; c.beginPath(); c.moveTo(lx + i * T * 0.3, Y1 - T * 0.35); c.lineTo(lx + i * T * 0.3 + T * 0.15, Y1 - T * 0.35); c.lineTo(lx + i * T * 0.3 - T * 0.15, Y1 - T * 0.05); c.lineTo(lx + i * T * 0.3 - T * 0.3, Y1 - T * 0.05); c.closePath(); c.fill(); } c.restore(); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(lx + 3, Y0 + 3, w - 6, T * 0.15); }
          c.restore(); if (S.openK < 0.9) for (const n of nodes) { const Lx = X.sx(n.lock.x), Ly = X.sy(dy) - T * 0.2; c.save(); c.fillStyle = n.on ? VIOLET_HI : '#1A1A22'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(Lx, Ly, T * 0.2, 0, TAU); c.fill(); c.stroke(); c.restore(); if (n.on) glowAt(c, Lx, Ly, T * 0.6, VIOLET, 0.8); } } },
    };
  }
  // the dead nodes (drawn as objects so they stand among the monsters)
  const conductorNodeObjs = (X, H, mod) => mod.nodes.forEach(n => { n.obj = H.obj({ x: n.x, y: n.y, kind: 'node', r: 0.9, h: 2.4, label: () => (n.on ? 'Circuit live' : 'Dead node: a charged mite must dash into it'), draw(c, Xs, Ys, T) { const { VIOLET, VIOLET_HI, INK } = P(), t = X.g.t, k = n.k;
    c.save(); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.1, T * 0.9, T * 0.34, 0, 0, TAU); c.fill();
    c.fillStyle = '#2A2F3E'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(Xs, Ys, T * 0.8, T * 0.32, 0, 0, TAU); c.fill(); c.stroke(); c.fillRect(Xs - T * 0.8, Ys - T * 0.35, T * 1.6, T * 0.35); c.strokeRect(Xs - T * 0.8, Ys - T * 0.35, T * 1.6, T * 0.35); c.fillStyle = '#4A5268'; c.beginPath(); c.ellipse(Xs, Ys - T * 0.35, T * 0.8, T * 0.32, 0, 0, TAU); c.fill(); c.stroke();
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5, px = Xs + Math.cos(a) * T * 0.45, py = Ys - T * 0.35 + Math.sin(a) * T * 0.18; c.fillStyle = '#1E2230'; c.beginPath(); c.moveTo(px - T * 0.08, py); c.lineTo(px, py - T * 1.0); c.lineTo(px + T * 0.08, py); c.closePath(); c.fill(); c.stroke(); if (k > 0.1) bolt(c, px, py - T * 1.0, Xs, Ys - T * 1.5, T * 0.5, t, i * 3, k); }
    if (k > 0.05) { glowAt(c, Xs, Ys - T * 1.4, T * 1.6, VIOLET, 0.8 * k); c.fillStyle = VIOLET_HI; c.globalAlpha = k; c.beginPath(); c.arc(Xs, Ys - T * 1.5, T * 0.26, 0, TAU); c.fill(); }
    else { c.globalAlpha = 0.5 + 0.4 * Math.sin(t * 4); c.strokeStyle = '#FFB23F'; c.lineWidth = 2.5; c.setLineDash([6, 5]); c.beginPath(); c.ellipse(Xs, Ys, T * 1.05, T * 0.45, 0, 0, TAU); c.stroke(); }
    c.restore(); } }); });
  YUG_STAGES.CONDUCTOR = { name: 'The Conductor Hunt', goal: 'Power the three circuits', how: 'Three dead circuit nodes hold the blast door shut. Charged spark mites (gold halo, ⚡) come out of the charging docks. Each carries current: when one DASHES INTO a dead node, or dies right beside one, its charge leaps in and the circuit goes live. A spark mite dashes straight at you along a shown line, so stand with the dead node between you and it. Kill a charged mite far from a node and its charge is lost (another comes from a dock). The far node sits behind a strip of live floor: it warns amber, then crackles. Coil sentries link beams of current between monsters: don\'t cross them.',
    layout: [
      '########################',
      '#########..E...#########',
      '#########......#########',
      '#########dddddd#########',
      '#......................#',
      '#.A...............z.B..#',
      '#.................z....#',
      '#....####.........z....#',
      '#....####.....h...z....#',
      '#.................z....#',
      '#......................#',
      '#..........C...........#',
      '#..K..................K#',
      '#.....g..........g.....#',
      '#......................#',
      '#..........S...........#',
      '########################'],
    legend: { E: {}, d: {}, A: {}, B: {}, C: {}, z: {}, K: {}, g: {}, h: {} },
    make(X, self, H) { const mod = makeConductor(X, self, H); conductorNodeObjs(X, H, mod); return mod; } };

  /* ======================= THE SPINNING COIL (action) ======================= */
  function makeCoil(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { VIOLET, VIOLET_HI, AMBER, TEAL, TEAL_HI, INK } = P();
    const O = mk.O[0], E = mk.E[0], R = 9.4, r0 = 1.3, NEED = 24;
    const S = { intro: true, got: 0, rot: 0, dir: 1, n: 2, spd: 0.55, warnT: 0, stage: -1, sparks: [], hitT: 0, ring: null, ringT: 7, mobs: [], mobT: 9, revT: 8, revWarn: 0, won: false, streak: 0, lastGot: -9 };
    const PH = [{ n: 2, spd: 0.55, ring: 0 }, { n: 3, spd: 0.75, ring: 7 }, { n: 4, spd: 0.95, ring: 5.5 }];
    const coilObj = H.obj({ x: O.x, y: O.y + 0.4, kind: 'coil', r: 0.1, h: 3.4, label: '', draw(c, Xs, Ys, T) { drawCoil(c, Xs, Ys, T); } });
    function drawCoil(c, Xs, Ys, T) { const t = g.t, hot = S.won ? 0 : 1, pulse = S.ring && S.ring.pre > 0 ? 1 : 0;
      c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(Xs, Ys, T * 1.5, T * 0.55, 0, 0, TAU); c.fill();
      c.fillStyle = '#2A2F3E'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(Xs, Ys - T * 0.2, T * 1.3, T * 0.5, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#1E2230'; c.fillRect(Xs - T * 0.3, Ys - T * 3, T * 0.6, T * 2.8); c.strokeRect(Xs - T * 0.3, Ys - T * 3, T * 0.6, T * 2.8);
      for (let i = 0; i < 6; i++) { const y = Ys - T * (0.6 + i * 0.4); c.fillStyle = i % 2 ? '#B87333' : '#D08A48'; c.beginPath(); c.ellipse(Xs, y, T * (0.7 - i * 0.04), T * 0.18, 0, 0, TAU); c.fill(); c.stroke(); }
      const oy = Ys - T * 3.4; glowAt(c, Xs, oy, T * (2 + pulse * 1.2), VIOLET, (0.6 + 0.3 * Math.sin(t * 6)) * (hot ? 1 : 0.2)); c.fillStyle = hot ? (pulse ? '#FFFFFF' : VIOLET_HI) : '#5A5268'; c.beginPath(); c.arc(Xs, oy, T * 0.55, 0, TAU); c.fill(); c.stroke();
      if (hot) for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; bolt(c, Xs + Math.cos(a) * T * 0.4, oy + Math.sin(a) * T * 0.4, Xs + Math.cos(a) * T * 1.3, oy + Math.sin(a) * T * 0.9, T * 0.5, t, i, 0.7); }
      c.restore(); }
    function spark() { for (let k = 0; k < 20; k++) { const a = Math.random() * TAU, d = 2.4 + Math.random() * (R - 3.2), x = O.x + Math.cos(a) * d, y = O.y + Math.sin(a) * d * 0.95; if (Math.hypot(x - me.x, y - me.y) < 3 || S.sparks.some(s => Math.hypot(s.x - x, s.y - y) < 2.5)) continue; S.sparks.push({ x, y, t: 0, life: 9 }); return; } }
    function phase(p) { if (p === S.stage) return; S.stage = p; S.n = PH[p].n; S.spd = PH[p].spd; S.warnT = 1.4; if (PH[p].ring) S.ringT = PH[p].ring;
      if (p > 0) { X.banner(p === 1 ? 'THE COIL QUICKENS' : 'FULL POWER', p === 1 ? 'Three beams, and ring pulses: roll through the ring' : 'Four beams, and it reverses: watch for the warning', VIOLET_HI, 2.4, true); X.sfx.hum && X.sfx.hum(); } }
    X.after(1.2, () => { S.intro = false; phase(0); X.banner('THE SPINNING COIL', 'Gather 24 sparks while the beams turn. Roll (dodge) straight through a beam', VIOLET_HI, 3, true, true); });
    const polar = (x, y) => [Math.hypot(x - O.x, y - O.y), Math.atan2(y - O.y, x - O.x)];
    const angD = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
    return { S,
      cam() { return { x: O.x, y: O.y, k: 0.35, zoom: 0.7 }; },
      update(dt) { if (S.intro || S.won) return;
        if (S.warnT > 0) S.warnT -= dt; else S.rot += S.dir * S.spd * dt;
        // at full power it reverses now and then (with warning)
        if (S.stage === 2) { S.revT -= dt; if (S.revT < 1.2 && !S.revWarn) { S.revWarn = 1; X.text(O.x, O.y - 4.2, 'REVERSING!', AMBER, 16); } if (S.revT <= 0) { S.dir = -S.dir; S.revT = 6 + Math.random() * 3; S.revWarn = 0; } }
        // the beams
        if (S.hitT > 0) S.hitT -= dt;
        if (S.warnT <= 0 && !me.dead && !me.dodge && S.hitT <= 0) { const [d, a] = polar(me.x, me.y); if (d > r0 && d < R + 0.3) for (let i = 0; i < S.n; i++) { const b = S.rot + i * TAU / S.n, da = angD(a, b); if (Math.abs(da) < Math.PI / 2 && Math.abs(Math.sin(da)) * d < 0.42 + me.r * 0.4) { S.hitT = 0.9; X.hurtPet(X.ST().hp * 0.13, null); X.push(b + S.dir * Math.PI / 2, 2.2); X.text(me.x, me.y - 1.3, 'ZAP!', VIOLET_HI, 14); X.shake(4, 0.2); break; } } }
        // ring pulses from the coil (phase two on)
        if (PH[S.stage].ring) { S.ringT -= dt; if (S.ringT <= 1.1 && !S.ring) S.ring = { pre: 1.1, r: r0 }; if (S.ring) { if (S.ring.pre > 0) { S.ring.pre -= dt; if (S.ring.pre <= 0) { X.sfx.whoosh && X.sfx.whoosh(); S.ringT = PH[S.stage].ring + 1.1; } } else { S.ring.r += dt * 4.2; const [d] = polar(me.x, me.y); if (!me.dodge && !me.dead && !S.ring.hit && Math.abs(d - S.ring.r) < 0.45) { S.ring.hit = true; X.hurtPet(X.ST().hp * 0.11, null); X.text(me.x, me.y - 1.3, 'Roll through it!', AMBER, 13); } if (S.ring.r > R + 0.5) S.ring = null; } } }
        // the sparks: three out at a time, each fading after a while
        for (const s of S.sparks) { s.t += dt; if (Math.hypot(me.x - s.x, me.y - s.y) < 1.0 + me.r) { s.got = true; S.got++; S.streak = g.t - S.lastGot < 2.2 ? S.streak + 1 : 1; S.lastGot = g.t; X.sparks && X.sparks(s.x, s.y, VIOLET_HI, 12, 5); X.sfx.chirp(); X.text(s.x, s.y - 1, S.streak >= 3 ? `${S.got}/${NEED} · streak ×${S.streak}` : `${S.got}/${NEED}`, VIOLET_HI, 13); if (S.streak >= 3) { me.hp = Math.min(X.ST().hp, me.hp + X.ST().hp * 0.03); } } }
        S.sparks = S.sparks.filter(s => !s.got && s.t < s.life); while (S.sparks.length < 3) spark();
        phase(S.got < 8 ? 0 : S.got < 16 ? 1 : 2);
        // spark mites (and later hull wings) come in at the rim
        S.mobT -= dt; if (S.mobT <= 0) { S.mobT = 9; if (alive(S.mobs) < 4) for (let i = 0; i < (S.stage >= 1 ? 2 : 1); i++) { const a = Math.random() * TAU; spawnAt(X, i && S.stage >= 2 ? 'hullwing' : 'sparkmite', { x: O.x + Math.cos(a) * (R - 1), y: O.y + Math.sin(a) * (R - 1) }, S.mobs, true); } }
        if (S.got >= NEED) { S.won = true; self.done = true; H.setExit(E.x, E.y, 'To the capacitor hall'); S.ring = null; for (const m of S.mobs) if (!m.dead) X.killMon(m); X.flash(0.6, '#FFFFFF'); X.boom(O.x, O.y - 3, 3, VIOLET_HI, '#FFFFFF', { n: 40, shake: 12 }); X.banner('THE COIL BURNS OUT', 'Twenty-four sparks: it overloads and goes dark', VIOLET_HI, 2.8, true, true); X.sfx.fanfare(); } },
      goal() { if (self.done) return 'The way on'; if (S.intro) return 'The Spinning Coil'; return `Sparks ${S.got}/${NEED} · roll through the beams${S.stage >= 1 ? ' and the ring pulses' : ''}`; },
      hint() { if (self.done) return null; return null; },
      drawGround(c) { const T = X.Tz(), t = g.t, Xo = X.sx(O.x), Yo = X.sy(O.y);
        // the arena's rings of conductive plating
        c.save(); c.strokeStyle = 'rgba(232,184,255,.12)'; c.lineWidth = 2; for (const rr of [3, 6, R]) { c.beginPath(); c.ellipse(Xo, Yo, rr * T, rr * T * 0.95, 0, 0, TAU); c.stroke(); } c.restore();
        if (!S.won) {
          // the beams: dashed previews while they re-arm, crackling lightning when live
          for (let i = 0; i < S.n; i++) { const b = S.rot + i * TAU / S.n, ax = Xo + Math.cos(b) * r0 * T, ay = Yo + Math.sin(b) * r0 * T * 0.95, bx = Xo + Math.cos(b) * R * T, by = Yo + Math.sin(b) * R * T * 0.95;
            if (S.warnT > 0) { c.save(); c.globalAlpha = 0.5 + 0.4 * Math.sin(t * 20); c.strokeStyle = AMBER; c.lineWidth = 3; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.restore(); }
            else { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18; c.strokeStyle = VIOLET; c.lineWidth = T * 1.1; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.restore(); bolt(c, ax, ay, bx, by, T, t, i * 7, 1); glowAt(c, bx, by, T * 0.9, VIOLET_HI, 0.6); } }
          // the ring pulse: the coil glows first, then the ring runs outward
          if (S.ring && S.ring.pre <= 0) { const rr = S.ring.r; c.save(); c.globalCompositeOperation = 'lighter'; for (const [w, col, a] of [[T * 0.6, VIOLET, 0.35], [T * 0.18, VIOLET_HI, 0.9], [T * 0.06, '#FFFFFF', 1]]) { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.ellipse(Xo, Yo, rr * T, rr * T * 0.95, 0, 0, TAU); c.stroke(); } c.restore(); }
          // the sparks
          for (const s of S.sparks) { const Xs = X.sx(s.x), Ys = X.sy(s.y) - T * 0.4, fade = Math.min(1, (s.life - s.t) / 1.5), k = Math.min(1, s.t / 0.3); glowAt(c, Xs, Ys, T * 1.1 * k, VIOLET_HI, 0.7 * fade); c.save(); c.globalAlpha = fade; c.fillStyle = '#FFFFFF'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4 + t * 2, rr = (i % 2 ? 0.13 : 0.4) * T * k; c.lineTo(Xs + Math.cos(a) * rr, Ys + Math.sin(a) * rr); } c.closePath(); c.fill(); c.strokeStyle = VIOLET_HI; c.lineWidth = 2; c.beginPath(); c.arc(Xs, Ys + T * 0.4, T * 0.5, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - s.t / s.life)); c.stroke(); c.restore(); }
        }
        if (S.ring && S.ring.pre > 0) label(c, 'RING PULSE', Xo, Yo - T * 4.6, T * 0.3, AMBER);
        // the progress meter round the coil's foot
        c.save(); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 6; c.beginPath(); c.ellipse(Xo, Yo, T * 1.9, T * 0.8, 0, 0, TAU); c.stroke(); c.strokeStyle = VIOLET_HI; c.beginPath(); c.ellipse(Xo, Yo, T * 1.9, T * 0.8, 0, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, S.got / NEED)); c.stroke(); c.restore(); },
    };
  }
  const COIL_LAYOUT = (() => { const N = 23, C = 11, r = []; for (let y = 0; y < N; y++) { let t = ''; for (let x = 0; x < N; x++) { const d = Math.hypot(x - C, (y - C) * 1.05); let ch = d < 10.2 ? '.' : d < 11 ? '#' : '~'; if (x === C && y === C) ch = 'O'; if (x === C && y === C + 8) ch = 'S'; if (x === C && y === 1) ch = 'E'; t += ch; } r.push(t); } return r; })();
  YUG_STAGES.COIL = { name: 'The Spinning Coil', goal: 'Gather 24 sparks', how: 'A giant tesla coil throws beams of lightning out to the rim, turning slowly round it. Gather 24 sparks (they fade after a while; three are out at once). A beam hurts and shoves you: roll (dodge) straight through it, or keep moving with the gap. At 8 sparks a third beam joins and ring pulses run out from the coil (it glows first): roll through the ring. At 16, four beams, and it reverses now and then (a warning shows). Three sparks in quick succession heal you a little. Spark mites come in at the rim.',
    layout: COIL_LAYOUT, legend: { O: { tile: T_SOLID }, E: {} }, make: makeCoil };

  /* ======================= THE MELTDOWN RUN (action) ======================= */
  // the corridor, built bottom-up from segments
  const MELT = (() => { const W = 11, rows = [], meta = [], add = (s, kind) => { rows.push(s); meta.push(kind || ''); }, floor = (k) => '#' + '.'.repeat(W - 2) + '#';
    const seg = { start: () => { add(floor()); add('#....S....#'); add(floor()); add(floor()); }, conv: () => { for (let i = 0; i < 4; i++) add('#' + 'c'.repeat(W - 2) + '#', 'conv'); }, door: () => { add(floor()); add('#' + 'b'.repeat(W - 2) + '#', 'door'); add(floor()); },
      piston: () => { add('#' + 'p'.repeat(W - 2) + '#', 'piston'); add(floor()); add('#' + 'p'.repeat(W - 2) + '#', 'piston'); add(floor()); }, valve: () => { add(floor()); add('#....v....#'); add(floor()); },
      zap: () => { add('#zz..zz..z#'); add('#..zz..zz.#'); add('#z..zz..zz#'); add('#.zz..zz..#'); add(floor()); }, mites: () => { add(floor()); add('#.q.....q.#'); add(floor()); add('#....q....#'); add(floor()); add(floor()); },
      finish: () => { add(floor()); add(floor()); add('#....E....#'); add(floor()); } };
    ['start', 'conv', 'door', 'piston', 'valve', 'zap', 'door', 'conv', 'mites', 'valve', 'piston', 'door', 'zap', 'conv', 'valve', 'piston', 'door', 'conv', 'finish'].forEach(k => seg[k]());
    rows.push('#'.repeat(W)); meta.push(''); rows.unshift('#'.repeat(W)); meta.unshift('');
    return { layout: rows.reverse(), meta: meta.reverse() }; })();
  function makeMeltdown(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { VIOLET, VIOLET_HI, AMBER, TEAL, TEAL_HI, INK } = P(), MAGENTA = '#FF4FB8';
    const E = mk.E[0], start = { x: M.start.x, y: M.start.y };
    const rowsOf = ch => { const by = {}; for (const p of mk[ch] || []) (by[p.ty] = by[p.ty] || []).push(p); return Object.keys(by).map(Number).sort((a, b) => b - a).map((ty, i) => ({ ty, tiles: by[ty], i })); };
    const doors = rowsOf('b').map((d, i) => Object.assign(d, { off: i * 1.1, open: true }));
    const pistons = rowsOf('p').map((p, i) => Object.assign(p, { off: (i % 2) * 0.65 + Math.floor(i / 2) * 0.3, st: 'idle', hit: false, k: 0 }));
    const convs = rowsOf('c'), zaps = (mk.z || []).map(p => ({ tx: p.tx, ty: p.ty }));
    const x0 = 1, x1 = M.MW ? Math.max(...(mk.c || [{ tx: 9 }]).map(p => p.tx)) + 1 : 10;
    const S = { intro: true, py: start.y + 6, spd: 2.25, t: 0, pause: 0, last: start, lastY: start.y, caught: 0, won: false, zapHit: 0, convK: 0, mobs: [] };
    (mk.q || []).forEach(p => spawnAt(X, Math.random() < 0.6 ? 'sparkmite' : 'hullwing', p, S.mobs, false)); g.total = X.mons.length;
    const valves = (mk.v || []).map((p, i) => { const V = { i, x: p.x, y: p.y, used: false }; V.obj = H.obj({ x: p.x, y: p.y, kind: 'valve', r: 0.9, h: 1.9, label: () => (V.used ? 'Vented' : 'Vent the coolant: stalls the meltdown'), use() { if (V.used) return; V.used = true; S.pause = 4.5; S.last = { x: p.x, y: p.y + 0.9 }; S.lastY = p.y; X.sfx.whoosh && X.sfx.whoosh(); X.banner('COOLANT VENTED', 'The meltdown stalls for a moment · this is your new checkpoint', TEAL_HI, 2, true); for (let k = 0; k < 20; k++) X.part({ kind: 'smoke', x: p.x + (Math.random() - 0.5) * 8, y: S.py - Math.random(), vx: (Math.random() - 0.5) * 2, vy: -1, life: 1.4, max: 1.4, size: 2.4, color: '#CFFFF6' }); },
      draw(c, Xs, Ys, T) { c.save(); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.1, T * 0.6, T * 0.2, 0, 0, TAU); c.fill(); c.fillStyle = '#4A5E70'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - T * 0.15, Ys - T * 1.1, T * 0.3, T * 1.1); c.strokeRect(Xs - T * 0.15, Ys - T * 1.1, T * 0.3, T * 1.1);
        c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(Xs, Ys - T * 1.25, T * 0.45, 0, TAU); c.stroke(); c.strokeStyle = V.used ? '#5A6278' : TEAL; c.lineWidth = 3; c.stroke(); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + (V.used ? 0.8 : g.t); c.beginPath(); c.moveTo(Xs, Ys - T * 1.25); c.lineTo(Xs + Math.cos(a) * T * 0.42, Ys - T * 1.25 + Math.sin(a) * T * 0.42); c.stroke(); } if (!V.used) glowAt(c, Xs, Ys - T * 1.25, T * 0.9, TEAL, 0.5); c.restore(); } }); return V; });
    X.after(1.0, () => { S.intro = false; X.banner('THE MELTDOWN RUN', 'The core is melting down behind you: RUN. Vent the coolant valves to stall it', MAGENTA, 3, true, true); X.shake(8, 0.8); });
    function caught() { S.caught++; X.flash(0.5, '#FFFFFF'); X.hurtPet(X.ST().hp * 0.18, null); X.banner('THE MELTDOWN CAUGHT YOU', S.last === start ? 'Back to the start: keep ahead of it' : 'Back to the last valve you vented', MAGENTA, 2, true); X.sfx.wrong(); me.x = S.last.x; me.y = S.last.y; me.vx = me.vy = 0; me.push = null; me.dodge = null; S.py = S.lastY + 7; S.pause = 2.0; }
    return { S, doors, pistons,
      cam() { return { x: (x0 + x1) / 2, y: me.y - 1.5, k: 0.7, zoom: 0.8 }; },
      update(dt) { if (S.intro) return; S.t += dt;
        // the meltdown rises (a little faster as it goes), stalls while vented
        if (!S.won) { if (S.pause > 0) S.pause -= dt; else { S.spd = Math.min(3.15, 2.25 + S.t * 0.012); S.py -= S.spd * dt; } if (S.py > me.y + 13) S.py = me.y + 13; if (!me.dead && me.y > S.py - 0.35) caught(); if (Math.random() < dt * 30) X.part({ kind: 'spark', x: x0 + Math.random() * (x1 - x0), y: S.py - 0.2, vx: (Math.random() - 0.5) * 2, vy: -3 - Math.random() * 3, life: 0.6, max: 0.6, size: 3, color: Math.random() < 0.5 ? MAGENTA : VIOLET_HI }); }
        // blast doors: open, then amber warning lights, then shut (a pet caught in the doorway is thrown back)
        let dirty = false; for (const D of doors) { const u = ((S.t + D.off) % 3.4) / 3.4, st = u < 0.52 ? 'open' : u < 0.68 ? 'warn' : 'shut'; if (st !== D.st) { if (st === 'shut') { D.tiles.forEach(t => X.setTile(t.tx, t.ty, T_SOLID)); dirty = true; if (Math.floor(me.y) === D.ty) { me.y = D.ty + 1.5; X.hurtPet(X.ST().hp * 0.08, null); X.text(me.x, me.y - 1.2, 'Thrown back!', AMBER, 13); } } else if (D.st === 'shut') { D.tiles.forEach(t => X.setTile(t.tx, t.ty, T_FLOOR)); dirty = true; } D.st = st; } }
        if (dirty) X.retile();
        // pistons: a red band shows, then rams slam in from both walls
        for (const Pn of pistons) { const u = ((S.t + Pn.off) % 2.6) / 2.6, st = u < 0.45 ? 'idle' : u < 0.8 ? 'warn' : u < 0.9 ? 'slam' : 'back'; if (st === 'slam' && Pn.st !== 'slam') { Pn.hit = false; X.shake(3, 0.12); } Pn.st = st; Pn.k += ((st === 'slam' ? 1 : st === 'back' ? 0.4 : 0) - Pn.k) * Math.min(1, dt * (st === 'slam' ? 30 : 6));
          if (st === 'slam' && !Pn.hit && !me.dodge && Math.abs(me.y - (Pn.ty + 0.5)) < 0.65) { Pn.hit = true; X.hurtPet(X.ST().hp * 0.1, null); me.y = Math.min(me.y + 1.4, S.py - 0.6); X.text(me.x, me.y - 1.2, 'SLAM!', AMBER, 14); } }
        // conveyor belts carry you back toward it
        const onConv = convs.some(cv => Math.floor(me.y) === cv.ty); if (onConv && !me.dodge) X.moveEnt(me, 0, 2.0 * dt);
        // live floor: patches warn, then crackle
        const zu = (S.t % 2.4) / 2.4; S.zst = zu < 0.42 ? 'off' : zu < 0.58 ? 'warn' : 'live'; if (S.zapHit > 0) S.zapHit -= dt;
        if (S.zst === 'live' && !me.dodge && S.zapHit <= 0 && zaps.some(z => z.tx === Math.floor(me.x) && z.ty === Math.floor(me.y))) { S.zapHit = 0.6; X.hurtPet(X.ST().hp * 0.09, null); X.text(me.x, me.y - 1.3, 'ZAP!', VIOLET_HI, 14); }
        if (!S.won && me.y < E.y + 1.5) { S.won = true; self.done = true; H.setExit(E.x, E.y, 'To the engine heart'); X.banner('YOU OUTRAN THE MELTDOWN', 'The blast shield drops behind you', TEAL_HI, 2.6, true, true); X.sfx.fanfare(); S.pause = 999; } },
      goal() { if (self.done) return 'The engine heart'; if (S.intro) return 'The Meltdown Run'; const gap = Math.max(0, S.py - me.y), left = Math.max(0, Math.round(me.y - E.y)); return `${S.pause > 0 ? 'STALLED · ' : ''}Meltdown ${gap.toFixed(0)} m behind you · ${left} m to go`; },
      hint() { return null; },
      drawGround(c) { const T = X.Tz(), t = g.t, Xa = X.sx(x0), Xb = X.sx(x1);
        // conveyor belts: dark rubber, chevrons running back toward the meltdown
        for (const cv of convs) { const Y = X.sy(cv.ty); c.save(); c.fillStyle = 'rgba(20,20,26,.75)'; c.fillRect(Xa, Y, Xb - Xa, T); c.beginPath(); c.rect(Xa, Y, Xb - Xa, T); c.clip(); c.strokeStyle = 'rgba(255,178,63,.7)'; c.lineWidth = 3; const off = (t * 2.0 * T) % (T * 0.8); for (let x = Xa + T * 0.5; x < Xb; x += T * 1.2) for (let yy = Y - T + off; yy < Y + T * 1.5; yy += T * 0.8) { c.beginPath(); c.moveTo(x - T * 0.25, yy); c.lineTo(x, yy + T * 0.22); c.lineTo(x + T * 0.25, yy); c.stroke(); } c.restore(); }
        // live floor
        for (const z of zaps) { const Xs = X.sx(z.tx), Ys = X.sy(z.ty); c.save(); c.fillStyle = S.zst === 'live' ? 'rgba(196,82,255,.5)' : S.zst === 'warn' ? `rgba(255,178,63,${0.3 + 0.2 * Math.sin(t * 30)})` : 'rgba(20,22,30,.5)'; c.fillRect(Xs + 1, Ys + 1, T - 2, T - 2); c.strokeStyle = S.zst === 'off' ? 'rgba(255,178,63,.45)' : '#FFFFFF'; c.lineWidth = 1.5; c.strokeRect(Xs + 2, Ys + 2, T - 4, T - 4); c.restore(); if (S.zst === 'live') bolt(c, Xs + T * 0.15, Ys + T * 0.2, Xs + T * 0.85, Ys + T * 0.8, T * 0.5, t, z.tx * 3 + z.ty, 0.9); }
        // pistons: warning band, then two steel rams from the walls
        for (const Pn of pistons) { const Y = X.sy(Pn.ty), mid = (Xa + Xb) / 2, reach = (Xb - Xa) / 2 * Pn.k; c.save(); if (Pn.st === 'warn') { c.globalAlpha = 0.35 + 0.3 * Math.sin(t * 24); c.fillStyle = '#FF5A5A'; c.fillRect(Xa, Y, Xb - Xa, T); c.globalAlpha = 1; }
          for (const sd of [-1, 1]) { const wx = sd < 0 ? Xa : Xb, fx = wx - sd * reach; c.fillStyle = '#5A6278'; c.strokeStyle = INK; c.lineWidth = 2; const xa = Math.min(wx, fx), w = Math.abs(fx - wx); c.fillRect(xa, Y + T * 0.1, w, T * 0.8); c.strokeRect(xa, Y + T * 0.1, w, T * 0.8); c.fillStyle = '#3A3F50'; c.fillRect(fx - (sd < 0 ? T * 0.25 : 0), Y + T * 0.02, T * 0.25, T * 0.96); c.strokeRect(fx - (sd < 0 ? T * 0.25 : 0), Y + T * 0.02, T * 0.25, T * 0.96); } c.restore(); }
        // blast doors: steel leaves with hazard stripes; amber lights before they shut
        for (const D of doors) { const Y = X.sy(D.ty), w = (Xb - Xa) / 2, k = D.st === 'shut' ? 1 : D.st === 'warn' ? 0.15 : 0; c.save(); for (const sd of [-1, 1]) { const lx = sd < 0 ? Xa - w * (1 - k) * 0.95 : Xa + w + w * (1 - k) * 0.95; c.beginPath(); c.rect(Xa, Y - T * 0.6, Xb - Xa, T * 1.6); c.save(); c.clip(); c.fillStyle = '#3A3F50'; c.fillRect(lx, Y - T * 0.5, w, T * 1.5); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(lx, Y - T * 0.5, w, T * 1.5); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#1A1A1A' : AMBER; c.fillRect(lx + i * w / 8, Y + T * 0.7, w / 8, T * 0.22); } c.restore(); }
          if (D.st === 'warn') for (const sd of [-1, 1]) { const lx = sd < 0 ? Xa + 6 : Xb - 6; glowAt(c, lx, Y - T * 0.2, T * 0.7, AMBER, 0.6 + 0.4 * Math.sin(t * 30)); c.fillStyle = AMBER; c.beginPath(); c.arc(lx, Y - T * 0.2, T * 0.14, 0, TAU); c.fill(); } c.restore(); }
        // the meltdown itself: a wall of roiling plasma up from the bottom
        if (!S.won || S.py < me.y + 20) { const Yp = X.sy(S.py), H2 = X.H ? X.H() : 2000; if (Yp < H2 + 40) { c.save(); const gr = c.createLinearGradient(0, Yp - T, 0, Yp + T * 4); gr.addColorStop(0, 'rgba(255,79,184,0)'); gr.addColorStop(0.2, 'rgba(255,120,210,.85)'); gr.addColorStop(0.5, 'rgba(196,82,255,.95)'); gr.addColorStop(1, 'rgba(60,10,90,1)'); c.fillStyle = gr; c.beginPath(); c.moveTo(0, H2 + 50); c.lineTo(0, Yp); for (let x = 0; x <= X.W() + 20; x += 18) c.lineTo(x, Yp - T * 0.35 * Math.abs(Math.sin(x * 0.03 + t * 4)) - T * 0.15 * Math.sin(x * 0.11 - t * 7)); c.lineTo(X.W() + 20, H2 + 50); c.closePath(); c.fill();
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; c.fillStyle = '#FFFFFF'; c.fillRect(0, Yp - 2, X.W(), 3); c.globalAlpha = 0.35; blitSized(c, glowSprite(MAGENTA), -X.W() * 0.2, Yp - T * 3, X.W() * 1.4, T * 6); c.restore(); } }
        // danger: a red edge when it is close
        const gap = S.py - me.y; if (!S.won && gap < 4) { c.save(); c.globalAlpha = (1 - gap / 4) * (0.35 + 0.15 * Math.sin(t * 12)); const gg = c.createLinearGradient(0, 0, 0, X.H ? X.H() : 900); gg.addColorStop(0, 'rgba(255,79,184,0)'); gg.addColorStop(1, 'rgba(255,79,184,1)'); c.fillStyle = gg; c.fillRect(0, 0, X.W(), X.H ? X.H() : 900); c.restore(); label(c, 'RUN!', X.sx(me.x), X.sy(me.y) - T * 1.9, T * 0.45, '#FFFFFF'); } },
    };
  }
  YUG_STAGES.MELTDOWN = { name: 'The Meltdown Run', goal: 'Outrun the meltdown', how: 'The engine\'s core is melting down: a wall of plasma rises up the corridor behind you, a little faster as it goes. Run to the top. Conveyor belts carry you back toward it (roll to cross them quicker). Blast doors cycle open and shut: amber lights warn before they close. Pistons slam in from both walls on a red band. Live floor warns amber, then crackles. Stand at a coolant valve to vent it: the meltdown stalls for a few seconds and the valve becomes your checkpoint. Caught, you are thrown back to the last valve you vented.',
    layout: MELT.layout, legend: { S: {}, E: {}, c: {}, b: {}, p: {}, v: {}, z: {}, q: {} }, make: makeMeltdown };
})();
