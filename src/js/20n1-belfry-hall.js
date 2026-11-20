/* ---------- Rift 1, the Drowned Belfry · section 1: THE HALL OF THREE TIDES (v391, worker B2) ----------
   The causeway runs north out of the sea into a round limestone vestibule (ivory walls over a black tidal stain, thick
   brass ribs, turquoise light through the cracks, a ring of shallow water round a dry dais, an oculus of moonlight). Three
   broad sealed gates stand in its walls, each with a carved direction, a big emblem and an objective plaque:
     WEST  the shield        The Last Beacon      keep the crystal intact for 30 s against waves of 120 reef gnawers (v392 B2)
     EAST  crossed fangs     The Sunken Muster    50 ordinary monsters (5 groups of 10), then Varkul, the Chainbound
     NORTH the spiral        The Hundredfold Roll 100 bell rollers destroyed only by their own collisions; move and roll
   On the dais three empty sockets stand round a recessed seam, brass channels running in to it; "Crystals returned: n/3".
   Rules (the spec's): one unfinished gate is chosen at a time (the others stay sealed, and stay sealed while a crystal is
   carried); a trial starts only once the pet crosses its marked start boundary and sees a ready cue (west and north a
   three-second count, not part of the west's thirty); success reveals the crystal, which the pet collects by interacting
   and carries in a floating Resonance bubble (no slowdown, no skill slot) back to its own socket. Failure, a knockout or
   walking back into the hall resets that trial alone and returns the pet to the hall; deposited crystals stay. The third
   deposit raises a limestone doorway from under the dais (channels converge, a deep bell note, the seam opens, the door
   rises shedding water, the camera holds on it, the pet is moved clear first), its slabs part, and the way to Kharrox is
   open. Persisted separately in st.rift.hall[riftId] at every checkpoint: sel (the active gate), earn, carry, dep, door.
   The north trial sets the engine's g.trialLock (20b, v391 B2): no attacks, skills, Ultimates, items, switching or
   summons, the pet still visible and targetable; the roll has a short fixed recovery (g.dodgeK). Cleared on every exit.
   Only the active trial simulates. The rollers are this file's own pooled actors (a spatial grid, one cached sprite set);
   the gnawers and the muster are the engine's monsters (the pet's attacks must reach them). GPU light through Nidhogg's
   painter (NIDHOGG_MOVES.FGFX) where a real GPU draws, the same in 2D sprites elsewhere; lowFx respected.
   BELFRY_HALL = { stage }: a rift stage spec ({ name, goal, how, layout, legend, make(X, self, H) }) for the rift's first
   stage. A rift may mark a placeholder stage { hallSlot: true }: this file fills it when it loads. */
var BELFRY_HALL = (() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const hyp = Math.hypot;
  const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1)})`; };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a || 0, 0, TAU); };
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const font = () => (typeof arcFont !== 'undefined' ? arcFont : 'sans-serif');
  function label(c, s, x, y, size, col, o) { if (!s) return; o = o || {}; c.save(); c.font = `${o.w || 800} ${Math.round(Math.max(9, size))}px ${font()}`; c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = o.lw || Math.max(2.5, size * 0.22); c.strokeStyle = o.ink || 'rgba(4,14,20,.8)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); }
  function glow(c, x, y, r, col, a, sy) { if (!(r > 0.5) || !(a > 0.01) || typeof glowSprite !== 'function') return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(a, 0, 1); blitSized(c, glowSprite(col), x - r, y - r * (sy || 1), r * 2, r * 2 * (sy || 1)); c.restore(); }
  const R1 = s => { let x = s >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const say = (X, f, dur, type, vol, f1, delay) => { try { if (X.sfx && X.sfx.note) X.sfx.note(f, dur, type, vol, f1, delay); } catch (e) {} };
  // a deep bell: a low fundamental, its hum an octave down, struck partials
  const bellNote = (X, k) => { k = k || 1; say(X, 98, 2.6, 'sine', 0.42 * k); say(X, 49, 3.0, 'sine', 0.3 * k); say(X, 196 * 1.19, 1.6, 'sine', 0.16 * k); say(X, 98 * 2.76, 1.1, 'triangle', 0.07 * k); say(X, 98 * 5.4, 0.5, 'sine', 0.05 * k); };
  /* the GPU painter (Nidhogg's): real light where a real GPU draws; window.__BEL_GL = 0 (or the dungeon's __DUN_GL = 0) keeps 2D */
  const fgx = () => { try { if (typeof window !== 'undefined' && (window.__BEL_GL === 0 || window.__DUN_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const BPZ = () => (typeof window !== 'undefined' && window.BELPROPS) || null;   // v392 PR: the repainted Belfry props (20n9-belfry-props.js), null where off
  /* a frame's GPU light, gathered and laid in one pass: q(fn) adds a painter call (fn(Q)); flush(c) draws them all, or each
     painter's 2D twin (fn2) where there is no GPU */
  function fxList() { const L = { a: [], b: [] };
    L.q = (fn, fn2) => { L.a.push(fn); L.b.push(fn2 || null); };
    L.flush = c => { if (!L.a.length) return; const F = fgx(); let ok = false; if (F) { try { const Q = F.begin(c, null); for (const f of L.a) f(Q); F.flush(c); ok = true; } catch (e) { ok = false; } } if (!ok) for (const f of L.b) if (f) { c.save(); f(c); c.restore(); } L.a.length = 0; L.b.length = 0; };
    return L; }

  /* ======================= the palette and the three branches ======================= */
  const P = { SEA: '#123C52', SEA_D: '#0A2432', LIME: '#C8CCBC', LIME_HI: '#E4E7D9', LIME_D: '#8E948A', BRASS: '#957943', BRASS_HI: '#D9B66A', BRASS_D: '#5E4A26', TURQ: '#61D9D2', TURQ_HI: '#C8FFF8', STAIN: '#1B2226', INK: '#0E1A20', WATER: '#2F7F95', WATER_HI: '#8FE3F0', SLATE: '#2C3A44', SLATE_HI: '#4A5C68', CORAL: '#FF6F61', WARN: '#FF5A4D', NAVY: '#18264A' };
  const BR = {
    E: { k: 'E', dir: 'EAST', name: 'The Sunken Muster', crystal: 'Fang Crystal', emblem: 'fangs', col: '#FF6F61', hi: '#FFD3CC', deep: '#A8302A', plaque: ['THE SUNKEN MUSTER', 'Defeat 100 monsters,', 'then the mini boss'] },
    W: { k: 'W', dir: 'WEST', name: 'The Last Beacon', crystal: 'Ward Crystal', emblem: 'shield', col: '#7FEFC0', hi: '#DFFFF0', deep: '#2E9C78', plaque: ['THE LAST BEACON', 'Keep the crystal intact', 'for 30 seconds'] },
    N: { k: 'N', dir: 'NORTH', name: 'The Hundredfold Roll', crystal: 'Spiral Crystal', emblem: 'spiral', col: '#AEE2FF', hi: '#F2FBFF', deep: '#3E86C8', plaque: ['THE HUNDREDFOLD ROLL', 'Make 100 rollers collide,', 'then defeat two foes'] },
  };
  const KEYS = ['W', 'E', 'N'];

  /* ======================= the floor plan =======================
     Layout cells (genRift frames them with one wall row and column: a cell (i, j) is world tile (i + 1, j + 1)). All the
     geometry below is in WORLD tiles. The hall is a circle; the west chapel and the north cistern are circles; the east
     foundry a rectangle; compact corridors join them to the hall; the causeway runs south into the sea. */
  const LW = 98, LH = 82;
  const GEO = {
    H: { x: 52.5, y: 54.5, r: 11 },                       // the hall (dais r 5.6, water ring 7.6..9.4)
    N: { x: 52.5, y: 22.5, r: 16.5 },                     // the cistern; its arch alcove above it
    W: { x: 24.5, y: 54.5, r: 12.5 },                     // the chapel
    E: { x0: 67, x1: 97, y0: 43, y1: 67 },                // the foundry (30 x 24)
    gate: { W: { x: 41.5, y: 54.5, ax: 'v' }, E: { x: 63.5, y: 54.5, ax: 'v' }, N: { x: 52.5, y: 43.5, ax: 'h' } },   // a gate's centre line
    use: { W: { x: 43.3, y: 54.5 }, E: { x: 61.7, y: 54.5 }, N: { x: 52.5, y: 45.3 } },                                  // where the pet stands to choose it
    bound: { W: { x: 37.0 }, E: { x: 67.0 }, N: { y: 39.0 } },                                                            // the start boundary
    back: { W: { x: 45.6, y: 57.3 }, E: { x: 59.4, y: 57.3 }, N: { x: 55.2, y: 47.9 } },   // (clear of the gates' choosing spots: a failure never re-chooses by itself)                                 // where a failed trial returns the pet
    start: { x: 52.5, y: 79.5 },
  };
  const H0 = GEO.H;
  // the sockets round the seam (a triangle), and the door's footprint
  const SOCK = { N: { x: H0.x, y: H0.y - 2.7 }, W: { x: H0.x - 2.35, y: H0.y + 1.35 }, E: { x: H0.x + 2.35, y: H0.y + 1.35 } };
  const DOOR = { x: H0.x, y: H0.y + 0.15, w: 2.3, h: 4.3, foot: { x0: H0.x - 2.7, x1: H0.x + 2.7, y0: H0.y - 1.0, y1: H0.y + 1.0 } };
  const LAYOUT = (() => {
    const g = Array.from({ length: LH }, () => Array(LW).fill('#'));
    const at = (wx, wy) => [wx - 1, wy - 1];   // world tile -> layout cell
    const set = (x, y, ch) => { if (y >= 0 && y < LH && x >= 0 && x < LW) g[y][x] = ch; };
    const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, ch || '.'); };
    const disc = (cx, cy, r, ch) => { for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) if (hyp(x + 0.5 - cx, y + 0.5 - cy) < r) set(x, y, ch || '.'); };
    // the sea round the causeway, then the causeway, the hall, the corridors and the arenas
    rect(37, 65, 65, 81, '~');
    rect(49, 64, 53, 79);
    disc(H0.x - 1, H0.y - 1, H0.r);
    disc(GEO.N.x - 1, GEO.N.y - 1, GEO.N.r); rect(49, 2, 53, 4); rect(49, 38, 53, 41);
    disc(GEO.W.x - 1, GEO.W.y - 1, GEO.W.r); rect(36, 51, 39, 55);
    rect(GEO.E.x0 - 1, GEO.E.y0 - 1, GEO.E.x1 - 2, GEO.E.y1 - 2); rect(63, 51, 65, 55);
    // the west chapel's three approaches (dead-end tunnels the gnawers pour from)
    rect(5, 51, 11, 55); rect(21, 34, 25, 41); rect(21, 66, 25, 72);
    // the gates (code shuts them: a solid tile under a blank prop)
    for (let y = 51; y <= 55; y++) { set(40, y, '1'); set(62, y, '2'); }
    for (let x = 49; x <= 53; x++) set(x, 42, '3');
    set(51, 78, 'S');
    // pillars standing outside the cistern's floor, bronze moulds along the foundry, broken columns round the hall
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + 0.17, x = Math.round(GEO.N.x - 1 + Math.cos(a) * (GEO.N.r + 0.7) - 0.5), y = Math.round(GEO.N.y - 1 + Math.sin(a) * (GEO.N.r + 0.7) - 0.5); if (g[y] && g[y][x] === '#' && y > 6) set(x, y, 'P'); }
    for (const x of [70, 76, 86, 92]) { if (g[41][x] === '#') set(x, 41, 'M'); if (g[66][x] === '#') set(x, 66, 'M'); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.26, x = Math.round(H0.x - 1 + Math.cos(a) * (H0.r + 0.6) - 0.5), y = Math.round(H0.y - 1 + Math.sin(a) * (H0.r + 0.6) - 0.5); if (g[y] && g[y][x] === '#') set(x, y, 'K'); }
    return g.map(r => r.join(''));
  })();
  if (typeof DunWorld !== 'undefined' && DunWorld.PROPS && !DunWorld.PROPS.blank) DunWorld.PROPS.blank = () => {};
  const PROP = (name, alt) => ({ get prop() { return typeof DunWorld !== 'undefined' && DunWorld.PROPS[name] ? name : alt; } });
  const block = (X, tx, ty) => { X.M.props.set(ty * X.M.MW + tx, 'blank'); X.setTile(tx, ty, T_SOLID); };
  const unblock = (X, tx, ty) => { X.M.props.delete(ty * X.M.MW + tx); X.setTile(tx, ty, T_FLOOR); };
  const inHall = (p, k) => hyp(p.x - H0.x, p.y - H0.y) < H0.r - (k == null ? 0.9 : k);
  const inArena = (B, p) => B === 'E' ? p.x > GEO.E.x0 + 0.1 : B === 'W' ? p.x < GEO.bound.W.x : p.y < GEO.bound.N.y;

  /* ======================= shared art ======================= */
  /* the three emblems, centred, s the half-size: a heater shield, two crossed fangs, a curled spiral */
  function emblemPath(c, kind, x, y, s) {
    c.beginPath();
    if (kind === 'shield') { c.moveTo(x - s * 0.82, y - s * 0.78); c.quadraticCurveTo(x, y - s * 0.98, x + s * 0.82, y - s * 0.78); c.lineTo(x + s * 0.78, y - s * 0.05); c.quadraticCurveTo(x + s * 0.62, y + s * 0.62, x, y + s); c.quadraticCurveTo(x - s * 0.62, y + s * 0.62, x - s * 0.78, y - s * 0.05); c.closePath(); }
    else if (kind === 'fangs') { for (const sd of [-1, 1]) { const bx = x - sd * s * 0.72, by = y - s * 0.82; c.moveTo(bx - sd * s * 0.18, by); c.quadraticCurveTo(x + sd * s * 0.1, y - s * 0.1, x + sd * s * 0.72, y + s * 0.92); c.quadraticCurveTo(x - sd * s * 0.12, y + s * 0.18, bx + sd * s * 0.22, by - s * 0.02); c.closePath(); } }
    else { const n = 60; for (let i = 0; i <= n; i++) { const u = i / n, a = u * TAU * 2.15 - 1.2, r = s * (0.08 + 0.9 * u); i ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.95) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.95); } }
  }
  function emblem(c, kind, x, y, s, col, o) { o = o || {}; c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    emblemPath(c, kind, x, y, s);
    if (kind === 'spiral') { if (o.ink !== false) { c.strokeStyle = o.ink || 'rgba(6,18,26,.8)'; c.lineWidth = Math.max(2, s * 0.34); c.stroke(); } c.strokeStyle = col; c.lineWidth = Math.max(1.4, s * 0.2); c.stroke(); }
    else { if (o.ink !== false) { c.strokeStyle = o.ink || 'rgba(6,18,26,.8)'; c.lineWidth = Math.max(2, s * 0.16); c.stroke(); } c.fillStyle = col; c.fill(); if (kind === 'shield') { c.strokeStyle = o.line || 'rgba(0,0,0,.25)'; c.lineWidth = Math.max(1, s * 0.07); c.beginPath(); c.moveTo(x, y - s * 0.78); c.lineTo(x, y + s * 0.9); c.moveTo(x - s * 0.74, y - s * 0.25); c.lineTo(x + s * 0.74, y - s * 0.25); c.stroke(); } }
    c.restore(); }
  /* a crystal: E a short coral-red prism with a white fang, W a broad mint prism with a white shield, N a blue-white
     faceted sphere with a white spiral inside. (x, y) its centre, s its height in px; o.crack 0..1 fractures, o.k glow */
  function crystalArt(c, B, x, y, s, t, o) { o = o || {}; const C = BR[B], k = o.k == null ? 1 : o.k; c.save(); c.lineJoin = 'round';
    const gd = !o.flat && BPZ() && BPZ().fit(c, 'crystal', B, x, y, s);   // v392 PR: the repainted crystal (a faceted cluster lit from within), its emblem a light inside it
    if (gd) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3; emblem(c, C.emblem, x, y + s * 0.04, s * (B === 'N' ? 0.17 : 0.15), '#FFFFFF', { ink: false }); c.restore(); }
    else if (B === 'N') { const r = s * 0.5, n = 7;
      const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, C.col); g.addColorStop(1, C.deep); c.fillStyle = g; c.beginPath(); for (let i = 0; i < n; i++) { const a = i / n * TAU + t * 0.4; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); c.strokeStyle = '#1C3F66'; c.lineWidth = Math.max(1.2, s * 0.04); c.stroke();
      // facets: an inner heptagon joined to the rim, lit on the upper left
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(1, s * 0.02); c.beginPath(); for (let i = 0; i < n; i++) { const a = i / n * TAU + t * 0.4, b = a + Math.PI / n; c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.lineTo(x + Math.cos(b) * r * 0.55, y + Math.sin(b) * r * 0.55); } c.stroke();
      emblem(c, 'spiral', x, y, r * 0.55, '#FFFFFF', { ink: 'rgba(30,70,120,.6)' });
      c.fillStyle = 'rgba(255,255,255,.75)'; ell(c, x - r * 0.38, y - r * 0.42, r * 0.18, r * 0.09, -0.6); c.fill(); }
    else { const wide = B === 'W', hw = s * (wide ? 0.42 : 0.27), top = y - s * 0.5, bot = y + s * 0.5, sh = s * (wide ? 0.16 : 0.2);
      const pts = [[x - hw, top + sh], [x, top], [x + hw, top + sh], [x + hw, bot - sh * 0.6], [x, bot], [x - hw, bot - sh * 0.6]];
      const g = c.createLinearGradient(x - hw, top, x + hw, bot); g.addColorStop(0, C.hi); g.addColorStop(0.35, C.col); g.addColorStop(1, C.deep); c.fillStyle = g; poly(c, pts); c.fill(); c.strokeStyle = wide ? '#1E5E48' : '#5E1712'; c.lineWidth = Math.max(1.2, s * 0.04); c.stroke();
      // the facets: a lit left face, a shaded right face, the top
      c.fillStyle = 'rgba(255,255,255,.22)'; poly(c, [[x - hw, top + sh], [x, top], [x, bot], [x - hw, bot - sh * 0.6]]); c.fill();
      c.fillStyle = 'rgba(0,0,0,.18)'; poly(c, [[x + hw, top + sh], [x, top + sh * 1.6], [x, bot], [x + hw, bot - sh * 0.6]]); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = Math.max(1, s * 0.018); c.beginPath(); c.moveTo(x - hw, top + sh); c.lineTo(x, top + sh * 1.6); c.lineTo(x + hw, top + sh); c.moveTo(x, top + sh * 1.6); c.lineTo(x, bot); c.stroke();
      emblem(c, wide ? 'shield' : 'fangs', x, y + s * 0.06, s * (wide ? 0.24 : 0.2), '#FFFFFF', { ink: wide ? 'rgba(20,80,60,.55)' : 'rgba(110,20,15,.55)' }); }
    // fractures spreading through it as its integrity falls
    if (o.crack > 0.02) { const n = Math.ceil(o.crack * 7), rnd = R1(77 + (B.charCodeAt(0))); c.strokeStyle = `rgba(255,255,255,${0.5 + 0.4 * o.crack})`; c.lineWidth = Math.max(1, s * 0.025); c.beginPath();
      for (let i = 0; i < n; i++) { let px = x + (rnd() - 0.5) * s * 0.3, py = y + (rnd() - 0.5) * s * 0.3; c.moveTo(px, py); for (let j = 0; j < 3; j++) { px += (rnd() - 0.5) * s * 0.35; py += (rnd() - 0.5) * s * 0.4; c.lineTo(px, py); } } c.stroke();
      c.strokeStyle = rgba('#1A2A30', 0.4 * o.crack); c.lineWidth = Math.max(1, s * 0.012); c.stroke(); }
    c.restore();
    if (k > 0.02 && !o.noGlow) glow(c, x, y, s * (0.9 + 0.15 * Math.sin(t * 2.2)), C.col, (gd ? 0.12 : 0.32) * k); }   // (v392 PR: the repainted crystal carries its own light: a soft halo only)
  // the same crystal's light on the GPU (o.fx: the frame's light list)
  function crystalLight(L, B, x, y, s, k, t) { const C = BR[B]; L.q(Q => { Q.glow(x, y, s * 1.6, C.col, 0.35 * k); Q.glow(x, y, s * 0.55, '#FFFFFF', 0.28 * k); Q.star(x - s * 0.08, y - s * 0.22, s * (0.6 + 0.2 * Math.sin(t * 3)), 0.5 * k, '#FFFFFF'); }, c2 => { glow(c2, x, y, s * 1.3, C.col, 0.25 * k); }); }

  /* the Resonance bubble: a floating sphere of the pet's own resonance, the crystal turning inside it */
  function bubbleArt(c, B, x, y, r, t, L) {
    const a2 = 0.9;
    c.save();
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.55, rgba(BR[B].col, 0.16)); g.addColorStop(0.92, rgba('#BFF4FF', 0.32)); g.addColorStop(1, rgba('#FFFFFF', 0.55));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.restore();
    crystalArt(c, B, x, y + Math.sin(t * 2) * r * 0.06, r * 1.15, t, { k: 0.8, noGlow: true });
    c.save(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(1.2, r * 0.06); c.beginPath(); c.arc(x, y, r, Math.PI * 1.05, Math.PI * 1.55); c.stroke(); c.strokeStyle = rgba('#9FF5FF', 0.55); c.lineWidth = Math.max(1, r * 0.04); c.beginPath(); c.arc(x, y, r * 0.97, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.85)'; ell(c, x - r * 0.42, y - r * 0.48, r * 0.16, r * 0.08, -0.7); c.fill(); c.restore();
    if (L) L.q(Q => { Q.wsphere(x, y, r, '#9FE8FF', 0.55 * a2, 3.1, 1, 0.25, 0.9); Q.glow(x, y, r * 2.2, BR[B].col, 0.28); Q.ring(x, y, r * (1.25 + 0.15 * Math.sin(t * 3)), '#BFF4FF', 0.22, r * 0.12); }, c2 => glow(c2, x, y, r * 2, BR[B].col, 0.22));
  }

  /* the gates. A gate's state: { open 0..1 (its leaves drawn back), done (deposited: COMPLETE), sel, sealed } */
  function plaqueArt(c, B, Xs, Ys, T, stTxt, stCol, t) { const C = BR[B], w = T * 2.5, h = T * 1.32, x0 = Xs - w / 2, y0 = Ys - T * 1.0 - h;
    c.save(); const pA = c.globalAlpha, pOK = !!(BPZ() && BPZ().draw(c, 'plaque', 0, Xs, Ys, T)); if (pOK) c.globalAlpha = 0;   // v392 PR: the repainted plaque (a bevelled brass frame, slate, rivets, its post); the old 2D only where that is off
    c.fillStyle = 'rgba(0,0,0,.35)'; ell(c, Xs, Ys + T * 0.04, T * 0.55, T * 0.16); c.fill();
    c.fillStyle = P.BRASS_D; c.fillRect(Xs - T * 0.07, y0 + h, T * 0.14, Ys - (y0 + h));
    const g = c.createLinearGradient(x0, y0, x0, y0 + h); g.addColorStop(0, '#C9A65C'); g.addColorStop(0.5, P.BRASS); g.addColorStop(1, '#6E5730'); c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(x0, y0, w, h, T * 0.12) : c.rect(x0, y0, w, h); c.fill(); c.strokeStyle = P.INK; c.lineWidth = Math.max(1.5, T * 0.045); c.stroke();
    c.fillStyle = 'rgba(20,30,28,.82)'; c.fillRect(x0 + T * 0.1, y0 + T * 0.1, w - T * 0.2, h - T * 0.2); c.globalAlpha = pA;
    if (pOK) BPZ().relief(c, C.emblem, x0 + T * 0.36, y0 + h * 0.4, T * 0.2, BPZ().BCOL[B], 0.5); else emblem(c, C.emblem, x0 + T * 0.36, y0 + h * 0.4, T * 0.2, C.col);
    const fs = Math.max(8.5, T * 0.2); c.font = `900 ${Math.round(fs)}px ${font()}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = C.hi; c.fillText(C.plaque[0], x0 + T * 0.62, y0 + h * 0.2, w - T * 0.72);
    c.font = `700 ${Math.round(fs * 0.86)}px ${font()}`; c.fillStyle = '#F2EEDC'; c.fillText(C.plaque[1], x0 + T * 0.62, y0 + h * 0.43, w - T * 0.72); c.fillText(C.plaque[2], x0 + T * 0.62, y0 + h * 0.62, w - T * 0.72);
    c.font = `900 ${Math.round(fs * 0.86)}px ${font()}`; c.textAlign = 'center'; c.fillStyle = stCol; c.fillText(stTxt, Xs, y0 + h * 0.83, w - T * 0.3);
    c.restore(); }
  /* a broad front-facing gate (the north one): two pillars, a lintel with the carved direction and the big emblem,
     two leaves (drawn back into the pillars as it opens); (Xs, Ys) the threshold's middle */
  function gateFront(c, B, Xs, Ys, T, G, t) { const C = BR[B], hw = T * 2.55, ph = T * 3.5, pw = T * 0.62, lw = Math.max(1.5, T * 0.05);
    c.save();
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(Xs - hw - pw, Ys - T * 0.1, (hw + pw) * 2, T * 0.25);
    // the opening: the corridor beyond, dark; lit in the branch's colour once open
    const og = c.createLinearGradient(0, Ys - ph, 0, Ys); og.addColorStop(0, '#071016'); og.addColorStop(1, G.open > 0 ? rgba(C.col, 0.25 * G.open) : '#0E1C24'); c.fillStyle = og; c.fillRect(Xs - hw, Ys - ph, hw * 2, ph);
    // the leaves
    /* v430 BW: the leaves are heavy bronze now (BEL_DOORS 'leaf' hall): they slide with their mass (a slow start, a heavy stop), a lock
       rosette on the seam turns before they part and rides away on the west leaf, dust shaken from the sill, a tremor as they go */
    const BD = typeof BEL_DOORS !== 'undefined' ? BEL_DOORS : null, oE = BD ? BD.heavy(G.open) : G.open, mv = BD ? BD.dust('hg' + B, Xs, Ys, hw * 2, G.open, T) : false, vib = mv ? Math.sin(t * 70) * T * 0.012 : 0;
    const slide = oE * hw * 0.92; for (const sd of [-1, 1]) { const x0 = (sd < 0 ? Xs - hw - slide + 0 : Xs + slide) + vib, w = hw; c.save(); c.beginPath(); c.rect(Xs - hw, Ys - ph, hw * 2, ph); c.clip();
      if (BD && BD.pic(c, 'leaf', sd < 0 ? 'halll' : 'hallr', sd < 0 ? x0 + hw : x0, Ys, T)) { if (sd < 0) BD.lockArt(c, 'std', x0 + hw, Ys - ph * 0.47, T, ease(G.open / 0.35) * TAU * 0.75); c.restore(); continue; }
      if (BPZ() && BPZ().draw(c, 'leaf', 0, x0, Ys, T)) { c.restore(); continue; }   // v392 PR: a repainted leaf (a slab with brass straps and studs)
      const lg = c.createLinearGradient(x0, 0, x0 + w, 0); lg.addColorStop(0, '#9FA597'); lg.addColorStop(0.5, P.LIME); lg.addColorStop(1, '#7E8478'); c.fillStyle = lg; c.fillRect(x0, Ys - ph, w, ph); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(x0, Ys - ph, w, ph);
      // the tidal stain on the lower third, brass straps, rivets
      const sg = c.createLinearGradient(0, Ys - ph * 0.4, 0, Ys); sg.addColorStop(0, 'rgba(20,26,30,0)'); sg.addColorStop(1, 'rgba(20,26,30,.8)'); c.fillStyle = sg; c.fillRect(x0, Ys - ph * 0.4, w, ph * 0.4);
      for (const u of [0.22, 0.62]) { c.fillStyle = P.BRASS; c.fillRect(x0, Ys - ph * (1 - u), w, T * 0.16); c.fillStyle = 'rgba(255,240,200,.3)'; c.fillRect(x0, Ys - ph * (1 - u), w, T * 0.04); }
      c.restore(); }
    // the seal: brass bars and a glowing seam while shut
    if (G.open < 0.05) { c.strokeStyle = G.sealed ? rgba(C.col, 0.25) : rgba(C.col, 0.75 + 0.2 * Math.sin(t * 3)); c.lineWidth = Math.max(2, T * 0.06); c.beginPath(); c.moveTo(Xs, Ys - ph); c.lineTo(Xs, Ys); c.stroke();
      if (G.sealed && !(BD && [0.35, 0.7].every(u => BD.pic(c, 'bolt', 'h', Xs, Ys - ph * u, T) && BD.pic(c, 'bolt', 'h', Xs, Ys - ph * u, T, { sx: -1 })))) { c.strokeStyle = P.BRASS_D; c.lineWidth = Math.max(3, T * 0.12); for (const u of [0.35, 0.7]) { c.beginPath(); c.moveTo(Xs - hw, Ys - ph * u); c.lineTo(Xs + hw, Ys - ph * u); c.stroke(); } } }   // v430 BW: a sealed gate barred by two bronze bolts
    // the pillars
    for (const sd of [-1, 1]) { const x0 = sd < 0 ? Xs - hw - pw : Xs + hw, plA = c.globalAlpha; if (BPZ() && BPZ().draw(c, 'gpillar', 0, x0 + pw / 2, Ys, T)) c.globalAlpha = 0;   /* v392 PR: repainted pillars */ const pg = c.createLinearGradient(x0, 0, x0 + pw, 0); pg.addColorStop(0, P.LIME_HI); pg.addColorStop(1, P.LIME_D); c.fillStyle = pg; c.fillRect(x0, Ys - ph - T * 0.3, pw, ph + T * 0.3); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(x0, Ys - ph - T * 0.3, pw, ph + T * 0.3);
      const sg = c.createLinearGradient(0, Ys - ph * 0.45, 0, Ys); sg.addColorStop(0, 'rgba(14,20,24,0)'); sg.addColorStop(1, 'rgba(14,20,24,.85)'); c.fillStyle = sg; c.fillRect(x0, Ys - ph * 0.45, pw, ph * 0.45);
      c.fillStyle = P.BRASS; c.fillRect(x0 + pw * 0.3, Ys - ph - T * 0.3, pw * 0.4, ph + T * 0.3); c.fillStyle = 'rgba(80,140,110,.35)'; c.fillRect(x0 + pw * 0.3, Ys - ph * 0.5, pw * 0.4, ph * 0.18); c.globalAlpha = plA; }
    // the lintel, the carved direction, the medallion
    const lA = c.globalAlpha; if (BPZ() && BPZ().draw(c, 'lintel', 0, Xs, Ys - ph - T * 0.15, T)) c.globalAlpha = 0;   // v392 PR: a repainted lintel
    const ly = Ys - ph - T * 0.95, lg2 = c.createLinearGradient(0, ly, 0, ly + T * 0.8); lg2.addColorStop(0, P.LIME_HI); lg2.addColorStop(1, '#9AA092'); c.fillStyle = lg2; c.fillRect(Xs - hw - pw - T * 0.2, ly, (hw + pw + T * 0.2) * 2, T * 0.8); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(Xs - hw - pw - T * 0.2, ly, (hw + pw + T * 0.2) * 2, T * 0.8);
    c.globalAlpha = lA; label(c, C.dir, Xs - hw * 0.62, ly + T * 0.42, T * 0.36, '#24323A', { ink: 'rgba(255,255,255,.45)', lw: 2 }); label(c, C.dir, Xs + hw * 0.62, ly + T * 0.42, T * 0.36, '#24323A', { ink: 'rgba(255,255,255,.45)', lw: 2 });
    medallion(c, B, Xs, ly + T * 0.15, T * 0.95, G, t);
    if (BD) BD.fx(c);   // v430 BW: the dust it shook loose
    c.restore(); }
  /* the big round emblem medallion over a gate: brass rim, the emblem in its colour (bright when chosen or complete) */
  function medallion(c, B, x, y, r, G, t) { const C = BR[B], lit = G.done ? 1 : G.sel ? 0.75 + 0.25 * Math.sin(t * 4) : G.sealed ? 0.25 : 0.55;
    c.save(); const mA = c.globalAlpha; if (BPZ() && BPZ().draw(c, 'medal', B + (lit > 0.9 ? 2 : lit > 0.5 ? 1 : 0), x, y, r)) c.globalAlpha = 0;   // v392 PR: a repainted brass medallion, its emblem enamelled in relief; the old 2D only where that is off
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(x + r * 0.06, y + r * 0.08, r, 0, TAU); c.fill();
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, '#E9CF8E'); g.addColorStop(0.7, P.BRASS); g.addColorStop(1, P.BRASS_D); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.strokeStyle = P.INK; c.lineWidth = Math.max(1.5, r * 0.06); c.stroke();
    c.fillStyle = '#16262C'; c.beginPath(); c.arc(x, y, r * 0.78, 0, TAU); c.fill();
    emblem(c, C.emblem, x, y + (C.emblem === 'shield' ? r * 0.04 : 0), r * 0.55, lit > 0.5 ? C.col : rgba(C.col, 0.55 + lit * 0.4));
    c.globalAlpha = mA; if (G.done) label(c, 'COMPLETE', x, y + r * 1.22, r * 0.3, '#FFFFFF', { ink: rgba(C.deep, 0.9) });
    c.restore(); glow(c, x, y, r * 1.8, C.col, 0.18 + 0.4 * lit * (G.sealed ? 0.4 : 1)); }
  /* a side gate (west or east): seen along the wall, two stone pylons at its ends, the leaf a thick slab between them
     that sinks into the floor as it opens, the medallion standing on a short post in front of it facing the hall */
  function gateSide(c, B, Xs, Ys, T, G, t, dirX) { const C = BR[B], half = T * 2.55, lw = Math.max(1.5, T * 0.05);
    c.save();
    const top = Ys - half, bot = Ys + half;
    // the threshold strip and the slab (its top face, then its hall-facing side, height shrinking as it sinks)
    const BD = typeof BEL_DOORS !== 'undefined' ? BEL_DOORS : null, oE = BD ? Math.min(1, BD.heavy(G.open)) : G.open, hgt = T * 1.6 * (1 - oE);
    c.fillStyle = '#5E6660'; c.fillRect(Xs - T * 0.5, top, T, bot - top);
    /* v430 BW: the slab is bronze-clad stone (BEL_DOORS 'slab': its top, its south end), sinking with its mass, trembling, dust at its foot */
    const mv = BD ? BD.dust('hs' + B, Xs, bot, T * 0.8, G.open, T) : false, vib = mv ? Math.sin(t * 70) * T * 0.012 : 0;
    if (hgt > 1 && BD && BD.pic(c, 'slab', 't', Xs + vib, bot - hgt, T)) { c.save(); c.beginPath(); c.rect(Xs - T * 0.4, bot - hgt, T * 0.8, hgt); c.clip(); BD.pic(c, 'slab', 'f', Xs + vib, bot + (T * 1.6 - hgt), T); c.restore();
      const fx = Xs + dirX * T * 0.32; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = G.sealed ? rgba(C.col, 0.25) : rgba(C.col, 0.8 + 0.2 * Math.sin(t * 3)); c.lineWidth = Math.max(2, T * 0.06); c.beginPath(); c.moveTo(fx, top - hgt); c.lineTo(fx, bot - hgt); c.stroke(); c.restore(); }
    else if (hgt > 1) { const fx = Xs + dirX * T * 0.32; const sg = c.createLinearGradient(0, top - hgt, 0, bot); sg.addColorStop(0, P.LIME_HI); sg.addColorStop(1, '#8C9286'); c.fillStyle = sg; c.fillRect(Xs - T * 0.32, top - hgt, T * 0.64, bot - top); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(Xs - T * 0.32, top - hgt, T * 0.64, bot - top);
      c.fillStyle = P.BRASS; for (const u of [0.25, 0.75]) c.fillRect(Xs - T * 0.32, top - hgt + (bot - top) * u, T * 0.64, T * 0.12);
      c.strokeStyle = G.sealed ? rgba(C.col, 0.25) : rgba(C.col, 0.8 + 0.2 * Math.sin(t * 3)); c.lineWidth = Math.max(2, T * 0.06); c.beginPath(); c.moveTo(fx, top - hgt); c.lineTo(fx, bot - hgt); c.stroke(); }
    // the pylons at the gate's two ends
    for (const yy of [top - T * 0.15, bot + T * 0.15]) { const pw = T * 0.9, phh = T * 2.6, pyA = c.globalAlpha; if (BPZ() && BPZ().draw(c, 'pylon', 0, Xs, yy, T)) c.globalAlpha = 0;   /* v392 PR: a repainted pylon (blocks, the tide's stain, a cap); the old 2D only where that is off */ const pg = c.createLinearGradient(Xs - pw / 2, 0, Xs + pw / 2, 0); pg.addColorStop(0, P.LIME_HI); pg.addColorStop(1, P.LIME_D); c.fillStyle = pg; c.fillRect(Xs - pw / 2, yy - phh, pw, phh); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(Xs - pw / 2, yy - phh, pw, phh);
      const st2 = c.createLinearGradient(0, yy - phh * 0.4, 0, yy); st2.addColorStop(0, 'rgba(14,20,24,0)'); st2.addColorStop(1, 'rgba(14,20,24,.85)'); c.fillStyle = st2; c.fillRect(Xs - pw / 2, yy - phh * 0.4, pw, phh * 0.4); c.fillStyle = P.BRASS; c.fillRect(Xs - pw / 2, yy - phh * 0.78, pw, T * 0.14); c.fillStyle = '#E8EADF'; c.fillRect(Xs - pw / 2 - T * 0.06, yy - phh - T * 0.16, pw + T * 0.12, T * 0.2); c.globalAlpha = pyA; }
    // the medallion on its post, the carved direction over it
    const mx = Xs + dirX * T * 1.15, my = Ys - T * 1.9; c.fillStyle = P.BRASS_D; c.fillRect(mx - T * 0.08, my, T * 0.16, Ys - my + T * 0.1); c.fillStyle = 'rgba(0,0,0,.3)'; ell(c, mx, Ys + T * 0.12, T * 0.35, T * 0.1); c.fill();
    medallion(c, B, mx, my, T * 0.8, G, t);
    label(c, C.dir, mx, my - T * 1.15, T * 0.42, '#F4F1E2', { ink: rgba('#0A1A22', 0.85), lw: 3.5 });
    if (BD) BD.fx(c);   // v430 BW
    c.restore(); }

  /* the central doorway (D: rise 0..1, part 0..1, wet 0..1): two limestone pillars banded with tarnished brass, a
     lintel with the three crystal emblems, two slabs with a thin turquoise glow between them; parting, a short water-lit
     passage toward Kharrox's baptism chamber. It rises out of the floor (clipped at the floor line) */
  function doorArt(c, Xs, Ys, T, D, t, L) { const w = DOOR.w * T, h = DOOR.h * T, pw = T * 0.78, lh = T * 0.95, lw = Math.max(1.5, T * 0.05);
    const lift = (1 - ease(D.rise)) * (h + lh + T * 0.4), Y = Ys + lift;
    c.save(); c.beginPath(); c.rect(Xs - w - pw - T, Ys - h - lh - T * 2, (w + pw + T) * 2, h + lh + T * 2); c.clip();
    // the passage behind the slabs
    const pg = c.createLinearGradient(0, Y - h, 0, Y); pg.addColorStop(0, '#062A36'); pg.addColorStop(0.55, '#0F5A68'); pg.addColorStop(1, '#3FC6C8'); c.fillStyle = pg; c.fillRect(Xs - w, Y - h, w * 2, h);
    if (D.part > 0.02) { c.save(); c.globalAlpha = D.part; c.strokeStyle = 'rgba(200,255,250,.35)'; c.lineWidth = 1.5; for (let i = 1; i < 6; i++) { const u = i / 6, yy = Y - h * 0.08 - u * u * h * 0.55; c.beginPath(); c.moveTo(Xs - w * (1 - u * 0.55), yy); c.lineTo(Xs + w * (1 - u * 0.55), yy); c.stroke(); }
      for (let i = 0; i < 7; i++) { const u = (t * 0.35 + i / 7) % 1; c.fillStyle = `rgba(220,255,250,${0.35 * (1 - u)})`; ell(c, Xs + Math.sin(i * 2.3 + t) * w * 0.4, Y - h * 0.1 - u * h * 0.6, w * 0.18 * (1 - u * 0.5), T * 0.04); c.fill(); }
      c.restore(); }
    // the slabs, drawn back into the pillars
    const sl = ease(D.part) * w * 0.94; for (const sd of [-1, 1]) { const x0 = sd < 0 ? Xs - w - sl : Xs + sl; c.save(); c.beginPath(); c.rect(Xs - w, Y - h, w * 2, h); c.clip();
      if (BPZ() && BPZ().draw(c, 'doorslab', 0, x0, Y, T)) { const wg = c.createLinearGradient(0, Y - h, 0, Y); wg.addColorStop(0, `rgba(40,90,110,${0.3 * D.wet})`); wg.addColorStop(1, `rgba(20,40,50,${0.2 + 0.3 * D.wet})`); c.fillStyle = wg; c.globalCompositeOperation = 'source-atop'; c.fillRect(x0, Y - h, w, h); c.restore(); continue; }   // v392 PR: a repainted slab, wet as it rises
      const lg = c.createLinearGradient(x0, 0, x0 + w, 0); lg.addColorStop(0, '#B4B9AA'); lg.addColorStop(0.45, P.LIME); lg.addColorStop(1, '#90968A'); c.fillStyle = lg; c.fillRect(x0, Y - h, w, h); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(x0, Y - h, w, h);
      for (let j = 1; j < 4; j++) { c.strokeStyle = 'rgba(60,66,60,.35)'; c.beginPath(); c.moveTo(x0, Y - h * j / 4); c.lineTo(x0 + w, Y - h * j / 4); c.stroke(); }
      const wg = c.createLinearGradient(0, Y - h, 0, Y); wg.addColorStop(0, `rgba(40,90,110,${0.35 * D.wet})`); wg.addColorStop(1, `rgba(20,40,50,${0.25 + 0.35 * D.wet})`); c.fillStyle = wg; c.fillRect(x0, Y - h, w, h);
      c.restore(); }
    if (D.part < 0.98) { const gk = 1 - D.part; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.TURQ, 0.85 * gk); c.lineWidth = Math.max(2, T * 0.07); c.beginPath(); c.moveTo(Xs, Y - h); c.lineTo(Xs, Y); c.stroke(); c.restore(); }
    // v430 BW: the doorway's great lock: a triple-ringed bronze rosette on the seam turns a half turn as the slabs part, riding away on the west slab; dust off it as it rises and parts
    const BD = typeof BEL_DOORS !== 'undefined' ? BEL_DOORS : null; if (BD) { BD.dust('cer', Xs, Ys, w * 2, (D.rise + D.part) / 2, T); c.save(); c.beginPath(); c.rect(Xs - w, Y - h, w * 2, h); c.clip(); BD.lockArt(c, 'cer', Xs - sl, Y - h * 0.52, T, ease(D.part / 0.4) * Math.PI); c.restore(); }
    // the pillars with their brass bands (v392 PR: the repainted frame, pillars, lintel and emblems in one picture; the old 2D only where that is off)
    const dfA = c.globalAlpha; if (BPZ() && BPZ().draw(c, 'doorframe', 0, Xs, Y, T)) c.globalAlpha = 0;
    for (const sd of [-1, 1]) { const x0 = sd < 0 ? Xs - w - pw : Xs + w; const g = c.createLinearGradient(x0, 0, x0 + pw, 0); g.addColorStop(0, P.LIME_HI); g.addColorStop(1, '#8E948A'); c.fillStyle = g; c.fillRect(x0, Y - h, pw, h); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(x0, Y - h, pw, h);
      c.fillStyle = P.BRASS; c.fillRect(x0 + pw * 0.28, Y - h, pw * 0.44, h); c.fillStyle = 'rgba(90,160,130,.45)'; for (let k = 0; k < 4; k++) c.fillRect(x0 + pw * 0.28, Y - h * (0.15 + k * 0.22), pw * 0.44, T * 0.18); c.fillStyle = 'rgba(255,235,180,.35)'; c.fillRect(x0 + pw * 0.28, Y - h, pw * 0.08, h);
      for (let k = 0; k < 5; k++) { c.fillStyle = '#E3C77E'; c.beginPath(); c.arc(x0 + pw * 0.5, Y - h * (0.1 + k * 0.2), Math.max(1.5, T * 0.05), 0, TAU); c.fill(); }
      const wg = c.createLinearGradient(0, Y - h, 0, Y); wg.addColorStop(0, `rgba(40,90,110,${0.3 * D.wet})`); wg.addColorStop(1, `rgba(16,30,36,${0.3 + 0.3 * D.wet})`); c.fillStyle = wg; c.fillRect(x0, Y - h, pw, h); }
    // the lintel and its three emblems, lit in their colours
    const ly = Y - h - lh, lg2 = c.createLinearGradient(0, ly, 0, ly + lh); lg2.addColorStop(0, '#EEF0E4'); lg2.addColorStop(1, '#A4AA9C'); c.fillStyle = lg2; c.fillRect(Xs - w - pw - T * 0.25, ly, (w + pw + T * 0.25) * 2, lh); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(Xs - w - pw - T * 0.25, ly, (w + pw + T * 0.25) * 2, lh);
    KEYS.forEach((B, i) => { const ex = Xs + (i - 1) * w * 0.72, ey = ly + lh * 0.5; c.fillStyle = '#20343A'; c.beginPath(); c.arc(ex, ey, lh * 0.38, 0, TAU); c.fill(); c.strokeStyle = P.BRASS; c.lineWidth = Math.max(1.5, T * 0.05); c.stroke(); emblem(c, BR[B].emblem, ex, ey, lh * 0.26, BR[B].col); }); c.globalAlpha = dfA;
    // water running off its edges while it rises, and for a moment after
    if (D.wet > 0.02) { c.save(); c.globalAlpha = D.wet; c.strokeStyle = 'rgba(170,235,250,.75)'; c.lineWidth = Math.max(1.5, T * 0.05); c.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const x = Xs + (i / 8 - 0.5) * (w + pw) * 2.1, u = (t * 1.8 + i * 0.37) % 1, y0 = ly + (i % 2 ? 0 : lh), y1 = Math.min(Ys, y0 + (Ys - y0) * (0.3 + 0.7 * u)); c.beginPath(); c.moveTo(x, y0); c.lineTo(x + Math.sin(i) * 2, y1); c.stroke(); }
      c.restore(); }
    c.restore();
    if (L && D.rise > 0) L.q(Q => { if (D.part < 0.98) Q.beam(Xs, Y - h, Xs, Y, T * 0.25, P.TURQ, 0.6 * (1 - D.part)); KEYS.forEach((B, i) => Q.glow(Xs + (i - 1) * w * 0.72, Y - h - lh * 0.5, lh * 0.9, BR[B].col, 0.5 * ease(D.rise)));
      if (D.part > 0.02) { Q.glow(Xs, Y - h * 0.4, w * 1.4, P.TURQ, 0.35 * D.part, 1.3); Q.caustic(Xs, Ys + T * 0.6, w * 1.5, '#7FF0F0', 0.4 * D.part, 1.7, 0.45); }
      if (D.wet > 0.05) for (let i = 0; i < 6; i++) { const x = Xs + (i / 5 - 0.5) * (w + pw) * 2; Q.wstream(x, ly + lh, x, Ys, T * 0.12, '#8FE3F0', 0.45 * D.wet, i * 1.3, 4, 0.5, 0.7); Q.spray(x, Ys, T * 0.5, '#CFF6FF', 0.35 * D.wet, i * 0.7, 1, 0.45); } },
      c2 => { if (D.part > 0.02) glow(c2, Xs, Y - h * 0.4, w * 1.3, P.TURQ, 0.3 * D.part, 1.3); KEYS.forEach((B, i) => glow(c2, Xs + (i - 1) * w * 0.72, Y - h - lh * 0.5, lh * 0.8, BR[B].col, 0.45 * ease(D.rise))); });
    if (BD) BD.fx(c);   // v430 BW
  }

  /* ======================= the hall's floor dressing ======================= */
  const onScreen = (X, x, y, r) => { const T = X.Tz(), Xs = X.sx(x), Ys = X.sy(y), R = r * T; return Xs + R > -T && Xs - R < X.W() + T && Ys + R > -T * 3 && Ys - R < X.H() + T * 2; };
  function hallGround(X, c, L, S) { if (!onScreen(X, H0.x, H0.y, H0.r + 2)) return; const T = X.Tz(), t = X.g.t, cx = X.sx(H0.x), cy = X.sy(H0.y);
    c.save();
    // the ring of shallow water round the dais (walkable: decoration on the floor), ripples moving on it
    c.beginPath(); c.arc(cx, cy, 9.5 * T, 0, TAU); c.arc(cx, cy, 7.3 * T, 0, TAU, true); const wg = c.createRadialGradient(cx, cy, 7.3 * T, cx, cy, 9.5 * T); wg.addColorStop(0, 'rgba(40,120,140,.62)'); wg.addColorStop(0.5, 'rgba(30,96,122,.7)'); wg.addColorStop(1, 'rgba(20,70,92,.55)'); c.fillStyle = wg; c.fill('evenodd');
    c.strokeStyle = 'rgba(190,245,250,.28)'; c.lineWidth = Math.max(1, T * 0.04); for (let i = 0; i < 10; i++) { const a = i * 0.63 + t * 0.07 * (i % 2 ? 1 : -1), r = (7.7 + (i % 4) * 0.45) * T; c.beginPath(); c.arc(cx, cy, r, a, a + 0.5); c.stroke(); }
    c.strokeStyle = 'rgba(220,250,250,.45)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.arc(cx, cy, 7.32 * T, 0, TAU); c.stroke();
    // the dry dais: a raised limestone disc, its step in shadow to the south, joints in rings and rays
    const BPd = BPZ(), dOK = !!(BPd && BPd.draw(c, 'dais', 0, cx, cy, T)); if (!dOK) {   // v392 PR: the repainted dais (bevelled segments, the brass channels' riveted walls, the seam's plates); else the old 2D
    c.fillStyle = 'rgba(10,20,26,.45)'; ell(c, cx, cy + T * 0.22, 6.5 * T, 6.5 * T); c.fill();
    const dg = c.createRadialGradient(cx - T * 1.5, cy - T * 2.2, T, cx, cy, 6.4 * T); dg.addColorStop(0, '#DCDFD1'); dg.addColorStop(0.7, P.LIME); dg.addColorStop(1, '#A9AE9F'); c.fillStyle = dg; c.beginPath(); c.arc(cx, cy, 6.4 * T, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(60,70,64,.28)'; c.lineWidth = Math.max(1, T * 0.03); for (const r of [2.0, 4.1]) { c.beginPath(); c.arc(cx, cy, r * T, 0, TAU); c.stroke(); } c.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.13, r0 = i % 2 ? 2.0 : 4.1; c.moveTo(cx + Math.cos(a) * r0 * T, cy + Math.sin(a) * r0 * T); c.lineTo(cx + Math.cos(a) * 6.4 * T, cy + Math.sin(a) * 6.4 * T); } c.stroke();
    c.strokeStyle = '#EEF0E6'; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.arc(cx, cy, 6.4 * T, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); }
    // moonlight through the oculus, a soft pool on the dais
    glow(c, cx - T * 0.6, cy - T * 0.9, T * 5.2, '#DDEBFF', 0.16 + 0.03 * Math.sin(t * 0.7));
    // the seam in the middle (open while the door rises, gone under it after)
    const D = S.door; if ((D.rise < 1 || D.open < 1) && !(dOK && !(D.seam > 0))) { const op = ease(D.seam);   // (v392 PR: the repainted dais carries the closed seam) c.fillStyle = '#0A1418'; c.beginPath(); c.arc(cx, cy, 1.3 * T, 0, TAU); c.fill();
      for (const sd of [-1, 1]) { const off = sd * op * T * 1.25; c.save(); c.beginPath(); c.rect(cx - 1.4 * T, sd < 0 ? cy - 1.4 * T : cy, 2.8 * T, 1.4 * T); c.clip(); const lg = c.createLinearGradient(cx - 1.3 * T, 0, cx + 1.3 * T, 0); lg.addColorStop(0, '#B6BBAC'); lg.addColorStop(1, '#8E9488'); c.fillStyle = lg; c.beginPath(); c.arc(cx, cy + off, 1.24 * T, 0, TAU); c.fill(); c.strokeStyle = 'rgba(20,30,30,.6)'; c.lineWidth = Math.max(1, T * 0.04); c.stroke(); c.restore(); }
      c.strokeStyle = '#13202A'; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.moveTo(cx - 1.25 * T, cy); c.lineTo(cx + 1.25 * T, cy); c.stroke();
      c.strokeStyle = rgba(P.TURQ, 0.35 + 0.25 * Math.sin(t * 2)); c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.arc(cx, cy, 1.3 * T, 0, TAU); c.stroke(); }
    // the brass channels from each socket to the seam, filling with light as each crystal is gripped
    for (const B of KEYS) { const s = SOCK[B], sx = X.sx(s.x), sy2 = X.sy(s.y), k = S.chan[B] || 0, conv = D.conv;
      c.lineCap = 'round'; if (!dOK) { c.strokeStyle = '#2B2418'; c.lineWidth = T * 0.34; c.beginPath(); c.moveTo(sx, sy2); c.lineTo(cx, cy); c.stroke(); c.strokeStyle = P.BRASS; c.lineWidth = T * 0.24; c.stroke(); c.strokeStyle = '#1B1710'; c.lineWidth = T * 0.09; c.stroke(); }   // (v392 PR: drawn in the dais's picture)
      if (k > 0) { const ex = sx + (cx - sx) * Math.min(1, k), ey = sy2 + (cy - sy2) * Math.min(1, k); c.strokeStyle = BR[B].col; c.lineWidth = T * 0.09; c.beginPath(); c.moveTo(sx, sy2); c.lineTo(ex, ey); c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = T * 0.035; c.stroke();
        const pul = 0.55 + 0.25 * Math.sin(t * 3 + B.charCodeAt(0)) + conv * 0.6; L.q(Q => { Q.beam(sx, sy2, ex, ey, T * 0.28, BR[B].col, 0.55 * pul); Q.beam(sx, sy2, ex, ey, T * 0.08, '#FFFFFF', 0.5 * pul); if (conv > 0) { const u = (t * 1.6) % 1; Q.glow(sx + (cx - sx) * u, sy2 + (cy - sy2) * u, T * 0.6, BR[B].col, 0.7 * conv); } }, c2 => glow(c2, (sx + ex) / 2, (sy2 + ey) / 2, T * 1.2, BR[B].col, 0.3 * pul)); } }
    if (D.conv > 0) L.q(Q => { Q.glow(cx, cy, T * (1.5 + 2 * D.conv), '#FFFFFF', 0.5 * D.conv); Q.ewave(cx, cy, T * (1 + 4 * ((t * 0.8) % 1)), P.TURQ, 0.85, 0.5 * D.conv * (1 - (t * 0.8) % 1), 2.2, 1, 0.2); }, c2 => glow(c2, cx, cy, T * 3, '#FFFFFF', 0.4 * D.conv));
    // water lit by the oculus (GPU): caustics on the ring
    L.q(Q => { Q.caustic(cx, cy, 9.4 * T, '#7FE0F0', lowFx() ? 0.12 : 0.2, 4.2, 1); Q.glow(cx - T * 0.6, cy - T * 0.9, T * 5, '#CFE4FF', 0.12); });
    // the walls' brass ribs and the turquoise light leaking through their cracks (the north half, whose faces we see)
    for (let i = 0; i < 9; i++) { const a = Math.PI + (i + 0.5) / 9 * Math.PI, x = cx + Math.cos(a) * (H0.r - 0.15) * T, y = cy + Math.sin(a) * (H0.r - 0.15) * T; if (!(BPd && BPd.draw(c, 'rib', 0, x, y, T))) { c.fillStyle = P.BRASS_D; c.fillRect(x - T * 0.13, y - T * 1.4, T * 0.26, T * 1.4); c.fillStyle = P.BRASS; c.fillRect(x - T * 0.09, y - T * 1.4, T * 0.12, T * 1.4); }   // (v392 PR: a repainted brass rib)
      if (i % 2) { const k2 = 0.5 + 0.5 * Math.sin(t * 1.3 + i); L.q(Q => Q.glow(x + T * 0.5, y - T * 0.7, T * 0.7, P.TURQ, 0.35 * k2, 1.6), c2 => glow(c2, x + T * 0.5, y - T * 0.7, T * 0.6, P.TURQ, 0.3 * k2, 1.6)); c.strokeStyle = rgba(P.TURQ_HI, 0.5 + 0.3 * k2); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + T * 0.35, y - T * 1.2); c.lineTo(x + T * 0.55, y - T * 0.8); c.lineTo(x + T * 0.45, y - T * 0.4); c.stroke(); } }
    c.restore(); }
  /* the causeway: broken railings either side, and three low waves sliding across it */
  function causewayGround(X, c, L) { const T = X.Tz(), t = X.g.t, x0 = 50, x1 = 55, y0 = 65, y1 = 81; if (!onScreen(X, 52.5, 73, 9)) return;
    c.save();
    // (the three low waves sliding across it are the rift's own, B1's every-stage layer: this stage names the causeway)
    for (const x of [x0 + 0.1, x1 - 0.1]) for (let y = y0; y < y1; y += 1.6) { const broken = ((y * 7 + x * 3) | 0) % 5 === 0, Xs = X.sx(x), Ys = X.sy(y);
      c.fillStyle = '#7E847A'; c.fillRect(Xs - T * 0.09, Ys - T * 0.55, T * 0.18, T * 0.55); c.fillStyle = P.LIME_HI; c.fillRect(Xs - T * 0.11, Ys - T * 0.62, T * 0.22, T * 0.1);
      if (!broken) { c.strokeStyle = '#8F9488'; c.lineWidth = T * 0.08; c.beginPath(); c.moveTo(Xs, Ys - T * 0.5); c.lineTo(X.sx(x), X.sy(y + 1.6) - T * 0.5); c.stroke(); } }
    c.restore(); }

  /* ======================= the reef gnawer (the west chapel's brood) =======================
     A small, fast, flattened navy shell creature: four stubby legs, blunt ivory jaws, one turquoise eye. It heads for
     the crystal, takes one of six strike places round the pedestal when one is free (the rest queue round it), winds up
     (jaws wide, the eye flaring) and bites the crystal. Struck while winding up, it is interrupted. */
  let WEST = null;   // (the west trial while it runs: the gnawers' AI reads it)
  if (typeof MON !== 'undefined' && !MON.reefgnawer) {
    MON.reefgnawer = { name: 'Reef gnawer', from: 999, hp: 40, spd: 3.1, r: 0.3, dmg: 4, xp: 2, coin: 0.08, color: '#22345E', bio: ['belfry'], tip: 'Heads for the crystal and gnaws it. Strike it while its jaws are open to interrupt the bite.', kit: [] };
    try { const { LN, lwOf, shade, stroke, spec, MP, NF, EXT } = DunArt;
      MP.reefgnawer = function (c, r, ph, o) { const lw = lwOf(r), col = o.color, open = o.mode === 'block' ? 1 : 0, st2 = Math.sin(ph * TAU);
        // four stubby legs
        [[-0.55, 0.42], [-0.2, 0.55], [0.2, 0.55], [0.55, 0.42]].forEach(([x, y], i) => { c.strokeStyle = LN; c.lineWidth = lw * 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x * r, r * 0.15); c.lineTo(x * r + (i % 2 ? st2 : -st2) * r * 0.14, y * r + r * 0.2); c.stroke(); c.strokeStyle = '#1A2546'; c.lineWidth = lw * 1.4; c.stroke(); });
        // the jaws: two blunt ivory plates at the front, wide open in a wind-up
        const ja = 0.18 + open * 0.55; for (const sd of [-1, 1]) { c.save(); c.translate(r * 0.78, 0); c.rotate(sd * ja); c.fillStyle = '#EDE4CC'; c.beginPath(); c.moveTo(0, -sd * r * 0.02); c.quadraticCurveTo(r * 0.5, -sd * r * 0.1, r * 0.56, sd * r * 0.12); c.lineTo(r * 0.05, sd * r * 0.3); c.closePath(); c.fill(); stroke(c, lw * 0.9); c.restore(); }
        // the flattened shell
        c.beginPath(); c.ellipse(0, 0, r * 0.98, r * 0.66, 0, 0, TAU); c.fillStyle = shade(c, col, r, -r * 0.2, -r * 0.3, 0.45); c.fill(); stroke(c, lw);
        c.strokeStyle = 'rgba(160,190,255,.35)'; c.lineWidth = lw * 0.8; c.beginPath(); c.ellipse(-r * 0.12, -r * 0.05, r * 0.62, r * 0.38, 0, Math.PI * 1.05, Math.PI * 1.85); c.stroke();
        c.strokeStyle = 'rgba(10,16,34,.6)'; c.beginPath(); c.moveTo(-r * 0.5, -r * 0.45); c.lineTo(-r * 0.35, r * 0.45); c.moveTo(-r * 0.05, -r * 0.6); c.lineTo(0.05 * r, r * 0.6); c.stroke();
        spec(c, -r * 0.35, -r * 0.32, r * 0.3, r * 0.12, 0.45);
        // the single turquoise eye under the shell's front lip
        const ey = r * 0.05, ex = r * 0.6, eg = open ? 1 : 0.6; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * eg; blitSized(c, glowSprite('#61D9D2'), ex - r * 0.5, ey - r * 0.5, r, r); c.restore();
        c.fillStyle = open ? '#E6FFFC' : '#61D9D2'; c.beginPath(); c.arc(ex, ey, r * 0.13, 0, TAU); c.fill(); };
      EXT.reefgnawer = 1.9; NF.reefgnawer = 6; } catch (e) {}
    try { DunAI.mon.reefgnawer = function (m, A, X) { const W = WEST; if (!W || !W.live) return; W.ai(m, A, X); }; } catch (e) {}
  }

  /* ======================= the bell roller's pictures =======================
     A rounded midnight-blue shell creature with one brass band, blunt ivory studs and a single luminous slit. Balled up
     (rolling or spinning) it turns through eight frames; uncurled it walks on four short legs. One sprite set per tile
     size, drawn from a cache: a hundred of them cost a hundred image draws */
  const RSP = { key: '', ball: [], walk: [], shadow: null, burst: null };
  function rollerSprites(T, dpr) { const px = Math.max(12, Math.round(T * 1.05 * dpr / 6) * 6), key = px + '';   /* (in steps of 6 px: a camera easing its zoom does not repaint the set every frame) */ if (RSP.key === key) return RSP; RSP.key = key; RSP.ball = []; RSP.walk = []; RSP.px = px; RSP.dpr = dpr;
    const mk = () => { const cv = document.createElement('canvas'); cv.width = cv.height = px; return cv; };
    for (let f = 0; f < 8; f++) { const cv = mk(), c = cv.getContext('2d'), r = px * 0.4, x = px / 2, y = px / 2, ph = f / 8 * TAU;
      const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, '#3D58A8'); g.addColorStop(0.55, '#1A2A62'); g.addColorStop(1, '#0A1230'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.lineWidth = Math.max(1.2, r * 0.1); c.strokeStyle = '#070B1C'; c.stroke();
      // the brass band: a great circle whose tilt turns with the roll; ivory studs on it
      c.save(); c.beginPath(); c.arc(x, y, r * 0.97, 0, TAU); c.clip(); const by = Math.cos(ph) * r * 0.85, bw = Math.max(1.5, r * 0.26);
      c.strokeStyle = '#6E5428'; c.lineWidth = bw * 1.3; c.beginPath(); c.ellipse(x, y, r, Math.abs(by) + 0.5, 0, Math.cos(ph) > 0 ? 0 : Math.PI, Math.cos(ph) > 0 ? Math.PI : TAU); c.stroke(); c.strokeStyle = '#D2AE5E'; c.lineWidth = bw * 0.75; c.stroke();
      for (let i = 0; i < 5; i++) { const a = (i + 0.5) / 5 * Math.PI, sx = x + Math.cos(a) * r * 0.92 * (Math.cos(ph) > 0 ? 1 : -1), sy = y + Math.sin(a) * by * (Math.cos(ph) > 0 ? 1 : -1); c.fillStyle = '#F0E6CE'; c.beginPath(); c.arc(sx, sy, r * 0.09, 0, TAU); c.fill(); }
      // the luminous slit, swinging round with the roll
      const sv = Math.sin(ph); if (sv > -0.2) { const sx = x + sv * r * 0.15, sy = y - Math.cos(ph) * r * 0.45 * (Math.cos(ph) > 0 ? -1 : 1) * 0.6 - r * 0.2; c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(120,240,255,.45)'; ell(c, sx, sy, r * 0.42, r * 0.16); c.fill(); c.fillStyle = '#DFFFFF'; ell(c, sx, sy, r * 0.3, r * 0.05 + r * 0.03 * Math.max(0, sv)); c.fill(); }
      c.restore();
      c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, x - r * 0.38, y - r * 0.45, r * 0.22, r * 0.1, -0.6); c.fill();
      RSP.ball.push(cv); }
    for (let f = 0; f < 2; f++) { const cv = mk(), c = cv.getContext('2d'), r = px * 0.4, x = px / 2, y = px * 0.56, st2 = f ? 1 : -1;
      c.strokeStyle = '#0A1230'; c.lineCap = 'round'; c.lineWidth = Math.max(2, r * 0.22); for (const [lx, k] of [[-0.6, 1], [-0.2, -1], [0.2, 1], [0.6, -1]]) { c.beginPath(); c.moveTo(x + lx * r, y + r * 0.1); c.lineTo(x + lx * r + st2 * k * r * 0.12, y + r * 0.5); c.stroke(); }
      const g = c.createRadialGradient(x - r * 0.3, y - r * 0.5, r * 0.1, x, y - r * 0.1, r * 1.05); g.addColorStop(0, '#3D58A8'); g.addColorStop(0.6, '#1A2A62'); g.addColorStop(1, '#0A1230'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r * 1.02, r * 0.78, 0, Math.PI, TAU); c.lineTo(x + r * 1.02, y + r * 0.18); c.lineTo(x - r * 1.02, y + r * 0.18); c.closePath(); c.fill(); c.strokeStyle = '#070B1C'; c.lineWidth = Math.max(1.2, r * 0.1); c.stroke();
      c.strokeStyle = '#D2AE5E'; c.lineWidth = Math.max(1.5, r * 0.18); c.beginPath(); c.moveTo(x - r * 1.0, y + r * 0.05); c.lineTo(x + r * 1.0, y + r * 0.05); c.stroke();
      for (let i = 0; i < 4; i++) { const a = Math.PI + (i + 0.5) / 4 * Math.PI; c.fillStyle = '#F0E6CE'; c.beginPath(); c.arc(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.5, r * 0.09, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(120,240,255,.5)'; ell(c, x, y - r * 0.28, r * 0.5, r * 0.15); c.fill(); c.fillStyle = '#E8FFFF'; ell(c, x, y - r * 0.28, r * 0.36, r * 0.05); c.fill();
      RSP.walk.push(cv); }
    { const cv = document.createElement('canvas'); cv.width = cv.height = 32; const c = cv.getContext('2d'), g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); RSP.shadow = cv; }
    return RSP; }
  /* the roller drawn for BREAK_FX's shards (its feet at 0, 0; P px per tile) */
  const rollerPaint = (c, Pp) => { const r = Pp * 0.4, y = -r; const g = c.createRadialGradient(-r * 0.35, y - r * 0.4, r * 0.1, 0, y, r); g.addColorStop(0, '#3D58A8'); g.addColorStop(0.55, '#1A2A62'); g.addColorStop(1, '#0A1230'); c.fillStyle = g; c.beginPath(); c.arc(0, y, r, 0, TAU); c.fill(); c.strokeStyle = '#D2AE5E'; c.lineWidth = r * 0.22; c.beginPath(); c.ellipse(0, y, r, r * 0.3, 0, 0, Math.PI); c.stroke(); c.fillStyle = '#DFFFFF'; ell(c, 0, y - r * 0.3, r * 0.3, r * 0.06); c.fill(); };

  /* ---- the balance knobs (the lead's tuning pass; tests read them) ---- */
  const TUNE = { CRAWL_K: 1.15, LEECH_K: 0.9, CRAWL_DMG: 0.55, LEECH_DMG: 0.5, GNAW_K: 0.5, GNAW_DMG: 0.3, BITE: 3.0, INTEG: 110,   /* v392 B2: 120 a wave: the queue refills each strike place at once and the crowd soaks shots, so a little more integrity and softer gnawers (clumps fall to area hits); still six strike places */ WIND: 1.0, REC: 0.75, ROLL_DMG: 0.12, VARKUL_K: 105, VARKUL_KHARROX: 0.25 };
  /* a small panel at the top of the screen (screen px) */
  function panel(c, x, y, w, h, col) { c.save(); c.fillStyle = 'rgba(6,18,26,.78)'; c.beginPath(); c.roundRect ? c.roundRect(x - w / 2, y, w, h, 10) : c.rect(x - w / 2, y, w, h); c.fill(); c.strokeStyle = rgba(col, 0.7); c.lineWidth = 1.5; c.stroke(); c.restore(); }
  function bar(c, x, y, w, h, k, c0, c1) { c.save(); c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x - 1, y - 1, w + 2, h + 2); const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); c.fillStyle = g; c.fillRect(x, y, w * clamp(k, 0, 1), h); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x, y, w * clamp(k, 0, 1), h * 0.4); c.restore(); }
  /* an arrow at the screen's edge toward something off it, with a label */
  function edgeMark(X, c, x, y, col, txt, icon) { const W = X.W(), Hh = X.H(), Xs = X.sx(x), Ys = X.sy(y); if (Xs > 26 && Xs < W - 26 && Ys > 120 && Ys < Hh - 180) return false;
    const cx = W / 2, cy = Hh / 2 - 20, dx = Xs - cx, dy = Ys - cy, a = Math.atan2(dy, dx), bx = W / 2 - 30, by = Hh / 2 - 160, k = Math.min(Math.abs(bx / (dx || 1e-6)), Math.abs(by / (dy || 1e-6))), ex = cx + dx * k, ey = cy + dy * k;
    c.save(); c.translate(ex, ey); c.fillStyle = col; c.strokeStyle = '#0A1A22'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 14, 0, TAU); c.fill(); c.stroke(); if (icon) emblem(c, icon, 0, 0, 7, '#0A1A22', { ink: false }); c.rotate(a); c.fillStyle = col; c.beginPath(); c.moveTo(22, 0); c.lineTo(14, -6); c.lineTo(14, 6); c.closePath(); c.fill(); c.restore();
    if (txt) label(c, txt, ex, ey + (ey > Hh / 2 ? -24 : 26), 11, '#FFFFFF'); return true; }

  /* ======================= EAST · THE SUNKEN MUSTER =======================
     A bell foundry, dark teal tiles with pale borders, bronze moulds along the walls, two great cracked bells hung high,
     four drainage mouths. Fifty ordinary monsters in five groups of ten (eight brine crawlers and two bell leeches each,
     low-health swarm variants), the next group as soon as one falls; "Monsters defeated: n/50". At fifty a cracked bell is
     rung and Varkul, the Chainbound, comes out between two broken bell halves. Only then the coral light cage round the
     Fang Crystal on its white platform falls away */
  function trialEast(X, H, S, K) {
    const E = GEO.E, me = X.me, g = X.g;
    const MOUTH = [{ x: 74.5, y: E.y0 + 0.75 }, { x: 89.5, y: E.y0 + 0.75 }, { x: 74.5, y: E.y1 - 0.75 }, { x: 89.5, y: E.y1 - 0.75 }];
    const LEECH = [{ x: 69.3, y: 46.2 }, { x: 69.3, y: 63.8 }, { x: 80.5, y: 44.4 }, { x: 84.5, y: 65.6 }, { x: 90.6, y: 46.0 }, { x: 90.6, y: 64.0 }, { x: 77, y: 64.9 }, { x: 87, y: 44.4 }, { x: 71.5, y: 55.0 }, { x: 72.5, y: 49.0 }];
    const CR = { x: 94.2, y: 55.2 }, PLAT = { x0: 91.3, x1: 96.7, y0: 51.6, y1: 58.9 }, VG = { x: 82, y: E.y0 + 0.35 };
    const BELLS = [{ x: 74, y: 46.8, sw: 0 }, { x: 90, y: 46.8, sw: 0 }];
    // v392 PR: the foundry's dressing (four moulds by the north wall, the two bell halves by Varkul's way in, the two hung bells) stands as breakable props in
    // the floor's prop list, repainted (20n9: areas, Ultimates and shots break them through BREAK_FX); null where that is off: the old 2D below
    const DRS = BPZ() ? BPZ().dress(X, [69.5, 78, 86, 94.5].map((x, i) => ({ kind: 'belfoundmould', v: i, x, y: E.y0 + 0.25 })).concat([-1, 1].map(sd => ({ kind: 'belfoundhalf', v: sd < 0 ? 0 : 1, x: VG.x + sd * 2.1, y: VG.y + 0.4, hp: 3 })), BELLS.map(b => ({ kind: 'belhung', v: 1, x: b.x, y: b.y, hp: 3 })))) : null;
    if (DRS) BELLS.forEach((b, i) => { b.p = DRS.items[6 + i]; });
    const T = { B: 'E', state: 'idle', list: [], group: 0, gapT: 0, kills: 0, V: null, bossState: 'pending', ringT: 0, cage: 1, downT: 0, crystalAt: CR, crystalH: 2.6 };
    if (DRS) T.dress = DRS.tick;   // v392 PR: shots through the dressing (the hall's update calls it)
    const silent = m => { if (!m.dead) { m.dead = true; m.hp = 0; } };
    T.reset = () => { for (const m of T.list) silent(m); T.list = []; if (T.V) { T.V.remove(); T.V = null; } T.group = 0; T.gapT = 0; T.kills = 0; T.bossState = 'pending'; T.ringT = 0; T.cage = 1; T.downT = 0; T.state = 'idle'; BELLS.forEach(b => { b.sw = 0; }); T.q = []; T.relT = 0; /* v404 BF */ };
    /* (v397, the user: double the east gate's monsters) 100 in five groups of twenty: sixteen crawlers and four leeches */
    const MUSTER_N = 100, GROUP_C = 16, GROUP_L = 4;
    T.restoreWon = () => { T.state = 'won'; T.cage = 0; T.kills = MUSTER_N; T.bossState = 'down'; };
    function spawnOne(type, p, pack) { const q = X.freeSpot(p.x, p.y, 0.45) || p; const m = X.spawnMon(MON[type] ? type : 'blob', q.x, q.y, { pack, rift: true, aggro: true }); m.aggro = true; m.muster = true; X.g.total = (X.g.total || 0) + 1; T.list.push(m); return m; }
    /* v404 BF (the user: "all enemies coming at you, not you going to them"): every group rushes the pet from the moment it
       crawls out: the crawlers sprint along the floor's flow (round the moulds and the pens, 20n crawler m.rush) and the leeches
       drop off their walls and slither in to spitting range (20n leech m.rush). The groups no longer wait for a clear field:
       they pour in one after another, each a trickle over ~1.4 s (spawn cost spread over frames), the next as soon as the
       field has room under the rift's own live cap (36, as its dungeon floors) and at least STAGGER s after the last; at
       once if the field is empty. Same 100 in five groups of twenty (sixteen crawlers, four leeches) */
    const LIVE_CAP = 36, STAGGER = 3.5, TRICKLE = 0.07, RUSH_C = 1.8, LEECH_SPD = 2.2;
    T.q = []; T.relT = 0;
    function spawnGroup() { T.group++; const pack = 960 + T.group, rnd = Math.random, gi = T.group; T.relT = 0;
      const crawl = i => () => { const mo = MOUTH[(i + gi) % 4], top = mo.y < 55, p = { x: mo.x + (rnd() - 0.5) * 2.6, y: mo.y + (top ? 1.3 : -1.3) + (rnd() - 0.5) * 0.9 };
        const m = spawnOne('crawler', p, pack); m.maxhp = m.hp = atkOf() * TUNE.CRAWL_K; m.dmg *= TUNE.CRAWL_DMG; m.cd = 0.6 + rnd() * 1.2; m.rush = RUSH_C; if (i % 4 === 0) X.splash(mo.x, mo.y + (top ? 0.8 : -0.8), 1.0); };
      const leech = j => () => { const p = LEECH[(gi * GROUP_L + j) % LEECH.length], m = spawnOne('leech', p, pack); m.maxhp = m.hp = atkOf() * TUNE.LEECH_K; m.dmg *= TUNE.LEECH_DMG; m.cd = 1.6 + rnd(); m.rush = 1; m.spd = LEECH_SPD; };
      // (crawlers and leeches interleaved: a leech every fourth place, so each trickle has both)
      let k = 0; for (let i = 0, j = 0; i < GROUP_C || j < GROUP_L; ) { const f = (k % 5 === 4 && j < GROUP_L) || i >= GROUP_C ? leech(j++) : crawl(i++); T.q.push({ t: k * TRICKLE, f }); k++; }
      for (const mo of MOUTH) { X.splash(mo.x, mo.y + (mo.y < 55 ? 0.8 : -0.8), 1.2); }
      X.banner(T.group === 1 ? 'THE SUNKEN MUSTER' : `GROUP ${T.group} OF 5`, T.group === 1 ? 'They pour out of the drains and come for you: sixteen brine crawlers, four bell leeches a group' : `${T.kills}/${MUSTER_N} down · twenty more pour in`, BR.E.col, 2, T.group === 1); }
    function pour(dt) { if (!T.q.length) return; for (const e of T.q) e.t -= dt; while (T.q.length && T.q[0].t <= 0) T.q.shift().f(); }
    // (the muster keeps a little room between its own: a crowd fans round the pet instead of stacking in one spot; a coarse grid, a few dozen pairs)
    const SEP = new Map();
    function spread(dt) { SEP.clear(); const L2 = []; for (const m of T.list) if (!m.dead) L2.push(m); if (L2.length < 2) return;
      for (const m of L2) { const k = (Math.floor(m.x) >> 1) * 1000 + (Math.floor(m.y) >> 1); let a = SEP.get(k); if (!a) SEP.set(k, a = []); a.push(m); }
      for (const m of L2) { const gx = Math.floor(m.x) >> 1, gy = Math.floor(m.y) >> 1; let px = 0, py = 0;
        for (let yy = gy - 1; yy <= gy + 1; yy++) for (let xx = gx - 1; xx <= gx + 1; xx++) { const a = SEP.get(xx * 1000 + yy); if (!a) continue;
          for (const o of a) { if (o === m) continue; const dx = m.x - o.x, dy = m.y - o.y, d = Math.hypot(dx, dy), want = (m.r + o.r) * 0.95; if (d >= want) continue; if (d < 1e-3) { px += Math.cos(m.wob || 0) * 0.5; py += Math.sin(m.wob || 0) * 0.5; continue; } const f = (want - d) / want; px += dx / d * f; py += dy / d * f; } }
        if (px || py) { const v = Math.min(1, Math.hypot(px, py)) * 2.2 * dt, n = Math.hypot(px, py); X.moveEnt(m, px / n * v, py / n * v); } } }
    const atkOf = () => K.atk();
    T.start = () => { T.state = 'run'; spawnGroup(); };
    function varkulHp() { let base = atkOf() * TUNE.VARKUL_K;
      // (the spec's reference: about a quarter of Kharrox's effective health, where his file says what that is)
      // (B3's Kharrox, 20t3: TUNE.effHp, the pet damage his whole health is worth, or the rift's own Rf.belkHp)
      try { const Rf = RIFT_BY_ID[X.F.rift.id], KT = typeof BELK !== 'undefined' && BELK && BELK.TUNE, eh = (Rf && Rf.belkHp) || (KT && KT.effHp / 4 /* v404: Kharrox's own 4x boss health (v400/v404) is not Varkul's */); if (eh > 0) base = eh * TUNE.VARKUL_KHARROX; } catch (e) {}
      return base; }
    function ringBell() { T.bossState = 'ring'; T.ringT = 0; const b = BELLS[0]; b.sw = 1; bellNote(X, 1); X.shake(lowFx() ? 2 : 6, 0.6); X.ring(b.x, b.y + 1, 0.4, 7, 0.9, '#FFD27A', 0.35); X.flash(0.3, '#FFE9B0');
      X.banner('A CRACKED BELL TOLLS', 'A hundred fallen. Varkul, the Chainbound, is released', BR.E.col, 3, true, true); }
    function release() { T.bossState = 'fight'; const V = typeof BELFRY_VARKUL !== 'undefined' ? BELFRY_VARKUL : null;
      if (V) T.V = V.spawn(X, H, VG.x, VG.y + 2.6, { hp: varkulHp(), from: { x: VG.x, y: VG.y - 1.5 } });
      else { T.bossState = 'down'; } }
    T.update = dt => {
      let alive = 0; for (const m of T.list) if (!m.dead) alive++; T.kills = Math.min(MUSTER_N, T.list.length - alive);
      // v404 BF: the groups pour in while the last still fights (the live cap and STAGGER above); an empty field calls the next at once
      pour(dt); T.relT += dt; const field = alive + T.q.length;
      if (T.group < 5) { if (field === 0) { T.gapT += dt; if (T.gapT > 0.45) { T.gapT = 0; spawnGroup(); } } else { T.gapT = 0; if (field + GROUP_C + GROUP_L <= LIVE_CAP && T.relT >= STAGGER) spawnGroup(); } }
      else if (field === 0 && T.bossState === 'pending' && T.kills >= MUSTER_N) ringBell();
      if (alive > 1) spread(dt);
      if (T.bossState === 'ring') { T.ringT += dt; if (T.ringT > 1.9) release(); }
      if (T.V && T.V.tick) T.V.tick(dt);
      if (T.bossState === 'fight' && T.V && T.V.m.dead) { T.bossState = 'down'; T.downT = 0; }
      if (T.bossState === 'down') { T.downT += dt; if (T.downT > 1.4 && T.cage > 0) breakCage(); }
    };
    T.tickWon = dt => { if (T.V && T.V.tick) T.V.tick(dt); };
    function breakCage() { T.cage = 0; T.state = 'won';
      if (typeof BREAK_FX !== 'undefined') try { BREAK_FX.burst(X, CR.x, CR.y + 0.5, { paint: (BPZ() && BPZ().painter([['cage', 'b'], ['cage', 'f']])) || cagePaint, key: BPZ() ? 'belcage2' : 'belcage', w: 2.4, h: 3.0, mat: BPZ() ? 'coral' : 'glass',   /* v392 PR: the repainted cage's own picture */ size: 2.6, cols: ['#FF8A7A', '#B0362C', '#FFE0D8'], hot: '#FF6F61', rubble: false }); } catch (e) {}
      X.ring(CR.x, CR.y, 0.3, 4, 0.6, BR.E.col, 0.35); X.banner('THE CORAL CAGE SHATTERS', 'The Fang Crystal is free: collect it', BR.E.col, 2.8, true, true); }
    const cagePaint = (c, Pp) => { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, x = Math.cos(a) * Pp * 0.95, y = Math.sin(a) * Pp * 0.35; c.fillStyle = i % 2 ? '#FF8A7A' : '#FFC2B6'; c.fillRect(x - Pp * 0.06, y - Pp * 2.6, Pp * 0.12, Pp * 2.6); } c.strokeStyle = '#FF6F61'; c.lineWidth = Pp * 0.1; c.beginPath(); c.ellipse(0, -Pp * 2.6, Pp * 0.95, Pp * 0.35, 0, 0, TAU); c.stroke(); };
    T.goal = () => `Monsters defeated: ${T.kills}/${MUSTER_N} · ${T.bossState === 'pending' ? 'Mini-boss pending' : T.bossState === 'ring' ? 'The bell tolls…' : T.V && !T.V.m.dead ? `Varkul, the Chainbound ${Math.max(0, Math.ceil(T.V.m.hp / T.V.m.maxhp * 100))}%` : 'Varkul is down'}`;
    T.hint = () => { if (T.V && !T.V.m.dead) return hyp(T.V.m.x - me.x, T.V.m.y - me.y) > 9 ? { x: T.V.m.x, y: T.V.m.y, h: 2.4, label: 'VARKUL' } : null; let b = null, bd = 9; for (const m of T.list) if (!m.dead) { const d = hyp(m.x - me.x, m.y - me.y); if (d < bd || !b) { if (d >= 8) { bd = d; b = m; } else return null; } } return b ? { x: b.x, y: b.y, h: 1.3, label: 'THE MUSTER' } : null; };
    T.cam = () => ({ x: me.x, y: me.y, k: 0, zoom: 0.86 });
    T.hud = (c, W, Hh) => { const y = 104, w = Math.min(250, W - 30); panel(c, W / 2, y, w, 58, BR.E.col);
      label(c, `Monsters defeated: ${T.kills}/${MUSTER_N}`, W / 2, y + 16, 15, '#FFFFFF', { w: 900 }); bar(c, W / 2 - w / 2 + 14, y + 27, w - 28, 5, T.kills / MUSTER_N, '#FF8A7A', '#FFD3CC');
      const V = T.V && T.V.m; if (V && !V.dead) { label(c, 'Varkul, the Chainbound', W / 2, y + 43, 12, BR.E.hi, { w: 800 }); bar(c, W / 2 - w / 2 + 14, y + 51, w - 28, 4, V.hp / V.maxhp, '#FF5A4D', '#FFB08A'); }
      else label(c, T.bossState === 'pending' ? 'Mini-boss pending' : T.bossState === 'ring' ? 'The bell tolls…' : 'Varkul is down', W / 2, y + 45, 12, '#C9D6DA', { w: 800 }); };
    /* ---- the foundry's floor and walls ---- */
    let PAT = null, patK = 0;
    function floorPat(c) { if (PAT) return PAT; const N = 64, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d');
      x.fillStyle = '#1D4A52'; x.fillRect(0, 0, N, N); const rnd = R1(41); for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},${0.03 + rnd() * 0.04})`; x.fillRect(rnd() * N, rnd() * N, 2 + rnd() * 6, 2 + rnd() * 4); }
      x.fillStyle = 'rgba(190,220,210,.55)'; x.fillRect(0, 0, N, 2); x.fillRect(0, 0, 2, N); x.fillStyle = 'rgba(0,20,24,.45)'; x.fillRect(0, N - 2, N, 2); x.fillRect(N - 2, 0, 2, N);
      x.fillStyle = 'rgba(214,140,80,.45)'; x.fillRect(N - 9, 5, 4, 4);
      PAT = c.createPattern(cv, 'repeat'); return PAT; }
    T.ground = (c, L, active) => { const cxm = (E.x0 + E.x1) / 2, cym = (E.y0 + E.y1) / 2; if (!onScreen(X, cxm, cym, 19)) return; const T2 = X.Tz(), t = X.g.t;
      c.save(); c.beginPath(); c.rect(X.sx(E.x0 + 0.1), X.sy(E.y0 + 0.1), (E.x1 - E.x0 - 0.2) * T2, (E.y1 - E.y0 - 0.2) * T2); c.clip();
      c.save(); c.translate(X.sx(0), X.sy(0)); c.scale(T2 / 64, T2 / 64); c.fillStyle = floorPat(c); c.fillRect(E.x0 * 64, E.y0 * 64, (E.x1 - E.x0) * 64, (E.y1 - E.y0) * 64); c.restore();
      // the shallow water along the foundry's edge
      c.strokeStyle = 'rgba(60,150,170,.45)'; c.lineWidth = T2 * 1.1; c.strokeRect(X.sx(E.x0 + 0.55), X.sy(E.y0 + 0.55), (E.x1 - E.x0 - 1.1) * T2, (E.y1 - E.y0 - 1.1) * T2);
      c.strokeStyle = 'rgba(200,245,250,.3)'; c.lineWidth = Math.max(1, T2 * 0.04); c.strokeRect(X.sx(E.x0 + 1.1), X.sy(E.y0 + 1.1), (E.x1 - E.x0 - 2.2) * T2, (E.y1 - E.y0 - 2.2) * T2);
      c.restore();
      // the drainage mouths: dark arches with bars, water spilling out
      for (const mo of MOUTH) { const Xs = X.sx(mo.x), Ys = X.sy(mo.y), top = mo.y < 55, w = T2 * 1.5; c.save(); if (!(BPZ() && BPZ().draw(c, top ? 'drain' : 'drainS', 0, Xs, Ys, T2))) { /* v392 PR: a repainted arch or floor grate; else the old 2D */ c.fillStyle = '#060E12'; c.beginPath(); if (top) { c.ellipse(Xs, Ys - T2 * 0.1, w, T2 * 0.9, 0, Math.PI, TAU); } else { c.ellipse(Xs, Ys + T2 * 0.3, w, T2 * 0.6, 0, 0, Math.PI); } c.fill(); c.strokeStyle = P.BRASS_D; c.lineWidth = Math.max(2, T2 * 0.08); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(Xs + i * w * 0.35, Ys + (top ? -T2 * 0.8 : T2 * 0.2)); c.lineTo(Xs + i * w * 0.35, Ys + (top ? 0 : T2 * 0.8)); c.stroke(); } } c.restore();
        L.q(Q => Q.wstream(Xs, Ys + (top ? -T2 * 0.2 : T2 * 0.2), Xs, Ys + (top ? T2 * 1.2 : -T2 * 1.0), T2 * 0.5, '#5FB8C8', 0.5, mo.x, 2, 0.6, 0.5)); }
      // bronze moulds along the north wall
      if (!DRS) for (const mx of [69.5, 78, 86, 94.5]) { const Xs = X.sx(mx), Ys = X.sy(E.y0 + 0.25); c.save(); const g2 = c.createLinearGradient(Xs - T2, 0, Xs + T2, 0); g2.addColorStop(0, '#B8894A'); g2.addColorStop(0.5, '#7C5426'); g2.addColorStop(1, '#4A3216'); c.fillStyle = g2; c.beginPath(); c.moveTo(Xs - T2 * 0.95, Ys); c.quadraticCurveTo(Xs - T2 * 0.9, Ys - T2 * 1.7, Xs, Ys - T2 * 1.85); c.quadraticCurveTo(Xs + T2 * 0.9, Ys - T2 * 1.7, Xs + T2 * 0.95, Ys); c.closePath(); c.fill(); c.strokeStyle = '#1E140A'; c.lineWidth = Math.max(1.5, T2 * 0.05); c.stroke(); c.strokeStyle = 'rgba(120,200,160,.4)'; c.beginPath(); c.moveTo(Xs - T2 * 0.6, Ys - T2 * 0.6); c.lineTo(Xs + T2 * 0.6, Ys - T2 * 0.6); c.stroke(); c.restore(); }
      // the two broken bell halves either side of Varkul's way in, and the dark breach between them
      { const Xs = X.sx(VG.x), Ys = X.sy(VG.y + 0.4); c.save(); if (!(BPZ() && BPZ().draw(c, 'pit', 0, Xs, Ys, T2))) { c.fillStyle = '#04090C'; ell(c, Xs, Ys - T2 * 0.4, T2 * 1.4, T2 * 1.2); c.fill(); }   // v392 PR: a painted pit (stone rim, broken grate, depth); the halves stand as props (DRS)
        if (!DRS) for (const sd of [-1, 1]) { const bx = Xs + sd * T2 * 2.1; const g2 = c.createLinearGradient(bx - T2, 0, bx + T2, 0); g2.addColorStop(0, sd < 0 ? '#C2934E' : '#6E4A22'); g2.addColorStop(1, sd < 0 ? '#6E4A22' : '#3A2610'); c.fillStyle = g2; c.beginPath(); c.moveTo(bx - sd * T2 * 0.1, Ys + T2 * 0.3); c.quadraticCurveTo(bx + sd * T2 * 1.0, Ys - T2 * 0.4, bx + sd * T2 * 0.6, Ys - T2 * 2.6); c.lineTo(bx + sd * T2 * 0.1, Ys - T2 * 2.4); c.lineTo(bx - sd * T2 * 0.25, Ys - T2 * 1.2); c.lineTo(bx + sd * T2 * 0.05, Ys - T2 * 0.6); c.closePath(); c.fill(); c.strokeStyle = '#1A1008'; c.lineWidth = Math.max(1.5, T2 * 0.05); c.stroke();
          c.strokeStyle = 'rgba(255,220,160,.35)'; c.beginPath(); c.moveTo(bx + sd * T2 * 0.3, Ys - T2 * 0.2); c.quadraticCurveTo(bx + sd * T2 * 0.8, Ys - T2 * 1.0, bx + sd * T2 * 0.55, Ys - T2 * 2.2); c.stroke(); }
        c.restore(); if (T.bossState === 'ring' || (T.bossState === 'pending' && T.kills >= 40)) L.q(Q => Q.glow(Xs, Ys - T2 * 0.4, T2 * 2.2, BR.E.col, 0.3 + 0.2 * Math.sin(t * 6))); }
      // the white stone platform at the far end
      { const x0 = X.sx(PLAT.x0), y0 = X.sy(PLAT.y0), w = (PLAT.x1 - PLAT.x0) * T2, h = (PLAT.y1 - PLAT.y0) * T2; c.save(); if (!(BPZ() && BPZ().draw(c, 'platform', (PLAT.x1 - PLAT.x0).toFixed(1) + 'x' + (PLAT.y1 - PLAT.y0).toFixed(1), x0, y0, T2))) { /* v392 PR: the repainted platform; else the old 2D */ c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x0 + T2 * 0.1, y0 + T2 * 0.2, w, h); c.fillStyle = '#E8E9E0'; c.fillRect(x0, y0, w, h); c.fillStyle = '#BFC2B5'; c.fillRect(x0, y0 + h - T2 * 0.3, w, T2 * 0.3); c.strokeStyle = '#7E8478'; c.lineWidth = Math.max(1.5, T2 * 0.05); c.strokeRect(x0, y0, w, h); c.strokeStyle = 'rgba(120,128,118,.4)'; c.beginPath(); for (let i = 1; i < 4; i++) { c.moveTo(x0, y0 + h * i / 4); c.lineTo(x0 + w, y0 + h * i / 4); } c.stroke(); } c.restore();
        if (T.cage > 0) L.q(Q => Q.glow(X.sx(CR.x), X.sy(CR.y), T2 * 2.6, BR.E.col, 0.3, 0.5)); }
      if (T.V && T.V.ground) T.V.ground(c, L);
    };
    T.late = (c, L) => { const T2 = X.Tz(), t = X.g.t; if (!onScreen(X, 82, 50, 18)) return;
      // the two great cracked bells hung high over the foundry (one swings and rings when the fiftieth falls)
      for (const b of BELLS) { const Xs = X.sx(b.x), Yg = X.sy(b.y), Yb = Yg - T2 * 4.6; b.sw = Math.max(0, b.sw - 1 / 60 * 0.25); const a = Math.sin(t * 5.5) * 0.32 * b.sw;
        if (b.p) { const gone = b.p.broken && !(b.p.hold > 0);   // v392 PR: a standing prop (DRS) drawn by the engine; while it swings it is hidden there and drawn here, turning on its chain
          if (!gone && b.sw > 0.05 && BPZ()) { b.p.hold = 0.15; c.save(); c.globalAlpha = 0.28; c.fillStyle = '#000'; ell(c, Xs + Math.sin(a) * T2 * 1.5, Yg + T2 * 0.2, T2 * 1.6, T2 * 0.45); c.fill(); c.restore(); c.save(); c.strokeStyle = '#2A1E12'; c.lineWidth = Math.max(2, T2 * 0.1); c.beginPath(); c.moveTo(Xs, Yb - T2 * 6); c.lineTo(Xs, Yb - T2 * 1.6); c.stroke(); c.restore(); BPZ().draw(c, 'hungbell', 'c', Xs, Yb - T2 * 1.6, T2, { rot: a }); L.q(Q => Q.ewave(Xs, Yb, T2 * (2 + 5 * (1 - b.sw)), '#FFD27A', 0.8, 0.5 * b.sw, 3.3, 0.6, 0.18)); }
          continue; }
        c.save(); c.globalAlpha = 0.28; c.fillStyle = '#000'; ell(c, Xs + Math.sin(a) * T2 * 1.5, Yg + T2 * 0.2, T2 * 1.6, T2 * 0.45); c.fill(); c.restore();
        c.save(); c.strokeStyle = '#2A1E12'; c.lineWidth = Math.max(2, T2 * 0.1); c.beginPath(); c.moveTo(Xs, Yb - T2 * 6); c.lineTo(Xs, Yb - T2 * 1.6); c.stroke();
        c.translate(Xs, Yb - T2 * 1.6); c.rotate(a); const bw = T2 * 1.7, bh = T2 * 2.4; const g2 = c.createLinearGradient(-bw, 0, bw, 0); g2.addColorStop(0, '#C79A55'); g2.addColorStop(0.45, '#8A6230'); g2.addColorStop(1, '#3E2A12'); c.fillStyle = g2;
        c.beginPath(); c.moveTo(-bw * 0.35, 0); c.quadraticCurveTo(-bw * 0.7, bh * 0.3, -bw * 0.8, bh * 0.8); c.quadraticCurveTo(-bw * 1.05, bh, -bw, bh * 1.05); c.lineTo(bw, bh * 1.05); c.quadraticCurveTo(bw * 1.05, bh, bw * 0.8, bh * 0.8); c.quadraticCurveTo(bw * 0.7, bh * 0.3, bw * 0.35, 0); c.closePath(); c.fill(); c.strokeStyle = '#1A1008'; c.lineWidth = Math.max(1.5, T2 * 0.05); c.stroke();
        c.strokeStyle = '#0A0604'; c.lineWidth = Math.max(1.5, T2 * 0.06); c.beginPath(); c.moveTo(bw * 0.2, bh * 0.1); c.lineTo(bw * 0.05, bh * 0.45); c.lineTo(bw * 0.3, bh * 0.7); c.lineTo(bw * 0.15, bh * 1.05); c.stroke();
        c.strokeStyle = 'rgba(120,200,160,.35)'; c.lineWidth = Math.max(2, T2 * 0.08); c.beginPath(); c.moveTo(-bw * 0.85, bh * 0.85); c.lineTo(bw * 0.85, bh * 0.85); c.stroke(); c.restore();
        if (b.sw > 0.05) L.q(Q => Q.ewave(Xs, Yb, T2 * (2 + 5 * (1 - b.sw)), '#FFD27A', 0.8, 0.5 * b.sw, 3.3, 0.6, 0.18)); }
      if (T.V && T.V.late) T.V.late(c, L);
    };
    T.drawCrystal = (c, Xs, Ys, T2, can) => { const t = X.g.t; if (K.has(K.PS().carry, 'E') || K.has(K.PS().dep, 'E')) return; const cy = Ys - T2 * 1.3 + Math.sin(t * 1.8) * T2 * 0.06;
      // a low plinth on the platform (v392 PR: repainted, its coral cage's back bars behind it; else the old 2D)
      const BPc = BPZ(), cg = T.cage > 0 && !!(BPc && BPc.draw(c, 'cage', 'b', Xs, Ys, T2));
      c.save(); if (!(BPc && BPc.draw(c, 'plinth', 0, Xs, Ys, T2))) c.fillStyle = '#D9DBD0'; else c.globalAlpha = 0; c.fillRect(Xs - T2 * 0.5, Ys - T2 * 0.45, T2, T2 * 0.45); c.strokeStyle = '#7E8478'; c.lineWidth = 1.5; c.strokeRect(Xs - T2 * 0.5, Ys - T2 * 0.45, T2, T2 * 0.45); ell(c, Xs, Ys - T2 * 0.45, T2 * 0.5, T2 * 0.16); c.fillStyle = '#EEEFE8'; c.fill(); c.stroke(); c.restore();
      crystalArt(c, 'E', Xs, cy, T2 * 1.05, t, { k: can ? 1 : 0.6 }); crystalLight(K.LL, 'E', Xs, cy, T2 * 1.05, can ? 1 : 0.6, t);
      if (T.cage > 0) { const n = 9, rx = T2 * 1.0, ry = T2 * 0.36, hh = T2 * 2.6; if (cg) BPc.draw(c, 'cage', 'f', Xs, Ys, T2); c.save(); c.globalCompositeOperation = 'lighter'; if (!cg) {   // (v392 PR: the repainted coral cage, else the old glowing bars)
        for (let i = 0; i < n; i++) { const a = i / n * TAU + t * 0.4, x = Xs + Math.cos(a) * rx, y = Ys + Math.sin(a) * ry, front = Math.sin(a) > 0; c.globalAlpha = front ? 0.85 : 0.45; const g2 = c.createLinearGradient(0, y - hh, 0, y); g2.addColorStop(0, 'rgba(255,111,97,0)'); g2.addColorStop(0.2, '#FF8A7A'); g2.addColorStop(1, '#FFD3CC'); c.fillStyle = g2; c.fillRect(x - T2 * 0.05, y - hh, T2 * 0.1, hh); }
        c.globalAlpha = 0.8; c.strokeStyle = '#FF8A7A'; c.lineWidth = Math.max(1.5, T2 * 0.06); c.beginPath(); c.ellipse(Xs, Ys - hh * 0.98, rx, ry, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(Xs, Ys, rx, ry, 0, 0, TAU); c.stroke(); } c.restore();
        K.LL.q(Q => { for (let i = 0; i < n; i++) { const a = i / n * TAU + (cg ? 0.2 : t * 0.4), x = Xs + Math.cos(a) * rx, y = Ys + Math.sin(a) * ry; Q.beam(x, y, x, y - hh, T2 * 0.18, BR.E.col, Math.sin(a) > 0 ? 0.45 : 0.25); } Q.glow(Xs, Ys - hh * 0.5, T2 * 2.2, BR.E.col, 0.28, 1.4); Q.ring(Xs, Ys - hh, rx * 1.05, '#FFD3CC', 0.4, T2 * 0.1, 0.36); }, c2 => glow(c2, Xs, Ys - hh * 0.5, T2 * 2, BR.E.col, 0.3, 1.4)); }
      else if (can) K.LL.q(Q => Q.ring(Xs, Ys, T2 * (1 + 0.3 * Math.sin(t * 3)), BR.E.col, 0.5, T2 * 0.12, 0.4)); };
    return T;
  }

  /* ======================= WEST · THE LAST BEACON =======================
     A round chapel, ribbed windows on the dark sea, a pale mint crystal floating over a low brass pedestal in the middle,
     its shield of light on the floor. Three broad approaches (west, north, south), each outlined by a shallow trench.
     One thirty-second timer; 120 reef gnawers a wave, forty from each approach (v392 B2: was 60); a whole new wave the moment the last is
     cleared. Six strike places round the pedestal: the rest queue. Each bite has its own time; a bite at or before the
     deadline is resolved before the deadline is; at thirty seconds with integrity left the gnawers dissolve into foam */
  function trialWest(X, H, S, K) {
    const C = GEO.W, me = X.me, g = X.g, CR = { x: C.x, y: C.y };
    const APP = [{ k: 'W', name: 'WEST', sp: { x0: 6.7, x1: 11.6, y0: 52.7, y1: 56.3 }, mouth: { x: C.x - C.r + 0.9, y: C.y }, dir: [1, 0] },
      { k: 'N', name: 'NORTH', sp: { x0: 22.7, x1: 26.3, y0: 35.7, y1: 41.6 }, mouth: { x: C.x, y: C.y - C.r + 0.9 }, dir: [0, 1] },
      { k: 'S', name: 'SOUTH', sp: { x0: 22.7, x1: 26.3, y0: 67.4, y1: 73.3 }, mouth: { x: C.x, y: C.y + C.r - 0.9 }, dir: [0, -1] }];
    const NSLOT = 6, SLOT_R = 1.25, QR = 2.9, DUR = 30, W_PER = 40;   // v392 B2: 40 per approach, still six strike places
    const T = { B: 'W', state: 'idle', integ: TUNE.INTEG, wave: 0, deadline: 0, all: [], slots: new Array(NSLOT).fill(null), ev: [], crack: 0, bites: 0, hitFx: 0, waveN: [], crystalAt: { x: CR.x, y: CR.y + 0.05 }, crystalH: 2.9, foam: [], log: [] };
    const W = { live: false, cx: CR.x, cy: CR.y, QR, ai, claim, slotPos };
    const silent = m => { if (!m.dead) { m.dead = true; m.hp = 0; } };
    T.reset = () => { for (const m of T.all) silent(m); T.all = []; T.slots.fill(null); T.ev.length = 0; T.integ = TUNE.INTEG; T.crack = 0; T.wave = 0; T.waveN = []; T.state = 'idle'; T.bites = 0; W.live = false; if (WEST === W) WEST = null; };
    T.restoreWon = () => { T.state = 'won'; T.integ = Math.max(1, T.integ); };
    function slotPos(i) { const a = i / NSLOT * TAU + 0.26; return { x: W.cx + Math.cos(a) * SLOT_R, y: W.cy + Math.sin(a) * SLOT_R }; }
    function claim(m) { let b = -1, bd = 1e9; for (let i = 0; i < NSLOT; i++) { const o = T.slots[i]; if (o && !o.dead && o.gn && o.gn.slot === i) continue; const p = slotPos(i), d = hyp(p.x - m.x, p.y - m.y); if (d < bd) { bd = d; b = i; } } if (b >= 0) T.slots[b] = m; return b; }
    function bite(m, at) { T.ev.push({ t: at, d: TUNE.BITE, m }); }
    /* the gnawer's turn (the engine calls it through DunAI.mon.reefgnawer while this trial runs) */
    function ai(m, A, X2) { const s = m.gn || (m.gn = { s: 'go', t: 0, fl: m.flash || 0, slot: -1, q: 0, side: Math.random() < 0.5 ? -1 : 1 }), dt = A.dt; s.t += dt;
      const hitNow = (m.flash || 0) > s.fl + 0.01; s.fl = m.flash || 0;
      const dx = W.cx - m.x, dy = W.cy - m.y, d = hyp(dx, dy) || 1;
      const step = (tx, ty, sp) => { const ex = tx - m.x, ey = ty - m.y, e = hyp(ex, ey); if (e < 0.02) return e; const v = Math.min(e, sp * dt); X2.moveEnt(m, ex / e * v, ey / e * v); return e; };
      if (s.s === 'go') { m.mode = ''; const lat = Math.sin(s.t * 2.2 + (m.wob || 0)) * 0.4; step(W.cx - dy / d * lat * 3, W.cy + dx / d * lat * 3, A.sp); if (d < QR + 0.5) { const sl = claim(m); if (sl >= 0) { s.s = 'slot'; s.slot = sl; } else s.s = 'queue'; } return; }
      if (s.s === 'queue') { m.mode = ''; s.q -= dt; if (s.q <= 0) { s.q = 0.2; const sl = claim(m); if (sl >= 0) { s.s = 'slot'; s.slot = sl; return; } } const a = Math.atan2(m.y - W.cy, m.x - W.cx) + s.side * 0.55 * dt * 2, rr = QR + 0.45 * Math.sin((m.wob || 0) + s.t * 1.3); step(W.cx + Math.cos(a) * rr, W.cy + Math.sin(a) * rr, A.sp * 0.65); return; }
      const p = slotPos(s.slot), e = hyp(p.x - m.x, p.y - m.y);
      if (T.slots[s.slot] !== m) { s.s = 'queue'; s.slot = -1; return; }
      if (s.s === 'slot') { m.mode = ''; step(p.x, p.y, A.sp); if (e < 0.2) { s.s = 'wind'; s.t = 0; s.t0 = X2.g.t; } return; }
      if (s.s === 'wind') { m.mode = 'block'; if (hitNow) { s.s = 'rec'; s.t = -0.4; X2.text(m.x, m.y - 0.75, 'Interrupted!', '#FFFFFF', 11); return; } if (e > 0.95) { s.s = 'slot'; return; } if (s.t >= TUNE.WIND) { bite(m, s.t0 + TUNE.WIND); s.s = 'rec'; s.t = 0; X2.slash(m.x + dx / d * 0.5, m.y + dy / d * 0.5, Math.atan2(dy, dx), 0.6, BR.W.col); } return; }
      if (s.s === 'rec') { m.mode = ''; if (s.t >= TUNE.REC) { if (e < 0.5) { s.s = 'wind'; s.t = 0; s.t0 = X2.g.t; } else s.s = 'slot'; } } }
    function spawnWave() { T.wave++; const pack = 975 + T.wave; let n = 0; const ns = [];
      for (const a of APP) { const cols = a.k === 'W' ? 8 : 5, rows = W_PER / cols; let k = 0;   // v392 B2: forty from each approach (a wave of 120)
        for (let i = 0; i < W_PER; i++) { const cx = i % cols, ry = Math.floor(i / cols), x = lerp(a.sp.x0, a.sp.x1, (cx + 0.5) / cols) + (Math.random() - 0.5) * 0.25, y = lerp(a.sp.y0, a.sp.y1, (ry + 0.5) / rows) + (Math.random() - 0.5) * 0.25;
          const m = X.spawnMon('reefgnawer', x, y, { pack, rift: true, aggro: true }); m.aggro = true; m.app = APP.indexOf(a); m.wave = T.wave; m.maxhp = m.hp = K.atk() * TUNE.GNAW_K; m.dmg *= TUNE.GNAW_DMG; m.spd *= 0.92 + Math.random() * 0.3; m.gn = null; T.all.push(m); n++; k++; }
        ns.push(k); X.splash(a.mouth.x - a.dir[0] * 1.5, a.mouth.y - a.dir[1] * 1.5, 1.6); }
      T.waveN.push(n); T.log.push({ wave: T.wave, n, per: ns });
      X.banner(T.wave === 1 ? 'DEFEND THE BEACON' : `WAVE ${T.wave}`, T.wave === 1 ? 'A hundred and twenty reef gnawers, forty from each approach' : 'The last wave is cleared: a hundred and twenty more pour in', BR.W.col, 1.8, T.wave === 1); if (X.sfx.crash) X.sfx.crash(); }
    T.start = () => { T.state = 'run'; T.deadline = g.t + DUR; T.integ = TUNE.INTEG; WEST = W; W.live = true; spawnWave(); };
    const waveAlive = () => { let n = 0; for (const m of T.all) if (!m.dead && m.wave === T.wave) n++; return n; };
    T.update = dt => { if (T.state !== 'run') return;
      for (let i = 0; i < NSLOT; i++) { const o = T.slots[i]; if (o && (o.dead || !o.gn || o.gn.slot !== i)) T.slots[i] = null; }
      // the bites, by their own times: any at or before the deadline count before the deadline is judged
      if (T.ev.length) { T.ev.sort((a, b) => a.t - b.t); for (const e of T.ev) { if (e.t > T.deadline + 1e-9) continue; T.integ -= e.d; T.bites++; T.hitFx = 0.3; if (T.integ <= 0) { T.integ = 0; T.ev.length = 0; T.brokeAt = e.t; breakCrystal(); return; } } T.ev.length = 0; }
      T.crack = 1 - T.integ / TUNE.INTEG; T.hitFx = Math.max(0, T.hitFx - dt);
      if (g.t >= T.deadline) { success(); return; }
      if (waveAlive() === 0) spawnWave(); };
    function success() { T.state = 'won'; T.ev.length = 0; W.live = false; if (WEST === W) WEST = null; let n = 0;
      for (const m of T.all) if (!m.dead) { n++; for (let i = 0; i < 3; i++) X.part({ kind: 'bubble', x: m.x + (Math.random() - 0.5) * 0.5, y: m.y - 0.1, vx: (Math.random() - 0.5) * 0.8, vy: -1 - Math.random() * 1.5, g: 2, life: 0.9, max: 0.9, size: 3 + Math.random() * 4, color: '#F2FFFF' }); T.foam.push({ x: m.x, y: m.y, t: 0 }); silent(m); }
      T.foamed = n; X.ring(CR.x, CR.y, 0.4, C.r - 1, 1.0, '#E8FFF8', 0.35); X.flash(0.35, '#E8FFF8');
      X.banner('THE BEACON HOLDS', `Thirty seconds, integrity ${Math.ceil(T.integ)}%: the gnawers dissolve into foam. Collect the Ward Crystal`, BR.W.col, 3.2, true, true); }
    function breakCrystal() { if (typeof BREAK_FX !== 'undefined') try { BREAK_FX.burst(X, CR.x, CR.y + 0.3, { paint: (c, Pp) => crystalArt(c, 'W', 0, -Pp * 1.5, Pp * 1.2, 0, { noGlow: true }), key: 'belward', w: 1.4, h: 2.2, mat: 'glass', size: 1.8, cols: ['#7FEFC0', '#2E9C78', '#DFFFF0'], rubble: false }); } catch (e) {}
      X.boom(CR.x, CR.y - 1.4, 1.6, BR.W.col, '#FFFFFF', { n: 24, shake: 8 }); K.failTrial('W', 'broken'); }
    T.goal = () => `Defend: 00:${String(Math.max(0, Math.ceil(T.deadline - g.t))).padStart(2, '0')} · integrity ${Math.ceil(T.integ)}% · wave ${T.wave}`;
    T.hint = () => null;
    T.cam = () => ({ x: lerp(me.x, CR.x, 0.35), y: lerp(me.y, CR.y, 0.35), k: 0.55, zoom: 0.76 });
    // how hard each approach is pressing (incoming and at the pedestal)
    function threat() { const n = [0, 0, 0]; for (const m of T.all) if (!m.dead && m.app != null) n[m.app]++; return n; }
    T.hud = (c, W2, Hh) => { const left = T.state === 'run' ? Math.max(0, T.deadline - g.t) : T.state === 'won' ? 0 : DUR, y = 100, w = Math.min(250, W2 - 30); panel(c, W2 / 2, y, w, 66, BR.W.col);
      const sec = Math.ceil(left - 1e-6); label(c, `Defend: 00:${String(sec).padStart(2, '0')}`, W2 / 2, y + 20, 24, sec <= 5 && T.state === 'run' ? '#FFE37A' : '#FFFFFF', { w: 900, lw: 5 });
      const k = T.integ / TUNE.INTEG; bar(c, W2 / 2 - w / 2 + 14, y + 38, w - 28, 8, k, k < 0.35 ? '#FF5A4D' : '#2E9C78', k < 0.35 ? '#FFB08A' : '#BFFFE6'); if (T.hitFx > 0) { c.save(); c.globalAlpha = T.hitFx * 2; c.fillStyle = '#FFFFFF'; c.fillRect(W2 / 2 - w / 2 + 14, y + 38, (w - 28) * k, 8); c.restore(); }
      label(c, `Integrity ${Math.ceil(T.integ)}%   ·   Wave ${Math.max(1, T.wave)}`, W2 / 2, y + 56, 11, BR.W.hi, { w: 800 });
      if (T.state === 'run') { const n = threat(); APP.forEach((a, i) => { if (n[i] > 0) edgeMark(X, c, a.mouth.x, a.mouth.y, n[i] > 12 ? '#FF8A7A' : BR.W.col, `${a.name} ${n[i]}`, 'shield'); }); } };
    T.ground = (c, L, active) => { if (!onScreen(X, C.x, C.y, C.r + 8)) return; const T2 = X.Tz(), t = X.g.t, cx = X.sx(C.x), cy = X.sy(C.y);
      c.save();
      // the chapel floor: pale limestone in rings, a slightly darker outer band
      const fg = c.createRadialGradient(cx, cy, T2, cx, cy, C.r * T2); fg.addColorStop(0, '#D7DACB'); fg.addColorStop(0.75, '#C4C8B8'); fg.addColorStop(1, '#9EA394'); c.fillStyle = fg; c.beginPath(); c.arc(cx, cy, (C.r - 0.25) * T2, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(90,100,90,.25)'; c.lineWidth = Math.max(1, T2 * 0.03); for (const r of [3.4, 6.6, 9.6]) { c.beginPath(); c.arc(cx, cy, r * T2, 0, TAU); c.stroke(); }
      // the three approaches, each outlined by a shallow trench
      for (const a of APP) { const px = -a.dir[1], py = a.dir[0]; for (const sd of [-1, 1]) { const x0 = a.mouth.x - a.dir[0] * 4 + px * sd * 2.7, y0 = a.mouth.y - a.dir[1] * 4 + py * sd * 2.7, x1 = a.mouth.x + a.dir[0] * 5.5 + px * sd * 1.8, y1 = a.mouth.y + a.dir[1] * 5.5 + py * sd * 1.8;
          c.lineCap = 'round'; c.strokeStyle = 'rgba(30,90,110,.55)'; c.lineWidth = T2 * 0.42; c.beginPath(); c.moveTo(X.sx(x0), X.sy(y0)); c.lineTo(X.sx(x1), X.sy(y1)); c.stroke(); c.strokeStyle = 'rgba(190,240,250,.45)'; c.lineWidth = Math.max(1, T2 * 0.05); c.stroke(); } }
      // the shield of light the crystal throws on the floor (dimming and cracking with its integrity)
      const lk = T.state === 'won' ? 1 : 0.35 + 0.65 * (T.integ / TUNE.INTEG); c.save(); c.globalCompositeOperation = 'lighter'; const sg = c.createRadialGradient(cx, cy, 0, cx, cy, T2 * 3.2); sg.addColorStop(0, rgba('#BFFFE6', 0.45 * lk)); sg.addColorStop(1, rgba('#7FEFC0', 0)); c.fillStyle = sg; emblemPath(c, 'shield', cx, cy + T2 * 0.3, T2 * 3.0); c.fill(); c.strokeStyle = rgba('#DFFFF0', 0.55 * lk); c.lineWidth = Math.max(1.5, T2 * 0.06); c.stroke(); c.restore();
      L.q(Q => { Q.glow(cx, cy + T2 * 0.2, T2 * 3.6, BR.W.col, 0.3 * lk, 0.75); Q.caustic(cx, cy, T2 * 3.2, '#BFFFE6', 0.25 * lk, 2.4, 0.8); });
      // the strike places, and each gnawer winding up a bite there: a filling arc and a line to the crystal
      for (let i = 0; i < NSLOT; i++) { const p = slotPos(i), Xs = X.sx(p.x), Ys = X.sy(p.y); c.strokeStyle = 'rgba(40,70,60,.35)'; c.lineWidth = Math.max(1, T2 * 0.04); c.beginPath(); c.arc(Xs, Ys, T2 * 0.36, 0, TAU); c.stroke(); }
      if (T.state === 'run') for (const m of T.all) { if (m.dead || !m.gn || m.gn.s !== 'wind') continue; const u = clamp(m.gn.t / TUNE.WIND, 0, 1), Xs = X.sx(m.x), Ys = X.sy(m.y);
        c.strokeStyle = 'rgba(10,20,30,.7)'; c.lineWidth = T2 * 0.13; c.beginPath(); c.arc(Xs, Ys, T2 * 0.5, 0, TAU); c.stroke(); c.strokeStyle = u > 0.7 ? '#FF5A4D' : '#FFB347'; c.lineWidth = T2 * 0.08; c.beginPath(); c.arc(Xs, Ys, T2 * 0.5, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke();
        c.strokeStyle = rgba('#FF7A5A', 0.3 + 0.5 * u); c.lineWidth = T2 * 0.06; c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(cx, cy); c.stroke(); label(c, '!', Xs, Ys - T2 * 0.95, T2 * 0.34, u > 0.7 ? '#FF5A4D' : '#FFD27A', { w: 900 });
        L.q(Q => Q.glow(Xs, Ys, T2 * 0.8, '#FF7A5A', 0.25 + 0.4 * u)); }
      // the approaches under pressure: a direction marker with the shield at each mouth
      if (T.state === 'run') { const n = threat(); APP.forEach((a, i) => { if (!n[i]) return; const Xs = X.sx(a.mouth.x + a.dir[0] * 0.9), Ys = X.sy(a.mouth.y + a.dir[1] * 0.9), k = 0.6 + 0.4 * Math.sin(t * 6 + i), hot = n[i] > 12;
        c.save(); c.translate(Xs, Ys); c.rotate(Math.atan2(a.dir[1], a.dir[0])); c.fillStyle = rgba(hot ? '#FF7A5A' : BR.W.col, 0.55 * k); c.beginPath(); c.moveTo(T2 * 0.9, 0); c.lineTo(-T2 * 0.3, -T2 * 0.6); c.lineTo(-T2 * 0.3, T2 * 0.6); c.closePath(); c.fill(); c.restore();
        emblem(c, 'shield', Xs, Ys, T2 * 0.28, hot ? '#FFD3CC' : BR.W.hi); label(c, `${a.name} · ${n[i]}`, Xs, Ys - T2 * 0.75, T2 * 0.26, hot ? '#FFD3CC' : '#FFFFFF'); }); }
      // ribbed windows round the north side: the dark sea pressing on the glass
      for (let i = 0; i < 5; i++) { const a = Math.PI * (1.12 + i * 0.19), x = cx + Math.cos(a) * (C.r - 0.1) * T2, y = cy + Math.sin(a) * (C.r - 0.1) * T2, w = T2 * 1.1, h = T2 * 2.0;
        const wg = c.createLinearGradient(0, y - h, 0, y); wg.addColorStop(0, '#04121C'); wg.addColorStop(0.6, '#0B3346'); wg.addColorStop(1, '#155A6E'); c.fillStyle = wg; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h * 0.7); c.quadraticCurveTo(x, y - h * 1.15, x + w / 2, y - h * 0.7); c.lineTo(x + w / 2, y); c.closePath(); c.fill(); c.strokeStyle = P.BRASS; c.lineWidth = Math.max(1.5, T2 * 0.07); c.stroke();
        c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h * 0.92); c.moveTo(x - w / 2, y - h * 0.4); c.lineTo(x + w / 2, y - h * 0.4); c.stroke();
        for (let k = 0; k < 2; k++) { const u = (t * 0.08 + i * 0.3 + k * 0.5) % 1; c.fillStyle = `rgba(150,220,240,${0.25 * Math.sin(u * Math.PI)})`; c.beginPath(); c.arc(x - w * 0.25 + k * w * 0.4, y - h * u * 0.9, T2 * 0.05, 0, TAU); c.fill(); } }
      for (const f of T.foam) { f.t += 1 / 60; if (f.t > 1.4) continue; c.fillStyle = `rgba(240,255,255,${0.6 * (1 - f.t / 1.4)})`; ell(c, X.sx(f.x), X.sy(f.y), T2 * (0.3 + f.t * 0.4), T2 * (0.15 + f.t * 0.15)); c.fill(); } if (T.foam.length && T.foam.every(f => f.t > 1.4)) T.foam.length = 0;
      c.restore(); };
    T.drawCrystal = (c, Xs, Ys, T2, can) => { const t = X.g.t, gone = K.has(K.PS().carry, 'W') || K.has(K.PS().dep, 'W');
      // the low brass pedestal (v392 PR: repainted, a moulded base, shaft and capital with brass fittings; the old 2D only where that is off)
      c.save(); if (BPZ() && BPZ().draw(c, 'pedestal', 0, Xs, Ys, T2)) c.globalAlpha = 0; c.fillStyle = 'rgba(0,0,0,.3)'; ell(c, Xs, Ys + T2 * 0.05, T2 * 0.75, T2 * 0.25); c.fill(); const pg = c.createLinearGradient(Xs - T2 * 0.6, 0, Xs + T2 * 0.6, 0); pg.addColorStop(0, '#D9B66A'); pg.addColorStop(0.5, P.BRASS); pg.addColorStop(1, P.BRASS_D); c.fillStyle = pg; c.fillRect(Xs - T2 * 0.6, Ys - T2 * 0.42, T2 * 1.2, T2 * 0.42); c.strokeStyle = P.INK; c.lineWidth = 1.5; c.strokeRect(Xs - T2 * 0.6, Ys - T2 * 0.42, T2 * 1.2, T2 * 0.42); ell(c, Xs, Ys - T2 * 0.42, T2 * 0.6, T2 * 0.2); c.fillStyle = '#C9A65C'; c.fill(); c.stroke(); emblem(c, 'shield', Xs, Ys - T2 * 0.2, T2 * 0.12, '#1E5E48', { ink: false }); c.restore();
      if (gone) return; const fy = Ys - T2 * (1.7 + 0.08 * Math.sin(t * 1.6)), sh = T.hitFx > 0 ? (Math.random() - 0.5) * T2 * 0.12 : 0;
      crystalArt(c, 'W', Xs + sh, fy, T2 * 1.25, t, { k: T.state === 'idle' ? 0.6 : 1, crack: T.state === 'won' ? 0 : T.crack });
      crystalLight(K.LL, 'W', Xs, fy, T2 * 1.25, (T.state === 'won' ? 1 : 0.5 + 0.5 * T.integ / TUNE.INTEG) * (can ? 1.2 : 1), t);
      if (can) K.LL.q(Q => Q.ring(Xs, Ys - T2 * 0.3, T2 * (1.1 + 0.3 * Math.sin(t * 3)), BR.W.col, 0.5, T2 * 0.12, 0.4)); };
    return T;
  }

  /* ======================= NORTH · THE HUNDREDFOLD ROLL =======================
     A round cistern, smooth slate, shallow water round its edge, three broad brass rings for orientation; pillars stand
     outside the floor; an archway at the far side holds the Spiral Crystal's blue-white spiral cage on its plinth (v398 B2). One hundred bell
     rollers, well spaced. The pet may only move and roll (g.trialLock). A roller uncurls and pursues to a stand-off ring,
     then, when the director pairs it with another from a different side, spins in place for 2.5 s showing its committed
     line, curls and rolls fast along it, never turning. The pair's spins are timed so both reach the pet's spot together:
     step or roll away as they launch and they meet. A rolling roller that strikes any living roller destroys both, at
     once; one that strikes the pet hurts it and rolls on; one that strikes the wall is stunned and pursues again. About
     ten committed at a time; an escape gap of at least 100 degrees is always left; the last pair is matched with no
     other conditions, so it always meets. Pooled actors, a spatial grid, one cached sprite set */
  /* v392 B2: the north's two corrupted Cocopets (v398 B2: at the module's top, so the stage's loading pass can warm them too) */
  const NDUEL = [
    { name: 'Mirelune the Sunken Tide', short: 'Mirelune', el: 'water', seed: 523, at: { x: GEO.N.x - 4.5, y: 11.5 }, delay: 0.6, sub: 'A Cocopet the drowned sea has taken rises from the cistern',
      palette: { tint: '#0F3A50', tintK: 0.82, pal: { sec: '#61D9D2', cheek: '#0C2C3E' }, col: '#61D9D2', glow: '#A8FFF6', core: '#E8FFFC' } },
    { name: 'Gloamrill the Abyss-Eyed', short: 'Gloamrill', el: 'dark', seed: 911, at: { x: GEO.N.x + 4.5, y: 11.5 }, delay: 3.4, sub: 'And from the arch behind it, one the abyss has soured',
      palette: { tint: '#160E2A', tintK: 0.86, pal: { sec: '#9B7CFF', cheek: '#1C1234' }, col: '#9B7CFF', glow: '#CDBBFF', core: '#F4EEFF' } }];
  const NDUEL_TUNE = { lvl: 10, hpK: 0.7, dmgK: 0.75 };   // v392 B2: 0.6 -> 0.7 once they flank (they no longer stack under one area hit)   // (as a pair for level 10: about 60-80 s with attacks and skills)
  function trialNorth(X, H, S, K) {
    const C = GEO.N, me = X.me, g = X.g, RR = 0.42, RA = C.r - 0.75, SPIN = 2.5, VROLL = 8.5, VPUR = 1.55, CAP = 10, N0 = 100;
    const CR = { x: C.x, y: 4.6 };
    const T = { B: 'N', state: 'idle', rol: [], left: N0, locked: false, prevDK: undefined, dirT: 0, first: true, crystalAt: CR, crystalH: 2.6, ringK: 0, bursts: [], pairs: 0, hits: 0, walls: 0, maxCommit: 0, cost: 0, n: 0, cage: 1, form: 0 };   // v398 B2: cage, form (the crystal gathering in it, 0..1)
    // their places: one hundred, at least ~2 tiles apart, none at the way in or by the arch (deterministic)
    const HOME = (() => { for (let minD = 2.2; minD > 1.2; minD -= 0.15) { const rnd = R1(9137), out = []; for (let k = 0; k < 30000 && out.length < N0; k++) { const a = rnd() * TAU, r = Math.sqrt(lerp(9, (RA - 0.7) ** 2, rnd())), x = C.x + Math.cos(a) * r, y = C.y + Math.sin(a) * r;
          if (hyp(x - C.x, y - (C.y + C.r - 1)) < 5) continue; if (hyp(x - CR.x, y - CR.y) < 4) continue; let ok = true; for (const p of out) if (hyp(p.x - x, p.y - y) < minD) { ok = false; break; } if (ok) out.push({ x, y }); }
        if (out.length >= N0) return out; } return []; })();
    // the grid: cells of 2 tiles over the cistern's square
    const GC = 2, GX0 = C.x - C.r - 1, GY0 = C.y - C.r - 1, GN = Math.ceil((C.r * 2 + 2) / GC) + 1, head = new Int16Array(GN * GN), next = new Int16Array(N0);
    function buildGrid() { head.fill(-1); for (let i = 0; i < T.rol.length; i++) { const r = T.rol[i]; if (!r.alive) continue; const gx = clamp(Math.floor((r.x - GX0) / GC), 0, GN - 1), gy = clamp(Math.floor((r.y - GY0) / GC), 0, GN - 1), k = gy * GN + gx; next[i] = head[k]; head[k] = i; } }
    function near(r, fn) { const gx = clamp(Math.floor((r.x - GX0) / GC), 0, GN - 1), gy = clamp(Math.floor((r.y - GY0) / GC), 0, GN - 1);
      for (let y = Math.max(0, gy - 1); y <= Math.min(GN - 1, gy + 1); y++) for (let x = Math.max(0, gx - 1); x <= Math.min(GN - 1, gx + 1); x++) for (let i = head[y * GN + x]; i >= 0; i = next[i]) { const o = T.rol[i]; if (o !== r && o.alive && fn(o) === true) return o; } return null; }
    function lock() { if (T.locked) return; T.locked = true; T.prevDK = g.dodgeK; g.trialLock = true; g.rollOnly = true; g.dodgeK = 0.55 / 0.85; }
    function unlock() { if (!T.locked) return; T.locked = false; g.trialLock = false; g.rollOnly = false; if (T.prevDK === undefined) delete g.dodgeK; else g.dodgeK = T.prevDK; }
    T.lock = lock; T.unlock = unlock;
    T.reset = () => { unlock(); T.rol = HOME.map((p, i) => ({ i, x: p.x, y: p.y, s: 'idle', t: 0, alive: true, dx: 0, dy: 0, spinT: 0, P: null, mate: null, hit: false, f: (i * 3) % 8, side: i % 2 ? 1 : -1, want: 5.6 + (i % 5) * 0.55, trav: 0 }));
      T.left = T.rol.length; T.state = 'idle'; T.first = true; T.bursts.length = 0; T.ringK = 0; T.pairs = 0; T.hits = 0; T.walls = 0; T.maxCommit = 0; T.cage = 1; T.form = 0; duelClear(); };
    T.restoreWon = () => { T.state = 'won'; T.left = 0; for (const r of T.rol) r.alive = false; T.ringK = 1; T.cage = 0; T.form = 1; };
    T.onCue = () => { lock(); X.banner('THE HUNDREDFOLD ROLL', 'Movement and dodge roll only. Bait the rollers into each other.', BR.N.hi, 3.6, true, true); };
    T.start = () => { T.state = 'run'; lock(); for (const r of T.rol) if (r.alive) { r.s = 'pursue'; r.t = Math.random() * 0.5; } };
    const angDiff = (a, b) => { let d = Math.abs(a - b) % TAU; return d > Math.PI ? TAU - d : d; };
    function escapeOK(angs) { if (angs.length < 2) return true; const s = angs.map(a => (a + TAU) % TAU).sort((a, b) => a - b); let gap = TAU - s[s.length - 1] + s[0]; for (let i = 1; i < s.length; i++) gap = Math.max(gap, s[i] - s[i - 1]); return gap >= 1.75; }
    function clearRun(r, px, py, mate) { const d = hyp(px - r.x, py - r.y) || 1, ux = (px - r.x) / d, uy = (py - r.y) / d, L = Math.min(2.3, d);
      for (const o of T.rol) { if (!o.alive || o === r || o === mate) continue; const ox = o.x - r.x, oy = o.y - r.y, along = ox * ux + oy * uy; if (along < 0 || along > L) continue; if (Math.abs(ox * uy - oy * ux) < 0.95) return false; } return true; }
    function commit(A, B, px, py) { const dA = hyp(px - A.x, py - A.y) || 1, dB = hyp(px - B.x, py - B.y) || 1, far = Math.max(dA, dB);
      for (const [r, d, o] of [[A, dA, B], [B, dB, A]]) { r.s = 'spin'; r.t = 0; r.P = { x: px, y: py }; r.dx = (px - r.x) / d; r.dy = (py - r.y) / d; r.spinT = SPIN + (far - d) / VROLL; r.mate = o; r.hit = false; r.trav = 0; r.end = rayEnd(r); }
      T.pairs++; if (T.first) { T.first = false; X.banner('WATCH THE LINES', 'Two rollers lock onto where you stand: roll away as they launch and they meet', BR.N.hi, 3.2, true, true); } }
    // where a committed line meets the cistern's wall
    function rayEnd(r) { const ox = r.x - C.x, oy = r.y - C.y, b = ox * r.dx + oy * r.dy, cc = ox * ox + oy * oy - RA * RA, t2 = -b + Math.sqrt(Math.max(0, b * b - cc)); return { x: r.x + r.dx * t2, y: r.y + r.dy * t2 }; }
    function director() { const live = []; let committed = 0; const angs = []; const px = me.x, py = me.y;
      for (const r of T.rol) if (r.alive) { live.push(r); if (r.s === 'spin' || r.s === 'roll') { committed++; angs.push(Math.atan2(r.y - py, r.x - px)); } }
      T.maxCommit = Math.max(T.maxCommit, committed);
      const cap = Math.min(CAP, live.length); if (committed + 2 > cap || me.dead) return; if (hyp(px - C.x, py - C.y) > C.r - 0.4) return;   // (the pet must be in the cistern)
      const last = live.length <= 4, dd = r => hyp(r.x - px, r.y - py), an = r => Math.atan2(r.y - py, r.x - px);
      const cand = live.filter(r => r.s === 'pursue' && (last ? dd(r) > 1.6 : dd(r) > 3.4 && dd(r) < 9.8)); if (cand.length < 2) return;
      for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const q = cand[i]; cand[i] = cand[j]; cand[j] = q; }
      for (let i = 0; i < Math.min(cand.length, 10); i++) { const A = cand[i], aA = an(A), dA = dd(A); let best = null, bs = -1e9;
        for (const B of cand) { if (B === A) continue; const aB = an(B), dB = dd(B), diff = angDiff(aA, aB); if (!last && (diff < 1.15 || Math.abs(dA - dB) > 3.2)) continue;
          if (!last && !escapeOK(angs.concat([aA, aB]))) continue; if (!last && (!clearRun(A, px, py, B) || !clearRun(B, px, py, A))) continue;
          const sc = diff - Math.abs(dA - dB) * 0.25; if (sc > bs) { bs = sc; best = B; } }
        if (best) { commit(A, best, px, py); return; } } }
    function destroy(a, b) { if (!a.alive || !b.alive || a === b) return false; a.alive = false; b.alive = false; T.left = Math.max(0, T.left - 2);   // (atomic: both at once, never one in two pairs)
      const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2; T.bursts.push({ x, y, t: 0 });
      if (typeof BREAK_FX !== 'undefined') try { for (const r of [a, b]) BREAK_FX.burst(X, r.x, r.y + 0.35, { paint: rollerPaint, key: 'belroller', w: 0.9, h: 0.95, mat: 'stone', size: 0.8, cols: ['#1E2A55', '#0A1230', '#D2AE5E'], quiet: true, shake: 0.4, rubble: false, from: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }); } catch (e) {}
      X.sparks(x, y - 0.3, '#9FE8FF', 10, 6); X.ring(x, y, 0.2, 1.5, 0.35, '#9FE8FF', 0.3); if (X.sfx.crack) X.sfx.crack(); if (X.sfx.note && Math.random() < 0.6) X.sfx.note(660 + Math.random() * 220, 0.18, 'triangle', 0.12);
      if (T.left === N0 - 2) X.banner('THEY BREAK EACH OTHER', `Enemies remaining: ${T.left}. Bait the next pair`, BR.N.hi, 2.6, true); return true; }
    function pursue(r, dt) { const dx = me.x - r.x, dy = me.y - r.y, d = hyp(dx, dy) || 1; let vx = 0, vy = 0;
      if (d > r.want + 0.6) { vx += dx / d * VPUR; vy += dy / d * VPUR; } else if (d < r.want - 1.4) { const k = d < 3.2 ? 2.3 : 0.9; vx -= dx / d * k; vy -= dy / d * k; }
      vx += -dy / d * 0.45 * r.side; vy += dx / d * 0.45 * r.side;
      near(r, o => { const ex = r.x - o.x, ey = r.y - o.y, e = hyp(ex, ey); if (e < 1.35 && e > 1e-4) { const k = (1.35 - e) / 1.35 * 2.4; vx += ex / e * k; vy += ey / e * k; } });
      const sp = hyp(vx, vy), mx = 2.4; if (sp > mx) { vx *= mx / sp; vy *= mx / sp; } r.x += vx * dt; r.y += vy * dt; r.f = (r.f + dt * 4) % 2; r.face = dx >= 0 ? 1 : -1;
      const cr = hyp(r.x - C.x, r.y - C.y); if (cr > RA - 0.3) { r.x = C.x + (r.x - C.x) / cr * (RA - 0.3); r.y = C.y + (r.y - C.y) / cr * (RA - 0.3); } }
    function roll(r, dt) { let move = VROLL * dt;
      while (move > 1e-6) { const s = Math.min(0.2, move); move -= s; r.x += r.dx * s; r.y += r.dy * s; r.trav += s; r.f = (r.f + s * 5) % 8;
        const cr = hyp(r.x - C.x, r.y - C.y); if (cr > RA) { r.x = C.x + (r.x - C.x) / cr * (RA - 0.1); r.y = C.y + (r.y - C.y) / cr * (RA - 0.1); r.s = 'stun'; r.t = 0; T.walls++; X.sparks(r.x, r.y - 0.3, '#D2AE5E', 6, 4); if (X.sfx.thud) X.sfx.thud(); return; }
        if (!r.hit && !me.dead && hyp(r.x - me.x, r.y - me.y) < RR + (me.r || 0.35)) { r.hit = true; const ok = X.hurtPet(X.ST().hp * TUNE.ROLL_DMG, null); if (ok) { T.hits++; X.push(Math.atan2(me.y - r.y, me.x - r.x), 0.9); } }
        const o = near(r, q => hyp(q.x - r.x, q.y - r.y) < RR * 2); if (o) { destroy(r, o); return; } } }
    /* ---- v392 B2: THE DUEL. When the hundred are gone the lock lifts and two corrupted Cocopets (EVIL_MINI, 20zz9: GPU via
       PetGL at twice a pet's size) come out of the dark arch, the second a few seconds after the first: a drowned-sea one
       (water) and an abyss one (dark). They are fought normally; only when both fall does the Spiral Crystal appear. A
       knockout resets the whole branch (the hall's koHook: the trial is still 'run'); every exit clears them ---- */
    const DUEL = NDUEL, DUEL_TUNE = NDUEL_TUNE;
    T.DUEL = DUEL; T.DUEL_TUNE = DUEL_TUNE;
    function duelLayer() { const amb = X.rift && X.rift.self && X.rift.self.amb, C2 = amb && amb.C; const E = typeof EVIL_MINI !== 'undefined' ? EVIL_MINI : null; if (!E) return null;
      if (C2) { if (!C2.layer && E.layer) C2.layer = E.layer(X); return null; }   // (the rift's every-stage layer runs it)
      if (!T.ownLayer && E.layer) T.ownLayer = E.layer(X); return T.ownLayer; }
    function duelStart() { unlock(); T.duel = { t: 0, ms: [null, null], gen: (T.gen = (T.gen || 0) + 1), fallen: 0 }; T.ringK = 0;
      X.flash(0.4, '#FFFFFF'); X.banner('ENEMIES REMAINING: 0', 'Your skills return. Something stirs in the dark arch…', BR.N.col, 3, true, true); if (X.sfx.hum) X.sfx.hum(); duelLayer(); }
    function duelSpawn(i) { const d = DUEL[i], E = typeof EVIL_MINI !== 'undefined' ? EVIL_MINI : null, D = T.duel, gen = D.gen; if (!E) { D.ms[i] = { dead: true }; return; }
      let m = null; try { m = E.spawn(X, { x: d.at.x, y: d.at.y, home: { x: C.x, y: C.y - 4 }, name: d.name, short: d.short, el: d.el, seed: d.seed, palette: d.palette, sub: d.sub, lvl: DUEL_TUNE.lvl, hpK: DUEL_TUNE.hpK, dmgK: DUEL_TUNE.dmgK, wakeR: 60, leash: 60,
        onFall: () => { if (T.duel && T.duel.gen === gen) T.duel.fallen++; } }); } catch (e) { m = null; }
      if (!m) { D.ms[i] = { dead: true }; return; } m.belDuel = gen; D.ms[i] = m; X.boom(d.at.x, d.at.y, 1.8, d.palette.col, '#FFFFFF', { n: 22, shake: 6 }); X.ring(d.at.x, d.at.y, 0.3, 3.5, 0.6, d.palette.col, 0.35); }
    function duelTick(dt) { const D = T.duel; D.t += dt; if (T.locked) unlock();
      for (let i = 0; i < DUEL.length; i++) if (!D.ms[i] && D.t >= DUEL[i].delay) duelSpawn(i);
      if (T.ownLayer) T.ownLayer.update(dt);
      duelSpace(D, dt);
      /* v398 B2: both fallen: the Spiral Crystal gathers inside the spiral cage, then the cage shatters (BREAK_FX, as the east's) and only then is it won */
      if (D.ms.every(q => q && q.dead)) { D.downT = (D.downT || 0) + dt;
        if (D.downT > 1.6 && !T.form) { T.form = 0.001; X.banner('THE SPIRAL CRYSTAL FORMS', `${DUEL.map(d => d.short).join(' and ')} have fallen: light gathers in the spiral cage`, BR.N.col, 2.4, true, true); X.ring(CR.x, CR.y, 0.3, 3, 0.6, BR.N.col, 0.4); if (X.sfx.hum) X.sfx.hum(); }
        if (T.form > 0) T.form = Math.min(1, T.form + dt / 1.1);
        if (D.downT > 3.0 && T.state !== 'won') breakCageN(); } }
    function breakCageN() { T.cage = 0; T.form = 1; T.state = 'won'; T.ringK = 1;
      if (typeof BREAK_FX !== 'undefined') try { BREAK_FX.burst(X, CR.x, CR.y + 0.5, { paint: (BPZ() && BPZ().painter([['ncage', 'b'], ['ncage', 'f']])) || cagePaintN, key: BPZ() ? 'belncage' : 'belncage0', w: 2.6, h: 3.4, mat: 'glass', size: 2.6, cols: ['#DDF4FF', '#3E86C8', '#FFFFFF'], hot: '#AEE2FF', rubble: false }); } catch (e) {}
      X.ring(CR.x, CR.y, 0.3, 4, 0.6, BR.N.col, 0.4); X.flash(0.25, '#E8F6FF'); X.banner('THE SPIRAL CAGE SHATTERS', 'The Spiral Crystal is free: collect it', BR.N.col, 2.8, true, true); }
    // (the cage's shape, shared by the 2D picture and BREAK_FX's shards where the repainted props are off: ten bars twisting into a dome)
    const NC = { n: 10, rx: 1.0, ry: 0.36, hh: 2.45, dome: 0.62, tw: 1.1 };
    const ncPt = (i, k) => { const a = i / NC.n * TAU + 0.15 + NC.tw * k, z = k < 0.8 ? NC.hh * k / 0.8 : NC.hh + NC.dome * Math.sin((k - 0.8) / 0.2 * Math.PI / 2), r = k < 0.8 ? NC.rx : NC.rx * Math.cos((k - 0.8) / 0.2 * Math.PI / 2); return [Math.cos(a) * r, Math.sin(a) * r * NC.ry / NC.rx - z, Math.sin(a)]; };
    function cagePaintN(c, Pp, back) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      for (let i = 0; i < NC.n; i++) { c.strokeStyle = i % 2 ? '#DDF4FF' : '#9FD0FF'; c.lineWidth = Pp * 0.1; c.beginPath(); for (let j = 0; j <= 20; j++) { const p = ncPt(i, j / 20); j ? c.lineTo(p[0] * Pp, p[1] * Pp) : c.moveTo(p[0] * Pp, p[1] * Pp); } c.stroke(); }
      c.strokeStyle = '#EAF7FF'; c.lineWidth = Pp * 0.12; for (const z of [0, NC.hh]) { c.beginPath(); c.ellipse(0, -z * Pp, NC.rx * Pp, NC.ry * Pp, 0, 0, TAU); c.stroke(); } c.restore(); }
    /* v392 B2: the pair never fuse into one: a soft push apart to at least the sum of their radii (plus a margin), and they
       work the pet from opposite sides. Every 6 s the roles swap: the presser fights as its module drives it; the flanker,
       while it is only moving, circles to the far side of the pet and holds at range (its own walk is overruled by a
       stronger pull to that point), and it holds its next attack while the presser's is in the air, so they alternate and
       their shots come from different angles. Steering only (moveEnt, m.cd): the mini-boss module itself is untouched */
    function duelSpace(D, dt) { const ms = D.ms.filter(q => q && q.x && !q.dead && !q.under); if (!ms.length) return;
      D.roleT = (D.roleT || 0) + dt; if (D.roleT > 6) { D.roleT = 0; D.swap = !D.swap; }
      if (ms.length === 2) { const [a, b] = ms, dx = b.x - a.x, dy = b.y - a.y, d = hyp(dx, dy) || 0.01, need = a.r + b.r + 0.6;
        if (d < need) { const push = Math.min(need - d, 6 * dt) / 2, ux = d > 0.02 ? dx / d : 1, uy = d > 0.02 ? dy / d : 0; X.moveEnt(a, -ux * push, -uy * push); X.moveEnt(b, ux * push, uy * push); }
        const P2 = D.swap ? b : a, Fl = D.swap ? a : b; D.presser = P2; D.flanker = Fl;
        if (Fl.aggro && Fl.act === 'move' && !me.dead) { const pa = Math.atan2(P2.y - me.y, P2.x - me.x), ta = pa + Math.PI, R0 = 4.6, tx = me.x + Math.cos(ta) * R0, ty = me.y + Math.sin(ta) * R0, ex = tx - Fl.x, ey = ty - Fl.y, e = hyp(ex, ey);
          if (e > 0.3) { const fa = Math.atan2(Fl.y - me.y, Fl.x - me.x), side = angN(ta - fa) > 0 ? 1 : -1, v = Math.min(e, 4.2 * dt), ox = ex / e * 0.75 + -Math.sin(fa) * side * 0.6, oy = ey / e * 0.75 + Math.cos(fa) * side * 0.6, ol = hyp(ox, oy) || 1; X.moveEnt(Fl, ox / ol * v, oy / ol * v); }   // (round the pet, not through it)
          Fl.face = me.x >= Fl.x ? 1 : -1;
          if (P2.act !== 'move' && Fl.cd < 0.5) Fl.cd = 0.5; } } }
    const angN = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
    // (every exit: the pair are taken off the field and out of the mini-boss layer's records, without a fall)
    function duelClear() { const D = T.duel; T.duel = null; if (!D) return; const E = typeof EVIL_MINI !== 'undefined' ? EVIL_MINI : null, G = E && E.guards ? E.guards(X) : null;
      for (const m of D.ms) { if (!m || !m.x) continue; if (G) for (let i = G.length - 1; i >= 0; i--) if (G[i].m === m) G.splice(i, 1); const k = X.mons.indexOf(m); if (k >= 0) X.mons.splice(k, 1); m.dead = true; m.hp = 0; } }
    function duelHud(c, W2) { const y = 100, w = Math.min(260, W2 - 30), D = T.duel; panel(c, W2 / 2, y, w, 66, BR.N.col); label(c, `Defeat ${DUEL[0].short} and ${DUEL[1].short}`, W2 / 2, y + 16, 15, '#FFFFFF', { w: 900, lw: 4 });
      DUEL.forEach((d, i) => { const m = D.ms[i], yy = y + 30 + i * 17, k = !m ? 1 : m.dead ? 0 : clamp(m.hp / m.maxhp, 0, 1); label(c, d.short + (!m ? ' · coming' : m.dead ? ' · down' : ''), W2 / 2 - w / 2 + 14, yy + 3, 9.5, d.palette.glow, { align: 'left', w: 800 }); bar(c, W2 / 2 - w / 2 + 92, yy, w - 106, 6, k, d.palette.col, d.palette.glow); }); }
    T.update = dt => { const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
      if (T.duel) { duelTick(dt); return; }   // v392 B2
      buildGrid(); T.dirT -= dt; if (T.dirT <= 0) { T.dirT = 0.2; director(); }
      for (const r of T.rol) { if (!r.alive) continue; r.t += dt;
        if (r.s === 'pursue') pursue(r, dt);
        else if (r.s === 'spin') { r.f = (r.f + dt * 20) % 8; if (r.t >= r.spinT) { r.s = 'roll'; r.t = 0; r.hit = false; } }
        else if (r.s === 'roll') roll(r, dt);
        else if (r.s === 'stun') { if (r.t > 1.1) { r.s = 'pursue'; r.t = 0; } } }
      for (let i = T.bursts.length - 1; i >= 0; i--) { T.bursts[i].t += dt; if (T.bursts[i].t > 0.6) T.bursts.splice(i, 1); }
      if (T.left <= 0 && !T.duel) duelStart();   // v392 B2: the hundred are gone: skills return and two corrupted Cocopets come
      if (t0) { T.cost = T.cost * 0.95 + (performance.now() - t0) * 0.05; T.n++; } };
    T.tickWon = dt => { if (T.ringK > 0 && T.ringK < 1) T.ringK = Math.min(1, T.ringK + dt / 1.2); };
    T.goal = () => T.duel ? `Defeat ${DUEL.map(d => d.short).join(' and ')}` : `Enemies remaining: ${T.left} · movement and dodge roll only`;
    T.hint = () => { if (!T.duel) return null; let b = null, bd = 9; for (const q of T.duel.ms) if (q && !q.dead) { const d = hyp(q.x - me.x, q.y - me.y); if (d > bd) { bd = d; b = q; } } return b && !T.duel.ms.some(q => q && !q.dead && hyp(q.x - me.x, q.y - me.y) < 9) ? { x: b.x, y: b.y, h: 2.6, label: (b.bname || '').toUpperCase() } : null; };
    T.cam = () => T.duel ? { x: me.x, y: me.y, k: 0, zoom: 0.84 } : { x: me.x, y: me.y, k: 0, zoom: 0.72 };
    T.hud = (c, W2, Hh) => { if (T.duel) { duelHud(c, W2); return; } const y = 100, w = Math.min(240, W2 - 30); panel(c, W2 / 2, y, w, 50, BR.N.col); label(c, `Enemies remaining: ${T.left}`, W2 / 2, y + 18, 18, '#FFFFFF', { w: 900, lw: 4 });
      label(c, 'MOVEMENT AND DODGE ROLL ONLY', W2 / 2, y + 38, 10, BR.N.hi, { w: 900 }); };
    T.ground = (c, L, active) => { if (T.ownLayer) T.ownLayer.drawGround(c);   /* v392 B2: the duel's mini-boss layer when the rift has none */ if (!onScreen(X, C.x, C.y, C.r + 2)) return; const T2 = X.Tz(), t = X.g.t, cx = X.sx(C.x), cy = X.sy(C.y);
      c.save();
      // smooth slate, the shallow water round its edge, three broad brass rings
      const fg = c.createRadialGradient(cx - T2 * 3, cy - T2 * 4, T2 * 2, cx, cy, C.r * T2); fg.addColorStop(0, '#3E505C'); fg.addColorStop(0.7, P.SLATE); fg.addColorStop(1, '#1E2A32'); c.fillStyle = fg; c.beginPath(); c.arc(cx, cy, (C.r - 0.2) * T2, 0, TAU); c.fill();
      c.beginPath(); c.arc(cx, cy, (C.r - 0.2) * T2, 0, TAU); c.arc(cx, cy, (C.r - 1.5) * T2, 0, TAU, true); c.fillStyle = 'rgba(40,110,135,.55)'; c.fill('evenodd'); c.strokeStyle = 'rgba(200,245,250,.35)'; c.lineWidth = Math.max(1, T2 * 0.04); c.beginPath(); c.arc(cx, cy, (C.r - 1.5) * T2, 0, TAU); c.stroke();
      for (const r of [5, 9.5, 13.4]) { c.strokeStyle = 'rgba(30,22,10,.55)'; c.lineWidth = T2 * 0.3; c.beginPath(); c.arc(cx, cy, r * T2, 0, TAU); c.stroke(); c.strokeStyle = P.BRASS; c.lineWidth = T2 * 0.2; c.stroke(); c.strokeStyle = 'rgba(255,235,180,.35)'; c.lineWidth = T2 * 0.05; c.stroke(); }
      L.q(Q => Q.caustic(cx, cy, (C.r - 0.3) * T2, '#7FE0F0', lowFx() ? 0.06 : 0.1, 5.3, 1));
      // the committed lines: each spinning roller shows where it will go, a countdown ring round it
      if (T.state === 'run') for (const r of T.rol) { if (!r.alive || r.s !== 'spin') continue; const u = clamp(r.t / r.spinT, 0, 1), a = 0.55 + 0.45 * u, x0 = X.sx(r.x), y0 = X.sy(r.y), x1 = X.sx(r.end.x), y1 = X.sy(r.end.y);
        c.lineCap = 'round'; c.strokeStyle = 'rgba(4,10,20,.55)'; c.lineWidth = T2 * 0.26; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = rgba(u > 0.8 ? '#FFFFFF' : '#9FE8FF', a); c.lineWidth = T2 * 0.12; c.setLineDash([T2 * 0.4, T2 * 0.25]); c.lineDashOffset = -t * T2 * 2; c.stroke(); c.setLineDash([]);
        const ang = Math.atan2(r.dy, r.dx); c.save(); c.translate(x1, y1); c.rotate(ang); c.fillStyle = rgba('#DFFFFF', a); c.beginPath(); c.moveTo(T2 * 0.1, 0); c.lineTo(-T2 * 0.45, -T2 * 0.3); c.lineTo(-T2 * 0.45, T2 * 0.3); c.closePath(); c.fill(); c.restore();
        c.strokeStyle = 'rgba(4,10,20,.6)'; c.lineWidth = T2 * 0.12; c.beginPath(); c.arc(x0, y0, T2 * 0.62, 0, TAU); c.stroke(); c.strokeStyle = u > 0.8 ? '#FFFFFF' : '#9FE8FF'; c.lineWidth = T2 * 0.07; c.beginPath(); c.arc(x0, y0, T2 * 0.62, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke();
        L.q(Q => { Q.beam(x0, y0, x1, y1, T2 * 0.32, '#7FD8FF', 0.28 * a); Q.glow(x0, y0, T2 * 0.9, '#9FE8FF', 0.3 * a); }); }
      c.restore(); };
    /* the rollers: drawn in two batches, those behind the pet and those in front of it */
    function drawRollers(c, front) { if (T.state === 'won' || !onScreen(X, C.x, C.y, C.r + 2)) return; const T2 = X.Tz(), m = c.getTransform ? c.getTransform() : null, dpr = Math.min(2.5, m ? Math.max(1, Math.hypot(m.a, m.b)) : 1), SP = rollerSprites(T2, dpr), s = SP.px / dpr, W2 = X.W(), Hh = X.H(), t = X.g.t;
      for (const r of T.rol) { if (!r.alive || (r.y >= me.y) !== front) continue; const Xs = X.sx(r.x), Ys = X.sy(r.y); if (Xs < -T2 || Xs > W2 + T2 || Ys < -T2 * 2 || Ys > Hh + T2) continue;
        c.drawImage(SP.shadow, Xs - T2 * 0.42, Ys - T2 * 0.12, T2 * 0.84, T2 * 0.28);
        if (r.s === 'pursue' || r.s === 'idle' && false) { const img = SP.walk[Math.floor(r.f) % 2]; c.save(); c.translate(Xs, Ys - s * 0.5); if (r.face < 0) c.scale(-1, 1); c.drawImage(img, -s / 2, -s / 2, s, s); c.restore(); }
        else { const img = SP.ball[Math.floor(r.f) % 8], lift = r.s === 'roll' ? 0 : r.s === 'spin' ? Math.abs(Math.sin(r.t * 18)) * T2 * 0.04 : 0; if (r.s === 'roll') { c.save(); c.globalAlpha = 0.35; c.drawImage(img, Xs - r.dx * T2 * 0.45 - s / 2, Ys - r.dy * T2 * 0.45 - s * 0.55, s, s); c.restore(); } c.drawImage(img, Xs - s / 2, Ys - s * 0.55 - lift, s, s);
          if (r.s === 'stun') for (let i = 0; i < 3; i++) { const aa = t * 5 + i * 2.09; c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(Xs + Math.cos(aa) * T2 * 0.35, Ys - T2 * 0.95 + Math.sin(aa) * T2 * 0.1, Math.max(1.5, T2 * 0.05), 0, TAU); c.fill(); } } } }
    const oA = H.obj({ x: 0, y: 0, kind: 'belrollA', r: 0, label: '', draw(c) { drawRollers(c, false); } }), oB = H.obj({ x: 0, y: 0, kind: 'belrollB', r: 0, label: '', draw(c) { drawRollers(c, true); } });
    T.frame = () => { oA.dy = me.y - 0.001; oB.dy = me.y + 0.02; };   // (sorted just behind and just in front of the pet)
    T.late = (c, L) => { if (!T.bursts.length) return; const T2 = X.Tz(); for (const b of T.bursts) { const u = b.t / 0.6, Xs = X.sx(b.x), Ys = X.sy(b.y) - T2 * 0.35; L.q(Q => { Q.glow(Xs, Ys, T2 * (1 + 1.6 * u), '#7FD8FF', 0.75 * (1 - u)); Q.star(Xs, Ys, T2 * (0.9 + 0.6 * u), 0.9 * (1 - u), '#E8FCFF'); Q.ring(Xs, Ys, T2 * (0.4 + 2 * u), '#BFEFFF', 0.6 * (1 - u), T2 * 0.12); }, c2 => glow(c2, Xs, Ys, T2 * (1 + 1.4 * u), '#7FD8FF', 0.7 * (1 - u))); } };
    T.drawCrystal = (c, Xs, Ys, T2, can) => { const t = X.g.t, gone = K.has(K.PS().carry, 'N') || K.has(K.PS().dep, 'N'), BPc = BPZ();
      // v398 B2 (the user: "make the crystal appear in a cage instead, like the east gate"): the archway behind, repainted in 2.5D (20n9 'narch'); else the old 2D arch
      const aw = T2 * 2.2, ah = T2 * 3.4, ay = Ys + T2 * 0.6; c.save(); if (BPc && BPc.draw(c, 'narch', 0, Xs, Ys, T2)) c.globalAlpha = 0; const ag = c.createLinearGradient(0, ay - ah, 0, ay); ag.addColorStop(0, '#081620'); ag.addColorStop(1, '#1C3E4C'); c.fillStyle = ag; c.beginPath(); c.moveTo(Xs - aw, ay); c.lineTo(Xs - aw, ay - ah * 0.62); c.quadraticCurveTo(Xs - aw, ay - ah, Xs, ay - ah * 1.05); c.quadraticCurveTo(Xs + aw, ay - ah, Xs + aw, ay - ah * 0.62); c.lineTo(Xs + aw, ay); c.closePath(); c.fill();
      c.strokeStyle = P.LIME_D; c.lineWidth = T2 * 0.42; c.stroke(); c.strokeStyle = P.LIME; c.lineWidth = T2 * 0.26; c.stroke(); c.restore();
      K.LL.q(Q => Q.glow(Xs, Ys - T2 * 1.2, T2 * 2.4, BR.N.col, T.cage > 0 ? 0.16 : 0.1, 1.1));
      if (gone) return;
      // the cage's back half, the plinth, the crystal gathering inside, the front half (as the east's coral cage)
      const cg = T.cage > 0 && !!(BPc && BPc.draw(c, 'ncage', 'b', Xs, Ys, T2));
      c.save(); if (!(BPc && BPc.draw(c, 'nplinth', 0, Xs, Ys, T2))) { c.fillStyle = '#C9D3D6'; c.fillRect(Xs - T2 * 0.5, Ys - T2 * 0.45, T2, T2 * 0.45); c.fillStyle = '#2E5E9C'; c.fillRect(Xs - T2 * 0.5, Ys - T2 * 0.3, T2, T2 * 0.1); c.strokeStyle = '#6E7A80'; c.lineWidth = 1.5; c.strokeRect(Xs - T2 * 0.5, Ys - T2 * 0.45, T2, T2 * 0.45); ell(c, Xs, Ys - T2 * 0.45, T2 * 0.5, T2 * 0.16); c.fillStyle = '#E6ECEE'; c.fill(); c.stroke(); } c.restore();
      const fk = T.state === 'won' ? 1 : T.form || 0, cy = Ys - T2 * 1.3 + Math.sin(t * 1.5) * T2 * 0.06;
      if (fk > 0) { c.save(); c.globalAlpha *= Math.min(1, fk * 1.4); crystalArt(c, 'N', Xs, cy, T2 * 0.95 * (0.55 + 0.45 * ease(fk)), t, { k: fk }); c.restore(); crystalLight(K.LL, 'N', Xs, cy, T2 * 0.95, (can ? 1.1 : 0.7) * fk, t);
        if (fk < 1) K.LL.q(Q => { Q.star(Xs, cy, T2 * (0.5 + 1.4 * (1 - fk)), 0.85 * Math.sin(fk * Math.PI), '#F2FBFF'); Q.glow(Xs, cy, T2 * 1.6, BR.N.col, 0.5 * (1 - fk)); }, c2 => glow(c2, Xs, cy, T2 * 1.4, BR.N.col, 0.45 * (1 - fk))); }
      else K.LL.q(Q => { Q.evortex(Xs, cy, T2 * 0.62, BR.N.col, 0.55, 0.32, 3.1, 1.2); Q.glow(Xs, cy, T2 * 0.8, '#F2FBFF', 0.12 + 0.06 * Math.sin(t * 2.2)); }, c2 => glow(c2, Xs, cy, T2 * 0.8, BR.N.col, 0.2));   // (empty: a slow swirl of light waits in it)
      if (T.cage > 0) { const hh = T2 * NC.hh; if (cg) BPc.draw(c, 'ncage', 'f', Xs, Ys, T2); else { c.save(); c.translate(Xs, Ys); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.75; cagePaintN(c, T2); c.restore(); }
        K.LL.q(Q => { for (let i = 0; i < NC.n; i++) { const p0 = ncPt(i, 0.15), p1 = ncPt(i, 0.7); Q.beam(Xs + p0[0] * T2, Ys + p0[1] * T2, Xs + p1[0] * T2, Ys + p1[1] * T2, T2 * 0.16, BR.N.col, p0[2] > 0 ? 0.3 : 0.16); } Q.glow(Xs, Ys - hh * 0.5, T2 * 2.2, BR.N.col, 0.24, 1.4); Q.ring(Xs, Ys - hh, T2 * NC.rx * 1.05, '#F2FBFF', 0.32, T2 * 0.1, 0.36); }, c2 => glow(c2, Xs, Ys - hh * 0.5, T2 * 2, BR.N.col, 0.26, 1.4)); }
      else if (can) K.LL.q(Q => Q.ring(Xs, Ys, T2 * (1.1 + 0.3 * Math.sin(t * 3)), BR.N.col, 0.5, T2 * 0.12, 0.4)); };
    T.reset();
    return T;
  }

  /* ======================= the stage ======================= */
  function make(X, self, H) {
    const { M, me, g } = X, F = X.F, rid = F.rift.id, stageI = F.rift.stage;
    const LG = fxList(), LL = fxList();   // the frame's light: under the standing things, and over them
    const ST = () => X.ST(), atk = () => Math.max(1, (X.ST() && X.ST().atk) || 10);
    const has = (s, B) => String(s || '').indexOf(B) >= 0;
    /* ---- the checkpoint (st.rift.hall[rift]): sel, earn, carry, dep, door; a finished hall (door) starts a fresh set ---- */
    const RS = (typeof riftState === 'function' ? riftState() : (st.rift = st.rift || { seals: {}, prog: {}, gates: {} }));
    RS.hall = RS.hall || {};
    let PS = RS.hall[rid];
    if (!PS || PS.door) PS = RS.hall[rid] = { sel: '', earn: '', carry: '', dep: '', door: 0 };
    { const uniq = s => KEYS.filter(k => has(s, k)).join(''); PS.dep = uniq(PS.dep); PS.earn = uniq(PS.earn + PS.dep + PS.carry); if (has(PS.dep, PS.carry)) PS.carry = ''; PS.carry = PS.carry ? PS.carry[0] : ''; if (PS.carry) PS.sel = PS.carry; if (has(PS.dep, PS.sel)) PS.sel = ''; if (PS.sel && has(PS.earn, PS.sel)) {} }
    const save = () => { try { if (typeof saveSoon === 'function') saveSoon(); } catch (e) {} };
    const S = { t: 0, cue: null, chan: {}, grip: {}, bub: null, door: { seam: 0, rise: 0, part: 0, wet: 0, conv: 0, open: 0, t: -1, on: false }, msgT: 0, cam: { k: 0, x: H0.x, y: H0.y, zoom: 1 }, said: {} };
    for (const B of KEYS) { S.chan[B] = has(PS.dep, B) ? 1 : 0; S.grip[B] = has(PS.dep, B) ? 1 : 0; }
    self.hall = { get PS() { return PS; }, S, X };

    /* ---- the gates ---- */
    const GT = {}; const gateTiles = { W: M.marks['1'] || [], E: M.marks['2'] || [], N: M.marks['3'] || [] };
    for (const B of KEYS) { GT[B] = { B, open: 0, want: false }; for (const t of gateTiles[B]) block(X, t.tx, t.ty); }
    const gateOpen = B => { const G = GT[B]; if (G.want) return; G.want = true; for (const t of gateTiles[B]) unblock(X, t.tx, t.ty); X.shake(lowFx() ? 1.5 : 3, 0.35); if (X.sfx.crash) X.sfx.crash(); bellNote(X, 0.35); };
    const gateShut = B => { const G = GT[B]; if (!G.want) return; G.want = false;
      // (nothing may be left standing in a closing gate: the pet is put back on the hall's side, a monster ahead of it)
      for (const t of gateTiles[B]) { if (Math.floor(me.x) === t.tx && Math.floor(me.y) === t.ty) { const b = GEO.back[B]; me.x = b.x; me.y = b.y; } block(X, t.tx, t.ty); } if (X.sfx.thud) X.sfx.thud(); };
    const gateState = B => ({ open: GT[B].open, sel: PS.sel === B, done: has(PS.dep, B), sealed: !has(PS.dep, B) && PS.sel !== B && (!!PS.sel || !!PS.carry) });
    if (PS.sel) gateOpen(PS.sel);
    for (const B of KEYS) if (PS.sel === B) GT[B].open = 1;

    /* ---- the trials (built below) ---- */
    const TR = {};
    const trialOf = B => TR[B];
    const activeB = () => PS.sel && !has(PS.dep, PS.sel) ? PS.sel : '';
    function msg(s, col) { if (S.msgT > 0) return; S.msgT = 0.9; X.text(me.x, me.y - 1.3, s, col || '#FFE9B0', 13); if (X.sfx.wrong) X.sfx.wrong(); }
    function useGate(B) {
      if (S.door.on) return;
      if (has(PS.dep, B)) { msg(`${BR[B].dir}: complete`, BR[B].hi); return; }
      if (PS.carry) { msg(`Return the ${BR[PS.carry].crystal} to the altar first`, BR[PS.carry].hi); return; }
      if (PS.sel && PS.sel !== B) { msg(`Sealed: the ${BR[PS.sel].dir} gate is open. Stand at it to close it`); return; }
      if (PS.sel === B) { if (has(PS.earn, B)) { msg(`Collect the ${BR[B].crystal} inside`, BR[B].hi); return; } if (TR[B].state !== 'idle') return;
        PS.sel = ''; save(); gateShut(B); X.banner(`THE ${BR[B].dir} GATE CLOSES`, 'Choose any gate again', BR[B].hi, 2, true); return; }
      PS.sel = B; save(); TR[B].reset(); gateOpen(B);
      X.banner(BR[B].name.toUpperCase(), `The ${BR[B].dir.toLowerCase()} gate opens: cross the marked line to begin. The other gates stay sealed`, BR[B].col, 3, true, true);
    }
    const gates = KEYS.map(B => { const u = GEO.use[B], gp = GEO.gate[B];
      return H.obj({ x: u.x, y: u.y, kind: 'belgate', r: 1.0, h: 3.2, B,
        label: () => { const st2 = gateState(B); return S.door.on ? '' : st2.done ? `${BR[B].dir} · COMPLETE` : PS.sel === B ? (has(PS.earn, B) ? `${BR[B].dir} · CRYSTAL WAITING` : TR[B].state === 'idle' ? `${BR[B].dir} · OPEN (stand to close)` : '') : st2.sealed ? `${BR[B].dir} · SEALED` : `CHOOSE ${BR[B].dir}: ${BR[B].name.toUpperCase()}`; },
        dy: gp.ax === 'v' ? 0 : -1.6,
        draw(c, Xs, Ys, T) { const G = gateState(B); if (gp.ax === 'h') gateFront(c, B, X.sx(gp.x), X.sy(gp.y + 0.5), T, G, X.g.t); else gateSide(c, B, X.sx(gp.x), X.sy(gp.y), T, G, X.g.t, B === 'W' ? 1 : -1); },
        use() { useGate(B); } }); });
    // the objective plaques, beside each gate on the hall's side, readable before any choice
    const PLQ = { W: { x: 44.7, y: 51.0 }, E: { x: 60.3, y: 51.0 }, N: { x: 48.0, y: 46.4 } };
    for (const B of KEYS) { const p = PLQ[B]; H.obj({ x: p.x, y: p.y, kind: 'belplaque', r: 0.1, label: '', draw(c, Xs, Ys, T) { const G = gateState(B), tr = TR[B]; const s = G.done ? ['COMPLETE', '#9FFFC8'] : PS.sel === B ? (has(PS.earn, B) ? ['CRYSTAL EARNED', BR[B].hi] : tr.state === 'run' ? ['IN PROGRESS', '#FFE9A8'] : ['OPEN · CROSS THE LINE', '#FFE9A8']) : G.sealed ? ['SEALED', '#B7C2C8'] : ['STAND AT THE GATE TO CHOOSE', '#FFFFFF']; plaqueArt(c, B, Xs, Ys, T, s[0], s[1], X.g.t); } }); }

    /* ---- the sockets on the dais ---- */
    function deposit(B) {
      if (has(PS.dep, B) || PS.carry !== B) return false;   // (a repeated or stray deposit changes nothing)
      PS.dep += B; PS.dep = KEYS.filter(k => has(PS.dep, k)).join(''); PS.carry = ''; PS.sel = ''; save(); S.bub = null; gateShut(B);
      S.grip[B] = 0.001; S.chan[B] = 0.001; const s = SOCK[B];
      X.flash(0.35, BR[B].col); X.ring(s.x, s.y, 0.2, 2.2, 0.5, BR[B].col, 0.35); X.boom(s.x, s.y - 0.6, 0.9, BR[B].col, '#FFFFFF', { n: 14, shake: 3 }); bellNote(X, 0.55); if (X.sfx.chime) { X.sfx.chime(880); X.after(0.12, () => X.sfx.chime(1175, 0.7)); }
      const n = PS.dep.length; X.banner(`CRYSTALS RETURNED: ${n}/3`, n < 3 ? `The ${BR[B].crystal} is gripped by its socket. Choose another gate` : 'Three crystals: the seam in the dais stirs', BR[B].col, 2.6, true, true);
      if (n === 3) X.after(1.0, () => doorStart());
      return true; }
    const sockets = KEYS.map(B => { const s = SOCK[B]; return H.obj({ x: s.x, y: s.y, kind: 'belsocket', r: 0.85, h: 1.9, B,
      label: () => S.door.on ? '' : has(PS.dep, B) ? '' : PS.carry === B ? `PLACE THE ${BR[B].crystal.toUpperCase()}` : PS.carry ? `${BR[B].crystal.toUpperCase()} SOCKET` : `${BR[B].dir} SOCKET · EMPTY`,
      draw(c, Xs, Ys, T) { socketArt(c, B, Xs, Ys, T); },
      use() { if (has(PS.dep, B)) return; if (PS.carry === B) deposit(B); else if (PS.carry) msg(`This socket takes the ${BR[B].crystal}`, BR[B].hi); else msg(`Empty: it waits for the ${BR[B].crystal}`, BR[B].hi); } }); });
    function socketArt(c, B, Xs, Ys, T) { const C = BR[B], t = X.g.t, gk = S.grip[B] || 0, lw = Math.max(1.5, T * 0.05);
      // v392 PR: the repainted socket (20n9: a moulded drum, a brass collar, a ring of runes lit in its colour, three claws)
      const BPs = BPZ(), ck0 = ease(Math.min(1, gk * 1.6)), sOK = !!(BPs && BPs.draw(c, 'socket', B + Math.round(ck0 * 4) + (gk > 0 ? 1 : 0), Xs, Ys, T));
      const h = T * (sOK ? 0.78 : 0.55), crY = Ys - h - T * 0.55, ck = ck0; c.save();
      if (!sOK) {   // (the old 2D socket: no repainted picture this frame)
      c.fillStyle = 'rgba(0,0,0,.35)'; ell(c, Xs, Ys + T * 0.08, T * 0.62, T * 0.22); c.fill();
      // a low drum of limestone with a brass rim and the emblem's recess
      const w = T * 0.55; const g2 = c.createLinearGradient(Xs - w, 0, Xs + w, 0); g2.addColorStop(0, P.LIME_HI); g2.addColorStop(1, '#8E948A'); c.fillStyle = g2; c.fillRect(Xs - w, Ys - h, w * 2, h); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(Xs - w, Ys - h, w * 2, h);
      ell(c, Xs, Ys - h, w, T * 0.2); c.fillStyle = '#B7BCAD'; c.fill(); c.stroke(); ell(c, Xs, Ys - h, w * 0.7, T * 0.13); c.fillStyle = '#26343A'; c.fill(); c.strokeStyle = P.BRASS; c.lineWidth = Math.max(1.5, T * 0.06); c.stroke();
      c.fillStyle = P.BRASS; c.fillRect(Xs - w, Ys - h * 0.45, w * 2, T * 0.1);
      emblem(c, C.emblem, Xs, Ys - h * 0.2 + T * 0.02, T * 0.13, gk > 0 ? C.col : rgba(C.col, 0.6));
      // the brass claws: open, waiting; closed round the crystal once it is placed
      for (const sd of [-1, 0, 1]) { const bx = Xs + sd * w * 0.62, by = Ys - h, tx = Xs + sd * w * (0.9 - 0.62 * ck), ty = crY - T * 0.1 * (1 - ck); c.strokeStyle = P.BRASS_D; c.lineWidth = Math.max(2, T * 0.09); c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + sd * T * 0.25, (by + ty) / 2, tx, ty); c.stroke(); c.strokeStyle = P.BRASS_HI; c.lineWidth = Math.max(1, T * 0.04); c.stroke(); } }
      if (gk > 0) { crystalArt(c, B, Xs, crY, T * 0.85, t, { k: 1 }); crystalLight(LL, B, Xs, crY, T * 0.85, 0.7 + 0.3 * Math.sin(t * 2.5), t); }
      else if (PS.carry === B) { const k = 0.5 + 0.5 * Math.sin(t * 5); LL.q(Q => { Q.beam(Xs, Ys - h, Xs, Ys - T * 4, T * 0.5, C.col, 0.35 * k); Q.glow(Xs, Ys - h, T * 1.2, C.col, 0.4 * k); }, c2 => glow(c2, Xs, Ys - h - T, T * 1.4, C.col, 0.35 * k, 1.8)); }
      c.restore(); }

    /* ---- the Resonance bubble: the carried crystal, floating beside the pet ---- */
    function bubbleTick(dt) { if (!PS.carry) { S.bub = null; return; } const side = me.face < 0 ? 1 : -1, tx = me.x + side * 0.85, ty = me.y - 0.15;
      if (!S.bub) S.bub = { x: tx, y: ty, B: PS.carry, t: 0 }; const b = S.bub; b.B = PS.carry; b.t += dt; const k = 1 - Math.pow(0.004, dt); b.x += (tx - b.x) * k; b.y += (ty - b.y) * k; bubbleObj.x = b.x; bubbleObj.y = b.y + 0.02; }
    const bubbleObj = H.obj({ x: -99, y: -99, kind: 'belbubble', r: 0.1, label: '', draw(c, Xs, Ys, T) { const b = S.bub; if (!b) return; const z = T * (1.35 + 0.1 * Math.sin(b.t * 2.2)); c.save(); c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, Xs, Ys + T * 0.05, T * 0.35, T * 0.12); c.fill(); c.restore(); bubbleArt(c, b.B, Xs, Ys - z, T * 0.42, b.t, LL); } });

    /* ---- the central doorway ---- */
    const doorObj = H.obj({ x: DOOR.x, y: DOOR.y + 0.4, kind: 'beldoor', r: 0.1, label: '', draw(c, Xs, Ys, T) { if (S.door.rise <= 0) return; doorArt(c, X.sx(DOOR.x), X.sy(DOOR.y + 0.35), T, S.door, X.g.t, LL); } });
    function doorStart() { if (S.door.on || S.door.open >= 1) return; S.door.on = true; S.door.t = 0; g.cineT = 1; X.banner('THE THREE TIDES ANSWER', 'The light runs to the seam', '#FFFFFF', 2.4, true, true); }
    function doorTick(dt) { const D = S.door; if (!D.on) return; D.t += dt; const t = D.t;
      g.cineT = 1; me.vx = me.vy = 0;
      // the pet is moved clear of the stone's footprint first
      const f = DOOR.foot; if (me.x > f.x0 - 0.3 && me.x < f.x1 + 0.3 && me.y > f.y0 - 0.3 && me.y < f.y1 + 0.5) { const ty = f.y1 + 1.0; me.y += Math.min(ty - me.y, 3.2 * dt); if (me.y < ty - 0.05) { me.bob = (me.bob || 0) + dt * 9; } }
      D.conv = clamp(t / 1.2, 0, 1);
      if (t > 1.2 && !D.rang) { D.rang = true; bellNote(X, 1); X.flash(0.5, '#DFFFF8'); X.shake(lowFx() ? 3 : 7, 0.6); X.ring(H0.x, H0.y, 0.4, 6, 0.9, P.TURQ, 0.4); }
      D.seam = clamp((t - 1.3) / 0.8, 0, 1);
      if (t > 2.0 && !D.up) { D.up = true; X.banner('A DOORWAY RISES', 'Out of the dais, shedding the sea', P.TURQ_HI, 3, true, true); if (X.sfx.crash) X.sfx.crash(); }
      D.rise = clamp((t - 2.0) / 3.0, 0, 1); D.wet = t < 2 ? 0 : t < 5.6 ? 1 : clamp(1 - (t - 5.6) / 2.4, 0, 1);
      if (D.rise > 0 && D.rise < 1) { X.shake(lowFx() ? 1.2 : 2.6, 0.12); if (Math.random() < dt * 22) { const x = DOOR.x + (Math.random() - 0.5) * 5.4; X.part({ kind: 'bubble', x, y: DOOR.y + 0.4, vx: (Math.random() - 0.5) * 1.5, vy: -2 - Math.random() * 2, g: 7, life: 0.6, max: 0.6, size: 3 + Math.random() * 3, color: '#CFF6FF' }); X.part({ kind: 'smoke', x, y: DOOR.y + 0.5, vx: (Math.random() - 0.5), vy: -0.4, life: 0.8, max: 0.8, size: 0.5, color: 'rgba(200,210,200,' }); } }
      if (t > 5.0 && !D.parting) { D.parting = true; for (const tt of DOOR_SOLID) block(X, tt[0], tt[1]); bellNote(X, 0.5); X.splash(DOOR.x, DOOR.y + 0.6, 2.4); }
      D.part = clamp((t - 5.1) / 1.1, 0, 1);
      if (t > 6.3) { D.on = false; D.open = 1; g.cineT = 0; D.hold = 1.4; doorDone(true); } }
    const DOOR_SOLID = [[49, 53], [49, 54], [55, 53], [55, 54]];
    function doorDone(fresh) { const D = S.door; D.open = 1; D.rise = 1; D.part = 1; D.seam = 1; D.conv = 0; D.on = false; if (!fresh) { D.wet = 0; for (const tt of DOOR_SOLID) block(X, tt[0], tt[1]); }
      self.done = true; H.setExit(DOOR.x, DOOR.y + 0.55, 'To Kharrox');
      PS.door = 1; try { if (RS.prog && !(RS.seals && RS.seals[rid]) && RIFT_BY_ID[rid]) RS.prog[rid] = Math.max(RS.prog[rid] || 0, Math.min(RIFT_BY_ID[rid].stages.length - 1, stageI + 1)); } catch (e) {} save();   // (the checkpoint at the new door: a later wipe never repeats the trials)
      if (fresh) { X.banner('THE WAY TO KHARROX IS OPEN', 'Walk through the risen doorway into the baptism chamber', '#8FE0A6', 3, true, true); if (X.sfx.fanfare) X.sfx.fanfare(); } }
    if (PS.dep.length === 3) doorDone(false);

    /* ---- failures, abandoning, the knockout rule ---- */
    function failTrial(B, why) { const T = TR[B]; if (!T) return; T.reset(true); const b = GEO.back[B]; me.x = b.x; me.y = b.y; me.vx = me.vy = 0; me.dodge = null; me.inv = Math.max(me.inv || 0, 1.2); me.hp = Math.max(me.hp, ST().hp); S.cue = null;
      PS.sel = ''; save(); gateShut(B); X.flash(0.4, BR[B].col); for (const o of self.objs || []) if (o.kind === 'belgate') { o.used = true; o.ch = 0; }
      X.banner(why === 'broken' ? 'CRYSTAL BROKEN — RETRY THE DEFENCE' : why === 'ko' ? 'KNOCKED OUT' : 'TRIAL ABANDONED', why === 'ko' ? `${BR[B].name} is reset. Crystals already returned are safe` : why === 'broken' ? 'Choose any unfinished gate: full integrity, wave one, thirty seconds again' : `${BR[B].name} is reset. Choose any unfinished gate`, why === 'leave' ? '#FFE9A8' : '#FF9A8A', 3, true, true); }
    g.koHook = () => { const B = activeB(); if (!B || has(PS.earn, B)) return false; const T = TR[B]; if (T.state !== 'run' && T.state !== 'cue') return false; failTrial(B, 'ko'); return true; };
    function winTrial(B) { if (has(PS.earn, B)) return; PS.earn += B; PS.earn = KEYS.filter(k => has(PS.earn, k)).join(''); save(); X.flash(0.4, '#FFFFFF'); if (X.sfx.fanfare) X.sfx.fanfare(); }

    /* ---- the crystals in the arenas (collected by interacting) ---- */
    function collect(B) { if (!has(PS.earn, B) || has(PS.dep, B) || PS.carry) return false; PS.carry = B; save(); S.bub = null; bubbleTick(0); const T = TR[B]; T.collected = true;
      X.banner(`${BR[B].crystal.toUpperCase()} COLLECTED`, 'It floats beside you in a Resonance bubble: carry it back to its socket on the altar', BR[B].col, 3, true, true); X.ring(me.x, me.y, 0.2, 1.8, 0.45, BR[B].col, 0.3); if (X.sfx.chime) X.sfx.chime(1046); return true; }

    // the trials themselves
    TR.E = trialEast(X, H, S, { winTrial, failTrial, atk, has, PS: () => PS, LG, LL });
    TR.W = trialWest(X, H, S, { winTrial, failTrial, atk, has, PS: () => PS, LG, LL });
    TR.N = trialNorth(X, H, S, { winTrial, failTrial, atk, has, PS: () => PS, LG, LL });
    for (const B of KEYS) { const T = TR[B]; if (has(PS.earn, B) && !has(PS.dep, B)) T.restoreWon(); }
    for (const B of KEYS) { const T = TR[B], cp = T.crystalAt; H.obj({ x: cp.x, y: cp.y, kind: 'belcrystal', r: 1.0, h: T.crystalH || 2.4, B,
      label: () => has(PS.earn, B) && !has(PS.dep, B) && PS.carry !== B ? `COLLECT THE ${BR[B].crystal.toUpperCase()}` : '',
      draw(c, Xs, Ys, T2) { T.drawCrystal(c, Xs, Ys, T2, has(PS.earn, B) && PS.carry !== B && !has(PS.dep, B)); },
      use() { if (has(PS.earn, B) && PS.carry !== B && !has(PS.dep, B)) collect(B); } }); }

    /* ---- the late light, and the altar's count, over everything standing ---- */
    H.obj({ x: 0, y: 1e6, kind: 'bellate', r: 0, label: '', draw(c) { const T = X.Tz(), t = X.g.t;
      for (const B of KEYS) if (TR[B].late) TR[B].late(c, LL);
      if (onScreen(X, H0.x, H0.y - 3.6, 3)) { const n = PS.dep.length, Xs = X.sx(H0.x), Ys = X.sy(H0.y - 3.9) - (S.door.rise > 0 ? T * 2.6 * ease(S.door.rise) : 0); c.save(); c.globalAlpha = 0.92; c.fillStyle = 'rgba(8,22,30,.72)'; const w = T * 3.6; c.beginPath(); c.roundRect ? c.roundRect(Xs - w / 2, Ys - T * 0.32, w, T * 0.64, T * 0.3) : c.rect(Xs - w / 2, Ys - T * 0.32, w, T * 0.64); c.fill(); c.strokeStyle = rgba(P.TURQ, 0.6); c.lineWidth = 1.5; c.stroke(); c.restore(); label(c, `Crystals returned: ${n}/3`, Xs, Ys, T * 0.3, n === 3 ? '#9FFFE0' : '#F2F6EE'); }
      LL.flush(c); } });

    /* ---- the update ---- */
    function update(dt) { S.t += dt; S.dt = dt; S.msgT = Math.max(0, S.msgT - dt); if (S.door.hold > 0) S.door.hold -= dt;
      for (const B of KEYS) { const G = GT[B]; G.open = clamp(G.open + (G.want ? dt / 1.5 : -dt / 1.0), 0, 1); }   // v430 BW: heavier (was 0.8 s / 0.6 s; the way through opens and shuts at once, as before: only the leaves' look takes longer)
      for (const B of KEYS) { if (S.grip[B] > 0 && S.grip[B] < 1) S.grip[B] = Math.min(1, S.grip[B] + dt / 0.6); if (S.chan[B] > 0 && S.chan[B] < 1) S.chan[B] = Math.min(1, S.chan[B] + dt / 0.9); }
      bubbleTick(dt); doorTick(dt); for (const k of KEYS) if (TR[k].frame) TR[k].frame();
      for (const k of KEYS) if (TR[k].dress) TR[k].dress(dt);   // v392 PR: the breakable dressing (shots through it, a swinging bell's hiding)
      const B = activeB(), T = B ? TR[B] : null;
      if (T && !has(PS.earn, B)) {
        if (T.state === 'idle' && !me.dead && inArena(B, me)) { T.state = 'cue'; S.cue = { B, t: 0, n: B === 'E' ? 1.2 : 3 }; if (T.onCue) T.onCue(); }
        if (T.state === 'cue') { S.cue.t += dt; if (inHall(me)) { failTrial(B, 'leave'); return; } if (S.cue.t >= S.cue.n) { S.cue = null; T.start(); } }
        else if (T.state === 'run') { if (inHall(me)) { failTrial(B, 'leave'); return; } T.update(dt); if (T.state === 'won') winTrial(B); }
      } else if (T && T.state === 'won' && T.tickWon) T.tickWon(dt);
      // (only the active trial runs; the others hold still)
    }
    function goal() { const n = PS.dep.length;
      if (S.door.open >= 1) return 'The way to Kharrox is open: walk through the doorway';
      if (S.door.on) return 'The doorway rises…';
      if (PS.carry) return `Carry the ${BR[PS.carry].crystal} to its socket on the altar · ${n}/3 returned`;
      const B = activeB();
      if (B && has(PS.earn, B)) return `Collect the ${BR[B].crystal} · ${n}/3 returned`;
      if (B) { const T = TR[B]; if (T.state === 'idle') return `${BR[B].dir} gate open: cross the marked line to begin ${BR[B].name}`; if (T.state === 'cue') return BR[B].name; return T.goal(); }
      const left = KEYS.filter(k => !has(PS.dep, k)).map(k => BR[k].dir.toLowerCase());
      return `Choose a gate (${left.join(', ')}) · crystals returned ${n}/3`; }
    function hint() { if (S.door.on) return null; if (S.door.open >= 1) return null;
      if (PS.carry) { const s = SOCK[PS.carry]; return { x: s.x, y: s.y, h: 2.1, label: `${BR[PS.carry].crystal.toUpperCase()} SOCKET` }; }
      const B = activeB(); if (!B) return null; const T = TR[B];
      if (has(PS.earn, B)) { const p = T.crystalAt; return { x: p.x, y: p.y, h: (T.crystalH || 2.4) + 0.4, label: BR[B].crystal.toUpperCase() }; }
      if (T.state === 'idle') { const b = GEO.bound[B]; return B === 'N' ? { x: 52.5, y: b.y - 0.6, h: 0.6, label: 'START LINE' } : { x: b.x + (B === 'W' ? -0.6 : 0.6), y: 54.5, h: 0.6, label: 'START LINE' }; }
      return T.hint ? T.hint() : null; }
    function drawGround(c) { hallGround(X, c, LG, S); causewayGround(X, c, LG); for (const B of KEYS) { TR[B].ground(c, LG, PS.sel === B && !has(PS.earn, B)); }
      // the start lines of an open gate's trial
      const B = activeB(); if (B && TR[B].state === 'idle' && !has(PS.earn, B)) startLine(c, B);
      LG.flush(c); }
    function startLine(c, B) { const T = X.Tz(), t = X.g.t, b = GEO.bound[B], col = BR[B].col, k = 0.65 + 0.35 * Math.sin(t * 4);
      const a = B === 'N' ? [X.sx(50), X.sy(b.y), X.sx(55), X.sy(b.y)] : [X.sx(b.x), X.sy(52), X.sx(b.x), X.sy(57)];
      c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(4,14,20,.7)'; c.lineWidth = T * 0.24; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[2], a[3]); c.stroke(); c.strokeStyle = rgba(col, k); c.lineWidth = T * 0.13; c.setLineDash([T * 0.35, T * 0.2]); c.lineDashOffset = -t * T; c.stroke(); c.restore();
      const mx = (a[0] + a[2]) / 2, my = (a[1] + a[3]) / 2; label(c, 'START', mx + (B === 'N' ? 0 : B === 'W' ? -T * 0.9 : T * 0.9), my + (B === 'N' ? -T * 0.55 : 0), T * 0.26, col);
      LG.q(Q => Q.beam(a[0], a[1], a[2], a[3], T * 0.35, col, 0.5 * k)); }
    function drawOver(c) { const W = X.W(), Hh = X.H();
      const B = activeB(); if (B && TR[B].hud && (TR[B].state === 'run' || TR[B].state === 'cue' || (TR[B].state === 'won' && !has(PS.earn, B)))) TR[B].hud(c, W, Hh);
      if (S.cue) cueArt(c, W, Hh); }
    function cueArt(c, W, Hh) { const C = S.cue, B = C.B, n = C.n, left = n - C.t, k = left - Math.floor(left), s = left > 1e-3 ? (B === 'E' ? 'READY' : String(Math.ceil(left))) : 'GO';
      c.save(); const y = Hh * 0.36, sc = 1 + 0.35 * Math.pow(k, 3); c.translate(W / 2, y); c.scale(sc, sc); label(c, s, 0, 0, 64, BR[B].hi, { w: 900, lw: 8, ink: rgba(BR[B].deep, 0.9) }); c.restore();
      const sub = B === 'N' ? 'Movement and dodge roll only. Bait the rollers into each other.' : B === 'W' ? 'Defend the crystal: 30 seconds once the count ends' : 'Fifty from the drains, then their master';
      label(c, sub, W / 2, y + 52, Math.min(15, W / 26), '#FFFFFF', { w: 800 }); }
    function cam() { const D = S.door, R2 = S.cam; let want = null;
      if (D.on || D.hold > 0) want = { x: DOOR.x, y: DOOR.y - 1.2, k: 1, zoom: 0.86 };
      else { const B = activeB(), T = B ? TR[B] : null; if (T && (T.state === 'run' || T.state === 'cue') && T.cam) want = T.cam(); }
      const tk = want ? want.k : 0; if (want) { R2.x = want.x; R2.y = want.y; R2.zoom = want.zoom; } R2.k += (tk - R2.k) * Math.min(1, (S.dt || 1 / 60) * 3); if (!want && R2.k < 0.02) { R2.k = 0; R2.zoom = 1; }
      return R2.k > 0.001 || R2.zoom !== 1 ? { x: R2.x, y: R2.y, k: ease(R2.k), zoom: want ? want.zoom : lerp(1, R2.zoom, R2.k) } : null; }

    if (!PS.dep.length && !PS.sel && !PS.carry) X.after(1.6, () => X.banner('THE HALL OF THREE TIDES', 'Three sealed gates, three crystals. Stand at a gate to choose its trial', P.TURQ_HI, 3.4, true, true));
    else X.after(1.0, () => X.banner('THE HALL OF THREE TIDES', `Crystals returned: ${PS.dep.length}/3${PS.carry ? ` · the ${BR[PS.carry].crystal} is still in your keeping` : ''}`, P.TURQ_HI, 3, true, true));
    return { update, goal, hint, drawGround, drawOver, cam, hideHud: () => false, guardPost: () => ({ x: DOOR.x + 2.6, y: DOOR.y + 2.6 }), trials: TR, deposit, collect, useGate, failTrial, doorStart, PS: () => PS, S };
  }

  /* ======================= the stage spec ======================= */
  const NAME = 'The Hall of Three Tides';
  const stage = { name: NAME, hall: true, goal: 'Win three crystals from the east, west and north trials, in any order, and return them to the altar',
    how: 'A round vestibule with three sealed gates. Stand at a gate to choose its trial: the others stay sealed until it is done. EAST, The Sunken Muster: defeat fifty monsters in five groups of ten, then Varkul, the Chainbound. WEST, The Last Beacon: keep the crystal intact for thirty seconds against waves of a hundred and twenty reef gnawers. NORTH, The Hundredfold Roll: one hundred bell rollers that can only be destroyed by rolling into each other; you may only move and dodge roll. Then your skills return and two corrupted Cocopets come out of the dark: defeat both for the crystal. Collect each crystal, carry it back in its Resonance bubble and place it in its socket. Three crystals raise the doorway to Kharrox.',
    layout: LAYOUT, legend: { 1: {}, 2: {}, 3: {}, P: PROP('belpillar', 'pillar'), K: PROP('belstump', 'brokenpillar') }   /* (v392 PR: the Belfry's own repainted pillar and broken column) */, lights: [], make,
    biome: 'belfry', guard: 'hall', causeway: { x0: 50, x1: 55, y0: 65, y1: 81 }, vista: { x: 52.5, y: 8 } };
  /* v398 B2: the loading pass (20b preloadMore: S.preload) warms the north duel's pair, who appear only mid-trial: their PetGL bodies
     and faces, through EVIL_MINI.warm (20zz9, v398 M) with the same options the duel spawns them with */
  stage.preload = P => { try { const E = typeof EVIL_MINI !== 'undefined' ? EVIL_MINI : null; if (!E || typeof E.warm !== 'function') return [];
      return E.warm(P, NDUEL.map(d => ({ x: d.at.x, y: d.at.y, name: d.name, short: d.short, el: d.el, seed: d.seed, palette: d.palette, sub: d.sub, lvl: NDUEL_TUNE.lvl, hpK: NDUEL_TUNE.hpK, dmgK: NDUEL_TUNE.dmgK }))) || []; } catch (e) { return []; } };   // (B1's every-stage layer: the causeway's waves, the far vista; the section's guardian at the risen door)
  /* a rift that marks a placeholder stage ({ hallSlot: true }, or this name) gets this stage filled in (its kind, trial and
     biome flags kept) */
  function install(Rf) { if (!Rf || !Rf.stages) return -1; const i = Rf.stages.findIndex(s => s && (s.hallSlot || s.hall || s.name === NAME)); if (i < 0) return -1; const s0 = Rf.stages[i], keep = { kind: s0.kind, trial: s0.trial, biome: s0.biome }; Object.assign(s0, stage); for (const k in keep) if (keep[k] !== undefined) s0[k] = keep[k]; if (!s0.kind) s0.kind = 'puzzle'; return i; }
  try { if (typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.belfry) install(RIFT_BY_ID.belfry); } catch (e) {}
  return { stage, install, NAME, GEO, SOCK, DOOR, BR, TUNE, LAYOUT, crystalArt, emblem, bellNote };
})();
try { self.BELFRY_HALL = BELFRY_HALL; } catch (e) {}   // (for tests and for code outside the bundle's scope)
