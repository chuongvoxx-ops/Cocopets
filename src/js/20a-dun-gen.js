/* ---------- the floor generator: rooms of many shapes and lands, joined by halls, paths and bridges.
   Every visit rolls a new layout, mixing the floor's land with one or two others, and scatters traps and power stones.
   Finale floors grow a big arena room at the far end where the act's boss waits. ---------- */
const ROOM_SHAPES = {
  halls: ['rect', 'rect', 'cross', 'L', 'ring', 'oval'], swamp: ['cave', 'oval', 'islands', 'cave'], caves: ['cave', 'cave', 'oval', 'ring'],
  high: ['oval', 'diamond', 'cave', 'islands', 'cross'], frost: ['rect', 'oval', 'cross', 'ring', 'L'], hell: ['cave', 'oval', 'islands', 'diamond'],
  heaven: ['oval', 'diamond', 'cross', 'islands', 'ring'], keep: ['rect', 'cross', 'ring', 'L', 'rect'],
  desert: ['oval', 'cave', 'diamond', 'oval', 'islands'], icefield: ['oval', 'cave', 'islands', 'ring', 'oval'], volcano: ['cave', 'oval', 'islands', 'ring'],
  mountain: ['cave', 'diamond', 'oval', 'L', 'islands'], techno: ['rect', 'cross', 'rect', 'ring', 'L'], steampunk: ['rect', 'L', 'cross', 'rect', 'ring'],
  forest: ['cave', 'oval', 'cave', 'islands', 'ring'], bloom: ['oval', 'cave', 'diamond', 'ring', 'oval'],
};
const BOSS_ARENA = { halls: 'rect', swamp: 'oval', caves: 'cave', high: 'diamond', frost: 'rect', hell: 'oval', heaven: 'oval', keep: 'rect', desert: 'oval', icefield: 'oval', volcano: 'oval', mountain: 'diamond', techno: 'rect', steampunk: 'rect', forest: 'oval', bloom: 'oval' };
/* floor decals per land: [kind, chance] */
const DECALS = {
  halls: [['moss', 0.07], ['crack', 0.06], ['pebbles', 0.05], ['bones', 0.015]],
  swamp: [['grass', 0.16], ['shroomlet', 0.03], ['puddle', 0.05], ['flower', 0.02]],
  caves: [['shard', 0.06], ['pebbles', 0.07], ['crack', 0.04], ['glowmoss', 0.04]],
  high: [['grass', 0.2], ['flower', 0.09], ['pebbles', 0.04], ['clover', 0.04]],
  frost: [['snow', 0.12], ['crack', 0.04], ['frostflower', 0.03]],
  hell: [['ember', 0.09], ['crack', 0.08], ['bones', 0.03], ['ash', 0.06]],
  heaven: [['goldinlay', 0.08], ['feather', 0.04], ['flower', 0.04], ['star', 0.03]],
  keep: [['crack', 0.06], ['bones', 0.04], ['rune', 0.025], ['cobweb', 0.03]],
  desert: [['ripple', 0.14], ['pebbles', 0.05], ['bones', 0.025], ['crack', 0.04]],
  icefield: [['snow', 0.16], ['frostflower', 0.04], ['crack', 0.05]],
  volcano: [['ember', 0.1], ['crack', 0.1], ['ash', 0.08], ['bones', 0.02]],
  mountain: [['pebbles', 0.1], ['crack', 0.05], ['snow', 0.04], ['grass', 0.05]],
  techno: [['circuit', 0.1], ['vent', 0.04], ['crack', 0.02]],
  steampunk: [['rivets', 0.1], ['oil', 0.05], ['cog', 0.04]],
  forest: [['grass', 0.18], ['leaf', 0.08], ['shroomlet', 0.04], ['flower', 0.03], ['clover', 0.04]],
  bloom: [['flower', 0.16], ['petalpile', 0.08], ['clover', 0.05], ['grass', 0.08]],
};
function genFloor(F, R) {
  if (F.fiend) return genFiendArena(F, R);
  const MW = 64, MH = 64, N = MW * MH;
  const P = BIOMES[F.biome], fill = P.out ? T_GAP : T_SOLID, bi = k => BIOME_ORDER.indexOf(k);
  const G = new Uint8Array(N).fill(fill), BI = new Uint8Array(N).fill(bi(F.biome)), RM = new Int16Array(N).fill(-1), CORR = new Uint8Array(N);
  const props = new Map(), rooms = [];
  const id = (x, y) => y * MW + x, inb = (x, y) => x > 1 && y > 1 && x < MW - 2 && y < MH - 2;
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1)), pickR = a => a[Math.floor(R() * a.length)];
  const walk = i => T_WALK[G[i]] === 1;
  const others = BIOME_ORDER.filter(b => b !== F.biome && !BIOMES[b].rift && (F.high ? true : !BIOMES[b].high)), sec = pickR(others), ter = pickR(others.filter(b => b !== sec));
  const roomBiome = () => { if (F.rift) return F.biome; const r = R(); return r < 0.34 ? sec : r < 0.46 ? ter : F.biome; };   // (a rift's floors are all its own land)

  /* ---- room shapes ---- */
  function caveMask(w, h) {
    let m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = (x + 0.5 - w / 2) / (w / 2), v = (y + 0.5 - h / 2) / (h / 2), d = u * u + v * v; m[y * w + x] = d < 0.3 ? 1 : d > 1.02 ? 0 : (R() < 0.6 ? 1 : 0); }
    for (let it = 0; it < 3; it++) {
      const n2 = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) c += m[yy * w + xx]; }
        n2[y * w + x] = c >= 5 ? 1 : c <= 3 ? 0 : m[y * w + x];
      }
      m = n2;
    }
    // keep only the part joined to the middle
    const keep = new Uint8Array(w * h), q = [((h >> 1) * w) + (w >> 1)]; keep[q[0]] = 1; m[q[0]] = 1;
    while (q.length) { const k = q.pop(), x = k % w, y = (k / w) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const xx = x + dx, yy = y + dy, kk = yy * w + xx; if (xx >= 0 && yy >= 0 && xx < w && yy < h && m[kk] && !keep[kk]) { keep[kk] = 1; q.push(kk); } }); }
    return keep;
  }
  function roomTiles(rm) {
    const { x: x0, y: y0, w, h, shape } = rm, out = [], cx = x0 + w / 2, cy = y0 + h / 2;
    const cave = shape === 'cave' ? caveMask(w, h) : null;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const u = (x + 0.5 - cx) / (w / 2), v = (y + 0.5 - cy) / (h / 2);
      let ok = true;
      if (shape === 'oval' || shape === 'islands') ok = u * u + v * v <= 1.12;
      else if (shape === 'diamond') ok = Math.abs(u) + Math.abs(v) <= 1.18;
      else if (shape === 'cross') ok = Math.abs(u) <= 0.44 || Math.abs(v) <= 0.44;
      else if (shape === 'L') { const q = rm.lq; ok = !((q & 1 ? u < -0.12 : u > 0.12) && (q & 2 ? v > 0.12 : v < -0.12)); }
      else if (shape === 'cave') ok = cave[(y - y0) * w + (x - x0)] === 1;
      if (ok && inb(x, y)) out.push([x, y]);
    }
    return out;
  }
  const blob = (cx, cy, r, f) => { for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) { if (!inb(x, y)) continue; const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) + (R() - 0.5) * 0.5; if (d <= r) f(x, y, id(x, y)); } };
  function carveRoom(rm, i) {
    const tiles = roomTiles(rm), b = bi(rm.biome), out = BIOMES[rm.biome].out;
    rm.tiles = tiles.length; rm.cells = tiles;
    for (const [x, y] of tiles) { const k = id(x, y); G[k] = T_FLOOR; BI[k] = b; RM[k] = i; }
    const cx = rm.x + rm.w / 2, cy = rm.y + rm.h / 2;
    if (rm.shape === 'ring') {
      const hw = Math.max(1, Math.round(rm.w * 0.18)), hh = Math.max(1, Math.round(rm.h * 0.18));
      for (let y = Math.floor(cy) - hh; y < Math.floor(cy) + hh; y++) for (let x = Math.floor(cx) - hw; x < Math.floor(cx) + hw; x++) if (RM[id(x, y)] === i) G[id(x, y)] = out ? T_GAP : T_SOLID;
    }
    if (rm.shape === 'islands') {
      for (const [x, y] of tiles) G[id(x, y)] = T_GAP;
      const isl = [[cx, cy]], n = 3 + (R() < 0.5 ? 1 : 0);
      for (let j = 0; j < n; j++) { const a = j / n * 6.283 + R() * 0.8, d = 0.62; isl.push([cx + Math.cos(a) * rm.w / 2 * d, cy + Math.sin(a) * rm.h / 2 * d]); }
      isl.forEach(([x, y], j) => blob(x, y, j ? 1.9 + R() * 0.8 : 2.5, (xx, yy, k) => { if (RM[k] === i) G[k] = T_FLOOR; }));
      isl.slice(1).forEach(([x, y]) => line2(Math.floor(cx), Math.floor(cy), Math.floor(x), Math.floor(y), k => { if (RM[k] === i && G[k] === T_GAP) G[k] = T_BRIDGE; }));
    }
  }
  /* a 2-wide L-shaped path between two points */
  function line2(ax, ay, bx, by, f, horizFirst) {
    const hx = (x0, x1, y) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { if (inb(x, y)) f(id(x, y)); if (inb(x, y + 1)) f(id(x, y + 1)); } };
    const vy = (y0, y1, x) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) { if (inb(x, y)) f(id(x, y)); if (inb(x + 1, y)) f(id(x + 1, y)); } };
    if (horizFirst !== false) { hx(ax, bx, ay); vy(ay, by, bx); } else { vy(ay, by, ax); hx(ax, bx, by); }
  }
  const corrTile = k => { if (RM[k] === -1) { G[k] = G[k] === T_GAP ? T_BRIDGE : G[k] === T_SOLID ? (fill === T_GAP ? T_BRIDGE : T_FLOOR) : G[k]; CORR[k] = 1; } else if (G[k] === T_GAP) { G[k] = T_BRIDGE; CORR[k] = 1; } };

  /* ---- rooms grow out from the first one ---- */
  const first = { w: 9, h: 9, x: (MW - 9) >> 1, y: (MH - 9) >> 1, biome: F.biome, shape: P.out ? 'oval' : 'rect', lq: 0 };
  rooms.push(first); carveRoom(first, 0);
  let tries = 0, arena = -1;
  const want = F.rooms + (F.boss ? 1 : 0);
  while (rooms.length < want && tries++ < 1400) {
    const isArena = F.boss && rooms.length === want - 1;
    const from = isArena ? rooms.reduce((a, b) => (Math.hypot(b.x + b.w / 2 - first.x - 4.5, b.y + b.h / 2 - first.y - 4.5) > Math.hypot(a.x + a.w / 2 - first.x - 4.5, a.y + a.h / 2 - first.y - 4.5) ? b : a), rooms[0]) : rooms[Math.floor(R() * rooms.length)];
    const dir = Math.floor(R() * 4);
    const w = isArena ? 18 : ri(10, 16), h = isArena ? 16 : ri(9, 13), gap = ri(3, 6), jx = Math.floor((R() - 0.5) * 6), jy = Math.floor((R() - 0.5) * 6);
    let x, y;
    if (dir === 0) { x = from.x + from.w + gap; y = from.y + ((from.h - h) >> 1) + jy; }
    else if (dir === 1) { x = from.x - gap - w; y = from.y + ((from.h - h) >> 1) + jy; }
    else if (dir === 2) { y = from.y + from.h + gap; x = from.x + ((from.w - w) >> 1) + jx; }
    else { y = from.y - gap - h; x = from.x + ((from.w - w) >> 1) + jx; }
    if (x < 2 || y < 2 || x + w > MW - 2 || y + h > MH - 2) continue;
    if (rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
    const biome = isArena ? F.biome : roomBiome();
    let shape = isArena ? (BOSS_ARENA[F.biome] || BOSS_ARENA[biomeTile(F.biome)] || 'oval') : pickR(ROOM_SHAPES[biome] || ROOM_SHAPES[biomeTile(biome)] || ROOM_SHAPES.halls);
    if (shape === 'islands' && (w < 12 || h < 10)) shape = 'oval';
    if (isArena && shape === 'cave') shape = 'oval';
    const rm = { x, y, w, h, from, biome, shape, lq: ri(0, 3), dir, arena: isArena };
    rooms.push(rm); carveRoom(rm, rooms.length - 1);
    if (isArena) arena = rooms.length - 1;
    const ax = Math.floor(from.x + from.w / 2), ay = Math.floor(from.y + from.h / 2), bx = Math.floor(x + w / 2), by = Math.floor(y + h / 2);
    line2(ax, ay, bx, by, corrTile, dir < 2);
  }
  if (F.boss && arena < 0) { let best = 1, bt = 0; rooms.forEach((rm, i) => { if (i && rm.tiles > bt) { bt = rm.tiles; best = i; } }); arena = best; rooms[arena].arena = true; }
  const start = { x: first.x + first.w / 2, y: first.y + first.h / 2 + 0.5 };
  let bossAt = null;
  /* ---- what's inside each room ---- */
  const nearCorr = (x, y, d) => { for (let yy = y - d; yy <= y + d; yy++) for (let xx = x - d; xx <= x + d; xx++) if (inb(xx, yy) && CORR[id(xx, yy)]) return true; return false; };
  const okFeature = (x, y, i) => inb(x, y) && RM[id(x, y)] === i && G[id(x, y)] === T_FLOOR && !nearCorr(x, y, 1) && Math.hypot(x + 0.5 - start.x, y + 0.5 - start.y) > 2.5;
  const scatter = (rm, i, n, kinds) => { for (let j = 0; j < n * 4 && n > 0; j++) { const x = rm.x + 1 + Math.floor(R() * (rm.w - 2)), y = rm.y + 1 + Math.floor(R() * (rm.h - 2)); if (!okFeature(x, y, i)) continue; let crowd = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (G[id(x + dx, y + dy)] === T_SOLID && RM[id(x + dx, y + dy)] === i) crowd = true; if (crowd) continue; G[id(x, y)] = T_SOLID; props.set(id(x, y), pickR(kinds)); n--; } };
  rooms.forEach((rm, i) => {
    const B = BIOMES[rm.biome], cx = rm.x + rm.w / 2, cy = rm.y + rm.h / 2, big = rm.w >= 11 && rm.h >= 10;
    const pool = (r, tile) => { for (let j = 0; j < 12; j++) { const x = rm.x + 2 + R() * (rm.w - 4), y = rm.y + 2 + R() * (rm.h - 4); if (!okFeature(Math.floor(x), Math.floor(y), i) || Math.hypot(x - cx, y - cy) < 1.5 && i === 0) continue; blob(x, y, r, (xx, yy, k) => { if (RM[k] === i && G[k] === T_FLOOR && !nearCorr(xx, yy, 1)) G[k] = tile; }); return; } };
    if (i === 0) { scatter(rm, i, B.propN ? B.propN[0] : B.out ? 2 : 0, B.props); return; }
    if (rm.arena) {
      /* the boss arena: open in the middle, dressed round the edges */
      const x0 = rm.x, y0 = rm.y, w = rm.w, h = rm.h;
      const prop = (x, y, kind) => { const k = id(Math.floor(x), Math.floor(y)); if (RM[k] !== i) return; G[k] = T_SOLID; props.set(k, kind); };
      const sym4 = (dx, dy, f) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => f(cx + sx * dx, cy + sy * dy));
      switch (biomeTile(F.biome)) {
        case 'halls': case 'techno': case 'steampunk': sym4(5, 4.5, (x, y) => prop(x, y, B.props[0])); break;
        case 'swamp': case 'forest': blob(x0 + 3, cy + 0.5, 1.7, (x, y, k) => { if (RM[k] === i) G[k] = T_GAP; }); blob(x0 + w - 3, cy + 0.5, 1.7, (x, y, k) => { if (RM[k] === i) G[k] = T_GAP; }); blob(cx - 4, y0 + h - 4, 1.6, (x, y, k) => { if (G[k] === T_FLOOR) G[k] = T_MUD; }); blob(cx + 4, y0 + h - 4, 1.6, (x, y, k) => { if (G[k] === T_FLOOR) G[k] = T_MUD; }); break;
        case 'caves': sym4(5, 4.5, (x, y) => prop(x, y, 'crystal')); break;
        case 'high': case 'mountain': prop(cx - 4.5, cy + 2, 'boulder'); prop(cx + 4.5, cy + 2, 'boulder'); sym4(6, 5, (x, y) => prop(x, y, 'pine')); break;
        case 'frost': case 'icefield': blob(cx - 3.5, cy + 1, 2.2, (x, y, k) => { if (G[k] === T_FLOOR) G[k] = T_ICE; }); blob(cx + 3.5, cy + 1, 2.2, (x, y, k) => { if (G[k] === T_FLOOR) G[k] = T_ICE; }); sym4(5.5, 5, (x, y) => prop(x, y, 'iceblock')); break;
        case 'hell': case 'volcano': blob(x0 + 3.2, cy, 1.6, (x, y, k) => { if (RM[k] === i) G[k] = T_GAP; }); blob(x0 + w - 3.2, cy, 1.6, (x, y, k) => { if (RM[k] === i) G[k] = T_GAP; }); prop(cx - 5, y0 + h - 4, 'obsidian'); prop(cx + 5, y0 + h - 4, 'obsidian'); break;
        case 'heaven': sym4(4.5, 3.5, (x, y) => prop(x, y, 'marble')); break;
        case 'keep': for (let j = 0; j < 3; j++) { prop(x0 + 3, y0 + 4 + j * 4, 'pillar'); prop(x0 + w - 4, y0 + 4 + j * 4, 'pillar'); } break;
        case 'desert': sym4(5.5, 4.5, (x, y) => prop(x, y, 'cactus')); blob(cx, y0 + h - 4, 1.5, (x, y, k) => { if (RM[k] === i) G[k] = T_GAP; }); break;
        case 'bloom': sym4(5, 4.5, (x, y) => prop(x, y, 'bigflower')); break;
        default: sym4(5, 4.5, (x, y) => prop(x, y, B.props[0]));
      }
      bossAt = { x: cx, y: y0 + 4.5 };
      blob(bossAt.x, bossAt.y, 2.4, (x, y, k) => { if (RM[k] === i) { G[k] = G[k] === T_ICE || G[k] === T_MUD ? G[k] : T_FLOOR; props.delete(k); } });
      return;
    }
    switch (biomeTile(rm.biome)) {
      case 'halls': case 'keep': case 'techno': case 'steampunk':
        if (big && (rm.shape === 'rect' || rm.shape === 'L')) [[0.25, 0.3], [0.75, 0.3], [0.25, 0.7], [0.75, 0.7]].forEach(([u, v]) => { const x = Math.floor(rm.x + rm.w * u), y = Math.floor(rm.y + rm.h * v); if (okFeature(x, y, i)) { G[id(x, y)] = T_SOLID; props.set(id(x, y), rm.biome === 'keep' && R() < 0.3 ? 'statue' : rm.biome === 'halls' || rm.biome === 'keep' ? (R() < 0.25 ? 'brokenpillar' : 'pillar') : pickR(B.props)); } });
        else scatter(rm, i, 1 + Math.floor(R() * 2), B.props);
        if ((rm.biome === 'keep' || rm.biome === 'techno') && R() < 0.3) pool(1.6, T_GAP);
        if (rm.biome === 'steampunk' && R() < 0.25) pool(1.4, T_GAP);
        break;
      case 'caves': scatter(rm, i, B.propN ? B.propN[0] + Math.floor(R() * B.propN[1]) : 2 + Math.floor(R() * 3), B.props); if (R() < 0.4) pool(1.8, T_GAP); break;
      case 'frost': pool(2 + R(), T_ICE); if (R() < 0.6) pool(1.6, T_ICE); scatter(rm, i, B.propN ? B.propN[0] + Math.floor(R() * B.propN[1]) : 1 + Math.floor(R() * 3), B.props); break;
      case 'icefield': pool(2.4 + R(), T_ICE); pool(1.8, T_ICE); if (R() < 0.5) pool(1.5, T_GAP); scatter(rm, i, 2 + Math.floor(R() * 3), B.props); break;
      case 'swamp': pool(1.4 + R() * 0.8, T_GAP); if (R() < 0.6) pool(1.3, T_GAP); pool(1.8, T_MUD); pool(1.5, T_MUD); scatter(rm, i, 2 + Math.floor(R() * 4), B.props); break;
      case 'forest': if (R() < 0.5) pool(1.4, T_GAP); pool(1.5, T_MUD); scatter(rm, i, B.propN ? B.propN[0] + Math.floor(R() * B.propN[1]) : 3 + Math.floor(R() * 4), B.props); break;
      case 'high': case 'mountain': scatter(rm, i, B.propN ? B.propN[0] + Math.floor(R() * B.propN[1]) : 3 + Math.floor(R() * 4), B.props); if (R() < 0.35) pool(1.5, T_GAP); break;
      case 'hell': case 'volcano': pool(1.4 + R() * 0.8, T_GAP); if (R() < 0.5) pool(1.3, T_GAP); scatter(rm, i, 1 + Math.floor(R() * 3), B.props); break;
      case 'heaven': if (R() < 0.7) pool(1.3, T_GAP); scatter(rm, i, B.propN ? B.propN[0] + Math.floor(R() * B.propN[1]) : 2 + Math.floor(R() * 2), B.props); break;
      case 'desert': if (R() < 0.6) pool(1.6, T_GAP); scatter(rm, i, B.propN ? B.propN[0] + Math.floor(R() * B.propN[1]) : 2 + Math.floor(R() * 3), B.props); break;
      case 'bloom': if (R() < 0.5) pool(1.3, T_GAP); scatter(rm, i, 3 + Math.floor(R() * 3), B.props); break;
      case 'hull': if (R() < 0.55) pool(1.5 + R() * 0.6, T_GAP); scatter(rm, i, B.propN ? B.propN[0] + Math.floor(R() * B.propN[1]) : 3 + Math.floor(R() * 3), B.props); break;
    }
    // an indoor room on an open-air floor is a ruin: walls round its edge, open where the paths come in
    if (!B.out && fill === T_GAP) for (const [x, y] of rm.cells) { const k = id(x, y); if (RM[k] !== i || !walk(k) || nearCorr(x, y, 1)) continue; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => G[id(x + dx, y + dy)] === T_GAP && RM[id(x + dx, y + dy)] !== i)) { G[k] = T_SOLID; props.delete(k); } }
  });
  // a land may dress its rooms further (the garden grows a thicket round each room's edge)
  rooms.forEach((rm, i) => { const B = BIOMES[rm.biome]; if (B && B.dress && !rm.arena) B.dress({ rm, i, G, RM, props, R, id, MW, MH, walk, okFeature, CORR, first: i === 0 }); });
  /* ---- make sure everything can be reached ---- */
  const sx0 = Math.floor(start.x), sy0 = Math.floor(start.y);
  function flood() {
    const seen = new Uint8Array(N), q = [id(sx0, sy0)]; seen[q[0]] = 1;
    for (let h = 0; h < q.length; h++) { const k = q[h]; for (const d of [1, -1, MW, -MW]) { const kk = k + d; if (!seen[kk] && walk(kk)) { seen[kk] = 1; q.push(kk); } } }
    return seen;
  }
  G[id(sx0, sy0)] = T_FLOOR;
  for (let pass = 0; pass < 12; pass++) {
    const seen = flood();
    let fixed = false;
    for (let i = 0; i < rooms.length && !fixed; i++) {
      const rm = rooms[i];
      let inside = 0, reached = 0, best = null, bd = 1e9;
      for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] !== i || !walk(k)) continue; inside++; if (seen[k]) reached++; }
      if (!inside || reached > inside * 0.6) continue;
      // join an unreached part of this room to the nearest reached tile
      for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) {
        const k = id(x, y); if (RM[k] !== i || !walk(k) || seen[k]) continue;
        for (let yy = Math.max(2, y - 14); yy < Math.min(MH - 2, y + 14); yy++) for (let xx = Math.max(2, x - 14); xx < Math.min(MW - 2, x + 14); xx++) { if (!seen[id(xx, yy)]) continue; const d = Math.abs(xx - x) + Math.abs(yy - y); if (d < bd) { bd = d; best = [x, y, xx, yy]; } }
      }
      if (best) { line2(best[0], best[1], best[2], best[3], k => { if (!walk(k)) { G[k] = G[k] === T_GAP ? T_BRIDGE : T_FLOOR; props.delete(k); } CORR[k] = 1; }); fixed = true; }
    }
    if (!fixed) break;
  }
  const seen = flood();
  for (let k = 0; k < N; k++) if (walk(k) && !seen[k]) { G[k] = RM[k] >= 0 && BIOMES[BIOME_ORDER[BI[k]]].out ? T_GAP : fill === T_GAP ? T_GAP : T_SOLID; props.delete(k); }
  // corridor tiles take the land of the room they lead to
  for (let k = 0; k < N; k++) if (RM[k] === -1 && walk(k)) { const x = k % MW, y = (k / MW) | 0; let best = -1, bd = 1e9; rooms.forEach((rm, i) => { const d = Math.hypot(x - (rm.x + rm.w / 2), y - (rm.y + rm.h / 2)); if (d < bd) { bd = d; best = i; } }); if (best >= 0) BI[k] = bi(rooms[best].biome); }
  const floorAt = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && walk(id(x, y));
  const plain = (x, y) => floorAt(x, y) && G[id(x, y)] !== T_BRIDGE && !props.has(id(x, y));
  const open = (x, y) => plain(x, y) && floorAt(x + 1, y) && floorAt(x - 1, y) && floorAt(x, y + 1) && floorAt(x, y - 1);

  /* ---- lights, decals, pots, shrines, hazards, traps, stones and monsters ---- */
  const lights = [];
  for (let y = 2; y < MH - 2; y++) for (let x = 2; x < MW - 2; x++) {
    const k = id(x, y), B = BIOMES[BIOME_ORDER[BI[k]]];
    if (G[k] === T_SOLID && !props.has(k) && floorAt(x, y + 1) && !floorAt(x, y - 1) && !B.out && B.dark > 0.3 && R() < 0.16 && !lights.some(t => t.kind === 'torch' && Math.abs(t.x - x - 0.5) + Math.abs(t.y - y - 0.55) < 5)) lights.push({ kind: B.name === 'Neon Lab' ? 'neon' : 'torch', x: x + 0.5, y: y + 0.55, ph: R() * 6.28, color: B.light, r: 2.9 });
    const pk = props.get(k);
    if (pk === 'crystal' || pk === 'brazier' || pk === 'candles' || pk === 'shroom' || pk === 'lamp' || pk === 'neonpillar' || pk === 'lantern' || pk === 'server' || pk === 'pinkshroom') lights.push({ kind: pk, x: x + 0.5, y: y + 0.5, ph: R() * 6.28, color: pk === 'crystal' ? pickR(['#7FD3F2', '#B39CFF', '#FF9BD2']) : pk === 'shroom' ? '#9BE0FF' : pk === 'pinkshroom' ? '#FF9BD2' : pk === 'candles' || pk === 'lamp' || pk === 'lantern' ? '#FFB066' : pk === 'neonpillar' || pk === 'server' ? '#4DF0FF' : '#FF9F43', r: pk === 'shroom' || pk === 'pinkshroom' || pk === 'server' ? 2 : 2.6 });
  }
  const decals = [];
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
    const k = id(x, y); if (!walk(k) || G[k] === T_BRIDGE) continue;
    const list = DECALS[BIOME_ORDER[BI[k]]] || DECALS[biomeTile(BIOME_ORDER[BI[k]])] || DECALS.halls;
    for (const [kind, p] of list) if (R() < p) { decals.push({ x: x + 0.2 + R() * 0.6, y: y + 0.25 + R() * 0.55, kind, s: 0.7 + R() * 0.6, v: Math.floor(R() * 4), rot: R() * 6.283 }); break; }
  }
  if (F.boss && arena >= 0 && (F.biome === 'keep' || F.biome === 'halls')) for (let y = rooms[arena].y + 1; y < rooms[arena].y + rooms[arena].h - 1; y++) decals.push({ x: rooms[arena].x + rooms[arena].w / 2, y: y + 0.5, kind: 'carpet', s: 1, v: 0, rot: 0 });
  const freeIn = (rm, i, pad, test) => { for (let j = 0; j < 40; j++) { const x = rm.x + pad + Math.floor(R() * Math.max(1, rm.w - pad * 2)), y = rm.y + pad + Math.floor(R() * Math.max(1, rm.h - pad * 2)); if (RM[id(x, y)] === i && (test || open)(x, y)) return { x: x + 0.5, y: y + 0.5 }; } return null; };
  const pots = [], packs = [], hazards = [], shrines = [], nests = [], traps = [], stones = [];
  let gremlin = null;
  const combat = rooms.map((rm, i) => i).filter(i => i > 0 && !rooms[i].arena);
  rooms.forEach((rm, i) => {
    const B = BIOMES[rm.biome];
    const nPots = i === 0 ? 1 : rm.arena ? 2 : 1 + Math.floor(R() * 3);
    for (let j = 0; j < nPots; j++) { const p = freeIn(rm, i, 1); if (p && !(rm.arena && bossAt && Math.hypot(p.x - bossAt.x, p.y - bossAt.y) < 3.5)) pots.push({ x: p.x, y: p.y, kind: R() < 0.16 ? 'chest' : (['halls', 'hell', 'high', 'keep', 'steampunk', 'volcano', 'techno'].includes(rm.biome) && R() < 0.3) ? 'barrel' : 'pot', biome: rm.biome }); }
    if (i === 0 || rm.arena) return;
    const area = rm.tiles || rm.w * rm.h, nPacks = Math.min(F.packsPer, area < 60 ? 1 : area < 110 ? 2 : 3);
    for (let j = 0; j < nPacks; j++) { const p = freeIn(rm, i, 2) || freeIn(rm, i, 1); if (p && !packs.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 3)) packs.push({ x: p.x, y: p.y, room: i, biome: rm.biome }); }
    if (F.hazards) {
      const hz = B.hazard, fam = HAZ_FAMILY[hz] || 'area';
      if (fam !== 'area') { const n = fam === 'spikes' ? 2 + Math.floor(R() * 3) : 1 + Math.floor(R() * 2); for (let j = 0; j < n; j++) { const p = freeIn(rm, i, 1); if (p && !hazards.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 1.8)) hazards.push({ kind: hz, fam, x: p.x, y: p.y, room: i, ph: R() * 4 }); } }
      else if (R() < 0.75) hazards.push({ kind: hz, fam, room: i, area: true, ph: 1 + R() * 2 });
    }
  });
  // keep the whole floor's population sane: thin the busiest rooms first
  const maxPacks = Math.max(3, Math.floor((F.maxMons || 120) / (F.pack + 0.5)));
  while (packs.length > maxPacks) {
    const count = {}; packs.forEach(p => { count[p.room] = (count[p.room] || 0) + 1; });
    const busiest = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
    const idx = packs.findIndex(p => String(p.room) === busiest);
    packs.splice(idx, 1);
  }
  for (let s = 0; s < F.shrines && combat.length; s++) {
    for (let j = 0; j < 10; j++) { const i = pickR(combat), rm = rooms[i]; if (shrines.some(q => q.room === i)) continue; const p = freeIn(rm, i, 2); if (p) { shrines.push({ x: p.x, y: p.y, room: i, kind: SHRINE_KEYS.filter(k => !shrines.some(q => q.kind === k))[Math.floor(R() * (SHRINE_KEYS.length - shrines.length))] }); break; } }
  }
  for (let j = 0; j < F.nests; j++) { const i = pickR(combat), p = i && freeIn(rooms[i], i, 2); if (p) nests.push(p); }
  if (combat.length > 1 && R() < F.gremlin) { const i = combat[combat.length - 1 - Math.floor(R() * Math.min(3, combat.length))], p = freeIn(rooms[i], i, 2); if (p) gremlin = { x: p.x, y: p.y, room: i }; }
  /* traps: arrow launchers and flame jets sit against walls, saw blades run along tracks, mines and laser fences lie in the open */
  const wallDir = (x, y) => { const d = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => G[id(x + dx, y + dy)] === T_SOLID && !props.has(id(x + dx, y + dy))); return d.length ? pickR(d) : null; };
  const runLen = (x, y, dx, dy) => { let n = 0; while (n < 7 && open(x + dx * (n + 1), y + dy * (n + 1))) n++; return n; };
  for (let t = 0; t < F.traps && combat.length; t++) {
    const i = pickR(combat), rm = rooms[i], kind = pickR(['arrow', 'arrow', 'saw', 'mine', 'mine', 'flame', 'fence', 'saw']);
    for (let j = 0; j < 14; j++) {
      const p = freeIn(rm, i, 1, plain); if (!p) break;
      const x = Math.floor(p.x), y = Math.floor(p.y);
      if (Math.hypot(p.x - start.x, p.y - start.y) < 4 || traps.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 2.5) || hazards.some(q => !q.area && Math.hypot(q.x - p.x, q.y - p.y) < 1.5) || shrines.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 2)) continue;
      if (kind === 'arrow' || kind === 'flame') { const d = wallDir(x, y); if (!d) continue; const len = runLen(x, y, -d[0], -d[1]); if (len < 3) continue; traps.push({ kind, x: p.x, y: p.y, dx: -d[0], dy: -d[1], len: Math.min(len + 0.5, kind === 'flame' ? 3.5 : 7), room: i, ph: R() * 3 }); break; }
      if (kind === 'saw') { const horiz = R() < 0.5, dx = horiz ? 1 : 0, dy = horiz ? 0 : 1, a = runLen(x, y, -dx, -dy), b = runLen(x, y, dx, dy); if (a + b < 3) continue; traps.push({ kind, x: p.x, y: p.y, x0: p.x - dx * a, y0: p.y - dy * a, x1: p.x + dx * b, y1: p.y + dy * b, room: i, ph: R() * 3, spd: 2.2 + R() * 1.2 }); break; }
      if (kind === 'fence') { const horiz = R() < 0.5, dx = horiz ? 1 : 0, dy = horiz ? 0 : 1, b = runLen(x, y, dx, dy); if (b < 3) continue; const L = Math.min(b, 5); traps.push({ kind, x: p.x, y: p.y, x1: p.x + dx * L, y1: p.y + dy * L, room: i, ph: R() * 3 }); break; }
      traps.push({ kind, x: p.x, y: p.y, room: i, ph: R() * 3 }); break;
    }
  }
  /* power stones */
  for (let s = 0; s < F.stones && combat.length; s++) {
    const i = pickR(combat), p = freeIn(rooms[i], i, 2);
    if (p && !stones.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 3)) stones.push({ x: p.x, y: p.y, room: i, kind: POWER_KEYS[Math.floor(R() * POWER_KEYS.length)] });
  }
  return { MW, MH, G, BI, RM, props, rooms, start, bossAt, arena, lights, decals, pots, packs, hazards, shrines, nests, gremlin, traps, stones, sec, ter };
}
