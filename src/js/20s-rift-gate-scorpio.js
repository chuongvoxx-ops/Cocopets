/* ---------- v445 AG: Gate 03, Scorpio: The Amber Vigil (the Mouth Beneath the Dunes' Anima gate) ----------
   High over the night desert, under the fossil jaw's violet dark, a walled courtyard of sandstone and amber glass keeps the
   Scorpio star. Its great door in the north wall is clasped by a bronze scorpion: its pincers lock the leaves' seam, its
   tail curls over its back round a dark star. THE AMBER VIGIL: three star shards lie on altars in the courtyard's far
   corners; bring each back to the door's threshold (the sanctuary: nothing sees into it). Four watch-stones keep the
   courtyard, each an amber eye on a menhir whose gaze falls on the floor as a cone of amber light; the columns, statues and
   boulders cast real shadows in it (stand in a shadow and the gaze passes over you). The light that falls on the pet
   brightens over half a second (its eye flares, the light round the pet turns white-gold): step out of it in time and
   nothing happens; held in it, the pet is seen and the vigil's light carries it back to the sanctuary (a shard it carries
   flies home to its altar; the shards already at the door stay). Three wings, three lessons:
     the Claw (west)   a watch-stone turning round and round: wait in the shadows of the columns and stones for it to pass.
     the Sting (east)  a watch-stone sweeping to and fro over the east lane; a decoy chime by the north wall: ring it
                       (stand beside it) and that stone stares at the chime for seven seconds: step away from the sound.
     the Heart (south) two watch-stones that hold a heading and turn a quarter at a time (their next heading shows faintly
                       before they turn); its altar fenced by Asmodeus's ruby threads, which tighten and slacken in turn
                       (a taut thread binds the pet and rings: every stone near turns toward it): pass while they are
                       slack; a chime north of the first thread turns both stones away.
   Seen three times, the vigil tires (its stones turn a fifth slower; six times, a third). The great door opens when the third
   shard is home: the shards rise from the lintel's sockets into the dark star in the scorpion's tail and it ignites, light
   runs down the tail, the scorpion's eyes wake, its pincers swing open, its tail uncoils and lifts the burning star high
   over the door like a lantern, and the amber leaves slide apart (violet light and dust pour out).
   Beyond waits THE AMBER SANCTUM: a platform of obsidian flagstones laid in rings over the night desert, a great rune ring of
   gold and amber in its heart (two rings, a heptagram, the Scorpio sign; the GPU's Scorpio sigil burns on it), six obsidian
   thread posts round it and the Sevenfold Crown on its north rim (seven obsidian blades tipped with ruby round a ruby heart:
   the seventh anchor), slack ruby threads strung from post to post, four columns of obsidian and amber for cover, six broken
   ones on its rim, three amber fonts in its floor, amber shards held up in the air round it; past its edge the dunes' own
   anchored night (DUNE_SKY.vista in a land of this gate's: violet dusk, fossil ribs and fangs on the dune ranges, amber
   fireflies) under a blood moon. Nothing slides with the camera (screen = world - camera).
   Step through and the door seals behind: Asmodeus, The Fester, is fought there (SCORPIO_BOSS, 20s2); until it exists a
   stand-in guardian (the Amber Warden, an ordinary lesser boss in the engine) holds the sanctum, and beating it wins the gate.
   window.__SG_NOBOSS = 1: Scorpio wakes as the door seals (for tests).
   CONTRACT WITH THE BOSS (SCORPIO_BOSS, all optional but begin; the same as the Gates of Taurus and Aries): when the pet
   crosses into the sanctum the door seals and SCORPIO_BOSS.begin(X, H, self, A) is called, A = { cx, cy, r, rx, ry, sen, ax0,
   ay0, ax1, ay1, door: { x, y }, inside(x, y), solid(x, y), rings: [r0, r1], sigil(k), moon(k), web(k), font(i, k), crown: { x,
   y, heart: { x, y } }, anchors: [{ x, y }] x7, pillars: [{ x, y, r }] x4, ruins: [{ x, y, r }] x6, fonts: [{ x, y, r }] x3 }
   (world tiles: the sanctum's centre, its radius (the smaller half axis) and half axes, the rounded ellipse's exponent
   (inside: |dx/rx|^sen + |dy/ry|^sen <= 1), its walkable bounds, the sealed door's foot; solid(x, y) true on the solid tiles:
   the crown's dais, the posts, the columns and ruins; the rune rings' radii about the centre (the GPU sigil's outer ring is
   r1); sigil(k) how hard the rune ring and its heptagram burn, 0..2 (1 at rest; the light follows within a second); moon(k)
   the blood moon's glow, 0..2; web(k) the slack ruby threads strung between the anchors, 0..1 (1 shown: a boss whose own
   threads take the posts can set 0); font(i, k) how bright amber font i burns, 0..2 (0.35 at rest: a boss can light one as
   a cleansing pool); the crown (its dais's foot and the ruby heart in it); the seven thread anchors (0 the crown's ruby
   heart, 1..6 the obsidian posts clockwise from the north-east); the four cover columns about the centre (solid, never
   broken: they stand as long as the stage); the six broken rim columns; the three fonts (flat in the floor, walkable)); then
   every frame SCORPIO_BOSS.update(dt), drawGround(c), drawOver(c), and cam(), goal(), hideHud(), onBossDeath(m) when asked;
   SCORPIO_BOSS.stop() when the stage closes. The boss calls X.winStage() itself when Asmodeus falls (21b's gateFinish then
   marks the gate done and unlocks the 'scorpio' Anima).
   Pictures: SCORPIO_PROPS (20s1-scorpio-props.js), painted once by the Belfry's shading pass; floors and walls are this file's
   own lands ('vigil': the courtyard, 'vigilsanct': the sanctum), painted into the engine's cached ground chunks; the backdrop
   ('vigilsky') is the gap's. Light (the gazes on the floor (FGFX kind 336, "v445 AG": each cone laid as sectors cut by the
   shadows), the eyes, the shards, the threads, the chimes' rings, the sanctuary, the door's star and its opening, the
   sanctum's sigil, its fonts, the crown's heart, the threads, the shards in the air, motes) is drawn on the GPU (NIDHOGG_MOVES.FGFX)
   where a real GPU draws; elsewhere the pictures and floors stand and the gazes, shards, threads and eyes are drawn in 2D.
   lowFx keeps the light that tells the puzzle and the door.
   Memory: every picture is given back when the stage closes (SCORPIO_PROPS.release, through the dungeon game's destroy and
   BEL.onRelease). Test hooks (the stage module): solve(), take(id), bank(), ring(id), litAt(x, y, t), stoneA(st, t),
   taut(th, t), blocked(x, y), R, S, geo, arena(); window.__SG_BOSS (a boss to stand in), __SG_NOBOSS = 1, __SG_GL = 0 (no GPU light). */
(() => {
  const TAU = Math.PI * 2, PI = Math.PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const hh = (a, b, s) => { let n = (a * 374761393 + b * 668265263 + (s || 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const md = (a, n) => ((a % n) + n) % n;
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const SP = () => (typeof SCORPIO_PROPS !== 'undefined' ? SCORPIO_PROPS : null);
  const fgx = () => { try { if (typeof window !== 'undefined' && (window.__SG_GL === 0 || window.__DUN_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const AMB = '#FFC46A', AMB_HI = '#FFE2A0', HOT = '#FFF3D6', VIO = '#B983F5', VIO_HI = '#DCC2FF', RUBY = '#FF3C6E', PINK = '#FF9BD2', GOLD = '#FFD36B', PALE = '#FFF0DC', INK = '#2B2433', WARN = '#FFB0C8';

  /* ======================= the plan (world tiles: a layout cell (i, j) is world tile (i + 1, j + 1)) ======================= */
  const W0 = 33, H0 = 37;
  const AC = { x: 17.5, y: 13.5 }, ARX = 11.6, ARY = 8.2, SEN = 2.25;   // the sanctum: a rounded ellipse of walkable obsidian
  const WALLY = 22, DOORX = 17.5, DOORY = 23.0;                          // the wall between, the door's foot (its floor line)
  const se = (u, v) => Math.pow(Math.abs(u), SEN) + Math.pow(Math.abs(v), SEN);
  const spt = a => { const c = Math.cos(a), s = Math.sin(a); return [Math.sign(c) * Math.pow(Math.abs(c), 2 / SEN), Math.sign(s) * Math.pow(Math.abs(s), 2 / SEN)]; };
  const inArena = (x, y) => y < WALLY && se((x + 0.5 - AC.x) / ARX, (y + 0.5 - AC.y) / ARY) <= 1;
  const CH = { x0: 5, x1: 29, y0: 23, y1: 36 };
  const inChamber = (x, y) => { if (y < CH.y0 || y > CH.y1 || x < CH.x0 || x > CH.x1) return false; const c = Math.max(0, y - 34); return x >= CH.x0 + c && x <= CH.x1 - c; };
  /* the vigil's pieces (tiles). Watch-stones: spin (a0 + w t), sweep (mid + amp sin(2 pi t / per)), step (holds each heading
     `hold` s, turns to the next in `turn` s) */
  const STONES = [
    { id: 'W1', tx: 10, ty: 29, mode: 'spin', w: 0.6, a0: -2.2, range: 6.2, half: 0.38 },
    { id: 'W2', tx: 24, ty: 28, mode: 'sweep', mid: 0.3, amp: 1.3, per: 7.0, ph: 0.6, range: 6.6, half: 0.36 },
    { id: 'W3', tx: 13, ty: 32, mode: 'step', heads: [0, -PI / 2, PI, PI / 2], hold: 2.4, turn: 0.7, range: 6.0, half: 0.38 },
    { id: 'W4', tx: 21, ty: 32, mode: 'step', heads: [PI, -PI / 2, 0, PI / 2], hold: 2.4, turn: 0.7, range: 6.0, half: 0.38 } ];
  const CHIMES = [{ id: 'C1', tx: 20, ty: 24, stones: ['W2'] }, { id: 'C2', tx: 17, ty: 26, stones: ['W3', 'W4'] }];
  const ALTARS = [{ id: 'W', tx: 6, ty: 33, name: 'the Claw' }, { id: 'E', tx: 28, ty: 33, name: 'the Sting' }, { id: 'S', tx: 17, ty: 35, name: 'the Heart' }];
  const THREADS = [{ id: 'T1', a: [15.5, 27.5], b: [19.5, 27.5], ph: 0 }, { id: 'T2', a: [15.5, 33.5], b: [15.5, 36.5], ph: 1.7 }, { id: 'T3', a: [19.5, 33.5], b: [19.5, 36.5], ph: 3.4 }];
  const THR = { per: 5.2, taut: 3.2, tell: 0.7 };   // (a thread's cycle: taut for 3.2 s, slack for 2.0, flickering for 0.7 s before it tightens)
  const COVERS = [[8, 27, 'pillar', 0], [7, 29, 'rock', 0], [8, 31, 'rock', 1], [12, 26, 'statue', 0], [11, 32, 'pillar', 1], [14, 29, 'pillar', 0],
    [27, 25, 'pillar', 1], [27, 29, 'statue', 1], [26, 31, 'rock', 0], [22, 26, 'pillar', 2], [20, 29, 'pillar', 0]];
  const SAFE = { x: DOORX, y: DOORY, r: 2.7 };   // (the sanctuary: a half disc before the door)
  const START = { x: 17.5, y: 24.6 };
  // the sanctum's pieces
  const RINGS = [3.6, 5.6], SIG_R = RINGS[1] / 0.96;   // (the rune rings; the GPU sigil's quad radius: its outer ring on r1)
  const CROWN = { x: 17.5, y: 5.6, heart: { x: 17.5, y: 6.1 }, solid: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5], [19, 5], [20, 5]] };
  const ANCH = (() => { const out = [{ x: CROWN.heart.x, y: CROWN.heart.y, crown: true }]; for (let k = 1; k < 7; k++) { const a = -PI / 2 + k * TAU / 7; out.push({ x: Math.floor(AC.x + Math.cos(a) * 8.2) + 0.5, y: Math.floor(AC.y + Math.sin(a) * 6.5) + 0.5 }); } return out; })();
  const PILLARS = [[-60, 0], [-120, 0], [60, 1], [120, 1]].map(([d]) => { const a = d * PI / 180; return { x: Math.floor(AC.x + Math.cos(a) * 4.6 * 1.3) + 0.5, y: Math.floor(AC.y + Math.sin(a) * 4.6) + 0.5, r: 0.55 }; });
  const RUINS = [[6, 13, 0], [28, 13, 0], [8, 8, 1], [27, 18, 1], [26, 8, 2], [8, 18, 2]].map(([x, y, v]) => ({ x: x + 0.5, y: y + 0.5, r: 0.55, v }));
  const FONTS = [-90, 30, 150].map(d => { const a = d * PI / 180; return { x: AC.x + Math.cos(a) * 4.6 * 1.13, y: AC.y + Math.sin(a) * 4.6, r: 0.78 }; });
  const LAYOUT = (() => { const rows = []; const at = new Map(); const mark = (x, y, ch) => at.set(x + ',' + y, ch);
    mark(17, 22, 'D'); mark(16, 22, 'd'); mark(18, 22, 'd'); mark(17, 13, 'A'); mark(Math.floor(START.x), Math.floor(START.y), 'S');
    for (let j = 0; j < H0; j++) { let s = ''; for (let i = 0; i < W0; i++) { const x = i + 1, y = j + 1, m = at.get(x + ',' + y);
      if (m && (m === 'D' || m === 'd' || inArena(x, y) || inChamber(x, y))) { s += m; continue; }
      if (inArena(x, y) || inChamber(x, y)) { s += '.'; continue; }
      let wall = false; if (y >= WALLY) for (let dy = -1; dy <= 1 && !wall; dy++) for (let dx = -1; dx <= 1; dx++) if (inChamber(x + dx, y + dy)) { wall = true; break; }
      s += wall ? '#' : '~'; } rows.push(s); }
    return rows; })();
  // amber shards held up round the sanctum (seen past its rim)
  const FRAGS = []; for (let i = 0; i < 12; i++) { const a = -PI * 1.12 + i / 11 * PI * 1.24 + (hh(i, 3) - 0.5) * 0.12; if (Math.abs(a + PI / 2) < 0.34) continue; const k = 1.12 + hh(i, 5) * 0.2, p = spt(a);
    FRAGS.push({ x: AC.x + p[0] * ARX * k, y: AC.y + p[1] * ARY * k, v: i % 3, ph: hh(i, 7) * TAU, s: 0.85 + hh(i, 9) * 0.5, lift: 0.9 + hh(i, 11) * 1.5, dir: i % 2 ? 1 : -1 }); }
  const MOON = { x: AC.x + 4.6, y: -0.4 };   // (the blood moon's place in the world: over the sanctum's north rim, past the crown)
  // the sanctum's heptagram: seven chords of the outer ring, each joining every third point
  const HEPTA = (() => { const out = []; for (let k = 0; k < 7; k++) { const a0 = -PI / 2 + k * TAU / 7, a1 = -PI / 2 + ((k + 3) % 7) * TAU / 7; out.push([[AC.x + Math.cos(a0) * RINGS[1], AC.y + Math.sin(a0) * RINGS[1]], [AC.x + Math.cos(a1) * RINGS[1], AC.y + Math.sin(a1) * RINGS[1]]]); } return out; })();

  /* ======================= the vigil's rules (pure functions of the stones' clock: the tests plan with them) ======================= */
  const PROTO = STONES.map(s => Object.assign({ x: s.tx + 0.5, y: s.ty + 0.5 }, s));
  function schedA(s, t) { if (s.mode === 'spin') return s.a0 + s.w * t; if (s.mode === 'sweep') return s.mid + s.amp * Math.sin(TAU * t / s.per + s.ph);
    const seg = s.hold + s.turn, n = s.heads.length, u = md(t, seg * n), i = Math.floor(u / seg), f = u - i * seg, a = s.heads[i]; if (f < s.hold) return a; return a + angD(s.heads[(i + 1) % n], a) * ease((f - s.hold) / s.turn); }
  // (a step stone's next heading and how near its turn is: 0 .. 1 over the hold's last 0.9 s; null for the others)
  function nextOf(s, t) { if (s.mode !== 'step') return null; const seg = s.hold + s.turn, n = s.heads.length, u = md(t, seg * n), i = Math.floor(u / seg), f = u - i * seg; if (f >= s.hold) return null; return { a: s.heads[(i + 1) % n], k: clamp((f - (s.hold - 0.9)) / 0.9, 0, 1) }; }
  const OCC = [];   // the shadow casters: [x, y, r]
  COVERS.forEach(([x, y]) => OCC.push([x + 0.5, y + 0.5, 0.58])); PROTO.forEach(s => OCC.push([s.x, s.y, 0.42, s.id])); ALTARS.forEach(a => OCC.push([a.tx + 0.5, a.ty + 0.5, 0.45])); CHIMES.forEach(c => OCC.push([c.tx + 0.5, c.ty + 0.5, 0.3]));
  // how far a ray from (x0, y0) along (dx, dy) runs (at most L) before cover or the courtyard's walls stop it
  function rayLen(x0, y0, dx, dy, L, skip) { let t = L;
    for (const o of OCC) { if (o[3] === skip) continue; const ox = o[0] - x0, oy = o[1] - y0, b = ox * dx + oy * dy; if (b < 0 || b - o[2] > t) continue; const c = ox * ox + oy * oy - o[2] * o[2], d = b * b - c; if (d < 0) continue; const q = b - Math.sqrt(d); if (q > 0 && q < t) t = q; else if (c < 0) t = 0; }
    const bx = dx > 0 ? (CH.x1 + 1 - x0) / dx : dx < 0 ? (CH.x0 - x0) / dx : 1e9, by = dy > 0 ? (CH.y1 + 1 - y0) / dy : dy < 0 ? (CH.y0 - y0) / dy : 1e9; return Math.max(0, Math.min(t, bx, by)); }
  // is (x, y) in stone s's lit gaze when it looks along a? (its eye's range and half angle, cut by cover)
  function seesAt(s, a, x, y) { const dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy); if (d > s.range || d < 0.3) return false; if (Math.abs(angD(Math.atan2(dy, dx), a)) > s.half) return false; return rayLen(s.x, s.y, dx / d, dy / d, d + 0.01, s.id) >= d; }
  const inSafe = (x, y) => y > SAFE.y - 0.4 && Math.hypot(x - SAFE.x, y - SAFE.y) < SAFE.r;
  // a thread's tautness at time t: 1 taut .. 0 slack (it eases over 0.3 s), and its warning flicker before it tightens
  function taut(th, t) { const u = md(t + th.ph, THR.per); if (u < THR.taut) return u < 0.25 ? u / 0.25 : u > THR.taut - 0.3 ? (THR.taut - u) / 0.3 : 1; return 0; }
  function tellOf(th, t) { const u = md(t + th.ph, THR.per); return u > THR.per - THR.tell ? (u - (THR.per - THR.tell)) / THR.tell : 0; }
  const segD = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1e-6, u = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / l, 0, 1); return Math.hypot(px - a[0] - dx * u, py - a[1] - dy * u); };
  // the solid tiles of the courtyard and the sanctum the gate lays itself (each drawn by its own picture)
  const SOLIDS = [...COVERS.map(([x, y]) => [x, y]), ...STONES.map(s => [s.tx, s.ty]), ...CHIMES.map(c => [c.tx, c.ty]), ...ALTARS.map(a => [a.tx, a.ty]),
    ...THREADS.flatMap(th => [[Math.floor(th.a[0]), Math.floor(th.a[1])], [Math.floor(th.b[0]), Math.floor(th.b[1])]]),
    ...CROWN.solid, ...ANCH.slice(1).map(p => [Math.floor(p.x), Math.floor(p.y)]), ...PILLARS.map(p => [Math.floor(p.x), Math.floor(p.y)]), ...RUINS.map(p => [Math.floor(p.x), Math.floor(p.y)])];
  const SOLID_SET = new Set(SOLIDS.map(([x, y]) => x + ',' + y));

  /* ======================= the floors (painted into the engine's cached chunks, once) ======================= */
  const blob = (c, p, r, col, a) => { const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.6, `rgba(${col},${a * 0.4})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); };
  // the Scorpio sign (three stems, two arches, a tail ending in a sting; s its height, centred on x, y)
  function sign(c, x, y, s, col, lw) { c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; const u = s / 1.1, top = y - s * 0.4, bot = y + s * 0.42;
    c.beginPath(); c.moveTo(x - u * 0.5, bot); c.lineTo(x - u * 0.5, top); c.arc(x - u * 0.25, top, u * 0.25, PI, 0); c.lineTo(x, bot); c.moveTo(x, top); c.arc(x + u * 0.25, top, u * 0.25, PI, 0); c.lineTo(x + u * 0.5, bot - u * 0.12); c.quadraticCurveTo(x + u * 0.55, bot + u * 0.12, x + u * 0.82, bot + u * 0.12); c.stroke();
    c.beginPath(); c.moveTo(x + u * 0.66, bot + u * 0.0); c.lineTo(x + u * 0.86, bot + u * 0.12); c.lineTo(x + u * 0.7, bot + u * 0.26); c.stroke(); c.restore(); }
  const VT = ['#4C363A', '#463236', '#523B3E', '#402E33', '#4A3539'];
  const edgeOf = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([a, b]) => !inChamber(x + a, y + b) && !(y + b === WALLY && Math.abs(x + a + 0.5 - DOORX) < 1.6));
  const HS = 0.56, HSQ = Math.sqrt(3);
  const amberHex = (q, r) => { const cx = q * HS * 1.5, cy = HS * HSQ * (r + q / 2); for (const s of PROTO) { const d = Math.hypot(cx - s.x, cy - s.y); if (d > 1.05 && d < 1.75) return true; } return hh(q >> 2, (r + (q & 3)) >> 2, 5) < 0.18 && hh(q, r, 6) < 0.85; };
  /* the courtyard's floor: hexagonal sandstone pavers (sand in their joints), broad patches of dark amber glass and a ring of
     glass round each watch-stone; a border of wind-blown sand along the walls; before the door the sanctuary's threshold, a
     half disc of bronze-rimmed stone with the Scorpio sign in gold */
  function vigilFloor(c, X, Y, T, x, y) {
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip(); c.fillStyle = '#1C1218'; c.fillRect(X, Y, T, T);
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T];
    for (let q = Math.floor((x - 1.5) / (HS * 1.5)); q <= Math.ceil((x + 2.5) / (HS * 1.5)); q++) { const cx = q * HS * 1.5; for (let r = Math.floor((y - 1.5) / (HS * HSQ) - q / 2); r <= Math.ceil((y + 2.5) / (HS * HSQ) - q / 2); r++) { const cy = HS * HSQ * (r + q / 2);
      if (cx < x - 1 || cx > x + 2 || cy < y - 1 || cy > y + 2) continue; const am = amberHex(q, r), pts = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; pts.push(P(cx + Math.cos(a) * HS * 0.96, cy + Math.sin(a) * HS * 0.96)); }
      const cp = P(cx, cy); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      if (am) { const g = c.createRadialGradient(cp[0] - HS * T * 0.3, cp[1] - HS * T * 0.35, 0, cp[0], cp[1], HS * T); g.addColorStop(0, '#8A4814'); g.addColorStop(0.45, '#4E240C'); g.addColorStop(1, '#22100A'); c.fillStyle = g; c.fill();
        c.save(); c.clip(); for (let i = 0; i < 4; i++) blob(c, [cp[0] + (hh(q, r, 20 + i) - 0.5) * HS * T * 1.2, cp[1] + (hh(q, r, 30 + i) - 0.5) * HS * T * 1.2], T * (0.12 + hh(q, r, 40 + i) * 0.22), '255,170,70', 0.16);
          c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,200,120,.22)'; c.lineWidth = Math.max(0.8, T * 0.03); c.beginPath(); c.moveTo(pts[3][0], pts[3][1]); c.lineTo(pts[4][0], pts[4][1]); c.lineTo(pts[5][0], pts[5][1]); c.stroke();
          for (let i = 0; i < 5; i++) { c.fillStyle = `rgba(255,220,160,${(0.1 + hh(q, r, 50 + i) * 0.25).toFixed(2)})`; c.beginPath(); c.arc(cp[0] + (hh(q, r, 60 + i) - 0.5) * HS * T, cp[1] + (hh(q, r, 70 + i) - 0.5) * HS * T, Math.max(0.6, T * 0.02), 0, TAU); c.fill(); } c.restore();
        c.strokeStyle = '#3A2A1C'; c.lineWidth = Math.max(1.4, T * 0.07); c.stroke(); c.strokeStyle = 'rgba(200,150,80,.35)'; c.lineWidth = Math.max(0.6, T * 0.022); c.stroke(); }
      else { c.fillStyle = VT[Math.floor(hh(q, r, 3) * VT.length)]; c.fill(); const g = c.createLinearGradient(cp[0] - HS * T, cp[1] - HS * T, cp[0] + HS * T, cp[1] + HS * T); g.addColorStop(0, 'rgba(220,190,230,.12)'); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,0,14,.22)'); c.fillStyle = g; c.fill();
        c.save(); c.clip(); for (let i = 0; i < 3; i++) blob(c, [cp[0] + (hh(q, r, 20 + i) - 0.5) * HS * T, cp[1] + (hh(q, r, 30 + i) - 0.5) * HS * T], T * (0.15 + hh(q, r, 40 + i) * 0.3), hh(q, r, 44 + i) < 0.5 ? '30,16,26' : '150,110,100', 0.16); c.restore();
        c.strokeStyle = 'rgba(24,12,20,.9)'; c.lineWidth = Math.max(1.2, T * 0.06); c.stroke(); c.strokeStyle = 'rgba(160,120,96,.32)'; c.lineWidth = Math.max(0.6, T * 0.02); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke();
        c.strokeStyle = 'rgba(220,200,210,.12)'; c.beginPath(); c.moveTo(pts[3][0], pts[3][1]); c.lineTo(pts[4][0], pts[4][1]); c.lineTo(pts[5][0], pts[5][1]); c.stroke(); } } }
    for (let k = 0; k < 12; k++) { const u = hh(x, y, 70 + k), v = hh(x, y, 90 + k), z = hh(x, y, 110 + k); c.fillStyle = z > 0.75 ? 'rgba(200,170,150,.28)' : 'rgba(16,8,14,.4)'; c.fillRect(X + u * T, Y + v * T, Math.max(1, T * 0.025), Math.max(1, T * 0.025)); }
    // a bronze ring set in the floor round each watch-stone, its sight marks
    for (const s of PROTO) { const d = Math.hypot(x + 0.5 - s.x, y + 0.5 - s.y); if (d > 2.6) continue; const cp = P(s.x, s.y); c.strokeStyle = 'rgba(16,8,10,.8)'; c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); c.arc(cp[0], cp[1], T * 1.0, 0, TAU); c.stroke(); c.strokeStyle = '#8A6A3A'; c.lineWidth = Math.max(1.2, T * 0.06); c.stroke();
      c.strokeStyle = 'rgba(255,220,150,.3)'; c.lineWidth = Math.max(0.6, T * 0.02); c.beginPath(); c.arc(cp[0], cp[1], T * 0.98, PI * 1.05, PI * 1.6); c.stroke();
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r0 = T * (i % 4 ? 1.08 : 1.06), r1 = T * (i % 4 ? 1.22 : 1.38); c.strokeStyle = i % 4 ? 'rgba(138,106,58,.7)' : '#B08A4A'; c.lineWidth = Math.max(1, T * (i % 4 ? 0.03 : 0.05)); c.beginPath(); c.moveTo(cp[0] + Math.cos(a) * r0, cp[1] + Math.sin(a) * r0); c.lineTo(cp[0] + Math.cos(a) * r1, cp[1] + Math.sin(a) * r1); c.stroke(); } }
    // the border: wind-blown sand along the walls
    if (!inChamber(x, y) || edgeOf(x, y)) { for (let i = 0; i < 4; i++) blob(c, [X + hh(x, y, 120 + i) * T, Y + hh(x, y, 130 + i) * T], T * (0.4 + hh(x, y, 140 + i) * 0.5), '150,112,90', 0.3); for (let k = 0; k < 6; k++) { c.strokeStyle = 'rgba(190,150,120,.22)'; c.lineWidth = Math.max(0.6, T * 0.02); const yy = Y + (k + hh(x, y, 150 + k)) / 6 * T; c.beginPath(); c.moveTo(X, yy); c.quadraticCurveTo(X + T / 2, yy - T * 0.06, X + T, yy); c.stroke(); } }
    // the sanctuary's threshold: a half disc of pale stone rimmed in bronze, rays, the Scorpio sign in gold
    { const R = SAFE.r, cp = P(SAFE.x, SAFE.y); if (Math.hypot(x + 0.5 - SAFE.x, y + 0.5 - SAFE.y) < R + 1.2) {
      c.save(); c.beginPath(); c.arc(cp[0], cp[1], R * T, 0, PI); c.closePath(); const g = c.createRadialGradient(cp[0], cp[1], 0, cp[0], cp[1], R * T); g.addColorStop(0, '#7A5E5A'); g.addColorStop(0.7, '#5E4646'); g.addColorStop(1, '#4A3638'); c.fillStyle = g; c.fill(); c.clip();
      c.strokeStyle = 'rgba(20,10,16,.55)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.arc(cp[0], cp[1], 1.45 * T, 0, PI); c.stroke(); for (let i = 1; i < 7; i++) { const an = i / 7 * PI; c.beginPath(); c.moveTo(cp[0] + Math.cos(an) * 1.45 * T, cp[1] + Math.sin(an) * 1.45 * T); c.lineTo(cp[0] + Math.cos(an) * R * T, cp[1] + Math.sin(an) * R * T); c.stroke(); }
      for (let i = 0; i < 7; i++) { const an = (i + 0.5) / 7 * PI; c.fillStyle = 'rgba(255,210,140,.5)'; c.beginPath(); c.arc(cp[0] + Math.cos(an) * (R - 0.35) * T, cp[1] + Math.sin(an) * (R - 0.35) * T, Math.max(1, T * 0.05), 0, TAU); c.fill(); }
      sign(c, cp[0], cp[1] + T * 0.72, T * 0.85, '#1A0E12', Math.max(2, T * 0.13)); sign(c, cp[0], cp[1] + T * 0.72, T * 0.85, '#D9A24A', Math.max(1.2, T * 0.065)); c.restore();
      c.strokeStyle = '#2A1810'; c.lineWidth = Math.max(2.5, T * 0.12); c.beginPath(); c.arc(cp[0], cp[1], R * T, 0, PI); c.stroke(); c.strokeStyle = '#B08A4A'; c.lineWidth = Math.max(1.4, T * 0.06); c.stroke(); } }
    // the altars' warmth, the door's
    for (const a of ALTARS) blob(c, P(a.tx + 0.5, a.ty + 0.6), T * 2.2, '255,170,80', 0.1); blob(c, P(DOORX, DOORY), T * 4.4, '200,140,255', 0.08);
    c.restore(); }
  /* the sanctum's floor: obsidian flagstones laid in rings round its heart (amber in a few joints), the rune rings in gold
     with a band of runes, the heptagram's chords as amber channels, the heart's disc with the Scorpio sign, the fonts (amber
     basins rimmed in gold), gold sockets under the thread posts; a crimson wash toward its rim */
  const ST = ['#1E141C', '#1A1119', '#23171F', '#171016', '#20151C'];
  const FR = 1.15;   // (a ring of flagstones' width)
  function channel(c, P, pts, T, w, col) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); });
    c.strokeStyle = 'rgba(8,3,8,.92)'; c.lineWidth = Math.max(3, T * w); c.stroke(); c.strokeStyle = '#2A0E12'; c.lineWidth = Math.max(2, T * w * 0.72); c.stroke();
    c.strokeStyle = col || '#C0661A'; c.lineWidth = Math.max(1.4, T * w * 0.46); c.stroke(); c.strokeStyle = '#FFB04A'; c.lineWidth = Math.max(1, T * w * 0.24); c.stroke(); c.strokeStyle = 'rgba(255,236,190,.85)'; c.lineWidth = Math.max(0.6, T * w * 0.08); c.stroke(); c.restore(); }
  const ringPts = (r, n) => { n = n || 64; const p = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU; p.push([AC.x + Math.cos(a) * r, AC.y + Math.sin(a) * r]); } return p; };
  function sanctFloor(c, X, Y, T, x, y) {
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip(); c.fillStyle = '#0E080E'; c.fillRect(X, Y, T, T);
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T], cp = P(AC.x, AC.y);
    let d0 = 1e9, d1 = 0; for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const d = Math.hypot(x + a - AC.x, y + b - AC.y); d0 = Math.min(d0, d); d1 = Math.max(d1, d); } if (x <= AC.x && x + 1 >= AC.x && y <= AC.y && y + 1 >= AC.y) d0 = 0;
    // the flagstones: ring i (from 1.5 tiles out), its stones by angle; inside 1.5 the heart's disc
    for (let i = Math.max(0, Math.floor((d0 - 1.5) / FR)); i <= Math.floor((d1 - 1.5) / FR); i++) { const r0 = 1.5 + i * FR, r1 = r0 + FR, n = Math.max(8, Math.round(TAU * (r0 + FR / 2) / 1.35)), off = hh(i, 1, 4);
      const ca = Math.atan2(y + 0.5 - AC.y, x + 0.5 - AC.x), span = 1.0 / Math.max(0.6, r0) + 0.12, j0 = Math.floor(((ca - span) / TAU) * n - off) - 1, j1 = Math.ceil(((ca + span) / TAU) * n - off) + 1;
      for (let j = j0; j <= j1; j++) { const a0 = (j + off) / n * TAU, a1 = (j + 1 + off) / n * TAU, jj = md(j, n), gap = 0.045 / (r0 + 0.5);
        c.beginPath(); c.arc(cp[0], cp[1], (r1 - 0.04) * T, a0 + gap, a1 - gap); c.arc(cp[0], cp[1], (r0 + 0.04) * T, a1 - gap, a0 + gap, true); c.closePath(); const obs = hh(i, jj, 9) < 0.12;
        c.fillStyle = obs ? '#100A16' : ST[Math.floor(hh(i, jj, 3) * ST.length)]; c.fill(); const am = (a0 + a1) / 2, mx = cp[0] + Math.cos(am) * (r0 + FR / 2) * T, my = cp[1] + Math.sin(am) * (r0 + FR / 2) * T, g = c.createLinearGradient(mx - T * 0.6, my - T * 0.6, mx + T * 0.6, my + T * 0.6); g.addColorStop(0, obs ? 'rgba(170,120,220,.2)' : 'rgba(210,170,200,.1)'); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.22)'); c.fillStyle = g; c.fill();
        c.strokeStyle = 'rgba(4,2,4,.9)'; c.lineWidth = Math.max(1.2, T * 0.06); c.stroke(); if (hh(i, jj, 13) < 0.14) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,140,50,.38)'; c.lineWidth = Math.max(0.8, T * 0.035); c.beginPath(); c.arc(cp[0], cp[1], r0 * T, a0, a1); c.stroke(); c.restore(); }
        c.strokeStyle = 'rgba(220,190,210,.11)'; c.lineWidth = Math.max(0.6, T * 0.02); c.beginPath(); c.arc(cp[0], cp[1], (r1 - 0.07) * T, a0 + gap * 2, a1 - gap * 2); c.stroke(); } }
    for (let k = 0; k < 10; k++) { const u = hh(x * 3 + k, y, 60), v = hh(x, y * 3 + k, 61); c.fillStyle = `rgba(4,2,4,${(0.2 + hh(x, y, 62 + k) * 0.3).toFixed(2)})`; c.fillRect(X + u * T, Y + v * T, Math.max(1, T * 0.022), Math.max(1, T * 0.022)); }
    // the heart, the rune rings, the heptagram
    if (d0 < RINGS[1] + 1.2) {
      if (d0 < 1.6) { c.save(); c.beginPath(); c.arc(cp[0], cp[1], 1.5 * T, 0, TAU); const g = c.createRadialGradient(cp[0], cp[1], 0, cp[0], cp[1], 1.5 * T); g.addColorStop(0, '#3A1418'); g.addColorStop(0.8, '#1A0A10'); g.addColorStop(1, '#100608'); c.fillStyle = g; c.fill(); c.clip(); sign(c, cp[0], cp[1] - T * 0.05, T * 1.6, '#0A0406', Math.max(3, T * 0.2)); sign(c, cp[0], cp[1] - T * 0.05, T * 1.6, '#C8923E', Math.max(1.6, T * 0.08)); c.restore(); }
      for (const pts of HEPTA) channel(c, P, pts, T, 0.3, '#B4561A');
      for (const r of RINGS) { c.strokeStyle = 'rgba(6,2,4,.95)'; c.lineWidth = Math.max(3, T * 0.3); c.beginPath(); c.arc(cp[0], cp[1], r * T, 0, TAU); c.stroke(); c.strokeStyle = '#9A7234'; c.lineWidth = Math.max(1.6, T * 0.12); c.stroke(); c.strokeStyle = 'rgba(255,226,160,.6)'; c.lineWidth = Math.max(0.6, T * 0.03); c.beginPath(); c.arc(cp[0], cp[1], (r - 0.03) * T, PI * 1.0, PI * 1.7); c.stroke(); }
      { const rb = RINGS[1] - 0.42; c.strokeStyle = '#7A5A2A'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.arc(cp[0], cp[1], (rb - 0.2) * T, 0, TAU); c.stroke();
        for (let k = 0; k < 42; k++) { if (hh(k, 2, 33) < 0.25) continue; const a = (k + 0.5) / 42 * TAU, q = [cp[0] + Math.cos(a) * rb * T, cp[1] + Math.sin(a) * rb * T]; c.save(); c.translate(q[0], q[1]); c.rotate(a + PI / 2); c.strokeStyle = '#C08A3E'; c.lineWidth = Math.max(0.8, T * 0.035); c.beginPath(); const v = Math.floor(hh(k, 5, 7) * 4); if (v === 0) { c.moveTo(0, -T * 0.13); c.lineTo(0, T * 0.13); c.moveTo(-T * 0.08, -T * 0.05); c.lineTo(T * 0.08, T * 0.05); } else if (v === 1) { c.arc(0, 0, T * 0.09, PI, 0); c.moveTo(0, 0); c.lineTo(0, T * 0.13); } else if (v === 2) { c.moveTo(-T * 0.09, T * 0.12); c.lineTo(0, -T * 0.12); c.lineTo(T * 0.09, T * 0.12); } else { c.moveTo(-T * 0.08, -T * 0.1); c.lineTo(T * 0.08, T * 0.1); c.moveTo(T * 0.08, -T * 0.1); c.lineTo(-T * 0.08, T * 0.1); } c.stroke(); c.restore(); } } }
    // the fonts: amber basins in gold rims; the posts' gold sockets
    for (const f of FONTS) { if (Math.hypot(x + 0.5 - f.x, y + 0.5 - f.y) > f.r + 1.3) continue; const q = P(f.x, f.y); c.fillStyle = 'rgba(6,2,4,.9)'; c.beginPath(); c.arc(q[0], q[1], (f.r + 0.12) * T, 0, TAU); c.fill(); const g = c.createRadialGradient(q[0] - f.r * T * 0.3, q[1] - f.r * T * 0.3, 0, q[0], q[1], f.r * T); g.addColorStop(0, '#C07020'); g.addColorStop(0.5, '#6A3410'); g.addColorStop(1, '#2A1006'); c.fillStyle = g; c.beginPath(); c.arc(q[0], q[1], f.r * T, 0, TAU); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter'; for (const k of [0.35, 0.6, 0.85]) { c.strokeStyle = `rgba(255,190,110,${(0.2 * (1 - k * 0.5)).toFixed(3)})`; c.lineWidth = Math.max(0.6, T * 0.025); c.beginPath(); c.arc(q[0], q[1], f.r * T * k, 0, TAU); c.stroke(); } c.restore();
      c.strokeStyle = '#B08A40'; c.lineWidth = Math.max(1.6, T * 0.08); c.beginPath(); c.arc(q[0], q[1], (f.r + 0.06) * T, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,230,170,.5)'; c.lineWidth = Math.max(0.6, T * 0.025); c.beginPath(); c.arc(q[0], q[1], (f.r + 0.04) * T, PI, PI * 1.6); c.stroke(); }
    for (const p of ANCH.slice(1)) { if (Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) > 1.6) continue; const q = P(p.x, p.y); c.strokeStyle = 'rgba(6,2,4,.9)'; c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.arc(q[0], q[1], 0.5 * T, 0, TAU); c.stroke(); c.strokeStyle = '#B08A40'; c.lineWidth = Math.max(1.2, T * 0.05); c.stroke(); }
    // a crimson wash toward the rim (the moon's light off the desert below)
    { const r = Math.pow(se((x + 0.5 - AC.x) / ARX, (y + 0.5 - AC.y) / ARY), 1 / SEN); if (r > 0.72) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(120,20,50,${(0.16 * clamp((r - 0.72) / 0.28, 0, 1)).toFixed(3)})`; c.fillRect(X, Y, T, T); c.restore(); } }
    c.restore(); }
  /* the sanctum's edge, laid over each chunk after its floors: what lies outside the rounded ellipse is cut away (the night
     shows there), then its rim: a lip of obsidian, and under its near half the platform's thickness in strata, obsidian over
     amber-veined sandstone, lit crimson from the desert below */
  const SEP = []; for (let i = 0; i <= 160; i++) SEP.push(spt(i / 160 * TAU));
  const sePath = (c, T, k, dy, i0, i1, move) => { const sg = i0 <= i1 ? 1 : -1; for (let i = i0; sg > 0 ? i <= i1 : i >= i1; i += sg) { const p = SEP[i], X = (AC.x + p[0] * (ARX - k)) * T, Y = (AC.y + p[1] * (ARY - k) + dy) * T; if (move && i === i0) c.moveTo(X, Y); else c.lineTo(X, Y); } };
  const EDGE = []; for (let y = 0; y <= WALLY; y++) for (let x = 0; x < W0 + 2; x++) { let n = 0; for (const [a, b] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) if (se((a - AC.x) / ARX, (b - AC.y) / ARY) <= 1) n++; if (n > 0 && n < 4 && y < WALLY) EDGE.push([x, y]); }
  function arenaEdge(c, T, d) {
    const x0 = d && d.n ? d.cx * d.n - 1 : -9, x1 = d && d.n ? (d.cx + 1) * d.n : 99, y0 = d && d.n ? d.cy * d.n - 1 : -9, y1 = d && d.n ? (d.cy + 1) * d.n : 99;
    for (const [x, y] of EDGE) if (x >= x0 && x <= x1 && y >= y0 && y <= y1) sanctFloor(c, x * T, y * T, T, x, y);
    c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.rect(-T * 4, -T * 4, (W0 + 10) * T, (WALLY + 4) * T); sePath(c, T, 0, 0, 0, 160, true); c.closePath(); c.fill('evenodd'); c.restore();
    const TH = 1.1; c.save(); c.beginPath(); c.rect(-T * 4, AC.y * T, (W0 + 10) * T, (WALLY - AC.y) * T); c.clip();
    c.beginPath(); sePath(c, T, 0, 0, 0, 80, true); sePath(c, T, 0, TH, 80, 0, false); c.closePath();
    const g = c.createLinearGradient(0, (AC.y + ARY - 0.7) * T, 0, (AC.y + ARY + TH) * T); g.addColorStop(0, '#3A2A34'); g.addColorStop(0.28, '#1C1218'); g.addColorStop(0.5, '#5A3A30'); g.addColorStop(0.75, '#3A1C1C'); g.addColorStop(1, '#8A2238'); c.fillStyle = g; c.fill();
    c.save(); c.clip(); c.lineWidth = Math.max(1, T * 0.03); for (const k of [0.22, 0.42, 0.68]) { c.strokeStyle = k > 0.5 ? 'rgba(255,90,120,.28)' : 'rgba(8,3,6,.55)'; c.beginPath(); sePath(c, T, 0, TH * k, 2, 78, true); c.stroke(); }
      for (let i = 4; i < 78; i += 3) { const p = SEP[i], X = (AC.x + p[0] * ARX) * T, Y = (AC.y + p[1] * ARY) * T; c.strokeStyle = 'rgba(8,3,6,.5)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.moveTo(X, Y + TH * 0.04 * T); c.lineTo(X + (hh(i, 1) - 0.5) * T * 0.2, Y + TH * 0.5 * T); c.stroke(); }
      for (let i = 6; i < 76; i += 7) { const p = SEP[i], X = (AC.x + p[0] * ARX) * T + (hh(i, 2) - 0.5) * T * 0.4, Y = (AC.y + p[1] * ARY) * T; c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createLinearGradient(0, Y + TH * 0.35 * T, 0, Y + TH * T); gg.addColorStop(0, 'rgba(255,170,70,0)'); gg.addColorStop(1, 'rgba(255,170,70,.45)'); c.strokeStyle = gg; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(X, Y + TH * 0.35 * T); c.lineTo(X, Y + TH * T); c.stroke(); c.restore(); }
      c.restore();
    c.restore();
    c.save(); c.beginPath(); c.rect(-T * 4, -T * 4, (W0 + 10) * T, (WALLY + 4) * T); c.clip();
    c.strokeStyle = 'rgba(6,2,4,.8)'; c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); sePath(c, T, 0.03, 0, 0, 160, true); c.stroke();
    c.strokeStyle = 'rgba(220,180,200,.28)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); sePath(c, T, 0.14, 0, 82, 158, true); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,80,120,.3)'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); sePath(c, T, 0.02, 0.02, 2, 78, true); c.stroke(); c.restore(); c.restore(); }
  /* the courtyard's wall faces: sandstone courses over a bronze base, a band of bronze, amber slit windows by the door */
  function vigilWall(c, X, Y, T, H, h, x) {
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, '#7A5A50'); g.addColorStop(0.55, '#5A403C'); g.addColorStop(1, '#2E2026'); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    const n = 4; for (let i = 1; i < n; i++) { const yy = Y + H * 0.82 * i / n; c.fillStyle = 'rgba(24,12,18,.55)'; c.fillRect(X, yy, T + 0.5, Math.max(1, H * 0.02)); c.fillStyle = 'rgba(230,200,190,.12)'; c.fillRect(X, yy + Math.max(1, H * 0.02), T + 0.5, Math.max(1, H * 0.01)); const jx = X + T * ((i + x) % 2 ? 0.3 : 0.8); c.fillStyle = 'rgba(24,12,18,.45)'; c.fillRect(jx, yy - H * 0.82 / n, Math.max(1, T * 0.03), H * 0.82 / n); }
    c.fillStyle = '#3A2A22'; c.fillRect(X, Y + H * 0.82, T + 0.5, H * 0.18); c.fillStyle = '#B08A4A'; c.fillRect(X, Y + H * 0.82, T + 0.5, Math.max(1, H * 0.02));
    c.fillStyle = '#5A4430'; c.fillRect(X, Y + H * 0.1, T + 0.5, H * 0.05); c.fillStyle = '#C8A060'; c.beginPath(); c.arc(X + T * 0.5, Y + H * 0.125, Math.max(1.2, T * 0.045), 0, TAU); c.fill();
    if (x % 3 === 1) { c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createLinearGradient(0, Y + H * 0.28, 0, Y + H * 0.6); gg.addColorStop(0, 'rgba(255,170,70,.45)'); gg.addColorStop(1, 'rgba(255,120,40,.15)'); c.fillStyle = gg; c.fillRect(X + T * 0.44, Y + H * 0.28, Math.max(1, T * 0.1), H * 0.32); c.restore(); }
    const dv = Math.abs(x + 0.5 - DOORX); if (dv < 6) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(190,130,255,${(0.1 * (1 - dv / 6)).toFixed(3)})`; c.fillRect(X, Y, T + 0.5, H); c.restore(); } }
  const noCliff = () => {};

  /* ======================= the lands and the backdrop ======================= */
  const land = (name, o) => Object.assign({ name, rift: true, tile: 'desert', out: false, dark: 0, bg: '#0A0410', gap: 'vigilsky', ambient: 'motes', accent: VIO, light: '#E8D0FF', hazard: 'spikes', grade: null, fog: '#0A0410', darkRGB: '10,4,16', props: [], deco: VIO, mud: ['#4A3438', '#3A2A2E'] }, o);
  BIOMES.vigil = land('The Amber Vigil', { floorFn: (c, X, Y, T, h, h2, x, y) => vigilFloor(c, X, Y, T, x, y), wallFn: (c, X, Y, T, H, h, x) => vigilWall(c, X, Y, T, H, h, x), cliffTint: noCliff,
    floor: ['#4A3438', '#4A3438', '#4A3438'], grout: '#1C1218', hi: '#9A7A6A', top: '#7A5E54', face: '#6A4E46', faceD: '#3A2A2C', cliff: '#3A2A2C', bridgeCol: '#6A4E46' });
  BIOMES.vigilsanct = land('The Amber Sanctum', { floorFn: (c, X, Y, T, h, h2, x, y) => sanctFloor(c, X, Y, T, x, y), cliffTint: noCliff, light: '#FFC0D0',
    floor: ['#1E141C', '#1E141C', '#1E141C'], grout: '#08040A', hi: '#5A4250', top: '#2A1E26', face: '#2A1E26', faceD: '#0E080E', cliff: '#1A1018', bridgeCol: '#2A1E26' });
  for (const id of ['vigil', 'vigilsanct']) { if (!BIOME_ORDER.includes(id)) BIOME_ORDER.push(id); if (typeof DARK_COL !== 'undefined') DARK_COL[id] = '10,4,16'; }
  window.DECAL_EXT = window.DECAL_EXT || {};
  DECAL_EXT.sgedge = (c, d, s, lw, T) => arenaEdge(c, T, d);
  /* the dunes' anchored night (DUNE_SKY, 20r3) in a land of this gate's own, 'vigil': a violet dusk deepening to black, the
     fossil ribs and fangs of the Mouth on its dune ranges, violet mist, amber fireflies; its pieces painted in a violet night
     light. Added to DUNE_SKY's lands once (its own pictures are cached and given back with the rest of the rift's) */
  function skyLand() { const D = typeof DUNE_SKY !== 'undefined' ? DUNE_SKY : null; if (!D || !D.LANDS || !D.LANDS.nightdune) return null; if (D.LANDS.vigil) return D;
    const N = D.LANDS.nightdune, tint = [['#40609E', '#5A2C62', '#20102A', '#FF9AC0', '#3A1840'], ['#33528E', '#4A2456', '#160A20', '#FFB0D0', '#28102E'], ['#253E72', '#3A1C48', '#0E0616', '#E890C0', '#0C0610'], ['#1C3260', '#2E163C', '#0A0410', '#D080B0', '#08040C'], ['#16294E', '#241232', '#06030A', '#C070A0', '#06020A']];
    D.LIGHT.vigil = { a0: [0.06, 0.03, 0.08], a1: [0.07, 0.04, 0.12], e0: [0.05, 0.02, 0.06], e1: [0.32, 0.16, 0.4], k: [0.85, 0.6, 0.9], rim: [0.9, 0.42, 0.7], bo: [0.12, 0.06, 0.04] };
    D.LANDS.vigil = { per: 80, dark: '#0A0410', starsA: [-0.1, -0.5], stars: 'warm',
      sky: [[-1.7, '#04010A'], [-1.1, '#0A0316'], [-0.7, '#160624'], [-0.4, '#260A32'], [-0.16, '#40123E'], [-0.04, '#5E1A44'], [0, '#7E2648'], [0.035, '#521636'], [0.2, '#30102A'], [0.55, '#1C0A1C'], [1.05, '#120612'], [1.7, '#08030A']],
      strips: N.strips.map((s, i) => Object.assign({}, s, { lit: tint[i][1], sh: tint[i][2], rim: tint[i][3], haze: tint[i][4], light: [-0.6, 0.8] })),
      items: N.items.map(it => Object.assign({}, it)),
      veils: [{ y: 0.9, w: 40, h: 2.0, col: '#6A2A6E', a: 0.24, spd: 0.4 }, { y: 7, w: 44, h: 3.4, col: '#4A1E58', a: 0.28, spd: 0.3 }, { y: 11.5, w: 42, h: 3.2, col: '#5A2462', a: 0.24, spd: 0.35 }, { y: 15, w: 46, h: 4.5, col: '#3A1848', a: 0.28, spd: 0.25 }, { y: 20, w: 50, h: 5, col: '#2E1240', a: 0.24, spd: 0.2 }],
      shimmer: [], motes: '#FFC0E0', flies: '#FFB45A', light: 'vigil',
      sand: { lit: '#5A2C62', sh: '#20102A', deep: '#140818', glint: '#FFD0E8', kind: 'ripple' }, vein: '#FFB45A' };
    return D; }
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.vigilsky = { base: '#0A0410',
    paint(c, S, R) { c.fillStyle = '#120618'; c.fillRect(0, 0, S, S); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,220,240,${0.2 + R() * 0.5})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.1 ? 1.2 : 0.6, 0, TAU); c.fill(); } },
    back(c, o) { const { W, H, t, wx, wy, k } = o; const C = CUR, T = C && C.X ? C.X.Tz() : 48, sx = x => W / 2 + x * T - wx, sy = y => H / 2 + y * T - wy, D = skyLand();
      if (D) { const V = { W, H, T, sx, sy, t, land: 'vigil', light: 'vigil', hy: 6.5, top: 4.5, span: 15, k: k || 1 }; try { const sg = typeof window !== 'undefined' ? window.__SG_SKYGL : null; D.vista(c, V, { gpu: !!(C && C.X) && sg !== 0 && (sg === 1 || !(C.S && C.S.phase === 'boss')) });   /* (in the boss's fight the far view's own two GPU passes are left out: its pictures stay, its twinkle and mist go; the GL copies a frame as the Samael fight's. window.__SG_SKYGL: 1 always, 0 never) */ } catch (e) { c.fillStyle = '#120618'; c.fillRect(0, 0, W, H); } }
      else { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#08030C'); g.addColorStop(1, '#2A0C2A'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
      // the blood moon, high over the sanctum's north rim, its halo
      const tp = SP(), Mx = sx(MOON.x), My = sy(MOON.y), mk = C && C.S ? C.S.moonK : 1; if (Mx > -T * 8 && Mx < W + T * 8 && My > -T * 8 && My < H + T * 8) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.32 + 0.06 * Math.sin(t * 0.7)) * clamp(mk, 0, 2); if (typeof blitSized === 'function' && typeof glowSprite === 'function') blitSized(c, glowSprite('#FF2A5A'), Mx - T * 9, My - T * 9, T * 18, T * 18); c.restore();
        if (!(tp && tp.draw(c, 'moon', 0, Mx, My, T))) { const g = c.createRadialGradient(Mx - T, My - T, 0, Mx, My, T * 3.2); g.addColorStop(0, '#E0405A'); g.addColorStop(1, '#6A0C22'); c.fillStyle = g; c.beginPath(); c.arc(Mx, My, T * 3.2, 0, TAU); c.fill(); }
        if (mk > 1.02) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(mk - 1, 0, 1) * 0.5; if (typeof blitSized === 'function') blitSized(c, glowSprite('#FF5070'), Mx - T * 5, My - T * 5, T * 10, T * 10); c.restore(); } } } };

  /* ======================= the stand-in guardian (until SCORPIO_BOSS exists): the Amber Warden ======================= */
  /* An ordinary lesser boss of the engine (the Giant Spider's body and ways) in the sanctum, its strength measured from the
     pet's; beating it wins the gate. The same contract as SCORPIO_BOSS, so the gate runs the same code either way */
  const STANDIN = (() => { let S = null;
    function begin(X, H, self, A) { stop(); S = { X, self, A, m: null, t: 0, won: false };
      X.after(1.1, () => { if (!S || S.X !== X) return; const B = BOSSES.find(b => b.id === 'spider') || BOSSES[0], ST = X.ST(); const m = X.lesserBoss(A.cx, A.cy - 1.5, 1, '', B); if (!m) return; S.m = m;
        m.bname = 'The Amber Warden'; m.glow = AMB; m.aggro = true; m.hp = m.maxhp = Math.max(m.hp, Math.round((ST.atk || 10) * 160)); m.dmg = Math.max(m.dmg || 1, (ST.hp || 100) * 0.045);
        X.flash(0.45, '#FFD0E0'); X.shake(8, 0.5); X.sfx.hum && X.sfx.hum(); X.ring(m.x, m.y, 0.5, 6, 0.7, RUBY, 0.5); X.banner('THE AMBER WARDEN', 'It drops from the crown\'s threads to keep the Scorpio star', AMB_HI, 3, true, true); A.sigil(1.6); A.moon(1.4); }); }
    function update(dt) { if (!S) return; S.t += dt; const m = S.m; if (!m || S.won) return;
      if (m.dead) { S.won = true; S.A.sigil(0.5); S.A.moon(0.8); const X = S.X; X.banner('THE VIGIL ENDS', 'The Warden falls: Scorpio wakes over the sanctum', GOLD, 3, true, true); X.flash(0.5, '#FFFFFF'); X.sfx.fanfare(); X.ring(m.x, m.y, 0.3, 6, 0.9, VIO, 0.4); X.after(2.6, () => { try { X.winStage(); } catch (e) {} }); } }
    function stop() { if (!S) return; const m = S.m; try { if (m && !m.dead) m.dead = true; } catch (e) {} S = null; }
    return { begin, update, stop, drawGround() {}, drawOver() {}, cam: () => null, hideHud: () => false, onBossDeath: () => false, active: () => !!S, goal: () => { const m = S && S.m; return !m ? 'Something stirs in the sanctum' : m.dead ? 'Scorpio wakes' : `The Amber Warden ${Math.max(0, Math.ceil(m.hp / m.maxhp * 100))}%`; }, get S() { return S; } }; })();
  // (the boss: SCORPIO_BOSS when it exists, else the stand-in; tests may stand one in, window.__SG_BOSS, or leave it out, window.__SG_NOBOSS = 1)
  const AB = () => { const w = typeof window !== 'undefined' ? window : {}; if (w.__SG_BOSS) return w.__SG_BOSS; if (w.__SG_NOBOSS === 1) return null; return typeof SCORPIO_BOSS !== 'undefined' && SCORPIO_BOSS ? SCORPIO_BOSS : STANDIN; };

  /* ======================= the stage ======================= */
  let CUR = null;   // (the running stage: the backdrop reads its camera; let go when the stage closes)
  const OPEN_T = 6.4, SEAL_T = 1.3, SEEN_K = 2.2, FORGET_K = 1.5, LOOK_T = 7, TURN_T = 1.0;
  defGate('dunes', {
    name: 'The Amber Vigil', biome: 'vigil', goal: 'Bring the three star shards to the great door unseen, then face what waits beyond it',
    how: 'Four watch-stones keep the courtyard: where an amber eye looks, its light falls on the floor. Stay out of the light, or in the shadow a column, statue or boulder casts in it; the light on the pet brightens before it is seen, so step out in time. Seen, the pet is carried back to the sanctuary before the door (nothing sees into it) and a shard it carries flies home. Take a shard from its altar and bring it to the sanctuary. The west stone turns round and round; the east one sweeps: ring the chime by the north wall (stand beside it) and it stares at the sound for seven seconds. The south pair turn a quarter at a time (their next heading shows faintly); ruby threads guard the south altar: pass while they are slack. Three shards open the door: what waits beyond must be faced to wake Scorpio.',
    layout: LAYOUT,
    legend: { A: {}, D: { tile: T_SOLID }, d: { tile: T_SOLID } },
    // (the loading screen paints every picture at the floor's sharpness, and the sky's: nothing is painted mid-play)
    preload(P) { const tp = SP(), out = tp && P && P.T ? tp.warm(P.T * (P.k || 1)) : []; try { const D = skyLand(); if (D && P && P.F) out.push(...D.warm(P)); } catch (e) {}
      try { if (P && P.gl && typeof ASMODEUS_GL !== 'undefined' && ASMODEUS_GL.usable()) out.push(() => { try { ASMODEUS_GL.warm(); } catch (e) {} }); } catch (e) {} return out; },   /* (v447 K: and the boss's 3D model, before the fight) */
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, MW = M.MW, MH = M.MH;
      const R = { t: 0, sclk: 0, slow: 1, mode: 'intro', carry: null, banked: [], seenN: 0, meter: 0, by: null, graceT: 0, seenT: -9, held: 0, flyHome: [], bankFx: [], plucks: [], rings: [], lastTake: 0, catchW: { W: 0, E: 0, S: 0 }, msgT: 0, binds: 0, safeT: 0, hidden: false };
      const S = { phase: 'puzzle', t: 0, open: 0, claw: 0, uncoil: 0, rise: 0, ignite: 0, run: 0, eyes: 0, litK: [0, 0, 0], openT: 0, sealT: 0, passable: false, mist: [], fade: 1, crownFade: 1, dt: 0.016, sig: 1, sigK: 1, moon: 1, moonK: 1, web: 1, webK: 1, font: [0.35, 0.35, 0.35], fontK: [0.35, 0.35, 0.35] };
      { const li = BIOME_ORDER.indexOf('vigilsanct'), ni = BIOME_ORDER.indexOf('vigil'); for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) M.BI[y * MW + x] = y < WALLY ? li : ni; }
      if (M.decalsByChunk && typeof DunWorld !== 'undefined') { const CHn = DunWorld.CH || 8; for (let cy = 0; cy <= Math.floor((WALLY + 1) / CHn); cy++) for (let cx = 0; cx <= Math.floor((MW - 1) / CHn); cx++) { const key = cx + ',' + cy, L = M.decalsByChunk.get(key) || []; L.push({ kind: 'sgedge', x: 0, y: 0, s: 1, rot: 0, cx, cy, n: CHn }); M.decalsByChunk.set(key, L); } }
      M.fill = T_GAP; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (x === 0 || y === 0 || x === MW - 1 || y === MH - 1) X.setTile(x, y, T_GAP);
      if (typeof DunWorld !== 'undefined' && DunWorld.PROPS && !DunWorld.PROPS.sgnone) DunWorld.PROPS.sgnone = () => {};
      for (const [x, y] of SOLIDS) { X.setTile(x, y, T_SOLID); M.props.set(y * MW + x, 'sgnone'); }
      const doorTiles = [[16, WALLY], [17, WALLY], [18, WALLY]];
      CUR = { X, S, R };
      try { X.F.name = 'The Gate of Scorpio'; } catch (e) {}
      const note = (f, d, ty, v, f1, dl) => { try { if (X.sfx && X.sfx.note) X.sfx.note(f, d, ty, v, f1, dl); } catch (e) {} };
      const sfx = n => { try { if (X.sfx[n]) X.sfx[n](); } catch (e) {} };
      const stones = PROTO.map(s => Object.assign({}, s, { a: schedA(s, 0), look: null, eye: 0, seeK: 0, tab: new Float32Array(33), N: 28, prevA: 0 }));
      const byId = id => stones.find(s => s.id === id);
      const shards = ALTARS.map(a => ({ id: a.id, ax: a.tx + 0.5, ay: a.ty + 0.5, name: a.name, state: 'altar', x: a.tx + 0.5, y: a.ty - 0.55, t: 0 }));   // state: altar | carried | home

      /* ---- the vigil ---- */
      function stoneAngle(s) { const base = schedA(s, R.sclk); if (!s.look) return base; const L = s.look, la = Math.atan2(L.y - s.y, L.x - s.x), k = ease(L.t / (L.turn || TURN_T)) * (1 - ease((L.t - (L.dur - (L.turn || TURN_T))) / (L.turn || TURN_T))); return base + angD(la, base) * k; }
      function rays(s) { const N = lowFx() ? 18 : 28; s.N = N; for (let i = 0; i <= N; i++) { const a = s.a - s.half + i / N * s.half * 2; s.tab[i] = rayLen(s.x, s.y, Math.cos(a), Math.sin(a), s.range, s.id) / s.range; } }
      // is the pet lit by stone s now (its centre inside the gaze as the floor shows it: the same ray table)
      function litNow(s) { const dx = me.x - s.x, dy = me.y - s.y, d = Math.hypot(dx, dy); if (d > s.range || d < 0.3) return false; const da = angD(Math.atan2(dy, dx), s.a); if (Math.abs(da) > s.half) return false;
        const f = (da + s.half) / (s.half * 2) * s.N, i = Math.min(s.N - 1, Math.floor(f)), u = f - i, lim = lerp(s.tab[i], s.tab[i + 1], u) * s.range; return d < lim - 0.05; }
      function msg(s, col) { X.text(me.x, me.y - 1.6, s, col || PALE, 12); }
      function take(sh) { if (!sh || sh.state !== 'altar' || R.carry) return false; sh.state = 'carried'; R.carry = sh; R.lastTake = R.t; sfx('chirp'); note(660, 0.5, 'sine', 0.1); note(990, 0.6, 'sine', 0.05, null, 0.08); X.text(sh.ax, sh.ay - 1.8, `The shard of ${sh.name}`, VIO_HI, 13); X.sparks(sh.ax, sh.ay - 1, VIO, 10, 4);
        if (!R.taught) { R.taught = 1; X.banner('A STAR SHARD', 'Carry it back to the sanctuary before the door', VIO_HI, 2.4, true); } return true; }
      function bank() { const sh = R.carry; if (!sh) return false; sh.state = 'home'; R.carry = null; R.banked.push(sh.id); const n = R.banked.length; S.lit = n; R.bankFx.push({ id: sh.id, t: 0, x0: me.x, y0: me.y - 1.4, slot: n - 1 });
        sfx('fanfare'); chime(n); X.sparks(DOORX, DOORY - 3.8, VIO, 16, 6); X.banner(`THE SHARD OF ${sh.name.replace('the ', '').toUpperCase()} IS HOME`, `${n} of 3 at the door${n < 3 ? '' : ' · the vigil ends'}`, '#8FE0A6', 2.4, true);
        if (n >= 3) { R.mode = 'won'; X.after(1.0, () => X.banner('THE AMBER VIGIL ENDS', 'Three shards answer · the great door wakes', GOLD, 2.8, true, true)); X.after(1.3, () => startOpen()); } return true; }
      function seen(s) { R.seenN++; R.meter = 0; R.graceT = 1.4; R.seenT = R.t; R.by = s ? s.id : null; const wing = me.x < 14.5 ? 'W' : me.x > 20.5 ? 'E' : 'S'; R.catchW[wing]++;
        X.flash(0.35, '#FFF0D0'); sfx('wrong'); note(220, 0.7, 'triangle', 0.1, 110); if (s) { s.eye = 1.6; X.ring(s.x, s.y - 2.9, 0.2, 1.6, 0.5, AMB_HI, 0.5); }
        if (R.carry) { const sh = R.carry; sh.state = 'altar'; R.carry = null; R.flyHome.push({ sh, t: 0, x0: me.x, y0: me.y - 1.4 }); }
        R.held = 0.9; X.text(me.x, me.y - 1.4, 'Seen!', AMB_HI, 15);
        X.after(0.55, () => { me.x = START.x; me.y = START.y; me.vx = me.vy = 0; X.ring(me.x, me.y, 0.3, 1.8, 0.5, VIO, 0.4); });
        if (R.seenN === 3 || R.seenN === 6) { R.slow = R.seenN === 3 ? 0.8 : 0.66; X.after(1.6, () => X.banner('THE VIGIL TIRES', `Its stones turn ${R.seenN === 3 ? 'a fifth' : 'a third'} slower now`, VIO_HI, 2.6, true)); }
        else X.banner('SEEN', R.carry === null && R.flyHome.length ? 'The vigil\'s light carries you back · the shard flies home' : 'The vigil\'s light carries you back to the sanctuary', AMB_HI, 1.8, true); }
      function ring(ch) { if (!ch || R.mode !== 'play') return false; ch.rungT = R.t; for (const id of ch.stones) { const s = byId(id); s.look = { x: ch.x, y: ch.y, t: 0, dur: LOOK_T, turn: TURN_T, chime: true }; }
        R.rings.push({ x: ch.x, y: ch.y - 1.4, t: 0 }); sfx('chirp'); for (const [f, dl] of [[784, 0], [988, 0.12], [1175, 0.24], [988, 0.5]]) note(f, 1.4, 'sine', 0.07, null, dl);
        X.text(ch.x, ch.y - 2.6, ch.stones.length > 1 ? 'Both watch-stones turn to the chime' : 'The watch-stone turns to the chime', VIO_HI, 12); return true; }
      function pluck(th) { if (R.graceT > 0) return; th.pluckT = R.t; R.binds++; R.held = 1.0; me.vx = me.vy = 0; R.plucks.push({ x: me.x, y: me.y, t: 0, th }); sfx('wrong'); note(330, 0.9, 'sawtooth', 0.06, 220); note(165, 1.2, 'sine', 0.1);
        for (const s of stones) if (Math.hypot(s.x - me.x, s.y - me.y) < 9) s.look = { x: me.x, y: me.y, t: 0, dur: 2.6, turn: 0.45 };
        X.text(me.x, me.y - 1.5, 'A ruby thread binds you!', RUBY, 13); if (!R.toldThread) { R.toldThread = 1; X.banner('A RUBY THREAD', 'Taut, it binds and rings: pass while it hangs slack', PINK, 2.6, true); } }
      function chime(n) { const base = [392, 494, 587][clamp(n - 1, 0, 2)]; note(base, 1.4, 'sine', 0.2); note(base * 2, 0.8, 'sine', 0.07); note(base * 1.5, 1.1, 'triangle', 0.05, null, 0.06); }
      X.after(1.2, () => { R.mode = 'play'; X.banner('THE AMBER VIGIL', 'Bring the three star shards to the door unseen: keep out of the watch-stones\' light', VIO_HI, 3.2, true, true); });
      X.after(4.8, () => { if (R.mode === 'play' && !R.carry && !R.banked.length) X.banner('SHADOWS HIDE YOU', 'Cover cuts the light: wait in a shadow while a gaze passes', AMB_HI, 2.6, true); });
      function play(dt) {
        if (S.phase !== 'puzzle' && S.phase !== 'opening') return;
        R.sclk += dt * R.slow; if (R.graceT > 0) R.graceT -= dt; if (R.held > 0) { R.held -= dt; me.vx = me.vy = 0; }
        for (const s of stones) { if (s.look) { s.look.t += dt; if (s.look.t >= s.look.dur) s.look = null; } s.prevA = s.a; s.a = stoneAngle(s); rays(s); s.eye = Math.max(0, s.eye - dt * 1.5); }
        if (R.mode !== 'play' || me.dead) { R.meter = 0; return; }
        const safe = inSafe(me.x, me.y); let by = null; if (!safe && R.graceT <= 0) for (const s of stones) if (litNow(s)) { by = s; break; }
        for (const s of stones) s.seeK += ((by === s ? 1 : 0) - s.seeK) * Math.min(1, dt * 8);
        if (by) { R.meter += dt * SEEN_K; if (R.meter >= 1) { seen(by); return; } } else R.meter = Math.max(0, R.meter - dt * FORGET_K);
        // hidden: in a stone's gaze but shaded by cover (a soft tell under the pet)
        R.hidden = !by && !safe && stones.some(s => { const dx = me.x - s.x, dy = me.y - s.y, d = Math.hypot(dx, dy); return d < s.range && Math.abs(angD(Math.atan2(dy, dx), s.a)) < s.half; });
        // the threads: a taut one binds and rings
        for (const th of THREADS) if (taut(th, R.sclk) > 0.6 && segD(me.x, me.y, th.a, th.b) < 0.42 && !(th.pluckT > R.t - 1.6)) pluck(th);
        // the shards: taken from an altar by walking up to it; banked in the sanctuary
        if (!R.carry && R.held <= 0) for (const sh of shards) if (sh.state === 'altar' && Math.hypot(me.x - sh.ax, me.y - sh.ay) < 1.3) { take(sh); break; }
        if (R.carry && safe) bank(); }

      /* ---- the great door ---- */
      function setDoor(open) { for (const [x, y] of doorTiles) X.setTile(x, y, open ? T_FLOOR : T_SOLID); S.passable = open; try { X.retile(); } catch (e) {} }
      function startOpen() { if (S.phase !== 'puzzle') return; S.phase = 'opening'; if (X.prepTiles) X.prepTiles(doorTiles.map(([x, y]) => [x, y, T_FLOOR]));   /* (v447 K: the open door's floor painted ahead, no glitch as it opens) */ S.openT = 0; S.lit = 3; X.flash(0.25, '#E8D8FF'); sfx('fanfare'); X.ring(DOORX, DOORY + 0.6, 0.3, 4, 0.8, VIO, 0.4); }
      function opened() { S.phase = 'open'; X.banner('THE GREAT DOOR OPENS', 'Beyond it waits the Amber Sanctum', VIO_HI, 2.6, true, true); }
      function seal() { if (S.phase !== 'open') return; S.phase = 'sealing'; if (X.prepTiles) X.prepTiles(doorTiles.map(([x, y]) => [x, y, T_SOLID])); S.sealT = 0; sfx('whoosh'); }
      const arenaA = () => ({ cx: AC.x, cy: AC.y, r: ARY, rx: ARX, ry: ARY, sen: SEN, ax0: AC.x - ARX + 0.5, ay0: AC.y - ARY + 0.5, ax1: AC.x + ARX - 0.5, ay1: WALLY - 0.5, door: { x: DOORX, y: WALLY - 0.5 },
        inside: (x, y) => y < WALLY && se((x - AC.x) / ARX, (y - AC.y) / ARY) <= 1, solid: (x, y) => SOLID_SET.has(Math.floor(x) + ',' + Math.floor(y)) && y < WALLY,
        rings: RINGS.slice(), sigil: k => { S.sig = clamp(+k || 0, 0, 2); }, moon: k => { S.moon = clamp(+k || 0, 0, 2); }, web: k => { S.web = clamp(+k || 0, 0, 1); }, font: (i, k) => { if (i >= 0 && i < 3) S.font[i] = clamp(+k || 0, 0, 2); },
        crown: { x: CROWN.x, y: CROWN.y, heart: { x: CROWN.heart.x, y: CROWN.heart.y } }, anchors: ANCH.map(p => ({ x: p.x, y: p.y })), pillars: PILLARS.map(p => ({ x: p.x, y: p.y, r: p.r })), ruins: RUINS.map(p => ({ x: p.x, y: p.y, r: p.r })), fonts: FONTS.map(f => ({ x: f.x, y: f.y, r: f.r })) });
      function sealed() {
        if (me.y > WALLY - 0.6) me.y = WALLY - 0.7; setDoor(false); X.shake(9, 0.5); sfx('thud'); note(98, 2.4, 'sine', 0.3); note(49, 2.8, 'sine', 0.2);
        const B = AB(); if (B && typeof B.begin === 'function') { S.phase = 'boss'; X.banner('THE SANCTUM IS SEALED', 'The door is shut behind you', VIO_HI, 2.4, true, true);
          try { B.begin(X, H, self, arenaA()); } catch (e) { if (typeof console !== 'undefined') console.error(e); win(); } }
        else win(); }
      function win() { if (self.done) return; self.done = true; S.phase = 'won'; X.banner('THE AMBER VIGIL ENDS', 'Scorpio wakes over the Amber Sanctum', GOLD, 2.8, true, true); X.flash(0.4, '#FFFFFF'); sfx('fanfare'); X.ring(me.x, me.y, 0.3, 6, 0.9, VIO, 0.4); X.after(2.6, () => X.winStage()); }

      /* ---- the objects (drawn in depth by their feet) ---- */
      const tp0 = () => SP();
      const plain = (c, Xs, Ys, T, col, w, h) => { c.save(); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys, T * w, T * w * 0.36, 0, 0, TAU); c.fill(); c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 2; GFX.rr(c, Xs - T * w * 0.7, Ys - T * h, T * w * 1.4, T * h, 6); c.fill(); c.stroke(); c.restore(); };   // (no pictures at all: a plain block)
      for (const s of stones) H.obj({ x: s.x, y: s.y + 0.02, kind: 'sgwatch', r: 0, h: 3.6, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (!(tp && tp.draw(c, 'watch', 0, Xs, Ys, T))) plain(c, Xs, Ys, T, '#8E6A5A', 0.55, 2.8); } });
      const CHM = CHIMES.map(ch => H.obj({ x: ch.tx + 0.5, y: ch.ty + 0.52, kind: 'sgchime', r: 0.95, h: 2.7, stones: ch.stones, id: ch.id, rungT: -9,
        label: o => { if (R.mode !== 'play') return ''; const s = byId(o.stones[0]); return s.look && s.look.chime ? 'The watch-stone stares at the chime' : 'Decoy chime: stand still to ring it'; },
        use(o) { if (R.mode !== 'play') return; const s = byId(o.stones[0]); if (s.look && s.look.chime && s.look.t < s.look.dur - 1.2) { msg('It still stares at the chime', VIO_HI); return; } ring(o); },
        draw(c, Xs, Ys, T, o) { const tp = tp0(); const sw = Math.sin((R.t - o.rungT) * 18) * Math.exp(-(R.t - o.rungT) * 2.5) * 0.08; if (!(tp && tp.draw(c, 'chime', 0, Xs, Ys, T, { rot: sw }))) plain(c, Xs, Ys, T, '#957943', 0.4, 2.0); } }));
      for (const a of ALTARS) H.obj({ x: a.tx + 0.5, y: a.ty + 0.52, kind: 'sgaltar', r: 0, h: 1.6, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (!(tp && tp.draw(c, 'altar', 0, Xs, Ys, T))) plain(c, Xs, Ys, T, '#9E7A5A', 0.6, 0.6); } });
      for (const [x, y, kind, v] of COVERS) H.obj({ x: x + 0.5, y: y + 0.55, kind: 'sgcover', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (!(tp && tp.draw(c, kind, v, Xs, Ys, T))) plain(c, Xs, Ys, T, '#8E6A3E', 0.6, kind === 'rock' ? 1.0 : 2.0); } });
      for (const th of THREADS) for (const p of [th.a, th.b]) H.obj({ x: p[0], y: p[1] + 0.05, kind: 'sgpost', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (!(tp && tp.draw(c, 'post', 0, Xs, Ys, T))) plain(c, Xs, Ys, T, '#2A1E2A', 0.25, 1.6); } });
      // the shards: on their altars, over the pet, flying home or into the door
      const shardObjs = shards.map(sh => H.obj({ x: sh.ax, y: sh.ay + 0.6, kind: 'sgshard', r: 0, label: '', sh,
        draw(c, Xs, Ys, T, o) { const sh = o.sh; if (sh.state !== 'altar' || R.flyHome.some(f => f.sh === sh)) return; const tp = tp0(), bob = Math.sin(g.t * 2.2 + sh.ax) * T * 0.08, y = X.sy(sh.ay) - T * 1.45 + bob; if (!(tp && tp.draw(c, 'shard', 0, Xs, y, T))) shard2D(c, Xs, y, T); } }));
      const carryObj = H.obj({ x: me.x, y: me.y + 0.05, kind: 'sgcarry', r: 0, label: '',
        draw(c, Xs, Ys, T) { const tp = tp0(); if (R.carry) { const bob = Math.sin(g.t * 3) * T * 0.08, y = X.sy(me.y) - T * 1.55 + bob; if (!(tp && tp.draw(c, 'shard', 0, X.sx(me.x), y, T))) shard2D(c, X.sx(me.x), y, T); }
          for (const f of R.flyHome) { const u = ease(f.t / 0.9), x = lerp(f.x0, f.sh.ax, u), y = lerp(f.y0, f.sh.ay - 0.9, u) - Math.sin(u * PI) * 2.2; if (!(tp && tp.draw(c, 'shard', 0, X.sx(x), X.sy(y), T, { alpha: 0.85 }))) shard2D(c, X.sx(x), X.sy(y), T); } } });
      function shard2D(c, x, y, T) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite(VIO), x - T * 0.6, y - T * 0.9, T * 1.2, T * 1.2); c.restore(); c.save(); c.fillStyle = '#D8C0FF'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y - T * 0.6); c.lineTo(x + T * 0.16, y - T * 0.25); c.lineTo(x, y); c.lineTo(x - T * 0.16, y - T * 0.25); c.closePath(); c.fill(); c.stroke(); c.restore(); }
      // the great door: the tail behind, the leaves in the doorway, the frame and the scorpion's body, its arms, the sting and the star
      function tailPts(Xs, Yf, T, G) { const u = ease(S.uncoil), a0 = lerp(-PI / 2 - 0.78, -PI / 2 - 0.1, u), b = lerp(0.62, 0.035, u), pts = [[Xs + G.tail[0] * T, Yf - G.tail[1] * T, a0]]; let a = a0;
        const L = tp0() ? tp0().TAIL : [0.62, 0.58, 0.55, 0.52, 0.48, 0.45, 0.42]; for (let i = 0; i < L.length; i++) { const p = pts[pts.length - 1], wob = Math.sin(g.t * 1.1 + i * 0.6) * 0.03 * (1 - u * 0.5); pts.push([p[0] + Math.cos(a) * L[i] * T, p[1] + Math.sin(a) * L[i] * T, a]); a += b + wob; } pts.tipA = a; return pts; }
      const door = H.obj({ x: DOORX, y: DOORY - 0.02, kind: 'sgdoor', r: 0, h: 5, label: '',
        draw(c, Xs, Ys, T) { const tp = tp0(), G = tp ? tp.GEO : { WO: 1.3, PZ: 0.22, JW: 0.62, JD: 0.45, L0: 3.4, L1: 4.1, stud: [-0.85, 0, 0.85], studZ: 3.76, sh: [0.66, 4.22], claw: 2.3, tail: [0, 5.3], eyes: [] }, Yf = X.sy(DOORY), a = S.fade;
          if (!tp) { door2D(c, Xs, Yf, T, G); return; }
          c.save(); c.globalAlpha *= a;
          const P = tailPts(Xs, Yf, T, G), L = tp.TAIL; for (let i = 0; i < L.length; i++) { const p = P[i], q = P[i + 1]; tp.draw(c, 'tseg', 0, p[0], p[1], T * L[i] / 0.62, { rot: Math.atan2(q[1] - p[1], q[0] - p[0]) + PI / 2 }); }
          const tip = P[P.length - 1]; tp.draw(c, 'sting', 0, tip[0], tip[1], T * 0.9, { rot: P.tipA + PI / 2 });
          const k = ease(S.open), off = k * (G.WO + 0.16) * T; c.save(); c.beginPath(); c.rect(Xs - G.WO * T, Yf - (G.L0 + 0.15) * T, G.WO * 2 * T, (G.L0 + 0.6) * T); c.clip(); tp.draw(c, 'leaf', 'l', Xs - off, Yf, T); tp.draw(c, 'leaf', 'r', Xs + off, Yf, T); c.restore();
          tp.draw(c, 'door', 0, Xs, Yf, T);
          const ca = lerp(-0.29, 0.92, ease(S.claw)); tp.draw(c, 'arm', 0, Xs - G.sh[0] * T, Yf - G.sh[1] * T, T, { rot: ca }); tp.draw(c, 'arm', 0, Xs + G.sh[0] * T, Yf - G.sh[1] * T, T, { rot: -ca, sx: -1 });
          const sx = tip[0] + Math.cos(P.tipA) * T * 0.62, sy = tip[1] + Math.sin(P.tipA) * T * 0.62; S.starX = sx; S.starY = sy; tp.draw(c, 'star', 0, sx, sy, T * (0.8 + 0.25 * ease(S.ignite)), { rot: g.t * 0.2 * S.ignite });
          c.restore(); } });
      function door2D(c, Xs, Yf, T, G) { c.save(); c.globalAlpha *= S.fade; const k = ease(S.open), off = k * G.WO * T; c.fillStyle = '#7A4A14'; c.fillRect(Xs - G.WO * T - off, Yf - G.L0 * T, G.WO * T, G.L0 * T); c.fillRect(Xs + off, Yf - G.L0 * T, G.WO * T, G.L0 * T);
        c.fillStyle = '#8E6A5A'; c.strokeStyle = INK; c.lineWidth = 2; for (const sd of [-1, 1]) { c.fillRect(Xs + sd * (G.WO + G.JW) * T - G.JW * T, Yf - G.L0 * T, G.JW * 2 * T, G.L0 * T); } c.fillRect(Xs - (G.WO + 2 * G.JW) * T, Yf - G.L1 * T, (G.WO + 2 * G.JW) * 2 * T, (G.L1 - G.L0) * T);
        c.fillStyle = '#957943'; c.beginPath(); c.ellipse(Xs, Yf - (G.L1 + 0.4) * T, T * 0.7, T * 0.36, 0, 0, TAU); c.fill(); c.stroke(); S.starX = Xs; S.starY = Yf - (6.2 + 2.6 * ease(S.uncoil)) * T; c.restore(); }
      const crown = H.obj({ x: CROWN.x, y: CROWN.y, kind: 'sgcrown', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (tp) tp.draw(c, 'crown', 0, Xs, Ys, T, { alpha: S.crownFade }); } });
      for (const p of PILLARS) H.obj({ x: p.x, y: p.y + 0.05, kind: 'sgcol', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (!(tp && tp.draw(c, 'col', 0, Xs, Ys, T))) plain(c, Xs, Ys, T, '#2A1E2A', 0.5, 2.6); } });
      for (const p of RUINS) H.obj({ x: p.x, y: p.y + 0.05, kind: 'sgruin', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (!(tp && tp.draw(c, 'col', p.v, Xs, Ys, T))) plain(c, Xs, Ys, T, '#2A1E2A', 0.5, 1.4); } });
      for (const p of ANCH.slice(1)) H.obj({ x: p.x, y: p.y + 0.05, kind: 'sganchor', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (!(tp && tp.draw(c, 'post', 0, Xs, Ys, T * 1.25))) plain(c, Xs, Ys, T, '#2A1E2A', 0.3, 2.0); } });
      const frags = FRAGS.map(q => H.obj({ x: q.x, y: q.y, kind: 'sgfrag', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = tp0(); if (!tp) return; const t = g.t, bob = Math.sin(t * 0.7 + q.ph) * 0.22, lift = T * (q.lift + bob), sc = T * q.s;
        const deb = k => { const an = t * 0.4 * q.dir + q.ph + k * PI, dz = Math.sin(an); return { dz, x: Xs + Math.cos(an) * 0.8 * q.s * T, y: Ys - lift - T * 0.55 * q.s + dz * T * 0.22 * q.s }; };
        const d = [deb(0), deb(1)]; for (const e of d) if (e.dz < 0) tp.draw(c, 'frag', 2, e.x, e.y, sc * 0.6);
        tp.draw(c, 'frag', q.v, Xs, Ys - lift, sc, { rot: Math.sin(t * 0.3 + q.ph) * 0.08 });
        for (const e of d) if (e.dz >= 0) tp.draw(c, 'frag', 2, e.x, e.y, sc * 0.6); } }));
      H.obj({ x: AC.x, y: 1e6, kind: 'sglight', r: 0, label: '', draw(c) { if (fgx()) lightOver(c); else over2D(c); } });

      /* ---- the light ---- */
      const onScr = (x, y, r) => { const T = X.Tz(), Xs = X.sx(x), Ys = X.sy(y), Rr = r * T; return Xs + Rr > -T && Xs - Rr < X.W() + T && Ys + Rr > -T * 3 && Ys - Rr < X.H() + T * 3; };
      const gazeCol = s => s.seeK > 0.02 ? lerpHex(AMB, HOT, Math.min(1, s.seeK * (0.4 + R.meter))) : s.look && s.look.chime ? '#E8B0FF' : AMB;
      function lerpHex(a, b, u) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), f = (x, s) => (x >> s) & 255, m = s => Math.round(lerp(f(A, s), f(B, s), u)); return '#' + ((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, '0'); }
      // a gaze on the GPU: its sectors side by side, each cut where its rays meet cover (kind 336)
      function coneQ(Q, s, a, tab, N, col, al) { const T = X.Tz(), sx = X.sx(s.x), sy = X.sy(s.y), R2 = s.range * T, h = s.half / N, kw = Math.tan(h) * 1.6 + 0.02;
        for (let i = 0; i < N; i++) { if (tab[i] < 0.01 && tab[i + 1] < 0.01) continue; const m = a - s.half + (2 * i + 1) * h, cx = Math.cos(m), cy = Math.sin(m);
          Q.quad(336, sx + cx * R2 / 2, sy + cy * R2 / 2, cx * R2 / 2, cy * R2 / 2, -cy * R2 * kw, cx * R2 * kw, col, al, 100 + i + 5 * h, N + 0.998 * clamp(tab[i], 0, 1), clamp(tab[i + 1], 0, 1)); } }
      const PREV = new Float32Array(33);
      function previewTab(s, a, N) { for (let i = 0; i <= N; i++) { const b = a - s.half + i / N * s.half * 2; PREV[i] = rayLen(s.x, s.y, Math.cos(b), Math.sin(b), s.range, s.id) / s.range; } return PREV; }
      // the same gaze in 2D (no GPU painter): a fan of light to where its rays stop
      function cone2D(c, s, a, tab, N, col, al) { const T = X.Tz(), sx = X.sx(s.x), sy = X.sy(s.y), R2 = s.range * T; c.save(); c.globalCompositeOperation = 'lighter'; const g2 = c.createRadialGradient(sx, sy, 0, sx, sy, R2); g2.addColorStop(0, col); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.globalAlpha = al * 0.5;
        c.beginPath(); c.moveTo(sx, sy); for (let i = 0; i <= N; i++) { const b = a - s.half + i / N * s.half * 2, r = tab[i] * R2; c.lineTo(sx + Math.cos(b) * r, sy + Math.sin(b) * r); } c.closePath(); c.fill(); c.globalAlpha = al * 0.7; c.strokeStyle = col; c.lineWidth = 1.5; c.stroke(); c.restore(); }
      function threadPts(th, n) { const k = S.phase === 'puzzle' ? taut(th, R.sclk) : 0, sag = (1 - k) * 0.35, out = []; for (let i = 0; i <= n; i++) { const u = i / n; out.push([lerp(th.a[0], th.b[0], u), lerp(th.a[1], th.b[1], u) + Math.sin(u * PI) * sag - 1.15]); } return out; }
      function lightGround(c) { const F = fgx(); if (!F) return; const lf = lowFx(), T = X.Tz(), t = g.t; let Q = null; const q = () => Q || (Q = F.begin(c, null));
        // the vigil: each stone's gaze (and a step stone's next, faintly, as its turn nears), the sanctuary, the altars, the amber glass's glints
        if (onScr(17, 30, 14)) { const Q2 = q();
          if (S.phase === 'puzzle' || S.phase === 'opening') for (const s of stones) { if (!onScr(s.x, s.y, s.range + 1)) continue; const fadeK = S.phase === 'opening' ? 1 - ease(S.openT / 1.5) : 1; if (fadeK < 0.02) continue;
            coneQ(Q2, s, s.a, s.tab, s.N, gazeCol(s), (0.85 + 0.35 * s.seeK) * fadeK);
            const nx = !s.look && nextOf(s, R.sclk); if (nx && nx.k > 0.01 && !lf) coneQ(Q2, s, nx.a, previewTab(s, nx.a, 14), 14, '#C8A0FF', 0.22 * nx.k * fadeK);
            Q2.glow(X.sx(s.x), X.sy(s.y), T * 1.4, AMB, 0.18 + 0.2 * s.seeK); }
          const sk = 0.5 + 0.12 * Math.sin(t * 1.6); Q2.glow(X.sx(SAFE.x), X.sy(SAFE.y + 1.2), T * 3.0, VIO, 0.16 * sk + (R.carry ? 0.12 : 0), 0.55); Q2.ring(X.sx(SAFE.x), X.sy(SAFE.y + 0.4), T * SAFE.r * 0.98, VIO_HI, 0.18 + (R.carry ? 0.2 + 0.1 * Math.sin(t * 4) : 0), T * 0.16, 0.55);
          for (const sh of shards) { if (sh.state === 'home') continue; Q2.glow(X.sx(sh.ax), X.sy(sh.ay + 0.4), T * 1.7, VIO, sh.state === 'altar' ? 0.2 : 0.05, 0.55); }
          if (!lf) for (let i = 0; i < 9; i++) { const u = (t * 0.05 + i / 9) % 1, x = 6 + hh(i, 1, 9) * 23, y = 24 + hh(i, 2, 9) * 12; if (!onScr(x, y, 1)) continue; Q2.star(X.sx(x), X.sy(y), T * 0.25, 0.4 * Math.sin(u * PI), '#FFD8A0'); } }
        // the threads' light on the floor beneath them
        for (const th of THREADS) { if (!onScr((th.a[0] + th.b[0]) / 2, (th.a[1] + th.b[1]) / 2, 3)) continue; const Q2 = q(), k = S.phase === 'puzzle' ? taut(th, R.sclk) : 0, mx = X.sx((th.a[0] + th.b[0]) / 2), my = X.sy((th.a[1] + th.b[1]) / 2); Q2.glow(mx, my, T * 1.6, RUBY, 0.1 + 0.18 * k, 0.5); }
        // the door: its threshold, once open the violet light pouring out across the courtyard
        if (onScr(DOORX, DOORY, 7)) { const Q2 = q(), dx = X.sx(DOORX), dy = X.sy(DOORY), o = ease(S.open);
          Q2.glow(dx, dy + T * 0.6, T * 3.4, VIO, 0.08 + 0.2 * Math.max(R.banked.length / 3 * 0.6, o), 0.45);
          if (o > 0.02) { Q2.quad(138, dx, dy + T * 3.6, T * 4.6, 0, 0, T * 3.8, '#C8A0FF', 0.45 * o, 0.48, 2.1, lf ? 0 : 0.8); } if (!lf) for (const m of S.mist) Q2.smoke(X.sx(m.x), X.sy(m.y), T * m.r, m.a, m.sd, '#4A2A5A', 0.6); }
        // the sanctum: its sigil (the Scorpio sigil of Asmodeus's own light, kind 320, on the painted rings), the heart, the fonts, the rim's crimson light
        if (onScr(AC.x, AC.y, ARX + 3)) { const Q2 = q(), ax = X.sx(AC.x), ay = X.sy(AC.y), sk = S.sigK, Rq = SIG_R * T;
          Q2.glow(ax, ay, T * 3.0, RUBY, (0.1 + 0.04 * Math.sin(t * 1.1)) * sk, 1);
          if (sk > 0.02) Q2.quad(320, ax, ay, Rq, 0, 0, Rq, '#FF4A7A', 1, 1 + 0.3 * Math.max(0, sk - 1), t * 0.03, (lf ? 0.32 : 0.45) * Math.min(1.6, sk));
          for (let i = 0; i < 3; i++) { const f = FONTS[i], k = S.fontK[i]; if (k < 0.02 || !onScr(f.x, f.y, 2)) continue; Q2.glow(X.sx(f.x), X.sy(f.y), T * f.r * 2.2, AMB, 0.22 * k, 1); if (!lf) Q2.caustic(X.sx(f.x), X.sy(f.y), T * f.r * 0.95, '#FFB060', 0.3 * k, i * 2.3, 1); }
          if (!lf) for (let i = 0; i < 10; i++) { const a = -PI + (i + 0.5) / 10 * TAU + Math.sin(t * 0.06 + i) * 0.1, p = spt(a), mx = AC.x + p[0] * ARX * 0.97, my = AC.y + p[1] * ARY * 0.97; if (my > WALLY - 1) continue; Q2.glow(X.sx(mx), X.sy(my) + T * 0.4, T * 2.2, '#C02050', 0.1 * S.moonK, 0.5); } }
        if (Q) F.flush(c); }
      function lightOver(c) { const F = fgx(); if (!F) return; const lf = lowFx(), T = X.Tz(), t = g.t; let Q = null; const q = () => Q || (Q = F.begin(c, null));
        // the eyes (flaring when they see), the shards, the threads, the chimes' rings, the pet's tell
        if (S.phase === 'puzzle' || S.phase === 'opening') for (const s of stones) { if (!onScr(s.x, s.y - 3, 2)) continue; const Q2 = q(), ex = X.sx(s.x), ey = X.sy(s.y) - T * 3.0, k = 0.55 + 0.45 * Math.max(s.seeK, Math.min(1, s.eye)), d = [Math.cos(s.a), Math.sin(s.a)];
          Q2.glow(ex, ey, T * (1.1 + 0.6 * k), s.seeK > 0.05 ? AMB_HI : AMB, 0.5 * k); Q2.glow(ex + d[0] * T * 0.12, ey + d[1] * T * 0.07, T * 0.24, HOT, 0.85); Q2.beam(ex, ey, ex + d[0] * T * 0.9, ey + d[1] * T * 0.5, T * 0.16, AMB, 0.35 * k); if (s.eye > 0.05) Q2.star(ex, ey, T * (0.6 + 0.6 * s.eye), Math.min(1, s.eye), HOT); }
        for (const sh of shards) { if (sh.state !== 'altar' || R.flyHome.some(f => f.sh === sh) || !onScr(sh.ax, sh.ay - 1.5, 2)) continue; const Q2 = q(), bob = Math.sin(g.t * 2.2 + sh.ax) * T * 0.08, x = X.sx(sh.ax), y = X.sy(sh.ay) - T * 1.75 + bob; Q2.glow(x, y, T * 0.9, VIO, 0.4 + 0.1 * Math.sin(t * 3 + sh.ax)); Q2.star(x, y - T * 0.1, T * 0.4, 0.55 + 0.25 * Math.sin(t * 2.6 + sh.ay), VIO_HI); }
        if (R.carry) { const Q2 = q(), bob = Math.sin(g.t * 3) * T * 0.08, x = X.sx(me.x), y = X.sy(me.y) - T * 1.85 + bob; Q2.glow(x, y, T * 1.1, VIO, 0.45); Q2.star(x, y, T * 0.45, 0.7, VIO_HI); Q2.glow(X.sx(me.x), X.sy(me.y), T * 1.2, VIO, 0.12, 0.5); }
        for (const f of R.flyHome) { const Q2 = q(), u = ease(f.t / 0.9), x = lerp(f.x0, f.sh.ax, u), y = lerp(f.y0, f.sh.ay - 0.9, u) - Math.sin(u * PI) * 2.2; Q2.glow(X.sx(x), X.sy(y), T * 1.0, VIO, 0.5); }
        for (const b of R.bankFx) { const Q2 = q(), G = SP() ? SP().GEO : { stud: [-0.85, 0, 0.85], studZ: 3.76 }, u = ease(b.t / 1.0), tx = DOORX + G.stud[[0, 2, 1][Math.min(2, b.slot)]], ty = DOORY - G.studZ, x = lerp(b.x0, tx, u), y = lerp(b.y0, ty, u) - Math.sin(u * PI) * 1.6; Q2.glow(X.sx(x), X.sy(y), T * 1.0, VIO, 0.6 * (1 - u * 0.4)); Q2.star(X.sx(x), X.sy(y), T * 0.5, 0.8, VIO_HI); }
        for (const th of THREADS) { if (!onScr((th.a[0] + th.b[0]) / 2, (th.a[1] + th.b[1]) / 2 - 1, 3)) continue; const Q2 = q(), k = S.phase === 'puzzle' ? taut(th, R.sclk) : 0, tl = S.phase === 'puzzle' ? tellOf(th, R.sclk) : 0, fl = tl > 0 ? 0.5 + 0.5 * Math.sin(t * 28) : 0, pts = threadPts(th, 6), al = 0.18 + 0.72 * k + 0.35 * tl * fl;
          for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], ax = X.sx(a[0]), ay = X.sy(a[1]), bx = X.sx(b[0]), by = X.sy(b[1]), dx = (bx - ax) / 2, dy = (by - ay) / 2, L = Math.hypot(dx, dy) || 1, w = T * (0.12 + 0.1 * k);
            Q2.quad(332, ax + dx, ay + dy, dx * 1.08, dy * 1.08, -dy / L * w, dx / L * w, RUBY, 1, 0.15 * k, th.ph * 3 + i * 0.7, al); } }
        for (const r of R.rings) { const Q2 = q(), u = r.t / 1.2; Q2.ring(X.sx(r.x), X.sy(r.y), T * (0.4 + 2.6 * u), VIO_HI, 0.6 * (1 - u), T * 0.2); Q2.ring(X.sx(r.x), X.sy(r.y + 1.3), T * (0.6 + 3.6 * u), '#E8B0FF', 0.35 * (1 - u), T * 0.25, 0.4); }
        for (const p of R.plucks) { const Q2 = q(), u = p.t / 1.0; Q2.ring(X.sx(p.x), X.sy(p.y), T * (0.3 + 2.4 * u), RUBY, 0.55 * (1 - u), T * 0.18, 0.5); Q2.glow(X.sx(p.x), X.sy(p.y) - T * 0.6, T * 1.4, PINK, 0.4 * (1 - u)); }
        if (R.mode === 'play' && !me.dead) { const Q2 = q(), mx = X.sx(me.x), my = X.sy(me.y); if (R.meter > 0.02) { Q2.glow(mx, my - T * 0.4, T * (1.0 + 0.6 * R.meter), lerpHex(AMB, HOT, R.meter), 0.25 + 0.5 * R.meter); Q2.ring(mx, my, T * (0.9 - 0.25 * R.meter), AMB_HI, 0.25 + 0.55 * R.meter, T * 0.12, 0.5); }
          else if (R.hidden) { Q2.ring(mx, my, T * 0.8, '#B8A0E8', 0.45 + 0.1 * Math.sin(t * 4), T * 0.12, 0.5); Q2.glow(mx, my, T * 0.9, '#6A50A8', 0.18, 0.5); } }
        // the door: its sockets lit as the shards come home; opening: the shards rise into the star, it ignites, light runs down the tail, the eyes, the leaves' seam
        if (onScr(DOORX, DOORY - 4, 9)) { const Q2 = q(), tp = SP(), G = tp ? tp.GEO : { stud: [-0.85, 0, 0.85], studZ: 3.76, eyes: [[-0.2, 4.62], [0.2, 4.62]], L0: 3.4, WO: 1.3 }, dx = X.sx(DOORX), Yf = X.sy(DOORY), fa = S.fade, o = ease(S.open);
          for (let i = 0; i < 3; i++) { S.litK[i] += ((i < R.banked.length && S.rise < 0.98 ? 1 : 0) - S.litK[i]) * Math.min(1, S.dt * 4); const k2 = S.litK[i]; if (k2 < 0.02) continue; const sx = dx + G.stud[[0, 2, 1][i]] * T, sy = Yf - T * G.studZ; Q2.glow(sx, sy, T * 0.6, VIO, (0.55 + 0.2 * Math.sin(t * 3 + i)) * k2 * fa); Q2.star(sx, sy, T * 0.35, 0.7 * k2 * fa, VIO_HI); }
          if (S.rise > 0 && S.rise < 1) for (let i = 0; i < 3; i++) { const sx = dx + G.stud[[0, 2, 1][i]] * T, sy = Yf - T * G.studZ, u = ease(S.rise), x = lerp(sx, S.starX || dx, u), y = lerp(sy, S.starY || Yf - T * 6, u) - Math.sin(u * PI) * T * 0.8; Q2.glow(x, y, T * 0.8, VIO, 0.7 * fa); Q2.star(x, y, T * 0.4, 0.9, VIO_HI); }
          const sx0 = S.starX || dx, sy0 = S.starY || Yf - T * 6, ig = S.ignite; Q2.glow(sx0, sy0, T * (0.7 + 2.0 * ig), VIO, (0.18 + 0.5 * ig) * fa); if (ig > 0.01) { Q2.star(sx0, sy0, T * (0.8 + 1.4 * ig), Math.min(1, ig * 1.4) * fa, '#F0E4FF'); Q2.quad(333, sx0, sy0, T * 1.6 * ig, 0, 0, T * 1.6 * ig, '#FF6A9A', 1, Math.min(1, ig), 1.7, 0.5 * ig * fa); if (!lf) Q2.ring(sx0, sy0, T * (1.2 + 0.25 * Math.sin(t * 2)), VIO_HI, 0.25 * ig * fa, T * 0.18); }
          if (S.run > 0.01 && S.run < 1) { const P = tailPts(dx, Yf, T, tp ? tp.GEO : { tail: [0, 5.3] }), n = P.length, j = (1 - S.run) * (n - 1), i0 = Math.floor(j), u = j - i0, a2 = P[Math.min(n - 1, i0)], b2 = P[Math.min(n - 1, i0 + 1)]; Q2.glow(lerp(a2[0], b2[0], u), lerp(a2[1], b2[1], u), T * 0.9, VIO_HI, 0.7 * fa); }
          if (S.eyes > 0.01) for (const [ex, ey] of G.eyes) { Q2.glow(dx + ex * T, Yf - ey * T, T * 0.35, AMB, 0.8 * S.eyes * fa); Q2.glow(dx + ex * T, Yf - ey * T, T * 0.1, HOT, S.eyes * fa); }
          if (S.phase === 'opening' || o > 0.01) { const top = Yf - T * G.L0, bot = Yf - T * 0.2, sp = clamp((S.openT - 3.2) / 0.6, 0, 1) * (1 - o * 0.6); if (sp > 0.01) { Q2.beam(dx, top, dx, bot, T * 0.14, '#F0E4FF', 0.9 * sp * fa); Q2.beam(dx, top, dx, bot, T * 0.6, VIO, 0.5 * sp * fa); }
            if (o > 0.01) { const w = G.WO * T * o; Q2.glow(dx, (top + bot) / 2, T * (1.2 + 1.2 * o), '#C8A0FF', 0.5 * o * fa); Q2.quad(138, dx, bot + T * 1.2, w * 1.4 + T * 0.2, 0, 0, T * 2.2, '#D8B8FF', 0.4 * o * fa, 0.5, 4.4, lf ? 0 : 1);
              if (!lf) for (let i = 0; i < 6; i++) { const u = (t * 0.3 + i / 6) % 1; Q2.star(dx + Math.sin(i * 2.3 + t) * w * 0.8, bot - (bot - top) * u, T * 0.07, 0.8 * Math.sin(u * PI) * o * fa, '#E8D8FF'); } } } }
        // the sanctum: the crown's ruby heart and its blades' tips, the posts' beads, the slack threads between the anchors, the shards in the air, motes
        if (onScr(CROWN.x, CROWN.y - 4, 6)) { const Q2 = q(), hx = X.sx(CROWN.x), hy = X.sy(CROWN.y) - T * 1.45, k = S.crownFade * (0.75 + 0.25 * S.sigK); Q2.glow(hx, hy, T * 1.8, RUBY, (0.35 + 0.1 * Math.sin(t * 1.4)) * k); Q2.eorb(hx, hy, T * 0.42, '#FF4A7A', 1, 0.8 * k, 2.2, 1);
          for (let j = 0; j < 7; j++) { const f = (j - 3) / 3, tip = tipOf(f); Q2.glow(hx + tip[0] * T, X.sy(CROWN.y) + tip[1] * T, T * 0.45, RUBY, 0.35 * k * (0.7 + 0.3 * Math.sin(t * 2 + j))); } }
        if (onScr(AC.x, AC.y, ARX + 4)) { const Q2 = q();
          for (const p of ANCH.slice(1)) if (onScr(p.x, p.y - 2, 1.5)) Q2.glow(X.sx(p.x), X.sy(p.y) - T * 2.15, T * 0.35, RUBY, 0.55);
          if (S.webK > 0.02) for (let k = 0; k < 7; k++) { const a = ANCH[k], b = ANCH[(k + 1) % 7], ha = a.crown ? 1.45 : 2.12, hb = b.crown ? 1.45 : 2.12, n = 6; let px = X.sx(a.x), py = X.sy(a.y) - ha * T;
            for (let i = 1; i <= n; i++) { const u = i / n, wx = lerp(a.x, b.x, u), wy = lerp(a.y, b.y, u), nx = X.sx(wx), ny = X.sy(wy) - lerp(ha, hb, u) * T + Math.sin(u * PI) * 0.9 * T, dx = (nx - px) / 2, dy = (ny - py) / 2, L = Math.hypot(dx, dy) || 1, w = T * 0.12;
              if (onScr(wx, wy, 2)) Q2.quad(332, px + dx, py + dy, dx * 1.08, dy * 1.08, -dy / L * w, dx / L * w, RUBY, 1, 0.25, k * 1.7 + i, 0.32 * S.webK); px = nx; py = ny; } }
          if (!lf) { for (const m of FRAGS) { if (!onScr(m.x, m.y - 2, 2.5)) continue; const bob = Math.sin(t * 0.7 + m.ph) * 0.22, mx = X.sx(m.x), my = X.sy(m.y) - T * (m.lift + bob); Q2.glow(mx, my - T * 0.5 * m.s, T * 0.9 * m.s, AMB, 0.2 + 0.08 * Math.sin(t * 1.3 + m.ph)); }
            for (let i = 0; i < 14; i++) { const u = (t * 0.07 + i / 14) % 1, a = i * 2.39, rr = 0.15 + 0.75 * hh(i, 4), p = spt(a), mx = AC.x + p[0] * ARX * rr, my = AC.y + p[1] * ARY * rr; Q2.star(X.sx(mx) + Math.sin(t * 0.6 + i) * T * 0.3, X.sy(my) - T * u * 3.5, T * 0.07, 0.75 * Math.sin(u * PI), '#FFB0D0'); } } }
        if (Q) F.flush(c); labels(c); }
      // where the crown's blade tips stand about its feet (the picture's own spines: tiles, y down)
      const TIPS = []; { const P = SP(); for (let j = 0; j < 7; j++) { const f = (j - 3) / 3, pts = P ? P.arcPts(f * 2.05, -0.95 - (1 - Math.abs(f)) * 0.12, -PI / 2 + f * 0.42, 4.0 + (1 - Math.abs(f)) * 1.6, f === 0 ? 1.2 : -Math.sign(f) * 1.25, 26) : [[f * 2, -4.5]]; TIPS.push(pts[pts.length - 1]); } }
      const tipOf = f => TIPS[Math.round(f * 3 + 3)] || [0, -4.5];
      function over2D(c) { const T = X.Tz();
        if (S.phase === 'puzzle') for (const s of stones) { const ex = X.sx(s.x), ey = X.sy(s.y) - T * 3.0, k = 0.55 + 0.45 * s.seeK; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * k; blitSized(c, glowSprite(AMB), ex - T * 0.7, ey - T * 0.7, T * 1.4, T * 1.4); c.restore(); }
        for (const th of THREADS) { const k = S.phase === 'puzzle' ? taut(th, R.sclk) : 0, pts = threadPts(th, 8); c.save(); c.strokeStyle = `rgba(255,60,110,${(0.3 + 0.6 * k).toFixed(2)})`; c.lineWidth = 1 + 2 * k; c.beginPath(); pts.forEach((p, i) => { const x = X.sx(p[0]), y = X.sy(p[1]); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.restore(); }
        if (R.mode === 'play' && R.meter > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + 0.5 * R.meter; blitSized(c, glowSprite(AMB_HI), X.sx(me.x) - T, X.sy(me.y) - T * 1.4, T * 2, T * 2); c.restore(); }
        for (const sh of shards) if (sh.state === 'altar') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite(VIO), X.sx(sh.ax) - T * 0.7, X.sy(sh.ay) - T * 2.3, T * 1.4, T * 1.4); c.restore(); }
        labels(c); }
      function labels(c) { if (S.phase !== 'puzzle' || R.mode === 'won') return; const T = X.Tz(); c.save(); c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.font = `800 ${Math.round(T * 0.22)}px ${arcFont}`;
        for (const sh of shards) if (sh.state === 'altar' && Math.hypot(me.x - sh.ax, me.y - sh.ay) < 6) { const s = `shard of ${sh.name.replace('the ', '')}`; c.fillStyle = VIO_HI; c.strokeText(s, X.sx(sh.ax), X.sy(sh.ay) - T * 2.45); c.fillText(s, X.sx(sh.ax), X.sy(sh.ay) - T * 2.45); }
        if (R.carry && Math.hypot(me.x - SAFE.x, me.y - SAFE.y) < 9) { c.fillStyle = '#8FE0A6'; c.strokeText('sanctuary', X.sx(SAFE.x), X.sy(SAFE.y) + T * 2.2); c.fillText('sanctuary', X.sx(SAFE.x), X.sy(SAFE.y) + T * 2.2); }
        c.restore(); }
      function gaze2D(c) { if (S.phase !== 'puzzle') return; for (const s of stones) { if (!onScr(s.x, s.y, s.range + 1)) continue; cone2D(c, s, s.a, s.tab, s.N, gazeCol(s), 0.55 + 0.4 * s.seeK); const nx = !s.look && nextOf(s, R.sclk); if (nx && nx.k > 0.05) cone2D(c, s, nx.a, previewTab(s, nx.a, 14), 14, '#C8A0FF', 0.18 * nx.k); }
        if (R.hidden && R.mode === 'play') { const T = X.Tz(); c.save(); c.globalAlpha = 0.55; c.strokeStyle = '#B8A0E8'; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.ellipse(X.sx(me.x), X.sy(me.y), T * 0.7, T * 0.4, 0, 0, TAU); c.stroke(); c.restore(); } }

      /* ---- the stage's turn ---- */
      function update(dt) { R.t += dt; S.t += dt; S.dt = dt; carryObj.x = me.x; carryObj.y = me.y + 0.05;
        { const tp = SP(); if (tp && !tp.base && tp.setBase) tp.setBase(X.Tz() / (g.zoom || 1) * Math.min(2, (typeof arc !== 'undefined' && arc.dpr) || 1)); }   // (no loading pass ran: the floor's sharpness, once)
        play(dt);
        for (const f of R.flyHome) f.t += dt; for (let i = R.flyHome.length - 1; i >= 0; i--) if (R.flyHome[i].t > 0.95) R.flyHome.splice(i, 1);
        for (const b of R.bankFx) b.t += dt; for (let i = R.bankFx.length - 1; i >= 0; i--) if (R.bankFx[i].t > 1.05) { R.bankFx.splice(i, 1); }
        for (const r of R.rings) r.t += dt; for (let i = R.rings.length - 1; i >= 0; i--) if (R.rings[i].t > 1.2) R.rings.splice(i, 1);
        for (const p of R.plucks) p.t += dt; for (let i = R.plucks.length - 1; i >= 0; i--) if (R.plucks[i].t > 1.0) R.plucks.splice(i, 1);
        S.sigK += (S.sig - S.sigK) * Math.min(1, dt * 2); S.moonK += (S.moon - S.moonK) * Math.min(1, dt * 2); S.webK += (S.web - S.webK) * Math.min(1, dt * 2); for (let i = 0; i < 3; i++) S.fontK[i] += (S.font[i] - S.fontK[i]) * Math.min(1, dt * 2);
        if (S.phase === 'opening') { S.openT += dt; const u = S.openT;
          S.rise = clamp(u / 1.2, 0, 1); if (u > 1.2 && u - dt <= 1.2) { X.flash(0.3, '#E8D8FF'); X.shake(4, 0.5); note(523, 2.0, 'sine', 0.18); note(784, 2.4, 'sine', 0.1, null, 0.05); sfx('fanfare'); }
          S.ignite = clamp((u - 1.15) / 0.5, 0, 1); S.run = clamp((u - 1.3) / 0.9, 0, 1); S.eyes = clamp((u - 2.0) / 0.4, 0, 1); if (u > 2.0 && u - dt <= 2.0) { note(98, 2.6, 'sawtooth', 0.1, 70); sfx('thud'); }
          S.claw = clamp((u - 2.2) / 1.0, 0, 1); if (u > 2.2 && u - dt <= 2.2) { X.shake(5, 0.6); sfx('crack'); note(147, 0.6, 'square', 0.06); }
          S.uncoil = clamp((u - 2.6) / 1.8, 0, 1); if (u > 2.6 && u - dt <= 2.6) note(196, 2.2, 'triangle', 0.08, 262);
          if (u > 3.4) S.open = clamp((u - 3.4) / 2.4, 0, 1); if (u > 3.4 && u - dt <= 3.4) { X.shake(7, 1.6); sfx('whoosh'); note(65, 3.0, 'sine', 0.22); }
          if (S.open > 0.75 && !S.passable) setDoor(true);
          if (u > 3.5 && !lowFx() && S.mist.length < 14 && Math.random() < dt * 6) S.mist.push({ x: DOORX + (Math.random() - 0.5) * 2.2, y: DOORY + 0.3, vx: (Math.random() - 0.5) * 0.9, vy: 0.9 + Math.random() * 0.8, r: 1.0 + Math.random() * 1.0, a: 0, life: 0, max: 3.5 + Math.random() * 2, sd: Math.random() * 9 });
          if (u >= OPEN_T) opened(); }
        if (S.phase === 'open') { if (me.y < WALLY - 0.9 && Math.abs(me.x - DOORX) < 6 && !me.dead) seal(); else if (!lowFx() && S.mist.length < 8 && Math.random() < dt * 1.2) S.mist.push({ x: DOORX + (Math.random() - 0.5) * 2.2, y: DOORY + 0.3, vx: (Math.random() - 0.5) * 0.6, vy: 0.5 + Math.random() * 0.5, r: 0.9 + Math.random() * 0.8, a: 0, life: 0, max: 4 + Math.random() * 2, sd: Math.random() * 9 }); }
        if (S.phase === 'sealing') { S.sealT += dt; S.open = clamp(1 - S.sealT / SEAL_T, 0, 1); if (S.sealT >= SEAL_T) sealed(); }
        if (S.phase === 'boss' || S.phase === 'won') { S.uncoil += (0.12 - S.uncoil) * Math.min(1, dt * 0.7); S.ignite += (0.4 - S.ignite) * Math.min(1, dt * 0.7); }   // (the door sealed: the scorpion curls its tail back over its back, the star burning low)
        for (const m of S.mist) { m.life += dt; m.x += m.vx * dt; m.y += m.vy * dt; m.vy *= 1 - dt * 0.3; m.r += dt * 0.35; m.a = 0.35 * Math.sin(Math.min(1, m.life / m.max) * PI); } for (let i = S.mist.length - 1; i >= 0; i--) if (S.mist[i].life >= S.mist[i].max) S.mist.splice(i, 1);
        // the door and the crown grow faint while something stands behind them
        const B = AB(), boss = g.boss && !g.boss.dead ? g.boss : null, behind = (x, y, w) => y < DOORY - 0.2 && y > DOORY - (S.phase === 'boss' || S.phase === 'won' ? 7.4 : 10.2) && Math.abs(x - DOORX) < w, behindC = (x, y, w) => y < CROWN.y - 0.1 && y > CROWN.y - 7 && Math.abs(x - CROWN.x) < w;
        const hid = behind(me.x, me.y, 3.6) || (boss && behind(boss.x, boss.y, 3.6 + (boss.r || 1))); S.fade += ((hid ? 0.42 : 1) - S.fade) * Math.min(1, dt * 6);
        const hidC = behindC(me.x, me.y, 4.2) || (boss && behindC(boss.x, boss.y, 4.2 + (boss.r || 1))); S.crownFade += ((hidC ? 0.42 : 1) - S.crownFade) * Math.min(1, dt * 6);
        if (S.phase === 'boss' && B && typeof B.update === 'function') { try { B.update(dt); } catch (e) { if (typeof console !== 'undefined') console.error(e); } } }
      const doorHint = { x: DOORX, y: DOORY - 0.4, h: 4.6, label: 'The great door' };
      const safeHint = { x: SAFE.x, y: SAFE.y + 1.0, h: 1.2, label: 'The sanctuary' };
      const mod = { R, S, stones, shards, door, crown, frags, CHM, update,
        geo: { AC, ARX, ARY, SEN, WALLY, DOORX, DOORY, SAFE, START, CH, STONES: PROTO, CHIMES, ALTARS, THREADS, COVERS, RINGS, ANCH, PILLARS, RUINS, FONTS, CROWN, THR },
        arena: arenaA, litAt: (x, y, t) => PROTO.some(s => seesAt(s, schedA(s, t), x, y)), stoneA: (id, t) => schedA(PROTO.find(s => s.id === id), t), taut: (id, t) => taut(THREADS.find(th => th.id === id), t), inSafe,
        blocked: (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return !inChamber(tx, ty) || SOLID_SET.has(tx + ',' + ty); }, threadHit: (x, y, t) => THREADS.some(th => taut(th, t) > 0.6 && segD(x, y, th.a, th.b) < 0.42),
        take: id => take(shards.find(s => s.id === id)), bank, ring: id => ring(CHM.find(c => c.id === id)),
        solve() { if (S.phase !== 'puzzle') return; for (const sh of shards) if (sh.state !== 'home') { sh.state = 'home'; R.banked.push(sh.id); } R.carry = null; R.mode = 'won'; S.lit = 3; startOpen(); },   /* (tests: straight to the door) */
        hint() { if (S.phase === 'open') return doorHint; if (R.mode !== 'play') return null; if (R.carry) return safeHint; if (R.t - R.lastTake > 16 && R.seenN >= 2) { let best = null, bd = 1e9; for (const sh of shards) if (sh.state === 'altar') { const d = Math.hypot(me.x - sh.ax, me.y - sh.ay); if (d < bd) { bd = d; best = sh; } } if (best) return { x: best.ax, y: best.ay, h: 2.4, label: 'A star shard' }; } return null; },
        goal: () => { if (S.phase === 'boss') { const B = AB(); return B && typeof B.goal === 'function' ? B.goal() : 'Face what waits in the Amber Sanctum'; }
          if (S.phase === 'won' || self.done) return 'Scorpio awakens'; if (S.phase === 'opening') return 'The great door opens…'; if (S.phase === 'open') return 'Walk through the great door'; if (S.phase === 'sealing') return 'The door seals behind you';
          if (R.mode === 'intro') return 'The Amber Vigil'; const n = R.banked.length; return `${n} of 3 shards at the door${R.carry ? ` · carrying the shard of ${R.carry.name.replace('the ', '')}: to the sanctuary` : ''}${inSafe(me.x, me.y) ? ' · safe' : R.meter > 0.3 ? ' · seen…' : R.hidden ? ' · hidden' : ''}`; },
        cam() { if (S.phase === 'opening') return { x: DOORX, y: DOORY - 2.4 - 1.4 * ease(S.uncoil), k: 0.86, zoom: 0.8 }; if (S.phase === 'puzzle' || S.phase === 'open') return { x: me.x, y: me.y, k: 0, zoom: 0.74 }; if (S.phase === 'boss') { const B = AB(); if (B && typeof B.cam === 'function') { try { return B.cam(); } catch (e) {} } } return null; },
        hideHud() { const B = AB(); return S.phase === 'boss' && B && typeof B.hideHud === 'function' ? !!B.hideHud() : false; },
        onBossDeath(m) { const B = AB(); return S.phase === 'boss' && B && typeof B.onBossDeath === 'function' ? !!B.onBossDeath(m) : false; },
        drawGround(c) { if (fgx()) lightGround(c); else gaze2D(c); const B = AB(); if (S.phase === 'boss' && B && typeof B.drawGround === 'function') { try { B.drawGround(c); } catch (e) {} } },
        drawOver(c) { const B = AB(); if (S.phase === 'boss' && B && typeof B.drawOver === 'function') { try { B.drawOver(c); } catch (e) {} }
          if (self.done || R.mode !== 'play' || S.phase !== 'puzzle') return; const W = X.W(), bw = Math.min(280, W - 130); c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; GFX.rr(c, 10, 124, bw, 52, 8); c.fill(); c.font = `800 10.5px ${arcFont}`; c.textAlign = 'left'; c.fillStyle = '#FFFFFF';
          c.fillText('Keep out of the amber light, or in a', 18, 139); c.fillText('shadow; the sanctuary before the door is safe.', 18, 151); c.fillStyle = VIO_HI; c.fillText(`Star shards at the door: ${R.banked.length} of 3${R.seenN ? ` · seen ${R.seenN}×` : ''}`, 18, 165); c.restore(); },
        leave() {},
        teardown };
      function teardown() { const B = AB(); if (B && typeof B.stop === 'function') { try { B.stop(); } catch (e) {} } if (CUR && CUR.S === S) CUR = null; S.mist.length = 0; R.flyHome.length = 0; R.rings.length = 0; R.plucks.length = 0; }
      LIVE = mod;
      return mod;
    },
  });
  // (the dunes' own warm-ups on the loading screen, their land's textures and puzzles' pieces, are not for its gate: skipped there; the gate warms its own)
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.dunes; if (Rf && !Rf.__sgGate) { const o = Rf.preload; Rf.__sgGate = 1; Rf.preload = function (P) { if (P && P.F && P.F.rift && P.F.rift.gate) return []; return o ? o.apply(this, arguments) : []; }; } } catch (e) {}
  /* ---- letting go: when the dungeon game closes (its destroy) and whenever a new stage is made (BEL.releaseStale) the gate's
     boss is stopped and every picture given back ---- */
  let LIVE = null;
  function release() { const m = LIVE; LIVE = null; CUR = null; if (m) { try { m.teardown(); } catch (e) {} } try { STANDIN.stop(); } catch (e) {} const tp = SP(); if (tp) { try { tp.release(); } catch (e) {} } }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { if (LIVE || CUR) release(); }); } catch (e) {}
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__sgRel) { const c0 = GD.create; GD.__sgRel = 1; GD.create = function () { const api = c0.apply(this, arguments); if (api && typeof api.destroy === 'function') { const d0 = api.destroy; api.destroy = function () { if (LIVE) release(); return d0.apply(this, arguments); }; } return api; }; } } catch (e) {}
  if (typeof window !== 'undefined') window.SCORPIO_GATE = { get live() { return LIVE; }, release, LAYOUT, AC, ARX, ARY, SEN, WALLY, DOORX, DOORY, STONES: PROTO, CHIMES, ALTARS, THREADS, COVERS, RINGS, ANCH, PILLARS, RUINS, FONTS, CROWN, STANDIN, schedA, seesAt, rayLen, taut };
})();
