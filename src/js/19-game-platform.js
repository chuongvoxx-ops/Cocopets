/* ---------- Hop Quest: run, jump and stomp across four hand-built levels ---------- */
const HT = 32, HROWS = 14;
const HOP = { run: 175, accG: 1350, accA: 950, decG: 1600, decA: 520, jump: 530, gUp: 1000, gDown: 1800, maxFall: 760, coyote: 0.1, buffer: 0.13, stomp: 420, stompHi: 590, spring: 790, w: 20, h: 26 };
const hopSolid = ch => ch === '#' || ch === '=' || ch === 'B' || ch === 'H' || ch === 'b' || ch === 'S';
const hopFloor = ch => hopSolid(ch) || ch === '-';
/* levels are built from a few simple instructions. Columns count from the left, rows from the top (14 rows, ground on rows 12 and 13).
   put: "<thing> <column or a-b> [row]"; without a row, things sit on the ground.
   # ground  = brick (breaks)  B star box  H heart box  - cloud ledge  ^ spikes  S spring  C berry  G star gem  K checkpoint  E exit
   foes: w walker  h hopper  s spiky (no stomping)  f flyer.  movers: [M sideways | V up-down, column, row, range in tiles, speed] */
const HOP_LEVELS = [
  { name: 'Meadow Run', theme: 'meadow', len: 120,
    hills: [[18, 21, 2], [48, 52, 3], [76, 77, 1], [78, 79, 2], [80, 81, 3], [85, 88, 3]],
    gaps: [[25, 27], [56, 57], [82, 84]],
    put: ['@ 2', 'C 5-7 11', '= 8 8', 'B 9 8', '= 10 8', 'C 18-21 8', 'C 25 9', 'C 26 8', 'C 27 9',
      '- 40-44 9', 'C 40-41 8', 'G 42 6', 'C 43-44 8', 'C 49-51 7', 'K 60', '= 64 8', 'B 65 8', '= 66 8', 'H 67 8', '= 68 8',
      'C 76 9', 'C 78 8', 'C 80 7', 'G 83 5', 'C 86-87 7', 'S 94', '- 96-101 4', 'C 96-97 3', 'G 98 3', 'C 99-101 3',
      'C 108-110 11', 'E 114',
      'w 14', 'w 32', 'w 36', 'w 66', 'h 72', 'w 104'] },
  { name: 'Berry Bluffs', theme: 'bluffs', len: 140,
    hills: [[18, 22, 2], [61, 66, 3], [84, 84, 3], [104, 110, 2]],
    gaps: [[26, 31], [58, 60], [96, 101]],
    movers: [['M', 26, 10, 3, 55], ['M', 97, 10, 1, 40]],
    put: ['@ 2', 'C 4-6 11', '= 8 8', 'B 9 8', '= 10 8', 'B 9 4', '^ 20 9', 'C 18-19 8', 'C 21-22 8',
      'C 27-30 8', '^ 44', '- 47-50 9', '- 52-55 6', 'C 47-50 8', 'G 54 5',
      'C 62-65 7', 'K 70', '^ 74-76', '- 73-77 9', 'C 73-77 8', 'G 84 4', 'C 97-100 8',
      '^ 107 9', 'C 105-106 8', 'C 108-109 8', 'S 113', '- 115-120 4', 'G 117 3', 'C 115-116 3', 'C 118-120 3',
      'E 132',
      'h 15', 'w 36', 'w 39', 'h 64', 'h 88', 'w 92', 'w 122', 'w 125'] },
  { name: 'Crystal Caves', theme: 'caves', len: 150,
    ceil: [[0, 149, 2], [16, 26, 5], [78, 92, 8]],
    hills: [[60, 61, 2], [62, 64, 4], [116, 124, 6]],
    gaps: [[28, 30], [66, 70]],
    movers: [['M', 66, 9, 2, 50], ['V', 113, 11, -5, 45]],
    put: ['@ 2', 'C 4-7 11', 'B 19 8', '= 20 8', 'B 21 8', 'C 28-30 9', '# 44-48 9', 'G 46 5', 'C 44-48 8',
      'K 74', '^ 81', '^ 86', 'C 79-80 11', 'C 84-85 11', 'C 88-90 11', '^ 95-99', '- 96-98 9', 'G 97 8',
      'C 113-115 5', 'C 117-120 5', 'G 121 2', 'C 122-123 5', 'E 142',
      'f 12 8', 's 35', 's 41', 'f 52 7', 'f 58 9', 'w 83', 'w 89', 'f 104 8', 's 108', 'f 110 7', 'w 130', 'w 134'] },
  { name: 'Sky Castle', theme: 'castle', len: 160,
    hills: [[30, 34, 3], [62, 64, 2], [69, 73, 2], [108, 112, 3]],
    gaps: [[10, 13], [22, 28], [36, 39], [50, 58], [66, 68], [80, 90], [100, 104], [118, 124], [136, 139]],
    movers: [['M', 22, 10, 4, 60], ['M', 50, 9, 2, 50], ['V', 55, 10, -3, 40], ['M', 83, 10, 4, 55], ['M', 118, 9, 2, 55]],
    put: ['@ 2', 'C 4-7 11', '- 11-12 9', 'C 11-12 8', 'C 23-27 8', '^ 32 8', 'S 35', '- 37-40 4', 'G 38 3', 'C 37 3', 'C 39-40 3',
      'K 60', 'C 69-73 8', 'S 79', '- 82-86 5', 'G 84 2', 'C 82-83 4', 'C 85-86 4', '- 101-103 10', 'C 101-103 9',
      'B 110 4', 'H 111 4', '- 123-124 9', 'K 128', 'S 132', '- 134-138 4', 'G 136 3', 'C 134-135 3', 'C 137-138 3', 'E 152',
      'w 16', 'h 19', 'f 25 6', 's 43', 'w 46', 'f 67 7', 'h 76', 'w 78', 'f 94 7', 's 96', 'w 114', 'f 142 8', 's 144', 'f 146 6'] },
];
function hopBuild(spec) {
  const L = spec.len, grid = Array.from({ length: HROWS }, () => Array(L).fill(' '));
  const gr = spec.ground || 2;
  for (let x = 0; x < L; x++) for (let y = HROWS - gr; y < HROWS; y++) grid[y][x] = '#';
  (spec.hills || []).forEach(([a, b, h]) => { for (let x = a; x <= b; x++) for (let y = HROWS - gr - h; y < HROWS; y++) grid[y][x] = '#'; });
  (spec.gaps || []).forEach(([a, b]) => { for (let x = a; x <= b; x++) for (let y = 0; y < HROWS; y++) grid[y][x] = ' '; });
  (spec.ceil || []).forEach(([a, b, h]) => { for (let x = a; x <= b; x++) for (let y = 0; y < h; y++) grid[y][x] = '#'; });
  for (let y = 0; y < HROWS; y++) grid[y][L - 1] = '#';
  const stand = x => { for (let y = HROWS - 1; y > 0; y--) if (hopFloor(grid[y][x]) && !hopFloor(grid[y - 1][x])) return y - 1; return HROWS - 3; };
  const E = { start: null, berries: [], gems: [], checks: [], exit: null, foes: [], movers: [] };
  (spec.put || []).forEach(str => {
    const parts = str.split(' '), ch = parts[0];
    const ab = parts[1].split('-').map(Number), a = ab[0], b = ab.length > 1 ? ab[1] : ab[0];
    for (let x = a; x <= b; x++) {
      const y = parts.length > 2 ? +parts[2] : stand(x);
      switch (ch) {
        case '@': E.start = [x, y]; break;
        case 'C': E.berries.push({ x: (x + 0.5) * HT, y: (y + 0.5) * HT, got: false }); break;
        case 'G': E.gems.push({ x: (x + 0.5) * HT, y: (y + 0.5) * HT, got: false }); break;
        case 'K': E.checks.push({ tx: x, ty: y, on: false }); break;
        case 'E': E.exit = { tx: x, ty: y }; break;
        case 'w': case 'h': case 's': case 'f': E.foes.push({ type: ch, tx: x, ty: y }); break;
        default: grid[y][x] = ch;
      }
    }
  });
  (spec.movers || []).forEach(([type, x, y, range, speed]) => E.movers.push({ type, x0: x * HT, y0: y * HT, w: 3 * HT, h: 12, range: range * HT, speed, x: x * HT, y: y * HT, py: y * HT, dx: 0, dy: 0 }));
  return { grid, E, len: L };
}
/* movers glide back and forth with eased ends */
function hopMovers(ms, t) {
  for (const m of ms) {
    const om = Math.PI * m.speed / Math.max(1, Math.abs(m.range));
    const u = (1 - Math.cos(t * om)) / 2;
    const nx = m.type === 'M' ? m.x0 + u * m.range : m.x0, ny = m.type === 'V' ? m.y0 + u * m.range : m.y0;
    m.dx = nx - m.x; m.dy = ny - m.y; m.py = m.y;
    m.x = nx; m.y = ny;
  }
}
function hopCollideX(o, W) {
  const y0 = Math.floor(o.y / HT), y1 = Math.floor((o.y + o.h - 0.01) / HT);
  if (o.vx > 0) {
    const tx = Math.floor((o.x + o.w) / HT);
    for (let ty = y0; ty <= y1; ty++) if (hopSolid(W.tile(tx, ty))) { o.x = tx * HT - o.w; o.vx = 0; return 1; }
  } else if (o.vx < 0) {
    const tx = Math.floor(o.x / HT);
    for (let ty = y0; ty <= y1; ty++) if (hopSolid(W.tile(tx, ty))) { o.x = (tx + 1) * HT; o.vx = 0; return -1; }
  }
  return 0;
}
/* lands on floors (and cloud ledges from above); returns the tile hit by the head when rising */
function hopCollideY(o, W, prevBottom) {
  const x0 = Math.floor(o.x / HT), x1 = Math.floor((o.x + o.w - 0.01) / HT);
  if (o.vy > 0) {
    const ty = Math.floor((o.y + o.h) / HT);
    for (let tx = x0; tx <= x1; tx++) {
      const ch = W.tile(tx, ty);
      if (hopSolid(ch) || (ch === '-' && prevBottom <= ty * HT + 0.5)) { o.y = ty * HT - o.h; o.vy = 0; o.onGround = true; o.on = null; o.gch = ch; o.gtx = tx; o.gty = ty; return null; }
    }
  } else if (o.vy < 0) {
    const ty = Math.floor(o.y / HT);
    let best = null;
    for (let tx = x0; tx <= x1; tx++) { const ch = W.tile(tx, ty); if (hopSolid(ch)) { const d = Math.abs((tx + 0.5) * HT - (o.x + o.w / 2)); if (!best || d < best.d) best = { tx, ty, ch, d }; } }
    if (best) { o.y = (ty + 1) * HT; o.vy = 0; return best; }
  }
  return null;
}
/* one physics step for the player; inp = {left, right, jump} */
function hopStep(p, inp, dt, W) {
  const res = { jumped: false, landed: false, bump: null, spring: null };
  if (p.on) { const m = p.on; if (p.x + p.w > m.x && p.x < m.x + m.w) { p.x += m.dx; p.y = m.y - p.h; p.onGround = true; } else p.on = null; }
  if (p.lock > 0) p.lock -= dt;
  const dir = p.lock > 0 ? 0 : (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  if (dir) { p.vx += dir * (p.onGround ? HOP.accG : HOP.accA) * dt * (p.vx * dir < 0 ? 1.7 : 1); p.face = dir; }
  else { const k = (p.onGround ? HOP.decG : HOP.decA) * dt; p.vx = Math.abs(p.vx) <= k ? 0 : p.vx - Math.sign(p.vx) * k; }
  if (p.lock <= 0) p.vx = Math.max(-HOP.run, Math.min(HOP.run, p.vx));
  p.coyote = p.onGround ? HOP.coyote : p.coyote - dt;
  p.buf -= dt;
  if (p.buf > 0 && p.coyote > 0) { p.vy = -HOP.jump; p.buf = 0; p.coyote = 0; p.onGround = false; p.on = null; res.jumped = true; }
  const g = p.vy < 0 && (inp.jump || p.boost) ? HOP.gUp : HOP.gDown;
  p.vy = Math.min(HOP.maxFall, p.vy + g * dt);
  if (p.vy >= 0) p.boost = false;
  p.x += p.vx * dt;
  if (p.x < 0) { p.x = 0; p.vx = 0; }
  hopCollideX(p, W);
  const prevBottom = p.y + p.h, was = p.onGround;
  p.prevBottom = prevBottom;
  p.y += p.vy * dt;
  p.onGround = false;
  const hit = hopCollideY(p, W, prevBottom);
  if (hit) res.bump = hit;
  if (!p.onGround && p.vy >= 0) {
    for (const m of W.movers) {
      if (p.x + p.w > m.x && p.x < m.x + m.w && prevBottom <= m.py + 1 + Math.abs(m.dy) && p.y + p.h >= m.y) { p.y = m.y - p.h; p.vy = 0; p.onGround = true; p.on = m; p.gch = '-'; break; }
    }
  }
  if (p.onGround && p.gch === 'S' && !p.on) { p.vy = -HOP.spring; p.boost = true; p.onGround = false; p.coyote = 0; res.spring = [p.gtx, p.gty]; }
  res.landed = !was && p.onGround;
  return res;
}
const HOP_THEMES = {
  meadow: { sky: ['#7CC8F2', '#DDF4FF'], far: '#B9E6A6', near: '#8FD07D', dirt: '#C98B4E', dirt2: '#B07A3A', top: '#5FB85A', top2: '#9BE07F', brick: '#E38B4F', cloud: '#FFFFFF', plank: '#C98B4E', deco: 'flowers' },
  bluffs: { sky: ['#FFAE7D', '#FFE8C2'], far: '#F2BE8E', near: '#E59D69', dirt: '#D9824A', dirt2: '#B9673A', top: '#D94F84', top2: '#FF8FB1', brick: '#C9644B', cloud: '#FFF4E4', plank: '#B97A45', deco: 'berries' },
  caves: { sky: ['#150F2B', '#2E2352'], far: '#241B45', near: '#30245A', dirt: '#5A4E7A', dirt2: '#463C63', top: '#5FD3E8', top2: '#C2F5FF', brick: '#7A6BA8', cloud: '#B8A3F2', plank: '#8E7BC4', dark: true, deco: 'crystals' },
  castle: { sky: ['#5B8DEF', '#CFE8FF'], far: '#E8F1FF', near: '#FFFFFF', dirt: '#C8C1DA', dirt2: '#A69EBB', top: '#F7F4FD', top2: '#FFFFFF', brick: '#B5ADCB', cloud: '#FFFFFF', plank: '#F2D38A', stone: true, deco: 'banners' },
};
const hopHash = k => { let x = Math.imul(k ^ 0x9E3779B9, 0x85EBCA6B); x ^= x >>> 13; x = Math.imul(x, 0xC2B2AE35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };

GAMES.platform = {
  create(api) {
    const spec = HOP_LEVELS[api.def.level] || HOP_LEVELS[0];
    const lv = hopBuild(spec), grid = lv.grid, E = lv.E, TH = HOP_THEMES[spec.theme] || HOP_THEMES.meadow;
    const LW = lv.len * HT, LH = HROWS * HT;
    const tile = (tx, ty) => tx < 0 || tx >= lv.len ? '#' : ty < 0 || ty >= HROWS ? ' ' : grid[ty][tx];
    const W = { tile, movers: E.movers };
    const sp = E.start || [2, HROWS - 3];
    const p = { x: sp[0] * HT + (HT - HOP.w) / 2, y: (sp[1] + 1) * HT - HOP.h, w: HOP.w, h: HOP.h, vx: 0, vy: 0, onGround: false, coyote: 0, buf: 0, face: 1, inv: 0, lock: 0, on: null, boost: false, sq: 0, prevBottom: 0, combo: 0 };
    const g = { t: 0, mt: 0, sc: 1, viewW: 352, viewH: 600, camX: 0, camY: 0, look: 0, hearts: 3, score: 0, berries: 0, gems: 0, cp: { x: p.x, y: p.y }, state: 'play', endT: 0, intro: 2.2, touch: false, bumps: new Map(), springs: new Map(), parts: [], deadT: 0, hudKey: '' };
    const foes = E.foes.map(f => ({ type: f.type, x: f.tx * HT + 4, y: (f.ty + 1) * HT - 22, w: 24, h: 22, vx: 0, vy: 0, dir: -1, sp: f.type === 's' ? 52 : f.type === 'h' ? 34 : 44, onGround: false, dead: 0, act: false, t: hopHash(f.tx) * 6, hx: f.tx * HT + 4, hy: f.ty * HT + 5, hopT: 0.8 + hopHash(f.tx + 7) }));
    const totalGems = E.gems.length;
    const exitX = E.exit ? E.exit.tx * HT : LW;

    function layout() {
      // at least 9 tiles across and 11 rows tall; tall phone screens keep the ground low, short screens scroll
      g.sc = Math.min(api.W / (9 * HT), api.H / (11 * HT));
      g.viewW = api.W / g.sc; g.viewH = api.H / g.sc;
      cam(1, true);
    }
    function cam(dt, snap) {
      g.look += ((p.face || 1) * g.viewW * 0.09 - g.look) * Math.min(1, dt * 2.5);
      const tx = clamp(p.x + p.w / 2 - g.viewW * 0.42 + g.look, 0, Math.max(0, LW - g.viewW));
      g.camX = snap ? tx : g.camX + (tx - g.camX) * Math.min(1, dt * 7);
      if (g.viewH >= LH) g.camY = clamp((HROWS - 2) * HT - 0.8 * g.viewH, LH - g.viewH, 0);
      else { const ty = clamp(p.y + p.h / 2 - g.viewH * 0.55, 0, LH - g.viewH); g.camY = snap ? ty : g.camY + (ty - g.camY) * Math.min(1, dt * 6); }
    }
    layout();
    const toS = (x, y) => [(x - g.camX) * g.sc, (y - g.camY) * g.sc];
    function hud() {
      const goal = `${'★'.repeat(g.gems)}${'☆'.repeat(Math.max(0, totalGems - g.gems))} · ${g.berries} berries`;
      const prog = Math.round(clamp(p.x / exitX, 0, 1) * 200) / 200;
      const key = goal + '|' + prog + '|' + g.score + '|' + g.hearts;
      if (key === g.hudKey) return;
      g.hudKey = key;
      api.hud({ score: g.score, hearts: g.hearts, max: 3, goal, prog });
    }
    hud();
    function pop(x, y, text, color, size) { const [sx, sy] = toS(x, y); api.pop(sx, sy, text, color, size); }
    function burst(x, y, color, n, s) { const [sx, sy] = toS(x, y); api.burst(sx, sy, color, n, s); }
    function hurt(fromX) {
      if (p.inv > 0 || g.state !== 'play') return;
      g.hearts--; hud(); api.miss();
      api.shake(6, 0.25); api.sfx.wrong();
      p.inv = 1.6; p.vx = (p.x + p.w / 2 < fromX ? -1 : 1) * 190; p.vy = -330; p.lock = 0.28; p.onGround = false; p.on = null;
      if (g.hearts <= 0) lose('Out of hearts!');
    }
    function lose(msg) {
      if (g.state !== 'play') return;
      g.state = 'lost';
      setTimeout(() => api.lose(msg, g.score), 800);
    }
    function fell() {
      if (g.state !== 'play' || g.deadT > 0) return;
      g.hearts--; hud(); api.sfx.wrong(); api.miss();
      if (g.hearts <= 0) { lose('Fell off the edge!'); return; }
      g.deadT = 0.75;
    }
    function respawn() {
      p.x = g.cp.x; p.y = g.cp.y; p.vx = p.vy = 0; p.inv = 1.6; p.on = null; p.onGround = false; p.boost = false;
      cam(1, true);
    }
    function kill(f, bonk) {
      f.dead = 0.001; f.bonk = !!bonk; f.vy = bonk ? -300 : 0;
      const [kx, ky] = toS(f.x + f.w / 2, f.y - 4), kp = api.hit(kx, ky, 100 * Math.max(1, p.combo), true); g.score += kp; hud(); api.hitstop(0.06);
      pop(f.x + f.w / 2, f.y - 4, '+' + kp, '#FFE37A', 15);
      burst(f.x + f.w / 2, f.y + f.h / 2, '#C9C2F2', 8, 120);
      api.sfx.stomp();
    }
    function bump(b) {
      const { tx, ty, ch } = b;
      g.bumps.set(tx + ',' + ty, 0.22);
      if (ch === 'B' || ch === 'H') {
        grid[ty][tx] = 'b';
        if (ch === 'H' && g.hearts < 3) { g.hearts++; pop((tx + 0.5) * HT, ty * HT - 6, '+1 heart', '#FF8FB1', 15); api.sfx.yum(); }
        else { g.berries += 3; const [bx, by] = toS((tx + 0.5) * HT, ty * HT); g.score += api.hit(bx, by, 30, true); pop((tx + 0.5) * HT, ty * HT - 6, '+3 berries', '#FFE37A', 15); api.sfx.coin(); }
        for (let i = 0; i < 3; i++) g.parts.push({ k: 'berry', x: (tx + 0.5) * HT + (i - 1) * 6, y: ty * HT, vx: (i - 1) * 50, vy: -260 - i * 30, life: 0.6 });
        hud();
      } else if (ch === '=') {
        grid[ty][tx] = ' ';
        g.score += 10; hud(); api.sfx.crack();
        for (let i = 0; i < 4; i++) g.parts.push({ k: 'chunk', x: (tx + 0.5) * HT, y: (ty + 0.5) * HT, vx: (i % 2 ? 1 : -1) * (60 + i * 25), vy: -280 - (i < 2 ? 80 : 0), life: 1.1, r: hopHash(tx * 9 + i) * 6 });
      } else api.sfx.thud();
      for (const f of foes) if (!f.dead && f.act && f.onGround && Math.abs(f.y + f.h - ty * HT) < 3 && f.x + f.w > tx * HT && f.x < (tx + 1) * HT) kill(f, true);
    }
    function foeStep(f, h) {
      if (f.dead) {
        f.dead += h;
        if (f.bonk) { f.vy += 1500 * h; f.y += f.vy * h; }
        return;
      }
      f.t += h;
      if (f.type === 'f') { f.x = f.hx + Math.sin(f.t * 0.9) * 40; f.y = f.hy + Math.sin(f.t * 2.4) * 16; f.dir = Math.cos(f.t * 0.9) >= 0 ? 1 : -1; return; }
      if (f.type === 'h' && f.onGround) { f.hopT -= h; if (f.hopT <= 0) { f.vy = -400; f.hopT = 1.2 + hopHash(Math.floor(f.t * 10)) * 0.7; f.onGround = false; } }
      f.vy = Math.min(HOP.maxFall, f.vy + 1500 * h);
      f.vx = f.dir * f.sp;
      f.x += f.vx * h;
      if (hopCollideX(f, W)) f.dir *= -1;
      const pb = f.y + f.h;
      f.y += f.vy * h; f.onGround = false;
      hopCollideY(f, W, pb);
      if (f.onGround) {
        const fx = f.dir > 0 ? f.x + f.w + 2 : f.x - 2;
        if (!hopFloor(tile(Math.floor(fx / HT), Math.floor((f.y + f.h + 2) / HT)))) f.dir *= -1;
      }
      if (f.y > LH + 80) f.dead = 99;
    }
    function step(h) {
      g.mt += h;
      hopMovers(E.movers, g.mt);
      for (const f of foes) {
        if (!f.act && Math.abs(f.x - (g.camX + g.viewW / 2)) < g.viewW * 0.5 + 96) f.act = true;
        if (f.act) foeStep(f, h);
      }
      if (g.deadT > 0) { g.deadT -= h; if (g.deadT <= 0 && g.state === 'play') respawn(); return; }
      if (g.state === 'lost') return;
      const inp = g.state === 'goal' ? { left: false, right: false, jump: false } : { left: !!api.keys.left, right: !!api.keys.right, jump: !!(api.keys.jump || g.touch) };
      if (g.state === 'goal' && p.onGround && g.endT > 0.2) { p.buf = 1; inp.jump = true; }
      const r = hopStep(p, inp, h, W);
      if (r.jumped) { p.sq = -0.22; if (g.state === 'play') api.sfx.jump(); }
      if (r.landed) { p.sq = 0.2; p.combo = 0; }
      if (r.bump) bump(r.bump);
      if (r.spring) { g.springs.set(r.spring[0] + ',' + r.spring[1], 0.3); api.sfx.bounce(0.7); p.sq = -0.3; }
      p.inv = Math.max(0, p.inv - h);
      if (g.state !== 'play') return;
      // spikes
      const tx0 = Math.floor(p.x / HT), tx1 = Math.floor((p.x + p.w) / HT), ty0 = Math.floor(p.y / HT), ty1 = Math.floor((p.y + p.h) / HT);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (tile(tx, ty) === '^') {
        const sx = tx * HT + 4, sy = ty * HT + 15;
        if (p.x + p.w > sx && p.x < sx + 24 && p.y + p.h > sy && p.y < (ty + 1) * HT) hurt(tx * HT + 16);
      }
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      for (const b of E.berries) if (!b.got && Math.abs(b.x - cx) < 17 && Math.abs(b.y - cy) < 20) { b.got = true; g.berries++; const [bx, by] = toS(b.x, b.y); g.score += api.hit(bx, by - 10, 10); api.sfx.coin(); hud(); }
      for (const m of E.gems) if (!m.got && Math.abs(m.x - cx) < 22 && Math.abs(m.y - cy) < 24) {
        m.got = true; g.gems++; { const [gx, gy] = toS(m.x, m.y); g.score += api.hit(gx, gy - 10, 500); } hud();
        api.sfx.sparkle(); pop(m.x, m.y - 14, `Star gem ${g.gems}/${totalGems}!`, '#FFE37A', 17); burst(m.x, m.y, '#FFE37A', 16, 170);
      }
      for (const k of E.checks) if (!k.on && cx > k.tx * HT && cx < (k.tx + 1) * HT && p.y + p.h > k.ty * HT - HT) {
        k.on = true; g.cp = { x: k.tx * HT + 6, y: (k.ty + 1) * HT - p.h }; api.sfx.chirp(); pop((k.tx + 0.5) * HT, k.ty * HT - 30, 'Checkpoint!', '#FFFFFF', 14);
      }
      for (const f of foes) {
        if (f.dead || !f.act) continue;
        if (p.x + p.w > f.x + 2 && p.x < f.x + f.w - 2 && p.y + p.h > f.y + 3 && p.y < f.y + f.h - 2) {
          const above = p.prevBottom <= f.y + 8 && p.vy >= 0;
          if (above && f.type !== 's') { p.combo++; kill(f, false); p.vy = -(api.keys.jump || g.touch ? HOP.stompHi : HOP.stomp); p.boost = !!(api.keys.jump || g.touch); p.onGround = false; }
          else if (above && f.type === 's') { hurt(f.x + f.w / 2); }
          else hurt(f.x + f.w / 2);
        }
      }
      if (E.exit && p.x + p.w > E.exit.tx * HT + 6 && p.x < (E.exit.tx + 1) * HT - 6 && p.y + p.h > E.exit.ty * HT - HT) {
        g.state = 'goal'; g.endT = 0; p.vx = 0;
        api.sfx.clear();
        const bonus = 1000 + g.hearts * 300;
        g.score += bonus; hud();
        pop(cx, p.y - 20, 'Goal! +' + bonus, '#FFE37A', 18);
        for (let i = 0; i < 4; i++) setTimeout(() => burst((E.exit.tx + 0.5) * HT + (i - 1.5) * 26, E.exit.ty * HT - 40, ['#FFE37A', '#FF8FB1', '#8FD9F7', '#B8F2C4'][i], 14, 190), i * 180);
        setTimeout(() => api.win(Math.max(1, g.gems), g.score), 1500);
      }
      if (p.y > Math.max(LH + 60, g.camY + g.viewH + 30)) fell();
    }
    function update(dt) {
      g.t += dt;
      if (g.intro > 0) g.intro -= dt;
      if (g.state === 'goal') g.endT += dt;
      let acc = dt;
      while (acc > 1e-6) { const h = Math.min(1 / 120, acc); step(h); acc -= h; }
      p.sq *= Math.exp(-dt * 11);
      g.bumps.forEach((v, k) => { v -= dt; if (v <= 0) g.bumps.delete(k); else g.bumps.set(k, v); });
      g.springs.forEach((v, k) => { v -= dt; if (v <= 0) g.springs.delete(k); else g.springs.set(k, v); });
      g.parts = g.parts.filter(q => (q.life -= dt) > 0);
      for (const q of g.parts) { q.vy += 1300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
      if (g.deadT <= 0) cam(dt, false);
      hud();
    }

    /* ---------- drawing ---------- */
    function drawBack(c) {
      const Wp = api.W, Hp = api.H, sc = g.sc;
      const sky = c.createLinearGradient(0, 0, 0, Hp); sky.addColorStop(0, TH.sky[0]); sky.addColorStop(1, TH.sky[1]);
      c.fillStyle = sky; c.fillRect(0, 0, Wp, Hp);
      const gy = (LH - 2 * HT - g.camY) * sc;
      if (TH.dark) {
        // cave: glowing crystal clusters and drifting motes
        for (let layer = 0; layer < 2; layer++) {
          const sp = layer ? 0.5 : 0.25, step = layer ? 170 : 230, base = Math.floor(g.camX * sc * sp / step);
          c.fillStyle = layer ? TH.near : TH.far;
          for (let i = -1; i < Wp / step + 2; i++) {
            const k = base + i, x = k * step - g.camX * sc * sp, r = hopHash(k * 3 + layer);
            const hgt = (60 + r * 120) * (layer ? 1 : 1.3);
            c.beginPath(); c.moveTo(x, gy + 40); c.lineTo(x + step * 0.3, gy - hgt); c.lineTo(x + step * 0.55, gy - hgt * 0.55); c.lineTo(x + step * 0.8, gy - hgt * 0.8); c.lineTo(x + step, gy + 40); c.fill();
            if (layer && r > 0.45) { c.fillStyle = 'rgba(127,224,242,.35)'; c.beginPath(); c.moveTo(x + step * 0.42, gy); c.lineTo(x + step * 0.5, gy - 46 - r * 30); c.lineTo(x + step * 0.58, gy); c.fill(); c.fillStyle = TH.near; }
          }
        }
        for (let i = 0; i < 26; i++) { const r = hopHash(i * 13 + 5), x = ((r * 1000 - g.camX * sc * 0.4) % Wp + Wp) % Wp, y = Hp * (0.1 + hopHash(i * 7) * 0.7) + Math.sin(g.t * 0.8 + i) * 6; c.fillStyle = `rgba(194,245,255,${0.25 + 0.35 * Math.abs(Math.sin(g.t * 1.3 + i))})`; c.beginPath(); c.arc(x, y, 1.6 + r * 1.8, 0, 6.283); c.fill(); }
        return;
      }
      if (spec.theme === 'meadow' || spec.theme === 'bluffs') {
        const sx = Wp * 0.8, sy = Math.max(40, gy - 300 * sc);
        const glow = c.createRadialGradient(sx, sy, 20, sx, sy, 150); glow.addColorStop(0, 'rgba(255,248,210,.75)'); glow.addColorStop(1, 'rgba(255,248,210,0)');
        c.fillStyle = glow; c.fillRect(sx - 150, sy - 150, 300, 300);
        c.fillStyle = spec.theme === 'meadow' ? 'rgba(255,253,230,.95)' : 'rgba(255,246,214,.98)';
        c.beginPath(); c.arc(sx, sy, 30, 0, 6.283); c.fill();
      }
      // haze where the land meets the sky: far things fade toward the sky colour
      { const hz = c.createLinearGradient(0, gy - 220 * sc, 0, gy + 40); hz.addColorStop(0, 'rgba(255,255,255,0)'); hz.addColorStop(1, TH.dark ? 'rgba(90,70,140,.25)' : 'rgba(255,255,255,.35)'); c.fillStyle = hz; c.fillRect(0, gy - 220 * sc, Wp, 220 * sc + 40); }
      // clouds
      for (let i = -1; i < Wp / 260 + 2; i++) {
        const base = Math.floor(g.camX * sc * 0.12 / 260), k = base + i, x = k * 260 - g.camX * sc * 0.12 + hopHash(k) * 80, y = gy - (260 + hopHash(k * 5) * 150) * sc;
        c.fillStyle = 'rgba(255,255,255,.85)';
        c.beginPath(); c.ellipse(x, y, 46, 16, 0, 0, 6.283); c.ellipse(x - 22, y + 4, 26, 12, 0, 0, 6.283); c.ellipse(x + 20, y - 8, 28, 16, 0, 0, 6.283); c.fill();
      }
      for (let layer = 0; layer < 2; layer++) {
        const sp = layer ? 0.5 : 0.25, step = layer ? 200 : 280, base = Math.floor(g.camX * sc * sp / step);
        const hc = layer ? TH.near : TH.far, hg = c.createLinearGradient(0, gy - 200 * sc, 0, gy + 30); hg.addColorStop(0, shadeC(hc, 0.16)); hg.addColorStop(0.55, hc); hg.addColorStop(1, shadeC(hc, -0.1));
        c.fillStyle = hg;
        for (let i = -1; i < Wp / step + 2; i++) {
          const k = base + i, x = k * step - g.camX * sc * sp, r = hopHash(k * 3 + layer * 11);
          if (spec.theme === 'bluffs') { const hgt = (layer ? 70 : 120) + r * 60; c.beginPath(); c.moveTo(x, gy + 30); c.lineTo(x + step * 0.15, gy - hgt); c.lineTo(x + step * 0.7, gy - hgt - 6); c.lineTo(x + step * 0.85, gy + 30); c.fill(); }
          else if (spec.theme === 'castle') {
            if (layer === 0) {
              const tx = x + step * 0.4, th = 90 + r * 70;
              c.fillRect(tx, gy - th, 34, th + 40);
              for (let b = 0; b < 3; b++) c.fillRect(tx - 4 + b * 15, gy - th - 9, 10, 10);
              c.fillStyle = '#C9D8F5'; c.fillRect(tx + 13, gy - th + 22, 8, 12);
              if (r > 0.5) { c.fillStyle = '#B9C8F0'; c.beginPath(); c.moveTo(tx - 5, gy - th - 9); c.lineTo(tx + 17, gy - th - 44); c.lineTo(tx + 39, gy - th - 9); c.fill(); }
              c.fillStyle = TH.far;
            }
            c.beginPath(); c.ellipse(x + step / 2, gy + 40, step * 0.62, 50 + r * 20, 0, 0, 6.283); c.fill();
          } else { c.beginPath(); c.ellipse(x + step / 2, gy + 30, step * 0.7, (layer ? 70 : 110) + r * 40, 0, Math.PI, 0); c.fill(); }
        }
      }
    }
    function outlineEdges(c, x, y, tx, ty) {
      c.strokeStyle = GFX.line; c.lineWidth = 2.4; c.beginPath();
      if (tile(tx - 1, ty) !== '#' && tx > 0) { c.moveTo(x + 1.2, y); c.lineTo(x + 1.2, y + HT); }
      if (tile(tx + 1, ty) !== '#' && tx < lv.len - 1) { c.moveTo(x + HT - 1.2, y); c.lineTo(x + HT - 1.2, y + HT); }
      if (ty < HROWS - 1 && tile(tx, ty + 1) !== '#') { c.moveTo(x, y + HT - 1.2); c.lineTo(x + HT, y + HT - 1.2); }
      c.stroke();
    }
    function drawGround(c, tx, ty) {
      const x = tx * HT, y = ty * HT, T = HT;
      const buried = tile(tx, ty - 1) === '#' && tile(tx, ty - 2) === '#';
      c.fillStyle = buried ? shadeC(TH.dirt, -0.1) : TH.dirt; c.fillRect(x - 0.4, y - 0.4, T + 0.8, T + 0.8);
      if (tile(tx, ty + 1) !== '#' && ty < HROWS - 1) { c.fillStyle = 'rgba(43,36,51,.18)'; c.fillRect(x - 0.4, y + T - 7, T + 0.8, 7); }
      if (tile(tx - 1, ty) !== '#' && tile(tx - 1, ty) !== undefined) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x, y, 3, T); }
      if (tile(tx + 1, ty) !== '#' && tile(tx + 1, ty) !== undefined) { c.fillStyle = 'rgba(43,36,51,.14)'; c.fillRect(x + T - 3, y, 3, T); }
      const r = hopHash(tx * 131 + ty * 17);
      if (TH.stone) {
        c.strokeStyle = TH.dirt2; c.lineWidth = 1.6; c.beginPath();
        c.moveTo(x, y + 16); c.lineTo(x + T, y + 16);
        const o = (ty % 2) * 16; c.moveTo(x + (8 + o) % 32, y); c.lineTo(x + (8 + o) % 32, y + 16); c.moveTo(x + (24 + o) % 32, y + 16); c.lineTo(x + (24 + o) % 32, y + 32);
        c.stroke();
      } else {
        c.fillStyle = TH.dirt2; c.beginPath(); c.arc(x + 7 + r * 16, y + 11 + r * 6, 2.4, 0, 6.283); c.arc(x + 24 - r * 8, y + 25, 1.9, 0, 6.283); c.fill();
      }
      const open = tile(tx, ty - 1) !== '#' && ty > 0;
      if (open) {
        c.fillStyle = 'rgba(43,36,51,.16)'; c.fillRect(x - 0.4, y + 10, T + 0.8, 5);
        c.fillStyle = TH.top; c.beginPath(); c.moveTo(x - 0.4, y); c.lineTo(x + T + 0.4, y); c.lineTo(x + T + 0.4, y + 8);
        for (let i = 3; i >= 0; i--) c.quadraticCurveTo(x + i * 8 + 4, y + 14, x + i * 8, y + 8);
        c.closePath(); c.fill();
        c.fillStyle = TH.top2; c.globalAlpha = 0.55; c.fillRect(x - 0.4, y, T + 0.8, 2.5); c.globalAlpha = 1;
        c.fillStyle = TH.top2; c.fillRect(x, y + 2.5, T, 2.2);
        c.strokeStyle = GFX.line; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - 0.4, y + 1.2); c.lineTo(x + T + 0.4, y + 1.2); c.stroke();
        const above = tile(tx, ty - 1);
        if (above === ' ' && r > 0.62) {
          if (TH.deco === 'flowers') { c.strokeStyle = '#3E8E50'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x + 10 + r * 12, y); c.lineTo(x + 10 + r * 12, y - 7); c.stroke(); GFX.blob(c, x + 10 + r * 12, y - 9, 3.2, r > 0.8 ? '#FF8FB1' : '#FFE37A', 1.4); }
          else if (TH.deco === 'berries') { GFX.blob(c, x + 9 + r * 14, y - 4, 4.5, '#5FA85A', 1.4); c.fillStyle = '#E85C8F'; c.beginPath(); c.arc(x + 9 + r * 14, y - 5, 1.8, 0, 6.283); c.fill(); }
          else if (TH.deco === 'crystals') { c.fillStyle = '#7FE0F2'; c.strokeStyle = GFX.line; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 8 + r * 12, y); c.lineTo(x + 11 + r * 12, y - 12); c.lineTo(x + 14 + r * 12, y); c.closePath(); c.fill(); c.stroke(); }
          else if (TH.deco === 'banners' && r > 0.85) { c.fillStyle = '#8B93A1'; c.fillRect(x + 14, y - 26, 3, 26); c.fillStyle = '#FF6F59'; c.beginPath(); c.moveTo(x + 17, y - 26); c.lineTo(x + 29, y - 22); c.lineTo(x + 17, y - 17); c.fill(); }
        }
      } else if (TH.dark && tile(tx, ty + 1) === ' ' && r > 0.5) {
        // crystal stalactite under the cave ceiling
        c.fillStyle = 'rgba(127,224,242,.85)'; c.strokeStyle = GFX.line; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(x + 8 + r * 10, y + T); c.lineTo(x + 12 + r * 10, y + T + 10 + r * 8); c.lineTo(x + 16 + r * 10, y + T); c.closePath(); c.fill(); c.stroke();
      }
      outlineEdges(c, x, y, tx, ty);
    }
    function drawCloudRun(c, tx, ty) {
      let a = tx; while (a > 0 && tile(a - 1, ty) === '-') a--;
      let b = tx; while (b < lv.len - 1 && tile(b + 1, ty) === '-') b++;
      const x = a * HT, y = ty * HT, w = (b - a + 1) * HT;
      const shape = () => { c.beginPath(); GFX.rr(c, x + 1, y + 3, w - 2, 13, 6.5); for (let i = 0; i <= b - a; i++) { const cx = x + i * HT + 16; c.moveTo(cx + 9, y + 6); c.arc(cx, y + 6, 9, 0, 6.283); } };
      c.lineWidth = 5; c.strokeStyle = GFX.line; shape(); c.stroke();
      c.fillStyle = TH.cloud; shape(); c.fill();
      if (TH.dark) { c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 6, y + 4, w - 12, 2); }
      return b;
    }
    function drawTile(c, ch, tx, ty) {
      const x = tx * HT, T = HT;
      const bk = g.bumps.get(tx + ',' + ty), y = ty * HT - (bk ? Math.sin((1 - bk / 0.22) * Math.PI) * 7 : 0);
      switch (ch) {
        case '#': drawGround(c, tx, ty); break;
        case '=':
          c.fillStyle = TH.brick; c.fillRect(x, y, T, T);
          c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x, y, T, 3); c.fillRect(x, y, 3, T);
          c.fillStyle = 'rgba(43,36,51,.22)'; c.fillRect(x, y + T - 3, T, 3); c.fillRect(x + T - 3, y, 3, T);
          c.strokeStyle = 'rgba(43,36,51,.4)'; c.lineWidth = 1.6; c.beginPath();
          c.moveTo(x, y + 16); c.lineTo(x + T, y + 16); c.moveTo(x + 16, y); c.lineTo(x + 16, y + 16); c.moveTo(x + 8, y + 16); c.lineTo(x + 8, y + T); c.moveTo(x + 24, y + 16); c.lineTo(x + 24, y + T); c.stroke();
          c.strokeStyle = GFX.line; c.lineWidth = 2.4; c.strokeRect(x + 1.2, y + 1.2, T - 2.4, T - 2.4);
          break;
        case 'B': case 'H':
          GFX.rr(c, x + 1.5, y + 1.5, T - 3, T - 3, 6); c.fillStyle = ch === 'H' ? '#FFB3C8' : '#FFD447'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = GFX.line; c.stroke();
          if (ch === 'H') GFX.heart(c, x + 16, y + 15, 8, '#FF5C8A'); else GFX.star(c, x + 16, y + 16.5, 8.5 + Math.sin(g.t * 4 + tx) * 0.7, '#FFFFFF', 1.6);
          c.fillStyle = 'rgba(43,36,51,.5)'; [[6, 6], [26, 6], [6, 26], [26, 26]].forEach(([u, v]) => { c.beginPath(); c.arc(x + u, y + v, 1.5, 0, 6.283); c.fill(); });
          break;
        case 'b':
          GFX.rr(c, x + 1.5, y + 1.5, T - 3, T - 3, 6); c.fillStyle = '#B9946B'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = GFX.line; c.stroke();
          c.fillStyle = 'rgba(43,36,51,.45)'; [[6, 6], [26, 6], [6, 26], [26, 26]].forEach(([u, v]) => { c.beginPath(); c.arc(x + u, y + v, 1.5, 0, 6.283); c.fill(); });
          break;
        case '^': {
          c.fillStyle = TH.dark ? '#9CE8F5' : '#DCD7E8'; c.strokeStyle = GFX.line; c.lineWidth = 2;
          c.beginPath();
          for (let i = 0; i < 3; i++) { const sx = x + 2 + i * 9.33; c.moveTo(sx, y + T); c.lineTo(sx + 4.67, y + 13); c.lineTo(sx + 9.33, y + T); c.closePath(); }
          c.fill(); c.stroke();
          break;
        }
        case 'S': {
          const sk = g.springs.get(tx + ',' + ty) || 0, k = sk > 0 ? Math.sin((1 - sk / 0.3) * Math.PI) : 0;
          const top = y + k * 9;
          c.fillStyle = '#8B93A1'; GFX.rr(c, x + 3, y + T - 7, T - 6, 7, 3); c.fill(); c.lineWidth = 2; c.strokeStyle = GFX.line; c.stroke();
          c.beginPath(); const n = 4, y0 = top + 7, y1 = y + T - 7;
          for (let i = 0; i <= n; i++) { const yy = y0 + (y1 - y0) * i / n, xx = i % 2 ? x + 24 : x + 8; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
          c.lineWidth = 6; c.strokeStyle = GFX.line; c.stroke(); c.lineWidth = 3; c.strokeStyle = '#FF9F43'; c.stroke();
          c.fillStyle = '#FF6F59'; GFX.rr(c, x + 1, top, T - 2, 8, 4); c.fill(); c.lineWidth = 2.2; c.strokeStyle = GFX.line; c.stroke();
          break;
        }
      }
    }
    function drawFoe(c, f) {
      const x = f.x + f.w / 2, y = f.y + f.h / 2 + 1, r = 12;
      if (f.dead) {
        if (f.bonk) { GFX.gloomy(c, x, y, r, { rot: f.dead * 9, scared: true }); return; }
        if (f.dead > 0.4) return;
        c.save(); c.translate(x, f.y + f.h); c.scale(1.3, 0.35); GFX.gloomy(c, 0, -r, r, { scared: true }); c.restore();
        return;
      }
      if (f.type === 'f') {
        const flap = Math.sin(g.t * 16) * 0.6;
        c.fillStyle = '#FFFFFF'; c.strokeStyle = GFX.line; c.lineWidth = 2;
        [-1, 1].forEach(s => { c.save(); c.translate(x + s * 10, y - 4); c.rotate(s * (0.5 + flap)); c.beginPath(); c.ellipse(s * 8, 0, 9, 5, 0, 0, 6.283); c.fill(); c.stroke(); c.restore(); });
        GFX.gloomy(c, x, y, r, { color: '#7E68B8', lookX: f.dir });
        return;
      }
      if (f.type === 's') {
        c.fillStyle = '#F2F0F7'; c.strokeStyle = GFX.line; c.lineWidth = 1.6;
        c.beginPath();
        for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + g.t * f.dir * 2; c.moveTo(x + Math.cos(a - 0.25) * r * 0.9, y + Math.sin(a - 0.25) * r * 0.9); c.lineTo(x + Math.cos(a) * (r + 7), y + Math.sin(a) * (r + 7)); c.lineTo(x + Math.cos(a + 0.25) * r * 0.9, y + Math.sin(a + 0.25) * r * 0.9); c.closePath(); }
        c.fill(); c.stroke();
        GFX.gloomy(c, x, y, r, { color: '#C24B6B', lookX: f.dir });
        return;
      }
      const step2 = Math.sin(f.t * 12);
      c.fillStyle = GFX.line;
      c.beginPath(); c.ellipse(x - 6, f.y + f.h - 1 + (step2 > 0 ? -1.5 : 0), 5, 3, 0, 0, 6.283); c.ellipse(x + 6, f.y + f.h - 1 + (step2 > 0 ? 0 : -1.5), 5, 3, 0, 0, 6.283); c.fill();
      if (f.type === 'h') { c.save(); c.translate(x, y); c.scale(f.onGround ? 1.08 : 0.92, f.onGround ? 0.92 : 1.1); GFX.gloomy(c, 0, 0, r, { color: '#4E7FCF', lookX: f.dir }); c.restore(); }
      else GFX.gloomy(c, x, y - 1, r, { lookX: f.dir });
    }
    function drawExit(c) {
      if (!E.exit) return;
      const x = (E.exit.tx + 0.5) * HT, base = (E.exit.ty + 1) * HT;
      c.lineWidth = 2.6; c.strokeStyle = GFX.line;
      c.fillStyle = '#B8A3F2';
      c.beginPath(); c.moveTo(x - 30, base); c.lineTo(x - 30, base - 52); c.arc(x, base - 52, 30, Math.PI, 0); c.lineTo(x + 30, base); c.lineTo(x + 20, base); c.lineTo(x + 20, base - 52); c.arc(x, base - 52, 20, 0, Math.PI, true); c.lineTo(x - 20, base); c.closePath(); c.fill(); c.stroke();
      const glow = (TH.dark ? 0.75 : 0.45) + 0.2 * Math.sin(g.t * 3);
      c.fillStyle = `rgba(255,240,170,${glow})`; c.beginPath(); c.moveTo(x - 20, base); c.lineTo(x - 20, base - 52); c.arc(x, base - 52, 20, Math.PI, 0); c.lineTo(x + 20, base); c.closePath(); c.fill();
      c.save(); c.translate(x, base - 92 + Math.sin(g.t * 2.5) * 3); c.rotate(Math.sin(g.t * 1.6) * 0.15); GFX.star(c, 0, 0, 15, '#FFD447', 2.4); c.restore();
    }
    function drawCheck(c, k) {
      const x = k.tx * HT + 14, base = (k.ty + 1) * HT;
      c.fillStyle = '#8B93A1'; c.fillRect(x, base - 58, 4, 58); c.strokeStyle = GFX.line; c.lineWidth = 1.8; c.strokeRect(x, base - 58, 4, 58);
      GFX.blob(c, x + 2, base - 60, 4.2, k.on ? '#FFD447' : '#DCD7E8', 1.8);
      const wv = Math.sin(g.t * 5) * 2;
      c.beginPath(); c.moveTo(x + 4, base - 55); c.quadraticCurveTo(x + 14, base - 52 + wv, x + 25, base - 48); c.lineTo(x + 4, base - 39); c.closePath();
      c.fillStyle = k.on ? '#FF6F59' : '#C9C2D9'; c.fill(); c.lineWidth = 2; c.stroke();
    }
    function draw(c) {
      drawBack(c);
      const sc = g.sc;
      c.save();
      c.translate(-Math.round(g.camX * sc), -Math.round(g.camY * sc));
      c.scale(sc, sc);
      if (spec.ceil && g.camY < 0) { c.fillStyle = TH.dirt; c.fillRect(g.camX - 4, g.camY - 4, g.viewW + 8, -g.camY + 5); }
      const tx0 = Math.max(0, Math.floor(g.camX / HT) - 1), tx1 = Math.min(lv.len - 1, Math.ceil((g.camX + g.viewW) / HT) + 1);
      E.checks.forEach(k => { if (k.tx >= tx0 - 1 && k.tx <= tx1 + 1) drawCheck(c, k); });
      if (E.exit && E.exit.tx >= tx0 - 2 && E.exit.tx <= tx1 + 2) drawExit(c);
      for (let ty = 0; ty < HROWS; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
          const ch = grid[ty][tx];
          if (ch === ' ') continue;
          if (ch === '-') { if (tx === tx0 || tile(tx - 1, ty) !== '-') tx = Math.max(tx, drawCloudRun(c, tx, ty)); continue; }
          drawTile(c, ch, tx, ty);
        }
      }
      // solid earth continues below the level where there is ground
      const below = g.camY + g.viewH - LH;
      if (below > 0) {
        for (let tx = tx0; tx <= tx1; tx++) {
          if (grid[HROWS - 1][tx] !== '#') continue;
          c.fillStyle = TH.dirt; c.fillRect(tx * HT - 0.4, LH - 0.5, HT + 0.8, below + 1);
          c.strokeStyle = GFX.line; c.lineWidth = 2.4; c.beginPath();
          if (tx > 0 && grid[HROWS - 1][tx - 1] !== '#') { c.moveTo(tx * HT + 1.2, LH - 1); c.lineTo(tx * HT + 1.2, LH + below); }
          if (tx < lv.len - 1 && grid[HROWS - 1][tx + 1] !== '#') { c.moveTo((tx + 1) * HT - 1.2, LH - 1); c.lineTo((tx + 1) * HT - 1.2, LH + below); }
          c.stroke();
        }
      }
      for (const m of E.movers) {
        if (m.x + m.w < g.camX - 10 || m.x > g.camX + g.viewW + 10) continue;
        GFX.rr(c, m.x, m.y, m.w, m.h + 2, 6); c.fillStyle = TH.plank; c.fill(); c.lineWidth = 2.4; c.strokeStyle = GFX.line; c.stroke();
        c.strokeStyle = 'rgba(43,36,51,.3)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(m.x + 32, m.y + 3); c.lineTo(m.x + 32, m.y + m.h - 1); c.moveTo(m.x + 64, m.y + 3); c.lineTo(m.x + 64, m.y + m.h - 1); c.stroke();
        if (m.type === 'V') { c.fillStyle = '#FFFFFF'; c.font = `800 10px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('↕', m.x + m.w / 2, m.y + 7); }
      }
      for (const b of E.berries) {
        if (b.got || b.x < g.camX - 20 || b.x > g.camX + g.viewW + 20) continue;
        const bob = Math.sin(g.t * 3 + b.x * 0.05) * 2;
        GFX.blob(c, b.x, b.y + bob, 6.5, '#E85C8F', 2);
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(b.x - 2, b.y + bob - 2, 1.6, 0, 6.283); c.fill();
        c.fillStyle = '#5FB85A'; c.beginPath(); c.ellipse(b.x + 2, b.y + bob - 7, 3.5, 2, -0.5, 0, 6.283); c.fill();
      }
      for (const m of E.gems) {
        if (m.got || m.x < g.camX - 30 || m.x > g.camX + g.viewW + 30) continue;
        const bob = Math.sin(g.t * 2.4 + m.x) * 3;
        c.fillStyle = `rgba(255,243,176,${0.35 + 0.2 * Math.sin(g.t * 4)})`; c.beginPath(); c.arc(m.x, m.y + bob, 19, 0, 6.283); c.fill();
        c.save(); c.translate(m.x, m.y + bob); c.scale(Math.cos(g.t * 2.2) * 0.25 + 0.85, 1); GFX.star(c, 0, 0, 12.5, '#FFD447', 2.2); c.restore();
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(m.x - 3, m.y + bob - 4, 2.2, 0, 6.283); c.fill();
      }
      for (const f of foes) if (f.x > g.camX - 40 && f.x < g.camX + g.viewW + 40 && (!f.dead || f.dead < 3)) drawFoe(c, f);
      for (const q of g.parts) {
        if (q.k === 'berry') GFX.blob(c, q.x, q.y, 5, '#E85C8F', 1.6);
        else { c.save(); c.translate(q.x, q.y); c.rotate(q.r + q.life * 8); c.fillStyle = TH.brick; c.fillRect(-5, -5, 10, 10); c.strokeStyle = GFX.line; c.lineWidth = 1.6; c.strokeRect(-5, -5, 10, 10); c.restore(); }
      }
      // the pet
      if (g.deadT <= 0 && !(p.inv > 0 && Math.floor(g.t * 14) % 2 === 0)) {
        const run = p.onGround && Math.abs(p.vx) > 20;
        const sx = p.sq > 0 ? 1 + p.sq * 0.7 : 1 + p.sq * 0.45, sy = p.sq > 0 ? 1 - p.sq : 1 - p.sq * 0.9;
        const face = g.state === 'goal' || p.combo > 0 ? 'happy' : p.inv > 1 ? 'hurt' : 'normal';
        api.pet(c, p.x + p.w / 2, p.y + p.h + 1 + (run ? -Math.abs(Math.sin(g.t * 16)) * 2 : 0), 30, { flip: p.face < 0, face, sx, sy, rot: run ? p.vx / HOP.run * 0.07 : p.onGround ? 0 : p.vx / HOP.run * 0.12 });
      }
      c.restore();
      if (g.deadT > 0) { c.fillStyle = `rgba(20,16,41,${Math.min(0.6, (0.75 - g.deadT) * 1.6)})`; c.fillRect(0, 0, api.W, api.H); }
      if (g.intro > 0 && g.started) {
        const a = Math.min(1, g.intro / 0.5);
        c.globalAlpha = a;
        GFX.text(c, spec.name, api.W / 2, api.H * 0.24, 26, '#FFFFFF');
        GFX.text(c, `Find ${totalGems} star gems, reach the star gate`, api.W / 2, api.H * 0.24 + 32, 13, '#FFE37A');
        c.globalAlpha = 1;
      }
    }
    return {
      resize() { layout(); },
      start() { g.intro = 2.2; g.started = true; },
      key(k, down) { if (down && (k === 'jump' || k === 'tap')) p.buf = HOP.buffer; },
      down() { p.buf = HOP.buffer; g.touch = true; },
      up() { g.touch = false; },
      update, draw,
      idle(dt) { g.t += dt; },
      _dbg: { g, p, lv },
    };
  },
};
