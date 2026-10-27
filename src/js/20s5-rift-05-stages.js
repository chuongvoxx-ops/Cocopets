/* ---------- Rift 05, the Pale Aurora: its three challenge dungeons ----------
   AUR_STAGES.WIND       The Windbreak Crossing: turn stone vanes to raise windbreaks on the upwind side of each bridge
   AUR_STAGES.AVALANCHE  The Avalanche Galleries: slide deflectors, release ice blocks down chutes into catch basins
   AUR_STAGES.EMBER      Whiteout Ascent: carry a star ember from shelter to shelter before its warmth runs out
   (the palette AUR and the brood live in 20s6; these make() functions only run once a stage starts) */
const AUR_STAGES = {};
(() => {
  const TAU = Math.PI * 2, P = () => AUR;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const alive = list => list.filter(m => !m.dead).length;
  function spawnAt(X, type, p, list, aggro) { const q = X.freeSpot(p.x, p.y, 0.45) || p; const m = X.spawnMon(type, q.x, q.y, { pack: 900, rift: true, aggro: !!aggro }); X.g.total++; list.push(m); return m; }
  const tilesOf = (M, ch) => (M.marks[ch] || []).map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y }));
  const box = ts => ({ x0: Math.min(...ts.map(t => t.tx)), x1: Math.max(...ts.map(t => t.tx)) + 1, y0: Math.min(...ts.map(t => t.ty)), y1: Math.max(...ts.map(t => t.ty)) + 1 });
  const inBox = (b, x, y, pad) => x > b.x0 - (pad || 0) && x < b.x1 + (pad || 0) && y > b.y0 && y < b.y1;
  // a bar over the pet (warmth, exposure)
  function petBar(c, X, me, k, col, txt) { const T = X.Tz(), Xs = X.sx(me.x), Ys = X.sy(me.y) - T * 1.55, w = T * 1.4; c.save(); c.fillStyle = 'rgba(10,20,40,.75)'; GFX.rr(c, Xs - w / 2 - 2, Ys - 6, w + 4, 12, 6); c.fill(); c.fillStyle = col; GFX.rr(c, Xs - w / 2, Ys - 4, w * Math.max(0, Math.min(1, k)), 8, 4); c.fill(); if (txt) label(c, txt, Xs, Ys - 9, T * 0.26, '#FFFFFF'); c.restore(); }

  /* ======================= THE WINDBREAK CROSSING =======================
     Three ice bridges zig-zag up across the drop. The wind blows across each one (floor arrows on the shelf before it
     show which way). A stone vane on each shelf raises a folding ice windbreak on one edge of the next bridge: turn it
     until the windbreak stands on the upwind side, watch the flag settle, then cross in the sheltered strip. Caught in
     the open, the wind shoves you to the edge and then over: back to the last shelf, hurt. The first bridge's wind holds
     steady; the second turns about every few seconds (one bridge changes at a time); the third blows the other way. */
  function makeWind(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { ICE, ICE_HI, GREEN, GREEN_HI, NAVY, INK, SNOW } = P();
    const E = mk.E[0]; H.setExit(E.x, E.y, 'To the ice cave');
    const bridges = ['1', '2', '3'].map((ch, i) => { const ts = tilesOf(M, ch), b = box(ts); ts.forEach(t => X.setTile(t.tx, t.ty, T_BRIDGE)); return { i, ts, b, wind: i === 2 ? -1 : 1, wall: 0, wallK: 0, flag: 0, exp: 0, next: i === 1 ? 7 : 0, warn: 0 }; });
    const shelves = ['a', 'b', 'c', 'd'].map(ch => mk[ch][0]);
    const S = { intro: true, last: shelves[0], guards: [], crossed: 0, falls: 0 };
    // the vanes: each raises a windbreak on the west (-1) or east (+1) edge of the bridge after it, or none (0)
    const vanes = ['v', 'w', 'u'].map((ch, i) => { const p = mk[ch][0], B = bridges[i]; return H.obj({ x: p.x, y: p.y, kind: 'vane', r: 0.85, h: 2.0, B, label: () => `Vane: windbreak ${B.wall < 0 ? 'on the west edge' : B.wall > 0 ? 'on the east edge' : 'folded down'} · turn it`, use() { B.wall = B.wall === 0 ? -1 : B.wall < 0 ? 1 : 0; X.sfx.unlock(); X.text(p.x, p.y - 2.1, B.wall ? (B.wall === -B.wind ? 'Sheltered from this wind' : 'Wrong side for this wind!') : 'Folded', B.wall === -B.wind ? GREEN_HI : '#FF9BD2', 13); },
      draw(c, Xs, Ys, T) { const a = B.wall === 0 ? 0 : B.wall < 0 ? -1 : 1; c.save(); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.1, T * 0.45, T * 0.16, 0, 0, TAU); c.fill(); c.fillStyle = '#1E2638'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - T * 0.1, Ys - T * 1.9, T * 0.2, T * 1.9); c.strokeRect(Xs - T * 0.1, Ys - T * 1.9, T * 0.2, T * 1.9);
        // the flag streams downwind (it settles once the windbreak is right)
        const fl = B.wind * (1 + Math.sin(g.t * (B.wall === -B.wind ? 2 : 9)) * 0.12); c.fillStyle = B.wall === -B.wind ? GREEN_HI : '#C8D4E2'; c.beginPath(); c.moveTo(Xs, Ys - T * 1.85); c.lineTo(Xs + fl * T * 0.8, Ys - T * 1.65 + Math.sin(g.t * 8) * T * 0.04); c.lineTo(Xs, Ys - T * 1.45); c.closePath(); c.fill(); c.stroke();
        if (a) { c.fillStyle = ICE_HI; c.beginPath(); c.moveTo(Xs + a * T * 0.15, Ys - T * 0.6); c.lineTo(Xs + a * T * 0.45, Ys - T * 0.75); c.lineTo(Xs + a * T * 0.45, Ys - T * 0.45); c.closePath(); c.fill(); c.stroke(); } c.restore(); } }); });
    // guards: the first safe shelf (b), and the last vane's shelf (c)
    (mk.g || []).forEach((p, i) => spawnAt(X, i === 3 ? 'frostlantern' : 'rimescuttler', p, S.guards));
    (mk.h || []).forEach((p, i) => spawnAt(X, i < 2 ? 'veilray' : 'rimescuttler', p, S.guards));
    g.total = X.mons.length;
    X.after(1.2, () => { S.intro = false; X.banner('THE WINDBREAK CROSSING', 'Turn each vane: the windbreak must stand on the upwind edge', GREEN_HI, 3, true, true); });
    function fall(B) { S.falls++; X.flash(0.4, '#FFFFFF'); X.hurtPet(X.ST().hp * 0.15, null); X.banner('BLOWN OFF THE BRIDGE', 'Back to the last shelf: raise the windbreak on the upwind side', '#FF9BD2', 2, true); X.sfx.wrong(); me.x = S.last.x; me.y = S.last.y; me.vx = me.vy = 0; me.push = null; me.dodge = null; B.exp = 0; }
    return { S, bridges, vanes,
      update(dt) { if (S.intro) return;
        for (const B of bridges) {
          B.wallK += ((B.wall ? 1 : 0) - B.wallK) * Math.min(1, dt * 5);
          if (B.i === 1) { B.next -= dt; if (B.next < 1.6 && !B.warn) { B.warn = 1; X.text((B.b.x0 + B.b.x1) / 2, B.b.y0 - 0.6, 'The wind is turning!', '#FFE9A8', 14); } if (B.next <= 0) { B.wind = -B.wind; B.next = 7; B.warn = 0; } }
          const on = inBox(B.b, me.x, me.y, 0.2);
          if (on && !me.dead) { const sheltered = B.wall === -B.wind && B.wallK > 0.8;
            if (!sheltered && !me.dodge) { X.moveEnt(me, B.wind * 3.2 * dt, 0); const edge = B.wind > 0 ? me.x > B.b.x1 - me.r - 0.15 : me.x < B.b.x0 + me.r + 0.15; B.exp += dt * (edge ? 1.4 : 0.45); if (Math.random() < dt * 12) X.part({ kind: 'smoke', x: me.x - B.wind * 0.6, y: me.y + (Math.random() - 0.5) * 0.6, vx: B.wind * 6, vy: 0, life: 0.35, max: 0.35, size: 0.12, color: 'rgba(232,248,255,' }); if (B.exp >= 1) fall(B); }
            else B.exp = Math.max(0, B.exp - dt * 2); }
          else B.exp = Math.max(0, B.exp - dt * 2); }
        // the last safe shelf: the one you stand on (or crossed to)
        for (let i = 0; i < shelves.length; i++) { const s2 = shelves[i]; if (Math.hypot(me.x - s2.x, me.y - s2.y) < 3.2 && !bridges.some(B => inBox(B.b, me.x, me.y, 0.2))) { S.last = s2; if (i > S.crossed) { S.crossed = i; if (i < 3) X.text(me.x, me.y - 1.4, `Shelf ${i + 1}: across`, GREEN_HI, 13); } } }
        if (!self.done && S.crossed >= 3 && alive(S.guards) === 0) { self.done = true; X.banner('THE CROSSING HOLDS', 'Three windbreaks raised: the ice cave lies ahead', GREEN_HI, 2.6, true, true); X.sfx.fanfare(); }
      },
      goal() { if (self.done) return 'The ice cave'; if (S.intro) return 'The Windbreak Crossing'; const gl = alive(S.guards), B = bridges[Math.min(2, S.crossed)];
        if (S.crossed < 3) return `Bridge ${S.crossed + 1} of 3 · wind from the ${B.wind > 0 ? 'west' : 'east'} · windbreak ${B.wall === -B.wind ? 'right ✓' : B.wall ? 'on the wrong side' : 'down'}${gl ? ` · ${gl} guards` : ''}`;
        return `${gl} guards left`; },
      hint() { if (self.done || S.crossed >= 3) return null; const V = vanes[S.crossed], B = bridges[S.crossed]; return B.wall === -B.wind ? null : V; },
      drawGround(c) { const T = X.Tz();
        for (const B of bridges) { const X0 = X.sx(B.b.x0), X1 = X.sx(B.b.x1), Y0 = X.sy(B.b.y0), Y1 = X.sy(B.b.y1), up = B.wind > 0 ? X0 : X1, sheltered = B.wall === -B.wind && B.wallK > 0.8;
          // the wind across the bridge: streaming arrows (paler where it is sheltered)
          c.save(); c.globalAlpha = sheltered ? 0.15 : 0.55; c.strokeStyle = '#F4FBFF'; c.lineWidth = 2; const off = (g.t * 4) % 1.2; for (let yy = B.b.y0 + 0.5; yy < B.b.y1; yy += 1.2) for (let d = -1.5 + off; d < (B.b.x1 - B.b.x0) + 1.5; d += 1.2) { const xx = B.wind > 0 ? B.b.x0 - 1.5 + d : B.b.x1 + 1.5 - d, Xs = X.sx(xx), Ys = X.sy(yy); c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs + B.wind * T * 0.5, Ys); c.lineTo(Xs + B.wind * T * 0.35, Ys - T * 0.1); c.moveTo(Xs + B.wind * T * 0.5, Ys); c.lineTo(Xs + B.wind * T * 0.35, Ys + T * 0.1); c.stroke(); } c.restore();
          // the sheltered strip: double-bordered when the windbreak is right
          if (sheltered) { c.save(); c.strokeStyle = GREEN_HI; c.lineWidth = 2; c.setLineDash([6, 4]); c.strokeRect(X0 + 4, Y0 + 2, X1 - X0 - 8, Y1 - Y0 - 4); c.strokeRect(X0 + 9, Y0 + 7, X1 - X0 - 18, Y1 - Y0 - 14); c.restore(); }
          // the windbreak: a wall of ice slabs folding up out of the slots along an edge
          for (const sd of [-1, 1]) { const xx = sd < 0 ? X0 : X1, k = B.wall === sd ? B.wallK : 0; c.save(); c.fillStyle = 'rgba(30,50,80,.5)'; c.fillRect(xx - 3, Y0, 6, Y1 - Y0); if (k > 0.02) { for (let yy = Y0; yy < Y1 - 2; yy += T * 0.5) { c.fillStyle = 'rgba(207,232,244,.92)'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.rect(xx - T * 0.12, yy + 2 - T * 1.1 * k, T * 0.24, T * 1.1 * k + T * 0.4); c.fill(); c.stroke(); } } c.restore(); }
          // the floor arrows on the shelf before it: where the wind comes from
          if (B.i <= S.crossed) { const Xs = (X0 + X1) / 2, Ys = Y1 + T * 1.2; c.save(); c.fillStyle = B.i === 1 && B.next < 1.6 ? '#FFE9A8' : 'rgba(232,248,255,.85)'; for (const dx of [-1, 0, 1]) { const ax = Xs + dx * T * 0.9; c.beginPath(); c.moveTo(ax + B.wind * T * 0.4, Ys); c.lineTo(ax - B.wind * T * 0.2, Ys - T * 0.28); c.lineTo(ax - B.wind * T * 0.05, Ys); c.lineTo(ax - B.wind * T * 0.2, Ys + T * 0.28); c.closePath(); c.fill(); } if (B.i === 1) label(c, `turns in ${Math.ceil(B.next)}`, Xs, Ys + T * 0.75, T * 0.3, '#FFE9A8'); c.restore(); } }
        const B = bridges.find(b => inBox(b.b, me.x, me.y, 0.2)); if (B && B.exp > 0.02) petBar(c, X, me, B.exp, '#FF9BD2', 'WIND'); },
    };
  }
  AUR_STAGES.WIND = { name: 'The Windbreak Crossing', goal: 'Raise the windbreaks and cross', how: 'Three ice bridges cross the drop and the wind blows across each one: floor arrows on the shelf before a bridge show which way. Stand at the stone vane to turn it: it raises a folding ice windbreak on the west edge, then the east, then folds it down. It must stand on the UPWIND edge (the side the wind comes from): then the flag settles and the bridge shows a double-bordered sheltered strip. Caught in the open, the wind shoves you to the edge and over: back to the last shelf, hurt. The second bridge\'s wind turns every few seconds. Veil rays lay their own wind lanes: deal with them first.',
    layout: [
      '#######...........######',
      '#######.....E.....######',
      '#######.....d.....######',
      '~~~~~~~~~~333~~~~~~~~~~~',
      '~~~~~~~~~~333~~~~~~~~~~~',
      '~~~~~~~~~~333~~~~~~~~~~~',
      '~~~~~~~~~~333~~~~~~~~~~~',
      '~~~~~~~~~~333~~~~~~~~~~~',
      '###......h..u..h....####',
      '###.......c.........####',
      '###...h.........h...####',
      '~~~~222~~~~~~~~~~~~~~~~~',
      '~~~~222~~~~~~~~~~~~~~~~~',
      '~~~~222~~~~~~~~~~~~~~~~~',
      '~~~~222~~~~~~~~~~~~~~~~~',
      '~~~~222~~~~~~~~~~~~~~~~~',
      '##..g.w....g........####',
      '##......b......g....####',
      '##...g..............####',
      '~~~~~~~~~~~~~~111~~~~~~~',
      '~~~~~~~~~~~~~~111~~~~~~~',
      '~~~~~~~~~~~~~~111~~~~~~~',
      '~~~~~~~~~~~~~~111~~~~~~~',
      '~~~~~~~~~~~~~~111~~~~~~~',
      '#########..v...a.#######',
      '#########...S....#######',
      '########################'],
    legend: { E: {}, 1: {}, 2: {}, 3: {}, v: {}, w: {}, u: {}, a: {}, b: {}, c: {}, d: {}, g: {}, h: {} }, make: makeWind };

  /* ======================= THE AVALANCHE GALLERIES =======================
     Three ice chutes come down the cliff; below them five lanes run to the broken bridge: catch basins at the outer
     lanes and the middle one, empty disposal channels between. Two stone deflectors slide between rail stops across
     the slope (stand at one to slide it to its next stop): the upper one turns a block one lane east, the lower one lane
     west (their pale edges show which). Pull a chute's lever and its block slides down along the line shown. Each basin
     filled raises a section of the bridge; a block in a disposal channel shatters and the chute can be pulled again.
     A sliding block hurts whatever it meets. */
  function makeAvalanche(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { ICE, ICE_HI, GREEN, GREEN_HI, NAVY, INK, SNOW } = P();
    const E = mk.E[0]; H.setExit(E.x, E.y, 'To the telescope platform');
    const top = mk.T[0], bot = mk.Y[0];   // the lanes run from the top row to the basin row
    const LX = [0, 1, 2, 3, 4].map(i => top.x - 6 + i * 3), yTop = top.y, yBot = bot.y;
    const DEF = [{ y: yTop + (yBot - yTop) * 0.35, dir: 1, at: 2, stops: [1, 2, 3] }, { y: yTop + (yBot - yTop) * 0.68, dir: -1, at: 1, stops: [1, 2, 3] }];
    const basins = [0, 2, 4].map((lane, i) => ({ lane, i, full: false, seg: tilesOf(M, 'xyz'[i]) }));
    basins.forEach(b => b.seg.forEach(t => X.setTile(t.tx, t.ty, T_GAP)));
    const S = { intro: true, blocks: [], guards: [], rays: [], raysOn: false, filled: 0 };
    (mk.g || []).forEach((p, i) => spawnAt(X, i < 2 ? 'frostlantern' : 'rimescuttler', p, S.guards));
    g.total = X.mons.length;
    const route = lane0 => { const pts = [{ lane: lane0, y: yTop }]; let lane = lane0; for (const D of DEF) { pts.push({ lane, y: D.y }); if (D.at === lane) { lane += D.dir; pts.push({ lane, y: D.y + 0.8 }); } } pts.push({ lane, y: yBot }); return { pts, lane }; };
    const defObjs = DEF.map((D, i) => H.obj({ x: LX[D.at], y: D.y + 0.6, kind: 'deflector', r: 0.9, h: 1.0, D, label: () => `Deflector: turns blocks ${D.dir > 0 ? 'east' : 'west'} · slide it`, use() { const k = D.stops.indexOf(D.at); D.at = D.stops[(k + 1) % D.stops.length]; X.sfx.boop(); }, draw() {} }));
    const levers = [1, 2, 3].map((lane, i) => { const p = mk['LMN'[i]][0]; return H.obj({ x: p.x, y: p.y, kind: 'lever', r: 0.85, h: 1.6, lane, label: () => (S.blocks.some(b => b.lane0 === lane && !b.done) ? 'A block is sliding' : `Release chute ${i + 1}`), use() { if (S.blocks.some(b => b.lane0 === lane && !b.done)) return; const R = route(lane); S.blocks.push({ lane0: lane, pts: R.pts, end: R.lane, i: 0, u: 0, x: LX[lane], y: yTop, done: false, t: 0 }); X.sfx.crash ? X.sfx.crash() : X.sfx.thud(); X.shake(4, 0.3); },
      draw(c, Xs, Ys, T) { c.save(); c.fillStyle = '#4A5468'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - T * 0.3, Ys - T * 0.4, T * 0.6, T * 0.4); c.strokeRect(Xs - T * 0.3, Ys - T * 0.4, T * 0.6, T * 0.4); const busy = S.blocks.some(b => b.lane0 === lane && !b.done); c.translate(Xs, Ys - T * 0.4); c.rotate(busy ? 0.6 : -0.6); c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -T * 0.8); c.stroke(); c.strokeStyle = ICE_HI; c.lineWidth = 3; c.stroke(); c.fillStyle = GREEN_HI; c.beginPath(); c.arc(0, -T * 0.85, T * 0.12, 0, TAU); c.fill(); c.restore(); label(c, String(i + 1), Xs, Ys - T * 1.4, T * 0.34, ICE_HI); } }); });
    X.after(1.2, () => { S.intro = false; X.banner('THE AVALANCHE GALLERIES', 'Slide the deflectors, then release a block into each catch basin', GREEN_HI, 3, true, true); });
    return { S, DEF, basins, route,
      update(dt) { if (S.intro) return;
        DEF.forEach((D, i) => { defObjs[i].x = LX[D.at]; });
        for (const B of S.blocks) { if (B.done) continue; B.t += dt; const a = B.pts[B.i], b = B.pts[B.i + 1]; if (!b) { B.done = true; continue; }
          const ax = LX[a.lane], bx = LX[b.lane], len = Math.hypot(bx - ax, b.y - a.y) || 1; B.u += dt * 6.5 / len; if (B.u >= 1) { B.u = 0; B.i++; if (!B.pts[B.i + 1]) { B.done = true; land(B); continue; } }
          const a2 = B.pts[B.i], b2 = B.pts[B.i + 1]; B.x = LX[a2.lane] + (LX[b2.lane] - LX[a2.lane]) * B.u; B.y = a2.y + (b2.y - a2.y) * B.u;
          if (Math.hypot(me.x - B.x, me.y - B.y) < 1.1 + me.r && !me.dodge && !(B.hitT > 0)) { B.hitT = 1; X.hurtPet(X.ST().hp * 0.12, null); X.push(Math.atan2(me.y - B.y, me.x - B.x), 2); }
          if (B.hitT > 0) B.hitT -= dt;
          for (const m of X.mons) if (!m.dead && !m.boss && Math.hypot(m.x - B.x, m.y - B.y) < 1.2) X.hitMon(m, m.maxhp * 0.5, { flat: true }); }
        S.blocks = S.blocks.filter(b => !b.done || b.t < 0);
        if (!S.raysOn && S.filled >= 1) { S.raysOn = true; (mk.h || []).forEach(p => spawnAt(X, 'veilray', p, S.rays, true)); X.banner('VEIL RAYS', 'Crosswinds by the second lever: clear them', GREEN_HI, 2, true); }
        if (!self.done && S.filled >= 3 && alive(S.guards) + alive(S.rays) === 0) { self.done = true; X.banner('THE BRIDGE IS WHOLE', 'Three basins full: the way to the telescope platform', GREEN_HI, 2.6, true, true); X.sfx.fanfare(); } },
      goal() { if (self.done) return 'The telescope platform'; if (S.intro) return 'The Avalanche Galleries'; const gl = alive(S.guards) + alive(S.rays); return `Basins ${S.filled}/3${gl ? ` · ${gl} guards` : ''} · slide the deflectors, pull a lever`; },
      hint() { return null; },
      drawGround(c) { const T = X.Tz();
        // the lanes: faint grooves down the slope; basins and disposal channels at their feet
        for (let i = 0; i < 5; i++) { const Xs = X.sx(LX[i]); c.save(); c.strokeStyle = 'rgba(134,183,208,.35)'; c.lineWidth = T * 0.9; c.beginPath(); c.moveTo(Xs, X.sy(yTop)); c.lineTo(Xs, X.sy(yBot)); c.stroke(); c.restore();
          const isB = basins.find(b => b.lane === i), Ys = X.sy(yBot) + T * 0.4; c.save(); c.fillStyle = isB ? (isB.full ? ICE_HI : '#1E3050') : 'rgba(20,30,50,.6)'; c.strokeStyle = isB ? GREEN_HI : 'rgba(180,200,220,.4)'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(Xs, Ys, T * 1.1, T * 0.55, 0, 0, TAU); c.fill(); c.stroke(); label(c, isB ? (isB.full ? '✓' : 'BASIN') : 'drop', Xs, Ys + T * 0.12, T * 0.26, isB ? GREEN_HI : 'rgba(255,255,255,.5)'); c.restore(); }
        // the chutes at the top
        for (const lane of [1, 2, 3]) { const Xs = X.sx(LX[lane]), Ys = X.sy(yTop); c.save(); c.fillStyle = '#3A4458'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs - T * 0.9, Ys - T * 1.6); c.lineTo(Xs + T * 0.9, Ys - T * 1.6); c.lineTo(Xs + T * 0.6, Ys); c.lineTo(Xs - T * 0.6, Ys); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#F6FAFC'; c.fillRect(Xs - T * 0.9, Ys - T * 1.75, T * 1.8, T * 0.2); c.restore(); }
        // the deflectors on their rails, pale edge toward where they turn a block
        DEF.forEach(D => { const Y = X.sy(D.y); c.save(); c.strokeStyle = 'rgba(30,40,60,.7)'; c.lineWidth = 4; c.beginPath(); c.moveTo(X.sx(LX[1]) - T, Y); c.lineTo(X.sx(LX[3]) + T, Y); c.stroke(); D.stops.forEach(s => { c.fillStyle = '#2A3448'; c.beginPath(); c.arc(X.sx(LX[s]), Y, T * 0.12, 0, TAU); c.fill(); });
          const Xs = X.sx(LX[D.at]); c.fillStyle = '#6A7890'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs - D.dir * T * 0.8, Y - T * 0.5); c.lineTo(Xs + D.dir * T * 0.9, Y + T * 0.45); c.lineTo(Xs - D.dir * T * 0.8, Y + T * 0.45); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = '#F6FAFC'; c.lineWidth = 4; c.beginPath(); c.moveTo(Xs - D.dir * T * 0.8, Y - T * 0.5); c.lineTo(Xs + D.dir * T * 0.9, Y + T * 0.45); c.stroke(); c.restore(); });
        // the preview: each chute's path with the deflectors as they stand
        for (const lane of [1, 2, 3]) { const R = route(lane), ok = basins.some(b => b.lane === R.lane && !b.full), near = levers.some(o => o.lane === lane && Math.hypot(me.x - o.x, me.y - o.y) < 3); c.save(); c.globalAlpha = near ? 0.9 : 0.35; c.strokeStyle = ok ? GREEN_HI : '#FF9BD2'; c.lineWidth = near ? 3.5 : 2; c.setLineDash([7, 6]); c.lineDashOffset = -g.t * 20; c.beginPath(); R.pts.forEach((p, i) => { const x = X.sx(LX[p.lane]) + (lane - 2) * 3, y = X.sy(p.y); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.restore(); }
        // the blocks
        for (const B of S.blocks) { if (B.done) continue; const Xs = X.sx(B.x), Ys = X.sy(B.y) - T * 0.5, s = T * 1.0; c.save(); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.55, s * 0.9, s * 0.3, 0, 0, TAU); c.fill(); c.translate(Xs, Ys); c.rotate(Math.sin(B.t * 3) * 0.1); c.beginPath(); c.moveTo(-s * 0.8, s * 0.4); c.lineTo(-s * 0.6, -s * 0.55); c.lineTo(s * 0.2, -s * 0.75); c.lineTo(s * 0.85, -s * 0.2); c.lineTo(s * 0.7, s * 0.5); c.closePath(); c.fillStyle = '#DDF0F8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); c.fillStyle = ICE; c.beginPath(); c.moveTo(s * 0.2, -s * 0.75); c.lineTo(s * 0.85, -s * 0.2); c.lineTo(s * 0.7, s * 0.5); c.lineTo(0, s * 0.1); c.closePath(); c.fill(); c.stroke(); c.restore(); }
        // the bridge sections, raised
        basins.forEach(b => { if (!b.full) return; c.save(); for (const t of b.seg) { const Xs = X.sx(t.tx), Ys = X.sy(t.ty); c.fillStyle = 'rgba(207,232,244,.9)'; c.fillRect(Xs, Ys, T + 0.5, T + 0.5); c.strokeStyle = 'rgba(80,130,170,.5)'; c.lineWidth = 1.5; c.strokeRect(Xs + 1, Ys + 1, T - 2, T - 2); } c.restore(); });
      },
    };
    function land(B) { const bs = basins.find(b => b.lane === B.end && !b.full); if (bs) { bs.full = true; S.filled++; bs.seg.forEach(t => X.setTile(t.tx, t.ty, T_BRIDGE)); X.retile(); X.boom(LX[B.end], yBot, 1.6, ICE_HI, '#FFFFFF', { n: 22, shake: 7 }); X.banner(`BASIN ${S.filled} OF 3`, 'A section of the bridge rises', GREEN_HI, 1.8, true); X.sfx.fanfare(); }
      else { X.boom(LX[B.end], yBot, 1.2, ICE_HI, '#FFFFFF', { n: 14, shake: 4 }); X.text(LX[B.end], yBot - 1.2, basins.find(b => b.lane === B.end) ? 'That basin is already full' : 'Into the drop: try again', '#FF9BD2', 13); X.sfx.wrong(); } }
  }
  AUR_STAGES.AVALANCHE = { name: 'The Avalanche Galleries', goal: 'Fill the three catch basins', how: 'Three ice chutes come down the cliff; five lanes run down the slope to the broken bridge: catch basins at the two outer lanes and the middle one, empty drops between. Two stone deflectors slide along rails across the slope (stand at one to slide it to its next stop): the upper one turns a block one lane east, the lower one one lane west (the white edge shows which way). A dashed line shows where each chute\'s block will go (green into an empty basin, pink into a drop). Pull a lever to release that chute. Each basin filled raises a section of the bridge; a block in a drop shatters and you can try again. Sliding blocks hurt anything they hit, you included.',
    layout: [
      '####################',
      '####......T.....####',
      '##................##',
      '##................##',
      '##....g......g....##',
      '##L...............##',
      '##................##',
      '##................##',
      '##M...............##',
      '##................##',
      '##.....h....h.....##',
      '##N...............##',
      '##................##',
      '##................##',
      '##.g..........g...##',
      '##.......Y..S.....##',
      '##................##',
      '~~~~~~~~~xxx~~~~~~~~',
      '~~~~~~~~~xxx~~~~~~~~',
      '~~~~~~~~~yyy~~~~~~~~',
      '~~~~~~~~~yyy~~~~~~~~',
      '~~~~~~~~~zzz~~~~~~~~',
      '~~~~~~~~~zzz~~~~~~~~',
      '#####.....E.....####',
      '#####...........####',
      '####################'],
    legend: { T: {}, Y: {}, L: {}, M: {}, N: {}, g: {}, h: {}, x: {}, y: {}, z: {}, E: {} }, make: makeAvalanche };

  /* ======================= WHITEOUT ASCENT =======================
     Up the summit from shelter to shelter: three dark stone niches, each with a pale floor circle and a warm gold bowl.
     A star ember waits in the first bowl. Carry it: its warmth drains outside a shelter (faster in a blowing wind lane)
     and refills inside one. Wind lanes across the path open and close in a shown sequence: choose your moment. Warmth
     gone and the ember goes back to the last niche it reached. Set it down in any bowl to fight; deliver it to the
     summit brazier and clear its guards, and the ice barrier falls. */
  function makeEmber(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { ICE, ICE_HI, GREEN, GREEN_HI, NAVY, INK, SNOW } = P(), WARM = '#FFB35C';
    const niches = ['1', '2', '3'].map((ch, i) => ({ i, x: mk[ch][0].x, y: mk[ch][0].y, ember: i === 0 }));
    const braz = mk.Z[0], E = mk.E[0]; const barrier = tilesOf(M, 'b'); barrier.forEach(t => X.setTile(t.tx, t.ty, T_SOLID));
    const S = { intro: true, carry: false, warm: 1, last: 0, delivered: false, guards: [[], [], []], open: false, lanes: [] };
    // the wind lanes: horizontal bands across the path, each on its own clock (warning, blowing, still)
    (mk.w || []).forEach((p, i) => S.lanes.push({ y: p.y, dir: i % 2 ? -1 : 1, per: 6 + (i % 3), off: i * 1.7, st: 'still', k: 0 }));
    const laneState = L => { const u = ((g.t + L.off) % L.per) / L.per; return u < 0.45 ? 'still' : u < 0.58 ? 'warn' : 'blow'; };
    (mk.p || []).forEach(p => spawnAt(X, 'rimescuttler', p, S.guards[0]));
    (mk.q || []).forEach((p, i) => spawnAt(X, i === 0 ? 'frostlantern' : 'veilray', p, S.guards[1]));
    (mk.r || []).forEach(p => spawnAt(X, 'rimescuttler', p, S.guards[2]));
    g.total = X.mons.length;
    const inNiche = (x, y) => niches.find(n => Math.hypot(x - n.x, y - n.y) < 1.8);
    niches.forEach(n => { n.obj = H.obj({ x: n.x, y: n.y - 1.6, kind: 'bowl', r: 0.7, h: 1.2, label: () => (n.ember && !S.carry ? 'Take the star ember' : S.carry ? 'Set the ember down here' : 'A warm gold bowl'), use() { if (S.carry && !n.ember) { S.carry = false; n.ember = true; S.last = n.i; X.sfx.boop(); return; } if (!S.carry && n.ember) { n.ember = false; S.carry = true; S.warm = Math.max(S.warm, 0.6); S.last = n.i; X.sfx.chirp(); } }, draw(c, Xs, Ys, T) { drawNiche(c, n, T); } }); });
    const brazObj = H.obj({ x: braz.x, y: braz.y, kind: 'brazier', r: 0.9, h: 1.8, label: () => (S.delivered ? 'The summit brazier burns' : S.carry ? 'Light the summit brazier' : 'The summit brazier: bring the ember'), use() { if (S.delivered || !S.carry) return; S.carry = false; S.delivered = true; X.banner('THE BRAZIER BURNS', alive(S.guards[2]) ? 'Clear its guards' : 'The ice barrier is melting', WARM, 2.2, true); X.sfx.fanfare(); X.boom(braz.x, braz.y - 1, 2, WARM, '#FFFFFF', { n: 26, shake: 6 }); },
      draw(c, Xs, Ys, T) { c.save(); c.fillStyle = '#2E3850'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs - T * 0.5, Ys); c.lineTo(Xs - T * 0.7, Ys - T * 0.8); c.lineTo(Xs + T * 0.7, Ys - T * 0.8); c.lineTo(Xs + T * 0.5, Ys); c.closePath(); c.fill(); c.stroke(); if (S.delivered) { glowAt(c, Xs, Ys - T * 1.3, T * 1.6, WARM, 0.8); c.fillStyle = WARM; c.beginPath(); c.moveTo(Xs, Ys - T * (2 + 0.15 * Math.sin(g.t * 8))); c.quadraticCurveTo(Xs + T * 0.5, Ys - T * 1.2, Xs, Ys - T * 0.85); c.quadraticCurveTo(Xs - T * 0.5, Ys - T * 1.2, Xs, Ys - T * (2 + 0.15 * Math.sin(g.t * 8))); c.fill(); } c.restore(); } });
    function drawNiche(c, n, T) { const Xs = X.sx(n.x), Ys = X.sy(n.y); c.save(); c.fillStyle = 'rgba(255,240,215,.35)'; c.strokeStyle = 'rgba(255,214,150,.8)'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(Xs, Ys, T * 1.8, T * 0.9, 0, 0, TAU); c.fill(); c.stroke();
      // the dark stone arch over it
      c.fillStyle = '#2E3850'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs - T * 1.6, Ys - T * 0.6); c.lineTo(Xs - T * 1.6, Ys - T * 2.4); c.quadraticCurveTo(Xs, Ys - T * 3.6, Xs + T * 1.6, Ys - T * 2.4); c.lineTo(Xs + T * 1.6, Ys - T * 0.6); c.lineTo(Xs + T * 1.25, Ys - T * 0.6); c.lineTo(Xs + T * 1.25, Ys - T * 2.3); c.quadraticCurveTo(Xs, Ys - T * 3.2, Xs - T * 1.25, Ys - T * 2.3); c.lineTo(Xs - T * 1.25, Ys - T * 0.6); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#F6FAFC'; c.beginPath(); c.moveTo(Xs - T * 1.5, Ys - T * 2.6); c.quadraticCurveTo(Xs, Ys - T * 3.75, Xs + T * 1.5, Ys - T * 2.6); c.quadraticCurveTo(Xs, Ys - T * 3.35, Xs - T * 1.5, Ys - T * 2.6); c.fill();
      // the bowl, and the ember in it
      const bx = Xs, by = Ys - T * 1.6; c.fillStyle = '#C9A24A'; c.beginPath(); c.ellipse(bx, by, T * 0.45, T * 0.2, 0, 0, Math.PI); c.fill(); c.stroke(); if (n.ember) drawEmber(c, bx, by - T * 0.25, T, 1); c.restore(); }
    function drawEmber(c, x, y, T, k) { glowAt(c, x, y, T * (0.9 + 0.2 * Math.sin(g.t * 6)) * k, WARM, 0.85); c.fillStyle = '#FFE9A8'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 ? 0.12 : 0.28) * T; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
    X.after(1.2, () => { S.intro = false; X.banner('WHITEOUT ASCENT', 'Take the star ember from the bowl: keep it warm all the way to the summit', WARM, 3, true, true); });
    return { S, niches, brazObj,
      update(dt) { if (S.intro) return;
        for (const L of S.lanes) { L.st = laneState(L); L.k += ((L.st === 'blow' ? 1 : 0) - L.k) * Math.min(1, dt * 6); }
        const lane = S.lanes.find(L => Math.abs(me.y - L.y) < 1.1 && L.st === 'blow');
        if (lane && !me.dodge) X.moveEnt(me, lane.dir * 3.2 * dt, 0);
        if (S.carry) { const n = inNiche(me.x, me.y); if (n) { S.warm = Math.min(1, S.warm + dt * 0.45); if (n.i > S.last) { S.last = n.i; X.text(me.x, me.y - 1.5, `Shelter ${n.i + 1}`, WARM, 13); } } else S.warm -= dt * (lane ? 0.2 : 0.075);
          if (S.warm <= 0) { S.carry = false; S.warm = 1; niches[S.last].ember = true; X.flash(0.3, '#FFFFFF'); X.banner('THE EMBER GOES OUT', `It rekindles in shelter ${S.last + 1}`, '#FF9BD2', 2, true); X.sfx.wrong(); } }
        if (S.delivered && !S.open && alive(S.guards[2]) === 0) { S.open = true; barrier.forEach(t => X.setTile(t.tx, t.ty, T_FLOOR)); X.retile(); self.done = true; H.setExit(E.x, E.y, 'To the last shelter'); X.banner('THE ICE BARRIER FALLS', 'Above the final platform, something vast is rising', WARM, 2.6, true, true); } },
      goal() { if (self.done) return 'The way on'; if (S.intro) return 'Whiteout Ascent'; const n = S.carry ? '' : niches.find(q => q.ember); const gl = S.guards.reduce((a, l) => a + alive(l), 0);
        return S.delivered ? `The brazier burns · ${alive(S.guards[2])} guards` : S.carry ? `Carrying the ember · warmth ${Math.round(S.warm * 100)}% · watch the wind lanes` : `The ember waits in shelter ${n ? n.i + 1 : '?'}: take it${gl ? ` · ${gl} monsters` : ''}`; },
      hint() { if (self.done) return null; if (S.carry) { const nxt = niches.find(n => n.i > S.last); return nxt ? nxt.obj : brazObj; } const n = niches.find(q => q.ember); return n ? n.obj : null; },
      drawGround(c) { const T = X.Tz();
        // the wind lanes: still, warning (pulsing outline), blowing (arrows)
        for (const L of S.lanes) { const Y0 = X.sy(L.y - 1.0), Y1 = X.sy(L.y + 1.0); c.save(); if (L.st === 'warn') { c.globalAlpha = 0.5 + 0.4 * Math.sin(g.t * 16); c.strokeStyle = '#FFE9A8'; c.lineWidth = 3; c.setLineDash([10, 8]); c.strokeRect(0, Y0, X.W(), Y1 - Y0); }
          if (L.k > 0.05) { c.globalAlpha = 0.25 * L.k; c.fillStyle = '#FFFFFF'; c.fillRect(0, Y0, X.W(), Y1 - Y0); c.globalAlpha = 0.85 * L.k; c.strokeStyle = '#F4FBFF'; c.lineWidth = 2; const off = (g.t * 4) % 1.4; for (let d = off; d < X.W() / T + 2; d += 1.4) for (const yy of [-0.4, 0.4]) { const Xs = L.dir > 0 ? d * T : X.W() - d * T, Ys = X.sy(L.y + yy); c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs + L.dir * T * 0.6, Ys); c.lineTo(Xs + L.dir * T * 0.42, Ys - T * 0.12); c.moveTo(Xs + L.dir * T * 0.6, Ys); c.lineTo(Xs + L.dir * T * 0.42, Ys + T * 0.12); c.stroke(); } }
          c.restore(); }
        // the barrier of ice over the summit's way out
        if (!S.open) for (const t of barrier) { const Xs = X.sx(t.tx), Ys = X.sy(t.ty); c.save(); c.fillStyle = 'rgba(207,232,244,.85)'; c.strokeStyle = INK; c.lineWidth = 1.5; c.fillRect(Xs, Ys - T * 0.8, T, T * 1.8); c.strokeRect(Xs, Ys - T * 0.8, T, T * 1.8); c.restore(); }
        if (S.carry) { drawEmber(c, X.sx(me.x), X.sy(me.y) - T * 1.15, T, 0.8); petBar(c, X, me, S.warm, S.warm > 0.35 ? WARM : '#FF5C5C', 'WARMTH'); } },
    };
  }
  AUR_STAGES.EMBER = { name: 'Whiteout Ascent', goal: 'Carry the star ember to the summit brazier', how: 'Three shelters climb the summit, each a dark stone arch over a warm gold bowl. Take the star ember from the first bowl and carry it up. Outside a shelter its warmth drains (faster in a blowing wind lane); inside one it refills. Wind lanes cross the path: a dashed outline warns before each one blows; while it blows it shoves you sideways. If the warmth runs out the ember goes back to the last shelter it reached. You can set it down in any bowl to fight. Light the summit brazier and clear its guards: the ice barrier falls.',
    layout: [
      '#########....E....#########',
      '#########.........#########',
      '#########bbbbbbbbb#########',
      '######...............######',
      '######.......Z.......######',
      '######..r.........r..######',
      '######.......r.......######',
      '###.....................###',
      '###.........w...........###',
      '###.....................###',
      '###.....................###',
      '###.........3...........###',
      '###.....................###',
      '###.....q.........q.....###',
      '###.........w...........###',
      '###.......q.............###',
      '###.....................###',
      '###.........2...........###',
      '###.....................###',
      '###.....p.........p.....###',
      '###.........w...........###',
      '###.....................###',
      '###.....................###',
      '###.........1...........###',
      '###.......S.............###',
      '###########################'],
    legend: { 1: {}, 2: {}, 3: {}, Z: {}, E: {}, b: {}, w: {}, p: {}, q: {}, r: {} }, make: makeEmber };
})();
