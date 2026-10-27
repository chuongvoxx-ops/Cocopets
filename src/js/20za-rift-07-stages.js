/* ---------- Rift 07, the Library of Unwritten Lives: its three challenge dungeons ----------
   LIB_STAGES.CATALOGUE   The Catalogue of Truth: clear a mob of eighty (one strong ink beast among them), then wake
                          the pedestal. Four banners (eye, moon, crown, key) turn their backs and shuffle: pick the
                          true eye. Three rounds, faster each time; a wrong pick spills another mob of eighty.
   LIB_STAGES.FABLE       The Unfinished Fable: three stone pages (an egg, a hatchling, a winged adult) lie about the
                          workshop. Carry each to a lectern in the order of its life: egg, hatchling, adult. Then a
                          false folio steals the last page (the empty shell): catch it, and set the shell beside the
                          hatchling.
   LIB_STAGES.PROCESSION  The False Procession (an escort): three groups of floating books; inspect them to find the
                          true one (the false ones open into monsters). Walk the true books up the page steps through
                          three rest circles: at each circle they wait until you wake the next marker. Monsters that
                          reach the books hurt them; a fallen book only needs you beside it to rise again.
   (the palette LIB and the brood live in 20zb; these make() functions only run once a stage starts) */
const LIB_STAGES = {};
(() => {
  const TAU = Math.PI * 2, P = () => LIB;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const alive = list => list.filter(m => !m.dead).length;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function spawnAt(X, type, p, list, aggro) { const q = X.freeSpot(p.x, p.y, 0.45) || p; const m = X.spawnMon(type, q.x, q.y, { pack: 910, rift: true, aggro: !!aggro }); X.g.total++; if (list) list.push(m); return m; }
  // a solid tile that isn't drawn as a wall (an object stands there instead)
  const block = (X, tx, ty) => { X.M.props.set(ty * X.M.MW + tx, 'blank'); X.setTile(tx, ty, T_SOLID); };
  DunWorld.PROPS.blank = () => {};
  const tilesOf = (M, ch) => (M.marks[ch] || []).map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y }));

  /* ---- the three symbols, drawn in gold (or any colour) ---- */
  const SYM_NAME = { eye: 'EYE', moon: 'MOON', crown: 'CROWN' };
  function sym(c, kind, x, y, r, col, lw) { c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw || Math.max(2, r * 0.16); c.lineJoin = 'round'; c.lineCap = 'round';
    if (kind === 'eye') { c.beginPath(); c.moveTo(x - r, y); c.quadraticCurveTo(x, y - r * 0.85, x + r, y); c.quadraticCurveTo(x, y + r * 0.85, x - r, y); c.closePath(); c.stroke(); c.beginPath(); c.arc(x, y, r * 0.3, 0, TAU); c.fill(); }
    else if (kind === 'moon') { c.beginPath(); c.arc(x, y, r * 0.8, 0.6, TAU - 0.6); c.arc(x + r * 0.38, y, r * 0.62, TAU - 0.9, 0.9, true); c.closePath(); c.fill(); }
    else { c.beginPath(); c.moveTo(x - r * 0.85, y + r * 0.5); c.lineTo(x - r * 0.85, y - r * 0.35); c.lineTo(x - r * 0.42, y + r * 0.05); c.lineTo(x, y - r * 0.6); c.lineTo(x + r * 0.42, y + r * 0.05); c.lineTo(x + r * 0.85, y - r * 0.35); c.lineTo(x + r * 0.85, y + r * 0.5); c.closePath(); c.fill(); }
    c.restore(); }
  // the two ways a thing shows what it is when inspected: a solid gold shadow (true), a hollow dashed violet outline (false)
  function truthMark(c, Xs, Ys, T, w, real, t, k) { const { GOLD, GOLD_HI, VIOLET_HI } = P(); c.save(); c.globalAlpha = Math.min(1, k);
    if (real) { c.fillStyle = 'rgba(207,173,98,.55)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.08, w, w * 0.34, 0, 0, TAU); c.fill(); c.strokeStyle = GOLD_HI; c.lineWidth = 3; c.stroke(); glowAt(c, Xs, Ys, w * 1.4, GOLD, 0.5 * k); }
    else { c.strokeStyle = VIOLET_HI; c.lineWidth = 2.5; c.setLineDash([7, 6]); c.lineDashOffset = -t * 20; c.beginPath(); c.ellipse(Xs, Ys + T * 0.08, w, w * 0.34, 0, 0, TAU); c.stroke(); }
    c.restore(); }

  /* ======================= THE CATALOGUE OF TRUTH: which is the true eye? ======================= */
  // four banners, one with the eye; they turn their backs and shuffle; pick the eye. A mob of eighty first, and
  // eighty more after every wrong pick (one strong monster among each mob). Three rounds, each faster.
  const CAT_LAYOUT = [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~.....~~~~~~~~~~',
    '##########...E...#########',
    '##########.......#########',
    '##########ddddddd#########',
    '#........................#',
    '#........................#',
    '#........P..P..P..P......#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#............K...........#',
    '#..g..................g..#',
    '#........................#',
    '#........................#',
    '#......g.........g.......#',
    '#........................#',
    '#........................#',
    '#..g..................g..#',
    '#........................#',
    '#............S...........#',
    '#........................#',
    '##########################'];
  const ICONS = ['eye', 'moon', 'crown', 'key'];
  // per round: swaps, seconds per swap, and how many pairs swap at once
  const CAT_ROUNDS = [{ n: 6, dur: 0.62, pairs: 1 }, { n: 10, dur: 0.46, pairs: 1 }, { n: 12, dur: 0.4, pairs: 2 }];
  const MOB = 80, MOB_CAP = 24;
  function keyIcon(c, x, y, r, col) { c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(2, r * 0.2); c.lineCap = 'round'; c.beginPath(); c.arc(x - r * 0.45, y, r * 0.38, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(x - r * 0.07, y); c.lineTo(x + r * 0.9, y); c.moveTo(x + r * 0.55, y); c.lineTo(x + r * 0.55, y + r * 0.35); c.moveTo(x + r * 0.85, y); c.lineTo(x + r * 0.85, y + r * 0.28); c.stroke(); c.restore(); }
  function icon(c, k, x, y, r, col) { if (k === 'key') keyIcon(c, x, y, r, col); else sym(c, k, x, y, r, col); }
  function makeCatalogue(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { GOLD, GOLD_HI, BURG, BURG_HI, VIOLET, VIOLET_HI, PARCH, PARCH_HI, INK, WOOD, WOOD_D } = P();
    const E = mk.E[0], door = tilesOf(M, 'd'); door.forEach(t => X.setTile(t.tx, t.ty, T_SOLID));
    const dx0 = Math.min(...door.map(t => t.tx)), dx1 = Math.max(...door.map(t => t.tx)) + 1, dy = door[0].ty;
    const slots = mk.P.slice().sort((a, b) => a.x - b.x).map(p => ({ x: p.x, y: p.y }));
    slots.forEach(p => block(X, Math.floor(p.x), Math.floor(p.y)));
    const K = mk.K[0], spawns = mk.g || [];
    // banners: b.slot is where it stands; during a swap it travels from slot a to slot b along an arc
    const banners = ICONS.map((k, i) => ({ k, slot: i, from: i, to: i, u: 1, lane: 0, face: 1 }));
    const S = { intro: true, phase: 'mob', round: 0, mob: { left: 0, alive: [], strong: null, spawnT: 0 }, swaps: [], swapT: 0, cur: null, pedK: 0, open: false, openK: 0, wrong: 0, show: 0, picked: -1, msgT: 0 };
    const posOf = b => { const A = slots[b.from], B = slots[b.to], u = b.u < 1 ? (1 - Math.cos(b.u * Math.PI)) / 2 : 1, x = A.x + (B.x - A.x) * u, arc = Math.sin(u * Math.PI); return { x, y: A.y + b.lane * arc * 1.3, z: b.lane * arc }; };
    const plateOf = i => ({ x: slots[i].x, y: slots[i].y + 1.9 });
    function startMob(first) { const mb = S.mob; mb.left = MOB; mb.alive = []; mb.strong = null; mb.spawnT = 0.5; mb.strongAt = Math.floor(MOB * (0.35 + Math.random() * 0.3)); S.phase = 'mob';
      if (!first) X.banner('THE INK SPILLS', `${MOB} of the unwritten pour out, and something strong among them`, '#FF9BB0', 2.6, true); }
    function spawnOne() { const mb = S.mob, p = spawns[Math.floor(Math.random() * spawns.length)]; const strong = MOB - mb.left === mb.strongAt;
      const type = strong ? 'inkstalker' : ['marginworm', 'inkstalker', 'falsefolio', 'marginworm'][Math.floor(Math.random() * 4)];
      const m = spawnAt(X, type, { x: p.x + (Math.random() - 0.5) * 2, y: p.y + (Math.random() - 0.5) * 2 }, mb.alive, true); m.disguised = false; mb.left--;
      if (strong) { m.hp = m.maxhp = Math.round(m.maxhp * 14); m.dmg = Math.round(m.dmg * 1.7); m.r = 1.05; m.spd *= 0.85; m.bname = 'The Ink Warden'; m.strong = true; mb.strong = m; X.banner('THE INK WARDEN', 'A great ink beast among the mob: it hits hard', '#FF9BB0', 2.2, true); X.shake(6, 0.4); }
      X.ring(m.x, m.y, 0.2, 1.4, 0.3, VIOLET_HI, 0.35); }
    function deal() { // show the faces, then turn them, then shuffle
      const R = CAT_ROUNDS[S.round]; S.phase = 'show'; S.show = S.round === 0 && !S.wrong ? 4.2 : 3.2; S.card = { t: S.show, max: S.show }; banners.forEach(b => { b.face = 1; b.from = b.to = b.slot; b.u = 1; }); S.picked = -1;
      const list = []; for (let i = 0; i < R.n; i++) { if (R.pairs === 2 && i % 3 !== 0) { const p = shuffle([0, 1, 2, 3]); list.push([[p[0], p[1]], [p[2], p[3]]]); } else { const a = Math.floor(Math.random() * 4); let b = Math.floor(Math.random() * 3); if (b >= a) b++; list.push([[a, b]]); } }
      S.swaps = list; S.cur = null; S.say = null; X.sfx.fanfare && X.sfx.fanfare(); }
    function nextSwap() { const R = CAT_ROUNDS[S.round]; const sw = S.swaps.shift(); if (!sw) { S.phase = 'pick'; S.off = null; S.cur = null; S.say = { t: 99, s: 'WHICH IS THE TRUE EYE? · STEP ON ITS PLATE', col: GOLD_HI }; return; }
      S.cur = { pairs: sw, t: 0, dur: R.dur }; let lane = 1; for (const [a, b] of sw) { const A = banners.find(q => q.slot === a), B = banners.find(q => q.slot === b); A.from = a; A.to = b; A.u = 0; A.lane = lane; B.from = b; B.to = a; B.u = 0; B.lane = -lane; lane = -lane; } X.sfx.tick && X.sfx.tick(); }
    function pick(i) { const b = banners.find(q => q.slot === i), eye = banners.find(q => q.k === 'eye'); b.face = 1; S.picked = i; S.phase = 'reveal'; S.msgT = 2.2;
      if (b === eye) { X.sfx.fanfare(); X.boom(slots[i].x, slots[i].y - 1.6, 1.6, GOLD, '#FFFFFF', { n: 22, shake: 5 }); S.round++;
        if (S.round >= 3) { X.banner('THE TRUE EYE, THRICE', 'The catalogue opens its passage', GOLD_HI, 2.6, true, true); X.after(1.2, openDoor); S.phase = 'done'; }
        else S.say = { t: 2.2, s: `THE TRUE EYE! · ROUND ${S.round + 1} WILL BE FASTER`, col: GOLD_HI }; }
      else { S.wrong++; X.after(0.9, () => { eye.face = 1; }); X.shake(6, 0.4); X.boom(slots[i].x, slots[i].y - 1.6, 1.6, INK, VIOLET_HI, { n: 22, shake: 5 }); S.say = { t: 2.2, s: 'A FALSE EYE · THE INK SPILLS', col: '#FF9BB0' }; S.failNext = true; } }
    function openDoor() { S.open = true; door.forEach(t => X.setTile(t.tx, t.ty, T_FLOOR)); X.retile(); self.done = true; H.setExit(E.x, E.y, 'To the reading circle'); X.shake(6, 0.5); }
    startMob(true); g.total = MOB;
    X.after(1.2, () => { S.intro = false; X.banner('THE CATALOGUE OF TRUTH', `Clear the mob (${MOB}), then wake the pedestal: which banner hides the true eye?`, GOLD_HI, 3.4, true, true); });
    // the pedestal: rises when the mob is cleared; stand on it to begin a round
    H.obj({ x: K.x, y: K.y, kind: 'pedestal', r: 0.9, h: 1.6, label: () => (S.phase === 'ready' ? 'Wake the catalogue' : ''), use() { if (S.phase !== 'ready') return; deal(); },
      draw(c, Xs, Ys, T) { const k = S.pedK; if (k <= 0.02) return; const t = g.t; c.save(); c.globalAlpha = Math.min(1, k * 1.5); const h = T * 1.0 * k;
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys, T * 1.1, T * 0.4, 0, 0, TAU); c.fill();
        c.fillStyle = WOOD_D; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - T * 0.45, Ys - h, T * 0.9, h); c.strokeRect(Xs - T * 0.45, Ys - h, T * 0.9, h);
        c.fillStyle = WOOD; c.beginPath(); c.moveTo(Xs - T * 1.2, Ys - h); c.lineTo(Xs + T * 1.2, Ys - h); c.lineTo(Xs + T * 1.0, Ys - h - T * 0.35); c.lineTo(Xs - T * 1.0, Ys - h - T * 0.35); c.closePath(); c.fill(); c.stroke();
        for (const sd of [-1, 1]) { c.fillStyle = sd < 0 ? PARCH_HI : PARCH; c.beginPath(); c.moveTo(Xs, Ys - h - T * 0.3); c.quadraticCurveTo(Xs + sd * T * 0.5, Ys - h - T * 0.62, Xs + sd * T * 1.05, Ys - h - T * 0.45); c.lineTo(Xs + sd * T * 1.0, Ys - h - T * 0.12); c.quadraticCurveTo(Xs + sd * T * 0.5, Ys - h - T * 0.25, Xs, Ys - h - T * 0.05); c.closePath(); c.fill(); c.stroke(); }
        const live = S.phase === 'ready'; glowAt(c, Xs, Ys - h - T * 0.4, T * 1.4, GOLD, live ? 0.5 + 0.3 * Math.sin(t * 5) : 0.25); sym(c, 'eye', Xs, Ys - h - T * 0.38, T * 0.32, BURG); c.restore();
        if (live) label(c, 'STAND HERE', Xs, Ys + T * 0.75, T * 0.26, GOLD_HI); } });
    // the four banners, drawn back to front
    H.obj({ x: slots[0].x, y: slots[0].y + 0.4, kind: 'banners', r: 0.1, h: 3, label: '', draw(c) { const T = X.Tz(), t = g.t;
      const list = banners.map(b => ({ b, p: posOf(b) })).sort((a, b) => a.p.z - b.p.z);
      for (const { b, p } of list) { const Xs = X.sx(p.x), Ys = X.sy(p.y) + T * 0.4, w = T * 0.85, h = T * 2.6, sc = 1 + p.z * 0.12, fl = b.face; c.save(); c.translate(Xs, Ys); c.scale(sc, sc);
        c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 0, w * 1.05, w * 0.35, 0, 0, TAU); c.fill();
        // the pole and crossbar, then the cloth (face: burgundy with the icon; back: dark ink with a gold question)
        c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -h - T * 0.3); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 3; c.stroke();
        c.fillStyle = GOLD; c.fillRect(-w - 4, -h - T * 0.12, w * 2 + 8, T * 0.12); c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(-w - 4, -h - T * 0.12, w * 2 + 8, T * 0.12);
        c.beginPath(); c.moveTo(-w, -h); c.lineTo(w, -h); c.lineTo(w, -T * 0.55); c.lineTo(0, -T * 0.15); c.lineTo(-w, -T * 0.55); c.closePath();
        const face = fl > 0.5, gr = c.createLinearGradient(-w, 0, w, 0); if (face) { gr.addColorStop(0, BURG_HI); gr.addColorStop(0.5, BURG); gr.addColorStop(1, '#3A1A2A'); } else { gr.addColorStop(0, '#3A3460'); gr.addColorStop(0.5, '#24203A'); gr.addColorStop(1, '#14121E'); }
        c.fillStyle = gr; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(-w + 6, -h + 6); c.lineTo(w - 6, -h + 6); c.lineTo(w - 6, -T * 0.6); c.lineTo(0, -T * 0.25); c.lineTo(-w + 6, -T * 0.6); c.closePath(); c.stroke();
        if (face) { const isEye = b.k === 'eye'; if (isEye) glowAt(c, 0, -h * 0.55, T * 1.3, GOLD, 0.6); icon(c, b.k, 0, -h * 0.55, T * 0.5, GOLD_HI); }
        else { c.fillStyle = 'rgba(242,220,154,.85)'; c.font = `900 ${Math.round(T * 0.9)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, -h * 0.55); }
        c.restore(); }
      // the pick plates (during the pick only)
      if (S.phase === 'pick') for (let i = 0; i < 4; i++) { const pl = plateOf(i), Xs = X.sx(pl.x), Ys = X.sy(pl.y); c.save(); c.fillStyle = 'rgba(207,173,98,.35)'; c.strokeStyle = GOLD_HI; c.lineWidth = 3; c.globalAlpha = 0.7 + 0.3 * Math.sin(t * 6 + i); c.beginPath(); c.ellipse(Xs, Ys, T * 0.75, T * 0.3, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); label(c, 'PICK', Xs, Ys + T * 0.62, T * 0.24, GOLD_HI); }
      if (S.phase === 'show') { const eb = banners.find(b => b.k === 'eye'), p = posOf(eb), Xs = X.sx(p.x), Ys = X.sy(p.y); c.save(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.setLineDash([8, 6]); c.lineDashOffset = -t * 30; c.beginPath(); c.ellipse(Xs, Ys + T * 0.4, T * 1.15, T * 0.42, 0, 0, TAU); c.stroke(); c.restore(); if (eb.face > 0.5) label(c, '▲ THE EYE ▲', Xs, Ys + T * 1.25, T * 0.3, '#FFFFFF'); }
      if (S.card && S.card.t > 0) { // the instruction card: across the top, clear of the banners
        const W = X.W(), cw = Math.min(W - 24, 380), ch = 112, cx = (W - cw) / 2, cy = Math.max(84, X.sy(slots[0].y) - T * 2.75 - ch - 8), a = Math.min(1, (S.card.max - S.card.t) * 4, S.card.t * 3);
        c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(20,14,30,.92)'; c.strokeStyle = GOLD_HI; c.lineWidth = 3; c.beginPath(); GFX.rr(c, cx, cy, cw, ch, 14); c.fill(); c.stroke();
        glowAt(c, cx + 50, cy + ch / 2, 46, GOLD, 0.7); sym(c, 'eye', cx + 50, cy + ch / 2, 26, GOLD_HI);
        c.textAlign = 'left'; c.fillStyle = GOLD_HI; c.font = `900 21px ${arcFont}`; c.fillText('FIND THE TRUE EYE', cx + 92, cy + 28); c.fillStyle = 'rgba(242,220,154,.75)'; c.font = `800 12px ${arcFont}`; c.fillText(`ROUND ${S.round + 1} OF 3${S.round ? ' · FASTER' : ''}`, cx + 92, cy + 45);
        c.fillStyle = '#FFFFFF'; c.font = `700 14px ${arcFont}`; c.font = `700 13px ${arcFont}`; ['Remember the banner with the EYE.', 'They turn their backs and shuffle:', 'follow it, then step on its plate.'].forEach((ln, i) => c.fillText(ln, cx + 92, cy + 66 + i * 17));
        c.restore(); }
      if (S.say && S.say.t > 0) { const lx = X.sx((slots[0].x + slots[3].x) / 2), ly = X.sy(slots[0].y) - T * 3.4; c.save(); c.fillStyle = 'rgba(20,14,30,.72)'; const wpx = Math.min(X.W() - 16, T * 9); c.fillRect(lx - wpx / 2, ly - T * 0.42, wpx, T * 0.6); c.restore(); label(c, S.say.s, lx, ly, T * 0.3, S.say.col); }
      if (S.picked >= 0 && S.phase === 'reveal') { const p = slots[S.picked], Xs = X.sx(p.x), Ys = X.sy(p.y); c.save(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 4; c.beginPath(); c.ellipse(Xs, Ys + T * 0.4, T * 1.1, T * 0.4, 0, 0, TAU); c.stroke(); c.restore(); } } });
    return { S, banners, slots,
      eyeSlot: () => banners.find(b => b.k === 'eye').slot,
      cam() { if (S.phase === 'show' || S.phase === 'shuffle' || S.phase === 'pick' || S.phase === 'reveal') return { x: (slots[0].x + slots[3].x) / 2, y: slots[0].y - 0.2, k: 0, zoom: 0.7 }; return { x: me.x, y: me.y, k: 0, zoom: 0.72 }; },
      update(dt) { if (S.intro) return; if (S.say) S.say.t -= dt; if (S.card) S.card.t -= dt; if (S.phase !== 'pick' && S.say && S.say.t > 50) S.say = null;
        S.pedK += ((S.phase === 'ready' || S.phase === 'show' || S.phase === 'shuffle' || S.phase === 'pick' ? 1 : 0) - S.pedK) * Math.min(1, dt * 3);
        if (S.phase === 'mob') { const mb = S.mob; mb.alive = mb.alive.filter(m => !m.dead); mb.spawnT -= dt;
          if (mb.left > 0 && mb.spawnT <= 0 && mb.alive.length < MOB_CAP) { mb.spawnT = 0.18; spawnOne(); }
          if (mb.left <= 0 && !mb.alive.length) { S.phase = 'ready'; X.banner('THE MOB IS CLEARED', 'A pedestal rises: stand on it to begin', GOLD_HI, 2.4, true); } }
        else if (S.phase === 'show') { S.show -= dt; if (S.show < 0.6) banners.forEach(b => { b.face = Math.max(0, Math.min(1, S.show / 0.6)); }); if (S.show <= 0) { banners.forEach(b => { b.face = 0; }); S.phase = 'shuffle'; S.swapT = 0.4; } }
        else if (S.phase === 'shuffle') { if (S.swapT > 0) { S.swapT -= dt; if (S.swapT <= 0) nextSwap(); }
          else if (S.cur) { S.cur.t += dt; const u = Math.min(1, S.cur.t / S.cur.dur); banners.forEach(b => { if (b.u < 1) b.u = u; }); if (u >= 1) { banners.forEach(b => { b.slot = b.to; b.from = b.to; b.u = 1; b.lane = 0; }); S.cur = null; S.swapT = 0.05; } } }
        else if (S.phase === 'pick') { S.off = S.off || [0, 0, 0, 0]; for (let i = 0; i < 4; i++) { const pl = plateOf(i), on = Math.hypot(me.x - pl.x, me.y - pl.y) < 0.8; if (!on) S.off[i] = 1; else if (S.off[i]) { S.off = null; pick(i); break; } } }
        else if (S.phase === 'reveal') { S.msgT -= dt; if (S.msgT <= 0) { banners.forEach(b => { b.face = 1; }); if (S.failNext) { S.failNext = false; startMob(false); } else S.phase = 'ready'; } }
        if (S.open) S.openK = Math.min(1, S.openK + dt * 0.8); },
      goal() { if (self.done) return 'To the reading circle'; if (S.intro) return 'The Catalogue of Truth'; const mb = S.mob;
        if (S.phase === 'mob') return `THE MOB · ${mb.left + mb.alive.filter(m => !m.dead).length} left${mb.strong && !mb.strong.dead ? ' · the Ink Warden' : ''}`;
        if (S.phase === 'ready') return `Round ${S.round + 1}/3 · stand on the pedestal`; if (S.phase === 'pick') return 'Which is the true eye? Step on its plate'; return `Round ${S.round + 1}/3 · watch the eye`; },
      hint() { if (self.done) return null; if (S.phase === 'ready') return K; return null; },
      drawGround(c) { const T = X.Tz();
        const X0 = X.sx(dx0), X1 = X.sx(dx1), Y0 = X.sy(dy) - T * 1.4, Y1 = X.sy(dy) + T, w = (X1 - X0) / 2, sh = S.openK * w;
        c.save(); c.beginPath(); c.rect(X0, Y0 - 4, X1 - X0, Y1 - Y0 + 8); c.clip();
        for (const sd of [-1, 1]) { const lx = sd < 0 ? X0 - sh : X0 + w + sh; c.fillStyle = BURG; c.fillRect(lx, Y0, w, Y1 - Y0); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(lx, Y0, w, Y1 - Y0); c.strokeStyle = GOLD; c.strokeRect(lx + 5, Y0 + 5, w - 10, Y1 - Y0 - 10); c.fillStyle = PARCH_HI; c.fillRect(sd < 0 ? lx + w - 6 : lx, Y0, 6, Y1 - Y0); }
        c.restore(); if (S.openK < 0.6) { for (let i = 0; i < 3; i++) { const x = X0 + (X1 - X0) * (0.3 + i * 0.2), lit = i < S.round; glowAt(c, x, Y0 + (Y1 - Y0) * 0.45, T * 0.6, GOLD, lit ? 0.8 : 0.15); sym(c, 'eye', x, Y0 + (Y1 - Y0) * 0.45, T * 0.28, lit ? '#FFFFFF' : 'rgba(242,220,154,.4)'); } } },
    };
  }
  LIB_STAGES.CATALOGUE = { name: 'The Catalogue of Truth', goal: 'Find the true eye, three times', how: `First clear the mob: ${MOB} of the unwritten pour out of the shelves, with one strong ink beast among them. Then a pedestal rises: stand on it to begin. Four banners show their icons (an eye, a moon, a crown, a key), turn their backs and shuffle. Keep your eye on the EYE. When they stop, step on the plate in front of the banner you think hides it. Right three times (each round shuffles faster, the last swaps two pairs at once) and the passage opens. A wrong pick spills another mob of ${MOB}.`,
    layout: CAT_LAYOUT, legend: { E: {}, d: {}, P: {}, K: {}, g: {} }, make: makeCatalogue };

  /* ======================= THE UNFINISHED FABLE ======================= */
  const FAB_LAYOUT = [
    '######################',
    '########..E...########',
    '########......########',
    '########dddddd########',
    '#....................#',
    '#....L....L.k..L.....#',
    '#....................#',
    '#....................#',
    '#.p................p.#',
    '#....................#',
    '#........g...g.......#',
    '#....................#',
    '#.p.......h........a.#',
    '#....................#',
    '#........p...........#',
    '#....................#',
    '#..........S.........#',
    '######################'];
  const PAGE_NAME = { egg: 'the egg', hatch: 'the hatchling', adult: 'the winged adult', shell: 'the empty shell' };
  // a page's picture: an intact egg; a hatchling breaking out; a winged adult; the broken empty shell
  function pagePic(c, kind, x, y, s, col) { c.save(); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.12); c.lineJoin = 'round'; c.lineCap = 'round';
    if (kind === 'egg') { c.beginPath(); c.ellipse(x, y, s * 0.55, s * 0.72, 0, 0, TAU); c.fill(); }
    else if (kind === 'hatch') { c.beginPath(); c.moveTo(x - s * 0.6, y); c.lineTo(x - s * 0.35, y - s * 0.2); c.lineTo(x - s * 0.15, y + s * 0.05); c.lineTo(x + s * 0.1, y - s * 0.22); c.lineTo(x + s * 0.32, y + s * 0.02); c.lineTo(x + s * 0.6, y - s * 0.15); c.quadraticCurveTo(x + s * 0.6, y + s * 0.7, x, y + s * 0.7); c.quadraticCurveTo(x - s * 0.6, y + s * 0.7, x - s * 0.6, y); c.fill(); c.beginPath(); c.arc(x, y - s * 0.35, s * 0.3, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x + s * 0.1, y - s * 0.4, s * 0.07, 0, TAU); c.fill(); }
    else if (kind === 'adult') { c.beginPath(); c.ellipse(x, y + s * 0.1, s * 0.3, s * 0.42, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(x, y - s * 0.45, s * 0.22, 0, TAU); c.fill(); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x + sd * s * 0.2, y - s * 0.1); c.quadraticCurveTo(x + sd * s * 0.9, y - s * 0.8, x + sd * s * 0.95, y - s * 0.1); c.quadraticCurveTo(x + sd * s * 0.6, y - s * 0.2, x + sd * s * 0.25, y + s * 0.15); c.closePath(); c.fill(); } }
    else { c.beginPath(); c.moveTo(x - s * 0.6, y - s * 0.05); c.lineTo(x - s * 0.4, y - s * 0.3); c.lineTo(x - s * 0.2, y - s * 0.05); c.lineTo(x, y - s * 0.32); c.lineTo(x + s * 0.2, y - s * 0.05); c.lineTo(x + s * 0.4, y - s * 0.3); c.lineTo(x + s * 0.6, y - s * 0.05); c.quadraticCurveTo(x + s * 0.6, y + s * 0.6, x, y + s * 0.6); c.quadraticCurveTo(x - s * 0.6, y + s * 0.6, x - s * 0.6, y - s * 0.05); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(x + s * 0.7, y - s * 0.5); c.lineTo(x + s * 0.95, y - s * 0.75); c.lineTo(x + s * 0.8, y - s * 0.4); c.closePath(); c.stroke(); }
    c.restore(); }
  function stonePage(c, Xs, Ys, T, kind, k) { const { INK, PARCH, PARCH_HI, BURG } = P(); const w = T * 0.62, h = T * 0.82;
    c.save(); c.translate(Xs, Ys); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-w + 3, -h + 3, w * 2, h * 1.6);
    const g = c.createLinearGradient(-w, -h, w, h); g.addColorStop(0, PARCH_HI); g.addColorStop(1, '#BBA67E'); c.fillStyle = g; c.fillRect(-w, -h, w * 2, h * 1.6); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-w, -h, w * 2, h * 1.6);
    c.strokeStyle = 'rgba(107,50,79,.5)'; c.strokeRect(-w + 4, -h + 4, w * 2 - 8, h * 1.6 - 8); pagePic(c, kind, 0, -h * 0.25 + h * 0.3, T * 0.5, BURG); c.restore(); }
  function makeFable(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { GOLD, GOLD_HI, BURG, BURG_HI, VIOLET_HI, PARCH, PARCH_HI, INK, WOOD, WOOD_D } = P();
    const E = mk.E[0], door = tilesOf(M, 'd'); door.forEach(t => X.setTile(t.tx, t.ty, T_SOLID));
    const dx0 = Math.min(...door.map(t => t.tx)), dx1 = Math.max(...door.map(t => t.tx)) + 1, dy = door[0].ty;
    const lect = mk.L.slice().sort((a, b) => a.x - b.x).map((p, i) => ({ i, x: p.x, y: p.y, page: null }));
    const side = { x: mk.k[0].x, y: mk.k[0].y, page: null, side: true, i: 9 };
    [...mk.L, mk.k[0]].forEach(p => block(X, p.tx, p.ty));
    const ORDER = ['egg', 'hatch', 'adult'], spots = shuffle(mk.p.slice());
    const pages = ORDER.map((kind, i) => ({ kind, x: spots[i].x, y: spots[i].y, home: spots[i], at: null, held: false }));
    const A = mk.a[0];
    const S = { intro: true, carry: null, guards: [], thief: null, shell: null, phase: 'story', open: false, openK: 0, waveT: 0, placed: 0 };
    (mk.g || []).forEach(p => spawnAt(X, 'marginworm', p, S.guards, false)); (mk.h || []).forEach(p => { spawnAt(X, 'inkstalker', p, S.guards, false); spawnAt(X, 'inkstalker', { x: p.x + 2, y: p.y + 1 }, S.guards, false); });
    g.total = X.mons.length;
    X.after(1.2, () => { S.intro = false; X.banner('THE UNFINISHED FABLE', 'Carry the stone pages to the lecterns in the order of a life: EGG → HATCHLING → WINGED ADULT', GOLD_HI, 3.6, true, true); });
    const pairOK = i => lect[i].page && lect[i + 1].page && ORDER.indexOf(lect[i].page.kind) + 1 === ORDER.indexOf(lect[i + 1].page.kind) && lect[i].page.kind === ORDER[i];
    const storyOK = () => lect.every((l, i) => l.page && l.page.kind === ORDER[i]);
    function place(slot) { const pg = S.carry; if (!pg) { if (slot.page && !slot.side) { S.carry = slot.page; slot.page.at = null; slot.page.held = true; slot.page = null; } return; }
      if (slot.side && pg.kind !== 'shell') { X.text(slot.x, slot.y - 1.6, 'Only the shell fits here', VIOLET_HI, 12); return; }
      if (!slot.side && pg.kind === 'shell') { X.text(slot.x, slot.y - 1.6, 'The shell belongs beside the hatchling', VIOLET_HI, 12); return; }
      const old = slot.page; slot.page = pg; pg.at = slot; pg.held = false; S.carry = old; if (old) { old.at = null; old.held = true; }
      X.boom(slot.x, slot.y - 1.2, 1.0, GOLD, '#FFFFFF', { n: 10, shake: 2 }); S.placed++;
      if (slot.side) { S.open = true; door.forEach(t => X.setTile(t.tx, t.ty, T_FLOOR)); X.retile(); self.done = true; H.setExit(E.x, E.y, 'To the spilled-ink chamber'); X.banner('THE STORY IS WHOLE', 'Egg, hatchling, shell, wings: the arch unfolds', GOLD_HI, 2.6, true, true); X.shake(6, 0.5); X.sfx.fanfare && X.sfx.fanfare(); return; }
      if (storyOK() && S.phase === 'story') { S.phase = 'thief'; X.sfx.fanfare && X.sfx.fanfare(); X.banner('THE LIFE IS IN ORDER…', 'but a page is missing: a false folio has stolen the empty shell! Catch it', GOLD_HI, 2.8, true);
        X.after(0.8, () => { const p0 = spots[3] || { x: A.x - 4, y: A.y }; S.shell = { kind: 'shell', x: p0.x, y: p0.y, home: p0, at: null, held: false, stolen: true }; pages.push(S.shell);
          const m = spawnAt(X, 'falsefolio', p0, S.guards, true); m.thief = true; m.disguised = false; m.hp = m.maxhp = Math.round(m.maxhp * 1.6); m.bname = 'Page thief'; S.thief = m; spawnAt(X, 'marginworm', { x: p0.x + 1.5, y: p0.y + 1 }, S.guards, true); spawnAt(X, 'inkstalker', { x: p0.x - 1.5, y: p0.y + 1 }, S.guards, true); }); }
      else if (!S.carry && S.phase === 'story') { const ok = [0, 1].filter(pairOK).length; X.text(slot.x, slot.y - 1.8, ok === 2 ? 'The story flows' : ok ? 'Part of it flows…' : 'That doesn\'t follow', ok ? GOLD_HI : VIOLET_HI, 13); } }
    // the lecterns and the side slot
    [...lect, side].forEach(sl => H.obj({ x: sl.x, y: sl.y + 0.3, kind: 'lectern', r: 0.1, h: 2, label: '', draw(c, Xs, Ys, T) { const t = g.t, sc = sl.side ? 0.75 : 1;
      c.save(); c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(Xs, Ys, T * 0.9 * sc, T * 0.32 * sc, 0, 0, TAU); c.fill(); c.fillStyle = WOOD; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - T * 0.14 * sc, Ys - T * 0.95 * sc, T * 0.28 * sc, T * 0.95 * sc); c.strokeRect(Xs - T * 0.14 * sc, Ys - T * 0.95 * sc, T * 0.28 * sc, T * 0.95 * sc);
      c.beginPath(); c.moveTo(Xs - T * 0.8 * sc, Ys - T * 0.95 * sc); c.lineTo(Xs + T * 0.8 * sc, Ys - T * 0.95 * sc); c.lineTo(Xs + T * 0.65 * sc, Ys - T * 1.25 * sc); c.lineTo(Xs - T * 0.65 * sc, Ys - T * 1.25 * sc); c.closePath(); c.fillStyle = WOOD_D; c.fill(); c.stroke(); c.restore();
      if (sl.page) stonePage(c, Xs, Ys - T * 1.7 * sc, T * sc, sl.page.kind, 1);
      else { const want = sl.side ? (S.phase === 'thief' || S.phase === 'shell' ? 1 : 0) : 1; c.save(); c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4); c.strokeStyle = sl.side ? VIOLET_HI : GOLD_HI; c.lineWidth = 2; c.setLineDash([6, 5]); c.strokeRect(Xs - T * 0.55 * sc, Ys - T * 2.4 * sc, T * 1.1 * sc, T * 1.25 * sc); c.restore(); if (want) label(c, sl.side ? 'SHELL' : String(sl.i + 1), Xs, Ys - T * 1.6 * sc, T * 0.32, sl.side ? VIOLET_HI : GOLD_HI); } } }));
    // pages lying about (or carried by the thief)
    return { S, lect, pages, side,
      cam() { return { x: me.x, y: me.y, k: 0, zoom: 0.74 }; },
      update(dt) { if (S.intro) return;
        // the thief carries the shell towards the alcove (it never leaves the room); kill it and the shell drops
        const th = S.thief; if (th && S.shell && !S.shell.at && !S.shell.held) { if (!th.dead) { S.shell.x = th.x; S.shell.y = th.y - 0.2; if (Math.hypot(th.x - A.x, th.y - A.y) > 0.8) { const a = Math.atan2(A.y - th.y, A.x - th.x); X.moveEnt(th, Math.cos(a) * 1.6 * dt, Math.sin(a) * 1.6 * dt); } } else if (!S.shell.dropped) { S.shell.dropped = true; S.phase = 'shell'; X.banner('THE SHELL FALLS', 'Set the empty shell in the small slot beside the hatchling', GOLD_HI, 2.4, true); } }
        // pick up a page by walking over it
        if (!S.carry) for (const pg of pages) { if (pg.at || pg.held) continue; if (pg.stolen && !pg.dropped) continue; if (Math.hypot(me.x - pg.x, me.y - pg.y) < 0.95) { S.carry = pg; pg.held = true; X.text(me.x, me.y - 1.6, `Carrying ${PAGE_NAME[pg.kind]}`, GOLD_HI, 13); break; } }
        if (S.shell && S.shell.stolen && S.thief && S.thief.dead) S.shell.dropped = true;
        // a slot takes the page you carry when you walk up to it (and hands back the one it held)
        for (const sl of [...lect, side]) { const d = Math.hypot(me.x - sl.x, me.y - (sl.y + 0.9)); if (d < 1.0) { if (!sl._on) { sl._on = true; place(sl); } } else sl._on = false; }
        if (S.carry) { S.carry.x = me.x; S.carry.y = me.y; }
        // a few more ink creatures while the story is unfinished
        if (S.phase === 'story') { S.waveT += dt; if (S.waveT > 16 && alive(S.guards) < 3) { S.waveT = 0; const p = mk.g[Math.floor(Math.random() * mk.g.length)]; spawnAt(X, Math.random() < 0.5 ? 'marginworm' : 'inkstalker', p, S.guards, true); } }
        if (S.open) S.openK = Math.min(1, S.openK + dt * 0.8); },
      goal() { if (self.done) return 'To the spilled-ink chamber'; if (S.intro) return 'The Unfinished Fable'; if (S.phase === 'thief') return 'Catch the page thief: it has the empty shell'; if (S.phase === 'shell') return S.carry && S.carry.kind === 'shell' ? 'Set the shell in the small slot beside the hatchling' : 'Pick up the empty shell'; const n = lect.filter((l, i) => l.page && l.page.kind === ORDER[i]).length; return `The story: ${n}/3 in order (egg → hatchling → adult)${S.carry ? ` · carrying ${PAGE_NAME[S.carry.kind]}` : ''}`; },
      hint() { if (self.done) return null; if (S.phase === 'thief' && S.thief && !S.thief.dead) return S.thief; if (S.carry) { if (S.carry.kind === 'shell') return { x: side.x, y: side.y + 0.9 }; const i = ORDER.indexOf(S.carry.kind); return { x: lect[i].x, y: lect[i].y + 0.9 }; } const pg = pages.find(p => !p.at && !p.held && (!p.stolen || p.dropped)); return pg || null; },
      drawGround(c) { const T = X.Tz(), t = g.t;
        // the gold line under the lecterns: each pair in the right order lights its stretch
        for (let i = 0; i < 2; i++) { const a = lect[i], b = lect[i + 1], ok = pairOK(i), ax = X.sx(a.x), bx = X.sx(b.x), y = X.sy(a.y + 0.9); c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(29,26,40,.5)'; c.lineWidth = T * 0.22; c.beginPath(); c.moveTo(ax, y); c.lineTo(bx, y); c.stroke(); if (ok) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = GOLD_HI; c.lineWidth = T * 0.12; c.setLineDash([T * 0.3, T * 0.2]); c.lineDashOffset = -t * T * 3; c.stroke(); } c.restore(); }
        // the slots' steps
        for (const sl of [...lect, side]) { const Xs = X.sx(sl.x), Ys = X.sy(sl.y + 0.9); c.save(); c.fillStyle = 'rgba(29,26,40,.35)'; c.strokeStyle = sl.side ? VIOLET_HI : GOLD; c.lineWidth = 2; c.beginPath(); c.ellipse(Xs, Ys, T * 0.6, T * 0.24, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); }
        // pages on the floor, bobbing, and the one carried over the pet
        for (const pg of pages) { if (pg.at) continue; const held = S.carry === pg, Xs = X.sx(pg.x), Ys = X.sy(pg.y) - (held ? T * 1.9 : T * 0.6) - Math.sin(t * 3 + pg.x) * T * 0.08; if (pg.stolen && !pg.dropped && !(S.thief && !S.thief.dead)) continue; glowAt(c, Xs, Ys, T * 0.9, GOLD, 0.35); stonePage(c, Xs, Ys + T * 0.3, T * (held ? 0.7 : 0.85), pg.kind, 1); }
        // the arch: two leaves of a binding press that fold open
        const X0 = X.sx(dx0), X1 = X.sx(dx1), Y0 = X.sy(dy) - T * 1.4, Y1 = X.sy(dy) + T, w = (X1 - X0) / 2, sh = S.openK * w;
        c.save(); c.beginPath(); c.rect(X0, Y0 - 4, X1 - X0, Y1 - Y0 + 8); c.clip(); for (const sd of [-1, 1]) { const lx = sd < 0 ? X0 - sh : X0 + w + sh; c.fillStyle = '#3A2236'; c.fillRect(lx, Y0, w, Y1 - Y0); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(lx, Y0, w, Y1 - Y0); c.strokeStyle = BURG_HI; c.strokeRect(lx + 5, Y0 + 5, w - 10, Y1 - Y0 - 10); } c.restore();
        if (S.openK < 0.6) ['egg', 'hatch', 'adult'].forEach((k, i) => pagePic(c, k, X0 + (X1 - X0) * (0.25 + i * 0.25), Y0 + (Y1 - Y0) * 0.45, T * 0.32, GOLD_HI)); },
    };
  }
  LIB_STAGES.FABLE = { name: 'The Unfinished Fable', goal: 'Put the story of a life in order', how: 'Three stone pages lie about the binding workshop: an intact egg, a hatchling breaking out of its egg, and a winged adult. Walk over a page to pick it up (you carry one at a time) and walk up to a lectern to set it there (it hands back any page it held). Put them in the order of a life, left to right: EGG, HATCHLING, ADULT; each pair in the right order lights the gold line under the lecterns. Then a false folio steals the last page, the empty shell, and flies off with it: catch it (it never leaves the room) and set the shell in the small slot beside the hatchling. Ink creatures guard the pages.',
    layout: FAB_LAYOUT, legend: { E: {}, d: {}, L: {}, k: {}, p: {}, g: {}, h: {}, a: {} }, make: makeFable };

  /* ======================= THE FALSE PROCESSION (an escort) ======================= */
  // a winding climb: landings to the left and right joined by page steps (book bridges), the route turning at each
  const PRO_LAYOUT = (() => { const W = 32, Hh = 54, g = Array.from({ length: Hh }, () => Array(W).fill('~'));
    const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; }, put = (x, y, ch) => { g[y][x] = ch; };
    rect(18, 2, 26, 7); rect(16, 12, 27, 17); rect(3, 11, 12, 17); rect(2, 22, 11, 28); rect(17, 23, 28, 29); rect(18, 33, 27, 39); rect(2, 34, 11, 40); rect(3, 44, 26, 50);
    rect(5, 41, 7, 43, '='); rect(12, 36, 17, 38, '='); rect(21, 30, 23, 32, '='); rect(12, 25, 16, 27, '='); rect(6, 18, 8, 21, '='); rect(13, 13, 15, 15, '='); rect(20, 8, 22, 11, '=');
    put(22, 4, 'E'); put(6, 37, 'r'); put(22, 26, 'r'); put(7, 14, 'r'); put(6, 44, '1'); put(22, 37, '2'); put(7, 26, '3'); put(21, 14, '4');
    put(7, 46, 'A'); put(14, 46, 'B'); put(21, 46, 'C'); put(14, 49, 'S');
    [[3, 35], [10, 39]].forEach(([x, y]) => put(x, y, 'j')); [[19, 34], [26, 38]].forEach(([x, y]) => put(x, y, 'w')); [[18, 24], [27, 28]].forEach(([x, y]) => put(x, y, 'u'));
    [[3, 23], [10, 27]].forEach(([x, y]) => put(x, y, 'v')); [[4, 12], [11, 16]].forEach(([x, y]) => put(x, y, 'y')); [[17, 13], [26, 16]].forEach(([x, y]) => put(x, y, 'z'));
    return g.map(r => r.join('')); })();
  function makeProcession(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { GOLD, GOLD_HI, BURG, BURG_HI, VIOLET, VIOLET_HI, PARCH, PARCH_HI, INK } = P();
    const E = mk.E[0], circles = mk.r.slice().sort((a, b) => b.y - a.y).map((p, i) => ({ i, x: p.x + 0.5, y: p.y, woke: false, ch: 0 }));
    const groupsAt = ['A', 'B', 'C'].map(ch => mk[ch][0]), trueG = Math.floor(Math.random() * 3);
    const groups = groupsAt.map((p, i) => ({ i, x: p.x, y: p.y, real: i === trueG, seen: 0, opened: false, books: [0, 1, 2].map(j => ({ ox: (j - 1) * 0.9, oy: (j % 2) * 0.4, hp: 1, down: false, hurtT: 0 })) }));
    const S = { intro: true, phase: 'find', next: 0, ri: 1, mobs: [], halted: false, waiting: false, done: false, ambush: [], hurtTip: false, leadTip: false };
    const G = groups[trueG];
    // the route the true books walk: across their landing, then landing by landing (turning at each), through the rest
    // circles, to the door. They only move while the pet is near enough to lead them
    const node = ch => ({ x: mk[ch][0].x, y: mk[ch][0].y }), route = [{ x: G.x, y: G.y }, node('1'), circles[0], node('2'), circles[1], node('3'), circles[2], node('4'), { x: E.x, y: E.y + 1 }];
    const stopOf = ri => circles.indexOf(route[ri]), WAVES = { 2: 'j', 3: 'w', 4: 'u', 5: 'v', 6: 'y', 7: 'z' }, LEAD = 5.5;
    const WAVE_MOBS = ['seraphling', 'haloguard', 'inkstalker', 'ophanwheel', 'marginworm', 'falsefolio'];
    const pathTo = () => route[S.ri] || route[route.length - 1];
    X.after(1.2, () => { S.intro = false; X.banner('THE FALSE PROCESSION', 'Three processions of books: only one is true. Walk up to each to inspect it (true: solid gold shadow)', GOLD_HI, 3.6, true, true); });
    function openFalse(gr) { if (gr.opened || gr.real) return; gr.opened = true; X.shake(5, 0.3); X.banner('A FALSE PROCESSION!', 'Its books open into monsters', VIOLET_HI, 2, true); gr.books.forEach((b, j) => { if (j < 2) { const m = spawnAt(X, 'falsefolio', { x: gr.x + b.ox, y: gr.y + b.oy }, S.mobs, true); m.disguised = false; } X.boom(gr.x + b.ox, gr.y + b.oy - 0.8, 0.9, VIOLET, '#FFFFFF', { n: 10, shake: 2 }); }); }
    function depart() { S.phase = 'walk'; S.next = 0; S.ri = 1; X.banner('THE TRUE PROCESSION', 'LEAD it up the winding steps: it only moves while you stay close. It waits at each rest circle: wake the next marker', GOLD_HI, 3.4, true);
      const left = groups.filter(gr => !gr.real && !gr.opened); if (left[0]) X.after(2.5, () => openFalse(left[0])); }
    // the rest markers: wake the next one by standing on it for a moment
    circles.forEach(cc => { cc.obj = H.obj({ x: cc.x, y: cc.y, kind: 'marker', r: 0.9, h: 0.4, label: () => (cc.woke ? 'Rest circle: awake' : S.phase === 'wait' && S.next === cc.i ? 'Wake the rest marker' : 'Rest circle'), use() { if (S.phase !== 'wait' || S.next !== cc.i || cc.woke) return; cc.woke = true; X.sfx.fanfare && X.sfx.fanfare(); X.ring(cc.x, cc.y, 0.3, 2.4, 0.4, GOLD_HI, 0.4); S.phase = 'walk'; S.ri++; X.text(cc.x, cc.y - 1.5, 'The procession moves on', GOLD_HI, 14);
      if (cc.i === 0) { const left = groups.filter(gr => !gr.real && !gr.opened); if (left[0]) openFalse(left[0]); } },
      draw(c, Xs, Ys, T) { const t = g.t, live = S.phase === 'wait' && S.next === cc.i; c.save(); c.fillStyle = cc.woke ? 'rgba(207,173,98,.45)' : 'rgba(29,26,40,.4)'; c.strokeStyle = live ? '#FFFFFF' : GOLD; c.lineWidth = live ? 4 : 2.5; c.beginPath(); c.ellipse(Xs, Ys, T * 1.1, T * 0.42, 0, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.ellipse(Xs, Ys, T * 0.75, T * 0.28, 0, 0, TAU); c.stroke();
        if (live || cc.woke) glowAt(c, Xs, Ys - T * 0.3, T * 1.6, GOLD, live ? 0.4 + 0.3 * Math.sin(t * 5) : 0.35); c.restore(); label(c, String(cc.i + 1), Xs, Ys + T * 0.12, T * 0.36, cc.woke ? '#FFFFFF' : GOLD_HI); } }); });
    // the three groups of books (drawn as one object each, so they stand among the monsters)
    groups.forEach(gr => H.obj({ x: gr.x, y: gr.y + 0.5, kind: 'books', r: 0.1, h: 2, label: '', draw(c, Xs, Ys, T) { drawGroup(c, gr, T); } }));
    function bookPos(gr, b) { const t = g.t, bx = (gr === G && S.phase !== 'find' ? S.px : gr.x) + b.ox, by = (gr === G && S.phase !== 'find' ? S.py : gr.y) + b.oy; return { x: bx, y: by, lift: 0.9 + Math.sin(t * 2.2 + b.ox * 3) * 0.12 }; }
    function drawGroup(c, gr, T) { const t = g.t; if (gr.opened) return; const k = Math.min(1, gr.seen / 0.6);
      for (const b of gr.books) { const p = bookPos(gr, b), Xs = X.sx(p.x), Ys = X.sy(p.y);
        if (k > 0) truthMark(c, Xs, Ys, T, T * 0.55, gr.real, t, k);
        if (b.down) { c.save(); c.globalAlpha = 0.6; c.translate(Xs, Ys - T * 0.15); c.rotate(1.3); c.fillStyle = '#5A4A5A'; c.fillRect(-T * 0.35, -T * 0.25, T * 0.7, T * 0.5); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-T * 0.35, -T * 0.25, T * 0.7, T * 0.5); c.restore(); label(c, 'Stand by me', Xs, Ys - T * 1.0, T * 0.22, GOLD_HI); continue; }
        const Y = Ys - p.lift * T, fin = Math.sin(t * 5 + b.ox) * 0.3, hurt = b.hurtT > 0;
        c.save(); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(Xs, Ys, T * 0.36, T * 0.12, 0, 0, TAU); c.fill();
        for (const sd of [-1, 1]) { c.save(); c.translate(Xs, Y); c.scale(sd, 1); c.fillStyle = PARCH_HI; c.beginPath(); c.moveTo(T * 0.25, -T * 0.05); c.quadraticCurveTo(T * 0.6, -T * (0.35 + fin), T * 0.7, -T * (0.05 + fin)); c.quadraticCurveTo(T * 0.5, T * 0.05, T * 0.25, T * 0.08); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); c.restore(); }
        c.fillStyle = hurt ? '#FF6A7A' : BURG; c.fillRect(Xs - T * 0.28, Y - T * 0.38, T * 0.56, T * 0.5); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(Xs - T * 0.28, Y - T * 0.38, T * 0.56, T * 0.5); c.fillStyle = PARCH_HI; c.fillRect(Xs + T * 0.2, Y - T * 0.34, T * 0.06, T * 0.42); c.fillStyle = GOLD; c.fillRect(Xs - T * 0.28, Y - T * 0.38, T * 0.56, 3);
        c.restore();
        if (gr.real && k >= 1) { // the ally mark and a health sliver
          c.save(); c.fillStyle = '#3E8A55'; c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs, Y - T * 0.95); c.lineTo(Xs + T * 0.16, Y - T * 0.82); c.lineTo(Xs + T * 0.13, Y - T * 0.6); c.lineTo(Xs, Y - T * 0.52); c.lineTo(Xs - T * 0.13, Y - T * 0.6); c.lineTo(Xs - T * 0.16, Y - T * 0.82); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(Xs - T * 0.3, Y + T * 0.2, T * 0.6, 4); c.fillStyle = b.hp > 0.4 ? '#7FE07F' : '#FF6A6A'; c.fillRect(Xs - T * 0.3, Y + T * 0.2, T * 0.6 * b.hp, 4); c.restore(); } }
      if (k >= 1 && gr.real && S.phase === 'find') label(c, 'TRUE', X.sx(gr.x), X.sy(gr.y) - T * 2.1, T * 0.3, GOLD_HI);
      if (k > 0 && k < 1) { c.save(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.beginPath(); c.arc(X.sx(gr.x), X.sy(gr.y) - T * 2.2, T * 0.3, -Math.PI / 2, -Math.PI / 2 + k * TAU); c.stroke(); c.restore(); } }
    S.px = G.x; S.py = G.y;
    return { S, groups, circles, G, route,
      cam() { return { x: me.x, y: me.y - 1, k: 0, zoom: 0.72 }; },
      update(dt) { if (S.intro) return;
        if (S.phase === 'find') { for (const gr of groups) { if (gr.opened) continue; if (Math.hypot(me.x - gr.x, me.y - gr.y) < 2.4) { gr.seen = Math.min(1, gr.seen + dt); if (gr.seen >= 0.6 && !gr._told) { gr._told = true; if (gr.real) depart(); else openFalse(gr); } } } return; }
        // monsters that reach a book hurt it; a fallen book halts the procession until you stand by it
        for (const b of G.books) { if (b.hurtT > 0) b.hurtT -= dt; if (b.down) continue; const p = bookPos(G, b); let n = 0; for (const m of X.mons) if (!m.dead && !m.boss && !m.optional && Math.hypot(m.x - p.x, m.y - p.y) < 1.3) n++; if (n) { b.hp -= dt * 0.1 * n; b.hurtT = 0.15; if (!S.hurtTip) { S.hurtTip = true; X.banner('THE BOOKS ARE UNDER ATTACK', 'Monsters beside the procession hurt it: drive them off', '#FF9BB0', 2.2, true); } if (b.hp <= 0) { b.hp = 0; b.down = true; b.downT = 0; X.text(p.x, p.y - 1.4, 'A book falls!', '#FF9BB0', 15); } } }
        const downB = G.books.find(b => b.down); S.halted = !!downB;
        if (downB) { const p = bookPos(G, downB); if (Math.hypot(me.x - p.x, me.y - p.y) < 1.6) { downB.downT += dt; if (downB.downT > 0.8) { downB.down = false; downB.hp = 0.6; X.text(p.x, p.y - 1.4, 'It rises again', GOLD_HI, 14); X.ring(p.x, p.y, 0.2, 1.4, 0.3, GOLD_HI, 0.4); } } else downB.downT = 0; }
        const near = Math.hypot(me.x - S.px, me.y - S.py) < LEAD; S.waiting = S.phase === 'walk' && !near;
        if (S.waiting && !S.leadTip) { S.leadTip = true; X.text(S.px, S.py - 1.6, 'They wait for you: stay close to lead them', GOLD_HI, 14); }
        // the landing ahead springs its ambush as the books set off for it
        { const ch = WAVES[S.ri]; if (ch && !S.ambush.includes(ch)) { S.ambush.push(ch); (mk[ch] || []).forEach((p, n) => { spawnAt(X, WAVE_MOBS[(S.ambush.length + n) % WAVE_MOBS.length], p, S.mobs, true); spawnAt(X, WAVE_MOBS[(S.ambush.length * 2 + n + 3) % WAVE_MOBS.length], { x: p.x + 1, y: p.y }, S.mobs, true); }); if (S.ambush.length === 1) X.banner('AMBUSH!', 'Every landing ahead hides monsters: keep them off the books', '#FF9BB0', 2.2, true);  }
        if (S.phase === 'walk' && !S.halted && near) { const to = pathTo(), dx = to.x - S.px, dy = to.y - S.py, L = Math.hypot(dx, dy), step = dt * 1.6;
          if (L > step) { S.px += dx / L * step; S.py += dy / L * step; }
          else { S.px = to.x; S.py = to.y; const k = stopOf(S.ri);
            if (S.ri >= route.length - 1) { if (!S.done) { S.done = true; self.done = true; H.setExit(E.x, E.y, 'To the final archive'); X.banner('THE PROCESSION ARRIVES', 'The true books open the archive door', GOLD_HI, 2.6, true, true); X.sfx.fanfare && X.sfx.fanfare(); X.shake(6, 0.5); for (const m of S.mobs) if (!m.dead) X.killMon(m); } }
            else if (k >= 0 && k < circles.length - 1) { S.phase = 'wait'; S.next = k + 1; X.text(circles[k].x, circles[k].y - 1.6, `Rest circle ${k + 1}: wake marker ${k + 2}`, GOLD_HI, 14); }
            else S.ri++;
} } }
      },
      goal() { if (self.done) return 'To the final archive'; if (S.intro) return 'The False Procession'; if (S.phase === 'find') return `Find the true procession (inspect: ${groups.filter(gr => gr.seen >= 0.6).length}/3)`; if (S.halted) return 'A book has fallen: stand beside it'; if (S.phase === 'wait') return `Wake rest marker ${S.next + 1} for the procession`; if (S.waiting) return 'The books wait: go back and lead them'; return `Lead the procession · rest circle ${Math.min(circles.filter(c => c.woke).length + 1, circles.length)}/${circles.length}`; },
      hint() { if (self.done) return null; if (S.phase === 'find') return groups.find(gr => !gr.opened && gr.seen < 0.6) || null; const downB = G.books.find(b => b.down); if (downB) return bookPos(G, downB); if (S.phase === 'wait') return circles[S.next]; return { x: S.px, y: S.py }; },
      drawGround(c) { const T = X.Tz(), t = g.t; if (S.phase === 'find') return;
        // the way ahead: a dotted gold path from the books to where they're going
        c.save(); c.strokeStyle = 'rgba(226,182,74,.6)'; c.lineWidth = 3; c.setLineDash([4, 10]); c.lineDashOffset = -t * 20; c.beginPath(); c.moveTo(X.sx(S.px), X.sy(S.py)); for (let r = S.ri; r < route.length; r++) { c.lineTo(X.sx(route[r].x), X.sy(route[r].y)); if (stopOf(r) >= 0 && r > S.ri) break; } c.stroke(); c.restore();
        // the leading circle round the books: stay inside it and they move
        if (S.phase === 'walk') { c.save(); c.strokeStyle = S.waiting ? 'rgba(255,155,176,.8)' : 'rgba(226,182,74,.35)'; c.lineWidth = 2; c.setLineDash([8, 8]); c.beginPath(); c.ellipse(X.sx(S.px), X.sy(S.py), LEAD * T, LEAD * T * 0.55, 0, 0, TAU); c.stroke(); c.restore(); }
        // a red warning ring round any monster at the books
        for (const m of X.mons) { if (m.dead || m.boss) continue; if (G.books.some(b => { const p = bookPos(G, b); return Math.hypot(m.x - p.x, m.y - p.y) < 1.3; })) { c.save(); c.strokeStyle = '#FF5C7A'; c.lineWidth = 3; c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 10); c.beginPath(); c.ellipse(X.sx(m.x), X.sy(m.y), T * 0.7, T * 0.28, 0, 0, TAU); c.stroke(); c.restore(); } } },
    };
  }
  LIB_STAGES.PROCESSION = { name: 'The False Procession', goal: 'Escort the true procession', how: 'Three processions of floating books wait on the first landing, all alike. Walk up to each to inspect it: the true one casts solid gold shadows (and an ally mark); a false one opens into monsters. Then LEAD the true books up the winding page steps: they only move while you stay inside the dashed circle round them. They wait at each numbered rest circle until you wake the next marker (stand on it a moment). Every landing ahead hides an ambush; monsters beside the books hurt them (red rings show who): drive them off. A book that falls only needs you to stand beside it to rise again; the procession can\'t be lost.',
    layout: PRO_LAYOUT, legend: { E: {}, r: {}, A: {}, B: {}, C: {}, 1: {}, 2: {}, 3: {}, 4: {}, j: {}, w: {}, u: {}, v: {}, y: {}, z: {} }, make: makeProcession };
})();
