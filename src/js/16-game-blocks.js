/* ---------- Gem Drop: clear rows of falling blocks to dig buried gems free ---------- */
const DROP_SHAPES = [
  { c: [[0, 0], [1, 0], [2, 0]], w: 14 }, { c: [[0, 0], [1, 0], [0, 1]], w: 14 }, { c: [[0, 0], [1, 0], [0, 1], [1, 1]], w: 12 },
  { c: [[0, 0], [1, 0], [2, 0], [1, 1]], w: 12 }, { c: [[1, 0], [2, 0], [0, 1], [1, 1]], w: 9 }, { c: [[0, 0], [1, 0], [1, 1], [2, 1]], w: 9 },
  { c: [[0, 0], [0, 1], [0, 2], [1, 2]], w: 10 }, { c: [[1, 0], [1, 1], [1, 2], [0, 2]], w: 10 }, { c: [[0, 0], [1, 0], [2, 0], [3, 0]], w: 9 },
];
const CANDY = ['#FF8FB1', '#8FD9B6', '#86C8F2', '#FFD447', '#B8A3F2', '#FF9F43', '#7FE0F2'];
GAMES.blocks = {
  create(api) {
    const S = api.def, COLS = 8, ROWS = 14, HID = 3;
    const R = ROWS + HID;
    const g = { cs: 30, bx: 0, by: 0, t: 0, score: 0, pieces: 0, gemsLeft: S.gems, cur: null, next: null, fallT: 0, lock: 0, locks: 0, clearing: null, over: false, won: false, riseT: S.rise || 0, das: { dir: 0, t: 0 }, soft: false, cheer: 0, fly: [] };
    const board = Array.from({ length: R }, () => Array(COLS).fill(null));
    // rubble at the bottom, every row with a gap, gems hidden inside
    function rubbleRow(withGem) {
      const row = Array.from({ length: COLS }, () => ({ k: 'rock' }));
      const holes = new Set([Math.floor(Math.random() * COLS)]);
      if (Math.random() < 0.45) holes.add(Math.floor(Math.random() * COLS));
      holes.forEach(h => { row[h] = null; });
      return row;
    }
    for (let i = 0; i < S.rows; i++) board[R - 1 - i] = rubbleRow();
    const rockCells = [];
    for (let r = R - S.rows; r < R; r++) for (let c = 0; c < COLS; c++) if (board[r][c]) rockCells.push([r, c]);
    for (let i = 0; i < S.gems && rockCells.length; i++) {
      // spread gems across different rows where possible
      const pool = rockCells.filter(([r]) => !board[r].some(x => x && x.gem));
      const pickFrom = pool.length ? pool : rockCells;
      const [r, c] = pickFrom.splice(Math.floor(Math.random() * pickFrom.length), 1)[0];
      const idx = rockCells.findIndex(x => x[0] === r && x[1] === c); if (idx >= 0) rockCells.splice(idx, 1);
      board[r][c] = { k: 'rock', gem: ARC_GEMS[i % ARC_GEMS.length] };
    }
    const wpk = () => { let tot = 0; DROP_SHAPES.forEach(s2 => { tot += s2.w; }); let x = Math.random() * tot; for (const s2 of DROP_SHAPES) { x -= s2.w; if (x < 0) return s2; } return DROP_SHAPES[0]; };
    const newPiece = () => ({ cells: wpk().c.map(p => p.slice()), color: CANDY[Math.floor(Math.random() * CANDY.length)], x: 0, y: 0 });
    const fits = (cells, x, y) => cells.every(([cx, cy]) => { const X = x + cx, Y = y + cy; return X >= 0 && X < COLS && Y < R && (Y < 0 || !board[Y][X]); });
    function spawn() {
      g.cur = g.next || newPiece(); g.next = newPiece();
      const w = Math.max(...g.cur.cells.map(p => p[0])) + 1;
      g.cur.x = Math.floor((COLS - w) / 2); g.cur.y = HID - 2;
      g.lock = 0; g.locks = 0; g.fallT = 0;
      if (!fits(g.cur.cells, g.cur.x, g.cur.y)) { g.over = true; api.sfx.wrong(); setTimeout(() => api.lose('The blocks piled up to the top!', g.score), 700); }
    }
    function layout() {
      const W = api.W, H = api.H, side = 84;
      g.cs = Math.max(14, Math.floor(Math.min((W - side - 24) / COLS, (H - 16) / ROWS)));
      g.bx = Math.round((W - (COLS * g.cs + side + 10)) / 2); g.by = Math.round((H - ROWS * g.cs) / 2);
      g.side = g.bx + COLS * g.cs + 10;
    }
    layout();
    const hud = () => api.hud({ score: g.score, hearts: 0, max: 0, goal: `Gems ${S.gems - g.gemsLeft} / ${S.gems} · pieces ${g.pieces}`, prog: (S.gems - g.gemsLeft) / S.gems });
    hud();
    spawn();
    function move(dx) { if (!g.cur || g.clearing || g.over) return false; if (fits(g.cur.cells, g.cur.x + dx, g.cur.y)) { g.cur.x += dx; resetLock(); return true; } return false; }
    function rotate() {
      if (!g.cur || g.clearing || g.over) return;
      const rot = g.cur.cells.map(([x, y]) => [-y, x]);
      const mx = Math.min(...rot.map(p => p[0])), my = Math.min(...rot.map(p => p[1]));
      const cells = rot.map(([x, y]) => [x - mx, y - my]);
      for (const [kx, ky] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]]) {
        if (fits(cells, g.cur.x + kx, g.cur.y + ky)) { g.cur.cells = cells; g.cur.x += kx; g.cur.y += ky; resetLock(); api.sfx.blip(); return; }
      }
    }
    function resetLock() { if (g.lock > 0 && g.locks < 10) { g.lock = 0; g.locks++; } }
    function landed() { return !fits(g.cur.cells, g.cur.x, g.cur.y + 1); }
    function hardDrop() {
      if (!g.cur || g.clearing || g.over) return;
      let n = 0; while (fits(g.cur.cells, g.cur.x, g.cur.y + 1)) { g.cur.y++; n++; }
      g.score += n * 2; api.shake(3, 0.12);
      lockPiece();
    }
    function lockPiece() {
      for (const [cx, cy] of g.cur.cells) { const X = g.cur.x + cx, Y = g.cur.y + cy; if (Y >= 0) board[Y][X] = { k: 'candy', color: g.cur.color }; }
      g.pieces++; api.sfx.thud();
      g.cur = null;
      const full = [];
      for (let r = 0; r < R; r++) if (board[r].every(Boolean)) full.push(r);
      if (full.length) { g.clearing = { rows: full, t: 0.28 }; api.sfx.clear(); }
      else afterLock();
      hud();
    }
    function afterLock() {
      // anything stuck in the hidden rows means the pile reached the top
      if (board.slice(0, HID).some(row => row.some(Boolean))) { g.over = true; api.sfx.wrong(); setTimeout(() => api.lose('The blocks piled up to the top!', g.score), 700); return; }
      if (g.gemsLeft <= 0) return;
      spawn();
    }
    function finishClear() {
      const rows = g.clearing.rows; g.clearing = null;
      let gems = 0;
      rows.forEach(r => board[r].forEach((cell, c) => { if (cell && cell.gem) { gems++; g.fly.push({ x: g.bx + (c + 0.5) * g.cs, y: g.by + (r - HID + 0.5) * g.cs, c: cell.gem, t: 0 }); } }));
      rows.sort((a, b) => a - b).forEach(r => { board.splice(r, 1); board.unshift(Array(COLS).fill(null)); });
      g.score += api.hit(g.bx + COLS * g.cs / 2, g.by + 70, 100 * rows.length * rows.length + gems * 200, true); if (rows.length > 1) api.hitstop(0.1 * rows.length);
      if (rows.length > 1) api.pop(g.bx + COLS * g.cs / 2, g.by + 40, rows.length === 2 ? 'Double!' : rows.length === 3 ? 'Triple!' : 'Mega!', '#FFE37A', 22);
      if (gems) { g.gemsLeft -= gems; g.cheer = 1.2; api.sfx.sparkle(); api.pop(g.side + 40, g.by + 40, gems > 1 ? `${gems} gems!` : 'A gem!', '#7FE0F2', 20); }
      hud();
      if (g.gemsLeft <= 0 && !g.won) {
        g.won = true;
        const stars = g.pieces <= S.par ? 3 : g.pieces <= Math.round(S.par * 1.4) ? 2 : 1;
        setTimeout(() => api.win(stars, g.score + Math.max(0, (S.par * 1.4 - g.pieces)) * 20), 900);
        return;
      }
      afterLock();
    }
    function rise() {
      if (board[0].some(Boolean) || board.slice(0, HID).some(row => row.some(Boolean))) return;
      board.shift(); board.push(rubbleRow());
      if (g.cur && !fits(g.cur.cells, g.cur.x, g.cur.y)) g.cur.y--;
      api.shake(4, 0.2); api.sfx.thud(); api.miss(); api.pop(g.bx + COLS * g.cs / 2, g.by + ROWS * g.cs - 20, 'The rock rises!', '#FFB08A');
      if (board.slice(0, HID).some(row => row.some(Boolean))) { g.over = true; setTimeout(() => api.lose('The rock pushed the blocks to the top!', g.score), 700); }
    }
    let tp = null;
    return {
      resize() { layout(); },
      down(x, y) { tp = { x, y, sx: x, sy: y, t: performance.now(), moved: false, cells: 0 }; },
      move(x, y) {
        if (!tp || !g.cur) return;
        const dx = x - tp.x;
        if (Math.abs(dx) > g.cs * 0.8) { const st2 = Math.sign(dx); if (move(st2)) api.sfx.blip(); tp.x = x; tp.moved = true; }
        if (y - tp.y > g.cs * 1.2 && Math.abs(x - tp.sx) < g.cs) { if (g.cur && fits(g.cur.cells, g.cur.x, g.cur.y + 1)) { g.cur.y++; g.score++; } tp.y = y; tp.moved = true; }
      },
      up(x, y) {
        if (!tp) return;
        const dt2 = (performance.now() - tp.t) / 1000, dy = y - tp.sy;
        if (!tp.moved && dt2 < 0.35) rotate();
        else if (dy > g.cs * 2 && dy / Math.max(0.05, dt2) > 900) hardDrop();
        tp = null;
      },
      key(k, on) {
        if (k === 'left' || k === 'right') { const d = k === 'left' ? -1 : 1; if (on) { move(d); g.das = { dir: d, t: 0.17 }; } else if (g.das.dir === d) g.das.dir = 0; }
        if (k === 'rotate' && on) rotate();
        if ((k === 'soft' || k === 'down') ) g.soft = on;
        if (k === 'drop' && on) hardDrop();
      },
      update(dt) {
        g.t += dt; g.cheer = Math.max(0, g.cheer - dt);
        g.fly = g.fly.filter(f => (f.t += dt) < 0.9);
        if (g.over || g.won) return;
        if (S.rise) { g.riseT -= dt; if (g.riseT <= 0) { g.riseT = S.rise; rise(); } }
        if (g.clearing) { g.clearing.t -= dt; if (g.clearing.t <= 0) finishClear(); return; }
        if (!g.cur) return;
        if (g.das.dir) { g.das.t -= dt; if (g.das.t <= 0) { g.das.t = 0.06; move(g.das.dir); } }
        const speed = g.soft ? 0.045 : S.fall;
        if (landed()) {
          g.lock += dt;
          if (g.lock >= 0.45) lockPiece();
        } else {
          g.fallT += dt;
          while (g.fallT >= speed && g.cur && !landed()) { g.fallT -= speed; g.cur.y++; if (g.soft) g.score++; }
        }
      },
      draw(c) {
        const cs = g.cs, bx = g.bx, by = g.by, W = api.W, H = api.H;
        const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2B2246'); bg.addColorStop(1, '#1A1430');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        // crystals in the cave walls
        c.globalAlpha = 0.35;
        [[0.05, 0.2, '#7FE0F2'], [0.92, 0.35, '#B8A3F2'], [0.08, 0.78, '#FF9BC8'], [0.95, 0.85, '#8FD9B6']].forEach(([fx, fy, col]) => { c.fillStyle = col; c.beginPath(); c.moveTo(fx * W, fy * H - 30); c.lineTo(fx * W + 12, fy * H); c.lineTo(fx * W - 12, fy * H); c.fill(); });
        c.globalAlpha = 1;
        // rock strata behind the shaft, faintly lit from above, with the board as a well cut into them
        if (!g.strata) { const R = mulberry32(9); g.strata = Array.from({ length: 9 }, (_, i) => ({ y: i / 9, h: 0.05 + R() * 0.07, k: 0.5 + R() * 0.5, off: R() * 40 })); }
        for (const st2 of g.strata) { c.fillStyle = `rgba(90,70,140,${(0.08 * st2.k).toFixed(3)})`; c.beginPath(); c.moveTo(0, st2.y * H + st2.off * 0.3); c.bezierCurveTo(W * 0.3, st2.y * H - 18 * st2.k, W * 0.7, st2.y * H + 18 * st2.k, W, st2.y * H + st2.off * 0.2); c.lineTo(W, st2.y * H + st2.h * H); c.bezierCurveTo(W * 0.7, st2.y * H + st2.h * H + 16, W * 0.3, st2.y * H + st2.h * H - 16, 0, st2.y * H + st2.h * H); c.closePath(); c.fill(); }
        { const lg = c.createRadialGradient(W * 0.5, -40, 20, W * 0.5, -40, H * 0.9); lg.addColorStop(0, 'rgba(201,178,255,.16)'); lg.addColorStop(1, 'rgba(201,178,255,0)'); c.fillStyle = lg; c.fillRect(0, 0, W, H); }
        c.fillStyle = 'rgba(0,0,0,.35)'; GFX.rr(c, bx - 1, by + 1, COLS * cs + 10, ROWS * cs + 10, 12); c.fill();
        c.fillStyle = '#120E24'; c.strokeStyle = '#000'; c.lineWidth = 3;
        GFX.rr(c, bx - 5, by - 5, COLS * cs + 10, ROWS * cs + 10, 12); c.fill(); c.stroke();
        { const ig = c.createLinearGradient(bx, by, bx + COLS * cs, by + ROWS * cs); ig.addColorStop(0, 'rgba(0,0,0,.35)'); ig.addColorStop(0.3, 'rgba(0,0,0,0)'); ig.addColorStop(1, 'rgba(255,255,255,.03)'); c.fillStyle = ig; GFX.rr(c, bx - 5, by - 5, COLS * cs + 10, ROWS * cs + 10, 12); c.fill(); }
        c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1.5; GFX.rr(c, bx - 3, by - 3, COLS * cs + 6, ROWS * cs + 6, 10); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.06)';
        for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) { c.beginPath(); c.arc(bx + (col + 0.5) * cs, by + (r + 0.5) * cs, 1.6, 0, 6.283); c.fill(); }
        if (g.cur && !g.clearing) {
          const xs = g.cur.cells.map(p => g.cur.x + p[0]);
          c.fillStyle = 'rgba(255,255,255,.05)';
          for (let col = Math.min(...xs); col <= Math.max(...xs); col++) c.fillRect(bx + col * cs, by, cs, ROWS * cs);
        }
        for (let r = HID; r < R; r++) for (let col = 0; col < COLS; col++) {
          const cell = board[r][col]; if (!cell) continue;
          const flash = g.clearing && g.clearing.rows.includes(r);
          block(c, bx + col * cs, by + (r - HID) * cs, cs, cell, flash);
        }
        if (g.cur) for (const [cx, cy] of g.cur.cells) { const Y = g.cur.y + cy; if (Y >= HID) block(c, bx + (g.cur.x + cx) * cs, by + (Y - HID) * cs, cs, { k: 'candy', color: g.cur.color }); }
        // side panel
        const sx = g.side;
        GFX.text(c, 'Next', sx + 40, by + 10, 13, '#C9C2F2');
        c.fillStyle = '#120E24'; GFX.rr(c, sx, by + 22, 80, 70, 12); c.fill(); c.strokeStyle = '#000'; c.lineWidth = 2.5; c.stroke();
        if (g.next) { const pc = Math.min(18, cs * 0.7), cw = Math.max(...g.next.cells.map(p => p[0])) + 1, ch = Math.max(...g.next.cells.map(p => p[1])) + 1; for (const [cx, cy] of g.next.cells) block(c, sx + 40 - cw * pc / 2 + cx * pc, by + 57 - ch * pc / 2 + cy * pc, pc, { k: 'candy', color: g.next.color }); }
        GFX.text(c, 'Gems', sx + 40, by + 112, 13, '#C9C2F2');
        for (let i = 0; i < S.gems; i++) GFX.gem(c, sx + 14 + (i % 3) * 26, by + 134 + Math.floor(i / 3) * 28, 9, i < S.gems - g.gemsLeft ? ARC_GEMS[i % 6] : '#4A4370');
        GFX.text(c, `${g.pieces}/${S.par}`, sx + 40, by + 196, 15, g.pieces <= S.par ? '#8FD9B6' : '#FFB08A');
        GFX.text(c, 'pieces', sx + 40, by + 214, 11, '#C9C2F2');
        const ph = Math.min(64, ROWS * cs - 250);
        if (ph > 30) api.pet(c, sx + 40, by + ROWS * cs, ph, { face: g.cheer > 0 ? 'happy' : g.over ? 'hurt' : 'normal', sy: 1 + (g.cheer > 0 ? Math.abs(Math.sin(g.t * 12)) * 0.08 : 0) });
        for (const f of g.fly) { const k = f.t / 0.9, tx = sx + 40, ty = by + 134; GFX.gem(c, lerp(f.x, tx, k * k), lerp(f.y, ty, k * k) - Math.sin(k * Math.PI) * 60, 11, f.c); }
        if (S.rise && !g.over && !g.won) { const k = 1 - g.riseT / S.rise; c.fillStyle = 'rgba(255,176,138,.25)'; c.fillRect(bx, by + ROWS * cs + 6, COLS * cs * k, 5); }
      },
    };
    function block(c, x, y, s, cell, flash) {
      const pad = Math.max(1, s * 0.06), w = s - pad * 2;
      if (flash) { c.fillStyle = '#FFFFFF'; GFX.rr(c, x + pad, y + pad, w, w, s * 0.22); c.fill(); return; }
      if (cell.k === 'rock') {
        c.fillStyle = '#8C7B6B'; GFX.rr(c, x + pad, y + pad, w, w, s * 0.16); c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = 2; c.stroke();
        c.strokeStyle = 'rgba(43,36,51,.35)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + s * 0.25, y + s * 0.3); c.lineTo(x + s * 0.45, y + s * 0.45); c.lineTo(x + s * 0.4, y + s * 0.7); c.stroke();
        if (cell.gem) GFX.gem(c, x + s / 2, y + s / 2, s * 0.32, cell.gem);
        return;
      }
      const bg2 = c.createLinearGradient(x, y, x + s, y + s); bg2.addColorStop(0, shadeC(cell.color, 0.22)); bg2.addColorStop(0.5, cell.color); bg2.addColorStop(1, shadeC(cell.color, -0.22));
      c.fillStyle = bg2; GFX.rr(c, x + pad, y + pad, w, w, s * 0.24); c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(43,36,51,.16)'; GFX.rr(c, x + pad + s * 0.12, y + s * 0.62, w - s * 0.24, s * 0.2, s * 0.08); c.fill();
      c.fillStyle = 'rgba(255,255,255,.62)'; GFX.rr(c, x + s * 0.2, y + s * 0.16, s * 0.34, s * 0.16, s * 0.08); c.fill();
    }
  },
};
