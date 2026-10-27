/* ---------- Rift 10, the Sea of Fallen Colours: its three challenge dungeons ----------
   COL_STAGES.HORDE       The Painted Horde: the grey shore's husks come in three waves, each painted a colour (red,
                          then blue, then all three). Step into a font of colour to take its colour: your blows only bite
                          on monsters of your own colour (others shrug them off). Swap fonts as the waves change.
   COL_STAGES.LENSES      The Three Lenses: prism rays fire their beams at you. Stand so a crystal LENS is between you and
                          a ray: the lens catches the beam (the telegraph stops at it) and charges. Two catches light a
                          lens; light all three and the reef opens.
   COL_STAGES.COLOURFALL  The Colourfall: the fallen colour rains into the deep on shown circles (each leaves a stain that
                          slows) while true colours wash up for a few seconds at a time: catch twelve before they fade.
   (the palette COL and the brood live in 20zo; these make() functions only run once a stage starts) */
const COL_STAGES = {};
(() => {
  const TAU = Math.PI * 2, P = () => COL;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const ell = (c, x, y, rx, ry) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); };
  const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
  function spawnAt(X, type, p, list, aggro) { const q = X.freeSpot(p.x, p.y, 0.45) || p; const m = X.spawnMon(type, q.x, q.y, { pack: 930, rift: true, aggro: !!aggro }); X.g.total++; if (list) list.push(m); return m; }
  if (!DunWorld.PROPS.blank) DunWorld.PROPS.blank = () => {};
  const block = (X, tx, ty) => { X.M.props.set(ty * X.M.MW + tx, 'blank'); X.setTile(tx, ty, T_SOLID); };
  const unblock = (X, tx, ty) => { X.M.props.delete(ty * X.M.MW + tx); X.setTile(tx, ty, T_FLOOR); };
  const tilesOf = (M, ch) => (M.marks[ch] || []).map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y }));
  function topBar(c, X, y, frac, col, txt) { const W = X.W(), x0 = 18, w = W - 36, h = 14; c.save(); c.fillStyle = 'rgba(16,18,32,.8)'; GFX.rr(c, x0 - 3, y - 3, w + 6, h + 6, 9); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; GFX.rr(c, x0, y, w, h, 7); c.fill(); c.fillStyle = col; GFX.rr(c, x0, y, Math.max(h, w * Math.max(0, Math.min(1, frac))), h, 7); c.fill(); c.restore(); label(c, txt, W / 2, y + h + 17, 13, '#FFFFFF'); }
  // a gate of glass: two panes that slide apart, a light for each lock
  function glassGate(c, X, dx0, dx1, dy, k, lit, n, cols) { const T = X.Tz(), X0 = X.sx(dx0), X1 = X.sx(dx1), Y0 = X.sy(dy) - T * 1.5, Y1 = X.sy(dy + 1), w = (X1 - X0) / 2, sh = k * w, { INK, GLASS, GLASS_D } = P();
    c.save(); c.beginPath(); c.rect(X0, Y0 - 6, X1 - X0, Y1 - Y0 + 12); c.clip();
    for (const sd of [-1, 1]) { const lx = sd < 0 ? X0 - sh : X0 + w + sh, gr = c.createLinearGradient(lx, 0, lx + w, 0); gr.addColorStop(0, '#F2FFFF'); gr.addColorStop(1, GLASS_D); c.globalAlpha = 0.92; c.fillStyle = gr; c.fillRect(lx, Y0, w, Y1 - Y0); c.globalAlpha = 1; c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(lx, Y0, w, Y1 - Y0); c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(lx + w * 0.25, Y1 - 4); c.lineTo(lx + w * 0.5, Y0 + 4); c.stroke(); }
    c.restore();
    if (k < 0.6) for (let i = 0; i < n; i++) { const x = X0 + (X1 - X0) * (i + 1) / (n + 1), y = Y0 + (Y1 - Y0) * 0.45, on = i < lit, col = cols ? cols[i] : '#FFFFFF'; glowAt(c, x, y, T * 0.65, col, (on ? 0.85 : 0.15) * (1 - k)); c.fillStyle = on ? col : 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x, y, T * 0.16, 0, TAU); c.fill(); } }

  /* ======================= THE PAINTED HORDE ======================= */
  const HOR_LAYOUT = (() => { const W = 30, Hh = 34, g = grid(W, Hh, '~');
    for (let x = 12; x <= 16; x++) g[3][x] = '.';
    for (let y = 4; y <= 6; y++) for (let x = 0; x < W; x++) g[y][x] = x >= 12 && x <= 16 ? (y === 6 ? 'd' : '.') : '#';
    for (let y = 7; y <= 31; y++) for (let x = 1; x < W - 1; x++) g[y][x] = '.';
    for (let y = 7; y <= 31; y++) { g[y][0] = '#'; g[y][W - 1] = '#'; } g[32].fill('#'); g[4][14] = 'E';
    g[11][4] = 'R'; g[11][25] = 'B'; g[26][14] = 'Y'; g[20][14] = 'S';
    [[2, 8], [27, 8], [2, 30], [27, 30], [14, 8], [2, 19], [27, 19]].forEach(([x, y]) => { g[y][x] = 'g'; });
    return g.map(r => r.join('')); })();
  const HOR_WAVES = [{ n: 40, tints: ['R'] }, { n: 45, tints: ['B'] }, { n: 60, tints: ['R', 'Y', 'B'] }], HOR_CAP = 28, MISMATCH = 0.3;
  function makeHorde(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, C = P(), TINT = { R: C.R, Y: C.Y, B: C.B }, NAME = { R: 'RED', Y: 'YELLOW', B: 'BLUE' };
    const E = mk.E[0], door = tilesOf(M, 'd'); door.forEach(t => block(X, t.tx, t.ty));
    const dx0 = Math.min(...door.map(t => t.tx)), dx1 = Math.max(...door.map(t => t.tx)) + 1, dy = door[0].ty;
    const fonts = ['R', 'Y', 'B'].map(k => ({ k, x: mk[k][0].x, y: mk[k][0].y, pulse: 0 }));
    const S = { intro: true, wave: -1, waveT: 4, poured: 0, mobs: [], spawnT: 0, paint: null, open: false, openK: 0, done: false, swaps: 0 };
    const guard = q => (q.tint && q.tint !== S.paint ? MISMATCH : 1);
    X.after(1.2, () => { S.intro = false; X.banner('THE PAINTED HORDE', 'Step into a font to take its colour: your blows only bite on monsters of YOUR colour', '#FFFFFF', 3.6, true, true); });
    function startWave() { S.wave++; S.poured = 0; S.spawnT = 0.4; const W = HOR_WAVES[S.wave]; X.banner(`WAVE ${S.wave + 1} OF 3`, W.tints.length > 1 ? 'Every colour at once: swap fonts to match them' : `${W.n} painted ${NAME[W.tints[0]]}: take the ${NAME[W.tints[0]]} font`, W.tints.length > 1 ? '#FFFFFF' : TINT[W.tints[0]], 2.6, true); X.shake(5, 0.4); }
    function spawnOne() { const W = HOR_WAVES[S.wave], p = mk.g[Math.floor(Math.random() * mk.g.length)], k = W.tints[Math.floor(Math.random() * W.tints.length)];
      const m = spawnAt(X, 'greyling', { x: p.x + (Math.random() - 0.5) * 2, y: p.y + (Math.random() - 0.5) * 2 }, S.mobs, true); S.poured++;
      m.tint = k; m.color = TINT[k]; m.guardFn = guard; X.ring(m.x, m.y, 0.2, 1.3, 0.3, TINT[k], 0.4); }
    function win() { S.done = true; self.done = true; door.forEach(t => unblock(X, t.tx, t.ty)); X.retile(); S.open = true; H.setExit(E.x, E.y, 'To the Bleached Cove'); X.banner('THE SHORE IS PAINTED', 'The colour of the horde runs back into the sand: the way on opens', '#FFFFFF', 2.8, true, true); X.sfx.fanfare && X.sfx.fanfare(); X.shake(6, 0.5); }
    fonts.forEach(f => H.obj({ x: f.x, y: f.y + 0.3, kind: 'font', r: 0.1, h: 2, label: '', draw(c, Xs, Ys, T) { const t = g.t, col = TINT[f.k], on = S.paint === f.k, W = S.wave >= 0 ? HOR_WAVES[S.wave] : null, want = W && W.tints.includes(f.k);
      c.save(); c.fillStyle = 'rgba(14,16,30,.3)'; ell(c, Xs, Ys, T * 1.1, T * 0.4); c.fill();
      // a basin of grey stone brimming with one colour, a fountain of it rising
      ell(c, Xs, Ys - T * 0.15, T * 0.95, T * 0.38); c.fillStyle = '#8E8E98'; c.fill(); c.strokeStyle = '#1C1A26'; c.lineWidth = 2; c.stroke();
      ell(c, Xs, Ys - T * 0.22, T * 0.75, T * 0.27); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; c.stroke();
      glowAt(c, Xs, Ys - T * 0.9, T * (1.2 + (want ? 0.3 * Math.sin(t * 5) : 0)), col, want ? 0.7 : 0.4);
      for (let i = 0; i < 5; i++) { const u = ((t * 0.8 + i / 5) % 1), x = Xs + Math.sin(i * 2.3 + t) * T * 0.25, y = Ys - T * (0.3 + u * 1.4); c.globalAlpha = 1 - u; c.fillStyle = col; c.beginPath(); c.arc(x, y, T * 0.1 * (1 - u * 0.5), 0, TAU); c.fill(); } c.globalAlpha = 1;
      if (on) { c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.setLineDash([7, 6]); c.lineDashOffset = -t * 20; ell(c, Xs, Ys, T * 1.25, T * 0.48); c.stroke(); }
      c.restore(); label(c, on ? `YOU ARE ${NAME[f.k]}` : `${NAME[f.k]} FONT`, Xs, Ys + T * 0.85, T * 0.26, want && !on ? '#FFFFFF' : col); } }));
    return { S, fonts,
      cam() { return { x: me.x, y: me.y - 0.6, k: 0, zoom: 0.7 }; },
      update(dt) { if (S.intro) return; if (S.open) S.openK = Math.min(1, S.openK + dt * 0.8); if (S.done) return;
        for (const f of fonts) if (Math.hypot(me.x - f.x, me.y - f.y) < 1.3 && S.paint !== f.k) { S.paint = f.k; S.swaps++; X.text(f.x, f.y - 2, `${NAME[f.k]}!`, TINT[f.k], 16); X.ring(me.x, me.y, 0.2, 1.6, 0.35, TINT[f.k], 0.5); X.sfx.coin && X.sfx.coin(); }
        S.mobs = S.mobs.filter(m => !m.dead);
        if (S.wave < 0 || (S.poured >= HOR_WAVES[S.wave].n && !S.mobs.length)) { if (S.wave >= HOR_WAVES.length - 1) { win(); return; } S.waveT -= dt; if (S.waveT <= 0) { S.waveT = 3.5; startWave(); } return; }
        S.spawnT -= dt; if (S.poured < HOR_WAVES[S.wave].n && S.spawnT <= 0 && S.mobs.length < HOR_CAP) { S.spawnT = 0.22; spawnOne(); } },
      goal() { if (self.done) return 'To the Bleached Cove'; if (S.intro) return 'The Painted Horde'; if (S.wave < 0) return 'Take a colour from a font'; const left = HOR_WAVES[S.wave].n - S.poured + S.mobs.length; return `Wave ${S.wave + 1}/3 · ${left} left · you are ${S.paint ? NAME[S.paint] : 'GREY'}`; },
      hint() { if (self.done || S.wave < 0) return null; const W = HOR_WAVES[S.wave]; if (W.tints.length === 1 && S.paint !== W.tints[0]) return fonts.find(f => f.k === W.tints[0]); return null; },
      drawGround(c) { const T = X.Tz(), t = g.t;
        // a ring of its colour under each painted monster; yours glow
        for (const m of S.mobs) { if (m.dead || !m.tint) continue; const mine = m.tint === S.paint, Xs = X.sx(m.x), Ys = X.sy(m.y); c.save(); c.strokeStyle = TINT[m.tint]; c.lineWidth = mine ? 3 : 2; c.globalAlpha = mine ? 0.9 : 0.5; ell(c, Xs, Ys + T * 0.15, T * (m.r + 0.25), T * (m.r + 0.25) * 0.4); c.stroke(); c.restore(); }
        if (S.paint) { const Xs = X.sx(me.x), Ys = X.sy(me.y); glowAt(c, Xs, Ys, T * 1.1, TINT[S.paint], 0.45); c.save(); c.strokeStyle = TINT[S.paint]; c.lineWidth = 3; ell(c, Xs, Ys + T * 0.15, T * 0.75, T * 0.3); c.stroke(); c.restore(); }
        glassGate(c, X, dx0, dx1, dy, S.openK, Math.max(0, S.wave + (S.done ? 1 : 0)), 3, [TINT.R, TINT.B, '#FFFFFF']); },
      drawOver(c) { if (S.intro || self.done || S.wave < 0) return; const W = HOR_WAVES[S.wave], left = W.n - S.poured + S.mobs.length; topBar(c, X, 128, 1 - left / W.n, W.tints.length > 1 ? '#FFFFFF' : TINT[W.tints[0]], `Wave ${S.wave + 1}/3 · ${left} left · you are ${S.paint ? NAME[S.paint] : 'GREY: take a font'}`); },
    };
  }
  COL_STAGES.HORDE = { name: 'The Painted Horde', goal: 'Hold the shore', how: `The grey shore's husks come in three waves, painted: the first RED, the second BLUE, the third every colour at once. Three fonts of colour (red, yellow, blue) stand on the beach: step into one to take its colour. Your blows only bite on monsters of YOUR colour (the rest shrug them off, at ${Math.round(MISMATCH * 100)}%). A coloured ring under each monster shows its colour; yours glow. Swap fonts as the waves change.`,
    layout: HOR_LAYOUT, legend: { E: {}, d: {}, R: {}, Y: {}, B: {}, g: {} }, make: makeHorde };

  /* ======================= THE THREE LENSES ======================= */
  // a stage-only prism ray: the same glass manta, but its beam asks the stage where it would be caught (a lens)
  let LENS_HOOK = null;
  Object.assign(MON, { lensray: Object.assign({}, MON.prismray || { name: 'Prism ray', from: 999, hp: 260, spd: 1.5, r: 0.5, dmg: 18, xp: 17, coin: 1.0, color: '#C8EEF4', fly: true, kit: [] }, { bio: [], tip: 'A manta of glass. Its beam is caught by a crystal lens between you and it: the telegraph stops at the lens.' }) });
  DunArt.MP.lensray = (c, r, ph, o) => DunArt.MP.prismray(c, r, ph, o); DunArt.EXT.lensray = 3.4; DunArt.NF.lensray = 6;
  DunAI.mon.lensray = (m, A, X) => {
    if (m.aimT > 0) { m.aimT -= A.dt; m.mode = 'block'; if (m.aimT <= 0) { m.mode = null; m.cd = 2.4 + Math.random() * 1.2; } return; }
    m.mode = null; DunAI.keepRange(m, A, X, 4, 7);
    if (m.cd <= 0 && A.d < 8.5) { m.aimT = 1.1; const a = A.a, full = 9, hit = LENS_HOOK ? LENS_HOOK.clip(m.x, m.y, a, full) : null, L = hit ? hit.d : full;
      X.warn({ shape: 'line', x: m.x, y: m.y, a, len: L, w: 0.7, life: 1.1, max: 1.1, src: m, color: hit ? '#FFFFFF' : '#FFE37A', fn: () => { if (hit && LENS_HOOK) LENS_HOOK.caught(hit.lens, m); else if (X.inLine(m.x, m.y, a, L, 0.7) && !X.me.dodge) X.hurtPet(m.dmg * 1.2, m); } }); } };
  const LEN_LAYOUT = (() => { const W = 32, Hh = 34, g = grid(W, Hh, '~');
    for (let x = 13; x <= 17; x++) g[3][x] = '.';
    for (let y = 4; y <= 6; y++) for (let x = 0; x < W; x++) g[y][x] = x >= 13 && x <= 17 ? (y === 6 ? 'd' : '.') : '#';
    for (let y = 7; y <= 31; y++) for (let x = 0; x < W; x++) { const dx = (x - 15.5) / 15.5, dy = (y - 19) / 13; if (dx * dx + dy * dy < 1.0) g[y][x] = '.'; }
    for (let x = 12; x <= 18; x++) g[7][x] = '.';
    g[4][15] = 'E'; g[13][8] = 'L'; g[13][23] = 'L'; g[24][15] = 'L'; g[29][15] = 'S';
    [[4, 19], [27, 19], [15, 9], [8, 27], [23, 27]].forEach(([x, y]) => { g[y][x] = 'g'; });
    return g.map(r => r.join('')); })();
  const LENS_R = 1.1, LENS_NEED = 2;
  function makeLenses(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, C = P(), HUE = C.HUE;
    const E = mk.E[0], door = tilesOf(M, 'd'); door.forEach(t => block(X, t.tx, t.ty));
    const dx0 = Math.min(...door.map(t => t.tx)), dx1 = Math.max(...door.map(t => t.tx)) + 1, dy = door[0].ty;
    const lenses = mk.L.slice().sort((a, b) => a.y - b.y || a.x - b.x).map((p, i) => ({ i, x: p.x, y: p.y, n: 0, lit: false, flash: 0, col: [C.R, C.B, C.Y][i] }));
    lenses.forEach(l => block(X, Math.floor(l.x), Math.floor(l.y)));
    const S = { intro: true, rays: [], mobs: [], spawnT: 1, mobT: 9, litN: 0, open: false, openK: 0, caught: 0, done: false };
    // a beam from (x, y) along a: the first lens it would meet (centre within LENS_R of the line, ahead of the ray)
    LENS_HOOK = { clip(x, y, a, L) { let best = null; for (const l of lenses) { if (l.lit) continue; const rx = l.x - x, ry = l.y - y, al = rx * Math.cos(a) + ry * Math.sin(a), of = Math.abs(-rx * Math.sin(a) + ry * Math.cos(a)); if (al > 0.4 && al < L && of < LENS_R && (!best || al < best.d)) best = { lens: l, d: al }; } return best; },
      caught(l, m) { if (self.done || l.lit) return; l.n++; l.flash = 1; S.caught++; X.ring(l.x, l.y, 0.3, 2.0, 0.4, '#FFFFFF', 0.5); X.text(l.x, l.y - 2.6, l.n >= LENS_NEED ? 'LIT!' : `${l.n}/${LENS_NEED}`, l.col, 16);
        if (l.n >= LENS_NEED) { l.lit = true; S.litN++; X.boom(l.x, l.y - 1.2, 1.6, l.col, '#FFFFFF', { n: 22, shake: 6 }); X.sfx.fanfare && X.sfx.fanfare(); if (S.litN >= lenses.length) win(); else X.banner(`LENS ${S.litN} OF 3 LIT`, 'Its light runs to the gate', l.col, 2.0, true); } } };
    function win() { S.done = true; self.done = true; LENS_HOOK = null; door.forEach(t => unblock(X, t.tx, t.ty)); X.retile(); S.open = true; H.setExit(E.x, E.y, 'To the Glass Shallows'); X.banner('THE THREE LENSES BURN', 'Their light opens the reef', '#FFFFFF', 2.8, true, true); X.shake(6, 0.5); for (const m of [...S.rays, ...S.mobs]) if (!m.dead) X.killMon(m); }
    X.after(1.2, () => { S.intro = false; X.banner('THE THREE LENSES', 'Stand so a LENS is between you and a prism ray: the lens catches its beam. Two catches light a lens', '#FFFFFF', 3.8, true, true); });
    lenses.forEach(l => H.obj({ x: l.x, y: l.y + 0.3, kind: 'lens', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { const t = g.t, k = l.lit ? 1 : l.n / LENS_NEED;
      c.save(); c.fillStyle = 'rgba(14,16,30,.3)'; ell(c, Xs, Ys, T * 0.9, T * 0.32); c.fill();
      c.strokeStyle = '#1C1A26'; c.lineWidth = T * 0.16 + 3; c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs, Ys - T * 1.1); c.stroke(); c.strokeStyle = '#B8DCE4'; c.lineWidth = T * 0.16; c.stroke();
      const cy = Ys - T * 2.0; glowAt(c, Xs, cy, T * (1.6 + k), l.lit ? l.col : '#FFFFFF', 0.3 + k * 0.4 + l.flash * 0.4);
      ell(c, Xs, cy, T * LENS_R * 0.95, T * LENS_R * 0.95); const gr = c.createRadialGradient(Xs - T * 0.3, cy - T * 0.3, T * 0.1, Xs, cy, T * LENS_R); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.6, l.lit ? l.col : '#C8EEF4'); gr.addColorStop(1, l.lit ? l.col : '#7FB8C8'); c.globalAlpha = 0.85; c.fillStyle = gr; c.fill(); c.globalAlpha = 1;
      c.strokeStyle = '#E8C46A'; c.lineWidth = 4; c.stroke(); c.strokeStyle = '#1C1A26'; c.lineWidth = 1.5; c.stroke();
      for (let i = 0; i < LENS_NEED; i++) { const a = -Math.PI / 2 + (i - (LENS_NEED - 1) / 2) * 0.5; c.fillStyle = i < l.n || l.lit ? l.col : 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(Xs + Math.cos(a) * T * 1.25, cy + Math.sin(a) * T * 1.25, T * 0.12, 0, TAU); c.fill(); c.strokeStyle = '#1C1A26'; c.lineWidth = 1.5; c.stroke(); }
      c.restore(); } }));
    return { S, lenses, get hook() { return LENS_HOOK; },
      cam() { return { x: me.x, y: me.y - 0.5, k: 0, zoom: 0.68 }; },
      update(dt) { if (S.intro) return; for (const l of lenses) if (l.flash > 0) l.flash -= dt * 1.5; if (S.open) S.openK = Math.min(1, S.openK + dt * 0.8); if (self.done) return;
        S.rays = S.rays.filter(m => !m.dead); S.mobs = S.mobs.filter(m => !m.dead);
        S.spawnT -= dt; if (S.spawnT <= 0 && S.rays.length < 3) { S.spawnT = 2.6; const p = mk.g[Math.floor(Math.random() * mk.g.length)]; const m = spawnAt(X, 'lensray', p, S.rays, true); m.cd = 1.5; }
        S.mobT -= dt; if (S.mobT <= 0) { S.mobT = 12; if (S.mobs.length < 3) { const p = mk.g[Math.floor(Math.random() * mk.g.length)]; spawnAt(X, Math.random() < 0.5 ? 'huewisp' : 'shardback', p, S.mobs, true); } } },
      goal() { if (self.done) return 'To the Glass Shallows'; if (S.intro) return 'The Three Lenses'; return `Lenses lit ${S.litN}/3 · put a lens between you and a prism ray`; },
      hint() { if (self.done) return null; let best = null, bd = 1e9; for (const l of lenses) { if (l.lit) continue; const d = Math.hypot(me.x - l.x, me.y - l.y); if (d < bd) { bd = d; best = l; } } return best && bd > 5 ? { x: best.x, y: best.y + 1.5 } : null; },
      drawGround(c) { const T = X.Tz(), t = g.t;
        // behind each unlit lens, where to stand against the nearest ray: a soft ghost spot and a dotted line through the lens
        for (const l of lenses) { if (l.lit) continue; let ray = null, rd = 1e9; for (const m of S.rays) { if (m.dead) continue; const d = Math.hypot(m.x - l.x, m.y - l.y); if (d < rd) { rd = d; ray = m; } } if (!ray) continue;
          const a = Math.atan2(l.y - ray.y, l.x - ray.x), sx = l.x + Math.cos(a) * 2.2, sy = l.y + Math.sin(a) * 2.2, Xs = X.sx(sx), Ys = X.sy(sy), on = Math.hypot(me.x - sx, me.y - sy) < 1.2;
          c.save(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.setLineDash([4, 8]); c.lineDashOffset = -t * 18; c.beginPath(); c.moveTo(X.sx(ray.x), X.sy(ray.y)); c.lineTo(Xs, Ys); c.stroke(); c.setLineDash([]);
          c.fillStyle = on ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.14)'; c.strokeStyle = on ? '#FFFFFF' : 'rgba(255,255,255,.55)'; c.lineWidth = 2.5; ell(c, Xs, Ys, T * 0.8, T * 0.32); c.fill(); c.stroke(); c.restore();
          if (!on) label(c, 'STAND HERE', Xs, Ys + T * 0.75, T * 0.24, '#FFFFFF'); }
        glassGate(c, X, dx0, dx1, dy, S.openK, S.litN, 3, lenses.map(l => l.col)); },
    };
  }
  COL_STAGES.LENSES = { name: 'The Three Lenses', goal: 'Light the three lenses', how: `Prism rays drift over the reef and fire their beams at you along a shown line. Three crystal lenses stand on the sand: put a lens between you and a ray (a soft spot behind each lens shows where to stand against the nearest ray) and the lens catches the beam: the line stops at the lens and you are safe. ${LENS_NEED} catches light a lens; light all three and the reef opens. A beam that misses the lenses hits you: dodge it.`,
    layout: LEN_LAYOUT, legend: { E: {}, d: {}, L: {}, g: {} }, make: makeLenses };

  /* ======================= THE COLOURFALL ======================= */
  const CF_LAYOUT = (() => { const W = 34, Hh = 38, g = grid(W, Hh, '~'), cx = 17.5, cy = 21.5, R = 12;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 1.05) < R) g[y][x] = '.';
    for (let y = 2; y <= 5; y++) for (let x = 13; x <= 21; x++) g[y][x] = '.'; g[3][17] = 'E'; g[22][17] = 'O'; g[30][17] = 'S';
    return g.map(r => r.join('')); })();
  const CF_NEED = 12;
  function makeColourfall(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, C = P(), HUE = C.HUE, O = mk.O[0], E = mk.E[0];
    const floor = []; for (let ty = 0; ty < M.MH; ty++) for (let tx = 0; tx < M.MW; tx++) { if (X.tileAt(tx, ty) !== T_FLOOR) continue; const x = tx + 0.5, y = ty + 0.5; if (y < 9) continue; if (Math.hypot(x - O.x, (y - O.y) * 1.05) < 10.6) floor.push({ x, y }); }
    const S = { intro: true, got: 0, orbs: [], orbT: 2, metT: 3, mobs: [], mobT: 4, done: false, missed: 0, petals: [], stains: 0 };
    X.after(1.2, () => { S.intro = false; X.banner('THE COLOURFALL', 'The fallen colour rains on shown circles: dodge it. Catch the TRUE colours before they fade', '#FFFFFF', 3.6, true, true); });
    function spot(minD, maxD) { const list = floor.filter(p => { const d = Math.hypot(p.x - me.x, p.y - me.y); return d > minD && d < maxD && !S.orbs.some(o => Math.hypot(o.x - p.x, o.y - p.y) < 2.5); }); return list[Math.floor(Math.random() * list.length)] || floor[0]; }
    function newOrb() { const p = spot(3.5, 8.5), life = Math.max(5.5, 8.5 - S.got * 0.25); S.orbs.push({ x: p.x, y: p.y, t: 0, life, col: HUE[S.got % 6] }); }
    function meteor() { const near = Math.random() < 0.55, p = near ? { x: me.x + (Math.random() - 0.5) * 3, y: me.y + (Math.random() - 0.5) * 3 } : spot(1, 9), r = 1.5 + Math.random() * 0.6;
      X.warn({ x: p.x, y: p.y, r, life: 1.3, max: 1.3, color: C.UNSEEN, fn: () => { if (Math.hypot(me.x - p.x, me.y - p.y) < r + me.r * 0.5 && !me.dodge) X.hurtPet(X.ST().hp * 0.1, null); X.boom(p.x, p.y, r, C.UNSEEN, C.UNSEEN2, { n: 16, shake: 4 }); X.zone({ kind: 'stall', x: p.x, y: p.y, r: r * 0.9, life: 3, max: 3, own: 'enemy' }); S.stains++; } }); }
    function win() { S.done = true; self.done = true; for (let y = E.ty + 1; y < M.MH; y++) { if (X.tileAt(E.tx, y) === T_FLOOR && y > E.ty + 3) break; if (X.tileAt(E.tx, y) !== T_FLOOR) for (let dx = -1; dx <= 1; dx++) X.setTile(E.tx + dx, y, T_BRIDGE); } X.retile(); H.setExit(E.x, E.y, 'To the Starlit Floor');
      X.banner('THE TRUE COLOURS', 'Twelve caught: a bridge of light rises out of the deep', '#FFFFFF', 3, true, true); X.sfx.fanfare && X.sfx.fanfare(); X.shake(6, 0.5); for (const m of S.mobs) if (!m.dead) X.killMon(m); S.orbs = []; }
    return { S,
      cam() { return { x: me.x * 0.7 + O.x * 0.3, y: me.y * 0.7 + O.y * 0.3, k: 0, zoom: 0.66 }; },
      update(dt) { if (S.intro || S.done) return;
        for (const o of S.orbs) { o.t += dt; if (Math.hypot(me.x - o.x, me.y - o.y) < 1.1 && !o.got) { o.got = true; S.got++; S.petals.push({ col: o.col, t: 0 }); X.text(o.x, o.y - 1.6, `A true colour! ${S.got}/${CF_NEED}`, o.col, 15); X.ring(o.x, o.y, 0.2, 1.6, 0.35, o.col, 0.5); X.sfx.coin && X.sfx.coin(); if (S.got >= CF_NEED) { win(); return; } } }
        S.orbs = S.orbs.filter(o => { if (o.got) return false; if (o.t >= o.life) { S.missed++; X.ring(o.x, o.y, 0.2, 1.2, 0.3, '#888888', 0.3); return false; } return true; });
        S.orbT -= dt; const maxOrbs = S.got < 6 ? 1 : 2; if (S.orbT <= 0 && S.orbs.length < maxOrbs) { S.orbT = 1.2; newOrb(); }
        S.metT -= dt; if (S.metT <= 0) { S.metT = Math.max(0.55, 1.4 - S.got * 0.07); meteor(); }
        S.mobs = S.mobs.filter(m => !m.dead); S.mobT -= dt; if (S.mobT <= 0) { S.mobT = 7; if (S.mobs.length < 4) { const p = spot(6, 11); spawnAt(X, Math.random() < 0.6 ? 'chromawraith' : 'huewisp', p, S.mobs, true); } }
        for (const p of S.petals) p.t += dt; },
      goal() { if (self.done) return 'To the Starlit Floor'; if (S.intro) return 'The Colourfall'; return `True colours ${S.got}/${CF_NEED} · catch them before they fade`; },
      hint() { if (self.done) return null; let best = null, bd = 1e9; for (const o of S.orbs) { const d = Math.hypot(me.x - o.x, me.y - o.y); if (d < bd) { bd = d; best = o; } } return best && bd > 5 ? best : null; },
      drawGround(c) { const T = X.Tz(), t = g.t;
        // the sigil in the middle: a ring of twelve petals that fill with the true colours caught
        const Xs = X.sx(O.x), Ys = X.sy(O.y); c.save(); for (let i = 0; i < CF_NEED; i++) { const a = -Math.PI / 2 + i / CF_NEED * TAU, p = S.petals[i], x = Xs + Math.cos(a) * T * 2.2, y = Ys + Math.sin(a) * T * 2.2 * 0.55;
          c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.scale(1, 0.55); c.beginPath(); c.ellipse(0, 0, T * 0.32, T * 0.7, 0, 0, TAU); c.fillStyle = p ? p.col : 'rgba(255,255,255,.08)'; c.globalAlpha = p ? Math.min(1, p.t * 3) * 0.85 : 1; c.fill(); c.globalAlpha = 1; c.strokeStyle = p ? '#FFFFFF' : 'rgba(255,255,255,.3)'; c.lineWidth = 1.5; c.stroke(); c.restore(); }
        if (S.got) glowAt(c, Xs, Ys, T * (1.5 + S.got * 0.12), '#FFFFFF', 0.15 + S.got * 0.03); c.restore();
        // the true colours washed up: a soft orb of one hue, a ring closing as it fades
        for (const o of S.orbs) { const ox = X.sx(o.x), oy = X.sy(o.y), u = o.t / o.life, bob = Math.sin(t * 4 + o.x) * T * 0.08;
          c.save(); c.strokeStyle = o.col; c.lineWidth = 3; c.globalAlpha = 0.8; ell(c, ox, oy, T * 1.0 * (1 - u * 0.7), T * 0.4 * (1 - u * 0.7)); c.stroke(); c.restore();
          glowAt(c, ox, oy - T * 0.8 + bob, T * 1.3, o.col, 0.65); c.save(); c.fillStyle = o.col; c.beginPath(); c.arc(ox, oy - T * 0.8 + bob, T * 0.32, 0, TAU); c.fill(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; c.stroke(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(ox - T * 0.1, oy - T * 0.9 + bob, T * 0.09, 0, TAU); c.fill(); c.restore();
          if (u > 0.65) label(c, 'FADING!', ox, oy + T * 0.75, T * 0.24, o.col); } },
      drawOver(c) { if (S.intro || self.done) return; topBar(c, X, 128, S.got / CF_NEED, '#FFFFFF', `True colours ${S.got}/${CF_NEED}`); },
    };
  }
  COL_STAGES.COLOURFALL = { name: 'The Colourfall', goal: 'Catch the true colours', how: `At the bottom of the stellar sea the fallen colour rains down on shown circles (it hurts, and the stain it leaves slows you for a while). Meanwhile the TRUE colours wash up one at a time (two at once later): a soft orb of one hue with a closing ring round it. Walk into it before the ring closes. Catch ${CF_NEED} and a bridge of light rises out of the deep. Chroma wraiths and hue wisps come for you as you go.`,
    layout: CF_LAYOUT, legend: { E: {}, O: {} }, make: makeColourfall };
})();
