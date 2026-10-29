/* ---------- Rift 9, the Basilica of the Veiled Eye: its three challenge dungeons ----------
   BAS_STAGES.PILGRIMAGE   The Blind Pilgrimage (stage 1): the outer cloister climbs through three watched walkways. A
                           red eye pylon stands at the head of each, turning among three angles; a pale screen stands on
                           a short rail in front of it. Slide the screen to the stop in front of the eye: its shadow cuts
                           the cone, and you climb inside it to the stair beside the pylon. Being seen calcifies (three
                           stages root you and hurt). The last shadow holds the latch of Eshra's ossuary; its guards (a
                           witness scarab and two leeches) must fall first. Every screen slides back and forth at will.
   BAS_STAGES.CONTAINMENT  The Witness Containment (stage 3): a calcite courtyard with three purification basins (a high
                           rim, two gaps, a closed eye in the floor). Three witness scarabs come out of marked pens one at
                           a time with their escorts; kill each INSIDE an empty basin and its eye's energy closes one of
                           the three eyelid locks over the exit. One killed outside leaves its eye stone: walk over it to
                           pick it up and carry it into an empty basin. Three locks and the escorts dead: the reliquary.
   BAS_STAGES.PROCESSION   The Procession of Stone (stage 7): a straight avenue, one broad screen on a central rail with
                           three stops, three high pylons on the east wall watching successive sections, two latch
                           alcoves in the west wall. At the first two stops the screen waits: hold its handle (stand at
                           the black bar) and the alcove's gate rises for a while; open the latch inside, come back and
                           release the handle, and the screen walks on to the next stop. It never leaves while a latch is
                           closed. Rooted by a gaze, you are set back behind the screen (the root's damage stands). At the
                           last stop the witness scarab of the final arch must fall; then the screen slides into the wall
                           and the arch opens on the sanctuary.
   (the palette BAS, the shared screens, pylons and Calcification live in 20zt2, which loads after this file: every
   BAS.* use is inside make(), which only runs once a stage starts) */
const BAS_STAGES = {};
(() => {
  const TAU = Math.PI * 2, SOUTH = Math.PI / 2;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a || 0, 0, TAU); };
  const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lwOf = T => Math.max(1.3, Math.min(3, T * 0.06));
  function spawnAt(X, type, p, list, aggro) { const q = X.freeSpot(p.x, p.y, 0.5) || p; const m = X.spawnMon(type, q.x, q.y, { pack: 909, rift: true, aggro: !!aggro }); if (aggro) m.aggro = true; X.g.total++; if (list) list.push(m); return m; }
  if (!DunWorld.PROPS.blank) DunWorld.PROPS.blank = () => {};
  const block = (X, tx, ty) => { X.M.props.set(ty * X.M.MW + tx, 'blank'); X.setTile(tx, ty, T_SOLID); };
  const unblock = (X, tx, ty) => { X.M.props.delete(ty * X.M.MW + tx); X.setTile(tx, ty, T_FLOOR); };
  const tilesOf = (M, ch) => (M.marks[ch] || []).map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y }));
  const alive = list => list.filter(m => !m.dead);
  // the pet never stands inside a pylon's foot
  function keepOff(X, me, list, r) { for (const p of list) { const dx = me.x - p.x, dy = me.y - p.y, d = Math.hypot(dx, dy); if (d < r && d > 1e-3) X.moveEnt(me, dx / d * (r - d), dy / d * (r - d), 0); } }

  /* ---- a stone door across a run of tiles (west to east): a black slab with a closed eye and an ochre band; k 0 shut,
     1 sunk into the floor. o.locks: an array of 0..1 (each an eyelid lock over it: 0 an open red eye, 1 sealed) ---- */
  function doorObj(X, H, tiles, o) { o = o || {}; const x0 = Math.min(...tiles.map(t => t.tx)), x1 = Math.max(...tiles.map(t => t.tx)) + 1, ty = tiles[0].ty, D = { k: 0, open: false, tiles, x0, x1, ty, locks: o.locks || null };
    D.obj = H.obj({ x: (x0 + x1) / 2, y: ty + 1.02, kind: 'door', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { const { BLACK, BLACK_HI, BLACK_D, CALCITE_D, CALCITE_HI, OCHRE } = BAS, lw = lwOf(T), w = (x1 - x0) * T, hgt = T * 2.4 * (1 - D.k), L = Xs - w / 2;
      if (hgt < 1) return; c.save(); c.beginPath(); c.rect(L - T, Ys - T * 4, w + T * 2, T * 4 + 2); c.clip();
      const top = Ys - hgt; c.fillStyle = BLACK_D; c.fillRect(L + w, top - T * 0.18, T * 0.22, hgt); const g = c.createLinearGradient(L, 0, L + w, 0); g.addColorStop(0, BLACK_HI); g.addColorStop(0.6, BLACK); g.addColorStop(1, BLACK_D); c.fillStyle = g; c.fillRect(L, top, w, hgt); c.strokeStyle = '#141416'; c.lineWidth = lw; c.strokeRect(L, top, w, hgt);
      c.strokeStyle = CALCITE_D; c.lineWidth = Math.max(1, lw * 0.6); c.strokeRect(L + T * 0.12, top + T * 0.12, w - T * 0.24, hgt - T * 0.24); c.fillStyle = OCHRE; c.fillRect(L + 2, top + hgt * 0.18, w - 4, Math.max(1.5, T * 0.07));
      if (D.locks) { const n = D.locks.length; D.locks.forEach((k, i) => { const x = L + w * (i + 1) / (n + 1), y = top + hgt * 0.55, ew = Math.min(w / (n + 0.6), T * 1.3); c.fillStyle = '#0C0C10'; ell(c, x, y, ew * 0.62, ew * 0.36); c.fill(); BAS.eyeStone(c, x, y, ew, 1 - k, lw, { glow: k < 0.5, col: k >= 1 ? BLACK_HI : CALCITE_D }); if (k >= 1) BAS.closedEye(c, x, y - ew * 0.05, ew * 0.7, CALCITE_HI, Math.max(1.2, lw * 0.8)); }); }
      else BAS.closedEye(c, L + w / 2, top + hgt * 0.45, Math.min(w * 0.5, T * 1.4), CALCITE_HI, Math.max(1.4, lw));
      c.restore(); if (D.k > 0 && D.k < 1) { c.fillStyle = 'rgba(216,209,187,.5)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(L + w * (i + 0.5) / 6, Ys - Math.random() * T * 0.2, T * 0.06, 0, TAU); c.fill(); } } } });
    D.open1 = () => { if (D.open) return; D.open = true; tiles.forEach(t => unblock(X, t.tx, t.ty)); X.retile(); X.shake(5, 0.4); if (X.sfx.crash) X.sfx.crash(); };
    D.tick = dt => { if (D.open) D.k = Math.min(1, D.k + dt * 0.8); };
    tiles.forEach(t => block(X, t.tx, t.ty)); return D; }
  /* ---- a gate across tiles in a side wall (north to south): stone bars that drop into the floor while open ---- */
  function wallGate(X, H, tiles) { const G = { k: 0, open: false, tiles }; tiles.forEach(t => block(X, t.tx, t.ty));
    tiles.forEach(t => H.obj({ x: t.x, y: t.ty + 1.0, kind: 'gate', r: 0.1, h: 2, label: '', draw(c, Xs, Ys, T) { const { BLACK, BLACK_HI, OCHRE, CALCITE_D } = BAS, lw = lwOf(T), hgt = T * 1.9 * (1 - G.k); if (hgt < 1) return;
      for (let i = 0; i < 3; i++) { const yy = Ys - T * (0.2 + i * 0.3); BAS.block(c, Xs, yy, T * 0.22, hgt, T * 0.08, i === 1 ? BLACK_HI : BLACK, lw * 0.8); }
      c.fillStyle = OCHRE; c.fillRect(Xs - T * 0.2, Ys - hgt * 0.75 - T * 0.4, T * 0.4, Math.max(1.5, T * 0.06)); c.fillStyle = CALCITE_D; c.fillRect(Xs - T * 0.2, Ys - hgt * 0.4 - T * 0.4, T * 0.4, Math.max(1, T * 0.04)); } }));
    G.set = on => { if (on === G.open) return; G.open = on; tiles.forEach(t => on ? unblock(X, t.tx, t.ty) : block(X, t.tx, t.ty)); X.retile(); if (X.sfx.crack) X.sfx.crack(); };
    G.tick = dt => { G.k = clamp(G.k + (G.open ? dt : -dt) * 2.2, 0, 1); };
    G.has = (x, y, pad) => tiles.some(t => x > t.tx - pad && x < t.tx + 1 + pad && y > t.ty - pad && y < t.ty + 1 + pad);
    return G; }
  /* ---- a latch: a black post with an ochre lever and a sealed-eye plate; o.open draws it thrown ---- */
  function latchArt(c, Xs, Ys, T, L, t) { const { BLACK, BLACK_HI, OCHRE, OCHRE_HI, CALCITE_HI, RED_HI } = BAS, lw = lwOf(T);
    c.save(); c.fillStyle = 'rgba(20,18,24,.3)'; ell(c, Xs, Ys, T * 0.55, T * 0.2); c.fill();
    BAS.block(c, Xs, Ys, T * 0.5, T * 1.25, T * 0.14, BLACK, lw); BAS.closedEye(c, Xs, Ys - T * 0.75, T * 0.32, L.open ? OCHRE_HI : CALCITE_HI, Math.max(1.2, lw * 0.7));
    const a = L.open ? -0.35 : -Math.PI / 2 - 0.6 + Math.sin(t * 3) * 0.04, px = Xs + T * 0.12, py = Ys - T * 1.05; c.strokeStyle = '#141416'; c.lineWidth = Math.max(3, T * 0.13); c.lineCap = 'round'; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * T * 0.7, py + Math.sin(a) * T * 0.7); c.stroke(); c.strokeStyle = BLACK_HI; c.lineWidth = Math.max(1.5, T * 0.06); c.stroke();
    c.fillStyle = OCHRE; c.beginPath(); c.arc(px + Math.cos(a) * T * 0.7, py + Math.sin(a) * T * 0.7, Math.max(2.5, T * 0.12), 0, TAU); c.fill(); c.strokeStyle = '#141416'; c.lineWidth = 1.5; c.stroke();
    if (!L.open) glowAt(c, Xs, Ys - T * 0.8, T * 0.9, OCHRE_HI, 0.25 + 0.15 * Math.sin(t * 4)); else glowAt(c, Xs, Ys - T * 0.8, T * 0.7, RED_HI, 0.12);
    c.restore(); }

  /* ======================= THE BLIND PILGRIMAGE ======================= */
  // three walkways stacked up the cloister (south to north), each with a pylon at its head and a screen in front of it
  const PIL_LAYOUT = (() => { const W = 23, Hh = 54, g = grid(W, Hh, '#'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    rect(4, 1, 10, 3); g[2][7] = 'E'; for (let x = 6; x <= 8; x++) g[4][x] = 'd';
    for (const top of [5, 19, 33]) { rect(1, top, 21, top + 12); g[top + 1][11] = 'P'; for (const y of [top + 4, top + 8]) { g[y][3] = 'p'; g[y][19] = 'p'; } }
    for (let x = 14; x <= 16; x++) g[18][x] = '.'; for (let x = 6; x <= 8; x++) g[32][x] = '.'; for (let x = 9; x <= 13; x++) g[46][x] = '.';
    rect(6, 47, 16, 51); g[50][11] = 'S';
    // the guards: two leeches and two sentinels at the first screen; a scarab and two leeches at the final crossing
    g[38][5] = 'l'; g[38][17] = 'l'; g[41][8] = 'n'; g[41][14] = 'n';
    g[14][11] = 'w'; g[9][5] = 'k'; g[9][17] = 'k'; g[11][11] = 'L';
    return g.map(r => r.join('')); })();
  const PIL_DOOR = [-1, 1, -1];   // which side of its pylon each walkway's stair leaves by (-1 west, 1 east)
  function makePilgrimage(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { CALCITE_HI, OCHRE_HI, RED_HI, WARN } = BAS, cal = BAS.calcify;
    const E = mk.E[0], door = doorObj(X, H, tilesOf(M, 'd'));
    H.spawnPacks();
    const guardsOf = chs => X.mons.filter(m => !m.dead && chs.includes(m.rmark));
    const final0 = X.mons.filter(m => ['w', 'k'].includes(m.rmark));
    const S = { intro: true, crossed: 0, cast: [false, false, false], latched: false, done: false, guardsDown: false, shadowT: 0 };
    // the walkways, south to north
    const secs = mk.P.slice().sort((a, b) => b.y - a.y).map((p, i) => { const side = -PIL_DOOR[i], ys = p.y + 2;
      const pyl = BAS.pylon(X, H, { x: p.x, y: p.y, angles: [SOUTH, SOUTH - 0.3, SOUTH + 0.3], period: 6.5, len: 10, spread: 0.45, t0: i * 2.1 });
      const scr = BAS.screen(X, H, { a: side > 0 ? 0 : Math.PI, len: 4, stops: [[p.x + side * 6, ys], [p.x, ys]], i0: 0, label: 'SLIDE THE SCREEN' });
      const sec = { i, p, pyl, scr, side, good: 1, top: p.y - 1.5, door: { x: p.x + PIL_DOOR[i] * 4.5, y: p.y - 1.5 } };
      scr.onArrive = s => { if (s.i === sec.good) { if (!S.cast[i]) { S.cast[i] = true; X.banner('THE EYE IS BLINDED', i < 2 ? 'Its cone is cut by the screen\'s shadow: climb inside the shadow to the stair' : 'Climb inside the shadow: the latch of the ossuary waits in it', CALCITE_HI, 2.4, true); if (X.sfx.chime) X.sfx.chime(); } else X.text(s.x, s.y - 2.2, 'The shadow falls again', CALCITE_HI, 13); } else X.text(s.x, s.y - 2.2, 'Slid aside', CALCITE_HI, 12); };
      return sec; });
    const latchP = mk.L[0], latch = { x: latchP.x, y: latchP.y, open: false };
    const guardsLeft = () => alive(final0).length;
    latch.obj = H.obj({ x: latch.x, y: latch.y + 0.2, kind: 'latch', r: 0.55, h: 1.6, label: () => latch.open ? '' : guardsLeft() ? 'GUARDED' : 'OPEN THE LATCH', draw(c, Xs, Ys, T) { latchArt(c, Xs, Ys, T, latch, g.t); },
      use() { if (latch.open) return; if (guardsLeft()) { X.text(latch.x, latch.y - 1.8, 'Its guards still watch: defeat them first', WARN, 13); return; } win(); } });
    function win() { latch.open = true; S.done = true; self.done = true; door.open1(); H.setExit(E.x, E.y, 'To Eshra\'s Ossuary'); X.banner('THE OSSUARY OPENS', 'The latch in the last shadow is thrown: the bone door sinks', CALCITE_HI, 2.8, true, true); if (X.sfx.fanfare) X.sfx.fanfare(); X.boom(latch.x, latch.y - 0.8, 1.4, CALCITE_HI, OCHRE_HI, { n: 18, shake: 5 }); }
    X.after(1.2, () => { S.intro = false; X.banner('THE BLIND PILGRIMAGE', 'The red eyes calcify what they see. Slide each pale screen in front of its eye, and climb inside its shadow', CALCITE_HI, 3.8, true, true); });
    const cur = () => secs[Math.min(2, S.crossed)];
    return { S, secs, latch, door,
      cam() { return { x: me.x, y: me.y - 1.2, k: 0, zoom: 0.68 }; },
      update(dt) { door.tick(dt); keepOff(X, me, secs.map(s => s.pyl), 1.1); if (S.intro || S.done) return;
        // a walkway is crossed once the pet stands north of its pylon (in the stair beside it)
        while (S.crossed < 2 && me.y < secs[S.crossed].top) { S.crossed++; X.banner(`CROSSING ${S.crossed} OF 3`, S.crossed === 1 ? 'The next eye watches the walkway above: find its screen' : 'The last walkway: its guards, and the latch of the ossuary', CALCITE_HI, 2.2, true); }
        if (!S.guardsDown && S.crossed >= 2 && !guardsLeft()) { S.guardsDown = true; X.banner('THE LAST CROSSING IS CLEAR', 'Open the latch in the last shadow', CALCITE_HI, 2.2, true); }
        const sc = cur(); if (sc.scr.i === sc.good && BAS.inShadow(me.x, me.y, sc.pyl.src) && BAS.inCone(me.x, me.y, sc.pyl.src)) S.shadowT += dt; },
      goal() { if (S.done) return 'To Eshra\'s Ossuary'; if (S.intro) return 'The Blind Pilgrimage'; const sc = cur(), n = `Crossing ${sc.i + 1}/3`, seen = cal.seen ? ' · SEEN: get into shadow' : '';
        if (sc.scr.moving) return `${n} · the screen slides…`;
        if (sc.scr.i !== sc.good) return `${n} · slide the screen in front of the red eye (stand at its black handle)${seen}`;
        if (sc.i < 2) return `${n} · climb inside its shadow to the ${PIL_DOOR[sc.i] < 0 ? 'west' : 'east'} stair beside the eye${seen}`;
        if (guardsLeft()) return `${n} · ${guardsLeft()} guards: defeat the witness scarab and its leeches${seen}`;
        return `${n} · open the latch inside the last shadow${seen}`; },
      hint() { if (S.done) return null; const sc = cur(); if (sc.scr.moving) return null; if (sc.scr.i !== sc.good) return sc.scr.handle; if (sc.i < 2) return { x: sc.door.x, y: sc.door.y, h: 0.5, label: 'THE STAIR' }; if (guardsLeft()) return null; return latch.obj; },
      drawGround(c) { const T = X.Tz(), t = g.t, sc = cur(); if (S.done) return;
        // where the screen of this walkway must stand: a dashed sheet at its stop in front of the eye
        if (!sc.scr.moving && sc.scr.i !== sc.good) { const [gx, gy] = sc.scr.stops[sc.good], e0 = [gx - sc.scr.len / 2, gy], e1 = [gx + sc.scr.len / 2, gy]; c.save(); c.setLineDash([T * 0.3, T * 0.2]); c.lineDashOffset = -t * T; c.strokeStyle = 'rgba(240,235,219,.85)'; c.lineWidth = 3; c.beginPath(); c.moveTo(X.sx(e0[0]), X.sy(e0[1])); c.lineTo(X.sx(e1[0]), X.sy(e1[1])); c.lineTo(X.sx(e1[0]), X.sy(e1[1]) - T * 1.4); c.lineTo(X.sx(e0[0]), X.sy(e0[1]) - T * 1.4); c.closePath(); c.stroke(); c.restore(); label(c, 'SLIDE IT HERE: IT BLINDS THE EYE', X.sx(gx), X.sy(gy) + T * 0.75, T * 0.24, CALCITE_HI); }
        // the stair beside the pylon, once its screen is in place
        if (sc.i < 2 && sc.scr.i === sc.good && !sc.scr.moving) { const Xs = X.sx(sc.door.x), Ys = X.sy(sc.door.y); c.save(); c.strokeStyle = 'rgba(240,235,219,.6)'; c.lineWidth = 2; c.setLineDash([T * 0.2, T * 0.2]); ell(c, Xs, Ys, T * 1.2, T * 0.45); c.stroke(); c.restore(); }
        if (!latch.open) glowAt(c, X.sx(latch.x), X.sy(latch.y), T * 1.2, OCHRE_HI, 0.15 + 0.08 * Math.sin(t * 3)); },
    };
  }
  BAS_STAGES.PILGRIMAGE = { name: 'The Blind Pilgrimage', goal: 'Cross the watched cloister in the screens\' shadows', how: 'Three walkways climb the outer cloister, each watched by a red eye pylon at its head. A pylon turns among three angles (a dim dashed cone shows the next one a second before it turns); anything in its cone that is not in shadow is SEEN, and being seen builds Calcification: three stages root you in stone and hurt (20% of your health), then let go. Out of the cone the stages crumble away. In front of each pylon a pale screen stands on a short black rail: stand at its black handle a moment and it slides to its other stop. Slide it in front of the eye: its shadow (the dark double-bordered wedge with a closed eye) cuts the cone, and you climb inside it to the stair beside the pylon. Leeches and sentinels guard the first screen; a witness scarab (its own slow cone) and two leeches guard the last crossing, whose shadow holds the latch of Eshra\'s ossuary. Every screen slides back as easily: nothing is lost.',
    layout: PIL_LAYOUT, legend: { E: {}, d: {}, P: {}, L: {}, p: { prop: 'narrowpillar' }, l: { mons: ['calciteleech'] }, n: { mons: ['brokensentinel'] }, w: { mons: ['witnessscarab'] }, k: { mons: ['calciteleech'] } }, make: makePilgrimage };

  /* ======================= THE WITNESS CONTAINMENT ======================= */
  const BASIN_RIM = [2.5, 3.5], BASIN_IN = 2.35;
  const CON_LAYOUT = (() => { const W = 31, Hh = 38, g = grid(W, Hh, '#'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    rect(11, 1, 19, 3); g[2][15] = 'E'; for (let x = 13; x <= 17; x++) g[4][x] = 'd';
    rect(1, 5, 29, 35);
    // the basins: a ring of high rim (blank props: drawn by the stage) with a gap east and west, the closed eye at the heart
    for (const [bx, by] of [[7, 14], [23, 14], [15, 25]]) { for (let y = by - 4; y <= by + 4; y++) for (let x = bx - 4; x <= bx + 4; x++) { const d = Math.hypot(x - bx, y - by); if (d >= BASIN_RIM[0] && d < BASIN_RIM[1] && !(Math.abs(y - by) <= 1)) g[y][x] = 'r'; } g[by][bx] = 'B'; }
    g[32][3] = 'q'; g[32][27] = 'q'; g[34][15] = 'q'; g[19][15] = 'S';
    // the colonnade round the court
    for (const y of [8, 20, 30]) { g[y][1] = 'p'; g[y][29] = 'p'; }
    return g.map(r => r.join('')); })();
  function makeContainment(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { CALCITE, CALCITE_HI, CALCITE_D, OCHRE, OCHRE_D, OCHRE_HI, RED, RED_HI, BLACK, BLACK_HI, WARN } = BAS;
    const E = mk.E[0], locks = [0, 0, 0], door = doorObj(X, H, tilesOf(M, 'd'), { locks });
    const basins = mk.B.slice().sort((a, b) => a.y - b.y || a.x - b.x).map((p, i) => ({ i, x: p.x, y: p.y, pure: false, flash: 0, k: 0 }));
    const pens = mk.q.slice().sort((a, b) => a.x - b.x || a.y - b.y).map((p, i) => ({ i, x: p.x, y: p.y, open: false, k: 0 }));
    // (pen 1 the west, pen 2 the east, pen 3 the south: released in that order)
    const order = [pens.find(p => p.x < 10), pens.find(p => p.x > 20), pens.find(p => p.x >= 10 && p.x <= 20)].filter(Boolean);
    const S = { intro: true, released: 0, nextT: 3.5, scarab: null, group: [], stones: [], carry: null, pure: 0, done: false, outside: 0, inside: 0, placed: 0, beams: [] };
    // the rims, one block per tile: drawn as objects so they sort in depth with the pet and the scarabs
    for (const [k, kind] of M.props) { if (kind !== 'blank') continue; const tx = k % M.MW, ty = (k / M.MW) | 0; const b = basins.find(q => Math.hypot(tx + 0.5 - q.x, ty + 0.5 - q.y) < 4); if (!b) continue;
      H.obj({ x: tx + 0.5, y: ty + 0.95, kind: 'rim', r: 0.1, h: 1.4, label: '', draw(c, Xs, Ys, T) { const lw = lwOf(T), col = b.pure ? CALCITE_HI : CALCITE; BAS.block(c, Xs, Ys, T * 1.0, T * 1.05, T * 0.22, col, lw, { joints: 2 }); c.fillStyle = 'rgba(161,142,101,.8)'; c.fillRect(Xs - T * 0.5 + 1, Ys - T * 0.72, T - 2, Math.max(1.5, T * 0.07)); if (b.pure) glowAt(c, Xs, Ys - T * 0.9, T * 0.5, CALCITE_HI, 0.18); } }); }
    function release() { const pen = order[S.released]; if (!pen) return; S.released++; pen.open = true; const grp = [];
      const sc = spawnAt(X, 'witnessscarab', pen, grp, true); S.scarab = sc; sc.bname = `Witness ${S.released}`;
      for (const sd of [-1, 1]) spawnAt(X, 'calciteleech', { x: pen.x + sd * 1.8, y: pen.y - 0.8 }, grp, false);
      if (S.released === 3) spawnAt(X, 'brokensentinel', { x: pen.x, y: pen.y - 2.2 }, grp, true);
      S.group.push(...grp); X.ring(pen.x, pen.y, 0.3, 2.2, 0.5, RED_HI, 0.45); X.shake(4, 0.3);
      X.banner(`WITNESS ${S.released} OF 3`, S.released === 3 ? 'The last witness comes with a sentinel: lure it into an empty basin and kill it there' : 'A witness scarab leaves its pen: lure it into an empty basin and kill it there', RED_HI, 2.6, true); }
    function purify(b, x, y, how) { b.pure = true; b.flash = 1; const li = S.pure; S.pure++; locks[li] = 0.001; S.beams.push({ x0: b.x, y0: b.y, x1: (door.x0 + door.x1) / 2 + (li - 1) * ((door.x1 - door.x0) / 4), y1: door.ty + 0.2, t: 0, li });
      X.boom(b.x, b.y - 0.4, 2.0, RED_HI, CALCITE_HI, { n: 26, shake: 7 }); X.ring(b.x, b.y, 0.3, BASIN_IN + 0.6, 0.6, CALCITE_HI, 0.6); if (X.sfx.fanfare) X.sfx.fanfare();
      X.banner(`BASIN ${S.pure} OF 3 PURIFIED`, how === 'stone' ? 'The eye stone sinks into the basin: its energy closes one lock' : 'The witness dies contained: its eye\'s energy closes one lock', CALCITE_HI, 2.4, true); }
    function dropStone(x, y) { const q = X.freeSpot(x, y, 0.4) || { x, y }; const st = { x: q.x, y: q.y, t: 0 }; S.stones.push(st); S.outside++;
      X.text(q.x, q.y - 1.6, 'Its eye stone falls', RED_HI, 15); X.banner('KILLED OUTSIDE THE BASINS', 'Its eye stone lies where it fell: walk over it, carry it into an empty basin', OCHRE_HI, 2.6, true); }
    function win() { S.done = true; self.done = true; door.open1(); H.setExit(E.x, E.y, 'To the Reliquary'); X.banner('THE LOCKS RETRACT', 'Three eyes sealed: the way to Thessarym\'s reliquary opens', CALCITE_HI, 3, true, true); if (X.sfx.fanfare) X.sfx.fanfare(); }
    X.after(1.2, () => { S.intro = false; X.banner('THE WITNESS CONTAINMENT', 'Kill each witness scarab INSIDE an empty basin: its contained eye closes one of the three locks', CALCITE_HI, 3.8, true, true); });
    const emptyBasins = () => basins.filter(b => !b.pure);
    const nearestEmpty = (x, y) => { let best = null, bd = 1e9; for (const b of emptyBasins()) { const d = Math.hypot(x - b.x, y - b.y); if (d < bd) { bd = d; best = b; } } return best; };
    return { S, basins, pens, locks, door,
      cam() { return { x: me.x, y: me.y - 0.8, k: 0, zoom: 0.66 }; },
      update(dt) { door.tick(dt); for (const b of basins) { b.flash = Math.max(0, b.flash - dt); if (b.pure) b.k = Math.min(1, b.k + dt); } for (let i = 0; i < 3; i++) if (locks[i] > 0) locks[i] = Math.min(1, locks[i] + dt * 1.2);
        for (const p of pens) if (p.open) p.k = Math.min(1, p.k + dt * 1.5); for (const bm of S.beams) bm.t += dt; S.beams = S.beams.filter(bm => bm.t < 1.4);
        if (S.intro || S.done) return;
        // the witness falls: inside an empty basin it purifies it; anywhere else it leaves its eye stone
        const sc = S.scarab; if (sc && sc.dead && !sc._judged) { sc._judged = true; const b = basins.find(q => Math.hypot(sc.x - q.x, sc.y - q.y) < BASIN_IN);
          if (b && !b.pure) { S.inside++; purify(b, sc.x, sc.y, 'kill'); } else { if (b) X.text(b.x, b.y - 2, 'This basin is already pure', CALCITE_HI, 13); dropStone(sc.x, sc.y); } S.nextT = 3; }
        if (S.released < 3 && (!S.scarab || S.scarab._judged) && !alive(S.group).length) { S.nextT -= dt; if (S.nextT <= 0) release(); }
        // the eye stones: walk over one to take it; carried into an empty basin it purifies it
        for (const st of S.stones) st.t += dt;
        if (!S.carry && !me.dead) { const st = S.stones.find(q => Math.hypot(me.x - q.x, me.y - q.y) < 1.0); if (st) { S.stones.splice(S.stones.indexOf(st), 1); S.carry = st; X.text(me.x, me.y - 2, 'An eye stone: to an empty basin!', OCHRE_HI, 14); if (X.sfx.chime) X.sfx.chime(); } }
        if (S.carry && !me.dead) { const b = emptyBasins().find(q => Math.hypot(me.x - q.x, me.y - q.y) < BASIN_IN - 0.3); if (b) { S.carry = null; S.placed++; purify(b, b.x, b.y, 'stone'); } }
        S.group = S.group.filter(m => !m.dead || m === S.scarab);
        if (S.pure >= 3 && S.released >= 3 && !alive(S.group).length && !S.carry && !S.stones.length) win(); },
      goal() { if (S.done) return 'To the Reliquary'; if (S.intro) return 'The Witness Containment'; const L = `Locks ${S.pure}/3`;
        if (S.carry) return `${L} · carry the eye stone into an empty basin`;
        if (S.stones.length) return `${L} · a witness fell outside: pick up its eye stone`;
        if (S.scarab && !S.scarab.dead) return `${L} · lure witness ${S.released}/3 into an empty basin and kill it there`;
        const n = alive(S.group).length; if (n) return S.released < 3 ? `${L} · defeat its escort (${n} left) to open the next pen` : `${L} · defeat the last ${n} of its escort`;
        if (S.released < 3) return `${L} · the next witness is coming from its pen`;
        return L; },
      hint() { if (S.done) return null; if (S.carry) { const b = nearestEmpty(me.x, me.y); return b ? { x: b.x, y: b.y + 0.5, h: 0.6, label: 'EMPTY BASIN' } : null; } if (S.stones.length) return { x: S.stones[0].x, y: S.stones[0].y, h: 1.2, label: 'EYE STONE' };
        if (S.scarab && !S.scarab.dead) { const b = nearestEmpty(S.scarab.x, S.scarab.y); if (b && Math.hypot(me.x - b.x, me.y - b.y) > BASIN_IN) return { x: b.x, y: b.y + 0.5, h: 0.6, label: 'LURE IT HERE' }; } return null; },
      drawGround(c) { const T = X.Tz(), t = g.t, lw = lwOf(T);
        // the basins' floors: a sunk disc of ochre with the closed eye in calcite; purified, it is pale and quiet
        for (const b of basins) { const Xs = X.sx(b.x), Ys = X.sy(b.y), R = T * 2.55; c.save(); ell(c, Xs, Ys, R, R * 0.92); c.fillStyle = b.pure ? '#E8E2CF' : OCHRE_D; c.fill(); c.strokeStyle = '#141416'; c.lineWidth = lw; c.stroke();
          ell(c, Xs, Ys, R * 0.78, R * 0.72); c.fillStyle = b.pure ? CALCITE_HI : shadeC(OCHRE, -0.25); c.fill();
          c.strokeStyle = b.pure ? CALCITE_D : 'rgba(240,235,219,.5)'; c.lineWidth = Math.max(1, lw * 0.6); ell(c, Xs, Ys, R * 0.5, R * 0.46); c.stroke();
          BAS.closedEye(c, Xs, Ys - T * 0.25, T * 1.6, b.pure ? BLACK_HI : CALCITE_HI, Math.max(1.6, lw * 1.2));
          if (!b.pure) { const near = S.scarab && !S.scarab.dead && Math.hypot(S.scarab.x - b.x, S.scarab.y - b.y) < BASIN_IN; if (near || S.carry) { c.strokeStyle = near ? WARN : OCHRE_HI; c.lineWidth = 3; c.setLineDash([T * 0.3, T * 0.22]); c.lineDashOffset = -t * T; ell(c, Xs, Ys, R * 0.95, R * 0.87); c.stroke(); c.setLineDash([]); } }
          if (b.flash > 0) glowAt(c, Xs, Ys, R * 1.6, RED_HI, b.flash * 0.7); if (b.pure) glowAt(c, Xs, Ys, R * 0.9, CALCITE_HI, 0.18 + 0.06 * Math.sin(t * 2));
          c.restore(); label(c, b.pure ? 'PURIFIED' : S.scarab && !S.scarab.dead && Math.hypot(S.scarab.x - b.x, S.scarab.y - b.y) < BASIN_IN ? 'KILL IT HERE!' : 'EMPTY BASIN', Xs, Ys + R * 0.5, T * 0.26, b.pure ? CALCITE_HI : OCHRE_HI); }
        // the pens: a black stone stall with three bars that drop when its witness is let out
        order.forEach((p, i) => { const Xs = X.sx(p.x), Ys = X.sy(p.y), w = T * 2.4; c.save(); c.fillStyle = 'rgba(20,18,24,.45)'; c.fillRect(Xs - w / 2, Ys - T * 0.6, w, T * 1.2); c.strokeStyle = RED; c.lineWidth = 2; c.setLineDash([T * 0.25, T * 0.18]); c.strokeRect(Xs - w / 2, Ys - T * 0.6, w, T * 1.2); c.setLineDash([]);
          const hgt = T * 1.6 * (1 - p.k); if (hgt > 1) for (let k = 0; k < 4; k++) { const xx = Xs - w / 2 + w * (k + 0.5) / 4; c.fillStyle = BLACK; c.fillRect(xx - T * 0.08, Ys - T * 0.5 - hgt, T * 0.16, hgt); c.strokeStyle = '#141416'; c.lineWidth = 1.5; c.strokeRect(xx - T * 0.08, Ys - T * 0.5 - hgt, T * 0.16, hgt); }
          c.restore(); label(c, p.open ? `PEN ${i + 1} · OPEN` : `PEN ${i + 1}`, Xs, Ys + T * 1.05, T * 0.24, p.open ? CALCITE_D : RED_HI); });
        // the contained energy rising from a basin to its lock
        for (const bm of S.beams) { const u = Math.min(1, bm.t / 0.6), a = 1 - Math.max(0, bm.t - 0.8) / 0.6, x0 = X.sx(bm.x0), y0 = X.sy(bm.y0) - T, x1 = X.sx(bm.x1), y1 = X.sy(bm.y1) - T * 1.2; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(224,138,126,${0.75 * a})`; c.lineWidth = T * 0.22; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - T * 3, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u); c.stroke(); c.restore(); }
        // the eye stones lying where their witnesses fell
        for (const st of S.stones) { const Xs = X.sx(st.x), Ys = X.sy(st.y), bob = Math.sin(st.t * 3) * T * 0.08; c.save(); c.fillStyle = 'rgba(20,18,24,.3)'; ell(c, Xs, Ys, T * 0.5, T * 0.18); c.fill(); glowAt(c, Xs, Ys - T * 0.6 + bob, T * 1.1, RED_HI, 0.55); BAS.eyeStone(c, Xs, Ys - T * 0.6 + bob, T * 0.9, 0.7, lw, { glow: true }); c.restore(); label(c, 'EYE STONE', Xs, Ys + T * 0.6, T * 0.24, OCHRE_HI); } },
      drawOver(c) { if (!S.carry || me.dead) return; const T = X.Tz(), Xs = X.sx(me.x), Ys = X.sy(me.y) - T * 2.3 + Math.sin(g.t * 3) * T * 0.08; glowAt(c, Xs, Ys, T * 1.1, RED_HI, 0.6); BAS.eyeStone(c, Xs, Ys, T * 0.8, 0.7, lwOf(T), { glow: true }); },
    };
  }
  BAS_STAGES.CONTAINMENT = { name: 'The Witness Containment', goal: 'Contain the three witnesses in the basins', how: 'Three purification basins stand in the calcite courtyard: a high pale rim with a gap east and west, a closed eye in the floor. Three witness scarabs come out of the marked pens one at a time, each with two calcite leeches (and a broken sentinel with the last); the next pen opens once a witness and its escort are down. Lure the witness into an EMPTY basin (it follows you, slowly, keeping a little distance; its narrow cone turns to find you: stay out of it or you calcify) and kill it there: its contained eye\'s energy closes one of the three eyelid locks over the way on. A witness killed outside the basins drops its eye stone: walk over it to pick it up, and carry it into an empty basin instead. Close all three locks and defeat the escorts, and the locks retract.',
    layout: CON_LAYOUT, legend: { E: {}, d: {}, B: {}, q: {}, r: { prop: 'blank' }, p: { prop: 'narrowpillar' } }, make: makeContainment };

  /* ======================= THE PROCESSION OF STONE ======================= */
  const PRO_LAYOUT = (() => { const W = 21, Hh = 64, g = grid(W, Hh, '#'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    rect(6, 1, 14, 3); g[2][10] = 'E'; for (let y = 4; y <= 5; y++) for (let x = 8; x <= 12; x++) g[y][x] = 'a';
    rect(4, 6, 16, 61); g[59][10] = 'S';
    g[50][10] = '0'; g[32][10] = '1'; g[14][10] = '2';
    // the high pylons stand against the east wall, a little north of the stop they watch
    g[44][16] = 'P'; g[26][16] = 'P'; g[8][16] = 'P';
    // the latch alcoves in the west wall, just behind the first two stops (in the screen's lee)
    for (const [y0, ch] of [[51, 'g'], [33, 'h']]) { rect(0, y0 - 1, 2, y0 + 2); g[y0][3] = ch; g[y0 + 1][3] = ch; g[y0 + 1][1] = 'L'; }
    // two leeches block the first stop; a sentinel and two leeches the second; a witness scarab the final arch
    g[46][7] = 'l'; g[46][13] = 'l'; g[27][10] = 'n'; g[28][6] = 'k'; g[28][14] = 'k'; g[9][10] = 'w';
    // the colonnade
    for (const y of [12, 20, 38, 56]) { g[y][3] = 'p'; g[y][17] = 'p'; }
    return g.map(r => r.join('')); })();
  const PRO_HOLD = 20, PRO_STEP = 3;
  function makeProcession(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { CALCITE_HI, CALCITE_D, OCHRE_HI, RED_HI, WARN } = BAS, cal = BAS.calcify;
    const E = mk.E[0], arch = doorObj(X, H, tilesOf(M, 'a'));
    H.spawnPacks();
    const scarab0 = X.mons.filter(m => m.rmark === 'w');
    const stopsY = ['0', '1', '2'].map(ch => mk[ch][0].y), cx = mk['0'][0].x;
    // the rail: a stop every three tiles from the first stop to the last; the essential stops are the three marked ones
    const rail = []; for (let y = stopsY[0]; y >= stopsY[2] - 0.01; y -= PRO_STEP) rail.push([cx, y]); const major = stopsY.map(y => rail.findIndex(p => Math.abs(p[1] - y) < 0.01));
    const scr = BAS.screen(X, H, { a: Math.PI, len: 7, stops: rail, i0: 0, label: 'HOLD THE HANDLE' });
    scr.locked = true;
    const pylons = mk.P.slice().sort((a, b) => b.y - a.y).map((p, i) => BAS.pylon(X, H, { x: p.x, y: p.y, angles: [2.0, 1.7, 2.35], period: 6, len: 11, spread: 0.42, t0: i * 1.7 }));
    const gates = [wallGate(X, H, tilesOf(M, 'g')), wallGate(X, H, tilesOf(M, 'h'))];
    const latches = mk.L.slice().sort((a, b) => b.y - a.y).map((p, i) => { const L = { i, x: p.x, y: p.y, open: false }; L.obj = H.obj({ x: p.x, y: p.y + 0.2, kind: 'latch', r: 0.55, h: 1.6, label: () => L.open ? '' : 'OPEN THE LATCH', draw(c, Xs, Ys, T) { latchArt(c, Xs, Ys, T, L, g.t); }, use() { openLatch(L); } }); return L; });
    const S = { intro: true, stop: 0, held: false, holdT: 0, advancing: false, parked: false, parking: false, done: false, returns: 0, last: [rail[0][0], rail[0][1]] };
    function openLatch(L) { if (L.open) return; L.open = true; X.boom(L.x, L.y - 0.8, 1.2, OCHRE_HI, CALCITE_HI, { n: 14, shake: 4 }); if (X.sfx.fanfare) X.sfx.fanfare(); X.banner(`LATCH ${L.i + 1} OF 2 OPEN`, 'Go back to the screen and release its handle: it moves on to the next stop', OCHRE_HI, 2.6, true); }
    // the handle: at a stop whose latch is shut it HOLDS the screen (the alcove gate rises while it is held); with the
    // latch open it RELEASES it and the screen walks on
    scr.handle.label = () => scr.moving || S.advancing || S.parking || S.done ? '' : S.stop >= 2 ? '' : latches[S.stop].open ? 'RELEASE THE HANDLE' : S.held ? `HELD · ${Math.ceil(S.holdT)}s` : 'HOLD THE HANDLE';
    scr.handle.use = () => { if (scr.moving || S.advancing || S.parking || S.done || S.intro) return; const k = S.stop;
      if (k >= 2) { X.text(scr.x, scr.y - 2, 'The screen waits for the witness to fall', CALCITE_HI, 13); return; }
      if (!latches[k].open) { const was = S.held; S.held = true; S.holdT = PRO_HOLD; gates[k].set(true); if (!was) X.banner('THE SCREEN IS HELD', `Its weight lifts the alcove gate for ${PRO_HOLD} s: open the latch inside, then come back and release the handle`, CALCITE_HI, 2.8, true); else X.text(scr.x, scr.y - 2, 'Held again', CALCITE_HI, 13); return; }
      S.held = false; advance(k + 1); };
    function advance(to) { S.advancing = true; S.to = to; scr.locked = false; X.banner('THE PROCESSION MOVES', 'Walk behind the screen: keep inside its shadow', CALCITE_HI, 2.0, true); scr.goTo(scr.i + 1); }
    scr.onArrive = s => { S.last = [s.x, s.y]; if (S.parking) { S.parking = false; S.parked = true; win(); return; }
      if (!S.advancing) return; if (s.i < major[S.to]) { s.goTo(s.i + 1); return; }
      S.advancing = false; S.stop = S.to; scr.locked = true;
      if (S.stop < 2) X.banner(`STOP ${S.stop + 1} OF 3`, 'The screen waits: hold its handle, and open the latch of the alcove', CALCITE_HI, 2.4, true);
      else if (alive(scarab0).length) X.banner('THE FINAL ARCH', 'A witness scarab guards the arch: defeat it, and the screen takes its place in the wall', RED_HI, 2.6, true);
      else park(); };
    function park() { if (S.parking || S.parked) return; S.parking = true; scr.locked = false; scr.stops.push([cx + 7, stopsY[2]]); scr.goTo(scr.stops.length - 1); X.banner('THE SCREEN TAKES ITS PLACE', 'It slides into the sanctuary wall: the arch opens', CALCITE_HI, 2.4, true); }
    function win() { S.done = true; self.done = true; arch.open1(); for (const p of pylons) { p.blind = true; p.open = 0; BAS.unsource(X, p.src); p.hold = true; p.tick = () => {}; } H.setExit(E.x, E.y, 'To the Sanctuary'); X.banner('THE PROCESSION IS ENDED', 'The eyes of the avenue go blind: the sanctuary of the Veiled Eye lies open', CALCITE_HI, 3, true, true); if (X.sfx.fanfare) X.sfx.fanfare(); }
    // a failed gaze: the pet is set back behind the screen where it last stood (the root's damage stands)
    cal.onRoot = () => { const x = S.last[0] - 0.8, y = S.last[1] + 2.2, q = X.freeSpot(x, y, 0.45) || { x, y }; cal.rx = q.x; cal.ry = q.y; me.x = q.x; me.y = q.y; S.returns++; X.after(0.05, () => X.text(q.x, q.y - 1.6, 'Set back behind the screen', CALCITE_HI, 14)); };
    X.after(1.2, () => { S.intro = false; X.banner('THE PROCESSION OF STONE', 'Advance inside the moving shelter. At each stop hold the screen\'s handle and open the alcove latch', CALCITE_HI, 3.8, true, true); });
    const inAlcove = k => { const L = latches[k]; return Math.abs(me.x - L.x) < 2.2 && Math.abs(me.y - L.y) < 2.6; };
    return { S, scr, pylons, gates, latches, arch, major, rail,
      cam() { return { x: me.x * 0.75 + scr.x * 0.25, y: me.y * 0.75 + scr.y * 0.25 - 0.8, k: 0, zoom: 0.68 }; },
      update(dt) { arch.tick(dt); for (const G of gates) G.tick(dt); keepOff(X, me, pylons, 1.1); if (S.intro || S.done) return;
        if (S.held) { S.holdT -= dt; const k = S.stop; if (latches[k].open) S.holdT = Math.max(S.holdT, 1);
          if (S.holdT <= 0 && !inAlcove(k) && !gates[k].has(me.x, me.y, 0.6)) { S.held = false; gates[k].set(false); X.text(scr.x, scr.y - 2, 'The handle slips: the alcove shuts', WARN, 14); } }
        // the screen at the final arch: the witness falls and it parks in the wall
        if (!S.parking && !S.parked && S.stop === 2 && !S.advancing && !alive(scarab0).length) park(); },
      goal() { if (S.done) return 'To the Sanctuary'; if (S.intro) return 'The Procession of Stone'; const seen = cal.seen ? ' · SEEN: back into the shadow' : '';
        if (S.parking) return 'The screen takes its place in the wall';
        if (S.advancing) return `The screen moves to stop ${S.to + 1}/3 · follow inside its shadow${seen}`;
        const k = S.stop, n = `Stop ${k + 1}/3`;
        if (k >= 2) return `${n} · the final arch · defeat the witness scarab${seen}`;
        if (latches[k].open) return `${n} · latch open · release the screen's handle${seen}`;
        if (S.held) return `${n} · the screen is held (${Math.ceil(S.holdT)} s) · open the latch in the west alcove${seen}`;
        return `${n} · hold the screen's handle (the black bar) so the alcove opens${seen}`; },
      hint() { if (S.done || S.parking) return null; if (S.advancing) return { x: scr.x - 0.8, y: scr.y + 2.2, h: 0.4, label: 'FOLLOW' }; const k = S.stop; if (k >= 2) return null;
        if (!latches[k].open && S.held) return latches[k].obj; return scr.handle; },
      drawGround(c) { const T = X.Tz(), t = g.t;
        // the sanctuary's great sealed eye, seen beyond the final arch
        BAS.wallEye(c, X, { x: E.x, y: E.y - 1.2, w: 5, open: S.done ? 0 : 0.08 + 0.04 * Math.sin(t * 0.8) });
        // the essential stops along the rail, each with its number
        major.forEach((ri, i) => { const [x, y] = rail[ri], Xs = X.sx(x), Ys = X.sy(y); label(c, `STOP ${i + 1}`, Xs + T * 4.3, Ys + T * 0.35, T * 0.24, i === S.stop ? OCHRE_HI : CALCITE_D); });
        // the hold: a taut chain from the handle to the alcove gate while the screen is held
        if (S.held && S.stop < 2) { const G = gates[S.stop], h = scr.handle, gx = G.tiles[0].x + 0.4, gy = G.tiles[0].y + 0.5; c.save(); c.strokeStyle = 'rgba(240,235,219,.55)'; c.lineWidth = 2; c.setLineDash([T * 0.18, T * 0.14]); c.lineDashOffset = -t * T * 0.6; c.beginPath(); c.moveTo(X.sx(h.x), X.sy(h.y) - T * 0.7); c.lineTo(X.sx(gx), X.sy(gy) - T * 0.7); c.stroke(); c.restore();
          const Xs = X.sx(h.x), Ys = X.sy(h.y) - T * 0.7, u = clamp(S.holdT / PRO_HOLD, 0, 1); c.save(); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 5; c.beginPath(); c.arc(Xs, Ys - T * 0.8, T * 0.32, 0, TAU); c.stroke(); c.strokeStyle = u < 0.25 ? WARN : CALCITE_HI; c.lineWidth = 3; c.beginPath(); c.arc(Xs, Ys - T * 0.8, T * 0.32, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.restore(); } },
    };
  }
  BAS_STAGES.PROCESSION = { name: 'The Procession of Stone', goal: 'Advance inside the moving shelter', how: `A straight ritual avenue climbs to the sanctuary. One broad pale screen stands on the central rail; three high eye pylons on the east wall watch successive sections of it (a dashed cone shows a pylon's next angle a second before it turns). At the first two stops the screen waits: stand at its handle (the black bar at its west end) to HOLD it, and its weight lifts the gate of the alcove in the west wall for ${PRO_HOLD} seconds. Open the latch inside, come back and stand at the handle again to RELEASE it: the screen walks on, a stop at a time, and you walk in its shadow. It never leaves while a latch is shut. Calcified to the root by a gaze, you are set back behind the screen (and hurt). Leeches block the first stop, a sentinel and two leeches the second: fight from shelter, or wait for a pylon's announced turn before you flank. At the final arch a witness scarab waits: defeat it, and the screen slides into the sanctuary wall.`,
    layout: PRO_LAYOUT, legend: { E: {}, a: {}, P: {}, L: {}, g: {}, h: {}, 0: {}, 1: {}, 2: {}, p: { prop: 'narrowpillar' }, l: { mons: ['calciteleech'] }, n: { mons: ['brokensentinel'] }, k: { mons: ['calciteleech'] }, w: { mons: ['witnessscarab'] } }, make: makeProcession };
})();
