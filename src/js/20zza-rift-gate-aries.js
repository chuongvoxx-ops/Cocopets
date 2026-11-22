/* ---------- v435 AG: Gate 00, Aries: The Ramforge (the Blackfire Caldera's Anima gate) ----------
   Beside the Blackfire Caldera, a forge-temple of the ram hangs over the lake of fire: a switchyard of basalt and black iron,
   its floor cut with molten channels, a great crucible on a ram-horned frame at its south end, ram's-head furnaces in its
   north wall either side of a great door. THE EMBER SWITCHYARD: pour the living ember from the crucible and it rolls along
   the channels by itself. Levers set the junctions (the lit tongue on each junction's plate shows which way it points); an
   ember coming into a junction from a side branch always runs on through to its stem. Quench troughs put it out; a channel
   with no way on spills it. Then the levers stay as you set them: pour again. Three yards, each lighting a ram socket on the
   great door's lintel:
     The First Pour   two levers: wake the west furnace.
     The Kindling     three levers and the bellows kiln: the east furnace wakes only for an ember kindled in the kiln.
     The Ram Switch   a ram switch (its horns rock over each time the ember passes it from its stem: an ember can come
                      back through it on a loop and go the other way) and two levers: light both braziers, then feed the
                      ember to the great door itself.
   After three failed pours in a yard the lever to turn next glows (a hint). The third ember runs into the door's socket:
   molten fire climbs its jambs, the ram's eyes wake, the iron bar lifts and the leaves part (heat and embers pour out).
   Beyond waits THE CATACLYSM ALTAR: a platform of hexagonal basalt over the lake, the Aries glyph cut through its heart as
   molten channels inside two rings of fire, iron spokes between them, broken basalt columns on its rim (one with a fire
   basket, one chained), the Aries glyph raised as a monument of two colossal obsidian horns on its north rim, shards of
   basalt held up round it by the updraft; past its edge the lake of fire far below, obsidian spires rising from it, the
   caldera's far wall with its lavafalls, the dying sun on its crest. The background is laid over the stage itself and
   fixed in the world (screen = world - camera, as v428's garden sky): nothing slides with the camera.
   Step through and the door seals behind: Samael, the First Cataclysm, will be fought there (ARIES_BOSS, a later file);
   until it exists a stand-in guardian (the Forge Warden, an ordinary lesser boss in the engine) holds the altar, and
   beating it wins the gate. window.__AG_NOBOSS = 1: Aries wakes as the door seals (the old flow, for tests).
   Pictures: ARIES_PROPS (20zza1-aries-props.js), painted once by the Belfry's shading pass; floors and walls are this file's
   own lands ('agyard': the switchyard, 'agaltar': the altar), painted into the engine's cached ground chunks; the backdrop
   ('agsky') is the gap's. Light (the channels' glow and the ember's molten trail, the ember itself, the crucible's pour, the
   kiln's and the braziers' fire, the furnaces' roar, the quench's steam, the door's sockets and its opening, the altar's
   flowing glyph and rings, the shards' drips, the lavafalls, embers on the air) is drawn on the GPU (NIDHOGG_MOVES.FGFX,
   existing kinds only: no new shader code) where a real GPU draws; elsewhere the pictures and floors stand and the channels,
   the trail and the ember are drawn in 2D. lowFx keeps the light that tells the puzzle and the door.
   CONTRACT WITH THE BOSS (ARIES_BOSS, all optional but begin; the same as the Gate of Taurus's): when the pet crosses into
   the altar the door seals and ARIES_BOSS.begin(X, H, self, A) is called, A = { cx, cy, r, rx, ry, sen, ax0, ay0, ax1, ay1,
   door: { x, y }, inside(x, y), glyph: [[[x, y], ...], ...], rings: [r0, r1], heat(k), arch: { x, y } } (world tiles: the
   altar's centre, its radius (the smaller half axis) and half axes, the rounded square's exponent, its walkable bounds, the
   sealed door's foot; inside(x, y) true on the walkable floor, |dx/rx|^sen + |dy/ry|^sen <= 1; the glyph's channels as
   polylines and the rings' radii, for attacks that run along them; heat(k) sets how hard the floor's molten channels burn,
   0..2 (1 the resting glow; the light follows within a second); the horn monument's foot); then every frame
   ARIES_BOSS.update(dt), drawGround(c), drawOver(c), and cam(), goal(), hideHud(), onBossDeath(m) when asked;
   ARIES_BOSS.stop() when the stage closes. The boss calls X.winStage() itself when Samael falls (21b's gateFinish then marks
   the gate done and unlocks the 'aries' Anima).
   Memory: every picture is given back when the stage closes (ARIES_PROPS.release, through the dungeon game's destroy and
   BEL.onRelease). Test hooks (the stage module): pour(), flip(id), load(n), yard, R, S, geo; window.__AG_BOSS (a boss to stand
   in), __AG_NOBOSS = 1, __AG_GL = 0 (no GPU light). */
(() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const hh = (a, b, s) => { let n = (a * 374761393 + b * 668265263 + (s || 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const md = (a, n) => ((a % n) + n) % n;
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const AP = () => (typeof ARIES_PROPS !== 'undefined' ? ARIES_PROPS : null);
  const fgx = () => { try { if (typeof window !== 'undefined' && (window.__AG_GL === 0 || window.__DUN_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const EMBER = '#FF8A3D', LAVA = '#FF6A1F', LAVA_HI = '#FFC24A', GOLD = '#FFD36B', PALE = '#FFE6C8', WARN = '#FF9BD2', CRIM = '#FF5A3A', INK = '#2B2433';

  /* ======================= the plan (world tiles: a layout cell (i, j) is world tile (i + 1, j + 1)) ======================= */
  const W0 = 31, H0 = 35;
  const AC = { x: 16.5, y: 12.5 }, ARX = 11.2, ARY = 8.0, SEN = 2.6;     // the altar: a rounded square of walkable basalt (22 x 16 tiles)
  const WALLY = 21, DOORX = 16.5, DOORY = 22.0;                          // the wall between, the door's foot (its floor line)
  const se = (u, v) => Math.pow(Math.abs(u), SEN) + Math.pow(Math.abs(v), SEN);
  const spt = a => { const c = Math.cos(a), s = Math.sin(a); return [Math.sign(c) * Math.pow(Math.abs(c), 2 / SEN), Math.sign(s) * Math.pow(Math.abs(s), 2 / SEN)]; };
  const inArena = (x, y) => y <= 20 && se((x + 0.5 - AC.x) / ARX, (y + 0.5 - AC.y) / ARY) <= 1;
  const inChamber = (x, y) => { if (y < 22 || y > 33 || x < 8 || x > 24) return false; return y < 31 || (x >= 8 + (y - 30) && x <= 24 - (y - 30)); };
  // the altar's rim: broken columns (engine props, breakable), clear of the door's side; the horn monument on the north rim
  const RUINS = [-128, -52, -162, -18, 180, 0, 154, 26].map(d => { const a = d * Math.PI / 180, p = spt(a); return [Math.floor(AC.x + p[0] * ARX * 0.86), Math.floor(AC.y + p[1] * ARY * 0.84)]; });
  const ARCH = { x: 16.5, y: 6.0, piers: [[14, 5], [18, 5]] };
  const COLS = [[8, 23], [24, 23], [8, 26], [24, 26], [9, 31], [23, 31]];
  // the yard's fixed pieces: the crucible (its posts solid), the furnaces in the north wall (their blocks solid)
  const CRU = { x: 16.5, y: 32.9 }, FURN = { W: { x: 11.5, y: 23.35 }, E: { x: 21.5, y: 23.35 } };
  const SOLID = [[15, 32], [17, 32], [10, 22], [11, 22], [12, 22], [20, 22], [21, 22], [22, 22], [10, 23], [11, 23], [12, 23], [20, 23], [21, 23], [22, 23]];
  const LAYOUT = (() => { const rows = []; const at = new Map(); const mark = (x, y, ch) => at.set(x + ',' + y, ch);
    RUINS.forEach(([x, y]) => mark(x, y, 'P')); COLS.forEach(([x, y]) => mark(x, y, 'C'));
    mark(16, 21, 'D'); mark(15, 21, 'd'); mark(17, 21, 'd'); mark(16, 12, 'A'); mark(13, 32, 'S');
    for (let j = 0; j < H0; j++) { let s = ''; for (let i = 0; i < W0; i++) { const x = i + 1, y = j + 1, m = at.get(x + ',' + y);
      if (m && (m === 'D' || m === 'd' || inArena(x, y) || inChamber(x, y))) { s += m; continue; }
      if (inArena(x, y) || inChamber(x, y)) { s += '.'; continue; }
      let wall = false; if (y >= WALLY) for (let dy = -1; dy <= 1 && !wall; dy++) for (let dx = -1; dx <= 1; dx++) if (inChamber(x + dx, y + dy)) { wall = true; break; }
      s += wall ? '#' : '~'; } rows.push(s); }
    return rows; })();
  // shards held up round the altar by the updraft (seen past its rim)
  const SHARDS = []; for (let i = 0; i < 12; i++) { const a = -Math.PI * 1.1 + i / 11 * Math.PI * 1.2 + (hh(i, 3) - 0.5) * 0.12; if (Math.abs(a + Math.PI / 2) < 0.3) continue; const k = 1.13 + hh(i, 5) * 0.2, p = spt(a);
    SHARDS.push({ x: AC.x + p[0] * ARX * k, y: AC.y + p[1] * ARY * k, v: i % 3, ph: hh(i, 7) * TAU, s: 0.85 + hh(i, 9) * 0.5, lift: 0.8 + hh(i, 11) * 1.4, dir: i % 2 ? 1 : -1 }); }
  // the altar's heart: two rings of fire and the Aries glyph inside them (its two horns over one stem), as polylines (world tiles)
  const RINGS = [3.0, 5.25];
  const GLYPH = (() => { const out = [], R = 1.02, cy = AC.y - 0.95;
    for (const sd of [-1, 1]) { const pts = [], cx = AC.x + sd * R; for (let i = 0; i <= 20; i++) { const th = Math.PI - i / 20 * Math.PI * 1.32; pts.push([cx + sd * Math.cos(th) * R, cy - Math.sin(th) * R]); } out.push(pts); }
    out.push([[AC.x, cy], [AC.x, AC.y + 0.6], [AC.x, AC.y + 2.15]]); return out; })();
  const ringPts = (r, n) => { n = n || 48; const p = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU; p.push([AC.x + Math.cos(a) * r, AC.y + Math.sin(a) * r]); } return p; };
  const RING_L = RINGS.map(r => ringPts(r, 32));   // (the rings as the GPU light follows them: made once)
  const WALL_Y = 2.3, CLIFF_K = 0.62, SUN = { x: AC.x + 5.5, y: -3.3 };   // (the caldera's far wall: its foot's world y and its scale; the dying sun on its crest)
  const SPIRES = [[2.6, 9.5, 0, 0.9], [0.8, 16.5, 2, 0.75], [3.2, 22.5, 1, 0.8], [30.6, 8.5, 2, 0.85], [32.2, 15.0, 0, 0.7], [29.8, 21.0, 1, 0.9], [4.5, 30.5, 0, 0.75], [28.6, 30.0, 2, 0.7], [12.0, 37.2, 1, 0.65], [22.5, 37.6, 0, 0.6], [-1.5, 4.0, 1, 0.6], [34.5, 2.5, 0, 0.6]];

  /* ======================= the switchyard's three yards ======================= */
  /* nodes: src (the crucible's mouth), sw (a lever's junction: stem + two branches, opts its branches' sides, set its first
     setting, sol the side it must point), ram (a ram switch: as sw, and it rocks over after every pass from its stem), merge
     (two branches into one stem), kiln, braz (pass-through), furn (a furnace, its goal) / door (the great door's socket),
     sink (a quench trough). lv: the lever's offset from its junction. edges: [from, to, [corners between]] */
  const YARDS = [
    { name: 'The First Pour', tip: 'Two levers. Set them, then pour: wake the west furnace', goal: 'W',
      nodes: { S: { k: 'src', x: CRU.x, y: CRU.y }, A: { k: 'sw', x: 16.5, y: 29.0, stem: 'S', opts: ['W', 'E'], set: 1, sol: 0, lv: [0.95, -0.8] }, B: { k: 'sw', x: 11.5, y: 26.5, stem: 'S', opts: ['N', 'W'], set: 1, sol: 0, lv: [0.95, 0.75] },
        F: { k: 'furn', x: FURN.W.x, y: 23.95, fu: 'W' }, Q1: { k: 'sink', x: 8.95, y: 26.5 }, Q2: { k: 'sink', x: 20.5, y: 25.3 } },
      edges: [['S', 'A'], ['A', 'B', [[11.5, 29.0]]], ['A', 'Q2', [[20.5, 29.0]]], ['B', 'F'], ['B', 'Q1']] },
    { name: 'The Kindling', tip: 'The east furnace wakes only for a kindled ember: run it through the bellows kiln', goal: 'E', need: 'kiln',
      nodes: { S: { k: 'src', x: CRU.x, y: CRU.y }, A: { k: 'sw', x: 16.5, y: 29.0, stem: 'S', opts: ['W', 'E'], set: 1, sol: 0, lv: [0.95, -0.8] }, C: { k: 'merge', x: 21.5, y: 25.8, stem: 'N' },
        F: { k: 'furn', x: FURN.E.x, y: 23.95, fu: 'E' }, E: { k: 'sw', x: 12.5, y: 29.0, stem: 'E', opts: ['N', 'W'], set: 1, sol: 0, lv: [-0.9, 0.8] }, Q1: { k: 'sink', x: 9.6, y: 29.0 },
        K: { k: 'kiln', x: 12.5, y: 27.4 }, D: { k: 'sw', x: 12.5, y: 25.8, stem: 'S', opts: ['E', 'W'], set: 1, sol: 0, lv: [0.95, 0.8] }, Q2: { k: 'sink', x: 9.6, y: 25.8 } },
      edges: [['S', 'A'], ['A', 'C', [[21.5, 29.0]]], ['C', 'F'], ['A', 'E'], ['E', 'Q1'], ['E', 'K'], ['K', 'D'], ['D', 'Q2'], ['D', 'C']] },
    { name: 'The Ram Switch', tip: 'The ram switch rocks over each time the ember passes it. Light both braziers, then feed the door', goal: 'D', need: 'braz',
      nodes: { S: { k: 'src', x: CRU.x, y: CRU.y }, Y: { k: 'merge', x: 16.5, y: 29.0, stem: 'N' }, P: { k: 'ram', x: 16.5, y: 27.0, stem: 'S', opts: ['W', 'E'], set: 1, sol: 0, lv: [0.95, -0.85] },
        B1: { k: 'braz', x: 13.75, y: 27.0 }, Z: { k: 'sw', x: 11.0, y: 27.0, stem: 'E', opts: ['N', 'S'], set: 0, sol: 1, lv: [-0.95, 0.75] }, Q1: { k: 'sink', x: 11.0, y: 24.7 },
        B2: { k: 'braz', x: 19.25, y: 27.0 }, Wv: { k: 'sw', x: 22.0, y: 27.0, stem: 'W', opts: ['N', 'S'], set: 1, sol: 0, lv: [0.95, 0.75] }, Q2: { k: 'sink', x: 22.0, y: 29.4 },
        G: { k: 'door', x: DOORX, y: 23.2 } },
      edges: [['S', 'Y'], ['Y', 'P'], ['P', 'B1'], ['B1', 'Z'], ['Z', 'Q1'], ['Z', 'Y', [[11.0, 29.0]]], ['P', 'B2'], ['B2', 'Wv'], ['Wv', 'Q2'], ['Wv', 'G', [[22.0, 25.2], [16.5, 25.2]]]] } ];
  const dirOf = (a, b) => Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]) ? (b[0] > a[0] ? 'E' : 'W') : (b[1] > a[1] ? 'S' : 'N');
  const DV = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }, DNAME = { N: 'north', S: 'south', E: 'east', W: 'west' };
  function buildYard(Y) { const nodes = {}; for (const id in Y.nodes) nodes[id] = Object.assign({ id, arms: {}, cur: Y.nodes[id].set || 0 }, Y.nodes[id]);
    const edges = Y.edges.map(([a, b, via], i) => { const A = nodes[a], B = nodes[b], pts = [[A.x, A.y]].concat(via || [], [[B.x, B.y]]), cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
      const da = dirOf(pts[0], pts[1]), db = dirOf(pts[pts.length - 1], pts[pts.length - 2]); A.arms[da] = i; B.arms[db] = i; return { i, a, b, pts, cum, L: cum[cum.length - 1], da, db }; });
    const path = new Path2D(); for (const e of edges) { path.moveTo(e.pts[0][0], e.pts[0][1]); for (let k = 1; k < e.pts.length; k++) path.lineTo(e.pts[k][0], e.pts[k][1]); }
    return { def: Y, nodes, edges, path, src: Object.values(nodes).find(n => n.k === 'src') }; }
  const at = (e, s) => { const P = e.pts, C = e.cum; s = clamp(s, 0, e.L); let k = 1; while (k < C.length - 1 && C[k] < s) k++; const u = (s - C[k - 1]) / ((C[k] - C[k - 1]) || 1); return [lerp(P[k - 1][0], P[k][0], u), lerp(P[k - 1][1], P[k][1], u)]; };

  /* ======================= the floors (painted into the engine's cached chunks, once) ======================= */
  const blob = (c, p, r, col, a) => { const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.6, `rgba(${col},${a * 0.4})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); };
  // the Aries glyph (two horns over a stem; s its size, centred on the horns' meeting point)
  function glyph(c, x, y, s, col, lw) { c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; for (const sd of [-1, 1]) { c.beginPath(); const cx = x + sd * s * 0.5; if (sd > 0) c.arc(cx, y, s * 0.5, Math.PI, Math.PI * 2.32, false); else c.arc(cx, y, s * 0.5, 0, -Math.PI * 1.32, true); c.stroke(); } c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + s * 1.05); c.stroke(); c.restore(); }
  // a molten channel along world points (painted into the floor): a dark groove, a crusted lip, the molten core
  function channel(c, P, pts, T, w) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); });
    c.strokeStyle = 'rgba(10,5,5,.92)'; c.lineWidth = Math.max(3, T * w); c.stroke(); c.strokeStyle = '#3A1408'; c.lineWidth = Math.max(2, T * w * 0.72); c.stroke();
    c.strokeStyle = '#C8400E'; c.lineWidth = Math.max(1.4, T * w * 0.48); c.stroke(); c.strokeStyle = '#FF8A2E'; c.lineWidth = Math.max(1, T * w * 0.28); c.stroke(); c.strokeStyle = 'rgba(255,224,150,.9)'; c.lineWidth = Math.max(0.6, T * w * 0.1); c.stroke(); c.restore(); }
  const YT = ['#2D2728', '#2A2425', '#302A2B', '#282223', '#2C2526'];
  const edgeOf = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([a, b]) => !inChamber(x + a, y + b) && !(y + b === WALLY && Math.abs(x + a + 0.5 - DOORX) < 1.6));
  /* the switchyard's floor: basalt slabs in courses, soot in their joints and a faint ember seam in a few, iron grates; an
     iron border of riveted plates; before the door an iron threshold with the Aries glyph in gold; warmth by the furnaces
     and the crucible */
  function yardFloor(c, X, Y, T, x, y) {
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T];
    if (!inChamber(x, y) || edgeOf(x, y)) {   // the border: riveted iron plates over basalt
      c.fillStyle = ['#2A2829', '#262425', '#2D2B2C'][Math.floor(hh(x, y, 3) * 3)]; c.fillRect(X, Y, T, T);
      const g = c.createLinearGradient(X, Y, X + T, Y + T); g.addColorStop(0, 'rgba(160,150,160,.16)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = g; c.fillRect(X, Y, T, T);
      c.strokeStyle = 'rgba(8,6,8,.75)'; c.lineWidth = Math.max(1, T * 0.05); c.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1);
      for (const [u, v] of [[0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85]]) { c.fillStyle = '#4C474A'; c.beginPath(); c.arc(X + u * T, Y + v * T, Math.max(1, T * 0.045), 0, TAU); c.fill(); c.fillStyle = 'rgba(255,220,180,.35)'; c.fillRect(X + u * T - T * 0.02, Y + v * T - T * 0.025, Math.max(1, T * 0.02), Math.max(1, T * 0.02)); }
      for (let i = 0; i < 5; i++) { c.fillStyle = `rgba(110,58,34,${(0.1 + hh(x, y, 40 + i) * 0.18).toFixed(2)})`; c.beginPath(); c.arc(X + hh(x, y, 20 + i) * T, Y + hh(x, y, 30 + i) * T, T * (0.05 + hh(x, y, 50 + i) * 0.1), 0, TAU); c.fill(); }
    } else {
      const j = Math.floor(y / 1.5), off = (j % 2) * 0.9, i = Math.floor((x + off) / 1.8), sx = i * 1.8 - off, sy = j * 1.5;
      for (let jj = j - 1; jj <= j + 1; jj++) { const o2 = (md(jj, 2)) * 0.9; for (let ii = Math.floor((x - 2 + o2) / 1.8); ii <= Math.floor((x + 1 + o2) / 1.8); ii++) { const ax = ii * 1.8 - o2, ay = jj * 1.5, a = P(ax, ay);
        c.fillStyle = YT[Math.floor(hh(ii, jj, 5) * YT.length)]; c.fillRect(a[0], a[1], T * 1.8, T * 1.5);
        const g = c.createLinearGradient(a[0], a[1], a[0] + T * 1.8, a[1] + T * 1.5); g.addColorStop(0, 'rgba(190,170,170,.1)'); g.addColorStop(1, 'rgba(0,0,0,.18)'); c.fillStyle = g; c.fillRect(a[0], a[1], T * 1.8, T * 1.5);
        for (let k = 0; k < 4; k++) blob(c, [a[0] + hh(ii, jj, 20 + k) * T * 1.8, a[1] + hh(ii, jj, 30 + k) * T * 1.5], T * (0.3 + hh(ii, jj, 40 + k) * 0.4), hh(ii, jj, 50 + k) < 0.6 ? '8,6,6' : '120,100,100', 0.12);
        c.strokeStyle = 'rgba(8,5,6,.85)'; c.lineWidth = Math.max(1.2, T * 0.06); c.strokeRect(a[0], a[1], T * 1.8, T * 1.5);
        if (hh(ii, jj, 61) < 0.22) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,90,30,.35)'; c.lineWidth = Math.max(0.8, T * 0.03); c.beginPath(); c.moveTo(a[0], a[1] + T * 1.5); c.lineTo(a[0] + T * 1.8, a[1] + T * 1.5); c.stroke(); c.restore(); }
        c.strokeStyle = 'rgba(200,180,170,.12)'; c.lineWidth = Math.max(0.6, T * 0.018); c.beginPath(); c.moveTo(a[0] + 1, a[1] + T * 1.5 - 1); c.lineTo(a[0] + 1, a[1] + 1.5); c.lineTo(a[0] + T * 1.8 - 1, a[1] + 1.5); c.stroke(); } }
      for (let k = 0; k < 14; k++) { const u = hh(x, y, 70 + k), v = hh(x, y, 90 + k), z = hh(x, y, 110 + k); c.fillStyle = z > 0.8 ? 'rgba(150,140,140,.3)' : 'rgba(8,6,6,.45)'; c.fillRect(X + u * T, Y + v * T, Math.max(1, T * 0.025), Math.max(1, T * 0.025)); }
      // iron grates set in the floor here and there (a dark well, glowing faintly beneath)
      if (hh(Math.floor(x / 3), Math.floor(y / 3), 77) < 0.3) { const gx = Math.floor(x / 3) * 3 + 1.5, gy = Math.floor(y / 3) * 3 + 1.5, q = P(gx, gy), w = T * 0.8;
        c.fillStyle = '#0C0809'; c.fillRect(q[0] - w, q[1] - w * 0.7, w * 2, w * 1.4); blob(c, q, w * 1.1, '255,90,30', 0.22); c.strokeStyle = '#3E393C'; c.lineWidth = Math.max(1, T * 0.06); for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(q[0] + k * w / 3.5, q[1] - w * 0.7); c.lineTo(q[0] + k * w / 3.5, q[1] + w * 0.7); c.stroke(); } c.strokeRect(q[0] - w, q[1] - w * 0.7, w * 2, w * 1.4); }
    }
    // the threshold before the door: a half disc of iron, gold-edged, the Aries glyph in gold
    { const R = 2.3, cp = P(DOORX, DOORY); if (Math.hypot(x + 0.5 - DOORX, y + 0.5 - DOORY) < R + 1) {
      c.save(); c.beginPath(); c.arc(cp[0], cp[1], R * T, 0, Math.PI); c.closePath(); const g = c.createRadialGradient(cp[0], cp[1], 0, cp[0], cp[1], R * T); g.addColorStop(0, '#3A3538'); g.addColorStop(1, '#232023'); c.fillStyle = g; c.fill(); c.clip();
      c.strokeStyle = 'rgba(8,6,8,.6)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.arc(cp[0], cp[1], 1.3 * T, 0, Math.PI); c.stroke(); for (let i = 1; i < 6; i++) { const an = i / 6 * Math.PI; c.beginPath(); c.moveTo(cp[0] + Math.cos(an) * 1.3 * T, cp[1] + Math.sin(an) * 1.3 * T); c.lineTo(cp[0] + Math.cos(an) * R * T, cp[1] + Math.sin(an) * R * T); c.stroke(); }
      glyph(c, cp[0], cp[1] + T * 0.55, T * 0.6, '#120D0E', Math.max(2, T * 0.12)); glyph(c, cp[0], cp[1] + T * 0.55, T * 0.6, '#C99A4A', Math.max(1.2, T * 0.06)); c.restore();
      c.strokeStyle = '#C99A4A'; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.arc(cp[0], cp[1], R * T, 0, Math.PI); c.stroke(); } }
    blob(c, P(FURN.W.x, FURN.W.y + 0.6), T * 3.0, '255,110,40', 0.14); blob(c, P(FURN.E.x, FURN.E.y + 0.6), T * 3.0, '255,110,40', 0.14); blob(c, P(CRU.x, CRU.y - 0.3), T * 3.2, '255,120,50', 0.16); blob(c, P(DOORX, DOORY), T * 4.5, '255,120,60', 0.08);
    c.restore(); }
  /* the altar's floor: hexagonal basalt column tops (soot in the joints, ember in a few), obsidian among them; iron spokes
     between the two rings of fire; the Aries glyph cut through its heart, molten; hotter from below toward the rim */
  const HS = 0.82, HSQ = Math.sqrt(3);
  const AT = ['#302829', '#2B2425', '#352D2E', '#282122', '#2E2627'];
  function altarFloor(c, X, Y, T, x, y) {
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip(); c.fillStyle = '#1A1415'; c.fillRect(X, Y, T, T);
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T], dC = Math.hypot(x + 0.5 - AC.x, y + 0.5 - AC.y);
    for (let q = Math.floor((x - 1.5) / (HS * 1.5)); q <= Math.ceil((x + 2.5) / (HS * 1.5)); q++) { const cx = q * HS * 1.5; for (let r = Math.floor((y - 1.5) / (HS * HSQ) - q / 2); r <= Math.ceil((y + 2.5) / (HS * HSQ) - q / 2); r++) { const cy = HS * HSQ * (r + q / 2);
      if (cx < x - 1 || cx > x + 2 || cy < y - 1 || cy > y + 2) continue; const k = hh(q, r, 3), obs = hh(q, r, 9) < 0.1, pts = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; pts.push(P(cx + Math.cos(a) * HS * 0.97, cy + Math.sin(a) * HS * 0.97)); }
      c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = obs ? '#141018' : AT[Math.floor(k * AT.length)]; c.fill();
      const cp = P(cx, cy), g = c.createLinearGradient(cp[0] - HS * T, cp[1] - HS * T, cp[0] + HS * T, cp[1] + HS * T); g.addColorStop(0, obs ? 'rgba(150,120,200,.2)' : 'rgba(200,175,170,.12)'); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.22)'); c.fillStyle = g; c.fill();
      if (!obs) for (let i = 0; i < 3; i++) blob(c, [cp[0] + (hh(q, r, 20 + i) - 0.5) * HS * T, cp[1] + (hh(q, r, 30 + i) - 0.5) * HS * T], T * (0.15 + hh(q, r, 40 + i) * 0.3), '8,5,5', 0.18);
      c.strokeStyle = 'rgba(10,6,7,.9)'; c.lineWidth = Math.max(1.2, T * 0.065); c.stroke();
      if (hh(q, r, 13) < 0.16) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,80,26,.42)'; c.lineWidth = Math.max(0.8, T * 0.035); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke(); c.restore(); }
      c.strokeStyle = 'rgba(210,190,185,.13)'; c.lineWidth = Math.max(0.6, T * 0.02); c.beginPath(); c.moveTo(pts[3][0], pts[3][1]); c.lineTo(pts[4][0], pts[4][1]); c.lineTo(pts[5][0], pts[5][1]); c.stroke(); } }
    for (let k = 0; k < 10; k++) { const u = hh(x * 3 + k, y, 60), v = hh(x, y * 3 + k, 61); c.fillStyle = `rgba(6,4,4,${(0.2 + hh(x, y, 62 + k) * 0.3).toFixed(2)})`; c.fillRect(X + u * T, Y + v * T, Math.max(1, T * 0.022), Math.max(1, T * 0.022)); }
    // the heart: the band between the rings laid in iron (spokes, gold rivets), the rings and the glyph as molten channels
    if (dC < RINGS[1] + 1.4) { const cp = P(AC.x, AC.y);
      if (dC > RINGS[0] - 1 && dC < RINGS[1] + 1) { for (let k = 0; k < 16; k++) { const an = (k + 0.5) / 16 * TAU, a = [cp[0] + Math.cos(an) * (RINGS[0] + 0.35) * T, cp[1] + Math.sin(an) * (RINGS[0] + 0.35) * T], b = [cp[0] + Math.cos(an) * (RINGS[1] - 0.35) * T, cp[1] + Math.sin(an) * (RINGS[1] - 0.35) * T];
          c.strokeStyle = '#0C0809'; c.lineWidth = Math.max(3, T * 0.26); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = '#3E393C'; c.lineWidth = Math.max(2, T * 0.17); c.stroke(); c.strokeStyle = 'rgba(200,190,200,.25)'; c.lineWidth = Math.max(0.6, T * 0.03); c.stroke();
          for (const u of [0.2, 0.5, 0.8]) { const p = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; c.fillStyle = '#C99A4A'; c.beginPath(); c.arc(p[0], p[1], Math.max(1, T * 0.05), 0, TAU); c.fill(); } } }
      for (const r of RINGS) channel(c, P, ringPts(r), T, r === RINGS[1] ? 0.5 : 0.42);
      if (dC < RINGS[0] + 0.6) { c.save(); c.beginPath(); c.arc(cp[0], cp[1], (RINGS[0] - 0.25) * T, 0, TAU); c.clip(); const g = c.createRadialGradient(cp[0], cp[1], 0, cp[0], cp[1], RINGS[0] * T); g.addColorStop(0, 'rgba(255,90,30,.12)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); c.fillStyle = g; c.fillRect(X, Y, T, T); c.restore();
        for (const pts of GLYPH) channel(c, P, pts, T, 0.46); } }
    // hotter from below toward the rim; a dull red wash from the lake on the far side
    { const r = Math.pow(se((x + 0.5 - AC.x) / ARX, (y + 0.5 - AC.y) / ARY), 1 / SEN); if (r > 0.72) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(150,40,12,${(0.16 * clamp((r - 0.72) / 0.28, 0, 1)).toFixed(3)})`; c.fillRect(X, Y, T, T); c.restore(); } }
    c.restore(); }
  /* the altar's edge, laid over each chunk after its floors: what lies outside the rounded square is cut away (the lake
     shows there), then its rim: a lip of basalt, and under its near half the platform's thickness in strata, basalt over
     obsidian, hot from the lake beneath */
  const SEP = []; for (let i = 0; i <= 160; i++) SEP.push(spt(i / 160 * TAU));
  const sePath = (c, T, k, dy, i0, i1, move) => { const sg = i0 <= i1 ? 1 : -1; for (let i = i0; sg > 0 ? i <= i1 : i >= i1; i += sg) { const p = SEP[i], X = (AC.x + p[0] * (ARX - k)) * T, Y = (AC.y + p[1] * (ARY - k) + dy) * T; if (move && i === i0) c.moveTo(X, Y); else c.lineTo(X, Y); } };
  const EDGE = []; for (let y = 0; y <= WALLY; y++) for (let x = 0; x < W0 + 2; x++) { let n = 0; for (const [a, b] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) if (se((a - AC.x) / ARX, (b - AC.y) / ARY) <= 1) n++; if (n > 0 && n < 4 && y < WALLY) EDGE.push([x, y]); }
  function arenaEdge(c, T, d) {
    const x0 = d && d.n ? d.cx * d.n - 1 : -9, x1 = d && d.n ? (d.cx + 1) * d.n : 99, y0 = d && d.n ? d.cy * d.n - 1 : -9, y1 = d && d.n ? (d.cy + 1) * d.n : 99;
    for (const [x, y] of EDGE) if (x >= x0 && x <= x1 && y >= y0 && y <= y1) altarFloor(c, x * T, y * T, T, x, y);
    c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.rect(-T * 4, -T * 4, (W0 + 10) * T, (WALLY + 4) * T); sePath(c, T, 0, 0, 0, 160, true); c.closePath(); c.fill('evenodd'); c.restore();
    const TH = 1.0; c.save(); c.beginPath(); c.rect(-T * 4, AC.y * T, (W0 + 10) * T, (WALLY - AC.y) * T); c.clip();
    c.beginPath(); sePath(c, T, 0, 0, 0, 80, true); sePath(c, T, 0, TH, 80, 0, false); c.closePath();
    const g = c.createLinearGradient(0, (AC.y + ARY - 0.7) * T, 0, (AC.y + ARY + TH) * T); g.addColorStop(0, '#4A4042'); g.addColorStop(0.3, '#2A2325'); g.addColorStop(0.55, '#141015'); g.addColorStop(0.82, '#3A140A'); g.addColorStop(1, '#C04414'); c.fillStyle = g; c.fill();
    c.save(); c.clip(); c.lineWidth = Math.max(1, T * 0.03); for (const k of [0.2, 0.4, 0.66]) { c.strokeStyle = k > 0.5 ? 'rgba(255,90,30,.3)' : 'rgba(8,5,6,.55)'; c.beginPath(); sePath(c, T, 0, TH * k, 2, 78, true); c.stroke(); }
      for (let i = 4; i < 78; i += 3) { const p = SEP[i], X = (AC.x + p[0] * ARX) * T, Y = (AC.y + p[1] * ARY) * T; c.strokeStyle = 'rgba(8,5,6,.5)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.moveTo(X, Y + TH * 0.04 * T); c.lineTo(X + (hh(i, 1) - 0.5) * T * 0.2, Y + TH * 0.5 * T); c.stroke(); }
      for (let i = 6; i < 76; i += 7) { const p = SEP[i], X = (AC.x + p[0] * ARX) * T + (hh(i, 2) - 0.5) * T * 0.4, Y = (AC.y + p[1] * ARY) * T; c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createLinearGradient(0, Y + TH * 0.3 * T, 0, Y + TH * T); gg.addColorStop(0, 'rgba(255,120,40,0)'); gg.addColorStop(1, 'rgba(255,140,50,.55)'); c.strokeStyle = gg; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(X, Y + TH * 0.3 * T); c.lineTo(X, Y + TH * T); c.stroke(); c.restore(); }
      c.restore();
    c.restore();
    c.save(); c.beginPath(); c.rect(-T * 4, -T * 4, (W0 + 10) * T, (WALLY + 4) * T); c.clip();
    c.strokeStyle = 'rgba(8,5,6,.8)'; c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); sePath(c, T, 0.03, 0, 0, 160, true); c.stroke();
    c.strokeStyle = 'rgba(200,180,175,.3)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); sePath(c, T, 0.14, 0, 82, 158, true); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,100,36,.35)'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); sePath(c, T, 0.02, 0.02, 2, 78, true); c.stroke(); c.restore(); c.restore(); }
  /* the yard's wall faces: basalt courses on an iron base, an iron band with rivets, rune slits glowing faintly by the door */
  function yardWall(c, X, Y, T, H, h, x) {
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, '#4A4244'); g.addColorStop(0.55, '#2E2729'); g.addColorStop(1, '#1A1516'); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    const n = 4; for (let i = 1; i < n; i++) { const yy = Y + H * 0.82 * i / n; c.fillStyle = 'rgba(6,4,5,.6)'; c.fillRect(X, yy, T + 0.5, Math.max(1, H * 0.02)); c.fillStyle = 'rgba(200,180,175,.12)'; c.fillRect(X, yy + Math.max(1, H * 0.02), T + 0.5, Math.max(1, H * 0.01)); const jx = X + T * ((i + x) % 2 ? 0.3 : 0.8); c.fillStyle = 'rgba(6,4,5,.5)'; c.fillRect(jx, yy - H * 0.82 / n, Math.max(1, T * 0.03), H * 0.82 / n); }
    c.fillStyle = '#1C1A1C'; c.fillRect(X, Y + H * 0.82, T + 0.5, H * 0.18); c.fillStyle = '#C99A4A'; c.fillRect(X, Y + H * 0.82, T + 0.5, Math.max(1, H * 0.02));
    c.fillStyle = '#3A3638'; c.fillRect(X, Y + H * 0.1, T + 0.5, H * 0.06); c.fillStyle = '#6E686C'; c.beginPath(); c.arc(X + T * 0.5, Y + H * 0.13, Math.max(1.2, T * 0.05), 0, TAU); c.fill();
    if (x % 3 === 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,90,30,.45)'; c.fillRect(X + T * 0.46, Y + H * 0.3, Math.max(1, T * 0.08), H * 0.3); c.restore(); }
    const dv = Math.abs(x + 0.5 - DOORX); if (dv < 6) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,110,40,${(0.12 * (1 - dv / 6)).toFixed(3)})`; c.fillRect(X, Y, T + 0.5, H); c.restore(); } }
  const noCliff = () => {};

  /* ======================= the lands and the backdrop ======================= */
  const land = (name, o) => Object.assign({ name, rift: true, tile: 'volcano', out: false, dark: 0, bg: '#1A0604', gap: 'agsky', ambient: 'embers', accent: LAVA_HI, light: '#FFC8A0', hazard: 'geyser', grade: null, fog: '#1A0604', darkRGB: '26,6,4', props: [], deco: EMBER, mud: ['#3A3032', '#2A2224'] }, o);
  BIOMES.agyard = land('The Ember Switchyard', { floorFn: (c, X, Y, T, h, h2, x, y) => yardFloor(c, X, Y, T, x, y), wallFn: (c, X, Y, T, H, h, x) => yardWall(c, X, Y, T, H, h, x), cliffTint: noCliff,
    floor: ['#2D2728', '#2D2728', '#2D2728'], grout: '#100C0D', hi: '#5A5052', top: '#2A2526', face: '#3A3335', faceD: '#141011', cliff: '#221C1D', bridgeCol: '#3A3638' });
  BIOMES.agaltar = land('The Cataclysm Altar', { floorFn: (c, X, Y, T, h, h2, x, y) => altarFloor(c, X, Y, T, x, y), cliffTint: noCliff, light: '#FFB880',
    floor: ['#2E2627', '#2E2627', '#2E2627'], grout: '#100C0D', hi: '#5A5052', top: '#2A2526', face: '#3A3335', faceD: '#141011', cliff: '#221C1D', bridgeCol: '#3A3335' });
  for (const id of ['agyard', 'agaltar']) { if (!BIOME_ORDER.includes(id)) BIOME_ORDER.push(id); if (typeof DARK_COL !== 'undefined') DARK_COL[id] = '26,6,4'; }
  window.DECAL_EXT = window.DECAL_EXT || {};
  DECAL_EXT.agedge = (c, d, s, lw, T) => arenaEdge(c, T, d);
  /* the backdrop: the lake of fire far below (the Caldera's own molten crust, darkened and slow), obsidian spires rising from
     it, and past the altar's north rim the caldera's far wall (its lavafalls on the GPU) under an ember sky, the dying sun on
     its crest, the Ram's stars in the smoke: all of it fixed in the world (screen = world - camera) */
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.agsky = { base: '#1A0604',
    paint(c, S, R) { const src = GAP_EXT.calderalavafar || GAP_EXT.calderalava; if (src && src.paint) src.paint(c, S, R); else { c.fillStyle = '#3A0E06'; c.fillRect(0, 0, S, S); } c.fillStyle = 'rgba(14,3,2,.58)'; c.fillRect(0, 0, S, S); },   /* (the Caldera's lake, softened and darkened: far below) */
    back(c, o) { const { pat, pattern, k, P, W, H, t, wx, wy, bigGlow } = o; const C = CUR, T = C && C.X ? C.X.Tz() : 48, lf = lowFx(), sx = x => W / 2 + x * T - wx, sy = y => H / 2 + y * T - wy;
      c.fillStyle = '#1A0604'; c.fillRect(0, 0, W, H); pat(pattern('agsky', k), 1, W / 2 + t * 1.6, H / 2 + t * 0.8);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = lf ? 0.1 : 0.12 + 0.05 * Math.sin(t * 0.9); { const PX = Math.max(W, H) * 2.4; bigGlow(c, P, '#FF5A1E', md(PX * 0.3 - wx, PX) - PX * 0.5 + W * 0.2, md(PX * 0.2 - wy, PX) - PX * 0.5 + H * 0.3, W * 0.9); } c.restore();
      const tp = AP(), F = !lf ? fgx() : null; let Q = null; const q = () => Q || (Q = F ? F.begin(c, null) : null);
      // the far wall and what is over it
      const Yb = sy(WALL_Y); if (Yb > -T * 2) {
        if (Yb > 0) { const g = c.createLinearGradient(0, Yb - 22 * T, 0, Yb - 2 * T); g.addColorStop(0, '#0C0306'); g.addColorStop(0.45, '#2A0A08'); g.addColorStop(0.8, '#6A1E0C'); g.addColorStop(1, '#9A3410'); c.fillStyle = g; c.fillRect(0, 0, W, Math.min(H, Yb)); }
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22; bigGlow(c, P, '#FF6A20', sx(SUN.x) - W * 0.6, sy(SUN.y) - W * 0.6, W * 1.2); c.restore();
        if (tp) { const Sx = sx(SUN.x), Sy = sy(SUN.y); if (Sx > -T * 8 && Sx < W + T * 8 && Sy > -T * 8) { if (Q || q()) { Q.glow(Sx, Sy, T * 6.5, '#FF5A1E', 0.35); Q.ring(Sx, Sy, T * 3.1, '#FFB060', 0.3, T * 0.22); } tp.draw(c, 'eclipse', 0, Sx, Sy, T); } }
        // the Ram's stars in the smoke (CONSTELLATION.aries, 02e)
        { const K2 = typeof CONSTELLATION !== 'undefined' && CONSTELLATION.aries, ox = AC.x - 12, oy = -12.5, sc = 8; if (K2) { const pts = K2.p.map(([u, v]) => [sx(ox + u * sc), sy(oy + v * sc)]); if (pts.some(p => p[1] > -T && p[1] < H && p[0] > -T && p[0] < W + T)) {
          if (Q || q()) { for (const [a, b] of K2.e) Q.beam(pts[a][0], pts[a][1], pts[b][0], pts[b][1], T * 0.05, '#FF9A5A', 0.3); pts.forEach((p, i) => { Q.glow(p[0], p[1], T * 0.5, '#FF7A3A', 0.3); Q.star(p[0], p[1], T * (i === 2 ? 0.3 : 0.22), 0.8, '#FFE0C0'); }); }
          else { c.save(); c.strokeStyle = 'rgba(255,154,90,.35)'; c.lineWidth = 1; for (const [a, b] of K2.e) { c.beginPath(); c.moveTo(pts[a][0], pts[a][1]); c.lineTo(pts[b][0], pts[b][1]); c.stroke(); } c.fillStyle = '#FFE0C0'; for (const p of pts) { c.beginPath(); c.arc(p[0], p[1], Math.max(1.2, T * 0.06), 0, TAU); c.fill(); } c.restore(); } } } }
        if (tp) { const sw = CLW * CLIFF_K, span = sw * T, n0 = Math.floor((wx - W / 2) / span) - 1, n1 = Math.ceil((wx + W / 2) / span) + 1; for (let n = n0; n <= n1; n++) { const X = sx(n * sw); if (X > W + T || X + span < -T) continue; tp.draw(c, 'cliff', md(n, 2), X, Yb, T * CLIFF_K);
          if (Q || q()) for (const [fx, w] of FALLS[md(n, 2)]) { const lx = X + fx * T * CLIFF_K, y0 = Yb - 4.6 * T * CLIFF_K; Q.ebeam(lx, y0, lx, Yb, w * T * CLIFF_K * 0.9, '#FF7A2A', 0.9, 0.55, n * 3.1 + fx, 4); Q.glow(lx, Yb, T * 1.2, LAVA_HI, 0.4); if (!lf) Q.smoke(lx, Yb - T * 0.6, T * 1.2, 0.2, n + fx, '#4A2A22', 0.5); } } }
        c.save(); c.globalCompositeOperation = 'lighter'; const g2 = c.createLinearGradient(0, Yb - T * 1.6, 0, Yb + T * 2.4); g2.addColorStop(0, 'rgba(255,90,30,0)'); g2.addColorStop(0.45, 'rgba(255,110,40,.35)'); g2.addColorStop(1, 'rgba(255,90,30,0)'); c.fillStyle = g2; c.fillRect(0, Yb - T * 1.6, W, T * 4); c.restore(); }
      // the spires (their feet in the lake)
      if (tp) for (const [x, y, v, s] of SPIRES) { const X = sx(x), Y = sy(y); if (X < -T * 3 || X > W + T * 3 || Y < -T * 0.5 || Y > H + T * 8) continue; tp.draw(c, 'spire', v, X, Y, T * s, { alpha: 0.92 }); if (Q || q()) { Q.glow(X, Y, T * 1.4 * s, LAVA, 0.3, 0.4); if (!lf) Q.smoke(X + T * 0.3, Y - T * 1.2 * s, T * 1.1 * s, 0.18, x, '#3A2420', 0.3); } }
      // embers rising off the lake (fixed to the world in cells, each cell's ember on its own clock)
      if (Q || (!lf && q())) { if (!lf) { const CS = 3, gx0 = Math.floor((wx - W / 2) / T / CS) - 1, gx1 = Math.ceil((wx + W / 2) / T / CS) + 1, gy0 = Math.floor((wy - H / 2) / T / CS) - 1, gy1 = Math.ceil((wy + H / 2) / T / CS) + 1;
        for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) { if (hh(gx, gy, 5) > 0.45) continue; const u = md(t * 0.22 + hh(gx, gy, 7), 1), X = sx((gx + hh(gx, gy, 9)) * CS) + Math.sin(t * 0.8 + gx) * T * 0.3, Y = sy((gy + hh(gx, gy, 11)) * CS) - u * T * 2.5; Q.star(X, Y, T * 0.07, 0.7 * Math.sin(u * Math.PI), '#FFB070'); } } }
      if (Q) F.flush(c); } };
  const CLW = 16;   // (the cliff strips' width in tiles before scaling, as ARIES_PROPS.CL_W)
  const FALLS = [[[3.2, 0.42], [9.6, 0.3], [13.4, 0.22]], [[4.9, 0.42], [8.3, 0.3], [13.4, 0.22]]];   // (the lavafalls painted in each strip, as ARIES_PROPS's)

  /* ======================= the stand-in guardian (until ARIES_BOSS exists): the Forge Warden ======================= */
  /* An ordinary lesser boss of the engine (the Magma Golem's body and ways) in the altar, its strength measured from the
     pet's; beating it wins the gate. The same contract as ARIES_BOSS, so the gate runs the same code either way */
  const STANDIN = (() => { let S = null;
    function begin(X, H, self, A) { stop(); S = { X, self, A, m: null, t: 0, won: false };
      X.after(1.1, () => { if (!S || S.X !== X) return; const B = BOSSES.find(b => b.id === 'magmagolem') || BOSSES[0], ST = X.ST(); const m = X.lesserBoss(A.cx, A.cy - 2.5, 1, '', B); if (!m) return; S.m = m;
        m.bname = 'The Forge Warden'; m.glow = EMBER; m.aggro = true; m.hp = m.maxhp = Math.max(m.hp, Math.round((ST.atk || 10) * 160)); m.dmg = Math.max(m.dmg || 1, (ST.hp || 100) * 0.045);
        X.flash(0.45, '#FFD0A0'); X.shake(8, 0.5); X.sfx.hum && X.sfx.hum(); X.ring(m.x, m.y, 0.5, 6, 0.7, EMBER, 0.5); X.banner('THE FORGE WARDEN', 'It rises from the altar\'s fire to keep the Ram\'s heart', EMBER, 3, true, true); A.heat(1.6); }); }
    function update(dt) { if (!S) return; S.t += dt; const m = S.m; if (!m || S.won) return;
      if (m.dead) { S.won = true; S.A.heat(0.4); const X = S.X; X.banner('THE FORGE ANSWERS', 'The Warden falls: Aries wakes over the altar', GOLD, 3, true, true); X.flash(0.5, '#FFFFFF'); X.sfx.fanfare(); X.ring(m.x, m.y, 0.3, 6, 0.9, GOLD, 0.4); X.after(2.6, () => { try { X.winStage(); } catch (e) {} }); } }
    function stop() { if (!S) return; const m = S.m; try { if (m && !m.dead) m.dead = true; } catch (e) {} S = null; }
    return { begin, update, stop, drawGround() {}, drawOver() {}, cam: () => null, hideHud: () => false, onBossDeath: () => false, active: () => !!S, goal: () => { const m = S && S.m; return !m ? 'Something stirs on the altar' : m.dead ? 'Aries wakes' : `The Forge Warden ${Math.max(0, Math.ceil(m.hp / m.maxhp * 100))}%`; }, get S() { return S; } }; })();
  // (the boss: ARIES_BOSS when it exists, else the stand-in; tests may stand one in, window.__AG_BOSS, or leave it out, window.__AG_NOBOSS = 1)
  const AB = () => { const w = typeof window !== 'undefined' ? window : {}; if (w.__AG_BOSS) return w.__AG_BOSS; if (w.__AG_NOBOSS === 1) return null; return typeof ARIES_BOSS !== 'undefined' && ARIES_BOSS ? ARIES_BOSS : STANDIN; };

  /* ======================= the stage ======================= */
  let CUR = null;   // (the running stage: the backdrop reads its camera; let go when the stage closes)
  const OPEN_T = 5.6, SEAL_T = 1.3, SPEED = 3.3, POUR_T = 1.1;
  defGate('caldera', {
    name: 'The Ramforge', biome: 'agyard', goal: 'Route the living ember through the switchyard, then face what waits beyond the great door',
    how: 'Pour the ember from the great crucible (stand by it, or tap Pour) and it rolls along the molten channels by itself. Levers set the junctions: stand beside one for a moment to turn it (the lit tongue on its plate shows which way it points). An ember coming into a junction from a side branch always runs on to its stem. Quench troughs put it out, and a dead end spills it: your levers stay as you left them, so pour again. Three yards: two levers to wake the west furnace; the bellows kiln, which the east furnace needs; a ram switch that rocks over each time the ember passes it, two braziers to light and the great door to feed. Wake all three and the door opens: what waits beyond must be faced to wake Aries.',
    layout: LAYOUT,
    legend: { A: {}, D: { tile: T_SOLID }, d: { tile: T_SOLID }, P: { prop: 'agruin' }, C: { prop: 'agpillar' } },
    // (the loading screen paints every picture at the floor's sharpness: nothing is painted mid-play)
    preload(P) { const tp = AP(), out = tp && P && P.T ? tp.warm(P.T * (P.k || 1)) : [];   /* (v447 K: and the boss's 3D model, built and on the GPU before the fight, not as it starts) */
      try { if (P && P.gl && typeof SAMAEL_GL !== 'undefined' && SAMAEL_GL.usable()) out.push(() => { try { SAMAEL_GL.warm(); } catch (e) {} }); } catch (e) {} return out; },
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, MW = M.MW, MH = M.MH;
      const R = { yard: 0, Y: null, t: 0, mode: 'intro', el: null, run: null, fails: [0, 0, 0], pours: 0, hinted: false, fadeT: 9, prevY: null, lastFail: null, msgT: 0 };
      const S = { cruFade: 1, phase: 'puzzle', t: 0, open: 0, bar: 0, lit: 0, litK: [0, 0, 0], climb: 0, openT: 0, sealT: 0, passable: false, mist: [], fade: 1, archFade: 1, dt: 0.016, furn: { W: 0, E: 0 }, furnK: { W: 0, E: 0 }, heat: 1, heatK: 1, steam: [] };
      { const li = BIOME_ORDER.indexOf('agaltar'), ni = BIOME_ORDER.indexOf('agyard'); for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) M.BI[y * MW + x] = y <= 20 ? li : ni; }
      if (M.decalsByChunk && typeof DunWorld !== 'undefined') { const CHn = DunWorld.CH || 8; for (let cy = 0; cy <= Math.floor((WALLY + 1) / CHn); cy++) for (let cx = 0; cx <= Math.floor((MW - 1) / CHn); cx++) { const key = cx + ',' + cy, L = M.decalsByChunk.get(key) || []; L.push({ kind: 'agedge', x: 0, y: 0, s: 1, rot: 0, cx, cy, n: CHn }); M.decalsByChunk.set(key, L); } }
      M.fill = T_GAP; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (x === 0 || y === 0 || x === MW - 1 || y === MH - 1) X.setTile(x, y, T_GAP);
      for (const [x, y] of SOLID.concat(ARCH.piers)) { X.setTile(x, y, T_SOLID); M.props.set(y * MW + x, 'agnone'); }
      const doorTiles = [[15, WALLY], [16, WALLY], [17, WALLY]];
      CUR = { X, S };
      try { X.F.name = 'The Gate of Aries'; } catch (e) {}
      const note = (f, d, ty, v, f1, dl) => { try { if (X.sfx && X.sfx.note) X.sfx.note(f, d, ty, v, f1, dl); } catch (e) {} };
      const sfx = n => { try { if (X.sfx[n]) X.sfx[n](); } catch (e) {} };

      /* ---- the yard ---- */
      const Yd = () => R.Y;
      function load(n) { R.prevY = R.Y; R.fadeT = 0; R.yard = n; R.Y = buildYard(YARDS[n]); R.run = null; R.hinted = false; R.lastFail = null; placeObjs();
        X.banner(YARDS[n].name.toUpperCase(), `Yard ${n + 1} of 3 · ${YARDS[n].tip}`, LAVA_HI, 3.2, true, true); sfx('chirp'); buttons(); }
      function msg(s, col) { X.text(me.x, me.y - 1.6, s, col || PALE, 12); }
      const junctions = () => R.Y ? Object.values(R.Y.nodes).filter(n => n.k === 'sw' || n.k === 'ram') : [];
      function flip(id) { const n = R.Y && R.Y.nodes[id]; if (!n || !(n.k === 'sw' || n.k === 'ram') || R.mode !== 'play') return false; if (R.run) { msg('The levers are locked while the ember runs', WARN); sfx('wrong'); return false; } if (R.mode !== 'play') return false;
        n.cur ^= 1; n.flipT = R.t; sfx('kick'); note(n.k === 'ram' ? 196 : 247, 0.25, 'square', 0.06); X.sparks(n.x, n.y - 0.2, EMBER, 5, 3); msg(`${n.k === 'ram' ? 'The ram switch' : 'The lever'} points ${DNAME[n.opts[n.cur]]}`, LAVA_HI); buttons(); return true; }
      function pour() { if (R.mode !== 'play' || R.run || !R.Y) return false; const Y = R.Y, e = Y.edges[Y.src.arms[Object.keys(Y.src.arms)[0]]];
        R.pours++; R.run = { e, fwd: e.a === Y.src.id, s: 0, v: 0, pourT: 0, trail: [], lastP: null, kindled: false, braz: new Set(), visits: 0, done: false, dead: false, endT: 0, save: junctions().map(n => [n, n.cur]), x: Y.src.x, y: Y.src.y };
        sfx('whoosh'); note(110, 1.2, 'sawtooth', 0.06, 70); X.text(CRU.x, CRU.y - 3.2, 'The ember is poured', LAVA_HI, 13); buttons(); return true; }
      // the ember comes into node n through its arm inArm: where it goes next (an arm), or an end
      function arrive(n, inArm) { const run = R.run;
        if (n.k === 'sw' || n.k === 'ram') { if (inArm === n.stem) { const out = n.opts[n.cur]; if (n.k === 'ram') { n.cur ^= 1; n.flipT = R.t; sfx('kick'); note(165, 0.3, 'square', 0.07); X.text(n.x, n.y - 1.4, 'The ram switch rocks over', CRIM, 12); } return out; } return n.stem; }
        if (n.k === 'merge') return inArm === n.stem ? null : n.stem;
        if (n.k === 'kiln') { if (!run.kindled) { run.kindled = true; run.kilnT = R.t; sfx('whoosh'); note(330, 0.6, 'sawtooth', 0.05, 660); X.text(n.x, n.y - 2.6, 'Kindled!', LAVA_HI, 14); X.sparks(n.x, n.y - 0.6, LAVA_HI, 12, 5); } }
        if (n.k === 'braz') { if (!run.braz.has(n.id)) { run.braz.add(n.id); n.litT = R.t; sfx('coin'); note(392 + run.braz.size * 98, 0.6, 'sine', 0.12); X.text(n.x, n.y - 2.1, 'The brazier lights', LAVA_HI, 13); X.sparks(n.x, n.y - 1.2, LAVA_HI, 10, 5); } }
        if (n.k === 'kiln' || n.k === 'braz' || n.k === 'src') return Object.keys(n.arms).find(d => d !== inArm) || null;
        return 'END'; }
      function fail(why, n) { const run = R.run; if (!run || run.done) return; run.done = run.dead = true; run.endT = R.t; R.fails[R.yard]++; R.lastFail = why;
        const where = n || { x: run.x, y: run.y };
        if (why === 'quench') { sfx('hiss'); note(90, 0.8, 'sine', 0.12); for (let i = 0; i < 6; i++) S.steam.push({ x: where.x + (Math.random() - 0.5) * 0.8, y: where.y, vy: -0.8 - Math.random() * 0.6, r: 0.5 + Math.random() * 0.4, life: 0, max: 1.6 + Math.random(), sd: Math.random() * 9 }); X.banner('QUENCHED', 'The ember hisses out in the brine · your levers stay as they are: pour again', '#9FD8FF', 2.4, true); }
        else if (why === 'cold') { sfx('wrong'); X.banner('TOO COLD', 'The east furnace wakes only for an ember kindled in the bellows kiln', WARN, 2.6, true); }
        else if (why === 'braz') { sfx('wrong'); X.banner('THE DOOR STAYS DARK', `${run.braz.size ? 'Only one brazier burns' : 'Neither brazier burns'}: light both before the ember reaches the door`, WARN, 2.8, true); }
        else if (why === 'wrongfurn') { sfx('wrong'); X.banner('THE WRONG FURNACE', `It is the ${YARDS[R.yard].goal === 'W' ? 'west' : 'east'} furnace that must wake`, WARN, 2.4, true); }
        else if (why === 'loop') { sfx('wrong'); X.banner('THE EMBER COOLS', 'It ran round and round until its fire was spent', WARN, 2.4, true); }
        else { sfx('wrong'); X.ring(where.x, where.y, 0.2, 1.4, 0.4, CRIM, 0.3); X.banner('SPILLED', 'A channel with no way on: the ember runs out over the stone', WARN, 2.4, true); }
        if (R.fails[R.yard] === 3 && !R.hinted) { R.hinted = true; X.after(2.6, () => { if (R.mode === 'play' && !R.run) X.banner('THE FORGE WHISPERS', 'A lever glows: turn it', GOLD, 2.4, true); }); }
        X.after(1.8, () => { if (R.run === run) { for (const [nn, c0] of run.save) if (nn.k === 'ram') nn.cur = c0; R.run = null; buttons(); } }); }
      function succeed(n) { const run = R.run; run.done = true; run.endT = R.t; const Y = YARDS[R.yard];
        if (n.k === 'furn') { S.furn[n.fu] = 1; S.furnT = R.t; X.shake(5, 0.5); X.flash(0.25, '#FFB070'); sfx('crash'); note(82, 1.8, 'sawtooth', 0.1, 55); X.ring(n.x, n.y - 0.4, 0.3, 3.4, 0.8, EMBER, 0.4); for (let i = 0; i < 3; i++) X.sparks(n.x + (i - 1) * 0.5, n.y - 1.2, LAVA_HI, 8, 6); }
        else { X.shake(6, 0.7); X.flash(0.3, '#FFC890'); sfx('crash'); note(65, 2.2, 'sawtooth', 0.12, 49); }
        S.lit = R.yard + 1; chime(S.lit);
        X.banner(`${Y.name.toUpperCase()} BURNS`, n.k === 'furn' ? `The ${n.fu === 'W' ? 'west' : 'east'} furnace wakes · a ram socket lights on the great door` : 'The ember runs into the great door', '#8FE0A6', 2.4, true); sfx('fanfare');
        if (R.yard < 2) { R.mode = 'between'; X.after(2.8, () => { R.mode = 'play'; load(R.yard + 1); }); }
        else { R.mode = 'won'; buttons(); X.after(0.9, () => { X.banner('THE RAMFORGE BURNS', 'Three fires answer · the great door wakes', GOLD, 2.8, true, true); }); X.after(1.2, () => startOpen()); } }
      function end(n) { const run = R.run, Y = YARDS[R.yard];
        if (n.k === 'sink') return fail('quench', n);
        if (n.k === 'furn') { if (n.fu !== Y.goal && Y.goal !== 'D') return fail('wrongfurn', n); if (Y.need === 'kiln' && !run.kindled) return fail('cold', n); return succeed(n); }
        if (n.k === 'door') { if (Y.need === 'braz' && run.braz.size < 2) return fail('braz', n); return succeed(n); }
        return fail('spill', n); }
      function step(dt) { const run = R.run; if (!run || run.done) return; const fast = (typeof window !== 'undefined' && window.__AG_FAST) || 1;   // (tests: __AG_FAST runs the ember faster)
        if (run.pourT < POUR_T) { run.pourT += dt * fast; return; }
        run.v = Math.min(SPEED * fast, run.v + dt * 6 * fast); let left = run.v * dt;
        while (left > 0 && !run.done) { const e = run.e, room = e.L - run.s; if (left < room) { run.s += left; left = 0; break; } left -= room; run.s = e.L;
          const nid = run.fwd ? e.b : e.a, n = R.Y.nodes[nid], inArm = run.fwd ? e.db : e.da; run.visits++; if (run.visits > 40) { fail('loop', n); break; }
          const out = arrive(n, inArm); if (out === 'END') { const p = [n.x, n.y]; run.x = p[0]; run.y = p[1]; end(n); break; } if (!out || n.arms[out] == null) { run.x = n.x; run.y = n.y; fail('spill', n); break; }
          const ne = R.Y.edges[n.arms[out]]; run.e = ne; run.fwd = ne.a === nid && ne.da === out; run.s = 0; }
        const p = at(run.e, run.fwd ? run.s : run.e.L - run.s); run.x = p[0]; run.y = p[1];
        if (!run.lastP || Math.hypot(p[0] - run.lastP[0], p[1] - run.lastP[1]) > 0.22) { run.trail.push([p[0], p[1], R.t]); run.lastP = p; if (run.trail.length > 400) run.trail.shift(); } }
      function buttons() { let el = R.el; if (!el) { el = document.createElement('div'); el.className = 'rift-match rift-trace'; el.id = 'agPour'; document.querySelectorAll('#agPour').forEach(e => e.remove()); const host = document.getElementById('arcade'); if (!host) return; host.appendChild(el); R.el = el; el.addEventListener('click', ev => { if (ev.target.closest('[data-pour]')) { if (!pour()) sfx('wrong'); } }); }
        if (self.done || R.mode === 'won') { el.remove(); R.el = null; return; } el.innerHTML = `<button type="button" class="btn" data-pour ${R.run || R.mode !== 'play' ? 'disabled' : ''}>Pour the ember</button>`; }
      X.after(1.2, () => { R.mode = 'play'; load(0); });
      function chime(n) { const base = [330, 415, 494][clamp(n - 1, 0, 2)]; note(base, 1.4, 'sine', 0.2); note(base * 2, 0.8, 'sine', 0.07); note(base * 1.5, 1.1, 'triangle', 0.05, null, 0.06); }

      /* ---- the great door ---- */
      function setDoor(open) { for (const [x, y] of doorTiles) X.setTile(x, y, open ? T_FLOOR : T_SOLID); S.passable = open; try { X.retile(); } catch (e) {} }
      function startOpen() { if (S.phase !== 'puzzle') return; S.phase = 'opening'; if (X.prepTiles) X.prepTiles(doorTiles.map(([x, y]) => [x, y, T_FLOOR]));   /* (v447 K: the open door's floor painted ahead, no glitch as it opens) */ S.openT = 0; S.lit = 3; X.flash(0.25, '#FFD8B0'); sfx('fanfare'); X.ring(DOORX, DOORY + 0.6, 0.3, 4, 0.8, EMBER, 0.4); }
      function opened() { S.phase = 'open'; X.banner('THE GREAT DOOR OPENS', 'Beyond it waits the Cataclysm Altar', LAVA_HI, 2.6, true, true); }
      function seal() { if (S.phase !== 'open') return; S.phase = 'sealing'; if (X.prepTiles) X.prepTiles(doorTiles.map(([x, y]) => [x, y, T_SOLID])); S.sealT = 0; sfx('whoosh'); }
      const arenaA = () => ({ cx: AC.x, cy: AC.y, r: ARY, rx: ARX, ry: ARY, sen: SEN, ax0: AC.x - ARX + 0.5, ay0: AC.y - ARY + 0.5, ax1: AC.x + ARX - 0.5, ay1: WALLY - 0.5, door: { x: DOORX, y: WALLY - 0.5 },
        inside: (x, y) => y < WALLY && se((x - AC.x) / ARX, (y - AC.y) / ARY) <= 1, glyph: GLYPH.map(p => p.map(q => q.slice())), rings: RINGS.slice(), heat: k => { S.heat = clamp(+k || 0, 0, 2); }, arch: { x: ARCH.x, y: ARCH.y } });
      function sealed() {
        if (me.y > WALLY - 0.6) me.y = WALLY - 0.7; setDoor(false); X.shake(9, 0.5); sfx('thud'); note(98, 2.4, 'sine', 0.3); note(49, 2.8, 'sine', 0.2);
        const B = AB(); if (B && typeof B.begin === 'function') { S.phase = 'boss'; X.banner('THE ALTAR IS SEALED', 'The door is shut behind you', LAVA_HI, 2.4, true, true);
          try { B.begin(X, H, self, arenaA()); } catch (e) { if (typeof console !== 'undefined') console.error(e); win(); } }
        else win(); }
      function win() { if (self.done) return; self.done = true; S.phase = 'won'; X.banner('THE RAMFORGE BURNS', 'Aries wakes over the Cataclysm Altar', GOLD, 2.8, true, true); X.flash(0.4, '#FFFFFF'); sfx('fanfare'); X.ring(me.x, me.y, 0.3, 6, 0.9, GOLD, 0.4); X.after(2.6, () => X.winStage()); }

      /* ---- the objects ---- */
      const tp0 = () => AP();
      const crucible = H.obj({ x: CRU.x, y: CRU.y + 0.02, kind: 'agcrucible', r: 1.3, h: 3.9, label: () => R.mode === 'play' && !R.run ? 'Pour the ember: stand still here' : '', use() { if (!pour()) { if (R.run) msg('The ember is already running', WARN); } },
        draw(c, Xs, Ys, T) { const tp = tp0(); if (tp) tp.draw(c, 'crucible', 0, Xs, Ys, T, { alpha: S.cruFade }); } });
      const furnObjs = ['W', 'E'].map(fu => H.obj({ x: FURN[fu].x, y: FURN[fu].y, kind: 'agfurnace', r: 0, h: 2.6, label: '', fu, draw(c, Xs, Ys, T) { const tp = tp0(); if (tp) tp.draw(c, 'furnace', 0, Xs, Ys, T); } }));
      // (the moveable pieces, re-laid for each yard: levers, kilns, braziers, troughs)
      const lev = []; for (let i = 0; i < 4; i++) lev.push(H.obj({ x: -9, y: -9, kind: 'aglever', r: 0.75, h: 1.6, node: null,
        label: o => { const n = o.node; if (!n || R.mode !== 'play') return ''; return R.run ? 'Locked while the ember runs' : `${n.k === 'ram' ? 'Ram switch' : 'Lever'}: points ${DNAME[n.opts[n.cur]]} · stand still to turn`; },
        use(o) { if (o.node) flip(o.node.id); },
        draw(c, Xs, Ys, T, o) { const n = o.node, tp = tp0(); if (!n || !tp) return; const fa = ease(R.fadeT / 0.6);
          if (n.k === 'ram') { tp.draw(c, 'ramsw', 0, Xs, Ys, T, { alpha: fa }); const k = clamp((R.t - (n.flipT || -9)) / 0.35, 0, 1), a0 = (n.cur ? 1 : -1) * 0.32, rot = lerp(-a0, a0, ease(k)); tp.draw(c, 'rhorns', 0, Xs, Ys - T * 0.42, T, { alpha: fa, rot }); }
          else { const k = clamp((R.t - (n.flipT || -9)) / 0.25, 0, 1), a0 = (n.cur ? 1 : -1) * 0.5, rot = lerp(-a0, a0, ease(k)); tp.draw(c, 'handle', 0, Xs, Ys - T * 0.36, T, { alpha: fa, rot }); tp.draw(c, 'lever', 0, Xs, Ys, T, { alpha: fa }); } } }));
      const kilns = [H.obj({ x: -9, y: -9, kind: 'agkiln', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (tp) tp.draw(c, 'kiln', 0, Xs, Ys + T * 0.05, T, { alpha: ease(R.fadeT / 0.6) }); } })];
      const brazs = [0, 1].map(() => H.obj({ x: -9, y: -9, kind: 'agbrazier', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (tp) tp.draw(c, 'brazier', 0, Xs, Ys + T * 0.05, T, { alpha: ease(R.fadeT / 0.6) }); } }));
      const troughs = [0, 1].map(() => H.obj({ x: -9, y: -9, kind: 'agtrough', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (tp) tp.draw(c, 'trough', 0, Xs, Ys + T * 0.12, T, { alpha: ease(R.fadeT / 0.6) }); } }));
      function placeObjs() { const Y = R.Y, js = junctions(); lev.forEach((o, i) => { const n = js[i]; o.node = n || null; o.x = n ? n.x + n.lv[0] : -9; o.y = n ? n.y + n.lv[1] : -9; o.used = false; o.ch = 0; });
        const of = k => Object.values(Y.nodes).filter(n => n.k === k); const put = (list, ns) => list.forEach((o, i) => { const n = ns[i]; o.node = n || null; o.x = n ? n.x : -9; o.y = n ? n.y + 0.02 : -9; });
        put(kilns, of('kiln')); put(brazs, of('braz')); put(troughs, of('sink')); }
      const door = H.obj({ x: DOORX, y: DOORY - 0.02, kind: 'agdoor', r: 0, h: 5, label: '',
        draw(c, Xs, Ys, T) { const tp = tp0(); if (!tp) return; const G = tp.GEO, Yf = X.sy(DOORY), k = ease(S.open), off = k * (G.WO + 0.14) * T, a = S.fade;
          c.save(); c.globalAlpha *= a; c.beginPath(); c.rect(Xs - G.WO * T, Yf - (G.L0 + 0.15) * T, G.WO * 2 * T, (G.L0 + 0.6) * T); c.clip(); tp.draw(c, 'leaf', 'l', Xs - off, Yf, T); tp.draw(c, 'leaf', 'r', Xs + off, Yf, T);
          if (S.bar < 1) tp.draw(c, 'bar', 0, Xs, Yf - T * (G.barZ + ease(S.bar) * 1.3), T, { alpha: 1 - ease(clamp((S.bar - 0.55) / 0.45, 0, 1)) }); c.restore();
          tp.draw(c, 'door', 0, Xs, Yf, T, { alpha: a }); } });
      const arch = H.obj({ x: ARCH.x, y: ARCH.y, kind: 'aghornarch', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (tp) tp.draw(c, 'hornarch', 0, Xs, Ys, T, { alpha: S.archFade }); } });
      const shards = SHARDS.map(q => H.obj({ x: q.x, y: q.y, kind: 'agshard', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (!tp) return; const t = g.t, bob = Math.sin(t * 0.7 + q.ph) * 0.22, lift = T * (q.lift + bob), sc = T * q.s;
        const deb = k => { const an = t * 0.4 * q.dir + q.ph + k * Math.PI, dz = Math.sin(an); return { dz, x: Xs + Math.cos(an) * 0.8 * q.s * T, y: Ys - lift - T * 0.55 * q.s + dz * T * 0.22 * q.s, v: (q.v + k + 1) % 3 }; };
        const d = [deb(0), deb(1)]; for (const e of d) if (e.dz < 0) tp.draw(c, 'shard', 2, e.x, e.y, sc * 0.7);
        tp.draw(c, 'shard', q.v, Xs, Ys - lift, sc, { rot: Math.sin(t * 0.3 + q.ph) * 0.08 });
        for (const e of d) if (e.dz >= 0) tp.draw(c, 'shard', 2, e.x, e.y, sc * 0.7); } }));
      H.obj({ x: AC.x, y: 1e6, kind: 'aglight', r: 0, label: '', draw(c) { if (fgx()) lightOver(c); else over2D(c); } });
      X.after(2.6, () => { if (R.mode === 'intro' || R.mode === 'play') X.banner('THE EMBER SWITCHYARD', 'Set the levers, then pour the ember from the crucible', LAVA_HI, 2.4, true, true); });

      /* ---- the channels (drawn every frame in 2D: they are the puzzle; the GPU adds their light) ---- */
      const onScr = (x, y, r) => { const T = X.Tz(), Xs = X.sx(x), Ys = X.sy(y), Rr = r * T; return Xs + Rr > -T && Xs - Rr < X.W() + T && Ys + Rr > -T * 3 && Ys - Rr < X.H() + T * 3; };
      function railsPath(c, Y, a) { if (!Y || a < 0.01) return; const T = X.Tz(), ox = X.sx(0), oy = X.sy(0); c.save(); c.globalAlpha *= a; c.translate(ox, oy); c.scale(T, T); c.lineCap = 'round'; c.lineJoin = 'round';
        c.strokeStyle = 'rgba(6,3,4,.85)'; c.lineWidth = 0.62; c.stroke(Y.path); c.strokeStyle = '#4A4448'; c.lineWidth = 0.5; c.stroke(Y.path); c.strokeStyle = '#151012'; c.lineWidth = 0.36; c.stroke(Y.path);
        c.strokeStyle = '#3A160C'; c.lineWidth = 0.2; c.stroke(Y.path); c.strokeStyle = 'rgba(255,110,40,.4)'; c.lineWidth = 0.07; c.stroke(Y.path);
        // the junctions' plates: iron discs ringed in gold (crimson for a ram switch), a lit tongue toward the way each points
        for (const n of Object.values(Y.nodes)) { if (!(n.k === 'sw' || n.k === 'ram' || n.k === 'merge')) continue; const ram = n.k === 'ram';
          c.fillStyle = '#0E0A0B'; c.beginPath(); c.arc(n.x, n.y, 0.42, 0, TAU); c.fill(); c.fillStyle = '#35303A'; c.beginPath(); c.arc(n.x, n.y, 0.36, 0, TAU); c.fill(); c.strokeStyle = ram ? '#C8402A' : '#C99A4A'; c.lineWidth = 0.05; c.stroke();
          if (n.k === 'merge') { const [dx, dy] = DV[n.stem]; c.strokeStyle = 'rgba(255,170,90,.75)'; c.lineWidth = 0.09; c.beginPath(); c.moveTo(n.x, n.y); c.lineTo(n.x + dx * 0.3, n.y + dy * 0.3); c.stroke(); continue; }
          const sel = n.opts[n.cur], oth = n.opts[n.cur ^ 1], [dx, dy] = DV[sel], [ox2, oy2] = DV[oth], k = clamp((R.t - (n.flipT || -9)) / 0.25, 0, 1);
          c.strokeStyle = 'rgba(20,12,12,.9)'; c.lineWidth = 0.1; c.beginPath(); c.moveTo(n.x, n.y); c.lineTo(n.x + ox2 * 0.3, n.y + oy2 * 0.3); c.stroke();
          c.strokeStyle = ram ? '#FF6A4A' : '#FFB347'; c.lineWidth = 0.16; c.beginPath(); c.moveTo(n.x - DV[n.stem][0] * 0.12, n.y - DV[n.stem][1] * 0.12); c.lineTo(n.x + dx * 0.34 * (0.6 + 0.4 * k), n.y + dy * 0.34 * (0.6 + 0.4 * k)); c.stroke();
          c.fillStyle = ram ? '#FFD0B8' : '#FFE6B0'; c.beginPath(); c.arc(n.x + dx * 0.34, n.y + dy * 0.34, 0.07, 0, TAU); c.fill();
          if (ram) { c.strokeStyle = 'rgba(255,190,160,.8)'; c.lineWidth = 0.04; c.beginPath(); c.arc(n.x, n.y, 0.22, -2.6, -0.6); c.stroke(); c.beginPath(); c.arc(n.x, n.y, 0.22, 0.5, 2.5); c.stroke(); } }
        c.restore(); }
      // the ember's molten trail: hot behind it, cooling over a few seconds (kept burning once the yard is won)
      function trail2D(c) { const run = R.run; if (!run || run.trail.length < 2) return; const T = X.Tz(), ox = X.sx(0), oy = X.sy(0), won = run.done && !run.dead; c.save(); c.translate(ox, oy); c.scale(T, T); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
        const fadeEnd = run.dead ? clamp(1 - (R.t - run.endT) / 1.6, 0, 1) : 1;
        for (let i = 1; i < run.trail.length; i++) { const a = run.trail[i - 1], b = run.trail[i], age = R.t - b[2], k = (won ? 1 : clamp(1 - age / 3.2, 0.25, 1)) * fadeEnd; if (k < 0.02) continue;
          c.strokeStyle = `rgba(255,${Math.round(90 + 110 * k)},${Math.round(30 + 60 * k * k)},${(0.75 * k).toFixed(3)})`; c.lineWidth = 0.18; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
        c.restore(); }
      function ember2D(c) { const run = R.run; if (!run || run.pourT < POUR_T * 0.7 || (run.dead && R.t - run.endT > 0.25) || (run.done && !run.dead && R.t - run.endT > 0.5)) return; const T = X.Tz(), Xs = X.sx(run.x), Ys = X.sy(run.y) - T * 0.22, hot = run.kindled ? 1.3 : 1;
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; blitSized(c, glowSprite(run.kindled ? '#FFD890' : EMBER), Xs - T * 0.9 * hot, Ys - T * 0.9 * hot, T * 1.8 * hot, T * 1.8 * hot); c.globalAlpha = 1; c.fillStyle = run.kindled ? '#FFF4D8' : '#FFC24A'; c.beginPath(); c.arc(Xs, Ys, T * 0.16 * hot, 0, TAU); c.fill(); c.restore(); }
      function over2D(c) { ember2D(c); const T = X.Tz(); for (const fu of ['W', 'E']) if (S.furn[fu] && onScr(FURN[fu].x, FURN[fu].y, 3)) { const Xs = X.sx(FURN[fu].x), Ys = X.sy(FURN[fu].y) - T * 0.55; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 + 0.15 * Math.sin(g.t * 9); blitSized(c, glowSprite(EMBER), Xs - T * 1.3, Ys - T * 1.1, T * 2.6, T * 2.2); c.restore(); } labels(c); }
      function labels(c) { const Y = R.Y; if (!Y || R.mode === 'won' || S.phase !== 'puzzle') return; const T = X.Tz(); c.save(); c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.font = `800 ${Math.round(T * 0.22)}px ${arcFont}`;
        const goalId = YARDS[R.yard].goal; if (goalId !== 'D') { const f = FURN[goalId]; const Xs = X.sx(f.x), Ys = X.sy(f.y) - T * 3.0; c.fillStyle = LAVA_HI; c.strokeText('wake this furnace', Xs, Ys); c.fillText('wake this furnace', Xs, Ys); }
        for (const n of Object.values(Y.nodes)) { if (n.k === 'kiln') { const s = R.run && R.run.kindled ? 'kindled' : 'bellows kiln'; c.fillStyle = '#FFC890'; c.strokeText(s, X.sx(n.x), X.sy(n.y) - T * 2.55); c.fillText(s, X.sx(n.x), X.sy(n.y) - T * 2.55); }
          if (n.k === 'sink') { c.fillStyle = '#9FD8FF'; c.strokeText('quench', X.sx(n.x), X.sy(n.y) + T * 0.75); c.fillText('quench', X.sx(n.x), X.sy(n.y) + T * 0.75); }
          if (n.k === 'braz') { const on = R.run && R.run.braz.has(n.id); c.fillStyle = on ? LAVA_HI : PALE; c.strokeText(on ? 'burning' : 'brazier', X.sx(n.x), X.sy(n.y) - T * 1.75); c.fillText(on ? 'burning' : 'brazier', X.sx(n.x), X.sy(n.y) - T * 1.75); } }
        c.restore(); }
      // the hint: after three failed pours, the first lever that points the wrong way
      const hintNode = () => { if (!R.hinted || R.run || R.mode !== 'play') return null; return junctions().find(n => n.cur !== n.sol) || null; };

      /* ---- the GPU light ---- */
      function lightGround(c) { const F = fgx(); if (!F) return; const lf = lowFx(), T = X.Tz(), t = g.t; let Q = null; const q = () => Q || (Q = F.begin(c, null));
        // the yard: the channels' faint life, the junctions' tongues, the trail's molten light, the crucible's warmth, the furnaces, the kiln and the braziers
        if (R.Y && onScr(16.5, 28, 10)) { const Q2 = q(), Y = R.Y, fa = ease(R.fadeT / 0.6);
          if (!lf) for (const e of Y.edges) for (let k = 1; k < e.pts.length; k++) { const a = e.pts[k - 1], b = e.pts[k]; Q2.beam(X.sx(a[0]), X.sy(a[1]), X.sx(b[0]), X.sy(b[1]), T * 0.32, LAVA, 0.07 * fa); }
          for (const n of junctions()) { const [dx, dy] = DV[n.opts[n.cur]], hint = hintNode() === n; Q2.glow(X.sx(n.x + dx * 0.3), X.sy(n.y + dy * 0.3), T * 0.5, n.k === 'ram' ? CRIM : '#FFB347', 0.35 * fa); if (hint) Q2.glow(X.sx(n.x + n.lv[0]), X.sy(n.y + n.lv[1]) - T * 0.6, T * (1.2 + 0.2 * Math.sin(t * 5)), GOLD, 0.5); }
          const run = R.run; if (run && run.trail.length > 1) { const won = run.done && !run.dead, fe = run.dead ? clamp(1 - (R.t - run.endT) / 1.6, 0, 1) : 1, tr = run.trail;
            for (let i = 2; i < tr.length; i += 2) { const a = tr[i - 2], b = tr[i], k = (won ? 1 : clamp(1 - (R.t - b[2]) / 3.2, 0.2, 1)) * fe; if (k < 0.03) continue; Q2.ebeam(X.sx(a[0]), X.sy(a[1]), X.sx(b[0]), X.sy(b[1]), T * 0.3, LAVA, 0.8 * k, 0.7 * k, i * 0.37, 3); } }
          if (onScr(CRU.x, CRU.y, 3)) Q2.glow(X.sx(CRU.x), X.sy(CRU.y) - T * 0.2, T * 2.4, EMBER, 0.22 + 0.05 * Math.sin(t * 3));
          for (const o of kilns) if (o.node) { const kk = run && run.kindled ? clamp(1 - (R.t - (run.kilnT || 0)) / 2.5, 0.35, 1) : 0.12; Q2.glow(X.sx(o.x), X.sy(o.y), T * 1.6, EMBER, 0.2 + 0.4 * kk); }
          for (const o of troughs) if (o.node && !lf) Q2.caustic(X.sx(o.x), X.sy(o.y) - T * 0.25, T * 0.6, '#6FA8D8', 0.12, o.x, 0.5); }
        for (const fu of ['W', 'E']) { const f = FURN[fu]; if (!onScr(f.x, f.y, 4)) continue; const Q2 = q(), k = S.furnK[fu], goal = R.Y && YARDS[R.yard].goal === fu && S.phase === 'puzzle' && R.mode !== 'won'; Q2.glow(X.sx(f.x), X.sy(f.y) + T * 0.4, T * (2.0 + k * 1.6), EMBER, 0.12 + 0.35 * k + (goal ? 0.1 + 0.06 * Math.sin(t * 3) : 0), 0.5); }
        // the door: its threshold warm; once open, heat and embers pouring out across the yard
        if (onScr(DOORX, DOORY, 7)) { const Q2 = q(), dx = X.sx(DOORX), dy = X.sy(DOORY), o = ease(S.open);
          Q2.glow(dx, dy + T * 0.6, T * 3.4, EMBER, 0.1 + 0.2 * Math.max(S.lit / 3 * 0.6, o), 0.45);
          if (o > 0.02) { Q2.quad(138, dx, dy + T * 3.6, T * 4.6, 0, 0, T * 3.8, '#FF9A5A', 0.5 * o, 0.48, 2.1, lf ? 0 : 0.8); Q2.ground(dx, dy + T * 1.6, T * 2.6, 0.6, 0.35 * o, 4.2, 0.5, 0.6); }
          if (!lf) for (const m of S.mist) Q2.smoke(X.sx(m.x), X.sy(m.y), T * m.r, m.a, m.sd, '#5A2A1A', 0.6); }
        // the altar: its glyph's molten flow, the rings' running fire, heat at its heart, the lake's light round its rim
        if (onScr(AC.x, AC.y, ARX + 3)) { const Q2 = q(), ax = X.sx(AC.x), ay = X.sy(AC.y), hk = S.heatK;
          Q2.glow(ax, ay, T * 3.2, LAVA, (0.14 + 0.05 * Math.sin(t * 1.1)) * hk, 1);
          const flow = (pts, w, seed) => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; Q2.ebeam(X.sx(a[0]), X.sy(a[1]), X.sx(b[0]), X.sy(b[1]), T * w, LAVA, 0.85, (lf ? 0.35 : 0.5) * hk, seed + i * 0.31, 3); } };
          for (const pts of GLYPH) flow(pts, 0.32, 1.7); if (!lf) { flow(RING_L[0], 0.28, 4.1); flow(RING_L[1], 0.34, 7.3); Q2.shimmer(ax, ay - T * 0.5, T * 3.4, 0.25 * hk, 0.55); }
          if (!lf) for (let i = 0; i < 10; i++) { const a = -Math.PI + (i + 0.5) / 10 * TAU + Math.sin(t * 0.06 + i) * 0.1, p = spt(a), mx = AC.x + p[0] * ARX * 0.97, my = AC.y + p[1] * ARY * 0.97; if (my > WALLY - 1) continue; Q2.glow(X.sx(mx), X.sy(my) + T * 0.4, T * 2.2, LAVA, 0.12, 0.5); }
          for (const p of X.props || []) if (p.kind === 'agruin' && !p.broken) Q2.glow(X.sx(p.x), X.sy(p.y), T * 1.3, EMBER, 0.08, 0.45); }
        if (Q) F.flush(c); }
      function lightOver(c) { const F = fgx(); if (!F) return; const lf = lowFx(), T = X.Tz(), t = g.t; let Q = null; const q = () => Q || (Q = F.begin(c, null));
        // the ember, the pour, the kiln's and the braziers' fire, steam from a quench
        const run = R.run; if (run && R.Y) { const Q2 = q(); if (run.pourT < POUR_T && !run.done) { const u = run.pourT / POUR_T, px = X.sx(CRU.x), top = X.sy(CRU.y) - T * 0.9, bot = X.sy(CRU.y) - T * 0.05; Q2.firebeam(px, top, px, lerp(top, bot, ease(u * 1.6)), T * 0.16, 0.9, 0.9, 2.3, 5); Q2.glow(px, bot, T * 0.9 * ease(u), LAVA_HI, 0.6); }
          if (run.pourT >= POUR_T * 0.7 && !(run.dead && R.t - run.endT > 0.25) && !(run.done && !run.dead && R.t - run.endT > 0.5)) { const Xs = X.sx(run.x), Ys = X.sy(run.y) - T * 0.25, hot = run.kindled ? 1.3 : 1;
            Q2.glow(Xs, Ys, T * 1.3 * hot, run.kindled ? '#FFC870' : EMBER, 0.55); Q2.fire(Xs, Ys - T * 0.12, T * 0.42 * hot, run.kindled ? 1.05 : 0.8, 0.95, 3.3, 1.2); Q2.eorb(Xs, Ys, T * 0.2 * hot, run.kindled ? '#FFE8B0' : '#FFB060', 1, 0.9, 1.7, 2);
            if (!lf) for (let i = 0; i < 3; i++) { const u = (t * 2.4 + i / 3) % 1; Q2.star(Xs + Math.sin(i * 2.3 + t * 3) * T * 0.3, Ys - u * T * 0.9, T * 0.06, 0.8 * Math.sin(u * Math.PI), '#FFD0A0'); } } }
        for (const o of kilns) if (o.node && onScr(o.x, o.y - 1, 2)) { const Q2 = q(), kk = run && run.kindled ? clamp(1 - (R.t - (run.kilnT || 0)) / 2.5, 0.3, 1) : 0, bx = X.sx(o.x), by = X.sy(o.y) - T * 0.3; Q2.glow(bx, by, T * 0.8, EMBER, 0.2 + 0.4 * kk); if (kk > 0) Q2.fire(bx, by - T * 0.25, T * (0.4 + 0.5 * kk), 0.9, 0.9 * kk, 6.1, 1.4); }
        for (const o of brazs) if (o.node && onScr(o.x, o.y - 1, 2)) { const Q2 = q(), on = run && run.braz.has(o.node.id), bx = X.sx(o.x), by = X.sy(o.y) - T * 1.32; if (on) { Q2.fire(bx, by - T * 0.25, T * 0.5, 0.85, lf ? 0.65 : 0.9, o.x, 1.4); Q2.glow(bx, by, T * 1.2, EMBER, 0.35 + 0.06 * Math.sin(t * 9 + o.x)); } else Q2.glow(bx, by, T * 0.4, EMBER, 0.15); }
        for (const m of S.steam) { const Q2 = q(); Q2.smoke(X.sx(m.x), X.sy(m.y), T * m.r, 0.5 * Math.sin(Math.min(1, m.life / m.max) * Math.PI), m.sd, '#C8D8E8', 0.2); }
        // the furnaces' roar, the crucible's molten brim, the yard's columns' ember cages
        for (const fu of ['W', 'E']) { const f = FURN[fu], k = S.furnK[fu]; if (k < 0.02 || !onScr(f.x, f.y - 1, 3)) continue; const Q2 = q(), mx = X.sx(f.x), my = X.sy(f.y) - T * 0.55;
          Q2.glow(mx, my, T * 1.2, LAVA_HI, 0.5 * k); Q2.fire(mx, my - T * 0.05, T * 0.62 * k, 1.0, 0.95, fu === 'W' ? 1.1 : 2.2, 1.0); if (!lf) for (let i = 0; i < 2; i++) Q2.tongue(mx + (i - 0.5) * T * 0.5, my + T * 0.2, T * 0.22, T * (0.55 + 0.2 * Math.sin(t * 6 + i)) * k, (i - 0.5) * 0.3, 0.9, 0.7, i * 3.1 + (fu === 'W' ? 0 : 5));
          Q2.glow(X.sx(f.x) - T * 0.42 * 0.95, X.sy(f.y) - T * 1.74, T * 0.22, '#FF7A3A', 0.6 * k); Q2.glow(X.sx(f.x) + T * 0.42 * 0.95, X.sy(f.y) - T * 1.74, T * 0.22, '#FF7A3A', 0.6 * k); }
        if (onScr(CRU.x, CRU.y - 2, 2)) { const Q2 = q(); Q2.glow(X.sx(CRU.x), X.sy(CRU.y) - T * 2.1, T * 0.8, LAVA_HI, 0.35 + 0.08 * Math.sin(t * 2)); }
        for (const p of X.props || []) if (p.kind === 'agpillar' && !p.broken && p.v % 2 === 0 && onScr(p.x, p.y - 2.7, 1.5)) { const Q2 = q(), px = X.sx(p.x), py = X.sy(p.y) - T * 2.74; Q2.glow(px, py, T * 0.8, EMBER, 0.35 + 0.08 * Math.sin(t * 3 + p.x)); if (!lf) Q2.fire(px, py - T * 0.1, T * 0.28, 0.8, 0.7, p.x, 1.3); }
        // the door: its crest's ember breathing, the sockets lit as the yards burn; opening: fire up the jambs, the eyes, the seam, the heat pouring through
        if (onScr(DOORX, DOORY - 2.5, 7)) { const Q2 = q(), tp = AP(), G = tp ? tp.GEO : { WO: 1.22, L0: 3.25, JW: 0.6, JD: 0.42, stud: [-0.72, 0, 0.72], studZ: 3.6, crestZ: 4.55 }, dx = X.sx(DOORX), Yf = X.sy(DOORY), o = ease(S.open), fa = S.fade, kk = 0.34 * (G.JD + 0.06), jx = (G.WO + G.JW) * T;
          Q2.glow(dx, Yf - T * (G.crestZ + 0.42), T * 0.8, EMBER, (0.3 + 0.12 * Math.sin(t * 1.3)) * fa); Q2.glow(dx, Yf - T * (G.crestZ + 0.42), T * 0.2, '#FFE0A0', 0.6 * fa);
          for (let i = 0; i < 3; i++) { S.litK[i] += ((i < S.lit ? 1 : 0) - S.litK[i]) * Math.min(1, S.dt * 4); const k2 = S.litK[i]; if (k2 < 0.02) continue; const sx = dx + [G.stud[0], G.stud[2], G.stud[1]][i] * T, sy = Yf - T * (G.studZ - kk); Q2.glow(sx, sy, T * 0.55, EMBER, (0.5 + 0.2 * Math.sin(t * 3 + i)) * k2 * fa); Q2.fire(sx, sy - T * 0.05, T * 0.2, 0.9, 0.8 * k2 * fa, i * 2.1, 1); }
          if (S.climb > 0.01) { const h = S.climb * G.L0; for (const sd of [-1, 1]) { const x = dx + sd * jx; Q2.ebeam(x, Yf - T * 0.6, x, Yf - T * (0.6 + h * 0.85), T * 0.12, LAVA, 0.9, 0.85 * fa, sd * 2.2, 5); Q2.glow(x, Yf - T * (0.6 + h * 0.85), T * 0.5, LAVA_HI, 0.5 * fa); }
            const ek = clamp((S.climb - 0.85) / 0.15, 0, 1); if (ek > 0) for (const sd of [-1, 1]) Q2.glow(dx + sd * T * 0.4 * 0.95, Yf - T * (G.crestZ - 0.25), T * 0.3, '#FF7A3A', 0.9 * ek * fa); }
          if (S.phase === 'opening' || o > 0.01) { const top = Yf - T * (G.L0 - kk), bot = Yf - T * 0.2, sp = clamp((S.openT - 1.0) / 1.2, 0, 1) * (1 - o * 0.6); if (sp > 0.01) { Q2.beam(dx, top, dx, bot, T * 0.14, '#FFE8C8', 0.9 * sp * fa); Q2.beam(dx, top, dx, bot, T * 0.6, EMBER, 0.5 * sp * fa); }
            if (o > 0.01) { const w = G.WO * T * o; Q2.glow(dx, (top + bot) / 2, T * (1.2 + 1.2 * o), '#FFB070', 0.5 * o * fa); Q2.quad(138, dx, bot + T * 1.2, w * 1.4 + T * 0.2, 0, 0, T * 2.2, '#FFB080', 0.4 * o * fa, 0.5, 4.4, lf ? 0 : 1);
              if (!lf) for (let i = 0; i < 6; i++) { const u = (t * 0.3 + i / 6) % 1; Q2.star(dx + Math.sin(i * 2.3 + t) * w * 0.8, bot - (bot - top) * u, T * 0.07, 0.8 * Math.sin(u * Math.PI) * o * fa, '#FFC890'); } } } }
        // the altar: the monument's ember heart and the fire in its grooves, the fire basket, the shards' molten drips, embers rising
        if (onScr(ARCH.x, ARCH.y - 4, 6)) { const Q2 = q(), hx = X.sx(ARCH.x), hy = X.sy(ARCH.y) - T * 5.0; Q2.glow(hx, hy, T * 1.6, EMBER, (0.35 + 0.1 * Math.sin(t * 1.4)) * S.archFade * S.heatK); Q2.eorb(hx, hy, T * 0.34, '#FF8A3D', 1, 0.8 * S.archFade, 2.2, 1); }
        if (onScr(AC.x, AC.y, ARX + 4)) { const Q2 = q();
          for (const p of X.props || []) if (p.kind === 'agruin' && p.v === 2 && !p.broken && onScr(p.x, p.y - 3.4, 2)) { const px = X.sx(p.x), py = X.sy(p.y) - T * 3.65; Q2.fire(px, py, T * 0.55, 0.9, lf ? 0.6 : 0.9, p.x, 1.3); Q2.glow(px, py, T * 1.3, EMBER, 0.35); }
          if (!lf) { for (const m of SHARDS) { if (!onScr(m.x, m.y - 2, 2.5)) continue; const bob = Math.sin(t * 0.7 + m.ph) * 0.22, mx = X.sx(m.x), my = X.sy(m.y) - T * (m.lift + bob); Q2.glow(mx, my - T * 0.5 * m.s, T * 0.9 * m.s, EMBER, 0.2 + 0.08 * Math.sin(t * 1.3 + m.ph)); const u = (t * 0.6 + m.ph) % 1; Q2.glow(mx + T * 0.1, my + u * T * (m.lift + 0.5), T * 0.12, LAVA_HI, 0.7 * (1 - u)); }
            for (let i = 0; i < 14; i++) { const u = (t * 0.07 + i / 14) % 1, a = i * 2.39, rr = 0.15 + 0.75 * hh(i, 4), p = spt(a), mx = AC.x + p[0] * ARX * rr, my = AC.y + p[1] * ARY * rr; Q2.star(X.sx(mx) + Math.sin(t * 0.6 + i) * T * 0.3, X.sy(my) - T * u * 3.5, T * 0.07, 0.75 * Math.sin(u * Math.PI), '#FFB070'); } } }
        if (Q) F.flush(c); labels(c); }

      /* ---- the stage's turn ---- */
      function update(dt) { R.t += dt; S.t += dt; S.dt = dt; R.fadeT += dt;
        { const tp = AP(); if (tp && !tp.base && tp.setBase) tp.setBase(X.Tz() / (g.zoom || 1) * Math.min(2, (typeof arc !== 'undefined' && arc.dpr) || 1)); }   // (no loading pass ran: the floor's sharpness, once)
        for (const fu of ['W', 'E']) S.furnK[fu] += ((S.furn[fu] ? 1 : 0) - S.furnK[fu]) * Math.min(1, dt * 2.5);
        S.heatK += (S.heat - S.heatK) * Math.min(1, dt * 2);
        step(dt);
        for (const m of S.steam) { m.life += dt; m.y += m.vy * dt; m.r += dt * 0.4; } for (let i = S.steam.length - 1; i >= 0; i--) if (S.steam[i].life >= S.steam[i].max) S.steam.splice(i, 1);
        if (S.phase === 'opening') { S.openT += dt; const u = S.openT; S.climb = clamp(u / 0.9, 0, 1);
          if (u > 0.9 && u - dt <= 0.9) { X.shake(4, 0.6); note(98, 2.6, 'sawtooth', 0.12, 70); note(49, 3.0, 'sine', 0.22); sfx('thud'); }
          S.bar = clamp((u - 1.0) / 0.9, 0, 1); if (u > 1.0 && u - dt <= 1.0) sfx('crack');
          if (u > 2.0) S.open = clamp((u - 2.0) / 2.2, 0, 1);
          if (u > 2.0 && u - dt <= 2.0) { X.shake(7, 1.6); sfx('whoosh'); }
          if (S.open > 0.75 && !S.passable) setDoor(true);
          if (u > 2.1 && !lowFx() && S.mist.length < 14 && Math.random() < dt * 6) S.mist.push({ x: DOORX + (Math.random() - 0.5) * 2.2, y: DOORY + 0.3, vx: (Math.random() - 0.5) * 0.9, vy: 0.9 + Math.random() * 0.8, r: 1.0 + Math.random() * 1.0, a: 0, life: 0, max: 3.5 + Math.random() * 2, sd: Math.random() * 9 });
          if (u >= OPEN_T) opened(); }
        if (S.phase === 'open') { if (me.y < WALLY - 0.9 && Math.abs(me.x - DOORX) < 6 && !me.dead) seal(); else if (!lowFx() && S.mist.length < 8 && Math.random() < dt * 1.2) S.mist.push({ x: DOORX + (Math.random() - 0.5) * 2.2, y: DOORY + 0.3, vx: (Math.random() - 0.5) * 0.6, vy: 0.5 + Math.random() * 0.5, r: 0.9 + Math.random() * 0.8, a: 0, life: 0, max: 4 + Math.random() * 2, sd: Math.random() * 9 }); }
        if (S.phase === 'sealing') { S.sealT += dt; S.open = clamp(1 - S.sealT / SEAL_T, 0, 1); if (S.sealT >= SEAL_T) sealed(); }
        for (const m of S.mist) { m.life += dt; m.x += m.vx * dt; m.y += m.vy * dt; m.vy *= 1 - dt * 0.3; m.r += dt * 0.35; m.a = 0.35 * Math.sin(Math.min(1, m.life / m.max) * Math.PI); } for (let i = S.mist.length - 1; i >= 0; i--) if (S.mist[i].life >= S.mist[i].max) S.mist.splice(i, 1);
        // the door and the monument grow faint while something stands behind them
        const B = AB(), boss = g.boss && !g.boss.dead ? g.boss : null, behind = (x, y, w) => y < DOORY - 0.2 && y > DOORY - 5.8 && Math.abs(x - DOORX) < w, behindA = (x, y, w) => y < ARCH.y - 0.1 && y > ARCH.y - 7 && Math.abs(x - ARCH.x) < w;
        const hid = behind(me.x, me.y, 3.6) || (boss && behind(boss.x, boss.y, 3.6 + (boss.r || 1))); S.fade += ((hid ? 0.42 : 1) - S.fade) * Math.min(1, dt * 6);
        const hidC = me.y < CRU.y - 0.2 && me.y > CRU.y - 3.8 && Math.abs(me.x - CRU.x) < 2.0; S.cruFade += ((hidC ? 0.42 : 1) - S.cruFade) * Math.min(1, dt * 6);   // (the crucible too)
        const hidA = behindA(me.x, me.y, 4.4) || (boss && behindA(boss.x, boss.y, 4.4 + (boss.r || 1))); S.archFade += ((hidA ? 0.42 : 1) - S.archFade) * Math.min(1, dt * 6);
        if (S.phase === 'boss' && B && typeof B.update === 'function') { try { B.update(dt); } catch (e) { if (typeof console !== 'undefined') console.error(e); } } }
      const doorHint = { x: DOORX, y: DOORY - 0.4, h: 4.6, label: 'The great door' };
      const crucibleHint = { x: CRU.x, y: CRU.y, h: 3.4, label: 'Pour the ember' };
      const mod = { R, S, YARDS, flip, pour, load, junctions, solve() { if (S.phase !== 'puzzle') return; R.run = null; R.mode = 'won'; S.lit = 3; S.furn.W = S.furn.E = 1; buttons(); startOpen(); },   /* (tests: straight to the door) */ get yard() { return R.Y; }, door, arch, shards, lev, crucible, geo: { AC, ARX, ARY, SEN, WALLY, DOORX, DOORY, CRU, FURN, RINGS, GLYPH, WALL_Y }, arena: arenaA, update,
        hint() { if (S.phase === 'open') return doorHint; if (R.mode !== 'play' || R.run) return null; const n = hintNode(); if (n) return { x: n.x + n.lv[0], y: n.y + n.lv[1], h: 1.6, label: 'Turn this lever' }; if (R.pours === 0 && R.t > 14) return crucibleHint; return null; },
        goal: () => { if (S.phase === 'boss') { const B = AB(); return B && typeof B.goal === 'function' ? B.goal() : 'Face what waits on the Cataclysm Altar'; }
          if (S.phase === 'won' || self.done) return 'Aries awakens'; if (S.phase === 'opening') return 'The great door opens…'; if (S.phase === 'open') return 'Walk through the great door'; if (S.phase === 'sealing') return 'The door seals behind you';
          if (R.mode === 'intro' || !R.Y) return 'The Ember Switchyard'; if (R.mode === 'won') return 'The Ramforge burns'; const Y = YARDS[R.yard]; return `${Y.name} · ${R.run ? (R.run.done ? (R.run.dead ? 'the ember is lost' : 'it burns!') : 'the ember runs…') : 'set the levers, then pour'}`; },
        cam() { if (S.phase === 'opening') return { x: DOORX, y: DOORY - 1.4, k: 0.9 }; if (S.phase === 'boss') { const B = AB(); if (B && typeof B.cam === 'function') { try { return B.cam(); } catch (e) {} } } return null; },
        hideHud() { const B = AB(); return S.phase === 'boss' && B && typeof B.hideHud === 'function' ? !!B.hideHud() : false; },
        onBossDeath(m) { const B = AB(); return S.phase === 'boss' && B && typeof B.onBossDeath === 'function' ? !!B.onBossDeath(m) : false; },
        drawGround(c) { if (R.Y) { if (R.prevY && R.fadeT < 0.6) railsPath(c, R.prevY, 1 - ease(R.fadeT / 0.6)); railsPath(c, R.Y, ease(R.fadeT / 0.6)); trail2D(c); } if (fgx()) lightGround(c); const B = AB(); if (S.phase === 'boss' && B && typeof B.drawGround === 'function') { try { B.drawGround(c); } catch (e) {} } },
        drawOver(c) { const B = AB(); if (S.phase === 'boss' && B && typeof B.drawOver === 'function') { try { B.drawOver(c); } catch (e) {} }
          if (!R.Y || self.done || R.mode === 'won' || S.phase !== 'puzzle') return; const W = X.W(), bw = Math.min(280, W - 130), Y = YARDS[R.yard]; c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; GFX.rr(c, 10, 124, bw, 52, 8); c.fill(); c.font = `800 10.5px ${arcFont}`; c.textAlign = 'left'; c.fillStyle = '#FFFFFF';
          c.fillText('Set the levers, then pour. The ember rolls', 18, 139); c.fillText('by itself; from a side branch it runs to the stem.', 18, 151); c.fillStyle = LAVA_HI; c.fillText(`${Y.name} · ${Y.need === 'kiln' ? 'kindle it in the kiln first' : Y.need === 'braz' ? 'both braziers, then the door' : 'the west furnace'}`, 18, 165); c.restore(); },
        leave() { if (R.el) { R.el.remove(); R.el = null; } },
        teardown };
      function teardown() { if (R.el) { R.el.remove(); R.el = null; } const B = AB(); if (B && typeof B.stop === 'function') { try { B.stop(); } catch (e) {} } if (CUR && CUR.S === S) CUR = null; S.mist.length = 0; S.steam.length = 0; R.run = null; }
      LIVE = mod;
      return mod;
    },
  });
  // (the Caldera's own warm-ups on the loading screen, its brood, vents and guardians, are not for its gate: skipped there)
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.caldera; if (Rf && !Rf.__agGate) { const o = Rf.preload; Rf.__agGate = 1; Rf.preload = function (P) { if (P && P.F && P.F.rift && P.F.rift.gate) return []; return o ? o.apply(this, arguments) : []; }; } } catch (e) {}
  /* ---- letting go: when the dungeon game closes (its destroy) and whenever a new stage is made (BEL.releaseStale) the gate's
     boss is stopped, its button removed and every picture given back ---- */
  let LIVE = null;
  function release() { const m = LIVE; LIVE = null; CUR = null; if (m) { try { m.teardown(); } catch (e) {} } try { STANDIN.stop(); } catch (e) {} const tp = AP(); if (tp) { try { tp.release(); } catch (e) {} } }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { if (LIVE || CUR) release(); }); } catch (e) {}
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__agRel) { const c0 = GD.create; GD.__agRel = 1; GD.create = function () { const api = c0.apply(this, arguments); if (api && typeof api.destroy === 'function') { const d0 = api.destroy; api.destroy = function () { if (LIVE) release(); return d0.apply(this, arguments); }; } return api; }; } } catch (e) {}
  if (typeof window !== 'undefined') window.ARIES_GATE = { get live() { return LIVE; }, release, LAYOUT, RUINS, SHARDS, AC, ARX, ARY, SEN, WALLY, DOORX, DOORY, YARDS, RINGS, GLYPH, STANDIN, buildYard };
})();
