/* ---------- Gate 02, Taurus: The Unbroken Constellation (v426 TG: rebuilt at the Gate of Cancer's quality) ----------
   Beside the Garden of Unborn Stars, a vault of ancient stone floats in a dusk-gold sky: its floor a night sky laid in
   lapis slabs seamed with gold, a star chart carved through it, an ivory border, bronze-horned obsidian columns along its
   walls and two braziers by a great door in its north wall. Luminous stars stand on daises on that floor, joined by faint
   lines. Your pet carries a strand of golden light: stand beside a star to begin there, then walk to a star joined to it
   and the line between them is traced in solid gold. Every line must be traced exactly once without lifting the thread: a
   star may be visited again, a line may not be walked twice. The thread continues from its last star, wherever your pet
   wanders. Undo takes the last line back; Start over clears the sky. Three constellations: five stars; six stars with a
   star you must begin at; seven stars with a bridge that must be crossed before a dark star wakes. Each sky traced lights
   a stud on the great door's lintel; with all three the door opens (its bronze leaves parting, dusk light pouring through,
   gold dust rolling out). Beyond it waits the Court of the World Pillar: a temple court of ivory stone and obsidian inlaid
   with antique gold, the bull's sign carved at its heart, colossal broken pillars and a broken arch on its rim, monoliths
   and debris held aloft round it by some great pull, under a dusk-gold sky. Step through and the door seals behind:
   Belial, the World Pillar, will be fought there (TAURUS_BOSS, a later release), or, without it, Taurus wakes at once.
   Pictures: TAURUS_PROPS (20q1-taurus-props.js), painted once by the Belfry's shading pass; floors and walls are this file's
   own lands ('meadow': the Star Vault, 'taurcourt': the court), painted into the engine's cached ground chunks; the sky
   ('tgsky') is the gap backdrop. Light and air (the stars, the lines and the thread, the braziers' fire, the door's studs
   and its opening, the court's carved rings, the pull's ripples, dust, motes, the sun's halo and its golden rings) are drawn
   on the GPU (NIDHOGG_MOVES.FGFX, existing kinds only: no new shader code) where a real GPU draws; elsewhere the pictures and
   floors stand and the stars and lines are drawn as before (2D). lowFx keeps the light that tells the puzzle and the door.
   Contract with the boss (TAURUS_BOSS, all optional but begin): when the pet crosses into the court the door seals and
   TAURUS_BOSS.begin(X, H, self, A) is called, A = { cx, cy, r, rx, ry, ax0, ay0, ax1, ay1, door: { x, y } } (world tiles:
   the court's centre, its radius (the smaller half axis) and half axes, its walkable bounds, the sealed door's foot; the
   walkable floor is a rounded square, |dx/rx|^2.6 + |dy/ry|^2.6 <= 1, holding the ellipse); then every frame
   TAURUS_BOSS.update(dt), drawGround(c), drawOver(c), and cam(), goal(), hideHud(), onBossDeath(m) when asked;
   TAURUS_BOSS.stop() when the stage closes. The boss calls X.winStage() itself when Belial falls. Without TAURUS_BOSS,
   Taurus wakes as the door seals (the old win).
   Memory: every picture is given back when the stage closes (TAURUS_PROPS.release, through the dungeon game's destroy and
   BEL.onRelease). Test hooks: the stage module's visit(i), undo(), restart(), load(n), stars, lines, R, S, geo. */
(() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const hh = (a, b, s) => { let n = (a * 374761393 + b * 668265263 + (s || 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const TP = () => (typeof TAURUS_PROPS !== 'undefined' ? TAURUS_PROPS : null);
  // (the boss; tests may stand one in, window.__TG_BOSS, or leave it out, window.__TG_NOBOSS = 1)
  const TB = () => { const w = typeof window !== 'undefined' ? window : {}; if (w.__TG_BOSS) return w.__TG_BOSS; if (w.__TG_NOBOSS === 1) return null; return typeof TAURUS_BOSS !== 'undefined' && TAURUS_BOSS ? TAURUS_BOSS : null; };
  const fgx = () => { try { if (typeof window !== 'undefined' && (window.__TG_GL === 0 || window.__DUN_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const GOLD = '#FFD36B', INK = '#2B2433', DIM = 'rgba(200,210,255,.45)', PALE = '#DCE8FF', AMBER = '#FFB04A', DUSK = '#FFC98A', VIOLET = '#B98BE0';

  /* ======================= the plan (world tiles: a layout cell (i, j) is world tile (i + 1, j + 1)) ======================= */
  const W0 = 31, H0 = 35;
  const AC = { x: 16.5, y: 12.5 }, ARX = 11.2, ARY = 8.0, SEN = 2.6;     // the court: a rounded square of walkable stone (22 x 16 tiles)
  const WALLY = 21, DOORX = 16.5, DOORY = 22.0;                          // the wall between, the door's foot (its floor line)
  const OX = 10.0, OY = 22.5, FC = { x: 16.5, y: 27.0 };                 // the skies' field (the old 12 x 9 field), the star chart's heart
  const se = (u, v) => Math.pow(Math.abs(u), SEN) + Math.pow(Math.abs(v), SEN);
  const spt = a => { const c = Math.cos(a), s = Math.sin(a); return [Math.sign(c) * Math.pow(Math.abs(c), 2 / SEN), Math.sign(s) * Math.pow(Math.abs(s), 2 / SEN)]; };
  const inArena = (x, y) => y <= 20 && se((x + 0.5 - AC.x) / ARX, (y + 0.5 - AC.y) / ARY) <= 1;
  const inChamber = (x, y) => { if (y < 22 || y > 33 || x < 8 || x > 24) return false; return y < 31 || (x >= 8 + (y - 30) && x <= 24 - (y - 30)); };
  // the court's rim: colossal pillars (engine props, breakable), clear of the door's side; the great arch on the north rim, two lone piers
  const RUINS = [-128, -52, -162, -18, 180, 0, 154, 26].map(d => { const a = d * Math.PI / 180, p = spt(a); return [Math.floor(AC.x + p[0] * ARX * 0.86), Math.floor(AC.y + p[1] * ARY * 0.84)]; });
  const ARCH = { x: 16.5, y: 6.0, piers: [[13, 5], [19, 5]] };
  const PIERS = [[-138, 1], [-42, -1]].map(([d, m]) => { const a = d * Math.PI / 180, p = spt(a), tx = Math.floor(AC.x + p[0] * ARX * 0.9), ty = Math.floor(AC.y + p[1] * ARY * 0.9); return { tx, ty, x: tx + 0.5 + m * 3.0, y: ty + 0.98, m }; });
  const COLS = [[8, 23], [24, 23], [8, 27], [24, 27], [9, 31], [23, 31]], BRAZ = [[12, 22], [20, 22]];
  const HOLES = [{ x: 9.3, y: 10.6, s: 1 }, { x: 23.8, y: 14.3, s: 2 }, { x: 12.2, y: 17.2, s: 3 }, { x: 21.0, y: 7.6, s: 4 }];   // (stones the pull has lifted out of the court's floor)
  const LAYOUT = (() => { const rows = []; const at = new Map(); const mark = (x, y, ch) => at.set(x + ',' + y, ch);
    RUINS.forEach(([x, y]) => mark(x, y, 'P')); COLS.forEach(([x, y]) => mark(x, y, 'C'));
    mark(16, 21, 'D'); mark(15, 21, 'd'); mark(17, 21, 'd'); mark(16, 12, 'A'); mark(16, 33, 'S');
    for (let j = 0; j < H0; j++) { let s = ''; for (let i = 0; i < W0; i++) { const x = i + 1, y = j + 1, m = at.get(x + ',' + y);
      if (m && (m === 'D' || m === 'd' || inArena(x, y) || inChamber(x, y))) { s += m; continue; }
      if (inArena(x, y) || inChamber(x, y)) { s += '.'; continue; }
      let wall = false; if (y >= WALLY) for (let dy = -1; dy <= 1 && !wall; dy++) for (let dx = -1; dx <= 1; dx++) if (inChamber(x + dx, y + dy)) { wall = true; break; }
      s += wall ? '#' : '~'; } rows.push(s); }
    return rows; })();
  const MONO = []; for (let i = 0; i < 12; i++) { const a = -Math.PI * 1.1 + i / 11 * Math.PI * 1.2 + (hh(i, 3) - 0.5) * 0.12; if (Math.abs(a + Math.PI / 2) < 0.3) continue; const k = 1.12 + hh(i, 5) * 0.2, p = spt(a);
    MONO.push({ x: AC.x + p[0] * ARX * k, y: AC.y + p[1] * ARY * k, v: i % 3, ph: hh(i, 7) * TAU, s: 0.85 + hh(i, 9) * 0.4, lift: 0.9 + hh(i, 11) * 1.6, dir: i % 2 ? 1 : -1 }); }
  const SUNW = { x: AC.x - 4.5, y: AC.y - ARY - 4.6 };   // (the sun's place in the sky, seen with parallax)
  const RINGS = [1.92, 3.71, 5.5];                      // (the court's carved rings round its heart; the GPU's running light follows them: 136 at R 6.4)

  /* ======================= the floors (painted into the engine's cached chunks, once) ======================= */
  // the bull's sign: a disc under a cup of horns (s: its size; centred on the disc's top)
  function sign(c, x, y, s, col, lw) { c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.arc(x, y + 0.3 * s, 0.4 * s, 0, TAU); c.stroke(); c.beginPath(); c.arc(x, y - 0.62 * s, 0.52 * s, 0.12, Math.PI - 0.12); c.stroke(); c.restore(); }
  function star8(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU - Math.PI / 2, rr = i % 2 ? r * 0.28 : r * (i % 4 ? 0.62 : 1); i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
  const blob = (c, p, r, col, a) => { const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.6, `rgba(${col},${a * 0.4})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); };
  const SL_TONES = ['#232C63', '#1F275A', '#29326D', '#212A60', '#262F68'];
  const NEB = ['120,90,220', '60,130,210', '190,110,180'];
  const edgeOf = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([a, b]) => !inChamber(x + a, y + b) && !(y + b === WALLY && Math.abs(x + a + 0.5 - DOORX) < 1.6));
  // the vault's floor: lapis slabs seamed with gold, a night of painted stars and nebulae in them, the star chart carved through it, an ivory border, the threshold
  function vaultFloor(c, X, Y, T, x, y) {
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T];
    if (!inChamber(x, y) || edgeOf(x, y)) {   // the ivory border (and the passage under the door): dressed blocks, a gold stud or an obsidian inlay each
      const tone = ['#B9AD93', '#B2A58A', '#BFB39A', '#AEA185'][Math.floor(hh(x, y, 3) * 4)]; c.fillStyle = tone; c.fillRect(X, Y, T, T);
      const g = c.createLinearGradient(X, Y, X + T, Y + T); g.addColorStop(0, 'rgba(255,248,230,.22)'); g.addColorStop(0.5, 'rgba(255,248,230,0)'); g.addColorStop(1, 'rgba(60,40,30,.22)'); c.fillStyle = g; c.fillRect(X, Y, T, T);
      for (let i = 0; i < 6; i++) { const u = hh(x, y, 20 + i), v = hh(x, y, 30 + i); c.fillStyle = `rgba(90,70,50,${(0.12 + hh(x, y, 40 + i) * 0.2).toFixed(2)})`; c.fillRect(X + u * T, Y + v * T, Math.max(1, T * 0.025), Math.max(1, T * 0.025)); }
      c.strokeStyle = 'rgba(52,38,30,.55)'; c.lineWidth = Math.max(1, T * 0.04); c.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1);
      if ((x + y) % 2 === 0) { c.save(); c.translate(X + T / 2, Y + T / 2); c.rotate(Math.PI / 4); c.fillStyle = '#3A2E26'; c.fillRect(-T * 0.13, -T * 0.13, T * 0.26, T * 0.26); c.fillStyle = '#C99A4A'; c.fillRect(-T * 0.1, -T * 0.1, T * 0.2, T * 0.2); c.fillStyle = 'rgba(255,236,180,.8)'; c.fillRect(-T * 0.1, -T * 0.1, T * 0.2, T * 0.04); c.restore(); }
      else { c.fillStyle = '#25212C'; c.fillRect(X + T * 0.38, Y + T * 0.38, T * 0.24, T * 0.24); c.strokeStyle = 'rgba(201,154,74,.8)'; c.lineWidth = Math.max(0.8, T * 0.02); c.strokeRect(X + T * 0.38, Y + T * 0.38, T * 0.24, T * 0.24); }
    } else {
      // the slabs (2 x 2 tiles, alternate courses offset), each its own blue with a sheen; seams dark with a gold hairline
      const j = Math.floor(y / 2), off = j % 2, i = Math.floor((x + off) / 2), sx = i * 2 - off, sy = j * 2, a = P(sx, sy);
      c.fillStyle = SL_TONES[Math.floor(hh(i, j, 5) * SL_TONES.length)]; c.fillRect(a[0], a[1], T * 2, T * 2);
      const g = c.createRadialGradient(a[0] + T * 0.5, a[1] + T * 0.4, 0, a[0] + T * 0.8, a[1] + T * 0.8, T * 2.2); g.addColorStop(0, 'rgba(150,170,255,.16)'); g.addColorStop(1, 'rgba(10,12,40,.18)'); c.fillStyle = g; c.fillRect(a[0], a[1], T * 2, T * 2);
      // the night inside the stone: nebulae (world-space drifts), star dust
      for (let gy = Math.floor((y - 3) / 3.6); gy <= Math.floor((y + 4) / 3.6); gy++) for (let gx = Math.floor((x - 3) / 3.6); gx <= Math.floor((x + 4) / 3.6); gx++) { if (hh(gx, gy, 41) > 0.45) continue;
        const cx = (gx + hh(gx, gy, 53)) * 3.6, cy = (gy + hh(gx, gy, 59)) * 3.6, rr = 1.4 + hh(gx, gy, 61) * 1.8; if (cx + rr < x || cx - rr > x + 1 || cy + rr < y || cy - rr > y + 1) continue; blob(c, P(cx, cy), rr * T, NEB[Math.floor(hh(gx, gy, 67) * 3)], 0.13); }
      for (let k = 0; k < 16; k++) { const u = hh(x, y, 70 + k), v = hh(x, y, 90 + k), z = hh(x, y, 110 + k), px = X + u * T, py = Y + v * T, s = T * (0.01 + z * 0.022); c.fillStyle = z > 0.85 ? 'rgba(255,236,190,.9)' : z > 0.5 ? 'rgba(220,228,255,.7)' : 'rgba(170,184,255,.45)'; c.fillRect(px - s / 2, py - s / 2, Math.max(1, s), Math.max(1, s));
        if (z > 0.965) { blob(c, [px, py], T * 0.12, '230,236,255', 0.35); c.strokeStyle = 'rgba(240,244,255,.6)'; c.lineWidth = Math.max(0.6, T * 0.008); c.beginPath(); c.moveTo(px - T * 0.08, py); c.lineTo(px + T * 0.08, py); c.moveTo(px, py - T * 0.08); c.lineTo(px, py + T * 0.08); c.stroke(); } }
      c.strokeStyle = 'rgba(6,8,26,.72)'; c.lineWidth = Math.max(1.2, T * 0.05); c.strokeRect(a[0], a[1], T * 2, T * 2); c.strokeStyle = 'rgba(222,178,98,.55)'; c.lineWidth = Math.max(0.6, T * 0.018); c.strokeRect(a[0] + T * 0.02, a[1] + T * 0.02, T * 2, T * 2);
      // the star chart: three carved circles (gold in a dark groove), the ecliptic's ticks round the outer one, twelve stars on it
      const cp = P(FC.x, FC.y); for (const [rr, w] of [[1.74, 0.6], [3.36, 0.8], [4.99, 1]]) { c.strokeStyle = 'rgba(4,6,22,.6)'; c.lineWidth = Math.max(1.4, T * 0.06 * w); c.beginPath(); c.arc(cp[0], cp[1], rr * T, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(214,172,92,.55)'; c.lineWidth = Math.max(0.7, T * 0.022 * w); c.stroke(); }
      for (let k = 0; k < 48; k++) { const an = k / 48 * TAU, r0 = 4.99, r1 = k % 4 ? 5.17 : 5.42; c.strokeStyle = k % 4 ? 'rgba(214,172,92,.35)' : 'rgba(232,190,104,.6)'; c.lineWidth = Math.max(0.6, T * 0.018); c.beginPath(); c.moveTo(cp[0] + Math.cos(an) * r0 * T, cp[1] + Math.sin(an) * r0 * T); c.lineTo(cp[0] + Math.cos(an) * r1 * T, cp[1] + Math.sin(an) * r1 * T); c.stroke(); }
      for (let k = 0; k < 12; k++) { const an = (k + 0.5) / 12 * TAU, q = P(FC.x + Math.cos(an) * 5.75, FC.y + Math.sin(an) * 5.75); if (q[0] < X - T || q[0] > X + 2 * T || q[1] < Y - T || q[1] > Y + 2 * T) continue; star8(c, q[0], q[1], T * 0.16, 'rgba(226,184,100,.75)'); }
    }
    // the threshold before the door: a half disc of ivory, gold-edged, the bull's sign inlaid
    { const R = 2.3, cp = P(DOORX, DOORY); if (Math.hypot(x + 0.5 - DOORX, y + 0.5 - DOORY) < R + 1) {
      c.save(); c.beginPath(); c.arc(cp[0], cp[1], R * T, 0, Math.PI); c.closePath(); const g = c.createRadialGradient(cp[0], cp[1], 0, cp[0], cp[1], R * T); g.addColorStop(0, '#D2C6AA'); g.addColorStop(1, '#B3A68A'); c.fillStyle = g; c.fill(); c.clip();
      c.strokeStyle = 'rgba(60,44,34,.45)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.arc(cp[0], cp[1], 1.3 * T, 0, Math.PI); c.stroke(); for (let i = 1; i < 6; i++) { const an = i / 6 * Math.PI; c.beginPath(); c.moveTo(cp[0] + Math.cos(an) * 1.3 * T, cp[1] + Math.sin(an) * 1.3 * T); c.lineTo(cp[0] + Math.cos(an) * R * T, cp[1] + Math.sin(an) * R * T); c.stroke(); }
      sign(c, cp[0], cp[1] + T * 0.72, T * 0.62, '#2E2630', Math.max(2, T * 0.11)); sign(c, cp[0], cp[1] + T * 0.72, T * 0.62, '#C99A4A', Math.max(1.2, T * 0.06)); c.restore();
      c.strokeStyle = '#C99A4A'; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.arc(cp[0], cp[1], R * T, 0, Math.PI); c.stroke(); } }
    // the braziers' and the door's warmth, the vault's edges in shadow
    for (const [bx, by] of BRAZ) blob(c, P(bx + 0.5, by + 0.6), T * 3.2, '255,170,80', 0.16);
    blob(c, P(DOORX, DOORY), T * 5.5, '255,190,110', 0.1);
    { const p = P(FC.x, FC.y), g = c.createRadialGradient(p[0], p[1], T * 5, p[0], p[1], T * 10); g.addColorStop(0, 'rgba(6,6,24,0)'); g.addColorStop(1, 'rgba(6,6,24,.3)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
    c.restore(); }
  /* the court's floor: ivory flagstones in a running bond, obsidian processional bands on its two axes with gold borders, the
     carved rings round its heart (an ivory band of segments with twelve gold stars, an obsidian ring), the bull's sign in gold
     on an obsidian disc at its heart, stones lifted out by the pull; a dusk wash from the sun's side (kept mid-value) */
  const CT_TONES = ['#B2A48A', '#A99B81', '#B8AA90', '#A29378', '#AE9F85'];
  function courtFloor(c, X, Y, T, x, y) {
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip(); c.fillStyle = '#A99C84'; c.fillRect(X, Y, T, T);
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T], cp = P(AC.x, AC.y), dC = Math.hypot(x + 0.5 - AC.x, y + 0.5 - AC.y);
    // the flagstones
    const RH = 1.25, SW = 1.6; for (let j = Math.floor(y / RH) - 1; j <= Math.floor((y + 1) / RH); j++) { const o = (j % 2) * SW / 2; for (let i = Math.floor((x - o) / SW) - 1; i <= Math.floor((x + 1 - o) / SW); i++) { const sx = i * SW + o, sy = j * RH, a = P(sx, sy);
      c.fillStyle = CT_TONES[Math.floor(hh(i, j, 3) * CT_TONES.length)]; c.fillRect(a[0], a[1], SW * T, RH * T);
      const g = c.createLinearGradient(a[0], a[1], a[0] + SW * T, a[1] + RH * T); g.addColorStop(0, `rgba(255,240,214,${(0.1 + hh(i, j, 7) * 0.1).toFixed(3)})`); g.addColorStop(1, 'rgba(70,50,40,.12)'); c.fillStyle = g; c.fillRect(a[0], a[1], SW * T, RH * T);
      if (hh(i, j, 11) < 0.22) { const pts = []; let u = 0.2 + hh(i, j, 13) * 0.6; for (let k = 0; k <= 5; k++) { u = clamp(u + (hh(i * 7 + k, j, 17) - 0.5) * 0.25, 0.05, 0.95); pts.push([a[0] + u * SW * T, a[1] + k / 5 * RH * T]); } c.strokeStyle = 'rgba(48,34,28,.55)'; c.lineWidth = Math.max(0.8, T * 0.025); c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
      for (let k = 0; k < 3; k++) { const q = [a[0] + hh(i, j, 20 + k) * SW * T, a[1] + hh(i, j, 30 + k) * RH * T]; blob(c, q, T * (0.3 + hh(i, j, 40 + k) * 0.5), hh(i, j, 50 + k) < 0.5 ? '90,70,50' : '255,244,224', 0.07); }
      for (let k = 0; k < 10; k++) { const u = hh(x * 3 + k, y, 60), v = hh(x, y * 3 + k, 61); c.fillStyle = `rgba(70,52,40,${(0.15 + hh(x, y, 62 + k) * 0.25).toFixed(2)})`; c.fillRect(X + u * T, Y + v * T, Math.max(1, T * 0.02), Math.max(1, T * 0.02)); }
      c.strokeStyle = 'rgba(46,34,28,.55)'; c.lineWidth = Math.max(1, T * 0.045); c.strokeRect(a[0], a[1], SW * T, RH * T); c.strokeStyle = 'rgba(255,244,222,.28)'; c.lineWidth = Math.max(0.6, T * 0.016); c.beginPath(); c.moveTo(a[0] + 1, a[1] + RH * T - 1); c.lineTo(a[0] + 1, a[1] + 1.5); c.lineTo(a[0] + SW * T - 1, a[1] + 1.5); c.stroke(); } }
    // the processional bands (north-south and east-west): obsidian, gold borders, gold lozenges down their middle
    for (const ax of [0, 1]) { const d = ax ? (y + 0.5 - AC.y) : (x + 0.5 - AC.x); if (Math.abs(d) > 1.6) continue; const B = 0.8;
      c.fillStyle = '#2C2830'; if (ax) { const p = P(0, AC.y - B); c.fillRect(X, p[1], T, B * 2 * T); } else { const p = P(AC.x - B, 0); c.fillRect(p[0], Y, B * 2 * T, T); }
      for (const sgn of [-1, 1]) { c.strokeStyle = '#C99A4A'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); if (ax) { const p = P(0, AC.y + sgn * (B - 0.06)); c.moveTo(X, p[1]); c.lineTo(X + T, p[1]); } else { const p = P(AC.x + sgn * (B - 0.06), 0); c.moveTo(p[0], Y); c.lineTo(p[0], Y + T); } c.stroke(); }
      const t0 = ax ? x : y; for (let k = Math.floor(t0 / 1.5) - 1; k <= Math.floor((t0 + 1) / 1.5) + 1; k++) { const q = ax ? P(k * 1.5 + 0.75, AC.y) : P(AC.x, k * 1.5 + 0.75); c.save(); c.translate(q[0], q[1]); c.rotate(Math.PI / 4); c.fillStyle = '#B88A40'; c.fillRect(-T * 0.17, -T * 0.17, T * 0.34, T * 0.34); c.fillStyle = '#2C2830'; c.fillRect(-T * 0.09, -T * 0.09, T * 0.18, T * 0.18); c.restore(); }
      const sh = c.createLinearGradient(X, Y, X + T, Y + T); sh.addColorStop(0, 'rgba(140,130,170,.1)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sh; if (ax) { const p = P(0, AC.y - B); c.fillRect(X, p[1], T, B * 2 * T); } else { const p = P(AC.x - B, 0); c.fillRect(p[0], Y, B * 2 * T, T); } }
    // the heart: the rings, the band of segments with its twelve stars, the obsidian disc with the bull's sign
    if (dC < RINGS[2] + 1.2) {
      const ring = (r, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.arc(cp[0], cp[1], r * T, 0, TAU); c.stroke(); };
      if (dC < RINGS[1] + 1) { c.save(); c.beginPath(); c.arc(cp[0], cp[1], RINGS[1] * T, 0, TAU); c.clip(); c.fillStyle = '#B7AA90'; c.fillRect(X, Y, T, T);
        for (let k = 0; k < 24; k++) { const an = k / 24 * TAU; c.fillStyle = k % 2 ? 'rgba(255,240,214,.08)' : 'rgba(60,40,30,.06)'; c.beginPath(); c.moveTo(cp[0], cp[1]); c.arc(cp[0], cp[1], RINGS[1] * T, an, an + TAU / 24); c.closePath(); c.fill(); c.strokeStyle = 'rgba(46,34,28,.5)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(cp[0] + Math.cos(an) * RINGS[0] * T, cp[1] + Math.sin(an) * RINGS[0] * T); c.lineTo(cp[0] + Math.cos(an) * RINGS[1] * T, cp[1] + Math.sin(an) * RINGS[1] * T); c.stroke(); }
        for (let k = 0; k < 12; k++) { const an = k / 12 * TAU - Math.PI / 2, q = [cp[0] + Math.cos(an) * 2.82 * T, cp[1] + Math.sin(an) * 2.82 * T]; c.fillStyle = 'rgba(40,30,30,.5)'; c.beginPath(); c.arc(q[0], q[1], T * 0.26, 0, TAU); c.fill(); star8(c, q[0], q[1], T * (k === 0 ? 0.34 : 0.24), '#C99A4A'); star8(c, q[0] - T * 0.02, q[1] - T * 0.02, T * (k === 0 ? 0.14 : 0.09), 'rgba(255,236,180,.85)'); }
        c.fillStyle = '#26222C'; c.beginPath(); c.arc(cp[0], cp[1], RINGS[0] * T, 0, TAU); c.fill();
        const g = c.createRadialGradient(cp[0] - T * 0.6, cp[1] - T * 0.6, 0, cp[0], cp[1], RINGS[0] * T); g.addColorStop(0, 'rgba(120,110,150,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fill();
        for (let k = 0; k < 12; k++) { const an = (k + 0.5) / 12 * TAU; c.strokeStyle = 'rgba(201,154,74,.55)'; c.lineWidth = Math.max(0.8, T * 0.025); c.beginPath(); c.moveTo(cp[0] + Math.cos(an) * 1.45 * T, cp[1] + Math.sin(an) * 1.45 * T); c.lineTo(cp[0] + Math.cos(an) * 1.82 * T, cp[1] + Math.sin(an) * 1.82 * T); c.stroke(); }
        sign(c, cp[0], cp[1] + T * 0.1, T * 1.5, '#130F16', Math.max(3, T * 0.28)); sign(c, cp[0], cp[1] + T * 0.1, T * 1.5, '#C99A4A', Math.max(2, T * 0.16)); sign(c, cp[0] - T * 0.03, cp[1] + T * 0.07, T * 1.5, 'rgba(255,236,180,.7)', Math.max(0.8, T * 0.03)); c.restore(); }
      for (const [k, r] of RINGS.entries()) { ring(r, Math.max(3, T * (k === 1 ? 0.36 : 0.18)), 'rgba(20,14,18,.78)'); if (k === 1) ring(r, Math.max(2, T * 0.22), '#2C2830'); ring(r + (k === 1 ? 0.12 : 0), Math.max(1.2, T * 0.06), '#C99A4A'); if (k === 1) ring(r - 0.12, Math.max(1.2, T * 0.06), '#C99A4A'); ring(r + (k === 1 ? 0.12 : 0) - 0.02, Math.max(0.6, T * 0.016), 'rgba(255,236,180,.75)'); } }
    // the stones the pull has lifted out: dark hollows, broken edges, a warm light deep in them
    for (const h of HOLES) { if (Math.abs(h.x - x - 0.5) > 1.6 || Math.abs(h.y - y - 0.5) > 1.4) continue; const q = P(h.x, h.y), w = 1.25 * T, hgt = 0.85 * T;
      c.save(); c.translate(q[0], q[1]); c.rotate((hh(h.s, 1) - 0.5) * 0.3); c.fillStyle = '#1A1418'; c.beginPath(); for (let k = 0; k < 10; k++) { const an = k / 10 * TAU, rr = 1 + (hh(h.s, k, 5) - 0.5) * 0.18; c.lineTo(Math.cos(an) * w * 0.5 * rr * 1.1, Math.sin(an) * hgt * 0.5 * rr * 1.1); } c.closePath(); c.fill();
      const g = c.createRadialGradient(0, hgt * 0.1, 0, 0, 0, w * 0.55); g.addColorStop(0, 'rgba(255,150,60,.35)'); g.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(230,214,180,.5)'; c.lineWidth = Math.max(0.8, T * 0.025); c.stroke(); c.restore(); }
    // the dusk: warm from the sun's side (the north-west), violet on the far side, darkening a little toward the rim
    { const a = P(AC.x - 12, AC.y - 9), b = P(AC.x + 12, AC.y + 9), g = c.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, 'rgba(255,186,100,.2)'); g.addColorStop(0.5, 'rgba(255,186,100,0)'); g.addColorStop(1, 'rgba(70,50,120,.18)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
    { const r = Math.pow(se((x + 0.5 - AC.x) / ARX, (y + 0.5 - AC.y) / ARY), 1 / SEN); if (r > 0.7) { c.fillStyle = `rgba(40,24,30,${(0.28 * clamp((r - 0.7) / 0.3, 0, 1)).toFixed(3)})`; c.fillRect(X, Y, T, T); } }
    c.restore(); }
  /* the court's edge, laid over each chunk after its floors: what lies outside the rounded square is cut away (the sky shows
     there), then its rim: a bevelled lip, gold-edged, and under its near half the platform's thickness in strata, ivory
     over obsidian, with amber light from beneath */
  const SEP = []; for (let i = 0; i <= 160; i++) SEP.push(spt(i / 160 * TAU));
  const sePath = (c, T, k, dy, i0, i1, move) => { const st = i0 <= i1 ? 1 : -1; for (let i = i0; st > 0 ? i <= i1 : i >= i1; i += st) { const p = SEP[i], X = (AC.x + p[0] * (ARX - k)) * T, Y = (AC.y + p[1] * (ARY - k) + dy) * T; if (move && i === i0) c.moveTo(X, Y); else c.lineTo(X, Y); } };
  const EDGE = []; for (let y = 0; y <= WALLY; y++) for (let x = 0; x < W0 + 2; x++) { let n = 0; for (const [a, b] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) if (se((a - AC.x) / ARX, (b - AC.y) / ARY) <= 1) n++; if (n > 0 && n < 4 && y < WALLY) EDGE.push([x, y]); }
  function arenaEdge(c, T, d) {
    const x0 = d && d.n ? d.cx * d.n - 1 : -9, x1 = d && d.n ? (d.cx + 1) * d.n : 99, y0 = d && d.n ? d.cy * d.n - 1 : -9, y1 = d && d.n ? (d.cy + 1) * d.n : 99;
    for (const [x, y] of EDGE) if (x >= x0 && x <= x1 && y >= y0 && y <= y1) courtFloor(c, x * T, y * T, T, x, y);
    c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.rect(-T * 4, -T * 4, (W0 + 10) * T, (WALLY + 4) * T); sePath(c, T, 0, 0, 0, 160, true); c.closePath(); c.fill('evenodd'); c.restore();
    const TH = 0.95; c.save(); c.beginPath(); c.rect(-T * 4, AC.y * T, (W0 + 10) * T, (WALLY - AC.y) * T); c.clip();
    c.beginPath(); sePath(c, T, 0, 0, 0, 80, true); sePath(c, T, 0, TH, 80, 0, false); c.closePath();
    const g = c.createLinearGradient(0, (AC.y + ARY - 0.7) * T, 0, (AC.y + ARY + TH) * T); g.addColorStop(0, '#C4B79C'); g.addColorStop(0.3, '#958670'); g.addColorStop(0.5, '#3A3238'); g.addColorStop(0.8, '#221C24'); g.addColorStop(1, '#5A3A2A'); c.fillStyle = g; c.fill();
    c.save(); c.clip(); c.lineWidth = Math.max(1, T * 0.03); for (const k of [0.18, 0.36, 0.62]) { c.strokeStyle = k > 0.5 ? 'rgba(120,100,120,.35)' : 'rgba(60,44,34,.4)'; c.beginPath(); sePath(c, T, 0, TH * k, 2, 78, true); c.stroke(); }
      c.strokeStyle = '#C99A4A'; c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); sePath(c, T, 0, TH * 0.46, 2, 78, true); c.stroke(); c.strokeStyle = 'rgba(255,236,180,.6)'; c.lineWidth = Math.max(0.6, T * 0.015); c.beginPath(); sePath(c, T, 0, TH * 0.44, 2, 78, true); c.stroke();
      for (let i = 4; i < 78; i += 3) { const p = SEP[i], X = (AC.x + p[0] * ARX) * T, Y = (AC.y + p[1] * ARY) * T; c.strokeStyle = 'rgba(40,30,26,.4)'; c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(X, Y + TH * 0.04 * T); c.lineTo(X, Y + TH * 0.42 * T); c.stroke(); } c.restore();
    c.restore();
    c.save(); c.beginPath(); c.rect(-T * 4, -T * 4, (W0 + 10) * T, (WALLY + 4) * T); c.clip();
    c.strokeStyle = 'rgba(40,28,24,.65)'; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); sePath(c, T, 0.03, 0, 0, 160, true); c.stroke();
    c.strokeStyle = 'rgba(255,240,214,.6)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); sePath(c, T, 0.13, 0, 82, 158, true); c.stroke();
    c.strokeStyle = 'rgba(201,154,74,.8)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); sePath(c, T, 0.34, 0, 0, 160, true); c.stroke(); c.restore(); }
  /* the vault's wall faces: ivory courses on an obsidian base, a bronze band with gold studs, warmer by the door */
  function vaultWall(c, X, Y, T, H, h, x) {
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, '#D6CAAE'); g.addColorStop(0.55, '#AE9F83'); g.addColorStop(1, '#6E6150'); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    const n = 4; for (let i = 1; i < n; i++) { const yy = Y + H * 0.82 * i / n; c.fillStyle = 'rgba(60,44,34,.4)'; c.fillRect(X, yy, T + 0.5, Math.max(1, H * 0.018)); c.fillStyle = 'rgba(255,246,226,.25)'; c.fillRect(X, yy + Math.max(1, H * 0.018), T + 0.5, Math.max(1, H * 0.01)); const jx = X + T * ((i + x) % 2 ? 0.3 : 0.8); c.fillStyle = 'rgba(60,44,34,.35)'; c.fillRect(jx, yy - H * 0.82 / n, Math.max(1, T * 0.03), H * 0.82 / n); }
    c.fillStyle = '#2A2530'; c.fillRect(X, Y + H * 0.82, T + 0.5, H * 0.18); c.fillStyle = '#C99A4A'; c.fillRect(X, Y + H * 0.82, T + 0.5, Math.max(1, H * 0.02));
    c.fillStyle = '#6A4A2A'; c.fillRect(X, Y + H * 0.1, T + 0.5, H * 0.06); c.fillStyle = '#D8A85A'; c.beginPath(); c.arc(X + T * 0.5, Y + H * 0.13, Math.max(1.2, T * 0.05), 0, TAU); c.fill();
    const dv = Math.abs(x + 0.5 - DOORX); if (dv < 6) { c.fillStyle = `rgba(255,170,80,${(0.16 * (1 - dv / 6)).toFixed(3)})`; c.fillRect(X, Y, T + 0.5, H); } }
  const noCliff = () => {};

  /* ======================= the lands and the sky ======================= */
  const land = (name, o) => Object.assign({ name, rift: true, tile: 'heaven', out: false, dark: 0, bg: '#2A1E36', gap: 'tgsky', ambient: 'motes', accent: GOLD, light: '#FFF4D8', hazard: 'spikes', grade: null, fog: '#2A1E36', darkRGB: '42,30,54', props: [], deco: GOLD, mud: ['#8E8068', '#7E7058'] }, o);
  BIOMES.meadow = land('The Star Vault', { floorFn: (c, X, Y, T, h, h2, x, y) => vaultFloor(c, X, Y, T, x, y), wallFn: (c, X, Y, T, H, h, x) => vaultWall(c, X, Y, T, H, h, x), cliffTint: noCliff,
    floor: ['#232C63', '#232C63', '#232C63'], grout: '#141838', hi: '#DCE8FF', top: '#3A3340', face: '#BFB39A', faceD: '#5A5048', cliff: '#2E2632', bridgeCol: '#B9AD93' });
  BIOMES.taurcourt = land('The Court of the World Pillar', { floorFn: (c, X, Y, T, h, h2, x, y) => courtFloor(c, X, Y, T, x, y), cliffTint: noCliff, light: '#FFE6B8',
    floor: ['#A99C84', '#A99C84', '#A99C84'], grout: '#2C2830', hi: '#FFF0D8', top: '#5A4E44', face: '#B7AA90', faceD: '#3A3238', cliff: '#2A2228', bridgeCol: '#B7AA90' });
  for (const id of ['meadow', 'taurcourt']) { if (!BIOME_ORDER.includes(id)) BIOME_ORDER.push(id); if (typeof DARK_COL !== 'undefined') DARK_COL[id] = '42,30,54'; }
  window.DECAL_EXT = window.DECAL_EXT || {};
  DECAL_EXT.tgedge = (c, d, s, lw, T) => arenaEdge(c, T, d);
  /* the sky: dusk, deep violet above and gold below, clouds of gold dust, faint stars, the low sun (its picture, TAURUS_PROPS)
     with its halo and two golden rings turning round it on the GPU */
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.tgsky = { base: '#2A1E36',
    paint(c, S, R) { c.fillStyle = '#3A2640'; c.fillRect(0, 0, S, S); const wrap = f => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) f(ox, oy); };
      for (let i = 0; i < 12; i++) { const x = R() * S, y = R() * S, w = 40 + R() * 80, col = R() < 0.6 ? '255,170,90' : '210,110,150', a = 0.06 + R() * 0.08; wrap((ox, oy) => { c.save(); c.translate(x + ox, y + oy); c.scale(1, 0.4); const g = c.createRadialGradient(0, 0, 0, 0, 0, w); g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(-w, -w, w * 2, w * 2); c.restore(); }); }
      for (let i = 0; i < 90; i++) { const x = R() * S, y = R() * S, z = R(), s = z > 0.92 ? 1.6 : 1; c.fillStyle = `rgba(${z > 0.7 ? '255,230,180' : '230,210,255'},${(0.2 + z * 0.55).toFixed(2)})`; c.fillRect(x, y, s, s); } },
    back(c, o) { const { pat, grad, pattern, k, P, W, H, t, wx, wy, bigGlow } = o; grad('#1E1636', '#B06A3A');
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45; bigGlow(c, P, '#E08A3A', W * 0.3 - W * 0.9 - (wx * 0.06) % (W * 0.5), H * 0.35 - (wy * 0.05) % (H * 0.3), W * 1.9); c.globalAlpha = 0.22; bigGlow(c, P, '#8A4A9A', W * 0.4 - (wx * 0.1) % W, H * 0.05 - (wy * 0.08) % (H * 0.4), W * 1.2); c.restore();
      pat(pattern('tgsky', k), 0.26, t * 0.5, 0);
      const C = CUR, T = C && C.X ? C.X.Tz() : 48, Rs = T * (TP() ? TP().SUN_R : 2.6), par = 0.5, mx = W / 2 + (SUNW.x * T - wx) * par, my = H / 2 + (SUNW.y * T - wy) * par;
      if (mx > -Rs * 4 && mx < W + Rs * 4 && my > -Rs * 4 && my < H + Rs * 4) { const F = !lowFx() ? fgx() : null;
        if (F) { try { const Q = F.begin(c, null); Q.quad(139, mx, my, Rs * 3.4, 0, 0, Rs * 3.4, '#FFB45A', 0.95, 1 / 3.4, 2.7, 1.1); Q.glow(mx, my, Rs * 2.4, '#FF9A40', 0.3);
          for (let i = 0; i < 2; i++) { const r = Rs * (1.75 + i * 0.5), ph = t * (0.05 + i * 0.03); Q.ring(mx, my, r, '#FFD58A', 0.34 - i * 0.1, Rs * 0.05, 0.2 + 0.04 * Math.sin(ph)); }
          F.flush(c); } catch (e) {} }
        const tp = TP(); if (tp) tp.draw(c, 'sun', 0, mx, my, Rs); } } };

  /* ======================= the stage ======================= */
  let CUR = null;   // (the running stage: the sky reads its camera; let go when the stage closes)
  const OPEN_T = 5.2, SEAL_T = 1.3;
  /* the three skies: stars in a 12×9 field (tile units), lines as pairs of star indices; start: a star to begin at;
     bridge: [line, star] the line to cross before the star wakes */
  const SKIES = [
    { name: 'The Lantern', stars: [[3, 7], [9, 7], [9, 3], [3, 3], [6, 1]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3], [3, 4], [4, 2]], tip: 'Five stars, eight lines. Two stars have an odd number of lines: the thread must begin at one of them' },
    { name: 'The Twin Horns', stars: [[2, 6], [4, 2], [6, 5], [8, 2], [10, 6], [6, 8]], lines: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 2], [4, 5], [5, 0]], start: 0, tip: 'Begin at the bright star. Eight lines through six stars; one wrong turn strands a horn' },
    { name: 'The Bull\'s Eye', stars: [[2, 3], [2, 7], [5, 5], [8, 5], [11, 3], [11, 7], [8, 1]], lines: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3], [3, 6], [6, 4]], bridge: [3, 6], tip: 'Nine lines. The dark star wakes only once the bridge between the two eyes is crossed' },
  ];
  defGate('garden', {
    name: 'The Unbroken Constellation', biome: 'meadow', goal: 'Trace every line of three constellations without lifting the thread', how: 'Stars stand on the floor, joined by dotted lines. Stand beside a star to begin the thread there, then walk to a star joined to it: the line between them turns to solid gold. Trace every line exactly once. You may come back to a star as often as you like; you may never walk a line twice. The thread goes on from its last star, wherever your pet is. Stranded with lines left? Use Undo to take the last line back (or Start over). Three skies: a small one; one with a star you must begin at; one with a bridge that must be crossed before a dark star wakes. Trace all three and the great door opens: what waits beyond it must be faced to wake Taurus.',
    layout: LAYOUT,
    legend: { A: {}, D: { tile: T_SOLID }, d: { tile: T_SOLID }, P: { prop: 'tgruin' }, C: { prop: 'tgcolumn' } },
    // (the loading screen paints every picture at the floor's sharpness: nothing is painted mid-play)
    preload(P) { const tp = TP(), out = tp && P && P.T ? tp.warm(P.T * (P.k || 1)) : [];   /* (v447 K: and the boss's 3D model, built and on the GPU before the fight, not as it starts) */
      try { if (P && P.gl && typeof BELIAL_GL !== 'undefined' && BELIAL_GL.usable()) out.push(() => { try { BELIAL_GL.warm(); } catch (e) {} }); } catch (e) {} return out; },
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, MW = M.MW, MH = M.MH;
      const R = { sky: 0, path: [], used: new Set(), t: 0, mode: 'intro', el: null, flashT: 0, msgT: 0, tr: new Map(), loadT: -9 };
      const S = { phase: 'puzzle', t: 0, open: 0, seal: 0, lit: 0, litK: [0, 0, 0], openT: 0, sealT: 0, passable: false, mist: [], fade: 1, archFade: 1, dt: 0.016 };
      let K = null, stars = [], lines = [];
      // the lands: the court's tiles its own, the rest the vault's; the court's edge laid over every ground chunk it crosses; the void all round
      { const li = BIOME_ORDER.indexOf('taurcourt'), ni = BIOME_ORDER.indexOf('meadow'); for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) M.BI[y * MW + x] = y <= 20 ? li : ni; }
      if (M.decalsByChunk && typeof DunWorld !== 'undefined') { const CHn = DunWorld.CH || 8; for (let cy = 0; cy <= Math.floor((WALLY + 1) / CHn); cy++) for (let cx = 0; cx <= Math.floor((MW - 1) / CHn); cx++) { const key = cx + ',' + cy, L = M.decalsByChunk.get(key) || []; L.push({ kind: 'tgedge', x: 0, y: 0, s: 1, rot: 0, cx, cy, n: CHn }); M.decalsByChunk.set(key, L); } }
      M.fill = T_GAP; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (x === 0 || y === 0 || x === MW - 1 || y === MH - 1) X.setTile(x, y, T_GAP);
      // the braziers and the arch's piers stand solid (tiles held by a prop that draws nothing: never a wall)
      for (const [x, y] of BRAZ.concat(ARCH.piers, PIERS.map(p => [p.tx, p.ty]))) { X.setTile(x, y, T_SOLID); M.props.set(y * MW + x, 'tgnone'); }
      const doorTiles = [[15, WALLY], [16, WALLY], [17, WALLY]];
      CUR = { X, S };
      try { X.F.name = 'The Gate of Taurus'; } catch (e) {}
      // (the Garden's own pictures, warmed for its stages by the rift's loading pass, are not drawn here: given back at once)
      try { if (typeof GARDEN_PROPS !== 'undefined' && GARDEN_PROPS.release) GARDEN_PROPS.release(); } catch (e) {}

      /* ---- the puzzle (the same rules, words and buttons as ever) ---- */
      const at = i => ({ x: stars[i].x, y: stars[i].y });
      const degree = i => lines.filter(l => l.a === i || l.b === i).length;
      const lineBetween = (i, j) => lines.find(l => (l.a === i && l.b === j) || (l.a === j && l.b === i));
      const end = () => (R.path.length ? R.path[R.path.length - 1] : -1);
      const awake = i => !(K.bridge && i === K.bridge[1] && !R.used.has(K.bridge[0]));
      function load(n) { K = SKIES[n]; R.sky = n; R.path = []; R.used = new Set(); R.tr.clear(); R.loadT = R.t; stars = K.stars.map(([x, y], i) => ({ x: x + OX, y: y + OY, i })); lines = K.lines.map(([a, b], i) => ({ a, b, i }));
        X.banner(K.name.toUpperCase(), `Sky ${n + 1} of 3 · ${K.tip}`, GOLD, 3.2, true, true); X.sfx.chirp(); buttons(); }
      function msg(s, col) { X.text(me.x, me.y - 1.6, s, col || PALE, 12); }
      function visit(i) { const e = end();
        if (e < 0) { if (K.start != null && i !== K.start) { msg('The thread must begin at the bright star', '#FF9BD2'); X.sfx.wrong(); return; } if (!awake(i)) { msg('That star is dark: cross the bridge first', '#B98BE0'); X.sfx.wrong(); return; } R.path.push(i); X.sfx.sparkle(); X.ring(stars[i].x, stars[i].y, 0.3, 1.6, 0.4, GOLD, 0.3); msg('The thread begins', GOLD); buttons(); return; }
        if (i === e) return;
        const L = lineBetween(e, i);
        if (!L) { msg('No line joins those two stars', '#FF9BD2'); X.sfx.wrong(); return; }
        if (R.used.has(L.i)) { msg('That line is already traced: a line is never walked twice', '#FF9BD2'); X.sfx.wrong(); return; }
        if (!awake(i)) { msg('That star is dark until the bridge is crossed', '#B98BE0'); X.sfx.wrong(); return; }
        R.used.add(L.i); R.tr.set(L.i, { t0: R.t, from: e }); R.path.push(i); X.sfx.coin(); X.sparks(stars[i].x, stars[i].y - 0.4, GOLD, 8, 4); R.flashT = 0.4; buttons();
        if (K.bridge && L.i === K.bridge[0]) { X.banner('THE BRIDGE IS CROSSED', 'The dark star wakes', GOLD, 1.8, true); X.ring(stars[K.bridge[1]].x, stars[K.bridge[1]].y, 0.3, 2, 0.5, GOLD, 0.3); }
        if (R.used.size === lines.length) { done(); return; }
        const open = lines.some(l => !R.used.has(l.i) && (l.a === i || l.b === i) && awake(l.a === i ? l.b : l.a));
        if (!open) { X.banner('STRANDED', `${lines.length - R.used.size} line${lines.length - R.used.size === 1 ? '' : 's'} left and none from here · Undo`, '#FF9BD2', 2.2, true); X.sfx.wrong(); } }
      function undo() { if (R.path.length <= 1) { R.path = []; buttons(); return; } const i = R.path.pop(), e = end(), L = lineBetween(e, i); if (L) { R.used.delete(L.i); R.tr.delete(L.i); } X.sfx.boop(); msg('Undone', PALE); buttons(); }
      function restart() { R.path = []; R.used = new Set(); R.tr.clear(); X.sfx.whoosh(); msg('The sky is cleared', PALE); buttons(); }
      function done() { X.banner(`${K.name.toUpperCase()} SHINES`, R.sky < 2 ? 'Every line traced · the next sky' : 'Every line traced', '#8FE0A6', 2.4, true); X.sfx.fanfare(); X.flash(0.3, GOLD); for (const s of stars) X.sparks(s.x, s.y - 0.4, GOLD, 6, 4);
        S.lit = R.sky + 1; chime(S.lit);
        if (R.sky < 2) { R.mode = 'between'; X.after(2.6, () => { R.mode = 'play'; load(R.sky + 1); }); }
        else { R.mode = 'won'; buttons(); X.after(1.2, () => { X.banner('THE CONSTELLATION HOLDS', 'Taurus stands among the stars · the great door wakes', GOLD, 2.8, true, true); X.sfx.fanfare(); }); X.after(2.4, () => startOpen()); } }
      function buttons() { let el = R.el; if (!el) { el = document.createElement('div'); el.className = 'rift-match rift-trace'; el.id = 'riftTrace'; document.querySelectorAll('.rift-trace').forEach(e => e.remove()); document.getElementById('arcade').appendChild(el); R.el = el; el.addEventListener('click', ev => { if (ev.target.closest('[data-undo]')) undo(); else if (ev.target.closest('[data-restart]')) restart(); }); }
        if (self.done || R.mode === 'won') { el.remove(); R.el = null; return; } el.innerHTML = `<button type="button" class="btn" data-undo ${R.path.length ? '' : 'disabled'}>↶ Undo</button><button type="button" class="btn" data-restart ${R.path.length ? '' : 'disabled'}>Start over</button>`; }
      X.after(1.2, () => { R.mode = 'play'; load(0); });
      const note = (f, d, ty, v, f1, dl) => { try { if (X.sfx && X.sfx.note) X.sfx.note(f, d, ty, v, f1, dl); } catch (e) {} };
      function chime(n) { const base = [392, 494, 587][clamp(n - 1, 0, 2)]; note(base, 1.4, 'sine', 0.2); note(base * 2, 0.8, 'sine', 0.07); note(base * 1.5, 1.1, 'triangle', 0.05, null, 0.06); }

      /* ---- the great door ---- */
      function setDoor(open) { for (const [x, y] of doorTiles) X.setTile(x, y, open ? T_FLOOR : T_SOLID); S.passable = open; try { X.retile(); } catch (e) {} }
      function startOpen() { if (S.phase !== 'puzzle') return; S.phase = 'opening'; if (X.prepTiles) X.prepTiles(doorTiles.map(([x, y]) => [x, y, T_FLOOR]));   /* (v447 K: the open door's floor painted ahead, no glitch as it opens) */ S.openT = 0; S.lit = 3; X.flash(0.25, '#FFF4D8'); X.sfx.fanfare(); X.ring(DOORX, DOORY + 0.6, 0.3, 4, 0.8, GOLD, 0.4); }
      function opened() { S.phase = 'open'; X.banner('THE GREAT DOOR OPENS', 'Beyond it waits the Court of the World Pillar', DUSK, 2.6, true, true); }
      function seal() { if (S.phase !== 'open') return; S.phase = 'sealing'; if (X.prepTiles) X.prepTiles(doorTiles.map(([x, y]) => [x, y, T_SOLID])); S.sealT = 0; X.sfx.whoosh && X.sfx.whoosh(); }
      function sealed() {
        if (me.y > WALLY - 0.6) me.y = WALLY - 0.7; setDoor(false); X.shake(9, 0.5); X.sfx.thud && X.sfx.thud(); note(98, 2.4, 'sine', 0.3); note(49, 2.8, 'sine', 0.2);
        const B = TB(); if (B && typeof B.begin === 'function') { S.phase = 'boss'; X.banner('THE COURT IS SEALED', 'The door is shut behind you', DUSK, 2.4, true, true);
          try { B.begin(X, H, self, { cx: AC.x, cy: AC.y, r: ARY, rx: ARX, ry: ARY, ax0: AC.x - ARX + 0.5, ay0: AC.y - ARY + 0.5, ax1: AC.x + ARX - 0.5, ay1: WALLY - 0.5, door: { x: DOORX, y: WALLY - 0.5 } }); } catch (e) { if (typeof console !== 'undefined') console.error(e); win(); } }
        else win(); }
      function win() { if (self.done) return; self.done = true; S.phase = 'won'; X.banner('THE CONSTELLATION HOLDS', 'Taurus wakes over the Court of the World Pillar', GOLD, 2.8, true, true); X.flash(0.4, '#FFFFFF'); X.sfx.fanfare(); X.ring(me.x, me.y, 0.3, 6, 0.9, GOLD, 0.4); X.after(2.6, () => X.winStage()); }

      /* ---- the objects: the stars' daises, the door, the braziers, the arches, the monoliths and debris, the light over all ---- */
      const starObjs = [];
      for (let i = 0; i < 7; i++) starObjs.push(H.obj({ x: -9, y: -9, kind: 'star', i, r: 0.9, h: 1.3, label: o => (stars[o.i] && R.mode !== 'won' ? (end() < 0 ? (K.start === o.i ? 'The bright star: begin here' : K.start != null ? '' : 'Begin here') : end() === o.i ? 'The thread ends here' : '') : ''), use(o) { if (R.mode === 'play' && stars[o.i]) visit(o.i); },
        draw(c, Xs, Ys, T) { if (!stars[i]) return; const tp = TP(); if (tp) tp.draw(c, 'node', 0, Xs, Ys, T, { alpha: ease((R.t - R.loadT) / 0.5) }); } }));
      const door = H.obj({ x: DOORX, y: DOORY - 0.02, kind: 'tgdoor', r: 0, h: 5, label: '',
        draw(c, Xs, Ys, T) { const tp = TP(); if (!tp) return; const G = tp.GEO, Yf = X.sy(DOORY), k = ease(S.open), off = k * (G.WO + 0.14) * T, a = S.fade;
          c.save(); c.globalAlpha *= a; c.beginPath(); c.rect(Xs - G.WO * T, Yf - (G.L0 + 0.15) * T, G.WO * 2 * T, (G.L0 + 0.6) * T); c.clip(); tp.draw(c, 'leaf', 'l', Xs - off, Yf, T); tp.draw(c, 'leaf', 'r', Xs + off, Yf, T); c.restore();
          tp.draw(c, 'door', 0, Xs, Yf, T, { alpha: a }); } });
      const brz = BRAZ.map(([x, y]) => H.obj({ x: x + 0.5, y: y + 0.62, kind: 'tgbrazier', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = TP(); if (tp) tp.draw(c, 'brazier', 0, Xs, Ys, T); } }));
      const arch = H.obj({ x: ARCH.x, y: ARCH.y, kind: 'tgarch', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = TP(); if (tp) tp.draw(c, 'arch', 0, Xs, Ys, T, { alpha: S.archFade }); } });
      const piers = PIERS.map(p => H.obj({ x: p.x, y: p.y, kind: 'tgpier', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = TP(); if (tp) tp.draw(c, 'arch', 1, Xs, Ys, T, { sx: p.m }); } }));
      const monos = MONO.map(q => H.obj({ x: q.x, y: q.y, kind: 'tgmonolith', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = TP(); if (!tp) return; const t = g.t, bob = Math.sin(t * 0.7 + q.ph) * 0.2, lift = T * (q.lift + bob), sc = T * q.s;
        const deb = k => { const an = t * 0.35 * q.dir + q.ph + k * Math.PI, dx = Math.cos(an) * 0.85 * q.s, dz = Math.sin(an); return { dz, x: Xs + dx * T, y: Ys - lift - T * (0.9 * q.s) + dz * T * 0.22 * q.s, v: (q.v + k + 1) % 3 }; };
        const d = [deb(0), deb(1)]; for (const e of d) if (e.dz < 0) tp.draw(c, 'debris', e.v, e.x, e.y, sc * 0.9);
        tp.draw(c, 'monolith', q.v, Xs, Ys - lift, sc, { rot: Math.sin(t * 0.3 + q.ph) * 0.06 });
        for (const e of d) if (e.dz >= 0) tp.draw(c, 'debris', e.v, e.x, e.y, sc * 0.9); } }));
      const lifted = HOLES.map(h => H.obj({ x: h.x, y: h.y + 0.4, kind: 'tgdebris', r: 0, label: '', draw(c, Xs, Ys, T) { const tp = TP(); if (!tp) return; const t = g.t, bob = Math.sin(t * 0.9 + h.s) * 0.15; for (let k = 0; k < 3; k++) { const an = t * 0.25 + k * 2.1 + h.s, r = 0.35 + k * 0.12; tp.draw(c, 'debris', (h.s + k) % 3, Xs + Math.cos(an) * r * T, Ys - T * (1.0 + k * 0.4 + bob) + Math.sin(an) * r * T * 0.3, T * (0.8 - k * 0.12), { rot: t * 0.2 * (k % 2 ? 1 : -1) + k }); } } }));
      H.obj({ x: AC.x, y: 1e6, kind: 'tglight', r: 0, label: '', draw(c) { if (fgx()) { lightOver(c); labels(c); } } });
      X.after(2.6, () => { if (R.mode === 'intro' || R.mode === 'play') X.banner('THE STAR VAULT', 'Stand beside a star: trace every line of the constellation', GOLD, 2.4, true, true); });

      /* ---- the GPU light ---- */
      const onScr = (x, y, r) => { const T = X.Tz(), Xs = X.sx(x), Ys = X.sy(y), Rr = r * T; return Xs + Rr > -T && Xs - Rr < X.W() + T && Ys + Rr > -T * 3 && Ys - Rr < X.H() + T * 3; };
      const SL = 0.62;   // (a star floats this far over its dais)
      // a line's light: traced lines grow from the star they were walked from, then hold a running pulse
      function lineLight(Q, l, T, t, lf) { const A = at(l.a), B = at(l.b), x0 = X.sx(A.x), y0 = X.sy(A.y), x1 = X.sx(B.x), y1 = X.sy(B.y), tr = R.tr.get(l.i), bridge = K.bridge && l.i === K.bridge[0];
        if (!R.used.has(l.i) || !tr) { const col = bridge ? '#C59BFF' : '#8FA8FF'; Q.beam(x0, y0, x1, y1, T * 0.3, col, bridge ? 0.1 : 0.06); Q.beam(x0, y0, x1, y1, T * 0.07, col, bridge ? 0.5 : 0.32);
          if (!lf) { const u = ((t * 0.25 + l.i * 0.37) % 1); Q.glow(lerp(x0, x1, u), lerp(y0, y1, u), T * 0.22, col, 0.35 * Math.sin(u * Math.PI)); } return; }
        const fwd = tr.from === l.a, sx = fwd ? x0 : x1, sy = fwd ? y0 : y1, ex = fwd ? x1 : x0, ey = fwd ? y1 : y0, u = ease((R.t - tr.t0) / 0.4), mx = lerp(sx, ex, u), my = lerp(sy, ey, u);
        Q.beam(sx, sy, mx, my, T * 0.55, AMBER, 0.2); Q.beam(sx, sy, mx, my, T * 0.14, GOLD, 0.85); Q.beam(sx, sy, mx, my, T * 0.04, '#FFFFFF', 0.7);
        if (u < 1) Q.glow(mx, my, T * 0.5, '#FFF2C8', 0.8); else if (!lf) { const v = ((t * 0.4 + l.i * 0.29) % 1); Q.glow(lerp(sx, ex, v), lerp(sy, ey, v), T * 0.3, '#FFF2C8', 0.45 * Math.sin(v * Math.PI)); } }
      function lightGround(c) { const F = fgx(); if (!F) return; const lf = lowFx(), T = X.Tz(), t = g.t; let Q = null; const q = () => Q || (Q = F.begin(c, null));
        // the vault: the star chart's running light, a faint shimmer of the sky in its stone, the lines, pools of starlight under the daises, the braziers' warmth
        if (onScr(FC.x, FC.y, 8)) { const Q2 = q(), fx = X.sx(FC.x), fy = X.sy(FC.y);
          if (!lf) { Q2.quad(136, fx, fy, T * 5.8, 0, 0, T * 5.8, '#7F98FF', 0.32 + 0.12 * (S.lit / 3), 1.3, 0); Q2.caustic(fx, fy, T * 6.5, '#6F86FF', 0.05, 4.1, 1); }
          if (K) { for (const l of lines) lineLight(Q2, l, T, t, lf); stars.forEach((s, i) => { const dark = !awake(i); Q2.glow(X.sx(s.x), X.sy(s.y), T * 1.2, dark ? VIOLET : end() === i ? '#FFE8A0' : '#AFC0FF', dark ? 0.08 : 0.18, 0.45); }); }
          for (const o of brz) Q2.glow(X.sx(o.x), X.sy(o.y), T * 2.6, AMBER, 0.2 + 0.04 * Math.sin(t * 7 + o.x), 0.45); }
        // the door: its threshold warm; once open, dusk light falling across the vault's floor and gold dust rolling out over it
        if (onScr(DOORX, DOORY, 7)) { const Q2 = q(), dx = X.sx(DOORX), dy = X.sy(DOORY), o = ease(S.open);
          Q2.glow(dx, dy + T * 0.6, T * 3.4, AMBER, 0.1 + 0.2 * Math.max(S.lit / 3 * 0.6, o), 0.45);
          if (o > 0.02) { Q2.quad(138, dx, dy + T * 3.6, T * 4.6, 0, 0, T * 3.8, '#FFD9A0', 0.55 * o, 0.48, 2.1, lf ? 0 : 0.8); Q2.caustic(dx, dy + T * 2.2, T * 3.2, '#FFC880', 0.18 * o, 7.7, 0.5); }
          if (!lf) for (const m of S.mist) Q2.quad(137, X.sx(m.x), X.sy(m.y), T * m.r, 0, 0, T * m.r * 0.45, '#D8A868', m.a, m.dr, m.sd, 0.8); }
        // the court: its rings' running light, the sign's glow, the pull's ripples from its heart, warm haze at its rim, light from the hollows
        if (onScr(AC.x, AC.y, ARX + 3)) { const Q2 = q(), ax = X.sx(AC.x), ay = X.sy(AC.y);
          Q2.glow(ax, ay, T * 2.4, AMBER, 0.12 + 0.05 * Math.sin(t * 1.1), 1);
          if (!lf) { Q2.quad(136, ax, ay, T * 6.4, 0, 0, T * 6.4, '#FFB860', 0.3, 0.7, 0.4);
            for (let i = 0; i < 2; i++) { const u = ((t * 0.12 + i * 0.5) % 1); Q2.ripple(ax, ay, T * (1.5 + u * 8), '#FFD080', 0.22 * Math.sin(u * Math.PI), i * 3 + 1, 1, 0.08); }
            for (let i = 0; i < 8; i++) { const a = -Math.PI + (i + 0.5) / 8 * TAU + Math.sin(t * 0.06 + i) * 0.1, p = spt(a), mx = AC.x + p[0] * ARX * 0.94, my = AC.y + p[1] * ARY * 0.94; if (my > WALLY - 1) continue; Q2.quad(137, X.sx(mx), X.sy(my), T * 3.2, 0, 0, T * 1.3, '#C89870', 0.55, 0.5 * (i % 2 ? 1 : -1), i * 2.3, 0.8); } }
          for (const h of HOLES) Q2.glow(X.sx(h.x), X.sy(h.y), T * 1.0, '#FF9A40', 0.22 + 0.06 * Math.sin(t * 1.7 + h.s), 0.6);
          for (const p of X.props || []) if (p.kind === 'tgruin' && !p.broken) Q2.glow(X.sx(p.x), X.sy(p.y), T * 1.3, DUSK, 0.08, 0.45); }
        if (Q) F.flush(c); }
      function lightOver(c) { const F = fgx(); if (!F) return; const lf = lowFx(), T = X.Tz(), t = g.t; let Q = null; const q = () => Q || (Q = F.begin(c, null));
        // the stars (always: they are the puzzle's own light) and the thread from the last one to the pet
        if (K && onScr(FC.x, FC.y, 8)) { const Q2 = q(), fa = ease((R.t - R.loadT) / 0.5);
          stars.forEach((s, i) => { const Xs = X.sx(s.x), Ys = X.sy(s.y) - T * SL, isEnd = end() === i, inPath = R.path.includes(i), dark = !awake(i), bright = K.start === i, br = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.3);
            if (dark) { Q2.glow(Xs, Ys, T * 0.7, VIOLET, 0.22 * fa); Q2.star(Xs, Ys, T * 0.28, 0.25 * fa, '#D8C8FF'); return; }
            const col = isEnd ? '#FFFFFF' : inPath ? GOLD : bright ? '#FFFFFF' : '#FFF0C8', k = isEnd ? 0.85 + 0.15 * Math.sin(t * 6) : inPath ? 0.6 : 0.45;
            Q2.glow(Xs, Ys, T * (bright && !inPath ? 1.25 : 0.95), isEnd || inPath ? GOLD : '#BFD0FF', (0.3 + 0.12 * br) * k * fa); Q2.glow(Xs, Ys, T * 0.32, col, 0.8 * k * fa); Q2.star(Xs, Ys, T * (bright ? 0.62 : 0.46) * (0.9 + 0.1 * br), (0.65 + 0.3 * k) * fa, col);
            if (R.flashT > 0 && isEnd) Q2.glow(Xs, Ys, T * 1.6, GOLD, R.flashT * 1.2); });
          const e = end(); if (e >= 0 && R.mode === 'play') { const s = stars[e], x0 = X.sx(s.x), y0 = X.sy(s.y) - T * SL, x1 = X.sx(me.x), y1 = X.sy(me.y) - T * 0.6, cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - T * 0.5, a = 0.55 + 0.2 * Math.sin(t * 5);
            let px = x0, py = y0; for (let k = 1; k <= 6; k++) { const u = k / 6, nx = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cx + u * u * x1, ny = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * cy + u * u * y1; Q2.beam(px, py, nx, ny, T * 0.06, GOLD, a); px = nx; py = ny; } Q2.glow(x1, y1, T * 0.35, GOLD, 0.4 * a); } }
        // the braziers' fire
        for (const o of brz) { if (!onScr(o.x, o.y - 1, 2)) continue; const Q2 = q(), bx = X.sx(o.x), by = X.sy(o.y) - T * 1.05; Q2.fire(bx, by - T * 0.25, T * 0.55, 0.75, lf ? 0.6 : 0.9, o.x, 1.4); Q2.glow(bx, by, T * 1.2, AMBER, 0.3 + 0.06 * Math.sin(t * 9 + o.x)); }
        // the vault's columns: the amber orbs in their horns
        for (const p of X.props || []) if (p.kind === 'tgcolumn' && !p.broken && onScr(p.x, p.y - 2.8, 1.5)) { const Q2 = q(), px = X.sx(p.x), py = X.sy(p.y) - T * 2.9; Q2.glow(px, py, T * 0.8, AMBER, (p.v % 2 ? 0.16 : 0.32) + 0.06 * Math.sin(t * 1.5 + p.x)); }
        // the door: its crest's dark core breathing amber; the lintel's three studs lit as the skies are traced; the seam splitting; light pouring through; motes
        if (onScr(DOORX, DOORY - 2.5, 7)) { const Q2 = q(), tp = TP(), G = tp ? tp.GEO : { WO: 1.22, L0: 3.25, stud: [-0.72, 0, 0.72], studZ: 3.6, crestZ: 4.55, JD: 0.42 }, dx = X.sx(DOORX), Yf = X.sy(DOORY), o = ease(S.open), fa = S.fade, kk = 0.34 * (G.JD + 0.06);
          Q2.glow(dx, Yf - T * (G.crestZ - 0.05), T * 0.8, AMBER, (0.3 + 0.12 * Math.sin(t * 1.3)) * fa); Q2.glow(dx, Yf - T * (G.crestZ - 0.05), T * 0.18, '#FFE0A0', 0.6 * fa);
          for (let i = 0; i < 3; i++) { S.litK[i] += ((i < S.lit ? 1 : 0) - S.litK[i]) * Math.min(1, S.dt * 4); const k2 = S.litK[i]; if (k2 < 0.02) continue; const sx = dx + [G.stud[0], G.stud[2], G.stud[1]][i] * T, sy = Yf - T * (G.studZ - kk); Q2.glow(sx, sy, T * 0.55, GOLD, (0.5 + 0.2 * Math.sin(t * 3 + i)) * k2 * fa); Q2.star(sx, sy, T * 0.35, 0.8 * k2 * fa, '#FFFFFF'); }
          if (S.phase === 'opening' || o > 0.01) { const top = Yf - T * (G.L0 - kk), bot = Yf - T * 0.2, sp = clamp((S.openT - 0.8) / 1.0, 0, 1) * (1 - o * 0.6); if (sp > 0.01) { Q2.beam(dx, top, dx, bot, T * 0.14, '#FFFFFF', 0.9 * sp * fa); Q2.beam(dx, top, dx, bot, T * 0.6, DUSK, 0.5 * sp * fa); }
            if (o > 0.01) { const w = G.WO * T * o; Q2.glow(dx, (top + bot) / 2, T * (1.2 + 1.2 * o), '#FFE2B0', 0.5 * o * fa); Q2.quad(138, dx, bot + T * 1.2, w * 1.4 + T * 0.2, 0, 0, T * 2.2, '#FFE6C0', 0.42 * o * fa, 0.5, 4.4, lf ? 0 : 1);
              if (!lf) for (let i = 0; i < 6; i++) { const u = (t * 0.25 + i / 6) % 1; Q2.star(dx + Math.sin(i * 2.3 + t) * w * 0.8, top + (bot - top) * u, T * 0.06, 0.8 * Math.sin(u * Math.PI) * o * fa, '#FFF4D8'); } } } }
        // the court: the monoliths' glyphs aglow, debris glinting, the floating drums' pull, motes of gold rising, the sun's light slanting in
        if (!lf && onScr(AC.x, AC.y, ARX + 4)) { const Q2 = q();
          for (const m of MONO) { if (!onScr(m.x, m.y - 2, 2.5)) continue; const bob = Math.sin(t * 0.7 + m.ph) * 0.2, mx = X.sx(m.x), my = X.sy(m.y) - T * (m.lift + bob); Q2.glow(mx, my - T * 0.8 * m.s, T * 0.9 * m.s, AMBER, 0.22 + 0.08 * Math.sin(t * 1.3 + m.ph)); Q2.glow(mx, X.sy(m.y), T * 1.0 * m.s, '#FF9A40', 0.1, 0.4); }
          for (const p of X.props || []) if (p.kind === 'tgruin' && p.v === 3 && !p.broken && onScr(p.x, p.y - 2, 2)) Q2.glow(X.sx(p.x), X.sy(p.y) - T * 2.35, T * 0.7, AMBER, 0.35 + 0.1 * Math.sin(t * 1.9 + p.x));
          for (let i = 0; i < 12; i++) { const u = (t * 0.05 + i / 12) % 1, a = i * 2.39, rr = 0.2 + 0.7 * hh(i, 4), p = spt(a), mx = AC.x + p[0] * ARX * rr, my = AC.y + p[1] * ARY * rr; Q2.star(X.sx(mx) + Math.sin(t * 0.6 + i) * T * 0.3, X.sy(my) - T * u * 3.5, T * 0.07, 0.7 * Math.sin(u * Math.PI), '#FFE6B0'); }
          const mx2 = X.sx(AC.x - 2), my2 = X.sy(AC.y); Q2.shafts(mx2 - T * 6, my2 - T * 10, mx2 + T * 2, my2 + T * 2, T * 3.4, '#FFD9A0', 0.07, 2.2); Q2.shafts(mx2 - T * 2, my2 - T * 10, mx2 + T * 6, my2 + T * 4, T * 2.4, '#FFC890', 0.05, 5.1); }
        if (Q) F.flush(c); }
      // the puzzle's words over the stars (the same as ever): each star's count of lines, the dark star asleep, the bridge
      function labels(c) { if (!K) return; const T = X.Tz(); c.save(); c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)';
        for (const l of lines) if (K.bridge && l.i === K.bridge[0] && !R.used.has(l.i)) { const A = at(l.a), B = at(l.b), x = (X.sx(A.x) + X.sx(B.x)) / 2, y = (X.sy(A.y) + X.sy(B.y)) / 2 - 6; c.font = `800 ${Math.round(T * 0.24)}px ${arcFont}`; c.fillStyle = '#B98BE0'; c.strokeText('bridge', x, y); c.fillText('bridge', x, y); }
        stars.forEach((s, i) => { const Xs = X.sx(s.x), Ys = X.sy(s.y) - T * SL, r = T * (K.start === i ? 0.36 : 0.28), deg = degree(i); c.font = `800 ${Math.round(T * 0.22)}px ${arcFont}`; c.fillStyle = deg % 2 ? '#FFB3C8' : PALE; c.strokeText(`${deg}`, Xs, Ys - r - 6); c.fillText(`${deg}`, Xs, Ys - r - 6);
          if (!awake(i)) { c.fillStyle = '#B98BE0'; c.font = `800 ${Math.round(T * 0.2)}px ${arcFont}`; c.strokeText('asleep', Xs, Ys + r + T * 0.3); c.fillText('asleep', Xs, Ys + r + T * 0.3); } });
        c.restore(); }
      // without the GPU painter: the stars and lines as they were always drawn (2D), over the daises' floor
      function draw2D(c) { if (!K) return; const T = X.Tz();
        for (const l of lines) { const A = at(l.a), B = at(l.b), x0 = X.sx(A.x), y0 = X.sy(A.y) - T * 0.3, x1 = X.sx(B.x), y1 = X.sy(B.y) - T * 0.3, on = R.used.has(l.i), bridge = K.bridge && l.i === K.bridge[0];
          c.save(); if (on) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.strokeStyle = GOLD; c.lineWidth = T * 0.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.strokeStyle = GOLD; c.lineWidth = T * 0.1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = T * 0.03; c.stroke(); }
          else { c.strokeStyle = bridge ? '#B98BE0' : DIM; c.lineWidth = bridge ? 3 : 2; c.setLineDash([6, 8]); c.lineDashOffset = -R.t * 12; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); if (bridge) { c.setLineDash([]); c.font = `800 ${Math.round(T * 0.24)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#B98BE0'; c.strokeText('bridge', (x0 + x1) / 2, (y0 + y1) / 2 - 6); c.fillText('bridge', (x0 + x1) / 2, (y0 + y1) / 2 - 6); } }
          c.restore(); }
        stars.forEach((s, i) => { const Xs = X.sx(s.x), Ys = X.sy(s.y) - T * 0.3, isEnd = end() === i, inPath = R.path.includes(i), dark = !awake(i), bright = K.start === i, r = T * (bright ? 0.36 : 0.28), deg = degree(i);
          c.save(); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(Xs, X.sy(s.y) + T * 0.1, r, r * 0.4, 0, 0, TAU); c.fill();
          if (!dark) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = isEnd ? 0.8 + 0.2 * Math.sin(R.t * 6) : inPath ? 0.45 : 0.3; blitSized(c, glowSprite(bright && !inPath ? '#FFFFFF' : GOLD), Xs - r * 2.4, Ys - r * 2.4, r * 4.8, r * 4.8); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
          c.translate(Xs, Ys); c.rotate(R.t * (isEnd ? 1.2 : 0.3)); c.fillStyle = dark ? '#2A2050' : isEnd ? '#FFFFFF' : inPath ? GOLD : '#FFF4C0'; c.strokeStyle = dark ? '#5A4A90' : INK; c.lineWidth = 1.5; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); c.rotate(-R.t * (isEnd ? 1.2 : 0.3));
          c.font = `800 ${Math.round(T * 0.22)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = deg % 2 ? '#FFB3C8' : PALE; c.strokeText(`${deg}`, 0, -r - 6); c.fillText(`${deg}`, 0, -r - 6);
          if (dark) { c.fillStyle = '#B98BE0'; c.font = `800 ${Math.round(T * 0.2)}px ${arcFont}`; c.strokeText('asleep', 0, r + T * 0.3); c.fillText('asleep', 0, r + T * 0.3); }
          c.restore(); });
        const e = end(); if (e >= 0 && R.mode === 'play') { const s = stars[e], x0 = X.sx(s.x), y0 = X.sy(s.y) - T * 0.3, x1 = X.sx(me.x), y1 = X.sy(me.y) - T * 0.6; c.save(); c.globalAlpha = 0.5 + 0.2 * Math.sin(R.t * 5); c.strokeStyle = GOLD; c.lineWidth = 2; c.setLineDash([3, 5]); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - T * 0.5, x1, y1); c.stroke(); c.restore(); } }

      /* ---- the stage's turn ---- */
      function update(dt) { R.t += dt; S.t += dt; S.dt = dt; if (R.flashT > 0) R.flashT -= dt;
        { const tp = TP(); if (tp && !tp.base && tp.setBase) tp.setBase(X.Tz() / (g.zoom || 1) * Math.min(2, (typeof arc !== 'undefined' && arc.dpr) || 1)); }   // (no loading pass ran: the floor's sharpness, once)
        for (const o of starObjs) { const s = stars[o.i]; if (s) { o.x = s.x; o.y = s.y; o.used = o.used && Math.hypot(me.x - s.x, me.y - s.y) < 1.4; } else { o.x = -9; o.y = -9; } }
        if (S.phase === 'opening') { S.openT += dt; const u = S.openT;
          if (u > 0.8 && u - dt <= 0.8) { X.shake(4, 0.6); note(98, 2.6, 'sine', 0.32); note(49, 3.0, 'sine', 0.22); note(147, 1.6, 'sine', 0.12); }
          if (u > 1.8) S.open = clamp((u - 1.8) / 2.2, 0, 1);
          if (u > 1.8 && u - dt <= 1.8) { X.shake(7, 1.6); X.sfx.whoosh && X.sfx.whoosh(); }
          if (S.open > 0.75 && !S.passable) setDoor(true);
          if (u > 1.9 && !lowFx() && S.mist.length < 14 && Math.random() < dt * 6) S.mist.push({ x: DOORX + (Math.random() - 0.5) * 2.2, y: DOORY + 0.3, vx: (Math.random() - 0.5) * 0.9, vy: 0.9 + Math.random() * 0.8, r: 1.4 + Math.random() * 1.2, a: 0, life: 0, max: 4.5 + Math.random() * 2.5, dr: (Math.random() - 0.5) * 2, sd: Math.random() * 9 });
          if (u >= OPEN_T) opened(); }
        if (S.phase === 'open') { if (me.y < WALLY - 0.9 && Math.abs(me.x - DOORX) < 6 && !me.dead) seal(); else if (!lowFx() && S.mist.length < 8 && Math.random() < dt * 1.2) S.mist.push({ x: DOORX + (Math.random() - 0.5) * 2.2, y: DOORY + 0.3, vx: (Math.random() - 0.5) * 0.6, vy: 0.5 + Math.random() * 0.5, r: 1.2 + Math.random(), a: 0, life: 0, max: 5 + Math.random() * 2, dr: (Math.random() - 0.5) * 2, sd: Math.random() * 9 }); }
        if (S.phase === 'sealing') { S.sealT += dt; S.open = clamp(1 - S.sealT / SEAL_T, 0, 1); if (S.sealT >= SEAL_T) sealed(); }
        for (const m of S.mist) { m.life += dt; m.x += m.vx * dt; m.y += m.vy * dt; m.vy *= 1 - dt * 0.3; m.r += dt * 0.35; m.a = 0.45 * Math.sin(Math.min(1, m.life / m.max) * Math.PI); } for (let i = S.mist.length - 1; i >= 0; i--) if (S.mist[i].life >= S.mist[i].max) S.mist.splice(i, 1);
        // the door and the arch grow faint while something stands behind them
        const B = TB(), boss = g.boss && !g.boss.dead ? g.boss : null, behind = (x, y, w) => y < DOORY - 0.2 && y > DOORY - 5.8 && Math.abs(x - DOORX) < w, behindA = (x, y, w) => y < ARCH.y - 0.1 && y > ARCH.y - 7 && Math.abs(x - ARCH.x) < w;
        const hid = behind(me.x, me.y, 3.6) || (boss && behind(boss.x, boss.y, 3.6 + (boss.r || 1))); S.fade += ((hid ? 0.42 : 1) - S.fade) * Math.min(1, dt * 6);
        const hidA = behindA(me.x, me.y, 4) || (boss && behindA(boss.x, boss.y, 4 + (boss.r || 1))); S.archFade += ((hidA ? 0.42 : 1) - S.archFade) * Math.min(1, dt * 6);
        if (S.phase === 'boss' && B && typeof B.update === 'function') { try { B.update(dt); } catch (e) { if (typeof console !== 'undefined') console.error(e); } } }
      const doorHint = { x: DOORX, y: DOORY - 0.4, h: 4.6, label: 'The great door' };
      const mod = { R, S, SKIES, visit, undo, restart, load, get stars() { return stars; }, get lines() { return lines; }, end, door, arch, monos, lifted, piers, geo: { AC, ARX, ARY, SEN, WALLY, DOORX, DOORY, OX, OY, FC, BRAZ, HOLES }, update,
        hint() { if (S.phase === 'open') return doorHint; if (R.mode !== 'play') return null; const e = end(); if (e < 0) return K.start != null ? { x: stars[K.start].x, y: stars[K.start].y, kind: 'star', label: 'Begin here' } : null; return null; },
        goal: () => { if (S.phase === 'boss') { const B = TB(); return B && typeof B.goal === 'function' ? B.goal() : 'Face what waits in the Court of the World Pillar'; }
          if (S.phase === 'won' || self.done) return 'Taurus awakens'; if (S.phase === 'opening') return 'The great door opens…'; if (S.phase === 'open') return 'Walk through the great door'; if (S.phase === 'sealing') return 'The door seals behind you';
          return R.mode === 'intro' ? 'The Unbroken Constellation' : R.mode === 'won' ? 'The constellation holds' : `${K.name} · ${R.used.size}/${lines.length} lines traced${end() < 0 ? ' · stand by a star to begin' : ''}`; },
        cam() { if (S.phase === 'opening') return { x: DOORX, y: DOORY - 1.4, k: 0.9 }; if (S.phase === 'boss') { const B = TB(); if (B && typeof B.cam === 'function') { try { return B.cam(); } catch (e) {} } } return null; },
        hideHud() { const B = TB(); return S.phase === 'boss' && B && typeof B.hideHud === 'function' ? !!B.hideHud() : false; },
        onBossDeath(m) { const B = TB(); return S.phase === 'boss' && B && typeof B.onBossDeath === 'function' ? !!B.onBossDeath(m) : false; },
        drawGround(c) { if (fgx()) lightGround(c); else draw2D(c); const B = TB(); if (S.phase === 'boss' && B && typeof B.drawGround === 'function') { try { B.drawGround(c); } catch (e) {} } },
        drawOver(c) { const B = TB(); if (S.phase === 'boss' && B && typeof B.drawOver === 'function') { try { B.drawOver(c); } catch (e) {} }
          if (!K || self.done || R.mode === 'won') return; const W = X.W(), bw = Math.min(268, W - 130); c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; GFX.rr(c, 10, 124, bw, 40, 8); c.fill(); c.font = `800 10.5px ${arcFont}`; c.textAlign = 'left'; c.fillStyle = '#FFFFFF'; c.fillText('Trace every line once. Stars may be', 18, 139); c.fillText('revisited; a line may never be walked twice.', 18, 151); c.fillStyle = GOLD; c.fillText(`${K.name} · ${R.used.size} of ${lines.length} lines`, 18, 161); c.restore(); },
        leave() { if (R.el) { R.el.remove(); R.el = null; } },
        teardown };
      function teardown() { if (R.el) { R.el.remove(); R.el = null; } const B = TB(); if (B && typeof B.stop === 'function') { try { B.stop(); } catch (e) {} } if (CUR && CUR.S === S) CUR = null; S.mist.length = 0; }
      LIVE = mod;
      return mod;
    },
  });
  /* ---- letting go: when the dungeon game closes (its destroy) and whenever a new stage is made (BEL.releaseStale) the gate's
     boss is stopped, its buttons removed and every picture given back ---- */
  let LIVE = null;
  function release() { const m = LIVE; LIVE = null; CUR = null; if (m) { try { m.teardown(); } catch (e) {} } const tp = TP(); if (tp) { try { tp.release(); } catch (e) {} } }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { if (LIVE || CUR) release(); }); } catch (e) {}
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__tgRel) { const c0 = GD.create; GD.__tgRel = 1; GD.create = function () { const api = c0.apply(this, arguments); if (api && typeof api.destroy === 'function') { const d0 = api.destroy; api.destroy = function () { if (LIVE) release(); return d0.apply(this, arguments); }; } return api; }; } } catch (e) {}
  if (typeof window !== 'undefined') window.TAURUS_GATE = { get live() { return LIVE; }, release, LAYOUT, RUINS, MONO, HOLES, AC, ARX, ARY, SEN, WALLY, DOORX, DOORY, OX, OY, SKIES };
})();
