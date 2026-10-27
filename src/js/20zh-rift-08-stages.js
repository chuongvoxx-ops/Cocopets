/* ---------- Rift 08, the Hollow Moon: its three challenge dungeons ----------
   MOON_STAGES.WEIGHING  The Weighing: three great stone scales lie in the ash. Heavy mooncalves leap onto wherever you
                         stand: stand on a scale to lure one, step clear before it lands, and its weight sinks the pan.
                         Three landings weigh a scale down; weigh all three and the moon gate opens.
   MOON_STAGES.TIDERUN   The Tide Run: a silver tide rises up the shaft from below. Climb ahead of it through three
                         caverns; each way up is shut by a moonstone seal: break its seal crystal to pass. The tide hurts
                         and drags at you; it drowns the monsters it reaches. The last seal holds it back.
   MOON_STAGES.SIEGE     The Black Sun Siege: hold the Last Lamp on its terrace in the Moon Castle's pools while the black sun's servants
                         pour out of the water in three waves (50, 70, 90). Umbral shades run to the lamp and drink its light; the
                         rest come for you. Three lotus braziers flare when charged: stand on one to burn everything
                         near it. If the light goes out, stand at the lamp to light it again.
   (the palette MOON and the brood live in 20zi; these make() functions only run once a stage starts) */
const MOON_STAGES = {};
(() => {
  const TAU = Math.PI * 2, P = () => MOON;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a || 0, 0, TAU); };
  const alive = list => list.filter(m => !m.dead).length;
  const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
  function spawnAt(X, type, p, list, aggro) { const q = X.freeSpot(p.x, p.y, 0.45) || p; const m = X.spawnMon(type, q.x, q.y, { pack: 920, rift: true, aggro: !!aggro }); X.g.total++; if (list) list.push(m); return m; }
  // a solid tile that isn't drawn as a wall (something of the stage's own stands there)
  if (!DunWorld.PROPS.blank) DunWorld.PROPS.blank = () => {};
  const block = (X, tx, ty) => { X.M.props.set(ty * X.M.MW + tx, 'blank'); X.setTile(tx, ty, T_SOLID); };
  const unblock = (X, tx, ty, tile) => { X.M.props.delete(ty * X.M.MW + tx); X.setTile(tx, ty, tile == null ? T_FLOOR : tile); };
  const tilesOf = (M, ch) => (M.marks[ch] || []).map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y }));
  function topBar(c, X, y, frac, col, txt) { const W = X.W(), x0 = 18, w = W - 36, h = 14; c.save(); c.fillStyle = 'rgba(16,18,32,.8)'; GFX.rr(c, x0 - 3, y - 3, w + 6, h + 6, 9); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; GFX.rr(c, x0, y, w, h, 7); c.fill(); c.fillStyle = col; GFX.rr(c, x0, y, Math.max(h, w * Math.max(0, Math.min(1, frac))), h, 7); c.fill(); c.restore(); label(c, txt, W / 2, y + h + 17, 13, '#FFFFFF'); }
  function crescent(c, x, y, r, col) { c.save(); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0.6, TAU - 0.6); c.arc(x + r * 0.45, y, r * 0.78, TAU - 0.95, 0.95, true); c.closePath(); c.fill(); c.restore(); }
  // a moon gate: two regolith slabs that slide apart into the walls, with a rune light per lock
  function moonGate(c, X, dx0, dx1, dy, k, lit, n) { const { INK, REG, REG_D, REG_HI, MOONSTONE, GOLD } = P(); const T = X.Tz(), X0 = X.sx(dx0), X1 = X.sx(dx1), Y0 = X.sy(dy) - T * 1.5, Y1 = X.sy(dy + 1), w = (X1 - X0) / 2, sh = k * w;
    c.save(); c.beginPath(); c.rect(X0, Y0 - 6, X1 - X0, Y1 - Y0 + 12); c.clip();
    for (const sd of [-1, 1]) { const lx = sd < 0 ? X0 - sh : X0 + w + sh, gr = c.createLinearGradient(lx, 0, lx + w, 0); gr.addColorStop(0, sd < 0 ? REG_HI : REG); gr.addColorStop(1, sd < 0 ? REG : REG_D); c.fillStyle = gr; c.fillRect(lx, Y0, w, Y1 - Y0); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(lx, Y0, w, Y1 - Y0); c.strokeStyle = 'rgba(169,200,240,.6)'; c.strokeRect(lx + 5, Y0 + 5, w - 10, Y1 - Y0 - 10);
      c.fillStyle = 'rgba(30,32,48,.18)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(lx + w * (0.25 + (i % 2) * 0.45), Y0 + (Y1 - Y0) * (0.25 + i * 0.17), T * 0.09, 0, TAU); c.fill(); } }
    c.restore();
    if (k < 0.6) for (let i = 0; i < n; i++) { const x = X0 + (X1 - X0) * (i + 1) / (n + 1), y = Y0 + (Y1 - Y0) * 0.42, on = i < lit; glowAt(c, x, y, T * 0.65, on ? GOLD : MOONSTONE, (on ? 0.8 : 0.18) * (1 - k)); crescent(c, x, y, T * 0.24, on ? '#FFFFFF' : 'rgba(226,238,255,.45)'); } }

  /* ---- the challenges' own monsters: the moonstone seal (the Tide Run) and the umbral shade (the Siege) ---- */
  Object.assign(MON, {
    moonseal: { name: 'Seal crystal', from: 999, hp: 420, spd: 0, r: 0.7, dmg: 0, xp: 6, coin: 0.5, color: '#A9C8F0', bio: ['shafts'], still: true, tip: 'A moonstone crystal that holds a seal shut. Break it to open the way.', kit: [] },
    umbral: { name: 'Umbral shade', from: 999, hp: 60, spd: 2.5, r: 0.44, dmg: 6, xp: 3, coin: 0.15, color: '#14121E', bio: ['innertide'], tip: 'A shade of the black sun. It runs to the nearest light and drinks it: strike it down first.', kit: [] },
  });
  (() => { const { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt;
    MP.moonseal = (c, r, ph, o) => { const { INK, REG, REG_D, MOONSTONE, MOON_HI, SILVER } = P(); const lw = lwOf(r), k = 0.5 + 0.5 * Math.sin(ph * TAU), h = r * 2.5, w = r * 0.6;
      c.fillStyle = 'rgba(10,12,24,.3)'; ell(c, 0, r * 0.62, r * 1.15, r * 0.34); c.fill();
      // the back half of the turning rune ring
      c.save(); c.strokeStyle = 'rgba(226,238,255,.5)'; c.lineWidth = lw; c.setLineDash([r * 0.3, r * 0.22]); c.lineDashOffset = -ph * r * 4; c.beginPath(); c.ellipse(0, -h * 0.38, r * 1.15, r * 0.36, 0, Math.PI, TAU); c.stroke(); c.restore();
      // a heap of regolith at the foot
      ell(c, 0, r * 0.35, r * 0.95, r * 0.42); c.fillStyle = shade(c, REG, r, -r * 0.3, 0, 0.4); c.fill(); stroke(c, lw);
      glowAt(c, 0, -h * 0.45, r * (1.4 + k * 0.4), MOONSTONE, 0.35 + k * 0.25);
      // the crystal: two faces and a ridge, two small ones at its feet
      for (const [ox, sc] of [[-r * 0.62, 0.45], [r * 0.6, 0.38]]) { c.save(); c.translate(ox, r * 0.25); c.scale(sc, sc); c.beginPath(); c.moveTo(0, -h); c.lineTo(-w, -h * 0.7); c.lineTo(-w, 0); c.lineTo(0, r * 0.25); c.lineTo(w, 0); c.lineTo(w, -h * 0.7); c.closePath(); c.fillStyle = '#7F9FD2'; c.fill(); stroke(c, lw / sc); c.restore(); }
      c.beginPath(); c.moveTo(0, -h); c.lineTo(-w, -h * 0.7); c.lineTo(-w, 0); c.lineTo(0, r * 0.25); c.closePath(); c.fillStyle = '#6F8FC4'; c.fill();
      c.beginPath(); c.moveTo(0, -h); c.lineTo(w, -h * 0.7); c.lineTo(w, 0); c.lineTo(0, r * 0.25); c.closePath(); c.fillStyle = '#C9DDF8'; c.fill();
      c.beginPath(); c.moveTo(0, -h); c.lineTo(-w, -h * 0.7); c.lineTo(-w, 0); c.lineTo(0, r * 0.25); c.lineTo(w, 0); c.lineTo(w, -h * 0.7); c.closePath(); stroke(c, lw);
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(w * 0.45, -h * 0.72); c.lineTo(w * 0.45, -h * 0.15); c.stroke();
      c.fillStyle = MOON_HI; c.globalAlpha = 0.6 + 0.4 * k; crescent(c, -w * 0.45, -h * 0.45, r * 0.2, '#FFFFFF'); c.globalAlpha = 1;
      // the front half of the ring
      c.save(); c.strokeStyle = SILVER; c.lineWidth = lw * 1.1; c.setLineDash([r * 0.3, r * 0.22]); c.lineDashOffset = -ph * r * 4; c.beginPath(); c.ellipse(0, -h * 0.38, r * 1.15, r * 0.36, 0, 0, Math.PI); c.stroke(); c.restore(); };
    /* a little shade of the black sun: a dark disc with a thin gold corona and two hollow eyes, trailing wisps */
    MP.umbral = (c, r, ph, o) => { const { GOLD, GOLD_HI } = P(); const lw = lwOf(r), drink = o.mode === 'block', bob = Math.sin(ph * TAU) * r * 0.12, y0 = -r * 0.75 + bob;
      c.fillStyle = 'rgba(10,12,24,.25)'; ell(c, 0, r * 0.75, r * 0.6, r * 0.18); c.fill();
      for (let i = 0; i < 4; i++) { const a = (i - 1.5) * 0.35, sw = Math.sin(ph * TAU * 2 + i) * r * 0.2; c.strokeStyle = `rgba(20,18,30,${0.55 - i * 0.08})`; c.lineWidth = lw * (1.8 - i * 0.25); c.lineCap = 'round'; c.beginPath(); c.moveTo(Math.sin(a) * r * 0.4, y0 + r * 0.3); c.quadraticCurveTo(Math.sin(a) * r * 0.6 + sw, y0 + r * 0.9, Math.sin(a) * r * 0.5 - sw, y0 + r * 1.35); c.stroke(); }
      glowAt(c, 0, y0, r * 1.5, GOLD, drink ? 0.7 : 0.5);
      c.beginPath(); c.arc(0, y0, r * 0.6, 0, TAU); c.fillStyle = '#0A0A12'; c.fill(); c.strokeStyle = GOLD_HI; c.lineWidth = lw * 1.3; c.stroke();
      c.strokeStyle = 'rgba(255,240,184,.85)'; c.lineWidth = lw * 0.8; for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * r * 0.22, y0 - r * 0.02, r * 0.11, 0, TAU); c.stroke(); }
      if (drink) { c.fillStyle = 'rgba(255,240,184,.85)'; c.beginPath(); c.arc(0, y0 + r * 0.25, r * 0.08, 0, TAU); c.fill(); } };
    Object.assign(EXT, { moonseal: 3.6, umbral: 2.6 }); Object.assign(NF, { moonseal: 4, umbral: 6 });
  })();
  DunAI.mon.moonseal = () => {};
  let SIEGE = null;   // the lamp under siege (the shades run to it)
  DunAI.mon.umbral = (m, A, X) => { const L = SIEGE; m.drink = false;
    if (!L || L.out || L.over) { m.mode = null; if (A.d > 0.9) A.steer(A.sp); return; }
    const dx = L.x - m.x, dy = L.y - m.y, d = Math.hypot(dx, dy) || 1; m.face = dx >= 0 ? 1 : -1;
    if (d > L.r + m.r + 0.25) { m.mode = null; X.moveEnt(m, dx / d * A.sp * A.dt, dy / d * A.sp * A.dt); return; }
    m.mode = 'block'; m.drink = true; };

  /* ======================= THE WEIGHING ======================= */
  const WEI_LAYOUT = (() => { const W = 30, Hh = 33, g = grid(W, Hh, '~');
    for (let x = 12; x <= 16; x++) g[3][x] = '.';
    for (let y = 4; y <= 6; y++) for (let x = 0; x < W; x++) g[y][x] = x >= 12 && x <= 16 ? (y === 6 ? 'd' : '.') : '#';
    for (let y = 7; y <= 31; y++) for (let x = 0; x < W; x++) g[y][x] = x === 0 || x === W - 1 ? '#' : '.';
    g[32].fill('#'); g[4][14] = 'E';
    g[12][6] = 'P'; g[12][23] = 'P'; g[22][14] = 'P'; g[30][14] = 'S';
    [[3, 9], [26, 9], [3, 28], [26, 28], [14, 15]].forEach(([x, y]) => { g[y][x] = 'g'; });
    return g.map(r => r.join('')); })();
  const NEED = 3, PLATE_R = 1.8;
  function makeWeighing(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { INK, REG, REG_D, REG_HI, MOONSTONE, MOON_HI, GOLD, GOLD_HI, INDIGO } = P();
    const E = mk.E[0], door = tilesOf(M, 'd'); door.forEach(t => block(X, t.tx, t.ty));
    const dx0 = Math.min(...door.map(t => t.tx)), dx1 = Math.max(...door.map(t => t.tx)) + 1, dy = door[0].ty;
    const plates = mk.P.slice().sort((a, b) => a.y - b.y || a.x - b.x).map((p, i) => ({ i, x: p.x, y: p.y, w: 0, lock: false, sink: 0, flash: 0, lockK: 0 }));
    // an obelisk stands behind each scale (its rune bands light with the weight)
    plates.forEach(pl => { pl.ox = Math.floor(pl.x) + 0.5; pl.oy = Math.floor(pl.y) - 2.5; block(X, Math.floor(pl.x), Math.floor(pl.y) - 3); });
    const S = { intro: true, calves: [], mobs: [], spawnT: 0.5, mobT: 7, locked: 0, open: false, openK: 0, landed: 0, missTip: false };
    const CALVES = () => 3 + (S.locked ? 1 : 0);
    function calf() { const sp = mk.g[Math.floor(Math.random() * mk.g.length)]; const m = spawnAt(X, 'mooncalf', { x: sp.x + (Math.random() - 0.5) * 1.5, y: sp.y + (Math.random() - 0.5) * 1.5 }, S.calves, true);
      m.hp = m.maxhp = Math.round(m.maxhp * 3); m.bname = 'Heavy mooncalf'; m.heavy = true; m.cd = 1 + Math.random() * 1.5; X.ring(m.x, m.y, 0.2, 1.6, 0.35, REG_HI, 0.4); }
    function lockPlate(pl) { pl.lock = true; S.locked++; X.sfx.fanfare && X.sfx.fanfare(); X.boom(pl.x, pl.y - 0.4, 1.8, GOLD, '#FFFFFF', { n: 22, shake: 6 });
      if (S.locked >= plates.length) { X.banner('THE SCALES ARE WEIGHED', 'The moon gate grinds open', GOLD_HI, 2.6, true, true); X.after(1.0, openDoor); }
      else X.banner(`SCALE ${S.locked} OF 3 WEIGHED`, S.locked === 1 ? 'Another heavy mooncalf joins the hunt' : 'One more', GOLD_HI, 2.2, true); }
    function openDoor() { if (S.open) return; S.open = true; self.done = true; MOON.onLand = null; door.forEach(t => unblock(X, t.tx, t.ty)); X.retile(); H.setExit(E.x, E.y, 'To the Great Crater'); X.shake(6, 0.5);
      for (const m of [...S.calves, ...S.mobs]) if (!m.dead) X.killMon(m); }
    // a heavy mooncalf's landing: inside an unweighed scale it adds its weight
    MOON.onLand = (m, x, y) => { if (self.done || !S.calves.includes(m)) return; const pl = plates.find(p => !p.lock && Math.hypot(x - p.x, y - p.y) < PLATE_R + 0.15);
      if (!pl) return; S.landed++; pl.w++; pl.flash = 1; X.ring(pl.x, pl.y, 0.4, PLATE_R + 0.4, 0.4, GOLD_HI, 0.5); X.text(pl.x, pl.y - 1.8, pl.w >= NEED ? 'WEIGHED!' : `${pl.w}/${NEED}`, GOLD_HI, 16);
      if (pl.w >= NEED) lockPlate(pl); };
    X.after(1.2, () => { S.intro = false; X.banner('THE WEIGHING', 'Stand on a scale: the heavy mooncalves leap where you stand. Step clear, and their weight sinks the pan', GOLD_HI, 3.8, true, true); });
    // the obelisks behind the scales
    plates.forEach(pl => H.obj({ x: pl.ox, y: pl.oy + 0.4, kind: 'obelisk', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { const t = g.t, hgt = T * 3.1, bw = T * 0.42, tw = T * 0.26;
      c.save(); c.fillStyle = 'rgba(10,12,24,.3)'; ell(c, Xs, Ys, T * 0.7, T * 0.24); c.fill();
      c.beginPath(); c.moveTo(Xs - bw, Ys); c.lineTo(Xs - tw, Ys - hgt); c.lineTo(Xs, Ys - hgt - T * 0.35); c.lineTo(Xs + tw, Ys - hgt); c.lineTo(Xs + bw, Ys); c.closePath();
      const gr = c.createLinearGradient(Xs - bw, 0, Xs + bw, 0); gr.addColorStop(0, '#3A3A52'); gr.addColorStop(0.55, INDIGO); gr.addColorStop(1, '#1E1C38'); c.fillStyle = gr; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
      c.strokeStyle = 'rgba(169,200,240,.25)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(Xs + bw * 0.15, Ys - T * 0.1); c.lineTo(Xs + tw * 0.15, Ys - hgt + T * 0.1); c.stroke();
      for (let k = 0; k < NEED; k++) { const y = Ys - hgt * (0.22 + k * 0.24), on = pl.lock || k < pl.w, ww = bw - (bw - tw) * (0.22 + k * 0.24); if (on) glowAt(c, Xs, y, T * 0.7, GOLD, 0.55 + (pl.lock ? 0.2 * Math.sin(t * 3 + k) : 0)); c.fillStyle = on ? GOLD_HI : 'rgba(169,200,240,.35)'; c.fillRect(Xs - ww * 0.75, y - T * 0.05, ww * 1.5, T * 0.1); crescent(c, Xs, y - T * 0.18, T * 0.07, on ? '#FFFFFF' : 'rgba(226,238,255,.4)'); }
      c.restore(); } }));
    return { S, plates, get hook() { return MOON.onLand; },
      cam() { return { x: me.x, y: me.y - 0.6, k: 0, zoom: 0.72 }; },
      update(dt) { if (S.intro) return;
        for (const pl of plates) { pl.sink += ((pl.lock ? 1 : pl.w / NEED) - pl.sink) * Math.min(1, dt * 4); if (pl.flash > 0) pl.flash -= dt * 1.5; if (pl.lock) pl.lockK = Math.min(1, pl.lockK + dt); }
        if (self.done) { S.openK = Math.min(1, S.openK + dt * 0.8); return; }
        S.calves = S.calves.filter(m => !m.dead); S.mobs = S.mobs.filter(m => !m.dead);
        S.spawnT -= dt; if (S.spawnT <= 0 && S.calves.length < CALVES()) { S.spawnT = S.calves.length < 2 ? 0.8 : 2.2; calf(); }
        S.mobT -= dt; if (S.mobT <= 0) { S.mobT = 10; if (S.mobs.length < 4) for (let k = 0; k < 2; k++) { const sp = mk.g[Math.floor(Math.random() * mk.g.length)]; spawnAt(X, Math.random() < 0.5 ? 'craterwisp' : 'dustwraith', sp, S.mobs, true); } }
        // a calf that lands beside a scale: a nudge about where to stand
        if (!S.missTip && g.t > 40 && S.landed === 0) { S.missTip = true; X.banner('LURE THEM ONTO THE SCALES', 'Stand in a scale\'s circle until a calf crouches, then roll clear', GOLD_HI, 2.6, true); } },
      goal() { if (self.done) return 'To the Great Crater'; if (S.intro) return 'The Weighing'; return `Scales weighed ${S.locked}/3 · lure the heavy mooncalves onto them`; },
      hint() { if (self.done) return null; if (plates.some(p => !p.lock && Math.hypot(me.x - p.x, me.y - p.y) < PLATE_R)) return null; let best = null, bd = 1e9; for (const p of plates) { if (p.lock) continue; const d = Math.hypot(me.x - p.x, me.y - p.y); if (d < bd) { bd = d; best = p; } } return best; },
      drawGround(c) { const T = X.Tz(), t = g.t;
        // the threads of moonlight from the scales to the gate: they light as each scale is weighed
        for (const pl of plates) { c.save(); c.lineCap = 'round'; c.strokeStyle = pl.lock ? 'rgba(255,240,184,.55)' : 'rgba(169,200,240,.18)'; c.lineWidth = pl.lock ? 3 : 2; c.setLineDash([T * 0.25, T * 0.3]); c.lineDashOffset = -t * T * (pl.lock ? 2 : 0.5); c.beginPath(); c.moveTo(X.sx(pl.x), X.sy(pl.y)); c.quadraticCurveTo(X.sx((pl.x + 14.5) / 2), X.sy((pl.y + dy) / 2 + 2), X.sx(14.5), X.sy(dy + 1)); c.stroke(); c.restore(); }
        for (const pl of plates) { const Xs = X.sx(pl.x), Ys = X.sy(pl.y), R = PLATE_R * T, sk = pl.sink * T * 0.16, on = !pl.lock && Math.hypot(me.x - pl.x, me.y - pl.y) < PLATE_R;
          c.save(); c.fillStyle = 'rgba(10,12,24,.35)'; ell(c, Xs, Ys + T * 0.12, R * 1.1, R * 0.52); c.fill();
          ell(c, Xs, Ys, R, R * 0.47); c.fillStyle = REG_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
          // the pan, sinking under its weight
          const gr = c.createLinearGradient(Xs, Ys - R * 0.4, Xs, Ys + R * 0.4); gr.addColorStop(0, pl.lock ? '#F2E6C4' : REG_HI); gr.addColorStop(1, pl.lock ? '#C9B27A' : REG); ell(c, Xs, Ys + sk, R * 0.82, R * 0.37); c.fillStyle = gr; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
          if (sk > 1) { c.save(); ell(c, Xs, Ys + sk, R * 0.82, R * 0.37); c.clip(); c.fillStyle = 'rgba(20,22,36,.35)'; ell(c, Xs, Ys + sk - R * 0.37 + sk * 0.5, R * 0.86, sk * 1.2 + 2); c.fill(); c.restore(); }
          c.strokeStyle = 'rgba(30,32,48,.3)'; c.lineWidth = 1.5; ell(c, Xs, Ys + sk, R * 0.55, R * 0.25); c.stroke();
          crescent(c, Xs - R * 0.05, Ys + sk, R * 0.17, pl.lock ? '#FFFFFF' : 'rgba(46,42,90,.55)');
          // its three weights round the rim
          for (let k = 0; k < NEED; k++) { const a = Math.PI * (1.2 + k * 0.3), x = Xs + Math.cos(a) * R * 0.92, y = Ys + Math.sin(a) * R * 0.44, full = pl.lock || k < pl.w; if (full) glowAt(c, x, y, T * 0.55, GOLD, 0.7); c.fillStyle = full ? GOLD_HI : '#5A5E70'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y - T * 0.16); c.lineTo(x + T * 0.12, y); c.lineTo(x, y + T * 0.1); c.lineTo(x - T * 0.12, y); c.closePath(); c.fill(); c.stroke(); }
          if (pl.lock) glowAt(c, Xs, Ys + sk, R * 1.25, GOLD, 0.28 * pl.lockK + 0.1 * Math.sin(t * 2));
          if (pl.flash > 0) glowAt(c, Xs, Ys, R * 1.4, MOON_HI, pl.flash * 0.6);
          if (on) { c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.setLineDash([8, 7]); c.lineDashOffset = -t * 24; ell(c, Xs, Ys, R * 1.04, R * 0.49); c.stroke(); }
          c.restore();
          if (!pl.lock) label(c, on ? 'A CALF WILL LEAP · STEP CLEAR!' : `${pl.w}/${NEED}`, Xs, Ys + R * 0.72, T * (on ? 0.26 : 0.32), on ? '#FFFFFF' : GOLD_HI); }
        moonGate(c, X, dx0, dx1, dy, S.openK, S.locked, 3); },
    };
  }
  MOON_STAGES.WEIGHING = { name: 'The Weighing', goal: 'Weigh down the three scales', how: `Three great stone scales lie in the ash before the moon gate. Heavy mooncalves leap onto wherever you stand: stand inside a scale's circle, and when a calf crouches (its landing circle shows) roll or step clear. Its weight sinks the pan. ${NEED} landings weigh a scale down; weigh all three and the gate opens. Don't be under it when it lands. Crater wisps and dust wraiths come to bother you meanwhile.`,
    layout: WEI_LAYOUT, legend: { E: {}, d: {}, P: {}, g: {} }, make: makeWeighing };

  /* ======================= THE TIDE RUN ======================= */
  const TIDE_LAYOUT = (() => { const W = 30, Hh = 66, g = grid(W, Hh, '#'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; }, put = (x, y, ch) => { g[y][x] = ch; };
    rect(5, 56, 24, 63); rect(12, 50, 17, 55);
    rect(3, 40, 26, 49); rect(9, 43, 20, 46, '~'); rect(14, 43, 15, 46, '=');
    rect(20, 33, 24, 39);
    rect(3, 24, 26, 32); rect(4, 27, 9, 29, '~'); rect(17, 28, 22, 30, '~');
    rect(4, 17, 8, 23);
    rect(3, 7, 26, 16); rect(11, 10, 17, 13, '~');
    rect(20, 4, 24, 6); rect(10, 1, 25, 3);
    for (let x = 20; x <= 24; x++) put(x, 36, 'd'); for (let x = 4; x <= 8; x++) put(x, 20, 'f'); for (let x = 20; x <= 24; x++) put(x, 5, 'h');
    put(14, 61, 'S'); put(13, 2, 'E'); put(17, 41, 'k'); put(11, 25, 'k'); put(17, 8, 'k');
    [[5, 41], [25, 41], [5, 48], [25, 48]].forEach(([x, y]) => put(x, y, 'a')); [[5, 25], [25, 25], [13, 31], [25, 31]].forEach(([x, y]) => put(x, y, 'b')); [[5, 8], [25, 8], [25, 15], [5, 15]].forEach(([x, y]) => put(x, y, 'c'));
    return g.map(r => r.join('')); })();
  const TIDE_WAVES = [['dustwraith', 'craterwisp'], ['mooncalf', 'craterwisp', 'dustwraith'], ['craterwisp', 'dustwraith', 'mooncalf', 'craterwisp']], TIDE_IN = [50, 33, 17];
  function makeTideRun(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { TIDE_HI, MOON_HI, MOONSTONE, GOLD_HI } = P();
    const E = mk.E[0];
    const gates = ['d', 'f', 'h'].map((ch, i) => { const tiles = tilesOf(M, ch); tiles.forEach(t => block(X, t.tx, t.ty)); return { i, tiles, x0: Math.min(...tiles.map(t => t.tx)), x1: Math.max(...tiles.map(t => t.tx)) + 1, y: tiles[0].ty, open: false, k: 0 }; });
    const seals = mk.k.slice().sort((a, b) => b.y - a.y).map((p, i) => { const m = spawnAt(X, 'moonseal', p, null, false); m.aggro = false; m.seal = i; return m; });
    const S = { intro: true, started: false, grace: 4.5, tideY: M.MH - 1.2, hurtT: 0, entered: [false, false, false], mobs: [], done: false, gates, seals, opened: 0 };
    X.after(1.2, () => { S.intro = false; X.banner('THE TIDE RUN', 'A silver tide is rising up the shaft: climb! Break each seal crystal to open the way up', TIDE_HI, 3.4, true, true); });
    function openGate(gt) { if (gt.open) return; gt.open = true; S.opened++; gt.tiles.forEach(t => unblock(X, t.tx, t.ty)); X.retile(); X.shake(5, 0.4); X.sfx.fanfare && X.sfx.fanfare();
      if (gt.i === gates.length - 1) { S.done = true; self.done = true; H.setExit(E.x, E.y, 'To the Moonstone Deep'); X.banner('THE TIDE BREAKS', 'The last seal holds it back', MOON_HI, 2.6, true, true); for (const m of S.mobs) if (!m.dead) X.killMon(m); }
      else X.text((gt.x0 + gt.x1) / 2, gt.y - 1, `Seal ${gt.i + 1} broken · climb!`, MOON_HI, 16); }
    return { S, gates, seals,
      cam() { return { x: me.x, y: me.y - 2, k: 0, zoom: 0.72 }; },
      update(dt) { if (S.intro) return;
        for (const gt of gates) { if (!gt.open && seals[gt.i].dead) openGate(gt); if (gt.open) gt.k = Math.min(1, gt.k + dt * 0.9); }
        if (S.done) { S.tideY = Math.min(M.MH + 2, S.tideY + dt * 2.5); return; }
        // the caverns ahead spring their ambushes as you climb into them
        for (let k = 0; k < 3; k++) if (!S.entered[k] && me.y < TIDE_IN[k]) { S.entered[k] = true; const mix = TIDE_WAVES[k]; (mk['abc'[k]] || []).forEach((p, n) => { spawnAt(X, mix[n % mix.length], p, S.mobs, true); spawnAt(X, mix[(n + 1) % mix.length], { x: p.x + 1, y: p.y }, S.mobs, true); }); }
        if (!S.started) { S.grace -= dt; if (S.grace <= 0) { S.started = true; X.banner('THE TIDE RISES', 'Stay ahead of it: it hurts and drags you down', TIDE_HI, 2.2, true); } return; }
        // the tide: fast while you're far ahead of it, slow when it's at your heels
        const gap = S.tideY - me.y, v = gap > 14 ? 1.6 : gap > 9 ? 0.85 : gap > 4 ? 0.5 : 0.3; S.tideY = Math.max(2, S.tideY - v * dt);
        if (!me.dead && me.y > S.tideY + 0.1) { X.moveEnt(me, 0, 1.0 * dt); S.hurtT -= dt; if (S.hurtT <= 0) { S.hurtT = 0.6; S.tideHits = (S.tideHits || 0) + 1; X.hurtPet(X.ST().hp * 0.07, null); X.text(me.x, me.y - 1.3, 'The tide!', TIDE_HI, 12); } } else S.hurtT = Math.min(S.hurtT, 0.25);
        for (const m of X.mons) if (!m.dead && !m.boss && m.type !== 'moonseal' && m.y > S.tideY + 0.7) { X.boom(m.x, m.y - 0.3, 0.7, TIDE_HI, '#FFFFFF', { n: 8, shake: 0 }); X.killMon(m); } },
      goal() { if (self.done) return 'To the Moonstone Deep'; if (S.intro) return 'The Tide Run'; const below = Math.max(0, S.tideY - me.y); return `Seals broken ${S.opened}/3 · ${!S.started ? 'the tide is coming: climb!' : below < 0.2 ? 'IN THE TIDE: climb out!' : `the tide is ${Math.round(below)} m below`}`; },
      hint() { if (self.done) return null; const gt = gates.find(q => !q.open); if (!gt) return null; const m = seals[gt.i]; return m && !m.dead ? m : null; },
      drawGround(c) { const T = X.Tz(), t = g.t;
        for (const gt of gates) { const X0 = X.sx(gt.x0), X1 = X.sx(gt.x1), Yb = X.sy(gt.y + 1), Y0 = Yb - T * 1.7, k = gt.k; if (k >= 1) continue;
          // a moonstone seal: a pane of pale crystal across the passage, its edges soft
          c.save(); c.globalAlpha = 1 - k; const gr = c.createLinearGradient(0, Y0, 0, Yb); gr.addColorStop(0, 'rgba(169,200,240,0)'); gr.addColorStop(0.25, 'rgba(169,200,240,.55)'); gr.addColorStop(1, 'rgba(110,140,200,.75)'); c.fillStyle = gr; c.fillRect(X0, Y0, X1 - X0, Yb - Y0);
          c.strokeStyle = 'rgba(226,238,255,.55)'; c.lineWidth = 1.5; for (let i = 1; i < 5; i++) { const x = X0 + (X1 - X0) * i / 5; c.beginPath(); c.moveTo(x, Yb); c.lineTo(x + Math.sin(i * 2.3) * T * 0.2, Y0 + T * 0.35); c.stroke(); }
          c.restore(); glowAt(c, (X0 + X1) / 2, Yb - T * 0.8, T * 1.3, MOONSTONE, 0.35 * (1 - k) + 0.1 * Math.sin(t * 3)); crescent(c, (X0 + X1) / 2, Yb - T * 0.8, T * 0.28, `rgba(255,255,255,${0.8 * (1 - k)})`);
          // a dotted thread from the seal to its crystal
          const m = seals[gt.i]; if (m && !m.dead) { c.save(); c.strokeStyle = 'rgba(169,200,240,.5)'; c.lineWidth = 2; c.setLineDash([4, 8]); c.lineDashOffset = -t * 16; c.beginPath(); c.moveTo((X0 + X1) / 2, Yb - T * 0.4); c.lineTo(X.sx(m.x), X.sy(m.y) - T * 0.8); c.stroke(); c.restore(); } } },
      drawOver(c) { const T = X.Tz(), W = X.W(), Hh = X.H(), y = X.sy(S.tideY), t = g.t; if (y > Hh + T * 2) return;
        // the silver tide: its top feathers to nothing; a wavering surface; foam sparkles along the crest
        const top = y - T * 1.1; c.save(); const gr = c.createLinearGradient(0, top, 0, y + T * 3.5); gr.addColorStop(0, 'rgba(127,216,224,0)'); gr.addColorStop(0.24, 'rgba(127,216,224,.3)'); gr.addColorStop(0.55, 'rgba(70,130,160,.5)'); gr.addColorStop(1, 'rgba(30,58,72,.64)');
        c.fillStyle = gr; c.beginPath(); c.moveTo(0, Hh); c.lineTo(0, top); for (let x = 0; x <= W + 12; x += 12) c.lineTo(x, top + Math.sin(x * 0.03 + t * 2) * T * 0.14 + Math.sin(x * 0.011 - t * 1.3) * T * 0.12); c.lineTo(W, Hh); c.closePath(); c.fill(); c.restore();
        for (let i = 0; i < 14; i++) { const x = ((i * 97 + t * 26 * (i % 2 ? 1 : -1)) % (W + 40) + W + 40) % (W + 40) - 20, yy = y - T * 0.2 + Math.sin(x * 0.03 + t * 2) * T * 0.14; glowAt(c, x, yy, T * (0.35 + (i % 3) * 0.12), MOON_HI, 0.35 + 0.25 * Math.sin(t * 4 + i)); }
        if (!S.done && S.started && y < Hh - 320) label(c, '▼ THE TIDE ▼', W - 70, Math.max(150, y - T * 0.4), 12, TIDE_HI); },
    };
  }
  MOON_STAGES.TIDERUN = { name: 'The Tide Run', goal: 'Outrun the tide', how: 'A silver tide is rising up the moon\'s shaft from below. Climb ahead of it through three caverns. Each way up is shut by a moonstone seal: break its seal crystal (the dotted thread shows which) to open it. The tide hurts and drags at you while you\'re in it, and it drowns any monster it reaches. It rises fast while you\'re far ahead and slows when it\'s at your heels. Crater wisps pull you back towards it: careful. The last seal holds the tide back.',
    layout: TIDE_LAYOUT, legend: { E: {}, d: {}, f: {}, h: {}, k: {}, a: {}, b: {}, c: {} }, make: makeTideRun };

  /* ======================= THE BLACK SUN SIEGE ======================= */
  const SIEGE_LAYOUT = (() => { const W = 34, Hh = 46, g = grid(W, Hh, '~'), cx = 17.5, cy = 22.5, R = 11.5;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 1.05) < R) g[y][x] = '.';
    for (let y = 2; y <= 5; y++) for (let x = 13; x <= 21; x++) g[y][x] = '.';
    g[3][17] = 'E'; g[21][17] = 'L'; g[31][17] = 'S';
    [210, 330, 90].forEach(a => { const r = a * Math.PI / 180; g[Math.round(21 + Math.sin(r) * 6)][Math.round(17 + Math.cos(r) * 6.4)] = 'o'; });
    return g.map(r => r.join('')); })();
  const SIEGE_N = [50, 70, 90], SIEGE_CAP = 36, FLARE_R = 4.6, LOTUS_CD = 16;
  const SIEGE_MIX = [['tideling', 'eclipsemoth', 'tideling'], ['tideling', 'eclipsemoth', 'mooncalf', 'craterwisp'], ['tideling', 'eclipsemoth', 'mooncalf', 'craterwisp', 'dustwraith']];
  function makeSiege(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { INK, PEARL, ROSE, SILVER, GOLD, GOLD_HI, TIDE_HI, MOON_HI } = P();
    const E = mk.E[0], Lm = mk.L[0]; block(X, Lm.tx, Lm.ty);
    const lamp = { x: Lm.x, y: Lm.y, r: 0.85, light: 100, out: false, over: false, relit: 0 }; SIEGE = lamp;
    const lotus = mk.o.map((p, i) => ({ i, x: p.x, y: p.y, ch: 0.6, hold: 0, flareT: 0 }));
    // the shore: floor near the island's rim (not by the north landing)
    const shore = []; for (let ty = 0; ty < M.MH; ty++) for (let tx = 0; tx < M.MW; tx++) { if (X.tileAt(tx, ty) !== T_FLOOR) continue; const x = tx + 0.5, y = ty + 0.5; if (y < 8) continue; if (Math.hypot(x - 18.5, (y - 23.5) * 1.05) > 9.6 && !(y < 15 && Math.abs(x - 18.5) < 3)) shore.push({ x, y }); }
    const S = { intro: true, wave: -1, waveT: 3.5, poured: 0, mobs: [], spawnT: 0, herald: null, done: false, flares: 0, burned: 0, outs: 0 };
    X.after(1.2, () => { S.intro = false; X.banner('THE BLACK SUN SIEGE', 'Hold the Last Lamp! Umbral shades come to drink its light. Stand on a lit lotus to FLARE', GOLD_HI, 3.6, true, true); });
    function startWave() { S.wave++; S.poured = 0; S.spawnT = 0.3; X.banner(`WAVE ${S.wave + 1} OF 3`, `${SIEGE_N[S.wave]} pour out of the dark water`, '#FF9BB0', 2.2, true); X.shake(5, 0.4); }
    function spawnOne() { const p = shore[Math.floor(Math.random() * shore.length)], mix = SIEGE_MIX[S.wave];
      const herald = S.wave === 2 && !S.herald && S.poured === Math.floor(SIEGE_N[2] * 0.3);
      const type = herald || Math.random() < 0.4 ? 'umbral' : mix[Math.floor(Math.random() * mix.length)];
      const m = spawnAt(X, type, p, S.mobs, true); S.poured++; X.ring(m.x, m.y, 0.2, 1.2, 0.3, TIDE_HI, 0.35);
      if (type === 'umbral') m.drinkK = 0.9;
      if (herald) { m.hp = m.maxhp = Math.round(m.maxhp * 14); m.r = 0.9; m.dmg = Math.round(m.dmg * 2); m.spd *= 0.8; m.drinkK = 6; m.bname = 'The Umbral Herald'; m.herald = true; S.herald = m; X.banner('THE UMBRAL HERALD', 'A great shade, and it drinks fast: stop it reaching the lamp', '#FF9BB0', 2.4, true); X.shake(6, 0.4); } }
    function flare(l) { l.ch = 0; l.hold = 0; l.flareT = 1; S.flares++; X.sfx.fanfare && X.sfx.fanfare(); X.boom(l.x, l.y - 0.6, 2.2, GOLD, '#FFFFFF', { n: 30, shake: 7 }); X.ring(l.x, l.y, 0.4, FLARE_R, 0.5, GOLD_HI, 0.5);
      let n = 0; for (const m of X.mons) { if (m.dead || m.boss || m.fobj || Math.hypot(m.x - l.x, m.y - l.y) > FLARE_R + m.r) continue; n++; X.hitMon(m, m.maxhp * (m.type === 'umbral' && !m.herald ? 3 : 0.85), { flat: true }); }
      S.burned += n; X.text(l.x, l.y - 2, n >= 2 ? `BURNED ×${n}!` : 'FLARE!', GOLD_HI, n >= 2 ? 18 : 14); }
    function win() { if (S.done) return; S.done = true; lamp.over = true; self.done = true; { let y = E.ty + 1; while (y < M.MH && X.tileAt(E.tx, y) === T_FLOOR) y++; while (y < M.MH && X.tileAt(E.tx, y) !== T_FLOOR) { for (let dx = -1; dx <= 1; dx++) X.setTile(E.tx + dx, y, T_BRIDGE); y++; } }   /* a bridge from the landing down to the island */ X.retile(); H.setExit(E.x, E.y, 'To the Marble Gardens');
      X.banner('THE LIGHT HOLDS', 'The black sun turns its face away; a marble causeway rises from the pool', GOLD_HI, 3, true, true); X.sfx.fanfare && X.sfx.fanfare(); X.shake(6, 0.5); for (const m of S.mobs) if (!m.dead) X.killMon(m); }
    // the Last Lamp: a pearl spire with a lantern of gold light
    H.obj({ x: lamp.x, y: lamp.y + 0.35, kind: 'lamp', r: 0.1, h: 4, label: '', draw(c, Xs, Ys, T) { const t = g.t, k = lamp.out ? 0 : lamp.light / 100, hgt = T * 2.7, top = Ys - hgt - T * 0.6;
      c.save(); c.fillStyle = 'rgba(10,12,24,.35)'; ell(c, Xs, Ys, T * 1.1, T * 0.38); c.fill();
      for (const [w, y] of [[1.0, 0], [0.78, -0.22]]) { ell(c, Xs, Ys + T * y, T * w, T * w * 0.36); const gr = c.createLinearGradient(Xs - T * w, 0, Xs + T * w, 0); gr.addColorStop(0, '#D8CFE0'); gr.addColorStop(0.5, PEARL); gr.addColorStop(1, '#A89CB8'); c.fillStyle = gr; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); }
      c.beginPath(); c.moveTo(Xs - T * 0.4, Ys - T * 0.25); c.lineTo(Xs - T * 0.24, Ys - hgt); c.lineTo(Xs + T * 0.24, Ys - hgt); c.lineTo(Xs + T * 0.4, Ys - T * 0.25); c.closePath(); const g2 = c.createLinearGradient(Xs - T * 0.4, 0, Xs + T * 0.4, 0); g2.addColorStop(0, '#B8AEC8'); g2.addColorStop(0.45, PEARL); g2.addColorStop(1, '#9A8EAE'); c.fillStyle = g2; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      c.save(); c.clip(); c.strokeStyle = 'rgba(232,144,184,.35)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const y = Ys - T * 0.25 - i * hgt / 6; c.beginPath(); c.moveTo(Xs - T * 0.45, y); c.quadraticCurveTo(Xs, y - T * 0.35, Xs + T * 0.45, y - T * 0.5); c.stroke(); } c.restore();
      ell(c, Xs, Ys - hgt, T * 0.5, T * 0.16); c.fillStyle = '#C9C0D6'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
      if (k > 0) glowAt(c, Xs, top, T * (1.6 + k * 1.6), GOLD, 0.35 + k * 0.45 + 0.08 * Math.sin(t * 3));
      c.beginPath(); c.arc(Xs, top, T * 0.3, 0, TAU); c.fillStyle = k > 0 ? GOLD_HI : '#3A3848'; c.fill();
      c.strokeStyle = SILVER; c.lineWidth = 2; for (const sd of [-1, -0.35, 0.35, 1]) { c.beginPath(); c.moveTo(Xs + sd * T * 0.42, Ys - hgt); c.quadraticCurveTo(Xs + sd * T * 0.55, top - T * 0.1, Xs, top - T * 0.6); c.stroke(); }
      c.fillStyle = SILVER; c.beginPath(); c.arc(Xs, top - T * 0.62, T * 0.07, 0, TAU); c.fill();
      c.restore();
      if (lamp.out) { label(c, 'THE LIGHT IS OUT · STAND HERE', Xs, Ys + T * 0.9, T * 0.27, '#FFFFFF'); if (lamp.relit > 0) { c.save(); c.strokeStyle = GOLD_HI; c.lineWidth = 4; c.beginPath(); c.arc(Xs, top, T * 0.55, -Math.PI / 2, -Math.PI / 2 + lamp.relit / 2.2 * TAU); c.stroke(); c.restore(); } } } });
    // the lotus braziers
    lotus.forEach(l => H.obj({ x: l.x, y: l.y + 0.2, kind: 'lotus', r: 0.1, h: 1.2, label: '', draw(c, Xs, Ys, T) { const t = g.t, ready = l.ch >= 1;
      c.save(); c.fillStyle = 'rgba(10,12,24,.3)'; ell(c, Xs, Ys, T * 0.85, T * 0.3); c.fill();
      ell(c, Xs, Ys - T * 0.1, T * 0.7, T * 0.25); c.fillStyle = '#5A5470'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      for (let i = 0; i < 7; i++) { const a = -Math.PI + (i + 0.5) / 7 * Math.PI, px = Xs + Math.cos(a) * T * 0.38, py = Ys - T * 0.35 + Math.sin(a) * T * 0.1; c.save(); c.translate(px, py); c.rotate(a + Math.PI / 2); c.beginPath(); c.moveTo(0, T * 0.12); c.quadraticCurveTo(-T * 0.16, -T * 0.15, 0, -T * 0.42); c.quadraticCurveTo(T * 0.16, -T * 0.15, 0, T * 0.12); c.closePath(); c.fillStyle = i % 2 ? PEARL : '#F2D8E6'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); c.restore(); }
      if (ready) { glowAt(c, Xs, Ys - T * 0.7, T * 1.3, GOLD, 0.55 + 0.25 * Math.sin(t * 5 + l.i)); c.fillStyle = GOLD_HI; c.beginPath(); c.moveTo(Xs, Ys - T * 1.05 - Math.sin(t * 9) * T * 0.05); c.quadraticCurveTo(Xs + T * 0.16, Ys - T * 0.6, Xs, Ys - T * 0.5); c.quadraticCurveTo(Xs - T * 0.16, Ys - T * 0.6, Xs, Ys - T * 1.05); c.fill(); }
      c.strokeStyle = ready ? GOLD_HI : 'rgba(255,240,184,.55)'; c.lineWidth = 3; c.beginPath(); c.ellipse(Xs, Ys, T * 0.95, T * 0.36, 0, -Math.PI / 2, -Math.PI / 2 + Math.min(1, l.ch) * TAU); c.stroke();
      if (l.hold > 0) { c.strokeStyle = '#FFFFFF'; c.lineWidth = 4; c.beginPath(); c.arc(Xs, Ys - T * 0.8, T * 0.45, -Math.PI / 2, -Math.PI / 2 + l.hold / 0.5 * TAU); c.stroke(); }
      c.restore(); if (ready) label(c, 'FLARE', Xs, Ys + T * 0.75, T * 0.28, GOLD_HI); } }));
    return { S, lamp, lotus,
      cam() { return { x: me.x * 0.65 + lamp.x * 0.35, y: me.y * 0.65 + lamp.y * 0.35 - 0.5, k: 0, zoom: 0.66 }; },
      update(dt) { if (S.intro) return;
        for (const l of lotus) { if (l.flareT > 0) l.flareT -= dt; if (S.done) continue; l.ch = Math.min(1, l.ch + dt / LOTUS_CD); const on = Math.hypot(me.x - l.x, me.y - l.y) < 1.3; if (on && l.ch >= 1) { l.hold += dt; if (l.hold >= 0.5) flare(l); } else l.hold = 0; }
        if (S.done) return;
        S.mobs = S.mobs.filter(m => !m.dead);
        // the shades at the lamp drink its light; when it goes out, stand at it to light it again
        if (!lamp.out) { let drink = 0; for (const m of S.mobs) if (m.drink) drink += m.drinkK || 0.9; lamp.light = Math.max(0, lamp.light - drink * dt); if (lamp.light <= 0) { lamp.out = true; S.outs++; lamp.relit = 0; X.banner('THE LIGHT GOES OUT', 'The shades turn on you: stand at the lamp to light it again', '#B9A6FF', 2.4, true); X.shake(5, 0.4); } }
        else { if (Math.hypot(me.x - lamp.x, me.y - lamp.y) < 2.0) { lamp.relit += dt; if (lamp.relit >= 2.2) { lamp.out = false; lamp.light = 45; X.boom(lamp.x, lamp.y - 3, 1.6, GOLD, '#FFFFFF', { n: 18, shake: 4 }); X.text(lamp.x, lamp.y - 3.6, 'The light returns', GOLD_HI, 15); } } else lamp.relit = Math.max(0, lamp.relit - dt); }
        // the waves
        if (S.wave < 0 || (S.poured >= SIEGE_N[S.wave] && !S.mobs.length)) { if (S.wave >= SIEGE_N.length - 1) { win(); return; } S.waveT -= dt; if (S.waveT <= 0) { S.waveT = 4; startWave(); } return; }
        S.spawnT -= dt; if (S.poured < SIEGE_N[S.wave] && S.spawnT <= 0 && S.mobs.length < SIEGE_CAP) { S.spawnT = 0.2; spawnOne(); } },
      goal() { if (self.done) return 'To the Marble Gardens'; if (S.intro) return 'The Black Sun Siege'; if (lamp.out) return 'The light is out: stand at the lamp'; if (S.wave < 0) return 'Hold the Last Lamp · the pools stir'; const left = SIEGE_N[S.wave] - S.poured + S.mobs.length; return `Wave ${S.wave + 1}/3 · ${left} left${S.herald && !S.herald.dead ? ' · the Umbral Herald' : ''}`; },
      hint() { if (self.done) return null; if (lamp.out) return { x: lamp.x, y: lamp.y + 1.2 }; return null; },
      drawGround(c) { const T = X.Tz(), t = g.t, k = lamp.out || S.done ? (S.done ? 1 : 0) : lamp.light / 100;
        // the lamp's light on the sand: a soft pool feathered to nothing
        if (k > 0) { const Xs = X.sx(lamp.x), Ys = X.sy(lamp.y), R = T * 6.5; c.save(); c.globalCompositeOperation = 'lighter'; c.translate(Xs, Ys); c.scale(1, 0.58); const gr = c.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, `rgba(255,240,184,${0.32 * k})`); gr.addColorStop(0.5, `rgba(232,196,106,${0.16 * k})`); gr.addColorStop(1, 'rgba(232,196,106,0)'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); c.restore(); }
        // the threads of light the shades drink
        if (!lamp.out) { const lx = X.sx(lamp.x), ly = X.sy(lamp.y) - T * 3.3; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (const m of S.mobs) if (!m.dead && m.drink) { const mx = X.sx(m.x), my = X.sy(m.y) - T * 0.7; c.strokeStyle = `rgba(255,240,184,${0.28 + 0.18 * Math.sin(t * 9 + m.x)})`; c.lineWidth = m.herald ? 5 : 2.5; c.beginPath(); c.moveTo(lx, ly); c.quadraticCurveTo((lx + mx) / 2, Math.min(ly, my) - T, mx, my); c.stroke(); } c.restore(); }
        // the lotus flare's reach
        for (const l of lotus) { if (l.ch < 1 && l.flareT <= 0) continue; const Xs = X.sx(l.x), Ys = X.sy(l.y); c.save(); if (l.flareT > 0) { glowAt(c, Xs, Ys, FLARE_R * T * (1.2 - l.flareT * 0.2), GOLD, l.flareT * 0.5); } else { c.strokeStyle = 'rgba(255,240,184,.3)'; c.lineWidth = 2; c.setLineDash([6, 9]); c.lineDashOffset = -t * 14; c.beginPath(); c.ellipse(Xs, Ys, FLARE_R * T, FLARE_R * T * 0.55, 0, 0, TAU); c.stroke(); } c.restore(); } },
      drawOver(c) { if (S.intro || self.done) return; topBar(c, X, 128, lamp.out ? lamp.relit / 2.2 : lamp.light / 100, lamp.out ? '#9A8AC0' : GOLD, lamp.out ? 'THE LIGHT IS OUT · stand at the lamp' : `The Last Lamp ${Math.ceil(lamp.light)}%${S.wave >= 0 ? ` · wave ${S.wave + 1}/3` : ''}`); },
    };
  }
  MOON_STAGES.SIEGE = { name: 'The Black Sun Siege', goal: 'Hold the Last Lamp', how: `The Last Lamp burns on a marble terrace among the Moon Castle's reflecting pools, and the black sun wants it out. Its servants pour out of the dark water in three waves (${SIEGE_N.join(', ')}). Umbral shades (little dark suns) run to the lamp and drink its light: strike them down first. The rest come for you. Three lotus braziers charge slowly: when one shows FLARE, stand on it to burn everything near it (shades burn at once). If the light goes out, stand at the lamp to light it again. Hold through all three waves.`,
    layout: SIEGE_LAYOUT, legend: { E: {}, L: {}, o: {} }, make: makeSiege };
})();
