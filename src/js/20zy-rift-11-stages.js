/* ---------- Rift 11, the Choir Before Creation: its three challenge dungeons ----------
   CHO_STAGES.SCORE        The Silent Score (stage 1): through a corridor between two giant bone horns onto a round
                           rehearsal floor. Four broad drum pads stand round a suspended stone tablet that shows the
                           current three-symbol order (the current step lit, the played ones gold). Step on the pads in
                           that order. Three bell mites guard the tablet; once the first phrase is played and they are
                           down, the tablet turns to a second phrase guarded by two pipe eels and a hush moth: now each
                           note RESTS a moment (a dashed ring, WAIT) and then SHINES for two seconds (a countdown border
                           round the pad): step on it (or stand on it) while it shines. A missed shine simply rests and
                           shines again. A wrong note resets only the current phrase. The moth settles on a pad and
                           hushes it until hit (the priority target: a tether, HUSHED, the pointer). Both phrases played
                           and their guards down: the horn-shaped gate opens to Tammor's drum chamber.
   CHO_STAGES.BREATHWORKS  The Breathworks (stage 4): a pipe gallery. A great bellows pumps coral light packets into a
                           manifold; from it three bone conduits run north to three horn receivers (each with a pressure
                           gauge and a symbol). The waste drain beside the manifold is open (every packet vents into it),
                           the west and east conduits each pass a sliding shutter that sends air either on to the horn
                           or out of a side drain, and the centre conduit is blocked by hush-silk with a hush moth nested
                           in it. Close the waste drain (its lever), slide both shutters to their horns, drive the moth
                           out (hit it) and clear the blockage: packets reach all three horns, which store pressure (a
                           full gauge stays full). Wrong states only vent, and every control flips freely. Two eels and
                           three mites hold the gallery; at two-thirds pressure two more mites make for the shutters (one
                           that reaches its shutter knocks it to the drain). All three gauges full and the gallery clear:
                           the combined note unfolds a short bridge to Veyra's platform.
   CHO_STAGES.HELDNOTE     The Held Note (stage 7): three bells hang over a wide charge pad in a round chamber with two
                           side alcoves on short bridges; a great ring round the pad fills with coral light. Thirty
                           seconds of charge: standing on the pad charges it; stepping off pauses it (never erases) after
                           a 2 s latch. Now and then a horn on the rim aims a broad numbered cone at the holder (a
                           countdown badge, STEP OFF): step aside and come back. Three waves, one at a time (3 mites; 2
                           eels and a mite; a hush moth and 2 mites: the moth hushes the pad until hit). Ring full and all
                           three waves down: the bells ring and lift the gold lattice before the Resonating Bowl.
   (CHO, the pads, beats and art, lives in 20zy2, which loads after this file: every CHO use is inside make(), which only
   runs once a stage starts) */
const CHO_STAGES = {};
(() => {
  const TAU = Math.PI * 2;
  const label = (c, s, x, y, size, col) => { size = Math.max(10, size * 1.25); c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a || 0, 0, TAU); };
  const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lwOf = T => Math.max(1.3, Math.min(3, T * 0.06));
  const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1)})`; };
  const alive = list => list.filter(m => !m.dead);
  function spawnAt(X, type, p, list, aggro) { const q = X.freeSpot(p.x, p.y, 0.5) || p; const m = X.spawnMon(type, q.x, q.y, { pack: 1111, rift: true, aggro: !!aggro }); if (aggro) m.aggro = true; X.g.total++; if (list) list.push(m); return m; }
  if (!DunWorld.PROPS.blank) DunWorld.PROPS.blank = () => {};
  const block = (X, tx, ty) => { X.M.props.set(ty * X.M.MW + tx, 'blank'); X.setTile(tx, ty, T_SOLID); };
  const unblock = (X, tx, ty) => { X.M.props.delete(ty * X.M.MW + tx); X.setTile(tx, ty, T_FLOOR); };
  const tilesOf = (M, ch) => (M.marks[ch] || []).map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y }));
  const chime = (X, f, k) => { if (X.sfx.chime) X.sfx.chime(f, k); };
  const NOTE_F = [392, 440, 494, 523, 587, 659];
  // (a layout tile's centre in the world: genRift frames the layout with one wall row and column)
  const W = (x, y) => ({ x: x + 1.5, y: y + 1.5 });
  // the pipes that frame a round plate: tall organ columns and arches where the rim looks north, drums and gauges elsewhere
  function framePipes(g, cx, cy, R, skip) { const n = 22; for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.07, x = Math.floor(cx + Math.cos(a) * (R + 0.7)), y = Math.floor(cy + Math.sin(a) * (R + 0.7));
      if (!g[y] || g[y][x] !== '~' || skip(x, y)) continue; const north = Math.sin(a) < -0.3; g[y][x] = north ? (i % 3 === 1 ? 'a' : 'c') : (i % 2 ? 'k' : 'u'); } }
  const PIPE_LEGEND = { c: { prop: 'pipecolumn' }, a: { prop: 'pipearch' }, k: { prop: 'drumstack' }, u: { prop: 'gaugepost' }, z: { prop: 'pipespiral' } };

  /* the dark stone floor-shadow and the two chains of something hanging high above (x, y) */
  function chains(c, Xs, Ys0, Ys1, dx, T) { c.save(); const fg = c.createLinearGradient(0, Ys0, 0, Ys1); fg.addColorStop(0, 'rgba(26,13,23,0)'); fg.addColorStop(0.6, 'rgba(26,13,23,.85)'); c.strokeStyle = fg; c.lineWidth = Math.max(2, T * 0.08); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(Xs + s * dx, Ys0); c.lineTo(Xs + s * dx, Ys1); c.stroke(); }
    c.strokeStyle = rgba('#A58A4E', 0.7); c.lineWidth = Math.max(1, T * 0.035); for (const s of [-1, 1]) for (let y = Ys1; y > Ys0 + (Ys1 - Ys0) * 0.45; y -= T * 0.22) { c.beginPath(); c.ellipse(Xs + s * dx, y, T * 0.05, T * 0.09, 0, 0, TAU); c.stroke(); } c.restore(); }

  /* ---- a horn gate across a run of tiles (west to east): two great bone horns whose bells meet over the opening, and
     between them a screen of bone organ pipes that sinks into the floor as it opens ---- */
  function hornGate(X, H, tiles, o) { o = o || {}; const x0 = Math.min(...tiles.map(t => t.tx)), x1 = Math.max(...tiles.map(t => t.tx)) + 1, ty = tiles[0].ty, D = { k: 0, open: false, tiles, x0, x1, ty, glow: 0 };
    D.obj = H.obj({ x: (x0 + x1) / 2, y: ty + 1.02, kind: 'horngate', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { const CHO = CHO_REF(), lw = lwOf(T), w = (x1 - x0) * T, L = Xs - w / 2, hgt = T * 2.6 * (1 - D.k);
      // the screen of pipes
      if (hgt > 1) { c.save(); c.beginPath(); c.rect(L - T, Ys - T * 5, w + T * 2, T * 5 + 1); c.clip(); const n = 5; for (let i = 0; i < n; i++) { const pw = w / n, px = L + i * pw, ph = hgt * (0.82 + 0.18 * Math.sin(i * 1.7 + 1)), top = Ys - ph;
          const g = c.createLinearGradient(px, 0, px + pw, 0); g.addColorStop(0, CHO.BONE_D); g.addColorStop(0.35, CHO.BONE_HI); g.addColorStop(1, CHO.BONE_D); c.fillStyle = g; c.fillRect(px + 1, top, pw - 2, ph); c.strokeStyle = CHO.INK; c.lineWidth = lw * 0.8; c.strokeRect(px + 1, top, pw - 2, ph);
          c.fillStyle = CHO.GOLD; c.fillRect(px + 1, top + ph * 0.22, pw - 2, Math.max(1.5, T * 0.08)); c.fillStyle = '#14070F'; ell(c, px + pw / 2, top + ph * 0.5, pw * 0.22, T * 0.14); c.fill();
          if (D.glow > 0) CHO.glow(c, px + pw / 2, top + ph * 0.5, T * 0.5, CHO.CORAL_HI, D.glow * 0.6); }
        c.restore(); c.fillStyle = CHO.MAROON_D; c.fillRect(L - 2, Ys - T * 0.12, w + 4, T * 0.16); }
      // the two horns: bells curling over the opening toward each other
      CHO.horn(c, L - T * 0.35, Ys, T * 3.4, { dir: 1, k: 0.3 + 0.5 * D.k + D.glow * 0.4, lw: lw * 1.1, bands: [3, 9, 15] });
      CHO.horn(c, L + w + T * 0.35, Ys, T * 3.4, { dir: -1, k: 0.3 + 0.5 * D.k + D.glow * 0.4, lw: lw * 1.1, bands: [3, 9, 15] });
      if (!D.open && o.label) label(c, typeof o.label === 'function' ? o.label() : o.label, Xs, Ys - T * 4.6, T * 0.26, CHO.BONE_HI); } });
    D.open1 = () => { if (D.open) return; D.open = true; tiles.forEach(t => unblock(X, t.tx, t.ty)); X.retile(); X.shake(4, 0.4); if (X.sfx.crash) X.sfx.crash(); };
    D.tick = dt => { if (D.open) D.k = Math.min(1, D.k + dt * 0.8); D.glow = Math.max(0, D.glow - dt); };
    tiles.forEach(t => block(X, t.tx, t.ty)); return D; }
  // (CHO is a const of the core file, defined by the time make() runs; this indirection only satisfies the lint of order)
  const CHO_REF = () => CHO;

  /* ======================= THE SILENT SCORE ======================= */
  const SC_C = [13.5, 17.5], SC_R = 9.3;
  const SC_LAYOUT = (() => { const Wd = 27, Hh = 37, g = grid(Wd, Hh, '~'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    for (let y = 0; y < Hh; y++) for (let x = 0; x < Wd; x++) if (Math.hypot(x + 0.5 - SC_C[0], y + 0.5 - SC_C[1]) < SC_R) g[y][x] = '.';
    rect(9, 1, 17, 4); g[2][13] = 'E'; rect(12, 5, 14, 9); for (let x = 12; x <= 14; x++) g[7][x] = 'd';
    rect(12, 26, 14, 34); g[33][13] = 'S'; g[29][10] = 'h'; g[29][16] = 'h';
    g[17][13] = 'T'; g[12][13] = 'P'; g[17][8] = 'P'; g[17][18] = 'P'; g[22][13] = 'P';
    // three bell mites at the tablet; where the second phrase's guards come in
    g[15][11] = 'b'; g[15][15] = 'b'; g[19][13] = 'b'; g[11][7] = 'q'; g[11][19] = 'q'; g[9][13] = 'o';
    framePipes(g, SC_C[0], SC_C[1], SC_R, (x, y) => Math.abs(x + 0.5 - SC_C[0]) < 3.5);
    return g.map(r => r.join('')); })();
  const SC_BRIGHT = 2.0, SC_REST = 1.5;
  function makeScore(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, CHO = CHO_REF(), { BONE_HI, CORAL_HI, GOLD_HI, WARN } = CHO;
    const E = mk.E[0], tab = mk.T[0], gate = hornGate(X, H, tilesOf(M, 'd'), { label: () => S.done ? '' : 'THE HORN GATE' });
    H.spawnPacks();
    const guards1 = X.mons.filter(m => m.rmark === 'b'), guards2 = [];
    // the entry horns, facing in over the corridor
    for (const p of mk.h) { block(X, p.tx, p.ty); const dir = p.x < tab.x ? 1 : -1; H.obj({ x: p.x, y: p.y + 0.4, kind: 'entryhorn', r: 0.1, h: 4, label: '', draw(c, Xs, Ys, T) { CHO.horn(c, Xs - dir * T * 0.4, Ys, T * 4.4, { dir, k: 0.25 + 0.35 * CHO.breath(X, p.x, p.y), lw: lwOf(T) * 1.15, bands: [3, 9, 15] }); } }); }
    // four pads round the tablet, N, W, E, S, each its own symbol
    const SYM = [0, 1, 2, 4];
    const pads = mk.P.slice().sort((a, b) => Math.atan2(a.y - tab.y, a.x - tab.x) - Math.atan2(b.y - tab.y, b.x - tab.x)).map((p, i) => CHO.pad(X, { x: p.x, y: p.y, r: 1.4, sym: SYM[i], i, label: q => padLabel(q), onStep: q => step(q) }));
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const o1 = shuffle([0, 1, 2, 3]).slice(0, 3); let o2 = shuffle([0, 1, 2, 3]).slice(0, 3); while (o2.join() === o1.join()) o2 = shuffle([0, 1, 2, 3]).slice(0, 3);
    const S = { intro: true, ph: 0, step: 0, orders: [o1, o2], played: [false, false], playing: false, mode: 'rest', restT: SC_REST, last: null, wrong: 0, resets: [0, 0], hits: 0, misses: 0, done: false, waitSaid: 0, turned: 0, guardsUp2: false, tabFlash: 0, trail: null };
    const target = () => S.playing ? pads[S.orders[S.ph][S.step]] : null;
    function padLabel(q) { const t = target(); if (!t) return ''; if (q !== t) return ''; if (CHO.silenced(q)) return 'HUSHED: HIT THE MOTH'; if (S.ph === 0) return `NOTE ${S.step + 1} OF 3: STEP ON`; return S.mode === 'bright' ? `NOTE ${S.step + 1} OF 3: NOW!` : `NOTE ${S.step + 1} OF 3: WAIT…`; }
    function light() { const t = target(); for (const p of pads) { p.light(p === t); if (p !== t) p.count = null; } }
    function arm() { // a fresh note: in the first phrase it is simply lit; in the second it rests, then shines
      const t = target(); light(); if (!t) return; if (S.ph === 1) { S.mode = 'rest'; S.restT = SC_REST; t.count = null; } else S.mode = 'lit'; }
    function shine() { const t = target(); if (!t) return; S.mode = 'bright'; t.countdown(SC_BRIGHT, () => { if (S.mode === 'bright' && target() === t) { S.mode = 'rest'; S.restT = SC_REST; S.misses++; X.text(t.x, t.y - 1.6, 'It rests: it shines again', BONE_HI, 13); } }); chime(X, 330, 0.25); }
    function hit(p) { p.flash(true); chime(X, NOTE_F[p.sym % NOTE_F.length] * (S.ph ? 1.5 : 1), 0.8); X.ring(p.x, p.y, 0.3, p.r + 0.8, 0.4, GOLD_HI, 0.5); p.count = null; S.hits++; S.trail = { from: p, t: 0 };
      S.last = p; S.step++; S.tabFlash = 0.5;
      if (S.step >= 3) { phraseDone(); return; } X.text(p.x, p.y - 1.7, `Note ${S.step} of 3`, GOLD_HI, 14); arm(); }
    function wrongNote(p) { p.flash(false); if (X.sfx.wrong) X.sfx.wrong(); S.wrong++; S.resets[S.ph]++; S.step = 0; S.last = null; S.trail = null; X.text(p.x, p.y - 1.7, 'Wrong note: this phrase starts again', WARN, 14);
      X.banner('A WRONG NOTE', `Phrase ${S.ph + 1} starts again from its first note (the played phrase stays played)`, CORAL_HI, 1.8, false); arm(); }
    function step(p) { if (!S.playing || S.done) return; const t = target();
      if (p !== t) { if (p === S.last) return; wrongNote(p); return; }   // (stepping back on the note just played is no note at all)
      if (S.ph === 0) { hit(p); return; }
      if (S.mode === 'bright') hit(p); else if (g.t - S.waitSaid > 1.5) { S.waitSaid = g.t; X.text(p.x, p.y - 1.7, 'Wait: it shines in a moment', BONE_HI, 13); } }
    function phraseDone() { const k = S.ph; S.played[k] = true; S.playing = false; light(); X.boom(tab.x, tab.y - 1, 1.6, CORAL_HI, '#FFFFFF', { n: 18, shake: 3 }); if (X.sfx.fanfare) X.sfx.fanfare();
      if (k === 0) X.banner('THE FIRST PHRASE IS PLAYED', alive(guards1).length ? 'The tablet will turn once its three bell mites are down' : 'The tablet turns to its second phrase', CORAL_HI, 2.6, true);
      else X.banner('THE SECOND PHRASE IS PLAYED', alive(guards2).length ? 'The horn gate waits: defeat the eels and the hush moth' : 'The horn gate opens', CORAL_HI, 2.6, true); }
    function second() { S.ph = 1; S.step = 0; S.last = null; S.playing = true; S.turned = 1; arm();
      const q = tilesOf(M, 'q'); for (const p of q) spawnAt(X, 'pipeeel', p, guards2, true); const o = mk.o[0]; S.moth = spawnAt(X, 'hushmoth', o, guards2, true); S.guardsUp2 = true;
      X.ring(tab.x, tab.y, 0.3, 4, 0.6, CORAL_HI, 0.5); X.shake(3, 0.3);
      X.banner('THE SECOND PHRASE', 'Each note rests, then SHINES for two seconds (its countdown border): step on it while it shines. A hush moth silences pads: hit it first!', CORAL_HI, 4, true, true); }
    function win() { S.done = true; self.done = true; for (const p of pads) { p.light(false); p.count = null; } gate.open1(); gate.glow = 1; H.setExit(E.x, E.y, 'To the Drum Chamber'); X.banner('THE HORN GATE OPENS', 'The silent score is played: Tammor\'s drum chamber lies beyond', CORAL_HI, 3, true, true); if (X.sfx.fanfare) X.sfx.fanfare();
      for (let i = 0; i < 3; i++) X.after(i * 0.18, () => chime(X, NOTE_F[i * 2], 0.9)); }
    X.after(1.2, () => { S.intro = false; S.playing = true; arm(); X.banner('THE SILENT SCORE', 'Read the hanging tablet: step on the drum pads in its order, one note at a time', CORAL_HI, 3.8, true, true); });
    const moth = () => S.moth && !S.moth.dead ? S.moth : null;
    H.obj({ x: tab.x, y: tab.y + 0.35, kind: 'tablet', r: 0.1, h: 5, label: '', draw(c, Xs, Ys, T) { tabletArt(c, Xs, Ys, T); } });
    const hushedPad = () => pads.find(p => CHO.silenced(p)) || null;
    return { S, pads, gate, tab, guards1, guards2, target, SC_REST, SC_BRIGHT,
      cam() { return { x: me.x * 0.65 + tab.x * 0.35, y: me.y * 0.65 + (tab.y - 1.2) * 0.35, k: 0, zoom: 0.58 }; },
      update(dt) { gate.tick(dt); S.tabFlash = Math.max(0, S.tabFlash - dt); if (S.trail) { S.trail.t += dt; if (S.trail.t > 1.2) S.trail = null; } if (S.intro || S.done) return;
        if (S.playing && S.ph === 1) { const t = target(); if (S.mode === 'rest' && !CHO.silenced(t)) { S.restT -= dt; if (S.restT <= 0) shine(); }
          // standing on the note when it starts to shine plays it
          if (S.mode === 'bright' && t.on && !CHO.silenced(t) && t.count) hit(t); }
        if (!S.played[1] && S.played[0] && !S.turned && !alive(guards1).length) second();
        if (S.played[0] && S.played[1] && !alive(guards1).length && !alive(guards2).length) win(); },
      goal() { if (S.done) return 'To the Drum Chamber'; if (S.intro) return 'The Silent Score'; const n = `Phrase ${S.ph + 1}/2`, g1 = alive(guards1).length, g2 = alive(guards2).length, hp = hushedPad();
        if (hp && moth()) return `${n} · a hush moth silences a pad: hit the moth to free it`;
        if (S.playing) { const tail = S.ph === 0 && g1 ? ` · ${g1} bell mites guard the tablet` : S.ph === 1 && g2 ? ` · guards: ${g2} left` : '';
          if (S.ph === 0) return `${n} · note ${S.step + 1}/3: step on the lit pad (the tablet's highlighted symbol)${tail}`;
          return `${n} · note ${S.step + 1}/3: ${S.mode === 'bright' ? 'it SHINES: step on it now' : 'wait by the lit pad for it to shine'}${tail}`; }
        if (S.played[0] && !S.played[1]) return `${n} · defeat the ${g1} bell mites at the tablet to turn it`;
        return `Both phrases played · defeat the guards (${g2} left) to open the horn gate`; },
      hint() { if (S.done) return null; const m = moth(); if (m && hushedPad()) return { x: m.x, y: m.y, h: 1.6, label: 'HIT THE MOTH' }; const t = target(); if (t) return { x: t.x, y: t.y, h: 0.7, label: 'NEXT NOTE' }; return null; },
      drawGround(c) { const T = X.Tz(), t = g.t, Xt = X.sx(tab.x), Yt = X.sy(tab.y);
        // the tablet's shadow on the floor, and the staff of gold rings it hangs over
        c.save(); c.fillStyle = 'rgba(20,8,16,.32)'; ell(c, Xt, Yt, T * 1.9, T * 0.55); c.fill(); c.restore();
        // the way from the last note to the next: a dotted gold line on the floor
        const tg = target(); if (tg && S.last && S.last !== tg) { c.save(); c.setLineDash([T * 0.18, T * 0.2]); c.lineDashOffset = -t * T; c.strokeStyle = rgba(GOLD_HI, 0.6); c.lineWidth = 2.5; c.beginPath(); c.moveTo(X.sx(S.last.x), X.sy(S.last.y)); c.lineTo(X.sx(tg.x), X.sy(tg.y)); c.stroke(); c.restore(); }
        // the second phrase's rest: a slow dashed bone ring and a small count before the pad shines
        if (tg && S.ph === 1 && S.playing && S.mode === 'rest' && !CHO.silenced(tg)) { const Xs = X.sx(tg.x), Ys = X.sy(tg.y), R = tg.r * T * 0.82 * 1.42; c.save(); c.setLineDash([T * 0.14, T * 0.16]); c.lineDashOffset = t * T * 0.5; c.strokeStyle = rgba(BONE_HI, 0.85); c.lineWidth = Math.max(2, T * 0.07); c.beginPath(); c.arc(Xs, Ys, R, 0, TAU); c.stroke(); c.setLineDash([]);
          c.strokeStyle = rgba(BONE_HI, 0.9); c.lineWidth = Math.max(2.5, T * 0.1); c.beginPath(); c.arc(Xs, Ys, R * 0.55, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(1 - S.restT / SC_REST, 0, 1)); c.stroke(); c.restore(); label(c, 'WAIT', Xs, Ys - R - T * 0.15, T * 0.28, BONE_HI); }
        if (tg && S.ph === 1 && S.mode === 'bright' && !CHO.silenced(tg)) { const Xs = X.sx(tg.x), Ys = X.sy(tg.y); CHO.glow(c, Xs, Ys, tg.r * T * 2.2, '#FFF2D6', 0.45 + 0.15 * Math.sin(t * 10)); label(c, 'NOW!', Xs, Ys - tg.r * T * 1.32 - T * 0.5, T * 0.32, GOLD_HI); }
        // a played note's ring of gold, briefly
        if (S.trail) { const p = S.trail.from, u = S.trail.t / 1.2; c.save(); c.strokeStyle = rgba(GOLD_HI, 1 - u); c.lineWidth = 3; c.beginPath(); c.arc(X.sx(p.x), X.sy(p.y), p.r * T * (1 + u * 0.8), 0, TAU); c.stroke(); c.restore(); } },
    };
    // (the tablet is drawn as an object so it sorts in depth: it hangs from chains high over the middle of the floor)
    function tabletArt(c, Xs, Ys, T) { const lw = lwOf(T), w = T * 3.6, h = T * 1.75, cx = Xs, cy = Ys - T * 2.3 + Math.sin(g.t * 1.2) * T * 0.05, t = g.t;
      chains(c, cx, cy - h / 2 - T * 2.2, cy - h / 2, w * 0.36, T);
      c.save(); c.fillStyle = CHO.INK; c.fillRect(cx - w / 2 - lw, cy - h / 2 - lw, w + lw * 2, h + lw * 2);
      const gg = c.createLinearGradient(cx, cy - h / 2, cx, cy + h / 2); gg.addColorStop(0, '#9E9288'); gg.addColorStop(0.5, '#857A72'); gg.addColorStop(1, '#5E544F'); c.fillStyle = gg; c.fillRect(cx - w / 2, cy - h / 2, w, h);
      c.strokeStyle = CHO.MAROON; c.lineWidth = T * 0.14; c.strokeRect(cx - w / 2 + T * 0.07, cy - h / 2 + T * 0.07, w - T * 0.14, h - T * 0.14); c.strokeStyle = CHO.GOLD; c.lineWidth = Math.max(1, T * 0.04); c.strokeRect(cx - w / 2 + T * 0.16, cy - h / 2 + T * 0.16, w - T * 0.32, h - T * 0.32);
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.fillStyle = CHO.GOLD_HI; c.beginPath(); c.arc(cx + sx * (w / 2 - T * 0.12), cy + sy * (h / 2 - T * 0.12), T * 0.08, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(cx - w / 2 + 2, cy - h / 2 + 2, w - 4, h * 0.14);
      const ord = S.orders[S.ph], phLbl = S.done ? 'THE SCORE IS PLAYED' : !S.playing && S.played[0] && !S.played[1] ? 'PHRASE 2 · GUARDED' : `PHRASE ${S.ph + 1} OF 2`;
      label(c, phLbl, cx, cy - h / 2 - T * 0.22, T * 0.27, S.ph ? CORAL_HI : BONE_HI);
      for (let i = 0; i < 3; i++) { const x = cx + (i - 1) * w * 0.31, y = cy + T * 0.05, s = T * 0.82, played = S.played[S.ph] || i < S.step, cur = S.playing && i === S.step, sym = pads[ord[i]].sym;
        c.beginPath(); c.arc(x, y, s * 0.55, 0, TAU); c.fillStyle = played ? 'rgba(165,138,78,.55)' : cur ? 'rgba(92,53,80,.9)' : 'rgba(40,24,34,.55)'; c.fill(); c.strokeStyle = CHO.INK; c.lineWidth = lw * 0.7; c.stroke();
        if (cur) { const k = S.ph === 1 && S.mode === 'bright' ? 1 : 0.6 + 0.3 * Math.sin(t * 4); CHO.glow(c, x, y, s * 1.2, CORAL_HI, 0.5 * k); c.strokeStyle = rgba(CORAL_HI, 0.95); c.lineWidth = Math.max(2.5, T * 0.09); c.beginPath(); c.arc(x, y, s * 0.62, 0, TAU); c.stroke();
          c.fillStyle = CORAL_HI; c.beginPath(); c.moveTo(x, y + s * 0.95); c.lineTo(x - s * 0.18, y + s * 0.72); c.lineTo(x + s * 0.18, y + s * 0.72); c.closePath(); c.fill(); }
        CHO.symbol(c, x, y, s * 0.72, sym, played ? '#FFF2D6' : cur ? '#FFF2D6' : 'rgba(217,201,165,.55)', Math.max(1.5, T * 0.06));
        label(c, String(i + 1), x - s * 0.5, y - s * 0.38, T * 0.2, played ? GOLD_HI : BONE_HI);
        if (played) { c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(2, T * 0.07); c.beginPath(); c.moveTo(x + s * 0.25, y + s * 0.3); c.lineTo(x + s * 0.36, y + s * 0.42); c.lineTo(x + s * 0.56, y + s * 0.16); c.stroke(); }
        if (S.ph === 1 && !played) { c.strokeStyle = rgba(BONE_HI, 0.7); c.lineWidth = 1.5; c.beginPath(); c.arc(x + s * 0.48, y + s * 0.4, s * 0.12, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(x + s * 0.48, y + s * 0.4); c.lineTo(x + s * 0.48, y + s * 0.32); c.stroke(); } }
      if (S.tabFlash > 0) CHO.glow(c, cx, cy, w * 0.7, GOLD_HI, S.tabFlash);
      if (!S.playing && !S.done && S.played[0] && !S.played[1]) { c.fillStyle = 'rgba(20,8,16,.55)'; c.fillRect(cx - w / 2, cy - h / 2, w, h); label(c, 'DEFEAT ITS GUARDS', cx, cy + T * 0.1, T * 0.28, WARN); }
      c.restore(); }
  }
  CHO_STAGES.SCORE = { name: 'The Silent Score', goal: 'Play the score on the drum pads', how: `A round rehearsal floor: four broad drum pads, each with an embossed symbol, stand round a stone tablet hanging over the middle. The tablet shows a three-symbol order, the current note highlighted (and the lit pad has a soft coral glow and a pointer). Step on the pads in that order. A wrong pad resets only the phrase you are playing (stepping back on the pad you just played does nothing). Three bell mites guard the tablet: once the first phrase is played and they are down, the tablet turns to a second phrase. Now each note first RESTS (a dashed ring, WAIT) and then SHINES for ${SC_BRIGHT} seconds with a countdown border round the pad: step on it, or stand on it, while it shines. A shine that runs out just rests and shines again. Two pipe eels and a hush moth guard the second phrase: the moth settles on a pad and hushes it (HUSHED, a tether to the moth) until you hit it. Both phrases played and their guards down, the horn gate opens.`,
    layout: SC_LAYOUT, legend: Object.assign({ E: {}, d: {}, h: {}, T: {}, P: {}, q: {}, o: {}, b: { mons: ['bellmite'] } }, PIPE_LEGEND), make: makeScore };

  /* ======================= THE BREATHWORKS ======================= */
  const BW_LAYOUT = (() => { const Wd = 33, Hh = 37, g = grid(Wd, Hh, '~'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    rect(8, 1, 14, 4); g[2][11] = 'E';
    for (let y = 9; y <= 31; y++) for (let x = 2; x <= 30; x++) { const cxd = Math.max(0, Math.abs(x - 16) - 11.5), cyd = Math.max(0, Math.abs(y - 20) - 8.5); if (Math.hypot(cxd, cyd) < 3.2) g[y][x] = '.'; }
    rect(5, 31, 8, 35); g[34][6] = 'S';
    g[10][5] = 'H'; g[10][16] = 'H'; g[10][27] = 'H'; g[28][16] = 'B';
    g[26][20] = 'D'; g[28][21] = 'w'; g[18][5] = 'J'; g[18][27] = 'J'; g[18][2] = 'v'; g[18][30] = 'v'; g[18][16] = 'K';
    g[13][10] = 'e'; g[13][22] = 'e'; g[22][9] = 'n'; g[22][23] = 'n'; g[21][16] = 'n'; g[30][3] = 'f'; g[30][29] = 'f';
    // the gallery's pipes: arches and spirals over the north rim, bellows and gauges round the rest
    for (const [x, y, ch] of [[1, 12, 'z'], [31, 12, 'z'], [1, 24, 'u'], [31, 24, 'k'], [20, 8, 'a'], [24, 8, 'c'], [8, 8, 'c'], [1, 21, 'k'], [31, 21, 'u']]) if (g[y][x] === '~') g[y][x] = ch;
    return g.map(r => r.join('')); })();
  const BW_FILL = 9;   // (seconds of a horn's own flow to fill its gauge)
  function makeBreathworks(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, CHO = CHO_REF(), PROPS = DunWorld.PROPS, { BONE, BONE_HI, BONE_D, CORAL, CORAL_HI, GOLD, GOLD_HI, MAROON, MAROON_HI, MAROON_D, WARN, INK } = CHO;
    const E = mk.E[0]; H.spawnPacks();
    const gallery = X.mons.filter(m => !m.dead), late = [];
    const P = (x, y) => W(x, y);
    // the horns (west, centre, east), each with its gauge and symbol
    const horns = mk.H.slice().sort((a, b) => a.x - b.x).map((p, i) => ({ i, x: p.x, y: p.y, sym: [0, 3, 4][i], fill: 0, full: false, lit: 0, warn: 0, recv: false, name: ['west', 'centre', 'east'][i] }));
    for (const h of horns) { for (let dx = -1; dx <= 1; dx++) { block(X, h.x - 0.5 + dx, h.y - 0.5); block(X, h.x - 0.5 + dx, h.y - 1.5); }
      h.obj = H.obj({ x: h.x, y: h.y + 0.45, kind: 'hornrecv', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { CHO.hornMouthArt(c, X, Xs, Ys - T * 0.1, T, h); const gx = Xs + T * (h.i === 2 ? -2.5 : 2.5), gy = Ys - T * 1.3;
        c.save(); c.fillStyle = BONE_D; c.fillRect(gx - T * 0.1, gy, T * 0.2, T * 1.3); c.restore(); CHO.gauge(c, gx, gy, T * 1.6, h.fill, h.sym); if (h.full) { CHO.glow(c, gx, gy, T * 0.9, '#FFF2D6', 0.35); label(c, 'FULL', gx, gy - T * 1.0, T * 0.3, GOLD_HI); } else label(c, `${Math.floor(h.fill * 100)}%`, gx, gy - T * 1.0, T * 0.3, h.recv ? CORAL_HI : BONE_HI); } }); }
    // the bellows and its manifold
    const B = mk.B[0]; for (let dx = -1; dx <= 1; dx++) { block(X, B.tx + dx, B.ty); block(X, B.tx + dx, B.ty + 1); }
    H.obj({ x: B.x, y: B.y + 1.45, kind: 'bellows', r: 0.1, h: 3.6, label: '', draw(c, Xs, Ys, T) { const k = S.pumpK || 0; c.save(); c.translate(Xs, Ys); c.scale(1 + 0.03 * k, 1 - 0.09 * k); PROPS.bellows(c, T * 1.9, 0); c.restore();
      CHO.glow(c, Xs, Ys - T * 2.2, T * (1.4 + 0.6 * k), CORAL_HI, 0.18 + 0.3 * k); label(c, 'THE BELLOWS', Xs, Ys + T * 0.55, T * 0.22, BONE_HI); } });
    const S = { intro: true, drainOpen: true, shut: [false, false], blocked: true, nested: true, cleared: false, done: false, noted: false, lateSent: false, vents: 0, packets: [], pumpT: 0, pump: 0, knocked: 0, flips: 0, lateHit: 0 };
    const man = P(16, 25.2), nozzle = P(16, 26.8), drainP = mk.D[0], Jw = mk.J.slice().sort((a, b) => a.x - b.x), Vd = mk.v.slice().sort((a, b) => a.x - b.x), K = mk.K[0];
    const hornIn = h => ({ x: h.x, y: h.y + 0.9 });
    // the network's polylines (world points)
    const NET = { trunk: [nozzle, man], drain: [man, { x: drainP.x - 0.6, y: man.y }, drainP],
      w0: [man, { x: Jw[0].x, y: man.y }, Jw[0]], w1: [Jw[0], hornIn(horns[0])], wv: [Jw[0], Vd[0]],
      c0: [man, K], c1: [K, hornIn(horns[1])],
      e0: [man, { x: Jw[1].x, y: man.y }, Jw[1]], e1: [Jw[1], hornIn(horns[2])], ev: [Jw[1], Vd[1]] };
    // where the air goes now: a list of routes, each [segments..., end kind, horn]
    function routes() { if (S.drainOpen) return [{ path: ['trunk', 'drain'], end: 'drain', at: drainP }];
      return [{ path: ['trunk', 'w0', S.shut[0] ? 'w1' : 'wv'], end: S.shut[0] ? 'horn' : 'vent', horn: horns[0], at: S.shut[0] ? hornIn(horns[0]) : Vd[0] },
        { path: ['trunk', 'c0'].concat(S.blocked ? [] : ['c1']), end: S.blocked ? 'stuck' : 'horn', horn: horns[1], at: S.blocked ? K : hornIn(horns[1]) },
        { path: ['trunk', 'e0', S.shut[1] ? 'e1' : 'ev'], end: S.shut[1] ? 'horn' : 'vent', horn: horns[2], at: S.shut[1] ? hornIn(horns[2]) : Vd[1] }]; }
    const pathPts = r => { const pts = []; for (const k of r.path) for (const p of NET[k]) { const q = pts[pts.length - 1]; if (!q || Math.hypot(q.x - p.x, q.y - p.y) > 0.01) pts.push(p); } return pts; };
    const lenOf = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return L; };
    const ptAt = (pts, d) => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b.x - a.x, b.y - a.y); if (d <= l) { const u = l ? d / l : 0; return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }; } d -= l; } return pts[pts.length - 1]; };
    // the controls: the waste drain's lever, the two sliding shutters, the blockage
    const drainLever = mk.w[0];
    H.obj({ x: drainLever.x, y: drainLever.y + 0.2, kind: 'drainlever', r: 0.6, h: 1.8, label: () => S.drainOpen ? 'CLOSE THE WASTE DRAIN' : 'OPEN THE WASTE DRAIN', draw(c, Xs, Ys, T) { leverArt(c, Xs, Ys, T, !S.drainOpen, S.drainOpen ? 'OPEN' : 'SHUT'); },
      use() { S.drainOpen = !S.drainOpen; S.flips++; X.text(drainLever.x, drainLever.y - 2, S.drainOpen ? 'The waste drain opens: all the air vents' : 'The waste drain is shut: air goes up the conduits', S.drainOpen ? CORAL_HI : GOLD_HI, 14); if (X.sfx.crack) X.sfx.crack(); } });
    const shutters = Jw.map((p, i) => { const sh = { i, x: p.x, y: p.y, k: 0 }; sh.obj = H.obj({ x: p.x, y: p.y + 0.35, kind: 'shutter', r: 0.75, h: 2.1, label: () => S.shut[i] ? 'SLIDE TO THE DRAIN' : 'SLIDE TO THE HORN', draw(c, Xs, Ys, T) { shutterArt(c, Xs, Ys, T, sh, S.shut[i], i); },
      use() { S.shut[i] = !S.shut[i]; S.flips++; X.text(p.x, p.y - 2.2, S.shut[i] ? `The ${['west', 'east'][i]} shutter slides: air to the horn` : `Slid to the drain: the ${['west', 'east'][i]} air vents`, S.shut[i] ? GOLD_HI : CORAL_HI, 14); if (X.sfx.whoosh) X.sfx.whoosh(); else if (X.sfx.crack) X.sfx.crack(); } }); return sh; });
    // the hush moth nests in the blockage: pinned there, quiet, until a hit drives it out
    const moth = spawnAt(X, 'hushmoth', { x: K.x, y: K.y - 0.2 }, null, false); moth.nest = true; moth.aggro = false; moth.pack = 1112; moth.hp0n = moth.hp;
    const blk = { x: K.x, y: K.y };
    blk.obj = H.obj({ x: K.x, y: K.y + 0.3, kind: 'blockage', r: 0.75, h: 2.2, label: () => S.cleared ? '' : S.nested ? 'A HUSH MOTH NESTS HERE: HIT IT' : 'CLEAR THE BLOCKAGE', draw(c, Xs, Ys, T) { if (!S.cleared) clogArt(c, Xs, Ys, T); },
      use() { if (S.cleared) return; if (S.nested) { X.text(K.x, K.y - 2, 'The moth hushes the conduit: hit it to drive it out', CORAL_HI, 14); return; } S.cleared = true; S.blocked = false; X.boom(K.x, K.y - 0.4, 1.3, CORAL_HI, BONE_HI, { n: 16, shake: 4 }); X.banner('THE CENTRE CONDUIT IS CLEAR', 'Air can reach the centre horn now', CORAL_HI, 2.2, true); if (X.sfx.pop) X.sfx.pop(); } });
    function unnest(how) { if (!S.nested) return; S.nested = false; moth.nest = false; moth.aggro = true; moth.mode = null; if (!moth.dead) { moth.kbx = 0; moth.kby = -3; X.text(moth.x, moth.y - 1.4, 'Interrupted!', CORAL_HI, 14); }
      X.banner(moth.dead ? 'THE MOTH IS GONE' : 'THE MOTH IS DRIVEN OUT', 'Now clear the hush-silk from the centre conduit (stand at it)', CORAL_HI, 2.4, true); }
    function lateMites() { if (S.lateSent) return; S.lateSent = true; for (const [i, p] of tilesOf(M, 'f').sort((a, b) => a.x - b.x).entries()) { const m = spawnAt(X, 'bellmite', p, late, false); m.aggro = false; m.goFor = shutters[i]; m.pack = 1120 + i; }
      X.banner('TWO MITES MAKE FOR THE SHUTTERS', 'If one reaches a shutter it knocks it to the drain: stop them (or slide it back)', WARN, 2.8, true); }
    function win() { S.done = true; self.done = true; X.banner('THE BRIDGE UNFOLDS', 'Three horns breathe as one: a bridge of bone unfolds to Veyra\'s platform', CORAL_HI, 3, true, true); if (X.sfx.fanfare) X.sfx.fanfare();
      const cols = [E.tx - 1, E.tx, E.tx + 1]; let y = E.ty + 1, n = 0; const rows = []; while (y < M.MH && !(X.tileAt(E.tx, y) === T_FLOOR && y > E.ty + 3)) { rows.push(y); y++; }
      rows.forEach((yy, k) => X.after(k * 0.25, () => { for (const x of cols) if (X.tileAt(x, yy) !== T_FLOOR) X.setTile(x, yy, T_BRIDGE); X.retile(); X.ring(E.x, yy + 0.5, 0.2, 1.4, 0.3, CORAL_HI, 0.3); if (X.sfx.thud) X.sfx.thud(); n++; }));
      X.after(rows.length * 0.25 + 0.1, () => H.setExit(E.x, E.y, 'To the Pipe Bridge')); }
    function combined() { if (S.noted) return; S.noted = true; for (let i = 0; i < 3; i++) X.after(i * 0.12, () => chime(X, [262, 330, 392][i], 1)); for (const h of horns) X.ring(h.x, h.y, 0.3, 3, 0.7, CORAL_HI, 0.5); X.flash(0.25, '#FFE8E0');
      X.banner('THE THREE HORNS BREATHE TOGETHER', alive(gallery.concat(late, [moth])).length ? 'A combined note: defeat the gallery\'s last monsters and the bridge unfolds' : 'A combined note shakes the gallery', CORAL_HI, 3, true, true); }
    X.after(1.2, () => { S.intro = false; X.banner('THE BREATHWORKS', 'Route the bellows\' breath to all three horns: shut the waste drain, slide the shutters, clear the blocked centre', CORAL_HI, 4, true, true); });
    const hornFor = r => r.end === 'horn' ? r.horn : null;
    return { S, horns, shutters, moth, late, gallery, routes, blk, NET,
      cam() { return { x: me.x * 0.7 + 16.5 * 0.3 + 0.5, y: me.y * 0.7 + 20 * 0.3, k: 0, zoom: 0.56 }; },
      update(dt) { for (const sh of shutters) sh.k += ((S.shut[sh.i] ? 1 : 0) - sh.k) * Math.min(1, dt * 6);
        // the nest: the moth stays put in the blockage until it is hurt
        if (S.nested) { if (moth.dead || moth.hp < moth.hp0n - 0.5) unnest(); else { moth.x = K.x; moth.y = K.y - 0.2; moth.vx = moth.vy = 0; moth.aggro = false; moth.cd = 2; moth.mode = 'hush'; } }
        // the bellows pumps: a packet down every live route, two to a breath
        S.pump += dt; const pumpK = 0.5 - 0.5 * Math.cos(S.pump / 1.3 * TAU); S.pumpK = pumpK; S.pumpT -= dt;
        const R = routes(); for (const h of horns) h.recv = false; for (const r of R) { const h = hornFor(r); if (h) h.recv = true; }
        if (S.pumpT <= 0 && !S.done) { S.pumpT = 0.65; for (const r of R) { const pts = pathPts(r); S.packets.push({ pts, L: lenOf(pts), d: 0, end: r.end, horn: hornFor(r), at: r.at, sig: r.path.join() }); } }
        const sigs = new Set(R.map(r => r.path.join()));
        for (const q of S.packets) { q.d += dt * 5.2; if (!sigs.has(q.sig) && q.d < q.L) q.lost = true; if (q.d >= q.L && !q.arrived) { q.arrived = true;
            if (q.end === 'horn') { X.ring(q.at.x, q.at.y, 0.1, 0.7, 0.25, CORAL_HI, 0.35); } else if (q.end === 'stuck') { S.vents++; X.ring(q.at.x, q.at.y, 0.1, 0.9, 0.3, '#887080', 0.4); } else { S.vents++; X.ring(q.at.x, q.at.y, 0.2, 1.1, 0.35, CORAL, 0.35); } } }
        S.packets = S.packets.filter(q => !q.arrived && !q.lost);
        if (S.intro || S.done) return;
        for (const h of horns) { h.lit = Math.max(h.full ? 0.5 : 0, h.lit - dt * 2); if (h.recv && !h.full) { h.fill = Math.min(1, h.fill + dt / BW_FILL); h.lit = Math.min(1, h.lit + dt * 4); if (h.fill >= 1) { h.full = true; X.banner(`THE ${h.name.toUpperCase()} HORN IS FULL`, `${horns.filter(q => q.full).length} of 3 horns hold their breath (a full gauge stays full)`, CORAL_HI, 2.2, true); chime(X, [262, 330, 392][h.i], 1); X.ring(h.x, h.y, 0.3, 2.4, 0.5, GOLD_HI, 0.5); } } }
        const tot = horns.reduce((a, h) => a + h.fill, 0); if (tot >= 2 && !S.lateSent) lateMites();
        // the late mites walk for the shutters; one that reaches its shutter knocks it to the drain
        for (const m of late) { if (m.dead || m.aggro || !m.goFor) continue; const sh = m.goFor, dx = sh.x - m.x, dy = sh.y + 0.9 - m.y, d = Math.hypot(dx, dy);
          if (d > 0.9) { X.moveEnt(m, dx / d * m.spd * dt, dy / d * m.spd * dt, 1); m.face = dx >= 0 ? 1 : -1; }
          else { m.goFor = null; m.aggro = true; if (S.shut[sh.i]) { S.shut[sh.i] = false; S.knocked++; X.text(sh.x, sh.y - 2.2, 'A mite knocks the shutter to the drain!', WARN, 15); X.banner('A SHUTTER IS KNOCKED', `The ${['west', 'east'][sh.i]} shutter sends its air to the drain: slide it back`, WARN, 2.2, true); } } }
        if (horns.every(h => h.full)) { combined(); if (!alive(gallery.concat(late, [moth])).length) win(); } },
      goal() { if (S.done) return 'To the Pipe Bridge'; if (S.intro) return 'The Breathworks'; const nf = horns.filter(h => h.full).length, L = `Horns ${nf}/3`, mons = alive(gallery.concat(late, [moth])).length;
        if (nf === 3) return `${L} · the horns are full · defeat the last ${mons} monster${mons === 1 ? '' : 's'}`;
        const lm = late.find(m => !m.dead && !m.aggro && m.goFor); if (lm) return `${L} · a mite makes for the ${['west', 'east'][lm.goFor.i]} shutter: stop it`;
        if (S.drainOpen) return `${L} · all the air vents into the waste drain: close it (the lever by the bellows)`;
        const todo = []; if (!S.shut[0] && !horns[0].full) todo.push('slide the west shutter to its horn'); if (!S.shut[1] && !horns[2].full) todo.push('slide the east shutter to its horn'); if (S.nested && !horns[1].full) todo.push('hit the hush moth nested in the centre conduit'); else if (S.blocked && !horns[1].full) todo.push('clear the centre blockage');
        return todo.length ? `${L} · ${todo.join(' · ')}` : `${L} · the air reaches the horns: let the gauges fill${mons ? ` · ${mons} monsters` : ''}`; },
      hint() { if (S.done) return null; if (horns.every(h => h.full)) return null; const lm = late.find(m => !m.dead && !m.aggro && m.goFor); if (lm) return { x: lm.x, y: lm.y, h: 1.2, label: 'STOP THE MITE' };
        if (S.drainOpen) return { x: drainLever.x, y: drainLever.y, h: 1.9, label: 'WASTE DRAIN' };
        for (let i = 0; i < 2; i++) if (!S.shut[i] && !horns[i * 2].full) return { x: shutters[i].x, y: shutters[i].y, h: 2.2, label: 'SHUTTER' };
        if (S.nested && !moth.dead) return { x: moth.x, y: moth.y, h: 1.6, label: 'HIT THE MOTH' }; if (S.blocked) return { x: K.x, y: K.y, h: 2.2, label: 'BLOCKAGE' }; return null; },
      drawGround(c) { const T = X.Tz(), t = g.t, lw = lwOf(T), sp = p => [X.sx(p.x), X.sy(p.y)];
        const R = routes(), live = new Set(); for (const r of R) for (const k of r.path) live.add(k);
        // the drains: grates over coral-lit dark, the waste drain broadest
        const grate = (p, r, open, name) => { const [Xs, Ys] = sp(p); c.save(); ell(c, Xs, Ys, r * T, r * T * 0.6); c.fillStyle = '#12070F'; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); if (open) { const gg = c.createRadialGradient(Xs, Ys, 0, Xs, Ys, r * T); gg.addColorStop(0, rgba(CORAL, 0.35)); gg.addColorStop(1, rgba(CORAL, 0)); c.fillStyle = gg; ell(c, Xs, Ys, r * T, r * T * 0.6); c.fill(); }
          c.strokeStyle = GOLD; c.lineWidth = Math.max(1.5, T * 0.06); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(Xs + i * r * T * 0.3, Ys - r * T * 0.5 * Math.sqrt(1 - Math.pow(i * 0.3 / 1, 2))); c.lineTo(Xs + i * r * T * 0.3, Ys + r * T * 0.5 * Math.sqrt(1 - Math.pow(i * 0.3, 2))); c.stroke(); }
          if (!open) { c.fillStyle = rgba(MAROON_HI, 0.92); ell(c, Xs, Ys, r * T * 0.92, r * T * 0.55); c.fill(); c.strokeStyle = GOLD_HI; c.lineWidth = 2; c.stroke(); }
          c.restore(); label(c, name, Xs, Ys - r * T * 0.6 - T * 0.12, T * 0.22, open ? CORAL_HI : BONE_HI); };
        grate(drainP, 1.15, S.drainOpen, S.drainOpen ? 'WASTE DRAIN · OPEN' : 'WASTE DRAIN · SHUT'); grate(Vd[0], 0.8, true, 'DRAIN'); grate(Vd[1], 0.8, true, 'DRAIN');
        // the conduits: thick bone tubes on low maroon cradles; a live one warmed with coral
        const draw = (k, w) => { const pts = NET[k].map(sp); CHO.tube(c, pts.map(p => [p[0], p[1] - T * 0.12]), T * w, live.has(k) ? '#E2CDB0' : BONE_D, lw, { bands: 1, bands0: 1 }); };
        for (const k of ['wv', 'ev', 'drain']) draw(k, 0.55); for (const k of ['w0', 'w1', 'c0', 'c1', 'e0', 'e1', 'trunk']) draw(k, 0.82);
        // the manifold box
        { const [Xs, Ys] = sp(man); c.save(); c.fillStyle = MAROON_HI; c.fillRect(Xs - T * 0.7, Ys - T * 0.75, T * 1.4, T * 0.9); c.strokeStyle = INK; c.lineWidth = lw; c.strokeRect(Xs - T * 0.7, Ys - T * 0.75, T * 1.4, T * 0.9); c.fillStyle = GOLD; c.fillRect(Xs - T * 0.7, Ys - T * 0.45, T * 1.4, T * 0.1); c.restore(); }
        // the light packets running along every live connection
        for (const q of S.packets) { const p = ptAt(q.pts, q.d), [Xs, Ys] = sp(p); CHO.glow(c, Xs, Ys - T * 0.15, T * 1.1, CORAL_HI, 0.85); c.fillStyle = '#FFF2E8'; c.beginPath(); c.arc(Xs, Ys - T * 0.15, Math.max(3, T * 0.19), 0, TAU); c.fill(); c.strokeStyle = CORAL; c.lineWidth = 1.5; c.stroke(); }
        // where air is wasted: a soft puff over a vent that is taking it
        for (const r of R) if (r.end !== 'horn') { const [Xs, Ys] = sp(r.at); CHO.glow(c, Xs, Ys - T * 0.3, T * (0.9 + 0.3 * S.pumpK), r.end === 'stuck' ? '#9A8090' : CORAL, 0.35); label(c, r.end === 'stuck' ? 'BLOCKED' : 'VENTING', Xs, Ys - T * 1.5, T * 0.22, r.end === 'stuck' ? BONE_HI : CORAL_HI); } },
    };
    function leverArt(c, Xs, Ys, T, shut, txt) { const lw = lwOf(T); c.save(); c.fillStyle = 'rgba(12,4,10,.35)'; ell(c, Xs, Ys, T * 0.5, T * 0.18); c.fill();
      c.fillStyle = MAROON_HI; c.fillRect(Xs - T * 0.28, Ys - T * 0.9, T * 0.56, T * 0.9); c.strokeStyle = INK; c.lineWidth = lw; c.strokeRect(Xs - T * 0.28, Ys - T * 0.9, T * 0.56, T * 0.9); c.fillStyle = GOLD; c.fillRect(Xs - T * 0.28, Ys - T * 0.62, T * 0.56, T * 0.08);
      const a = shut ? -Math.PI / 2 - 0.7 : -Math.PI / 2 + 0.7, px = Xs, py = Ys - T * 0.85; c.strokeStyle = INK; c.lineWidth = Math.max(3, T * 0.14); c.lineCap = 'round'; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * T * 0.75, py + Math.sin(a) * T * 0.75); c.stroke(); c.strokeStyle = BONE; c.lineWidth = Math.max(1.5, T * 0.07); c.stroke();
      c.fillStyle = shut ? GOLD_HI : CORAL; c.beginPath(); c.arc(px + Math.cos(a) * T * 0.75, py + Math.sin(a) * T * 0.75, Math.max(3, T * 0.13), 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); c.restore();
      label(c, txt, Xs, Ys + T * 0.45, T * 0.2, shut ? GOLD_HI : CORAL_HI); }
    /* a sliding shutter on a conduit's junction: a maroon housing with two ports (north: the horn; outward: the drain),
       a gold plate that slides across the one it closes, and an arrow showing where the air goes */
    function shutterArt(c, Xs, Ys, T, sh, toHorn, i) { const lw = lwOf(T), out = i === 0 ? -1 : 1, k = sh.k; c.save(); c.fillStyle = 'rgba(12,4,10,.35)'; ell(c, Xs, Ys + T * 0.05, T * 0.9, T * 0.3); c.fill();
      const w = T * 1.7, h = T * 1.5, top = Ys - h; c.fillStyle = MAROON_HI; c.fillRect(Xs - w / 2, top, w, h); c.strokeStyle = INK; c.lineWidth = lw; c.strokeRect(Xs - w / 2, top, w, h); c.fillStyle = MAROON_D; c.fillRect(Xs - w / 2, top, w, T * 0.18);
      // its two ports
      c.fillStyle = '#12070F'; ell(c, Xs, top + T * 0.42, T * 0.26, T * 0.2); c.fill(); ell(c, Xs + out * w * 0.32, top + h * 0.66, T * 0.2, T * 0.24); c.fill();
      // the plate: over the drain port when sliding air to the horn (k 1), over the horn port when to the drain (k 0)
      const px = Xs + out * w * 0.32 * k, py = top + T * 0.42 + (h * 0.66 - T * 0.42) * k; c.fillStyle = GOLD; c.fillRect(px - T * 0.34, py - T * 0.3, T * 0.68, T * 0.6); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.strokeRect(px - T * 0.34, py - T * 0.3, T * 0.68, T * 0.6); c.fillStyle = rgba(GOLD_HI, 0.8); c.fillRect(px - T * 0.3, py - T * 0.27, T * 0.6, T * 0.08);
      // the arrow: where the air goes
      c.strokeStyle = toHorn ? GOLD_HI : CORAL_HI; c.fillStyle = c.strokeStyle; c.lineWidth = Math.max(2, T * 0.08); const ax = Xs, ay = top - T * 0.35; c.beginPath(); if (toHorn) { c.moveTo(ax, ay + T * 0.2); c.lineTo(ax, ay - T * 0.35); c.stroke(); c.beginPath(); c.moveTo(ax - T * 0.16, ay - T * 0.2); c.lineTo(ax, ay - T * 0.42); c.lineTo(ax + T * 0.16, ay - T * 0.2); c.fill(); } else { c.moveTo(ax, ay); c.lineTo(ax + out * T * 0.5, ay); c.stroke(); c.beginPath(); c.moveTo(ax + out * T * 0.36, ay - T * 0.16); c.lineTo(ax + out * T * 0.58, ay); c.lineTo(ax + out * T * 0.36, ay + T * 0.16); c.fill(); }
      c.restore(); label(c, toHorn ? 'TO THE HORN' : 'TO THE DRAIN', Xs, Ys + T * 0.45, T * 0.2, toHorn ? GOLD_HI : CORAL_HI); }
    /* the blockage: a black wad of hush-silk round the conduit, coral threads, the moth's nest in it */
    function clogArt(c, Xs, Ys, T) { const lw = lwOf(T), t = g.t; c.save(); c.fillStyle = 'rgba(12,4,10,.35)'; ell(c, Xs, Ys, T * 1.0, T * 0.32); c.fill();
      for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, r = T * (0.5 + (i % 2) * 0.12); ell(c, Xs + Math.cos(a) * T * 0.3, Ys - T * 0.55 + Math.sin(a) * T * 0.18, r, r * 0.7); c.fillStyle = i % 2 ? '#1E141C' : '#2B1E28'; c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.stroke(); }
      c.strokeStyle = rgba(CORAL_HI, 0.55); c.lineWidth = 1.2; for (let i = 0; i < 6; i++) { const a = i * 1.05 + t * 0.3; c.beginPath(); c.moveTo(Xs + Math.cos(a) * T * 0.7, Ys - T * 0.5 + Math.sin(a) * T * 0.35); c.quadraticCurveTo(Xs, Ys - T * 0.9, Xs - Math.cos(a) * T * 0.6, Ys - T * 0.4 - Math.sin(a) * T * 0.3); c.stroke(); }
      if (S.nested) CHO.hushIcon(c, Xs, Ys - T * 1.7, T * 0.6, CORAL_HI, Math.max(2, T * 0.07));
      c.restore(); }
  }
  CHO_STAGES.BREATHWORKS = { name: 'The Breathworks', goal: 'Make the three horns breathe together', how: `A great bellows at the south of the gallery pumps its breath into a manifold: light packets run along every open connection, so you can see where the air goes. From the manifold three bone conduits run north to three horn receivers, each with a pressure gauge and its own symbol. The waste drain beside the manifold starts OPEN and takes all the air: shut it at its lever. The west and east conduits each pass a sliding shutter (stand at it a moment to slide it): one way sends the air on to the horn, the other out of a side drain. The centre conduit is blocked with hush-silk, a hush moth nested in it: hit the moth to drive it out, then stand at the blockage to clear it. Each horn's gauge fills while its air arrives (about ${BW_FILL} s) and stays full. Wrong settings only vent harmlessly, and every control can be changed at will. Two pipe eels and three bell mites hold the gallery; at two-thirds pressure two more mites make for the shutters, and one that reaches a shutter knocks it to the drain. All three gauges full and the gallery clear, the combined note unfolds a bridge to Veyra's platform.`,
    layout: BW_LAYOUT, legend: Object.assign({ E: {}, H: {}, B: {}, D: {}, w: {}, J: {}, v: {}, K: {}, f: {}, e: { mons: ['pipeeel'] }, n: { mons: ['bellmite'] } }, PIPE_LEGEND), make: makeBreathworks };

  /* ======================= THE HELD NOTE ======================= */
  const HN_C = [17.5, 18.5], HN_R = 8.2, HN_NEED = 30;
  const HN_LAYOUT = (() => { const Wd = 35, Hh = 37, g = grid(Wd, Hh, '~'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    for (let y = 0; y < Hh; y++) for (let x = 0; x < Wd; x++) { const p = [x + 0.5, y + 0.5]; if (Math.hypot(p[0] - HN_C[0], p[1] - HN_C[1]) < HN_R || Math.hypot(p[0] - 4.5, p[1] - HN_C[1]) < 3.4 || Math.hypot(p[0] - 30.5, p[1] - HN_C[1]) < 3.4) g[y][x] = '.'; }
    for (let y = 17; y <= 19; y++) for (const x of [8, 9, 25, 26]) if (g[y][x] === '~') g[y][x] = '=';
    rect(11, 1, 23, 5); g[3][17] = 'E'; rect(16, 6, 18, 11); for (let x = 16; x <= 18; x++) g[8][x] = 'L';
    rect(16, 26, 18, 34); g[33][17] = 'S'; g[18][17] = 'P';
    for (const a of [-3 * Math.PI / 4, -Math.PI / 4, Math.PI / 4, 3 * Math.PI / 4]) g[Math.floor(HN_C[1] + Math.sin(a) * 8.9)][Math.floor(HN_C[0] + Math.cos(a) * 8.9)] = 'h';
    g[18][4] = 'w'; g[18][30] = 'w'; g[23][17] = 'w';
    for (const [x, y, ch] of [[13, 10, 'c'], [21, 10, 'c'], [10, 13, 'z'], [25, 13, 'z'], [2, 14, 'k'], [32, 14, 'u'], [2, 22, 'u'], [32, 22, 'k']]) if (g[y][x] === '~') g[y][x] = ch;
    return g.map(r => r.join('')); })();
  const HN_WAVES = [['bellmite', 'bellmite', 'bellmite'], ['pipeeel', 'pipeeel', 'bellmite'], ['hushmoth', 'bellmite', 'bellmite']];
  const HN_CONE_EVERY = 11;
  function makeHeldNote(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, CHO = CHO_REF(), { BONE_HI, CORAL, CORAL_HI, GOLD, GOLD_HI, GOLD_D, MAROON_D, WARN, INK } = CHO;
    const E = mk.E[0], P0 = mk.P[0];
    const S = { intro: true, wave: 0, waveMons: [], nextT: 3, done: false, full: false, cones: 0, coneT: 5, coneHits: 0, lat: 0, latOpen: false, ringK: 0, silencedSeen: 0, bellRing: 0, waveClear: [false, false, false] };
    const pad = CHO.pad(X, { x: P0.x, y: P0.y, r: 2.3, sym: 5, need: HN_NEED, latch: 2, label: q => q.full ? 'THE NOTE IS HELD' : CHO.silenced(q) ? 'HUSHED: HIT THE MOTH' : q.on ? 'HOLDING THE NOTE' : q.latchT > 0 ? 'LATCHED: STILL CHARGING' : 'STAND HERE TO CHARGE',
      onFull: () => { S.full = true; X.banner('THE NOTE IS HELD', S.wave >= 3 && !alive(S.waveMons).length ? 'The ring is full' : 'The ring is full: defeat the remaining waves', CORAL_HI, 2.6, true); } });
    // the lattice: gold tiles across the north corridor, lifted by the bells at the end
    const latT = tilesOf(M, 'L'); latT.forEach(t => block(X, t.tx, t.ty)); const lx0 = Math.min(...latT.map(t => t.tx)), lx1 = Math.max(...latT.map(t => t.tx)) + 1, lty = latT[0].ty;
    H.obj({ x: (lx0 + lx1) / 2, y: lty + 1.02, kind: 'lattice', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { latticeArt(c, Xs, Ys, T, (lx1 - lx0) * T); } });
    // the four horns on the rim: the cones come from them
    const horns = mk.h.map((p, i) => { block(X, p.tx, p.ty); const h = { i, x: p.x, y: p.y, warn: 0, dir: p.x < pad.x ? 1 : -1 }; h.obj = H.obj({ x: p.x, y: p.y + 0.4, kind: 'rimhorn', r: 0.1, h: 4, label: '', draw(c, Xs, Ys, T) { const m = CHO.horn(c, Xs - h.dir * T * 0.4, Ys, T * 3.0, { dir: h.dir, k: 0.25 + 0.6 * h.warn, lw: lwOf(T), bands: [3, 12] }); if (h.warn > 0.05) { c.save(); c.strokeStyle = rgba(WARN, 0.9 * h.warn); c.lineWidth = 3; c.beginPath(); c.arc(m.mx, m.my, m.mr * 1.3, 0, TAU); c.stroke(); c.restore(); } } }); return h; });
    // the three bells over the pad
    H.obj({ x: pad.x, y: pad.y - 2.9, kind: 'bells', r: 0.1, h: 6, label: '', draw(c, Xs, Ys, T) { bellsArt(c, Xs, Ys, T); } });
    function cone() { const h = horns[Math.floor(Math.random() * horns.length)], d = Math.hypot(pad.x - h.x, pad.y - h.y), a = Math.atan2(pad.y - h.y, pad.x - h.x); S.cones++; h.warn = 1; h.cur = true;
      const p = CHO.beat(X, { shape: 'cone', x: h.x, y: h.y, r0: 1.2, a, len: d + 3.4, spread: Math.atan2(3.0, d), n: 1, t: 2.8, dmg: X.ST().hp * 0.14, src: null, label: 'STEP OFF THE PAD',
        fn: (q, hit) => { h.cur = false; if (hit) S.coneHits++; X.ring(h.x, h.y, 0.4, 2, 0.3, CORAL_HI, 0.35); chime(X, 220, 0.6); } });
      S.coneP = p; X.text(pad.x, pad.y - 3, 'A horn takes aim: step off the pad!', WARN, 15); return p; }
    function wave() { const k = S.wave; S.wave++; const spots = tilesOf(M, 'w'); S.waveMons = [];
      HN_WAVES[k].forEach((type, j) => spawnAt(X, type, spots[(j + k) % spots.length], S.waveMons, true));
      X.banner(`WAVE ${S.wave} OF 3`, ['Three bell mites: keep the note charging between swings (the latch gives you 2 s)', 'Two pipe eels and a mite: step off their shown lines', 'A hush moth and two mites: the moth will hush the pad, hit it to resume charging'][k], WARN, 2.8, true); }
    function win() { S.done = true; self.done = true; S.latOpen = true; latT.forEach(t => unblock(X, t.tx, t.ty)); X.retile(); S.bellRing = 3; H.setExit(E.x, E.y, 'To the Resonating Bowl'); for (const hh of horns) hh.warn = 0; CHO.clearBeats(X);
      X.banner('THE BELLS LIFT THE LATTICE', 'The held note rings through the bells: the Resonating Bowl lies open', CORAL_HI, 3.2, true, true); if (X.sfx.fanfare) X.sfx.fanfare(); for (let i = 0; i < 3; i++) X.after(i * 0.25, () => chime(X, [392, 494, 587][i], 1)); X.shake(4, 0.4); }
    X.after(1.2, () => { S.intro = false; X.banner('THE HELD NOTE', `Stand on the great pad to charge it: ${HN_NEED} seconds fill the ring. Stepping off pauses it (a 2 s latch keeps it trickling)`, CORAL_HI, 4, true, true); });
    const moth = () => S.waveMons.find(m => m.type === 'hushmoth' && !m.dead) || null;
    return { S, pad, horns, latT,
      cam() { return { x: me.x * 0.7 + pad.x * 0.3, y: me.y * 0.7 + (pad.y - 1) * 0.3, k: 0, zoom: 0.56 }; },
      update(dt) { S.ringK += ((pad.charging ? 1 : 0) - S.ringK) * Math.min(1, dt * 4); S.bellRing = Math.max(0, S.bellRing - dt); for (const h of horns) if (!h.cur) h.warn = Math.max(0, h.warn - dt * 2);
        if (S.latOpen) S.lat = Math.min(1, S.lat + dt * 0.6); if (S.intro || S.done) return;
        if (CHO.silenced(pad)) S.silencedSeen += dt;
        // the waves: one at a time; the next once the last is down (and a few seconds' breath)
        if (S.wave > 0 && !S.waveClear[S.wave - 1] && !alive(S.waveMons).length) { S.waveClear[S.wave - 1] = true; S.nextT = 4; if (S.wave < 3) X.banner(`WAVE ${S.wave} IS DOWN`, 'Keep charging: the next wave is coming', CORAL_HI, 2, true); }
        if (S.wave < 3 && (S.wave === 0 || S.waveClear[S.wave - 1])) { S.nextT -= dt; if (S.nextT <= 0) wave(); }
        // a horn aims a broad cone at the holder, now and then, while the note is charging
        if (!pad.full && pad.on && !CHO.silenced(pad) && !(S.coneP && !S.coneP.fired)) { S.coneT -= dt; if (S.coneT <= 0) { S.coneT = HN_CONE_EVERY + Math.random() * 3; cone(); } }
        if (pad.full && S.wave >= 3 && S.waveClear[2]) win(); },
      goal() { if (S.done) return 'To the Resonating Bowl'; if (S.intro) return 'The Held Note'; const ch = `Note ${Math.floor(pad.charge)}/${HN_NEED} s`, w = S.wave ? ` · wave ${S.wave}/3${alive(S.waveMons).length ? ` (${alive(S.waveMons).length} left)` : ' down'}` : '';
        if (CHO.silenced(pad)) return `${ch} · a hush moth silences the pad: hit it to resume charging${w}`;
        if (S.coneP && !S.coneP.fired && !S.coneP.done) return `${ch} · a horn aims at the pad: step off until it strikes (the latch keeps charging)${w}`;
        if (pad.full) return `The ring is full · defeat the waves${w}`;
        return `${ch} · ${pad.on ? 'holding: keep standing on the pad' : pad.latchT > 0 ? 'latched: charging 2 s more' : 'stand on the great pad to charge it'}${w}`; },
      hint() { if (S.done) return null; const m = moth(); if (m && CHO.silenced(pad)) return { x: m.x, y: m.y, h: 1.6, label: 'HIT THE MOTH' }; if (!pad.full && !pad.on && !(S.coneP && !S.coneP.fired)) return { x: pad.x, y: pad.y, h: 0.8, label: 'THE PAD' }; return null; },
      drawGround(c) { const T = X.Tz(), t = g.t, Xs = X.sx(pad.x), Ys = X.sy(pad.y), f = clamp(pad.charge / HN_NEED, 0, 1);
        // the Resonating Bowl seen beyond the lattice: a dark bowl, its gold rim, coral light pooled in it
        { const bx = X.sx(E.x), by = X.sy(E.y - 0.6); c.save(); ell(c, bx, by, T * 5.4, T * 1.6); c.fillStyle = '#0E060C'; c.fill(); c.strokeStyle = GOLD_D; c.lineWidth = T * 0.3; c.stroke(); c.strokeStyle = GOLD; c.lineWidth = T * 0.12; c.stroke(); CHO.glow(c, bx, by, T * 3.4, CORAL, 0.3 + 0.15 * CHO.heart(X).k); ell(c, bx, by + T * 0.2, T * 1.2, T * 0.6); c.fillStyle = '#1D0E1A'; c.fill(); c.restore(); }
        // the great ring round the pad: thirty segments filling with coral light
        const R0 = T * 4.0, R1 = T * 4.7; c.save(); c.beginPath(); c.arc(Xs, Ys, R1, 0, TAU); c.arc(Xs, Ys, R0, 0, TAU, true); c.fillStyle = 'rgba(20,8,16,.5)'; c.fill('evenodd');
        for (let i = 0; i < HN_NEED; i++) { const a0 = -Math.PI / 2 + i / HN_NEED * TAU + 0.02, a1 = -Math.PI / 2 + (i + 1) / HN_NEED * TAU - 0.02, k = clamp(pad.charge - i, 0, 1); if (k <= 0) continue; c.beginPath(); c.arc(Xs, Ys, R1 - 2, a0, a0 + (a1 - a0) * k); c.arc(Xs, Ys, R0 + 2, a0 + (a1 - a0) * k, a0, true); c.closePath(); c.fillStyle = pad.full ? GOLD_HI : rgba(CORAL_HI, 0.75 + 0.25 * S.ringK); c.fill(); }
        c.strokeStyle = rgba(GOLD, 0.8); c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); c.arc(Xs, Ys, R1, 0, TAU); c.stroke(); c.beginPath(); c.arc(Xs, Ys, R0, 0, TAU); c.stroke();
        for (const q of [0, 10, 20]) { const a = -Math.PI / 2 + q / HN_NEED * TAU; c.strokeStyle = GOLD_HI; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs + Math.cos(a) * (R0 - 3), Ys + Math.sin(a) * (R0 - 3)); c.lineTo(Xs + Math.cos(a) * (R1 + 3), Ys + Math.sin(a) * (R1 + 3)); c.stroke(); }
        if (S.ringK > 0.05 && !CHO.lowFx()) CHO.glow(c, Xs + Math.cos(-Math.PI / 2 + f * TAU) * (R0 + R1) / 2, Ys + Math.sin(-Math.PI / 2 + f * TAU) * (R0 + R1) / 2, T * 0.9, CORAL_HI, 0.6 * S.ringK);
        c.restore(); label(c, `${Math.floor(pad.charge)} / ${HN_NEED} s`, Xs, Ys + R1 + T * 0.55, T * 0.38, pad.full ? GOLD_HI : CORAL_HI); },
    };
    function bellsArt(c, Xs, Ys, T) { const t = g.t, f = clamp(pad.charge / HN_NEED, 0, 1), top = Ys - T * 9;
      [-1, 0, 1].forEach((k, i) => { const bx = Xs + k * T * 2.6, by = Ys - T * (3.6 + (i === 1 ? 0.5 : 0)) - S.lat * T * 1.5, sw = (S.bellRing > 0 ? Math.sin(t * 9 + i) * 0.18 * S.bellRing / 3 : 0) + (CHO.lowFx() ? 0 : Math.sin(t * 0.9 + i * 1.7) * 0.03) + (pad.charging ? Math.sin(t * 5 + i) * 0.03 : 0);
        c.save(); c.strokeStyle = 'rgba(26,13,23,.85)'; c.lineWidth = Math.max(2, T * 0.08); c.beginPath(); c.moveTo(bx, top); c.lineTo(bx, by); c.stroke(); c.restore();
        CHO.bell(c, bx, by, T * 2.0, { swing: sw, k: Math.min(1, f * 1.1 + (S.bellRing > 0 ? 0.5 : 0)), lw: lwOf(T) }); }); }
    function latticeArt(c, Xs, Ys, T, w) { const lw = lwOf(T), hgt = T * 2.8, lift = S.lat * T * 3.2, L = Xs - w / 2; c.save(); c.beginPath(); c.rect(L - T, Ys - T * 7, w + T * 2, T * 7); c.clip();
      const top = Ys - hgt - lift, bot = Ys - lift; c.strokeStyle = INK; c.lineWidth = Math.max(3, T * 0.14); const n = 6;
      const bars = () => { c.beginPath(); for (let i = -n; i <= n; i++) { const x = L + i * w / n * 0.5 + w / 2 * 0; c.moveTo(L + (i / n) * w, top); c.lineTo(L + (i / n) * w + hgt, bot); c.moveTo(L + w - (i / n) * w, top); c.lineTo(L + w - (i / n) * w - hgt, bot); } };
      c.save(); c.beginPath(); c.rect(L, top, w, hgt); c.clip(); bars(); c.stroke(); bars(); c.strokeStyle = GOLD; c.lineWidth = Math.max(1.6, T * 0.08); c.stroke(); c.restore();
      c.fillStyle = GOLD; c.fillRect(L - 2, top - T * 0.12, w + 4, T * 0.2); c.fillRect(L - 2, bot - T * 0.12, w + 4, T * 0.2); c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.strokeRect(L - 2, top - T * 0.12, w + 4, T * 0.2); c.strokeRect(L - 2, bot - T * 0.12, w + 4, T * 0.2);
      c.restore(); c.fillStyle = MAROON_D; c.fillRect(L - T * 0.3, Ys - T * 3.4, T * 0.3, T * 3.4); c.fillRect(L + w, Ys - T * 3.4, T * 0.3, T * 3.4);
      if (!S.latOpen) label(c, 'THE GOLD LATTICE', Xs, Ys - T * 3.7, T * 0.24, GOLD_HI); }
  }
  CHO_STAGES.HELDNOTE = { name: 'The Held Note', goal: 'Hold the charge pad for thirty seconds', how: `Three bells hang over a wide charge pad; a great ring round it fills with coral light. Stand on the pad to charge it: ${HN_NEED} seconds in all fill the ring. Stepping off pauses the charge, never erases it, and a 2 s latch keeps it trickling after you step off, so you can step out to swing at a monster. Now and then one of the four horns on the rim aims a broad numbered cone at the pad (a countdown badge, STEP OFF THE PAD): step aside until it strikes, then come back. Three waves come one at a time from the alcoves: three bell mites; two pipe eels and a mite; a hush moth and two mites. The moth settles on the pad and hushes it (no charge) until you hit it. Fill the ring and defeat all three waves, and the bells lift the gold lattice before the Resonating Bowl.`,
    layout: HN_LAYOUT, legend: Object.assign({ E: {}, L: {}, P: {}, h: {}, w: {} }, PIPE_LEGEND), make: makeHeldNote };
})();
