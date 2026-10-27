/* ---------- Snack Maze: eat enough berries, dodge the dust bunnies ---------- */
const MAZES = [
  ['###############', '#o.....#.....o#', '#.##.#.#.#.##.#', '#....#...#....#', '#.##.##.##.##.#', '#.............#', '##.#.##=##.#.##', '#..#.#GGG#.#..#', '#.##.#####.##.#', '#......P......#', '#.###.###.###.#', '#o...........o#', '###############'],
  ['###############', '#o.....#.....o#', '#.##.#.#.#.##.#', '#.............#', '##.#.##.##.#.##', 'T..#.......#..T', '##.#.##=##.#.##', '#....#GGG#....#', '#.##.#####.##.#', '#......P......#', '#.##.#####.##.#', '#o...........o#', '#.###.#.#.###.#', '#.............#', '###############'],
  ['###############', '#o..#.....#..o#', '#.#.#.###.#.#.#', '#.#.........#.#', '#.###.#.#.###.#', '#.............#', '###.#.#=#.#.###', 'T...#.GGG.#...T', '###.#.###.#.###', '#.............#', '#.###.#P#.###.#', '#...#.....#...#', '###.#.###.#.###', '#o...........o#', '#.###.#.#.###.#', '#.............#', '###############'],
  ['###############', '#o...#...#...o#', '#.##.#.#.#.##.#', '#.............#', '#.#.###.###.#.#', 'T.#...#.#...#.T', '#.###.#.#.###.#', '#.............#', '###.#.#=#.#.###', '#...#.GGG.#...#', '#.#.#.###.#.#.#', '#.#....P....#.#', '#.###.###.###.#', '#...#.....#...#', '#o#.#.#.#.#.#o#', '#.............#', '###############'],
];
GAMES.maze = {
  create(api) {
    const S = api.def, M = MAZES[S.maze] || MAZES[0];
    const RW = M.length, CL = M[0].length;
    const grid = M.map(r => r.split(''));
    let start = [7, 9], door = [7, 6];
    const pen = [], food = new Map();
    for (let r = 0; r < RW; r++) for (let c = 0; c < CL; c++) {
      const ch = grid[r][c];
      if (ch === '.' || ch === 'o') food.set(r * CL + c, ch);
      if (ch === 'P') { start = [c, r]; grid[r][c] = ' '; }
      if (ch === '=') door = [c, r];
      if (ch === 'G') pen.push([c, r]);
    }
    // the goal is a number of berries (star cookies don't count); the maze holds more, so risky corners can be skipped
    const inMaze = [...food.values()].filter(f => f === '.').length;
    const goal = Math.min(S.berries || inMaze, inMaze);
    const wrapC = c => (c + CL) % CL;
    const wall = (c, r) => { if (r < 0 || r >= RW) return true; const ch = grid[r][wrapC(c)]; return ch === '#' || ch === 'G' || ch === '='; };
    const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const COLORS = ['#8E7CC3', '#5DA4D4', '#E07B9A', '#E8A33D'];
    const corners = [[CL - 2, 1], [1, 1], [CL - 2, RW - 2], [1, RW - 2]];
    const g = { cs: 20, ox: 0, oy: 0, bg: null, t: 0, score: 0, hearts: 3, eaten: 0, mode: 'scatter', modeT: 5, phase: 0, caught: 0, combo: 0, gem: null, gemDone: false, wanderT: 0, wander: [7, 7], won: false };
    const P = { c: start[0], r: start[1], dx: 0, dy: 0, ndx: -1, ndy: 0, p: 0, face: -1, x: start[0], y: start[1] };
    const exitTile = [door[0], door[1] - 1];
    const CH = Array.from({ length: S.chasers }, (_, i) => ({ i, col: COLORS[i], c: 0, r: 0, dx: 0, dy: 0, p: 0, state: 'pen', t: 0, scared: 0, x: 0, y: 0, ex: 0 }));
    function homeChasers() {
      CH.forEach((ch, i) => { const s2 = pen[i % pen.length]; ch.c = s2[0]; ch.r = s2[1]; ch.x = s2[0]; ch.y = s2[1]; ch.dx = ch.dy = 0; ch.p = 0; ch.state = 'pen'; ch.t = 0.8 + i * 2.2; ch.scared = 0; });
    }
    homeChasers();
    function layout() {
      g.cs = Math.floor(Math.min(api.W / CL, (api.H - 6) / RW));
      g.ox = Math.round((api.W - g.cs * CL) / 2); g.oy = Math.round((api.H - g.cs * RW) / 2);
      // pre-draw the hedges and garden paths
      const cv = document.createElement('canvas'), dpr = arc.dpr;
      cv.width = Math.ceil(api.W * dpr); cv.height = Math.ceil(api.H * dpr);
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cs = g.cs, ox = g.ox, oy = g.oy;
      { const bg = c.createLinearGradient(0, 0, api.W, api.H); bg.addColorStop(0, '#1E4A2E'); bg.addColorStop(1, '#0F2418'); c.fillStyle = bg; c.fillRect(0, 0, api.W, api.H); }
      c.fillStyle = 'rgba(0,0,0,.28)'; GFX.rr(c, ox - 2, oy + 2, cs * CL + 8, cs * RW + 8, 10); c.fill();
      { const hg = c.createLinearGradient(ox, oy, ox + cs * CL, oy + cs * RW); hg.addColorStop(0, '#4A9C5C'); hg.addColorStop(1, '#2E7A43'); c.fillStyle = hg; } GFX.rr(c, ox - 4, oy - 4, cs * CL + 8, cs * RW + 8, 10); c.fill();
      const Rr = mulberry32(7);
      for (let i = 0; i < CL * RW * 3; i++) { c.fillStyle = Rr() < 0.5 ? '#4FA35E' : '#2F7A43'; c.beginPath(); c.arc(ox + Rr() * cs * CL, oy + Rr() * cs * RW, cs * (0.12 + Rr() * 0.16), 0, 6.283); c.fill(); }
      const open = (cc, r) => r >= 0 && r < RW && cc >= 0 && cc < CL && !wall(cc, r);
      const pw = cs * 0.8;
      // the paths as one shape, so the hedges can be lit like raised blocks around a sunken trail
      const P2 = new Path2D();
      const addRR = (x, y, w, h, rr) => { if (P2.roundRect) P2.roundRect(x, y, w, h, rr); else P2.rect(x, y, w, h); };
      for (let r = 0; r < RW; r++) for (let cc = 0; cc < CL; cc++) {
        if (!open(cc, r)) continue;
        const x = ox + cc * cs + cs / 2, y = oy + r * cs + cs / 2;
        addRR(x - pw / 2, y - pw / 2, pw, pw, pw * 0.3);
        if (open(cc + 1, r)) P2.rect(x, y - pw / 2, cs, pw);
        if (open(cc, r + 1)) P2.rect(x - pw / 2, y, pw, cs);
        if (grid[r][cc] === 'T') P2.rect(cc === 0 ? x - cs : x, y - pw / 2, cs, pw);
      }
      const d = Math.max(1.5, cs * 0.07);
      // hedge faces: the side that looks down into the trail is dark, the side that faces the light is bright
      c.save(); c.translate(-d, -d); c.lineWidth = cs * 0.16; c.lineJoin = 'round'; c.strokeStyle = '#276A3A'; c.stroke(P2); c.restore();
      c.save(); c.translate(d * 1.2, d * 1.2); c.lineWidth = cs * 0.16; c.lineJoin = 'round'; c.strokeStyle = '#6FC278'; c.stroke(P2); c.restore();
      c.save(); c.lineWidth = Math.max(2, cs * 0.09); c.lineJoin = 'round'; c.strokeStyle = GFX.line; c.globalAlpha = 0.35; c.stroke(P2); c.restore();
      // the trail: packed earth in the hedge's shadow, sunlit sand where it opens up
      c.fillStyle = '#C8A478'; c.fill(P2);
      c.save(); c.clip(P2); c.translate(d * 1.6, d * 1.8); c.fillStyle = '#F2DDAF'; c.fill(P2);
      c.translate(-d * 1.6, -d * 1.8);
      for (let i = 0; i < CL * RW; i++) { c.fillStyle = Rr() < 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(120,80,40,.18)'; c.beginPath(); c.arc(ox + Rr() * cs * CL, oy + Rr() * cs * RW, 1 + Rr() * 1.6, 0, 6.283); c.fill(); }
      c.restore();
      // pen
      const px0 = Math.min(...pen.map(p => p[0])), px1 = Math.max(...pen.map(p => p[0])), py = pen[0][1];
      c.fillStyle = '#C9A27A'; GFX.rr(c, ox + px0 * cs + 2, oy + py * cs + 2, (px1 - px0 + 1) * cs - 4, cs - 4, 6); c.fill();
      c.strokeStyle = '#FF8FB1'; c.lineWidth = Math.max(3, cs * 0.18); c.lineCap = 'round';
      c.beginPath(); c.moveTo(ox + door[0] * cs + 3, oy + door[1] * cs + cs * 0.55); c.lineTo(ox + door[0] * cs + cs - 3, oy + door[1] * cs + cs * 0.55); c.stroke();
      g.bg = cv;
    }
    layout();
    const hud = () => api.hud({ score: g.score, hearts: g.hearts, max: 3, goal: `${g.eaten} / ${goal} berries`, prog: g.eaten / goal });
    hud();
    const setDir = (dx, dy) => { P.ndx = dx; P.ndy = dy; };
    function stepMover(m, speed, dt, canDoor, onTile, choose) {
      if (m.dx === 0 && m.dy === 0) { const d = choose(m); if (d && !blocked(m.c + d[0], m.r + d[1], canDoor)) { m.dx = d[0]; m.dy = d[1]; } else return; }
      m.p += speed * dt;
      let guard = 0;
      while (m.p >= 1 && guard++ < 4) {
        m.p -= 1; m.c = wrapC(m.c + m.dx); m.r += m.dy;
        if (onTile) onTile(m);
        const d = choose(m);
        if (d && !blocked(m.c + d[0], m.r + d[1], canDoor)) { m.dx = d[0]; m.dy = d[1]; }
        else if (blocked(m.c + m.dx, m.r + m.dy, canDoor)) { m.dx = 0; m.dy = 0; m.p = 0; break; }
      }
      m.x = m.c + m.dx * m.p; m.y = m.r + m.dy * m.p;
    }
    const blocked = (c, r, canDoor) => { if (r < 0 || r >= RW) return true; const ch = grid[r][wrapC(c)]; return ch === '#' || ch === 'G' || (ch === '=' && !canDoor); };
    function eat(m) {
      const k = m.r * CL + m.c, f = food.get(k);
      if (f) {
        food.delete(k);
        if (f === 'o') { g.score += api.hit(px(P.x), py(P.y) - 16, 50, true); g.combo = 0; CH.forEach(ch => { if (ch.state === 'roam') { ch.scared = S.power; if (ch.dx || ch.dy) { ch.c = wrapC(ch.c + ch.dx); ch.r += ch.dy; ch.p = 1 - ch.p; ch.dx = -ch.dx; ch.dy = -ch.dy; } } }); api.sfx.sparkle(); api.pop(px(m.x), py(m.y) - 10, 'Power!', '#FFE37A'); }
        else { g.eaten++; g.score += api.hit(px(P.x), py(P.y) - 16, 10); if (g.eaten % 2) api.sfx.bubble(); }
        if (!g.gemDone && !g.gem && g.eaten >= goal * 0.4) { g.gem = { c: start[0], r: start[1], t: 9 }; }
        hud();
        if (g.eaten >= goal && !g.won) { g.won = true; api.pop(px(P.x), py(P.y) - 20, `${goal} berries!`, '#FFE37A', 22); setTimeout(() => api.win(g.hearts, g.score + g.hearts * 100), 800); }
      }
      if (g.gem && g.gem.c === m.c && g.gem.r === m.r) { g.score += api.hit(px(m.x), py(m.y) - 14, 300, true); g.gem = null; g.gemDone = true; api.pop(px(m.x), py(m.y) - 14, '+300', '#7FE0F2', 20); api.burst(px(m.x), py(m.y), '#7FE0F2', 14); api.sfx.fanfare(); hud(); }
    }
    const px = x => g.ox + (x + 0.5) * g.cs, py = y => g.oy + (y + 0.5) * g.cs;
    function chaserTarget(ch) {
      if (ch.scared > 0) return null;
      if (g.mode === 'scatter') return corners[ch.i % 4];
      switch (ch.i) {
        case 0: return [P.c, P.r];
        case 1: return [P.c + (P.dx || P.ndx) * 4, P.r + (P.dy || P.ndy) * 4];
        case 2: return g.wander;
        default: return hyp(ch.c - P.c, ch.r - P.r) > 6 ? [P.c, P.r] : corners[3];
      }
    }
    function chooseCh(ch) {
      const opts = DIRS.filter(([dx, dy]) => !(dx === -ch.dx && dy === -ch.dy && (dx || dy)) && !blocked(ch.c + dx, ch.r + dy, false));
      if (!opts.length) return [-ch.dx, -ch.dy];
      const tg = chaserTarget(ch);
      if (!tg) return opts[Math.floor(Math.random() * opts.length)];
      let best = opts[0], bd = 1e9;
      for (const o of opts) { const d = hyp(ch.c + o[0] - tg[0], ch.r + o[1] - tg[1]); if (d < bd) { bd = d; best = o; } }
      return best;
    }
    function caught() {
      g.hearts--; g.caught = 1.3; api.sfx.squeak(); api.shake(8); buzz(40); api.miss(); hud();
      if (g.hearts <= 0) { setTimeout(() => api.lose('The dust bunnies got you!', g.score), 900); }
    }
    let sw = null;
    return {
      _dbg: { g, P, CH, food, blocked, CL, RW, goal },
      resize() { layout(); },
      down(x, y) { sw = { x, y, moved: false }; },
      move(x, y) {
        if (!sw) return;
        const dx = x - sw.x, dy = y - sw.y;
        if (hyp(dx, dy) > 16) { if (Math.abs(dx) > Math.abs(dy)) setDir(Math.sign(dx), 0); else setDir(0, Math.sign(dy)); sw.x = x; sw.y = y; sw.moved = true; }
      },
      up(x, y) {
        if (sw && !sw.moved) { const dx = x - px(P.x), dy = y - py(P.y); if (Math.abs(dx) > Math.abs(dy)) setDir(Math.sign(dx), 0); else setDir(0, Math.sign(dy)); }
        sw = null;
      },
      key(k, on) { if (!on) return; if (k === 'left') setDir(-1, 0); if (k === 'right') setDir(1, 0); if (k === 'up') setDir(0, -1); if (k === 'down') setDir(0, 1); },
      update(dt) {
        g.t += dt;
        if (g.won) return;
        if (g.caught > 0) {
          g.caught -= dt;
          if (g.caught <= 0 && g.hearts > 0) { P.c = start[0]; P.r = start[1]; P.x = P.c; P.y = P.r; P.dx = P.dy = 0; P.p = 0; P.ndx = -1; P.ndy = 0; homeChasers(); g.mode = 'scatter'; g.modeT = 4; }
          return;
        }
        if (g.gem) { g.gem.t -= dt; if (g.gem.t <= 0) { g.gem = null; g.gemDone = true; } }
        g.modeT -= dt;
        if (g.modeT <= 0) { g.phase++; g.mode = g.mode === 'scatter' ? 'chase' : 'scatter'; g.modeT = g.mode === 'chase' ? (g.phase > 2 ? 999 : 16) : 5; }
        g.wanderT -= dt; if (g.wanderT <= 0) { g.wanderT = 3; g.wander = [Math.floor(Math.random() * CL), Math.floor(Math.random() * RW)]; }
        // the pet
        if ((P.ndx || P.ndy) && P.ndx === -P.dx && P.ndy === -P.dy && (P.dx || P.dy)) { P.c = wrapC(P.c + P.dx); P.r += P.dy; P.p = 1 - P.p; P.dx = P.ndx; P.dy = P.ndy; }
        stepMover(P, 6.4, dt, false, eat, m => ((m.ndx || m.ndy) && !blocked(m.c + m.ndx, m.r + m.ndy, false)) ? [m.ndx, m.ndy] : (m.dx || m.dy ? [m.dx, m.dy] : null));
        if (P.dx) P.face = P.dx;
        if (g.won) return;   // the last berry wins, even with a dust bunny right behind
        // the dust bunnies
        for (const ch of CH) {
          if (ch.state === 'pen') { ch.t -= dt; ch.y = ch.r + Math.sin(g.t * 5 + ch.i) * 0.12; ch.x = ch.c; if (ch.t <= 0) { ch.state = 'exit'; ch.ex = 0; ch.sx = ch.x; ch.sy = ch.r; } continue; }
          if (ch.state === 'exit') {
            ch.ex += dt / 0.9;
            const k = clamp(ch.ex, 0, 1), mx = door[0], my = door[1];
            if (k < 0.5) { ch.x = lerp(ch.sx, mx, k * 2); ch.y = lerp(ch.sy, my + 1, k * 2); } else { ch.x = mx; ch.y = lerp(my + 1, exitTile[1], (k - 0.5) * 2); }
            if (k >= 1) { ch.state = 'roam'; ch.c = exitTile[0]; ch.r = exitTile[1]; ch.dx = Math.random() < 0.5 ? -1 : 1; ch.dy = 0; ch.p = 0; if (blocked(ch.c + ch.dx, ch.r, false)) ch.dx = -ch.dx; }
            continue;
          }
          if (ch.state === 'poof') { ch.t -= dt; if (ch.t <= 0) { const s2 = pen[ch.i % pen.length]; ch.c = s2[0]; ch.r = s2[1]; ch.state = 'pen'; ch.t = 0.6; ch.scared = 0; } continue; }
          ch.scared = Math.max(0, ch.scared - dt);
          const sp = ch.scared > 0 ? 3.2 : S.speed * (g.mode === 'scatter' ? 0.92 : 1);
          stepMover(ch, sp, dt, false, null, chooseCh);
          if (hyp(ch.x - P.x, ch.y - P.y) < 0.62) {
            if (ch.scared > 0) { g.combo++; const pts = api.hit(px(ch.x), py(ch.y), 200 * g.combo, true); g.score += pts; api.hitstop(0.12); ch.state = 'poof'; ch.t = 3; api.burst(px(ch.x), py(ch.y), '#C9C2F2', 14); api.pop(px(ch.x), py(ch.y) - 12, '+' + pts, '#FFFFFF'); api.sfx.pop(); hud(); }
            else { caught(); break; }
          }
        }
      },
      draw(c) {
        if (g.bg) c.drawImage(g.bg, 0, 0, api.W, api.H);
        const cs = g.cs;
        for (const [k, f] of food) {
          const x = g.ox + (k % CL + 0.5) * cs, y = g.oy + (Math.floor(k / CL) + 0.5) * cs;
          if (f === 'o') { const r = cs * (0.3 + 0.04 * Math.sin(g.t * 6)); GFX.blob(c, x, y, r, '#E7B46C', 2); GFX.star(c, x, y, r * 0.6, '#FFD447', 0); }
          else { c.fillStyle = '#E85C8F'; c.beginPath(); c.arc(x, y, Math.max(2.2, cs * 0.11), 0, 6.283); c.fill(); }
        }
        if (g.gem) GFX.gem(c, px(g.gem.c), py(g.gem.r) + Math.sin(g.t * 4) * 2, cs * 0.38, '#7FE0F2');
        for (const ch of CH) {
          if (ch.state === 'poof') continue;
          const scared = ch.scared > 0 && !(ch.scared < 1.5 && Math.floor(g.t * 8) % 2);
          GFX.gloomy(c, px(ch.x), py(ch.y), cs * 0.44, { color: ch.col, scared, lookX: ch.dx, lookY: ch.dy });
        }
        const bob = Math.abs(Math.sin(g.t * 12)) * (P.dx || P.dy ? cs * 0.08 : 0);
        api.pet(c, px(P.x), py(P.y) + cs * 0.5 - bob, cs * 1.05, { flip: P.face < 0, face: g.caught > 0 ? 'hurt' : g.won ? 'happy' : 'normal', rot: g.caught > 0 ? g.t * 10 : 0 });
      },
    };
  },
};
