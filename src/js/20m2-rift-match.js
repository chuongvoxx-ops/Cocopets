/* ---------- the Mosaic: a match-three puzzle played with the party's own pets ----------
   A stage of any rift: a small chamber, a mosaic altar in it, the door beyond. Stand beside the altar and the mosaic
   opens over the screen: a 7×7 board of tiles, each a face of one of your party's pets (fillers from the rift's own
   treasures make five kinds). Tap a tile, then a neighbour, to swap them; three or more alike in a line clear.
   Four in a line also clears that whole row; five clears every tile of that kind. Cleared faces fill the mosaic's
   light; at the goal the door opens. Eighteen swaps a round: out of swaps, the mosaic shifts (a fresh board, the
   light kept), so it can never lock. Step away any time: the light is kept.
   riftMatch({ name, goal, how, need, moves, fillers: [ICON keys], layout?, legend? }) -> a puzzle stage entry */
function riftMatch(o) {
  const NEED = o.need || 45, MOVES = o.moves || 18, N = 7, FILL = o.fillers || ['pearl', 'coin', 'crystal'];
  const layout = o.layout || ['##############', '#............#', '#............#', '#.....E......#', '#............#', '#............#', '#.....A......#', '#............#', '#............#', '#.....S......#', '#............#', '##############'];
  function make(X, self, H) {
    const marks = X.M.marks, me = X.me, g = X.g; document.querySelectorAll('.rift-match').forEach(e => e.remove());
    const R = { light: 0, moves: MOVES, round: 1, open: false, busy: false, sel: null, board: null, kinds: [], el: null };
    // the kinds: the party's pets, then the rift's treasures to five
    const party = (typeof partyPets === 'function' ? partyPets() : []).slice(0, 4);
    party.forEach(p => R.kinds.push({ id: 'pet' + p.uid, name: p.name, html: petSVG(formOf(p), { frame: 'fit', eyes: 'normal', mouth: 'smile' }), col: (E8[petElement(p)] || E8.light).color }));
    const FCOL = { pearl: '#DCE8FF', coin: '#FFD447', crystal: '#B983F5', star: '#FFE37A', heart: '#FF9BD2', moon: '#9C88D6', leaf: '#8FE8C8', drop: '#4FA8F0', bolt: '#FFD447' };
    for (const f of FILL.concat(['star', 'heart', 'moon', 'leaf', 'drop'])) { if (R.kinds.length >= 5) break; if (R.kinds.some(k => k.id === f) || !ICON[f]) continue; R.kinds.push({ id: f, name: f, html: ICON[f], col: FCOL[f] || '#B983F5' }); }
    const altar = H.obj({ x: marks.A[0].x, y: marks.A[0].y, kind: 'altar', id: 'A', r: 1.0, h: 1.6, t: 0, label: () => (self.done ? 'The mosaic shines ✓' : `The mosaic · ${R.light}/${NEED} light`), use() { if (!self.done) openBoard(); },
      draw(c, Xs, Ys, T, ob) { const k = Math.min(1, R.light / NEED); c.save(); c.translate(Xs, Ys); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, T * 0.15, T * 0.9, T * 0.32, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#4A4A58'; c.strokeStyle = '#2B2433'; c.lineWidth = 2; GFX.rr(c, -T * 0.8, -T * 0.5, T * 1.6, T * 0.6, 6); c.fill(); c.stroke(); c.fillStyle = '#5E5E6E'; GFX.rr(c, -T * 0.9, -T * 0.65, T * 1.8, T * 0.25, 5); c.fill(); c.stroke();
        // the mosaic face: a grid of little coloured squares, lit as the light grows
        const n = 5, s = T * 0.26, x0 = -s * n / 2, y0 = -T * 0.65 - s * n - T * 0.05; c.fillStyle = '#2B2433'; GFX.rr(c, x0 - 4, y0 - 4, s * n + 8, s * n + 8, 5); c.fill();
        for (let i = 0; i < n * n; i++) { const cx = x0 + (i % n) * s, cy = y0 + Math.floor(i / n) * s, lit = i < Math.round(k * n * n), K = R.kinds[i % R.kinds.length]; c.fillStyle = lit ? K.col : '#3A3A48'; c.fillRect(cx + 1, cy + 1, s - 2, s - 2); if (lit) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(cx + 2, cy + 2, s - 4, (s - 4) * 0.4); } }
        if (k > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.4 * k + (self.done ? 0.2 * Math.sin(ob.t * 4) : 0); blitSized(c, glowSprite('#FFE37A'), x0 - T * 0.6, y0 - T * 0.6, s * n + T * 1.2, s * n + T * 1.2); c.restore(); }
        c.restore(); } });
    H.setExit(marks.E[0].x, marks.E[0].y, 'The way on');
    X.after(1.0, () => X.banner(o.name.toUpperCase(), 'Stand at the mosaic altar to play it: match three of your pets', '#FFE37A', 3.0, true, true));
    /* ---- the board ---- */
    const rnd = n => Math.floor(Math.random() * n);
    let tid = 0;
    const cell = (r, c) => R.board[r * N + c];
    function fresh() { R.board = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { let k; do { k = rnd(R.kinds.length); } while ((c >= 2 && cell(r, c - 1).k === k && cell(r, c - 2).k === k) || (r >= 2 && cell(r - 1, c).k === k && cell(r - 2, c).k === k)); R.board.push({ id: ++tid, k, r, c, pop: false, fall: 0 }); } if (!anyMove()) fresh(); }
    function matches() { const hit = new Set(), rows = new Set(), kinds = new Set(); const run = (cells) => { if (cells.length >= 3) { cells.forEach(t => hit.add(t)); if (cells.length === 4) rows.add(cells[0].r); if (cells.length >= 5) kinds.add(cells[0].k); } };
      for (let r = 0; r < N; r++) { let s = [cell(r, 0)]; for (let c = 1; c < N; c++) { const t = cell(r, c); if (t.k === s[0].k) s.push(t); else { run(s); s = [t]; } } run(s); }
      for (let c = 0; c < N; c++) { let s = [cell(0, c)]; for (let r = 1; r < N; r++) { const t = cell(r, c); if (t.k === s[0].k) s.push(t); else { run(s); s = [t]; } } run(s); }
      return { hit, rows, kinds }; }
    function anyMove() { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) { const r2 = r + dr, c2 = c + dc; if (r2 >= N || c2 >= N) continue; swapK(r, c, r2, c2); const ok = matches().hit.size > 0; swapK(r, c, r2, c2); if (ok) return true; } return false; }
    function swapK(r, c, r2, c2) { const a = cell(r, c), b = cell(r2, c2); const k = a.k; a.k = b.k; b.k = k; }
    /* ---- the overlay ---- */
    const host = () => document.getElementById('arcade');
    function openBoard() { if (R.open) return; R.open = true; if (!R.board) fresh(); if (R.el) R.el.remove(); const el = document.createElement('div'); el.className = 'arc-overlay rift-match'; el.id = 'riftMatch'; R.el = el; host().appendChild(el); render(true); X.sfx.unlock();
      // taps on the board, the close button
      el.addEventListener('click', ev => { const d = ev.target.closest('.rm-tile'); if (d) { const t = R.board.find(q => q.id === +d.dataset.id); if (t) tap(t); return; } if (ev.target.closest('.rm-close')) closeBoard(); }); }
    function closeBoard() { if (!R.open) return; R.open = false; if (R.el) { R.el.remove(); R.el = null; } }
    function render(first) { const el = R.el; if (!el) return; const W = Math.min(window.innerWidth, 440) - 76, size = Math.floor(W / N);
      if (first || !el.firstChild) el.innerHTML = `<div class="rm-card"><div class="rm-head"><b>${o.name}</b><button type="button" class="btn rm-close">Step away</button></div><div class="rm-bar"><i></i><span></span></div><div class="rm-board" style="width:${size * N}px;height:${size * N}px"></div><p class="rm-help">Tap a tile, then a neighbour, to swap. Three alike clear; four clear the row; five clear the kind.</p><p class="rm-moves"></p></div>`;
      const bar = el.querySelector('.rm-bar'), board = el.querySelector('.rm-board'); bar.querySelector('i').style.width = `${Math.min(100, R.light / NEED * 100)}%`; bar.querySelector('span').textContent = `Light ${Math.min(R.light, NEED)}/${NEED}`; el.querySelector('.rm-moves').textContent = `${R.moves} swap${R.moves === 1 ? '' : 's'} left · round ${R.round}`;
      const seen = new Set(); for (const t of R.board) { seen.add(t.id); let d = board.querySelector(`[data-id="${t.id}"]`); if (!d) { d = document.createElement('button'); d.type = 'button'; d.className = 'rm-tile'; d.dataset.id = t.id; d.innerHTML = R.kinds[t.k].html; d.style.setProperty('--c', R.kinds[t.k].col); d.style.width = d.style.height = size + 'px'; d.style.transform = `translate(${t.c * size}px, ${(t.r - (t.fall || 0)) * size}px)`; board.appendChild(d); if (t.fall) requestAnimationFrame(() => { d.style.transform = `translate(${t.c * size}px, ${t.r * size}px)`; }); }
        else { d.style.transform = `translate(${t.c * size}px, ${t.r * size}px)`; if (d.dataset.k != t.k) { d.innerHTML = R.kinds[t.k].html; d.style.setProperty('--c', R.kinds[t.k].col); } }
        d.dataset.k = t.k; d.classList.toggle('sel', R.sel === t); d.classList.toggle('pop', !!t.pop); }
      board.querySelectorAll('.rm-tile').forEach(d => { if (!seen.has(+d.dataset.id)) d.remove(); }); }
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    async function tap(t) { if (R.busy || self.done) return; if (!R.sel) { R.sel = t; render(); X.sfx.boop(); return; } const s = R.sel; if (s === t) { R.sel = null; render(); return; }
      if (Math.abs(s.r - t.r) + Math.abs(s.c - t.c) !== 1) { R.sel = t; render(); X.sfx.boop(); return; }
      R.busy = true; R.sel = null; swapK(s.r, s.c, t.r, t.c); render(); await sleep(160);
      if (!matches().hit.size) { swapK(s.r, s.c, t.r, t.c); render(); X.sfx.wrong(); await sleep(160); R.busy = false; return; }
      R.moves--; await resolve(); R.busy = false; }
    async function resolve() { let chain = 0;
      for (;;) { const m = matches(); if (!m.hit.size) break; chain++;
        for (const r of m.rows) for (let c = 0; c < N; c++) m.hit.add(cell(r, c)); for (const k of m.kinds) for (const t of R.board) if (t.k === k) m.hit.add(t);
        for (const t of m.hit) t.pop = true; R.light += m.hit.size; render(); X.sfx.sparkle(); if (chain > 1) X.sfx.chirp(); await sleep(260);
        // gravity: in each column the surviving tiles fall to the bottom; new tiles drop in from above
        for (let c = 0; c < N; c++) { const col = []; for (let r = N - 1; r >= 0; r--) { const t = cell(r, c); if (!t.pop) col.push(t); } let r = N - 1; for (const t of col) { t.fall = 0; t.r = r--; } let above = 1; while (r >= 0) { col.push({ id: ++tid, k: rnd(R.kinds.length), r, c, pop: false, fall: above++ }); r--; } for (const t of col) R.board[t.r * N + c] = t; }
        render(); await sleep(240); for (const t of R.board) t.fall = 0;
        if (R.light >= NEED) { win(); return; } }
      if (R.moves <= 0) { R.round++; R.moves = MOVES; X.sfx.hum(); fresh(); render(true); X.banner('THE MOSAIC SHIFTS', 'A fresh board; the light is kept', '#B983F5', 2.0, true); return; }
      if (!anyMove()) { fresh(); render(true); } }
    function win() { self.done = true; X.sfx.fanfare(); X.flash(0.35, '#FFE37A'); X.banner('THE MOSAIC SHINES', 'The door opens', '#8FE0A6', 2.6, true, true); X.ring(altar.x, altar.y, 0.3, 5, 0.8, '#FFE37A', 0.4); if (R.el) { R.el.querySelector('.rm-card').classList.add('won'); } setTimeout(closeBoard, 1100); }
    return { R, altar, fresh, matches, tap, resolve, openBoard, closeBoard, win,
      hint() { return self.done ? null : altar; },
      update(dt) { altar.t += dt; if (R.open && (me.dead || g.won)) closeBoard(); },
      goal() { return self.done ? 'The mosaic shines · through the door' : `Light the mosaic · ${R.light}/${NEED} · at the altar`; },
      leave() { closeBoard(); },
    };
  }
  return { name: o.name, goal: o.goal || `Light the mosaic: clear ${NEED} of your pets' faces`, how: o.how || `Stand beside the mosaic altar to open it. Tap a tile, then a neighbour, to swap them: three of the same pet in a line clear; four also clear the row; five clear every tile of that kind. Each face cleared is a light; ${NEED} lights open the door. ${MOVES} swaps a round: out of swaps, the mosaic shifts to a fresh board and the light is kept. Step away any time.`, layout, legend: Object.assign({ A: {}, E: {} }, o.legend || {}), make, need: NEED, moves: MOVES };
}
