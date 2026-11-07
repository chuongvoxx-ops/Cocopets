/* ---------- Cocopets Town: the hub core ----------
   The town is the game's main screen: a full-screen canvas (#hubWrap, above the room's #stage) where the active pet
   walks the HUB layout with the party trailing behind. This file is the world: camera, movement and collision (building
   footprints, terrace walls with ramps, the river with its bridges), the depth-sorted draw loop, the party's following
   and idle behaviours, the interaction prompt, the screen flow (town ⇄ house ⇄ overlays), input and the save. The art
   comes from the kits when they are present (HubGeo for buildings and props, HubLand for the ground and the trees,
   HubFacilities for what every place does); without them the core still runs on plain fallbacks: a green map with path
   lines, labelled boxes, doors that open what they obviously should. */
const hubWrap = $('#hubWrap'), hubCv = $('#hubCv'), hubC = hubCv.getContext('2d'), hubUi = $('#hubUi'), hubMapBtn = $('#hubMapBtn'), outsideBtn = $('#outsideBtn');
const HUB_LIFT = 70, HUB_STEP = 18, HUB_SPEED = 230, HUB_CELL = 20, HUB_PET_H = 54, HUB_FOLLOW_GAP = 44;
let hub = null, hubOn = false;
const hubLiftOf = lv => (globalThis.HubLand && typeof HubLand.lift === 'function') ? HubLand.lift(lv) : lv * HUB_LIFT;
const hubKits = () => ({ geo: globalThis.HubGeo || null, land: globalThis.HubLand || null, fac: globalThis.HubFacilities || null });

/* ---------- geometry: where things are, how high they stand ---------- */
function hubPtInPoly(x, y, P) { let inside = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const xi = P[i][0], yi = P[i][1], xj = P[j][0], yj = P[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; }
const hubInRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;   // (ramps, bridges and the dock are top-left rects)
function hubSegDist(x, y, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy; let u = L ? ((x - ax) * dx + (y - ay) * dy) / L : 0; u = u < 0 ? 0 : u > 1 ? 1 : u; return Math.hypot(x - (ax + dx * u), y - (ay + dy * u)); }
function hubRiverDist(x, y) { const P = HUB.river.pts; let best = 1e9; for (let i = 0; i < P.length - 1; i++) { if (x < Math.min(P[i][0], P[i + 1][0]) - 80 || x > Math.max(P[i][0], P[i + 1][0]) + 80) continue; const d = hubSegDist(x, y, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1]); if (d < best) best = d; } return best; }
let hubRamps = null;
function hubRampList() {
  if (hubRamps) return hubRamps;
  hubRamps = [];
  HUB.terraces.forEach(T => T.ramps.forEach(r => hubRamps.push(Object.assign({ terrace: T.id, tlv: T.lv }, r))));
  // each ramp joins the ground at its two ends: sample just beyond each end along its axis to learn the two levels
  for (const r of hubRamps) {
    const ns = r.dir === 'n' || r.dir === 's', cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const a = ns ? [cx, r.y - 8] : [r.x - 8, cy], b = ns ? [cx, r.y + r.h + 8] : [r.x + r.w + 8, cy];
    r.ns = ns; r.lvA = hubTerraceLv(a[0], a[1]); r.lvB = hubTerraceLv(b[0], b[1]);
  }
  return hubRamps;
}
function hubTerraceLv(x, y) { let lv = 0; for (const T of HUB.terraces) if (T.lv > lv && hubPtInPoly(x, y, T.poly)) lv = T.lv; return lv; }   // (where terraces overlap the higher one wins, as the landscape paints it)
function hubRampAt(x, y) { for (const r of hubRampList()) if (hubInRect(x, y, r)) return r; return null; }
function hubBridgeAt(x, y) { for (const b of HUB.bridges) if (hubInRect(x, y, b)) return b; return null; }
/* the ground at a point: its level (or the ramp it is on), water and shallows */
function hubTerrain(x, y) {
  const ramp = hubRampAt(x, y), lv = ramp ? -1 : hubTerraceLv(x, y);
  const d = hubRiverDist(x, y), hw = HUB.river.w / 2, bridge = d < hw + 12 ? hubBridgeAt(x, y) : null;
  return { lv, ramp, water: !bridge && d < hw - 8, splash: !bridge && d >= hw - 8 && d < hw + 10, bridge: !!bridge };
}
/* how far above its map position a point is drawn: a terrace lifts by its level, a ramp climbs between its ends */
function hubLiftAt(x, y, lv) {
  const r = hubRampAt(x, y);
  if (r) return hubRampLift(r, x, y);
  return hubLiftOf(lv != null ? lv : hubTerraceLv(x, y));
}
/* ---------- collision ---------- */
const HUB_NO_BLOCK = new Set(['torii', 'banner', 'reeds', 'flowerring', 'pool', 'plot', 'picnic', 'lilypads', 'fairylights', 'glowshrooms', 'windchime']);   // things you walk through or onto
function hubSolids() {
  if (hub.solids) return hub.solids;
  const S = [];
  HUB.buildings.forEach(b => { const g = hubGeoFor(b), w = g.w || b.w || 80, d = g.d || b.d || 50; S.push({ x: b.x - w / 2, y: b.y - d, w, h: d, b }); });
  HUB.props.forEach(p => { const g = hubGeoFor(p); if (g.w > 0 && g.d > 0 && !g.walk && !HUB_NO_BLOCK.has(p.kind)) S.push({ x: p.x - g.w / 2, y: p.y - g.d, w: g.w, h: g.d, p }); });
  const land = hubLandEntities();
  if (land) land.forEach(e => { if (e.w > 0 && e.d > 0) S.push({ x: e.x - e.w / 2, y: e.y - e.d, w: e.w, h: e.d }); });
  else { HUB.trees.forEach(([x, y]) => S.push({ x: x - 12, y: y - 12, w: 24, h: 14 })); HUB.shrubs.forEach(([x, y, s]) => S.push({ x: x - 10 * s, y: y - 8, w: 20 * s, h: 10 })); HUB.rocks.forEach(([x, y, s]) => S.push({ x: x - 12 * s, y: y - 10, w: 24 * s, h: 12 })); }
  hub.solids = S; hub.grid = null;
  return S;
}
function hubBlockedAt(x, y) {
  if (x < 20 || x > HUB.W - 20 || y < 60 || y > HUB.H - 20) return true;
  for (const r of hubSolids()) if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true;
  for (const e of hub.dyn) if (e.solid && e.w > 0 && e.d > 0 && x > e.x - e.w / 2 && x < e.x + e.w / 2 && y > e.y - e.d && y < e.y) return true;
  return false;
}
/* can a walker at level lv stand at (x, y)? walls are implicit: a terrace at another level, unless on a ramp */
function hubWalkable(x, y, lv, ramp) {
  if (hubBlockedAt(x, y)) return false;
  const T = hubTerrain(x, y);
  if (T.water) return false;
  // a ramp is a slope: you can step between it and the ground only where the two heights nearly meet (its ends), never
  // off its sides halfway up
  if (T.ramp) return ramp ? true : Math.abs(hubLiftAt(x, y) - hubLiftOf(lv || 0)) <= HUB_STEP;
  return ramp ? Math.abs(hubLiftAt(x, y, T.lv) - hubRampLift(ramp, x, y)) <= HUB_STEP : T.lv === (lv || 0);
}
function hubRampLift(r, x, y) { const u = clamp(r.ns ? (y - r.y) / r.h : (x - r.x) / r.w, 0, 1); return hubLiftOf(r.lvA) * (1 - u) + hubLiftOf(r.lvB) * u; }
/* move with a slide along walls, as the old town did; the walker's level follows the ground it steps onto */
function hubMove(e, dx, dy) {
  let ok = false;
  if (hubWalkable(e.x + dx, e.y + dy, e.lv, e.ramp)) { e.x += dx; e.y += dy; ok = true; }
  else if (dx && hubWalkable(e.x + dx, e.y, e.lv, e.ramp)) { e.x += dx; ok = true; }
  else if (dy && hubWalkable(e.x, e.y + dy, e.lv, e.ramp)) { e.y += dy; ok = true; }
  if (ok) { const r = hubRampAt(e.x, e.y); e.ramp = r; if (!r) e.lv = hubTerraceLv(e.x, e.y); }
  return ok;
}
/* a straight walk from a to b at level lv: the level at the end, or null if a wall or water is in the way */
function hubSegOk(ax, ay, lv, bx, by) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / 4));
  let L = lv, R = hubRampAt(ax, ay);
  for (let i = 1; i <= n; i++) { const x = ax + (bx - ax) * i / n, y = ay + (by - ay) * i / n; if (!hubWalkable(x, y, L, R)) return null; R = hubRampAt(x, y); if (!R) L = hubTerraceLv(x, y); }
  return L;
}
/* ---------- the walk grid: tap-to-go finds a way round buildings, cliffs and the river ---------- */
function hubGrid() {
  if (hub.grid) return hub.grid;
  const cw = Math.ceil(HUB.W / HUB_CELL), ch = Math.ceil(HUB.H / HUB_CELL), lv = new Int8Array(cw * ch), lift = new Float32Array(cw * ch);   // -2 blocked, -1 ramp, else level; and the ground's height
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const x = (i + 0.5) * HUB_CELL, y = (j + 0.5) * HUB_CELL;
    if (hubBlockedAt(x, y)) { lv[j * cw + i] = -2; continue; }
    const T = hubTerrain(x, y); lv[j * cw + i] = T.water ? -2 : T.ramp ? -1 : T.lv; lift[j * cw + i] = T.ramp ? hubRampLift(T.ramp, x, y) : hubLiftOf(T.lv);
  }
  hub.grid = { cw, ch, lv, lift };
  return hub.grid;
}
const hubCellOk = (G, a, b) => { const A = G.lv[a], B = G.lv[b]; return A !== -2 && B !== -2 && (A === B || ((A === -1 || B === -1) && Math.abs(G.lift[a] - G.lift[b]) <= HUB_STEP)); };
function hubNearestCell(G, x, y) {
  const ci = clamp(Math.floor(x / HUB_CELL), 0, G.cw - 1), cj = clamp(Math.floor(y / HUB_CELL), 0, G.ch - 1);
  if (G.lv[cj * G.cw + ci] !== -2) return cj * G.cw + ci;
  for (let r = 1; r <= 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= G.cw || j >= G.ch) continue; if (G.lv[j * G.cw + i] !== -2) return j * G.cw + i; }
  return -1;
}
function hubFindPath(x0, y0, x1, y1) {
  const G = hubGrid(), s = hubNearestCell(G, x0, y0), g = hubNearestCell(G, x1, y1);
  if (s < 0 || g < 0) return null;
  if (s === g) return [[x1, y1]];
  const N = G.cw * G.ch, cw = G.cw, gs = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const gi = g % cw, gj = (g / cw) | 0, h = n => { const di = Math.abs(n % cw - gi), dj = Math.abs(((n / cw) | 0) - gj); return Math.max(di, dj) + 0.41 * Math.min(di, dj); };
  const heap = [], push = (f, n) => { heap.push([f, n]); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  gs[s] = 0; push(h(s), s);
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41]];
  let found = false, steps = 0;
  while (heap.length && steps++ < 20000) {
    const [, n] = pop(); if (closed[n]) continue; closed[n] = 1;
    if (n === g) { found = true; break; }
    const i = n % cw, j = (n / cw) | 0;
    for (const [di, dj, cost] of DIRS) {
      const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= cw || nj >= G.ch) continue;
      const m = nj * cw + ni; if (closed[m] || !hubCellOk(G, n, m)) continue;
      if (di && dj && !(hubCellOk(G, n, n + di) && hubCellOk(G, n, n + dj * cw))) continue;   // (no cutting corners)
      const ng = gs[n] + cost; if (ng < gs[m]) { gs[m] = ng; from[m] = n; push(ng + h(m), m); }
    }
  }
  if (!found) return null;
  const cells = []; for (let n = g; n >= 0; n = from[n]) cells.push(n); cells.reverse();
  const pts = cells.map(n => [(n % cw + 0.5) * HUB_CELL, (((n / cw) | 0) + 0.5) * HUB_CELL]);
  pts.push([x1, y1]);
  return pts;
}
/* fewer corners: skip ahead along the path wherever a straight walk is clear */
function hubSmoothPath(x, y, lv, pts) {
  const out = []; let cx = x, cy = y, cl = lv, i = 0;
  while (i < pts.length) {
    let best = i, bl = cl;
    for (let j = Math.min(pts.length - 1, i + 12); j > i; j--) { const L = hubSegOk(cx, cy, cl, pts[j][0], pts[j][1]); if (L != null) { best = j; bl = L; break; } }
    if (best === i) { const L = hubSegOk(cx, cy, cl, pts[i][0], pts[i][1]); bl = L != null ? L : cl; }
    out.push(pts[best]); cx = pts[best][0]; cy = pts[best][1]; cl = bl; i = best + 1;
  }
  return out;
}

/* ---------- the entities: what the kits give us, or plain stand-ins ---------- */
const hubGeoCache = new Map();
function hubGeoFor(entry) {
  let g = hubGeoCache.get(entry);
  const geo = globalThis.HubGeo;
  if (g && g.src === (geo || 'fb')) return g;
  g = null;
  if (geo && typeof geo.make === 'function') { try { g = geo.make(entry); } catch (e) { g = null; } }
  if (!g) g = hubFallbackGeo(entry);
  if (!g.door && entry.door) g.door = entry.door.slice();
  if (!(g.w > 0)) g.w = entry.w || 40; if (!(g.d > 0)) g.d = entry.d || 24; if (!(g.top > 0)) g.top = Math.max(60, g.w * 0.8);
  g.src = geo || 'fb';
  hubGeoCache.set(entry, g);
  return g;
}
const HUB_FB_COL = { cottage: '#F2D9B0', shed: '#C9A070', dojo: '#D9574A', shrine: '#E9E4F7', altar: '#CFC3EE', kitchen: '#F6C98B', stall: '#FFE6C8', workshop: '#B7906A', gate: '#8E8798', riftgate: '#B9A3F2', hangar: '#DCEBFF', hedge: '#3E8F4E', dome: '#4E3F8F', mine: '#6B6478', tent: '#F2C98A', gym: '#FFE9A8' };
const HUB_ROOF = { cottage: '#C8553D', shed: '#8A6A3A', dojo: '#3A2F55', shrine: '#8C7BE0', altar: '#8C7BE0', kitchen: '#D9823F', stall: '#E84C6A', workshop: '#6E5A48', gate: '#4A4458', riftgate: '#7154C9', hangar: '#4F8FD6', hedge: '#2E6B3A', dome: '#8C7BE0', mine: '#4A4458', tent: '#D9483B', gym: '#6CC15A' };
const HUB_PROP_SZ = { bigtree: [70, 30, 190], fountain: [110, 60, 70], bench: [44, 16, 26], lanternpost: [12, 8, 90], well: [50, 30, 60], woodpile: [50, 24, 30], flowerbed: [60, 26, 18], trellis: [50, 10, 70], cart: [60, 30, 40], scarecrow: [14, 8, 70], dummy: [20, 12, 60], banner: [10, 8, 110], rack: [50, 14, 50], crystal: [26, 16, 70], pool: [90, 50, 10], torii: [90, 10, 110], cookpot: [36, 24, 44], crates: [44, 28, 36], baskets: [44, 24, 24], workbench: [60, 26, 36], anvil: [30, 16, 28], lumber: [60, 26, 26], picnic: [70, 36, 30], reeds: [40, 10, 44], rocks: [50, 26, 26], telescope: [20, 12, 60], flowerring: [80, 40, 14], readingbench: [50, 18, 30], plot: [90, 70, 24], greenhouse: [220, 120, 120] };
function hubFallbackGeo(entry) {
  const k = entry.kind, isB = !!HUB_FB_COL[k], sz = HUB_PROP_SZ[k] || [30, 16, 30];
  const w = entry.w || (isB ? 120 : sz[0]), d = entry.d || (isB ? 80 : sz[1]), top = isB ? Math.round(w * 0.55 + d * 0.4) : sz[2];
  const col = entry.color || HUB_FB_COL[k] || '#C9D8A0', roof = HUB_ROOF[k] || '#6E5A48';
  return { w, d, top, door: entry.door ? entry.door.slice() : null, walk: k === 'plot' || k === 'pool' || k === 'flowerring' || k === 'reeds',
    draw(c, X, Y, k2, t, o) {
      const f = o && o.fade != null ? o.fade : 1, W2 = w * k2, D2 = d * k2, H2 = (top - d * 0.5) * k2;
      c.save(); c.globalAlpha = f;
      // the footprint as a slab, then the body and a roof
      c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(X, Y - D2 * 0.3, W2 * 0.55, D2 * 0.45, 0, 0, 6.283); c.fill();
      if (isB) {
        c.fillStyle = col; c.strokeStyle = '#2B2433'; c.lineWidth = 2; c.beginPath(); c.rect(X - W2 / 2, Y - D2 * 0.5 - H2 * 0.55, W2, H2 * 0.55 + D2 * 0.5); c.fill(); c.stroke();
        c.fillStyle = roof; c.beginPath(); c.moveTo(X - W2 / 2 - 6 * k2, Y - D2 * 0.5 - H2 * 0.55); c.lineTo(X, Y - D2 * 0.5 - H2); c.lineTo(X + W2 / 2 + 6 * k2, Y - D2 * 0.5 - H2 * 0.55); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#5A3A22'; c.fillRect(X - 9 * k2, Y - D2 * 0.5 - 26 * k2, 18 * k2, 26 * k2);
      } else {
        c.fillStyle = col; c.strokeStyle = '#2B2433'; c.lineWidth = 1.5; GFX.rr(c, X - W2 / 2, Y - D2 * 0.5 - H2, W2, H2 + D2 * 0.5, 4 * k2); c.fill(); c.stroke();
        if (k === 'plot' && o) { c.fillStyle = o.wet ? '#5A3E2B' : '#8A6A48'; c.fillRect(X - W2 / 2 + 2, Y - D2 - 2, W2 - 4, D2); if (o.stage >= 0) { c.fillStyle = ['#9BD37A', '#6CC15A', '#4E9A4A', '#FFB347'][Math.min(3, o.stage)]; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(X - W2 / 3 + i * W2 / 3, Y - D2 / 2, (4 + o.stage * 3) * k2, 0, 6.283); c.fill(); } } }
      }
      c.fillStyle = '#2B2433'; c.font = `800 ${Math.round(10 * k2)}px system-ui, sans-serif`; c.textAlign = 'center'; c.fillText(k, X, Y - D2 * 0.5 - H2 * (isB ? 0.25 : 0.4));
      c.restore();
    } };
}
const HUB_TREE_SZ = { oak: [70, 110], pine: [56, 130], cherry: [64, 96], willow: [80, 110] };
function hubFallbackLand() {
  const E = [];
  HUB.trees.forEach(([x, y, kind, s]) => { const [cw, ch] = HUB_TREE_SZ[kind] || [60, 100]; E.push({ x, y, w: 24, d: 14, top: ch * s, lv: hubTerraceLv(x, y), kind, draw(c, X, Y, k, t, o) { const f = o && o.fade != null ? o.fade : 1; c.save(); c.globalAlpha = f; c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(X, Y, cw * s * 0.45 * k, 10 * k, 0, 0, 6.283); c.fill(); c.fillStyle = '#6E4B2A'; c.fillRect(X - 6 * s * k, Y - ch * s * 0.5 * k, 12 * s * k, ch * s * 0.5 * k); c.fillStyle = kind === 'cherry' ? '#F7B6D2' : kind === 'pine' ? '#2F7A4A' : kind === 'willow' ? '#8FC46A' : '#4E9A4A'; c.strokeStyle = '#2B2433'; c.lineWidth = 2; const sw = Math.sin(t * 1.1 + x) * 3 * k; if (kind === 'pine') { c.beginPath(); c.moveTo(X - cw * s * 0.5 * k, Y - ch * s * 0.35 * k); c.lineTo(X + sw, Y - ch * s * k); c.lineTo(X + cw * s * 0.5 * k, Y - ch * s * 0.35 * k); c.closePath(); c.fill(); c.stroke(); } else { c.beginPath(); c.ellipse(X + sw, Y - ch * s * 0.68 * k, cw * s * 0.5 * k, ch * s * 0.36 * k, 0, 0, 6.283); c.fill(); c.stroke(); } c.restore(); } }); });
  HUB.shrubs.forEach(([x, y, s]) => E.push({ x, y, w: 20 * s, d: 10, top: 26 * s, lv: hubTerraceLv(x, y), kind: 'shrub', draw(c, X, Y, k, t, o) { c.save(); c.globalAlpha = o && o.fade != null ? o.fade : 1; c.fillStyle = '#5DB36E'; c.strokeStyle = '#2B2433'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(X, Y - 12 * s * k, 16 * s * k, 13 * s * k, 0, 0, 6.283); c.fill(); c.stroke(); c.restore(); } }));
  HUB.rocks.forEach(([x, y, s]) => E.push({ x, y, w: 24 * s, d: 12, top: 20 * s, lv: hubTerraceLv(x, y), kind: 'rock', draw(c, X, Y, k, t, o) { c.save(); c.globalAlpha = o && o.fade != null ? o.fade : 1; c.fillStyle = '#9A9AA8'; c.strokeStyle = '#2B2433'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(X, Y - 8 * s * k, 14 * s * k, 10 * s * k, 0, 0, 6.283); c.fill(); c.stroke(); c.restore(); } }));
  return E;
}
function hubLandEntities() {
  const land = globalThis.HubLand;
  if (land && typeof land.entities === 'function') { if (!hub.landE || hub.landSrc !== land) { try { hub.landE = land.entities() || []; } catch (e) { hub.landE = []; } hub.landSrc = land; hub.landE.forEach(e => { if (e.lv == null) e.lv = hubTerraceLv(e.x, e.y); }); } return hub.landE; }
  return null;
}
/* the static entity list: buildings, props, landscape; remade when a kit appears */
function hubStatics() {
  const K = hubKits(), sig = (K.geo ? 'g' : '-') + (K.land ? 'l' : '-');
  if (hub.statics && hub.staticsSig === sig) return hub.statics;
  const E = [];
  const add = (entry, kindTag) => { const g = hubGeoFor(entry); E.push({ entry, g, x: entry.x, y: entry.y, w: g.w, d: g.d, top: g.top, lv: hubTerraceLv(entry.x, entry.y), lift: hubLiftAt(entry.x, entry.y), kind: entry.kind, tag: kindTag, id: entry.id, draw: (c, X, Y, k, t, o) => g.draw(c, X, Y, k, t, o) }); };
  HUB.buildings.forEach(b => add(b, 'building'));
  HUB.props.forEach(p => add(p, 'prop'));
  const land = hubLandEntities() || hubFallbackLand();
  land.forEach(e => { if (e.lift == null) e.lift = hubLiftAt(e.x, e.y, e.lv); e.tag = e.tag || 'land'; E.push(e); });
  hub.statics = E; hub.staticsSig = sig; hub.solids = null; hub.grid = null;
  return E;
}

/* ---------- the ground without the landscape kit: flat green, the paths, the terraces, the river ---------- */
function hubFallbackGround(c, cam, k, W, H) {
  const S = 0.5;
  if (!hub.fbGround) {
    const cv = document.createElement('canvas'); cv.width = Math.round(HUB.W * S); cv.height = Math.round(HUB.H * S);
    const g = cv.getContext('2d'); g.scale(S, S);
    g.fillStyle = '#6FB35E'; g.fillRect(0, 0, HUB.W, HUB.H);
    for (let i = 0; i < 240; i++) { const R = mulberry32(i + 7)(); g.fillStyle = i % 2 ? 'rgba(90,160,70,.35)' : 'rgba(150,210,110,.3)'; g.beginPath(); g.ellipse((i * 467) % HUB.W, (i * 311) % HUB.H, 30 + R * 60, 14 + R * 30, 0, 0, 6.283); g.fill(); }
    // terraces: the dark face where the raised top ends, then the lifted top itself
    HUB.terraces.forEach(T => { const L = hubLiftOf(T.lv); g.fillStyle = '#6B6A5A'; g.beginPath(); T.poly.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.fillStyle = T.lv === 2 ? '#9BD07A' : '#86C46C'; g.strokeStyle = '#4F7A3E'; g.lineWidth = 3; g.beginPath(); T.poly.forEach(([x, y], i) => i ? g.lineTo(x, y - L) : g.moveTo(x, y - L)); g.closePath(); g.fill(); g.stroke(); });
    hubRampList().forEach(r => { const la = hubLiftOf(r.lvA), lb = hubLiftOf(r.lvB); const gr = r.ns ? g.createLinearGradient(0, r.y - la, 0, r.y + r.h - lb) : g.createLinearGradient(r.x - 0, r.y - la, r.x + r.w, r.y - lb); gr.addColorStop(0, '#D9C49A'); gr.addColorStop(1, '#B89A6A'); g.fillStyle = gr; g.strokeStyle = '#6E5A48'; g.lineWidth = 2; g.beginPath(); if (r.ns) { g.moveTo(r.x, r.y - la); g.lineTo(r.x + r.w, r.y - la); g.lineTo(r.x + r.w, r.y + r.h - lb); g.lineTo(r.x, r.y + r.h - lb); } else { g.moveTo(r.x, r.y - la); g.lineTo(r.x + r.w, r.y - lb); g.lineTo(r.x + r.w, r.y + r.h - lb); g.lineTo(r.x, r.y + r.h - la); } g.closePath(); g.fill(); g.stroke(); });
    HUB.paths.forEach(P => { g.strokeStyle = P.kind === 'dirt' ? '#C9A46E' : '#D8CDB8'; g.lineWidth = P.w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); P.pts.forEach(([x, y], i) => { const yy = y - hubLiftAt(x, y); i ? g.lineTo(x, yy) : g.moveTo(x, yy); }); g.stroke(); });
    g.strokeStyle = '#3F8FD1'; g.lineWidth = HUB.river.w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); HUB.river.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    g.strokeStyle = '#7FC6F2'; g.lineWidth = HUB.river.w * 0.5; g.stroke();
    HUB.bridges.forEach(b => { g.fillStyle = '#A9784A'; g.strokeStyle = '#5A3A22'; g.lineWidth = 3; g.fillRect(b.x, b.y, b.w, b.h); g.strokeRect(b.x, b.y, b.w, b.h); });
    const D = HUB.dock; g.fillStyle = '#B98A57'; g.fillRect(D.x, D.y, D.w, D.h);
    g.fillStyle = '#B98A57'; HUB.plots.forEach(([x, y]) => g.fillRect(x - 45, y - 70, 90, 70));
    hub.fbGround = cv;
  }
  c.save(); c.imageSmoothingEnabled = true;
  c.drawImage(hub.fbGround, 0, 0, hub.fbGround.width, hub.fbGround.height, (0 - cam.x) * k + W / 2, (0 - cam.y) * k + H / 2, HUB.W * k, HUB.H * k);
  c.restore();
}

/* ---------- the hub state ---------- */
function hubInit() {
  if (hub) return hub;
  if (!st.hub || typeof st.hub !== 'object') st.hub = { x: HUB.spawn.x, y: HUB.spawn.y, lv: 0, inside: false };
  const h = st.hub;
  hub = { t: 0, last: 0, W: 390, H: 700, dpr: 1, k: 1, cam: { x: h.x, y: h.y - 60 }, pet: { x: h.x, y: h.y, lv: h.lv || 0, face: 1, walk: 0, bob: 0, z: 0, zv: 0, ramp: null }, goal: null, path: null, pending: null, trail: [],
    followers: [], sprites: new Map(), keys: {}, dust: [], hearts: [], ping: null, stick: null, near: null, nearKey: '', dashT: 0, dashCd: 0, emote: null, emoteI: 0, stillT: 0, moving: false, wasMoving: false,
    dyn: [], bubbles: {}, places: null, placesT: 0, promptOv: {}, doorArmed: true, mapOn: false, dest: null, onReturn: [], paused: false, facInit: false, msAvg: 0, msMax: 0, frames: 0, bot: 0, partySig: '', partyT: 0 };
  if (!hubWalkable(hub.pet.x, hub.pet.y, hub.pet.lv)) { hub.pet.x = HUB.spawn.x; hub.pet.y = HUB.spawn.y; hub.pet.lv = 0; }
  hubStatics();
  hubSyncParty(true);
  hubSpritesFor(st);
  const F = globalThis.HubFacilities;
  if (F && typeof F.init === 'function' && !hub.facInit) { hub.facInit = true; try { F.init(hubCore); } catch (e) { if (globalThis.__errbox) __errbox('Town facilities failed to start: ' + (e && e.message)); } }
  return hub;
}
/* a pet's pictures: whole first, then its parts (the rig the Tower walks it with, made once per form and kept) */
function hubSpritesFor(p) {
  const key = (p.uid || 'me') + ':' + (p.stage || 1);
  if (hub.sprites.has(key)) return hub.sprites.get(key);
  hub.sprites.set(key, null);
  try { loadSprites(formOf(p)).then(S => { if (!hub) return; S.rig = null; hub.sprites.set(key, S); if (typeof loadRig === 'function') loadRig(S.form).then(r => { S.rig = r; }, () => {}); }); } catch (e) {}
  return null;
}
/* a walker's body each frame: its wings beat (faster on the move), it blinks now and then, a jump stretches it on the
   way up and squashes it on landing, a dash leans it into the run */
function hubAnimWalker(e, dt, moving) {
  e.mv = moving; e.wph = (e.wph || 0) + dt * (moving ? 9 : 3.4);
  e.blinkT = (e.blinkT == null ? rand(1.5, 4) : e.blinkT) - dt;   // (the eyes are shut while it is between 0 and -0.13)
  if (e.blinkT <= -0.13) e.blinkT = rand(2.5, 5.5);
  e.sq = (e.sq || 0) * Math.max(0, 1 - dt * 9);
  e.lean = (e.lean || 0) + (((e === hub.pet && hub.dashT > 0) ? -e.face * 0.2 : 0) - (e.lean || 0)) * Math.min(1, dt * 12);
}
function hubSyncParty(force) {
  const party = partyPets(), sig = party.map(p => p.uid || 'me').join(',');
  if (!force && sig === hub.partySig) return;
  hub.partySig = sig;
  const old = new Map(hub.followers.map(f => [f.p.uid, f]));
  hub.followers = party.slice(1).map((p, i) => old.get(p.uid) || { p, x: hub.pet.x - 30 * (i + 1), y: hub.pet.y + 8 * (i + 1), lv: hub.pet.lv, face: 1, walk: 0, bob: 0, z: 0, idle: null, idleT: rand(6, 12), stuck: 0 });
  hub.followers.forEach(f => { if (!hubWalkable(f.x, f.y, f.lv)) { f.x = hub.pet.x; f.y = hub.pet.y; f.lv = hub.pet.lv; } hubSpritesFor(f.p); });
}
function hubLayout() {
  if (!hub) return;
  const r = hubWrap.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  hub.W = Math.max(200, Math.round(r.width)); hub.H = Math.max(200, Math.round(r.height)); hub.dpr = dpr;
  if (hubCv.width !== Math.round(hub.W * dpr) || hubCv.height !== Math.round(hub.H * dpr)) { hubCv.width = Math.round(hub.W * dpr); hubCv.height = Math.round(hub.H * dpr); }
  hubCv.style.width = hub.W + 'px'; hubCv.style.height = hub.H + 'px';
  hub.k = clamp(1 + (hub.W - 390) / 600, 1, 1.3);
  const dr = dockEl.getBoundingClientRect(); hub.bot = dr.height ? Math.round(dr.top - r.top) : hub.H - 80;
  hubUi.style.bottom = (hub.H - hub.bot + 170) + 'px';
  { const R = hubMiniRect(); document.body.style.setProperty('--hub-mm-bottom', (R.y + R.h) + 'px'); }   // (the anima orb moves below the mini-map while in town)
}
/* ---------- screen flow ---------- */
function enterHub(quiet) {
  if (!st || !running) return;
  hubInit();
  if (!hubOn) { closeTray(); if (decorating) exitDecor(); if (act) endActivity(true); if (homeMode) setHomeMode(false); }
  hubOn = true; document.body.classList.add('in-hub'); hubWrap.hidden = false; outsideBtn.hidden = true;
  st.hub.inside = false;
  hubLayout(); hub.last = 0; hub.stillT = 0; hub.doorArmed = false; hub.goal = null;
  if (!hub.warm && globalThis.HubLand && typeof HubLand.prewarm === 'function') { hub.warm = 1; try { hubC.setTransform(hub.dpr, 0, 0, hub.dpr, 0, 0); HubLand.prewarm(hubC, hub.cam, hub.k, hub.W, hub.H); } catch (e) {} } hub.path = null; hub.pending = null; hub.stick = null; hub.keys = {};
  hubSyncParty(true);
  updateHint();
  if (!quiet) { sfx.pop(); saveSoon(); }
}
function enterHouse(quiet) {
  if (!st) return;
  const was = hubOn;
  hubOn = false; document.body.classList.remove('in-hub'); hubWrap.hidden = true; outsideBtn.hidden = !hub;
  if (hub) { st.hub.inside = true; hub.goal = null; hub.path = null; hub.pending = null; hub.stick = null; hub.keys = {}; hubPrompt(null); }
  if (was) { lastStatAt = Date.now(); layout(); updateHint(); if (!quiet) { sfx.pop(); saveSoon(); } }
}
/* the start of a session: the town, unless the save left the player indoors */
function hubBoot(fresh) {
  if (!st) return;
  if (!st.hub || typeof st.hub !== 'object') st.hub = { x: HUB.spawn.x, y: HUB.spawn.y, lv: 0, inside: false };
  if (st.hub.inside && !fresh) { hubInit(); enterHouse(true); } else enterHub(true);
}
const hubActive = () => hubOn && !!hub;
/* the mini-game houses open the old town's stage list for their world */
function hubOpenStage(key) {
  const b = TOWN_BUILDINGS.find(x => x.key === key); if (!b) return;
  openMap(); setMapTab('world', true); townBuildingCard(b);
}
/* the facilities file's handle on the town */
const hubCore = {
  pet: () => ({ x: hub.pet.x, y: hub.pet.y, lv: hub.pet.lv }),
  party: () => hub.followers.map(f => ({ p: f.p, x: f.x, y: f.y, lv: f.lv })),
  toast: (m, ms) => toast(m, ms),
  prompt: (id, on) => { if (on == null) delete hub.promptOv[id]; else hub.promptOv[id] = !!on; hub.nearKey = ''; },
  teleport: (x, y) => { hub.pet.x = x; hub.pet.y = y; hub.pet.ramp = hubRampAt(x, y); if (!hub.pet.ramp) hub.pet.lv = hubTerraceLv(x, y); hub.goal = null; hub.path = null; hub.trail = []; hub.followers.forEach((f, i) => { f.x = x - 30 * (i + 1); f.y = y + 8 * (i + 1); f.lv = hub.pet.lv; f.idle = null; }); hub.cam.x = x; hub.cam.y = y - 60; },
  openHouse: () => enterHouse(),
  openOverlay: fn => { hub.goal = null; hub.path = null; hubPrompt(null); try { fn(); } catch (e) { if (globalThis.__errbox) __errbox('A town place failed to open: ' + (e && e.message)); } },
  onReturn: cb => { if (typeof cb === 'function') hub.onReturn.push(cb); },
  emitHearts: (x, y, n) => { for (let i = 0; i < (n || 3); i++) hub.hearts.push({ x: x + rand(-12, 12), y: y - rand(0, 10), vy: -rand(26, 44), vx: rand(-8, 8), life: 1.2, max: 1.2, s: rand(0.8, 1.2) }); },
  say: (npcId, line, dur) => { hub.bubbles[npcId] = { line: String(line), t: dur || 3.2, max: dur || 3.2 }; },
  addEntity: e => { if (e && !hub.dyn.includes(e)) { if (e.lv == null) e.lv = hubTerraceLv(e.x, e.y); hub.dyn.push(e); } },
  removeEntity: e => { const i = hub.dyn.indexOf(e); if (i >= 0) hub.dyn.splice(i, 1); },
  blockers: () => hubSolids().map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h })),
  walkable: (x, y, lv) => hubWalkable(x, y, lv == null ? hubTerraceLv(x, y) : lv),
  openStage: key => hubOpenStage(key),
  goTo: (x, y, pending) => hubGoTo(x, y, pending),
  lift: (x, y, lv) => hubLiftAt(x, y, lv),
  terrain: (x, y) => hubTerrain(x, y),
};

/* ---------- places: what can be used, where ---------- */
const HUB_FB_PROMPT = { cottage: ['door', 'Go inside'], shed: ['leaf', 'Tool shed'], dojo: ['sword', 'Train'], altar: ['gem', 'Evolution altar'], shrineL: ['gem', 'Fusion shrine'], shrineR: ['gem', 'Anima shrine'], kitchen: ['pot', 'Kitchen'], stallA: ['coin', 'Stall'], stallB: ['coin', 'Stall'], stallC: ['coin', 'Stall'], stallD: ['coin', 'Shop'], workshop: ['hammer', 'Workshop'], gate: ['gate', 'To the Tower'], riftgate: ['gate', 'To the Rifts'] };
function hubFallbackPlaces() {
  return HUB.buildings.filter(b => b.door).map(b => {
    const [x, y] = b.door, pr = HUB_FB_PROMPT[b.id] || ['door', b.kind], tb = b.game ? TOWN_BUILDINGS.find(t => t.key === b.game) : null;
    const open = () => {
      if (b.id === 'cottage') enterHouse();
      else if (b.game) hubOpenStage(b.game);
      else if (b.id === 'gate') { openMap(); setMapTab('dungeon', true); }
      else if (b.id === 'riftgate') { openMap(); setMapTab('rift', true); }
      else if (b.id === 'dojo') openTeam();
      else if (b.id === 'altar' && typeof openLaboratory === 'function') openLaboratory();
      else if (b.id === 'shrineL' && typeof openFusion === 'function') openFusion();
      else if (b.id === 'shrineR' && typeof openAnimas === 'function') openAnimas();
      else if (b.id === 'stallD' && typeof openShop === 'function') openShop();
      else if (b.id === 'workshop') openMansion();
      else toast(`The ${b.kind} is still being built.`);
    };
    return { id: b.id, x, y, r: 48, lv: hubTerraceLv(x, y), icon: tb ? 'game' : pr[0], prompt: () => tb ? `Enter ${tb.title}` : pr[1], open, door: true };
  });
}
function hubPlaces() {
  const F = globalThis.HubFacilities;
  if (hub.places && hub.t - hub.placesT < 0.5) return hub.places;
  hub.placesT = hub.t;
  let P = null;
  if (F && typeof F.places === 'function') { try { P = F.places(); } catch (e) { P = null; } }
  hub.places = Array.isArray(P) ? P : hubFallbackPlaces();
  return hub.places;
}
const HUB_PROMPT_ICON = { door: ICON.door, leaf: ICON.leaf, pot: ICON.bowl, sword: ICON.sword, gem: ICON.crystal, coin: ICON.coin, hammer: ICON.wrench, star: ICON.star, gate: ICON.map, game: ICON.play };
function hubNearPlace() {
  const P = hub.pet, L = hubPlaces(); let best = null, bd = 1e9;
  for (const pl of L) {
    if (hub.promptOv[pl.id] === false) continue;
    if (pl.lv != null && pl.lv !== P.lv && !P.ramp) continue;
    const d = Math.hypot(pl.x - P.x, pl.y - P.y), r = pl.r || 48;
    if ((d < r || hub.promptOv[pl.id] === true) && d < bd) { bd = d; best = pl; }
  }
  return best ? { pl: best, d: bd } : null;
}
function hubPrompt(pl, text) {
  const key = pl ? pl.id + '|' + text : '';
  if (key === hub.nearKey) return;
  hub.nearKey = key;
  hubUi.innerHTML = pl ? `<button class="hub-prompt" type="button" data-hp="${esc(pl.id)}">${HUB_PROMPT_ICON[pl.icon] || ICON.door}${esc(text)}</button>` : (st.hub && st.hub.walked ? '' : `<span class="hub-prompt soft">Tap anywhere to walk. Walk up to a door to go in.</span>`);
}
function hubUsePlace(pl) {
  if (!pl) return;
  hub.goal = null; hub.path = null; hub.pending = null; hub.doorArmed = false;
  sfx.boop();
  try { pl.open(); } catch (e) { if (globalThis.__errbox) __errbox('A town place failed to open: ' + (e && e.message), e && e.stack && String(e.stack).split('\n').slice(0, 3).join(' | ')); }
}

/* ---------- movement ---------- */
const hubStickHome = () => ({ x: 76, y: hub.bot - 76 });
const hubBtns = () => ({ jump: { x: hub.W - 60, y: hub.bot - 54, r: 36, label: 'JUMP' }, dash: { x: hub.W - 136, y: hub.bot - 92, r: 28, label: 'DASH' } });   // (jump is the big thumb button in the corner, dash the smaller one above-left of it; emotes are on the keyboard: Q / E)
function hubDash() { if (hub.dashCd > 0 || hub.dashT > 0) return; hub.dashT = 0.32; hub.dashCd = 0.9; if (sfx.whoosh) sfx.whoosh(); for (let i = 0; i < 6; i++) hub.dust.push({ x: hub.pet.x + rand(-8, 8), y: hub.pet.y + rand(-3, 3), lv: hub.pet.lv, life: 0.5, max: 0.5 }); }
function hubJump() { if (hub.pet.z > 0) return; hub.pet.zv = 320; sfx.boop(); }
function hubEmote() { hub.emoteI = (hub.emoteI + 1) % TOWN_EMOTES.length; hub.emote = { kind: TOWN_EMOTES[hub.emoteI], t: 1.6 }; sfx.chirp(); hub.followers.forEach((f, i) => setTimeout(() => { if (hub) f.emote = { kind: TOWN_EMOTES[hub.emoteI], t: 1.4 }; }, 150 + i * 120)); }
function hubStickVec() { const S = hub.stick; if (!S || S.id == null) return null; const dx = S.x - S.ox, dy = S.y - S.oy, d = Math.hypot(dx, dy), dz = TOWN_STICK_R * 0.14; if (d < dz) return [0, 0]; const k = Math.min(1, (d - dz) / (TOWN_STICK_R * 0.7)); return [dx / d * k, dy / d * k]; }
function hubGoTo(x, y, pending, raw) {
  x = clamp(x, 24, HUB.W - 24); y = clamp(y, 64, HUB.H - 24);
  const P = hub.pet, path = hubFindPath(P.x, P.y, x, y);
  hub.path = path ? (raw ? path : hubSmoothPath(P.x, P.y, P.lv, path)) : [[x, y]];
  hub.goal = { x, y }; hub.pending = pending || null; hub.ping = { x, y, lv: hubTerraceLv(x, y), t: 0 }; hub.replans = raw ? (hub.replans || 0) + 1 : 0;
  if (st.hub) st.hub.walked = true;
}
function hubArrive() {
  const p = hub.pending; hub.pending = null; hub.goal = null; hub.path = null;
  if (p && p.open) { hubUsePlace(p); return; }
  const near = hubNearPlace();   // (a walk that ends on a doorstep goes in)
  if (near && near.d < 12 && near.pl.door !== false && (near.pl.icon === 'door' || near.pl.icon === 'game' || near.pl.icon === 'gate' || near.pl.door)) { hub.doorArmed = false; hubUsePlace(near.pl); }
}
function hubUpdatePlayer(dt) {
  const P = hub.pet, K = hub.keys, spd = HUB_SPEED * (hub.dashT > 0 ? 2.3 : 1);
  hub.dashT = Math.max(0, hub.dashT - dt); hub.dashCd = Math.max(0, hub.dashCd - dt);
  if (P.zv || P.z) { P.zv -= 900 * dt; P.z = Math.max(0, P.z + P.zv * dt); if (P.z === 0 && P.zv < 0) { P.zv = 0; P.sq = 1; hub.dust.push({ x: P.x - 8, y: P.y, lv: P.lv, life: 0.4, max: 0.4 }); hub.dust.push({ x: P.x + 8, y: P.y, lv: P.lv, life: 0.4, max: 0.4 }); } }
  if (hub.emote) { hub.emote.t -= dt; if (hub.emote.t <= 0) hub.emote = null; }
  let mx = (K.ArrowRight || K.d || K.D ? 1 : 0) - (K.ArrowLeft || K.a || K.A ? 1 : 0), my = (K.ArrowDown || K.s || K.S ? 1 : 0) - (K.ArrowUp || K.w || K.W ? 1 : 0);
  const sv = hubStickVec(); if (sv && (sv[0] || sv[1])) { mx = sv[0]; my = sv[1]; }
  if (mx || my) { hub.goal = null; hub.path = null; hub.pending = null; const n = Math.hypot(mx, my); if (n > 1) { mx /= n; my /= n; } }
  else if (hub.goal && hub.path) {
    const wp = hub.path[0], dx = wp.x != null ? wp.x - P.x : wp[0] - P.x, dy = wp.y != null ? wp.y - P.y : wp[1] - P.y, d = Math.hypot(dx, dy), last = hub.path.length === 1;
    // (a corner is taken exactly: the next leg was checked from the corner itself, not from a point near it)
    if (d < (last ? 5 : 8)) { if (hubWalkable(P.x + dx, P.y + dy, P.lv, P.ramp)) { P.x += dx; P.y += dy; const r = hubRampAt(P.x, P.y); P.ramp = r; if (!r) P.lv = hubTerraceLv(P.x, P.y); } if (last) hubArrive(); else hub.path.shift(); }
    else { mx = dx / d; my = dy / d; if (last && d < 40) { mx *= d / 40 + 0.3; my *= d / 40 + 0.3; } }
  }
  const moving = !!(mx || my);
  if (moving) {
    const x0 = P.x, y0 = P.y, step = spd * dt; hubMove(P, mx * step, my * step);
    const moved = Math.hypot(P.x - x0, P.y - y0) > step * 0.3;
    // stuck on the way: plan again along the raw grid path (no corner cutting); twice stuck means it is not reachable
    if (!moved) { P.stuck = (P.stuck || 0) + dt; if (hub.goal && P.stuck > 0.35) { P.stuck = 0; if ((hub.replans || 0) < 2) hubGoTo(hub.goal.x, hub.goal.y, hub.pending, true); else hubArrive(); } } else P.stuck = 0;
    if (Math.abs(mx) > 0.2) P.face = mx > 0 ? 1 : -1;
    if (hub.dashT > 0 && Math.random() < dt * 30) hub.dust.push({ x: P.x - P.face * 10, y: P.y, lv: P.lv, life: 0.45, max: 0.45 });
    P.walk += dt * 11; P.bob = Math.abs(Math.sin(P.walk)) * 5;
    if (Math.random() < dt * 8) hub.dust.push({ x: P.x - P.face * 8, y: P.y, lv: P.lv, life: 0.5, max: 0.5 });
    // breadcrumbs for the party
    const T = hub.trail, lastC = T[T.length - 1];
    if (!lastC || Math.hypot(P.x - lastC.x, P.y - lastC.y) >= 10) { T.push({ x: P.x, y: P.y, lv: P.lv }); if (T.length > 90) T.shift(); }
    if (P.x !== x0 || P.y !== y0) { st.hub.x = Math.round(P.x); st.hub.y = Math.round(P.y); st.hub.lv = P.lv; }
    hub.stillT = 0;
  } else { P.walk = 0; P.bob *= 0.8; hub.stillT += dt; }
  hubAnimWalker(P, dt, moving);
  hub.wasMoving = hub.moving; hub.moving = moving;
  if (hub.wasMoving && !moving) saveSoon();
  // the door you walk into (under your own steering, heading at it; a tap-to-go opens its own target on arrival)
  const near = hubNearPlace();
  if (near && near.pl.door !== false && (near.pl.icon === 'door' || near.pl.icon === 'game' || near.pl.icon === 'gate' || near.pl.door) && near.d < 16) {
    const toward = (near.pl.x - P.x) * mx + (near.pl.y - P.y) * my;
    if (moving && !hub.goal && hub.doorArmed && (near.d < 6 || toward > 0)) { hub.doorArmed = false; hubUsePlace(near.pl); return; }
  }
  else if (!near || near.d > 40) hub.doorArmed = true;
  let text = null; if (near) { try { text = near.pl.prompt ? near.pl.prompt() : null; } catch (e) { text = null; } }
  hubPrompt(text ? near.pl : null, text || '');
  hub.near = text ? near.pl : null;
}
/* the party: each follower walks the player's breadcrumb trail a set distance behind; when the player rests they settle,
   wander to something nearby, come over for a cuddle */
function hubTrailPoint(back) {
  const T = hub.trail; if (!T.length) return null;
  let acc = 0; for (let i = T.length - 1; i > 0; i--) { const a = T[i], b = T[i - 1], seg = Math.hypot(a.x - b.x, a.y - b.y); if (acc + seg >= back) { const u = (back - acc) / (seg || 1); return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, lv: a.lv }; } acc += seg; }
  return T[0];
}
function hubSteerMove(f, dx, dy) {
  if (hubMove(f, dx, dy)) return true;
  const d = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx);
  for (const da of [0.785, -0.785, 1.571, -1.571]) { const a = a0 + da; if (hubMove(f, Math.cos(a) * d, Math.sin(a) * d)) return true; }
  return false;
}
const HUB_IDLE_KINDS = { flowerbed: 'sniff', flowerring: 'sniff', fountain: 'watch', pool: 'watch', bench: 'sit', readingbench: 'sit', picnic: 'sit', bigtree: 'curl', reeds: 'watch', well: 'sniff', baskets: 'sniff' };
function hubPickIdleSpot(f) {
  const cands = [];
  for (const e of hubStatics()) { const k = HUB_IDLE_KINDS[e.kind]; if (!k) continue; const d = Math.hypot(e.x - f.x, e.y - f.y); if (d < 220 && d > 24) cands.push({ e, k, d }); }
  if (!cands.length) return null;
  const c = pick(cands), e = c.e;
  for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + rand(-1.1, 1.1), r = (e.w || 30) / 2 + 14 + rand(0, 10), x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r * 0.6; if (hubWalkable(x, y, f.lv) && hubSegOk(f.x, f.y, f.lv, x, y) != null) return { kind: c.k, x, y, spot: e, dur: rand(2, 4), face: e.x > x ? 1 : -1 }; }
  return null;
}
function hubUpdateFollowers(dt) {
  const spd = HUB_SPEED * (hub.dashT > 0 ? 2.3 : 1), P = hub.pet, resting = hub.stillT > 1.5;
  hub.followers.forEach((f, i) => {
    if (f.emote) { f.emote.t -= dt; if (f.emote.t <= 0) f.emote = null; }
    if (f.z || f.zv) { f.zv = (f.zv || 0) - 900 * dt; f.z = Math.max(0, (f.z || 0) + f.zv * dt); if (f.z === 0) { f.zv = 0; f.sq = 1; } }
    { const mvd = Math.hypot(f.x - (f._px != null ? f._px : f.x), f.y - (f._py != null ? f._py : f.y)) > 0.05; f._px = f.x; f._py = f.y; hubAnimWalker(f, dt, mvd); }   // (how it moved last frame)
    const tgt = hubTrailPoint(HUB_FOLLOW_GAP * (i + 1)) || { x: P.x - 40 * (i + 1) * P.face, y: P.y + 6 * (i + 1), lv: P.lv };
    const dT = Math.hypot(tgt.x - f.x, tgt.y - f.y), dP = Math.hypot(P.x - f.x, P.y - f.y);
    // an idle errand: only while the player rests and the follower is near enough
    if (resting && !f.idle && dP < 160) { f.idleT -= dt; if (f.idleT <= 0) { f.idleT = rand(6, 12); if (Math.random() < 0.3) { f.idle = { kind: 'cuddle', x: P.x - P.face * 34, y: P.y + 6, dur: 2.2, go: true }; } else { const s = hubPickIdleSpot(f); if (s) { const F = globalThis.HubFacilities; let act = null; if (F && typeof F.petIdle === 'function') { try { act = F.petIdle(f.p, { kind: s.spot.kind, x: s.spot.x, y: s.spot.y, id: s.spot.id }); } catch (e) { act = null; } } f.idle = Object.assign(s, act && act.kind ? { kind: act.kind, x: act.x != null ? act.x : s.x, y: act.y != null ? act.y : s.y, dur: act.dur || s.dur } : {}, { go: true }); } } } }
    if (!resting && f.idle) f.idle = null;
    if (f.idle) {
      const I = f.idle;
      if (I.go) { const dx = I.x - f.x, dy = I.y - f.y, d = Math.hypot(dx, dy); if (d < 6) { I.go = false; I.t = I.dur; if (I.face) f.face = I.face; if (I.kind === 'cuddle') { f.face = P.x > f.x ? 1 : -1; f.emote = { kind: 'heart', t: 1.6 }; hubCore.emitHearts(f.x, f.y - 50, 2); } if (I.kind === 'curl') f.emote = { kind: 'zzz', t: I.dur }; } else { const mv = Math.min(d, spd * 0.6 * dt); if (!hubSteerMove(f, dx / d * mv, dy / d * mv)) { f.idle = null; } else { f.face = dx > 0 ? 1 : -1; f.walk += dt * 10; f.bob = Math.abs(Math.sin(f.walk)) * 4; } } }
      else { I.t -= dt; f.bob *= 0.8; if (I.t <= 0) f.idle = null; }
      return;
    }
    if (dT > 8 && !(resting && dT < 30)) {
      const k = Math.min(1, (dT - 6) / 24) * spd * dt, dx = tgt.x - f.x, dy = tgt.y - f.y;
      if (hubSteerMove(f, dx / dT * k, dy / dT * k)) { f.stuck = 0; f.face = Math.abs(dx) > 2 ? (dx > 0 ? 1 : -1) : f.face; f.walk += dt * 11; f.bob = Math.abs(Math.sin(f.walk)) * 5; }
      else { f.stuck += dt; if (f.stuck > 2.5 || dP > 420) { f.x = tgt.x; f.y = tgt.y; f.lv = tgt.lv; f.ramp = hubRampAt(f.x, f.y); f.stuck = 0; } }
    } else { f.bob *= 0.8; f.walk = 0; if (resting && dP > 10 && Math.random() < dt * 0.3) f.face = P.x > f.x ? 1 : -1; }
  });
}
function hubUpdateCamera(dt) {
  const P = hub.pet, k = hub.k, vw = hub.W / k, vh = hub.H / k, lift = hubLiftAt(P.x, P.y, P.lv);
  const tx = P.x, ty = P.y - lift - 40, dz = 36, dzy = 28;
  let cx = hub.cam.x, cy = hub.cam.y;
  if (tx > cx + dz) cx = tx - dz; else if (tx < cx - dz) cx = tx + dz;
  if (ty > cy + dzy) cy = ty - dzy; else if (ty < cy - dzy) cy = ty + dzy;
  cx = clamp(cx, vw / 2, HUB.W - vw / 2); cy = clamp(cy, vh / 2 - 60, HUB.H - vh / 2 + 10);
  const a = Math.min(1, dt * 7); hub.cam.x += (cx - hub.cam.x) * a; hub.cam.y += (cy - hub.cam.y) * a;
}
function hubUpdate(dt) {
  hubUpdatePlayer(dt);
  hubUpdateFollowers(dt);
  hubUpdateCamera(dt);
  hub.partyT -= dt; if (hub.partyT <= 0) { hub.partyT = 0.6; hubSyncParty(false); }
  for (let i = hub.dust.length - 1; i >= 0; i--) { hub.dust[i].life -= dt; if (hub.dust[i].life <= 0) hub.dust.splice(i, 1); }
  for (let i = hub.hearts.length - 1; i >= 0; i--) { const h = hub.hearts[i]; h.life -= dt; h.y += h.vy * dt; h.x += h.vx * dt + Math.sin(h.life * 9) * 8 * dt; if (h.life <= 0) hub.hearts.splice(i, 1); }
  for (const id in hub.bubbles) { hub.bubbles[id].t -= dt; if (hub.bubbles[id].t <= 0) delete hub.bubbles[id]; }
  if (hub.dest && Math.hypot(hub.dest.x - hub.pet.x, hub.dest.y - hub.pet.y) < 70) hub.dest = null;
  const F = globalThis.HubFacilities;
  if (F && typeof F.update === 'function') { try { F.update(dt, hub.t); } catch (e) { if (!hub.facErr) { hub.facErr = 1; if (globalThis.__errbox) __errbox('Town facilities update failed: ' + (e && e.message)); } } }
  const land = globalThis.HubLand;
  if (land) {
    if (typeof land.setPets === 'function') { try { land.setPets([{ x: hub.pet.x, y: hub.pet.y, el: petElement(st) }].concat(hub.followers.map(f => ({ x: f.x, y: f.y, el: petElement(f.p) })))); } catch (e) {} }
    if (typeof land.update === 'function') { try { land.update(dt, hub.cam, hub.k, hub.W, hub.H, hub.t, 0.5 + 0.5 * Math.sin(hub.t * 0.3)); } catch (e) { if (!hub.landErr) { hub.landErr = 1; if (globalThis.__errbox) __errbox('Town landscape update failed: ' + (e && e.message)); } } }
  }
}

/* ---------- drawing ---------- */
function hubScreen(x, y, lift) { return [(x - hub.cam.x) * hub.k + hub.W / 2, (y - (lift || 0) - hub.cam.y) * hub.k + hub.H / 2]; }
function hubPetEntity(p, e, me) {
  const lift = hubLiftAt(e.x, e.y, e.lv);
  return { x: e.x, y: e.y, w: 30, d: 12, top: HUB_PET_H + 50, lv: e.lv, lift, kind: 'pet', tag: 'pet', pet: p, walker: e, me, draw: (c, X, Y, k, t) => hubDrawPet(c, p, e, me, X, Y, k, t) };
}
/* a pet in town is drawn as the Tower draws it (drawPetFull): a Celestial six-star over its turning magic circle with
   its lights circling, the shadow and element glow on the ground, the body in parts stepping, swinging its arms,
   beating its wings and breathing when still; happy when fed, petted or emoting, eyes shut for a blink or a doze */
function hubDrawPet(c, p, e, me, X, Y, k, t) {
  const S = hubSpritesFor(p), h = HUB_PET_H * (me ? 1 : 0.92) * k, I = e.idle && !e.idle.go ? e.idle : null, moving = !!e.mv, z = (e.z || 0) * 0.5 * k;
  let sy = 1, sx = 1, rot = e.lean || 0;
  if (I) { if (I.kind === 'sit') sy = 0.86; else if (I.kind === 'curl') { sy = 0.78; sx = 1.08; } else if (I.kind === 'sniff') { rot += (e.face > 0 ? 1 : -1) * 0.22 + Math.sin(t * 6) * 0.05; } else if (I.kind === 'watch') { rot += Math.sin(t * 1.2) * 0.04; } }
  // a jump: stretched going up, squashed landing
  if (e.z > 0) { const u = clamp((e.zv || 0) / 320, -1, 1); sy *= 1 + u * 0.1; sx *= 1 - u * 0.07; }
  const sq = e.sq || 0; sx *= 1 + sq * 0.14; sy *= 1 - sq * 0.12;
  const em = me ? (hub.emote || e.emote) : e.emote, dozing = I && I.kind === 'curl' || (em && em.kind === 'zzz'), blink = e.blinkT != null && e.blinkT <= 0;
  const face = em && em.kind !== 'zzz' ? 'happy' : (dozing || blink) && S && S.rig && S.rig.front && S.rig.front.blink ? 'blink' : 'normal';
  const form = formOf(p), el = petElement(p);
  if (!S) { hubDrawPetStandIn(c, X, Y, h, e.face, sx, sy); return; }
  // the dash leaves two fading copies behind (the plain picture: cheap)
  if (me && hub.dashT > 0) { const fl = petFloatOf(form, h / 1.02, t), yB = Y - z - fl; [[0.3, 14], [0.18, 28]].forEach(([a, ox]) => drawPetSprite(c, X - e.face * ox * k, yB, h, { sprites: S, flip: e.face < 0, face: 'normal', sx, sy, rot, alpha: a })); }
  drawPetFull(c, X, Y, h, { sprites: S, form, t, face, moving, walk: e.walk || 0, wingPh: e.wph || 0, flip: e.face < 0, z, sx, sy, rot, el, rig: true });
  const top = Y - z - petFloatOf(form, h / 1.02, t) - h - (S.rig && S.rig.legW && S.rig.legW.length ? 16 * k : 0);   // (a Legendary's wings rise above its head: the label and emote sit over them)
  if (em) { c.save(); c.translate(X, top - 20 * k); c.scale(k, k); drawEmote(c, 0, 0, em); c.restore(); }
  if (me) { c.font = `800 ${Math.round(12 * k)}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = 'rgba(255,255,255,.9)'; GFX.rr(c, X - 30 * k, top - 24 * k, 60 * k, 18 * k, 9 * k); c.fill(); c.fillStyle = '#2B2433'; c.fillText(p.name, X, top - 11 * k); }
}
function hubDrawPetStandIn(c, X, Y, h, face, sx, sy) {
  c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(X, Y + 2, h * 0.33, h * 0.13, 0, 0, 6.283); c.fill();
  c.save(); c.translate(X, Y); c.scale((face < 0 ? -1 : 1) * sx, sy); c.fillStyle = '#FFB0C8'; c.strokeStyle = '#2B2433'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, -h / 2, h * 0.4, h / 2, 0, 0, 6.283); c.fill(); c.stroke(); c.restore();
}
function hubGatherEntities() {
  const E = hubStatics().slice();
  const F = globalThis.HubFacilities;
  if (F && typeof F.extraEntities === 'function') { let X = null; try { X = F.extraEntities(); } catch (e) { X = null; } if (Array.isArray(X)) for (const e of X) { if (!e) continue; if (e.lv == null) e.lv = hubTerraceLv(e.x, e.y); if (e.lift == null || e._liftFor !== e.y) { e.lift = hubLiftAt(e.x, e.y, e.lv); e._liftFor = e.y; } e.tag = e.tag || 'extra'; E.push(e); } }
  for (const e of hub.dyn) { if (e.lv == null) e.lv = hubTerraceLv(e.x, e.y); e.lift = hubLiftAt(e.x, e.y, e.lv); e.tag = e.tag || 'dyn'; E.push(e); }
  hub.followers.forEach(f => E.push(hubPetEntity(f.p, f, false)));
  E.push(hubPetEntity(st, hub.pet, true));
  return E;
}
function hubDraw(dt) {
  const c = hubC, k = hub.k, W = hub.W, H = hub.H, t = hub.t, dpr = hub.dpr, K = hubKits();
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'medium';
  // the ground
  let groundOk = false;
  if (K.land && typeof K.land.paintGround === 'function') { try { K.land.paintGround(c, hub.cam, k, W, H, t); groundOk = true; } catch (e) { if (!hub.landPaintErr) { hub.landPaintErr = 1; if (globalThis.__errbox) __errbox('Town ground failed to paint: ' + (e && e.message)); } } }
  if (!groundOk) hubFallbackGround(c, hub.cam, k, W, H);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  // the tap ping and the dust lie on the ground
  if (hub.ping) { hub.ping.t += dt; const u = hub.ping.t / 0.6; if (u < 1) { const [X, Y] = hubScreen(hub.ping.x, hub.ping.y, hubLiftAt(hub.ping.x, hub.ping.y)); c.strokeStyle = `rgba(255,255,255,${1 - u})`; c.lineWidth = 2; c.beginPath(); c.ellipse(X, Y, (8 + u * 18) * k, (4 + u * 9) * k, 0, 0, 6.283); c.stroke(); } else hub.ping = null; }
  if (hub.dest) { const [X, Y] = hubScreen(hub.dest.x, hub.dest.y, hubLiftAt(hub.dest.x, hub.dest.y)); const u = (t % 1.2) / 1.2; c.strokeStyle = `rgba(255,228,122,${0.9 - u * 0.8})`; c.lineWidth = 3; c.beginPath(); c.ellipse(X, Y, (10 + u * 30) * k, (5 + u * 15) * k, 0, 0, 6.283); c.stroke(); c.fillStyle = '#FFE37A'; c.beginPath(); c.ellipse(X, Y, 6 * k, 3 * k, 0, 0, 6.283); c.fill(); }
  for (const d of hub.dust) { const [X, Y] = hubScreen(d.x, d.y, hubLiftAt(d.x, d.y, d.lv)); c.fillStyle = `rgba(230,220,190,${d.life / d.max * 0.6})`; c.beginPath(); c.arc(X, Y, (3 + (1 - d.life / d.max) * 5) * k, 0, 6.283); c.fill(); }
  // the entities, back to front, culled to the screen
  const all = hubGatherEntities(), P = hub.pet, pLift = hubLiftAt(P.x, P.y, P.lv), [pX, pY] = hubScreen(P.x, P.y, pLift), pKey = P.y - pLift, pBody = pY - 22 * k;
  const vis = [];
  for (const e of all) {
    const lift = e.lift != null ? e.lift : hubLiftOf(e.lv || 0), X = (e.x - hub.cam.x) * k + W / 2, Y = (e.y - lift - hub.cam.y) * k + H / 2, hw = (e.w || 40) * k * 0.5 + 60, top = (e.top || 80) * k;
    if (X < -hw || X > W + hw || Y < -40 || Y - top > H + 40) continue;
    e._X = X; e._Y = Y; e._key = e.y - lift;   // (depth is the drawn baseline: a lifted terrace thing sorts where it stands on screen)
    vis.push(e);
  }
  vis.sort((a, b) => a._key - b._key || (a.tag === 'pet' ? 1 : 0) - (b.tag === 'pet' ? 1 : 0));
  hub.lastVis = vis;
  const F = globalThis.HubFacilities, flagOf = F && typeof F.flag === 'function' ? id => { try { return !!F.flag(id); } catch (e) { return false; } } : (id => !!(st.hub && st.hub.up && st.hub.up[id]));
  for (const e of vis) {
    let fadeT = 1;
    if (e.tag !== 'pet' && e._key > pKey + 1 && e.top > 40) { const hw = (e.w || 40) * k * 0.5; if (pX > e._X - hw && pX < e._X + hw && pBody > e._Y - (e.top || 80) * k && pBody < e._Y) fadeT = 0.35; }
    if (e._fade == null) e._fade = 1; e._fade += (fadeT - e._fade) * Math.min(1, dt / 0.25);
    const o = e.o || (e._o = e._o || {}); o.fade = e._fade; o.lit = 0; o.flag = e.tag === 'building' ? flagOf(e.id) : false;
    try { e.draw(c, e._X, e._Y, k, t, o); } catch (err) { if (!e._err) { e._err = 1; if (globalThis.__errbox) __errbox('A town thing failed to draw (' + (e.kind || e.tag) + '): ' + (err && err.message)); } }
    const bb = e.id && hub.bubbles[e.id]; if (bb) hubDrawBubble(c, e._X, e._Y - (e.top || 60) * k - 6, bb, k);
  }
  for (const h of hub.hearts) { const [X, Y] = hubScreen(h.x, h.y, hubLiftAt(h.x, h.y)); const a = Math.min(1, h.life / 0.4); c.save(); c.globalAlpha = a; c.translate(X, Y); c.scale(h.s * k, h.s * k); c.fillStyle = '#FF6F59'; c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(-12, -2, -8, -12, 0, -5); c.bezierCurveTo(8, -12, 12, -2, 0, 8); c.fill(); c.restore(); }
  if (K.land && typeof K.land.drawOver === 'function') { try { K.land.drawOver(c, hub.cam, k, W, H, t); } catch (e) { if (!hub.landOverErr) { hub.landOverErr = 1; if (globalThis.__errbox) __errbox('Town air layer failed: ' + (e && e.message)); } } c.setTransform(dpr, 0, 0, dpr, 0, 0); }
  // soft daylight like the old town: a warm key light across the view, cooler toward the far corner
  c.save(); const key = c.createLinearGradient(0, 0, W, H); key.addColorStop(0, 'rgba(255,240,200,.30)'); key.addColorStop(0.55, 'rgba(255,255,255,0)'); key.addColorStop(1, 'rgba(110,140,210,.18)'); c.globalCompositeOperation = 'soft-light'; c.fillStyle = key; c.fillRect(0, 0, W, H); c.restore();
  hubDrawControls(c);
  hubDrawMini(c);
  if (hub.mapOn) hubDrawMap(c);
}
function hubDrawBubble(c, X, Y, bb, k) {
  const a = Math.min(1, bb.t / 0.3, (bb.max - bb.t) / 0.2 + 0.2);
  c.save(); c.globalAlpha = a; c.font = `700 ${Math.round(12 * k)}px system-ui, sans-serif`; c.textAlign = 'center';
  const words = bb.line.split(' '), lines = []; let cur = '';
  for (const w of words) { const tryL = cur ? cur + ' ' + w : w; if (c.measureText(tryL).width > 170 * k && cur) { lines.push(cur); cur = w; } else cur = tryL; } if (cur) lines.push(cur);
  const lh = 15 * k, bw = Math.min(190 * k, Math.max(...lines.map(l => c.measureText(l).width)) + 20 * k), bh = lines.length * lh + 12 * k, bx = clamp(X - bw / 2, 6, hub.W - bw - 6), by = Y - bh - 8 * k;
  c.fillStyle = '#FFFDF8'; c.strokeStyle = '#2B2433'; c.lineWidth = 2; GFX.rr(c, bx, by, bw, bh, 10 * k); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(X - 5 * k, by + bh); c.lineTo(X, by + bh + 7 * k); c.lineTo(X + 5 * k, by + bh); c.fill();
  c.fillStyle = '#2B2433'; lines.forEach((l, i) => c.fillText(l, bx + bw / 2, by + 6 * k + lh * (i + 0.78)));
  c.restore();
}
function hubDrawControls(c) {
  c.save(); c.font = '800 10px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const label = (x, y, s) => { c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(s, x, y); c.fillStyle = '#FFFDF8'; c.fillText(s, x, y); };
  const S = hub.stick, home = hubStickHome(), bx = S ? S.ox : home.x, by = S ? S.oy : home.y;
  c.globalAlpha = S ? 0.9 : 0.5; c.fillStyle = 'rgba(20,16,40,.55)'; c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2.5; c.beginPath(); c.arc(bx, by, TOWN_STICK_R, 0, 6.283); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.35)'; [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(bx + dx * (TOWN_STICK_R - 10) + dy * 5, by + dy * (TOWN_STICK_R - 10) + dx * 5); c.lineTo(bx + dx * (TOWN_STICK_R - 4), by + dy * (TOWN_STICK_R - 4)); c.lineTo(bx + dx * (TOWN_STICK_R - 10) - dy * 5, by + dy * (TOWN_STICK_R - 10) - dx * 5); c.fill(); });
  let kx = bx, ky = by; if (S) { const dx = S.x - S.ox, dy = S.y - S.oy, d = Math.hypot(dx, dy), m = Math.min(d, TOWN_STICK_R * 0.7); if (d > 0) { kx = bx + dx / d * m; ky = by + dy / d * m; } }
  const kg = c.createRadialGradient(kx - 6, ky - 6, 2, kx, ky, 24); kg.addColorStop(0, 'rgba(200,190,230,.95)'); kg.addColorStop(1, 'rgba(90,80,130,.95)'); c.fillStyle = kg; c.beginPath(); c.arc(kx, ky, 24, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.stroke();
  c.globalAlpha = 0.9; label(bx, by + TOWN_STICK_R + 14, 'MOVE');
  const B = hubBtns(), cols = { dash: ['#FF9F43', '#FFE37A'], jump: ['#6CC15A', '#E8FFC2'] };
  for (const k in B) { const b = B[k], fl = hub.btnFlash && hub.btnFlash.k === k ? 1 : 0, cd = k === 'dash' ? hub.dashCd / 0.9 : 0; c.globalAlpha = 0.9; const g = c.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 2, b.x, b.y, b.r); g.addColorStop(0, fl ? '#FFFFFF' : cols[k][1]); g.addColorStop(1, cols[k][0]); c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283); c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = 3; c.stroke();
    if (cd > 0) { c.fillStyle = 'rgba(20,16,40,.45)'; c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + cd * 6.283); c.closePath(); c.fill(); }
    c.fillStyle = '#2B2433'; c.strokeStyle = '#2B2433'; c.lineWidth = 3; c.lineCap = 'round';
    const q = b.r / 32;   // (the glyph scales with the button)
    if (k === 'dash') { c.beginPath(); c.moveTo(b.x - 12 * q, b.y); c.lineTo(b.x + 10 * q, b.y); c.moveTo(b.x + 2 * q, b.y - 8 * q); c.lineTo(b.x + 10 * q, b.y); c.lineTo(b.x + 2 * q, b.y + 8 * q); c.moveTo(b.x - 16 * q, b.y - 7 * q); c.lineTo(b.x - 8 * q, b.y - 7 * q); c.moveTo(b.x - 16 * q, b.y + 7 * q); c.lineTo(b.x - 8 * q, b.y + 7 * q); c.stroke(); }
    else { c.lineWidth = 3.5; c.beginPath(); c.moveTo(b.x - 12 * q, b.y + 9 * q); c.quadraticCurveTo(b.x, b.y - 18 * q, b.x + 12 * q, b.y + 9 * q); c.stroke(); c.beginPath(); c.arc(b.x, b.y - 4 * q, 4.5 * q, 0, 6.283); c.fill(); }
    label(b.x, b.y + b.r + 12, b.label); }
  if (hub.btnFlash) { hub.btnFlash.t -= 0.016; if (hub.btnFlash.t <= 0) hub.btnFlash = null; }
  c.restore();
}
/* ---------- the mini-map: the whole town in the top-right corner under the HUD, always showing; the shape of the land,
   a symbol for every facility, the camera's view, the party as dots; a tap opens the signpost map ---------- */
function hubMiniRect() { const w = Math.round(clamp(hub.W * 0.29, 112, 200)), h = Math.round(w * 86 / 112); return { x: hub.W - 12 - w, y: 100, w, h }; }
const hubMiniHit = (sx, sy) => { const R = hubMiniRect(); return sx >= R.x - 4 && sx <= R.x + R.w + 4 && sy >= R.y - 4 && sy <= R.y + R.h + 4; };
/* the map's inner frame: the scale from world px and the origin, worked out once per size */
function hubMiniGeo(R) { const pad = 5, s = Math.min((R.w - pad * 2) / HUB.W, (R.h - pad * 2) / HUB.H); return { s, ox: R.x + (R.w - HUB.W * s) / 2, oy: R.y + (R.h - HUB.H * s) / 2, pad }; }
const HUB_MINI_SYM = [   // [symbol, world x, world y]
  ['house', 720, 520], ['leaf', 470, 1240], ['sword', 2080, 800], ['gem', 1300, 230], ['coin', 1200, 1460], ['pot', 1500, 1400], ['hammer', 1960, 1400], ['flower', 1250, 1830], ['star', 2330, 280], ['gate', 2560, 1000], ['crystal', 2460, 230],
  ['game', 540, 1560], ['game', 1700, 300], ['game', 860, 300], ['game', 2340, 1420], ['game', 2160, 1880], ['game', 640, 1880] ];
function hubMiniGlyph(c, kind, x, y, r) {
  c.save(); c.translate(x, y); c.lineWidth = Math.max(1, r * 0.3); c.strokeStyle = '#2B2433'; c.lineJoin = 'round'; c.lineCap = 'round';
  const fs = (col, path) => { c.fillStyle = col; c.beginPath(); path(); c.closePath(); c.fill(); c.stroke(); };
  switch (kind) {
    case 'house': fs('#FFFDF8', () => { c.rect(-r * 0.75, -r * 0.1, r * 1.5, r * 1.1); }); fs('#FF8E72', () => { c.moveTo(-r, 0); c.lineTo(0, -r * 1.05); c.lineTo(r, 0); }); break;
    case 'leaf': c.rotate(-0.7); fs('#6CC15A', () => { c.ellipse(0, 0, r * 0.6, r * 1.05, 0, 0, 6.283); }); c.beginPath(); c.moveTo(0, -r * 0.8); c.lineTo(0, r * 0.9); c.stroke(); break;
    case 'sword': c.rotate(0.785); c.lineWidth = Math.max(1.5, r * 0.5); c.strokeStyle = '#2B2433'; c.beginPath(); c.moveTo(0, -r * 1.1); c.lineTo(0, r * 0.9); c.stroke(); c.strokeStyle = '#D8DEE8'; c.lineWidth = Math.max(1, r * 0.3); c.beginPath(); c.moveTo(0, -r * 1.05); c.lineTo(0, r * 0.35); c.stroke(); c.strokeStyle = '#FFD447'; c.beginPath(); c.moveTo(-r * 0.6, r * 0.35); c.lineTo(r * 0.6, r * 0.35); c.stroke(); break;
    case 'gem': fs('#B9A3F2', () => { c.moveTo(0, -r * 1.05); c.lineTo(r * 0.9, -r * 0.2); c.lineTo(0, r * 1.05); c.lineTo(-r * 0.9, -r * 0.2); }); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(0, -r * 0.8); c.lineTo(r * 0.45, -r * 0.25); c.lineTo(-r * 0.45, -r * 0.25); c.closePath(); c.fill(); break;
    case 'coin': fs('#FFD447', () => { c.arc(0, 0, r * 0.95, 0, 6.283); }); c.fillStyle = '#B7860B'; c.beginPath(); c.arc(0, 0, r * 0.45, 0, 6.283); c.fill(); break;
    case 'pot': fs('#F2B13C', () => { c.moveTo(-r * 0.9, -r * 0.45); c.lineTo(r * 0.9, -r * 0.45); c.lineTo(r * 0.7, r * 0.8); c.lineTo(-r * 0.7, r * 0.8); }); c.fillStyle = '#2B2433'; c.fillRect(-r * 1.05, -r * 0.7, r * 2.1, Math.max(1, r * 0.3)); break;
    case 'hammer': c.lineWidth = Math.max(1.5, r * 0.4); c.beginPath(); c.moveTo(0, -r * 0.3); c.lineTo(0, r * 1.05); c.stroke(); fs('#B7906A', () => { c.rect(-r * 0.95, -r * 1.0, r * 1.9, r * 0.85); }); break;
    case 'flower': for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; fs('#FF9BD2', () => { c.arc(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, r * 0.45, 0, 6.283); }); } fs('#FFE37A', () => { c.arc(0, 0, r * 0.4, 0, 6.283); }); break;
    case 'star': fs('#FFE37A', () => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r * 1.1; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } }); break;
    case 'gate': fs('#8E8798', () => { c.moveTo(-r * 0.95, r); c.lineTo(-r * 0.95, -r * 0.2); c.arc(0, -r * 0.2, r * 0.95, Math.PI, 0); c.lineTo(r * 0.95, r); c.lineTo(r * 0.45, r); c.lineTo(r * 0.45, -r * 0.1); c.arc(0, -r * 0.1, r * 0.45, 0, Math.PI, true); c.lineTo(-r * 0.45, r); }); break;
    case 'crystal': fs('#8FE3F0', () => { c.moveTo(0, -r * 1.15); c.lineTo(r * 0.6, -r * 0.3); c.lineTo(r * 0.4, r * 0.95); c.lineTo(-r * 0.4, r * 0.95); c.lineTo(-r * 0.6, -r * 0.3); }); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(0, -r * 0.9); c.lineTo(r * 0.3, -r * 0.3); c.lineTo(-r * 0.15, -r * 0.3); c.closePath(); c.fill(); break;
    default: fs('#FFFDF8', () => { GFX.rr(c, -r * 0.85, -r * 0.85, r * 1.7, r * 1.7, r * 0.4); }); c.fillStyle = '#2B2433'; [[-0.38, -0.38], [0.38, 0.38], [0.38, -0.38], [-0.38, 0.38]].forEach(([a, b]) => { c.beginPath(); c.arc(a * r, b * r, Math.max(0.7, r * 0.2), 0, 6.283); c.fill(); }); break;
  }
  c.restore();
}
/* the still picture: the panel, the land, the river, the plaza ring and the symbols, made once per size */
function hubMiniPicture(R) {
  const dpr = hub.dpr, key = R.w + 'x' + R.h + '@' + dpr;
  if (hub.miniCv && hub.miniKey === key) return hub.miniCv;
  const cv = hub.miniCv || document.createElement('canvas'); cv.width = Math.round((R.w + 8) * dpr); cv.height = Math.round((R.h + 8) * dpr);
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, R.w + 8, R.h + 8); c.translate(4 - R.x, 4 - R.y);
  const G = hubMiniGeo(R), s = G.s, ox = G.ox, oy = G.oy, P = (x, y) => [ox + x * s, oy + y * s];
  c.fillStyle = 'rgba(20,16,40,.58)'; GFX.rr(c, R.x, R.y, R.w, R.h, 12); c.fill();
  c.save(); GFX.rr(c, R.x + G.pad, R.y + G.pad, R.w - G.pad * 2, R.h - G.pad * 2, 8); c.clip();
  c.fillStyle = '#5FA653'; c.fillRect(R.x, R.y, R.w, R.h);
  // the ground inside the world, the terraces a shade lighter the higher they stand
  c.fillStyle = '#74B962'; c.fillRect(ox, oy, HUB.W * s, HUB.H * s);
  HUB.terraces.forEach(T => { c.fillStyle = T.lv === 2 ? '#A9DB8E' : '#8FCB78'; c.beginPath(); T.poly.forEach(([x, y], i) => { const [X, Y] = P(x, y); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); c.fill(); });
  // the plaza ring, the paths, the river with its bridges
  { const [X, Y] = P(1300, 1000); c.fillStyle = '#F0D3CF'; c.beginPath(); c.arc(X, Y, 210 * s, 0, 6.283); c.fill(); c.strokeStyle = '#E39DAA'; c.lineWidth = Math.max(1, 26 * s); c.beginPath(); c.arc(X, Y, 150 * s, 0, 6.283); c.stroke(); }
  c.strokeStyle = 'rgba(240,226,200,.7)'; c.lineCap = 'round'; c.lineJoin = 'round'; HUB.paths.forEach(Pp => { c.lineWidth = Math.max(1, Pp.w * s * 0.8); c.beginPath(); Pp.pts.forEach(([x, y], i) => { const [X, Y] = P(x, y); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); });
  c.strokeStyle = '#4FA8F0'; c.lineWidth = Math.max(2, HUB.river.w * s); c.beginPath(); HUB.river.pts.forEach(([x, y], i) => { const [X, Y] = P(x, y); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.stroke();
  HUB.bridges.forEach(b => { const [X, Y] = P(b.x, b.y); c.fillStyle = '#B98A57'; c.fillRect(X, Y, Math.max(2, b.w * s), Math.max(2, b.h * s)); });
  // the symbols
  const r = Math.max(2.6, 3.4 * R.w / 112);
  HUB_MINI_SYM.forEach(([kind, x, y]) => { const [X, Y] = P(x, y); hubMiniGlyph(c, kind, X, Y, kind === 'game' ? r * 0.8 : r); });
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.5; GFX.rr(c, R.x, R.y, R.w, R.h, 12); c.stroke();
  hub.miniCv = cv; hub.miniKey = key; hub.miniGeo = G;
  return cv;
}
function hubDrawMini(c) {
  const R = hubMiniRect(), cv = hubMiniPicture(R), G = hub.miniGeo, s = G.s;
  c.save(); c.globalAlpha = hub.mapOn ? 0.5 : 0.92;
  c.drawImage(cv, R.x - 4, R.y - 4, R.w + 8, R.h + 8);
  // the camera's view, kept inside the frame
  const x0 = Math.max(R.x + G.pad, G.ox + (hub.cam.x - hub.W / hub.k / 2) * s), x1 = Math.min(R.x + R.w - G.pad, G.ox + (hub.cam.x + hub.W / hub.k / 2) * s), y0 = Math.max(R.y + G.pad, G.oy + (hub.cam.y - hub.bot / hub.k / 2) * s), y1 = Math.min(R.y + R.h - G.pad, G.oy + (hub.cam.y + hub.bot / hub.k / 2) * s);
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1; c.strokeRect(Math.round(x0) + 0.5, Math.round(y0) + 0.5, Math.round(x1 - x0), Math.round(y1 - y0));
  // the party as tiny dots in their element's colour, the player a white dot with a soft pulse
  const dot = (x, y, rr, col) => { c.fillStyle = col; c.strokeStyle = '#2B2433'; c.lineWidth = 1; c.beginPath(); c.arc(G.ox + x * s, G.oy + y * s, rr, 0, 6.283); c.fill(); c.stroke(); };
  hub.followers.forEach(f => { let col = '#FFE37A'; try { col = E8[petElement(f.p)].color; } catch (e) {} dot(f.x, f.y, 2, col); });
  if (hub.dest) dot(hub.dest.x, hub.dest.y, 2.5, '#FFE37A');
  { const px = G.ox + hub.pet.x * s, py = G.oy + hub.pet.y * s, pu = 0.5 + 0.5 * Math.sin(hub.t * 4); c.fillStyle = `rgba(255,255,255,${0.25 * pu})`; c.beginPath(); c.arc(px, py, 5 + pu * 3, 0, 6.283); c.fill(); dot(hub.pet.x, hub.pet.y, 3, '#FFFFFF'); }
  c.restore();
}
/* the signpost map: the districts, where you are, and a tap sets a destination marker */
function hubMapRect() { const w = Math.min(hub.W - 24, 330), h = Math.round(w * HUB.H / HUB.W) + 44; return { x: (hub.W - w) / 2, y: Math.max(130, (hub.bot - h) / 2 - 20), w, h, s: (w - 20) / HUB.W }; }
function hubDrawMap(c) {
  const R = hubMapRect(), s = R.s, ox = R.x + 10, oy = R.y + 34;
  c.save(); c.globalAlpha = 0.96; c.fillStyle = '#FFFDF8'; c.strokeStyle = '#2B2433'; c.lineWidth = 3; GFX.rr(c, R.x, R.y, R.w, R.h, 16); c.fill(); c.stroke();
  c.fillStyle = '#2B2433'; c.font = '800 14px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('Cocopets Town', R.x + 14, R.y + 18); c.textAlign = 'right'; c.font = '700 11px system-ui, sans-serif'; c.fillStyle = '#7A7290'; c.fillText('tap a place · M closes', R.x + R.w - 14, R.y + 18);
  c.fillStyle = '#A9DB8E'; c.fillRect(ox, oy, HUB.W * s, HUB.H * s);
  HUB.terraces.forEach(T => { c.fillStyle = T.lv === 2 ? '#CDEBB0' : '#BEE3A0'; c.beginPath(); T.poly.forEach(([x, y], i) => i ? c.lineTo(ox + x * s, oy + y * s) : c.moveTo(ox + x * s, oy + y * s)); c.closePath(); c.fill(); });
  c.strokeStyle = '#E8DCC4'; c.lineCap = 'round'; HUB.paths.forEach(P => { c.lineWidth = Math.max(2, P.w * s); c.beginPath(); P.pts.forEach(([x, y], i) => i ? c.lineTo(ox + x * s, oy + y * s) : c.moveTo(ox + x * s, oy + y * s)); c.stroke(); });
  c.strokeStyle = '#5FB0E8'; c.lineWidth = Math.max(3, HUB.river.w * s); c.beginPath(); HUB.river.pts.forEach(([x, y], i) => i ? c.lineTo(ox + x * s, oy + y * s) : c.moveTo(ox + x * s, oy + y * s)); c.stroke();
  HUB.buildings.forEach(b => { c.fillStyle = HUB_ROOF[b.kind] || '#8A6A3A'; c.fillRect(ox + (b.x - b.w / 2) * s, oy + (b.y - b.d) * s, Math.max(3, b.w * s), Math.max(3, b.d * s)); });
  c.font = '800 10px system-ui, sans-serif'; c.textAlign = 'center';
  for (const id in HUB.districts) { const D = HUB.districts[id], X = ox + D.x * s, Y = oy + D.y * s; c.fillStyle = 'rgba(255,253,248,.85)'; GFX.rr(c, X - 34, Y - 8, 68, 16, 8); c.fill(); c.fillStyle = '#2B2433'; c.fillText(D.name.length > 14 ? D.name.split(' ')[0] : D.name, X, Y); }
  if (hub.dest) { c.fillStyle = '#FFE37A'; c.strokeStyle = '#2B2433'; c.lineWidth = 2; c.beginPath(); c.arc(ox + hub.dest.x * s, oy + hub.dest.y * s, 6, 0, 6.283); c.fill(); c.stroke(); }
  const px = ox + hub.pet.x * s, py = oy + hub.pet.y * s, pu = 0.5 + 0.5 * Math.sin(hub.t * 5);
  c.fillStyle = `rgba(255,111,89,${0.3 * pu})`; c.beginPath(); c.arc(px, py, 10 + pu * 4, 0, 6.283); c.fill(); c.fillStyle = '#FF6F59'; c.strokeStyle = '#2B2433'; c.lineWidth = 2; c.beginPath(); c.arc(px, py, 5, 0, 6.283); c.fill(); c.stroke();
  c.restore();
}
function hubMapTap(sx, sy) {
  const R = hubMapRect();
  if (sx < R.x || sx > R.x + R.w || sy < R.y || sy > R.y + R.h) { hub.mapOn = false; return true; }
  const wx = (sx - R.x - 10) / R.s, wy = (sy - R.y - 34) / R.s; let best = null, bd = 1e9;
  for (const id in HUB.districts) { const D = HUB.districts[id], d = Math.hypot(D.x - wx, D.y - wy); if (d < bd) { bd = d; best = D; } }
  if (best && bd < 260) { hub.dest = { x: best.x, y: best.y, name: best.name }; hub.mapOn = false; toast(`${best.name}: follow the marker`); sfx.boop(); hubGoTo(best.x, best.y, null); }
  return true;
}

/* ---------- the frame, driven from the game loop while the town is showing ---------- */
function hubFrame(dt) {
  if (!hub || !hubOn) return;
  const t0 = performance.now();
  if (hubWrap.hidden) hubWrap.hidden = false;
  if (hub.W !== Math.round(hubWrap.clientWidth) && hubWrap.clientWidth) hubLayout();
  const overlay = !sheetWrap.hidden || !$('#labOvl').hidden || !$('#widgetOvl').hidden || !$('#giftWrap').hidden || !$('#resultWrap').hidden || !$('#evoWrap').hidden;
  // back from something that covered the town (a sheet, the map, the mansion, a game, the house): tell the facilities
  const gap = hub.lastFrameAt && t0 - hub.lastFrameAt > 400; hub.lastFrameAt = t0;
  if (overlay !== hub.paused || (gap && !overlay)) { hub.paused = overlay; if (!overlay) { hub.keys = {}; hub.stick = null; hub.places = null; hub.nearKey = ''; hubSyncParty(false); hub.onReturn.forEach(cb => { try { cb(); } catch (e) {} }); } }
  hub.t += dt;
  if (!overlay) hubUpdate(dt);
  // (under the Team sheet's live stage the town, paused anyway, is drawn once a second: the phone is the stage's, 21d)
  if (overlay && typeof tsBusy === 'function' && tsBusy() && t0 - (hub.drawnAt || 0) < 1000) return;
  hub.drawnAt = t0;
  hubDraw(dt);
  const ms = performance.now() - t0; hub.msAvg = hub.msAvg ? hub.msAvg * 0.95 + ms * 0.05 : ms; if (ms > hub.msMax) hub.msMax = ms; hub.frames++;
}
/* resuming after an overlay the game opened over the town (the map, the mansion, the arcade): the frame loop skips the
   town while they are open; when they close it comes back on its own */

/* ---------- input ---------- */
function hubWorldAt(ev) { const r = hubCv.getBoundingClientRect(); return { sx: ev.clientX - r.left, sy: ev.clientY - r.top }; }
function hubUnproject(sx, sy) { return { x: (sx - hub.W / 2) / hub.k + hub.cam.x, y: (sy - hub.H / 2) / hub.k + hub.cam.y }; }
/* what a tap on the picture hits: the front-most thing whose drawing covers the point */
function hubHitEntity(sx, sy) {
  let best = null;
  for (const e of hub.lastVis || []) { if (e._X == null) continue; const k = hub.k, hw = (e.w || 40) * k * 0.5 + 6; if (sx > e._X - hw && sx < e._X + hw && sy > e._Y - (e.top || 60) * k && sy < e._Y + 6) { if (!best || e._key > best._key) best = e; } }
  return best;
}
hubCv.addEventListener('pointerdown', ev => {
  if (!hub || !hubOn || hub.paused) return;
  sfx.unlock();
  const { sx, sy } = hubWorldAt(ev);
  if (hub.mapOn) { hubMapTap(sx, sy); return; }
  if (hubMiniHit(sx, sy)) { hub.mapOn = true; sfx.boop(); return; }
  const B = hubBtns(); for (const k in B) { const b = B[k]; if (Math.hypot(sx - b.x, sy - b.y) < b.r + 8) { if (k === 'dash') hubDash(); else hubJump(); hub.btnFlash = { k, t: 0.2 }; return; } }
  const hm = hubStickHome(); if (Math.hypot(sx - hm.x, sy - hm.y) < 120 && (hub.stick == null || hub.stick.id == null)) { hub.stick = { id: ev.pointerId, ox: sx, oy: sy, x: sx, y: sy }; try { hubCv.setPointerCapture(ev.pointerId); } catch (e) {} hub.goal = null; hub.path = null; hub.pending = null; if (st.hub) st.hub.walked = true; return; }
  if (st.hub) st.hub.walked = true;
  const w = hubUnproject(sx, sy), hit = hubHitEntity(sx, sy);
  if (hit && hit.tag === 'pet') { hubPetTap(hit); return; }
  // a place close to the tap (a door, a stall, a plot, a scenic spot) → walk there and use it
  const places = hubPlaces(); let pl = null, bd = 1e9;
  const probe = hit && hit.tag !== 'pet' ? { x: hit.x, y: hit.y + 6, r: (hit.w || 40) / 2 + 50 } : { x: w.x, y: w.y, r: 56 };
  for (const q of places) { let txt = null; try { txt = q.prompt ? q.prompt() : null; } catch (e) {} if (!txt) continue; const d = Math.hypot(q.x - probe.x, q.y - probe.y); if (d < probe.r && d < bd) { bd = d; pl = q; } }
  if (pl) { if (Math.hypot(pl.x - hub.pet.x, pl.y - hub.pet.y) < (pl.r || 48) * 0.6 && (pl.lv == null || pl.lv === hub.pet.lv)) hubUsePlace(pl); else hubGoTo(pl.x, pl.y, pl); return; }
  if (hit && hit.tag !== 'pet') { hubGoTo(hit.x, hit.y + (hit.d || 10) + 12, null); return; }
  // plain ground: the lift under the tap is unknown until we know what terrace it falls on; try the levels top down
  let target = null; for (const L of [2, 1, 0]) { const yy = w.y + hubLiftOf(L); if (hubTerraceLv(w.x, yy) === L || (L === 0 && !target)) { target = { x: w.x, y: yy }; if (L) break; } }
  hubGoTo(target.x, target.y, null);
});
hubCv.addEventListener('pointermove', ev => { if (!hub || !hub.stick || hub.stick.id !== ev.pointerId) return; const { sx, sy } = hubWorldAt(ev); hub.stick.x = sx; hub.stick.y = sy; });
const hubStickEnd = ev => { if (hub && hub.stick && hub.stick.id === ev.pointerId) { hub.stick = null; saveSoon(); } };
hubCv.addEventListener('pointerup', hubStickEnd); hubCv.addEventListener('pointercancel', hubStickEnd);
hubCv.addEventListener('contextmenu', e => e.preventDefault());
function hubPetTap(ent) {
  const F = globalThis.HubFacilities, p = ent.pet;
  if (F && typeof F.onPet === 'function') { try { F.onPet(p); return; } catch (e) {} }
  hubCore.emitHearts(ent.walker.x, ent.walker.y - 40, 3); st.joy = Math.min(100, st.joy + 2); sfx.chirp(); ent.walker.emote = { kind: 'heart', t: 1.4 }; if (ent.me) hub.emote = { kind: 'heart', t: 1.4 };
}
document.addEventListener('keydown', e => {
  if (!hub || !hubOn || hub.paused || mapOpen || arc.open || mansionOpen || !trayEl.hidden) return;
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) { hub.keys[e.key] = true; e.preventDefault(); if (st.hub) st.hub.walked = true; return; }
  if (e.key === 'Shift') hubDash();
  else if (e.key === ' ') { hubJump(); e.preventDefault(); }
  else if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') { if (hub.near) { hubUsePlace(hub.near); e.preventDefault(); } else if (e.key !== 'Enter') hubEmote(); }
  else if (e.key === 'q' || e.key === 'Q') hubEmote();
  else if (e.key === 'm' || e.key === 'M') hub.mapOn = !hub.mapOn;
  else if (e.key === 'Escape' && hub.mapOn) hub.mapOn = false;
});
document.addEventListener('keyup', e => { if (hub) { hub.keys[e.key] = false; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key) && !Object.values(hub.keys).some(Boolean)) saveSoon(); } });
hubUi.addEventListener('click', e => { const b = e.target.closest('[data-hp]'); if (!b || !hub) return; sfx.unlock(); if (hub.near && hub.near.id === b.dataset.hp) hubUsePlace(hub.near); });
hubMapBtn.innerHTML = ICON.map; hubMapBtn.hidden = true;   // (the mini-map in the corner is the map button now; the M key still opens it)
hubMapBtn.addEventListener('click', () => { if (!hub) return; sfx.unlock(); hub.mapOn = !hub.mapOn; });
outsideBtn.innerHTML = ICON.door + '<span>Outside</span>';
outsideBtn.addEventListener('click', () => { sfx.unlock(); enterHub(); });
window.addEventListener('resize', () => { if (hub && hubOn) requestAnimationFrame(hubLayout); });
/* the dock in town: Feed opens the tray and the snack picked goes to the town's feeding; Play is the town's play;
   a care tile (bath, brush) is done indoors, so the house opens first */
dockEl.addEventListener('click', e => {
  if (!hubActive() || !st) return;
  const F = globalThis.HubFacilities, b = e.target.closest('button'); if (!b) return;
  if (b.id === 'btnFeed' && F && typeof F.openFeedTray === 'function') { e.stopPropagation(); e.preventDefault(); sfx.unlock(); if (!trayEl.hidden) { closeTray(); return; } try { F.openFeedTray(); } catch (err) { if (globalThis.__errbox) __errbox('Town feed tray failed: ' + (err && err.message)); } return; }
  if (b.id === 'btnPlay' && F && typeof F.onPlay === 'function') { e.stopPropagation(); e.preventDefault(); sfx.unlock(); closeTray(); try { F.onPlay(); } catch (err) { if (globalThis.__errbox) __errbox('Town play failed: ' + (err && err.message)); } }
}, true);
// (a snack tile drags in the room; in town a tap is enough, so the drag never starts and the click does the feeding)
const hubOwnFeed = () => { const F = globalThis.HubFacilities; return !(F && typeof F.openFeedTray === 'function'); };   // (with the facilities file, 09-ui's hubSnackHook does this)
trayInner.addEventListener('pointerdown', e => { if (hubActive() && hubOwnFeed() && e.target.closest('[data-snack]')) { e.stopPropagation(); sfx.unlock(); } }, true);
trayInner.addEventListener('click', e => {
  if (!hubActive() || !st) return;
  const F = globalThis.HubFacilities;
  const sn = hubOwnFeed() ? e.target.closest('[data-snack]') : null;
  if (sn && F && typeof F.onFeed === 'function') { e.stopPropagation(); e.preventDefault(); const k = sn.dataset.snack; if (sn.getAttribute('aria-disabled') === 'true') return; closeTray(); try { F.onFeed(k); } catch (err) { if (globalThis.__errbox) __errbox('Town feeding failed: ' + (err && err.message)); } return; }
  if (sn) { e.stopPropagation(); e.preventDefault(); const k = sn.dataset.snack; if (sn.getAttribute('aria-disabled') === 'true') return; closeTray(); enterHouse(true); giveSnack(k); return; }
  const care = e.target.closest('[data-care]'), actB = e.target.closest('[data-act]');
  if ((care && care.dataset.care !== 'map' && care.dataset.care !== 'lights') || actB) enterHouse(true);
}, true);
/* a room chosen anywhere (the mansion, the house sheet, a build) means going indoors */
{
  const sw0 = switchRoom; switchRoom = function (i, dir) { sw0(i, dir); if (hubOn && running) enterHouse(true); };
  const er0 = enterRoomFromMansion; enterRoomFromMansion = function (i) { er0(i); if (hubOn && running) enterHouse(); };
}
/* the test hook and other files reach the town through this */
globalThis.HubCore = { HUB, get hub() { return hub; }, get on() { return hubOn; }, enterHub, enterHouse, goTo: hubGoTo, walkable: hubWalkable, terrain: hubTerrain, lift: hubLiftAt, findPath: hubFindPath, places: () => hub ? hubPlaces() : [], api: hubCore, frame: hubFrame, layout: hubLayout, openStage: hubOpenStage, usePlace: hubUsePlace, near: () => hub && hub.near, stats: () => hub ? { avg: hub.msAvg, max: hub.msMax, frames: hub.frames, k: hub.k, W: hub.W, H: hub.H } : null, resetStats: () => { if (hub) { hub.msAvg = 0; hub.msMax = 0; hub.frames = 0; } } };
